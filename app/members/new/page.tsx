import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemberForm from "@/components/MemberForm";

export default async function NewMemberPage() {
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

  return <MemberForm mode="create" familyId={link.family_id} />;
}
