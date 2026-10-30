export const AVATAR_ROUTE = 'media/avatars';
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Public URL stored in `User.avatarUrl`; `version` busts browser caches after an upload. */
export function avatarUrlFor(userId: string, version: number): string {
  return `/${AVATAR_ROUTE}/${userId}?v=${version}`;
}

/**
 * Extracts the user id from the `:file` route param. Accepts `<uuid>` and the
 * older `<uuid>.<ext>` form that disk-stored avatars used, so URLs saved
 * before the move to the database still resolve.
 */
export function avatarUserIdFromFile(file: string): string | null {
  const id = file.replace(/\.(png|jpe?g|webp)$/i, '');
  return UUID_RE.test(id) ? id.toLowerCase() : null;
}
