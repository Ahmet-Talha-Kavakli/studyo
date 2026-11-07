"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronDown, ChevronLeft, ChevronRight, Search, Sparkles, Lock, Loader2, X, Download, Heart, Trash2, Images, Wand2,
  Maximize2, Crop, AlertTriangle, RotateCcw, Copy, SplitSquareHorizontal, Clock, Minus, Plus, type LucideIcon,
} from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { Yuzen } from "@/components/ui/Yuzen";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { FavoriDugmesi, FavoriRozeti, KartDahaMenusu, YenidenKullanDugmesi, eylemDugmesi } from "@/components/galeri/KartEylemleri";
import { Star as YildizIkon, ArrowUpRight as AcIkon } from "lucide-react";
import { Rozet, MarkaKare } from "@/components/studyo/hf";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import { useScrollKilit } from "@/hooks/useScrollKilit";
import { GORSEL_MODELLER, type GorselModel } from "@/lib/gorselModelVeri";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { uretimIndir } from "@/lib/gercekEylem";
import { zipIndir } from "@/lib/zipYaz";

/**
 * Görsel araçlarının ortak parçaları (Düzenle, Büyüt, Çerçevele, Karakter, Pano, Photodump,
 * Instadump, Moda). Görsel/Ses stüdyolarıyla aynı dil: hf-kart paneller, logo kutulu
 * model kartı, ikonlu cam çipler, camgöbeği Üret + özet satırı, fotoğraflı sonuç kartları.
 * Her denetim gerçek bir alana bağlıdır; sağlayıcı yoksa DEMO açıkça yazılır ve kredi düşmez.
 */

export const kucukBaslik = "text-[12px] font-medium text-metin-2";
export const krediYaz = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "").replace(".", ","));

/* ── Sağlayıcı / model ── */
export const gorselModelBul = (ad: string): GorselModel => GORSEL_MODELLER.find((m) => m.ad === ad) ?? GORSEL_MODELLER[0];
/** Görsel sağlayıcı bağlantısı: null = kontrol ediliyor. */
export function useGorselBaglanti() {
  const s = useSaglayicilar();
  return useMemo(() => {
    const herhangi = !!s && ["gemini", "seedream", "openai", "fal"].some((k) => s[k]);
    const bagli = (m: GorselModel) => (!s ? null : m.ad === "Auto" ? herhangi : !!s[m.api.saglayici]);
    return { hazir: !!s, herhangi, bagli, fal: !!s?.fal };
  }, [s]);
}
export const modelKredi = (m: GorselModel) => m.kredi ?? 4;

/** Logo kutulu model kartı + aramalı menü (Görsel/Video deseni). */
export function GorselModelKarti({ deger, onSec, filtre, etiket = "Model", aciklama }: {
  deger: string; onSec: (ad: string) => void; filtre?: (m: GorselModel) => boolean; etiket?: string; aciklama?: (m: GorselModel) => string | undefined;
}) {
  const [acik, setAcik] = useState(false);
  const [ara, setAra] = useState("");
  const b = useGorselBaglanti();
  const m = gorselModelBul(deger);
  const liste = GORSEL_MODELLER.filter((x) => !x.gizli && (!filtre || filtre(x)) && x.ad.toLocaleLowerCase("tr").includes(ara.trim().toLocaleLowerCase("tr")));
  const grup = (g: "one" | "tum") => liste.filter((x) => (x.grup ?? "tum") === g);
  const satir = (x: GorselModel) => {
    const sec = x.ad === deger; const bg = b.bagli(x);
    return (
      <button key={x.ad} onClick={() => { onSec(x.ad); setAcik(false); }}
        className={cn("flex w-full items-center gap-3 rounded-[10px] p-2 text-left transition-colors hover:bg-white/6", sec && "bg-white/[0.06]")}>
        <MarkaKare ad={x.ad} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[14px] font-medium text-metin">{x.ad}</span>
            {x.rozet === "Yeni" && <Rozet tur="yeni" />}
            {bg === false && <Rozet tur="demo" />}
          </span>
          <span className="block truncate text-[11.5px] text-metin-3">{aciklama?.(x) ?? x.ozet}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="flex items-center justify-end gap-0.5 text-[12px] tabular-nums text-metin-2"><KrediYildiz className="h-3 w-3" />{krediYaz(modelKredi(x))}</span>
          {sec && <Check className="ml-auto mt-0.5 h-3.5 w-3.5 text-aksan" />}
        </span>
      </button>
    );
  };
  return (
    <div className="relative">
      <button onClick={() => { setAra(""); setAcik((v) => !v); }} aria-expanded={acik}
        className={cn("hf-btn panel-ic panel-ic-hover flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", acik && "ring-1 ring-aksan")}>
        <MarkaKare ad={m.ad} boyut={34} />
        <span className="min-w-0 flex-1">
          <span className="block text-[10.5px] uppercase tracking-wide text-metin-3">{etiket}</span>
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[14px] font-medium text-metin">{m.ad}</span>
            {m.rozet === "Yeni" && <Rozet tur="yeni" />}
            {b.bagli(m) === false && <Rozet tur="demo" />}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-metin-2 transition-transform", acik && "rotate-180")} />
      </button>
      <AnimatePresence>
        <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sol" bosluk={8} etiket="Model seç"
          className="menu-surface flex max-h-[min(480px,70vh)] w-[min(360px,calc(100vw-24px))] flex-col overflow-hidden rounded-[16px]">
          <div className="flex items-center gap-2 border-b border-kenar px-3 py-2.5">
            <Search className="h-4 w-4 text-metin-3" />
            <input autoFocus value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Model ara…" aria-label="Model ara" spellCheck={false} className="w-full bg-transparent text-[14px] text-metin outline-none placeholder:text-metin-3" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-1.5 [scrollbar-width:thin]">
            {grup("one").length > 0 && <p className={cn(kucukBaslik, "flex items-center gap-1.5 px-2 py-1.5")}><Sparkles className="h-3 w-3" /> Öne çıkan</p>}
            {grup("one").map(satir)}
            {grup("tum").length > 0 && <p className={cn(kucukBaslik, "px-2 pb-1.5 pt-2.5")}>Tüm modeller</p>}
            {grup("tum").map(satir)}
            {!liste.length && <p className="px-3 py-6 text-center text-[13px] text-metin-3">Model bulunamadı</p>}
          </div>
        </Yuzen>
      </AnimatePresence>
    </div>
  );
}

