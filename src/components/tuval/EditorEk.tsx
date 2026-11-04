"use client";

import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { Coins, FileAudio, Film, Image as ImageIcon, Library, MousePointerClick, Play, Plus, Search, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjeler } from "@/store/useProjeler";
import { KATALOG, PORT_RENK, saydam, type PortTip } from "@/lib/tuval/katalog";
import type { Dugum } from "@/store/useTuval";

/**
 * Editörün yardımcı yüzeyleri: sağ tık menüsü, kitaplık çekmecesi (önceki üretimlerden tuvale ekle),
 * tuvalde arama (Ctrl F) ve büyük çalıştırmalar için maliyet onayı.
 */

/* ── Sağ tık menüsü ── */
export type MenuOge = { ad: string; ikon?: LucideIcon; kisayol?: string; f: () => void; tehlike?: boolean; devre?: boolean } | "ayrac";

export function BaglamMenu({ x, y, ogeler, ust, onKapat }: { x: number; y: number; ogeler: MenuOge[]; ust?: React.ReactNode; onKapat: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState({ x, y, hazir: false });
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    setK({ x: Math.max(8, Math.min(x, window.innerWidth - w - 8)), y: Math.max(8, Math.min(y, window.innerHeight - h - 8)), hazir: true });
  }, [x, y]);
  useEffect(() => {
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t);
  }, [onKapat]);
  return (
    <motion.div ref={ref} data-arayuz role="menu" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
      onPointerDown={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}
      className="fixed z-[60] max-h-[calc(100vh-16px)] w-[240px] origin-top-left overflow-y-auto rounded-[14px] bg-[var(--tv-yukselti)] p-1.5 ring-1 ring-white/[0.1] [scrollbar-width:thin]" style={{ left: k.x, top: k.y, visibility: k.hazir ? "visible" : "hidden" }}>
      {ust}
      {ogeler.map((o, i) => o === "ayrac" ? <div key={i} className="mx-1 my-1 h-px bg-white/[0.085]" /> : (
        <button key={o.ad} role="menuitem" disabled={o.devre} onClick={() => { onKapat(); o.f(); }}
          className={cn("flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-left text-[13px] hover:bg-white/[0.075] disabled:pointer-events-none disabled:opacity-35", o.tehlike && "text-rose-300 hover:bg-rose-400/10")}>
          {o.ikon ? <o.ikon className="h-4 w-4 shrink-0 opacity-80" /> : <span className="w-4" />}
          <span className="flex-1">{o.ad}</span>
          {o.kisayol && <span className="text-[11.5px] text-[var(--sc-metin-3)]">{o.kisayol}</span>}
        </button>
      ))}
    </motion.div>
  );
}

/* ── Kitaplık çekmecesi ── */
export type Varlik = { id: string; tip: Exclude<PortTip, "metin">; url: string; poster?: string; ad: string; demo: boolean };
const cssAdres = (s?: string) => { if (!s) return undefined; const m = s.match(/url\(["']?([^"')]+)["']?\)/); if (m) return m[1]; return /^(https?:|data:|\/)/.test(s) ? s : undefined; };

