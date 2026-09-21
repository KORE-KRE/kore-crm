// Master-Admin-only: invite a new user by email. Creates the auth account,
// sends Supabase's built-in "Invite user" email, and links the role/agent
// in one step — replacing the old "create in dashboard, then approve
// in-app" two-step flow.
//
// The service_role key is only ever used here, server-side, and is never
// sent to the browser — Supabase injects it automatically as an env var
// for every Edge Function, no manual secret setup required.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    // Bound to the CALLER's JWT — used only to verify who's asking.
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    const { data: profile } = await supabaseUser
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || profile.role !== "masterAdmin") throw new Error("Only Master Admin can invite users");

    const { email, role, agentId } = await req.json();
    if (!email || !role) throw new Error("email and role are required");
    const validRoles = ["masterAdmin", "officeManager", "agent", "marketing", "officeAdmin"];
    if (!validRoles.includes(role)) throw new Error("Invalid role");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: Deno.env.get("SITE_URL") ?? undefined,
    });
    if (inviteError) throw inviteError;

    const { error: profileError } = await supabaseAdmin.from("user_profiles").insert({
      id: invited.user.id,
      role,
      agent_id: role === "masterAdmin" || role === "marketing" ? null : (agentId || null),
    });
    if (profileError) throw profileError;

    return new Response(JSON.stringify({ ok: true, userId: invited.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
