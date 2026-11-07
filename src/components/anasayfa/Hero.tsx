"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Wand2 } from "lucide-react";
import { KATALOG, type KatalogTur } from "@/lib/modelKatalogu";
import { SAGLAYICILAR } from "@/components/kesfet/veri";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { Komut, OrnekCipleri, TURLER, YuzenKomut, useKomut, type KomutDurum } from "./Komut";
import { cn } from "@/lib/utils";

const G = "/gercek";
/** Yalnız şu an kullanılabilen modeller sayılır ("Bağlı değil" ve "Kapandı" hariç). */
const MODEL_SAYISI = KATALOG.filter((m) => m.rozet !== "Bağlı değil" && m.rozet !== "Kapandı").length;
/** Duyuru hapındaki en yeni model (stüdyoda gerçekten var olan). */
const YENI_MODEL = KATALOG.find((m) => /^seedance 2\.5/i.test(m.ad)) ?? KATALOG.find((m) => m.tur === "video")!;
/** Kullanıcı dokunana dek kutu türler arasında döner; her türde bir örnek yazılır. */
const TANITIM_MS = 5600;
const giris = (gecikme: number) => ({
  initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, delay: gecikme, ease: [0.22, 1, 0.36, 1] as const },
});

/* ── Duvar karoları: Vayra'da üretilmiş gerçek görseller ve videolar ──
   Her karonun istemi var; tıklayınca kutuya o istem ve tür dolar. */
type Karo = { g: string; v?: string; tur: KatalogTur; kisa: string; istem: string };
const vid = (n: string, kisa: string, istem: string): Karo => ({ g: `${G}/video-hareket/${n}-poster.webp`, v: `${G}/video-hareket/${n}.mp4`, tur: "video", kisa, istem });
const img = (p: string, kisa: string, istem: string, tur: KatalogTur = "gorsel"): Karo => ({ g: `${G}/${p}.webp`, tur, kisa, istem });

