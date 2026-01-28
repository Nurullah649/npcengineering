-- 1. Profiles tablosuna referans takibi için kolonlar ekle
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- 2. Referans kodu oluşturma fonksiyonu (Rastgele string)
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- 8 karakterlik rastgele büyük harf/sayı stringi üret
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Çakışma kontrolü
    SELECT EXISTS (SELECT 1 FROM profiles WHERE ref_code = new_code) INTO exists;
    
    IF NOT exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Yeni kullanıcı oluştuğunda çalışacak trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS TRIGGER AS $$
DECLARE
  referrer_code TEXT;
  referrer_id UUID;
BEGIN
  -- 1. Metadata'dan referans kodunu al (Eğer varsa)
  referrer_code := new.raw_user_meta_data->>'ref_code';

  -- 2. Yeni kullanıcı için referans kodu oluştur (Eğer yoksa)
  IF new.raw_user_meta_data->>'ref_code_own' IS NULL THEN
     -- Bu trigger genellikle auth.users insert'ünde çalışır.
     -- Ancak biz profiles tablosu üzerinden gidiyoruz.
     -- Eğer profiles tablosuna insert yapılıyorsa:
     NULL; 
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- NOT: Supabase'de genellikle auth.users tablosuna trigger bağlanır ve bu trigger public.profiles kaydı oluşturur.
-- Mevcut projenizde "on_auth_user_created" gibi bir trigger olabilir.
-- Biz bu mantığı o trigger'ın içine gömmeliyiz veya yeni bir trigger eklemeliyiz.

-- A) Mevcut trigger'ı kontrol edip güncellemek yerine, referans işlemi için ayrı bir logic kuralım.
-- Yeni kullanıcı profili oluşturulduğunda çalışacak:

CREATE OR REPLACE FUNCTION public.handle_profile_creation_referral()
RETURNS TRIGGER AS $$
DECLARE
  referrer_code TEXT;
  referrer_id UUID;
BEGIN
  -- 1. Kendi referans kodunu oluştur (Eğer yoksa)
  IF NEW.ref_code IS NULL THEN
    NEW.ref_code := generate_unique_referral_code();
  END IF;

  -- 2. Referans ile mi gelmiş? (auth.users metadata'sına bakmamız lazım ama buradan erişim zor olabilir)
  -- Alternatif: Register sayfasında signUp sırasında metadata olarak 'referred_by_code' göndeririz.
  -- Supabase auth.users -> profiles senkronizasyon trigger'ı bu veriyi profiles'a taşıyabilir.
  
  -- VARSAYIM: Auth trigger'ı metadata'daki 'full_name'i profile taşıyor.
  -- BİZİM YAPMAMIZ GEREKEN: Auth trigger'ını güncelleyip 'referred_by_code'u da profile taşımasını sağlamak DIŞINDA,
  -- Basitçe: Profil oluştuktan sonra update edebiliriz veya auth trigger'ı modifiye edebiliriz.
  
  -- Kesin çözüm: Auth trigger'ını replace etmek. Aşağıda auth.users için genel bir handle fonksiyonu yazıyorum.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 

-- Trigger: Profil oluşturulmadan önce ref_code ata
DROP TRIGGER IF EXISTS ensure_ref_code_on_profile ON profiles;
CREATE TRIGGER ensure_ref_code_on_profile
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_creation_referral();


-- B) Referans sayısını artırma ve bağlama lojiği (Auth Trigger'ı içinde olmalı)
-- Bu fonksiyon auth.users tablosuna "AFTER INSERT" olarak bağlanmalı.

CREATE OR REPLACE FUNCTION public.on_auth_user_created_referral_update()
RETURNS TRIGGER AS $$
DECLARE
  referrer_code TEXT;
  referrer_profile_id UUID;
BEGIN
  -- 1. Profil kaydı oluştur (Mevcut trigger yapıyorsa çakışabilir, ama biz update yapacağız)
  -- Eğer 'profiles' kaydı başka bir trigger ile oluşuyorsa, burada sadece UPDATE yaparız.
  -- Güvenli yol: Biraz bekleyip update etmek veya tek bir ana trigger kullanmak.
  
  -- Bizim stratejimiz: Mevcut 'profiles' kaydını (trigger ile oluşmuşsa) güncellemek.
  
  referrer_code := new.raw_user_meta_data->>'referral_code'; -- Register sayfasından gelen kod
  
  IF referrer_code IS NOT NULL AND referrer_code <> '' THEN
    -- Referans kodunun sahibini bul
    SELECT id INTO referrer_profile_id FROM profiles WHERE ref_code = referrer_code;
    
    IF referrer_profile_id IS NOT NULL THEN
       -- 1. Yeni kullanıcının 'referred_by' alanını güncelle
       -- (Profilin oluşmasını beklemek race condition yaratabilir, ancak genellikle auth transaction içinde olduğu için görünür)
       UPDATE profiles 
       SET referred_by = referrer_profile_id 
       WHERE id = new.id;
       
       -- 2. Referans olan kişinin sayacını artır
       UPDATE profiles
       SET referral_count = COALESCE(referral_count, 0) + 1
       WHERE id = referrer_profile_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı bağla
DROP TRIGGER IF EXISTS on_auth_ref_tracking ON auth.users;
CREATE TRIGGER on_auth_ref_tracking
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.on_auth_user_created_referral_update();

