# 구글 로그인 설정 가이드

> 구글 로그인은 이메일을 안 보내므로 rate limit 문제가 없습니다.
> 한 번만 설정하면 끝. 약 15분.
> 큰 흐름: ① 구글 클라우드에서 OAuth 키 발급 → ② Supabase에 그 키 등록

가장 중요한 값 (미리 복사해두기):

```
Supabase 콜백 주소 (구글에 등록할 redirect URI):
https://lxkrshykoncwdyggahvw.supabase.co/auth/v1/callback
```

---

## ① 구글 클라우드 콘솔에서 OAuth 키 만들기

https://console.cloud.google.com 접속 (구글 계정 로그인)

### 1-1. 프로젝트 생성
- 상단 프로젝트 선택 → **새 프로젝트** → 이름 `health-note` → 만들기 → 그 프로젝트 선택

### 1-2. OAuth 동의 화면 설정
- 좌측 메뉴 **API 및 서비스 → OAuth 동의 화면** (또는 "Google 인증 플랫폼")
- **User Type: 외부(External)** 선택 → 만들기
- 입력:
  - 앱 이름: `우리 가족 건강 기록`
  - 사용자 지원 이메일: 본인 이메일
  - 개발자 연락처 이메일: 본인 이메일
- 나머지는 기본값으로 **저장 후 계속**
- **테스트 사용자(Test users)** 단계에서 → **로그인할 가족들의 Gmail 주소 추가**
  (예: pshpsh111@gmail.com 등. 테스트 모드에선 여기 등록된 계정만 로그인 가능)
- 저장

### 1-3. OAuth 클라이언트 ID 발급
- 좌측 **API 및 서비스 → 사용자 인증 정보(Credentials)**
- 상단 **+ 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
- **애플리케이션 유형: 웹 애플리케이션**
- 이름: `health-note-web`
- **승인된 JavaScript 원본(Authorized JavaScript origins)** 에 추가:
  ```
  https://health-note-kappa.vercel.app
  http://localhost:3000
  ```
- **승인된 리디렉션 URI(Authorized redirect URIs)** 에 추가:
  ```
  https://lxkrshykoncwdyggahvw.supabase.co/auth/v1/callback
  ```
- **만들기** → 팝업에 뜨는 **클라이언트 ID**와 **클라이언트 보안 비밀(Client Secret)** 복사
  (나중에 다시 볼 수 있음)

---

## ② Supabase에 구글 키 등록

- Supabase 대시보드 → **Authentication → Providers** (또는 Sign In / Providers)
- 목록에서 **Google** 클릭 → **Enable** 켜기
- 입력:
  - **Client ID**: 위에서 복사한 클라이언트 ID
  - **Client Secret**: 위에서 복사한 보안 비밀
- **Save**

---

## ③ 끝! 테스트

- https://health-note-kappa.vercel.app/login → **"구글로 시작하기"** 클릭
- 구글 계정 선택 → (테스트 모드면 "확인되지 않은 앱" 경고가 나올 수 있음 → 고급 → 계속 진행)
- 자동으로 홈 화면 진입되면 성공

> "확인되지 않은 앱" 경고는 개인/가족용 앱이라 정상입니다. 정식 심사를 안 받아서 그래요. 가족끼리 쓰는 건 문제 없습니다.

---

## 자주 나는 오류

| 증상 | 원인 / 해결 |
|---|---|
| `redirect_uri_mismatch` | 1-3의 리디렉션 URI가 Supabase 콜백 주소와 정확히 일치하는지 확인 |
| `Access blocked / 앱이 차단됨` | 1-2 테스트 사용자에 본인 Gmail이 추가됐는지 확인 |
| 로그인 후 /login 으로 돌아옴 | Supabase Redirect URLs에 vercel 주소가 있는지 확인 (이미 등록함) |
