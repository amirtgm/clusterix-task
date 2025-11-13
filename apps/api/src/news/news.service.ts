import { Injectable } from "@nestjs/common";
import type { Prisma } from "../../prisma/generated/prisma/client";
import { PrismaService } from "../prisma.service";
import type {
  FilterArticlesInput,
  PersonalizedFeedInput,
  SearchArticlesInput,
  UpdateNewsPreferencesInput,
} from "./dto";
@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

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
        include: {
          source: true,
          publisher: true,
        },
        orderBy: { publishedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.article.count({
        where: whereClause,
      }),
    ]);

    return {
      data: articles,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
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
        include: {
          source: true,
          publisher: true,
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.article.count({
        where: whereClause,
      }),
    ]);

    return {
      data: articles,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
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
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
      };
    }

    const whereClause: Prisma.ArticleWhereInput = {};
    const filters: Prisma.ArticleWhereInput[] = [];
    const { preferredSources, preferredCategories, preferredAuthors } =
      userPreferences;
    if (preferredSources && preferredSources.length > 0) {
      filters.push({
        source: {
          OR: [
            { id: { in: preferredSources } },
            { name: { in: preferredSources } },
          ],
        },
      });
    }

    if (preferredCategories && preferredCategories.length > 0) {
      filters.push({
        category: {
          in: preferredCategories,
        },
      });
    }

    if (preferredAuthors && preferredAuthors.length > 0) {
      filters.push({
        author: {
          in: preferredAuthors,
        },
      });
    }

    if (filters.length > 0) {
      whereClause.AND = filters;
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
      preferences: {
        sources: userPreferences.preferredSources,
        categories: userPreferences.preferredCategories,
        authors: userPreferences.preferredAuthors,
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async updateUserPreferences(
    userId: string,
    input: UpdateNewsPreferencesInput
  ) {
    const { preferredSources, preferredCategories, preferredAuthors } = input;

    const updated = await this.prisma.newsPreference.upsert({
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

    return updated;
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
        .filter((c) => c !== null) as string[],
      sources: sources,
    };
  }
}
