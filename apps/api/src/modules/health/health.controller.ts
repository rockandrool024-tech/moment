import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

// Deliberately no auth/throttle guard — this is what a load balancer/reverse
// proxy (Caddy, the deploy compose stack) polls to decide whether to route
// traffic here at all.
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: "ok"; db: "ok" }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException("Database unreachable");
    }
    return { status: "ok", db: "ok" };
  }
}
