import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { Notification, User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

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
}
