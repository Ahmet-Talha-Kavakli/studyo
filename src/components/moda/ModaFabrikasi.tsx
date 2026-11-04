"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState, type SVGProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Shirt, Wand2, Upload, X, Loader2, Eraser, ScanFace, Footprints, Rotate3d, Armchair, ZoomIn, Check, Sparkles, Layers, Plus, Camera, Info,
  PersonStanding, ArrowLeftRight, RotateCcw, Search, Clapperboard, SlidersHorizontal, PenLine, Gem, Footprints as Ayakkabi, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useElements } from "@/store/useElements";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { usePanolar } from "@/store/usePanolar";
import { useAktifProje } from "@/lib/useAktifProje";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { useMasaustu } from "@/hooks/useMasaustu";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { cozunurlukCarpani } from "@/lib/gorselModelVeri";
import { KCip } from "@/components/studyo/Cip";
import { HAZIR_PANOLAR, type SeciliPano } from "@/components/studyo/gorsel/RuhModallari";
import { ElementKapak } from "@/components/panel/element/elementMeta";
import { Kayan, YanPanel, DumpSetleri, useDumpSetleri } from "@/components/dump/dumpOrtak";
import { OranSekli, useGorselBaglanti, gorselModelBul, modelKredi, krediYaz, dosyaOku, gorselYukle, uretimGorseli, GORSEL_TURLERI } from "@/components/arac/kit";

/* Lucide'de pantolon ve elbise yok: aynı çizgi diliyle iki küçük ikon. */
const Pantolon = ((p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 3h12l1 18h-5l-2-11-2 11H5z" /><path d="M6 7h12" /></svg>
)) as unknown as LucideIcon;
const Elbise = ((p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 3l1 3h4l1-3" /><path d="M10 6l-1 5h6l-1-5" /><path d="M9 11l-4 10h14l-4-10" /></svg>
)) as unknown as LucideIcon;
const Ceket = ((p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8 3l4 4 4-4 4 3-2 5h-2v10H8V11H6L4 6z" /><path d="M12 7v14" /></svg>
)) as unknown as LucideIcon;

/**
 * Moda fabrikası — ürün fotoğrafından katalog çekimi. Kombin yuvaları (üst, alt, tek parça, dış giyim,
 * ayakkabı, aksesuar), hazır model / karakter / kendi fotoğrafın, sahne şablonu ya da ruh panosu, çekim listesi.
 * Kendi fotoğrafında FASHN ile birebir giydirme; üretilen karede de "Ürünü giydir" ikinci adımı var.
 */
const ARAC = "Moda Fabrikası";
const KART = "overflow-hidden rounded-[20px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]";
const SERIT = "flex min-h-[52px] items-center gap-2 border-b border-white/[0.07] px-4 py-2.5";
const CAM = "cam-istemci bg-[rgba(34,35,40,0.8)] ring-1 ring-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[14px] backdrop-saturate-[1.25]";
const SAHNE_MODELI = "Nano Banana Pro";
const GIYDIR_MODELI = "Vayra Giydir";
const kucuk = (s: string) => s.toLocaleLowerCase("tr");
type Foto = { id: string; url: string; durum: "yukleniyor" | "hazir" | "hata"; hata?: string };

/** Kombin yuvaları: her yuvaya tek ürün; ilk dolu yuva birebir giydirmede ana üründür. */
const YUVALAR: { id: string; ad: string; ikon: LucideIcon; en: string; fashn?: string }[] = [
  { id: "ust", ad: "Üst", ikon: Shirt, en: "top", fashn: "tops" },
  { id: "alt", ad: "Alt", ikon: Pantolon, en: "bottoms", fashn: "bottoms" },
  { id: "tek", ad: "Tek parça", ikon: Elbise, en: "one-piece outfit", fashn: "one-pieces" },
  { id: "dis", ad: "Dış giyim", ikon: Ceket, en: "outerwear jacket or coat", fashn: "tops" },
  { id: "ayak", ad: "Ayakkabı", ikon: Ayakkabi, en: "shoes" },
  { id: "aks", ad: "Aksesuar", ikon: Gem, en: "accessory (bag, jewelry or eyewear)" },
];

const SAHNE_KATLARI = ["Stüdyo", "Mekân", "Editoryal"] as const;
type SahneKat = (typeof SAHNE_KATLARI)[number];
const SABLONLAR: { id: string; ad: string; gorsel: string; tarif: string; kat: SahneKat; not: string }[] = [
  { id: "katalog", ad: "Saf beyaz katalog", gorsel: "/gercek/paz/paz-sanal-1.webp", tarif: "pure white seamless e-commerce catalog background, even soft studio light, clean shadows", kat: "Stüdyo", not: "E-ticaret için temiz beyaz zemin" },
  { id: "beton", ad: "Stüdyo beton", gorsel: "/gercek/paz/paz-prosanal-1.webp", tarif: "minimal concrete studio with large window light, editorial lookbook", kat: "Stüdyo", not: "Pencere ışığı, sade lookbook" },
  { id: "gradient", ad: "Turkuaz gradyan", gorsel: "/gercek/arac/fashion-gradient.webp", tarif: "soft teal gradient studio backdrop, clean lookbook lighting", kat: "Stüdyo", not: "Yumuşak renk geçişli fon" },
  { id: "magaza", ad: "Mağaza ve ayna", gorsel: "/gercek/paz/paz-sanal-2.webp", tarif: "modern boutique interior with mirrors and clothing racks, bright retail lighting", kat: "Mekân", not: "Butik, ayna ve askılar" },
  { id: "street", ad: "Sokak şıklığı", gorsel: "/gercek/arac/fashion-street.webp", tarif: "city street style, candid shot on a busy sidewalk, overcast daylight", kat: "Mekân", not: "Kaldırımda doğal bir an" },
  { id: "bold", ad: "Ultra cesur", gorsel: "/gercek/arac/fashion-bold.webp", tarif: "bold color-block studio backdrop, saturated magenta and orange, confident editorial attitude", kat: "Editoryal", not: "Doygun renk blokları" },
  { id: "noir", ad: "Noir editöryel", gorsel: "/gercek/arac/fashion-noir.webp", tarif: "black and white film noir editorial, hard light, deep shadows", kat: "Editoryal", not: "Siyah beyaz, sert ışık" },
  { id: "sky", ad: "Gökyüzü üstü", gorsel: "/gercek/arac/fashion-sky.webp", tarif: "above the clouds with blue sky, avant-garde fashion editorial", kat: "Editoryal", not: "Bulutların üstünde avangart" },
  { id: "pastel", ad: "Pastel rüya", gorsel: "/gercek/arac/fashion-pastel.webp", tarif: "dreamy pastel fairytale set, soft diffused light", kat: "Editoryal", not: "Masalsı, yumuşak ışık" },
];
const POZLAR: [string, string, LucideIcon, string][] = [
  ["onden", "Önden", PersonStanding, "standing facing the camera, full body, front view"],
  ["ceyrek", "3/4", Rotate3d, "three-quarter turn, looking over the shoulder"],
  ["yan", "Yandan", ArrowLeftRight, "side profile view, full body"],
  ["arka", "Arkadan", RotateCcw, "back view from behind showing the back of the garment, full body"],
  ["yurur", "Yürüyüş", Footprints, "walking toward the camera mid-stride, full body"],
  ["oturan", "Oturan", Armchair, "seated on a minimal stool, relaxed"],
  ["detay", "Detay", ZoomIn, "close-up crop focused on the garment details on the body"],
];
const CEKIM_SETLERI: [string, string, string[], string][] = [
  ["urun", "Ürün sayfası", ["onden", "yan", "arka", "detay"], "4 açı"],
  ["lookbook", "Lookbook", ["yurur", "ceyrek", "oturan"], "Hareketli"],
  ["tek", "Tek kare", ["onden"], "Hızlı deneme"],
];
const EN_FAZLA_CEKIM = 6;
const ORANLAR: [string, string][] = [["3:4", "Ürün sayfası"], ["4:5", "Instagram"], ["9:16", "Hikâye"], ["2:3", "Lookbook"], ["1:1", "Kare"], ["16:9", "Banner"]];
const HAZIR_MODELLER: { ad: string; gorsel: string; tarif: string; cins: "k" | "e" }[] = [
  { ad: "Aria", gorsel: "/gercek/gorsel/gorsel-karakter-Aria.webp", tarif: "a young woman with curly dark hair", cins: "k" },
  { ad: "Emma", gorsel: "/gercek/gorsel/gorsel-karakter-Emma.webp", tarif: "a young woman with wavy blonde hair", cins: "k" },
  { ad: "Sofia", gorsel: "/gercek/gorsel/gorsel-karakter-Sofia.webp", tarif: "a young woman with long dark brown hair", cins: "k" },
  { ad: "Margot", gorsel: "/gercek/paz/av-margot.webp", tarif: "a young woman with long braided hair", cins: "k" },
  { ad: "Clara", gorsel: "/gercek/paz/av-clara.webp", tarif: "a young woman with a sleek black bob", cins: "k" },
  { ad: "Valentina", gorsel: "/gercek/paz/av-valentina.webp", tarif: "a young woman with wavy auburn hair", cins: "k" },
  { ad: "Maria", gorsel: "/gercek/paz/av-maria.webp", tarif: "a young woman with a short pixie cut", cins: "k" },
  { ad: "Zara", gorsel: "/gercek/paz/av-zara.webp", tarif: "a woman with wavy silver hair", cins: "k" },
  { ad: "Kai", gorsel: "/gercek/gorsel/gorsel-karakter-Kai.webp", tarif: "a young man with short black hair", cins: "e" },
  { ad: "Leo", gorsel: "/gercek/gorsel/gorsel-karakter-Leo.webp", tarif: "a young man with light brown hair", cins: "e" },
  { ad: "Talha", gorsel: "/gercek/gorsel/gorsel-karakter-Talha.webp", tarif: "a young man with a short beard", cins: "e" },
  { ad: "Marco", gorsel: "/gercek/paz/av-marco.webp", tarif: "a young man with styled dark hair and a trimmed beard", cins: "e" },
  { ad: "Tae", gorsel: "/gercek/paz/av-tae.webp", tarif: "a man with a full dark beard", cins: "e" },
  { ad: "Jayden", gorsel: "/gercek/paz/av-jayden.webp", tarif: "a young man with short dark hair and light stubble", cins: "e" },
  { ad: "Erik", gorsel: "/gercek/paz/av-erik.webp", tarif: "a young man with platinum blonde hair", cins: "e" },
  { ad: "Ryu", gorsel: "/gercek/paz/av-ryu.webp", tarif: "a mature man with silver grey hair", cins: "e" },
  { ad: "Joon", gorsel: "/gercek/paz/av-joon.webp", tarif: "a young man with curly hair", cins: "e" },
];
const FOTO_TURU: [string, string, LucideIcon][] = [["auto", "Oto algıla", Wand2], ["model", "Üzerinde", PersonStanding], ["flat-lay", "Serilmiş", Layers]];

