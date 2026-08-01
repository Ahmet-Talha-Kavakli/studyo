"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode, useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Images, Shapes, Heart, Users, Search, ArrowDownUp,
  Plus, PanelLeft, ChevronDown, GraduationCap, Globe,
  MoreVertical, Pin, Pencil, FolderPlus, Link2, Trash2, Check, Archive,
} from "lucide-react";
import { cn, onizlemeArka } from "@/lib/utils";
import { useTercih } from "@/store/useTercih";

/** Sıralama seçenekleri — referans: sidebar/ ("Sırala" menüsü). */
const SIRALAMALAR = ["İlk oluşturulan", "Son oluşturulan", "Son değişen", "Ad A-Z", "Ad Z-A"] as const;

/** Proje ⋮ menüsü — referans birebir (Sil kırmızı). */
const PROJE_ISLEMLERI: { ad: string; Ik: React.ElementType; tehlike?: boolean }[] = [
  { ad: "Sabitle", Ik: Pin },
  { ad: "Düzenle", Ik: Pencil },
  { ad: "Klasör ekle", Ik: FolderPlus },
  { ad: "Bağlantıyı kopyala", Ik: Link2 },
  { ad: "Sil", Ik: Trash2, tehlike: true },
];

/**
 * Cinema/Marketing Studio dar sol sidebar'ı — Higgsfield BİREBİR (HIGGSFIELD-SPEC.md §1 Kabuk C).
 * Üst nav'ın ALTINDA çalışır (üst nav layout'tan gelir). ~215px.
 * Menü ikonları Higgsfield gibi 3D gradyan-dolgulu yuvarlak-kare ROZET (beyaz ikon, kabartma).
 */

