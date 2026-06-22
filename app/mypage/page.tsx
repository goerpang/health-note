import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, User, Mail, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import FamilyNameEditor from "@/components/FamilyNameEditor";
import type { Member } from "@/lib/types";

function fmtDate(d: string) {
  return d.replaceAll("-", ".");
}
function genderLabel(g: string | null) {
  return g === "M" ? "남성" : g === "F" ? "여성" : "";
}

export default async function MyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 우리 가족 정보 + 구성원
  const { data: link } = await supabase
    .from("user_families")
    .select("family_id")
    .limit(1)
    .maybeSingle();

  let family: { id: string; name: string } | null = null;
  let members: Member[] = [];
  if (link) {
    const [famRes, memRes] = await Promise.all([
      supabase
        .from("families")
        .select("id, name")
        .eq("id", link.family_id)
        .maybeSingle(),
      supabase
        .from("members")
        .select("*")
        .eq("family_id", link.family_id)
        .order("created_at", { ascending: true }),
    ]);
    family = famRes.data;
    members = (memRes.data as Member[]) ?? [];
  }

  return (
    <main className="min-h-screen pb-10">
      {/* 헤더 */}
      <header className="px-5 pt-7 pb-4 flex items-center gap-3">
        <Link
          href="/"
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-section touch-manipulation"
          aria-label="뒤로"
        >
          <ChevronLeft size={24} className="text-ink" />
        </Link>
        <h1 className="text-xl font-bold">마이페이지</h1>
      </header>

      {/* 프로필 아이콘 */}
      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 rounded-3xl bg-brand-soft flex items-center justify-center">
          <User size={40} className="text-brand" />
        </div>
      </div>

      {/* 우리 가족 */}
      {family && (
        <div className="px-5 mb-6">
          <p className="text-sm font-semibold text-sub mb-2">우리 가족</p>
          <FamilyNameEditor familyId={family.id} initialName={family.name} />
        </div>
      )}

      {/* 가족 구성원 */}
      <div className="px-5 mb-6">
        <p className="text-sm font-semibold text-sub mb-2">가족 구성원</p>
        <div className="rounded-2xl bg-section overflow-hidden divide-y divide-line">
          {members.map((m) => {
            const sub = [genderLabel(m.gender), m.birth_date && fmtDate(m.birth_date)]
              .filter(Boolean)
              .join(" · ");
            return (
              <Link
                key={m.id}
                href={`/members/${m.id}`}
                prefetch
                className="flex items-center gap-3 p-4 active:opacity-70 touch-manipulation"
              >
                <span className="text-2xl">{m.emoji ?? "🙂"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{m.name}</p>
                  {sub && <p className="text-xs text-sub mt-0.5">{sub}</p>}
                </div>
                <ChevronRight size={18} className="text-sub shrink-0" />
              </Link>
            );
          })}
          <Link
            href="/members/new"
            prefetch
            className="flex items-center gap-3 p-4 active:opacity-70 touch-manipulation"
          >
            <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
              <Plus size={18} className="text-brand" />
            </span>
            <span className="text-sm font-semibold text-brand">구성원 추가</span>
          </Link>
        </div>
      </div>

      {/* 내 정보 */}
      <div className="px-5">
        <p className="text-sm font-semibold text-sub mb-2">내 정보</p>
        <div className="rounded-2xl bg-section p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
            <Mail size={18} className="text-sub" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-sub">이메일</p>
            <p className="text-sm font-semibold truncate">{user.email}</p>
          </div>
        </div>

        {/* 로그아웃 */}
        <div className="mt-8">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
