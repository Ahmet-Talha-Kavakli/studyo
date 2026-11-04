"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, AudioLines, Box, Clapperboard, Coins, CornerDownLeft, Film, Gem, Home, ImageIcon, LayoutGrid,
  Library, Megaphone, Music, Search, Sparkles, X, type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { type RenkTuru } from "@/lib/renk";
import { cn } from "@/lib/utils";
import { havuzSec } from "@/lib/medyaHavuzu";

export type Sayfa = { ad: string; ozet: string; href: string; ikon: LucideIcon; renk: RenkTuru; anahtar?: string };

/** Yanlış yazılmış adrese önerilebilecek sayfalar. `anahtar`: eş anlamlılar / eski adlar. */
export const SAYFALAR: Sayfa[] = [
  { ad: "Görsel üret", ozet: "Metinden ve referanstan görsel", href: "/panel/gorsel", ikon: ImageIcon, renk: "gorsel", anahtar: "image foto resim" },
  { ad: "Video üret", ozet: "Kling, Veo, Seedance ve fazlası", href: "/panel/video", ikon: Clapperboard, renk: "video", anahtar: "film klip" },
  { ad: "Ses ve seslendirme", ozet: "Metinden ses, ses klonlama", href: "/panel/ses", ikon: AudioLines, renk: "ses", anahtar: "audio tts" },
  { ad: "Müzik", ozet: "Şarkı ve fon müziği üret", href: "/panel/muzik", ikon: Music, renk: "muzik", anahtar: "music sarki" },
  { ad: "3D", ozet: "Görselden 3D model", href: "/panel/3d", ikon: Box, renk: "3d", anahtar: "model obje" },
  { ad: "Kanvas", ozet: "Sonsuz tuvalde düğümlerle üret", href: "/panel/canvas", ikon: LayoutGrid, renk: "canvas", anahtar: "canvas akis flow" },
  { ad: "Sinema Stüdyosu", ozet: "Sahne sahne kısa film", href: "/panel/sinema", ikon: Film, renk: "video", anahtar: "cinema" },
  { ad: "Pazarlama Stüdyosu", ozet: "Ürün fotoğrafından reklam", href: "/panel/pazarlama", ikon: Megaphone, renk: "canvas", anahtar: "reklam marketing" },
  { ad: "Kitaplık", ozet: "Tüm üretimlerin", href: "/panel/kitaplik", ikon: Library, renk: "vurgu", anahtar: "arsiv varliklar galeri library" },
  { ad: "Keşfet", ozet: "Topluluğun en iyi işleri", href: "/kesfet", ikon: Sparkles, renk: "vurgu", anahtar: "topluluk explore" },
  { ad: "Fiyatlandırma", ozet: "Planlar ve kredi paketleri", href: "/fiyatlandirma", ikon: Gem, renk: "vurgu", anahtar: "fiyat plan abonelik pricing" },
  { ad: "Krediler", ozet: "Bakiye, kredi yükle, plan", href: "/panel/kredi", ikon: Coins, renk: "muzik", anahtar: "bakiye odeme" },
  { ad: "Vayra Earn", ozet: "Ürettiğinle para kazan", href: "/earn", ikon: Coins, renk: "3d", anahtar: "kazan para kampanya" },
  { ad: "Modeller", ozet: "Tüm yapay zekâ modelleri", href: "/modeller", ikon: Sparkles, renk: "vurgu", anahtar: "models" },
  { ad: "Vayra API", ozet: "Geliştirici paneli ve dokümantasyon", href: "/panel/api", ikon: CornerDownLeft, renk: "vurgu", anahtar: "api developer gelistirici docs" },
  { ad: "Sık sorulanlar", ozet: "Kredi, ödeme ve hesap soruları", href: "/sss", ikon: Search, renk: "vurgu", anahtar: "yardim destek faq help" },
  { ad: "İletişim", ozet: "Ekibimize yaz", href: "/iletisim", ikon: CornerDownLeft, renk: "vurgu", anahtar: "destek contact" },
];

