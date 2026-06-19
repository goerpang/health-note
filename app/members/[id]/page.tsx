import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemberForm from "@/components/MemberForm";
import type { Member } from "@/lib/types";

export default async function EditMemberPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS가 내 가족 구성원만 조회 허용 → 남의 구성원이면 null
  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<Member>();

  if (!member) redirect("/");

  return <MemberForm mode="edit" familyId={member.family_id} member={member} />;
}
