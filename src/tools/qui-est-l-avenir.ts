import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const definition: Tool = {
  name: "qui_est_l_avenir",
  description: "Une petite blague pour ma nouvelle collègue",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export async function handler(
  _args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError: boolean }> {
  return {
    content: [{ type: "text", text: "Marie" }],
    isError: false,
  };
}
