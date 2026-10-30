import { parseSetRoleArgs } from './set-role.util';

describe('parseSetRoleArgs', () => {
  it('accepts an email and a known role', () => {
    expect(parseSetRoleArgs([' me@lingo.vn ', 'Admin'])).toEqual({
      email: 'me@lingo.vn',
      role: 'admin',
    });
  });

  it('can demote back to user', () => {
    expect(parseSetRoleArgs(['me@lingo.vn', 'user']).role).toBe('user');
  });

  it.each([[[]], [['me@lingo.vn']], [['me@lingo.vn', 'admin', 'extra']]])(
    'rejects the wrong number of arguments %j',
    (argv) => {
      expect(() => parseSetRoleArgs(argv)).toThrow(/Usage/);
    },
  );

  it('rejects an invalid email', () => {
    expect(() => parseSetRoleArgs(['not-an-email', 'admin'])).toThrow(
      /Invalid email/,
    );
  });

  it('rejects an unknown role', () => {
    expect(() => parseSetRoleArgs(['me@lingo.vn', 'root'])).toThrow(
      /Unknown role/,
    );
  });
});
