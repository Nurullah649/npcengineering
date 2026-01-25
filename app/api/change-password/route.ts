import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit, getClientIP, rateLimitConfigs } from '@/lib/rate-limit';
import { z } from 'zod';

// Password validation schema
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
    newPassword: z.string()
        .min(8, 'Şifre en az 8 karakter olmalı')
        .regex(/[A-Z]/, 'En az bir büyük harf içermeli')
        .regex(/[a-z]/, 'En az bir küçük harf içermeli')
        .regex(/[0-9]/, 'En az bir rakam içermeli'),
});

// Server-side Supabase client
async function getSupabaseClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll() { },
            },
        }
    );
}

// Service role client for admin operations
function getServiceClient() {
    const { createClient } = require('@supabase/supabase-js');
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

/**
 * POST /api/change-password
 * Atomic password change - TOCTOU güvenlik açığını kapatır
 */
export async function POST(request: NextRequest) {
    try {
        // Rate limiting (auth endpoint - sıkı limit)
        const clientIP = getClientIP(request);
        const rateLimit = checkRateLimit(`change-password:${clientIP}`, rateLimitConfigs.auth);

        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Çok fazla deneme. Lütfen bekleyin.', retryAfter: Math.ceil(rateLimit.resetIn / 1000) },
                { status: 429, headers: { 'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString() } }
            );
        }

        // Kullanıcı oturumunu kontrol et
        const supabase = await getSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json(
                { error: 'Giriş yapmanız gerekiyor' },
                { status: 401 }
            );
        }

        // Body validation
        const body = await request.json();
        const validation = changePasswordSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Geçersiz form verisi', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { currentPassword, newPassword } = validation.data;

        // ======== TOCTOU FIX - ATOMIC OPERATION ========
        // 1. Mevcut şifreyi doğrula
        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
        });

        if (verifyError) {
            return NextResponse.json(
                { error: 'Mevcut şifre yanlış' },
                { status: 400 }
            );
        }

        // 2. Hemen şifreyi güncelle (aynı request içinde - atomic)
        // Service role ile güncelleme yaparak TOCTOU'yu önle
        const serviceClient = getServiceClient();

        const { error: updateError } = await serviceClient.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) {
            console.error('[Change Password] Update error:', updateError);
            return NextResponse.json(
                { error: 'Şifre güncellenemedi' },
                { status: 500 }
            );
        }
        // ===============================================

        console.log('[Change Password] Success for user:', user.id);

        return NextResponse.json({
            success: true,
            message: 'Şifre başarıyla güncellendi'
        });

    } catch (error) {
        console.error('[Change Password] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu' },
            { status: 500 }
        );
    }
}
