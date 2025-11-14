import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AxiosError } from "axios";
import dayjs from "dayjs";
import { firstValueFrom } from "rxjs";
import type { EnvConfig } from "../../../config/configuration";
import type {
  NewsSourceAdapter,
  NormalizedArticle,
} from "../../../news/news.types";

type NytMultimedia = {
  url: string;
  format: string;
  height: number;
  width: number;
  type: string;
  subtype: string;
  caption: string;
  copyright: string;
};

type NytArticle = {
  section?: string;
  subsection?: string;
  title?: string;
  abstract?: string;
  url?: string;
  uri?: string;
  byline?: string;
  item_type?: string;
  updated_date?: string;
  created_date?: string;
  published_date?: string;
  material_type_facet?: string;
  kicker?: string;
  des_facet?: string[];
  org_facet?: string[];
  per_facet?: string[];
  geo_facet?: string[];
  multimedia?: NytMultimedia[];
  short_url?: string;
};

type NytTopStoriesResponse = {
  status: string;
  copyright: string;
  section: string;
  last_updated: string;
  num_results: number;
  results: NytArticle[];
};

const NYT_SECTIONS = [
  "arts",
  "automobiles",
  "books/review",
  "business",
  "fashion",
  "food",
  "health",
  "home",
  "insider",
  "magazine",
  "movies",
  "nyregion",
  "obituaries",
  "opinion",
  "politics",
  "realestate",
  "science",
  "sports",
  "sundayreview",
  "technology",
  "theater",
  "t-magazine",
  "travel",
  "upshot",
  "us",
  "world",
];

const DEFAULT_PUBLISHER = {
  name: "The New York Times",
  domain: "nytimes.com",
};

@Injectable()
export class NyTimesApiAdapter implements NewsSourceAdapter {
  readonly name = "nyt" as const;
  private readonly logger = new Logger(NyTimesApiAdapter.name);

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly httpService: HttpService
  ) {}

  async fetchSince(since: Date): Promise<NormalizedArticle[]> {
    const apiKey = this.configService.get("NYT_API_KEY", { infer: true });
    const articles: NormalizedArticle[] = [];

    for (const section of NYT_SECTIONS) {
      const payload = await this.fetchSection(section, apiKey);
      if (!payload || payload.status !== "OK") {
        continue;
      }

      const normalized = payload.results.flatMap((result) => {
        const article = this.normalizeArticle(result, since);
        return article ? [article] : [];
      });

      articles.push(...normalized);
    }

    return articles;
  }

  private async fetchSection(section: string, apiKey: string) {
    const url = `https://api.nytimes.com/svc/topstories/v2/${section}.json`;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<NytTopStoriesResponse>(url, {
          params: { "api-key": apiKey },
        })
      );
      return data;
    } catch (error) {
      const err = error as AxiosError;
      this.logger.error(
        `NYTimes API request failed for ${section}: ${err.message}`,
        err.stack
      );
      return null;
    }
  }

  private normalizeArticle(result: NytArticle, since: Date) {
    if (!result.url || !result.published_date) {
      return null;
    }

    const publishedAt = dayjs(result.published_date);
    const sinceBoundary = dayjs(since);
    if (!publishedAt.isValid() || publishedAt.isBefore(sinceBoundary)) {
      return null;
    }

    const domain = this.extractDomain(result.url);

    return {
      sourceName: this.name,
      sourceArticleId: result.uri ?? result.url,
      url: result.url,
      title: result.title ?? "Untitled story",
      summary: result.abstract ?? null,
      language: "en",
      category: result.section ?? null,
      publishedAt: publishedAt.toDate(),
      raw: result,
      publisher: {
        name: DEFAULT_PUBLISHER.name,
        domain: domain ?? DEFAULT_PUBLISHER.domain,
      },
    };
  }

  private extractDomain(rawUrl: string) {
    try {
      const url = new URL(rawUrl);
      return url.hostname.replace(/^www\./i, "");
    } catch {
      return null;
    }
  }
}
