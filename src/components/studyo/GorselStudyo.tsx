"use client";

import { UretimYukleniyor } from "@/components/studyo/UretimYukleniyor";
import { KrediHap, KrediYildiz } from "@/components/ui/KrediHap";
import { Rozet } from "@/components/kabuk/MegaNav";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { Yuzen } from "@/components/ui/Yuzen";
import { useIstemParametresi } from "@/lib/useIstemParametresi";
import type { StudyoGomuluProps } from "@/components/studyo/tipler";

import { useState, useMemo, useRef, useEffect, useLayoutEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ChevronRight, Heart, Download, Copy, MoreHorizontal, UserRound, Package,
  Search, Check, BarChart3, Sparkles, Minus, Share2, UserSquare,
  RefreshCw, Recycle, Wand2, Palette, Maximize2, Scissors, Expand, Crop,
  X, XCircle, ChevronLeft, ChevronDown, Info, RotateCcw,
  MessageCircle, Video as VideoIcon, ImagePlus, Box, Trash2, Upload, FolderPlus,
  Sun, Pencil, Eraser, SlidersHorizontal, MousePointer2, Square, ArrowUpRight, Type, Circle, Undo2, Redo2, Layers, Gem,
  Link2, Briefcase, Pin, AtSign,
  FileImage, FileType2, FileArchive, Loader2, Lightbulb, History, Images, LayoutGrid,
  Shuffle, Dices, Ban, Lock, Columns3,
} from "lucide-react";
import { IzgaraSec } from "@/components/studyo/Cip";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { neden, uretimGeriYukle } from "@/components/studyo/bildirim";
import { kapakUrl } from "@/components/kitaplik/yardimci";
import { usePanolar } from "@/store/usePanolar";
import { HAZIR_PANOLAR_TAM } from "@/lib/panoVeri";
import { Tooltip } from "@/components/ui/Tooltip";
import { GirdiModal } from "@/components/panel/uc-boyut/GirdiModal";
import { CizimCanvas, type CizimCanvasRef } from "@/components/panel/CizimCanvas";
import { STOK_GORSELLER } from "@/lib/stok-gorseller";
import { useAuth } from "@/store/useAuth";
import { useElements, type ElementTur } from "@/store/useElements";
import { cn, saltUrl, onizlemeArka, INDIRME_FORMATLARI, gorseliFormatlaIndir, istemTemizle } from "@/lib/utils";
import { urlIndir, metinIndir, kopyala } from "@/lib/gercekEylem";
import { uretimBaslat as uretimBaslatHam, uretimIptal, uretimSirasi, uretimHataToast } from "@/lib/uretimMotoru";
import { useAktifProje } from "@/lib/useAktifProje";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { MODELLER } from "@/lib/catalog";
import { GORSEL_MODELLER, GORSEL_ORANLAR as ORANLAR, cozunurlukCarpani, type GorselModel, type ModelTip } from "@/lib/gorselModelVeri";
import { ElementKapak } from "@/components/panel/element/elementMeta";
import { KarakterModal, PanoModal, PaletModal, gorselDepola, dosyaOku, type SeciliPano, type SeciliPalet } from "@/components/studyo/gorsel/RuhModallari";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useSecim } from "@/store/useSecim";
import { useReferansKopru } from "@/store/useReferansKopru";
import { useAyarKopru } from "@/store/useAyarKopru";
import { useYorumlar } from "@/store/useYorumlar";
import { ElementMentionInput } from "@/components/panel/ElementMentionInput";
import { ElementDuzenleModal } from "@/components/panel/element/ElementDuzenleModal";
import { bekleyenElement } from "@/components/panel/element/KullanSecici";
import { ElementSeciciModal } from "@/components/panel/element/ElementSeciciModal";
import { oranSayi } from "@/components/panel/UretimKarti";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { MenuKart } from "@/components/kitaplik/Katmanlar";
import { projeyeTasi } from "@/components/kitaplik/eylemler";
import { useProje } from "@/store/useSinema";
import { GorselGoruntuleyici, type AracIstegi } from "@/components/studyo/GorselGoruntuleyici";
import { YorumSekmesi } from "@/components/studyo/YorumSekmesi";
import { InfoSekmesi } from "@/components/studyo/gorsel/GorselBilgi";
import { KartAraclari } from "@/components/studyo/gorsel/KartAraclari";
import { useEkler, aktifSinirsizlar } from "@/store/useEkler";
import { GORSEL_STILLER, stilBul, REF_ROLLERI, type RefRol } from "@/lib/gorselStiller";
import { upscaleAdresi } from "@/lib/upscaleVeri";
import { SINIRSIZ_TEKLIFLER } from "@/lib/fiyat";
import {
  MobilComposerKabuk, MobilYukleAlani, MobilIstemKutusu, MobilAltCipler, MobilAltCip, MobilAyarCekmecesi, MobilUretButonu,
  MobilSecici, type SeciciOge,
} from "@/components/panel/MobilComposer";

/**
 * Görsel Stüdyosu — Higgsfield /ai/image BİREBİR (HIGGSFIELD-SPEC.md §2.1).
 * Full-bleed justified medya ızgarası (görsel = sayfa) + yüzen alt prompt dock
 * + model seçici popover + kart hover rayı + boyut kaydırıcı.
 */

