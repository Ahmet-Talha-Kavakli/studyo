"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PazKenar } from "@/components/panel/pazarlama/PazKenar";
import { PazUrunBaglantisi } from "@/components/panel/pazarlama/PazUrunBaglantisi";
import { PazReklamReferansi } from "@/components/panel/pazarlama/PazReklamReferansi";
import { pazUret } from "@/lib/pazarlamaUretim";
import { stilBul } from "@/lib/pazarlamaVeri";

/* ============================================================
   PAZARLAMA LAYOUT — tüm /panel/pazarlama/* ekranlarını kapsar.

   · Sol kenar çubuğu sabit; içerik payı `--paz-kenar` ile iner
     (daraltma/sürükleme otomatik günceller).
   · Ürün Bağlantısı ve Reklam Referansı referansta ROTA DEĞİL,
     her ekrandan açılabilen tam ekran sihirbaz modallarıdır —
     kenar çubuğu olay yayınlar, burada dinlenir.
   ============================================================ */
export default function PazarlamaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  /* TEK sihirbaz açık olabilir. İki ayrı boolean tutulduğunda ikisi birden
     açık kalıp üst üste biniyordu (Reklam Referansı açıkken Ürün Bağlantısı'na
     basınca eskisi altta kalıyordu). Tek durum → biri açılınca diğeri kapanır. */
  const [sihirbaz, setSihirbaz] = useState<"urun" | "reklam" | null>(null);
  const urunAcik = sihirbaz === "urun";
  const reklamAcik = sihirbaz === "reklam";

  useEffect(() => {
    const u = () => setSihirbaz("urun");
    const r = () => setSihirbaz("reklam");
    window.addEventListener("paz-urun-baglantisi", u);
    window.addEventListener("paz-reklam-referansi", r);
    return () => {
      window.removeEventListener("paz-urun-baglantisi", u);
      window.removeEventListener("paz-reklam-referansi", r);
    };
  }, []);

  return (
    <div className="paz-kapsam flex min-h-screen bg-[#131416] text-white">
      <PazKenar />
      <main
        style={{ marginLeft: "var(--paz-kenar, 0px)" }}
        className="relative min-h-screen min-w-0 flex-1 transition-[margin] duration-200">
        {children}
      </main>

      {/* ══ Sihirbaz modalları — GERÇEK üretim motoruna bağlı ══ */}
      <PazUrunBaglantisi acik={urunAcik} onKapat={() => setSihirbaz(null)}
        onUret={({ urun, stil, kalite, sure }) => {
          const s = stilBul(stil);
          const ok = pazUret({
            istem: `${urun.ad} için ${s?.ad ?? stil} tarzında reklam. ${urun.aciklama}`,
            stilAdi: s?.ad ?? stil,
            oran: "9:16", kalite, sure, urunlu: true,
          });
          if (ok) router.push("/panel/pazarlama/uretimler");
        }} />

      <PazReklamReferansi acik={reklamAcik} onKapat={() => setSihirbaz(null)}
        onUret={({ senaryo, kalite, oran, adet }) => {
          const temiz = senaryo.replace(/\{\{avatar\}\}/g, "avatar").replace(/\{\{urun\}\}/g, "ürün");
          let sonOk = false;
          for (let i = 0; i < adet; i++) {
            sonOk = pazUret({
              istem: temiz, stilAdi: "Reklam Referansı",
              oran, kalite, sure: "15 sn", urunlu: false,
            });
          }
          if (sonOk) router.push("/panel/pazarlama/uretimler");
        }} />
    </div>
  );
}
