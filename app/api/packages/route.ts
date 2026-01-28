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
        multiplier,
        discount_percentage,
        is_active,
        products (
          id,
          name,
          slug,
          price
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
            let basePrice = pkg.price;
            // @ts-ignore
            if (pkg.multiplier && pkg.products?.price) {
                // @ts-ignore
                basePrice = Number(pkg.products.price) * Number(pkg.multiplier);
            }
            basePrice = basePrice || 0;

            let finalPrice = basePrice;
            let appliedDiscountPercentage = pkg.discount_percentage || 0;
            let originalPrice = null;
            let discountLabel = null;

            // --- REFERRAL DISCOUNT START ---
            // Referans indirimi (Kümülatif hesaplanıp en son uygulanabilir veya sıra ile)
            // Strateji: Önce First Time Buyer indirimi varsa onu hesapla,
            // Üstüne Referans indirimini ekle (veya ayrı ayrı).
            // Kullanıcının "referral_count" bilgisini henüz almadık. Yukarıda user check var.
            // Bu map içinde async işlem yapamayız. Yukarıda çekmemiz lazım.
            // Ancak user check bloğu içinde profile sorgusu yapmalıyız. 
            // Bu sebeple bu kodu map dışına çıkarıp profile bilgisini alacağız.
            // (Aşağıda düzeltilmiş tam blok olacak)

            // ... (Logic moved to main block below) ...

            return { ...pkg }; // Placeholder for diff context
        });

        // *** LOGIC REWRITE START ***

        let referralDiscountRate = 0;
        let referralCount = 0;

        if (user) {
            // Referans sayısını çek
            const { data: profile } = await supabase
                .from('profiles')
                .select('referral_count')
                .eq('id', user.id)
                .single();

            if (profile?.referral_count) {
                referralCount = profile.referral_count;
                // Max %50 indirim (10 kişi)
                referralDiscountRate = Math.min(referralCount * 5, 50);
            }
        }

        const calculatedPackages = packages?.map(pkg => {
            let basePrice = pkg.price;
            // @ts-ignore
            if (pkg.multiplier && pkg.products?.price) {
                // @ts-ignore
                basePrice = Number(pkg.products.price) * Number(pkg.multiplier);
            }
            basePrice = basePrice || 0;

            let finalPrice = basePrice;
            let appliedDiscountPercentage = pkg.discount_percentage || 0;
            let originalPrice = null;
            let discountLabel = null;

            // 1. First Time Buyer İndirimi
            if (isFirstTimeBuyer) {
                if (pkg.duration_months === 1) {
                    originalPrice = basePrice;
                    finalPrice = basePrice * 0.5;
                    appliedDiscountPercentage = 50;
                    discountLabel = "İlk ay %50 indirim!";
                } else if (pkg.duration_months === 12) {
                    const monthlyPkg = packages.find(p => p.duration_months === 1);
                    if (monthlyPkg) {
                        let monthlyBasePrice = monthlyPkg.price;
                        // @ts-ignore
                        if (monthlyPkg.multiplier && monthlyPkg.products?.price) {
                            // @ts-ignore
                            monthlyBasePrice = Number(monthlyPkg.products.price) * Number(monthlyPkg.multiplier);
                        }
                        const monthlyPrice = monthlyBasePrice || 0;
                        const discountAmount = monthlyPrice * 0.5;

                        originalPrice = basePrice;
                        finalPrice = basePrice - discountAmount;

                        const diff = originalPrice - finalPrice;
                        appliedDiscountPercentage = Math.round((diff / originalPrice) * 100);
                        discountLabel = "İlk yıla özel ekstra indirim!";
                    }
                }
            }

            // 2. Referral İndirimi (Varsa)
            if (referralDiscountRate > 0) {
                // Eğer zaten indirim yapılmışsa (First Time Buyer), referans indirimi kalan tutar üzerinden mi yoksa ana para üzerinden mi?
                // Genellikle kullanıcı lehine kümülatif indirim sevilir ama %50 + %50 bedava olabilir.
                // Karar: First Time Buyer varsa referans indirimi uygulanmasın veya çok az uygulansın.
                // VEYA: Referans indirimi her zaman "Ekstra" olarak uygulanır.

                // Basitlik için: First Time Buyer yoksa Referans indirimi uygulanır.
                // Veya: First Time Buyer ile birleşince max %anlamlı bir oran.

                // Senaryo:
                // First Time: %50 (Aylık)
                // Referral: %50 (10 kişi)
                // Toplam: %100?

                // Kullanıcı isteğinde "Kişi başı %5 indirim" denmiş.
                // Mevcut First Time indirimi sistemde hardcoded business logic.
                // Referans indirimini bu fiyata *ek* indirim olarak uygulayalım.

                if (!originalPrice) {
                    originalPrice = basePrice;
                }

                // Mevcut finalPrice üzerinden indirim yapalım (Ardışık indirim)
                // finalPrice = finalPrice * (1 - rate/100)

                const discountAmount = finalPrice * (referralDiscountRate / 100);
                finalPrice = finalPrice - discountAmount;

                // Yeni toplam yüzde
                const totalDiff = (originalPrice || basePrice) - finalPrice;
                appliedDiscountPercentage = Math.round((totalDiff / (originalPrice || basePrice)) * 100);

                if (discountLabel) {
                    discountLabel += ` + %${referralDiscountRate} Referans İndirimi`;
                } else {
                    discountLabel = `%${referralDiscountRate} Referans İndirimi (${referralCount} kişi)`;
                }
            }

            // Tasarruf
            const basePackage = packages.find(p => p.duration_months === 1);
            const monthlyEquivalent = finalPrice / pkg.duration_months;
            let savings = 0;
            if (basePackage && pkg.duration_months > 1) {
                const totalIfMonthly = basePackage.price * pkg.duration_months;
                savings = totalIfMonthly - finalPrice;
            }

            return {
                ...pkg,
                price: finalPrice,
                original_price: originalPrice,
                discount_percentage: appliedDiscountPercentage,
                discount_label: discountLabel,
                monthly_equivalent: Math.round(monthlyEquivalent * 100) / 100,
                savings: Math.round(savings * 100) / 100,
                is_first_time_offer: isFirstTimeBuyer,
                referral_discount_rate: referralDiscountRate
            };
        });

        return NextResponse.json({
            packages: calculatedPackages,
            isFirstTimeBuyer,
            referralDiscountRate
        });
    } catch (error) {
        console.error('[Packages API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu' },
            { status: 500 }
        );
    }
}
