import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, type ClientSession } from "mongoose";

interface ReplicaSetStatus {
  setName?: string;
}

interface ErrorLabelProvider {
  hasErrorLabel(label: string): boolean;
}

function isReplicaSetStatus(value: unknown): value is ReplicaSetStatus {
  return value !== null && typeof value === "object";
}

function hasErrorLabelProvider(value: unknown): value is ErrorLabelProvider {
  return (
    value !== null &&
    typeof value === "object" &&
    "hasErrorLabel" in value &&
    typeof value.hasErrorLabel === "function"
  );
}

function hasMongoErrorLabel(error: unknown, label: string): boolean {
  return hasErrorLabelProvider(error) && error.hasErrorLabel(label);
}

function isTransientTransactionError(error: unknown): boolean {
  if (hasMongoErrorLabel(error, "TransientTransactionError")) return true;
  return (
    error instanceof Error &&
    /WriteConflict|TransientTransactionError/.test(error.message)
  );
}

function isUnknownTransactionCommitResult(error: unknown): boolean {
  return hasMongoErrorLabel(error, "UnknownTransactionCommitResult");
}

@Injectable()
export class DatabaseService {
  private fallbackTransactionQueue: Promise<void> = Promise.resolve();

  constructor(@InjectConnection() public readonly connection: Connection) {}

  private async runWithoutReplicaSet<T>(
    fn: (session?: ClientSession) => Promise<T>,
  ): Promise<T> {
    const previous = this.fallbackTransactionQueue;
    let releaseQueue: () => void = () => {};
    this.fallbackTransactionQueue = new Promise<void>((resolve) => {
      releaseQueue = resolve;
    });

    await previous;
    try {
      return await fn(undefined);
    } finally {
      releaseQueue();
    }
  }

  private async commitTransaction(session: ClientSession): Promise<void> {
    const maxCommitAttempts = 3;
    for (let attempt = 1; attempt <= maxCommitAttempts; attempt += 1) {
      try {
        await session.commitTransaction();
        return;
      } catch (error) {
        if (
          attempt < maxCommitAttempts &&
          isUnknownTransactionCommitResult(error)
        ) {
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * 兼容性事务方法。
   * 如果 MongoDB 配置为副本集，使用 session 执行事务。
   * 否则，串行执行操作（开发环境降级）。
   */
  async $transaction<T>(
    fn: (session?: ClientSession) => Promise<T>,
  ): Promise<T> {
    if (this.connection.readyState !== 1) {
      throw new Error("MongoDB connection is not ready");
    }
    const database = this.connection.db;
    if (!database) {
      throw new Error("MongoDB database handle is not ready");
    }

    let isReplicaSet = false;
    try {
      const status = await database.admin().command({ hello: 1 });
      isReplicaSet =
        isReplicaSetStatus(status) && typeof status.setName === "string";
    } catch (error) {
      throw new Error("Failed to inspect MongoDB transaction support", {
        cause: error,
      });
    }

    if (isReplicaSet) {
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const session = await this.connection.startSession();
        try {
          session.startTransaction();
          const result = await fn(session);
          await this.commitTransaction(session);
          return result;
        } catch (error) {
          if (session.inTransaction()) {
            await session.abortTransaction();
          }
          if (attempt < maxAttempts && isTransientTransactionError(error)) {
            continue;
          }
          throw error;
        } finally {
          session.endSession();
        }
      }
    }

    // Fallback: serial execution without transaction
    return this.runWithoutReplicaSet(fn);
  }
}
