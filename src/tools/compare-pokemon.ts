import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { fetchWithTimeout } from '../utils/fetch.js';
import type { ToolResult } from '../types.js';

export const inputSchema = {
  names: z
    .array(z.string().min(1))
    .min(2, 'Provide at least 2 Pokemon names.')
    .max(6, 'Cannot compare more than 6 Pokemon at once.'),
};

const ArgsSchema = z.object(inputSchema);
type Args = z.infer<typeof ArgsSchema>;

export const definition: Tool = {
  name: 'compare_pokemon',
  description:
    'Compares base stats (HP, Attack, Defense, Sp. Atk, Sp. Def, Speed) for 2–6 Pokemon and returns a markdown table plus an SVG bar chart.',
  inputSchema: {
    type: 'object',
    properties: {
      names: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of 2–6 Pokemon names (lowercase, e.g. ["pikachu", "charmander"])',
      },
    },
    required: ['names'],
  },
};

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

const STAT_KEYS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];

interface PokemonStats {
  name: string;
  stats: Record<string, number>;
}

function buildMarkdownTable(pokemon: PokemonStats[]): string {
  const header = ['Name', ...STAT_KEYS.map((k) => STAT_LABELS[k])].join(' | ');
  const separator = Array(STAT_KEYS.length + 1)
    .fill('---')
    .join(' | ');
  const rows = pokemon.map((p) => [p.name, ...STAT_KEYS.map((k) => p.stats[k] ?? 0)].join(' | '));
  return [header, separator, ...rows].join('\n');
}

function buildSvgChart(pokemon: PokemonStats[]): string {
  const W = 800;
  const H = 420;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 80;
  const legendH = 24;

  const chartW = W - paddingLeft - paddingRight;
  const chartH = H - paddingTop - paddingBottom - legendH;

  const groupCount = STAT_KEYS.length;
  const groupW = chartW / groupCount;
  const barW = Math.min(20, (groupW / pokemon.length) * 0.8);
  const maxStat = 255;

  const yScale = (v: number) => chartH - (v / maxStat) * chartH;

  const bars = pokemon.flatMap((p, pi) =>
    STAT_KEYS.map((key, si) => {
      const val = p.stats[key] ?? 0;
      const totalGroupBarsW = barW * pokemon.length;
      const groupStartX = paddingLeft + si * groupW + (groupW - totalGroupBarsW) / 2;
      const x = groupStartX + pi * barW;
      const barH = (val / maxStat) * chartH;
      const y = paddingTop + legendH + yScale(val);
      return `
        <rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${COLORS[pi]}" rx="2"/>
        <text x="${x + barW / 2}" y="${y - 3}" text-anchor="middle" font-size="9" fill="#374151">${val}</text>`;
    })
  );

  const xLabels = STAT_KEYS.map((key, i) => {
    const cx = paddingLeft + i * groupW + groupW / 2;
    const y = paddingTop + legendH + chartH + 16;
    return `<text x="${cx}" y="${y}" text-anchor="middle" font-size="11" fill="#6b7280">${STAT_LABELS[key]}</text>`;
  });

  const yTicks = [0, 50, 100, 150, 200, 255].map((v) => {
    const y = paddingTop + legendH + yScale(v);
    return `
      <line x1="${paddingLeft - 5}" y1="${y}" x2="${paddingLeft + chartW}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>
      <text x="${paddingLeft - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#9ca3af">${v}</text>`;
  });

  const legend = pokemon.map((p, i) => {
    const x = paddingLeft + i * 120;
    return `
      <rect x="${x}" y="${paddingTop}" width="12" height="12" fill="${COLORS[i]}" rx="2"/>
      <text x="${x + 16}" y="${paddingTop + 10}" font-size="12" fill="#374151">${p.name}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#f9fafb" rx="8"/>
  ${yTicks.join('')}
  ${bars.join('')}
  ${xLabels.join('')}
  ${legend.join('')}
</svg>`;
}

export async function handler(args: Args): Promise<ToolResult> {
  const { names } = ArgsSchema.parse(args);

  const results = await Promise.all(
    names.map(async (raw) => {
      const pokemonName = raw.toLowerCase();
      const response = await fetchWithTimeout(
        `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(pokemonName)}`
      );
      if (response.status === 404) throw new Error(`Pokemon '${pokemonName}' not found.`);
      if (!response.ok)
        throw new Error(`PokeAPI responded with status ${response.status} for '${pokemonName}'.`);
      const data = await response.json();
      const stats: Record<string, number> = {};
      for (const s of data.stats as { base_stat: number; stat: { name: string } }[]) {
        stats[s.stat.name] = s.base_stat;
      }
      return { name: data.name as string, stats } satisfies PokemonStats;
    })
  );

  const table = buildMarkdownTable(results);
  const svg = buildSvgChart(results);
  const base64Svg = Buffer.from(svg).toString('base64');

  return {
    content: [
      { type: 'text', text: table },
      { type: 'image', data: base64Svg, mimeType: 'image/svg+xml' },
    ],
    isError: false,
  };
}
