import { describe, expect, it } from 'vitest';
import { definition, handler } from './qui-est-l-avenir.js';

describe('qui_est_l_avenir tool', () => {
  describe('definition', () => {
    it('has the correct name', () => {
      expect(definition.name).toBe('qui_est_l_avenir');
    });

    it('has no required parameters', () => {
      expect(definition.inputSchema.required).toBeUndefined();
    });
  });

  describe('handler', () => {
    it('returns Jin', async () => {
      const result = await handler({});
      expect((result.content[0]! as { text: string }).text).toBe('Jin');
      expect(result.isError).toBe(false);
    });

    it('ignores any provided arguments', async () => {
      const result = await handler({ random: 'arg' });
      expect((result.content[0]! as { text: string }).text).toBe('Jin');
    });
  });
});
