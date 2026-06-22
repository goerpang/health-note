"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronRight, Bell, User, Pencil } from "lucide-react";
import type { Member, CheckupRecord, CheckupItem } from "@/lib/types";

export type RecordWithItems = CheckupRecord & { checkup_items: CheckupItem[] };

// "2026-06-20" → "2026.06.20"
function fmtDate(d: string) {
  return d.replaceAll("-", ".");
}

const RECENT_ITEM_LIMIT = 4;

export default function HomeView({
  familyName,
  members,
  records,
}: {
  familyName: string;
  members: Member[];
  records: RecordWithItems[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    members[0]?.id ?? null
  );

  // 선택된 구성원 (목록이 바뀌어도 안전하게 폴백)
  const active = members.find((m) => m.id === selectedId) ?? members[0] ?? null;

  // 선택 구성원의 기록 (이미 최신순 정렬되어 들어옴)
  const memberRecords = active
    ? records.filter((r) => r.member_id === active.id)
    : [];
  const latest = memberRecords[0] ?? null;

  return (
    <div className="w-full min-h-screen pb-10 text-ink">
      {/* 헤더 */}
      <header className="px-5 pt-7 pb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sub">우리 가족 건강 기록</p>
          <h1 className="text-xl font-bold mt-0.5">{familyName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-section">
            <Bell size={20} className="text-sub" />
          </button>
          <Link
            href="/mypage"
            prefetch
            className="w-10 h-10 rounded-full flex items-center justify-center bg-section touch-manipulation active:opacity-70"
            aria-label="마이페이지"
          >
            <User size={18} className="text-sub" />
          </Link>
        </div>
      </header>

      {/* 구성원 칩 (구성원이 있을 때만) */}
      {members.length > 0 && (
        <div className="px-5 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {members.map((m) => {
              const isActive = active?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className="flex items-center gap-2 rounded-2xl shrink-0 transition-transform touch-manipulation active:opacity-70"
                  style={{
                    background: isActive ? "#EFF6FF" : "#F8F9FB",
                    padding: "11px 16px",
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
              prefetch
              className="flex items-center gap-1 px-4 py-2.5 rounded-2xl shrink-0 bg-section touch-manipulation active:opacity-70"
            >
              <Plus size={16} className="text-sub" />
              <span className="text-sm font-semibold text-sub">추가</span>
            </Link>
          </div>
        </div>
      )}

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
              prefetch
              className="mt-5 px-6 py-3 rounded-2xl bg-brand text-white font-bold touch-manipulation active:opacity-80"
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
              <Link
                href={`/records/new${active ? `?member=${active.id}` : ""}`}
                prefetch
                className="flex flex-col items-center gap-2 touch-manipulation active:opacity-70"
              >
                <span className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-brand-soft">
                  ➕
                </span>
                <span className="text-xs font-semibold text-ink">기록 추가</span>
              </Link>
              {[
                { label: "항목 검색", emoji: "🔍", bg: "#F0FDF4" },
                { label: "수치 추이", emoji: "📈", bg: "#FEF3F2" },
                { label: "결과지", emoji: "📄", bg: "#FFFBEB" },
              ].map((m) => (
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">{active?.name}님 최근 검진</h2>
              {active && (
                <Link
                  href={`/members/${active.id}`}
                  className="text-sm font-medium flex items-center gap-1 text-sub touch-manipulation"
                >
                  <Pencil size={13} /> 정보 수정
                </Link>
              )}
            </div>

            {latest ? (
              <div className="rounded-2xl p-5 bg-section">
                <p className="text-xs mb-4 text-sub">
                  {fmtDate(latest.record_date)} ·{" "}
                  {latest.hospital ?? "병원 미기재"}
                </p>
                <div className="space-y-4">
                  {latest.checkup_items.slice(0, RECENT_ITEM_LIMIT).map((it) => (
                    <div key={it.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {it.item_name}
                        </p>
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0"
                          style={{
                            background: it.is_abnormal ? "#FEE2E2" : "#DCFCE7",
                            color: it.is_abnormal ? "#DC2626" : "#16A34A",
                          }}
                        >
                          {it.is_abnormal ? "이상" : "정상"}
                        </span>
                      </div>
                      <div className="text-right flex items-baseline gap-1 shrink-0">
                        <span className="text-2xl font-extrabold text-ink">
                          {it.value}
                        </span>
                        <span className="text-xs text-sub">{it.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {latest.checkup_items.length > RECENT_ITEM_LIMIT && (
                  <p className="text-xs text-sub mt-4">
                    외 {latest.checkup_items.length - RECENT_ITEM_LIMIT}개 항목
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl p-8 bg-section flex flex-col items-center text-center">
                <span className="text-3xl mb-2">🗂️</span>
                <p className="font-semibold text-sm">아직 검진 기록이 없어요</p>
                <Link
                  href={`/records/new${active ? `?member=${active.id}` : ""}`}
                  prefetch
                  className="mt-4 px-5 py-2.5 rounded-2xl bg-brand text-white font-bold text-sm touch-manipulation active:opacity-80"
                >
                  + 기록 추가하기
                </Link>
              </div>
            )}
          </section>

          {/* 타임라인 */}
          {memberRecords.length > 0 && (
            <section className="px-5 pt-7">
              <h2 className="text-lg font-bold mb-4">검진 기록</h2>
              <div className="relative pl-6">
                <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-line" />
                {memberRecords.map((r) => {
                  const isCheckup = r.type === "checkup";
                  return (
                    <div key={r.id} className="relative mb-3 last:mb-0">
                      <span
                        className="absolute -left-6 top-4 w-3 h-3 rounded-full ring-4 ring-white"
                        style={{ background: isCheckup ? "#3B82F6" : "#A78BFA" }}
                      />
                      <div className="rounded-2xl p-4 flex items-center justify-between bg-section">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold truncate">
                              {r.hospital ?? "병원 미기재"}
                            </span>
                            <span
                              className="text-[11px] px-2 py-0.5 rounded-md font-semibold shrink-0"
                              style={{
                                background: isCheckup ? "#EFF6FF" : "#F3F0FF",
                                color: isCheckup ? "#3B82F6" : "#7C3AED",
                              }}
                            >
                              {isCheckup ? "건강검진" : "단일검사"}
                            </span>
                          </div>
                          <p className="text-xs mt-1 text-sub">
                            {fmtDate(r.record_date)} · {r.checkup_items.length}개 항목
                          </p>
                        </div>
                        <ChevronRight size={18} style={{ color: "#C5CBD6" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
