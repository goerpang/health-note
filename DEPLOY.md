# Vercel 배포 가이드 (외부에서 폰으로 접속하기)

> 목표: 인터넷에 앱을 올려 `https://xxxx.vercel.app` 주소로 어디서든 접속.
> GitHub에 코드를 올리고 → Vercel이 그 코드를 가져가 자동 배포하는 구조.
> 한 번 연결하면, 앞으로 코드를 GitHub에 올릴 때마다 자동으로 다시 배포됩니다.

---

## 사전 개념 (중요)

- **비밀키(.env.local)는 GitHub에 안 올라갑니다.** (`.gitignore`로 막아둠)
  대신 Supabase URL/키 2개를 **Vercel 설정 화면에 직접 등록**합니다.
- **anon key는 공개 키라 괜찮지만**, 습관적으로 키는 코드에 커밋하지 않습니다.

---

## 1. GitHub에 코드 올리기

> 제(Claude)가 터미널에서 처리합니다. GitHub 로그인만 직접 해주시면 됩니다.
> (GitHub CLI 인증 또는 토큰 필요 — 진행 중 안내)

올리는 내용: 소스코드 전체 (node_modules, .next, .env.local 제외)

## 2. Vercel 가입 & 프로젝트 연결

1. https://vercel.com → **Sign Up** → **Continue with GitHub** (Supabase 때와 동일 계정 추천)
2. **Add New... → Project**
3. 방금 만든 GitHub 저장소 **Import**
4. **Framework Preset**: Next.js (자동 인식됨)
5. **Environment Variables** 펼치고 아래 2개 입력:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://lxkrshykoncwdyggahvw.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (1단계 anon key 그대로) |

6. **Deploy** 클릭 → 1~2분 후 `https://OOOO.vercel.app` 주소 생성

## 3. Supabase에 배포 주소 등록 (매직링크용)

배포 주소에서도 로그인 링크가 동작하게 하려면:

1. Supabase → **Authentication → URL Configuration**
2. **Redirect URLs**에 **Add URL**:
   - `https://OOOO.vercel.app/**`  ← 2번에서 받은 실제 주소
3. (선택) **Site URL**을 배포 주소로 바꾸면 메일 링크 기본값이 배포본을 가리킴
   - 단, 그러면 로컬(localhost) 테스트 시엔 링크가 배포본으로 감.
   - 로컬+배포 둘 다 쓰려면 Redirect URLs에 둘 다 등록해두면 됨:
     - `http://localhost:3000/**`
     - `https://OOOO.vercel.app/**`

## 4. 폰에서 접속

- 폰 브라우저에서 `https://OOOO.vercel.app` 접속 → 로그인 화면
- 이메일 입력 → 메일의 링크를 **폰에서** 누르면 폰에서 로그인됨
- 홈 화면에 추가하면 앱처럼 쓸 수 있음 (PWA는 9단계에서 본격 설정)

---

## 이후 워크플로우 (자동 배포)

```
코드 수정 → git에 커밋/푸시 → Vercel이 감지 → 자동 재배포 (1~2분)
```
앞으로 4~9단계 진행하면서 변경분이 폰에 자동 반영됩니다.
