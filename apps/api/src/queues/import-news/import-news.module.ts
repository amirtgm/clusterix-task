import { HttpModule } from "@nestjs/axios";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { NewsModule } from "../../news/news.module";
import { GuardianApiAdapter } from "./adapters/guardian-api.adapter";
import { NewsApiAdapter } from "./adapters/news-api.adapter";
import { NyTimesApiAdapter } from "./adapters/nyt-api.adapter";
import { NEWS_AGGREGATOR_QUEUE } from "./import-news.constants";
import { ImportNewsProcessor } from "./import-news.processor";
import { ImportNewsService } from "./import-news.service";

@Module({
  imports: [
    BullModule.registerQueue({
      name: NEWS_AGGREGATOR_QUEUE,
    }),
    HttpModule,
    NewsModule,
  ],
  providers: [
    NewsApiAdapter,
    GuardianApiAdapter,
    NyTimesApiAdapter,
    ImportNewsService,
    ImportNewsProcessor,
  ],
  exports: [ImportNewsService],
})
export class ImportNewsModule {}
