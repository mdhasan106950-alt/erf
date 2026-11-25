import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

export type StaffOrPlayerRole = 'player' | 'moderator' | 'admin' | 'owner';

const INITIAL_OWNER_EMAIL = (
  process.env.ADMIN_OWNER_EMAIL || 'mdhasan106950@gmail.com'
).toLowerCase();

export function normalizeRole(role?: string | null): StaffOrPlayerRole {
  if (role === 'owner' || role === 'admin' || role === 'moderator') {
    return role;
  }
  return 'player';
}

export function isStaffRole(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'owner' || normalized === 'admin' || normalized === 'moderator';
}

export function toPublicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    minecraftUsername: user.minecraftUsername,
    edition: user.edition,
    role: normalizeRole(user.role),
    createdAt: user.createdAt,
  };
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error('Database error in getUserByUid:', (error as { code?: string })?.code || 'unknown');
    throw new Error('Unable to verify player role right now.', { cause: error });
  }
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string | null,
  emailVerified = false
) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const shouldBootstrapOwner = emailVerified && cleanEmail === INITIAL_OWNER_EMAIL;

    const existing = await getUserByUid(uid);
    if (existing) {
      const nextRole =
        shouldBootstrapOwner && existing.role === 'player' ? 'owner' : existing.role;

      const updated = await db
        .update(users)
        .set({
          email: email || existing.email,
          ...(displayName ? { displayName } : {}),
          ...(nextRole !== existing.role ? { role: nextRole } : {}),
        })
        .where(eq(users.uid, uid))
        .returning();
      return updated[0];
    }

    try {
      const inserted = await db
        .insert(users)
        .values({
          uid,
          email,
          displayName: displayName ?? null,
          role: shouldBootstrapOwner ? 'owner' : 'player',
        })
        .returning();

      return inserted[0];
    } catch (insertError: unknown) {
      if ((insertError as { code?: string })?.code === '23505') {
        const raced = await getUserByUid(uid);
        if (raced) return raced;
      }
      throw insertError;
    }
  } catch (error) {
    console.error('Database error in getOrCreateUser:', (error as { code?: string })?.code || 'unknown');
    throw new Error('Unable to synchronize player profile right now.', { cause: error });
  }
}

export async function updateUserProfile(
  uid: string,
  minecraftUsername: string,
  edition: 'java' | 'bedrock'
) {
  try {
    const result = await db
      .update(users)
      .set({
        minecraftUsername,
        edition,
      })
      .where(eq(users.uid, uid))
      .returning();

    return result[0] ?? null;
  } catch (error) {
    console.error('Database error in updateUserProfile:', (error as { code?: string })?.code || 'unknown');
    throw new Error('Unable to save Minecraft profile details right now.', { cause: error });
  }
}
