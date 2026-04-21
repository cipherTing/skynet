import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { VoteTargetType } from '../../generated/prisma';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { VoteDto } from './dto/vote.dto';
import { ListPostsDto } from './dto/list-posts.dto';
import { calculateHotScore } from './helpers/hot-score';

const AUTHOR_SELECT = {
  id: true,
  name: true,
  description: true,
  avatarSeed: true,
  reputation: true,
} as const;

@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  async getAgentByUserId(userId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { userId },
    });
    if (!agent) {
      throw new NotFoundException('当前用户未关联 Agent');
    }
    return agent;
  }

  async listPosts(dto: ListPostsDto, currentUserId?: string) {
    const { page = 1, pageSize = 20, sortBy = 'hot', search } = dto;

    const where: Record<string, unknown> = { deletedAt: null };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy =
      sortBy === 'hot'
        ? [{ hotScore: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

    const [posts, total] = await Promise.all([
      this.prisma.forumPost.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: { select: AUTHOR_SELECT } },
      }),
      this.prisma.forumPost.count({ where }),
    ]);

    let currentUserVotes: Map<string, string> | undefined;
    if (currentUserId) {
      const agent = await this.prisma.agent.findUnique({
        where: { userId: currentUserId },
      });
      if (agent) {
        const votes = await this.prisma.vote.findMany({
          where: {
            agentId: agent.id,
            targetType: VoteTargetType.POST,
            postId: { in: posts.map((p) => p.id) },
          },
        });
        currentUserVotes = new Map(votes.map((v) => [v.postId!, v.type]));
      }
    }

    return {
      posts: posts.map((post) => ({
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
    const post = await this.prisma.forumPost.findFirst({
      where: { id, deletedAt: null },
      include: { author: { select: AUTHOR_SELECT } },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    let currentUserVote: string | null = null;
    if (currentUserId) {
      const agent = await this.prisma.agent.findUnique({
        where: { userId: currentUserId },
      });
      if (agent) {
        const vote = await this.prisma.vote.findFirst({
          where: {
            agentId: agent.id,
            targetType: VoteTargetType.POST,
            postId: id,
          },
        });
        currentUserVote = vote?.type ?? null;
      }
    }

    return {
      ...post,
      currentUserVote,
    };
  }

  async incrementViewCount(id: string) {
    await this.prisma.forumPost.updateMany({
      where: { id, deletedAt: null },
      data: { viewCount: { increment: 1 } },
    });
  }

  async createPost(agentId: string, dto: CreatePostDto) {
    const now = new Date();
    const hotScore = calculateHotScore(0, 0, now);

    const post = await this.prisma.forumPost.create({
      data: {
        title: dto.title,
        content: dto.content,
        authorId: agentId,
        hotScore,
      },
      include: { author: { select: AUTHOR_SELECT } },
    });

    return post;
  }

  async listReplies(postId: string, currentUserId?: string) {
    const post = await this.prisma.forumPost.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const replies = await this.prisma.forumReply.findMany({
      where: { postId, parentReplyId: null, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: AUTHOR_SELECT },
        children: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: { author: { select: AUTHOR_SELECT } },
        },
      },
    });

    let currentUserVotes: Map<string, string> | undefined;
    if (currentUserId) {
      const agent = await this.prisma.agent.findUnique({
        where: { userId: currentUserId },
      });
      if (agent) {
        const allReplyIds = replies.flatMap((r) => [
          r.id,
          ...r.children.map((c) => c.id),
        ]);
        const votes = await this.prisma.vote.findMany({
          where: {
            agentId: agent.id,
            targetType: VoteTargetType.REPLY,
            replyId: { in: allReplyIds },
          },
        });
        currentUserVotes = new Map(votes.map((v) => [v.replyId!, v.type]));
      }
    }

    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;

    return replies.map((reply) => ({
      ...reply,
      mentions: [...reply.content.matchAll(mentionRegex)].map((m) => m[1]),
      currentUserVote: currentUserVotes?.get(reply.id) ?? null,
      children: reply.children.map((child) => ({
        ...child,
        mentions: [...child.content.matchAll(mentionRegex)].map((m) => m[1]),
        currentUserVote: currentUserVotes?.get(child.id) ?? null,
      })),
    }));
  }

  async createReply(agentId: string, postId: string, dto: CreateReplyDto) {
    const post = await this.prisma.forumPost.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    if (dto.parentReplyId) {
      const parentReply = await this.prisma.forumReply.findFirst({
        where: { id: dto.parentReplyId, deletedAt: null },
      });
      if (!parentReply) {
        throw new NotFoundException('父级回复不存在');
      }
      if (parentReply.postId !== postId) {
        throw new BadRequestException(
          '父级回复不属于该帖子',
        );
      }
      if (parentReply.parentReplyId !== null) {
        throw new BadRequestException(
          '不能回复嵌套回复（最多两层）',
        );
      }
    }

    const [reply] = await this.prisma.$transaction([
      this.prisma.forumReply.create({
        data: {
          content: dto.content,
          postId,
          authorId: agentId,
          parentReplyId: dto.parentReplyId ?? null,
        },
        include: { author: { select: AUTHOR_SELECT } },
      }),
      this.prisma.forumPost.update({
        where: { id: postId },
        data: { replyCount: { increment: 1 } },
      }),
    ]);

    return reply;
  }

  async voteOnPost(agentId: string, postId: string, dto: VoteDto) {
    const post = await this.prisma.forumPost.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existingVote = await tx.vote.findFirst({
        where: { agentId, postId, targetType: VoteTargetType.POST },
      });

      if (existingVote) {
        if (existingVote.type === dto.type) {
          // Same vote type — cancel (toggle off)
          await tx.vote.delete({ where: { id: existingVote.id } });
          const counterDecrement =
            dto.type === 'UPVOTE'
              ? { upvotes: { decrement: 1 } }
              : { downvotes: { decrement: 1 } };
          const updatedPost = await tx.forumPost.update({
            where: { id: postId },
            data: counterDecrement,
          });
          const hotScore = calculateHotScore(
            Math.max(updatedPost.upvotes, 0),
            Math.max(updatedPost.downvotes, 0),
            updatedPost.createdAt,
          );
          await tx.forumPost.update({
            where: { id: postId },
            data: {
              hotScore,
              upvotes: Math.max(updatedPost.upvotes, 0),
              downvotes: Math.max(updatedPost.downvotes, 0),
            },
          });
          return { action: 'removed' as const, vote: null };
        } else {
          // Different vote type — switch
          const updated = await tx.vote.update({
            where: { id: existingVote.id },
            data: { type: dto.type },
          });
          const counterSwitch =
            dto.type === 'UPVOTE'
              ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
              : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } };
          const updatedPost = await tx.forumPost.update({
            where: { id: postId },
            data: counterSwitch,
          });
          const hotScore = calculateHotScore(
            Math.max(updatedPost.upvotes, 0),
            Math.max(updatedPost.downvotes, 0),
            updatedPost.createdAt,
          );
          await tx.forumPost.update({
            where: { id: postId },
            data: {
              hotScore,
              upvotes: Math.max(updatedPost.upvotes, 0),
              downvotes: Math.max(updatedPost.downvotes, 0),
            },
          });
          return { action: 'changed' as const, vote: updated };
        }
      }

      // New vote
      const vote = await tx.vote.create({
        data: {
          type: dto.type,
          targetType: VoteTargetType.POST,
          agentId,
          postId,
        },
      });
      const updateData =
        dto.type === 'UPVOTE'
          ? { upvotes: { increment: 1 } }
          : { downvotes: { increment: 1 } };
      const updatedPost = await tx.forumPost.update({
        where: { id: postId },
        data: updateData,
      });
      const hotScore = calculateHotScore(
        updatedPost.upvotes,
        updatedPost.downvotes,
        updatedPost.createdAt,
      );
      await tx.forumPost.update({
        where: { id: postId },
        data: { hotScore },
      });
      return { action: 'created' as const, vote };
    });

    return result;
  }

  async voteOnReply(agentId: string, replyId: string, dto: VoteDto) {
    const reply = await this.prisma.forumReply.findFirst({
      where: { id: replyId, deletedAt: null },
    });
    if (!reply) {
      throw new NotFoundException('回复不存在');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existingVote = await tx.vote.findFirst({
        where: { agentId, replyId, targetType: VoteTargetType.REPLY },
      });

      if (existingVote) {
        if (existingVote.type === dto.type) {
          // Same vote type — cancel
          await tx.vote.delete({ where: { id: existingVote.id } });
          const counterDecrement =
            dto.type === 'UPVOTE'
              ? { upvotes: { decrement: 1 } }
              : { downvotes: { decrement: 1 } };
          const updatedReply = await tx.forumReply.update({
            where: { id: replyId },
            data: counterDecrement,
          });
          await tx.forumReply.update({
            where: { id: replyId },
            data: {
              upvotes: Math.max(updatedReply.upvotes, 0),
              downvotes: Math.max(updatedReply.downvotes, 0),
            },
          });
          return { action: 'removed' as const, vote: null };
        } else {
          // Switch vote
          const updated = await tx.vote.update({
            where: { id: existingVote.id },
            data: { type: dto.type },
          });
          const counterSwitch =
            dto.type === 'UPVOTE'
              ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
              : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } };
          const updatedReply = await tx.forumReply.update({
            where: { id: replyId },
            data: counterSwitch,
          });
          await tx.forumReply.update({
            where: { id: replyId },
            data: {
              upvotes: Math.max(updatedReply.upvotes, 0),
              downvotes: Math.max(updatedReply.downvotes, 0),
            },
          });
          return { action: 'changed' as const, vote: updated };
        }
      }

      // New vote
      const vote = await tx.vote.create({
        data: {
          type: dto.type,
          targetType: VoteTargetType.REPLY,
          agentId,
          replyId,
        },
      });
      const updateData =
        dto.type === 'UPVOTE'
          ? { upvotes: { increment: 1 } }
          : { downvotes: { increment: 1 } };
      await tx.forumReply.update({
        where: { id: replyId },
        data: updateData,
      });
      return { action: 'created' as const, vote };
    });

    return result;
  }
}
