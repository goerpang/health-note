import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HomeView, { type RecordWithItems } from "@/components/HomeView";
import type { Member } from "@/lib/types";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 내 가족 확인 — 없으면 온보딩으로
  const { data: link } = await supabase
    .from("user_families")
    .select("family_id")
    .limit(1)
    .maybeSingle();
  if (!link) redirect("/onboarding");

  // 가족 이름
  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("id", link.family_id)
    .maybeSingle();

  // 가족 구성원 목록 (RLS가 내 가족만 허용)
  const { data: members } = await supabase
    .from("members")
    .select("*")
    .eq("family_id", link.family_id)
    .order("created_at", { ascending: true });

  const memberList = (members as Member[]) ?? [];

  // 검진 기록 + 항목 (최신순). 데이터가 적어 가족 전체를 한 번에 불러와 클라에서 구성원별 필터.
  let records: RecordWithItems[] = [];
  if (memberList.length > 0) {
    const { data } = await supabase
      .from("checkup_records")
      .select("*, checkup_items(*)")
      .in(
        "member_id",
        memberList.map((m) => m.id)
      )
      .order("record_date", { ascending: false })
      .order("created_at", { ascending: false });
    records = (data as RecordWithItems[]) ?? [];
  }

  return (
    <HomeView
      familyName={family?.name ?? "우리 가족"}
      members={memberList}
      records={records}
    />
  );
}
