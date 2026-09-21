// Shared helpers for the Microsoft To Do integration Edge Functions.
// Tokens live only in ms_todo_connections, only ever touched here via the
// service-role client — never exposed to the browser.

export async function getValidAccessToken(supabaseAdmin: any, userId: string) {
  const { data: conn, error } = await supabaseAdmin
    .from("ms_todo_connections")
    .select("access_token, refresh_token, expires_at, todo_list_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!conn) return null;

  // 60s buffer so we never fire a Graph call with a token that expires
  // mid-flight.
  if (new Date(conn.expires_at).getTime() > Date.now() + 60_000) {
    return conn;
  }

  const clientId = Deno.env.get("MS_TODO_CLIENT_ID")!;
  const clientSecret = Deno.env.get("MS_TODO_CLIENT_SECRET")!;
  const resp = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: conn.refresh_token,
      scope: "Tasks.ReadWrite offline_access User.Read",
    }),
  });
  const tokenData = await resp.json();
  if (!resp.ok) throw new Error("Failed to refresh Microsoft token: " + JSON.stringify(tokenData));

  const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
  const { error: updateError } = await supabaseAdmin
    .from("ms_todo_connections")
    .update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || conn.refresh_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (updateError) throw updateError;

  return { ...conn, access_token: tokenData.access_token, expires_at: newExpiresAt };
}

// agents.id (e.g. "a5") isn't the same as auth.users.id — this resolves
// through user_profiles, which is the only table that links the two.
export async function findUserIdForAgent(supabaseAdmin: any, agentId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("agent_id", agentId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
