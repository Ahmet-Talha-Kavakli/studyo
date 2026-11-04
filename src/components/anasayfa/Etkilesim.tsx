"use client";

import { useYumusak } from "./performans";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, ArrowUpRight, MousePointer2 } from "lucide-react";

const G = "/gercek/galeri";
const TURLER = [
  { t: "sinematik", ad: "Sinematik", href: "/panel/gorsel" }, { t: "portre", ad: "Portre", href: "/panel/gorsel" },
  { t: "manzara", ad: "Manzara", href: "/panel/gorsel" }, { t: "urun", ad: "Ürün çekimi", href: "/panel/pazarlama" },
  { t: "soyut", ad: "Soyut", href: "/panel/gorsel" }, { t: "3d", ad: "3D", href: "/panel/3d" },
];
const SUTUN = 11, SATIR = 6;
/** Gerçek Vayra çıktıları; türler karışık dizilir. */
const KARELER = Array.from({ length: SUTUN * SATIR }, (_, i) => { const t = TURLER[(i * 5 + Math.floor(i / SUTUN)) % TURLER.length]; return { g: `${G}/${t.t}${(i % 12) + 1}.webp`, ad: t.ad, href: t.href }; });
type KareVeri = (typeof KARELER)[number];
const KALK = 150;
const ETKI = 230;

/** Kalkış değeri her karede tek bir CSS değişkeniyle (--z) yazılır; derinlik, ölçek, parlaklık ve halka CSS'te hesaplanır. */
type Kayit = { el: HTMLDivElement; z: number; id: number };

function Kare({ k, id, secili, kayit }: { k: KareVeri; id: number; secili: boolean; kayit: (k: Kayit) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) kayit({ el: ref.current, z: 0, id }); }, [kayit, id]);
  return (
    <div ref={ref} className="etk-kare relative aspect-[4/5]">
      <Link href={k.href} tabIndex={-1} aria-label={`${k.ad} üret`} className="block h-full w-full overflow-hidden rounded-[16px] active:scale-[0.97]">
        <img src={k.g} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" />
      </Link>
      <span className="etk-halka pointer-events-none absolute inset-0 rounded-[16px] ring-2 ring-[#55d6fd]/80" />
      <motion.span initial={false} animate={secili ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={{ duration: 0.25 }}
        className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-between gap-1 rounded-full bg-black/75 py-1 pl-2.5 pr-1 text-[11.5px] font-medium text-white ring-1 ring-white/10">
        {k.ad}<span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"><ArrowUpRight className="h-3 w-3" /></span>
      </motion.span>
    </div>
  );
}

