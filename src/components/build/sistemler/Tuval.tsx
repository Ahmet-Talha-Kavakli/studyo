"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ClipboardPaste, EyeOff, GripHorizontal, Merge, Pin, Plus, Repeat, RotateCcw, Search, Trash2, Zap } from "lucide-react";
import { ADIM_GRUPLARI, ADIM_HAZIRLARI, ADIM_TURLERI, TETIK_TURLERI, kosulCumlesi, type Adim, type AdimTuru, type Dal, type Konum, type NotKarti, type Tetikleyici } from "@/lib/build/sistemKatalog";
import type { AdimSonucu } from "@/lib/build/sistemDepo";
import { cn } from "@/lib/utils";
import { uygulamaBul } from "@/lib/build/sistemUygulama";
import { ADIM_DURUM, ADIM_IKON, TETIK_IKON, adimTuruAdi, sablonSade, sureYaz, tetikOzeti } from "./ortak";

export type Secim = { tur: "tetik"; i: number } | { tur: "adim"; id: string } | { tur: "ayar" } | null;
export type AdimDurumu = { durum: AdimSonucu["durum"]; sure?: number; tur?: number; hata?: string };
export type TuvalProps = {
  tetikler: Tetikleyici[]; adimlar: Adim[]; secim: Secim; sec: (s: Secim) => void;
  /** Verilmezse salt okunur (çalışma görünümü). */
  ekle?: (k: Konum, tur: AdimTuru, hazir?: string) => void;
  durum?: (id: string) => AdimDurumu | undefined;
  /** Salt okunurda: dal çalıştı mı (çalışmayan dallar soluk). */
  dalCalisti?: (adimId: string, dalId: string) => boolean;
  sabitler?: Set<string>;
  ozet: (a: Adim) => string;
  numara: Map<string, number>;
  /** Not kartları (yalnız düzenleyicide). */
  notlar?: NotKarti[]; notDegistir?: (l: NotKarti[]) => void;
  /** Panodaki adım ve yapıştırma yeri. */
  pano?: Adim | null; yapistir?: (k: Konum) => void;
  /** Tetik kartında sabitlenmiş deneme verisi işareti. */
  tetikSabit?: boolean;
  /** Sürüm karşılaştırması: adımın farkı (kart kenarı ve etiketi renklenir). */
  fark?: (id: string) => FarkTuru | undefined;
  /** Sürüm karşılaştırması: tetikleyici değişti. */
  tetikFark?: boolean;
};
export type FarkTuru = "eklendi" | "silindi" | "degisti" | "tasindi";
export const FARK_GORUNUM: Record<FarkTuru, { ad: string; halka: string; etiket: string; nokta: string }> = {
  eklendi: { ad: "Eklendi", halka: "ring-2 ring-emerald-400/80", etiket: "bg-emerald-400/[0.15] text-emerald-200", nokta: "bg-emerald-400" },
  silindi: { ad: "Silindi", halka: "ring-2 ring-rose-400/80", etiket: "bg-rose-500/[0.15] text-rose-200", nokta: "bg-rose-400" },
  degisti: { ad: "Değişti", halka: "ring-2 ring-amber-300/80", etiket: "bg-amber-400/[0.15] text-amber-100", nokta: "bg-amber-300" },
  tasindi: { ad: "Taşındı", halka: "ring-2 ring-[#55d6fd]/80", etiket: "bg-[#55d6fd]/[0.14] text-[#b5efff]", nokta: "bg-[#55d6fd]" },
};

const GRUP_RENK: Record<string, string> = { ai: "bg-[#55d6fd]/[0.12] text-[#8be6ff]", eylem: "bg-white/[0.08] text-white/85", akis: "bg-violet-400/[0.13] text-violet-200", veri: "bg-amber-400/[0.12] text-amber-200" };
const grupAdi = (t: AdimTuru) => ADIM_TURLERI.find((x) => x.tur === t)?.grup ?? "eylem";
const grupRengi = (t: AdimTuru) => GRUP_RENK[grupAdi(t)];
const Cizgi = ({ h = 20 }: { h?: number }) => <span className="block w-px shrink-0 bg-white/15" style={{ height: h }} />;

