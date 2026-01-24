// Dosya: app/api/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createShopier } from '@/lib/shopier';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // Max 10 requests per minute per IP

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { count: 1, lastReset: now });
    return false;
  }

  if (record.count >= MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

export async function POST(request: NextRequest) {
  const clientKey = getRateLimitKey(request);

  // Rate limiting check
  if (isRateLimited(clientKey)) {
    console.warn(`[Shopier Callback] Rate limit exceeded for IP: ${clientKey}`);
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    // 1. Shopier'den gelen Form Verisini alıyoruz
    const formData = await request.formData();
    const body: Record<string, string> = {};
    formData.forEach((value, key) => (body[key] = String(value)));

    // 2. Shopier nesnesini oluştur
    const shopier = createShopier();

    // 3. İmzayı doğrula (try-catch ile sarmalanmış)
    let paymentResult: ReturnType<typeof shopier.callback> | false;
    try {
      // callback fonksiyonu sadece body alır (secret'ı constructor'da verdik veya env'den okur)
      paymentResult = shopier.callback(body);
    } catch (signatureError) {
      console.error('[Shopier Callback] Signature validation error:', signatureError);
      console.error('[Shopier Callback] Request body:', JSON.stringify(body, null, 2));

      const redirectUrl = new URL('/callback', request.url);
      redirectUrl.searchParams.set('status', 'failed');
      redirectUrl.searchParams.set('error', 'ERR_SIGNATURE_ERROR');
      return NextResponse.redirect(redirectUrl);
    }

    if (paymentResult !== false) {
      // --- ÖDEME BAŞARILI ---
      console.log('[Shopier Callback] Payment successful:', {
        orderId: paymentResult.order_id,
        timestamp: new Date().toISOString(),
      });

      // Sipariş durumunu "paid" olarak güncelle ve ürün slug'ını al
      let productSlug = '';
      try {
        // RPC fonksiyonu kullan - SECURITY DEFINER ile RLS bypass
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        console.log('[Shopier Callback] Updating order with shopier_order_id:', paymentResult.order_id);

        // Security Definer fonksiyonu çağır
        const { data, error } = await supabase.rpc('update_order_status_by_shopier_id', {
          p_shopier_order_id: paymentResult.order_id,
          p_status: 'paid'
        });

        console.log('[Shopier Callback] RPC result:', { data, error });

        if (data && data.length > 0) {
          productSlug = data[0].product_slug || '';
          console.log('[Shopier Callback] Order updated successfully, product:', productSlug);
        } else {
          console.log('[Shopier Callback] Order not found for shopier_order_id:', paymentResult.order_id);
        }
      } catch (dbError) {
        console.error('[Shopier Callback] DB update error:', dbError);
      }

      // Kullanıcıyı Başarılı Sayfasına Yönlendir
      const redirectUrl = new URL('/callback', request.url);
      redirectUrl.searchParams.set('status', 'success');
      redirectUrl.searchParams.set('order_id', paymentResult.order_id || '');
      if (productSlug) {
        redirectUrl.searchParams.set('product', productSlug);
      }

      // HTTP 303 See Other: POST işleminden sonra GET sayfasına yönlendirmek için standart
      return NextResponse.redirect(redirectUrl, { status: 303 });
    } else {
      // --- ÖDEME GEÇERSİZ ---
      console.error('[Shopier Callback] Invalid signature! Possible fraud attempt.', {
        ip: clientKey,
        timestamp: new Date().toISOString(),
      });

      const redirectUrl = new URL('/callback', request.url);
      redirectUrl.searchParams.set('status', 'failed');
      redirectUrl.searchParams.set('error', 'ERR_INVALID_SIGNATURE');

      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
  } catch (error) {
    console.error('[Shopier Callback] System error:', error);

    // Sistem hatası durumunda yönlendirme
    return NextResponse.redirect(
      new URL('/callback?status=failed&error=ERR_SYSTEM', request.url),
      { status: 303 }
    );
  }
}