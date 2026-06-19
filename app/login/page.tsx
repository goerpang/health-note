"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 구글 로그인
  async function signInWithGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
    // 성공 시 구글 동의화면으로 자동 이동됨
  }

  // 이메일 매직링크 로그인
  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 pb-16">
      {/* 로고/타이틀 */}
      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-soft flex items-center justify-center text-3xl mb-4">
          🩺
        </div>
        <h1 className="text-2xl font-bold">우리 가족 건강 기록</h1>
        <p className="text-sm text-sub mt-1.5">
          구글 계정으로 간편하게 시작하세요.
        </p>
      </div>

      {sent ? (
        <div className="rounded-2xl p-5 bg-section">
          <p className="text-2xl mb-2">📬</p>
          <p className="font-bold">메일을 확인해주세요</p>
          <p className="text-sm text-sub mt-1.5 leading-relaxed">
            <span className="font-semibold text-ink">{email}</span> 으로 로그인
            링크를 보냈어요. 메일의 링크를 누르면 자동으로 로그인됩니다.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-sm font-semibold text-brand mt-4"
          >
            다른 방법으로 로그인
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 구글 로그인 버튼 */}
          <button
            onClick={signInWithGoogle}
            className="w-full py-3.5 rounded-2xl bg-white border border-line text-ink font-bold flex items-center justify-center gap-2.5 active:bg-section"
          >
            <GoogleIcon />
            구글로 시작하기
          </button>

          {/* 구분선 */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-sub">또는 이메일로</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          {/* 이메일 매직링크 */}
          <form onSubmit={sendLink} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              autoComplete="email"
              className="w-full px-4 py-3.5 rounded-2xl bg-section text-ink placeholder:text-sub outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-brand text-white font-bold disabled:opacity-50"
            >
              {loading ? "보내는 중…" : "로그인 링크 받기"}
            </button>
          </form>

          {error && <p className="text-sm text-bad px-1">{error}</p>}
        </div>
      )}
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
