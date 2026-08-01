import { ImageResponse } from "next/og";

// Sosyal paylaşım önizleme kartı (WhatsApp/Twitter/LinkedIn) — marka + slogan.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Vayra — Yapay Zeka Yaratım Stüdyosu";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          position: "relative",
        }}
      >
        {/* Cyan hüzme arka plan */}
        <div
          style={{
            position: "absolute",
            top: -160,
            left: 380,
            width: 440,
            height: 440,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(34,211,238,0.35), transparent 70%)",
            display: "flex",
          }}
        />
        {/* Squircle logo */}
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 34,
            background: "linear-gradient(160deg, #67e8f9 0%, #22d3ee 55%, #0891b2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <svg width="78" height="78" viewBox="0 0 24 24" fill="none">
            <path d="M4.5 6.5c0 6.5 3.2 11 7.5 11s7.5-4.5 7.5-11" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            <circle cx="12" cy="4.8" r="1.7" fill="#000000" />
          </svg>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, color: "#fff", letterSpacing: -1, display: "flex" }}>
          Vayra
        </div>
        <div style={{ fontSize: 30, color: "#a1a1aa", marginTop: 12, display: "flex" }}>
          Yapay Zeka ile Görsel · Video · 3D · Ses
        </div>
        <div
          style={{
            marginTop: 32,
            padding: "10px 26px",
            borderRadius: 9999,
            background: "rgba(34,211,238,0.14)",
            color: "#67e8f9",
            fontSize: 24,
            fontWeight: 600,
            display: "flex",
          }}
        >
          Tek yaratım stüdyosu
        </div>
      </div>
    ),
    { ...size },
  );
}
