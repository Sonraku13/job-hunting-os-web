/**
 * Fetch dengan batas waktu (TM-004).
 *
 * Tanpa timeout, satu request eksternal yang menggantung akan menahan
 * seluruh handler sampai Vercel memutus fungsinya, sehingga kuota/kredit
 * user bisa "dibayar" tanpa hasil. Semua panggilan ke pihak ketiga
 * (Zapi, Vleee, Gemini) wajib melewati helper ini.
 */

export class FetchTimeoutError extends Error {
  constructor(url: string, ms: number) {
    super(`Request ke ${url} melebihi batas ${ms}ms`);
    this.name = 'FetchTimeoutError';
  }
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Hormati signal yang sudah ada dari pemanggil (kalau ada).
  const externalSignal = init.signal;
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError' && !externalSignal?.aborted) {
      throw new FetchTimeoutError(url, timeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
