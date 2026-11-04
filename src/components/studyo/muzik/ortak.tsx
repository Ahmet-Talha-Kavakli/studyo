"use client";

import { useEffect, useRef, useState } from "react";
import { Ban, Check, Pause, Play, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { stilEtiketi } from "@/lib/muzikVeri";
import { toast } from "@/lib/toast";
import { besteAyari, type Parca } from "@/store/useMuzik";
import { besteWavUrl } from "@/lib/muzikMotoru";
import { modelBul } from "@/lib/muzikVeri";
import type { CalKaynak } from "@/lib/sesCalici";

/* ── Sağlayıcı durumu (oturum boyunca önbellekte) ── */
export type MuzikDurum = { eleven: boolean; lyria: boolean };
let durumOnbellek: MuzikDurum | null = null;
let durumIstek: Promise<MuzikDurum> | null = null;
export function useMuzikDurum(): MuzikDurum | null {
  const [d, setD] = useState<MuzikDurum | null>(durumOnbellek);
  useEffect(() => {
    if (durumOnbellek) return;
    durumIstek ??= fetch("/api/muzik/durum").then((r) => r.json()).catch(() => ({ eleven: false, lyria: false }));
    let iptal = false;
    void durumIstek.then((x) => { durumOnbellek = x; if (!iptal) setD(x); });
    return () => { iptal = true; };
  }, []);
  return d;
}
export const modelBagli = (d: MuzikDurum | null, model: string) => !!d && d[modelBul(model).saglayici];

/* ── Çalma kaynağı ──
   Gerçek parçada sağlayıcının dosyası. Örnek parçada tarayıcıda sentezlenen WAV (deterministik,
   tohumdan) — yalnız türü/tempoyu yansıtır; istem ve sözler bu sese yansımaz. */
const demoUrl = new Map<string, Promise<string>>();
export async function parcaKaynagi(p: Parca): Promise<CalKaynak | null> {
  if (p.sesUrl) return { tur: "dosya", url: p.sesUrl };
  if (p.durum !== "tamam") return null;
  const anahtar = `${p.id}-${p.tohum}-${p.sure}`;
  if (!demoUrl.has(anahtar)) {
    toast("Örnek parça hazırlanıyor", { description: "Tarayıcıda birkaç saniye sürer. Müzik sağlayıcısı bağlıyken gerçek parça çalar." });
    const tur = (p.stiller ?? []).join(" ");
    const eslesen = ["Elektronik", "Hip Hop", "R&B", "Rock", "Klasik", "Jazz", "Lo-fi", "Ambient", "Metal", "Folk", "Arabesk", "Pop"]
      .find((t) => tur.toLowerCase().includes(t.toLowerCase().replace("-", "")) || (t === "Elektronik" && /edm|house|techno|synth/i.test(tur)) || (t === "Hip Hop" && /trap|rap/i.test(tur)));
    demoUrl.set(anahtar, besteWavUrl(besteAyari(p, eslesen)));
  }
  return { tur: "dosya", url: await demoUrl.get(anahtar)! };
}

/* ── Kapak ── */
export function Kapak({ src, boyut, className, yuvarlak = 12, aktif, children }: { src?: string; boyut: number; className?: string; yuvarlak?: number; aktif?: boolean; children?: React.ReactNode }) {
  return (
    <span className={cn("relative block shrink-0 overflow-hidden bg-white/[0.065]", className)} style={{ width: boyut, height: boyut, borderRadius: yuvarlak }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className={cn("absolute inset-0 h-full w-full object-cover transition-transform duration-700", aktif && "scale-[1.06]")} />}
      <span className="absolute inset-0 ring-1 ring-inset ring-white/10" style={{ borderRadius: yuvarlak }} />
      {children}
    </span>
  );
}

/** Kapak üstünde oynat/duraklat örtüsü. */
export function KapakOynat({ calisiyor, gorunur }: { calisiyor: boolean; gorunur?: boolean }) {
  return (
    <span className={cn("absolute inset-0 flex items-center justify-center bg-black/35 transition-opacity", calisiyor || gorunur ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
      {calisiyor ? <Pause className="h-5 w-5 fill-white text-white" /> : <Play className="ml-0.5 h-5 w-5 fill-white text-white" />}
    </span>
  );
}

/** Çalarken zıplayan çubuklar. */
export function CalanCubuklar({ className }: { className?: string }) {
  return (
    <span className={cn("flex h-3 items-end gap-[2px]", className)} aria-hidden>
      {[0, 1, 2].map((i) => <span key={i} className="w-[3px] animate-pulse rounded-full bg-aksan" style={{ height: `${[60, 100, 40][i]}%`, animationDelay: `${i * 0.18}s`, animationDuration: "0.7s" }} />)}
    </span>
  );
}

/* ── Stil çip girdisi ── */
export function StilGirdisi({ degerler, onDegis, yerTutucu, ton = "pozitif", etiket, max = 50 }: {
  degerler: string[]; onDegis: (l: string[]) => void; yerTutucu: string; ton?: "pozitif" | "negatif"; etiket: string; max?: number;
}) {
  const [taslak, setTaslak] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const ekle = (ham: string) => {
    const yeni = ham.split(",").map((x) => x.trim().toLowerCase()).filter((x) => x && !degerler.includes(x));
    if (yeni.length) onDegis([...degerler, ...yeni].slice(0, max));
    setTaslak("");
  };
  return (
    <div onClick={() => ref.current?.focus()}
      className="flex min-h-[32px] cursor-text flex-wrap items-center gap-1.5">
      {degerler.map((d) => (
        <span key={d} className={cn("flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-[12.5px] font-medium",
          ton === "negatif" ? "bg-rose-500/[0.12] text-rose-200 ring-1 ring-inset ring-rose-400/25" : "bg-aksan/15 text-aksan")}>
          {ton === "negatif" && <Ban className="h-3 w-3 opacity-70" />}{stilEtiketi(d)}
          <button onClick={(e) => { e.stopPropagation(); onDegis(degerler.filter((x) => x !== d)); }} aria-label={`${d} kaldır`} className="flex h-4 w-4 items-center justify-center rounded-full opacity-60 hover:bg-white/10 hover:opacity-100"><X className="h-3 w-3" /></button>
        </span>
      ))}
      <input ref={ref} value={taslak} onChange={(e) => { const v = e.target.value; if (v.endsWith(",")) ekle(v); else setTaslak(v); }} aria-label={etiket}
        onKeyDown={(e) => {
          if (e.key === "Enter" && taslak.trim()) { e.preventDefault(); ekle(taslak); }
          else if (e.key === "Backspace" && !taslak && degerler.length) onDegis(degerler.slice(0, -1));
        }}
        onBlur={() => taslak.trim() && ekle(taslak)}
        placeholder={degerler.length ? "" : yerTutucu}
        className="min-w-[120px] flex-1 bg-transparent py-1 text-[14px] text-metin outline-none placeholder:text-metin-2" />
    </div>
  );
}

/** Öneri çipi (stile ekler). */
export function OneriCipi({ ad, secili, onTikla }: { ad: string; secili: boolean; onTikla: () => void }) {
  return (
    <button onClick={onTikla} aria-pressed={secili}
      className={cn("flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[12.5px]",
        secili ? "bg-white font-medium text-black" : "bg-white/[0.085] text-metin-2 hover:text-metin")}>
      {!secili && <Plus className="h-3 w-3 opacity-50" />}{ad}
    </button>
  );
}

/**
 * Plaklı kapak — kare kapağın arkasından yarısı görünen plak (imza motif). Çalarken plak
 * döner; ortasındaki etiket kapağın kendisidir. Genişlik boyut × 1.32.
 */
export function PlakKapak({ src, boyut, aktif, children }: { src?: string; boyut: number; aktif?: boolean; children?: React.ReactNode }) {
  const disk = Math.round(boyut * 0.94);
  return (
    <span className="relative block shrink-0" style={{ width: Math.round(boyut * 1.32), height: boyut }}>
      <span className={cn("plak-disk absolute right-0 top-1/2 -translate-y-1/2", aktif && "plak-donuyor")} style={{ width: disk, height: disk }}>
        <span className="absolute inset-[34%] rounded-full bg-white/10 bg-cover bg-center ring-1 ring-black/40" style={src ? { backgroundImage: `url(${src})` } : undefined} />
        <span className="absolute left-1/2 top-1/2 h-[6%] w-[6%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zemin" />
      </span>
      <span className="absolute left-0 top-0 overflow-hidden rounded-[7px] bg-white/[0.075]" style={{ width: boyut, height: boyut }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src && <img src={src} alt="" className="h-full w-full object-cover" />}
        <span className="absolute inset-0 rounded-[7px] ring-1 ring-inset ring-white/10" />
        {children}
      </span>
    </span>
  );
}