function Sira({ l, satir, yon, secili, kayit }: { l: KareVeri[]; satir: number; yon: 1 | -1; secili: number; kayit: (k: Kayit) => void }) {
  // Sıralar sürekli, yavaşça zıt yönlere akar; ekrana girerken sırayla yükselir.
  return (
    <motion.div initial={{ opacity: 0, y: 80 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10% 0px" }} transition={{ duration: 1, delay: satir * 0.08, ease: [0.22, 1, 0.36, 1] }} className="[transform-style:preserve-3d]">
      <div className={`etk-akis flex gap-4 [transform-style:preserve-3d] [will-change:transform] ${yon === 1 ? "" : "etk-akis-ters"}`}>
        {l.map((k, i) => { const id = satir * SUTUN + i; return <div key={i} className="w-[150px] shrink-0 [transform-style:preserve-3d] sm:w-[180px]"><Kare k={k} id={id} secili={secili === id} kayit={kayit} /></div>; })}
      </div>
    </motion.div>
  );
}

/**
 * Etkileşimli 3D zemin — gerçek çıktılardan bir ızgara 3D zeminde yatar; kaydırdıkça doğrulup yaklaşır,
 * fareye göre eğilir, imlecin yakınındaki kareler havaya kalkar. Dokunmatikte imleç kendiliğinden gezinir.
 */
export function Etkilesim() {
  const kok = useRef<HTMLDivElement>(null);
  const sahne = useRef<HTMLDivElement>(null);
  const kareler = useRef<Kayit[]>([]);
  const kayit = useRef((k: Kayit) => { if (!kareler.current.some((x) => x.el === k.el)) kareler.current.push(k); }).current;
  const fare = useRef({ x: -9999, y: -9999, var: false });
  const [secili, setSecili] = useState(-1);
  const seciliRef = useRef(-1);
  const isikX = useMotionValue(-999), isikY = useMotionValue(-999);

  const { scrollYProgress } = useScroll({ target: kok, offset: ["start end", "end end"] });
  const p = useYumusak(scrollYProgress, kok, { stiffness: 55, damping: 20, mass: 0.7 });
  const rotX = useTransform(p, [0.1, 0.62], [58, 8]);
  const rotZ = useTransform(p, [0.1, 0.62], [-16, 0]);
  const olcek = useTransform(p, [0.1, 0.62, 1], [0.78, 1.05, 1.22]);
  const y = useTransform(p, [0.1, 0.62], [260, 0]);
  const baslikOp = useTransform(p, [0.2, 0.36], [1, 0]);
  const baslikY = useTransform(p, [0.2, 0.36], [0, -40]);
  const sonOp = useTransform(p, [0.78, 0.92], [0, 1]);

  // Fareye göre eğim (yaylı).
  const egX = useSpring(0, { stiffness: 80, damping: 18 }), egY = useSpring(0, { stiffness: 80, damping: 18 });
  const topX = useTransform([rotX, egX] as MotionValue<number>[], ([a, b]: number[]) => a + b);

  useEffect(() => {
    let r = 0, sayac = 0; const t0 = performance.now();
    let merkez: number[][] = [];
    let sahneSol = -1, sahneUst = 0, sahneG = 0, sahneY = 0, kaydirildi = true;
    // Kaydırma bayrağı olayla tutulur: döngüde scrollY okumak her karede yerleşim hesabı yaptırıyordu.
    const kaydir = () => { kaydirildi = true; };
    addEventListener("scroll", kaydir, { passive: true });
    addEventListener("resize", kaydir);
    const kaydiMi = () => { const k = kaydirildi; kaydirildi = false; return k; };
    const dokunmatik = !matchMedia("(pointer: fine)").matches;
    const kare = () => {
      const s = sahne.current;
      const kaydiMi2 = kaydiMi();
      if (s && (kaydiMi2 || sahneSol === -1)) { const b = s.getBoundingClientRect(); sahneSol = b.left; sahneUst = b.top; sahneG = b.width; sahneY = b.height; }
      if (s && (dokunmatik || !fare.current.var)) {
        // İmleç yokken görünmez bir imleç zeminde gezinir; sahne hep canlı kalır.
        const t = (performance.now() - t0) / 1000;
        fare.current.x = sahneSol + sahneG * (0.5 + Math.sin(t * 0.55) * 0.3);
        fare.current.y = sahneUst + sahneY * (0.52 + Math.sin(t * 0.83) * 0.18);
      }
      const { x, y } = fare.current;
      // Kare merkezleri her karede değil, ~100 ms'de bir ölçülür (ölçüm yerleşim hesabı yaptırır; yay gecikmeyi gizler);
      // ölçüm, kalkan karenin kendisinden değil sabit kabından yapılır.
      sayac++;
      if (sayac % 6 === 0 || !merkez.length) merkez = kareler.current.map((k) => { const b = (k.el.parentElement ?? k.el).getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
      let enYakin = -1, enAz = 90;
      kareler.current.forEach((k, j) => {
        const [cx, cy] = merkez[j] ?? [0, 0];
        const d = Math.hypot(cx - x, cy - y);
        const hedef = d < ETKI ? KALK * (1 - d / ETKI) ** 1.6 : 0;
        // Yumuşak yaklaşma (yay yerine tek döngüde): yalnız değişen kareye yazılır.
        const yeni = k.z + (hedef - k.z) * 0.16;
        if (Math.abs(yeni - k.z) > 0.15 || (hedef === 0 && k.z !== 0 && Math.abs(yeni) < 0.3)) {
          k.z = Math.abs(yeni) < 0.3 && hedef === 0 ? 0 : yeni;
          k.el.style.setProperty("--z", k.z.toFixed(1));
        }
        if (d < enAz) { enAz = d; enYakin = k.id; }
      });
      // Etiket yalnız gerçek imleçte görünür; seçim değişince bir kez çizilir.
      const yeni = fare.current.var ? enYakin : -1;
      if (yeni !== seciliRef.current) { seciliRef.current = yeni; setSecili(yeni); }
      if (s) { isikX.set(x - sahneSol); isikY.set(y - sahneUst); }
      r = requestAnimationFrame(kare);
    };
    // Yalnız bölüm ekrandayken çalışır.
    const io = new IntersectionObserver(([e]) => { cancelAnimationFrame(r); if (e.isIntersecting) r = requestAnimationFrame(kare); });
    if (sahne.current) io.observe(sahne.current);
    return () => { io.disconnect(); cancelAnimationFrame(r); removeEventListener("scroll", kaydir); removeEventListener("resize", kaydir); };
  }, []);

  const satirlar = Array.from({ length: SATIR }, (_, i) => KARELER.slice(i * SUTUN, (i + 1) * SUTUN));

  return (
    <section ref={kok} className="relative h-[300vh]">
      <div ref={sahne}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          fare.current = { x: e.clientX, y: e.clientY, var: true };
          const b = e.currentTarget.getBoundingClientRect();
          egY.set(((e.clientX - b.left) / b.width - 0.5) * 10);
          egX.set(-((e.clientY - b.top) / b.height - 0.5) * 8);
        }}
        onPointerLeave={() => { fare.current.var = false; egX.set(0); egY.set(0); }}
        className="sticky top-[var(--ust-nav)] h-[calc(100svh-var(--ust-nav))] overflow-hidden [perspective:1400px]">
        <motion.div style={{ rotateX: topX, rotateZ: rotZ, rotateY: egY, scale: olcek, y }}
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-4 [transform-style:preserve-3d]">
          {satirlar.map((l, i) => <Sira key={i} l={l} satir={i} yon={i % 2 ? -1 : 1} secili={secili} kayit={kayit} />)}
        </motion.div>

        {/* İmleci izleyen camgöbeği ışık */}
        <motion.span style={{ x: isikX, y: isikY }} className="pointer-events-none absolute left-0 top-0 -ml-[260px] -mt-[260px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(85,214,253,0.16),transparent)] mix-blend-screen" />
        {/* Kenarlara doğru yumuşak kararma */}
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_70%_at_50%_50%,transparent_40%,#0b0b0c_100%)]" />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0b0b0c] to-transparent" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0b0b0c] to-transparent" />

        <motion.div style={{ opacity: baslikOp, y: baslikY }} className="pointer-events-none absolute inset-x-0 top-[10%] px-4 text-center">
          <h2 className="text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-[64px]">Binlerce fikir, <span className="hero-isilti">bir dokunuş uzağında.</span></h2>
          <p className="mt-3 flex items-center justify-center gap-2 text-[15px] text-white/60"><MousePointer2 className="h-4 w-4 text-[#55d6fd]" />İmleci gezdir, kaydırarak içine gir</p>
        </motion.div>

        <motion.div style={{ opacity: sonOp }} className="absolute inset-x-0 bottom-28 flex justify-center px-4">
          <Link href="/kesfet" className="group flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-black transition-transform hover:scale-[1.03] active:scale-[0.97]">
            Keşfet&apos;te gezin<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
