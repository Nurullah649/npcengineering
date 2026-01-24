import { createBrowserClient } from '@supabase/ssr'
import { env } from './env'

// Client-side Supabase client (browser only)
// Environment variables validated by env.ts at startup
export const supabase = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)