"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "framer-motion";
import {
  ArrowRight, BadgeCheck, CircleHelp, CornerDownLeft, Eye, Gift, LayoutGrid, Megaphone, Search, Send, ShieldCheck, Sparkles, Store, Trophy, Wallet, X,
} from "lucide-react";
import { useEarn, cuzdan, gonderiHesap } from "@/store/useEarn";
import { useAuth } from "@/store/useAuth";
import { useAuthKapi } from "@/store/useAuthKapi";
import { KURALLAR, kampanyalar, bittiMi, tl, TUR_AD } from "@/lib/earn/kampanyalar";
import { Iskelet } from "@/components/ui/Iskelet";
import { KampanyaKarti, NasilKazanilir, earnBirincil, earnIkincil, odulMetni, useSimdi } from "./ortak";
import { cn } from "@/lib/utils";

export const EARN_MENU = [
  { grup: "Kazan", ogeler: [
    { ad: "Genel bakış", kisa: "Genel", href: "/earn", ikon: LayoutGrid },
    { ad: "Kampanyalar", kisa: "Kampanya", href: "/earn/kampanyalar", ikon: Megaphone },
    { ad: "Gönderilerim", kisa: "Gönderi", href: "/earn/gonderiler", ikon: Send },
  ] },
  { grup: "Ek gelir", ogeler: [
    { ad: "Davet & Ortaklık", kisa: "Davet", href: "/earn/davet", ikon: Gift },
  ] },
  { grup: "Hesap", ogeler: [
    { ad: "Cüzdan", kisa: "Cüzdan", href: "/earn/cuzdan", ikon: Wallet },
    { ad: "Bağlı hesaplar", kisa: "Hesaplar", href: "/earn/hesaplar", ikon: BadgeCheck },
  ] },
  { grup: "Destek", ogeler: [
    { ad: "Yardım", kisa: "Yardım", href: "/earn/yardim", ikon: CircleHelp },
  ] },
];
const DUZ = EARN_MENU.flatMap((g) => g.ogeler);

const aktifMi = (path: string, href: string) => (href === "/earn" ? path === "/earn" : path.startsWith(href));
/** Misafirin de gezebildiği sayfalar; diğerleri hesap ister. */
const ACIK_YOLLAR = ["/earn/kampanyalar", "/earn/yardim"];

/**
 * Earn kabuğu: masaüstünde 84px yapışkan ikon rayı (Gönder, arama, ikon + kısa ad, sayı rozeti, altta seviye halkalı avatar
 * ve üzerine gelince cüzdan özeti; 2026-10-29 seçilen B), mobilde beyaz kayan haplı yatay şerit.
 * Veri localStorage'dan ve "şimdi"den hesaplandığı için içerik yalnız istemcide çizilir
 * (SSR ile uyuşmazlık olmasın); ilk karede iskelet görünür.
 */
