"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function FamilyNameEditor({
  familyId,
  initialName,
}: {
  familyId: string;
  initialName: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [savedName, setSavedName] = useState(initialName);
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);

  async function save() {
    if (saving.current) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("가족 이름을 입력해주세요");
      return;
    }
    saving.current = true;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("families")
      .update({ name: trimmed })
      .eq("id", familyId);
    setBusy(false);
    saving.current = false;
    if (error) {
      setError(error.message);
      return;
    }
    setSavedName(trimmed);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="rounded-2xl bg-section p-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold truncate">{savedName}</p>
        <button
          onClick={() => {
            setName(savedName);
            setError(null);
            setEditing(true);
          }}
          className="text-sm font-medium text-brand flex items-center gap-1 shrink-0 touch-manipulation active:opacity-70"
        >
          <Pencil size={14} /> 이름 변경
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-section p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        placeholder="가족 이름"
        className="w-full px-4 min-h-[52px] rounded-xl bg-white text-ink text-base outline-none focus:ring-2 focus:ring-brand"
      />
      {error && <p className="text-sm text-bad mt-2">{error}</p>}
      <div className="flex gap-2 mt-3">
        <button
          onClick={save}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl bg-brand text-white font-bold disabled:opacity-50 flex items-center justify-center gap-1 touch-manipulation"
        >
          <Check size={16} /> {busy ? "저장 중…" : "저장"}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
          disabled={busy}
          className="px-5 py-2.5 rounded-xl bg-white text-sub font-semibold disabled:opacity-50 touch-manipulation"
        >
          취소
        </button>
      </div>
    </div>
  );
}
