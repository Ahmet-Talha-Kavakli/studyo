"use client";

import type { StudyoGomuluProps } from "@/components/studyo/tipler";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Search, HelpCircle, Play, ChevronDown, Check, Pencil, X, Grid3x3, FolderClock, BookOpen,
  Heart, Download, Copy, MoreHorizontal, Share2, Link2, Trash2, ChevronLeft, ChevronRight,
  RefreshCw, Info, Video as VideoIcon, UploadCloud, Smartphone, RectangleHorizontal, ExternalLink, FolderInput,
  MessageCircle, Pin, Briefcase, Eye, AtSign as XIkon,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { onizlemeArka, saltUrl, cn, gorseliIndir } from "@/lib/utils";
import { uretimIndir } from "@/lib/gercekEylem";
import { uretimBaslat as uretimBaslatHam, uretimHataToast } from "@/lib/uretimMotoru";
import { useRouter } from "next/navigation";
import { useAktifProje } from "@/lib/useAktifProje";
import {
  MobilComposerKabuk, MobilCip, MobilAltCip, MobilUretButonu, MobilSablonIzgarasi,
} from "@/components/panel/MobilComposer";
import { ImagePlus } from "lucide-react";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { UretimDetay } from "@/components/panel/UretimDetay";
import { UretimKarti, oranSayi } from "@/components/panel/UretimKarti";
import { SecimToolbar } from "@/components/panel/SecimToolbar";
import { YuklenenOnizleme, videoMu } from "@/components/panel/YuklenenOnizleme";
import { useAuth } from "@/store/useAuth";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";

/* ============================================================
   SHORTS STÜDYOSU — Higgsfield /shorts-studio BİREBİR (higg-shorts 13 ekran).
   Podcast/konuşan-kafa klibinden viral short üretir. Her preset = farklı altyazı/stil.
   Lime aksan (.sinema-kapsam). Sol panel + Presetler/Geçmiş/Nasıl çalışır sekmeleri +
   5-sütun 9:16 preset ızgarası + üretim lightbox + kart menü + "Kendi preset'ini oluştur" modalı.
   ============================================================ */

const LIME = "var(--sn-lime)";

type Preset = { ad: string; ozel?: boolean; kategori: string; tohum: string };

// Higgsfield Shorts preset adları BİREBİR Türkçeleştirilmiş (higg-shorts 01-08 ölçüldü).
const PRESETLER: Preset[] = [
  { ad: "Cesur Kent", kategori: "urun", tohum: "sp-boldurban" },
  { ad: "Yeşil Kontrast", kategori: "manzara", tohum: "sp-greencontrast" },
  { ad: "Kentsel Huzur", kategori: "sinematik", tohum: "sp-urbanserenity" },
  { ad: "Sıcak Işıltı", kategori: "portre", tohum: "sp-warmglow" },
  { ad: "Sarı Çerçeve", kategori: "urun", tohum: "sp-yellowframe" },
  { ad: "Monokrom", kategori: "portre", tohum: "sp-monochrome" },
  { ad: "Kil Animasyon", kategori: "soyut", tohum: "sp-claymation" },
  { ad: "Marker Karalama", kategori: "soyut", tohum: "sp-markerscribble" },
  { ad: "Etiket Tipo", kategori: "urun", tohum: "sp-stickertype" },
  { ad: "Asit Yeşili", kategori: "3d", tohum: "sp-acidgreen" },
  { ad: "Balon Tipo", kategori: "soyut", tohum: "sp-balloontype" },
  { ad: "Mavi Kopya", kategori: "sinematik", tohum: "sp-blueprint" },
  { ad: "Cesur Altyazı", kategori: "urun", tohum: "sp-boldcaption" },
  { ad: "Sınırlayıcı Kutu", kategori: "manzara", tohum: "sp-boundingbox" },
  { ad: "Devre", kategori: "3d", tohum: "sp-circuit" },
  { ad: "Çizgi Patlaması", kategori: "soyut", tohum: "sp-comicburst" },
  { ad: "Comic Pop", kategori: "soyut", tohum: "sp-comicpop" },
  { ad: "Pembe Yıkama", kategori: "portre", tohum: "sp-pinkwash" },
  { ad: "Altın Yıldız", kategori: "sinematik", tohum: "sp-goldstars" },
  { ad: "Sıvı Krom", kategori: "3d", tohum: "sp-liquidchrome" },
  { ad: "Maskot", kategori: "soyut", tohum: "sp-mascot" },
  { ad: "Neon Pop", kategori: "3d", tohum: "sp-neonpop" },
  { ad: "Neon Tipo", kategori: "3d", tohum: "sp-neontype" },
  { ad: "Desenli", kategori: "soyut", tohum: "sp-patterned" },
  { ad: "Pembe Pop", kategori: "portre", tohum: "sp-pinkpop" },
  { ad: "Pembe Karalama", kategori: "soyut", tohum: "sp-pinkscribble" },
  { ad: "Puan Pop", kategori: "urun", tohum: "sp-polkapop" },
  { ad: "Retro Kolaj", kategori: "sinematik", tohum: "sp-retrocollage" },
  { ad: "İstif Tipo", kategori: "urun", tohum: "sp-stackedtype" },
  { ad: "Yıldız Comic", kategori: "soyut", tohum: "sp-starcomic" },
  { ad: "Sokak Sanatı", kategori: "urun", tohum: "sp-streetart" },
  { ad: "Vintage Kağıt", kategori: "soyut", tohum: "sp-vintagepaper" },
  { ad: "Sarı Patlama", kategori: "urun", tohum: "sp-yellowburst" },
  { ad: "Sarı Kapı", kategori: "soyut", tohum: "sp-yellowdoor" },
];

/* GERÇEK short preset görselleri — her preset için Nano Banana ile üretildi.
 * Aynı yayıncı (kıvırcık saç, mavi gömlek, mikrofon) + her preset kendi stili.
 * Tüm PRESETLER tohumları (sp-*) üretildiği için tohum→dosya birebir. */
