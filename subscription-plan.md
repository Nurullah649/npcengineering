
## 5. Gelişmiş Abonelik ve Fiyatlandırma Planı (YENİ)

### 5.1. Abonelik Başlangıç Mantığı
- **Mevcut:** Satın alma anında abonelik başlıyor.
- **Hedef:** Abonelik, ürün satın alındıktan sonra *kurulum (onboarding)* yapıldığında başlamalı.
- **Gerekli Değişiklikler:**
  - `orders` tablosu `status` 'paid' olduğunda `subscriptions` kaydı 'pending_activation' olarak oluşturulmalı.
  - Onboarding tamamlandığında `subscriptions` durumu 'active' olmalı ve `start_date` = NOW(), `end_date` güncellenmeli.

### 5.2. Paket Yapısı
- **Paketler:**
  1. **1 Aylık Paket** (Fiyat: X TL)
  2. **12 Aylık Paket** (Fiyat: 10 * X TL - 2 ay bedava)

### 5.3. İlk Satın Alma İndirimi
- **Kural:** Kullanıcının ilk completed siparişi ise:
  - **1 Aylık Paket:** %50 İndirim (Yarı fiyat).
  - **12 Aylık Paket:** Toplam fiyattan 0.5 aylık bedel düşülür (10 ay yerine 9.5 ay öder).
    - Normal Yıllık: 1200 TL (Örnek: Aylık 100 TL ise, 12 ay paket 1000 TL)
    - İndirimli Yıllık: 1000 TL - (50 TL) = 950 TL (Örnek)

### 5.4. Süre Uzatma (Yenileme)
- **UI:** Abonelik detay sayfasında "Süre Uzat" butonu.
- **Akış:**
  1. Paket seçimi (Aylık/Yıllık).
  2. Ödeme (Shopier).
  3. Ödeme başarılı -> Mevcut `end_date` üzerine süre eklenir.

### 5.6. Kurulum Bilgileri (YENİ)
- **Talep:** Kullanıcı kurulum (onboarding) sırasında girdiği bilgileri (Kullanıcı adı, Şifre, Panel Linki) daha sonra görüntüleyebilmeli.
- **Çözüm:**
  - `user_product_accounts` tablosunda `additional_info` JSONB alanında panel URL'i saklanacak.
  - Şifreler zaten `password_encrypted` alanında tutuluyor.
  - "Aboneliklerim" sayfasındaki detay modalında veya kartında bu bilgiler "Göster/Gizle" seçeneği ile sunulacak.

### 5.7. Uygulama Adımları
- [ ] `packages` tablosuna Yıllık paket ekle.
- [ ] `products/[slug]/packages` sayfasında fiyat hesaplama ve indirim mantığı.
- [ ] API tarafında `create-order` endpoint'inde fiyat validasyonu.
- [ ] Onboarding sonrasında abonelik süresini başlatma mantığı.
- [ ] Dashboard'da "Süre Uzat" butonu entegrasyonu.
- [ ] Kurulum bilgilerinin (Credentials) güvenli gösterimi.
