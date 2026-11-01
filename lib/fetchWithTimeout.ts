/**
 * Utility helper for fetching with timeout and exponential backoff retry logic.
 * Default timeout: 8 seconds (to prevent VPS Phusion Passenger / proxy hangs)
 * Retries: 2 attempts with exponential backoff (2s, 4s)
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelays?: number[];
  onRetry?: (attempt: number, error: any) => void;
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 6000,
    maxRetries = 2,
    retryDelays = [300, 800],
    onRetry,
    ...fetchOptions
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    // If caller provided an external signal, propagate abort
    if (fetchOptions.signal) {
      if (fetchOptions.signal.aborted) {
        controller.abort();
      } else {
        fetchOptions.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Server gateway timeouts (502, 503, 504) on passenger
      if (response.status >= 502 && response.status <= 504 && attempt < maxRetries) {
        throw new Error(`HTTP ${response.status} Server/Gateway Timeout`);
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError' || err.message?.includes('Timeout') || err.message?.includes('aborted');
      const isNetworkError = err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');

      lastError = isTimeout
        ? new Error(`Request to ${url} timed out after ${timeoutMs}ms`)
        : err;

      if (attempt < maxRetries && (isTimeout || isNetworkError || err.message?.includes('HTTP 50'))) {
        const delay = retryDelays[attempt] || 2000 * Math.pow(2, attempt);
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }
        console.warn(`[fetchWithTimeout] Attempt ${attempt + 1} failed for ${url} (${lastError.message}). Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }

  throw lastError || new Error(`Network failure requesting ${url}`);
}

export default fetchWithTimeout;
