-- Menambahkan portal scraping baru: Indeed, Glints, Dealls
-- 1. Tambah nilai enum baru pada usage_action

ALTER TYPE public.usage_action ADD VALUE IF NOT EXISTS 'SCRAPE_INDEED';
ALTER TYPE public.usage_action ADD VALUE IF NOT EXISTS 'SCRAPE_GLINTS';
ALTER TYPE public.usage_action ADD VALUE IF NOT EXISTS 'SCRAPE_DEALLS';

-- 2. Perbarui fungsi consume_usage agar portal baru dihitung sebagai kuota scraping
--    (bukan kuota AI) dan tunduk pada aturan "satu portal per hari" untuk paket FREE.

create or replace function public.consume_usage(
  p_action public.usage_action,
  p_portal text default null
)
returns table (
  allowed boolean,
  message text,
  used_today integer,
  daily_limit integer,
  plan public.plan_type
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan public.plan_type;
  v_paid_until timestamptz;
  v_used_today integer;
  v_daily_limit integer;
  v_existing_portal text;
  v_is_ai boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select p.plan, p.paid_until
  into v_plan, v_paid_until
  from public.profiles p
  where p.id = v_user_id;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_plan = 'PAID' and (
    v_paid_until is null or v_paid_until <= now()
  ) then
    update public.profiles
    set
      plan = 'FREE',
      paid_until = null,
      updated_at = now()
    where id = v_user_id;

    v_plan := 'FREE';
  end if;

  v_is_ai := p_action in (
    'AI_EXTRACT',
    'AI_GENERATE'
  );

  if v_plan = 'PAID' then
    v_daily_limit := case
      when v_is_ai then 30
      else 10
    end;
  else
    v_daily_limit := case
      when v_is_ai then 3
      else 1
    end;
  end if;

  select count(*)::integer
  into v_used_today
  from public.usage_events ue
  where ue.user_id = v_user_id
    and ue.created_at >= date_trunc(
      'day',
      now() at time zone 'Asia/Jakarta'
    ) at time zone 'Asia/Jakarta'
    and (
      (v_is_ai and ue.action in (
        'AI_EXTRACT',
        'AI_GENERATE'
      ))
      or
      (not v_is_ai and ue.action in (
        'SCRAPE_LINKEDIN',
        'SCRAPE_JOBSTREET',
        'SCRAPE_INDEED',
        'SCRAPE_GLINTS',
        'SCRAPE_DEALLS'
      ))
    );

  if v_plan = 'FREE' and not v_is_ai then
    select ue.portal
    into v_existing_portal
    from public.usage_events ue
    where ue.user_id = v_user_id
      and ue.created_at >= date_trunc(
        'day',
        now() at time zone 'Asia/Jakarta'
      ) at time zone 'Asia/Jakarta'
      and ue.action in (
        'SCRAPE_LINKEDIN',
        'SCRAPE_JOBSTREET',
        'SCRAPE_INDEED',
        'SCRAPE_GLINTS',
        'SCRAPE_DEALLS'
      )
    order by ue.created_at asc
    limit 1;

    if v_existing_portal is not null
      and v_existing_portal is distinct from p_portal then
      return query
      select
        false,
        'Paket FREE hanya dapat memakai satu portal scraping per hari.',
        v_used_today,
        v_daily_limit,
        v_plan;
      return;
    end if;
  end if;

  if v_used_today >= v_daily_limit then
    return query
    select
      false,
      'Kuota harian sudah habis.',
      v_used_today,
      v_daily_limit,
      v_plan;
    return;
  end if;

  insert into public.usage_events (
    user_id,
    action,
    portal
  )
  values (
    v_user_id,
    p_action,
    p_portal
  );

  return query
  select
    true,
    'Penggunaan dicatat.',
    v_used_today + 1,
    v_daily_limit,
    v_plan;
end;
$$;

revoke all on function public.consume_usage(
  public.usage_action,
  text
) from public;

grant execute on function public.consume_usage(
  public.usage_action,
  text
) to authenticated;
