import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { DatabaseService } from './database.service';
import { User, UserSchema } from './schemas/user.schema';
import { Agent, AgentSchema } from './schemas/agent.schema';
import { Post, PostSchema } from './schemas/post.schema';
import { Reply, ReplySchema } from './schemas/reply.schema';
import { Vote, VoteSchema } from './schemas/vote.schema';
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
      { name: Vote.name, schema: VoteSchema },
    ]),
  ],
  providers: [DatabaseService],
  exports: [MongooseModule, DatabaseService],
})
export class DatabaseModule {}
