import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchView } from "../services/workspaceService.js";
import { Session } from "../types.js";

export function registerViewResource(
  server: McpServer,
  getSession: () => Session
): void {
  server.resource(
    "allegro-view",
    new ResourceTemplate("allegro://view/{viewId}", { list: undefined }),
    { mimeType: "application/json" },
    async (uri, { viewId }) => {
      const session = getSession();
      const id = Array.isArray(viewId) ? viewId[0] : viewId;
      const view = await fetchView(id, session.computeToken, session.viewCache);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(view),
          },
        ],
      };
    }
  );
}
