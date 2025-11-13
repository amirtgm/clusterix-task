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

type NewsApiArticleSource = {
  id: string | null;
  name: string | null;
};

type NewsApiArticle = {
  source: NewsApiArticleSource;
  author: string | null;
  title: string | null;
  description: string | null;
  url: string | null;
  publishedAt: string | null;
  content: string | null;
};

type NewsApiOkResponse = {
  status: "ok";
  totalResults: number;
  articles: NewsApiArticle[];
};

type NewsApiErrorResponse = {
  status: "error";
  code: string;
  message: string;
};

type NewsApiResponse = NewsApiOkResponse | NewsApiErrorResponse;

@Injectable()
export class NewsApiAdapter implements NewsSourceAdapter {
  readonly name = "newsapi" as const;
  private readonly logger = new Logger(NewsApiAdapter.name);

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly httpService: HttpService
  ) {}

  async fetchSince(since: Date): Promise<NormalizedArticle[]> {
    const apiKey = this.configService.get("NEWS_API_KEY", { infer: true });
    const fromIso = dayjs(since).toISOString();
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", "news");
    url.searchParams.set("from", fromIso);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "100");

    const payload = await this.fetchPayload(url.toString(), apiKey);
    if (!payload) {
      return [];
    }

    if (payload.status !== "ok") {
      this.logger.warn(`NewsAPI error ${payload.code}: ${payload.message}`);
      return [];
    }

    return payload.articles.flatMap((article) => {
      const normalized = this.normalizeArticle(article);
      return normalized ? [normalized] : [];
    });
  }

  private async fetchPayload(url: string, apiKey: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<NewsApiResponse>(url, {
          headers: { "X-Api-Key": apiKey },
        })
      );
      return data;
    } catch (error) {
      const err = error as AxiosError;
      this.logger.error(JSON.stringify(err), null, 2);
      this.logger.error(`NewsAPI request failed: ${err.message}`, err.stack);
      return null;
    }
  }

  private normalizeArticle(article: NewsApiArticle) {
    if (!article.url || !article.publishedAt) {
      return null;
    }

    const publishedAt = dayjs(article.publishedAt);
    if (!publishedAt.isValid()) {
      return null;
    }

    const domain = this.extractDomain(article.url);
    return {
      sourceName: this.name,
      sourceArticleId: article.url,
      url: article.url,
      title: article.title ?? "Untitled story",
      summary: article.description,
      content: article.content ?? undefined,
      author: article.author ?? null,
      language: "en",
      category: null,
      publishedAt: publishedAt.toDate(),
      raw: article,
      publisher:
        domain && (article.source.name || domain)
          ? {
              name: article.source.name ?? domain,
              domain,
            }
          : undefined,
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
