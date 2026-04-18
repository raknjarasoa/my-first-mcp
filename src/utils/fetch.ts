/**
 * Wrapper around native `fetch` with a configurable timeout.
 * Aborts the request if it exceeds the timeout duration.
 *
 * @param url - The URL to fetch.
 * @param options - Standard RequestInit options.
 * @param timeoutMs - Timeout in milliseconds (default: 8000).
 * @returns The fetch Response.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms.`, { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
