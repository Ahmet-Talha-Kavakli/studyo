"use client";

/**
 * Presetler "B · Raflar" (2026-11-01, kullanıcı seçimi: "B ama çok daha iyi").
 * Her bölüm başlık şeritli bir kart; havada başlık ya da açıklama yok. Kartlar tek dilde (9:14, oynayan örnek).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Bookmark, Check, ChevronLeft, ChevronRight, Crown, Heart, Play, Plus, UserPlus, Wallet, Wand2 } from "lucide-react";
import { RESMI_PRESETLER, karisimKredi, type KatalogPreset } from "@/lib/presetKatalog";
import { YARATICILAR, sayiKisa, yaraticiBul } from "@/lib/presetTopluluk";
import { usePresetler } from "@/store/usePresetler";
import { KrediJeton } from "@/components/ui/KrediHap";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { PresetKapak } from "../PresetKarti";
import { YaraticiAvatar } from "../PresetPaneli";
import { useGorunur, usePresetOturum } from "../presetOrtak";

export const yay = { type: "spring" as const, stiffness: 420, damping: 34 };
export const ease = [0.22, 1, 0.36, 1] as const;

/* ───────── Raf kartı ───────── */

export function Raf({ id, baslik, ikon: I, sayi, ek, sag, children, govde, className, alt }: {
  id?: string; baslik: React.ReactNode; ikon: React.ElementType; sayi?: number; ek?: React.ReactNode; sag?: React.ReactNode;
  children: React.ReactNode; govde?: string; className?: string; alt?: React.ReactNode;
}) {
  return (
    <motion.section id={id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, ease }}
      className={cn("rounded-[28px] bg-[#111214] ring-1 ring-inset ring-white/[0.07]", className)}>
      <header className="flex min-h-[62px] items-center gap-3 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white max-sm:hidden"><I className="h-[18px] w-[18px]" /></span>
        <h2 className="min-w-0 truncate text-[16px] font-semibold tracking-[-0.02em] text-white sm:text-[17px]">{baslik}</h2>
        {!!sayi && <span className="shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[12px] font-medium tabular-nums text-white/60">{sayi}</span>}
        {ek}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">{sag}</div>
      </header>
      <div className={cn("p-3 sm:p-4", govde)}>{children}</div>
      {alt && <footer className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-4 py-3 sm:px-5">{alt}</footer>}
    </motion.section>
  );
}

/** Yatay kaydırıcı: kenarlarda yumuşak geçiş, başlık şeridine ok düğmeleri verir. */
export function useKaydirici() {
  const ref = useRef<HTMLDivElement>(null);
  const [kenar, setKenar] = useState({ sol: false, sag: false });
  const olc = useCallback(() => { const el = ref.current; if (!el) return; setKenar({ sol: el.scrollLeft > 4, sag: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 }); }, []);
  useEffect(() => { olc(); const el = ref.current; if (!el) return; const ro = new ResizeObserver(olc); ro.observe(el); return () => ro.disconnect(); }, [olc]);
  const git = (d: number) => { const el = ref.current; if (el) el.scrollBy({ left: d * Math.max(320, el.clientWidth * 0.8), behavior: "smooth" }); };
  const oklar = (
    <span className="hidden gap-1 sm:flex">
      {([[-1, ChevronLeft, kenar.sol, "Geri"], [1, ChevronRight, kenar.sag, "İleri"]] as const).map(([d, I, aktif, ad]) => (
        <button key={d} onClick={() => git(d)} disabled={!aktif} aria-label={ad}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-white transition hover:bg-white/[0.13] active:scale-90 disabled:opacity-30 disabled:hover:bg-white/[0.07]"><I className="h-4 w-4" /></button>
      ))}
    </span>
  );
  const maske = `linear-gradient(90deg, ${kenar.sol ? "transparent, #000 40px" : "#000, #000"}, ${kenar.sag ? "#000 calc(100% - 40px), transparent" : "#000, #000"})`;
  const serit = (cocuk: React.ReactNode, sinif?: string) => (
    <div ref={ref} onScroll={olc} className={cn("gizli-scroll -mx-3 flex snap-x scroll-px-3 gap-2.5 overflow-x-auto px-3 sm:-mx-4 sm:scroll-px-4 sm:px-4", sinif)} style={{ maskImage: maske, WebkitMaskImage: maske }}>{cocuk}</div>
  );
  return { oklar, serit };
}

