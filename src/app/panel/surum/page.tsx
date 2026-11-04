"use client";

/**
 * /panel/surum — "C · Vitrin + günlük" (2026-10-29).
 *  Vitrin: son 3 özellik sürümü videolu tam genişlik kartta sırayla döner (posterli sekmeler + ilerleme çubuğu)
 *  Günlük: yapışkan filtre çubuğu (tür sayılı kayan seçim, alan çipleri, arama) + sürüm başına gruplanmış satırlar
 *  Korunanlar: / ve Ctrl+K arama, "son ziyaretten beri yeni" işareti, abonelik + RSS, #v… çapaları, sürüm sayfası bağlantısı.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "framer-motion";
import { ArrowRight, ArrowUpRight, Bell, Link2, Rss, Search, X } from "lucide-react";
import { SURUMLER, alanAdi, surumCapasi, surumTuru, tarihMetni, type Alan, type DegisiklikTur, type Surum } from "@/lib/surumler";
import { TUR } from "@/components/surum/SurumGirisi";
import { BultenFormu } from "@/components/blog/BlogParcalari";
import { Yuzen } from "@/components/ui/Yuzen";
import { kesfetFont } from "@/components/kesfet/font";
import { kopyala } from "@/lib/gercekEylem";
import { cn } from "@/lib/utils";

const SON_GORULEN = "vayra-surum-son";
const ALANLAR = Array.from(new Set(SURUMLER.flatMap((s) => s.alanlar))) as Alan[];
const sade = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
const RSS = "/panel/surum/rss.xml";
const yay = { type: "spring", stiffness: 420, damping: 34 } as const;
const EASE = [0.22, 1, 0.36, 1] as const;
const SAYFA = 4;

/* Vitrinde gerçek video olan sürümler; olmayan sürüm kapak ya da ilk kareyle gösterilir. */
const VIDEO: Record<string, string> = {
  "3.11.0": "/gercek/hero-video/seedance-banner.mp4", "3.9.0": "/gercek/preset-video/fairytale-castle.mp4", "3.8.0": "/gercek/preset-video/earth-zoom.mp4",
};
const kapak = (s: Surum) => s.kapak ?? s.kareler?.[0];
const VITRIN = SURUMLER.filter((s) => s.no.split(".")[2] === "0").slice(0, 3);
const VITRIN_SURE = 8000;

function yeniSayisiBul(son: string | null) {
  if (!son) return 0;
  if (/^\d{4}-\d{2}-\d{2}$/.test(son)) return SURUMLER.filter((s) => s.tarih > son).length;
  const i = SURUMLER.findIndex((s) => s.no === son);
  return i < 0 ? 0 : i;
}

