"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus, Search, ChevronDown, LayoutGrid, Settings, Tag, PanelLeft,
  MoreVertical, Pencil, Pin, Trash2, Menu, X, ChevronsUpDown,
} from "lucide-react";
import { VayraIsaret } from "./VayraIsaret";
import { useAuth } from "@/store/useAuth";
import { useSupercomputer } from "@/store/useSupercomputer";
import { useTercih } from "@/store/useTercih";
import { SCArama } from "@/components/kabuk/sc/SCArama";
import { sohbetIkonu } from "@/lib/scSohbetIkon";
import { cn } from "@/lib/utils";

/**
 * Supercomputer sol kenar çubuğu — Higgsfield BİREBİR.
 * Referans: HIGGSFIELD-SPEC.md §1 Kabuk B.
 *
 * Genişlik 200px · zemin #0f1113 · aktif satır: dolu yuvarlak dikdörtgen #232527 (r=10)
 * Grup başlıkları 12px #6e6e73 + daraltma chevron'u.
 * Altta sabit: Pricing (fuşya %30 İNDİRİM rozeti) + hesap satırı.
 */

/**
 * Claude düzeni: sidebar SADE tutulur — ürün vitrini yoktur.
 * Higgsfield'dan gelen "Ürünler" (Uygulamalar/Oyunlar) ve "Özelleştir" grupları
 * kaldırıldı; Çalışanlar / Beceriler / Bağlayıcılar / Hafıza artık AYARLAR
 * altında yaşıyor (Claude'da hepsi Settings'in sekmeleridir).
 *
 * Sidebar'da yalnızca gezinme kalır: Yeni sohbet · Sohbetler · Ayarlar · hesap.
 */
const GEZINME = [
  { ad: "Ayarlar", href: "/panel/supercomputer/ayarlar", ikon: Settings },
];

function GrupBaslik({
  ad, acik, onTikla,
}: { ad: string; acik: boolean; onTikla: () => void }) {
  return (
    <button
      onClick={onTikla}
      className="flex w-full items-center justify-between px-2.5 pb-1 pt-3.5 text-[12px] text-[var(--sc-metin-3)] transition-colors hover:text-[var(--sc-metin-2)]"
    >
      {ad}
      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !acik && "-rotate-90")} />
    </button>
  );
}

