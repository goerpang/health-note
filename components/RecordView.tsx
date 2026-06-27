"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import RecordForm from "@/components/RecordForm";
import { classifyValue } from "@/lib/itemRanges";
import type { Member, ItemDefinition, RecordWithItems } from "@/lib/types";

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

const CUSTOM_SORT = 9_999_999; // 직접입력 항목은 표준항목 뒤 (RecordForm과 동일 기준)

export default function RecordView({
  record,
  members,
  definitions,
}: {
  record: RecordWithItems;
  members: Member[];
  definitions: ItemDefinition[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  // 편집 진입 시 history 엔트리 추가 → 기기 뒤로가기로 조회 화면 복귀
  // (편집 안에서 항목 모달이 열려 있으면 모달 레이어만 먼저 닫히도록 마커 확인)
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (!(e.state && e.state.recordEdit)) setEditing(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function openEdit() {
    window.history.pushState({ recordEdit: true }, "");
    setEditing(true);
  }
  function closeEdit() {
    window.history.back();
  }

  const member = members.find((m) => m.id === record.member_id);
  const memberGender = member?.gender ?? null;

  // 편집화면과 동일하게 기본 순서(sort_order)로 정렬 — 직접입력은 맨 뒤
  const sortedItems = useMemo(() => {
    const order = new Map<string, number>();
    for (const d of definitions) order.set(d.item_code, d.sort_order);
    const so = (code: string | null) =>
      code ? order.get(code) ?? CUSTOM_SORT : CUSTOM_SORT;
    return [...(record.checkup_items ?? [])].sort(
      (a, b) => so(a.item_code) - so(b.item_code)
    );
  }, [record.checkup_items, definitions]);

  async function handleDelete() {
    if (!confirm("이 검진 기록을 삭제할까요? 입력한 항목도 함께 삭제됩니다.")) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("checkup_records")
      .delete()
      .eq("id", record.id);
    if (error) {
      alert("삭제에 실패했어요: " + error.message);
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (editing) {
    return (
      <RecordForm
        mode="edit"
        record={record}
        members={members}
        definitions={definitions}
        onCancelEdit={closeEdit}
      />
    );
  }

  return (
    <main className="min-h-screen pb-10">
      {/* 헤더 */}
      <header className="px-5 pt-7 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-section touch-manipulation"
            aria-label="뒤로"
          >
            <ChevronLeft size={24} className="text-ink" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight">검진 기록</h1>
            {member && (
              <p className="text-sm text-sub mt-0.5">
                {member.emoji ?? "🙂"} {member.name}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={openEdit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-section text-ink font-semibold text-sm touch-manipulation active:opacity-70"
        >
          <Pencil size={15} />
          편집
        </button>
      </header>

      <div className="px-5 space-y-5">
        {/* 기본 정보 카드 */}
        <div className="rounded-3xl bg-section p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-md"
              style={{
                background: record.type === "checkup" ? "#EFF6FF" : "#F3E8FF",
                color: record.type === "checkup" ? "#1D4ED8" : "#7C3AED",
              }}
            >
              {record.type === "checkup" ? "건강검진" : "단일검사"}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex gap-3">
              <span className="text-sm text-sub w-14 shrink-0">날짜</span>
              <span className="text-sm font-semibold text-ink">
                {formatDate(record.record_date)}
              </span>
            </div>
            <div className="flex gap-3">
              <span className="text-sm text-sub w-14 shrink-0">병원</span>
              <span className="text-sm font-semibold text-ink">
                {record.hospital || "-"}
              </span>
            </div>
            {record.notes && (
              <div className="flex gap-3">
                <span className="text-sm text-sub w-14 shrink-0">메모</span>
                <span className="text-sm text-ink whitespace-pre-wrap">
                  {record.notes}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 항목 목록 */}
        <div>
          <p className="text-sm font-semibold text-sub mb-2">
            검사 항목 ({record.checkup_items?.length ?? 0})
          </p>
          <div className="space-y-2">
            {sortedItems.map((it) => {
              const verdict = classifyValue(it.item_code, it.value ?? "", memberGender);
              const abn = verdict ? verdict === "abnormal" : it.is_abnormal;
              const hasVerdict = !!verdict || it.item_code !== null;
              return (
                <div key={it.id} className="rounded-2xl bg-section p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-ink">{it.item_name}</p>
                    {hasVerdict && (
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0"
                        style={{
                          background: abn ? "#FEE2E2" : "#DCFCE7",
                          color: abn ? "#DC2626" : "#16A34A",
                        }}
                      >
                        {abn ? "이상" : "정상"}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-ink mt-1">
                    {it.value}
                    {it.unit && (
                      <span className="text-base font-normal text-sub ml-1">
                        {it.unit}
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 삭제 버튼 */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="w-full py-3 rounded-2xl text-bad font-semibold flex items-center justify-center gap-1.5 active:bg-section disabled:opacity-50 touch-manipulation"
        >
          <Trash2 size={16} />
          {busy ? "삭제 중…" : "기록 삭제"}
        </button>
      </div>
    </main>
  );
}
