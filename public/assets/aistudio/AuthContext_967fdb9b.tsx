import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { User, UserRole } from '../types';

export type { User, UserRole };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  login: (user: User) => void;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; user: User }>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    minecraftUsername?: string;
    minecraftEdition?: 'Java' | 'Bedrock';
  }) => Promise<{ success: boolean; user: User }>;
  loginWithGoogle: (payload: { email: string; name?: string; picture?: string }) => Promise<User>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  updateMinecraftAccount: (username: string, edition?: 'Java' | 'Bedrock') => Promise<void>;
  uploadProfilePicture: (base64Image: string) => Promise<string>;
  updateProfile: (data: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Strips out large base64 strings before saving to localStorage to prevent QuotaExceededError
function getSafeUserForStorage(u: User): Partial<User> {
  const safe: Partial<User> = { ...u };
  if (safe.picture && safe.picture.startsWith('data:') && safe.picture.length > 20000) {
    safe.picture = undefined;
  }
  if (safe.avatarUrl && safe.avatarUrl.startsWith('data:') && safe.avatarUrl.length > 20000) {
    safe.avatarUrl = undefined;
  }
  return safe;
}

function saveUserToLocalStorage(u: User | null) {
  if (!u) {
    try {
      localStorage.removeItem('ironcloud_user');
    } catch {
      // ignore
    }
    return;
  }

  try {
    const safe = getSafeUserForStorage(u);
    localStorage.setItem('ironcloud_user', JSON.stringify(safe));
  } catch (quotaError) {
    console.warn('Storage quota exceeded on primary write, attempting stripped fallback:', quotaError);
    try {
      const minimal: Partial<User> = {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        minecraftUsername: u.minecraftUsername,
        minecraftEdition: u.minecraftEdition,
        isMinecraftVerified: u.isMinecraftVerified,
      };
      localStorage.setItem('ironcloud_user', JSON.stringify(minimal));
    } catch (innerErr) {
      console.warn('Failed minimal user storage save:', innerErr);
      try {
        localStorage.removeItem('ironcloud_user');
      } catch {
        // ignore
      }
    }
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ironcloud_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    saveUserToLocalStorage(user);
  }, [user]);

  // Sync fresh profile from server if user is logged in
  useEffect(() => {
    if (user?.email) {
      api.getProfile({ email: user.email })
        .then((serverUser) => {
          if (serverUser && (serverUser.avatarUrl || serverUser.name || serverUser.role)) {
            setUser((prev) => {
              if (!prev) return serverUser;
              return {
                ...prev,
                ...serverUser,
                avatarUrl: serverUser.avatarUrl || prev.avatarUrl,
                picture: serverUser.avatarUrl || serverUser.picture || prev.picture,
              };
            });
          }
        })
        .catch(() => {
          // Offline or network error
        });
    }
  }, [user?.email]);

  const login = (newUser: User) => {
    setUser(newUser);
  };

  const loginWithCredentials = async (email: string, password: string): Promise<{ success: boolean; user: User }> => {
    const res = await api.loginWithCredentials(email, password);
    const authenticatedUser: User = {
      ...res.user,
      picture: res.user.avatarUrl || res.user.picture,
    };
    setUser(authenticatedUser);
    return { success: true, user: authenticatedUser };
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    minecraftUsername?: string;
    minecraftEdition?: 'Java' | 'Bedrock';
  }): Promise<{ success: boolean; user: User }> => {
    const res = await api.register(payload);
    const registeredUser: User = {
      ...res.user,
      picture: res.user.avatarUrl || res.user.picture,
    };
    setUser(registeredUser);
    return { success: true, user: registeredUser };
  };

  const loginWithGoogle = async (payload: { email: string; name?: string; picture?: string }): Promise<User> => {
    const res = await api.loginWithGoogle(payload);
    const googleUser: User = {
      ...res.user,
      picture: res.user.avatarUrl || res.user.picture,
    };
    setUser(googleUser);
    return googleUser;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('ironcloud_user');
    } catch {
      // ignore
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  const updateMinecraftAccount = async (username: string, edition: 'Java' | 'Bedrock' = 'Java') => {
    const cleanUsername = username.trim();
    let uuid = user?.minecraftUuid;
    let verified = user?.isMinecraftVerified || false;
    let newAvatar = user?.picture;

    try {
      const lookup = await api.lookupPlayer(cleanUsername);
      if (lookup) {
        uuid = lookup.uuid;
        verified = lookup.verified;
        if (!user?.picture || user.avatarSource === 'minecraft') {
          newAvatar = lookup.avatarUrl;
        }
      }
    } catch {
      // Keep existing or use minotar fallback
    }

    const updatedData: Partial<User> = {
      minecraftUsername: cleanUsername,
      minecraftEdition: edition,
      minecraftUuid: uuid,
      isMinecraftVerified: verified,
      picture: newAvatar,
      avatarUrl: newAvatar,
    };

    updateUser(updatedData);

    if (user?.email) {
      try {
        await api.updateProfile({ email: user.email, ...updatedData });
      } catch (err) {
        console.error('Failed to sync profile with server:', err);
      }
    }
  };

  const uploadProfilePicture = async (base64Image: string): Promise<string> => {
    if (!user) throw new Error('You must be signed in to upload a profile picture.');

    const updatedData: Partial<User> = {
      picture: base64Image,
      avatarUrl: base64Image,
      avatarSource: 'upload',
    };

    updateUser(updatedData);

    try {
      await api.uploadAvatar(user.email, base64Image);
    } catch (err) {
      console.warn('Saved avatar locally; server upload warning:', err);
    }

    return base64Image;
  };

  const updateProfile = async (data: Partial<User>): Promise<User> => {
    if (!user) throw new Error('Not authenticated');

    const updated: User = {
      ...user,
      ...data,
      picture: data.avatarUrl || data.picture || user.picture,
    };

    setUser(updated);

    try {
      await api.updateProfile(updated);
    } catch (err) {
      console.warn('Synced locally:', err);
    }

    return updated;
  };

  const isAdmin = Boolean(
    user && (user.role === 'OWNER' || user.role === 'ADMIN' || (user.role as string).toLowerCase() === 'admin')
  );

  const isOwner = Boolean(
    user && user.role === 'OWNER' && user.email.toLowerCase() === 'ironcloudmc@gmail.com'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin,
        isOwner,
        login,
        loginWithCredentials,
        register,
        loginWithGoogle,
        logout,
        updateUser,
        updateMinecraftAccount,
        uploadProfilePicture,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
