import { wordPoolSkipForElo } from './duel-rank.util';

describe('wordPoolSkipForElo', () => {
  const POOL = 8000;

  it('does not skip any word for the lowest tiers', () => {
    expect(wordPoolSkipForElo(500, POOL)).toBe(0); // Sắt
    expect(wordPoolSkipForElo(900, POOL)).toBe(0); // Đồng
  });

  it('skips a growing share of the pool as ELO rises', () => {
    const skips = [1000, 1200, 1400, 1600, 1800, 2000, 2200].map((elo) =>
      wordPoolSkipForElo(elo, POOL),
    );
    for (let i = 1; i < skips.length; i += 1) {
      expect(skips[i]).toBeGreaterThan(skips[i - 1]);
    }
    expect(skips[skips.length - 1]).toBe(POOL / 2); // Thách Đấu
  });

  it('scales with the pool size', () => {
    expect(wordPoolSkipForElo(2200, 1000)).toBe(500);
    expect(wordPoolSkipForElo(2200, 0)).toBe(0);
  });

  it('treats a negative pool size as empty', () => {
    expect(wordPoolSkipForElo(2200, -5)).toBe(0);
  });
});
