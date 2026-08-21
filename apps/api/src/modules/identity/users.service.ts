import { BadRequestException, Injectable } from "@nestjs/common";
import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { User, UserRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  createAvatarFileKey,
  detectAvatarFormat,
  MAX_AVATAR_BYTES,
  resolveAvatarFilePath,
} from "./avatar-upload";
import { canUseCharacterPalette } from "../payments/tier";
import { computeJourney, JourneyMilestone } from "./journey";
import { CharacterPalette, CharacterPreset } from "./dto/update-character.dto";

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

  // Whitelisted by UpdateProfileDto at the controller boundary — never
  // accepts kybVerified/tier/role, so a client can't self-promote by
  // replaying a crafted PATCH body.
  updateProfile(userId: string, data: { displayName?: string; location?: string }): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data });
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
      data: { avatarGeneratedAt: new Date(), avatarUrl: null, avatarFileKey: null },
    });
  }

  async uploadAvatar(userId: string, file: { buffer: Buffer; size: number } | undefined): Promise<User> {
    if (!file?.buffer?.length) {
      throw new BadRequestException("A profile image is required");
    }
    if (file.size > MAX_AVATAR_BYTES) {
      throw new BadRequestException("Profile images must be 5 MB or smaller");
    }

    const format = detectAvatarFormat(file.buffer);
    if (!format) {
      throw new BadRequestException("Only JPEG, PNG or WebP profile images are supported");
    }

    const previous = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { avatarFileKey: true },
    });
    const fileKey = createAvatarFileKey(userId, format);
    const destination = resolveAvatarFilePath(fileKey);
    const temporary = `${destination}.uploading`;

    await mkdir(dirname(destination), { recursive: true });
    await writeFile(temporary, file.buffer, { flag: "wx", mode: 0o600 });
    await rename(temporary, destination);

    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: {
          avatarFileKey: fileKey,
          avatarUrl: null,
          avatarGeneratedAt: new Date(),
        },
      });

      if (previous.avatarFileKey && previous.avatarFileKey !== fileKey) {
        await unlink(resolveAvatarFilePath(previous.avatarFileKey)).catch(() => undefined);
      }
      return updated;
    } catch (error) {
      await unlink(destination).catch(() => undefined);
      throw error;
    }
  }

  async getCharacter(userId: string): Promise<{ preset: CharacterPreset; palette: CharacterPalette; updatedAt: string | null }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { characterPreset: true, characterPalette: true, characterUpdatedAt: true },
    });
    return {
      preset: (user.characterPreset as CharacterPreset | null) ?? "parrot",
      palette: (user.characterPalette as CharacterPalette | null) ?? "tropical",
      updatedAt: user.characterUpdatedAt?.toISOString() ?? null,
    };
  }

  async updateCharacter(userId: string, data: { preset?: CharacterPreset; palette?: CharacterPalette }): Promise<{ preset: CharacterPreset; palette: CharacterPalette; updatedAt: string | null }> {
    if (data.palette) {
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { tier: true } });
      if (!canUseCharacterPalette(user.tier, data.palette)) {
        throw new BadRequestException("This palette unlocks at a higher creator tier");
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.preset ? { characterPreset: data.preset } : {}),
        ...(data.palette ? { characterPalette: data.palette } : {}),
        characterUpdatedAt: new Date(),
      },
    });
    return this.getCharacter(userId);
  }

  async getJourney(userId: string): Promise<JourneyMilestone[]> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const [submissionCount, advancedCount, payoutCount] = await Promise.all([
      this.prisma.submission.count({ where: { creatorId: userId } }),
      this.prisma.submission.count({ where: { creatorId: userId, status: "advanced" } }),
      this.prisma.payout.count({ where: { userId } }),
    ]);

    return computeJourney({
      phoneVerified: user.phoneVerifiedAt !== null,
      hasSubmission: submissionCount > 0,
      hasAdvanced: advancedCount > 0,
      hasVoted: user.lastVoteDate !== null,
      hasPayout: payoutCount > 0,
      tier: user.tier,
    });
  }
}
