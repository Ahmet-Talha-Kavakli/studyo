"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useFlow } from "@/store/useFlow";
import { kullaniciBul } from "@/lib/flow/seed";
import { Avatar, cn } from "./UI";

/**
 * Instagram birebir takip butonu.
 * - Takip et'e basınca 3sn dönme çemberi döner, sonra takip eder.
 * - Takipten çıkarken ekrana onay modalı gelir (Instagram gibi).
 * boyut: "feed" (inline mavi metin) · "reels" (video-içi çerçeveli) · "buton" (dolu buton) · "genis" (profil geniş).
 */
export function TakipButon({ kullaniciId, kadi, boyut = "feed", className }: {
  kullaniciId: string; kadi?: string; boyut?: "feed" | "reels" | "buton" | "genis"; className?: string;
}) {
  const s = useFlow();
  const takip = s.takipler[kullaniciId];
  const [yukleniyor, setYukleniyor] = useState(false);
  const [onayAcik, setOnayAcik] = useState(false);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sahip = kadi ? undefined : kullaniciBul(kullaniciId);
  const gosterAd = kadi ?? sahip?.kadi ?? "";

  useEffect(() => () => { if (zamanlayici.current) clearTimeout(zamanlayici.current); }, []);

  const takipEt = () => {
    if (yukleniyor) return;
    setYukleniyor(true);
    zamanlayici.current = setTimeout(() => { s.takipEt(kullaniciId); setYukleniyor(false); }, 3000);
  };

  const cikOnayla = () => { s.takipEt(kullaniciId); setOnayAcik(false); };

  // ── görsel varyantlar ──
  if (takip) {
    // takip ediliyor → tıklayınca onay modalı aç
    const takipEdiliyorStili =
      boyut === "buton" || boyut === "genis"
        ? cn("rounded-lg bg-white/[0.08] px-4 py-1.5 text-[14px] font-semibold text-white transition-colors hover:bg-white/[0.14]", boyut === "genis" && "flex-1")
        : boyut === "reels"
          ? "rounded-md border border-white/60 px-2.5 py-1 text-[12px] font-semibold text-white"
          : "text-[13px] font-semibold text-white/70 hover:text-white";
    return (
      <>
        <button onClick={() => setOnayAcik(true)} className={cn(takipEdiliyorStili, className)}>Takip ediliyor</button>
        {onayAcik && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setOnayAcik(false)}>
            <div className="w-full max-w-[400px] overflow-hidden rounded-2xl bg-[#262626] text-center" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center px-6 pb-5 pt-7">
                <Avatar tohum={sahip?.avatarTohum ?? kullaniciId} ad={sahip?.ad} boyut={90} />
                <p className="mt-4 text-[15px] text-white/90">@{gosterAd} adlı kişinin takibini bırakmak istiyor musun?</p>
              </div>
              <button onClick={cikOnayla} className="w-full border-t border-white/[0.12] py-3.5 text-[14px] font-bold text-[#ed4956] hover:bg-white/[0.04]">Takibi Bırak</button>
              <button onClick={() => setOnayAcik(false)} className="w-full border-t border-white/[0.12] py-3.5 text-[14px] text-white hover:bg-white/[0.04]">İptal</button>
            </div>
          </div>
        )}
      </>
    );
  }

  // takip edilmiyor → yükleme / takip et
  const takipEtStili =
    boyut === "buton" || boyut === "genis"
      ? cn("rounded-lg bg-[#0095f6] px-4 py-1.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1aa0f7]", boyut === "genis" && "flex-1")
      : boyut === "reels"
        ? "rounded-md border border-white/70 px-2.5 py-1 text-[12px] font-semibold text-white"
        : "text-[13px] font-semibold text-[#0095f6] hover:text-white";

  return (
    <button onClick={takipEt} disabled={yukleniyor} className={cn(takipEtStili, "inline-flex items-center justify-center gap-1.5", className)}>
      {yukleniyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (boyut === "feed" ? "Takip et" : "Takip Et")}
    </button>
  );
}
