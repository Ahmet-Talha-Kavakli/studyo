"use client";

/**
 * Deneme ödemesi sayfası: ödeme sağlayıcısı bağlı değilken (geliştirme ya da VAYRA_DENEME_ODEME=1) gerçek ödeme
 * sayfasının yerini alır. Kart istenmez, para çekilmez; sonuç sunucuda aynı sipariş akışından geçer.
 */
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { paraYaz } from "@/lib/odeme/katalog";
import * as O from "@/lib/odeme/istemci";
import type { SiparisOzeti } from "@/lib/odeme/tipler";
import { useAuth } from "@/store/useAuth";

export default function DenemeOdeme({ params }: { params: Promise<{ no: string }> }) {
  const { no } = use(params);
  const router = useRouter();
  const esitlendi = useAuth((s) => s.esitlendi);
  const [s, setS] = useState<SiparisOzeti | null>(null);
  const [acik, setAcik] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [is, setIs] = useState<string | null>(null);

  useEffect(() => {
    if (!esitlendi) return;
    void O.denemeSiparisi(no).then((r) => { if (r.ok) { setS(r.siparis); setAcik(r.acik); if (r.siparis.durum !== "bekliyor") router.replace(`/odeme/sonuc?s=${no}`); } else setHata(r.hata); });
  }, [no, esitlendi, router]);

  const bitir = async (sonuc: "basarili" | "basarisiz" | "iptal") => {
    setIs(sonuc);
    const r = await O.denemeSonucu(no, sonuc);
    if (!r.ok) { setIs(null); return setHata(r.hata); }
    router.replace(`/odeme/sonuc?s=${no}`);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--ust-nav))] w-full max-w-[480px] flex-col justify-center px-5 py-12">
      {!s && !hata ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-white/40" /> : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[28px] bg-[#121214] ring-1 ring-inset ring-white/[0.08]">
          <div className="border-b border-amber-400/15 bg-amber-400/[0.06] px-6 py-3 text-[13px] font-semibold text-amber-200">Deneme ödemesi</div>
          {hata ? <p className="p-6 text-[14px] text-white/70">{hata}</p> : s && (
            <div className="p-6">
              <p className="text-[13px] text-white/45">Ödenecek</p>
              <p className="mt-1 text-[34px] font-semibold tabular-nums tracking-[-0.03em] text-white">{paraYaz(s.toplam, s.para)}</p>
              <p className="mt-1 text-[14px] text-white/70">{s.ad}</p>
              <p className="mt-5 rounded-[14px] bg-white/[0.04] p-4 text-[13.5px] leading-relaxed text-white/60">
                Bu sunucuda ödeme sağlayıcısı bağlı değil. Bu sayfa akışı sınamak içindir: kart istenmez, para çekilmez. Makbuz ve sipariş "Deneme ödemesi" olarak işaretlenir.
              </p>
              {!acik && <p className="mt-3 text-[13px] text-rose-300">Deneme ödemesi bu sunucuda kapalı.</p>}
              <div className="mt-6 grid gap-2">
                <button type="button" disabled={!!is || !acik} onClick={() => void bitir("basarili")} className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-[14.5px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40">
                  {is === "basarili" && <Loader2 className="h-4 w-4 animate-spin" />}Deneme ödemesini onayla
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" disabled={!!is || !acik} onClick={() => void bitir("basarisiz")} className="h-11 rounded-full bg-white/[0.07] text-[13.5px] font-medium text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.12] disabled:opacity-40">Kart reddedilsin</button>
                  <button type="button" disabled={!!is || !acik} onClick={() => void bitir("iptal")} className="h-11 rounded-full text-[13.5px] font-medium text-white/60 hover:bg-white/[0.06] hover:text-white disabled:opacity-40">Vazgeç</button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
