"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { animate, motion, useInView, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { KATALOG, TUR_AD, TUR_SIRASI, type KatalogModel, type KatalogTur } from "@/lib/modelKatalogu";
import { aileGorselleri } from "@/lib/modelGorsel";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { cn } from "@/lib/utils";
import { useYumusak } from "./performans";

const ease = [0.22, 1, 0.36, 1] as const;

/** Yalnız şu an kullanılabilen modeller. */
const MODELLER = KATALOG.filter((m) => m.rozet !== "Yakında" && m.rozet !== "Kapandı");
const SAGLAYICILAR = [...new Set(MODELLER.map((m) => m.saglayici))];

/** Aile ve tür havuzu tükenirse kullanılan ek gerçek çıktılar (tekrar olmasın diye). */
const GL = (ad: string, n: number) => Array.from({ length: n }, (_, i) => `/gercek/galeri/${ad}${i + 1}.webp`);
const YEDEK: Partial<Record<KatalogTur, string[]>> = {
  gorsel: [...GL("portre", 12), ...GL("sinematik", 12), ...GL("manzara", 12), ...GL("urun", 12), ...GL("soyut", 12)],
  "3d": GL("3d", 12),
};
/** Her modele önce ailesinin gerçek çıktılarından, yoksa türün havuzundan, sayfada tekrar etmeyen bir görsel. */
const KAPAK = new Map<string, string>();
{
  const kullanildi = new Set<string>();
  const sirali = [...MODELLER].sort((a, b) => Number(b.rozet === "Yeni") - Number(a.rozet === "Yeni"));
  for (const m of sirali) {
    const { liste } = aileGorselleri(m.aile, m.tur);
    const aday = [...liste, ...(m.kapak ? [m.kapak] : []), ...(YEDEK[m.tur] ?? [])].find((g) => !kullanildi.has(g)) ?? liste[0];
    kullanildi.add(aday); KAPAK.set(m.slug, aday);
  }
}
/** Kapak bir video karesiyse (video-hareket) üzerine gelince oynayacak video. */
const videoBul = (g: string) => (g.includes("/video-hareket/") ? g.replace("-poster.webp", ".mp4") : undefined);

/** Karo genişliği türe göre değişir; duvar tekdüze görünmez. */
const GENISLIK: Record<KatalogTur, string> = {
  video: "w-[250px] sm:w-[340px]", gorsel: "w-[150px] sm:w-[200px]", ses: "w-[190px] sm:w-[250px]", muzik: "w-[190px] sm:w-[250px]", "3d": "w-[150px] sm:w-[200px]",
};

