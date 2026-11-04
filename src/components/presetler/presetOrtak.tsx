"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ArrowRight, Bookmark, Box, Crown, Flame, ImageIcon, Package, UserRound, type LucideIcon } from "lucide-react";
import type { KatalogPreset } from "@/lib/presetKatalog";
import { videoKrediHesap } from "@/lib/videoModelVeri";
import { gorselKucult } from "@/components/kitaplik/yardimci";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";
import { PresetVideo } from "./PresetKarti";

/**
 * Presetler galerisi ve uygulama sayfasının ortak parçaları:
 * girdi türü, gerçek modeller ve bedel, oturum fotoğrafı, kart.
 */

export const ARAC = "Viral Presetler";

/** Bu presetle yapılmış üretimler: başlık "<ad> · preset" biçiminde yazılır (eski kayıtlar "<ad> preset"). */
export const presetBasligi = (ad: string) => `${ad} · preset`;
export const presetinMi = (baslik: string, ad: string) => baslik === presetBasligi(ad) || baslik === `${ad} preset` || baslik.startsWith(`${ad} + `);

export const trNorm = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

/* ── Girdi türü: presetin istediği fotoğraf ── */

export type Girdi = "kisi" | "nesne" | "urun" | "foto";
export const GIRDI: Record<Girdi, { ad: string; slot: string; ikon: LucideIcon; ipucu: string; iyi: string; kotu: string }> = {
  kisi: { ad: "Tek kişi", slot: "Karakter", ikon: UserRound, ipucu: "Tek kişi, yüzü net ve önden, iyi ışık", iyi: "Net yüz, tek kişi", kotu: "Kalabalık, bulanık" },
  nesne: { ad: "Kişi ya da nesne", slot: "Özne", ikon: Box, ipucu: "Özne kadrajın ortasında, sade zeminde", iyi: "Ortada, sade zemin", kotu: "Kırpık, karmaşık" },
  urun: { ad: "Ürün", slot: "Ürün", ikon: Package, ipucu: "Ürün tek başına, düz zeminde, gölgesi hafif", iyi: "Tek ürün, düz zemin", kotu: "Eğik, kalabalık" },
  foto: { ad: "Her fotoğraf", slot: "Fotoğraf", ikon: ImageIcon, ipucu: "Her fotoğraf olur; net ve en az 512 px", iyi: "Net, aydınlık", kotu: "Bulanık, küçük" },
};
const GIRDI_ESLE: Record<string, Girdi> = {
  "float-spin": "nesne", "orbit-360": "nesne", "turntable-3d": "nesne", "low-poly": "nesne", "x-ray": "nesne", "garden-bloom": "nesne",
  "product-hero": "urun",
  "sticker-peel": "foto", "scrapbook-collage": "foto", "earth-zoom": "foto", "crash-zoom": "foto", "fpv-dive": "foto", "hyperlapse": "foto", "vertigo": "foto",
};
export const presetGirdi = (p: KatalogPreset): Girdi => GIRDI_ESLE[p.slug] ?? (p.ozel ? "foto" : "kisi");

/** Türkçe/İngilizce eş anlamlılar — "ateş" yazan Set on Fire'ı, "ikiz" yazan Selfie Twin'i bulsun. */
export const ESANLAM: [RegExp, string[]][] = [
  [/ates|yangin|alev|fire/, ["set-on-fire"]], [/para|money|zengin/, ["money-rain"]], [/uzay|dunya|gezegen|space/, ["earth-zoom", "orbital-presence"]],
  [/klon|ikiz|kopya|twin|clone/, ["clones", "clone-burst", "selfie-twin"]], [/dans|moonwalk/, ["moonwalk", "live-concert"]], [/melek|kanat|angel/, ["angel-wings"]],
  [/simsek|yildirim|thor|thunder/, ["thunder-god"]], [/masal|kale|prenses|castle/, ["fairytale-castle"]], [/oyuncak|figur|toy/, ["action-figure", "cardboard-cutout"]],
  [/eri|melt/, ["melting"]], [/metal|krom|chrome/, ["liquid-metal"]], [/kamera|zoom|drone|dron/, ["crash-zoom", "fpv-dive", "vertigo", "hyperlapse", "orbit-360", "earth-zoom"]],
  [/korku|zombi|vampir|seytan|horror/, ["zombie-escape", "vampire", "devil", "mummy", "black-tears", "tentacles"]], [/urun|reklam|product/, ["product-hero", "turntable-3d"]],
  [/futbol|basket|spor|beyzbol/, ["football-invasion", "slam-dunk", "baseball-game", "skate-run"]], [/ucan|havada|levit|yuksel/, ["levitation", "elevate", "float-spin"]],
];

