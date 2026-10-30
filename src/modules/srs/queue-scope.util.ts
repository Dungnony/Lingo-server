import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import type { QueueQueryDto } from './dto/srs.dto';

/** A lesson or notebook session is a deliberate choice, so it skips the
 * daily new-card limit but still loads at most this many new words. */
export const FOCUSED_NEW_CARDS = 25;

export interface QueueScope {
  /** Extra filter on `UserWordProgress` for cards that are due. */
  dueWhere: Prisma.UserWordProgressWhereInput;
  /** Filter on `Word` for words the user has never studied. */
  newWhere: Prisma.WordWhereInput;
  newOrderBy: Prisma.WordOrderByWithRelationInput[];
  /** null = apply the user's `newCardsPerDay`. */
  newCardCap: number | null;
}

export function queueScope(
  userId: string,
  query: Pick<QueueQueryDto, 'level' | 'lessonId' | 'notebook'>,
): QueueScope {
  const notebook = query.notebook === 'true';
  if (notebook && query.lessonId) {
    throw new BadRequestException(
      'Chỉ chọn được 1 trong 2: ôn theo bài hoặc ôn sổ tay',
    );
  }
  const unstudied = { progress: { none: { userId } } };

  if (query.lessonId) {
    return {
      dueWhere: { word: { lessonId: query.lessonId } },
      newWhere: { lessonId: query.lessonId, ...unstudied },
      newOrderBy: [{ lessonOrder: 'asc' }],
      newCardCap: FOCUSED_NEW_CARDS,
    };
  }
  if (notebook) {
    const saved = { savedBy: { some: { userId } } };
    return {
      dueWhere: { word: saved },
      newWhere: { ...saved, ...unstudied },
      newOrderBy: [{ frequencyRank: 'asc' }, { word: 'asc' }],
      newCardCap: FOCUSED_NEW_CARDS,
    };
  }
  const levelFilter = query.level ? { level: query.level } : {};
  return {
    dueWhere: levelFilter,
    newWhere: { ...levelFilter, ...unstudied },
    newOrderBy: [{ frequencyRank: 'asc' }, { word: 'asc' }],
    newCardCap: null,
  };
}
