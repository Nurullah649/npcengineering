# NPC Engineering - Proje Plan ve Görev Takibi

Bu belge, NPC Engineering projesinde yapılan ve yapılacak tüm değişiklikleri takip etmek için oluşturulmuştur.

---

## ✅ TAMAMLANAN İŞLER

### Güvenlik Altyapısı
- [x] `lib/env.ts` - Environment variable validation (zod ile)
- [x] `middleware.ts` - Route protection (/admin, /dashboard)
- [x] `next.config.mjs` - Security headers
- [x] `app/api/callback/route.ts` - Rate limiting (10/dk)

### Auth & UI
- [x] `components/header.tsx` - Giriş/Kayıt butonları, kullanıcı dropdown menüsü
- [x] `app/login/page.tsx` - Şifre validasyonu (8+ karakter)
- [x] `app/register/page.tsx` - Şifre validasyonu (8+ karakter, büyük harf, rakam)
- [x] `app/products/[slug]/purchase-button.tsx` - Giriş yapmadan satın alma engeli + TL fiyat formatı
- [x] `app/products/[slug]/page.tsx` - Fiyatlar ₺ formatında
- [x] `app/auth/callback/route.ts` - Email onay callback
- [x] `app/auth/confirm/page.tsx` - Email onay sayfası

### Dashboard Sistemi
- [x] `app/dashboard/layout.tsx` - Sidebar menülü layout
- [x] `app/dashboard/page.tsx` - Ana sayfa (istatistikler)
- [x] `app/dashboard/products/page.tsx` - Satın alınan ürünler
- [x] `app/dashboard/orders/page.tsx` - Sipariş geçmişi
- [x] `app/dashboard/settings/page.tsx` - Profil ayarları
- [x] `app/dashboard/settings/password/page.tsx` - Şifre değiştirme
- [x] `app/dashboard/settings/billing/page.tsx` - Fatura adresi

### Admin Paneli
- [x] `app/admin/layout.tsx` - Admin menüsü ve layout
- [x] `app/admin/page.tsx` - Admin dashboard (istatistikler)
- [x] `app/admin/products/` - Ürün yönetimi (CRUD)
- [x] `app/admin/orders/` - Sipariş yönetimi ve durum güncelleme
- [x] `app/admin/users/` - Kullanıcı yönetimi ve rol atama
- [x] `app/login/page.tsx` - Role göre otomatik yönlendirme (Admin → /admin, User → /dashboard)

### Paket Güncellemeleri
- [x] `@supabase/ssr` paketi eklendi
- [x] `npm audit` çalıştırıldı (1 moderate lodash açığı var)

---

## 📋 YAPILACAKLAR

### Veritabanı (Supabase Dashboard'dan)
- [x] RLS politikaları (profiles, orders, products)
- [x] Admin rol atama
- [x] Test kullanıcıları oluşturma
- [x] Profiles tablosuna adres sütunları
- [ ] İndeksler (performans)
- [ ] Error logs tablosu (opsiyonel)
- [ ] Profiles trigger (otomatik profil oluşturma)

### Opsiyonel İyileştirmeler
- [ ] Shopier IP kontrolü
- [ ] Sentry logging entegrasyonu
- [ ] Kullanılmayan paketleri temizle
- [ ] `npm audit fix` çalıştır

---

## 📁 DOSYA REFERANSLARI

| Dosya | Bilgi |
|-------|-------|
| [database-tasks.md](./database-tasks.md) | Veritabanı SQL komutları |
| `lib/env.ts` | Env validation |
| `middleware.ts` | Route protection |
| `app/dashboard/` | Kullanıcı paneli |
