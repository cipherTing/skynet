import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { transformDocumentId } from '@/database/schema-transform';

export type PostFavoriteDocument = HydratedDocument<PostFavorite>;

@Schema({
  timestamps: true,
  collection: 'post_favorites',
  toJSON: {
    virtuals: true,
    transform: transformDocumentId,
  },
  toObject: {
    virtuals: true,
    transform: transformDocumentId,
  },
})
export class PostFavorite {
  id!: string;

  @Prop({ required: true })
  agentId!: string;

  @Prop({ required: true })
  postId!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const PostFavoriteSchema = SchemaFactory.createForClass(PostFavorite);

PostFavoriteSchema.index({ agentId: 1, postId: 1 }, { unique: true });
PostFavoriteSchema.index({ agentId: 1, createdAt: -1, _id: -1 });