/* ── Vitrin ── */
function Vitrin() {
  const [i, setI] = useState(0);
  const [durdu, setDurdu] = useState(false);
  useEffect(() => {
    if (durdu) return;
    const t = setTimeout(() => setI((x) => (x + 1) % VITRIN.length), VITRIN_SURE);
    return () => clearTimeout(t);
  }, [i, durdu]);
  const s = VITRIN[i];
  const dene = s.degisiklikler.find((d) => d.href)?.href;
  const yeniSay = s.degisiklikler.filter((d) => d.tur === "yeni").length;
  return (
    <section className="relative isolate h-[560px] overflow-hidden rounded-[28px] ring-1 ring-white/[0.08] sm:h-[520px]">
      <AnimatePresence initial={false}>
        <motion.div key={s.no} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.8 }, scale: { duration: VITRIN_SURE / 1000, ease: "linear" } }} className="absolute inset-0 -z-10">
          {VIDEO[s.no]
            ? <video src={VIDEO[s.no]} poster={kapak(s)} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={kapak(s)} alt="" className="h-full w-full object-cover" />}
        </motion.div>
      </AnimatePresence>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,8,10,.95)_0%,rgba(8,8,10,.62)_50%,rgba(8,8,10,.12)_100%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent_55%,rgba(8,8,10,.85)_100%)]" />

      <div className="flex h-full flex-col justify-between p-6 sm:p-10">
        <AnimatePresence mode="wait">
          <motion.div key={s.no} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: EASE }} className="max-w-[620px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#55d6fd] px-2.5 py-1 text-[12px] font-semibold text-[#04212b]">{i === 0 ? "En yeni" : surumTuru(s.no)}</span>
              <span className="rounded-full bg-black/45 px-2.5 py-1 text-[12.5px] text-white/85 ring-1 ring-inset ring-white/15 backdrop-blur-md">Sürüm {s.no} · {tarihMetni(s.tarih)}</span>
            </div>
            <h2 className="mt-4 text-balance text-[36px] font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-[52px]">{s.baslik}</h2>
            <p className="mt-3 line-clamp-3 text-[15.5px] leading-relaxed text-white/75">{s.ozet}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {dene && <Link href={dene} className="group flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition hover:bg-white/90">Hemen dene<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>}
              <a href={`#${surumCapasi(s.no)}`} className="flex h-11 items-center rounded-full bg-white/[0.12] px-5 text-[14.5px] font-medium text-white ring-1 ring-inset ring-white/20 backdrop-blur-md transition hover:bg-white/[0.2]">{yeniSay ? `${yeniSay} yenilik` : "Değişiklikler"}</a>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="-mx-6 flex gap-1.5 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:justify-end sm:px-0">
          {VITRIN.map((v, k) => (
            <button key={v.no} onClick={() => { setI(k); setDurdu(true); }} aria-pressed={k === i}
              className={cn("w-[150px] shrink-0 overflow-hidden rounded-[14px] p-1 text-left ring-1 ring-inset backdrop-blur-md transition-colors", k === i ? "bg-white/[0.16] ring-white/30" : "bg-black/35 ring-white/10 hover:bg-white/[0.1]")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={kapak(v)} alt="" className="aspect-video w-full rounded-[10px] object-cover" />
              <p className={cn("mt-1 truncate px-1 text-[12px]", k === i ? "font-medium text-white" : "text-white/70")}>{v.baslik}</p>
              <span className="mx-1 mb-0.5 mt-1 block h-[2px] overflow-hidden rounded-full bg-white/15">
                {k === i && <motion.span key={`${i}-${durdu}`} initial={{ width: durdu ? "100%" : 0 }} animate={{ width: "100%" }} transition={{ duration: durdu ? 0 : VITRIN_SURE / 1000, ease: "linear" }} className="block h-full bg-white" />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function SurumNotlari() {
  const [tur, setTur] = useState<DegisiklikTur | null>(null);
  const [alan, setAlan] = useState<Alan | null>(null);
  const [q, setQ] = useState("");
  const [goster, setGoster] = useState(SAYFA);
  const [yeniSayisi, setYeniSayisi] = useState(0);
  const [aboneAcik, setAboneAcik] = useState(false);
  const aramaRef = useRef<HTMLInputElement>(null);

  const okundu = useRef(false);
  useEffect(() => {
    if (okundu.current) return;
    okundu.current = true;
    try { setYeniSayisi(yeniSayisiBul(localStorage.getItem(SON_GORULEN))); localStorage.setItem(SON_GORULEN, SURUMLER[0].no); } catch { /* */ }
  }, []);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement;
      const yaziyor = /INPUT|TEXTAREA/.test(h.tagName) || h.isContentEditable;
      if ((e.key === "/" && !yaziyor) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && document.activeElement !== aramaRef.current && !yaziyor)) {
        e.preventDefault(); e.stopPropagation(); aramaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", f, true);
    return () => window.removeEventListener("keydown", f, true);
  }, []);

  const liste = useMemo(() => {
    const t = sade(q.trim());
    return SURUMLER.map((s) => ({
      ...s,
      degisiklikler: s.degisiklikler.filter((d) => (!tur || d.tur === tur) && (!t || sade(`${d.metin} ${s.baslik} ${s.no}`).includes(t))),
    })).filter((s) => (!alan || s.alanlar.includes(alan)) && s.degisiklikler.length);
  }, [tur, alan, q]);
  const filtreli = !!tur || !!alan || !!q.trim();
  const gorunen = filtreli ? liste : liste.slice(0, goster);
  const eslesen = liste.reduce((a, s) => a + s.degisiklikler.length, 0);
  const turSayi = (t: DegisiklikTur | null) => SURUMLER.filter((s) => !alan || s.alanlar.includes(alan)).reduce((a, s) => a + s.degisiklikler.filter((d) => !t || d.tur === t).length, 0);
  const sonOtuz = SURUMLER.filter((s) => Date.now() - new Date(s.tarih + "T12:00:00").getTime() < 30 * 86_400_000);
  const temizle = () => { setTur(null); setAlan(null); setQ(""); };

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("kesfet-tema min-h-screen bg-zemin pb-28", kesfetFont.variable)}>
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
          {/* Başlık */}
          <header className="flex flex-col gap-5 pb-8 pt-10 sm:pt-14 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[38px] font-semibold leading-[1.03] tracking-[-0.04em] text-white sm:text-[52px]">Sürüm <span className="bg-gradient-to-r from-[#55d6fd] to-[#a8ecff] bg-clip-text text-transparent">notları</span></h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[14px] text-white/65">
                <span>Son 30 günde <b className="font-semibold text-white">{sonOtuz.length}</b> sürüm · <b className="font-semibold text-white">{sonOtuz.reduce((a, s) => a + s.degisiklikler.length, 0)}</b> değişiklik</span>
                {yeniSayisi > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#55d6fd]/15 px-2.5 py-0.5 text-[12.5px] font-medium text-[#a8ecff]"><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Son ziyaretinden beri {yeniSayisi} yeni sürüm</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setAboneAcik((v) => !v)} aria-expanded={aboneAcik} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-black transition hover:bg-white/90">
                  <Bell className="h-4 w-4" />Abone ol
                </motion.button>
                <Yuzen acik={aboneAcik} onKapat={() => setAboneAcik(false)} alt="tam" sag={0} bosluk={8} etiket="Abone ol" className="w-[360px] max-w-[calc(100vw-32px)] rounded-[22px] bg-[#151517] p-4 ring-1 ring-white/[0.1]">
                  <BultenFormu kompakt />
                  <div className="mt-3 flex items-center gap-2 border-t border-white/[0.07] pt-3">
                    <a href={RSS} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-orange-400/12 px-3 text-[12.5px] font-medium text-orange-200 hover:bg-orange-400/20"><Rss className="h-3.5 w-3.5" />RSS akışı</a>
                    <button onClick={() => void kopyala(`${window.location.origin}${RSS}`, "RSS adresi kopyalandı")} className="h-8 rounded-full px-3 text-[12.5px] text-white/65 hover:bg-white/[0.05] hover:text-white">Adresi kopyala</button>
                  </div>
                </Yuzen>
              </div>
              <a href={RSS} target="_blank" rel="noreferrer" aria-label="RSS akışı" title="RSS akışı" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/70 ring-1 ring-inset ring-white/[0.1] transition hover:text-white"><Rss className="h-4 w-4" /></a>
            </div>
          </header>

          <Vitrin />

          {/* Günlük */}
          <section className="mt-16">
            <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-white">Tüm değişiklikler</h2>
            <div className="sticky top-[var(--ust-nav)] z-20 -mx-4 mt-4 bg-zemin/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
              <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
                <LayoutGroup id="surum-tur">
                  <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
                  <div className="flex w-max gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
                    {([null, "yeni", "gelistirme", "duzeltme"] as (DegisiklikTur | null)[]).map((t) => {
                      const sec = tur === t; const I = t ? TUR[t].ikon : null;
                      return (
                        <button key={t ?? "tumu"} onClick={() => setTur(t)} aria-pressed={sec} className={cn("relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13.5px] transition-colors", sec ? "font-semibold text-black" : "text-white/70 hover:text-white")}>
                          {sec && <motion.span layoutId="surum-tur-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                          {I && <I className="relative h-3.5 w-3.5" />}<span className="relative">{t ? TUR[t].cogul : "Tümü"}</span>
                          <span className={cn("relative text-[12px] tabular-nums", sec ? "text-black/55" : "text-white/45")}>{turSayi(t)}</span>
                        </button>
                      );
                    })}
                  </div>
                  </div>
                </LayoutGroup>
                <div className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
                  {ALANLAR.map((a) => (
                    <button key={a} onClick={() => setAlan(alan === a ? null : a)} aria-pressed={alan === a}
                      className={cn("h-8 shrink-0 rounded-full px-3 text-[13px] transition", alan === a ? "bg-[#55d6fd]/15 font-medium text-[#a8ecff] ring-1 ring-inset ring-[#55d6fd]/40" : "text-white/65 ring-1 ring-inset ring-white/[0.08] hover:text-white")}>{alanAdi(a)}</button>
                  ))}
                </div>
                <label className="flex h-9 min-w-0 items-center gap-2 rounded-full bg-white/[0.05] px-3.5 ring-1 ring-inset ring-white/[0.09] transition focus-within:ring-[#55d6fd]/60 lg:ml-auto lg:w-[240px]">
                  <Search className="h-4 w-4 shrink-0 text-white/55" />
                  <input ref={aramaRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { setQ(""); aramaRef.current?.blur(); } }}
                    placeholder="Değişikliklerde ara" aria-label="Değişikliklerde ara" className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/45" />
                  {q ? <button onClick={() => setQ("")} aria-label="Aramayı temizle" className="text-white/55 hover:text-white"><X className="h-3.5 w-3.5" /></button> : <kbd className="hidden sm:inline-flex">/</kbd>}
                </label>
              </div>
            </div>

            {filtreli && (
              <p className="mt-4 text-[13.5px] text-white/65"><b className="font-semibold text-white">{eslesen}</b> değişiklik · {liste.length} sürüm<button onClick={temizle} className="ml-3 font-medium text-[#55d6fd] hover:underline">Filtreleri temizle</button></p>
            )}

            <div className="mt-5 space-y-4">
              <AnimatePresence initial={false} mode="popLayout">
                {gorunen.map((s) => {
                  const yeni = yeniSayisi > 0 && SURUMLER.findIndex((x) => x.no === s.no) < yeniSayisi;
                  const ozellik = s.no.split(".")[2] === "0";
                  return (
                    <motion.article key={s.no} id={surumCapasi(s.no)} data-no={s.no} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}
                      className={cn("scroll-mt-40 overflow-hidden rounded-[22px] bg-[#111113] ring-1", yeni ? "ring-[#55d6fd]/40" : "ring-white/[0.08]")}>
                      {/* Sürüm başlığı */}
                      <div className="group flex items-center gap-4 border-b border-white/[0.07] p-3 pr-5">
                        <div className="h-[64px] w-[104px] shrink-0 overflow-hidden rounded-[12px] bg-white/[0.04]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {kapak(s) && <img src={kapak(s)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-white/55">
                            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 tabular-nums text-white/85">{s.no}</span>
                            <span>{tarihMetni(s.tarih)}</span>
                            <span className={ozellik ? "text-[#a8ecff]" : ""}>{surumTuru(s.no)}</span>
                            {yeni && <span className="rounded-full bg-[#55d6fd]/15 px-2 py-0.5 font-medium text-[#a8ecff]">Yeni</span>}
                          </div>
                          <Link href={`/panel/surum/${s.no}`} className="mt-1 block truncate text-[18px] font-semibold tracking-[-0.015em] text-white hover:underline">{s.baslik}</Link>
                        </div>
                        <button onClick={() => void kopyala(`${window.location.origin}/panel/surum#${surumCapasi(s.no)}`, "Sürüm bağlantısı kopyalandı")} aria-label="Bağlantıyı kopyala" title="Bağlantıyı kopyala"
                          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.07] hover:text-white sm:flex"><Link2 className="h-4 w-4" /></button>
                        <Link href={`/panel/surum/${s.no}`} aria-label="Sürüm sayfası" className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.07] hover:text-white sm:flex"><ArrowUpRight className="h-4 w-4" /></Link>
                      </div>
                      {/* Değişiklik satırları */}
                      <ul className="divide-y divide-white/[0.05]">
                        {s.degisiklikler.map((d) => {
                          const T = TUR[d.tur];
                          return (
                            <li key={d.metin} className="grid grid-cols-1 gap-2 px-5 py-3.5 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-4">
                              <span className={cn("inline-flex h-6 w-fit items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium", T.renk)}><T.ikon className="h-3 w-3" />{T.ad}</span>
                              <span className="text-[14.5px] leading-relaxed text-white/85">
                                {d.metin}
                                {d.href && <Link href={d.href} className="group/d ml-2 inline-flex items-center gap-0.5 whitespace-nowrap text-[13.5px] font-medium text-[#55d6fd] hover:underline">Dene<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/d:translate-x-0.5" /></Link>}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
              {!gorunen.length && (
                <div className="rounded-[22px] bg-[#111113] px-6 py-14 text-center ring-1 ring-white/[0.08]">
                  <p className="text-[16px] font-semibold text-white">Eşleşen değişiklik yok</p>
                  <button onClick={temizle} className="mt-3 h-9 rounded-full bg-white/[0.08] px-4 text-[13.5px] font-medium text-white transition hover:bg-white/[0.14]">Filtreleri temizle</button>
                </div>
              )}
            </div>
            {!filtreli && liste.length > goster && (
              <div className="mt-8 text-center">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setGoster((g) => g + SAYFA)} className="h-11 rounded-full bg-white/[0.07] px-5 text-[14px] font-medium text-white ring-1 ring-inset ring-white/[0.1] transition hover:bg-white/[0.12]">
                  Daha eski sürümler <span className="text-white/55">{liste.length - goster}</span>
                </motion.button>
              </div>
            )}
          </section>
        </div>
      </div>
    </MotionConfig>
  );
}