const GERCEK_PRESET_TOHUMLARI = new Set(PRESETLER.map((p) => p.tohum));
/** Preset tohumu için gerçek görsel yolu (yoksa undefined → stok). */
function presetShortGorsel(tohum: string): string | undefined {
  return GERCEK_PRESET_TOHUMLARI.has(tohum) ? `/gercek/shorts/${tohum}.webp` : undefined;
}
/** Preset ADINDAN gerçek görsel yolu (Ayrıntılar satırındaki sp-<ad> için). */
function presetGorselAdIle(ad: string): string | undefined {
  const p = PRESETLER.find((x) => x.ad === ad);
  return p ? presetShortGorsel(p.tohum) : undefined;
}
/** Sabit dekoratif referans kolajları (preset-oluştur kartları). */
const SHORTS_KOLAJ: Record<string, string> = {
  "pm-1": "/gercek/shorts/pm-1.webp",
  "pm-2": "/gercek/shorts/pm-2.webp",
  "yp-1": "/gercek/shorts/yp-1.webp",
  "yp-2": "/gercek/shorts/yp-2.webp",
  "yp-3": "/gercek/shorts/yp-3.webp",
};
/** Kolaj tohumu için gerçek varsa CSS background, yoksa stok. */
function shortsKolajArka(tohum: string, kat: string): string {
  const g = SHORTS_KOLAJ[tohum];
  return g ? `url("${g}") center/cover no-repeat` : onizlemeArka(tohum, kat);
}

// Higgsfield "Detected language" — bayraklı dil listesi (higg-shorts 07-08 birebir).
const DILLER: { ad: string; bayrak: string }[] = [
  { ad: "Otomatik algıla", bayrak: "🌐" }, { ad: "İngilizce", bayrak: "🇬🇧" }, { ad: "İspanyolca", bayrak: "🇪🇸" },
  { ad: "Fransızca", bayrak: "🇫🇷" }, { ad: "Kazakça", bayrak: "🇰🇿" }, { ad: "Arapça", bayrak: "🇸🇦" },
  { ad: "Bulgarca", bayrak: "🇧🇬" }, { ad: "Çince", bayrak: "🇨🇳" }, { ad: "Hırvatça", bayrak: "🇭🇷" },
  { ad: "Çekçe", bayrak: "🇨🇿" }, { ad: "Norveççe", bayrak: "🇳🇴" }, { ad: "Lehçe", bayrak: "🇵🇱" },
  { ad: "Portekizce", bayrak: "🇵🇹" }, { ad: "Romence", bayrak: "🇷🇴" }, { ad: "Rusça", bayrak: "🇷🇺" },
  { ad: "Slovakça", bayrak: "🇸🇰" }, { ad: "İsveççe", bayrak: "🇸🇪" }, { ad: "Tamilce", bayrak: "🇮🇳" },
  { ad: "Türkçe", bayrak: "🇹🇷" }, { ad: "Ukraynaca", bayrak: "🇺🇦" }, { ad: "Vietnamca", bayrak: "🇻🇳" },
];

const SEKMELER = [
  { id: "presetler", ad: "Presetler", ik: Grid3x3 },
  { id: "gecmis", ad: "Geçmiş", ik: FolderClock },
  { id: "nasil", ad: "Nasıl çalışır", ik: BookOpen },
] as const;
type SekmeId = (typeof SEKMELER)[number]["id"];

const KREDI = 33; // Higgsfield "Generate ✦ 33"

// Bir shorts üretimi 2 parçaya bölünür (higg-shorts: "Part 2 of 2 · 00:04 - 00:05").
const PARCALAR = [1, 2] as const;

