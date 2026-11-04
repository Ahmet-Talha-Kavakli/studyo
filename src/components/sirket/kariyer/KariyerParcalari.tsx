"use client";

/**
 * /kariyer — "A · Sinema + rol tarayıcı" (2026-10-29): sırayla oynayan gerçek videolu başlık + sayılar,
 * değer/hak ızgarası, solda filtreli ekip başlıklı rol tarayıcı, süreç şeridi, SSS.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Clock, Laptop, MapPin, Search, Sparkles, Wallet, X } from "lucide-react";
import { POZISYONLAR, type Pozisyon } from "@/lib/kurumsal/pozisyonlar";
import { DEGERLER } from "@/lib/kurumsal/icerik";
import { BASVURU_SURECI, KARIYER_SSS } from "@/lib/kurumsal/detay";
import { cn } from "@/lib/utils";

const yay = { type: "spring", stiffness: 420, damping: 34 } as const;

/* ── Sinema başlığı: ekibin stüdyolarından gerçek videolar sırayla oynar ── */
const VIDEOLAR = [
  { src: "/gercek/hero-video/hero-video.mp4", poster: "/gercek/hero-video/hero-video-poster.webp", ad: "Video stüdyosu" },
  { src: "/gercek/hero-video/hero-3d.mp4", poster: "/gercek/hero-video/hero-3d-poster.webp", ad: "3D stüdyosu" },
  { src: "/gercek/preset-video/fairytale-castle.mp4", poster: "/gercek/preset-video/fairytale-castle.webp", ad: "Presetler" },
  { src: "/gercek/preset-video/sketch-to-fabric.mp4", poster: "/gercek/preset-video/sketch-to-fabric.webp", ad: "Görselden videoya" },
];
const SURE = 7000;

