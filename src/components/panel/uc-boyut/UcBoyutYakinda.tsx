"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bell, ArrowUpRight, Box, Type, ImageIcon, PersonStanding, Printer, RotateCw, Check, Wand2, Layers, Palette, Play, Pause } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { MorphicBackground } from "@/components/ui/morphic-background";

/**
 * UcBoyutYakinda — 3D Stüdyo'nun bekleme ekranı.
 *
 * Neden ortak YakindaSayfa değil: o bileşen 4 sayfada paylaşılıyor
 * (3d, originals, canvas, eklentiler) ve ortalanmış-tek-sütun bir şablon.
 * 3D için sorun şuydu — bir 3D ÜRÜNÜNÜN bekleme ekranında tek bir 3D nesne
 * yoktu; sadece lucide kutu ikonu ve bulanık renk lekeleri vardı.
 *
 * ── 2026-07-31 revizyonu (kullanıcı isteği) ────────────────────────────────
 * Önceki sürüm TEK bitmiş model gösteriyordu: "direkt sonucu veriyor".
 * Artık ÜÇ farklı model var ve her biri için SÜRECİN AŞAMALARI oynatılıyor:
 *
 *    1) İstem      — kullanıcının yazdığı cümle daktilo efektiyle yazılır
 *    2) Geometri   — DOKUSUZ ham GLB döner (beyaz kil) — gerçek preview çıktısı
 *    3) Dokulama   — doku haritaları binerken tarama efekti
 *    4) Hazır      — PBR dokulu nihai GLB
 *
 * İki GLB de Meshy'den GERÇEK çıktı (scripts/meshy-asamali.mjs):
 * `-ham.glb` = mode:"preview", `.glb` = mode:"refine"+PBR. Yani aşamalar
 * canlandırma değil, sürecin kendisi.
 */

/* model-viewer web bileşeni — tip tanımı ModelGoruntuleyici.tsx'te global
   olarak zaten yapıldı, burada yeniden bildirmiyoruz (çakışırdı). */

const YETENEKLER = [
  { ikon: Type, ad: "Metinden 3D", aciklama: "Bir cümle yaz, üretime hazır model al", renk: "#55d6fd" },
  { ikon: ImageIcon, ad: "Görselden 3D", aciklama: "Referans görselini hacme çevir", renk: "#a78bfa" },
  { ikon: PersonStanding, ad: "İskelet + animasyon", aciklama: "Karakterini otomatik hareketlendir", renk: "#4fd1a5" },
  { ikon: Printer, ad: "Baskıya hazır çıktı", aciklama: "GLB, FBX, OBJ, USDZ, STL", renk: "#f0a441" },
];

/* ── Gösterilecek üç model ────────────────────────────────────────────────
   `ham` alanı YOKSA o modelin geometri aşaması dokulu GLB ile (parlaklık
   düşürülerek) temsil edilir — varlık henüz üretilmemişse ekran yine de
   doğru anlatıyı kurar, sadece kanıt zayıflar. */
type ModelTanim = {
  ad: string; baslik: string; kisa: string; istem: string;
  glb: string; poster: string; ham?: string; hamPoster?: string;
  ucgen: string; sure: string;
};

const MODELLER: ModelTanim[] = [
  {
    ad: "kask", baslik: "Fütüristik astronot kaskı", kisa: "Kask",
    istem: "fütüristik astronot kaskı, parlak seramik kabuk, cyan visör",
    glb: "/gercek/3d/kask.glb", poster: "/gercek/3d/kask-poster.png",
    ham: "/gercek/3d/kask-ham.glb", hamPoster: "/gercek/3d/kask-ham-poster.png",
    ucgen: "30.510", sure: "3 dk 12 sn",
  },
  {
    ad: "savasci", baslik: "Zırhlı savaşçı figürü", kisa: "Savaşçı",
    istem: "zırhlı savaşçı figürü, gümüş plaka zırh, kahraman duruşu",
    glb: "/gercek/3d/savasci.glb", poster: "/gercek/3d/savasci-poster.png",
    ham: "/gercek/3d/savasci-ham.glb", hamPoster: "/gercek/3d/savasci-ham-poster.png",
    ucgen: "30.000", sure: "3 dk 48 sn",
  },
  {
    ad: "lamba", baslik: "Retro masa lambası", kisa: "Lamba",
    istem: "retro masa lambası, pirinç eklemli kol, mineli teal abajur",
    glb: "/gercek/3d/lamba.glb", poster: "/gercek/3d/lamba-poster.png",
    ham: "/gercek/3d/lamba-ham.glb", hamPoster: "/gercek/3d/lamba-ham-poster.png",
    ucgen: "30.000", sure: "2 dk 51 sn",
  },
];

