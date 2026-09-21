import { supabase } from "../supabaseClient.js";

// supabase-js only gives a generic "non-2xx status code" message on
// FunctionsHttpError — the actual { error: "..." } body our functions
// return has to be read off the raw Response in error.context.
async function invoke(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let serverMessage = null;
    if (error.context && typeof error.context.json === "function") {
      try {
        const parsed = await error.context.clone().json();
        serverMessage = parsed?.error || null;
      } catch (_parseErr) {
        // body wasn't JSON — fall through to the generic error below
      }
    }
    throw new Error(serverMessage || error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

// Redirect back to the app root, not a dedicated route — there's no
// client-side router here, and this mirrors how the invite/recovery flow
// already reads its params off the root URL on load.
export function getRedirectUri() {
  return window.location.origin + "/";
}

const STATE_KEY = "kore_ms_todo_oauth_state";

export function buildConnectUrl() {
  const clientId = import.meta.env.VITE_MS_TODO_CLIENT_ID;
  if (!clientId) throw new Error("Microsoft To Do isn't configured yet (missing VITE_MS_TODO_CLIENT_ID).");
  const state = "kore_mstodo_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  sessionStorage.setItem(STATE_KEY, state);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    response_mode: "query",
    scope: "Tasks.ReadWrite offline_access User.Read",
    state,
  });
  return "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" + params.toString();
}

// Reads `code`/`state` off the current URL if present and matches the
// state we stashed before redirecting out — call once on app load.
export function consumePendingCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state || !state.startsWith("kore_mstodo_")) return null;
  const expected = sessionStorage.getItem(STATE_KEY);
  window.history.replaceState({}, "", window.location.pathname);
  sessionStorage.removeItem(STATE_KEY);
  if (state !== expected) return null;
  return { code };
}

export async function exchangeCode(code) {
  return invoke("ms-todo-connect", { code, redirectUri: getRedirectUri() });
}

export async function getStatus() {
  const { data, error } = await supabase.rpc("get_ms_todo_status");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { connected: !!row?.connected, msEmail: row?.ms_email || "" };
}

export async function disconnect() {
  const { error } = await supabase.rpc("disconnect_ms_todo");
  if (error) throw error;
}

// Fire-and-forget from the caller's side — a failed push should never
// block the KORE todo it's attached to.
export async function pushTask(todoId) {
  return invoke("ms-todo-push-task", { todoId });
}

export async function completeTask(todoId) {
  return invoke("ms-todo-complete-task", { todoId });
}
