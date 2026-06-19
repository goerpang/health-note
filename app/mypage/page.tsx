import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, User, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import FamilyNameEditor from "@/components/FamilyNameEditor";

export default async function MyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 우리 가족 정보
  const { data: link } = await supabase
    .from("user_families")
    .select("family_id")
    .limit(1)
    .maybeSingle();
  const { data: family } = link
    ? await supabase
        .from("families")
        .select("id, name")
        .eq("id", link.family_id)
        .maybeSingle()
    : { data: null };

  return (
    <main className="min-h-screen pb-10">
      {/* 헤더 */}
      <header className="px-5 pt-7 pb-4 flex items-center gap-3">
        <Link
          href="/"
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-section"
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
