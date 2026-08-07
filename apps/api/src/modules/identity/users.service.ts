import { Injectable } from "@nestjs/common";
import { User, UserRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // Verification always stamps phoneVerifiedAt fresh — role is only used to
  // seed a brand-new account and is otherwise ignored so a returning user
  // can't silently flip their own role by replaying an old client request.
  async findOrCreateVerified(phone: string, role: UserRole): Promise<User> {
    const existing = await this.findByPhone(phone);
    if (existing) {
      return this.prisma.user.update({
        where: { id: existing.id },
        data: { phoneVerifiedAt: new Date() },
      });
    }

    return this.prisma.user.create({
      data: { phone, role, phoneVerifiedAt: new Date() },
    });
  }

  requestKyb(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { kybRequestedAt: new Date() },
    });
  }

  // "Generation" today just re-seeds the deterministic placeholder identicon
  // (see avatar-generator.ts) by bumping the timestamp it's derived from —
  // no external call yet. Swap in a real provider call + avatarUrl write
  // here once AI_AVATAR_PROVIDER_KEY exists; callers never need to change.
  //
  // NOTE: because the seed is (userId + avatarGeneratedAt), regenerating
  // changes the identicon everywhere it's shown (profile, discovery, old
  // share cards) — acceptable for a stub, but a real provider swap should
  // consider versioning or history if "my past share cards changed" turns
  // out to matter to creators.
  generateAvatar(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarGeneratedAt: new Date(), avatarUrl: null },
    });
  }
}
