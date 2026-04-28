import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { ToolResult } from '../types.js';

export const inputSchema = {
  a: z.coerce.number({ message: "Parameter 'a' must be a number." }),
  b: z.coerce.number({ message: "Parameter 'b' must be a number." }),
};

const ArgsSchema = z.object(inputSchema);
type Args = z.infer<typeof ArgsSchema>;

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

export async function handler(args: Args): Promise<ToolResult> {
  const { a, b } = ArgsSchema.parse(args);

  return {
    content: [{ type: 'text', text: String(a + b) }],
    isError: false,
  };
}
