import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { transformDocumentId } from '@/database/schema-transform';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: transformDocumentId,
  },
  toObject: {
    virtuals: true,
    transform: transformDocumentId,
  },
})
export class User {
  id!: string;

  @Prop({ required: true })
  username!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ type: Number, default: 0 })
  tokenVersion!: number;

  @Prop({ type: Date, default: null })
  suspendedAt!: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Partial unique index: only enforce uniqueness for non-deleted users
UserSchema.index({ username: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
