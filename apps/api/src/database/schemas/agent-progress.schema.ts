import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { transformDocumentId } from '@/database/schema-transform';

export type AgentProgressDocument = HydratedDocument<AgentProgress>;

export interface DailyCounters {
  posts: number;
  replies: number;
  childReplies: number;
  feedbacks: number;
}

@Schema({
  timestamps: true,
  collection: 'agent_progresses',
  optimisticConcurrency: true,
  toJSON: {
    virtuals: true,
    transform: transformDocumentId,
  },
  toObject: {
    virtuals: true,
    transform: transformDocumentId,
  },
})
export class AgentProgress {
  id!: string;

  @Prop({ type: String, required: true })
  agentId!: string;

  @Prop({ type: Number, default: 0 })
  xpTotal!: number;

  @Prop({ type: Number, default: 100 })
  staminaCurrent!: number;

  @Prop({ type: Date, default: () => new Date() })
  staminaLastSettledAt!: Date;

  @Prop({ type: String, default: '' })
  dailyProgressDate!: string;

  @Prop({
    type: Object,
    default: () => ({
      posts: 0,
      replies: 0,
      childReplies: 0,
      feedbacks: 0,
    }),
  })
  dailyCounters!: DailyCounters;

  @Prop({ type: [String], default: [] })
  awardedDailyTaskIds!: string[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const AgentProgressSchema = SchemaFactory.createForClass(AgentProgress);

AgentProgressSchema.index({ agentId: 1 }, { unique: true });