/* ── Gerçek görselden-video modelleri (videoSaglayici.ts'deki "gercek" modeller) ── */

export type PresetModel = {
  ad: string; saglayici: "kling" | "seedance" | "omni" | "minimax"; aciklama: string; rozet?: string;
  /** Modele gönderilen süre (boş = model belirler). */
  sure: number | null; coz: { taslak: string; hd: string }; oranlar: string[];
};
export const PRESET_MODELLER: PresetModel[] = [
  { ad: "Kling 3.0", saglayici: "kling", aciklama: "En iyi yüz tutarlılığı ve hareket", rozet: "Önerilen", sure: 8, coz: { taslak: "720p", hd: "1080p" }, oranlar: ["9:16", "1:1", "16:9"] },
  { ad: "Seedance 2.0", saglayici: "seedance", aciklama: "Sinematik ışık, akıcı kamera", sure: 8, coz: { taslak: "720p", hd: "1080p" }, oranlar: ["9:16", "1:1", "16:9"] },
  { ad: "Gemini Omni Flash", saglayici: "omni", aciklama: "Hızlı ve dengeli", sure: null, coz: { taslak: "720p", hd: "1080p" }, oranlar: ["9:16", "16:9"] },
  { ad: "Minimax Hailuo 2.3", saglayici: "minimax", aciklama: "Yüksek dinamik, en ekonomik", sure: 6, coz: { taslak: "768p", hd: "1080p" }, oranlar: [] },
];
export type Kalite = "taslak" | "hd";
const TABAN = videoKrediHesap("Kling 3.0");

/**
 * Presetin bedeli: preset verisindeki kredi Kling 3.0 HD karşılığıdır; diğer modeller
 * kendi bedel oranıyla ölçeklenir, taslak (720p) %40 ucuzdur. Karışımda ikinci efektin yarısı eklenir.
 */
export function presetBedel(p: KatalogPreset, model: string, kalite: Kalite, ek?: KatalogPreset | null) {
  const olcek = videoKrediHesap(model) / TABAN;
  const ana = Math.max(6, Math.round(p.kredi * olcek * (kalite === "taslak" ? 0.6 : 1)));
  return ana + (ek ? Math.ceil(ek.kredi / 2) : 0);
}

/* ── Oturum: fotoğraf ve ayarlar presetler arasında taşınır (aynı fotoğrafla başka efekt denemek için) ── */

export type Medya = { url: string; ad: string; en?: number; boy?: number };
type Oturum = {
  foto: Medya | null; mekan: Medya | null; urun: Medya | null;
  oran: string; adet: number; model: string; kalite: Kalite;
  ayarla: (p: Partial<Omit<Oturum, "ayarla">>) => void;
};
// Sekme boyunca kalır (sessionStorage): sayfa yenilense de fotoğraf ve ayarlar gitmez; sekme kapanınca silinir.
export const usePresetOturum = create<Oturum>()(
  persist(
    (set) => ({
      foto: null, mekan: null, urun: null, oran: "9:16", adet: 1, model: "Kling 3.0", kalite: "hd",
      ayarla: (p) => set(p),
    }),
    { name: "vayra-preset-oturum", storage: createJSONStorage(() => sessionStorage) },
  ),
);