/* ───── Adım ekleme menüsü ───── */
function EkleMenusu({ konum, kapat, ekle, pano, yapistir }: { konum: { x: number; y: number; ust?: boolean; boy?: number }; kapat: () => void; ekle: (t: AdimTuru, hazir?: string) => void; pano?: Adim | null; yapistir?: () => void }) {
  const kok = useRef<HTMLDivElement>(null);
  const [ara, setAra] = useState("");
  const q = ara.trim().toLocaleLowerCase("tr");
  const uyar = (x: { ad: string; alt: string }) => !q || `${x.ad} ${x.alt}`.toLocaleLowerCase("tr").includes(q);
  useEffect(() => {
    const f = (e: MouseEvent) => { if (!kok.current?.contains(e.target as Node)) kapat(); };
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); };
    const z = setTimeout(() => addEventListener("mousedown", f), 0);
    addEventListener("keydown", t); addEventListener("resize", kapat);
    return () => { clearTimeout(z); removeEventListener("mousedown", f); removeEventListener("keydown", t); removeEventListener("resize", kapat); };
  }, [kapat]);
  const PI = pano ? ADIM_IKON[pano.tur] : null;
  return createPortal(
    <motion.div ref={kok} initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.14 }}
      style={{ left: konum.x, top: konum.ust ? undefined : konum.y, bottom: konum.ust ? innerHeight - konum.y : undefined, maxHeight: konum.boy }}
      className="bd-panel fixed z-[130] max-h-[min(600px,calc(100vh-24px))] w-[min(560px,calc(100vw-24px))] overflow-y-auto rounded-[18px] p-2 [scrollbar-width:thin]">
      {pano && PI && yapistir && (
        <button type="button" onClick={yapistir} className="mb-1.5 flex w-full min-w-0 items-center gap-2.5 rounded-[12px] bg-[#55d6fd]/[0.06] p-2 text-left ring-1 ring-inset ring-[#55d6fd]/20 hover:bg-[#55d6fd]/[0.1]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#55d6fd]/[0.14] text-[#8be6ff]"><ClipboardPaste className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">Kopyalanan adımı yapıştır</span><span className="flex items-center gap-1.5 truncate text-[11.5px] text-white/50"><PI className="h-3 w-3 shrink-0" /><span className="truncate">{pano.ad} · {adimTuruAdi(pano.tur)}</span></span></span>
          <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/50 max-sm:hidden">Ctrl V</span>
        </button>
      )}
      <div className="mb-1.5 flex items-center gap-2 rounded-[12px] bg-white/[0.05] px-2.5 ring-1 ring-inset ring-white/[0.07]">
        <Search className="h-3.5 w-3.5 shrink-0 text-white/40" />
        <input autoFocus value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Adım ara: Slack, döngü, CSV, onay" onKeyDown={(e) => { if (e.key === "Enter") { const t = ADIM_TURLERI.find(uyar); const h = ADIM_HAZIRLARI.find(uyar); if (t) ekle(t.tur); else if (h) ekle(h.tur, h.id); } }} className="h-9 min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/35" />
      </div>
      {ADIM_GRUPLARI.map((g) => ADIM_TURLERI.some((x) => x.grup === g.id && uyar(x)) && (
        <div key={g.id} className="mb-1 last:mb-0">
          <p className="px-2 pb-1 pt-1.5 text-[12px] font-medium text-white/45">{g.ad}</p>
          <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
            {ADIM_TURLERI.filter((x) => x.grup === g.id && uyar(x)).map((x) => { const I = ADIM_IKON[x.tur]; return (
              <button key={x.tur} type="button" onClick={() => ekle(x.tur)} className="flex min-w-0 items-center gap-2.5 rounded-[12px] p-2 text-left hover:bg-white/[0.07]">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]", GRUP_RENK[g.id])}><I className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="block text-[13px] font-medium text-white">{x.ad}</span><span title={x.alt} className="block truncate text-[11.5px] leading-snug text-white/45">{x.alt}</span></span>
              </button>
            ); })}
          </div>
        </div>
      ))}
      {ADIM_HAZIRLARI.some(uyar) && (
        <div className="mb-1 border-t border-white/[0.06] pt-1 last:mb-0">
          <p className="flex items-center gap-1.5 px-2 pb-1 pt-1.5 text-[12px] font-medium text-white/45"><Zap className="h-3 w-3" />Hazır yardımcılar</p>
          <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
            {ADIM_HAZIRLARI.filter(uyar).map((x) => { const I = ADIM_IKON[x.tur]; return (
              <button key={x.id} type="button" onClick={() => ekle(x.tur, x.id)} className="flex min-w-0 items-center gap-2.5 rounded-[12px] p-2 text-left hover:bg-white/[0.07]">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]", GRUP_RENK.veri)}><I className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="block text-[13px] font-medium text-white">{x.ad}</span><span title={x.alt} className="block truncate text-[11.5px] leading-snug text-white/45">{x.alt}</span></span>
              </button>
            ); })}
          </div>
        </div>
      )}
      {q && !ADIM_TURLERI.some(uyar) && !ADIM_HAZIRLARI.some(uyar) && <p className="px-2 py-3 text-[12.5px] text-white/45">Bu aramaya uyan adım yok. Servis eylemleri için Uygulama eylemi adımını, her API için HTTP isteğini kullan.</p>}
    </motion.div>,
    document.body,
  );
}

