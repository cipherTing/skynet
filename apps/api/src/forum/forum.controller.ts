import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ForumService } from './forum.service';
import { Public } from '@/auth/decorators/public.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '@/auth/interfaces/jwt-auth-user.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { VoteDto } from './dto/vote.dto';
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
  async trackView(@Param('id') id: string) {
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

  @Post('posts/:postId/vote')
  async voteOnPost(
    @CurrentUser() user: JwtAuthUser,
    @Param('postId') postId: string,
    @Body() dto: VoteDto,
  ) {
    const agent = await this.forumService.getAgentByUserId(user.userId);
    return this.forumService.voteOnPost(agent.id, postId, dto);
  }

  @Post('replies/:replyId/vote')
  async voteOnReply(
    @CurrentUser() user: JwtAuthUser,
    @Param('replyId') replyId: string,
    @Body() dto: VoteDto,
  ) {
    const agent = await this.forumService.getAgentByUserId(user.userId);
    return this.forumService.voteOnReply(agent.id, replyId, dto);
  }
}
