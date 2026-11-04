"use client";

import { useSCProjeler } from "@/lib/scProje";
import { MacKlasor } from "@/components/panel/proje/calisma/ortak";
import Link from "next/link";
import { KrediIsiltiHap } from "@/components/ui/KrediHap";
import { KullaniciAvatar } from "@/components/ui/KullaniciAvatar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AppWindow, Archive, Bot, ChevronRight, Check, CreditCard, FolderClosed, FolderInput, Gamepad2, Globe, ImageIcon, LayoutDashboard, Loader2, MessagesSquare, Menu, MoreHorizontal, PanelLeft, Pencil, Pin, PinOff, Plus, Search, Settings, Shapes, Trash2, User, X, CalendarClock, ChevronDown, Sparkles, MonitorDown, Gift, MessageSquare, ChevronsUpDown } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAuth, PLAN_ADI, PLAN_AYLIK_KREDI } from "@/store/useAuth";
import { useSupercomputer, type SCSohbet } from "@/store/useSupercomputer";
import { yarimKalaniKapat } from "@/lib/scSohbet";
import { useTercih } from "@/store/useTercih";
import { useKrediModal } from "@/store/useKrediModal";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import { VayraIsaret } from "./VayraIsaret";
import { useKurulum } from "@/lib/scKurulum";
import { YENILIK_SURUM } from "@/components/sc/Yenilikler";
import { KenarTutamac, useKenarGenisligi } from "@/components/ui/KenarTutamac";

/**
 * Usta kenar çubuğu — Claude düzeni: üstte logo ve daralt, Yeni sohbet ve Ara, ardından
 * gezinme (Projeler, Çıktılar; uygulama ve oyun şablonları ana ekranın galerisinde); ortada sabitlenenler ve son sohbetler (çalışan
 * sohbette dönen gösterge, onay bekleyende nokta); her satırda ⋯ menüsü (yeniden adlandır, sabitle,
 * projeye taşı, sil);
 * altta hesap satırı ve yukarı açılan hesap menüsü (kredi, ayarlar, fiyatlandırma).
 */
const GENIS = 264, DAR = 60;
const YAY = { type: "spring", stiffness: 420, damping: 34 } as const;
const POP = "sc-kapsam rounded-[14px] border border-white/[0.09] bg-[#1a1a1d] p-1.5";

/** Eski başlıklarda tek kalmış tırnaklar ('Demlik" adında') görünmesin. */
export const temizBaslik = (b: string) => ((b.match(/["“”]/g)?.length ?? 0) % 2 ? b.replace(/["“”]/g, "") : b);
/** Sohbetin son çıktısının türü → satırda küçük simge. */
const CIKTI_SIMGE = { site: Globe, oyun: Gamepad2, dashboard: LayoutDashboard, uygulama: AppWindow, gorsel: ImageIcon, video: ImageIcon } as const;
const sonCikti = (s: SCSohbet) => { for (let i = s.mesajlar.length - 1; i >= 0; i--) { const c = s.mesajlar[i].ciktilar?.at(-1); if (c) return c.tur; } return undefined; };
const SON_SINIR = 40;
/** Satır sağındaki kısa zaman: 5 dk, 3 sa, 2 g, 4 hf. */
const kisaZaman = (t: number) => { const dk = Math.max(0, Math.floor((Date.now() - t) / 60000)); return dk < 1 ? "şimdi" : dk < 60 ? `${dk} dk` : dk < 1440 ? `${Math.floor(dk / 60)} sa` : dk < 10080 ? `${Math.floor(dk / 1440)} g` : `${Math.floor(dk / 10080)} hf`; };
const sonEtkinlik = (s: SCSohbet) => s.mesajlar[s.mesajlar.length - 1]?.zaman ?? s.olusturma;
/** Sabitlenenler + tarih grupları (Claude/ChatGPT: Bugün, Dün, Önceki 7 gün…). Sabit olmayanlarda en çok SON_SINIR satır. */
function gruplar(liste: SCSohbet[]): [string, SCSohbet[]][] {
  const sirali = [...liste].sort((a, b) => sonEtkinlik(b) - sonEtkinlik(a));
  return ([["Sabitlenenler", sirali.filter((s) => s.sabit)], ["Son sohbetler", sirali.filter((s) => !s.sabit).slice(0, SON_SINIR)]] as [string, SCSohbet[]][]).filter(([, l]) => l.length);
}
/** Proje rengi: kimlikten sabit, doğrulanmış kategorik sıradan. */
const PROJE_RENK = ["#d95926", "#3987e5", "#199e70", "#c98500", "#d55181", "#9085e9"];
const projeRenk = (id: string) => PROJE_RENK[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % PROJE_RENK.length];
/** Katlanmış bölümler (tarayıcıda kalır). */
function useKatli() {
  const [katli, setKatli] = useState<Set<string>>(new Set());
  useEffect(() => { try { setKatli(new Set(JSON.parse(localStorage.getItem("sc-kenar-katli") ?? "[]"))); } catch { /* yoksay */ } }, []);
  const degis = (k: string) => setKatli((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); try { localStorage.setItem("sc-kenar-katli", JSON.stringify([...n])); } catch { /* yoksay */ } return n; });
  return [katli, degis] as const;
}