export function EarnKabuk({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [hazir, setHazir] = useState(false);
  const [palet, setPalet] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => {
    const tus = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalet((x) => !x); } };
    window.addEventListener("keydown", tus); return () => window.removeEventListener("keydown", tus);
  }, []);
  const girisli = useAuth((s) => s.girisYapildi);
  const sahip = useEarn((s) => s.sahip);
  const email = useAuth((s) => s.kullanici?.email);
  // Gözcü veriyi hesaba bağlayana dek (ilk kare) eski hesabın verisi görünmesin.
  const veriHazir = !girisli || sahip === email;
  const acik = ACIK_YOLLAR.some((y) => path.startsWith(y));
  const sayilar = useSayilar(hazir && girisli && veriHazir);
  const ilkKatilim = useEarn((s) => s.katilimlar[0]);
  const gonderHref = ilkKatilim ? `/earn/kampanyalar/${ilkKatilim}` : "/earn/kampanyalar";

  return (
    <MotionConfig reducedMotion="user">
      <div className="earn-kapsam flex min-h-[calc(100vh-var(--ust-nav))] w-full">
        {/* Ray ekranın sol kenarına yaslı, tam boy (API konsolu gibi); içerik sağda ortalanır. */}
        <aside className="sticky top-[var(--ust-nav)] z-20 hidden h-[calc(100vh-var(--ust-nav))] w-[104px] shrink-0 flex-col items-center border-r border-white/[0.06] pb-4 pt-5 lg:flex">
          <Link href={gonderHref} title="Bağlantı gönder" aria-label="Bağlantı gönder"
            className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-black transition hover:bg-white/90 active:scale-95"><Send className="h-5 w-5" /></Link>
          <span className="mt-1.5 text-[12px] font-medium text-white/80">Gönder</span>
          <button onClick={() => setPalet(true)} title="Ara (Ctrl K)" aria-label="Ara"
            className="mt-3 flex h-10 w-10 items-center justify-center rounded-full text-white/60 ring-1 ring-white/[0.1] transition hover:bg-white/[0.06] hover:text-white"><Search className="h-[18px] w-[18px]" /></button>
          <LayoutGroup id="earn-ray">
            <nav aria-label="Earn menüsü" className="mt-2 flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto py-1 [mask-image:linear-gradient(180deg,transparent,black_10px,black_calc(100%-16px),transparent)] [scrollbar-width:none]">
              {EARN_MENU.map((g, gi) => (
                <div key={g.grup} className="flex w-full flex-col items-center gap-1">
                  {gi > 0 && <span className="my-2 h-px w-8 bg-white/[0.08]" aria-hidden />}
                  {g.ogeler.map((o) => {
                    const a = aktifMi(path, o.href);
                    const sayi = sayilar[o.href];
                    return (
                      <Link key={o.href} href={o.href} aria-current={a ? "page" : undefined} title={o.ad}
                        className="group relative flex w-[88px] flex-col items-center gap-1.5 rounded-[16px] py-2 transition active:scale-[0.96]">
                        {a && <motion.span layoutId="earn-ray-z" className="absolute inset-0 rounded-[16px] bg-white/[0.08]" transition={{ type: "spring", damping: 32, stiffness: 420 }} />}
                        <span className="relative">
                          <o.ikon className={cn("h-[22px] w-[22px] transition-colors", a ? "text-vurgu" : "text-white/60 group-hover:text-white")} strokeWidth={1.8} />
                          {sayi ? <span className="absolute -right-3.5 -top-1.5 min-w-[17px] rounded-full bg-vurgu px-1 text-center text-[10px] font-semibold leading-[16px] text-vurgu-ust">{sayi}</span> : null}
                        </span>
                        <span className={cn("relative w-full truncate px-1 text-center text-[12.5px] leading-tight transition-colors", a ? "font-medium text-white" : "text-white/60 group-hover:text-white")}>{o.kisa}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </LayoutGroup>
          {hazir && girisli && veriHazir && <SeviyeAvatar />}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1320px] px-4 pb-24 pt-5 sm:px-6 lg:px-10 lg:pt-8">
            <MobilSerit path={path} onAra={() => setPalet(true)} />
            {!hazir || (girisli && !veriHazir) ? <IcerikIskeleti /> : girisli || acik ? children : <MisafirKarsilama />}
          </div>
        </div>
      </div>
      <EarnPalet acik={palet} onKapat={() => setPalet(false)} />
    </MotionConfig>
  );
}

/** Menüde gösterilen sayılar: açık kampanya ve süreçteki gönderi. */
function useSayilar(aktif: boolean): Record<string, number> {
  const gonderiler = useEarn((s) => s.gonderiler);
  const simdi = useSimdi(60_000);
  return useMemo(() => {
    const acik = kampanyalar(simdi).filter((k) => !bittiMi(k, simdi)).length;
    const surecte = aktif ? gonderiler.filter((g) => ["inceleme", "kazaniyor", "degerlendirme"].includes(gonderiHesap(g, simdi).durum)).length : 0;
    return { "/earn/kampanyalar": acik, "/earn/gonderiler": surecte };
  }, [gonderiler, simdi, aktif]);
}

function MobilSerit({ path, onAra }: { path: string; onAra: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.querySelector("[aria-current=page]")?.scrollIntoView({ inline: "center", block: "nearest" }); }, [path]);
  return (
    <div className="-mx-4 mb-6 flex items-center gap-2 px-4 sm:-mx-6 sm:px-6 lg:hidden">
      <button onClick={onAra} aria-label="Ara" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-metin-2 ring-1 ring-white/[0.09]"><Search className="h-4 w-4" /></button>
      <LayoutGroup id="earn-mobil">
        <nav ref={ref} aria-label="Earn menüsü" className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
          {DUZ.map((o) => {
            const a = aktifMi(path, o.href);
            return (
              <Link key={o.href} href={o.href} aria-current={a ? "page" : undefined}
                className={cn("relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px]", a ? "font-medium text-black" : "text-metin-2")}>
                {a && <motion.span layoutId="earn-mobil-z" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", damping: 30, stiffness: 400 }} />}
                <o.ikon className="relative h-3.5 w-3.5" /><span className="relative">{o.ad}</span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>
    </div>
  );
}

/** Rayın dibinde seviye halkalı avatar; üzerine gelince cüzdan özeti açılır. */
function SeviyeAvatar() {
  const s = useEarn();
  const simdi = useSimdi();
  const c = cuzdan(s, simdi);
  const avatar = useAuth((a) => a.kullanici?.avatar);
  const [acik, setAcik] = useState(false);
  const oran = c.sonraki ? Math.min(1, (c.seviyeKazanc - c.seviye.minKazanc) / (c.sonraki.minKazanc - c.seviye.minKazanc)) : 1;
  const r = 20, cev = 2 * Math.PI * r;
  return (
    <div className="relative mt-3" onMouseEnter={() => setAcik(true)} onMouseLeave={() => setAcik(false)}>
      <Link href="/earn/cuzdan" aria-label={`Cüzdan: ${tl(c.cekilebilir, true)} çekilebilir, ${c.seviye.ad} seviyesi`} className="relative flex h-11 w-11 transition active:scale-95">
        <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
          <motion.circle cx="22" cy="22" r={r} fill="none" stroke="#55d6fd" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={cev} initial={{ strokeDashoffset: cev }} animate={{ strokeDashoffset: cev * (1 - Math.max(0.04, oran)) }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar || "/gercek/gorsel/gorsel-karakter-Talha.webp"} alt="" className="absolute inset-[5px] h-[34px] w-[34px] rounded-full object-cover" />
      </Link>
      <AnimatePresence>
        {acik && (
          <motion.div initial={{ opacity: 0, x: -6, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -4 }} transition={{ duration: 0.16 }}
            className="absolute bottom-0 left-full z-30 ml-3 w-[230px] rounded-[18px] bg-[#16171a] p-4 ring-1 ring-white/[0.1]">
            <p className="flex items-center justify-between text-[12.5px] text-white/55">Çekilebilir<span className="font-medium text-vurgu">{c.seviye.ad}</span></p>
            <p className="mt-1 text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-white">{tl(c.cekilebilir, true)}</p>
            <p className="text-[12.5px] text-white/50">Bekleyen {tl(c.bekleyen)}</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-vurgu" style={{ width: `${Math.max(3, oran * 100)}%` }} /></div>
            <p className="mt-1.5 text-[12px] text-white/50">{c.sonraki ? `${tl(Math.max(0, c.sonraki.minKazanc - c.seviyeKazanc))} daha kazanınca ${c.sonraki.ad}` : "En üst seviyedesin"}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Ctrl+K: kampanyalar ve sayfalar ── */
const sade = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
type Sonuc = { id: string; tur: string; baslik: string; alt?: string; href: string; ikon?: React.ElementType; gorsel?: string; odul?: string };

/** Earn araması: ana aramanın iOS Spotlight dili (bd-panel, 50px alan, bd-kart gruplar, en iyi eşleşme kartı). */
function EarnPalet({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const girdi = useRef<HTMLInputElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  useEffect(() => { if (acik) { setQ(""); setI(0); setTimeout(() => girdi.current?.focus(), 30); } }, [acik]);

  const kampanyaSonuc = useMemo<Sonuc[]>(() => {
    const simdi = Date.now();
    return kampanyalar(simdi).filter((k) => !bittiMi(k, simdi)).map((k) => { const [o, b] = odulMetni(k); return { id: `k-${k.id}`, tur: "Kampanyalar", baslik: k.ad, alt: `${TUR_AD[k.tur]} · ${o} ${b}`, href: `/earn/kampanyalar/${k.id}`, gorsel: k.kapak, odul: o }; });
  }, []);
  const tum = useMemo<Sonuc[]>(() => [
    ...kampanyaSonuc,
    ...DUZ.map((s) => ({ id: `s-${s.href}`, tur: "Sayfalar", baslik: s.ad, href: s.href, ikon: s.ikon })),
    ...YARDIM.map((y) => ({ ...y, tur: "Yardım", ikon: CircleHelp })),
  ], [kampanyaSonuc]);
  const sorgu = q.trim();
  const sonuc = useMemo(() => { const t = sade(sorgu); return t ? tum.filter((x) => sade(`${x.baslik} ${x.alt ?? ""}`).includes(t)) : []; }, [sorgu, tum]);
  // Boşken klavyeyle gezilen düz liste: sayfa karoları, sonra öne çıkan kampanyalar, sonra yardım.
  const bosListe = useMemo(() => [...tum.filter((x) => x.tur === "Sayfalar"), ...kampanyaSonuc.slice(0, 3), ...tum.filter((x) => x.tur === "Yardım")], [tum, kampanyaSonuc]);
  const gezilen = sorgu ? sonuc : bosListe;
  useEffect(() => setI(0), [sorgu]);
  useEffect(() => { liste.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" }); }, [i]);

  const git = (s: Sonuc | undefined) => { if (!s) return; onKapat(); router.push(s.href); };
  const tus = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight" && !sorgu) { e.preventDefault(); setI((x) => Math.min(gezilen.length - 1, x + 1)); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft" && !sorgu) { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); git(gezilen[i]); }
    else if (e.key === "Escape") onKapat();
  };
  const idx = (s: Sonuc) => gezilen.indexOf(s);

  if (typeof document === "undefined") return null;
  const enIyi = sonuc[0];
  const gruplar = (["Kampanyalar", "Sayfalar", "Yardım"] as const).map((t) => ({ t, ogeler: sonuc.filter((x, j) => x.tur === t && j > 0) })).filter((g) => g.ogeler.length);

  return createPortal(
    <AnimatePresence>
      {acik && (
        <div className="kesfet-tema earn-kapsam fixed inset-0 z-[130] flex items-start justify-center !bg-transparent sm:px-4 sm:pt-[9vh]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onKapat} className="perde absolute inset-0" />
          <motion.div role="dialog" aria-label="Earn'de ara" initial={{ opacity: 0, y: -12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="bd-panel relative flex h-full w-full flex-col overflow-hidden sm:h-[min(76vh,620px)] sm:max-w-[680px] sm:rounded-[28px]">
            <div className="flex shrink-0 items-center gap-2.5 px-3 pb-2 pt-3 sm:px-3.5 sm:pt-3.5">
              <label className="flex h-[50px] min-w-0 flex-1 items-center gap-2.5 rounded-[16px] bg-[#232326] px-3.5 transition-colors focus-within:bg-[#28282b]">
                <Search className="h-[19px] w-[19px] shrink-0 text-white/50" strokeWidth={2.2} />
                <input ref={girdi} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={tus} placeholder="Kampanya, sayfa ya da yardım ara"
                  className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-white outline-none placeholder:text-white/40" aria-label="Ara" />
                <AnimatePresence>{q && (
                  <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => { setQ(""); girdi.current?.focus(); }} aria-label="Temizle"
                    className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white/35 text-[#232326] hover:bg-white/55"><X className="h-3 w-3" strokeWidth={3} /></motion.button>
                )}</AnimatePresence>
              </label>
              <button onClick={onKapat} className="shrink-0 px-1 text-[16px] font-medium text-[#55d6fd] active:opacity-60 sm:hidden">Vazgeç</button>
            </div>

            <div ref={liste} className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin] sm:px-3.5">
              {!sorgu ? (
                <>
                  <h3 className="mb-1.5 mt-2 px-1.5 text-[15px] font-bold tracking-[-0.01em] text-white">Sayfalar</h3>
                  <div className="bd-kart grid grid-cols-3 gap-y-3 rounded-[20px] px-1 py-3.5 sm:grid-cols-5">
                    {bosListe.filter((x) => x.tur === "Sayfalar").map((s) => {
                      const j = idx(s), a = j === i, I = s.ikon!;
                      return (
                        <button key={s.id} data-i={j} onMouseEnter={() => setI(j)} onClick={() => git(s)} className="group flex flex-col items-center gap-1.5 rounded-[14px] px-0.5 outline-none">
                          <span className={cn("flex h-[52px] w-[52px] items-center justify-center rounded-[16px] transition-colors group-active:scale-[0.92]", a ? "bg-white text-black" : "bg-[#2f2f33] text-white")}><I className="h-[22px] w-[22px]" strokeWidth={1.9} /></span>
                          <span className={cn("max-w-full truncate text-[11.5px] font-medium", a ? "text-white" : "text-white/70")}>{s.baslik}</span>
                        </button>
                      );
                    })}
                  </div>
                  <h3 className="mb-1.5 mt-4 flex items-baseline justify-between px-1.5 text-[15px] font-bold tracking-[-0.01em] text-white">Öne çıkan kampanyalar<button onClick={() => git({ id: "t", tur: "", baslik: "", href: "/earn/kampanyalar" })} className="text-[13px] font-medium text-[#55d6fd] hover:opacity-80">Tümü</button></h3>
                  <div className="grid grid-cols-3 gap-2">
                    {bosListe.filter((x) => x.tur === "Kampanyalar").map((s) => {
                      const j = idx(s), a = j === i;
                      return (
                        <button key={s.id} data-i={j} onMouseEnter={() => setI(j)} onClick={() => git(s)} className={cn("group relative aspect-[4/5] overflow-hidden rounded-[18px] text-left ring-2 transition", a ? "ring-white" : "ring-transparent")}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.gorsel} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <span className="absolute inset-x-2.5 bottom-2.5"><span className="block text-[17px] font-semibold leading-none text-white">{s.odul}</span><span className="mt-1 line-clamp-2 text-[12px] leading-snug text-white/80">{s.baslik}</span></span>
                        </button>
                      );
                    })}
                  </div>
                  <h3 className="mb-1.5 mt-4 px-1.5 text-[15px] font-bold tracking-[-0.01em] text-white">Yardım</h3>
                  <div className="bd-kart overflow-hidden rounded-[20px]">
                    {bosListe.filter((x) => x.tur === "Yardım").map((s, n) => { const j = idx(s); return <Satir key={s.id} s={s} a={j === i} j={j} cizgi={n > 0} q="" onEnter={() => setI(j)} onClick={() => git(s)} />; })}
                  </div>
                </>
              ) : !sonuc.length ? (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center px-6 pb-10 pt-20 text-center">
                  <p className="text-[20px] font-bold tracking-[-0.01em] text-white/80">Sonuç yok</p>
                  <p className="mt-1.5 max-w-[340px] text-[14px] leading-snug text-white/45">&ldquo;{sorgu}&rdquo; ile eşleşen kampanya, sayfa ya da yardım konusu bulunamadı.</p>
                  <button onClick={() => git({ id: "t", tur: "", baslik: "", href: "/earn/kampanyalar" })} className="mt-4 h-9 rounded-full bg-white px-4 text-[13.5px] font-semibold text-[#0b0b0d] active:scale-[0.97]">Tüm kampanyalar</button>
                </motion.div>
              ) : (
                <>
                  <h3 className="mb-1.5 mt-2 px-1.5 text-[15px] font-bold tracking-[-0.01em] text-white">En iyi eşleşme</h3>
                  <motion.div data-i={0} onMouseEnter={() => setI(0)} className={cn("rounded-[22px] p-3.5 transition-colors", i === 0 ? "bg-[#2c2c30] ring-1 ring-white/[0.08]" : "bd-kart")}>
                    <button onClick={() => git(enIyi)} className="flex w-full items-center gap-3.5 text-left">
                      {enIyi.gorsel
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={enIyi.gorsel} alt="" className="h-[58px] w-[58px] shrink-0 rounded-[16px] object-cover" />
                        : (() => { const I = enIyi.ikon ?? Megaphone; return <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[16px] bg-[#2f2f33] text-white"><I className="h-6 w-6" strokeWidth={1.9} /></span>; })()}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[17px] font-semibold tracking-[-0.01em] text-white"><Vurgu metin={enIyi.baslik} q={sorgu} /></span>
                        <span className="mt-0.5 block truncate text-[13.5px] text-white/55">{enIyi.alt ?? enIyi.tur}</span>
                      </span>
                    </button>
                    <div className="mt-3 flex gap-2 pl-[72px]">
                      <button onClick={() => git(enIyi)} className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#0b0b0d] transition-transform active:scale-[0.96]">{enIyi.tur === "Kampanyalar" ? "Kampanyayı aç" : "Aç"}<ArrowRight className="h-3.5 w-3.5" /></button>
                      <span className="flex h-8 items-center gap-1 text-[12.5px] text-white/45"><CornerDownLeft className="h-3.5 w-3.5" />Enter</span>
                    </div>
                  </motion.div>
                  {gruplar.map((g) => (
                    <div key={g.t} className="mt-4">
                      <h3 className="mb-1.5 px-1.5 text-[15px] font-bold tracking-[-0.01em] text-white">{g.t}</h3>
                      <div className="bd-kart overflow-hidden rounded-[20px]">
                        {g.ogeler.map((s, n) => { const j = idx(s); return <Satir key={s.id} s={s} a={j === i} j={j} cizgi={n > 0} q={sorgu} onEnter={() => setI(j)} onClick={() => git(s)} />; })}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const YARDIM = [
  { id: "y-seviye", baslik: "Seviyeler ve bonuslar", alt: "Kazandıkça artan yüzdeler", href: "/earn/yardim#seviyeler" },
  { id: "y-takvim", baslik: "Ödeme takvimi", alt: "Gönderiden cüzdana adımlar", href: "/earn/yardim" },
  { id: "y-hesap", baslik: "Hesabımı nasıl doğrularım?", alt: "Bio koduyla doğrulama", href: "/earn/hesaplar" },
];

function Vurgu({ metin, q }: { metin: string; q: string }) {
  const j = q ? sade(metin).indexOf(sade(q)) : -1;
  if (j < 0) return <>{metin}</>;
  return <>{metin.slice(0, j)}<mark className="bg-transparent text-[#55d6fd]">{metin.slice(j, j + q.length)}</mark>{metin.slice(j + q.length)}</>;
}

function Satir({ s, a, j, cizgi, q, onEnter, onClick }: { s: Sonuc; a: boolean; j: number; cizgi: boolean; q: string; onEnter: () => void; onClick: () => void }) {
  const I = s.ikon ?? Megaphone;
  return (
    <button data-i={j} onMouseEnter={onEnter} onClick={onClick} className={cn("relative flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors", a && "bg-white/[0.06]")}>
      {cizgi && <span className="absolute left-[60px] right-0 top-0 h-px bg-white/[0.06]" />}
      {s.gorsel
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={s.gorsel} alt="" className="h-9 w-9 shrink-0 rounded-[10px] object-cover" />
        : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#2f2f33] text-white"><I className="h-4 w-4" strokeWidth={1.9} /></span>}
      <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-medium text-white"><Vurgu metin={s.baslik} q={q} /></span>{s.alt && <span className="block truncate text-[12.5px] text-white/50">{s.alt}</span>}</span>
      {a && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-white/40" />}
    </button>
  );
}

/** Giriş yapmamış kullanıcıya Earn tanıtımı + giriş. */
function MisafirKarsilama() {
  const ac = useAuthKapi((s) => s.ac);
  const simdi = Date.now();
  const acikKampanya = kampanyalar(simdi).filter((k) => !bittiMi(k, simdi));
  const enYuksekOran = Math.max(...acikKampanya.map((k) => k.oran ?? 0));
  const girisYap = () => ac({ baslik: "Kazanmaya başlamak için giriş yap", altBaslik: "Ücretsiz hesabınla kampanyalara katıl, ürettiğinle kazan." });
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-[600px]">
          <h1 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[38px]">Ürettiğin izlendikçe kazan.</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-metin-2">
            Kampanyaya katıl, Vayra&apos;da üret, paylaş. Her 1.000 görüntülenme için {tl(enYuksekOran)}&apos;a kadar öde; kazancını IBAN ya da Papara&apos;ya çek.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/earn/kampanyalar" className={earnIkincil}>Kampanyaları gör</Link>
          <motion.button whileTap={{ scale: 0.97 }} onClick={girisYap} className={earnBirincil}>Ücretsiz başla<ArrowRight className="h-4 w-4" /></motion.button>
        </div>
      </motion.div>

      <div className="mt-7 grid grid-cols-1 gap-px overflow-hidden rounded-[22px] bg-white/[0.06] ring-1 ring-white/[0.08] sm:grid-cols-3">
        {[
          { ikon: Megaphone, b: `${acikKampanya.length} açık kampanya`, a: "Görüntülenme, görev ve yarışma" },
          { ikon: Eye, b: "Görüntülenme başına ödeme", a: `${KURALLAR.incelemeSaat} saatte onay, ${KURALLAR.kazanmaGun} gün kazanç` },
          { ikon: ShieldCheck, b: "Güvenli ödeme", a: `En az ${tl(KURALLAR.minCekim)}, IBAN veya Papara` },
        ].map((x) => (
          <div key={x.b} className="flex items-center gap-3 bg-[#0d0e10] p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vurgu/12 text-vurgu"><x.ikon className="h-[18px] w-[18px]" /></span>
            <span><span className="block text-[14.5px] font-medium text-white">{x.b}</span><span className="block text-[12.5px] text-metin-2">{x.a}</span></span>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-[17px] font-semibold text-white">Nasıl kazanırsın</h2>
      <NasilKazanilir adimlar={[
        { ad: "Kampanyaya katıl", alt: "Brief'i oku, üretim kitini aç." },
        { ad: "Vayra'da üret, paylaş", alt: "Instagram, TikTok, YouTube ya da X'te yayınla." },
        { ad: "Bağlantını gönder", alt: "Vayra ekibi inceler; karar bildirim olarak gelir." },
        { ad: "İzlendikçe kazan", alt: `${KURALLAR.kazanmaGun} gün boyunca her 1.000 görüntülenme ödenir.` },
      ]} />

      <div className="mb-3 mt-10 flex items-end justify-between"><h2 className="text-[17px] font-semibold text-white">Açık kampanyalar</h2><Link href="/earn/kampanyalar" className="text-[13px] text-metin-2 hover:text-white">Tümü</Link></div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {acikKampanya.map((k) => <KampanyaKarti key={k.id} k={k} simdi={simdi} raf />)}
      </div>
    </div>
  );
}

/**
 * Yükleme iskeleti: Genel sayfasında kampanya vitrininin birebir izdüşümü (aynı kart, aynı başlık, beş kartlık
 * akış, künye ve üç değer); diğer sayfalarda başlık ve içerik kartı. Sabit metinler gerçek, veriler parıltılı.
 */
function IcerikIskeleti() {
  const path = usePathname();
  if (path === "/earn") {
    const kartlar = [-2, -1, 0, 1, 2];
    return (
      <div aria-busy="true" aria-label="Yükleniyor">
        <section className="relative overflow-hidden rounded-[34px] bg-[#08090b] pb-7 pt-9 ring-1 ring-white/[0.08] sm:pt-11">
          <div className="relative flex flex-col items-center px-5 text-center">
            <Iskelet className="h-3.5 w-28 rounded-full" />
            <h1 className="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-[44px]">Bugün ne üretip <span className="bg-gradient-to-r from-[#55d6fd] to-[#a5ecff] bg-clip-text text-transparent">kazanacaksın?</span></h1>
          </div>
          <div className="relative mt-8 h-[340px] [perspective:1600px] sm:mt-10 sm:h-[400px]">
            {kartlar.map((d) => (
              <span key={d} aria-hidden className="iskelet-parca absolute left-1/2 top-0 aspect-[3/4] h-full rounded-[28px] ring-1 ring-white/[0.1] [--akis-ara:150px] sm:[--akis-ara:250px]"
                style={{ transform: `translateX(calc(-50% + ${d} * var(--akis-ara))) translateZ(${-Math.abs(d) * 90}px) rotateY(${d * -20}deg)`, opacity: d === 0 ? 1 : Math.abs(d) === 1 ? 0.62 : 0.28, zIndex: 10 - Math.abs(d) }} />
            ))}
          </div>
          <div className="relative mx-auto mt-8 flex max-w-[680px] flex-col items-center px-5">
            <Iskelet className="h-7 w-80 max-w-full rounded-full" />
            <Iskelet className="mt-3 h-3.5 w-[420px] max-w-full rounded-full" />
            <Iskelet className="mt-2 h-3.5 w-72 max-w-full rounded-full" />
            <dl className="mt-6 grid w-full max-w-[560px] grid-cols-3 divide-x divide-white/[0.09] text-center">
              {["Ödeme", "Bitiş", "Katılımcı"].map((a) => (
                <div key={a} className="flex flex-col items-center px-2"><dt className="text-[12.5px] text-white/50">{a}</dt><dd><Iskelet className="mt-2 h-7 w-20 rounded-lg" /></dd><dd><Iskelet className="mt-2 h-2.5 w-16 rounded-full" /></dd></div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    );
  }
  return (
    <div aria-busy="true" aria-label="Yükleniyor">
      <Iskelet className="h-9 w-64 rounded-xl" />
      <Iskelet className="mt-3 h-4 w-96 max-w-full rounded-full" />
      <Iskelet className="mt-8 h-[420px] rounded-[28px]" />
    </div>
  );
}
