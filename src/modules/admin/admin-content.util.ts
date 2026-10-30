import type { Prisma } from '../../generated/prisma/client';
import type {
  CreateGrammarDto,
  GrammarExampleDto,
  UpdateGrammarDto,
  UpdateVideoDto,
  UpdateWordDto,
} from './dto/admin.dto';

/** `undefined` = field not sent (leave unchanged); blank = clear it. */
export function blankToNull(
  value: string | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function wordUpdateData(dto: UpdateWordDto): Prisma.WordUpdateInput {
  return {
    word: dto.word?.trim(),
    pronunciation: blankToNull(dto.pronunciation),
    meaningVi: blankToNull(dto.meaningVi),
    meaningEn: blankToNull(dto.meaningEn),
  };
}

const WORD_CONTENT_FIELDS = [
  'word',
  'pronunciation',
  'meaningVi',
  'meaningEn',
  'example',
] as const;

/** An admin who edits a word has checked it, so the edit also approves it;
 * an explicit `reviewed: false` (undo) always wins. */
export function reviewDecision(
  dto: UpdateWordDto,
): 'review' | 'unreview' | 'keep' {
  if (dto.reviewed === false) return 'unreview';
  const edited = WORD_CONTENT_FIELDS.some((f) => dto[f] !== undefined);
  return dto.reviewed === true || edited ? 'review' : 'keep';
}

function cleanPatterns(patterns: string[]): string[] {
  return patterns.map((p) => p.trim()).filter((p) => p !== '');
}

// Plain objects: the DTO class instances must not leak into the JSON column.
function cleanExamples(examples: GrammarExampleDto[]) {
  return examples.map((e) => ({ en: e.en.trim(), vi: e.vi.trim() }));
}

export function grammarCreateData(
  dto: CreateGrammarDto,
  orderIndex: number,
): Prisma.GrammarPointCreateInput {
  return {
    slug: dto.slug,
    orderIndex,
    level: dto.level,
    titleVi: dto.titleVi.trim(),
    titleEn: dto.titleEn.trim(),
    summaryVi: dto.summaryVi.trim(),
    explanationVi: dto.explanationVi.trim(),
    patterns: cleanPatterns(dto.patterns),
    examples: cleanExamples(dto.examples),
  };
}

export function grammarUpdateData(
  dto: UpdateGrammarDto,
): Prisma.GrammarPointUpdateInput {
  return {
    level: dto.level,
    titleVi: dto.titleVi?.trim(),
    titleEn: dto.titleEn?.trim(),
    summaryVi: dto.summaryVi?.trim(),
    explanationVi: dto.explanationVi?.trim(),
    patterns: dto.patterns && cleanPatterns(dto.patterns),
    examples: dto.examples && cleanExamples(dto.examples),
  };
}

export function videoUpdateData(dto: UpdateVideoDto): Prisma.VideoUpdateInput {
  return {
    title: dto.title?.trim(),
    titleEn: blankToNull(dto.titleEn),
    level: dto.level,
    kind: dto.kind,
  };
}
