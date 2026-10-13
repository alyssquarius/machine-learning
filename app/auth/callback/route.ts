import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Cek apakah user sudah punya profile/role
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile?.role) {
          return NextResponse.redirect(`${origin}/choose-role`);
        }
      } catch {
        // Jika tabel profiles belum ada atau error, arahkan ke choose-role untuk amannya
        return NextResponse.redirect(`${origin}/choose-role`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
