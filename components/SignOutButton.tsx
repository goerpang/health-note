"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="w-full py-3.5 rounded-2xl bg-section text-bad font-semibold flex items-center justify-center gap-2 active:opacity-70"
    >
      <LogOut size={18} /> 로그아웃
    </button>
  );
}