function EkleDugmesi({ k, p, acik, setAcik }: { k: Konum; p: TuvalProps; acik: string | null; setAcik: (s: string | null) => void }) {
  const anahtar = `${k.ebeveyn ?? "kok"}:${k.kol ?? ""}:${k.sira}`;
  const ref = useRef<HTMLButtonElement>(null);
  const [konum, setKonum] = useState<{ x: number; y: number; ust?: boolean; boy?: number } | null>(null);
  if (!p.ekle) return <Cizgi h={28} />;
  const on = acik === anahtar;
  return (
    <div className="flex flex-col items-center">
      <Cizgi h={14} />
      <button ref={ref} type="button" aria-label="Adım ekle" aria-expanded={on}
        onClick={() => { if (on) { setAcik(null); return; } const r = ref.current!.getBoundingClientRect(); const en = Math.min(560, innerWidth - 24); const ust = innerHeight - r.bottom < 420 && r.top > innerHeight - r.bottom; setKonum({ x: Math.max(12, Math.min(r.left + r.width / 2 - en / 2, innerWidth - en - 12)), y: ust ? r.top - 8 : r.bottom + 8, ust, boy: Math.max(220, Math.min(600, ust ? r.top - 20 : innerHeight - r.bottom - 20)) }); setAcik(anahtar); }}
        className={cn("flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-inset transition", on ? "bg-white text-black ring-white" : "bg-[#141416] text-white/55 ring-white/[0.12] hover:text-white hover:ring-white/30")}><Plus className="h-3.5 w-3.5" /></button>
      <Cizgi h={14} />
      <AnimatePresence>{on && konum && <EkleMenusu konum={konum} kapat={() => setAcik(null)} ekle={(t, h) => { setAcik(null); p.ekle!(k, t, h); }} pano={p.pano} yapistir={p.yapistir ? () => { setAcik(null); p.yapistir!(k); } : undefined} />}</AnimatePresence>
    </div>
  );
}

