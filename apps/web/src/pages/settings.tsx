import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FilterChip } from "@/components/filter-chip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAvailableNewsFilters, useNewsPreferences } from "@/hooks/use-news";
import { fetchApi } from "@/lib/fetch-client";
import type { NewsPreferencesPayload, UserNewsPreferences } from "@/lib/news";
import { newsKeys } from "@/lib/news";

const emptyPreferences: UserNewsPreferences = {
  sources: [],
  categories: [],
  authors: [],
};

export function SettingsPage() {
  const [draft, setDraft] = useState<UserNewsPreferences>(emptyPreferences);
  const [authorsInput, setAuthorsInput] = useState("");
  const queryClient = useQueryClient();

  const { data: availableFilters, isPending: filtersPending } =
    useAvailableNewsFilters();
  const preferencesQuery = useNewsPreferences();

  const serverPreferences = preferencesQuery.data?.preferences;

  useEffect(() => {
    if (!preferencesQuery.isSuccess) {
      return;
    }

    if (!serverPreferences) {
      setDraft(emptyPreferences);
      setAuthorsInput("");
      return;
    }

    const { sources = [], categories = [], authors = [] } = serverPreferences;

    setDraft({
      sources: [...sources],
      categories: [...categories],
      authors: [...authors],
    });
    setAuthorsInput(authors.join(", "));
  }, [preferencesQuery.isSuccess, serverPreferences]);

  const mutation = useMutation({
    mutationFn: (payload: NewsPreferencesPayload) =>
      fetchApi("/news/preferences", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success("Preferences saved");
      queryClient.invalidateQueries({
        queryKey: newsKeys.preferences({ limit: 1, offset: 0 }),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isSaving = mutation.isPending;

  const togglePreference = useCallback(
    (field: "sources" | "categories", value: string) => {
      setDraft((prev) => {
        const exists = prev[field].includes(value);
        const values = exists
          ? prev[field].filter((item) => item !== value)
          : [...prev[field], value];
        return { ...prev, [field]: values };
      });
    },
    []
  );

  const handleAuthorsChange = useCallback((value: string) => {
    setAuthorsInput(value);
    const authors = value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    setDraft((prev) => ({ ...prev, authors }));
  }, []);

  const categorySummary = useMemo(
    () => `${draft.categories.length} categories`,
    [draft.categories.length]
  );

  const sourceSummary = useMemo(
    () => `${draft.sources.length} sources`,
    [draft.sources.length]
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      mutation.mutate({
        preferredSources: draft.sources,
        preferredCategories: draft.categories,
        preferredAuthors: draft.authors,
      });
    },
    [draft, mutation]
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Fine-tune the news feed by choosing exactly what matters.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle>News preferences</CardTitle>
            <CardDescription>
              Pick preferred sources, categories, and authors.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 py-6">
            <FieldSet>
              <FieldLegend>Categories</FieldLegend>
              <FieldDescription>{categorySummary}</FieldDescription>
              {filtersPending ? (
                <p className="text-sm text-muted-foreground">
                  Loading categories…
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableFilters?.categories?.length ? (
                    availableFilters.categories.map((category) => (
                      <FilterChip
                        key={category}
                        label={category}
                        active={draft.categories.includes(category)}
                        onClick={() => togglePreference("categories", category)}
                        disabled={isSaving}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Categories will appear once data is available.
                    </p>
                  )}
                </div>
              )}
            </FieldSet>

            <FieldSet>
              <FieldLegend>Sources</FieldLegend>
              <FieldDescription>{sourceSummary}</FieldDescription>
              {filtersPending ? (
                <p className="text-sm text-muted-foreground">
                  Loading sources…
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableFilters?.sources?.length ? (
                    availableFilters.sources.map((source) => (
                      <FilterChip
                        key={source.id}
                        label={source.name}
                        active={draft.sources.includes(source.id)}
                        onClick={() => togglePreference("sources", source.id)}
                        disabled={isSaving}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Connect a source to start curating.
                    </p>
                  )}
                </div>
              )}
            </FieldSet>

            <FieldSet>
              <FieldLegend>Authors</FieldLegend>
              <Field>
                <FieldLabel>Comma-separated list</FieldLabel>
                <FieldContent>
                  <Input
                    value={authorsInput}
                    onChange={(event) =>
                      handleAuthorsChange(event.target.value)
                    }
                    placeholder="e.g. Alice Doe, Bob Ray"
                    disabled={isSaving}
                  />
                </FieldContent>
              </Field>
            </FieldSet>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t py-4">
            <p className="text-xs text-muted-foreground">
              Changes sync immediately after saving.
            </p>
            <Button type="submit" disabled={isSaving}>
              {mutation.isPending ? "Saving…" : "Save preferences"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
