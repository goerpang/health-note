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

  const { data: definitions } = await supabase
    .from("item_definitions")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <RecordForm
      members={members as Member[]}
      definitions={(definitions as ItemDefinition[]) ?? []}
      initialMemberId={searchParams.member}
    />
  );
}
