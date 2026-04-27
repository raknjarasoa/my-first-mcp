import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Session } from "./types.js";
import { registerComputeQueryTool } from "./tools/computeQuery.js";
import { registerWorkspaceResource } from "./resources/workspaceResource.js";
import { registerColumnsResource } from "./resources/columnsResource.js";
import { registerViewsResource } from "./resources/viewsResource.js";
import { registerViewResource } from "./resources/viewResource.js";
import { registerBuildComputeQueryPrompt } from "./prompts/buildComputeQuery.js";

export function createMcpServer(getSession: () => Session): McpServer {
  const server = new McpServer({
    name: "compute-rag-mcp-server",
    version: "1.0.0",
  });

  registerComputeQueryTool(server, getSession);

  registerWorkspaceResource(server, getSession);
  registerColumnsResource(server, getSession);
  registerViewsResource(server, getSession);
  registerViewResource(server, getSession);

  registerBuildComputeQueryPrompt(server, getSession);

  return server;
}
