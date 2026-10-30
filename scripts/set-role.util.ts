/** Roles the app actually checks. Granting is CLI-only on purpose: there is
 * no API that can make someone an admin. */
export const ASSIGNABLE_ROLES = ['user', 'admin'] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

const USAGE = 'Usage: npm run user:set-role -- <email> <user|admin>';

export function parseSetRoleArgs(argv: readonly string[]): {
  email: string;
  role: AssignableRole;
} {
  const [rawEmail, rawRole, ...rest] = argv;
  if (!rawEmail || !rawRole || rest.length > 0) throw new Error(USAGE);

  const email = rawEmail.trim();
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) {
    throw new Error(`Invalid email "${rawEmail}". ${USAGE}`);
  }
  const role = rawRole.trim().toLowerCase();
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(role)) {
    throw new Error(
      `Unknown role "${rawRole}" (expected ${ASSIGNABLE_ROLES.join(' or ')}).`,
    );
  }
  return { email, role: role as AssignableRole };
}
