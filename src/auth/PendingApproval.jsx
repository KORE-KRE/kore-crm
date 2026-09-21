import React from "react";
import { signOut } from "../lib/api/auth.js";

export default function PendingApproval({ email, error }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0d1526",
    }}>
      <div style={{
        width: 420, background: "#fff", borderRadius: 10, padding: "32px 28px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)", textAlign: "center",
      }}>
        <h1 style={{ fontSize: 20, marginBottom: 8, color: "#0d1526" }}>
          {error ? "Couldn't load your account" : "Waiting for approval"}
        </h1>
        <p style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>
          You're signed in as <strong>{email}</strong>{error ? "," : ", but your account isn't linked to a role yet."}
        </p>
        {error ? (
          <div style={{
            fontSize: 12, color: "#b3261e", background: "#fdecea", border: "1px solid #f4c7c3",
            borderRadius: 6, padding: "8px 10px", margin: "8px 0 16px 0", textAlign: "left", wordBreak: "break-word",
          }}>
            {error}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#555", marginBottom: 20 }}>
            Ask a Master Admin to approve your account from the Access Control page.
          </p>
        )}
        <button
          onClick={() => signOut()}
          style={{
            padding: "8px 16px", background: "#eee", border: "none", borderRadius: 6,
            fontSize: 13, cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
