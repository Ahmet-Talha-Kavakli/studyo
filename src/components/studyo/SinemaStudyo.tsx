"use client";

import type { StudyoGomuluProps } from "@/components/studyo/tipler";

import { useState, useMemo, Suspense, useRef, useEffect } from "react";
import Link from "next/link";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, AtSign, ArrowUpRight, MoreVertical, Copy, Share2, Download, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Sparkles, Image as ImageIcon, Video,
  Check, Volume2, VolumeX, Clapperboard, X, PenLine, ArrowUp, Search,
  Ratio, Diamond, Clock, Minus, BadgeCheck, Eye, Heart, Wand2, LayoutGrid,
  FolderPlus, MoreHorizontal, Pin, Pencil, Link2, Trash2, Send, Filter,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { StudyoSidebar } from "@/components/kabuk/StudyoSidebar";
import { CamModal, CarkSutun, TurCark } from "@/components/kabuk/CamModal";
import {
  type PresetSekme,
  VIDEO_MODELLERI, GORSEL_MODELLERI, modelYetenekBul,
  TURLER, STIL_SUTUN, KAMERA_SUTUN, KAMERA_HAREKETLERI, HIZ_RAMPALARI,
  PRESET_SEKMELERI, CINEMA_PRESETLERI, sinemaGercek,
} from "@/lib/sinemaVeri";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";

/** Sinema tohumu için gerçek görsel varsa CSS background, yoksa stok. */
function sinemaArka(tohum: string, kat: string): string {
  const g = sinemaGercek(tohum);
  return g ? `url("${g}") center/cover no-repeat` : onizlemeArka(tohum, kat);
}
import { baglantiyiKopyala } from "@/lib/gercekEylem";
import { uretimBaslat as uretimBaslatHam, uretimHataToast } from "@/lib/uretimMotoru";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { useProjeler } from "@/store/useProjeler";
import { useSinema, type SinemaProje } from "@/store/useSinema";
import { useElements, goreliZamanKisa, type ElementTur } from "@/store/useElements";
import { UretimKarti } from "@/components/panel/UretimKarti";
import { SinemaLightbox, type LightboxUretim } from "@/components/panel/sinema/SinemaLightbox";
import { ElementDetayModal, YeniElementModal, type ElementVerisi } from "@/components/panel/sinema/ElementModallari";
import { VideoComposer, type VideoComposerDeger } from "@/components/panel/VideoComposer";
import { ElementSeciciModal } from "@/components/panel/element/ElementSeciciModal";
import { VideoModelSecici } from "@/components/panel/VideoModelSecici";
import { SinemaHaplar, type SinemaSecim } from "@/components/panel/SinemaSecici";
import { YonetmenPaneli, type YonetmenDurum } from "@/components/panel/YonetmenPaneli";
import { YeniProjeModalHF } from "@/components/panel/StudyoModallari";
import { UretimlerGorunum } from "@/components/panel/UretimlerGorunum";
import { useComposer } from "@/store/useComposer";
import { KucukComposer } from "@/components/panel/KucukComposer";
import { modelBul as specBul } from "@/lib/videoModelSpec";
import { HAPLAR_35, HAPLAR_30, VARSAYILAN_SECIM } from "@/lib/sinemaSecici";
import {
  MobilComposerKabuk, MobilIstemKutusu, MobilAltCipler, MobilAltCip, MobilCip, MobilUretButonu, MobilSecici,
} from "@/components/panel/MobilComposer";

/**
 * SİNEMA STÜDYOSU — Higgsfield /generate (Cinema Studio) BİREBİR (sıfırdan).
 * Kabuk C: üst nav (layout) + kendi dar sol sidebar + hero carousel + composer + My projects + topluluk.
 * Composer: Görsel/Video toggle → mod'a göre çipler + gruplu model dropdown.
 *   Video modu: Tür/Stil/Kamera çark modalları. Görsel modu: bu çipler gizli.
 * Modallar: Tür/Stil/Kamera çark · medya seçici (5 sekme) · Yeni proje · AI Yönetmen.
 */

/* ══════════════════ VERİ ══════════════════ */

// Hero carousel filmleri (Higgsfield: KOK BORU / HUNTRESS'S TALE + ‹ › + nokta göstergesi)
const HERO_FILMLER = [
  { ad: "AVCININ MASALI", tohum: "cs-hero-avci", kategori: "sinematik", uretim: "229" },
  { ad: "KÖK BÖRÜ", tohum: "cs-hero-kokboru", kategori: "manzara", uretim: "2.693" },
  { ad: "SESSİZ MAKİNE", tohum: "cs-hero-sessiz", kategori: "soyut", uretim: "1.408" },
];

// "Her projenin içini keşfet" — topluluk vitrin projeleri (Higgsfield Explore birebir)
const TOPLULUK_PROJELER = [
  { baslik: "Anime prodüksiyon — Lansman videosu", yazar: "Vayra Lansman", tohum: "top-anime", kategori: "sinematik", goruntulenme: "7.025", begeni: "91", renk: "from-cyan-glow to-iris-400" },
  { baslik: "Nala — Heads Drop", yazar: "nalastudio", tohum: "top-nala", kategori: "portre", goruntulenme: "12.6B", begeni: "186", renk: "from-iris-400 to-rose-400" },
  { baslik: "4K Blockbuster Çözümlemesi", yazar: "cinegrid", tohum: "top-4k", kategori: "sinematik", goruntulenme: "5.2B", begeni: "77", renk: "from-emerald-400 to-cyan-glow" },
  { baslik: "Kök Börü", yazar: "steppe", tohum: "top-kokboru", kategori: "manzara", goruntulenme: "98.1B", begeni: "1.202", renk: "from-amber-glow to-rose-400" },
  { baslik: "One More Time", yazar: "loopvisuals", tohum: "top-onemore", kategori: "soyut", goruntulenme: "3.4B", begeni: "58", renk: "from-cyan-glow to-emerald-400" },
  { baslik: "Gotik Sahil", yazar: "noirframe", tohum: "top-gothic", kategori: "sinematik", goruntulenme: "21.7B", begeni: "340", renk: "from-iris-500 to-cyan-glow" },
];

const KLASOR_RENKLERI = ["#34c2d4", "#5fd6e5", "#e5e7eb", "#a78bfa", "#c084fc", "#f472b6", "#fbbf24"];


/* ══════════════════ SAYFA ══════════════════ */

export function SinemaStudyo({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
  /* Asıl içerik SinemaIcerik'te; gömülü propları oraya geçiyoruz. */
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-3rem)] items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-aksan" /></div>}>
      <SinemaIcerik gomulu={gomulu} projeId={projeId} onUretildi={onUretildi} />
    </Suspense>
  );
}

