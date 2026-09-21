import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

export default function SetPassword({ email, onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message || "Couldn't set password.");
      return;
    }
    onDone();
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0d1526",
    }}>
      <form onSubmit={handleSubmit} style={{
        width: 340, background: "#fff", borderRadius: 10, padding: "32px 28px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}>
        <h1 style={{ fontSize: 20, marginBottom: 4, color: "#0d1526" }}>Welcome to KORE</h1>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
          {email ? <>Set a password for <strong>{email}</strong> to finish setting up your account.</> : "Set a password to finish setting up your account."}
        </p>

        <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "#333" }}>New password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "8px 10px", marginBottom: 14, border: "1px solid #ccc", borderRadius: 6, fontSize: 14 }}
        />

        <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "#333" }}>Confirm password</label>
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={{ width: "100%", padding: "8px 10px", marginBottom: 14, border: "1px solid #ccc", borderRadius: 6, fontSize: 14 }}
        />

        {error && <div style={{ color: "#b3261e", fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%", padding: "10px 0", background: "#0d1526", color: "#fff",
            border: "none", borderRadius: 6, fontSize: 14, cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Saving…" : "Set password & continue"}
        </button>
      </form>
    </div>
  );
}
