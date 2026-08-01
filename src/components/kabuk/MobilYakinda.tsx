"use client";

import { useRouter } from "next/navigation";
import { Monitor, ArrowLeft } from "lucide-react";

/**
 * Mobil "Yakında" placeholder — masaüstünde tam çalışan ama mobil görünüme
 * henüz uyarlanmamış (canvas/3D-viewport gibi ağır) sayfaların MOBİL branch'inde
 * gösterilir. Higgsfield mobil web'de de bu tür ağır araçlar için benzer bir
 * "büyük ekranda aç" yönlendirmesi vardır.
 *
 * Kullanım (sayfanın en üstünde, desktop içeriğini `hidden sm:block` ile sarıp):
 *   <MobilYakinda baslik="AI Influencer Stüdyosu" />
 *   <div className="hidden sm:block"> …desktop içerik… </div>
 */
export function MobilYakinda({
  baslik,
  aciklama = "Bu araç en iyi deneyim için masaüstünde çalışır. Mobil sürüm çok yakında.",
}: {
  baslik: string;
  aciklama?: string;
}) {
  const router = useRouter();
  return (
    <div className="mobil-lime-sayfa flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center px-6 text-center sm:hidden">
      <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-[22px] bg-aksan/12 ring-1 ring-aksan/25">
        <Monitor className="h-9 w-9 text-aksan" />
      </span>
      <h1 className="text-[22px] font-bold text-white">{baslik}</h1>
      <p className="mt-2.5 max-w-[300px] text-[15px] leading-relaxed text-metin-2">{aciklama}</p>
      <span className="mt-5 rounded-full bg-aksan px-3.5 py-1.5 text-[13px] font-bold text-zemin">Yakında · Mobil</span>
      <button onClick={() => router.push("/panel")}
        className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-[15px] font-medium text-white transition-colors active:bg-white/8">
        <ArrowLeft className="h-4 w-4" /> Ana panele dön
      </button>
    </div>
  );
}
