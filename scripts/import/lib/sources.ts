import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  mergeProfiles,
  parseProfile,
  type MergedEntry,
} from './cefr-profile';
import type { EnrichmentCache } from './enrichment';

const ROOT = join(__dirname, '..', '..', '..');
export const RAW_DIR = join(ROOT, 'data', 'raw', 'olp-en-cefrj');
export const PROCESSED_DIR = join(ROOT, 'data', 'processed');
export const ENRICH_CACHE_FILE = join(PROCESSED_DIR, 'enrich-cache.json');
export const ENV_FILE = join(ROOT, '.env');

const REPO_RAW_URL =
  'https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master';

/** Vocabulary profiles (CEFR-J for A1–B2, Octanove for C1–C2). */
export const PROFILES = [
  { file: 'cefrj-vocabulary-profile-1.5.csv', source: 'cefrj-1.5' },
  { file: 'octanove-vocabulary-profile-c1c2-1.0.csv', source: 'octanove-1.0' },
].map((p) => ({ ...p, url: `${REPO_RAW_URL}/${p.file}`, path: join(RAW_DIR, p.file) }));

export function loadMergedEntries(): MergedEntry[] {
  const missing = PROFILES.filter((p) => !existsSync(p.path));
  if (missing.length) {
    throw new Error(
      `Thiếu ${missing.map((p) => p.file).join(', ')} — chạy trước: npm run data:fetch-sources`,
    );
  }
  return mergeProfiles(
    PROFILES.flatMap((p) => parseProfile(readFileSync(p.path, 'utf8'), p.source)),
  );
}

export function loadEnrichmentCache(): EnrichmentCache {
  if (!existsSync(ENRICH_CACHE_FILE)) return {};
  return JSON.parse(readFileSync(ENRICH_CACHE_FILE, 'utf8')) as EnrichmentCache;
}
