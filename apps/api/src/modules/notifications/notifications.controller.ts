import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { Notification, User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";
import { PushService } from "./push.service";
import { SubscribePushDto, UnsubscribePushDto } from "./dto/subscribe-push.dto";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  @Get()
  list(@CurrentUser() user: User): Promise<Notification[]> {
    return this.notifications.list(user.id);
  }

  @Get("unread-count")
  unreadCount(@CurrentUser() user: User): Promise<{ count: number }> {
    return this.notifications.unreadCount(user.id).then((count) => ({ count }));
  }

  @Post(":id/read")
  async markRead(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: User): Promise<{ ok: true }> {
    await this.notifications.markRead(id, user.id);
    return { ok: true };
  }

  @Post("read-all")
  async markAllRead(@CurrentUser() user: User): Promise<{ ok: true }> {
    await this.notifications.markAllRead(user.id);
    return { ok: true };
  }

  @Post("push-subscriptions")
  async subscribePush(@CurrentUser() user: User, @Body() dto: SubscribePushDto): Promise<{ ok: true }> {
    await this.push.subscribe(user.id, dto);
    return { ok: true };
  }

  @Delete("push-subscriptions")
  async unsubscribePush(@CurrentUser() user: User, @Body() dto: UnsubscribePushDto): Promise<{ ok: true }> {
    await this.push.unsubscribe(user.id, dto.endpoint);
    return { ok: true };
  }
}
