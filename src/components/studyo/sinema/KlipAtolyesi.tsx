"use client";

/**
 * Klip atölyesi: videonun rengini derecelendirir ve başka bir orana yeniden kadrajlar.
 * Önizleme oynatıcının üstünde canlıdır (CSS filtre + karışım katmanları); dışa aktarma aynı
 * hesabı tuvalde kare kare uygular ve MediaRecorder ile yeni bir klip kaydeder (ses korunur).
 * Her şey tarayıcıda olur, kredi düşmez.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Crop, Loader2, Palette, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { OranSekli } from "@/components/arac/kit";

/* ═════════════ Renk ═════════════ */

export type Renk = { pozlama: number; kontrast: number; doygunluk: number; sicaklik: number; ton: number; vinyet: number; gren: number };
export const RENK_SIFIR: Renk = { pozlama: 0, kontrast: 0, doygunluk: 0, sicaklik: 0, ton: 0, vinyet: 0, gren: 0 };
export const RENK_HAZIR: { id: string; ad: string; r: Renk }[] = [
  { id: "dogal", ad: "Doğal", r: RENK_SIFIR },
  { id: "gunbatimi", ad: "Gün batımı", r: { pozlama: 0.05, kontrast: 0.15, doygunluk: 0.15, sicaklik: 0.6, ton: 0.05, vinyet: 0.3, gren: 0 } },
  { id: "gece", ad: "Gece mavisi", r: { pozlama: -0.12, kontrast: 0.2, doygunluk: -0.15, sicaklik: -0.6, ton: 0, vinyet: 0.45, gren: 0.1 } },
  { id: "noir", ad: "Noir", r: { pozlama: 0, kontrast: 0.45, doygunluk: -1, sicaklik: 0, ton: 0, vinyet: 0.55, gren: 0.35 } },
  { id: "solgun", ad: "Solgun film", r: { pozlama: 0.08, kontrast: -0.25, doygunluk: -0.3, sicaklik: 0.15, ton: 0.05, vinyet: 0.2, gren: 0.4 } },
  { id: "bleach", ad: "Bleach bypass", r: { pozlama: 0, kontrast: 0.5, doygunluk: -0.55, sicaklik: -0.1, ton: 0, vinyet: 0.35, gren: 0.2 } },
  { id: "canli", ad: "Canlı reklam", r: { pozlama: 0.08, kontrast: 0.2, doygunluk: 0.45, sicaklik: 0.05, ton: 0, vinyet: 0, gren: 0 } },
  { id: "yesil", ad: "Yeşil gerilim", r: { pozlama: -0.05, kontrast: 0.25, doygunluk: -0.2, sicaklik: -0.1, ton: -0.55, vinyet: 0.35, gren: 0.15 } },
];
const RENK_AYAR: { k: keyof Renk; ad: string; min: number; sol: string; sag: string }[] = [
  { k: "pozlama", ad: "Pozlama", min: -1, sol: "Koyu", sag: "Aydınlık" },
  { k: "kontrast", ad: "Kontrast", min: -1, sol: "Yumuşak", sag: "Sert" },
  { k: "doygunluk", ad: "Doygunluk", min: -1, sol: "Siyah beyaz", sag: "Canlı" },
  { k: "sicaklik", ad: "Sıcaklık", min: -1, sol: "Soğuk", sag: "Sıcak" },
  { k: "ton", ad: "Ton", min: -1, sol: "Yeşil", sag: "Eflatun" },
  { k: "vinyet", ad: "Vinyet", min: 0, sol: "Yok", sag: "Güçlü" },
  { k: "gren", ad: "Film greni", min: 0, sol: "Yok", sag: "Yoğun" },
];
const SURGU_ZEMIN: Partial<Record<keyof Renk, string>> = {
  sicaklik: "linear-gradient(to right,#4d8dff,#9aa3ad,#ff9a3c)",
  ton: "linear-gradient(to right,#3cd47a,#9aa3ad,#ff5ccf)",
  doygunluk: "linear-gradient(to right,#8a8a8a,#c06bff,#ff5c5c)",
};

