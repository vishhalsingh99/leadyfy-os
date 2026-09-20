import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Every route here is dynamic (per-request RBAC/actor data), and the
    // default dynamic staleTime is 0 — meaning the client router cache
    // never reuses a page you've already visited, so clicking back to a
    // page you were just on still triggers a full round-trip to Supabase.
    // 30s lets short back-and-forth navigation (e.g. list -> detail ->
    // list) feel instant; anything longer than that, or any mutation via
    // a Server Action's revalidatePath, still gets fresh data.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
