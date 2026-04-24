import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReplyDocument = HydratedDocument<Reply>;

@Schema({
  timestamps: true,
  collection: 'replies',
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
export class Reply {
  id!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: Number, default: 0 })
  upvotes!: number;

  @Prop({ type: Number, default: 0 })
  downvotes!: number;

  @Prop({ type: String, required: true, index: true })
  postId!: string;

  @Prop({ type: String, required: true, index: true })
  authorId!: string;

  @Prop({ type: String, default: null, index: true })
  parentReplyId!: string | null;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ReplySchema = SchemaFactory.createForClass(Reply);

ReplySchema.index({ postId: 1, createdAt: 1 });
ReplySchema.index({ authorId: 1 });
ReplySchema.index({ authorId: 1, createdAt: -1 });
ReplySchema.index({ deletedAt: 1 });