export function StudyoSidebar({
  baslik, ikon, temel, projeler, onYeniProje, onProjeSec, aktifProjeId, onProjeIslem,
}: {
  baslik: string;
  ikon: ReactNode;
  temel: string; // örn "/panel/sinema"
  projeler?: { id: string; ad: string; kapakTohum?: string }[]; // verilirse gerçek projeler linklenir
  onYeniProje?: () => void; // "Yeni proje" tıklaması
  // Ortak proje modu: proje tıklanınca linke gitmek yerine aktif proje olarak seçilir (stüdyoda kal).
  onProjeSec?: (id: string) => void;
  aktifProjeId?: string | null; // ortak modda hangi proje aktif (vurgu için)
  /** ⋮ menüsündeki bir işlem seçilince (Sabitle/Düzenle/Klasör ekle/Kopyala/Sil). */
  onProjeIslem?: (islem: string, projeId: string) => void;
}) {
  const path = usePathname();
  const sp = useSearchParams();
  const aktifG = sp.get("g"); // hangi görünüm aktif

  /* Proje listesi kontrolleri (referans: sidebar/) */
  const [aramaAcik, setAramaAcik] = useState(false);
  const [arama, setArama] = useState("");
  const [siraAcik, setSiraAcik] = useState(false);
  const [sira, setSira] = useState<string>("Ad A-Z");
  const [kebapId, setKebapId] = useState<string | null>(null);
  const [kebapKonum, setKebapKonum] = useState<{ top: number; left: number } | null>(null);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);

  /* ── Daraltma + manuel genişlik (kenardan sürükleme) ── KALICI (M16) ──
     Tercih useTercih'te anahtar=`temel` altında saklanır; boyut/dar-mod
     değiştirip sayfa değişince normale dönme sorunu çözülür. Rehydrate SSR
     uyumu için mount sonrası okunur. */
  const DAR = 64, VARSAYILAN = 248, MIN = 180, MAKS = 360;
  const sidebarTercih = useTercih((s) => s.sidebarTercih);
  const sidebarAyarla = useTercih((s) => s.sidebarAyarla);
  const [genislik, setGenislik] = useState(VARSAYILAN);
  const [dar, setDar] = useState(false);
  // mount sonrası kalıcı tercihi uygula (hydration guard)
  useEffect(() => {
    const t = sidebarTercih[temel];
    if (t) {
      if (typeof t.genislik === "number") setGenislik(Math.max(MIN, Math.min(MAKS, t.genislik)));
      if (typeof t.dar === "boolean") setDar(t.dar);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temel]);
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
      // sürükleme bitince kalıcı kaydet (fonksiyonel setState ile güncel değeri al)
      setDar((d) => { setGenislik((g) => { sidebarAyarla(temel, { genislik: g, dar: d }); return g; }); return d; });
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
  };
  const etkinGenislik = dar ? DAR : genislik;
  /* Alt yüzen composer'ın ortalanabilmesi için genişliği global CSS değişkenine
     yaz — sidebar daraldıkça composer da kaymalı. lg altında sidebar gizli. */
  useEffect(() => {
    const uygula = () => {
      const gorunur = window.matchMedia("(min-width: 1024px)").matches;
      document.documentElement.style.setProperty("--sidebar-genislik", gorunur ? `${etkinGenislik}px` : "0px");
    };
    uygula();
    window.addEventListener("resize", uygula);
    return () => window.removeEventListener("resize", uygula);
  }, [etkinGenislik]);

  /** Arama + sıralama uygulanmış proje listesi. */
  const suzulmus = useMemo(() => {
    let liste = [...(projeler ?? [])];
    const q = arama.trim().toLocaleLowerCase("tr");
    if (q) liste = liste.filter((p) => p.ad.toLocaleLowerCase("tr").includes(q));
    if (sira === "Ad A-Z") liste.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
    else if (sira === "Ad Z-A") liste.sort((a, b) => b.ad.localeCompare(a.ad, "tr"));
    else if (sira === "İlk oluşturulan") liste.reverse();
    return liste;
  }, [projeler, arama, sira]);

  // Higgsfield birebir: her öğenin kendi 3D gradyan rozet ikonu.
  // grad = rozet arka planı (dikey gradyan + iç parlama), ikon beyaz.
  const menu = [
    { ad: "Ana Sayfa", href: temel, ikon: Home, g: null, grad: "linear-gradient(180deg,#eef0f2,#c4c8cd)", ikonRenk: "#3a3d42" },
    { ad: "Üretimlerim", href: `${temel}?g=uretim`, ikon: Images, g: "uretim", grad: "linear-gradient(180deg,#7fe3f5,#22b8d6)", ikonRenk: "#0a3540" },
    { ad: "Elementlerim", href: `${temel}?g=element`, ikon: Shapes, g: "element", grad: "linear-gradient(180deg,#8ea0ff,#5a5cf0)", ikonRenk: "#fff" },
    { ad: "Favorilerim", href: `${temel}?g=favori`, ikon: Heart, g: "favori", grad: "linear-gradient(180deg,#ff9ecb,#f0568f)", ikonRenk: "#fff" },
  ];

  return (
    /* FIXED: sayfa kaydırılınca sidebar YERİNDE kalır. `sticky` kapsayıcı
       yüksekliğine bağımlı olduğu için bazı görünümlerde kayıyordu.
       Yer tutucu <span> aynı genişlikte boşluk bırakır (içerik altına kaymasın). */
    <>
    <span aria-hidden className="hidden shrink-0 lg:block" style={{ width: etkinGenislik }} />
    <aside
      style={{ width: etkinGenislik }}
      className={cn("fixed left-0 top-12 z-30 hidden h-[calc(100vh-3rem)] flex-col border-r border-[#171717] bg-[#0f1113] lg:flex",
        !surukluyor.current && "transition-[width] duration-200 ease-out")}>
      {/* Başlık — dar modda yalnız logo, altında daralt/genişlet düğmesi */}
      <div className={cn("flex items-center gap-2 pb-1 pt-3", dar ? "flex-col px-2" : "px-3")}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-aksan text-zemin shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">{ikon}</span>
        {!dar && <span className="min-w-0 flex-1 truncate text-sm font-medium">{baslik}</span>}
        <button onClick={() => setDar((v) => { sidebarAyarla(temel, { dar: !v }); return !v; })}
          className={cn("text-metin-3 transition-colors hover:text-metin", dar && "mt-1")}
          aria-label={dar ? "Genişlet" : "Daralt"} title={dar ? "Genişlet" : "Daralt"}>
          <PanelLeft className={cn("h-4 w-4 transition-transform", dar && "rotate-180")} />
        </button>
      </div>

      <nav className={cn("mt-2 space-y-0.5", dar ? "px-2" : "px-2")}>
        {menu.map((m) => {
          const aktif = path === temel && aktifG === m.g;
          return (
            <Link key={m.ad} href={m.href} title={dar ? m.ad : undefined}
              className={cn("flex h-10 items-center rounded-lg text-sm transition-colors",
                dar ? "justify-center px-0" : "gap-2.5 px-2",
                aktif ? "bg-[#1e1e1e] text-metin" : "text-metin-2 hover:bg-white/5 hover:text-metin")}>
              {/* 3D gradyan rozet ikon (Higgsfield birebir) */}
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_1px_2px_rgba(0,0,0,0.35)]" style={{ background: m.grad }}>
                <m.ikon className="h-[15px] w-[15px]" strokeWidth={2.2} style={{ color: m.ikonRenk }} />
              </span>
              {!dar && m.ad}
            </Link>
          );
        })}
      </nav>

      {/* Projeler — başlık + ara/sırala (referans: sidebar/). Dar modda gizli. */}
      <div className={cn("relative mt-5 px-3", dar && "hidden")}>
        <div className="flex items-center justify-between">
          <span className="text-[12px] uppercase tracking-wide text-metin-3">Projeler</span>
          <div className="flex items-center gap-1 text-metin-3">
            <button onClick={() => setAramaAcik((v) => !v)}
              className={cn("rounded-md p-1 transition-colors hover:text-metin", aramaAcik && "bg-white/10 text-metin")}
              aria-label="Ara"><Search className="h-3.5 w-3.5" /></button>
            <button onClick={() => setSiraAcik((v) => !v)}
              className={cn("rounded-md p-1 transition-colors hover:text-metin", siraAcik && "bg-white/10 text-metin")}
              aria-label="Sırala"><ArrowDownUp className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        {/* Sıralama menüsü — "Sırala" başlığı + 5 seçenek, seçilide lime ✓ */}
        <AnimatePresence>
          {siraAcik && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSiraAcik(false)} />
              <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.14 }}
                className="menu-surface absolute right-2 top-8 z-50 w-[210px] rounded-2xl p-1.5">
                <p className="px-3 pb-1 pt-1.5 text-[12px] text-metin-3">Sırala</p>
                {SIRALAMALAR.map((s) => (
                  <button key={s} onClick={() => { setSira(s); setSiraAcik(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13.5px] text-metin transition-colors hover:bg-white/[0.07]">
                    <span className="flex-1">{s}</span>
                    {sira === s && <Check className="h-3.5 w-3.5 shrink-0 text-aksan" />}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      {/* Arama kutusu — "Ara" ikonuyla açılır */}
      <AnimatePresence>
        {aramaAcik && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden px-2 pt-1.5">
            <input value={arama} onChange={(e) => setArama(e.target.value)} autoFocus placeholder="Proje ara…"
              className="w-full rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[13px] text-metin outline-none placeholder:text-metin-3" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className={cn("mt-1.5 space-y-0.5 px-2", dar && "hidden")}>
        <button onClick={onYeniProje} className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-sm text-metin-2 transition-colors hover:bg-white/5 hover:text-metin">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-dashed border-white/25 text-metin-3"><Plus className="h-3.5 w-3.5" /></span>
          Yeni proje
        </button>
        {/* Gerçek projeler — hover'da ⋮ kebap düğmesi + "İşlemler" menüsü (referans birebir). */}
        {(suzulmus.length > 0) ? suzulmus.slice(0, 10).map((p) => {
          const arka = { background: p.kapakTohum ? onizlemeArka("proj-" + p.kapakTohum, "sinematik") : onizlemeArka("proj-" + p.id, "sinematik") };
          const secili = onProjeSec ? aktifProjeId === p.id : path === `${temel}/${p.id}`;
          const govde = (
            <>
              <span className="h-6 w-6 shrink-0 overflow-hidden rounded-[7px] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" style={arka} />
              <span className="min-w-0 flex-1 truncate text-left">{p.ad}</span>
            </>
          );
          return (
            <div key={p.id} className="group/pr relative">
              {onProjeSec ? (
                <button onClick={() => onProjeSec(p.id)}
                  className={cn("flex h-9 w-full items-center gap-2.5 rounded-lg px-2 pr-8 text-sm transition-colors",
                    secili ? "bg-[#1e1e1e] text-metin ring-1 ring-aksan/50" : "text-metin-2 hover:bg-[#1c1c1e] hover:text-metin")}>
                  {govde}
                </button>
              ) : (
                <Link href={`${temel}/${p.id}`}
                  className={cn("flex h-9 w-full items-center gap-2.5 rounded-lg px-2 pr-8 text-sm transition-colors",
                    secili ? "bg-[#1e1e1e] text-metin" : "text-metin-2 hover:bg-[#1c1c1e] hover:text-metin")}>
                  {govde}
                </Link>
              )}
              {/* ⋮ — yalnız hover'da veya menüsü açıkken */}
              <button onClick={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  if (kebapId === p.id) { setKebapId(null); return; }
                  // Menü body'ye portallanıyor → konumu ekran koordinatıyla ölç.
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setKebapKonum({ top: r.top - 8, left: r.right + 8 });
                  setKebapId(p.id);
                }}
                aria-label="İşlemler"
                className={cn("absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-metin-2 transition-all hover:bg-white/10 hover:text-metin",
                  kebapId === p.id ? "opacity-100" : "opacity-0 group-hover/pr:opacity-100")}>
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          );
        }) : (
          <p className="px-2.5 py-2 text-[12px] text-metin-3">
            {arama ? "Sonuç yok" : "Henüz proje yok"}
          </p>
        )}
        {projeler && projeler.length > 0 && (
          <Link href={`${temel}?g=projeler`}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-[13px] text-metin-3 transition-colors hover:bg-white/5 hover:text-metin">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-white/[0.06]"><Archive className="h-3.5 w-3.5" /></span>
            Tüm projeleri gör
          </Link>
        )}
      </div>

      <div className={cn("mt-auto pb-3", dar ? "px-2" : "px-3")}>
        <button title={dar ? "Çalışma alanı" : undefined}
          className={cn("flex w-full items-center rounded-lg py-2 text-sm text-metin-2 transition-colors hover:bg-white/5", dar ? "justify-center px-0" : "gap-2 px-2")}>
          <span className="h-5 w-5 shrink-0 rounded-full bg-yuzey-3" />
          {!dar && <><span className="flex-1 truncate text-left">Çalışma alanı</span><ChevronDown className="h-3.5 w-3.5" /></>}
        </button>
      </div>

      {/* Manuel genişlik tutamağı — sağ kenar. Sürükle: 180–360px arası;
          çok sola çekilirse dar (ikon) moduna geçer. */}
      <span onPointerDown={kenarSurukle}
        onDoubleClick={() => { setDar(false); setGenislik(VARSAYILAN); sidebarAyarla(temel, { dar: false, genislik: VARSAYILAN }); }}
        title="Sürükleyerek genişliği ayarla · çift tık: sıfırla"
        className="group/tut absolute inset-y-0 -right-1 z-20 w-2 cursor-col-resize">
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover/tut:bg-aksan/60" />
      </span>

      {/* Proje ⋮ menüsü — BODY'ye portallanır. Sidebar içinde kalınca sağdaki
          içeriğin altında eziliyordu (stacking context sorunu). */}
      {hazir && createPortal(
        <AnimatePresence>
          {kebapId && kebapKonum && (
            <>
              <div className="fixed inset-0 z-[200]" onClick={() => setKebapId(null)} />
              <motion.div initial={{ opacity: 0, x: -6, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -6, scale: 0.97 }} transition={{ duration: 0.14 }}
                style={{ position: "fixed", top: Math.min(kebapKonum.top, window.innerHeight - 240), left: kebapKonum.left, width: 200 }}
                className="menu-surface z-[201] rounded-2xl p-1.5">
                <p className="px-3 pb-1 pt-1.5 text-[12px] text-metin-3">İşlemler</p>
                {PROJE_ISLEMLERI.map(({ ad, Ik, tehlike }) => (
                  <button key={ad} onClick={() => { onProjeIslem?.(ad, kebapId); setKebapId(null); }}
                    className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors hover:bg-white/[0.07]",
                      tehlike ? "text-rose-400" : "text-metin")}>
                    <Ik className="h-4 w-4 shrink-0" /> {ad}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </aside>
    </>
  );
}
