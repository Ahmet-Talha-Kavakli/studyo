"use client";

import type { StudyoGomuluProps } from "@/components/studyo/tipler";
import { seciciKonumHesapla, seciciStil } from "@/lib/seciciKonum";

/**
 * Video Stüdyosu — Higgsfield /ai/video BİREBİR Türkçe klonu (HIGGSFIELD-SPEC.md §2.2).
 *
 * Üç sütun: SOL üretim paneli (~290px) + ORTA/SAĞ imza masonry preset duvarı.
 * Üst nav layout'ta (Kabuk A). Bu sayfa yalnızca içeriği basar.
 *
 * Her buton/dropdown çalışır, sonner toast verir; preset seçimi gerçekten
 * sol paneldeki preset kartını günceller. Aksan = cyan (token). Hardcoded hex yok.
 */

import { useState, useRef, useMemo, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import {
  Film, Scissors, Move3d, Upload, Plus, ChevronRight, ChevronDown,
  Info, Sparkles, Play, Pause, Check, Pencil, VolumeX, AtSign, Folder,
  HelpCircle, LayoutGrid, List, Clock, Gem, Search, X, SquareStack,
  Image as ImageIcon, RectangleHorizontal, AudioLines, Zap,
  RotateCcw, Copy, Trash2, ImagePlus, Layers,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";
import { aracArka } from "@/lib/gercekVeri";
import { uretimBaslat as uretimBaslatHam, uretimHataToast } from "@/lib/uretimMotoru";
import { useAktifProje } from "@/lib/useAktifProje";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { useProjeler } from "@/store/useProjeler";
import { useReferansKopru } from "@/store/useReferansKopru";
import { useAyarKopru } from "@/store/useAyarKopru";
import { useElements } from "@/store/useElements";
import { UretimKarti } from "@/components/panel/UretimKarti";
import { UretimDetay } from "@/components/panel/UretimDetay";
import { YuklenenOnizleme } from "@/components/panel/YuklenenOnizleme";
import { SureKaydirici } from "@/components/ui/SureKaydirici";
import { Tooltip } from "@/components/ui/Tooltip";
import { SecimToolbar } from "@/components/panel/SecimToolbar";
import { ElementMentionInput } from "@/components/panel/ElementMentionInput";
import { ElementSeciciModal } from "@/components/panel/element/ElementSeciciModal";
import { useSecim } from "@/store/useSecim";
import {
  MobilComposerKabuk, MobilIstemKutusu, MobilAltCipler, MobilAltCip, MobilAnahtar, MobilUretButonu,
  MobilSecici, type SeciciOge,
} from "@/components/panel/MobilComposer";

/* ------------------------------------------------------------------ */
/* Veri                                                                */
/* ------------------------------------------------------------------ */

const SEKMELER = [
  { id: "olustur", ad: "Video Üret", ikon: Film },
  { id: "duzenle", ad: "Video Düzenle", ikon: Scissors },
  { id: "hareket", ad: "Hareket Kontrolü", ikon: Move3d },
] as const;
type SekmeId = (typeof SEKMELER)[number]["id"];

// Higgsfield birebir: her modelde çözünürlük + süre aralığı + ses meta-chip'leri.
// ── Video model varyantı (Higgsfield birebir: çözünürlük + süre aralığı + ses rozeti) ──
type VideoRozet = "Yeni" | "Hızlı" | "Özel" | "Vayra";
// Higgsfield birebir görsel-kutu tipleri (higg-video-model analizi):
//  tek       → "Görsel yükle veya üret" tek kutu
//  kareler   → Başlangıç karesi + Son kare (ikili)
//  medya     → "Medya yükle" (görsel/video[/ses])
//  edit      → düzenlenecek video kutusu (Edit modu)
//  hareket   → Motion Control: kopyalanacak hareket videosu + karakter görseli
type VideoKutu = "tek" | "kareler" | "medya" | "edit" | "hareket";
type VideoModel = {
  ad: string;
  coz: string;          // varsayılan çözünürlük (720p/1080p/4K/512p)
  sureAralik: string;   // "3-15sn"
  ses?: boolean;        // ses üretimi (🔊)
  rozet?: VideoRozet;
  kredi: number;
  // ── Higgsfield birebir composer davranışı ──
  kutu?: VideoKutu;         // görsel-kutu tipi (varsayılan "tek")
  varsayilanSure?: number;  // model açılınca seçilen süre (sn)
  varsayilanOran?: string;  // "16:9" / "9:16" / "Auto" / "1:1"
  oranGizli?: boolean;      // oran çipini gizle (Minimax, Higgsfield DoP…)
  cozGizli?: boolean;       // çözünürlük çipini gizle (Sora 2, Wan 2.2…)
  enhance?: boolean;        // "İyileştir" çipi göster
  cokCekim?: boolean;       // "Çok çekimli" toggle göster (Kling 3.0, Seedance Pro, Veo Fast)
  sesToggle?: boolean;      // ayrı "Ses" toggle satırı (Kling 2.6, Seedance 1.5 Pro)
  bitrate?: boolean;        // Bitrate seçici (Seedance 2.0)
  medyaTipi?: string;       // medya kutusu alt-metni ("Görsel", "Görsel & Video", "Görsel, Video veya Ses")
  medyaSayisi?: number;     // "en fazla N" (Veo Ingredients=3, Kling Edit=4)
  not?: string;            // model altı bilgi notu ("İnsan yüzü desteklenmez" gibi)
};
// ── Model ailesi: Featured'da düz varyant, "tum"da hover→flyout varyant listesi (Higgsfield birebir) ──
type ModelAile = {
  ad: string;
  ozet: string;         // "tum" grubunda gösterilen açıklama
  grup: "one" | "tum";
  varyantlar: VideoModel[];
};
const MODEL_AILELERI: ModelAile[] = [
  // ═══ Öne çıkan modeller (Featured) — her aile tek varyant, düz liste ═══
  { ad: "Seedance", ozet: "Sinematik, çok-çekimli video üretimi", grup: "one", varyantlar: [
    { ad: "Seedance 2.0", coz: "4K", sureAralik: "4-15sn", kredi: 42 },
  ]},
  { ad: "Seedance 2.0 Mini", ozet: "Hafif, hızlı çekim", grup: "one", varyantlar: [
    { ad: "Seedance 2.0 Mini", coz: "720p", sureAralik: "4-15sn", rozet: "Yeni", kredi: 20 },
  ]},
  { ad: "Seedance 2.0 Fast", ozet: "Hızlı Seedance", grup: "one", varyantlar: [
    { ad: "Seedance 2.0 Fast", coz: "720p", sureAralik: "4-15sn", kredi: 24 },
  ]},
  { ad: "Gemini Omni Flash", ozet: "Google — hızlı, akıllı üretim", grup: "one", varyantlar: [
    { ad: "Gemini Omni Flash", coz: "720p", sureAralik: "4-10sn", rozet: "Yeni", kredi: 24 },
  ]},
  { ad: "Google Veo 3.1 Lite", ozet: "Google — sesli, hafif", grup: "one", varyantlar: [
    { ad: "Google Veo 3.1 Lite", coz: "1080p", sureAralik: "4-8sn", ses: true, rozet: "Yeni", kredi: 40 },
  ]},
  { ad: "Wan 2.7", ozet: "Kamera kontrollü, sesli, daha özgür", grup: "one", varyantlar: [
    { ad: "Wan 2.7", coz: "1080p", sureAralik: "2-15sn", rozet: "Yeni", kredi: 30 },
  ]},
  { ad: "HappyHorse", ozet: "Yüksek dinamik, VFX hazır", grup: "one", varyantlar: [
    { ad: "HappyHorse", coz: "1080p", sureAralik: "3-15sn", ses: true, rozet: "Yeni", kredi: 30 },
  ]},
  // ═══ Tüm modeller (aile → varyant flyout) ═══
  { ad: "Minimax Hailuo", ozet: "Yüksek dinamik, VFX hazır, en hızlı ve ekonomik", grup: "tum", varyantlar: [
    { ad: "Minimax Hailuo 2.3 Fast", coz: "1080p", sureAralik: "6-10sn", kredi: 18 },
    { ad: "Minimax Hailuo 2.3", coz: "1080p", sureAralik: "6-10sn", kredi: 20 },
    { ad: "Minimax Hailuo 02 Fast", coz: "512p", sureAralik: "6-10sn", kredi: 14 },
    { ad: "Minimax Hailuo 02", coz: "1080p", sureAralik: "6-10sn", kredi: 18 },
  ]},
  { ad: "Kling", ozet: "Gelişmiş video kontrolüyle kusursuz hareket", grup: "tum", varyantlar: [
    { ad: "Kling 3.0", coz: "4K", sureAralik: "3-15sn", ses: true, kredi: 48 },
    { ad: "Kling 3.0 Turbo", coz: "1080p", sureAralik: "3-15sn", ses: true, rozet: "Yeni", kredi: 32 },
    { ad: "Kling 3.0 Omni", coz: "4K", sureAralik: "3-15sn", rozet: "Özel", kredi: 54 },
    { ad: "Kling 3.0 Omni Edit", coz: "1080p", sureAralik: "3-10sn", rozet: "Özel", kredi: 48 },
    { ad: "Kling 2.6", coz: "1080p", sureAralik: "5-10sn", ses: true, kredi: 40 },
    { ad: "Kling O1 Video", coz: "1080p", sureAralik: "5-10sn", kredi: 40 },
    { ad: "Kling O1 Video Edit", coz: "1080p", sureAralik: "3-10sn", kredi: 44 },
    { ad: "Kling Motion Control", coz: "1080p", sureAralik: "3-30sn", kredi: 46 },
  ]},
  { ad: "OpenAI Sora 2", ozet: "Sesli çok-çekimli video üretimi", grup: "tum", varyantlar: [
    { ad: "Sora 2", coz: "720p", sureAralik: "4-12sn", ses: true, kredi: 60 },
    { ad: "Sora 2 Pro", coz: "1080p", sureAralik: "4-12sn", ses: true, kredi: 72 },
    { ad: "Sora 2 Max", coz: "1080p", sureAralik: "4-12sn", rozet: "Vayra", kredi: 80 },
    { ad: "Sora 2 Pro Max", coz: "1080p", sureAralik: "4-12sn", rozet: "Vayra", kredi: 90 },
  ]},
  { ad: "Google Veo", ozet: "Ses kontrolüyle hassas video", grup: "tum", varyantlar: [
    { ad: "Google Veo 3.1 Lite", coz: "1080p", sureAralik: "4-8sn", ses: true, rozet: "Yeni", kredi: 40 },
    { ad: "Google Veo 3.1 Fast", coz: "1080p", sureAralik: "4-8sn", ses: true, kredi: 44 },
    { ad: "Google Veo 3.1", coz: "1080p", sureAralik: "4-8sn", ses: true, kredi: 55 },
    { ad: "Google Veo 3 Fast", coz: "1080p", sureAralik: "8sn", ses: true, kredi: 50 },
    { ad: "Google Veo 3", coz: "1080p", sureAralik: "8sn", ses: true, kredi: 55 },
  ]},
  { ad: "Vayra", ozet: "Gelişmiş kamera kontrolleri ve efekt presetleri", grup: "tum", varyantlar: [
    { ad: "Vayra Lite", coz: "720p", sureAralik: "3-5sn", kredi: 7 },
    { ad: "Vayra Standard", coz: "720p", sureAralik: "3-5sn", kredi: 12 },
    { ad: "Vayra Turbo", coz: "720p", sureAralik: "3-5sn", kredi: 10 },
  ]},
  { ad: "Wan", ozet: "Kamera kontrollü, sesli, daha özgür video", grup: "tum", varyantlar: [
    { ad: "Wan 2.7", coz: "1080p", sureAralik: "2-15sn", rozet: "Yeni", kredi: 30 },
    { ad: "Wan 2.6", coz: "1080p", sureAralik: "5-15sn", rozet: "Yeni", kredi: 28 },
    { ad: "Wan 2.5", coz: "1080p", sureAralik: "5-10sn", ses: true, kredi: 26 },
    { ad: "Wan 2.5 Fast", coz: "1080p", sureAralik: "5-10sn", ses: true, kredi: 22 },
    { ad: "Wan 2.2", coz: "720p", sureAralik: "5sn", kredi: 18 },
    { ad: "Wan 2.2 Fast", coz: "720p", sureAralik: "5sn", kredi: 16 },
  ]},
  { ad: "Seedance ", ozet: "Sinematik, çok-çekimli video üretimi", grup: "tum", varyantlar: [
    { ad: "Seedance 2.0 Fast", coz: "720p", sureAralik: "4-15sn", kredi: 24 },
    { ad: "Seedance 2.0 Mini", coz: "720p", sureAralik: "4-15sn", rozet: "Özel", kredi: 20 },
    { ad: "Seedance 2.0", coz: "4K", sureAralik: "4-15sn", kredi: 42 },
    { ad: "Seedance 1.5 Pro", coz: "720p", sureAralik: "4-12sn", kredi: 30 },
    { ad: "Seedance Pro", coz: "1080p", sureAralik: "5-10sn", kredi: 34 },
    { ad: "Seedance Pro Fast", coz: "1080p", sureAralik: "5-10sn", kredi: 28 },
  ]},
  { ad: "Grok Imagine", ozet: "Gelişmiş video kontrolüyle kusursuz hareket", grup: "tum", varyantlar: [
    { ad: "Grok Imagine", coz: "720p", sureAralik: "1-15sn", kredi: 20 },
    { ad: "Grok Imagine 1.5", coz: "720p", sureAralik: "1-15sn", rozet: "Yeni", kredi: 22 },
    { ad: "Grok Imagine Edit", coz: "720p", sureAralik: "1-15sn", kredi: 24 },
  ]},
];
// Tüm varyantları düz listeye indir (arama + kredi/coz aramak için).
const TUM_VARYANTLAR: VideoModel[] = MODEL_AILELERI.flatMap((a) => a.varyantlar);

/* Model marka rozeti — Higgsfield'da her sağlayıcının kendi renkli ikonu var.
   Gerçek logo yerine markaya özel renk + kısa harf tile (tanınır, tutarlı). */
function modelMarka(ad: string): { kisa: string; renk: string; metin: string } {
  const a = ad.toLowerCase();
  if (a.includes("kling")) return { kisa: "KL", renk: "#6d28d9", metin: "#ede9fe" };       // mor
  if (a.includes("seedance") || a.includes("seed")) return { kisa: "SD", renk: "#0891b2", metin: "#cffafe" }; // camgöbeği
  if (a.includes("veo") || a.includes("gemini") || a.includes("google")) return { kisa: "G", renk: "#1a73e8", metin: "#e8f0fe" }; // google mavi
  if (a.includes("sora") || a.includes("openai")) return { kisa: "AI", renk: "#111827", metin: "#f3f4f6" }; // siyah
  if (a.includes("grok")) return { kisa: "xA", renk: "#0f172a", metin: "#e2e8f0" };         // koyu
  if (a.includes("wan")) return { kisa: "WN", renk: "#be185d", metin: "#fce7f3" };          // magenta
  if (a.includes("hailuo") || a.includes("minimax")) return { kisa: "MM", renk: "#c2410c", metin: "#ffedd5" }; // turuncu
  if (a.includes("happyhorse") || a.includes("horse")) return { kisa: "HH", renk: "#15803d", metin: "#dcfce7" }; // yeşil
  if (a.includes("vayra") || a.includes("dop")) return { kisa: "V", renk: "#0e7490", metin: "#cffafe" };
  return { kisa: ad.slice(0, 2).toUpperCase(), renk: "#3a3c3f", metin: "#e5e5e5" };
}
/* Model adından GERÇEK logo yolu (kullanıcı kararı). Ada göre eşleşen marka
   varsa logosu basılır; yoksa aşağıdaki renkli harf karesine düşülür
   (Vayra'nın kendi modelleri ve logosu olmayan sağlayıcılar). */
function modelLogo(ad: string): string | undefined {
  const a = ad.toLowerCase();
  if (a.includes("kling")) return "/marka/kuaishou.svg";
  if (a.includes("seedance") || a.includes("seed")) return "/marka/bytedance.svg";
  if (a.includes("veo") || a.includes("gemini") || a.includes("google")) return "/marka/googlegemini.svg";
  if (a.includes("sora") || a.includes("openai")) return "/marka/openai_alt.svg";
  if (a.includes("grok")) return "/marka/xai.svg";
  if (a.includes("wan")) return "/marka/alibaba.svg";
  if (a.includes("hailuo") || a.includes("minimax")) return "/marka/minimax.svg";
  return undefined;
}

/** Marka tile bileşeni — model satırlarında Film ikonunun yerine. */
function MarkaTile({ ad, boyut = 32 }: { ad: string; boyut?: number }) {
  const logo = modelLogo(ad);
  if (logo) {
    /* Logo, marka renginin koyu bir yastığı üstünde durur: SVG'ler tek renk
       ve bazıları koyu (ölçüm: xAI siyah 1.30:1 = görünmez → beyaza çevrildi).
       Yastık hem hizayı hem de harf karesiyle aynı silueti korur. */
    return (
      <span className="flex shrink-0 items-center justify-center rounded-lg bg-white/[0.07]"
        style={{ width: boyut, height: boyut }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" aria-hidden loading="lazy"
          className="object-contain" style={{ width: boyut * 0.6, height: boyut * 0.6 }} />
      </span>
    );
  }
  const m = modelMarka(ad);
  return (
    <span className="flex shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
      style={{ width: boyut, height: boyut, background: m.renk, color: m.metin }}>
      {m.kisa}
    </span>
  );
}

/**
 * m19: Liste görünümü video önizlemesi.
 * Oynat butonu videoyu YERİNDE mini oynatır (döngü, sessiz), tekrar tıkla durur.
 * Gerçek videoUrl varsa <video loop>; yoksa poster üzerinde nabız animasyonu.
 * Kutunun ORTASINA (butonun dışına) tıklayınca detay açılır.
 */
function ListeVideoOnizle({ u, arka, oranAspect, secili, onDetay, onSecim }: {
  u: import("@/store/useProjeler").Uretim;
  arka: string;
  oranAspect: string;
  secili: boolean;
  onDetay: () => void;
  onSecim: () => void;
}) {
  const vRef = useRef<HTMLVideoElement | null>(null);
  const [oynuyor, setOynuyor] = useState(false);
  const gercek = Boolean(u.videoUrl);
  const oynatDurdur = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (u.durum !== "tamam") return;
    if (gercek && vRef.current) {
      if (oynuyor) { vRef.current.pause(); setOynuyor(false); }
      else { vRef.current.currentTime = 0; vRef.current.play().catch(() => {}); setOynuyor(true); }
    } else {
      setOynuyor((v) => !v); // demo: nabız animasyonu aç/kapa
    }
  };
  return (
    <button onClick={onDetay}
      className="relative w-full shrink-0 overflow-hidden rounded-xl border border-[var(--sn-kenar)] bg-black sm:w-[240px]"
      style={{ aspectRatio: oranAspect, background: gercek && oynuyor ? "#000" : arka }} aria-label="Videoyu aç">
      {gercek && (
        <video ref={vRef} src={u.videoUrl} poster={u.gorselUrl && /^(data:|https?:|\/)/.test(u.gorselUrl) ? u.gorselUrl : undefined}
          loop muted playsInline
          onEnded={() => setOynuyor(false)}
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity", oynuyor ? "opacity-100" : "opacity-0 pointer-events-none")} />
      )}
      <span onClick={(e) => { e.stopPropagation(); onSecim(); }}
        className={cn("absolute left-2.5 top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-[5px] border-2 backdrop-blur-sm transition-all",
          secili ? "border-aksan bg-aksan text-zemin opacity-100" : "border-white/70 opacity-0 group-hover:opacity-100")}>
        {secili && <Check className="h-3 w-3" strokeWidth={3.5} />}
      </span>
      {/* oynat/durdur — mini oynatma (m19) */}
      <span className="absolute inset-0 z-[5] flex items-center justify-center" onClick={oynatDurdur}>
        <span className={cn("flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-zemin shadow-xl transition-all group-hover:scale-110",
          oynuyor && "opacity-0 group-hover:opacity-100")}>
          {oynuyor ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 translate-x-0.5 fill-current" />}
        </span>
      </span>
      {/* demo modda nabız — gerçek video yokken "oynuyor" hissi */}
      {!gercek && oynuyor && (
        <span className="pointer-events-none absolute inset-0 animate-pulse bg-white/[0.04]" />
      )}
    </button>
  );
}
// Bir modelin varyant tanımını bul.
function videoModelBul(ad: string): VideoModel | undefined {
  return TUM_VARYANTLAR.find((v) => v.ad === ad);
}

// ─────────────────────────────────────────────────────────────────────────
// Higgsfield birebir: model ADINA göre composer davranışını türet (higg-video-model
// analizi). Bir yerde toplanır ki liste sade kalsın, "kalıntı" olmasın.
// ─────────────────────────────────────────────────────────────────────────
type VideoOzellik = {
  kutu: VideoKutu; sure: number; oran?: string; oranGizli: boolean; cozGizli: boolean;
  enhance: boolean; cokCekim: boolean; sesToggle: boolean; bitrate: boolean;
  medyaTipi?: string; medyaSayisi?: number; not?: string; kredi: number; coz: string;
  sureler: number[];   // modele özel süre seçenekleri (sn)
  cozler: string[];    // modele özel çözünürlük seçenekleri
};
// "6-10sn" / "4-15sn" / "8sn" → seçilebilir süre listesi (sn). Higgsfield birebir aralık.
function sureListesi(aralik: string): number[] {
  const m = aralik.replace(/sn/gi, "").split("-").map((x) => parseInt(x.trim(), 10)).filter((n) => !isNaN(n));
  if (m.length === 1) return [m[0]];
  const [a, b] = m;
  const HAM = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30];
  const liste = HAM.filter((s) => s >= a && s <= b);
  if (!liste.includes(a)) liste.unshift(a);
  if (!liste.includes(b)) liste.push(b);
  return [...new Set(liste)].sort((x, y) => x - y);
}
// Varsayılan çözünürlüğe göre modelin sunduğu çözünürlük seti (Higgsfield birebir kademeler).
function cozListesi(coz: string): string[] {
  const TABAN = ["480p", "512p", "720p", "768p", "1080p", "4K"];
  const sira = TABAN.indexOf(coz);
  if (coz === "512p") return ["512p"];
  if (coz === "768p") return ["768p"];
  if (coz === "480p") return ["480p", "720p"];
  if (coz === "4K") return ["720p", "1080p", "4K"];
  if (sira < 0) return [coz];
  // 720p/1080p → o değere kadar kademeler
  return TABAN.filter((c) => !["512p", "768p"].includes(c)).filter((c) => TABAN.indexOf(c) <= sira);
}
function videoModelOzellik(ad: string): VideoOzellik {
  const v = videoModelBul(ad);
  const t: VideoOzellik = {
    kutu: "tek", sure: 5, oran: "16:9", oranGizli: false, cozGizli: false,
    enhance: true, cokCekim: false, sesToggle: false, bitrate: false,
    kredi: v?.kredi ?? 30, coz: v?.coz ?? "1080p",
    sureler: sureListesi(v?.sureAralik ?? "4-10sn"), cozler: cozListesi(v?.coz ?? "1080p"),
  };
  const has = (s: string) => ad.toLowerCase().includes(s.toLowerCase());

  // Minimax Hailuo — tek/kareler, 6s, 768p, oran yok
  if (has("Minimax Hailuo")) { t.sure = 6; t.coz = "768p"; t.oranGizli = true; t.kutu = /02\b/.test(ad) ? "kareler" : "tek"; return t; }
  // Kling 3.0 (baz) — kareler, 10s, 4K, çok çekim + sesToggle(off)
  if (ad === "Kling 3.0") { t.kutu = "kareler"; t.sure = 10; t.oran = "16:9"; t.cokCekim = true; t.enhance = true; return t; }
  if (ad === "Kling 3.0 Turbo") { t.sure = 5; t.oran = "16:9"; return t; }
  if (has("Kling 3.0 Omni Edit")) { t.kutu = "edit"; t.sure = 5; return t; }
  if (has("Kling 3.0 Omni")) { t.kutu = "medya"; t.medyaTipi = "Karakter, kişi ya da nesne"; t.sure = 5; t.oran = "1:1"; t.cokCekim = true; return t; }
  if (ad === "Kling 2.6") { t.sure = 5; t.oran = "16:9"; t.cozGizli = true; t.sesToggle = true; return t; }
  if (has("Kling O1 Video Edit")) { t.kutu = "edit"; t.medyaSayisi = 4; return t; }
  if (has("Kling O1")) { t.kutu = "kareler"; t.sure = 5; t.oran = "1:1"; t.not = "Videonu düzenlemek için Düzenle moduna geç."; return t; }
  if (has("Kling 2.5 Turbo")) { t.kutu = "kareler"; t.sure = 5; return t; }
  if (has("Kling 2.1 Master")) { t.sure = 5; return t; }
  if (has("Kling 2.1")) { t.kutu = "kareler"; t.sure = 5; t.coz = "720p"; return t; }
  if (has("Kling Motion Control") || has("Motion Control")) { t.kutu = "hareket"; t.sure = 5; return t; }
  // Sora 2 — tek(opsiyonel), 12s, 16:9, enhance yok
  if (has("Sora 2")) { t.sure = 12; t.oran = "16:9"; t.enhance = false; t.cozGizli = ad === "Sora 2"; if (has("Max")) t.not = has("Pro") ? undefined : "İnsan yüzü girdisi desteklenmez."; return t; }
  // Google Veo
  if (has("Veo 3.1 Fast")) { t.sure = 8; t.oran = "16:9"; t.cokCekim = true; return t; }
  if (has("Veo 3.1 Lite")) { t.sure = 8; t.oran = "Auto"; t.coz = "720p"; return t; }
  if (has("Veo 3")) { t.oran = "16:9"; t.coz = "720p"; return t; }
  // Gemini Omni Flash — medya (görsel/video)
  if (has("Gemini Omni")) { t.kutu = "medya"; t.medyaTipi = "Görsel veya Video"; t.sure = 8; t.oran = "16:9"; return t; }
  // Vayra DoP (Higgsfield DoP karşılığı) — Mix + Advanced, oran/coz gizli
  if (has("Vayra")) { t.sure = 5; t.oranGizli = true; t.cozGizli = true; return t; }
  // Wan
  if (ad === "Wan 2.7") { t.kutu = "kareler"; t.sure = 12; t.coz = "1080p"; t.oranGizli = true; t.enhance = false; return t; }
  if (ad === "Wan 2.6") { t.kutu = "medya"; t.medyaTipi = "Görsel veya Video"; t.sure = 5; t.coz = "720p"; t.oranGizli = true; t.cokCekim = true; return t; }
  if (has("Wan 2.5")) { t.sure = 5; t.oran = "16:9"; t.coz = has("Fast") ? "720p" : "480p"; return t; }
  if (has("Wan 2.2")) { t.sure = 5; t.oranGizli = true; t.cozGizli = true; return t; }
  // Seedance
  if (has("Seedance 2.0")) { t.kutu = "medya"; t.medyaTipi = "Görsel, Video veya Ses"; t.sure = 15; t.oran = "Auto"; t.coz = "720p"; t.bitrate = !has("Mini"); t.enhance = false; return t; }
  if (has("Seedance 1.5 Pro")) { t.kutu = "kareler"; t.sure = 8; t.oran = "Auto"; t.coz = "720p"; t.sesToggle = true; return t; }
  if (has("Seedance Pro")) { t.sure = 5; t.coz = "720p"; t.oranGizli = true; t.cokCekim = true; return t; }
  // Grok Imagine
  if (has("Grok Imagine Edit")) { t.kutu = "edit"; t.enhance = false; return t; }
  if (has("Grok Imagine 1.5")) { t.sure = 5; t.coz = "720p"; t.oranGizli = true; t.enhance = false; return t; }
  if (has("Grok Imagine")) { t.sure = 15; t.oran = "Auto"; t.coz = "720p"; t.enhance = false; return t; }
  // HappyHorse
  if (has("HappyHorse")) { t.sure = 12; t.oran = "16:9"; t.coz = "1080p"; t.enhance = false; return t; }
  return t;
}
// Geriye dönük uyumluluk: eski MODELLER referansları için featured özet listesi.
const MODELLER = MODEL_AILELERI.filter((a) => a.grup === "one").map((a) => ({
  ad: a.varyantlar[0].ad, ozet: a.ozet, meta: [a.varyantlar[0].coz, a.varyantlar[0].sureAralik],
}));

const BITRATELER: { ad: string; ozet: string }[] = [
  { ad: "Yüksek", ozet: "Az sıkıştırma · büyük boyut" },
  { ad: "Standart", ozet: "Çok sıkıştırma · küçük boyut" },
];

// Preset duvarı — Higgsfield imza kamera hareketleri. Her biri gerçek stok görsel arkalı.
const PRESETLER: { ad: string; model: string; kat: string }[] = [
  { ad: "PUSH TO GLASS", model: "Kling 3.0", kat: "sinematik" },
  { ad: "JIB UP", model: "Kling 3.0", kat: "manzara" },
  { ad: "JIB DOWN", model: "Seedance 2.0", kat: "manzara" },
  { ad: "DUTCH ANGLE", model: "Kling 3.0", kat: "sinematik" },
  { ad: "ZOOM OUT", model: "Veo 3.1", kat: "3d" },
  { ad: "TILT UP", model: "Kling 3.0", kat: "manzara" },
  { ad: "SKATE CRUISE", model: "Seedance 2.0", kat: "urun" },
  { ad: "SNOWBOARD CARVE", model: "Kling 3.0", kat: "manzara" },
  { ad: "SKATEBOARD OLLIE", model: "WAN 2.6", kat: "urun" },
  { ad: "SOUL JUMP", model: "Kling 3.0", kat: "portre" },
  { ad: "DRONE ORBIT", model: "Veo 3.1", kat: "manzara" },
  { ad: "CRASH ZOOM", model: "Kling 3.0", kat: "sinematik" },
  { ad: "DOLLY IN", model: "Seedance 2.0", kat: "sinematik" },
  { ad: "ORBIT LEFT", model: "Kling 3.0", kat: "3d" },
  { ad: "BULLET TIME", model: "Sora 2", kat: "soyut" },
  { ad: "WHIP PAN", model: "Kling 3.0", kat: "portre" },
  { ad: "CRANE UP", model: "Veo 3.1", kat: "manzara" },
  { ad: "FPV DIVE", model: "Seedance 2.0", kat: "3d" },
  { ad: "HANDHELD", model: "WAN 2.6", kat: "portre" },
  { ad: "LOW SHUTTER", model: "Kling 3.0", kat: "soyut" },
  { ad: "SLOW MOTION", model: "Sora 2", kat: "sinematik" },
  { ad: "FOCUS PULL", model: "Kling 3.0", kat: "portre" },
  { ad: "ARC SHOT", model: "Veo 3.1", kat: "urun" },
  { ad: "OVERHEAD DROP", model: "Seedance 2.0", kat: "3d" },
];

/* ------------------------------------------------------------------ */
/* HAREKET PRESET VİDEOLARI — Veo 3.1 Fast ile üretilmiş GERÇEK 5-6sn   */
/* videolar. Preset adı → public/gercek/video-hareket/*.mp4.           */
/* Hover'da kart üstünde otomatik oynar (Higgsfield birebir).          */
/* ------------------------------------------------------------------ */
const PRESET_VIDEOLARI: Record<string, string> = {
  "DRONE ORBIT": "/gercek/video-hareket/drone-orbit.mp4",
  "PUSH TO GLASS": "/gercek/video-hareket/push-to-glass.mp4",
  "JIB UP": "/gercek/video-hareket/jib-up.mp4",
  "JIB DOWN": "/gercek/video-hareket/jib-down.mp4",
  "DUTCH ANGLE": "/gercek/video-hareket/dutch-angle.mp4",
  "ZOOM OUT": "/gercek/video-hareket/zoom-out.mp4",
  "TILT UP": "/gercek/video-hareket/tilt-up.mp4",
  "SKATE CRUISE": "/gercek/video-hareket/skate-cruise.mp4",
  "SNOWBOARD CARVE": "/gercek/video-hareket/snowboard-carve.mp4",
  "SKATEBOARD OLLIE": "/gercek/video-hareket/skateboard-ollie.mp4",
  "SOUL JUMP": "/gercek/video-hareket/soul-jump.mp4",
  "CRASH ZOOM": "/gercek/video-hareket/crash-zoom.mp4",
  "DOLLY IN": "/gercek/video-hareket/dolly-in.mp4",
  "DOLLY OUT": "/gercek/video-hareket/dolly-out.mp4",
  "ORBIT LEFT": "/gercek/video-hareket/orbit-left.mp4",
  "ORBIT RIGHT": "/gercek/video-hareket/orbit-right.mp4",
  "BULLET TIME": "/gercek/video-hareket/bullet-time.mp4",
  "WHIP PAN": "/gercek/video-hareket/whip-pan.mp4",
  "CRANE UP": "/gercek/video-hareket/crane-up.mp4",
  "FPV DIVE": "/gercek/video-hareket/fpv-dive.mp4",
  "HANDHELD": "/gercek/video-hareket/handheld.mp4",
  "LOW SHUTTER": "/gercek/video-hareket/low-shutter.mp4",
  "SLOW MOTION": "/gercek/video-hareket/slow-motion.mp4",
  "FOCUS PULL": "/gercek/video-hareket/focus-pull.mp4",
  "ARC SHOT": "/gercek/video-hareket/arc-shot.mp4",
  "OVERHEAD DROP": "/gercek/video-hareket/overhead-drop.mp4",
  "VERTIGO": "/gercek/video-hareket/vertigo.mp4",
  "ACTION RUN": "/gercek/video-hareket/action-run.mp4",
  "EMOTION ZOOM": "/gercek/video-hareket/emotion-zoom.mp4",
  "UGC HANDHELD": "/gercek/video-hareket/ugc-handheld.mp4",
  "COMMERCIAL": "/gercek/video-hareket/commercial.mp4",
  "CAMERA ORBIT": "/gercek/video-hareket/camera-orbit.mp4",
  "CAMERA MOVE": "/gercek/video-hareket/camera-move.mp4",
  "ANIME FX": "/gercek/video-hareket/anime-fx.mp4",
  "JOJO": "/gercek/video-hareket/jojo.mp4",
  "K-POP": "/gercek/video-hareket/k-pop.mp4",
  "VIRAL SPIN": "/gercek/video-hareket/viral-spin.mp4",
  "EFFECTS": "/gercek/video-hareket/effects.mp4",
  "RAVEN TRANSITION": "/gercek/video-hareket/raven-transition.mp4",
  "MORPH": "/gercek/video-hareket/morph.mp4",
  "ANIMALIZATION": "/gercek/video-hareket/animalization.mp4",
  "GIANT GRAB": "/gercek/video-hareket/giant-grab.mp4",
  "LOGO TRANSFORM": "/gercek/video-hareket/logo-transform.mp4",
  "PIZZA FALL": "/gercek/video-hareket/pizza-fall.mp4",
  "AIR BENDING": "/gercek/video-hareket/air-bending.mp4",
  "WATER BENDING": "/gercek/video-hareket/water-bending.mp4",
  "HAND TRANSITION": "/gercek/video-hareket/hand-transition.mp4",
  "HOLE TRANSITION": "/gercek/video-hareket/hole-transition.mp4",
  "SMOKE TRANSITION": "/gercek/video-hareket/smoke-transition.mp4",
  "EXPLODE": "/gercek/video-hareket/explode.mp4",
  "TIME FREEZE": "/gercek/video-hareket/time-freeze.mp4",
  "DISINTEGRATE": "/gercek/video-hareket/disintegrate.mp4",
};
/** Preset adına karşılık gerçek video yolu (yoksa undefined → sadece görsel). */
function presetVideo(ad: string): string | undefined {
  return PRESET_VIDEOLARI[ad];
}

/* ------------------------------------------------------------------ */
/* Tam ekran preset seçici — model sekmeleri + preset ızgarası          */
/* ------------------------------------------------------------------ */

// Kategori havuzu — preset görselleri için tohum çeşitliliği
const KAT_HAVUZ = ["sinematik", "manzara", "portre", "urun", "soyut", "3d"] as const;
// Video kredi maliyeti — önce varyant kataloğu, sonra aile kuralı (Higgsfield birebir). CTA + uret() ortak kullanır.
function videoKrediHesap(model: string): number {
  const v = videoModelBul(model);
  if (v) return v.kredi;
  if (/sora/i.test(model)) return 60;
  if (/veo/i.test(model)) return 55;
  if (/kling/i.test(model)) return 48;
  if (/seedance/i.test(model)) return 42;
  if (/wan/i.test(model)) return 38;
  if (/hailuo|minimax/i.test(model)) return 20;
  if (/gemini/i.test(model)) return 24;
  return 7;
}

function katSec(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return KAT_HAVUZ[h % KAT_HAVUZ.length];
}

type PresetTip = { ad: string; rozet?: "Yeni" | "Popüler"; baslaBitir?: boolean };
const pr = (ad: string, rozet?: "Yeni" | "Popüler"): PresetTip => ({ ad, rozet });
// VFX/geçiş preseti — Higgsfield "Start & End" rozetli (başlangıç + bitiş karesi gerektirir).
const prBB = (ad: string, rozet?: "Yeni" | "Popüler"): PresetTip => ({ ad, rozet, baslaBitir: true });

// Higgsfield imza hareket presetleri — sık kullanılan tam liste
const HAREKET_PRESETLERI: PresetTip[] = [
  pr("GENEL"), pr("PUSH TO GLASS", "Popüler"), pr("JIB UP"), pr("JIB DOWN"),
  pr("DUTCH ANGLE"), pr("ZOOM OUT"), pr("TILT UP"), pr("SKATE CRUISE", "Yeni"),
  pr("SNOWBOARD CARVE"), pr("BULLET TIME", "Popüler"), pr("DRONE ORBIT"),
  pr("CRASH ZOOM"), pr("DOLLY IN"), pr("DOLLY OUT"), pr("WHIP PAN"),
  pr("CRANE UP"), pr("FPV DIVE", "Yeni"), pr("ORBIT LEFT"), pr("ORBIT RIGHT"),
  pr("LOW SHUTTER"), pr("HANDHELD"), pr("VERTIGO", "Popüler"), pr("SOUL JUMP", "Yeni"),
];

// Her model kendi preset setine sahip. Bazıları tek "GENEL", bazıları tam liste.
const MODEL_SEKMELERI: { ad: string; rozet?: "Yeni"; presetler: PresetTip[] }[] = [
  { ad: "2.0 Mini", rozet: "Yeni", presetler: [pr("GENEL"), pr("PUSH TO GLASS", "Popüler"), pr("ZOOM OUT"), pr("DOLLY IN"), pr("HANDHELD"), pr("WHIP PAN", "Yeni")] },
  { ad: "Seedance 2.0", presetler: HAREKET_PRESETLERI },
  { ad: "Vayra DoP", presetler: [pr("GENEL"), pr("DUTCH ANGLE"), pr("CRANE UP"), pr("DOLLY IN"), pr("DOLLY OUT"), pr("ORBIT LEFT"), pr("ORBIT RIGHT"), pr("VERTIGO", "Popüler")] },
  { ad: "HappyHorse", presetler: [pr("GENEL"), pr("SOUL JUMP", "Yeni"), pr("SKATE CRUISE"), pr("SNOWBOARD CARVE"), pr("FPV DIVE")] },
  { ad: "Kling 3.0 Omni", presetler: HAREKET_PRESETLERI },
  { ad: "Kling 3.0", presetler: HAREKET_PRESETLERI },
  { ad: "Kling 2.5", presetler: [pr("GENEL"), pr("PUSH TO GLASS"), pr("JIB UP"), pr("JIB DOWN"), pr("TILT UP"), pr("ZOOM OUT"), pr("CRASH ZOOM")] },
  { ad: "Kling 2.6", presetler: [pr("GENEL"), pr("DRONE ORBIT"), pr("CRANE UP"), pr("FPV DIVE"), pr("ORBIT LEFT"), pr("ORBIT RIGHT"), pr("BULLET TIME", "Popüler")] },
  { ad: "Kling O1", presetler: [pr("GENEL"), pr("PUSH TO GLASS", "Popüler"), pr("ORBIT LEFT"), pr("ORBIT RIGHT"), pr("CRANE UP"), pr("BULLET TIME", "Yeni")] },
  { ad: "Grok 1.5", presetler: [pr("GENEL"), pr("ZOOM OUT"), pr("HANDHELD")] },
  { ad: "Google Veo 3.1", presetler: HAREKET_PRESETLERI },
  { ad: "Veo 3.1 Lite", presetler: [pr("GENEL"), pr("ZOOM OUT"), pr("DOLLY IN"), pr("HANDHELD")] },
  { ad: "Google Veo 3", presetler: [pr("GENEL"), pr("DOLLY IN"), pr("CRANE UP"), pr("ORBIT LEFT")] },
  { ad: "Sora 2", presetler: [pr("GENEL"), pr("BULLET TIME", "Popüler"), pr("LOW SHUTTER"), pr("SLOW MOTION"), pr("VERTIGO"), pr("SOUL JUMP", "Yeni")] },
  { ad: "Minimax Hailuo", presetler: [pr("GENEL"), pr("ACTION RUN"), pr("EMOTION ZOOM"), pr("UGC HANDHELD", "Popüler"), pr("COMMERCIAL")] },
  { ad: "Wan 2.5", presetler: [pr("GENEL"), pr("CAMERA ORBIT"), pr("ANIME FX"), pr("K-POP", "Yeni")] },
  { ad: "Wan 2.6", presetler: [pr("GENEL"), pr("VIRAL SPIN"), pr("JOJO", "Popüler"), pr("ANIME FX")] },
  { ad: "Wan 2.7", presetler: [pr("GENEL"), pr("CAMERA MOVE"), pr("EFFECTS")] },
  { ad: "Wan 2.2", presetler: [pr("GENEL"), pr("VIRAL SPIN"), pr("EFFECTS")] },
  { ad: "VFX & Geçiş", rozet: "Yeni", presetler: [
    prBB("RAVEN TRANSITION", "Popüler"), prBB("MORPH", "Popüler"), prBB("ANIMALIZATION"), prBB("GIANT GRAB", "Yeni"),
    prBB("LOGO TRANSFORM"), prBB("PIZZA FALL"), prBB("AIR BENDING"), prBB("WATER BENDING"), prBB("HAND TRANSITION"),
    prBB("HOLE TRANSITION"), prBB("SMOKE TRANSITION"), prBB("EXPLODE", "Yeni"), prBB("TIME FREEZE"), prBB("DISINTEGRATE"),
  ] },
  { ad: "Seedance Pro", presetler: HAREKET_PRESETLERI },
  { ad: "Seedance 1.5 Pro", presetler: [pr("GENEL"), pr("DOLLY IN"), pr("ZOOM OUT"), pr("HANDHELD"), pr("WHIP PAN")] },
  { ad: "Grok", presetler: [pr("GENEL")] },
];

// Modele göre değişen filtre çipleri (Higgsfield birebir). Bilinmeyen model → temel set.
const MODEL_FILTRELERI: Record<string, string[]> = {
  "Vayra DoP": ["Tümü", "Yeni", "Popüler", "Efektler", "Temel Kamera", "Epik Kamera", "Nabzı Yakala", "Mix"],
  "Minimax Hailuo": ["Tümü", "Korku", "Viral", "Kamera Kontrol", "Efektler", "UGC", "Aksiyon", "Duygular", "Ticari"],
  "Wan 2.5": ["Tümü", "Viral", "Kamera Hareketi", "Efektler", "Jojo", "Anime", "K-Pop"],
  "Wan 2.6": ["Tümü", "Viral", "Kamera Hareketi", "Efektler", "Jojo", "Anime", "K-Pop"],
  "Sora 2": ["Tümü", "Yeni", "Popüler", "Sinematik", "Yavaş Çekim"],
  "VFX & Geçiş": ["Tümü", "Yeni", "Başla & Bitir", "Efektler", "Viral", "UGC", "Kamera Kontrol"],
};
const OVERLAY_FILTRELER_TEMEL = ["Tümü", "Yeni", "Popüler"] as const;
type OverlayFiltre = string;

// Deterministik "masonry" — her karta tohumdan sabit satır-yüksekliği
function kareSpan(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return [26, 34, 30, 40, 28][h % 5];
}

/* ------------------------------------------------------------------ */
/* Küçük paylaşılan parçalar                                           */
/* ------------------------------------------------------------------ */

/** Higgsfield tarzı popover altlığı (dışa tıkla + fade/scale animasyonu) */
function Dropdown({
  acik, kapat, children, className, sabitStil,
}: {
  acik: boolean; kapat: () => void; children: React.ReactNode; className?: string;
  sabitStil?: React.CSSProperties; // verilirse position:fixed ile konumlandırılır (overflow kırpmasını aşar)
}) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  const icerik = (
    <AnimatePresence>
      {acik && (
        <>
          <div className="fixed inset-0 z-[110]" onClick={kapat} />
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            style={sabitStil}
            className={cn("menu-surface z-[111] rounded-[14px] p-1.5", sabitStil ? "fixed" : "absolute", className)}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
  // sabitStil (fixed konum) verildiğinde PORTAL ile body'ye taşı: sol panel /
  // galeri kartları transform uyguluyor; transformlu ata içinde fixed viewport'a
  // değil o ataya göre çözülüp menü kartların ARKASINDA kalıyordu (görünmez).
  if (sabitStil && hazir) return createPortal(icerik, document.body);
  return icerik;
}

/* NOT: Yerel `YuklenenGorsel` KALDIRILDI (2026-07-31) — ortak
   `YuklenenOnizleme` bileşenine taşındı (explainer/shorts/pazarlama da
   aynısını kullanıyor). Video türü otomatik algılanıp döngüde oynatılır. */

/** iOS tarzı toggle */
function Toggle({ acik, onClick, "aria-label": al }: { acik: boolean; onClick: () => void; "aria-label": string }) {
  return (
    <button onClick={onClick} aria-label={al} aria-pressed={acik}
      className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", acik ? "bg-aksan" : "bg-white/20")}>
      <motion.span
        layout transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm"
        style={{ left: acik ? 19 : 3 }}
      />
    </button>
  );
}

/* ================================================================== */
/* Sayfa                                                               */
/* ================================================================== */

export function VideoStudyo({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
  /* Gömülüyken üretim, gömüldüğü projeye yazılır ve dış sayfaya haber verilir.
     Tek sarmalayıcı: her `uretimBaslat` çağrısını ayrı ayrı değiştirmeye gerek
     kalmadan hepsi buradan geçer (2026-08-02). */
  const uretimBaslat: typeof uretimBaslatHam = (istek) => {
    const s = uretimBaslatHam(gomulu && projeId ? { ...istek, projeId } : istek);
    if (s.ok && s.id) onUretildi?.(s.id);
    return s;
  };

  const { aktifProjeId } = useAktifProje();
  // Sekme + form durumu
  const [sekme, setSekme] = useState<SekmeId>("olustur");
  const [preset, setPreset] = useState<{ ad: string; model: string; kat: string }>({
    ad: "GENEL", model: "Kling 3.0", kat: "sinematik",
  });
  const [presetDuvarAcik, setPresetDuvarAcik] = useState(false); // sol panel "Değiştir" pill'i

  // Tam ekran model-sekmeli preset seçici overlay
  const [overlayAcik, setOverlayAcik] = useState(false);
  const [secilenModel, setSecilenModel] = useState("Kling 3.0");
  const [secilenPreset, setSecilenPreset] = useState("GENEL");
  const [overlayArama, setOverlayArama] = useState("");
  const [overlayFiltre, setOverlayFiltre] = useState<OverlayFiltre>("Tümü");
  const [overlayGorunen, setOverlayGorunen] = useState(20);

  const [prompt, setPrompt] = useState("");
  const [elementModal, setElementModal] = useState(false);
  const elementler = useElements((s) => s.elementler);
  // Elementi prompt'a @mention olarak ekle (Higgsfield element referansı)
  const elementEkle = (ad: string) => {
    setPrompt((p) => (p.trim() ? `${p.trim()} @${ad}` : `@${ad}`));
    setElementModal(false);
    toast.success(`@${ad} eklendi`, { description: "Referans prompt'a bağlandı" });
  };
  const [cokCekim, setCokCekim] = useState(false);
  const [iyilestir, setIyilestir] = useState(true);
  const [sesli, setSesli] = useState(false);

  const [model, setModel] = useState("Kling 3.0");
  const [modelAcik, setModelAcik] = useState(false);
  const [elementAra, setElementAra] = useState("");
  const router = useRouter();
  // Nav mega-panelinden ?sekme=… / ?model=… ile gelindiğinde sekme+modeli ayarla (Higgsfield birebir).
  const aramaParam = useSearchParams();
  useEffect(() => {
    const s = aramaParam.get("sekme");
    if (s === "olustur" || s === "duzenle" || s === "hareket") setSekme(s);
    const istenen = aramaParam.get("model");
    if (istenen) {
      const norm = (x: string) => x.toLowerCase().replace(/vayra\s*|google\s*/g, "").replace(/[^a-z0-9]/g, "");
      const hedef = norm(istenen);
      const bulunan = MODEL_SEKMELERI.find((m) => norm(m.ad) === hedef || norm(m.ad).includes(hedef) || hedef.includes(norm(m.ad)));
      if (bulunan) { setModel(bulunan.ad); setSecilenModel(bulunan.ad); }
    }
  }, [aramaParam]);
  const [sure, setSure] = useState("4sn");
  const [sureAcik, setSureAcik] = useState(false);
  const [cozunurluk, setCozunurluk] = useState("1080p");
  const [bitrate, setBitrate] = useState("Yüksek");   // Bitrate satırı (Seedance vb.)
  const [bitrateAcik, setBitrateAcik] = useState(false);
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => setPortalHazir(true), []);
  const [flyoutAile, setFlyoutAile] = useState<string | null>(null); // model listesinde hover'daki aile
  const [flyoutKonum, setFlyoutKonum] = useState<{ top: number; left: number } | null>(null);
  // Aile satırına hover → varyant flyout'unu PORTAL + FIXED konumla aç. Satırın hemen yanında,
  // dikeyde satırla hizalı; ekran dışına taşarsa içeri sıkışır (kesilme/saçma konum yok).
  // Kapanmayı geciktirmek için timer — mouse satırdan flyout'a giderken
  // aradaki boşlukta anında kapanmasın (grace period).
  const flyoutKapatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flyoutKapatIptal = () => { if (flyoutKapatTimer.current) { clearTimeout(flyoutKapatTimer.current); flyoutKapatTimer.current = null; } };
  const flyoutGecKapat = () => { flyoutKapatIptal(); flyoutKapatTimer.current = setTimeout(() => setFlyoutAile(null), 220); };
  const flyoutAc = (ad: string, el: HTMLElement) => {
    flyoutKapatIptal();
    const r = el.getBoundingClientRect();
    // Gerçek yükseklik ~420'ye kadar çıkar (6 varyantlı aile) — konumu ona göre
    // hesapla ki alttaki model kesilmesin.
    const gen = 248, tahminiYuk = 420, bosluk = 12;
    const sagaSigar = r.right + bosluk + gen < window.innerWidth;
    let left = sagaSigar ? r.right + bosluk : r.left - bosluk - gen;
    left = Math.max(bosluk, Math.min(left, window.innerWidth - bosluk - gen));
    // Dikey: satırla hizala; ekran altından taşarsa yukarı kaydır (alttaki kesilmesin).
    const top = Math.max(bosluk, Math.min(r.top - 8, window.innerHeight - bosluk - tahminiYuk));
    setFlyoutKonum({ top, left });
    setFlyoutAile(ad);
  };
  // Flyout açıkken herhangi bir kaydırma olursa kapat — konum sabit (fixed) ölçüldüğü
  // için model listesi kaydırılınca flyout satırından kopup havada kalıyordu.
  useEffect(() => {
    if (!flyoutAile) return;
    const kapat = () => setFlyoutAile(null);
    window.addEventListener("scroll", kapat, true); // capture: iç kaydırma kaplarını da yakalar
    return () => window.removeEventListener("scroll", kapat, true);
  }, [flyoutAile]);
  const [sinirsizMod, setSinirsizMod] = useState(false); // Kling "Sınırsız mod" toggle
  // Model seç: varyantın çözünürlüğünü otomatik uygula (Higgsfield birebir).
  const modelSec = (v: VideoModel) => {
    setModel(v.ad);
    setSecilenModel(v.ad);
    // Higgsfield birebir: model seçilince o modelin varsayılan süre/oran/çözünürlüğünü uygula (V3).
    const o = videoModelOzellik(v.ad);
    setCozunurluk(o.coz);
    setSure(`${o.sure}sn`);
    if (o.oran) setOran(o.oran);
    setModelAcik(false);
    setFlyoutAile(null);
    toast.success(`${v.ad} seçildi`, { description: `${o.coz} · ${o.sure}sn` });
  };
  // Aktif modelin varyant tanımı + Higgsfield birebir composer özellikleri (V3).
  const aktifVaryant = videoModelBul(model);
  const oz = videoModelOzellik(model);
  const secimTemizleV = useSecim((s) => s.temizle);
  const secililerV = useSecim((s) => s.secililer);
  const secimToggleV = useSecim((s) => s.toggle);
  const silV = useProjeler((s) => s.sil);
  const [listeDetayId, setListeDetayId] = useState<string | null>(null); // liste görünümünde açılan detay
  useEffect(() => () => secimTemizleV(), [secimTemizleV]); // sayfadan çıkınca seçimi bırak
  const [otoAyar, setOtoAyar] = useState(true); // Düzenle modu "Otomatik ayarlar" toggle
  const [sahneKontrol, setSahneKontrol] = useState(false); // Hareket modu "Sahne kontrol modu"
  const [modelAra, setModelAra] = useState(""); // model dropdown arama kutusu
  const modelSatirRef = useRef<HTMLDivElement>(null);
  const [modelKonum, setModelKonum] = useState<{ top: number; left: number } | null>(null);
  // Model listesini YANA aç (Higgsfield birebir) — buton rect'inden fixed konum hesapla.
  // Dropdown uzun; her zaman ekrana tam sığsın diye dikey ortala + kenarlardan pay bırak.
  const modelListeAc = () => {
    const r = modelSatirRef.current?.getBoundingClientRect();
    if (r) {
      const genislik = 300;
      const bosluk = 16;
      const kullanilabilir = window.innerHeight - bosluk * 2;
      const tahminiYukseklik = Math.min(520, kullanilabilir);
      // Sağa açmayı dene; sığmazsa sola. Her iki durumda da ekran içine SIKIŞTIR (kesilme yok).
      const sagaSigar = r.right + 8 + genislik < window.innerWidth;
      let left = sagaSigar ? r.right + 8 : r.left - 8 - genislik;
      left = Math.max(bosluk, Math.min(left, window.innerWidth - bosluk - genislik));
      const ideal = r.top + r.height / 2 - tahminiYukseklik / 2;
      const top = Math.max(bosluk, Math.min(ideal, window.innerHeight - bosluk - tahminiYukseklik));
      setModelKonum({ top, left });
    }
    setModelAcik((v) => !v);
  };
  // Süre / çözünürlük popover'ları — fixed, çipin ÜSTÜNE açılır (kırpılmaz).
  const sureCipRef = useRef<HTMLDivElement>(null);
  const cozCipRef = useRef<HTMLDivElement>(null);
  const [sureKonum, setSureKonum] = useState<React.CSSProperties | null>(null);
  const [cozKonum, setCozKonum] = useState<React.CSSProperties | null>(null);
  const sureAc = () => {
    /* Ortak hesap: yukarı sığmazsa aşağı açar, ekran içine sıkıştırır. */
    { const k = seciciKonumHesapla(sureCipRef.current, 280); if (k) setSureKonum(seciciStil(k)); }
    setSureAcik((v) => !v); setCozAcik(false);
  };
  const cozAc = () => {
    /* Ortak hesap: yukarı sığmazsa aşağı açar, ekran içine sıkıştırır. */
    { const k = seciciKonumHesapla(cozCipRef.current, 180); if (k) setCozKonum(seciciStil(k)); }
    setCozAcik((v) => !v); setSureAcik(false); setOranAcik(false);
  };
  const [cozAcik, setCozAcik] = useState(false);
  // Oran (aspect ratio) çipi — Higgsfield video composer birebir
  const oranCipRef = useRef<HTMLDivElement>(null);
  const [oran, setOran] = useState("16:9");
  const [oranAcik, setOranAcik] = useState(false);
  const [oranKonum, setOranKonum] = useState<React.CSSProperties | null>(null);
  const oranAc = () => {
    /* Ortak hesap: yukarı sığmazsa aşağı açar, ekran içine sıkıştırır. */
    { const k = seciciKonumHesapla(oranCipRef.current, 220); if (k) setOranKonum(seciciStil(k)); }
    setOranAcik((v) => !v); setSureAcik(false); setCozAcik(false);
  };
  const VIDEO_ORANLAR = ["16:9", "9:16", "1:1", "4:5", "Auto"];
  // Bit hızı satırı popover'ı — çipin üstüne açılır.
  const bitrateCipRef = useRef<HTMLDivElement>(null);
  const [bitrateKonum, setBitrateKonum] = useState<React.CSSProperties | null>(null);
  const bitrateAc = () => {
    /* Ortak hesap: yukarı sığmazsa aşağı açar, ekran içine sıkıştırır. */
    { const k = seciciKonumHesapla(bitrateCipRef.current, 220); if (k) setBitrateKonum(seciciStil(k)); }
    setBitrateAcik((v) => !v);
  };

  const [baslangicKare, setBaslangicKare] = useState<string | null>(null);
  const [bitisKare, setBitisKare] = useState<string | null>(null);
  // m7/m13: referans köprüsü — UretimDetay "Referans" dediğinde görseli
  // başlangıç karesine koy + prompt'u composer'a taşı (sayfa değişmeden).
  const refIstek = useReferansKopru((s) => s.istek);
  const refTuket = useReferansKopru((s) => s.tuket);
  useEffect(() => {
    if (!refIstek) return;
    if (refIstek.url && /^(data:|https?:|\/)/.test(refIstek.url)) {
      setBaslangicKare(refIstek.url);
      toast.success("Başlangıç karesi olarak eklendi 🎬", { description: "Video bu kareden başlayacak" });
    }
    if (refIstek.prompt) setPrompt((p) => (p ? p : refIstek.prompt));
    refTuket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refIstek]);

  /* AYAR GERİ YÜKLEME — detay panelindeki "Bu ayarlarla üret" düğmesini dinler.
     Görsel stüdyosuyla aynı desen; burada ek olarak SÜRE de geri yüklenir. */
  const ayarIstek = useAyarKopru((s) => s.istek);
  const ayarTuket = useAyarKopru((s) => s.tuket);
  useEffect(() => {
    if (!ayarIstek || ayarIstek.tur !== "video") return;
    if (ayarIstek.prompt) setPrompt(ayarIstek.prompt);
    if (ayarIstek.model) setModel(ayarIstek.model);
    if (ayarIstek.oran) setOran(ayarIstek.oran);
    if (ayarIstek.cozunurluk) setCozunurluk(ayarIstek.cozunurluk);
    if (ayarIstek.sure) setSure(ayarIstek.sure);
    // Üretimin kendi karesi sonraki videonun başlangıç karesi olur.
    const ilkRef = ayarIstek.referanslar?.[0]?.url;
    if (ilkRef) setBaslangicKare(ilkRef);
    ayarTuket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayarIstek]);
  const [mobilModelAcik, setMobilModelAcik] = useState(false);
  const [elementSeciciAcik, setElementSeciciAcik] = useState(false);
  const [sonKare, setSonKare] = useState<string | null>(null);
  const basRef = useRef<HTMLInputElement>(null);
  const sonRef = useRef<HTMLInputElement>(null);
  // Düzenle/Hareket modu yüklemeleri (Higgsfield birebir): gerçek dosya seçici + önizleme
  const [duzenVideo, setDuzenVideo] = useState<string | null>(null);
  const [duzenOge, setDuzenOge] = useState<string | null>(null);
  const [hareketVideo, setHareketVideo] = useState<string | null>(null);
  const [hareketKarakter, setHareketKarakter] = useState<string | null>(null);
  const duzenVideoRef = useRef<HTMLInputElement>(null);
  const duzenOgeRef = useRef<HTMLInputElement>(null);
  const hareketVideoRef = useRef<HTMLInputElement>(null);
  const hareketKarakterRef = useRef<HTMLInputElement>(null);
  const dosyaOnizle = (e: React.ChangeEvent<HTMLInputElement>, ayar: (u: string) => void, mesaj: string) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    ayar(URL.createObjectURL(f));
    toast.success(mesaj);
  };
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [uretiliyor, setUretiliyor] = useState(false);

  // Prompt textarea otomatik büyüsün — içerik arttıkça yükseklik (tavana kadar), sonra scroll (Higgsfield birebir).
  const otoBuyut = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, Math.round(window.innerHeight * 0.4)) + "px";
  };

  // Prompt programatik değiştiğinde textarea yüksekliğini yenile.
  useEffect(() => { if (promptRef.current) otoBuyut(promptRef.current); }, [prompt]);

  // Görsel stüdyosundan "Animate" ile gelen referans: başlangıç karesi olarak yükle.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = sessionStorage.getItem("vayra-animate-ref");
    if (ref) {
      sessionStorage.removeItem("vayra-animate-ref");
      setBaslangicKare(ref);
      toast.success("Görsel başlangıç karesi olarak eklendi 🎬", { description: "Şimdi bir hareket/istem seç ve videoyu üret." });
    }
  }, []);

  // Preset galeri kontrolleri
  const [galeriSekme, setGaleriSekme] = useState<"gecmis" | "nasil">("gecmis");
  const [gorunum, setGorunum] = useState<"izgara" | "liste">("izgara");
  const [zoom, setZoom] = useState(3); // ızgaraya uygulanan (yalnız bırakınca)
  /* Seçim çubuğu SAĞ PANELE göre ortalansın diye ölçülecek kapsayıcı. */
  const sagPanelRef = useRef<HTMLElement>(null);
  const [zoomGorsel, setZoomGorsel] = useState(3); // slider thumb'ı (anlık)
  // Sürüklerken ızgarayı yeniden düzenleme (kasma) YAPMA; sadece bırakınca uygula.
  const zoomuKomite = () => setZoom(zoomGorsel);
  const [gorunenAdet, setGorunenAdet] = useState(18);
  // Gerçek video üretimleri (Higgsfield "Geçmiş" sekmesi = kendi üretimlerin, en yeni önce).
  // NOT: selector'da .filter kullanmak yeni referans üretip sonsuz döngü yaratır;
  // tüm uretimler'i çekip useMemo ile filtrele (stabil referans).
  const tumUretimler = useProjeler((s) => s.uretimler);
  const videoUretimleri = useMemo(() => tumUretimler.filter((u) => u.tur === "video"), [tumUretimler]);
  // Higgsfield birebir: üretimleri TARİHE göre grupla ("Bugün" / "Dün" / "14 Temmuz 2026").
  const videoGruplar = useMemo(() => {
    const gruplar: { etiket: string; oge: typeof videoUretimleri }[] = [];
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    const gunFark = (t: number) => Math.floor((bugun.getTime() - new Date(t).setHours(0, 0, 0, 0)) / 86400000);
    const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const etiketle = (t: number) => {
      const f = gunFark(t);
      if (f <= 0) return "Bugün";
      if (f === 1) return "Dün";
      const d = new Date(t);
      return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
    };
    for (const u of videoUretimleri) {
      const et = etiketle(u.olusturma);
      const son = gruplar[gruplar.length - 1];
      if (son && son.etiket === et) son.oge.push(u);
      else gruplar.push({ etiket: et, oge: [u] });
    }
    return gruplar;
  }, [videoUretimleri]);
  const [seciliPresetAd, setSeciliPresetAd] = useState("GENEL");

  /* --- eylemler --- */
  const kareYukle = (e: React.ChangeEvent<HTMLInputElement>, hangi: "bas" | "son") => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    if (hangi === "bas") { setBaslangicKare(url); toast.success("Başlangıç karesi yüklendi 🎬"); }
    else { setSonKare(url); toast.success("Son kare yüklendi 🎬"); }
    e.target.value = "";
  };

  const presetSec = (p: { ad: string; model: string; kat: string }) => {
    setPreset(p);
    setSeciliPresetAd(p.ad);
    setModel(p.model);
    setPresetDuvarAcik(false);
    toast.success(`“${p.ad}” preseti seçildi ✦`, { description: `${p.model} · hareket hazır` });
  };

  // Tam ekran overlay'i aç — mevcut model sekmesini seçili yap
  const overlayAc = () => {
    const varMi = MODEL_SEKMELERI.some((m) => m.ad === model);
    setSecilenModel(varMi ? model : "Kling 3.0");
    setSecilenPreset(preset.ad);
    setOverlayArama("");
    setOverlayFiltre("Tümü");
    setOverlayGorunen(20);
    setOverlayAcik(true);
  };

  // Overlay'den preset seç → sol paneli güncelle + kapat + toast
  const overlayPresetSec = (presetAd: string) => {
    const kat = katSec(`${secilenModel}-${presetAd}`);
    setPreset({ ad: presetAd, model: secilenModel, kat });
    setSeciliPresetAd(presetAd);
    setSecilenPreset(presetAd);
    setModel(secilenModel);
    setOverlayAcik(false);
    toast.success(`“${presetAd}” preseti seçildi ✦`, { description: `${secilenModel} · hareket hazır` });
  };

  const uret = () => {
    if (sekme === "olustur" && prompt.trim().length < 2 && !baslangicKare) {
      return toast.error("Bir istem yaz ya da başlangıç karesi yükle.", {
        description: "Videonu birkaç kelimeyle anlat ya da bir başlangıç karesi ekle.",
      });
    }

    // İçerik moderasyonu — üretimden ÖNCE. Engellenirse kredi HİÇ düşmez.
    const denetim = icerikDenetle(prompt);
    if (!denetim.izin) {
      toast.error(`İçerik engellendi · ${kategoriEtiket(denetim.kategori)}`, { description: denetim.mesaj });
      return;
    }

    // Video kredi maliyeti: modele göre (ortak yardımcı — CTA ile senkron).
    const videoKredi = videoKrediHesap(model);

    setUretiliyor(true);
    const sonuc = uretimBaslat({
      baslik: (prompt.trim() || preset.ad).slice(0, 48),
      tur: "video",
      model,
      prompt: prompt.trim() || `${preset.ad} preseti`,
      kredi: videoKredi,
      arac: "Video Stüdyosu",
      projeId: aktifProjeId ?? undefined,
      meta: {
        sure, cozunurluk, oran,
        // hamIstem: "Bu ayarlarla üret" composer'a bunu yazar (bkz. görsel stüdyosu).
        hamIstem: prompt.trim(),
        ...(/seedance|wan/i.test(model) ? { bitHizi: bitrate } : {}),
        ...(/kling/i.test(model) && sinirsizMod ? { sinirsiz: "açık" } : {}),
      },
    });
    if (!sonuc.ok) {
      setUretiliyor(false);
      return uretimHataToast(sonuc);
    }
    setGaleriSekme("gecmis"); // üretim "Geçmiş"te görünür → oraya geç (kullanıcı sonucu görsün)
    toast.success(`Video üretiliyor ✦ ${videoKredi} kredi`, {
      description: `${preset.ad} · ${model} · ${sure} · ${cozunurluk}`,
    });
    setTimeout(() => setUretiliyor(false), 2400);
  };

  const modLabel = sekme === "olustur" ? "Üret" : sekme === "duzenle" ? "Düzenle" : "Uygula";

  // Aktif model sekmesinin presetleri → arama + filtre uygulanmış
  const aktifModel = MODEL_SEKMELERI.find((m) => m.ad === secilenModel) ?? MODEL_SEKMELERI[5];
  // Filtre çipleri aktif modele göre değişir (Higgsfield birebir); yoksa temel set.
  const aktifFiltreler = MODEL_FILTRELERI[secilenModel] ?? [...OVERLAY_FILTRELER_TEMEL];
  // Hareket seçici artık overlay DEĞİL (akış içinde galeri kolonunun yerine oturur),
  // bu yüzden sayfa kaydırmasını kilitlemez. Yalnız element modalı kilitler.
  useScrollKilit(elementModal);
  // Escape: açık olan katmanı kapat (element modalı → preset seçici overlay).
  useEscKapat(overlayAcik || elementModal, () => {
    if (elementModal) setElementModal(false);
    else if (overlayAcik) setOverlayAcik(false);
  });
  // Escape: açık composer dropdown'larını da kapat (Higgsfield birebir).
  useEscKapat(modelAcik || sureAcik || cozAcik, () => {
    setModelAcik(false); setSureAcik(false); setCozAcik(false);
  });

  const overlayPresetler = aktifModel.presetler.filter((p) => {
    if (overlayArama.trim() && !p.ad.toLowerCase().includes(overlayArama.trim().toLowerCase())) return false;
    if (overlayFiltre === "Yeni" && p.rozet !== "Yeni") return false;
    if (overlayFiltre === "Popüler" && p.rozet !== "Popüler") return false;
    return true;
  });
  const gorunenOverlay = overlayPresetler.slice(0, overlayGorunen);

  /* ── MOBİL COMPOSER ──
     Referansta Video Üret ekranı: başlangıç/bitiş kare (iki yükleme kutusu) +
     istem + model + süre/oran/çözünürlük çipleri + lime Üret. Masaüstündeki
     sol-panelli düzen mobilde gizli. */
  const mobilModeller: SeciciOge[] = MODEL_AILELERI.flatMap((a) =>
    a.varyantlar.map((v) => ({ id: v.ad, ad: v.ad, ozet: a.ozet, rozet: v.rozet })));

  return (
    <>
    <div className="sm:hidden">
      <MobilComposerKabuk
        baslik="Video Üret"
        modId="video"
        onKapat={() => router.push("/panel")}
        altCipler={(() => {
          /* MODELE GÖRE DİNAMİK ÇİPLER (Higgsfield birebir, videoModelOzellik'ten):
             süre/çözünürlük seçenekleri modelden gelir; oranGizli/cozGizli modellerde
             ilgili çip kaybolur; sesToggle + Kling sınırsız modu ekstra anahtar olur. */
          const oz = videoModelOzellik(model);
          // oz.sureler number[] (5,10,15) → "5sn" string listesi (çip formatı).
          const sureSecenek = oz.sureler?.length ? oz.sureler.map((s) => `${s}sn`) : undefined;
          return (
            <MobilAltCipler
              sure={sureSecenek ? sure : undefined} sureSecenek={sureSecenek} onSure={sureSecenek ? setSure : undefined}
              oran={oz.oranGizli ? undefined : oran} oranSecenek={oz.oranGizli ? undefined : ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"]}
              onOran={oz.oranGizli ? undefined : setOran}
              kalite={oz.cozGizli ? undefined : cozunurluk} kaliteSecenek={oz.cozGizli ? undefined : (oz.cozler ?? ["480p", "720p", "1080p", "4K"])}
              onKalite={oz.cozGizli ? undefined : setCozunurluk}
              ekstra={
                <>
                  {oz.sesToggle && (
                    <button onClick={() => setSesli((v) => !v)}
                      className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition-colors",
                        sesli ? "bg-aksan text-zemin" : "bg-[#2a2c2e] text-white")}>
                      🔊 Ses
                    </button>
                  )}
                  {/* Prompt-içi ses destekleyen modeller (sesToggle olmayanlar): ortam sesi çipi */}
                  {aktifVaryant?.ses && !oz.sesToggle && (
                    <button onClick={() => setSesli((v) => !v)}
                      className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition-colors",
                        sesli ? "bg-aksan text-zemin" : "bg-[#2a2c2e] text-white")}>
                      🔊 Ortam sesi {sesli ? "açık" : "kapalı"}
                    </button>
                  )}
                  {/* Çok çekimli — modele göre (Kling 3.0, Seedance Pro, Veo Fast…) */}
                  {oz.cokCekim && (
                    <button onClick={() => setCokCekim((v) => !v)}
                      className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition-colors",
                        cokCekim ? "bg-aksan text-zemin" : "bg-[#2a2c2e] text-white")}>
                      <Layers className="h-4 w-4" /> Çok çekimli
                    </button>
                  )}
                  {/* Bitrate — yalnız destekleyen modelde (Seedance 2.0) */}
                  {oz.bitrate && (
                    <MobilAltCip tip="kalite" deger={bitrate} secenekler={BITRATELER.map((b) => b.ad)} onSec={setBitrate} baslik="BİT HIZI" />
                  )}
                  {model.toLowerCase().includes("kling") && (
                    <button onClick={() => setSinirsizMod((v) => !v)}
                      className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition-colors",
                        sinirsizMod ? "bg-aksan text-zemin" : "bg-[#2a2c2e] text-white")}>
                      ∞ Sınırsız
                    </button>
                  )}
                </>
              }
            />
          );
        })()}
        uretButonu={<MobilUretButonu kredi={videoKrediHesap(model)} onTikla={uret} devreDisi={!prompt.trim() && !baslangicKare} />}
      >
        {/* ── 3 MOD SEKMESİ: Video Üret / Video Düzenle / Hareket Kontrolü ── */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 gizli-scroll">
          {SEKMELER.map((s) => (
            <button key={s.id} onClick={() => setSekme(s.id)}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors",
                sekme === s.id ? "bg-white text-[#131517]" : "bg-yuzey-2 text-white")}>
              <s.ikon className="h-4 w-4" /> {s.ad}
            </button>
          ))}
        </div>

        {/* Düzenle/Hareket modunda kaynak yükleme kutuları */}
        {sekme === "duzenle" && (
          <div className="grid grid-cols-2 gap-2">
            {([
              { url: duzenVideo, et: "Kaynak video", ayar: setDuzenVideo, kabul: "video/*" },
              { url: duzenOge, et: "Öge (isteğe bağlı)", ayar: setDuzenOge, kabul: "image/*" },
            ] as const).map((k, i) => (
              <label key={i} className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[12px] bg-yuzey-2 text-center">
                {k.url ? (
                  <>
                    {/* MADDE 7 (2026-07-31): VİDEO dosyası CSS backgroundImage ile
                        gösterilemez — kutu boş/"şerit" kalıyordu. Video ise <video>
                        ile DÖNGÜDE oynar; görsel ise <img> ile basılır. */}
                    {k.kabul.startsWith("video") ? (
                      <video src={k.url} className="absolute inset-0 h-full w-full object-cover"
                        autoPlay muted loop playsInline preload="metadata" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={k.url} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <button onClick={(e) => { e.preventDefault(); k.ayar(null); }} aria-label="Kaldır"
                      className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (<><input type="file" accept={k.kabul} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => k.ayar(String(r.result)); r.readAsDataURL(f); } e.target.value = ""; }} /><ImagePlus className="h-5 w-5 text-metin-2" /><span className="text-[13px] font-semibold text-white">{k.et}</span></>)}
              </label>
            ))}
          </div>
        )}
        {sekme === "hareket" && (
          <div className="grid grid-cols-2 gap-2">
            {([
              { url: hareketVideo, et: "Hareket videosu", ayar: setHareketVideo, kabul: "video/*" },
              { url: hareketKarakter, et: "Karakterin", ayar: setHareketKarakter, kabul: "image/*" },
            ] as const).map((k, i) => (
              <label key={i} className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[12px] bg-yuzey-2 text-center">
                {k.url ? (
                  <>
                    {/* MADDE 7 (2026-07-31): VİDEO dosyası CSS backgroundImage ile
                        gösterilemez — kutu boş/"şerit" kalıyordu. Video ise <video>
                        ile DÖNGÜDE oynar; görsel ise <img> ile basılır. */}
                    {k.kabul.startsWith("video") ? (
                      <video src={k.url} className="absolute inset-0 h-full w-full object-cover"
                        autoPlay muted loop playsInline preload="metadata" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={k.url} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <button onClick={(e) => { e.preventDefault(); k.ayar(null); }} aria-label="Kaldır"
                      className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (<><input type="file" accept={k.kabul} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => k.ayar(String(r.result)); r.readAsDataURL(f); } e.target.value = ""; }} /><ImagePlus className="h-5 w-5 text-metin-2" /><span className="text-[13px] font-semibold text-white">{k.et}</span></>)}
              </label>
            ))}
          </div>
        )}

        {/* Başlangıç + bitiş kare — yalnız "Video Üret" modunda */}
        {sekme === "olustur" && (
        <div className="grid grid-cols-2 gap-2">
          {([
            { url: baslangicKare, et: "Başlangıç karesi", zor: "Gerekli", ayar: (u: string | null) => setBaslangicKare(u), hangi: "bas" },
            { url: bitisKare, et: "Bitiş karesi", zor: "İsteğe bağlı", ayar: (u: string | null) => setBitisKare(u), hangi: "bit" },
          ] as const).map((k) => (
            <label key={k.hangi} className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[12px] bg-yuzey-2 text-center">
              {k.url ? (
                <>
                  {/* MADDE 7: hover'da SAĞA doğru büyük önizleme (element seçicideki
                      desenle aynı). Küçük kare içinde ne yüklediğin belli olmuyordu. */}
                  <YuklenenOnizleme url={k.url} alt={k.et} />
                  <button onClick={(e) => { e.preventDefault(); k.ayar(null); }} aria-label="Kaldır"
                    className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => k.ayar(String(r.result)); r.readAsDataURL(f); } e.target.value = ""; }} />
                  <ImagePlus className="h-5 w-5 text-metin-2" />
                  <span className="text-[14px] font-semibold text-white">{k.et}</span>
                  <span className="text-[11px] text-metin-3">{k.zor}</span>
                </>
              )}
            </label>
          ))}
        </div>
        )}
        <MobilIstemKutusu deger={prompt} onDegis={setPrompt} yerTutucu="Sahneni detaylıca anlat…"
          modelAdi={model} onModelTikla={() => setMobilModelAcik(true)}
          onElementAc={() => setElementSeciciAcik(true)} />
        {/* İstem iyileştirme toggle — modelde enhance destekliyse */}
        {videoModelOzellik(model).enhance && (
          <MobilAnahtar acik={iyilestir} onDegis={() => setIyilestir((v) => !v)} etiket="İstemi iyileştir" />
        )}
      </MobilComposerKabuk>

      <MobilSecici acik={mobilModelAcik} onKapat={() => setMobilModelAcik(false)}
        ogeler={mobilModeller} seciliId={model} onSec={(o) => setModel(o.id)} aramaYerTutucu="Model ara…" />
      <MobilSecici acik={elementSeciciAcik} onKapat={() => setElementSeciciAcik(false)} baslik="Element ekle"
        ogeler={elementler.map((e) => ({ id: e.id, ad: e.ad, ozet: e.aciklama }))}
        onSec={(o) => { const e = elementler.find((x) => x.id === o.id); if (e) setPrompt((p) => `${p}${p && !p.endsWith(" ") ? " " : ""}@${e.ad} `); }}
        aramaYerTutucu="Element ara…" />
    </div>

    <div className={cn("w-full gap-3", gomulu ? "flex p-0" : "hidden min-h-[calc(100vh-3rem)] p-3 sm:flex")}>
      {/* ============================================================ */}
      {/* SOL PANEL ~290px                                             */}
      {/* ============================================================ */}
      <aside className={cn("hf-kart flex-col overflow-hidden bg-yuzey", gomulu ? "flex w-full" : "hidden w-[330px] shrink-0 lg:flex")}
        style={gomulu ? undefined : { maxHeight: "calc(100vh - 4.5rem)" }}>
        {/* Kayan içerik — CTA hariç her şey; scroll çubuğu gizli */}
        <div className="gizli-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          {/* Sekmeler — Higgsfield birebir: ikon üstte, YAZI ALTTA, 2 satıra
              sabit yükseklikle hizalı ("Hareket Kontrolü" iki satır ama
              "Video Düzenle" ile aynı baştan hizalı). Aktif = LİME (cyan YOK). */}
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-yuzey-2/50 p-1">
            {SEKMELER.map((s) => {
              const aktif = sekme === s.id;
              const Ikon = s.ikon;
              return (
                <button key={s.id} onClick={() => setSekme(s.id)}
                  className={cn(
                    "flex flex-col items-center justify-start gap-1.5 rounded-xl px-1 pb-2.5 pt-3 text-center transition-colors",
                    aktif ? "border border-aksan/50 bg-aksan/10" : "border border-transparent hover:bg-white/5",
                  )}>
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg",
                    aktif ? "bg-aksan/15" : "bg-white/[0.06]")}>
                    <Ikon className={cn("h-4 w-4", aktif ? "text-aksan" : "text-metin-2")} />
                  </span>
                  {/* sabit iki satır yüksekliği → tüm sekmelerin yazıları aynı hizada başlar */}
                  <span className={cn("flex h-[26px] items-start justify-center text-[11.5px] font-medium leading-[1.15]", aktif ? "text-white" : "text-metin-3")}>{s.ad}</span>
                </button>
              );
            })}
          </div>

          {/* Sekme-özel hero (Higgsfield birebir) — Düzenle: Kling O1 Edit · Hareket: Motion Control */}
          {sekme === "duzenle" && (
            <div className="panel-ic rounded-xl p-3">
              <p className="hf-baslik text-[15px] text-aksan">KLING O1 EDIT</p>
              <p className="mt-1 text-[12px] leading-relaxed text-metin-2">Düzenle, yeniden stille, açıları ve öğeleri değiştir. Video yükle, değişikliği tarif et — gerisini yapay zeka halleder.</p>
            </div>
          )}
          {sekme === "hareket" && (
            <div className="panel-ic rounded-xl p-3">
              <p className="hf-baslik text-[15px] text-aksan">HAREKET KONTROLÜ</p>
              <p className="mt-1 text-[12px] leading-relaxed text-metin-2">Bir referans videodaki hareketi karakterine aktar. Kopyalanacak hareketi ve karakterini yükle.</p>
            </div>
          )}

          {/* Preset kartı — yalnızca Üret modunda (Higgsfield: Edit/Motion'da preset yok).
              MADDE 6 (2026-07-31): seçilen hareketin GERÇEK videosu döngüde oynar.
              Eskiden burada `aracArka()` ile üretilmiş stok gradyan duruyordu —
              kullanıcı hangi hareketi seçtiğini göremiyordu. */}
          {sekme === "olustur" && (
            <div className="hf-kart relative h-[105px] overflow-hidden"
              style={{ background: aracArka(`preset-${preset.ad}`, preset.kat) }}>
              {presetVideo(preset.ad) && (
                <video
                  key={preset.ad}
                  src={presetVideo(preset.ad)}
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay muted loop playsInline preload="metadata"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <button
                onClick={overlayAc}
                className="hf-btn glass-cip absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-white">
                <Pencil className="h-3 w-3" /> Değiştir
              </button>
              <div className="absolute inset-x-3 bottom-2.5">
                <p className="hf-baslik text-[22px] text-aksan drop-shadow">{preset.ad}</p>
                <p className="mt-0.5 text-[11px] text-white/75">{preset.model}</p>
              </div>
            </div>
          )}

          {/* Preset duvarı ipucu (Değiştir pill'i açınca) */}
          <AnimatePresence>
            {presetDuvarAcik && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="glass-cip-aktif overflow-hidden rounded-lg px-3 py-2 text-[11.5px] text-aksan">
                Sağdaki galeriden bir hareket seç — bu kart otomatik güncellenir.
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ DÜZENLE modu: video yükle + öğeler + Otomatik ayarlar (Higgsfield birebir) ═══ */}
          {sekme === "duzenle" && (
            <div className="space-y-2">
              <input ref={duzenVideoRef} type="file" accept="video/*" hidden onChange={(e) => dosyaOnizle(e, setDuzenVideo, "Video yüklendi 🎬")} />
              <input ref={duzenOgeRef} type="file" accept="image/*" hidden onChange={(e) => dosyaOnizle(e, setDuzenOge, "Öğe eklendi 🖼")} />
              {/* ŞERİT SORUNU (kullanıcı 2026-07-31): video `absolute` olduğu
                  için kutunun yüksekliğine katkı vermiyor; metin gidince kutu
                  `py-6` kadarına (~40px) çöküyor ve video ince bir çubuk gibi
                  görünüyordu. Doluyken 16:9 en-boy oranı veriyoruz. */}
              <button onClick={() => duzenVideoRef.current?.click()}
                className={cn("group relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[12px] panel-ic text-center transition-colors hover:ring-1 hover:ring-aksan/40",
                  duzenVideo ? "aspect-video" : "py-6")}>
                {duzenVideo ? (
                  <>
                    {/* autoPlay + loop ŞART: bunlar olmadan video ilk karesinde
                        donuk kalıyor ve kutuda "şerit" gibi görünüyordu
                        (kullanıcı geri bildirimi 2026-07-31). */}
                    <video src={duzenVideo} className="absolute inset-0 h-full w-full object-cover"
                      autoPlay loop muted playsInline preload="metadata" />
                    <span onClick={(e) => { e.stopPropagation(); setDuzenVideo(null); toast("Video kaldırıldı"); }}
                      className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full glass-ikon text-white pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"><X className="h-3.5 w-3.5" /></span>
                    <span className="glass absolute bottom-1.5 right-1.5 rounded-full px-2 py-0.5 text-[10px] text-metin">Değiştir</span>
                  </>
                ) : (
                  <>
                    <span className="glass-ikon flex h-11 w-11 items-center justify-center rounded-full"><Film className="h-5 w-5 text-metin-2" /></span>
                    <span className="text-[13px] font-medium text-metin">Düzenlemek için video yükle</span>
                    <span className="text-[11px] text-metin-3">Gerekli süre: 3–10 saniye</span>
                  </>
                )}
              </button>
              {/* overflow-hidden kalabilir: önizleme PORTAL ile body'ye çıkıyor,
                  kırpmadan da z-index yarışından da etkilenmiyor. */}
              {/* Aynı çökme sorunu (bkz. üstteki not): doluyken oran ver. */}
              <button onClick={() => duzenOgeRef.current?.click()}
                className={cn("group relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[12px] panel-ic text-center transition-colors hover:ring-1 hover:ring-aksan/40",
                  duzenOge ? "aspect-video" : "py-5")}>
                {!duzenOge && <span className="glass absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium text-metin-2">Opsiyonel</span>}
                {duzenOge ? (
                  <>
                    <YuklenenOnizleme url={duzenOge} alt="Öğe" />
                    {/* KALDIR (×) — kullanıcı isteği 2026-07-31: eskiden yalnız
                        "Değiştir" vardı, bir kez ekledikten sonra görseli
                        çıkarmanın hiçbir yolu yoktu. */}
                    <span onClick={(e) => { e.stopPropagation(); setDuzenOge(null); toast("Öğe kaldırıldı"); }}
                      className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full glass-ikon text-white pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"><X className="h-3.5 w-3.5" /></span>
                    <span className="glass absolute bottom-1.5 right-1.5 rounded-full px-2 py-0.5 text-[10px] text-metin">Değiştir</span>
                  </>
                ) : (
                  <>
                    <span className="text-[13px] font-medium text-metin">Görsel & öğe ekle</span>
                    <span className="text-[11px] text-metin-3">En fazla 4 görsel veya öğe</span>
                  </>
                )}
              </button>
              <label className="panel-ic flex items-center justify-between rounded-[12px] px-3 py-2.5">
                <span className="text-[13px] text-metin">Otomatik ayarlar</span>
                <button onClick={() => setOtoAyar((v) => !v)} className={cn("relative h-5 w-9 rounded-full transition-colors", otoAyar ? "bg-emerald-400" : "bg-white/20")}>
                  <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", otoAyar ? "left-4" : "left-0.5")} />
                </button>
              </label>
            </div>
          )}

          {/* ═══ HAREKET modu: hareket videosu + karakter (Higgsfield birebir) ═══ */}
          {sekme === "hareket" && (
            <div className="space-y-2">
              <input ref={hareketVideoRef} type="file" accept="video/*" hidden onChange={(e) => dosyaOnizle(e, setHareketVideo, "Hareket videosu yüklendi 🎬")} />
              <input ref={hareketKarakterRef} type="file" accept="image/*" hidden onChange={(e) => dosyaOnizle(e, setHareketKarakter, "Karakter eklendi 🖼")} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => hareketVideoRef.current?.click()}
                  className="group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-[12px] panel-ic px-2 text-center transition-colors hover:ring-1 hover:ring-aksan/40">
                  {hareketVideo ? (
                    <>
                      {/* autoPlay + loop — bkz. düzenleme modundaki aynı not. */}
                      <video src={hareketVideo} className="absolute inset-0 h-full w-full object-cover"
                        autoPlay loop muted playsInline preload="metadata" />
                      <span onClick={(e) => { e.stopPropagation(); setHareketVideo(null); toast("Hareket videosu kaldırıldı"); }}
                        className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full glass-ikon text-white pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"><X className="h-3.5 w-3.5" /></span>
                      <span className="glass absolute bottom-1 right-1 rounded-full px-1.5 py-0.5 text-[9px] text-metin">Değiştir</span>
                    </>
                  ) : (
                    <>
                      <span className="glass-ikon flex h-10 w-10 items-center justify-center rounded-full"><Move3d className="h-5 w-5 text-metin-2" /></span>
                      <span className="text-[12px] font-medium text-metin">Hareketi kopyala</span>
                      <span className="text-[10px] text-metin-3">3–30 saniye</span>
                    </>
                  )}
                </button>
                <button onClick={() => hareketKarakterRef.current?.click()}
                  className="group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-[12px] panel-ic px-2 text-center transition-colors hover:ring-1 hover:ring-aksan/40">
                  {hareketKarakter ? (
                    <>
                      <YuklenenOnizleme url={hareketKarakter} alt="Karakter" />
                      <span onClick={(e) => { e.stopPropagation(); setHareketKarakter(null); toast("Karakter kaldırıldı"); }}
                        className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full glass-ikon text-white pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"><X className="h-3.5 w-3.5" /></span>
                      <span className="glass absolute bottom-1 right-1 rounded-full px-1.5 py-0.5 text-[9px] text-metin">Değiştir</span>
                    </>
                  ) : (
                    <>
                      <span className="glass-ikon flex h-10 w-10 items-center justify-center rounded-full"><ImageIcon className="h-5 w-5 text-metin-2" /></span>
                      <span className="text-[12px] font-medium text-metin">Karakterini ekle</span>
                      <span className="text-[10px] text-metin-3">Yüz + vücut</span>
                    </>
                  )}
                </button>
              </div>
              <label className="panel-ic flex items-center justify-between rounded-[12px] px-3 py-2.5">
                <span className="text-[13px] text-metin">Sahne kontrol modu</span>
                <button onClick={() => setSahneKontrol((v) => !v)} className={cn("relative h-5 w-9 rounded-full transition-colors", sahneKontrol ? "bg-aksan" : "bg-white/20")}>
                  <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", sahneKontrol ? "left-4" : "left-0.5")} />
                </button>
              </label>
            </div>
          )}

          {/* Görsel-kutu bölümü — Higgsfield birebir: modele göre değişir (V3).
              tek → tek yükleme kutusu · kareler → başlangıç+son kare · medya → medya kutusu */}
          {sekme === "olustur" && (
            <>
              <input ref={basRef} type="file" accept="image/*" hidden onChange={(e) => kareYukle(e, "bas")} />
              <input ref={sonRef} type="file" accept="image/*" hidden onChange={(e) => kareYukle(e, "son")} />

              {oz.kutu === "kareler" ? (
                /* Başlangıç + Son kare (ikili) */
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { url: baslangicKare, ref: basRef, temizle: () => setBaslangicKare(null), et: "Başlangıç karesi", ops: false },
                    { url: sonKare, ref: sonRef, temizle: () => setSonKare(null), et: "Son kare", ops: true },
                  ] as const).map((k, i) => (
                    <button key={i} onClick={() => k.ref.current?.click()}
                      className="group relative flex aspect-square flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[12px] panel-ic text-center transition-colors hover:ring-1 hover:ring-aksan/40">
                      {k.ops && <span className="glass absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium text-metin-2">Opsiyonel</span>}
                      {k.url ? (
                        <>
                          {/* Hover'da SAĞA doğru büyük önizleme (kullanıcı isteği). */}
                          <YuklenenOnizleme url={k.url} alt={k.et} />
                          <span onClick={(e) => { e.stopPropagation(); k.temizle(); toast(`${k.et} kaldırıldı`); }}
                            className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full glass-ikon text-white pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"><X className="h-3 w-3" /></span>
                        </>
                      ) : (
                        <>
                          <span className="glass-ikon flex h-11 w-11 items-center justify-center rounded-full"><ImageIcon className="h-5 w-5 text-metin-2 transition-colors group-hover:text-aksan" /></span>
                          <span className="text-[12px] font-medium text-metin-2">{k.et}</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                /* Tek kutu (tek / medya) — Higgsfield "Görsel yükle veya üret" / "Medya yükle" */
                <button onClick={() => basRef.current?.click()}
                  className="group relative flex min-h-[128px] w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[12px] panel-ic p-4 text-center transition-colors hover:ring-1 hover:ring-aksan/40">
                  {baslangicKare ? (
                    <>
                      {/* MADDE: video/görsel ayrımı — "Video Düzenle" modunda bu
                          kutuya VİDEO yükleniyor; <img> ile basıldığı için kutu
                          boş "şerit" kalıyordu. Artık türe göre <video> döngüde
                          oynar, görselde ise hover önizlemesi açılır. */}
                      {baslangicKare.startsWith("data:video") || /\.(mp4|webm|mov)($|\?)/i.test(baslangicKare) ? (
                        <video src={baslangicKare} className="absolute inset-0 h-full w-full object-cover"
                          autoPlay loop muted playsInline preload="metadata" />
                      ) : (
                        <YuklenenOnizleme url={baslangicKare} alt="Yüklenen görsel" />
                      )}
                      <span onClick={(e) => { e.stopPropagation(); setBaslangicKare(null); toast("Görsel kaldırıldı"); }}
                        className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full glass-ikon text-white pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"><X className="h-3.5 w-3.5" /></span>
                    </>
                  ) : (
                    <>
                      <span className="glass-ikon flex h-11 w-11 items-center justify-center rounded-full">
                        {oz.kutu === "medya" ? <Film className="h-5 w-5 text-metin-2 transition-colors group-hover:text-aksan" /> : <ImageIcon className="h-5 w-5 text-metin-2 transition-colors group-hover:text-aksan" />}
                      </span>
                      <span className="text-[13px] font-medium text-metin">
                        {oz.kutu === "medya" ? "Medya yükle" : "Görsel yükle ya da üret"}
                      </span>
                      <span className="text-[11px] text-metin-3">
                        {oz.kutu === "medya" ? (oz.medyaTipi ?? "Görsel veya Video") : "PNG, JPG ya da panodan yapıştır"}
                      </span>
                    </>
                  )}
                </button>
              )}

              {/* Model altı bilgi notu (Sora Max "yüz desteklenmez", Kling O1 "Düzenle modu"...) */}
              {oz.not && (
                <div className="panel-ic flex items-start gap-2 rounded-[10px] px-3 py-2 text-[11px] leading-snug text-metin-2">
                  <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-metin-3" /> {oz.not}
                </div>
              )}
            </>
          )}

          {/* Prompt bloğu */}
          <div className="panel-ic rounded-xl p-2.5">
            {/* Çok çekimli — SADECE destekleyen modellerde (Higgsfield birebir, V3) */}
            {oz.cokCekim && (
              <div className="flex items-center justify-between pb-2">
                <span className="flex items-center gap-1.5 text-[13px] text-metin">
                  Çok çekimli
                  <Tooltip label="Tek istemden birden fazla ardışık sahne üretir." side="top">
                    <span className="inline-flex cursor-help" aria-label="Bilgi">
                      <Info className="h-3.5 w-3.5 text-metin-3 hover:text-metin-2" />
                    </span>
                  </Tooltip>
                </span>
                <Toggle acik={cokCekim} onClick={() => setCokCekim((v) => !v)} aria-label="Çok çekimli" />
              </div>
            )}

            <ElementMentionInput
              inputRef={promptRef}
              deger={prompt}
              onDeger={setPrompt}
              cokSatir
              placeholder="Videoyu tanımla, örn: gün batımında sahilde koşan kişi…  (@ ile element)"
              className="max-h-[40vh] w-full resize-none overflow-y-auto bg-transparent text-[13px] leading-relaxed text-metin outline-none placeholder:text-metin-3"
            />

            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {/* İyileştir — SADECE enhance destekleyen modellerde */}
              {oz.enhance && (
                <button onClick={() => { setIyilestir((v) => !v); toast(iyilestir ? "İstem iyileştirme kapalı" : "İstem iyileştirme açık ✨"); }}
                  className={cn("flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px]",
                    iyilestir ? "glass-cip-aktif text-aksan" : "glass-cip text-metin-2 hover:text-metin")}>
                  <Sparkles className="h-3 w-3" /> İyileştir {iyilestir ? "açık" : "kapalı"}
                </button>
              )}
              {/* Ses çipi — prompt-içi (ses üreten modellerde, sesToggle ayrı satırda değilse) */}
              {aktifVaryant?.ses && !oz.sesToggle && (
                <button onClick={() => { setSesli((v) => !v); toast(sesli ? "Ses kapalı" : "Ortam sesi açık 🔊"); }}
                  className={cn("flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px]",
                    sesli ? "glass-cip-aktif text-aksan" : "glass-cip text-metin-2 hover:text-metin")}>
                  <VolumeX className="h-3 w-3" /> Ses {sesli ? "açık" : "kapalı"}
                </button>
              )}
              <button onClick={() => setElementModal(true)}
                className="glass-cip flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] text-metin-2 hover:text-metin">
                <AtSign className="h-3 w-3" /> Element
              </button>
            </div>
          </div>

          {/* Ses toggle — ayrı satır (Kling 2.6, Seedance 1.5 Pro) — Higgsfield birebir */}
          {oz.sesToggle && (
            <label className="panel-ic flex items-center justify-between rounded-[12px] px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[13px] text-metin">
                Ses
                <Tooltip label="Videoya senkron ses/efekt üretir." side="top">
                  <span className="inline-flex cursor-help" aria-label="Bilgi"><Info className="h-3.5 w-3.5 text-metin-3" /></span>
                </Tooltip>
              </span>
              <Toggle acik={sesli} onClick={() => setSesli((v) => !v)} aria-label="Ses" />
            </label>
          )}

          {/* Model satırı — TEK açılış: model listesi. (Preset/HAREKET SEÇ ekranı zaten
              üstteki büyük preset kartından açılır; V2: buradaki ikinci ok kaldırıldı.) */}
          <div className="relative" ref={modelSatirRef}>
            <button onClick={modelListeAc}
              className="hf-btn panel-ic panel-ic-hover flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left">
              <span className="min-w-0">
                <span className="block text-[10.5px] uppercase tracking-wide text-metin-3">Model</span>
                <span className="block truncate text-[13.5px] font-medium text-metin">{model}</span>
              </span>
              <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 text-metin-2 transition-transform", modelAcik && "rotate-180")} />
            </button>
            <Dropdown acik={modelAcik} kapat={() => setModelAcik(false)} sabitStil={modelKonum ?? undefined} className="flex max-h-[min(520px,calc(100vh-32px))] w-[300px] flex-col">
              {/* Higgsfield birebir: model dropdown'unda arama kutusu */}
              <div className="panel-ic mb-1 flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5">
                <Search className="h-3.5 w-3.5 text-metin-3" />
                <input value={modelAra} onChange={(e) => setModelAra(e.target.value)} placeholder="Model ara…"
                  className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-metin-3" />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(() => {
                  const ara = modelAra.trim().toLowerCase();
                  // Varyant rozeti çipi
                  const Rozet = ({ r }: { r?: VideoRozet }) => {
                    if (!r) return null;
                    const stil = r === "Yeni" ? "bg-aksan text-zemin" : r === "Hızlı" ? "bg-sky-500/25 text-sky-300"
                      : r === "Özel" ? "bg-fuchsia-500/25 text-fuchsia-300" : "bg-amber-500/25 text-amber-300";
                    const et = r === "Yeni" ? "YENİ" : r === "Hızlı" ? "HIZLI" : r === "Özel" ? "ÖZEL" : "VAYRA";
                    return <span className={cn("rounded px-1 py-px text-[9px] font-bold", stil)}>{et}</span>;
                  };
                  const MetaCip = ({ v }: { v: VideoModel }) => (
                    <span className="mt-1 flex flex-wrap items-center gap-1">
                      <span className="glass-cip rounded px-1.5 py-0.5 text-[9px] font-medium text-metin-2">{v.coz}</span>
                      <span className="glass-cip rounded px-1.5 py-0.5 text-[9px] font-medium text-metin-2">{v.sureAralik}</span>
                      {v.ses && <span className="glass-cip rounded px-1.5 py-0.5 text-[9px] font-medium text-metin-2">Ses</span>}
                    </span>
                  );
                  // Arama modu: tüm varyantları düz göster
                  if (ara) {
                    const bulunan = TUM_VARYANTLAR.filter((v) => v.ad.toLowerCase().includes(ara));
                    if (!bulunan.length) return <p className="px-2 py-6 text-center text-[12px] text-metin-3">Model bulunamadı</p>;
                    return bulunan.map((v) => (
                      <button key={v.ad} onClick={() => modelSec(v)}
                        className={cn("flex w-full items-center gap-2.5 rounded-[10px] p-2 text-left transition-colors hover:bg-white/6", model === v.ad && "bg-white/[0.06]")}>
                        <MarkaTile ad={v.ad} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5"><span className="truncate text-[13px] font-medium">{v.ad}</span><Rozet r={v.rozet} /></span>
                          <MetaCip v={v} />
                        </span>
                        {model === v.ad && <Check className="h-4 w-4 shrink-0 text-aksan" />}
                      </button>
                    ));
                  }
                  const oneCikan = MODEL_AILELERI.filter((a) => a.grup === "one");
                  const tumu = MODEL_AILELERI.filter((a) => a.grup === "tum");
                  return (
                    <>
                      {/* ── Öne çıkan modeller (düz varyant) ── */}
                      <p className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3"><Sparkles className="h-3 w-3" /> Öne çıkan modeller</p>
                      {oneCikan.map((a) => { const v = a.varyantlar[0]; return (
                        <button key={a.ad} onClick={() => modelSec(v)}
                          className={cn("flex w-full items-center gap-2.5 rounded-[10px] p-2 text-left transition-colors hover:bg-white/6", model === v.ad && "bg-white/[0.06]")}>
                          <MarkaTile ad={v.ad} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5"><span className="truncate text-[13px] font-medium">{v.ad}</span><Rozet r={v.rozet} /></span>
                            <MetaCip v={v} />
                          </span>
                          {model === v.ad && <Check className="h-4 w-4 shrink-0 text-aksan" />}
                        </button>
                      ); })}
                      {/* ── Tüm modeller (aile → hover flyout varyant) ── */}
                      <p className="flex items-center gap-1.5 border-t border-kenar px-2 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-metin-3"><Film className="h-3 w-3" /> Tüm modeller</p>
                      {tumu.map((a) => {
                        const seciliAile = a.varyantlar.some((v) => v.ad === model);
                        return (
                          // NOT: flyout konumu hover anında BİR KEZ ölçülüp state'e yazılıyor.
                          // Liste kaydırılırsa satır kayar ama flyout eski koordinatta asılı
                          // kalırdı — bu yüzden kaydırmada kapatıyoruz (aşağıdaki useEffect).
                          <div key={a.ad} onMouseEnter={(e) => flyoutAc(a.ad, e.currentTarget)} onMouseLeave={flyoutGecKapat}>
                            <button onClick={(e) => { if (flyoutAile === a.ad) setFlyoutAile(null); else flyoutAc(a.ad, e.currentTarget.parentElement as HTMLElement); }}
                              className={cn("flex w-full items-center gap-2.5 rounded-[10px] p-2 text-left transition-colors hover:bg-white/6", (seciliAile || flyoutAile === a.ad) && "bg-white/[0.06]")}>
                              <MarkaTile ad={a.varyantlar[0]?.ad ?? a.ad} />
                              <span className="min-w-0 flex-1">
                                <span className="truncate text-[13px] font-medium">{a.ad.trim()}</span>
                                <span className="block truncate text-[11px] text-metin-3">{a.ozet}</span>
                              </span>
                              <ChevronRight className="h-4 w-4 shrink-0 text-metin-3" />
                            </button>
                            {/* Varyant flyout — PORTAL + FIXED: transform'lu dropdown parent'ından
                                bağımsız, viewport'a göre doğru konumlanır (saçma yerde açılma fix). */}
                            {flyoutAile === a.ad && flyoutKonum && portalHazir && createPortal(
                              <div onMouseEnter={() => { flyoutKapatIptal(); setFlyoutAile(a.ad); }} onMouseLeave={flyoutGecKapat}
                                style={{ position: "fixed", top: flyoutKonum.top, left: flyoutKonum.left }}
                                className="menu-surface z-[130] max-h-[min(440px,82vh)] w-[248px] overflow-y-auto rounded-[14px] p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {a.varyantlar.map((v) => (
                                  <button key={v.ad} onClick={() => modelSec(v)}
                                    className={cn("flex w-full flex-col rounded-[10px] p-2 text-left transition-colors hover:bg-white/6", model === v.ad && "bg-white/[0.06]")}>
                                    <span className="flex items-center gap-1.5">
                                      <span className="truncate text-[13px] font-medium">{v.ad}</span><Rozet r={v.rozet} />
                                      {model === v.ad && <Check className="ml-auto h-4 w-4 shrink-0 text-aksan" />}
                                    </span>
                                    <MetaCip v={v} />
                                  </button>
                                ))}
                              </div>,
                              document.body,
                            )}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </Dropdown>
          </div>

          {/* Süre + oran + çözünürlük çipleri — modele göre gösterilir (Higgsfield birebir, V3).
              Gizli çipler grid'den çıkar, kalanlar tam genişliğe yayılır. */}
          <div className={cn("grid gap-2", (() => {
            const n = 1 + (oz.oranGizli ? 0 : 1) + (oz.cozGizli ? 0 : 1);
            return n === 3 ? "grid-cols-3" : n === 2 ? "grid-cols-2" : "grid-cols-1";
          })())}>
            <div className="relative" ref={sureCipRef}>
              <button onClick={sureAc}
                className="hf-btn panel-ic panel-ic-hover flex w-full items-center justify-center gap-1 rounded-full py-2 text-[12px] text-metin">
                <Clock className="h-3.5 w-3.5 shrink-0 text-metin-2" /> {sure}
                <ChevronDown className={cn("h-3 w-3 shrink-0 text-metin-3 transition-transform", sureAcik && "rotate-180")} />
              </button>
              <Dropdown acik={sureAcik} kapat={() => setSureAcik(false)} sabitStil={sureKonum ?? undefined} className="w-[280px]">
                <SureKaydirici secenekler={oz.sureler.map((s) => `${s}sn`)} deger={sure} onDegis={setSure} baslik="Süre seç" />
              </Dropdown>
            </div>

            {/* Oran çipi — oranGizli modellerde gizli */}
            {!oz.oranGizli && (
            <div className="relative" ref={oranCipRef}>
              <button onClick={oranAc}
                className="hf-btn panel-ic panel-ic-hover flex w-full items-center justify-center gap-1 rounded-full py-2 text-[12px] text-metin">
                <RectangleHorizontal className="h-3.5 w-3.5 shrink-0 text-metin-2" /> {oran}
                <ChevronDown className={cn("h-3 w-3 shrink-0 text-metin-3 transition-transform", oranAcik && "rotate-180")} />
              </button>
              <Dropdown acik={oranAcik} kapat={() => setOranAcik(false)} sabitStil={oranKonum ?? undefined} className="w-[150px]">
                <p className="px-2.5 py-1.5 text-[11px] font-medium text-metin-3">En-boy oranı</p>
                {VIDEO_ORANLAR.map((o) => (
                  <button key={o} onClick={() => { setOran(o); setOranAcik(false); }}
                    className={cn("flex w-full items-center justify-between rounded-[9px] px-2.5 py-2 text-[13px] transition-colors hover:bg-white/6", oran === o ? "bg-white/[0.06] text-aksan" : "text-metin")}>
                    {o} {oran === o && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </Dropdown>
            </div>
            )}

            {/* Çözünürlük çipi — cozGizli modellerde gizli */}
            {!oz.cozGizli && (
            <div className="relative" ref={cozCipRef}>
              <button onClick={cozAc}
                className="hf-btn panel-ic panel-ic-hover flex w-full items-center justify-center gap-1 rounded-full py-2 text-[12px] text-metin">
                <Gem className="h-3.5 w-3.5 shrink-0 text-metin-2" /> {cozunurluk}
                <ChevronDown className={cn("h-3 w-3 shrink-0 text-metin-3 transition-transform", cozAcik && "rotate-180")} />
              </button>
              <Dropdown acik={cozAcik} kapat={() => setCozAcik(false)} sabitStil={cozKonum ?? undefined} className="w-[180px]">
                <p className="px-2.5 py-1.5 text-[11px] font-medium text-metin-3">Kalite seç</p>
                {oz.cozler.map((c) => (
                  <button key={c} onClick={() => { setCozunurluk(c); setCozAcik(false); }}
                    className={cn("flex w-full items-center justify-between rounded-[9px] px-2.5 py-2 text-[13px] transition-colors hover:bg-white/6", cozunurluk === c ? "bg-white/[0.06] text-aksan" : "text-metin")}>
                    <span className="flex items-center gap-2"><Gem className="h-3.5 w-3.5 text-metin-3" /> {c}</span>
                    {cozunurluk === c && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </Dropdown>
            </div>
            )}
          </div>

          {/* Bitrate satırı — SADECE Seedance 2.0 (Higgsfield birebir, V3) */}
          {oz.bitrate && (
            <div className="relative" ref={bitrateCipRef}>
              <button onClick={bitrateAc}
                className="hf-btn panel-ic panel-ic-hover flex w-full items-center justify-between rounded-xl px-3 py-2.5">
                <span className="flex items-center gap-2 text-[13px] text-metin"><AudioLines className="h-4 w-4 text-metin-2" /> Bit hızı</span>
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-aksan"><Sparkles className="h-3.5 w-3.5" /> {bitrate} <ChevronRight className="h-4 w-4 text-metin-3" /></span>
              </button>
              <Dropdown acik={bitrateAcik} kapat={() => setBitrateAcik(false)} sabitStil={bitrateKonum ?? undefined} className="w-[260px]">
                {BITRATELER.map((b) => (
                  <button key={b.ad} onClick={() => { setBitrate(b.ad); setBitrateAcik(false); }}
                    className={cn("flex w-full items-center justify-between gap-2 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-white/6", bitrate === b.ad && "bg-white/[0.06]")}>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-metin">{b.ad === "Yüksek" ? <Sparkles className="h-3.5 w-3.5 text-aksan" /> : <Zap className="h-3.5 w-3.5 text-metin-2" />} {b.ad}</span>
                      <span className="block text-[11px] text-metin-3">{b.ozet}</span>
                    </span>
                    {bitrate === b.ad && <Check className="h-4 w-4 shrink-0 text-aksan" />}
                  </button>
                ))}
              </Dropdown>
            </div>
          )}

          {/* Sınırsız mod — Kling ailesinde (Higgsfield birebir) */}
          {/kling/i.test(model) && (
            <div className="panel-ic flex items-center justify-between rounded-xl px-3 py-2.5">
              <span className="text-[13px] text-metin">Sınırsız mod</span>
              <Toggle acik={sinirsizMod} onClick={() => setSinirsizMod((v) => !v)} aria-label="Sınırsız mod" />
            </div>
          )}
        </div>

        {/* CTA — SABİT alt bölüm (Higgsfield birebir: içerik kayar, Üret hep altta kalır) */}
        <div className="shrink-0 border-t border-kenar bg-yuzey p-3">
          <button onClick={uret} disabled={uretiliyor}
            className="hf-cta flex w-full items-center justify-center gap-1.5 py-3 text-[14px]">
            {uretiliyor ? (
              <span className="hf-shimmer">Üretiliyor…</span>
            ) : (
              <>{modLabel} <Sparkles className="h-4 w-4" /> {videoKrediHesap(model)}</>
            )}
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* ORTA + SAĞ: PRESET DUVARI                                    */}
      {/* (seçici açıkken gizlenir — seçici AYNI kolonun yerine oturur) */}
      {/* ============================================================ */}
      <section ref={sagPanelRef} className={cn("hf-kart min-w-0 flex-1 flex-col overflow-y-auto bg-yuzey", overlayAcik || gomulu ? "hidden" : "flex")}
        style={{ maxHeight: "calc(100vh - 4.5rem)" }}>
        {/* Üst segment barı (yapışkan) */}
        {/* z-30: kart içindeki kalıcı beğeni rozeti z-20 taşıyor; eşit z'de DOM
            sırası kazandığı için kalp yapışkan şeridin ÜSTÜNE biniyordu
            (kullanıcı: "kalp onun üstüne geliyor", 2026-08-01). */}
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-kenar bg-yuzey px-4 py-2.5">
          <div className="glass-cip flex items-center gap-1 rounded-full p-1">
            <button onClick={() => setGaleriSekme("gecmis")}
              className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors",
                galeriSekme === "gecmis" ? "glass-cip-aktif text-metin" : "text-metin-2 hover:text-metin")}>
              <Folder className="h-3.5 w-3.5" /> Geçmiş
            </button>
            <button onClick={() => setGaleriSekme("nasil")}
              className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors",
                galeriSekme === "nasil" ? "glass-cip-aktif text-metin" : "text-metin-2 hover:text-metin")}>
              <HelpCircle className="h-3.5 w-3.5" /> Nasıl çalışır
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-[11px] text-metin-3">Yakınlaştır</span>
              <input type="range" min={3} max={5} value={zoomGorsel}
                onChange={(e) => setZoomGorsel(Number(e.target.value))}
                onPointerUp={zoomuKomite} onKeyUp={zoomuKomite} onBlur={zoomuKomite}
                className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/12 accent-aksan"
                aria-label="Izgara yoğunluğu" />
            </div>
            <div className="glass-cip flex items-center gap-1 rounded-full p-1">
              <button onClick={() => setGorunum("liste")}
                className={cn("flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] transition-colors",
                  gorunum === "liste" ? "glass-cip-aktif text-metin" : "text-metin-2 hover:text-metin")}>
                <List className="h-3.5 w-3.5" /> Liste
              </button>
              <button onClick={() => setGorunum("izgara")}
                className={cn("flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] transition-colors",
                  gorunum === "izgara" ? "glass-cip-aktif text-metin" : "text-metin-2 hover:text-metin")}>
                <LayoutGrid className="h-3.5 w-3.5" /> Izgara
              </button>
            </div>
          </div>
        </div>

        {/* Sekme içeriği */}
        {galeriSekme === "nasil" ? (
          /* m18: Higgsfield "MAKE VIDEOS IN ONE CLICK" birebir — dev başlık + 3 büyük
             görsel adım kartı (Görsel ekle → Preset seç → Video al). */
          <div className="mx-auto max-w-5xl p-4 sm:p-8">
            <h2 className="text-[34px] font-black uppercase leading-[1.05] tracking-tight text-metin sm:text-[44px]">
              Tek tıkla<br />video üret
            </h2>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-metin-2">
              Kamera kontrolü, çerçeveleme ve yüksek-kalite VFX için 250+ preset — ya da manuel kontrol için genel preset'i kullan.
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {[
                { ik: ImagePlus, b: "GÖRSEL EKLE", a: "Animasyonunu başlatmak için bir görsel yükle ya da üret.", g: "linear-gradient(135deg,#3b2f6b,#1a1725)" },
                { ik: SquareStack, b: "PRESET SEÇ", a: "Görsel hareketini kontrol etmek için bir preset seç.", g: "linear-gradient(135deg,#1e4d3f,#12261a)" },
                { ik: Film, b: "VİDEO AL", a: "Üret'e bas ve nihai animasyonlu videonu oluştur!", g: "linear-gradient(135deg,#5a1e2e,#2a1015)" },
              ].map((k, i) => (
                <div key={k.b} className="overflow-hidden rounded-2xl border border-[var(--sn-kenar)] bg-[var(--sn-panel,#131517)]">
                  <div className="relative flex aspect-[4/3] items-center justify-center" style={{ background: k.g }}>
                    <k.ik className="h-12 w-12 text-white/85" strokeWidth={1.5} />
                    <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-[13px] font-bold text-white backdrop-blur">{i + 1}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-[15px] font-bold tracking-tight text-metin">{k.b}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-metin-2">{k.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : gorunum === "liste" ? (
          /* LİSTE görünümü — Higgsfield /ai/video BİREBİR: her üretim tek satır kutu —
             SOL video önizleme (oranına göre, sabit boy) + SAĞ geniş metin bloğu:
             model badge, prompt, meta chip'leri (1080p · 10.0s · 9:16), altta
             Yeniden çalıştır / kopya / sil. YATAY KAYMA YOK (overflow-x-hidden + minmax0). */
          <div className="mx-auto max-w-5xl overflow-x-hidden p-4">
            {videoUretimleri.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full glass-ikon"><Film className="h-5 w-5 text-metin-3" /></span>
                <p className="text-sm font-medium text-metin">Henüz üretim yok</p>
                <p className="text-[12px] text-metin-3">Soldan bir video üret; burada listelensin.</p>
              </div>
            ) : videoGruplar.map((grup) => {
              const grupIdler = grup.oge.map((u) => u.id);
              const hepsiSecili = grupIdler.length > 0 && grupIdler.every((id) => secililerV.includes(id));
              const grupSecToggle = () => {
                if (hepsiSecili) grupIdler.forEach((id) => { if (secililerV.includes(id)) secimToggleV(id); });
                else grupIdler.forEach((id) => { if (!secililerV.includes(id)) secimToggleV(id); });
              };
              return (
                <div key={grup.etiket} className="mb-6">
                  <button onClick={grupSecToggle} className="mb-3 flex items-center gap-2.5">
                    <span className={cn("flex h-4.5 w-4.5 items-center justify-center rounded-[5px] border-2 transition-all",
                      hepsiSecili ? "border-aksan bg-aksan text-zemin" : "border-white/30 hover:border-white/60")}>
                      {hepsiSecili && <Check className="h-3 w-3" strokeWidth={3.5} />}
                    </span>
                    <span className="text-[15px] font-semibold text-metin">{grup.etiket}</span>
                  </button>
                  <div className="flex flex-col gap-4">
                    {grup.oge.map((u) => {
                      const secili = secililerV.includes(u.id);
                      const arka = u.gorselUrl && /^(data:|https?:|\/)/.test(u.gorselUrl) ? `url("${u.gorselUrl}") center/cover` : onizlemeArka(u.prompt + u.model, "sinematik");
                      const oran = u.meta?.oran ?? "16:9";
                      const cozunurluk = u.meta?.cozunurluk ?? "1080p";
                      const sure = u.meta?.sure ?? "10sn";
                      // Oran → sol video kutusunun aspect'i (Higgsfield birebir).
                      const oranAspect = oran === "9:16" ? "9 / 16" : oran === "1:1" ? "1 / 1" : oran === "4:5" ? "4 / 5" : "16 / 9";
                      // Higgsfield: sağdaki küçük "start frame" referans görseli.
                      const kareUrl = u.gorselUrl && /^(data:|https?:|\/)/.test(u.gorselUrl) ? u.gorselUrl : saltUrl(arka);
                      return (
                        <div key={u.id}
                          className={cn("group flex flex-col gap-5 rounded-2xl border bg-[var(--sn-panel,#131517)] p-4 sm:flex-row sm:gap-6 sm:p-5",
                            secili ? "border-aksan/60" : "border-[var(--sn-kenar)]")}>
                          {/* SOL: BÜYÜK video önizleme (Higgsfield birebir — esnek geniş, ekranın büyük kısmı).
                              m19: oynat butonu MİNİ oynatır (döngü), tekrar tıkla durur; kutuya tıklayınca detay. */}
                          <div className="w-full shrink-0 sm:w-[46%] sm:max-w-[520px]">
                            <ListeVideoOnizle
                              u={u} arka={arka} oranAspect={oranAspect}
                              secili={secili}
                              onDetay={() => u.durum === "tamam" && setListeDetayId(u.id)}
                              onSecim={() => secimToggleV(u.id)}
                            />
                          </div>
                          {/* SAĞ: model badge → prompt → start frame → meta → tarih → araçlar (Higgsfield birebir) */}
                          <div className="flex min-w-0 flex-1 flex-col py-1">
                            <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--sn-kenar)] px-2.5 py-1">
                              <MarkaTile ad={u.model} boyut={18} />
                              <span className="text-[13px] font-medium text-metin">{u.model}</span>
                            </span>
                            {/* Prompt — seçilebilir, uzun kelime kırılır (taşma yok) */}
                            <p onClick={(e) => e.stopPropagation()}
                              className="cursor-text select-text break-words text-[15px] leading-relaxed text-metin selection:bg-aksan/30 [overflow-wrap:anywhere]">{u.prompt || u.baslik}</p>
                            {/* Start frame küçük referans thumbnail (Higgsfield birebir) */}
                            {kareUrl && (
                              <div className="mt-4 h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--sn-kenar)]"
                                style={{ background: arka }} title="Başlangıç karesi">
                                <img src={kareUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                              </div>
                            )}
                            {/* Meta chip'leri — 1080p · süre · oran (koyu pill, Higgsfield gibi) */}
                            <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[13px] text-metin-2">
                              <span className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5"><Gem className="h-3.5 w-3.5" /> {cozunurluk}</span>
                              <span className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5"><Clock className="h-3.5 w-3.5" /> {sure}</span>
                              <span className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5"><RectangleHorizontal className="h-3.5 w-3.5" /> {oran}</span>
                            </div>
                            {/* Tarih (Higgsfield birebir — meta altında soluk) */}
                            <span className="mt-3 text-[12.5px] text-metin-3">{grup.etiket}</span>
                            {/* Alt: Yeniden çalıştır (sol) + kopya/sil (sağ) */}
                            <div className="mt-auto flex items-center justify-between pt-5">
                              <button onClick={() => { const s = uretimBaslat({ baslik: u.baslik, tur: "video", model: u.model, prompt: u.prompt, kredi: u.kredi, arac: u.arac }); if (s.ok) toast.success("Yeniden çalıştırılıyor 🔄"); }}
                                className="flex items-center gap-1.5 text-[13px] font-medium text-metin-2 transition-colors hover:text-metin"><RotateCcw className="h-4 w-4" /> Yeniden çalıştır</button>
                              <div className="flex items-center gap-2">
                                <button onClick={() => { setPrompt(u.prompt); toast("İstem panele yazıldı"); }} aria-label="Kopyala" className="hf-btn flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-white/8 hover:text-metin"><Copy className="h-4 w-4" /></button>
                                <button onClick={() => { silV(u.id); toast("Silindi"); }} aria-label="Sil" className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-rose-500/15 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* IZGARA (masonry) görünümü */
          <div className="p-4">
            {/* Gerçek video üretimlerin — Higgsfield "Geçmiş" birebir: TARİH gruplarıyla (V1) */}
            {videoUretimleri.length > 0 && (
              <div className="mb-5">
                {videoGruplar.map((grup) => {
                  const grupIdler = grup.oge.map((u) => u.id);
                  const hepsiSecili = grupIdler.length > 0 && grupIdler.every((id) => secililerV.includes(id));
                  const grupSecToggle = () => {
                    if (hepsiSecili) grupIdler.forEach((id) => { if (secililerV.includes(id)) secimToggleV(id); });
                    else grupIdler.forEach((id) => { if (!secililerV.includes(id)) secimToggleV(id); });
                  };
                  return (
                  <div key={grup.etiket} className="mb-5">
                    {/* Tarih başlığı — Higgsfield birebir: sol checkbox tüm grubu seçer */}
                    <button onClick={grupSecToggle} className="mb-3 flex items-center gap-2.5">
                      <span className={cn("flex h-4.5 w-4.5 items-center justify-center rounded-[5px] border-2 transition-all",
                        hepsiSecili ? "border-aksan bg-aksan text-zemin" : "border-white/30 hover:border-white/60")}>
                        {hepsiSecili && <Check className="h-3 w-3" strokeWidth={3.5} />}
                      </span>
                      <span className="text-[15px] font-semibold text-metin">{grup.etiket}</span>

                    </button>
                    <div className="gap-3" style={{ columnCount: zoom }}>
                      {grup.oge.map((u) => (
                        <div key={u.id} className="mb-3" style={{ breakInside: "avoid" }}>
                          <UretimKarti u={u} kutuBoyut={zoom >= 5 ? "kucuk" : zoom === 4 ? "orta" : "buyuk"} />
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })}
                <p className="mt-4 mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-metin-3">Hazır presetler</p>
              </div>
            )}
            <div className="gap-3" style={{ columnCount: zoom }}>
              {PRESETLER.slice(0, gorunenAdet).map((p, i) => {
                const secili = seciliPresetAd === p.ad;
                const dvVideo = presetVideo(p.ad);
                return (
                  <motion.button key={p.ad} onClick={() => presetSec(p)}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.35) }}
                    className={cn(
                      "hf-kart group relative mb-3 block w-full overflow-hidden",
                      secili && "hf-kart-secili",
                    )}
                    style={{ breakInside: "avoid" }}>
                    <div className="w-full overflow-hidden" style={{ height: kareSpan(p.ad) * 6 }}>
                      <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.06]"
                        style={{ background: aracArka(`preset-${p.ad}`, p.kat) }} />
                    </div>

                    {/* GERÇEK hareket videosu — SÜREKLİ döngüde otomatik oynar (hover gerekmez) */}
                    {dvVideo && (
                      <video src={dvVideo} autoPlay muted loop playsInline preload="metadata"
                        className="absolute inset-0 h-full w-full object-cover" />
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                    {/* Seçili rozeti */}
                    {secili && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-aksan text-zemin">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}

                    {/* Alt sol preset adı */}
                    <span className="absolute inset-x-3 bottom-2.5 z-10 text-left">
                      <span className="hf-baslik block text-[15px] leading-none text-white drop-shadow">{p.ad}</span>
                      <span className="mt-1 block text-[10.5px] text-white/65">{p.model}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Daha fazla yükle */}
            {gorunenAdet < PRESETLER.length ? (
              <div className="mt-2 flex justify-center">
                <button onClick={() => { setGorunenAdet((n) => Math.min(PRESETLER.length, n + 6)); toast("Daha fazla preset yüklendi"); }}
                  className="hf-btn glass-cip flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] text-metin">
                  Daha fazla yükle <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="mt-3 text-center text-[12px] text-metin-3">Tüm presetler yüklendi ✦</p>
            )}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* HAREKET/PRESET SEÇİCİ — Higgsfield birebir: OVERLAY DEĞİL.       */}
      {/* Sol composer paneli YERİNDE KALIR; seçici galeri kolonunun        */}
      {/* yerine, onun tam boyutunda AKIŞ İÇİNDE oturur (üst üste binme yok)*/}
      {/* ============================================================ */}
      <AnimatePresence mode="wait">
        {overlayAcik && (
          <motion.section
            key="hareket-secici"
            data-test="hareket-secici"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="hf-kart flex min-w-0 flex-1 flex-col overflow-hidden bg-yuzey"
            style={{ maxHeight: "calc(100vh - 4.5rem)" }}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative flex min-h-0 flex-1 flex-col">
              {/* ÜST: model sekmeleri (sol, yatay kayan) + arama & kapat (sağ, sabit).
                  Higgsfield birebir: tek satır — sekmeler soldan akar, sağda Ara + ✕. */}
              <div className="shrink-0 border-b border-kenar bg-yuzey">
                <div className="flex items-center gap-2 px-3 pt-2.5 sm:px-4">
                  {/* Yatay model sekmeleri */}
                  <div className="gizli-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                    {MODEL_SEKMELERI.map((m) => {
                      const aktif = secilenModel === m.ad;
                      return (
                        <button key={m.ad}
                          onClick={() => { setSecilenModel(m.ad); setOverlayFiltre("Tümü"); setOverlayGorunen(20); }}
                          className={cn(
                            "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 pb-2.5 pt-1 text-[13px] transition-colors",
                            aktif ? "text-metin" : "text-metin-3 hover:text-metin-2",
                          )}>
                          <Film className={cn("h-3.5 w-3.5", aktif ? "text-metin" : "text-metin-3")} />
                          {m.ad}
                          {m.rozet === "Yeni" && (
                            <span className="rounded bg-aksan px-1 py-px text-[8.5px] font-bold text-zemin">YENİ</span>
                          )}
                          {aktif && (
                            <motion.span layoutId="overlay-model-cizgi"
                              className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-metin" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* Sağ: arama + kapat (sekmeler kaysa da hep görünür) */}
                  <div className="flex shrink-0 items-center gap-2 pb-2 pl-2">
                    <div className="glass-cip flex items-center gap-1.5 rounded-full px-3 py-1.5">
                      <Search className="h-3.5 w-3.5 text-metin-3" />
                      <input
                        value={overlayArama}
                        onChange={(e) => { setOverlayArama(e.target.value); setOverlayGorunen(20); }}
                        placeholder="Ara"
                        className="w-20 bg-transparent text-[12.5px] text-metin outline-none placeholder:text-metin-3 sm:w-32"
                      />
                    </div>
                    <button onClick={() => setOverlayAcik(false)} aria-label="Kapat"
                      className="hf-btn glass-cip flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:text-metin">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filtre çipleri */}
              <div className="shrink-0 border-b border-kenar px-3 py-2.5 sm:px-4">
                <div className="gizli-scroll flex items-center gap-2 overflow-x-auto">
                  {aktifFiltreler.map((f) => {
                    const aktif = overlayFiltre === f;
                    return (
                      <button key={f}
                        onClick={() => { setOverlayFiltre(f); setOverlayGorunen(20); }}
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors",
                          aktif ? "bg-aksan text-zemin" : "glass-cip text-metin-2 hover:text-metin",
                        )}>
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preset ızgarası — kolon içinde otomatik sığdır (Higgsfield birebir kart oranı) */}
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3.5 sm:px-4">
                {gorunenOverlay.length === 0 ? (
                  <p className="mt-16 text-center text-[13px] text-metin-3">Bu filtreye uygun preset bulunamadı.</p>
                ) : (
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
                    {gorunenOverlay.map((p) => {
                      const secili = secilenPreset === p.ad;
                      const kat = katSec(`${secilenModel}-${p.ad}`);
                      const video = presetVideo(p.ad);
                      return (
                        <button key={p.ad}
                          onClick={() => overlayPresetSec(p.ad)}
                          className={cn(
                            "hf-kart group relative block aspect-[3/4] w-full overflow-hidden text-left",
                            secili && "hf-kart-secili",
                          )}>
                          <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.06]"
                            style={{ background: aracArka(`ovl-${secilenModel}-${p.ad}`, kat) }} />

                          {/* GERÇEK hareket videosu — SÜREKLİ döngüde otomatik oynar (hover gerekmez) */}
                          {video && (
                            <video
                              src={video}
                              autoPlay muted loop playsInline preload="metadata"
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          )}

                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

                          {/* Rozet */}
                          {p.rozet && (
                            <span className={cn(
                              "absolute left-2 top-2 rounded px-1.5 py-px text-[9px] font-bold",
                              p.rozet === "Yeni" ? "bg-aksan text-zemin" : "glass text-white",
                            )}>
                              {p.rozet === "Yeni" ? "YENİ" : "POPÜLER"}
                            </span>
                          )}

                          {/* Başla & Bitir rozeti (VFX/geçiş presetleri — Higgsfield "Start & End" birebir) */}
                          {p.baslaBitir && !secili && (
                            <span className="glass absolute right-2 top-2 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white">
                              <SquareStack className="h-2.5 w-2.5" /> Başla & Bitir
                            </span>
                          )}

                          {/* Seçili rozeti */}
                          {secili && (
                            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-aksan text-zemin">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}

                          {/* Hover oynatma ikonu — SADECE videosu olmayan kartlarda (video varsa videonun kendisi oynar) */}
                          {!video && (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="glass-strong flex h-11 w-11 items-center justify-center rounded-full text-white">
                                <Play className="h-5 w-5 translate-x-0.5 fill-white" />
                              </span>
                            </span>
                          )}

                          {/* Alt sol BÜYÜK HARF preset adı */}
                          <span className="absolute inset-x-3 bottom-3 z-10 hf-baslik block text-[15px] leading-none text-white drop-shadow">
                            {p.ad}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Daha fazla yükle */}
                {overlayGorunen < overlayPresetler.length && (
                  <div className="mt-5 flex justify-center">
                    <button
                      onClick={() => { setOverlayGorunen((n) => n + 10); toast("Daha fazla preset yüklendi"); }}
                      className="hf-btn glass-cip flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] text-metin">
                      Daha fazla yükle <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ═══ ELEMENT SEÇİCİ (@ referans) — Higgsfield birebir popup ═══ */}
      <AnimatePresence>
        {elementModal && (
          <ElementSeciciModal onSec={(ad) => elementEkle(ad)} onKapat={() => setElementModal(false)} />
        )}
      </AnimatePresence>

      {/* Toplu seçim çubuğu (Higgsfield "N selected") */}
      <SecimToolbar kapsayiciRef={sagPanelRef} />

      {/* Liste görünümünde video detayı */}
      <AnimatePresence>
        {listeDetayId && (() => {
          const u = videoUretimleri.find((x) => x.id === listeDetayId);
          return u ? <UretimDetay u={u} onClose={() => setListeDetayId(null)} /> : null;
        })()}
      </AnimatePresence>
    </div>
    </>
  );
}
