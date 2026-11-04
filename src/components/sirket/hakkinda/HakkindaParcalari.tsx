"use client";

/**
 * /hakkinda — "A + B" (2026-10-29): gerçek video üstünde manifesto, kurucuların imzalı mektubu,
 * kaydırdıkça dolan tarihli zaman çizelgesi (basın bültenleriyle aynı tarihler), lider kartları.
 */

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MapPin } from "lucide-react";
import { DANISMANLAR, LIDERLIK } from "@/lib/kurumsal/icerik";
import { cn } from "@/lib/utils";
import { havuzSec } from "@/lib/medyaHavuzu";
/** Telifsiz havuzdan bu sayfaya özgü hero klibi (tekrar eden seedance/hero-video yerine). */
const HAKKINDA_HERO = havuzSec("hakkinda", ["sehir", "isik"]);

const EASE = [0.22, 1, 0.36, 1] as const;
const RENK = ["#55d6fd", "#a8ecff", "#f5c26b", "#9be6b4", "#c7b8ff", "#ffb3c1", "#7fb8ff", "#e6e6e6"];

/* ── Manifesto: Vayra'da üretilmiş video üstünde tek cümle ── */
export function ManifestoBaslik() {
  return (
    <section className="relative isolate h-[560px] overflow-hidden rounded-[28px] ring-1 ring-white/[0.08] sm:h-[600px]">
      <video src={HAKKINDA_HERO.video} poster={HAKKINDA_HERO.poster} autoPlay muted loop playsInline
        className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(75%_70%_at_50%_55%,rgba(8,8,10,.4),rgba(8,8,10,.92))]" />
      <div className="flex h-full flex-col items-center justify-center px-5 text-center sm:px-10">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-[14px] font-medium text-white/75">Hakkımızda</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}
          className="mt-4 max-w-[940px] text-balance text-[40px] font-semibold leading-[1.03] tracking-[-0.045em] text-white sm:text-[68px]">
          Hayal edebildiğin her şeyi, <span className="bg-gradient-to-r from-[#55d6fd] to-[#a8ecff] bg-clip-text text-transparent">bir cümleyle</span> ekrana taşıyabilmen için.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-5 max-w-lg text-pretty text-[16px] leading-relaxed text-white/75">
          Vayra; görsel, video, ses, müzik ve 3D üretimini tek yerde toplayan yaratıcı yapay zekâ platformu.
        </motion.p>
      </div>
    </section>
  );
}

/* ── Kuruculardan mektup ── */
export function KurucuMektubu() {
  const kurucular = LIDERLIK.slice(0, 2);
  return (
    <motion.article initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: EASE }}
      className="mx-auto max-w-[780px] rounded-[28px] bg-[#111113] p-7 ring-1 ring-white/[0.08] sm:p-12">
      <p className="text-[14px] text-white/60">Kuruculardan bir not · Amsterdam, 2026</p>
      <div className="mt-6 space-y-5 text-[19px] leading-[1.65] text-white/85 [font-family:ui-serif,Georgia,'Times_New_Roman',serif] sm:text-[21px]">
        <p>İnsanlar on binlerce yıldır duvarlara, tuvallere ve filmlere hikâye çiziyor. Değişen tek şey araçlar oldu; araçlar hep pahalı, dağınık ve az kişinin elindeydi.</p>
        <p>2024&apos;te iyi bir kısa video için beş aboneliğe, üç dosya formatına ve haftalara ihtiyacımız olduğunu fark ettik. En güçlü modelleri tek arayüzde topladık, üstüne sinema, pazarlama ve 3D gibi uçtan uca stüdyolar kurduk.</p>
        <p>Bugün bir stüdyo ekibinin yaptığını tek kişi dakikalar içinde yapabiliyor. Ama işimiz bitmedi.</p>
        <p className="text-white">Hedefimiz basit: yaratıcılığın önündeki tek sınır hayal gücü olsun.</p>
      </div>
      <div className="mt-10 flex flex-wrap gap-x-14 gap-y-6">
        {kurucular.map((l, i) => (
          <div key={l.ad}>
            <motion.p initial={{ clipPath: "inset(0 100% 0 0)" }} whileInView={{ clipPath: "inset(0 0% 0 0)" }} viewport={{ once: true }} transition={{ duration: 1.1, delay: 0.3 + i * 0.4, ease: "easeInOut" }}
              className="text-[36px] leading-none text-white [font-family:'Segoe_Script','Brush_Script_MT','Snell_Roundhand',cursive]">{l.ad.split(" ")[0]}</motion.p>
            <p className="mt-3 text-[14.5px] font-semibold text-white">{l.ad}</p>
            <p className="text-[13px] text-white/65">{l.unvan}</p>
          </div>
        ))}
      </div>
    </motion.article>
  );
}

