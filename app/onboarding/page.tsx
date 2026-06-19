"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("우리 가족");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createFamily(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("create_family", {
      family_name: name.trim() || "우리 가족",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 pb-16">
      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-soft flex items-center justify-center text-3xl mb-4">
          👨‍👩‍👧‍👦
        </div>
        <h1 className="text-2xl font-bold">우리 가족을 만들어요</h1>
        <p className="text-sm text-sub mt-1.5 leading-relaxed">
          가족 그룹을 만들면 구성원을 추가하고 검진 기록을 함께 관리할 수 있어요.
        </p>
      </div>

      <form onSubmit={createFamily} className="space-y-3">
        <div>
          <label className="text-sm font-semibold text-sub">가족 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 홍길동 가족"
            className="w-full mt-2 px-4 py-3.5 rounded-2xl bg-section text-ink placeholder:text-sub outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        {error && <p className="text-sm text-bad px-1">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-brand text-white font-bold disabled:opacity-50"
        >
          {loading ? "만드는 중…" : "가족 만들기"}
        </button>
      </form>
    </main>
  );
}