export function SinemaBaslik() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setTimeout(() => setI((x) => (x + 1) % VIDEOLAR.length), SURE); return () => clearTimeout(t); }, [i]);
  return (
    <section className="relative isolate h-[640px] overflow-hidden rounded-[28px] ring-1 ring-white/[0.08] sm:h-[600px]">
      <AnimatePresence initial={false}>
        <motion.video key={VIDEOLAR[i].src} src={VIDEOLAR[i].src} poster={VIDEOLAR[i].poster} autoPlay muted loop playsInline
          initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.9 }, scale: { duration: SURE / 1000, ease: "linear" } }}
          className="absolute inset-0 -z-10 h-full w-full object-cover" />
      </AnimatePresence>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,8,10,.25)_0%,rgba(8,8,10,.15)_35%,rgba(8,8,10,.94)_100%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,8,10,.55)_0%,transparent_60%)]" />

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="absolute right-4 top-4 grid grid-cols-3 overflow-hidden rounded-[18px] bg-black/35 ring-1 ring-inset ring-white/15 backdrop-blur-xl sm:right-6 sm:top-6">
        {[["30+", "kişi"], ["18", "ülke"], ["5", "ofis"]].map(([a, b], k) => (
          <div key={b} className={cn("px-4 py-3 text-center sm:px-5", k > 0 && "border-l border-white/10")}>
            <p className="text-[20px] font-semibold leading-none tracking-[-0.03em] text-white sm:text-[22px]">{a}</p>
            <p className="mt-1 text-[12px] text-white/75">{b}</p>
          </div>
        ))}
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 flex min-w-0 flex-col gap-7 p-5 sm:p-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[760px] text-balance text-[38px] font-semibold leading-[1.03] tracking-[-0.045em] text-white sm:text-[64px]">
            Hayal edilen her şeyi <span className="bg-gradient-to-r from-[#55d6fd] to-[#a8ecff] bg-clip-text text-transparent">ekrana taşıyoruz.</span> Gel birlikte kuralım.
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 flex flex-wrap items-center gap-2.5 sm:mt-7">
            <a href="#roller" className="group flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]">
              {POZISYONLAR.length} açık rolü gör<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link href="/hakkinda" className="flex h-11 items-center rounded-full bg-white/[0.12] px-5 text-[14.5px] font-medium text-white ring-1 ring-inset ring-white/20 backdrop-blur-md transition hover:bg-white/[0.2]">Şirketi tanı</Link>
          </motion.div>
        </div>
        {/* Video sekmeleri: istediğin çıktıya geç; ilerleme çubuğu sıradakini gösterir */}
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {VIDEOLAR.map((v, k) => (
            <button key={v.src} onClick={() => setI(k)} aria-label={v.ad} aria-pressed={k === i}
              className={cn("relative w-[112px] shrink-0 overflow-hidden rounded-[14px] p-1 text-left ring-1 ring-inset backdrop-blur-md transition-colors", k === i ? "bg-white/[0.16] ring-white/30" : "bg-black/30 ring-white/10 hover:bg-white/[0.1]")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.poster} alt="" className="aspect-video w-full rounded-[10px] object-cover" />
              <p className={cn("mt-1 truncate px-1 text-[12px]", k === i ? "font-medium text-white" : "text-white/70")}>{v.ad}</p>
              <span className="mx-1 mb-0.5 mt-1 block h-[2px] overflow-hidden rounded-full bg-white/15">
                {k === i && <motion.span key={i} initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: SURE / 1000, ease: "linear" }} className="block h-full bg-white" />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const HAKLAR = [
  { ikon: Laptop, ad: "Uzaktan öncelikli", ozet: "Nereden çalışacağını sen seç; 5 şehirdeki ofisler her zaman açık." },
  { ikon: Wallet, ad: "Şeffaf maaş ve hisse", ozet: "Her ilanda maaş aralığı yazar; tüm tam zamanlılara hisse opsiyonu." },
  { ikon: Clock, ad: "30 gün izin", ozet: "Resmi tatillere ek 30 gün, 16 hafta ebeveyn izni, doğum gününde izin." },
  { ikon: Sparkles, ad: "Sınırsız Vayra", ozet: "Tüm stüdyolar ve modeller sınırsız; €1.500 yıllık öğrenme bütçesi." },
];

/* Kesin rakamlı haklar şeridi + değerler ızgarası */
export function DegerIzgarasi() {
  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 overflow-hidden rounded-[22px] bg-white/[0.08] ring-1 ring-white/[0.08] lg:grid-cols-4" style={{ gap: 1 }}>
        {[["30 gün", "yıllık izin, resmî tatillere ek"], ["16 hafta", "ebeveyn izni"], ["€1.500", "yıllık öğrenme bütçesi"], ["Sınırsız", "tüm stüdyolar ve modeller"]].map(([a, b], i) => (
          <motion.div key={a} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.05 }} className="bg-[#111113] p-5 sm:p-6">
            <p className="text-[28px] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[36px]">{a}</p>
            <p className="mt-2 text-[13.5px] text-white/65">{b}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 grid overflow-hidden rounded-[22px] bg-white/[0.08] ring-1 ring-white/[0.08] sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 1 }}>
        {[...DEGERLER.slice(0, 4).map(({ ikon, ad, ozet }) => ({ ikon, ad, ozet })), ...HAKLAR].map((d, i) => (
          <div key={d.ad} className="group bg-[#111113] transition-colors hover:bg-[#151517]">
            <motion.div initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: (i % 4) * 0.04 }} className="h-full p-5 sm:p-6">
              <d.ikon className="h-5 w-5 text-[#55d6fd] transition-transform duration-300 group-hover:-translate-y-0.5" />
              <p className="mt-5 text-[15.5px] font-semibold text-white">{d.ad}</p>
              <p className="mt-1 text-[13.5px] leading-snug text-white/65">{d.ozet}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Rol tarayıcı: solda arama, çalışma şekli ve sayılı ekip filtresi; sağda ekip başlıklı liste ── */
const EKIPLER = Array.from(new Set(POZISYONLAR.map((p) => p.ekip)));
const SEKILLER = ["Tümü", "Uzaktan", "Hibrit"] as const;
const sade = (s: string) => s.toLocaleLowerCase("tr-TR");
const sekilUyar = (p: Pozisyon, s: string) => s === "Tümü" || p.yer.includes(s);

export function RolTarayici() {
  const [ekip, setEkip] = useState("Tümü");
  const [sekil, setSekil] = useState<(typeof SEKILLER)[number]>("Tümü");
  const [q, setQ] = useState("");
  const liste = useMemo(() => {
    const t = sade(q.trim());
    return POZISYONLAR.filter((p) => (ekip === "Tümü" || p.ekip === ekip) && sekilUyar(p, sekil) && (!t || sade(`${p.ad} ${p.ekip} ${p.yer} ${p.ozet}`).includes(t)));
  }, [ekip, sekil, q]);
  const say = (e: string) => POZISYONLAR.filter((p) => (e === "Tümü" || p.ekip === e) && sekilUyar(p, sekil)).length;
  const gruplar = EKIPLER.filter((e) => liste.some((p) => p.ekip === e));
  const filtreli = !!q || ekip !== "Tümü" || sekil !== "Tümü";
  const temizle = () => { setQ(""); setEkip("Tümü"); setSekil("Tümü"); };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <label className="flex h-11 items-center gap-2 rounded-full bg-white/[0.05] px-4 ring-1 ring-inset ring-white/[0.09] transition focus-within:bg-white/[0.07] focus-within:ring-[#55d6fd]/60">
          <Search className="h-4 w-4 shrink-0 text-white/55" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rol, ekip ya da şehir" aria-label="Rol ara" className="min-w-0 flex-1 bg-transparent text-[14.5px] text-white outline-none placeholder:text-white/45" />
          {q && <button onClick={() => setQ("")} aria-label="Aramayı temizle" className="text-white/55 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
        </label>

        <LayoutGroup id="kariyer-sekil">
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
            {SEKILLER.map((s) => (
              <button key={s} onClick={() => setSekil(s)} aria-pressed={sekil === s} className={cn("relative h-8 rounded-full text-[13px] transition-colors", sekil === s ? "font-semibold text-black" : "text-white/70 hover:text-white")}>
                {sekil === s && <motion.span layoutId="kariyer-sekil-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
                <span className="relative">{s}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>

        <p className="mb-1.5 mt-6 hidden px-3.5 text-[13px] text-white/50 lg:block">Ekipler</p>
        <LayoutGroup id="kariyer-ekip">
          <div role="tablist" aria-label="Ekip" className="-mx-4 mt-3 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:mt-0 lg:block lg:space-y-0.5 lg:overflow-visible lg:px-0">
            {["Tümü", ...EKIPLER].map((e) => {
              const n = say(e), a = ekip === e;
              return (
                <button key={e} role="tab" aria-selected={a} onClick={() => setEkip(e)} disabled={!n && !a}
                  className={cn("relative flex h-9 shrink-0 items-center justify-between gap-3 rounded-full px-3.5 text-[14px] transition-colors lg:w-full",
                    a ? "font-semibold text-black" : "text-white/80 hover:bg-white/[0.05] hover:text-white", !n && !a && "opacity-35")}>
                  {a && <motion.span layoutId="kariyer-ekip-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
                  <span className="relative whitespace-nowrap">{e === "Tümü" ? "Tüm ekipler" : e}</span>
                  <span className={cn("relative text-[12.5px] tabular-nums", a ? "text-black/55" : "text-white/45")}>{n}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <div className="min-w-0">
        <div className="mb-4 flex min-h-[20px] items-center justify-between text-[13.5px]">
          <p className="text-white/65"><span className="font-semibold text-white">{liste.length}</span> açık rol{ekip !== "Tümü" && <> · {ekip}</>}{sekil !== "Tümü" && <> · {sekil}</>}</p>
          {filtreli && <button onClick={temizle} className="text-white/65 transition hover:text-white">Filtreleri temizle</button>}
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          {gruplar.map((g) => {
            const roller = liste.filter((p) => p.ekip === g);
            return (
              <motion.section key={g} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }} className="mb-7">
                <p className="mb-2.5 flex items-center gap-2 px-1 text-[16px] font-semibold tracking-[-0.01em] text-white">
                  {g}<span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[12px] font-medium text-white/75">{roller.length}</span>
                </p>
                <div className="divide-y divide-white/[0.07] overflow-hidden rounded-[20px] bg-[#111113] ring-1 ring-white/[0.08]">
                  {roller.map((p) => <RolSatiri key={p.slug} p={p} />)}
                </div>
              </motion.section>
            );
          })}
        </AnimatePresence>
        {!liste.length && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-7 rounded-[20px] bg-[#111113] px-5 py-10 text-center ring-1 ring-white/[0.08]">
            <p className="text-[15.5px] font-medium text-white">Bu aramaya uyan açık rol yok</p>
            <button onClick={temizle} className="mt-3 h-9 rounded-full bg-white/[0.08] px-4 text-[13.5px] font-medium text-white transition hover:bg-white/[0.14]">Filtreleri temizle</button>
          </motion.div>
        )}
        <Link href="/kariyer/genel" className="group flex items-center gap-4 rounded-[20px] bg-[#55d6fd]/[0.07] px-5 py-4 ring-1 ring-inset ring-[#55d6fd]/20 transition-colors hover:bg-[#55d6fd]/[0.11]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#55d6fd] text-[#04212b]"><Sparkles className="h-[18px] w-[18px]" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-white">Aradığın rol yok mu?</span>
            <span className="block text-[13.5px] text-white/70">Genel başvuru yap; uygun rol açılınca ilk sana yazalım.</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#55d6fd] transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function RolSatiri({ p }: { p: Pozisyon }) {
  const yeni = Date.now() - new Date(p.tarih).getTime() < 21 * 864e5;
  const [sehir, sekil] = p.yer.split(" · ");
  return (
    <motion.div>
      <Link href={`/kariyer/${p.slug}`} className="group flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 transition-colors hover:bg-white/[0.035] sm:flex-nowrap">
        <span className="min-w-0 flex-1 basis-full sm:basis-auto">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15.5px] font-medium text-white">{p.ad}</span>
            {yeni && <span className="shrink-0 rounded-full bg-[#55d6fd]/[0.14] px-2 py-0.5 text-[11.5px] font-medium text-[#a8ecff]">Yeni</span>}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[12.5px] text-white/80"><MapPin className="h-3 w-3" />{sehir}</span>
            {sekil && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[12.5px] text-white/80">{sekil}</span>}
            <span className="text-[12.5px] text-white/55">{p.tur}</span>
          </span>
        </span>
        <span className="text-[14px] tabular-nums text-white/85">{p.maas}</span>
        <span className="ml-auto flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-medium text-white/75 ring-1 ring-inset ring-white/[0.12] transition-all duration-200 group-hover:bg-white group-hover:text-black group-hover:ring-white sm:ml-0">
          Başvur<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </motion.div>
  );
}

export function SurecSeridi() {
  return (
    <ol className="mt-6 grid overflow-hidden rounded-[22px] bg-white/[0.08] ring-1 ring-white/[0.08] sm:grid-cols-5" style={{ gap: 1 }}>
      {BASVURU_SURECI.map((a, i) => (
        <li key={a.no} className="bg-[#111113]">
          <motion.div initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex h-full flex-col p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#55d6fd] text-[13px] font-semibold text-[#04212b]">{a.no}</span>
            <p className="mt-4 text-[15.5px] font-semibold text-white">{a.ad}</p>
            <p className="mt-1 flex-1 text-[13.5px] leading-snug text-white/65">{a.aciklama}</p>
            <p className="mt-4 flex w-fit items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[12.5px] text-white/80"><Clock className="h-3 w-3" />{a.sure}</p>
          </motion.div>
        </li>
      ))}
    </ol>
  );
}

export function KariyerSss() {
  const [acik, setAcik] = useState<number | null>(0);
  return (
    <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
      {KARIYER_SSS.map((s, i) => (
        <div key={s.s}>
          <button onClick={() => setAcik(acik === i ? null : i)} aria-expanded={acik === i} className="group flex w-full items-center gap-4 py-4 text-left">
            <span className="flex-1 text-[15.5px] font-medium text-white">{s.s}</span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/55 transition-transform duration-200 group-hover:text-white", acik === i && "rotate-180 text-[#55d6fd]")} />
          </button>
          <AnimatePresence initial={false}>
            {acik === i && (
              <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden pb-4 pr-8 text-[14.5px] leading-relaxed text-white/70">{s.c}</motion.p>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