export const renkBos = (r: Renk) => (Object.keys(r) as (keyof Renk)[]).every((k) => Math.abs(r[k]) < 0.005);
export const renkFiltre = (r: Renk) => `brightness(${(1 + r.pozlama * 0.5).toFixed(3)}) contrast(${(1 + r.kontrast * 0.6).toFixed(3)}) saturate(${Math.max(0, 1 + r.doygunluk).toFixed(3)})`;
const sicaklikRengi = (s: number) => (s > 0 ? `rgba(255,140,40,${(s * 0.5).toFixed(3)})` : `rgba(40,120,255,${(-s * 0.5).toFixed(3)})`);
const tonRengi = (t: number) => (t > 0 ? `rgba(255,60,200,${(t * 0.32).toFixed(3)})` : `rgba(50,230,120,${(-t * 0.32).toFixed(3)})`);

let grenTuvali: HTMLCanvasElement | null = null;
/** Bir kez üretilen 160 px gri gürültü dokusu (önizleme ve dışa aktarma aynı dokuyu kullanır). */
function gren(): HTMLCanvasElement {
  if (grenTuvali) return grenTuvali;
  const c = document.createElement("canvas"); c.width = c.height = 160;
  const x = c.getContext("2d")!; const d = x.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); grenTuvali = c; return c;
}

