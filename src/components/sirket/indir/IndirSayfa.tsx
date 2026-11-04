"use client";

/**
 * Uygulamalar (yakında) — ana sayfanın dilinde: akan gerçek üretim duvarı, dönen kelimeli dev başlık,
 * kenarında ışık dönen haber kutusu; altta ana sayfadaki "Ne yapmak istiyorsun?" kalıbında platform
 * listesi + sabit cihaz sahnesi, çıkış yolu, bento özellikler, bugün kurma, SSS ve görselli kapanış.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight, ArrowUp, Bell, BellRing, Camera, Cloud, Command, Cpu, Download, FolderSync, HardDriveDownload, Keyboard, LayoutGrid, Lock, Mic, Minus,
  MousePointerClick, Plus, Share, Square, SquarePlus, Upload, X, Zap,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useKurulum } from "@/lib/scKurulum";
import { cn } from "@/lib/utils";
import { AndroidIcon, AppleIcon, GooglePlayIcon, WindowsIcon } from "./Logolar";

type Platform = "mac" | "windows" | "ios" | "android";
const ease = [0.22, 1, 0.36, 1] as const;
const G = "/gercek/galeri";
const SURE_MS = 6500;

const PLATFORMLAR: {
  id: Platform; ad: string; kelime: string; cihaz: string; logo: React.FC<{ className?: string }>; asama: string; durum: string; masaustu: boolean;
  aciklama: string; gereksinim: [string, string][]; ozellikler: [React.ElementType, string][];
}[] = [
  {
    id: "mac", ad: "macOS", kelime: "Mac'te", cihaz: "Mac için", logo: AppleIcon, masaustu: true, asama: "Kapalı beta", durum: "İlk davetler listedekilere",
    aciklama: "Menü çubuğundan açılan istem kutusu, Finder'dan sürükle bırak ve Apple silicon'da akıcı önizleme.",
    gereksinim: [["Sistem", "macOS 13 ve sonrası"], ["İşlemci", "Apple silicon ve Intel"], ["Boyut", "Yaklaşık 400 MB"]],
    ozellikler: [[Command, "Kısayolla her yerden üret"], [MousePointerClick, "Finder'dan sürükle bırak"], [Cpu, "Yerel önizleme"]],
  },
  {
    id: "windows", ad: "Windows", kelime: "Windows'ta", cihaz: "Windows bilgisayarlar için", logo: WindowsIcon, masaustu: true, asama: "Geliştiriliyor", durum: "macOS betasından sonra",
    aciklama: "Hangi uygulamadaysan açılan genel kısayol, izlenen klasörler ve uzun işler bitince sistem bildirimi.",
    gereksinim: [["Sistem", "Windows 10 ve 11, 64 bit"], ["İşlemci", "x64 ve ARM64"], ["Boyut", "Yaklaşık 450 MB"]],
    ozellikler: [[Keyboard, "Genel kısayol"], [FolderSync, "Klasör izleme"], [BellRing, "Sistem bildirimi"]],
  },
  {
    id: "ios", ad: "iOS", kelime: "iPhone'da", cihaz: "iPhone ve iPad için", logo: AppleIcon, masaustu: false, asama: "Tasarlanıyor", durum: "Masaüstünden sonra",
    aciklama: "Kameradan başla, Fotoğraflar'dan paylaş menüsüyle gönder, son üretimlerini ana ekran araç takımında gör.",
    gereksinim: [["Sistem", "iOS 17 ve sonrası"], ["Cihaz", "iPhone ve iPad"], ["Mağaza", "App Store"]],
    ozellikler: [[Camera, "Kameradan referans"], [Share, "Paylaş menüsü"], [LayoutGrid, "Ana ekran araç takımı"]],
  },
  {
    id: "android", ad: "Android", kelime: "Android'de", cihaz: "Telefon ve tabletler için", logo: AndroidIcon, masaustu: false, asama: "Tasarlanıyor", durum: "iOS ile birlikte",
    aciklama: "Konuşarak istem yaz, galeriden doğrudan gönder, üretim bitince anlık bildirim al.",
    gereksinim: [["Sistem", "Android 10 ve sonrası"], ["Cihaz", "Telefon ve tablet"], ["Mağaza", "Google Play"]],
    ozellikler: [[Mic, "Sesle istem"], [Share, "Paylaşım hedefi"], [BellRing, "Anlık bildirim"]],
  },
];
const pBul = (id: Platform) => PLATFORMLAR.find((p) => p.id === id)!;
/** Apple logosu tek renk (currentColor); beyaz zeminde siyaha döner. Windows ve Android renkli kalır. */
const tekRenk = (id: Platform) => id === "mac" || id === "ios";

const SSS: [string, string][] = [
  ["Uygulamalar ücretli mi?", "Hayır. Uygulamaları indirmek ücretsiz; mevcut planın ve kredilerin olduğu gibi geçerli. Ayrı bir abonelik yok."],
  ["Hangi uygulama önce çıkacak?", "Sıra macOS, Windows, ardından iOS ve Android. macOS kapalı betasına davetler haber listesindekilere, kayıt sırasına göre gönderilecek."],
  ["Web'deki üretimlerim uygulamada olacak mı?", "Evet. Aynı hesapla giriş yaptığında kitaplığın, projelerin, elementlerin ve kredin olduğu gibi gelir."],
  ["Beklerken telefonda nasıl kullanırım?", "Vayra'yı bugün ana ekranına ekleyebilirsin; uygulama gibi tam ekran açılır. Adımlar bu sayfadaki Bugün kur bölümünde."],
  ["Haber listesine hangi bilgiler kaydediliyor?", "Yalnız e-posta adresin ve seçtiğin platformlar. Uygulama çıkınca bir kez haber veririz; istediğin zaman listeden çıkabilirsin."],
  ["Kurumsal dağıtım olacak mı?", "Evet. Windows ve macOS için toplu kurulum paketleri ve yönetici ayarları planlanıyor. Ayrıntı için kurumsal ekibimize yazabilirsin."],
];

