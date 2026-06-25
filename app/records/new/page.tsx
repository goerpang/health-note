import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RecordForm from "@/components/RecordForm";
import type { Member, ItemDefinition } from "@/lib/types";

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: { member?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: link } = await supabase
    .from("user_families")
    .select("family_id")
    .limit(1)
    .maybeSingle();
  if (!link) redirect("/onboarding");

  const { data: members } = await supabase
    .from("members")
    .select("*")
    .eq("family_id", link.family_id)
    .order("created_at", { ascending: true });

  // 구성원이 없으면 먼저 구성원부터 추가
  if (!members || members.length === 0) redirect("/members/new");

  // 대상 구성원 결정 (잘못된 파라미터면 첫 구성원)
  const memberList = members as Member[];
  const targetMemberId =
    memberList.find((m) => m.id === searchParams.member)?.id ?? memberList[0].id;

  // 표준항목 + "해당 구성원"의 가장 최근 병원(기본값) 병렬 조회
  const [{ data: definitions }, { data: lastRec }] = await Promise.all([
    supabase.from("item_definitions").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("checkup_records")
      .select("hospital")
      .eq("member_id", targetMemberId)
      .not("hospital", "is", null)
      .order("record_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <RecordForm
      members={memberList}
      definitions={(definitions as ItemDefinition[]) ?? []}
      initialMemberId={targetMemberId}
      defaultHospital={lastRec?.hospital ?? undefined}
    />
  );
}
