import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { fetchProfile } from "../lib/api/auth.js";

const AuthContext = createContext(null);

// Supabase invite/recovery links land with #...&type=invite (or
// type=recovery) in the URL hash before supabase-js consumes it to
// establish the session. Read it once, up front, so we know to show a
// "set your password" step instead of dropping the person straight into
// the app with no password ever set.
const initialHashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
const initialAuthType = initialHashParams.get("type");

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = not checked yet, null = no session
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(initialAuthType === "invite" || initialAuthType === "recovery");

  const [profileError, setProfileError] = useState(null);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setProfileError(null);
      return;
    }
    try {
      const p = await fetchProfile(userId);
      setProfile(p);
      setProfileError(null);
    } catch (err) {
      console.error("Failed to load user_profiles row for", userId, err);
      setProfile(null);
      setProfileError(err.message || String(err));
    }
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      await loadProfile(data.session?.user?.id);
      if (active) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setLoading(true);
      await loadProfile(newSession?.user?.id);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(session?.user?.id), [loadProfile, session]);

  const clearNeedsPassword = useCallback(() => {
    setNeedsPassword(false);
    // Drop the #access_token=...&type=invite fragment from the address bar
    // now that it's served its purpose — leaving it around is confusing
    // and would re-trigger needsPassword on a manual refresh.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile, profileError, needsPassword, clearNeedsPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