/** Saniyeyi mm:ss biçimine çevirir (00:07, 01:24 …). */
function mmss(sn: number) {
  const s = Math.max(0, Math.round(sn));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** createPortal yalnızca istemcide çalışır — SSR'da document yok. */
function usePortalHazir() {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  return hazir;
}

export function ShortsStudyo({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
  /* Gömülüyken üretim, gömüldüğü projeye yazılır ve dış sayfaya haber verilir.
     Tek sarmalayıcı: her `uretimBaslat` çağrısını ayrı ayrı değiştirmeye gerek
     kalmadan hepsi buradan geçer (2026-08-02). */
  const uretimBaslat: typeof uretimBaslatHam = (istek) => {
    const s = uretimBaslatHam(gomulu && projeId ? { ...istek, projeId } : istek);
    if (s.ok && s.id) onUretildi?.(s.id);
    return s;
  };

  const { aktifProjeId } = useAktifProje(); // ortak proje: ?proje=<id> ile gelen üretimler o projeye bağlanır
  const router = useRouter();
  const [seciliAd, setSeciliAd] = useState(PRESETLER[6].ad); // Kil Animasyon (Claymation) — görselde seçili
  const [oran, setOran] = useState<"dikey" | "yatay">("dikey");
  const [dil, setDil] = useState("Otomatik algıla");
  const [dilAcik, setDilAcik] = useState(false);
  // Asıl video (mantığın kalbi): yüklenen video + süresi → süreye göre kredi
  const [video, setVideo] = useState<{ url: string; ad: string; sure: number } | null>(null);
  /* Yüklenen videonun oynatma kontrolü — tek tıkla durdur/devam
     (kullanıcı isteği 2026-07-31: "üstüne bi kere tıklayınca video durmalı"). */
  const onizlemeVideoRef = useRef<HTMLVideoElement>(null);
  const [videoDurdu, setVideoDurdu] = useState(false);
  const videoOynatDurdur = () => {
    const v = onizlemeVideoRef.current;
    if (!v) return;
    if (v.paused) { void v.play(); setVideoDurdu(false); }
    else { v.pause(); setVideoDurdu(true); }
  };
  const [ozelPresetler, setOzelPresetler] = useState<Preset[]>([]);
  const [sekme, setSekme] = useState<SekmeId>("presetler");
  const [ara, setAra] = useState("");
  const [uretiliyor, setUretiliyor] = useState(false);
  const [begeniFiltre, setBegeniFiltre] = useState(false);
  const [presetModal, setPresetModal] = useState(false);
  const [lightbox, setLightbox] = useState<Uretim | null>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const dilBtnRef = useRef<HTMLButtonElement>(null);
  const [dilKonum, setDilKonum] = useState<{ left: number; top: number } | null>(null);

  const tumUretimler = useProjeler((s) => s.uretimler);
  const shortsUretimleri = useMemo(() => {
    const liste = tumUretimler.filter((u) => u.arac === "Shorts Stüdyosu");
    return begeniFiltre ? liste.filter((u) => u.favori) : liste;
  }, [tumUretimler, begeniFiltre]);

  const tumPresetler = [...ozelPresetler, ...PRESETLER];
  const secili = tumPresetler.find((p) => p.ad === seciliAd) ?? PRESETLER[6];
  const secGercek = presetShortGorsel(secili.tohum);
  const secArka = secGercek ? `url("${secGercek}") center/cover no-repeat` : onizlemeArka(secili.tohum, secili.kategori);
  const filtre = tumPresetler.filter((p) => p.ad.toLocaleLowerCase("tr").includes(ara.toLocaleLowerCase("tr")));

  // Kredi VİDEO SÜRESİNE göre (Higgsfield mantığı): her başlanan 5 sn ≈ ✦33. Video yoksa taban ✦33.
  const kredi = video ? Math.max(KREDI, Math.ceil(video.sure / 5) * KREDI) : KREDI;

  // Video yükle + gerçek süresini oku (metadata'dan)
  const videoYukle = (dosya?: File) => {
    if (!dosya) return;
    const url = URL.createObjectURL(dosya);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const sure = Math.round(v.duration) || 0;
      if (sure > 120) { URL.revokeObjectURL(url); return toast.error("Video çok uzun", { description: "En fazla 2 dakika (120 sn)." }); }
      setVideo({ url, ad: dosya.name, sure });
      toast.success("Video yüklendi 🎬", { description: `${dosya.name} · ${sure}sn` });
    };
    v.onerror = () => { URL.revokeObjectURL(url); toast.error("Video okunamadı."); };
    v.src = url;
  };

  const uret = () => {
    if (!video) return toast.error("Önce düzenlenecek videoyu yükle.", { description: "Sol panelden bir video ekle (maks. 2 dk)." });
    setUretiliyor(true);
    const sonuc = uretimBaslat({
      baslik: `${secili.ad} · Shorts`,
      tur: "video",
      model: "Shorts Stüdyosu",
      prompt: `${secili.ad} preseti · ${oran === "dikey" ? "9:16" : "16:9"} · altyazı gömülü · ${dil} · ${video.sure}sn kaynak`,
      kredi,
      arac: "Shorts Stüdyosu",
      projeId: aktifProjeId ?? undefined,
      meta: { oran: oran === "dikey" ? "9:16" : "16:9", cozunurluk: "720p", sure: `${video.sure}s` },
    });
    if (!sonuc.ok) { setUretiliyor(false); return uretimHataToast(sonuc); }
    toast.success("Shorts üretiliyor ✦", { description: `${secili.ad} · ${oran === "dikey" ? "9:16" : "16:9"} · ${kredi} kredi` });
    setTimeout(() => { setUretiliyor(false); setSekme("gecmis"); }, 1600);
  };

  /* ── MOBİL COMPOSER ──
     Referansta Shorts: video yükle + preset galerisi + oran/dil + Üret.
     Masaüstündeki panelli düzen mobilde gizli. */
  return (
    <>
    <div className="sinema-kapsam sm:hidden">
      <MobilComposerKabuk
        baslik="Shorts Stüdyosu"
        modId="shorts"
        onKapat={() => router.push("/panel")}
        altCipler={
          <>
            <MobilAltCip tip="oran" deger={oran === "dikey" ? "9:16" : "16:9"} secenekler={["9:16", "16:9"]} onSec={(v) => setOran(v === "9:16" ? "dikey" : "yatay")} />
            <MobilCip baslik="Dil" deger={dil} secenekler={["Otomatik algıla", "Türkçe", "İngilizce", "İspanyolca", "Almanca"]} onSec={setDil} />
          </>
        }
        uretButonu={<MobilUretButonu kredi={kredi} onTikla={uret} etiket="Üret" devreDisi={!video} />}
      >
        {/* Video yükle */}
        <label className="relative flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[14px] bg-yuzey-2 text-center">
          {video ? (
            <>
              <video src={video.url} className="absolute inset-0 h-full w-full object-cover" muted />
              <button onClick={(e) => { e.preventDefault(); setVideo(null); }} aria-label="Kaldır"
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"><X className="h-4 w-4" /></button>
            </>
          ) : (
            <>
              <input type="file" accept="video/*" className="hidden" onChange={(e) => { videoYukle(e.target.files?.[0]); e.target.value = ""; }} />
              <ImagePlus className="h-6 w-6 text-metin-2" />
              <span className="text-[14px] font-semibold text-white">Düzenlenecek videoyu yükle</span>
              <span className="text-[12px] text-metin-3">En fazla 2 dakika</span>
            </>
          )}
        </label>

        {/* Preset galerisi */}
        <MobilSablonIzgarasi
          sablonlar={tumPresetler.map((p) => { const g = presetShortGorsel(p.tohum); return { id: p.ad, ad: p.ad, arka: g ? `url("${g}") center/cover no-repeat` : onizlemeArka(p.tohum, p.kategori), oran: "9/16" }; })}
          seciliId={seciliAd}
          onSec={(id) => setSeciliAd(id)}
        />
      </MobilComposerKabuk>
    </div>

    <div className="sinema-kapsam hidden h-[calc(100vh-3rem)] overflow-hidden bg-[var(--sn-zemin)] text-[var(--sn-metin)] sm:flex">
      <input ref={videoRef} type="file" accept="video/*" hidden onChange={(e) => { videoYukle(e.target.files?.[0]); e.target.value = ""; }} />

      {/* ═══════════ SOL PANEL ═══════════ */}
      <aside className="flex w-[340px] shrink-0 flex-col overflow-y-auto border-r border-[var(--sn-kenar)] bg-[var(--sn-yuzey)] p-4">
        <h1 className="hf-baslik mb-3.5 text-[16px]" style={{ color: LIME }}>SHORTS STÜDYOSU</h1>

        {/* 9:16 önizleme — seçili preset stili + Değiştir (preset değiştir/kaldır) */}
        <div className="hf-kart relative aspect-[9/16] w-full overflow-hidden">
          <span className="absolute inset-0" style={{ background: secArka }} />
          {secGercek && <img src={secGercek} alt={secili.ad} className="absolute inset-0 h-full w-full object-cover" />}
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          <span className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/10" />
          {/* Gömülü altyazı (preset stili) */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 p-4 text-center">
            <span className="hf-baslik text-[24px] leading-none text-white drop-shadow-lg">{secili.ad.toLocaleUpperCase("tr")}</span>
          </div>
          <button onClick={() => setSekme("presetler")} className="hf-btn glass-cip absolute right-2 top-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium text-white">
            <Pencil className="h-3 w-3" /> Değiştir
          </button>
        </div>

        {/* ASIL VİDEO YÜKLEME — VİDEONUN KENDİSİ gösterilir (kullanıcı isteği
            2026-07-31): eskiden yalnız "xxx.mp4" dosya adı yazıyordu. Artık
            16:9 kutuda döngüde sessiz oynar, hover'da × çıkar, tek tık
            oynat/duraklat yapar. */}
        {video ? (
          <div className="group relative mt-3 aspect-video w-full overflow-hidden rounded-xl">
            <video ref={onizlemeVideoRef} src={video.url}
              autoPlay loop muted playsInline preload="metadata"
              onClick={videoOynatDurdur}
              className="absolute inset-0 h-full w-full cursor-pointer object-cover" />
            {/* Duraklatılmışsa ortada oynat rozeti */}
            {videoDurdu && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="glass-ikon flex h-12 w-12 items-center justify-center rounded-full text-white">
                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                </span>
              </span>
            )}
            <button onClick={(e) => { e.stopPropagation(); setVideo(null); }} aria-label="Videoyu kaldır"
              className="glass-ikon absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-white opacity-0 transition-opacity group-hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
            <button onClick={() => videoRef.current?.click()}
              className="glass-cip absolute bottom-2 right-2 z-10 rounded-full px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              Değiştir
            </button>
            <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {video.sure} sn · {Math.ceil(video.sure / 5)} klip
            </span>
          </div>
        ) : (
          <button onClick={() => videoRef.current?.click()}
            className="hf-btn glass-cip mt-3 flex w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl px-4 py-5 text-center">
            <span className="glass-cip flex h-11 w-11 items-center justify-center rounded-full text-[var(--sn-metin-2)]">
              <VideoIcon className="h-5 w-5" />
            </span>
            <span className="text-[13px] font-medium text-[var(--sn-metin)]">Düzenlenecek videoyu yükle</span>
            <span className="text-[11px] text-[var(--sn-metin-3)]">Maks. süre: 2 dk</span>
          </button>
        )}

        {/* Algılanan dil (bayraklı dropdown) — SAĞA açılır. aside overflow'undan kaçmak için fixed konum. */}
        <div className="mt-4">
          <button ref={dilBtnRef} onClick={() => {
              if (!dilAcik && dilBtnRef.current) {
                const r = dilBtnRef.current.getBoundingClientRect();
                // Butonun SAĞINA, bir tık YUKARI (Higgsfield'de menü satırla değil,
                // satırın biraz üstüyle hizalı açılır).
                setDilKonum({ left: r.right + 8, top: Math.max(12, r.top - 12) });
              }
              setDilAcik((v) => !v);
            }} className="flex w-full items-center justify-between text-[13px]">
            <span className="text-[var(--sn-metin-2)]">Algılanan dil:</span>
            <span className="flex items-center gap-1 font-medium">{dil} <ChevronDown className={cn("h-3.5 w-3.5 text-[var(--sn-metin-3)] transition-transform", dilAcik && "rotate-180")} /></span>
          </button>
          <AnimatePresence>
            {dilAcik && dilKonum && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setDilAcik(false)} />
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                  style={{ position: "fixed", left: dilKonum.left, top: dilKonum.top }}
                  className="menu-surface z-[61] max-h-72 w-56 overflow-y-auto rounded-xl p-1.5">
                  {DILLER.map((d) => (
                    <button key={d.ad} onClick={() => { setDil(d.ad); setDilAcik(false); }}
                      className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors hover:bg-white/8", dil === d.ad ? "text-white" : "text-[var(--sn-metin-2)]")}>
                      <span className="text-[15px] leading-none">{d.bayrak}</span>
                      <span className="flex-1 text-left">{d.ad}</span>
                      {dil === d.ad && <Check className="h-3.5 w-3.5" style={{ color: LIME }} />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Çıktı oranı */}
        <div className="mt-4">
          <p className="mb-2 text-[13px] text-[var(--sn-metin-2)]">Çıktı oranı:</p>
          <div className="glass-cip flex items-center gap-1 rounded-xl p-1">
            {([["dikey", "Dikey", Smartphone], ["yatay", "Yatay", RectangleHorizontal]] as const).map(([id, ad, Ik]) => (
              <button key={id} onClick={() => setOran(id)}
                className={cn("flex flex-1 flex-col items-center gap-1 rounded-lg py-2.5 text-[12px] transition-colors", oran === id ? "glass-cip-aktif text-white" : "text-[var(--sn-metin-2)] hover:text-white")}>
                <Ik className="h-4 w-4" /> {ad}
              </button>
            ))}
          </div>
        </div>

        {/* ÜRET CTA — lime, kredi VİDEO SÜRESİNE göre */}
        <button onClick={uret} disabled={uretiliyor} className="hf-uret mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-[14px] font-bold">
          {uretiliyor ? <span className="opacity-70">Üretiliyor…</span> : <>Üret <Sparkles className="h-4 w-4" /> {kredi}</>}
        </button>
        <button onClick={() => toast("Her short süre ve çözünürlüğe göre kredi harcar; ortalama ✦33.")}
          className="mt-2.5 flex items-center justify-center gap-1 text-[12px] text-[var(--sn-metin-3)] underline underline-offset-2 transition-colors hover:text-[var(--sn-metin-2)]">
          Hesaplama nasıl çalışır? <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </aside>

      {/* ═══════════ ANA ALAN ═══════════ */}
      <section className={cn("min-w-0 flex-1 flex-col overflow-hidden", gomulu ? "hidden" : "flex")}>
        {/* Üst bar: sekmeler + (Geçmiş'te Liked toggle) + arama */}
        <div className="flex items-center justify-between gap-3 px-6 pt-5">
          <div className="glass-cip flex items-center gap-1 rounded-xl p-1">
            {SEKMELER.map((s) => (
              <button key={s.id} onClick={() => setSekme(s.id)}
                className={cn("flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] transition-colors", sekme === s.id ? "glass-cip-aktif text-white" : "text-[var(--sn-metin-2)] hover:text-white")}>
                <s.ik className="h-3.5 w-3.5" /> {s.ad}
              </button>
            ))}
          </div>
          {sekme === "gecmis" ? (
            <button onClick={() => setBegeniFiltre((v) => !v)} className="flex items-center gap-2 text-[13px] text-[var(--sn-metin-2)]">
              <Heart className={cn("h-4 w-4", begeniFiltre && "fill-current")} style={begeniFiltre ? { color: LIME } : undefined} /> Beğenilenler
              <span className={cn("relative h-5 w-9 rounded-full transition-colors", begeniFiltre ? "" : "bg-white/15")} style={begeniFiltre ? { background: LIME } : undefined}>
                <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", begeniFiltre ? "left-4" : "left-0.5")} />
              </span>
            </button>
          ) : (
            <div className="glass-cip flex items-center gap-2 rounded-full px-3 py-1.5">
              <Search className="h-4 w-4 text-[var(--sn-metin-3)]" />
              <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara" className="w-40 bg-transparent text-[13px] outline-none placeholder:text-[var(--sn-metin-3)]" />
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {/* ─── PRESETLER ─── */}
          {sekme === "presetler" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {/* Referanslardan preset oluştur kartı */}
              <button onClick={() => setPresetModal(true)}
                className="hf-kart glass-cip group flex aspect-[9/16] flex-col items-center justify-center gap-4 p-4 text-center">
                <span className="hf-baslik text-[16px] leading-tight text-[var(--sn-metin)]">REFERANSTAN<br />PRESET OLUŞTUR</span>
                <span className="hf-btn rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black shadow-md">Preset oluştur</span>
                <span className="grid grid-cols-2 gap-1 opacity-80">
                  {["pm-1", "pm-2"].map((t) => <span key={t} className="h-10 w-10 overflow-hidden rounded-lg shadow-sm" style={{ background: shortsKolajArka(t, "portre") }} />)}
                </span>
              </button>
              {filtre.map((p, i) => {
                const gercek = presetShortGorsel(p.tohum);
                const arka = gercek ? `url("${gercek}") center/cover no-repeat` : onizlemeArka(p.tohum, p.kategori);
                const url = gercek ?? saltUrl(arka);
                const aktif = p.ad === seciliAd;
                return (
                  <motion.button key={p.ad} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.015, 0.25) }}
                    onClick={() => { setSeciliAd(p.ad); toast.success(`${p.ad} uygulandı ✦`); }}
                    className={cn("hf-kart group relative aspect-[9/16] overflow-hidden text-left", aktif && "hf-kart-secili")}>
                    <span className="absolute inset-0" style={{ background: arka }} />
                    {url && <img src={url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />}
                    {/* ince üst-highlight (cam kenar hissi) */}
                    <span className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/10" />
                    {aktif && <span className="glass-cip absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-white"><Play className="h-3.5 w-3.5 fill-current" /></span>}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                      <span className="block text-[13px] font-semibold text-white">{p.ad}</span>
                    </div>
                  </motion.button>
                );
              })}
              {filtre.length === 0 && <p className="col-span-full py-16 text-center text-sm text-[var(--sn-metin-2)]">&ldquo;{ara}&rdquo; için preset bulunamadı.</p>}
            </div>
          )}

          {/* ─── GEÇMİŞ ─── */}
          {sekme === "gecmis" && (
            shortsUretimleri.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {shortsUretimleri.map((u) => (
                  <UretimKarti key={u.id} u={u} gorselOran={oranSayi(u)} kutuBoyut="buyuk" />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--sn-kenar-2)] py-20 text-center">
                <Sparkles className="mb-2 h-7 w-7 text-[var(--sn-metin-3)]" />
                <p className="text-sm text-[var(--sn-metin-2)]">{begeniFiltre ? "Henüz beğenilen short yok." : "Henüz shorts üretmedin."}</p>
                <button onClick={() => { setBegeniFiltre(false); setSekme("presetler"); }} className="mt-3 rounded-full bg-[var(--sn-cip)] px-4 py-2 text-[13px] transition-colors hover:bg-[var(--sn-cip-hover)]">Bir preset seç</button>
              </div>
            )
          )}

          {/* ─── NASIL ÇALIŞIR ─── */}
          {sekme === "nasil" && (
            <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--sn-kenar)] bg-[var(--sn-yuzey)] p-6">
              <h2 className="hf-baslik mb-4 text-[16px]" style={{ color: LIME }}>NASIL ÇALIŞIR</h2>
              <ol className="space-y-3.5 text-sm text-[var(--sn-metin-2)]">
                {[
                  "Düzenlenecek podcast/konuşma videonu yükle (maks. 2 dk).",
                  "Bir stil preseti seç — önizleme anında güncellenir.",
                  "Algılanan dili ve çıktı oranını (Dikey / Yatay) belirle.",
                  "Üret'e bas; altyazı ve stil otomatik gömülür, viral short hazır.",
                ].map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-black" style={{ background: LIME }}>{i + 1}</span>
                    <span className="pt-0.5">{t}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ ÜRETİM DETAY LIGHTBOX ═══════════ */}
      {/* AnimatePresence DIŞARIDA: bileşen içinde olduğunda `if (!uretim) return null`
          exit animasyonunu öldürüyordu (lightbox anında kayboluyordu). */}
      {/* m40: shorts detay paneli artık ORTAK UretimDetay (görsel/video ile birebir
          görünüm + gerçek araçlar/yorum/referans/yayın). */}
      <AnimatePresence>
        {lightbox && <UretimDetay key={lightbox.id} u={lightbox} onClose={() => setLightbox(null)} />}
      </AnimatePresence>

      {/* Seçim çubuğu — /panel/video ile aynı bileşen (kullanıcı isteği) */}
      <SecimToolbar />

      {/* ═══════════ KENDİ PRESET'İNİ OLUŞTUR MODALI ═══════════ */}
      <YeniPresetModal acik={presetModal} onKapat={() => setPresetModal(false)}
        onOlustur={(ad) => {
          const yeni: Preset = { ad: ad || "Özel Preset", ozel: true, kategori: "urun", tohum: "sp-ozel-" + ad };
          setOzelPresetler((v) => [yeni, ...v]); setSeciliAd(yeni.ad); setPresetModal(false);
          toast.success("Preset oluşturuldu ✦", { description: ad });
        }} />
    </div>
    </>
  );
}

/* NOT: Yerel `ShortsKart` KALDIRILDI (2026-07-31). Ortak `UretimKarti` ile
   değiştirildi — kullanıcı isteği: "üretime dair herşey panel/videodaki gibi
   olacak". Yerel kopyada kalıcı beğeni rozeti, gerçek klasör alt-menüsü,
   formatlı indirme, ad düzenleme ve seçim çubuğu yoktu. */


/* ── Üretim detay lightbox (higg-shorts 11/12 birebir) ── */
function ShortsLightbox({ uretim: ilkUretim, onKapat }: { uretim: Uretim; onKapat: () => void }) {
  const [parca, setParca] = useState(1);
  /* Higgsfield'de AYRINTILAR akordiyonu KAPALI açılır (referans 17.18). */
  const [detay, setDetay] = useState(false);
  const favToggle = useProjeler((s) => s.favoriToggle);
  const kullanici = useAuth((s) => s.kullanici);
  /* Prop bir ANLIK GÖRÜNTÜ: kalbe basınca store değişir ama prop eski nesneyi
     tutar, kalp dolmazdı. Bu yüzden canlı kaydı store'dan okuyoruz. */
  const canli = useProjeler((s) => s.uretimler.find((x) => x.id === ilkUretim.id));
  const uretim = canli ?? ilkUretim;
  /* Esc ile kapatma + arka plan scroll kilidi — ikisi de eskiden yoktu. */
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  const arka = uretim.gorselUrl ?? onizlemeArka(uretim.id, "portre");
  const presetAd = uretim.baslik.split(" · ")[0] || "Kil Animasyon";
  /* Yeniden üret — GERÇEK üretim başlatır (kredi düşer, kuyruğa girer, kitaplığa yazar). */
  const yenidenUret = () => {
    const sonuc = uretimBaslatHam({
      baslik: uretim.baslik,
      tur: uretim.tur,
      model: uretim.model,
      prompt: uretim.prompt || uretim.baslik,
      kredi: uretim.kredi || 10,
      arac: uretim.arac ?? "Shorts Stüdyosu",
    });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    toast.success("Yeniden üretiliyor ✦", { description: `${uretim.baslik} · ${uretim.kredi || 10} kredi` });
    onKapat();
  };
  /* Higgsfield sağ panelinde BİLGİ yalnızca Model + Preset gösterir; Preset satırının
     sağında preset küçük görseli durur. Kalite/Boyut/Oluşturuldu AYRINTILAR
     akordiyonunun içindedir. Değerler artık uretim.meta'dan GERÇEK okunur —
     eskiden hepsi sabit string'di. */
  const cozunurluk = uretim.meta?.cozunurluk ?? "720p";
  const oranMeta = uretim.meta?.oran ?? "9:16";
  const boyut = oranMeta === "9:16" ? `${cozunurluk === "1080p" ? 1080 : 720}×${cozunurluk === "1080p" ? 1920 : 1280}`
    : oranMeta === "1:1" ? (cozunurluk === "1080p" ? "1080×1080" : "720×720")
    : `${cozunurluk === "1080p" ? 1920 : 1280}×${cozunurluk === "1080p" ? 1080 : 720}`;
  const olusturuldu = uretim.olusturma
    ? new Date(uretim.olusturma).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const ayrinti: [string, string][] = [
    ["Kalite", cozunurluk],
    ["Boyut", boyut],
    ["Süre", uretim.meta?.sure ?? "—"],
    ["Oluşturuldu", olusturuldu],
  ];
  const paylasBaglanti = () => (typeof window !== "undefined" ? `${window.location.origin}/kesfet?u=${uretim.id}` : "");
  /* Bölüm zaman aralığı GERÇEK süreden hesaplanır. Eskiden `00:0{parca*2}` gibi
     elle kurulmuş bir şablondu — 5. bölümden sonra "00:010" diye bozuluyordu. */
  const toplamSn = Number(String(uretim.meta?.sure ?? "").replace(/[^\d]/g, "")) || 10;
  const parcaSn = Math.max(1, Math.round(toplamSn / PARCALAR.length));
  return (
    <>
      {(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex bg-black/88 backdrop-blur-sm" onClick={onKapat}>
          {/* Sol: parça şeridi (higg-shorts birebir) — aktif 9:16 video ORTADA, komşu
              parçalar solda/sağda küçük ve sönük durur. Regenerate pill'i videonun ALT
              KENARINA BİNER (yarısı dışarı taşar). Altta ‹ Bölüm x/2 · zaman › navigasyonu. */}
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-7 p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center gap-6">
              {PARCALAR.map((p) => {
                const aktif = p === parca;
                return (
                  <div key={p}
                    className={cn("relative aspect-[9/16] shrink-0 overflow-visible transition-all duration-300",
                      aktif ? "h-[70vh] max-h-[760px]" : "h-[46vh] max-h-[430px] opacity-45")}>
                    <div className="relative h-full w-full overflow-hidden rounded-2xl">
                      {aktif ? (
                        <>
                          <span className="absolute inset-0" style={{ background: arka }} />
                          {saltUrl(arka) && <img src={saltUrl(arka)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                        </>
                      ) : (
                        // Komşu parça — henüz üretilmemiş/moderasyona takılmış kutu.
                        // Higgsfield'de "NSFW · Credits refunded" rozetleriyle boş durur.
                        <>
                          <span className="absolute inset-0 bg-[var(--sn-yuzey-2)]" />
                          <div className="absolute left-2 top-2 flex items-center gap-1.5">
                            <span className="glass-cip flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] text-white/85"><Eye className="h-2.5 w-2.5" /> NSFW</span>
                            <span className="glass-cip flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] text-white/85"><Info className="h-2.5 w-2.5" /> Kredi iade edildi</span>
                          </div>
                        </>
                      )}
                    </div>
                    {/* Yeniden üret — kartın ALT KENARINA BİNER (yarısı dışarı) */}
                    {aktif && (
                      <button onClick={yenidenUret}
                        className="hf-btn glass-cip absolute -bottom-5 right-4 z-10 flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-medium text-white">
                        <RefreshCw className="h-4 w-4" /> Yeniden üret
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Parça navigasyonu — büyük glass daire butonlar */}
            <div className="flex items-center gap-5 text-[13px] text-white/70">
              <button onClick={() => setParca((p) => Math.max(1, p - 1))} disabled={parca === 1}
                className="hf-btn glass-cip flex h-11 w-11 items-center justify-center rounded-full text-white disabled:opacity-35"><ChevronLeft className="h-5 w-5" /></button>
              <span className="tabular-nums">
                <span className="font-semibold text-white">Bölüm {parca} / {PARCALAR.length}</span>
                {" · "}{mmss((parca - 1) * parcaSn)} - {mmss(parca * parcaSn)}
              </span>
              <button onClick={() => setParca((p) => Math.min(PARCALAR.length, p + 1))} disabled={parca === PARCALAR.length}
                className="hf-btn glass-cip flex h-11 w-11 items-center justify-center rounded-full text-white disabled:opacity-35"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>
          {/* ═══ SAĞ PANEL — Higgsfield birebir (referans 17.18) ═══
              Yapı: yazar başlığı · VİDEO (thumbnail SOLA yaslı, kutu içinde) ·
              BİLGİ (yalnız Model + Preset; preset satırında küçük görsel) ·
              AYRINTILAR (açılır — Kalite/Boyut/Süre/Oluşturuldu içeride) ·
              alt: lime "Tam videoyu indir" + İndir/Yeniden + kalp/paylaş/⋯ ÜÇLÜ. */}
          <aside className="flex w-full max-w-[360px] shrink-0 flex-col border-l border-white/10 bg-[var(--sn-yuzey)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 border-b border-white/8 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-[13px] font-bold text-white">
                {(kullanici?.ad ?? "V").charAt(0).toLocaleUpperCase("tr")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{kullanici?.ad ?? "Vayra Kullanıcısı"}</span>
                <span className="block text-[11px] text-[var(--sn-metin-3)]">Yazar</span>
              </span>
              <button onClick={onKapat} aria-label="Kapat" className="hf-btn flex h-8 w-8 items-center justify-center rounded-full text-[var(--sn-metin-2)] hover:bg-white/8 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {/* ── VİDEO — thumbnail SOLA yaslı (Higgsfield'de ortalanmaz) ── */}
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--sn-metin-3)]"><VideoIcon className="h-3.5 w-3.5" /> Video</p>
              <div className="glass-cip mb-5 flex items-center rounded-xl p-3">
                <button onClick={() => setParca(1)} aria-label="Videoyu oynat"
                  className="hf-btn group/th relative h-[104px] w-[59px] shrink-0 overflow-hidden rounded-lg" style={{ background: arka }}>
                  {saltUrl(arka) && <img src={saltUrl(arka)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="glass-ikon flex h-7 w-7 items-center justify-center rounded-full transition-transform group-hover/th:scale-110">
                      <Play className="ml-[1px] h-3.5 w-3.5 fill-white text-white" />
                    </span>
                  </span>
                </button>
              </div>

              {/* ── BİLGİ — Higgsfield'de SADECE Model + Preset ── */}
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--sn-metin-3)]"><Info className="h-3.5 w-3.5" /> Bilgi</p>
              <div className="glass-cip overflow-hidden rounded-xl">
                <div className="flex items-center justify-between px-3.5 py-3 text-[13px]">
                  <span className="text-[var(--sn-metin-3)]">Model</span>
                  <span className="font-medium text-[var(--sn-metin)]">{uretim.model || "Shorts Stüdyosu"}</span>
                </div>
                <div className="h-px bg-white/6" />
                {/* Preset satırı — sağında preset küçük görseli (Higgsfield birebir) */}
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-[13px]">
                  <span className="shrink-0 text-[var(--sn-metin-3)]">Preset</span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium text-[var(--sn-metin)]">{presetAd}</span>
                    <span className="h-7 w-7 shrink-0 overflow-hidden rounded-md"
                      style={{ background: (() => { const g = presetGorselAdIle(presetAd); return g ? `url("${g}") center/cover no-repeat` : onizlemeArka(`sp-${presetAd}`, "portre"); })() }} />
                  </span>
                </div>
              </div>

              {/* ── AYRINTILAR — artık GERÇEK açılır içerik taşır ── */}
              <button onClick={() => setDetay((v) => !v)} aria-expanded={detay}
                className="glass-cip mt-2 flex w-full items-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--sn-metin-2)]">
                <Info className="h-3.5 w-3.5" /> Ayrıntılar <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", detay && "rotate-180")} />
              </button>
              <motion.div initial={false} animate={{ height: detay ? "auto" : 0, opacity: detay ? 1 : 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                <div className="mt-2 space-y-0.5 px-1 pb-1">
                  {ayrinti.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-1.5 text-[13px]">
                      <span className="text-[var(--sn-metin-3)]">{k}</span>
                      <span className="font-medium tabular-nums text-[var(--sn-metin)]">{v}</span>
                    </div>
                  ))}
                  {uretim.prompt && (
                    <div className="pt-1.5">
                      <span className="mb-1 block text-[11px] text-[var(--sn-metin-3)]">İstem</span>
                      <p className="text-[12px] leading-relaxed text-[var(--sn-metin-2)]">{uretim.prompt}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
            <div className="space-y-2 border-t border-white/8 p-4">
              <button onClick={() => gorseliIndir(uretim.id, uretim.baslik || "vayra-shorts", uretim.gorselUrl)} className="hf-uret flex w-full items-center justify-center gap-2 py-3 text-[14px] font-bold"><Download className="h-4 w-4" /> Tam videoyu indir</button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => gorseliIndir(uretim.id, `${uretim.baslik || "vayra"}-bolum-${parca}`, uretim.gorselUrl)} className="flex items-center justify-center gap-1.5 glass-cip hf-btn rounded-xl py-2.5 text-[13px] text-[var(--sn-metin)]"><Download className="h-4 w-4" /> İndir</button>
                <button onClick={yenidenUret} className="flex items-center justify-center gap-1.5 glass-cip hf-btn rounded-xl py-2.5 text-[13px] text-[var(--sn-metin)]"><RefreshCw className="h-4 w-4" /> Yeniden</button>
              </div>
              {/* Higgsfield'de alt sıra ÜÇLÜ: kalp · paylaş · ⋯ */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => { favToggle(uretim.id); toast(uretim.favori ? "Beğeni kaldırıldı" : "Beğenildi ♥"); }}
                  aria-label="Beğen" aria-pressed={!!uretim.favori}
                  className={cn("flex items-center justify-center glass-cip hf-btn rounded-xl py-2.5", uretim.favori ? "text-rose-400" : "text-[var(--sn-metin)]")}>
                  <Heart className={cn("h-4 w-4", uretim.favori && "fill-current")} />
                </button>
                <button onClick={() => { navigator.clipboard?.writeText(paylasBaglanti()); toast.success("Bağlantı kopyalandı"); }}
                  aria-label="Paylaş" className="flex items-center justify-center glass-cip hf-btn rounded-xl py-2.5 text-[var(--sn-metin)]"><Share2 className="h-4 w-4" /></button>
                <button onClick={() => { navigator.clipboard?.writeText(uretim.prompt || ""); toast.success("İstem kopyalandı"); }}
                  aria-label="İstemi kopyala" className="flex items-center justify-center glass-cip hf-btn rounded-xl py-2.5 text-[var(--sn-metin)]"><Copy className="h-4 w-4" /></button>
              </div>
            </div>
          </aside>
        </motion.div>
      )}
    </>
  );
}

/* ── "Kendi preset'ini oluştur" modalı (higg-shorts 13 birebir) ── */
function YeniPresetModal({ acik, onKapat, onOlustur }: { acik: boolean; onKapat: () => void; onOlustur: (ad: string) => void }) {
  const [ad, setAd] = useState("");
  const [referanslar, setReferanslar] = useState<string[]>([]);
  const inpRef = useRef<HTMLInputElement>(null);
  /* "Değiştir" tıklanan hücrenin indeksi — dosya seçilince yeni eklemek
     yerine O hücrenin içeriğini değiştiririz. null = sona ekle. */
  const degistirIx = useRef<number | null>(null);
  return (
    <AnimatePresence>
      {acik && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onClick={onKapat}>
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }} onClick={(e) => e.stopPropagation()}
            /* Boyut bir tık büyütüldü (kullanıcı isteği 2026-07-31): 760 → 940px,
               yükseklik de sınırlandı ki çok referansta modal taşmasın. */
            className="flex max-h-[90vh] w-full max-w-[940px] overflow-hidden rounded-[20px] border border-white/[0.08] shadow-2xl" style={{ background: "rgba(20,20,22,0.97)" }}>
            {/* Sol tanıtım */}
            <div className="hidden w-[300px] shrink-0 flex-col justify-between border-r border-white/8 bg-[var(--sn-yuzey)] p-6 sm:flex">
              <div>
                <h2 className="hf-baslik text-[22px] leading-tight" style={{ color: LIME }}>KENDİ<br />PRESET&apos;İNİ<br />OLUŞTUR</h2>
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--sn-metin-2)]">İstediğin görünümü gösteren referans görsel/videolar ekle. Preset stili onlardan öğrenir.</p>
              </div>
              <input ref={inpRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => {
                const dosyalar = Array.from(e.target.files ?? []);
                e.target.value = "";
                if (!dosyalar.length) return;
                const ix = degistirIx.current;
                if (ix !== null) {
                  // Tek dosya ile O hücreyi değiştir
                  const r = new FileReader();
                  r.onload = () => setReferanslar((v) => v.map((x, j) => (j === ix ? String(r.result) : x)));
                  r.readAsDataURL(dosyalar[0]);
                  degistirIx.current = null;
                  return;
                }
                dosyalar.slice(0, 10).forEach((d) => {
                  const r = new FileReader();
                  r.onload = () => setReferanslar((v) => [...v, String(r.result)].slice(0, 10));
                  r.readAsDataURL(d);
                });
              }} />
              <div className="relative flex h-44 items-center justify-center rounded-xl bg-white" style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
                {["yp-1", "yp-2", "yp-3"].map((t, i) => (
                  <span key={t} className="absolute h-12 w-12 overflow-hidden rounded-lg shadow-lg" style={{ background: shortsKolajArka(t, i === 1 ? "urun" : "portre"), transform: `translate(${(i - 1) * 60}px, ${(i % 2 ? 1 : -1) * 30}px) rotate(${(i - 1) * 8}deg)` }} />
                ))}
                <button onClick={() => { degistirIx.current = null; inpRef.current?.click(); }} className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sn-zemin)] text-white"><UploadCloud className="h-4 w-4" /></button>
              </div>
            </div>
            {/* Sağ form */}
            <div className="flex min-w-0 flex-1 flex-col p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-[16px] font-semibold">Yeni preset</h3>
                <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--sn-metin-2)] hover:bg-white/8 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <label className="text-[13px] text-[var(--sn-metin-2)]">Ad</label>
              <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Sıcak yavaş bakış" autoFocus
                className="mt-1.5 w-full rounded-xl border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[var(--sn-kenar-2)] placeholder:text-[var(--sn-metin-3)]" />
              <label className="mt-4 flex items-center justify-between text-[13px] text-[var(--sn-metin-2)]">
                Referansları yükle
                {referanslar.length > 0 && (
                  <span className="text-[12px] tabular-nums text-[var(--sn-metin-3)]">{referanslar.length}/10</span>
                )}
              </label>
              {/* REFERANS IZGARASI (kullanıcı isteği 2026-07-31: "görsel ekleyince
                  inanılmaz saçma şekilde gözüküyor hizasız darmadağınık").
                  Eskiden sabit 56px kareler bir <button> içinde ortalanıyordu →
                  hizasız görünüyordu ve video eklenince <img> boş kalıyordu.
                  Artık: eşit kare hücreli ızgara, video otomatik algılanıp
                  döngüde oynar, her hücrede hover'da SİL ve DEĞİŞTİR çıkar. */}
              {referanslar.length > 0 ? (
                <div className="mt-1.5 grid grid-cols-5 gap-2 rounded-xl border border-[var(--sn-kenar-2)] bg-[var(--sn-yuzey-2)]/60 p-2.5">
                  {referanslar.map((r, i) => (
                    <div key={i} className="group/ref relative aspect-square overflow-hidden rounded-lg bg-black/30">
                      {videoMu(r) ? (
                        <video src={r} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r} alt="" className="h-full w-full object-cover" />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 transition-opacity group-hover/ref:opacity-100">
                        <button onClick={() => { degistirIx.current = i; inpRef.current?.click(); }} title="Değiştir"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setReferanslar((v) => v.filter((_, j) => j !== i))} title="Sil"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white hover:bg-rose-500/70">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                      {videoMu(r) && (
                        <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white">video</span>
                      )}
                    </div>
                  ))}
                  {referanslar.length < 10 && (
                    <button onClick={() => { degistirIx.current = null; inpRef.current?.click(); }}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--sn-kenar-2)] text-[var(--sn-metin-3)] transition-colors hover:border-white/25 hover:text-white">
                      <UploadCloud className="h-4 w-4" />
                      <span className="text-[10px]">Ekle</span>
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={() => { degistirIx.current = null; inpRef.current?.click(); }}
                  className="mt-1.5 flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--sn-kenar-2)] bg-[var(--sn-yuzey-2)]/60 p-4 text-center transition-colors hover:border-white/25">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--sn-cip)] text-[var(--sn-metin-2)]"><UploadCloud className="h-5 w-5" /></span>
                  <span className="text-[13px] text-[var(--sn-metin-3)]">En iyi sonuç için 10 adede kadar benzer short görsel/video ekle</span>
                  <span className="text-[11px] text-[var(--sn-metin-3)]/70">Görsel veya video · sürükle-bırak da olur</span>
                </button>
              )}
              <button onClick={() => onOlustur(ad.trim())} disabled={!ad.trim()}
                className={cn("mt-5 w-full rounded-xl py-3 text-[14px] font-semibold transition-colors", ad.trim() ? "hf-uret" : "cursor-not-allowed bg-[var(--sn-cip)] text-[var(--sn-metin-3)]")}>Preset oluştur</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
