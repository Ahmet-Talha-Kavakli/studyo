"use client";

/**
 * Yardım merkezi (/sss) — "B + A" (2026-10-29): büyük arama (en iyi eşleşme "Kısa yanıt" kartında),
 * gerçek üretim görselli 6 popüler soru kartı (yanıt altında açılır), açıklamalı ve sayılı konu kartları,
 * seçili konunun soruları yerinde. ?kategori=, ?q= ve #soru-kimligi adres çubuğunda tutulur.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "framer-motion";
import {
  Activity, ArrowRight, Clapperboard, Code2, Coins, CreditCard, FolderOpen, Link2, LifeBuoy, Lock, Plug, Plus, ReceiptText,
  Search, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp, Wand2, X, type LucideIcon,
} from "lucide-react";
import { Kap } from "@/components/kesfet/ortak";
import { kopyala } from "@/lib/gercekEylem";
import { SSS_KATEGORILER, soruKimligi, type SSSMadde } from "@/lib/kurumsal/sss";
import { cn } from "@/lib/utils";

const IKON: Record<string, LucideIcon> = { Sparkles, CreditCard, ReceiptText, Wand2, Clapperboard, FolderOpen, ShieldCheck, Coins, Lock, Code2, Plug };
const sade = (s: string) => s.toLocaleLowerCase("tr-TR");
const katSlug = (ad: string) => soruKimligi(ad);

type Madde = SSSMadde & { id: string; kategori: string };
const TUM: Madde[] = SSS_KATEGORILER.flatMap((k) => k.maddeler.map((m) => ({ ...m, id: soruKimligi(m.s), kategori: k.ad })));
const TOPLAM = TUM.length;
const ONERI = ["iade", "kredi", "2FA", "fatura", "preset", "KVKK", "API anahtarı"];
const GERI_ANAHTAR = "vayra-sss-geri";

/** Soru metnine göre puanlar; her kelime eşleşmeli. */
function ara(q: string): Madde[] {
  const kelimeler = sade(q).split(/\s+/).filter(Boolean);
  if (!kelimeler.length) return [];
  return TUM.map((m) => {
    const soru = sade(m.s), govde = sade(`${m.c} ${m.anahtar ?? ""} ${m.kategori}`);
    let puan = 0;
    for (const k of kelimeler) {
      if (soru.includes(k)) puan += 3;
      else if (govde.includes(k)) puan += 1;
      else return null;
    }
    return { m, puan };
  }).filter((x): x is { m: Madde; puan: number } => !!x).sort((a, b) => b.puan - a.puan).map((x) => x.m);
}

/** Aranan kelimeleri metin içinde işaretler. */
function Vurgula({ metin, q }: { metin: string; q: string }) {
  const kelimeler = sade(q).split(/\s+/).filter((k) => k.length > 1);
  if (!kelimeler.length) return <>{metin}</>;
  const kucuk = sade(metin);
  const araliklar: [number, number][] = [];
  for (const k of kelimeler) {
    let i = kucuk.indexOf(k);
    while (i !== -1) { araliklar.push([i, i + k.length]); i = kucuk.indexOf(k, i + k.length); }
  }
  if (!araliklar.length || kucuk.length !== metin.length) return <>{metin}</>;
  araliklar.sort((a, b) => a[0] - b[0]);
  const parca: React.ReactNode[] = [];
  let son = 0;
  araliklar.forEach(([a, b], i) => {
    if (a < son) return;
    if (a > son) parca.push(metin.slice(son, a));
    parca.push(<mark key={i} className="rounded-[3px] bg-[#55d6fd]/25 px-0.5 text-white">{metin.slice(a, b)}</mark>);
    son = b;
  });
  parca.push(metin.slice(son));
  return <>{parca}</>;
}

/* ── Popüler sorular: gerçek Vayra üretimi görselli kartlar (Higgsfield dili) ── */
const POPULER: { s: string; g: string }[] = [
  { s: "Krediler nasıl çalışır?", g: "/gercek/galeri/sinematik8.webp" },
  { s: "Üretim başarısız olursa krediyi kaybeder miyim?", g: "/gercek/galeri/manzara3.webp" },
  { s: "Ürettiğim içerikler kime ait?", g: "/gercek/galeri/portre4.webp" },
  { s: "İki adımlı doğrulamayı nasıl açarım?", g: "/gercek/galeri/3d6.webp" },
  { s: "İade alabilir miyim?", g: "/gercek/galeri/soyut5.webp" },
  { s: "Vayra'yı Claude'a nasıl bağlarım?", g: "/gercek/galeri/sinematik2.webp" },
];

