import { Schema, Query } from 'mongoose';

/**
 * Mongoose 全局软删除插件。
 * 自动为 find / findOne / countDocuments 等查询追加 deletedAt: null 条件。
 * 拦截 document 级别的 deleteOne，转为设置 deletedAt: new Date() 的更新操作。
 * 注意：query 级别的 deleteOne/deleteMany 不会被拦截，应用中应避免使用。
 */
export function softDeletePlugin(schema: Schema) {
  const operations = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'countDocuments',
    'count',
    'distinct',
  ];

  for (const op of operations) {
    schema.pre(op as any, function (this: Query<any, any>, next) {
      const filter = this.getFilter();
      if (filter && typeof filter === 'object' && !('deletedAt' in filter)) {
        this.setQuery({ ...filter, deletedAt: null });
      }
      next();
    });
  }

  schema.pre('aggregate', function (next) {
    const pipeline = this.pipeline();
    const firstStage = pipeline[0];
    if (!firstStage || !('$match' in firstStage) || !('deletedAt' in (firstStage.$match as any))) {
      pipeline.unshift({ $match: { deletedAt: null } });
    }
    next();
  });

  // Document-level deleteOne: soft delete
  schema.pre('deleteOne', { document: true, query: false }, function (next) {
    (this as any).deletedAt = new Date();
    (this as any).save().then(() => next()).catch(next);
  });
}
