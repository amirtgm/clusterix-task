import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Queue } from "bullmq";
import { NewsRepository } from "../../news/news.repository";
import type { NewsSourceAdapter } from "../../news/news.types";
import { GuardianApiAdapter } from "./adapters/guardian-api.adapter";
import { NewsApiAdapter } from "./adapters/news-api.adapter";
import {
  FETCH_LATEST_JOB,
  type ImportNewsJobPayload,
  NEWS_AGGREGATOR_QUEUE,
} from "./import-news.constants";

const DEFAULT_BACKFILL_DAYS = 7;
const DAY_IN_MS = 86_400_000;

export type ImportNewsWorkerOptions = {
  sinceOverride?: Date;
  backfillDays?: number;
};

@Injectable()
export class ImportNewsService implements OnModuleInit {
  private readonly logger = new Logger(ImportNewsService.name);
  private scheduleReady = false;

  constructor(
    @InjectQueue(NEWS_AGGREGATOR_QUEUE)
    private readonly queue: Queue<ImportNewsJobPayload>,
    private readonly newsRepository: NewsRepository,
    private readonly newsApiAdapter: NewsApiAdapter,
    private readonly guardianAdapter: GuardianApiAdapter
  ) {}

  async onModuleInit() {
    this.logger.log("News aggregator initializing");
    const articleCount = await this.newsRepository.countArticles();
    if (articleCount === 0) {
      this.logger.log(
        "No articles in the database yet. Queueing initial sync."
      );
      await this.enqueueSyncJob();
    } else {
      this.logger.log(
        `Found ${articleCount} existing articles. Scheduler will maintain freshness.`
      );
    }
    this.scheduleReady = true;
    this.logger.log("Hourly news aggregation scheduler is now active.");
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlySync() {
    if (!this.scheduleReady) {
      this.logger.log("Scheduler not ready yet, skipping cron tick.");
      return;
    }
    this.logger.log("Hourly cron triggered, queueing news aggregation.");
    await this.enqueueSyncJob();
  }

  private async enqueueSyncJob(
    payload: Omit<ImportNewsJobPayload, "requestedAt"> = {}
  ) {
    const busy = await this.isJobRunning();
    if (busy) {
      this.logger.log("Skip enqueue: news aggregation already running.");
      return;
    }

    const job = await this.queue.add(
      FETCH_LATEST_JOB,
      {
        requestedAt: new Date().toISOString(),
        ...payload,
      },
      {
        removeOnComplete: true,
        removeOnFail: 50,
        attempts: 1,
      }
    );
    this.logger.log(`Queued news aggregation job ${job.id}`);
  }

  private async isJobRunning() {
    const jobs = await this.queue.getJobs(["active", "waiting"]);
    return jobs.some((job) => job.name === FETCH_LATEST_JOB);
  }

  async sync(options?: ImportNewsWorkerOptions) {
    for (const adapter of [this.newsApiAdapter, this.guardianAdapter]) {
      await this.syncAdapter(adapter, options);
    }
  }

  private async syncAdapter(
    adapter: NewsSourceAdapter,
    options?: ImportNewsWorkerOptions
  ) {
    const source = await this.newsRepository.ensureSource(adapter.name);
    const since = await this.sinceLastFetch(source.id, options);
    this.logger.log(
      `Fetching ${adapter.name} articles since ${since.toISOString()}`
    );
    const articles = await adapter.fetchSince(since);
    await this.newsRepository.upsertArticles(source.id, articles);
    this.logger.log(
      `Stored ${articles.length} ${adapter.name} articles published since ${since.toISOString()}`
    );
  }

  private async sinceLastFetch(
    sourceId: string,
    options?: ImportNewsWorkerOptions
  ) {
    if (options?.sinceOverride) {
      return options.sinceOverride;
    }
    const latest =
      await this.newsRepository.getLatestPublishedAtForSource(sourceId);
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
