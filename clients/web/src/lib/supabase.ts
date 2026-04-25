import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
}

/**
 * Supabase 前端客户端（使用 anon/public key）
 * 权限受 RLS 策略限制，玩家只能访问自己的数据
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** 获取当前登录用户的 JWT token，用于向游戏服务端发请求 */
export async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** 服务端 API 基础 URL */
export const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';
