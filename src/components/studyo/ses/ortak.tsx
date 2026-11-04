"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/* ── Ses küresi ──
   Her sesin kendine özgü kapağı: sesin renginden türetilen üç tonlu, katmanlı bir küre.
   Sesler için portre yok; uydurma yüz koymuyoruz. Çalarken küre yavaşça döner. */
function hexHsl(hex: string): [number, number, number] {
  const m = hex.replace("#", "").match(/.{2}/g)?.map((x) => parseInt(x, 16) / 255) ?? [0.4, 0.4, 1];
  const [r, g, b] = m, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l * 100];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}
const tohumSayi = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

export function SesAvatar({ ad, renk, boyut = 36, className, aktif }: { ad: string; renk: string; boyut?: number; className?: string; aktif?: boolean }) {
  const [h, s] = hexHsl(renk);
  const t = tohumSayi(ad);
  const ton = (kayma: number, isik: number) => `hsl(${(h + kayma + 360) % 360} ${Math.max(55, s)}% ${isik}%)`;
  const zemin = `conic-gradient(from ${t % 360}deg, ${ton(0, 60)}, ${ton(38 + (t % 30), 66)}, ${ton(-46 - (t % 25), 52)}, ${ton(12, 72)}, ${ton(0, 60)})`;
  return (
    <span className={cn("relative isolate block shrink-0 overflow-hidden rounded-full", className)} style={{ width: boyut, height: boyut }} aria-hidden>
      <span className="absolute inset-[-30%] animate-spin" style={{ background: zemin, filter: `blur(${Math.max(2, boyut * 0.1)}px)`, animationDuration: "7s", animationPlayState: aktif ? "running" : "paused" }} />
      <span className="absolute inset-0" style={{ background: "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.6), rgba(255,255,255,0) 42%), radial-gradient(circle at 70% 85%, rgba(0,0,0,0.28), rgba(0,0,0,0) 55%)" }} />
      <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
    </span>
  );
}

/* ── Dalga formu ──
   Gerçek ses dosyasında tepe değerleri sesin KENDİSİNDEN çözülür (Web Audio). Dosya yoksa
   (tarayıcı sesiyle demo) çubuklar tohumdan türetilir — `sus` ile soluk çizilir. */
const tepeOnbellek = new Map<string, number[]>();

export function useDalga(url: string | undefined, n: number): number[] | null {
  const anahtar = url ? `${url}#${n}` : "";
  const [tepeler, setTepeler] = useState<number[] | null>(() => (anahtar ? tepeOnbellek.get(anahtar) ?? null : null));
  useEffect(() => {
    if (!url) { setTepeler(null); return; }
    const hazir = tepeOnbellek.get(anahtar);
    if (hazir) { setTepeler(hazir); return; }
    let iptal = false;
    (async () => {
      try {
        const bayt = await (await fetch(url)).arrayBuffer();
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const tampon = await ctx.decodeAudioData(bayt);
        void ctx.close();
        const veri = tampon.getChannelData(0);
        const adim = Math.max(1, Math.floor(veri.length / n));
        const ham = Array.from({ length: n }, (_, i) => {
          let tepe = 0;
          for (let j = i * adim; j < Math.min(veri.length, (i + 1) * adim); j++) tepe = Math.max(tepe, Math.abs(veri[j]));
          return tepe;
        });
        const enBuyuk = Math.max(...ham, 0.0001);
        const sonuc = ham.map((t) => Math.max(4, Math.round((t / enBuyuk) * 100)));
        tepeOnbellek.set(anahtar, sonuc);
        if (!iptal) setTepeler(sonuc);
      } catch {
        if (!iptal) setTepeler(null);
      }
    })();
    return () => { iptal = true; };
  }, [url, n, anahtar]);
  return tepeler;
}

