"use client";

/**
 * /earn genel bakış — "Kampanya vitrini" (2026-10-29, 3. turda sıfırdan seçilen C; Higgsfield Earn incelendi):
 * 3B kapak akışında dönen kampanyalar (ortadaki oynar; sürükle, ok tuşları, kendiliğinden ilerler),
 * altında seçilinin ödemesi, bitişi, bütçesi ve Katıl; tek satır kişisel şerit,
 * süreçteki gönderiler, ürünün gerçek anlarıyla 3 adım (tamamlanan adım işaretli),
 * süzülen poster kampanya kartları ve ek gelir.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, BadgeCheck, Check, ChevronLeft, ChevronRight, Gift, Link2, MousePointer2, Pause, Play, Store, Trophy, Wallet } from "lucide-react";
import { useEarn, cuzdan, gonderiHesap } from "@/store/useEarn";
import { usePaylasim } from "@/store/usePaylasim";
import { kampanyalar, bittiMi, tl, kisaSayi, KURALLAR, PLATFORMLAR, TUR_AD, platformBul, type Kampanya, type KampanyaTur } from "@/lib/earn/kampanyalar";
import { GonderiSatiri, PlatformLogo, useSimdi } from "@/components/earn/ortak";
import { PosterKart } from "@/components/earn/PosterKart";
import { cn } from "@/lib/utils";
import { havuzSec } from "@/lib/medyaHavuzu";
/** Telifsiz havuzdan bu sayfaya özgü hero klibi (tekrar eden seedance/hero-video yerine). */
const EARN_HERO = havuzSec("earn-hero", ["moda", "portre"]);

const yay = { type: "spring" as const, stiffness: 420, damping: 34 };
const ease = [0.22, 1, 0.36, 1] as const;
const AKIS_SN = 7;
const GUN = 86_400_000;
const tarih = (t: number) => new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

function odul(k: Kampanya) {
  return k.tur === "goruntulenme" ? { deger: tl(k.oran!), birim: "1.000 izlenme başına" } : k.tur === "gorev" ? { deger: tl(k.odul!), birim: "teslim başına" } : { deger: tl(k.havuz!), birim: "ödül havuzu" };
}

function Kapak({ k, oynat, className }: { k: Kampanya; oynat?: boolean; className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={k.kapak} alt="" draggable={false} className={cn("absolute inset-0 h-full w-full select-none object-cover", className)} />
      {k.video && oynat && <video key={k.video} src={k.video} poster={k.kapak} autoPlay muted loop playsInline className={cn("absolute inset-0 h-full w-full object-cover", className)} />}
    </>
  );
}

function Sayac({ hedef, sure = 1.1, bicim }: { hedef: number; sure?: number; bicim: (n: number) => string }) {
  const mv = useMotionValue(0);
  const metin = useTransform(mv, (v) => bicim(v));
  useEffect(() => { const c = animate(mv, hedef, { duration: sure, ease: [0.22, 1, 0.36, 1] }); return () => c.stop(); }, [hedef, sure, mv]);
  return <motion.span>{metin}</motion.span>;
}

export default function EarnGenelBakis() {
  const s = useEarn();
  const simdi = useSimdi();
  const c = cuzdan(s, simdi);
  const acik = useMemo(() => kampanyalar(simdi).filter((k) => !bittiMi(k, simdi)), [simdi]);
  const aktif = s.gonderiler.map((g) => ({ g, h: gonderiHesap(g, simdi, c.seviye.bonus) })).filter(({ h }) => ["inceleme", "kazaniyor", "degerlendirme", "bekleme"].includes(h.durum)).slice(0, 4);

  return (
    <div>
      <Vitrin liste={acik} katilimlar={s.katilimlar} simdi={simdi} />
      <KisiselSerit c={c} />

      {aktif.length > 0 && (
        <Bolum baslik="Süreçteki gönderilerin" sag={<TumuLink href="/earn/gonderiler" />}>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 xl:grid-cols-2">{aktif.map(({ g }) => <GonderiSatiri key={g.id} g={g} simdi={simdi} bonus={c.seviye.bonus} />)}</div>
        </Bolum>
      )}

      <Adimlar />
      <Kampanyalar liste={acik} katilimlar={s.katilimlar} />
      <EkGelir />
    </div>
  );
}

