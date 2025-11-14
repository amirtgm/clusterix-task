import { Injectable } from "@nestjs/common";
import type {
  FilterArticlesInput,
  PersonalizedFeedInput,
  SearchArticlesInput,
  UpdateNewsPreferencesInput,
} from "./dto";
import { NewsRepository } from "./news.repository";
@Injectable()
export class NewsService {
  constructor(private readonly repository: NewsRepository) {}

  searchArticles(input: SearchArticlesInput) {
    return this.repository.searchArticles(input);
  }

  filterArticles(input: FilterArticlesInput) {
    return this.repository.filterArticles(input);
  }

  getPersonalizedFeed(userId: string, input: PersonalizedFeedInput) {
    return this.repository.getPersonalizedFeed(userId, input);
  }

  updateUserPreferences(userId: string, input: UpdateNewsPreferencesInput) {
    return this.repository.updateUserPreferences(userId, input);
  }

  getAvailableFilters() {
    return this.repository.getAvailableFilters();
  }
}
