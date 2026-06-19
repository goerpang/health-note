"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight, Bell, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// 2단계에서는 화면 톤 확인용 정적 데이터입니다.
// 4단계(구성원 CRUD)부터 Supabase에서 실제 데이터를 불러옵니다.
const members = [
  { name: "아빠", emoji: "👨🏻" },
  { name: "엄마", emoji: "👩🏻" },
  { name: "예린", emoji: "👦🏻" },
];

const recentItems = [
  { label: "공복혈당", value: "98", unit: "mg/dL", ok: true, range: "정상" },
  { label: "총콜레스테롤", value: "215", unit: "mg/dL", ok: false, range: "경계" },
  { label: "수축기혈압", value: "124", unit: "mmHg", ok: true, range: "정상" },
];

const timeline = [
  { date: "2025.03.14", type: "건강검진", place: "서울대병원", count: "12개 항목", blue: true },
  { date: "2024.11.02", type: "단일검사", place: "연세이비인후과", count: "갑상선초음파", blue: false },
  { date: "2024.03.20", type: "건강검진", place: "강남세브란스", count: "10개 항목", blue: true },
];

const quickMenu = [
  { label: "기록 추가", emoji: "➕", bg: "#EFF6FF" },
  { label: "항목 검색", emoji: "🔍", bg: "#F0FDF4" },
  { label: "수치 추이", emoji: "📈", bg: "#FEF3F2" },
  { label: "결과지", emoji: "📄", bg: "#FFFBEB" },
];

export default function HomeView({ email }: { email: string }) {
  const [member, setMember] = useState("아빠");
  const router = useRouter();

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
            const active = m.name === member;
            return (
              <button
                key={m.name}
                onClick={() => setMember(m.name)}
                className="flex items-center gap-2 rounded-2xl shrink-0 transition"
                style={{
                  background: active ? "#EFF6FF" : "#F8F9FB",
                  padding: active ? "12px 18px" : "10px 16px",
                  transform: active ? "scale(1.05)" : "scale(1)",
                }}
              >
                <span className="text-lg" style={{ opacity: active ? 1 : 0.55 }}>
                  {m.emoji}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: active ? "#1D4ED8" : "#8B92A0" }}
                >
                  {m.name}
                </span>
              </button>
            );
          })}
          <button className="flex items-center gap-1 px-4 py-2.5 rounded-2xl shrink-0 bg-section">
            <Plus size={16} className="text-sub" />
            <span className="text-sm font-semibold text-sub">추가</span>
          </button>
        </div>
      </div>

      {/* 다음 검진 알림 */}
      <div className="px-5 pt-3">
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-brand-card">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/25">
            <span className="text-xl">🔔</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">대장내시경 받을 때가 됐어요</p>
            <p className="text-xs mt-0.5 text-white/85">마지막 검사 2021.06 · 약 4년 전</p>
          </div>
          <ChevronRight size={20} className="text-white/80" />
        </div>
      </div>

      {/* 빠른 메뉴 */}
      <div className="px-5 pt-6">
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

      {/* 최근 검진 */}
      <section className="px-5 pt-7">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-bold">{member}님 최근 검진</h2>
          <span className="text-sm font-medium flex items-center gap-0.5 text-brand">
            전체 <ChevronRight size={15} />
          </span>
        </div>
        <div className="rounded-2xl p-5 bg-section">
          <p className="text-xs mb-4 text-sub">2025.03.14 · 서울대병원 건강검진센터</p>
          <div className="space-y-4">
            {recentItems.map((it) => (
              <div key={it.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{it.label}</p>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                    style={{
                      background: it.ok ? "#DCFCE7" : "#FEE2E2",
                      color: it.ok ? "#16A34A" : "#DC2626",
                    }}
                  >
                    {it.range}
                  </span>
                </div>
                <div className="text-right flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-ink">{it.value}</span>
                  <span className="text-xs text-sub">{it.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 타임라인 */}
      <section className="px-5 pt-7">
        <h2 className="text-lg font-bold mb-4">검진 기록</h2>
        <div className="relative pl-6">
          <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-line" />
          {timeline.map((r, i) => (
            <div key={i} className="relative mb-3 last:mb-0">
              <span
                className="absolute -left-6 top-4 w-3 h-3 rounded-full ring-4 ring-white"
                style={{ background: r.blue ? "#3B82F6" : "#A78BFA" }}
              />
              <div className="rounded-2xl p-4 flex items-center justify-between bg-section">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{r.place}</span>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-md font-semibold"
                      style={{
                        background: r.blue ? "#EFF6FF" : "#F3F0FF",
                        color: r.blue ? "#3B82F6" : "#7C3AED",
                      }}
                    >
                      {r.type}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-sub">
                    {r.date} · {r.count}
                  </p>
                </div>
                <ChevronRight size={18} style={{ color: "#C5CBD6" }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
