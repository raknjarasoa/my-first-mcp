export type ContentItem =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string };

// [key: string]: unknown is required for compatibility with the MCP SDK's $loose
// Zod 4 object schemas, which generate an index signature on their inferred types.
export interface ToolResult {
  [key: string]: unknown;
  content: ContentItem[];
  isError: boolean;
}
