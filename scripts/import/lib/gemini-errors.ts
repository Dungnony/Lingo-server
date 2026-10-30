export type GeminiErrorKind =
  | 'quota'
  | 'model-unavailable'
  | 'overloaded'
  | 'other';

/**
 * Sorts a Gemini API error into what the caller should do next:
 * - `quota` / `model-unavailable` (404, e.g. retired for new keys): skip that
 *   model for the rest of the run;
 * - `overloaded` (503 "high demand"): temporary — try another model for this
 *   request but keep the model for later ones;
 * - `other`: a real failure.
 */
export function classifyGeminiError(err: unknown): GeminiErrorKind {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('"code":429')) {
    return 'quota';
  }
  if (msg.includes('NOT_FOUND') || msg.includes('"code":404')) {
    return 'model-unavailable';
  }
  if (msg.includes('"code":503') || msg.includes('UNAVAILABLE')) {
    return 'overloaded';
  }
  return 'other';
}
