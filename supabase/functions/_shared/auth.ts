import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function unauthorized(corsHeaders: Record<string, string>, message = "Unauthorized") {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function forbidden(corsHeaders: Record<string, string>, message = "Forbidden") {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function requireAuth(req: Request, corsHeaders: Record<string, string>) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, error: unauthorized(corsHeaders) };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    return { user: null, error: unauthorized(corsHeaders) };
  }

  return { user: { id: data.claims.sub, email: data.claims.email }, error: null };
}

/**
 * Verify the caller is authenticated AND has the 'admin' role.
 * Uses the service-role client to query user_roles, bypassing RLS recursion.
 */
export async function requireAdmin(req: Request, corsHeaders: Record<string, string>) {
  const { user, error } = await requireAuth(req, corsHeaders);
  if (error || !user) return { user: null, error: error ?? unauthorized(corsHeaders) };

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: roles, error: rolesErr } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .limit(1);

  if (rolesErr || !roles || roles.length === 0) {
    return { user: null, error: forbidden(corsHeaders, "Admin role required") };
  }

  return { user, error: null };
}
