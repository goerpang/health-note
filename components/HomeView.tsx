"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight, Bell, LogOut, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Member } from "@/lib/types";

const quickMenu = [
  { label: "기록 추가", emoji: "➕", bg: "#EFF6FF" },
  { label: "항목 검색", emoji: "🔍", bg: "#F0FDF4" },
  { label: "수치 추이", emoji: "📈", bg: "#FEF3F2" },
  { label: "결과지", emoji: "📄", bg: "#FFFBEB" },
];

export default function HomeView({
  email,
  members,
}: {
  email: string;
  members: Member[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(
    members[0]?.id ?? null
  );

  // 선택된 구성원 (목록이 바뀌어도 안전하게 폴백)
  const active =
    members.find((m) => m.id === selectedId) ?? members[0] ?? null;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="w-full min-h-screen pb-10 text-ink">
      {/* 헤더 */}
      <header className="px-5 pt-7 pb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sub">{email}</p>
          <h1 className="text-xl font-bold mt-0.5">우리 가족 건강 기록</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-section">
            <Bell size={20} className="text-sub" />
          </button>
          <button
            onClick={signOut}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-section"
            aria-label="로그아웃"
          >
            <LogOut size={18} className="text-sub" />
          </button>
        </div>
      </header>

      {/* 구성원 칩 */}
      <div className="px-5 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {members.map((m) => {
            const isActive = active?.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className="flex items-center gap-2 rounded-2xl shrink-0 transition"
                style={{
                  background: isActive ? "#EFF6FF" : "#F8F9FB",
                  padding: isActive ? "12px 18px" : "10px 16px",
                  transform: isActive ? "scale(1.05)" : "scale(1)",
                }}
              >
                <span className="text-lg" style={{ opacity: isActive ? 1 : 0.55 }}>
                  {m.emoji ?? "🙂"}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: isActive ? "#1D4ED8" : "#8B92A0" }}
                >
                  {m.name}
                </span>
              </button>
            );
          })}
          <Link
            href="/members/new"
            className="flex items-center gap-1 px-4 py-2.5 rounded-2xl shrink-0 bg-section"
          >
            <Plus size={16} className="text-sub" />
            <span className="text-sm font-semibold text-sub">추가</span>
          </Link>
        </div>
      </div>

      {members.length === 0 ? (
        /* 구성원이 아직 없을 때 */
        <div className="px-5 pt-10">
          <div className="rounded-2xl p-8 bg-section flex flex-col items-center text-center">
            <span className="text-4xl mb-3">👨‍👩‍👧‍👦</span>
            <p className="font-bold">아직 등록된 구성원이 없어요</p>
            <p className="text-sm text-sub mt-1 leading-relaxed">
              가족 구성원을 추가하고
              <br />
              건강검진 기록을 관리해보세요.
            </p>
            <Link
              href="/members/new"
              className="mt-5 px-6 py-3 rounded-2xl bg-brand text-white font-bold"
            >
              + 구성원 추가하기
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 빠른 메뉴 */}
          <div className="px-5 pt-5">
            <div className="grid grid-cols-4 gap-3">
              {quickMenu.map((m) => (
                <button key={m.label} className="flex flex-col items-center gap-2">
                  <span
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: m.bg }}
                  >
                    {m.emoji}
                  </span>
                  <span className="text-xs font-semibold text-ink">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 선택 구성원 검진 (아직 기록 없음 — 5단계에서 연동) */}
          <section className="px-5 pt-7">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">{active?.name}님 검진</h2>
              {active && (
                <Link
                  href={`/members/${active.id}`}
                  className="text-sm font-medium flex items-center gap-1 text-sub"
                >
                  <Pencil size={13} /> 정보 수정
                </Link>
              )}
            </div>
            <div className="rounded-2xl p-8 bg-section flex flex-col items-center text-center">
              <span className="text-3xl mb-2">🗂️</span>
              <p className="font-semibold text-sm">아직 검진 기록이 없어요</p>
              <p className="text-xs text-sub mt-1">
                기록 추가 기능은 곧 만들 거예요 (5단계)
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