/** Geçen süre (m:ss), saniyede bir güncellenir. */
function GecenSure({ bas }: { bas: number }) {
  const [, tik] = useState(0);
  useEffect(() => { const t = setInterval(() => tik((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const sn = Math.max(0, Math.round((Date.now() - bas) / 1000));
  return <>{Math.floor(sn / 60)}:{String(sn % 60).padStart(2, "0")}</>;
}

/** Çizim katmanını (şeffaf PNG) beyaz zemin ya da altındaki görselle tek görselde birleştirir. */
async function cizimBirlestir(cizim: string, arka: string | null): Promise<string> {
  const yukle = (u: string) => new Promise<HTMLImageElement>((coz, red) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => coz(i); i.onerror = () => red(new Error("Görsel okunamadı")); i.src = u; });
  const c = await yukle(cizim);
  const o = document.createElement("canvas");
  o.width = c.naturalWidth; o.height = c.naturalHeight;
  const x = o.getContext("2d")!;
  x.fillStyle = "#fff"; x.fillRect(0, 0, o.width, o.height);
  if (arka) {
    // Tuvaldeki gibi "cover" yerleşim: çizim ile görsel aynı yere düşer.
    const a = await yukle(arka);
    const k = Math.max(o.width / a.naturalWidth, o.height / a.naturalHeight);
    const w = a.naturalWidth * k, h = a.naturalHeight * k;
    x.drawImage(a, (o.width - w) / 2, (o.height - h) / 2, w, h);
  }
  x.drawImage(c, 0, 0);
  return o.toDataURL("image/png");
}

// Aktif modelin tanımını getir (composer davranışını buradan sürer).
function modelBul(ad: string): GorselModel {
  return GORSEL_MODELLER.find((m) => m.ad === ad) ?? GORSEL_MODELLER[0];
}


// Oran şekil ikonu — Higgsfield gibi, gerçek en-boy oranını yansıtan çerçeve.
function OranIkon({ w, h, className }: { w: number; h: number; className?: string }) {
  const KUTU = 18; // ikon çizim alanı (px)
  const olcek = w >= h ? KUTU / w : KUTU / h;
  const gw = Math.max(6, Math.round(w * olcek));
  const gh = Math.max(6, Math.round(h * olcek));
  return (
    <span className={cn("flex h-[18px] w-[18px] items-center justify-center", className)} aria-hidden>
      <span
        className="rounded-[3px]"
        style={{ width: gw, height: gh, border: "2px solid #ffffff", boxShadow: "0 0 0 0.5px rgba(0,0,0,0.4)" }}
      />
    </span>
  );
}

/** Komut kutusunun büyük çipi: solda yuvarlak simge, üstte etiket, altta değer (popover'ı çağıran yönetir). */
function BCip({ ikon, etiket, deger, acik, onClick, vurgu, ok = true }: {
  ikon: React.ReactNode; etiket: string; deger: React.ReactNode; acik: boolean; onClick: () => void; vurgu?: boolean; ok?: boolean;
}) {
  return (
    <button onClick={onClick} aria-expanded={ok ? acik : undefined} title={etiket}
      className={cn("flex h-12 shrink-0 items-center gap-2.5 rounded-full pl-1.5 text-[13.5px] ring-1 ring-inset transition-[color,background-color,transform] active:scale-[0.97]", ok ? "pr-3" : "pr-4",
        acik ? "bg-white/[0.12] text-metin ring-white/20" : vurgu ? "bg-white/[0.12] text-metin ring-white/20 hover:bg-white/[0.15]" : "bg-white/[0.08] text-metin ring-transparent hover:bg-white/[0.13]")}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.1] text-white/85">{ikon}</span>
      <span className="flex max-w-[180px] flex-col items-start leading-tight"><span className="text-[11px] text-white/55">{etiket}</span><span className="max-w-full truncate whitespace-nowrap font-medium">{deger}</span></span>
      {ok && <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-metin-3 transition-transform", acik && "rotate-180")} />}
    </button>
  );
}

// Görsel ızgarası — gerçek stok görsellerinden justified feed (SSR güvenli, deterministik)
// Ana galeri feed — GERÇEK AI-üretimi çeşitli görseller (Nano Banana ile üretildi).
// 6 kategori × 12 = 72 görsel. Higgsfield örnek/topluluk galerisi birebir.
const GALERI_KATEGORILERI = ["portre", "urun", "sinematik", "soyut", "manzara", "3d"] as const;
const TUM_GORSELLER = GALERI_KATEGORILERI.flatMap((kat) =>
  Array.from({ length: 12 }, (_, i) => `/gercek/galeri/${kat}${i + 1}.webp`),
);

/** Stüdyo model adı → sınırsız erişim teklifinin model kimliği (yoksa null: bu model için sınırsız paket satılmıyor). */
function sinirsizKimligi(ad: string): string | null {
  const a = ad.toLowerCase();
  if (/nano banana pro/.test(a)) return "nano-banana-pro";
  if (/gpt image 2/.test(a)) return "gpt-image-2";
  if (/seedream 5/.test(a)) return "seedream-5";
  if (/flux\.?2/.test(a)) return "flux-2";
  return null;
}

/** "Bugün", "Dün" ya da tarih — üretim ızgarasında gün grupları. */
function gunEtiketi(t: number) {
  const g = new Date(t);
  const bugun = new Date();
  const dun = new Date(Date.now() - 86_400_000);
  if (g.toDateString() === bugun.toDateString()) return "Bugün";
  if (g.toDateString() === dun.toDateString()) return "Dün";
  return g.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: g.getFullYear() === bugun.getFullYear() ? undefined : "numeric" });
}

/** Kredi gösterimi: tam sayıysa olduğu gibi, değilse en fazla 2 ondalık. */
const krediYaz = (k: number) => (Number.isInteger(k) ? String(k) : k.toFixed(2).replace(/\.?0+$/, "").replace(".", ","));

/** Hızlı başlangıç — boş sayfada istemi, oranı ve önerilen modeli tek tıkla doldurur. */
const HIZLI_BASLANGIC: { baslik: string; etiket: string; gorsel: string; istem: string; oran: string; model: string }[] = [
  { baslik: "Ürün fotoğrafı", etiket: "E-ticaret", gorsel: "/gercek/galeri/urun1.webp", oran: "1:1", model: "Nano Banana Pro",
    istem: "Mermer bir yüzeyde duran amber renkli parfüm şişesi, yumuşak stüdyo ışığı, sığ alan derinliği, premium reklam fotoğrafı" },
  { baslik: "Editoryal portre", etiket: "Moda", gorsel: "/gercek/galeri/portre1.webp", oran: "3:4", model: "Vayra Ruh 2.0",
    istem: "Koyu arka plan önünde dramatik makyajlı bir model, yüksek yakalı siyah kıyafet, sert yan ışık, moda dergisi kapağı" },
  { baslik: "Sinematik sahne", etiket: "Film", gorsel: "/gercek/galeri/sinematik1.webp", oran: "16:9", model: "Vayra Ruh Sinema",
    istem: "Yağmurlu bir gecede neon ışıklı sokakta yürüyen yalnız bir figür, ıslak zeminde yansımalar, 35mm film karesi" },
  { baslik: "Manzara", etiket: "Doğa", gorsel: "/gercek/galeri/manzara1.webp", oran: "16:9", model: "Seedream 5.0 Pro",
    istem: "Gün doğumunda sisli dağların ardından yükselen güneş, durgun göl yüzeyinde yansıma, geniş açı, ultra detaylı" },
  { baslik: "3D karakter", etiket: "İllüstrasyon", gorsel: "/gercek/galeri/3d1.webp", oran: "1:1", model: "GPT Image 2",
    istem: "Pastel renklerde sevimli küçük bir robot, yumuşak 3D render, stüdyo ışığı, sade açık arka plan" },
  { baslik: "Soyut afiş", etiket: "Tasarım", gorsel: "/gercek/galeri/soyut1.webp", oran: "2:3", model: "Recraft V4.1",
    istem: "Akışkan mermer desenli soyut kompozisyon, canlı mor ve turkuaz tonlar, üstte 'VAYRA' yazısı, modern afiş" },
];

/* GÖMÜLÜ MOD ayrıntıları: @/components/studyo/tipler
   (2026-08-02) — /panel/projeler/[id] "Tüm varlıklar" sekmesi bu
   sayfayı `gomulu` ile mount eder ve YALNIZ composer'ı gösterir. Composer
   kopyalanmaz: burada ne varsa orada da BİREBİR o çalışır; tek kaynak.
   `onUretildi`: üretim projeye/klasöre bağlansın diye çağrılır. */
export function GorselStudyo({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
  const { aktifProjeId: seciliProjeId } = useAktifProje();
  /* Gömülüyken üretim GÖMÜLDÜĞÜ projeye yazılır — tüm `uretimBaslat`
     çağrıları zaten bu değeri kullanıyor, tek yerden yönlendirmek yeterli. */
  const aktifProjeId = gomulu && projeId ? projeId : seciliProjeId;
  /* Tek sarmalayıcı: her `uretimBaslat` çağrısını tek tek değiştirmek yerine
     burada yakalayıp gömen sayfaya haber veriyoruz (klasöre atama vb.). */
  const uretimBaslat: typeof uretimBaslatHam = (istek) => {
    const s = uretimBaslatHam(istek);
    if (s.ok && s.id) onUretildi?.(s.id);
    return s;
  };
  const { kullanici } = useAuth();
  const elementEkleStore = useElements((s) => s.ekle);
  const elementListe = useElements((s) => s.elementler);
  // Gerçek görsel üretimlerin — ızgaranın BAŞINA gelir (Higgsfield canlılık).
  // useMemo: selector'da .filter yeni referans üretip sonsuz döngü yaratır (bilinen bug).
  const tumUretimler = useProjeler((s) => s.uretimler);
  const silUretim = useProjeler((s) => s.sil);
  const favoriToggle = useProjeler((s) => s.favoriToggle);
  const tumYorumlar = useYorumlar((s) => s.yorumlar);
  const guncelle = useProjeler((s) => s.guncelle);
  // "Klasöre ekle": Kitaplık'taki projelerle aynı liste (tek klasör sistemi).
  const projeKayitlari = useProje((s) => s.projeler);
  const [topluKlasorAcik, setTopluKlasorAcik] = useState(false);
  // Çoklu seçim (Higgsfield birebir: sol-üst kutu → seçim toolbar'ı)
  const secililer = useSecim((s) => s.secililer);
  const secimToggle = useSecim((s) => s.toggle);
  const secimTemizle = useSecim((s) => s.temizle);
  const secimVar = secililer.length > 0;
  // Sayfadan ayrılınca seçimi temizle (seçim geçici UI durumu).
  useEffect(() => () => secimTemizle(), [secimTemizle]);
  const gorselUretimleri = useMemo(
    // Tanıtım (seed_) kayıtları kullanıcının üretimi değildir; "Üretimlerim"de gösterilmez.
    () => tumUretimler.filter((u) => u.tur === "gorsel" && !u.id.startsWith("seed_") && (u.durum === "tamam" || u.durum === "isleniyor" || u.durum === "kuyrukta" || u.durum === "hata")),
    [tumUretimler],
  );
  const [prompt, setPrompt] = useState("");
  useIstemParametresi(setPrompt);
  // Keşfet'teki üretim kutusundan gelen ?prompt= varsa composer'a aktar.
  useEffect(() => {
    const gelen = new URLSearchParams(window.location.search).get("prompt");
    if (gelen) setPrompt(gelen);
  }, []);
  // Akış sekmesi: kendi üretimlerin | ilham (örnek görseller). Üretimin varsa "benim" ile açılır.
  const [akis, setAkis] = useState<"benim" | "ilham">("ilham");
  const akisSecildi = useRef(false);
  useEffect(() => {
    if (akisSecildi.current) return;
    akisSecildi.current = true;
    if (gorselUretimleri.length) setAkis("benim");
  }, [gorselUretimleri.length]);
  // Akış süzgeçleri (yalnız "Üretimlerim"): istem/model araması, favoriler, model, demo gizle.
  const [akisAra, setAkisAra] = useState("");
  const [akisFavori, setAkisFavori] = useState(false);
  const [akisModel, setAkisModel] = useState<string | null>(null);
  const [demoGizle, setDemoGizle] = useState(false);
  const [akisModelAcik, setAkisModelAcik] = useState(false);
  const suzgecAktif = !!akisAra.trim() || akisFavori || !!akisModel || demoGizle;
  const suzulmus = useMemo(() => {
    const q = akisAra.trim().toLocaleLowerCase("tr");
    return gorselUretimleri.filter((u) =>
      (!q || `${u.meta?.hamIstem ?? u.prompt} ${u.baslik} ${u.model}`.toLocaleLowerCase("tr").includes(q))
      && (!akisFavori || u.favori)
      && (!akisModel || u.model === akisModel)
      && (!demoGizle || u.gercek !== false));
  }, [gorselUretimleri, akisAra, akisFavori, akisModel, demoGizle]);
  const akisModelleri = useMemo(() => [...new Set(gorselUretimleri.map((u) => u.model))], [gorselUretimleri]);
  const aktifIs = gorselUretimleri.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [istemAcik, setIstemAcik] = useState(false);
  // İstem yardımcısı (Gemini metin): "Geliştir" istemi zenginleştirip İngilizceye çevirir; tercih hatırlanır.
  const [yardimciHazir, setYardimciHazir] = useState<boolean | null>(null);
  const [gelistir, setGelistirHam] = useState(true);
  useEffect(() => {
    try { const v = localStorage.getItem("vayra-istem-gelistir"); if (v !== null) setGelistirHam(v === "1"); } catch { /* depo yok */ }
    fetch("/api/istem").then((x) => x.json()).then((j: { hazir?: boolean }) => setYardimciHazir(!!j.hazir)).catch(() => setYardimciHazir(false));
  }, []);
  const setGelistir = (v: boolean) => { setGelistirHam(v); try { localStorage.setItem("vayra-istem-gelistir", v ? "1" : "0"); } catch { /* depo yok */ } };
  const gelistirEtkin = gelistir && yardimciHazir === true;
  // Görselden istem (Describe): referans ya da seçilen dosyadan 3 öneri.
  const [tarifler, setTarifler] = useState<string[] | null>(null);
  const [tarifYukleniyor, setTarifYukleniyor] = useState(false);
  const tarifDosyaRef = useRef<HTMLInputElement>(null);
  const tarifEt = async (kaynak: string) => {
    setTarifYukleniyor(true); setTarifler(null);
    try {
      const url = await gorselDepola(kaynak);
      const j = await fetch("/api/istem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "tarif", gorselUrl: url, adet: 3 }) })
        .then((x) => x.json()) as { ok: boolean; istemler?: string[]; hata?: string };
      if (!j.ok || !j.istemler?.length) throw new Error(j.hata ?? "Öneri çıkmadı");
      setTarifler(j.istemler);
    } catch (e) {
      toast.error("Görselden istem çıkarılamadı", { description: `${neden(e, "Öneri çıkmadı.")} Başka bir görselle ya da biraz sonra yeniden dene.` });
    } finally { setTarifYukleniyor(false); }
  };
  const [surukleUstunde, setSurukleUstunde] = useState(false);
  const sinirsizlar = useEkler((s) => s.sinirsizlar);
  const [modelAcik, setModelAcik] = useState(false);
  const [model, setModel] = useState("Seedream 5.0 lite");
  // Soul (Ruh) modeli seçiliyse composer'a Karakter + Moodboard + Renk Transferi panelleri gelir.
  // Aktif modelin composer tipini sür (Higgsfield birebir: model → farklı composer).
  const aktifModelTanim = modelBul(model);
  const modelTip: ModelTip = aktifModelTanim.tip ?? "standart";
  const soulMu = Boolean(aktifModelTanim.soul); // Higgsfield Soul: + Karakter kartı
  const swapMu = modelTip === "swap";
  const yuzMu = /yüz|face/i.test(model); // Yüz Değiştir vs Karakter Değiştir metin farkı
  // Modele özel kalite seviyesi (çözünürlük yerine): Düşük/Orta/Yüksek vb.
  const [kaliteSeviye, setKaliteSeviye] = useState<string>("");
  const [kaliteSeviyeAcik, setKaliteSeviyeAcik] = useState(false);
  const kaliteSecenek = aktifModelTanim.kaliteSeviye;
  // Aktif kalite seviyesi geçerli değilse ilk seçeneğe düş.
  const aktifKalite = kaliteSecenek && kaliteSecenek.includes(kaliteSeviye) ? kaliteSeviye : (kaliteSecenek?.[0] ?? "");
  // Model seç: seçince modelin varsayılan oranını + kalite seviyesini uygula (Higgsfield birebir).
  const modelSec = (ad: string) => {
    setModel(ad);
    const t = modelBul(ad);
    // Seçili oran yeni modelde varsa korunur; yoksa modelin varsayılanına geçilir.
    setOran((o) => (t.api.oranlar.includes(o) ? o : t.varsayilanOran && t.api.oranlar.includes(t.varsayilanOran) ? t.varsayilanOran : t.api.oranlar[0] ?? o));
    setKaliteSeviye(t.kaliteSeviye?.[0] ?? "");
  };
  const [karakterModal, setKarakterModal] = useState(false);
  const [seciliKarakter, setSeciliKarakter] = useState<string | null>(null);
  const seciliKarakterEl = useElements((st) => st.elementler.find((e) => e.ad === seciliKarakter && e.tur === "karakter"));
  const [moodboardModal, setMoodboardModal] = useState(false);
  const [seciliPano, setSeciliPano] = useState<SeciliPano | null>(null);
  const [renkModal, setRenkModal] = useState(false);
  const [seciliPalet, setSeciliPalet] = useState<SeciliPalet | null>(null);
  // Gelişmiş: tohum, kaçınılacaklar, şeffaf arka plan (modelin desteklediği gerçek parametreler).
  const [gelismisAcik, setGelismisAcik] = useState(false);
  const [tohum, setTohum] = useState("");
  const [negatif, setNegatif] = useState("");
  const [seffaf, setSeffaf] = useState(false);
  // ── Modele özel composer durumları ──
  const [swapKaynak, setSwapKaynak] = useState<string | null>(null); // Your Photo (kaynak yüz/karakter)
  const [swapHedef, setSwapHedef] = useState<string | null>(null);   // Target Image (hedef görsel)
  const swapKaynakRef = useRef<HTMLInputElement>(null);
  const swapHedefRef = useRef<HTMLInputElement>(null);
  const [vektorMod, setVektorMod] = useState(false);        // Recraft: Vektör (SVG) modu
  const [kaliteMod, setKaliteMod] = useState<"Standart" | "Pro">("Standart"); // Recraft: Standart / Pro uç noktası
  const [cfg, setCfg] = useState(3.5);                      // FLUX.2 Flex: guidance_scale (1.5–10)
  const [kaliteAdim, setKaliteAdim] = useState(28);         // FLUX.2 Flex: num_inference_steps (2–50)
  const [fluxAyarAcik, setFluxAyarAcik] = useState(false);  // FLUX ayar popover
  const [cizimModal, setCizimModal] = useState(false);      // Draw → çizim modalı
  const [cizimSekme, setCizimSekme] = useState<"sketch" | "edit">("edit");
  const [cizimArka, setCizimArka] = useState<string | null>(null); // "Çizerek düzenle": üstüne çizilen görsel
  const cizimArkaRef = useRef<HTMLInputElement>(null);
  const [cizimModelAcik, setCizimModelAcik] = useState(false);  // çizim modalı model dropdown'u
  const cizimCanvasRef = useRef<CizimCanvasRef | null>(null);   // GERÇEK çizim tuvali ref'i
  // Nav mega-panelinden ?model=… ile gelindiğinde o modeli seçili başlat (Higgsfield birebir).
  const aramaParam = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const istenen = aramaParam.get("model");
    if (!istenen) return;
    const norm = (s: string) => s.toLowerCase().replace(/vayra\s*/g, "").replace(/[^a-z0-9]/g, "");
    const hedef = norm(istenen);
    const bulunan = GORSEL_MODELLER.find((m) => norm(m.ad) === hedef || norm(m.ad).includes(hedef) || hedef.includes(norm(m.ad)));
    if (bulunan) setModel(bulunan.ad);
  }, [aramaParam]);
  // ?pano=<id> | hazir:<id> — Ruh panosu sayfasından "Görsel stüdyosunda kullan". Pano stil referansı
  // Ruh modellerinde gider; seçili model Ruh değilse Vayra Ruh 2.0'a geçilir.
  useEffect(() => {
    const p = aramaParam.get("pano");
    if (!p) return;
    const h = p.startsWith("hazir:") ? HAZIR_PANOLAR_TAM.find((x) => x.id === p.slice(6)) : undefined;
    const k = h ? null : usePanolar.getState().panolar.find((x) => x.id === p);
    const sec = h ? { ad: h.ad, gorseller: h.gorseller } : k ? { ad: k.ad, gorseller: k.gorseller, kullanici: true, tarif: k.tarif, kacin: k.kacin, guc: k.guc, renkler: k.paletGonder ? k.renkler : undefined } : null;
    if (!sec) return;
    setSeciliPano(sec);
    if (!GORSEL_MODELLER.find((m) => m.ad === model)?.soul) setModel("Vayra Ruh 2.0");
    toast.success(`“${sec.ad}” panosu seçildi`, { description: "Üretimlerinde ışık, renk ve doku olarak uygulanır." });
  }, [aramaParam]); // eslint-disable-line react-hooks/exhaustive-deps
  const [modelAra, setModelAra] = useState("");
  const [oran, setOran] = useState("1:1");
  const [oranAcik, setOranAcik] = useState(false);
  const [cozunurlukSecim, setCozunurluk] = useState("2K");
  const [cozunurlukAcik, setCozunurlukAcik] = useState(false);
  // Modelin gerçekten desteklediği kademeler; seçim desteklenmiyorsa en yakın kademe kullanılır.
  const COZUNURLUKLER = aktifModelTanim.api.cozunurluklar;
  const cozunurluk = COZUNURLUKLER.includes(cozunurlukSecim) ? cozunurlukSecim
    : COZUNURLUKLER.find((c) => c === "2K") ?? COZUNURLUKLER[COZUNURLUKLER.length - 1] ?? cozunurlukSecim;
  const modelOranlari = ORANLAR.filter((o) => aktifModelTanim.api.oranlar.includes(o.deger));
  const [adet, setAdet] = useState(1);
  const [mobilModelAcik, setMobilModelAcik] = useState(false);
  const [elementSeciciAcik, setElementSeciciAcik] = useState(false);
  const [sinirsiz, setSinirsiz] = useState(false);
  const [boyut, setBoyut] = useState(30);        // ızgaraya uygulanan (yalnız bırakınca)
  const [boyutGorsel, setBoyutGorsel] = useState(30); // slider thumb'ı (anlık)
  // Sürüklerken ızgarayı yeniden düzenleme (kasma) YAPMA; sadece bırakınca uygula.
  const boyutuKomite = () => { setBoyut(boyutGorsel); };
  const [hover, setHover] = useState<string | null>(null);
  const [begeni, setBegeni] = useState<string[]>([]);
  const [menu, setMenu] = useState<string | null>(null);

  // ── Varlık görüntüleyici (lightbox) ──
  const [seciliKart, setSeciliKart] = useState<string | null>(null); // görsel URL | null
  const [yorum, setYorum] = useState("");
  // Referans görsel (composer + butonuyla yüklenir; üretimde prompt'a not düşer)
  const [referanslar, setReferanslar] = useState<{ ad: string; url: string; rol?: RefRol; depo?: string }[]>([]);
  const [rolMenu, setRolMenu] = useState<number | null>(null);
  // Referansın üzerine gelince büyük önizleme (element çipiyle aynı davranış).
  const [refHover, setRefHover] = useState<{ i: number; r: DOMRect } | null>(null);
  // Stil ön ayarı (gerçek örnek kapaklı): sağlayıcıya "Visual style" yönergesi olarak gider.
  const [stilId, setStilId] = useState<string | null>(null);
  const [stilAcik, setStilAcik] = useState(false);
  const seciliStil = stilBul(stilId);
  // Birden çok modelle karşılaştır: aynı istem seçilen her modelde ayrı üretilir (en fazla 4).
  const [cokluModel, setCokluModel] = useState<string[]>([]);
  const karsilastir = cokluModel.length > 0;
  // Son kullanılan modeller (model menüsünün başında).
  const [sonModeller, setSonModeller] = useState<string[]>([]);
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem("vayra-gorsel-son-model") || "[]"); if (Array.isArray(v)) setSonModeller(v.slice(0, 4)); } catch { /* depo yok */ } }, []);
  const sonModelYaz = (adlar: string[]) => setSonModeller((v) => { const y = [...adlar, ...v.filter((x) => !adlar.includes(x))].slice(0, 4); try { localStorage.setItem("vayra-gorsel-son-model", JSON.stringify(y)); } catch { /* depo yok */ } return y; });
  // m54: stok galeriden gizlenen görseller (kullanıcı "Sil" der demez galeriden çıkar).
  const [gizliStok, setGizliStok] = useState<string[]>([]);
  const [medyaOnizle, setMedyaOnizle] = useState<string | null>(null); // referans tam-ekran önizleme (madde 11)
  // Prompt kutusu elle-yükseklik (dock TEPESİNDEKİ tutamaktan sürüklenir).
  // null = otomatik büyüme. Tutamak dock'un en üstünde sabit durur.
  const [promptYuk, setPromptYuk] = useState<number | null>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const promptSurukle = (e: React.PointerEvent) => {
    e.preventDefault();
    const ta = promptRef.current;
    const baslaY = e.clientY;
    const baslaH = ta ? ta.getBoundingClientRect().height : (promptYuk ?? 48);
    /* Sürüklerken React durumu GÜNCELLENMEZ (her harekette 2400 satırlık bileşen yeniden
       çiziliyor, kasıyordu): yükseklik karede bir doğrudan textarea'ya yazılır, bırakınca kaydedilir. */
    let son = baslaH, kare = 0;
    if (ta) { ta.style.overflowY = "auto"; ta.style.transition = "none"; }
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
    const tasi = (ev: PointerEvent) => {
      son = Math.max(48, Math.min(340, baslaH + (baslaY - ev.clientY)));
      if (kare) return;
      kare = requestAnimationFrame(() => { kare = 0; if (ta) ta.style.height = `${son}px`; });
    };
    const birak = () => {
      window.removeEventListener("pointermove", tasi); window.removeEventListener("pointerup", birak); window.removeEventListener("pointercancel", birak);
      if (kare) cancelAnimationFrame(kare);
      document.body.style.cursor = ""; document.body.style.userSelect = "";
      if (ta) ta.style.height = `${son}px`;
      setPromptYuk(Math.round(son));
    };
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
    window.addEventListener("pointercancel", birak);
  };
  const medyaRef = useRef<HTMLInputElement>(null);
  /** Composer'ın tutabileceği referans sayısı; modele giden kısım modelin kendi sınırıdır (refMax). */
  const REF_UST = 14;
  const referansYukle = (dosyalar: FileList | null) => {
    if (!dosyalar?.length) return;
    const gorseller = Array.from(dosyalar).filter((d) => d.type.startsWith("image/"));
    if (!gorseller.length) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    gorseller.slice(0, REF_UST).forEach((d) => {
      const okuyucu = new FileReader();
      okuyucu.onload = () => setReferanslar((v) => [...v, { ad: d.name, url: String(okuyucu.result) }].slice(0, REF_UST));
      okuyucu.readAsDataURL(d);
    });
    toast.success(gorseller.length > 1 ? `${Math.min(gorseller.length, REF_UST)} referans eklendi` : "Referans eklendi", { description: "Sonraki üretim bu görselleri referans alacak." });
  };

  // Swap modelleri için tek görsel yükleyici (kaynak/hedef kutuları).
  const swapYukle = (dosyalar: FileList | null, hedef: "kaynak" | "hedef") => {
    const d = dosyalar?.[0];
    if (!d) return;
    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      const url = String(okuyucu.result);
      if (hedef === "kaynak") setSwapKaynak(url); else setSwapHedef(url);
    };
    okuyucu.readAsDataURL(d);
  };

  // Üretilen görseli composer'a referans olarak ekle (Higgsfield birebir).
  // gorselUrl CSS gradient/url() olabilir → saltUrl ile ham görsel adresini çıkar (boş kutu bug fix).
  const referansEkle = (ham: string) => {
    const url = saltUrl(ham) ?? ham;
    if (!/^(data:|https?:|\/)/.test(url)) { toast.error("Referans eklenemedi", { description: "Bu görselin dosyası yok, yalnız örnek önizleme. Gerçek bir görsel seç." }); return; }
    if (referanslar.some((r) => r.url === url)) { toast.info("Bu görsel zaten referansta"); return; }
    setReferanslar((v) => (v.some((r) => r.url === url) ? v : [...v, { ad: "Üretilen görsel", url }].slice(0, REF_UST)));
    toast.success("Referans eklendi", { description: "Sonraki üretim bu görseli referans alacak." });
  };

  // m7/m13: referans köprüsünü dinle — UretimDetay "Referans" dediğinde (aynı sayfa
  // veya başka türden yönlendirilerek gelindiğinde) görseli composer'a GERÇEKTEN ekle.
  const refIstek = useReferansKopru((s) => s.istek);
  const refTuket = useReferansKopru((s) => s.tuket);
  useEffect(() => {
    if (!refIstek) return;
    // Görsel referansı: url varsa doğrudan referans listesine ekle.
    if (refIstek.url && /^(data:|https?:|\/)/.test(refIstek.url)) {
      setReferanslar((v) => {
        if (v.some((r) => r.url === refIstek.url)) return v;
        return [...v, { ad: refIstek.baslik || "Referans", url: refIstek.url }].slice(0, REF_UST);
      });
      toast.success("Referans eklendi", { description: "Sonraki üretim bu görseli referans alacak." });
    } else if (refIstek.prompt) {
      // görsel yoksa prompt'u composer'a taşı
      setPrompt((p) => (p ? p : refIstek.prompt));
      toast.success("Referans istem eklendi", refIstek.baslik ? { description: `“${refIstek.baslik}” isteme yazıldı.` } : undefined);
    }
    refTuket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refIstek]);

  /* AYAR GERİ YÜKLEME — detay panelindeki "Bu ayarlarla üret" düğmesini dinler.
     Üretimin gerçekten kullandığı model/oran/çözünürlük/prompt/referans
     composer'a birebir uygulanır (kullanıcı kararı 2026-07-31). */
  const ayarIstek = useAyarKopru((s) => s.istek);
  const ayarTuket = useAyarKopru((s) => s.tuket);
  useEffect(() => {
    if (!ayarIstek || ayarIstek.tur !== "gorsel") return;
    if (ayarIstek.prompt) setPrompt(ayarIstek.prompt);
    // Model/oran/çözünürlük yalnızca bu sayfanın tanıdığı bir değerse uygulanır;
    // tanımadığı bir değeri set etmek seçiciyi boş gösterirdi.
    if (ayarIstek.model) setModel(ayarIstek.model);
    if (ayarIstek.oran) setOran(ayarIstek.oran);
    if (ayarIstek.cozunurluk) setCozunurluk(ayarIstek.cozunurluk);
    if (ayarIstek.referanslar?.length) {
      setReferanslar((v) => {
        const yeni = [...v];
        for (const r of ayarIstek.referanslar!) {
          if (!yeni.some((x) => x.url === r.url)) yeni.push(r);
        }
        return yeni.slice(0, REF_UST);
      });
    }
    ayarTuket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayarIstek]);

  /* Kart menüsü "Klasöre ekle" alt-menüsü için GERÇEK klasör listesi (madde 1).
     Adet bilgisi kullanıcıya hangi klasörün dolu olduğunu gösterir. */
  const klasorListesi = useMemo(() => {
    const tum = useProjeler.getState().uretimler;
    return projeKayitlari.filter((p) => !p.klasor)
      .map((p) => { const set = new Set(p.uretimIdler); return { id: p.id, ad: p.ad, adet: tum.filter((u) => u.projeId === p.id || set.has(u.id)).length, g: p.guncelleme ?? 0 }; })
      .sort((a, b) => b.g - a.g)
      .map(({ id, ad, adet }) => ({ id, ad, adet }));
  }, [projeKayitlari]);
  /** Üretimleri seçilen klasöre (Kitaplık projesine) ekler. */
  const klasoreEkle = (klasorId: string, uretimId: string | string[]) => projeyeTasi(Array.isArray(uretimId) ? uretimId : [uretimId], klasorId);
  /* Yeni klasör — GERÇEK isim sorma ekranı (kullanıcı kararı 2026-07-31).
     Önce "Klasör 3" gibi otomatik ad veriyordu; kullanıcı adı belirleyemiyordu.
     Artık GirdiModal açılır, ad girilir, klasör kurulup varlık içine eklenir. */
  const [yeniKlasorIcin, setYeniKlasorIcin] = useState<string | null>(null);
  const yeniKlasoreEkle = (uretimId: string) => setYeniKlasorIcin(uretimId);
  const yeniKlasorKaydet = (ad: string) => {
    const temiz = ad.trim();
    const hedef = yeniKlasorIcin;
    setYeniKlasorIcin(null);
    if (!temiz || !hedef) return;
    const kid = useProje.getState().projeOlustur(temiz, "Genel", { kaynakStudyo: "Görsel" });
    projeyeTasi(hedef.split(","), kid);
    toast.success(`${temiz} klasörü oluşturuldu`, { description: "Görsel bu klasöre eklendi." });
  };

  /* "Yeniden kullan" — bir ÜRETİMİ composer'a geri yükler (2026-08-02).
     Kullanıcı: "kopyaladığımızda 'AI Stilist · Editorial · 1:1 · 1 adet'
     olarak prompt kutusuna ekliyor, bu yanlış — sadece promptu yazacak,
     diğerlerini AYAR olarak seçecek."

     Kök neden: kart menüsündeki kopyalama, `u.prompt`u ham hâliyle yazıyordu;
     o alan ise üretim sırasında eklenen ayar notlarını (" · 1:1", " · 4K"…)
     taşıyor. Doğrusu: metin olarak yalnız kullanıcının YAZDIĞI istem
     (`hamIstem`, eski kayıtlarda `istemTemizle` ile ayıklanır); model/oran/
     çözünürlük ise gerçek seçici durumlarına yazılır. */
  const uretimiGeriYukle = (u?: { prompt?: string; baslik?: string; model?: string; meta?: Record<string, unknown> } | null) => {
    if (!u) return;
    const p = (u.meta?.hamIstem as string | undefined) ?? istemTemizle(u.prompt || u.baslik || "");
    if (p) setPrompt(p);
    if (u.model) setModel(u.model);
    const o = u.meta?.oran as string | undefined;
    const c = u.meta?.cozunurluk as string | undefined;
    if (o) setOran(o);
    if (c) setCozunurluk(c);
    toast.success("Ayarlar yüklendi", {
      description: `${[u.model, c, o].filter(Boolean).join(" · ") || "İstem"} komut kutusuna yazıldı.`,
    });
  };

  /* "Bu ayarlarla üret" — açık üretimin GERÇEKTEN kullandığı her şeyi
     composer'a yükler ve lightbox'ı kapatır. Bu sayfanın kendi state'ine
     doğrudan yazar (köprüye gerek yok — aynı bileşen ağacındayız). */
  const ayarlariComposeraYukle = () => {
    const u = acikUretim;
    /* ÖNCE hamIstem: `prompt` alanında ayar notları var (" · 4K" gibi) ve
       onu yazmak her geri yüklemede metni şişiriyordu. Eski kayıtlarda
       hamIstem yoksa notları söküp temizleyerek düşeriz. */
    const p = u?.meta?.hamIstem ?? istemTemizle(u?.prompt || acikPrompt);
    if (p) setPrompt(p);
    const mt = u?.meta;
    if (u?.model && GORSEL_MODELLER.some((x) => x.ad === u.model)) setModel(u.model);
    if (mt?.oran) setOran(mt.oran);
    if (mt?.cozunurluk) setCozunurluk(mt.cozunurluk);
    if (mt?.kalite) { setKaliteSeviye(mt.kalite); if (mt.kalite === "Pro" || mt.kalite === "Standart") setKaliteMod(mt.kalite); }
    setNegatif(mt?.negatif ?? "");
    setTohum(Number.isInteger(mt?.tohum) ? String(mt!.tohum) : "");
    setSeffaf(!!mt?.seffaf);
    // Özgün referanslar geri gelir (çıktının kendisi değil — bu "yeniden üret", varyasyon değil).
    setReferanslar((mt?.referanslar ?? []).slice(0, 14).map((url, i) => ({ ad: `Referans ${i + 1}`, url })));

    toast.success("Ayarlar yüklendi", {
      description: `${[u?.model ?? model, u?.meta?.cozunurluk, u?.meta?.oran].filter(Boolean).join(" · ") || "İstem"} komut kutusuna yazıldı.`,
    });
    lightboxKapat();
  };

  // "Animate" → görseli video stüdyosuna başlangıç karesi olarak taşı ve yönlendir.
  const animasyonaGec = (url: string) => {
    // Demo üretimlerde adres CSS arka planı biçiminde saklanır; stüdyoya ham görsel adresi gider.
    if (typeof window !== "undefined") sessionStorage.setItem("vayra-animate-ref", saltUrl(url) ?? url);
    toast.success("Video stüdyosuna aktarılıyor", { description: "Görsel başlangıç karesi olarak eklenecek." });
    router.push("/panel/video");
  };

  // "3D sahne oluştur" → görseli 3D stüdyosuna referans olarak taşı ve yönlendir.
  const sahne3dOlustur = (url: string) => {
    if (typeof window !== "undefined") sessionStorage.setItem("vayra-3d-ref", saltUrl(url) ?? url);
    toast.success("3D stüdyosuna aktarılıyor", { description: "Görsel, Görselden 3D için girdi olarak eklenecek." });
    router.push("/panel/3d");
  };

  // Element seçici popup (Higgsfield "Elements" — @ referansı). Seçilen elementi prompt'a ekler.
  const [elementSeciciModal, setElementSeciciModal] = useState(false);
  const elementEkle = (ad: string) => {
    setPrompt((p) => `${p}${p && !p.endsWith(" ") ? " " : ""}@${ad} `);
    setElementSeciciModal(false);
    toast.success(`@${ad} eklendi`, { description: "İstemine element olarak bağlandı." });
  };
  // Yeni Element modalı
  // Yeni element: ortak düzenleyici (üretimden açılınca görsel + istem ön-dolu gelir).
  const [elementTohum, setElementTohum] = useState<{ gorsel?: string; aciklama?: string; ad?: string; tur?: "karakter" } | null>(null);
  const elementModal = elementTohum !== null;
  const setElementModal = (a: boolean) => setElementTohum(a ? {} : null);

  /* Element Stüdyosu'ndan "Kullan" ile gelen element — composer'a ekle.
     Eskiden o buton yalnız sayaç artırıp toast gösteriyordu; kullanıcı
     elementi hiçbir yerde kullanamıyordu (bildirilen hata). Artık element
     sayfası sessionStorage'a yazıp buraya yönlendiriyor, burada tüketiliyor. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ad = bekleyenElement("gorsel");
    if (!ad) return;
    setPrompt((p) => `${p}${p && !p.endsWith(" ") ? " " : ""}@${ad} `);
    toast.success(`@${ad} eklendi`, { description: "İstemine element olarak bağlandı." });
  }, []);

  // Model → kredi. Önce GORSEL_MODELLER kataloğu (kredi alanı), sonra MODELLER, sonra lite kuralı.
  const modelKredi = (ad: string): number => {
    const g = GORSEL_MODELLER.find((x) => x.ad === ad);
    if (g?.kredi != null) return g.kredi;
    const m = MODELLER.find((x) => x.ad === ad);
    if (m) return m.kredi;
    if (/lite/i.test(ad)) return 1; // Seedream 5.0 lite = 1 kredi (Higgsfield birebir)
    return 4;
  };

  // Sağlayıcı bağlantısı: bağlı değilse model "Demo" olarak işaretlenir (kredi düşmez, örnek görsel).
  const saglayicilar = useSaglayicilar();
  const modelBagli = (m: GorselModel) => !saglayicilar ? true
    : m.ad === "Auto" ? ["gemini", "seedream", "openai", "fal"].some((k) => saglayicilar[k]) : !!saglayicilar[m.api.saglayici];
  const hicSaglayiciYok = !!saglayicilar && !["gemini", "seedream", "openai", "fal"].some((k) => saglayicilar[k]);
  const modelListe = GORSEL_MODELLER.filter((m) => !m.gizli && m.ad.toLocaleLowerCase("tr").includes(modelAra.toLocaleLowerCase("tr")));
  // Sınırsız: yalnız bu model için satılan bir paket varsa gösterilir; açılabilmesi için aktif erişim gerekir.
  const sinirsizKimlik = sinirsizKimligi(model);
  const sinirsizSatiliyor = !!sinirsizKimlik && SINIRSIZ_TEKLIFLER.some((t) => t.model === sinirsizKimlik);
  const sinirsizAktif = !!sinirsizKimlik && aktifSinirsizlar(sinirsizlar).some((x) => x.model === sinirsizKimlik);
  const sinirsizGecerli = sinirsiz && sinirsizAktif;
  useEffect(() => { if (!sinirsizAktif) setSinirsiz(false); }, [sinirsizAktif]);
  const sinirsizDegistir = () => {
    if (!sinirsizAktif) {
      toast.info(`${model} için sınırsız erişimin yok`, { description: "Sınırsız erişim alırsan bu modelde kredi harcamadan üretirsin. Seçenekler açılıyor." });
      router.push("/panel/kredi?sekme=sinirsiz");
      return;
    }
    setSinirsiz((v) => !v);
  };
  // Son istemler — istem fikirleri menüsü (kendi üretimlerinden, tekrarsız).
  const sonIstemler = useMemo(() => {
    const goruldu = new Set<string>();
    const l: string[] = [];
    for (const u of gorselUretimleri) {
      const p = ((u.meta?.hamIstem as string | undefined) ?? "").trim();
      if (p.length < 3 || goruldu.has(p)) continue;
      goruldu.add(p); l.push(p);
      if (l.length >= 6) break;
    }
    return l;
  }, [gorselUretimleri]);
  const cizimModelTanim = aktifModelTanim;
  const cizimKredi = !modelBagli(aktifModelTanim) ? 0 : modelKredi(model);
  const birimKredi = modelKredi(model) * (aktifModelTanim.cozunurluk ? cozunurlukCarpani(cozunurluk) : 1);
  const demoModu = !modelBagli(aktifModelTanim);
  /** Bir modelin seçili ayarlarla görsel başına bedeli (karşılaştırmada her model ayrı hesaplanır). */
  const modelBirim = (ad: string) => {
    const t = modelBul(ad);
    if (!modelBagli(t)) return 0;
    if (ad === model) return sinirsizGecerli ? 0 : birimKredi;
    const c = t.api.cozunurluklar.includes(cozunurluk) ? cozunurluk : t.api.cozunurluklar.find((x) => x === "2K") ?? t.api.cozunurluklar[t.api.cozunurluklar.length - 1];
    return modelKredi(ad) * (t.cozunurluk && c ? cozunurlukCarpani(c) : 1);
  };
  const toplamKredi = karsilastir
    ? cokluModel.reduce((t, ad) => t + modelBirim(ad) * (modelBul(ad).adetGizli ? 1 : adet), 0)
    : sinirsizGecerli || demoModu ? 0 : birimKredi * (aktifModelTanim.adetGizli ? 1 : adet);
  const karsilastirAday = (m: GorselModel) => m.tip !== "swap" && !m.api.refZorunlu && m.ad !== "Auto";

  // Lightbox/modal açıkken arka plan sayfası SABİT kalır (madde 10).
  useScrollKilit(seciliKart !== null || elementModal || medyaOnizle !== null || karakterModal || moodboardModal || renkModal || cizimModal);
  // Escape: en üstteki katmanı kapat (Soul modalları → medya önizleme → element → lightbox).
  useEscKapat(seciliKart !== null || elementModal || medyaOnizle !== null || karakterModal || moodboardModal || renkModal || cizimModal, () => {
    if (cizimModal) setCizimModal(false);
    else if (renkModal) setRenkModal(false);
    else if (moodboardModal) setMoodboardModal(false);
    else if (karakterModal) setKarakterModal(false);
    else if (medyaOnizle !== null) setMedyaOnizle(null);
    else if (elementModal) setElementModal(false);
    // Görüntüleyici Esc'yi kendisi yönetir (önce açık aracı, sonra kendini kapatır).
  });
  // Escape: açık composer dropdown'larını da kapat (Higgsfield birebir).
  useEscKapat(modelAcik || oranAcik || cozunurlukAcik, () => {
    setModelAcik(false); setOranAcik(false); setCozunurlukAcik(false);
  });

  // Lightbox aç
  const lightboxAc = (url: string) => { setSeciliKart(url); };
  const lightboxKapat = () => { setSeciliKart(null); };

  // seciliKart'ın TUM_GORSELLER içindeki konumu (ileri/geri navigasyon için). Üretilen/harici görselde -1.
  const kendiUrller = useMemo(() => gorselUretimleri.filter((u) => u.durum === "tamam" && u.gorselUrl).map((u) => u.gorselUrl!), [gorselUretimleri]);
  const gezListe = seciliKart && kendiUrller.includes(seciliKart) ? kendiUrller : TUM_GORSELLER.filter((u, i) => !gizliStok.includes(u + i));
  const lbIndex = seciliKart ? gezListe.indexOf(seciliKart) : -1;

  /* Açık görselin KENDİ kayıtlı üretimi.
     Lightbox'a eskiden composer'ın CANLI `prompt` state'i veriliyordu; bu
     yüzden "yeşil elma" üretip composer'a "armut" yazınca, elmanın
     detayında "armut" görünüyordu (bildirilen hata). Artık üretim kaydından
     okunur; kayıt yoksa (stok galeri görseli) alan boş bırakılır —
     composer metnini göstermek her hâlükârda yanlış bilgi olur. */
  const acikUretim = useMemo(() => {
    if (!seciliKart) return undefined;
    const hedef = saltUrl(seciliKart) ?? seciliKart;
    return tumUretimler.find((u) => {
      const g = saltUrl(u.gorselUrl) ?? u.gorselUrl;
      const t = saltUrl(u.thumbnailUrl) ?? u.thumbnailUrl;
      return g === hedef || t === hedef;
    });
  }, [seciliKart, tumUretimler]);
  /** Lightbox'ta gösterilecek prompt — üretimin kendi metni. */
  const acikPrompt = acikUretim?.prompt ?? "";

  /* GÖRSEL ADI (madde 3) — lightbox başlığında düzenlenir, indirme dosya adı
     olarak kullanılır. Üretim kaydı varsa onun `baslik` alanına yazılır
     (kalıcı); stok görselde oturum içi ad tutulur. */
  const [adDuzenleniyor, setAdDuzenleniyor] = useState(false);
  const [adTaslak, setAdTaslak] = useState("");
  const [stokAdlari, setStokAdlari] = useState<Record<string, string>>({});
  const gorselAdi = useMemo(() => {
    if (acikUretim?.baslik) return acikUretim.baslik;
    if (seciliKart && stokAdlari[seciliKart]) return stokAdlari[seciliKart];
    return acikUretim ? "İsimsiz görsel" : "Örnek görsel";
  }, [acikUretim, seciliKart, stokAdlari]);
  const adKaydet = () => {
    const yeni = adTaslak.trim();
    setAdDuzenleniyor(false);
    if (!yeni || yeni === gorselAdi) return;
    if (acikUretim) guncelle(acikUretim.id, { baslik: yeni });
    else if (seciliKart) setStokAdlari((v) => ({ ...v, [seciliKart]: yeni }));
    toast.success("Ad değiştirildi", { description: `${yeni}.png olarak inecek.` });
  };

  const adDegistir = (yeni: string) => {
    if (acikUretim) guncelle(acikUretim.id, { baslik: yeni });
    else if (seciliKart) setStokAdlari((v) => ({ ...v, [seciliKart]: yeni }));
    toast.success("Ad değiştirildi", { description: `${yeni}.png olarak inecek.` });
  };
  /** Görüntüleyicideki yapay zekâ araçları: kaynak görsel + seçilen ayarlarla yeni üretim. */
  const aracCalistir = (i: AracIstegi, dis?: { url: string; u?: Uretim }): boolean => {
    const ham = dis?.url ?? seciliKart;
    if (!ham) return false;
    const kaynakUretim = dis ? dis.u : acikUretim;
    const kaynak = saltUrl(ham) ?? ham;
    const kaynakId = kaynakUretim?.id;
    const oranHedef = i.oran ?? (kaynakUretim?.meta?.oran as string | undefined);
    // Kaynak görsel ve maske sağlayıcıya GİDER (eskiden yalnız metin gidiyordu → ilgisiz yeni görsel).
    void (async () => {
      let maskeUrl: string | undefined;
      let kaynakUrl = kaynak;
      try {
        if (kaynak.startsWith("data:")) kaynakUrl = await gorselDepola(kaynak);
        if (i.maske) maskeUrl = await gorselDepola(i.maske);
      } catch (e) {
        return void toast.error(`${i.arac} başlatılamadı`, { description: `${neden(e, "Görsel yüklenemedi.")} Yeniden dene.` });
      }
      const sonuc = uretimBaslat({
        // Hiç görsel sağlayıcısı bağlı değilse araç demo çalışır ve kredi almaz.
        baslik: i.baslik, tur: "gorsel", model: i.arac, prompt: i.not, kredi: hicSaglayiciYok ? 0 : i.kredi, arac: i.arac,
        projeId: aktifProjeId ?? undefined,
        meta: { islem: i.islem, oran: oranHedef, gorselUrl: kaynakUrl, ...(maskeUrl ? { maskeUrl } : {}), ...(i.zemin ? { zemin: i.zemin } : {}), hamIstem: i.not, kaynakId },
      });
      if (!sonuc.ok) uretimHataToast(sonuc, `${i.arac} başlatılamadı`);
    })();
    lightboxKapat();
    setAkis("benim");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success(`${i.arac} başladı`, { description: `${hicSaglayiciYok ? "Kredi düşmez" : `${i.kredi} kredi`}. Sonuç Üretimlerim'in en üstünde görünecek.` });
    return true;
  };
  /** Kart üstü varyasyon: görüntüleyicideki Varyasyon aracıyla aynı talimat. */
  const varyasyonUret = (url: string, u: Uretim | undefined, guc: "hafif" | "guclu") => {
    aracCalistir({
      islem: "duzenle", arac: "Varyasyon", baslik: `Varyasyon · ${guc === "hafif" ? "hafif" : "güçlü"}`, kredi: 2,
      not: guc === "hafif"
        ? "Bu görselin hafif bir varyasyonunu üret: kompozisyonu, özneyi, stili ve ışığı koru; yalnız küçük ayrıntıları (ifade, kumaş kıvrımı, arka plandaki küçük öğeler) değiştir."
        : "Bu görselin güçlü bir varyasyonunu üret: aynı özneyi ve stili koru, ama kompozisyonu, pozu, kamera açısını ve kadrajı belirgin biçimde değiştir.",
    }, { url, u });
  };
  const buyutAc = (url: string, id?: string) => router.push(upscaleAdresi(saltUrl(url) ?? url, id));
  /** Renk ayarı tarayıcıda uygulanır: sonuç yeni bir görsel olarak eklenir, kredi düşmez. */
  const projeEkle = useProjeler((s) => s.ekle);
  const yerelKaydet = (dataUrl: string, baslik: string) => {
    const kaynakId = acikUretim?.id;
    try {
      projeEkle({
        baslik, tur: "gorsel", model: "Renk ayarı", prompt: baslik, durum: "tamam", ilerleme: 100, kredi: 0, arac: "Renk ayarı",
        gorselUrl: dataUrl, gercek: true, projeId: aktifProjeId ?? undefined,
        meta: { oran: acikUretim?.meta?.oran as string | undefined, hamIstem: (acikUretim?.meta?.hamIstem as string | undefined) ?? undefined, kaynakId },
      });
    } catch {
      toast.error("Görsel kaydedilemedi", { description: "Tarayıcı depolama alanı dolu olabilir. Görseli indirip saklayabilirsin." });
      return;
    }
    setAkis("benim");
    setSeciliKart(dataUrl);
    toast.success("Renk ayarlı görsel kaydedildi", { description: "Üretimlerim'e eklendi. Kredi düşmedi." });
  };

  // Önceki/sonraki üretime geç (Higgsfield birebir sağ/sol ok).
  const lightboxGez = (yon: 1 | -1) => {
    if (lbIndex < 0) return;
    const yeni = lbIndex + yon;
    if (yeni < 0 || yeni >= gezListe.length) return;
    setSeciliKart(gezListe[yeni]);
  };
  /** "Element oluştur" (üretim kartı/menü): ortak düzenleyiciyi görsel ve istemle ön-dolu açar. */
  const elementModalAc = (gorsel?: string | null, istem?: string) => {
    const g = gorsel ? (saltUrl(gorsel) ?? gorsel) : undefined;
    setElementTohum({
      gorsel: g && /^(data:image|https?:|\/)/.test(g) ? g : undefined,
      aciklama: (istem || "").slice(0, 300),
      ad: (istem || "").replace(/[^\p{L}\p{N}]/gu, "").slice(0, 14) || undefined,
    });
  };

  const uret = async () => {
    // Swap modelleri: prompt yerine iki görsel gerekir (Higgsfield birebir doğrulama).
    if (swapMu) {
      if (!swapKaynak) return toast.error(yuzMu ? "Kaynak yüz eksik" : "Kaynak karakter eksik", { description: "Sol kutuya eklemek istediğin görseli yükle." });
      if (!swapHedef) return toast.error("Hedef görsel eksik", { description: "Sağ kutuya değiştirilecek görseli yükle." });
      const birim = demoModu ? 0 : modelKredi(model);
      let kaynakUrl: string, hedefUrl: string;
      try { [kaynakUrl, hedefUrl] = await Promise.all([gorselDepola(swapKaynak), gorselDepola(swapHedef)]); }
      catch (e) { return toast.error("Görsel yüklenemedi", { description: `${neden(e, "Sunucuya ulaşılamadı.")} Bağlantını kontrol edip yeniden dene.` }); }
      const sonuc = uretimBaslat({
        baslik: `${yuzMu ? "Yüz" : "Karakter"} değiştirme`,
        tur: "gorsel",
        model,
        prompt: `${yuzMu ? "Yüz" : "Karakter"} değiştirme · kaynak → hedef`,
        kredi: birim,
        projeId: aktifProjeId ?? undefined,
        meta: { islem: yuzMu ? "swap-yuz" : "swap-karakter", referanslar: [kaynakUrl, hedefUrl], gorselUrl: hedefUrl },
      });
      if (!sonuc.ok) return uretimHataToast(sonuc);
      toast.success(`${yuzMu ? "Yüz" : "Karakter"} değiştirme başladı`, { description: `${model} · ${oran}. Sonuç Üretimlerim'de görünecek.` });
      return;
    }

    if (prompt.trim().length < 2) return toast.error("İstem eksik", { description: "Ne üretmek istediğini birkaç kelimeyle anlat." });

    // İçerik moderasyonu — üretimden ÖNCE. Engellenirse kredi HİÇ düşmez.
    const denetim = icerikDenetle(prompt);
    if (!denetim.izin) {
      toast.error(`İçerik engellendi · ${kategoriEtiket(denetim.kategori)}`, { description: denetim.mesaj });
      return;
    }

    if (gonderiliyor) return;
    // Demo (sağlayıcı bağlı değil) kredi almaz.
    const birim = sinirsizGecerli || demoModu ? 0 : birimKredi;
    const kac = aktifModelTanim.adetGizli ? 1 : adet;
    const api = aktifModelTanim.api;
    if (api.refZorunlu && !referanslar.length) return toast.error(`${model} için görsel gerekli`, { description: "Düzenlenecek görseli + ile ekle ya da sürükle." });
    // Seçili karakter istemde @ad olarak geçer: element çözümleyici fotoğraflarını referans olarak gönderir.
    const istemSon = seciliKarakter && soulMu && !new RegExp(`@${seciliKarakter}(?![\\p{L}\\p{N}_])`, "iu").test(prompt) ? `${prompt.trim()} @${seciliKarakter}` : prompt.trim();
    const tohumSayi = tohum.trim() ? Number(tohum) : undefined;

    /* Her varyasyon ayrı bir üretimdir: kullanıcı kaç görsel öderse o kadar kart görür.
       Referans görseller önce sunucu deposuna yazılır; üretim kaydı yalnız adres tutar. */
    setGonderiliyor(true);
    let refUrller: string[];
    try {
      refUrller = await Promise.all(referanslar.map((x) => x.depo ? Promise.resolve(x.depo) : gorselDepola(x.url)));
      // Görünen küçük resim yerel kalır (yeniden yüklenip boş görünmesin); depo adresi tekrar yüklememek için saklanır.
      setReferanslar((v) => v.map((x, k) => ({ ...x, depo: refUrller[k] ?? x.depo })));
    } catch (e) {
      setGonderiliyor(false);
      return toast.error("Referans görsel yüklenemedi", { description: `${neden(e, "Sunucuya ulaşılamadı.")} Yeniden dene.` });
    }
    let basarili = 0;
    let harcanan = 0;
    const hedefler = karsilastir ? cokluModel : [model];
    const grupId = `g_${Date.now().toString(36)}`;
    const roller = referanslar.map((r) => r.rol ?? "genel");
    dis: for (const hm of hedefler) {
      const ana = hm === model;
      const t = modelBul(hm);
      const ta = t.api;
      // Karşılaştırmada her model kendi desteklediği en yakın ayarla çalışır.
      const hOran = ta.oranlar.includes(oran) ? oran : (t.varsayilanOran && ta.oranlar.includes(t.varsayilanOran) ? t.varsayilanOran : ta.oranlar[0] ?? oran);
      const hCoz = ta.cozunurluklar.includes(cozunurluk) ? cozunurluk : ta.cozunurluklar.find((c) => c === "2K") ?? ta.cozunurluklar[ta.cozunurluklar.length - 1];
      const hBirim = ana ? birim : !modelBagli(t) ? 0 : modelKredi(hm) * (t.cozunurluk && hCoz ? cozunurlukCarpani(hCoz) : 1);
      const hKac = t.adetGizli ? 1 : adet;
      const hKalite = ana ? aktifKalite : t.kaliteSeviye?.[0] ?? "";
      const refSinir = refUrller.slice(0, ta.refMax || 0);
      for (let i = 0; i < hKac; i++) {
        const sonuc = uretimBaslat({
          baslik: prompt.slice(0, 48),
          tur: "gorsel",
          model: hm,
          prompt: istemSon,
          kredi: hBirim,
          projeId: aktifProjeId ?? undefined,
          meta: {
            islem: "uret",
            oran: hOran,
            ...(ta.cozunurluklar.length && hCoz ? { cozunurluk: hCoz } : {}),
            ...(hKalite ? { kalite: hKalite } : ana && modelTip === "recraft" ? { kalite: kaliteMod } : {}),
            hamIstem: prompt,
            grupId, sira: i,
            ...(refSinir.length ? { referanslar: refSinir, gorselUrl: refSinir[0], ...(roller.some((r) => r !== "genel") ? { refRolleri: roller.slice(0, refSinir.length) } : {}) } : {}),
            ...(seciliStil ? { stilAd: seciliStil.ad, stilIstem: seciliStil.istem } : {}),
            ...(t.soul && seciliPano ? { stilRefler: seciliPano.gorseller.slice(0, 4), pano: seciliPano.ad, ...(seciliPano.guc ? { stilGuc: seciliPano.guc } : {}), ...(seciliPano.tarif ? { stilIstem: [seciliStil?.istem, seciliPano.tarif].filter(Boolean).join(". ") } : {}) } : {}),
            ...(seciliPalet && (t.soul || t.tip === "recraft") ? { renkler: seciliPalet.renkler, palet: seciliPalet.ad } : {}),
            ...(negatif.trim() || (t.soul && seciliPano?.kacin) ? { negatif: [negatif.trim(), t.soul ? seciliPano?.kacin : ""].filter(Boolean).join(", ") } : {}),
            ...(ta.tohum && Number.isInteger(tohumSayi) ? { tohum: tohumSayi! + i } : {}),
            ...(ta.seffaf && seffaf ? { seffaf: true } : {}),
            ...(ana && modelTip === "recraft" && vektorMod ? { vektor: true } : {}),
            ...(ana && modelTip === "flux" ? { yonlendirme: cfg, adim: kaliteAdim } : {}),
            ...(gelistirEtkin ? { gelistir: true } : {}),
          },
        });
        if (!sonuc.ok) { if (!basarili) uretimHataToast(sonuc); break dis; }
        basarili++; harcanan += hBirim;
      }
    }
    setTimeout(() => setGonderiliyor(false), 600);
    if (!basarili) return;
    sonModelYaz(hedefler);
    if (!gomulu) {
      setAkis("benim");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    toast.success(basarili > 1 ? `${basarili} görsel üretiliyor` : "Görsel üretiliyor", {
      description: `${karsilastir ? `${hedefler.length} model karşılaştırılıyor` : model} · ${oran} · ${sinirsizGecerli && !karsilastir ? "Sınırsız erişim, kredi düşmedi." : harcanan === 0 ? "Kredi düşmedi." : `${krediYaz(harcanan)} kredi.`}`,
    });
  };

  // ── Gerçek indirme: data-uri/http ise dosya indir; gradient placeholder ise bilgi ver ──
  // `sessiz` → toplu indirmede tek tek toast basmasın (çağıran bir kez basar).
  const gorseliIndir = (arka?: string, ad = "vayra-gorsel", sessiz = false) => {
    // gorselUrl bir CSS background string ("url(...) , gradient"); ilk url(...)'i çıkar.
    const m = arka?.match(/url\((['"]?)(.*?)\1\)/);
    const kaynak = m?.[2] ?? (arka && /^(data:|https?:|\/)/.test(arka) ? arka : undefined);
    const dosya = `${ad.replace(/[^\w\s-]/g, "").trim().slice(0, 40) || "vayra"}`;
    if (kaynak) {
      const ok = urlIndir(kaynak, `${dosya}.png`);
      if (!sessiz) {
        if (ok) toast.success("Görsel indiriliyor", { description: `${dosya}.png` });
        else toast.error("Görsel indirilemedi", { description: "Tarayıcı indirmeyi engelledi. İndirme izinlerini kontrol edip yeniden dene." });
      }
      return ok;
    }
    // Gerçek görsel dosyası yok (gradyan yer tutucu) → en azından künyeyi gerçekten indir.
    const ok = metinIndir(
      JSON.stringify({ baslik: ad, uygulama: "Vayra", disaAktarim: new Date().toISOString() }, null, 2),
      `${dosya}.json`,
      "application/json",
    );
    if (!sessiz) {
      if (ok) toast.success("Künye indirildi", { description: "Bu kartın görsel dosyası yok, bilgileri JSON olarak kaydedildi." });
      else toast.error("Künye indirilemedi", { description: "Tarayıcı indirmeyi engelledi. İndirme izinlerini kontrol edip yeniden dene." });
    }
    return ok;
  };

  // ── GERÇEK toplu indirme: seçili id'ler hem üretimlerden hem galeriden çözülür ──
  const topluGorselIndir = () => {
    const hedefler = secililer
      .map((sid) => {
        const uret = gorselUretimleri.find((x) => x.id === sid);
        if (uret) return { arka: uret.gorselUrl, ad: uret.baslik || "vayra-gorsel" };
        // Galeri kartlarının kimliği `url + index` biçiminde üretilir.
        const gal = TUM_GORSELLER.find((url, i) => url + i === sid);
        return gal ? { arka: gal, ad: "vayra-gorsel" } : null;
      })
      .filter(Boolean) as { arka?: string; ad: string }[];
    if (!hedefler.length) return void toast.error("İndirilecek görsel yok", { description: "Önce indirmek istediğin görselleri seç." });
    // Tarayıcı çoklu indirmeyi engellemesin diye aralıklı tetikle.
    hedefler.forEach((h, i) => setTimeout(() => gorseliIndir(h.arka, h.ad, true), i * 320));
    toast.success(`${hedefler.length} görsel indiriliyor`, { description: "Tarayıcı indirmeleri sırayla başlatır." });
  };

  /* Seçimin kaç tanesi GERÇEK üretim kaydı? (kalanlar stok galeri görselleri —
     onlar üzerinde yayınla/klasör/sil yapılamaz.) */
  const seciliUretimIdler = () => secililer.filter((sid) => gorselUretimleri.some((x) => x.id === sid));

  /* Toplu yayınla — GERÇEK: store'da yayinda:true yapar. */
  const topluYayinla = () => {
    const idler = seciliUretimIdler();
    if (!idler.length) return void toast.info("Yayınlanacak üretim yok", { description: "Yalnız kendi üretimlerin toplulukta yayınlanabilir." });
    idler.forEach((id) => guncelle(id, { yayinda: true }));
    toast.success(`${idler.length} üretim toplulukta yayınlandı`, { description: "Keşfet akışında görünecek." });
    secimTemizle();
  };

  /* Toplu klasöre ekle: Kitaplık projelerinden seçilir. */
  const topluKlasoreEkle = (kid: string | null) => {
    const idler = seciliUretimIdler();
    setTopluKlasorAcik(false);
    if (!idler.length) return void toast.info("Eklenecek üretim yok", { description: "Yalnız kendi üretimlerin klasöre eklenebilir." });
    if (kid === null) { setYeniKlasorIcin(idler.join(",")); secimTemizle(); return; }
    klasoreEkle(kid, idler);
    secimTemizle();
  };

  /* Toplu sil — GERÇEK: store'dan siler. */
  const topluSil = () => {
    const idler = seciliUretimIdler();
    if (!idler.length) return void toast.info("Silinecek üretim yok", { description: "Stok galeri görselleri silinemiyor." });
    const silinenler = gorselUretimleri.filter((x) => idler.includes(x.id));
    idler.forEach((id) => silUretim(id));
    mesaj.silindi(`${idler.length} üretim`, () => uretimGeriYukle(silinenler));
    secimTemizle();
  };

  // ── Gerçek yeniden-üret: verilen istemle uret akışını tekrar çağır (kredi düşer) ──
  const yenidenUret = (istem?: string) => {
    const kaynak = (istem ?? prompt).trim();
    if (kaynak.length < 2) return toast.error("Yeniden üretilemedi", { description: "Bu görselin istemi yok. Komut kutusuna bir istem yazıp üret." });
    const denetim = icerikDenetle(kaynak);
    if (!denetim.izin) return toast.error(`İçerik engellendi · ${kategoriEtiket(denetim.kategori)}`, { description: denetim.mesaj });
    const birim = sinirsizGecerli ? 0 : modelKredi(model);
    const sonuc = uretimBaslat({ baslik: kaynak.slice(0, 48), tur: "gorsel", model, prompt: kaynak, kredi: birim, projeId: aktifProjeId ?? undefined, meta: { oran, cozunurluk, hamIstem: istemTemizle(kaynak) } });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    // Üretim başladı → lightbox'ı kapat, kullanıcı grid'in başında üretilen görseli görsün (madde 9).
    lightboxKapat();
    setAkis("benim");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Yeniden üretim başladı", { description: `${model} · ${oran}. Sonuç Üretimlerim'in en üstünde görünecek.` });
  };

  // Boyut kaydırıcı → sütun genişliği (Higgsfield birebir: nav altı ince slider)
  const sutunGen = 120 + boyut * 2.4; // px
  // Kart araç boyutu artık KartAraclari içinde kartın gerçek genişliğinden ölçülür (Y2).

  /* ── MOBİL COMPOSER ──
     Referansta `Create Image` ekranı tam ekran bir formdur; masaüstündeki
     galeri + araç panelleri mobilde görünmez. Ortak MobilComposer'ı burada
     mevcut prompt/model/oran/adet state'leriyle bağlıyoruz. */
  const mobilModeller: SeciciOge[] = GORSEL_MODELLER.map((m) => ({ id: m.ad, ad: m.ad, ozet: `${m.ozet} · ${modelBagli(m) ? `${krediYaz(m.kredi ?? 2)} kredi` : "kredi düşmez"}`, rozet: m.rozet }));

  return (
    <>
    {/* Gömülüyken mobil tam-ekran kabuk YOK — dış sayfa kendi düzenini kurar. */}
    {!gomulu && (
    <>
    <MobilComposerKabuk
      baslik="Görsel Üret"
      modId="gorsel"
      onKapat={() => router.push("/panel")}
      altCipler={(() => {
        /* MODELE GÖRE DİNAMİK ÇİPLER (Higgsfield birebir):
           - kaliteSeviye varsa "kalite" çipi o seviyeleri gösterir; yoksa cozunurluk 1K/2K/4K.
           - adetGizli modellerde (Yüz/Karakter Değiştir, WAN) adet çipi YOK.
           - sinirsizToggle modellerde "Sınırsız" anahtarı eklenir. */
        const m = modelBul(model);
        // Çözünürlük ve kalite ayrı çiplerdir (ikisini de destekleyen modeller var: GPT Image 2).
        const cozSecenek = m.cozunurluk && COZUNURLUKLER.length > 1 ? COZUNURLUKLER : undefined;
        return (
          <MobilAltCipler
            oran={m.api.oranlar.length ? oran : undefined} oranSecenek={m.api.oranlar.length ? modelOranlari.map((o) => o.deger) : undefined} onOran={setOran}
            kalite={cozSecenek ? cozunurluk : undefined} kaliteSecenek={cozSecenek}
            onKalite={cozSecenek ? setCozunurluk : undefined}
            adet={m.adetGizli ? undefined : String(adet)} adetSecenek={m.adetGizli ? undefined : ["1", "2", "3", "4", "6", "8"]}
            onAdet={m.adetGizli ? undefined : (v) => setAdet(Number(v))}
            ekstra={
              <>
                {kaliteSecenek && kaliteSecenek.length > 0 && (
                  <MobilAltCip tip="kalite" deger={aktifKalite} secenekler={kaliteSecenek} onSec={setKaliteSeviye} baslik="Kalite" />
                )}
                {sinirsizSatiliyor && (
                  <button onClick={sinirsizDegistir}
                    className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition-colors",
                      sinirsizGecerli ? "bg-white text-black" : "bg-[#2a2c2e] text-white")}>
                    ∞ Sınırsız
                  </button>
                )}
                {/* Renk Transferi — seçiliyse butonun ARKA PLANI seçilen paletten (isim yerine renkler). */}
                {(m.soul || m.tip === "recraft") && (() => {
                  const palet = seciliPalet?.renkler;
                  return (
                    <button onClick={() => setRenkModal(true)}
                      className="relative flex h-9 items-center gap-1.5 overflow-hidden rounded-full px-3 text-[14px] font-medium text-white transition-colors"
                      style={palet
                        ? { background: `linear-gradient(90deg, ${palet.join(", ")})` }
                        : { background: "#2a2c2e" }}>
                      {/* Okunurluk için hafif koyu örtü (palet açık renkli olabilir) */}
                      {palet && <span aria-hidden className="absolute inset-0 bg-black/25" />}
                      <span className="relative flex items-center gap-1.5">
                        <Palette className="h-4 w-4" />
                        {palet ? (
                          <span className="flex gap-1">
                            {palet.map((c, i) => <span key={c + i} className="h-3.5 w-3.5 rounded-full ring-1 ring-white/40" style={{ background: c }} />)}
                          </span>
                        ) : "Renk"}
                      </span>
                    </button>
                  );
                })()}
                {/* Recraft — Vektör (SVG) modu + Kalite (Standart/HD) */}
                {m.tip === "recraft" && (
                  <>
                    <button onClick={() => setVektorMod((v) => !v)}
                      className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition-colors",
                        vektorMod ? "bg-white text-black" : "bg-[#2a2c2e] text-white")}>
                      <Layers className="h-4 w-4" /> Vektör
                    </button>
                    <MobilAltCip tip="kalite" deger={kaliteMod} secenekler={["Standart", "Pro"]} onSec={(v) => setKaliteMod(v as "Standart" | "Pro")} baslik="Kalite" />
                  </>
                )}
              </>
            }
          />
        );
      })()}
      uretButonu={<MobilUretButonu kredi={toplamKredi} etiket={karsilastir ? "Karşılaştır" : "Üret"} onTikla={uret} devreDisi={swapMu ? !(swapKaynak && swapHedef) : !prompt.trim()} />}
    >
      {(() => {
        const m = modelBul(model);
        /* SWAP modelleri (Yüz/Karakter Değiştir): iki yükleme kutusu — istem yok. */
        if (m.tip === "swap") {
          return (
            <div className="grid grid-cols-2 gap-2">
              {([
                { url: swapKaynak, et: "Senin Fotoğrafın", ayar: setSwapKaynak },
                { url: swapHedef, et: "Hedef Görsel", ayar: setSwapHedef },
              ] as const).map((k, i) => (
                <label key={i} className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[12px] bg-yuzey-2 text-center">
                  {k.url ? (<><span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${k.url})` }} /><button onClick={(e) => { e.preventDefault(); k.ayar(null); }} className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"><X className="h-3.5 w-3.5" /></button></>) : (<><input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => k.ayar(String(r.result)); r.readAsDataURL(f); } e.target.value = ""; }} /><ImagePlus className="h-5 w-5 text-metin-2" /><span className="text-[13px] font-semibold text-white">{k.et}</span></>)}
                </label>
              ))}
            </div>
          );
        }
        /* Normal + soul + flux: referans yükleme + istem */
        return (
          <>
            <MobilYukleAlani etiket="Yüklemek için görsel seç" ipucu="(en fazla 14)" cokluBaslik="Referans görseller"
              gorseller={referanslar.map((r) => r.url)}
              onKaldir={(i) => setReferanslar((v) => v.filter((_, j) => j !== i))}
              onDosya={(dosyalar) => {
                Array.from(dosyalar).slice(0, 14 - referanslar.length).forEach((d) => {
                  const r = new FileReader();
                  r.onload = () => setReferanslar((v) => (v.length >= 14 ? v : [...v, { ad: d.name, url: String(r.result) }]));
                  r.readAsDataURL(d);
                });
              }} />
            {/* SOUL modelleri: Karakter + Moodboard kartları */}
            {m.soul && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setKarakterModal(true)}
                  className={cn("flex h-[68px] items-center justify-center gap-2 rounded-[12px] bg-yuzey-2 px-2 text-[14px] font-medium text-white", seciliKarakter && "ring-2 ring-white")}>
                  <UserSquare className="h-[18px] w-[18px] shrink-0 text-metin-2" /> <span className="truncate">{seciliKarakter ? `@${seciliKarakter}` : "Karakter"}</span>
                </button>
                <button onClick={() => setMoodboardModal(true)}
                  className={cn("flex h-[68px] items-center justify-center gap-2 rounded-[12px] bg-yuzey-2 px-2 text-[14px] font-medium text-white", seciliPano && "ring-2 ring-white")}>
                  <Sparkles className="h-[18px] w-[18px] shrink-0 text-metin-2" /> <span className="truncate">{seciliPano?.ad ?? "Moodboard"}</span>
                </button>
              </div>
            )}
            <MobilIstemKutusu deger={prompt} onDegis={setPrompt} modelAdi={model} onModelTikla={() => setMobilModelAcik(true)}
              onElementAc={() => setElementSeciciAcik(true)} />
            {/* Stil ön ayarları: gerçek örnek kapaklı yatay şerit */}
            <div className="overflow-hidden rounded-[16px] bg-yuzey-2">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
                <Palette className="h-4 w-4 text-metin-2" /><span className="text-[13px] font-semibold text-white">Stil</span>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-metin-2">{seciliStil?.ad ?? "Yok"}</span>
                {seciliStil && <button onClick={() => setStilId(null)} className="ml-auto text-[12.5px] text-metin-2">Kaldır</button>}
              </div>
              <div className="flex gap-2 overflow-x-auto p-2 [scrollbar-width:none]">
                {GORSEL_STILLER.map((x) => (
                  <button key={x.id} onClick={() => setStilId(stilId === x.id ? null : x.id)} aria-pressed={stilId === x.id} className="w-[68px] shrink-0 text-left">
                    <span className={cn("relative block h-[84px] overflow-hidden rounded-[12px]", stilId === x.id ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/10")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={x.kapak} alt="" loading="lazy" className="h-full w-full object-cover" />
                      {stilId === x.id && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>}
                    </span>
                    <span className={cn("mt-1 block truncate text-[11.5px]", stilId === x.id ? "text-white" : "text-metin-2")}>{x.ad}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Son üretimler — mobilde sonuçlar burada görünür; dokununca kitaplıkta açılır. */}
            {gorselUretimleri.length > 0 && (
              <div className="overflow-hidden rounded-[16px] bg-yuzey-2">
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
                  <Images className="h-4 w-4 text-metin-2" /><span className="text-[13px] font-semibold text-white">Son üretimlerin</span>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-2">{gorselUretimleri.length}</span>
                  <button onClick={() => router.push("/panel/kitaplik")} className="ml-auto flex h-7 items-center gap-1 rounded-full px-2.5 text-[12.5px] text-metin-2 ring-1 ring-inset ring-white/[0.1]">Tümü<ChevronRight className="h-3.5 w-3.5" /></button>
                </div>
                <div className="flex gap-2 overflow-x-auto p-2 [scrollbar-width:none]">
                  {gorselUretimleri.slice(0, 12).map((u) => {
                    const calisiyor = u.durum === "kuyrukta" || u.durum === "isleniyor";
                    const arka = u.gorselUrl ? (/^(data:|https?:|\/)/.test(u.gorselUrl) ? `url("${u.gorselUrl}") center/cover no-repeat` : u.gorselUrl) : "#1c1e20";
                    return (
                      <button key={u.id} onClick={() => !calisiyor && router.push(`/panel/kitaplik?u=${u.id}`)} aria-label={calisiyor ? "Üretiliyor" : "Üretimi aç"}
                        className="relative h-24 w-[72px] shrink-0 overflow-hidden rounded-xl bg-yuzey-2" style={{ background: u.durum === "tamam" ? arka : undefined }}>
                        {calisiyor && <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[11px] text-white/80"><Loader2 className="h-4 w-4 animate-spin" />{u.durum === "kuyrukta" ? "Sırada" : <GecenSure bas={u.baslama ?? u.olusturma} />}</span>}
                        {u.durum === "hata" && <span className="absolute inset-0 flex items-center justify-center text-[11px] text-rose-300">Başarısız</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* FLUX modelleri: gelişmiş ayarlar (CFG + kalite adımları) */}
            {m.tip === "flux" && (
              <button onClick={() => setFluxAyarAcik(true)}
                className="flex items-center gap-2 self-start rounded-full bg-[#2a2c2e] px-4 py-2.5 text-[14px] font-medium text-white">
                <SlidersHorizontal className="h-4 w-4" /> Gelişmiş: CFG {cfg}, {kaliteAdim} adım
              </button>
            )}
            {/* Çizerek düzenleme destekli modeller (Nano Banana / Vary): Çiz butonu */}
            {m.cizim && (
              <button onClick={() => setCizimModal(true)}
                className="flex items-center gap-2 self-start rounded-full bg-[#2a2c2e] px-4 py-2.5 text-[14px] font-medium text-white">
                <Pencil className="h-4 w-4" /> Çiz
              </button>
            )}
          </>
        );
      })()}
    </MobilComposerKabuk>

    <MobilSecici acik={mobilModelAcik} onKapat={() => setMobilModelAcik(false)}
      ogeler={mobilModeller} seciliId={model} onSec={(o) => modelSec(o.id)} aramaYerTutucu="Model ara…" />

    {/* @mention element seçici — seçince prompt'a @ad ekler */}
    <MobilSecici acik={elementSeciciAcik} onKapat={() => setElementSeciciAcik(false)} baslik="Element ekle"
      ogeler={elementListe.map((e) => ({ id: e.id, ad: e.ad, ozet: e.aciklama }))}
      onSec={(o) => { const e = elementListe.find((x) => x.id === o.id); if (e) setPrompt((p) => `${p}${p && !p.endsWith(" ") ? " " : ""}@${e.ad} `); }}
      aramaYerTutucu="Element ara…" />

    {/* FLUX gelişmiş ayarlar — CFG (prompt gücü) + kalite adımları */}
    <MobilAyarCekmecesi acik={fluxAyarAcik} onKapat={() => setFluxAyarAcik(false)} baslik="Gelişmiş ayarlar"
      onSifirla={() => { setCfg(5); setKaliteAdim(30); }} onKaydet={() => setFluxAyarAcik(false)}>
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[14px]"><span className="text-white">Prompt Gücü (CFG)</span><span className="text-metin-2">{cfg}</span></div>
        <input type="range" min={1} max={15} step={0.5} value={cfg} onChange={(e) => setCfg(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-white" />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[14px]"><span className="text-white">Kalite Adımları</span><span className="text-metin-2">{kaliteAdim}</span></div>
        <input type="range" min={10} max={60} step={1} value={kaliteAdim} onChange={(e) => setKaliteAdim(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-white" />
      </div>
    </MobilAyarCekmecesi>
    </>
    )}

    {/* Gömülüyken: galeri/boyut kaydırıcı yok, YALNIZ composer dock'u.
        `relative` + min-h kaldırılır ki dock dış düzenin akışına otursun. */}
    <div className={gomulu ? "relative" : "relative hidden min-h-[calc(100vh-3rem)] bg-[#0d0e10] sm:block"}>
      {/* Akış çubuğu: kayan beyaz sekmeler · arama · süzgeç hapları · süren işler · ızgara yoğunluğu */}
      {!gomulu && (
        <div className="sticky top-[var(--ust-nav)] z-20 flex h-[60px] items-center gap-2 border-b border-white/[0.08] px-4" style={{ background: "rgba(13,14,16,0.82)", backdropFilter: "blur(14px) saturate(1.25)", WebkitBackdropFilter: "blur(14px) saturate(1.25)" }}>
          <div role="tablist" aria-label="Görsel akışı" className="isolate flex shrink-0 gap-0.5 rounded-full p-[3px] bg-white/[0.06]">
            {([["benim", "Üretimlerim", gorselUretimleri.length, Images], ["ilham", "İlham", TUM_GORSELLER.length - gizliStok.length, Lightbulb]] as const).map(([id, ad, n, I]) => (
              <button key={id} role="tab" aria-selected={akis === id} onClick={() => { setAkis(id); window.scrollTo({ top: 0 }); }}
                className={cn("relative flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition-colors active:scale-[0.97]", akis === id ? "text-black" : "text-metin-2 hover:text-metin")}>
                {akis === id && <motion.span layoutId="akisSekme" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
                <I className="h-4 w-4" />{ad}
                {n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] font-semibold tabular-nums", akis === id ? "bg-black/10" : "bg-white/[0.08]")}>{n}</span>}
              </button>
            ))}
          </div>

          <AnimatePresence initial={false}>
          {akis === "benim" && gorselUretimleri.length > 0 && (
            <motion.div key="suzgec" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.16 }} className="flex min-w-0 items-center gap-1.5">
              <label className="group ml-1 flex h-9 w-[230px] items-center gap-2 rounded-full px-3 bg-white/[0.08] ring-1 ring-inset ring-transparent transition-[width,box-shadow,background-color] focus-within:w-[300px] focus-within:bg-white/[0.11] focus-within:ring-white/20 hover:bg-white/[0.11]">
                <Search className="h-4 w-4 shrink-0 text-metin-3 group-focus-within:text-metin" />
                <input value={akisAra} onChange={(e) => setAkisAra(e.target.value)} placeholder="İstemde ya da modelde ara" aria-label="Üretimlerde ara"
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-metin outline-none placeholder:text-metin-2" />
                {akisAra && <button onClick={() => setAkisAra("")} aria-label="Aramayı temizle" className="flex h-5 w-5 items-center justify-center rounded-full text-metin-3 hover:bg-white/[0.08] hover:text-metin"><X className="h-3 w-3" /></button>}
              </label>
              <button onClick={() => setAkisFavori((v) => !v)} aria-pressed={akisFavori}
                className={cn("flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium ring-1 ring-inset transition active:scale-[0.97]", akisFavori ? "bg-white text-black ring-white" : "bg-white/[0.08] text-metin-2 ring-transparent hover:bg-white/[0.13] hover:text-metin")}>
                <Heart className={cn("h-4 w-4", akisFavori && "fill-rose-500 text-rose-500")} />Favoriler
              </button>
              <div className="relative shrink-0">
                <button onClick={() => setAkisModelAcik((v) => !v)} aria-expanded={akisModelAcik}
                  className={cn("flex h-9 items-center gap-2 rounded-full pl-2.5 pr-3 text-[13px] font-medium ring-1 ring-inset transition active:scale-[0.97]", akisModel ? "bg-white text-black ring-white" : "bg-white/[0.08] text-metin-2 ring-transparent hover:bg-white/[0.13] hover:text-metin")}>
                  {akisModel ? <ModelLogo ad={akisModel} boyut={16} /> : <LayoutGrid className="h-4 w-4" />}
                  <span className="max-w-[150px] truncate">{akisModel ?? "Tüm modeller"}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", akisModelAcik && "rotate-180")} />
                </button>
                <Yuzen acik={akisModelAcik} onKapat={() => setAkisModelAcik(false)} yerlesim="alt-sol" bosluk={8} etiket="Modele göre süz"
                  className="max-h-80 w-64 overflow-y-auto rounded-[18px] border border-white/[0.09] bg-[#1b1c1f] p-1.5 [scrollbar-width:thin]">
                  {[null, ...akisModelleri].map((ad) => {
                    const sec = akisModel === ad;
                    return (
                      <button key={ad ?? "tum"} onClick={() => { setAkisModel(ad); setAkisModelAcik(false); }}
                        className={cn("flex w-full items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-white/[0.05]", sec && "bg-white/[0.07]")}>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">{ad ? <ModelLogo ad={ad} boyut={15} /> : <LayoutGrid className="h-3.5 w-3.5 text-metin-2" />}</span>
                        <span className={cn("min-w-0 flex-1 truncate", sec ? "text-metin" : "text-metin-2")}>{ad ?? "Tüm modeller"}</span>
                        <span className="rounded-full bg-white/[0.06] px-1.5 text-[11px] tabular-nums text-metin-2">{ad ? gorselUretimleri.filter((u) => u.model === ad).length : gorselUretimleri.length}</span>
                        {sec && <Check className="h-3.5 w-3.5 shrink-0 text-metin" />}
                      </button>
                    );
                  })}
                </Yuzen>
              </div>
              {gorselUretimleri.some((u) => u.gercek === false) && (
                <button role="switch" aria-checked={demoGizle} onClick={() => setDemoGizle((v) => !v)} title="Sağlayıcı bağlı değilken üretilen örnek görselleri gizle"
                  className="flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-[13px] font-medium bg-white/[0.08] text-metin-2 transition hover:bg-white/[0.13] hover:text-metin max-xl:hidden">
                  <span className={cn("relative h-[18px] w-8 shrink-0 rounded-full transition-colors", demoGizle ? "bg-white" : "bg-white/15")}>
                    <span className={cn("absolute top-[2px] h-3.5 w-3.5 rounded-full transition-[left,background-color] duration-200", demoGizle ? "left-[16px] bg-black" : "left-[2px] bg-white")} />
                  </span>
                  Demoları gizle
                </button>
              )}
              <AnimatePresence>
                {suzgecAktif && (
                  <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => { setAkisAra(""); setAkisFavori(false); setAkisModel(null); setDemoGizle(false); }} aria-label="Süzgeçleri temizle" title="Süzgeçleri temizle"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.06] hover:text-metin active:scale-90">
                    <RotateCcw className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          </AnimatePresence>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <AnimatePresence>
              {aktifIs > 0 && (
                <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => { setAkis("benim"); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-live="polite"
                  className="flex h-9 items-center gap-2 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-metin">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /><span><span className="tabular-nums">{aktifIs}</span> görsel üretiliyor</span>
                </motion.button>
              )}
            </AnimatePresence>
            {/* Izgara yoğunluğu: 3 adım (büyük · orta · sık) */}
            <div role="radiogroup" aria-label="Izgara yoğunluğu" className="isolate hidden items-center gap-0.5 rounded-full p-[3px] bg-white/[0.06] sm:flex">
              {([[85, "Büyük kartlar", 2], [45, "Orta kartlar", 3], [10, "Sık ızgara", 4]] as const).map(([d, ad, n]) => {
                const sec = Math.abs(boyut - d) < 18;
                return (
                  <button key={d} role="radio" aria-checked={sec} aria-label={ad} title={ad} onClick={() => { setBoyutGorsel(d); setBoyut(d); }}
                    className={cn("relative flex h-8 w-8 items-center justify-center rounded-full transition-colors", sec ? "text-black" : "text-metin-3 hover:text-metin-2")}>
                    {sec && <motion.span layoutId="izgaraYog" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
                    <span className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                      {Array.from({ length: n * n }).map((_, k) => <span key={k} className="rounded-[1.5px] bg-current" style={{ width: 12 / n, height: 12 / n }} />)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Gömülüyken galeri YOK: üretimleri dış sayfa (proje varlıkları) gösterir. */}
      <div className={gomulu ? "hidden" : "space-y-3 px-3 pb-[280px] pt-3"}>
        {(() => {
          const sutunSayisi = Math.max(2, Math.round(1400 / sutunGen));
          const KART = "overflow-hidden rounded-[22px]";
          // İstem kutusuyla aynı cam
          const YUZ: React.CSSProperties = { background: "rgba(34,35,40,0.8)", backdropFilter: "blur(14px) saturate(1.25)", WebkitBackdropFilter: "blur(14px) saturate(1.25)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 0 0 1px rgba(255,255,255,0.1)" };
          /** Galeriden komut kutusuna sürükle: referans olarak eklenir. */
          const surukleBasla = (e: React.DragEvent, url: string) => {
            const u = saltUrl(url) ?? url;
            e.dataTransfer.setData("application/x-vayra-gorsel", u);
            e.dataTransfer.effectAllowed = "copy";
          };
          // Hiç üretim yokken: hızlı başlangıç kartı (her iki sekmede de üstte)
          const baslangic = !gorselUretimleri.length && (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(KART, "mx-auto max-w-[880px]")} style={YUZ}>
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]"><Sparkles className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-[15px] font-semibold text-metin">Hızlı başlangıç</span>
                  <span className="block text-[12.5px] text-metin-2">Bir kart seç; istem, model ve oran komut kutusuna hazır gelir.</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-6">
                {HIZLI_BASLANGIC.map((h, i) => (
                  <motion.button key={h.baslik} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}
                    onClick={() => { setPrompt(h.istem); modelSec(h.model); setOran(h.oran); promptRef.current?.focus(); toast.success(`${h.baslik} yüklendi`, { description: `${h.model} · ${h.oran}. İstemi düzenleyip Üret'e bas.` }); }}
                    className="group relative overflow-hidden rounded-[14px] text-left outline outline-1 -outline-offset-1 outline-white/[0.08] transition active:scale-[0.97] hover:outline-white/30" style={{ aspectRatio: "4 / 5" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.gorsel} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                    <span className="absolute inset-x-2.5 bottom-2.5">
                      <span className="block text-[11px] text-white/65">{h.etiket}</span>
                      <span className="block text-[13px] font-semibold leading-tight text-white">{h.baslik}</span>
                    </span>
                  </motion.button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] px-4 py-2.5">
                {([[Pencil, "İstemini yaz"], [ImagePlus, "İstersen referans ekle"], [Sparkles, "Model ve oranı seç, üret"]] as const).map(([I, ad], i) => (
                  <span key={ad} className="flex h-8 items-center gap-2 rounded-full pl-1 pr-3 text-[12.5px] text-metin-2 ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold tabular-nums text-metin">{i + 1}</span><I className="h-3.5 w-3.5" />{ad}
                  </span>
                ))}
              </div>
            </motion.section>
          );

          if (akis === "benim") {
            if (!gorselUretimleri.length) return (
              <>
                {baslangic}
                <div className={cn(KART, "mx-auto flex max-w-[880px] flex-wrap items-center gap-3 px-4 py-3")} style={YUZ}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"><Images className="h-4 w-4 text-metin-2" /></span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-[14px] font-medium text-metin">Henüz görsel üretmedin</span>
                    <span className="block text-[12.5px] text-metin-2">Ürettiğin her görsel burada, en yenisi en üstte görünür.</span>
                  </span>
                  <button onClick={() => setAkis("ilham")} className="flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.12] transition hover:bg-white/[0.06] active:scale-[0.97]">
                    <Lightbulb className="h-4 w-4" />İlham galerisine bak
                  </button>
                </div>
              </>
            );
            if (!suzulmus.length) {
              // Sonuç yok: hangi süzgeçlerin daralttığını göster, tek tek kaldırılabilsin; aramadan doğrudan üretime geç.
              const temizle = () => { setAkisAra(""); setAkisFavori(false); setAkisModel(null); setDemoGizle(false); };
              const cipler: { ad: string; ikon: typeof Search; kaldir: () => void }[] = [
                ...(akisAra.trim() ? [{ ad: `“${akisAra.trim()}”`, ikon: Search, kaldir: () => setAkisAra("") }] : []),
                ...(akisFavori ? [{ ad: "Yalnız favoriler", ikon: Heart, kaldir: () => setAkisFavori(false) }] : []),
                ...(akisModel ? [{ ad: akisModel, ikon: LayoutGrid, kaldir: () => setAkisModel(null) }] : []),
                ...(demoGizle ? [{ ad: "Demolar gizli", ikon: X, kaldir: () => setDemoGizle(false) }] : []),
              ];
              const ornek = gorselUretimleri.map((u) => kapakUrl(u)).filter(Boolean).slice(0, 3) as string[];
              return (
                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(KART, "mx-auto mt-[6vh] max-w-[520px]")} style={YUZ}>
                  <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                    <Search className="h-4 w-4 text-metin-2" /><span className="text-[14px] font-semibold text-metin">Eşleşen üretim yok</span>
                    <span className="ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-2">{gorselUretimleri.length} üretim tarandı</span>
                  </div>
                  <div className="flex flex-col items-center px-5 py-6 text-center">
                    <div className="relative h-[110px] w-[200px]">
                      {(ornek.length ? ornek : [null, null, null]).map((src, i) => (
                        <span key={i} className="absolute left-1/2 top-1 h-[100px] w-[78px] overflow-hidden rounded-[14px] bg-white/[0.05] ring-1 ring-white/[0.1]"
                          style={{ transform: `translateX(-50%) translateX(${(i - 1) * 46}px) rotate(${(i - 1) * 9}deg)`, zIndex: i === 1 ? 2 : 1 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {src && <img src={src} alt="" className="h-full w-full object-cover opacity-45 grayscale" />}
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 text-[13.5px] leading-relaxed text-metin-2">Bu süzgeçlere uyan görsel yok. Bir süzgeci kaldır ya da hepsini temizle.</p>
                    {cipler.length > 0 && (
                      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                        {cipler.map((c) => (
                          <button key={c.ad} onClick={c.kaldir} title="Bu süzgeci kaldır"
                            className="group flex h-8 max-w-[240px] items-center gap-1.5 rounded-full bg-white/[0.05] pl-2.5 pr-1.5 text-[12.5px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.09] hover:text-metin">
                            <c.ikon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{c.ad}</span>
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] group-hover:bg-white/[0.14]"><X className="h-3 w-3" /></span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 border-t border-white/[0.06] px-4 py-3">
                    <button onClick={temizle} className="flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium text-metin ring-1 ring-inset ring-white/[0.12] transition hover:bg-white/[0.06] active:scale-[0.97]">
                      <RotateCcw className="h-4 w-4" />Süzgeçleri temizle
                    </button>
                    {akisAra.trim() && (
                      <button onClick={() => { setPrompt(akisAra.trim()); temizle(); toast.success("İstem komut kutusuna yazıldı", { description: "Modeli ve oranı seçip üret." }); }}
                        className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition active:scale-[0.97]">
                        <Sparkles className="h-4 w-4" />Bununla görsel üret
                      </button>
                    )}
                  </div>
                </motion.section>
              );
            }
            const gruplar: { etiket: string; liste: typeof gorselUretimleri }[] = [];
            for (const u of suzulmus) {
              const e = gunEtiketi(u.olusturma);
              const son = gruplar[gruplar.length - 1];
              if (son && son.etiket === e) son.liste.push(u); else gruplar.push({ etiket: e, liste: [u] });
            }
            return gruplar.map((g, gi) => {
              const bitenler = g.liste.filter((u) => u.durum === "tamam").map((u) => u.id);
              const hepsiSecili = bitenler.length > 0 && bitenler.every((id) => secililer.includes(id));
              const suren = g.liste.length - bitenler.length - g.liste.filter((u) => u.durum === "hata").length;
              return (
              <motion.section key={g.etiket} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(gi * 0.05, 0.2) }} >
                <div className="flex items-center gap-2 px-1 pb-2.5 pt-1">
                  <h2 className="flex h-8 items-center rounded-full bg-white/[0.08] px-3 text-[14px] font-semibold text-metin">{g.etiket}</h2>
                  <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-2">{g.liste.length} görsel</span>
                  {suren > 0 && <span className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] text-metin-2"><Loader2 className="h-3 w-3 animate-spin" />{suren} sürüyor</span>}
                  <span className="flex-1" />
                  {bitenler.length > 1 && (
                    <button onClick={() => { if (hepsiSecili) bitenler.forEach((id) => secimToggle(id)); else bitenler.filter((id) => !secililer.includes(id)).forEach((id) => secimToggle(id)); }}
                      className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition active:scale-[0.97]", hepsiSecili ? "bg-white text-black" : "bg-white/[0.08] text-metin-2 hover:bg-white/[0.13] hover:text-metin")}>
                      <Check className="h-3.5 w-3.5" />{hepsiSecili ? "Seçimi kaldır" : "Tümünü seç"}
                    </button>
                  )}
                </div>
                <div className="[column-fill:balance]" style={{ columnCount: sutunSayisi, columnGap: 6 }}>
        {g.liste.map((u) => {
          const bitti = u.durum === "tamam";
          const hata = u.durum === "hata";
          // Gerçek en-boy oranı — kartın doğal yüksekliğini belirler (madde 14).
          const or = oranSayi(u);
          const arka = u.gorselUrl
            ? (/^(data:|https?:|\/)/.test(u.gorselUrl) ? `url("${u.gorselUrl}") center/cover no-repeat` : u.gorselUrl)
            : "linear-gradient(135deg,#1a1725,#12101a)";
          const secili = secililer.includes(u.id);
          return (
            <motion.div
              key={u.id}
             
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              draggable={bitti && !!u.gorselUrl}
              onDragStart={(e) => bitti && u.gorselUrl && surukleBasla(e as unknown as React.DragEvent, u.gorselUrl)}
              className={cn("group relative mb-1.5 block break-inside-avoid overflow-hidden rounded-[12px]", secili && "outline outline-2 -outline-offset-2 outline-white")}
            >
              <div
                role={bitti ? "button" : undefined}
                tabIndex={bitti ? 0 : undefined}
                onClick={() => bitti && u.gorselUrl && lightboxAc(u.gorselUrl)}
                onKeyDown={(e) => { if (bitti && u.gorselUrl && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); lightboxAc(u.gorselUrl); } }}
                className={cn("relative block w-full", bitti ? "cursor-pointer" : "cursor-default")}
                style={{ aspectRatio: String(or), background: hata ? "linear-gradient(135deg,#181818,#0f1113)" : arka }}
                aria-label={bitti ? "Üretilen görseli aç" : hata ? "Üretim başarısız" : "Üretiliyor"}
              >
                {/* Üretiliyor — oluşan görsel animasyonu, model, süre, istem, iptal */}
                {!bitti && !hata && <UretimYukleniyor u={u} siraNo={uretimSirasi(u.id) || undefined} onIptal={() => uretimIptal(u.id)} />}
                {/* Başarısız — neden + kredi iadesi + Tekrar dene / Sil */}
                {hata && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-3 text-center">
                    <span className="flex flex-wrap items-center justify-center gap-1.5">
                      <span className="flex items-center gap-1.5 rounded-full bg-rose-400/[0.12] px-2.5 py-1 text-[12px] font-semibold text-rose-200 ring-1 ring-inset ring-rose-300/25">
                        <XCircle className="h-3.5 w-3.5" /> {u.hata === "İptal edildi" ? "İptal edildi" : "Başarısız"}
                      </span>
                      {u.kredi > 0 && <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-metin-2">Kredi iade edildi</span>}
                    </span>
                    <span className="line-clamp-2 text-[12px] leading-snug text-metin-2" title={u.hata}>{u.hata && u.hata !== "İptal edildi" ? u.hata : "Tekrar dene ya da istemini değiştir."}</span>
                    <span className="flex flex-wrap items-center justify-center gap-1.5">
                      <button onClick={(e) => { e.stopPropagation(); yenidenUret(u.prompt || u.baslik); }}
                        className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 text-[12.5px] font-semibold text-black transition active:scale-95">
                        <RotateCcw className="h-3.5 w-3.5" /> Tekrar dene
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); silUretim(u.id); mesaj.silindi("Üretim", () => uretimGeriYukle(u)); }} aria-label="Sil"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 ring-1 ring-inset ring-white/[0.12] transition hover:text-metin active:scale-95">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </span>
                )}
              </div>

              {bitti && u.gorselUrl && (
                <>
                  {/* Hover vignette — dört kenardan içeri koyu */}
                  <span className="uretim-vignette" />
                  {/* Gerçek sağlayıcı çıktısı değilse dürüstçe belirt */}
                  {/* Seçim kutusu sol üst */}
                  <button
                    onClick={(e) => { e.stopPropagation(); secimToggle(u.id); }}
                    aria-label={secili ? "Seçimi kaldır" : "Seç"} aria-pressed={secili}
                    className={cn(
                      "absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-md border-2 backdrop-blur-sm transition-all",
                      secili ? "border-white bg-white text-black opacity-100" : "pointer-events-none border-white/70 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100",
                    )}
                  >
                    {secili && <Check className="h-3 w-3" strokeWidth={3.5} />}
                  </button>
                  <KartAraclari
                    begenili={!!u.favori}
                    onBegen={() => { favoriToggle(u.id); toast.success(u.favori ? "Beğenilerden çıkarıldı" : "Beğenilere eklendi"); }}
                    onIndir={() => gorseliIndir(u.gorselUrl, u.baslik || "vayra-gorsel")}
                    onKopyala={() => uretimiGeriYukle(u)}
                    onAc={() => lightboxAc(u.gorselUrl!)}
                    gorselUrl={u.gorselUrl}
                    onYenidenUret={() => yenidenUret(u.prompt || u.baslik)}
                    onReferans={() => referansEkle(u.gorselUrl!)}
                    onAnimate={() => animasyonaGec(u.gorselUrl!)}
                    on3d={() => sahne3dOlustur(u.gorselUrl!)}
                    onVaryasyon={(g) => varyasyonUret(u.gorselUrl!, u, g)}
                    onBuyut={() => buyutAc(u.gorselUrl!, u.id)}
                    onElement={() => elementModalAc(u.gorselUrl, u.baslik || u.prompt)}
                    onYayinla={() => { guncelle(u.id, { yayinda: true }); toast.success("Toplulukta yayınlandı", { description: "Keşfet akışında görünecek.", action: { label: "Geri al", onClick: () => guncelle(u.id, { yayinda: false }) } }); }}
                    klasorler={klasorListesi}
                    onKlasoreEkle={(kid) => klasoreEkle(kid, u.id)}
                    onYeniKlasor={() => yeniKlasoreEkle(u.id)}
                    indirmeFormatlari={[...INDIRME_FORMATLARI]}
                    onFormatIndir={(f) => { void gorseliFormatlaIndir(u.gorselUrl!, u.baslik || "vayra-gorsel", f); toast.success("Görsel indiriliyor", { description: `${f.toUpperCase()} biçiminde iner.` }); }}
                    onSil={() => { silUretim(u.id); mesaj.silindi("Üretim", () => uretimGeriYukle(u)); }}
                  />
                </>
              )}
            </motion.div>
          );
        })}
                </div>
              </motion.section>
              );
            });
          }

          return (
            <>
              {baslangic}
              <section>
                <div className="flex items-center gap-2 px-1 pb-2.5 pt-1">
                  <h2 className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[14px] font-semibold text-metin"><Lightbulb className="h-4 w-4 text-metin-2" />İlham galerisi</h2>
                  <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] text-metin-2">Örnek görseller</span>
                  <span className="flex-1" />
                  <span className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1 text-[12px] text-metin-2 max-md:hidden"><ImagePlus className="h-3.5 w-3.5" />Referans için kutuya sürükle</span>
                </div>
                <div className="[column-fill:balance]" style={{ columnCount: sutunSayisi, columnGap: 6 }}>
        {TUM_GORSELLER.map((url, i) => {
          const id = url + i;
          if (gizliStok.includes(id)) return null; // "Sil" denen stok görsel gizlenir
          const begenili = begeni.includes(id);
          const secili = secililer.includes(id);
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.01, 0.35) }}
              draggable
              onDragStart={(e) => surukleBasla(e as unknown as React.DragEvent, url)}
              onMouseEnter={() => setHover(id)}
              onMouseLeave={() => { setHover(id === hover ? null : hover); if (menu !== id) setMenu((m) => (m === id ? null : m)); }}
              className={cn("group relative mb-1.5 block break-inside-avoid overflow-hidden rounded-[12px]", secili && "outline outline-2 -outline-offset-2 outline-white")}
            >
              <button type="button" onClick={() => lightboxAc(url)} className="block w-full cursor-pointer" aria-label="Görseli aç">
                <img src={url} alt="" loading="lazy" draggable={false} className="block w-full transition-transform duration-300 group-hover:scale-[1.03]" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); secimToggle(id); }}
                aria-label={secili ? "Seçimi kaldır" : "Seç"} aria-pressed={secili}
                className={cn(
                  "absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-md border-2 backdrop-blur-sm transition-all",
                  secili ? "border-white bg-white text-black opacity-100" : "pointer-events-none border-white/70 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100",
                )}
              >
                {secili && <Check className="h-3 w-3" strokeWidth={3.5} />}
              </button>
              <span className="uretim-vignette" />
              <KartAraclari
                begenili={begenili}
                onBegen={() => { setBegeni((v) => begenili ? v.filter((x) => x !== id) : [...v, id]); toast.success(begenili ? "Beğenilerden çıkarıldı" : "Beğenilere eklendi"); }}
                onIndir={() => gorseliIndir(url, "vayra-gorsel")}
                onAc={() => lightboxAc(url)}
                onReferans={() => referansEkle(url)}
                onAnimate={() => animasyonaGec(url)}
                on3d={() => sahne3dOlustur(url)}
                onVaryasyon={(g) => varyasyonUret(url, undefined, g)}
                onBuyut={() => buyutAc(url)}
                onElement={() => elementModalAc(url)}
                gorselUrl={url}
                indirmeFormatlari={[...INDIRME_FORMATLARI]}
                onFormatIndir={(f) => { void gorseliFormatlaIndir(url, `vayra-ornek`, f); toast.success("Görsel indiriliyor", { description: `${f.toUpperCase()} biçiminde iner.` }); }}
              />
            </motion.div>
          );
        })}
                </div>
              </section>
            </>
          );
        })()}
      </div>

      {/* Seçim toolbar'ı — seçim varken composer yerine (Higgsfield birebir) */}
      <AnimatePresence>
        {secimVar && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
          >
            {/* Boyut bir tık büyütüldü (kullanıcı kararı 2026-07-31):
                py-2→py-2.5, metin 13→14.5px, ikonlar 4→4.5, dokunma
                hedefleri 9→10 birim. Alt composer dock'una yakın durduğu için
                fazlası dengeyi bozardı. */}
            <div className="cam-istemci relative flex items-center gap-1 rounded-full p-2 pl-2.5">
              <span className="hidden -space-x-3 sm:flex">
                {secililer.slice(0, 3).map((id) => { const s = gorselUretimleri.find((u) => u.id === id)?.gorselUrl; return s ? <img key={id} src={s} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} className="h-10 w-10 rounded-full bg-white/10 object-cover ring-2 ring-[#1c1d20]" /> : null; })}
              </span>
              <span className="whitespace-nowrap pl-2.5 pr-1.5 text-[16px] font-semibold tabular-nums text-white">{secililer.length} seçili</span>
              <span className="mx-1 h-7 w-px bg-white/10" />
              <button onClick={topluGorselIndir} className="flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[15px] font-medium text-white/75 transition-colors hover:bg-white/[0.07] hover:text-white active:scale-95"><Download className="h-5 w-5" /><span className="hidden sm:inline">İndir</span></button>
              <button onClick={topluYayinla} className="flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[15px] font-medium text-white/75 transition-colors hover:bg-white/[0.07] hover:text-white active:scale-95"><Sparkles className="h-5 w-5" /><span className="hidden sm:inline">Yayınla</span></button>
              <div className="relative">
                <button onClick={() => setTopluKlasorAcik((v) => !v)} aria-expanded={topluKlasorAcik} className={cn("flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[15px] font-medium transition-colors active:scale-95", topluKlasorAcik ? "bg-white/[0.12] text-white" : "text-white/75 hover:bg-white/[0.07] hover:text-white")}><FolderPlus className="h-5 w-5" /><span className="hidden sm:inline">Klasöre ekle</span></button>
                <AnimatePresence>
                  {topluKlasorAcik && (
                    <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }} transition={{ duration: 0.16 }}
                      className="absolute bottom-full left-1/2 mb-3 w-64 -translate-x-1/2 overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]">
                      <MenuKart className="rounded-none ring-0" baslik="Klasöre ekle" sag={<span className="text-[11.5px] tabular-nums text-metin-3">{klasorListesi.length}</span>}>
                        <div className="max-h-[260px] overflow-y-auto p-1 [scrollbar-width:thin]">
                          {klasorListesi.map((k) => (
                            <button key={k.id} onClick={() => topluKlasoreEkle(k.id)} className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2 text-left text-[13px] text-metin transition-colors hover:bg-white/[0.06]">
                              <FolderPlus className="h-4 w-4 shrink-0 text-metin-2" /><span className="min-w-0 flex-1 break-words">{k.ad}</span><span className="text-[11.5px] tabular-nums text-metin-3">{k.adet}</span>
                            </button>
                          ))}
                          <button onClick={() => topluKlasoreEkle(null)} className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2 text-left text-[13px] font-medium text-metin transition-colors hover:bg-white/[0.06]"><Plus className="h-4 w-4 shrink-0" />Yeni klasör</button>
                        </div>
                      </MenuKart>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {(() => { const hepsi = secililer.length > 0 && secililer.every((id) => begeni.includes(id)); return (
                <button onClick={() => { if (hepsi) { setBegeni((v) => v.filter((x) => !secililer.includes(x))); toast.success("Beğeniler kaldırıldı"); } else { setBegeni((v) => [...new Set([...v, ...secililer])]); toast.success(`${secililer.length} görsel beğenilere eklendi`); } }}
                  className={cn("flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/[0.07] active:scale-95", hepsi ? "text-rose-400" : "text-white/75 hover:text-white")} aria-label={hepsi ? "Beğeniyi kaldır" : "Beğen"}><Heart className={cn("h-5 w-5", hepsi && "fill-current")} /></button>); })()}
              <button onClick={topluSil} className="flex h-11 w-11 items-center justify-center rounded-full text-rose-300 transition-colors hover:bg-rose-500/10 active:scale-95" aria-label="Sil"><Trash2 className="h-5 w-5" /></button>
              <span className="mx-1 h-7 w-px bg-white/10" />
              <button onClick={() => { setTopluKlasorAcik(false); secimTemizle(); }} className="flex h-11 w-11 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/[0.07] hover:text-white active:scale-95" aria-label="Seçimi temizle"><X className="h-5 w-5" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Yüzen alt prompt dock (seçim yokken görünür) */}
      {/* Gömülüyken dock SABİT DEĞİL, akışta durur (dış sayfa altta konumlar). */}
      <div className={cn("flex justify-center transition-opacity",
        gomulu ? "w-full" : "pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#0d0e10]/80 via-transparent to-transparent px-4 pb-5 pt-14",
        secimVar && !gomulu && "pointer-events-none opacity-0")}>
        <div
          className={cn("cam-istemci pointer-events-auto relative w-full rounded-[26px] p-3 transition-shadow",
          gomulu ? "max-w-none" : "max-w-[1120px]", surukleUstunde && "ring-2 ring-white/60")}
          onPaste={(e) => {
            const dosyalar = Array.from(e.clipboardData?.files ?? []).filter((d) => d.type.startsWith("image/"));
            if (!dosyalar.length || swapMu) return;
            e.preventDefault();
            const dt = new DataTransfer(); dosyalar.forEach((d) => dt.items.add(d));
            referansYukle(dt.files);
          }}
          onDragOver={(e) => { if (swapMu || !(e.dataTransfer.types.includes("Files") || e.dataTransfer.types.includes("application/x-vayra-gorsel"))) return; e.preventDefault(); setSurukleUstunde(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setSurukleUstunde(false); }}
          onDrop={(e) => {
            if (swapMu) return;
            e.preventDefault(); setSurukleUstunde(false);
            // Galeriden sürüklenen görsel: doğrudan referans olur.
            const galeri = e.dataTransfer.getData("application/x-vayra-gorsel");
            if (galeri) return void referansEkle(galeri);
            const dosyalar = Array.from(e.dataTransfer.files).filter((d) => d.type.startsWith("image/"));
            if (!dosyalar.length) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
            const dt = new DataTransfer(); dosyalar.forEach((d) => dt.items.add(d));
            referansYukle(dt.files);
          }}>
          <AnimatePresence>
            {surukleUstunde && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-[26px] bg-[#26272c]/95 text-[14px] font-semibold text-metin">
                <ImagePlus className="mr-2 h-5 w-5" /> Referans olarak eklemek için bırak
              </motion.div>
            )}
          </AnimatePresence>
          {/* Boyut tutamağı — kutunun tepesinde: yukarı çek büyüt, aşağı küçült. */}
          {!swapMu && !gomulu && (
            <div onPointerDown={promptSurukle}
              className="group/tut absolute -top-1.5 left-1/2 z-20 flex h-5 w-24 -translate-x-1/2 cursor-ns-resize items-center justify-center"
              aria-label="Kutu boyutunu ayarla" title="Sürükleyerek kutuyu büyüt ya da küçült">
              <span className="h-[5px] w-12 rounded-full bg-white/25 transition-all group-hover/tut:h-[6px] group-hover/tut:w-14 group-hover/tut:bg-white/50" />
            </div>
          )}

          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              {/* Referanslar: küçük resim + altında rol seçici (Genel, Stil, Karakter, Kompozisyon, Ürün). */}
              <AnimatePresence initial={false}>
              {referanslar.length > 0 && !swapMu && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mb-2.5 flex items-start gap-2 overflow-x-auto px-0.5 pb-0.5 pt-1 [scrollbar-width:none]">
                  {referanslar.map((r, i) => {
                    const rol = REF_ROLLERI.find((x) => x.id === (r.rol ?? "genel"))!;
                    const gonderilmez = aktifModelTanim.api.refMax > 0 && i >= aktifModelTanim.api.refMax;
                    return (
                    <motion.div key={r.url + i} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="relative flex w-16 shrink-0 flex-col items-center gap-1">
                      <span onMouseEnter={(e) => setRefHover({ i, r: e.currentTarget.getBoundingClientRect() })} onMouseLeave={() => setRefHover(null)}
                        className={cn("group/ref relative h-16 w-16 overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/15", gonderilmez && "opacity-40")}>
                        <button onClick={() => setMedyaOnizle(r.url)} className="block h-full w-full" aria-label="Referansı büyüt" title={r.ad}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={r.url} alt={r.ad} className="h-full w-full object-cover" />
                          <span className="pointer-events-none absolute inset-0 bg-black/35 opacity-0 transition-opacity group-hover/ref:opacity-100" />
                        </button>
                        <span className="pointer-events-none absolute bottom-1 left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black/60 px-1 text-[10px] font-semibold tabular-nums text-white">{i + 1}</span>
                        <button onClick={() => setReferanslar((v) => v.filter((_, j) => j !== i))} aria-label="Referansı kaldır"
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition-opacity hover:bg-rose-500 focus-visible:opacity-100 group-hover/ref:opacity-100 [@media(hover:none)]:opacity-100">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                      <button onClick={() => { setRefHover(null); setRolMenu(rolMenu === i ? null : i); }} aria-expanded={rolMenu === i} title={gonderilmez ? `${model} bu referansı kullanmaz` : rol.alt}
                        className={cn("flex h-6 max-w-full items-center gap-0.5 rounded-full px-2 text-[11px] font-medium transition", rol.id === "genel" ? "text-metin-2 hover:bg-white/[0.06] hover:text-metin" : "bg-white text-black")}>
                        <span className="truncate">{rol.ad}</span><ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
                      </button>
                      <Yuzen acik={rolMenu === i} onKapat={() => setRolMenu(null)} yerlesim="ust-sol" bosluk={8} etiket="Referansın rolü"
                        className="w-[min(290px,calc(100vw-24px))] overflow-hidden rounded-[20px] border border-white/[0.09] bg-[#1b1c1f]">
                        <MenuKart className="rounded-none ring-0" baslik={<span className="flex items-center gap-2.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.url} alt="" className="h-7 w-7 shrink-0 rounded-[8px] object-cover ring-1 ring-white/15" />
                            <span className="leading-tight"><span className="block">{i + 1}. referans ne için?</span><span className="block text-[11.5px] font-normal text-metin-3">Model bu görselden neyi alsın</span></span>
                          </span>}>
                          <div className="space-y-1 p-1.5">
                            {REF_ROLLERI.map((x, k) => {
                              const I = ({ genel: Sparkles, stil: Palette, karakter: UserRound, kompozisyon: Crop, urun: Package } as Record<string, typeof Sparkles>)[x.id] ?? Sparkles;
                              const sec = rol.id === x.id;
                              return (
                                <motion.button key={x.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.025 * k }} whileTap={{ scale: 0.98 }} aria-pressed={sec}
                                  onClick={() => { setReferanslar((v) => v.map((y, j) => (j === i ? { ...y, rol: x.id } : y))); setRolMenu(null); }}
                                  className={cn("flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left ring-1 ring-inset transition-[background-color,box-shadow]", sec ? "bg-white/[0.07] ring-white/60" : "ring-transparent hover:bg-white/[0.05]")}>
                                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", sec ? "bg-white text-black" : "bg-white/[0.06] text-metin-2")}><I className="h-4 w-4" /></span>
                                  <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-metin">{x.ad}</span><span className="block text-[11.5px] leading-snug text-metin-2">{x.alt}</span></span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </MenuKart>
                      </Yuzen>
                    </motion.div>
                    );
                  })}
                  {typeof document !== "undefined" && createPortal(
                    <AnimatePresence>
                      {refHover && referanslar[refHover.i] && rolMenu === null && (() => {
                        const x = referanslar[refHover.i];
                        const rl = REF_ROLLERI.find((y) => y.id === (x.rol ?? "genel"))!;
                        const disarida = aktifModelTanim.api.refMax > 0 && refHover.i >= aktifModelTanim.api.refMax;
                        const rr = refHover.r;
                        return (
                          <motion.span key={"rh" + refHover.i} initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.14 }}
                            className="menu-surface pointer-events-none fixed z-[300] w-60 overflow-hidden rounded-2xl"
                            style={{ left: Math.max(8, Math.min(rr.left, window.innerWidth - 252)), bottom: window.innerHeight - rr.top + 8 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={x.url} alt="" className="block max-h-[300px] w-full object-cover" />
                            <span className="block p-3">
                              <span className="flex items-center gap-1.5">
                                <span className="truncate text-[13.5px] font-semibold text-metin">{refHover.i + 1}. referans</span>
                                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", rl.id === "genel" ? "bg-white/[0.08] text-metin-2" : "bg-white text-black")}>{rl.ad}</span>
                              </span>
                              <span className="mt-1 block text-[12px] leading-relaxed text-metin-2">{disarida ? `${model} en fazla ${aktifModelTanim.api.refMax} referans kullanır; bu görsel gönderilmez.` : rl.alt}</span>
                              {x.ad && !/^(Referans|Üretilen görsel|Remix kaynağı)/.test(x.ad) && <span className="mt-1 block truncate text-[11.5px] text-metin-3">{x.ad}</span>}
                            </span>
                          </motion.span>
                        );
                      })()}
                    </AnimatePresence>,
                    document.body,
                  )}
                  {referanslar.length < REF_UST && (
                    <button onClick={() => medyaRef.current?.click()}
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] bg-white/[0.08] text-metin-2 transition hover:bg-white/[0.13] hover:text-metin active:scale-95"
                      aria-label="Görsel ekle">
                      <Plus className="h-6 w-6" />
                    </button>
                  )}
                  {/* Modelin referans sınırı: fazlası gönderilmez, açıkça söylenir. */}
                  <span className={cn("ml-1 mt-5 shrink-0 rounded-full px-2.5 py-1 text-[11.5px] tabular-nums ring-1 ring-inset", referanslar.length > aktifModelTanim.api.refMax ? "bg-amber-300/10 text-amber-100 ring-amber-300/25" : "text-metin-2 ring-white/[0.08]")}
                    title={aktifModelTanim.api.refMax ? `${model} en fazla ${aktifModelTanim.api.refMax} referans görsel kullanır` : `${model} referans görsel kullanmaz`}>
                    {aktifModelTanim.api.refMax
                      ? `${Math.min(referanslar.length, aktifModelTanim.api.refMax)}/${aktifModelTanim.api.refMax} referans${referanslar.length > aktifModelTanim.api.refMax ? `, ${referanslar.length - aktifModelTanim.api.refMax} tanesi gönderilmez` : ""}`
                      : `${model} referans almaz`}
                  </span>
                </div>
                </motion.div>
              )}
              </AnimatePresence>
                </div>
          {/* İstem araçları: element, istem fikirleri, geliştir, çiz */}
          {!swapMu && (
            <div className="ml-auto flex shrink-0 flex-row-reverse items-center gap-2">
              <div className="flex items-center gap-0.5 rounded-full p-1" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(14px) saturate(1.25)", WebkitBackdropFilter: "blur(14px) saturate(1.25)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(255,255,255,0.09)" }}>
              <button onClick={() => setElementSeciciModal(true)}
                className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.1] hover:text-metin active:scale-[0.97]">
                <AtSign className="h-3.5 w-3.5" /> Element
              </button>
              <div className="relative">
                <button onClick={() => setIstemAcik((v) => !v)} aria-expanded={istemAcik}
                  className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition active:scale-[0.97]", istemAcik ? "bg-white/[0.14] text-metin" : "text-metin-2 hover:bg-white/[0.1] hover:text-metin")}>
                  <Lightbulb className="h-3.5 w-3.5" /> İstem fikirleri
                </button>
                <Yuzen acik={istemAcik} onKapat={() => setIstemAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="İstem fikirleri"
                  className="max-h-[min(72vh,600px)] w-[min(420px,calc(100vw-24px))] overflow-y-auto rounded-[20px] border border-white/[0.09] bg-[#1b1c1f] p-2 [scrollbar-width:thin]">
                  {sonIstemler.length > 0 && (
                    <MenuKart baslik={<span className="flex items-center gap-1.5"><History className="h-3.5 w-3.5 text-metin-2" />Son istemlerin</span>}
                      sag={<span className="text-[11.5px] tabular-nums text-metin-3">{sonIstemler.length}</span>}>
                      <div className="divide-y divide-white/[0.05]">
                        {sonIstemler.map((p, i) => (
                          <motion.button key={p} role="menuitem" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 * i }}
                            onClick={() => { setPrompt(p); setIstemAcik(false); promptRef.current?.focus(); }}
                            className="group flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]">
                            <span className="min-w-0 flex-1 text-[13px] leading-snug text-metin-2 transition-colors group-hover:text-metin">{p}</span>
                            <span className="mt-0.5 shrink-0 text-[11.5px] font-medium text-metin-3 opacity-0 transition-opacity group-hover:opacity-100">Kullan</span>
                          </motion.button>
                        ))}
                      </div>
                    </MenuKart>
                  )}
                  <MenuKart baslik={<span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-metin-2" />Fikirler</span>}
                    sag={<span className="text-[11.5px] text-metin-3">Model ve oranıyla gelir</span>}>
                    <div className="grid grid-cols-2 gap-1.5 p-1.5">
                      {HIZLI_BASLANGIC.map((h, i) => (
                        <motion.button key={h.baslik} role="menuitem" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }} whileTap={{ scale: 0.97 }}
                          onClick={() => { setPrompt(h.istem); modelSec(h.model); setOran(h.oran); setIstemAcik(false); promptRef.current?.focus(); }}
                          title={h.istem}
                          className="group relative aspect-[4/3] overflow-hidden rounded-[12px] text-left ring-1 ring-inset ring-white/[0.07] transition-[box-shadow] hover:ring-white/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={h.gorsel} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                          <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-black/45 px-1.5 py-px text-[10.5px] font-medium tabular-nums text-white/90 backdrop-blur-md">{h.oran}</span>
                          <span className="absolute inset-x-2 bottom-1.5">
                            <span className="block text-[12.5px] font-semibold leading-tight text-white">{h.baslik}</span>
                            <span className="block text-[11px] leading-tight text-white/65">{h.model}</span>
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </MenuKart>
                  <MenuKart baslik={<span className="flex items-center gap-1.5"><ImagePlus className="h-3.5 w-3.5 text-metin-2" />Görselden istem çıkar</span>}
                    sag={yardimciHazir === false ? <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-metin-2">Kapalı</span> : undefined}>
                    <p className="px-3 pt-2.5 text-[12.5px] leading-snug text-metin-2">
                      {yardimciHazir === false ? "İstem yardımcısı (Gemini) bağlı değil. Bağlanınca bir görseli tarif eden istemler önerilir." : "Bir görsel ver, onu yeniden üretecek istemler önerilsin."}
                    </p>
                    <div className="flex gap-1.5 p-2">
                      {referanslar[0] && (
                        <button onClick={() => void tarifEt(referanslar[0].url)} disabled={tarifYukleniyor || yardimciHazir === false}
                          className="flex h-10 flex-1 items-center gap-2 rounded-[11px] bg-white/[0.04] pl-1.5 pr-2.5 text-left text-[12.5px] font-medium text-metin ring-1 ring-inset ring-white/[0.06] transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={referanslar[0].url} alt="" className="h-7 w-7 rounded-[8px] object-cover" /> İlk referanstan
                        </button>
                      )}
                      <button onClick={() => tarifDosyaRef.current?.click()} disabled={tarifYukleniyor || yardimciHazir === false}
                        className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[11px] bg-white/[0.04] px-3 text-[12.5px] font-medium text-metin ring-1 ring-inset ring-white/[0.06] transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45">
                        {tarifYukleniyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Görsel seç
                      </button>
                    </div>
                    {tarifler && tarifler.length > 0 && (
                      <div className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
                        {tarifler.map((t, i) => (
                          <motion.button key={t} role="menuitem" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}
                            onClick={() => { setPrompt(t); setIstemAcik(false); setTarifler(null); promptRef.current?.focus(); }}
                            className="block w-full px-3 py-2.5 text-left text-[12.5px] leading-snug text-metin-2 transition-colors hover:bg-white/[0.04] hover:text-metin">{t}</motion.button>
                        ))}
                      </div>
                    )}
                    <input ref={tarifDosyaRef} type="file" accept="image/png,image/jpeg,image/webp" hidden
                      onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) void dosyaOku(d).then(tarifEt); }} />
                  </MenuKart>
                </Yuzen>
              </div>
              <Tooltip side="top" label={yardimciHazir === false ? "İstem yardımcısı (Gemini) bağlı değil" : gelistir ? "Açık: istemin ayrıntılandırılıp İngilizceye çevrilerek gönderilir. Gönderilen hâli bilgi panelinde." : "Kapalı: istem olduğu gibi gönderilir (Türkçe ise yalnız çevrilir)."}>
                <button onClick={() => setGelistir(!gelistir)} disabled={yardimciHazir === false} role="switch" aria-checked={gelistirEtkin}
                  className={cn("flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45",
                    gelistirEtkin ? "bg-white/[0.1] text-metin" : "text-metin-2 hover:bg-white/[0.06] hover:text-metin")}>
                  <Wand2 className="h-3.5 w-3.5" /> İstemi geliştir
                  <span className={cn("relative ml-0.5 h-3.5 w-6 rounded-full transition-colors", gelistirEtkin ? "bg-white" : "bg-white/20")}>
                    <span className={cn("absolute top-[2px] h-2.5 w-2.5 rounded-full transition-[left,background-color]", gelistirEtkin ? "left-[12px] bg-black" : "left-[2px] bg-white")} />
                  </span>
                </button>
              </Tooltip>
              {aktifModelTanim.cizim && (
                <button onClick={() => { setCizimSekme("edit"); if (referanslar[0]) setCizimArka(referanslar[0].url); setCizimModal(true); }}
                  className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.06] hover:text-metin active:scale-[0.97]">
                  <Pencil className="h-3.5 w-3.5" /> Çizerek düzenle
                </button>
              )}
              </div>
            </div>
          )}
  
            </div>

          {swapMu ? (
            /* Swap modelleri (Yüz/Karakter Değiştir): istem yerine iki yükleme kutusu */
            <div className="grid grid-cols-2 gap-3">
              <input ref={swapKaynakRef} type="file" accept="image/*" className="hidden" onChange={(e) => { swapYukle(e.target.files, "kaynak"); e.target.value = ""; }} />
              <input ref={swapHedefRef} type="file" accept="image/*" className="hidden" onChange={(e) => { swapYukle(e.target.files, "hedef"); e.target.value = ""; }} />
              {([
                { url: swapKaynak, ref: swapKaynakRef, temizle: () => setSwapKaynak(null), ik: UserSquare, baslik: "Senin fotoğrafın", alt: yuzMu ? "Eklemek istediğin yüzü yükle" : "Eklemek istediğin karakteri yükle" },
                { url: swapHedef, ref: swapHedefRef, temizle: () => setSwapHedef(null), ik: ImagePlus, baslik: "Hedef görsel", alt: yuzMu ? "Değiştirilecek yüzün olduğu fotoğraf" : "Değiştirilecek karakterin olduğu fotoğraf" },
              ] as const).map((k, i) => (
                <button key={i} onClick={() => k.ref.current?.click()}
                  className="group/swap relative flex min-h-[120px] flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] border border-dashed border-white/15 p-4 text-center transition-colors hover:border-white/35">
                  {k.url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={k.url} alt={k.baslik} className="absolute inset-0 h-full w-full object-cover" />
                      <span className="pointer-events-none absolute inset-0 bg-black/35 opacity-0 transition-opacity group-hover/swap:opacity-100" />
                      <span onClick={(e) => { e.stopPropagation(); k.temizle(); }}
                        className="glass-ikon pointer-events-none absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white opacity-0 transition-opacity hover:bg-tehlike group-hover/swap:pointer-events-auto group-hover/swap:opacity-100"><X className="h-3.5 w-3.5" /></span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06]"><k.ik className="h-5 w-5 text-metin-2" /></span>
                      <span className="text-[14px] font-semibold text-metin">{k.baslik}</span>
                      <span className="text-[12px] text-metin-2">{k.alt}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-2.5 px-0.5">
              <input ref={medyaRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => { referansYukle(e.target.files); e.target.value = ""; }} />
              {referanslar.length === 0 && (
                <Tooltip side="top" label="Referans görsel ekle (sürükle ya da Ctrl+V da olur)">
                  <button onClick={() => medyaRef.current?.click()}
                    className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white/[0.08] text-metin-2 transition hover:bg-white/[0.13] hover:text-metin active:scale-95" aria-label="Referans görsel ekle">
                    <ImagePlus className="h-5 w-5" />
                  </button>
                </Tooltip>
              )}
              <ElementMentionInput
                inputRef={promptRef}
                deger={prompt}
                onDeger={setPrompt}
                onEnter={uret}
                cokSatir
                otoBuyu
                enBuyuk={340}
                elYukseklikDis={promptYuk}
                placeholder="Ne görmek istediğini anlat. @ ile element ekle, görsel sürükle ya da yapıştır"
                className="block w-full bg-transparent px-1 py-2.5 text-[16px] leading-relaxed text-metin outline-none placeholder:text-metin-2"
              />
            </div>
          )}

          {/* ═══ RUH modeli: Karakter + Ruh panosu ═══ */}
          {soulMu && !karsilastir && (
            <div className="mt-2 flex items-stretch gap-2 px-0.5">
              <button onClick={() => setKarakterModal(true)}
                className={cn("flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[14px] text-metin-2 transition hover:text-metin", seciliKarakterEl ? "ring-2 ring-white" : "border border-dashed border-white/15 hover:border-white/35")}>
                {seciliKarakterEl ? (
                  <ElementKapak e={seciliKarakterEl} className="h-full w-full" ikonBoyut={14} />
                ) : (
                  <><Plus className="h-4 w-4" /><span className="text-[10.5px] font-medium">Karakter</span></>
                )}
              </button>
              <button onClick={() => setMoodboardModal(true)}
                className="group/mb relative h-[60px] min-w-0 flex-1 overflow-hidden rounded-[14px] text-left ring-1 ring-inset ring-white/[0.1] transition hover:ring-white/30">
                {seciliPano ? (
                  <span className="absolute inset-0 flex">
                    {seciliPano.gorseller.slice(0, 3).map((g) => <span key={g} className="h-full flex-1 bg-cover bg-center" style={{ backgroundImage: `url("${g}")` }} />)}
                  </span>
                ) : <span className="absolute inset-0 bg-white/[0.03]" />}
                <span className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20" />
                <span className="absolute inset-y-0 left-3 flex flex-col justify-center leading-tight">
                  <span className="text-[11px] text-white/65">Ruh panosu</span>
                  <span className="text-[13.5px] font-semibold text-white">{seciliPano?.ad ?? "Pano yok, istem belirler"}</span>
                </span>
                <span className="absolute right-3 top-1/2 flex h-7 -translate-y-1/2 items-center gap-1 rounded-full bg-black/50 px-2.5 text-[11.5px] font-medium text-white backdrop-blur"><Pencil className="h-3 w-3" /> {seciliPano ? "Değiştir" : "Seç"}</span>
              </button>
            </div>
          )}

          {/* Ayar çipleri + Üret */}
          <div className="mt-2.5 flex items-center gap-2 border-t border-white/[0.08] pt-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
              {/* Model */}
              <div className="relative shrink-0">
                <BCip acik={modelAcik} onClick={() => setModelAcik((v) => !v)} etiket={karsilastir ? "Karşılaştır" : "Model"}
                  ikon={karsilastir
                    ? <span className="flex -space-x-1.5">{cokluModel.slice(0, 3).map((ad) => <span key={ad} className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2a2c2f] ring-2 ring-[#1c1e20]"><ModelLogo ad={ad} boyut={12} /></span>)}</span>
                    : <ModelLogo ad={model} boyut={20} />}
                  deger={karsilastir ? `${cokluModel.length} model` : model} />
                <Yuzen acik={modelAcik} onKapat={() => { setModelAcik(false); if (cokluModel.length < 2) setCokluModel([]); }} yerlesim="ust-sol" bosluk={10} etiket="Model seç"
                  className="flex max-h-[min(72vh,580px)] w-[400px] flex-col overflow-hidden rounded-[20px] border border-white/[0.09] bg-[#1b1c1f]">
                  <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.07] p-2">
                    <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-white/[0.04] px-3 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/25">
                      <Search className="h-4 w-4 shrink-0 text-metin-3" />
                      <input value={modelAra} onChange={(e) => setModelAra(e.target.value)} placeholder="Model ara" aria-label="Model ara" autoFocus className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-metin-2" />
                    </label>
                    <Tooltip side="top" label="Aynı istemi en fazla 4 modelde aynı anda üret, sonuçları yan yana gör.">
                      <button role="switch" aria-checked={karsilastir} onClick={() => setCokluModel(karsilastir ? [] : karsilastirAday(aktifModelTanim) ? [model] : [])}
                        disabled={!karsilastir && !karsilastirAday(aktifModelTanim)}
                        className={cn("flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-[12.5px] font-medium ring-1 ring-inset transition active:scale-[0.97] disabled:opacity-40", karsilastir ? "bg-white text-black ring-white" : "text-metin-2 ring-white/[0.08] hover:text-metin")}>
                        <Columns3 className="h-4 w-4" />Karşılaştır
                      </button>
                    </Tooltip>
                  </div>
                  {karsilastir && (
                    <p className="mx-2 mt-2 shrink-0 rounded-[12px] bg-white/[0.04] px-3 py-2 text-[12px] leading-snug text-metin-2 ring-1 ring-inset ring-white/[0.06]">
                      En fazla 4 model seç. Her biri kendi desteklediği en yakın oran ve kaliteyle üretir.
                    </p>
                  )}
                  <div className="min-h-0 flex-1 overflow-y-auto p-1.5 [scrollbar-width:thin]">
                    {(() => {
                      const liste = karsilastir ? modelListe.filter(karsilastirAday) : modelListe;
                      const hepsiDemo = liste.length > 0 && liste.every((m) => !modelBagli(m));
                      const KartSatir = (m: GorselModel, k: string) => {
                        const secili = karsilastir ? cokluModel.includes(m.ad) : model === m.ad;
                        const dolu = karsilastir && !secili && cokluModel.length >= 4;
                        return (
                          <button key={k + m.ad} disabled={dolu}
                            onClick={() => {
                              if (!karsilastir) { modelSec(m.ad); setModelAcik(false); return; }
                              setCokluModel((v) => {
                                if (v.includes(m.ad)) { const y = v.filter((x) => x !== m.ad); if (!y.length) return v; if (m.ad === model) modelSec(y[0]); return y; }
                                return v.length >= 4 ? v : [...v, m.ad];
                              });
                            }}
                            className={cn("flex w-full items-center gap-3 rounded-[14px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-40", secili && "bg-white/[0.07]")}>
                            <span className="relative shrink-0">
                              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]">
                                <ModelLogo ad={m.ad} boyut={20} />
                              </span>
                              {m.rozet === "Yeni" && <Rozet sinif="absolute -left-1.5 -top-1.5">Yeni</Rozet>}
                              {m.rozet === "Sınırsız" && <Rozet sinif="absolute -left-1.5 -top-1.5 !bg-white !text-black">Sınırsız</Rozet>}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] font-medium leading-5 text-metin">{m.ad}</span>
                              <span className="line-clamp-2 text-[12px] leading-[17px] text-metin-2">{m.ozet}</span>
                            </span>
                            {hepsiDemo || modelBagli(m) ? (
                              <KrediHap deger={krediYaz(m.kredi ?? 2)} secili={secili} baslik={`Görsel başına ${krediYaz(m.kredi ?? 2)} kredi`} />
                            ) : (
                              <span
                                className="flex h-7 shrink-0 items-center rounded-full bg-white/[0.06] px-2.5 text-[12px] font-medium text-metin-2">Ücretsiz</span>
                            )}
                            <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center transition", karsilastir ? "rounded-[6px] border-2" : "rounded-full", secili ? "border-white bg-white text-black" : karsilastir ? "border-white/30" : "opacity-0")}>
                              {secili && <Check className="h-3 w-3" strokeWidth={3} />}
                            </span>
                          </button>
                        );
                      };
                      if (modelAra.trim()) return liste.length ? liste.map((m) => KartSatir(m, "a")) : <p className="px-3 py-6 text-center text-[13px] text-metin-2">&ldquo;{modelAra}&rdquo; ile eşleşen model yok</p>;
                      const son = sonModeller.map((ad) => liste.find((m) => m.ad === ad)).filter(Boolean) as GorselModel[];
                      const one = liste.filter((m) => m.grup !== "tum");
                      const tum = liste.filter((m) => m.grup === "tum");
                      const Baslik = ({ ikon: I, children }: { ikon: typeof Sparkles; children: React.ReactNode }) => <p className="flex items-center gap-1.5 px-2.5 pb-1 pt-2 text-[12.5px] font-semibold text-metin"><I className="h-3.5 w-3.5 text-metin-2" />{children}</p>;
                      return (
                        <>
                          {hepsiDemo && (
                            <p className="mx-1 mb-1 flex items-center gap-2 rounded-[12px] bg-amber-300/[0.06] px-2.5 py-2 text-[12px] leading-snug text-amber-100/90 ring-1 ring-inset ring-amber-300/15">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                              Sağlayıcılar bağlanana kadar örnek görsel üretilir; kredi düşmez.
                            </p>
                          )}
                          {son.length > 0 && <><Baslik ikon={History}>Son kullanılanlar</Baslik>{son.map((m) => KartSatir(m, "s"))}<div className="mx-2 my-1 h-px bg-white/[0.07]" /></>}
                          {one.length > 0 && <Baslik ikon={Sparkles}>Öne çıkan modeller</Baslik>}
                          {one.map((m) => KartSatir(m, "o"))}
                          {tum.length > 0 && <><div className="mx-2 my-1 h-px bg-white/[0.07]" /><Baslik ikon={LayoutGrid}>Tüm modeller</Baslik></>}
                          {tum.map((m) => KartSatir(m, "t"))}
                        </>
                      );
                    })()}
                  </div>
                  {karsilastir && (
                    <div className="flex shrink-0 items-center gap-2 border-t border-white/[0.07] px-3 py-2.5">
                      <span className="flex -space-x-1.5">{cokluModel.map((ad) => <span key={ad} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2a2c2f] ring-2 ring-[#1b1c1f]"><ModelLogo ad={ad} boyut={13} /></span>)}</span>
                      <span className="text-[12.5px] text-metin-2"><span className="tabular-nums text-metin">{cokluModel.length}</span>/4 model</span>
                      <button onClick={() => { setModelAcik(false); if (cokluModel.length < 2) setCokluModel([]); }} className="ml-auto flex h-8 items-center rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black transition active:scale-95">Tamam</button>
                    </div>
                  )}
                </Yuzen>
              </div>

              {/* Stil ön ayarı */}
              {!swapMu && (
                <div className="relative shrink-0">
                  <BCip acik={stilAcik} onClick={() => setStilAcik((v) => !v)} etiket="Stil" vurgu={!!seciliStil}
                    ikon={seciliStil ? <img src={seciliStil.kapak} alt="" className="h-full w-full object-cover" /> : <Palette className="h-4 w-4" />}
                    deger={seciliStil?.ad ?? "Yok"} />
                  <Yuzen acik={stilAcik} onKapat={() => setStilAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="Stil"
                    className="flex max-h-[min(72vh,600px)] w-[min(480px,calc(100vw-24px))] flex-col overflow-hidden rounded-[20px] border border-white/[0.09] bg-[#1b1c1f]">
                    <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5">
                      <span className="text-[13.5px] font-semibold text-metin">Stil</span>
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-metin-2">İstemine görünüm katar</span>
                      {seciliStil && <button onClick={() => { setStilId(null); setStilAcik(false); }} className="ml-auto flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] text-metin-2 transition hover:bg-white/[0.06] hover:text-metin"><X className="h-3.5 w-3.5" />Kaldır</button>}
                    </div>
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 [scrollbar-width:thin]">
                      {(["Fotoğraf", "Sanat", "Dönem"] as const).map((grup) => (
                        <div key={grup}>
                          <p className="mb-1.5 text-[12.5px] font-medium text-metin-2">{grup}</p>
                          <div className="grid grid-cols-4 gap-2 max-sm:grid-cols-3">
                            {GORSEL_STILLER.filter((x) => x.grup === grup).map((x) => (
                              <IzgaraSec key={x.id} sec={stilId === x.id} ad={x.ad} kapak={x.kapak} oran="aspect-[4/5]"
                                onClick={() => { setStilId(stilId === x.id ? null : x.id); setStilAcik(false); }} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Yuzen>
                </div>
              )}

              {/* Çözünürlük — yalnız birden çok kademesi olan modellerde */}
              {aktifModelTanim.cozunurluk && COZUNURLUKLER.length > 1 && (
                <div className="relative shrink-0">
                  <BCip acik={cozunurlukAcik} onClick={() => setCozunurlukAcik((v) => !v)} etiket="Çözünürlük" ikon={<Gem className="h-4 w-4" />} deger={cozunurluk} />
                  <Yuzen acik={cozunurlukAcik} onKapat={() => setCozunurlukAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="Çözünürlük"
                    className="w-[220px] rounded-[18px] border border-white/[0.09] bg-[#1b1c1f] p-1.5">
                    <p className="px-2.5 pb-1 pt-1.5 text-[12.5px] font-semibold text-metin">Çözünürlük</p>
                    {COZUNURLUKLER.map((c) => {
                      const carpan = cozunurlukCarpani(c);
                      return (
                        <button key={c} onClick={() => { setCozunurluk(c); setCozunurlukAcik(false); }}
                          className={cn("flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-white/[0.05]", cozunurluk === c && "bg-white/[0.07]")}>
                          <Gem className="h-4 w-4 text-metin-2" /><span className="flex-1 font-medium text-metin">{c}</span>
                          {carpan !== 1 && <span className="rounded-full bg-white/[0.06] px-1.5 text-[11px] tabular-nums text-metin-2">{krediYaz(carpan)} kat kredi</span>}
                          {cozunurluk === c && <Check className="h-4 w-4 text-metin" />}
                        </button>
                      );
                    })}
                  </Yuzen>
                </div>
              )}

              {/* Kalite seviyesi (GPT/Grok/Seedream 4.0/Recraft) */}
              {kaliteSecenek && kaliteSecenek.length > 0 && (
                <div className="relative shrink-0">
                  <BCip acik={kaliteSeviyeAcik} onClick={() => setKaliteSeviyeAcik((v) => !v)} etiket="Kalite" ikon={<Sparkles className="h-4 w-4" />} deger={aktifKalite} />
                  <Yuzen acik={kaliteSeviyeAcik} onKapat={() => setKaliteSeviyeAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="Kalite"
                    className="w-[200px] rounded-[18px] border border-white/[0.09] bg-[#1b1c1f] p-1.5">
                    <p className="px-2.5 pb-1 pt-1.5 text-[12.5px] font-semibold text-metin">Kalite</p>
                    {kaliteSecenek.map((c) => (
                      <button key={c} onClick={() => { setKaliteSeviye(c); setKaliteSeviyeAcik(false); }}
                        className={cn("flex w-full items-center justify-between rounded-[12px] px-2.5 py-2 text-[13px] font-medium text-metin transition-colors hover:bg-white/[0.05]", aktifKalite === c && "bg-white/[0.07]")}>
                        {c}{aktifKalite === c && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </Yuzen>
                </div>
              )}

              {/* Oran — görsel şekilli ızgara */}
              {modelOranlari.length > 0 && (
                <div className="relative shrink-0">
                  <BCip acik={oranAcik} onClick={() => setOranAcik((v) => !v)} etiket="Oran"
                    ikon={(() => { const o = ORANLAR.find((x) => x.deger === oran) ?? ORANLAR[4]; return <OranIkon w={o.w} h={o.h} />; })()} deger={oran} />
                  <Yuzen acik={oranAcik} onKapat={() => setOranAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="Oran"
                    className="w-[min(320px,calc(100vw-24px))] rounded-[18px] border border-white/[0.09] bg-[#1b1c1f] p-2">
                    <p className="px-1.5 pb-2 pt-1 text-[12.5px] font-semibold text-metin">Oran</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {modelOranlari.map((o) => {
                        const sec = oran === o.deger;
                        const k = 22 / Math.max(o.w, o.h);
                        return (
                          <button key={o.deger} onClick={() => { setOran(o.deger); setOranAcik(false); }} aria-pressed={sec}
                            className={cn("flex h-[68px] flex-col items-center justify-center gap-1.5 rounded-[12px] text-[12px] font-medium transition active:scale-95", sec ? "bg-white text-black" : "bg-white/[0.04] text-metin-2 hover:bg-white/[0.08] hover:text-metin")}>
                            <span className="flex h-6 items-center justify-center"><span className="block rounded-[3px]" style={{ width: Math.max(8, o.w * k), height: Math.max(8, o.h * k), border: "2px solid currentColor" }} /></span>
                            {o.deger}
                          </button>
                        );
                      })}
                    </div>
                  </Yuzen>
                </div>
              )}

              {/* Adet */}
              {!aktifModelTanim.adetGizli && (
                <div className="flex h-12 shrink-0 items-center gap-1 rounded-full bg-white/[0.08] pl-1.5 pr-1.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-metin-2"><Images className="h-4 w-4" /></span>
                  <span className="flex flex-col items-start pl-1 pr-1 leading-tight"><span className="text-[11px] text-metin-3">Adet</span><span className="whitespace-nowrap text-[13.5px] font-medium tabular-nums text-metin">{adet} görsel</span></span>
                  <button onClick={() => setAdet((a) => Math.max(1, a - 1))} disabled={adet <= 1} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.08] hover:text-metin active:scale-90 disabled:opacity-35" aria-label="Azalt"><Minus className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setAdet((a) => Math.min(8, a + 1))} disabled={adet >= 8} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.08] hover:text-metin active:scale-90 disabled:opacity-35" aria-label="Artır"><Plus className="h-3.5 w-3.5" /></button>
                </div>
              )}

              {/* Sınırsız — yalnız bu model için paket satılıyorsa */}
              {sinirsizSatiliyor && !karsilastir && (
                <Tooltip side="top" label={sinirsizAktif ? "Açıkken bu modelde kredi harcamadan üretirsin." : "Bu model için sınırsız erişimin yok, almak için tıkla."}>
                  <button onClick={sinirsizDegistir} role="switch" aria-checked={sinirsizGecerli}
                    className="flex h-12 shrink-0 items-center gap-2.5 rounded-full bg-white/[0.08] pl-4 pr-3 text-[13.5px] font-medium text-metin transition hover:bg-white/[0.13] active:scale-[0.97]">
                    Sınırsız
                    <span className={cn("relative h-[22px] w-[38px] rounded-full transition-colors", sinirsizGecerli ? "bg-white" : "bg-white/15")}>
                      <span className={cn("absolute top-[3px] h-4 w-4 rounded-full transition-[left,background-color]", sinirsizGecerli ? "left-[19px] bg-black" : "left-[3px] bg-white")} />
                    </span>
                  </button>
                </Tooltip>
              )}

              {/* RUH + Recraft: Renk paleti — seçiliyse paletin renkleriyle */}
              {(soulMu || modelTip === "recraft") && !karsilastir && (
                <button onClick={() => setRenkModal(true)}
                  className="flex h-12 shrink-0 items-center gap-2.5 rounded-full bg-white/[0.08] pl-1.5 pr-3.5 text-[13.5px] transition hover:bg-white/[0.13] active:scale-[0.97]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.08] text-metin-2" style={seciliPalet ? { background: `conic-gradient(${seciliPalet.renkler.join(", ")}, ${seciliPalet.renkler[0]})` } : undefined}>
                    {!seciliPalet && <Palette className="h-4 w-4" />}
                  </span>
                  <span className="flex flex-col items-start leading-tight"><span className="text-[11px] text-metin-3">Renk paleti</span><span className="whitespace-nowrap font-medium text-metin">{seciliPalet?.ad ?? "Yok"}</span></span>
                </button>
              )}

              {/* RECRAFT: Vektör modu + Standart/Pro */}
              {modelTip === "recraft" && !karsilastir && (
                <>
                  <Tooltip side="top" label="Fotoğraf yerine düzenlenebilir vektör (SVG) üretir. Her boyutta net kalır; logo, ikon ve illüstrasyon için.">
                    <button onClick={() => setVektorMod((v) => !v)} role="switch" aria-checked={vektorMod}
                      className="flex h-12 shrink-0 items-center gap-2.5 rounded-full bg-white/[0.08] pl-4 pr-3 text-[13.5px] font-medium text-metin transition hover:bg-white/[0.13]">
                      Vektör
                      <span className={cn("relative h-[22px] w-[38px] rounded-full transition-colors", vektorMod ? "bg-white" : "bg-white/15")}>
                        <span className={cn("absolute top-[3px] h-4 w-4 rounded-full transition-[left,background-color]", vektorMod ? "left-[19px] bg-black" : "left-[3px] bg-white")} />
                      </span>
                    </button>
                  </Tooltip>
                  <BCip acik={false} ok={false} onClick={() => setKaliteMod((k) => (k === "Standart" ? "Pro" : "Standart"))} etiket="Uç nokta" ikon={<Layers className="h-4 w-4" />} deger={kaliteMod} />
                </>
              )}

              {/* FLUX: yönlendirme + adım */}
              {modelTip === "flux" && !karsilastir && (
                <div className="relative shrink-0">
                  <BCip acik={fluxAyarAcik} onClick={() => setFluxAyarAcik((v) => !v)} etiket="FLUX ayarı" ikon={<SlidersHorizontal className="h-4 w-4" />} deger={`${cfg} · ${kaliteAdim} adım`} />
                  <Yuzen acik={fluxAyarAcik} onKapat={() => setFluxAyarAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="FLUX ayarı"
                    className="w-72 rounded-[18px] border border-white/[0.09] bg-[#1b1c1f] p-3.5">
                    {([["İstem sadakati", "Yüksek değer istemi daha yakından izler ama çeşitliliği kısıtlar.", cfg, setCfg, 1.5, 10, 0.5], ["Adım sayısı", "Daha çok adım daha ayrıntılı ama daha yavaş üretir.", kaliteAdim, setKaliteAdim, 2, 50, 1]] as const).map(([ad, not, d, set, mn, mx, st]) => (
                      <div key={ad} className="mb-3 last:mb-0">
                        <div className="mb-1 flex items-center justify-between text-[13px]"><span className="font-medium text-metin">{ad}</span><span className="rounded-full bg-white/[0.06] px-2 tabular-nums text-metin">{d}</span></div>
                        <input type="range" min={mn} max={mx} step={st} value={d} onChange={(e) => set(Number(e.target.value))} className="w-full accent-white" aria-label={ad} />
                        <p className="mt-0.5 text-[11.5px] text-metin-2">{not}</p>
                      </div>
                    ))}
                  </Yuzen>
                </div>
              )}

              {/* Gelişmiş: tohum · kaçınılacaklar · şeffaf arka plan */}
              {!swapMu && (
                <div className="relative shrink-0">
                  <Tooltip side="top" label="Gelişmiş: tohum, kaçınılacaklar, şeffaf arka plan">
                    <button onClick={() => setGelismisAcik((v) => !v)} aria-expanded={gelismisAcik} aria-label="Gelişmiş ayarlar"
                      className={cn("relative flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-inset transition active:scale-95", gelismisAcik ? "bg-white/[0.12] text-metin ring-white/20" : "bg-white/[0.08] text-metin-2 ring-transparent hover:bg-white/[0.13] hover:text-metin")}>
                      <SlidersHorizontal className="h-4 w-4" />
                      {(tohum || negatif.trim() || (seffaf && aktifModelTanim.api.seffaf)) && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-white ring-2 ring-[#2a2b30]" />}
                    </button>
                  </Tooltip>
                  <Yuzen acik={gelismisAcik} onKapat={() => setGelismisAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="Gelişmiş ayarlar"
                    className="w-[min(356px,calc(100vw-24px))] rounded-[20px] border border-white/[0.09] bg-[#1b1c1f] p-2">
                    <div className="flex items-center justify-between px-2 pb-2 pt-1">
                      <p className="text-[13.5px] font-semibold text-metin">Gelişmiş ayarlar</p>
                      {(tohum || negatif.trim() || seffaf) && (
                        <button type="button" onClick={() => { setTohum(""); setNegatif(""); setSeffaf(false); }} className="rounded-full px-2.5 py-1 text-[12px] text-metin-2 transition-colors hover:bg-white/[0.05] hover:text-metin">Sıfırla</button>
                      )}
                    </div>
                    <div className={cn("rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.06]", !aktifModelTanim.api.tohum && "opacity-60")}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-metin-2"><Dices className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-metin">Tohum</span>
                          <span className="block text-[11.5px] leading-snug text-metin-2">{aktifModelTanim.api.tohum ? "Aynı tohum ve aynı istem aynı görseli verir" : `${model} tohum desteklemiyor`}</span>
                        </span>
                        {!aktifModelTanim.api.tohum && <Lock className="h-3.5 w-3.5 shrink-0 text-metin-3" />}
                      </div>
                      {aktifModelTanim.api.tohum && (
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <input value={tohum} onChange={(e) => setTohum(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="Rastgele" aria-label="Tohum"
                            className="h-9 min-w-0 flex-1 rounded-[10px] bg-black/30 px-3 text-[13px] tabular-nums text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-2 focus:ring-white/30" />
                          <button type="button" onClick={() => setTohum(String(Math.floor(Math.random() * 2 ** 31)))} aria-label="Rastgele tohum" title="Rastgele tohum"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-metin-2 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.1] hover:text-metin active:scale-90"><Dices className="h-4 w-4" /></button>
                          {tohum && <button type="button" onClick={() => setTohum("")} aria-label="Tohumu temizle" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-metin-3 hover:bg-white/[0.06] hover:text-metin"><X className="h-4 w-4" /></button>}
                        </div>
                      )}
                      {aktifModelTanim.api.tohum && tohum && <p className="mt-1.5 text-[11px] text-metin-2">Birden çok görselde her birinde 1 artar.</p>}
                    </div>
                    <div className="mt-1.5 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-metin-2"><Ban className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-metin">Kaçınılacaklar</span>
                          <span className="block text-[11.5px] leading-snug text-metin-2">{aktifModelTanim.api.negatif ? "Modele negatif istem olarak gider" : "İsteme “şunlar olmasın” diye eklenir"}</span>
                        </span>
                      </div>
                      <input value={negatif} onChange={(e) => setNegatif(e.target.value.slice(0, 400))} placeholder="Kendin yaz ya da aşağıdan seç" aria-label="Kaçınılacaklar"
                        className="mt-2.5 h-9 w-full rounded-[10px] bg-black/30 px-3 text-[13px] text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-2 focus:ring-white/30" />
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {["yazı", "filigran", "bulanıklık", "fazla parmak", "düşük kalite", "logo"].map((k) => {
                          const parcalar = negatif.split(",").map((x) => x.trim()).filter(Boolean);
                          const var_ = parcalar.includes(k);
                          return (
                            <button key={k} type="button" aria-pressed={var_}
                              onClick={() => setNegatif((var_ ? parcalar.filter((x) => x !== k) : [...parcalar, k]).join(", ").slice(0, 400))}
                              className={cn("flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] ring-1 ring-inset transition active:scale-95",
                                var_ ? "bg-white text-black ring-white" : "bg-white/[0.04] text-metin-2 ring-white/[0.07] hover:bg-white/[0.08] hover:text-metin")}>
                              {var_ ? <Check className="h-3 w-3" strokeWidth={3} /> : <Plus className="h-3 w-3" />}{k}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button type="button" role="switch" aria-checked={seffaf && !!aktifModelTanim.api.seffaf} disabled={!aktifModelTanim.api.seffaf} onClick={() => setSeffaf((v) => !v)}
                      className="mt-1.5 flex w-full items-center gap-3 rounded-[14px] bg-white/[0.03] p-3 text-left ring-1 ring-inset ring-white/[0.06] transition-colors hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white/[0.03]">
                      <span className="h-8 w-8 shrink-0 rounded-full ring-1 ring-inset ring-white/[0.1]"
                        style={{ backgroundImage: "conic-gradient(#3a3a40 25%, #232327 0 50%, #3a3a40 0 75%, #232327 0)", backgroundSize: "10px 10px" }} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-metin">Şeffaf arka plan</span>
                        <span className="block text-[11.5px] leading-snug text-metin-2">{aktifModelTanim.api.seffaf ? "Arka plansız PNG, logo ve ürün için" : "Yalnız GPT Image modellerinde"}</span>
                      </span>
                      {aktifModelTanim.api.seffaf ? (
                        <span className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", seffaf ? "bg-white" : "bg-white/15")}>
                          <span className={cn("absolute top-[3px] h-4 w-4 rounded-full transition-[left,background-color]", seffaf ? "left-[19px] bg-black" : "left-[3px] bg-white")} />
                        </span>
                      ) : <Lock className="h-3.5 w-3.5 shrink-0 text-metin-3" />}
                    </button>
                  </Yuzen>
                </div>
              )}
            </div>

            {/* Üret — beyaz, çiplerle aynı satırda; bedel düğmenin içinde */}
            {(() => {
              const hazir = swapMu ? !!(swapKaynak && swapHedef) : prompt.trim().length >= 2;
              const kac = karsilastir ? cokluModel.reduce((t, ad) => t + (modelBul(ad).adetGizli ? 1 : adet), 0) : aktifModelTanim.adetGizli ? 1 : adet;
              const demoHepsi = karsilastir ? cokluModel.every((ad) => !modelBagli(modelBul(ad))) : demoModu;
              return (
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={uret} disabled={gonderiliyor} aria-busy={gonderiliyor}
                    title={hazir ? `${kac} görsel üret (Ctrl+Enter)` : swapMu ? "İki görseli de yükle" : "Önce bir istem yaz"}
                    className={cn("flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-black transition active:scale-95", !hazir && "opacity-55")}>
                    {gonderiliyor ? <><Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor</> : (
                      <>
                        {karsilastir ? "Karşılaştır" : "Üret"}
                        {!demoHepsi && toplamKredi > 0 && <><KrediYildiz className="h-4 w-4" /><motion.span key={toplamKredi} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="tabular-nums">{krediYaz(toplamKredi)}</motion.span></>}
                        {sinirsizGecerli && !karsilastir && <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11.5px]">Sınırsız</span>}
                      </>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ═══ RUH: Karakter · Ruh panosu · Renk paleti (gerçek veriyle) ═══ */}
      <AnimatePresence>
        {karakterModal && <KarakterModal key="ruh-karakter" secili={seciliKarakter} onSec={setSeciliKarakter} onKapat={() => setKarakterModal(false)}
          onYeni={() => { setKarakterModal(false); setElementTohum({ tur: "karakter" }); }} />}
        {moodboardModal && <PanoModal key="ruh-pano" secili={seciliPano} onSec={setSeciliPano} onKapat={() => setMoodboardModal(false)} />}
        {renkModal && <PaletModal key="ruh-palet" secili={seciliPalet} onSec={setSeciliPalet} onKapat={() => setRenkModal(false)} />}
      </AnimatePresence>

      {/* ═══ ÇİZİM (DRAW) modalı — Higgsfield "Draw to Edit / Sketch to Video" birebir ═══ */}
      <AnimatePresence>
        {cizimModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] flex justify-end bg-black/55" onClick={() => setCizimModal(false)}>
            <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }} onClick={(e) => e.stopPropagation()}
              className="relative flex h-full w-full max-w-[1080px] flex-col overflow-hidden border-l border-white/[0.08] bg-[#121315]">
              {/* Üst sekmeler */}
              <div className="relative flex items-center justify-center gap-1 px-6 py-4">
                {([
                  { id: "edit", ad: "Çizerek düzenle", yeni: false },
                  { id: "sketch", ad: "Eskizden görsel", yeni: false },
                ] as const).map((s) => (
                  <button key={s.id} onClick={() => setCizimSekme(s.id)}
                    className={cn("flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium transition-colors",
                      cizimSekme === s.id ? "bg-white text-black" : "text-metin-2 hover:text-metin")}>
                    <Pencil className="h-4 w-4" /> {s.ad}
                    {s.yeni && <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-black">Yeni</span>}
                  </button>
                ))}
                <button onClick={() => setCizimModal(false)} className="hf-btn glass-ikon absolute right-4 top-3 flex h-9 w-9 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
              </div>

              {/* GERÇEK çizim tuvali — fare/dokunma ile çiz, kalem/silgi/renk/kalınlık/undo/redo taşır */}
              <div className="mx-6 flex-1 overflow-y-auto">
                {cizimSekme === "edit" && !cizimArka ? (
                  <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 text-center">
                    <p className="text-[14px] font-medium text-metin">Üstüne çizeceğin görseli seç</p>
                    <p className="max-w-[360px] text-[12.5px] text-metin-3">Değişmesini istediğin yeri çiz, ok ya da not ekle; model çizimini talimat olarak okur.</p>
                    <button onClick={() => cizimArkaRef.current?.click()} className="rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-zemin hover:opacity-90">Görsel yükle</button>
                  </div>
                ) : (
                  <CizimCanvas ref={cizimCanvasRef} arka={cizimSekme === "edit" && cizimArka ? `url("${cizimArka}") center/cover no-repeat` : undefined} />
                )}
                <input ref={cizimArkaRef} type="file" accept="image/png,image/jpeg,image/webp" hidden
                  onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) void dosyaOku(d).then(setCizimArka); }} />
              </div>

              {/* Alt çubuk: model seçici (sol) + Üret (sağ) — çizim araçları artık tuvalde */}
              <div className="flex items-center gap-3 px-6 py-4">
                {/* Model çipi → model dropdown */}
                <div className="relative">
                  <button onClick={() => setCizimModelAcik((v) => !v)} className="hf-btn glass-cip flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-metin">
                    <BarChart3 className="h-3.5 w-3.5" /> {model} <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", cizimModelAcik && "rotate-90")} />
                  </button>
                  <AnimatePresence>
                    <Yuzen acik={!!(cizimModelAcik)} onKapat={() => setCizimModelAcik(false)} alt={"tam"} sol={0} bosluk={8}><motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                          className="menu-surface max-h-64 w-56 overflow-y-auto rounded-xl p-1.5">
                          {GORSEL_MODELLER.filter((m) => m.api.refMax > 0 && m.tip !== "swap").map((m) => (
                            <button key={m.ad} onClick={() => { setModel(m.ad); setCizimModelAcik(false); }}
                              className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors", model === m.ad ? "bg-white/8 text-metin" : "text-metin-2 hover:bg-white/6 hover:text-metin")}>
                              <BarChart3 className="h-3.5 w-3.5 shrink-0" /> <span className="min-w-0 flex-1 truncate">{m.ad}</span>
                              {model === m.ad && <Check className="h-3.5 w-3.5 text-metin" />}
                            </button>
                          ))}
                        </motion.div></Yuzen>
                  </AnimatePresence>
                </div>

                {/* Üret — GERÇEK çizimi (canvas dataUrl) referans olarak geçir */}
                <button onClick={async () => {
                  const tuval = cizimCanvasRef.current;
                  if (!tuval || tuval.bosMu()) return toast.error("Tuval boş", { description: "Üretmeden önce tuvale bir şeyler çiz." });
                  const duzenle = cizimSekme === "edit";
                  if (!cizimModelTanim.api.refMax) return toast.error(`${model} görsel girdisi almıyor`, { description: "Çizimden üretmek için Nano Banana ya da GPT Image seç." });
                  let birlesik: string;
                  try { birlesik = await gorselDepola(await cizimBirlestir(tuval.dataUrl(), duzenle ? cizimArka : null)); }
                  catch (e) { return toast.error("Çizim hazırlanamadı", { description: `${neden(e, "Tuval görsele çevrilemedi.")} Yeniden dene.` }); }
                  const talimat = duzenle
                    ? `${prompt.trim() || "Apply the drawn changes"}. The image contains hand-drawn marks and notes: apply them as edit instructions and remove the marks from the final image.`
                    : `${prompt.trim() || "Turn this sketch into a finished image"}. Follow the composition of the sketch.`;
                  const birim = cizimKredi;
                  const sonuc = uretimBaslat({ baslik: duzenle ? "Çizerek düzenleme" : "Eskizden görsel", tur: "gorsel", model, prompt: talimat, kredi: birim, arac: "Çizim", projeId: aktifProjeId ?? undefined,
                    meta: { islem: "uret", oran, ...(cizimModelTanim.api.cozunurluklar.length ? { cozunurluk } : {}), referanslar: [birlesik], gorselUrl: birlesik, hamIstem: prompt } });
                  if (!sonuc.ok) return uretimHataToast(sonuc, "Üretilemedi");
                  toast.success("Görsel üretiliyor", { description: `${model} · çizimden · ${krediYaz(birim)} kredi.` });
                  tuval.temizle();
                  setCizimModal(false);
                }}
                  className="ml-auto flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-black transition active:scale-95">
                  Görsel üret <KrediYildiz className="h-4 w-4" /> {krediYaz(cizimKredi)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════ GÖRSEL GÖRÜNTÜLEYİCİ ═══════════════════════ */}
      <AnimatePresence>
        {seciliKart && (
          <GorselGoruntuleyici
            uretimId={acikUretim?.id}
            url={seciliKart}
            ad={gorselAdi}
            altBaslik={acikUretim
              ? `${acikUretim.model} · ${new Date(acikUretim.olusturma).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
              : "Örnek görsel · İlham galerisi"}
            onAdKaydet={adDegistir}
            sira={lbIndex >= 0 ? { i: lbIndex, n: gezListe.length } : null}
            onGez={lightboxGez}
            onKapat={lightboxKapat}
            ustKatmanAcik={elementModal || medyaOnizle !== null || elementSeciciModal}
            krediler={kullanici?.krediler ?? 0}
            onIndir={(src, ad) => gorseliIndir(src, ad)}
            onAracCalistir={aracCalistir}
            onYerelKaydet={yerelKaydet}
            yorumSayisi={tumYorumlar.filter((y) => y.konuId === seciliKart).length}
            yorumlar={<YorumSekmesi yorum={yorum} setYorum={setYorum} konuId={seciliKart} isaretDestek />}
            bilgi={
              <InfoSekmesi url={seciliKart} uretim={acikUretim} prompt={acikUretim ? ((acikUretim.meta?.hamIstem as string | undefined) ?? istemTemizle(acikPrompt)) : ""}
                onIndir={() => gorseliIndir(seciliKart ?? undefined, gorselAdi)}
                onYenidenUret={acikUretim ? () => { yenidenUret((acikUretim.meta?.hamIstem as string | undefined) ?? acikPrompt); } : undefined}
                onElement={() => elementModalAc(seciliKart, acikPrompt)}
                onAnimate={() => { if (seciliKart) { lightboxKapat(); animasyonaGec(seciliKart); } }}
                onReferans={() => { if (seciliKart) { referansEkle(seciliKart); lightboxKapat(); } }}
                begenili={!!acikUretim?.favori}
                onBegen={acikUretim ? () => { favoriToggle(acikUretim.id); toast.success(acikUretim.favori ? "Beğenilerden çıkarıldı" : "Beğenilere eklendi"); } : undefined}
                onSil={acikUretim ? () => { const eski = acikUretim; silUretim(eski.id); lightboxKapat(); mesaj.silindi("Üretim", () => uretimGeriYukle(eski)); } : undefined}
                onAyarlariYukle={acikUretim ? () => ayarlariComposeraYukle() : undefined}
                onRemix={() => {
                  if (!seciliKart) return;
                  const url = saltUrl(seciliKart) ?? seciliKart;
                  const ist = acikUretim ? ((acikUretim.meta?.hamIstem as string | undefined) ?? istemTemizle(acikPrompt)) : "";
                  setReferanslar((v) => [{ ad: "Remix kaynağı", url }, ...v.filter((x) => x.url !== url)].slice(0, REF_UST));
                  if (ist) setPrompt(ist);
                  lightboxKapat();
                  setTimeout(() => promptRef.current?.focus(), 50);
                  toast.success("Remix için referans eklendi", { description: "İstemi değiştirip üret. Kompozisyon görselden gelir." });
                }}
                kaynak={(() => {
                  const k = acikUretim?.meta?.kaynakId ? tumUretimler.find((u) => u.id === acikUretim.meta?.kaynakId) : undefined;
                  return k?.gorselUrl ? { url: saltUrl(k.gorselUrl) ?? k.gorselUrl, ad: k.baslik || "Kaynak", ac: () => setSeciliKart(k.gorselUrl!) } : undefined;
                })()} />
            }
          />
        )}
      </AnimatePresence>

      {/* ═══ REFERANS TAM-EKRAN ÖNİZLEME (madde 11) ═══ */}
      <AnimatePresence>
        {medyaOnizle && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMedyaOnizle(null)}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm"
          >
            <button onClick={() => setMedyaOnizle(null)} className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full glass-ikon text-white transition-colors" aria-label="Kapat"><X className="h-5 w-5" /></button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
              src={medyaOnizle} alt="Referans önizleme"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] max-w-[88vw] rounded-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ELEMENT SEÇİCİ (@ referans) — Higgsfield birebir popup ═══ */}
      <AnimatePresence>
        {elementSeciciModal && (
          <ElementSeciciModal onSec={(ad) => elementEkle(ad)} onKapat={() => setElementSeciciModal(false)} />
        )}
      </AnimatePresence>

      {/* Yeni element — ortak düzenleyici; oluşturulan element istemine eklenir */}
      <AnimatePresence>
        {elementTohum && (
          <ElementDuzenleModal key="gorsel-yeni-element" element={null} tohumDeger={elementTohum} onKapat={() => setElementTohum(null)}
            onOlustu={(id) => {
              const e = useElements.getState().elementler.find((x) => x.id === id);
              if (!e) return;
              if (elementTohum.tur === "karakter" && soulMu) setSeciliKarakter(e.ad);
              else setPrompt((p) => `${p}${p && !p.endsWith(" ") ? " " : ""}@${e.ad} `);
            }} />
        )}
      </AnimatePresence>

      {/* Yeni klasör — kart menüsündeki "Klasöre ekle › Yeni klasör" akışı.
          Ortak GirdiModal kullanılıyor (ayrı bir ekran yazmaya gerek yok). */}
      <GirdiModal
        acik={yeniKlasorIcin !== null}
        baslik="Yeni klasör"
        etiket="Klasör adı"
        varsayilan=""
        kaydetAd="Oluştur"
        onKaydet={yeniKlasorKaydet}
        onKapat={() => setYeniKlasorIcin(null)}
      />
    </div>
    </>
  );
}

/* ═══════════════════════ BİLGİ SEKMESİ ═══════════════════════
   Yalnız GERÇEK bilgi: kendi üretiminde kaydın kendisi (istem, model, oran, kalite,
   kredi, tarih, piksel boyutu); ilham galerisindeki örnek görselde istem/model yoktur
   ve uydurulmaz — yerine "benzerini üret" yolları gösterilir. */

