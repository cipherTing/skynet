import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  // 后续按需实现具体业务逻辑
}
