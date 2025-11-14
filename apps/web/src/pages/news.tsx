import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { NewsArticleCard } from "@/components/news/news-article-card";
import { NewsFilters } from "@/components/news/news-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useArticleCollection,
  useAvailableNewsFilters,
  useNewsPreferences,
  useSearchArticles,
} from "@/hooks/use-news";
import { fetchApi } from "@/lib/fetch-client";
import type { ArticleFilterState, SortField, SortOrder } from "@/lib/news";
import {
  buildArticleFilterParams,
  defaultArticleFilterState,
  newsKeys,
} from "@/lib/news";

const PAGE_SIZE = 10;
const PREFERENCES_QUERY_PARAMS = { limit: 1, offset: 0 } as const;

export function NewsPage() {
  const [filters, setFilters] = useState<ArticleFilterState>(
    defaultArticleFilterState
  );
  const [page, setPage] = useState(0);
  const [initialFiltersApplied, setInitialFiltersApplied] = useState(false);
  const queryClient = useQueryClient();

  const params = useMemo(
    () => buildArticleFilterParams(filters, page * PAGE_SIZE, PAGE_SIZE),
    [filters, page]
  );

  const { data: availableFilters, isPending: filtersPending } =
    useAvailableNewsFilters();
  const isSearching = filters.searchTerm.trim().length > 0;
  const searchKeyword = filters.searchTerm.trim();
  const {
    data: filteredArticles,
    isPending: filteredPending,
    isFetching: filteredFetching,
  } = useArticleCollection(params, {
    enabled: initialFiltersApplied && !isSearching,
  });
  const {
    data: searchArticles,
    isPending: searchPending,
    isFetching: searchFetching,
  } = useSearchArticles(searchKeyword, PAGE_SIZE, page * PAGE_SIZE, {
    enabled: initialFiltersApplied && isSearching,
  });
  const preferencesQuery = useNewsPreferences(
    PREFERENCES_QUERY_PARAMS.limit,
    PREFERENCES_QUERY_PARAMS.offset
  );

  useEffect(() => {
    if (initialFiltersApplied || preferencesQuery.isPending) {
      return;
    }

    const preferences = preferencesQuery.data?.preferences;
    if (preferences) {
      setFilters((prev) => ({
        ...prev,
        categories: preferences.categories ?? [],
        sources: preferences.sources ?? [],
      }));
    }

    setInitialFiltersApplied(true);
  }, [
    initialFiltersApplied,
    preferencesQuery.data,
    preferencesQuery.isPending,
  ]);

  const applyFilterChanges = useCallback(
    (updater: (prev: ArticleFilterState) => ArticleFilterState) => {
      let changed = false;
      setFilters((prev) => {
        const next = updater(prev);
        if (next === prev) {
          return prev;
        }
        changed = true;
        return next;
      });
      if (changed) {
        setPage(0);
      }
    },
    []
  );

  const toggleFilterValue = useCallback(
    (field: "categories" | "sources", value: string) => {
      applyFilterChanges((prev) => {
        const exists = prev[field].includes(value);
        const values = exists
          ? prev[field].filter((entry) => entry !== value)
          : [...prev[field], value];
        return { ...prev, [field]: values };
      });
    },
    [applyFilterChanges]
  );

  const handleDateChange = useCallback(
    (key: "startDate" | "endDate", value: string) => {
      applyFilterChanges((prev) =>
        prev[key] === value ? prev : { ...prev, [key]: value }
      );
    },
    [applyFilterChanges]
  );

  const handleSortField = useCallback(
    (value: SortField) => {
      applyFilterChanges((prev) =>
        prev.sortBy === value ? prev : { ...prev, sortBy: value }
      );
    },
    [applyFilterChanges]
  );

  const handleSortOrder = useCallback(
    (value: SortOrder) => {
      applyFilterChanges((prev) =>
        prev.sortOrder === value ? prev : { ...prev, sortOrder: value }
      );
    },
    [applyFilterChanges]
  );

  const handleSearchChange = (value: string) => {
    applyFilterChanges((prev) =>
      prev.searchTerm === value ? prev : { ...prev, searchTerm: value }
    );
  };

  const clearDates = () => {
    applyFilterChanges((prev) => {
      if (!prev.startDate && !prev.endDate) {
        return prev;
      }
      return { ...prev, startDate: "", endDate: "" };
    });
  };

  const resetFilters = () => {
    setFilters({ ...defaultArticleFilterState });
    setPage(0);
  };

  const savePreferences = useMutation({
    mutationFn: () =>
      fetchApi("/news/preferences", {
        method: "POST",
        body: JSON.stringify({
          preferredCategories: filters.categories,
          preferredSources: filters.sources,
        }),
      }),
    onSuccess: () => {
      toast.success("Filters saved");
      queryClient.invalidateQueries({
        queryKey: newsKeys.preferences(PREFERENCES_QUERY_PARAMS),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handlePreviousPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const filtersReady = initialFiltersApplied;
  const activeQuery = isSearching ? searchArticles : filteredArticles;
  const articles = activeQuery?.data ?? [];
  const pagination = activeQuery?.pagination;
  const canGoBack = page > 0;
  const canGoForward = Boolean(pagination?.hasMore);

  const filterControlsDisabled = !filtersReady;
  const showArticlesLoading =
    !filtersReady || (isSearching ? searchPending : filteredPending);
  const isSavingFilters = savePreferences.isPending;
  const articlesFetching = isSearching ? searchFetching : filteredFetching;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Article Explorer
        </h1>
        <p className="text-sm text-muted-foreground">
          Adjust filters to update the feed instantly.
        </p>
      </header>

      <NewsFilters
        filters={filters}
        availableFilters={availableFilters}
        filtersPending={filtersPending}
        disabled={filterControlsDisabled}
        isSaving={isSavingFilters}
        onDateChange={handleDateChange}
        onToggleCategory={(value) => toggleFilterValue("categories", value)}
        onToggleSource={(value) => toggleFilterValue("sources", value)}
        onSortField={handleSortField}
        onSortOrder={handleSortOrder}
        onClearDates={clearDates}
        onSearchChange={handleSearchChange}
        onSave={() => savePreferences.mutate()}
        onReset={resetFilters}
      />

      <div className="flex flex-col gap-4">
        {showArticlesLoading ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              Loading your personalized feed…
            </CardContent>
          </Card>
        ) : articles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              Nothing matches the current filters.
            </CardContent>
          </Card>
        ) : (
          articles.map((article) => (
            <NewsArticleCard key={article.id} article={article} />
          ))
        )}

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreviousPage}
            disabled={!canGoBack || articlesFetching}
          >
            Previous
          </Button>
          <p className="text-xs text-muted-foreground">
            Page {page + 1}
            {pagination?.total
              ? ` • ${pagination.total} articles tracked`
              : null}
          </p>
          <Button
            type="button"
            onClick={handleNextPage}
            disabled={!canGoForward || articlesFetching}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
