import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import {
  FETCH_LATEST_JOB,
  type ImportNewsJobPayload,
  NEWS_AGGREGATOR_QUEUE,
} from "./import-news.constants";
import { ImportNewsService } from "./import-news.service";

@Processor(NEWS_AGGREGATOR_QUEUE)
export class ImportNewsProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportNewsProcessor.name);

  constructor(private readonly importNewsService: ImportNewsService) {
    super();
  }

  async process(job: Job<ImportNewsJobPayload>) {
    if (job.name !== FETCH_LATEST_JOB) {
      this.logger.warn(`Skipping unsupported job ${job.name}`);
      return;
    }
    this.logger.log(`Processing news sync job ${job.id}`);
    await this.importNewsService.sync({
      sinceOverride: job.data.sinceOverrideIso
        ? new Date(job.data.sinceOverrideIso)
        : undefined,
      backfillDays: job.data.forceBackfillDays,
    });
    this.logger.log(`Finished news sync job ${job.id}`);
    return { aggregated: true };
  }
}
