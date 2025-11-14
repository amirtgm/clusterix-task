export type SortField = "publishedAt" | "fetchedAt" | "title";
export type SortOrder = "asc" | "desc";

export type ArticleFilterState = {
  searchTerm: string;
  startDate: string;
  endDate: string;
  categories: string[];
  sources: string[];
  sortBy: SortField;
  sortOrder: SortOrder;
};

export const defaultArticleFilterState: ArticleFilterState = {
  searchTerm: "",
  startDate: "",
  endDate: "",
  categories: [],
  sources: [],
  sortBy: "publishedAt",
  sortOrder: "desc",
};

export type SourceOption = {
  id: string;
  name: string;
};

export type Article = {
  id: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  author?: string | null;
  category?: string | null;
  url: string;
  publishedAt: string;
  source: SourceOption;
  publisher?: {
    id: string;
    name: string | null;
    domain?: string | null;
  } | null;
};

export type ArticleCollectionResponse = {
  data: Article[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type AvailableFiltersResponse = {
  categories: string[];
  sources: SourceOption[];
};

export type ArticleFilterParams = {
  startDate?: string;
  endDate?: string;
  categories?: string[];
  sources?: string[];
  sortBy?: SortField;
  sortOrder?: SortOrder;
  limit: number;
  offset: number;
};

export type UserNewsPreferences = {
  sources: string[];
  categories: string[];
  authors: string[];
};

export type PersonalizedFeedResponse = ArticleCollectionResponse & {
  preferences?: UserNewsPreferences;
};

export type NewsPreferencesPayload = {
  preferredSources?: string[];
  preferredCategories?: string[];
  preferredAuthors?: string[];
};

export const newsKeys = {
  availableFilters: ["news", "filters"] as const,
  articles: (params: ArticleFilterParams) => ["news", "list", params] as const,
  search: (keyword: string, limit: number, offset: number) =>
    ["news", "search", keyword, limit, offset] as const,
  preferences: (params?: { limit: number; offset: number }) =>
    ["news", "preferences", params] as const,
};

export function buildArticleFilterParams(
  state: ArticleFilterState,
  offset: number,
  limit: number
): ArticleFilterParams {
  return {
    startDate: state.startDate
      ? new Date(state.startDate).toISOString()
      : undefined,
    endDate: state.endDate ? new Date(state.endDate).toISOString() : undefined,
    categories: state.categories.length ? state.categories : undefined,
    sources: state.sources.length ? state.sources : undefined,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    limit,
    offset,
  };
}
