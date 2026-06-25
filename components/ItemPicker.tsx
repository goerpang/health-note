"use client";

import { useMemo, useState } from "react";
import { X, Search, Plus, Check } from "lucide-react";
import type { ItemDefinition } from "@/lib/types";

export default function ItemPicker({
  definitions,
  existingCodes,
  multi,
  onPick,
  onPickMany,
  onPickCustom,
  onClose,
}: {
  definitions: ItemDefinition[];
  existingCodes: Set<string>;
  multi: boolean; // true면 여러 개 선택 후 한 번에 추가 (건강검진)
  onPick: (def: ItemDefinition) => void;
  onPickMany: (defs: ItemDefinition[]) => void;
  onPickCustom: (name: string, unit: string) => void;
  onClose: () => void;
}) {
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const d of definitions) if (!seen.includes(d.category)) seen.push(d.category);
    return seen;
  }, [definitions]);

  const [cat, setCat] = useState(categories[0] ?? "");
  const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const list = useMemo(() => {
    const q = query.trim();
    if (q) return definitions.filter((d) => d.item_name.includes(q));
    return definitions.filter((d) => d.category === cat);
  }, [definitions, cat, query]);

  function toggle(code: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });
  }

  function confirmMany() {
    const defs = definitions.filter((d) => selected.has(d.item_code));
    if (defs.length) onPickMany(defs);
  }

  function onItemClick(d: ItemDefinition) {
    if (multi) toggle(d.item_code);
    else onPick(d); // 단일검사: 바로 선택
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-app mx-auto">
      {/* 헤더 */}
      <header className="px-5 pt-6 pb-3 flex items-center justify-between border-b border-line">
        <h2 className="text-lg font-bold">
          {customMode ? "직접 입력" : "항목 선택"}
        </h2>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center active:bg-section touch-manipulation"
          aria-label="닫기"
        >
          <X size={22} className="text-sub" />
        </button>
      </header>

      {customMode ? (
        /* 직접입력 모드 */
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-sub">항목 이름</label>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              autoFocus
              placeholder="예: 갑상선자극호르몬"
              className="w-full mt-2 px-4 min-h-[52px] rounded-2xl bg-section text-ink text-base outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-sub">단위 (선택)</label>
            <input
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="예: mIU/L"
              className="w-full mt-2 px-4 min-h-[52px] rounded-2xl bg-section text-ink text-base outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
      ) : (
        <>
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
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className="px-3.5 py-2 rounded-xl text-sm font-semibold shrink-0 touch-manipulation"
                  style={{
                    background: cat === c ? "#EFF6FF" : "#F8F9FB",
                    color: cat === c ? "#1D4ED8" : "#8B92A0",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* 항목 리스트 */}
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <div className="space-y-2 pt-1">
              {list.map((d) => {
                const added = existingCodes.has(d.item_code);
                const on = selected.has(d.item_code);
                return (
                  <button
                    key={d.item_code}
                    disabled={added}
                    onClick={() => onItemClick(d)}
                    className="w-full text-left p-3.5 rounded-2xl flex items-center justify-between disabled:opacity-40 touch-manipulation active:opacity-70"
                    style={{
                      background: on ? "#EFF6FF" : "#F8F9FB",
                      outline: on ? "2px solid #3B82F6" : "none",
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{d.item_name}</p>
                      {(d.normal_range || d.unit) && (
                        <p className="text-xs text-sub mt-0.5 truncate">
                          {[d.normal_range, d.unit].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    {added ? (
                      <span className="text-xs text-sub shrink-0">추가됨</span>
                    ) : multi ? (
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: on ? "#3B82F6" : "#E5E9F0",
                          color: "#fff",
                        }}
                      >
                        {on && <Check size={15} />}
                      </span>
                    ) : (
                      <Plus size={18} className="text-brand shrink-0" />
                    )}
                  </button>
                );
              })}
              {list.length === 0 && (
                <p className="text-sm text-sub text-center pt-10">
                  검색 결과가 없어요. 아래에서 직접 입력해보세요.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* 하단 액션 */}
      <div className="px-5 py-3 border-t border-line space-y-2">
        {customMode ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!customName.trim()) return;
                onPickCustom(customName.trim(), customUnit.trim());
              }}
              disabled={!customName.trim()}
              className="flex-1 py-3 rounded-2xl bg-brand text-white font-bold disabled:opacity-50 touch-manipulation"
            >
              추가
            </button>
            <button
              onClick={() => setCustomMode(false)}
              className="px-5 py-3 rounded-2xl bg-section text-sub font-semibold touch-manipulation"
            >
              취소
            </button>
          </div>
        ) : (
          <>
            {multi && (
              <button
                onClick={confirmMany}
                disabled={selected.size === 0}
                className="w-full py-3 rounded-2xl bg-brand text-white font-bold disabled:opacity-50 touch-manipulation"
              >
                {selected.size > 0 ? `${selected.size}개 추가` : "항목을 선택하세요"}
              </button>
            )}
            <button
              onClick={() => setCustomMode(true)}
              className="w-full py-3 rounded-2xl bg-section font-semibold text-sm flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <Plus size={16} /> 목록에 없어요 (직접 입력)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