/* Ürün/Özelleştir satırı — referansta ikon KARE KUTU içinde, satır 44px, yazı 15px. */
function Satir({
  ad, href, ikon: Ikon, aktif, rozet, dar,
}: {
  ad: string; href: string; ikon: typeof LayoutGrid; aktif: boolean; rozet?: string; dar?: boolean;
}) {
  return (
    <Link
      href={href}
      title={dar ? ad : undefined}
      className={cn(
        // Koyu temada metin açık; aktif satır bir kademe açık yüzey.
        "flex h-[44px] items-center rounded-[12px] text-[15px] text-[var(--sc-metin)] transition-colors",
        dar ? "justify-center px-0" : "gap-3 px-2",
        aktif ? "bg-[var(--sc-yukselti)]" : "hover:bg-[var(--sc-cip)]",
      )}
    >
      <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--sc-cip)] text-[var(--sc-metin-2)]">
        <Ikon className="h-[17px] w-[17px]" strokeWidth={1.7} />
      </span>
      {!dar && (
        <>
          <span className="min-w-0 flex-1 truncate">{ad}</span>
          {rozet && (
            <span className="shrink-0 rounded-full bg-[var(--sn-lime)] px-2 py-[3px] text-[11px] font-bold leading-none text-[var(--sn-lime-metin)]">
              {rozet}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

export function SCSidebar() {
  const path = usePathname();
  const router = useRouter();
  const { kullanici } = useAuth();
  const { sohbetler, sohbetSil, sohbetYenidenAdlandir, sohbetSabitle } = useSupercomputer();

  const [sohbetlerAcik, setSohbetlerAcik] = useState(true);
  const [menuId, setMenuId] = useState<string | null>(null);
  /** ⋮ menüsü portal ile body'ye taşınır → sidebar kaydırma kutusunun altında kalmaz. */
  const [menuKonum, setMenuKonum] = useState<{ x: number; y: number } | null>(null);
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => { setPortalHazir(true); }, []);
  // Sidebar kaydırılırsa fixed menü butondan kopar; kapat.
  useEffect(() => {
    if (!menuId) return;
    const kapat = () => setMenuId(null);
    window.addEventListener("scroll", kapat, true);
    window.addEventListener("resize", kapat);
    return () => { window.removeEventListener("scroll", kapat, true); window.removeEventListener("resize", kapat); };
  }, [menuId]);
  const [mobilAcik, setMobilAcik] = useState(false); // mobil drawer
  const [aramaMetin, setAramaMetin] = useState("");
  // Yeniden adlandırma modalı (prompt() yerine stillenmiş modal)
  const [adDegistir, setAdDegistir] = useState<{ id: string; ad: string } | null>(null);

  /* ── Daraltma + manuel genişlik (sinema sidebar'ıyla aynı davranış) — KALICI (M16) ── */
  const DAR = 64, VARSAYILAN = 250, MIN = 190, MAKS = 360;
  const scSidebarTercih = useTercih((s) => s.sidebarTercih);
  const sidebarAyarla = useTercih((s) => s.sidebarAyarla);
  const [genislik, setGenislik] = useState(VARSAYILAN);
  const [dar, setDar] = useState(false);
  useEffect(() => {
    const t = scSidebarTercih["sc"];
    if (t) {
      if (typeof t.genislik === "number") setGenislik(Math.max(MIN, Math.min(MAKS, t.genislik)));
      if (typeof t.dar === "boolean") setDar(t.dar);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const surukluyor = useRef(false);
  /** Sağ kenardan sürükleyerek genişliği ayarla (MIN..MAKS). */
  const kenarSurukle = (e: React.PointerEvent) => {
    e.preventDefault();
    surukluyor.current = true;
    const tasi = (ev: PointerEvent) => {
      const g = Math.round(ev.clientX);
      // Yeterince sola çekilirse daralt; aksi halde genişliği uygula.
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
      setDar((d) => { setGenislik((g) => { sidebarAyarla("sc", { genislik: g, dar: d }); return g; }); return d; });
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
  };
  const etkinGenislik = dar ? DAR : genislik;
  /* İçerik alanının sol payı — sayfalar bu değişkeni okuyor. */
  useEffect(() => {
    const uygula = () => {
      const gorunur = window.matchMedia("(min-width: 768px)").matches;
      document.documentElement.style.setProperty("--sidebar-genislik", gorunur ? `${etkinGenislik}px` : "0px");
    };
    uygula();
    window.addEventListener("resize", uygula);
    return () => window.removeEventListener("resize", uygula);
  }, [etkinGenislik]);

  const aktif = (h: string) => path === h || path.startsWith(h + "/");
  // Mobilde bir linke tıklanınca drawer kapansın
  const mobilKapat = () => setMobilAcik(false);

  // Rozet: sohbetin durumuna göre "Onay bekleniyor" (mavi) / "Yanıt bekleniyor" / "Hazır"
  const sohbetRozet = (s: (typeof sohbetler)[number]) => {
    // Koyu temada rozetler: koyu şeffaf zemin + AÇIK metin.
    if (s.onayModu === "onayli" && s.calisiyor) return { ad: "Onay bekleniyor", sinif: "bg-sky-500/15 text-sky-300" };
    if (s.calisiyor) return { ad: "Yanıt bekleniyor", sinif: "bg-amber-500/15 text-amber-300" };
    if (s.mesajlar.length > 0) return { ad: "Hazır", sinif: "bg-emerald-500/15 text-emerald-300" };
    return null;
  };

  // Filtre + sıralama: sabitlenenler üstte (aksi halde mevcut sıra korunur)
  const filtreli = aramaMetin
    ? sohbetler.filter((s) => s.baslik.toLowerCase().includes(aramaMetin.toLowerCase()))
    : sohbetler;
  const siraliSohbetler = [...filtreli].sort((a, b) => Number(b.sabit ?? false) - Number(a.sabit ?? false));

  return (
    <>
      {/* Mobil hamburger tetikleyici — sol-üst sabit (md+ gizli) */}
      <button
        onClick={() => setMobilAcik(true)}
        aria-label="Menüyü aç"
        className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--sc-kenar)] bg-[var(--sc-panel)]/95 text-[var(--sc-metin)] backdrop-blur md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobil arka plan karartma */}
      <AnimatePresence>
        {mobilAcik && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={mobilKapat}
            className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

    <aside
      onClick={(e) => { if ((e.target as HTMLElement).closest("a")) mobilKapat(); }}
      style={{ width: etkinGenislik }}
      className={cn(
      "sc-kapsam fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--sc-kenar)] bg-[var(--sc-panel)] md:z-40 md:translate-x-0",
      // Sürükleme sırasında geçiş kapalı — kutu parmağa yapışık kalsın.
      surukluyor.current ? "transition-transform" : "transition-[transform,width] duration-200",
      mobilAcik ? "translate-x-0" : "-translate-x-full md:translate-x-0",
    )}>
      {/* Sağ kenardan sürükleyerek genişlet/daralt · çift tık: varsayılana dön */}
      <span onPointerDown={kenarSurukle}
        onDoubleClick={() => { setDar(false); setGenislik(VARSAYILAN); sidebarAyarla("sc", { dar: false, genislik: VARSAYILAN }); }}
        title="Sürükleyerek genişliği ayarla"
        className="absolute inset-y-0 -right-1 z-50 hidden w-2 cursor-col-resize md:block" />
      {/* Mobil kapat butonu (md+ gizli) */}
      <button onClick={mobilKapat} aria-label="Menüyü kapat"
        className="absolute right-2 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)] md:hidden">
        <X className="h-4.5 w-4.5" />
      </button>
      {/* Çalışma alanı seçici — referansta DOLGULU hap içinde */}
      <div className="flex items-center gap-1.5 px-2.5 pb-1 pt-3">
        <Link href="/panel/supercomputer"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 rounded-[12px] bg-[var(--sc-cip)] px-2 py-2 transition-colors hover:bg-[var(--sc-cip-2)]",
            dar && "justify-center px-0",
          )}>
          <VayraIsaret size={26} />
          {!dar && (
            <>
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium">Supercomputer</span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />
            </>
          )}
        </Link>
        {!dar && (
          <button onClick={() => { setDar(true); sidebarAyarla("sc", { dar: true }); }}
            className="shrink-0 rounded-lg p-1.5 text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]"
            aria-label="Paneli daralt">
            <PanelLeft className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {/* Dar moddayken genişlet düğmesi */}
      {dar && (
        <div className="px-2.5 pt-1">
          <button onClick={() => { setDar(false); sidebarAyarla("sc", { dar: false }); }}
            className="flex h-9 w-full items-center justify-center rounded-[12px] text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]"
            aria-label="Paneli genişlet">
            <PanelLeft className="h-[18px] w-[18px] rotate-180" />
          </button>
        </div>
      )}

      {/* Yeni sohbet — referansta yuvarlak DİKDÖRTGEN (r≈14), tam genişlik */}
      <div className="px-2.5 pt-2">
        <button
          onClick={() => router.push("/panel/supercomputer")}
          title="Yeni sohbet"
          className={cn(
            "flex h-[46px] w-full items-center gap-3 rounded-[14px] bg-[var(--sc-cip)] text-[15px] text-[var(--sc-metin)] transition-colors hover:bg-[var(--sc-cip-2)]",
            dar ? "justify-center px-0" : "px-3",
          )}
        >
          <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-white/25">
            <Plus className="h-[15px] w-[15px]" strokeWidth={2.2} />
          </span>
          {!dar && "Yeni sohbet"}
        </button>
      </div>

      {/* Arama — /panel/supercomputer/uygulamalar sağ üstteki kutuyla BİREBİR
          aynı bileşen (SCArama): yuvarlak hap · sol büyüteç · 14px metin.
          Sidebar'da genişlik %100 olacak şekilde esner. */}
      <div className="px-2.5 pt-1">
        {dar ? (
          <button onClick={() => { setDar(false); sidebarAyarla("sc", { dar: false }); }} title="Ara"
            className="flex h-10 w-full items-center justify-center rounded-full text-[var(--sc-metin)] transition-colors hover:bg-[var(--sc-cip)]">
            <Search className="h-[19px] w-[19px]" strokeWidth={1.8} />
          </button>
        ) : (
          <SCArama deger={aramaMetin} onDegis={setAramaMetin} genislik="100%" />
        )}
      </div>

      {/* Gruplar — daraltıldığında gizlenir (üst kısım + genişlet butonu kalır) */}
      <div className="gizli-scroll flex-1 overflow-y-auto px-2.5 pb-2">
        {/* Claude düzeni: ürün vitrini yok — doğrudan gezinme (Ayarlar) sonra sohbetler. */}
        <div className="space-y-0.5 pt-2">
          {GEZINME.map((o) => <Satir key={o.href} {...o} aktif={aktif(o.href)} dar={dar} />)}
        </div>

        {!dar && <GrupBaslik ad="Sohbetler" acik={sohbetlerAcik} onTikla={() => setSohbetlerAcik((v) => !v)} />}
        <AnimatePresence initial={false}>
          {sohbetlerAcik && !dar && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              {siraliSohbetler.length === 0 ? (
                /* Boş durum — Higgsfield birebir: gri kare illüstrasyon + ⊕ rozeti */
                <div className="flex flex-col items-center px-2 py-5 text-center">
                  <span className="relative mb-2.5 flex h-[52px] w-[52px] items-center justify-center rounded-[12px] bg-[var(--sc-yukselti)]">
                    <LayoutGrid className="h-5 w-5 text-[var(--sc-metin-3)]" />
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--sc-cip-2)] ring-2 ring-[var(--sc-panel)]">
                      <Plus className="h-2.5 w-2.5 text-[var(--sc-metin-2)]" strokeWidth={3} />
                    </span>
                  </span>
                  <p className="text-[13px] font-medium text-[var(--sc-metin)]">Henüz görev yok</p>
                  <p className="mt-0.5 text-[11px] text-[var(--sc-metin-3)]">Başlamak için bir tane oluştur</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {siraliSohbetler.map((s) => {
                    const bu = path === `/panel/supercomputer/${s.id}`;
                    const rozet = sohbetRozet(s);
                    // Claude gibi: sohbetin konusuna göre tür ikonu.
                    const Ikon = sohbetIkonu(s.baslik);
                    return (
                      <div key={s.id} className="group relative">
                        <Link
                          href={`/panel/supercomputer/${s.id}`}
                          className={cn(
                            "flex h-[38px] items-center gap-2 rounded-[12px] px-2.5 pr-7 text-[15px] transition-colors",
                            bu ? "bg-[var(--sc-yukselti)] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)] hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]",
                          )}
                        >
                          {s.sabit
                            ? <Pin className="h-3.5 w-3.5 shrink-0 -rotate-45 text-[var(--sc-metin-3)]" fill="currentColor" />
                            : <Ikon className="h-[15px] w-[15px] shrink-0 text-[var(--sc-metin-3)]" strokeWidth={1.8} />}
                          <span className="min-w-0 flex-1 truncate">{s.baslik}</span>
                          {rozet ? (
                            /* Durum rozeti — Onay bekleniyor (mavi) / Yanıt bekleniyor / Hazır */
                            <span className={cn("shrink-0 rounded-full px-1.5 py-[2px] text-[9px] font-medium leading-none", rozet.sinif)}>
                              {rozet.ad}
                            </span>
                          ) : s.calisiyor ? (
                            /* Çalışıyor göstergesi — aksan nokta ızgarası */
                            <span className="grid shrink-0 grid-cols-2 gap-[2px]">
                              {[0, 1, 2, 3].map((i) => (
                                <motion.span
                                  key={i}
                                  className="h-[3px] w-[3px] rounded-[1px] bg-[var(--sc-aksan)]"
                                  animate={{ opacity: [0.25, 1, 0.25] }}
                                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12 }}
                                />
                              ))}
                            </span>
                          ) : null}
                        </Link>

                        {/* Hover'da ⋮ — menü PORTAL ile body'ye taşınır, yoksa
                            sidebar'ın overflow-y-auto kutusunun altında kalıyordu. */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            if (menuId === s.id) { setMenuId(null); return; }
                            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setMenuKonum({ x: r.right + 6, y: r.top });
                            setMenuId(s.id);
                          }}
                          className={cn(
                            "absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[var(--sc-metin-2)] transition-opacity hover:bg-[var(--sc-cip-2)] hover:text-[var(--sc-metin)]",
                            menuId === s.id ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                          )}
                          aria-label="Sohbet menüsü"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {menuId === s.id && menuKonum && portalHazir && createPortal(
                          <>
                            <div className="fixed inset-0 z-[220]" onClick={() => setMenuId(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.96, x: -4 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              transition={{ duration: 0.12 }}
                              style={{
                                position: "fixed",
                                left: Math.min(menuKonum.x, window.innerWidth - 176),
                                // alta taşarsa yukarı hizala
                                top: Math.min(menuKonum.y, window.innerHeight - 156),
                              }}
                              /* sc-kapsam ŞART: menü portal ile body'ye taşınıyor,
                                 kapsam dışında --sc-* değişkenleri çözülmüyor ve
                                 menü şeffaf görünüyordu. */
                              className="sc-kapsam z-[221] w-40 rounded-[14px] border border-[var(--sc-kenar)] bg-[var(--sc-kart)] p-1 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.75)]"
                            >
                              <button
                                onClick={() => { setAdDegistir({ id: s.id, ad: s.baslik }); setMenuId(null); }}
                                className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-sm text-[var(--sc-metin)] transition-colors hover:bg-[var(--sc-cip)]"
                              >
                                <Pencil className="h-4 w-4 text-[var(--sc-metin-2)]" /> Düzenle
                              </button>
                              <button
                                onClick={() => { sohbetSabitle(s.id); setMenuId(null); }}
                                className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-sm text-[var(--sc-metin)] transition-colors hover:bg-[var(--sc-cip)]"
                              >
                                <Pin className="h-4 w-4 text-[var(--sc-metin-2)]" /> {s.sabit ? "Sabiti kaldır" : "Sabitle"}
                              </button>
                              <div className="my-1 h-px bg-[var(--sc-kenar)]" />
                              <button
                                onClick={() => {
                                  sohbetSil(s.id);
                                  setMenuId(null);
                                  if (bu) router.push("/panel/supercomputer");
                                }}
                                className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-sm text-[var(--sc-promo)] transition-colors hover:bg-[var(--sc-promo)]/10"
                              >
                                <Trash2 className="h-4 w-4" /> Sil
                              </button>
                            </motion.div>
                          </>,
                          document.body,
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alt sabit: Fiyatlandırma + hesap */}
      <div className="border-t border-[var(--sc-kenar)] px-2.5 py-2">
        <Link
          href="/panel/kredi"
          title={dar ? "Fiyatlandırma" : undefined}
          className={cn(
            "flex h-[42px] items-center rounded-[12px] text-[15px] text-[var(--sc-promo)] transition-colors hover:bg-[var(--sc-cip)]",
            dar ? "justify-center px-0" : "gap-2.5 px-2.5",
          )}
        >
          <Tag className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
          {!dar && (
            <>
              <span className="flex-1">Fiyatlandırma</span>
              {/* Koyu temada --sc-promo AÇIK kırmızıdır; üstünde beyaz metin
                  2.74:1 kalıyordu. Dolgu üstüne koyu metin gelir. */}
              <span className="shrink-0 rounded-full bg-[var(--sc-promo)] px-2 py-[3px] text-[11px] font-bold leading-none text-[#3d0a12]">
                %30
              </span>
            </>
          )}
        </Link>
        <Link
          href="/panel/profil"
          title={dar ? (kullanici?.ad ?? "vayra") : undefined}
          className={cn(
            "mt-0.5 flex h-[44px] items-center rounded-[12px] transition-colors hover:bg-[var(--sc-cip)]",
            dar ? "justify-center px-0" : "gap-2.5 px-2",
          )}
        >
          <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-[var(--sc-cip-2)] text-[11px] font-semibold ring-2 ring-[var(--sc-aksan)]">
            {(kullanici?.ad ?? "V").charAt(0).toUpperCase()}
          </span>
          {!dar && (
            <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--sc-metin-3)]">
              {kullanici?.ad ?? "vayra"}
            </span>
          )}
        </Link>
      </div>
    </aside>

    {/* Görevi yeniden adlandır modalı — prompt() yerine stillenmiş (Higgsfield "Rename task" birebir) */}
    <AnimatePresence>
      {adDegistir && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAdDegistir(null)}
            className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative w-full max-w-[420px] rounded-[16px] border border-[var(--sc-kenar)] bg-[var(--sc-kart)] p-5 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[var(--sc-metin)]">Görevi yeniden adlandır</h3>
              <button
                onClick={() => setAdDegistir(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--sc-cip)] text-[var(--sc-metin-2)] transition-colors hover:text-[var(--sc-metin)]"
                aria-label="Kapat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <label className="mt-4 block text-[12px] text-[var(--sc-metin-2)]">Görev adı</label>
            <input
              autoFocus
              value={adDegistir.ad}
              onChange={(e) => setAdDegistir((v) => (v ? { ...v, ad: e.target.value } : v))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && adDegistir.ad.trim()) {
                  sohbetYenidenAdlandir(adDegistir.id, adDegistir.ad.trim());
                  setAdDegistir(null);
                }
                if (e.key === "Escape") setAdDegistir(null);
              }}
              className="mt-1.5 h-10 w-full rounded-lg border border-[var(--sc-kenar)] bg-[var(--sc-kart)] px-3 text-sm text-[var(--sc-metin)] outline-none focus:border-[var(--sc-aksan)]"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setAdDegistir(null)}
                className="flex-1 rounded-xl bg-[var(--sc-cip)] py-2.5 text-sm font-medium text-[var(--sc-metin-2)] transition-colors hover:bg-[var(--sc-cip)]"
              >
                İptal
              </button>
              <button
                disabled={!adDegistir.ad.trim()}
                onClick={() => {
                  sohbetYenidenAdlandir(adDegistir.id, adDegistir.ad.trim());
                  setAdDegistir(null);
                }}
                className="hf-cta flex-1 py-2.5 text-sm disabled:opacity-40"
              >
                Kaydet
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
