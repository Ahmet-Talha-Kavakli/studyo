"use client";

import { useEffect, useRef, useState } from "react";
import { KrediJeton } from "@/components/ui/KrediHap";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUp, Check, CheckCircle2, ChevronDown, CircleDashed, Clock, Download, Loader2, MessageSquare, RotateCcw, SkipForward, Trash2, X, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { KATALOG, PORT_RENK } from "@/lib/tuval/katalog";
import { Sahne, type Gorunum as SahneGorunum } from "@/components/studyo/ucboyut/Sahne";
import type { CalismaKaydi, Yorum } from "@/store/useTuval";

/**
 * Editörün ikinci grup yüzeyleri: 3D model görüntüleyici, çalıştırma geçmişi, yorumlar (iğne, balon, panel).
 */

/* ── 3D görüntüleyici ── */
export function Gorunum3D({ glb, poster, ad, onKapat }: { glb: string; poster?: string; ad: string; onKapat: () => void }) {
  const [gorunum, setGorunum] = useState<SahneGorunum>("doku");
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);
  return (
    <div data-arayuz className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde absolute inset-0 bg-black/75" onClick={onKapat} />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} role="dialog" aria-label="3D model"
        className="relative flex h-[min(760px,calc(100dvh-24px))] w-full max-w-[980px] flex-col overflow-hidden rounded-[20px] bg-[var(--tv-kart)] ring-1 ring-white/[0.1]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{ad}</h2>
          <div className="flex rounded-full bg-white/[0.065] p-1">
            {([["doku", "Dokulu"], ["kil", "Kil"], ["tel", "Tel kafes"]] as const).map(([k, a]) => <button key={k} onClick={() => setGorunum(k)} aria-pressed={gorunum === k} className={cn("rounded-full px-3 py-1 text-[12.5px]", gorunum === k ? "bg-white/[0.1] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)]")}>{a}</button>)}
          </div>
          <a href={glb} download target="_blank" rel="noopener noreferrer" className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] hover:bg-white/[0.075]"><Download className="h-3.5 w-3.5" />GLB</a>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.075]"><X className="h-4 w-4" /></button>
        </div>
        <div className="relative min-h-0 flex-1 bg-[var(--tv-zemin)]"><Sahne glb={glb} poster={poster} gorunum={gorunum} isik="studyo" donme className="absolute inset-0" /></div>
      </motion.div>
    </div>
  );
}

/* ── Çalıştırma geçmişi ── */
const sure = (ms: number) => (ms < 1000 ? `${ms} ms` : ms < 60000 ? `${(ms / 1000).toFixed(1).replace(".", ",")} sn` : `${Math.floor(ms / 60000)} dk ${Math.round((ms % 60000) / 1000)} sn`);
const ADIM_IKON = { sirada: CircleDashed, calisiyor: Loader2, bitti: CheckCircle2, hata: AlertTriangle, atlandi: SkipForward } as const;
const ADIM_RENK = { sirada: "text-[var(--sc-metin-3)]", calisiyor: "text-[var(--tv-aksan)]", bitti: "text-emerald-400", hata: "text-rose-300", atlandi: "text-[var(--sc-metin-3)]" } as const;

