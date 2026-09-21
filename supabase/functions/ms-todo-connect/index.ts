// Exchanges a Microsoft OAuth authorization code for tokens, reads the
// signed-in Microsoft account's email, finds-or-creates a dedicated
// "KORE Tasks" list in their To Do, and stores the connection.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/msGraph.ts";

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

    const { code, redirectUri } = await req.json();
    if (!code || !redirectUri) throw new Error("code and redirectUri are required");

    const clientId = Deno.env.get("MS_TODO_CLIENT_ID")!;
    const clientSecret = Deno.env.get("MS_TODO_CLIENT_SECRET")!;

    const tokenResp = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        scope: "Tasks.ReadWrite offline_access User.Read",
      }),
    });
    const tokenData = await tokenResp.json();
    if (!tokenResp.ok) throw new Error("Microsoft token exchange failed: " + JSON.stringify(tokenData));

    const meResp = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: "Bearer " + tokenData.access_token },
    });
    const me = await meResp.json();
    if (!meResp.ok) throw new Error("Couldn't read Microsoft profile: " + JSON.stringify(me));
    const msEmail = me.mail || me.userPrincipalName || "";

    const listsResp = await fetch("https://graph.microsoft.com/v1.0/me/todo/lists", {
      headers: { Authorization: "Bearer " + tokenData.access_token },
    });
    const lists = await listsResp.json();
    if (!listsResp.ok) throw new Error("Couldn't read Microsoft To Do lists: " + JSON.stringify(lists));

    let listId = (lists.value || []).find((l: any) => l.displayName === "KORE Tasks")?.id;
    if (!listId) {
      const createResp = await fetch("https://graph.microsoft.com/v1.0/me/todo/lists", {
        method: "POST",
        headers: { Authorization: "Bearer " + tokenData.access_token, "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "KORE Tasks" }),
      });
      const created = await createResp.json();
      if (!createResp.ok) throw new Error("Couldn't create the KORE Tasks list: " + JSON.stringify(created));
      listId = created.id;
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    const { error: upsertError } = await supabaseAdmin.from("ms_todo_connections").upsert({
      user_id: user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      ms_email: msEmail,
      todo_list_id: listId,
      updated_at: new Date().toISOString(),
    });
    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ ok: true, email: msEmail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
