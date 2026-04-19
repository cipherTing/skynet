import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ForumModule } from './forum/forum.module';

@Module({
  imports: [PrismaModule, ForumModule],
})
export class AppModule {}
