-- LANGKAH 2 dari 2
-- Jalankan file ini SETELAH 012_add_plan_enum_values.sql selesai di-RUN.
-- Berisi langkah migrasi data + constraint baru + fungsi consume_usage.

-- ========================================
-- LANGKAH A: Migrasi data row lama (PAID → PRO/FREE)
-- ========================================

-- 1a. PAID dengan paid_until kosong atau sudah lewat → FREE
UPDATE public.profiles
SET
  plan = 'FREE',
  paid_until = NULL,
  updated_at = NOW()
WHERE plan = 'PAID'
  AND (paid_until IS NULL OR paid_until <= NOW());

-- 1b. PAID dengan paid_until masih aktif → PRO (periode berbayar takud dihormati)
UPDATE public.profiles
SET
  plan = 'PRO',
  updated_at = NOW()
WHERE plan = 'PAID'
  AND paid_until IS NOT NULL
  AND paid_until > NOW();

-- ========================================
-- LANGKAH B: Update constraint dan fungsi consume_usage
-- ========================================

-- Upgrade constraint paid_plan_requires_expiry untuk include PRO & VIP
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS paid_plan_requires_expiry;

ALTER TABLE public.profiles
  ADD CONSTRAINT paid_plan_requires_expiry
  CHECK (
    (plan IN ('FREE', 'ADMIN')) OR
    (plan IN ('PRO', 'VIP') AND paid_until IS NOT NULL)
  );

-- Update fungsi consume_usage untuk support PRO, VIP, ADMIN
CREATE OR REPLACE FUNCTION public.consume_usage(
  p_action public.usage_action,
  p_portal text DEFAULT NULL
)
RETURNS TABLE (
  allowed boolean,
  message text,
  used_today integer,
  daily_limit integer,
  plan public.plan_type
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_plan public.plan_type;
  v_paid_until timestamptz;
  v_used_today integer;
  v_daily_limit integer;
  v_existing_portal text;
  v_is_ai boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ambil data plan dan paid_until profile user saat ini
  SELECT p.plan, p.paid_until
  INTO v_plan, v_paid_until
  FROM public.profiles p
  WHERE p.id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Auto downgrade PRO/VIP jika paid_until expired
  IF v_plan IN ('PRO', 'VIP') AND (
    v_paid_until IS NULL OR v_paid_until <= NOW()
  ) THEN
    UPDATE public.profiles
    SET
      plan = 'FREE',
      paid_until = NULL,
      updated_at = NOW()
    WHERE id = v_user_id;

    v_plan := 'FREE';
  END IF;

  -- Cek apakah action adalah AI operation
  v_is_ai := p_action IN (
    'AI_EXTRACT',
    'AI_GENERATE'
  );

  -- Set limit harian berdasarkan plan
  IF v_plan = 'ADMIN' THEN
    v_daily_limit := 999999;
  ELSIF v_plan = 'VIP' THEN
    v_daily_limit := CASE
      WHEN v_is_ai THEN 100
      ELSE 25
    END;
  ELSIF v_plan = 'PRO' THEN
    v_daily_limit := CASE
      WHEN v_is_ai THEN 30
      ELSE 10
    END;
  ELSE -- FREE
    v_daily_limit := CASE
      WHEN v_is_ai THEN 3
      ELSE 1
    END;
  END IF;

  -- Hitung penggunaan hari ini (campur AI dan scraping)
  SELECT COUNT(*)::integer
  INTO v_used_today
  FROM public.usage_events ue
  WHERE ue.user_id = v_user_id
    AND ue.created_at >= DATE_TRUNC(
      'DAY',
      NOW() AT TIME ZONE 'Asia/Jakarta'
    ) AT TIME ZONE 'Asia/Jakarta'
    AND (
      (v_is_ai AND ue.action IN (
        'AI_EXTRACT',
        'AI_GENERATE'
      ))
      OR
      (NOT v_is_ai AND ue.action IN (
        'SCRAPE_LINKEDIN',
        'SCRAPE_JOBSTREET',
        'SCRAPE_INDEED',
        'SCRAPE_GLINTS',
        'SCRAPE_DEALLS'
      ))
    );

  -- Aturan FREE: hanya 1 portal per hari untuk scraping
  IF v_plan = 'FREE' AND NOT v_is_ai THEN
    SELECT ue.portal
    INTO v_existing_portal
    FROM public.usage_events ue
    WHERE ue.user_id = v_user_id
      AND ue.created_at >= DATE_TRUNC(
        'DAY',
        NOW() AT TIME ZONE 'Asia/Jakarta'
      ) AT TIME ZONE 'Asia/Jakarta'
      AND ue.action IN (
        'SCRAPE_LINKEDIN',
        'SCRAPE_JOBSTREET',
        'SCRAPE_INDEED',
        'SCRAPE_GLINTS',
        'SCRAPE_DEALLS'
      )
    ORDER BY ue.created_at ASC
    LIMIT 1;

    IF v_existing_portal IS NOT NULL
      AND v_existing_portal IS DISTINCT FROM p_portal THEN
      RETURN QUERY
      SELECT
        FALSE,
        'Paket FREE hanya dapat memakai satu portal scraping per hari.',
        v_used_today,
        v_daily_limit,
        v_plan;
      RETURN;
    END IF;
  END IF;

  -- Cek limit harian sudah habis
  IF v_used_today >= v_daily_limit THEN
    RETURN QUERY
    SELECT
      FALSE,
      'Kuota harian sudah habis.',
      v_used_today,
      v_daily_limit,
      v_plan;
    RETURN;
  END IF;

  -- Record usage
  INSERT INTO public.usage_events (
    user_id,
    action,
    portal
  )
  VALUES (
    v_user_id,
    p_action,
    p_portal
  );

  RETURN QUERY
  SELECT
    TRUE,
    'Penggunaan dicatat.',
    v_used_today + 1,
    v_daily_limit,
    v_plan;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_usage(
  public.usage_action,
  text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.consume_usage(
  public.usage_action,
  text
) TO authenticated;