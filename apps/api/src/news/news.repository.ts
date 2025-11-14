import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "../../prisma/generated/prisma/client";
import { PrismaService } from "../prisma.service";
import type {
  FilterArticlesInput,
  PersonalizedFeedInput,
  SearchArticlesInput,
  UpdateNewsPreferencesInput,
} from "./dto";
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

  async searchArticles(input: SearchArticlesInput) {
    const { keyword, limit, offset } = input;
    const whereClause: Prisma.ArticleWhereInput = {
      OR: [
        { title: { contains: keyword, mode: "insensitive" } },
        { summary: { contains: keyword, mode: "insensitive" } },
        { content: { contains: keyword, mode: "insensitive" } },
      ],
    };

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: whereClause,
        include: { source: true, publisher: true },
        orderBy: { publishedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.article.count({ where: whereClause }),
    ]);

    return {
      data: articles,
      pagination: this.buildPagination(total, limit, offset),
    };
  }

  async filterArticles(input: FilterArticlesInput) {
    const {
      startDate,
      endDate,
      categories,
      sources,
      sortBy = "publishedAt",
      sortOrder = "desc",
      limit,
      offset,
    } = input;

    const whereClause: Prisma.ArticleWhereInput = {};

    if (startDate || endDate) {
      whereClause.publishedAt = {};
      if (startDate) {
        whereClause.publishedAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.publishedAt.lte = new Date(endDate);
      }
    }

    if (categories && categories.length > 0) {
      whereClause.category = {
        in: categories,
      };
    }

    if (sources && sources.length > 0) {
      whereClause.OR = [
        { source: { id: { in: sources } } },
        { source: { name: { in: sources } } },
      ];
    }

    const orderBy: Prisma.ArticleOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: whereClause,
        include: { source: true, publisher: true },
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.article.count({ where: whereClause }),
    ]);

    return {
      data: articles,
      pagination: this.buildPagination(total, limit, offset),
    };
  }

  async getPersonalizedFeed(userId: string, input: PersonalizedFeedInput) {
    const { limit, offset, sortBy = "publishedAt", sortOrder = "desc" } = input;

    const userPreferences = await this.prisma.newsPreference.findUnique({
      where: { userId },
    });

    if (!userPreferences) {
      return {
        data: [],
        pagination: this.buildPagination(0, limit, offset),
      };
    }

    const filters: Prisma.ArticleWhereInput[] = [];
    const { preferredSources, preferredCategories, preferredAuthors } =
      userPreferences;

    if (preferredSources?.length) {
      filters.push({
        source: {
          OR: [
            { id: { in: preferredSources } },
            { name: { in: preferredSources } },
          ],
        },
      });
    }

    if (preferredCategories?.length) {
      filters.push({ category: { in: preferredCategories } });
    }

    if (preferredAuthors?.length) {
      filters.push({ author: { in: preferredAuthors } });
    }

    const whereClause: Prisma.ArticleWhereInput = filters.length
      ? { AND: filters }
      : {};

    const orderBy: Prisma.ArticleOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: whereClause,
        include: { source: true, publisher: true },
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.article.count({ where: whereClause }),
    ]);

    return {
      data: articles,
      preferences: {
        sources: userPreferences.preferredSources,
        categories: userPreferences.preferredCategories,
        authors: userPreferences.preferredAuthors,
      },
      pagination: this.buildPagination(total, limit, offset),
    };
  }

  async updateUserPreferences(
    userId: string,
    input: UpdateNewsPreferencesInput
  ) {
    const { preferredSources, preferredCategories, preferredAuthors } = input;

    return this.prisma.newsPreference.upsert({
      where: { userId },
      update: {
        ...(preferredSources && { preferredSources }),
        ...(preferredCategories && { preferredCategories }),
        ...(preferredAuthors && { preferredAuthors }),
      },
      create: {
        userId,
        preferredSources: preferredSources || [],
        preferredCategories: preferredCategories || [],
        preferredAuthors: preferredAuthors || [],
      },
    });
  }

  async getAvailableFilters() {
    const [categories, sources] = await Promise.all([
      this.prisma.article.findMany({
        distinct: ["category"],
        select: { category: true },
        where: { category: { not: null } },
      }),
      this.prisma.source.findMany({
        select: { id: true, name: true },
        where: { active: true },
      }),
    ]);

    return {
      categories: categories
        .map((c) => c.category)
        .filter((c): c is string => c !== null),
      sources,
    };
  }

  private buildPagination(total: number, limit: number, offset: number) {
    return {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }
}
