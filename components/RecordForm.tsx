"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, X, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ItemPicker from "@/components/ItemPicker";
import { classifyValue, allowsNonPositive } from "@/lib/itemRanges";
import type { Member, ItemDefinition, RecordWithItems } from "@/lib/types";

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

// 단위가 있는 항목은 숫자 값으로 간주 (예: mg/dL, mmHg, T-score)
function isNumericUnit(unit: string) {
  return unit.trim() !== "";
}
const NUM_PARTIAL = /^-?\d*\.?\d*$/; // 입력 도중 허용 (예: "-", "12.")
const NUM_FULL = /^-?\d+(\.\d+)?$/; // 제출 시 완전한 숫자

export default function RecordForm({
  members,
  definitions,
  initialMemberId,
  defaultHospital,
  mode = "create",
  record,
}: {
  members: Member[];
  definitions: ItemDefinition[];
  initialMemberId?: string;
  defaultHospital?: string;
  mode?: "create" | "edit";
  record?: RecordWithItems;
}) {
  const router = useRouter();
  const keyRef = useRef(1);

  // 표준항목 코드 → 정상범위 (수정 시 표시용)
  const rangeByCode = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const d of definitions) m.set(d.item_code, d.normal_range);
    return m;
  }, [definitions]);

  const [type, setType] = useState<"checkup" | "single">(record?.type ?? "checkup");
  const [memberId, setMemberId] = useState(
    record?.member_id ??
      members.find((m) => m.id === initialMemberId)?.id ??
      members[0]?.id ??
      ""
  );
  const [recordDate, setRecordDate] = useState(record?.record_date ?? todayStr());
  const [hospital, setHospital] = useState(
    record?.hospital ?? defaultHospital ?? ""
  );
  const [notes, setNotes] = useState(record?.notes ?? "");
  const [items, setItems] = useState<FormItem[]>(() =>
    (record?.checkup_items ?? []).map((it) => ({
      key: keyRef.current++,
      item_code: it.item_code,
      item_name: it.item_name,
      value: it.value ?? "",
      unit: it.unit ?? "",
      is_abnormal: it.is_abnormal,
      normal_range: it.item_code ? rangeByCode.get(it.item_code) ?? null : null,
    }))
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "delete">(null);
  const [error, setError] = useState<string | null>(null);
  const [invalidKeys, setInvalidKeys] = useState<Set<number>>(new Set());
  const submitting = useRef(false);
  const valueRefs = useRef(new Map<number, HTMLInputElement | null>());

  const memberGender = members.find((m) => m.id === memberId)?.gender ?? null;

  // 값 입력 처리: 숫자 항목은 숫자만 허용 + 표준범위로 정상/이상 자동 판정
  function onValueChange(it: FormItem, v: string) {
    if (isNumericUnit(it.unit) && v !== "" && !NUM_PARTIAL.test(v)) return;
    const patch: Partial<FormItem> = { value: v };
    const verdict = classifyValue(it.item_code, v, memberGender);
    if (verdict) patch.is_abnormal = verdict === "abnormal";
    updateItem(it.key, patch);
    // 값을 채우면 빨간 표시 해제
    if (v.trim() && invalidKeys.has(it.key)) {
      setInvalidKeys((prev) => {
        const n = new Set(prev);
        n.delete(it.key);
        return n;
      });
    }
  }

  function changeType(t: "checkup" | "single") {
    setType(t);
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
    if (recordDate > todayStr()) return setError("미래 날짜는 선택할 수 없어요");
    if (!hospital.trim()) return setError("병원을 입력해주세요");
    if (items.length === 0) return setError("검사 항목을 1개 이상 추가해주세요");

    // 빈 값: 해당 칸을 빨갛게 + 첫 빈 칸으로 포커스/스크롤
    const emptyKeys = items.filter((it) => !it.value.trim()).map((it) => it.key);
    if (emptyKeys.length) {
      setInvalidKeys(new Set(emptyKeys));
      setError(null);
      const el = valueRefs.current.get(emptyKeys[0]);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      return;
    }
    setInvalidKeys(new Set());

    const badNum = items.find(
      (it) => isNumericUnit(it.unit) && !NUM_FULL.test(it.value.trim())
    );
    if (badNum)
      return setError(`'${badNum.item_name}' 항목엔 숫자만 입력할 수 있어요`);
    const zeroItem = items.find(
      (it) =>
        isNumericUnit(it.unit) &&
        parseFloat(it.value) === 0 &&
        !allowsNonPositive(it.item_code)
    );
    if (zeroItem)
      return setError(`'${zeroItem.item_name}' 항목에 0은 입력할 수 없어요`);

    submitting.current = true;
    setBusy("save");
    setError(null);
    const supabase = createClient();

    const recordFields = {
      member_id: memberId,
      type,
      record_date: recordDate,
      hospital: hospital.trim() || null,
      notes: notes.trim() || null,
    };
    const judge = (it: FormItem) => {
      const v = classifyValue(it.item_code, it.value, memberGender);
      return v ? v === "abnormal" : it.is_abnormal;
    };
    const itemRows = (recordId: string) =>
      items.map((it) => ({
        record_id: recordId,
        item_code: it.item_code,
        item_name: it.item_name,
        value: it.value.trim(),
        unit: it.unit.trim() || null,
        is_abnormal: judge(it),
      }));

    if (mode === "edit" && record) {
      // 1) 기록 필드 수정
      const { error: updErr } = await supabase
        .from("checkup_records")
        .update(recordFields)
        .eq("id", record.id);
      if (updErr) return fail(updErr.message);

      // 2) 항목 교체: 새 항목 먼저 넣고 기존 항목 삭제 (실패 시 손실 방지)
      const oldIds = (record.checkup_items ?? []).map((it) => it.id);
      const { error: insErr } = await supabase
        .from("checkup_items")
        .insert(itemRows(record.id));
      if (insErr) return fail(insErr.message);
      if (oldIds.length)
        await supabase.from("checkup_items").delete().in("id", oldIds);

      router.push("/");
      router.refresh();
      return;
    }

    // 생성
    const { data: created, error: recErr } = await supabase
      .from("checkup_records")
      .insert(recordFields)
      .select("id")
      .single();
    if (recErr || !created) return fail(recErr?.message ?? "저장에 실패했어요");

    const { error: itemErr } = await supabase
      .from("checkup_items")
      .insert(itemRows(created.id));
    if (itemErr) {
      await supabase.from("checkup_records").delete().eq("id", created.id);
      return fail(itemErr.message);
    }

    router.push("/");
    router.refresh();

    function fail(msg: string) {
      setError(msg);
      setBusy(null);
      submitting.current = false;
    }
  }

  async function handleDelete() {
    if (!record) return;
    if (submitting.current) return;
    if (!confirm("이 검진 기록을 삭제할까요? 입력한 항목도 함께 삭제됩니다.")) return;
    submitting.current = true;
    setBusy("delete");
    const supabase = createClient();
    const { error } = await supabase
      .from("checkup_records")
      .delete()
      .eq("id", record.id);
    if (error) {
      setError(error.message);
      setBusy(null);
      submitting.current = false;
      return;
    }
    router.push("/");
    router.refresh();
  }

  const canAddMore = type === "checkup" || items.length === 0;
  const isEdit = mode === "edit";

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
        <h1 className="text-xl font-bold">
          {isEdit ? "검진 기록 수정" : "검진 기록 추가"}
        </h1>
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
            max={todayStr()}
            onChange={(e) => setRecordDate(e.target.value)}
            className="w-full mt-2 px-4 min-h-[56px] rounded-2xl bg-section text-ink text-base outline-none focus:ring-2 focus:ring-brand"
          />
          {recordDate > todayStr() && (
            <p className="text-xs text-bad mt-1">미래 날짜는 선택할 수 없어요</p>
          )}
        </div>

        {/* 병원 */}
        <div>
          <label className="text-sm font-semibold text-sub">병원</label>
          <div className="relative mt-2">
            <input
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="예: 서울대병원 건강검진센터"
              className="w-full px-4 py-3.5 pr-11 rounded-2xl bg-section text-ink placeholder:text-sub outline-none focus:ring-2 focus:ring-brand"
            />
            {hospital && (
              <button
                type="button"
                onClick={() => setHospital("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white flex items-center justify-center text-sub touch-manipulation"
                aria-label="병원 지우기"
              >
                <X size={14} />
              </button>
            )}
          </div>
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
                    ref={(el) => {
                      valueRefs.current.set(it.key, el);
                    }}
                    value={it.value}
                    inputMode={isNumericUnit(it.unit) ? "decimal" : "text"}
                    onChange={(e) => onValueChange(it, e.target.value)}
                    placeholder={isNumericUnit(it.unit) ? "숫자 입력" : "결과 값"}
                    className={`flex-1 px-3 py-2.5 rounded-xl bg-white text-ink outline-none text-sm ${
                      invalidKeys.has(it.key)
                        ? "ring-2 ring-bad"
                        : "focus:ring-2 focus:ring-brand"
                    }`}
                  />
                  {it.item_code ? (
                    // 기본(표준) 항목은 단위 고정 — 수정 불가
                    <div className="w-20 px-3 py-2.5 rounded-xl bg-section text-sub text-sm flex items-center justify-center shrink-0">
                      {it.unit || "-"}
                    </div>
                  ) : (
                    <input
                      value={it.unit}
                      onChange={(e) => updateItem(it.key, { unit: e.target.value })}
                      placeholder="단위"
                      className="w-20 px-3 py-2.5 rounded-xl bg-white text-ink outline-none focus:ring-2 focus:ring-brand text-sm"
                    />
                  )}
                </div>
                {invalidKeys.has(it.key) && (
                  <p className="text-xs text-bad mt-1.5">결과 값을 입력해주세요</p>
                )}
                {(() => {
                  // 정상/이상 자동 판정 결과 표시 (참고용, 누를 수 없음)
                  const v = classifyValue(it.item_code, it.value, memberGender);
                  if (!v) return null;
                  const abn = v === "abnormal";
                  return (
                    <span
                      className="inline-block mt-2 text-[11px] font-bold px-2.5 py-1 rounded-md"
                      style={{
                        background: abn ? "#FEE2E2" : "#DCFCE7",
                        color: abn ? "#DC2626" : "#16A34A",
                      }}
                    >
                      {abn ? "이상" : "정상"}
                    </span>
                  );
                })()}
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
          disabled={busy !== null}
          className="w-full py-3.5 rounded-2xl bg-brand text-white font-bold disabled:opacity-50 touch-manipulation"
        >
          {busy === "save" ? "저장 중…" : isEdit ? "저장" : "기록 저장"}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy !== null}
            className="w-full py-3 rounded-2xl text-bad font-semibold flex items-center justify-center gap-1.5 active:bg-section disabled:opacity-50 touch-manipulation"
          >
            <Trash2 size={16} /> {busy === "delete" ? "삭제 중…" : "기록 삭제"}
          </button>
        )}
      </form>

      {pickerOpen && (
        <ItemPicker
          definitions={definitions}
          existingCodes={
            new Set(items.map((i) => i.item_code).filter((c): c is string => !!c))
          }
          onPick={addStandard}
          onPickCustom={addCustom}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </main>
  );
}