/** Dosyayı doğrular, küçültür (1024 px) ve Medya'ya çevirir. */
export async function fotoOku(d: File | undefined | null): Promise<Medya | null> {
  if (!d) return null;
  if (!/^image\/(png|jpe?g|webp|avif|heic|heif)$/.test(d.type)) { mesaj.desteklenmeyenDosya("PNG, JPG, WebP ya da AVIF"); return null; }
  if (d.size > 20 * 1024 * 1024) { mesaj.dosyaCokBuyuk(20); return null; }
  try {
    const k = await gorselKucult(d, 1024);
    if (Math.min(k.en, k.boy) < 384) toast.info("Fotoğraf küçük", { description: "En az 512 px'lik bir fotoğraf daha net sonuç verir." });
    return { url: k.url, ad: d.name, en: k.en, boy: k.boy };
  } catch { toast.error("Fotoğraf okunamadı", { description: "Dosya bozuk olabilir. Başka bir fotoğrafla dene." }); return null; }
}

/* ── Görünürlük ── */

export function useGorunur<T extends Element>(marj = "120px") {
  const ref = useRef<T>(null);
  const [gorunur, setGorunur] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setGorunur(e.isIntersecting), { rootMargin: marj });
    io.observe(el);
    return () => io.disconnect();
  }, [marj]);
  return [ref, gorunur] as const;
}

/* ── Rozetler ── */

export function EtiketRozet({ p, kucuk }: { p: KatalogPreset; kucuk?: boolean }) {
  const s = kucuk ? "px-1.5 py-[2px] text-[9.5px]" : "px-2 py-[3px] text-[10.5px]";
  return (
    <>
      {p.etiket === "Trend" && <span className={cn("inline-flex items-center gap-1 rounded-full bg-amber-400 font-bold uppercase tracking-wide text-[#1a1206]", s)}><Flame className="h-3 w-3" />Trend</span>}
      {p.etiket === "Yeni" && <span className={cn("rounded-full bg-aksan font-bold uppercase tracking-wide text-zemin", s)}>Yeni</span>}
      {p.pro && <span className={cn("inline-flex items-center gap-1 rounded-full bg-black/55 font-semibold text-white ring-1 ring-inset ring-white/15 backdrop-blur", s)}><Crown className="h-3 w-3 text-amber-300" />Pro</span>}
      {p.ozel && <span className={cn("rounded-full font-semibold backdrop-blur", s, p.taslak ? "bg-amber-400 text-[#1a1206]" : "bg-black/55 text-white ring-1 ring-inset ring-white/15")}>{p.taslak ? "Taslak" : "Senin"}</span>}
    </>
  );
}

/** Kredi jetonu + sayı. */
export function KrediCip({ n, className }: { n: number | string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", className)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-3 w-3 text-amber-300" aria-hidden><circle cx="9" cy="12" r="6" /><circle cx="15" cy="12" r="6" /></svg>
      {n}
    </span>
  );
}

/* ── Galeri kartı ── */

/**
 * 9:16 tek tip kart (Higgsfield/CapCut düzeni): ekranda görünürken örnek video sessiz döngüde
 * oynar; altta ad, bedel, süre ve istenen girdi; üstüne gelince "Dene".
 */
