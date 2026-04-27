import { Schema, type PipelineStage, type Query } from "mongoose";

type SoftDeleteDocument = {
  deletedAt?: Date | null;
};
type SoftDeleteQuery = Query<unknown, SoftDeleteDocument>;
type SoftDeleteAggregate = {
  pipeline(): PipelineStage[];
};
type SoftDeleteFilter = Record<string, unknown>;
type MiddlewareNext = (error?: Error) => void;

const hardDeleteError = new Error(
  "Hard delete is disabled for soft-delete schemas; set deletedAt instead.",
);

function isSoftDeleteFilter(value: unknown): value is SoftDeleteFilter {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function andClausesContainDeletedAt(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.some(
      (clause) =>
        isSoftDeleteFilter(clause) && filterHasDeletedAtCondition(clause),
    )
  );
}

function filterHasDeletedAtCondition(filter: SoftDeleteFilter): boolean {
  return "deletedAt" in filter || andClausesContainDeletedAt(filter.$and);
}

function hasDeletedAtMatch(stage: PipelineStage | undefined): boolean {
  if (stage === undefined || !("$match" in stage)) {
    return false;
  }

  const match = stage.$match;
  return isSoftDeleteFilter(match) && filterHasDeletedAtCondition(match);
}

function stageReplacesRootDocument(stage: PipelineStage): boolean {
  return (
    "$group" in stage ||
    "$project" in stage ||
    "$replaceRoot" in stage ||
    "$replaceWith" in stage ||
    "$facet" in stage
  );
}

function pipelineHasRootDeletedAtMatch(pipeline: PipelineStage[]): boolean {
  for (const stage of pipeline) {
    if (hasDeletedAtMatch(stage)) {
      return true;
    }
    if (stageReplacesRootDocument(stage)) {
      return false;
    }
  }
  return false;
}

function hasUnsupportedSearchStage(stage: PipelineStage | undefined): boolean {
  return (
    stage !== undefined &&
    isSoftDeleteFilter(stage) &&
    ("$searchMeta" in stage || "$vectorSearch" in stage)
  );
}

function firstStageMustStayFirst(stage: PipelineStage | undefined): boolean {
  return stage !== undefined && ("$geoNear" in stage || "$search" in stage);
}

/**
 * Mongoose 全局软删除插件。
 * 自动为 find / findOne / countDocuments 等查询追加 deletedAt: null 条件。
 * 阻断 deleteOne/deleteMany，避免带 deletedAt 的模型被硬删除。
 */
export function softDeletePlugin(schema: Schema) {
  if (!schema.path("deletedAt")) {
    return;
  }

  schema.pre(
    /^(find|findOne|findOneAndUpdate|findOneAndReplace|count|countDocuments|distinct)$/,
    function (this: SoftDeleteQuery, next: () => void) {
      const filter = this.getFilter();
      if (filter && typeof filter === "object" && !("deletedAt" in filter)) {
        this.setQuery({ ...filter, deletedAt: null });
      }
      next();
    },
  );

  schema.pre(
    "aggregate",
    function (this: SoftDeleteAggregate, next: MiddlewareNext) {
      const pipeline = this.pipeline();
      const firstStage = pipeline[0];
      if (hasUnsupportedSearchStage(firstStage)) {
        next(
          new Error(
            "Soft delete plugin cannot safely inject deletedAt filtering into $searchMeta or $vectorSearch pipelines; add explicit search-stage filtering instead.",
          ),
        );
        return;
      }

      if (!pipelineHasRootDeletedAtMatch(pipeline)) {
        const matchDeletedAt = { $match: { deletedAt: null } };
        if (firstStageMustStayFirst(firstStage)) {
          pipeline.splice(1, 0, matchDeletedAt);
        } else {
          pipeline.unshift(matchDeletedAt);
        }
      }
      next();
    },
  );

  schema.pre(
    "deleteOne",
    { query: true, document: false },
    function (next: MiddlewareNext) {
      next(hardDeleteError);
    },
  );

  schema.pre(
    /^(deleteMany|findOneAndDelete|findOneAndRemove)$/,
    function (next: MiddlewareNext) {
      next(hardDeleteError);
    },
  );

  schema.pre(
    "deleteOne",
    { document: true, query: false },
    function (next: MiddlewareNext) {
      next(hardDeleteError);
    },
  );
}
