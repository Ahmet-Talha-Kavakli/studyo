"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight, ChevronRight, Columns2, Copy, Download, FolderInput, FolderMinus, FolderPlus, Globe, Hash, Heart, ImagePlus, Keyboard, Link2, Maximize2,
  Pause, Pencil, Play, ScanSearch, RefreshCw, RotateCcw, Search, Trash2, Upload, X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useProje } from "@/store/useSinema";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { kopyala } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { aracUygula, araclarFor, ayarlarlaAcAdres, copeTasi, etiketEkle, favoriYap, indir, paylasimBaglantisi, projedenCikar, projeyeTasi, referansOlarakKullan, yayinla } from "./eylemler";
import { kartArka, tarihUzun } from "./yardimci";
import { cn } from "@/lib/utils";

function Portal({ children }: { children: React.ReactNode }) {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h ? createPortal(children, document.body) : null;
}

/** Başlık şeritli küçük kart (menü ve panel içleri). */
export function MenuKart({ baslik, sag, children, className }: { baslik: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07] [&+&]:mt-2", className)} style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[36px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">{baslik}</span>{sag}</div>
      {children}
    </section>
  );
}

const hamIstem = (u: Uretim) => ((u.meta?.hamIstem as string | undefined) || u.prompt || u.baslik || "").trim();