function Sayac({ n }: { n: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const gor = useInView(ref, { once: true });
  const [d, setD] = useState(0);
  useEffect(() => { if (!gor) return; const c = animate(0, n, { duration: 1.6, ease, onUpdate: (v) => setD(Math.round(v)) }); return c.stop; }, [gor, n]);
  return <span ref={ref} className="tabular-nums">{d}</span>;
}

function Karo({ m, filtre }: { m: KatalogModel; filtre: KatalogTur | null }) {
  const g = KAPAK.get(m.slug)!;
  const v = videoBul(g);
  const ref = useRef<HTMLVideoElement>(null);
  const sonuk = filtre !== null && filtre !== m.tur;
  return (
    <Link href={m.href} tabIndex={sonuk ? -1 : 0}
      onMouseEnter={() => ref.current?.play().catch(() => {})}
      onMouseLeave={() => { const x = ref.current; if (x) { x.pause(); x.currentTime = 0; } }}
      className={cn("group/k relative block h-[200px] shrink-0 overflow-hidden rounded-[22px] bg-white/[0.04] ring-1 ring-white/[0.08] transition-[opacity,filter,transform,box-shadow] duration-500 hover:z-10 hover:-translate-y-1 hover:ring-white/[0.25] sm:h-[250px]",
        GENISLIK[m.tur], sonuk && "pointer-events-none opacity-[0.18] grayscale")}>
      <img src={g} alt="" loading="lazy" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover/k:scale-[1.07]" />
      {v && <video ref={ref} src={v} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover/k:opacity-100" />}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
      <span className="absolute left-3 top-3 flex items-center gap-1.5">
        {m.rozet === "Yeni" && <span className="rounded-full bg-[#55d6fd] px-2 py-0.5 text-[11px] font-semibold text-[#06141a]">Yeni</span>}
      </span>
      <span className="absolute right-3 top-3 flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-white text-black opacity-0 transition-all duration-300 group-hover/k:translate-y-0 group-hover/k:opacity-100">
        <ArrowUpRight className="h-4 w-4" />
      </span>
      <span className="absolute inset-x-3.5 bottom-3.5">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/45 ring-1 ring-white/15"><ModelLogo ad={m.ad} boyut={15} /></span>
          <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-white">{m.ad}</span>
        </span>
        <span className="mt-1 flex items-center justify-between gap-2 text-[12.5px] text-white/60">
          <span className="truncate">{TUR_AD[m.tur]} · {m.saglayici}</span>
          <span className="shrink-0 tabular-nums">{m.bedel.split(" / ")[0]}</span>
        </span>
        {m.etiketler.length > 0 && (
          <span className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 group-hover/k:grid-rows-[1fr]">
            <span className="flex flex-wrap gap-1 overflow-hidden">
              {m.etiketler.slice(0, 3).map((e) => <span key={e} className="mt-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white/85 ring-1 ring-white/10">{e}</span>)}
            </span>
          </span>
        )}
      </span>
    </Link>
  );
}

/** Bir sıra: sayfa kaydıkça yatayda yumuşakça akar. */
function Sira({ l, p, yon, filtre }: { l: KatalogModel[]; p: MotionValue<number>; yon: 1 | -1; filtre: KatalogTur | null }) {
  // Yalnız transform değişir (GPU katmanında), sayfa yeniden çizilmez.
  const x = useTransform(p, [0, 1], yon === 1 ? ["0%", "-30%"] : ["-30%", "0%"]);
  return (
    <motion.div style={{ x }} className="flex w-max gap-3 [will-change:transform] sm:gap-4">
      {l.map((m, i) => <Karo key={`${m.slug}-${i}`} m={m} filtre={filtre} />)}
    </motion.div>
  );
}

/**
 * "60 model, tek hesapta" — kaydırmayla akan model duvarı.
 * Duvar perspektifle yatarak açılır; sıralar zıt yönlere akar; tür seçince diğerleri söner.
 */
export function Modeller() {
  const kok = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: kok, offset: ["start end", "end start"] });
  const p = useYumusak(scrollYProgress, kok, { stiffness: 40, damping: 18, mass: 0.8 });

  const [filtre, setFiltre] = useState<KatalogTur | null>(null);
  const say = useMemo(() => Object.fromEntries(TUR_SIRASI.map((t) => [t, MODELLER.filter((m) => m.tur === t).length])) as Record<KatalogTur, number>, []);
  const siralar = useMemo(() => {
    // Türler sıralara karışık dağılır (her sıra 20 kart; akış payı kenar boşluğu bırakmaz).
    const l = [...MODELLER].sort((a, b) => Number(b.rozet === "Yeni") - Number(a.rozet === "Yeni") || Number(!!b.oneCikan) - Number(!!a.oneCikan));
    const r: KatalogModel[][] = [[], [], []];
    l.forEach((m, i) => r[i % 3].push(m));
    return r;
  }, []);

  return (
    <section ref={kok} className="overflow-clip py-20 sm:py-28">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease }}
          className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-[56px]">
              <span className="hero-isilti"><Sayac n={MODELLER.length} /> model</span>, tek hesapta.
            </h2>
            <p className="mt-3 max-w-[540px] text-[16px] leading-relaxed text-white/60 sm:text-[17px]">Google, OpenAI, ByteDance, Kling ve diğerlerinin en iyi modelleri. Ayrı abonelik yok, tek kredi.</p>
          </div>
          {/* Tür filtresi: seçilmeyen türler duvarda söner */}
          <div className="gizli-scroll -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            <div className="flex w-max gap-0.5 rounded-full bg-white/[0.05] p-1 ring-1 ring-white/[0.08]">
              {[null, ...TUR_SIRASI].map((t) => {
                const s = filtre === t;
                return (
                  <button key={t ?? "hepsi"} onClick={() => setFiltre(t)} aria-pressed={s}
                    className={cn("relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium transition-colors", s ? "text-black" : "text-white/60 hover:text-white")}>
                    {s && <motion.span layoutId="mdl-filtre" transition={{ type: "spring", stiffness: 480, damping: 38 }} className="absolute inset-0 rounded-full bg-white" />}
                    <span className="relative">{t ? TUR_AD[t] : "Tümü"}</span>
                    <span className={cn("relative text-[12px] tabular-nums", s ? "text-black/45" : "text-white/35")}>{t ? say[t] : MODELLER.length}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Giriş tek seferlik; kenar solması maske yerine sabit degrade katmanı (her karede maske hesaplanmaz). */}
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 1, ease }}
        className="relative flex flex-col gap-3 sm:gap-4">
        {siralar.map((l, i) => <Sira key={i} l={l} p={p} yon={i % 2 ? -1 : 1} filtre={filtre} />)}
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[8%] bg-gradient-to-r from-[#0b0b0c] to-transparent" />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-20 w-[8%] bg-gradient-to-l from-[#0b0b0c] to-transparent" />
      </motion.div>

      <div className="mx-auto mt-10 flex max-w-[1280px] flex-col items-center gap-5 px-4 sm:flex-row sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {SAGLAYICILAR.slice(0, 8).map((s) => {
              const m = MODELLER.find((x) => x.saglayici === s)!;
              return <span key={s} title={s} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1c1e] ring-2 ring-[#0b0b0c]"><ModelLogo ad={m.ad} boyut={18} /></span>;
            })}
          </div>
          <p className="text-[14px] text-white/55"><span className="font-semibold text-white">{SAGLAYICILAR.length} sağlayıcı</span>, tek kredi ile</p>
        </div>
        <Link href="/modeller" className="group inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.97]">
          Tüm modelleri karşılaştır<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
