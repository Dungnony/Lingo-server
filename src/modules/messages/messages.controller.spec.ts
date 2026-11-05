import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from '../../common/types';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MessagesController } from './messages.controller';

// Handlers are only used as metadata keys here, never called.
const PROTOTYPE = MessagesController.prototype as unknown as Record<
  string,
  unknown
>;

function contextFor(
  handler: keyof MessagesController,
  user: AuthUser,
): ExecutionContext {
  return {
    getHandler: () => PROTOTYPE[handler],
    getClass: () => MessagesController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('MessagesController access', () => {
  const guard = new RolesGuard(new Reflector());
  const admin: AuthUser = { id: 'a', email: 'a@x.vn', role: 'admin' };
  const learner: AuthUser = { id: 'u', email: 'u@x.vn', role: 'user' };

  it('hides global usage stats from a non-admin', () => {
    expect(() => guard.canActivate(contextFor('usageStats', learner))).toThrow(
      ForbiddenException,
    );
  });

  it('shows global usage stats to an admin', () => {
    expect(guard.canActivate(contextFor('usageStats', admin))).toBe(true);
  });

  it('keeps messaging open to regular users', () => {
    expect(guard.canActivate(contextFor('sendMessage', learner))).toBe(true);
  });
});
