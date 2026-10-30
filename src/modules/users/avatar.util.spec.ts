import { avatarUrlFor, avatarUserIdFromFile } from './avatar.util';

const ID = '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90';

describe('avatarUserIdFromFile', () => {
  it('accepts a bare user id', () => {
    expect(avatarUserIdFromFile(ID)).toBe(ID);
  });

  it.each(['png', 'jpg', 'jpeg', 'webp', 'PNG'])(
    'accepts the legacy <id>.%s form',
    (ext) => {
      expect(avatarUserIdFromFile(`${ID}.${ext}`)).toBe(ID);
    },
  );

  it('normalises the id to lower case', () => {
    expect(avatarUserIdFromFile(ID.toUpperCase())).toBe(ID);
  });

  it.each(['', 'abc', `${ID}.gif`, `../${ID}`, `${ID}x`])(
    'rejects %p',
    (file) => {
      expect(avatarUserIdFromFile(file)).toBeNull();
    },
  );
});

describe('avatarUrlFor', () => {
  it('builds a versioned URL that round-trips through the parser', () => {
    const url = avatarUrlFor(ID, 123);
    expect(url).toBe(`/media/avatars/${ID}?v=123`);
    const file = url.split('/').pop()!.split('?')[0];
    expect(avatarUserIdFromFile(file)).toBe(ID);
  });
});
