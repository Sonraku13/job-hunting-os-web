-- Fix quota race condition by locking user's profile row during consume_usage transaction
-- This ensures that concurrent requests for the same user are serialized.

-- GUARD (fixes ERROR 42704: type public.usage_action does not exist):
-- The function signature references these enums at CREATE time, so they must
-- exist BEFORE the CREATE OR REPLACE FUNCTION statement runs. If migrations
-- 001/010/012 were never applied to the target DB, creation fails with 42704.
-- This block recreates any missing enum, then tops up missing values.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'usage_action'
  ) THEN
    CREATE TYPE public.usage_action AS ENUM (
      'AI_EXTRACT',
      'AI_GENERATE',
      'SCRAPE_LINKEDIN',
      'SCRAPE_JOBSTREET',
      'SCRAPE_INDEED',
      'SCRAPE_GLINTS',
      'SCRAPE_DEALLS'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'plan_type'
  ) THEN
    CREATE TYPE public.plan_type AS ENUM ('FREE', 'PRO', 'VIP', 'ADMIN');
  END IF;
END
$$;

-- Top up values in case the enum exists but is outdated (idempotent).
ALTER TYPE public.usage_action ADD VALUE IF NOT EXISTS 'SCRAPE_INDEED';
ALTER TYPE public.usage_action ADD VALUE IF NOT EXISTS 'SCRAPE_GLINTS';
ALTER TYPE public.usage_action ADD VALUE IF NOT EXISTS 'SCRAPE_DEALLS';
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'PRO';
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'VIP';
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'ADMIN';

-- Update the consume_usage function to use SELECT FOR UPDATE on the profiles table.
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

    -- Lock the user's profile row to prevent race conditions on quota consumption
    SELECT p.plan, p.paid_until
    INTO v_plan, v_paid_until
    FROM public.profiles p
    WHERE p.id = v_user_id
    FOR UPDATE; -- This locks the row until the transaction ends

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    -- Auto downgrade PRO/VIP if paid_until expired
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

    -- Determine if action is AI operation
    v_is_ai := p_action IN ('AI_EXTRACT', 'AI_GENERATE');

    -- Set daily limit based on plan
    IF v_plan = 'ADMIN' THEN
        v_daily_limit := 999999;
    ELSIF v_plan = 'VIP' THEN
        v_daily_limit := CASE WHEN v_is_ai THEN 100 ELSE 25 END;
    ELSIF v_plan = 'PRO' THEN
        v_daily_limit := CASE WHEN v_is_ai THEN 30 ELSE 10 END;
    ELSE -- FREE
        v_daily_limit := CASE WHEN v_is_ai THEN 3 ELSE 1 END;
    END IF;

    -- Count today's usage for this user (AI and scraping separate)
    SELECT COUNT(*)::integer
    INTO v_used_today
    FROM public.usage_events ue
    WHERE ue.user_id = v_user_id
      AND ue.created_at >= DATE_TRUNC('DAY', NOW() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'
      AND (
          (v_is_ai AND ue.action IN ('AI_EXTRACT', 'AI_GENERATE'))
          OR
          (NOT v_is_ai AND ue.action IN (
              'SCRAPE_LINKEDIN',
              'SCRAPE_JOBSTREET',
              'SCRAPE_INDEED',
              'SCRAPE_GLINTS',
              'SCRAPE_DEALLS'
          ))
      );

    -- FREE plan: only one scraping portal per day
    IF v_plan = 'FREE' AND NOT v_is_ai THEN
        SELECT ue.portal
        INTO v_existing_portal
        FROM public.usage_events ue
        WHERE ue.user_id = v_user_id
          AND ue.created_at >= DATE_TRUNC('DAY', NOW() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'
          AND ue.action IN (
              'SCRAPE_LINKEDIN',
              'SCRAPE_JOBSTREET',
              'SCRAPE_INDEED',
              'SCRAPE_GLINTS',
              'SCRAPE_DEALLS'
          )
        ORDER BY ue.created_at ASC
        LIMIT 1;

        IF v_existing_portal IS NOT NULL AND v_existing_portal IS DISTINCT FROM p_portal THEN
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

    -- Check if daily limit exceeded
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

    -- Record this usage
    INSERT INTO public.usage_events (
        user_id,
        action,
        portal
    ) VALUES (
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

-- Reapply permissions
REVOKE ALL ON FUNCTION public.consume_usage(public.usage_action, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_usage(public.usage_action, text) TO authenticated;