/** Oynatıcının üstüne konan canlı renk katmanları (filtre öğenin kendisine verilir). */
export function RenkKatmani({ r }: { r: Renk }) {
  const [doku, setDoku] = useState("");
  useEffect(() => { setDoku(gren().toDataURL()); }, []);
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {r.sicaklik !== 0 && <span className="absolute inset-0" style={{ background: sicaklikRengi(r.sicaklik), mixBlendMode: "soft-light" }} />}
      {r.ton !== 0 && <span className="absolute inset-0" style={{ background: tonRengi(r.ton), mixBlendMode: "soft-light" }} />}
      {r.vinyet > 0 && <span className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, transparent 48%, rgba(0,0,0,${(r.vinyet * 0.8).toFixed(3)}) 100%)` }} />}
      {r.gren > 0 && doku && (
        <motion.span className="absolute -inset-[40px]" style={{ backgroundImage: `url(${doku})`, mixBlendMode: "overlay", opacity: r.gren * 0.5 }}
          animate={{ x: [0, -23, 17, -9, 0], y: [0, 14, -21, 8, 0] }} transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }} />
      )}
    </span>
  );
}

/* ═════════════ Kadraj ═════════════ */

export type KadrajOran = "9:16" | "1:1" | "4:5" | "16:9" | "21:9";
export type Kadraj = { oran: KadrajOran; mod: "kirp" | "dolgu"; x: number; y: number; yakin: number };
export const KADRAJ_ORANLAR: { o: KadrajOran; ad: string; not: string }[] = [
  { o: "9:16", ad: "Dikey", not: "Reels, Shorts, TikTok" },
  { o: "1:1", ad: "Kare", not: "Akış gönderisi" },
  { o: "4:5", ad: "Portre", not: "Instagram akışı" },
  { o: "16:9", ad: "Yatay", not: "YouTube, sunum" },
  { o: "21:9", ad: "Sinemaskop", not: "Geniş perde" },
];
const oranSayi = (o: string) => { const [a, b] = o.split(":").map(Number); return a / b; };

/** Kaynaktaki kırpma dikdörtgeni (kaynak pikseli): hedef oranda, yakınlaştırma ve konuma göre. */
export function kirpAlani(sw: number, sh: number, k: Kadraj) {
  const R = oranSayi(k.oran);
  let w = sw, h = sw / R;
  if (h > sh) { h = sh; w = sh * R; }
  w /= k.yakin; h /= k.yakin;
  return { x: (sw - w) * k.x, y: (sh - h) * k.y, w, h };
}
/** Çıktı boyutu: en uzun kenar en çok 1920, çift sayı (kodlayıcılar tek sayıyı sevmez). */
function cikisBoyutu(sw: number, sh: number, k: Kadraj | null) {
  let w = sw, h = sh;
  if (k) {
    const R = oranSayi(k.oran);
    if (k.mod === "kirp") { const a = kirpAlani(sw, sh, k); w = a.w; h = a.h; }
    else { const uzun = Math.max(sw, sh); if (R >= 1) { w = uzun; h = uzun / R; } else { h = uzun; w = uzun * R; } }
  }
  const o = Math.min(1, 1920 / Math.max(w, h));
  return { w: Math.max(2, Math.round((w * o) / 2) * 2), h: Math.max(2, Math.round((h * o) / 2) * 2) };
}

/** Bir kareyi renk ve kadraj ayarlarıyla tuvale çizer (önizleme ve dışa aktarma ortak). */
export function kareIsle(ctx: CanvasRenderingContext2D, v: HTMLVideoElement, W: number, H: number, o: { renk?: Renk | null; kadraj?: Kadraj | null; grenKaydir?: boolean }) {
  const sw = v.videoWidth, sh = v.videoHeight; if (!sw || !sh) return;
  const f = o.renk && !renkBos(o.renk) ? renkFiltre(o.renk) : "none";
  ctx.save(); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const k = o.kadraj;
  if (k && k.mod === "kirp") {
    const a = kirpAlani(sw, sh, k);
    ctx.filter = f; ctx.drawImage(v, a.x, a.y, a.w, a.h, 0, 0, W, H);
  } else if (k && k.mod === "dolgu") {
    // Arkada bulanık, kararmış tam kaplama; önde videonun tamamı (yakınlaştırmayla).
    const kap = Math.max(W / sw, H / sh), bw = sw * kap, bh = sh * kap;
    ctx.filter = `${f === "none" ? "" : f + " "}blur(${Math.round(Math.max(W, H) / 40)}px) brightness(0.55)`;
    ctx.drawImage(v, (W - bw) / 2, (H - bh) / 2, bw, bh);
    const ic = Math.min(W / sw, H / sh) * k.yakin, iw = sw * ic, ih = sh * ic;
    ctx.filter = f; ctx.drawImage(v, (W - iw) * k.x, (H - ih) * k.y, iw, ih);
  } else {
    ctx.filter = f; ctx.drawImage(v, 0, 0, W, H);
  }
  ctx.filter = "none";
  const r = o.renk;
  if (r && !renkBos(r)) {
    if (r.sicaklik) { ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = sicaklikRengi(r.sicaklik); ctx.fillRect(0, 0, W, H); }
    if (r.ton) { ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = tonRengi(r.ton); ctx.fillRect(0, 0, W, H); }
    ctx.globalCompositeOperation = "source-over";
    if (r.vinyet > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) / 2);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${(r.vinyet * 0.8).toFixed(3)})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (r.gren > 0) {
      const d = gren(), p = ctx.createPattern(d, "repeat");
      if (p) {
        const dx = o.grenKaydir ? Math.random() * 160 : 0, dy = o.grenKaydir ? Math.random() * 160 : 0;
        ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = r.gren * 0.5; ctx.translate(-dx, -dy);
        ctx.fillStyle = p; ctx.fillRect(dx, dy, W, H);
      }
    }
  }
  ctx.restore();
}

/** Klibi baştan sona işleyip yeni bir dosya kaydeder. Ses varsa korunur. Gerçek zamanlı çalışır. */
export async function klipIsle(src: string, o: { renk?: Renk | null; kadraj?: Kadraj | null }, ilerleme: (oran: number) => void): Promise<{ blob: Blob; uzanti: string; w: number; h: number; sure: number }> {
  if (typeof MediaRecorder === "undefined") throw new Error("Tarayıcın video kaydını desteklemiyor.");
  const v = document.createElement("video");
  v.playsInline = true; v.preload = "auto"; v.crossOrigin = "anonymous"; v.src = src;
  await new Promise<void>((ok, hata) => { v.onloadedmetadata = () => ok(); v.onerror = () => hata(new Error("Video yüklenemedi.")); });
  const { w: W, h: H } = cikisBoyutu(v.videoWidth, v.videoHeight, o.kadraj ?? null);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); if (!ctx) throw new Error("Tuval açılamadı.");
  const akis = c.captureStream(30);
  let ses: AudioContext | null = null;
  try {
    ses = new AudioContext();
    const hedef = ses.createMediaStreamDestination();
    ses.createMediaElementSource(v).connect(hedef);
    hedef.stream.getAudioTracks().forEach((t) => akis.addTrack(t));
  } catch { v.muted = true; }
  const tur = ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp9", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";
  const kayit = new MediaRecorder(akis, { mimeType: tur, videoBitsPerSecond: 10_000_000 });
  const parca: Blob[] = [];
  kayit.ondataavailable = (e) => { if (e.data.size) parca.push(e.data); };
  const bitti = new Promise<void>((ok) => { kayit.onstop = () => ok(); });
  v.currentTime = 0;
  await new Promise<void>((ok) => { v.onseeked = () => ok(); setTimeout(ok, 1500); });
  kareIsle(ctx, v, W, H, { ...o, grenKaydir: true });
  kayit.start(250);
  try { await v.play(); } catch { v.muted = true; await v.play(); }
  await new Promise<void>((ok) => {
    const rvfc = (v as HTMLVideoElement & { requestVideoFrameCallback?: (f: () => void) => number }).requestVideoFrameCallback?.bind(v);
    const ciz = () => {
      kareIsle(ctx, v, W, H, { ...o, grenKaydir: true });
      ilerleme(Math.min(1, v.currentTime / (v.duration || 1)));
      if (v.ended || v.paused) return ok();
      if (rvfc) rvfc(ciz); else requestAnimationFrame(ciz);
    };
    v.onended = () => ok();
    if (rvfc) rvfc(ciz); else requestAnimationFrame(ciz);
  });
  kareIsle(ctx, v, W, H, { ...o, grenKaydir: true });
  await new Promise((r) => setTimeout(r, 120));
  kayit.stop(); await bitti;
  void ses?.close();
  ilerleme(1);
  const mime = tur.split(";")[0];
  return { blob: new Blob(parca, { type: mime }), uzanti: mime === "video/mp4" ? "mp4" : "webm", w: W, h: H, sure: v.duration };
}

/* ═════════════ Paneller ═════════════ */

function Kart({ baslik, sag, children }: { baslik: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07] [&+&]:mt-2.5" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="min-w-0 flex-1 text-[13px] font-semibold text-metin">{baslik}</span>{sag}</div>
      {children}
    </section>
  );
}
function Ust({ baslik, alt, onGeri }: { baslik: string; alt: string; onGeri: () => void }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
      <button onClick={onGeri} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/8 hover:text-metin active:scale-90" aria-label="Araçlara dön"><ArrowLeft className="h-4 w-4" /></button>
      <span className="min-w-0 leading-tight"><span className="block text-[14px] font-semibold text-metin">{baslik}</span><span className="block text-[11.5px] text-metin-3">{alt}</span></span>
    </div>
  );
}
function Uygula({ etiket, oran, onUygula, kapali, not }: { etiket: string; oran: number | null; onUygula: () => void; kapali?: boolean; not: string }) {
  return (
    <div className="shrink-0 space-y-2 border-t border-white/8 p-3">
      {oran !== null ? (
        <div className="rounded-[12px] bg-white/[0.04] p-2.5 ring-1 ring-inset ring-white/[0.07]">
          <p className="flex items-center gap-2 text-[12.5px] font-medium text-metin"><Loader2 className="h-3.5 w-3.5 animate-spin" />Klip işleniyor, yüzde {Math.round(oran * 100)}</p>
          <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10"><motion.span className="block h-full rounded-full bg-white" animate={{ width: `${oran * 100}%` }} transition={{ duration: 0.2 }} /></span>
          <p className="mt-1.5 text-[11.5px] text-metin-3">Klip gerçek hızında oynatılarak kaydedilir; sekmeyi açık tut.</p>
        </div>
      ) : <p className="px-0.5 text-[12px] leading-snug text-metin-3">{not}</p>}
      <button onClick={onUygula} disabled={kapali || oran !== null}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-[#0a0a0b] transition-[opacity,transform] active:scale-[0.98] disabled:opacity-40">
        {oran !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{etiket}
      </button>
    </div>
  );
}

export function RenkPaneli({ r, setR, poster, oran, onUygula, onGeri }: {
  r: Renk; setR: (r: Renk) => void; poster?: string; oran: number | null; onUygula: () => void; onGeri: () => void;
}) {
  const hazirId = RENK_HAZIR.find((h) => (Object.keys(h.r) as (keyof Renk)[]).every((k) => Math.abs(h.r[k] - r[k]) < 0.005))?.id;
  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }} className="flex min-h-0 flex-1 flex-col">
      <Ust baslik="Renk derecelendirme" alt="Değişiklik oynatıcıda canlı görünür" onGeri={onGeri} />
      <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
        <Kart baslik="Hazır görünümler" sag={<span className="text-[11.5px] text-metin-3">{RENK_HAZIR.length} görünüm</span>}>
          <div className="grid grid-cols-4 gap-1.5 p-2">
            {RENK_HAZIR.map((h) => {
              const sec = h.id === hazirId;
              return (
                <button key={h.id} onClick={() => setR(h.r)} aria-pressed={sec} className="group min-w-0 text-left">
                  <span className={cn("relative block aspect-square overflow-hidden rounded-[10px] bg-black transition-[outline-color]", sec ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-inset ring-white/10")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {poster && <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" style={{ filter: renkBos(h.r) ? undefined : renkFiltre(h.r) }} />}
                    <RenkKatmani r={{ ...h.r, gren: 0 }} />
                  </span>
                  <span className={cn("mt-1 block text-center text-[11px] leading-tight", sec ? "font-semibold text-metin" : "text-metin-2")}>{h.ad}</span>
                </button>
              );
            })}
          </div>
        </Kart>
        <Kart baslik="İnce ayar" sag={!renkBos(r) ? <button onClick={() => setR(RENK_SIFIR)} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin"><RotateCcw className="h-3 w-3" />Sıfırla</button> : undefined}>
          <div className="space-y-3 p-3">
            {RENK_AYAR.map((a) => {
              const d = r[a.k], yuzde = ((d - a.min) / (1 - a.min)) * 100;
              return (
                <label key={a.k} className="block">
                  <span className="flex items-center justify-between text-[12.5px]"><span className="font-medium text-metin">{a.ad}</span><span className="tabular-nums text-metin-3">{d > 0 && a.min < 0 ? "+" : ""}{Math.round(d * 100)}</span></span>
                  <input type="range" min={a.min} max={1} step={0.01} value={d} aria-label={a.ad}
                    onChange={(e) => setR({ ...r, [a.k]: Number(e.target.value) })} onDoubleClick={() => setR({ ...r, [a.k]: 0 })}
                    className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    style={{ background: SURGU_ZEMIN[a.k] ?? (a.min < 0 ? "rgba(255,255,255,0.14)" : `linear-gradient(to right,#fff ${yuzde}%,rgba(255,255,255,0.14) 0)`) }} />
                  <span className="mt-1 flex justify-between text-[10.5px] text-metin-3"><span>{a.sol}</span><span>{a.sag}</span></span>
                </label>
              );
            })}
          </div>
        </Kart>
      </div>
      <Uygula etiket="Yeni klip olarak kaydet" oran={oran} onUygula={onUygula} kapali={renkBos(r)} not={renkBos(r) ? "Bir görünüm seç ya da ayarları değiştir." : "Özgün klip kalır; renkli hâli yeni sürüm olarak eklenir. Kredi düşmez."} />
    </motion.div>
  );
}

