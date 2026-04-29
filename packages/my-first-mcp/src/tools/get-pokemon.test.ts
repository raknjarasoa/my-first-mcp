import { describe, it, expect, vi, beforeEach } from 'vitest';
import { definition, handler } from './get-pokemon.js';

// Mock fetchWithTimeout at the module level
vi.mock('../utils/fetch.js', () => ({
  fetchWithTimeout: vi.fn(),
}));

import { fetchWithTimeout } from '../utils/fetch.js';
const mockFetch = vi.mocked(fetchWithTimeout);

describe('get_pokemon tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('definition', () => {
    it('has the correct name', () => {
      expect(definition.name).toBe('get_pokemon');
    });

    it('requires name parameter', () => {
      expect(definition.inputSchema.required).toEqual(['name']);
    });
  });

  describe('handler', () => {
    it('returns formatted pokemon info', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          name: 'pikachu',
          id: 25,
          height: 4,
          weight: 60,
          types: [{ type: { name: 'electric' } }],
          abilities: [{ ability: { name: 'static' } }, { ability: { name: 'lightning-rod' } }],
        }),
      } as Response);

      const result = await handler({ name: 'pikachu' });

      expect(result.isError).toBe(false);
      expect((result.content[0]! as { text: string }).text).toContain('Name: pikachu');
      expect((result.content[0]! as { text: string }).text).toContain('ID: 25');
      expect((result.content[0]! as { text: string }).text).toContain('Height: 0.4m');
      expect((result.content[0]! as { text: string }).text).toContain('Weight: 6kg');
      expect((result.content[0]! as { text: string }).text).toContain('Types: electric');
      expect((result.content[0]! as { text: string }).text).toContain(
        'Abilities: static, lightning-rod'
      );
    });

    it('lowercases the pokemon name', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          name: 'charizard',
          id: 6,
          height: 17,
          weight: 905,
          types: [{ type: { name: 'fire' } }, { type: { name: 'flying' } }],
          abilities: [{ ability: { name: 'blaze' } }],
        }),
      } as Response);

      await handler({ name: 'CHARIZARD' });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('charizard'));
    });

    it('throws on 404 (pokemon not found)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await expect(handler({ name: 'fakemon' })).rejects.toThrow('not found');
    });

    it('throws on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(handler({ name: 'pikachu' })).rejects.toThrow('500');
    });

    it('throws on empty name', async () => {
      await expect(handler({ name: '' })).rejects.toThrow();
    });

    it('throws on missing name', async () => {
      await expect(handler({} as unknown as { name: string })).rejects.toThrow();
    });
  });
});