const SIRALAR: Karo[][] = [
  [
    img("galeri/sinematik6", "Neon kavşak", "Gece yağmurunda neon tabelalı bir kavşak, yukarıdan geniş açı, sinematik"),
    vid("low-shutter", "Işık izleri", "Neon ışıklı caddede gümüş montlu adam, düşük enstantane, ışık izleri"),
    img("panel/gal-gpt-0", "Parfüm çekimi", "Islak mermerde parfüm şişesi, su sıçraması, lüks ürün çekimi"),
    img("galeri/3d4", "Yüzen ada", "Bulutların üstünde yüzen ada, şelaleler ve taş köprü, 3D sahne", "3d"),
    img("galeri/portre4", "Altın saat", "Altın saatte kızıl saçlı kadın portresi, yumuşak arka ışık, 85 mm"),
    vid("crane-up", "Kızıl kayalıklar", "Okyanusa bakan kızıl kayalıklar, kamera yavaşça yükseliyor, altın saat"),
    img("panel/gal-seedance-0", "Ejderha", "Yanan bir kalenin üstünde ateş püskürten ejderha, epik fantastik sahne"),
    img("galeri/manzara7", "Kutup ışıkları", "Buzdağlarının üstünde yeşil kutup ışıkları, gece, uzun pozlama"),
  ],
  [
    img("panel/gal-soulcinema-3", "Yaşlı balıkçı", "Fırtınalı denizde ağ çeken yaşlı balıkçı, belgesel portre, doğal ışık"),
    img("galeri/urun11", "Saat çekimi", "Ahşap masada deri kayışlı lacivert saat, sıcak stüdyo ışığı, ürün çekimi"),
    vid("slow-motion", "Su sıçraması", "Siyah zeminde yükselen su sıçraması, ağır çekim, sert yan ışık"),
    img("galeri/3d12", "Işıklı ağaç", "Parlayan meyveleri olan büyülü ağaç, karanlık zemin, 3D render", "3d"),
    img("proje-kesfet/kesfet-04", "Tokyo ara sokağı", "Yağmurlu Tokyo ara sokağı, kırmızı fenerler, ıslak asfaltta yansımalar"),
    img("galeri/soyut7", "Boya patlaması", "Renkli boya patlaması, donmuş an, koyu zemin, yüksek hızlı çekim"),
    { g: `${G}/panel/gal-pazarlama-5.webp`, v: `${G}/paz-video/gal-pazarlama-5.mp4`, tur: "video", kisa: "İçecek reklamı", istem: "Buz ve meyvelerle sıçrayan enerji içeceği kutusu, reklam çekimi, ağır çekim" },
    img("galeri/sinematik9", "Buharlı tren", "Sisli vadide taş köprüden geçen buharlı tren, sinematik geniş açı"),
  ],
  [
    img("galeri/3d6", "Uzay gemisi", "Gezegen halkalarının önünde süzülen dev uzay gemisi, bilim kurgu konsepti", "3d"),
    img("panel/gal-pazarlama-3", "Akıllı saat", "Neon şehir ışıklarında akıllı saat, ürün reklamı, sığ alan derinliği"),
    img("galeri/portre11", "Boyalı yüz", "Renkli desenlerle boyanmış gülen yüz, festival ışıkları, portre"),
    vid("zoom-out", "Buzda kırmızı elbise", "Uçsuz buz düzlüğünde kırmızı elbiseli kadın, kamera geriye doğru açılıyor"),
    img("panel/gal-soul2-4", "Çiçek taç", "Çiçeklerden taç takmış kadın portresi, yumuşak doğal ışık, editoryal"),
    img("galeri/urun8", "Kokteyl", "Bar tezgâhında turuncu kokteyl, sıcak arka ışık, içecek fotoğrafı"),
    img("galeri/manzara4", "Kanyon nehri", "Kızıl kanyonda kıvrılan nehir, günbatımı, havadan çekim"),
    vid("orbit-left", "Spor araba", "Stüdyoda kırmızı spor araba, kamera etrafında dönüyor, parlak zemin"),
  ],
  [
    img("panel/gal-gpt-1", "Kafede kitap", "Pencere kenarında kitap okuyan kadın, sıcak kafe ışığı, belgesel tarzı"),
    vid("whip-pan", "Times Meydanı", "Times Meydanı'nda hızlı kamera savrulması, gündüz, canlı renkler"),
    img("galeri/3d8", "Pofuduk canavar", "Pastel renkli pofuduk sevimli canavar, oyuncak tarzı 3D karakter", "3d"),
    img("galeri/sinematik4", "Fırtınada fener", "Fırtınada dev dalgaların vurduğu deniz feneri, şimşek, dramatik"),
    img("panel/gal-soulcinema-5", "Ateşte savaşçı", "Alevlerin önünde zırhlı savaşçı, sinematik karanlık atmosfer"),
    img("galeri/urun2", "Saat ve su", "Su sıçraması içinde akıllı saat, mavi tonlar, ürün reklamı"),
    vid("commercial", "Parfüm reklamı", "Siyah zeminde dönen cam parfüm şişesi, altın kapak, reklam filmi"),
    img("galeri/soyut8", "Kristal", "Işığı kıran şeffaf kristal, gökkuşağı yansımaları, makro"),
  ],
  [
    img("galeri/manzara8", "Pirinç terasları", "Sisli sabahta yeşil pirinç terasları, havadan çekim"),
    img("panel/gal-gpt-6", "Saat mekanizması", "Açık mekanizmalı lüks saat, karanlık zemin, makro ürün çekimi"),
    vid("fpv-dive", "Kanyona dalış", "Kızıl kanyon duvarları arasında FPV drone dalışı, hızlı ve akıcı"),
    img("galeri/portre9", "Su altı portre", "Su altında gözleri kapalı kadın, mavi ışık süzmeleri, rüya gibi"),
    img("galeri/3d5", "Masal kulübesi", "Şeker renklerinde masalsı kulübe, yumuşak kil dokusu, 3D", "3d"),
    img("galeri/sinematik7", "Orman ışığı", "Yaşlı ormanda ağaçların arasından süzülen güneş ışınları, sisli"),
    img("panel/gal-pazarlama-0", "Spor ayakkabı", "Renkli toz patlaması içinde spor ayakkabı, reklam çekimi"),
    img("galeri/urun5", "Latte", "Ahşap masada köpüklü latte, sabah ışığı, kafe atmosferi"),
  ],
];

