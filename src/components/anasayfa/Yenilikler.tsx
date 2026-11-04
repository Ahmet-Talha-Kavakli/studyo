"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { KATALOG, TUR_AD, type KatalogModel } from "@/lib/modelKatalogu";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { cn } from "@/lib/utils";
import { OrtamIsigi, useEkranda, useYumusak } from "./performans";

const ease = [0.22, 1, 0.36, 1] as const;
const G = "/gercek";
const K = (ad: string) => `${G}/kesfet/${ad}.webp`;
const model = (r: RegExp) => KATALOG.find((m) => r.test(m.ad) && m.rozet === "Yeni")!;

type Sahne = "video" | "galeri" | "ses" | "preset";
type Yenilik = {
  id: string; ad: string; ust: string; ozet: string; href: string;
  m?: KatalogModel;
  /** Katalogdan gösterilecek özellik satırları (ad eşleşmesi). */
  ozellik?: string[];
  sahne: Sahne; gorseller: string[]; video?: string;
  /** Kartın arka ışığı için ana görsel. */
  isik: string;
};
const mdl = (r: RegExp, ozet: string, ozellik: string[], sahne: Sahne, gorseller: string[], video?: string): Yenilik => {
  const m = model(r);
  return { id: m.slug, ad: m.ad, ust: `${TUR_AD[m.tur]} modeli · ${m.saglayici}`, ozet, href: m.href, m, ozellik, sahne, gorseller, video, isik: gorseller[0] };
};

/** Gerçek yenilikler: katalogda "Yeni" rozetli modeller ve sürüm notlarındaki özellik. Görseller o modelin gerçek çıktıları. */
const YENILIKLER: Yenilik[] = [
  mdl(/^seedance 2\.5/i, "Tek istemden çok çekimli, sinematik sahneler. Kamera hareketi ve ses birlikte gelir.", ["Çözünürlük", "Süre", "Ses"], "video", [`${G}/hero-video/seedance-banner-poster.webp`], `${G}/hero-video/seedance-banner.mp4`),
  mdl(/^kling 3\.0 turbo/i, "Kling 3.0 kalitesi, çok daha hızlı. Aksiyon sahnelerinde akıcı ve tutarlı hareket.", ["Çözünürlük", "Süre", "Ses"], "galeri", [K("samuray-duellosukling-3-0"), K("yagmurlu-tokyo-sokagikling-3-0-turbo"), K("futuristik-metrokling-3-0")]),
  mdl(/^gpt image 2\.5/i, "Ürün çekimlerinde gerçekçi ışık ve okunaklı yazı. Afiş, ambalaj ve reklam için ideal.", ["Çözünürlük", "Girdi", "Şeffaf arka plan"], "galeri", [`${G}/panel/gal-gpt-0.webp`, `${G}/panel/gal-gpt-1.webp`, `${G}/panel/gal-gpt-6.webp`]),
  mdl(/^seedream 5\.0 pro/i, "Canlı renkler ve ince detay. Fantastik sahneler, konsept çizimler ve kapaklar için.", ["Çözünürlük", "Girdi", "Adet"], "galeri", [K("kozmik-bahceseedream-5-0-pro"), K("su-alti-kristal-sehriseedream-5-0-pro"), K("tropik-cennet-adasiseedream-5-0-pro")]),
  mdl(/^eleven v4$/i, "Daha doğal Türkçe tonlama. Duygu etiketleriyle fısıltıdan heyecana her vurgu senin elinde.", ["Tek üretimde", "Ses kütüphanesi"], "ses", [K("elevenlabsses"), `${G}/muzik/vs-kuzey.webp`]),
  {
    id: "preset", ad: "Preset stüdyosu", ust: "Yeni özellik · 21 Ekim", ozet: "64 hazır efekt ya da kendi efektin. Bir fotoğraf yükle, viral videoyu tek tıkla al.",
    href: "/panel/presetler", sahne: "preset", isik: `${G}/preset-video/earth-zoom.webp`,
    gorseller: ["earth-zoom", "action-figure", "orbit-360"].map((n) => `${G}/preset-video/${n}.webp`),
  },
];
const N = YENILIKLER.length;

/* ── Kart sahneleri: her yeniliği kendi gerçek çıktısıyla gösterir ── */

