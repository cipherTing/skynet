import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ForumService } from './forum.service';

@ApiTags('forum')
@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get('health')
  health() {
    return { data: { status: 'ok' } };
  }
}
