import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const stringArray = z
  .union([z.string().min(1), z.array(z.string().min(1))])
  .transform((value) => (Array.isArray(value) ? value : [value]));

const FilterArticlesSchema = z.object({
  startDate: z.iso
    .datetime()
    .optional()
    .describe("Start date for filtering articles (ISO 8601 format)"),
  endDate: z.iso
    .datetime()
    .optional()
    .describe("End date for filtering articles (ISO 8601 format)"),
  categories: stringArray
    .optional()
    .describe("Array of categories to filter by"),
  sources: stringArray
    .optional()
    .describe("Array of source IDs or names to filter by"),
  sortBy: z
    .enum(["publishedAt", "fetchedAt", "title"])
    .optional()
    .default("publishedAt")
    .describe("Field to sort by"),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("desc")
    .describe("Sort order (ascending or descending)"),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .optional()
    .default(20),
  offset: z.coerce
    .number()
    .int()
    .min(0, "Offset must be non-negative")
    .optional()
    .default(0),
});

export class FilterArticlesDto extends createZodDto(FilterArticlesSchema) {}

export type FilterArticlesInput = z.infer<typeof FilterArticlesSchema>;