/* ── Bağlam menüsü ── */
export function BaglamMenusu({ u, x, y, aktifProjeId, onKapat, onAc, onAdlandir, onBenzer }: {
  u: Uretim; x: number; y: number; aktifProjeId?: string; onKapat: () => void; onAc: () => void; onAdlandir?: () => void; onBenzer?: () => void;
}) {
  const router = useRouter();
  const projeler = useProje((s) => s.projeler);
  const [alt, setAlt] = useState(false);
  const W = 244;
  const sol = typeof window === "undefined" ? x : Math.max(8, Math.min(x, window.innerWidth - W - 8));
  const ust = typeof window === "undefined" ? y : Math.max(8, Math.min(y, window.innerHeight - 560));
  const Oge = ({ ikon: I, ad, f, tehlike, sag }: { ikon: React.ElementType; ad: string; f: () => void; tehlike?: boolean; sag?: React.ReactNode }) => (
    <button role="menuitem" onClick={() => { f(); onKapat(); }} className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-left text-[13.5px] transition-colors", tehlike ? "text-rose-300 hover:bg-rose-500/10" : "text-white hover:bg-white/[0.06]")}>
      <I className={cn("h-4 w-4 shrink-0", tehlike ? "" : "text-white/60")} /><span className="flex-1">{ad}</span>{sag}
    </button>
  );
  const varyasyon = araclarFor(u).find((a) => a.id === "varyasyon")!;
  const istem = hamIstem(u);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onKapat(); } }; window.addEventListener("keydown", t, true); return () => window.removeEventListener("keydown", t, true); }, [onKapat]);
  return (
    <Portal>
      <div className="fixed inset-0 z-[95]" onClick={onKapat} onContextMenu={(e) => { e.preventDefault(); onKapat(); }} />
      <motion.div role="menu" initial={{ opacity: 0, scale: 0.96, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.14 }}
        style={{ left: sol, top: ust, width: W, transformOrigin: "top left" }} className="fixed z-[96] max-h-[calc(100vh-16px)] overflow-y-auto rounded-[16px] [scrollbar-width:none] border border-white/[0.08] bg-[#151517] p-1.5">
        <div className="mb-1 flex items-center gap-2.5 rounded-[12px] bg-white/[0.03] p-1.5 ring-1 ring-inset ring-white/[0.06]">
          <span className="h-9 w-9 shrink-0 rounded-[8px] ring-1 ring-inset ring-white/10" style={{ background: kartArka(u) }} />
          <span className="min-w-0 leading-tight"><span className="line-clamp-2 block text-[12.5px] font-semibold text-white">{u.baslik || "Üretim"}</span><span className="block text-[11.5px] text-white/50">{u.model}</span></span>
        </div>
        <Oge ikon={Maximize2} ad="Aç" f={onAc} />
        <Oge ikon={RefreshCw} ad="Yeniden oluştur" f={() => aracUygula(u, varyasyon)} />
        <Oge ikon={ArrowUpRight} ad="Ayarlarla aç" f={() => router.push(ayarlarlaAcAdres(u))} />
        <Oge ikon={ImagePlus} ad="Referans olarak kullan" f={() => { const a = referansOlarakKullan(u); if (a) router.push(a); }} />
        {istem && <Oge ikon={Copy} ad="İstemi kopyala" f={() => void kopyala(istem, "İstem kopyalandı")} />}
        {onBenzer && istem && <Oge ikon={ScanSearch} ad="Benzerlerini bul" f={onBenzer} />}
        {onAdlandir && <Oge ikon={Pencil} ad="Yeniden adlandır" f={onAdlandir} />}
        <div className="my-1 h-px bg-white/[0.06]" />
        <div className="relative" onMouseEnter={() => setAlt(true)} onMouseLeave={() => setAlt(false)}>
          <button onClick={() => setAlt((v) => !v)} aria-expanded={alt} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-left text-[13.5px] text-white hover:bg-white/[0.06]">
            <FolderInput className="h-4 w-4 text-white/60" /><span className="flex-1">Projeye taşı</span><ChevronRight className="h-3.5 w-3.5 text-white/45" />
          </button>
          <AnimatePresence>
            {alt && (
              <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                className={cn("absolute top-0 z-10 w-56 rounded-[16px] border border-white/[0.08] bg-[#151517] p-1.5", sol + W + 230 > (typeof window === "undefined" ? 0 : window.innerWidth) ? "right-full mr-1" : "left-full ml-1")}>
                <MenuKart baslik="Projeler" sag={<span className="text-[11.5px] tabular-nums text-white/45">{projeler.length}</span>}>
                  <div className="max-h-60 overflow-y-auto p-1 [scrollbar-width:thin]">
                    {projeler.map((p) => (
                      <button key={p.id} onClick={() => { projeyeTasi([u.id], p.id); onKapat(); }} className="block w-full rounded-[9px] px-2.5 py-1.5 text-left text-[13px] leading-snug text-white hover:bg-white/[0.06]">{p.ad}</button>
                    ))}
                    {!projeler.length && <p className="px-2.5 py-2 text-[12.5px] text-white/55">Henüz proje yok.</p>}
                  </div>
                  <button onClick={() => { const id = useProje.getState().projeOlustur("Yeni proje", "Genel", { kaynakStudyo: "Kitaplık" }); projeyeTasi([u.id], id); onKapat(); }}
                    className="flex w-full items-center gap-2 border-t border-white/[0.06] px-3 py-2 text-left text-[12.5px] font-medium text-white/80 hover:bg-white/[0.04] hover:text-white"><FolderPlus className="h-3.5 w-3.5" />Yeni projeye taşı</button>
                </MenuKart>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {aktifProjeId && <Oge ikon={FolderMinus} ad="Bu projeden çıkar" f={() => projedenCikar([u.id], aktifProjeId)} />}
        <Oge ikon={Heart} ad={u.favori ? "Favoriden çıkar" : "Favorile"} f={() => favoriYap([u.id], !u.favori)} />
        <div className="my-1 h-px bg-white/[0.06]" />
        <Oge ikon={Globe} ad={u.yayinda ? "Keşfet'ten kaldır" : "Keşfet'te yayınla"} f={() => yayinla([u.id], !u.yayinda)} />
        <Oge ikon={Link2} ad="Bağlantıyı kopyala" f={() => void kopyala(paylasimBaglantisi(u), "Bağlantı kopyalandı")} />
        <Oge ikon={Download} ad="İndir" f={() => indir([u])} />
        <div className="my-1 h-px bg-white/[0.06]" />
        <Oge ikon={Trash2} ad="Çöpe taşı" f={() => copeTasi([u.id])} tehlike />
      </motion.div>
    </Portal>
  );
}

/* ── Yeniden adlandırma (sağdan küçük panel değil; yerinde tek alan) ── */
export function AdDegistir({ u, onKapat }: { u: Uretim; onKapat: () => void }) {
  const [ad, setAd] = useState(u.baslik || "");
  const kaydet = () => { const y = ad.trim(); if (y && y !== u.baslik) { useProjeler.getState().guncelle(u.id, { baslik: y.slice(0, 80) }); toast.success("Ad değiştirildi", { description: y }); } onKapat(); };
  return (
    <Portal>
      <div className="perde fixed inset-0 z-[96] bg-black/50" onClick={onKapat}>
        <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 380, damping: 40 }} onClick={(e) => e.stopPropagation()}
          role="dialog" aria-label="Yeniden adlandır" className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col border-l border-white/[0.08] bg-[#151517]">
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-white"><Pencil className="h-4 w-4" /></span>
            <span className="flex-1 text-[15px] font-semibold text-white">Yeniden adlandır</span>
            <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-white active:scale-90"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 p-3">
            <MenuKart baslik="Üretim">
              <div className="flex items-center gap-3 p-2.5">
                <span className="h-14 w-14 shrink-0 rounded-[10px] ring-1 ring-inset ring-white/10" style={{ background: kartArka(u) }} />
                <span className="min-w-0 text-[12.5px] leading-snug text-white/60">{u.model} · {tarihUzun(u.olusturma)}</span>
              </div>
            </MenuKart>
            <MenuKart baslik="Ad" sag={<span className="text-[11.5px] tabular-nums text-white/45">{ad.length}/80</span>}>
              <form onSubmit={(e) => { e.preventDefault(); kaydet(); }} className="p-2">
                <input autoFocus value={ad} onChange={(e) => setAd(e.target.value.slice(0, 80))} aria-label="Yeni ad"
                  className="h-10 w-full rounded-[10px] bg-white/[0.05] px-3 text-[14px] text-white outline-none ring-1 ring-inset ring-white/[0.08] focus:ring-white/30" />
              </form>
              <p className="border-t border-white/[0.06] px-3 py-2 text-[12px] text-white/55">İndirilen dosyanın adı da bu olur.</p>
            </MenuKart>
          </div>
          <div className="border-t border-white/[0.06] p-3">
            <button onClick={kaydet} disabled={!ad.trim()} className="flex h-11 w-full items-center justify-center rounded-full bg-white text-[14px] font-semibold text-black transition active:scale-[0.98] disabled:opacity-40">Kaydet</button>
          </div>
        </motion.aside>
      </div>
    </Portal>
  );
}

