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

  // 가족 연결 + 가족 이름을 한 번의 쿼리로
  const { data: link } = await supabase
    .from("user_families")
    .select("family_id, families(name)")
    .limit(1)
    .maybeSingle();
  if (!link) redirect("/onboarding");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const familyName = (link as any).families?.name ?? "우리 가족";

  // 구성원 + 각 구성원의 기록 + 항목을 한 번의 쿼리로 (네트워크 왕복 최소화)
  const { data: membersData } = await supabase
    .from("members")
    .select("*, checkup_records(*, checkup_items(*))")
    .eq("family_id", link.family_id)
    .order("created_at", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawMembers = (membersData as any[]) ?? [];

  // 구성원 객체에서 기록은 분리 (Member 타입 유지)
  const members: Member[] = rawMembers.map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ checkup_records, ...m }) => m as Member
  );

  // 기록을 평탄화 + 최신순 정렬
  const records: RecordWithItems[] = rawMembers
    .flatMap((m) => (m.checkup_records ?? []) as RecordWithItems[])
    .sort((a, b) =>
      a.record_date < b.record_date ? 1 : a.record_date > b.record_date ? -1 : 0
    );

  return (
    <HomeView familyName={familyName} members={members} records={records} />
  );
}
