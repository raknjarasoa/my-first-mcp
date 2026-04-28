import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchWorkspaceMetadata } from "../services/workspaceService.js";
import { Session } from "../types.js";

export function registerColumnsResource(
  server: McpServer,
  getSession: () => Session
): void {
  server.resource(
    "allegro-columns",
    new ResourceTemplate(
      "allegro://workspace/{workspaceId}/columns",
      { list: undefined }
    ),
    { mimeType: "application/json" },
    async (uri, { workspaceId }) => {
      const session = getSession();
      const id = Array.isArray(workspaceId) ? workspaceId[0] : workspaceId;
      const metadata = await fetchWorkspaceMetadata(
        id,
        session.computeToken,
        session.metadataCache
      );
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(metadata.columns),
          },
        ],
      };
    }
  );
}
