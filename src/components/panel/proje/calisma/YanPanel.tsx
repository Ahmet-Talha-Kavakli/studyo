"use client";

/**
 * Yandan açılan panel: yeniden adlandır, alt proje, klasör ve silme onayı ekranın ortasında
 * pencere olarak değil, sağdan kayan panelde açılır. Üst menü görünür kalır; sayfa hafifçe kararır.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, CornerDownRight, Trash2, X } from "lucide-react";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { useProje, type Proje } from "@/store/useSinema";
import { cn } from "@/lib/utils";
import { BEYAZ, GRI, MacKlasor, ease } from "./ortak";

const GIRDI = "h-11 w-full rounded-[12px] bg-white/[0.05] px-3.5 text-[14.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] transition placeholder:text-white/35 focus:bg-white/[0.07] focus:ring-white/30";
const ETIKET = "mb-1.5 block text-[12.5px] font-medium text-white/60";
const ICERIK = { gizli: { opacity: 0, y: 10 }, acik: { opacity: 1, y: 0, transition: { duration: 0.3, ease } } };
export const KLASOR_RENKLERI = ["#55d6fd", "#a78bfa", "#f472b6", "#fb923c", "#facc15", "#4ade80", "#4aa8f0", "#8e8e93"];

export function YanPanel({ baslik, ust, onKapat, children, alt, genislik = 420 }: {
  baslik: string; ust?: React.ReactNode; onKapat: () => void; children: React.ReactNode; alt?: React.ReactNode; genislik?: number;
}) {
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  return (
    <div data-yan-panel className="fixed inset-x-0 bottom-0 top-[var(--ust-nav)] z-[80]">
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/55" aria-label="Kapat" onClick={onKapat} />
      <motion.aside role="dialog" aria-label={baslik} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.34, ease }}
        style={{ width: `min(${genislik}px, 100vw)` }}
        className="absolute inset-y-0 right-0 flex flex-col border-l border-white/[0.08] bg-[#111214]">
        <header className="flex items-start gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0 flex-1">
            {ust && <p className="mb-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-white/55">{ust}</p>}
            <h2 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-white">{baslik}</h2>
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
        </header>
        <motion.div className="min-h-0 flex-1 overflow-y-auto px-5 py-5" initial="gizli" animate="acik" variants={{ acik: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } } }}>
          {Array.isArray(children) ? children.map((c, i) => <motion.div key={i} variants={ICERIK}>{c}</motion.div>) : <motion.div variants={ICERIK}>{children}</motion.div>}
        </motion.div>
        {alt && <footer className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-5 py-3.5 pb-[calc(14px+env(safe-area-inset-bottom))]">{alt}</footer>}
      </motion.aside>
    </div>
  );
}

/** Seçilen öğenin önizlemesi: klasör simgesi + ad + alt satır. */
function Onizleme({ renk, ad, alt }: { renk?: string; ad: string; alt?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
      <MacKlasor renk={renk ?? "#4aa8f0"} className="h-[34px] w-[44px]" />
      <span className="min-w-0">
        <motion.span key={ad} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="block truncate text-[15px] font-semibold text-white">{ad}</motion.span>
        {alt && <span className="block truncate text-[12.5px] text-white/55">{alt}</span>}
      </span>
    </div>
  );
}

function useOdak() {
  const r = useRef<HTMLInputElement>(null);
  useEffect(() => { const t = setTimeout(() => { r.current?.focus(); r.current?.select(); }, 260); return () => clearTimeout(t); }, []);
  return r;
}

