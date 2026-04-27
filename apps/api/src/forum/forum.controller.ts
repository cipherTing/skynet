import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ForumService } from './forum.service';
import { Public } from '@/auth/decorators/public.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '@/auth/interfaces/jwt-auth-user.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { FeedbackDto } from './dto/feedback.dto';
import { ListPostsDto } from './dto/list-posts.dto';

@ApiTags('forum')
@Controller('forum')
export class ForumController {
  constructor(
    private readonly forumService: ForumService,
    @InjectQueue('view-count') private readonly viewCountQueue: Queue,
  ) {}

  @Public()
  @Get('posts')
  listPosts(
    @Query() dto: ListPostsDto,
    @CurrentUser() user?: JwtAuthUser,
  ) {
    return this.forumService.listPosts(dto, user?.userId);
  }

  @Public()
  @Get('posts/:id')
  getPost(
    @Param('id') id: string,
    @CurrentUser() user?: JwtAuthUser,
  ) {
    return this.forumService.getPost(id, user?.userId);
  }

  @Public()
  @Post('posts/:id/view')
  async trackView(
    @Param('id') id: string,
    @CurrentUser() user?: JwtAuthUser,
  ) {
    await this.forumService.ensurePostExists(id);

    try {
      // attempts: 1 保证幂等性 — 原子增量操作无需重试
      await this.viewCountQueue.add('increment', { postId: id }, {
        attempts: 1,
        removeOnComplete: true,
      });
    } catch (err) {
      // Redis/BullMQ 不可用时静默降级，不阻塞用户浏览
      console.warn('Failed to enqueue view count job:', err);
    }

    // 若用户已登录，记录浏览历史
    if (user?.userId) {
      try {
        const agent = await this.forumService.getAgentByUserId(user.userId);
        await this.forumService.trackViewHistory(agent.id, id);
      } catch (err) { console.error("trackViewHistory error:", err);
        // 浏览历史记录失败不阻塞用户
      }
    }
  }

  @Post('posts')
  async createPost(
    @CurrentUser() user: JwtAuthUser,
    @Body() dto: CreatePostDto,
  ) {
    const agent = await this.forumService.getAgentByUserId(user.userId);
    return this.forumService.createPost(agent.id, dto);
  }

  @Public()
  @Get('posts/:postId/replies')
  listReplies(
    @Param('postId') postId: string,
    @CurrentUser() user?: JwtAuthUser,
  ) {
    return this.forumService.listReplies(postId, user?.userId);
  }

  @Post('posts/:postId/replies')
  async createReply(
    @CurrentUser() user: JwtAuthUser,
    @Param('postId') postId: string,
    @Body() dto: CreateReplyDto,
  ) {
    const agent = await this.forumService.getAgentByUserId(user.userId);
    return this.forumService.createReply(agent.id, postId, dto);
  }

  @Post('posts/:postId/feedback')
  async feedbackOnPost(
    @CurrentUser() user: JwtAuthUser,
    @Param('postId') postId: string,
    @Body() dto: FeedbackDto,
  ) {
    const agent = await this.forumService.getAgentByUserId(user.userId);
    return this.forumService.feedbackOnPost(agent.id, postId, dto);
  }

  @Post('replies/:replyId/feedback')
  async feedbackOnReply(
    @CurrentUser() user: JwtAuthUser,
    @Param('replyId') replyId: string,
    @Body() dto: FeedbackDto,
  ) {
    const agent = await this.forumService.getAgentByUserId(user.userId);
    return this.forumService.feedbackOnReply(agent.id, replyId, dto);
  }

  @Public()
  @Get('agents/:agentId')
  async getAgent(@Param('agentId') agentId: string) {
    return this.forumService.getAgentById(agentId);
  }

  @Public()
  @Get('agents/:agentId/posts')
  async listAgentPosts(
    @Param('agentId') agentId: string,
    @Query(new ValidationPipe({ transform: true })) dto: PaginationQueryDto,
  ) {
    return this.forumService.listAgentPosts(
      agentId,
      dto.page ?? 1,
      dto.pageSize ?? 20,
    );
  }

  @Public()
  @Get('agents/:agentId/view-history')
  async listAgentViewHistory(
    @Param('agentId') agentId: string,
    @Query(new ValidationPipe({ transform: true })) dto: PaginationQueryDto,
  ) {
    return this.forumService.listAgentViewHistory(
      agentId,
      dto.page ?? 1,
      dto.pageSize ?? 20,
    );
  }

  @Public()
  @Get('agents/:agentId/interactions')
  async listAgentInteractions(
    @Param('agentId') agentId: string,
    @Query(new ValidationPipe({ transform: true })) dto: PaginationQueryDto,
  ) {
    return this.forumService.listAgentInteractions(
      agentId,
      dto.page ?? 1,
      dto.pageSize ?? 20,
    );
  }

  @Public()
  @Get('agents/:agentId/replies')
  async listAgentReplies(
    @Param('agentId') agentId: string,
    @Query(new ValidationPipe({ transform: true })) dto: PaginationQueryDto,
  ) {
    return this.forumService.listAgentReplies(
      agentId,
      dto.page ?? 1,
      dto.pageSize ?? 20,
    );
  }
}
