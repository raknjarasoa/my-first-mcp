import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

const ArgsSchema = z.object({
  a: z.coerce.number({ message: "Le paramètre 'a' doit être un nombre." }),
  b: z.coerce.number({ message: "Le paramètre 'b' doit être un nombre." }),
});

export const definition: Tool = {
  name: 'add',
  description: 'Additionne deux nombres a et b',
  inputSchema: {
    type: 'object',
    properties: {
      a: { type: 'number', description: 'Le premier nombre' },
      b: { type: 'number', description: 'Le second nombre' },
    },
    required: ['a', 'b'],
  },
};

export async function handler(
  args: Record<string, unknown>
): Promise<{ content: { type: 'text'; text: string }[]; isError: boolean }> {
  const { a, b } = ArgsSchema.parse(args);

  return {
    content: [{ type: 'text', text: String(a + b) }],
    isError: false,
  };
}