function tohumDalga(tohum: string, n: number): number[] {
  let h = 0; for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  const rnd = () => { h = (h * 1103515245 + 12345) & 0x7fffffff; return h / 0x7fffffff; };
  return Array.from({ length: n }, (_, i) => {
    const zarf = 0.45 + 0.55 * Math.abs(Math.sin(i * 0.13 + (h % 7)) * Math.cos(i * 0.041));
    return Math.max(8, Math.min(100, zarf * (45 + rnd() * 55)));
  });
}

export function Dalga({ url, tohum, n = 64, oran = 0, className, onKonum, sus, toplamSn }: {
  url?: string; tohum: string; n?: number; oran?: number; className?: string;
  /** Tıklanan konuma git (0–1). Verilmezse çubuklar etkileşimsiz. */
  onKonum?: (o: number) => void;
  /** Gerçek ses yok — çubuklar temsilidir. */
  sus?: boolean;
  /** Toplam süre (sn) — klavye adımı (5 sn) ve ekran okuyucu metni için. */
  toplamSn?: number;
}) {
  const gercek = useDalga(url, n);
  const yedek = useMemo(() => tohumDalga(tohum, n), [tohum, n]);
  const cubuklar = gercek ?? yedek;
  const adim = toplamSn && toplamSn > 0 ? 5 / toplamSn : 0.05;
  const tus = (e: React.KeyboardEvent) => {
    if (!onKonum) return;
    const y = e.key === "ArrowRight" || e.key === "ArrowUp" ? Math.min(0.999, oran + adim)
      : e.key === "ArrowLeft" || e.key === "ArrowDown" ? Math.max(0, oran - adim)
      : e.key === "Home" ? 0 : e.key === "End" ? 0.999 : null;
    if (y === null) return;
    e.preventDefault(); onKonum(y);
  };
  return (
    <div className={cn("flex items-center gap-[2px]", onKonum && "cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-aksan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent", className)}
      onClick={onKonum ? (e) => { const r = e.currentTarget.getBoundingClientRect(); onKonum((e.clientX - r.left) / r.width); } : undefined}
      onKeyDown={onKonum ? tus : undefined} tabIndex={onKonum ? 0 : undefined}
      role={onKonum ? "slider" : undefined} aria-label={onKonum ? "Konuma git" : undefined}
      aria-valuemin={onKonum ? 0 : undefined} aria-valuemax={onKonum ? 100 : undefined} aria-valuenow={onKonum ? Math.round(oran * 100) : undefined}
      aria-valuetext={onKonum && toplamSn ? `${sureMetni(oran * toplamSn)} / ${sureMetni(toplamSn)}` : undefined}>
      {cubuklar.map((b, i) => (
        <span key={i} className={cn("min-w-[2px] flex-1 rounded-full transition-colors", sus && "opacity-50")}
          style={{ height: `${b}%`, background: i / cubuklar.length < oran ? "var(--color-aksan, #6d6bff)" : "rgba(255,255,255,0.22)" }} />
      ))}
    </div>
  );
}

/* ── Ortak yardımcılar (geçmiş, şerit, görüntüleyici) ── */

