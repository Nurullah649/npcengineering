import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit, getClientIP, rateLimitConfigs } from '@/lib/rate-limit';

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

// GET: Kullanıcının ürün hesap bilgilerini getir
export async function GET(request: NextRequest) {
    try {
        // Rate limit kontrolü (hassas endpoint)
        const clientIP = getClientIP(request);
        const rateLimit = checkRateLimit(`user-accounts:${clientIP}`, rateLimitConfigs.sensitive);

        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Çok fazla istek. Lütfen bekleyin.', retryAfter: Math.ceil(rateLimit.resetIn / 1000) },
                { status: 429, headers: { 'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString() } }
            );
        }

        const supabase = await getSupabaseClient();

        // Kullanıcı oturumunu kontrol et
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Giriş yapmanız gerekiyor' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const subscriptionId = searchParams.get('subscription_id');
        const productId = searchParams.get('product_id');

        let query = supabase
            .from('user_product_accounts')
            .select(`
        id,
        subscription_id,
        user_id,
        product_id,
        username,
        password_encrypted,
        additional_info,
        created_at,
        updated_at,
        subscriptions (
          id,
          start_date,
          end_date,
          status
        ),
        products (
          id,
          name,
          slug
        )
      `)
            .eq('user_id', user.id);

        if (subscriptionId) {
            query = query.eq('subscription_id', subscriptionId);
        }
        if (productId) {
            query = query.eq('product_id', productId);
        }

        const { data: accounts, error } = await query;

        if (error) {
            console.error('[User Accounts API] Error:', error);
            return NextResponse.json(
                { error: 'Hesap bilgileri yüklenirken hata oluştu' },
                { status: 500 }
            );
        }

        // Şifreleri maskele (sadece görüntüleme için)
        const maskedAccounts = accounts?.map(account => ({
            ...account,
            password_masked: '••••••••', // Gerçek şifre frontend'de gösterilmeyecek
            has_password: !!account.additional_info?.password_set
        }));

        return NextResponse.json({ accounts: maskedAccounts });
    } catch (error) {
        console.error('[User Accounts API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu' },
            { status: 500 }
        );
    }
}

// POST: Yeni hesap bilgisi oluştur (sadece admin veya hesap sahibi tarafından)
export async function POST(request: NextRequest) {
    try {
        const supabase = await getSupabaseClient();

        // ======== AUTH KONTROLÜ ========
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Giriş yapmanız gerekiyor' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { subscription_id, user_id, product_id, username, password, additional_info } = body;

        if (!subscription_id || !user_id || !product_id) {
            return NextResponse.json(
                { error: 'Eksik parametreler' },
                { status: 400 }
            );
        }

        // Kullanıcı sadece kendi hesabına ekleme yapabilir
        // Admin ise diğer kullanıcılara da ekleyebilir
        if (user_id !== user.id) {
            // Admin kontrolü
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'admin') {
                console.warn(`[User Accounts] Unauthorized POST attempt by ${user.id} for user ${user_id}`);
                return NextResponse.json(
                    { error: 'Bu işlem için yetkiniz yok' },
                    { status: 403 }
                );
            }
        }
        // ================================

        // NOT: Gerçek uygulamada şifre şifrelenmeli (AES-256)
        // Şimdilik basit bir base64 encoding kullanıyoruz
        const password_encrypted = password ? Buffer.from(password).toString('base64') : null;

        const { data: account, error } = await supabase
            .from('user_product_accounts')
            .insert({
                subscription_id,
                user_id,
                product_id,
                username,
                password_encrypted,
                additional_info: {
                    ...additional_info,
                    password_set: !!password
                }
            })
            .select()
            .single();

        if (error) {
            console.error('[User Accounts API] Create error:', error);
            return NextResponse.json(
                { error: 'Hesap bilgisi oluşturulamadı' },
                { status: 500 }
            );
        }

        return NextResponse.json({ account });
    } catch (error) {
        console.error('[User Accounts API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu' },
            { status: 500 }
        );
    }
}