/** Türkçe harfleri sadeleştirir: "Görsel" → "gorsel". */
const sade = (s: string) => s.toLocaleLowerCase("tr-TR").replace(/[çğıöşü]/g, (h) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[h]!).replace(/[^a-z0-9/ ]/g, " ");

function mesafe(a: string, b: string) {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let onceki = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, onceki + (a[i - 1] === b[j - 1] ? 0 : 1));
      onceki = t;
    }
  }
  return d[b.length];
}

/** Yanlış yazılmış adrese en yakın sayfa ("/panel/gorsl" → Görsel üret). */
export function enYakin(yol: string): Sayfa | null {
  const hedef = sade(yol).replace(/\s+/g, "").replace(/\/+$/, "");
  if (!hedef || hedef === "/") return null;
  const son = hedef.split("/").filter(Boolean).pop() ?? "";
  let en: { s: Sayfa; puan: number } | null = null;
  for (const s of SAYFALAR) {
    const adaylar = [s.href, s.href.split("/").pop()!, ...(s.anahtar ?? "").split(" ")];
    const puan = Math.min(...adaylar.map((a) => mesafe(a.startsWith("/") ? hedef : son, a) / Math.max(a.length, 3)));
    if (!en || puan < en.puan) en = { s, puan };
  }
  return en && en.puan <= 0.4 ? en.s : null;
}

/* ── Görünüm ── */

const ZEMIN: Record<RenkTuru, string> = {
  gorsel: "linear-gradient(135deg, #6fe0ff, #2f7cf6)", video: "linear-gradient(135deg, #ff8a65, #e5304f)", ses: "linear-gradient(135deg, #b69bff, #6d3fe0)",
  muzik: "linear-gradient(135deg, #ff6fae, #d0246f)", "3d": "linear-gradient(135deg, #ffd166, #f08a0c)", canvas: "linear-gradient(135deg, #4ade80, #059669)",
  vurgu: "linear-gradient(135deg, #3a3a40, #1c1c1f)",
};
const EASE = [0.22, 1, 0.36, 1] as const;
const anaBtn = "inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0b0b0d] transition-[background-color,transform] hover:bg-white/90 active:scale-[0.97]";
const ikinciBtn = "inline-flex h-11 items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[14px] font-semibold text-white ring-1 ring-inset ring-white/[0.1] transition-[background-color,transform] hover:bg-white/[0.13] active:scale-[0.97]";

const K = "/gercek/kesfet/";
const KARELER = ["aurora-gecesinano-banana-pro", "cyberpunk-sokak-yagmurusora-2", "altin-saat-portresinano-banana-pro", "buz-sarayinano-banana-pro", "ejder-yuvasinano-banana-pro",
  "antik-tapinak-kesfiveo-3-1", "deniz-feneri-firtinasiveo-3-1", "col-gulunano-banana-pro", "bulut-sehrinocturne-ai", "fantastik-orman-perisiruh-sinema"].map((x) => `${K}${x}.webp`);
const DEVAM = [
  { ad: "Görsel üret", ozet: "Metinden ve referanstan görsel", href: "/panel/gorsel", g: KARELER[0] },
  { ad: "Video üret", ozet: "Kling, Veo, Seedance", href: "/panel/video", g: KARELER[1] },
  { ad: "Keşfet", ozet: "Topluluğun en iyi işleri", href: "/kesfet", g: KARELER[2] },
  { ad: "Kitaplık", ozet: "Tüm üretimlerin", href: "/panel/kitaplik", g: KARELER[3] },
];
const VIDEOLAR = [
  { src: havuzSec("404-a", "doga").video, poster: havuzSec("404-a", "doga").poster },
  { src: havuzSec("404-b", "uzay").video, poster: havuzSec("404-b", "uzay").poster },
];

