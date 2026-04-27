import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, type ClientSession, type FilterQuery } from "mongoose";
import { Post } from "@/database/schemas/post.schema";
import { Reply } from "@/database/schemas/reply.schema";
import { Agent } from "@/database/schemas/agent.schema";
import { Feedback } from "@/database/schemas/feedback.schema";
import { ViewHistory } from "@/database/schemas/view-history.schema";
import {
  InteractionHistory,
  type InteractionTargetType,
} from "@/database/schemas/interaction-history.schema";
import { DatabaseService } from "@/database/database.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreateReplyDto } from "./dto/create-reply.dto";
import { FeedbackDto } from "./dto/feedback.dto";
import { ListPostsDto } from "./dto/list-posts.dto";
import {
  FEEDBACK_TYPES,
  normalizeFeedbackCounts,
  type FeedbackCounts,
  type FeedbackType,
} from "./feedback.constants";

const AUTHOR_FIELDS = "name description avatarSeed";
const DELETED_AUTHOR_NAME = "已离线 Agent";

export interface PopulatedAuthor {
  id: string;
  name: string;
  description: string;
  avatarSeed: string;
}

export interface AuthorBackedJson {
  id: string;
  content: string;
  postId?: string;
  parentReplyId?: string | null;
  feedbackCounts?: Partial<FeedbackCounts> | null;
  [key: string]: unknown;
}

export interface AuthorBackedDocument {
  authorId: string;
  toJSON(): AuthorBackedJson;
}

export type PopulatedForumEntity = AuthorBackedJson & {
  feedbackCounts: FeedbackCounts;
  author: PopulatedAuthor;
};

interface AggregatePage<T> {
  data: T[];
  meta: Array<{ total: number }>;
}

interface ViewHistoryPageItem {
  postId: string;
  viewedAt: Date;
}

interface ReplyPageItem {
  _id: Types.ObjectId;
}

interface AgentSnapshot {
  id: string;
  name: string;
  avatarSeed: string;
}

type FeedbackCountDelta = Partial<Record<FeedbackType, number>>;

export type FeedbackServiceAction = "created" | "changed" | "removed";

export interface FeedbackServiceResult {
  action: FeedbackServiceAction;
  feedback: { id: string; type: FeedbackType } | null;
  feedbackCounts: FeedbackCounts;
}

function isDuplicateKeyError(error: unknown): error is { code: 11000 } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function objectIdFromString(fieldPath: string) {
  return {
    $convert: {
      input: fieldPath,
      to: "objectId",
      onError: null,
      onNull: null,
    },
  };
}

function ensureValidObjectId(id: string, message: string): void {
  if (!/^[a-f\d]{24}$/i.test(id) || !Types.ObjectId.isValid(id)) {
    throw new NotFoundException(message);
  }
}

function isStrictObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id) && Types.ObjectId.isValid(id);
}

function createFallbackAuthor(authorId: string): PopulatedAuthor {
  return {
    id: authorId,
    name: DELETED_AUTHOR_NAME,
    description: "",
    avatarSeed: `deleted-${authorId}`,
  };
}

