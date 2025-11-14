import type { ArticleFilterState } from "./news";

export function getDateLabel(state: ArticleFilterState): string {
  if (state.startDate && state.endDate) {
    return `Date • ${state.startDate} → ${state.endDate}`;
  }
  if (state.startDate) {
    return `Date • From ${state.startDate}`;
  }
  if (state.endDate) {
    return `Date • Until ${state.endDate}`;
  }
  return "Date range";
}
