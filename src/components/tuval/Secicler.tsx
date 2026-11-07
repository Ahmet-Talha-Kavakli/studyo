"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { KrediJeton } from "@/components/ui/KrediHap";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronDown, Dices, Pause, Play, Search, X } from "lucide-react";
import { MarkaKare } from "@/components/studyo/hf";
import { SesAvatar } from "@/components/studyo/ses/ortak";
import { videoErisim } from "@/lib/videoSaglayici";
import { cn } from "@/lib/utils";
import { SESLER } from "@/lib/sesVeri";
import { ayarDeger, type Kontrol, type ModelSecenek } from "@/lib/tuval/ayarlar";
import { temaSinifi, useTuvalTema } from "@/lib/tuval/tema";

/* ── Yüzen katman: tetikleyicinin altında, gövdeye taşınmış (tuval ölçeğinden bağımsız, net). ── */
function Katman({ hedef, acik, onKapat, genislik, children }: { hedef: HTMLElement | null; acik: boolean; onKapat: () => void; genislik: number; children: React.ReactNode }) {
  const [konum, setKonum] = useState<{ x: number; y: number; yukari: boolean } | null>(null);
  const kok = useRef<HTMLDivElement>(null);
  const tema = useTuvalTema((x) => x.tema);
  useEffect(() => {
    if (!acik || !hedef) return;
    const r = hedef.getBoundingClientRect();
    const yukari = r.bottom + 360 > window.innerHeight && r.top > 360;
    setKonum({ x: Math.min(Math.max(8, r.left), window.innerWidth - genislik - 8), y: yukari ? r.top - 6 : r.bottom + 6, yukari });
    const k = (e: PointerEvent) => { if (!kok.current?.contains(e.target as Node) && !hedef.contains(e.target as Node)) onKapat(); };
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("pointerdown", k, true); window.addEventListener("keydown", t);
    return () => { window.removeEventListener("pointerdown", k, true); window.removeEventListener("keydown", t); };
  }, [acik, hedef, genislik, onKapat]);
  if (!acik || !konum || typeof document === "undefined") return null;
  return createPortal(
    <motion.div ref={kok} data-arayuz initial={{ opacity: 0, y: konum.yukari ? 4 : -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12 }}
      onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}
      className={`${temaSinifi(tema)} sc-kapsam fixed z-[90] overflow-hidden rounded-[14px] bg-[var(--tv-yukselti)] text-[var(--sc-metin)] ring-1 ring-white/[0.1]`}
      style={{ left: konum.x, width: genislik, ...(konum.yukari ? { bottom: window.innerHeight - konum.y } : { top: konum.y }) }}>
      {children}
    </motion.div>,
    document.body,
  );
}