export function GecmisPaneli({ kayitlar, onSec, onYeniden, onTemizle, onKapat }: { kayitlar: CalismaKaydi[]; onSec: (dugum: string) => void; onYeniden: (ids: string[]) => void; onTemizle: () => void; onKapat: () => void }) {
  const [acik, setAcik] = useState<string | null>(kayitlar[0]?.id ?? null);
  const [simdi, setSimdi] = useState(Date.now());
  useEffect(() => { if (!kayitlar.some((k) => !k.bit)) return; const z = setInterval(() => setSimdi(Date.now()), 500); return () => clearInterval(z); }, [kayitlar]);
  const toplamKredi = kayitlar.reduce((s, k) => s + k.adimlar.filter((a) => a.durum === "bitti").reduce((x, a) => x + a.kredi, 0), 0);
  return (
    <motion.aside data-arayuz initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ type: "spring", stiffness: 420, damping: 36 }}
      onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()} aria-label="Çalıştırma geçmişi"
      className="absolute bottom-[76px] right-3 top-[68px] z-40 flex w-[340px] flex-col overflow-hidden rounded-[18px] bg-[var(--tv-kart)] ring-1 ring-white/[0.09] max-md:inset-x-2 max-md:bottom-2 max-md:top-auto max-md:max-h-[66vh] max-md:w-auto sm:right-4">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <div className="flex-1"><h2 className="text-[14.5px] font-semibold">Çalıştırma geçmişi</h2><p className="text-[11.5px] text-[var(--sc-metin-3)]">{kayitlar.length} çalıştırma · {toplamKredi.toLocaleString("tr")} kredi harcandı</p></div>
        {kayitlar.length > 0 && <button onClick={onTemizle} title="Geçmişi temizle" aria-label="Geçmişi temizle" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-3)] hover:bg-white/[0.075]"><Trash2 className="h-3.5 w-3.5" /></button>}
        <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.075]"><X className="h-4 w-4" /></button>
      </div>
      <div data-kaydirilabilir className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
        {!kayitlar.length && <div className="m-1 flex items-start gap-3 rounded-[14px] px-3 py-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white"><History className="h-4 w-4" /></span><span className="min-w-0 leading-snug"><span className="block text-[13px] font-semibold text-[var(--sc-metin)]">Henüz çalıştırma yok</span><span className="mt-0.5 block text-[12px] text-[var(--sc-metin-3)]">Bir düğümü ya da tüm akışı çalıştırınca süre, kredi ve sonuçlarıyla burada görünür.</span></span></div>}
        {kayitlar.map((k) => {
          const biten = k.adimlar.filter((a) => a.durum === "bitti").length, hata = k.adimlar.filter((a) => a.durum === "hata").length;
          const kredi = k.adimlar.filter((a) => a.durum === "bitti").reduce((s, a) => s + a.kredi, 0);
          const ac = acik === k.id;
          return (
            <div key={k.id} className="mb-1 rounded-[12px] ring-1 ring-inset ring-white/[0.05]">
              <button onClick={() => setAcik(ac ? null : k.id)} className="flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left hover:bg-white/[0.045]">
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", !k.bit ? "bg-[var(--tv-aksan)]/15 text-[var(--tv-aksan)]" : hata ? "bg-rose-400/12 text-rose-300" : "bg-emerald-400/12 text-emerald-400")}>
                  {!k.bit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : hata ? <AlertTriangle className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{k.kapsam === "tek" ? k.adimlar[0]?.ad : k.kapsam === "tum" ? "Tüm akış" : "Seçili düğümler"}<span className="ml-1.5 font-normal text-[var(--sc-metin-3)]">{biten}/{k.adimlar.length}</span></span>
                  <span className="flex items-center gap-2 text-[11.5px] tabular-nums text-[var(--sc-metin-3)]">
                    <span>{new Date(k.bas).toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{sure((k.bit ?? simdi) - k.bas)}</span>
                    {kredi > 0 && <span className="flex items-center gap-0.5"><KrediJeton boyut={14} />{kredi}</span>}
                  </span>
                </span>
                <ChevronDown className={cn("h-4 w-4 text-[var(--sc-metin-3)] transition-transform", ac && "rotate-180")} />
              </button>
              {ac && (
                <div className="space-y-0.5 px-2 pb-2">
                  {k.adimlar.map((a) => { const I = ADIM_IKON[a.durum]; const c = KATALOG[a.tur]?.cikti; return (
                    <button key={a.dugum} onClick={() => onSec(a.dugum)} title="Düğüme git" className="flex w-full items-start gap-2 rounded-[9px] px-2 py-1.5 text-left hover:bg-white/[0.055]">
                      <I className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", ADIM_RENK[a.durum], a.durum === "calisiyor" && "animate-spin")} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-[12.5px]"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c ? PORT_RENK[c] : "#8693a5" }} /><span className="truncate">{a.ad}</span></span>
                        {a.hata && <span className="block truncate text-[11px] text-rose-300/90">{a.hata}</span>}
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums text-[var(--sc-metin-3)]">{a.bas ? sure((a.bit ?? simdi) - a.bas) : a.durum === "atlandi" ? "atlandı" : ""}{a.kredi && a.durum === "bitti" ? ` · ${a.kredi} kredi` : ""}</span>
                    </button>); })}
                  {k.bit && <button onClick={() => onYeniden(k.adimlar.map((a) => a.dugum))} className="mt-1 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] text-[var(--sc-metin-2)] hover:bg-white/[0.075]"><RotateCcw className="h-3 w-3" />Bu adımları yeniden çalıştır</button>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.aside>
  );
}

/* ── Yorumlar ── */
const basHarf = (ad: string) => ad.trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toLocaleUpperCase("tr") || "?";
const zamanAd = (t: number) => { const d = (Date.now() - t) / 60000; return d < 1 ? "şimdi" : d < 60 ? `${Math.floor(d)} dk` : d < 1440 ? `${Math.floor(d / 60)} sa` : new Date(t).toLocaleDateString("tr", { day: "numeric", month: "short" }); };

export function YorumIgne({ y, secili, z, onAc }: { y: Yorum; secili: boolean; z: number; onAc: () => void }) {
  return (
    <button data-yorum={y.id} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onAc(); }} aria-label={`Yorum: ${y.metin.slice(0, 40)}`}
      className={cn("absolute z-[5] flex origin-bottom-left items-center justify-center rounded-full rounded-bl-none text-[11px] font-semibold text-white ring-2 transition-transform hover:scale-110", secili ? "ring-white" : "ring-[var(--tv-zemin)]", y.cozuldu && "opacity-50")}
      style={{ left: y.x, top: y.y - 30, width: 30, height: 30, background: y.renk, transform: `scale(${1 / z})` }}>
      {basHarf(y.yazar)}{y.yanitlar.length > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--tv-yukselti)] px-1 text-[9.5px] ring-1 ring-white/20">{y.yanitlar.length + 1}</span>}
    </button>
  );
}

export function YorumBalonu({ y, x, ust, yeni, yazar, onGonder, onYanit, onCoz, onSil, onKapat }: {
  y?: Yorum; x: number; ust: number; yeni?: boolean; yazar: string;
  onGonder: (metin: string) => void; onYanit: (metin: string) => void; onCoz: () => void; onSil: () => void; onKapat: () => void;
}) {
  const [metin, setMetin] = useState("");
  const alan = useRef<HTMLTextAreaElement>(null);
  // Açan tıklama bittikten sonra odakla (aksi hâlde tıklama odağı gövdeye geri alır).
  useEffect(() => { const z = setTimeout(() => alan.current?.focus(), 60); return () => clearTimeout(z); }, [y?.id]);
  const gonder = () => { const m = metin.trim(); if (!m) return; if (yeni) onGonder(m); else onYanit(m); setMetin(""); };
  const sol = Math.max(8, Math.min(x + 22, (typeof window !== "undefined" ? window.innerWidth : 1200) - 328)), tepe = Math.max(68, Math.min(ust - 20, (typeof window !== "undefined" ? window.innerHeight : 800) - 360));
  const mesajlar = y ? [{ id: y.id, yazar: y.yazar, renk: y.renk, metin: y.metin, zaman: y.zaman }, ...y.yanitlar] : [];
  return (
    <motion.div data-arayuz initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
      onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()} role="dialog" aria-label="Yorum"
      className="fixed z-[55] w-[320px] overflow-hidden rounded-[16px] bg-[var(--tv-yukselti)] ring-1 ring-white/[0.1]" style={{ left: sol, top: tepe }}>
      {y && (
        <div className="flex items-center gap-1 border-b border-white/[0.06] px-3 py-2">
          <span className="flex-1 text-[12px] text-[var(--sc-metin-3)]">{y.cozuldu ? "Çözüldü" : `${mesajlar.length} mesaj`}</span>
          <button onClick={onCoz} title={y.cozuldu ? "Yeniden aç" : "Çözüldü olarak işaretle"} className={cn("flex h-7 items-center gap-1 rounded-full px-2 text-[12px] hover:bg-white/[0.075]", y.cozuldu ? "text-[var(--sc-metin-2)]" : "text-emerald-400")}><Check className="h-3.5 w-3.5" />{y.cozuldu ? "Yeniden aç" : "Çöz"}</button>
          <button onClick={onSil} aria-label="Yorumu sil" className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--sc-metin-3)] hover:bg-rose-400/10 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--sc-metin-3)] hover:bg-white/[0.075]"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
      {mesajlar.length > 0 && (
        <div data-kaydirilabilir className="max-h-[240px] space-y-3 overflow-y-auto p-3 [scrollbar-width:thin]">
          {mesajlar.map((m) => (
            <div key={m.id} className="flex gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: m.renk }}>{basHarf(m.yazar)}</span>
              <div className="min-w-0 flex-1"><p className="text-[12px]"><b className="font-medium">{m.yazar}</b><span className="ml-1.5 text-[var(--sc-metin-3)]">{zamanAd(m.zaman)}</span></p><p className="whitespace-pre-line break-words text-[13px] leading-snug text-[var(--sc-metin-2)]">{m.metin}</p></div>
            </div>
          ))}
        </div>
      )}
      <div className={cn("flex items-end gap-2 p-2.5", mesajlar.length > 0 && "border-t border-white/[0.06]")}>
        <textarea ref={alan} value={metin} onChange={(e) => setMetin(e.target.value)} rows={1} placeholder={yeni ? `${yazar} olarak yorum yaz…` : "Yanıtla…"}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); gonder(); } if (e.key === "Escape") onKapat(); }}
          className="max-h-[120px] min-h-[34px] flex-1 resize-none rounded-[10px] bg-white/[0.065] px-2.5 py-2 text-[13px] outline-none [field-sizing:content] placeholder:text-[var(--sc-metin-3)]" />
        <button onClick={gonder} disabled={!metin.trim()} aria-label="Gönder" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:bg-white/[0.08] disabled:text-[var(--sc-metin-3)]"><ArrowUp className="h-4 w-4" strokeWidth={2.4} /></button>
      </div>
    </motion.div>
  );
}

