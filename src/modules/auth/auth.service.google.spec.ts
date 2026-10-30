import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../../infra/prisma/prisma.service';
import type { MailService } from '../mail/mail.service';
import type { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import type { GoogleOAuthService, GoogleProfile } from './google-oauth.service';
import type { PasswordService } from './password.service';
import type { TokenService } from './token.service';

const PROFILE: GoogleProfile = {
  sub: 'google-sub-1',
  email: 'victim@example.com',
  emailVerified: true,
};

const EXISTING_USER = {
  id: 'u1',
  email: 'victim@example.com',
  role: 'user',
  avatarUrl: null,
  passwordHash: 'hash-set-by-whoever-registered',
  emailVerifiedAt: null as Date | null,
};

function makeDeps() {
  return {
    prisma: { user: { update: jest.fn() } },
    users: {
      findAccount: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn(),
      createUser: jest.fn(),
      linkOAuthAccount: jest.fn(),
      findById: jest.fn(),
    },
    tokens: {
      issueForUser: jest.fn().mockResolvedValue({ accessToken: 'a' }),
      revokeAllForUser: jest.fn(),
    },
    google: { verifyIdToken: jest.fn() },
  };
}

describe('AuthService.loginWithGoogle linking by email', () => {
  let deps: ReturnType<typeof makeDeps>;
  let service: AuthService;

  beforeEach(() => {
    deps = makeDeps();
    service = new AuthService(
      deps.prisma as unknown as PrismaService,
      deps.users as unknown as UsersService,
      {} as PasswordService,
      deps.tokens as unknown as TokenService,
      {} as MailService,
      deps.google as unknown as GoogleOAuthService,
    );
  });

  function existingUser(emailVerifiedAt: Date | null) {
    const user = { ...EXISTING_USER, emailVerifiedAt };
    deps.users.findByEmail.mockResolvedValue(user);
    deps.users.findById.mockResolvedValue(user);
    return user;
  }

  it('takes over an unverified account for the Google owner: drops the old password and signs out old sessions', async () => {
    existingUser(null);
    deps.google.verifyIdToken.mockResolvedValue(PROFILE);

    await service.loginWithGoogle('id-token', {});

    const [[update]] = deps.prisma.user.update.mock.calls as [
      [
        {
          where: unknown;
          data: { emailVerifiedAt: unknown; passwordHash: unknown };
        },
      ],
    ];
    expect(update.where).toEqual({ id: 'u1' });
    expect(update.data.emailVerifiedAt).toBeInstanceOf(Date);
    expect(update.data.passwordHash).toBeNull();
    expect(deps.tokens.revokeAllForUser).toHaveBeenCalledWith('u1');
    expect(deps.users.linkOAuthAccount).toHaveBeenCalledWith('u1', 'GOOGLE', {
      providerAccountId: 'google-sub-1',
    });
  });

  it('links a verified account without touching its password or sessions', async () => {
    existingUser(new Date('2026-01-01T00:00:00Z'));
    deps.google.verifyIdToken.mockResolvedValue(PROFILE);

    await service.loginWithGoogle('id-token', {});

    expect(deps.prisma.user.update).not.toHaveBeenCalled();
    expect(deps.tokens.revokeAllForUser).not.toHaveBeenCalled();
    expect(deps.users.linkOAuthAccount).toHaveBeenCalled();
  });

  it.each([
    ['unverified', null],
    ['verified', new Date('2026-01-01T00:00:00Z')],
  ])(
    'refuses to link an %s account when Google has not verified the email',
    async (_label, emailVerifiedAt) => {
      existingUser(emailVerifiedAt);
      deps.google.verifyIdToken.mockResolvedValue({
        ...PROFILE,
        emailVerified: false,
      });

      await expect(
        service.loginWithGoogle('id-token', {}),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(deps.users.linkOAuthAccount).not.toHaveBeenCalled();
      expect(deps.tokens.issueForUser).not.toHaveBeenCalled();
    },
  );
});
