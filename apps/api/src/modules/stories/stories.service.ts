import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Content, Story } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateStoryDto } from "./dto/create-story.dto";
import { AddContentDto } from "./dto/add-content.dto";

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Every Story created here is FREE/OPEN (the model defaults) — see
  // create-story.dto.ts for why access/mode aren't client-settable yet.
  create(sellerId: string, dto: CreateStoryDto): Promise<Story> {
    return this.prisma.story.create({
      data: { sellerId, title: dto.title, brief: dto.brief },
    });
  }

  findMany(): Promise<Story[]> {
    return this.prisma.story.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findByIdOrThrow(id: string): Promise<Story> {
    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) throw new NotFoundException("Story not found");
    return story;
  }

  async claim(storyId: string, creatorId: string) {
    const story = await this.findByIdOrThrow(storyId);
    if (story.mode === "CHALLENGE") {
      throw new BadRequestException(
        "This Story runs as a Challenge — enter it via the challenge's own submission flow",
      );
    }

    try {
      return await this.prisma.storyClaim.create({ data: { storyId, creatorId } });
    } catch {
      // @@unique([storyId, creatorId]) — same creator can't claim twice.
      throw new BadRequestException("You've already claimed this story");
    }
  }

  /**
   * Creator attaches (or updates) the content they made for their claim, and
   * optionally records external post links for their own dashboard —
   * display only, never read by any scoring/tally/payout path.
   */
  async addContent(claimId: string, creatorId: string, dto: AddContentDto): Promise<Content> {
    const claim = await this.prisma.storyClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException("Claim not found");
    if (claim.creatorId !== creatorId) {
      throw new ForbiddenException("You can only add content to your own claim");
    }

    const content = await this.prisma.content.upsert({
      where: { storyClaimId: claimId },
      create: { storyClaimId: claimId, mediaUrl: dto.mediaUrl, caption: dto.caption },
      update: { mediaUrl: dto.mediaUrl, caption: dto.caption },
    });

    if (dto.externalPosts && dto.externalPosts.length > 0) {
      await this.prisma.externalPost.createMany({
        data: dto.externalPosts.map((p) => ({
          contentId: content.id,
          platform: p.platform,
          url: p.url,
          views: p.views,
          likes: p.likes,
        })),
      });
    }

    return this.prisma.content.findUniqueOrThrow({
      where: { id: content.id },
      include: { externalPosts: true },
    });
  }

  myClaims(creatorId: string) {
    return this.prisma.storyClaim.findMany({
      where: { creatorId },
      include: { story: true, content: { include: { externalPosts: true } } },
      orderBy: { claimedAt: "desc" },
    });
  }

  /**
   * A seller's own Stories, each with a claim/content/engagement rollup and
   * a derived lifecycle stage — computed from existing relations, nothing
   * stored. Engagement is a sum of creator-entered ExternalPost numbers,
   * same "display only, never scored" data as everywhere else it appears
   * (see ADR-006) — never presented as verified reach.
   */
  async myStories(sellerId: string) {
    const stories = await this.prisma.story.findMany({
      where: { sellerId },
      include: {
        claims: {
          include: { content: { include: { externalPosts: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return stories.map((story) => {
      const claimsWithContent = story.claims.filter((c) => c.content);
      const posts = claimsWithContent.flatMap((c) => c.content?.externalPosts ?? []);
      const reportedViews = posts.reduce((sum, p) => sum + (p.views ?? 0), 0);
      const reportedLikes = posts.reduce((sum, p) => sum + (p.likes ?? 0), 0);

      const stage: "submitted" | "claimed" | "content_added" | "posted" =
        posts.length > 0
          ? "posted"
          : claimsWithContent.length > 0
            ? "content_added"
            : story.claims.length > 0
              ? "claimed"
              : "submitted";

      return {
        id: story.id,
        title: story.title,
        access: story.access,
        mode: story.mode,
        createdAt: story.createdAt,
        stage,
        claimCount: story.claims.length,
        contentCount: claimsWithContent.length,
        postCount: posts.length,
        reportedViews,
        reportedLikes,
      };
    });
  }
}
