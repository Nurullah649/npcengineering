import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client
// NOT: env.ts kullanılamaz çünkü server-only değişkenleri içeriyor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are missing')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseKey)