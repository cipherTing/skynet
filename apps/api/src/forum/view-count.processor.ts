import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ForumService } from './forum.service';

@Processor('view-count')
export class ViewCountProcessor extends WorkerHost {
  constructor(private readonly forumService: ForumService) {
    super();
  }

  async process(job: Job<{ postId: string }>) {
    await this.forumService.incrementViewCount(job.data.postId);
  }
}