/* ── Model seçici: arama, gruplar, açıklama, rozet, kredi, uyarı notu ── */
export function ModelSecici({ deger, modeller, onSec, kucuk }: { deger: string; modeller: ModelSecenek[]; onSec: (m: string) => void; kucuk?: boolean }) {
  const [acik, setAcik] = useState(false);
  const [q, setQ] = useState("");
  const tetik = useRef<HTMLButtonElement>(null);
  const liste = useMemo(() => { const k = q.trim().toLocaleLowerCase("tr"); return modeller.filter((m) => m.not !== "Bağlı değil" && videoErisim(m.ad).durum !== "kapandi" && (!k || `${m.ad} ${m.alt}`.toLocaleLowerCase("tr").includes(k))); }, [q, modeller]);
  const gruplar = [...new Set(liste.map((m) => m.grup))];
  const secili = modeller.find((m) => m.ad === deger);
  return (
    <>
      <button ref={tetik} data-etkilesim onClick={() => setAcik((v) => !v)} aria-label="Model seç" aria-expanded={acik}
        className={cn("flex min-w-0 items-center gap-1 rounded-full bg-white/[0.075] text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.1] hover:text-[var(--sc-metin)]", kucuk ? "h-6 max-w-[150px] pl-2 pr-1.5 text-[11.5px]" : "h-10 w-full px-3 text-[13.5px]")}>
        <span className="min-w-0 flex-1 truncate text-left">{deger}</span>
        {!kucuk && secili && <span className="flex shrink-0 items-center gap-0.5 text-[12px] tabular-nums text-[var(--sc-metin-3)]"><KrediJeton boyut={14} />{secili.kredi}</span>}
        <ChevronDown className="h-3 w-3 shrink-0" />
      </button>
      <Katman hedef={tetik.current} acik={acik} onKapat={() => setAcik(false)} genislik={360}>
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5"><span className="flex-1 text-[13px] font-semibold text-[var(--sc-metin)]">Model</span><span className="text-[11.5px] text-[var(--sc-metin-3)]">{liste.length} model</span></div>
        <label className="m-2 flex h-9 items-center gap-2 rounded-full px-3 ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.055)" }}>
          <Search className="h-3.5 w-3.5 text-[var(--sc-metin-3)]" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Model ara" aria-label="Model ara" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--sc-metin-3)]" />
        </label>
        <div className="max-h-[360px] overflow-y-auto px-2 pb-2 [scrollbar-width:thin]">
          {gruplar.map((gr) => (
            <div key={gr} className="mb-2 overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="border-b border-white/[0.05] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--sc-metin-2)]">{gr}</p>
              <div className="space-y-0.5 p-1">
              {liste.filter((m) => m.grup === gr).map((m) => {
                const sec = m.ad === deger;
                return (
                  <button key={m.ad} onClick={() => { onSec(m.ad); setAcik(false); }}
                    className={cn("flex w-full items-center gap-2.5 rounded-[10px] p-1.5 text-left ring-inset transition-colors", sec ? "bg-white/[0.085] ring-2 ring-white" : "hover:bg-white/[0.065]")}>
                    <MarkaKare ad={m.ad} boyut={30} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--sc-metin)]"><span className="truncate">{m.ad}</span>{m.rozet && <span className="shrink-0 rounded-full bg-white/[0.1] px-1.5 text-[10px] font-medium text-[var(--sc-metin-2)]">{m.rozet}</span>}</span>
                      <span className="block truncate text-[11.5px] text-[var(--sc-metin-3)]">{m.alt}</span>
                    </span>
                    <span className={cn("flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums", sec ? "bg-white text-black" : "text-[var(--sc-metin-2)]")}><KrediJeton boyut={12} />{m.kredi}</span>
                  </button>
                );
              })}
              </div>
            </div>
          ))}
          {!liste.length && <p className="px-3 py-5 text-center text-[12.5px] text-[var(--sc-metin-3)]">Eşleşen model yok</p>}
        </div>
      </Katman>
    </>
  );
}

