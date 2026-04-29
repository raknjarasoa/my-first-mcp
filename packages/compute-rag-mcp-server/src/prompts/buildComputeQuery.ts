import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchWorkspaceMetadata, fetchView } from "../services/workspaceService.js";
import { buildSystemPrompt } from "../utils/prompt.js";
import { Session } from "../types.js";

export function registerBuildComputeQueryPrompt(
  server: McpServer,
  getSession: () => Session
): void {
  server.prompt(
    "build_compute_query",
    "Returns a fully grounded system prompt for building a compute query.",
    {
      workspaceId: z.string().describe("Workspace ID, e.g. 'ws-finance-2024'"),
      viewId: z.string().optional().describe("Optional saved view ID."),
      naturalLanguageQuery: z.string().describe("The user query"),
    },
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

      const systemPrompt = buildSystemPrompt(metadata, baseView);

      return {
        messages: [
          { role: "user", content: { type: "text", text: systemPrompt } },
          { role: "user", content: { type: "text", text: naturalLanguageQuery } },
        ],
      };
    }
  );
}
