"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search } from "lucide-react";
import GuideDetail from "@/components/GuideDetail";
import { ageAt, getStatus, type ScreeningStatus } from "@/lib/screeningGuide";
import type { Member, ItemDefinition, RecordWithItems } from "@/lib/types";

export interface ItemHistory {
  record_id: string;
  date: string;
  value: string | null;
  unit: string | null;
  is_abnormal: boolean;
}

function statusBadge(s: ScreeningStatus): {
  label: string;
  bg: string;
  fg: string;
} | null {
  switch (s.kind) {
    case "due":
      return { label: "받을 때 됨", bg: "#FEF3C7", fg: "#92400E" };
    case "ok":
      return { label: `${s.lastDate.slice(0, 7).replace("-", ".")} 받음`, bg: "#DCFCE7", fg: "#16A34A" };
    case "received":
      return { label: `${s.lastDate.slice(0, 7).replace("-", ".")} 받음`, bg: "#EFF6FF", fg: "#1D4ED8" };
    case "none":
      return { label: "받은 적 없음", bg: "#F1F3F6", fg: "#8B92A0" };
  }
}

export default function GuideView({
  members,
  definitions,
  records,
  initialMemberId,
}: {
  members: Member[];
  definitions: ItemDefinition[];
  records: RecordWithItems[];
  initialMemberId?: string;
}) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);

  const [memberId, setMemberId] = useState(
    members.find((m) => m.id === initialMemberId)?.id ?? members[0]?.id ?? ""
  );
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [openCode, setOpenCode] = useState<string | null>(null);

  // 상세 열 때 history 엔트리 추가 → 기기 뒤로가기로 목록 복귀
  useEffect(() => {
    const onPop = () => setOpenCode(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function openDetail(code: string) {
    window.history.pushState({ guideDetail: true }, "");
    setOpenCode(code);
  }
  function closeDetail() {
    window.history.back();
  }

  const active = members.find((m) => m.id === memberId) ?? members[0] ?? null;
  const age = active ? ageAt(active.birth_date, today) : null;
  const gender = active?.gender ?? null;

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const d of definitions)
      if (!seen.includes(d.category)) seen.push(d.category);
    return seen;
  }, [definitions]);

  // 선택 구성원의 항목 코드별 이력 (최신순)
  const historyByCode = useMemo(() => {
    const map = new Map<string, ItemHistory[]>();
    if (!active) return map;
    for (const r of records) {
      if (r.member_id !== active.id) continue;
      for (const it of r.checkup_items) {
        if (!it.item_code) continue;
        const arr = map.get(it.item_code) ?? [];
        arr.push({
          record_id: r.id,
          date: r.record_date,
          value: it.value,
          unit: it.unit,
          is_abnormal: it.is_abnormal,
        });
        map.set(it.item_code, arr);
      }
    }
    map.forEach((arr) =>
      arr.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    );
    return map;
  }, [records, active]);

  const list = useMemo(() => {
    const q = query.trim();
    if (q) return definitions.filter((d) => d.item_name.includes(q));
    if (cat) return definitions.filter((d) => d.category === cat);
    return definitions;
  }, [definitions, query, cat]);

  // 상세 화면
  if (openCode) {
    const def = definitions.find((d) => d.item_code === openCode);
    if (def && active) {
      return (
        <GuideDetail
          def={def}
          member={active}
          age={age}
          history={historyByCode.get(openCode) ?? []}
          onBack={closeDetail}
        />
      );
    }
  }

  return (
    <main className="min-h-screen pb-10">
      {/* 헤더 */}
      <header className="px-5 pt-7 pb-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-section touch-manipulation"
          aria-label="뒤로"
        >
          <ChevronLeft size={24} className="text-ink" />
        </button>
        <div>
          <h1 className="text-xl font-bold leading-tight">검진 항목 사전</h1>
          <p className="text-sm text-sub mt-0.5">
            항목 설명·권장 주기·내 기록을 한눈에
          </p>
        </div>
      </header>

      {/* 구성원 칩 */}
      {members.length > 1 && (
        <div className="px-5 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {members.map((m) => {
            const on = active?.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMemberId(m.id)}
                className="flex items-center gap-1.5 rounded-2xl shrink-0 touch-manipulation active:opacity-70"
                style={{
                  background: on ? "#EFF6FF" : "#F8F9FB",
                  padding: "8px 13px",
                }}
              >
                <span style={{ opacity: on ? 1 : 0.55 }}>{m.emoji ?? "🙂"}</span>
                <span
                  className="text-sm font-bold"
                  style={{ color: on ? "#1D4ED8" : "#8B92A0" }}
                >
                  {m.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 검색 */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-section">
          <Search size={18} className="text-sub" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="항목 이름 검색"
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      {/* 카테고리 탭 */}
      {!query.trim() && (
        <div className="px-5 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "all"}
              onClick={() => setCat(c)}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold shrink-0 touch-manipulation"
              style={{
                background: cat === c ? "#EFF6FF" : "#F8F9FB",
                color: cat === c ? "#1D4ED8" : "#8B92A0",
              }}
            >
              {c ?? "전체"}
            </button>
          ))}
        </div>
      )}

      {/* 항목 리스트 */}
      <div className="px-5 pt-1 space-y-2">
        {list.map((d) => {
          const last = historyByCode.get(d.item_code)?.[0]?.date ?? null;
          const badge = statusBadge(
            getStatus(d.item_code, last, age, gender, today)
          );
          return (
            <button
              key={d.item_code}
              onClick={() => openDetail(d.item_code)}
              className="w-full text-left p-4 rounded-2xl bg-section flex items-center justify-between gap-3 touch-manipulation active:opacity-70"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{d.item_name}</p>
                {d.description && (
                  <p className="text-xs text-sub mt-0.5 truncate">
                    {d.description}
                  </p>
                )}
              </div>
              {badge && (
                <span
                  className="text-[11px] font-bold px-2 py-1 rounded-md shrink-0"
                  style={{ background: badge.bg, color: badge.fg }}
                >
                  {badge.label}
                </span>
              )}
            </button>
          );
        })}
        {list.length === 0 && (
          <p className="text-sm text-sub text-center pt-10">
            검색 결과가 없어요.
          </p>
        )}
      </div>
    </main>
  );
}
