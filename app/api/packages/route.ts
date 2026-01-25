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

        // Kullanıcı bilgisini ve geçmiş siparişlerini kontrol et (İndirim için)
        // Eğer kullanıcı giriş yapmışsa ve daha önce completed/paid siparişi yoksa indirim uygula
        let isFirstTimeBuyer = false;
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .in('status', ['paid', 'completed']);

            if (!error && count === 0) {
                isFirstTimeBuyer = true;
            }
        } else {
            // Giriş yapmamış kullanıcıya "Giriş yaparsan indirim var" diyebiliriz (UX kararı)
            // Şimdilik varsayılan fiyattan gösteriyoruz, giriş yapınca indirim çıkacak.
        }

        let query = supabase
            .from('packages')
            .select(`
        id,
        product_id,
        name,
        description,
        features,
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

        // Fiyat hesaplama ve indirim mantığı
        const packagesWithPricing = packages?.map(pkg => {
            let finalPrice = pkg.price;
            let appliedDiscountPercentage = pkg.discount_percentage || 0;
            let originalPrice = null;
            let discountLabel = null;

            // First Time Buyer İndirimi
            if (isFirstTimeBuyer) {
                if (pkg.duration_months === 1) {
                    // Aylık pakette %50 indirim
                    originalPrice = pkg.price;
                    finalPrice = pkg.price * 0.5;
                    appliedDiscountPercentage = 50;
                    discountLabel = "İlk ay %50 indirim!";
                } else if (pkg.duration_months === 12) {
                    // Yıllık pakette: Toplam fiyattan 0.5 aylık ücret kadar indirim
                    // Örneğin: Aylık 100 TL, Yıllık 1000 TL (10 ay)
                    // İndirim: 100 * 0.5 = 50 TL
                    // Yeni Yıllık: 950 TL

                    // Aylık paketi bul (base price için)
                    const monthlyPkg = packages.find(p => p.duration_months === 1);
                    if (monthlyPkg) {
                        const monthlyPrice = monthlyPkg.price;
                        const discountAmount = monthlyPrice * 0.5;

                        originalPrice = pkg.price;
                        finalPrice = pkg.price - discountAmount;

                        // Yüzdeyi tekrar hesapla
                        const diff = originalPrice - finalPrice;
                        appliedDiscountPercentage = Math.round((diff / originalPrice) * 100);
                        discountLabel = "İlk yıla özel ekstra indirim!";
                    }
                }
            }

            // Tasarruf hesapla (Aylık paket fiyatına kıyasla yıllık ne kadar karlı?)
            // Base package her zaman 1 aylık olandır
            const basePackage = packages.find(p => p.duration_months === 1);
            const monthlyEquivalent = finalPrice / pkg.duration_months;

            let savings = 0;
            if (basePackage && pkg.duration_months > 1) {
                // Eğer 1 ay alsaydı toplam ne öderdi? (Base Price * Duration)
                // Kıyaslama: Şu an ne ödüyor? (Final Price)
                const totalIfMonthly = basePackage.price * pkg.duration_months;
                savings = totalIfMonthly - finalPrice;
            }

            return {
                ...pkg,
                price: finalPrice, // Gösterilecek fiyat
                original_price: originalPrice, // Üstü çizili fiyat (varsa)
                discount_percentage: appliedDiscountPercentage,
                discount_label: discountLabel,
                monthly_equivalent: Math.round(monthlyEquivalent * 100) / 100,
                savings: Math.round(savings * 100) / 100,
                is_first_time_offer: isFirstTimeBuyer
            };
        });

        return NextResponse.json({
            packages: packagesWithPricing,
            isFirstTimeBuyer
        });
    } catch (error) {
        console.error('[Packages API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu' },
            { status: 500 }
        );
    }
}