/* ── Açılır cam çip ── */
export function SecimCipi({ ikon: I, deger, etiket, baslik, children, yerlesim = "alt-sol", genislik = 280, devreDisi, title }: {
  ikon: LucideIcon; deger: ReactNode; etiket: string; baslik?: string; children: (kapat: () => void) => ReactNode; yerlesim?: "alt-sol" | "alt-sag" | "ust-sol"; genislik?: number; devreDisi?: boolean; title?: string;
}) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="relative min-w-0">
      {/* Başlıklı ayar karosu: üstte küçük başlık, altta ikon kutusu + değer */}
      <button onClick={() => setAcik((v) => !v)} disabled={devreDisi} aria-expanded={acik} aria-label={etiket} title={title ?? etiket}
        className={cn("hf-btn panel-ic flex h-[62px] w-full flex-col justify-center gap-1 rounded-2xl px-2.5 text-left transition-shadow disabled:opacity-45", acik ? "ring-1 ring-aksan" : "panel-ic-hover")}>
        <span className="truncate text-[9.5px] font-semibold uppercase tracking-[0.08em] text-metin-3">{baslik ?? etiket}</span>
        <span className="flex w-full items-center gap-1.5">
          <span className="glass-ikon glass-ikon-cyan flex h-6 w-6 shrink-0 items-center justify-center rounded-md"><I className="h-3.5 w-3.5" /></span>
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold tabular-nums text-metin">{deger}</span>
          {!devreDisi && <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-metin-3 transition-transform", acik && "rotate-180")} />}
        </span>
      </button>
      <AnimatePresence>
        <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim={yerlesim} bosluk={8} etiket={etiket} className="menu-surface rounded-[16px] p-3" >
          <div style={{ width: `min(${genislik}px, calc(100vw - 48px))` }}>{children(() => setAcik(false))}</div>
        </Yuzen>
      </AnimatePresence>
    </div>
  );
}

