"use client";

/**
 * Canvas "B · Atölye" panelleri: solda aranabilir düğüm kitaplığı (tıkla ya da tuvale sürükle), sağda tuvalin bütün
 * çıktılarının galerisi (düğüme git, sunum, toplu indir) ve tam ekran sunum görünümü.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AudioLines, ChevronDown, ChevronLeft, ChevronRight, Download, Film, FolderDown, History, Image as ImageIcon, MousePointerClick, Play, Presentation, Search, Shapes, Type, Upload, X, type LucideIcon } from "lucide-react";
import { KATALOG, PORT_AD, PORT_RENK, saydam, type DugumTanim, type DugumTur, type Kategori } from "@/lib/tuval/katalog";
import { ayarKredi } from "@/lib/tuval/ayarlar";
import type { Tuval } from "@/store/useTuval";
import { KrediJeton } from "@/components/ui/KrediHap";
import { cn } from "@/lib/utils";

export const DUGUM_SURUKLE = "application/x-vayra-dugum";
const KATEGORILER: Kategori[] = ["Girdiler", "Görsel", "Video", "Ses", "Metin", "Düzen"];
const PANEL = "absolute z-30 flex flex-col overflow-hidden rounded-[18px] bg-[var(--tv-kart)] ring-1 ring-inset ring-white/[0.09]";

/* ── Sol: düğüm kitaplığı ── */
const KAT_IKON: Record<Kategori, LucideIcon> = { Girdiler: Upload, Görsel: ImageIcon, Video: Film, Ses: AudioLines, Metin: Type, Düzen: Shapes };
const KAT_RENK: Record<Kategori, string> = { Girdiler: "#fbbf24", Görsel: PORT_RENK.gorsel, Video: PORT_RENK.video, Ses: PORT_RENK.ses, Metin: PORT_RENK.metin, Düzen: "#a3aab8" };
const SON_ANAHTAR = "vayra-tuval-son-dugum";
const sonOku = (): DugumTur[] => { try { const l = JSON.parse(localStorage.getItem(SON_ANAHTAR) ?? "[]"); return Array.isArray(l) ? l.filter((x) => x in KATALOG).slice(0, 6) : []; } catch { return []; } };
const sonYaz = (tur: DugumTur) => { try { localStorage.setItem(SON_ANAHTAR, JSON.stringify([tur, ...sonOku().filter((x) => x !== tur)].slice(0, 6))); } catch { /* depolama kapalı */ } };

function KrediHapi({ x }: { x: DugumTanim }) {
  if (!x.calisir) return null;
  const kr = ayarKredi(x.tur, x.model, {});
  return kr
    ? <span className="flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-[2px] text-[11px] font-medium tabular-nums text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.08]"><KrediJeton boyut={10} />{kr}</span>
    : <span className="shrink-0 rounded-full bg-emerald-400/10 px-1.5 py-[2px] text-[11px] font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/20">Ücretsiz</span>;
}

