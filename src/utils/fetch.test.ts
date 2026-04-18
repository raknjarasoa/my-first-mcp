import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithTimeout } from "./fetch.js";

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns response on success within timeout", async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout("https://example.com");

    expect(result.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("passes request options through", async () => {
    const mockResponse = new Response("", { status: 200 });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    await fetchWithTimeout(
      "https://example.com",
      { method: "POST", headers: { "X-Custom": "test" } }
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        method: "POST",
        headers: { "X-Custom": "test" },
      })
    );
  });

  it("throws on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("fetch failed")
    );

    await expect(fetchWithTimeout("https://bad.url")).rejects.toThrow(
      "fetch failed"
    );
  });
});
