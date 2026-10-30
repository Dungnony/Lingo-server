import { isTopicKey, type TopicKey } from './topics';

/** What Gemini generates for one headword (cached in enrich-cache.json). */
export interface Enrichment {
  ipa: string;
  meaningVi: string;
  meaningEn: string;
  exampleEn: string;
  exampleVi: string;
  topic: TopicKey;
}

export type EnrichmentCache = Record<string, Enrichment>;

const MAX_FIELD_LENGTH = 300;
const TEXT_FIELDS = [
  'meaningVi',
  'meaningEn',
  'exampleEn',
  'exampleVi',
] as const;

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text && text.length <= MAX_FIELD_LENGTH ? text : null;
}

/** IPA is accepted with or without slashes and always stored as /…/. */
function cleanIpa(value: unknown): string | null {
  const text = cleanText(value);
  if (!text) return null;
  const inner = text.replace(/^[/[]+|[/\]]+$/g, '').trim();
  return inner ? `/${inner}/` : null;
}

/**
 * Validates one item of a model response. Returns null (so the word is
 * retried later) when the item is for another word or any field is unusable.
 */
export function validateEnrichment(
  item: unknown,
  expectedWord: string,
): Enrichment | null {
  if (typeof item !== 'object' || item === null) return null;
  const raw = item as Record<string, unknown>;
  if (cleanText(raw.word) !== expectedWord) return null;

  const ipa = cleanIpa(raw.ipa);
  if (!ipa || !isTopicKey(raw.topic)) return null;

  const texts = {} as Record<(typeof TEXT_FIELDS)[number], string>;
  for (const field of TEXT_FIELDS) {
    const value = cleanText(raw[field]);
    if (!value) return null;
    texts[field] = value;
  }
  return { ipa, ...texts, topic: raw.topic };
}
