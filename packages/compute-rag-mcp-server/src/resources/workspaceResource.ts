import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchWorkspaceMetadata } from "../services/workspaceService.js";
import { Session } from "../types.js";

export function registerWorkspaceResource(
  server: McpServer,
  getSession: () => Session
): void {
  server.resource(
    "allegro-workspace",
    new ResourceTemplate("allegro://workspace/{workspaceId}", { list: undefined }),
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
            text: JSON.stringify({
              workspaceId: metadata.workspaceId,
              name: metadata.name,
            }),
          },
        ],
      };
    }
  );
}
