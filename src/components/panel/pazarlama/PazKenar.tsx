"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home, LayoutGrid, Heart, MousePointerClick, UserPlus,
  ChevronUp, ChevronsUpDown, Plus, PanelLeft, FolderPlus, Menu, X, Check,
  MoreVertical, Pencil, ArrowRightLeft, Pin, Trash2, Folder, ChevronRight,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { useProje, type Proje } from "@/store/useSinema";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";

/* ============================================================
   PAZARLAMA SOL KENAR ÇUBUĞU — referanslar/marketing birebir.

   Referans yapısı (tüm ekranlarda aynı):
     Çalışma alanı hapı (lime işaret + "Pazarlama Stü…" + ⌃⌄)
     Ana Sayfa · Tüm üretimler · Favorilerim      (renkli ikon kutuları)
     ── Araçlar ──   Ürün Bağlantısı · Reklam Referansı
     ── Projeler ⌃── Yeni proje(soluk) · Yeni proje · <proje> · Yeni klasör

   Supercomputer sidebar'ındaki DARALT + MANUEL GENİŞLİK davranışı
   birebir taşındı: sağ kenardan sürükle (MIN..MAKS), yeterince sola
   çekince DAR moda düşer, çift tık varsayılana döner.
   İçerik payı `--paz-kenar` değişkeniyle sayfalara iner.
   ============================================================ */

const NAV = [
  { ad: "Ana Sayfa", href: "/panel/pazarlama", ikon: Home, arka: "#2A2B2E", glif: "#E9E9EA" },
  { ad: "Tüm üretimler", href: "/panel/pazarlama/uretimler", ikon: LayoutGrid, arka: "linear-gradient(135deg,#E24A8B,#C0392B)", glif: "#fff" },
  { ad: "Favorilerim", href: "/panel/pazarlama/favoriler", ikon: Heart, arka: "linear-gradient(135deg,#EC4899,#E9457F)", glif: "#fff" },
];

/* Referansta bu ikisi ROTA DEĞİL — tam ekran sihirbaz modalı açar. */
const ARACLAR = [
  { olay: "paz-urun-baglantisi", ad: "Ürün Bağlantısı", ikon: MousePointerClick, arka: "linear-gradient(135deg,#2F7BF6,#38BDF8)" },
  { olay: "paz-reklam-referansi", ad: "Reklam Referansı", ikon: UserPlus, arka: "linear-gradient(135deg,#D9459A,#8B5CF6)" },
];