export function YorumPaneli({ yorumlar, onSec, onKapat }: { yorumlar: Yorum[]; onSec: (y: Yorum) => void; onKapat: () => void }) {
  const [filtre, setFiltre] = useState<"acik" | "cozuldu">("acik");
  const l = yorumlar.filter((y) => (filtre === "acik" ? !y.cozuldu : y.cozuldu)).sort((a, b) => b.zaman - a.zaman);
  return (
    <motion.aside data-arayuz initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ type: "spring", stiffness: 420, damping: 36 }}
      onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()} aria-label="Yorumlar"
      className="absolute bottom-[76px] right-3 top-[68px] z-40 flex w-[320px] flex-col overflow-hidden rounded-[18px] bg-[var(--tv-kart)] ring-1 ring-white/[0.09] max-md:inset-x-2 max-md:bottom-2 max-md:top-auto max-md:max-h-[60vh] max-md:w-auto sm:right-4">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.085] text-white"><MessageSquare className="h-3.5 w-3.5" /></span>
        <h2 className="flex-1 text-[14px] font-semibold">Yorumlar</h2>
        <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.075]"><X className="h-4 w-4" /></button>
      </div>
      <div className="mx-3 mt-3 flex rounded-full p-1 ring-1 ring-inset ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.055)" }}>
        {([["acik", "Açık"], ["cozuldu", "Çözüldü"]] as const).map(([k, a]) => <button key={k} onClick={() => setFiltre(k)} aria-pressed={filtre === k} className={cn("flex-1 rounded-full py-1.5 text-[12.5px] font-medium", filtre === k ? "bg-white text-black" : "text-[var(--sc-metin-2)]")}>{a} <span className="tabular-nums opacity-60">{yorumlar.filter((y) => (k === "acik" ? !y.cozuldu : y.cozuldu)).length}</span></button>)}
      </div>
      <div data-kaydirilabilir className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]">
        {!l.length && (filtre === "acik" ? <div className="m-1 flex items-start gap-3 rounded-[14px] px-3 py-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white"><MessageSquare className="h-4 w-4" /></span><span className="min-w-0 leading-snug"><span className="block text-[13px] font-semibold text-[var(--sc-metin)]">Açık yorum yok</span><span className="mt-0.5 block text-[12px] text-[var(--sc-metin-3)]">Yorum aracını (C) seç, tuvalde bir yere ya da düğüme tıkla.</span></span></div> : <div className="m-1 flex items-start gap-3 rounded-[14px] px-3 py-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white"><MessageSquare className="h-4 w-4" /></span><span className="min-w-0 leading-snug"><span className="block text-[13px] font-semibold text-[var(--sc-metin)]">Çözülmüş yorum yok</span><span className="mt-0.5 block text-[12px] text-[var(--sc-metin-3)]">Çözdüğün yorumlar burada durur.</span></span></div>)}
        {l.map((y) => (
          <button key={y.id} onClick={() => onSec(y)} className="flex w-full gap-2.5 rounded-[12px] p-2.5 text-left hover:bg-white/[0.055]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full rounded-bl-none text-[10.5px] font-semibold text-white" style={{ background: y.renk }}>{basHarf(y.yazar)}</span>
            <span className="min-w-0 flex-1"><span className="block text-[12px]"><b className="font-medium">{y.yazar}</b><span className="ml-1.5 text-[var(--sc-metin-3)]">{zamanAd(y.zaman)}</span></span><span className="line-clamp-2 text-[12.5px] text-[var(--sc-metin-2)]">{y.metin}</span>
              {y.yanitlar.length > 0 && <span className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--sc-metin-3)]"><MessageSquare className="h-3 w-3" />{y.yanitlar.length} yanıt</span>}</span>
          </button>
        ))}
      </div>
    </motion.aside>
  );
}

