import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Import all tools
import * as add from "./tools/add.js";
import * as getPokemon from "./tools/get-pokemon.js";
import * as getWeather from "./tools/get-weather.js";
import * as quiEstLAvenir from "./tools/qui-est-l-avenir.js";

// ── Tool registry ──────────────────────────────────────────────────────────
// Each tool module exports { definition, handler }.
// To add a new tool, create a file in src/tools/ and add it to this array.

interface ToolModule {
  definition: Tool;
  handler: (
    args: Record<string, unknown>
  ) => Promise<{ content: { type: "text"; text: string }[]; isError: boolean }>;
}

const tools: ToolModule[] = [add, getPokemon, getWeather, quiEstLAvenir];

const toolMap = new Map<string, ToolModule>(
  tools.map((t) => [t.definition.name, t])
);

// ── Server factory ─────────────────────────────────────────────────────────
// Returns a new Server instance per session — required because each
// StreamableHTTPServerTransport is 1:1 with a Server instance.

export function createMcpServer(): Server {
  const server = new Server(
    {
      name: "my-first-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List all registered tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => t.definition),
  }));

  // Dispatch tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = toolMap.get(name);

    if (!tool) {
      return {
        content: [{ type: "text", text: `Tool inconnu: ${name}` }],
        isError: true,
      };
    }

    try {
      return await tool.handler(args ?? {});
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      return {
        content: [{ type: "text", text: `Erreur: ${errorMessage}` }],
        isError: true,
      };
    }
  });

  return server;
}
