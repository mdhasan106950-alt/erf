import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

export interface PlayerProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  minecraftUsername: string | null;
  edition: 'java' | 'bedrock';
  role: 'player' | 'moderator' | 'admin' | 'owner';
  createdAt: string;
}

interface AuthContextValue {
  firebaseUser: User | null;
  profile: PlayerProfile | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshProfile: () => Promise<void>;
  updateMinecraftProfile: (minecraftUsername: string, edition: 'java' | 'bedrock') => Promise<PlayerProfile>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (user: User) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to load player profile.');
      }
      const data = await response.json();
      setProfile(data.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to sync player profile.';
      setAuthError(message);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchProfile]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      await fetchProfile(cred.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google Sign In was cancelled or failed.';
      setAuthError(message);
      throw err;
    }
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
    setProfile(null);
  }, []);

  const getToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      await fetchProfile(auth.currentUser);
    }
  }, [fetchProfile]);

  const updateMinecraftProfile = useCallback(
    async (minecraftUsername: string, edition: 'java' | 'bedrock') => {
      if (!auth.currentUser) {
        throw new Error('Sign in with Google before saving your Minecraft username.');
      }
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ minecraftUsername, edition }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to save Minecraft profile.');
      }
      setProfile(data.user);
      return data.user as PlayerProfile;
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        authError,
        signInWithGoogle,
        logout,
        getToken,
        refreshProfile,
        updateMinecraftProfile,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
