import { classifyGeminiError } from './gemini-errors';

describe('classifyGeminiError', () => {
  it('recognises quota errors', () => {
    expect(
      classifyGeminiError(
        new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}'),
      ),
    ).toBe('quota');
  });

  it('recognises a model that is no longer served', () => {
    const err = new Error(
      '{"error":{"code":404,"message":"This model models/gemini-2.5-flash is no longer available to new users.","status":"NOT_FOUND"}}',
    );
    expect(classifyGeminiError(err)).toBe('model-unavailable');
  });

  it('recognises a temporarily overloaded model', () => {
    const err = new Error(
      '{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}',
    );
    expect(classifyGeminiError(err)).toBe('overloaded');
  });

  it('treats anything else as a real failure', () => {
    expect(classifyGeminiError(new Error('fetch failed'))).toBe('other');
    expect(classifyGeminiError('boom')).toBe('other');
  });
});
