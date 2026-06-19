# 건강수첩 🩺

가족 구성원의 건강검진 결과를 저장·관리하는 개인용 웹앱(PWA).
매년 검진 시 이전 기록을 쉽게 확인하고, 병원 방문 시 검사 이력을 즉시 조회할 수 있습니다.

🔗 **배포 주소**: https://health-note-kappa.vercel.app

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | Next.js 14 (App Router) · TypeScript · Tailwind CSS |
| 백엔드/DB | Supabase (PostgreSQL · Auth · Storage) |
| 배포 | Vercel (프론트) + Supabase (백엔드) |
| 인증 | 구글 OAuth + 이메일 매직링크 |
| 플랫폼 | 모바일 브라우저 최적화 PWA (홈 화면 추가 시 전체화면) |

---

## 주요 기능 (MVP)

- 🔐 **로그인** — 구글 계정 또는 이메일 링크
- 👨‍👩‍👧‍👦 **가족 관리** — 가족 그룹 생성, 구성원(이름/생년월일/성별/이모지) 추가·수정·삭제
- 📋 **검진 기록 입력** — 건강검진 / 단일검사, 항목별 수치 입력 *(개발 예정)*
- 📊 **항목 설명 & 정상범위** — 70여 개 표준 검진항목 내장 *(DB 구축 완료)*
- 🔎 **히스토리 조회** — 구성원별 타임라인, 항목별 연도 추이 *(개발 예정)*
- 🤝 **가족 공유** — 초대 링크로 가족 초대, RLS로 타 가족 접근 차단 *(개발 예정)*

---

## 개발 진행 상황

- [x] 1. Supabase 세팅 (테이블 + RLS 보안정책 + 표준항목 70개)
- [x] 2. Next.js 프로젝트 + Supabase 연결
- [x] 3. 로그인 (구글 OAuth + 이메일 매직링크)
- [x] 4. 가족 그룹 + 구성원 CRUD
- [ ] 5. 검진 기록 입력 폼
- [ ] 6. 히스토리 조회 & 항목 검색
- [ ] 7. 파일 첨부 (Supabase Storage)
- [ ] 8. 초대 링크 공유
- [ ] 9. PWA 마무리 (기본 manifest/아이콘은 적용됨)

---

## 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정 — .env.local.example 복사 후 값 채우기
#    (Supabase 대시보드 > Project Settings > API)
cp .env.local.example .env.local

# 3. 개발 서버 실행 → http://localhost:3000
npm run dev
```

필요한 환경변수:

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public 키 |

> Supabase 초기 세팅(테이블·정책·항목 데이터 생성) 방법은 [supabase/SETUP.md](supabase/SETUP.md) 참고.

---

## 프로젝트 구조

```
건강수첩/
├── app/                      # Next.js App Router 페이지
│   ├── page.tsx              # 홈 (가족 구성원 + 검진 요약)
│   ├── login/                # 로그인 화면
│   ├── auth/callback/        # 로그인 링크/OAuth 콜백 처리
│   ├── onboarding/           # 첫 로그인 시 가족 만들기
│   ├── members/new/          # 구성원 추가
│   ├── members/[id]/         # 구성원 수정·삭제
│   ├── manifest.ts           # PWA manifest
│   └── layout.tsx            # 공통 레이아웃 + 메타데이터
├── components/
│   ├── HomeView.tsx          # 홈 화면 UI (클라이언트)
│   └── MemberForm.tsx        # 구성원 추가/수정 폼
├── lib/
│   ├── supabase/             # Supabase 클라이언트 (브라우저/서버/미들웨어)
│   └── types.ts              # DB 테이블 대응 타입
├── middleware.ts             # 세션 갱신 + 라우트 보호(로그인 안 하면 차단)
├── supabase/
│   ├── SETUP.md              # Supabase 세팅 가이드
│   └── migrations/           # DB 스키마·정책·항목 데이터 SQL
└── public/                   # 앱 아이콘 등 정적 파일
```

---

## 보안 (RLS)

건강 데이터는 민감하므로 Supabase **Row Level Security**를 전 테이블에 적용했습니다.
"로그인한 사용자는 **자신이 속한 가족의 데이터만** 읽고 쓸 수 있다"를 DB 차원에서 강제합니다.
코드 실수가 있어도 다른 가족의 기록은 절대 노출되지 않습니다.

---

## 디자인

순백(#FFFFFF) 배경 + 선명한 파랑(#3B82F6) 포인트. 토스/똑닥 스타일의 깨끗한 모바일 UI.
자세한 가이드는 [CLAUDE.md](CLAUDE.md)의 "디자인 가이드" 참고.
