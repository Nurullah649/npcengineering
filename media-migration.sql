-- Ürünlere medya (fotoğraf/video) desteği ekle

-- 1. Screenshots (Ekran Görüntüleri) - text array olarak
-- Eğer zaten varsa hata vermez, yoksa ekler
ALTER TABLE products ADD COLUMN IF NOT EXISTS screenshots TEXT[] DEFAULT '{}';

-- 2. Video URLs (Çoklu video desteği)
-- Eğer video_url (single) varsa, onu array'e çevirip video_urls yapabiliriz veya direkt yeni kolon ekleriz.
-- Bu script temiz bir başlangıç varsayar veya mevcutu günceller.

DO $$
BEGIN
    -- Eğer eski video_url kolonu varsa ve video_urls yoksa
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'video_url') THEN
        ALTER TABLE products RENAME COLUMN video_url TO video_urls_temp;
        ALTER TABLE products ADD COLUMN video_urls TEXT[] DEFAULT '{}';
        
        -- Mevcut verileri array formatına taşı (eğer doluysa)
        UPDATE products 
        SET video_urls = ARRAY[video_urls_temp] 
        WHERE video_urls_temp IS NOT NULL;

        ALTER TABLE products DROP COLUMN video_urls_temp;
    ELSE
        -- Hiçbiri yoksa direkt oluştur
        ALTER TABLE products ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';
    END IF;
END $$;
