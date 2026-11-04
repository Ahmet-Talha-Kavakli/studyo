"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from "framer-motion";
import { ArrowRight, ArrowUp } from "lucide-react";
import { OrtamIsigi, useYumusak } from "./performans";

const GL = "/gercek/galeri";

/** Galeri bölümünde kullanılmayan gerçek Vayra çıktıları (tekrar olmasın). */
const KARELER = [
  "sinematik1", "portre2", "manzara1", "urun4", "3d2", "soyut2", "sinematik3", "portre5", "manzara2", "urun6", "3d3", "soyut3",
  "sinematik10", "portre8", "manzara5", "urun7", "3d7", "soyut4", "sinematik11", "portre12", "manzara6", "urun9", "3d9", "soyut6",
  "sinematik12", "portre3", "manzara9", "urun10", "3d10", "soyut9", "sinematik8", "portre6", "manzara10", "urun12", "3d11", "soyut11",
].map((n) => `${GL}/${n}.webp`);
const N = KARELER.length;
const ARALIK = 300;
const DERINLIK = N * ARALIK;

/**
 * Kareler tünel duvarına dizilir: altın açıyla çevreye dağılır, merkez boş kalır.
 * Her kare tünelin merkezine doğru hafifçe döner (duvar hissi).
 */
const KONUM = KARELER.map((g, i) => {
  const a = (i * 137.508 * Math.PI) / 180;
  const r = 34 + (i % 3) * 7;
  const sol = 50 + Math.cos(a) * r;
  const ust = 50 + Math.sin(a) * r * 0.68;
  return { g, sol, ust, z: -i * ARALIK, dikey: i % 3 === 0, ry: (sol - 50) * -0.55, rx: (ust - 50) * 0.55 };
});

function Kare({ k, z0 }: { k: (typeof KONUM)[number]; z0: MotionValue<number> }) {
  // Kamera ilerledikçe kare yaklaşır: uzakta söner, yanından geçerken kaybolur.
  const z = useTransform(z0, (v) => k.z + v);
  const op = useTransform(z, [-5200, -3400, -400, 200, 420], [0, 1, 1, 0.6, 0]);
  return (
    <motion.div style={{ left: `${k.sol}%`, top: `${k.ust}%`, z, opacity: op, rotateY: k.ry, rotateX: k.rx }}
      className={k.dikey ? "absolute -ml-[80px] -mt-[106px] w-[160px] [will-change:transform] sm:-ml-[110px] sm:-mt-[146px] sm:w-[220px]" : "absolute -ml-[120px] -mt-[80px] w-[240px] [will-change:transform] sm:-ml-[160px] sm:-mt-[107px] sm:w-[320px]"}>
      <img src={k.g} alt="" loading="lazy" decoding="async" draggable={false}
        className={`w-full rounded-[18px] object-cover ring-1 ring-white/[0.14] ${k.dikey ? "aspect-[3/4]" : "aspect-[3/2]"}`} />
    </motion.div>
  );
}

/** Rastgele dağılmış yıldızlar (sabit tohumlu: sunucu ve tarayıcıda aynı). */
function yildizlar(adet: number, tohum: number, renk: string) {
  let x = tohum;
  const r = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  let d = "";
  for (let i = 0; i < adet; i++) d += `<circle cx='${(r() * 1000).toFixed(1)}' cy='${(r() * 1000).toFixed(1)}' r='${(0.35 + r() * 0.8).toFixed(2)}' fill='${renk}' fill-opacity='${(0.25 + r() * 0.6).toFixed(2)}'/>`;
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000' preserveAspectRatio='none'>${d}</svg>`)}")`;
}
const YILDIZ_1 = yildizlar(170, 7, "#ffffff");
const YILDIZ_2 = yildizlar(60, 91, "#9ff0ff");

/** Yıldız tozu: iki katman farklı hızda merkezden dışa doğru büyür (ileri uçuş hissi). */
function Toz({ p }: { p: MotionValue<number> }) {
  const s1 = useTransform(p, [0, 1], [1, 1.7]);
  const s2 = useTransform(p, [0, 1], [1.1, 2.4]);
  const o = useTransform(p, [0, 0.08, 0.8, 0.95], [0.5, 1, 1, 0.2]);
  return (
    <motion.div aria-hidden style={{ opacity: o }} className="absolute inset-0">
      <motion.div style={{ scale: s1, backgroundImage: YILDIZ_1 }} className="absolute -inset-[15%] bg-[length:100%_100%] [will-change:transform]" />
      <motion.div style={{ scale: s2, backgroundImage: YILDIZ_2 }} className="absolute -inset-[15%] bg-[length:100%_100%] [will-change:transform]" />
    </motion.div>
  );
}

