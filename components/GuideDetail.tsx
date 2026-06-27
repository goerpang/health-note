"use client";

import Link from "next/link";
import { ChevronLeft, CalendarClock } from "lucide-react";
import { classifyValue } from "@/lib/itemRanges";
import { getRule, isTarget } from "@/lib/screeningGuide";
import type { Member, ItemDefinition } from "@/lib/types";
import type { ItemHistory } from "@/components/GuideView";

function intervalText(months: number) {
  if (months % 12 === 0) return `${months / 12}년마다`;
  return `${months}개월마다`;
}

function ageText(minAge?: number, maxAge?: number) {
  if (minAge !== undefined && maxAge !== undefined)
    return `만 ${minAge}~${maxAge}세`;
  if (minAge !== undefined) return `만 ${minAge}세 이상`;
  if (maxAge !== undefined) return `만 ${maxAge}세 이하`;
  return null;
}

export default function GuideDetail({
  def,
  member,
  age,
  history,
  onBack,
}: {
  def: ItemDefinition;
  member: Member;
  age: number | null;
  history: ItemHistory[];
  onBack: () => void;
}) {
  const rule = getRule(def.item_code);
  const target = rule ? isTarget(rule, age, member.gender) : false;

  return (
    <main className="min-h-screen pb-10">
      {/* 헤더 */}
      <header className="px-5 pt-7 pb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-section touch-manipulation"
          aria-label="뒤로"
        >
          <ChevronLeft size={24} className="text-ink" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight truncate">
            {def.item_name}
          </h1>
          <p className="text-sm text-sub mt-0.5">
            {member.emoji ?? "🙂"} {member.name}
          </p>
        </div>
      </header>

      <div className="px-5 space-y-6">
        {/* ① 이게 뭔가요 */}
        <section>
          <p className="text-sm font-semibold text-sub mb-2">이게 뭔가요</p>
          <div className="rounded-2xl bg-section p-4">
            <p className="text-sm text-ink leading-relaxed">
              {def.description ?? "설명이 준비되지 않은 항목이에요."}
            </p>
            {(def.normal_range || def.unit) && (
              <div className="flex gap-6 mt-3">
                {def.normal_range && (
                  <div>
                    <p className="text-[11px] text-sub">정상범위</p>
                    <p className="text-sm font-bold text-ok mt-0.5">
                      {def.normal_range}
                    </p>
                  </div>
                )}
                {def.unit && (
                  <div>
                    <p className="text-[11px] text-sub">단위</p>
                    <p className="text-sm font-bold text-ink mt-0.5">
                      {def.unit}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ② 권장 주기 */}
        <section>
          <p className="text-sm font-semibold text-sub mb-2">권장 주기</p>
          {rule ? (
            <div
              className="rounded-2xl p-4"
              style={{ background: target ? "#EFF6FF" : "#F8F9FB" }}
            >
              <div className="flex items-center gap-2">
                <CalendarClock
                  size={18}
                  style={{ color: target ? "#1D4ED8" : "#8B92A0" }}
                />
                <p
                  className="text-sm font-bold"
                  style={{ color: target ? "#1D4ED8" : "#8B92A0" }}
                >
                  {[ageText(rule.minAge, rule.maxAge), rule.gender === "F" ? "여성" : rule.gender === "M" ? "남성" : null]
                    .filter(Boolean)
                    .join(" · ")}{" "}
                  · {intervalText(rule.intervalMonths)}
                </p>
              </div>
              <p
                className="text-xs mt-1.5"
                style={{ color: target ? "#1D4ED8" : "#8B92A0", opacity: 0.85 }}
              >
                {rule.source}
                {rule.note ? ` · ${rule.note}` : ""}
              </p>
              {!target && (
                <p className="text-xs text-sub mt-2">
                  {member.name}님은 현재 권장 대상이 아니에요.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-section p-4">
              <p className="text-sm text-sub">
                정해진 권장 주기 정보가 없는 항목이에요. 의료진과 상담해 필요
                시 받아보세요.
              </p>
            </div>
          )}
        </section>

        {/* ③ 내 기록 */}
        <section>
          <p className="text-sm font-semibold text-sub mb-2">
            {member.name}님의 기록 {history.length > 0 && `(${history.length})`}
          </p>
          {history.length > 0 ? (
            <div className="rounded-2xl bg-section divide-y divide-line">
              {history.map((h) => {
                const verdict = classifyValue(
                  def.item_code,
                  h.value ?? "",
                  member.gender
                );
                const abn = verdict ? verdict === "abnormal" : h.is_abnormal;
                const showVerdict = !!verdict || def.item_code !== null;
                return (
                  <Link
                    key={h.record_id}
                    href={`/records/${h.record_id}`}
                    prefetch
                    className="flex items-center justify-between px-4 py-3 active:opacity-70 touch-manipulation"
                  >
                    <span className="text-sm text-sub">
                      {h.date.replaceAll("-", ".")}
                    </span>
                    <span className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-ink">
                        {h.value}
                        {h.unit && (
                          <span className="text-xs font-normal text-sub ml-0.5">
                            {h.unit}
                          </span>
                        )}
                      </span>
                      {showVerdict && (
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                          style={{
                            background: abn ? "#FEE2E2" : "#DCFCE7",
                            color: abn ? "#DC2626" : "#16A34A",
                          }}
                        >
                          {abn ? "이상" : "정상"}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-section p-6 text-center">
              <p className="text-sm text-sub">아직 받은 기록이 없어요.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
