export const NEWS_AGGREGATOR_QUEUE = "news-aggregator";
export const FETCH_LATEST_JOB = "fetch-latest";

export type ImportNewsJobPayload = {
  requestedAt: string;
  forceBackfillDays?: number;
  sinceOverrideIso?: string;
};
