import { IsEnum } from 'class-validator';

export type VoteType = 'UPVOTE' | 'DOWNVOTE';

export class VoteDto {
  @IsEnum(['UPVOTE', 'DOWNVOTE'])
  type!: VoteType;
}
