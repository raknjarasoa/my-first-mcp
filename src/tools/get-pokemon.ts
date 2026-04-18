import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { fetchWithTimeout } from '../utils/fetch.js';
import type { ToolResult } from '../types.js';

export const inputSchema = {
  name: z
    .string({ message: "Parameter 'name' is required." })
    .min(1, 'Pokemon name cannot be empty.'),
};

const ArgsSchema = z.object(inputSchema);
type Args = z.infer<typeof ArgsSchema>;

export const definition: Tool = {
  name: 'get_pokemon',
  description: 'Retrieves information about a Pokemon via PokeAPI',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The Pokemon name (lowercase, e.g. pikachu)',
      },
    },
    required: ['name'],
  },
};

export async function handler(args: Args): Promise<ToolResult> {
  const { name } = ArgsSchema.parse(args);
  const pokemonName = name.toLowerCase();

  const response = await fetchWithTimeout(
    `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(pokemonName)}`
  );

  if (response.status === 404) {
    throw new Error(`Pokemon '${pokemonName}' not found.`);
  }

  if (!response.ok) {
    throw new Error(`PokeAPI responded with status ${response.status}`);
  }

  const data = await response.json();

  const types = data.types.map((t: { type: { name: string } }) => t.type.name).join(', ');

  const abilities = data.abilities
    .map((a: { ability: { name: string } }) => a.ability.name)
    .join(', ');

  const pokemonInfo = [
    `Name: ${data.name}`,
    `ID: ${data.id}`,
    `Height: ${data.height / 10}m`,
    `Weight: ${data.weight / 10}kg`,
    `Types: ${types}`,
    `Abilities: ${abilities}`,
  ].join('\n');

  return {
    content: [{ type: 'text', text: pokemonInfo }],
    isError: false,
  };
}
