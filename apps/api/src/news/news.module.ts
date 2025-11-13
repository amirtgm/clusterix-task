import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma.service";
import { NewsController } from "./news.controller";
import { NewsRepository } from "./news.repository";
import { NewsService } from "./news.service";

@Module({
  imports: [PrismaModule],
  providers: [NewsRepository, NewsService],
  exports: [NewsRepository, NewsService],
  controllers: [NewsController],
})
export class NewsModule {}
