-- Drop previous triggers and functions to clean up
DROP TRIGGER IF EXISTS on_auth_ref_tracking ON auth.users;
DROP FUNCTION IF EXISTS public.on_auth_user_created_referral_update();

DROP TRIGGER IF EXISTS ensure_ref_code_on_profile ON profiles;
DROP FUNCTION IF EXISTS public.handle_profile_creation_referral();
DROP FUNCTION IF EXISTS generate_unique_referral_code();
DROP FUNCTION IF EXISTS public.handle_new_user_referral();


-- Re-create Helper Function
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS (SELECT 1 FROM profiles WHERE ref_code = new_code) INTO exists;
    IF NOT exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Consolidated Trigger Function
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
  -- We query auth.users using the NEW.id (which matches auth.uid)
  BEGIN
    SELECT raw_user_meta_data INTO user_meta
    FROM auth.users
    WHERE id = NEW.id;
    
    referrer_code := user_meta->>'referral_code';
    
    IF referrer_code IS NOT NULL AND referrer_code <> '' THEN
       -- Find Referrer
       SELECT id INTO referrer_id FROM profiles WHERE ref_code = referrer_code;
       
       IF referrer_id IS NOT NULL AND referrer_id <> NEW.id THEN
          -- Set referred_by on the NEW profile row
          NEW.referred_by := referrer_id;
          
          -- Increment Referrer's count
          -- perform UPDATE here. Since this is BEFORE INSERT, the NEW row isn't there yet,
          -- but we are updating ANOTHER row.
          UPDATE profiles 
          SET referral_count = COALESCE(referral_count, 0) + 1
          WHERE id = referrer_id;
       END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the registration
    RAISE WARNING 'Referral processing failed for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- Re-attach Trigger to profiles
CREATE TRIGGER ensure_referral_logic_on_profile
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_creation_consolidated();
