# Supabase Veritabanı Görevleri

Bu dosyadaki görevleri Supabase Dashboard → SQL Editor üzerinden yapabilirsiniz.

---

## 1. RLS (Row Level Security) Etkinleştirme

### 1.1. Profiles Tablosu RLS
- [ ] RLS'i etkinleştir ve politikaları oluştur

```sql
-- RLS'i etkinleştir
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi profilini görebilir
CREATE POLICY "Kullanıcılar kendi profilini görebilir" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Kullanıcı sadece kendi profilini güncelleyebilir
CREATE POLICY "Kullanıcılar kendi profilini güncelleyebilir" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

---

### 1.2. Orders Tablosu RLS
- [ ] RLS'i etkinleştir ve politikaları oluştur

```sql
-- RLS'i etkinleştir
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi siparişlerini görebilir
CREATE POLICY "Kullanıcılar kendi siparişlerini görebilir" ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanıcı sipariş oluşturabilir
CREATE POLICY "Kullanıcılar sipariş oluşturabilir" ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### 1.3. Products Tablosu RLS
- [ ] RLS'i etkinleştir ve politikaları oluştur

```sql
-- RLS'i etkinleştir
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Herkes ürünleri görebilir (public okuma)
CREATE POLICY "Herkes ürünleri görebilir" ON products
  FOR SELECT
  USING (true);

-- Sadece adminler ürün ekleyebilir/güncelleyebilir
CREATE POLICY "Adminler ürün yönetebilir" ON products
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );
```

---

## 2. Admin Rolü Atama

- [ ] Admin kullanıcınıza rol atayın

```sql
-- Admin kullanıcının user_metadata'sına rol ekle
-- NOT: Bu komutu çalıştırmadan önce USER_ID'yi değiştirin!
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@npcengineering.com';
```

**Alternatif olarak Supabase Dashboard'dan:**
1. Authentication → Users bölümüne gidin
2. Admin yapılacak kullanıcıyı seçin
3. Edit User → User Metadata kısmına `{"role": "admin"}` ekleyin

---

## 2.5. Test Kullanıcıları Oluşturma

### Admin Kullanıcı Oluşturma
- [ ] Admin test kullanıcısı oluştur

**Supabase Dashboard'dan (Önerilen):**
1. Authentication → Users → "Add User" butonuna tıklayın
2. Email: `admin@npcengineering.com`
3. Password: `AdminSifre123!`
4. Auto Confirm User: ✅ (işaretleyin)
5. Kaydet ve User Metadata'ya `{"role": "admin", "full_name": "Admin User"}` ekleyin

**Veya SQL ile:**
```sql
-- NOT: Supabase'de auth.users tablosuna doğrudan INSERT yapmak önerilmez.
-- Dashboard üzerinden oluşturup ardından metadata güncelleyin:

-- Mevcut kullanıcıyı admin yap
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
  'role', 'admin',
  'full_name', 'Admin User'
)
WHERE email = 'admin@npcengineering.com';
```

### Normal Kullanıcı Oluşturma
- [ ] Normal test kullanıcısı oluştur

**Supabase Dashboard'dan (Önerilen):**
1. Authentication → Users → "Add User" butonuna tıklayın
2. Email: `test@example.com`
3. Password: `TestSifre123!`
4. Auto Confirm User: ✅ (işaretleyin)
5. Kaydet

**Veya profiles tablosuna veri eklemek için:**
```sql
-- Kullanıcı register olduktan sonra profiles tablosuna otomatik eklenmiyorsa:
-- (Trigger yoksa manuel ekleyebilirsiniz)

INSERT INTO profiles (id, full_name, email)
SELECT id, raw_user_meta_data->>'full_name', email
FROM auth.users
WHERE email = 'test@example.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email;
```

### Profiles Tablosu Trigger (Opsiyonel)
- [ ] Otomatik profil oluşturma trigger'ı ekle

```sql
-- Yeni kullanıcı kayıt olduğunda otomatik profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluştur (eğer yoksa)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 3. Error Logs Tablosu (Opsiyonel)

- [ ] Hata loglama tablosu oluştur

```sql
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS kapat (sadece server tarafı ekleme yapacak)
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Sadece service role ile erişilebilir (insert için policy yok)
CREATE POLICY "Adminler logları görebilir" ON error_logs
  FOR SELECT
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );
```

---

## 4. İndeksler (Performans)

- [ ] Sık kullanılan sorgular için indeks ekle

```sql
-- Orders tablosu için user_id indeksi
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Orders tablosu için created_at indeksi
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Products tablosu için slug indeksi
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Products tablosu için category indeksi  
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
```

---

## Tamamlanma Durumu

| Görev | Durum |
|-------|-------|
| Profiles RLS |  ✅|
| Orders RLS |  ✅ |
| Products RLS |  ✅ |
| Admin Rol Atama |  ✅ |
| Error Logs Tablosu | ⬜ |
| İndeksler | ⬜ |

**Durumları güncellerken:** ⬜ → ✅

---

## 5. Profiles Tablosu Adres Sütunları (Dashboard için)

- [ ] Profiles tablosuna adres sütunları ekle

```sql
-- Telefon ve adres bilgileri için yeni sütunlar
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tc_kimlik TEXT;
```

Bu SQL'i Supabase Dashboard → SQL Editor'da çalıştırın.

---

## 6. Gelişmiş Abonelik Sistemi Migration (YENİ) - `advanced-subscription-migration.sql`

- [ ] `packages` tablosuna yıllık paket ekle ve `subscriptions` tablosunu güncelle.

```sql
-- 0. Eksik Kolonları Ekle
ALTER TABLE packages ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS features JSONB;

-- 1. Yıllık Paket Ekle (SiparisGO)
INSERT INTO packages (product_id, name, description, price, features, duration_months, is_active)
SELECT 
  id, 'Yıllık Paket', '12 ay kullanım, 2 ay bedava!', 1000, 
  '{"feature1": true}'::jsonb, 12, true
FROM products WHERE slug = 'siparisgo'
ON CONFLICT DO NOTHING;

-- 2. Subscriptions Tablosu Güncelleme
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(20) DEFAULT 'completed';

-- 3. Mevcut Abonelikleri Güncelle
UPDATE subscriptions SET onboarding_status = 'completed';
```

---

## 7. Orders Tablosuna Package ID Ekleme (YENİ) - Gelişmiş Abonelik İçin

- [ ] `orders` tablosuna `package_id` kolonu ekle.

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES packages(id);
```
