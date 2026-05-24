import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Simple Postgres-backed sliding window rate limiter.
 *
 * Caveat: this is an ad-hoc implementation. The project has no dedicated
 * rate-limit primitive (Redis / edge KV). Using a Postgres table works but
 * adds one DB round-trip per request and only counts within fixed buckets
 * (not a true sliding window). Good enough to block obvious abuse of paid
 * APIs; not a substitute for an upstream WAF.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_LIMIT = 30;

export interface RateLimitResult {
  ok: boolean;
  count: number;
  limit: number;
  retryAfterSec: number;
}

/** Derive a stable key for the caller: user-id when authenticated, else IP. */
export function rateLimitKey(req: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

/**
 * Increment the counter for `key` in the current window and return whether
 * the request is allowed. Uses the service-role client so the rate_limits
 * table (which is RLS-locked with zero policies) is accessible.
 */
export async function checkRateLimit(
  key: string,
  scope: string,
  limit = DEFAULT_LIMIT,
): Promise<RateLimitResult> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = Date.now();
  const windowStartMs = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const windowStart = new Date(windowStartMs).toISOString();
  const fullKey = `${scope}:${key}`;

  const { data, error } = await supabase.rpc("increment_rate_limit", {
    p_key: fullKey,
    p_window: windowStart,
  });

  if (error) {
    // Fail-open on infra errors so a broken counter never takes down the API.
    console.error("rate-limit rpc error", error);
    return { ok: true, count: 0, limit, retryAfterSec: 0 };
  }

  const count = typeof data === "number" ? data : 0;
  const retryAfterSec = Math.max(1, Math.ceil((windowStartMs + WINDOW_MS - now) / 1000));
  return { ok: count <= limit, count, limit, retryAfterSec };
}

export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>,
) {
  return new Response(
    JSON.stringify({
      error: "Te veel verzoeken. Probeer het later opnieuw.",
      limit: result.limit,
      retryAfterSec: result.retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSec),
      },
    },
  );
}
