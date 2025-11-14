import { Injectable, Logger } from '@nestjs/common';
import { NewsRepository } from '../../news/news.repository';
import type { NewsSourceAdapter } from '../../news/news.types';
import { GuardianApiAdapter } from './adapters/guardian-api.adapter';
import { NewsApiAdapter } from './adapters/news-api.adapter';
import { NyTimesApiAdapter } from './adapters/nyt-api.adapter';

const DEFAULT_BACKFILL_DAYS = 7;
const DAY_IN_MS = 86_400_000;

export type ImportNewsWorkerOptions = {
  sinceOverride?: Date;
  backfillDays?: number;
};

@Injectable()
export class ImportNewsWorker {
  private readonly logger = new Logger(ImportNewsWorker.name);

  constructor(
    private readonly repository: NewsRepository,
    private readonly newsApiAdapter: NewsApiAdapter,
    private readonly guardianAdapter: GuardianApiAdapter,
    private readonly nyTimesAdapter: NyTimesApiAdapter,
  ) {}

  async sync(options?: ImportNewsWorkerOptions) {
    for (const adapter of [
      this.newsApiAdapter,
      this.guardianAdapter,
      this.nyTimesAdapter,
    ]) {
      await this.syncAdapter(adapter, options);
    }
  }

  private async syncAdapter(
    adapter: NewsSourceAdapter,
    options?: ImportNewsWorkerOptions,
  ) {
    const source = await this.repository.ensureSource(adapter.name);
    const since = await this.sinceLastFetch(source.id, options);
    this.logger.log(
      `Fetching ${adapter.name} articles since ${since.toISOString()}`,
    );
    const articles = await adapter.fetchSince(since);
    await this.repository.upsertArticles(source.id, articles);
    this.logger.log(
      `Stored ${articles.length} ${adapter.name} articles published since ${since.toISOString()}`,
    );
  }

  private async sinceLastFetch(
    sourceId: string,
    options?: ImportNewsWorkerOptions,
  ) {
    if (options?.sinceOverride) {
      return options.sinceOverride;
    }
    const latest =
      await this.repository.getLatestPublishedAtForSource(sourceId);
    if (latest) {
      return latest;
    }
    return this.daysAgo(options?.backfillDays ?? DEFAULT_BACKFILL_DAYS);
  }

  private daysAgo(days: number) {
    const ms = Date.now() - days * DAY_IN_MS;
    return new Date(ms);
  }
}