/* ── Ses seçici: arama, cinsiyet, dinle ── */
let calan: HTMLAudioElement | null = null;
export function SesSecici({ deger, onSec, kucuk }: { deger: string; onSec: (ad: string) => void; kucuk?: boolean }) {
  const [acik, setAcik] = useState(false);
  const [q, setQ] = useState("");
  const [cins, setCins] = useState<"tumu" | "Kadın" | "Erkek">("tumu");
  const [caliyor, setCaliyor] = useState<string | null>(null);
  const tetik = useRef<HTMLButtonElement>(null);
  const s = SESLER.find((x) => x.ad === deger) ?? SESLER[0];
  const liste = SESLER.filter((v) => (cins === "tumu" || v.cinsiyet === cins) && (!q.trim() || `${v.ad} ${v.tanim ?? ""} ${v.kullanim ?? ""} ${v.aksan ?? ""}`.toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr"))));
  const dinle = (id?: string) => {
    if (!id) return;
    if (caliyor === id) { calan?.pause(); setCaliyor(null); return; }
    calan?.pause(); calan = new Audio(`/api/ses/onizleme/${id}`); calan.onended = () => setCaliyor(null); calan.onerror = () => setCaliyor(null);
    void calan.play().then(() => setCaliyor(id)).catch(() => setCaliyor(null));
  };
  useEffect(() => () => { calan?.pause(); }, []);
  return (
    <>
      <button ref={tetik} data-etkilesim onClick={() => setAcik((v) => !v)} aria-label="Ses seç" aria-expanded={acik}
        className={cn("flex min-w-0 items-center gap-1.5 rounded-full bg-white/[0.075] text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.1] hover:text-[var(--sc-metin)]", kucuk ? "h-6 pl-1 pr-1.5 text-[11.5px]" : "h-11 w-full px-2 text-[13.5px]")}>
        <SesAvatar ad={s.ad} renk={s.renk} boyut={kucuk ? 16 : 28} />
        <span className="min-w-0 flex-1 truncate text-left">{s.ad}{!kucuk && <span className="ml-1.5 text-[12px] text-[var(--sc-metin-3)]">{s.cinsiyet} · {s.tanim}</span>}</span>
        <ChevronDown className="h-3 w-3 shrink-0" />
      </button>
      <Katman hedef={tetik.current} acik={acik} onKapat={() => setAcik(false)} genislik={340}>
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5"><span className="flex-1 text-[13px] font-semibold text-[var(--sc-metin)]">Ses</span></div>
        <div className="space-y-2 p-2">
          <label className="flex h-9 items-center gap-2 rounded-[10px] bg-white/[0.065] px-2.5"><Search className="h-3.5 w-3.5 text-[var(--sc-metin-3)]" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ses, tarz ya da kullanım ara" aria-label="Ses ara" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--sc-metin-3)]" /></label>
          <div className="grid grid-cols-3 gap-1 rounded-full p-1 ring-1 ring-inset ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.055)" }}>{(["tumu", "Kadın", "Erkek"] as const).map((c) => <button key={c} onClick={() => setCins(c)} className={cn("h-7 rounded-full text-[12px] font-medium", cins === c ? "bg-white text-black" : "text-[var(--sc-metin-2)]")}>{c === "tumu" ? "Tümü" : c}</button>)}</div>
        </div>
        <div className="max-h-[320px] overflow-y-auto px-1.5 pb-1.5 [scrollbar-width:thin]">
          {liste.map((v) => (
            <div key={v.ad} className={cn("flex items-center gap-2 rounded-[10px] px-1.5 py-1.5 ring-inset", v.ad === deger ? "bg-white/[0.085] ring-2 ring-white" : "hover:bg-white/[0.065]")}>
              <button onClick={() => dinle(v.sesId)} aria-label={`${v.ad} sesini dinle`} className="group/orb relative block h-9 w-9 shrink-0 rounded-full">
                <SesAvatar ad={v.ad} renk={v.renk} boyut={36} aktif={caliyor === v.sesId} />
                <span className={cn("absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white transition-opacity", caliyor === v.sesId ? "opacity-100" : "opacity-0 group-hover/orb:opacity-100")}>{caliyor === v.sesId ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}</span>
              </button>
              <button onClick={() => { onSec(v.ad); setAcik(false); }} className="min-w-0 flex-1 text-left">
                <span className="block text-[13px] text-[var(--sc-metin)]">{v.ad} <span className="text-[11.5px] text-[var(--sc-metin-3)]">· {v.cinsiyet}{v.yas ? ` · ${v.yas}` : ""}</span></span>
                <span className="block truncate text-[11.5px] text-[var(--sc-metin-3)]">{v.tanim} · {v.dil}</span>
              </button>
            </div>
          ))}
        </div>
      </Katman>
    </>
  );
}

