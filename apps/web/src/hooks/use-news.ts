import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/fetch-client";
import type {
  ArticleCollectionResponse,
  ArticleFilterParams,
  AvailableFiltersResponse,
  PersonalizedFeedResponse,
} from "@/lib/news";
import { newsKeys } from "@/lib/news";

export function useAvailableNewsFilters() {
  return useQuery<AvailableFiltersResponse>({
    queryKey: newsKeys.availableFilters,
    queryFn: () =>
      fetchApi<AvailableFiltersResponse>("/news/filters/available"),
    staleTime: 1000 * 60 * 60,
  });
}

export function useArticleCollection(
  params: ArticleFilterParams,
  options?: { enabled?: boolean }
) {
  return useQuery<ArticleCollectionResponse>({
    queryKey: newsKeys.articles(params),
    queryFn: () =>
      fetchApi<ArticleCollectionResponse>("/news/filter", { params }),
    placeholderData: (previousData) => previousData,
    enabled: options?.enabled ?? true,
  });
}

export function useSearchArticles(
  keyword: string,
  limit: number,
  offset: number,
  options?: { enabled?: boolean }
) {
  return useQuery<ArticleCollectionResponse>({
    queryKey: newsKeys.search(keyword, limit, offset),
    queryFn: () =>
      fetchApi<ArticleCollectionResponse>("/news/search", {
        params: { keyword, limit, offset },
      }),
    enabled: options?.enabled ?? true,
  });
}

export function useNewsPreferences(limit = 1, offset = 0) {
  return useQuery<PersonalizedFeedResponse>({
    queryKey: newsKeys.preferences({ limit, offset }),
    queryFn: () =>
      fetchApi<PersonalizedFeedResponse>("/news/feed/personalized", {
        params: { limit, offset },
      }),
    staleTime: 1000 * 60,
  });
}
