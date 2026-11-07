"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CornerDownLeft, LayoutGrid, LogIn, Search, X } from "lucide-react";
import { useAuth, PLAN_ADI } from "@/store/useAuth";
import { useHesap } from "@/store/useHesap";
import { avatarAdresi } from "@/components/ui/KullaniciAvatar";
import { kesfetFont } from "@/components/kesfet/font";
import { AYAR_GRUPLARI, AYAR_SAYFALARI, ayarAra, type AyarSonuc } from "@/lib/ayarDizini";
import { guvenlikAdimlari } from "@/lib/ayarlar";
import { cn } from "@/lib/utils";
import { yay } from "./ui";

export const GENEL_BAKIS = "/panel/ayarlar";

/**
 * Ayarlar kabuğu — tek sütun sol menü, seçili satır beyaz hap.
 * Solda: kimlik, tek tek ayarları bulan arama, gruplu sayfalar.
 * Sağda: 1200 px içerik (kartlar + canlı yan panel). Mobilde /panel/ayarlar iOS gibi liste, alt sayfalarda "‹ Ayarlar" geri bağlantısı.
 */
export function AyarKabugu({ children }: { children: ReactNode }) {
  const path = usePathname();
  const kullanici = useAuth((s) => s.kullanici);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useSatirParlat(path);
  const kok = path === GENEL_BAKIS;

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("kesfet-tema flex min-h-[calc(100dvh-var(--ust-nav))] bg-[#0b0b0c]", kesfetFont.variable)}>
        <aside className="sticky top-[var(--ust-nav)] hidden h-[calc(100dvh-var(--ust-nav))] w-[260px] shrink-0 flex-col border-r border-white/[0.06] lg:flex">
          {hazir && kullanici && <Ray />}
        </aside>

        <main className="min-w-0 flex-1">
          {!hazir ? null : !kullanici ? <GirisGerekli path={path} /> : (
            <>
              {/* Mobil: kökte liste, alt sayfada geri bağlantısı */}
              <div className="lg:hidden">
                {kok ? <MobilListe /> : (
                  <Link href={GENEL_BAKIS} className="mx-4 mt-4 inline-flex h-9 items-center gap-0.5 rounded-full pl-1 pr-3 text-[14.5px] font-medium text-[#55d6fd] active:opacity-60">
                    <ChevronLeft className="h-5 w-5" />Ayarlar
                  </Link>
                )}
              </div>
              <div className="mx-auto w-full max-w-[1200px] px-4 pb-40 pt-6 sm:px-8 lg:pt-9">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={path} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}

/** Aramadan gelindiyse (#id) satırı görünür yap ve kısa süre parlat. */
function useSatirParlat(path: string) {
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const parlat = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      t = setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.remove("ayar-parla"); void el.offsetWidth; el.classList.add("ayar-parla");
      }, 260);
    };
    parlat();
    addEventListener("hashchange", parlat);
    addEventListener("ayar-parla", parlat);
    return () => { clearTimeout(t); removeEventListener("hashchange", parlat); removeEventListener("ayar-parla", parlat); };
  }, [path]);
}

/** Alt sayfası ayrı menü satırı olan sayfalar (Çalışma alanı, Genel) yalnız tam eşleşmede seçilir. */
const TAM_ESLESME = new Set(["/panel/ayarlar/alan"]);
function aktifMi(path: string, href: string) { return path === href || (!TAM_ESLESME.has(href) && path.startsWith(href + "/")); }

/**
 * Sol menü ("A · Beyaz hap"): sitenin sekme dili. Seçili satır beyaz hap, siyah yazı; seçim zemini satırlar
 * arasında kayar. Durum yazısı yok; yalnız güvenlik eksikse küçük sarı nokta.
 */
function Ray() {
  const path = usePathname();
  const k = useAuth((s) => s.kullanici)!;
  const hesap = useHesap((s) => s.hesaplar[k.email.toLowerCase()]);
  const eksik = guvenlikAdimlari(hesap).some((x) => !x.tamam);
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-4">
        <Link href="/panel/ayarlar/hesap" className="flex items-center gap-3 rounded-[14px] px-2 py-1.5 transition-colors hover:bg-white/[0.04]">
          <Avatar ad={k.ad} src={k.avatar} boyut={34} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[14px] font-semibold text-white">{k.ad}</span>
            <span className="mt-0.5 block truncate text-[12.5px] text-white/40">{PLAN_ADI[k.plan]} planı</span>
          </span>
        </Link>
        <AyarArama />
      </div>
      <nav aria-label="Ayarlar" className="gizli-scroll mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-5 [mask-image:linear-gradient(to_bottom,black_calc(100%-24px),transparent)]">
        <LayoutGroup id="ayar-ray">
          <RaySatiri href={GENEL_BAKIS} ad="Genel bakış" ikon={LayoutGrid} a={path === GENEL_BAKIS} />
          {AYAR_GRUPLARI.map((g) => (
            <div key={g.ad} className="mt-4">
              <p className="mb-1 px-3 text-[12px] text-white/35">{g.ad}</p>
              {g.sayfalar.map((s) => <RaySatiri key={s.href} href={s.href} ad={s.ad} ikon={s.ikon} a={aktifMi(path, s.href)} nokta={s.id === "guvenlik" && eksik} />)}
            </div>
          ))}
        </LayoutGroup>
      </nav>
    </div>
  );
}

