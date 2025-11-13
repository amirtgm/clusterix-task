import { createZodDto } from "nestjs-zod";
import { z } from "zod";

// Personalized feed schema
const PersonalizedFeedSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .optional()
    .default(20),
  offset: z
    .number()
    .int()
    .min(0, "Offset must be non-negative")
    .optional()
    .default(0),
  sortBy: z
    .enum(["publishedAt", "fetchedAt"])
    .optional()
    .default("publishedAt")
    .describe("Field to sort by"),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("desc")
    .describe("Sort order (ascending or descending)"),
});

export class PersonalizedFeedDto extends createZodDto(PersonalizedFeedSchema) {}

export type PersonalizedFeedInput = z.infer<typeof PersonalizedFeedSchema>;

const UpdateNewsPreferencesSchema = z.object({
  preferredSources: z
    .array(z.string().min(1))
    .optional()
    .describe("Array of preferred source IDs"),
  preferredCategories: z
    .array(z.string().min(1))
    .optional()
    .describe("Array of preferred categories"),
  preferredAuthors: z
    .array(z.string().min(1))
    .optional()
    .describe("Array of preferred authors"),
});

export class UpdateNewsPreferencesDto extends createZodDto(
  UpdateNewsPreferencesSchema
) {}

export type UpdateNewsPreferencesInput = z.infer<
  typeof UpdateNewsPreferencesSchema
>;
