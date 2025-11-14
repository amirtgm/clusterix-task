import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDateLabel } from "@/lib/date";
import type {
  ArticleFilterState,
  AvailableFiltersResponse,
  SortField,
  SortOrder,
} from "@/lib/news";
import { FilterDropdown } from "./filter-dropdown";

const sortFields: SortField[] = ["publishedAt", "fetchedAt", "title"];
const sortOrders: SortOrder[] = ["asc", "desc"];

type NewsFiltersProps = {
  filters: ArticleFilterState;
  availableFilters?: AvailableFiltersResponse;
  filtersPending: boolean;
  disabled: boolean;
  isSaving: boolean;
  onDateChange: (key: "startDate" | "endDate", value: string) => void;
  onToggleCategory: (value: string) => void;
  onToggleSource: (value: string) => void;
  onSortField: (value: SortField) => void;
  onSortOrder: (value: SortOrder) => void;
  onClearDates: () => void;
  onSearchChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
};

export function NewsFilters({
  filters,
  availableFilters,
  filtersPending,
  disabled,
  isSaving,
  onDateChange,
  onToggleCategory,
  onToggleSource,
  onSortField,
  onSortOrder,
  onClearDates,
  onSearchChange,
  onSave,
  onReset,
}: NewsFiltersProps) {
  const dateLabel = getDateLabel(filters);
  const categoryLabel =
    filters.categories.length > 0
      ? `Categories (${filters.categories.length})`
      : "All categories";
  const sourceLabel =
    filters.sources.length > 0
      ? `Sources (${filters.sources.length})`
      : "All sources";
  const sortLabel = `Sort • ${filters.sortBy}`;
  const orderLabel = `Order • ${filters.sortOrder}`;

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle>Filters</CardTitle>
        <CardDescription>
          Filters load from your saved preferences before querying the feed.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3 py-4">
        <div className="flex flex-1 min-w-[220px] items-center gap-2">
          <Label htmlFor="news-search" className="text-sm font-medium">
            Search
          </Label>
          <Input
            id="news-search"
            placeholder="Find articles"
            value={filters.searchTerm}
            disabled={disabled}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <FilterDropdown
          label={dateLabel}
          disabled={disabled}
          contentClassName="w-72"
        >
          <div className="space-y-3 p-1">
            <div className="space-y-1.5">
              <Label htmlFor="start-date">Start date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                disabled={disabled}
                onChange={(event) =>
                  onDateChange("startDate", event.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-date">End date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                disabled={disabled}
                onChange={(event) =>
                  onDateChange("endDate", event.target.value)
                }
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={onClearDates}
              >
                Clear
              </Button>
            </div>
          </div>
        </FilterDropdown>

        <FilterDropdown
          label={categoryLabel}
          disabled={disabled || filtersPending}
          contentClassName="w-56"
        >
          <DropdownMenuLabel>Categories</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableFilters?.categories?.length ? (
            availableFilters.categories.map((category) => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={filters.categories.includes(category)}
                disabled={disabled}
                onCheckedChange={() => onToggleCategory(category)}
              >
                {category}
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              No categories.
            </p>
          )}
        </FilterDropdown>

        <FilterDropdown
          label={sourceLabel}
          disabled={disabled || filtersPending}
          contentClassName="w-64"
        >
          <DropdownMenuLabel>Sources</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableFilters?.sources?.length ? (
            availableFilters.sources.map((source) => (
              <DropdownMenuCheckboxItem
                key={source.id}
                checked={filters.sources.includes(source.id)}
                disabled={disabled}
                onCheckedChange={() => onToggleSource(source.id)}
              >
                {source.name}
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              No sources yet.
            </p>
          )}
        </FilterDropdown>

        <FilterDropdown label={sortLabel} disabled={disabled}>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={filters.sortBy}
            onValueChange={(value) => onSortField(value as SortField)}
          >
            {sortFields.map((field) => (
              <DropdownMenuRadioItem key={field} value={field}>
                {field}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </FilterDropdown>

        <FilterDropdown label={orderLabel} disabled={disabled}>
          <DropdownMenuLabel>Order</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={filters.sortOrder}
            onValueChange={(value) => onSortOrder(value as SortOrder)}
          >
            {sortOrders.map((order) => (
              <DropdownMenuRadioItem key={order} value={order}>
                {order}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </FilterDropdown>

        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || isSaving}
            onClick={onSave}
          >
            {isSaving ? "Saving…" : "Save filters"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={onReset}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