function Bolum({ baslik, alt, sag, children }: { baslik: string; alt?: string; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-[24px] font-semibold tracking-[-0.03em] text-white">{baslik}</h2>{alt && <p className="mt-1 text-[14px] text-white/55">{alt}</p>}</div>
        {sag}
      </div>
      {children}
    </section>
  );
}

function TumuLink({ href }: { href: string }) {
  return <Link href={href} className="group flex items-center gap-1 text-[13.5px] font-medium text-white/60 transition hover:text-white">Tümü<ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></Link>;
}

/* ── Kapak akışı vitrini ── */
function Vitrin({ liste, katilimlar, simdi }: { liste: Kampanya[]; katilimlar: string[]; simdi: number }) {
  const sirali = useMemo(() => [...liste].sort((a, b) => Number(!!b.oneCikan) - Number(!!a.oneCikan) || Number(!!b.video) - Number(!!a.video)), [liste]);
  const n = sirali.length;
  const [i, setI] = useState(0);
  const [dur, setDur] = useState(false);
  const [ust, setUst] = useState(false);
  const durdu = dur || ust;
  const t = useMotionValue(0);
  // İlerleme durum değil motion value: her karede bileşeni yeniden çizip ana iş parçacığını kilitlemesin.
  const genislik = useTransform(t, (v) => `${v * 100}%`);

  const git = useCallback((j: number) => { t.set(0); setI(((j % n) + n) % n); }, [n, t]);
  useEffect(() => {
    if (durdu || n < 2) return;
    const a = animate(t, 1, { duration: AKIS_SN * (1 - t.get()), ease: "linear", onComplete: () => git(i + 1) });
    return () => a.stop();
  }, [i, durdu, n, t, git]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,[contenteditable]")) return;
      if (e.key === "ArrowRight") git(i + 1); else if (e.key === "ArrowLeft") git(i - 1);
    };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, [i, git]);

  if (!n) return null;
  const k = sirali[i];
  const o = odul(k);
  const kalan = k.butce ? Math.max(0, k.butce - (k.odenen ?? 0)) : null;
  const oran = k.butce ? Math.min(1, (k.odenen ?? 0) / k.butce) : null;
  const katildi = katilimlar.includes(k.id);

  return (
    <section onMouseEnter={() => setUst(true)} onMouseLeave={() => setUst(false)} aria-roledescription="carousel" aria-label="Açık kampanyalar"
      className="relative overflow-hidden rounded-[34px] bg-[#08090b] pb-7 pt-9 ring-1 ring-white/[0.08] sm:pt-11">
      {/* Seçili kampanyanın rengiyle ortam */}
      <AnimatePresence initial={false}>
        <motion.div key={k.id} initial={{ opacity: 0 }} animate={{ opacity: 0.42 }} exit={{ opacity: 0 }} transition={{ duration: 1.1 }} className="pointer-events-none absolute inset-0 scale-125 blur-[80px]"><Kapak k={k} /></motion.div>
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,11,0.35),transparent_30%,#08090b_78%)]" />

      <div className="relative px-5 text-center">
        <p className="text-[13.5px] text-white/60">{n} açık kampanya</p>
        <h1 className="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-[44px]">Bugün ne üretip <span className="bg-gradient-to-r from-[#55d6fd] to-[#a5ecff] bg-clip-text text-transparent">kazanacaksın?</span></h1>
      </div>

      {/* Kartlar */}
      <motion.div className="relative mt-8 h-[340px] cursor-grab touch-pan-y [perspective:1600px] active:cursor-grabbing sm:mt-10 sm:h-[400px]"
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.12} dragMomentum={false}
        onDragEnd={(_, b) => { if (b.offset.x < -60) git(i + 1); else if (b.offset.x > 60) git(i - 1); }}>
        {sirali.map((x, j) => {
          let d = j - i; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
          const gor = Math.abs(d) <= 2;
          return (
            <motion.button key={x.id} onClick={() => d !== 0 && git(j)} tabIndex={d === 0 ? 0 : -1} aria-label={x.ad} aria-current={d === 0}
              animate={{ x: `calc(-50% + ${d} * var(--akis-ara))`, rotateY: d * -20, z: -Math.abs(d) * 90, opacity: gor ? (d === 0 ? 1 : Math.abs(d) === 1 ? 0.62 : 0.28) : 0 }}
              transition={{ duration: 0.65, ease }}
              className="absolute left-1/2 top-0 aspect-[3/4] h-full overflow-hidden rounded-[28px] bg-black ring-1 ring-white/[0.14] [--akis-ara:150px] sm:[--akis-ara:250px]"
              style={{ zIndex: 10 - Math.abs(d), pointerEvents: gor ? "auto" : "none" }}>
              <Kapak k={x} oynat={d === 0} />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />
              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-1 backdrop-blur-md">{x.platformlar.map((pp) => <PlatformLogo key={pp} id={pp} boyut={13} />)}</span>
              {d === 0 && katildi && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#55d6fd] px-2.5 py-1 text-[11.5px] font-semibold text-[#06222b]"><Check className="h-3 w-3" strokeWidth={3} />Katıldın</span>}
              <span className="absolute inset-x-3 bottom-3 text-left text-[12.5px] font-medium text-white/90">{TUR_AD[x.tur]} · {x.kategori}</span>
            </motion.button>
          );
        })}
        <button onClick={() => git(i - 1)} aria-label="Önceki kampanya" className="absolute left-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.08] text-white ring-1 ring-white/[0.14] backdrop-blur-md transition hover:bg-white/[0.16] active:scale-90 sm:flex"><ChevronLeft className="h-5 w-5" /></button>
        <button onClick={() => git(i + 1)} aria-label="Sonraki kampanya" className="absolute right-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.08] text-white ring-1 ring-white/[0.14] backdrop-blur-md transition hover:bg-white/[0.16] active:scale-90 sm:flex"><ChevronRight className="h-5 w-5" /></button>
      </motion.div>

      {/* Seçilinin künyesi */}
      <AnimatePresence mode="wait">
        <motion.div key={k.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.32, ease }} className="relative mx-auto mt-8 max-w-[680px] px-5 text-center">
          <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[26px]">{k.ad}</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[14.5px] leading-relaxed text-white/60">{k.ozet}</p>
          <dl className="mx-auto mt-6 grid max-w-[560px] grid-cols-3 divide-x divide-white/[0.09]">
            <div className="px-2"><dt className="text-[12.5px] text-white/50">Ödeme</dt><dd className="mt-1 text-[22px] font-semibold leading-none tracking-[-0.03em] text-white sm:text-[28px]">{o.deger}</dd><dd className="mt-1.5 text-[11.5px] text-white/45">{o.birim}</dd></div>
            <div className="px-2"><dt className="text-[12.5px] text-white/50">Bitiş</dt><dd className="mt-1 text-[22px] font-semibold leading-none tracking-[-0.03em] text-white sm:text-[28px]">{tarih(k.bitis)}</dd><dd className="mt-1.5 text-[11.5px] text-white/45">{Math.max(0, Math.ceil((k.bitis - simdi) / GUN))} gün kaldı</dd></div>
            <div className="px-2"><dt className="text-[12.5px] text-white/50">Katılımcı</dt><dd className="mt-1 text-[22px] font-semibold leading-none tracking-[-0.03em] text-white sm:text-[28px]">{kisaSayi(k.katilimci)}</dd><dd className="mt-1.5 text-[11.5px] text-white/45">{k.tur === "gorev" ? `${k.kotaKalan}/${k.kota} yer kaldı` : k.dereceler ? `İlk ${k.dereceler.length} ödüllü` : `gönderi başı en çok ${tl(k.maxOdeme ?? 0)}`}</dd></div>
          </dl>
          {kalan !== null && oran !== null && (
            <div className="mx-auto mt-6 max-w-[360px]">
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]"><motion.div initial={{ width: 0 }} animate={{ width: `${oran * 100}%` }} transition={{ duration: 0.9, delay: 0.15, ease }} className="h-full rounded-full bg-gradient-to-r from-[#55d6fd] to-[#a5ecff]" /></div>
              <p className="mt-2 text-[12.5px] text-white/55">Bütçeden <span className="font-medium text-white">{tl(kalan)}</span> kaldı</p>
            </div>
          )}
          <Link href={`/earn/kampanyalar/${k.id}`} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]">{katildi ? "Kampanyaya git" : "Katıl ve üret"}<ArrowRight className="h-4 w-4" /></Link>
        </motion.div>
      </AnimatePresence>

      {/* İlerleme */}
      <div className="relative mx-auto mt-8 flex max-w-[420px] items-center gap-3 px-5">
        <button onClick={() => setDur((x) => !x)} aria-label={dur ? "Oynat" : "Duraklat"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white ring-1 ring-white/[0.1] transition hover:bg-white/[0.12] active:scale-90">{dur ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}</button>
        <div className="flex flex-1 gap-1.5">
          {sirali.map((x, j) => (
            <button key={x.id} onClick={() => git(j)} aria-label={x.ad} className="group h-6 flex-1 py-2.5">
              <span className="block h-1 overflow-hidden rounded-full bg-white/[0.12] transition group-hover:bg-white/[0.22]">
                {j === i ? <motion.span className="block h-full rounded-full bg-white" style={{ width: genislik }} /> : <span className="block h-full rounded-full bg-white" style={{ width: j < i ? "100%" : "0%" }} />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Kişisel şerit: tek satır ── */
function KisiselSerit({ c }: { c: ReturnType<typeof cuzdan> }) {
  const hesaplar = useEarn((s) => s.hesaplar);
  const bagli = new Map(hesaplar.filter((h) => h.durum === "dogrulandi").map((h) => [h.platform, h]));
  const oran = c.sonraki ? Math.min(1, (c.seviyeKazanc - c.seviye.minKazanc) / (c.sonraki.minKazanc - c.seviye.minKazanc)) : 1;
  const cekebilir = c.cekilebilir >= KURALLAR.minCekim;
  const hucre = "group bg-[#0e0f12] p-5 transition-colors hover:bg-[#121317]";
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45, ease }}
      className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[26px] bg-white/[0.06] ring-1 ring-white/[0.08] lg:grid-cols-[1.15fr_1fr_1.25fr_1.1fr]">
      <Link href="/earn/cuzdan" className={hucre}>
        <p className="flex items-center gap-1.5 text-[13px] text-white/55"><Wallet className="h-3.5 w-3.5" />Çekilebilir</p>
        <p className="mt-1.5 text-[26px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-white"><Sayac hedef={c.cekilebilir} bicim={(v) => tl(v, true)} /></p>
        <p className={cn("mt-2 flex items-center gap-1 text-[12.5px]", cekebilir ? "text-[#8fe6ff]" : "text-white/45")}>{cekebilir ? "Para çek" : `${tl(KURALLAR.minCekim)} olunca çekilir`}<ChevronRight className="h-3 w-3 transition group-hover:translate-x-0.5" /></p>
      </Link>
      <Link href="/earn/gonderiler" className={hucre}>
        <p className="text-[13px] text-white/55">Bekleyen</p>
        <p className="mt-1.5 text-[26px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-white"><Sayac hedef={c.bekleyen} bicim={(v) => tl(v)} /></p>
        <p className="mt-2 text-[12.5px] text-white/45">Toplam {tl(c.toplam)}</p>
      </Link>
      <Link href="/earn/yardim#seviyeler" className={hucre}>
        <p className="flex items-center justify-between gap-2 text-[13px] text-white/55">Seviye<span className="font-medium text-white">{c.seviye.ad}{c.seviye.bonus > 0 && <span className="ml-1 text-[#8fe6ff]">+%{Math.round(c.seviye.bonus * 100)}</span>}</span></p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(3, oran * 100)}%` }} transition={{ duration: 1, delay: 0.3, ease }} className="h-full rounded-full bg-gradient-to-r from-[#55d6fd] to-[#a5ecff]" /></div>
        <p className="mt-2.5 text-[12.5px] text-white/45">{c.sonraki ? `${tl(Math.max(0, c.sonraki.minKazanc - c.seviyeKazanc))} daha kazanınca ${c.sonraki.ad}` : "En üst seviyedesin"}</p>
      </Link>
      <Link href="/earn/hesaplar" className={hucre}>
        <p className="flex items-center justify-between text-[13px] text-white/55">Hesapların<span className="text-white/70">{bagli.size}/{PLATFORMLAR.length}</span></p>
        <div className="mt-2.5 flex gap-1.5">
          {PLATFORMLAR.map((p) => {
            const h = bagli.get(p.id);
            return (
              <span key={p.id} title={h ? `${p.ad}: @${h.kadi}` : `${p.ad} bağlı değil`} className={cn("relative flex h-9 w-9 items-center justify-center rounded-[11px] ring-1 transition group-hover:-translate-y-0.5", h ? "bg-white/[0.08] ring-white/[0.14]" : "bg-white/[0.025] ring-white/[0.07] [&>img]:opacity-40")}>
                <PlatformLogo id={p.id} boyut={16} />
                {h && <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#55d6fd] ring-2 ring-[#0e0f12]"><Check className="h-2 w-2 text-[#06222b]" strokeWidth={4} /></span>}
              </span>
            );
          })}
        </div>
        <p className="mt-2.5 text-[12.5px] text-white/45">{bagli.size ? "Doğrulananlar işaretli" : "Kazanmak için bir hesap bağla"}</p>
      </Link>
    </motion.section>
  );
}

/* ── Üç adım: her kartta ürünün gerçek bir anı; tamamlanan adım işaretli ── */
function Adimlar() {
  const s = useEarn();
  if (s.karsilamaKapali) return null;
  const adimlar = [
    { ad: "Hesabını bağla", alt: "Bio'na kısa kodu ekle; hesabın saniyeler içinde doğrulanır.", tamam: s.hesaplar.some((h) => h.durum === "dogrulandi"), href: "/earn/hesaplar", Gorsel: AnHesap },
    { ad: "Üret ve paylaş", alt: "Kampanya kitindeki istemlerle Vayra'da üret, paylaşımının bağlantısını gönder.", tamam: s.gonderiler.length > 0, href: s.katilimlar[0] ? `/earn/kampanyalar/${s.katilimlar[0]}` : "/earn/kampanyalar", Gorsel: AnPaylas },
    { ad: "Parana ulaş", alt: `Onayda sabit ödeme, 24. saatte ve 7. günde bonus. ${tl(KURALLAR.minCekim)} olunca IBAN ya da Papara'ya çek.`, tamam: s.cekimler.length > 0, href: "/earn/cuzdan", Gorsel: AnBakiye },
  ];
  if (adimlar.every((a) => a.tamam)) return null;
  return (
    <Bolum baslik="Nasıl kazanırsın" alt="Üç adım, hepsi bu panelden." sag={<button onClick={s.karsilamaKapat} className="text-[13px] font-medium text-white/50 transition hover:text-white">Gizle</button>}>
      <div className="grid gap-4 md:grid-cols-3">
        {adimlar.map((a, i) => (
          <motion.div key={a.ad} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease }}>
            <Link href={a.href} className="group block">
              <div className="relative h-[230px] overflow-hidden rounded-[26px] bg-[radial-gradient(90%_70%_at_50%_0%,rgba(85,214,253,0.08),transparent_70%),#101114] ring-1 ring-white/[0.07] transition group-hover:ring-white/[0.16]">
                <a.Gorsel />
                {a.tamam && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#55d6fd]/15 px-2.5 py-1 text-[11.5px] font-medium text-[#8fe6ff] ring-1 ring-[#55d6fd]/30"><Check className="h-3 w-3" strokeWidth={3} />Tamam</span>}
              </div>
              <p className="mt-4 flex items-center gap-2.5 text-[16px] font-semibold text-white">
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold", a.tamam ? "bg-[#55d6fd] text-[#06222b]" : "bg-white text-black")}>{a.tamam ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}</span>
                {a.ad}
              </p>
              <p className="mt-1.5 pr-4 text-[13.5px] leading-relaxed text-white/55">{a.alt}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </Bolum>
  );
}

function AnHesap() {
  const [adim, setAdim] = useState(0);
  useEffect(() => { const t = setInterval(() => setAdim((a) => (a + 1) % 4), 1400); return () => clearInterval(t); }, []);
  const kod = "VAYRA-7K2Q";
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-[250px] rounded-[20px] bg-white/[0.04] p-4 ring-1 ring-white/[0.09]">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gercek/gorsel/gorsel-karakter-Aria.webp" alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white/10" />
          <div className="min-w-0"><p className="flex items-center gap-1 text-[13.5px] font-semibold text-white">@sen<AnimatePresence>{adim === 3 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={yay}><BadgeCheck className="h-4 w-4 text-[#55d6fd]" /></motion.span>}</AnimatePresence></p><p className="text-[11.5px] text-white/50">Örnek profil</p></div>
          <span className="ml-auto"><PlatformLogo id="instagram" boyut={18} /></span>
        </div>
        <div className="mt-3 rounded-[12px] bg-black/30 px-3 py-2.5 text-[12.5px] text-white/75 ring-1 ring-white/[0.06]">
          Yapay zekâ ile kısa filmler<br />
          <span className={cn("tracking-wide transition-colors", adim >= 1 ? "text-[#8fe6ff]" : "text-white/25")}>{adim >= 1 ? kod.slice(0, adim === 1 ? 5 : kod.length) : "Kodu buraya ekle"}</span>
          {adim === 1 && <span className="ml-px inline-block h-3 w-px animate-pulse bg-white align-middle" />}
        </div>
        <div className={cn("mt-3 flex h-9 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-semibold transition-colors duration-300", adim === 3 ? "bg-[#55d6fd] text-[#06222b]" : "bg-white text-black")}>
          {adim === 3 ? <><Check className="h-3.5 w-3.5" strokeWidth={3} />Doğrulandı</> : adim === 2 ? "Kontrol ediliyor" : "Doğrula"}
        </div>
      </div>
    </div>
  );
}

function AnPaylas() {
  const [faz, setFaz] = useState(0);
  useEffect(() => { const t = setInterval(() => setFaz((a) => (a + 1) % 3), 1800); return () => clearInterval(t); }, []);
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-3 px-5">
      <div className="relative aspect-[9/16] h-[180px] overflow-hidden rounded-[16px] ring-1 ring-white/[0.12]">
        <video src={EARN_HERO.video} poster={EARN_HERO.poster} autoPlay muted loop playsInline className="h-full w-full object-cover" />
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[9.5px] text-white backdrop-blur"><PlatformLogo id="tiktok" boyut={9} />@sen</span>
      </div>
      <div className="w-[150px] space-y-2">
        <p className="text-[11.5px] text-white/50">Paylaşım bağlantısı</p>
        <div className="flex h-9 items-center gap-1.5 overflow-hidden rounded-[10px] bg-black/30 px-2.5 text-[11.5px] ring-1 ring-white/[0.08]">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-white/45" />
          <AnimatePresence mode="wait">{faz >= 1 ? <motion.span key="l" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="truncate text-white">tiktok.com/@sen/7k2…</motion.span> : <motion.span key="b" exit={{ opacity: 0 }} className="text-white/30">Yapıştır</motion.span>}</AnimatePresence>
        </div>
        <motion.div animate={{ scale: faz === 2 ? 0.96 : 1 }} className={cn("relative flex h-9 items-center justify-center rounded-full text-[12px] font-semibold transition-colors", faz === 2 ? "bg-[#55d6fd] text-[#06222b]" : "bg-white text-black")}>
          {faz === 2 ? "İncelemede" : "Gönder"}
          <motion.span animate={{ x: faz === 1 ? 22 : 40, y: faz === 1 ? 10 : 26, opacity: faz === 0 ? 0 : 1 }} transition={{ duration: 0.6, ease }} className="absolute left-1/2 top-1/2"><MousePointer2 className="h-4 w-4 fill-white text-black" /></motion.span>
        </motion.div>
      </div>
    </div>
  );
}

function AnBakiye() {
  const [n, setN] = useState(0);
  useEffect(() => { const t = setInterval(() => setN((x) => x + 1), 3200); return () => clearInterval(t); }, []);
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-[250px] overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#55d6fd,#2bb5e0_55%,#8f9cff)] p-4 text-[#05222b]">
        <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/30 blur-2xl" />
        <p className="relative flex items-center gap-1.5 text-[12.5px] font-medium"><Wallet className="h-3.5 w-3.5" />Çekilebilir</p>
        <p className="relative mt-1 text-[34px] font-semibold leading-none tracking-[-0.04em]"><Sayac key={n} hedef={2480} sure={1.6} bicim={(v) => tl(v)} /></p>
        <p className="relative mt-1 text-[11.5px] font-medium opacity-70">Örnek hesap</p>
        <div className="relative mt-3 flex h-9 items-center justify-center rounded-full bg-[#05222b] text-[12.5px] font-semibold text-white">Para çek</div>
      </div>
    </div>
  );
}

/* ── Kampanyalar: poster kartlar ── */
function Kampanyalar({ liste, katilimlar }: { liste: Kampanya[]; katilimlar: string[] }) {
  const [tur, setTur] = useState<"hepsi" | KampanyaTur>("hepsi");
  const gorunen = liste.filter((k) => tur === "hepsi" || k.tur === tur);
  const secenek = [{ id: "hepsi" as const, ad: "Tümü", n: liste.length }, ...(["goruntulenme", "gorev", "yarisma"] as KampanyaTur[]).map((t) => ({ id: t, ad: TUR_AD[t], n: liste.filter((k) => k.tur === t).length }))];
  return (
    <Bolum baslik="Tüm kampanyalar" sag={
      <LayoutGroup id="earn-tur">
        <div role="radiogroup" className="flex max-w-full overflow-x-auto rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08] [scrollbar-width:none]">
          {secenek.map((o) => (
            <button key={o.id} role="radio" aria-checked={tur === o.id} onClick={() => setTur(o.id)} className="relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium active:scale-[0.97]">
              {tur === o.id && <motion.span layoutId="earn-tur-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
              <span className={cn("relative transition-colors", tur === o.id ? "text-black" : "text-white/60 hover:text-white")}>{o.ad}</span>
              <span className={cn("relative text-[11.5px] tabular-nums", tur === o.id ? "text-black/45" : "text-white/40")}>{o.n}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>
    }>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {gorunen.map((k) => (
            <motion.div key={k.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25 }}>
              <PosterKart k={k} katildi={katilimlar.includes(k.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Bolum>
  );
}

/* ── Ek gelir ── */
function EkGelir() {
  const davetli = useEarn((s) => s.davetliler.filter((d) => d.durum === "abone").length);
  const preset = usePaylasim((x) => x.benimPaylasimlar.filter((p) => p.tur === "preset").length);
  const kartlar = [
    { ad: "Davet ve ortaklık", alt: davetli ? `${davetli} abone davetli` : "Davet ettiklerinin aboneliğinden pay al", ikon: Gift, href: "/earn/davet", g: "/gercek/gorsel/gorsel-karakter-Aria.webp" },
    { ad: "Marketplace", alt: preset ? `${preset} preset yayında` : "Preset'in kullanıldıkça kazan", ikon: Store, href: "/earn/marketplace", g: "/gercek/kesfet/neon-sehir.webp" },
  ];
  return (
    <Bolum baslik="Ek gelir">
      <div className="grid gap-3 sm:grid-cols-2">
        {kartlar.map((k, j) => (
          <motion.div key={k.ad} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + j * 0.06 }}>
            <Link href={k.href} className="group relative flex h-[150px] items-end overflow-hidden rounded-[24px] p-4 ring-1 ring-white/[0.08] transition hover:ring-white/[0.2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={k.g} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-700 group-hover:scale-105 group-hover:opacity-75" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10" />
              <span className="relative flex w-full items-end justify-between gap-3">
                <span className="min-w-0"><span className="flex items-center gap-2 text-[15.5px] font-semibold text-white"><k.ikon className="h-4 w-4 text-[#55d6fd]" />{k.ad}</span><span className="mt-0.5 block text-[12.5px] text-white/65">{k.alt}</span></span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-white backdrop-blur transition group-hover:bg-white group-hover:text-black"><ArrowRight className="h-3.5 w-3.5" /></span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </Bolum>
  );
}
