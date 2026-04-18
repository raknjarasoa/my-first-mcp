import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { fetchWithTimeout } from "../utils/fetch.js";

const ArgsSchema = z.object({
  name: z
    .string({ message: "Le paramètre 'name' est requis." })
    .min(1, "Le nom du Pokémon ne peut pas être vide."),
});

export const definition: Tool = {
  name: "get_pokemon",
  description: "Récupère les informations d'un Pokémon via PokeAPI",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Le nom du Pokémon (en minuscules, ex: pikachu)",
      },
    },
    required: ["name"],
  },
};

export async function handler(
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError: boolean }> {
  const { name } = ArgsSchema.parse(args);
  const pokemonName = name.toLowerCase();

  const response = await fetchWithTimeout(
    `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(pokemonName)}`
  );

  if (response.status === 404) {
    throw new Error(`Pokémon '${pokemonName}' introuvable.`);
  }

  if (!response.ok) {
    throw new Error(`PokeAPI a répondu avec le statut ${response.status}`);
  }

  const data = await response.json();

  const types = data.types
    .map((t: { type: { name: string } }) => t.type.name)
    .join(", ");

  const abilities = data.abilities
    .map((a: { ability: { name: string } }) => a.ability.name)
    .join(", ");

  const pokemonInfo = [
    `Nom: ${data.name}`,
    `ID: ${data.id}`,
    `Taille: ${data.height / 10}m`,
    `Poids: ${data.weight / 10}kg`,
    `Types: ${types}`,
    `Capacités: ${abilities}`,
  ].join("\n");

  return {
    content: [{ type: "text", text: pokemonInfo }],
    isError: false,
  };
}
