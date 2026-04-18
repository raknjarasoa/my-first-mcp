import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolResult } from '../types.js';

export const definition: Tool = {
  name: 'qui_est_l_avenir',
  description: 'Reveals who is the future of the team.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handler(_args: Record<string, unknown>): Promise<ToolResult> {
  return {
    content: [{ type: 'text', text: 'Marie' }],
    isError: false,
  };
}