function RaySatiri({ href, ad, ikon: I, a, nokta }: { href: string; ad: string; ikon: React.ElementType; a: boolean; nokta?: boolean }) {
  return (
    <Link href={href} aria-current={a ? "page" : undefined}
      className={cn("relative flex h-[34px] items-center gap-3 rounded-full px-3 text-[13.5px] transition-colors duration-150", a ? "font-semibold text-black" : "text-white/65 hover:bg-white/[0.04] hover:text-white")}>
      {a && <motion.span layoutId="ayar-ray-zemin" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
      <I className="relative h-4 w-4 shrink-0" strokeWidth={a ? 2.2 : 1.8} />
      <span className="relative min-w-0 flex-1 truncate">{ad}</span>
      {nokta && <span title="Güvenliği güçlendir" className={cn("relative h-2 w-2 shrink-0 rounded-full", a ? "bg-amber-500" : "bg-amber-400")} />}
    </Link>
  );
}

/** Ayar araması: sayfaları ve tek tek ayarları bulur. "/" ile odaklanır, ↑↓ ve Enter ile seçilir. */
function AyarArama() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [odak, setOdak] = useState(false);
  const [i, setI] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const sonuc = useMemo(() => ayarAra(q), [q]);
  useEffect(() => setI(0), [q]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || h.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(h.tagName)) return;
      e.preventDefault(); ref.current?.focus();
    };
    addEventListener("keydown", f); return () => removeEventListener("keydown", f);
  }, []);
  const git = (s: AyarSonuc) => {
    router.push(s.href);
    if (s.satir && location.pathname === s.sayfa.href) setTimeout(() => dispatchEvent(new Event("ayar-parla")), 30);
    setQ(""); ref.current?.blur();
  };
  const acik = odak && q.trim().length > 0;
  return (
    <div className="relative mt-3">
      <label className={cn("flex h-9 items-center gap-2 rounded-full px-3 ring-1 transition-colors", odak ? "bg-white/[0.06] ring-[#55d6fd]/50" : "bg-white/[0.04] ring-white/[0.08] hover:ring-white/[0.16]")}>
        <Search className="h-[15px] w-[15px] shrink-0 text-white/40" />
        <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setOdak(true)} onBlur={() => setTimeout(() => setOdak(false), 120)}
          placeholder="Ayarlarda ara" aria-label="Ayarlarda ara"
          onKeyDown={(e) => {
            if (e.key === "Escape") { setQ(""); ref.current?.blur(); }
            if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(sonuc.length - 1, x + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
            if (e.key === "Enter" && sonuc[i]) git(sonuc[i]);
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />
        {q ? <button type="button" onClick={() => setQ("")} aria-label="Temizle" className="text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></button>
          : <kbd className="rounded-[6px] bg-white/[0.07] px-1.5 font-sans text-[11px] text-white/40">/</kbd>}
      </label>
      <AnimatePresence>
        {acik && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}
            className="bd-panel absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[16px] p-1.5">
            {sonuc.length ? sonuc.map((s, j) => (
              <button key={s.href} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => git(s)} onMouseEnter={() => setI(j)}
                className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left", j === i && "bg-white/[0.07]")}>
                <s.sayfa.ikon className="h-4 w-4 shrink-0 text-white/45" strokeWidth={1.9} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[13.5px] text-white">{s.ad}</span>
                  {s.satir && <span className="block truncate text-[11.5px] text-white/40">{s.sayfa.ad}</span>}
                </span>
                {j === i && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-white/35" />}
              </button>
            )) : <p className="px-3 py-3 text-[13px] text-white/45">&ldquo;{q}&rdquo; ile eşleşen ayar yok.</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Mobil kök: iOS Ayarlar gibi gruplu liste. */
function MobilListe() {
  const k = useAuth((s) => s.kullanici)!;
  const [q, setQ] = useState("");
  const sonuc = useMemo(() => ayarAra(q), [q]);
  return (
    <div className="px-4 pb-40 pt-5">
      <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-white">Ayarlar</h1>
      <label className="mt-4 flex h-10 items-center gap-2 rounded-[12px] bg-white/[0.06] px-3">
        <Search className="h-4 w-4 text-white/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ayarlarda ara" className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/40" />
      </label>
      {q.trim() ? (
        <div className="mt-4 divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-[#141416]">
          {sonuc.map((s) => (
            <Link key={s.href} href={s.href} className="flex items-center gap-3 px-4 py-3 active:bg-white/[0.05]">
              <s.sayfa.ikon className="h-[18px] w-[18px] text-white/50" />
              <span className="min-w-0 flex-1"><span className="block truncate text-[15px] text-white">{s.ad}</span>{s.satir && <span className="block text-[12.5px] text-white/40">{s.sayfa.ad}</span>}</span>
              <ChevronRight className="h-4 w-4 text-white/25" />
            </Link>
          ))}
          {!sonuc.length && <p className="px-4 py-4 text-[14px] text-white/45">Eşleşen ayar yok.</p>}
        </div>
      ) : (
        <>
          <Link href="/panel/ayarlar/hesap" className="mt-5 flex items-center gap-3.5 rounded-[18px] bg-[#141416] p-3.5 active:bg-[#19191b]">
            <Avatar ad={k.ad} src={k.avatar} boyut={52} />
            <span className="min-w-0 flex-1"><span className="block truncate text-[17px] font-semibold text-white">{k.ad}</span><span className="block truncate text-[13px] text-white/45">{k.email} · {PLAN_ADI[k.plan]}</span></span>
            <ChevronRight className="h-4 w-4 text-white/25" />
          </Link>
          {AYAR_GRUPLARI.map((g) => (
            <div key={g.ad} className="mt-6">
              <p className="px-4 pb-2 text-[13px] text-white/40">{g.ad}</p>
              <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-[#141416]">
                {g.sayfalar.map((s) => (
                  <Link key={s.href} href={s.href} className="flex items-center gap-3 px-4 py-3 active:bg-white/[0.05]">
                    <s.ikon className="h-[18px] w-[18px] text-white/55" strokeWidth={1.9} />
                    <span className="min-w-0 flex-1 truncate text-[15.5px] text-white">{s.ad}</span>
                    {s.rozet && <span className="rounded-full bg-[#55d6fd]/12 px-1.5 py-px text-[11px] font-semibold text-[#55d6fd]">{s.rozet}</span>}
                    <ChevronRight className="h-4 w-4 text-white/25" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function GirisGerekli({ path }: { path: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-28 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/[0.06] text-white/80"><LogIn className="h-6 w-6" /></span>
      <h1 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-white">Ayarlar için giriş yap</h1>
      <p className="mt-2 max-w-[380px] text-[15px] leading-relaxed text-white/55">Hesabını, güvenliğini, planını ve tercihlerini yönetmek için hesabına giriş yap.</p>
      <Link href={`/giris?geri=${encodeURIComponent(path)}`} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition-transform active:scale-[0.97]">Giriş yap</Link>
    </div>
  );
}

export function Avatar({ ad, src, boyut = 40, tohum }: { ad: string; src?: string; boyut?: number; tohum?: string }) {
  // Fotoğraf yoksa el çizimi illüstrasyon avatar; kendi avatarımızsa üst çubuktakiyle aynı tohum (e-posta).
  const ben = useAuth((s) => s.kullanici);
  const kaynak = src || avatarAdresi(tohum ?? (ben && (ad === ben.ad || ad === ben.email) ? ben.email : ad));
  if (kaynak) return <img src={kaynak} alt="" className="shrink-0 rounded-full bg-white/[0.06] object-cover" style={{ width: boyut, height: boyut }} />;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#55d6fd,#2a7fb0)] font-semibold text-white" style={{ width: boyut, height: boyut, fontSize: Math.round(boyut * 0.4) }}>
      {ad.trim().slice(0, 1).toLocaleUpperCase("tr-TR") || "?"}
    </span>
  );
}

/** Seçili hesabın kaydı (giriş yapılmış e-posta). */
export function useHesapKaydi() {
  const email = useAuth((s) => s.kullanici?.email ?? "");
  const kayit = useHesap((s) => s.hesaplar[email.toLowerCase()]);
  const guncelle = useHesap((s) => s.guncelle);
  return { email, kayit: kayit ?? useHesap.getState().getir(email), guncelle: (f: Parameters<typeof guncelle>[1]) => guncelle(email, f) };
}

export { AYAR_SAYFALARI };
