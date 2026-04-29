import { ComputeQuery, ComputeResult } from "../types.js";
import { COMPUTE_BASE_URL } from "../constants.js";
import { formatTable } from "../utils/formatter.js";

export async function executeComputeQuery(
  query: ComputeQuery,
  computeToken: string
): Promise<string> {
  const res = await fetch(`${COMPUTE_BASE_URL}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${computeToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(query),
  });

  if (!res.ok) {
    throw new Error(`Compute API error ${res.status}: ${await res.text()}`);
  }

  const result = (await res.json()) as ComputeResult;
  return formatTable(result);
}
