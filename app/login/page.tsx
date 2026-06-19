"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          이메일로 로그인 링크를 보내드려요. 비밀번호가 필요 없어요.
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
            다른 이메일로 다시 보내기
          </button>
        </div>
      ) : (
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
          {error && <p className="text-sm text-bad px-1">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-brand text-white font-bold disabled:opacity-50"
          >
            {loading ? "보내는 중…" : "로그인 링크 받기"}
          </button>
        </form>
      )}
    </main>
  );
}
