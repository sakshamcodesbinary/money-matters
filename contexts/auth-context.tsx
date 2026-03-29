'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, type UserProfile } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, age?: number) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
//dont fucking touch this shit
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = api.getToken();
      if (!token) {
        setUser(null);
        return;
      }
      const { user: userData } = await api.getProfile();
      setUser(userData);
    } catch {
      setUser(null);
      api.setToken(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { user: userData } = await api.login({ email, password });
    setUser(userData as unknown as UserProfile);
  };

  const register = async (email: string, password: string, name: string, age?: number) => {
    await api.register({ email, password, name, age });
    await login(email, password);
  };

  const loginWithGoogle = async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const token = await cred.user.getIdToken();

    // Tell our backend to validate the token (and to normalize response shape)
    const { user: userData, token: returnedToken } = await api.request<{
      message: string;
      token: string;
      user: { uid: string; email: string; name: string };
    }>('/auth/google', {
      method: 'POST',
      body: { idToken: token },
    });

    api.setToken(returnedToken);
    setUser(userData as unknown as UserProfile);
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      try {
        await signOut(getFirebaseAuth());
      } catch {
        // ignore
      }
      setUser(null);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
