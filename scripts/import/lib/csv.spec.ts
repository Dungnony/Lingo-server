import { parseCsv } from './csv';

describe('parseCsv', () => {
  it('splits rows and fields', () => {
    expect(parseCsv('a,b,c\n1,2,3\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles CRLF, empty fields and blank lines', () => {
    expect(parseCsv('a,,c\r\n\r\nx,y,\r\n')).toEqual([
      ['a', '', 'c'],
      ['x', 'y', ''],
    ]);
  });

  it('keeps commas, quotes and newlines inside quoted fields', () => {
    expect(parseCsv('"a, b","say ""hi""","line\nbreak"')).toEqual([
      ['a, b', 'say "hi"', 'line\nbreak'],
    ]);
  });

  it('rejects an unterminated quoted field', () => {
    expect(() => parseCsv('"abc')).toThrow();
  });
});