function DuvarKaro({ k, onSec }: { k: Karo; onSec: (k: Karo) => void }) {
  const [yuklendi, setYuklendi] = useState(false);
  const vRef = useRef<HTMLVideoElement>(null);
  // Ekrandaysa oynar; ekran dışındaki kopyalar boşuna çalışmaz.
  useEffect(() => {
    const v = vRef.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  const TurIkon = TURLER.find((t) => t.id === k.tur)!.ikon;
  return (
    <button type="button" tabIndex={-1} onClick={() => onSec(k)} aria-label={`${k.kisa} istemini kullan`}
      className={cn("group/karo relative h-[232px] shrink-0 overflow-hidden rounded-[20px] bg-white/[0.04] text-left transition-[filter,transform] duration-500 hover:z-10 hover:scale-[1.035] hover:brightness-125", k.v ? "w-[131px]" : "w-[310px]")}>
      <img src={k.g} alt="" loading="lazy" decoding="async" onLoad={() => setYuklendi(true)}
        className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-700", yuklendi ? "opacity-100" : "opacity-0")} />
      {k.v && <video ref={vRef} src={k.v} muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />}
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover/karo:opacity-100" />
      <span className="absolute inset-x-2.5 bottom-2.5 flex translate-y-2 items-center gap-1.5 opacity-0 transition-all duration-300 group-hover/karo:translate-y-0 group-hover/karo:opacity-100">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/45 ring-1 ring-white/20"><TurIkon className="h-3.5 w-3.5 text-white" /></span>
        {!k.v && <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-white">{k.kisa}</span>}
        <span className={cn("flex h-7 shrink-0 items-center gap-1 rounded-full bg-white px-2.5 text-[12px] font-semibold text-black", k.v && "ml-auto")}>
          <Wand2 className="h-3 w-3" />Kullan
        </span>
      </span>
    </button>
  );
}

/** Eğik, akan duvar. İmlece göre hafifçe kayar; bir sıranın üstüne gelince o sıra durur. */
/** Duvar komut kutusuna her harf yazıldığında yeniden çizilmesin diye ayrı ve sabit tutulur. */
const Duvar = memo(function Duvar({ onSec }: { onSec: (k: Karo) => void }) {
  const azHareket = useReducedMotion();
  const mx = useMotionValue(0), my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 40, damping: 18 }), y = useSpring(my, { stiffness: 40, damping: 18 });
  useEffect(() => {
    if (azHareket) return;
    const f = (e: PointerEvent) => { mx.set((e.clientX / innerWidth - 0.5) * -28); my.set((e.clientY / innerHeight - 0.5) * -18); };
    addEventListener("pointermove", f);
    return () => removeEventListener("pointermove", f);
  }, [azHareket, mx, my]);

  return (
    <motion.div style={{ x, y }} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      className="absolute left-1/2 top-1/2 -ml-[1600px] -mt-[640px] h-[1280px] w-[3200px]">
      <div className="flex h-full rotate-[-8deg] flex-col justify-center gap-4">
        {SIRALAR.map((s, i) => (
          <div key={i} className={cn("flex w-max gap-4 pr-4 hover:[animation-play-state:paused]", i % 2 ? "kesfet-kay-ters" : "kesfet-kay")}
            style={{ animationDuration: `${110 + i * 17}s`, marginLeft: `${(i % 3) * -120}px` }}>
            {[...s, ...s].map((x, j) => <DuvarKaro key={j} k={x} onSec={onSec} />)}
          </div>
        ))}
      </div>
    </motion.div>
  );
});

/** Başlıkta türle eşleşen dönen kelime; camgöbeği degradenin üstünden ışık geçer. */
function DonenKelime({ metin }: { metin: string }) {
  return (
    <motion.span layout transition={{ type: "spring", stiffness: 260, damping: 30 }} className="relative inline-flex overflow-hidden pb-[0.12em] align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={metin}
          initial={{ y: "85%", opacity: 0, filter: "blur(12px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: "-85%", opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hero-isilti whitespace-nowrap">
          {metin}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

const buyuk = (m: string) => m.charAt(0).toLocaleUpperCase("tr-TR") + m.slice(1);

/** Duyuru hapı: dönen camgöbeği kenar, nabız atan "Yeni", model logosu. */
function YeniHap() {
  return (
    <Link href={YENI_MODEL.href} className="kredi-isilti group inline-flex rounded-full p-px transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
      <span className="flex h-11 items-center gap-2.5 rounded-full bg-[#141416] pl-1.5 pr-1.5">
        <span className="flex h-8 items-center gap-2 rounded-full bg-[#55d6fd]/[0.14] px-3 text-[13px] font-semibold text-[#8be6ff]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#55d6fd] opacity-75" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />
          </span>
          Yeni
        </span>
        <ModelLogo ad={YENI_MODEL.ad} boyut={18} />
        <span className="whitespace-nowrap text-[15px] font-medium tracking-[-0.01em] text-white">
          {YENI_MODEL.ad}<span className="text-white/60 max-[379px]:hidden"> artık Vayra&apos;da</span>
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] transition-colors group-hover:bg-white/[0.15]">
          <ArrowRight className="h-4 w-4 text-white transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

function LogoSeridi() {
  return (
    <div className="kesfet-serit-maske group flex overflow-hidden">
      <div className="kesfet-kay flex shrink-0 items-center gap-14 pr-14 [animation-duration:60s] group-hover:[animation-play-state:paused] sm:gap-[72px] sm:pr-[72px]">
        {[...SAGLAYICILAR, ...SAGLAYICILAR].map((s, i) => (
          <span key={i} aria-hidden={i >= SAGLAYICILAR.length}
            className="flex shrink-0 items-center gap-3 text-[17px] font-semibold tracking-[-0.02em] text-white/65 transition-colors duration-300 hover:text-white sm:text-[21px]">
            <img src={s.logo} alt="" className="h-7 w-7 sm:h-[34px] sm:w-[34px]" />{s.ad}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Ana sayfa hero'su — "A · Akan duvar".
 * Gerçek üretimlerden eğik bir duvar; ortada başlık ve gerçekten çalışan komut kutusu.
 * Kullanıcı dokunana dek kutu türler arasında döner ve başlıktaki kelime türle değişir.
 */
export function Hero() {
  const k = useKomut();
  const kutu = useRef<HTMLDivElement>(null);
  const alan = useRef<HTMLTextAreaElement>(null);
  const azHareket = useReducedMotion();
  const { dokundu, bekle, turId, otoTur } = k;
  // Tanıtım döngüsü yalnız hero ekrandayken döner; aşağıdaki yüzen çubuk kendi kendine değişmesin.
  const bolum = useRef<HTMLElement>(null);
  const [ekranda, setEkranda] = useState(true);
  useEffect(() => {
    const el = bolum.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setEkranda(e.isIntersecting), { threshold: 0.35 });
    io.observe(el); return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (dokundu || bekle || azHareket || !ekranda) return;
    const t = setTimeout(() => otoTur(TURLER[(TURLER.findIndex((x) => x.id === turId) + 1) % TURLER.length].id), TANITIM_MS);
    return () => clearTimeout(t);
    // otoTur her çizimde yeniden kurulur ama yalnız setState çağırır; bağımlılığa eklemek sayacı sıfırlardı.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dokundu, bekle, azHareket, turId, ekranda]);

  // Kaydırınca çıkış: içerik yükselip söner, duvar hafifçe yaklaşır (yalnız transform/opaklık).
  const { scrollYProgress: cikis } = useScroll({ target: bolum, offset: ["start start", "end start"] });
  const icY = useTransform(cikis, [0, 1], [0, -120]);
  const icOp = useTransform(cikis, [0, 0.6], [1, 0]);

  const kRef = useRef(k); kRef.current = k;
  const karoSec = useCallback((x: Karo) => {
    const k = kRef.current;
    k.setTur(x.tur);
    k.setMetin(x.istem);
    // scrollIntoView kırpılmış bölümün kendisini de kaydırıyordu; yalnız pencereyi kaydır.
    const r = kutu.current?.getBoundingClientRect();
    if (r && (r.top < 80 || r.bottom > innerHeight - 20)) scrollTo({ top: scrollY + r.top - (innerHeight - r.height) / 2, behavior: "smooth" });
    setTimeout(() => alan.current?.focus({ preventScroll: true }), 300);
  }, []);


  return (
    <section ref={bolum} className="relative isolate overflow-clip">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#0b0b0c]">
        <Duvar onSec={karoSec} />
        {/* Okunabilirlik: ortası koyu, kenarlar canlı; altta zemine erir */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_56%_60%_at_50%_48%,rgba(11,11,12,0.95)_0%,rgba(11,11,12,0.86)_38%,rgba(11,11,12,0.45)_72%,rgba(11,11,12,0.18)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0b0b0c]/85 to-transparent" />
      </div>

      <motion.div style={{ y: icY, opacity: icOp }} className="pointer-events-none mx-auto flex min-h-[min(920px,calc(100svh-var(--ust-nav)))] max-w-[1100px] flex-col items-center justify-center px-4 pb-10 pt-12 text-center sm:px-8 sm:pb-48 sm:pt-16 [&>*]:pointer-events-auto">
        <motion.div {...giris(0)}><YeniHap /></motion.div>
        <motion.h1
          className="mt-7 text-[38px] font-semibold leading-[1.04] tracking-[-0.045em] text-white min-[400px]:text-[42px] sm:text-[80px] sm:leading-[1.02]">
          {["Bir", "cümle", "yaz."].map((w, i) => (
            <motion.span key={w} className="inline-block" initial={{ opacity: 0, y: 26, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}>{w}{i < 2 ? " " : ""}</motion.span>
          ))}
          <br />
          <motion.span className="inline-block" initial={{ opacity: 0, y: 26, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.9, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}>
            <DonenKelime metin={buyuk(k.tur.isim)} /> olsun.
          </motion.span>
        </motion.h1>
        <motion.p {...giris(0.12)} className="mt-5 max-w-[540px] text-pretty text-[16px] leading-relaxed text-white/65 sm:text-[17.5px]">
          Video, görsel, müzik, ses ve 3D için {MODEL_SAYISI} model tek hesapta. Ücretsiz başla, kart bilgisi gerekmez.
        </motion.p>
        <motion.div ref={kutu} {...giris(0.5)} className="relative mt-10 w-full max-w-[860px] text-left">
          {/* Nefes alan aura: kutunun arkasında yavaşça dolaşan camgöbeği ışık */}
          <span aria-hidden className="hero-aura pointer-events-none absolute -inset-x-16 -inset-y-12 -z-10" />
          {/* İstemci diğer sayfalardaki gibi Apple buzlu camı (.cam-istemci); arkadaki aura camın içinden bulanık görünür. */}
          <Komut k={k} alanRef={alan} />
          <OrnekCipleri k={k} ortala className="mt-4" />
        </motion.div>
      </motion.div>

      <motion.div {...giris(0.7)} className="pb-28 sm:absolute sm:inset-x-0 sm:bottom-12 sm:pb-0">
        <p className="mb-5 text-center text-[13.5px] text-white/45">Önde gelen laboratuvarların modelleri, tek hesapta</p>
        <LogoSeridi />
      </motion.div>
      <YuzenKomut k={k} hedef={kutu} />
    </section>
  );
}
