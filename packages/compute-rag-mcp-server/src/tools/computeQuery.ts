import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ComputeQueryInputSchema } from "../schemas/toolSchemas.js";
import { fetchWorkspaceMetadata, fetchView } from "../services/workspaceService.js";
import { buildQueryWithLlm } from "../services/llmService.js";
import { executeComputeQuery } from "../services/computeService.js";
import { Session } from "../types.js";

export function registerComputeQueryTool(
  server: McpServer,
  getSession: () => Session
): void {
  server.tool(
    "compute_query",
    "Translates a natural language request into a validated Compute API query and returns the results as a formatted markdown table.",
    ComputeQueryInputSchema.shape,
    async ({ workspaceId, viewId, naturalLanguageQuery }) => {
      const session = getSession();

      const metadata = await fetchWorkspaceMetadata(
        workspaceId,
        session.computeToken,
        session.metadataCache
      );

      const baseView = viewId
        ? await fetchView(viewId, session.computeToken, session.viewCache)
        : undefined;

      const queryJson = await buildQueryWithLlm(
        naturalLanguageQuery,
        metadata,
        session.llmKey,
        baseView
      );

      const table = await executeComputeQuery(queryJson, session.computeToken);

      return { content: [{ type: "text", text: table }] };
    }
  );
}