export function KadrajPaneli({ k, setK, kaynakOran, videoRef, oran, onUygula, onGeri }: {
  k: Kadraj; setK: (k: Kadraj) => void; kaynakOran?: number; videoRef: React.RefObject<HTMLVideoElement | null>; oran: number | null; onUygula: () => void; onGeri: () => void;
}) {
  const tuval = useRef<HTMLCanvasElement>(null);
  const R = oranSayi(k.oran);
  const ayni = kaynakOran !== undefined && Math.abs(kaynakOran - R) < 0.02 && k.mod === "kirp" && k.yakin === 1;
  // Önizleme: oynatıcının o anki karesi her karede yeniden çizilir.
  useEffect(() => {
    let r = 0;
    const ciz = () => {
      const v = videoRef.current, c = tuval.current;
      if (v && c && v.videoWidth) {
        const W = 480, H = Math.round(480 / R);
        if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
        const ctx = c.getContext("2d"); if (ctx) { try { kareIsle(ctx, v, W, H, { kadraj: k }); } catch { /* çapraz köken */ } }
      }
      r = requestAnimationFrame(ciz);
    };
    r = requestAnimationFrame(ciz);
    return () => cancelAnimationFrame(r);
  }, [k, R, videoRef]);
  const surgu = (ad: string, deger: number, f: (n: number) => void, min = 0, max = 1, sol = "", sag = "") => (
    <label className="block">
      <span className="flex items-center justify-between text-[12.5px]"><span className="font-medium text-metin">{ad}</span><span className="tabular-nums text-metin-3">{max > 1 ? `${deger.toFixed(2).replace(".", ",")}×` : `yüzde ${Math.round(deger * 100)}`}</span></span>
      <input type="range" min={min} max={max} step={0.01} value={deger} aria-label={ad} onChange={(e) => f(Number(e.target.value))}
        className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        style={{ background: `linear-gradient(to right,#fff ${((deger - min) / (max - min)) * 100}%,rgba(255,255,255,0.14) 0)` }} />
      {(sol || sag) && <span className="mt-1 flex justify-between text-[10.5px] text-metin-3"><span>{sol}</span><span>{sag}</span></span>}
    </label>
  );
  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }} className="flex min-h-0 flex-1 flex-col">
      <Ust baslik="Yeniden kadrajla" alt="Klibi başka bir orana taşı" onGeri={onGeri} />
      <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
        <Kart baslik="Önizleme" sag={<span className="text-[11.5px] tabular-nums text-metin-3">{k.oran}</span>}>
          <div className="flex justify-center bg-black/40 p-2">
            <canvas ref={tuval} className="block max-h-[220px] max-w-full rounded-[8px] bg-black" style={{ aspectRatio: String(R) }} />
          </div>
        </Kart>
        <Kart baslik="Yeni oran">
          <div className="grid grid-cols-5 gap-1.5 p-2">
            {KADRAJ_ORANLAR.map((x) => {
              const sec = x.o === k.oran;
              return (
                <button key={x.o} onClick={() => setK({ ...k, oran: x.o, x: 0.5, y: 0.5 })} aria-pressed={sec} title={x.not}
                  className={cn("flex h-[74px] flex-col items-center justify-center gap-1.5 rounded-[12px] transition-[background-color,transform] active:scale-95", sec ? "bg-white text-[#0a0a0b]" : "bg-white/[0.04] text-metin-2 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.08] hover:text-metin")}>
                  <OranSekli oran={x.o} boyut={20} />
                  <span className="text-center leading-tight"><span className="block text-[12px] font-semibold tabular-nums">{x.o}</span><span className={cn("block text-[10.5px]", sec ? "text-black/55" : "text-metin-3")}>{x.ad}</span></span>
                </button>
              );
            })}
          </div>
          <p className="border-t border-white/[0.06] px-3 py-2 text-[12px] text-metin-2">{KADRAJ_ORANLAR.find((x) => x.o === k.oran)?.not}</p>
        </Kart>
        <Kart baslik="Yerleşim">
          <div className="grid grid-cols-2 gap-1.5 p-2">
            {([["kirp", "Kırp", "Kadrajı doldurur, kenarlar kesilir", Crop], ["dolgu", "Bulanık dolgu", "Görüntünün tamamı kalır", Palette]] as const).map(([m, a, n, I]) => (
              <button key={m} onClick={() => setK({ ...k, mod: m, x: 0.5, y: 0.5, yakin: 1 })} aria-pressed={k.mod === m}
                className={cn("flex flex-col items-start gap-1.5 rounded-[12px] p-2.5 text-left ring-1 ring-inset transition-[background-color,transform] active:scale-[0.98]", k.mod === m ? "bg-white/[0.08] ring-white/50" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06]")}>
                <I className="h-4 w-4 text-metin" /><span className="text-[12.5px] font-semibold text-metin">{a}</span><span className="text-[11px] leading-snug text-metin-3">{n}</span>
              </button>
            ))}
          </div>
          <div className="space-y-3 border-t border-white/[0.06] p-3">
            {surgu("Yatay konum", k.x, (n) => setK({ ...k, x: n }), 0, 1, "Sol", "Sağ")}
            {surgu("Dikey konum", k.y, (n) => setK({ ...k, y: n }), 0, 1, "Üst", "Alt")}
            {surgu("Yakınlaştır", k.yakin, (n) => setK({ ...k, yakin: n }), k.mod === "kirp" ? 1 : 0.6, 2)}
          </div>
        </Kart>
      </div>
      <Uygula etiket={`${k.oran} klip olarak kaydet`} oran={oran} onUygula={onUygula} kapali={ayni}
        not={ayni ? "Klip zaten bu oranda; başka bir oran ya da yerleşim seç." : "Özgün klip kalır; kadrajlı hâli yeni sürüm olarak eklenir. Kredi düşmez."} />
    </motion.div>
  );
}

