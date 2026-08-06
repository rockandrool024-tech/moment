import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import IORedis from "ioredis";

// A small get-or-set-with-TTL cache in front of the public spectator reads.
// ADR-002 explicitly allows public vote counts to lag "a few seconds" —
// this is what makes that true, and what keeps a viral traffic spike off
// Postgres. Separate Redis connection from BullMQ's (queue.module.ts) so a
// traffic spike here can't contend with job processing.
@Injectable()
export class PublicCacheService implements OnModuleDestroy {
  private client: IORedis | undefined;

  constructor(private readonly config: ConfigService) {}

  private getClient(): IORedis {
    if (!this.client) {
      this.client = new IORedis(this.config.get<string>("redis.url")!, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
    }
    return this.client;
  }

  async getOrSet<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
    const client = this.getClient();
    try {
      const cached = await client.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch {
      // Redis unreachable — fall through to computing fresh rather than
      // failing the request. Caching is an optimization, not a dependency.
    }

    const value = await compute();

    try {
      await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // Same rationale — a failed cache write shouldn't fail the response.
    }

    return value;
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }
}
