import { ComputeResult } from "../types.js";

export function formatTable(result: ComputeResult): string {
  if (result.rows.length === 0) {
    return "No results returned by the Compute API.";
  }

  const headers = Object.keys(result.rows[0]);
  const header = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const rows = result.rows.map(
    (row) => `| ${headers.map((h) => String(row[h] ?? "")).join(" | ")} |`
  );

  return [
    header,
    separator,
    ...rows,
    "",
    `_${result.totalRows} total rows — ${result.executionTimeMs}ms_`,
  ].join("\n");
}
