import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HomeView from "@/components/HomeView";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미들웨어가 1차로 막지만, 안전하게 서버에서도 확인
  if (!user) redirect("/login");

  return <HomeView email={user.email ?? ""} />;
}
