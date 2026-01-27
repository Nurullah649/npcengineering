-- 1. Packages tablosuna gün bazlı süre desteği ekle
ALTER TABLE packages ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT NULL;

-- 2. Subscriptions tablosuna hatırlatma maili takibi için kolon ekle
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- 3. SiparisGo için "7 Günlük Deneme" Paketini Oluştur
-- Ürün ID'sini slug'dan buluyoruz
DO $$
DECLARE
  v_product_id uuid;
BEGIN
  SELECT id INTO v_product_id FROM products WHERE slug = 'siparisgo';
  
  IF v_product_id IS NOT NULL THEN
    INSERT INTO packages (
      product_id, 
      name, 
      description, 
      price, 
      features, 
      duration_months, 
      duration_days, 
      is_active,
      multiplier
    ) VALUES (
      v_product_id,
      '7 Günlük Deneme',
      'SiparisGo özelliklerini 7 gün boyunca ücretsiz deneyin.',
      0, -- Ücretsiz
      '{"trial": true, "full_access": true}'::jsonb,
      0, -- Ay olarak 0
      7, -- Gün olarak 7
      true,
      0
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