export function PresetKart({ p, href, kayitli, onKayit, kullanim = 0, foto, sira, oynat = true, className }: {
  p: KatalogPreset; href: string; kayitli: boolean; onKayit: () => void; kullanim?: number;
  /** Oturumdaki fotoğraf — varsa kartta "fotoğrafınla hazır" işareti. */
  foto?: string | null; sira?: number; oynat?: boolean; className?: string;
}) {
  const [ref, gorunur] = useGorunur<HTMLDivElement>();
  const g = GIRDI[presetGirdi(p)];
  return (
    <div ref={ref} className={cn("group relative", className)}>
      <Link href={href} aria-label={`${p.ad} — ${p.kredi} kredi`}
        className="relative block aspect-[9/16] w-full overflow-hidden rounded-[18px] bg-yuzey-2 outline-none ring-1 ring-inset ring-white/[0.07] transition-[box-shadow,transform] duration-300 focus-visible:ring-2 focus-visible:ring-white/70 group-hover:ring-white/25">
        <PresetVideo p={p} oyna={oynat && gorunur} className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]" />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
        <span className="absolute left-2.5 top-2.5 flex flex-wrap gap-1 pr-10"><EtiketRozet p={p} kucuk /></span>
        {sira !== undefined && (
          <span aria-hidden className="pointer-events-none absolute -bottom-2 -left-1 select-none text-[76px] font-black leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.55)]">{sira}</span>
        )}
        <span className={cn("absolute inset-x-0 bottom-0 p-3 transition-transform duration-300 group-hover:-translate-y-10 [@media(hover:none)]:group-hover:translate-y-0", sira !== undefined && "pl-[52px]")}>
          <span lang="en" className="line-clamp-2 text-[15px] font-semibold leading-tight tracking-[-0.01em] text-white sm:text-[16px]">{p.ad}</span>
          <span className="mt-1.5 flex items-center gap-2 whitespace-nowrap text-[11.5px] text-white/70">
            <KrediCip n={p.kredi} className="font-semibold text-white" />
            <span className="h-3 w-px shrink-0 bg-white/20" />
            <span className="shrink-0">{p.sureSn} sn</span>
            {sira === undefined && (
              <>
                <span className="h-3 w-px shrink-0 bg-white/20" />
                <span title={`Girdi: ${g.ad}`} aria-label={`Girdi: ${g.ad}`} className="inline-flex min-w-0 items-center gap-1"><g.ikon className="h-3.5 w-3.5 shrink-0" />{kullanim > 0 && <span className="truncate">{kullanim} kez</span>}</span>
              </>
            )}
          </span>
        </span>
        <span className="absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-1.5 rounded-full bg-white py-2 text-[12.5px] font-semibold text-[#0a0a0b] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:hidden">
          {foto ? <>Fotoğrafınla dene</> : <>Dene</>}<ArrowRight className="h-3.5 w-3.5" />
        </span>
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" className="absolute right-2.5 top-12 h-7 w-7 rounded-full object-cover ring-2 ring-aksan opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:hidden" />
        )}
      </Link>
      <button type="button" onClick={onKayit} aria-pressed={kayitli} aria-label={kayitli ? `${p.ad} kayıtlılardan çıkar` : `${p.ad} kaydet`}
        className={cn("absolute right-2 top-2 z-[1] flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-[opacity,background-color]",
          kayitli ? "bg-white text-zemin opacity-100" : "bg-black/45 text-white opacity-0 ring-1 ring-inset ring-white/15 hover:bg-black/70 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100")}>
        <Bookmark className={cn("h-3.5 w-3.5", kayitli && "fill-current")} />
      </button>
    </div>
  );
}

/** Yatay kaydırmalı raf başlığı + içerik. */
export function Raf({ baslik, ikon: I, alt, sag, children }: { baslik: string; ikon?: LucideIcon; alt?: string; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.01em] text-metin sm:text-[20px]">
            {I && <I className="h-[18px] w-[18px] text-aksan" />}{baslik}
          </h2>
          {alt && <p className="mt-0.5 text-[12.5px] text-metin-3">{alt}</p>}
        </div>
        {sag}
      </div>
      <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}

/** Mini preset karosu (seçici ve benzerler için). */
export function MiniKapak({ p, oyna, className }: { p: KatalogPreset; oyna?: boolean; className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden bg-yuzey-2", className)}>
      <PresetVideo p={p} oyna={!!oyna} />
    </span>
  );
}