/* ── Toplu işlem çubuğu ── */
export function SecimCubugu({ secilenler, toplam, copModu, aktifProjeId, onTemizle, onTumu, onKarsilastir, onGeriAl, onKaliciSil }: {
  secilenler: Uretim[]; toplam: number; copModu: boolean; aktifProjeId?: string; onTemizle: () => void; onTumu: () => void; onKarsilastir: () => void; onGeriAl: () => void; onKaliciSil: () => void;
}) {
  const projeler = useProje((s) => s.projeler);
  const [acik, setAcik] = useState<null | "proje" | "etiket">(null);
  const [etiket, setEtiket] = useState("");
  const idler = secilenler.map((u) => u.id);
  const hepsiFavori = secilenler.every((u) => u.favori);
  const mevcutEtiketler = useMemo(() => Array.from(new Set(useProjeler.getState().uretimler.flatMap((u) => u.etiketler ?? []))).slice(0, 8), [acik]); // eslint-disable-line react-hooks/exhaustive-deps
  const Btn = ({ ikon: I, ad, f, tehlike, aktif, disabled }: { ikon: React.ElementType; ad: string; f: () => void; tehlike?: boolean; aktif?: boolean; disabled?: boolean }) => (
    <button onClick={f} disabled={disabled} title={ad} aria-label={ad}
      className={cn("flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition-colors active:scale-95 disabled:opacity-35",
        tehlike ? "text-rose-300 hover:bg-rose-500/10" : aktif ? "bg-white/[0.12] text-white" : "text-white/75 hover:bg-white/[0.07] hover:text-white")}>
      <I className={cn("h-4 w-4", ad.startsWith("Favori") && hepsiFavori && "fill-rose-500 text-rose-500")} /><span className="hidden xl:inline">{ad}</span>
    </button>
  );
  const ACILIR = "absolute bottom-full left-0 mb-2 w-64 rounded-[16px] border border-white/[0.08] bg-[#151517] p-1.5";
  return (
    <Portal>
      <AnimatePresence>
        {secilenler.length > 0 && (
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="cam-istemci fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-1/2 z-[80] flex w-max max-w-[calc(100vw-16px)] -translate-x-1/2 flex-wrap items-center justify-center gap-0.5 rounded-[22px] p-1.5 sm:bottom-6 sm:flex-nowrap sm:rounded-full sm:pl-2">
            <div className="flex shrink-0 items-center gap-2 pl-1.5 pr-1">
              <div className="hidden -space-x-2 sm:flex">
                {secilenler.slice(0, 3).map((u) => <span key={u.id} className="h-7 w-7 rounded-full ring-2 ring-[#1c1d20]" style={{ background: kartArka(u) }} />)}
              </div>
              <span className="whitespace-nowrap text-[13.5px] font-semibold tabular-nums text-white">{secilenler.length} seçili</span>
              {secilenler.length < toplam && <button onClick={onTumu} className="whitespace-nowrap rounded-full px-2 py-1 text-[12.5px] font-medium text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white">Tümü ({toplam})</button>}
            </div>
            <span className="mx-1 h-6 w-px shrink-0 bg-white/10" />
            {copModu ? (
              <>
                <Btn ikon={RotateCcw} ad="Geri al" f={onGeriAl} />
                <Btn ikon={Trash2} ad="Kalıcı sil" f={onKaliciSil} tehlike />
              </>
            ) : (
              <>
                <Btn ikon={Download} ad={secilenler.length > 1 ? "ZIP indir" : "İndir"} f={() => indir(secilenler)} />
                <div className="relative shrink-0">
                  <Btn ikon={FolderInput} ad="Projeye taşı" f={() => setAcik(acik === "proje" ? null : "proje")} aktif={acik === "proje"} />
                  <AnimatePresence>
                    {acik === "proje" && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className={ACILIR}>
                        <MenuKart baslik="Projeye taşı" sag={<span className="text-[11.5px] tabular-nums text-white/45">{secilenler.length} üretim</span>}>
                          <div className="max-h-56 overflow-y-auto p-1 [scrollbar-width:thin]">
                            {projeler.map((p) => (
                              <button key={p.id} onClick={() => { projeyeTasi(idler, p.id); setAcik(null); }} className="block w-full rounded-[9px] px-2.5 py-1.5 text-left text-[13px] leading-snug text-white hover:bg-white/[0.06]">{p.ad}</button>
                            ))}
                            {!projeler.length && <p className="px-2.5 py-2 text-[12.5px] text-white/55">Henüz proje yok.</p>}
                          </div>
                          <button onClick={() => { const id = useProje.getState().projeOlustur("Yeni proje", "Genel", { kaynakStudyo: "Kitaplık" }); projeyeTasi(idler, id); setAcik(null); }}
                            className="flex w-full items-center gap-2 border-t border-white/[0.06] px-3 py-2 text-left text-[12.5px] font-medium text-white/80 hover:bg-white/[0.04] hover:text-white"><FolderPlus className="h-3.5 w-3.5" />Yeni projeye taşı</button>
                          {aktifProjeId && <button onClick={() => { projedenCikar(idler, aktifProjeId); setAcik(null); }} className="flex w-full items-center gap-2 border-t border-white/[0.06] px-3 py-2 text-left text-[12.5px] font-medium text-white/80 hover:bg-white/[0.04] hover:text-white"><FolderMinus className="h-3.5 w-3.5" />Bu projeden çıkar</button>}
                        </MenuKart>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="relative shrink-0">
                  <Btn ikon={Hash} ad="Etiketle" f={() => setAcik(acik === "etiket" ? null : "etiket")} aktif={acik === "etiket"} />
                  <AnimatePresence>
                    {acik === "etiket" && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className={ACILIR}>
                        <MenuKart baslik="Etiket ekle">
                          <form onSubmit={(e) => { e.preventDefault(); if (!etiket.trim()) return; etiketEkle(idler, etiket); setEtiket(""); setAcik(null); }} className="flex gap-1.5 p-2">
                            <input autoFocus value={etiket} onChange={(e) => setEtiket(e.target.value.slice(0, 32))} placeholder="Örnek: kampanya-ekim" aria-label="Etiket"
                              className="h-9 min-w-0 flex-1 rounded-[10px] bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/40 focus:ring-white/30" />
                            <button disabled={!etiket.trim()} className="h-9 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black disabled:opacity-40">Ekle</button>
                          </form>
                          {mevcutEtiketler.length > 0 && (
                            <div className="flex flex-wrap gap-1 border-t border-white/[0.06] p-2">
                              {mevcutEtiketler.map((e) => <button key={e} onClick={() => { etiketEkle(idler, e); setAcik(null); }} className="flex h-7 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 text-[12px] text-white/80 transition-colors hover:bg-white/[0.1] hover:text-white"><Hash className="h-3 w-3" />{e}</button>)}
                            </div>
                          )}
                        </MenuKart>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Btn ikon={Heart} ad={hepsiFavori ? "Favoriden çıkar" : "Favorile"} f={() => favoriYap(idler, !hepsiFavori)} aktif={hepsiFavori} />
                <Btn ikon={Columns2} ad="Karşılaştır" f={onKarsilastir} disabled={secilenler.length < 2 || secilenler.length > 4} />
                <Btn ikon={Globe} ad="Yayınla" f={() => yayinla(idler, true)} />
                <Btn ikon={Trash2} ad="Çöpe taşı" f={() => { copeTasi(idler); onTemizle(); }} tehlike />
              </>
            )}
            <span className="mx-1 h-6 w-px shrink-0 bg-white/10" />
            <button onClick={onTemizle} aria-label="Seçimi temizle (Esc)" title="Seçimi temizle (Esc)" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/* ── Karşılaştırma ── */
export function Karsilastir({ liste, onKapat }: { liste: Uretim[]; onKapat: () => void }) {
  useEffect(() => {
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onKapat(); } };
    window.addEventListener("keydown", t, true);
    return () => window.removeEventListener("keydown", t, true);
  }, [onKapat]);
  const satirlar: [string, (u: Uretim) => string][] = [
    ["Model", (u) => u.model], ["Oran", (u) => u.meta?.oran ?? "Yok"], ["Çözünürlük", (u) => u.meta?.cozunurluk ?? "Yok"],
    ["Süre", (u) => (u.meta?.sure ?? "Yok").replace(/(\d)\s*sn$/, "$1 sn")], ["Kredi", (u) => (u.gercek === false ? "Düşmedi" : String(u.kredi ?? 0))], ["Oluşturma", (u) => tarihUzun(u.olusturma)],
  ];
  return (
    <Portal>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Karşılaştır"
        className="fixed inset-0 z-[92] flex flex-col bg-[#0b0b0c]/95 backdrop-blur-xl">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-white"><Columns2 className="h-4 w-4" /></span>
          <p className="flex-1 text-[16px] font-semibold text-white">{liste.length} üretimi karşılaştır</p>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white transition hover:bg-white/[0.12] active:scale-90"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="mx-auto grid min-w-[720px] max-w-[1400px] gap-3" style={{ gridTemplateColumns: `repeat(${liste.length}, minmax(0,1fr))` }}>
            {liste.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex flex-col gap-2.5">
                <div className="h-[min(56vh,520px)] overflow-hidden rounded-[18px] bg-black ring-1 ring-inset ring-white/[0.08]" style={{ background: `${kartArka(u).replace("center/cover", "center/contain")}, #000` }} />
                <MenuKart baslik={u.baslik || `Üretim ${i + 1}`}>
                  <p className="px-3 py-2.5 text-[13px] leading-relaxed text-white/80">{hamIstem(u)}</p>
                </MenuKart>
                <MenuKart baslik="Ayrıntılar">
                  <dl className="divide-y divide-white/[0.05]">
                    {satirlar.map(([k, f]) => <div key={k} className="flex justify-between gap-3 px-3 py-2 text-[12.5px]"><dt className="text-white/50">{k}</dt><dd className="text-right text-white">{f(u)}</dd></div>)}
                  </dl>
                </MenuKart>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </Portal>
  );
}

/* ── Mini oynatıcı ── */
export function MiniOynatici({ u, oynuyor, ilerleme, sure, onCal, onSar, onKapat }: {
  u: Uretim; oynuyor: boolean; ilerleme: number; sure: number; onCal: () => void; onSar: (o: number) => void; onKapat: () => void;
}) {
  const m = (sn: number) => `${Math.floor(sn / 60)}:${String(Math.floor(sn % 60)).padStart(2, "0")}`;
  return (
    <Portal>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        className="cam-istemci fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-3 z-[79] flex w-[min(380px,calc(100vw-24px))] items-center gap-3 rounded-[20px] p-2.5 sm:bottom-6 sm:right-6">
        <span className="h-11 w-11 shrink-0 rounded-[10px]" style={{ background: kartArka(u) }} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[13px] font-semibold text-white" title={u.baslik}>{u.baslik || hamIstem(u)}</p>
          <div className="mt-1.5 h-1 cursor-pointer overflow-hidden rounded-full bg-white/15" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSar((e.clientX - r.left) / r.width); }}>
            <div className="h-full rounded-full bg-white" style={{ width: `${ilerleme * 100}%` }} />
          </div>
          <p className="mt-1 text-[11px] tabular-nums text-white/50">{m(ilerleme * sure)} / {sure ? m(sure) : "0:00"}</p>
        </div>
        <button onClick={onCal} aria-label={oynuyor ? "Duraklat" : "Oynat"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition active:scale-90">{oynuyor ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}</button>
        <button onClick={onKapat} aria-label="Oynatıcıyı kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
      </motion.div>
    </Portal>
  );
}

/* ── Sürükle-bırak katmanı ── */
export function BirakKatmani({ gorunur }: { gorunur: boolean }) {
  return (
    <Portal>
      <AnimatePresence>
        {gorunur && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[97] flex items-center justify-center bg-[#060607]/75 p-6 backdrop-blur-md">
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="cam-istemci flex h-full max-h-[460px] w-full max-w-[760px] flex-col items-center justify-center rounded-[32px] text-center">
              <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black"><Upload className="h-7 w-7" /></motion.span>
              <p className="mt-5 text-[24px] font-semibold tracking-[-0.02em] text-white">Kitaplığa yüklemek için bırak</p>
              <p className="mt-2 text-[14px] text-white/60">Görsel, video ya da ses: en çok 20 görsel ve 10 medya dosyası. Stüdyolarda hemen kullanılır.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/* ── Kısayollar: sağdan panel, MacBook tuş başları, gruplu ve aranabilir ── */
type Parca = string[] | { m: string };
const KISAYOL_GRUPLARI: { ad: string; ogeler: { ad: string; tus: Parca[] }[] }[] = [
  { ad: "Gezinme", ogeler: [
    { ad: "Aramaya odaklan", tus: [["/"]] },
    { ad: "Bu panel", tus: [["?"]] },
    { ad: "Kapat, seçimi bırak", tus: [["Esc"]] },
  ] },
  { ad: "Seçim", ogeler: [
    { ad: "Görünenlerin hepsini seç", tus: [["Ctrl", "A"]] },
    { ad: "Aralık seç", tus: [["Shift"], { m: "+ tıklama" }] },
    { ad: "Tek tek seç", tus: [["Ctrl"], { m: "+ tıklama" }] },
    { ad: "Kutu çizerek seç", tus: [{ m: "Boş alanda sürükle" }] },
    { ad: "Seçilenleri favorile", tus: [["F"]] },
    { ad: "Seçilenleri çöpe taşı", tus: [["Delete"]] },
  ] },
  { ad: "Ayıklama", ogeler: [
    { ad: "Seçilenlere En iyi etiketi", tus: [["1"]] },
    { ad: "Seçilenlere Düzeltilecek etiketi", tus: [["2"]] },
    { ad: "Seçilenlere Onaylandı etiketi", tus: [["3"]] },
  ] },
  { ad: "Görüntüleyici", ogeler: [
    { ad: "Önceki, sonraki", tus: [["←"], ["→"]] },
    { ad: "Favori", tus: [["F"]] },
    { ad: "İndir", tus: [["D"]] },
    { ad: "Sesi oynat, duraklat", tus: [["Boşluk"]] },
  ] },
];
const MAC: Record<string, string> = { Ctrl: "⌘", Shift: "⇧", Alt: "⌥", Enter: "↵", Delete: "⌫" };

export function KisayolSayfasi({ onKapat }: { onKapat: () => void }) {
  const [q, setQ] = useState("");
  const [mac, setMac] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)); setTimeout(() => ref.current?.focus(), 60); }, []);
  useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onKapat(); } }; window.addEventListener("keydown", f, true); return () => window.removeEventListener("keydown", f, true); }, [onKapat]);
  const gruplar = useMemo(() => {
    const t = q.trim().toLocaleLowerCase("tr");
    if (!t) return KISAYOL_GRUPLARI;
    return KISAYOL_GRUPLARI.map((g) => ({ ...g, ogeler: g.ogeler.filter((o) => `${o.ad} ${o.tus.map((p) => (Array.isArray(p) ? p.join(" ") : p.m)).join(" ")}`.toLocaleLowerCase("tr").includes(t)) })).filter((g) => g.ogeler.length);
  }, [q]);
  return (
    <Portal>
      <div className="fixed inset-0 z-[93]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="perde absolute inset-0 bg-black/50" onClick={onKapat} />
        <motion.aside role="dialog" aria-label="Klavye kısayolları" initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 380, damping: 40 }}
          className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-white/[0.08] bg-[#151517]">
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-white"><Keyboard className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-white">Kitaplık kısayolları</span><span className="block text-[12px] text-white/50">{mac ? "Mac tuşlarıyla gösteriliyor" : "Mac'te Ctrl yerine ⌘ kullan"}</span></span>
            <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-white active:scale-90"><X className="h-4 w-4" /></button>
          </div>
          <div className="px-3 pt-3">
            <label className="flex h-10 items-center gap-2 rounded-[12px] bg-white/[0.04] px-3 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/25">
              <Search className="h-4 w-4 shrink-0 text-white/50" />
              <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kısayol ara: seç, indir, Ctrl A" aria-label="Kısayol ara" className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/40" />
            </label>
          </div>
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 [scrollbar-width:thin]">
            {gruplar.map((g, gi) => (
              <motion.section key={g.ad} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.04 }}
                className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5"><h3 className="flex-1 text-[13px] font-semibold text-white">{g.ad}</h3><span className="text-[11.5px] tabular-nums text-white/45">{g.ogeler.length}</span></div>
                <ul className="divide-y divide-white/[0.05]">
                  {g.ogeler.map((o) => (
                    <li key={o.ad} className="flex min-h-[42px] items-center gap-3 px-3.5 py-2">
                      <span className="min-w-0 flex-1 text-[13px] text-white/75">{o.ad}</span>
                      <span className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                        {o.tus.map((p, i) => Array.isArray(p)
                          ? <span key={i} className="flex items-center gap-[3px]">{p.map((k) => <kbd key={k} className="text-[12px]">{mac ? MAC[k] ?? k : k}</kbd>)}</span>
                          : <span key={i} className="text-[11.5px] text-white/50">{p.m}</span>)}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))}
            {!gruplar.length && <p className="rounded-[14px] bg-white/[0.03] px-3 py-6 text-center text-[13px] text-white/55 ring-1 ring-inset ring-white/[0.07]">Bu aramaya uyan kısayol yok.</p>}
          </div>
        </motion.aside>
      </div>
    </Portal>
  );
}

/** Eski içe aktarmalar için. */
export const KISAYOLLAR: [string, string][] = KISAYOL_GRUPLARI.flatMap((g) => g.ogeler.map((o) => [o.tus.map((p) => (Array.isArray(p) ? p.join(" + ") : p.m)).join(" "), o.ad] as [string, string]));
