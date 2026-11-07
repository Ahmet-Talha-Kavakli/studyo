"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BarChart3, Calculator, CalendarRange, Check, Code2, Columns3, Copy, Maximize2, PanelRight, Shapes, Wand2, Workflow, X } from "lucide-react";
import { vurgula } from "@/components/build/calisma/vurgula";
import { gorselBelgesi } from "@/lib/build/sohbetGorsel";
import { cn } from "@/lib/utils";

/**
 * Yanıt içi etkileşimli görsel (Claude görselleri, Gemini Dinamik Görünüm gibi): kum havuzlu çerçeve
 * (sandbox="allow-scripts", ayrı köken, dış ağ yok), yüksekliği içeriğe göre ayarlanır. Kartta Tam ekran,
 * Kodu gör ve Panelde aç; görselde betik hatası olursa tek tuşla düzelttirilir.
 */
const TIP: Record<string, { ad: string; I: typeof BarChart3 }> = {
  grafik: { ad: "Grafik", I: BarChart3 }, akis: { ad: "Akış şeması", I: Workflow }, hesap: { ad: "Hesaplayıcı", I: Calculator },
  karsilastirma: { ad: "Karşılaştırma", I: Columns3 }, zaman: { ad: "Zaman çizelgesi", I: CalendarRange }, diger: { ad: "Etkileşimli görsel", I: Shapes },
};

function Cerceve({ belge, baslik, tam, hata }: { belge: string; baslik: string; tam?: boolean; hata?: (m: string) => void }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [y, setY] = useState(0);
  useEffect(() => {
    const f = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow || !e.data?.vayraGorsel) return;
      if (typeof e.data.yukseklik === "number") setY(Math.min(2400, Math.max(60, e.data.yukseklik)));
      if (typeof e.data.hata === "string") hata?.(e.data.hata.slice(0, 300));
    };
    addEventListener("message", f);
    return () => removeEventListener("message", f);
  }, [hata]);
  return (
    <div className={cn("relative", tam && "h-full", !tam && !y && "h-[220px]")}>
      {!y && !tam && <div className="absolute inset-0 animate-pulse rounded-b-[16px] bg-white/[0.02]" />}
      <iframe ref={ref} title={baslik} srcDoc={belge} sandbox="allow-scripts" referrerPolicy="no-referrer"
        style={tam ? undefined : { height: y || 220 }}
        className={cn("block w-full border-0 bg-[#121315] transition-[height] duration-200", tam ? "h-full" : "", !y && !tam && "opacity-0")} />
    </div>
  );
}

export function GorselKarti({ baslik, html, tip, panelAc, duzelt }: { baslik: string; html: string; tip?: string; panelAc?: (belge: string) => void; duzelt?: (istek: string) => void }) {
  const [kod, setKod] = useState(false);
  const [tam, setTam] = useState(false);
  const [kopya, setKopya] = useState(false);
  const [hata, setHata] = useState("");
  const [hazir, setHazir] = useState(false);
  const belge = useMemo(() => gorselBelgesi(html, baslik), [html, baslik]);
  const t = TIP[tip ?? ""] ?? TIP.diger;
  useEffect(() => setHazir(true), []);
  useEffect(() => { if (!tam) return; const f = (e: KeyboardEvent) => { if (e.key === "Escape") setTam(false); }; addEventListener("keydown", f); return () => removeEventListener("keydown", f); }, [tam]);
  const dugme = "flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white";
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="@container my-3 overflow-hidden rounded-[18px] bg-[#121315] ring-1 ring-inset ring-white/[0.09]">
      <div className="flex h-11 items-center gap-1 border-b border-white/[0.06] pl-3 pr-1.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><t.I className="h-3.5 w-3.5" /></span>
        <span className="ml-1.5 min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-white">{baslik}</span></span>
        <span className="mr-1 shrink-0 text-[12px] text-white/40 @max-[700px]:hidden">{t.ad}</span>
        <button type="button" onClick={() => setTam(true)} title="Tam ekran" className={dugme}><Maximize2 className="h-3.5 w-3.5" /><span className="@max-[620px]:hidden">Tam ekran</span></button>
        <button type="button" onClick={() => setKod((x) => !x)} title="Kodu gör" className={cn(dugme, kod && "bg-white/[0.08] text-white")}><Code2 className="h-3.5 w-3.5" /><span className="@max-[620px]:hidden">{kod ? "Görseli gör" : "Kodu gör"}</span></button>
        {panelAc && <button type="button" onClick={() => panelAc(belge)} title="Panelde aç" className={dugme}><PanelRight className="h-3.5 w-3.5" /><span className="@max-[620px]:hidden">Panelde aç</span></button>}
      </div>
      <AnimatePresence initial={false} mode="wait">
        {kod ? (
          <motion.div key="kod" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
            <button type="button" onClick={() => { navigator.clipboard?.writeText(html); setKopya(true); setTimeout(() => setKopya(false), 1300); }} className="absolute right-2 top-2 z-[1] inline-flex h-7 items-center gap-1 rounded-full bg-[#1c1d20] px-2.5 text-[12px] text-white/75 ring-1 ring-inset ring-white/10 hover:text-white">{kopya ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{kopya ? "Kopyalandı" : "Kopyala"}</button>
            <pre className="kod-renk sc-kod max-h-[460px] overflow-auto bg-[#0c0d0f] p-3.5 text-[12.5px] leading-[1.6] text-white/85 [scrollbar-width:thin]"><code dangerouslySetInnerHTML={{ __html: vurgula(html, "x.html") }} /></pre>
          </motion.div>
        ) : (
          <motion.div key="gorsel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Cerceve belge={belge} baslik={baslik} hata={setHata} />
          </motion.div>
        )}
      </AnimatePresence>
      {hata && (
        <div className="flex items-center gap-2.5 border-t border-amber-300/15 bg-amber-400/[0.07] px-3.5 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-amber-100/80">Görselde bir hata var: {hata}</span>
          {duzelt && <button type="button" onClick={() => { duzelt(`"${baslik}" görselleştirmesi şu hatayı veriyor: ${hata}\n\nNedenini kısaca söyle ve gorsellestir aracıyla düzeltilmiş hâlini yeniden çiz.`); setHata(""); }} className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold text-black"><Wand2 className="h-3 w-3" />Düzelt</button>}
          <button type="button" onClick={() => setHata("")} aria-label="Gizle" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-amber-100/60 hover:bg-white/[0.06]"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
      {hazir && createPortal(
        <AnimatePresence>
          {tam && (
            <motion.div key="tam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[140] flex flex-col bg-[#0b0b0c]">
              <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 sm:px-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><t.I className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-white">{baslik}</span>
                {panelAc && <button type="button" onClick={() => { setTam(false); panelAc(belge); }} className={dugme}><PanelRight className="h-3.5 w-3.5" /><span className="max-sm:hidden">Panelde aç</span></button>}
                <button type="button" onClick={() => setTam(false)} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <div className="min-h-0 flex-1 p-2 sm:p-4"><div className="mx-auto h-full max-w-[1400px] overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]"><Cerceve belge={belge} baslik={baslik} tam /></div></div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
}
