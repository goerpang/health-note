import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GuideView from "@/components/GuideView";
import type { Member, ItemDefinition, RecordWithItems } from "@/lib/types";

export default async function GuidePage({
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

  const [{ data: membersData }, { data: definitions }] = await Promise.all([
    supabase
      .from("members")
      .select("*, checkup_records(*, checkup_items(*))")
      .eq("family_id", link.family_id)
      .order("created_at", { ascending: true }),
    supabase
      .from("item_definitions")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawMembers = (membersData as any[]) ?? [];
  const members: Member[] = rawMembers.map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ checkup_records, ...m }) => m as Member
  );
  const records: RecordWithItems[] = rawMembers.flatMap(
    (m) => (m.checkup_records ?? []) as RecordWithItems[]
  );

  if (members.length === 0) redirect("/");

  return (
    <GuideView
      members={members}
      definitions={(definitions as ItemDefinition[]) ?? []}
      records={records}
      initialMemberId={searchParams.member}
    />
  );
}
