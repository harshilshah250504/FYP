/**
 * Fetch wrapper with retry on 429 (rate limit) and exponential backoff.
 */

export interface FetchWithRetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<FetchWithRetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    const res = await fetch(url, init);
    lastResponse = res;

    if (res.status === 429 && attempt < opts.maxRetries) {
      const retryAfter = res.headers.get("Retry-After");
      let waitMs = opts.baseDelayMs * Math.pow(2, attempt);
      if (retryAfter) {
        const parsed = parseInt(retryAfter, 10);
        if (!isNaN(parsed)) waitMs = parsed * 1000;
      }
      waitMs = Math.min(waitMs, opts.maxDelayMs);
      await delay(waitMs);
      continue;
    }

    return res;
  }

  return lastResponse!;
}