/* Aşamalar — süreler toplamı bir modelin tam turu (≈11sn). */
const ASAMALAR = [
  { id: "istem", ad: "İstem", ikon: Wand2, not: "Ne istediğini yaz", ms: 2600 },
  { id: "geometri", ad: "Geometri", ikon: Layers, not: "Hacim çıkarılıyor", ms: 3400 },
  { id: "doku", ad: "Dokulama", ikon: Palette, not: "PBR haritaları biniyor", ms: 3000 },
  { id: "hazir", ad: "Hazır", ikon: Check, not: "İndirilebilir model", ms: 3200 },
] as const;
type AsamaId = (typeof ASAMALAR)[number]["id"];

/** Canlı 3D sahne — GLB'yi model-viewer ile döndürür.
    GLB yüklenene kadar (veya WebGL yoksa) hazır render poster görünür, yani
    ekran HER durumda dolu: kullanıcı asla boş kutu görmez. */
function CanliModel({ glb, poster, dokusuz, tarama }: {
  glb: string; poster: string;
  /** Geometri aşaması: doku yokmuş gibi göster (ham GLB yoksa filtreyle taklit). */
  dokusuz?: boolean;
  /** Dokulama aşaması: yukarıdan aşağı tarama çizgisi. */
  tarama?: boolean;
}) {
  const [hazir, setHazir] = useState(false);   // kütüphane yüklendi → <model-viewer> basılabilir
  const [yuklendi, setYuklendi] = useState(false); // MODELİN kendisi çizildi → poster çekilebilir
  const [hata, setHata] = useState(false);
  const mvRef = useRef<HTMLElement | null>(null);
  const azHareket = useReducedMotion();

  useEffect(() => {
    let iptal = false;
    import("@google/model-viewer")
      .then(() => !iptal && setHazir(true))
      .catch(() => !iptal && setHata(true)); // sessiz düş — poster zaten duruyor
    return () => { iptal = true; };
  }, []);

  /* Posteri KÜTÜPHANE yüklenince değil, MODEL çizilince çek.
     GLB büyük; kütüphane saniyeler önce hazır olur ve poster erken kaybolursa
     model inene kadar boş kutu görünür. model-viewer'ın "load" olayı modelin
     gerçekten sahnede olduğunu bildirir. */
  useEffect(() => {
    setYuklendi(false); // kaynak değişti → yeniden bekle
    const el = mvRef.current;
    if (!hazir || !el) return;
    const tamam = () => setYuklendi(true);
    const patladi = () => setHata(true);
    el.addEventListener("load", tamam);
    el.addEventListener("error", patladi);
    return () => { el.removeEventListener("load", tamam); el.removeEventListener("error", patladi); };
  }, [hazir, glb]);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[28px]">
      {/* Sahne zemini — camın bulandıracağı renk. Model bunun üstünde durur. */}
      <div aria-hidden className="uc-sahne absolute inset-0" />

      {/* Hazır render (poster): model-viewer yüklenene kadar görünür. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="" aria-hidden
        className={cn("absolute inset-0 h-full w-full object-contain p-8 transition-opacity duration-700",
          yuklendi && !hata ? "opacity-0" : "opacity-100")}
        style={dokusuz ? { filter: "grayscale(1) brightness(1.5) contrast(0.75)" } : undefined}
        onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />

      {hazir && !hata && (
        // @ts-expect-error — model-viewer özel elementi (tipi global olarak tanımlı)
        <model-viewer
          ref={mvRef}
          key={glb}
          src={glb}
          alt="Vayra 3D Stüdyo ile üretilmiş örnek model"
          camera-controls
          auto-rotate={!azHareket}
          shadow-intensity="1"
          exposure="1.15"
          /* Kamerayı geri çek: varsayılan çerçeveleme modeli kutuya sığdırmıyor,
             alt kenarı kesiliyordu. %135 mesafe + hafif üstten açı. */
          camera-orbit="28deg 72deg 135%"
          min-camera-orbit="auto auto 110%"
          max-camera-orbit="auto auto 200%"
          interaction-prompt="none"
          style={{
            width: "100%", height: "100%", background: "transparent",
            /* Ham GLB yoksa dokulu modeli gri+parlak göstererek "kil" hissi
               veririz. Ham GLB varsa filtreye gerek yok — zaten dokusuz. */
            ...(dokusuz ? { filter: "grayscale(1) brightness(1.35) contrast(0.8)" } : null),
          }}
        />
      )}

      {/* "gerçek üretim" rozeti — bu modelin dekor değil, ürünün çıktısı
          olduğunu söyler. Sahnenin İÇİNDE durur: dışarıda sekme şeridiyle
          çakışıyordu (ölçüldü). */}
      <span className="glass-kenar pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-white">
        <Box className="h-3.5 w-3.5" style={{ color: "var(--sn-lime, #55d6fd)" }} />
        Vayra 3D ile üretildi
      </span>

      {/* Dokulama taraması — yukarıdan aşağı süpüren aksan çizgisi */}
      {tarama && (
        <motion.span aria-hidden
          initial={{ top: "-12%" }} animate={{ top: "108%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute inset-x-0 h-20"
          style={{
            background: "linear-gradient(180deg, transparent, color-mix(in srgb, var(--sn-lime,#55d6fd) 26%, transparent), transparent)",
          }} />
      )}

      {/* "sürükle" ipucu yalnızca model GERÇEKTEN etkileşime hazırken çıkar */}
      {yuklendi && !hata && !tarama && (
        <span className="glass-kenar pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11.5px] font-medium text-metin-2">
          <RotateCw className="h-3 w-3" /> döndürmek için sürükle
        </span>
      )}
    </div>
  );
}

