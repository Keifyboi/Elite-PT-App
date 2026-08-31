import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Singleton for client-side use
let _client: ReturnType<typeof createClient> | null = null
export function getSupabaseClient() {
  if (!_client) _client = createClient()
  return _client
}

export type { User, Session } from '@supabase/supabase-js'
