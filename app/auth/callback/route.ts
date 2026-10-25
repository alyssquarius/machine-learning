import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!sessionError) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Cek apakah email adalah admin khusus
        if (user.email === "admin@autobuycars.com") {
          return NextResponse.redirect(`${origin}/dashboard`);
        }

        try {
          // Cek tabel profiles
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          // Jika profile belum ada atau role belum diset, wajib ke choose-role
          if (profileError || !profile?.role) {
            return NextResponse.redirect(`${origin}/choose-role`);
          }

          // Redirect sesuai role
          if (["admin", "dealer"].includes(profile.role)) {
            return NextResponse.redirect(`${origin}/dashboard`);
          }
          return NextResponse.redirect(`${origin}/beli`);
        } catch {
          // Jika tabel profiles belum ada di database, arahkan ke choose-role
          return NextResponse.redirect(`${origin}/choose-role`);
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/choose-role`);
}
