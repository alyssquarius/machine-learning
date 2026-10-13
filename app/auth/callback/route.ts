import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    // Cek apakah user sudah punya role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile?.role) {
          // User baru, pilih role dulu
          return NextResponse.redirect(`${origin}/choose-role`);
        }
      } catch {
        // Table belum ada, langsung dashboard
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
