import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, auth } from '@/lib/supabase';

/**
 * Hook to manage and monitor Supabase session state
 * 
 * @returns {Object} Session state
 * @property {Session | null} session - Current session or null if not authenticated
 * @property {boolean} loading - True while checking initial session
 * @property {string | null} userId - Current user ID or null
 * 
 * @example
 * ```typescript
 * const { session, loading, userId } = useSession();
 * 
 * if (loading) return <LoadingScreen />;
 * if (!session) return <LoginScreen />;
 * return <HomeScreen userId={userId} />;
 * ```
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    auth.getSession().then((initialSession) => {
      setSession(initialSession);
      setLoading(false);
    });

    // Listen for auth changes
    const unsubscribe = auth.onAuthStateChange((newSession) => {
      console.log('[useSession] auth state changed:', newSession?.user?.id || 'signed out');
      setSession(newSession);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    session,
    loading,
    userId: session?.user?.id || null,
  };
}
