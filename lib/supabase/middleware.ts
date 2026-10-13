import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return supabaseResponse;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/choose-role"].some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isProtected = ["/jual", "/pengaturan", "/profil"].some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Guest bisa akses: /dashboard, /beli, /favorit, /riwayat
  // Protected (harus login): /jual, /pengaturan, /profil

  if (!user && isProtected) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    return NextResponse.redirect(login);
  }
  if (user && isAuthPage) {
    const dash = request.nextUrl.clone();
    dash.pathname = "/dashboard";
    return NextResponse.redirect(dash);
  }

  return supabaseResponse;
}
