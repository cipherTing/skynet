import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

const SOFT_DELETE_MODELS = ['user', 'agent', 'forumPost', 'forumReply'];

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClient;

  constructor() {
    const base = new PrismaClient();
    this.client = base.$extends({
      query: {
        $allModels: {
          async findMany({ model, operation, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model)) {
              args = args ?? {};
              args.where = args.where ?? {};
              if (!('deletedAt' in args.where)) {
                args.where = { ...args.where, deletedAt: null };
              }
            }
            return query(args);
          },
          async findFirst({ model, operation, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model)) {
              args = args ?? {};
              args.where = args.where ?? {};
              if (!('deletedAt' in args.where)) {
                args.where = { ...args.where, deletedAt: null };
              }
            }
            return query(args);
          },
          async findUnique({ model, operation, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model)) {
              args = args ?? {};
              args.where = args.where ?? {};
              if (!('deletedAt' in args.where)) {
                args.where = { ...args.where, deletedAt: null };
              }
            }
            return query(args);
          },
          async findFirstOrThrow({ model, operation, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model)) {
              args = args ?? {};
              args.where = args.where ?? {};
              if (!('deletedAt' in args.where)) {
                args.where = { ...args.where, deletedAt: null };
              }
            }
            return query(args);
          },
          async findUniqueOrThrow({ model, operation, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model)) {
              args = args ?? {};
              args.where = args.where ?? {};
              if (!('deletedAt' in args.where)) {
                args.where = { ...args.where, deletedAt: null };
              }
            }
            return query(args);
          },
          async aggregate({ model, operation, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model)) {
              args = args ?? {};
              args.where = args.where ?? {};
              if (!('deletedAt' in args.where)) {
                args.where = { ...args.where, deletedAt: null };
              }
            }
            return query(args);
          },
          async groupBy({ model, operation, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model)) {
              args = args ?? {};
              args.where = args.where ?? {};
              if (!('deletedAt' in args.where)) {
                args.where = { ...args.where, deletedAt: null };
              }
            }
            return query(args);
          },
          async delete({ model, operation, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model)) {
              throw new Error(
                `Model "${model}" uses soft delete. Use update({ deletedAt: new Date() }) instead of delete().`,
              );
            }
            return query(args);
          },
          async deleteMany({ model, operation, args, query }) {
            if (SOFT_DELETE_MODELS.includes(model)) {
              throw new Error(
                `Model "${model}" uses soft delete. Use updateMany({ deletedAt: new Date() }) instead of deleteMany().`,
              );
            }
            return query(args);
          },
        },
      },
    }) as unknown as PrismaClient;
  }

  get user() { return this.client.user; }
  get agent() { return this.client.agent; }
  get forumPost() { return this.client.forumPost; }
  get forumReply() { return this.client.forumReply; }
  get vote() { return this.client.vote; }

  $transaction<R>(fn: (prisma: PrismaClient) => Promise<R>): Promise<R>;
  $transaction<R extends readonly Promise<any>[]>(queries: readonly [...R]): Promise<{ [K in keyof R]: Awaited<R[K]> }>;
  $transaction<R>(
    arg: ((prisma: PrismaClient) => Promise<R>) | readonly Promise<any>[],
  ): Promise<any> {
    return this.client.$transaction(arg as any);
  }

  $executeRaw(...args: any[]) {
    return (this.client as any).$executeRaw(...args);
  }

  $queryRaw(...args: any[]) {
    return (this.client as any).$queryRaw(...args);
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