export function Varliklar({ onEkle, onKapat }: { onEkle: (v: Varlik) => void; onKapat: () => void }) {
  const uretimler = useProjeler((s) => s.uretimler);
  const [sekme, setSekme] = useState<Varlik["tip"]>("gorsel");
  const [ara, setAra] = useState("");
  const liste = useMemo<Varlik[]>(() => {
    const goruldu = new Set<string>();
    return uretimler.filter((u) => u.durum === "tamam").flatMap((u): Varlik[] => {
      const demo = !u.gercek; const ad = u.baslik || u.prompt?.slice(0, 40) || "Üretim";
      if (u.videoUrl) return [{ id: u.id, tip: "video", url: u.videoUrl, poster: cssAdres(u.gorselUrl), ad, demo }];
      if (u.sesUrl) return [{ id: u.id, tip: "ses", url: u.sesUrl, ad, demo }];
      if (u.tur === "gorsel") { const g = cssAdres(u.gorselUrl); return g ? [{ id: u.id, tip: "gorsel", url: g, ad, demo }] : []; }
      return [];
    }).filter((v) => { if (goruldu.has(v.url)) return false; goruldu.add(v.url); return true; }); // aynı dosyanın tekrarları bir kez
  }, [uretimler]);
  const sayi = (t: Varlik["tip"]) => liste.filter((v) => v.tip === t).length;
  const gorunen = liste.filter((v) => v.tip === sekme && (!ara.trim() || v.ad.toLocaleLowerCase("tr").includes(ara.trim().toLocaleLowerCase("tr"))));
  const SEK: [Varlik["tip"], string, LucideIcon][] = [["gorsel", "Görsel", ImageIcon], ["video", "Video", Film], ["ses", "Ses", FileAudio]];
  const surukle = (e: React.DragEvent, v: Varlik) => { e.dataTransfer.setData("application/x-vayra-varlik", JSON.stringify(v)); e.dataTransfer.effectAllowed = "copy"; };

  return (
    <motion.aside data-arayuz data-yan="sol" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()} aria-label="Varlıklar"
      className="absolute bottom-3 left-3 top-[68px] z-40 flex w-[272px] flex-col overflow-hidden rounded-[18px] bg-[var(--tv-kart)] ring-1 ring-inset ring-white/[0.09] max-md:inset-x-2 max-md:bottom-2 max-md:top-auto max-md:max-h-[64vh] max-md:w-auto">
      <div className="space-y-2.5 border-b border-white/[0.06] p-2.5">
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-[9px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.05)" }}><Library className="h-3.5 w-3.5" /></span>
          <div className="min-w-0 flex-1"><h2 className="text-[14px] font-semibold leading-4">Varlıklar</h2><p className="text-[11px] leading-4 text-[var(--sc-metin-3)]">Önceki üretimlerin</p></div>
          <span className="rounded-full px-2 py-0.5 text-[11px] tabular-nums text-[var(--sc-metin-3)] ring-1 ring-inset ring-white/[0.07]">{liste.length}</span>
          <button onClick={onKapat} aria-label="Kapat" title="Kapat (L)" className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--sc-metin-3)] transition hover:bg-white/[0.075] hover:text-[var(--sc-metin)] active:scale-95"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-[11px] p-1 ring-1 ring-inset ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.03)" }}>
          {SEK.map(([id, ad, I]) => { const aktif = sekme === id; return (
            <button key={id} onClick={() => setSekme(id)} aria-pressed={aktif} className={cn("relative flex h-7 items-center justify-center gap-1.5 rounded-[8px] text-[12px] transition-colors active:scale-95", aktif ? "font-medium text-black" : "text-[var(--sc-metin-3)] hover:text-[var(--sc-metin)]")}>
              {aktif && <motion.span layoutId="vr-sekme" className="absolute inset-0 rounded-[8px] bg-white" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
              <I className="relative h-3.5 w-3.5" style={{ color: aktif ? undefined : PORT_RENK[id] }} /><span className="relative">{ad}</span><span className={cn("relative text-[10.5px] tabular-nums", aktif ? "text-black/55" : "opacity-70")}>{sayi(id)}</span>
            </button>
          ); })}
        </div>
        <label className="group flex h-9 items-center gap-2 rounded-[11px] px-2.5 ring-1 ring-inset ring-white/[0.07] transition focus-within:ring-white/25" style={{ background: "rgba(255,255,255,0.04)" }}>
          <Search className="h-3.5 w-3.5 text-[var(--sc-metin-3)] transition group-focus-within:text-[var(--sc-metin)]" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Varlıklarda ara" aria-label="Varlıklarda ara" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--sc-metin-3)]" />
        </label>
      </div>

      <div data-kaydirilabilir className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
        {!gorunen.length ? (
          <div className="rounded-[14px] px-4 py-8 text-center ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
            {(() => { const I = SEK.find((s) => s[0] === sekme)![2]; return <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-[12px]" style={{ background: saydam(PORT_RENK[sekme], 14), color: PORT_RENK[sekme] }}><I className="h-4.5 w-4.5" /></span>; })()}
            <p className="mt-3 text-[13px] font-medium">{ara ? "Eşleşen varlık yok" : `Henüz ${sekme === "gorsel" ? "görsel" : sekme === "video" ? "video" : "ses"} üretmedin`}</p>
            <p className="mt-1 text-[12px] leading-snug text-[var(--sc-metin-3)]">{ara ? "Başka bir kelime dene." : "Stüdyolarda ya da bu tuvalde ürettiklerin burada birikir."}</p>
          </div>
        ) : sekme === "ses" ? (
          <ul className="space-y-1">
            {gorunen.slice(0, 120).map((v, i) => (
              <motion.li key={v.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.025 }}>
                <button draggable onDragStart={(e) => surukle(e, v)} onClick={() => onEkle(v)} title={`${v.ad}: tuvale ekle`}
                  className="group flex w-full cursor-grab items-center gap-2.5 rounded-[12px] px-2 py-2 text-left ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.055] hover:ring-white/[0.12] active:scale-[0.99] active:cursor-grabbing" style={{ background: "rgba(255,255,255,0.025)" }}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]" style={{ background: saydam(PORT_RENK.ses, 16), color: PORT_RENK.ses }}><Play className="h-3 w-3 fill-current" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium">{v.ad}</span>
                    <span className="mt-1 flex h-3 items-end gap-[2px]">{Array.from({ length: 22 }, (_, k) => <span key={k} className="w-[2px] rounded-full transition-colors group-hover:bg-[var(--sc-metin-2)]" style={{ height: `${30 + ((k * 37 + v.id.length * 13) % 70)}%`, background: "rgba(255,255,255,0.22)" }} />)}</span>
                  </span>
                  
                </button>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {gorunen.slice(0, 120).map((v, i) => (
              <motion.button key={v.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i, 12) * 0.025, duration: 0.22 }}
                draggable onDragStart={(e) => surukle(e as unknown as React.DragEvent, v)} onClick={() => onEkle(v)} title={`${v.ad}: tuvale ekle`}
                className="group relative aspect-square cursor-grab overflow-hidden rounded-[12px] text-left ring-1 ring-inset ring-white/[0.06] transition hover:ring-white/25 active:scale-[0.97] active:cursor-grabbing" style={{ background: "rgba(255,255,255,0.03)" }}>
                <span className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.06]" style={{ backgroundImage: v.poster || v.tip === "gorsel" ? `url("${v.poster ?? v.url}")` : undefined }} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                {v.tip === "video" && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm"><Play className="h-2.5 w-2.5 fill-white text-white" /></span>}
                <span className="absolute inset-x-1.5 bottom-1.5 flex translate-y-1 items-center gap-1 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-white">{v.ad}</span>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-black"><Plus className="h-3 w-3" strokeWidth={2.6} /></span>
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 border-t border-white/[0.06] px-3 py-2.5 text-[11.5px] text-[var(--sc-metin-3)]">
        <MousePointerClick className="h-3.5 w-3.5" /><span className="flex-1">Tıkla ya da tuvale sürükle</span>
      </div>
    </motion.aside>
  );
}

/* ── Tuvalde ara ── */
export function AramaKutusu({ dugumler, onSec, onKapat }: { dugumler: Dugum[]; onSec: (id: string) => void; onKapat: () => void }) {
  const [q, setQ] = useState(""); const [i, setI] = useState(0);
  const sonuc = useMemo(() => {
    const k = q.trim().toLocaleLowerCase("tr"); if (!k) return [];
    return dugumler.filter((d) => [d.ad, KATALOG[d.tur].ad, d.metin, d.model, String(d.ayar.sesAd ?? "")].some((s) => s?.toLocaleLowerCase("tr").includes(k)));
  }, [q, dugumler]);
  useEffect(() => { setI(0); }, [q]);
  useEffect(() => { if (sonuc[i]) onSec(sonuc[i].id); }, [i, sonuc]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <motion.div data-arayuz initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} onPointerDown={(e) => e.stopPropagation()}
      className="absolute left-1/2 top-[68px] z-40 w-[min(420px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-[14px] bg-[var(--tv-yukselti)] ring-1 ring-white/[0.1]">
      <div className="flex items-center gap-2 px-3">
        <Search className="h-4 w-4 text-[var(--sc-metin-3)]" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Düğüm, istem, model ya da ses ara" aria-label="Tuvalde ara"
          onKeyDown={(e) => { if (e.key === "Escape") onKapat(); if (e.key === "Enter" && sonuc.length) { e.preventDefault(); setI((v) => (v + (e.shiftKey ? sonuc.length - 1 : 1)) % sonuc.length); } }}
          className="h-11 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[var(--sc-metin-3)]" />
        {q && <span className="text-[12px] tabular-nums text-[var(--sc-metin-3)]">{sonuc.length ? `${i + 1}/${sonuc.length}` : "0"}</span>}
        <button onClick={onKapat} aria-label="Aramayı kapat" className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--sc-metin-3)] hover:bg-white/[0.075]"><X className="h-3.5 w-3.5" /></button>
      </div>
      {sonuc.length > 0 && (
        <ul data-kaydirilabilir className="max-h-[260px] overflow-y-auto border-t border-white/[0.06] p-1 [scrollbar-width:thin]">
          {sonuc.map((d, j) => { const tn = KATALOG[d.tur]; const c = tn.cikti; return (
            <li key={d.id}><button onClick={() => setI(j)} className={cn("flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-1.5 text-left text-[13px]", j === i ? "bg-white/[0.08]" : "hover:bg-white/[0.065]")}>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c ? PORT_RENK[c] : "#8693a5" }} />
              <span className="shrink-0">{d.ad ?? tn.ad}</span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--sc-metin-3)]">{d.metin || d.model || ""}</span>
            </button></li>); })}
        </ul>
      )}
    </motion.div>
  );
}

