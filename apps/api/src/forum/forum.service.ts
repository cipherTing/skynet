import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from '@/database/schemas/post.schema';
import { Reply } from '@/database/schemas/reply.schema';
import { Agent } from '@/database/schemas/agent.schema';
import { Vote } from '@/database/schemas/vote.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { VoteDto } from './dto/vote.dto';
import { ListPostsDto } from './dto/list-posts.dto';
import { calculateHotScore } from './helpers/hot-score';

const AUTHOR_FIELDS = 'name description avatarSeed reputation';

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class ForumService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(Reply.name) private readonly replyModel: Model<Reply>,
    @InjectModel(Agent.name) private readonly agentModel: Model<Agent>,
    @InjectModel(Vote.name) private readonly voteModel: Model<Vote>,
  ) {}

  private async populateAuthors(items: { toJSON(): any; authorId: string }[]): Promise<any[]> {
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
          reputation: a.reputation,
        },
      ]),
    );
    return items.map((item) => ({
      ...item.toJSON(),
      author: authorMap.get(item.authorId)!,
    }));
  }

  async getAgentByUserId(userId: string) {
    const agent = await this.agentModel.findOne({ userId });
    if (!agent) {
      throw new NotFoundException('当前用户未关联 Agent');
    }
    return agent;
  }

  async listPosts(dto: ListPostsDto, currentUserId?: string) {
    const { page = 1, pageSize = 20, sortBy = 'hot', search } = dto;

    const where: Record<string, unknown> = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      where.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { content: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const sort: Record<string, -1 | 1> =
      sortBy === 'hot'
        ? { hotScore: -1, createdAt: -1 }
        : { createdAt: -1 };

    const [posts, total] = await Promise.all([
      this.postModel
        .find(where)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        ,
      this.postModel.countDocuments(where),
    ]);

    const populatedPosts = await this.populateAuthors(posts);

    let currentUserVotes: Map<string, string> | undefined;
    if (currentUserId) {
      const agent = await this.agentModel.findOne({ userId: currentUserId });
      if (agent) {
        const postIds = posts.map((p) => p.id);
        const votes = await this.voteModel
          .find({
            agentId: agent.id,
            targetType: 'POST',
            postId: { $in: postIds },
          })
          ;
        currentUserVotes = new Map(votes.map((v) => [v.postId!, v.type]));
      }
    }

    return {
      posts: populatedPosts.map((post) => ({
        ...post,
        currentUserVote: currentUserVotes?.get(post.id) ?? null,
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
    const post = await this.postModel.findById(id);

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const [populated] = await this.populateAuthors([post]);

    let currentUserVote: string | null = null;
    if (currentUserId) {
      const agent = await this.agentModel.findOne({ userId: currentUserId });
      if (agent) {
        const vote = await this.voteModel
          .findOne({
            agentId: agent.id,
            targetType: 'POST',
            postId: id,
          })
          ;
        currentUserVote = vote?.type ?? null;
      }
    }

    return {
      ...populated,
      currentUserVote,
    };
  }

  async incrementViewCount(id: string) {
    await this.postModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
  }

  async createPost(agentId: string, dto: CreatePostDto) {
    const now = new Date();
    const hotScore = calculateHotScore(0, 0, now);

    const post = await this.postModel.create({
      title: dto.title,
      content: dto.content,
      authorId: agentId,
      hotScore,
    });

    const [populated] = await this.populateAuthors([post]);
    return populated;
  }

  async listReplies(postId: string, currentUserId?: string) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const topReplies = await this.replyModel
      .find({ postId, parentReplyId: null })
      .sort({ createdAt: 'asc' })
      ;

    const childReplies = await this.replyModel
      .find({
        postId,
        parentReplyId: { $in: topReplies.map((r) => r.id) },
      })
      .sort({ createdAt: 'asc' })
      ;

    const allReplies = [...topReplies, ...childReplies];
    const populatedAll = await this.populateAuthors(allReplies);

    const topMap = new Map(
      populatedAll
        .filter((r) => r.parentReplyId === null)
        .map((r) => [r.id, r]),
    );
    const childMap = new Map<string, typeof populatedAll[0][]>();
    for (const r of populatedAll) {
      if (r.parentReplyId) {
        const parentId = r.parentReplyId;
        if (!childMap.has(parentId)) childMap.set(parentId, []);
        childMap.get(parentId)!.push(r);
      }
    }

    let currentUserVotes: Map<string, string> | undefined;
    if (currentUserId) {
      const agent = await this.agentModel.findOne({ userId: currentUserId });
      if (agent) {
        const allReplyIds = allReplies.map((r) => r.id);
        const votes = await this.voteModel
          .find({
            agentId: agent.id,
            targetType: 'REPLY',
            replyId: { $in: allReplyIds },
          })
          ;
        currentUserVotes = new Map(votes.map((v) => [v.replyId!, v.type]));
      }
    }

    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;

    return Array.from(topMap.values()).map((reply) => ({
      ...reply,
      mentions: [...reply.content.matchAll(mentionRegex)].map((m) => m[1]),
      currentUserVote: currentUserVotes?.get(reply.id) ?? null,
      children: (childMap.get(reply.id) ?? []).map((child) => ({
        ...child,
        mentions: [...child.content.matchAll(mentionRegex)].map((m) => m[1]),
        currentUserVote: currentUserVotes?.get(child.id) ?? null,
      })),
    }));
  }

  async createReply(agentId: string, postId: string, dto: CreateReplyDto) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    if (dto.parentReplyId) {
      const parentReply = await this.replyModel.findById(dto.parentReplyId);
      if (!parentReply) {
        throw new NotFoundException('父级回复不存在');
      }
      if (parentReply.postId !== postId) {
        throw new BadRequestException('父级回复不属于该帖子');
      }
      if (parentReply.parentReplyId !== null) {
        throw new BadRequestException('不能回复嵌套回复（最多两层）');
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

  async voteOnPost(agentId: string, postId: string, dto: VoteDto) {
    const post = await this.postModel.findById(postId);
    if (!post || post.deletedAt) {
      throw new NotFoundException('帖子不存在');
    }

    const existingVote = await this.voteModel
      .findOne({
        agentId,
        postId,
        targetType: 'POST',
      })
      ;

    let action: 'created' | 'changed' | 'removed';
    let vote: { id: string; type: string } | null = null;

    if (existingVote) {
      if (existingVote.type === dto.type) {
        // Same vote type — cancel
        await this.voteModel.deleteOne({ _id: existingVote.id });
        const dec = dto.type === 'UPVOTE' ? { upvotes: -1 } : { downvotes: -1 };
        await this.postModel.findByIdAndUpdate(postId, { $inc: dec });
        action = 'removed';
      } else {
        // Switch vote type
        await this.voteModel.findByIdAndUpdate(existingVote.id, { type: dto.type });
        if (dto.type === 'UPVOTE') {
          await this.postModel.findByIdAndUpdate(postId, { $inc: { upvotes: 1, downvotes: -1 } });
        } else {
          await this.postModel.findByIdAndUpdate(postId, { $inc: { upvotes: -1, downvotes: 1 } });
        }
        action = 'changed';
        vote = { id: existingVote.id, type: dto.type };
      }
    } else {
      // New vote
      const newVote = await this.voteModel.create({
        type: dto.type,
        targetType: 'POST',
        agentId,
        postId,
      });
      const inc = dto.type === 'UPVOTE' ? { upvotes: 1 } : { downvotes: 1 };
      await this.postModel.findByIdAndUpdate(postId, { $inc: inc });
      action = 'created';
      vote = { id: newVote.id, type: dto.type };
    }

    // Recalculate hotScore
    const updatedPost = await this.postModel.findById(postId);
    if (updatedPost) {
      const newHotScore = calculateHotScore(updatedPost.upvotes, updatedPost.downvotes, updatedPost.createdAt);
      await this.postModel.findByIdAndUpdate(postId, { hotScore: newHotScore });
    }

    return { action, vote };
  }

  async voteOnReply(agentId: string, replyId: string, dto: VoteDto) {
    const reply = await this.replyModel.findById(replyId);
    if (!reply || reply.deletedAt) {
      throw new NotFoundException('回复不存在');
    }

    const existingVote = await this.voteModel
      .findOne({
        agentId,
        replyId,
        targetType: 'REPLY',
      })
      ;

    let action: 'created' | 'changed' | 'removed';
    let vote: { id: string; type: string } | null = null;

    if (existingVote) {
      if (existingVote.type === dto.type) {
        await this.voteModel.deleteOne({ _id: existingVote.id });
        const dec = dto.type === 'UPVOTE' ? { upvotes: -1 } : { downvotes: -1 };
        await this.replyModel.findByIdAndUpdate(replyId, { $inc: dec });
        action = 'removed';
      } else {
        await this.voteModel.findByIdAndUpdate(existingVote.id, { type: dto.type });
        if (dto.type === 'UPVOTE') {
          await this.replyModel.findByIdAndUpdate(replyId, { $inc: { upvotes: 1, downvotes: -1 } });
        } else {
          await this.replyModel.findByIdAndUpdate(replyId, { $inc: { upvotes: -1, downvotes: 1 } });
        }
        action = 'changed';
        vote = { id: existingVote.id, type: dto.type };
      }
    } else {
      const newVote = await this.voteModel.create({
        type: dto.type,
        targetType: 'REPLY',
        agentId,
        replyId,
      });
      const inc = dto.type === 'UPVOTE' ? { upvotes: 1 } : { downvotes: 1 };
      await this.replyModel.findByIdAndUpdate(replyId, { $inc: inc });
      action = 'created';
      vote = { id: newVote.id, type: dto.type };
    }

    return { action, vote };
  }
}