export function AdPaneli({ ad: ilk, tur, renk, onKapat, onKaydet }: { ad: string; tur: "proje" | "klasör"; renk?: string; onKapat: () => void; onKaydet: (ad: string) => void }) {
  const [ad, setAd] = useState(ilk);
  const ref = useOdak();
  const temiz = ad.trim();
  const kaydet = () => { if (!temiz || temiz === ilk) return onKapat(); onKaydet(temiz.slice(0, 60)); };
  return (
    <YanPanel baslik="Yeniden adlandır" ust={tur === "klasör" ? "Klasör" : "Proje"} onKapat={onKapat}
      alt={<><button onClick={onKapat} className={GRI}>Vazgeç</button><button onClick={kaydet} disabled={!temiz} className={BEYAZ}><Check className="h-4 w-4" />Kaydet</button></>}>
      <Onizleme renk={renk} ad={temiz || ilk} alt={temiz && temiz !== ilk ? `Eski adı: ${ilk}` : undefined} />
      <label className="mt-5 block">
        <span className={ETIKET}>{tur === "klasör" ? "Klasör adı" : "Proje adı"}</span>
        <input ref={ref} value={ad} maxLength={60} onChange={(e) => setAd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && kaydet()} className={GIRDI} />
      </label>
      <p className="mt-2 flex justify-between text-[12px] text-white/45"><span>Enter ile kaydet, Esc ile kapat</span><span className="tabular-nums">{ad.length}/60</span></p>
    </YanPanel>
  );
}

export function SilPaneli({ baslik, ad, renk, aciklama, eylem, onKapat, onSil }: { baslik: string; ad: string; renk?: string; aciklama: string; eylem: string; onKapat: () => void; onSil: () => void }) {
  return (
    <YanPanel baslik={baslik} onKapat={onKapat}
      alt={<><button onClick={onKapat} className={GRI}>Vazgeç</button><motion.button whileTap={{ scale: 0.97 }} onClick={onSil} className="flex h-9 items-center gap-1.5 rounded-full bg-rose-500 px-3.5 text-[13px] font-semibold text-white transition hover:bg-rose-400"><Trash2 className="h-4 w-4" />{eylem}</motion.button></>}>
      <Onizleme renk={renk} ad={ad} />
      <div className="mt-4 rounded-[14px] bg-rose-500/[0.07] p-3.5 ring-1 ring-inset ring-rose-400/20">
        <p className="text-[13.5px] leading-relaxed text-rose-100/90">{aciklama}</p>
      </div>
      <p className="mt-3 text-[12.5px] text-white/50">Sildikten sonra bildirimdeki Geri al ile hemen geri getirebilirsin.</p>
    </YanPanel>
  );
}

export function KlasorPaneli({ ustAd, onKapat, onOlustur }: { ustAd?: string; onKapat: () => void; onOlustur: (ad: string, renk: string, aciklama?: string) => void }) {
  const [ad, setAd] = useState("");
  const [renk, setRenk] = useState(KLASOR_RENKLERI[0]);
  const [aciklama, setAciklama] = useState("");
  const ref = useOdak();
  const olustur = () => onOlustur(ad.trim() || "Yeni klasör", renk, aciklama.trim() || undefined);
  return (
    <YanPanel baslik={ustAd ? "Yeni alt klasör" : "Yeni klasör"} ust={ustAd && <><CornerDownRight className="h-3.5 w-3.5" />{ustAd} içinde</>} onKapat={onKapat}
      alt={<><button onClick={onKapat} className={GRI}>Vazgeç</button><button onClick={olustur} className={BEYAZ}>Oluştur</button></>}>
      <Onizleme renk={renk} ad={ad.trim() || "Yeni klasör"} alt="Klasör açıkken ürettiklerin içine düşer" />
      <label className="mt-5 block">
        <span className={ETIKET}>Ad</span>
        <input ref={ref} value={ad} maxLength={60} onChange={(e) => setAd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && olustur()} placeholder="Örneğin: Kapak denemeleri" className={GIRDI} />
      </label>
      <div className="mt-4">
        <span className={ETIKET}>Renk</span>
        <div className="flex flex-wrap gap-2">
          {KLASOR_RENKLERI.map((r) => (
            <button key={r} onClick={() => setRenk(r)} aria-label={`Renk ${r}`} aria-pressed={renk === r}
              className={cn("relative flex h-9 w-9 items-center justify-center rounded-full transition", renk === r ? "bg-white/[0.1] ring-1 ring-inset ring-white/40" : "hover:bg-white/[0.06]")}>
              <MacKlasor renk={r} kapali className="h-[15px] w-[19px]" />
            </button>
          ))}
        </div>
      </div>
      <label className="mt-4 block">
        <span className={ETIKET}>Açıklama <span className="font-normal text-white/40">(isteğe bağlı)</span></span>
        <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={3} placeholder="Bu klasörde ne var?" className={cn(GIRDI, "h-auto resize-none py-2.5")} />
      </label>
    </YanPanel>
  );
}

