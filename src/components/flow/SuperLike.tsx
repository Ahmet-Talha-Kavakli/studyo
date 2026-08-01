"use client";

import { useState } from "react";
import { Zap, X, Sparkles, Flame, Star, Rocket } from "lucide-react";
import { useFlow } from "@/store/useFlow";
import { useAuth } from "@/store/useAuth";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { toast } from "@/lib/toast";
import { sayiKisa } from "@/lib/flow/cekirdek";
import { cn } from "./UI";

/** Süper beğeni kredi seçenekleri (TikTok "hediye" mantığı — gerçek para değil, kredi). */
const KADEMELER = [
  { kredi: 5, etiket: "Kıvılcım", ikon: Sparkles },
  { kredi: 20, etiket: "Şimşek", ikon: Zap },
  { kredi: 50, etiket: "Alev", ikon: Flame },
  { kredi: 100, etiket: "Yıldız", ikon: Star },
  { kredi: 250, etiket: "Süpernova", ikon: Rocket },
];

/**
 * TikTok tarzı Süper Beğeni — kredi ile gönderilir (gerçek para değil).
 * varyant: "reels" (video-içi dikey ikon) · "feed" (aksiyon çubuğu ikonu).
 */
export function SuperLikeButon({ gonderiId, varyant = "reels" }: { gonderiId: string; varyant?: "reels" | "feed" }) {
  const s = useFlow();
  const [acik, setAcik] = useState(false);
  const gonderilen = s.superLikeler[gonderiId] ?? 0;
  const boyut = varyant === "reels" ? "h-7 w-7" : "h-6 w-6";

  const ikon = varyant === "reels" ? (
    <button onClick={() => setAcik(true)} className="flex flex-col items-center gap-1 transition-transform duration-150 hover:scale-110 active:scale-95">
      <Zap className={cn(boyut, "drop-shadow", gonderilen > 0 ? "fill-[#facc15] text-[#facc15]" : "text-white")} />
      {gonderilen > 0 && <span className="text-[12px] font-semibold text-[#facc15] drop-shadow">{sayiKisa(gonderilen)}</span>}
    </button>
  ) : (
    <button onClick={() => setAcik(true)} className="transition-transform duration-150 hover:scale-110 active:scale-95" title="Süper Beğeni (kredi)">
      <Zap className={cn(boyut, gonderilen > 0 ? "fill-[#facc15] text-[#facc15]" : "text-white/90 hover:text-white/60")} />
    </button>
  );

  return (
    <>
      {ikon}
      {acik && <SuperLikeModal gonderiId={gonderiId} kapat={() => setAcik(false)} />}
    </>
  );
}

function SuperLikeModal({ gonderiId, kapat }: { gonderiId: string; kapat: () => void }) {
  const s = useFlow();
  const { kullanici, krediDus } = useAuth();
  const [secili, setSecili] = useState<number | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const bakiye = kullanici?.krediler ?? 0;
  useScrollKilit(true);
  useEscKapat(true, kapat);

  const gonder = () => {
    if (secili == null || gonderiliyor) return;
    if (bakiye < secili) { toast.error("Yetersiz kredi. Kredi yükleyip tekrar deneyin."); return; }
    setGonderiliyor(true);
    if (!krediDus(secili)) { setGonderiliyor(false); toast.error("Yetersiz kredi"); return; }
    s.superLike(gonderiId, secili);
    const kad = KADEMELER.find((k) => k.kredi === secili);
    setTimeout(() => { toast.success(`${kad?.etiket ?? "Süper"} · ${secili} kredilik Süper Beğeni gönderildi`); kapat(); }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-4" onClick={kapat}>
      <div className="w-full max-w-[420px] overflow-hidden rounded-t-3xl bg-[#1a1a1a] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        {/* başlık */}
        <div className="relative flex items-center justify-center border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#facc15]" />
            <span className="text-[16px] font-bold">Süper Beğeni</span>
          </div>
          <button onClick={kapat} className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/[0.1]"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-5 py-5">
          <p className="mb-4 text-center text-[13px] text-white/60">Kredinle içerik üreticisini destekle. Gönderdiğin kredi ona kazanç olarak gider.</p>

          {/* kademeler */}
          <div className="grid grid-cols-5 gap-2">
            {KADEMELER.map((k) => (
              <button key={k.kredi} onClick={() => setSecili(k.kredi)}
                className={cn("flex flex-col items-center gap-1 rounded-2xl border py-3 transition-all",
                  secili === k.kredi ? "border-[#facc15] bg-[#facc15]/10 scale-105" : "border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07]")}>
                <k.ikon className={cn("h-[22px] w-[22px]", secili === k.kredi ? "text-[#facc15]" : "text-white/70")} />
                <span className="text-[13px] font-bold text-white">{k.kredi}</span>
                <span className="text-[9px] text-white/50">{k.etiket}</span>
              </button>
            ))}
          </div>

          {/* bakiye + gönder */}
          <div className="mt-5 flex items-center justify-between text-[13px]">
            <span className="text-white/60">Bakiyen: <b className="text-white">{bakiye.toLocaleString("tr-TR")} kredi</b></span>
            {secili != null && bakiye < secili && <span className="text-[#ed4956]">Yetersiz</span>}
          </div>
          <button onClick={gonder} disabled={secili == null || gonderiliyor}
            className="mt-3 w-full rounded-xl bg-[#facc15] py-3 text-[15px] font-bold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
            {gonderiliyor ? "Gönderiliyor…" : secili != null ? `${secili} kredi ile Süper Beğeni gönder` : "Bir miktar seç"}
          </button>
        </div>
      </div>
    </div>
  );
}
