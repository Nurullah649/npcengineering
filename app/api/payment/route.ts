// Dosya: app/api/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createShopier } from '@/lib/shopier';
import { getProductBySlug } from '@/lib/products';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { validatePaymentRequest, sanitizeInput } from '@/lib/payment-validation';

// ... Enum tanımları (ProductType, CurrencyType) aynı kalsın ...
enum ProductType {
  REAL_OBJECT = 0,
  DOWNLOADABLE_VIRTUAL = 1,
  DEFAULT = 2
}
enum CurrencyType { TL = 0, USD = 1, EUR = 2 }

// Server-side auth için Supabase client
async function getAuthClient() {
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

// ARTIK "POST" KULLANIYORUZ
export async function POST(request: NextRequest) {
  try {
    // 1. Frontend'den gelen JSON verisini oku
    const body = await request.json();

    // ======== PAYMENT VALIDATION ========
    // Zod ile input validation
    const validation = validatePaymentRequest(body);

    if (!validation.success) {
      console.log('[Payment API] Validation failed:', validation.errors);
      return NextResponse.json(
        { error: 'Geçersiz form verisi', details: validation.errors },
        { status: 400 }
      );
    }

    const { slug, buyer } = validation.data!;
    // Sanitize edilmiş buyer verileri
    const safeBuyer = {
      name: sanitizeInput(buyer.name),
      surname: sanitizeInput(buyer.surname),
      email: buyer.email.toLowerCase().trim(),
      phone: buyer.phone,
    };
    // ====================================

    const product = await getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    // 2. Kullanıcı oturumunu kontrol et
    const supabase = await getAuthClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[Payment API] Auth check:', { userId: user?.id, authError });

    if (!user) {
      console.log('[Payment API] No user session found');
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
    }

    const orderId = `NPC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 3. Order'ı veritabanına kaydet
    const { data: dbProduct, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single();

    console.log('[Payment API] Product lookup:', { slug, dbProduct, productError });

    if (dbProduct) {
      const orderData = {
        user_id: user.id,
        product_id: dbProduct.id,
        amount: product.price,
        status: 'pending',
        shopier_order_id: orderId,
      };

      console.log('[Payment API] Creating order:', orderData);

      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select('id')
        .single();

      console.log('[Payment API] Order creation result:', { createdOrder, orderError });

      if (orderError) {
        console.error('[Payment API] Order creation error:', orderError);
      }
    } else {
      console.error('[Payment API] Product not found in database for slug:', slug);
    }

    const shopier = createShopier();

    shopier.setCurrency(CurrencyType.TL);

    // 4. Sanitize edilmiş verileri kullan
    shopier.setBuyer({
      buyer_id_nr: '11111111111', // TC No (Zorunlu ama sanal üründe maskelenebilir)
      platform_order_id: orderId,
      product_name: product.name,
      product_type: ProductType.DOWNLOADABLE_VIRTUAL,
      buyer_name: safeBuyer.name,       // Sanitize edilmiş Ad
      buyer_surname: safeBuyer.surname, // Sanitize edilmiş Soyad
      buyer_email: safeBuyer.email,     // Normalize edilmiş Email
      buyer_phone: safeBuyer.phone,     // Validate edilmiş Telefon
      buyer_account_age: 0
    });

    // Adres bilgileri (Dijital ürün olduğu için sabit kalabilir)
    const address = {
      billing_address: 'Dijital Teslimat',
      billing_city: 'Istanbul',
      billing_country: 'Turkey',
      billing_postcode: '34000',
    };

    shopier.setOrderBilling(address);
    shopier.setOrderShipping({
      shipping_address: address.billing_address,
      shipping_city: address.billing_city,
      shipping_country: address.billing_country,
      shipping_postcode: address.billing_postcode
    });

    const paymentPageHtml = shopier.generatePaymentHTML(product.price);

    // HTML'i string olarak JSON içinde dönüyoruz.
    // Frontend bunu alıp sayfaya basacak.
    return NextResponse.json({ html: paymentPageHtml });

  } catch (error) {
    console.error('Shopier Hatası:', error);
    return NextResponse.json({ error: 'Ödeme başlatılamadı' }, { status: 500 });
  }
}