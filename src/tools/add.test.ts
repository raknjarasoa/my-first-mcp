import { describe, it, expect } from 'vitest';
import { definition, handler } from './add.js';

describe('add tool', () => {
  describe('definition', () => {
    it('has the correct name', () => {
      expect(definition.name).toBe('add');
    });

    it('requires a and b parameters', () => {
      expect(definition.inputSchema.required).toEqual(['a', 'b']);
    });
  });

  describe('handler', () => {
    it('adds two positive numbers', async () => {
      const result = await handler({ a: 2, b: 3 });
      expect(result.content[0]!.text).toBe('5');
      expect(result.isError).toBe(false);
    });

    it('adds negative numbers', async () => {
      const result = await handler({ a: -10, b: 5 });
      expect(result.content[0]!.text).toBe('-5');
      expect(result.isError).toBe(false);
    });

    it('adds decimal numbers', async () => {
      const result = await handler({ a: 1.5, b: 2.5 });
      expect(result.content[0]!.text).toBe('4');
      expect(result.isError).toBe(false);
    });

    it('handles zero', async () => {
      const result = await handler({ a: 0, b: 0 });
      expect(result.content[0]!.text).toBe('0');
      expect(result.isError).toBe(false);
    });

    it('coerces string numbers', async () => {
      const result = await handler({ a: '10', b: '20' });
      expect(result.content[0]!.text).toBe('30');
      expect(result.isError).toBe(false);
    });

    it('throws on non-numeric input', async () => {
      await expect(handler({ a: 'foo', b: 3 })).rejects.toThrow();
    });

    it('throws on missing parameters', async () => {
      await expect(handler({})).rejects.toThrow();
    });
  });
});
