import React, { createContext, useContext, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { useSession } from '@/hooks/useSession';
import { auth } from './supabase';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  userId: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth provider component - wrap your app with this
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, loading, userId } = useSession();

  const signIn = async (email: string, password: string) => {
    await auth.signInWithPassword(email, password);
  };

  const signUp = async (email: string, password: string, username?: string) => {
    await auth.signUp(email, password, username ? { username } : undefined);
  };

  const signOut = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        userId,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * 
 * @example
 * ```typescript
 * const { session, userId, signOut } = useAuth();
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
