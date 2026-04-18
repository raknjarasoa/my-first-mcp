import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { ToolResult } from '../types.js';

const ArgsSchema = z.object({
  a: z.coerce.number({ message: "Parameter 'a' must be a number." }),
  b: z.coerce.number({ message: "Parameter 'b' must be a number." }),
});

export const definition: Tool = {
  name: 'add',
  description: 'Adds two numbers a and b',
  inputSchema: {
    type: 'object',
    properties: {
      a: { type: 'number', description: 'The first number' },
      b: { type: 'number', description: 'The second number' },
    },
    required: ['a', 'b'],
  },
};

export async function handler(args: Record<string, unknown>): Promise<ToolResult> {
  const { a, b } = ArgsSchema.parse(args);

  return {
    content: [{ type: 'text', text: String(a + b) }],
    isError: false,
  };
}