function SinemaIcerik({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
  /* Gömülüyken üretim, gömüldüğü projeye yazılır ve dış sayfaya haber verilir. */
  const uretimBaslat: typeof uretimBaslatHam = (istek) => {
    const s = uretimBaslatHam(gomulu && projeId ? { ...istek, projeId } : istek);
    if (s.ok && s.id) onUretildi?.(s.id);
    return s;
  };
  const sp = useSearchParams();
  const router = useRouter();
  const gorunumG = sp.get("g"); // null=Ana Sayfa · uretim · element · favori · topluluk · projeler

  // ── Composer durumu ──
  /* Kip ve model STORE'da — sayfa dalları arasında korunur. */
  const mod = useComposer((s) => s.kip);
  const kipDegis = useComposer((s) => s.kipDegis);
  const setMod = (m: "gorsel" | "video") => kipDegis(m);
  const [prompt, setPrompt] = useState("");
  const [tur, setTur] = useState("Genel");
  const [stil, setStil] = useState({ palet: "Oto", isik: "Oto", hareket: "Oto" });
  const [kamera, setKamera] = useState({ kamera: "Oto", lens: "Oto", odak: "Oto", diyafram: "Oto" });
  const [manuelStil, setManuelStil] = useState(false);
  const [acikModal, setAcikModal] = useState<"tur" | "stil" | "kamera" | null>(null);
  const [ses, setSes] = useState(true);
  const [oran, setOran] = useState("16:9");
  const [cozunurluk, setCozunurluk] = useState("1080p");
  const [sure, setSure] = useState("4s");
  const [adet, setAdet] = useState(1);
  const [acikCip, setAcikCip] = useState<"oran" | "coz" | "sure" | null>(null);
  const model = useComposer((s) => s.model);
  const storeModelSec = useComposer((s) => s.modelSec);
  const setModel = (a: string) => storeModelSec(a);
  const [modelAcik, setModelAcik] = useState(false);
  const [modelAra, setModelAra] = useState("");

  /* ══════════════════════════════════════════════════════════════════
     YENİ COMPOSER — spec-güdümlü (Higgsfield birebir).
     Model değişince çipler, kutular, kredi ve ÜSTTEKİ SEÇİCİLER değişir:
       3.5 → Tür/Stil/Kamera çark hapları
       3.0 → Yönetmen Paneli + Tür + Kamera Hareketi + Hız Rampası (ızgara)
       2.5 → Yönetmen Paneli barı (hap yok, çipte Tür var)
     ══════════════════════════════════════════════════════════════════ */
  const [modelSeciciAcik, setModelSeciciAcik] = useState(false);
  const [elementSeciciAcik, setElementSeciciAcik] = useState(false);
  const modelCipRef = useRef<HTMLButtonElement>(null);
  /* Composer durumu STORE'da — Ana Sayfa ile Üretimlerim/Favorilerim ayrı
     render dallarında olduğundan useState sayfa değişince sıfırlanıyordu. */
  const sinemaSecim = useComposer((s) => s.secim);
  const setSinemaSecim = useComposer((s) => s.secimAyarla);
  /** Yönetmen Paneli (Sinema 2.5) — karakter yuvaları, hareket, hız eğrisi, süre. */
  const [yonetmenDurum, setYonetmenDurum] = useState<YonetmenDurum>({
    karakterler: [null, null, null],
    hareket: "Sabit",
    hizRampa: "Oto",
    hizEgri: [0.5, 0.62, 0.5, 0.42, 0.5],
    sure: 12,
  });
  /* Composer değeri STORE'dan — sayfa dalları arasında paylaşılır. */
  const kompDeger = useComposer((s) => s.deger);
  const kompGuncelle = useComposer((s) => s.guncelle);
  const setKompDeger = (y: Partial<VideoComposerDeger>) => kompGuncelle(y);
  /** Elementleri composer'ın @mention listesine uygun biçime çevir.
      Store'da gerçek görsel yoksa `tohum`dan gradyan önizleme üretilir.
      NOT: store çağrısı burada — aşağıdaki `elementler` bildirimi bu satırdan
      SONRA geldiği için TDZ hatası veriyordu. */
  const elementler = useElements((s) => s.elementler);
  const mentionElementleri = useMemo(
    () => elementler.map((e) => ({
      id: e.id, ad: e.ad, kategori: e.tur,
      gorselUrl: undefined as string | undefined,
    })),
    [elementler]);

  /** Aktif modelin seçici hapları (yalnız Sinema modellerinde dolu). */
  const sinemaHaplar = useMemo(() => {
    if (mod !== "video") return [];   // Görsel modunda hap yok (referans birebir)
    const s = specBul(model);
    if (s?.secici === "car") return HAPLAR_35;
    if (s?.secici === "izgara") return HAPLAR_30;
    return [];       // 2.5 → hap yok; Yönetmen Paneli barı ayrı render ediliyor
  }, [model, mod]);
  /** Model seç — spec varsayılanlarını uygulama işi STORE'da (useComposer). */
  const sinemaModelSec = (ad: string) => {
    storeModelSec(ad);
    const s = specBul(ad);
    toast.success(`${ad} seçildi`, {
      description: s ? [s.coz, s.sure ? `${s.sure}sn` : null].filter(Boolean).join(" · ") || undefined : undefined,
    });
  };
  const [referanslar, setReferanslar] = useState<string[]>([]);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  // ── Motion Control modalı (Higgsfield "Copy any motion" — Upload/Motion library) ──
  const [motionModal, setMotionModal] = useState(false);
  const [motionSekme, setMotionSekme] = useState<"yukle" | "kutuphane">("yukle");
  // ── Preset/Efekt modalı (Higgsfield "Presets" birebir) ──
  const [presetModal, setPresetModal] = useState(false);
  const [preset, setPreset] = useState("GENEL");
  const [presetSekme, setPresetSekme] = useState<PresetSekme>("Tümü");
  const [presetAra, setPresetAra] = useState("");
  // ── Başlangıç/Bitiş karesi (Higgsfield START/END FRAME — video modu) ──
  const [baslangicKare, setBaslangicKare] = useState<string | null>(null);
  const [bitisKare, setBitisKare] = useState<string | null>(null);
  const basKareRef = useRef<HTMLInputElement>(null);
  const bitisKareRef = useRef<HTMLInputElement>(null);
  // ── Director Panel (Higgsfield "Director Panel" — Sinema Stüdyo 2.5/3.0 modu) ──
  const [direktorAcik, setDirektorAcik] = useState(true);
  const [hareket, setHareket] = useState("Oto");
  const [hizRampa, setHizRampa] = useState("Oto");
  const [hareketModal, setHareketModal] = useState(false);
  // ── Modele-özgü ek kontroller ──
  const [multishot, setMultishot] = useState("Kapalı"); // Kling multi-shot (Kapalı/Oto/Özel)
  const [bitrate, setBitrate] = useState("Yüksek");      // Seedance bitrate (Yüksek/Standart)
  const [sahneKontrol, setSahneKontrol] = useState("Görsel"); // Motion Control sahne (Kapalı/Video/Görsel)
  const [modKip, setModKip] = useState("Kareler");       // Kling O1 Video mod (Kareler/Elementler)
  const [otoAyar, setOtoAyar] = useState(true);          // Omni Edit "Oto ayarlar" toggle
  const [cekimKontrol, setCekimKontrol] = useState("Akıllı"); // Çekim kontrolü (Akıllı/Tek çekim/Çoklu)
  const [iyilestir, setIyilestir] = useState(false);     // ✧ İstem iyileştir On/Off
  const [sabitLens, setSabitLens] = useState(false);     // Fixed Lens switch
  const [seed, setSeed] = useState("Rastgele");          // Higgsfield Lite seed
  const [videoRef, setVideoRef] = useState<string | null>(null); // Omni Edit VIDEO REFERANS
  const [acikCipEk, setAcikCipEk] = useState<"multishot" | "bitrate" | "sahne" | "mod" | null>(null);
  const videoRefInput = useRef<HTMLInputElement>(null);
  const kareYukle = (dosyalar: FileList | null, hangi: "bas" | "bitis") => {
    const d = dosyalar?.[0]; if (!d) return;
    const ok = new FileReader();
    ok.onload = () => { const u = String(ok.result); if (hangi === "bas") setBaslangicKare(u); else setBitisKare(u); toast.success(hangi === "bas" ? "Başlangıç karesi eklendi 🎬" : "Bitiş karesi eklendi 🎬"); };
    ok.readAsDataURL(d);
  };

  // Aktif modelin yetenekleri — composer çipleri BUNA göre gösterilir (Higgsfield birebir).
  const yetenek = useMemo(() => modelYetenekBul(model), [model]);
  // Model değişince oran/çözünürlük/süre'yi modelin desteklediği ilk değere uydur (geçersiz kalmasın).
  useEffect(() => {
    const y = modelYetenekBul(model);
    if (y.oranlar?.length && !y.oranlar.includes(oran)) setOran(y.oranlar[0]);
    if (y.cozunurlukler?.length && !y.cozunurlukler.includes(cozunurluk)) setCozunurluk(y.cozunurlukler[0]);
    if (y.sureler?.length && !y.sureler.includes(sure)) setSure(y.sureler[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  // ── Hero carousel ──
  const [heroIndex, setHeroIndex] = useState(0);
  const aktifHero = HERO_FILMLER[heroIndex];

  // ── Medya seçici modalı (5 sekme) ──
  const [assetModal, setAssetModal] = useState(false);
  const [assetSekme, setAssetSekme] = useState<"yuklemeler" | "elementler" | "gorsel" | "video" | "begeni">("gorsel");

  // ── AI Yönetmen paneli ──
  const [yonetmenAcik, setYonetmenAcik] = useState(false);
  const yonetmenRef = useRef<HTMLInputElement>(null);

  // ── Yeni proje modalı ──
  const [yeniProjeModal, setYeniProjeModal] = useState(false);
  /** Sidebar proje ⋮ menüsü işlemleri (referans: sidebar/). */
  const projeIslem = (islem: string, projeId: string) => {
    switch (islem) {
      case "Sil": projeSil(projeId); toast.success("Proje silindi"); break;
      case "Bağlantıyı kopyala":
        void baglantiyiKopyala(`/panel/projeler/${projeId}`); break;
      case "Sabitle": {
        // GERÇEK: store'daki sabit bayrağını çevir (liste sıralaması buna göre).
        const sabitMi = sinemaProjeler.find((p) => p.id === projeId)?.sabit;
        projeSabitle(projeId);
        toast.success(sabitMi ? "Sabitleme kaldırıldı" : "Proje sabitlendi 📌");
        break;
      }
      case "Düzenle": router.push(`/panel/projeler/${projeId}`); break;
      case "Klasör ekle": {
        // GERÇEK: projenin İÇİNE yeni bir klasör kaydı yaz (useSinema.projeKlasorEkle).
        const p = sinemaProjeler.find((x) => x.id === projeId);
        const sira = (p?.klasorler?.length ?? 0) + 1;
        projeKlasorEkle(projeId, `Klasör ${sira}`);
        toast.success("Klasör eklendi 📁", { description: p ? `${p.ad} içinde` : undefined });
        break;
      }
      default: toast(islem);
    }
  };
  const [yeniProjeAd, setYeniProjeAd] = useState("Yeni projem");
  const [yeniProjeRenk, setYeniProjeRenk] = useState("#34c2d4");

  // ── Projeler tam-sayfa görünümü ──
  const [projeSekme, setProjeSekme] = useState<"tumu" | "ozel" | "paylasilan">("tumu");
  const [projeAra, setProjeAra] = useState("");
  // ── Topluluk projesi detay lightbox ──
  const [toplulukDetay, setToplulukDetay] = useState<(typeof TOPLULUK_PROJELER)[number] | null>(null);
  // ── Görsel-detay lightbox (Higgsfield /generate/all — Bilgi/Araçlar/Yorumlar) ──
  const [lightbox, setLightbox] = useState<LightboxUretim | null>(null);
  // ── Element sistemi (Higgsfield /generate/elements — detay + yeni element modalları) ──
  const [elementDetay, setElementDetay] = useState<ElementVerisi | null>(null);
  const [yeniElementModal, setYeniElementModal] = useState(false);

  const modelGruplari = mod === "video" ? VIDEO_MODELLERI : GORSEL_MODELLERI;

  // Mod değişince o modun ilk sinematik modelini + uygun çözünürlüğü seç (Higgsfield birebir).
  useEffect(() => {
    setModel((mod === "video" ? VIDEO_MODELLERI : GORSEL_MODELLERI)[0].ogeler[0].ad);
    setCozunurluk(mod === "video" ? "1080p" : "2K");
  }, [mod]);

  // Nav mega-panelinden ?model=… ile gelindiğinde o modeli seç.
  useEffect(() => {
    const istenen = sp.get("model");
    if (!istenen) return;
    const hedef = istenen.toLowerCase().replace(/[^a-z0-9]/g, "");
    const bul = [...VIDEO_MODELLERI, ...GORSEL_MODELLERI].flatMap((g) => g.ogeler).find((m) => m.ad.toLowerCase().replace(/[^a-z0-9]/g, "").includes(hedef));
    if (bul) setModel(bul.ad);
  }, [sp]);

  useScrollKilit(yonetmenAcik || yeniProjeModal || toplulukDetay !== null || presetModal || assetModal || hareketModal || motionModal);
  useEscKapat(motionModal, () => setMotionModal(false));
  useEscKapat(hareketModal, () => setHareketModal(false));
  useEscKapat(presetModal, () => setPresetModal(false));
  useEscKapat(yonetmenAcik, () => setYonetmenAcik(false));
  useEscKapat(yeniProjeModal, () => setYeniProjeModal(false));
  useEscKapat(toplulukDetay !== null, () => setToplulukDetay(null));
  useEscKapat(modelAcik || acikCip !== null, () => { setModelAcik(false); setAcikCip(null); });

  const referansYukle = (f: FileList | null) => {
    if (!f?.length) return;
    Array.from(f).slice(0, 3).forEach((d) => {
      const r = new FileReader();
      r.onload = () => setReferanslar((v) => [...v, String(r.result)].slice(0, 3));
      r.readAsDataURL(d);
    });
    toast.success("Referans eklendi 🖼", { description: "Sahne bu görsele göre yönlendirilecek" });
  };
  const ogeEkle = () => {
    setPrompt((p) => (p.endsWith("@") || p.endsWith(" ") || p === "" ? p + "@" : p + " @"));
    promptRef.current?.focus();
    setAssetModal(true); setAssetSekme("elementler");
  };
  // Element seçici popup (Higgsfield "Elements" — @ referansı). Seçilen elementi
  // hem serbest prompt'a hem composer istemine ekler.
  const elementMentionEkle = (ad: string) => {
    setPrompt((p) => `${p}${p && !p.endsWith(" ") ? " " : ""}@${ad} `);
    setKompDeger({ istem: `${kompDeger.istem ?? ""}${kompDeger.istem && !kompDeger.istem.endsWith(" ") ? " " : ""}@${ad} ` });
    setElementSeciciAcik(false);
    toast.success(`@${ad} eklendi`, { description: "Referans isteme bağlandı" });
  };
  const yonetmeneSor = () => {
    const v = yonetmenRef.current?.value.trim();
    if (!v) return toast.error("Sahneni birkaç kelimeyle anlat.");
    setPrompt(v);
    toast.success("Yönetmen sahneyi işledi ✦", { description: "İstem composer'a yazıldı." });
    if (yonetmenRef.current) yonetmenRef.current.value = "";
    setYonetmenAcik(false);
  };
  // Medya seçiciden gerçek üretimi composer'a referans olarak ekle.
  const uretimReferansEkle = (arka?: string) => {
    const url = saltUrl(arka ?? "");
    if (url) setReferanslar((v) => [...v, url].slice(0, 3));
    else toast("Bu üretim gradyan önizleme — referans URL yok");
    setAssetModal(false);
    toast.success("Referans eklendi 🖼", { description: "Sahne bu görsele göre yönlendirilecek" });
  };

  // ── Store ──
  const tumUretimler = useProjeler((s) => s.uretimler);
  const silUretim = useProjeler((s) => s.sil);
  const favoriToggle = useProjeler((s) => s.favoriToggle);
  /* Elementlerim sayfası — kart seçimi ve ⋮ menüsü (referans: elementler/) */
  const [elSecili, setElSecili] = useState<string[]>([]);
  const [elMenuId, setElMenuId] = useState<string | null>(null);
  const elementSil = useElements((s) => s.sil);
  const elementEkle = useElements((s) => s.ekle);
  const elementGuncelle = useElements((s) => s.guncelle);
  const elementKullanildi = useElements((s) => s.kullanildi);
  const sinemaUretimleri = useMemo(() => tumUretimler.filter((u) => u.arac === "Sinema Stüdyosu"), [tumUretimler]);
  const favoriUretimler = useMemo(() => tumUretimler.filter((u) => u.favori), [tumUretimler]);
  const toplulukUretimler = useMemo(() => tumUretimler.filter((u) => u.yayinda), [tumUretimler]);
  // Medya seçici: gerçek görsel/video üretimleri (store'dan)
  const gorselUretimleri = useMemo(() => tumUretimler.filter((u) => u.tur === "gorsel" && u.durum === "tamam"), [tumUretimler]);
  const videoUretimleri = useMemo(() => tumUretimler.filter((u) => u.tur === "video" && u.durum === "tamam"), [tumUretimler]);
  const begeniUretimleri = useMemo(() => tumUretimler.filter((u) => u.favori), [tumUretimler]);
  // (elementler yukarıda tanımlandı — @mention listesi için)
  const sinemaProjeler = useSinema((s) => s.projeler);
  const projeOlustur = useSinema((s) => s.projeOlustur);
  const projeSil = useSinema((s) => s.projeSil);
  const projeSabitle = useSinema((s) => s.projeSabitle);
  const projeKlasorEkle = useSinema((s) => s.projeKlasorEkle);

  const yeniProjeOlustur = () => {
    const id = projeOlustur(yeniProjeAd.trim() || "Yeni projem", tur);
    setYeniProjeModal(false);
    toast.success("Yeni proje oluşturuldu 🎬");
    router.push(`/panel/projeler/${id}`);
  };

  // ── Çip özet metinleri ──
  const stilOzet = [stil.palet, stil.isik, stil.hareket].filter((s) => s !== "Oto");
  const stilEtiket = manuelStil ? "Manuel" : stilOzet.length ? stilOzet.join(", ") : "Oto";
  const kameraOzet = [kamera.kamera, kamera.lens, kamera.odak, kamera.diyafram].filter((s) => s !== "Oto");
  const kameraEtiket = kameraOzet.length ? kameraOzet.join(", ") : "Oto";
  const CIPLER = [
    { id: "tur" as const, ad: "Tür", deger: tur },
    { id: "stil" as const, ad: "Stil", deger: stilEtiket },
    { id: "kamera" as const, ad: "Kamera", deger: kameraEtiket },
  ];

  const uret = () => {
    // Motion Control: prompt yerine hareket+karakter gerekir (Higgsfield birebir doğrulama).
    if (yetenek.motionControl) {
      const sonuc = uretimBaslat({ baslik: "Hareket kopyalama", tur: "video", model, prompt: `Hareket kopyalama · sahne: ${sahneKontrol}`, kredi: yetenek.kredi, arac: "Sinema Stüdyosu", meta: { cozunurluk, oran, sure } });
      if (!sonuc.ok) return uretimHataToast(sonuc);
      toast.success("Hareket kopyalanıyor 🎬", { description: `${model} · ${cozunurluk}` });
      return;
    }
    if (prompt.trim().length < 3) return toast.error("Bir sahne tanımla.", { description: "Sahneni birkaç kelimeyle anlat." });
    const denetim = icerikDenetle(prompt);
    if (!denetim.izin) return toast.error(`İçerik engellendi · ${kategoriEtiket(denetim.kategori)}`, { description: denetim.mesaj });
    const kredi = yetenek.kredi; // Kredi MODELE göre (Higgsfield birebir)
    const referansNot = referanslar.length ? ` · ${referanslar.length} referans görsele sadık` : "";
    const detayNot = mod === "video" ? ` · ${tur} · ${stilEtiket} · ${kameraEtiket}` : "";
    const sonuc = uretimBaslat({
      baslik: prompt.slice(0, 48),
      tur: mod === "video" ? "video" : "gorsel",
      model,
      prompt: `${prompt}${detayNot}${referansNot}`,
      kredi,
      arac: "Sinema Stüdyosu",
      meta: { cozunurluk, oran, ...(mod === "video" ? { sure } : {}) },
    });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    toast.success("Sinema Stüdyosu üretiyor 🎬", { description: `${model} · ${oran} · ${cozunurluk}` });
    router.push("/panel/sinema?g=uretim");
  };

  /* ── "Projelerim" tam-sayfa görünümü (Higgsfield /generate?view=projects) ── */
  if (gorunumG === "projeler") {
    const suzulmus = sinemaProjeler
      .filter((p) => projeSekme === "tumu" || (projeSekme === "ozel" ? p.gizlilik === "ozel" : p.gizlilik !== "ozel"))
      .filter((p) => !projeAra || p.ad.toLocaleLowerCase("tr").includes(projeAra.toLocaleLowerCase("tr")));
    return (
      <div className="sinema-kapsam flex">
        <StudyoSidebar baslik="Sinema Stüdyosu" ikon={<Clapperboard className="h-3.5 w-3.5" />} temel="/panel/sinema" projeler={sinemaProjeler} onYeniProje={() => setYeniProjeModal(true)} onProjeIslem={projeIslem} />
        <div className="min-h-[calc(100vh-3rem)] flex-1">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="flex items-center gap-1.5 text-[15px] font-semibold">
              <button onClick={() => router.push("/panel/sinema")} className="text-metin-3 transition-colors hover:text-metin">Ana Sayfa</button>
              <span className="text-metin-3">/</span><span className="text-metin">Projelerim</span>
            </div>
            <div className="mt-5 flex items-center justify-between border-b border-kenar pb-3">
              <div className="flex items-center gap-1">
                {([["tumu", "Tümü"], ["ozel", "Özel"], ["paylasilan", "Paylaşılan"]] as const).map(([id, ad]) => (
                  <button key={id} onClick={() => setProjeSekme(id)} className={cn("relative rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors", projeSekme === id ? "text-metin" : "text-metin-3 hover:text-metin")}>
                    {ad}{projeSekme === id && <span className="absolute -bottom-3 left-2 right-2 h-0.5 rounded-full bg-aksan" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-full bg-yuzey-2 px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-metin-3" />
                <input value={projeAra} onChange={(e) => setProjeAra(e.target.value)} placeholder="Ara" className="w-40 bg-transparent text-[13px] outline-none placeholder:text-metin-3" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <YeniProjeKart onClick={() => setYeniProjeModal(true)} />
              {suzulmus.map((p, i) => (
                <ProjeKart key={p.id} p={p} gecikme={i * 0.03} onAc={() => router.push(`/panel/projeler/${p.id}`)}
                  onSil={() => { projeSil(p.id); toast("Proje silindi"); }}
                  onKopyala={() => { void baglantiyiKopyala(`/panel/projeler/${p.id}`); }} />
              ))}
            </div>
          </div>
        </div>
        <YeniProjeModalHF acik={yeniProjeModal} kapat={() => setYeniProjeModal(false)} onOlustur={(ad) => { setYeniProjeAd(ad); yeniProjeOlustur(); }} />
      </div>
    );
  }

  /* ── Sidebar görünümleri (Üretimlerim/Elementlerim/Favorilerim/Topluluk) ── */
  if (gorunumG) {
    const bilgi: Record<string, { baslik: string; liste: typeof tumUretimler; bos: string }> = {
      uretim: { baslik: "Üretimlerim", liste: sinemaUretimleri, bos: "Henüz sinema üretimin yok. Ana Sayfa'dan bir sahne üret." },
      favori: { baslik: "Favorilerim", liste: favoriUretimler, bos: "Beğendiğin üretimler burada toplanır." },
      topluluk: { baslik: "Topluluk", liste: toplulukUretimler, bos: "Yayınladığın üretimler toplulukta görünür." },
      element: { baslik: "Elementlerim", liste: [], bos: "Element yok. Bir üretimden @element oluştur." },
    };
    const g = bilgi[gorunumG] ?? bilgi.uretim;

    // ── Elementlerim: Higgsfield /generate/elements grid (Yeni Element kartı + @element kartları) ──
    if (gorunumG === "element") {
      return (
        <div className="sinema-kapsam flex">
          <StudyoSidebar baslik="Sinema Stüdyosu" ikon={<Clapperboard className="h-3.5 w-3.5" />} temel="/panel/sinema" projeler={sinemaProjeler} onYeniProje={() => setYeniProjeModal(true)} onProjeIslem={projeIslem} />
          <div className="min-h-[calc(100vh-3rem)] flex-1">
            <div className="mx-auto max-w-6xl px-6 py-8">
              <div className="mb-5 flex items-center justify-between">
                <h1 className="text-xl font-bold">Elementlerim</h1>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 rounded-lg border border-kenar bg-yuzey-2 px-3 py-1.5 text-[13px] text-metin-2 hover:text-metin"><Filter className="h-3.5 w-3.5" /> Filtre</button>
                  <div className="flex items-center gap-2 rounded-lg bg-yuzey-2 px-3 py-1.5"><Search className="h-3.5 w-3.5 text-metin-3" /><input placeholder="Ara" className="w-32 bg-transparent text-[13px] outline-none placeholder:text-metin-3" /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {/* Yeni Element kartı */}
                <button onClick={() => setYeniElementModal(true)} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-white/15 transition-colors hover:border-aksan/40">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-yuzey-3"><Plus className="h-5 w-5 text-metin-2" /></span>
                  <span className="text-[12px] text-metin-2">Yeni Element</span>
                </button>
                {/* Gerçek elementler — hover: seçim kutusu + Kullan + ⋮ (referans birebir) */}
                {elementler.map((el) => (
                  <button key={el.id} onClick={() => setElementDetay({ id: el.id, ad: el.ad, yazar: "Ahmet Talha Kavaklı", tur: "Karakter", durum: "Aktif", kullanim: "1 üretim", sonKullanim: "8 saat önce", olusturuldu: "4 gün önce", klasor: "Game of Thrones", tohum: el.tohum })}
                    className="group/el relative overflow-hidden rounded-[14px] border border-kenar text-left transition-colors hover:border-white/25 hover:bg-white/[0.04]">
                    <span className="relative block aspect-[4/3]" style={{ background: onizlemeArka("el-" + el.tohum, "portre") }}>
                      {/* seçim kutusu — sol üst */}
                      <span onClick={(e) => { e.stopPropagation(); setElSecili((s) => s.includes(el.id) ? s.filter((x) => x !== el.id) : [...s, el.id]); }}
                        className={cn("absolute left-2 top-2 flex h-[22px] w-[22px] items-center justify-center rounded-[6px] border-2 transition-all",
                          elSecili.includes(el.id) ? "border-white bg-white text-zemin opacity-100" : "border-white/80 opacity-0 group-hover/el:opacity-100")}>
                        {elSecili.includes(el.id) && <Check className="h-3.5 w-3.5" strokeWidth={3.5} />}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-2.5 py-2">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-aksan">@{el.ad}</span>
                        <span className="block text-[11px] text-metin-3">Karakter</span>
                      </span>
                      {/* Kullan + ⋮ — yalnız hover'da */}
                      <span className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover/el:opacity-100">
                        {/* GERÇEK "Kullan": elementi composer istemine @mention olarak ekler
                            + store'daki kullanım sayacını artırır (elementEkle zaten toast atar). */}
                        <span onClick={(e) => { e.stopPropagation(); elementMentionEkle(el.ad); elementKullanildi(el.id); }}
                          className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-zemin">Kullan</span>
                        <span onClick={(e) => { e.stopPropagation(); setElMenuId(elMenuId === el.id ? null : el.id); }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-metin"><MoreVertical className="h-3.5 w-3.5" /></span>
                      </span>
                    </span>
                    {/* ⋮ menüsü — 7 madde (referans birebir) */}
                    <AnimatePresence>
                      {elMenuId === el.id && (
                        <motion.span initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          onClick={(e) => e.stopPropagation()}
                          className="menu-surface absolute bottom-11 right-2 z-30 block w-[180px] rounded-xl p-1.5">
                          {([["Görüntüle", Eye], ["Sabitle", Pin], ["Düzenle", Pencil], ["Şuraya kopyala", Copy],
                             ["Paylaş", Share2], ["İndir", Download], ["Sil", Trash2]] as const).map(([ad, Ik]) => (
                            <span key={ad} onClick={() => {
                              setElMenuId(null);
                              // GERÇEK eylemler: Sil / Sabitle store'a yazar, Kullan-benzeri
                              // "Şuraya kopyala" @mention ekler; kalanlar dürüst "yakında".
                              if (ad === "Sil") { elementSil(el.id); toast.success("Element silindi"); }
                              else if (ad === "Sabitle") { elementGuncelle(el.id, { sabitli: !el.sabitli }); toast.success(el.sabitli ? "Sabitleme kaldırıldı" : "Element sabitlendi 📌", { description: "@" + el.ad }); }
                              else if (ad === "Şuraya kopyala") { elementMentionEkle(el.ad); elementKullanildi(el.id); }
                              else if (ad === "Görüntüle") { setElementDetay({ id: el.id, ad: el.ad, yazar: "Ahmet Talha Kavaklı", tur: el.tur, durum: "Aktif", kullanim: `${el.kullanim} üretim`, sonKullanim: goreliZamanKisa(el.sonKullanim), aciklama: el.aciklama, klasor: el.klasor, tohum: el.tohum, gorseller: el.gorseller }); }
                              // m54: Düzenle/Paylaş/İndir artık gerçek eylemler.
                              else if (ad === "Düzenle") { setElementDetay({ id: el.id, ad: el.ad, yazar: "Ahmet Talha Kavaklı", tur: el.tur, durum: "Aktif", kullanim: `${el.kullanim} üretim`, sonKullanim: goreliZamanKisa(el.sonKullanim), aciklama: el.aciklama, klasor: el.klasor, tohum: el.tohum, gorseller: el.gorseller }); }
                              else if (ad === "Paylaş") { void baglantiyiKopyala(`/panel/sinema?element=${encodeURIComponent(el.ad)}`, `@${el.ad} bağlantısı kopyalandı`); }
                              else if (ad === "İndir") { const g = el.gorseller?.[0]; if (g) { const a = document.createElement("a"); a.href = saltUrl(g) || g; a.download = `${el.ad}.png`; document.body.appendChild(a); a.click(); a.remove(); toast.success("Element indiriliyor"); } else toast.info("Bu elementin indirilecek görseli yok"); }
                            }}
                              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-metin transition-colors hover:bg-white/[0.07]">
                              <Ik className="h-3.5 w-3.5 shrink-0 opacity-80" /> {ad}
                            </span>
                          ))}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ElementDetayModal acik={elementDetay !== null} veri={elementDetay} onKapat={() => setElementDetay(null)} onDuzenle={() => { setElementDetay(null); toast.success("Element düzenleniyor"); }} />
          {/* GERÇEK oluşturma: modalin verdiği ad/açıklama/kategori useElements.ekle ile
              kalıcı elemente dönüşür — kart hemen ızgarada görünür (toast'ı modal atar). */}
          <YeniElementModal
            acik={yeniElementModal}
            onKapat={() => setYeniElementModal(false)}
            onKaydet={(v) => {
              const tur: ElementTur =
                v.kategori === "Karakter" ? "karakter"
                  : v.kategori === "Mekan" ? "mekan"
                  : v.kategori === "Prop" ? "obje"
                  : "karakter"; // "Oto" → karakter
              elementEkle({
                ad: v.ad.replace(/\s+/g, ""),
                tur,
                aciklama: v.aciklama.trim(),
                tohum: "el-" + v.ad.toLocaleLowerCase("tr").replace(/\s+/g, "-"),
              });
              setYeniElementModal(false);
            }}
            calismaAlani="Ahmet Talha Kavaklı"
          />
        </div>
      );
    }

    return (
      <div className="sinema-kapsam flex">
        <StudyoSidebar baslik="Sinema Stüdyosu" ikon={<Clapperboard className="h-3.5 w-3.5" />} temel="/panel/sinema" projeler={sinemaProjeler} onYeniProje={() => setYeniProjeModal(true)} onProjeIslem={projeIslem} />
        <div className="relative min-h-[calc(100vh-3rem)] flex-1 pb-40">
          {/* Higgsfield birebir: boşluksuz masonry + Filtre/Görünüm + hover araçları
              + 14 maddelik bağlam menüsü + toplu seçim çubuğu. */}
          <UretimlerGorunum
            baslik={g.baslik}
            liste={g.liste}
            favoriMi={gorunumG === "favori"}
            onAc={(u) => setLightbox({ id: u.id, baslik: u.baslik, prompt: u.prompt ?? u.baslik, gorselUrl: u.gorselUrl, tohum: u.id, kategori: "sinematik", yazar: "gothiccookie1421", tur: u.tur === "video" ? "video" : "gorsel" })}
            onSil={(id) => { silUretim(id); toast.success("Silindi"); }}
            onFavori={(id) => favoriToggle(id)}
          />
          {/* Alt yüzen composer — ana sayfadakiyle AYNI, tek farkı: normalde
              küçük, mouse üstündeyken büyür, çıkınca 3sn sonra tekrar küçülür. */}
          <KucukComposer
            /* Üstteki seçici hapları (Tür/Stil/Kamera · 3.0'da Yönetmen+Hareket+Hız)
               — ana sayfadakiyle BİREBİR aynı, composer büyüyünce belirir. */
            ustBolum={
              <>
                {/* 2.5 → Yönetmen Paneli barı (ana sayfayla birebir) */}
                {mod === "video" && model === "Sinema Stüdyo 2.5" && (
                  <div className="mb-3">
                    <YonetmenPaneli acik={direktorAcik} onAcik={setDirektorAcik}
                      durum={yonetmenDurum} onDurum={(y) => setYonetmenDurum((d) => ({ ...d, ...y }))}
                      onKarakterEkle={() => { setAssetModal(true); setAssetSekme("elementler"); }} />
                  </div>
                )}
                {/* 3.5 → Tür/Stil/Kamera · 3.0 → Yönetmen+Tür+Hareket+Hız */}
                {sinemaHaplar.length > 0 && (
                  <SinemaHaplar haplar={sinemaHaplar} secim={sinemaSecim} onSecim={setSinemaSecim}
                    onYonetmen={() => setDirektorAcik((v) => !v)} />
                )}
              </>
            }>
            <VideoComposer
              modelAd={model}
              deger={kompDeger}
              onDeger={(y) => kompGuncelle(y)}
              onModelAc={() => setModelSeciciAcik((v) => !v)}
              onPresetAc={() => setHareketModal(true)}
              onUret={uret}
              presetAd={sinemaSecim.tur ?? "GENEL"}
              presetArka={sinemaArka(`tur-${sinemaSecim.tur}`, "sinematik")}
              mod={mod}
              onKip={(m) => { kipDegis(m); toast.success(m === "gorsel" ? "Görsel modu" : "Video modu"); }}
              modelCipRef={modelCipRef}
              onMentionAc={() => setElementSeciciAcik(true)}
              elementler={mentionElementleri}
            />
            <VideoModelSecici acik={modelSeciciAcik} kapat={() => setModelSeciciAcik(false)}
              seciliModel={model} onSec={sinemaModelSec} cipRef={modelCipRef} kip={mod} />
          </KucukComposer>
        </div>
        <SinemaLightbox acik={lightbox !== null} uretim={lightbox} onKapat={() => setLightbox(null)} />
      </div>
    );
  }

  /* ══════════════════ ANA EKRAN ══════════════════ */
  /* ── MOBİL COMPOSER ──
     Referansta Sinema: istem + model + oran/çözünürlük/süre çipleri.
     Masaüstündeki sidebar+hero+yüzen composer düzeni mobilde gizli. */
  return (
    <>
    <div className="sinema-kapsam sm:hidden">
      <MobilComposerKabuk
        baslik="Sinema Üret"
        modId="sinema"
        onKapat={() => router.push("/panel")}
        altCipler={(() => {
          /* MODELE GÖRE DİNAMİK ÇİPLER — spec.cipler (videoModelSpec) birebir mobil.
             Desktop VideoComposer'daki tüm spec-güdümlü çipler burada da render edilir:
             süre/oran/çözünürlük + çok-çekim/iyileştir/sayaç/bitrate/çekim-kontrol/
             sahne-kontrol/mod/sabit-lens/oto-ayar/tür/ses. Her çip yalnız spec izin verirse. */
          const spec = specBul(model);
          const has = (c: string) => spec?.cipler.includes(c as never) ?? false;
          const sureListe = (spec?.sureler ?? [4, 5, 8, 10]).map((s) => `${s}s`);
          const oranListe = spec?.oranlar ?? ["16:9", "9:16", "1:1", "4:3", "21:9"];
          const cozListe = spec?.cozler ?? ["720p", "1080p", "4K"];
          return (
          <MobilAltCipler
            sure={has("sure") ? sure : undefined} sureSecenek={has("sure") ? sureListe : undefined} onSure={has("sure") ? setSure : undefined}
            oran={has("oran") ? oran : undefined} oranSecenek={has("oran") ? oranListe : undefined} onOran={has("oran") ? setOran : undefined}
            kalite={has("cozunurluk") ? cozunurluk : undefined} kaliteSecenek={has("cozunurluk") ? cozListe : undefined} onKalite={has("cozunurluk") ? setCozunurluk : undefined}
            adet={has("sayac") ? String(adet) : undefined} adetSecenek={has("sayac") ? Array.from({ length: spec?.adetMax ?? 4 }, (_, i) => String(i + 1)) : undefined} onAdet={has("sayac") ? (v) => setAdet(Number(v)) : undefined}
            ekstra={
              <>
                {has("ses") && (
                  <button onClick={() => setSes((v) => !v)}
                    className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition-colors",
                      ses ? "bg-aksan text-zemin" : "bg-[#2a2c2e] text-white")}>
                    🔊 Ses
                  </button>
                )}
                {has("cokCekim") && (
                  <MobilAltCip tip="kalite" deger={multishot} secenekler={["Kapalı", "Oto", "Özel"]} onSec={setMultishot} baslik="ÇOK ÇEKİMLİ" />
                )}
                {has("iyilestir") && (
                  <button onClick={() => setIyilestir((v) => !v)}
                    className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition-colors",
                      iyilestir ? "bg-aksan text-zemin" : "bg-[#2a2c2e] text-white")}>
                    ✧ İyileştir
                  </button>
                )}
                {has("bitrate") && (
                  <MobilAltCip tip="kalite" deger={bitrate} secenekler={["Yüksek", "Standart"]} onSec={setBitrate} baslik="BİT HIZI" />
                )}
                {has("cekimKontrol") && (
                  <MobilAltCip tip="kalite" deger={cekimKontrol} secenekler={["Akıllı", "Tek çekim", "Çoklu çekim"]} onSec={setCekimKontrol} baslik="ÇEKİM KONTROLÜ" />
                )}
                {has("sahneKontrol") && (
                  <MobilAltCip tip="kalite" deger={sahneKontrol} secenekler={spec?.sahneKontrolSecenek ?? ["Kapalı", "Video", "Görsel"]} onSec={setSahneKontrol} baslik="SAHNE KONTROLÜ" />
                )}
                {has("mod") && (
                  <MobilAltCip tip="kalite" deger={modKip} secenekler={spec?.modlar ?? ["Kareler", "Elementler"]} onSec={setModKip} baslik="MOD" />
                )}
                {has("sabitLens") && (
                  <button onClick={() => setSabitLens((v) => !v)}
                    className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition-colors",
                      sabitLens ? "bg-aksan text-zemin" : "bg-[#2a2c2e] text-white")}>
                    🔒 Sabit Lens
                  </button>
                )}
                {has("otoAyar") && (
                  <button onClick={() => setOtoAyar((v) => !v)}
                    className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition-colors",
                      otoAyar ? "bg-aksan text-zemin" : "bg-[#2a2c2e] text-white")}>
                    ⚙ Oto ayar
                  </button>
                )}
              </>
            }
          />
          );
        })()}
        uretButonu={<MobilUretButonu kredi={yetenek.kredi} onTikla={uret} devreDisi={!kompDeger.istem?.trim()} />}
      >
        {/* ── GÖRSEL / VİDEO MOD ANAHTARI ── */}
        <div className="flex gap-1.5 rounded-[12px] bg-yuzey-2 p-1">
          {([["gorsel", "Görsel"], ["video", "Video"]] as const).map(([id, ad]) => (
            <button key={id} onClick={() => setKompDeger({ mod: id })}
              className={cn("flex-1 rounded-[9px] py-2.5 text-[14px] font-medium transition-colors",
                (kompDeger.mod ?? "video") === id ? "bg-[#0f1113] text-white" : "text-metin-2")}>{ad}</button>
          ))}
        </div>

        <MobilIstemKutusu deger={kompDeger.istem ?? ""} onDegis={(v) => setKompDeger({ istem: v })}
          yerTutucu="Oluşturmak istediğin videoyu anlat…"
          modelAdi={model} onModelTikla={() => setModelSeciciAcik(true)}
          onElementAc={elementler.length ? () => setElementSeciciAcik(true) : undefined} />

        {/* ── PRESET + KAMERA HAREKETİ + TÜR + YÖNETMEN satırı (modele göre) ── */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setPresetModal(true)}
            className="flex items-center gap-2 rounded-full bg-yuzey-2 px-4 py-2.5 text-[14px] font-medium text-white">
            ✦ Preset
          </button>
          <button onClick={() => setHareketModal(true)}
            className="flex items-center gap-2 rounded-full bg-yuzey-2 px-4 py-2.5 text-[14px] font-medium text-white">
            🎥 Kamera {kompDeger.hareket ? `· ${kompDeger.hareket}` : ""}
          </button>
          {/* Tür — yalnız spec'inde "tur" çipi olan modellerde (Sinema 2.5) */}
          {specBul(model)?.cipler.includes("tur" as never) && (
            <MobilCip baslik="Tür" deger={tur} secenekler={["Genel", "Sinematik", "Belgesel", "Reklam", "Müzik Klibi", "Fantastik"]} onSec={setTur} />
          )}
          {/* AI Yönetmen — izgara/yonetmen düzenli modellerde (Sinema 3.0 / 2.5) */}
          {(specBul(model)?.secici === "izgara" || specBul(model)?.secici === "yonetmen") && (
            <button onClick={() => setYonetmenAcik(true)}
              className="flex items-center gap-2 rounded-full bg-yuzey-2 px-4 py-2.5 text-[14px] font-medium text-white">
              🎬 AI Yönetmen
            </button>
          )}
        </div>
      </MobilComposerKabuk>

      {/* @mention element seçici */}
      <MobilSecici acik={elementSeciciAcik} onKapat={() => setElementSeciciAcik(false)} baslik="Element ekle"
        ogeler={elementler.map((e) => ({ id: e.id, ad: e.ad, ozet: e.aciklama }))}
        onSec={(o) => { const e = elementler.find((x) => x.id === o.id); if (e) setKompDeger({ istem: `${kompDeger.istem ?? ""}${(kompDeger.istem && !kompDeger.istem.endsWith(" ")) ? " " : ""}@${e.ad} ` }); }}
        aramaYerTutucu="Element ara…" />
    </div>

    <div className="sinema-kapsam hidden sm:flex">
      {/* Gömülüyken stüdyo navigasyonu YOK — proje sayfasının kendi
          sidebar'ı var, ikincisi kafa karıştırır (2026-08-02). */}
      {!gomulu && <StudyoSidebar baslik="Sinema Stüdyosu" ikon={<Clapperboard className="h-3.5 w-3.5" />} temel="/panel/sinema" projeler={sinemaProjeler} onYeniProje={() => setYeniProjeModal(true)} onProjeIslem={projeIslem} />}

      <div className="min-h-[calc(100vh-3rem)] flex-1">
        {/* ═══ HERO CAROUSEL ═══ */}
        {/* Gömülüyken hero afişi YOK — sadece üretme paneli (2026-08-02). */}
        <div className={cn("relative -mt-px overflow-hidden", gomulu && "hidden")}>
          <AnimatePresence mode="wait">
            <motion.div key={aktifHero.tohum} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
              className="absolute inset-0" style={{ background: sinemaArka(aktifHero.tohum, aktifHero.kategori), filter: "saturate(1.15) contrast(1.05)" }} />
          </AnimatePresence>
          {/* Hafif overlay: görsel canlı kalır, yalnızca alt kısım metin için kararır */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/25 to-zemin" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-zemin via-zemin/40 to-transparent" />

          <div className="relative z-10 flex items-center justify-between gap-3 px-6 pt-6 sm:px-10">
            <div className="flex items-center gap-2">
              <span className="hf-baslik text-[19px] text-white drop-shadow sm:text-[22px]">{aktifHero.ad}</span>
              <span className="text-[13px] text-white/55">tarafından</span>
              <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[12px] font-medium text-white/90 backdrop-blur-sm">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-aksan text-[9px] font-bold text-zemin">V</span> Vayra Studio
              </span>
            </div>
            <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1.5 sm:flex">
              {HERO_FILMLER.map((_, i) => (
                <button key={i} onClick={() => setHeroIndex(i)} aria-label={`Film ${i + 1}`}
                  className={cn("h-1 rounded-full transition-all", i === heroIndex ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60")} />
              ))}
            </div>
            <div className="hidden items-center gap-4 sm:flex">
              <span className="text-[13px] text-white/60">keşfedilecek {aktifHero.uretim} üretim</span>
              <button onClick={() => setToplulukDetay(TOPLULUK_PROJELER[heroIndex % TOPLULUK_PROJELER.length])} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-zemin transition-transform hover:scale-[1.03]">
                Nasıl yapıldı? <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <button onClick={() => setHeroIndex((i) => (i - 1 + HERO_FILMLER.length) % HERO_FILMLER.length)}
            className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55" aria-label="Önceki film"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => setHeroIndex((i) => (i + 1) % HERO_FILMLER.length)}
            className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55" aria-label="Sonraki film"><ChevronRight className="h-5 w-5" /></button>

          <div className="relative z-10 flex flex-col items-center px-6 pb-2 pt-20 text-center sm:pt-28">
            <h1 className="hf-baslik text-[40px] leading-[0.98] text-white drop-shadow-lg sm:text-[64px]">HAYAL ETTİĞİN<br />HER ŞEYİ YÖNET</h1>
            <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-white/75 sm:text-[15px]">
              Bir senaryoyu dakikalar içinde sinematik sahnelere çevir. Çekimleri, karakterleri ve mekanları tek yerden yönet — sonra işini dünyaya aç.
            </p>
          </div>
        </div>

        {/* Composer bölgesi — Higgsfield'da çip satırı TEK SATIR kalmalı;
            max-w-4xl dar gelip çipleri kesiyordu. */}
        <div className="mx-auto -mt-4 max-w-[1180px] px-6">
          {/* NOT: Eski Tür/Stil/Kamera çip satırı KALDIRILDI — yerini spec-güdümlü
              <SinemaHaplar> aldı (composer'ın hemen üstünde render ediliyor). */}

          {/* ═══ YÖNETMEN PANELİ — Higgsfield "Director Panel" birebir.
              SADECE Sinema Stüdyo 2.5'te bar olarak görünür (3.0'da hap, 3.5'te yok). ═══ */}
          {mod === "video" && model === "Sinema Stüdyo 2.5" && (
            <div className="mb-3">
              <YonetmenPaneli
                acik={direktorAcik} onAcik={setDirektorAcik}
                durum={yonetmenDurum}
                onDurum={(y) => setYonetmenDurum((d) => ({ ...d, ...y }))}
                onKarakterEkle={() => { setAssetModal(true); setAssetSekme("elementler"); }}
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              SİNEMA COMPOSER — Higgsfield /generate BİREBİR (sıfırdan).
              Referans: modeller/video/cinema-studio-{2.5,3.0,3.5}
              Üstte model sürümüne göre seçici hapları, altta spec-güdümlü
              composer (çipler/kutular/kredi modelden gelir).
              ═══════════════════════════════════════════════════════════════ */}
          <div className="mt-4">
            {sinemaHaplar.length > 0 && (
              <SinemaHaplar haplar={sinemaHaplar} secim={sinemaSecim} onSecim={setSinemaSecim}
                onYonetmen={() => setDirektorAcik((v) => !v)} />
            )}
            <VideoComposer
              modelAd={model}
              deger={kompDeger}
              onDeger={(y) => kompGuncelle(y)}
              onModelAc={() => setModelSeciciAcik((v) => !v)}
              onPresetAc={() => setHareketModal(true)}
              onUret={uret}
              uretiliyor={false}
              presetAd={sinemaSecim.tur ?? "GENEL"}
              presetArka={sinemaArka(`tur-${sinemaSecim.tur}`, "sinematik")}
              mod={mod}
              onKip={(m) => { kipDegis(m); toast.success(m === "gorsel" ? "Görsel modu" : "Video modu"); }}
              modelCipRef={modelCipRef}
              onTurAc={() => setHareketModal(true)}
              onMentionAc={() => setElementSeciciAcik(true)}
              elementler={mentionElementleri}
            />
            <VideoModelSecici
              acik={modelSeciciAcik}
              kapat={() => setModelSeciciAcik(false)}
              seciliModel={model}
              onSec={sinemaModelSec}
              cipRef={modelCipRef}
              kip={mod}
            />
          </div>

          {/* ═══ PROJELERİM ═══ */}
          {/* Gömülüyken vitrin bölümleri YOK — sadece üretme paneli. */}
          <div className={cn("mt-12", gomulu && "hidden")}>
            <div className="mb-3 flex items-center justify-between">
              <button onClick={() => router.push("/panel/sinema?g=projeler")} className="flex items-center gap-1.5 text-[17px] font-semibold transition-colors hover:text-aksan">Projelerim <ChevronRight className="h-4 w-4 text-metin-3" /></button>
              <button onClick={() => router.push("/panel/sinema?g=projeler")} className="text-[13px] text-metin-2 transition-colors hover:text-metin">Tümünü gör</button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <YeniProjeKart onClick={() => setYeniProjeModal(true)} />
              {sinemaUretimleri.slice(0, 3).map((u) => <UretimKarti key={u.id} u={u} />)}
              {sinemaProjeler.slice(0, 7).map((p, i) => (
                <ProjeKart key={p.id} p={p} gecikme={i * 0.04} onAc={() => router.push(`/panel/projeler/${p.id}`)}
                  onSil={() => { projeSil(p.id); toast("Proje silindi"); }}
                  onKopyala={() => { void baglantiyiKopyala(`/panel/projeler/${p.id}`); }} />
              ))}
            </div>
          </div>

          {/* ═══ HER PROJENİN İÇİNİ KEŞFET (topluluk) ═══ */}
          <div className={cn("mt-14 pb-16", gomulu && "hidden")}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-[17px] font-semibold">Her projenin içini keşfet <ChevronRight className="h-4 w-4 text-metin-3" /></h2>
              <button onClick={() => router.push("/panel/sinema?g=topluluk")} className="text-[13px] text-metin-2 transition-colors hover:text-metin">Tümünü gör</button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TOPLULUK_PROJELER.map((p, i) => (
                <motion.button key={p.baslik} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.05 }}
                  onClick={() => setToplulukDetay(p)}
                  /* HOVER: kartın tamamı LIME panele döner, metin/ikonlar koyulaşır
                     (referans: anasayfa/ — "Open Sourced by Higgsfield" kartları). */
                  className="group/ak overflow-hidden rounded-2xl border border-kenar p-1.5 text-left transition-colors hover:border-transparent hover:bg-[var(--sn-lime,#55d6fd)]">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
                    <div className="h-full w-full transition-transform duration-500 group-hover/ak:scale-[1.04]" style={{ background: sinemaArka(p.tohum, p.kategori) }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="px-2 pb-1.5 pt-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[14px] font-semibold transition-colors group-hover/ak:text-zemin">{p.baslik}</p>
                      <span className="flex shrink-0 items-center gap-2.5 text-[12px] text-metin-3 transition-colors group-hover/ak:text-zemin/70">
                        <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {p.goruntulenme}</span>
                        <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {p.begeni}</span>
                      </span>
                    </div>
                    <span className="mt-1.5 flex items-center gap-1.5 text-[12px] text-metin-2 transition-colors group-hover/ak:text-zemin/70">
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-bold text-ink-950", p.renk)}>{p.yazar[0]}</span>
                      {p.yazar}<BadgeCheck className="h-3.5 w-3.5 text-sky-400 group-hover/ak:text-zemin" />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
            {/* Tüm projeleri keşfet — panel keşfetine gider (/kesfet landing değil, madde 50) */}
            <div className="mt-10 flex justify-center">
              <button onClick={() => router.push("/panel")}
                className="hf-cip flex items-center gap-2 rounded-xl px-6 py-3.5 text-[16px] text-metin transition-colors hover:bg-white/[0.10]">
                Tüm projeleri keşfet <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TÜR ÇARKI MODALI (Higgsfield "Genre" birebir: sol daire + sağ wheel + oklar) ═══ */}
      <CamModal acik={acikModal === "tur"} baslik="Tür" onKapat={() => setAcikModal(null)} genislik={620}>
        <TurCark secenekler={TURLER} secili={tur} onSec={(v) => setTur(v)} tohumKategori="sinematik" />
      </CamModal>

      {/* ═══ PRESET/EFEKT MODALI (Higgsfield "Presets" birebir: sekme + arama + masonry grid + Top Choice) ═══ */}
      <AnimatePresence>
        {presetModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onClick={() => setPresetModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }} onClick={(e) => e.stopPropagation()}
              className="flex max-h-[86vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-[20px] border border-white/[0.08] shadow-2xl" style={{ background: "rgba(20,20,22,0.94)", backdropFilter: "blur(24px)" }}>
              {/* Üst: sekmeler + arama + kapat */}
              <div className="flex items-center gap-2 border-b border-kenar px-5 py-3.5">
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {PRESET_SEKMELERI.map((s) => (
                    <button key={s} onClick={() => setPresetSekme(s)}
                      className={cn("hf-btn shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium", presetSekme === s ? "glass-cip-aktif text-white" : "glass-cip text-metin-2 hover:text-metin")}>{s}</button>
                  ))}
                </div>
                <div className="glass-cip flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5">
                  <Search className="h-3.5 w-3.5 text-metin-3" />
                  <input value={presetAra} onChange={(e) => setPresetAra(e.target.value)} placeholder="Preset ara…" className="w-28 bg-transparent text-[13px] outline-none placeholder:text-metin-3" />
                </div>
                <button onClick={() => setPresetModal(false)} className="hf-btn glass-cip flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
              </div>
              {/* Masonry grid */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="[column-fill:_balance] columns-2 gap-3 sm:columns-3 lg:columns-5">
                  {CINEMA_PRESETLERI
                    .filter((p) => (presetSekme === "Tümü" || p.sekmeler.includes(presetSekme)) && (!presetAra || p.ad.toLocaleLowerCase("tr").includes(presetAra.toLocaleLowerCase("tr"))))
                    .map((p, i) => (
                      <button key={p.ad} onClick={() => { setPreset(p.ad); setPresetModal(false); toast.success(`Preset: ${p.ad}`); }}
                        className={cn("hf-kart group relative mb-3 block w-full overflow-hidden", preset === p.ad && "hf-kart-secili")}
                        style={{ aspectRatio: i % 3 === 0 ? "3/4" : i % 3 === 1 ? "1/1" : "4/5" }}>
                        <span className="absolute inset-0" style={{ background: sinemaArka(p.tohum, p.kategori) }} />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        {p.top && (
                          <span className="glass-cip absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold text-aksan"><Sparkles className="h-2.5 w-2.5" /> Top Seçim</span>
                        )}
                        <span className="hf-baslik absolute bottom-2 left-2.5 right-2.5 text-left text-[13px] leading-tight text-white drop-shadow-lg">{p.ad}</span>
                        {preset === p.ad && <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-aksan text-zemin"><Check className="h-3 w-3" strokeWidth={3} /></span>}
                      </button>
                    ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ KAMERA HAREKETİ MODALI (Higgsfield "Camera movement" — 18 seçenek, 6 sütun) ═══ */}
      <CamModal acik={hareketModal} baslik="Kamera Hareketi" onKapat={() => setHareketModal(false)} genislik={880}>
        <div className="grid grid-cols-3 gap-2.5 px-5 pb-6 sm:grid-cols-4 lg:grid-cols-6">
          {KAMERA_HAREKETLERI.map((h) => (
            <button key={h} onClick={() => { setHareket(h); setHareketModal(false); }}
              className={cn("group relative aspect-[3/4] overflow-hidden rounded-xl border-2 transition-all", hareket === h ? "border-aksan" : "border-transparent hover:border-white/25")}>
              <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ background: sinemaArka("kh-" + h, "sinematik") }} />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
              <span className="absolute bottom-1.5 left-2 right-2 text-left text-[11px] font-medium text-white drop-shadow">{h}</span>
              {hareket === h && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-aksan text-zemin"><Check className="h-3 w-3" strokeWidth={3} /></span>}
            </button>
          ))}
        </div>
      </CamModal>

      {/* ═══ STİL AYARLARI MODALI (3 sütun + Manuel Stil) ═══ */}
      <CamModal acik={acikModal === "stil"} baslik="Stil Ayarları" onKapat={() => setAcikModal(null)}
        sagBaslik={<button onClick={() => setManuelStil((v) => !v)} className="flex items-center gap-1.5 rounded-full bg-yuzey-3 px-3 py-1.5 text-[12px] text-metin"><PenLine className="h-3.5 w-3.5" /> Manuel Stil · {manuelStil ? "Açık" : "Kapalı"}</button>}>
        <div className="grid grid-cols-3 gap-4">
          <CarkSutun baslik="RENK PALETİ" secenekler={STIL_SUTUN.palet} secili={stil.palet} onSec={(v) => setStil((s) => ({ ...s, palet: v }))} tohumKategori="portre" />
          <CarkSutun baslik="IŞIK" secenekler={STIL_SUTUN.isik} secili={stil.isik} onSec={(v) => setStil((s) => ({ ...s, isik: v }))} tohumKategori="sinematik" />
          <CarkSutun baslik="KAMERA HAREKET STİLİ" secenekler={STIL_SUTUN.hareket} secili={stil.hareket} onSec={(v) => setStil((s) => ({ ...s, hareket: v }))} tohumKategori="soyut" />
        </div>
      </CamModal>

      {/* ═══ KAMERA AYARLARI MODALI (4 sütun) ═══ */}
      <CamModal acik={acikModal === "kamera"} baslik="Kamera Ayarları" onKapat={() => setAcikModal(null)}>
        <div className="grid grid-cols-4 gap-3">
          <CarkSutun baslik="KAMERA" secenekler={KAMERA_SUTUN.kamera} secili={kamera.kamera} onSec={(v) => setKamera((k) => ({ ...k, kamera: v }))} />
          <CarkSutun baslik="LENS" secenekler={KAMERA_SUTUN.lens} secili={kamera.lens} onSec={(v) => setKamera((k) => ({ ...k, lens: v }))} />
          <CarkSutun baslik="ODAK UZAKLIĞI" secenekler={KAMERA_SUTUN.odak} secili={kamera.odak} onSec={(v) => setKamera((k) => ({ ...k, odak: v }))} />
          <CarkSutun baslik="DİYAFRAM" secenekler={KAMERA_SUTUN.diyafram} secili={kamera.diyafram} onSec={(v) => setKamera((k) => ({ ...k, diyafram: v }))} />
        </div>
      </CamModal>

      {/* ═══ MEDYA SEÇİCİ MODALI (5 sekme) ═══ */}
      <AnimatePresence>
        {assetModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onClick={() => setAssetModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} onClick={(e) => e.stopPropagation()}
              className="flex max-h-[82vh] w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-kenar-2 bg-[#131517] shadow-2xl">
              {/* Sekmeler */}
              <div className="flex items-center gap-1 px-5 py-3.5">
                {([["yuklemeler", "Yüklemeler"], ["elementler", "Elementler"], ["gorsel", "Görsel Üretimleri"], ["video", "Video Üretimleri"], ["begeni", "Beğenilenler"]] as const).map(([id, ad]) => (
                  <button key={id} onClick={() => setAssetSekme(id)} className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors", assetSekme === id ? "bg-white text-black" : "text-metin-2 hover:text-metin")}>{ad}</button>
                ))}
                <button onClick={() => setAssetModal(false)} className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/8 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
              </div>
              {/* İçerik — GERÇEK store üretimlerine bağlı (görsel/video/beğeni) */}
              <div className="min-h-[300px] flex-1 overflow-y-auto px-5 pb-5">
                {(() => {
                  // Sekmeye göre gerçek üretim listesi
                  const liste = assetSekme === "gorsel" ? gorselUretimleri : assetSekme === "video" ? videoUretimleri : assetSekme === "begeni" ? begeniUretimleri : [];
                  if (assetSekme === "elementler") {
                    return (
                      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                        <button onClick={() => { setAssetModal(false); router.push("/panel/gorsel"); toast("Görsel Stüdyosu'nda element oluştur", { description: "@element türet, tüm stüdyolarda kullan." }); }} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-kenar-2 text-metin-3 hover:border-aksan/50 hover:text-metin"><Plus className="h-5 w-5" /><span className="text-[10px]">Yeni Element</span></button>
                        {elementler.map((el) => (
                          <button key={el.id} onClick={() => { setPrompt((p) => (p ? p + " " : "") + "@" + el.ad); setAssetModal(false); toast.success(`@${el.ad} isteme eklendi`); }}
                            className="group relative overflow-hidden rounded-xl border border-kenar text-left transition-colors hover:border-aksan/60">
                            <span className="block aspect-square" style={{ background: onizlemeArka("el-" + el.tohum, "portre") }} />
                            <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">@{el.ad}</span>
                          </button>
                        ))}
                      </div>
                    );
                  }
                  if (liste.length === 0) {
                    return (
                      <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                        {assetSekme === "yuklemeler"
                          ? <button onClick={() => dosyaRef.current?.click()} className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-kenar-2 px-8 py-10 text-metin-3 hover:border-aksan/50 hover:text-metin"><Plus className="h-6 w-6" /><span className="text-[13px]">Medya yükle</span><span className="text-[11px] text-metin-3">Korumalı içeriğe izin verilmez</span></button>
                          : <><span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl text-white", assetSekme === "begeni" ? "bg-gradient-to-br from-rose-400 to-pink-500" : "bg-yuzey-3")}>{assetSekme === "begeni" ? <Heart className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}</span>
                            <span className="mt-3 text-[15px] font-medium">{assetSekme === "begeni" ? "Beğenilen üretimlerin burada görünecek" : assetSekme === "video" ? "Henüz video üretimin yok" : "Henüz görsel üretimin yok"}</span>
                            <span className="mt-1 text-[13px] text-metin-3">{assetSekme === "begeni" ? "Beğendiklerini işaretle, buraya kaydolsunlar." : "Ana ekrandan bir sahne üret, burada görünsün."}</span></>}
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
                      {assetSekme === "yuklemeler" && (
                        <button onClick={() => dosyaRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-kenar-2 text-metin-3 transition-colors hover:border-aksan/50 hover:text-metin"><Plus className="h-5 w-5" /><span className="text-[10px]">Medya yükle</span></button>
                      )}
                      {liste.map((u) => (
                        <button key={u.id} onClick={() => uretimReferansEkle(u.gorselUrl)}
                          className="group relative overflow-hidden rounded-xl border border-kenar transition-colors hover:border-aksan/60">
                          <span className="block aspect-square" style={{ background: u.gorselUrl }} />
                          {u.tur === "video" && <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-8 w-8 items-center justify-center rounded-full glass-ikon text-white"><Video className="h-4 w-4" /></span></span>}
                          <span className="absolute bottom-1 left-1 right-1 truncate rounded bg-black/55 px-1 py-0.5 text-center text-[9px] font-medium text-white/85 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">{u.baslik}</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ AI YÖNETMEN PANELİ ═══ */}
      <AnimatePresence>
        {yonetmenAcik && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[75] bg-black/40" onClick={() => setYonetmenAcik(false)} />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="fixed right-0 top-12 z-[76] flex h-[calc(100vh-3rem)] w-full max-w-[400px] flex-col border-l border-kenar bg-[#0f1113]">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3.5">
                <span className="flex items-center gap-2 text-[15px] font-semibold"><Clapperboard className="h-4 w-4 text-aksan" /> AI Yönetmen</span>
                <button onClick={() => setYonetmenAcik(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/8 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <p className="mb-3 text-[13px] leading-relaxed text-metin-2">Sahneni anlat; sana en uygun tür, stil ve kamera kurulumunu önereyim.</p>
                <div className="space-y-2">
                  {[
                    { ad: "Kamera kurulumu öner", ozet: "Sahneye göre kamera/lens/ışık", ik: Wand2, eylem: () => { setKamera({ kamera: "ARRI Alexa", lens: "Anamorfik", odak: "35mm", diyafram: "f/2.8" }); toast.success("Kamera kurulumu uygulandı ✦"); setYonetmenAcik(false); } },
                    { ad: "Tür + stil öner", ozet: "Prompt'a uygun tür ve ruh hali", ik: Sparkles, eylem: () => { setTur("Noir"); setStil({ palet: "Soğuk Mavi", isik: "Contre Jour", hareket: "Sessiz Makine" }); toast.success("Tür + stil uygulandı ✦"); setYonetmenAcik(false); } },
                    { ad: "Sahneyi çekim planına böl", ozet: "Prompt'a 5 çekimlik plan yaz", ik: Clapperboard, eylem: () => { setPrompt((p) => (p.trim() ? p.trim() : "Sahne") + " — Çekim 1: geniş açı kuruluş · Çekim 2: karaktere yaklaşma · Çekim 3: reaksiyon yakın çekim · Çekim 4: aksiyon takibi · Çekim 5: kapanış geniş açı"); toast.success("Sahne çekim planına ayrıştırıldı 🎬", { description: "5 çekim prompt'a eklendi" }); setYonetmenAcik(false); } },
                  ].map((a) => (
                    <button key={a.ad} onClick={a.eylem} className="flex w-full items-start gap-3 rounded-xl border border-kenar bg-yuzey-2 p-3 text-left transition-colors hover:border-aksan/40">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-aksan/12 text-aksan"><a.ik className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium">{a.ad}</span><span className="block text-[12px] text-metin-2">{a.ozet}</span></span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/8 p-3">
                <div className="flex items-center gap-2 rounded-full bg-yuzey-2 px-3 py-2">
                  <input ref={yonetmenRef} placeholder="Sahneni anlat…" onKeyDown={(e) => e.key === "Enter" && yonetmeneSor()} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-metin-3" />
                  <button onClick={yonetmeneSor} className="flex h-7 w-7 items-center justify-center rounded-full bg-aksan text-zemin transition-transform hover:scale-105" aria-label="Gönder"><ArrowUp className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ═══ TOPLULUK PROJESİ DETAY LIGHTBOX ═══ */}
      <AnimatePresence>
        {toplulukDetay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex bg-black/85 backdrop-blur-sm" onClick={() => setToplulukDetay(null)}>
            <button onClick={() => setToplulukDetay(null)} className="absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full glass-ikon text-white backdrop-blur" aria-label="Kapat"><X className="h-5 w-5" /></button>
            <div className="flex flex-1 items-center justify-center p-8" onClick={(e) => e.stopPropagation()}>
              <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-2xl" style={{ background: sinemaArka(toplulukDetay.tohum, toplulukDetay.kategori) }} />
            </div>
            <aside className="flex w-full max-w-[340px] shrink-0 flex-col border-l border-white/10 bg-[#0f1113]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2.5 border-b border-white/8 px-5 py-4">
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-[13px] font-bold text-ink-950", toplulukDetay.renk)}>{toplulukDetay.yazar[0]}</span>
                <span className="min-w-0 flex-1"><span className="flex items-center gap-1 text-[14px] font-semibold">{toplulukDetay.yazar} <BadgeCheck className="h-3.5 w-3.5 text-sky-400" /></span><span className="block text-[11px] text-metin-3">Yazar</span></span>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <h3 className="text-[17px] font-semibold">{toplulukDetay.baslik}</h3>
                <div className="mt-3 flex items-center gap-4 text-[13px] text-metin-2">
                  <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {toplulukDetay.goruntulenme}</span>
                  <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" /> {toplulukDetay.begeni}</span>
                </div>
                <div className="mt-5">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">İstem</p>
                  <p className="rounded-xl bg-yuzey-2 p-3 text-[13px] leading-relaxed text-metin-2">Sinematik {toplulukDetay.kategori} sahne, {toplulukDetay.baslik.toLowerCase()} — dramatik ışık, film grain, sığ alan derinliği.</p>
                </div>
              </div>
              <div className="border-t border-white/8 p-4">
                <button onClick={() => { setPrompt(`${toplulukDetay.baslik} tarzında sinematik ${toplulukDetay.kategori} sahne`); setToplulukDetay(null); toast.success("İstem composer'a alındı ✦"); }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-[14px] font-semibold text-black transition-transform hover:scale-[1.01]"><Wand2 className="h-4 w-4" /> Bu istemi kullan</button>
              </div>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MOTION CONTROL MODALI (Higgsfield "Copy any motion with your character") ═══ */}
      <AnimatePresence>
        {motionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onClick={() => setMotionModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }} onClick={(e) => e.stopPropagation()}
              className="flex max-h-[86vh] w-full max-w-[900px] flex-col overflow-hidden rounded-[20px] border border-white/[0.08] shadow-2xl" style={{ background: "rgba(20,20,22,0.96)", backdropFilter: "blur(24px)" }}>
              {/* Üst: başlık + hero kolaj + X */}
              <div className="flex items-start justify-between gap-4 border-b border-kenar px-6 pb-4 pt-5">
                <div className="min-w-0">
                  <h2 className="hf-baslik text-[22px] leading-tight text-white">KARAKTERİNLE<br />HERHANGİ BİR HAREKETİ KOPYALA</h2>
                  <p className="mt-2 text-[13px] text-metin-2">Herhangi bir videodan hareketi kopyala ve karakterini aynı harekete yerleştir.</p>
                </div>
                <div className="hidden shrink-0 gap-2 sm:flex">
                  {["mc-1", "mc-2", "mc-3"].map((t, i) => (
                    <span key={t} className="h-16 w-11 overflow-hidden rounded-lg border border-white/10" style={{ background: sinemaArka(t, "portre"), transform: `rotate(${(i - 1) * 8}deg)` }} />
                  ))}
                </div>
                <button onClick={() => setMotionModal(false)} className="hf-btn glass-cip flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
              </div>
              {/* Sekmeler */}
              <div className="flex items-center gap-1 px-6 pt-3">
                {([["yukle", "Yükle"], ["kutuphane", "Hareket Kütüphanesi"]] as const).map(([id, ad]) => (
                  <button key={id} onClick={() => setMotionSekme(id)} className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors", motionSekme === id ? "bg-white text-black" : "text-metin-2 hover:text-metin")}>{ad}</button>
                ))}
              </div>
              {/* İçerik */}
              <div className="flex-1 overflow-y-auto p-6">
                {motionSekme === "yukle" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <button onClick={() => { toast("Kopyalanacak hareket videosunu seç"); }} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-kenar-2 bg-yuzey-2 text-metin-3 transition-colors hover:border-aksan/50 hover:text-metin">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-yuzey-3"><Video className="h-6 w-6" /></span>
                      <span className="text-[14px] font-medium text-metin">Kopyalanacak hareketi ekle</span>
                      <span className="text-[12px] text-metin-3">Video süresi: 3-30 saniye</span>
                    </button>
                    <button onClick={() => { toast("Karakter görselini seç"); }} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-kenar-2 bg-yuzey-2 text-metin-3 transition-colors hover:border-aksan/50 hover:text-metin">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-yuzey-3"><Plus className="h-6 w-6" /></span>
                      <span className="text-[14px] font-medium text-metin">Karakterini ekle</span>
                      <span className="text-[12px] text-metin-3">Yüz ve vücut görünür bir görsel</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <button key={i} onClick={() => { setMotionModal(false); toast.success("Hareket seçildi 🎬", { description: "Karakterin bu harekete uygulanacak." }); }}
                        className="group relative aspect-[9/16] overflow-hidden rounded-xl border border-kenar transition-colors hover:border-aksan/60">
                        <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ background: sinemaArka(`mc-lib-${i}`, i % 2 ? "portre" : "sinematik") }} />
                        <span className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full glass-ikon text-white"><VolumeX className="h-3 w-3" /></span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ YENİ PROJE MODALI ═══ */}
      <YeniProjeModalHF acik={yeniProjeModal} kapat={() => setYeniProjeModal(false)} onOlustur={(ad) => { setYeniProjeAd(ad); yeniProjeOlustur(); }} />

      {/* ═══ ELEMENT SEÇİCİ (@ referans) — Higgsfield birebir popup ═══ */}
      <AnimatePresence>
        {elementSeciciAcik && (
          <ElementSeciciModal onSec={(ad) => elementMentionEkle(ad)} onKapat={() => setElementSeciciAcik(false)} />
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

/* ══════════════════ ALT BİLEŞENLER ══════════════════ */

/** Speed ramp mini eğri grafiği (Higgsfield Director Panel — mavi eğri + düğüm noktaları). */
function SpeedRampGrafik({ egri }: { egri: number[] }) {
  const n = egri.length;
  const noktalar = egri.map((v, i) => ({ x: 6 + (i / (n - 1)) * 52, y: 30 - (v / 100) * 24 }));
  const cizgi = noktalar.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <svg width="64" height="34" viewBox="0 0 64 34" className="shrink-0 rounded-lg bg-yuzey-2">
      {[0, 1, 2].map((i) => <line key={i} x1="4" x2="60" y1={6 + i * 9} y2={6 + i * 9} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}
      <path d={cizgi} fill="none" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {noktalar.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2" fill="#22d3ee" />)}
    </svg>
  );
}

/** Composer alt çubuğu açılır çip (oran/çözünürlük/süre + çok-çekim/bitrate/mod/sahne).
 *  baslik: dropdown üstü caps başlık. altMetin: seçenek altı açıklama (bitrate). vurguSecili: etikette seçili değeri lime göster. */
function CipDropdown({ acik, onToggle, etiket, ikon, secenekler, secili, onSec, baslik, altMetin, vurguSecili }: {
  acik: boolean; onToggle: () => void; etiket: string; ikon: React.ReactNode; secenekler: string[]; secili: string; onSec: (v: string) => void;
  baslik?: string; altMetin?: Record<string, string>; vurguSecili?: boolean;
}) {
  // "Etiket: Değer" biçiminde vurguSecili ise değeri lime göster
  const [pre, deger] = vurguSecili && etiket.includes(":") ? [etiket.split(":")[0] + ":", etiket.split(":").slice(1).join(":").trim()] : [etiket, ""];
  return (
    <div className="relative">
      <button onClick={onToggle} className="flex items-center gap-1.5 rounded-full bg-yuzey-3 px-2.5 py-1.5 text-[13px] text-metin transition-colors hover:bg-[#2e2e33]">
        {ikon} {vurguSecili ? <>{pre} <span className="text-aksan">{deger}</span></> : etiket} <ChevronDown className="h-3 w-3 text-metin-3" />
      </button>
      <AnimatePresence>
        {acik && (
          <>
            <div className="fixed inset-0 z-40" onClick={onToggle} />
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className={cn("menu-surface absolute bottom-10 left-0 z-50 rounded-[14px] p-1", altMetin ? "w-56" : "w-40")}>
              {baslik && <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-metin-3">{baslik}</p>}
              {secenekler.map((s) => (
                <button key={s} onClick={() => onSec(s)} className={cn("flex w-full items-start justify-between gap-2 rounded-[9px] px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-white/6", s === secili ? "text-aksan" : "text-metin")}>
                  <span className="min-w-0">
                    <span className="block">{s}</span>
                    {altMetin?.[s] && <span className="block text-[10px] text-metin-3">{altMetin[s]}</span>}
                  </span>
                  {s === secili && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/** "Yeni proje oluştur" kartı. */
function YeniProjeKart({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex aspect-video flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-white/15 transition-colors hover:border-aksan/40">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-yuzey-3"><FolderPlus className="h-5 w-5 text-metin-2" /></span>
      <span className="text-[12px] text-metin-3">Yeni proje oluştur</span>
    </button>
  );
}

/** Proje kartı — Link temelli navigasyon (kesin çalışır) + hover ⋮ menü + Özel rozeti. */
function ProjeKart({ p, gecikme, onAc, onSil, onKopyala }: {
  p: SinemaProje; gecikme: number; onAc: () => void; onSil: () => void; onKopyala: () => void;
}) {
  const [menu, setMenu] = useState(false);
  // GERÇEK eylemler — kart menüsü doğrudan store'a yazar (fake toast yok).
  const projeSabitle = useSinema((s) => s.projeSabitle);
  const projeKlasorEkle = useSinema((s) => s.projeKlasorEkle);
  const href = `/panel/projeler/${p.id}`;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gecikme }}
      className="group relative overflow-hidden rounded-[14px] border border-kenar text-left transition-colors hover:border-white/25">
      <Link href={href} className="block w-full cursor-pointer text-left">
        <div className="relative aspect-video w-full overflow-hidden">
          {(() => {
            // Gerçek çekim görseli varsa onu, yoksa apple-glass baş-harf kapağı (madde 48).
            const gorsel = p.cekimler[0]?.tohum ? saltUrl(sinemaArka(p.cekimler[0].tohum, "sinematik")) : undefined;
            const gercek = gorsel && (gorsel.startsWith("/gercek") || gorsel.startsWith("http") || gorsel.startsWith("data:"));
            if (gercek) return <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]" style={{ backgroundImage: `url("${gorsel}")` }} />;
            const harf = (p.ad?.trim()?.[0] ?? "V").toLocaleUpperCase("tr");
            return (
              <div className="flex h-full w-full items-center justify-center transition-transform duration-500 group-hover:scale-[1.03]"
                style={{ background: "radial-gradient(120% 120% at 30% 20%, rgba(85,214,253,0.22), rgba(85,214,253,0.08) 45%, rgba(20,22,24,0.95) 100%)", boxShadow: "inset 0 0 60px -20px rgba(85,214,253,0.4)" }}>
                <span className="text-5xl font-black tracking-tight text-white/90" style={{ textShadow: "0 2px 14px rgba(85,214,253,0.4)" }}>{harf}</span>
              </div>
            );
          })()}
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-zemin"><PenLine className="h-4 w-4" /></span></span>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 p-3">
        <Link href={href} className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-semibold hover:text-aksan">{p.ad}</Link>
        {p.gizlilik === "ozel" && <span className="flex shrink-0 items-center gap-1 text-[11px] text-metin-3"><span className="opacity-60">🔑</span> Özel</span>}
        <div className="relative shrink-0">
          <button onClick={() => setMenu((v) => !v)} className="flex h-7 w-7 items-center justify-center rounded-lg text-metin-3 opacity-0 transition-all hover:bg-white/8 hover:text-metin group-hover:opacity-100" aria-label="Eylemler"><MoreHorizontal className="h-4 w-4" /></button>
          <AnimatePresence>
            {menu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="menu-surface absolute bottom-full right-0 z-50 mb-1 w-44 rounded-xl p-1.5">
                  <p className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-metin-3">Eylemler</p>
                  {[
                    { ad: p.sabit ? "Sabitlemeyi kaldır" : "Sabitle", ik: Pin, fn: () => { setMenu(false); projeSabitle(p.id); toast.success(p.sabit ? "Sabitleme kaldırıldı" : "Sabitlendi 📌", { description: p.ad }); } },
                    { ad: "Düzenle", ik: Pencil, fn: () => { setMenu(false); onAc(); } },
                    { ad: "Klasör ekle", ik: FolderPlus, fn: () => { setMenu(false); projeKlasorEkle(p.id, `Klasör ${(p.klasorler?.length ?? 0) + 1}`); toast.success("Klasör eklendi 📁", { description: `${p.ad} içinde` }); } },
                    { ad: "Bağlantı kopyala", ik: Link2, fn: () => { setMenu(false); onKopyala(); } },
                  ].map((m) => <button key={m.ad} onClick={m.fn} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-metin-2 hover:bg-white/6 hover:text-metin"><m.ik className="h-3.5 w-3.5" /> {m.ad}</button>)}
                  <button onClick={() => { setMenu(false); onSil(); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-rose-400 hover:bg-rose-500/12"><Trash2 className="h-3.5 w-3.5" /> Sil</button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/** New folder / yeni proje modalı — Higgsfield "New folder" birebir. */
function YeniProjeModal({ acik, ad, setAd, renk, setRenk, onKapat, onOlustur }: {
  acik: boolean; ad: string; setAd: (v: string) => void; renk: string; setRenk: (v: string) => void; onKapat: () => void; onOlustur: () => void;
}) {
  return (
    <AnimatePresence>
      {acik && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onClick={onKapat}>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-kenar-2 bg-[#131517] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold">Yeni proje</h2>
              <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/8 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
            </div>
            <input value={ad} onChange={(e) => setAd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onOlustur()} autoFocus
              className="w-full bg-transparent text-center text-[22px] font-medium text-metin outline-none placeholder:text-metin-3" placeholder="Projem" />
            <div className="mt-6 flex items-center justify-between"><span className="text-[13px] text-metin-2">Açıklama</span><button className="flex h-6 w-6 items-center justify-center rounded-full text-metin-3 hover:text-metin"><Plus className="h-4 w-4" /></button></div>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[13px] text-metin-2">Renk</span>
              <div className="flex items-center gap-2">
                {KLASOR_RENKLERI.map((r) => (
                  <button key={r} onClick={() => setRenk(r)} aria-label={r} className={cn("h-6 w-6 rounded-full transition-transform hover:scale-110", renk === r && "ring-2 ring-white ring-offset-2 ring-offset-[#131517]")} style={{ background: r }} />
                ))}
              </div>
            </div>
            <button onClick={onOlustur} className="mt-6 w-full rounded-xl bg-yuzey-3 py-3 text-[14px] font-semibold text-metin transition-colors hover:bg-[#2e2e33]">Oluştur</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
