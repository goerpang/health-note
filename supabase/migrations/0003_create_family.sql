-- ============================================================
-- 가족 생성 함수 (RPC)
-- RLS 때문에 "가족 생성 → 본인을 owner로 연결"을 클라이언트에서 2단계로 하면
-- 권한 꼬임이 생긴다. security definer 함수로 한 번에 원자적으로 처리.
-- 0002 이후 실행. 재실행 안전(create or replace).
-- ============================================================

create or replace function public.create_family(family_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;

  insert into families (name)
  values (coalesce(nullif(trim(family_name), ''), '우리 가족'))
  returning id into new_id;

  insert into user_families (user_id, family_id, role)
  values (auth.uid(), new_id, 'owner');

  return new_id;
end;
$$;

-- 로그인한 사용자가 호출 가능하도록 권한 부여
grant execute on function public.create_family(text) to authenticated;
