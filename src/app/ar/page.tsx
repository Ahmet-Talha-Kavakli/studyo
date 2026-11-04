"use client";

/**
 * Telefonda AR önizleme: 3D stüdyosundaki QR kodu bu sayfayı açar. model-viewer ile model döndürülür;
 * "Odanda gör" Android'de Scene Viewer / WebXR, iPhone'da Quick Look ile modeli gerçek ortama yerleştirir.
 */

import { createElement, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Scan } from "lucide-react";

function ArIcerik() {
  const q = useSearchParams();
  const glb = q.get("glb") ?? "";
  const ad = (q.get("ad") ?? "3D model").slice(0, 60);
  const [hazir, setHazir] = useState(false);
  const gecerli = /^(\/|https:\/\/)/.test(glb);
  useEffect(() => { void import("@google/model-viewer").then(() => setHazir(true)); }, []);
  return (
    <main className="flex min-h-[100dvh] flex-col bg-[#0d0e10] text-white">
      <header className="flex items-center gap-3 px-4 pb-2 pt-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/[0.08]"><Box className="h-5 w-5" /></span>
        <span className="min-w-0 leading-tight"><span className="block truncate text-[16px] font-semibold">{ad}</span><span className="block text-[12.5px] text-white/55">Vayra 3D · AR önizleme</span></span>
      </header>
      <div className="relative min-h-0 flex-1">
        {!gecerli ? (
          <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-[14px] text-white/60">Bu bağlantıda model yok. 3D stüdyosundaki QR kodu yeniden tara.</p>
        ) : hazir && createElement("model-viewer", {
          src: glb, alt: ad, ar: true, "ar-modes": "webxr scene-viewer quick-look", "ar-scale": "auto", "camera-controls": true, "auto-rotate": true, "interaction-prompt": "none",
          "shadow-intensity": "1", exposure: "1.1", "environment-image": "neutral", "camera-orbit": "30deg 74deg 150%",
          style: { width: "100%", height: "100%", position: "absolute", inset: 0, background: "transparent" },
        }, createElement("button", { slot: "ar-button", className: "absolute bottom-6 left-1/2 flex h-14 -translate-x-1/2 items-center gap-2 rounded-full bg-white px-6 text-[16px] font-semibold text-black active:scale-95" },
          createElement(Scan, { className: "h-5 w-5" }), "Odanda gör"))}
      </div>
      <p className="px-6 pb-6 text-center text-[12.5px] leading-snug text-white/45">Kameraya izin ver ve telefonu zeminde gezdir; model gerçek ölçeğiyle yerleşir.</p>
    </main>
  );
}

export default function ArSayfa() {
  return <Suspense fallback={null}><ArIcerik /></Suspense>;
}
