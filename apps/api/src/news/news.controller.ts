import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import {
  FilterArticlesDto,
  PersonalizedFeedDto,
  SearchArticlesDto,
  UpdateNewsPreferencesDto,
} from "./dto";
import { NewsService } from "./news.service";

@Controller("news")
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get("search")
  async searchArticles(@Query() query: SearchArticlesDto) {
    return this.newsService.searchArticles(query);
  }

  @Get("filter")
  async filterArticles(@Query() query: FilterArticlesDto) {
    return this.newsService.filterArticles(query);
  }

  @Get("filters/available")
  async getAvailableFilters() {
    return this.newsService.getAvailableFilters();
  }

  @Get("feed/personalized")
  async getPersonalizedFeed(
    @Session() session: UserSession,
    @Query() query: PersonalizedFeedDto
  ) {
    const userId = session.user?.id;
    if (!userId) {
      throw new UnauthorizedException("User not found in request");
    }
    return this.newsService.getPersonalizedFeed(userId, query);
  }

  @Post("preferences")
  async updateUserPreferences(
    @Session() session: UserSession,
    @Body() input: UpdateNewsPreferencesDto
  ) {
    const userId = session.user?.id;
    if (!userId) {
      throw new UnauthorizedException("User not found in request");
    }
    return this.newsService.updateUserPreferences(userId, input);
  }
}
