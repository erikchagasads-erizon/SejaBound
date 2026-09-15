import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * ⚠️  SERVICE ROLE — Bypassa TODAS as RLS policies.
 * Use SOMENTE em Server Actions, Route Handlers ou scripts de seed.
 * NUNCA importe de código 'use client'.
 *
 * Não usa cookies (não precisa — já está autenticado pela service role).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      '[Bound] Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias para o admin client.'
    );
  }

  return createSupabaseClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
