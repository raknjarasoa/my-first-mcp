import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithTimeout } from './fetch.js';

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns response on success within timeout', async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout('https://example.com');

    expect(result.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('passes request options through', async () => {
    const mockResponse = new Response('', { status: 200 });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    await fetchWithTimeout('https://example.com', {
      method: 'POST',
      headers: { 'X-Custom': 'test' },
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        method: 'POST',
        headers: { 'X-Custom': 'test' },
      })
    );
  });

  it('throws on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

    await expect(fetchWithTimeout('https://bad.url')).rejects.toThrow('fetch failed');
  });

  it('throws with timeout message when request exceeds timeout', async () => {
    // Mock fetch to reject when the abort signal fires, mirroring native behaviour.
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_input, init) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        })
    );

    const promise = fetchWithTimeout('https://slow.example.com', {}, 5000);
    vi.advanceTimersByTime(5001);

    await expect(promise).rejects.toThrow(
      'Request to https://slow.example.com timed out after 5000ms.'
    );
  });
});