function Simge({ s, boyut = 40 }: { s: Sayfa; boyut?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center text-white" style={{ width: boyut, height: boyut, borderRadius: boyut * 0.27, background: ZEMIN[s.renk], boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)" }}>
      <s.ikon style={{ width: boyut * 0.45, height: boyut * 0.45 }} strokeWidth={2.2} />
    </span>
  );
}

/** Ortak: adres, eylemler, bildir bağlantısı. */
function useOrtak() {
  const yol = usePathname() ?? "/";
  const router = useRouter();
  const [gecmisVar, setGecmisVar] = useState(false);
  const [mac, setMac] = useState(false);
  useEffect(() => { setGecmisVar(window.history.length > 1); setMac(/Mac|iPhone|iPad/.test(navigator.platform)); }, []);
  const adres = `vayra.ai${yol.length > 40 ? `${yol.slice(0, 38)}…` : yol}`;
  const oneri = useMemo(() => enYakin(yol), [yol]);
  const ara = () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: !mac, metaKey: mac, bubbles: true }));
  return { yol, router, gecmisVar, mac, adres, oneri, ara };
}
function Eylemler({ o, araGoster }: { o: ReturnType<typeof useOrtak>; araGoster?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      <Link href="/" className={anaBtn}><Home className="h-4 w-4" />Ana sayfaya dön</Link>
      {o.gecmisVar && <button onClick={() => o.router.back()} className={ikinciBtn}><ArrowLeft className="h-4 w-4" />Geri git</button>}
      {araGoster && (
        <button onClick={o.ara} className={cn(ikinciBtn, "hidden sm:inline-flex")}>
          <Search className="h-4 w-4" />Ara<span className="ml-0.5 rounded-md bg-white/[0.1] px-1.5 py-0.5 text-[11.5px] font-medium text-white/60">{o.mac ? "⌘K" : "Ctrl K"}</span>
        </button>
      )}
    </div>
  );
}
function Bildir({ yol }: { yol: string }) {
  return (
    <p className="text-[13px] text-white/40">
      Bir bağlantıdan geldiysen <Link href={`/iletisim?konu=destek&mesaj=${encodeURIComponent(`Bozuk bağlantı: ${yol}`)}`} className="text-white/70 underline decoration-white/25 underline-offset-2 transition-colors hover:text-white">bize bildir</Link>, düzeltelim.
    </p>
  );
}

/* ── B · Videolu 404 + anlık arama ── */

