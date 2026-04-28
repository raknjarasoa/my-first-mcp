import { z } from "zod";
import { WorkspaceMetadata, ValidationResult } from "../types.js";

const ComputeQueryJsonSchema = z
  .object({
    workspaceId: z.string().min(1, "workspaceId is required"),
    metrics: z
      .array(z.string().min(1, "each metric name must be non-empty"))
      .min(1, "At least one metric is required"),
    dimensions: z.array(z.string()).default([]),
    period: z.string().min(1, "period is required (e.g. 'ytd', 'mtd', 'qtd')"),
    filters: z
      .record(z.union([z.string(), z.array(z.string())]))
      .optional(),
    topN: z
      .number()
      .int()
      .positive("topN must be a positive integer")
      .optional(),
    groupBy: z.array(z.string()).optional(),
  })
  .strict();

export function validateQueryJson(
  raw: unknown,
  metadata: WorkspaceMetadata
): ValidationResult {
  const parsed = ComputeQueryJsonSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (i) => `Field '${i.path.join(".")}': ${i.message}`
      ),
    };
  }

  const query = parsed.data;
  const errors: string[] = [];

  const allColumnNames = new Set(metadata.columns.map((c) => c.name));
  const aggregatableNames = new Set(
    metadata.columns.filter((c) => c.aggregatable).map((c) => c.name)
  );
  const groupableNames = new Set(
    metadata.columns.filter((c) => c.groupable).map((c) => c.name)
  );

  for (const m of query.metrics) {
    if (!allColumnNames.has(m)) {
      errors.push(
        `Metric '${m}' does not exist. ` +
          `Available aggregatable columns: ${[...aggregatableNames].join(", ")}`
      );
    } else if (!aggregatableNames.has(m)) {
      errors.push(
        `Column '${m}' is not aggregatable and cannot be used as a metric. ` +
          `Aggregatable columns: ${[...aggregatableNames].join(", ")}`
      );
    }
  }

  for (const d of query.dimensions) {
    if (!allColumnNames.has(d)) {
      errors.push(
        `Dimension '${d}' does not exist. ` +
          `Available groupable columns: ${[...groupableNames].join(", ")}`
      );
    } else if (!groupableNames.has(d)) {
      errors.push(
        `Column '${d}' is not groupable and cannot be used as a dimension. ` +
          `Groupable columns: ${[...groupableNames].join(", ")}`
      );
    }
  }

  const validPeriods = metadata.validValues["period"] ?? [];
  if (validPeriods.length > 0 && !validPeriods.includes(query.period)) {
    errors.push(
      `Period '${query.period}' is invalid. Valid periods: ${validPeriods.join(", ")}`
    );
  }

  if (query.filters) {
    for (const [key, value] of Object.entries(query.filters)) {
      if (!allColumnNames.has(key)) {
        errors.push(`Filter key '${key}' is not a known column`);
        continue;
      }
      const validVals = metadata.validValues[key];
      if (validVals) {
        const requested = Array.isArray(value) ? value : [value];
        for (const v of requested) {
          if (!validVals.includes(v)) {
            errors.push(
              `Filter '${key}=${v}' is invalid. ` +
                `Valid values for '${key}': ${validVals.join(", ")}`
            );
          }
        }
      }
    }
  }

  if (query.groupBy) {
    for (const g of query.groupBy) {
      if (!query.dimensions.includes(g)) {
        errors.push(
          `groupBy column '${g}' must also appear in the dimensions array`
        );
      }
    }
  }

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors };
}
