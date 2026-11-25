import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser, isStaffRole } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: Awaited<ReturnType<typeof getOrCreateUser>>;
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token || token.length > 8192) return null;
  return token;
}

export async function verifyFirebaseBearerToken(token: string): Promise<DecodedIdToken> {
  const decodedToken = await adminAuth.verifyIdToken(token);
  if (!decodedToken.uid || decodedToken.aud !== firebaseConfig.projectId) {
    throw new Error('Token project mismatch');
  }
  return decodedToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in with Google.' });
  }

  try {
    req.user = await verifyFirebaseBearerToken(token);
    next();
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code || 'invalid_token';
    console.warn('Firebase ID token rejected:', code);
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
};

export const requireStaffRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.uid) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const dbUser = await getOrCreateUser(
      req.user.uid,
      req.user.email || '',
      typeof req.user.name === 'string' ? req.user.name : null,
      Boolean(req.user.email_verified)
    );
    if (!isStaffRole(dbUser.role)) {
      return res.status(403).json({ error: 'Staff permissions are required for this action.' });
    }
    req.dbUser = dbUser;
    return next();
  } catch (error: unknown) {
    console.error('Staff authorization check failed:', error instanceof Error ? error.message : 'unknown');
    return res.status(500).json({ error: 'Unable to verify staff permissions right now.' });
  }
};
