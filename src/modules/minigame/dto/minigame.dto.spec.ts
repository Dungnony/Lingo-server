import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FinishMinigameDto, MINIGAME_QUESTION_COUNT } from './minigame.dto';

const WORD_ID = '3f2b8c1e-6a4d-4e9b-8f7a-1c2d3e4f5a6b';

function errorsFor(answerCount: number) {
  return validate(
    plainToInstance(FinishMinigameDto, {
      durationMs: 1000,
      answers: Array.from({ length: answerCount }, () => ({
        wordId: WORD_ID,
        chosenIndex: 0,
      })),
    }),
  );
}

describe('FinishMinigameDto', () => {
  it('accepts one answer per question in a full session', async () => {
    expect(await errorsFor(MINIGAME_QUESTION_COUNT)).toHaveLength(0);
  });

  it('rejects more answers than a session has questions', async () => {
    const errors = await errorsFor(MINIGAME_QUESTION_COUNT + 1);
    expect(errors.map((e) => e.property)).toEqual(['answers']);
  });
});
