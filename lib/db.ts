// Supabase client — 用 service_role 走後端 (繞過 RLS、跑 admin 動作)
// 不用 KV/Blob,完全 Supabase 統一
//
// 重要: 這是 SERVER-ONLY module。絕對不能 import 到 client component。
// 因為 SUPABASE_SERVICE_ROLE_KEY 必須保密,只能 server-side 用。

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getEnv(name: string): string | undefined {
  // 同時看 process.env (server runtime) 跟 .env.local
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  return undefined;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !key) {
    throw new Error(
      'Supabase env 缺失。需要 SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY。' +
      '到 Vercel Dashboard → Project → Settings → Environment Variables 設定。',
    );
  }

  _client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _client;
}

export const HAS_SUPABASE = !!(
  (getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL')) &&
  getEnv('SUPABASE_SERVICE_ROLE_KEY')
);
