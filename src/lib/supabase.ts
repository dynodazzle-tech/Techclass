import { createClient } from '@supabase/supabase-js';

// Supabase project credentials provided by the user
export const SUPABASE_PROJECT_ID =
  (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID || 'nuvxtpwgdlzeqsdnbnpx';

export const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://nuvxtpwgdlzeqsdnbnpx.supabase.co';

export const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_foYtE--cKk39QoG5qizS-g_eM7EWwjY';

// Client-side Supabase instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export interface SupabaseHealthInfo {
  connected: boolean;
  projectId: string;
  url: string;
  publishableKeyPrefix: string;
  latencyMs: number;
  authOperational: boolean;
  error?: string | null;
}

/**
 * Check connection to Supabase backend directly from client
 */
export async function checkClientSupabaseConnection(): Promise<SupabaseHealthInfo> {
  const startTime = Date.now();
  try {
    const { error } = await supabase.auth.getSession();
    const latencyMs = Date.now() - startTime;
    return {
      connected: !error,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
      publishableKeyPrefix: SUPABASE_ANON_KEY.substring(0, 18) + '...',
      latencyMs,
      authOperational: true,
      error: error ? error.message : null
    };
  } catch (err: any) {
    return {
      connected: false,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
      publishableKeyPrefix: SUPABASE_ANON_KEY.substring(0, 18) + '...',
      latencyMs: Date.now() - startTime,
      authOperational: false,
      error: err?.message || 'Failed to connect to Supabase'
    };
  }
}
