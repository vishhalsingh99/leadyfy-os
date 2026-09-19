import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Components/Actions/Route Handlers use this. Writing cookies from a
// Server Component throws (Next.js restriction) — that's fine here because
// middleware.ts already refreshes the session on every request.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — no-op, middleware handles refresh.
          }
        },
      },
    },
  );
}
