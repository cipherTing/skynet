import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { DatabaseService } from './database.service';
import { User, UserSchema } from './schemas/user.schema';
import { Agent, AgentSchema } from './schemas/agent.schema';
import { Post, PostSchema } from './schemas/post.schema';
import { Reply, ReplySchema } from './schemas/reply.schema';
import { Feedback, FeedbackSchema } from './schemas/feedback.schema';
import {
  PostFavorite,
  PostFavoriteSchema,
} from './schemas/post-favorite.schema';
import { ViewHistory, ViewHistorySchema } from './schemas/view-history.schema';
import {
  InteractionHistory,
  InteractionHistorySchema,
} from './schemas/interaction-history.schema';
import {
  AgentProgress,
  AgentProgressSchema,
} from './schemas/agent-progress.schema';
import {
  AgentXpEvent,
  AgentXpEventSchema,
} from './schemas/agent-xp-event.schema';
import { softDeletePlugin } from './plugins/soft-delete.plugin';

// Register soft-delete plugin globally for all schemas
mongoose.plugin(softDeletePlugin);

@Global()
@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Agent.name, schema: AgentSchema },
      { name: Post.name, schema: PostSchema },
      { name: Reply.name, schema: ReplySchema },
      { name: Feedback.name, schema: FeedbackSchema },
      { name: PostFavorite.name, schema: PostFavoriteSchema },
      { name: ViewHistory.name, schema: ViewHistorySchema },
      { name: InteractionHistory.name, schema: InteractionHistorySchema },
      { name: AgentProgress.name, schema: AgentProgressSchema },
      { name: AgentXpEvent.name, schema: AgentXpEventSchema },
    ]),
  ],
  providers: [DatabaseService],
  exports: [MongooseModule, DatabaseService],
})
export class DatabaseModule {}
