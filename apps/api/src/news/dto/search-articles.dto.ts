import { createZodDto } from "nestjs-zod";
import { z } from "zod";

// Search schema with keyword support
const SearchArticlesSchema = z.object({
  keyword: z
    .string()
    .min(1, "Keyword must not be empty")
    .max(500, "Keyword must not exceed 500 characters"),
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

export class SearchArticlesDto extends createZodDto(SearchArticlesSchema) {}

export type SearchArticlesInput = z.infer<typeof SearchArticlesSchema>;
