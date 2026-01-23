# NPC Engineering - Güvenlik İyileştirmeleri ve UI Düzeltme Planı

Bu belge, NPC Engineering projesinde tespit edilen güvenlik açıklarını kapatmak ve eksik UI bileşenlerini (Giriş/Kayıt butonları) entegre etmek için oluşturulmuş görev listesidir.

---

## 🚨 AŞAMA 1: Kritik Güvenlik Altyapısı (Hemen Uygulanmalı)

### 1.1. Environment Variable Validation (Çevre Değişkeni Doğrulama)

**Hedef:** Uygulama başlarken kritik değişkenlerin varlığını kontrol etmek.

- [x] `zod` kütüphanesini kullanarak `lib/env.ts` dosyası oluşturuldu.
- [x] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SHOPIER_API_KEY`, `SHOPIER_API_SECRET` değişkenleri zorunlu kılındı.
- [x] `next.config.mjs` içinde bu dosyayı import ederek build/start anında kontrol sağla.

### 1.2. Middleware & Route Protection (Sunucu Taraflı Koruma)

**Hedef:** `/admin` ve `/dashboard` rotalarını sunucu tarafında korumak.

- [x] Kök dizinde `middleware.ts` dosyası oluşturuldu.
- [x] `@supabase/ssr` kullanılarak session kontrolü sağlandı.
- [x] `/admin/*` rotasına erişen kullanıcının role bilgisi kontrol ediliyor. Admin değilse `/dashboard`'a yönlendiriliyor.
- [x] `/dashboard/*` rotasına erişen kullanıcının oturum açtığı doğrulanıyor. Açık değilse `/login`'e yönlendiriliyor.

### 1.3. Güvenlik Header'ları (Security Headers)

**Hedef:** XSS, Clickjacking ve diğer saldırıları engellemek.

- [x] `next.config.mjs` dosyası güncellendi.
- [x] Aşağıdaki header'lar eklendi:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-XSS-Protection: 1; mode=block`
  - `Permissions-Policy`

---

## 🔴 AŞAMA 2: API ve Veri Güvenliği

### 2.1. Shopier Callback Güvenliği

**Hedef:** `app/api/callback/route.ts` dosyasını sertleştirmek.

- [x] **Rate Limiting:** IP tabanlı rate limit mekanizması eklendi (10 istek/dakika).
- [x] **Signature Validation:** Shopier'den gelen signature doğrulaması try-catch blokları ile sarmalandı ve başarısız denemeler detaylı loglanıyor.
- [ ] **IP Kontrolü (Opsiyonel):** Mümkünse Shopier IP aralıklarını kontrol et.

### 2.2. Supabase RLS (Row Level Security) Politikaları

**Hedef:** Veritabanına doğrudan erişimi kısıtlamak.

- [ ] SQL Editör veya Migration dosyası ile `profiles`, `orders` tabloları için RLS'i etkinleştir (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- [ ] **Policy Örnekleri:**
  - Kullanıcılar sadece kendi profillerini görebilir/düzenleyebilir.
  - Adminler her şeyi görebilir.
  - Anonim kullanıcılar sadece `products` tablosunu (public) okuyabilir.

### 2.3. XSS ve Input Sanitization

**Hedef:** Kullanıcı girdilerini temizlemek.

- [ ] `app/admin/page.tsx` ve diğer form alanlarında kullanıcıdan alınan verileri render ederken React'in varsayılan korumasına güven, ancak `dangerouslySetInnerHTML` kullanımından kaçın.
- [ ] Form validasyonu için `zod` şemaları oluştur ve hem client hem server tarafında uygula.

---

## 🟡 AŞAMA 3: UI/UX Düzeltmeleri (Kullanıcı Paneli)

### 3.1. Header Component Güncellemesi

**Sorun:** Ana sayfada "Giriş Yap" / "Kayıt Ol" butonları veya kullanıcı menüsü görünmüyor.

**Dosya:** `components/header.tsx`

**Görevler:**
- [x] Header bileşenini "Client Component" olarak işaretlendi (`use client`).
- [x] Supabase `auth.getUser()` ve `onAuthStateChange` ile kullanıcının giriş durumu dinleniyor.
- [x] **Durum: Giriş Yapılmamışsa:**
  - Sağ üst köşeye "Giriş Yap" (`variant="ghost"`) ve "Kayıt Ol" (`variant="default"`) butonları eklendi.
- [x] **Durum: Giriş Yapılmışsa:**
  - Kullanıcı dropdown menüsü render ediliyor.
- [x] Mobilde (Hamburger menü içinde) de bu linkler görünüyor.

### 3.2. Dashboard ve Auth Sayfaları

- [x] `app/login/page.tsx` ve `app/register/page.tsx` sayfalarında şifre karmaşıklığı kontrolü eklendi (Min 8 karakter, büyük harf ve rakam zorunluluğu).
- [ ] Başarılı giriş/kayıt sonrası yönlendirmelerin (`router.push('/dashboard')`) doğru çalıştığını test et.

---

## 🟢 AŞAMA 4: Bakım ve İzleme

### 4.0. Satın Alma Güvenliği (YENİ)

**Hedef:** Giriş yapmadan ürün satın alınmasını engellemek ve fiyatları TL olarak göstermek.

- [x] `purchase-button.tsx` dosyasında auth kontrolü eklendi - kullanıcı giriş yapmamışsa "Satın Almak İçin Giriş Yapın" butonu gösteriliyor.
- [x] Fiyatlar TL (₺) formatında gösterilecek şekilde düzenlendi (`Intl.NumberFormat` kullanılarak).
- [x] Ürün detay sayfasında fiyatlar $ yerine ₺ olarak gösterilecek şekilde güncellendi.

### 4.1. Logging

- [ ] Kritik hatalar (Ödeme hataları, Auth hataları) için bir loglama servisi (Sentry vb.) veya veritabanında bir `error_logs` tablosu kur.

### 4.2. Dependency Security

- [x] `npm audit` çalıştırıldı: 1 moderate lodash güvenlik açığı bulundu (`npm audit fix` ile düzeltebilirsiniz).
- [ ] Kullanılmayan paketleri temizle.

---

## 📋 Uygulama Sırası Önerisi

1. **Önce UI Düzeltmesi (3.1)** yapılmalı ki sistem test edilebilir olsun.
2. **Ardından Middleware (1.2) ve Env Validation (1.1)** eklenmeli.
3. **Son olarak API Güvenliği (2.1) ve RLS (2.2)** yapılandırılmalı.
