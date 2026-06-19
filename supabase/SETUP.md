# 1단계: Supabase 세팅 가이드

> 백엔드 서버를 직접 만들지 않고 Supabase(클라우드 DB+인증+저장소)를 씁니다.
> 아래 순서대로 따라 하시면 됩니다. 약 10분.

## 1-1. 계정 & 프로젝트 생성

1. https://supabase.com 접속 → **Start your project** → GitHub 계정으로 로그인 (가입 무료)
2. 대시보드에서 **New project** 클릭
3. 입력값:
   - **Name**: `family-health` (아무거나)
   - **Database Password**: 강한 비밀번호 생성 후 **꼭 따로 저장** (나중에 필요할 수 있음)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국에서 가장 빠름)
   - **Plan**: Free
4. **Create new project** → 약 1~2분 기다리면 생성 완료

## 1-2. 테이블 + 보안정책 생성 (SQL 실행)

> 우리가 만든 SQL을 그대로 붙여넣어 실행합니다.

1. 왼쪽 메뉴 **SQL Editor** → **+ New query**
2. `supabase/migrations/0001_init.sql` 파일 **전체 복사** → 붙여넣기 → 우측 하단 **Run** (또는 Ctrl+Enter)
   - "Success. No rows returned" 나오면 성공
3. 다시 **+ New query** → `supabase/migrations/0002_item_definitions.sql` **전체 복사** → 붙여넣기 → **Run**
   - 표준 검진항목 약 70개가 들어갑니다

### 확인
- 왼쪽 **Table Editor** 들어가면 `families`, `members`, `checkup_records`, `checkup_items`, `attachments`, `user_families`, `item_definitions` 테이블이 보입니다
- `item_definitions` 클릭하면 신장/혈당/콜레스테롤 등 항목들이 채워져 있어야 합니다

## 1-3. 접속 키 확인 (다음 단계용)

왼쪽 메뉴 **Project Settings**(톱니바퀴) → **API** 에서 아래 2개를 복사해두세요. 다음 2단계(Next.js 연결)에서 씁니다.

- **Project URL** (예: `https://xxxxx.supabase.co`)
- **anon public** key (`anon` `public` 이라고 적힌 긴 키)

> ⚠️ `service_role` key는 절대 앱 코드에 넣지 마세요. 서버 전용입니다.

## 1-4. 구글 로그인 준비 (3단계에서 본격 설정)

지금은 안 해도 됩니다. 3단계에서 안내합니다.
(미리 보고 싶으면: Authentication → Providers → Google)

## 파일 저장소(Storage)는?

결과지 사진/PDF 업로드용 Storage 버킷은 **7단계**에서 만듭니다. 지금은 불필요.

---

## ✅ 1단계 완료 체크리스트
- [ ] Supabase 프로젝트 생성됨 (Seoul 리전)
- [ ] 0001_init.sql 실행 성공
- [ ] 0002_item_definitions.sql 실행 성공
- [ ] Table Editor에 7개 테이블 보임
- [ ] item_definitions에 항목 데이터 채워짐
- [ ] Project URL + anon key 복사해둠

위 6개 끝나면 **"1단계 완료"** 라고 알려주세요. 바로 2단계(Next.js 프로젝트 세팅 + Supabase 연결)로 넘어갑니다.