function GaleriSahne({ y, aktif }: { y: Yenilik; aktif: boolean }) {
  const [s, setS] = useState(0);
  useEffect(() => { if (!aktif) return; const t = setInterval(() => setS((x) => (x + 1) % y.gorseller.length), 3200); return () => clearInterval(t); }, [aktif, y.gorseller.length]);
  return (
    <div className="absolute inset-0">
      <AnimatePresence initial={false}>
        <motion.img key={s} src={y.gorseller[s]} alt="" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease }}
          className="absolute inset-0 h-full w-full object-cover" />
      </AnimatePresence>
      <span className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-4 left-4 flex gap-2">
        {y.gorseller.map((g, i) => (
          <button key={g} onClick={() => setS(i)} aria-label={`${i + 1}. örnek`}
            className={cn("h-12 w-12 overflow-hidden rounded-[12px] ring-2 transition-all duration-300 sm:h-14 sm:w-14", i === s ? "scale-105 ring-white" : "opacity-60 ring-transparent hover:opacity-90")}>
            <img src={g} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

const SES_SATIR = [
  { etiket: "sıcak", metin: "Merhaba, ben Kuzey." },
  { etiket: "heyecanlı", metin: "Bugün sana yepyeni bir şey göstereceğim!" },
  { etiket: "fısıltı", metin: "Ama önce, bu bir sır." },
];
function SesSahne({ y, aktif }: { y: Yenilik; aktif: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => { if (!aktif) return; setN(0); const t = setInterval(() => setN((x) => (x + 1) % (SES_SATIR.length + 1)), 1500); return () => clearInterval(t); }, [aktif]);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img src={y.gorseller[0]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      <div className="absolute inset-x-4 bottom-4 rounded-[22px] bg-black/50 p-4 ring-1 ring-white/[0.1] backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <img src={y.gorseller[1]} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-white/20" />
          <div className="leading-tight"><p className="text-[13.5px] font-semibold text-white">Kuzey</p><p className="text-[12px] text-white/50">Türkçe · Erkek sesi</p></div>
          <span className="ml-auto rounded-full bg-white/[0.08] px-2.5 py-1 text-[11.5px] text-white/60">Örnek metin</span>
        </div>
        <div className="space-y-1.5">
          {SES_SATIR.map((s, i) => (
            <p key={i} className={cn("text-[15px] leading-snug transition-colors duration-500 sm:text-[16px]", i < n ? "text-white" : "text-white/30")}>
              <span className={cn("mr-1.5 rounded-[6px] px-1.5 py-0.5 text-[12px] font-medium transition-colors duration-500", i < n ? "bg-[#55d6fd]/20 text-[#9ff0ff]" : "bg-white/[0.06] text-white/35")}>[{s.etiket}]</span>
              {s.metin}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function PresetSahne({ y, aktif }: { y: Yenilik; aktif: boolean }) {
  const adlar = ["earth-zoom", "action-figure", "orbit-360"];
  const etiket = ["Dünyaya zoom", "Aksiyon figürü", "360 dönüş"];
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-3 overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,#17262c_0%,#0d0e10_70%)] px-4 sm:gap-4">
      {adlar.map((n, i) => (
        <motion.div key={n} className={cn("w-[29%] max-w-[190px]", i === 1 && "-translate-y-4")}
          initial={{ opacity: 0, y: 30, rotate: (i - 1) * 4 }} whileInView={{ opacity: 1, y: 0, rotate: (i - 1) * 3 }} viewport={{ amount: 0.4 }} transition={{ duration: 0.7, delay: i * 0.1, ease }}>
          <div className="overflow-hidden rounded-[20px] bg-black p-1 ring-1 ring-white/[0.14]">
            {aktif
              ? <video src={`${G}/preset-video/${n}.mp4`} poster={y.gorseller[i]} autoPlay muted loop playsInline className="aspect-[9/16] w-full rounded-[16px] object-cover" />
              : <img src={y.gorseller[i]} alt="" className="aspect-[9/16] w-full rounded-[16px] object-cover" />}
          </div>
          <p className="mt-2 text-center text-[12px] font-medium text-white/60">{etiket[i]}</p>
        </motion.div>
      ))}
    </div>
  );
}

function Sahne({ y, aktif }: { y: Yenilik; aktif: boolean }) {
  if (y.sahne === "video") return <video src={y.video} poster={y.gorseller[0]} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />;
  if (y.sahne === "ses") return <SesSahne y={y} aktif={aktif} />;
  if (y.sahne === "preset") return <PresetSahne y={y} aktif={aktif} />;
  return <GaleriSahne y={y} aktif={aktif} />;
}

/* ── Kart ── */
const giris = (d: number) => ({
  initial: { opacity: 0, y: 14, filter: "blur(6px)" }, whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { amount: 0.55 }, transition: { duration: 0.9, delay: d, ease },
});

function Kart({ y, i, p, aktif }: { y: Yenilik; i: number; p: MotionValue<number>; aktif: boolean }) {
  // Bir sonraki kart üstüne gelmeye başlayınca bu kart küçülür ve kararır.
  const bas = (i + 1) / N;
  const olcek = useTransform(p, [Math.min(bas - 0.2 / N, 0.998), 1], [1, 1 - (N - 1 - i) * 0.035]);
  const karart = useTransform(p, [Math.min(bas - 0.15 / N, 0.997), Math.min(bas + 0.8 / N, 0.999)], [0, i === N - 1 ? 0 : 0.42]);
  // Giriş: kart ekrana gelirken hafif eğimle süzülür.
  const kart = useRef<HTMLDivElement>(null);
  const { scrollYProgress: gelis } = useScroll({ target: kart, offset: ["start end", "start start"] });
  const yumusakGelis = useSpring(gelis, { stiffness: 90, damping: 26, mass: 0.6 });
  const egim = useTransform(yumusakGelis, [0, 0.7, 1], [i === 0 ? 0 : 10, 0, 0]);
  const girisOlcek = useTransform(yumusakGelis, [0, 0.75, 1], [i === 0 ? 1 : 0.9, 1, 1]);
  const toplamOlcek = useTransform([olcek, girisOlcek] as MotionValue<number>[], ([a, b]: number[]) => a * b);
  const ozellikler = (y.ozellik ?? []).map((a) => y.m?.ozellikler.find((o) => o.ad === a)).filter(Boolean) as { ad: string; deger: string }[];

  return (
    <div ref={kart} className="sticky h-[min(76vh,660px)] [perspective:1400px]" style={{ top: `calc(var(--ust-nav) + 24px + ${i * 12}px)` }}>
      <motion.article style={{ scale: toplamOlcek, rotateX: egim }} className="relative h-full origin-top will-change-transform overflow-hidden rounded-[34px] bg-[#101113] ring-1 ring-white/[0.1]">
        {/* Kartın kendi rengi: ana görselin bulanık ışığı */}
        <OrtamIsigi src={y.isik} opaklik={0.3} className="-left-1/4 -top-1/3 h-[120%] w-[90%] [--olcek:24]" />
        <div className="relative grid h-full grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:grid-rows-1">
          <div className="order-2 flex min-w-0 flex-col p-5 sm:p-8 lg:order-1 lg:p-11">
            <motion.p {...giris(0)} className="hidden text-[13px] font-medium tabular-nums text-white/40 lg:block">{String(i + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</motion.p>
            <div className="lg:mt-auto">
              <motion.p {...giris(0.04)} className="flex items-center gap-2 text-[13.5px] text-white/60">
                <span className="rounded-full bg-[#55d6fd] px-2 py-0.5 text-[11.5px] font-semibold text-[#06141a]">Yeni</span>{y.ust}
              </motion.p>
              <motion.h3 {...giris(0.08)} className="mt-3 flex items-center gap-3 text-[30px] font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-[44px]">
                {y.m ? <ModelLogo ad={y.m.ad} boyut={34} /> : <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#55d6fd]/15"><Sparkles className="h-5 w-5 text-[#55d6fd]" /></span>}
                <span className="min-w-0">{y.ad}</span>
              </motion.h3>
              <motion.p {...giris(0.12)} className="mt-3 line-clamp-2 max-w-[440px] text-[15px] leading-relaxed text-white/65 sm:text-[16.5px] lg:line-clamp-none">{y.ozet}</motion.p>
            </div>
            {ozellikler.length > 0 && (
              <motion.dl {...giris(0.16)} className="mt-7 hidden divide-y divide-white/[0.08] border-y border-white/[0.08] lg:block">
                {ozellikler.map((o) => (
                  <div key={o.ad} className="flex items-baseline justify-between gap-6 py-2.5">
                    <dt className="shrink-0 text-[13.5px] text-white/45">{o.ad}</dt>
                    <dd className="truncate text-right text-[13.5px] font-medium text-white/85">{o.deger}</dd>
                  </div>
                ))}
              </motion.dl>
            )}
            <motion.div {...giris(0.2)} className="mt-5 flex items-center gap-4 lg:mt-7">
              <Link href={y.href} className="group/d inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.97]">
                {y.m ? "Hemen dene" : "Presetlere göz at"}<ArrowRight className="h-4 w-4 transition-transform group-hover/d:translate-x-0.5" />
              </Link>
              {y.m && <span className="text-[14px] text-white/50">{y.m.bedel}</span>}
            </motion.div>
          </div>
          <div className="relative order-1 min-h-0 overflow-hidden lg:order-2 lg:m-3 lg:rounded-[26px]">
            <Sahne y={y} aktif={aktif} />
          </div>
        </div>
        <motion.span style={{ opacity: karart }} className="pointer-events-none absolute inset-0 bg-black" />
      </motion.article>
    </div>
  );
}

/**
 * "Yeni gelenler" — üst üste binen kartlar. Her yenilik ekrana yapışır;
 * bir sonraki üstüne gelirken geridekiler küçülüp kararır ve üstte bir yığın oluşur.
 */
export function Yenilikler() {
  const kok = useRef<HTMLDivElement>(null);
  const { scrollYProgress: ham } = useScroll({ target: kok, offset: ["start start", "end end"] });
  // Yay fiziğiyle süzülen ilerleme: küçülme, kararma ve gösterge sarsılmadan, yumuşak akar.
  const scrollYProgress = useYumusak(ham, kok, { stiffness: 70, damping: 22, mass: 0.5 });
  const [aktif, setAktif] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setAktif(Math.min(N - 1, Math.max(0, Math.round(v * (N - 1))))));
  const cubuk = useTransform(scrollYProgress, [0, 1], [1 / N, 1]);
  const a = YENILIKLER[aktif];
  const [bolum, ekranda] = useEkranda<HTMLElement>("0px");

  return (
    <section ref={bolum} className="mx-auto max-w-[1280px] px-4 pt-20 sm:px-8 sm:pt-28">
      <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease }}
        className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-[56px]">Yeni gelenler</h2>
          <p className="mt-3 max-w-[520px] text-[16px] leading-relaxed text-white/60 sm:text-[17px]">En yeni modeller ve özellikler, çıktıkları gibi Vayra&apos;da.</p>
        </div>
        <Link href="/panel/surum" className="group inline-flex h-10 items-center gap-1.5 self-start rounded-full bg-white/[0.07] px-4 text-[14px] font-medium text-white ring-1 ring-white/[0.1] transition-colors hover:bg-white/[0.12] sm:self-auto">
          Sürüm notları<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>

      <div ref={kok} className="relative">
        {/* Sağ kenarda yapışan konum göstergesi (masaüstü) */}
        <div className="pointer-events-none absolute inset-y-0 -right-6 hidden w-0 xl:block">
          <div className="sticky top-[calc(50vh-80px)] flex -translate-x-1/2 flex-col items-center gap-2">
            <div className="relative h-40 w-[3px] overflow-hidden rounded-full bg-white/[0.1]">
              <motion.span className="absolute inset-x-0 top-0 h-full origin-top rounded-full bg-[#55d6fd]" style={{ scaleY: cubuk }} />
            </div>
            <span className="text-[12px] tabular-nums text-white/45">{String(aktif + 1).padStart(2, "0")}</span>
          </div>
        </div>
        <div className="flex flex-col gap-[16vh] pb-[10vh]">
          {YENILIKLER.map((y, i) => <Kart key={y.id} y={y} i={i} p={scrollYProgress} aktif={ekranda && Math.abs(i - aktif) <= 1} />)}
        </div>
        <span className="sr-only" aria-live="polite">{a.ad}</span>
      </div>
    </section>
  );
}
