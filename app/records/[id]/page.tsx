import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RecordView from "@/components/RecordView";
import type { Member, ItemDefinition, RecordWithItems } from "@/lib/types";

export default async function RecordDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: record }, { data: link }] = await Promise.all([
    supabase
      .from("checkup_records")
      .select("*, checkup_items(*)")
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("user_families")
      .select("family_id")
      .limit(1)
      .maybeSingle(),
  ]);

  if (!record) redirect("/");
  if (!link) redirect("/onboarding");

  const [{ data: members }, { data: definitions }] = await Promise.all([
    supabase
      .from("members")
      .select("*")
      .eq("family_id", link.family_id)
      .order("created_at", { ascending: true }),
    supabase
      .from("item_definitions")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <RecordView
      record={record as RecordWithItems}
      members={(members as Member[]) ?? []}
      definitions={(definitions as ItemDefinition[]) ?? []}
    />
  );
}