const ALT_TURLER = ["Kısa film", "Reklam", "Müzik videosu", "Karakter", "Belgesel", "Dizi", "Sosyal medya", "Genel"];

export function AltProjePaneli({ ust, onKapat }: { ust: Proje; onKapat: () => void }) {
  const router = useRouter();
  const [ad, setAd] = useState("");
  const [tur, setTur] = useState(ALT_TURLER.includes(ust.tur) ? ust.tur : "Genel");
  const ref = useOdak();
  const projeler = useProje((s) => s.projeler);
  const kardes = useMemo(() => projeler.filter((x) => x.ustProjeId === ust.id && !x.klasor), [projeler, ust.id]);
  const olustur = () => {
    const id = useProje.getState().projeOlustur(ad.trim() || "Yeni alt proje", tur, { ustProjeId: ust.id, renk: ust.renk, kaynakStudyo: ust.kaynakStudyo });
    onKapat();
    router.push(`/panel/projeler/${id}`);
  };
  return (
    <YanPanel baslik="Alt proje aç" ust={<><CornerDownRight className="h-3.5 w-3.5" />{ust.ad} altında</>} onKapat={onKapat}
      alt={<><button onClick={onKapat} className={GRI}>Vazgeç</button><button onClick={olustur} className={BEYAZ}>Oluştur ve aç</button></>}>
      <label className="block">
        <span className={ETIKET}>Ad</span>
        <input ref={ref} value={ad} maxLength={60} onChange={(e) => setAd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && olustur()} placeholder="Örneğin: 2. bölüm, Instagram ayağı" className={GIRDI} />
      </label>
      <div className="mt-4">
        <span className={ETIKET}>Tür</span>
        <div className="flex flex-wrap gap-1.5">
          {ALT_TURLER.map((t) => (
            <button key={t} onClick={() => setTur(t)} aria-pressed={tur === t}
              className={cn("flex h-8 items-center gap-1 rounded-full px-3 text-[13px] transition", tur === t ? "bg-white font-medium text-black" : "bg-white/[0.05] text-white/75 ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.09] hover:text-white")}>
              {tur === t && <Check className="h-3.5 w-3.5" />}{t}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <span className={ETIKET}>Konum</span>
        <div className="rounded-[16px] bg-white/[0.03] p-2 ring-1 ring-inset ring-white/[0.07]">
          <div className="flex h-8 items-center gap-2 px-1.5 text-[13.5px] text-white/80"><MacKlasor renk={ust.renk ?? "#4aa8f0"} kapali className="h-[14px] w-[18px]" /><span className="truncate">{ust.ad}</span></div>
          {kardes.slice(0, 4).map((k) => (
            <div key={k.id} className="relative flex h-8 items-center gap-2 pl-7 pr-1.5 text-[13.5px] text-white/55">
              <span aria-hidden className="absolute inset-y-0 left-[15px] w-px bg-white/[0.12]" />
              <MacKlasor renk={k.renk ?? "#4aa8f0"} kapali className="h-[13px] w-[17px]" /><span className="truncate">{k.ad}</span>
            </div>
          ))}
          <div className="relative flex h-8 items-center gap-2 rounded-[8px] bg-white/[0.07] pl-7 pr-1.5 text-[13.5px] font-medium text-white">
            <span aria-hidden className="absolute left-[15px] top-0 h-1/2 w-px bg-white/[0.12]" />
            <MacKlasor renk={ust.renk ?? "#4aa8f0"} kapali className="h-[13px] w-[17px]" /><span className="truncate">{ad.trim() || "Yeni alt proje"}</span>
            <span className="ml-auto shrink-0 rounded-full bg-white/[0.1] px-2 py-0.5 text-[11.5px] font-medium text-white/75">Yeni</span>
          </div>
        </div>
      </div>
      <p className="mt-4 text-[12.5px] leading-relaxed text-white/50">Alt projenin kendi brifi, varlıkları, elementleri ve klasörleri olur. Üyeler ve erişim ayrı yönetilir.</p>
    </YanPanel>
  );
}