/* ── Büyük çalıştırma onayı ── */
export type OnaySatir = { id: string; ad: string; tur: Dugum["tur"]; kredi: number; adet: number };

export function CalistirOnay({ satirlar, bakiye, onOnay, onKapat }: { satirlar: OnaySatir[]; bakiye: number; onOnay: () => void; onKapat: () => void }) {
  const toplam = satirlar.reduce((s, x) => s + x.kredi, 0);
  const yetersiz = toplam > bakiye;
  return (
    <div data-arayuz className="fixed inset-0 z-[70] flex items-center justify-center p-4" onPointerDown={(e) => e.stopPropagation()}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde absolute inset-0 bg-black/60" onClick={onKapat} />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} role="dialog" aria-label="Çalıştırma onayı" className="relative w-full max-w-[460px] rounded-[20px] bg-[var(--tv-kart)] p-5 ring-1 ring-white/[0.1]">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-amber-300/12 text-amber-300"><Coins className="h-4.5 w-4.5" /></span>
          <div className="flex-1"><h2 className="text-[16px] font-semibold">{satirlar.length} adım çalışacak</h2><p className="mt-0.5 text-[13px] text-[var(--sc-metin-3)]">Toplam <b className="tabular-nums text-[var(--sc-metin)]">{toplam.toLocaleString("tr")}</b> kredi · bakiyen {bakiye.toLocaleString("tr")}</p></div>
        </div>
        <ul data-kaydirilabilir className="mt-4 max-h-[260px] space-y-1 overflow-y-auto [scrollbar-width:thin]">
          {satirlar.map((s) => { const c = KATALOG[s.tur].cikti; return (
            <li key={s.id} className="flex items-center gap-2.5 rounded-[10px] bg-white/[0.045] px-3 py-2 text-[13px]">
              <span className="h-2 w-2 rounded-full" style={{ background: c ? PORT_RENK[c] : "#8693a5" }} />
              <span className="flex-1 truncate">{s.ad}{s.adet > 1 && <span className="text-[var(--sc-metin-3)]"> ×{s.adet}</span>}</span>
              <span className="tabular-nums text-[var(--sc-metin-2)]">{s.kredi ? `${s.kredi} kredi` : "Ücretsiz"}</span>
            </li>); })}
        </ul>
        {yetersiz && <p className="mt-3 text-[12.5px] text-rose-300">Kredin yetmiyor; {(toplam - bakiye).toLocaleString("tr")} kredi eksik.</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onKapat} className="h-9 rounded-full px-4 text-[13px] text-[var(--sc-metin-2)] hover:bg-white/[0.065]">Vazgeç</button>
          <button onClick={onOnay} disabled={yetersiz} autoFocus className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40"><Play className="h-3.5 w-3.5 fill-current" />Çalıştır</button>
        </div>
      </motion.div>
    </div>
  );
}
