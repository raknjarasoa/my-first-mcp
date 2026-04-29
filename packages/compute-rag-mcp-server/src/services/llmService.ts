import OpenAI from "openai";
import { WorkspaceMetadata, SavedView, ComputeQuery } from "../types.js";
import { buildSystemPrompt } from "../utils/prompt.js";
import { validateQueryJson } from "../schemas/querySchemas.js";
import { LLM_BASE_URL, LLM_MODEL, LLM_MAX_RETRIES } from "../constants.js";

function createClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey, baseURL: LLM_BASE_URL });
}

export async function buildQueryWithLlm(
  naturalLanguageQuery: string,
  metadata: WorkspaceMetadata,
  llmKey: string,
  baseView?: SavedView
): Promise<ComputeQuery> {
  const client = createClient(llmKey);
  const systemPrompt = buildSystemPrompt(metadata, baseView);
  let lastErrors: string[] = [];

  for (let attempt = 0; attempt <= LLM_MAX_RETRIES; attempt++) {
    const userMessage =
      attempt === 0
        ? naturalLanguageQuery
        : `${naturalLanguageQuery}\n\nYour previous output had these validation errors:\n` +
          lastErrors.map((e) => `- ${e}`).join("\n") +
          `\n\nCorrect all errors and output valid JSON only.`;

    const response = await client.chat.completions.create({
      model: LLM_MODEL,
      temperature: 0,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      lastErrors = [`Output was not valid JSON: ${cleaned.slice(0, 300)}`];
      continue;
    }

    const validation = validateQueryJson(parsed, metadata);
    if (validation.ok) return parsed as ComputeQuery;
    lastErrors = validation.errors;
  }

  throw new Error(
    `LLM failed to produce a valid query after ${LLM_MAX_RETRIES + 1} attempts.\n` +
      `Last validation errors:\n${lastErrors.map((e) => `- ${e}`).join("\n")}`
  );
}
