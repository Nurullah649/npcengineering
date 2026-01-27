-- product-media depolama alanını (bucket) oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS (Row Level Security) Politikaları
-- Önce eski politikaları temizleyelim (çakışma olmaması için)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- 1. Herkes (giriş yapmamışlar dahil) dosyaları görebilir/indirebilir
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-media' );

-- 2. Sadece giriş yapmış kullanıcılar dosya yükleyebilir
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'product-media' AND auth.role() = 'authenticated' );

-- 3. Sadece giriş yapmış kullanıcılar silebilir
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'product-media' AND auth.role() = 'authenticated' );
