import React, { useState } from "react";
import { signIn, resetPassword } from "../lib/api/auth.js";
import AuthShell, { authStyles } from "./AuthShell.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetStatus, setResetStatus] = useState(null);
  const [resetting, setResetting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResetStatus(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message || "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email above first, then click Reset password.");
      return;
    }
    setResetting(true);
    setError("");
    try {
      await resetPassword(email.trim());
      setResetStatus("If an account exists for " + email.trim() + ", a password reset email is on its way.");
    } catch (err) {
      setError(err.message || "Couldn't send reset email.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit}>
        <h1 style={authStyles.cardTitle}>Sign in</h1>
        <p style={authStyles.copy}>Sign in to your KORE CRM account.</p>

        <label style={authStyles.label}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={authStyles.input}
        />

        <label style={authStyles.label}>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={authStyles.input}
        />

        {error && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...authStyles.errorBox, marginBottom: 4 }}>{error}</div>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetting}
              style={{
                background: "none", border: "none", padding: 0, color: "#071F3D",
                fontSize: 12, textDecoration: "underline", cursor: resetting ? "default" : "pointer",
              }}
            >
              {resetting ? "Sending…" : "Reset password"}
            </button>
          </div>
        )}

        {resetStatus && <div style={authStyles.successBox}>{resetStatus}</div>}

        <button
          type="submit"
          disabled={submitting}
          style={{ ...authStyles.primaryButton, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <p style={{ fontSize: 11, color: "#888", marginTop: 16 }}>
          Don't have an account? Ask your Master Admin to create one for you — you'll see a pending-approval screen until your role is assigned.
        </p>
      </form>
    </AuthShell>
  );
}
