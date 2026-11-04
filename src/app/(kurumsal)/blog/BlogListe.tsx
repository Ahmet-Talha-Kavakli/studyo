"use client";

/**
 * /blog — "B + C" (2026-10-29): videolu öne çıkan yazı + yanında iki yazı; altta sekme/arama/RSS.
 * "Tümü"nde kategori rafları (Yeni gelenler, Rehberler, Nasıl kurduk, Şirketten); kategori ya da
 * aramada gerçek kapaklı 3 sütun ızgara. ?kategori= ve ?q= adres çubuğunda tutulur.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "framer-motion";
import { ArrowRight, ArrowUpRight, Rss, Search, X } from "lucide-react";
import { KATEGORILER, oneCikanYazi, okumaSuresi, siraliYazilar, type BlogYazi } from "@/lib/kurumsal/blog";
import { BlogKapak } from "@/components/blog/BlogKapak";
import { BultenFormu } from "@/components/blog/BlogParcalari";
import { cn } from "@/lib/utils";

const sade = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
const SAYFA = 9;
const YAZILAR = siraliYazilar();
const ONE = oneCikanYazi();
const YAN = YAZILAR.filter((y) => y.slug !== ONE.slug).slice(0, 2);
const yay = { type: "spring", stiffness: 420, damping: 34 } as const;
const RENK: Record<string, string> = { Ürün: "#55d6fd", Yaratıcılık: "#f5c26b", Şirket: "#9be6b4", Teknik: "#c7b8ff" };
const RAF: { k: BlogYazi["kategori"]; ad: string }[] = [
  { k: "Ürün", ad: "Yeni gelenler" }, { k: "Yaratıcılık", ad: "Rehberler ve fikirler" }, { k: "Teknik", ad: "Nasıl kurduk" }, { k: "Şirket", ad: "Şirketten" },
];

function Kategori({ k, acik }: { k: string; acik?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12.5px] font-medium", acik && "rounded-full bg-black/45 px-2.5 py-1 backdrop-blur-md")} style={{ color: RENK[k] }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: RENK[k] }} />{k}
    </span>
  );
}

function Yazar({ y, acik }: { y: BlogYazi; acik?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2 text-[13px]", acik ? "text-white/85" : "text-white/70")}>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.12] text-[10px] font-bold text-white">{y.yazarMono}</span>{y.yazar}
    </span>
  );
}

function Kart({ y, i }: { y: BlogYazi; i: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}>
      <Link href={`/blog/${y.slug}`} className="group block">
        <div className="aspect-[16/10] overflow-hidden rounded-[20px] ring-1 ring-white/[0.08] transition group-hover:ring-white/[0.2]"><BlogKapak y={y} /></div>
        <p className="mt-4 flex flex-wrap items-center gap-x-2.5 text-[12.5px] text-white/55">
          <Kategori k={y.kategori} /><time dateTime={y.tarih}>{y.tarihMetin}</time><span aria-hidden>·</span><span>{y.sure ?? okumaSuresi(y)}</span>
        </p>
        <h3 className="mt-2 text-[19px] font-semibold leading-snug tracking-[-0.015em] text-white transition-colors group-hover:text-[#a8ecff]">{y.baslik}</h3>
        <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-white/65">{y.ozet}</p>
        <div className="mt-3.5"><Yazar y={y} /></div>
      </Link>
    </motion.div>
  );
}

export function BlogListe() {
  const [kat, setKat] = useState<string>("Tümü");
  const [q, setQ] = useState("");
  const [sayi, setSayi] = useState(SAYFA);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const k = KATEGORILER.find((x) => sade(x) === sade(p.get("kategori") ?? ""));
    if (k) setKat(k);
    if (p.get("q")) setQ(p.get("q")!);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (kat !== "Tümü") p.set("kategori", sade(kat));
    if (q.trim()) p.set("q", q.trim());
    const s = p.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${s ? `?${s}` : ""}`);
    setSayi(SAYFA);
  }, [kat, q]);

  const filtreli = !!q.trim() || kat !== "Tümü";
  const liste = useMemo(() => {
    const t = sade(q.trim());
    return YAZILAR.filter((y) => (kat === "Tümü" || y.kategori === kat)
      && (!t || sade(`${y.baslik} ${y.ozet} ${y.yazar} ${(y.etiketler ?? []).join(" ")}`).includes(t)));
  }, [kat, q]);
  const say = (k: string) => (k === "Tümü" ? YAZILAR.length : YAZILAR.filter((y) => y.kategori === k).length);
  const ustteOlan = new Set([ONE.slug, ...YAN.map((y) => y.slug)]);
  const katSec = (k: string) => { setKat(k); document.getElementById("yazilar")?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <MotionConfig reducedMotion="user">
      {/* Öne çıkan + yanında iki yazı */}
      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <Link href={`/blog/${ONE.slug}`} className="group relative block h-[440px] overflow-hidden rounded-[26px] ring-1 ring-white/[0.08] sm:h-[500px]">
            <div className="absolute inset-0"><BlogKapak y={ONE} buyuk oynat /></div>
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,.05)_30%,rgba(8,8,10,.93)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="flex items-center gap-2"><span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-black">Öne çıkan</span><Kategori k={ONE.kategori} acik /></div>
              <h2 className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[38px]">{ONE.baslik}</h2>
              <p className="mt-2.5 line-clamp-2 max-w-xl text-[15px] leading-relaxed text-white/75">{ONE.ozet}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Yazar y={ONE} acik /><span className="text-[13px] text-white/60">{ONE.tarihMetin} · {ONE.sure ?? okumaSuresi(ONE)}</span>
                <span className="ml-auto hidden h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-black transition group-hover:bg-white/90 sm:flex">Oku<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
              </div>
            </div>
          </Link>
        </motion.div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
          {YAN.map((y, i) => (
            <motion.div key={y.slug} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }} className="min-h-[220px]">
              <Link href={`/blog/${y.slug}`} className="group relative block h-full overflow-hidden rounded-[24px] ring-1 ring-white/[0.08]">
                <div className="absolute inset-0"><BlogKapak y={y} /></div>
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0)_10%,rgba(8,8,10,.78)_52%,rgba(8,8,10,.97)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <Kategori k={y.kategori} acik />
                  <p className="mt-2 line-clamp-2 text-[18px] font-semibold leading-snug tracking-[-0.015em] text-white">{y.baslik}</p>
                  <p className="mt-1.5 text-[12.5px] text-white/60">{y.tarihMetin} · {y.sure ?? okumaSuresi(y)}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sekmeler + arama + RSS */}
      <section id="yazilar" className="mt-16 scroll-mt-24">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <LayoutGroup id="blog-kat">
            <div role="tablist" aria-label="Kategori" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:w-fit sm:rounded-full sm:bg-white/[0.04] sm:p-1 sm:ring-1 sm:ring-inset sm:ring-white/[0.07]">
              {KATEGORILER.map((k) => (
                <button key={k} role="tab" aria-selected={kat === k} onClick={() => setKat(k)}
                  className={cn("relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] transition-colors", kat === k ? "font-semibold text-black" : "text-white/70 hover:text-white")}>
                  {kat === k && <motion.span layoutId="blog-kat-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                  <span className="relative">{k}</span><span className={cn("relative text-[12px] tabular-nums", kat === k ? "text-black/55" : "text-white/45")}>{say(k)}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
          <div className="flex items-center gap-2 lg:ml-auto">
            <label className="flex h-10 flex-1 items-center gap-2 rounded-full bg-white/[0.05] px-4 ring-1 ring-inset ring-white/[0.09] transition focus-within:bg-white/[0.07] focus-within:ring-[#55d6fd]/60 lg:w-64 lg:flex-none">
              <Search className="h-4 w-4 shrink-0 text-white/55" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Yazılarda ara" aria-label="Yazılarda ara" className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/45" />
              {q && <button onClick={() => setQ("")} aria-label="Aramayı temizle" className="text-white/55 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
            </label>
            <a href="/blog/rss.xml" title="RSS" aria-label="RSS" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/70 ring-1 ring-inset ring-white/[0.09] transition hover:bg-white/[0.1] hover:text-white"><Rss className="h-4 w-4" /></a>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {!filtreli ? (
            /* Raflar */
            <motion.div key="raf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {RAF.map(({ k, ad }) => {
                const l = YAZILAR.filter((y) => y.kategori === k && !ustteOlan.has(y.slug));
                if (!l.length) return null;
                return (
                  <section key={k} className="mt-12">
                    <div className="mb-5 flex items-end justify-between gap-4">
                      <div><Kategori k={k} /><h2 className="mt-1 text-[26px] font-semibold tracking-[-0.025em] text-white">{ad}</h2></div>
                      <button onClick={() => katSec(k)} className="group flex shrink-0 items-center gap-1 text-[14px] text-white/65 transition hover:text-white">Tümü ({say(k)})<ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></button>
                    </div>
                    <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                      {l.slice(0, 3).map((y, i) => <Kart key={y.slug} y={y} i={i} />)}
                    </div>
                  </section>
                );
              })}
            </motion.div>
          ) : (
            /* Kategori ya da arama: ızgara */
            <motion.div key="izgara" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <p className="mt-6 text-[14px] text-white/65"><span className="font-semibold text-white">{liste.length}</span> yazı{kat !== "Tümü" && <> · {kat}</>}{q.trim() && <> · &ldquo;{q.trim()}&rdquo;</>}</p>
              {liste.length ? (
                <div className="mt-5 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout" initial={false}>{liste.slice(0, sayi).map((y, i) => <Kart key={y.slug} y={y} i={i} />)}</AnimatePresence>
                </div>
              ) : (
                <div className="mt-5 rounded-[22px] bg-[#111113] px-6 py-12 text-center ring-1 ring-white/[0.08]">
                  <p className="text-[16px] font-semibold text-white">Bu aramaya uyan yazı yok</p>
                  <button onClick={() => { setQ(""); setKat("Tümü"); }} className="mt-3 h-9 rounded-full bg-white/[0.08] px-4 text-[13.5px] font-medium text-white transition hover:bg-white/[0.14]">Filtreleri temizle</button>
                </div>
              )}
              {liste.length > sayi && (
                <div className="mt-10 text-center">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSayi((s) => s + SAYFA)} className="h-11 rounded-full bg-white/[0.07] px-5 text-[14px] font-medium text-white ring-1 ring-inset ring-white/[0.1] transition hover:bg-white/[0.12]">Daha fazla yazı ({liste.length - sayi})</motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="mt-20"><BultenFormu /></section>
    </MotionConfig>
  );
}
