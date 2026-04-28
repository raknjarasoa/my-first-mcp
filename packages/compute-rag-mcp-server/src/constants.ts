export const COMPUTE_BASE_URL =
  process.env.COMPUTE_BASE_URL ?? "https://compute.internal";

export const LLM_BASE_URL =
  process.env.LLM_BASE_URL ?? "https://llm.internal/v1";

export const LLM_MODEL = process.env.LLM_MODEL ?? "qwen3-coder";

export const LLM_MAX_RETRIES = 2;

export const SESSION_TTL_MS =
  Number(process.env.SESSION_TTL_MS ?? 28_800_000); // 8h

export const METADATA_CACHE_TTL_MS =
  Number(process.env.METADATA_CACHE_TTL_MS ?? 1_800_000); // 30min

export const PORT = Number(process.env.PORT ?? 3000);
