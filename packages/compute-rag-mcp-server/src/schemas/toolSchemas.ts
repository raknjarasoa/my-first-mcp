import { z } from "zod";

export const ComputeQueryInputSchema = z
  .object({
    workspaceId: z
      .string()
      .min(1, "workspaceId must be a non-empty string")
      .describe("Workspace ID to query, e.g. 'ws-finance-2024'"),

    viewId: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Optional: saved view ID to use as a starting template. " +
          "Strongly recommended for complex queries. " +
          "Use allegro://workspace/{id}/views to list available views."
      ),

    naturalLanguageQuery: z
      .string()
      .min(5, "Query must be at least 5 characters")
      .max(1000, "Query must not exceed 1000 characters")
      .describe(
        "Plain English description of the data to retrieve. " +
          "Example: 'top 3 buckets ytd for mdscode mrx booking grouped by region and country'"
      ),
  })
  .strict();

export type ComputeQueryInput = z.infer<typeof ComputeQueryInputSchema>;