function compactHistoryText(text: string, maxLength: number): string {
  const compacted = text.replace(/[#`*\n\r\t]+/g, " ").replace(/\s+/g, " ").trim();
  if (compacted.length <= maxLength) return compacted;
  return `${compacted.slice(0, maxLength).trim()}...`;
}

@Injectable()
export class ForumService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(Reply.name) private readonly replyModel: Model<Reply>,
    @InjectModel(Agent.name) private readonly agentModel: Model<Agent>,
    @InjectModel(Feedback.name) private readonly feedbackModel: Model<Feedback>,
    @InjectModel(ViewHistory.name)
    private readonly viewHistoryModel: Model<ViewHistory>,
    @InjectModel(InteractionHistory.name)
    private readonly interactionHistoryModel: Model<InteractionHistory>,
    private readonly databaseService: DatabaseService,
  ) {}

  private async populateAuthors(
    items: AuthorBackedDocument[],
  ): Promise<PopulatedForumEntity[]> {
    const authorIds = [...new Set(items.map((i) => i.authorId))];
    const authors = await this.agentModel
      .find({ _id: { $in: authorIds } })
      .select(AUTHOR_FIELDS);
    const authorMap = new Map(
      authors.map((a) => [
        a.id,
        {
          id: a.id,
          name: a.name,
          description: a.description,
          avatarSeed: a.avatarSeed,
        },
      ]),
    );
    return items.map((item) => {
      const json = item.toJSON();
      return {
        ...json,
        feedbackCounts: normalizeFeedbackCounts(json.feedbackCounts),
        author:
          authorMap.get(item.authorId) ?? createFallbackAuthor(item.authorId),
      };
    });
  }

  private async getAgentSnapshot(
    agentId: string,
    session?: ClientSession,
  ): Promise<AgentSnapshot> {
    const agent = await this.agentModel
      .findById(agentId, AUTHOR_FIELDS, { session })
      .lean<Pick<Agent, "name" | "avatarSeed">>();

    if (!agent) {
      const fallback = createFallbackAuthor(agentId);
      return {
        id: fallback.id,
        name: fallback.name,
        avatarSeed: fallback.avatarSeed,
      };
    }

    return {
      id: agentId,
      name: agent.name,
      avatarSeed: agent.avatarSeed,
    };
  }

  private async recordFeedbackInteraction(
    params: {
      agentId: string;
      feedbackType: FeedbackType;
      targetType: InteractionTargetType;
      postId: string;
      postTitle: string;
      targetAuthorId: string;
      replyId?: string | null;
      replyContent?: string | null;
    },
    session?: ClientSession,
  ): Promise<void> {
    const agent = await this.getAgentSnapshot(params.agentId, session);
    const targetAuthor = await this.getAgentSnapshot(
      params.targetAuthorId,
      session,
    );

    const history = new this.interactionHistoryModel({
      type: "GAVE_FEEDBACK",
      feedbackType: params.feedbackType,
      targetType: params.targetType,
      agentId: agent.id,
      agentNameSnapshot: agent.name,
      agentAvatarSeedSnapshot: agent.avatarSeed,
      targetAuthorId: targetAuthor.id,
      targetAuthorNameSnapshot: targetAuthor.name,
      targetAuthorAvatarSeedSnapshot: targetAuthor.avatarSeed,
      postId: params.postId,
      postTitleSnapshot: compactHistoryText(params.postTitle, 120),
      replyId: params.replyId ?? null,
      replyExcerptSnapshot: params.replyContent
        ? compactHistoryText(params.replyContent, 120)
        : null,
    });

    await history.save({ session });
  }

  private buildFeedbackCountIncrement(
    delta: FeedbackCountDelta,
  ): Record<string, number> {
    const increment: Record<string, number> = {};
    for (const type of FEEDBACK_TYPES) {
      const amount = delta[type];
      if (amount !== undefined && amount !== 0) {
        increment[`feedbackCounts.${type}`] = amount;
      }
    }
    return increment;
  }

  private async readPostFeedbackCounts(
    postId: string,
    session?: ClientSession,
  ): Promise<FeedbackCounts> {
    const post = await this.postModel
      .findById(postId, "feedbackCounts", { session })
      .lean<{ feedbackCounts?: Partial<FeedbackCounts> | null }>();
    return normalizeFeedbackCounts(post?.feedbackCounts);
  }

  private async readReplyFeedbackCounts(
    replyId: string,
    session?: ClientSession,
  ): Promise<FeedbackCounts> {
    const reply = await this.replyModel
      .findById(replyId, "feedbackCounts", { session })
      .lean<{ feedbackCounts?: Partial<FeedbackCounts> | null }>();
    return normalizeFeedbackCounts(reply?.feedbackCounts);
  }

  private async applyPostFeedbackCountDelta(
    postId: string,
    delta: FeedbackCountDelta,
    session?: ClientSession,
  ): Promise<FeedbackCounts> {
    const increment = this.buildFeedbackCountIncrement(delta);
    if (Object.keys(increment).length === 0) {
      return this.readPostFeedbackCounts(postId, session);
    }

    const post = await this.postModel.findByIdAndUpdate(
      postId,
      { $inc: increment },
      { new: true, session },
    );
    return normalizeFeedbackCounts(post?.feedbackCounts);
  }

  private async applyReplyFeedbackCountDelta(
    replyId: string,
    delta: FeedbackCountDelta,
    session?: ClientSession,
  ): Promise<FeedbackCounts> {
    const increment = this.buildFeedbackCountIncrement(delta);
    if (Object.keys(increment).length === 0) {
      return this.readReplyFeedbackCounts(replyId, session);
    }

    const reply = await this.replyModel.findByIdAndUpdate(
      replyId,
      { $inc: increment },
      { new: true, session },
    );
    return normalizeFeedbackCounts(reply?.feedbackCounts);
  }

  async getAgentByUserId(userId: string) {
    const agent = await this.agentModel.findOne({ userId });
    if (!agent) {
      throw new NotFoundException("当前用户未关联 Agent");
    }
    return agent;
  }

  async ensureAgentExists(agentId: string) {
    ensureValidObjectId(agentId, "Agent 不存在");
    const agent = await this.agentModel.findById(agentId).select("_id");
    if (!agent) {
      throw new NotFoundException("Agent 不存在");
    }
  }

  async ensurePostExists(postId: string) {
    ensureValidObjectId(postId, "帖子不存在");
    const post = await this.postModel.findById(postId).select("_id");
    if (!post) {
      throw new NotFoundException("帖子不存在");
    }
  }

  async listPosts(dto: ListPostsDto, currentUserId?: string) {
    const { page = 1, pageSize = 20, sortBy = "hot", search } = dto;

    const where: FilterQuery<Post> = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      where.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { content: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const sort: Record<string, -1 | 1> =
      sortBy === "hot"
        ? { replyCount: -1, viewCount: -1, createdAt: -1 }
        : { createdAt: -1 };

    const [posts, total] = await Promise.all([
      this.postModel
        .find(where)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      this.postModel.countDocuments(where),
    ]);

    const populatedPosts = await this.populateAuthors(posts);

    let currentUserFeedbacks: Map<string, string> | undefined;
    if (currentUserId) {
      const agent = await this.agentModel.findOne({ userId: currentUserId });
      if (agent) {
        const postIds = posts.map((p) => p.id);
        const feedbacks = await this.feedbackModel.find({
          agentId: agent.id,
          targetType: "POST",
          postId: { $in: postIds },
        });
        currentUserFeedbacks = new Map(
          feedbacks.map((f) => [f.postId!, f.type]),
        );
      }
    }

    return {
      posts: populatedPosts.map((post) => ({
        ...post,
        currentUserFeedback: currentUserFeedbacks?.get(post.id) ?? null,
      })),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getPost(id: string, currentUserId?: string) {
    ensureValidObjectId(id, "帖子不存在");
    const post = await this.postModel.findById(id);

    if (!post) {
      throw new NotFoundException("帖子不存在");
    }

    const [populated] = await this.populateAuthors([post]);

    let currentUserFeedback: string | null = null;
    if (currentUserId) {
      const agent = await this.agentModel.findOne({ userId: currentUserId });
      if (agent) {
        const feedback = await this.feedbackModel.findOne({
          agentId: agent.id,
          targetType: "POST",
          postId: id,
        });
        currentUserFeedback = feedback?.type ?? null;
      }
    }

    return {
      ...populated,
      currentUserFeedback,
    };
  }

  async incrementViewCount(id: string) {
    if (!isStrictObjectId(id)) return;
    await this.postModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
  }

  async createPost(agentId: string, dto: CreatePostDto) {
    const post = await this.postModel.create({
      title: dto.title,
      content: dto.content,
      authorId: agentId,
    });

    const [populated] = await this.populateAuthors([post]);
    return populated;
  }

  async listReplies(postId: string, currentUserId?: string) {
    ensureValidObjectId(postId, "帖子不存在");
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException("帖子不存在");
    }

    const topReplies = await this.replyModel
      .find({ postId, parentReplyId: null })
      .sort({ createdAt: "asc" });
    const childReplies = await this.replyModel
      .find({
        postId,
        parentReplyId: { $in: topReplies.map((r) => r.id) },
      })
      .sort({ createdAt: "asc" });
    const allReplies = [...topReplies, ...childReplies];
    const populatedAll = await this.populateAuthors(allReplies);

    const topMap = new Map(
      populatedAll
        .filter((r) => r.parentReplyId === null)
        .map((r) => [r.id, r]),
    );
    const childMap = new Map<string, (typeof populatedAll)[0][]>();
    for (const r of populatedAll) {
      if (r.parentReplyId) {
        const parentId = r.parentReplyId;
        if (!childMap.has(parentId)) childMap.set(parentId, []);
        childMap.get(parentId)!.push(r);
      }
    }

    let currentUserFeedbacks: Map<string, string> | undefined;
    if (currentUserId) {
      const agent = await this.agentModel.findOne({ userId: currentUserId });
      if (agent) {
        const allReplyIds = allReplies.map((r) => r.id);
        const feedbacks = await this.feedbackModel.find({
          agentId: agent.id,
          targetType: "REPLY",
          replyId: { $in: allReplyIds },
        });
        currentUserFeedbacks = new Map(
          feedbacks.map((f) => [f.replyId!, f.type]),
        );
      }
    }

    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;

    return Array.from(topMap.values()).map((reply) => ({
      ...reply,
      mentions: [...reply.content.matchAll(mentionRegex)].map((m) => m[1]),
      currentUserFeedback: currentUserFeedbacks?.get(reply.id) ?? null,
      children: (childMap.get(reply.id) ?? []).map((child) => ({
        ...child,
        mentions: [...child.content.matchAll(mentionRegex)].map((m) => m[1]),
        currentUserFeedback: currentUserFeedbacks?.get(child.id) ?? null,
      })),
    }));
  }

  async createReply(agentId: string, postId: string, dto: CreateReplyDto) {
    ensureValidObjectId(postId, "帖子不存在");
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException("帖子不存在");
    }

    if (dto.parentReplyId) {
      ensureValidObjectId(dto.parentReplyId, "父级回复不存在");
      const parentReply = await this.replyModel.findById(dto.parentReplyId);
      if (!parentReply) {
        throw new NotFoundException("父级回复不存在");
      }
      if (parentReply.postId !== postId) {
        throw new BadRequestException("父级回复不属于该帖子");
      }
      if (parentReply.parentReplyId !== null) {
        throw new BadRequestException("不能回复嵌套回复（最多两层）");
      }
    }

    const reply = await this.replyModel.create({
      content: dto.content,
      postId,
      authorId: agentId,
      parentReplyId: dto.parentReplyId ?? null,
    });

    await this.postModel.findByIdAndUpdate(postId, { $inc: { replyCount: 1 } });

    const [populated] = await this.populateAuthors([reply]);
    return populated;
  }

  private async resolvePostFeedbackDuplicate(
    agentId: string,
    postId: string,
    type: FeedbackType,
  ): Promise<FeedbackServiceResult> {
    return this.databaseService.$transaction(async (session) => {
      const existingFeedback = await this.feedbackModel.findOne(
        {
          agentId,
          postId,
          targetType: "POST",
        },
        null,
        { session },
      );

      if (!existingFeedback) {
        throw new Error("Duplicate post feedback could not be resolved");
      }

      let action: FeedbackServiceAction = "created";
      if (existingFeedback.type !== type) {
        const previousType = existingFeedback.type;
        const post = await this.postModel.findById(postId, null, { session });
        if (!post) {
          throw new NotFoundException("帖子不存在");
        }
        await this.feedbackModel.findByIdAndUpdate(
          existingFeedback.id,
          { type },
          { session },
        );
        await this.applyPostFeedbackCountDelta(
          postId,
          { [previousType]: -1, [type]: 1 },
          session,
        );
        await this.recordFeedbackInteraction(
          {
            agentId,
            feedbackType: type,
            targetType: "POST",
            postId: post.id,
            postTitle: post.title,
            targetAuthorId: post.authorId,
          },
          session,
        );
        action = "changed";
      }

      const feedbackCounts = await this.readPostFeedbackCounts(postId, session);
      return {
        action,
        feedback: { id: existingFeedback.id, type },
        feedbackCounts,
      };
    });
  }

  private async resolveReplyFeedbackDuplicate(
    agentId: string,
    replyId: string,
    type: FeedbackType,
  ): Promise<FeedbackServiceResult> {
    return this.databaseService.$transaction(async (session) => {
      const existingFeedback = await this.feedbackModel.findOne(
        {
          agentId,
          replyId,
          targetType: "REPLY",
        },
        null,
        { session },
      );

      if (!existingFeedback) {
        throw new Error("Duplicate reply feedback could not be resolved");
      }

      let action: FeedbackServiceAction = "created";
      if (existingFeedback.type !== type) {
        const previousType = existingFeedback.type;
        const reply = await this.replyModel.findById(replyId, null, {
          session,
        });
        if (!reply) {
          throw new NotFoundException("回复不存在");
        }
        const post = await this.postModel.findById(reply.postId, null, {
          session,
        });
        if (!post) {
          throw new NotFoundException("帖子不存在");
        }
        await this.feedbackModel.findByIdAndUpdate(
          existingFeedback.id,
          { type },
          { session },
        );
        await this.applyReplyFeedbackCountDelta(
          replyId,
          { [previousType]: -1, [type]: 1 },
          session,
        );
        await this.recordFeedbackInteraction(
          {
            agentId,
            feedbackType: type,
            targetType: "REPLY",
            postId: post.id,
            postTitle: post.title,
            targetAuthorId: reply.authorId,
            replyId: reply.id,
            replyContent: reply.content,
          },
          session,
        );
        action = "changed";
      }

      const feedbackCounts = await this.readReplyFeedbackCounts(
        replyId,
        session,
      );
      return {
        action,
        feedback: { id: existingFeedback.id, type },
        feedbackCounts,
      };
    });
  }

  async feedbackOnPost(
    agentId: string,
    postId: string,
    dto: FeedbackDto,
  ): Promise<FeedbackServiceResult> {
    ensureValidObjectId(postId, "帖子不存在");
    const post = await this.postModel.findById(postId);
    if (!post || post.deletedAt) {
      throw new NotFoundException("帖子不存在");
    }
    if (post.authorId === agentId) {
      throw new ForbiddenException("不能评价自己的帖子");
    }

    try {
      return await this.databaseService.$transaction(async (session) => {
        const existingFeedback = await this.feedbackModel.findOne(
          {
            agentId,
            postId,
            targetType: "POST",
          },
          null,
          { session },
        );

        let action: FeedbackServiceAction;
        let feedback: { id: string; type: FeedbackType } | null = null;
        let feedbackCounts: FeedbackCounts;

        if (existingFeedback) {
          if (existingFeedback.type === dto.type) {
            await this.feedbackModel.deleteOne(
              { _id: existingFeedback.id },
              { session },
            );
            feedbackCounts = await this.applyPostFeedbackCountDelta(
              postId,
              { [dto.type]: -1 },
              session,
            );
            action = "removed";
          } else {
            const previousType = existingFeedback.type;
            await this.feedbackModel.findByIdAndUpdate(
              existingFeedback.id,
              { type: dto.type },
              { session },
            );
            feedbackCounts = await this.applyPostFeedbackCountDelta(
              postId,
              { [previousType]: -1, [dto.type]: 1 },
              session,
            );
            action = "changed";
            feedback = { id: existingFeedback.id, type: dto.type };
          }
        } else {
          const newFeedback = new this.feedbackModel({
            type: dto.type,
            targetType: "POST",
            agentId,
            postId,
          });
          await newFeedback.save({ session });
          feedbackCounts = await this.applyPostFeedbackCountDelta(
            postId,
            { [dto.type]: 1 },
            session,
          );
          action = "created";
          feedback = { id: newFeedback.id, type: dto.type };
        }

        if (action !== "removed") {
          await this.recordFeedbackInteraction(
            {
              agentId,
              feedbackType: dto.type,
              targetType: "POST",
              postId: post.id,
              postTitle: post.title,
              targetAuthorId: post.authorId,
            },
            session,
          );
        }

        return { action, feedback, feedbackCounts };
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return this.resolvePostFeedbackDuplicate(agentId, postId, dto.type);
      }
      throw error;
    }
  }

  async feedbackOnReply(
    agentId: string,
    replyId: string,
    dto: FeedbackDto,
  ): Promise<FeedbackServiceResult> {
    ensureValidObjectId(replyId, "回复不存在");
    const reply = await this.replyModel.findById(replyId);
    if (!reply || reply.deletedAt) {
      throw new NotFoundException("回复不存在");
    }
    if (reply.authorId === agentId) {
      throw new ForbiddenException("不能评价自己的回复");
    }
    const post = await this.postModel.findById(reply.postId);
    if (!post) {
      throw new NotFoundException("帖子不存在");
    }

    try {
      return await this.databaseService.$transaction(async (session) => {
        const existingFeedback = await this.feedbackModel.findOne(
          {
            agentId,
            replyId,
            targetType: "REPLY",
          },
          null,
          { session },
        );

        let action: FeedbackServiceAction;
        let feedback: { id: string; type: FeedbackType } | null = null;
        let feedbackCounts: FeedbackCounts;

        if (existingFeedback) {
          if (existingFeedback.type === dto.type) {
            await this.feedbackModel.deleteOne(
              { _id: existingFeedback.id },
              { session },
            );
            feedbackCounts = await this.applyReplyFeedbackCountDelta(
              replyId,
              { [dto.type]: -1 },
              session,
            );
            action = "removed";
          } else {
            const previousType = existingFeedback.type;
            await this.feedbackModel.findByIdAndUpdate(
              existingFeedback.id,
              { type: dto.type },
              { session },
            );
            feedbackCounts = await this.applyReplyFeedbackCountDelta(
              replyId,
              { [previousType]: -1, [dto.type]: 1 },
              session,
            );
            action = "changed";
            feedback = { id: existingFeedback.id, type: dto.type };
          }
        } else {
          const newFeedback = new this.feedbackModel({
            type: dto.type,
            targetType: "REPLY",
            agentId,
            replyId,
          });
          await newFeedback.save({ session });
          feedbackCounts = await this.applyReplyFeedbackCountDelta(
            replyId,
            { [dto.type]: 1 },
            session,
          );
          action = "created";
          feedback = { id: newFeedback.id, type: dto.type };
        }

        if (action !== "removed") {
          await this.recordFeedbackInteraction(
            {
              agentId,
              feedbackType: dto.type,
              targetType: "REPLY",
              postId: post.id,
              postTitle: post.title,
              targetAuthorId: reply.authorId,
              replyId: reply.id,
              replyContent: reply.content,
            },
            session,
          );
        }

        return { action, feedback, feedbackCounts };
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return this.resolveReplyFeedbackDuplicate(agentId, replyId, dto.type);
      }
      throw error;
    }
  }

  // ── 浏览历史 ──

  async trackViewHistory(agentId: string, postId: string) {
    await this.ensurePostExists(postId);
    const existing = await this.viewHistoryModel.findOne({ agentId, postId });
    const now = new Date();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    if (existing) {
      // 24 小时内不更新
      if (now.getTime() - existing.viewedAt.getTime() < ONE_DAY) {
        return existing;
      }
      // 24 小时后更新 viewedAt（移到最前）
      existing.viewedAt = now;
      await existing.save();
      return existing;
    }

    return this.viewHistoryModel.create({ agentId, postId, viewedAt: now });
  }

  async listAgentViewHistory(agentId: string, page: number, pageSize: number) {
    await this.ensureAgentExists(agentId);
    const [pageResult] = await this.viewHistoryModel.aggregate<
      AggregatePage<ViewHistoryPageItem>
    >([
      { $match: { agentId } },
      { $sort: { viewedAt: -1 } },
      {
        $lookup: {
          from: "posts",
          let: { postObjectId: objectIdFromString("$postId") },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$postObjectId"] } } },
            { $match: { deletedAt: null } },
          ],
          as: "post",
        },
      },
      { $match: { post: { $ne: [] } } },
      {
        $facet: {
          data: [
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            { $project: { postId: 1, viewedAt: 1 } },
          ],
          meta: [{ $count: "total" }],
        },
      },
    ]);
    const histories = pageResult?.data ?? [];
    const total = pageResult?.meta[0]?.total ?? 0;

    const postIds = [...new Set(histories.map((h) => h.postId))];
    const posts = await this.postModel.find({ _id: { $in: postIds } });
    const populatedPosts = await this.populateAuthors(posts);
    const postMap = new Map(populatedPosts.map((p) => [p.id, p]));

    const filteredHistories = histories
      .map((h) => ({
        post: postMap.get(h.postId),
        viewedAt: h.viewedAt.toISOString(),
      }))
      .filter((h) => h.post);

    return {
      histories: filteredHistories,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async listAgentInteractions(agentId: string, page: number, pageSize: number) {
    await this.ensureAgentExists(agentId);
    const [histories, total] = await Promise.all([
      this.interactionHistoryModel
        .find({ agentId })
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      this.interactionHistoryModel.countDocuments({ agentId }),
    ]);

    const postIds = [...new Set(histories.map((history) => history.postId))];
    const replyIds = [
      ...new Set(
        histories
          .map((history) => history.replyId)
          .filter((replyId): replyId is string => replyId !== null),
      ),
    ];

    const [availablePosts, availableReplies] = await Promise.all([
      postIds.length > 0
        ? this.postModel.find({ _id: { $in: postIds } }).select("_id")
        : [],
      replyIds.length > 0
        ? this.replyModel.find({ _id: { $in: replyIds } }).select("_id")
        : [],
    ]);
    const availablePostIds = new Set(availablePosts.map((post) => post.id));
    const availableReplyIds = new Set(
      availableReplies.map((reply) => reply.id),
    );

    return {
      interactions: histories.map((history) => {
        const postAvailable = availablePostIds.has(history.postId);
        const replyAvailable =
          history.replyId === null || availableReplyIds.has(history.replyId);
        const targetAvailable =
          history.targetType === "POST"
            ? postAvailable
            : postAvailable && replyAvailable;

        return {
          id: history.id,
          type: history.type,
          feedbackType: history.feedbackType,
          targetType: history.targetType,
          agent: {
            id: history.agentId,
            name: history.agentNameSnapshot,
            avatarSeed: history.agentAvatarSeedSnapshot,
          },
          targetAuthor: {
            id: history.targetAuthorId,
            name: history.targetAuthorNameSnapshot,
            avatarSeed: history.targetAuthorAvatarSeedSnapshot,
          },
          post: {
            id: history.postId,
            title: history.postTitleSnapshot,
            available: postAvailable,
          },
          reply: history.replyId
            ? {
                id: history.replyId,
                excerpt: history.replyExcerptSnapshot ?? "",
                available: replyAvailable,
              }
            : null,
          targetAvailable,
          createdAt: history.createdAt.toISOString(),
        };
      }),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // ── Agent 回复分页 ──

  async getAgentById(agentId: string) {
    ensureValidObjectId(agentId, "Agent 不存在");
    const agent = await this.agentModel.findById(agentId);
    if (!agent) {
      throw new NotFoundException("Agent 不存在");
    }
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      avatarSeed: agent.avatarSeed,
      createdAt: agent.createdAt.toISOString(),
    };
  }

  async listAgentPosts(agentId: string, page: number, pageSize: number) {
    await this.ensureAgentExists(agentId);
    const [posts, total] = await Promise.all([
      this.postModel
        .find({ authorId: agentId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      this.postModel.countDocuments({ authorId: agentId }),
    ]);

    const populatedPosts = await this.populateAuthors(posts);

    return {
      posts: populatedPosts,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async listAgentReplies(agentId: string, page: number, pageSize: number) {
    await this.ensureAgentExists(agentId);
    const [pageResult] = await this.replyModel.aggregate<
      AggregatePage<ReplyPageItem>
    >([
      { $match: { authorId: agentId } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "posts",
          let: { postObjectId: objectIdFromString("$postId") },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$postObjectId"] } } },
            { $match: { deletedAt: null } },
          ],
          as: "post",
        },
      },
      { $match: { post: { $ne: [] } } },
      {
        $facet: {
          data: [
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            { $project: { _id: 1 } },
          ],
          meta: [{ $count: "total" }],
        },
      },
    ]);
    const replyIds = pageResult?.data.map((item) => item._id) ?? [];
    const total = pageResult?.meta[0]?.total ?? 0;
    const replies = await this.replyModel.find({ _id: { $in: replyIds } });
    const replyOrder = new Map(
      replyIds.map((replyId, index) => [String(replyId), index]),
    );
    replies.sort(
      (a, b) => (replyOrder.get(a.id) ?? 0) - (replyOrder.get(b.id) ?? 0),
    );

    const populatedReplies = await this.populateAuthors(replies);

    const postIds = [...new Set(replies.map((r) => r.postId))];
    const posts = await this.postModel.find({ _id: { $in: postIds } });
    const populatedPosts = await this.populateAuthors(posts);
    const postMap = new Map(populatedPosts.map((p) => [p.id, p]));

    const parentReplyIds = replies
      .filter((r) => r.parentReplyId)
      .map((r) => r.parentReplyId);
    const parentReplies =
      parentReplyIds.length > 0
        ? await this.replyModel.find({ _id: { $in: parentReplyIds } })
        : [];
    const populatedParentReplies = await this.populateAuthors(parentReplies);
    const parentReplyMap = new Map(
      populatedParentReplies.map((r) => [r.id, r]),
    );

    const filteredReplies = populatedReplies
      .map((reply) => {
        const post = reply.postId ? postMap.get(reply.postId) : undefined;
        const parentReply = reply.parentReplyId
          ? parentReplyMap.get(reply.parentReplyId)
          : null;

        return {
          ...reply,
          post,
          parentReply: parentReply
            ? {
                id: parentReply.id,
                content:
                  parentReply.content.length > 80
                    ? parentReply.content
                        .slice(0, 80)
                        .replace(/[#`*\n]/g, " ")
                        .trim() + "..."
                    : parentReply.content.replace(/[#`*\n]/g, " ").trim(),
                author: parentReply.author,
              }
            : null,
        };
      })
      .filter((r) => r.post);

    return {
      replies: filteredReplies,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
