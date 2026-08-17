import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { Content, Story, StoryClaim, User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { StoriesService } from "./stories.service";
import { CreateStoryDto } from "./dto/create-story.dto";
import { AddContentDto } from "./dto/add-content.dto";

@Controller("stories")
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateStoryDto, @CurrentUser() user: User): Promise<Story> {
    return this.stories.create(user.id, dto);
  }

  @Get()
  findMany(): Promise<Story[]> {
    return this.stories.findMany();
  }

  @Get("me/claims")
  @UseGuards(JwtAuthGuard)
  myClaims(@CurrentUser() user: User) {
    return this.stories.myClaims(user.id);
  }

  @Get("me/mine")
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: User) {
    return this.stories.myStories(user.id);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string): Promise<Story> {
    return this.stories.findByIdOrThrow(id);
  }

  @Post(":id/claim")
  @UseGuards(JwtAuthGuard)
  claim(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: User): Promise<StoryClaim> {
    return this.stories.claim(id, user.id);
  }

  @Post("claims/:id/content")
  @UseGuards(JwtAuthGuard)
  addContent(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddContentDto,
    @CurrentUser() user: User,
  ): Promise<Content> {
    return this.stories.addContent(id, user.id, dto);
  }
}
