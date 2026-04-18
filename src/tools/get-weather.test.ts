import { describe, it, expect, vi, beforeEach } from 'vitest';
import { definition, handler } from './get-weather.js';

// Mock fetchWithTimeout at the module level
vi.mock('../utils/fetch.js', () => ({
  fetchWithTimeout: vi.fn(),
}));

import { fetchWithTimeout } from '../utils/fetch.js';
const mockFetch = vi.mocked(fetchWithTimeout);

describe('get_weather tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('definition', () => {
    it('has the correct name', () => {
      expect(definition.name).toBe('get_weather');
    });

    it('requires latitude and longitude', () => {
      expect(definition.inputSchema.required).toEqual(['latitude', 'longitude']);
    });
  });

  describe('handler', () => {
    it('returns formatted weather info', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          current: {
            temperature_2m: 22.5,
            wind_speed_10m: 12.3,
          },
        }),
      } as Response);

      const result = await handler({ latitude: 48.8566, longitude: 2.3522 });

      expect(result.isError).toBe(false);
      expect(result.content[0]!.text).toContain('22.5°C');
      expect(result.content[0]!.text).toContain('12.3 km/h');
    });

    it('constructs URL with correct query parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          current: { temperature_2m: 20, wind_speed_10m: 5 },
        }),
      } as Response);

      await handler({ latitude: 48.8566, longitude: 2.3522 });

      const calledUrl = mockFetch.mock.calls[0]![0]!;
      expect(calledUrl).toContain('latitude=48.8566');
      expect(calledUrl).toContain('longitude=2.3522');
      expect(calledUrl).toContain('current=temperature_2m');
    });

    it('throws when current data is missing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await expect(handler({ latitude: 48.8566, longitude: 2.3522 })).rejects.toThrow(
        'unavailable'
      );
    });

    it('throws on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      } as Response);

      await expect(handler({ latitude: 48.8566, longitude: 2.3522 })).rejects.toThrow('503');
    });

    it('throws on invalid latitude (out of range)', async () => {
      await expect(handler({ latitude: 100, longitude: 2.3522 })).rejects.toThrow();
    });

    it('throws on invalid longitude (out of range)', async () => {
      await expect(handler({ latitude: 48.8566, longitude: 200 })).rejects.toThrow();
    });

    it('throws on non-numeric latitude', async () => {
      await expect(
        handler({ latitude: 'not-a-number' as unknown as number, longitude: 2.3522 })
      ).rejects.toThrow();
    });

    it('throws on missing parameters', async () => {
      await expect(
        handler({} as unknown as { latitude: number; longitude: number })
      ).rejects.toThrow();
    });
  });
});