/** Yardım merkezi: arama, popüler sorular, konu ızgarası, seçili konunun soruları, geri bildirim. */
export function SSSMerkezi() {
  const [q, setQ] = useState("");
  const [kat, setKat] = useState<string>(SSS_KATEGORILER[0].ad);
  const [acik, setAcik] = useState<Set<string>>(new Set());
  const [geri, setGeri] = useState<Record<string, "evet" | "hayir">>({});
  const [populerAcik, setPopulerAcik] = useState<string | null>(null);
  const aramaRef = useRef<HTMLInputElement>(null);
  const listeRef = useRef<HTMLDivElement>(null);

  // URL → durum (ilk yükleme)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const bulunan = SSS_KATEGORILER.find((x) => katSlug(x.ad) === p.get("kategori"));
    if (bulunan) setKat(bulunan.ad);
    if (p.get("q")) setQ(p.get("q")!);
    const h = decodeURIComponent(window.location.hash.slice(1));
    const m = TUM.find((x) => x.id === h);
    if (m) {
      setKat(m.kategori); setAcik(new Set([h]));
      setTimeout(() => document.getElementById(h)?.scrollIntoView({ block: "center" }), 200);
    }
    try { setGeri(JSON.parse(localStorage.getItem(GERI_ANAHTAR) || "{}")); } catch { /* yok */ }
  }, []);

  // durum → URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (kat !== SSS_KATEGORILER[0].ad) p.set("kategori", katSlug(kat));
    if (q.trim()) p.set("q", q.trim());
    const s = p.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${s ? `?${s}` : ""}${window.location.hash}`);
  }, [q, kat]);

  // "/" ile aramaya odaklan
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !t.isContentEditable) { e.preventDefault(); aramaRef.current?.focus(); }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);

  const sonuclar = useMemo(() => ara(q), [q]);
  const aramada = !!q.trim();
  const secili = SSS_KATEGORILER.find((k) => k.ad === kat) ?? SSS_KATEGORILER[0];

  const ac = (id: string) => setAcik((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const geriVer = (id: string, d: "evet" | "hayir") => setGeri((g) => {
    const n = { ...g, [id]: d };
    try { localStorage.setItem(GERI_ANAHTAR, JSON.stringify(n)); } catch { /* yok */ }
    return n;
  });
  const katSec = (ad: string) => { setKat(ad); setQ(""); requestAnimationFrame(() => listeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); };
  const soruAc = (m: Madde) => {
    setQ(""); setKat(m.kategori); setAcik((s) => new Set(s).add(m.id));
    setTimeout(() => document.getElementById(m.id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  };

  const satir = (m: Madde, kategoriGoster = false) => (
    <SoruSatiri key={m.id} m={m} q={q} acik={aramada ? !acik.has(m.id) : acik.has(m.id)} onAc={() => ac(m.id)} kategoriGoster={kategoriGoster}
      geri={geri[m.id]} onGeri={(d) => geriVer(m.id, d)} />
  );

  return (
    <MotionConfig reducedMotion="user">
      <Kap className="pb-24 pt-14 sm:pt-20">
        {/* Giriş + arama */}
        <section className="text-center">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-balance text-[40px] font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-[60px]">
            Nasıl yardımcı <span className="bg-gradient-to-r from-[#55d6fd] to-[#a8ecff] bg-clip-text text-transparent">olabiliriz?</span>
          </motion.h1>
          <div className="mx-auto mt-8 max-w-[640px]">
            <label className="flex h-[60px] items-center gap-3 rounded-full bg-[#151517] px-6 ring-1 ring-white/[0.12] transition focus-within:bg-white/[0.07] focus-within:ring-[#55d6fd]/60">
              <Search className="h-5 w-5 shrink-0 text-white/65" />
              <input ref={aramaRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${TOPLAM} yanıtta ara: iade, fatura, 2FA`} aria-label="Sorularda ara"
                className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/65"
                onKeyDown={(e) => { if (e.key === "Escape") setQ(""); }} />
              {q
                ? <button onClick={() => setQ("")} aria-label="Aramayı temizle" className="flex h-7 w-7 items-center justify-center rounded-full text-white/65 transition hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
                : <kbd className="hidden sm:inline-flex">/</kbd>}
            </label>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              <span className="mr-1 text-[13px] text-white/65">{SSS_KATEGORILER.length} konuda {TOPLAM} yanıt ·</span>
              {ONERI.map((o) => (
                <motion.button key={o} whileTap={{ scale: 0.95 }} onClick={() => setQ(o)} className="h-8 rounded-full bg-white/[0.06] px-3 text-[13px] text-white/85 transition hover:bg-white/[0.11] hover:text-white">{o}</motion.button>
              ))}
            </div>
          </div>
        </section>

        <AnimatePresence mode="wait" initial={false}>
          {aramada ? (
            <motion.section key="ara" aria-live="polite" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto mt-12 max-w-[820px]">
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <h2 className="text-[15px] text-white/65"><span className="font-semibold text-white">{sonuclar.length} sonuç</span> · &ldquo;{q.trim()}&rdquo;</h2>
                <button onClick={() => setQ("")} className="text-[13px] text-white/65 hover:text-white">Temizle</button>
              </div>
              {sonuclar.length ? (
                <>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 overflow-hidden rounded-[24px] bg-[#111113] ring-1 ring-[#55d6fd]/25">
                    <div className="p-6">
                      <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#a8ecff]"><Sparkles className="h-3.5 w-3.5" />Kısa yanıt</p>
                      <p className="mt-2 text-[19px] font-semibold leading-snug tracking-[-0.02em] text-white"><Vurgula metin={sonuclar[0].s} q={q} /></p>
                      <p className="mt-2 text-[15.5px] leading-relaxed text-white/80"><Vurgula metin={sonuclar[0].c} q={q} /></p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {sonuclar[0].baglanti && <Link href={sonuclar[0].baglanti.href} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition hover:bg-white/90">{sonuclar[0].baglanti.ad}<ArrowRight className="h-3.5 w-3.5" /></Link>}
                        <span className="text-[12.5px] text-white/55">Kaynak: {sonuclar[0].kategori}</span>
                      </div>
                    </div>
                  </motion.div>
                  {sonuclar.length > 1 && <p className="mb-1 text-[14px] font-medium text-white/70">Diğer eşleşmeler</p>}
                  <div className="border-t border-white/[0.07]">{sonuclar.slice(1).map((m) => satir(m, true))}</div>
                </>
              ) : (
                <div className="rounded-[22px] bg-white/[0.02] px-6 py-12 text-center ring-1 ring-white/[0.08]">
                  <p className="text-[16px] font-semibold text-white">&ldquo;{q.trim()}&rdquo; için hazır yanıt yok</p>
                  <p className="mx-auto mt-2 max-w-[420px] text-[14px] text-white/65">Daha kısa ya da farklı bir kelime dene, ya da sorunu doğrudan ekibimize yaz.</p>
                  <Link href={`/iletisim?konu=destek&mesaj=${encodeURIComponent(q.trim())}`} className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-full bg-[#55d6fd] px-5 text-[14px] font-semibold text-[#06222b]">Destek ekibine yaz<ArrowRight className="h-4 w-4" /></Link>
                </div>
              )}
            </motion.section>
          ) : (
            <motion.div key="ana" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Popüler: görselli soru kartları, yanıt hemen altında açılır */}
              <section className="mt-16">
                <h2 className="text-[24px] font-semibold tracking-[-0.025em] text-white">En çok sorulanlar</h2>
                <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-3">
                  {POPULER.map(({ s: soru, g }, i) => {
                    const m = TUM.find((x) => x.s === soru);
                    if (!m) return null;
                    const on = populerAcik === m.id;
                    return (
                      <motion.button key={soru} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                        onClick={() => setPopulerAcik(on ? null : m.id)} aria-expanded={on}
                        className="group relative h-[190px] overflow-hidden rounded-[22px] text-left sm:h-[230px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={g} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,.05)_25%,rgba(8,8,10,.92)_100%)]" />
                        <span aria-hidden className={cn("pointer-events-none absolute inset-0 rounded-[22px] ring-inset transition-all", on ? "ring-2 ring-[#55d6fd]" : "ring-1 ring-white/[0.08]")} />
                        <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                          <span className="block text-[12px] text-white/70 sm:text-[12.5px]">{m.kategori}</span>
                          <span className="mt-1 block text-[15px] font-semibold leading-snug tracking-[-0.015em] text-white sm:text-[19px]">{soru}</span>
                        </span>
                        <span className={cn("absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all", on ? "rotate-45 bg-white text-black" : "bg-black/45 text-white opacity-0 group-hover:opacity-100")}><Plus className="h-4 w-4" /></span>
                      </motion.button>
                    );
                  })}
                </div>
                <AnimatePresence initial={false}>
                  {populerAcik && (() => {
                    const m = TUM.find((x) => x.id === populerAcik)!;
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }} className="overflow-hidden">
                        <div className="mt-3 rounded-[24px] bg-[#111113] p-6 ring-1 ring-white/[0.1] sm:p-7">
                          <div className="flex items-start justify-between gap-4">
                            <div><p className="text-[13px] text-white/55">{m.kategori}</p><p className="mt-1 text-[22px] font-semibold tracking-[-0.025em] text-white">{m.s}</p></div>
                            <button onClick={() => setPopulerAcik(null)} aria-label="Kapat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white transition hover:bg-white/[0.12]"><X className="h-4 w-4" /></button>
                          </div>
                          <p className="mt-3 max-w-[780px] text-[15.5px] leading-relaxed text-white/80">{m.c}</p>
                          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] text-white/65">
                            {m.baglanti && <Link href={m.baglanti.href} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition hover:bg-white/90">{m.baglanti.ad}<ArrowRight className="h-3.5 w-3.5" /></Link>}
                            {geri[m.id] ? (
                              <span>{geri[m.id] === "evet" ? "Geri bildirimin için teşekkürler." : <>Üzgünüz. <Link href={`/iletisim?konu=destek&mesaj=${encodeURIComponent(m.s)}`} className="font-medium text-[#55d6fd] hover:underline">Destek ekibine sor</Link></>}</span>
                            ) : (
                              <span className="flex items-center gap-2">İşine yaradı mı?
                                <button onClick={() => geriVer(m.id, "evet")} className="flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-white transition hover:bg-white/[0.12]"><ThumbsUp className="h-3.5 w-3.5" />Evet</button>
                                <button onClick={() => geriVer(m.id, "hayir")} className="flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-white transition hover:bg-white/[0.12]"><ThumbsDown className="h-3.5 w-3.5" />Hayır</button>
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </section>

              {/* Konuya göre */}
              <section className="mt-16">
                <h2 className="text-[24px] font-semibold tracking-[-0.025em] text-white">Konuya göre</h2>
                <LayoutGroup id="sss-konu">
                  <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {SSS_KATEGORILER.map((k) => {
                      const I = IKON[k.ikon] ?? Sparkles, sec = k.ad === kat;
                      return (
                        <button key={k.ad} onClick={() => katSec(k.ad)} aria-pressed={sec}
                          className={cn("relative flex flex-col rounded-[20px] p-4 text-left transition-colors", sec ? "bg-[#18181b]" : "bg-[#111113] hover:bg-[#151517]")}>
                          <span className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/[0.07]" />
                          {sec && <motion.span layoutId="sss-konu-zemin" className="pointer-events-none absolute inset-0 rounded-[20px] ring-[1.5px] ring-inset ring-[#55d6fd]/80" transition={{ type: "spring", damping: 32, stiffness: 420 }} />}
                          <span className="flex items-center gap-3">
                            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300", sec ? "bg-[#55d6fd] text-[#04212b]" : "bg-white/[0.07] text-white")}><I className="h-4 w-4" /></span>
                            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-white">{k.ad}</span>
                            <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[12px] tabular-nums text-white/75">{k.maddeler.length}</span>
                          </span>
                          <span className="mt-2.5 line-clamp-2 text-[13px] leading-snug text-white/60">{k.ozet}</span>
                        </button>
                      );
                    })}
                    <Link href="/iletisim?konu=destek" className="group flex flex-col rounded-[20px] bg-[#55d6fd]/[0.07] p-4 ring-1 ring-inset ring-[#55d6fd]/20 transition-colors hover:bg-[#55d6fd]/[0.11]">
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#55d6fd] text-[#04212b]"><LifeBuoy className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-white">Bulamadın mı?</span>
                        <ArrowRight className="h-4 w-4 text-[#55d6fd] transition-transform group-hover:translate-x-0.5" />
                      </span>
                      <span className="mt-2.5 text-[13px] leading-snug text-white/65">Destek ekibine yaz; ilk yanıt 4 iş saati içinde.</span>
                    </Link>
                  </div>
                </LayoutGroup>

                <div ref={listeRef} className="scroll-mt-24">
                  <AnimatePresence mode="wait">
                    <motion.div key={secili.ad} id={`kategori-${katSlug(secili.ad)}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}
                      className="mt-10 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
                      <div>
                        <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-white">{secili.ad}</h3>
                        <p className="mt-1 text-[14.5px] text-white/65">{secili.ozet}</p>
                      </div>
                      <div className="border-t border-white/[0.07]">{secili.maddeler.map((m) => satir({ ...m, id: soruKimligi(m.s), kategori: secili.ad }))}</div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Başka kanallar */}
        <section className="mt-20 grid overflow-hidden rounded-[22px] bg-white/[0.07] ring-1 ring-white/[0.08] md:grid-cols-3" style={{ gap: 1 }}>
          {[
            { I: LifeBuoy, ad: "Destek ekibine yaz", metin: "Talep numarası anında gelir; hedef ilk yanıt 4 iş saati.", href: "/iletisim?konu=destek" },
            { I: Activity, ad: "Sistem durumu", metin: "Üretimler yavaş mı? Servislerin canlı durumunu gör.", href: "/durum" },
            { I: Code2, ad: "Geliştirici dokümanları", metin: "API anahtarları, uç noktalar, webhook ve sınırlar.", href: "/panel/api" },
          ].map(({ I, ad, metin, href }) => (
            <Link key={ad} href={href} className="group bg-[#0e0f11] p-5 transition-colors hover:bg-[#131417] sm:p-6">
              <I className="h-5 w-5 text-[#55d6fd]" />
              <p className="mt-4 flex items-center gap-1.5 text-[15.5px] font-medium text-white">{ad}<ArrowRight className="h-3.5 w-3.5 text-white/65 transition-transform group-hover:translate-x-0.5" /></p>
              <p className="mt-1 text-[13.5px] leading-snug text-white/65">{metin}</p>
            </Link>
          ))}
        </section>
      </Kap>
    </MotionConfig>
  );
}

function SoruSatiri({ m, q, acik, onAc, kategoriGoster, geri, onGeri }: {
  m: Madde; q: string; acik: boolean; onAc: () => void; kategoriGoster: boolean; geri?: "evet" | "hayir"; onGeri: (d: "evet" | "hayir") => void;
}) {
  return (
    <div id={m.id} className="scroll-mt-28 border-b border-white/[0.07]">
      <h4>
        <button onClick={onAc} aria-expanded={acik} aria-controls={`${m.id}-yanit`} className="group flex w-full items-center justify-between gap-6 py-4 text-left">
          <span className="min-w-0">
            {kategoriGoster && <span className="mb-0.5 block text-[12px] text-white/65">{m.kategori}</span>}
            <span className={cn("block text-[16px] transition-colors", acik ? "text-white" : "text-white/85 group-hover:text-white")}><Vurgula metin={m.s} q={q} /></span>
          </span>
          <Plus className={cn("h-5 w-5 shrink-0 transition-transform duration-300", acik ? "rotate-45 text-[#55d6fd]" : "text-white/65")} />
        </button>
      </h4>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div id={`${m.id}-yanit`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }} className="overflow-hidden">
            <p className="max-w-[700px] pb-4 text-[15px] leading-relaxed text-white/65"><Vurgula metin={m.c} q={q} /></p>
            {m.baglanti && (
              <Link href={m.baglanti.href} className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#55d6fd]/12 px-3.5 text-[13px] font-medium text-[#55d6fd] transition hover:bg-[#55d6fd]/20">
                {m.baglanti.ad}<ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pb-5 text-[12.5px] text-white/65">
              <AnimatePresence mode="wait" initial={false}>
                {geri ? (
                  <motion.span key="t" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    {geri === "evet" ? "Geri bildirimin için teşekkürler." : <>Üzgünüz. <Link href={`/iletisim?konu=destek&mesaj=${encodeURIComponent(m.s)}`} className="font-medium text-[#55d6fd] hover:underline">Destek ekibine sor</Link></>}
                  </motion.span>
                ) : (
                  <motion.span key="s" exit={{ opacity: 0 }} className="flex items-center gap-2">
                    Yardımcı oldu mu?
                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => onGeri("evet")} aria-label="Evet, yardımcı oldu" className="flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-white/[0.1] transition hover:text-white hover:ring-white/25"><ThumbsUp className="h-3.5 w-3.5" /></motion.button>
                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => onGeri("hayir")} aria-label="Hayır, yardımcı olmadı" className="flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-white/[0.1] transition hover:text-white hover:ring-white/25"><ThumbsDown className="h-3.5 w-3.5" /></motion.button>
                  </motion.span>
                )}
              </AnimatePresence>
              <button onClick={() => void kopyala(`${window.location.origin}/sss#${m.id}`, "Bağlantı kopyalandı")} className="inline-flex items-center gap-1.5 transition hover:text-white"><Link2 className="h-3.5 w-3.5" />Bağlantıyı kopyala</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

