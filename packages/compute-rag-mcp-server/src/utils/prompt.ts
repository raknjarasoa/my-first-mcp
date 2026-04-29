import { WorkspaceMetadata, SavedView } from "../types.js";

export function buildSystemPrompt(
  metadata: WorkspaceMetadata,
  baseView?: SavedView
): string {
  const aggregatableColumns = metadata.columns
    .filter((c) => c.aggregatable)
    .map(
      (c) =>
        `  - ${c.name} (label: "${c.label}", dataType: ${c.dataType}): ${c.description}`
    )
    .join("\n");

  const groupableColumns = metadata.columns
    .filter((c) => c.groupable)
    .map(
      (c) =>
        `  - ${c.name} (label: "${c.label}", dataType: ${c.dataType}): ${c.description}`
    )
    .join("\n");

  const validValues = Object.entries(metadata.validValues)
    .map(([key, values]) => `  - ${key}: [${values.join(", ")}]`)
    .join("\n");

  const exampleAgg =
    metadata.columns.find((c) => c.aggregatable)?.name ?? "metric_name";
  const exampleGrp =
    metadata.columns.find((c) => c.groupable)?.name ?? "dimension_name";
  const examplePeriod = metadata.validValues["period"]?.[0] ?? "ytd";

  const modeSection = baseView
    ? `## BASE VIEW TO PATCH
You are given a saved view as a starting template. Modify ONLY the fields the user's
request requires. Keep all other fields from the base view unchanged.

View name: "${baseView.name}"${baseView.description ? `\nDescription: ${baseView.description}` : ""}

Base compute payload:
\`\`\`json
${JSON.stringify(baseView.compute, null, 2)}
\`\`\``
    : `## MODE
No base view provided. Build the full compute payload from scratch using ONLY
the schema listed below.`;

  return `You are a Compute Query Builder for workspace "${metadata.name}" (id: "${metadata.workspaceId}").
Your only job is to output a valid JSON compute payload.

## STRICT RULES — violating any rule produces an invalid query:
1. Output ONLY a raw JSON object. No markdown fences, no explanation, no comments.
2. Use ONLY column names listed in AGGREGATABLE COLUMNS or GROUPABLE COLUMNS below.
3. Only aggregatable columns may appear in "metrics".
4. Only groupable columns may appear in "dimensions" and "groupBy".
5. "groupBy" must be a strict subset of "dimensions" — every entry in groupBy must also be in dimensions.
6. "period" must be exactly one of the values listed in VALID VALUES below.
7. Filter keys must be known column names. Filter values must match VALID VALUES for that key.
8. Never invent a column name, period value, or filter value not listed in this prompt.

${modeSection}

## AGGREGATABLE COLUMNS (use in "metrics" only):
${aggregatableColumns}

## GROUPABLE COLUMNS (use in "dimensions" and "groupBy" only):
${groupableColumns}

## VALID VALUES PER FIELD:
${validValues}

## OUTPUT JSON SCHEMA:
{
  "workspaceId": "${metadata.workspaceId}",  // required
  "metrics": ["${exampleAgg}"],              // required, non-empty
  "dimensions": ["${exampleGrp}"],           // optional
  "period": "${examplePeriod}",             // required
  "filters": { "${exampleGrp}": "value" },  // optional
  "topN": 3,                                // optional, positive integer
  "groupBy": ["${exampleGrp}"]             // optional, subset of dimensions
}`;
}
