import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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

// GET: Kullanıcının aboneliklerini getir
export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // 'active', 'expired', 'all'

        let query = supabase
            .from('subscriptions')
            .select(`
        id,
        user_id,
        product_id,
        package_id,
        order_id,
        start_date,
        end_date,
        status,
        created_at,
        products (
          id,
          name,
          slug,
          image_url
        ),
        packages (
          id,
          name,
          duration_months,
          price
        )
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        // Duruma göre filtrele
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: subscriptions, error } = await query;

        if (error) {
            console.error('[Subscriptions API] Error:', error);
            return NextResponse.json(
                { error: 'Abonelikler yüklenirken hata oluştu' },
                { status: 500 }
            );
        }

        // Kalan günleri hesapla
        const now = new Date();
        const subscriptionsWithDays = subscriptions?.map(sub => {
            const endDate = new Date(sub.end_date);
            const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const totalDays = Math.ceil((endDate.getTime() - new Date(sub.start_date).getTime()) / (1000 * 60 * 60 * 24));
            const progressPercentage = totalDays > 0 ? Math.round(((totalDays - remainingDays) / totalDays) * 100) : 100;

            return {
                ...sub,
                remaining_days: remainingDays,
                total_days: totalDays,
                progress_percentage: progressPercentage,
                is_expiring_soon: remainingDays <= 7 && remainingDays > 0,
                is_expired: remainingDays === 0
            };
        });

        return NextResponse.json({ subscriptions: subscriptionsWithDays });
    } catch (error) {
        console.error('[Subscriptions API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu' },
            { status: 500 }
        );
    }
}

// POST: Yeni abonelik oluştur (ödeme sonrası callback'den çağrılır)
export async function POST(request: NextRequest) {
    try {
        const supabase = await getSupabaseClient();

        const body = await request.json();
        const { user_id, product_id, package_id, order_id } = body;

        if (!user_id || !product_id || !package_id || !order_id) {
            return NextResponse.json(
                { error: 'Eksik parametreler' },
                { status: 400 }
            );
        }

        // Paketi getir (süre hesabı için)
        const { data: pkg, error: pkgError } = await supabase
            .from('packages')
            .select('duration_months')
            .eq('id', package_id)
            .single();

        if (pkgError || !pkg) {
            return NextResponse.json(
                { error: 'Paket bulunamadı' },
                { status: 404 }
            );
        }

        // Bitiş tarihini hesapla
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + pkg.duration_months);

        // Abonelik oluştur
        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .insert({
                user_id,
                product_id,
                package_id,
                order_id,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            console.error('[Subscriptions API] Create error:', error);
            return NextResponse.json(
                { error: 'Abonelik oluşturulamadı' },
                { status: 500 }
            );
        }

        return NextResponse.json({ subscription });
    } catch (error) {
        console.error('[Subscriptions API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu' },
            { status: 500 }
        );
    }
}
