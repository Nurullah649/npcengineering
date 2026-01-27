-- Adminlerin tüm siparişleri görmesini sağlayan policy
-- Önce mevcut policy'i kontrol edip gerekirse drop edebiliriz, ama çakışma olmaması için yeni isim veriyoruz.

-- Policy: Adminler tüm siparişleri görebilir
CREATE POLICY "Adminler tüm siparişleri görebilir" ON orders
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role' = 'admin') OR 
    ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin')
  );

-- Not: Eğer "Kullanıcılar kendi siparişlerini görebilir" policy'si zaten varsa,
-- Supabase bu iki policy'i OR mantığıyla birleştirir.
-- Yani hem kendi siparişini gören user hem de adminler erişebilir.
