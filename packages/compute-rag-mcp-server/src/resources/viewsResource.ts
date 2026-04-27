import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchViewList } from "../services/workspaceService.js";
import { Session } from "../types.js";

export function registerViewsResource(
  server: McpServer,
  getSession: () => Session
): void {
  server.resource(
    "allegro-views",
    new ResourceTemplate(
      "allegro://workspace/{workspaceId}/views",
      { list: undefined }
    ),
    { mimeType: "application/json" },
    async (uri, { workspaceId }) => {
      const session = getSession();
      const id = Array.isArray(workspaceId) ? workspaceId[0] : workspaceId;
      const views = await fetchViewList(id, session.computeToken);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(views),
          },
        ],
      };
    }
  );
}
