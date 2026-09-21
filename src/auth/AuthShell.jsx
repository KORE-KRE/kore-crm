import React from "react";

// Visual wrapper only — split navy/white panel with the Kingstons logo,
// adapted from a branding concept Kyle put together in a separate build.
// The actual auth logic (Login.jsx) is untouched; this just replaces the
// plain dark-box styling it used to render inside.
export const authStyles = {
  cardTitle: {
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 28,
    lineHeight: 1.06,
    fontWeight: 700,
    margin: "0 0 4px 0",
    color: "#111827",
  },
  copy: {
    fontSize: 14,
    color: "#687487",
    lineHeight: 1.42,
    margin: "0 0 20px 0",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
    color: "#687487",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 14,
    border: "1px solid #D8E0EA",
    borderRadius: 8,
    fontSize: 14,
    color: "#111827",
    background: "#FFFFFF",
  },
  primaryButton: {
    width: "100%",
    padding: "10px 14px",
    background: "#FFE000",
    color: "#071F3D",
    border: "1px solid #FFE000",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(255, 224, 0, 0.22)",
  },
  errorBox: {
    color: "#A6543E",
    background: "#F3E3DE",
    border: "1px solid #E8CFC5",
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 13,
    marginBottom: 12,
  },
  successBox: {
    color: "#3E6B3F",
    background: "#E1EFE0",
    border: "1px solid #C9DEC7",
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 13,
    marginBottom: 12,
  },
};

export default function AuthShell({ children, width = 360 }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#071F3D",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: 32,
      }}
    >
      <div
        style={{
          width: "min(1080px, 100%)",
          maxWidth: "100%",
          minHeight: "min(680px, calc(100vh - 64px))",
          display: "grid",
          gridTemplateColumns: "1.05fr .95fr",
          background: "#FFFFFF",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.28)",
        }}
      >
        <div style={{ display: "grid", placeItems: "center", background: "#082543", padding: 54 }}>
          <img
            src="/kingstons-wide-logo.jpg"
            alt="Kingstons Real Estate"
            style={{
              width: "min(100%, 620px)",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 16px 34px rgba(0, 0, 0, 0.24))",
            }}
          />
        </div>
        <div style={{ display: "grid", alignContent: "center", gap: 18, padding: "clamp(32px, 5vw, 58px)", width, maxWidth: "100%" }}>
          <div style={{ marginBottom: 2 }}>
            <div style={{ color: "#071F3D", fontWeight: 700, fontSize: 13 }}>KORE</div>
            <div style={{ color: "#687487", fontWeight: 500, fontSize: 12, marginTop: 3 }}>
              Kingstons Operations &amp; Real Estate
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
