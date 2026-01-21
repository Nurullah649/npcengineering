// Dosya: app/api/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createShopier } from '@/lib/shopier'; // DEĞİŞİKLİK 1: createShopier import edildi

export async function POST(request: NextRequest) {
  try {
    // 1. Shopier'den gelen Form Verisini alıyoruz
    const formData = await request.formData();
    const body: any = {};
    formData.forEach((value, key) => (body[key] = value));

    // DEĞİŞİKLİK 2: Shopier nesnesini burada oluşturuyoruz
    const shopier = createShopier();

    // 2. İmzayı doğruluyoruz
    // createShopier() içinde API key ve secret yüklendiği için doğrulama çalışır.
    const paymentResult = shopier.callback(body, process.env.SHOPIER_API_SECRET!);
    // Not: Bazı kütüphane versiyonlarında callback() içine secret'ı manuel vermek gerekebilir,
    // gerekmiyorsa sadece shopier.callback(body) yeterlidir.
    // Kullandığınız 'shopier-api' paketine göre burası 'shopier.callback(body, ...)' olabilir.

    // shopier-api paketinin standart kullanımında genellikle:
    // const isVerified = shopier.checkSignature(body, process.env.SHOPIER_API_SECRET);
    // şeklindedir ancak sizin library wrapper'ınızda 'callback' metodu varsa onu kullanın.

    // Varsayılan kütüphane davranışı üzerinden gidiyorum:
    if (paymentResult !== false) {
        // --- ÖDEME BAŞARILI ---
        // paymentResult şunları içerir: { order_id, payment_id, ... }

        console.log('Ödeme Başarılı:', paymentResult.order_id);

        // TODO: Veritabanında sipariş durumunu "Ödendi" olarak güncelleyin.
        // await db.orders.update({ where: { id: paymentResult.order_id }, data: { status: 'PAID' } });

        // Kullanıcıyı Başarılı Sayfasına Yönlendir
        const redirectUrl = new URL('/callback', request.url);
        redirectUrl.searchParams.set('status', 'success');
        // Türkçe karakter sorunu olmasın diye encode ediyoruz
        redirectUrl.searchParams.set('order_id', paymentResult.order_id || '');

        return NextResponse.redirect(redirectUrl);
    } else {
        // --- ÖDEME GEÇERSİZ ---
        console.error('Shopier imza doğrulaması başarısız! Sahte işlem girişimi olabilir.');

        const redirectUrl = new URL('/callback', request.url);
        redirectUrl.searchParams.set('status', 'failed');
        redirectUrl.searchParams.set('error', 'ERR_INVALID_SIGNATURE');

        return NextResponse.redirect(redirectUrl);
    }

  } catch (error) {
    console.error('Callback API Hatası:', error);
    // Sistem hatası durumunda yönlendirme
    return NextResponse.redirect(new URL('/callback?status=failed&error=ERR_SYSTEM', request.url));
  }
}