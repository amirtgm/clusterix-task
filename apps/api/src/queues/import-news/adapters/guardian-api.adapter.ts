import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AxiosError } from 'axios';
import dayjs from 'dayjs';
import { firstValueFrom } from 'rxjs';
import type { EnvConfig } from '../../../config/configuration';
import type {
  NewsSourceAdapter,
  NormalizedArticle,
} from '../../../news/news.types';

type GuardianFields = {
  headline?: string | null;
  trailText?: string | null;
  bodyText?: string | null;
  byline?: string | null;
};

type GuardianContentResult = {
  id: string;
  type: string;
  sectionId?: string | null;
  sectionName?: string | null;
  pillarId?: string | null;
  pillarName?: string | null;
  webPublicationDate?: string | null;
  webTitle?: string | null;
  webUrl?: string | null;
  apiUrl?: string | null;
  fields?: GuardianFields | null;
  isHosted?: boolean;
};

type GuardianSuccessResponse = {
  status: 'ok';
  userTier: string;
  total: number;
  startIndex: number;
  pageSize: number;
  currentPage: number;
  pages: number;
  orderBy: string;
  results: GuardianContentResult[];
};

type GuardianErrorResponse = {
  status: 'error';
  message: string;
};

type GuardianSearchResponse = {
  response: GuardianSuccessResponse | GuardianErrorResponse;
};

const PAGE_SIZE = 50;
const MAX_PAGES = 5;
const DEFAULT_PUBLISHER = {
  name: 'The Guardian',
  domain: 'theguardian.com',
};

@Injectable()
export class GuardianApiAdapter implements NewsSourceAdapter {
  readonly name = 'guardian' as const;
  private readonly logger = new Logger(GuardianApiAdapter.name);

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly httpService: HttpService,
  ) {}

  async fetchSince(since: Date): Promise<NormalizedArticle[]> {
    const apiKey = this.configService.get('GUARDIAN_API_KEY', { infer: true });
    const fromDate = dayjs(since).format('YYYY-MM-DD');
    const articles: NormalizedArticle[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const payload = await this.fetchPage(apiKey, fromDate, page);
      if (!payload) {
        break;
      }

      const normalized = payload.results.flatMap((result) => {
        const article = this.normalizeArticle(result, since);
        return article ? [article] : [];
      });

      articles.push(...normalized);

      if (
        payload.results.length < PAGE_SIZE ||
        payload.currentPage >= payload.pages
      ) {
        break;
      }
    }

    return articles;
  }

  private async fetchPage(
    apiKey: string,
    fromDate: string,
    page: number,
  ): Promise<GuardianSuccessResponse | null> {
    const url = new URL('https://content.guardianapis.com/search');
    url.searchParams.set('api-key', apiKey);
    url.searchParams.set('order-by', 'newest');
    url.searchParams.set('from-date', fromDate);
    url.searchParams.set('use-date', 'published');
    url.searchParams.set('page-size', PAGE_SIZE.toString());
    url.searchParams.set('page', page.toString());
    url.searchParams.set('show-fields', 'headline,trailText,bodyText,byline');

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<GuardianSearchResponse>(url.toString()),
      );
      if (data.response.status !== 'ok') {
        this.logger.warn(
          `Guardian API error: ${data.response.message ?? 'unknown error'}`,
        );
        return null;
      }
      return data.response;
    } catch (error) {
      const err = error as AxiosError;
      this.logger.error(
        `Guardian API request failed: ${err.message}`,
        err.stack,
      );
      return null;
    }
  }

  private normalizeArticle(result: GuardianContentResult, since: Date) {
    if (!result.webUrl || !result.webPublicationDate) {
      return null;
    }

    const publishedAt = dayjs(result.webPublicationDate);
    const sinceBoundary = dayjs(since);
    if (!publishedAt.isValid() || publishedAt.isBefore(sinceBoundary)) {
      return null;
    }

    const summary = this.sanitizeText(
      result.fields?.trailText ?? result.fields?.headline ?? null,
    );
    const domain = this.extractDomain(result.webUrl);

    return {
      sourceName: this.name,
      sourceArticleId: result.id,
      url: result.webUrl,
      title: result.webTitle ?? result.fields?.headline ?? 'Untitled story',
      summary: summary ?? null,
      content: result.fields?.bodyText ?? undefined,
      author: result.fields?.byline ?? null,
      language: 'en',
      category: result.sectionName ?? result.pillarName ?? null,
      publishedAt: publishedAt.toDate(),
      raw: result,
      publisher: {
        name: DEFAULT_PUBLISHER.name,
        domain: domain ?? DEFAULT_PUBLISHER.domain,
      },
    };
  }

  private sanitizeText(value: string | null | undefined) {
    if (!value) {
      return null;
    }
    return value.replace(/<[^>]+>/g, '').trim() || null;
  }

  private extractDomain(rawUrl: string) {
    try {
      const url = new URL(rawUrl);
      return url.hostname.replace(/^www\./i, '');
    } catch {
      return null;
    }
  }
}