/** Işık hızı çizgileri: merkezden dışa uzanan ince ışınlar. Kaydırma hızlandıkça parlar ve uzar. */
const ISINLAR = (() => {
  let x = 23; const r = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  let d = "";
  for (let i = 0; i < 90; i++) {
    const a = r() * Math.PI * 2, i0 = 120 + r() * 260, uz = 120 + r() * 380;
    const x1 = 500 + Math.cos(a) * i0, y1 = 500 + Math.sin(a) * i0, x2 = 500 + Math.cos(a) * (i0 + uz), y2 = 500 + Math.sin(a) * (i0 + uz);
    d += `<line x1='${x1.toFixed(1)}' y1='${y1.toFixed(1)}' x2='${x2.toFixed(1)}' y2='${y2.toFixed(1)}' stroke='url(#g)' stroke-width='${(0.6 + r() * 1.4).toFixed(2)}' stroke-linecap='round'/>`;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'><defs><radialGradient id='g' cx='500' cy='500' r='700' gradientUnits='userSpaceOnUse'><stop offset='0.15' stop-color='#9ff0ff' stop-opacity='0'/><stop offset='0.5' stop-color='#cdf7ff' stop-opacity='0.55'/><stop offset='1' stop-color='#ffffff' stop-opacity='0'/></radialGradient></defs>${d}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

function Isinlar({ hiz, p }: { hiz: MotionValue<number>; p: MotionValue<number> }) {
  const op = useTransform(hiz, [0, 0.25, 1], [0.08, 0.55, 1]);
  const olcek = useTransform([hiz, p] as MotionValue<number>[], ([h, v]: number[]) => 1 + h * 0.35 + v * 0.6);
  return <motion.div aria-hidden style={{ opacity: op, scale: olcek, backgroundImage: ISINLAR }} className="pointer-events-none absolute left-1/2 top-1/2 h-[160vmax] w-[160vmax] -translate-x-1/2 -translate-y-1/2 bg-[length:100%_100%] [will-change:transform,opacity]" />;
}

/**
 * Derinlik geçişi — kaydırdıkça gerçek Vayra çıktılarının oluşturduğu tünelin içinden uçulur;
 * arka plan öndeki karenin rengini alır; sonda "Sıra sende" çağrısı belirir.
 */
export function Derinlik() {
  const kok = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: kok, offset: ["start start", "end end"] });
  const p = useYumusak(scrollYProgress, kok, { stiffness: 40, damping: 20, mass: 0.8 });
  const z0 = useTransform(p, [0, 0.86], [-900, DERINLIK + 200]);
  const donus = useTransform(p, [0, 1], [-8, 14]);
  const katman = useTransform(p, [0.02, 0.12], [0.1, 1]);
  const giris = useTransform(p, [0.02, 0.13], [1, 0]);
  const girisY = useTransform(p, [0, 0.13], [0, -50]);
  const girisOlcek = useTransform(p, [0, 0.13], [1, 1.12]);
  const son = useTransform(p, [0.82, 0.95], [0, 1]);
  const sonOlcek = useTransform(p, [0.82, 0.97], [0.9, 1]);
  const sonY = useTransform(p, [0.82, 0.97], [36, 0]);

  // Kaydırma hızı (0..1): ışınlar ve kareler hızla birlikte parlar.
  const hizHam = useVelocity(scrollYProgress);
  const hiz = useSpring(useTransform(hizHam, (v) => Math.min(1, Math.abs(v) * 2.2)), { stiffness: 120, damping: 24 });
  // Ortam rengi: kameraya en yakın karenin bulanık hâli arka plana yayılır.
  const [onde, setOnde] = useState(0);
  useMotionValueEvent(z0, "change", (v) => setOnde(Math.min(N - 1, Math.max(0, Math.round((v - 300) / ARALIK)))));

  return (
    <section ref={kok} className="relative h-[520vh]">
      <div className="sticky top-[var(--ust-nav)] h-[calc(100svh-var(--ust-nav))] overflow-hidden bg-[#08090b]">
        <AnimatePresence initial={false}>
          <motion.div key={onde} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4 }} className="pointer-events-none absolute inset-0">
            <OrtamIsigi src={KARELER[onde]} opaklik={0.4} className="inset-0 [--olcek:46]" />
          </motion.div>
        </AnimatePresence>
        {/* Sonda ortam ışığı camgöbeğine döner */}
        <motion.span style={{ opacity: son }} className="pointer-events-none absolute inset-0 bg-[#08090b]" />
        <motion.span style={{ opacity: son }} className="pointer-events-none absolute left-1/2 top-[42%] h-[70vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(85,214,253,0.16),transparent_65%)]" />
        <Toz p={p} />
        <Isinlar hiz={hiz} p={p} />

        <motion.div style={{ opacity: katman, rotateZ: donus }} className="absolute inset-0 [perspective:850px] [transform-style:preserve-3d]">
          {KONUM.map((k) => <Kare key={k.g} k={k} z0={z0} />)}
        </motion.div>
        {/* Kenarlara doğru yumuşak kararma (sert kenar yok) */}
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_100%_at_50%_50%,transparent_45%,rgba(8,9,11,0.85)_100%)]" />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0b0b0c] to-transparent" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0b0b0c] to-transparent" />

        <motion.div style={{ opacity: giris, y: girisY, scale: girisOlcek }} className="pointer-events-none absolute inset-x-0 top-[36%] z-20 px-4 text-center">
          <h2 className="text-[36px] font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-[72px]">Hayal gücünün <span className="hero-isilti">içine dal.</span></h2>
          <p className="mt-3 text-[15px] text-white/55 sm:text-[17px]">Kaydırdıkça Vayra&apos;da üretilen kareler arasından geç.</p>
        </motion.div>

        <motion.div style={{ opacity: son, scale: sonOlcek, y: sonY }} className="absolute inset-x-0 top-[28%] z-30 flex flex-col items-center px-4 text-center">
          <h2 className="text-[48px] font-semibold leading-[1] tracking-[-0.05em] text-white sm:text-[104px]">Sıra <span className="hero-isilti">sende.</span></h2>
          <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-white/65 sm:text-[18px]">Bir cümle yaz, ilk üretimini saniyeler içinde gör. Kart bilgisi gerekmez.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button onClick={() => scrollTo({ top: 0, behavior: "smooth" })}
              className="flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-black transition-transform hover:scale-[1.03] active:scale-[0.97]">
              <ArrowUp className="h-4 w-4" />Hemen üret
            </button>
            <Link href="/fiyatlandirma" className="group flex h-12 items-center gap-1.5 rounded-full bg-white/[0.08] px-6 text-[15px] font-medium text-white ring-1 ring-white/[0.12] backdrop-blur-md transition-colors hover:bg-white/[0.14]">
              Planları gör<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