const LISTE_ANAHTAR = "vayra-uygulama-listesi";
type Kayit = { eposta: string; platformlar: Platform[]; tarih: number };

/* ═════════════ Haber listesi (paylaşılan durum) ═════════════ */

function useHaberListesi() {
  const [secili, setSecili] = useState<Platform[]>(["mac"]);
  const [eposta, setEposta] = useState("");
  const [kayit, setKayit] = useState<Kayit | null>(null);
  const [cihaz, setCihaz] = useState<Platform | null>(null);
  useEffect(() => {
    try { const k = localStorage.getItem(LISTE_ANAHTAR); if (k) setKayit(JSON.parse(k) as Kayit); } catch { /* depolama yok */ }
    const ua = navigator.userAgent;
    const c: Platform | null = /iphone|ipad|ipod/i.test(ua) ? "ios" : /android/i.test(ua) ? "android" : /mac/i.test(ua) ? "mac" : /win/i.test(ua) ? "windows" : null;
    setCihaz(c); if (c) setSecili([c]);
  }, []);
  const gecerli = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(eposta.trim());
  const katil = () => {
    if (!secili.length) return void toast.error("En az bir platform seç", { description: "Hangi uygulama çıkınca haber vereceğimizi bilelim." });
    if (!gecerli) return void toast.error("E-posta adresini kontrol et", { description: "Örnek: ad@alanadi.com" });
    const k: Kayit = { eposta: eposta.trim().toLowerCase(), platformlar: secili, tarih: Date.now() };
    try { localStorage.setItem(LISTE_ANAHTAR, JSON.stringify(k)); } catch { /* depolama yok */ }
    setKayit(k);
    toast.success("Haber listesindesin", { description: `${secili.map((p) => pBul(p).ad).join(", ")} çıkınca ${k.eposta} adresine yazacağız.` });
  };
  const ayril = () => { try { localStorage.removeItem(LISTE_ANAHTAR); } catch { /* depolama yok */ } setKayit(null); toast("Haber listesinden çıktın", { description: "Fikrini değiştirirsen yeniden ekleyebilirsin." }); };
  const duzenle = () => { if (!kayit) return; setSecili(kayit.platformlar); setEposta(kayit.eposta); setKayit(null); };
  const ekle = (p: Platform) => { if (kayit) { setSecili(Array.from(new Set([...kayit.platformlar, p]))); setEposta(kayit.eposta); setKayit(null); } else setSecili((l) => (l.includes(p) ? l : [...l, p])); };
  const degistir = (p: Platform) => setSecili((l) => (l.includes(p) ? l.filter((x) => x !== p) : [...l, p]));
  return { secili, degistir, eposta, setEposta, gecerli, kayit, katil, ayril, duzenle, ekle, cihaz };
}
type Liste = ReturnType<typeof useHaberListesi>;