/* ── Zaman çizelgesi: kaydırdıkça dolan çizgi ── */
const KILOMETRE = [
  { t: "2024", ad: "Vayra kuruldu", alt: "Üç kıtadan bir avuç yaratıcı ve mühendis, en güçlü modelleri tek arayüzde toplamak için başladı.", g: "/gercek/galeri/sinematik2.webp" },
  { t: "Mart 2026", ad: "Profesyonel Ses Stüdyosu", alt: "40'tan fazla dilde seslendirme ve ses klonlama.", g: "/gercek/galeri/sinematik5.webp" },
  { t: "Nisan 2026", ad: "Singapur ofisi açıldı", alt: "Asya-Pasifik ekibi ve bölgesel veri merkezi.", g: "/gercek/galeri/manzara8.webp" },
  { t: "Mayıs 2026", ad: "Seri A yatırım turu", alt: "Stüdyoları ve ekibi büyütmek için.", g: "/gercek/galeri/soyut5.webp" },
  { t: "Haziran 2026", ad: "120'den fazla ülkede 10.000 yaratıcı", alt: "Topluluk her kıtaya yayıldı.", g: "/gercek/galeri/sinematik8.webp" },
  { t: "Temmuz 2026", ad: "3D Stüdyo", alt: "Metinden ve görselden gerçek 3D model.", g: "/gercek/galeri/3d6.webp" },
  { t: "Ekim 2026", ad: "Vayra Earn", alt: "Kreatörler ürettikleri içerikle kazanıyor.", g: "/gercek/galeri/portre7.webp" },
];

export function ZamanCizelgesi() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const boy = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return (
    <div ref={ref} className="relative mx-auto max-w-[920px] pl-8 sm:pl-[180px]">
      <div aria-hidden className="absolute bottom-12 left-[5px] top-2 w-px bg-white/10 sm:left-[149px]">
        <motion.div style={{ height: boy }} className="w-px bg-gradient-to-b from-[#55d6fd] to-[#a8ecff]" />
      </div>
      {KILOMETRE.map((k, i) => (
        <motion.div key={k.ad} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.55, ease: EASE }}
          className="relative pb-10 sm:pb-12">
          <span className="mb-2 block text-[14px] font-semibold text-white/80 sm:absolute sm:-left-[180px] sm:top-1.5 sm:mb-0 sm:w-[118px] sm:text-right sm:text-[15px]">{k.t}</span>
          <span aria-hidden className="absolute -left-[32px] top-1.5 h-3 w-3 rounded-full bg-[#55d6fd] ring-4 ring-[#55d6fd]/20 sm:-left-[36px] sm:top-2" />
          <div className="group flex flex-col gap-4 rounded-[22px] bg-[#111113] p-3 ring-1 ring-white/[0.08] transition-colors hover:bg-[#151517] sm:flex-row sm:gap-5">
            <div className="h-[170px] shrink-0 overflow-hidden rounded-[15px] sm:h-[116px] sm:w-[170px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={k.g} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
            </div>
            <div className="px-1 pb-1 sm:py-2.5">
              <p className="text-[19px] font-semibold tracking-[-0.02em] text-white">{k.ad}</p>
              <p className="mt-1 text-[14.5px] leading-relaxed text-white/70">{k.alt}</p>
              {i === KILOMETRE.length - 1 && <p className="mt-2.5 text-[12.5px] text-white/50">Karelerin hepsi Vayra&apos;da üretildi.</p>}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Lider kartları + danışma kurulu ── */
export function LiderKartlari() {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {LIDERLIK.map((l, i) => (
          <motion.div key={l.ad} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: (i % 4) * 0.05, ease: EASE }}
            className="group flex flex-col rounded-[22px] bg-[#111113] p-5 ring-1 ring-white/[0.08] transition-colors hover:bg-[#151517]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full text-[15px] font-bold text-[#0b0b0d] transition-transform duration-300 group-hover:scale-105" style={{ background: RENK[i % RENK.length] }}>{l.mono}</span>
            <p className="mt-4 text-[15.5px] font-semibold text-white">{l.ad}</p>
            <p className="text-[13.5px] text-white/70">{l.unvan}</p>
            <p className={cn("mt-2 hidden text-[13px] leading-snug text-white/60 sm:block")}>{l.gecmis.replace("Önceki: ", "")}</p>
            <p className="mt-auto flex items-center gap-1 pt-4 text-[12.5px] text-white/55"><MapPin className="h-3 w-3" />{l.konum}</p>
          </motion.div>
        ))}
      </div>
      <p className="mt-5 text-[14px] leading-relaxed text-white/65"><span className="font-medium text-white">Danışma kurulu:</span> {DANISMANLAR.map((d) => `${d.ad} (${d.unvan.replace("Danışman · ", "")})`).join(" · ")}</p>
    </div>
  );
}