/* ───── Adım kartı ───── */
function AdimKarti({ a, p }: { a: Adim; p: TuvalProps }) {
  const I = ADIM_IKON[a.tur];
  const sec = p.secim?.tur === "adim" && p.secim.id === a.id;
  const d = p.durum?.(a.id);
  const D = d ? ADIM_DURUM[d.durum] : null;
  const no = p.numara.get(a.id);
  const fk = p.fark?.(a.id);
  const F = fk ? FARK_GORUNUM[fk] : null;
  return (
    <button type="button" data-harita={grupAdi(a.tur)} data-adim={a.id} onClick={() => p.sec({ tur: "adim", id: a.id })}
      className={cn("relative flex w-[300px] max-w-[calc(100vw-48px)] items-center gap-3 rounded-[20px] bg-[#141416] p-3 text-left ring-1 ring-inset transition", sec ? "ring-2 ring-white" : F ? F.halka : "ring-white/[0.1] hover:ring-white/25", a.kapali && "opacity-45", fk === "silindi" && "opacity-80")}>
      {(() => { const u = a.tur === "uygulama" ? uygulamaBul(a.ayar.servis) : undefined; return u ? <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] p-2", u.koyu ? "bg-black ring-1 ring-inset ring-white/15" : "bg-white", a.kapali && "opacity-50")}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={u.logo} alt={u.ad} className="max-h-full max-w-full object-contain" /></span> : <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]", a.kapali ? "bg-white/[0.06] text-white/50" : grupRengi(a.tur))}><I className="h-[18px] w-[18px]" /></span>; })()}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-white/40"><span>{no}. {ADIM_TURLERI.find((x) => x.tur === a.tur)?.ad}</span>
          {a.kapali && <span className="flex items-center gap-1 rounded-full bg-white/[0.08] px-1.5 py-px text-[10.5px] text-white/60"><EyeOff className="h-3 w-3" />Devre dışı</span>}
          {F && <span className={cn("rounded-full px-1.5 py-px text-[10.5px] font-medium", F.etiket)}>{F.ad}</span>}
          {p.sabitler?.has(a.id) && <Pin className="h-3 w-3 text-[#8be6ff]" aria-label="Sabit veri" />}
          {a.tekrar && <RotateCcw className="h-3 w-3" aria-label={`${a.tekrar.sayi} kez yeniden dener`} />}
          {a.hata !== "durdur" && <AlertTriangle className={cn("h-3 w-3", a.hata === "dal" ? "text-rose-300/80" : "")} aria-label={a.hata === "dal" ? "Hata dalı var" : a.hata === "yedek" ? "Hatada yedek çıktıyla sürer" : "Hatada devam eder"} />}
        </span>
        <span className={cn("block truncate text-[14px] font-semibold", a.kapali ? "text-white/70 line-through decoration-white/30" : "text-white")}>{a.ad}</span>
        <span className="block truncate text-[12px] text-white/50">{a.kapali ? "Çalışmada atlanır" : p.ozet(a)}</span>
      </span>
      {D && (
        <span className="flex shrink-0 flex-col items-end gap-0.5" title={d?.hata ?? D.ad}>
          <span className={cn("h-2.5 w-2.5 rounded-full", D.nokta)} />
          {p.ekle === undefined && d?.sure !== undefined && <span className="text-[10.5px] tabular-nums text-white/40">{d.tur && d.tur > 1 ? `${d.tur} tur` : sureYaz(d.sure)}</span>}
        </span>
      )}
    </button>
  );
}

function dalOzeti(a: Adim, d: Dal): string {
  if (d.yedek) return a.tur === "siniflandir" ? "Model emin değilse ya da hiçbiri uymazsa" : "Diğer dalların hiçbiri uymazsa";
  if (a.tur === "onay") return d.id === "onay" ? "Onaylanınca ya da düzenlenip onaylanınca" : "Reddedilince ya da zaman aşımında ret";
  if (a.tur === "guvenlik") return d.id === "temiz" ? "İhlal bulunmazsa" : a.ayar.ihlalSonrasi === "dur" ? "Sonra sistem durur" : a.ayar.mod === "engelle" ? "Metin engellendi, sonra devam" : "Metin maskelendi, sonra devam";
  if (a.tur === "siniflandir") return d.aciklama || "Açıklama yok";
  if (a.tur === "paralel") return d.adimlar.length ? `${d.adimlar.length} adım, öbür dallarla aynı anda` : "Boş dal";
  const l = d.kosullar ?? [];
  return l.length ? l.map((k) => kosulCumlesi(sablonSade(k.sol), k.islec, sablonSade(k.sag))).join(d.baglac === "veya" ? " ya da " : " ve ") : "Koşul yok, hep uyar";
}
function dalRengi(a: Adim, d: Dal) {
  if (d.yedek) return "bg-white/[0.06] text-white/70";
  if (a.tur === "onay") return d.id === "onay" ? "bg-emerald-400/[0.12] text-emerald-200" : "bg-rose-500/[0.12] text-rose-200";
  if (a.tur === "guvenlik") return d.id === "temiz" ? "bg-emerald-400/[0.12] text-emerald-200" : "bg-rose-500/[0.12] text-rose-200";
  if (a.tur === "paralel") return "bg-[#55d6fd]/[0.1] text-[#b5efff]";
  return "bg-violet-400/[0.12] text-violet-100";
}