/** Oran şekli ikonu (gerçek en-boy). */
export function OranSekli({ oran, boyut = 18, className }: { oran: string; boyut?: number; className?: string }) {
  const [w, h] = oran.split(":").map(Number);
  const k = (w || 1) >= (h || 1) ? boyut / (w || 1) : boyut / (h || 1);
  return (
    <span className={cn("flex items-center justify-center", className)} style={{ width: boyut, height: boyut }} aria-hidden>
      <span className="rounded-[3px] border-2" style={{ borderColor: "currentColor", width: Math.max(6, Math.round((w || 1) * k)), height: Math.max(6, Math.round((h || 1) * k)) }} />
    </span>
  );
}
export function OranSecici({ deger, onSec, oranlar, otomatik }: { deger: string; onSec: (o: string) => void; oranlar: string[]; otomatik?: string }) {
  const liste = otomatik ? ["Auto", ...oranlar] : oranlar;
  return (
    <SecimCipi ikon={Crop} etiket="En-boy oranı" baslik="Oran" deger={deger === "Auto" ? "Oto" : deger} genislik={300}>
      {(kapat) => (
        <>
          <p className={cn(kucukBaslik, "pb-2")}>En-boy oranı</p>
          <div className="grid grid-cols-4 gap-1.5">
            {liste.map((o) => (
              <button key={o} onClick={() => { onSec(o); kapat(); }} aria-pressed={deger === o} title={o === "Auto" ? otomatik : undefined}
                className={cn("hf-btn flex h-[60px] flex-col items-center justify-center gap-1 rounded-xl text-[11.5px] font-semibold", deger === o ? "glass-cip-aktif text-aksan" : "glass-cip text-metin-2 hover:text-metin")}>
                {o === "Auto" ? <Sparkles className="h-[18px] w-[18px]" /> : <OranSekli oran={o} />}{o === "Auto" ? "Oto" : o}
              </button>
            ))}
          </div>
        </>
      )}
    </SecimCipi>
  );
}
export function CozunurlukSecici({ deger, onSec, secenekler, carpan }: { deger: string; onSec: (c: string) => void; secenekler: string[]; carpan?: (c: string) => number }) {
  return (
    <SecimCipi ikon={Maximize2} etiket="Çözünürlük" baslik="Kalite" deger={deger} genislik={240} devreDisi={secenekler.length < 2}>
      {(kapat) => (
        <>
          <p className={cn(kucukBaslik, "pb-2")}>Çözünürlük</p>
          <div className="grid grid-cols-3 gap-1.5">
            {secenekler.map((c) => (
              <button key={c} onClick={() => { onSec(c); kapat(); }} aria-pressed={deger === c}
                className={cn("hf-btn flex h-14 flex-col items-center justify-center rounded-xl", deger === c ? "glass-cip-aktif text-aksan" : "glass-cip text-metin")}>
                <span className="text-[14px] font-bold">{c}</span>
                {carpan && carpan(c) > 1 && <span className="text-[10px] text-metin-3">×{krediYaz(carpan(c))} kredi</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </SecimCipi>
  );
}
export function AdetSecici({ deger, onSec, max = 4, birim = "görsel" }: { deger: number; onSec: (n: number) => void; max?: number; birim?: string }) {
  return (
    <div className="panel-ic flex h-[62px] flex-col justify-center gap-1 rounded-2xl px-2.5">
      <span className="truncate text-[9.5px] font-semibold uppercase tracking-[0.08em] text-metin-3">Adet{birim ? ` · ${birim}` : ""}</span>
      <span className="flex items-center gap-1">
        <button onClick={() => onSec(Math.max(1, deger - 1))} disabled={deger <= 1} aria-label="Azalt" className="hf-btn glass-cip flex h-6 w-6 items-center justify-center rounded-md text-metin disabled:opacity-30"><Minus className="h-3 w-3" /></button>
        <span className="flex min-w-0 flex-1 items-center justify-center gap-1 text-[15px] font-semibold tabular-nums text-metin"><Images className="h-3.5 w-3.5 text-aksan" />{deger}</span>
        <button onClick={() => onSec(Math.min(max, deger + 1))} disabled={deger >= max} aria-label="Artır" className="hf-btn glass-cip flex h-6 w-6 items-center justify-center rounded-md text-metin disabled:opacity-30"><Plus className="h-3 w-3" /></button>
      </span>
    </div>
  );
}

/** Motor karoları: logo kutusu, kredi hapı, ad, not, rozetler. onSec yoksa bilgi amaçlı adım kartıdır. */
export type MotorSecenek = { id: string; ad: string; logo: string; not: string; kredi: number | string; rozet?: ReactNode; kapali?: boolean; adim?: string; ikon?: ReactNode };
export function MotorKartlari({ secenekler, deger, onSec, sutun = 2 }: { secenekler: MotorSecenek[]; deger?: string; onSec?: (id: string) => void; sutun?: number }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(sutun, secenekler.length)}, minmax(0, 1fr))` }}>
      {secenekler.map((m) => {
        const sec = !!onSec && deger === m.id;
        const icerik = (
          <>
            <span className="flex items-start justify-between gap-2">
              {m.ikon ?? <MarkaKare ad={m.logo} boyut={38} />}
              <span className="flex items-center gap-1">
                {m.adim && <span title={`${m.adim}. adım`} className="flex h-5 w-5 items-center justify-center rounded-full bg-aksan/15 text-[10.5px] font-bold text-aksan ring-1 ring-aksan/30">{m.adim}</span>}
                <span className="glass-cip flex items-center gap-0.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums text-metin"><KrediYildiz className="h-3 w-3 text-aksan" />{m.kredi}</span>
              </span>
            </span>
            <span className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[13.5px] font-semibold leading-tight text-metin">{m.ad}{m.rozet}</span>
            <span className="mt-1 line-clamp-2 text-[11px] leading-snug text-metin-3">{m.not}</span>
            {sec && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-aksan text-zemin shadow-[0_0_12px_var(--color-aksan)]"><Check className="h-3 w-3" strokeWidth={3} /></span>}
          </>
        );
        const sinif = cn("relative flex min-h-[112px] flex-col rounded-2xl p-3 text-left transition-shadow", sec ? "glass-cip-aktif ring-1 ring-aksan/60" : "panel-ic", m.kapali && "opacity-60");
        return onSec
          ? <button key={m.id} onClick={() => onSec(m.id)} aria-pressed={sec} className={cn("hf-btn", sinif, !sec && "panel-ic-hover")}>{icerik}</button>
          : <div key={m.id} className={sinif}>{icerik}</div>;
      })}
    </div>
  );
}

/** Camgöbeği Üret düğmesi: kredi içinde, altında özet ya da eksik. */
export function UretDugmesi({ etiket, kredi, demo, kilit, ozet, eksik, onClick, mesgul, mesgulMetni = "Gönderiliyor" }: {
  etiket: string; kredi: number; demo: boolean; kilit?: boolean; ozet: string; eksik?: string | null; onClick: () => void; mesgul?: boolean; mesgulMetni?: string;
}) {
  return (
    <button onClick={onClick} disabled={mesgul} aria-busy={mesgul} title={eksik ?? undefined}
      className={cn("hf-cta flex w-full flex-col items-center justify-center gap-0.5 py-2.5 transition-opacity", (eksik || kilit) && "opacity-60")}>
      {mesgul ? <span className="flex items-center gap-2 py-1.5 text-[14px]"><Loader2 className="h-4 w-4 animate-spin" /> {mesgulMetni}</span> : (
        <>
          <span className="flex items-center gap-1.5 text-[15px]">
            {kilit && <Lock className="h-4 w-4" />}{etiket}
            {!demo && !kilit && kredi > 0 && <><KrediYildiz className="h-4 w-4" /> {krediYaz(kredi)}</>}
            
          </span>
          <span className="max-w-full truncate px-3 text-[11px] font-medium opacity-75">{eksik ?? ozet}</span>
        </>
      )}
    </button>
  );
}

/* ── Görsel yükleme yardımcıları ── */
export const dosyaOku = (d: Blob) => new Promise<string>((coz, red) => { const r = new FileReader(); r.onload = () => coz(String(r.result)); r.onerror = () => red(new Error("Dosya okunamadı")); r.readAsDataURL(d); });
export function gorselOlcu(url: string): Promise<{ w: number; h: number }> {
  return new Promise((coz) => { const i = new Image(); i.onload = () => coz({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => coz({ w: 0, h: 0 }); i.src = url; });
}
/** data URL → sunucu deposu adresi (zaten depo/yerel adresse aynen döner). */
export async function gorselYukle(dataUrl: string, uc: "/api/gorsel/yukle" | "/api/element/gorsel" = "/api/gorsel/yukle"): Promise<string> {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  const r = (await fetch(uc, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) }).then((x) => x.json())) as { ok: boolean; url?: string; hata?: string };
  if (!r.ok || !r.url) throw new Error(r.hata ?? "Yüklenemedi");
  return r.url;
}
export const GORSEL_TURLERI = ["image/png", "image/jpeg", "image/webp"];

/** Sürükle-bırak / yapıştır / seç yükleme alanı (büyük, ikonlu). */
export function YuklemeAlani({ onDosyalar, baslik, alt, ikon: I = Images, coklu, kompakt, cipler = ["PNG", "JPG", "WebP", "≤ 15 MB"], yapistir = true }: {
  onDosyalar: (d: File[]) => void; baslik: string; alt?: string; ikon?: LucideIcon; coklu?: boolean; kompakt?: boolean; cipler?: string[]; yapistir?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [ustte, setUstte] = useState(false);
  useEffect(() => {
    if (!yapistir) return;
    const f = (e: ClipboardEvent) => {
      const h = e.target as HTMLElement | null;
      if (h && /^(INPUT|TEXTAREA)$/.test(h.tagName)) return;
      const l = [...(e.clipboardData?.files ?? [])].filter((x) => GORSEL_TURLERI.includes(x.type));
      if (l.length) { e.preventDefault(); onDosyalar(coklu ? l : l.slice(0, 1)); }
    };
    window.addEventListener("paste", f);
    return () => window.removeEventListener("paste", f);
  }, [onDosyalar, coklu, yapistir]);
  const al = (l: FileList | null | undefined) => {
    const d = [...(l ?? [])].filter((x) => GORSEL_TURLERI.includes(x.type));
    if (!d.length) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    onDosyalar(coklu ? d : d.slice(0, 1));
  };
  return (
    <>
      <input ref={ref} type="file" accept={GORSEL_TURLERI.join(",")} multiple={coklu} hidden onChange={(e) => { al(e.target.files); e.target.value = ""; }} />
      <button onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setUstte(true); }} onDragLeave={() => setUstte(false)}
        onDrop={(e) => { e.preventDefault(); setUstte(false); al(e.dataTransfer.files); }}
        className={cn("hf-btn panel-ic panel-ic-hover group relative flex w-full flex-col items-center overflow-hidden rounded-2xl px-4 text-center", kompakt ? "py-5" : "py-9", ustte && "ring-2 ring-aksan")}>
        <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(240px 130px at 50% 0%, color-mix(in srgb, var(--color-aksan) 18%, transparent), transparent 70%)" }} />
        <span className={cn("glass-ikon glass-ikon-cyan relative flex items-center justify-center rounded-full transition-transform group-hover:scale-105", kompakt ? "h-12 w-12" : "h-16 w-16")}><I className={kompakt ? "h-5 w-5" : "h-7 w-7"} /></span>
        <span className={cn("relative font-semibold text-metin", kompakt ? "mt-2.5 text-[14px]" : "mt-3 text-[15px]")}>{baslik}</span>
        {alt && <span className="relative mt-1 text-[12px] text-metin-3">{alt}</span>}
        <span className="relative mt-2.5 flex flex-wrap justify-center gap-1">{cipler.map((c) => <span key={c} className="glass-cip rounded px-1.5 py-0.5 text-[10.5px] font-medium text-metin-2">{c}</span>)}</span>
        {yapistir && <span className="relative mt-2 text-[11px] text-metin-3">Sürükle · tıkla · Ctrl+V</span>}
      </button>
    </>
  );
}

/* ── Sonuç kartları ── */
export const uretimGorseli = (u: Uretim) => saltUrl(u.gorselUrl) ?? saltUrl(u.thumbnailUrl);
const oranSayi = (o?: string) => { const [w, h] = (o ?? "1:1").split(":").map(Number); return w && h ? w / h : 1; };

function GecenSure({ bas }: { bas: number }) {
  const [, tik] = useState(0);
  useEffect(() => { const t = setInterval(() => tik((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const sn = Math.max(0, Math.round((Date.now() - bas) / 1000));
  return <>{Math.floor(sn / 60)}:{String(sn % 60).padStart(2, "0")}</>;
}

export function SonucKarti({ u, onAc, etiket, secili, demoGizle, oran, onYenidenKullan, onSil, eylemsiz }: { u: Uretim; onAc: () => void; etiket?: string; secili?: boolean; /** Demo rozeti üst başlıkta tek kez gösteriliyorsa kartta tekrarlanmaz. */ demoGizle?: boolean;
  /** Görünüm ayarının kart oranı (yatay ya da dikey). */ oran?: number;
  /** İstemi komut kutusuna geri yazar (alıntı düğmesi). */ onYenidenKullan?: () => void;
  onSil?: () => void;
  /** Gönderi önizlemesi gibi süs yerlerinde eylem çubuğu çıkmaz. */ eylemsiz?: boolean;
}) {
  const g = uretimGorseli(u);
  const surer = u.durum === "kuyrukta" || u.durum === "isleniyor";
  const favoriToggle = useProjeler((s) => s.favoriToggle);
  return (
    <div className="group relative">
    <button onClick={onAc} disabled={surer} aria-label={u.baslik}
      className={cn("hf-kart relative block w-full overflow-hidden !rounded-2xl bg-yuzey-2 text-left", secili && "ring-2 ring-aksan", u.durum === "hata" && "h-full min-h-[180px]")}
      style={{ aspectRatio: u.durum === "hata" ? undefined : String(oran ?? oranSayi(u.meta?.oran === "Auto" ? undefined : u.meta?.oran)) }}>
      {g && u.durum === "tamam" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={g} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
      )}
      {surer && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_50%_40%,color-mix(in_srgb,var(--color-aksan)_14%,transparent),transparent_70%)]">
          <Loader2 className="h-6 w-6 animate-spin text-aksan" />
          <span className="text-[12px] font-medium text-metin-2">{u.durum === "kuyrukta" ? "Sırada" : `yüzde ${Math.round(u.ilerleme)}`}</span>
          {u.baslama && <span className="flex items-center gap-1 text-[11px] tabular-nums text-metin-3"><Clock className="h-3 w-3" /><GecenSure bas={u.baslama} /></span>}
          <span className="absolute inset-x-0 bottom-0 h-1 bg-white/5"><span className="block h-full bg-aksan transition-[width] duration-700" style={{ width: `${Math.max(4, u.ilerleme)}%` }} /></span>
        </span>
      )}
      {u.durum === "hata" && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[radial-gradient(90%_60%_at_50%_35%,rgba(251,113,133,0.10),transparent_70%)] px-4 text-center ring-1 ring-inset ring-white/[0.06] [border-radius:inherit]">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-400/10 text-rose-300 ring-1 ring-inset ring-rose-300/25"><AlertTriangle className="h-5 w-5" /></span>
          <span className="leading-snug">
            <span className="block text-[13.5px] font-semibold text-metin">{/sayfa kapan|yarıda/i.test(u.hata ?? "") ? "Yarıda kaldı" : "Üretilemedi"}</span>
            <span className="mt-1 block text-[12px] text-metin-2">{(u.hata ?? "Model bir sonuç döndürmedi.").replace(/^Yarıda kaldı:\s*/i, "").replace(/\s*Kredin iade edildi\.?/i, "").replace(/^./, (c) => c.toLocaleUpperCase("tr"))}</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] font-medium text-metin-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />{u.kredi ? "Kredin iade edildi" : "Kredi düşmedi"}</span>
        </span>
      )}
      <span className="pointer-events-none absolute left-2 top-2 flex gap-1">
        {etiket && <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/15">{etiket}</span>}
        
      </span>
    </button>
      {!eylemsiz && u.favori && u.durum === "tamam" && <FavoriRozeti boyut="kucuk" className="right-2 top-2 [@media(hover:none)]:!opacity-100" />}
      {!eylemsiz && u.durum === "tamam" && (
        <div onClick={(e) => e.stopPropagation()} className="pointer-events-none absolute right-2 top-2 z-20 flex gap-1 opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:bottom-2 [@media(hover:none)]:top-auto [@media(hover:none)]:opacity-100">
          <FavoriDugmesi favori={!!u.favori} onClick={() => favoriToggle(u.id)} boyut="kucuk" side="bottom" className="[@media(hover:none)]:hidden" />
          <IndirDugmesi u={u} className={eylemDugmesi("kucuk")} ikonSinif="h-3.5 w-3.5" side="bottom" />
          {onYenidenKullan && <YenidenKullanDugmesi onClick={onYenidenKullan} boyut="kucuk" side="bottom" />}
          <KartDahaMenusu u={u} boyut="kucuk" side="bottom" onSil={onSil} eylemler={[{ ad: "Aç", ikon: AcIkon, fn: onAc }, { ad: u.favori ? "Favorilerden çıkar" : "Favorilere ekle", ikon: YildizIkon, fn: () => favoriToggle(u.id) }]} />
        </div>
      )}
    </div>
  );
}

/** Sonuçlar: grup başlıklı ızgara (aynı gönderimdeki kareler bir arada). */
export function SonucIzgarasi({ uretimler, onAc, sutun = "grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4", etiket }: {
  uretimler: Uretim[]; onAc: (id: string) => void; sutun?: string; etiket?: (u: Uretim) => string | undefined;
}) {
  return (
    <div className={cn("grid gap-2.5", sutun)}>
      {uretimler.map((u) => <SonucKarti key={u.id} u={u} onAc={() => onAc(u.id)} etiket={etiket?.(u)} />)}
    </div>
  );
}

/** Önce/sonra kaydırıcısı. */
export function Karsilastir({ once, sonra, oran }: { once: string; sonra: string; oran?: number }) {
  const [x, setX] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const tasi = (cx: number) => { const r = ref.current?.getBoundingClientRect(); if (r) setX(Math.max(0, Math.min(100, ((cx - r.left) / r.width) * 100))); };
  return (
    <div ref={ref} className="relative max-h-full max-w-full select-none overflow-hidden rounded-xl" style={{ aspectRatio: oran ? String(oran) : undefined }}
      onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); tasi(e.clientX); }} onPointerMove={(e) => { if (e.buttons) tasi(e.clientX); }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sonra} alt="Sonra" className="block h-full w-full object-contain" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={once} alt="Önce" className="absolute inset-0 h-full w-full object-contain" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }} draggable={false} />
      <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${x}%` }} />
      <span role="slider" tabIndex={0} aria-label="Önce / sonra" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(x)}
        onKeyDown={(e) => { if (e.key === "ArrowLeft") setX((v) => Math.max(0, v - 5)); if (e.key === "ArrowRight") setX((v) => Math.min(100, v + 5)); }}
        className="absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-zemin outline-none focus-visible:ring-2 focus-visible:ring-aksan" style={{ left: `${x}%` }}>
        <SplitSquareHorizontal className="h-4 w-4" />
      </span>
      <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10.5px] font-semibold text-white">Önce</span>
      <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10.5px] font-semibold text-white">Sonra</span>
    </div>
  );
}