export function PazKenar() {
  const path = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const aktifProjeId = sp.get("proje");
  // ── ORTAK PROJE HAVUZU (Higgsfield mantığı: tek liste tüm stüdyolarda) ──
  const projeler = useProje((s) => s.projeler);
  const projeOlustur = useProje((s) => s.projeOlustur);
  const klasorOlustur = useProje((s) => s.klasorOlustur);
  // Sabit (pin) projeler üstte; sonra en yeni oluşturulan üstte. (useMemo — stabil referans)
  const siraliProjeler = useMemo(() =>
    [...projeler].sort((a, b) =>
      (b.sabit ? 1 : 0) - (a.sabit ? 1 : 0) || (b.olusturma ?? 0) - (a.olusturma ?? 0),
    ), [projeler]);
  // Proje seç → URL ?proje=<id> (kitaplık ile AYNI desen; toggle).
  const projeSec = (id: string | null) => {
    const q = new URLSearchParams(Array.from(sp.entries()));
    if (id) q.set("proje", id); else q.delete("proje");
    router.push(`/panel/pazarlama/uretimler${q.toString() ? `?${q}` : ""}`);
  };
  const yeniProje = () => { const id = projeOlustur("Yeni proje", "Pazarlama", { kaynakStudyo: "Pazarlama" }); projeSec(id); toast.success("Proje oluşturuldu"); };
  const yeniKlasor = () => { klasorOlustur("Yeni klasör"); toast.success("Klasör oluşturuldu"); };
  const [projelerAcik, setProjelerAcik] = useState(true);
  const [mobilAcik, setMobilAcik] = useState(false);
  /** Çalışma alanı hapının açılır menüsü (referansta ⌄⌃ ikonu bunu ima eder). */
  const [alanAcik, setAlanAcik] = useState(false);

  /* ── Daraltma + manuel genişlik (SC sidebar'ıyla birebir) ── */
  const DAR = 64, VARSAYILAN = 250, MIN = 190, MAKS = 360;
  const [genislik, setGenislik] = useState(VARSAYILAN);
  const [dar, setDar] = useState(false);
  const surukluyor = useRef(false);

  const kenarSurukle = (e: React.PointerEvent) => {
    e.preventDefault();
    surukluyor.current = true;
    const tasi = (ev: PointerEvent) => {
      const g = Math.round(ev.clientX);
      if (g < MIN - 30) { setDar(true); return; }
      setDar(false);
      setGenislik(Math.max(MIN, Math.min(MAKS, g)));
    };
    const birak = () => {
      surukluyor.current = false;
      window.removeEventListener("pointermove", tasi);
      window.removeEventListener("pointerup", birak);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
  };

  const etkinGenislik = dar ? DAR : genislik;
  useEffect(() => {
    const uygula = () => {
      const gorunur = window.matchMedia("(min-width: 768px)").matches;
      document.documentElement.style.setProperty("--paz-kenar", gorunur ? `${etkinGenislik}px` : "0px");
    };
    uygula();
    window.addEventListener("resize", uygula);
    return () => window.removeEventListener("resize", uygula);
  }, [etkinGenislik]);

  const aktif = (h: string) => (h === "/panel/pazarlama" ? path === h : path.startsWith(h));
  const mobilKapat = () => setMobilAcik(false);

  return (
    <>
      <button onClick={() => setMobilAcik(true)} aria-label="Menüyü aç"
        className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A1B1D]/90 text-white backdrop-blur md:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {mobilAcik && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={mobilKapat}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-xl md:hidden" />
        )}
      </AnimatePresence>

      <aside
        onClick={(e) => { if ((e.target as HTMLElement).closest("a")) mobilKapat(); }}
        style={{ width: etkinGenislik }}
        className={cn(
          "paz-kapsam fixed inset-y-0 left-0 z-50 flex flex-col bg-[#161719] md:z-40 md:translate-x-0",
          surukluyor.current ? "transition-transform" : "transition-[transform,width] duration-200",
          mobilAcik ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}>
        {/* Sağ kenardan sürükle · çift tık varsayılana dön */}
        <span onPointerDown={kenarSurukle}
          onDoubleClick={() => { setDar(false); setGenislik(VARSAYILAN); }}
          title="Sürükleyerek genişliği ayarla"
          className="absolute inset-y-0 -right-1 z-50 hidden w-2 cursor-col-resize md:block" />

        <button onClick={mobilKapat} aria-label="Menüyü kapat"
          className="absolute right-2 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/8 hover:text-white md:hidden">
          <X className="h-4 w-4" />
        </button>

        {/* Çalışma alanı hapı */}
        <div className="relative flex items-center gap-1.5 px-4 pb-1 pt-4">
          <button
            onClick={() => (dar ? setDar(false) : setAlanAcik((v) => !v))}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2.5 rounded-[12px] bg-[#1F2022] px-2.5 py-2.5 ring-1 ring-[#2A2B2D] transition-colors hover:bg-[#1E1F22]",
              dar && "justify-center px-0",
            )}>
            <VayraIsaret size={22} />
            {!dar && (
              <>
                <span className="min-w-0 flex-1 truncate text-left text-[15px] font-semibold text-white">Pazarlama Stü…</span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-[#8A8B8F]" />
              </>
            )}
          </button>

          {/* Çalışma alanı değiştirici — diğer stüdyolara geçiş */}
          <AnimatePresence>
            {alanAcik && !dar && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAlanAcik(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.14 }}
                  className="absolute left-4 right-4 top-full z-50 max-h-[60vh] overflow-y-auto rounded-[14px] bg-[#1E1F22] p-1.5 ring-1 ring-white/10"
                  style={{ boxShadow: "0 20px 50px rgba(0,0,0,.7)" }}>
                  {/* m38: TAM stüdyo listesi — yeni stüdyolar dahil (eskiden 4 taneydi) */}
                  {[
                    { ad: "Pazarlama Stüdyosu", href: "/panel/pazarlama", aktif: true },
                    { ad: "Sinema Stüdyosu", href: "/panel/sinema" },
                    { ad: "Shorts Stüdyosu", href: "/panel/shorts" },
                    { ad: "Explainer", href: "/panel/explainer" },
                    { ad: "Uzun Video Stüdyosu", href: "/panel/uzun-video" },
                    { ad: "Montaj Stüdyosu", href: "/panel/montaj" },
                    { ad: "Supercomputer", href: "/panel/supercomputer" },
                    { ad: "Canvas", href: "/panel/canvas" },
                    { ad: "AI Influencer", href: "/panel/influencer" },
                    
                  ].map((a) => (
                    <Link key={a.href} href={a.href} onClick={() => setAlanAcik(false)}
                      className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[14px] text-white transition-colors hover:bg-white/[0.07]">
                      <VayraIsaret size={18} />
                      <span className="min-w-0 flex-1 truncate">{a.ad}</span>
                      {a.aktif && <Check className="h-4 w-4" style={{ color: "var(--sn-lime,#55d6fd)" }} />}
                    </Link>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
          {!dar && (
            <button onClick={() => setDar(true)} aria-label="Paneli daralt"
              className="shrink-0 rounded-lg p-1.5 text-[#8A8B8F] transition-colors hover:bg-white/8 hover:text-white">
              <PanelLeft className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>

        {dar && (
          <div className="px-2.5 pt-1">
            <button onClick={() => setDar(false)} aria-label="Paneli genişlet"
              className="flex h-9 w-full items-center justify-center rounded-[12px] text-[#8A8B8F] transition-colors hover:bg-white/8 hover:text-white">
              <PanelLeft className="h-[18px] w-[18px] rotate-180" />
            </button>
          </div>
        )}

        <div className="gizli-scroll mt-2 flex-1 overflow-y-auto px-3 pb-3">
          {/* Ana navigasyon */}
          <div className="space-y-0.5">
            {NAV.map((n) => (
              <KenarSatir key={n.href} {...n} aktif={aktif(n.href)} dar={dar} />
            ))}
          </div>

          {/* Araçlar */}
          {!dar && <p className="px-2 pb-1 pt-7 text-[13px] font-semibold text-[#7C7D82]">Araçlar</p>}
          {dar && <div className="my-2 h-px bg-white/[0.07]" />}
          <div className="space-y-0.5">
            {ARACLAR.map((a) => (
              <button key={a.olay}
                onClick={() => window.dispatchEvent(new Event(a.olay))}
                title={dar ? a.ad : undefined}
                className={cn(
                  "flex h-[44px] w-full items-center rounded-[12px] text-[15px] text-white transition-colors hover:bg-white/[0.045]",
                  dar ? "justify-center px-0" : "gap-3.5 px-2",
                )}>
                <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[8px]"
                  style={{ background: a.arka }}>
                  <a.ikon className="h-[15px] w-[15px] text-white" strokeWidth={2} />
                </span>
                {!dar && <span className="min-w-0 flex-1 truncate text-left">{a.ad}</span>}
              </button>
            ))}
          </div>

          {/* Projeler */}
          {!dar && (
            <button onClick={() => setProjelerAcik((v) => !v)}
              className="flex w-full items-center justify-between px-2 pb-1 pt-7 text-[13px] font-semibold text-[#7C7D82] transition-colors hover:text-white/70">
              Projeler
              <ChevronUp className={cn("h-3.5 w-3.5 transition-transform", !projelerAcik && "rotate-180")} />
            </button>
          )}
          <AnimatePresence initial={false}>
            {projelerAcik && !dar && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="space-y-0.5 overflow-hidden">
                {/* "Yeni proje" oluşturma satırı — GERÇEK: ortak havuza proje ekler */}
                <button onClick={yeniProje}
                  className="flex h-[44px] w-full items-center gap-3 rounded-[12px] px-2 text-[15px] text-[#6E6F74] transition-colors hover:bg-white/[0.045] hover:text-white">
                  <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full ring-1 ring-[#3A3B3F]">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                  Yeni proje
                </button>
                {/* GERÇEK proje listesi — ortak useProje havuzundan (klasörler + projeler) */}
                {siraliProjeler.map((p) => (
                  <ProjeSatir key={p.id} proje={p} aktif={aktifProjeId === p.id}
                    onSec={() => projeSec(aktifProjeId === p.id ? null : p.id)} />
                ))}
                {/* "Yeni klasör" — GERÇEK: ortak havuza klasör ekler */}
                <button onClick={yeniKlasor}
                  className="flex h-[44px] w-full items-center gap-3 rounded-[12px] px-2 text-[15px] text-white transition-colors hover:bg-white/[0.045]">
                  <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center">
                    <FolderPlus className="h-[17px] w-[17px] text-[#8A8B8F]" />
                  </span>
                  Yeni klasör
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>
    </>
  );
}

/* ── Ana satır: renkli ikon kutusu + etiket (aktifte dolu hap) ── */
function KenarSatir({
  ad, href, ikon: Ikon, arka, glif = "#fff", aktif, dar,
}: {
  ad: string; href: string; ikon: typeof Home; arka: string; glif?: string;
  aktif: boolean; dar: boolean;
}) {
  return (
    <Link href={href} title={dar ? ad : undefined}
      className={cn(
        "flex h-[44px] items-center rounded-[12px] text-[15px] transition-colors",
        dar ? "justify-center px-0" : "gap-3.5 px-2",
        aktif ? "bg-[#222325] font-semibold text-white" : "text-white hover:bg-white/[0.045]",
      )}>
      <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[8px]"
        style={{ background: arka }}>
        <Ikon className="h-[15px] w-[15px]" style={{ color: glif }} strokeWidth={2} />
      </span>
      {!dar && <span className="min-w-0 flex-1 truncate">{ad}</span>}
    </Link>
  );
}

/* ── Proje satırı — GERÇEK proje/klasör: seç + sağ-tık menü (Rename/Move/Pin/Delete) ── */
function ProjeSatir({ proje, aktif, onSec }: { proje: Proje; aktif: boolean; onSec: () => void }) {
  const projeGuncelle = useProje((s) => s.projeGuncelle);
  const projeSil = useProje((s) => s.projeSil);
  const projeSabitle = useProje((s) => s.projeSabitle);
  const projeTasi = useProje((s) => s.projeTasi);
  // Sonsuz-döngü fix: selector'da .filter() YENİ array döndürür → snapshot cache kırılır.
  // Ham projeler listesini al, useMemo ile türet.
  const tumProjeler = useProje((s) => s.projeler);
  const klasorler = useMemo(() => tumProjeler.filter((p) => p.klasor && p.id !== proje.id), [tumProjeler, proje.id]);

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [tasiAlt, setTasiAlt] = useState(false);
  const [yenidenAdli, setYenidenAdli] = useState(false);
  const [taslakAd, setTaslakAd] = useState(proje.ad);
  const menuRef = useRef<HTMLButtonElement>(null);

  const menuAc = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const r = menuRef.current?.getBoundingClientRect() ?? { right: e.clientX, top: e.clientY } as DOMRect;
    setMenu({ x: r.right + 4, y: r.top });
  };
  const menuKapat = () => { setMenu(null); setTasiAlt(false); };

  const adKaydet = () => {
    const t = taslakAd.trim();
    if (t && t !== proje.ad) { projeGuncelle(proje.id, { ad: t }); toast.success("Yeniden adlandırıldı"); }
    setYenidenAdli(false);
  };

  // Kapak: kaynak stüdyoya göre deterministik önizleme (yoksa lime işaret / klasör ikonu).
  const kapak = proje.klasor ? null : saltUrl(onizlemeArka(proje.kapakTohum ?? proje.id, "sinema"));

  return (
    <div className="group/proje relative">
      {yenidenAdli ? (
        <div className="flex h-[44px] items-center gap-3 rounded-[12px] px-2">
          <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center overflow-hidden rounded-[8px]">
            {proje.klasor ? <Folder className="h-[18px] w-[18px] text-[#5fa8f5]" /> : <VayraIsaret size={20} />}
          </span>
          <input autoFocus value={taslakAd} onChange={(e) => setTaslakAd(e.target.value)}
            onBlur={adKaydet} onKeyDown={(e) => { if (e.key === "Enter") adKaydet(); if (e.key === "Escape") { setTaslakAd(proje.ad); setYenidenAdli(false); } }}
            className="min-w-0 flex-1 rounded-[6px] bg-white/[0.08] px-2 py-1 text-[15px] text-white outline-none ring-1 ring-aksan/50" />
        </div>
      ) : (
        /* button-içinde-button hydration hatasını önlemek için dış öğe div role=button */
        <div role="button" tabIndex={0} onClick={onSec}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSec(); } }}
          onContextMenu={menuAc}
          className={cn("flex h-[44px] w-full cursor-pointer items-center gap-3 rounded-[12px] px-2 text-left text-[15px] outline-none transition-colors",
            aktif ? "bg-[#222325] font-medium text-white" : "text-white hover:bg-white/[0.045]")}>
          <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-white/[0.05]">
            {proje.klasor ? (
              <Folder className="h-[18px] w-[18px] text-[#5fa8f5]" strokeWidth={2} />
            ) : kapak ? (
              <img src={kapak} alt="" className="h-full w-full object-cover" />
            ) : (
              <VayraIsaret size={20} />
            )}
          </span>
          <span className="min-w-0 flex-1 truncate">{proje.ad}</span>
          {proje.sabit && <Pin className="h-3 w-3 shrink-0 rotate-45 text-metin-3" />}
          {/* ⋮ menü tetiği — sağ-tık da aynı menüyü açar */}
          <button ref={menuRef} onClick={menuAc}
            className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-metin-3 transition-opacity hover:bg-white/10 hover:text-white",
              menu ? "opacity-100" : "opacity-0 group-hover/proje:opacity-100")}
            aria-label="Proje işlemleri">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Sağ-tık menü: Rename · Move to · Pin · Delete (Higgsfield birebir) ── */}
      {menu && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={menuKapat} />
          <div style={{ position: "fixed", left: menu.x, top: menu.y }}
            className="z-[61] w-44 rounded-xl bg-[#1E1F22] p-1.5 ring-1 ring-white/10 shadow-2xl">
            <button onClick={() => { setYenidenAdli(true); setTaslakAd(proje.ad); menuKapat(); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] text-white transition-colors hover:bg-white/[0.07]">
              <Pencil className="h-4 w-4 text-metin-2" /> Yeniden adlandır
            </button>
            {/* Move to — alt menü (klasör listesi) */}
            <div className="relative" onMouseEnter={() => setTasiAlt(true)} onMouseLeave={() => setTasiAlt(false)}>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] text-white transition-colors hover:bg-white/[0.07]">
                <ArrowRightLeft className="h-4 w-4 text-metin-2" /> Şuraya taşı
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-metin-3" />
              </button>
              {tasiAlt && (
                <div className="absolute left-full top-0 ml-1 w-52 rounded-xl bg-[#1E1F22] p-1.5 ring-1 ring-white/10 shadow-2xl">
                  {proje.klasorId && (
                    <button onClick={() => { projeTasi(proje.id, undefined); toast.success("Köke taşındı"); menuKapat(); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] text-white transition-colors hover:bg-white/[0.07]">
                      <ArrowRightLeft className="h-4 w-4 text-metin-2" /> Kök dizine al
                    </button>
                  )}
                  {klasorler.length === 0 ? (
                    <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06]"><LayoutGrid className="h-4 w-4 text-metin-3" /></span>
                      <span className="text-[13px] text-metin-3">Klasör bulunamadı</span>
                    </div>
                  ) : klasorler.map((k) => (
                    <button key={k.id} onClick={() => { projeTasi(proje.id, k.id); toast.success(`"${k.ad}" klasörüne taşındı`); menuKapat(); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] text-white transition-colors hover:bg-white/[0.07]">
                      <Folder className="h-4 w-4 text-[#5fa8f5]" /> <span className="min-w-0 flex-1 truncate">{k.ad}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => { projeSabitle(proje.id); toast.success(proje.sabit ? "Sabitleme kaldırıldı" : "Sabitlendi"); menuKapat(); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] text-white transition-colors hover:bg-white/[0.07]">
              <Pin className="h-4 w-4 text-metin-2" /> {proje.sabit ? "Sabitlemeyi kaldır" : "Sabitle"}
            </button>
            <div className="my-1 h-px bg-white/[0.07]" />
            <button onClick={() => { projeSil(proje.id); toast.success("Silindi"); menuKapat(); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] text-rose-400 transition-colors hover:bg-rose-500/10">
              <Trash2 className="h-4 w-4" /> Sil
            </button>
          </div>
        </>
      )}
    </div>
  );
}
