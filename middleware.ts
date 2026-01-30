import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Get current user session
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Shopier Callback Rewrite
    // Shopier bazen direkt frontend URL'ine POST atıyor (/callback), bu da 405 hatası veriyor.
    // Bunu yakalayıp API route'una rewrite ediyoruz.
    if (pathname === '/callback' && request.method === 'POST') {
        const url = request.nextUrl.clone()
        url.pathname = '/api/callback'
        return NextResponse.rewrite(url)
    }

    // Protected routes: /dashboard/*
    if (pathname.startsWith('/dashboard')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('redirect', pathname)
            return NextResponse.redirect(url)
        }
    }

    // Admin routes: /admin/*
    if (pathname.startsWith('/admin')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Admin kontrolü - SADECE profiles tablosundan (user_metadata güvenilmez)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('Middleware: Profile fetch error', profileError)
            // Database hatası - güvenli tarafta kal, dashboard'a yönlendir
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }

        let isAdmin = profile?.role === 'admin'

        // ======== ADMIN WHITELIST FIX REMOVED ========
        // Email bazlı admin erişimi veritabanından (profiles.role) yönetilmelidir.
        // =============================================

        if (!isAdmin) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/dashboard/:path*',
        '/callback', // Callback route eklendi
    ],
}
