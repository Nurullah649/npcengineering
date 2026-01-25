import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

// Validation schema
const createAccountSchema = z.object({
    username: z.string()
        .min(3, 'Kullanıcı adı en az 3 karakter olmalı')
        .max(30, 'Kullanıcı adı en fazla 30 karakter olabilir')
        .regex(/^[a-zA-Z0-9_]+$/, 'Sadece harf, rakam ve alt çizgi kullanılabilir'),
    password: z.string()
        .min(6, 'Şifre en az 6 karakter olmalı'),
    orderId: z.string().min(1, 'Sipariş ID gerekli'),
    product: z.string().optional(),
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

/**
 * POST /api/create-account
 * Ödeme sonrası hesap oluşturma - callback sayfası için
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await getSupabaseClient();

        // Kullanıcı oturumunu kontrol et
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Giriş yapmanız gerekiyor' },
                { status: 401 }
            );
        }

        // Body validation
        const body = await request.json();
        const validation = createAccountSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0]?.message || 'Geçersiz veri' },
                { status: 400 }
            );
        }

        const { username, password, orderId, product } = validation.data;

        // Order'ı kontrol et
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, user_id, status, product_id')
            .eq('shopier_order_id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Sipariş bulunamadı' },
                { status: 404 }
            );
        }

        if (order.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Bu siparişe erişim yetkiniz yok' },
                { status: 403 }
            );
        }

        if (order.status === 'completed') {
            return NextResponse.json(
                { error: 'Bu sipariş için hesap zaten oluşturulmuş' },
                { status: 400 }
            );
        }

        // Username benzersizliğini kontrol et (user_product_accounts tablosunda)
        const { data: existingAccount } = await supabase
            .from('user_product_accounts')
            .select('id')
            .eq('username', username.toLowerCase())
            .single();

        if (existingAccount) {
            return NextResponse.json(
                { error: 'Bu kullanıcı adı zaten kullanımda' },
                { status: 400 }
            );
        }

        // Subscription oluştur veya mevcut olanı bul
        let subscriptionId: string | null = null;

        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('order_id', order.id)
            .single();

        if (existingSub) {
            subscriptionId = existingSub.id;
        } else {
            // Yeni subscription oluştur
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30); // 30 günlük deneme

            const { data: newSub, error: subError } = await supabase
                .from('subscriptions')
                .insert({
                    user_id: user.id,
                    product_id: order.product_id,
                    order_id: order.id,
                    start_date: new Date().toISOString(),
                    end_date: endDate.toISOString(),
                    status: 'active'
                })
                .select('id')
                .single();

            if (subError) {
                console.error('[Create Account] Subscription error:', subError);
                return NextResponse.json(
                    { error: 'Abonelik oluşturulamadı' },
                    { status: 500 }
                );
            }
            subscriptionId = newSub.id;
        }

        // User product account oluştur
        const { data: account, error: accountError } = await supabase
            .from('user_product_accounts')
            .insert({
                subscription_id: subscriptionId,
                user_id: user.id,
                product_id: order.product_id,
                username: username.toLowerCase(),
                password_encrypted: Buffer.from(password).toString('base64'), // Basit encoding
                additional_info: { password_set: true }
            })
            .select('id, username')
            .single();

        if (accountError) {
            console.error('[Create Account] Account error:', accountError);
            return NextResponse.json(
                { error: 'Hesap oluşturulamadı' },
                { status: 500 }
            );
        }

        // Order'ı completed olarak güncelle
        await supabase
            .from('orders')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', order.id);

        return NextResponse.json({
            success: true,
            message: 'Hesap başarıyla oluşturuldu',
            username: account.username,
            // Şifreyi geri göndermiyoruz güvenlik için
        });

    } catch (error) {
        console.error('[Create Account] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu' },
            { status: 500 }
        );
    }
}
