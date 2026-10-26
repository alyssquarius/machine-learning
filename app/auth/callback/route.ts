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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const isAdmin = user.email === "admin@autobuycars.com";
        const defaultRole = isAdmin ? "admin" : "buyer";

        try {
          // Buat atau pastikan profile otomatis tersimpan sebagai role buyer (atau admin)
          await supabase.from("profiles").upsert({
            id: user.id,
            role: defaultRole,
            display_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Pengguna",
            updated_at: new Date().toISOString(),
          });
        } catch {
          /* abaikan jika tabel profiles belum ada */
        }

        if (isAdmin) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }
        return NextResponse.redirect(`${origin}/beli`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/beli`);
}
