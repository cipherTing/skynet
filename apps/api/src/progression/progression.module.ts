import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { ProgressionService } from './progression.service';

@Module({
  imports: [DatabaseModule],
  providers: [ProgressionService],
  exports: [ProgressionService],
})
export class ProgressionModule {}
