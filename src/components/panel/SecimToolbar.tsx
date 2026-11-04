"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Upload, FolderPlus, Heart, Trash2, X, AudioLines } from "lucide-react";
import { toast } from "@/lib/toast";
import { useSecim } from "@/store/useSecim";
import { useProjeler } from "@/store/useProjeler";
import { topluIndir } from "@/lib/gercekEylem";
import { mesaj } from "@/lib/mesaj";
import { uretimGeriAl } from "./uretimGeriAl";
import { cn } from "@/lib/utils";
import { useProje } from "@/store/useSinema";
import { projeyeTasi } from "@/components/kitaplik/eylemler";

/* ============================================================
   SecimToolbar — Higgsfield "1 selected" alt-orta yüzen çubuğu (m24).
   Referans birebir: [🎵 N selected] · Download · Publish all · Add to · ♡ · 🗑 · ✕
   Kartlar seçilince belirir. Boyut higgs'e göre bir tık büyük.
   Tüm stüdyolarda ortak (görsel/video/ses).
   ============================================================ */
export function SecimToolbar({ kapsayiciRef, alttanBosluk }: {
  /** Verilirse çubuk TÜM EKRANA değil, bu elemanın yatay ortasına oturur.
      (Kullanıcı 2026-08-01: video sayfasında kartlar sağ panelde olduğu
      hâlde çubuk sayfanın ortasında duruyordu.) */
  kapsayiciRef?: React.RefObject<HTMLElement | null>;
  /** Altta yüzen komut kutusu varsa çubuk onun üstünde durur (px). */
  alttanBosluk?: number;
} = {}) {
  const secililer = useSecim((s) => s.secililer);
  const temizle = useSecim((s) => s.temizle);
  const { favoriToggle, sil, guncelle, uretimler } = useProjeler();
  const adet = secililer.length;

  /* Kapsayıcının yatay merkezini ÖLÇ — panel genişliği açılıp kapanabildiği
     için sabit bir değer yeterli değil; yeniden boyutlanmayı da dinleriz. */
  const [merkez, setMerkez] = useState<number | null>(null);
  useEffect(() => {
    const el = kapsayiciRef?.current;
    if (!el || adet === 0) return setMerkez(null);
    const olc = () => {
      const r = el.getBoundingClientRect();
      setMerkez(r.left + r.width / 2);
    };
    olc();
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    window.addEventListener("resize", olc);
    return () => { ro.disconnect(); window.removeEventListener("resize", olc); };
  }, [kapsayiciRef, adet]);

  const toplu = (fn: (id: string) => void, metin: string, aciklama?: string) => {
    secililer.forEach(fn);
    toast.success(metin, aciklama ? { description: aciklama } : undefined);
  };
  const indir = () => {
    const secili = uretimler.filter((u) => secililer.includes(u.id));
    topluIndir(secili);
  };

  const seciliUretimler = uretimler.filter((u) => secililer.includes(u.id));
  const hepsiFavori = seciliUretimler.length > 0 && seciliUretimler.every((u) => u.favori);
  const kapak = (u: (typeof uretimler)[number]) => u.gorselUrl;
  const projeler = useProje((st) => st.projeler).filter((p) => !p.klasor);
  const [klasorAcik, setKlasorAcik] = useState(false);
  useEffect(() => { if (!adet) setKlasorAcik(false); }, [adet]);
  const D = "flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition-colors active:scale-95";

  return (
    <AnimatePresence>
      {adet > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="cam-istemci fixed bottom-6 z-[90] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-0.5 whitespace-nowrap rounded-full p-1.5 pl-2"
          style={{ left: merkez ?? "50%", ...(alttanBosluk ? { bottom: alttanBosluk } : {}) }}
        >
          <span className="flex items-center gap-2 pl-0.5 pr-1">
            <span className="flex -space-x-2">
              {seciliUretimler.slice(0, 3).map((u) => {
                const g = kapak(u);
                return g
                  ? <img key={u.id} src={g} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-[#1c1d20]" />
                  : <span key={u.id} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.1] text-metin-2 ring-2 ring-[#1c1d20]"><AudioLines className="h-3.5 w-3.5" /></span>;
              })}
            </span>
            <span className="text-[13.5px] font-semibold tabular-nums text-white">{adet} seçili</span>
          </span>
          <span className="mx-1 h-6 w-px bg-white/10" />
          <button onClick={indir} className={cn(D, "text-white/75 hover:bg-white/[0.07] hover:text-white")}><Download className="h-4 w-4" />İndir</button>
          <button onClick={() => toplu((id) => guncelle(id, { yayinda: true }), `${adet} öğe yayınlandı`, "Keşfet akışında görünecek.")} className={cn(D, "text-white/75 hover:bg-white/[0.07] hover:text-white")}><Upload className="h-4 w-4" />{adet > 1 ? "Tümünü yayınla" : "Yayınla"}</button>
          <div className="relative">
            <button onClick={() => setKlasorAcik((v) => !v)} aria-expanded={klasorAcik} className={cn(D, klasorAcik ? "bg-white/[0.12] text-white" : "text-white/75 hover:bg-white/[0.07] hover:text-white")}><FolderPlus className="h-4 w-4" />Klasöre ekle</button>
            <AnimatePresence>
              {klasorAcik && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.16 }}
                  className="absolute bottom-full left-1/2 mb-3 w-64 -translate-x-1/2 overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5"><span className="text-[13px] font-semibold text-white">Klasöre ekle</span><span className="ml-auto text-[11.5px] tabular-nums text-white/45">{projeler.length}</span></div>
                  <div className="max-h-[260px] overflow-y-auto p-1.5 [scrollbar-width:thin]">
                    {projeler.map((p) => (
                      <button key={p.id} onClick={() => { projeyeTasi(secililer, p.id); setKlasorAcik(false); temizle(); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2 text-left text-[13px] text-white transition-colors hover:bg-white/[0.06]">
                        <FolderPlus className="h-4 w-4 shrink-0 text-white/55" /><span className="min-w-0 flex-1 break-words">{p.ad}</span>
                      </button>
                    ))}
                    {!projeler.length && <p className="px-2 py-2 text-[12.5px] text-white/55">Henüz klasörün yok. Kitaplık'tan bir tane oluşturabilirsin.</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => toplu((id) => { const u = seciliUretimler.find((x) => x.id === id); if (!hepsiFavori ? !u?.favori : true) favoriToggle(id); }, hepsiFavori ? "Beğeniler kaldırıldı" : `${adet} öğe beğenildi`)}
            aria-label={hepsiFavori ? "Beğeniyi kaldır" : "Beğen"} className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/[0.07] active:scale-95", hepsiFavori ? "text-rose-400" : "text-white/75 hover:text-white")}><Heart className={cn("h-4 w-4", hepsiFavori && "fill-current")} /></button>
          <button onClick={() => { const n = adet, geriAl = uretimGeriAl(secililer); secililer.forEach((id) => sil(id)); temizle(); mesaj.silindi(`${n} öğe`, geriAl); }}
            aria-label="Sil" className="flex h-9 w-9 items-center justify-center rounded-full text-rose-300 transition-colors hover:bg-rose-500/10 active:scale-95"><Trash2 className="h-4 w-4" /></button>
          <span className="mx-1 h-6 w-px bg-white/10" />
          <button onClick={temizle} aria-label="Seçimi bırak" className="flex h-9 w-9 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/[0.07] hover:text-white active:scale-95"><X className="h-4 w-4" /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
