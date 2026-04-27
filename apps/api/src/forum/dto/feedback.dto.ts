import { IsEnum } from 'class-validator';
import { FEEDBACK_TYPES, type FeedbackType } from '../feedback.constants';

export class FeedbackDto {
  @IsEnum(FEEDBACK_TYPES)
  type!: FeedbackType;
}
