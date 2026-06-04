import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in browser (client) components.
 * Call this inside component functions, not at module level.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
