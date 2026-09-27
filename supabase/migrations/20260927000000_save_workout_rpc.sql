-- save_workout: atomic, idempotent workout persistence.
--
-- Saves a workout session, its completed sets and any new personal records in
-- a single transaction. The session id and set ids are generated on the client,
-- so retrying the same workout (offline queue replay, double tap, flaky network)
-- returns the already-saved session instead of creating a duplicate.
--
-- Runs as SECURITY INVOKER: every write goes through the caller's RLS policies,
-- and the owner is always auth.uid() (never taken from the payload).
--
-- Weights are stored in lbs (canonical unit). kg is a display concern only.

create or replace function public.save_workout(p_session jsonb, p_sets jsonb)
returns public.workout_sessions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_session_id uuid := (p_session->>'id')::uuid;
  v_session public.workout_sessions;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- Idempotency: already saved → return it untouched.
  select * into v_session
  from workout_sessions
  where id = v_session_id and user_id = v_uid;
  if found then
    return v_session;
  end if;

  insert into workout_sessions (
    id, user_id, routine_id, name, started_at, completed_at, duration_seconds, rating
  )
  values (
    v_session_id,
    v_uid,
    -- The routine may have been deleted while the workout sat in the offline
    -- queue; keep the workout and drop the link instead of failing the FK.
    (select r.id from routines r
      where r.id = (p_session->>'routine_id')::uuid and r.user_id = v_uid),
    p_session->>'name',
    (p_session->>'started_at')::timestamptz,
    (p_session->>'completed_at')::timestamptz,
    (p_session->>'duration_seconds')::int,
    (p_session->>'rating')::int
  )
  returning * into v_session;

  insert into workout_sets (
    id, session_id, exercise_id, set_number, set_type, reps, weight, completed_at
  )
  select
    (s->>'id')::uuid,
    v_session_id,
    s->>'exercise_id',
    (s->>'set_number')::int,
    coalesce(s->>'set_type', 'working'),
    (s->>'reps')::int,
    (s->>'weight')::numeric,
    v_session.completed_at
  from jsonb_array_elements(coalesce(p_sets, '[]'::jsonb)) as s;

  -- Personal records: best set per exercise and metric in this workout, kept
  -- only if it beats the stored record. Ties go to the earliest set.
  with candidates as (
    select id, exercise_id, set_number, 'max_weight' as record_type, weight as value
    from workout_sets where session_id = v_session_id and weight > 0
    union all
    select id, exercise_id, set_number, 'max_reps', reps::numeric
    from workout_sets where session_id = v_session_id and reps > 0
    union all
    select id, exercise_id, set_number, 'max_volume', reps * weight
    from workout_sets where session_id = v_session_id and reps > 0 and weight > 0
  ),
  best as (
    select distinct on (exercise_id, record_type) id, exercise_id, record_type, value
    from candidates
    order by exercise_id, record_type, value desc, set_number
  ),
  upserted as (
    insert into personal_records (
      user_id, exercise_id, record_type, value, workout_set_id, achieved_at
    )
    select v_uid, b.exercise_id, b.record_type, b.value, b.id, v_session.completed_at
    from best b
    on conflict (user_id, exercise_id, record_type) do update
      set value = excluded.value,
          workout_set_id = excluded.workout_set_id,
          achieved_at = excluded.achieved_at
      where excluded.value > personal_records.value
    returning workout_set_id
  )
  update workout_sets
  set is_pr = true
  where id in (select workout_set_id from upserted);

  return v_session;
end;
$$;

revoke all on function public.save_workout(jsonb, jsonb) from public, anon;
grant execute on function public.save_workout(jsonb, jsonb) to authenticated;

comment on column public.workout_sets.weight is 'Weight in lbs (canonical unit; kg is display-only).';
comment on column public.personal_records.value is 'lbs for max_weight/max_volume, count for max_reps.';
