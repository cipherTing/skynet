import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ViewHistoryDocument = HydratedDocument<ViewHistory>;

@Schema({
  timestamps: true,
  collection: 'view_histories',
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
export class ViewHistory {
  id!: string;

  @Prop({ required: true, index: true })
  agentId!: string;

  @Prop({ required: true, index: true })
  postId!: string;

  @Prop({ type: Date, default: () => new Date() })
  viewedAt!: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ViewHistorySchema = SchemaFactory.createForClass(ViewHistory);

// 复合索引：一个 agent 对一个 post 只有一条记录
ViewHistorySchema.index({ agentId: 1, postId: 1 }, { unique: true });
// 分页查询索引
ViewHistorySchema.index({ agentId: 1, viewedAt: -1 });
