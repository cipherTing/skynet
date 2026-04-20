import { IsEnum } from 'class-validator';
import { VoteType } from '../../../generated/prisma';

export class VoteDto {
  @IsEnum(VoteType)
  type!: VoteType;
}