/* ── Seçim çipi (düğüm üstü) ── */
export function SecimCipi({ k, deger, onSec }: { k: Extract<Kontrol, { tur: "secim" }>; deger: string; onSec: (v: string) => void }) {
  const [acik, setAcik] = useState(false);
  const tetik = useRef<HTMLButtonElement>(null);
  const s = k.secenekler.find((x) => x.deger === deger);
  return (
    <>
      <button ref={tetik} data-etkilesim onClick={() => setAcik((v) => !v)} title={k.ad} aria-label={k.ad}
        className="flex h-6 max-w-[140px] items-center gap-0.5 rounded-full bg-white/[0.075] pl-2 pr-1.5 text-[11.5px] text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.05] hover:bg-white/[0.1] hover:text-[var(--sc-metin)]">
        <span className="truncate">{s?.ad ?? deger}</span><ChevronDown className="h-3 w-3 shrink-0" />
      </button>
      <Katman hedef={tetik.current} acik={acik} onKapat={() => setAcik(false)} genislik={k.id === "oran" ? 300 : k.secenekler.length > 8 ? 270 : 230}>
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5"><span className="flex-1 text-[13px] font-semibold text-[var(--sc-metin)]">{k.ad}</span></div>
        {k.id === "oran" ? (
          <div className="grid max-h-[320px] grid-cols-3 gap-1.5 overflow-y-auto p-2 [scrollbar-width:thin]">
            {k.secenekler.map((o) => {
              const sec = o.deger === deger;
              return (
                <button key={o.deger} onClick={() => { onSec(o.deger); setAcik(false); }} title={o.alt}
                  className={cn("flex flex-col items-center gap-1.5 rounded-[12px] px-1 pb-2 pt-3 ring-inset transition-colors", sec ? "bg-white/[0.085] ring-2 ring-white" : "ring-1 ring-white/[0.06] hover:bg-white/[0.065]")}>
                  <span className="flex h-7 items-center"><OranSimge oran={o.deger} buyuk /></span>
                  <span className="text-[12px] font-semibold tabular-nums text-[var(--sc-metin)]">{o.ad}</span>
                  {o.alt && <span className="-mt-1 text-[10.5px] text-[var(--sc-metin-3)]">{o.alt}</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="max-h-[300px] space-y-0.5 overflow-y-auto p-1.5 [scrollbar-width:thin]">
            {k.secenekler.map((o) => (
              <button key={o.deger} onClick={() => { onSec(o.deger); setAcik(false); }} className={cn("flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left ring-inset transition-colors", o.deger === deger ? "bg-white/[0.085] ring-2 ring-white" : "hover:bg-white/[0.065]")}>
                <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-medium text-[var(--sc-metin)]">{o.ad}</span>{o.alt && <span className="block truncate text-[11px] text-[var(--sc-metin-3)]">{o.alt}</span>}</span>
              </button>
            ))}
          </div>
        )}
      </Katman>
    </>
  );
}
export function OranSimge({ oran, buyuk }: { oran: string; buyuk?: boolean }) {
  const [a, b] = oran.split(":").map(Number);
  const m = buyuk ? 24 : 16;
  if (!a || !b) return <span className="shrink-0 rounded-[4px] border-[1.5px] border-dashed border-current opacity-70" style={{ width: m * 0.8, height: m * 0.8 }} />;
  const w = a >= b ? m : (m * a) / b, h = b >= a ? m : (m * b) / a;
  return <span className="flex shrink-0 items-center justify-center" style={{ width: m, height: m }}><span className={cn("rounded-[3px] border-[1.5px] border-current", buyuk ? "opacity-90" : "opacity-80")} style={{ width: w, height: h }} /></span>;
}

/* ── Tam kontrol (Ayarlar paneli) ── */
export function TamKontrol({ k, ayar, onDegis }: { k: Kontrol; ayar: Record<string, unknown>; onDegis: (id: string, v: string | number | boolean | undefined) => void }) {
  const v = ayarDeger(k, ayar);
  if (k.tur === "secim") {
    const kisa = k.secenekler.length <= 5;
    return (
      <div>
        <p className="mb-1.5 flex items-center justify-between text-[12.5px] text-[var(--sc-metin-2)]">{k.ad}{k.aciklama && <span className="text-[11px] text-[var(--sc-metin-3)]">{k.aciklama}</span>}</p>
        {kisa ? (
          <div className="flex flex-wrap gap-1 rounded-full p-1 ring-1 ring-inset ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.055)" }}>
            {k.secenekler.map((o) => (
              <button key={o.deger} onClick={() => onDegis(k.id, o.deger)} title={o.alt} className={cn("flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-[12.5px] transition-colors", String(v) === o.deger ? "bg-white font-medium text-black" : "text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]")}>
                {k.id === "oran" && <OranSimge oran={o.deger} />}{o.ad}
              </button>
            ))}
          </div>
        ) : <SecimCipiGenis k={k} deger={String(v)} onSec={(x) => onDegis(k.id, x)} />}
      </div>
    );
  }
  if (k.tur === "anahtar") return (
    <button onClick={() => onDegis(k.id, !v)} aria-pressed={!!v} className="flex w-full items-center gap-3 rounded-[10px] bg-white/[0.045] px-3 py-2.5 text-left ring-1 ring-inset ring-white/[0.05] hover:bg-white/[0.065]">
      <span className="min-w-0 flex-1"><span className="block text-[13px] text-[var(--sc-metin)]">{k.ad}</span>{k.aciklama && <span className="block text-[11.5px] text-[var(--sc-metin-3)]">{k.aciklama}</span>}</span>
      <span aria-hidden className={cn("relative flex h-[18px] w-8 shrink-0 items-center rounded-full px-[2px] transition-colors", v ? "justify-end bg-white" : "justify-start bg-white/[0.16]")}><motion.span layout className={cn("h-[14px] w-[14px] rounded-full", v ? "bg-[#0a0a0b]" : "bg-white")} /></span>
    </button>
  );
  if (k.tur === "kaydirici") {
    const n = Number(v);
    return (
      <div>
        <p className="mb-1 flex items-center justify-between text-[12.5px] text-[var(--sc-metin-2)]">{k.ad}<span className="tabular-nums text-[var(--sc-metin)]">{k.birim === "×" ? `${n.toFixed(2)}×` : n.toFixed(2)}</span></p>
        <input type="range" min={k.min} max={k.max} step={k.adim} value={n} onChange={(e) => onDegis(k.id, Number(e.target.value))} aria-label={k.ad} className="w-full accent-white" />
        {k.aciklama && <p className="mt-0.5 text-[11px] text-[var(--sc-metin-3)]">{k.aciklama}</p>}
      </div>
    );
  }
  if (k.tur === "tohum") return (
    <div>
      <p className="mb-1.5 text-[12.5px] text-[var(--sc-metin-2)]">{k.ad}</p>
      <div className="flex items-center gap-1.5">
        <input value={v === undefined ? "" : String(v)} onChange={(e) => onDegis(k.id, e.target.value.replace(/\D/g, "").slice(0, 10) || undefined)} placeholder="Rastgele" inputMode="numeric" aria-label="Tohum"
          className="h-9 min-w-0 flex-1 rounded-[9px] bg-white/[0.055] px-3 text-[13px] tabular-nums outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/30" />
        <button onClick={() => onDegis(k.id, Math.floor(Math.random() * 1e9))} aria-label="Rastgele tohum" className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-white/[0.065] hover:bg-white/[0.09]"><Dices className="h-4 w-4" /></button>
        {v !== undefined && <button onClick={() => onDegis(k.id, undefined)} aria-label="Tohumu temizle" className="flex h-9 w-9 items-center justify-center rounded-[9px] text-[var(--sc-metin-3)] hover:bg-white/[0.065]"><X className="h-4 w-4" /></button>}
      </div>
      {k.aciklama && <p className="mt-1 text-[11px] text-[var(--sc-metin-3)]">{k.aciklama}</p>}
    </div>
  );
  return (
    <div>
      <p className="mb-1.5 text-[12.5px] text-[var(--sc-metin-2)]">{k.ad}</p>
      <textarea value={String(v ?? "")} onChange={(e) => onDegis(k.id, e.target.value || undefined)} rows={2} placeholder={k.yerTutucu}
        className="w-full resize-y rounded-[10px] bg-white/[0.055] p-2.5 text-[12.5px] outline-none ring-1 ring-inset ring-white/[0.06] placeholder:text-[var(--sc-metin-3)] focus:ring-white/30" />
    </div>
  );
}
function SecimCipiGenis({ k, deger, onSec }: { k: Extract<Kontrol, { tur: "secim" }>; deger: string; onSec: (v: string) => void }) {
  const [acik, setAcik] = useState(false);
  const tetik = useRef<HTMLButtonElement>(null);
  const s = k.secenekler.find((x) => x.deger === deger);
  return (
    <>
      <button ref={tetik} onClick={() => setAcik((v) => !v)} className="flex h-10 w-full items-center gap-2 rounded-[10px] bg-white/[0.055] px-3 text-left text-[13px] ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.075]">
        <span className="min-w-0 flex-1 truncate">{s?.ad ?? deger}{s?.alt && <span className="ml-1.5 text-[11.5px] text-[var(--sc-metin-3)]">{s.alt}</span>}</span><ChevronDown className="h-4 w-4 text-[var(--sc-metin-3)]" />
      </button>
      <Katman hedef={tetik.current} acik={acik} onKapat={() => setAcik(false)} genislik={300}>
        <div className="max-h-[320px] overflow-y-auto p-1 [scrollbar-width:thin]">
          {k.secenekler.map((o) => (
            <button key={o.deger} onClick={() => { onSec(o.deger); setAcik(false); }} className={cn("flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left ring-inset", o.deger === deger ? "bg-white/[0.085] ring-2 ring-white" : "hover:bg-white/[0.065]")}>
              <span className="min-w-0 flex-1"><span className="block text-[12.5px]">{o.ad}</span>{o.alt && <span className="block truncate text-[11px] text-[var(--sc-metin-3)]">{o.alt}</span>}</span>
            </button>
          ))}
        </div>
      </Katman>
    </>
  );
}