function Videolu() {
  const o = useOrtak();
  const [q, setQ] = useState("");
  const [aktif, setAktif] = useState(0);
  const [video] = useState(() => VIDEOLAR[Math.floor(Math.random() * VIDEOLAR.length)]);
  const sonuc = useMemo(() => {
    const s = sade(q).trim();
    if (!s) return o.oneri ? [o.oneri, ...SAYFALAR.filter((x) => x !== o.oneri).slice(0, 3)] : SAYFALAR.slice(0, 4);
    return SAYFALAR.filter((x) => s.split(/\s+/).every((k) => sade(`${x.ad} ${x.ozet} ${x.anahtar ?? ""} ${x.href}`).includes(k))).slice(0, 5);
  }, [q, o.oneri]);
  useEffect(() => setAktif(0), [q]);
  const git = (s?: Sayfa) => { if (s) o.router.push(s.href); };

  return (
    <section className="mx-auto max-w-[920px] px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-6 text-center sm:pb-16 sm:pt-10">
      {/* Video yalnız rakamların içinde görünür (koyu katman + beyaz yazı + multiply) */}
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: EASE }}
        className="relative isolate mx-auto h-[150px] max-w-[780px] overflow-hidden bg-[#0a0a0b] sm:h-[300px]" aria-hidden>
        <video src={video.src} poster={video.poster} muted loop autoPlay playsInline preload="auto" className="absolute inset-0 h-full w-full scale-110 object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0b] mix-blend-multiply">
          <span className="select-none text-[160px] font-black leading-none tracking-[-0.075em] text-white sm:text-[320px]">404</span>
        </div>
        {/* multiply dışarıyı tam siyah yapar; lighten ile sayfa zeminine eşitlenir, kutu kenarı görünmez */}
        <div className="pointer-events-none absolute inset-0 bg-[#0a0a0b] mix-blend-lighten" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5, ease: EASE }}>
        <h1 className="mt-3 text-balance text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[46px]">Bu sahne kurguda yok.</h1>
        <p className="mx-auto mt-3 max-w-[470px] text-pretty text-[15.5px] leading-relaxed text-white/60">
          <span className="font-medium text-white/90">{o.adres}</span> adresinde bir sayfa bulamadık. Aradığını yaz, hemen götürelim.
        </p>
      </motion.div>

      {/* Anlık arama */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5, ease: EASE }}
        className="bd-panel mx-auto mt-7 max-w-[560px] rounded-[26px] p-2 text-left">
        <label className="flex h-[52px] items-center gap-2.5 rounded-[18px] bg-[#232326] px-4 transition-colors focus-within:bg-[#28282b]">
          <Search className="h-[18px] w-[18px] shrink-0 text-white/50" strokeWidth={2.2} />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Sayfa ara" placeholder="Görsel, video, fiyat, yardım…" spellCheck={false} autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setAktif((i) => Math.min(i + 1, sonuc.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setAktif((i) => Math.max(i - 1, 0)); }
              else if (e.key === "Enter") git(sonuc[aktif]);
            }}
            className="min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/40" />
          {q && <button onClick={() => setQ("")} aria-label="Aramayı temizle" className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white/35 text-[#232326] hover:bg-white/55"><X className="h-3 w-3" strokeWidth={3} /></button>}
        </label>
        <div className="mt-1 min-h-[60px]">
          <AnimatePresence initial={false} mode="popLayout">
            {sonuc.map((s, i) => {
              const a = i === aktif;
              const oneriMi = !q && s === o.oneri;
              return (
                <motion.div key={s.href} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  <Link href={s.href} onMouseMove={() => setAktif(i)}
                    className={cn("group flex items-center gap-3 rounded-[16px] px-2.5 py-2 transition-colors", a && "bg-white/[0.07]")}>
                    <Simge s={s} boyut={38} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-semibold text-white">{s.ad}</span>
                        {oneriMi && <span className="shrink-0 rounded-full bg-[#55d6fd]/15 px-2 py-px text-[11px] font-semibold text-[#55d6fd]">Bunu mu arıyordun?</span>}
                      </span>
                      <span className="block truncate text-[13px] text-white/50">{s.ozet}</span>
                    </span>
                    <ArrowRight className={cn("h-4 w-4 shrink-0 transition-[transform,color]", a ? "translate-x-0.5 text-white" : "text-white/25")} />
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {!sonuc.length && <p className="px-3 py-5 text-center text-[14px] text-white/45">“{q.trim()}” ile eşleşen sayfa yok. Başka bir kelime dene.</p>}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-7 space-y-5">
        <Eylemler o={o} />
        <Bildir yol={o.yol} />
      </motion.div>
    </section>
  );
}

/* ── C · Kayıp kare ── */

function Serit({ ters }: { ters?: boolean }) {
  const dizi = ters ? [...KARELER].reverse() : KARELER;
  return (
    <div className="film-bant relative overflow-hidden py-[14px]">
      <div className={cn("flex w-max gap-2", ters ? "kare-akis-ters" : "kare-akis")}>
        {[...dizi, ...dizi].map((g, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={g} alt="" loading="lazy" className="h-[96px] w-[150px] shrink-0 rounded-[6px] object-cover opacity-70 sm:h-[132px] sm:w-[210px]" />
        ))}
      </div>
    </div>
  );
}
function KayipKare() {
  const o = useOrtak();
  return (
    <section className="pb-[calc(96px+env(safe-area-inset-bottom))] pt-8 sm:pb-16 sm:pt-12">
      <div className="relative" aria-hidden>
        <div className="space-y-3 [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)]">
          <Serit />
          <Serit ters />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div initial={{ scale: 0.86, opacity: 0, rotate: -2 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 240, damping: 20, delay: 0.15 }}
            className="relative h-[176px] w-[270px] rounded-[20px] bg-[#0a0a0b] p-1.5 shadow-[0_0_0_1px_rgba(85,214,253,0.4),0_0_70px_rgba(85,214,253,0.16)] sm:h-[236px] sm:w-[370px]">
            <span className="parazit relative block h-full w-full overflow-hidden rounded-[15px] bg-[#111]"><span className="parazit-ic absolute -inset-[50%]" /></span>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="kayip-titre text-[76px] font-black leading-none tracking-[-0.065em] text-white sm:text-[104px]">404</span>
              <span className="mt-2 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-[12px] font-semibold text-white/85 backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff453a]" />Kayıp kare
              </span>
            </span>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5, ease: EASE }} className="mx-auto mt-10 max-w-[600px] px-5 text-center sm:mt-12">
        <h1 className="text-balance text-[34px] font-semibold leading-[1.06] tracking-[-0.035em] text-white sm:text-[50px]">Bu kare filmde yok.</h1>
        <p className="mx-auto mt-4 max-w-[460px] text-pretty text-[15.5px] leading-relaxed text-white/60">
          <span className="font-medium text-white/90">{o.adres}</span> adresinde bir sayfa bulamadık. Taşınmış ya da yanlış yazılmış olabilir.
        </p>
        {o.oneri && (
          <Link href={o.oneri.href} className="bd-kart group mt-7 flex items-center gap-3.5 rounded-[20px] p-3 text-left transition-colors hover:bg-[#2b2b2f]">
            <Simge s={o.oneri} boyut={44} />
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] text-white/50">Bunu mu arıyordun?</span>
              <span className="block truncate text-[15.5px] font-semibold text-white">{o.oneri.ad}</span>
            </span>
            <ArrowRight className="mr-1 h-4 w-4 text-white/45 transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </Link>
        )}
        <div className="mt-6"><Eylemler o={o} araGoster /></div>
        <div className="mt-5"><Bildir yol={o.yol} /></div>
      </motion.div>

      <div className="mx-auto mt-14 max-w-[960px] px-5">
        <p className="text-[15px] font-semibold text-white">Buradan devam et</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {DEVAM.map((k, i) => (
            <motion.div key={k.ad} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.06, ease: EASE }}>
              <Link href={k.href} className="group relative block aspect-[4/5] overflow-hidden rounded-[20px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={k.g} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <span className="absolute inset-0 rounded-[20px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
                <span className="absolute inset-x-3.5 bottom-3.5 text-left">
                  <span className="flex items-center gap-1 text-[15px] font-semibold text-white">{k.ad}<ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" /></span>
                  <span className="block text-[12.5px] text-white/65">{k.ozet}</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 404 — her ziyarette iki sahneden biri rastgele: "Bu sahne kurguda yok" (rakamların
 * içinde video + anlık sayfa araması) ya da "Bu kare filmde yok" (akan kare şeritleri
 * ortasında parazitli kayıp kare). Seçim istemcide yapılır; sunucu çıktısıyla çakışmaz.
 */
export function Bulunamadi() {
  const [sahne, setSahne] = useState<"video" | "kare" | null>(null);
  useEffect(() => setSahne(Math.random() < 0.5 ? "video" : "kare"), []);
  return (
    <main className="min-h-[calc(100svh-var(--ust-nav))] bg-[#0a0a0b]">
      {sahne === "video" ? <Videolu /> : sahne === "kare" ? <KayipKare /> : null}
    </main>
  );
}
