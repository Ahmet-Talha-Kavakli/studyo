"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, Wand2 } from "lucide-react";
import { KATALOG } from "@/lib/modelKatalogu";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { cn } from "@/lib/utils";
import { useYumusak } from "./performans";

const ease = [0.22, 1, 0.36, 1] as const;
const K = (s: string) => `/gercek/kesfet/${s}.webp`;

/** Vayra'da üretilmiş gerçek çıktılar: başlık + üreten model (yalnız hâlâ kullanılabilen modeller). */
const HAM: [string, string, string][] = [
  ["Editöryel Moda Serisi", "Vayra Ruh 2.0", "editoryel-moda-serisiruh-2-0"],
  ["Sci-Fi Robot Yürüyüşü", "Kling 3.0", "sci-fi-robot-yuruyusukling-3-0"],
  ["Gün Batımı Sahili", "Seedance 2.0", "gun-batimi-sahiliseedance-2-0"],
  ["Fantastik Orman Perisi", "Vayra Ruh Sinema", "fantastik-orman-perisiruh-sinema"],
  ["Altın Saat Portresi", "Nano Banana Pro", "altin-saat-portresinano-banana-pro"],
  ["Retro Sinemaskop Rüyası", "Vayra Ruh Sinema", "retro-sinemaskop-ruyasiruh-sinema"],
  ["Su Altı Kristal Şehri", "Seedream 5.0 Pro", "su-alti-kristal-sehriseedream-5-0-pro"],
  ["Volkanik Manzara", "Seedance 2.0", "volkanik-manzaraseedance-2-0"],
  ["Samuray Düellosu", "Kling 3.0", "samuray-duellosukling-3-0"],
  ["Aurora Gecesi", "Nano Banana Pro", "aurora-gecesinano-banana-pro"],
  ["Steampunk Atölye", "Recraft V4.1", "steampunk-atolyerecraft-v4-1"],
  ["Yağmurlu Tokyo Sokağı", "Kling 3.0 Turbo", "yagmurlu-tokyo-sokagikling-3-0-turbo"],
  ["Barok Balo Salonu", "Vayra Ruh 2.0", "barok-balo-salonuruh-2-0"],
  ["Vahşi Batı Kasabası", "Seedream 5.0 Pro", "vahsi-bati-kasabasiseedream-5-0-pro"],
  ["Işık Festivali", "Seedance 2.0", "isik-festivaliseedance-2-0"],
  ["Buz Sarayı", "Nano Banana Pro", "buz-sarayinano-banana-pro"],
  ["Robot Bahçıvan", "Kling 3.0", "robot-bahcivankling-3-0"],
  ["Mistik Dağ Manastırı", "Vayra Ruh Sinema", "mistik-dag-manastiriruh-sinema"],
  ["Karnaval Gecesi", "Kling 3.0 Turbo", "karnaval-gecesikling-3-0-turbo"],
  ["Kozmik Bahçe", "Seedream 5.0 Pro", "kozmik-bahceseedream-5-0-pro"],
  ["Rüya Kapısı", "Vayra Ruh 2.0", "ruya-kapisiruh-2-0"],
  ["Piksel Kahramanı", "Recraft V4.1", "piksel-kahramanirecraft-v4-1"],
  ["Sisli Vadi Şafağı", "Seedance 2.0", "sisli-vadi-safagiseedance-2-0"],
  ["Ejder Yuvası", "Nano Banana Pro", "ejder-yuvasinano-banana-pro"],
  ["Fütüristik Metro", "Kling 3.0", "futuristik-metrokling-3-0"],
  ["Tropik Cennet Adası", "Seedream 5.0 Pro", "tropik-cennet-adasiseedream-5-0-pro"],
  ["Kuantum Laboratuvarı", "Recraft V4.1", "kuantum-laboratuvarirecraft-v4-1"],
  ["Kutup Ekspresi", "Kling 3.0 Turbo", "kutup-ekspresikling-3-0-turbo"],
  ["Denizatı Krallığı", "Vayra Ruh Sinema", "denizati-kralligiruh-sinema"],
  ["Çöl Gülü", "Nano Banana Pro", "col-gulunano-banana-pro"],
];
type Is = { ad: string; model: string; g: string; href: string };
const ISLER: Is[] = HAM.map(([ad, model, d]) => {
  const m = KATALOG.find((x) => x.ad === model);
  const href = m ? `${m.href}${m.href.includes("?") ? "&" : "?"}prompt=${encodeURIComponent(ad)}` : "/panel/gorsel";
  return { ad, model, g: K(d), href };
});