/** Tam ekran sonuç görüntüleyici: gezinme, önce/sonra, bilgi çipleri, araçlar arası köprüler. */
export function SonucGoruntuleyici({ liste, id, onSec, onKapat, kaynak, ekEylem }: {
  liste: Uretim[]; id: string; onSec: (id: string) => void; onKapat: () => void;
  /** Bu sonucun türetildiği görsel (önce/sonra için). */
  kaynak?: (u: Uretim) => string | undefined;
  ekEylem?: (u: Uretim) => ReactNode;
}) {
  const router = useRouter();
  const u = liste.find((x) => x.id === id);
  const i = liste.findIndex((x) => x.id === id);
  const [karsi, setKarsi] = useState(false);
  const odak = useOdakTuzagi();
  useScrollKilit(true);
  const guncelle = useProjeler((s) => s.favoriToggle);
  const sil = useProjeler((s) => s.sil);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") onKapat();
      if (e.key === "ArrowRight" && liste[i + 1]) onSec(liste[i + 1].id);
      if (e.key === "ArrowLeft" && i > 0) onSec(liste[i - 1].id);
    };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, [i, liste, onKapat, onSec]);
  if (!u) return null;
  const g = uretimGorseli(u);
  const k = kaynak?.(u);
  const m = u.meta ?? {};
  const kopru = (yol: string) => g && router.push(`${yol}?kaynak=${encodeURIComponent(g)}&uretim=${u.id}`);
  const bilgi = ([["Model", u.model], ["Oran", m.oran && m.oran !== "Auto" ? String(m.oran) : ""], ["Çözünürlük", m.cozunurluk ? String(m.cozunurluk) : ""], ["Kredi", u.kredi ? `${krediYaz(u.kredi)} kredi` : "Düşmedi"]] as [string, string][]).filter(([, v]) => v);
  return (
    <motion.div ref={odak} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={u.baslik}
      className="fixed inset-0 z-[70] flex flex-col bg-black/90 backdrop-blur-sm md:flex-row" onClick={onKapat}>
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 md:p-10" onClick={(e) => e.stopPropagation()}>
        <button onClick={onKapat} aria-label="Kapat" className="hf-btn glass-cip absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-metin"><X className="h-4 w-4" /></button>
        {i > 0 && <button onClick={() => onSec(liste[i - 1].id)} aria-label="Önceki" className="hf-btn glass-cip absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-metin"><ChevronLeft className="h-5 w-5" /></button>}
        {liste[i + 1] && <button onClick={() => onSec(liste[i + 1].id)} aria-label="Sonraki" className="hf-btn glass-cip absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-metin"><ChevronRight className="h-5 w-5" /></button>}
        {g && (karsi && k ? <Karsilastir once={k} sonra={g} /> : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g} alt={u.baslik} className="max-h-full max-w-full rounded-xl object-contain" />
        ))}
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[11.5px] tabular-nums text-white/80">{i + 1} / {liste.length}</span>
      </div>
      <aside className="flex max-h-[45vh] w-full shrink-0 flex-col overflow-hidden rounded-t-3xl bg-[#141517] ring-1 ring-inset ring-white/[0.07] md:m-3 md:max-h-none md:w-[380px] md:rounded-[24px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/[0.07] p-3.5">
          {g && (/* eslint-disable-next-line @next/next/no-img-element */ <img src={g} alt="" className="h-12 w-12 shrink-0 rounded-[12px] object-cover ring-1 ring-white/10" />)}
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-snug text-metin">{u.baslik}</p>
            <p className="mt-0.5 text-[12px] tabular-nums text-metin-3">{new Date(u.olusturma).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.07] hover:text-metin md:hidden"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3.5 [scrollbar-width:thin]">
          <div className="grid grid-cols-2 gap-1.5">
            {bilgi.map(([e, v]) => (
              <span key={e} className="rounded-[12px] bg-white/[0.03] px-3 py-2 leading-tight ring-1 ring-inset ring-white/[0.06]">
                <span className="block text-[11px] text-metin-3">{e}</span>
                <span className="mt-0.5 block truncate text-[13px] font-semibold text-metin">{v}</span>
              </span>
            ))}
          </div>
          {k && (
            <button onClick={() => setKarsi((v) => !v)} aria-pressed={karsi} className={cn("hf-btn flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", karsi ? "glass-cip-aktif" : "panel-ic panel-ic-hover")}>
              <span className="glass-ikon glass-ikon-cyan flex h-8 w-8 items-center justify-center rounded-lg"><SplitSquareHorizontal className="h-4 w-4" /></span>
              <span className="text-[13px] font-medium text-metin">Önce / sonra karşılaştır</span>
            </button>
          )}
          {ekEylem && (
            <section className="overflow-hidden rounded-[16px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07]">
              <div className="border-b border-white/[0.06] px-3 py-2"><span className="text-[12.5px] font-semibold text-metin">Bu kareyle</span></div>
              <div className="p-2">{ekEylem(u)}</div>
            </section>
          )}
          {(m.hamIstem || u.prompt) && (
            <section className="overflow-hidden rounded-[16px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07]">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="text-[12.5px] font-semibold text-metin">İstem</span>
                <button onClick={() => void mesaj.kopyala(String(m.hamIstem ?? u.prompt), "İstem")} className="ml-auto flex h-7 items-center gap-1 rounded-full px-2 text-[12px] text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin"><Copy className="h-3.5 w-3.5" />Kopyala</button></div>
              <p className="whitespace-pre-wrap px-3 py-2.5 text-[13px] leading-relaxed text-metin-2">{String(m.hamIstem ?? u.prompt)}</p>
            </section>
          )}
          {liste.length > 1 && (
            <section className="overflow-hidden rounded-[16px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07]">
              <div className="flex items-center border-b border-white/[0.06] px-3 py-2"><span className="text-[12.5px] font-semibold text-metin">Bu setteki kareler</span><span className="ml-auto text-[11.5px] tabular-nums text-metin-3">{i + 1}/{liste.length}</span></div>
              <div className="grid grid-cols-4 gap-1.5 p-2">
                {liste.slice(0, 12).map((x) => { const xg = uretimGorseli(x); return (
                  <button key={x.id} onClick={() => onSec(x.id)} aria-label={x.baslik} aria-current={x.id === u.id}
                    className={cn("relative aspect-[3/4] overflow-hidden rounded-[10px] bg-white/[0.04] ring-inset transition", x.id === u.id ? "ring-2 ring-white" : "ring-1 ring-white/[0.08] opacity-70 hover:opacity-100")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {xg && <img src={xg} alt="" className="h-full w-full object-cover" />}
                  </button>
                ); })}
              </div>
            </section>
          )}
          {g && u.gercek !== false && (
            <section className="overflow-hidden rounded-[16px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07]">
              <div className="border-b border-white/[0.06] px-3 py-2"><span className="text-[12.5px] font-semibold text-metin">Devam et</span></div>
              <div className="grid grid-cols-3 gap-1.5 p-2">
                {([["Düzenle", Wand2, "/panel/inpaint"], ["Büyüt", Maximize2, "/panel/upscale"], ["Çerçevele", Crop, "/panel/reframe"]] as const).map(([a, I, y]) => (
                  <button key={a} onClick={() => kopru(y)} className="flex flex-col items-center gap-1.5 rounded-[12px] bg-white/[0.03] py-2.5 text-[12px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.07] hover:text-metin active:scale-[0.97]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07]"><I className="h-4 w-4" /></span>{a}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-white/[0.07] p-3">
          <span className="flex flex-1 [&>span]:flex-1"><IndirDugmesi u={u} side="top" yerlesim="ust-sol" etiket="İndir" className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-black transition active:scale-[0.98]"><Download className="h-4 w-4" /> İndir</IndirDugmesi></span>
          <FavoriDugmesi favori={!!u.favori} onClick={() => guncelle(u.id)} side="top" className="!h-10 !w-10" />
          <button onClick={() => { const yedek = u; const sonraki = liste[i + 1] ?? liste[i - 1]; sil(u.id); if (sonraki) onSec(sonraki.id); else onKapat(); mesaj.silindi("Üretim", () => useProjeler.setState((s) => (s.uretimler.some((x) => x.id === yedek.id) ? s : { uretimler: [yedek, ...s.uretimler] }))); }} aria-label="Sil" className="hf-btn glass-cip flex h-10 w-10 items-center justify-center rounded-full text-metin hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
        </div>
      </aside>
    </motion.div>
  );
}

/** Toplu indirme (ZIP). */
export async function topluIndir(arsiv: string, liste: Uretim[]) {
  const ogeler = liste.filter((u) => u.durum === "tamam" && u.gercek !== false).map((u, i) => ({ ad: `${String(i + 1).padStart(2, "0")}-${(u.baslik || "vayra").replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40)}`, url: uretimGorseli(u)! })).filter((x) => x.url);
  if (!ogeler.length) return void toast.error("İndirilecek görsel yok", { description: "Demo görseller dosya olarak indirilmez. Gerçek bir üretim tamamlanınca yeniden dene." });
  const t = toast.loading?.(`${ogeler.length} görsel paketleniyor`);
  const r = await zipIndir(arsiv, ogeler);
  if (t !== undefined) toast.dismiss?.(t);
  if (r.eklenen) toast.success(`${r.eklenen} görsel indirildi`, { description: r.atlanan ? `ZIP arşivi hazır. ${r.atlanan} dosyaya ulaşılamadı.` : "ZIP arşivi olarak kaydedildi." });
  else mesaj.indirilemedi("Görsellere şu an ulaşılamıyor.");
}

/* ── Sayfa kabuğu ── */
export function AracKabugu({ ikon: I, renk = "cyan", baslik, alt, panel, cta, sagBaslik, sag, mobilSag, mobilSagEtiket = "Sonuçlar", mobilSagSayi, rozet, onGeri }: {
  ikon: LucideIcon; renk?: string; baslik: string; alt: string; panel: ReactNode; cta: ReactNode;
  sagBaslik?: ReactNode; sag: ReactNode; mobilSag?: ReactNode; mobilSagEtiket?: string; mobilSagSayi?: number; rozet?: ReactNode; onGeri?: () => void;
}) {
  const masaustu = useMasaustu();
  const router = useRouter();
  const [mobilGorunum, setMobilGorunum] = useState<"panel" | "sag">("panel");
  const baslikBlok = (
    <div className="flex items-center gap-3">
      <span className={cn("glass-ikon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", `glass-ikon-${renk}`)}><I className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[16px] font-semibold text-metin">{baslik}{rozet}</span>
        <span className="block truncate text-[12px] text-metin-3">{alt}</span>
      </span>
    </div>
  );
  if (!masaustu) return (
    <div className="flex min-h-[100dvh] flex-col bg-zemin pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1.5 bg-zemin/90 px-2 backdrop-blur-md">
        <button onClick={() => (onGeri ? onGeri() : router.push("/panel"))} aria-label="Geri" className="flex h-10 w-10 items-center justify-center rounded-full text-metin"><ChevronLeft className="h-5 w-5" /></button>
        <h1 className="min-w-0 flex-1 truncate text-[18px] font-semibold text-metin">{baslik}</h1>
        <button onClick={() => setMobilGorunum((v) => (v === "panel" ? "sag" : "panel"))} className="hf-btn glass-cip flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-metin">
          {mobilGorunum === "panel" ? <><Images className="h-4 w-4 text-aksan" />{mobilSagEtiket}{!!mobilSagSayi && <span className="rounded-full bg-white/10 px-1.5 text-[10.5px] tabular-nums">{mobilSagSayi}</span>}</> : <><RotateCcw className="h-4 w-4 text-aksan" />Oluştur</>}
        </button>
      </header>
      {mobilGorunum === "panel" ? (
        <>
          <main className="flex-1 space-y-2.5 px-3 pb-4 pt-1">{panel}</main>
          <div className="sticky bottom-0 z-30 border-t border-kenar bg-yuzey/95 p-3 backdrop-blur-md">{cta}</div>
        </>
      ) : <main className="flex-1 px-3 pb-6 pt-1">{mobilSag ?? sag}</main>}
    </div>
  );
  return (
    <div className="flex h-[calc(100vh-var(--ust-nav))] w-full gap-3 bg-zemin p-3">
      <aside className="hf-kart flex w-[380px] shrink-0 flex-col overflow-hidden bg-yuzey xl:w-[400px]">
        <div className="border-b border-kenar p-3.5">{baslikBlok}</div>
        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 [scrollbar-width:thin]">{panel}</div>
        <div className="shrink-0 border-t border-kenar bg-yuzey p-3">{cta}</div>
      </aside>
      <section className="hf-kart flex min-w-0 flex-1 flex-col overflow-hidden bg-yuzey">
        {sagBaslik && <div className="flex min-h-[60px] flex-wrap items-center gap-2 border-b border-kenar p-3">{sagBaslik}</div>}
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">{sag}</div>
      </section>
    </div>
  );
}

/** Sağ alan sekmeleri (Sonuçlar / İlham). */
export function SagSekmeler<T extends string>({ deger, onDegis, sekmeler }: { deger: T; onDegis: (v: T) => void; sekmeler: [T, string, LucideIcon, number?][] }) {
  return (
    <div role="tablist" className="glass-cip flex items-center gap-1 rounded-full p-1">
      {sekmeler.map(([id, a, I, n]) => (
        <button key={id} role="tab" aria-selected={deger === id} onClick={() => onDegis(id)}
          className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors", deger === id ? "glass-cip-aktif font-medium text-metin" : "text-metin-2 hover:text-metin")}>
          <I className={cn("h-3.5 w-3.5", deger === id && "text-aksan")} />{a}
          {!!n && <span className="rounded-full bg-white/10 px-1.5 text-[10.5px] tabular-nums">{n}</span>}
        </button>
      ))}
    </div>
  );
}

/** Demo/önizleme çipi (masaüstü sağ başlık). */
export function DemoCipi({ metin }: { metin: string }) {
  return (
    <button onClick={() => toast.info("Önizleme modu açık", { description: metin })} className="glass-cip flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] text-metin-2">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fcd34d]" /> Önizleme modu
    </button>
  );
}

/** Bir araçla yapılmış üretimler (en yeni önce). */
export function useAracUretimleri(arac: string | ((u: Uretim) => boolean)) {
  const uretimler = useProjeler((s) => s.uretimler);
  return useMemo(() => uretimler.filter((u) => (typeof arac === "string" ? u.arac === arac : arac(u)) && !u.id.startsWith("seed_")).sort((a, b) => b.olusturma - a.olusturma), [uretimler, arac]);
}
