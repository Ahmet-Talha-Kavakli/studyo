"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Layers, Loader2 } from "lucide-react";
import { modelBul } from "@/lib/build/modeller";
import { SIKISTIRMA_ESIGI } from "@/lib/build/sohbetBaglam";
import { cn } from "@/lib/utils";
import { Md } from "./Metin";
import { Acilir, sayi, useAcilir } from "./ortak";
import type { OzetBilgisi } from "./tipler";

/**
 * Bağlam penceresi: bestecide doluluk halkası (üzerine gelince token sayısı ve yüzde, elle özetleme) ve sohbette
 * "Önceki mesajlar özetlendi" ayracı (açılınca özet okunur). Yüzde 80'de sunucu eski mesajları kendisi özetler.
 */
const binlik = (n: number) => (n >= 1_000_000 ? `${sayi(Math.round(n / 100_000) / 10)} milyon` : n >= 10_000 ? `${sayi(Math.round(n / 1000))} bin` : sayi(n));

export function BaglamHalkasi({ token, sinir, taslak = 0, ozetle, ozetleniyor, mesajSayisi }: {
  token: number; sinir: number; taslak?: number; ozetle?: () => Promise<string | null>; ozetleniyor?: boolean; mesajSayisi: number;
}) {
  const a = useAcilir(300, "yukari");
  const kapanis = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [durum, setDurum] = useState<{ yukleniyor?: boolean; mesaj?: string; hata?: boolean }>({});
  const toplam = token + taslak;
  const oran = Math.min(1, toplam / Math.max(1, sinir));
  const yuzde = Math.min(100, Math.round(oran * 100));
  const esik = oran >= SIKISTIRMA_ESIGI;
  const renk = esik ? "#fbbf24" : "#55d6fd";
  const C = 2 * Math.PI * 7;
  useEffect(() => () => clearTimeout(kapanis.current), []);
  useEffect(() => { if (!a.acik) setDurum((d) => (d.yukleniyor ? d : {})); }, [a.acik]);
  const ac = () => { clearTimeout(kapanis.current); a.setAcik(true); };
  const kapat = () => { clearTimeout(kapanis.current); kapanis.current = setTimeout(() => a.setAcik(false), 160); };
  const ozetleTikla = async () => {
    if (!ozetle || durum.yukleniyor) return;
    setDurum({ yukleniyor: true });
    const h = await ozetle();
    setDurum(h ? { mesaj: h, hata: true } : { mesaj: "Eski mesajlar özetlendi." });
  };
  return (
    <div ref={a.kok} onMouseEnter={ac} onMouseLeave={kapat}>
      <button type="button" onClick={() => a.setAcik(!a.acik)} aria-label={`Bağlam yüzde ${yuzde} dolu`}
        className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/[0.06]", a.acik && "bg-white/[0.07]")}>
        <svg width="20" height="20" viewBox="0 0 20 20" className="-rotate-90">
          <circle cx="10" cy="10" r="7" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2.4" />
          <motion.circle cx="10" cy="10" r="7" fill="none" stroke={renk} strokeWidth="2.4" strokeLinecap="round" strokeDasharray={C}
            initial={false} animate={{ strokeDashoffset: C * (1 - Math.max(oran, 0.02)) }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </svg>
        {ozetleniyor && <span className="absolute inset-0 animate-ping rounded-full bg-[#55d6fd]/10" />}
      </button>
      <Acilir a={a}>
        <div onMouseEnter={ac} onMouseLeave={kapat} className="p-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[13px] font-semibold text-white">Bağlam penceresi</p>
            <p className="text-[12px] text-white/45">{binlik(sinir)} token sınır</p>
          </div>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.02em] tabular-nums text-white">yüzde {yuzde} <span className="text-[14px] font-normal text-white/55">dolu</span></p>
          <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div initial={false} animate={{ width: `${Math.max(2, yuzde)}%` }} className="h-full rounded-full" style={{ background: renk }} />
            <span className="absolute inset-y-0 w-px bg-white/50" style={{ left: `${SIKISTIRMA_ESIGI * 100}%` }} />
          </div>
          <dl className="mt-3 divide-y divide-white/[0.06] text-[12.5px]">
            <div className="flex justify-between py-1.5"><dt className="text-white/50">Kullanılan</dt><dd className="tabular-nums text-white">{sayi(token)} token</dd></div>
            {taslak > 0 && <div className="flex justify-between py-1.5"><dt className="text-white/50">Yazdığın taslak</dt><dd className="tabular-nums text-white">{sayi(taslak)} token</dd></div>}
            <div className="flex justify-between py-1.5"><dt className="text-white/50">Kalan</dt><dd className="tabular-nums text-white">{sayi(Math.max(0, sinir - toplam))} token</dd></div>
          </dl>
          <p className="mt-2 text-[12px] leading-snug text-white/50">{esik ? "Sınıra yaklaştın. Sıradaki mesajda eski mesajlar otomatik özetlenir; sohbet kesilmeden sürer." : "Yüzde 80'e gelince eski mesajlar otomatik özetlenir; sohbet kesilmeden sürer."}</p>
          {ozetle && mesajSayisi >= 4 && (
            <button type="button" onClick={ozetleTikla} disabled={durum.yukleniyor || ozetleniyor}
              className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.08] text-[12.5px] font-medium text-white ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.13] disabled:opacity-60">
              {durum.yukleniyor || ozetleniyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}{durum.yukleniyor || ozetleniyor ? "Özetleniyor" : "Şimdi özetle"}
            </button>
          )}
          {durum.mesaj && <p className={cn("mt-2 text-center text-[12px]", durum.hata ? "text-rose-300" : "text-[#8be6ff]")}>{durum.mesaj}</p>}
        </div>
      </Acilir>
    </div>
  );
}

/** Sohbet içindeki ince ayraç: özetlenen kısmın sonunda. */
export function OzetAyraci({ ozet, suruyor }: { ozet?: OzetBilgisi; suruyor?: boolean }) {
  const [acik, setAcik] = useState(false);
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-1">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-white/[0.08]" />
        <button type="button" disabled={!ozet} onClick={() => setAcik((x) => !x)}
          className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full bg-white/[0.04] px-3 text-[12.5px] text-white/60 ring-1 ring-inset ring-white/[0.07] transition-colors enabled:hover:bg-white/[0.08] enabled:hover:text-white">
          {suruyor ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#55d6fd]" /> : <Layers className="h-3.5 w-3.5 shrink-0 text-[#8be6ff]" />}
          <span className={cn("truncate", suruyor && "build-parilti")}>{suruyor ? "Önceki mesajlar özetleniyor" : "Önceki mesajlar özetlendi"}</span>
          {ozet && <span className="shrink-0 text-white/40 max-sm:hidden">{ozet.mesaj} mesaj</span>}
          {ozet && <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", acik && "rotate-180")} />}
        </button>
        <span className="h-px flex-1 bg-white/[0.08]" />
      </div>
      <AnimatePresence initial={false}>
        {acik && ozet && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
              <div className="max-h-[420px] overflow-y-auto pr-1 [scrollbar-width:thin] [&_*]:!text-[13.5px]"><Md metin={ozet.metin} onizle={() => {}} /></div>
              <p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[12px] text-white/45">
                {ozet.mesaj} mesaj özetlendi{ozet.once > ozet.sonra && ozet.sonra > 0 ? `; bağlam ${binlik(ozet.once)} tokenden ${binlik(ozet.sonra)} tokene indi` : ""} · {modelBul(ozet.model).ad} · {new Date(ozet.zaman).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}{ozet.elle ? " · elle" : ""}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
