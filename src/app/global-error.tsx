"use client";

/**
 * Kök düzen çöktüğünde devreye girer; stil dosyaları yüklenmediği için satır içi
 * stillerle diğer hata ekranlarının görünümü taklit edilir.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const dugme = { height: 44, padding: "0 20px", borderRadius: 999, fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", textDecoration: "none" } as const;
  return (
    <html lang="tr">
      <body style={{ margin: 0, background: "#050506", color: "#fff", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
        <main style={{ position: "relative", minHeight: "100svh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 20px", overflow: "hidden" }}>
          <video src="/gercek/video-hareket/smoke-transition.mp4" poster="/gercek/video-hareket/smoke-transition-poster.webp" autoPlay muted loop playsInline aria-hidden
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: -2 }} />
          <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, background: "radial-gradient(ellipse at center, rgba(5,5,6,0.4) 0%, rgba(5,5,6,0.8) 70%)" }} />
          <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)", margin: 0 }}>KRİTİK HATA</p>
          <h1 style={{ fontSize: "clamp(38px, 6vw, 64px)", fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.02, margin: "16px 0 0" }}>Vayra şu an açılamadı.</h1>
          <p style={{ maxWidth: 520, marginTop: 20, fontSize: 15.5, lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>
            Uygulamanın kendisi yüklenirken bir hata oluştu. Hesabın ve üretimlerin güvende. Sayfayı yeniden yüklemeyi dene.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => reset()} style={{ ...dugme, background: "#fff", color: "#0b0b0d", border: "none" }}>Yeniden dene</button>
            <a href="/" style={{ ...dugme, background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>Ana sayfa</a>
          </div>
          {error.digest && <p style={{ marginTop: 24, fontFamily: "ui-monospace, monospace", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Hata kimliği: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
