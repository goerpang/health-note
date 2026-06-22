"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, X, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ItemPicker from "@/components/ItemPicker";
import type { Member, ItemDefinition } from "@/lib/types";

type FormItem = {
  key: number;
  item_code: string | null;
  item_name: string;
  value: string;
  unit: string;
  is_abnormal: boolean;
  normal_range?: string | null;
};

// 로컬 기준 오늘 날짜 (YYYY-MM-DD)
function todayStr() {
  return new Date().toLocaleDateString("sv-SE");
}

export default function RecordForm({
  members,
  definitions,
  initialMemberId,
}: {
  members: Member[];
  definitions: ItemDefinition[];
  initialMemberId?: string;
}) {
  const router = useRouter();
  const [type, setType] = useState<"checkup" | "single">("checkup");
  const [memberId, setMemberId] = useState(
    members.find((m) => m.id === initialMemberId)?.id ?? members[0]?.id ?? ""
  );
  const [recordDate, setRecordDate] = useState(todayStr());
  const [hospital, setHospital] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<FormItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const keyRef = useRef(1);

  function changeType(t: "checkup" | "single") {
    setType(t);
    // 단일검사는 항목 1개만 — 초과분 정리
    if (t === "single") setItems((prev) => prev.slice(0, 1));
  }

  function addStandard(def: ItemDefinition) {
    const it: FormItem = {
      key: keyRef.current++,
      item_code: def.item_code,
      item_name: def.item_name,
      value: "",
      unit: def.unit ?? "",
      is_abnormal: false,
      normal_range: def.normal_range,
    };
    setItems((prev) => (type === "single" ? [it] : [...prev, it]));
    setPickerOpen(false);
  }

  function addCustom(name: string, unit: string) {
    const it: FormItem = {
      key: keyRef.current++,
      item_code: null,
      item_name: name,
      value: "",
      unit,
      is_abnormal: false,
      normal_range: null,
    };
    setItems((prev) => (type === "single" ? [it] : [...prev, it]));
    setPickerOpen(false);
  }

  function updateItem(key: number, patch: Partial<FormItem>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }
  function removeItem(key: number) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    if (!memberId) return setError("구성원을 선택해주세요");
    if (!recordDate) return setError("검진 날짜를 입력해주세요");
    if (items.length === 0) return setError("검사 항목을 1개 이상 추가해주세요");
    if (items.some((it) => !it.value.trim()))
      return setError("각 항목의 결과 값을 입력해주세요");

    submitting.current = true;
    setBusy(true);
    setError(null);
    const supabase = createClient();

    // 1) 기록 생성
    const { data: record, error: recErr } = await supabase
      .from("checkup_records")
      .insert({
        member_id: memberId,
        type,
        record_date: recordDate,
        hospital: hospital.trim() || null,
        notes: notes.trim() || null,
      })
      .select("id")
      .single();

    if (recErr || !record) {
      setError(recErr?.message ?? "저장에 실패했어요");
      setBusy(false);
      submitting.current = false;
      return;
    }

    // 2) 항목 저장
    const { error: itemErr } = await supabase.from("checkup_items").insert(
      items.map((it) => ({
        record_id: record.id,
        item_code: it.item_code,
        item_name: it.item_name,
        value: it.value.trim(),
        unit: it.unit.trim() || null,
        is_abnormal: it.is_abnormal,
      }))
    );

    if (itemErr) {
      // 항목 저장 실패 시 방금 만든 기록 롤백 (고아 기록 방지)
      await supabase.from("checkup_records").delete().eq("id", record.id);
      setError(itemErr.message);
      setBusy(false);
      submitting.current = false;
      return;
    }

    router.push("/");
    router.refresh();
  }

  const canAddMore = type === "checkup" || items.length === 0;

  return (
    <main className="min-h-screen pb-10">
      {/* 헤더 */}
      <header className="px-5 pt-7 pb-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-section touch-manipulation"
          aria-label="뒤로"
        >
          <ChevronLeft size={24} className="text-ink" />
        </button>
        <h1 className="text-xl font-bold">검진 기록 추가</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-5 space-y-6">
        {/* 유형 */}
        <div>
          <label className="text-sm font-semibold text-sub">유형</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {([["checkup", "건강검진"], ["single", "단일검사"]] as const).map(
              ([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => changeType(val)}
                  className="py-3 rounded-2xl font-bold transition touch-manipulation"
                  style={{
                    background: type === val ? "#EFF6FF" : "#F8F9FB",
                    color: type === val ? "#1D4ED8" : "#8B92A0",
                    outline: type === val ? "2px solid #3B82F6" : "none",
                  }}
                >
                  {label}
                </button>
              )
            )}
          </div>
          <p className="text-xs text-sub mt-1.5">
            {type === "checkup"
              ? "여러 항목을 한 번에 기록해요."
              : "항목 하나만 빠르게 기록해요."}
          </p>
        </div>

        {/* 구성원 */}
        <div>
          <label className="text-sm font-semibold text-sub">구성원</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-2 pb-1">
            {members.map((m) => {
              const on = m.id === memberId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMemberId(m.id)}
                  className="flex items-center gap-2 rounded-2xl shrink-0 touch-manipulation"
                  style={{
                    background: on ? "#EFF6FF" : "#F8F9FB",
                    padding: "11px 16px",
                    transform: on ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <span className="text-lg" style={{ opacity: on ? 1 : 0.55 }}>
                    {m.emoji ?? "🙂"}
                  </span>
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
        </div>

        {/* 날짜 */}
        <div>
          <label className="text-sm font-semibold text-sub">검진 날짜</label>
          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            className="w-full mt-2 px-4 min-h-[56px] rounded-2xl bg-section text-ink text-base outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {/* 병원 */}
        <div>
          <label className="text-sm font-semibold text-sub">병원 (선택)</label>
          <input
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            placeholder="예: 서울대병원 건강검진센터"
            className="w-full mt-2 px-4 py-3.5 rounded-2xl bg-section text-ink placeholder:text-sub outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {/* 항목 */}
        <div>
          <label className="text-sm font-semibold text-sub">
            검사 항목 {items.length > 0 && `(${items.length})`}
          </label>
          <div className="space-y-2 mt-2">
            {items.map((it) => (
              <div key={it.key} className="rounded-2xl bg-section p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{it.item_name}</p>
                    {it.normal_range && (
                      <p className="text-xs text-sub mt-0.5">
                        정상범위 {it.normal_range}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(it.key)}
                    className="text-sub p-1 -mr-1 -mt-1 touch-manipulation"
                    aria-label="항목 제거"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    value={it.value}
                    onChange={(e) => updateItem(it.key, { value: e.target.value })}
                    placeholder="결과 값"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-white text-ink outline-none focus:ring-2 focus:ring-brand text-sm"
                  />
                  <input
                    value={it.unit}
                    onChange={(e) => updateItem(it.key, { unit: e.target.value })}
                    placeholder="단위"
                    className="w-20 px-3 py-2.5 rounded-xl bg-white text-ink outline-none focus:ring-2 focus:ring-brand text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => updateItem(it.key, { is_abnormal: !it.is_abnormal })}
                  className="mt-2 text-[11px] font-bold px-2.5 py-1 rounded-md touch-manipulation"
                  style={{
                    background: it.is_abnormal ? "#FEE2E2" : "#DCFCE7",
                    color: it.is_abnormal ? "#DC2626" : "#16A34A",
                  }}
                >
                  {it.is_abnormal ? "이상" : "정상"} · 눌러서 변경
                </button>
              </div>
            ))}

            {canAddMore && (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full py-3.5 rounded-2xl border-2 border-dashed border-line text-sub font-semibold flex items-center justify-center gap-1.5 touch-manipulation active:bg-section"
              >
                <Plus size={18} />
                {type === "single" ? "검사 항목 선택" : "항목 추가"}
              </button>
            )}
          </div>
        </div>

        {/* 메모 */}
        <div>
          <label className="text-sm font-semibold text-sub">메모 (선택)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="특이사항, 의사 소견 등"
            className="w-full mt-2 px-4 py-3.5 rounded-2xl bg-section text-ink placeholder:text-sub outline-none focus:ring-2 focus:ring-brand resize-none"
          />
        </div>

        {error && <p className="text-sm text-bad">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3.5 rounded-2xl bg-brand text-white font-bold disabled:opacity-50 touch-manipulation"
        >
          {busy ? "저장 중…" : "기록 저장"}
        </button>
      </form>

      {pickerOpen && (
        <ItemPicker
          definitions={definitions}
          existingCodes={
            new Set(
              items.map((i) => i.item_code).filter((c): c is string => !!c)
            )
          }
          onPick={addStandard}
          onPickCustom={addCustom}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </main>
  );
}