const sureMetni = (sn: number) => { const t = Math.max(0, Math.round(sn)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };

/** "az önce" · "3 dk önce" · "Bugün 14:10" · "Dün 09:12" · "12 Eki 18:40" */
export function goreliZaman(t: number): string {
  const fark = (Date.now() - t) / 1000;
  if (fark < 60) return "az önce";
  if (fark < 3600) return `${Math.floor(fark / 60)} dk önce`;
  const g = new Date(t), bugun = new Date(), dun = new Date(Date.now() - 86_400_000);
  const saat = g.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (g.toDateString() === bugun.toDateString()) return `Bugün ${saat}`;
  if (g.toDateString() === dun.toDateString()) return `Dün ${saat}`;
  return `${g.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} ${saat}`;
}

type SureliUretim = { id: string; sesUrl?: string; prompt?: string; meta?: { sureSn?: number; karakter?: number; hamIstem?: string } & Record<string, unknown> };
/**
 * Üretimin süresi (sn): kayıtlı `meta.sureSn`; yoksa gerçek dosyada bir kez meta veriden ölçülüp
 * kayda yazılır; demoda karakter / 15 tahmini (yaklaşık: true).
 */
export function useUretimSuresi(u: SureliUretim, kaydet?: (sureSn: number) => void): { sn: number | null; yaklasik: boolean } {
  const kayitli = typeof u.meta?.sureSn === "number" ? u.meta.sureSn : null;
  const [olculen, setOlculen] = useState<number | null>(null);
  useEffect(() => {
    if (kayitli !== null || !u.sesUrl) return;
    let iptal = false;
    const a = new Audio(); a.preload = "metadata";
    a.onloadedmetadata = () => { if (iptal || !isFinite(a.duration) || a.duration <= 0) return; const sn = Math.round(a.duration * 10) / 10; setOlculen(sn); kaydet?.(sn); };
    a.src = u.sesUrl;
    return () => { iptal = true; a.src = ""; };
  }, [u.sesUrl, kayitli]); // eslint-disable-line react-hooks/exhaustive-deps
  if (kayitli !== null) return { sn: kayitli, yaklasik: false };
  if (olculen !== null) return { sn: olculen, yaklasik: false };
  if (u.sesUrl) return { sn: null, yaklasik: false };
  const karakter = typeof u.meta?.karakter === "number" ? u.meta.karakter : ((u.meta?.hamIstem as string | undefined) ?? u.prompt ?? "").length;
  return karakter > 0 ? { sn: Math.max(1, Math.round(karakter / 15)), yaklasik: true } : { sn: null, yaklasik: false };
}

export type Kelime = { k: string; b: number; s: number; kon?: string };

const zamanDamgasi = (sn: number, ayirac: "," | ".") => {
  const ms = Math.max(0, Math.round(sn * 1000));
  const s = Math.floor(ms / 1000), d = Math.floor(s / 60), sa = Math.floor(d / 60);
  return `${String(sa).padStart(2, "0")}:${String(d % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}${ayirac}${String(ms % 1000).padStart(3, "0")}`;
};
/** Kelimeleri altyazı satırlarına böler: en fazla 7 kelime ya da 3,5 sn; konuşmacı değişince yeni satır. */
export function altyaziSatirlari(kelimeler: Kelime[]): { b: number; s: number; metin: string; kon?: string }[] {
  const satirlar: { b: number; s: number; metin: string; kon?: string }[] = [];
  let tampon: Kelime[] = [];
  const bosalt = () => { if (!tampon.length) return; satirlar.push({ b: tampon[0].b, s: tampon[tampon.length - 1].s, metin: tampon.map((x) => x.k).join(" ").replace(/\s+([,.!?;:])/g, "$1"), kon: tampon[0].kon }); tampon = []; };
  for (const w of kelimeler) {
    if (tampon.length && (tampon.length >= 7 || w.s - tampon[0].b > 3.5 || w.kon !== tampon[0].kon)) bosalt();
    tampon.push(w);
  }
  bosalt();
  return satirlar;
}
export function altyaziUret(kelimeler: Kelime[], tur: "srt" | "vtt"): string {
  const s = altyaziSatirlari(kelimeler);
  if (tur === "srt") return s.map((x, i) => `${i + 1}\n${zamanDamgasi(x.b, ",")} --> ${zamanDamgasi(x.s, ",")}\n${x.metin}\n`).join("\n");
  return "WEBVTT\n\n" + s.map((x) => `${zamanDamgasi(x.b, ".")} --> ${zamanDamgasi(x.s, ".")}\n${x.metin}\n`).join("\n");
}
/** Metin dosyasını tarayıcıda indirir. */
export function metinIndir(ad: string, icerik: string, tip = "text/plain") {
  const url = URL.createObjectURL(new Blob([icerik], { type: `${tip};charset=utf-8` }));
  const a = document.createElement("a"); a.href = url; a.download = ad; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/** Dosya adı için güvenli kök. */
export const dosyaKoku = (s: string) => (s.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || "ses");
