-- Ürünlere medya (fotoğraf/video) desteği ekle

-- 1. Screenshots (Ekran Görüntüleri) - text array olarak
-- Eğer zaten varsa hata vermez, yoksa ekler
ALTER TABLE products ADD COLUMN IF NOT EXISTS screenshots TEXT[] DEFAULT '{}';

-- 2. Video URL (YouTube/Vimeo vb.)
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;

-- 3. Storage Bucket Kontrolü (SQL ile bucket oluşturmak her zaman mümkün olmayabilir ama policy ekleyebiliriz)
-- Not: Supabase Storage bucket'larını Dashboard'dan oluşturmanız önerilir: "product-media"
-- Ancak policy eklemeyi deneyebiliriz.

-- Storage Policy Örnekleri (Adminler yükleyebilir, herkes görebilir)
-- Bu kısımlar manuel işlem gerektirebilir, dashboard daha güvenlidir.
