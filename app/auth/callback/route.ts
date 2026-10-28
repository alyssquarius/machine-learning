import { repairLegacyAvatarSession } from "@/lib/supabase/session-hygiene";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code && getSupabaseConfig()) {
    try {
      const supabase = await createClient();
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

      if (!sessionError) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await repairLegacyAvatarSession(supabase, user);

          // Create a new profile without overwriting an existing dealer/admin role.
          const { data: profile } = await supabase.from("profiles")
            .select("role").eq("id", user.id).maybeSingle();
          if (!profile) {
            await supabase.from("profiles").upsert({
              id: user.id,
              role: "buyer",
              display_name: user.user_metadata?.full_name || user.user_metadata?.name || "Pengguna",
              updated_at: new Date().toISOString(),
            }, { onConflict: "id", ignoreDuplicates: true });
          }
          const destination = ["admin", "dealer"].includes(profile?.role) ? "/dashboard" : "/beli";
          return NextResponse.redirect(`${origin}${destination}`);
        }
      }
    } catch {
      // Invalid or unavailable auth services return to a usable sign-in page.
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
