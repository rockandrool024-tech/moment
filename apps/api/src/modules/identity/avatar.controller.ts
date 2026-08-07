import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Res } from "@nestjs/common";
import type { Response } from "express";
import { UsersService } from "./users.service";
import { generateAvatarPng } from "./avatar-generator";
import { PublicCacheService } from "../public/public-cache.service";

const AVATAR_CACHE_TTL_SECONDS = 86_400; // matches the Cache-Control below

// Unauthenticated on purpose — a creator's avatar is a public reference
// image shown to spectators on discovery/results/share cards, the same
// audience as the rest of the public/ module's surfaces. Split out from
// UsersController so the auth boundary (this has none) is obvious from the
// file, not just an annotation buried in a shared controller.
@Controller("users")
export class AvatarController {
  constructor(
    private readonly users: UsersService,
    private readonly cache: PublicCacheService,
  ) {}

  @Get(":id/avatar.png")
  async getAvatar(@Param("id", ParseUUIDPipe) id: string, @Res() res: Response): Promise<void> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException("User not found");

    if (user.avatarUrl) {
      res.redirect(302, user.avatarUrl);
      return;
    }

    // Cached by (id, avatarGeneratedAt) — naturally invalidates itself the
    // instant "Generate new avatar" bumps the timestamp, with no explicit
    // eviction needed. Avoids re-running the identicon render (PNG encode +
    // zlib deflate) on every profile/discovery/share-card view, which is
    // the actual hot path here — GET /users/me itself never carries this
    // payload, since avatarUrl on the raw User row stays null for the
    // placeholder case and the image is only ever fetched via this route.
    const cacheKey = `avatar:png:${id}:${user.avatarGeneratedAt?.toISOString() ?? "none"}`;
    const base64 = await this.cache.getOrSet(cacheKey, AVATAR_CACHE_TTL_SECONDS, async () => {
      const seed = `${user.id}:${user.avatarGeneratedAt?.toISOString() ?? ""}`;
      return generateAvatarPng(seed).toString("base64");
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.end(Buffer.from(base64, "base64"));
  }
}