/** Daktilo efekti — istem aşamasında cümleyi harf harf yazar. */
function Daktilo({ metin, calisiyor }: { metin: string; calisiyor: boolean }) {
  const [n, setN] = useState(0);
  const azHareket = useReducedMotion();
  useEffect(() => {
    if (!calisiyor) { setN(metin.length); return; }
    if (azHareket) { setN(metin.length); return; }
    setN(0);
    const t = setInterval(() => setN((v) => (v >= metin.length ? v : v + 1)), 26);
    return () => clearInterval(t);
  }, [metin, calisiyor, azHareket]);
  return (
    <span className="break-words text-[14px] leading-relaxed text-white">
      {metin.slice(0, n)}
      {calisiyor && n < metin.length && (
        <span className="ml-0.5 inline-block h-[15px] w-[2px] translate-y-[2px] animate-pulse"
          style={{ background: "var(--sn-lime,#55d6fd)" }} />
      )}
    </span>
  );
}

/** Aşama aşama üretim demosu — üç model arasında otomatik döner. */
function AsamaliDemo() {
  const [modelIx, setModelIx] = useState(0);
  const [asamaIx, setAsamaIx] = useState(0);
  const [duraklat, setDuraklat] = useState(false);
  const azHareket = useReducedMotion();
  const model = MODELLER[modelIx];
  const asama = ASAMALAR[asamaIx];

  /* Otomatik ilerleme: son aşamadan sonra SONRAKİ MODELE geçer.
     Kullanıcı elle model seçerse akış baştan başlar (aşağıdaki onSec). */
  useEffect(() => {
    if (duraklat || azHareket) return;
    const t = setTimeout(() => {
      setAsamaIx((a) => {
        if (a < ASAMALAR.length - 1) return a + 1;
        setModelIx((m) => (m + 1) % MODELLER.length);
        return 0;
      });
    }, asama.ms);
    return () => clearTimeout(t);
  }, [asamaIx, modelIx, duraklat, asama.ms, azHareket]);

  const modelSec = useCallback((i: number) => { setModelIx(i); setAsamaIx(0); }, []);

  // Hangi GLB gösterilecek? Geometri aşamasında ham (dokusuz), sonra dokulu.
  const geometriAsamasi = asama.id === "geometri";
  const hamVar = Boolean(model.ham);
  const kaynak = geometriAsamasi && hamVar ? model.ham! : model.glb;
  const kaynakPoster = geometriAsamasi && hamVar ? (model.hamPoster ?? model.poster) : model.poster;

  return (
    <div className="glass-kenar relative rounded-[32px] p-3">
      {/* ── Model sekmeleri: üç farklı çıktı ── */}
      <div className="mb-3 flex items-center gap-1.5 px-1">
        {MODELLER.map((m, i) => (
          <button key={m.ad} onClick={() => modelSec(i)}
            className={cn("min-w-0 flex-1 truncate rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
              i === modelIx ? "bg-aksan text-zemin" : "glass-cip text-metin-2 hover:text-metin")}>
            {m.kisa}
          </button>
        ))}
        <button onClick={() => setDuraklat((v) => !v)}
          aria-label={duraklat ? "Devam ettir" : "Duraklat"}
          className="glass-ikon flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-metin-2 hover:text-metin">
          {duraklat ? <Play className="ml-0.5 h-3 w-3 fill-current" /> : <Pause className="h-3 w-3 fill-current" />}
        </button>
      </div>

      <CanliModel
        glb={kaynak} poster={kaynakPoster}
        /* Ham GLB varsa filtre GEREKMEZ (zaten dokusuz); yoksa filtreyle taklit. */
        dokusuz={geometriAsamasi && !hamVar}
        tarama={asama.id === "doku"}
      />

      {/* ── Aşama şeridi ── */}
      <div className="mt-3 flex items-center gap-1 px-1">
        {ASAMALAR.map((a, i) => {
          const gecti = i < asamaIx, aktif = i === asamaIx;
          return (
            <button key={a.id} onClick={() => setAsamaIx(i)}
              className="group/as min-w-0 flex-1 text-left" aria-label={a.ad}>
              <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-white/10">
                <motion.span className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: "var(--sn-lime,#55d6fd)" }}
                  initial={false}
                  animate={{ width: gecti ? "100%" : aktif ? "100%" : "0%" }}
                  transition={aktif && !duraklat && !azHareket
                    ? { duration: a.ms / 1000, ease: "linear" }
                    : { duration: 0.2 }} />
              </span>
              <span className={cn("mt-1.5 flex items-center gap-1 text-[11px] font-medium transition-colors",
                aktif ? "text-white" : gecti ? "text-metin-2" : "text-metin-3")}>
                <a.ikon className="h-3 w-3 shrink-0" /> <span className="truncate">{a.ad}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Aşamaya göre değişen bilgi kutusu ── */}
      <div className="mt-3 min-h-[92px] rounded-2xl bg-black/25 p-3.5">
        <AnimatePresence mode="wait">
          <motion.div key={`${modelIx}-${asama.id}`}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}>
            {asama.id === "istem" && (
              <>
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">
                  <Wand2 className="h-3 w-3" /> İstem
                </p>
                <Daktilo metin={model.istem} calisiyor={!duraklat} />
              </>
            )}
            {asama.id === "geometri" && (
              <>
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">
                  <Layers className="h-3 w-3" /> Geometri çıkarılıyor
                </p>
                <p className="text-[13.5px] leading-relaxed text-metin-2">
                  Model önce <span className="font-semibold text-white">dokusuz hacim</span> olarak üretilir —
                  sağdaki gördüğün ham çıktının kendisi. Topoloji temizlenir, {model.ucgen} üçgene indirilir.
                </p>
              </>
            )}
            {asama.id === "doku" && (
              <>
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">
                  <Palette className="h-3 w-3" /> Dokulanıyor
                </p>
                <p className="text-[13.5px] leading-relaxed text-metin-2">
                  PBR haritaları biniyor: <span className="text-white">renk</span>,{" "}
                  <span className="text-white">metaliklik</span>, <span className="text-white">pürüzlülük</span>,{" "}
                  <span className="text-white">normal</span>. Işık artık yüzeye gerçekçi tepki veriyor.
                </p>
              </>
            )}
            {asama.id === "hazir" && (
              <>
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">
                  <Check className="h-3 w-3" style={{ color: "var(--sn-lime,#55d6fd)" }} /> Hazır
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] tabular-nums text-metin-2">
                  <span className="font-semibold text-white">{model.baslik}</span>
                  <span className="h-3 w-px bg-white/12" />
                  <span>{model.ucgen} üçgen</span>
                  <span className="h-3 w-px bg-white/12" />
                  <span>GLB · PBR</span>
                  <span className="h-3 w-px bg-white/12" />
                  <span>{model.sure}</span>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

export function UcBoyutYakinda() {
  const [haberVerildi, setHaberVerildi] = useState(false);

  /* Eskiden "haber ver" SADECE toast atıyordu — kullanıcıya söz verip hiçbir
     yere yazmıyordu. En azından tercihi kalıcı tutalım. */
  const ANAHTAR = "vayra-3d-haber-ver";
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(ANAHTAR) === "1") setHaberVerildi(true);
  }, []);

  const haberVer = () => {
    setHaberVerildi(true);
    if (typeof window !== "undefined") localStorage.setItem(ANAHTAR, "1");
    toast.success("Haber listesine eklendin", { description: "3D Stüdyo yayına girince ilk sen haberdar olacaksın." });
  };

  return (
    <div className="uc-yakinda relative min-h-[calc(100vh-3rem)] overflow-hidden bg-zemin">
      {/* Yükselen "gooey" parçacık arka planı — Vayra mavisi (#55d6fd).
          İçeriğin ALTINDA (z-0), aura'nın arkasında durur. */}
      <MorphicBackground ballColor="#55d6fd" className="hidden" aralik={200} />

      {/* Arka plan aurası — cam panellerin bulandıracağı renk katmanı. */}
      <div aria-hidden className="uc-aura pointer-events-none absolute inset-0" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-20">
        {/* ══════ SOL: anlatı ══════ */}
        <div className="min-w-0">
          <motion.span
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-kenar inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-white">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
                style={{ background: "var(--sn-lime, #55d6fd)" }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--sn-lime, #55d6fd)" }} />
            </span>
            Yapım aşamasında
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            className="mt-5 text-[40px] font-bold leading-[1.06] tracking-tight text-white sm:text-[54px]">
            Hayalini kur,
            <br />
            <span className="uc-gradyan">hacim kazansın.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-5 max-w-lg text-[16.5px] leading-relaxed text-metin-2">
            Metinden ve görselden gerçek 3D model üretimi, otomatik iskelet ve animasyon,
            baskıya hazır çıktı — hepsi tek yerde. Sağdaki üç model bir örnek değil:{" "}
            <span className="font-semibold text-white">motorumuzun ürettiği gerçek çıktılar</span>{" "}
            — istemden dokulu modele, aşama aşama.
          </motion.p>

          {/* Yetenek listesi — kart ızgarası yerine satır listesi; okunması kolay. */}
          <motion.ul
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}
            className="mt-8 grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
            {YETENEKLER.map((y, i) => (
              <motion.li key={y.ad}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                  style={{ background: `color-mix(in srgb, ${y.renk} 14%, transparent)`, color: y.renk }}>
                  <y.ikon className="h-[17px] w-[17px]" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-semibold text-white">{y.ad}</span>
                  <span className="block text-[13px] leading-snug text-metin-3">{y.aciklama}</span>
                </span>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={haberVer} disabled={haberVerildi}
              className={cn("flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-bold transition-transform",
                haberVerildi
                  ? "glass-kenar text-metin-2"
                  : "text-zemin hover:scale-[1.03] active:scale-[0.99]")}
              style={haberVerildi ? undefined : { background: "var(--sn-lime, #55d6fd)" }}>
              {haberVerildi ? <Check className="h-4.5 w-4.5" /> : <Bell className="h-4.5 w-4.5" />}
              {haberVerildi ? "Haber verilecek" : "Yayına girince haber ver"}
            </button>
            <Link href="/panel/gorsel"
              className="glass-kenar flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/[0.08]">
              Görsel Stüdyo&apos;yu dene <ArrowUpRight className="h-4.5 w-4.5" />
            </Link>
          </motion.div>
        </div>

        {/* ══════ SAĞ: aşamalı canlı 3D ══════ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.5 }}>
          <AsamaliDemo />
        </motion.div>
      </div>

      {/* ══════ ALT ŞERİT — yol haritası ══════ */}
      <div className="relative mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-metin-3">Yol haritası</span>
          <span className="h-px flex-1 bg-white/[0.07]" />
        </div>
        <ol className="grid gap-3 sm:grid-cols-3">
          {[
            { ad: "Üretim motoru", not: "Metinden ve görselden model — çalışıyor", durum: "bitti" as const },
            { ad: "İskelet & animasyon", not: "Otomatik rig, hareket kütüphanesi", durum: "surüyor" as const },
            { ad: "Yayın", not: "Sahne editörü ve dışa aktarma", durum: "sirada" as const },
          ].map((a, i) => (
            <motion.li key={a.ad}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 + i * 0.06 }}
              className="glass-kenar rounded-2xl px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className={cn("flex h-4 w-4 items-center justify-center rounded-full",
                  a.durum === "bitti" ? "" : "border")}
                  style={a.durum === "bitti"
                    ? { background: "var(--sn-lime, #55d6fd)" }
                    : a.durum === "surüyor"
                      ? { borderColor: "var(--sn-lime, #55d6fd)" }
                      : { borderColor: "rgba(255,255,255,0.22)" }}>
                  {a.durum === "bitti" && <Check className="h-2.5 w-2.5 text-zemin" strokeWidth={3.5} />}
                  {a.durum === "surüyor" && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "var(--sn-lime, #55d6fd)" }} />
                  )}
                </span>
                <span className="text-[14px] font-semibold text-white">{a.ad}</span>
              </div>
              <p className="mt-1.5 pl-6 text-[13px] leading-snug text-metin-3">{a.not}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}