/* ───────── Preset kartı ───────── */

export type KartOlay = { onAc: (p: KatalogPreset) => void; onYaratici: (y: string) => void; benimTutamac: string };

/** Görünürken örnek videosu sessiz döngüde oynar. */
export function Oynar({ p, zorla }: { p: KatalogPreset; zorla?: boolean }) {
  const [ref, gorunur] = useGorunur<HTMLSpanElement>("200px");
  const v = useRef<HTMLVideoElement>(null);
  const [hazir, setHazir] = useState(false);
  const oyna = zorla || gorunur;
  useEffect(() => { const x = v.current; if (!x) return; if (oyna) void x.play().catch(() => {}); else x.pause(); }, [oyna, hazir]);
  return (
    <span ref={ref} className="absolute inset-0 block overflow-hidden">
      <span className={cn("absolute inset-0 block", !p.video && gorunur && "preset-kb")}><PresetKapak p={p} /></span>
      {p.video && (gorunur || zorla) && (
        <video ref={v} src={p.video} muted loop playsInline autoPlay preload="metadata" onLoadedData={() => setHazir(true)}
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-500", hazir ? "opacity-100" : "opacity-0")} />
      )}
    </span>
  );
}

export function PresetKart({ p, olay, kullandin = 0, genislik, buyuk, className, kutu = "aspect-[9/14]" }: { p: KatalogPreset; olay: KartOlay; kullandin?: number; genislik?: number; buyuk?: boolean; className?: string; kutu?: string }) {
  const begendi = usePresetler((s) => s.begenilen.includes(p.slug));
  const kaydetti = usePresetler((s) => s.kayitli.includes(p.slug));
  const begeniDegis = usePresetler((s) => s.begeniDegis);
  const kayitDegis = usePresetler((s) => s.kayitDegis);
  const foto = usePresetOturum((s) => s.foto);
  const y = yaraticiBul(p.yazar);
  const benim = !!p.yazar && p.yazar === olay.benimTutamac;
  const durum = p.ozel ? (p.taslak ? "Taslak" : p.gorunurluk === "ozel" ? "Yalnız sen" : p.gorunurluk === "baglanti" ? "Bağlantıyla" : "Toplulukta") : null;
  const href = p.taslak ? `/panel/presetler/olustur?id=${p.slug}` : `/panel/presetler/${p.slug}`;
  const dugme = "flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition active:scale-90";
  return (
    <div className={cn("group relative shrink-0 snap-start", className)} style={genislik ? { width: genislik } : undefined}>
      <Link href={href} aria-label={`${p.ad}, ${p.yazar ? (y?.ad ?? p.yazar) : "Vayra"}, ${p.kredi} kredi`}
        onClick={(e) => { if (p.taslak || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); olay.onAc(p); }}
        className={cn("relative block overflow-hidden rounded-[20px] bg-[#0b0b0d] outline-none ring-1 ring-inset ring-white/[0.06] transition-[transform,box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-white/70", kutu)}>
        <span className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.045]"><Oynar p={p} /></span>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
        <span className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
          {durum ? <Rozet><Wand2 className="h-3 w-3" />{durum}</Rozet> : p.etiket === "Yeni" && <Rozet><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Yeni</Rozet>}
          {p.pro && <Rozet><Crown className="h-3 w-3 text-[#ffd36b]" />Pro</Rozet>}
        </span>
        <span className={cn("absolute inset-x-3 bottom-3 transition-transform duration-300 ease-out [@media(hover:hover)]:group-hover:-translate-y-[46px] [@media(hover:hover)]:group-focus-within:-translate-y-[46px]", buyuk && "inset-x-4 bottom-4")}>
          <span lang="en" className={cn("block truncate font-semibold tracking-[-0.015em] text-white", buyuk ? "text-[22px]" : "text-[15px]")}>{p.ad}</span>
          {buyuk && <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-white/70">{p.aciklama}</span>}
          <span className="mt-1.5 flex h-6 items-center gap-2 text-[12.5px] text-white/80">
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <YaraticiAvatar yazar={p.yazar} boyut={18} />
              <span className="min-w-0 truncate">{p.yazar ? (benim ? "Sen" : y?.ad ?? p.yazar) : "Vayra"}</span>
              {(!p.yazar || y?.dogrulanmis) && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-white" />}
            </span>
            <span className="flex shrink-0 items-center gap-1 tabular-nums">
              {kullandin > 0 ? <>{kullandin} kez kullandın</> : p.kullanimSayi ? <><Play className="h-3 w-3 fill-current" />{sayiKisa(p.kullanimSayi)}</> : null}
            </span>
          </span>
        </span>
        {/* Üzerine gelince: bilgi yukarı kayar, altta tam genişlik Dene çubuğu (yaratıcı adının üstüne binmez) */}
        <span className={cn("absolute flex h-9 translate-y-2 items-center gap-2 rounded-full bg-white pl-1.5 pr-3.5 text-[13px] font-semibold text-black opacity-0 transition duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 [@media(hover:none)]:hidden", buyuk ? "inset-x-4 bottom-4" : "inset-x-2.5 bottom-2.5")}>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/[0.07]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {foto ? <img src={foto.url} alt="" className="h-full w-full object-cover" /> : <Play className="h-3 w-3 fill-current" />}
          </span>
          <span className="min-w-0 flex-1 truncate">{foto ? "Fotoğrafınla dene" : "Dene"}</span>
          <span className="flex shrink-0 items-center gap-1 tabular-nums text-black/70"><KrediJeton boyut={11} />{p.kredi}</span>
        </span>
      </Link>
      {p.yazar && !benim && <button type="button" onClick={() => olay.onYaratici(p.yazar!)} aria-label={`${y?.ad ?? p.yazar} presetleri`} className={cn("absolute left-3 h-6 w-[45%] transition-transform duration-300 ease-out [@media(hover:hover)]:group-hover:-translate-y-[46px] [@media(hover:hover)]:group-focus-within:-translate-y-[46px]", buyuk ? "bottom-4 left-4" : "bottom-3")} />}
      <div className="absolute right-2 top-2 z-[2] flex gap-1">
        <button type="button" onClick={() => { const v = kayitDegis(p.slug); toast.success(v ? "Kaydedilenlere eklendi" : "Kaydedilenlerden çıkarıldı", { description: p.ad }); }} aria-pressed={kaydetti} aria-label={kaydetti ? `${p.ad} kayıtlılardan çıkar` : `${p.ad} kaydet`}
          className={cn(dugme, kaydetti ? "bg-white text-black" : "bg-black/40 text-white opacity-0 ring-1 ring-inset ring-white/15 hover:bg-black/70 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:hidden")}>
          <motion.span key={String(kaydetti)} initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={yay}><Bookmark className={cn("h-3.5 w-3.5", kaydetti && "fill-current")} /></motion.span>
        </button>
      </div>
    </div>
  );
}

function Rozet({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-black/40 px-2.5 text-[11.5px] font-semibold text-white ring-1 ring-inset ring-white/[0.14] backdrop-blur-xl">{children}</span>;
}

/* ───────── Giriş kartı ───────── */

const SURE = 5600;

/**
 * Başlık + fotoğraf ekleme; sağda tek parça sahne: 1 Fotoğraf (kullanıcınınki ya da örnek videonun ilk karesi,
 * yani efektin gerçekten aldığı görsel) → 2 Sonuç (oynayan örnek). Altında sırayla dönen dört trend efektin sekmeleri.
 * Geçişler "bekle" kipinde: iki görsel hiçbir an üst üste binmez.
 */
export function GirisKarti({ vitrin, toplam, enUygun, yeni, foto, onAc, sag }: { vitrin: KatalogPreset[]; toplam: number; enUygun: number; yeni?: KatalogPreset; foto: React.ReactNode; onAc: (p: KatalogPreset) => void; sag?: React.ReactNode }) {
  const [i, setI] = useState(0);
  const [dur, setDur] = useState(false);
  const benimFoto = usePresetOturum((s) => s.foto);
  useEffect(() => { if (dur || vitrin.length < 2) return; const t = setTimeout(() => setI((x) => (x + 1) % vitrin.length), SURE); return () => clearTimeout(t); }, [i, dur, vitrin.length]);
  const p = vitrin[i];
  if (!p) return null;
  /** Silme geçişi: yeni kare eskisinin üstünde soldan sağa açılır; hiçbir an iki görsel yarı saydam karışmaz. */
  const gecis = {
    initial: { clipPath: "inset(0 100% 0 0)", zIndex: 2, filter: "brightness(1)" },
    animate: { clipPath: "inset(0 0% 0 0)", zIndex: 2, filter: "brightness(1)", transition: { duration: 0.7, ease } },
    /* Eski kare yeni kare tamamen açılana kadar yerinde kalır, yalnız hafifçe kararır (altında boş zemin görünmez). */
    exit: { zIndex: 1, filter: "brightness(0.5)", transition: { duration: 0.75, ease: "linear" as const } },
  };
  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[#111214] ring-1 ring-inset ring-white/[0.08]">
      <AnimatePresence>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img key={p.slug} src={p.kapak} alt="" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} transition={{ duration: 1.1 }}
          className="pointer-events-none absolute right-0 top-0 h-full w-[60%] object-cover blur-[90px]" />
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_0%_0%,rgba(85,214,253,0.10),transparent_60%)]" />
      <div className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-7 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 lg:p-9">
        <div className="min-w-0">
          {yeni && (
            <button onClick={() => onAc(yeni)} className="group inline-flex h-8 max-w-full items-center gap-2 rounded-full bg-white/[0.06] py-1 pl-1 pr-3 text-[12.5px] font-medium text-white/80 ring-1 ring-inset ring-white/[0.1] transition hover:bg-white/[0.1] hover:text-white active:scale-[0.98]">
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black">Yeni</span>
              <span lang="en" className="truncate">{yeni.ad}</span><span className="shrink-0 text-white/45">yayında</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/45 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
          <h1 className="mt-4 text-[34px] font-semibold leading-[1.03] tracking-[-0.045em] text-white sm:text-[50px] xl:text-[56px]">Bir efekt seç,<br /><span className="hero-isilti">fotoğrafın oynasın.</span></h1>
          <p className="mt-3 max-w-[480px] text-[15px] leading-relaxed text-white/65">İstem yazmak yok. Fotoğrafını bir kez ekle; dokunduğun her efekt onunla açılır. Hareket, kamera ve ışık hazır.</p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">{foto}{sag}</div>
          <dl className="mt-8 grid max-w-[440px] grid-cols-3 border-t border-white/[0.08] pt-5 max-sm:hidden">
            {([["Efekt", String(toplam)], ["Video", "8 sn"], ["En uygun", `${enUygun} kredi`]] as const).map(([k, v], j) => (
              <div key={k} className={cn("min-w-0", j > 0 && "border-l border-white/[0.08] pl-4 sm:pl-5")}>
                <dt className="text-[12px] text-white/50">{k}</dt>
                <dd className="mt-1 truncate text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-white sm:text-[22px]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Sahne */}
        <div className="w-full min-w-0 justify-self-end rounded-[26px] bg-black/30 p-3 ring-1 ring-inset ring-white/[0.08] backdrop-blur-xl sm:p-4 lg:max-w-[640px]">
          <div className="grid grid-cols-[minmax(0,0.8fr)_auto_minmax(0,1fr)] items-center gap-2.5 sm:gap-4">
            <div className="relative h-full min-h-0 overflow-hidden rounded-[18px] bg-[#0b0b0d] ring-1 ring-inset ring-white/[0.1]">
              <AnimatePresence initial={false}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <motion.img key={benimFoto?.url ?? p.slug} src={benimFoto?.url ?? p.kapak} alt="" {...gecis} className="absolute inset-0 h-full w-full object-cover" />
              </AnimatePresence>
              <span className="absolute inset-0 z-[3]"><Etiket n={1}>{benimFoto ? "Fotoğrafın" : "Fotoğraf"}</Etiket></span>
            </div>
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-black sm:h-12 sm:w-12">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/25 [animation-duration:2.2s]" />
              <ArrowRight className="relative h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.4} />
            </span>
            <button onClick={() => onAc(p)} aria-label={`${p.ad} örneğini aç`} className="group relative aspect-[9/14] overflow-hidden rounded-[20px] bg-[#0b0b0d] text-left ring-1 ring-inset ring-white/[0.12]">
              <AnimatePresence initial={false}>
                <motion.span key={p.slug} {...gecis} className="absolute inset-0"><Oynar p={p} zorla /></motion.span>
              </AnimatePresence>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
              <span className="absolute inset-0 z-[3]"><Etiket n={2}>Örnek sonuç</Etiket></span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={p.slug} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-x-3 bottom-3 z-[4]">
                  <span lang="en" className="block truncate text-[15px] font-semibold text-white sm:text-[17px]">{p.ad}</span>
                  {!!p.kullanimSayi && <span className="mt-0.5 flex items-center gap-1 text-[12px] text-white/70"><Play className="h-3 w-3 fill-current" />{sayiKisa(p.kullanimSayi)} kullanım</span>}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {vitrin.map((x, j) => (
              <button key={x.slug} onClick={() => { setI(j); setDur(true); }} aria-pressed={j === i} aria-label={x.ad}
                className={cn("relative flex min-w-0 items-center gap-2 overflow-hidden rounded-[14px] p-1.5 text-left transition-colors", j === i ? "bg-white/[0.12]" : "bg-white/[0.04] hover:bg-white/[0.08]")}>
                <span className="relative h-9 w-7 shrink-0 overflow-hidden rounded-[8px] max-sm:h-10 max-sm:w-full"><PresetKapak p={x} kucuk /></span>
                <span lang="en" className={cn("min-w-0 truncate text-[12px] font-medium tracking-[-0.01em] max-sm:hidden", j === i ? "text-white" : "text-white/60")}>{x.ad}</span>
                {j === i && <motion.span key={i + String(dur)} className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-white" initial={{ scaleX: dur ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ duration: dur ? 0 : SURE / 1000, ease: "linear" }} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Etiket({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <span className="absolute left-2 top-2 flex h-6 items-center gap-1.5 rounded-full bg-black/50 pl-1 pr-2.5 text-[11.5px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">{n}</span>{children}
    </span>
  );
}

/* ───────── Bu haftanın 10'u ───────── */

export function OnluRaf({ liste, olay }: { liste: (k: "hepsi" | "vayra" | "topluluk") => KatalogPreset[]; olay: KartOlay }) {
  const [k, setK] = useState<"hepsi" | "vayra" | "topluluk">("hepsi");
  const { oklar, serit } = useKaydirici();
  const l = liste(k).slice(0, 10);
  return (
    <Raf baslik="Bu haftanın 10'u" ikon={Flame10} govde="pt-4 sm:pt-5" sag={<>
      <LayoutGroup id="on-kaynak">
        <div role="radiogroup" aria-label="Kaynak" className="flex h-9 items-center gap-0.5 rounded-full bg-white/[0.06] p-0.5">
          {([["hepsi", "Hepsi"], ["vayra", "Vayra"]] as const).map(([id, a]) => (
            <button key={id} role="radio" aria-checked={k === id} onClick={() => setK(id)} className={cn("relative h-8 rounded-full px-2.5 text-[12.5px] sm:px-3 font-medium transition-colors active:scale-[0.97]", k === id ? "text-black" : "text-white/60 hover:text-white")}>
              {k === id && <motion.span layoutId="on-kaynak-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}<span className="relative">{a}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>{oklar}</>}>
      {serit(
        <AnimatePresence mode="popLayout" initial={false}>
          {l.map((p, i) => (
            <motion.div key={k + p.slug} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, delay: i * 0.03, ease }} className="group/s flex shrink-0 snap-start items-end">
              <span aria-hidden className={cn("relative z-0 select-none bg-gradient-to-b from-white/80 via-white/30 to-white/[0.04] bg-clip-text pb-1 text-[124px] font-extrabold leading-[0.78] tracking-[-0.08em] text-transparent transition-opacity duration-300 [-webkit-text-stroke:1px_rgba(255,255,255,0.18)] group-hover/s:opacity-100 sm:text-[168px]", i < 3 ? "opacity-100" : "opacity-70", i === 9 ? "-mr-[30px]" : "-mr-[26px]")}>{i + 1}</span>
              <PresetKart p={p} olay={olay} genislik={176} className="relative z-[1] sm:!w-[196px]" />
            </motion.div>
          ))}
        </AnimatePresence>,
      )}
    </Raf>
  );
}

function Flame10(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;
}

/* ───────── Satır rafı (yeniler, takip edilenler) ───────── */

export function SatirRaf({ baslik, ikon, liste, olay, sag }: { baslik: string; ikon: React.ElementType; liste: KatalogPreset[]; olay: KartOlay; sag?: React.ReactNode }) {
  const { oklar, serit } = useKaydirici();
  if (!liste.length) return null;
  return (
    <Raf baslik={baslik} ikon={ikon} sayi={liste.length} sag={<>{sag}{oklar}</>}>
      {serit(liste.map((p) => <PresetKart key={p.slug} p={p} olay={olay} genislik={176} className="sm:!w-[188px]" />))}
    </Raf>
  );
}

/* ───────── Yaratıcılar ───────── */

/**
 * Profil kartı: yalnız yaratıcının KENDİ presetlerinden kapak (1, 2 ya da 3 kareye göre düzen; başkasının işiyle dolgu yok),
 * kapağa binen avatar, ad + onay, tek satır tanıtım, sayılar ve tam genişlik Takip.
 */
export function YaraticiRafi({ akis, takip, onTakip, onSec, baslik = "Topluluğun yaratıcıları", haric }: { akis: KatalogPreset[]; takip: string[]; onTakip: (y: string) => void; onSec: (y: string) => void; baslik?: string; haric?: string }) {
  const { oklar, serit } = useKaydirici();
  const l = YARATICILAR.filter((y) => y.kullanici !== haric).map((y) => { const ps = akis.filter((p) => p.yazar === y.kullanici); return { y, ps, kullanim: ps.reduce((a, p) => a + (p.kullanimSayi ?? 0), 0) }; })
    .filter((x) => x.ps.length).sort((a, b) => b.kullanim - a.kullanim);
  if (!l.length) return null;
  return (
    <Raf baslik={baslik} ikon={UserPlus} sayi={l.length} sag={oklar}>
      {serit(l.map(({ y, ps, kullanim }) => {
        const t = takip.includes(y.kullanici);
        const k = ps.slice(0, 3);
        return (
          <div key={y.kullanici} className="flex w-[268px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.055] sm:w-[288px]">
            <button onClick={() => onSec(y.kullanici)} aria-label={`${y.ad} presetleri`} className={cn("grid h-[150px] w-full gap-0.5", k.length === 1 ? "grid-cols-1" : k.length === 2 ? "grid-cols-2" : "grid-cols-[1.6fr_1fr]")}>
              <span className="relative overflow-hidden"><Oynar p={k[0]} /></span>
              {k.length === 2 && <span className="relative overflow-hidden"><Oynar p={k[1]} /></span>}
              {k.length === 3 && <span className="grid grid-rows-2 gap-0.5">{k.slice(1).map((p) => <span key={p.slug} className="relative overflow-hidden"><Oynar p={p} /></span>)}</span>}
            </button>
            <div className="relative flex flex-1 flex-col px-3.5 pb-3.5">
              <button onClick={() => onSec(y.kullanici)} className="-mt-6 w-fit rounded-full ring-[3px] ring-[#17181b]"><YaraticiAvatar yazar={y.kullanici} boyut={46} /></button>
              <button onClick={() => onSec(y.kullanici)} className="mt-2 min-w-0 text-left">
                <span className="flex items-center gap-1 text-[15px] font-semibold text-white"><span className="truncate">{y.ad}</span>{y.dogrulanmis && <BadgeCheck className="h-4 w-4 shrink-0" />}</span>
                <span className="block truncate text-[12.5px] text-white/50">{y.kullanici} · {y.bio}</span>
              </button>
              <span className="mt-3 flex items-center gap-3.5 text-[12.5px] text-white/50">
                {([[String(ps.length), "preset"], ...(kullanim > 0 ? [[sayiKisa(kullanim), "kullanım"] as const] : [])] as const).map(([n, a]) => (
                  <span key={a} className="whitespace-nowrap"><b className="mr-1 text-[14px] font-semibold tabular-nums text-white">{n}</b>{a}</span>
                ))}
              </span>
              <button onClick={() => onTakip(y.kullanici)} aria-pressed={t} className={cn("mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition active:scale-[0.98]", t ? "bg-white/[0.08] text-white hover:bg-white/[0.12]" : "bg-white text-black")}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={String(t)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="flex items-center gap-1.5">
                    {t ? <><Check className="h-4 w-4" />Takip ediliyor</> : <><UserPlus className="h-4 w-4" />Takip et</>}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
          </div>
        );
      }))}
    </Raf>
  );
}

/* ───────── Karışımlar ───────── */

export const KARISIM_LISTE: [string, string, string][] = [
  ["earth-zoom", "money-rain", "Dünyadan para yağmuruna"],
  ["action-figure", "set-on-fire", "Alev alan aksiyon figürü"],
  ["bullet-time", "clones", "Klonlarla bullet time"],
  ["selfie-twin", "moonwalk", "İkizle moonwalk"],
  ["elevate", "thunder-god", "Yükselen yıldırım tanrısı"],
  ["sticker-peel", "liquid-metal", "Sıvı metal çıkartma"],
];

export function KarisimRafi() {
  const { oklar, serit } = useKaydirici();
  const bul = (s: string) => RESMI_PRESETLER.find((p) => p.slug === s);
  return (
    <Raf baslik="İki efekt bir videoda" ikon={Plus} sayi={KARISIM_LISTE.length} sag={oklar}>
      {serit(KARISIM_LISTE.map(([a, b, ad]) => {
        const x = bul(a), y = bul(b);
        if (!x || !y) return null;
        return (
          <Link key={a + b} href={`/panel/presetler/${x.slug}?ek=${y.slug}`} className="group w-[280px] shrink-0 snap-start overflow-hidden rounded-[22px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.06] sm:w-[310px]">
            <span className="relative grid aspect-[16/10] grid-cols-2 gap-0.5">
              <span className="relative overflow-hidden"><Oynar p={x} /></span><span className="relative overflow-hidden"><Oynar p={y} /></span>
              <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black ring-4 ring-[#151618] transition-transform duration-300 group-hover:rotate-90"><Plus className="h-4 w-4" strokeWidth={2.8} /></span>
            </span>
            <span className="flex items-center gap-2 p-3">
              <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-white">{ad}</span><span lang="en" className="block truncate text-[12px] text-white/50">{x.ad} ve {y.ad}</span></span>
              <span className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-white/[0.08] px-2.5 text-[12.5px] font-semibold tabular-nums text-white"><KrediJeton boyut={11} />{karisimKredi(x, y)}</span>
            </span>
          </Link>
        );
      }))}
    </Raf>
  );
}

/* ───────── Yayınla kartı (ızgarada) ───────── */

export function YayinlaKarti() {
  return (
    <div className="flex aspect-[9/14] flex-col overflow-hidden rounded-[20px] bg-[radial-gradient(120%_70%_at_0%_0%,rgba(85,214,253,0.18),transparent_60%),#141518] ring-1 ring-inset ring-white/[0.09]">
      <div className="min-h-0 flex-1 overflow-hidden p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-white text-black"><Wand2 className="h-5 w-5" /></span>
        <p className="mt-4 text-[15px] font-semibold leading-snug tracking-[-0.015em] text-white sm:text-[17px]">Kendi efektini oluştur</p>
        <p className="mt-2 text-[13px] leading-relaxed text-white/55 max-sm:hidden">Hareketi tarif et, farklı yüzlerle test et ve galerine ekle.</p>
      </div>
      <div className="flex flex-col gap-1.5 border-t border-white/[0.07] p-2.5">
        <Link href="/panel/presetler/olustur" className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black active:scale-[0.97]"><Plus className="h-4 w-4" />Preset oluştur</Link>
      </div>
    </div>
  );
}

/* ───────── Konuya göre ───────── */

export function KonuRafi({ akis, konular, ad, ikon, olay, onTumu, haric }: {
  akis: KatalogPreset[]; konular: string[]; ad: (k: string) => string; ikon: (k: string) => React.ElementType; olay: KartOlay; onTumu: (k: string) => void; haric?: Set<string>;
}) {
  const [konu, setKonu] = useState(konular[0]);
  const hepsi = akis.filter((p) => p.kategoriler.includes(konu));
  /* Üstteki raflarda görülenler sona: aynı kartlar sayfada art arda tekrar etmesin. */
  const l = haric ? [...hepsi.filter((p) => !haric.has(p.slug)), ...hepsi.filter((p) => haric.has(p.slug))] : hepsi;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = ref.current, b = el?.querySelector<HTMLElement>(`[data-k="${konu}"]`); if (el && b) el.scrollTo({ left: b.offsetLeft - el.clientWidth / 2 + b.offsetWidth / 2, behavior: "smooth" }); }, [konu]);
  if (!konular.length) return null;
  return (
    <Raf baslik="Konuya göre" ikon={ikon("TUMU")} govde="p-0 sm:p-0"
      sag={<button onClick={() => onTumu(konu)} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[12.5px] font-medium text-white/85 transition hover:bg-white/[0.12] active:scale-[0.97]">Tümünü gör<span className="tabular-nums text-white/45">{hepsi.length}</span><ArrowRight className="h-3.5 w-3.5" /></button>}>
      <LayoutGroup id="konu">
        <div ref={ref} role="tablist" aria-label="Konular" className="gizli-scroll flex gap-0.5 overflow-x-auto border-b border-white/[0.06] px-2 sm:px-3">
          {konular.map((k) => { const I = ikon(k); const s = konu === k; return (
            <button key={k} data-k={k} role="tab" aria-selected={s} onClick={() => setKonu(k)} className={cn("relative flex h-12 shrink-0 items-center gap-1.5 px-3 text-[13.5px] font-medium transition-colors", s ? "text-white" : "text-white/50 hover:text-white")}>
              <I className="h-4 w-4" />{ad(k)}<span className={cn("text-[11.5px] tabular-nums", s ? "text-white/50" : "text-white/30")}>{akis.filter((p) => p.kategoriler.includes(k)).length}</span>
              {s && <motion.span layoutId="konu-z" className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-white" transition={yay} />}
            </button>
          ); })}
        </div>
      </LayoutGroup>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={konu} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3, ease }}
          className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-4 sm:p-4 xl:grid-cols-6">
          {l[0] && <PresetKart p={l[0]} olay={olay} buyuk kutu="aspect-[9/14] sm:aspect-auto sm:h-full" className="col-span-2 sm:row-span-2 sm:[&>a]:h-full" />}
          {l.slice(1, 9).map((p, j) => <PresetKart key={p.slug} p={p} olay={olay} className={cn(j >= 4 && "max-xl:hidden", j >= 2 && "max-sm:hidden")} />)}
        </motion.div>
      </AnimatePresence>
    </Raf>
  );
}
