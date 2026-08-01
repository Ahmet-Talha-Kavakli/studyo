"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, background: "#08070c", color: "#f5f3ff", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "1rem" }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(244,63,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 32 }}>⚠️</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Kritik bir hata oluştu</h1>
          <p style={{ marginTop: 12, color: "rgba(255,255,255,0.55)", maxWidth: 420 }}>
            Beklenmedik bir sorun yaşandı. Sayfayı yeniden yüklemeyi dene.
          </p>
          <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
            <button onClick={reset} style={{ height: 44, padding: "0 20px", borderRadius: 12, background: "#22d3ee", color: "#08070c", fontWeight: 600, border: "none", cursor: "pointer" }}>
              Tekrar dene
            </button>
            <a href="/" style={{ height: 44, padding: "0 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", color: "#fff", display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
              Ana sayfa
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
