import { z } from "zod";

export const SessionInitHeadersSchema = z
  .object({
    "x-compute-token": z
      .string()
      .min(1, "x-compute-token header is required")
      .describe("Nominative Compute API Bearer token for this user"),

    "x-llm-key": z
      .string()
      .min(1, "x-llm-key header is required")
      .describe("Nominative on-prem LLM API key for this user"),
  })
  .passthrough();
