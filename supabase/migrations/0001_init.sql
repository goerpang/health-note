-- ============================================================
-- 가족 건강검진 관리 앱 - 초기 스키마 + RLS
-- 실행 위치: Supabase 대시보드 > SQL Editor > New query > 전체 붙여넣기 > Run
-- ============================================================

-- UUID 생성 함수 (Supabase 기본 제공이지만 안전하게 보장)
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. 테이블
-- ------------------------------------------------------------

-- 가족 그룹
create table if not exists families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique not null default encode(gen_random_bytes(6), 'hex'),
  created_at  timestamptz not null default now()
);

-- 사용자 <-> 가족 연결 (Supabase Auth user)
create table if not exists user_families (
  user_id    uuid not null references auth.users(id) on delete cascade,
  family_id  uuid not null references families(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (user_id, family_id)
);

-- 가족 구성원
create table if not exists members (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  name       text not null,
  birth_date date,
  gender     text check (gender in ('M','F')),
  emoji      text,                          -- 프로필 이모지 (예: 👨🏻)
  photo_url  text,                          -- 선택: 업로드 사진
  created_at timestamptz not null default now()
);

-- 검진 기록 (건강검진 or 단일검사)
create table if not exists checkup_records (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  type        text not null check (type in ('checkup','single')),
  record_date date not null,
  hospital    text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- 항목별 결과 수치
create table if not exists checkup_items (
  id          uuid primary key default gen_random_uuid(),
  record_id   uuid not null references checkup_records(id) on delete cascade,
  item_code   text,                         -- 표준항목 코드 (직접입력이면 null 가능)
  item_name   text not null,                -- 표시 이름
  value       text,                         -- 수치 또는 결과 텍스트
  unit        text,
  is_abnormal boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 첨부 파일 (결과지 사진/PDF)
create table if not exists attachments (
  id         uuid primary key default gen_random_uuid(),
  record_id  uuid not null references checkup_records(id) on delete cascade,
  file_url   text not null,
  file_type  text check (file_type in ('image','pdf')),
  created_at timestamptz not null default now()
);

-- 표준 검진항목 내장 DB (전 사용자 공용 읽기)
create table if not exists item_definitions (
  item_code    text primary key,
  category     text not null,
  item_name    text not null,
  unit         text,
  normal_range text,                         -- 표시용 정상범위 텍스트
  description  text,
  sort_order   int not null default 0
);

-- 조회 성능용 인덱스
create index if not exists idx_members_family       on members(family_id);
create index if not exists idx_records_member        on checkup_records(member_id);
create index if not exists idx_records_date          on checkup_records(record_date);
create index if not exists idx_items_record          on checkup_items(record_id);
create index if not exists idx_items_code            on checkup_items(item_code);
create index if not exists idx_attachments_record    on attachments(record_id);
create index if not exists idx_userfam_family        on user_families(family_id);

-- ------------------------------------------------------------
-- 2. 헬퍼 함수: 현재 로그인 사용자가 속한 가족 id 목록
--    (RLS 정책에서 재귀 없이 깔끔하게 쓰기 위함)
-- ------------------------------------------------------------
create or replace function public.auth_family_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select family_id from user_families where user_id = auth.uid()
$$;

-- ------------------------------------------------------------
-- 3. RLS 활성화
-- ------------------------------------------------------------
alter table families         enable row level security;
alter table user_families    enable row level security;
alter table members          enable row level security;
alter table checkup_records  enable row level security;
alter table checkup_items    enable row level security;
alter table attachments      enable row level security;
alter table item_definitions enable row level security;

-- ------------------------------------------------------------
-- 4. RLS 정책
--    원칙: 자신이 속한 가족(user_families)의 데이터만 접근 가능
-- ------------------------------------------------------------

-- families: 내가 속한 가족만 조회/수정/삭제, 생성은 누구나(로그인 시)
create policy "families_select" on families
  for select using (id in (select auth_family_ids()));
create policy "families_insert" on families
  for insert with check (auth.uid() is not null);
create policy "families_update" on families
  for update using (id in (select auth_family_ids()));
create policy "families_delete" on families
  for delete using (id in (select auth_family_ids()));

-- user_families: 자신의 연결 행만 조회/생성/삭제
create policy "user_families_select" on user_families
  for select using (user_id = auth.uid());
create policy "user_families_insert" on user_families
  for insert with check (user_id = auth.uid());
create policy "user_families_delete" on user_families
  for delete using (user_id = auth.uid());

-- members: 내 가족의 구성원만
create policy "members_all" on members
  for all
  using (family_id in (select auth_family_ids()))
  with check (family_id in (select auth_family_ids()));

-- checkup_records: 구성원이 내 가족에 속할 때만
create policy "records_all" on checkup_records
  for all
  using (member_id in (select id from members where family_id in (select auth_family_ids())))
  with check (member_id in (select id from members where family_id in (select auth_family_ids())));

-- checkup_items: 기록이 내 가족에 속할 때만
create policy "items_all" on checkup_items
  for all
  using (record_id in (
    select r.id from checkup_records r
    join members m on m.id = r.member_id
    where m.family_id in (select auth_family_ids())
  ))
  with check (record_id in (
    select r.id from checkup_records r
    join members m on m.id = r.member_id
    where m.family_id in (select auth_family_ids())
  ));

-- attachments: 기록이 내 가족에 속할 때만
create policy "attachments_all" on attachments
  for all
  using (record_id in (
    select r.id from checkup_records r
    join members m on m.id = r.member_id
    where m.family_id in (select auth_family_ids())
  ))
  with check (record_id in (
    select r.id from checkup_records r
    join members m on m.id = r.member_id
    where m.family_id in (select auth_family_ids())
  ));

-- item_definitions: 로그인한 모든 사용자 읽기 가능 (공용 사전)
create policy "item_definitions_select" on item_definitions
  for select using (auth.uid() is not null);
