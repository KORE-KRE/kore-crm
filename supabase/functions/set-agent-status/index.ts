// Master-Admin-only: activate/deactivate an agent. Deactivating updates
// agents.active AND bans every Supabase Auth account linked to that
// agent (via ban_duration) so they genuinely can't log in or usefully
// reset their password — not just a UI flag. Reactivating un-bans them.
// None of the agent's leads/offers/deals/etc. are touched either way.

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
    if (!profile || profile.role !== "masterAdmin") throw new Error("Only Master Admin can change agent status");

    const { agentId, active } = await req.json();
    if (!agentId || typeof active !== "boolean") throw new Error("agentId and active (boolean) are required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: agentError } = await supabaseAdmin.from("agents").update({ active }).eq("id", agentId);
    if (agentError) throw agentError;

    const { data: linkedProfiles, error: profilesError } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("agent_id", agentId);
    if (profilesError) throw profilesError;

    for (const p of linkedProfiles ?? []) {
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(p.id, {
        ban_duration: active ? "none" : "876000h", // ~100 years — effectively indefinite until reactivated
      });
      if (banError) throw banError;
    }

    return new Response(JSON.stringify({ ok: true, affectedAccounts: (linkedProfiles ?? []).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
