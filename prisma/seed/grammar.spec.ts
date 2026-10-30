import { LEVELS, isValidLevel } from '../../src/common/levels';
import type { PrismaClient } from '../../src/generated/prisma/client';
import { GRAMMAR, seedGrammar } from './grammar';

describe('seedGrammar', () => {
  function makePrisma() {
    return { grammarPoint: { upsert: jest.fn().mockResolvedValue({}) } };
  }
  type UpsertArgs = { update: Record<string, unknown> };

  beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('only creates missing points, so admin edits survive a re-seed', async () => {
    const prisma = makePrisma();
    await seedGrammar(prisma as unknown as PrismaClient);

    expect(prisma.grammarPoint.upsert).toHaveBeenCalledTimes(GRAMMAR.length);
    const calls = prisma.grammarPoint.upsert.mock.calls as [UpsertArgs][];
    for (const [args] of calls) expect(args.update).toEqual({});
  });

  it('rewrites every point from the file when asked to overwrite', async () => {
    const prisma = makePrisma();
    await seedGrammar(prisma as unknown as PrismaClient, { overwrite: true });

    const [[first]] = prisma.grammarPoint.upsert.mock.calls as [UpsertArgs][];
    expect(first.update).toMatchObject({ titleEn: GRAMMAR[0].titleEn });
  });
});

const POINTS_PER_LEVEL = 12;

describe('GRAMMAR seed data', () => {
  it('has unique slugs (they are the upsert key)', () => {
    const slugs = GRAMMAR.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it(`has ${POINTS_PER_LEVEL} points for every level`, () => {
    for (const level of LEVELS) {
      expect(GRAMMAR.filter((g) => g.level === level)).toHaveLength(
        POINTS_PER_LEVEL,
      );
    }
  });

  it('keeps points grouped by level in ascending order', () => {
    const levels = GRAMMAR.map((g) => g.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });

  it.each(GRAMMAR.map((g) => [g.slug, g]))('%s is complete', (_slug, g) => {
    expect(isValidLevel(g.level)).toBe(true);
    for (const text of [g.titleEn, g.titleVi, g.summaryVi, g.explanationVi]) {
      expect(text.trim()).not.toBe('');
    }
    expect(g.patterns.length).toBeGreaterThan(0);
    expect(g.examples.length).toBeGreaterThan(0);
    for (const ex of g.examples) {
      expect(ex.en.trim()).not.toBe('');
      expect(ex.vi.trim()).not.toBe('');
    }
  });
});
