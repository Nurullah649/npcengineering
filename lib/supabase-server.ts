import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from './env'

// Cookie type for setAll
interface CookieToSet {
    name: string
    value: string
    options: CookieOptions
}

/**
 * Server-side Supabase client
 * Use this in Server Components, Server Actions, and Route Handlers
 */
export async function createServerSupabase() {
    const cookieStore = await cookies()

    return createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet: CookieToSet[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Server Component'tan çağrılırsa sessizce devam et
                        // (set işlemi sadece Route Handler ve Server Action'da çalışır)
                    }
                },
            },
        }
    )
}

/**
 * Admin kontrolü yapan helper
 * Throws error if not admin
 */
export async function requireAdmin() {
    const supabase = await createServerSupabase()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Oturum açmanız gerekiyor')
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (error || profile?.role !== 'admin') {
        throw new Error('Bu işlem için admin yetkisi gerekiyor')
    }

    return { user, supabase }
}
