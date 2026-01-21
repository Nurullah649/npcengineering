// Dosya: app/api/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createShopier } from '@/lib/shopier';
import { getProductBySlug } from '@/lib/products';

// ... Enum tanımları (ProductType, CurrencyType) aynı kalsın ...
enum ProductType {
  REAL_OBJECT = 0,
  DOWNLOADABLE_VIRTUAL = 1,
  DEFAULT = 2
}
enum CurrencyType { TL = 0, USD = 1, EUR = 2 }

// ARTIK "POST" KULLANIYORUZ
export async function POST(request: NextRequest) {
  try {
    // 1. Frontend'den gelen JSON verisini oku
    const body = await request.json();
    const { slug, buyer } = body;
    // buyer objesi şunları içermeli: { name, surname, email, phone }

    if (!slug) {
      return NextResponse.json({ error: 'Ürün bilgisi eksik' }, { status: 400 });
    }

    const product = await getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    const orderId = `NPC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const shopier = createShopier();

    shopier.setCurrency(CurrencyType.TL);

    // 2. Formdan gelen gerçek verileri kullan
    shopier.setBuyer({
      buyer_id_nr: '11111111111', // TC No (Zorunlu ama sanal üründe maskelenebilir)
      platform_order_id: orderId,
      product_name: product.name,
      product_type: ProductType.DOWNLOADABLE_VIRTUAL,
      buyer_name: buyer.name,       // Formdan gelen Ad
      buyer_surname: buyer.surname, // Formdan gelen Soyad
      buyer_email: buyer.email,     // Formdan gelen Email
      buyer_phone: buyer.phone,     // Formdan gelen Telefon
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