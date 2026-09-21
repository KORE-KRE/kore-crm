// Marks the matching Microsoft To Do task completed when its KORE todo is
// checked off. Best-effort and silent if the todo was never pushed (no
// ms_todo_task_id) or the agent isn't connected.

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

    if (!todo.ms_todo_task_id || !todo.ms_todo_list_id) {
      return new Response(JSON.stringify({ ok: true, skipped: "never pushed to Microsoft To Do" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const patchResp = await fetch(
      `https://graph.microsoft.com/v1.0/me/todo/lists/${todo.ms_todo_list_id}/tasks/${todo.ms_todo_task_id}`,
      {
        method: "PATCH",
        headers: { Authorization: "Bearer " + conn.access_token, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      }
    );
    if (!patchResp.ok) {
      const errBody = await patchResp.json().catch(() => ({}));
      throw new Error("Microsoft Graph task update failed: " + JSON.stringify(errBody));
    }

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