/* ───── Blok (dikey liste) ───── */
function Blok({ l, ebeveyn, kol, p, acik, setAcik }: { l: Adim[]; ebeveyn?: string; kol?: string; p: TuvalProps; acik: string | null; setAcik: (s: string | null) => void }) {
  return (
    <div className="flex flex-col items-center">
      <EkleDugmesi k={{ ebeveyn, kol, sira: 0 }} p={p} acik={acik} setAcik={setAcik} />
      {l.map((a, i) => (
        <div key={a.id} className="flex flex-col items-center">
          <AdimKarti a={a} p={p} />
          {a.hata === "dal" && (
            <div className="flex flex-col items-center">
              <Cizgi h={10} />
              <div className="rounded-[22px] bg-rose-500/[0.04] px-3 pb-2 pt-2.5 ring-1 ring-inset ring-rose-400/20">
                <p className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-rose-200/90"><AlertTriangle className="h-3.5 w-3.5" />Hata olursa</p>
                <Blok l={a.hataDali ?? []} ebeveyn={a.id} kol="hata" p={p} acik={acik} setAcik={setAcik} />
                <p className="text-center text-[11.5px] text-rose-200/60">{a.hataSonrasi === "devam" ? "Sonra ana akışa devam eder" : "Sonra sistem biter"}</p>
              </div>
            </div>
          )}
          {a.tur === "dongu" && (
            <div className="flex flex-col items-center">
              <Cizgi h={10} />
              <div className="rounded-[22px] bg-violet-400/[0.035] px-3 pb-2 pt-2.5 ring-1 ring-inset ring-violet-300/20">
                <p className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-violet-200/90"><Repeat className="h-3.5 w-3.5" />Her öğe için</p>
                <Blok l={a.govde ?? []} ebeveyn={a.id} kol="govde" p={p} acik={acik} setAcik={setAcik} />
                <p className="text-center text-[11.5px] text-violet-200/60">Sonuçlar {a.ayar.topla === "metin" ? "metin olarak birleşir" : a.ayar.topla === "sayi" ? "toplanır ve ortalaması alınır" : "listede toplanır"}</p>
              </div>
            </div>
          )}
          {a.dallar && (
            <div className="flex flex-col items-center">
              <Cizgi h={14} />
              <div className="flex items-stretch">
                {a.dallar.map((d, j) => {
                  const ilk = j === 0, son = j === a.dallar!.length - 1;
                  const soluk = p.dalCalisti && !p.dalCalisti(a.id, d.id);
                  return (
                    <div key={d.id} className={cn("relative flex flex-col items-center px-3 transition-opacity", soluk && "opacity-40")}>
                      {a.dallar!.length > 1 && <span className="absolute top-0 h-px bg-white/15" style={{ left: ilk ? "50%" : 0, right: son ? "50%" : 0 }} />}
                      {a.dallar!.length > 1 && <span className="absolute bottom-0 h-px bg-white/15" style={{ left: ilk ? "50%" : 0, right: son ? "50%" : 0 }} />}
                      <Cizgi h={12} />
                      <button type="button" data-harita="dal" onClick={() => p.sec({ tur: "adim", id: a.id })} title={dalOzeti(a, d)} className={cn("max-w-[260px] rounded-[14px] px-3 py-1.5 text-center", dalRengi(a, d))}>
                        <span className="block truncate text-[12.5px] font-semibold">{d.ad}</span>
                        <span className="block truncate text-[11px] opacity-75">{dalOzeti(a, d)}</span>
                      </button>
                      <Blok l={d.adimlar} ebeveyn={a.id} kol={d.id} p={p} acik={acik} setAcik={setAcik} />
                      <span className="w-px flex-1 bg-white/15" />
                    </div>
                  );
                })}
              </div>
              <Cizgi h={10} />
              <span className="flex items-center gap-1.5 rounded-full bg-[#141416] px-3 py-1 text-[11.5px] text-white/55 ring-1 ring-inset ring-white/[0.1]"><Merge className="h-3.5 w-3.5" />{a.tur === "paralel" ? "Hepsi bitince birleşir" : "Dallar birleşir"}</span>
            </div>
          )}
          {(i < l.length - 1 || p.ekle) && <EkleDugmesi k={{ ebeveyn, kol, sira: i + 1 }} p={p} acik={acik} setAcik={setAcik} />}
        </div>
      ))}
      {!l.length && p.ekle && <span className="mb-1 rounded-full bg-[#141416] px-3 py-1 text-[11.5px] text-white/45 ring-1 ring-inset ring-white/[0.08]">{ebeveyn ? "Boş: adım eklemezsen geçilir" : "Artıya basıp ilk adımı ekle"}</span>}
      {!l.length && !p.ekle && ebeveyn && <span className="my-1 rounded-full px-3 py-1 text-[11.5px] text-white/35">Adım yok</span>}
    </div>
  );
}

