import { Global, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import IORedis from "ioredis";

// Registers the shared Redis connection once. Feature modules register
// their own named queues with BullModule.registerQueue and inherit this
// connection — nothing else needs to know the Redis URL.
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // BullMQ requires maxRetriesPerRequest disabled on blocking connections.
        connection: new IORedis(config.get<string>("redis.url")!, {
          maxRetriesPerRequest: null,
        }),
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
