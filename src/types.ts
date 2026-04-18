import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// [key: string]: unknown is required for compatibility with the MCP SDK's $loose
// Zod 4 object schemas, which generate an index signature on their inferred types.
export interface ToolResult {
  [key: string]: unknown;
  content: { type: 'text'; text: string }[];
  isError: boolean;
}

export interface ToolModule {
  definition: Tool;
  handler: (args: Record<string, unknown>) => Promise<ToolResult>;
}
