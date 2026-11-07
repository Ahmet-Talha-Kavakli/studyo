"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, ChevronLeft, Cloud, FolderOpen, Folders, Gamepad2, Globe, LayoutDashboard, LayoutTemplate, Loader2, Menu, MessageSquare, MessagesSquare, PanelLeft, Plug, Plus, Search, Smartphone, Sparkles, Workflow, X, Gauge } from "lucide-react";
import { GenelArama } from "./GenelArama";
import { BildirimZili } from "@/components/build/bildirim/BildirimMerkezi";
import { KenarSohbetSatiri } from "@/components/build/sohbet/KenarSohbet";
import { api } from "@/lib/build/istemci";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { KenarTutamac, useKenarGenisligi } from "@/components/ui/KenarTutamac";
import { KrediJeton } from "@/components/ui/KrediHap";
import { KullaniciAvatar } from "@/components/ui/KullaniciAvatar";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import { studyoYenile, useStudyo, type SonOge } from "./useStudyo";

const GENIS = 268, DAR = 64;

/** Stüdyo bölümleri. Yalnız gerçekten çalışan bölümler listelenir (boş "yakında" bölümü gösterilmez). */
export const BOLUMLER: { id: string; ad: string; ikon: typeof FolderOpen; href: string; aktif: boolean }[] = [
  { id: "projeler", ad: "Projeler", ikon: FolderOpen, href: "/panel/build/projeler", aktif: true },
  { id: "ajanlar", ad: "Ajanlar", ikon: Bot, href: "/panel/build/ajanlar", aktif: true },
  { id: "sistemler", ad: "Sistemler", ikon: Workflow, href: "/panel/build/sistemler", aktif: true },
  { id: "yetenekler", ad: "Yetenekler", ikon: Sparkles, href: "/panel/build/yetenekler", aktif: true },
  { id: "baglantilar", ad: "Bağlantılar", ikon: Plug, href: "/panel/build/baglantilar", aktif: true },
  { id: "bulut", ad: "Bulut", ikon: Cloud, href: "/panel/build/bulut", aktif: true },
  { id: "sablonlar", ad: "Şablonlar", ikon: LayoutTemplate, href: "/panel/build/sablonlar", aktif: true },
  { id: "kullanim", ad: "Kullanım", ikon: Gauge, href: "/panel/build/kullanim", aktif: true },
];

const TUR_IKON = { site: Globe, uygulama: LayoutDashboard, oyun: Gamepad2, mobil: Smartphone } as const;