export function DugumKitapligi({ onEkle, onKapat }: { onEkle: (tur: DugumTur) => void; onKapat: () => void }) {
  const [q, setQ] = useState("");
  const [kat, setKat] = useState<Kategori | "Tümü">("Tümü");
  const [kapali, setKapali] = useState<Set<Kategori>>(new Set());
  const [son, setSon] = useState<DugumTur[]>([]);
  const [detay, setDetay] = useState<{ tur: DugumTur; y: number } | null>(null);
  const zaman = useRef<ReturnType<typeof setTimeout>>(undefined);
  const kok = useRef<HTMLElement>(null);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setSon(sonOku()); return () => clearTimeout(zaman.current); }, []);
  const ekle = (tur: DugumTur) => { sonYaz(tur); setSon(sonOku()); onEkle(tur); };
  const liste = useMemo(() => {
    const t = q.trim().toLocaleLowerCase("tr");
    return Object.values(KATALOG).filter((k) => (kat === "Tümü" || k.kategori === kat) && (!t || `${k.ad} ${k.alt} ${k.anahtar ?? ""}`.toLocaleLowerCase("tr").includes(t)));
  }, [q, kat]);
  const gruplar = KATEGORILER.map((k) => [k, liste.filter((x) => x.kategori === k)] as const).filter(([, l]) => l.length);
  const arama = !!q.trim();
  const ac = (tur: DugumTur, el: HTMLElement) => {
    clearTimeout(zaman.current);
    const k = kok.current?.getBoundingClientRect();
    const y = Math.min(el.getBoundingClientRect().top - (k?.top ?? 0), (k?.height ?? 600) - 290);
    zaman.current = setTimeout(() => setDetay({ tur, y }), detay ? 60 : 380);
  };
  const kapat = () => { clearTimeout(zaman.current); zaman.current = setTimeout(() => setDetay(null), 120); };
  const surukle = (e: React.DragEvent, tur: DugumTur) => { e.dataTransfer.setData(DUGUM_SURUKLE, tur); e.dataTransfer.effectAllowed = "copy"; sonYaz(tur); setDetay(null); };
  const d = detay ? KATALOG[detay.tur] : null;

  return (
    <motion.aside ref={kok} data-arayuz initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      data-yan="sol" onPointerDown={(e) => e.stopPropagation()} className="absolute bottom-3 left-3 top-[68px] z-30 w-[272px] max-md:hidden">
      <div className="flex h-full flex-col overflow-hidden rounded-[18px] bg-[var(--tv-kart)] ring-1 ring-inset ring-white/[0.09]">
        {/* Başlık + arama */}
        <div className="space-y-2.5 border-b border-white/[0.06] p-2.5">
          <div className="flex items-center gap-2 px-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-[9px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.05)" }}><Shapes className="h-3.5 w-3.5" /></span>
            <h2 className="flex-1 text-[14px] font-semibold">Düğümler</h2>
            <span className="rounded-full px-2 py-0.5 text-[11px] tabular-nums text-[var(--sc-metin-3)] ring-1 ring-inset ring-white/[0.07]">{Object.keys(KATALOG).length}</span>
            <button onClick={onKapat} aria-label="Kitaplığı gizle" title="Gizle ([)" className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--sc-metin-3)] transition hover:bg-white/[0.075] hover:text-[var(--sc-metin)] active:scale-95"><ChevronLeft className="h-4 w-4" /></button>
          </div>
          <label className="group flex h-9 items-center gap-2 rounded-[11px] px-2.5 ring-1 ring-inset ring-white/[0.07] transition focus-within:ring-white/25" style={{ background: "rgba(255,255,255,0.04)" }}>
            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--sc-metin-3)] transition group-focus-within:text-[var(--sc-metin)]" />
            <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { setQ(""); e.currentTarget.blur(); } if (e.key === "Enter" && liste[0]) ekle(liste[0].tur); }}
              placeholder="Düğüm ara" aria-label="Düğüm ara" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--sc-metin-3)]" />
            <AnimatePresence>{q && <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => setQ("")} aria-label="Aramayı temizle" className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--sc-metin-3)] hover:bg-white/[0.08]"><X className="h-3 w-3" /></motion.button>}</AnimatePresence>
          </label>
          <div className="grid grid-cols-3 gap-1">
            {KATEGORILER.map((k) => {
              const I = KAT_IKON[k]; const aktif = kat === k;
              return (
                <button key={k} onClick={() => setKat(aktif ? "Tümü" : k)} aria-pressed={aktif} title={aktif ? "Tümünü göster" : `${k} düğümleri`} className={cn("relative flex h-8 items-center justify-center gap-1.5 rounded-full px-1.5 text-[12px] ring-1 ring-inset transition active:scale-95", aktif ? "font-medium text-black ring-transparent" : "bg-white/[0.055] ring-white/[0.06] hover:bg-white/[0.085]", aktif ? "" : "text-[var(--sc-metin-2)] hover:bg-white/[0.075] hover:text-[var(--sc-metin)]")}>
                  {aktif && <motion.span layoutId="dk-kat" className="absolute inset-0 rounded-full bg-white" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} />}
                  <I className="relative h-3 w-3" style={!aktif ? { color: KAT_RENK[k] } : undefined} />
                  <span className="relative truncate">{k}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste */}
        <div data-kaydirilabilir onScroll={() => setDetay(null)} onMouseLeave={kapat} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2 [scrollbar-width:thin]">
          {!arama && kat === "Tümü" && son.length > 0 && (
            <section className="rounded-[14px] p-2 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
              <div className="flex items-center gap-1.5 px-1 pb-1.5"><History className="h-3 w-3 text-[var(--sc-metin-3)]" /><h3 className="flex-1 text-[12px] font-medium text-[var(--sc-metin-2)]">Son kullanılanlar</h3></div>
              <div className="grid grid-cols-3 gap-1">
                {son.map((tur, i) => { const x = KATALOG[tur]; const I = x.ikon; const renk = PORT_RENK[x.cikti ?? "metin"]; return (
                  <motion.button key={tur} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} draggable onDragStart={(e) => surukle(e as unknown as React.DragEvent, tur)} onClick={() => ekle(tur)} title={x.alt}
                    className="flex cursor-grab flex-col items-center gap-1 rounded-[10px] px-1 py-2 text-center transition hover:bg-white/[0.065] active:scale-[0.97] active:cursor-grabbing">
                    <span className="flex h-7 w-7 items-center justify-center rounded-[9px]" style={{ background: saydam(renk, 16), color: renk, boxShadow: `inset 0 0 0 1px ${saydam(renk, 26)}` }}><I className="h-3.5 w-3.5" /></span>
                    <span className="line-clamp-1 w-full text-[11px] text-[var(--sc-metin-2)]">{x.ad}</span>
                  </motion.button>
                ); })}
              </div>
            </section>
          )}
          {gruplar.map(([k, l], gi) => {
            const acik = arama || kat !== "Tümü" || !kapali.has(k);
            return (
              <motion.section key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(gi, 5) * 0.03, duration: 0.24 }}
                className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
                <button onClick={() => setKapali((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; })} disabled={arama || kat !== "Tümü"} aria-expanded={acik}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-white/[0.025] disabled:cursor-default disabled:hover:bg-transparent">
                  <span className="h-2 w-2 rounded-full" style={{ background: KAT_RENK[k], boxShadow: `0 0 0 3px ${saydam(KAT_RENK[k], 18)}` }} />
                  <h3 className="flex-1 text-[12.5px] font-semibold">{k}</h3>
                  <span className="rounded-full px-1.5 text-[10.5px] tabular-nums text-[var(--sc-metin-3)] ring-1 ring-inset ring-white/[0.07]">{l.length}</span>
                  {!arama && kat === "Tümü" && <motion.span animate={{ rotate: acik ? 0 : -90 }} transition={{ duration: 0.2 }}><ChevronDown className="h-3.5 w-3.5 text-[var(--sc-metin-3)]" /></motion.span>}
                </button>
                <AnimatePresence initial={false}>
                  {acik && (
                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="border-t border-white/[0.05] p-1">
                      {l.map((x) => {
                        const renk = PORT_RENK[x.cikti ?? "metin"]; const I = x.ikon;
                        return (
                          <li key={x.tur}>
                            <button draggable onDragStart={(e) => surukle(e, x.tur)} onClick={() => ekle(x.tur)} onMouseEnter={(e) => ac(x.tur, e.currentTarget)} onFocus={(e) => ac(x.tur, e.currentTarget)} onBlur={kapat}
                              className={cn("group flex w-full cursor-grab items-center gap-2.5 rounded-[10px] px-2 py-[7px] text-left transition-colors active:cursor-grabbing", detay?.tur === x.tur ? "bg-white/[0.075]" : "hover:bg-white/[0.065]")}>
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-transform duration-200 group-hover:scale-105 group-active:scale-95" style={{ background: `linear-gradient(160deg, ${saydam(renk, 24)}, ${saydam(renk, 8)})`, color: renk, boxShadow: `inset 0 0 0 1px ${saydam(renk, 26)}` }}><I className="h-4 w-4" /></span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5"><span className="truncate text-[13px] font-medium">{x.ad}</span></span>
                                <span className="line-clamp-2 text-[11.5px] leading-snug text-[var(--sc-metin-3)]">{x.alt.split(";")[0]}</span>
                              </span>
                              <KrediHapi x={x} />
                            </button>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </motion.section>
            );
          })}
          {!gruplar.length && (
            <div className="rounded-[14px] px-4 py-8 text-center ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
              <Search className="mx-auto h-4 w-4 text-[var(--sc-metin-3)]" />
              <p className="mt-2 text-[13px] font-medium">&quot;{q}&quot; için düğüm yok</p>
              <p className="mt-1 text-[12px] text-[var(--sc-metin-3)]">Başka bir kelime dene ya da kategoriyi Tümü yap.</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 border-t border-white/[0.06] px-3 py-2.5 text-[11.5px] text-[var(--sc-metin-3)]">
          <MousePointerClick className="h-3.5 w-3.5 shrink-0" /><span className="flex-1">Tıkla ya da tuvale sürükle</span>
        </div>
      </div>

      {/* Üzerine gelince ayrıntı kartı */}
      <AnimatePresence>
        {d && detay && (
          <motion.div key="detay" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0, top: Math.max(0, detay.y - 8) }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.16 }}
            onMouseEnter={() => clearTimeout(zaman.current)} onMouseLeave={kapat}
            className="pointer-events-none absolute left-[calc(100%+8px)] w-[260px] rounded-[16px] bg-[var(--tv-yukselti)] p-3.5 ring-1 ring-inset ring-white/[0.1]">
            {(() => { const renk = PORT_RENK[d.cikti ?? "metin"]; const I = d.ikon; return (
              <>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[11px]" style={{ background: `linear-gradient(160deg, ${saydam(renk, 26)}, ${saydam(renk, 8)})`, color: renk, boxShadow: `inset 0 0 0 1px ${saydam(renk, 28)}` }}><I className="h-4.5 w-4.5" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold">{d.ad}</p><p className="text-[11.5px] text-[var(--sc-metin-3)]">{d.kategori}</p></div>
                  <KrediHapi x={d} />
                </div>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-[var(--sc-metin-2)]">{d.alt}</p>
                <div className="mt-3 rounded-[12px] p-2.5 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <p className="mb-1.5 text-[11.5px] font-medium text-[var(--sc-metin-3)]">Girişler</p>
                  {d.girisler.length ? d.girisler.map((g) => (
                    <p key={g.id} className="flex items-center gap-2 py-0.5 text-[12px]"><span className="h-2 w-2 rounded-full" style={{ background: PORT_RENK[g.tip] }} /><span className="flex-1">{g.ad}</span><span className="text-[11px] text-[var(--sc-metin-3)]">{PORT_AD[g.tip]}{g.zorunlu ? ", zorunlu" : ""}</span></p>
                  )) : <p className="text-[12px] text-[var(--sc-metin-3)]">Girişi yok, akışı başlatır</p>}
                  {d.cikti && <><p className="mb-1.5 mt-2 text-[11.5px] font-medium text-[var(--sc-metin-3)]">Çıkış</p><p className="flex items-center gap-2 text-[12px]"><span className="h-2 w-2 rounded-full" style={{ background: renk }} />{PORT_AD[d.cikti]}</p></>}
                </div>
              </>
            ); })()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

/* ── Sağ: çıktılar ── */
export type Cikti = { dugum: string; ad: string; tip: "gorsel" | "video" | "ses"; url: string; poster?: string; zaman: number; demo?: boolean };
export function ciktilariTopla(t: Tuval): Cikti[] {
  return t.dugumler.flatMap((d) => d.surumler.filter((s) => s.url && (s.tip === "gorsel" || s.tip === "video" || s.tip === "ses") && !["yukle", "videoYukle", "sesYukle"].includes(d.tur))
    .map((s) => ({ dugum: d.id, ad: d.ad ?? KATALOG[d.tur].ad, tip: s.tip as Cikti["tip"], url: s.url!, poster: s.poster, zaman: s.zaman, demo: s.demo })))
    .sort((a, b) => b.zaman - a.zaman);
}

export function CiktiPaneli({ t, onOdakla, onSunum, onIndir, onKapat }: { t: Tuval; onOdakla: (did: string) => void; onSunum: (i: number) => void; onIndir: () => void; onKapat: () => void }) {
  const hepsi = useMemo(() => ciktilariTopla(t), [t]);
  const [tip, setTip] = useState<"hepsi" | Cikti["tip"]>("hepsi");
  const l = hepsi.filter((c) => tip === "hepsi" || c.tip === tip);
  const turler = (["gorsel", "video", "ses"] as const).filter((x) => hepsi.some((c) => c.tip === x));
  return (
    <motion.aside data-arayuz initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      data-yan="sag" onPointerDown={(e) => e.stopPropagation()} className={cn(PANEL, "bottom-3 right-3 top-[68px] w-[256px] max-md:bottom-[88px] max-md:left-3 max-md:w-auto")}>
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
        <p className="flex-1 text-[13.5px] font-semibold">Çıktılar</p>
        {hepsi.length > 0 && <span className="rounded-full bg-white/[0.08] px-1.5 text-[11px] tabular-nums text-[var(--sc-metin-2)]">{hepsi.length}</span>}
        <button onClick={onKapat} aria-label="Çıktıları gizle" title="Gizle (])" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--sc-metin-3)] hover:bg-white/[0.075] hover:text-[var(--sc-metin)]"><ChevronRight className="h-4 w-4" /></button>
      </div>
      {turler.length > 1 && (
        <div className="flex gap-1 border-b border-white/[0.06] px-2 py-1.5">
          {([["hepsi", "Tümü"], ...turler.map((x) => [x, x === "gorsel" ? "Görsel" : x === "video" ? "Video" : "Ses"])] as [typeof tip, string][]).map(([k, ad]) => (
            <button key={k} onClick={() => setTip(k)} className={cn("h-7 rounded-full px-2.5 text-[12px] transition", tip === k ? "bg-white font-medium text-black" : "text-[var(--sc-metin-2)] hover:bg-white/[0.075]")}>{ad}</button>
          ))}
        </div>
      )}
      <div data-kaydirilabilir className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
        {l.length ? (
          <div className="grid grid-cols-2 gap-1.5 max-md:grid-cols-3">
            {l.map((c, i) => (
              <motion.button key={`${c.dugum}-${c.zaman}-${i}`} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
                onClick={() => onOdakla(c.dugum)} onDoubleClick={() => onSunum(hepsi.indexOf(c))} title={`${c.ad}: düğüme git, çift tıkla tam ekran`}
                className="group relative aspect-square overflow-hidden rounded-[11px] bg-white/[0.055] ring-1 ring-inset ring-white/[0.06]">
                {c.tip === "ses" ? <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] text-[var(--sc-metin-3)]"><Play className="h-4 w-4" />Ses</span>
                  : c.tip === "video" && !c.poster ? <video src={c.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  // eslint-disable-next-line @next/next/no-img-element
                  : <img src={c.tip === "video" ? c.poster : c.url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]" />}
                {c.tip === "video" && <span className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60"><Play className="h-2.5 w-2.5 fill-white text-white" /></span>}
                
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/75 to-transparent px-1.5 pb-1 pt-4 text-left text-[10.5px] text-white/90 opacity-0 transition group-hover:opacity-100">{c.ad}</span>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-2 p-1">
            <div className="flex items-center gap-2.5 rounded-[14px] px-3 py-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><Presentation className="h-4 w-4 text-white" /></span>
              <span className="min-w-0 leading-tight"><span className="block text-[13px] font-semibold">Henüz çıktı yok</span><span className="mt-0.5 block text-[11.5px] text-[var(--sc-metin-3)]">Çalıştırınca ürettiklerin burada birikir</span></span>
            </div>
            {(() => {
              const ureten = t.dugumler.filter((x) => KATALOG[x.tur].calisir && KATALOG[x.tur].cikti && KATALOG[x.tur].cikti !== "metin");
              if (!ureten.length) return null;
              return (
                <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <p className="border-b border-white/[0.05] px-3 py-2 text-[11.5px] font-semibold text-[var(--sc-metin-2)]">Çıktı verecek adımlar</p>
                  <div className="p-1">
                    {ureten.map((x) => { const k = KATALOG[x.tur]; const I = k.ikon; const rk = PORT_RENK[k.cikti ?? "metin"]; return (
                      <button key={x.id} onClick={() => onOdakla(x.id)} className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left transition hover:bg-white/[0.065]">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]" style={{ background: saydam(rk, 16), color: rk }}><I className="h-3.5 w-3.5" /></span>
                        <span className="min-w-0 flex-1 truncate text-[12.5px]">{x.ad ?? k.ad}</span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--sc-metin-3)]" />
                      </button>
                    ); })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
      {hepsi.length > 0 && (
        <div className="flex gap-1.5 border-t border-white/[0.06] p-2">
          <button onClick={() => onSunum(0)} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[12.5px] font-semibold text-black"><Presentation className="h-3.5 w-3.5" />Sunum</button>
          <button onClick={onIndir} title="Tümünü indir (.zip)" aria-label="Tümünü indir" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-[var(--sc-metin)] hover:bg-white/[0.14]"><FolderDown className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </motion.aside>
  );
}

/* ── Sunum: çıktıları tam ekran sırayla göster ── */
export function Sunum({ l, baslangic, baslik, onKapat, onOdakla }: { l: Cikti[]; baslangic: number; baslik: string; onKapat: () => void; onOdakla: (did: string) => void }) {
  const [i, setI] = useState(Math.min(baslangic, Math.max(0, l.length - 1)));
  const c = l[i];
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onKapat(); }
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setI((x) => (x + 1) % l.length); }
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + l.length) % l.length);
    };
    window.addEventListener("keydown", f, true); return () => window.removeEventListener("keydown", f, true);
  }, [l.length, onKapat]);
  if (!c) return null;
  return (
    <motion.div data-arayuz initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[90] flex flex-col bg-black text-white">
      <div className="flex h-14 shrink-0 items-center gap-3 px-4">
        <p className="min-w-0 flex-1 truncate text-[14px] font-medium">{baslik}<span className="ml-2 text-white/45">{c.ad}</span></p>
        <span className="text-[12.5px] tabular-nums text-white/55">{i + 1} / {l.length}</span>
        <a href={c.url} download target="_blank" rel="noopener noreferrer" aria-label="İndir" className="flex h-9 w-9 items-center justify-center rounded-full text-white/75 hover:bg-white/[0.1]"><Download className="h-4 w-4" /></a>
        <button onClick={() => { onKapat(); onOdakla(c.dugum); }} className="h-9 rounded-full px-3 text-[13px] text-white/75 hover:bg-white/[0.1]">Düğüme git</button>
        <button onClick={onKapat} aria-label="Kapat (Esc)" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.1] hover:bg-white/20"><X className="h-4 w-4" /></button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-16 pb-4">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="flex h-full w-full items-center justify-center">
            {c.tip === "video" ? <video src={c.url} poster={c.poster} controls autoPlay loop playsInline className="max-h-full max-w-full rounded-[12px]" />
              : c.tip === "ses" ? <audio src={c.url} controls autoPlay className="w-[min(560px,90vw)]" />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={c.url} alt={c.ad} className="max-h-full max-w-full rounded-[12px] object-contain" />}
          </motion.div>
        </AnimatePresence>
        {l.length > 1 && <>
          <button onClick={() => setI((x) => (x - 1 + l.length) % l.length)} aria-label="Önceki" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.1] hover:bg-white/20"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => setI((x) => (x + 1) % l.length)} aria-label="Sonraki" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.1] hover:bg-white/20"><ChevronRight className="h-5 w-5" /></button>
        </>}
      </div>
      {l.length > 1 && (
        <div className="flex shrink-0 justify-center gap-1.5 overflow-x-auto px-4 pb-4 [scrollbar-width:none]">
          {l.map((x, k) => (
            <button key={k} onClick={() => setI(k)} className={cn("h-12 w-12 shrink-0 overflow-hidden rounded-[9px] ring-2 transition", k === i ? "ring-white" : "opacity-50 ring-transparent hover:opacity-100")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {x.tip === "ses" ? <span className="flex h-full w-full items-center justify-center bg-white/[0.1]"><Play className="h-3.5 w-3.5" /></span> : <img src={x.tip === "video" ? x.poster ?? "" : x.url} alt="" className="h-full w-full object-cover" />}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
