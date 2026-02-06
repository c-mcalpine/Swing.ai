import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import type { Database } from './supabaseTypes';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Custom storage adapter using Expo SecureStore
 * Stores auth tokens securely in iOS Keychain / Android Keystore
 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('[SecureStore] getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('[SecureStore] setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('[SecureStore] removeItem error:', error);
    }
  },
};

/**
 * Supabase client with secure session storage and PKCE flow
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for mobile
    flowType: 'pkce', // Use PKCE for enhanced security
  },
});

/**
 * Auth helper functions
 */
export const auth = {
  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[Auth] getSession error:', error);
      return null;
    }
    return data.session;
  },

  /**
   * Get current user
   */
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('[Auth] getUser error:', error);
      return null;
    }
    return data.user;
  },

  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('[Auth] signInWithPassword error:', error);
      throw error;
    }
    
    console.log('[Auth] signed in:', data.user?.id);
    return data;
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, metadata?: { username?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    
    if (error) {
      console.error('[Auth] signUp error:', error);
      throw error;
    }
    
    console.log('[Auth] signed up:', data.user?.id);
    return data;
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[Auth] signOut error:', error);
      throw error;
    }
    
    console.log('[Auth] signed out');
  },

  /**
   * Subscribe to auth state changes
   * @param callback - Function to call when auth state changes
   * @returns Unsubscribe function
   */
  onAuthStateChange(callback: (session: any) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    
    // Return unsubscribe function
    return data.subscription.unsubscribe;
  },
};
