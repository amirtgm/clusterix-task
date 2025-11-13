import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  NormalizedArticle,
  NormalizedPublisher,
  SourceName,
} from './news.types';

@Injectable()
export class NewsRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async ensureSource(name: SourceName) {
    return this.prisma.source.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  async countArticles() {
    return this.prisma.article.count();
  }

  async getLatestPublishedAtForSource(sourceId: string) {
    const record = await this.prisma.article.findFirst({
      where: { sourceId },
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true },
    });
    return record?.publishedAt ?? null;
  }

  async upsertArticles(sourceId: string, articles: NormalizedArticle[]) {
    if (articles.length === 0) {
      return;
    }

    for (const article of articles) {
      const publisherId = await this.ensurePublisher(article.publisher);
      await this.prisma.article.upsert({
        where: {
          sourceId_externalId: {
            sourceId,
            externalId: article.sourceArticleId,
          },
        },
        update: this.mapArticleData(article, sourceId, publisherId),
        create: this.mapArticleData(article, sourceId, publisherId),
      });
    }
  }

  private async ensurePublisher(publisher?: NormalizedPublisher | null) {
    if (!publisher) {
      return null;
    }
    const existing = await this.prisma.publisher.findUnique({
      where: { domain: publisher.domain },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }
    const created = await this.prisma.publisher.create({
      data: { name: publisher.name, domain: publisher.domain },
      select: { id: true },
    });
    return created.id;
  }

  private mapArticleData(
    article: NormalizedArticle,
    sourceId: string,
    publisherId: string | null
  ) {
    return {
      sourceId,
      publisherId,
      externalId: article.sourceArticleId,
      url: article.url,
      title: article.title,
      summary: article.summary ?? null,
      content: article.content ?? null,
      language: article.language ?? null,
      category: article.category ?? null,
      publishedAt: article.publishedAt,
      raw: article.raw ?? undefined,
    };
  }
}