export function ModaFabrikasi() {
  const { aktifProjeId } = useAktifProje();
  const masaustu = useMasaustu();
  const router = useRouter();
  const b = useGorselBaglanti();
  const elementler = useElements((s) => s.elementler);
  const karakterler = useMemo(() => elementler.filter((e) => e.tur === "karakter"), [elementler]);
  const kullaniciPanolari = usePanolar((s) => s.panolar);

  const [sekme, setSekme] = useState<"olustur" | "cekimler">("olustur");
  const [yuvalar, setYuvalar] = useState<Record<string, Foto | undefined>>({});
  const [fotoTuru, setFotoTuru] = useState("auto");
  const [modelKaynak, setModelKaynak] = useState<"hazir" | "karakter" | "foto">("hazir");
  const [modelCins, setModelCins] = useState<"k" | "e">("k");
  const [hazirModel, setHazirModel] = useState(HAZIR_MODELLER[0].ad);
  const [karakterId, setKarakterId] = useState<string | null>(null);
  const [modelFoto, setModelFoto] = useState<Foto | null>(null);
  const [sablon, setSablon] = useState("katalog");
  const [pano, setPano] = useState<SeciliPano | null>(null);
  const [sahneKat, setSahneKat] = useState<"Tümü" | SahneKat | "Panolar">("Tümü");
  const [arama, setArama] = useState("");
  const [cekimler, setCekimler] = useState<string[]>(["onden", "ceyrek"]);
  const [varyasyon, setVaryasyon] = useState(1);
  const [oran, setOran] = useState("3:4");
  const [cozunurluk, setCozunurluk] = useState("2K");
  const [mod, setMod] = useState("balanced");
  const [not, setNot] = useState("");
  const [notAcik, setNotAcik] = useState(false);
  const [acik, setAcik] = useState<null | "urun" | "model" | "cekim" | "bicim">(null);
  const [ayarPanel, setAyarPanel] = useState(false);
  const [aktifGrup, setAktifGrup] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hedefYuva, setHedefYuva] = useState("ust");
  const [surukle, setSurukle] = useState(false);
  const temizlenen = useRef(new Map<string, string>()); // üretim id → yuva id
  const urunRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);
  const anaRef = useRef<HTMLDivElement>(null);
  const sahneRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!karakterId && karakterler[0]) setKarakterId(karakterler[0].id); }, [karakterler, karakterId]);
  useEffect(() => { anaRef.current?.scrollTo({ top: 0 }); window.scrollTo({ top: 0 }); }, [sekme]);

  const sahne = gorselModelBul(SAHNE_MODELI);
  const giydir = gorselModelBul(GIYDIR_MODELI);
  const sahneDemo = b.bagli(sahne) === false;
  const falYok = b.hazir && !b.fal;
  const seciliKarakter = karakterler.find((k) => k.id === karakterId) ?? null;
  const hazirT = HAZIR_MODELLER.find((h) => h.ad === hazirModel)!;
  const sablonT = SABLONLAR.find((s) => s.id === sablon)!;
  const doluYuvalar = YUVALAR.filter((y) => yuvalar[y.id]);
  const hazirYuvalar = doluYuvalar.filter((y) => yuvalar[y.id]!.durum === "hazir");
  const anaYuva = hazirYuvalar[0];
  const pozlar = POZLAR.filter((p) => cekimler.includes(p[0]));
  const tekGiydir = modelKaynak === "foto";
  const birimSahne = sahneDemo ? 0 : modelKredi(sahne) * cozunurlukCarpani(cozunurluk);
  const birimGiydir = modelKredi(giydir);
  const kac = tekGiydir ? 1 : pozlar.length * varyasyon;
  const toplam = tekGiydir ? birimGiydir : birimSahne * kac;
  const demoMu = !tekGiydir && sahneDemo;
  const eksik = !doluYuvalar.length ? "Ürün fotoğrafını ekle"
    : doluYuvalar.some((y) => yuvalar[y.id]!.durum === "yukleniyor") ? "Görseller yükleniyor"
    : !hazirYuvalar.length ? "Ürün görseli yüklenemedi"
    : modelKaynak === "karakter" && !seciliKarakter ? (karakterler.length ? "Bir karakter seç" : "Karakter oluştur ya da hazır model seç")
    : tekGiydir && modelFoto?.durum !== "hazir" ? "Model fotoğrafını yükle"
    : tekGiydir && falYok ? "Birebir giydirme için fal.ai bağlantısı gerekli"
    : !tekGiydir && !pozlar.length ? "En az bir çekim seç"
    : null;

  /* ── Yükleme ── */
  const urunYukle = async (dosyalar: File[], yuva?: string) => {
    const uygun = dosyalar.filter((d) => GORSEL_TURLERI.includes(d.type));
    if (!uygun.length) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    // Belirli yuva verilmediyse sıradaki boş yuvalara dağıtılır.
    const bos = YUVALAR.filter((y) => !yuvalar[y.id]).map((y) => y.id);
    const hedefler = yuva ? [yuva] : bos;
    if (!hedefler.length) return void toast.error("Tüm yuvalar dolu", { description: "Yenisi için bir ürünü kaldır." });
    for (const [i, d] of uygun.slice(0, hedefler.length).entries()) {
      const y = hedefler[i]; const id = `${d.name}-${d.size}`;
      const dataUrl = await dosyaOku(d);
      setYuvalar((s) => ({ ...s, [y]: { id, url: dataUrl, durum: "yukleniyor" } }));
      gorselYukle(dataUrl).then((url) => setYuvalar((s) => (s[y]?.id === id ? { ...s, [y]: { id, url, durum: "hazir" } } : s)))
        .catch((e: Error) => setYuvalar((s) => (s[y]?.id === id ? { ...s, [y]: { id, url: dataUrl, durum: "hata", hata: e.message } } : s)));
    }
  };
  const modelYukle = async (d?: File) => {
    if (!d) return;
    if (!GORSEL_TURLERI.includes(d.type)) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    const id = `${d.name}-${d.size}`; const dataUrl = await dosyaOku(d);
    setModelFoto({ id, url: dataUrl, durum: "yukleniyor" });
    gorselYukle(dataUrl).then((url) => setModelFoto({ id, url, durum: "hazir" })).catch((e: Error) => setModelFoto({ id, url: dataUrl, durum: "hata", hata: e.message }));
  };
  useEffect(() => {
    const f = (e: ClipboardEvent) => {
      const h = e.target as HTMLElement | null;
      if (h && /^(INPUT|TEXTAREA)$/.test(h.tagName)) return;
      const l = [...(e.clipboardData?.files ?? [])].filter((x) => GORSEL_TURLERI.includes(x.type));
      if (l.length) { e.preventDefault(); void urunYukle(l); }
    };
    window.addEventListener("paste", f); return () => window.removeEventListener("paste", f);
  });

  // "Arka planı temizle" sonucu gelince yuvadaki ürün temiz haliyle değişir.
  const uretimler = useProjeler((s) => s.uretimler);
  useEffect(() => {
    for (const [uid, y] of temizlenen.current) {
      const u = uretimler.find((x) => x.id === uid);
      if (!u || u.durum === "kuyrukta" || u.durum === "isleniyor") continue;
      temizlenen.current.delete(uid);
      const g = uretimGorseli(u);
      if (u.durum === "tamam" && u.gercek !== false && g) {
        setYuvalar((s) => (s[y] ? { ...s, [y]: { ...s[y]!, url: g, durum: "hazir" } } : s));
        toast.success("Arka plan temizlendi", { description: "Ürün görseli güncellendi." });
      } else {
        setYuvalar((s) => (s[y] ? { ...s, [y]: { ...s[y]!, durum: "hazir" } } : s));
        toast.error("Arka plan temizlenemedi", { description: u.gercek === false ? "Sağlayıcı bağlı değil, görsel olduğu gibi kaldı." : u.hata ?? "Yeniden dene." });
      }
    }
  }, [uretimler]);
  const arkaPlanTemizle = (y: string) => {
    const u = yuvalar[y];
    if (!u || u.durum !== "hazir") return;
    const s = uretimBaslat({ baslik: "Ürün arka planı", tur: "gorsel", model: "Nano Banana 2.1", prompt: "Ürünün arka planını kaldır", kredi: b.fal ? 1 : 0, arac: "Arka plan", meta: { islem: "arkaplan", gorselUrl: u.url, zemin: "seffaf" } });
    if (!s.ok || !s.id) return uretimHataToast(s);
    temizlenen.current.set(s.id, y);
    setYuvalar((st) => ({ ...st, [y]: { ...u, durum: "yukleniyor" } }));
  };

  /* ── Üretim ── */
  const sahneUret = () => {
    const kim = modelKaynak === "karakter" && seciliKarakter ? `@${seciliKarakter.ad}` : hazirT.tarif;
    const parcalar = hazirYuvalar.map((y, i) => `the exact ${y.en} shown in product reference image ${i + 1}`).join(", ");
    const istemOlustur = (p: (typeof POZLAR)[number]) => `Fashion catalog photo of ${kim} wearing ${parcalar}, ${p[3]}. Scene: ${pano ? (pano.tarif || "styled like the style reference images") : sablonT.tarif}. Keep every garment's color, pattern, logo, fabric and cut exactly as in the product photos; realistic fit and drape, natural skin, high-end fashion photography.${not.trim() ? ` Additional direction: ${not.trim()}.` : ""}`;
    const d = icerikDenetle(istemOlustur(pozlar[0]) + " " + not);
    if (!d.izin) { toast.error("İçerik engellendi", { description: `${kategoriEtiket(d.kategori)}. ${d.mesaj}` }); return 0; }
    const urunUrl = hazirYuvalar.map((y) => yuvalar[y.id]!.url);
    const refler = [...urunUrl, ...(modelKaynak === "hazir" ? [hazirT.gorsel] : [])];
    const sahneAd = pano ? pano.ad : sablonT.ad;
    const grupId = `moda-${Date.now().toString(36)}`;
    // Demo çıktısı: seçili sahnenin görseli ve aynı kategorideki sahneler (alakasız görsel yok).
    const demoHavuz = pano ? pano.gorseller : [sablonT.gorsel, ...SABLONLAR.filter((s) => s.kat === sablonT.kat && s.id !== sablonT.id).map((s) => s.gorsel)];
    let n = 0;
    disari: for (const p of pozlar) {
      for (let v = 0; v < varyasyon; v++) {
        const istem = istemOlustur(p);
        const gorunur = `${sahneAd} sahnesi, ${kucuk(p[1])} çekim. Model: ${modelKaynak === "karakter" && seciliKarakter ? `@${seciliKarakter.ad}` : hazirT.ad}. Ürünler: ${hazirYuvalar.map((y) => kucuk(y.ad)).join(", ")}.${not.trim() ? ` ${not.trim()}` : ""}`;
        const s = uretimBaslat({
          baslik: `${sahneAd} · ${p[1]}`, tur: "gorsel", model: SAHNE_MODELI, prompt: istem, kredi: birimSahne, arac: ARAC, projeId: aktifProjeId ?? undefined,
          meta: { islem: "uret", oran, cozunurluk, hamIstem: gorunur, grupId, sira: n, referanslar: refler, gorselUrl: urunUrl[0], pano: sahneAd, demoOrnek: demoHavuz[n % demoHavuz.length],
            stilRefler: pano ? pano.gorseller.slice(0, 3) : [sablonT.gorsel], ...(pano?.guc ? { stilGuc: pano.guc } : {}), ...(pano?.kacin ? { negatif: pano.kacin } : {}) },
        });
        if (!s.ok) { if (!n) uretimHataToast(s); break disari; }
        n++;
      }
    }
    if (n) setAktifGrup(grupId);
    return n;
  };
  const giydirCalistir = (modelUrl: string, kaynakId?: string) => {
    if (falYok) return void toast.error("Birebir giydirme kullanılamıyor", { description: "Bunun için fal.ai bağlantısı gerekli." });
    const y = hazirYuvalar.find((x) => x.fashn) ?? anaYuva;
    if (!y) return void toast.error("Ürün fotoğrafı yok", { description: "Giydirmek için önce bir ürün ekle." });
    const s = uretimBaslat({
      baslik: `Birebir giydirme · ${y.ad}`, tur: "gorsel", model: GIYDIR_MODELI, prompt: "Ürünü modele giydir", kredi: birimGiydir, arac: ARAC, projeId: aktifProjeId ?? undefined,
      meta: { islem: "giydir", referanslar: [modelUrl, yuvalar[y.id]!.url], giysi: { kategori: y.fashn ?? "auto", foto: fotoTuru, mod }, ...(kaynakId ? { kaynakId } : {}), oran: "Auto", pano: "Birebir giydirme" },
    });
    if (!s.ok) return uretimHataToast(s);
    if (s.id) setAktifGrup(s.id);
    toast.success("Ürün giydiriliyor", { description: `FASHN v1.6 · ${krediYaz(birimGiydir)} kredi.` });
    setSekme("cekimler");
  };
  const uret = () => {
    if (gonderiliyor) return;
    if (eksik) {
      if (!doluYuvalar.length) setAcik("urun"); else if (eksik.includes("karakter") || eksik.includes("Model")) setAcik("model");
      return void toast.error("Çekim başlatılamadı", { description: `${eksik}.` });
    }
    setGonderiliyor(true);
    if (tekGiydir && modelFoto) giydirCalistir(modelFoto.url);
    else {
      const n = sahneUret();
      if (n) { setSekme("cekimler"); toast.success(`${n} katalog karesi üretiliyor`, { description: `${SAHNE_MODELI} · ${sahneDemo ? "Kredi düşmez." : `${krediYaz(birimSahne * n)} kredi.`}` }); }
    }
    setTimeout(() => setGonderiliyor(false), 800);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.repeat && !ayarPanel && !document.querySelector("[data-goruntuleyici]")) { e.preventDefault(); uret(); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  const { setler, surenSayi } = useDumpSetleri(ARAC);
  const aktif = setler.find((s) => s.id === aktifGrup) ?? setler[0];

  /* ═════════════ Parçalar ═════════════ */
  const urunKaresi = (url: string | undefined) => url ? <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null;
  const modelAvatar = (sinif: string) => modelKaynak === "karakter"
    ? seciliKarakter ? <ElementKapak e={seciliKarakter} className={cn(sinif, "overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover")} oynat={false} /> : null
    : modelKaynak === "foto" ? (modelFoto ? <img src={modelFoto.url} alt="" className={cn(sinif, "object-cover")} /> : null)
    : <img src={hazirT.gorsel} alt="" className={cn(sinif, "object-cover")} />;
  const modelAd = modelKaynak === "hazir" ? hazirT.ad : modelKaynak === "karakter" ? (seciliKarakter ? `@${seciliKarakter.ad}` : "Seçilmedi") : modelFoto ? "Fotoğrafın" : "Yüklenmedi";
  const urunAd = !doluYuvalar.length ? "Ekle" : doluYuvalar.length === 1 ? doluYuvalar[0].ad : `${doluYuvalar[0].ad} +${doluYuvalar.length - 1}`;

  const urunPaneli = (
    <div className="space-y-2 p-0.5">
      <div className="overflow-hidden rounded-[16px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="text-[12.5px] font-semibold text-metin">Parçalar</span><span className="text-[11.5px] text-metin-3">Birden çok parça kombin olur</span><span className="ml-auto rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] tabular-nums text-metin-2">{doluYuvalar.length}/{YUVALAR.length}</span></div>
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {YUVALAR.map((y) => {
          const u = yuvalar[y.id];
          return (
            <div key={y.id} className="group relative">
              <button onClick={() => { setHedefYuva(y.id); urunRef.current?.click(); }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void urunYukle([...e.dataTransfer.files], y.id); }}
                aria-label={`${y.ad} ${u ? "değiştir" : "ekle"}`}
                className={cn("relative flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[12px] transition-[background-color,box-shadow] active:scale-[0.97]",
                  u ? "bg-white/[0.04] ring-1 ring-inset ring-white/15" : "bg-white/[0.03] text-metin-2 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06] hover:text-metin hover:ring-white/25")}>
                {u ? <img src={u.url} alt={y.ad} className={cn("absolute inset-0 h-full w-full object-cover", u.durum === "yukleniyor" && "opacity-40")} />
                  : <><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] transition-colors group-hover:bg-white group-hover:text-black"><y.ikon className="h-4 w-4" strokeWidth={1.8} /></span><span className="text-[12px] font-medium">{y.ad}</span></>}
                {u && <span className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-black/60 py-0.5 text-center text-[10.5px] font-semibold text-white backdrop-blur">{y.ad}</span>}
                {u?.durum === "yukleniyor" && <Loader2 className="absolute h-5 w-5 animate-spin text-white" />}
                {u?.durum === "hata" && <span className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-rose-500/90 py-0.5 text-center text-[10.5px] font-semibold text-white">Yüklenemedi</span>}
              </button>
              {u && <button onClick={() => setYuvalar((s) => ({ ...s, [y.id]: undefined }))} aria-label={`${y.ad} kaldır`} className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#0b0b0c]/85 text-white active:scale-90"><X className="h-3 w-3" /></button>}
              {u?.durum === "hazir" && b.fal && <button onClick={() => arkaPlanTemizle(y.id)} title="Arka planı kaldır · 1 kredi" className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-center gap-1 rounded-full bg-[#0b0b0c]/85 py-1 text-[10.5px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"><Eraser className="h-3 w-3" />Temizle</button>}
            </div>
          );
        })}
      </div>
      </div>
      <div className="overflow-hidden rounded-[16px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="text-[12.5px] font-semibold text-metin">Fotoğraf türü</span></div>
        <div className="p-2"><Kayan tam id="moda-foto" etiket="Fotoğraf türü" deger={fotoTuru} onDeger={setFotoTuru} secenekler={FOTO_TURU.map(([v, a, I]) => ({ v, a: <><I className="h-3.5 w-3.5" />{a}</> }))} /></div>
        <p className="flex items-start gap-2 border-t border-white/[0.06] px-3 py-2.5 text-[12px] leading-snug text-metin-3"><Info className="mt-px h-3.5 w-3.5 shrink-0" />Düz zeminde, kırışıksız ve tamamı görünen ürün en iyi sonucu verir.</p>
      </div>
    </div>
  );

  const modelListe = HAZIR_MODELLER.filter((h) => h.cins === modelCins);
  const modelPaneli = (
    <div className="p-1.5">
      <div className="mb-3"><Kayan tam id="moda-mk" etiket="Model kaynağı" deger={modelKaynak} onDeger={setModelKaynak} secenekler={[{ v: "hazir", a: "Hazır" }, { v: "karakter", a: "Karakterim" }, { v: "foto", a: "Fotoğrafın" }]} /></div>
      {modelKaynak === "hazir" && (<>
        <div className="mb-2.5 flex items-center justify-between gap-2"><span className="text-[12.5px] font-medium text-metin-2">{modelListe.length} hazır model</span><Kayan id="moda-cins" etiket="Cinsiyet" deger={modelCins} onDeger={setModelCins} secenekler={[{ v: "k", a: "Kadın", n: 8 }, { v: "e", a: "Erkek", n: 9 }]} /></div>
        <div className="grid grid-cols-4 gap-2">
          {modelListe.map((h) => (
            <button key={h.ad} onClick={() => { setHazirModel(h.ad); setAcik(null); }} aria-pressed={hazirModel === h.ad} className="group text-left active:scale-[0.97]">
              <span className={cn("relative block aspect-[4/5] overflow-hidden rounded-[12px]", hazirModel === h.ad ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-inset ring-white/10 group-hover:ring-white/30")}>
                <img src={h.gorsel} alt={h.ad} className="h-full w-full object-cover" />
              </span>
              <span className="mt-1 block truncate text-[11.5px] font-medium text-metin-2">{h.ad}</span>
            </button>
          ))}
        </div>
      </>)}
      {modelKaynak === "karakter" && (karakterler.length ? (
        <div className="grid grid-cols-4 gap-2">
          {karakterler.map((k) => (
            <button key={k.id} onClick={() => { setKarakterId(k.id); setAcik(null); }} aria-pressed={karakterId === k.id} className="group text-left active:scale-[0.97]">
              <span className={cn("relative block aspect-[4/5] overflow-hidden rounded-[12px]", karakterId === k.id ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-inset ring-white/10 group-hover:ring-white/30")}>
                <ElementKapak e={k} className="absolute inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover" oynat={false} />
              </span>
              <span className="mt-1 block truncate text-[11.5px] font-medium text-metin-2">@{k.ad}</span>
            </button>
          ))}
          <Link href="/panel/karakter/yeni" className="group text-left"><span className="flex aspect-[4/5] items-center justify-center rounded-[12px] border border-dashed border-white/[0.16] text-metin-3 group-hover:border-white/35 group-hover:text-metin"><Plus className="h-4 w-4" /></span><span className="mt-1 block text-[11.5px] text-metin-3">Yeni</span></Link>
        </div>
      ) : (
        <Link href="/panel/karakter/yeni" className="flex items-center gap-3 rounded-[14px] bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.07]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0a0a0b]"><Plus className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold text-metin">Karakter oluştur</span><span className="block text-[12px] text-metin-3">1 ile 5 fotoğraf, ücretsiz; katalogda hep aynı yüz</span></span>
        </Link>
      ))}
      {modelKaynak === "foto" && (
        <div className="flex items-start gap-3">
          <button onClick={() => modelRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void modelYukle(e.dataTransfer.files[0]); }}
            className={cn("relative flex aspect-[3/4] w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] active:scale-[0.97]", modelFoto ? "ring-1 ring-inset ring-white/15" : "border border-dashed border-white/[0.22] hover:border-white/40")}>
            {modelFoto ? <img src={modelFoto.url} alt="Model fotoğrafı" className={cn("absolute inset-0 h-full w-full object-cover", modelFoto.durum === "yukleniyor" && "opacity-50")} /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0a0a0b]"><Upload className="h-4 w-4" /></span>}
            {modelFoto?.durum === "yukleniyor" && <Loader2 className="absolute h-4 w-4 animate-spin text-white" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-metin">Birebir sanal deneme</p>
            <p className="mt-1 text-[12px] leading-snug text-metin-3">Boy fotoğrafındaki kişiye ürün giydirilir; poz, yüz ve mekân aynen kalır. Sahne ve çekim listesi kullanılmaz.</p>
            {falYok && <p className="mt-2 inline-flex rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-metin-2">fal.ai bağlanınca açılır</p>}
            {modelFoto && <div className="mt-2 flex gap-1.5"><button onClick={() => modelRef.current?.click()} className="h-8 rounded-full bg-white/[0.07] px-3 text-[12px] font-medium text-metin hover:bg-white/[0.11]">Değiştir</button><button onClick={() => setModelFoto(null)} className="h-8 rounded-full px-3 text-[12px] text-metin-3 hover:text-metin">Kaldır</button></div>}
          </div>
        </div>
      )}
    </div>
  );

  const cekimDegis = (id: string) => setCekimler((l) => l.includes(id) ? (l.length > 1 ? l.filter((x) => x !== id) : l) : l.length >= EN_FAZLA_CEKIM ? l : [...l, id]);
  const cekimPaneli = (
    <div className="space-y-2 p-0.5">
      <div className="overflow-hidden rounded-[16px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="text-[12.5px] font-semibold text-metin">Hazır setler</span><span className="text-[11.5px] text-metin-3">Tek dokunuşla açıları seç</span></div>
        <div className="grid grid-cols-3 gap-1.5 p-2">
          {CEKIM_SETLERI.map(([id, ad, l]) => {
            const sec = l.length === cekimler.length && l.every((x) => cekimler.includes(x));
            return (
              <button key={id} onClick={() => setCekimler(l)} aria-pressed={sec}
                className={cn("rounded-[12px] px-2.5 py-2 text-left ring-1 ring-inset transition-[background-color,box-shadow] active:scale-[0.97]", sec ? "bg-white/[0.08] ring-white/60" : "bg-white/[0.03] ring-white/[0.06] hover:bg-white/[0.06]")}>
                <span className="flex items-center justify-between"><span className="text-[12.5px] font-semibold text-metin">{ad}</span><span className="text-[11.5px] tabular-nums text-metin-3">{l.length}</span></span>
                <span className="mt-0.5 block text-[11px] leading-snug text-metin-3">{l.map((x) => POZLAR.find((p) => p[0] === x)?.[1]).filter(Boolean).join(", ")}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="overflow-hidden rounded-[16px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="text-[12.5px] font-semibold text-metin">Açılar</span><span className="text-[11.5px] text-metin-3">Sırayla çekilir</span><span className="ml-auto rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] tabular-nums text-metin-2">{pozlar.length}/{EN_FAZLA_CEKIM}</span></div>
        <div className="grid grid-cols-4 gap-1.5 p-2">
          {POZLAR.map(([v, ad, I]) => {
            const sira = pozlar.findIndex((p) => p[0] === v);
            const sec = sira >= 0;
            return (
              <button key={v} onClick={() => cekimDegis(v)} aria-pressed={sec} disabled={!sec && pozlar.length >= EN_FAZLA_CEKIM}
                className={cn("relative flex flex-col items-center gap-1.5 rounded-[12px] px-1 pb-2 pt-2.5 ring-1 ring-inset transition-[background-color,box-shadow] active:scale-[0.97] disabled:opacity-35", sec ? "bg-white/[0.08] ring-white/60" : "bg-white/[0.03] ring-white/[0.06] hover:bg-white/[0.06]")}>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", sec ? "bg-white text-black" : "bg-white/[0.07] text-metin-2")}><I className="h-4 w-4" strokeWidth={1.8} /></span>
                <span className={cn("text-[11.5px] font-medium", sec ? "text-metin" : "text-metin-2")}>{ad}</span>
                {sec && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white/[0.14] px-1 text-[10px] font-semibold tabular-nums text-metin">{sira + 1}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <button onClick={() => setVaryasyon((v) => (v === 1 ? 2 : 1))} aria-pressed={varyasyon === 2}
        className={cn("flex w-full items-center justify-between gap-3 rounded-[16px] px-3 py-2.5 text-left ring-1 ring-inset transition-colors", varyasyon === 2 ? "bg-white/[0.06] ring-white/30" : "bg-white/[0.025] ring-white/[0.07] hover:bg-white/[0.05]")}>
        <span className="leading-tight"><span className="block text-[12.5px] font-semibold text-metin">Her açıdan 2 varyasyon</span><span className="block text-[11.5px] text-metin-3">{kac} kare üretilir</span></span>
        <span className={cn("relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors", varyasyon === 2 ? "bg-white" : "bg-white/[0.14]")}>
          <span className={cn("absolute top-0.5 h-4 w-4 rounded-full transition-all", varyasyon === 2 ? "left-[18px] bg-[#0a0a0b]" : "left-0.5 bg-white")} />
        </span>
      </button>
    </div>
  );
  const bicimPaneli = (
    <div className="p-1.5">
      {tekGiydir ? (<>
        <p className="mb-2 text-[12px] font-medium text-metin-2">Giydirme kalitesi</p>
        <Kayan id="moda-mod" etiket="Kalite" deger={mod} onDeger={setMod} secenekler={[{ v: "performance", a: "Hızlı" }, { v: "balanced", a: "Dengeli" }, { v: "quality", a: "Kalite" }]} />
        <p className="mt-3 text-[12px] text-metin-3">Birebir denemede oran fotoğrafınla aynı kalır.</p>
      </>) : (<>
        <div className="grid grid-cols-3 gap-1.5">
          {ORANLAR.map(([o, ad]) => (
            <button key={o} onClick={() => setOran(o)} aria-pressed={oran === o}
              className={cn("flex h-[66px] flex-col items-center justify-center gap-1 rounded-[12px] transition-colors active:scale-[0.97]", oran === o ? "bg-white text-[#0a0a0b]" : "bg-white/[0.04] text-metin-2 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.07]")}>
              <OranSekli oran={o} boyut={16} /><span className="text-[12px] font-semibold tabular-nums leading-none">{o}</span><span className={cn("text-[10.5px] leading-none", oran === o ? "text-black/55" : "text-metin-3")}>{ad}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-0.5 rounded-full bg-white/[0.05] p-0.5 ring-1 ring-inset ring-white/[0.07]">
          {["1K", "2K", "4K"].map((c) => (
            <button key={c} onClick={() => setCozunurluk(c)} className={cn("relative isolate h-8 rounded-full text-[12.5px] font-semibold transition-colors", cozunurluk === c ? "text-[#0a0a0b]" : "text-metin-3 hover:text-metin")}>
              {cozunurluk === c && <motion.span layoutId="moda-kalite" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}{c}
            </button>
          ))}
        </div>
      </>)}
    </div>
  );

  /* ── Komut çubuğu ── */
  const uretDugmesi = (
    <button onClick={uret} disabled={gonderiliyor} aria-disabled={!!eksik}
      className={cn("flex h-14 shrink-0 items-center justify-center gap-2 rounded-[18px] px-6 text-[15.5px] font-semibold transition-[transform,background-color,color] active:scale-[0.98] max-md:w-full",
        eksik ? "bg-white/[0.08] text-metin-3 ring-1 ring-inset ring-white/[0.08]" : "bg-white text-[#0a0a0b]")}>
      {gonderiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : tekGiydir ? <Shirt className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      {tekGiydir ? "Ürünü giydir" : `${kac} kare üret`}
      {demoMu ? <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-semibold", eksik ? "bg-white/[0.06]" : "bg-black/[0.08]")}>Ücretsiz</span>
        : <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums", eksik ? "bg-white/[0.06]" : "bg-black/[0.08]")}><KrediYildiz className="h-3 w-3" />{krediYaz(toplam)}</span>}
    </button>
  );
  const komut = (
    <div className={cn("w-full rounded-[28px] p-3", CAM)}>
      {eksik && doluYuvalar.length > 0 && <p className="mx-auto mb-2 flex w-fit items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[12.5px] text-metin-2"><Info className="h-3.5 w-3.5" />{eksik}</p>}
      <div className="flex items-center gap-2 max-md:flex-col max-md:items-stretch">
        <div className={cn("flex min-w-0 flex-1 items-center gap-1.5", !masaustu && "[&>*:nth-child(-n+2)]:min-w-0 [&>*:nth-child(-n+2)]:flex-1 [&>*:nth-child(-n+2)>button]:w-full")}>
          <KCip buyuk iri etiket="Ürün" deger={urunAd} vurgu={!doluYuvalar.length} acik={acik === "urun"} setAcik={(v) => setAcik(v ? "urun" : null)} genislik={360}
            ikon={anaYuva ? <span className="relative block h-full w-full">{urunKaresi(yuvalar[anaYuva.id]?.url)}</span> : <Shirt className="h-4 w-4" />}>{urunPaneli}</KCip>
          <KCip buyuk iri etiket="Model" deger={modelAd} vurgu={(modelKaynak === "karakter" && !seciliKarakter) || (tekGiydir && !modelFoto)} acik={acik === "model"} setAcik={(v) => setAcik(v ? "model" : null)} genislik={380}
            ikon={modelAvatar("h-full w-full") ?? (modelKaynak === "foto" ? <Camera className="h-4 w-4" /> : <ScanFace className="h-4 w-4" />)}>{modelPaneli}</KCip>
          {masaustu && !tekGiydir && <>
            <button onClick={() => sahneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="flex h-14 shrink-0 items-center gap-3 rounded-full bg-white/[0.06] pl-2 pr-5 text-[14.5px] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] active:scale-[0.97]">
              <img src={pano ? pano.gorseller[0] : sablonT.gorsel} alt="" className="h-10 w-10 rounded-full object-cover" />
              <span className="flex flex-col items-start leading-tight"><span className="text-[11.5px] text-metin-3">Sahne</span><span className="max-w-[130px] truncate whitespace-nowrap font-medium text-metin">{pano ? pano.ad : sablonT.ad}</span></span>
            </button>
            <KCip buyuk iri etiket="Çekimler" deger={`${pozlar[0]?.[1] ?? "Seç"}${pozlar.length > 1 ? ` +${pozlar.length - 1}` : ""}`} acik={acik === "cekim"} setAcik={(v) => setAcik(v ? "cekim" : null)} genislik={380}
              ikon={<span className="text-[13px] font-semibold tabular-nums text-metin">{kac}</span>}>{cekimPaneli}</KCip>
          </>}
          {masaustu && <KCip buyuk iri etiket={tekGiydir ? "Kalite" : "Biçim"} deger={tekGiydir ? ({ performance: "Hızlı", balanced: "Dengeli", quality: "Kalite" } as Record<string, string>)[mod] : `${oran} · ${cozunurluk}`} acik={acik === "bicim"} setAcik={(v) => setAcik(v ? "bicim" : null)} genislik={320}
            ikon={tekGiydir ? <SlidersHorizontal className="h-4 w-4" /> : <OranSekli oran={oran} boyut={16} className="text-metin" />}>{bicimPaneli}</KCip>}
          {!tekGiydir && <button onClick={() => setNotAcik((v) => !v)} aria-pressed={notAcik || !!not} title="İsteğe bağlı yönlendirme" aria-label="Yönlendirme ekle"
            className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 ring-inset transition-colors active:scale-[0.95]", notAcik || not ? "bg-white text-[#0a0a0b] ring-white" : "bg-white/[0.06] text-metin ring-white/[0.08] hover:bg-white/[0.1]")}><PenLine className="h-[18px] w-[18px]" /></button>}
          {!masaustu && <button onClick={() => setAyarPanel(true)} aria-label="Ayarlar" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-metin ring-1 ring-inset ring-white/[0.08] active:scale-[0.95]"><SlidersHorizontal className="h-[18px] w-[18px]" /></button>}
        </div>
        {uretDugmesi}
      </div>
      {!tekGiydir && (notAcik || not) && (
        <input autoFocus={notAcik && !not} value={not} onChange={(e) => setNot(e.target.value.slice(0, 300))} aria-label="İsteğe bağlı yönlendirme"
          placeholder={masaustu ? "İsteğe bağlı yönlendirme: ceketin önü açık, eller cepte, rüzgârlı saç" : "İsteğe bağlı yönlendirme"}
          className="mt-2 h-9 w-full rounded-full bg-white/[0.04] px-4 text-[13px] text-metin outline-none ring-1 ring-inset ring-white/[0.06] placeholder:text-metin-3 focus:ring-white/20" />
      )}
    </div>
  );

  /* ── Oluştur ── */
  const yelpazeGorseller = pano ? [...pano.gorseller, ...pano.gorseller].slice(0, 4) : [sablonT.gorsel, ...SABLONLAR.filter((s) => s.kat === sablonT.kat && s.id !== sablonT.id).map((s) => s.gorsel), ...SABLONLAR.filter((s) => s.kat !== sablonT.kat).map((s) => s.gorsel)].slice(0, 4);
  const sira = [1, 0, 2, 3];
  const yelpaze = (
    <div className={cn("relative mx-auto", masaustu ? "h-[300px] w-[640px]" : "h-[200px] w-full max-w-[360px]")}>
      {sira.map((k, i) => {
        const g = yelpazeGorseller[k]; if (!g) return null;
        const d = i - 1.5;
        const o = masaustu ? { w: 180, h: 250, ara: 125, dy: 14 } : { w: 112, h: 156, ara: 74, dy: 9 };
        return (
          <motion.img key={g + i} src={g} alt="" initial={{ opacity: 0, y: 30, rotate: 0 }} animate={{ opacity: 1, y: Math.abs(d) * o.dy, rotate: d * 8 }}
            transition={{ type: "spring", stiffness: 170, damping: 19, delay: i * 0.05 }}
            className="absolute left-1/2 top-0 rounded-[18px] object-cover ring-1 ring-white/15" style={{ width: o.w, height: o.h, marginLeft: -o.w / 2 + d * o.ara, zIndex: 4 - Math.round(Math.abs(d)) }} />
        );
      })}
      <div className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 translate-y-1/3 items-center gap-1.5 rounded-full bg-[#0b0b0c] p-1">
        <button onClick={() => (doluYuvalar.length ? setAcik("urun") : urunRef.current?.click())} aria-label={doluYuvalar.length ? "Ürünleri düzenle" : "Ürün yükle"}
          className={cn("relative flex items-center justify-center overflow-hidden rounded-full transition-transform active:scale-95", masaustu ? "h-[64px] w-[64px]" : "h-14 w-14", anaYuva ? "bg-white/[0.06] ring-2 ring-white" : "bg-[#1b1c1f] text-metin-2 ring-2 ring-white/25", surukle && "ring-white")}>
          {anaYuva ? urunKaresi(yuvalar[anaYuva.id]?.url) : <Upload className="h-5 w-5" />}
          {doluYuvalar.length > 1 && <span className="absolute bottom-0.5 right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0b0b0c] px-1 text-[10.5px] font-semibold text-white">{doluYuvalar.length}</span>}
        </button>
        <button onClick={() => setAcik("model")} aria-label="Modeli değiştir"
          className={cn("relative overflow-hidden rounded-full ring-2 ring-white transition-transform active:scale-95", masaustu ? "h-[64px] w-[64px]" : "h-14 w-14")}>
          {modelAvatar("absolute inset-0 h-full w-full") ?? <span className="absolute inset-0 flex items-center justify-center bg-[#1b1c1f] text-metin-2"><Plus className="h-5 w-5" /></span>}
        </button>
      </div>
    </div>
  );
  const aranan = kucuk(arama.trim());
  const panoSecenekleri: (SeciliPano & { kapak: string })[] = [
    ...kullaniciPanolari.filter((p) => p.gorseller.length).map((p) => ({ ad: p.ad, gorseller: p.gorseller, kullanici: true, tarif: p.tarif, kacin: p.kacin, guc: p.guc, renkler: p.renkler, kapak: p.gorseller[0] })),
    ...HAZIR_PANOLAR.map((p) => ({ ad: p.ad, gorseller: p.gorseller, kapak: p.gorsel })),
  ].filter((p) => !aranan || kucuk(p.ad).includes(aranan));
  const sahneListe = SABLONLAR.filter((s) => (sahneKat === "Tümü" || s.kat === sahneKat) && (!aranan || kucuk(`${s.ad} ${s.not} ${s.kat}`).includes(aranan)));
  const sahneSec = (id: string) => { setSablon(id); setPano(null); if (modelKaynak === "foto") setModelKaynak("hazir"); anaRef.current?.scrollTo({ top: 0, behavior: "smooth" }); if (!masaustu) window.scrollTo({ top: 0, behavior: "smooth" }); };

  const olustur = (
    <div onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setSurukle(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSurukle(false); }}
      onDrop={(e) => { e.preventDefault(); setSurukle(false); void urunYukle([...e.dataTransfer.files]); }}>
      <section className="flex flex-col items-center text-center">
        {yelpaze}
        <h1 className={cn("mt-14 font-semibold leading-none tracking-[-0.035em] text-metin", masaustu ? "text-[48px]" : "text-[30px]")}>Ürününü modele giydir</h1>
        <p className="mt-3 max-w-[540px] text-[15px] leading-relaxed text-metin-2">Rengi, deseni ve kesimi korunarak her açıdan bir katalog çekimi.</p>
        <div className="mt-6 flex flex-wrap items-stretch justify-center gap-2">
          {([
            [1, "Ürün", doluYuvalar.length ? doluYuvalar.map((y) => y.ad).join(", ") : "Fotoğraf yükle", doluYuvalar.length > 0, () => (doluYuvalar.length ? setAcik("urun") : urunRef.current?.click())],
            [2, "Model", modelAd, true, () => setAcik("model")],
            [3, "Sahne", pano ? pano.ad : sablonT.ad, true, () => sahneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })],
          ] as const).map(([n, e, d, tamam, f], k) => (
            <motion.button key={e} onClick={f} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + k * 0.05 }}
              className={cn("flex items-center gap-3 rounded-[16px] py-2 pl-2 pr-4 text-left ring-1 ring-inset transition-[background-color,box-shadow] active:scale-[0.98]", !tamam ? "bg-white text-[#0a0a0b] ring-white" : "bg-white/[0.04] ring-white/[0.08] hover:bg-white/[0.08]")}>
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold tabular-nums", !tamam ? "bg-black/10" : "bg-white/[0.08] text-metin")}>{tamam && n !== 1 ? n : n === 1 && tamam ? <Check className="h-4 w-4" strokeWidth={2.6} /> : <Upload className="h-4 w-4" />}</span>
              <span className="leading-tight"><span className={cn("block text-[11.5px]", !tamam ? "text-black/55" : "text-metin-3")}>{e}</span><span className={cn("block max-w-[180px] truncate text-[14px] font-semibold", !tamam ? "text-[#0a0a0b]" : "text-metin")}>{d}</span></span>
            </motion.button>
          ))}
        </div>
        {!doluYuvalar.length && <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-metin-3"><Info className="h-3.5 w-3.5" />Sürükle bırak ya da yapıştır; birden çok parça kombin olur</p>}
      </section>

      <section ref={sahneRef} className={cn(KART, "mt-12 scroll-mt-4")}>
        <div className={cn(SERIT, "flex-wrap gap-3 py-3")}>
          <Layers className="h-4 w-4 text-metin-2" /><h2 className="mr-auto text-[14px] font-semibold text-metin">Sahneler</h2>
          <label className="flex h-9 items-center gap-2 rounded-full bg-white/[0.05] px-3 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/25 max-sm:order-last max-sm:w-full sm:w-[200px]">
            <Search className="h-3.5 w-3.5 shrink-0 text-metin-3" />
            <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Sahne ara" aria-label="Sahne ara" className="min-w-0 flex-1 bg-transparent text-[13px] text-metin outline-none placeholder:text-metin-3" />
            {arama && <button onClick={() => setArama("")} aria-label="Aramayı temizle" className="text-metin-3 hover:text-metin"><X className="h-3.5 w-3.5" /></button>}
          </label>
          <div className="gizli-scroll -mx-1 min-w-0 overflow-x-auto px-1 max-sm:w-full">
            <Kayan id="moda-skat" serbest etiket="Sahne türü" deger={sahneKat} onDeger={setSahneKat}
              secenekler={[{ v: "Tümü" as const, a: "Tümü", n: SABLONLAR.length }, ...SAHNE_KATLARI.map((k) => ({ v: k, a: k, n: SABLONLAR.filter((s) => s.kat === k).length })), { v: "Panolar" as const, a: "Ruh panoları", n: kullaniciPanolari.length + HAZIR_PANOLAR.length }]} />
          </div>
        </div>
        <div className="p-4">
          {sahneKat === "Panolar" ? (
            <motion.div key="panolar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <Link href="/panel/moodboard/yeni" className="group flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-white/[0.16] text-center transition-colors hover:border-white/30">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0a0a0b] transition-transform group-hover:scale-105"><Plus className="h-4 w-4" /></span>
                <span className="text-[13.5px] font-semibold text-metin">Pano oluştur</span><span className="px-4 text-[12px] text-metin-3">Kendi ışığın ve mekânın</span>
              </Link>
              {panoSecenekleri.map((p) => {
                const a = pano?.ad === p.ad;
                return (
                  <button key={(p.kullanici ? "k-" : "h-") + p.ad} onClick={() => { setPano(p); if (modelKaynak === "foto") setModelKaynak("hazir"); anaRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }} aria-pressed={a}
                    className={cn("group relative aspect-[4/5] overflow-hidden rounded-[18px] text-left active:scale-[0.99]", a ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-inset ring-white/[0.07]")}>
                    {new Set(p.gorseller).size >= 4
                      ? <span className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[2px] bg-black">{[...new Set(p.gorseller)].slice(0, 4).map((g) => <img key={g} src={g} alt="" loading="lazy" className="h-full w-full object-cover" />)}</span>
                      : <img src={p.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                    {p.kullanici && <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">Senin</span>}
                    {a && <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>}
                    <span className="absolute inset-x-3 bottom-3 truncate text-[14px] font-semibold text-white">{p.ad}</span>
                  </button>
                );
              })}
            </motion.div>
          ) : sahneListe.length ? (
            <motion.div key={sahneKat + aranan} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {sahneListe.map((s) => {
                const a = !pano && sablon === s.id;
                return (
                  <button key={s.id} onClick={() => sahneSec(s.id)} aria-pressed={a}
                    className={cn("group relative aspect-[4/5] overflow-hidden rounded-[18px] text-left transition-transform active:scale-[0.99]", a ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-inset ring-white/[0.07] hover:ring-white/20")}>
                    <img src={s.gorsel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
                    <span className={cn("absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-all duration-200", a ? "bg-white text-black" : "translate-y-1 bg-black/55 text-white opacity-0 backdrop-blur group-hover:translate-y-0 group-hover:opacity-100")}>{a ? "Seçili" : "Seç"}</span>
                    <span className="absolute inset-x-3 bottom-3"><span className="block truncate text-[15px] font-semibold text-white">{s.ad}</span><span className="mt-0.5 block truncate text-[12px] text-white/65">{s.not}</span></span>
                  </button>
                );
              })}
              {sahneKat === "Tümü" && !aranan && (
                <button onClick={() => setSahneKat("Panolar")}
                  className="group relative aspect-[4/5] overflow-hidden rounded-[18px] text-left ring-1 ring-inset ring-white/[0.07] transition hover:ring-white/25 active:scale-[0.99]">
                  <span className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[2px] bg-black opacity-60 transition-opacity duration-500 group-hover:opacity-80">
                    {HAZIR_PANOLAR.slice(0, 4).map((p) => <img key={p.ad} src={p.gorsel} alt="" loading="lazy" className="h-full w-full object-cover" />)}
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:scale-105"><Layers className="h-5 w-5" /></span>
                    <span className="text-[14.5px] font-semibold text-white">Ruh panosundan</span>
                    <span className="text-[12px] text-white/70">Kendi ışığın ve mekânın; {kullaniciPanolari.length + HAZIR_PANOLAR.length} pano</span>
                  </span>
                </button>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Search className="h-5 w-5 text-metin-3" /><p className="text-[14px] font-medium text-metin">“{arama}” için sahne yok</p>
              <button onClick={() => { setArama(""); setSahneKat("Tümü"); }} className="mt-1 h-9 rounded-full bg-white/[0.07] px-4 text-[13px] font-medium text-metin hover:bg-white/[0.11]">Tüm sahneleri göster</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );

  /* ── Çekimler ── */
  const giydirEylemi = (u: Uretim, kapat: () => void) => (
    <>
      {u.model !== GIYDIR_MODELI && u.gercek !== false && !falYok && hazirYuvalar.length > 0 && (
        <button onClick={() => { const g = uretimGorseli(u); if (g) { giydirCalistir(g, u.id); kapat(); } }} title="FASHN ürünü bu kareye birebir giydirir"
          className="flex w-full items-center gap-3 rounded-[14px] bg-white/[0.03] p-2.5 text-left ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.07] active:scale-[0.99] disabled:opacity-40">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin-2"><Shirt className="h-4 w-4" /></span><span className="flex-1 text-[13px] font-semibold text-metin">Ürünü bu kareye birebir giydir</span>
          {!falYok && <span className="flex items-center gap-1 text-[12px] tabular-nums text-metin-3"><KrediYildiz className="h-3 w-3" />{krediYaz(birimGiydir)}</span>}
        </button>
      )}
      <button onClick={() => { const g = uretimGorseli(u); if (g) { sessionStorage.setItem("vayra-animate-ref", g); router.push("/panel/video"); } }}
        className="flex w-full items-center gap-3 rounded-[14px] bg-white/[0.03] p-2.5 text-left ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.07] active:scale-[0.99] disabled:opacity-40">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin-2"><Clapperboard className="h-4 w-4" /></span><span className="flex-1 text-[13px] font-semibold text-metin">Videoya çevir</span>
      </button>
    </>
  );
  const cekimGorunumu = aktif ? (
    <DumpSetleri arac={ARAC} setler={setler} aktifId={aktif.id} onAktif={(id) => { setAktifGrup(id); anaRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
      onSilindi={() => setAktifGrup(null)} avatarYedek={modelAvatar("h-full w-full")} metinler={["yeni sezon"]} etiketler={["moda"]}
      sosyal={false} ekEylem={giydirEylemi} kapakEtiket="Ana görsel" oncekiBaslik="Önceki çekimler" />
  ) : (
    <div className={cn(KART, "flex flex-col items-center gap-3 px-6 py-16 text-center")}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-metin-2"><Shirt className="h-5 w-5" /></span>
      <p className="text-[16px] font-semibold text-metin">Henüz bir çekimin yok</p>
      <p className="max-w-[360px] text-[13.5px] text-metin-3">Ürününü ekle, model ve sahne seç; ilk katalog çekimin birkaç dakikada burada.</p>
      <button onClick={() => setSekme("olustur")} className="mt-2 flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0a0a0b] active:scale-[0.97]">Çekim hazırla</button>
    </div>
  );

  const katmanlar = (
    <>
      <input ref={urunRef} type="file" accept={GORSEL_TURLERI.join(",")} multiple hidden onChange={(e) => { const l = [...(e.target.files ?? [])]; void urunYukle(l, l.length === 1 && acik === "urun" ? hedefYuva : undefined); e.target.value = ""; }} />
      <input ref={modelRef} type="file" accept={GORSEL_TURLERI.join(",")} hidden onChange={(e) => { void modelYukle(e.target.files?.[0]); e.target.value = ""; }} />
      <YanPanel acik={ayarPanel} onKapat={() => setAyarPanel(false)} baslik="Ayarlar">
        {!tekGiydir && (<>
          <p className="mb-2 text-[12.5px] font-medium text-metin-2">Sahne</p>
          <button onClick={() => { setAyarPanel(false); sahneRef.current?.scrollIntoView({ behavior: "smooth" }); }} className="mb-5 flex w-full items-center gap-3 rounded-[14px] bg-white/[0.05] p-2 pr-3 text-left ring-1 ring-inset ring-white/[0.08]">
            <img src={pano ? pano.gorseller[0] : sablonT.gorsel} alt="" className="h-10 w-10 rounded-[10px] object-cover" /><span className="flex-1 text-[13.5px] font-medium text-metin">{pano ? pano.ad : sablonT.ad}</span><span className="text-[12.5px] text-metin-2">Değiştir</span>
          </button>
          <p className="mb-1 text-[12.5px] font-medium text-metin-2">Çekimler</p>
          {cekimPaneli}
          <p className="mb-1 mt-4 text-[12.5px] font-medium text-metin-2">Biçim</p>
        </>)}
        {bicimPaneli}
      </YanPanel>
    </>
  );

  const ustSerit = (
    <div className="flex items-center gap-3">
      <div className="flex shrink-0 items-center gap-2.5 rounded-[14px] bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 ring-1 ring-inset ring-white/[0.07]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-metin"><Shirt className="h-4 w-4" strokeWidth={1.8} /></span>
        <span className="leading-tight">
          <span className="block whitespace-nowrap text-[13.5px] font-semibold text-metin">Moda fabrikası</span>
          <span className="block whitespace-nowrap text-[11.5px] text-metin-2 max-sm:hidden">Ürününü modele giydir</span>
        </span>
      </div>
      <div className="flex flex-1 justify-center max-sm:justify-end">
        <Kayan id="moda-sekme" etiket="Görünüm" deger={sekme} onDeger={setSekme} secenekler={[{ v: "olustur", a: "Oluştur" }, { v: "cekimler", a: "Çekimlerim", n: setler.length || undefined }]} />
      </div>
      {surenSayi > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] font-medium text-metin-2" aria-live="polite"><Loader2 className="h-3.5 w-3.5 animate-spin" />{surenSayi} kare</span>}
    </div>
  );

  /* ═════════════ MOBİL ═════════════ */
  if (!masaustu) {
    return (
      <div className="dump-kapsam flex min-h-[100dvh] flex-col overflow-x-clip bg-[#0b0b0c]" data-kendi-kisayol>
        <header className="sticky top-0 z-30 bg-[#0b0b0c]/95 px-3 py-2.5 backdrop-blur-md">{ustSerit}</header>
        <div ref={anaRef} className="flex-1 px-3 pb-6 pt-4">{sekme === "olustur" ? olustur : cekimGorunumu}</div>
        {sekme === "olustur" && <div className="sticky bottom-0 z-30 p-2 pb-[calc(8px+env(safe-area-inset-bottom))]">{komut}</div>}
        {katmanlar}
      </div>
    );
  }

  /* ═════════════ MASAÜSTÜ ═════════════ */
  return (
    <div className="dump-kapsam flex h-[calc(100vh-var(--ust-nav))] w-full flex-col bg-[#0b0b0c]" data-kendi-kisayol>
      <header className="z-20 shrink-0 border-b border-white/[0.06] bg-[#0b0b0c]/95 px-5 py-2.5 backdrop-blur-md">{ustSerit}</header>
      <div className="relative min-h-0 flex-1">
        <main ref={anaRef} className="h-full overflow-y-auto [scrollbar-width:thin]">
          <AnimatePresence mode="wait">
            <motion.div key={sekme} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={cn("mx-auto max-w-[1240px] px-8 pt-10", sekme === "olustur" ? "pb-48" : "pb-12")}>{sekme === "olustur" ? olustur : cekimGorunumu}</motion.div>
          </AnimatePresence>
        </main>
        {sekme === "olustur" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 z-30 flex justify-center px-6">
            <div className="pointer-events-auto w-full max-w-[1200px]">{komut}</div>
          </div>
        )}
      </div>
      {katmanlar}
    </div>
  );
}