/** Oynatıcı üstünde kırpma çerçevesi: dışarıda kalan alan karartılır. */
export function KadrajKatmani({ k, sw, sh }: { k: Kadraj; sw: number; sh: number }) {
  const a = useMemo(() => kirpAlani(sw, sh, k), [sw, sh, k]);
  if (k.mod !== "kirp" || !sw) return null;
  const l = (a.x / sw) * 100, t = (a.y / sh) * 100, w = (a.w / sw) * 100, h = (a.h / sh) * 100;
  const koyu = "absolute bg-black/60 transition-all duration-150";
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <span className={koyu} style={{ left: 0, top: 0, width: "100%", height: `${t}%` }} />
      <span className={koyu} style={{ left: 0, top: `${t + h}%`, width: "100%", bottom: 0 }} />
      <span className={koyu} style={{ left: 0, top: `${t}%`, width: `${l}%`, height: `${h}%` }} />
      <span className={koyu} style={{ left: `${l + w}%`, top: `${t}%`, right: 0, height: `${h}%` }} />
      <span className="absolute rounded-[4px] ring-2 ring-white transition-all duration-150" style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%` }}>
        <span className="absolute inset-0 bg-[linear-gradient(to_right,transparent_33%,rgba(255,255,255,0.25)_33%,rgba(255,255,255,0.25)_calc(33%+1px),transparent_calc(33%+1px),transparent_66%,rgba(255,255,255,0.25)_66%,rgba(255,255,255,0.25)_calc(66%+1px),transparent_calc(66%+1px))]" />
      </span>
    </span>
  );
}

/** Kayıt sırasında hata metni. */
export const atolyeHata = (e: unknown) => toast.error("Klip kaydedilemedi", { description: `${e instanceof Error ? e.message : "Bilinmeyen hata."} Videonun yüklendiğinden emin olup yeniden dene.` });
