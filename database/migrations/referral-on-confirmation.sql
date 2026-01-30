-- Migration: Referral count artırma işlemini e-posta onayından SONRA yapmak için
-- Bu migration, mevcut trigger'ı değiştirerek referral_count'un yalnızca kullanıcı
-- e-posta onayını tamamladıktan sonra artmasını sağlar.

-- 1. Eski trigger'ı drop et
DROP TRIGGER IF EXISTS ensure_referral_logic_on_profile ON profiles;
DROP FUNCTION IF EXISTS public.handle_profile_creation_consolidated();

-- 2. Yeni profil oluşturma fonks. (ref_code generate eder, referral_count ARTIRMAZ)
CREATE OR REPLACE FUNCTION public.handle_profile_creation_consolidated()
RETURNS TRIGGER AS $$
DECLARE
  user_meta JSONB;
  referrer_code TEXT;
  referrer_id UUID;
BEGIN
  -- 1. Generate Referral Code for the new user
  IF NEW.ref_code IS NULL THEN
    NEW.ref_code := generate_unique_referral_code();
  END IF;

  -- 2. Check for Referrer (via auth.users metadata)
  -- Sadece referred_by kolonunu doldur, referral_count'u ARTIRMA (henüz onaylanmadı)
  BEGIN
    SELECT raw_user_meta_data INTO user_meta
    FROM auth.users
    WHERE id = NEW.id;
    
    referrer_code := user_meta->>'referral_code';
    
    IF referrer_code IS NOT NULL AND referrer_code <> '' THEN
       -- Find Referrer
       SELECT id INTO referrer_id FROM profiles WHERE ref_code = referrer_code;
       
       IF referrer_id IS NOT NULL AND referrer_id <> NEW.id THEN
          -- Set referred_by on the NEW profile row (sadece kaydet, count'u artırma)
          NEW.referred_by := referrer_id;
          -- NOT: referral_count burada ARTMIYOR artık!
       END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Referral processing failed for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 3. Trigger'ı tekrar oluştur (BEFORE INSERT - sadece ref_code ve referred_by set eder)
CREATE TRIGGER ensure_referral_logic_on_profile
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_creation_consolidated();


-- 4. Yeni Fonksiyon: E-posta onaylandığında referral_count artır
-- Bu fonksiyon auth.users tablosunda UPDATE olduğunda çalışır
CREATE OR REPLACE FUNCTION public.handle_email_confirmation_referral()
RETURNS TRIGGER AS $$
DECLARE
  referrer_id UUID;
  already_counted BOOLEAN;
BEGIN
  -- Sadece email_confirmed_at alanı NULL'dan dolduğunda (onaylama anı) çalış
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Bu kullanıcının referred_by'ı var mı?
    SELECT referred_by INTO referrer_id
    FROM profiles
    WHERE id = NEW.id;
    
    IF referrer_id IS NOT NULL THEN
      -- Referrer'ın count'unu artır
      UPDATE profiles
      SET referral_count = COALESCE(referral_count, 0) + 1
      WHERE id = referrer_id;
      
      RAISE NOTICE 'Referral count increased for referrer % after email confirmation of user %', referrer_id, NEW.id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;


-- 5. Trigger: auth.users tablosunda UPDATE olduğunda çalış
DROP TRIGGER IF EXISTS on_email_confirmed_referral ON auth.users;

CREATE TRIGGER on_email_confirmed_referral
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_email_confirmation_referral();


-- 6. Mevcut onaylanmamış kullanıcılar için NOT: 
-- Eğer daha önce kayıt olmuş ama onaylamamış kullanıcılar varsa ve onların referral_count'u
-- zaten arttıysa, bu migration geriye dönük düzeltme YAPMAZ. Sadece yeni kayıtlar için geçerli.
