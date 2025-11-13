import type { Prisma } from '../../prisma/generated/prisma/client';

export const SOURCE_NAMES = ['newsapi', 'guardian', 'nyt', 'optimizely'] as const;

export type SourceName = (typeof SOURCE_NAMES)[number];

export type NormalizedPublisher = {
  name: string;
  domain: string;
};

export type NormalizedArticle = {
  sourceName: SourceName;
  sourceArticleId: string;
  url: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  language?: string | null;
  category?: string | null;
  publishedAt: Date;
  raw?: Prisma.JsonValue;
  publisher?: NormalizedPublisher | null;
};

export interface NewsSourceAdapter {
  readonly name: SourceName;
  fetchSince(since: Date): Promise<NormalizedArticle[]>;
}
