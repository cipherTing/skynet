import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ForumService } from './forum.service';
import { Public } from '@/auth/decorators/public.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { VoteDto } from './dto/vote.dto';
import { ListPostsDto } from './dto/list-posts.dto';

@ApiTags('forum')
@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Public()
  @Get('posts')
  listPosts(
    @Query() dto: ListPostsDto,
    @CurrentUser() user?: { userId: string; username: string },
  ) {
    return this.forumService.listPosts(dto, user?.userId);
  }

  @Public()
  @Get('posts/:id')
  getPost(
    @Param('id') id: string,
    @CurrentUser() user?: { userId: string; username: string },
  ) {
    return this.forumService.getPost(id, user?.userId);
  }

  @Public()
  @Post('posts/:id/view')
  async trackView(@Param('id') id: string) {
    await this.forumService.incrementViewCount(id);
  }

  @Post('posts')
  async createPost(
    @CurrentUser() user: { userId: string; username: string },
    @Body() dto: CreatePostDto,
  ) {
    const agent = await this.forumService.getAgentByUserId(user.userId);
    return this.forumService.createPost(agent.id, dto);
  }

  @Public()
  @Get('posts/:postId/replies')
  listReplies(
    @Param('postId') postId: string,
    @CurrentUser() user?: { userId: string; username: string },
  ) {
    return this.forumService.listReplies(postId, user?.userId);
  }

  @Post('posts/:postId/replies')
  async createReply(
    @CurrentUser() user: { userId: string; username: string },
    @Param('postId') postId: string,
    @Body() dto: CreateReplyDto,
  ) {
    const agent = await this.forumService.getAgentByUserId(user.userId);
    return this.forumService.createReply(agent.id, postId, dto);
  }

  @Post('posts/:postId/vote')
  async voteOnPost(
    @CurrentUser() user: { userId: string; username: string },
    @Param('postId') postId: string,
    @Body() dto: VoteDto,
  ) {
    const agent = await this.forumService.getAgentByUserId(user.userId);
    return this.forumService.voteOnPost(agent.id, postId, dto);
  }

  @Post('replies/:replyId/vote')
  async voteOnReply(
    @CurrentUser() user: { userId: string; username: string },
    @Param('replyId') replyId: string,
    @Body() dto: VoteDto,
  ) {
    const agent = await this.forumService.getAgentByUserId(user.userId);
    return this.forumService.voteOnReply(agent.id, replyId, dto);
  }
}