/* ───── Not kartları ───── */
export const NOT_RENK: Record<NotKarti["renk"], { ad: string; kart: string; nokta: string }> = {
  sari: { ad: "Sarı", kart: "bg-[#2a2516] ring-amber-200/25", nokta: "bg-amber-300" },
  mavi: { ad: "Camgöbeği", kart: "bg-[#142229] ring-[#55d6fd]/30", nokta: "bg-[#55d6fd]" },
  mor: { ad: "Mor", kart: "bg-[#221b2c] ring-violet-300/25", nokta: "bg-violet-300" },
  gri: { ad: "Gri", kart: "bg-[#1b1c1f] ring-white/[0.14]", nokta: "bg-white/60" },
};
function NotKartiG({ n, set, sil }: { n: NotKarti; set: (n: NotKarti) => void; sil: () => void }) {
  const kok = useRef<HTMLDivElement>(null);
  const alan = useRef<HTMLTextAreaElement>(null);
  const [yer, setYer] = useState<{ x: number; y: number } | null>(null);
  const surukle = useRef<{ x: number; y: number; nx: number; ny: number; z: number } | null>(null);
  useEffect(() => { const t = alan.current; if (t) { t.style.height = "0px"; t.style.height = `${Math.min(320, Math.max(56, t.scrollHeight))}px`; } }, [n.metin]);
  const R = NOT_RENK[n.renk] ?? NOT_RENK.sari;
  const x = yer?.x ?? n.x, y = yer?.y ?? n.y;
  return (
    <motion.div ref={kok} data-harita="not" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
      style={{ left: `calc(50% + ${x}px)`, top: y }} className={cn("group absolute z-[5] w-[240px] rounded-[18px] ring-1 ring-inset", R.kart)}>
      <div className="flex h-8 cursor-grab items-center gap-1 px-2 active:cursor-grabbing" style={{ touchAction: "none" }}
        onPointerDown={(e) => { if ((e.target as HTMLElement).closest("button")) return; e.stopPropagation(); const el = kok.current!; const z = el.getBoundingClientRect().width / el.offsetWidth || 1; surukle.current = { x: e.clientX, y: e.clientY, nx: n.x, ny: n.y, z }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { const s = surukle.current; if (!s) return; setYer({ x: Math.round(s.nx + (e.clientX - s.x) / s.z), y: Math.round(s.ny + (e.clientY - s.y) / s.z) }); }}
        onPointerUp={() => { if (surukle.current && yer) set({ ...n, x: yer.x, y: yer.y }); surukle.current = null; setYer(null); }}>
        <GripHorizontal className="h-3.5 w-3.5 text-white/35" />
        <span className="flex-1" />
        {(Object.keys(NOT_RENK) as NotKarti["renk"][]).map((k) => <button key={k} type="button" onClick={() => set({ ...n, renk: k })} aria-label={`${NOT_RENK[k].ad} not`} className={cn("h-3.5 w-3.5 rounded-full opacity-0 transition group-hover:opacity-100 max-sm:opacity-100", NOT_RENK[k].nokta, n.renk === k && "ring-2 ring-white ring-offset-1 ring-offset-transparent")} />)}
        <button type="button" onClick={sil} aria-label="Notu sil" className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-white/45 opacity-0 transition hover:bg-white/[0.08] hover:text-rose-200 group-hover:opacity-100 max-sm:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      <textarea ref={alan} value={n.metin} onChange={(e) => set({ ...n, metin: e.target.value.slice(0, 2000) })} placeholder="Not yaz: bu akış ne yapıyor, neye dikkat edilmeli?" data-kaydirilabilir
        className="block w-full resize-none bg-transparent px-3.5 pb-3 text-[13px] leading-relaxed text-white/90 outline-none placeholder:text-white/35 [scrollbar-width:thin]" />
    </motion.div>
  );
}

/** Dikey akış tuvali: tetikler, adımlar, dal sütunları, döngü ve hata kutuları, not kartları. */
export function Tuval(p: TuvalProps) {
  const [acik, setAcik] = useState<string | null>(null);
  return (
    <div className="relative flex min-w-max flex-col items-center px-6 pb-24 pt-8">
      <div className="flex flex-col items-center gap-2">
        {p.tetikler.map((t, i) => { const I = TETIK_IKON[t.tur]; const sec = p.secim?.tur === "tetik" && p.secim.i === i; return (
          <button key={t.id} type="button" data-harita="tetik" onClick={() => p.sec({ tur: "tetik", i })}
            className={cn("flex w-[300px] max-w-[calc(100vw-48px)] items-center gap-3 rounded-[20px] bg-[#141416] p-3 text-left ring-1 ring-inset transition", sec ? "ring-2 ring-white" : p.tetikFark ? FARK_GORUNUM.degisti.halka : "ring-white/[0.1] hover:ring-white/25")}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><I className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#8be6ff]/80">Tetikleyici{p.tetikFark && <span className={cn("rounded-full px-1.5 py-px text-[10.5px] font-medium", FARK_GORUNUM.degisti.etiket)}>Değişti</span>}{i === 0 && p.tetikSabit && <span className="flex items-center gap-1 text-[#8be6ff]"><Pin className="h-3 w-3" />sabit test verisi</span>}</span><span className="block truncate text-[14px] font-semibold text-white">{TETIK_TURLERI.find((x) => x.tur === t.tur)?.ad}</span><span className="block truncate text-[12px] text-white/50">{tetikOzeti(t)}</span></span>
          </button>
        ); })}
      </div>
      <Blok l={p.adimlar} p={p} acik={acik} setAcik={setAcik} />
      <span className="rounded-full bg-[#141416] px-3 py-1 text-[11.5px] text-white/40 ring-1 ring-inset ring-white/[0.08]">Son</span>
      <AnimatePresence>
        {p.notDegistir && (p.notlar ?? []).map((n) => <NotKartiG key={n.id} n={n} set={(y) => p.notDegistir!((p.notlar ?? []).map((z) => (z.id === n.id ? y : z)))} sil={() => p.notDegistir!((p.notlar ?? []).filter((z) => z.id !== n.id))} />)}
      </AnimatePresence>
    </div>
  );
}
