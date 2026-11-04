"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Paperclip, Wand2 } from "lucide-react";
import { HERO_YETENEKLER, PROMPT_ALAN, SAGLAYICILAR, URETIM_TURLERI, YAZI_ORNEKLERI, type UretimTuru } from "./veri";
import { Kap } from "./ortak";
import { cn } from "@/lib/utils";
import { METIN_RENK, type RenkTuru } from "@/lib/renk";

const DONGU_MS = 4800;

export type HeroKutu = { doldur: (metin: string, turId?: string) => void };

/**
 * Hero — tam genişlik medya zemini + üretim kutusu + dönen yetenek listesi.
 * Sağdaki liste otomatik döner; her satır arka plandaki videoyu değiştirir.
 * Üzerine gelince döngü durur ve o satırın videosu kalır.
 */
export const Hero = forwardRef<HeroKutu>(function Hero(_, disRef) {
  const [aktif, setAktif] = useState(0);
  const [duraklat, setDuraklat] = useState(false);
  const azHareket = useReducedMotion(); // "hareketi azalt" açıksa otomatik döngü yok

  useEffect(() => {
    if (duraklat || azHareket) return;
    const t = setTimeout(() => setAktif((a) => (a + 1) % HERO_YETENEKLER.length), DONGU_MS);
    return () => clearTimeout(t);
  }, [aktif, duraklat, azHareket]);

  const kutuRef = useRef<HeroKutu>(null);
  useImperativeHandle(disRef, () => ({ doldur: (m, t) => kutuRef.current?.doldur(m, t) }), []);

  return (
    <section className="relative isolate overflow-hidden">
      {/* Medya zemini — yalnız aktif video DOM'da; çapraz geçişle değişir. */}
      <div className="absolute inset-0 -z-10 bg-zemin">
        <AnimatePresence initial={false}>
          <motion.video
            key={HERO_YETENEKLER[aktif].video}
            src={HERO_YETENEKLER[aktif].video}
            autoPlay muted loop playsInline preload="auto"
            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.1 }, scale: { duration: 6, ease: "linear" } }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        {/* Okunabilirlik katmanları: soldan koyulaşma + alta zemine eriyen geçiş */}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-zemin via-zemin/75 to-zemin/30" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-zemin to-transparent" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-zemin/60 to-transparent" />
      </div>

      <Kap className="grid min-h-[min(820px,calc(100svh-var(--ust-nav)))] grid-cols-[minmax(0,1fr)] items-center gap-12 pb-28 pt-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:pt-10">
        <div className="min-w-0 max-w-[640px]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link href="/panel/video"
              className="group mb-7 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-black/30 py-1 pl-1 pr-3 text-[12.5px] text-white/80 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white">
              <span className="flex items-center gap-1.5 rounded-full bg-vurgu px-2 py-0.5 text-[11px] font-semibold text-vurgu-ust"><img src="/marka/renkli/kling-color.svg" alt="" className="h-3.5 w-3.5" />Yeni</span>
              Kling 4.0 artık Vayra&apos;da
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] text-white sm:text-[68px]">
            Fikrini yönet.<br />
            <span className="bg-gradient-to-r from-white via-white/80 to-white/45 bg-clip-text text-transparent">Vayra sahnelesin.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-[520px] text-pretty text-[16px] leading-relaxed text-white/70 sm:text-[17.5px]">
            Video, görsel, ses, müzik ve 3D için dünyanın en iyi yapay zekâ modelleri tek bir yerde. Türkçe yaz, saniyeler içinde üret.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <UretimKutusu ref={kutuRef} />
            <p className="mt-4 flex items-center gap-2 text-[12.5px] text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Ücretsiz başla. Kart bilgisi gerekmez.
            </p>
          </motion.div>
        </div>

        {/* Dönen yetenek listesi */}
        <motion.ul
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
          onMouseLeave={() => setDuraklat(false)}
          className="hidden flex-col gap-1.5 lg:flex" aria-label="Vayra ile neler yapabilirsin">
          {HERO_YETENEKLER.map((y, i) => {
            const secili = i === aktif;
            return (
              <li key={y.metin}>
                <Link href={y.href}
                  onMouseEnter={() => { setAktif(i); setDuraklat(true); }}
                  className={cn(
                    "group relative flex items-center gap-3 py-1.5 text-[24px] font-semibold tracking-[-0.02em] transition-colors duration-300 [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]",
                    secili ? "text-white" : "text-white/40 hover:text-white/70",
                  )}>
                  <span className={cn("h-2 w-2 shrink-0 rounded-full bg-vurgu transition-all duration-300", secili ? "opacity-100" : "-ml-5 opacity-0")} />
                  {y.metin}
                  {secili && !duraklat && (
                    <motion.span key={aktif} className="absolute bottom-0 left-[20px] h-[2px] rounded-full bg-vurgu"
                      initial={{ width: 0 }} animate={{ width: 48 }} transition={{ duration: DONGU_MS / 1000, ease: "linear" }} />
                  )}
                </Link>
              </li>
            );
          })}
        </motion.ul>
      </Kap>

      {/* Sağlayıcı şeridi */}
      <div className="relative -mt-16 pb-14">
        <Kap><p className="mb-6 text-center text-[12.5px] text-metin-3">Önde gelen yapay zekâ laboratuvarlarının modelleri, tek hesapta</p></Kap>
        {/* Kayan logo şeridi — liste iki kez basılır, yarısı kadar kayınca kesintisiz döner */}
        <div className="kesfet-serit-maske group flex overflow-hidden">
          <div className="kesfet-kay flex shrink-0 items-center gap-12 pr-12 [animation-duration:45s] group-hover:[animation-play-state:paused]">
            {[...SAGLAYICILAR, ...SAGLAYICILAR].map((s, i) => (
              <span key={i} aria-hidden={i >= SAGLAYICILAR.length} className="flex shrink-0 items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em] text-white/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.logo} alt="" className="h-6 w-6" />
                {s.ad}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

/** Daktilo efektiyle örnekleri yazıp silen placeholder metni. */
function useDaktilo(aktif: boolean) {
  const [metin, setMetin] = useState("");
  useEffect(() => {
    if (!aktif) return;
    let i = 0, uzunluk = 0, siliyor = false, t: ReturnType<typeof setTimeout>;
    const adim = () => {
      const hedef = YAZI_ORNEKLERI[i];
      if (!siliyor) {
        uzunluk++;
        setMetin(hedef.slice(0, uzunluk));
        if (uzunluk === hedef.length) { siliyor = true; t = setTimeout(adim, 2200); return; }
        t = setTimeout(adim, 38);
      } else {
        uzunluk = Math.max(0, uzunluk - 3);
        setMetin(hedef.slice(0, uzunluk));
        if (uzunluk === 0) { siliyor = false; i = (i + 1) % YAZI_ORNEKLERI.length; t = setTimeout(adim, 400); return; }
        t = setTimeout(adim, 18);
      }
    };
    t = setTimeout(adim, 600);
    return () => clearTimeout(t);
  }, [aktif]);
  return metin;
}

const UretimKutusu = forwardRef<HeroKutu>(function UretimKutusu(_, disRef) {
  const router = useRouter();
  const [tur, setTur] = useState<UretimTuru>(URETIM_TURLERI[0]);
  const [prompt, setPrompt] = useState("");
  const [odak, setOdak] = useState(false);
  const alanRef = useRef<HTMLTextAreaElement>(null);
  const daktilo = useDaktilo(!odak && !prompt);

  useImperativeHandle(disRef, () => ({
    doldur: (metin, turId) => {
      if (turId) setTur(URETIM_TURLERI.find((t) => t.id === turId) ?? URETIM_TURLERI[0]);
      if (metin) setPrompt(metin); // boş çağrı yazılanı silmesin
      // preventScroll: yumuşak kaydırma sürerken odak sayfayı zıplatmasın
      setTimeout(() => alanRef.current?.focus({ preventScroll: true }), 350);
    },
  }), []);

  const uret = () => {
    const m = prompt.trim();
    router.push(tur.href + (m && PROMPT_ALAN.has(tur.id) ? `?prompt=${encodeURIComponent(m)}` : ""));
  };

  return (
    <div className={cn(
      "mt-9 rounded-[22px] border bg-yuzey/80 p-2 backdrop-blur-2xl transition-colors",
      odak ? "border-white/[0.2]" : "border-white/[0.1]",
    )}>
      <textarea
        ref={alanRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onFocus={() => setOdak(true)} onBlur={() => setOdak(false)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); uret(); } }}
        placeholder={odak ? tur.ipucu : daktilo || tur.ipucu}
        rows={2}
        aria-label="Ne üretmek istiyorsun?"
        className="block min-h-[76px] w-full resize-none bg-transparent px-3.5 pb-2 pt-3 text-[16px] leading-relaxed text-white placeholder:text-white/40 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-2 px-1 pb-1">
        <div className="gizli-scroll flex min-w-0 items-center gap-1 overflow-x-auto" role="group" aria-label="Üretim türü">
          <button onClick={() => router.push(tur.href)} aria-label="Referans ekle" title="Referans görsel ekle"
            className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white">
            <Paperclip className="h-4 w-4" />
          </button>
          {URETIM_TURLERI.map((t) => {
            const secili = t.id === tur.id;
            return (
              <button key={t.id} aria-pressed={secili} onClick={() => setTur(t)}
                className={cn(
                  "relative flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] px-2.5 text-[13px] transition-colors",
                  secili ? "font-medium text-white" : "text-white/55 hover:text-white",
                )}>
                {secili && <motion.span layoutId="heroTur" className="absolute inset-0 rounded-[10px] bg-white/[0.1]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                <t.ikon className={cn("relative h-[15px] w-[15px]", METIN_RENK[t.id as RenkTuru])} strokeWidth={2} />
                <span className="relative">{t.ad}</span>
              </button>
            );
          })}
        </div>
        <button onClick={uret}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-[12px] bg-aksan px-4 text-[14px] font-semibold text-zemin transition-[transform,opacity] hover:opacity-90 active:scale-[0.97]">
          <Wand2 className="h-4 w-4" strokeWidth={2.2} />
          Üret
        </button>
      </div>
    </div>
  );
});
