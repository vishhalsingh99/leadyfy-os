import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Coarse gate: unauthenticated -> /login. Role-based routing (CLIENT ->
// /portal, non-OWNER blocked from /users, etc.) happens in the (internal)
// and (portal) route group layouts via lib/rbac.ts, since that requires a
// Profile lookup this Edge middleware deliberately doesn't do per request.
export async function middleware(request: NextRequest) {
  // Server Action POSTs validate the session themselves via
  // getActorOrRedirect() inside the action — skip middleware's own
  // getUser() call for these. Running it here too raced against the
  // action's own Supabase client and could invalidate a perfectly good
  // session (the two independent getUser() calls don't reliably share the
  // same refreshed-cookie state within one request for POSTs the way they
  // do for a plain page GET).
  if (request.headers.has("next-action")) {
    return NextResponse.next();
  }

  // Link prefetches (purpose: prefetch / next-router-prefetch headers) fire
  // in a burst — every sidebar link on a page prefetches at once. Each one
  // independently calling Supabase's getUser() (which can rotate the
  // refresh token) concurrently trips Supabase's refresh-token reuse
  // detection and kills the whole session. Prefetches don't need a fresh
  // session check; the real navigation that follows will run this properly.
  if (request.headers.get("purpose") === "prefetch" || request.headers.has("next-router-prefetch")) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!user && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
