import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from '../../common/types';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminController } from './admin.controller';

// Handlers are only used as metadata keys here, never called.
const PROTOTYPE = AdminController.prototype as unknown as Record<
  string,
  unknown
>;

function contextFor(
  handler: keyof AdminController,
  user?: AuthUser,
): ExecutionContext {
  return {
    getHandler: () => PROTOTYPE[handler],
    getClass: () => AdminController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

const HANDLERS = Object.getOwnPropertyNames(AdminController.prototype).filter(
  (name) => name !== 'constructor',
) as (keyof AdminController)[];

describe('AdminController access', () => {
  const guard = new RolesGuard(new Reflector());
  const admin: AuthUser = { id: 'a', email: 'a@x.vn', role: 'admin' };
  const learner: AuthUser = { id: 'u', email: 'u@x.vn', role: 'user' };

  it.each(HANDLERS)('%s rejects a non-admin with 403', (handler) => {
    expect(() => guard.canActivate(contextFor(handler, learner))).toThrow(
      ForbiddenException,
    );
  });

  it.each(HANDLERS)('%s rejects a request without a user', (handler) => {
    expect(() => guard.canActivate(contextFor(handler))).toThrow(
      ForbiddenException,
    );
  });

  it.each(HANDLERS)('%s allows an admin', (handler) => {
    expect(guard.canActivate(contextFor(handler, admin))).toBe(true);
  });
});