function SonSatir({ o, aktif }: { o: SonOge; aktif: boolean }) {
  const I = o.tur === "sohbet" ? MessageSquare : TUR_IKON[o.projeTur ?? "site"];
  return (
    <Link href={o.href} title={o.ad} className={cn("group/satir flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] transition-colors", aktif ? "bg-white/[0.08] text-white" : "text-white/65 hover:bg-white/[0.04] hover:text-white")}>
      <I className="h-[15px] w-[15px] shrink-0 opacity-60" strokeWidth={1.8} />
      <span className="min-w-0 flex-1 truncate">{o.ad}</span>
      {o.calisiyor && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#55d6fd]" />}
      {o.yayinda && !o.calisiyor && <span title="Yayında" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#55d6fd]" />}
    </Link>
  );
}

/**
 * Vayra Build stüdyosunun kenar çubuğu (Claude dili): üstte Vayra'ya dönüş ve marka, Yeni ve Ara, ince çizgiyle
 * ayrılmış bölümler, son çalışmalar (sohbetler ve projeler, tarihe göre), altta hesap ve kredi. Daraltılabilir,
 * sürükleyerek genişlik; telefonda soldan açılan çekmece.
 */
export function BuildKenar() {
  const path = usePathname();
  const router = useRouter();
  const kullanici = useAuth((s) => s.kullanici);
  const { son, yukle } = useStudyo();
  const [dar, setDar] = useState(false);
  const [mobil, setMobil] = useState(false);
  const [ara, setAra] = useState(false);
  const [sabitler, setSabitler] = useState<{ id: string; baslik: string; calisiyor?: boolean }[]>([]);
  const en = useKenarGenisligi("build-kenar", GENIS, 220, 400);
  const [genis, setGenis] = useState(GENIS);
  useEffect(() => { setGenis(en.get()); return en.on("change", setGenis); }, [en]);
  useEffect(() => { try { setDar(localStorage.getItem("vayra-build-kenar-dar") === "1"); } catch { /* yok */ } }, []);
  useEffect(() => { setMobil(false); yukle(); }, [path, yukle]);
  // Sabitlenen sohbetler (kenar çubuğunda ayrı bölüm).
  const [sabitSayac, setSabitSayac] = useState(0);
  /** Kenar çubuğundaki sohbet menüsünden değişiklik: listeleri yenile; açık sohbet silindiyse sohbetlere dön. */
  const sohbetDegisti = (id: string) => (silindi?: boolean) => { setSabitSayac((x) => x + 1); studyoYenile(); if (silindi && path === `/panel/build/sohbet/${id}`) router.push("/panel/build/sohbet"); };
  useEffect(() => { api<{ sohbetler: { id: string; baslik: string; sabit?: boolean; calisiyor?: boolean }[] }>("/api/build/sohbet").then((v) => setSabitler(v.sohbetler.filter((x) => x.sabit).slice(0, 12))).catch(() => {}); }, [path, son, sabitSayac]);
  const genislik = dar ? DAR : genis;
  useEffect(() => {
    const u = () => document.documentElement.style.setProperty("--build-kenar", window.matchMedia("(min-width: 768px)").matches ? `${genislik}px` : "0px");
    u(); addEventListener("resize", u); return () => removeEventListener("resize", u);
  }, [genislik]);
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "o") { e.preventDefault(); router.push("/panel/build"); }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "k") { e.preventDefault(); setAra(true); }
    };
    addEventListener("keydown", t); return () => removeEventListener("keydown", t);
  }, [router]);
  const daralt = (d: boolean) => { setDar(d); try { localStorage.setItem("vayra-build-kenar-dar", d ? "1" : "0"); } catch { /* yok */ } };
  const gizle = dar && !mobil;
  const bolumler = BOLUMLER.filter((b) => b.aktif);
  const sonListe = useMemo(() => son.slice(0, 30), [son]);

  return (
    <>
      <button type="button" onClick={() => setMobil(true)} aria-label="Menüyü aç" className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#18181b]/90 text-white ring-1 ring-inset ring-white/[0.1] backdrop-blur md:hidden">
        <Menu className="h-[18px] w-[18px]" />
      </button>
      <AnimatePresence>{mobil && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobil(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" />}</AnimatePresence>

      <aside style={{ width: mobil ? GENIS : genislik }} aria-label="Vayra Build gezinme"
        className={cn("fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[#101012] transition-[transform,width] duration-200 ease-out md:z-40", mobil ? "translate-x-0" : "-translate-x-full md:translate-x-0")}>
        {!gizle && !mobil && <KenarTutamac en={en} anahtar="build-kenar" varsayilan={GENIS} min={220} max={400} taraf="sol" etiket="Kenar çubuğunun genişliği" />}
        {/* Üst: Vayra'ya dönüş + marka + daralt */}
        <div className={cn("flex h-14 shrink-0 items-center gap-1 px-2.5", gizle && "flex-col justify-center gap-2 py-2")}>
          {!gizle && (
            <>
              <Link href="/panel" title="Vayra'ya dön" aria-label="Vayra'ya dön" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"><ChevronLeft className="h-[18px] w-[18px]" /></Link>
              <Link href="/panel/build" className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] px-1 py-1.5 hover:bg-white/[0.03]">
                <VayraIsaret size={24} />
                <span className="truncate text-[15.5px] font-semibold tracking-[-0.02em] text-white">Vayra <span className="hero-isilti">Build</span></span>
              </Link>
            </>
          )}
          <button type="button" onClick={() => (mobil ? setMobil(false) : daralt(!dar))} aria-label={mobil ? "Kapat" : dar ? "Genişlet" : "Daralt"} title={dar ? "Genişlet" : "Daralt"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white">
            {mobil ? <X className="h-[18px] w-[18px]" /> : <PanelLeft className="h-[18px] w-[18px]" />}
          </button>
        </div>

        <nav className="shrink-0 space-y-0.5 px-2">
          <Link href="/panel/build" title="Yeni (Ctrl Shift O)" className={cn("group/yeni flex h-10 items-center gap-2.5 rounded-[10px] px-2 text-[14px] font-medium text-white transition-colors hover:bg-white/[0.05]", gizle && "justify-center px-0")}>
            <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform group-hover/yeni:rotate-90"><Plus className="h-3.5 w-3.5" strokeWidth={2.8} /></span>
            {!gizle && <span className="flex-1">Yeni</span>}
          </Link>
          <button type="button" onClick={() => setAra(true)} title="Ara (Ctrl K)" className={cn("flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/65 transition-colors hover:bg-white/[0.04] hover:text-white", gizle && "justify-center px-0")}>
            <Search className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />{!gizle && <><span className="flex-1 text-left">Ara</span><span className="flex gap-0.5 text-[10.5px] opacity-70"><kbd>Ctrl</kbd><kbd>K</kbd></span></>}
          </button>
          <BildirimZili gizle={gizle} />
          {[{ href: "/panel/build/sohbet", ad: "Sohbetler", ikon: MessagesSquare, aktif: path === "/panel/build/sohbet" || path === "/panel/build/sohbet/yeni" || path === "/panel/build/sohbet/bellek" },
            { href: "/panel/build/sohbet/klasorler", ad: "Klasörler", ikon: Folders, aktif: path.startsWith("/panel/build/sohbet/klasor") }].map((b) => (
            <Link key={b.href} href={b.href} title={b.ad} className={cn("flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] transition-colors", b.aktif ? "bg-white/[0.08] text-white" : "text-white/65 hover:bg-white/[0.04] hover:text-white", gizle && "justify-center px-0")}>
              <b.ikon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />{!gizle && b.ad}
            </Link>
          ))}
          <div className="mx-2 my-1.5 h-px bg-white/[0.07]" />
          {bolumler.map((b) => {
            const aktif = path.startsWith(b.href);
            return (
              <Link key={b.id} href={b.href} title={b.ad} className={cn("flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] transition-colors", aktif ? "bg-white/[0.08] text-white" : "text-white/65 hover:bg-white/[0.04] hover:text-white", gizle && "justify-center px-0")}>
                <b.ikon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />{!gizle && b.ad}
              </Link>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-2 [scrollbar-width:thin]">
          {!gizle && (
            <>
              <div className="mx-2 my-1.5 h-px bg-white/[0.07]" />
              {sabitler.length > 0 && <>
                <p className="px-2.5 pb-1 pt-2 text-[12px] font-medium text-white/40">Sabitlenenler</p>
                {sabitler.map((x) => <KenarSohbetSatiri key={x.id} id={x.id} baslik={x.baslik} sabit calisiyor={x.calisiyor} aktif={path === `/panel/build/sohbet/${x.id}`} degisti={sohbetDegisti(x.id)} />)}
              </>}
              <p className="px-2.5 pb-1 pt-2 text-[12px] font-medium text-white/40">Son çalışmalar</p>
              {sonListe.length ? sonListe.filter((o) => !sabitler.some((x) => `s-${x.id}` === o.id)).map((o) => o.tur === "sohbet" ? <KenarSohbetSatiri key={o.id} id={o.id.slice(2)} baslik={o.ad} calisiyor={o.calisiyor} aktif={path === o.href} degisti={sohbetDegisti(o.id.slice(2))} /> : <SonSatir key={o.id} o={o} aktif={path === o.href} />)
                : <p className="mx-1 mt-1 rounded-[14px] bg-white/[0.04] p-3 text-[12.5px] leading-relaxed text-white/45 ring-1 ring-inset ring-white/[0.06]">Henüz bir şey yok. Yeni&apos;ye bas, ne yapmak istediğini yaz.</p>}
            </>
          )}
        </div>

        {/* Hesap */}
        <div className="shrink-0 border-t border-white/[0.06] p-2">
          <Link href="/panel/ayarlar" className={cn("flex items-center gap-2.5 rounded-[12px] p-1.5 transition-colors hover:bg-white/[0.04]", gizle && "justify-center")}>
            <KullaniciAvatar boyut={32} />
            {!gizle && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-white">{kullanici?.ad ?? "Misafir"}</span>
                <span className="flex items-center gap-1 text-[12px] text-white/50"><KrediJeton boyut={11} />{new Intl.NumberFormat("tr-TR").format(kullanici?.krediler ?? 0)} kredi</span>
              </span>
            )}
          </Link>
        </div>
      </aside>
      <GenelArama acik={ara} kapat={() => setAra(false)} />
    </>
  );
}
