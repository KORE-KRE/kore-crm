// Runs once a day (via pg_cron, see supabase/schema_v5.sql) and emails
// each agent their open to-dos for the day. Only agents with at least one
// open item and an email address on file get sent to.
//
// Protected by a shared secret header (CRON_SECRET) rather than a user
// JWT, since this is invoked by a scheduled job, not a logged-in browser.
// Set CRON_SECRET and RESEND_API_KEY as function secrets before deploying
// (see the setup steps) — SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are
// injected automatically by Supabase, no setup needed for those two.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

Deno.serve(async (req) => {
  const cronSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== Deno.env.get("CRON_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: agents, error: agentsError } = await supabaseAdmin.from("agents").select("id, name, email");
    if (agentsError) throw agentsError;

    const { data: todos, error: todosError } = await supabaseAdmin
      .from("todos")
      .select("agent_id, label")
      .eq("done", false);
    if (todosError) throw todosError;

    const byAgent: Record<string, { label: string }[]> = {};
    (todos ?? []).forEach((t) => {
      if (!t.agent_id) return;
      (byAgent[t.agent_id] ??= []).push({ label: t.label });
    });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("DIGEST_FROM_EMAIL") || "KORE <onboarding@resend.dev>";
    if (!resendKey) throw new Error("RESEND_API_KEY is not set");

    let sent = 0, failed = 0, skippedNoEmail = 0, skippedEmpty = 0;

    for (const agent of agents ?? []) {
      const items = byAgent[agent.id] || [];
      if (items.length === 0) { skippedEmpty++; continue; }
      if (!agent.email) { skippedNoEmail++; continue; }

      const listHtml = items.map((t) => `<li style="margin-bottom:6px;">${escapeHtml(t.label)}</li>`).join("");
      const html = `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; color: #24232A;">
          <h2 style="color:#02658F; margin-bottom: 4px;">Good morning, ${escapeHtml(agent.name)}</h2>
          <p style="color:#555;">You have ${items.length} open item${items.length === 1 ? "" : "s"} today:</p>
          <ul style="padding-left: 18px;">${listHtml}</ul>
          <p style="color:#999; font-size:12px; margin-top: 24px;">Sent automatically by KORE — Kingstons Operations &amp; Real Estate.</p>
        </div>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromAddress,
          to: agent.email,
          subject: `Your to-dos for today (${items.length})`,
          html,
        }),
      });
      if (res.ok) sent++; else failed++;
    }

    return new Response(JSON.stringify({ sent, failed, skippedNoEmail, skippedEmpty }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
