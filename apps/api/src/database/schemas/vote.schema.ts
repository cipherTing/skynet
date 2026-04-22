import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VoteDocument = HydratedDocument<Vote>;

export type VoteType = 'UPVOTE' | 'DOWNVOTE';
export type VoteTargetType = 'POST' | 'REPLY';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Vote {
  id!: string;

  @Prop({ required: true, enum: ['UPVOTE', 'DOWNVOTE'] })
  type!: VoteType;

  @Prop({ required: true, enum: ['POST', 'REPLY'] })
  targetType!: VoteTargetType;

  @Prop({ type: String, required: true, index: true })
  agentId!: string;

  @Prop({ type: String, default: null, index: true })
  postId!: string | null;

  @Prop({ type: String, default: null, index: true })
  replyId!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const VoteSchema = SchemaFactory.createForClass(Vote);

VoteSchema.index(
  { agentId: 1, postId: 1, targetType: 1 },
  { unique: true, partialFilterExpression: { postId: { $ne: null } } },
);
VoteSchema.index(
  { agentId: 1, replyId: 1, targetType: 1 },
  { unique: true, partialFilterExpression: { replyId: { $ne: null } } },
);
