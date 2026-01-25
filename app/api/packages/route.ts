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

// GET: Ürüne göre paketleri listele
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');
        const productSlug = searchParams.get('slug');

        const supabase = await getSupabaseClient();

        let query = supabase
            .from('packages')
            .select(`
        id,
        product_id,
        name,
        duration_months,
        price,
        discount_percentage,
        is_active,
        products (
          id,
          name,
          slug
        )
      `)
            .eq('is_active', true)
            .order('duration_months', { ascending: true });

        // Ürün ID veya slug ile filtrele
        if (productId) {
            query = query.eq('product_id', productId);
        } else if (productSlug) {
            // Önce ürün ID'sini bul
            const { data: product } = await supabase
                .from('products')
                .select('id')
                .eq('slug', productSlug)
                .single();

            if (product) {
                query = query.eq('product_id', product.id);
            }
        }

        const { data: packages, error } = await query;

        if (error) {
            console.error('[Packages API] Error:', error);
            return NextResponse.json(
                { error: 'Paketler yüklenirken hata oluştu' },
                { status: 500 }
            );
        }

        // Tasarruf miktarını hesapla (1 aylık fiyata göre)
        const packagesWithSavings = packages?.map(pkg => {
            const monthlyEquivalent = pkg.price / pkg.duration_months;
            const basePackage = packages?.find(p => p.duration_months === 1);
            const savings = basePackage
                ? (basePackage.price * pkg.duration_months) - pkg.price
                : 0;

            return {
                ...pkg,
                monthly_equivalent: Math.round(monthlyEquivalent * 100) / 100,
                savings: Math.round(savings * 100) / 100
            };
        });

        return NextResponse.json({ packages: packagesWithSavings });
    } catch (error) {
        console.error('[Packages API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu' },
            { status: 500 }
        );
    }
}
