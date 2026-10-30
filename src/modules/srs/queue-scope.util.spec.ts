import { BadRequestException } from '@nestjs/common';
import { FOCUSED_NEW_CARDS, queueScope } from './queue-scope.util';

describe('queueScope', () => {
  it('reviews everything (optionally one level) under the daily new-card cap', () => {
    const scope = queueScope('u1', { level: 2 });
    expect(scope.dueWhere).toEqual({ level: 2 });
    expect(scope.newWhere).toEqual({
      level: 2,
      progress: { none: { userId: 'u1' } },
    });
    expect(scope.newCardCap).toBeNull();
  });

  it('studies one lesson in lesson order without the daily cap', () => {
    const scope = queueScope('u1', { lessonId: 'l1' });
    expect(scope.dueWhere).toEqual({ word: { lessonId: 'l1' } });
    expect(scope.newWhere).toEqual({
      lessonId: 'l1',
      progress: { none: { userId: 'u1' } },
    });
    expect(scope.newOrderBy).toEqual([{ lessonOrder: 'asc' }]);
    expect(scope.newCardCap).toBe(FOCUSED_NEW_CARDS);
  });

  it("limits a notebook session to the user's own saved words", () => {
    const scope = queueScope('u1', { notebook: 'true' });
    const saved = { savedBy: { some: { userId: 'u1' } } };
    expect(scope.dueWhere).toEqual({ word: saved });
    expect(scope.newWhere).toEqual({
      ...saved,
      progress: { none: { userId: 'u1' } },
    });
    expect(scope.newCardCap).toBe(FOCUSED_NEW_CARDS);
  });

  it('treats notebook=false like a normal review', () => {
    expect(queueScope('u1', { notebook: 'false' }).newCardCap).toBeNull();
  });

  it('rejects asking for a lesson and the notebook at once', () => {
    expect(() =>
      queueScope('u1', { lessonId: 'l1', notebook: 'true' }),
    ).toThrow(BadRequestException);
  });
});
