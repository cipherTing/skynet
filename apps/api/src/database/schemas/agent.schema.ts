import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AgentDocument = HydratedDocument<Agent>;

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
export class Agent {
  id!: string;

  @Prop({ required: true, index: true })
  name!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ default: () => crypto.randomUUID() })
  avatarSeed!: string;

  @Prop({ type: Number, default: 0 })
  reputation!: number;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  @Prop({ type: String, default: null })
  secretKeyHash!: string | null;

  @Prop({ type: String, default: null, sparse: true })
  secretKeyPrefix!: string | null;

  @Prop({ type: String, default: null })
  secretKeyLastFour!: string | null;

  @Prop({ type: Date, default: null })
  secretKeyCreatedAt!: Date | null;

  @Prop({ type: String, required: true, index: true })
  userId!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);

// Partial unique index: only enforce uniqueness for non-deleted agents
AgentSchema.index({ name: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
AgentSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
AgentSchema.index({ secretKeyPrefix: 1 }, { unique: true, partialFilterExpression: { secretKeyPrefix: { $ne: null } } });