function SilPenceresi({ baslik, onKapat, onSil }: { baslik: string; onKapat: () => void; onSil: () => void }) {
  const odak = useOdakTuzagi(true);
  useEffect(() => { const t = (e: KeyboardEvent) => e.key === "Escape" && onKapat(); window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);
  return createPortal(
    <div className="perde sc-kapsam fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4" onClick={onKapat}>
      <motion.div ref={odak} role="alertdialog" aria-modal="true" aria-label="Sohbeti sil" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={YAY} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] rounded-[22px] bg-[#18181b] p-5 ring-1 ring-inset ring-white/[0.1]">
        <h2 className="text-[16px] font-semibold text-[var(--sc-metin)]">Sohbet silinsin mi?</h2>
        <p className="mt-1 text-[14px] text-[var(--sc-metin-2)]"><b className="font-medium text-[var(--sc-metin)]">{baslik}</b> ve içindeki çıktılar kalıcı olarak silinir.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onKapat} className="h-9 rounded-full px-4 text-[13.5px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06]">Vazgeç</button>
          <button autoFocus onClick={onSil} className="h-9 rounded-full bg-rose-500 px-4 text-[13.5px] font-semibold text-white">Sil</button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

function SohbetSatiri({ s, aktif, onMenu, menuAcik, duzenle, onAdKaydet }: {
  s: SCSohbet; aktif: boolean; onMenu: (r: DOMRect) => void; menuAcik: boolean; duzenle: boolean; onAdKaydet: (ad: string | null) => void;
}) {
  const bekliyor = !!s.mesajlar[s.mesajlar.length - 1]?.is?.bekleyen;
  if (duzenle) {
    return (
      <input autoFocus defaultValue={s.baslik} aria-label="Sohbet adı" onFocus={(e) => e.target.select()}
        onBlur={(e) => onAdKaydet(e.target.value.trim() || null)}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") onAdKaydet(null); }}
        className="h-8 w-full rounded-[9px] bg-white/[0.06] px-2.5 text-[13.5px] text-[var(--sc-metin)] outline-none ring-1 ring-inset ring-[var(--sc-aksan)]/50" />
    );
  }
  const tur = sonCikti(s);
  const Simge = tur ? CIKTI_SIMGE[tur] : null;
  return (
    <div className="group/satir relative before:pointer-events-none before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-white/[0.05] first:before:hidden hover:before:opacity-0 [&:hover+div]:before:opacity-0">
      <Link href={`/panel/supercomputer/${s.id}`} aria-current={aktif ? "page" : undefined}
        className={cn("relative flex h-8 items-center gap-2 rounded-[8px] pl-2 pr-8 text-[13.5px] transition-colors duration-100",
          aktif ? "bg-white/[0.085] text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)] hover:bg-white/[0.055] hover:text-[var(--sc-metin)]")}>
        <span className="min-w-0 flex-1 truncate">{temizBaslik(s.baslik)}</span>
      </Link>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 transition-opacity group-hover/satir:opacity-0">
        {s.calisiyor && !bekliyor ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--sc-aksan)]" aria-label="Çalışıyor" />
          : bekliyor ? <span className="block h-2 w-2 rounded-full bg-amber-300" title="Onayını bekliyor" /> : null}
      </span>
      <button onClick={(e) => { e.preventDefault(); onMenu(e.currentTarget.getBoundingClientRect()); }} aria-label={`${s.baslik} menüsü`} aria-expanded={menuAcik}
        className={cn("absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--sc-metin-2)] transition-opacity hover:bg-white/[0.08] hover:text-[var(--sc-metin)] focus-visible:opacity-100",
          menuAcik ? "opacity-100" : "opacity-0 group-hover/satir:opacity-100 max-md:opacity-100")}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SCSidebar() {
  const path = usePathname();
  const router = useRouter();
  const kullanici = useAuth((s) => s.kullanici);
  const { sohbetler, sohbetSil, sohbetYenidenAdlandir, sohbetSabitle, sohbetGuncelle } = useSupercomputer();
  const projeler = useSCProjeler();
  const tercih = useTercih((s) => s.sidebarTercih["sc"]);
  const sidebarAyarla = useTercih((s) => s.sidebarAyarla);
  const [dar, setDar] = useState(false);
  const [mobil, setMobil] = useState(false);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [duzenleId, setDuzenleId] = useState<string | null>(null);
  const [silId, setSilId] = useState<string | null>(null);
  const [hesap, setHesap] = useState(false);
  const [hazir, setHazir] = useState(false);
  const hesapRef = useRef<HTMLDivElement>(null);
  const [katli, katlaDegis] = useKatli();
  const kurulum = useKurulum();
  const [yenilikGoruldu, setYenilikGoruldu] = useState(true);
  useEffect(() => { try { setYenilikGoruldu(localStorage.getItem("sc-yenilik") === YENILIK_SURUM); } catch { /* yoksay */ } }, []);
  const yenilikAc = () => { router.push("/panel/surum"); setHesap(false); setYenilikGoruldu(true); try { localStorage.setItem("sc-yenilik", YENILIK_SURUM); } catch { /* yoksay */ } };
  useEffect(() => { setHazir(true); if (typeof tercih?.dar === "boolean") setDar(tercih.dar); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  /* Sayfa ilk açıldığında depoda "çalışıyor" kalmış eski sohbetleri kapat (akış yenilemede kopmuştur). */
  useEffect(() => {
    const t = setTimeout(() => {
      const st = useSupercomputer.getState();
      st.sohbetler.filter((s) => s.calisiyor).forEach((s) => yarimKalaniKapat(s.id));
      // Eski sürümün ürettiği tek tırnaklı başlıkları ('Demlik" adında') kalıcı olarak düzelt.
      st.sohbetler.forEach((s) => { const t2 = temizBaslik(s.baslik); if (t2 !== s.baslik) st.sohbetYenidenAdlandir(s.id, t2.trim()); });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const en = useKenarGenisligi("sc-kenar", GENIS, 220, 420);
  const [genis, setGenis] = useState(GENIS);
  useEffect(() => { setGenis(en.get()); return en.on("change", setGenis); }, [en]);
  const genislik = dar ? DAR : genis;
  useEffect(() => {
    const uygula = () => document.documentElement.style.setProperty("--sidebar-genislik", window.matchMedia("(min-width: 768px)").matches ? `${genislik}px` : "0px");
    uygula(); window.addEventListener("resize", uygula); return () => window.removeEventListener("resize", uygula);
  }, [genislik]);
  const [surukleniyor, setSurukleniyor] = useState(false);
  useEffect(() => { setMobil(false); setMenu(null); }, [path]);
  useEffect(() => {
    if (!menu) return;
    const kapat = () => setMenu(null);
    const tus = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("resize", kapat); window.addEventListener("scroll", kapat, true); window.addEventListener("keydown", tus);
    return () => { window.removeEventListener("resize", kapat); window.removeEventListener("scroll", kapat, true); window.removeEventListener("keydown", tus); };
  }, [menu]);
  useEffect(() => {
    if (!hesap) return;
    const t = (e: MouseEvent) => { if (!hesapRef.current?.contains(e.target as Node)) setHesap(false); };
    const k = (e: KeyboardEvent) => e.key === "Escape" && setHesap(false);
    window.addEventListener("mousedown", t); window.addEventListener("keydown", k);
    return () => { window.removeEventListener("mousedown", t); window.removeEventListener("keydown", k); };
  }, [hesap]);

  const daralt = (d: boolean) => { setDar(d); sidebarAyarla("sc", { dar: d }); setHesap(false); };
  const liste = useMemo(() => gruplar(sohbetler.filter((s) => !s.gecici && !s.arsiv && !s.kilit)), [sohbetler]);
  const menuSohbet = menu ? sohbetler.find((s) => s.id === menu.id) : undefined;
  const silSohbet = silId ? sohbetler.find((s) => s.id === silId) : undefined;
  const ad = kullanici?.ad ?? "Misafir";
  const kredi = kullanici?.krediler ?? 0;
  const kota = kullanici ? PLAN_AYLIK_KREDI[kullanici.plan] : 0;
  const oran = kota ? Math.min(1, kredi / kota) : 0;
  const sohbetSayisi = useMemo(() => { const m = new Map<string, number>(); for (const s of sohbetler) if (s.projeId && !s.gecici) m.set(s.projeId, (m.get(s.projeId) ?? 0) + 1); return m; }, [sohbetler]);
  const projeListe = useMemo(() => [...projeler].sort((a, b) => Number(!!b.sabit) - Number(!!a.sabit) || b.olusturma - a.olusturma).slice(0, 5), [projeler]);
  const gizle = dar && !mobil;


  return (
    <MotionConfig reducedMotion="user">
      <button onClick={() => setMobil(true)} aria-label="Menüyü aç"
        className="sc-kapsam sc-yazdirma-gizle fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#18181b] text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.1] md:hidden">
        <Menu className="h-[18px] w-[18px]" />
      </button>
      <AnimatePresence>
        {mobil && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobil(false)} className="perde fixed inset-0 z-40 bg-black/60 md:hidden" />}
      </AnimatePresence>

      <aside style={{ width: mobil ? GENIS : genislik }} aria-label="Usta gezinme" onPointerDownCapture={(e) => { if ((e.target as HTMLElement).closest("[role=separator]")) { setSurukleniyor(true); const b = () => { setSurukleniyor(false); window.removeEventListener("pointerup", b); }; window.addEventListener("pointerup", b); } }}
        className={cn("sc-kapsam fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[var(--sc-panel)] ease-out md:z-40", surukleniyor ? "transition-transform duration-200" : "transition-[transform,width] duration-200",
          mobil ? "translate-x-0" : "-translate-x-full md:translate-x-0")}>
        {!gizle && !mobil && <KenarTutamac en={en} anahtar="sc-kenar" varsayilan={GENIS} min={220} max={420} taraf="sol" etiket="Kenar çubuğunun genişliği" />}
        {/* Üst */}
        <div className={cn("flex h-14 shrink-0 items-center gap-1 px-3", gizle && "justify-center px-0")}>
          {!gizle && (
            <Link href="/panel/supercomputer" className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] px-1.5 py-1.5 outline-none transition-colors hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-[var(--sc-aksan)]/50">
              <VayraIsaret size={22} />
              <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--sc-metin)]">Usta</span>
            </Link>
          )}
          <button onClick={() => (mobil ? setMobil(false) : daralt(!dar))} aria-label={mobil ? "Menüyü kapat" : dar ? "Kenar çubuğunu aç" : "Kenar çubuğunu daralt"} title={dar ? "Aç" : "Daralt"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[var(--sc-metin-2)] transition-colors hover:bg-white/[0.06] hover:text-[var(--sc-metin)]">
            {mobil ? <X className="h-[18px] w-[18px]" /> : <PanelLeft className="h-[18px] w-[18px]" />}
          </button>
        </div>

        {/* Eylemler + gezinme: Claude gibi düz satırlar */}
        <nav className={cn("space-y-px border-b border-white/[0.07] px-2 pb-2", gizle && "px-2")} aria-label="Bölümler">
          <button onClick={() => { router.push("/panel/supercomputer"); setMobil(false); }} title="Yeni sohbet (Ctrl Shift O)"
            className={cn("flex h-8 w-full items-center gap-2.5 rounded-[8px] px-2 text-[14px] transition-colors", "group/yeni font-medium text-[var(--sc-metin)] hover:bg-white/[0.055]", gizle && "justify-center px-0")}>
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[var(--sc-aksan)] text-[var(--sc-aksan-metin)] transition-transform group-hover/yeni:rotate-90 group-active/yeni:scale-90"><Plus className="h-3.5 w-3.5" strokeWidth={2.8} /></span>
            {!gizle && <><span className="flex-1 text-left">Yeni sohbet</span><kbd className="text-[11.5px] font-normal text-[var(--sc-metin-3)] opacity-0 transition-opacity group-hover/yeni:opacity-100 max-md:hidden">Ctrl ⇧ O</kbd></>}
          </button>
          <button onClick={() => { window.dispatchEvent(new Event("sc-arama-ac")); setMobil(false); }} title="Sohbetlerde ara (Ctrl K)"
            className={cn("flex h-8 w-full items-center gap-2.5 rounded-[8px] px-2 text-[14px] transition-colors", "group/ara text-[var(--sc-metin-2)] hover:bg-white/[0.055] hover:text-[var(--sc-metin)]", gizle && "justify-center px-0")}>
            <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
            {!gizle && <><span className="flex-1 text-left">Ara</span><kbd className="text-[11.5px] text-[var(--sc-metin-3)] opacity-0 transition-opacity group-hover/ara:opacity-100 max-md:hidden">Ctrl K</kbd></>}
          </button>
          <div className="mx-2 my-1.5 h-px bg-white/[0.07]" />
          {([[MessagesSquare, "Sohbetler", "/panel/supercomputer/sohbetler"], [FolderClosed, "Projeler", "/panel/supercomputer/projeler"], [Bot, "Çalışanlar", "/panel/supercomputer/calisanlar"], [CalendarClock, "Görevler", "/panel/supercomputer/gorevler"], [Shapes, "Çıktılar", "/panel/supercomputer/ciktilar"]] as const).map(([I, ad, h]) => {
            const aktif = path === h || path.startsWith(h + "/");
            return (
              <Link key={h} href={h} title={gizle ? ad : undefined} aria-current={aktif ? "page" : undefined}
                className={cn("flex h-8 w-full items-center gap-2.5 rounded-[8px] px-2 text-[14px] transition-colors", aktif ? "bg-white/[0.085] text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)] hover:bg-white/[0.055] hover:text-[var(--sc-metin)]", gizle && "justify-center px-0")}>
                <I className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />{!gizle && ad}
              </Link>
            );
          })}
        </nav>

        {/* Projeler + sohbetler */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 [scrollbar-width:thin]">
          {!gizle && (liste.length === 0 ? (
            <div className="mx-1 mt-4 rounded-[14px] bg-white/[0.045] p-3.5 ring-1 ring-inset ring-white/[0.07]">
              <p className="text-[13px] font-medium text-[var(--sc-metin)]">Henüz sohbet yok</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--sc-metin-3)]">Bir soru sor ya da ana ekrandaki galeriden bir görev seç; sohbetlerin burada tarihe göre dizilir.</p>
            </div>
          ) : liste.map(([grup, l]) => {
            const kapali = katli.has(grup);
            return (
              <section key={grup} className="pt-2.5 [&+&]:mt-2 [&+&]:border-t [&+&]:border-white/[0.07]">
                <div className="group/bas flex h-7 items-center gap-1">
                  <button onClick={() => katlaDegis(grup)} aria-expanded={!kapali} className="flex min-w-0 flex-1 items-center gap-1 px-2 text-left text-[12px] font-medium text-[var(--sc-metin-3)] transition-colors hover:text-[var(--sc-metin-2)]">
                    {grup}
                    <ChevronDown className={cn("h-3 w-3 text-[var(--sc-metin-3)] opacity-0 transition-[transform,opacity] duration-150 group-hover/bas:opacity-100", kapali && "-rotate-90 opacity-100")} />
                  </button>
                  {grup === "Son sohbetler" && <Link href="/panel/supercomputer/sohbetler" className="rounded-[6px] px-1.5 py-0.5 text-[12px] text-[var(--sc-metin-3)] opacity-0 transition hover:bg-white/[0.055] hover:text-[var(--sc-metin)] group-hover/bas:opacity-100">Tümü</Link>}
                </div>
                <AnimatePresence initial={false}>
                  {!kapali && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.16 }} className="overflow-hidden">
                      {l.map((s) => (
                        <SohbetSatiri key={s.id} s={s} aktif={path === `/panel/supercomputer/${s.id}`} menuAcik={menu?.id === s.id} duzenle={duzenleId === s.id}
                          onMenu={(r) => setMenu(menu?.id === s.id ? null : { id: s.id, x: r.right + 6, y: r.top })}
                          onAdKaydet={(a) => { if (a && a !== s.baslik) { sohbetYenidenAdlandir(s.id, a.slice(0, 80)); toast.success("Sohbet adı güncellendi"); } setDuzenleId(null); }} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            );
          }))}
        </div>

        {/* Hesap */}
        <div ref={hesapRef} className={cn("relative shrink-0 border-t border-white/[0.06] p-2", gizle && "px-2")}>
          <AnimatePresence>
            {hesap && (
              <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }} transition={{ duration: 0.14 }}
                className={cn(POP, "absolute bottom-full mb-2", gizle ? "left-2 w-[240px]" : "inset-x-2.5")} role="menu" aria-label="Hesap">
                <div className="px-2.5 pb-2 pt-1.5">
                  <p className="truncate text-[13.5px] font-medium text-[var(--sc-metin)]">{ad}</p>
                  {kullanici?.email && <p className="truncate text-[12.5px] text-[var(--sc-metin-3)]">{kullanici.email}</p>}
                </div>
                {kullanici && <div className="mx-1 mb-1 flex items-center gap-2 rounded-[10px] bg-white/[0.055] px-2.5 py-2">
                  <span className="flex-1 text-[13px] text-[var(--sc-metin-2)]">Kalan kredi</span>
                  <KrediIsiltiHap boyut="sm" deger={kredi} az={kota > 0 && oran < 0.2} onClick={() => { setHesap(false); useKrediModal.getState().ac("kredi"); }} />
                </div>}
                {([[Settings, "Ayarlar", "/panel/supercomputer/ayarlar"], [CreditCard, "Planlar ve fiyatlar", "/panel/kredi"]] as const).map(([I, a, h]) => (
                  <Link key={h} href={h} role="menuitem" onClick={() => setHesap(false)} className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] text-[var(--sc-metin)] hover:bg-white/[0.06]"><I className="h-4 w-4 text-[var(--sc-metin-2)]" />{a}</Link>
                ))}
                <div className="mx-1 my-1 h-px bg-white/[0.07]" />
                <button role="menuitem" onClick={yenilikAc} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] text-[var(--sc-metin)] hover:bg-white/[0.06]">
                  <Gift className="h-4 w-4 text-[var(--sc-metin-2)]" /><span className="flex-1">Sürüm notları</span>{!yenilikGoruldu && <span className="h-2 w-2 rounded-full bg-[var(--sc-aksan)]" />}
                </button>
                {kurulum.kurulabilir && (
                  <button role="menuitem" onClick={async () => { setHesap(false); if (kurulum.ios) { toast("Ana ekrana ekle", { description: "Safari'de Paylaş düğmesine dokun, sonra \"Ana Ekrana Ekle\"yi seç." }); return; } if (await kurulum.kur()) toast.success("Vayra yüklendi", { description: "Masaüstünden ya da başlat menüsünden açabilirsin." }); }}
                    className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] text-[var(--sc-metin)] hover:bg-white/[0.06]"><MonitorDown className="h-4 w-4 text-[var(--sc-metin-2)]" />Uygulama olarak yükle</button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setHesap((v) => !v)} aria-expanded={hesap} aria-haspopup="menu" title={gizle ? ad : undefined}
            className={cn("flex w-full items-center gap-2.5 rounded-[10px] p-1.5 text-left transition-colors hover:bg-white/[0.055]", hesap && "bg-white/[0.055]", gizle && "justify-center")}>
            <KullaniciAvatar boyut={30} />
            {!gizle && (
              <>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[13.5px] font-medium text-[var(--sc-metin)]">{ad}</span>
                  <span className="block truncate text-[12px] text-[var(--sc-metin-3)]">{kullanici ? `${PLAN_ADI[kullanici.plan]} planı` : "Giriş yapılmadı"}</span>
                </span>
                <span className="relative shrink-0 text-[var(--sc-metin-3)]"><ChevronsUpDown className="h-4 w-4" />{!yenilikGoruldu && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--sc-aksan)] ring-2 ring-[var(--sc-panel)]" />}</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Sohbet menüsü (kaydırma kutusunun altında kalmasın diye body'ye taşınır) */}
      {hazir && menu && menuSohbet && createPortal(
        <>
          <div className="fixed inset-0 z-[220]" onClick={() => setMenu(null)} />
          <motion.div role="menu" aria-label="Sohbet menüsü" initial={{ opacity: 0, scale: 0.96, x: -4 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.12 }}
            style={{ position: "fixed", left: Math.min(menu.x, window.innerWidth - 216), top: Math.max(8, Math.min(menu.y, window.innerHeight - 270 - Math.min(projeler.length, 6) * 34)) }} className={cn(POP, "z-[221] w-[208px]")}>
            <button role="menuitem" onClick={() => { setDuzenleId(menuSohbet.id); setMenu(null); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] text-[var(--sc-metin)] hover:bg-white/[0.06]"><Pencil className="h-4 w-4 text-[var(--sc-metin-2)]" />Yeniden adlandır</button>
            <button role="menuitem" onClick={() => { sohbetSabitle(menuSohbet.id); setMenu(null); toast.success(menuSohbet.sabit ? "Sabitleme kaldırıldı" : "Sohbet sabitlendi"); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] text-[var(--sc-metin)] hover:bg-white/[0.06]">
              {menuSohbet.sabit ? <PinOff className="h-4 w-4 text-[var(--sc-metin-2)]" /> : <Pin className="h-4 w-4 text-[var(--sc-metin-2)]" />}{menuSohbet.sabit ? "Sabitlemeyi kaldır" : "Sabitle"}
            </button>
            <button role="menuitem" onClick={() => { sohbetGuncelle(menuSohbet.id, { arsiv: true }); setMenu(null); { const id = menuSohbet.id; toast.success("Sohbet arşivlendi", { description: "Sohbetler › Arşiv bölümünde bulabilirsin.", action: { label: "Geri al", onClick: () => sohbetGuncelle(id, { arsiv: false }) } }); } }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] text-[var(--sc-metin)] hover:bg-white/[0.06]"><Archive className="h-4 w-4 text-[var(--sc-metin-2)]" />Arşivle</button>
            <div className="my-1 h-px bg-white/[0.07]" />
            <p className="flex items-center gap-1.5 px-2.5 pb-1 pt-1 text-[12px] font-medium text-[var(--sc-metin-3)]"><FolderInput className="h-3.5 w-3.5" />Projeye taşı</p>
            {projeler.slice(0, 6).map((pr) => (
              <button key={pr.id} role="menuitem" onClick={() => { const ayni = menuSohbet.projeId === pr.id; sohbetGuncelle(menuSohbet.id, { projeId: ayni ? undefined : pr.id }); setMenu(null); toast.success(ayni ? "Projeden çıkarıldı" : `${pr.ad} projesine taşındı`); }}
                className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 text-left text-[13.5px] text-[var(--sc-metin)] hover:bg-white/[0.06]">
                <FolderClosed className="h-4 w-4 shrink-0 text-[var(--sc-metin-2)]" /><span className="min-w-0 flex-1 truncate">{pr.ad}</span>{menuSohbet.projeId === pr.id && <Check className="h-4 w-4 shrink-0 text-[var(--sc-aksan)]" />}
              </button>
            ))}
            {!projeler.length && <Link role="menuitem" href="/panel/supercomputer/projeler" onClick={() => setMenu(null)} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 text-[13.5px] text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><Plus className="h-4 w-4" />Proje oluştur</Link>}
            <div className="my-1 h-px bg-white/[0.07]" />
            <button role="menuitem" onClick={() => { setSilId(menuSohbet.id); setMenu(null); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" />Sil</button>
          </motion.div>
        </>,
        document.body,
      )}
      {hazir && silSohbet && (
        <SilPenceresi baslik={silSohbet.baslik} onKapat={() => setSilId(null)} onSil={() => {
          const bu = path === `/panel/supercomputer/${silSohbet.id}`;
          sohbetSil(silSohbet.id); setSilId(null); toast.success("Sohbet silindi");
          if (bu) router.push("/panel/supercomputer");
        }} />
      )}
    </MotionConfig>
  );
}
