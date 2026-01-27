-- Admin Kullanıcı Yetkilerini Zorla Güncelleme
-- Bu script, 'admin@npcengineering.com' kullanıcısının hem metadata'sını (RLS için) 
-- hem de profiles tablosundaki rolünü (Uygulama kontrolü için) günceller.

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Admin kullanıcısını bul
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@npcengineering.com';

  IF v_user_id IS NOT NULL THEN
    -- 2. auth.users tablosunda metadata güncelle (RLS Politikaları buna bakıyor)
    UPDATE auth.users 
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
    WHERE id = v_user_id;

    -- 3. profiles tablosunda rolü güncelle (Admin Paneli backend kontrolleri buna bakıyor)
    UPDATE profiles
    SET role = 'admin'
    WHERE id = v_user_id;

    RAISE NOTICE 'Admin yetkileri güncellendi. Lütfen ÇIKIŞ YAPIP tekrar GİRİŞ YAPIN.';
  ELSE
    RAISE NOTICE 'Admin kullanıcısı bulunamadı! Email adresinin doğru olduğundan emin olun.';
  END IF;
END $$;
