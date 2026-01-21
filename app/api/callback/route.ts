import { NextRequest, NextResponse } from 'next/server';
import { shopier } from '@/lib/shopier';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const body: any = {};
    formData.forEach((value, key) => (body[key] = value));

    // Paylaştığınız class'taki callback metodunu kullanıyoruz
    // Bu metod imzayı doğrular ve geçerliyse ödeme detaylarını döner
    const paymentResult = shopier.callback(body);

    if (paymentResult !== false) {
        // ÖDEME BAŞARILI
        // paymentResult.order_id içinde sipariş numaranız var (örn: NPC-173...)
        // paymentResult.payment_id içinde Shopier ödeme ID'si var

        // BURADA: Veritabanında siparişi onaylayabilirsiniz.

        // Kullanıcıyı sizin istediğiniz success sayfasına yönlendiriyoruz
        // Ürün adı ve fiyatı veritabanından veya state'den alınabilir, şimdilik URL'e ekliyoruz
        const redirectUrl = new URL('/callback', request.url);
        redirectUrl.searchParams.set('status', 'success');
        redirectUrl.searchParams.set('order_id', paymentResult.order_id);
        // İsteğe bağlı: Ürün adı ve fiyatı veritabanından çekilip eklenebilir

        return NextResponse.redirect(redirectUrl);
    } else {
        // ÖDEME BAŞARISIZ veya SAHTE İMZA
        console.error('Shopier imza doğrulaması başarısız!');

        const redirectUrl = new URL('/callback', request.url);
        redirectUrl.searchParams.set('status', 'failed');
        redirectUrl.searchParams.set('error', 'ERR_INVALID_SIGNATURE');

        return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('Callback hatası:', error);
    return NextResponse.redirect(new URL('/callback?status=failed&error=ERR_SYSTEM', request.url));
  }
}