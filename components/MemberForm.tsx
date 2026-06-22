"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Member, Gender } from "@/lib/types";

const EMOJIS = [
  "👨🏻", "👩🏻", "👦🏻", "👧🏻", "👶🏻", "🧑🏻",
  "👴🏻", "👵🏻", "🧒🏻", "🧔🏻", "👱🏻", "👲🏻",
];

// 로컬 기준 오늘 (YYYY-MM-DD)
function todayStr() {
  return new Date().toLocaleDateString("sv-SE");
}

export default function MemberForm({
  mode,
  familyId,
  member,
}: {
  mode: "create" | "edit";
  familyId: string;
  member?: Member;
}) {
  const router = useRouter();
  const [name, setName] = useState(member?.name ?? "");
  const [emoji, setEmoji] = useState(member?.emoji ?? "👨🏻");
  const [gender, setGender] = useState<Gender | null>(member?.gender ?? null);
  const [birthDate, setBirthDate] = useState(member?.birth_date ?? "");
  // 어떤 작업이 진행 중인지 (둘 다 버튼 비활성화 + 해당 버튼에 로딩 표시)
  const [busy, setBusy] = useState<null | "save" | "delete">(null);
  const [error, setError] = useState<string | null>(null);
  // 빠른 연타로 인한 중복 제출 방지 (state보다 먼저, 동기적으로 막음)
  const submitting = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return; // 이미 처리 중이면 무시

    if (!name.trim()) {
      setError("이름을 입력해주세요");
      return;
    }
    if (!birthDate) {
      setError("생년월일을 입력해주세요");
      return;
    }
    if (birthDate > todayStr()) {
      setError("생년월일은 미래일 수 없어요");
      return;
    }

    submitting.current = true;
    setBusy("save");
    setError(null);
    const supabase = createClient();

    const payload = {
      name: name.trim(),
      emoji,
      gender,
      birth_date: birthDate,
    };

    const { error } =
      mode === "create"
        ? await supabase.from("members").insert({ ...payload, family_id: familyId })
        : await supabase.from("members").update(payload).eq("id", member!.id);

    if (error) {
      setError(error.message);
      setBusy(null);
      submitting.current = false; // 실패 시 재시도 가능하게 해제
      return;
    }
    // 성공 시엔 화면을 떠나므로 해제 불필요
    router.push("/");
    router.refresh();
  }

  async function handleDelete() {
    if (!member) return;
    if (submitting.current) return;
    if (!confirm(`${member.name}님의 정보를 삭제할까요? 검진 기록도 함께 삭제됩니다.`)) {
      return;
    }
    submitting.current = true;
    setBusy("delete");
    const supabase = createClient();
    const { error } = await supabase.from("members").delete().eq("id", member.id);
    if (error) {
      setError(error.message);
      setBusy(null);
      submitting.current = false;
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen pb-10">
      {/* 헤더 */}
      <header className="px-5 pt-7 pb-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-section"
          aria-label="뒤로"
        >
          <ChevronLeft size={24} className="text-ink" />
        </button>
        <h1 className="text-xl font-bold">
          {mode === "create" ? "구성원 추가" : "구성원 정보"}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="px-5 space-y-6">
        {/* 이모지 미리보기 */}
        <div className="flex justify-center pt-2">
          <div className="w-20 h-20 rounded-3xl bg-brand-soft flex items-center justify-center text-5xl">
            {emoji}
          </div>
        </div>

        {/* 이모지 선택 */}
        <div>
          <label className="text-sm font-semibold text-sub">프로필</label>
          <div className="grid grid-cols-6 gap-2 mt-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className="aspect-square rounded-2xl flex items-center justify-center text-2xl transition"
                style={{
                  background: emoji === e ? "#EFF6FF" : "#F8F9FB",
                  transform: emoji === e ? "scale(1.05)" : "scale(1)",
                  outline: emoji === e ? "2px solid #3B82F6" : "none",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* 이름 */}
        <div>
          <label className="text-sm font-semibold text-sub">이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 아빠, 엄마, 예린"
            className="w-full mt-2 px-4 py-3.5 rounded-2xl bg-section text-ink placeholder:text-sub outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {/* 성별 */}
        <div>
          <label className="text-sm font-semibold text-sub">성별 (선택)</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {([["M", "남성"], ["F", "여성"]] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setGender(gender === val ? null : val)}
                className="py-3 rounded-2xl font-bold transition"
                style={{
                  background: gender === val ? "#EFF6FF" : "#F8F9FB",
                  color: gender === val ? "#1D4ED8" : "#8B92A0",
                  outline: gender === val ? "2px solid #3B82F6" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 생년월일 (필수) */}
        <div>
          <label className="text-sm font-semibold text-sub">생년월일</label>
          <input
            type="date"
            value={birthDate ?? ""}
            max={todayStr()}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full mt-2 px-4 min-h-[56px] rounded-2xl bg-section text-ink text-base outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {error && <p className="text-sm text-bad">{error}</p>}

        {/* 저장 */}
        <button
          type="submit"
          disabled={busy !== null}
          className="w-full py-3.5 rounded-2xl bg-brand text-white font-bold disabled:opacity-50 touch-manipulation"
        >
          {busy === "save"
            ? "저장 중…"
            : mode === "create"
            ? "추가하기"
            : "저장"}
        </button>

        {/* 삭제 (수정 모드만) */}
        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy !== null}
            className="w-full py-3 rounded-2xl text-bad font-semibold flex items-center justify-center gap-1.5 active:bg-section disabled:opacity-50 touch-manipulation"
          >
            <Trash2 size={16} /> {busy === "delete" ? "삭제 중…" : "구성원 삭제"}
          </button>
        )}
      </form>
    </main>
  );
}
