/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';
export const supabase = createClient(url, key);
export async function getAuthToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
}
