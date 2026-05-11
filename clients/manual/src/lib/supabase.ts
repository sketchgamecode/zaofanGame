import { createClient, type Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in clients/manual environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session as Session | null;
}
