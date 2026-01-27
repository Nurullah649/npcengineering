
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

### 5.3. Deneme Süresi (Trial) - [YENİ]
- **Kural:** Yeni kayıt olan her kullanıcıya, satın alma şartı olmaksızın 7 günlük "SiparisGo" deneme aboneliği tanımlanır.
- **Süreç:** 
  - Kayıt olma (Register) anında arka planda ücretsiz sipariş ve abonelik oluşturulur.
  - Deneme süresinin bitimine 2 gün kala (5. gün) kullanıcıya hatırlatma e-postası gönderilir.
  - Deneme süresi bittiğinde kullanıcı abonelik satın almaya yönlendirilir.

### 5.4. İlk Satın Alma İndirimi
- **Kural:** Kullanıcının ilk *ücretli* siparişi ise (Deneme süresi sonrası):
  - **1 Aylık Paket:** %50 İndirim (Yarı fiyat).
  - **12 Aylık Paket:** Toplam fiyattan 0.5 aylık bedel düşülür.

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
