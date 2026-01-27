-- Admin Görünürlük Sorunu Giderme
-- Bu scripti çalıştırarak Adminlerin tüm siparişleri ve tüm profilleri görmesini sağlayabilirsiniz.

-- 1. ORDERS Tablosu için Admin İzni
DROP POLICY IF EXISTS "Adminler tüm siparişleri görebilir" ON orders;

CREATE POLICY "Adminler tüm siparişleri görebilir" ON orders
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    (auth.jwt() ->> 'role')::text = 'service_role'
  );

-- 2. PROFILES Tablosu için Admin İzni (Önemli: Profil detaylarını görmek için gerekli)
-- Önce mevcut kısıtlayıcı politika varsa, adminler için bir istisna ekliyoruz.
-- Veya yeni bir politika ekliyoruz (Postgres politikaları OR mantığıyla çalışır, yani herhangi biri izin verirse erişilir).

DROP POLICY IF EXISTS "Adminler tüm profilleri görebilir" ON profiles;

CREATE POLICY "Adminler tüm profilleri görebilir" ON profiles
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    (auth.jwt() ->> 'role')::text = 'service_role'
  );

-- Not: Eğer "profiles" tablosunda RLS aktifse ve admin için policy yoksa,
-- admin siparişleri görse bile "profiles" verisi (isim, email) boş gelebilir.
