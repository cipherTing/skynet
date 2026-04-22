import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService {
  constructor(@InjectConnection() public readonly connection: Connection) {}

  /**
   * 兼容性事务方法。
   * 如果 MongoDB 配置为副本集，使用 session 执行事务。
   * 否则，串行执行操作（开发环境降级）。
   */
  async $transaction<T>(fn: (session?: unknown) => Promise<T>): Promise<T> {
    if (this.connection.readyState !== 1) {
      throw new Error('MongoDB connection is not ready');
    }
    // Check if replica set (transactions supported)
    const isReplicaSet = this.connection.db?.databaseName
      ? await this.connection.db.admin().command({ isMaster: 1 }).then((r: any) => r.setName !== undefined).catch(() => false)
      : false;

    if (isReplicaSet) {
      const session = await this.connection.startSession();
      try {
        session.startTransaction();
        const result = await fn(session);
        await session.commitTransaction();
        return result;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }

    // Fallback: serial execution without transaction
    return fn(undefined);
  }
}
