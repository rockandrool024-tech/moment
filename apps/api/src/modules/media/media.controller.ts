import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Logger,
  NotFoundException,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../common/prisma/prisma.service";
import { MuxService } from "./mux.service";
import { CreateUploadDto } from "./dto/create-upload.dto";
import { User } from "@prisma/client";

@Controller("media")
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mux: MuxService,
  ) {}

  @Post("uploads")
  @UseGuards(JwtAuthGuard)
  async createUpload(
    @Body() dto: CreateUploadDto,
    @CurrentUser() user: User,
  ): Promise<{ uploadUrl: string; uploadId: string }> {
    const submission = await this.prisma.submission.findUnique({
      where: { id: dto.submissionId },
    });
    if (!submission) throw new NotFoundException("Submission not found");
    if (submission.creatorId !== user.id) {
      throw new ForbiddenException("Not your submission");
    }

    const upload = await this.mux.get().video.uploads.create({
      cors_origin: "*",
      new_asset_settings: { playback_policy: ["public"] },
    });

    if (!upload.url) {
      throw new BadRequestException("Mux did not return an upload URL");
    }

    // videoRef temporarily holds the Mux *upload* id until the asset.ready
    // webhook swaps it for the *asset* id — see MediaWebhooksController.
    await this.prisma.submission.update({
      where: { id: dto.submissionId },
      data: { videoRef: upload.id, videoStatus: "pending" },
    });

    return { uploadUrl: upload.url, uploadId: upload.id };
  }
}
