// Pushes one KORE todo into the owning agent's Microsoft To Do "KORE
// Tasks" list, if they've connected their account. Best-effort and silent
// when there's nothing to push to (unlinked agent, e.g. the Admin Agent
// pseudo-account, or the user never connected Microsoft) — this must
// never block the KORE todo itself from being created.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getValidAccessToken, findUserIdForAgent, corsHeaders } from "../_shared/msGraph.ts";

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

    const { todoId } = await req.json();
    if (!todoId) throw new Error("todoId is required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: todo, error: todoError } = await supabaseAdmin
      .from("todos").select("*").eq("id", todoId).single();
    if (todoError || !todo) throw new Error("Todo not found");

    const targetUserId = await findUserIdForAgent(supabaseAdmin, todo.agent_id);
    if (!targetUserId) {
      return new Response(JSON.stringify({ ok: true, skipped: "no KORE account linked to this agent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const conn = await getValidAccessToken(supabaseAdmin, targetUserId);
    if (!conn) {
      return new Response(JSON.stringify({ ok: true, skipped: "Microsoft To Do not connected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const createResp = await fetch(
      `https://graph.microsoft.com/v1.0/me/todo/lists/${conn.todo_list_id}/tasks`,
      {
        method: "POST",
        headers: { Authorization: "Bearer " + conn.access_token, "Content-Type": "application/json" },
        body: JSON.stringify({ title: todo.label }),
      }
    );
    const created = await createResp.json();
    if (!createResp.ok) throw new Error("Microsoft Graph task create failed: " + JSON.stringify(created));

    await supabaseAdmin
      .from("todos")
      .update({ ms_todo_task_id: created.id, ms_todo_list_id: conn.todo_list_id })
      .eq("id", todoId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
