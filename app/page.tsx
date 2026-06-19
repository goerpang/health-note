import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HomeView from "@/components/HomeView";
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

  // 가족 구성원 목록 (RLS가 내 가족만 허용)
  const { data: members } = await supabase
    .from("members")
    .select("*")
    .eq("family_id", link.family_id)
    .order("created_at", { ascending: true });

  return (
    <HomeView email={user.email ?? ""} members={(members as Member[]) ?? []} />
  );
}
