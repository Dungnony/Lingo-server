export interface EnrichOptions {
  /** Max words processed in this run. */
  limit: number;
  /** Words sent per Gemini request. Fewer, larger requests stretch the
   * free tier's requests-per-day limit further. */
  batchSize: number;
  /** Pause between requests; 0 is fine on a paid (billing-enabled) key. */
  delayMs: number;
}

export const DEFAULT_BATCH_SIZE = 100;
/** Keeps a free-tier key under ~10 requests/minute. */
export const DEFAULT_DELAY_MS = 7_000;
const MAX_BATCH_SIZE = 200;
const MAX_DELAY_MS = 600_000;

function readInt(
  argv: string[],
  flag: string,
  min: number,
  max: number,
): number | undefined {
  const i = argv.indexOf(flag);
  if (i < 0) return undefined;
  const n = Number(argv[i + 1]);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`${flag} phải là số nguyên từ ${min} đến ${max}`);
  }
  return n;
}

/** `--limit 200 --batch 100 --delay 0` → options, with defaults. */
export function parseEnrichOptions(argv: string[]): EnrichOptions {
  return {
    limit:
      readInt(argv, '--limit', 1, Number.MAX_SAFE_INTEGER) ??
      Number.POSITIVE_INFINITY,
    batchSize:
      readInt(argv, '--batch', 1, MAX_BATCH_SIZE) ?? DEFAULT_BATCH_SIZE,
    delayMs: readInt(argv, '--delay', 0, MAX_DELAY_MS) ?? DEFAULT_DELAY_MS,
  };
}
