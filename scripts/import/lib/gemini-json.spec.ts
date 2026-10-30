import type { GoogleGenAI, Schema } from '@google/genai';
import {
  generateJsonArray,
  QuotaExhaustedError,
  SCRIPT_MODELS,
} from './gemini-json';

const SCHEMA = { type: 'ARRAY' } as unknown as Schema;

function fakeGenAI(...outcomes: (string | Error | DOMException)[]) {
  const generateContent = jest.fn();
  for (const o of outcomes) {
    if (typeof o === 'string') generateContent.mockResolvedValueOnce({ text: o });
    else generateContent.mockRejectedValueOnce(o);
  }
  const genAI = { models: { generateContent } } as unknown as GoogleGenAI;
  return { genAI, generateContent };
}

function modelsTried(mock: jest.Mock): string[] {
  return (mock.mock.calls as [{ model: string }][]).map(([a]) => a.model);
}

describe('generateJsonArray', () => {
  beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('returns the parsed array from the first model that answers', async () => {
    const { genAI } = fakeGenAI('[{"k":"1"}]');
    await expect(
      generateJsonArray(genAI, 'prompt', SCHEMA, new Set()),
    ).resolves.toEqual([{ k: '1' }]);
  });

  it('skips a model out of quota for the rest of the run', async () => {
    const { genAI, generateContent } = fakeGenAI(
      new Error('{"code":429,"status":"RESOURCE_EXHAUSTED"}'),
      '[]',
    );
    const skipped = new Set<string>();
    await generateJsonArray(genAI, 'prompt', SCHEMA, skipped);
    expect(modelsTried(generateContent)).toEqual(SCRIPT_MODELS.slice(0, 2));
    expect(skipped).toEqual(new Set([SCRIPT_MODELS[0]]));
  });

  it('gives every request a time limit', async () => {
    const { genAI, generateContent } = fakeGenAI('[]');
    await generateJsonArray(genAI, 'prompt', SCHEMA, new Set());
    const [[args]] = generateContent.mock.calls as [
      [{ config: { abortSignal?: unknown } }],
    ];
    expect(args.config.abortSignal).toBeInstanceOf(AbortSignal);
  });

  it('skips a model that timed out for the rest of the run', async () => {
    const timeout = new DOMException('timed out', 'TimeoutError');
    const { genAI, generateContent } = fakeGenAI(timeout, '[]');
    const skipped = new Set<string>();
    await expect(
      generateJsonArray(genAI, 'prompt', SCHEMA, skipped),
    ).resolves.toEqual([]);
    expect(modelsTried(generateContent)).toEqual(SCRIPT_MODELS.slice(0, 2));
    expect(skipped).toEqual(new Set([SCRIPT_MODELS[0]]));
  });

  it('only routes around an overloaded model for this request', async () => {
    const { genAI } = fakeGenAI(new Error('{"code":503}'), '[]');
    const skipped = new Set<string>();
    await generateJsonArray(genAI, 'prompt', SCHEMA, skipped);
    expect(skipped.size).toBe(0);
  });

  it('signals that the whole run should stop when no model is left', async () => {
    const quota = new Error('RESOURCE_EXHAUSTED');
    const { genAI } = fakeGenAI(...SCRIPT_MODELS.map(() => quota));
    await expect(
      generateJsonArray(genAI, 'prompt', SCHEMA, new Set()),
    ).rejects.toBeInstanceOf(QuotaExhaustedError);
  });

  it('fails a batch whose answer is not a JSON array', async () => {
    const { genAI } = fakeGenAI('{"k":"1"}');
    await expect(
      generateJsonArray(genAI, 'prompt', SCHEMA, new Set()),
    ).rejects.toThrow('mảng JSON');
  });

  it('rethrows unexpected errors', async () => {
    const { genAI } = fakeGenAI(new Error('network down'));
    await expect(
      generateJsonArray(genAI, 'prompt', SCHEMA, new Set()),
    ).rejects.toThrow('network down');
  });
});
