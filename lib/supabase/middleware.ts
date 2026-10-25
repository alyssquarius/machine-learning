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

  if (!user && isProtected) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    return NextResponse.redirect(login);
  }

  // Jika user login mengakses /login atau /register, redirect sesuai role
  if (user && isAuthPage && pathname !== "/choose-role") {
    let userRole = "buyer";
    if (user.email === "admin@autobuycars.com") {
      userRole = "admin";
    } else {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile?.role && pathname !== "/choose-role") {
          const chooseRoleUrl = request.nextUrl.clone();
          chooseRoleUrl.pathname = "/choose-role";
          return NextResponse.redirect(chooseRoleUrl);
        }
        if (profile?.role) {
          userRole = profile.role;
        }
      } catch {
        // Jika tabel profiles belum ada, biarkan ke choose-role jika bukan di choose-role
        if (pathname !== "/choose-role") {
          const chooseRoleUrl = request.nextUrl.clone();
          chooseRoleUrl.pathname = "/choose-role";
          return NextResponse.redirect(chooseRoleUrl);
        }
      }
    }

    const dest = request.nextUrl.clone();
    dest.pathname = ["admin", "dealer"].includes(userRole) ? "/dashboard" : "/beli";
    return NextResponse.redirect(dest);
  }

  return supabaseResponse;
}
