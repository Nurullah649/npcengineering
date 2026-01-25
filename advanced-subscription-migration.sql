-- 1. Packages Tablosuna Süre (duration_months) Ekle (Eğer yoksa)
-- ALTER TABLE packages ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 1;

-- 1.1 Eksik kolonları ekle (description, features)
ALTER TABLE packages ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS features JSONB;

-- 2. SiparisGO için Paketleri Oluştur
-- Önce mevcut paketleri temizle (veya güncelle)
-- DELETE FROM packages WHERE product_id IN (SELECT id FROM products WHERE slug = 'siparisgo');

-- Aylık Paket (Örnek Fiyat: 100 TL)
INSERT INTO packages (product_id, name, description, price, features, duration_months, is_active)
SELECT 
  id, 
  'Aylık Paket', 
  'Her ay yenilenen standart paket', 
  100, -- Fiyatı sistemden dinamik alacağız ama base fiyat bu
  '{"feature1": true, "feature2": true}'::jsonb,
  1,
  true
FROM products WHERE slug = 'siparisgo'
ON CONFLICT DO NOTHING;

-- Yıllık Paket (Örnek Fiyat: 1000 TL - 2 ay bedava mantığı)
INSERT INTO packages (product_id, name, description, price, features, duration_months, is_active)
SELECT 
  id, 
  'Yıllık Paket', 
  '12 ay kullanım, 2 ay bedava!', 
  1000, -- 10 * Aylık Fiyat
  '{"feature1": true, "feature2": true, "feature3": true}'::jsonb,
  12,
  true
FROM products WHERE slug = 'siparisgo'
ON CONFLICT DO NOTHING;

-- 3. Subscriptions Tablosuna "Pending Activation" Statüsü
-- Status varchar olduğu için ekstra işlem gerekmez, kodda 'pending_activation' kullanacağız.
-- Ancak onboarding_status kolonu eklemek faydalı olabilir.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(20) DEFAULT 'completed';
-- Mevcut kayıtlar için completed yapalım
UPDATE subscriptions SET onboarding_status = 'completed' WHERE onboarding_status IS NULL;

-- 4. User Product Accounts Tablosuna Panel URL için alan
-- additional_info JSONB zaten var, oraya { "panel_url": "..." } olarak ekleyeceğiz.
