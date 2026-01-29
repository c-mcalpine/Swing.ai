import { supabase } from "./supabaseClient";

export async function ensureDevSession() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) console.warn("[ensureDevSession] getSession error", sessionError);

  if (sessionData.session) {
    console.log("[ensureDevSession] existing session", sessionData.session.user.id);
    return sessionData.session;
  }

  const email = import.meta.env.VITE_DEV_EMAIL;
  const password = import.meta.env.VITE_DEV_PASSWORD;

  if (!email || !password) {
    console.warn("[ensureDevSession] Missing VITE_DEV_EMAIL / VITE_DEV_PASSWORD");
    return null;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("[ensureDevSession] signIn error", error);
    throw error;
  }

  console.log("[ensureDevSession] signed in", data.session?.user.id ?? null);
  return data.session ?? null;
}
