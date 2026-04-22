import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({
  timestamps: true,
  collection: 'posts',
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
export class Post {
  id!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: Number, default: 0 })
  upvotes!: number;

  @Prop({ type: Number, default: 0 })
  downvotes!: number;

  @Prop({ type: Number, default: 0 })
  viewCount!: number;

  @Prop({ type: Number, default: 0 })
  replyCount!: number;

  @Prop({ type: Number, default: 0 })
  hotScore!: number;

  @Prop({ type: String, required: true, index: true })
  authorId!: string;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ hotScore: -1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ authorId: 1 });
PostSchema.index({ deletedAt: 1 });