/** Ana sayfadaki komut kutusunun karşılığı: üstte platform sekmeleri, ortada e-posta, sağda yuvarlak gönder. */
function HaberKutusu({ l }: { l: Liste }) {
  return (
    <div className="relative rounded-[31px] p-px">
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[31px]"><span className="hero-kenar absolute left-1/2 top-1/2 aspect-square w-[160%]" /></span>
      <div className="relative rounded-[30px] bg-[#141416] p-2.5 sm:p-3">
        <AnimatePresence mode="wait" initial={false}>
          {l.kayit ? (
            <motion.div key="tamam" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex flex-wrap items-center gap-3 p-2 text-left">
              <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 16 }} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black"><BellRing className="h-5 w-5" /></motion.span>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold text-white">Listedesin, çıkınca ilk sen öğreneceksin.</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13.5px] text-white/55">
                  <span className="break-all">{l.kayit.eposta}</span>
                  {l.kayit.platformlar.map((p) => { const x = pBul(p); return <span key={p} className="flex items-center gap-1 text-white/80"><x.logo className="h-3.5 w-3.5 text-white" />{x.ad}</span>; })}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={l.duzenle} className="h-10 rounded-full bg-white/[0.07] px-4 text-[13.5px] font-medium text-white transition hover:bg-white/[0.12] active:scale-95">Değiştir</button>
                <button onClick={l.ayril} className="h-10 rounded-full px-3 text-[13.5px] font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white">Listeden çık</button>
              </div>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={(e) => { e.preventDefault(); l.katil(); }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <div className="grid grid-cols-2 gap-1 sm:flex">
                {PLATFORMLAR.map((p) => {
                  const s = l.secili.includes(p.id);
                  return (
                    <button type="button" key={p.id} onClick={() => l.degistir(p.id)} aria-pressed={s}
                      className={cn("flex h-10 shrink-0 items-center gap-2 rounded-full pl-2.5 pr-3.5 text-[14px] font-medium transition-colors active:scale-[0.97]", s ? "bg-white text-black" : "bg-white/[0.04] text-white/65 hover:bg-white/[0.08] hover:text-white sm:bg-transparent")}>
                      <p.logo className={cn("h-[18px] w-[18px]", s && tekRenk(p.id) ? "text-black" : "text-white")} />{p.ad}
                      {l.cihaz === p.id && <span className={cn("rounded-full px-1.5 text-[10.5px] font-semibold", s ? "bg-black/10 text-black/60" : "bg-white/[0.08] text-white/55")}>Bu cihaz</span>}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-[22px] bg-white/[0.04] p-1.5 pl-4 ring-1 ring-inset ring-white/[0.07] transition-shadow focus-within:ring-white/25">
                <input type="email" value={l.eposta} onChange={(e) => l.setEposta(e.target.value)} placeholder="E-posta adresin" aria-label="E-posta adresin" autoComplete="email"
                  className="h-11 min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/40" />
                <motion.button whileTap={{ scale: 0.92 }} type="submit" disabled={!l.secili.length}
                  className={cn("flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-[14.5px] font-semibold transition-colors disabled:opacity-40", l.gecerli ? "bg-white text-black" : "bg-white/[0.1] text-white")}>
                  Haber ver<ArrowUp className="h-4 w-4" />
                </motion.button>
              </div>
              <p className="mt-2 px-2 text-left text-[12.5px] text-white/45">Yalnız uygulama çıkınca bir kez yazarız. Ücretsiz, istediğin an çıkabilirsin.</p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═════════════ Akan duvar (ana sayfadaki gibi) ═════════════ */

const SIRALAR = [
  ["sinematik6", "portre4", "3d4", "urun11", "manzara7", "sinematik9", "soyut7", "portre11"],
  ["3d6", "manzara4", "portre9", "urun2", "sinematik4", "3d8", "manzara8", "urun8"],
  ["soyut8", "sinematik7", "3d12", "portre1", "urun5", "manzara1", "3d5", "sinematik1"],
  ["manzara10", "urun12", "portre6", "3d10", "sinematik11", "soyut3", "manzara3", "portre12"],
];
function Duvar() {
  const az = useReducedMotion();
  const mx = useMotionValue(0), my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 40, damping: 18 }), y = useSpring(my, { stiffness: 40, damping: 18 });
  useEffect(() => {
    if (az) return;
    const f = (e: PointerEvent) => { mx.set((e.clientX / innerWidth - 0.5) * -24); my.set((e.clientY / innerHeight - 0.5) * -14); };
    addEventListener("pointermove", f); return () => removeEventListener("pointermove", f);
  }, [az, mx, my]);
  return (
    <motion.div style={{ x, y }} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, ease }}
      className="absolute left-1/2 top-1/2 -ml-[1600px] -mt-[560px] h-[1120px] w-[3200px]">
      <div className="flex h-full rotate-[-8deg] flex-col justify-center gap-4">
        {SIRALAR.map((s, i) => (
          <div key={i} className={cn("flex w-max gap-4 pr-4", i % 2 ? "kesfet-kay-ters" : "kesfet-kay")} style={{ animationDuration: `${120 + i * 19}s`, marginLeft: `${(i % 3) * -120}px` }}>
            {[...s, ...s].map((g, j) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={j} src={`${G}/${g}.webp`} alt="" loading="lazy" decoding="async" className={cn("h-[232px] shrink-0 rounded-[20px] object-cover", j % 3 === 1 ? "w-[160px]" : "w-[310px]")} />
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DonenKelime({ metin }: { metin: string }) {
  return (
    <motion.span layout transition={{ type: "spring", stiffness: 260, damping: 30 }} className="relative inline-flex overflow-hidden pb-[0.12em] align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={metin} initial={{ y: "85%", opacity: 0, filter: "blur(12px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: "-85%", opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.6, ease }} className="hero-isilti whitespace-nowrap">{metin}</motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

/* ═════════════ Cihaz maketleri ═════════════ */

function Masaustu({ p }: { p: Platform }) {
  const mac = p === "mac";
  return (
    <div className="w-full">
      <div className="rounded-t-[16px] bg-[#2a2b2f] p-[6px] ring-1 ring-inset ring-white/[0.12]">
        <div className="overflow-hidden rounded-[10px] bg-black">
          <div className={cn("flex h-[24px] items-center border-b border-white/[0.06] px-2.5", mac ? "bg-[#141416]" : "bg-[#1b1b1d]")}>
            {mac ? <span className="flex gap-1.5">{["#ff5f57", "#febc2e", "#28c840"].map((r) => <span key={r} className="h-[8px] w-[8px] rounded-full" style={{ background: r }} />)}</span>
              : <span className="flex items-center gap-1.5 text-[9.5px] text-white/60">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/brand/vayra-mark.png" alt="" className="h-3 w-3" />Vayra</span>}
            {mac && <span className="mx-auto pr-10 text-[9.5px] font-medium text-white/45">Vayra</span>}
            {!mac && <span className="ml-auto flex items-center gap-3 text-white/55"><Minus className="h-3 w-3" /><Square className="h-2.5 w-2.5" /><X className="h-3 w-3" /></span>}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mac ? "/basin/urun-video-studyosu.png" : "/basin/urun-gorsel-studyosu.png"} alt={`Vayra ${mac ? "macOS" : "Windows"} uygulaması`} className="block aspect-[16/10] w-full object-cover object-top" />
        </div>
      </div>
      <div className="relative mx-[-5%] h-[14px] rounded-b-[14px] bg-gradient-to-b from-[#3a3b40] to-[#1d1e21]"><span className="absolute left-1/2 top-0 h-[5px] w-[16%] -translate-x-1/2 rounded-b-[6px] bg-[#16171a]" /></div>
    </div>
  );
}

const TEL = { ios: ["portre4", "sinematik6", "3d4", "urun11", "manzara7", "portre9"], android: ["3d6", "urun2", "sinematik4", "portre11", "manzara4", "soyut7"] };
function Telefon({ p }: { p: "ios" | "android" }) {
  const ios = p === "ios";
  return (
    <div className={cn("relative bg-[#232427] p-[6px] ring-1 ring-inset ring-white/[0.14]", ios ? "rounded-[38px]" : "rounded-[30px]")}>
      <div className={cn("relative overflow-hidden bg-[#0b0b0c]", ios ? "rounded-[33px]" : "rounded-[25px]")}>
        {ios ? <span className="absolute left-1/2 top-[8px] z-10 h-[18px] w-[70px] -translate-x-1/2 rounded-full bg-black" />
          : <span className="absolute left-1/2 top-[9px] z-10 h-[10px] w-[10px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />}
        <div className="flex items-center justify-between px-5 pt-2 text-[9.5px] font-semibold text-white/80"><span>9:41</span><span className="h-1.5 w-3 rounded-sm bg-white/70" /></div>
        <div className="px-3 pb-3 pt-5">
          <div className="flex items-center justify-between"><span className="text-[14px] font-semibold text-white">Kitaplık</span><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black"><Plus className="h-3.5 w-3.5" /></span></div>
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            {TEL[p].map((g, i) => (
              <motion.div key={g} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease }} className={cn("overflow-hidden rounded-[10px] bg-white/[0.05]", i % 3 === 0 ? "aspect-[3/4]" : "aspect-square")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${G}/${g}.webp`} alt="" className="h-full w-full object-cover" />
              </motion.div>
            ))}
          </div>
          <div className="cam-istemci mt-2.5 flex items-center gap-2 rounded-full p-1 pl-3">
            <span className="min-w-0 flex-1 whitespace-nowrap text-[10.5px] text-white/50">Bir cümle yaz</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black"><ArrowUp className="h-3 w-3" /></span>
          </div>
          {!ios && <span className="mx-auto mt-2.5 block h-1 w-16 rounded-full bg-white/30" />}
        </div>
      </div>
    </div>
  );
}

/** Seçili platformun sahnesi: cihaz + yüzen özellik hapları. */
function Sahne({ p }: { p: (typeof PLATFORMLAR)[number] }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 pb-20 sm:p-10 sm:pb-20">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,rgba(255,255,255,0.07),transparent)]" />
      <motion.div className={cn("relative", p.masaustu ? "w-[84%]" : "w-[min(62%,250px)] sm:w-[min(44%,250px)]")} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease }}>
        {p.masaustu ? <Masaustu p={p.id} /> : <Telefon p={p.id as "ios" | "android"} />}
      </motion.div>
      {p.ozellikler.map(([I, a], j) => (
        <motion.span key={a} initial={{ opacity: 0, y: 10, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.35 + j * 0.12, duration: 0.5, ease }}
          className={cn("absolute flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-black/60 pl-1.5 pr-3.5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl max-sm:hidden",
            ["left-[4%] top-[10%]", "right-[4%] top-[34%]", "bottom-[22%] left-[6%]"][j])}>
          <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 3 + j, repeat: Infinity, ease: "easeInOut" }} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black"><I className="h-3.5 w-3.5" /></motion.span>{a}
        </motion.span>
      ))}
    </div>
  );
}

const Baslik = ({ children, alt }: { children: React.ReactNode; alt: string }) => (
  <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease }} className="mb-10 sm:mb-14">
    <h2 className="text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-[56px]">{children}</h2>
    <p className="mt-3 max-w-[560px] text-[16px] leading-relaxed text-white/60 sm:text-[17px]">{alt}</p>
  </motion.div>
);

/* ═════════════ Sayfa ═════════════ */

export function IndirSayfa() {
  const l = useHaberListesi();
  const az = useReducedMotion();
  const kurulum = useKurulum();

  const [kelimeI, setKelimeI] = useState(0);
  useEffect(() => { if (az) return; const t = setInterval(() => setKelimeI((i) => (i + 1) % PLATFORMLAR.length), 2800); return () => clearInterval(t); }, [az]);
  const hero = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
  const icY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const icOp = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const [pi, setPi] = useState(0);
  const [dur, setDur] = useState(false);
  const [gorunur, setGorunur] = useState(false);
  const kok = useRef<HTMLElement>(null);
  useEffect(() => { const el = kok.current; if (!el) return; const io = new IntersectionObserver(([e]) => setGorunur(e.isIntersecting), { threshold: 0.3 }); io.observe(el); return () => io.disconnect(); }, []);
  useEffect(() => { if (dur || !gorunur) return; const t = setTimeout(() => setPi((x) => (x + 1) % PLATFORMLAR.length), SURE_MS); return () => clearTimeout(t); }, [pi, dur, gorunur]);
  useEffect(() => { if (l.cihaz) setPi(PLATFORMLAR.findIndex((p) => p.id === l.cihaz)); }, [l.cihaz]);
  const ap = PLATFORMLAR[pi];
  const sec = (j: number) => { setPi(j); setDur(true); };

  const [kurSekme, setKurSekme] = useState<"ios" | "android" | "masaustu">("masaustu");
  useEffect(() => { if (l.cihaz === "ios" || l.cihaz === "android") setKurSekme(l.cihaz); }, [l.cihaz]);
  const KUR_ADIM = useMemo(() => ({
    ios: { ad: "iPhone", tarayici: "Safari ile", adimlar: [[Share, "Alttaki Paylaş düğmesine dokun"], [SquarePlus, "Ana Ekrana Ekle'yi seç"], [Plus, "Sağ üstte Ekle'ye dokun"]] as [React.ElementType, string][] },
    android: { ad: "Android", tarayici: "Chrome ile", adimlar: [[MousePointerClick, "Sağ üstteki üç noktaya dokun"], [SquarePlus, "Ana ekrana ekle'yi seç"], [Download, "Yükle'ye dokun"]] as [React.ElementType, string][] },
    masaustu: { ad: "Bilgisayar", tarayici: "Chrome ya da Edge ile", adimlar: [[Download, "Adres çubuğundaki yükle simgesine tıkla"], [Plus, "Yükle'yi onayla"], [Zap, "Dock ya da başlat menüsünden aç"]] as [React.ElementType, string][] },
  }), []);
  const [sssAcik, setSssAcik] = useState<number | null>(0);

  return (
    <div className="overflow-x-clip bg-[#0b0b0c]">
      {/* ── 1 · Giriş ── */}
      <section ref={hero} className="relative isolate overflow-clip">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[#0b0b0c]">
          <Duvar />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_56%_60%_at_50%_48%,rgba(11,11,12,0.95)_0%,rgba(11,11,12,0.86)_40%,rgba(11,11,12,0.45)_72%,rgba(11,11,12,0.18)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/80 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0b0b0c]/85 to-transparent" />
        </div>
        <motion.div style={{ y: icY, opacity: icOp }} className="mx-auto flex min-h-[min(900px,calc(100svh-var(--ust-nav)))] max-w-[1100px] flex-col items-center justify-center px-4 pb-16 pt-12 text-center sm:px-8 sm:pt-16">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, ease }}>
            <a href="#platformlar" className="kredi-isilti group inline-flex rounded-full p-px transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
              <span className="flex h-11 items-center gap-2.5 rounded-full bg-[#141416] pl-1.5 pr-1.5">
                <span className="flex h-8 items-center gap-2 rounded-full bg-[#55d6fd]/[0.14] px-3 text-[13px] font-semibold text-[#8be6ff]">
                  <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#55d6fd] opacity-75" /><span className="relative h-1.5 w-1.5 rounded-full bg-[#55d6fd]" /></span>Yakında
                </span>
                <span className="flex items-center gap-1.5 max-[420px]:hidden">{PLATFORMLAR.map((p) => <p.logo key={p.id} className="h-4 w-4 text-white" />)}</span>
                <span className="whitespace-nowrap text-[15px] font-medium tracking-[-0.01em] text-white">Vayra uygulamaları</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] transition-colors group-hover:bg-white/[0.15]"><ArrowRight className="h-4 w-4 text-white transition-transform duration-300 group-hover:translate-x-0.5" /></span>
              </span>
            </a>
          </motion.div>
          <h1 className="mt-7 text-[40px] font-semibold leading-[1.04] tracking-[-0.045em] text-white min-[400px]:text-[44px] sm:text-[80px] sm:leading-[1.02]">
            <motion.span className="inline-block" initial={{ opacity: 0, y: 26, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.9, delay: 0.1, ease }}>Vayra yakında</motion.span>
            <br />
            <motion.span className="inline-block" initial={{ opacity: 0, y: 26, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.9, delay: 0.28, ease }}>
              <DonenKelime metin={PLATFORMLAR[kelimeI].kelime} />
            </motion.span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.12, ease }} className="mt-5 max-w-[560px] text-pretty text-[16px] leading-relaxed text-white/65 sm:text-[17.5px]">
            Mac, Windows, iPhone ve Android için yerel uygulamalar yolda. Aynı hesap, aynı kitaplık, aynı stüdyolar; daha hızlı ve her an elinin altında.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.45, ease }} className="relative mt-10 w-full max-w-[720px] text-left">
            <span aria-hidden className="hero-aura pointer-events-none absolute -inset-x-16 -inset-y-12 -z-10" />
            <HaberKutusu l={l} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── 2 · Platformlar: liste + sahne ── */}
      <section id="platformlar" ref={kok} className="mx-auto max-w-[1280px] scroll-mt-20 px-4 py-20 sm:px-8 sm:py-28" onMouseLeave={() => setDur(false)}>
        <Baslik alt="Her uygulama kendi cihazının güçlü yanını kullanıyor. Durumu ve gereksinimleri burada güncel tutuyoruz.">Her ekranda aynı stüdyo.</Baslik>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12">
          <div role="tablist" aria-label="Platformlar" className="gizli-scroll -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
            {PLATFORMLAR.map((p, j) => {
              const s = j === pi;
              return (
                <div key={p.id} className="relative shrink-0 lg:border-b lg:border-white/[0.07]">
                  <button role="tab" aria-selected={s} onClick={() => sec(j)} onMouseEnter={() => { if (matchMedia("(min-width: 1024px)").matches) sec(j); }}
                    className={cn("group relative flex w-full items-center gap-3 text-left transition-colors max-lg:h-11 max-lg:rounded-full max-lg:pl-1.5 max-lg:pr-4 lg:py-[15px]", s ? "max-lg:bg-white max-lg:text-black" : "max-lg:bg-white/[0.06]")}>
                    {s && <motion.span layoutId="indir-zemin" transition={{ type: "spring", stiffness: 420, damping: 36 }} className="absolute -inset-x-3 inset-y-1 hidden rounded-[16px] bg-white/[0.04] lg:block" />}
                    <span className={cn("relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors lg:h-11 lg:w-11 lg:rounded-[13px]", s ? "bg-white max-lg:bg-black" : "bg-white/[0.06]")}>
                      <p.logo className={cn("h-4 w-4 lg:h-5 lg:w-5", s && tekRenk(p.id) ? "text-black max-lg:text-white" : "text-white")} />
                    </span>
                    <span className={cn("relative whitespace-nowrap text-[14px] font-medium lg:text-[26px] lg:font-semibold lg:tracking-[-0.03em]", s ? "lg:text-white" : "text-white/70 lg:text-white/40 lg:group-hover:text-white/70")}>{p.ad}</span>
                    <span className={cn("relative ml-auto hidden rounded-full px-2.5 py-1 text-[12px] font-semibold lg:block", p.asama === "Kapalı beta" ? "bg-white text-black" : "bg-white/[0.07] text-white/60")}>{p.asama}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {s && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease }} className="relative hidden overflow-hidden lg:block">
                        <div className="pb-5 pl-[56px] pr-2">
                          <p className="text-[15px] leading-relaxed text-white/60">{p.aciklama}</p>
                          <dl className="mt-3.5 divide-y divide-white/[0.06] border-y border-white/[0.06]">
                            {p.gereksinim.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2 text-[13.5px]"><dt className="text-white/45">{k}</dt><dd className="font-medium text-white">{v}</dd></div>)}
                          </dl>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {s && !dur && gorunur && <motion.span key={`${pi}-c`} className="absolute -bottom-px left-0 hidden h-px w-full origin-left bg-[#55d6fd] lg:block" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: SURE_MS / 1000, ease: "linear" }} />}
                </div>
              );
            })}
          </div>
          <div className="lg:sticky lg:top-[calc(var(--ust-nav)+24px)] lg:self-start" onMouseEnter={() => setDur(true)}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[30px] bg-[#0e0f11] ring-1 ring-white/[0.08] sm:aspect-[16/11]">
              <AnimatePresence initial={false}>
                <motion.div key={ap.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.99 }} transition={{ duration: 0.6, ease }}>
                  <Sahne p={ap} />
                </motion.div>
              </AnimatePresence>
              {!dur && gorunur && <span className="absolute inset-x-0 top-0 z-10 h-[2px] lg:hidden"><motion.span key={`${pi}-m`} className="block h-full w-full origin-left bg-[#55d6fd]" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: SURE_MS / 1000, ease: "linear" }} /></span>}
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 sm:inset-x-5 sm:bottom-5">
                <span className="flex h-9 min-w-0 items-center gap-2 rounded-full bg-black/60 px-3 text-[13px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl"><ap.logo className="h-4 w-4 shrink-0 text-white" />{ap.cihaz}<span className="text-white/50 max-sm:hidden">· {ap.durum}</span></span>
                {l.kayit?.platformlar.includes(ap.id)
                  ? <span className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.14] px-5 text-[14.5px] font-semibold text-white backdrop-blur-xl"><BellRing className="h-4 w-4" />Listedesin</span>
                  : <button onClick={() => { l.ekle(ap.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.97]"><Bell className="h-4 w-4" />Haber ver</button>}
              </div>
            </div>
            <p className="mt-3 px-1 text-[14px] leading-relaxed text-white/55 lg:hidden">{ap.aciklama}</p>
            <dl className="mt-2 grid grid-cols-3 gap-2 lg:hidden">
              {ap.gereksinim.map(([k, v]) => <div key={k} className="rounded-[14px] bg-white/[0.04] px-3 py-2.5 ring-1 ring-inset ring-white/[0.06]"><dt className="text-[11.5px] text-white/45">{k}</dt><dd className="mt-0.5 text-[12.5px] font-medium leading-snug text-white">{v}</dd></div>)}
            </dl>
          </div>
        </div>
      </section>

      {/* ── 3 · Çıkış yolu ── */}
      <section className="mx-auto max-w-[1280px] px-4 pb-20 sm:px-8 sm:pb-28">
        <Baslik alt="Her aşamada davetler önce haber listesindekilere gider.">Önce masaüstü, <span className="hero-isilti">sonra cebin.</span></Baslik>
        <div className="relative">
          <div aria-hidden className="absolute left-[38px] right-[38px] top-[38px] hidden h-px bg-white/[0.08] md:block">
            <motion.span className="block h-full origin-left bg-gradient-to-r from-[#55d6fd] to-[#55d6fd]/0" initial={{ scaleX: 0 }} whileInView={{ scaleX: 0.34 }} viewport={{ once: true }} transition={{ duration: 1.4, ease }} />
          </div>
          <ol className="grid gap-6 md:grid-cols-4">
            {PLATFORMLAR.map((p, i) => (
              <motion.li key={p.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6, ease }} className="relative flex items-center gap-4 md:flex-col md:items-start md:gap-0">
                <span className={cn("relative z-10 flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full ring-1 ring-inset", i === 0 ? "bg-white ring-white" : "bg-[#141416] ring-white/[0.1]")}>
                  {i === 0 && <span className="absolute inset-0 animate-ping rounded-full bg-white/20 [animation-duration:2.4s]" />}
                  <p.logo className={cn("relative h-8 w-8", i === 0 && tekRenk(p.id) ? "text-black" : "text-white")} />
                </span>
                <div className="md:mt-6">
                  <p className="text-[13px] font-medium tabular-nums text-white/40">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-white">{p.ad}</h3>
                  <p className="mt-1 text-[14.5px] text-white/55"><span className={i === 0 ? "font-semibold text-white" : "text-white/75"}>{p.asama}.</span> {p.durum}.</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 4 · Bento ── */}
      <section className="mx-auto max-w-[1280px] px-4 pb-20 sm:px-8 sm:pb-28">
        <Baslik alt="Bütün stüdyolar uygulamada; üstüne yalnız yerel uygulamanın verebildikleri.">Web&apos;deki her şey. Fazlası.</Baslik>
        <div className="grid auto-rows-[260px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["sm:col-span-2 lg:row-span-2", Cloud, "Tek hesap, her cihazda aynı", "Kitaplığın, projelerin ve kredin eşitlenir. Telefonda başladığını bilgisayarda bitir.", "sinematik9"],
            ["sm:col-span-2", HardDriveDownload, "Çevrimdışı kitaplık", "İndirdiğin üretimler bağlantı yokken de açılır.", "manzara8"],
            ["", Upload, "Büyük dosyalar arka planda", "Uzun videolar sekme kapansa da yüklenir.", "3d6"],
            ["", Lock, "Cihaz kilidiyle giriş", "Touch ID, Face ID ya da Windows Hello.", "portre11"],
          ] as [string, React.ElementType, string, string, string][]).map(([sinif, I, a, n, g], i) => (
            <motion.div key={a} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: i * 0.06, duration: 0.7, ease }}
              className={cn("group relative flex flex-col justify-end overflow-hidden rounded-[28px] bg-[#0e0f11] p-6 ring-1 ring-white/[0.08]", sinif)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${G}/${g}.webp`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/5" />
              <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition-transform duration-300 group-hover:-translate-y-1"><I className="h-5 w-5" /></span>
              <h3 className={cn("relative mt-4 font-semibold tracking-[-0.03em] text-white", i === 0 ? "text-[30px] sm:text-[38px]" : "text-[22px]")}>{a}</h3>
              <p className={cn("relative mt-1.5 max-w-[440px] leading-relaxed text-white/70", i === 0 ? "text-[16px]" : "text-[14.5px]")}>{n}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 5 · Bugün kur ── */}
      <section id="bugun" className="mx-auto max-w-[1280px] scroll-mt-20 px-4 pb-20 sm:px-8 sm:pb-28">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease }} className="overflow-hidden rounded-[32px] bg-[#0e0f11] ring-1 ring-white/[0.08]">
          <div className="grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:p-14">
            <div>
              <h2 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.045em] text-white sm:text-[48px]">Beklemeden <span className="hero-isilti">bugün kur.</span></h2>
              <p className="mt-3 max-w-[480px] text-[16px] leading-relaxed text-white/60">Vayra&apos;yı şimdiden uygulama gibi ekleyebilirsin: kendi simgesiyle açılır, tam ekran çalışır. Yerel uygulama gelince hesabın olduğu gibi geçer.</p>
              <div role="tablist" className="mt-7 inline-flex rounded-full bg-white/[0.06] p-1 ring-1 ring-inset ring-white/[0.06]">
                {(["ios", "android", "masaustu"] as const).map((k) => (
                  <button key={k} role="tab" aria-selected={kurSekme === k} onClick={() => setKurSekme(k)} className={cn("relative isolate flex h-9 items-center rounded-full px-4 text-[13.5px] font-medium transition-colors", kurSekme === k ? "text-black" : "text-white/70 hover:text-white")}>
                    {kurSekme === k && <motion.span layoutId="indir-kur" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
                    {KUR_ADIM[k].ad}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.ol key={kurSekme} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease }} className="mt-6 space-y-2">
                  {KUR_ADIM[kurSekme].adimlar.map(([I, m], j) => (
                    <li key={m} className="flex items-center gap-3.5 rounded-[18px] bg-white/[0.03] px-4 py-3.5 ring-1 ring-inset ring-white/[0.06]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[14px] font-bold text-black">{j + 1}</span>
                      <span className="flex-1 text-[15px] text-white">{m}</span>
                      <I className="h-5 w-5 shrink-0 text-white/45" />
                    </li>
                  ))}
                  <li className="px-1 pt-1 text-[13px] text-white/45">{KUR_ADIM[kurSekme].tarayici}</li>
                </motion.ol>
              </AnimatePresence>
              <div className="mt-6 flex flex-wrap gap-2">
                {kurulum.kurulu ? <span className="flex h-12 items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[15px] font-semibold text-white">Bu cihazda kurulu</span>
                  : kurulum.kurulabilir && !kurulum.ios ? <motion.button whileTap={{ scale: 0.97 }} onClick={async () => { if (await kurulum.kur()) toast.success("Vayra kuruldu", { description: "Masaüstünden ya da başlat menüsünden açabilirsin." }); }} className="flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-black"><Download className="h-4 w-4" />Bu cihaza kur</motion.button>
                  : <Link href="/panel" className="flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-black transition active:scale-[0.97]">Web&apos;de aç<ArrowRight className="h-4 w-4" /></Link>}
              </div>
            </div>
            <div className="relative flex justify-center">
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(85,214,253,0.10),transparent)]" />
              <div className="relative w-[min(290px,78vw)] rounded-[46px] bg-[#232427] p-[7px] ring-1 ring-inset ring-white/[0.14]">
                <div className="relative overflow-hidden rounded-[40px]" style={{ background: `url(${G}/manzara7.webp) center/cover` }}>
                  <span className="absolute inset-0 bg-black/30" />
                  <span className="absolute left-1/2 top-[9px] z-10 h-[20px] w-[78px] -translate-x-1/2 rounded-full bg-black" />
                  <div className="relative grid grid-cols-4 gap-x-3.5 gap-y-5 px-5 pb-28 pt-14">
                    {Array.from({ length: 16 }).map((_, i) => i === 9 ? (
                      <motion.span key={i} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 14 }} className="flex flex-col items-center gap-1">
                        <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} className="flex aspect-square w-full items-center justify-center rounded-[14px] bg-[#0b0b0c] ring-1 ring-white/25">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/brand/vayra-mark.png" alt="Vayra" className="h-[55%] w-[55%] object-contain" />
                        </motion.span>
                        <span className="text-[10px] font-medium text-white">Vayra</span>
                      </motion.span>
                    ) : (
                      <span key={i} className="flex flex-col items-center gap-1"><span className="aspect-square w-full rounded-[14px] bg-white/[0.18] backdrop-blur" /><span className="h-[12px]" /></span>
                    ))}
                  </div>
                  <div className="absolute inset-x-3 bottom-3 grid grid-cols-4 gap-3.5 rounded-[28px] bg-white/[0.16] p-3 backdrop-blur-xl">{Array.from({ length: 4 }).map((_, i) => <span key={i} className="aspect-square rounded-[13px] bg-white/[0.22]" />)}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-px border-t border-white/[0.06] bg-white/[0.05] sm:grid-cols-2 lg:grid-cols-4">
            {([[AppleIcon, "Mac App Store", "macOS"], [WindowsIcon, "Microsoft Store", "Windows"], [AppleIcon, "App Store", "iPhone ve iPad"], [GooglePlayIcon, "Google Play", "Android"]] as [React.FC<{ className?: string }>, string, string][]).map(([L, a, p]) => (
              <div key={a} className="flex items-center gap-3.5 bg-[#0e0f11] px-6 py-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-black ring-1 ring-inset ring-white/[0.12]"><L className="h-5 w-5 text-white" /></span>
                <span className="min-w-0 leading-tight"><span className="block text-[12.5px] text-white/45">{p}, çıkınca</span><span className="mt-0.5 block text-[15px] font-semibold text-white">{a}</span></span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── 6 · SSS ── */}
      <section className="mx-auto max-w-[1280px] px-4 pb-20 sm:px-8 sm:pb-28">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease }}>
            <h2 className="text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-[48px]">Aklındaki sorular.</h2>
            <p className="mt-4 max-w-[340px] text-[15px] leading-relaxed text-white/60">Cevabını bulamadın mı? Ekibimiz bir iş günü içinde döner.</p>
            <Link href="/iletisim" className="mt-7 inline-flex h-11 items-center gap-1.5 rounded-full bg-white/[0.07] px-5 text-[14px] font-medium text-white ring-1 ring-white/[0.1] transition-colors hover:bg-white/[0.12]">Bize yaz<ArrowRight className="h-4 w-4" /></Link>
          </motion.div>
          <div className="border-t border-white/[0.07]">
            {SSS.map(([s, c], i) => {
              const a = sssAcik === i;
              return (
                <div key={s} className="border-b border-white/[0.07]">
                  <button onClick={() => setSssAcik(a ? null : i)} aria-expanded={a} className="flex w-full items-center justify-between gap-6 py-5 text-left">
                    <span className={cn("text-[16px] font-medium transition-colors sm:text-[18px]", a ? "text-white" : "text-white/80 hover:text-white")}>{s}</span>
                    <Plus className={cn("h-5 w-5 shrink-0 text-white/60 transition-transform duration-300", a && "rotate-45 text-white")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {a && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden"><p className="max-w-[640px] pb-6 text-[15px] leading-relaxed text-white/60">{c}</p></motion.div>}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 7 · Kapanış ── */}
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/gercek/orig/banner-atlas-creative.webp" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0b0b0c] via-[#0b0b0c]/70 to-[#0b0b0c]" />
        <div className="mx-auto flex max-w-[900px] flex-col items-center px-4 py-24 text-center sm:px-8 sm:py-32">
          <motion.h2 initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease }} className="text-[40px] font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-[72px]">İlk davet <span className="hero-isilti">sana gelsin.</span></motion.h2>
          <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-white/70 sm:text-[17px]">Haber listesindekiler betaya önce katılır. Bir e-posta, birkaç platform; o kadar.</p>
          <div className="mt-10 w-full max-w-[720px] text-left"><HaberKutusu l={l} /></div>
        </div>
      </section>
    </div>
  );
}
