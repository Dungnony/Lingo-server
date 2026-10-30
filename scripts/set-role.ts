/**
 * Grant or revoke the admin role (the only way to do so — there is no API).
 *
 * Run: npm run user:set-role -- <email> <user|admin>
 * Reads DATABASE_URL from the environment or .env. The new role is embedded in
 * the user's next access token, so it applies after the current one expires
 * (JWT_ACCESS_TTL) or immediately after logging out and back in.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { parseSetRoleArgs } from './set-role.util';

async function main() {
  const { email, role } = parseSetRoleArgs(process.argv.slice(2));
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    // Emails are stored as typed at sign-up, so match case-insensitively.
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, email: true, role: true },
    });
    if (!user) throw new Error(`No user with email ${email}.`);
    if (user.role === role) {
      console.log(`${user.email} already has role "${role}".`);
      return;
    }
    await prisma.user.update({ where: { id: user.id }, data: { role } });
    console.log(
      `${user.email}: "${user.role}" -> "${role}". Log out and back in to apply it now.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
