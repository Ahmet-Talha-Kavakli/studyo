import { ImageResponse } from "next/og";

// iOS "Ana Ekrana Ekle" ikonu — icon.svg ile BİREBİR aynı işaret:
// "V" = aşağı bakan play üçgeni (üret / oynat) + sağ üstte AI kıvılcımı.
// NOT: borderRadius YOK — iOS zaten kendi maskesini uyguluyor.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7de0ff 0%, #55d6fd 55%, #1ea8d6 100%)",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 32 32" fill="none">
          {/* V + play üçgeni */}
          <path
            d="M9.6 10.2h12.8c1.05 0 1.72 1.13 1.2 2.05l-6.4 11.3c-.53.93-1.87.93-2.4 0l-6.4-11.3c-.52-.92.15-2.05 1.2-2.05Z"
            fill="#002230"
          />
          {/* AI kıvılcımı */}
          <circle cx="23.4" cy="8.6" r="2.6" fill="#002230" />
          <circle cx="23.4" cy="8.6" r="1.2" fill="#c9f4ff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
