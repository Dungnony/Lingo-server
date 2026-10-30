/**
 * ETL: wordlist CEFR + cache Gemini → data/processed/words.seed.json (dùng cho
 * `prisma db seed`). KHÔNG chạm database. Chạy: npm run data:build-words
 *
 * Nguồn (xem data/NOTICES.md):
 *   - CEFR-J Vocabulary Profile 1.5 (A1–B2) + Octanove C1/C2 1.0 (CC BY-SA 4.0):
 *     từ, từ loại, cấp độ.
 *   - data/processed/enrich-cache.json: IPA, nghĩa, câu ví dụ, chủ đề do Gemini sinh.
 *
 * Từ chưa có trong cache vẫn được đưa vào (nghĩa để trống, xếp vào chủ đề
 * "Từ vựng chung") để chạy được ngay cả khi chưa sinh xong dữ liệu.
 * File build ra phát hành lại theo CC BY-SA 4.0 (điều khoản share-alike).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { WordSeedRecord } from '../../prisma/seed/words';
import { assignLessons } from './lib/lessons';
import {
  PROCESSED_DIR,
  loadEnrichmentCache,
  loadMergedEntries,
} from './lib/sources';
import type { TopicKey } from './lib/topics';

const SEED_FILE = join(PROCESSED_DIR, 'words.seed.json');
const REPORT_FILE = join(PROCESSED_DIR, 'build-report.md');
const FALLBACK_TOPIC: TopicKey = 'other';

function main(): void {
  const entries = loadMergedEntries();
  const cache = loadEnrichmentCache();

  const withTopic = entries.map((e) => ({
    ...e,
    enrichment: cache[e.word] ?? null,
    topic: cache[e.word]?.topic ?? FALLBACK_TOPIC,
  }));
  const placements = assignLessons(withTopic);

  const records: WordSeedRecord[] = withTopic.map((e, i) => ({
    word: e.word,
    pronunciation: e.enrichment?.ipa ?? null,
    level: e.level,
    pos: e.pos,
    frequencyRank: e.frequencyRank,
    meaningVi: e.enrichment?.meaningVi ?? null,
    meaningEn: e.enrichment?.meaningEn ?? null,
    source: e.sources.join('+'),
    ...placements[i],
    examples: e.enrichment
      ? [{ en: e.enrichment.exampleEn, vi: e.enrichment.exampleVi }]
      : [],
  }));

  mkdirSync(PROCESSED_DIR, { recursive: true });
  writeFileSync(SEED_FILE, `${JSON.stringify(records)}\n`);
  writeFileSync(REPORT_FILE, buildReport(records));
  const missing = records.filter((r) => !r.meaningVi).length;
  console.log(
    `✓ ${records.length} từ → ${SEED_FILE}${missing ? ` (${missing} từ chưa có nghĩa — chạy thêm data:enrich-words)` : ''}`,
  );
}

function buildReport(records: WordSeedRecord[]): string {
  const levels = [...new Set(records.map((r) => r.level))].sort((a, b) => a - b);
  const lines = [
    '# Báo cáo build words.seed.json',
    '',
    '| Cấp | Số từ | Có nghĩa | Số bài |',
    '| --- | ---: | ---: | ---: |',
  ];
  for (const level of levels) {
    const rows = records.filter((r) => r.level === level);
    const lessons = new Set(rows.map((r) => r.lessonIndex)).size;
    const enriched = rows.filter((r) => r.meaningVi).length;
    lines.push(`| ${level} | ${rows.length} | ${enriched} | ${lessons} |`);
  }
  return `${lines.join('\n')}\n`;
}

main();