function Baslik({ ortala, className }: { ortala?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4", ortala ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h2 className="text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-[56px]">Hepsi <span className="hero-isilti">Vayra&apos;da üretildi.</span></h2>
        <p className={cn("mt-3 max-w-[540px] text-[16px] leading-relaxed text-white/60 sm:text-[17px]", ortala && "mx-auto")}>Bir karenin üstüne gel, hangi modelle yapıldığını gör ve aynı fikirle sen de üret.</p>
      </div>
      <Link href="/kesfet" className="group inline-flex h-10 items-center gap-1.5 self-start rounded-full bg-white/[0.07] px-4 text-[14px] font-medium text-white ring-1 ring-white/[0.1] transition-colors hover:bg-white/[0.12] sm:self-auto">
        Keşfet&apos;e git<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function IsKart({ x, className }: { x: Is; className?: string }) {
  return (
    <Link href={x.href} className={cn("group relative block overflow-hidden rounded-[20px] bg-white/[0.04] ring-1 ring-white/[0.06]", className)}>
      <img src={x.g} alt={x.ad} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-[1.05]" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="block truncate text-[14px] font-semibold text-white">{x.ad}</span>
        <span className="mt-1.5 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-white/70"><ModelLogo ad={x.model} boyut={14} /><span className="truncate">{x.model}</span></span>
          <span className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-white px-2.5 text-[11.5px] font-semibold text-black"><Wand2 className="h-3 w-3" />Üret</span>
        </span>
      </span>
    </Link>
  );
}


function Sutun({ l, p, hiz }: { l: Is[]; p: MotionValue<number>; hiz: number }) {
  const y = useTransform(p, [0, 1], [hiz * 120, -hiz * 120]);
  const oran = ["aspect-[4/5]", "aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[2/3]", "aspect-[5/4]"];
  return (
    <motion.div style={{ y }} className="flex flex-col gap-3 [will-change:transform] sm:gap-4">
      {l.map((x, i) => <IsKart key={x.ad} x={x} className={oran[(i + Math.round(hiz * 3)) % oran.length]} />)}
    </motion.div>
  );
}
/**
 * "Hepsi Vayra'da üretildi" — gerçek çıktılardan paralaks sütunlu galeri.
 * Not: kullanıcı "derinlik galerisi" (3D derinlikte uçarak geçilen kareler) fikrini de beğendi; ileride başka bir yerde kullanılabilir.
 */
export function Galeri() {
  const kok = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: kok, offset: ["start end", "end start"] });
  const p = useYumusak(scrollYProgress, kok, { stiffness: 50, damping: 20, mass: 0.6 });
  const sut = useMemo(() => { const r: Is[][] = [[], [], [], [], []]; ISLER.forEach((x, i) => r[i % 5].push(x)); return r; }, []);
  const HIZ = [0.6, -0.4, 0.9, -0.2, 0.5];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-8 sm:py-28">
      <Baslik className="mb-12" />
      <div ref={kok} className="relative overflow-hidden rounded-[28px] py-6">
        <div className="grid h-[880px] grid-cols-2 gap-3 overflow-hidden sm:grid-cols-3 sm:gap-4 lg:h-[980px] lg:grid-cols-5">
          {sut.map((l, i) => <div key={i} className={cn(i >= 2 && "hidden sm:block", i >= 3 && "sm:hidden lg:block")}><Sutun l={l} p={p} hiz={HIZ[i]} /></div>)}
        </div>
        <span className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#0b0b0c] to-transparent" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/70 to-transparent" />
      </div>
    </section>
  );
}
