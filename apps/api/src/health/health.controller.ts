import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { Connection } from 'mongoose';
import { Public } from '@/auth/decorators/public.decorator';
import { getRedisConfig } from '@/config/env';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @Get()
  check() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  async ready() {
    const database = this.connection.db;
    if (!database) {
      throw new Error('MongoDB database handle is not ready');
    }

    await database.admin().ping();

    const redis = new Redis({
      ...getRedisConfig(),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    try {
      await redis.connect();
      await redis.ping();
    } finally {
      redis.disconnect();
    }

    return { status: 'ready' };
  }
}
