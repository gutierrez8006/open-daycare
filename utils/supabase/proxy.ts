import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Redirect de proxy con cookies de sesión preservadas en la response.
function redirectTo(
  request: NextRequest,
  pathname: string,
  supabaseResponse: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) =>
    redirectResponse.cookies.set(cookie),
  );
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/activate-account") ||
    pathname.startsWith("/auth");

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) =>
      redirectResponse.cookies.set(cookie),
    );
    return redirectResponse;
  }

  if (user && (pathname.startsWith("/login") || pathname.startsWith("/activate-account"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) =>
      redirectResponse.cookies.set(cookie),
    );
    return redirectResponse;
  }

  // Guard de rol: la fuente de verdad de autorizacioens es `users.role` de la BD,
  // leída por request (el rol es mutable: un staff puede pasar a parent).
  // Se consulta solo cuando la ruta lo requiere; el refresco de sesión de
  // arriba queda intacto.
  const needsRoleCheck =
    pathname === "/" ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/familia");

  if (user && needsRoleCheck) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = profile?.role;

    if (pathname === "/") {
      // Resolutor de rol: cada panel vive bajo su prefijo explícito en URL.
      if (role === "staff") return redirectTo(request, "/staff", supabaseResponse);
      if (role === "parent") return redirectTo(request, "/familia", supabaseResponse);
      // Sin perfil con rol conocido: no hay panel a deducir, se responde sin redirect
      // (la request terminara en 404) en vez de arriesgar un loop de redirects.
      return supabaseResponse;
    }

    if (pathname.startsWith("/staff") && role !== "staff") {
      return redirectTo(request, "/", supabaseResponse);
    }
    if (pathname.startsWith("/familia") && role !== "parent") {
      return redirectTo(request, "/", supabaseResponse);
    }
  }

  return supabaseResponse;
}
