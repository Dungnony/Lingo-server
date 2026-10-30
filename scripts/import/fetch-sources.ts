/**
 * Tải wordlist tiếng Anh về data/raw/ (đã nằm trong .gitignore).
 * Chạy: npm run data:fetch-sources
 *
 * Nguồn: github.com/openlanguageprofiles/olp-en-cefrj
 *  - CEFR-J Vocabulary Profile 1.5 (A1–B2) — miễn phí kể cả thương mại, cần trích dẫn.
 *  - Octanove Vocabulary Profile C1/C2 1.0 — CC BY-SA 4.0.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { PROFILES, RAW_DIR } from './lib/sources';

const FETCH_TIMEOUT_MS = 30_000;

async function download(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Tải ${url} thất bại: HTTP ${res.status}`);
  return res.text();
}

async function main(): Promise<void> {
  mkdirSync(RAW_DIR, { recursive: true });
  for (const p of PROFILES) {
    console.log(`↓ ${p.file} …`);
    const text = await download(p.url);
    writeFileSync(p.path, text);
    console.log(`  ✓ ${text.split('\n').length - 1} dòng`);
  }
  console.log('\nXong. Chạy tiếp: npm run data:enrich-words');
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
