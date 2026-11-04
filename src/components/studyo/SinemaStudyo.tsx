"use client";

/**
 * Sinema stüdyosu — kendi çalışma alanı olan bir film seti.
 *
 * Düzen: solda kenar çubuğu (ana sayfa, elementler, favoriler, sahne şeridi, topluluk, projeler);
 * ortada film karuseli ve yönetmen kutusu. Kutunun üstünde beş kart pencere açar: Kareler/Referanslar,
 * Film kurulumu (tür, dönem, tempo, oyunculuk), Kamera (gövde/lens/odak/diyafram, hareket, kadraj, hız),
 * Renk paleti ve Işık. Kamera hareketleri istemde # etiketi olarak durur; sıra önemlidir.
 * Üretim başlayınca ana sayfa çekim akışına döner, kutu altta yüzer.
 *
 * Kurallar tek kaynaktan: video modelinin izinli süre/kalite/oran/ses/son kare değerleri
 * `videoModelOzellik` + `videoErisim`; görsel modelinin oran/kalitesi `gorselModelBul(...).api`;
 * demo kararı `useSaglayicilar`. Kredi Üret düğmesinde görünür; demo üretimde kredi düşmez.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import {
  ArrowLeftRight, AtSign, Check, ChevronDown, ChevronRight, Clapperboard, Clock, Feather, Film, FastForward, Hash, Heart, Image as ImageIcon, Images, Info, Layers,
  ArrowDown, ArrowUp, Link2, Rewind, MessageSquareQuote, RotateCcw, Maximize2, Repeat2, ScanFace, UserRound, LayoutGrid, Lightbulb, Loader2, Lock, Menu, Minus, Palette, Plus, Rows3, ScanEye, ScrollText, Sparkles, Sun, SwitchCamera, Upload, Volume2, VolumeX, X, Infinity as Sonsuz, Camera, Wand2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { begeniBildir, neden, uretimGeriYukle } from "@/components/studyo/bildirim";
import { cn, saltUrl } from "@/lib/utils";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { useIstemParametresi } from "@/lib/useIstemParametresi";
import { uretimBaslat as uretimBaslatHam, uretimHataToast } from "@/lib/uretimMotoru";
import { useAktifProje } from "@/lib/useAktifProje";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { videoErisim } from "@/lib/videoSaglayici";
import { videoModelOzellik } from "@/lib/videoModelVeri";
import { gorselModelBul, cozunurlukCarpani } from "@/lib/gorselModelVeri";
import { SINIRSIZ_TEKLIFLER } from "@/lib/fiyat";
import { uretimIndir } from "@/lib/gercekEylem";
import { buyutAdresi } from "@/components/kitaplik/eylemler";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useSinema } from "@/store/useSinema";
import { useElements } from "@/store/useElements";
import { useReferansKopru } from "@/store/useReferansKopru";
import { useAyarKopru } from "@/store/useAyarKopru";
import { useYorumlar } from "@/store/useYorumlar";
import { useAuth } from "@/store/useAuth";
import { useEkler, aktifSinirsizlar } from "@/store/useEkler";
import { useSecim } from "@/store/useSecim";
import { bekleyenElement } from "@/components/panel/element/KullanSecici";
import { ElementMentionInput } from "@/components/panel/ElementMentionInput";
import { ElementSeciciModal } from "@/components/panel/element/ElementSeciciModal";
import { ElementKutuphanesi, ElementDetay, type Kapsam } from "@/components/panel/element/ElementKutuphanesi";
import { ElementDuzenleModal } from "@/components/panel/element/ElementDuzenleModal";
import { YeniProjeModalHF } from "@/components/panel/StudyoModallari";
import { SecimToolbar } from "@/components/panel/SecimToolbar";
import { Yuzen } from "@/components/ui/Yuzen";
import { Tooltip } from "@/components/ui/Tooltip";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { MarkaKare } from "@/components/studyo/hf";
import { OranSekli, gorselYukle } from "@/components/arac/kit";
import { VideoGoruntuleyici, kareYakala, type AtolyeIslem, type AtolyeSonuc } from "@/components/studyo/VideoGoruntuleyici";
import { RENK_HAZIR, type Renk } from "./sinema/KlipAtolyesi";
import { GorselGoruntuleyici, type AracIstegi } from "@/components/studyo/GorselGoruntuleyici";
import { YorumSekmesi } from "@/components/studyo/YorumSekmesi";
import type { StudyoGomuluProps } from "@/components/studyo/tipler";
import { ModelSecici } from "./video/ModelSecici";
import { UretimSecici } from "./video/UretimSecici";
import { KALITE_NOT, gunEtiketi, hareketAdi, kaliteSira, kullanilabilirModeller, modelCoz, sinirsizKimligi, videoKredi, type Hareket } from "./video/veri";
import {
  KARE_MODELLERI, KARE_ORANLAR, TOPLULUK, VARSAYILAN_KURULUM, VITRIN, filmOzet, hareketEtiketi, isikAdi, istemHareketleri, kameraOzet, kurulumTamamla, kurulumTarifi, paletAdi,
  type Kurulum,
} from "./sinema/veri";
import { KurulumPenceresi, kartGorseli, type PencereTur } from "./sinema/Pencereler";
import { GorselOnizleme } from "./sinema/GorselOnizleme";
import { Kenar, type KenarSayfa } from "./sinema/Kenar";
import { SinemaKart } from "./sinema/SinemaKart";
import { SahneSeridi } from "./sinema/SahneSeridi";
import { DiyalogPaneli } from "./sinema/DiyalogPaneli";
import { KareBilgi } from "./sinema/KareBilgi";
import { DiyalogKarti, SurumKarti } from "./sinema/Surumler";
import { useSahne } from "./sinema/useSahne";

const ARAC = "Sinema Stüdyosu";
const POP = "rounded-[18px] border border-white/[0.08] bg-[#1a1a1d]";
/** Oran kutusundaki kısa ad ve altındaki kullanım notu. */
const ORAN_AD: Record<string, [string, string]> = {
  "16:9": ["Yatay", "YouTube ve sunum için"], "9:16": ["Dikey", "Reels, TikTok ve Shorts için"], "1:1": ["Kare", "Gönderi ve reklam için"], "4:3": ["Klasik", "Klasik ekran oranı"],
  "3:4": ["Portre", "Dikey portre çekimi"], "21:9": ["Sinema", "Sinemaskop, geniş perde"], "2.39:1": ["Sinema", "Sinemaskop, geniş perde"], "4:5": ["Instagram", "Instagram akışı için"], Auto: ["Oto", "Başlangıç karesinin oranı kullanılır"],
};
const VARSAYILAN_VIDEO = "Kling 3.0";
const ACI_KREDI = 2;
/** Başka açılardan çekim: her biri kaynak kareyi referans alan ayrı bir düzenleme. */
/** Çekim listesinde plan boyu ve kamera açısı: Türkçe ad ve modele giden tarif. */
const PLAN_AD: Record<string, string> = { genis: "Geniş plan", orta: "Orta plan", yakin: "Yakın plan", detay: "Detay", omuz: "Omuz üstü" };
const ACI_AD: Record<string, string> = { goz: "Göz hizası", alt: "Alttan", ust: "Üstten", kus: "Kuşbakışı", hollanda: "Yatık açı" };
const PLAN_EN: Record<string, string> = { genis: "wide establishing shot", orta: "medium shot", yakin: "close-up", detay: "extreme close-up detail shot", omuz: "over-the-shoulder shot" };
const ACI_EN: Record<string, string> = { goz: "eye-level", alt: "low angle", ust: "high angle", kus: "bird's-eye view", hollanda: "dutch angle" };
const ACI_SECENEKLERI: { id: string; ad: string; not: string; ikon: typeof Camera; en: string }[] = [
  { id: "genis", ad: "Geniş kuruluş", not: "Mekânın tamamı", ikon: Maximize2, en: "a wide establishing shot that reveals the whole location" },
  { id: "yakin", ad: "Yakın plan", not: "Yüz ve duygu", ikon: ScanFace, en: "a close-up on the main character's face" },
  { id: "alcak", ad: "Alttan", not: "Güçlü, heybetli", ikon: ArrowUp, en: "a low-angle shot looking up at the subject" },
  { id: "ters", ad: "Ters açı", not: "Omuz üstünden", ikon: Repeat2, en: "a reverse angle from behind the subject, over the shoulder" },
  { id: "kus", ad: "Kuşbakışı", not: "Tepeden bakış", ikon: ArrowDown, en: "a top-down bird's-eye view" },
  { id: "profil", ad: "Profil", not: "Yandan siluet", ikon: UserRound, en: "a side profile shot of the subject" },
];
type Kare = { url: string; yukleniyor?: boolean };
type DiyalogSatir = { id: string; kim: string; metin: string; ton: string };
/** Konuşma tonu: Türkçe ad → modele giden İngilizce tarif. */
const TONLAR: [string, string][] = [["dogal", "Doğal"], ["sakin", "Sakin"], ["heyecanli", "Heyecanlı"], ["fisilti", "Fısıltı"], ["ofkeli", "Öfkeli"], ["huzunlu", "Hüzünlü"], ["neseli", "Neşeli"]];
const TON_EN: Record<string, string> = { sakin: "calm", heyecanli: "excited", fisilti: "whispering", ofkeli: "angry", huzunlu: "sad", neseli: "cheerful" };
const ORTAM = ["yağmur sesi", "uzak şehir uğultusu", "uğuldayan rüzgâr", "kalabalık uğultusu", "dalga sesi", "gerilimli film müziği", "neredeyse sessizlik"];
/** Türkçe konuşma hızına göre kabaca süre (sn): dakikada yaklaşık 150 kelime. */
const konusmaSn = (l: { metin: string }[]) => Math.round(l.reduce((n, x) => n + x.metin.trim().split(/\s+/).filter(Boolean).length, 0) / 2.5);
/** Başlığı kelime ortasında kesmeden kısaltır. */
const kisalt = (s: string, n: number) => { const t = s.trim(); if (t.length <= n) return t; const k = t.lastIndexOf(" ", n); return t.slice(0, k > n * 0.5 ? k : n).replace(/[\s,;:.\-·]+$/, ""); };
/** Hazır kapsama paketleri: montaj için birlikte çekilen açı setleri. */
const KAPSAMA: { ad: string; not: string; acilar: string[] }[] = [
  { ad: "Diyalog", not: "Geniş, yakın ve ters açı", acilar: ["genis", "yakin", "ters"] },
  { ad: "Aksiyon", not: "Geniş, alttan ve kuşbakışı", acilar: ["genis", "alcak", "kus"] },
  { ad: "Portre", not: "Yakın, profil ve alttan", acilar: ["yakin", "profil", "alcak"] },
  { ad: "Tam kapsama", not: "Altı açının hepsi", acilar: ["genis", "yakin", "alcak", "ters", "kus", "profil"] },
];
type Cekim = { id: string; istem: string; sn: number };
type Mod = "gorsel" | "video";
type Pop = null | "diyalog" | "kmodel" | "vmodel" | "kareler" | "refler" | "oran" | "kalite" | "sure" | "kurgu" | "istem" | "oneri" | "bol" | "daha" | "kurulum" | "adet";
const SAYFALAR: KenarSayfa[] = ["ana", "element", "favori", "sahne"];

/** Yüklenen görseli hazırlar: en uzun kenar 1600 px, WebP data URL. */
function kareHazirla(dosya: Blob): Promise<string> {
  return new Promise((ok, hata) => {
    const url = URL.createObjectURL(dosya);
    const img = new Image();
    img.onload = () => {
      const olcek = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * olcek); c.height = Math.round(img.naturalHeight * olcek);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL("image/webp", 0.9));
    };
    img.onerror = () => { URL.revokeObjectURL(url); hata(new Error("görsel okunamadı")); };
    img.src = url;
  });
}
/** Kareyi sunucuya yükler (kayıtta base64 yerine kısa adres); olmazsa data URL ile devam. */
async function kareKalici(url: string): Promise<string> {
  if (!url.startsWith("data:")) return url;
  try { return await gorselYukle(url); } catch { return url; }
}
/** Sinemada varsayılan: 5 sn ve 1080p (yoksa modelin kendi varsayılanı); ilk deneme ucuz olsun. */
const varsayilanSure = (ad: string) => { const o = videoModelOzellik(ad); return o.sureler.includes(5) ? 5 : o.sure; };
const varsayilanCoz = (ad: string) => { const o = videoModelOzellik(ad); return o.cozler.includes("1080p") ? "1080p" : o.coz; };
/** Pencereleri body'ye taşır: gömülü kabuk `.fixed` öğeleri akışa aldığı için şart. */
function Govde({ children }: { children: React.ReactNode }) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  return hazir ? createPortal(children, document.body) : null;
}

export function SinemaStudyo({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
  const uretimBaslat: typeof uretimBaslatHam = (istek) => {
    const s = uretimBaslatHam(gomulu && projeId ? { ...istek, projeId } : istek);
    if (s.ok && s.id) onUretildi?.(s.id);
    return s;
  };
  const masaustu = useMasaustu();
  const router = useRouter();
  const aramaParam = useSearchParams();
  const { aktifProjeId } = useAktifProje();
  const saglayicilar = useSaglayicilar();
  const krediler = useAuth((s) => s.kullanici?.krediler ?? 0);
  const sinirsizlar = useEkler((s) => s.sinirsizlar);
  const tumUretimler = useProjeler((s) => s.uretimler);
  const projeEkle = useProjeler((s) => s.ekle);
  const guncelle = useProjeler((s) => s.guncelle);
  const favoriToggle = useProjeler((s) => s.favoriToggle);
  const sil = useProjeler((s) => s.sil);
  const tumYorumlar = useYorumlar((s) => s.yorumlar);
  const secililer = useSecim((s) => s.secililer);
  const secimToggle = useSecim((s) => s.toggle);
  const secimTemizle = useSecim((s) => s.temizle);
  useEffect(() => () => secimTemizle(), [secimTemizle]);
  const sahneler = useSahne((s) => s.sahneler);
  const aktifSahneId = useSahne((s) => s.aktifId);
  const aktifSahne = sahneler.find((s) => s.id === aktifSahneId) ?? sahneler[0];
  const projeler = useSinema((s) => s.projeler);
  const projeOlustur = useSinema((s) => s.projeOlustur);
  const elementler = useElements((s) => s.elementler);

  /* ═════════════ Durum ═════════════ */
  const [sayfa, setSayfaHam] = useState<KenarSayfa>("ana");
  const [dar, setDar] = useState(false);
  const [mobilKenar, setMobilKenar] = useState(false);
  const [mod, setMod] = useState<Mod>("video");
  const [prompt, setPrompt] = useState("");
  const [kurulum, setKurulum] = useState<Kurulum>(VARSAYILAN_KURULUM);
  const [pencere, setPencere] = useState<PencereTur | null>(null);
  const kurulumYuklendi = useRef(false);
  useEffect(() => {
    try {
      const k = localStorage.getItem("vayra-sinema-kurulum-v2"); if (k) setKurulum(kurulumTamamla(JSON.parse(k)));
      setDar(localStorage.getItem("vayra-sinema-dar") === "1");
    } catch { /* yok */ }
    kurulumYuklendi.current = true;
  }, []);
  useEffect(() => { if (kurulumYuklendi.current) try { localStorage.setItem("vayra-sinema-kurulum-v2", JSON.stringify(kurulum)); } catch { /* yok */ } }, [kurulum]);
  const darAyarla = (v: boolean) => { setDar(v); try { localStorage.setItem("vayra-sinema-dar", v ? "1" : "0"); } catch { /* yok */ } };
  const kurulumDegis = (y: Partial<Kurulum>) => setKurulum((k) => ({ ...k, ...y }));
  // Görsel (anahtar kare)
  const [kareModel, setKareModel] = useState(KARE_MODELLERI[0]);
  const [kareOran, setKareOran] = useState("16:9");
  const [kareCoz, setKareCoz] = useState("2K");
  const [refler, setRefler] = useState<Kare[]>([]);
  // Video
  const [model, setModel] = useState(VARSAYILAN_VIDEO);
  const oz = videoModelOzellik(model);
  const [bas, setBas] = useState<Kare | null>(null);
  const [son, setSon] = useState<Kare | null>(null);
  const [kaynak, setKaynak] = useState<{ id: string; baslik: string; devam: boolean; yon?: "oncesi" | "kopru"; hedefBaslik?: string } | null>(null);
  const [sure, setSure] = useState(() => varsayilanSure(VARSAYILAN_VIDEO));
  const [coz, setCoz] = useState(() => varsayilanCoz(VARSAYILAN_VIDEO));
  const [oran, setOran] = useState(() => videoModelOzellik(VARSAYILAN_VIDEO).oran ?? "16:9");
  const [sesli, setSesli] = useState(true);
  const [diyalog, setDiyalog] = useState<DiyalogSatir[]>([]);
  const [sesNotu, setSesNotu] = useState("");
  const [diyalogDili, setDiyalogDili] = useState<"tr" | "en">("tr");
  const [cokCekim, setCokCekim] = useState(false);
  const [cekimMod, setCekimMod] = useState<"oto" | "ozel">("oto");
  const [cekimler, setCekimler] = useState<Cekim[]>([{ id: "c1", istem: "", sn: 3 }, { id: "c2", istem: "", sn: 3 }]);
  const [sinirsizMod, setSinirsizMod] = useState(false);
  // Ortak
  const [adet, setAdet] = useState(1);
  const [acik, setAcik] = useState<Pop>(null);
  const [elementModal, setElementModal] = useState(false);
  const [uretimSecici, setUretimSecici] = useState<null | "ref" | "bas" | "son">(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [surukle, setSurukle] = useState(false);
  const [filtre, setFiltre] = useState<"tumu" | "kare" | "video">("tumu");
  const [yogunluk, setYogunluk] = useState<"rahat" | "sik">("rahat");
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [yorum, setYorum] = useState("");
  const [favModeller, setFavModeller] = useState<string[]>([]);
  const [acilarIcin, setAcilarIcin] = useState<Uretim | null>(null);
  const [liste, setListe] = useState<{ hikaye: string; cekimler: { id: string; istem: string; cekim: string; aci: string }[] } | null>(null);
  const listeDegis = (id: string, y: Partial<{ istem: string; cekim: string; aci: string }>) => setListe((x) => (x ? { ...x, cekimler: x.cekimler.map((c) => (c.id === id ? { ...c, ...y } : c)) } : x));
  const [aciSecim, setAciSecim] = useState<string[]>(["genis", "yakin", "alcak", "ters"]);
  const [yeniProje, setYeniProje] = useState(false);
  const [elDetayId, setElDetayId] = useState<string | null>(null);
  const [elYeni, setElYeni] = useState<Kapsam | null>(null);
  const [elDuzenle, setElDuzenle] = useState<(typeof elementler)[number] | null>(null);
  const [vitrinI, setVitrinI] = useState(0);
  // İstem yardımcısı (Gemini)
  const [yardimHazir, setYardimHazir] = useState<boolean | null>(null);
  const [gelistiriliyor, setGelistiriliyor] = useState(false);
  const [oneriler, setOneriler] = useState<{ kare: string; liste: string[] } | null>(null);
  const [oneriYukleniyor, setOneriYukleniyor] = useState(false);
  const [bolAdet, setBolAdet] = useState(4);
  const [bolunuyor, setBolunuyor] = useState(false);
  useEffect(() => { fetch("/api/istem").then((x) => x.json()).then((j: { hazir?: boolean }) => setYardimHazir(!!j.hazir)).catch(() => setYardimHazir(false)); }, []);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const refRef = useRef<HTMLInputElement>(null);
  const basRef = useRef<HTMLInputElement>(null);
  const sonRef = useRef<HTMLInputElement>(null);
  const akisRef = useRef<HTMLDivElement>(null);
  const komutRef = useRef<HTMLDivElement>(null);
  const [komutH, setKomutH] = useState(200);
  useEffect(() => {
    const el = komutRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setKomutH(el.offsetHeight)); ro.observe(el);
    return () => ro.disconnect();
  });
  useEffect(() => { try { setFavModeller(JSON.parse(localStorage.getItem("vayra-video-fav") ?? "[]")); } catch { /* yok */ } }, []);
  const favDegistir = (ad: string) => setFavModeller((l) => {
    const y = l.includes(ad) ? l.filter((x) => x !== ad) : [...l, ad];
    try { localStorage.setItem("vayra-video-fav", JSON.stringify(y)); } catch { /* yok */ }
    return y;
  });
  // Sahne ve element sayfasında komut kutusu yok; odaklanınca ana sayfaya dönülür.
  const odakla = () => { if (sayfa === "sahne" || sayfa === "element") setSayfa("ana"); setTimeout(() => promptRef.current?.focus(), 120); };
  const setSayfa = (s: KenarSayfa) => {
    setSayfaHam(s); setMobilKenar(false);
    const p = new URLSearchParams(aramaParam.toString());
    if (s === "ana") p.delete("g"); else p.set("g", s);
    router.replace(`/panel/sinema${p.toString() ? `?${p}` : ""}`, { scroll: false });
    akisRef.current?.scrollTo({ top: 0 });
  };

  /* ═════════════ Görsel (anahtar kare) kuralları ═════════════ */
  const kTanim = gorselModelBul(kareModel) ?? gorselModelBul("Nano Banana Pro")!;
  const kareOranlar = KARE_ORANLAR.filter((o) => kTanim.api.oranlar.includes(o));
  const kareCozler = kTanim.api.cozunurluklar;
  const refMax = Math.max(1, kTanim.api.refMax || 0);
  useEffect(() => {
    if (kareOranlar.length && !kareOranlar.includes(kareOran)) setKareOran(kareOranlar.includes("16:9") ? "16:9" : kareOranlar[0]);
    if (kareCozler.length && !kareCozler.includes(kareCoz)) setKareCoz(kareCozler.includes("2K") ? "2K" : kareCozler[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kareModel]);
  const gorselBagli = (ad: string) => { const t = gorselModelBul(ad); return !saglayicilar || (!!t && !!saglayicilar[t.api.saglayici]); };
  const hicGorselYok = !!saglayicilar && !["gemini", "seedream", "openai", "fal"].some((x) => saglayicilar[x]);
  const kareDemo = !gorselBagli(kareModel);
  const kareKrediHesap = (ad: string, c = kareCoz) => { const t = gorselModelBul(ad); return Math.max(1, Math.ceil((t?.kredi ?? 3) * (t?.api.cozunurluklar.length ? cozunurlukCarpani(c) : 1))); };
  const kareBirim = kareDemo ? 0 : kareKrediHesap(kareModel);

  /* ═════════════ Video kuralları ═════════════ */
  const erisim = videoErisim(model);
  const demoMi = (ad: string) => { const e = videoErisim(ad); return e.durum === "gercek" && !!saglayicilar && !saglayicilar[e.saglayici]; };
  const videoDemo = demoMi(model);
  const modeliUygula = (ad: string, sessiz = false): boolean => {
    const e = videoErisim(ad);
    if (e.durum !== "gercek") { if (!sessiz) toast.error(`${ad} ${e.durum === "kapandi" ? "kapandı" : "henüz kullanılamıyor"}`, { description: `${nokta(e.neden)} Başka bir model seç.` }); return false; }
    const o = videoModelOzellik(ad);
    setModel(ad); setSure(varsayilanSure(ad)); setCoz(varsayilanCoz(ad)); if (o.oran) setOran(o.oran);
    return true;
  };
  useEffect(() => {
    const o = videoModelOzellik(model);
    if (o.sureler.length && !o.sureler.includes(sure)) setSure(o.sure);
    if (o.cozler.length && !o.cozler.includes(coz)) setCoz(o.coz);
    if (!o.oranGizli && o.oranlar.length && !o.oranlar.includes(oran)) setOran(o.oran ?? o.oranlar[0]);
    if (!o.cokCekim) setCokCekim(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);
  const kisit = erisim.durum === "gercek" ? erisim.kisit?.find((k) => k.coz === coz) : undefined;
  useEffect(() => {
    if (kisit && !kisit.sureler.includes(sure)) { setSure(kisit.sureler[0]); toast(`Süre ${kisit.sureler[0]} sn yapıldı`, { description: `${coz} çözünürlükte yalnız ${kisit.sureler.join(" / ")} sn seçilebilir.` }); }
  }, [kisit, coz, sure]);
  const ikiKareModel = oz.kutu === "kareler";
  const { hareketler: hs, temiz: temizIstem } = useMemo(() => istemHareketleri(prompt), [prompt]);
  const h = hs[0];
  const ozelCekim = oz.cokCekim && cokCekim && cekimMod === "ozel";
  const cekimToplam = cekimler.reduce((n, c) => n + c.sn, 0);
  const cekimEnFazla = oz.sureler.length ? Math.max(...oz.sureler) : 15;
  const cekimEnAz = oz.sureler.length ? Math.min(...oz.sureler) : 3;
  const sesAcik = sesli && oz.sesToggle;
  const etkinSure = oz.sureGizli ? undefined : ozelCekim ? cekimToplam : sure;
  const sinirsizKimlik = sinirsizKimligi(model);
  const sinirsizTeklif = sinirsizKimlik ? SINIRSIZ_TEKLIFLER.find((t) => t.model === sinirsizKimlik) : undefined;
  const sinirsizErisim = sinirsizKimlik ? aktifSinirsizlar(sinirsizlar).find((x) => x.model === sinirsizKimlik) : undefined;
  const sinirsizMaxSure = sinirsizTeklif?.maxSure ? parseInt(sinirsizTeklif.maxSure, 10) : undefined;
  const sinirsizEngel = !sinirsizErisim ? null
    : sinirsizMaxSure && (etkinSure ?? 0) > sinirsizMaxSure ? `Sınırsız erişim ${sinirsizMaxSure} sn'ye kadar`
    : kaliteSira(coz) > kaliteSira(sinirsizErisim.kalite) ? `Sınırsız erişim ${sinirsizErisim.kalite}'ye kadar`
    : null;
  const sinirsizGecerli = sinirsizMod && !!sinirsizErisim && !sinirsizEngel;
  useEffect(() => { if (!sinirsizErisim) setSinirsizMod(false); }, [sinirsizErisim]);
  const videoBirim = videoDemo || sinirsizGecerli ? 0 : videoKredi(model, { sure: etkinSure, coz, ses: sesAcik });
  const taslakCoz = oz.cozler.length ? [...oz.cozler].sort((a, b) => kaliteSira(a) - kaliteSira(b))[0] : undefined;
  const taslakKisit = erisim.durum === "gercek" && taslakCoz ? erisim.kisit?.find((k) => k.coz === taslakCoz) : undefined;
  const taslakKullanilir = mod === "video" && !!taslakCoz && kaliteSira(taslakCoz) < kaliteSira(coz) && (!taslakKisit || !etkinSure || taslakKisit.sureler.includes(etkinSure));
  const taslakBirim = videoDemo || sinirsizGecerli || !taslakCoz ? 0 : videoKredi(model, { sure: etkinSure, coz: taslakCoz, ses: sesAcik });
  const uretimKredisi = (u: Uretim, ek: { sure?: number; coz?: string } = {}) => {
    if (u.tur !== "video") return gorselBagli(u.model) ? kareKrediHesap(u.model, u.meta?.cozunurluk ?? kareCoz) : 0;
    if (demoMi(u.model)) return 0;
    const sn = ek.sure ?? (parseInt(u.meta?.sure ?? "", 10) || undefined);
    const c = ek.coz ?? u.meta?.cozunurluk;
    const kimlik = sinirsizKimligi(u.model);
    const sahip = kimlik ? aktifSinirsizlar(sinirsizlar).find((x) => x.model === kimlik) : undefined;
    const teklif = kimlik ? SINIRSIZ_TEKLIFLER.find((t) => t.model === kimlik) : undefined;
    const maxSn = teklif?.maxSure ? parseInt(teklif.maxSure, 10) : undefined;
    if (sahip && (!maxSn || !sn || sn <= maxSn) && (!c || kaliteSira(c) <= kaliteSira(sahip.kalite))) return 0;
    return videoKredi(u.model, { sure: sn, coz: c, ses: !!u.meta?.ses });
  };

  const demo = mod === "gorsel" ? kareDemo : videoDemo;
  const birim = mod === "gorsel" ? kareBirim : videoBirim;
  const toplam = birim * adet;

  /* ═════════════ Kareler ve referanslar ═════════════ */
  const kareKoy = async (url: string, hedef: "bas" | "son") => {
    const ayar = hedef === "bas" ? setBas : setSon;
    ayar({ url, yukleniyor: url.startsWith("data:") });
    const kalici = await kareKalici(url);
    ayar((k) => (k && k.url === url ? { url: kalici } : k));
  };
  const refKoy = async (url: string) => {
    setRefler((l) => (l.some((x) => x.url === url) ? l : [...l, { url, yukleniyor: url.startsWith("data:") }].slice(0, 14)));
    const kalici = await kareKalici(url);
    setRefler((l) => l.map((x) => (x.url === url ? { url: kalici } : x)));
  };
  const dosyalariEkle = async (dosyalar: File[], hedef?: "ref" | "bas" | "son") => {
    const gorseller = dosyalar.filter((d) => d.type.startsWith("image/"));
    if (!gorseller.length) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    try {
      const urller = await Promise.all(gorseller.slice(0, 14).map(kareHazirla));
      const yer = hedef ?? (mod === "gorsel" ? "ref" : undefined);
      if (yer === "ref") { urller.forEach((u) => void refKoy(u)); return; }
      if (yer) return void kareKoy(urller[0], yer);
      if (urller.length > 1 && ikiKareModel) { void kareKoy(urller[0], "bas"); void kareKoy(urller[1], "son"); return; }
      if (!bas || !ikiKareModel) void kareKoy(urller[0], "bas"); else if (!son) void kareKoy(urller[0], "son"); else void kareKoy(urller[0], "bas");
    } catch {
      toast.error("Görsel okunamadı", { description: "Dosya bozuk olabilir. Başka bir görselle dene." });
    }
  };
  const dosyaSecildi = (e: React.ChangeEvent<HTMLInputElement>, hedef: "ref" | "bas" | "son") => {
    const l = [...(e.target.files ?? [])]; e.target.value = "";
    if (l.length) void dosyalariEkle(l, hedef);
  };
  useEffect(() => {
    const f = (e: ClipboardEvent) => {
      const l = [...(e.clipboardData?.files ?? [])].filter((x) => x.type.startsWith("image/"));
      if (l.length) { e.preventDefault(); void dosyalariEkle(l); }
    };
    window.addEventListener("paste", f); return () => window.removeEventListener("paste", f);
  });

  /* ═════════════ Dışarıdan gelenler ═════════════ */
  useIstemParametresi(setPrompt);
  const islenenParam = useRef<string | null>(null);
  useEffect(() => {
    const anahtar = aramaParam.toString();
    if (islenenParam.current === anahtar) return;
    islenenParam.current = anahtar;
    const g = aramaParam.get("g");
    setSayfaHam(SAYFALAR.find((x) => x === g) ?? "ana");
    const p = aramaParam.get("prompt"); if (p) setPrompt(p);
    const m = aramaParam.get("mod"); if (m === "gorsel" || m === "image") setMod("gorsel"); else if (m === "video") setMod("video");
    const istenen = aramaParam.get("model");
    if (istenen) {
      const v = modelCoz(istenen);
      if (v && modeliUygula(v, true)) setMod("video");
      else if (KARE_MODELLERI.includes(istenen)) { setKareModel(istenen); setMod("gorsel"); }
      else toast.error("Model bulunamadı", { description: `“${istenen}” sinema stüdyosunda yok. Model menüsünden başka bir model seç.` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aramaParam]);
  useEffect(() => {
    const ad = bekleyenElement("video") ?? bekleyenElement("gorsel");
    if (ad) { setPrompt((p) => `${p}${p && !p.endsWith(" ") ? " " : ""}@${ad} `); toast.success(`@${ad} eklendi`, { description: "İstemine element olarak bağlandı." }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const refIstek = useReferansKopru((s) => s.istek);
  const refTuket = useReferansKopru((s) => s.tuket);
  useEffect(() => {
    if (!refIstek) return;
    if (refIstek.url && /^(data:image|https?:|\/)/.test(refIstek.url)) { setMod("video"); void kareKoy(refIstek.url, "bas"); toast.success("Başlangıç karesi eklendi", { description: "Bir hareket seç ve çek." }); }
    if (refIstek.prompt) setPrompt((p) => p || refIstek.prompt!);
    refTuket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refIstek]);
  const ayarIstek = useAyarKopru((s) => s.istek);
  const ayarTuket = useAyarKopru((s) => s.tuket);
  useEffect(() => {
    if (!ayarIstek || (ayarIstek.tur !== "video" && ayarIstek.tur !== "gorsel")) return;
    if (ayarIstek.prompt) setPrompt(ayarIstek.prompt);
    if (ayarIstek.tur === "video") {
      setMod("video");
      if (ayarIstek.model) modeliUygula(ayarIstek.model);
      if (ayarIstek.oran) setOran(ayarIstek.oran);
      if (ayarIstek.cozunurluk) setCoz(ayarIstek.cozunurluk);
      if (ayarIstek.sure) setSure(parseInt(ayarIstek.sure, 10) || sure);
      const ilk = ayarIstek.referanslar?.[0]?.url; if (ilk) void kareKoy(ilk, "bas");
    } else {
      setMod("gorsel");
      if (ayarIstek.model && gorselModelBul(ayarIstek.model)) setKareModel(ayarIstek.model);
      if (ayarIstek.oran) setKareOran(ayarIstek.oran);
      ayarIstek.referanslar?.slice(0, 14).forEach((r) => void refKoy(r.url));
    }
    ayarTuket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayarIstek]);

  /* ═════════════ Üretim ═════════════ */
  const yukleniyor = refler.some((r) => r.yukleniyor) || !!bas?.yukleniyor || !!son?.yukleniyor;
  const eksik: string | null = mod === "gorsel"
    ? (yukleniyor ? "Referanslar yükleniyor" : temizIstem.length < 2 ? "Sahneni birkaç kelimeyle anlat" : null)
    : erisim.durum !== "gercek" ? `${model} ${erisim.durum === "kapandi" ? "kapandı" : "henüz kullanılamıyor"}; başka bir model seç`
    : yukleniyor ? "Kareler yükleniyor"
    : ozelCekim && cekimler.some((c) => c.istem.trim().length < 2) ? "Her çekimde ne olduğunu yaz"
    : ozelCekim && cekimToplam > cekimEnFazla ? `Çekimlerin toplamı ${cekimToplam} sn; ${model} en fazla ${cekimEnFazla} sn`
    : ozelCekim && cekimToplam < cekimEnAz ? `Çekimlerin toplamı en az ${cekimEnAz} sn olmalı`
    : erisim.gorselGerekli && !bas ? `${model} yalnız kareden video üretir; başlangıç karesi ekle`
    : ikiKareModel && son && !bas ? "Bitiş karesiyle birlikte başlangıç karesi de gerekli"
    : h?.baslaBitir && (!bas || !son || !ikiKareModel) ? `${hareketAdi(h.ad)} için başlangıç ve bitiş karesi gerekli${ikiKareModel ? "" : `; ${model} bitiş karesi almıyor`}`
    : h?.kareGerekli && !bas ? `${hareketAdi(h.ad)} için başlangıç karesi gerekli`
    : !ozelCekim && temizIstem.length < 2 && !bas && !hs.length ? "Sahneni anlat ya da başlangıç karesi ekle"
    : null;
  const nokta = (s: string) => (s && !/[.!?]$/.test(s) ? `${s}.` : s);
  /** Yeni çekim devam ettiği çekim aktif sahnedeyse hemen ardına yerleşir. */
  const sahneyeYerlestir = (yeniIdler: string[], kaynakId?: string, once = false) => {
    const st = useSahne.getState(), s = st.sahneler.find((x) => x.id === st.aktifId);
    if (!s || !kaynakId || !s.cekimler.includes(kaynakId) || !yeniIdler.length) return false;
    const i = s.cekimler.indexOf(kaynakId) - (once ? 1 : 0);
    st.sirala([...s.cekimler.slice(0, i + 1), ...yeniIdler, ...s.cekimler.slice(i + 1)], s.id);
    return true;
  };

  const uret = async (taslak = false) => {
    if (gonderiliyor) return;
    if (eksik) return void toast.error("Çekim başlatılamadı", { description: nokta(eksik) });
    const denetim = icerikDenetle([prompt, ...(mod === "video" && ozelCekim ? cekimler.map((c) => c.istem) : [])].join("\n"));
    if (!denetim.izin) return void toast.error(`İçerik engellendi · ${kategoriEtiket(denetim.kategori)}`, { description: nokta(denetim.mesaj) });
    setGonderiliyor(true); setAcik(null);
    try {
      const istem = temizIstem;
      const baslikHam = istem.replace(/@[\p{L}\p{N}_]+/gu, "").replace(/\s{2,}/g, " ").trim();
      const idler: string[] = []; let sonHata: ReturnType<typeof uretimBaslat> | null = null;
      if (mod === "gorsel") {
        const tarif = kurulumTarifi(kurulum);
        const modeleGiden = `${nokta(istem)} Cinematic film still${tarif ? `, ${tarif}` : ""}.`;
        const grupId = adet > 1 ? `sk_${Date.now().toString(36)}` : undefined;
        for (let i = 0; i < adet; i++) {
          const s = uretimBaslat({
            baslik: kisalt(baslikHam, 60) || "Anahtar kare", tur: "gorsel", model: kareModel, prompt: modeleGiden, kredi: kareBirim, arac: ARAC, projeId: aktifProjeId ?? undefined,
            meta: {
              islem: "uret", oran: kareOran, ...(kareCozler.length ? { cozunurluk: kareCoz } : {}), hamIstem: prompt.trim(), kurulum,
              ...(refler.length ? { referanslar: refler.map((r) => r.url).slice(0, refMax), gorselUrl: refler[0].url } : {}),
              ...(grupId ? { grupId, sira: i } : {}),
            },
          });
          if (!s.ok) { sonHata = s; break; }
          if (s.id) idler.push(s.id);
        }
      } else {
        const tarif = kurulumTarifi(kurulum, { video: true });
        const cekimMetni = ozelCekim ? cekimler.map((c, i) => `Shot ${i + 1} (${c.sn}s): ${c.istem.trim()}`).join("\n") : "";
        const hareketTalimati = hs.map((x) => x.en).join(", then ");
        const anaIstem = ozelCekim ? [istem, cekimMetni].filter(Boolean).join("\n") : istem || (hs.length ? `Animate the scene with ${hareketTalimati}` : "Animate the starting frame naturally");
        const satirlar = sesAcik ? diyalog.filter((d) => d.metin.trim()) : [];
        const diyalogMetni = satirlar.length
          ? `Dialogue (spoken in ${diyalogDili === "tr" ? "Turkish" : "English"}, natural lip sync, no subtitles): ${satirlar.map((d) => `${d.kim.trim() || "The main character"}${TON_EN[d.ton] ? ` (${TON_EN[d.ton]})` : ""} says: "${d.metin.trim()}"`).join(" Then ")}.` : "";
        const ortamMetni = sesAcik && sesNotu.trim() ? `Sound: ${sesNotu.trim()}.` : "";
        const modeleGiden = [nokta(anaIstem), hs.length ? `Camera moves in order: ${hareketTalimati}.` : "", diyalogMetni, ortamMetni, tarif ? `Look: ${tarif}.` : ""].filter(Boolean).join(" ");
        const baslik = kisalt(baslikHam || (ozelCekim ? `${cekimler.length} çekim · ${cekimler[0].istem.trim()}` : "") || (kaynak ? `${kaynak.baslik} · çekim` : "") || (hs.length ? `${hareketAdi(hs[0].ad)} çekimi` : "Sinema çekimi"), 60);
        const kalite = taslak ? taslakCoz! : coz;
        const kredi = taslak ? taslakBirim : videoBirim;
        for (let i = 0; i < adet; i++) {
          const s = uretimBaslat({
            baslik, tur: "video", model, prompt: modeleGiden, kredi, arac: ARAC, projeId: aktifProjeId ?? undefined,
            meta: {
              hamIstem: prompt.trim(), kurulum,
              ...(etkinSure ? { sure: `${etkinSure}sn` } : {}),
              ...(ozelCekim ? { cekimler: cekimler.map((c) => ({ istem: c.istem.trim(), sn: c.sn })) } : {}),
              ...(oz.cozler.length ? { cozunurluk: kalite } : {}),
              ...(taslak ? { taslak: { cozunurluk: coz, ...(etkinSure ? { sure: `${etkinSure}sn` } : {}) } } : {}),
              ...(!oz.oranGizli ? { oran } : {}),
              ...(hs.length ? { hareket: hs.map((x) => x.ad).join(" + ") } : {}),
              ...(kurulum.hiz !== "oto" ? { hizEgri: kurulum.hiz } : {}),
              ...(oz.cokCekim && cokCekim ? { cokCekim: true, ...(kurulum.tempo !== "oto" ? { tempo: kurulum.tempo } : {}) } : {}),
              ...(sesAcik ? { ses: "Açık" } : {}),
              ...(satirlar.length ? { sahneDiyalog: satirlar.map((d) => ({ kim: d.kim.trim(), metin: d.metin.trim(), ...(d.ton !== "dogal" ? { ton: d.ton } : {}) })), diyalogDili } : {}),
              ...(ortamMetni ? { sesNotu: sesNotu.trim() } : {}),
              ...(sinirsizGecerli ? { sinirsiz: true } : {}),
              ...(bas ? { gorselUrl: bas.url } : {}), ...(ikiKareModel && bas && son ? { bitisKareUrl: son.url } : {}),
              ...(kaynak ? { kaynakId: kaynak.id, surumTur: kaynak.devam ? "devam" : kaynak.yon ?? "kare" } : {}),
            },
          });
          if (!s.ok) { sonHata = s; break; }
          if (s.id) idler.push(s.id);
        }
      }
      if (!idler.length) return void (sonHata && uretimHataToast(sonHata));
      if (sonHata) uretimHataToast(sonHata);
      const yerlesti = mod === "video" && kaynak && (kaynak.devam || kaynak.yon) ? sahneyeYerlestir(idler, kaynak.id, kaynak.yon === "oncesi") : false;
      if (!gomulu) { setSayfa("ana"); setFiltre("tumu"); }
      const n = idler.length, b = taslak ? taslakBirim : birim;
      toast.success(mod === "gorsel" ? (n > 1 ? `${n} kare çekiliyor` : "Kare çekiliyor") : taslak ? "Taslak çekim üretiliyor" : n > 1 ? `${n} çekim üretiliyor` : "Çekim üretiliyor", {
        description: `${mod === "gorsel" ? kareModel : model} · ${demo ? "Kredi düşmez." : b === 0 ? "Sınırsız erişim, kredi düşmez." : `${b * n} kredi.`}${yerlesti ? ` ${aktifSahne.ad} içinde ${kaynak?.yon === "oncesi" ? "kaynağın önüne" : kaynak?.yon === "kopru" ? "iki çekimin arasına" : "kaynağın ardına"} eklendi.` : ""}`,
      });
    } finally { setGonderiliyor(false); }
  };

  /* ═════════════ Kart ve görüntüleyici eylemleri ═════════════ */
  const sinemaUretimleri = useMemo(() => tumUretimler.filter((u) => u.arac === ARAC && !u.id.startsWith("seed_")), [tumUretimler]);
  const favoriler = useMemo(() => sinemaUretimleri.filter((u) => u.favori), [sinemaUretimleri]);
  const gorunenler = (sayfa === "favori" ? favoriler : sinemaUretimleri).filter((u) => filtre === "tumu" || (filtre === "kare" ? u.tur === "gorsel" : u.tur === "video"));
  const gezListe = useMemo(() => gorunenler.filter((u) => u.durum === "tamam"), [gorunenler]);
  const seciliUretim = seciliId ? tumUretimler.find((u) => u.id === seciliId) : undefined;
  const lbIndex = seciliUretim ? gezListe.findIndex((u) => u.id === seciliUretim.id) : -1;
  useEffect(() => { if (seciliId && !seciliUretim) setSeciliId(null); }, [seciliId, seciliUretim]);
  const gez = (yon: 1 | -1) => { const y = lbIndex + yon; if (lbIndex >= 0 && y >= 0 && y < gezListe.length) setSeciliId(gezListe[y].id); };
  const aktifIs = sinemaUretimleri.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;
  const sahnedeMi = (id: string) => aktifSahne.cekimler.includes(id);

  const sahneDegistir = (u: Uretim) => {
    const st = useSahne.getState();
    if (sahnedeMi(u.id)) { st.cikar(u.id); toast(`${aktifSahne.ad} sahnesinden çıkarıldı`, { action: { label: "Geri al", onClick: () => useSahne.getState().ekle(u.id, aktifSahne.id) } }); return; }
    st.ekle(u.id);
    toast.success(`${aktifSahne.ad} sahnesine eklendi`, { description: `Sahnedeki ${aktifSahne.cekimler.length + 1}. çekim oldu.`, action: { label: "Sahneyi aç", onClick: () => setSayfa("sahne") } });
  };
  const kurulumlaUret = (u: Uretim) => {
    if (u.meta?.kurulum) setKurulum(kurulumTamamla(u.meta.kurulum));
    setPrompt(((u.meta?.hamIstem as string | undefined) ?? "").trim());
    if (u.tur === "video") {
      if (!modeliUygula(u.model)) return;
      setMod("video");
      if (u.meta?.sure) setSure(parseInt(u.meta.sure, 10) || sure);
      if (u.meta?.oran) setOran(u.meta.oran);
      if (u.meta?.cozunurluk) setCoz(u.meta.cozunurluk);
      setBas(u.meta?.gorselUrl ? { url: u.meta.gorselUrl } : null);
      setSon(u.meta?.bitisKareUrl ? { url: u.meta.bitisKareUrl } : null);
      setCokCekim(!!u.meta?.cokCekim);
      if (u.meta?.cekimler?.length) { setCekimMod("ozel"); setCekimler(u.meta.cekimler.map((c, i) => ({ id: `c${i}${Date.now().toString(36)}`, istem: c.istem, sn: c.sn }))); }
      setSesli(!!u.meta?.ses);
    } else {
      setMod("gorsel");
      if (KARE_MODELLERI.includes(u.model)) setKareModel(u.model);
      if (u.meta?.oran) setKareOran(u.meta.oran);
      setRefler((u.meta?.referanslar ?? []).slice(0, 14).map((url) => ({ url })));
    }
    setKaynak(null); setSeciliId(null); odakla();
    toast.success("Kurulum yüklendi", { description: "Kamera, görünüm ve istem hazır. Düzenleyip üretebilirsin." });
  };
  /** Kareyi videoya çevirir: başlangıç karesi olur, kurulumu korunur. */
  const canlandir = (u: Uretim) => {
    const url = saltUrl(u.gorselUrl); if (!url) return;
    setMod("video"); void kareKoy(url, "bas"); setSon(null);
    if (u.meta?.kurulum) setKurulum(kurulumTamamla(u.meta.kurulum));
    if (u.meta?.oran && videoModelOzellik(model).oranlar.includes(u.meta.oran)) setOran(u.meta.oran);
    setKaynak({ id: u.id, baslik: u.baslik || "Kare", devam: false });
    if (!prompt.trim() && u.meta?.hamIstem) setPrompt(String(u.meta.hamIstem));
    setSeciliId(null); odakla();
    toast("Kare başlangıç karesi yapıldı", { description: "Kamera hareketini ekle, ne olacağını yaz ve çek." });
  };
  /** Çekimin son karesinden devam: sahnede kaynağın hemen ardına yerleşir. */
  const devamEt = async (u: Uretim) => {
    if (!u.videoUrl) return;
    try {
      const kare = await kareYakala(u.videoUrl, "son");
      setMod("video"); void kareKoy(kare, "bas"); setSon(null);
      if (videoErisim(u.model).durum === "gercek") modeliUygula(u.model, true);
      if (u.meta?.kurulum) setKurulum(kurulumTamamla(u.meta.kurulum));
      setKaynak({ id: u.id, baslik: u.baslik || "Çekim", devam: true });
      setSeciliId(null); odakla();
      toast("Son kare başlangıç karesi yapıldı", { description: "Sonra ne olacağını yaz. Yeni çekim sahnede bunun ardına eklenir." });
    } catch {
      toast.error("Son kare alınamadı", { description: "Tarayıcı bu videodan kare okuyamadı. Videoyu indirip başlangıç karesi olarak yükleyebilirsin." });
    }
  };
  /** Bitiş karesi alan, erişilebilir bir model: seçili model uygunsa o. */
  const bitisModeli = () => (ikiKareModel ? model : kullanilabilirModeller().find((ad) => videoErisim(ad).durum === "gercek" && videoModelOzellik(ad).kutu === "kareler"));
  /** Öncesini çek: çekimin ilk karesi bitiş karesi olur; yeni çekim sahnede kaynağın önüne yerleşir. */
  const oncesiCek = async (u: Uretim) => {
    if (!u.videoUrl) return;
    const m = bitisModeli();
    if (!m) return void toast.error("Bitiş karesi alan model yok", { description: "Öncesini çekmek için bitiş karesi destekleyen bir video modeli gerekli." });
    try {
      const kare = await kareYakala(u.videoUrl, 0);
      setMod("video"); if (m !== model) modeliUygula(m, true);
      setBas(null); void kareKoy(kare, "son");
      if (u.meta?.kurulum) setKurulum(kurulumTamamla(u.meta.kurulum));
      setKaynak({ id: u.id, baslik: u.baslik || "Çekim", devam: false, yon: "oncesi" });
      setSeciliId(null); odakla();
      toast("İlk kare bitiş karesi yapıldı", { description: `${m !== model ? `${m} seçildi. ` : ""}Öncesinde ne olduğunu yaz; istersen başlangıç karesi de ekle.` });
    } catch {
      toast.error("İlk kare alınamadı", { description: "Tarayıcı bu videodan kare okuyamadı. Videoyu indirip bitiş karesi olarak yükleyebilirsin." });
    }
  };
  /** Köprü: A'nın son karesinden B'nin ilk karesine geçen ara çekim; sahnede ikisinin arasına girer. */
  const kopruCek = async (a: Uretim, b: Uretim) => {
    if (!a.videoUrl || !b.videoUrl) return;
    const m = bitisModeli();
    if (!m) return void toast.error("Bitiş karesi alan model yok", { description: "Köprü çekimi için bitiş karesi destekleyen bir video modeli gerekli." });
    try {
      const [k1, k2] = await Promise.all([kareYakala(a.videoUrl, "son"), kareYakala(b.videoUrl, 0)]);
      setMod("video"); if (m !== model) modeliUygula(m, true);
      void kareKoy(k1, "bas"); void kareKoy(k2, "son");
      if (a.meta?.kurulum) setKurulum(kurulumTamamla(a.meta.kurulum));
      setKaynak({ id: a.id, baslik: a.baslik || "Çekim", devam: false, yon: "kopru", hedefBaslik: b.baslik || "sonraki çekim" });
      setSayfa("ana"); setSeciliId(null); odakla();
      toast("Köprü kareleri hazır", { description: "İki çekim arasında ne olduğunu yaz ve üret; sahnede araya girer." });
    } catch {
      toast.error("Kareler alınamadı", { description: "Tarayıcı videolardan kare okuyamadı." });
    }
  };
  const yenidenUret = (u: Uretim) => {
    if (u.tur === "video") { const e = videoErisim(u.model); if (e.durum !== "gercek") return void toast.error(`${u.model} artık kullanılamıyor`, { description: `${nokta(e.neden)} Başka bir modelle yeniden üret.` }); }
    const kredi = uretimKredisi(u);
    const s = uretimBaslat({ baslik: u.baslik, tur: u.tur === "video" ? "video" : "gorsel", model: u.model, prompt: u.prompt, kredi, arac: ARAC, projeId: aktifProjeId ?? undefined,
      meta: { ...u.meta, sinirsiz: u.tur === "video" && kredi === 0 && !demoMi(u.model) ? true : undefined } });
    if (!s.ok) return uretimHataToast(s);
    setSeciliId(null); setSayfa("ana");
    toast.success("Yeniden üretim başladı", { description: `${u.model} · ${kredi ? `${kredi} kredi.` : "Kredi düşmez."}` });
  };
  const sonHalKredisi = (u: Uretim) => uretimKredisi(u, { coz: u.meta?.taslak?.cozunurluk });
  const sonHalineGetir = (u: Uretim) => {
    const hedef = u.meta?.taslak; if (!hedef) return;
    const e = videoErisim(u.model);
    if (e.durum !== "gercek") return void toast.error(`${u.model} artık kullanılamıyor`, { description: `${nokta(e.neden)} Taslağı başka bir modelle yeniden üret.` });
    const kredi = sonHalKredisi(u);
    const s = uretimBaslat({ baslik: u.baslik, tur: "video", model: u.model, prompt: u.prompt, kredi, arac: ARAC, projeId: aktifProjeId ?? undefined,
      meta: { ...u.meta, taslak: undefined, cozunurluk: hedef.cozunurluk, ...(hedef.sure ? { sure: hedef.sure } : {}), kaynakId: u.id, surumTur: "sonhal", sinirsiz: kredi === 0 && !demoMi(u.model) ? true : undefined } });
    if (!s.ok) return uretimHataToast(s);
    if (s.id) { const st = useSahne.getState(); st.sahneler.forEach((sh) => { if (sh.cekimler.includes(u.id)) st.sirala(sh.cekimler.map((x) => (x === u.id ? s.id! : x)), sh.id); }); }
    setSeciliId(null); setSayfa("ana");
    toast.success("Son hâli üretiliyor", { description: `${u.model} · ${hedef.cozunurluk} · ${kredi ? `${kredi} kredi.` : "Kredi düşmez."}` });
  };
  const uretimiSil = (u: Uretim) => {
    if (seciliId === u.id) { const s = gezListe[lbIndex + 1] ?? gezListe[lbIndex - 1]; setSeciliId(s && s.id !== u.id ? s.id : null); }
    const st = useSahne.getState();
    const yerler = st.sahneler.flatMap((sh) => { const i = sh.cekimler.indexOf(u.id); return i >= 0 ? [{ id: sh.id, i }] : []; });
    st.sahneler.forEach((sh) => { if (sh.cekimler.includes(u.id)) st.cikar(u.id, sh.id); });
    sil(u.id);
    mesaj.silindi(u.tur === "video" ? "Çekim" : "Kare", () => {
      uretimGeriYukle(u);
      useSahne.setState((d) => ({ sahneler: d.sahneler.map((sh) => { const y = yerler.find((x) => x.id === sh.id); if (!y || sh.cekimler.includes(u.id)) return sh; const c = [...sh.cekimler]; c.splice(y.i, 0, u.id); return { ...sh, cekimler: c }; }) }));
    });
  };
  /** Klip atölyesi çıktısı: dosya depoya yüklenir, ilk karesi kapak olur, yeni sürüm olarak akışa eklenir. */
  const atolyeKaydet = async (u: Uretim, s: AtolyeSonuc, islem: AtolyeIslem) => {
    const tip = s.blob.type || (s.uzanti === "mp4" ? "video/mp4" : "video/webm");
    const r = (await fetch("/api/montaj/yukle", { method: "POST", headers: { "Content-Type": tip }, body: s.blob }).then((x) => x.json()).catch(() => ({ ok: false }))) as { ok: boolean; url?: string; hata?: string };
    if (!r.ok || !r.url) throw new Error(r.hata ?? "Klip depoya yüklenemedi.");
    let kapak = saltUrl(u.gorselUrl);
    try { kapak = await kareKalici(await kareYakala(r.url, 0.1)); } catch { /* kaynağın kapağı kalır */ }
    const renkAd = islem.tur === "renk" ? (RENK_HAZIR.find((h) => (Object.keys(h.r) as (keyof Renk)[]).every((k) => Math.abs(h.r[k] - islem.renk[k]) < 0.005))?.ad ?? "Özel renk") : "";
    const ek = islem.tur === "renk" ? renkAd : `${islem.kadraj.oran} ${islem.kadraj.mod === "kirp" ? "kadraj" : "dolgu"}`;
    const id = projeEkle({
      baslik: `${kisalt(u.baslik || "Çekim", 44)} · ${ek}`, tur: "video", model: u.model, prompt: u.prompt, durum: "tamam", ilerleme: 100, kredi: 0, arac: ARAC,
      videoUrl: r.url, gorselUrl: kapak, gercek: u.gercek, projeId: u.projeId ?? aktifProjeId ?? undefined,
      meta: { ...u.meta, taslak: undefined, demoKlip: undefined, kaynakId: u.id, surumTur: islem.tur, oran: islem.tur === "kadraj" ? islem.kadraj.oran : u.meta?.oran, sure: `${Math.round(s.sure)}sn`, cozunurluk: `${s.w}×${s.h}` },
    });
    if (sahnedeMi(u.id) && id) { const st = useSahne.getState(), sh = st.sahneler.find((x) => x.id === st.aktifId); if (sh) st.sirala(sh.cekimler.map((x) => (x === u.id ? id : x)), sh.id); }
    if (id) setSeciliId(id);
    toast.success(islem.tur === "renk" ? "Renkli sürüm kaydedildi" : `${islem.kadraj.oran} sürüm kaydedildi`, { description: `Özgün klip duruyor; yeni sürüm Sürümler kartında.${sahnedeMi(u.id) ? " Sahnede eskisinin yerini aldı." : ""} Kredi düşmedi.` });
  };
  const viewerUzat = (u: Uretim, kare: string, istem: string): boolean => {
    const e = videoErisim(u.model);
    if (e.durum !== "gercek") { toast.error(`${u.model} artık kullanılamıyor`, { description: "Bu çekim uzatılamaz. Son karesini başlangıç karesi yapıp başka bir modelle devam et." }); return false; }
    const kredi = uretimKredisi(u);
    void (async () => {
      const url = await kareKalici(kare);
      const tarif = u.meta?.kurulum ? kurulumTarifi(kurulumTamamla(u.meta.kurulum), { video: true }) : "";
      const s = uretimBaslat({
        baslik: `${(u.baslik || "Çekim").slice(0, 44)} · devam`, tur: "video", model: u.model, prompt: [nokta(istem || "Continue the scene naturally"), tarif ? `Look: ${tarif}.` : ""].filter(Boolean).join(" "), kredi, arac: ARAC, projeId: aktifProjeId ?? undefined,
        meta: { hamIstem: istem, kurulum: u.meta?.kurulum, sure: u.meta?.sure, cozunurluk: u.meta?.cozunurluk, oran: u.meta?.oran, ses: u.meta?.ses, gorselUrl: url, kaynakId: u.id, surumTur: "devam", ...(kredi === 0 && !demoMi(u.model) ? { sinirsiz: true } : {}) },
      });
      if (!s.ok) return uretimHataToast(s);
      const yerlesti = s.id ? sahneyeYerlestir([s.id], u.id) : false;
      setSayfa("ana");
      toast.success("Çekim uzatılıyor", { description: `Son kareden devam ediyor · ${kredi ? `${kredi} kredi.` : "Kredi düşmez."}${yerlesti ? " Sahnede kaynağın ardına eklendi." : ""}` });
    })();
    setSeciliId(null);
    return true;
  };
  const aracCalistir = (i: AracIstegi): boolean => {
    const u = seciliUretim; const kaynakSrc = u ? saltUrl(u.gorselUrl) : undefined;
    if (!u || !kaynakSrc) return false;
    void (async () => {
      let maskeUrl: string | undefined;
      try { if (i.maske) maskeUrl = await gorselYukle(i.maske); } catch { return void toast.error(`${i.arac} başlatılamadı`, { description: "Maske yüklenemedi. Bağlantını kontrol edip yeniden dene." }); }
      const s = uretimBaslat({
        baslik: i.baslik, tur: "gorsel", model: i.arac, prompt: i.not, kredi: hicGorselYok ? 0 : i.kredi, arac: ARAC, projeId: aktifProjeId ?? undefined,
        meta: { islem: i.islem, oran: i.oran ?? u.meta?.oran, gorselUrl: kaynakSrc, ...(maskeUrl ? { maskeUrl } : {}), ...(i.zemin ? { zemin: i.zemin } : {}), hamIstem: i.not, kaynakId: u.id, kurulum: u.meta?.kurulum },
      });
      if (!s.ok) uretimHataToast(s, `${i.arac} başlatılamadı`);
    })();
    setSeciliId(null); setSayfa("ana");
    toast.success(`${i.arac} başladı`, { description: `${hicGorselYok ? "Kredi düşmez." : `${i.kredi} kredi.`} Sonuç akışın en üstünde görünecek.` });
    return true;
  };
  const yerelKaydet = (dataUrl: string, baslik: string) => {
    const u = seciliUretim;
    void (async () => {
      const url = await kareKalici(dataUrl);
      projeEkle({ baslik, tur: "gorsel", model: "Renk ayarı", prompt: baslik, durum: "tamam", ilerleme: 100, kredi: 0, arac: ARAC, gorselUrl: url, gercek: true, projeId: aktifProjeId ?? undefined,
        meta: { oran: u?.meta?.oran, hamIstem: u?.meta?.hamIstem as string | undefined, kaynakId: u?.id, kurulum: u?.meta?.kurulum } });
      toast.success("Renk ayarlı kare kaydedildi", { description: "Yeni kare olarak akışa eklendi. Kredi düşmedi." });
    })();
  };
  const acilariCek = () => {
    const u = acilarIcin; const src = u ? saltUrl(u.gorselUrl) : undefined;
    if (!u || !src || !aciSecim.length) return;
    const kredi = hicGorselYok ? 0 : ACI_KREDI;
    const grupId = `ac_${Date.now().toString(36)}`;
    let n = 0;
    for (const [i, a] of ACI_SECENEKLERI.filter((x) => aciSecim.includes(x.id)).entries()) {
      const s = uretimBaslat({
        baslik: `${(u.baslik || "Kare").slice(0, 40)} · ${a.ad}`, tur: "gorsel", model: "Kamera Açısı", kredi, arac: ARAC, projeId: aktifProjeId ?? undefined,
        prompt: `Re-shoot this exact scene as ${a.en}. Keep the same characters, wardrobe, location, time of day, lighting and color grade; only the camera position changes. Cinematic film still.`,
        meta: { islem: "duzenle", oran: u.meta?.oran, gorselUrl: src, hamIstem: (u.meta?.hamIstem as string | undefined) ?? "", kurulum: u.meta?.kurulum, kaynakId: u.id, surumTur: "aci", grupId, sira: i },
      });
      if (!s.ok) { if (!n) uretimHataToast(s); break; }
      n++;
    }
    setAcilarIcin(null); setSeciliId(null);
    if (n) { setSayfa("ana"); toast.success(`${n} açı çekiliyor`, { description: `${u.baslik} · ${kredi ? `${kredi * n} kredi.` : "Kredi düşmez."}` }); }
  };
  const topluIndir = (l: Uretim[]) => { l.forEach((u, i) => setTimeout(() => uretimIndir(u), i * 350)); toast.success(`${l.length} çekim indiriliyor`, { description: "Tarayıcı indirmeleri sırayla başlatır." }); };
  /** Vitrin/topluluk örneğini tekrarlar: istem ve kurulum kutuya gelir. */
  const tekrarla = (x: (typeof TOPLULUK)[number]) => {
    setKurulum(kurulumTamamla({ ...VARSAYILAN_KURULUM, ...x.k })); setPrompt(x.istem); setSayfa("ana"); odakla();
    toast.success(`“${x.baslik}” kurulumu yüklendi`, { description: `${filmOzet(kurulumTamamla(x.k))} · ${kameraOzet(kurulumTamamla(x.k))}.` });
  };

  /* ═════════════ İstem yardımcıları ═════════════ */
  /** Hareketi istemin sonuna # etiketi olarak ekler (sıra önemli). */
  const hareketEkle = (x: Hareket) => {
    const et = hareketEtiketi(x);
    setPrompt((p) => `${p.trimEnd()}${p.trim() ? " " : ""}${et} `);
    toast(`${et} isteme eklendi`, { description: hs.length ? `${hs.length + 1}. hareket, sırayla uygulanır.` : nokta(x.not) });
  };
  const istemiGelistir = async () => {
    const eski = prompt.trim();
    if (temizIstem.length < 2) return void toast.error("İstem çok kısa", { description: "Önce birkaç kelime yaz. Geliştirici yazdığını zenginleştirir." });
    setGelistiriliyor(true);
    try {
      const j = (await (await fetch("/api/istem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "gelistir", istem: temizIstem }) })).json()) as { ok: boolean; istem?: string; hata?: string };
      if (!j.ok || !j.istem) throw new Error(j.hata ?? "Yanıt alınamadı");
      const etiketler = [...eski.matchAll(/[@#][\p{L}\p{N}_]+/gu)].map((m) => m[0]).filter((e) => !j.istem!.includes(e));
      setPrompt(`${j.istem}${etiketler.length ? ` ${etiketler.join(" ")}` : ""}`.slice(0, 2500));
      toast.success("İstem geliştirildi", { description: "Sahne, ışık ve oyunculuk ayrıntısı eklendi.", action: { label: "Geri al", onClick: () => setPrompt(eski) } });
    } catch (e) {
      toast.error("İstem geliştirilemedi", { description: `${neden(e, "Yanıt alınamadı.")} Biraz sonra yeniden dene.` });
    } finally { setGelistiriliyor(false); }
  };
  const karedenOner = async () => {
    if (!bas) return;
    setAcik("oneri");
    if (oneriler?.kare === bas.url) return;
    setOneriYukleniyor(true);
    try {
      const j = (await (await fetch("/api/istem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "tarif", gorselUrl: bas.url, adet: 3 }) })).json()) as { ok: boolean; istemler?: string[]; hata?: string };
      if (!j.ok || !j.istemler?.length) throw new Error(j.hata ?? "Öneri gelmedi");
      setOneriler({ kare: bas.url, liste: j.istemler });
    } catch (e) {
      setAcik(null);
      toast.error("Kareden istem önerilemedi", { description: `${neden(e, "Öneri gelmedi.")} Biraz sonra yeniden dene.` });
    } finally { setOneriYukleniyor(false); }
  };
  /** Hikâyeyi çekimlere böler; her çekim için aynı kurulumla bir kare çekilir, hepsi yeni sahnede. */
  /** Yönetmen asistanı: hikâye çekim listesine bölünür, liste önce düzenlenir, sonra çekilir. */
  const listeCikar = async () => {
    const hikaye = temizIstem;
    if (hikaye.length < 12) return void toast.error("Hikâye çok kısa", { description: "Bir iki cümleyle anlat: ne oluyor, kim var, nerede geçiyor?" });
    setBolunuyor(true);
    try {
      let l: { istem: string; cekim: string; aci: string }[] = [];
      try {
        const j = (await (await fetch("/api/istem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "sahneler", istem: hikaye, adet: bolAdet }) })).json()) as { ok: boolean; sahneler?: { istem: string; cekim: string; aci: string }[] };
        if (j.ok && j.sahneler?.length) l = j.sahneler;
      } catch { /* yerel bölmeye düş */ }
      const yerel = !l.length;
      if (yerel) {
        // Asistana ulaşılamazsa hikâye cümlelerine göre bölünür; plan boyları sırayla değişir.
        const cumle = hikaye.split(/(?<=[.!?…])\s+/).map((x) => x.trim()).filter((x) => x.length > 3);
        const n = Math.max(1, Math.min(bolAdet, cumle.length));
        const plan = ["genis", "orta", "yakin", "omuz", "detay", "orta", "genis", "yakin"];
        l = Array.from({ length: n }, (_, i) => ({ istem: cumle.slice(Math.floor((i * cumle.length) / n), Math.floor(((i + 1) * cumle.length) / n)).join(" "), cekim: plan[i % plan.length], aci: "goz" }));
      }
      setListe({ hikaye, cekimler: l.map((c, i) => ({ id: `l${i}${Date.now().toString(36)}`, ...c })) });
      setAcik(null);
      if (yerel) toast("Çekim listesi hikâyenin cümlelerinden çıkarıldı", { description: "Yazı asistanına şu an ulaşılamadı. Her çekimi düzenleyebilirsin." });
    } finally { setBolunuyor(false); }
  };
  const listeyiCek = () => {
    if (!liste) return;
    const cekimler = liste.cekimler.filter((c) => c.istem.trim().length > 3);
    if (!cekimler.length) return void toast.error("Çekim listesi boş", { description: "En az bir çekime ne olduğunu yaz." });
    const st = useSahne.getState();
    const sahneId = st.yeni(kisalt(liste.hikaye.replace(/@[\p{L}\p{N}_]+/gu, "").trim(), 28) || undefined);
    const grupId = `sb_${Date.now().toString(36)}`, tarif = kurulumTarifi(kurulum);
    let n = 0;
    for (const [i, c] of cekimler.entries()) {
      const s = uretimBaslat({
        baslik: kisalt(`${i + 1}. ${c.istem}`, 60), tur: "gorsel", model: kareModel, kredi: kareBirim, arac: ARAC, projeId: aktifProjeId ?? undefined,
        prompt: `${nokta(c.istem.trim())} ${[PLAN_EN[c.cekim], ACI_EN[c.aci]].filter(Boolean).join(", ")}. Cinematic film still${tarif ? `, ${tarif}` : ""}.`,
        meta: { islem: "uret", oran: kareOran, ...(kareCozler.length ? { cozunurluk: kareCoz } : {}), hamIstem: c.istem.trim(), kurulum, grupId, sira: i,
          ...(refler.length ? { referanslar: refler.map((r) => r.url).slice(0, refMax), gorselUrl: refler[0].url } : {}) },
      });
      if (!s.ok) { if (!n) uretimHataToast(s); break; }
      if (s.id) { st.ekle(s.id, sahneId); n++; }
    }
    if (n) { setListe(null); setSayfa("sahne"); toast.success(`${n} karelik storyboard kuruluyor`, { description: `${kareModel} · ${kareBirim ? `${kareBirim * n} kredi.` : "Kredi düşmez."} Kareler yeni sahneye dizilecek; sonra Kareleri canlandır ile videoya çevir.` }); }
  };
  /** Sahnedeki anahtar kareleri seçili video modeliyle toplu canlandırır; videolar karelerin yerine geçer. */
  const panoCanlandir = (kareler: Uretim[]) => {
    const e = videoErisim(model);
    if (e.durum !== "gercek") return void toast.error(`${model} kullanılamıyor`, { description: "Video modelini değiştirip yeniden dene." });
    const st = useSahne.getState(), sh = st.sahneler.find((x) => x.id === st.aktifId); if (!sh) return;
    const yeni = [...sh.cekimler]; let n = 0;
    for (const k of kareler) {
      const url = saltUrl(k.gorselUrl); if (!url) continue;
      const kur = k.meta?.kurulum ? kurulumTamamla(k.meta.kurulum) : kurulum, tarif = kurulumTarifi(kur, { video: true });
      const ham = ((k.meta?.hamIstem as string | undefined) ?? k.baslik ?? "").trim();
      const s = uretimBaslat({
        baslik: kisalt(k.baslik || "Çekim", 60), tur: "video", model, kredi: videoBirim, arac: ARAC, projeId: aktifProjeId ?? undefined,
        prompt: [nokta(ham || "Animate the frame"), "Bring this exact frame to life with subtle, motivated cinematic motion.", tarif ? `Look: ${tarif}.` : ""].filter(Boolean).join(" "),
        meta: { hamIstem: ham, kurulum: k.meta?.kurulum ?? kurulum, ...(etkinSure ? { sure: `${etkinSure}sn` } : {}), ...(oz.cozler.length ? { cozunurluk: coz } : {}),
          ...(!oz.oranGizli ? { oran: k.meta?.oran && oz.oranlar.includes(k.meta.oran) ? k.meta.oran : oran } : {}), ...(sesAcik ? { ses: "Açık" } : {}),
          gorselUrl: url, kaynakId: k.id, surumTur: "kare" },
      });
      if (!s.ok) { if (!n) uretimHataToast(s); break; }
      if (s.id) { const i = yeni.indexOf(k.id); if (i >= 0) yeni[i] = s.id; n++; }
    }
    if (!n) return;
    st.sirala(yeni, sh.id);
    toast.success(`${n} kare canlandırılıyor`, { description: `${model} · ${videoDemo ? "Kredi düşmez." : videoBirim ? `${videoBirim * n} kredi.` : "Sınırsız erişim."} Videolar sahnede karelerin yerini alıyor; kareler Çekimlerim'de duruyor.` });
  };

  /* ── Klavye, kaydırma ── */
  useScrollKilit(elementModal || !!seciliUretim || !!uretimSecici || !!acilarIcin || !!liste || mobilKenar);
  useEscKapat(!!acilarIcin, () => setAcilarIcin(null));
  useEscKapat(!!liste, () => setListe(null));
  useEscKapat(mobilKenar, () => setMobilKenar(false));
  useEffect(() => { if (sayfa !== "ana" && sayfa !== "favori") return; const t = setInterval(() => setVitrinI((i) => (i + 1) % VITRIN.length), 5000); return () => clearInterval(t); }, [sayfa]);
  const sonIstemler = useMemo(() => {
    const g = new Set<string>(); const l: string[] = [];
    for (const u of sinemaUretimleri) { const p = ((u.meta?.hamIstem as string | undefined) ?? "").trim(); if (p.length < 3 || g.has(p)) continue; g.add(p); l.push(p); if (l.length >= 4) break; }
    return l;
  }, [sinemaUretimleri]);

  /* ═════════════ Komut kutusu parçaları ═════════════ */
  const ac = (k: Exclude<Pop, null>) => setAcik((v) => (v === k ? null : k));
  const pop = (k: Exclude<Pop, null>, sinif: string, icerik: React.ReactNode, yerlesim: "ust-sol" | "ust-sag" = "ust-sol") => (
    <Yuzen acik={acik === k} onKapat={() => setAcik(null)} yerlesim={yerlesim} bosluk={10} etiket={k} className={cn("max-h-[68vh] overflow-y-auto p-2 [scrollbar-width:thin]", sinif, POP)}>{icerik}</Yuzen>
  );
  const menuSatir = (I: typeof Upload, metin: string, f: () => void, alt?: string) => (
    <button onClick={() => { setAcik(null); f(); }} className="flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left hover:bg-white/[0.05]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-metin ring-1 ring-inset ring-white/[0.08]"><I className="h-3.5 w-3.5" /></span>
      <span className="min-w-0"><span className="block text-[13px] font-medium text-metin">{metin}</span>{alt && <span className="block text-[11.5px] text-metin-3">{alt}</span>}</span>
    </button>
  );
  /** Yönetmen kartı: küçük görsel + tek satır mono etiket + değer (Higgsfield'deki dizilim). */
  const cip = (o: { etiket: React.ReactNode; ust?: string; acikMi?: boolean; onClick: () => void; title?: string; ikon?: React.ReactNode; vurgu?: boolean; ariaLabel?: string }) => (
    <button onClick={o.onClick} aria-expanded={o.acikMi} title={o.title} aria-label={o.ariaLabel}
      className={cn("flex h-12 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full pl-1.5 pr-3 text-left transition-[background-color,transform] duration-200 active:scale-[0.97]", o.acikMi ? "bg-white/[0.14]" : "bg-white/[0.07] hover:bg-white/[0.11]")}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.08] text-metin-2 [&_svg]:h-4 [&_svg]:w-4">{o.ikon}</span>
      <span className="flex flex-col items-start leading-none">
        {o.ust && <span className="text-[11px] text-white/55">{o.ust}</span>}
        <span className={cn("flex items-center gap-1 text-[13px] font-medium tabular-nums text-metin", o.ust && "mt-1")}>{o.etiket}</span>
      </span>
    </button>
  );
  const ikonCip = (I: typeof Upload, etiket: string, f: () => void, o: { acikMi?: boolean; yukleniyor?: boolean } = {}) => (
    <Tooltip label={etiket} side="top">
      <button onClick={f} aria-label={etiket} aria-expanded={o.acikMi} className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors", o.acikMi ? "bg-white/[0.12] text-metin" : "text-metin-2 hover:bg-white/[0.07] hover:bg-white/[0.1] hover:text-metin")}>
        {o.yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <I className="h-4 w-4" strokeWidth={1.9} />}
      </button>
    </Tooltip>
  );
  const kredi = (n: number) => (n === 0 ? "Sınırsız" : <><KrediYildiz className="h-3 w-3" />{n}</>);

  /* ── Popover içerikleri ── */
  const kareMini = (k: Kare | null, etiket: string, hedef: "bas" | "son", kilitli?: boolean) => (
    <div className="flex items-center gap-3 rounded-[14px] bg-black/20 p-2 ring-1 ring-inset ring-white/[0.06]">
      <GorselOnizleme url={k && !k.yukleniyor ? k.url : undefined} etiket={`${etiket} karesi`}><span className={cn("relative h-14 w-20 shrink-0 overflow-hidden rounded-[10px] ring-1 ring-inset", k ? "ring-white/15" : "ring-white/[0.08]")}>
        {k
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={k.url} alt={etiket} className={cn("h-full w-full object-cover", k.yukleniyor && "opacity-50")} />
          : <span className="flex h-full w-full items-center justify-center bg-white/[0.03] text-metin-3">{kilitli ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</span>}
        {k?.yukleniyor && <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />}
      </span></GorselOnizleme>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-metin">{etiket} karesi</p>
        <p className="text-[11.5px] text-metin-3">{kilitli ? `${model} bitiş karesi almıyor` : k ? "Hazır" : "İsteğe bağlı"}</p>
      </div>
      {!kilitli && (
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip label="Yükle" side="top"><button onClick={() => (hedef === "bas" ? basRef : sonRef).current?.click()} aria-label={`${etiket} karesi yükle`} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-metin-2 hover:text-metin"><Upload className="h-3.5 w-3.5" /></button></Tooltip>
          <Tooltip label="Üretimlerimden seç" side="top"><button onClick={() => { setAcik(null); setUretimSecici(hedef); }} aria-label={`${etiket} karesini üretimlerden seç`} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-metin-2 hover:text-metin"><Images className="h-3.5 w-3.5" /></button></Tooltip>
          {k && <Tooltip label="Kaldır" side="top"><button onClick={() => { if (hedef === "bas") { setBas(null); setKaynak(null); } else setSon(null); }} aria-label={`${etiket} karesini kaldır`} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-metin-2 hover:text-rose-300"><X className="h-3.5 w-3.5" /></button></Tooltip>}
        </div>
      )}
    </div>
  );
  const karelerPaneli = (
    <>
      <MenuKart baslik="Kareler" sag={<span className="text-[11.5px] tabular-nums text-metin-3">{[bas, son].filter(Boolean).length}/{ikiKareModel ? 2 : 1}</span>}>
        <p className="px-3 pt-2.5 text-[12px] leading-snug text-metin-2">Çekim başlangıç karesinden başlar; model destekliyorsa bitiş karesine varır.</p>
        <div className="space-y-2 p-2">
          {kareMini(bas, "Başlangıç", "bas")}
          {kareMini(son, "Bitiş", "son", !ikiKareModel)}
        </div>
        {bas && son && ikiKareModel && <button onClick={() => { const b = bas; setBas(son); setSon(b); }} className="flex w-full items-center gap-2 border-t border-white/[0.06] px-3 py-2.5 text-left text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.04] hover:text-metin"><ArrowLeftRight className="h-3.5 w-3.5" />Başlangıç ile bitişi yer değiştir</button>}
      </MenuKart>
      <MenuKart baslik="Kare yok mu?">
        <div className="p-1.5">
          {menuSatir(ImageIcon, "Önce anahtar kare çek", () => { setMod("gorsel"); odakla(); }, "Yönetmen kurulumuyla kareyi çek, sonra videoya çevir")}
        </div>
      </MenuKart>
    </>
  );
  const reflerPaneli = (
    <>
      <MenuKart baslik="Referanslar" sag={<span className="text-[11.5px] tabular-nums text-metin-3">{refler.length}/{refMax}</span>}>
        <p className="px-3 pt-2.5 text-[12px] leading-snug text-metin-2">Karakter, mekân, kostüm ya da kompozisyon. Kalıcı karakterler için @element kullan.</p>
        <div className="grid grid-cols-4 gap-1.5 p-2">
          {refler.map((r, i) => (
            <GorselOnizleme key={r.url} url={r.yukleniyor ? undefined : r.url} etiket={`Referans ${i + 1}`} className="aspect-square"><span className="group/r relative h-full w-full overflow-hidden rounded-[10px] ring-1 ring-inset ring-white/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.url} alt={`Referans ${i + 1}`} className={cn("h-full w-full object-cover", r.yukleniyor && "opacity-50")} />
              <button onClick={() => setRefler((l) => l.filter((x) => x.url !== r.url))} aria-label={`Referans ${i + 1} kaldır`} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover/r:opacity-100 focus-visible:opacity-100"><X className="h-3 w-3" strokeWidth={2.6} /></button>
              {i >= refMax && <span className="absolute inset-x-0 bottom-0 bg-amber-500/80 text-center text-[9px] font-bold text-black">gönderilmez</span>}
            </span></GorselOnizleme>
          ))}
          {refler.length < 14 && <button onClick={() => refRef.current?.click()} aria-label="Referans yükle" className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[10px] bg-white/[0.03] text-[11px] text-metin-3 ring-1 ring-inset ring-white/[0.1] transition-colors hover:bg-white/[0.07] hover:text-metin"><Plus className="h-4 w-4" />Yükle</button>}
        </div>
      </MenuKart>
      <MenuKart baslik="Başka kaynaktan">
        <div className="p-1.5">
          {menuSatir(Images, "Üretimlerimden seç", () => setUretimSecici("ref"), "Görsel ya da videonun karesi")}
          {menuSatir(AtSign, "Element ekle", () => setElementModal(true), "Karakter, mekân, ürün")}
        </div>
      </MenuKart>
    </>
  );
  const kareModelPaneli = (
    <MenuKart baslik="Görsel modeli">
      <p className="px-3 pt-2.5 text-[12px] leading-snug text-metin-2">Anahtar kareyi çeken model. Yönetmen kurulumu her modelde aynı uygulanır.</p>
      <div className="space-y-1 p-1.5">
        {KARE_MODELLERI.map((ad) => {
          const t = gorselModelBul(ad); if (!t) return null;
          const bagli = gorselBagli(ad), sec = ad === kareModel;
          return (
            <button key={ad} onClick={() => { setKareModel(ad); setAcik(null); }} aria-pressed={sec}
              className={cn("flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left ring-1 ring-inset transition-colors", sec ? "bg-white/[0.08] ring-white/50" : "ring-transparent hover:bg-white/[0.04]")}>
              <MarkaKare ad={ad} boyut={32} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-metin">{ad}{ad === KARE_MODELLERI[0] && <span className="rounded-full bg-white/[0.08] px-1.5 py-px text-[10px] font-bold text-metin">Sinema</span>}</span>
                <span className="block text-[11.5px] leading-snug text-metin-3">{t.ozet}</span>
              </span>
              {bagli && <span className="flex shrink-0 items-center gap-1 text-[11.5px] tabular-nums text-metin-3"><KrediYildiz className="h-3 w-3" />{Math.max(1, Math.ceil(t.kredi ?? 3))}</span>}
            </button>
          );
        })}
      </div>
    </MenuKart>
  );
  const oranIzgara = (liste: string[], secili: string, sec: (o: string) => void, otoIkon?: boolean) => (
    <div className="grid gap-1.5 p-2" style={{ gridTemplateColumns: `repeat(${Math.min(liste.length, 4)}, minmax(0, 1fr))` }}>
      {liste.map((o) => {
        const s = secili === o;
        return (
          <button key={o} onClick={() => sec(o)} aria-pressed={s}
            className={cn("flex h-[88px] flex-col items-center justify-center gap-2 rounded-[12px] transition-[background-color,transform] active:scale-[0.97]",
              s ? "bg-white text-[#0a0a0b]" : "bg-white/[0.04] text-metin-2 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.08] hover:text-metin")}>
            <span className="flex h-7 items-center justify-center">{otoIkon && o === "Auto" ? <Sparkles className="h-6 w-6" /> : <OranSekli oran={o === "Auto" ? "1:1" : o} boyut={24} />}</span>
            <span className="text-center leading-tight"><span className="block text-[13px] font-semibold tabular-nums">{o === "Auto" ? "Oto" : o}</span><span className={cn("block text-[11px]", s ? "text-black/55" : "text-metin-3")}>{ORAN_AD[o]?.[0] ?? ""}</span></span>
          </button>
        );
      })}
    </div>
  );
  const oranPaneli = mod === "gorsel" ? (
    <MenuKart baslik="Kadraj oranı" sag={<span className="text-[11.5px] text-metin-3">{kareOran === "Auto" ? "Oto" : kareOran}</span>}>
      {oranIzgara(kareOranlar, kareOran, setKareOran)}
      {ORAN_AD[kareOran] && <p className="border-t border-white/[0.06] px-3 py-2 text-[12px] leading-snug text-metin-2">{ORAN_AD[kareOran][1]}</p>}
    </MenuKart>
  ) : (
    <MenuKart baslik="Oran" sag={<span className="text-[11.5px] text-metin-3">{oran === "Auto" ? "Oto" : oran}</span>}>
      {oranIzgara(oz.oranlar, oran, setOran, true)}
      {ORAN_AD[oran] && <p className="border-t border-white/[0.06] px-3 py-2 text-[12px] leading-snug text-metin-2">{ORAN_AD[oran][1]}</p>}
    </MenuKart>
  );
  const kaliteSecici = (liste: string[], secili: string, sec: (c: string) => void, id: string) => (
    <div className="m-2 grid gap-0.5 rounded-full bg-white/[0.05] p-0.5 ring-1 ring-inset ring-white/[0.07]" style={{ gridTemplateColumns: `repeat(${liste.length}, minmax(0, 1fr))` }}>
      {liste.map((c) => (
        <button key={c} onClick={() => sec(c)} aria-pressed={secili === c}
          className={cn("relative isolate h-9 rounded-full text-[13px] font-semibold tabular-nums transition-colors", secili === c ? "text-[#0a0a0b]" : "text-metin-3 hover:text-metin")}>
          {secili === c && <motion.span layoutId={id} className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}{c}
        </button>
      ))}
    </div>
  );
  const kalitePaneli = mod === "gorsel" ? (
    <MenuKart baslik="Kalite" sag={!kareDemo ? <span className="flex items-center gap-1 text-[11.5px] tabular-nums text-metin-3"><KrediYildiz className="h-3 w-3" />{kareKrediHesap(kareModel, kareCoz)}</span> : undefined}>
      {kaliteSecici(kareCozler, kareCoz, setKareCoz, "sinema-kalite-setKareCoz")}
      <p className="border-t border-white/[0.06] px-3 py-2 text-[12px] text-metin-2">{kareCoz === "1K" ? "Hızlı deneme" : kareCoz === "2K" ? "Önerilen: keskin ve hızlı" : "En keskin, baskıya hazır"}</p>
    </MenuKart>
  ) : (
    <>
      <MenuKart baslik="Kalite" sag={!videoDemo ? <span className="flex items-center gap-1 text-[11.5px] tabular-nums text-metin-3"><KrediYildiz className="h-3 w-3" />{videoKredi(model, { sure: etkinSure, coz, ses: sesAcik })}</span> : undefined}>
        {kaliteSecici(oz.cozler, coz, setCoz, "sinema-kalite-setCoz")}
        {KALITE_NOT[coz] && <p className="border-t border-white/[0.06] px-3 py-2 text-[12px] text-metin-2">{KALITE_NOT[coz]}</p>}
      </MenuKart>
      {sinirsizErisim && (
        <MenuKart baslik="Sınırsız erişim" sag={
          <button onClick={() => setSinirsizMod((v) => !v)} role="switch" aria-checked={sinirsizGecerli} aria-label="Sınırsız erişim" className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", sinirsizGecerli ? "bg-white" : "bg-white/20")}>
            <span className={cn("absolute top-[3px] h-4 w-4 rounded-full transition-[left] duration-200", sinirsizGecerli ? "left-[19px] bg-[#0a0a0b]" : "left-[3px] bg-white")} />
          </button>}>
          <p className="flex items-center gap-2 px-3 py-2.5 text-[12px] leading-snug text-metin-2"><Sonsuz className="h-4 w-4 shrink-0 text-metin" />{sinirsizEngel ?? "Bu modelde kredi harcamadan üret"}</p>
        </MenuKart>
      )}
    </>
  );
  // Süre: izinli değerler üzerinde kaydırıcı; az seçenekte (4 ve altı) eşit bölmeli seçici.
  const izinliSureler = oz.sureler.filter((n) => !kisit || kisit.sureler.includes(n));
  const sureSira = Math.max(0, izinliSureler.indexOf(sure));
  const surePaneli = (
    <MenuKart baslik="Süre" sag={<span className="text-[15px] font-semibold tabular-nums text-metin">{sure}<span className="ml-0.5 text-[11.5px] font-medium text-metin-3">sn</span></span>}>
      {izinliSureler.length > 4 ? (
        <div className="p-3">
          <input type="range" min={0} max={izinliSureler.length - 1} step={1} value={sureSira} aria-label="Süre"
            onChange={(e) => setSure(izinliSureler[Number(e.target.value)])}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            style={{ background: `linear-gradient(to right, #fff ${(sureSira / (izinliSureler.length - 1)) * 100}%, rgba(255,255,255,0.12) 0)` }} />
          <div className="mt-2 flex justify-between text-[11.5px] tabular-nums text-metin-3"><span>{izinliSureler[0]} sn</span><span>{izinliSureler[izinliSureler.length - 1]} sn</span></div>
          <div className="mt-3 flex gap-1.5">
            {[...new Set([izinliSureler[0], 5, 10, izinliSureler[izinliSureler.length - 1]])].filter((n) => izinliSureler.includes(n)).sort((x, y) => x - y).map((n) => (
              <button key={n} onClick={() => setSure(n)} aria-pressed={sure === n}
                className={cn("h-8 flex-1 rounded-full text-[12.5px] font-semibold tabular-nums transition-colors active:scale-[0.97]", sure === n ? "bg-white text-[#0a0a0b]" : "bg-white/[0.06] text-metin-2 hover:bg-white/[0.1] hover:text-metin")}>{n} sn</button>
            ))}
          </div>
        </div>
      ) : kaliteSecici(izinliSureler.map(String), String(sure), (v) => setSure(Number(v)), "sinema-sure")}
      {(!videoDemo || kisit) && (
        <p className="flex items-center gap-1 border-t border-white/[0.06] px-3 py-2 text-[12px] tabular-nums text-metin-2">
          {kisit ? `${coz} kalitede yalnız ${kisit.sureler.join(", ")} sn seçilebilir.` : <><KrediYildiz className="h-3 w-3" />{videoKredi(model, { sure, coz, ses: sesAcik })} kredi</>}
        </p>
      )}
    </MenuKart>
  );
  const kurguPaneli = (
    <>
      <MenuKart baslik="Çok çekimli" sag={
        <button onClick={() => setCokCekim((v) => !v)} role="switch" aria-checked={cokCekim} aria-label="Çok çekimli" className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", cokCekim ? "bg-white" : "bg-white/20")}>
          <span className={cn("absolute top-[3px] h-4 w-4 rounded-full transition-[left] duration-200", cokCekim ? "left-[19px] bg-[#0a0a0b]" : "left-[3px] bg-white")} />
        </button>}>
        <p className="px-3 py-2.5 text-[12px] leading-snug text-metin-2">Tek üretimde kesmeli birden fazla plan. Tempo, film kurulumundan gelir.</p>
        {cokCekim && (
          <div className="grid grid-cols-2 gap-1.5 border-t border-white/[0.06] p-2">
            {([["oto", "Otomatik", "Model planları kendisi böler", Sparkles], ["ozel", "Çekim listesi", "Her planı sen yazarsın", ScrollText]] as const).map(([v, a, n, I]) => (
              <button key={v} onClick={() => setCekimMod(v)} aria-pressed={cekimMod === v}
                className={cn("flex flex-col items-start gap-1.5 rounded-[12px] p-2.5 text-left ring-1 ring-inset transition-[background-color,transform] active:scale-[0.98]", cekimMod === v ? "bg-white/[0.08] ring-white/50" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06]")}>
                <I className="h-4 w-4 text-metin" />
                <span className="text-[12.5px] font-semibold text-metin">{a}</span><span className="text-[11px] leading-snug text-metin-3">{n}</span>
              </button>
            ))}
          </div>
        )}
      </MenuKart>
      {cokCekim && cekimMod === "ozel" && (
        <MenuKart baslik="Çekim listesi" sag={<span className={cn("text-[11.5px] tabular-nums", cekimToplam > cekimEnFazla || cekimToplam < cekimEnAz ? "text-amber-200" : "text-metin-3")}>Toplam {cekimToplam} / {cekimEnFazla} sn</span>}>
          <div className="space-y-2 p-2">
            {cekimler.map((c, i) => (
              <div key={c.id} className="rounded-[12px] bg-white/[0.03] p-2 ring-1 ring-inset ring-white/[0.06]">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[12px] font-semibold tabular-nums text-metin-2">Çekim {i + 1}</span>
                  <span className="ml-auto flex items-center gap-1">
                    <button onClick={() => setCekimler((l) => l.map((x) => (x.id === c.id ? { ...x, sn: Math.max(1, x.sn - 1) } : x)))} aria-label="Süreyi azalt" className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-metin-2 hover:text-metin active:scale-90"><Minus className="h-3 w-3" /></button>
                    <span className="w-9 text-center text-[12px] font-semibold tabular-nums text-metin">{c.sn} sn</span>
                    <button onClick={() => setCekimler((l) => l.map((x) => (x.id === c.id ? { ...x, sn: x.sn + 1 } : x)))} aria-label="Süreyi artır" className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-metin-2 hover:text-metin active:scale-90"><Plus className="h-3 w-3" /></button>
                    {cekimler.length > 2 && <button onClick={() => setCekimler((l) => l.filter((x) => x.id !== c.id))} aria-label={`Çekim ${i + 1} sil`} className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-metin-3 hover:text-rose-300"><X className="h-3.5 w-3.5" /></button>}
                  </span>
                </div>
                <textarea value={c.istem} onChange={(e) => setCekimler((l) => l.map((x) => (x.id === c.id ? { ...x, istem: e.target.value.slice(0, 400) } : x)))} rows={2} aria-label={`Çekim ${i + 1}`}
                  placeholder={i === 0 ? "İlk planda ne oluyor? Örnek: geniş plan, kapıdan giriyor" : "Sonra? Örnek: yakın plan, yüzünde şaşkınlık"} className="block w-full resize-none bg-transparent text-[12.5px] leading-snug text-metin outline-none placeholder:text-metin-3" />
              </div>
            ))}
          </div>
          <button onClick={() => cekimler.length < 6 && setCekimler((l) => [...l, { id: `c${Date.now().toString(36)}`, istem: "", sn: 3 }])} disabled={cekimler.length >= 6}
            className="flex w-full items-center gap-1.5 border-t border-white/[0.06] px-3 py-2.5 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.04] hover:text-metin disabled:opacity-40"><Plus className="h-3.5 w-3.5" />Çekim ekle</button>
        </MenuKart>
      )}
    </>
  );
  const istemKisileri = [...new Set([...prompt.matchAll(/@([\p{L}\p{N}_]+)/gu)].map((m) => m[1]))].slice(0, 4);
  const konusma = konusmaSn(diyalog);
  const diyalogPaneli = (
    <DiyalogPaneli diyalog={diyalog} setDiyalog={setDiyalog} dil={diyalogDili} setDil={setDiyalogDili} kisiler={istemKisileri} konusma={konusma} sure={etkinSure ?? undefined} sesNotu={sesNotu} setSesNotu={setSesNotu} />
  );
  const istemPaneli = (
    <>
      {sonIstemler.length > 0 && (
        <MenuKart baslik="Son istemlerin">
          <div className="p-1">
            {sonIstemler.map((p) => <button key={p} onClick={() => { setPrompt(p); setAcik(null); }} className="block w-full truncate rounded-[10px] px-2 py-1.5 text-left text-[12.5px] text-metin-2 hover:bg-white/[0.05] hover:text-metin">{p}</button>)}
          </div>
        </MenuKart>
      )}
      <MenuKart baslik="Örnek sahneler" sag={<span className="text-[11.5px] text-metin-3">Kurulumuyla gelir</span>}>
        <div className="p-1">
          {TOPLULUK.slice(0, 8).map((x) => (
            <button key={x.baslik} onClick={() => { tekrarla(x); setAcik(null); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left hover:bg-white/[0.05]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.gorsel} alt="" className="h-9 w-14 shrink-0 rounded-[8px] object-cover" />
              <span className="min-w-0"><span className="block text-[12.5px] font-medium text-metin">{x.baslik}</span><span className="block truncate text-[11.5px] text-metin-3">{x.istem}</span></span>
            </button>
          ))}
        </div>
      </MenuKart>
    </>
  );
  const oneriPaneli = (
    <MenuKart baslik="Kareden istem önerileri">
      <div className="p-1">
        {oneriYukleniyor ? <div className="space-y-1.5 p-1">{[0, 1, 2].map((i) => <span key={i} className="block h-12 animate-pulse rounded-[10px] bg-white/[0.05]" />)}</div>
          : oneriler?.liste.map((o) => <button key={o} onClick={() => { setPrompt(o); setAcik(null); odakla(); }} className="block w-full rounded-[10px] px-2 py-2 text-left text-[12.5px] leading-snug text-metin-2 hover:bg-white/[0.05] hover:text-metin">{o}</button>)}
      </div>
    </MenuKart>
  );
  const bolPaneli = (
    <MenuKart baslik="Hikâyeden storyboard" sag={<span className="text-[11.5px] text-metin-3">Yönetmen asistanı</span>}>
      <p className="px-3 pt-2.5 text-[12px] leading-relaxed text-metin-2">Asistan hikâyeni çekim listesine böler; her çekime plan boyu ve açı önerir. Listeyi düzenler, sonra aynı kurulumla kareleri çekersin.</p>
      <div className="grid grid-cols-4 gap-1.5 p-2">
        {[3, 4, 6, 8].map((n) => (
          <button key={n} onClick={() => setBolAdet(n)} aria-pressed={bolAdet === n}
            className={cn("flex h-14 flex-col items-center justify-center rounded-[12px] ring-1 ring-inset transition-[background-color,transform] active:scale-95", bolAdet === n ? "bg-white/[0.1] ring-white/50" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.07]")}>
            <span className="text-[16px] font-semibold tabular-nums text-metin">{n}</span><span className="text-[11px] text-metin-3">kare</span>
          </button>
        ))}
      </div>
      <div className="border-t border-white/[0.06] p-2">
        <button onClick={() => void listeCikar()} disabled={bolunuyor || temizIstem.length < 12} className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-[13px] font-semibold text-[#0a0a0b] transition-[opacity,transform] active:scale-[0.98] disabled:opacity-40">
          {bolunuyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}{bolunuyor ? "Çekimlere bölünüyor" : "Çekim listesini çıkar"}
        </button>
        {temizIstem.length < 12 && <p className="mt-2 text-center text-[12px] text-metin-3">Önce istem kutusuna hikâyeni yaz.</p>}
      </div>
    </MenuKart>
  );

  /* ═════════════ Yönetmen kutusu ═════════════ */
  const hazir = !eksik && !gonderiliyor;
  const modSecici = (_yatay?: boolean) => (
    <div role="radiogroup" aria-label="Üretim türü" className="flex h-12 shrink-0 items-center gap-0.5 rounded-full bg-white/[0.07] p-1">
      {([["gorsel", "Görsel", ImageIcon], ["video", "Video", Film]] as const).map(([k, a, I]) => (
        <Tooltip key={k} label={a} side="top">
          <button role="radio" aria-checked={mod === k} aria-label={a} onClick={() => { setMod(k); setAcik(null); }}
            className={cn("relative isolate flex h-10 w-10 items-center justify-center rounded-full transition-colors active:scale-[0.95]", mod === k ? "text-[#0a0a0b]" : "text-metin-3 hover:text-metin")}>
            {mod === k && <motion.span layoutId="sinema-mod" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
            <I className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </button>
        </Tooltip>
      ))}
    </div>
  );
  const araclarSol = (
    <>
      {mod === "gorsel" && ikonCip(Plus, "Referans görsel ekle", () => refRef.current?.click())}
      {mod === "video" && ikonCip(Plus, "Başlangıç karesi ekle", () => (bas ? ac("kareler") : basRef.current?.click()))}
      {ikonCip(AtSign, "Element ekle · karakter, mekân, ürün", () => setElementModal(true))}
      {mod === "video" && ikonCip(Hash, "Kamera hareketi ekle", () => setPencere("kamera"))}
      <div className="relative">
        {ikonCip(Lightbulb, "Örnek sahneler", () => ac("istem"), { acikMi: acik === "istem" })}
        {pop("istem", "w-[min(380px,calc(100vw-24px))]", istemPaneli)}
      </div>
      {yardimHazir && ikonCip(Feather, "İstemi geliştir", () => void istemiGelistir(), { yukleniyor: gelistiriliyor })}
      {mod === "gorsel" && (
        <div className="relative">
          {ikonCip(ScrollText, "Hikâyeden storyboard", () => ac("bol"), { acikMi: acik === "bol", yukleniyor: bolunuyor })}
          {pop("bol", "w-[min(330px,calc(100vw-24px))]", bolPaneli)}
        </div>
      )}
      {yardimHazir && mod === "video" && bas && (
        <div className="relative">
          {ikonCip(ScanEye, "Kareden istem öner", () => void karedenOner(), { acikMi: acik === "oneri" })}
          {pop("oneri", "w-[min(380px,calc(100vw-24px))]", oneriPaneli)}
        </div>
      )}
    </>
  );
  const ayarCipleri = mod === "video" ? (
    <>
      <div className="relative">
        {cip({ ust: "Model", etiket: <>{model}<ChevronDown className="h-3 w-3 text-metin-3" /></>, ikon: <span className="[&>span]:!h-9 [&>span]:!w-9 [&>span]:!rounded-full"><MarkaKare ad={model} boyut={36} /></span>, acikMi: acik === "vmodel", onClick: () => ac("vmodel"), title: undefined })}
        {pop("vmodel", "w-[min(440px,calc(100vw-24px))] !max-h-[min(66vh,calc(100vh-380px))] !p-2", <ModelSecici model={model} saglayicilar={saglayicilar} favoriler={favModeller} onFavori={favDegistir} onSec={(ad) => { if (modeliUygula(ad)) setAcik(null); }} />)}
      </div>
      {!oz.sureGizli && !ozelCekim && <div className="relative">{cip({ ust: "Süre", etiket: `${sure} sn`, ikon: <Clock />, acikMi: acik === "sure", onClick: () => ac("sure") })}{pop("sure", "w-[300px]", surePaneli)}</div>}
      {(oz.cozler.length > 0 || (!oz.oranGizli && oz.oranlar.length > 0)) && (() => {
        const oranVar = !oz.oranGizli && oz.oranlar.length > 0, cozVar = oz.cozler.length > 0;
        return (
          <div className="relative">
            {cip({ ust: oranVar && cozVar ? "Oran · kalite" : oranVar ? "Oran" : "Kalite", etiket: <>{oranVar && (oran === "Auto" ? "Oto" : oran)}{oranVar && cozVar && <span className="text-metin-3">·</span>}{cozVar && coz}</>, ikon: oranVar && oran !== "Auto" ? <OranSekli oran={oran} boyut={16} className="text-metin" /> : <Sparkles />, acikMi: acik === "oran", onClick: () => ac("oran") })}
            {pop("oran", "w-[340px]", <>{oranVar && oranPaneli}{cozVar && kalitePaneli}</>)}
          </div>
        );
      })()}
      {oz.sesToggle && cip({ ust: "Ses", etiket: sesli ? "Açık" : "Kapalı", ikon: sesli ? <Volume2 className="h-3.5 w-3.5 text-metin" /> : <VolumeX className="h-3.5 w-3.5 text-metin-3" />, onClick: () => setSesli((v) => !v), title: sesli ? "Ses: diyalog, efekt, ortam · kredi %25 artar" : "Sesi aç", ariaLabel: `Ses ${sesli ? "açık" : "kapalı"}` })}
      {sesAcik && (
        <div className="relative">
          {cip({ ust: "Diyalog", etiket: diyalog.some((d) => d.metin.trim()) ? `${diyalog.filter((d) => d.metin.trim()).length} satır` : sesNotu.trim() ? "Ortam sesi" : "Ekle", ikon: <MessageSquareQuote className={cn("h-3.5 w-3.5", diyalog.some((d) => d.metin.trim()) || sesNotu.trim() ? "text-metin" : "text-metin-3")} />, acikMi: acik === "diyalog", onClick: () => { if (!diyalog.length) setDiyalog([{ id: `d${Date.now().toString(36)}`, kim: istemKisileri[0] ?? "", metin: "", ton: "dogal" }]); ac("diyalog"); } })}
          {pop("diyalog", "w-[min(400px,calc(100vw-24px))]", diyalogPaneli)}
        </div>
      )}
      {oz.cokCekim && <div className="relative">{cip({ ust: "Çekim", etiket: cokCekim ? (cekimMod === "ozel" ? `${cekimler.length} çekim` : "Çok çekim") : "Tek plan", ikon: <Layers className={cn("h-3.5 w-3.5", cokCekim ? "text-metin" : "text-metin-3")} />, acikMi: acik === "kurgu", onClick: () => ac("kurgu") })}{pop("kurgu", "w-[min(360px,calc(100vw-24px))]", kurguPaneli)}</div>}
    </>
  ) : (
    <>
      <div className="relative">
        {cip({ ust: "Model", etiket: <>{kareModel}<ChevronDown className="h-3 w-3 text-metin-3" /></>, ikon: <span className="[&>span]:!h-9 [&>span]:!w-9 [&>span]:!rounded-full"><MarkaKare ad={kareModel} boyut={36} /></span>, acikMi: acik === "kmodel", onClick: () => ac("kmodel") })}
        {pop("kmodel", "w-[min(400px,calc(100vw-24px))] !max-h-[min(66vh,calc(100vh-380px))]", kareModelPaneli)}
      </div>
      <div className="relative">
        {cip({ ust: kareCozler.length ? "Oran · kalite" : "Oran", etiket: <>{kareOran === "Auto" ? "Oto" : kareOran}{kareCozler.length > 0 && <><span className="text-metin-3">·</span>{kareCoz}</>}</>, ikon: <OranSekli oran={kareOran === "Auto" ? "1:1" : kareOran} boyut={16} className="text-metin" />, acikMi: acik === "oran", onClick: () => ac("oran") })}
        {pop("oran", "w-[340px]", <>{oranPaneli}{kareCozler.length > 0 && kalitePaneli}</>)}
      </div>
    </>
  );
  const uretDugmesi = (o: { kucuk?: boolean } = {}) => (
    <div className={cn("flex h-12 shrink-0 items-center rounded-full bg-white p-1 text-[#0a0a0b] transition-opacity duration-200", o.kucuk && "w-full", gonderiliyor && "opacity-70")}>
      <div className="relative">
        <button onClick={() => ac("adet")} aria-expanded={acik === "adet"} aria-label={`Adet: ${adet}`} title="Aynı ayarla kaç tane"
          className="flex h-10 items-center gap-0.5 rounded-full pl-3 pr-2 text-[13px] font-bold tabular-nums transition-colors hover:bg-black/[0.06]">
          {adet}×<ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", acik === "adet" && "rotate-180")} />
        </button>
        {pop("adet", "w-[240px]", (
          <MenuKart baslik={mod === "gorsel" ? "Kaç kare?" : "Kaç video?"}>
            <div className="grid grid-cols-4 gap-1.5 p-2">
              {[1, 2, 3, 4].map((n) => (
                <button key={n} onClick={() => { setAdet(n); setAcik(null); }} aria-pressed={adet === n}
                  className={cn("flex h-14 flex-col items-center justify-center rounded-[12px] ring-1 ring-inset transition-[background-color,transform] active:scale-95", adet === n ? "bg-white/[0.1] ring-white/50" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.07]")}>
                  <span className="text-[16px] font-semibold tabular-nums text-metin">{n}</span>
                  <span className="text-[11px] text-metin-3">{mod === "gorsel" ? "kare" : "video"}</span>
                </button>
              ))}
            </div>
            <p className="border-t border-white/[0.06] px-3 py-2 text-[12px] leading-snug text-metin-2">Aynı istemle farklı varyasyonlar; en iyisini seç.</p>
          </MenuKart>
        ), "ust-sag")}
      </div>
      <span aria-hidden className="h-5 w-px bg-black/15" />
      <button onClick={() => void uret()} disabled={gonderiliyor} title={eksik ?? "Ctrl+Enter"}
        className={cn("flex h-10 min-w-0 items-center justify-center gap-2 rounded-full pl-3 text-[14.5px] font-semibold transition-[background-color,transform] hover:bg-black/[0.04] active:scale-[0.98]", demo ? "pr-4" : "pr-1", o.kucuk && "flex-1")}>
        {gonderiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        <span className="truncate">{mod === "gorsel" ? "Kare çek" : kaynak?.devam ? "Devam et" : "Üret"}</span>
        {!demo && <span className="flex h-7 items-center gap-1 rounded-full bg-black/[0.08] px-2.5 text-[11.5px] font-semibold tabular-nums">{kredi(toplam)}</span>}
      </button>
    </div>
  );
  const istemAlani = (
    <ElementMentionInput deger={prompt} onDeger={(v) => setPrompt(v.slice(0, 2500))} cokSatir otoBuyu enBuyuk={masaustu ? 132 : 100} inputRef={promptRef} seciciYukari
      onEnter={() => void uret()}
      placeholder={mod === "gorsel" ? "Ne çekmek istediğini anlat… · karakter ve mekân için @" : kaynak?.devam ? "Sonra ne oluyor? · kamera hareketi için #" : kaynak?.yon === "oncesi" ? "Bu çekimden önce ne oluyor? · kamera hareketi için #" : kaynak?.yon === "kopru" ? "İki çekim arasında ne oluyor? · kamera hareketi için #" : "Sahneni anlat · karakter ve mekân için @, kamera hareketi için #"}
      className="w-full bg-transparent pt-1 text-[15.5px] leading-relaxed text-metin placeholder:text-metin-3/80 min-h-[52px]" />
  );
  const not = (() => {
    const n = eksik && (temizIstem || bas || refler.length || eksik.includes("kapandı")) ? eksik
      : mod === "video" && sinirsizMod && sinirsizEngel ? `${sinirsizEngel}; bu istekte kredi düşer.`
      : !demo && krediler < toplam ? `Kredin yetersiz: ${toplam} gerekli, ${krediler} var.`
      : null;
    return n && <p className="mx-auto mt-2.5 flex w-fit max-w-full items-start gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[12px] leading-snug text-metin-2"><Info className="mt-px h-3.5 w-3.5 shrink-0" />{n}</p>;
  })();

  const kaynakSeridi = mod === "video" && kaynak && (
    <div className="mb-2 flex items-start gap-2 text-[12px]">
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-2 py-0.5 font-semibold text-metin">{kaynak.devam ? <FastForward className="h-3.5 w-3.5" /> : kaynak.yon === "oncesi" ? <Rewind className="h-3.5 w-3.5" /> : kaynak.yon === "kopru" ? <Link2 className="h-3.5 w-3.5" /> : <Clapperboard className="h-3.5 w-3.5" />}{kaynak.devam ? "Devam çekimi" : kaynak.yon === "oncesi" ? "Öncesi çekimi" : kaynak.yon === "kopru" ? "Köprü çekimi" : "Kareden video"}</span>
      <span className="min-w-0 flex-1 pt-0.5 leading-snug text-metin-3">“{kaynak.baslik}” {kaynak.devam ? "son karesinden devam eder" : kaynak.yon === "oncesi" ? "ilk karesine varır" : kaynak.yon === "kopru" ? `ile “${kaynak.hedefBaslik}” arasını bağlar` : "karesinden"}</span>
      <button onClick={() => { if (kaynak.yon) setSon(null); setKaynak(null); setBas(null); }} className="shrink-0 rounded-full px-2 py-0.5 font-medium text-metin-3 transition-colors hover:bg-white/[0.06] hover:text-metin">Vazgeç</button>
    </div>
  );
  /** Video sayfasındaki gibi kare yuvası: boşken artı, doluyken önizleme. */
  const YUVA = "relative flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[16px] sm:h-[76px] sm:w-[76px] sm:rounded-[18px] transition-all duration-200";
  const yuva = (o: { etiket: string; gorsel?: string; yukleniyor?: boolean; acikMi: boolean; onClick: () => void; kilitli?: boolean }) => (
    <GorselOnizleme url={o.yukleniyor ? undefined : o.gorsel} etiket={o.etiket} kapali={o.acikMi}>
    <button onClick={o.onClick} aria-expanded={o.acikMi} aria-label={`${o.etiket} ${o.gorsel ? "düzenle" : "ekle"}`}
      className={cn("group", YUVA, o.gorsel ? "ring-1 ring-inset ring-white/15" : "bg-[linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] ring-1 ring-inset", !o.gorsel && (o.acikMi ? "ring-white/30" : "ring-white/[0.09] hover:-translate-y-px hover:ring-white/25"), o.kilitli && "opacity-45")}>
      {o.gorsel ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={o.gorsel} alt="" className={cn("absolute inset-0 h-full w-full object-cover", o.yukleniyor && "opacity-50")} />
          {o.yukleniyor && <Loader2 className="relative h-4 w-4 animate-spin text-white" />}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent pb-1 pt-4 text-center text-[10px] font-semibold text-white">{o.etiket}</span>
        </>
      ) : (
        <>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07] text-metin transition-colors group-hover:bg-white group-hover:text-[#0a0a0b]"><Plus className="h-3.5 w-3.5" strokeWidth={2.5} /></span>
          <span className="text-[10.5px] font-medium leading-none text-metin-2">{o.etiket}</span>
        </>
      )}
    </button>
    </GorselOnizleme>
  );
  const yuvalar = (
    <div className="relative flex shrink-0 items-center gap-1.5">
      {mod === "video" ? (
        <>
          {yuva({ etiket: "Başlangıç", gorsel: bas?.url, yukleniyor: bas?.yukleniyor, acikMi: acik === "kareler", onClick: () => ac("kareler") })}
          {ikiKareModel && yuva({ etiket: "Bitiş", gorsel: son?.url, acikMi: acik === "kareler", onClick: () => ac("kareler") })}
          {pop("kareler", "w-[min(360px,calc(100vw-24px))]", karelerPaneli)}
        </>
      ) : (
        <>
          {yuva({ etiket: refler.length ? `${refler.length}/${refMax}` : "Referans", gorsel: refler[0]?.url, acikMi: acik === "refler", onClick: () => ac("refler") })}
          {pop("refler", "w-[min(340px,calc(100vw-24px))]", reflerPaneli)}
        </>
      )}
    </div>
  );
  const kurulumGorsel = (g: string | undefined, I: typeof Camera) => g
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={g} alt="" className="h-full w-full object-cover" />
    : <I className="h-4 w-4" />;
  const kurulumSatirlari: { id: PencereTur; ad: string; deger: string; gorsel?: string; ikon: typeof Camera; ozel?: React.ReactNode }[] = [
    { id: "kamera", ad: "Kamera", deger: kameraOzet(kurulum), gorsel: kartGorseli.kamera(kurulum), ikon: Camera },
    { id: "film", ad: "Film kurulumu", deger: filmOzet(kurulum), gorsel: kartGorseli.film(kurulum), ikon: Clapperboard },
    { id: "palet", ad: "Renk paleti", deger: paletAdi(kurulum), gorsel: kartGorseli.palet(kurulum), ikon: Palette, ozel: kurulum.palet === "ozel" && kurulum.paletOzel ? <span className="flex h-full w-full">{kurulum.paletOzel.map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}</span> : undefined },
    { id: "isik", ad: "Işık", deger: isikAdi(kurulum), gorsel: kartGorseli.isik(kurulum), ikon: Sun },
  ];
  const kurulumOzeti = kurulumSatirlari.map((k) => k.deger).filter((d) => d !== "Oto");
  const kurulumCipi = (
    <div className="relative">
      {cip({ ust: "Kurulum", etiket: <span className="flex items-center gap-1.5">{kurulumOzeti[0] ?? "Oto"}{kurulumOzeti.length > 1 && <span className="rounded-full bg-white/[0.1] px-1.5 text-[11px] font-semibold text-metin-2">+{kurulumOzeti.length - 1}</span>}</span>, ikon: kurulumGorsel(kartGorseli.film(kurulum), Clapperboard), acikMi: acik === "kurulum", onClick: () => ac("kurulum") })}
      {pop("kurulum", "w-[min(340px,calc(100vw-24px))]", (
        <MenuKart baslik="Yönetmen kurulumu" sag={kurulumOzeti.length > 0 ? <button onClick={() => setKurulum(VARSAYILAN_KURULUM)} className="rounded-full px-2 py-0.5 text-[12px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin">Sıfırla</button> : <span className="text-[11.5px] text-metin-3">Hepsi otomatik</span>}>
          <div className="space-y-0.5 p-1.5">
          {kurulumSatirlari.map((k) => (
            <button key={k.id} onClick={() => { setAcik(null); setPencere(k.id); }} className="group flex w-full items-center gap-3 rounded-[12px] p-1.5 text-left transition-colors hover:bg-white/[0.05]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white/[0.06] text-metin-2 ring-1 ring-inset ring-white/[0.08]">{k.ozel ?? kurulumGorsel(k.gorsel, k.ikon)}</span>
              <span className="min-w-0 flex-1 leading-tight"><span className="block text-[11.5px] text-metin-3">{k.ad}</span><span className="mt-0.5 block truncate text-[13.5px] font-medium text-metin">{k.deger}</span></span>
              <ChevronRight className="h-4 w-4 shrink-0 text-metin-3 transition-transform group-hover:translate-x-0.5 group-hover:text-metin" />
            </button>
          ))}
          </div>
        </MenuKart>
      ))}
    </div>
  );
  const kutu = (
    <div ref={komutRef} className={cn("cam-istemci relative w-full rounded-[26px]", masaustu ? "p-3" : "p-2.5", surukle && "ring-2 ring-white/60")}>
      {kaynakSeridi}
      <div className="flex items-start gap-3">
        {yuvalar}
        <div className="min-w-0 flex-1 px-1">

          {istemAlani}
        </div>
        {masaustu && <div className="flex shrink-0 items-center rounded-full bg-white/[0.035] p-0.5 ring-1 ring-inset ring-white/[0.07]">{araclarSol}</div>}
      </div>
      {!masaustu && <div className="mt-1 flex w-fit items-center rounded-full bg-white/[0.035] p-0.5 ring-1 ring-inset ring-white/[0.07]">{araclarSol}</div>}
      <div className="mt-3 flex items-center gap-2">
        <div className={cn("gizli-scroll min-w-0 flex-1 overflow-x-auto", masaustu ? "[mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] pr-5" : "-mx-2.5 px-2.5")}>
          <div className="flex w-max items-center gap-1">
            {modSecici()}
            {ayarCipleri}
            {kurulumCipi}
          </div>
        </div>
        {masaustu && uretDugmesi()}
      </div>
      {!masaustu && <div className="mt-2.5">{uretDugmesi({ kucuk: true })}</div>}
      {not}
    </div>
  );

  const izgaraSutun = yogunluk === "rahat" ? "columns-1 sm:columns-2 xl:columns-3" : "columns-2 md:columns-3 xl:columns-4 2xl:columns-5";
  const gruplar = useMemo(() => {
    const l: { etiket: string; oge: Uretim[] }[] = [];
    for (const u of gorunenler) { const e = gunEtiketi(u.olusturma); const s = l[l.length - 1]; if (s && s.etiket === e) s.oge.push(u); else l.push({ etiket: e, oge: [u] }); }
    return l;
  }, [gorunenler]);
  const secimModu = secililer.length > 0;
  const kartEylem = (u: Uretim) => ({
    onAc: () => setSeciliId(u.id), onSecim: () => secimToggle(u.id), onBegen: () => { begeniBildir(u.favori); favoriToggle(u.id); }, onIndir: () => uretimIndir(u), onKurulum: () => kurulumlaUret(u),
    onSahne: () => sahneDegistir(u), onYenidenDene: () => yenidenUret(u), onSil: () => uretimiSil(u),
    ...(u.tur === "video"
      ? { onDevam: u.gercek !== false && u.videoUrl ? () => void devamEt(u) : undefined, onOncesi: u.gercek !== false && u.videoUrl ? () => void oncesiCek(u) : undefined, onBuyut: u.gercek !== false && buyutAdresi(u) ? () => router.push(buyutAdresi(u)!) : undefined,
          onSonHal: u.meta?.taslak ? () => sonHalineGetir(u) : undefined, sonHalKredi: u.meta?.taslak ? (demoMi(u.model) ? undefined : sonHalKredisi(u) ? `${sonHalKredisi(u)} kredi` : "Sınırsız") : undefined }
      : { onCanlandir: () => canlandir(u), onAcilar: () => setAcilarIcin(u) }),
  });

  const vitrin = (
    <div className="relative mx-auto h-[156px] w-full max-w-[600px] sm:h-[176px]">
      {VITRIN.map((x, j) => {
        let d = j - vitrinI; const n = VITRIN.length; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
        if (Math.abs(d) > 1) return null;
        const orta = d === 0;
        return (
          <motion.button key={x.baslik} onClick={() => (orta ? tekrarla(x) : setVitrinI(j))} aria-label={orta ? `${x.baslik} kurulumunu yükle` : x.baslik}
            initial={false} animate={{ x: `calc(-50% + ${d * 190}px)`, scale: orta ? 1 : 0.8, zIndex: orta ? 2 : 1 }} transition={{ type: "spring", stiffness: 200, damping: 26 }}
            className={cn("group absolute left-1/2 top-0 aspect-[16/9] h-full overflow-hidden rounded-[14px]", orta ? "ring-2 ring-white/70" : "ring-1 ring-white/10")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={x.gorsel} alt="" className="h-full w-full object-cover" />
            {!orta && <span className="absolute inset-0 bg-black/45" />}
            {orta && (
              <>
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-2 text-left">
                  <span className="min-w-0"><span className="block truncate text-[15px] font-semibold tracking-[-0.01em] text-white">{x.baslik.toLocaleLowerCase("tr").replace(/(^|\s)\p{L}/gu, (m) => m.toLocaleUpperCase("tr"))}</span><span className="block truncate text-[11px] text-white/65">{x.yazar}</span></span>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-[#0a0a0b] opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100"><Wand2 className="h-3 w-3" />Tekrarla</span>
                </span>
              </>
            )}
          </motion.button>
        );
      })}
    </div>
  );
  const anaBos = (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10 md:px-8">
      {vitrin}
      <h1 className="mt-7 text-center text-[30px] font-semibold leading-[1.05] tracking-[-0.035em] text-metin sm:text-[42px] xl:text-[46px]">Hikâyeni hayata geçir</h1>
      <p className="mt-3 max-w-[520px] text-center text-[15px] leading-relaxed text-metin-2">Kamerayı, lensi, ışığı ve rengi bir yönetmen gibi kur. Önce kareyi çek, sonra hareketle canlandır, çekimlerini sahnede birleştir.</p>
      {masaustu && <div className="mt-8 w-full max-w-[1040px]">{kutu}</div>}
    </div>
  );
  const akisUst = (baslik: string, n: number) => (
    <div className="sticky top-0 z-20 bg-gradient-to-b from-[#0b0b0c] via-[#0b0b0c]/92 to-[#0b0b0c]/0 pb-3 max-md:bg-zemin/95">
      <div className="mx-auto flex max-w-[1440px] items-center gap-2.5 px-6 pt-5 max-md:px-3 max-md:pt-3">
        <p className="text-[22px] font-semibold tracking-[-0.02em] text-metin max-md:text-[18px]">{baslik}</p>
        {n > 0 && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-metin-2">{n}</span>}
        
        <span className="flex-1" />
        {aktifIs > 0 && (
          <span aria-live="polite" className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12px] font-medium text-metin ring-1 ring-inset ring-white/30">
            <span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-ping rounded-full bg-white/15" /><span className="relative h-2 w-2 rounded-full bg-white" /></span>{aktifIs} üretiliyor
          </span>
        )}
        <div role="tablist" aria-label="Süzgeç" className="flex h-10 items-center gap-0.5 rounded-full bg-white/[0.06] p-1">
          {([["tumu", "Tümü", null], ["kare", "Kareler", ImageIcon], ["video", "Videolar", Film]] as const).map(([k, a, I]) => (
            <button key={k} role="tab" aria-selected={filtre === k} onClick={() => setFiltre(k)} aria-label={a}
              className={cn("relative isolate flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors active:scale-[0.97]", filtre === k ? "text-[#0a0a0b]" : "text-metin-2 hover:text-metin")}>
              {filtre === k && <motion.span layoutId="sinema-filtre" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
              {I && <I className="h-3.5 w-3.5" />}<span className={cn(I && "max-md:hidden")}>{a}</span>
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Izgara yoğunluğu" className="flex h-10 items-center gap-0.5 rounded-full bg-white/[0.06] p-1 max-md:hidden">
          {([["rahat", Rows3, "Büyük kartlar"], ["sik", LayoutGrid, "Sık ızgara"]] as const).map(([k, I, a]) => (
            <button key={k} role="radio" aria-checked={yogunluk === k} onClick={() => setYogunluk(k)} aria-label={a} title={a}
              className={cn("relative isolate flex h-8 w-9 items-center justify-center rounded-full transition-colors active:scale-[0.95]", yogunluk === k ? "text-[#0a0a0b]" : "text-metin-2 hover:text-metin")}>
              {yogunluk === k && <motion.span layoutId="sinema-yogunluk" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
              <I className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  const sonTamam = gorunenler.find((u) => u.durum === "tamam");
  const sonrakiAdim = (
    <div className="mb-8 grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {sonTamam && (() => {
        const u = sonTamam, vid = u.tur === "video";
        const adimlar: { ikon: typeof Camera; ad: string; not: string; f: () => void }[] = vid
          ? [
              ...(u.videoUrl ? [{ ikon: FastForward, ad: "Devam çekimi", not: "Son kareden sürdür", f: () => void devamEt(u) }] : []),
              { ikon: Wand2, ad: "Bu kurulumla", not: "Aynı ayarla yeni çekim", f: () => kurulumlaUret(u) },
              { ikon: Layers, ad: sahnedeMi(u.id) ? "Sahnede" : "Sahneye ekle", not: "Çekimleri sırala", f: () => sahneDegistir(u) },
              { ikon: Film, ad: "Montaja gönder", not: "Kurguyu tamamla", f: () => router.push("/panel/montaj") },
            ]
          : [
              { ikon: Clapperboard, ad: "Canlandır", not: "Kareyi videoya çevir", f: () => canlandir(u) },
              { ikon: SwitchCamera, ad: "Başka açılar", not: "Aynı sahne, yeni kamera", f: () => setAcilarIcin(u) },
              { ikon: Wand2, ad: "Bu kurulumla", not: "Aynı ayarla yeni kare", f: () => kurulumlaUret(u) },
              { ikon: Layers, ad: sahnedeMi(u.id) ? "Sahnede" : "Sahneye ekle", not: "Çekimleri sırala", f: () => sahneDegistir(u) },
            ];
        return (
          <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07] text-metin"><ChevronRight className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1 text-[14px] font-semibold text-metin">Sıradaki adım</span>
              <span className="text-[12px] text-metin-3">{vid ? "Son videona göre" : "Son karene göre"}</span>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-1.5">
                {adimlar.map((a) => (
                  <button key={a.ad} onClick={a.f} className="group flex items-center gap-2.5 rounded-[12px] bg-white/[0.03] p-2 text-left ring-1 ring-inset ring-white/[0.07] transition-[background-color,transform] hover:bg-white/[0.07] active:scale-[0.98]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-metin transition-colors group-hover:bg-white group-hover:text-[#0a0a0b]"><a.ikon className="h-4 w-4" /></span>
                    <span className="min-w-0 leading-tight"><span className="block text-[13px] font-semibold text-metin">{a.ad}</span><span className="block text-[11.5px] text-metin-3">{a.not}</span></span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        );
      })()}
      <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07] text-metin"><Lightbulb className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1 text-[14px] font-semibold text-metin">Hazır kurulumlar</span>
          <span className="text-[12px] text-metin-3">Kamera, ışık ve renkle gelir</span>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
          {TOPLULUK.slice(0, 3).map((x) => (
            <button key={x.baslik} onClick={() => tekrarla(x)} className="group text-left">
              <span className="relative block aspect-video overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.gorsel} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
              </span>
              <span className="mt-1.5 block truncate text-[12.5px] font-medium text-metin">{x.baslik}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
  const akis = (
    <div className="mx-auto max-w-[1440px] px-6 pt-1 max-md:px-3">
      {gruplar.map((g) => {
        const tamamlar = g.oge.filter((u) => u.durum === "tamam");
        const hepsi = tamamlar.length > 0 && tamamlar.every((u) => secililer.includes(u.id));
        const kareN = g.oge.filter((u) => u.tur !== "video").length, vidN = g.oge.length - kareN;
        return (
          <section key={g.etiket} className="mb-8">
            <div className="mb-3.5 flex items-center gap-3">
              <p className="shrink-0 text-[14px] font-semibold text-metin">{g.etiket}</p>
              <span className="shrink-0 rounded-full bg-white/[0.05] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-3 ring-1 ring-inset ring-white/[0.06]">{[kareN ? `${kareN} kare` : "", vidN ? `${vidN} video` : ""].filter(Boolean).join(" · ")}</span>
              <span className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
              {tamamlar.length > 1 && <button onClick={() => tamamlar.forEach((u) => { if (hepsi === secililer.includes(u.id)) secimToggle(u.id); })} className="shrink-0 text-[12px] text-metin-3 transition-colors hover:text-metin">{hepsi ? "Seçimi kaldır" : "Tümünü seç"}</button>}
            </div>
            <div className={cn("gap-3", izgaraSutun)}>
              <AnimatePresence initial={false}>
                {g.oge.map((u) => (
                  <motion.div key={u.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25 }} className="mb-3 break-inside-avoid">
                    <SinemaKart u={u} secili={secililer.includes(u.id)} secimModu={secimModu} sahnede={sahnedeMi(u.id)} {...kartEylem(u)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        );
      })}
      {sayfa === "ana" && gorunenler.length > 0 && gorunenler.length < 9 && sonrakiAdim}
      {!gorunenler.length && (
        <BosYelpaze
          rozet={sayfa === "favori" ? <Heart className="h-5 w-5 fill-current" /> : filtre === "video" ? <Film className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
          rozetZemin={sayfa === "favori" ? "linear-gradient(140deg,#fda4af,#f43f5e)" : filtre === "video" ? "linear-gradient(140deg,#c4b5fd,#7c3aed)" : "linear-gradient(140deg,#a5f3fc,#0891b2)"}
          baslik={sayfa === "favori" ? (filtre === "video" ? "Favori videon yok" : "Favori karen yok") : filtre === "video" ? "Henüz videon yok" : "Henüz karen yok"}
          aciklama={sayfa === "favori" ? "Bu türde kalbe dokunduğun bir çekim yok. Tüm favorilerine dönebilir ya da yeni bir çekim yapabilirsin."
            : filtre === "video" ? "Bir kareyi Videoya çevir ile canlandır ya da Video modunda doğrudan çekim üret. Videoların burada toplanır."
            : "Görsel modunda istemini yaz, anahtar kareni çek. Kareleri sonra videoya çevirip sahneye dizebilirsin."}
          birincil={{ ad: filtre === "video" ? "Video çek" : "Kare çek", ikon: filtre === "video" ? <Film className="h-4 w-4" /> : <Camera className="h-4 w-4" />, onClick: () => { setMod(filtre === "video" ? "video" : "gorsel"); setSayfa("ana"); setFiltre("tumu"); odakla(); } }}
          ikincil={{ ad: sayfa === "favori" ? "Tüm favoriler" : "Tüm çekimler", ikon: <LayoutGrid className="h-4 w-4" />, onClick: () => setFiltre("tumu") }}
        />
      )}
    </div>
  );
  const akisVar = sinemaUretimleri.length > 0;
  const demoVar = sinemaUretimleri.some((u) => u.gercek === false);
  /** Favoriler boşken: üç film karesi yelpazesi, kalp rozeti ve iki yol. */
  const favoriBos = (
    <BosYelpaze rozet={<Heart className="h-5 w-5 fill-current" />} rozetZemin="linear-gradient(140deg,#fda4af,#f43f5e)" baslik="Henüz favorin yok"
      aciklama="Bir çekimin üzerindeki kalbe dokun; en iyi karelerin ve videoların burada toplanır. Sahneye dizmek ve yeniden üretmek buradan kolay."
      birincil={{ ad: akisVar ? "Çekimlerime dön" : "İlk çekimini yap", ikon: <Clapperboard className="h-4 w-4" />, onClick: () => { setSayfa("ana"); odakla(); } }}
      ikincil={{ ad: "Örnek kurulumla başla", ikon: <Wand2 className="h-4 w-4" />, onClick: () => tekrarla(VITRIN[0]) }} />
  );
  const elementSayfa = (
    <div className="h-full p-3 max-md:p-2">
      <div className="flex h-full flex-col overflow-hidden rounded-[20px] bg-[#111113] ring-1 ring-inset ring-white/[0.06]">
        <ElementKutuphanesi mod="sayfa" onDetay={(e) => setElDetayId(e.id)} onYeni={(k) => setElYeni(k)} onDuzenle={setElDuzenle}
          onKullan={(e) => { setPrompt((p) => `${p}${p && !p.endsWith(" ") ? " " : ""}@${e.ad} `); setSayfa("ana"); odakla(); toast.success(`@${e.ad} isteme eklendi`, { description: "Element istemine bağlandı." }); }} />
      </div>
    </div>
  );
  const sahneSayfa = (
    <SahneSeridi uretimler={tumUretimler} onPanoCanlandir={panoCanlandir} panoBilgi={{ model, sure: etkinSure ?? 0, birim: videoDemo ? 0 : videoBirim, demo: videoDemo }} onAc={(u) => setSeciliId(u.id)} onDevam={(u) => void devamEt(u)} onOncesi={(u) => void oncesiCek(u)} onKopru={(a, b) => void kopruCek(a, b)} onCanlandir={canlandir}
      onCekimlereGit={() => setSayfa("ana")} onMontaj={() => router.push("/panel/montaj")} onIndir={topluIndir} />
  );

  /* ═════════════ Pencereler ═════════════ */
  const elDetay = elDetayId ? elementler.find((e) => e.id === elDetayId) : undefined;
  const ekler = (
    <>
      <input ref={refRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => dosyaSecildi(e, "ref")} />
      <input ref={basRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => dosyaSecildi(e, "bas")} />
      <input ref={sonRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => dosyaSecildi(e, "son")} />
      <KurulumPenceresi tur={pencere} k={kurulum} onDegis={kurulumDegis} onKapat={() => setPencere(null)} istemHareketleri={hs} onHareketEkle={hareketEkle} gorselModu={mod === "gorsel"} />
      <Govde>
        <AnimatePresence>
          {acilarIcin && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde fixed inset-0 z-[120] bg-black/50" onClick={() => setAcilarIcin(null)}>
              <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }} onClick={(e) => e.stopPropagation()}
                role="dialog" aria-modal="true" aria-label="Başka açılardan çek" className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col border-l border-white/[0.08] bg-[#151517]">
                <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-metin"><SwitchCamera className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">Başka açılardan çek</span><span className="block text-[12px] text-metin-3">Yalnız kamera yer değiştirir</span></span>
                  <button onClick={() => setAcilarIcin(null)} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.06] hover:text-metin active:scale-90"><X className="h-4 w-4" /></button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
                  <MenuKart baslik="Kaynak kare" sag={<span className="text-[11.5px] text-metin-3">Oyuncu, mekân ve ışık korunur</span>}>
                    <div className="p-2"><div className="relative aspect-video overflow-hidden rounded-[10px] bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={saltUrl(acilarIcin.gorselUrl)} alt="" className="h-full w-full object-cover" />
                    </div></div>
                  </MenuKart>
                  <MenuKart baslik="Açılar" sag={<span className="text-[11.5px] tabular-nums text-metin-3">{aciSecim.length} seçili</span>}>
                    <div className="grid grid-cols-2 gap-1.5 p-2">
                      {ACI_SECENEKLERI.map((a) => {
                        const sec = aciSecim.includes(a.id);
                        return (
                          <button key={a.id} onClick={() => setAciSecim((l) => (sec ? l.filter((x) => x !== a.id) : [...l, a.id]))} aria-pressed={sec}
                            className={cn("flex items-center gap-2.5 rounded-[12px] p-2 text-left ring-1 ring-inset transition-[background-color,transform] active:scale-[0.98]", sec ? "bg-white/[0.08] ring-white/50" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06]")}>
                            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-colors", sec ? "bg-white text-[#0a0a0b]" : "bg-white/[0.07] text-metin-2")}><a.ikon className="h-4 w-4" /></span>
                            <span className="min-w-0 leading-tight"><span className="block text-[13px] font-semibold text-metin">{a.ad}</span><span className="block text-[11.5px] text-metin-3">{a.not}</span></span>
                          </button>
                        );
                      })}
                    </div>
                  </MenuKart>
                  <MenuKart baslik="Kapsama paketleri" sag={<span className="text-[11.5px] text-metin-3">Montaj için hazır set</span>}>
                    <div className="space-y-1 p-1.5">
                      {KAPSAMA.map((k) => {
                        const sec = k.acilar.length === aciSecim.length && k.acilar.every((x) => aciSecim.includes(x));
                        return (
                          <button key={k.ad} onClick={() => setAciSecim(k.acilar)} aria-pressed={sec}
                            className={cn("flex w-full items-center gap-3 rounded-[12px] p-2 text-left ring-1 ring-inset transition-[background-color,transform] active:scale-[0.99]", sec ? "bg-white/[0.08] ring-white/50" : "ring-transparent hover:bg-white/[0.05]")}>
                            <span className="flex shrink-0 -space-x-2">
                              {k.acilar.slice(0, 3).map((id) => { const a = ACI_SECENEKLERI.find((x) => x.id === id)!; return <span key={id} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#232326] text-metin ring-2 ring-[#151517]"><a.ikon className="h-3.5 w-3.5" /></span>; })}
                            </span>
                            <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13px] font-semibold text-metin">{k.ad}</span><span className="block text-[11.5px] text-metin-3">{k.not}</span></span>
                            <span className="shrink-0 text-[12px] tabular-nums text-metin-3">{k.acilar.length} kare</span>
                          </button>
                        );
                      })}
                    </div>
                  </MenuKart>
                </div>
                <div className="flex items-center gap-3 border-t border-white/[0.06] p-3">
                  <p className="flex-1 text-[12.5px] text-metin-2">{aciSecim.length ? `${aciSecim.length} açı, her biri ayrı kare` : "En az bir açı seç"}</p>
                  <button onClick={acilariCek} disabled={!aciSecim.length} className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0a0a0b] transition active:scale-[0.97] disabled:opacity-40">
                    <SwitchCamera className="h-4 w-4" />Çek{!hicGorselYok && <span className="flex items-center gap-1 rounded-full bg-black/10 px-2 py-0.5 text-[11.5px] tabular-nums"><KrediYildiz className="h-3 w-3" />{ACI_KREDI * aciSecim.length}</span>}
                  </button>
                </div>
              </motion.aside>
            </motion.div>
          )}
          {liste && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde fixed inset-0 z-[120] bg-black/50" onClick={() => setListe(null)}>
              <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }} onClick={(e) => e.stopPropagation()}
                role="dialog" aria-modal="true" aria-label="Çekim listesi" className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col border-l border-white/[0.08] bg-[#151517]">
                <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-metin"><ScrollText className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">Çekim listesi</span><span className="block text-[12px] text-metin-3">Düzenle, sırala, sonra kareleri çek</span></span>
                  <button onClick={() => setListe(null)} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.06] hover:text-metin active:scale-90"><X className="h-4 w-4" /></button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
                  <MenuKart baslik="Hikâye" sag={<button onClick={() => void listeCikar()} disabled={bolunuyor} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin disabled:opacity-40">{bolunuyor ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}Yeniden böl</button>}>
                    <p className="px-3 py-2.5 text-[12.5px] leading-relaxed text-metin-2">{liste.hikaye}</p>
                  </MenuKart>
                  <MenuKart baslik="Çekimler" sag={<span className="text-[11.5px] tabular-nums text-metin-3">{liste.cekimler.length} çekim</span>}>
                    <Reorder.Group axis="y" values={liste.cekimler} onReorder={(l) => setListe((x) => (x ? { ...x, cekimler: l } : x))} className="space-y-2 p-2">
                      {liste.cekimler.map((c, i) => (
                        <Reorder.Item key={c.id} value={c} className="list-none rounded-[12px] bg-white/[0.03] p-2 ring-1 ring-inset ring-white/[0.06]" whileDrag={{ scale: 1.02 }}>
                          <div className="flex items-center gap-1.5">
                            <span className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-full bg-white text-[12px] font-bold tabular-nums text-[#0a0a0b] active:cursor-grabbing" title="Sürükleyerek sırala">{i + 1}</span>
                            <select value={c.cekim} onChange={(e) => listeDegis(c.id, { cekim: e.target.value })} aria-label={`Çekim ${i + 1} plan boyu`}
                              className="h-8 min-w-0 flex-1 rounded-[9px] bg-white/[0.05] px-2 text-[12.5px] text-metin outline-none ring-1 ring-inset ring-white/[0.07] focus:ring-white/25">
                              {Object.entries(PLAN_AD).map(([k, a]) => <option key={k} value={k} className="bg-[#1c1c1f]">{a}</option>)}
                            </select>
                            <select value={c.aci} onChange={(e) => listeDegis(c.id, { aci: e.target.value })} aria-label={`Çekim ${i + 1} kamera açısı`}
                              className="h-8 min-w-0 flex-1 rounded-[9px] bg-white/[0.05] px-2 text-[12.5px] text-metin outline-none ring-1 ring-inset ring-white/[0.07] focus:ring-white/25">
                              {Object.entries(ACI_AD).map(([k, a]) => <option key={k} value={k} className="bg-[#1c1c1f]">{a}</option>)}
                            </select>
                            <button onClick={() => setListe((x) => (x ? { ...x, cekimler: x.cekimler.filter((y) => y.id !== c.id) } : x))} disabled={liste.cekimler.length < 2} aria-label={`Çekim ${i + 1} sil`}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-3 transition-colors hover:bg-white/[0.06] hover:text-rose-300 disabled:opacity-30"><X className="h-3.5 w-3.5" /></button>
                          </div>
                          <textarea value={c.istem} onChange={(e) => listeDegis(c.id, { istem: e.target.value.slice(0, 400) })} rows={3} aria-label={`Çekim ${i + 1}`}
                            placeholder="Bu çekimde ne görünüyor? Karakter, mekân, ışık." className="mt-1.5 block w-full resize-none bg-transparent px-0.5 text-[13px] leading-snug text-metin outline-none placeholder:text-metin-3" />
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                    <button onClick={() => setListe((x) => (x && x.cekimler.length < 10 ? { ...x, cekimler: [...x.cekimler, { id: `l${Date.now().toString(36)}`, istem: "", cekim: "orta", aci: "goz" }] } : x))} disabled={liste.cekimler.length >= 10}
                      className="flex w-full items-center gap-1.5 border-t border-white/[0.06] px-3 py-2.5 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.04] hover:text-metin disabled:opacity-40"><Plus className="h-3.5 w-3.5" />Çekim ekle</button>
                  </MenuKart>
                  <MenuKart baslik="Kurulum" sag={<span className="text-[11.5px] text-metin-3">{kareModel}</span>}>
                    <p className="px-3 py-2.5 text-[12.5px] leading-snug text-metin-2">Her kare aynı yönetmen kurulumuyla çekilir: {kurulumOzeti.length ? kurulumOzeti.join(", ") : "kamera, ışık ve renk otomatik"}. Kareler yeni bir sahneye dizilir; sonra sahne şeridinden hepsini tek seferde canlandırabilirsin.</p>
                  </MenuKart>
                </div>
                <div className="flex items-center gap-3 border-t border-white/[0.06] p-3">
                  <p className="flex-1 text-[12.5px] text-metin-2">{liste.cekimler.length} kare{!kareDemo && kareBirim ? `, ${kareBirim * liste.cekimler.length} kredi` : ""}</p>
                  <button onClick={listeyiCek} className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0a0a0b] transition active:scale-[0.97]">
                    <Clapperboard className="h-4 w-4" />Kareleri çek
                  </button>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </Govde>
      {elementModal && <ElementSeciciModal onSec={(ad) => { setPrompt((p) => (p.trim() ? `${p.trim()} @${ad} ` : `@${ad} `)); setElementModal(false); odakla(); }} onKapat={() => setElementModal(false)} />}
      <Govde>
        <AnimatePresence>
          {uretimSecici && (
            <UretimSecici hedef={uretimSecici === "ref" ? "bas" : uretimSecici} uretimler={tumUretimler} onKapat={() => setUretimSecici(null)}
              onKare={(url) => {
                const hedef = uretimSecici; setUretimSecici(null);
                if (hedef === "ref") { void refKoy(url); toast.success("Referans eklendi", { description: "Sonraki çekim bu görseli referans alacak." }); return; }
                void kareKoy(url, hedef); toast.success(hedef === "son" ? "Bitiş karesi eklendi" : "Başlangıç karesi eklendi");
              }}
              onVideo={() => setUretimSecici(null)} />
          )}
        </AnimatePresence>
      </Govde>
      <YeniProjeModalHF acik={yeniProje} kapat={() => setYeniProje(false)} onOlustur={(ad) => { const id = projeOlustur(ad.trim() || "Yeni film", "Sinema", { kaynakStudyo: "sinema" }); setYeniProje(false); toast.success("Proje oluşturuldu", { description: "Proje sayfası açılıyor." }); router.push(`/panel/projeler/${id}`); }} />
      <AnimatePresence>
        {elDetay && <ElementDetay key="el-detay" e={elDetay} onKapat={() => setElDetayId(null)} onDuzenle={() => setElDuzenle(elDetay)}
          onKullan={() => { setPrompt((p) => `${p}${p && !p.endsWith(" ") ? " " : ""}@${elDetay.ad} `); setElDetayId(null); setSayfa("ana"); odakla(); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {elYeni && <ElementDuzenleModal key="el-yeni" element={null} onKapat={() => setElYeni(null)} tohumDeger={elYeni.tip === "tur" ? { tur: elYeni.tur } : undefined}
          hedefKapsam={elYeni.tip === "proje" ? { projeId: elYeni.projeId } : undefined} onOlustu={(id) => setElDetayId(id)} />}
      </AnimatePresence>
      <AnimatePresence>
        {elDuzenle && <ElementDuzenleModal key={`el-d-${elDuzenle.id}`} element={elDuzenle} onKapat={() => setElDuzenle(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {seciliUretim && seciliUretim.tur === "video" && (() => {
          const u = seciliUretim;
          const kaynakU = u.meta?.kaynakId ? tumUretimler.find((x) => x.id === u.meta?.kaynakId) : undefined;
          const kz = u.meta?.kurulum ? kameraOzet(kurulumTamamla(u.meta.kurulum)) : "";
          return (
            <VideoGoruntuleyici
              key="vg" u={u} ad={u.baslik || "Çekim"} altBaslik={`${u.model}${kz && kz !== "Oto" ? ` · ${kz}` : ""}`}
              onAdKaydet={(y) => { guncelle(u.id, { baslik: y }); toast.success("Ad değiştirildi", { description: `Artık “${y}” olarak görünecek.` }); }}
              sira={lbIndex >= 0 ? { i: lbIndex, n: gezListe.length } : null} onGez={gez} onKapat={() => setSeciliId(null)}
              yorumlar={<YorumSekmesi yorum={yorum} setYorum={setYorum} konuId={u.id} />} yorumSayisi={tumYorumlar.filter((y) => y.konuId === u.id).length}
              ustKatmanAcik={elementModal} krediler={krediler} uzatKredi={uretimKredisi(u)}
              onUzat={(kare, istem) => viewerUzat(u, kare, istem)}
              onKareBaslangic={(kare) => { setMod("video"); void kareKoy(kare, "bas"); setKaynak(null); setSeciliId(null); toast.success("Başlangıç karesi eklendi", { description: "Ne olacağını yaz ve çek." }); odakla(); }}
              onKareDuzenle={(kare, an) => {
                void (async () => {
                  const url = await kareKalici(kare);
                  const id = projeEkle({ baslik: `${kisalt(u.baslik || "Çekim", 40)} · kare ${an.toFixed(1).replace(".", ",")} sn`, tur: "gorsel", model: "Kare yakalama", prompt: u.prompt, durum: "tamam", ilerleme: 100, kredi: 0, arac: ARAC, gorselUrl: url, gercek: true, projeId: aktifProjeId ?? undefined,
                    meta: { kaynakId: u.id, surumTur: "yakalama", oran: u.meta?.oran, kurulum: u.meta?.kurulum, hamIstem: u.meta?.hamIstem as string | undefined } });
                  setSeciliId(id);
                  toast("Kare düzenlemeye açıldı", { description: "Düzenle sekmesinde bölgeyi boya ve değiştir. Sonra Canlandır ile bu kareden yeni çekim yap." });
                })();
              }}
              onKareKaydet={(kare, an) => {
                void kareKalici(kare).then((url) => projeEkle({ baslik: `${(u.baslik || "Çekim").slice(0, 36)} · kare ${an.toFixed(1).replace(".", ",")} sn`, tur: "gorsel", model: "Kare yakalama", prompt: u.prompt, durum: "tamam", ilerleme: 100, kredi: 0, arac: ARAC, gorselUrl: url, meta: { kaynakId: u.id, surumTur: "yakalama", oran: u.meta?.oran, kurulum: u.meta?.kurulum } }));
                toast.success("Kare kaydedildi", { description: "Akışta anahtar kare olarak duruyor." });
              }}
              onIndir={() => uretimIndir(u)} onAyarlariYukle={() => kurulumlaUret(u)} onYenidenUret={() => yenidenUret(u)} onBegen={() => { favoriToggle(u.id); toast.success(u.favori ? "Beğenilerden çıkarıldı" : "Beğenilere eklendi"); }} onSil={() => uretimiSil(u)}
              kaynak={kaynakU ? { poster: saltUrl(kaynakU.gorselUrl), ad: kaynakU.baslik, ac: () => setSeciliId(kaynakU.id) } : undefined}
              ekBilgi={<><DiyalogKarti u={u} /><SurumKarti u={u} tum={tumUretimler} onAc={setSeciliId} /></>}
              atolye={{ onKaydet: (s, islem) => atolyeKaydet(u, s, islem) }}
            />
          );
        })()}
        {seciliUretim && seciliUretim.tur !== "video" && saltUrl(seciliUretim.gorselUrl) && (() => {
          const u = seciliUretim;
          return (
            <GorselGoruntuleyici
              key="gg" uretimId={u.id} url={saltUrl(u.gorselUrl)!} ad={u.baslik || "Anahtar kare"}
              altBaslik={`${u.model} · ${new Date(u.olusturma).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
              onAdKaydet={(y) => { guncelle(u.id, { baslik: y }); toast.success("Ad değiştirildi", { description: `Artık “${y}” olarak görünecek.` }); }}
              sira={lbIndex >= 0 ? { i: lbIndex, n: gezListe.length } : null} onGez={gez} onKapat={() => setSeciliId(null)}
              ustKatmanAcik={elementModal || !!acilarIcin} krediler={krediler}
              onIndir={() => uretimIndir(u)} onAracCalistir={aracCalistir} onYerelKaydet={yerelKaydet}
              yorumSayisi={tumYorumlar.filter((y) => y.konuId === u.id).length}
              yorumlar={<YorumSekmesi yorum={yorum} setYorum={setYorum} konuId={u.id} />}
              bilgi={<KareBilgi u={u} ekBilgi={<SurumKarti u={u} tum={tumUretimler} onAc={setSeciliId} />} sahnede={sahnedeMi(u.id)} onCanlandir={() => canlandir(u)} onSahne={() => sahneDegistir(u)} onAcilar={() => setAcilarIcin(u)}
                onKurulum={() => kurulumlaUret(u)} onIndir={() => uretimIndir(u)} onBegen={() => { favoriToggle(u.id); toast.success(u.favori ? "Beğenilerden çıkarıldı" : "Beğenilere eklendi"); }} onSil={() => uretimiSil(u)} />}
            />
          );
        })()}
      </AnimatePresence>
    </>
  );

  const surukleOlay = {
    onDragOver: (e: React.DragEvent) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setSurukle(true); } },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSurukle(false); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setSurukle(false); void dosyalariEkle([...e.dataTransfer.files]); },
  };
  const klavye = (e: React.KeyboardEvent) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !pencere) { e.preventDefault(); void uret(); } };

  /* Gömülü: yalnız yönetmen kutusu. */
  if (gomulu) return <div onKeyDown={klavye} {...surukleOlay}>{kutu}{ekler}</div>;

  const anaSayfa = sayfa === "ana" || sayfa === "favori";
  /** Kutu tuvalin altında yüzer: akış varken ana/favori sayfalarında, mobilde her zaman. */
  const kutuAltta = anaSayfa && (akisVar || !masaustu);
  const icerik = sayfa === "element" ? elementSayfa
    : sayfa === "sahne" ? <div className="pt-4">{sahneSayfa}</div>
    : sayfa === "favori" ? (favoriler.length ? <>{akisUst("Favorilerim", favoriler.length)}{akis}</> : favoriBos)
    : akisVar ? <>{akisUst("Çekimlerim", sinemaUretimleri.length)}{akis}</>
    : anaBos;
  const sayilar = { favori: favoriler.length || undefined, sahne: aktifSahne.cekimler.length || undefined, element: elementler.length || undefined };

  /* ═════════════ MOBİL ═════════════ */
  if (!masaustu) {
    return (
      <div className="flex min-h-[100dvh] flex-col overflow-x-clip bg-zemin" onKeyDown={klavye} {...surukleOlay}>
        <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-white/[0.05] bg-zemin/95 px-3 backdrop-blur">
          <button onClick={() => setMobilKenar(true)} aria-label="Menü" className="flex h-9 w-9 items-center justify-center rounded-[10px] text-metin-2 ring-1 ring-inset ring-white/[0.08]"><Menu className="h-4 w-4" /></button>
          <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-white text-[#0a0a0b]"><Clapperboard className="h-3.5 w-3.5" /></span>
          <p className="text-[14.5px] font-semibold text-metin">Sinema Stüdyosu</p>
          <span className="flex-1" />
          <span className="text-[12.5px] text-metin-3">{{ ana: "Ana sayfa", element: "Elementler", favori: "Favoriler", sahne: "Sahne" }[sayfa]}</span>
        </div>
        <AnimatePresence>
          {mobilKenar && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde fixed inset-0 z-[90] bg-black/60" onClick={() => setMobilKenar(false)}>
              <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", stiffness: 340, damping: 34 }} className="h-full w-[264px]" onClick={(e) => e.stopPropagation()}>
                <Kenar sayfa={sayfa} onSayfa={setSayfa} sayilar={sayilar} projeler={projeler} onYeniProje={() => { setMobilKenar(false); setYeniProje(true); }} dar={false} onDar={() => setMobilKenar(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={akisRef} className="flex-1 pb-4">{icerik}</div>
        {sayfa !== "element" && sayfa !== "sahne" && <div className="sticky bottom-0 z-30 bg-zemin p-2 pb-[calc(8px+env(safe-area-inset-bottom))]">{kutu}</div>}
        <SecimToolbar />
        {ekler}
      </div>
    );
  }

  /* ═════════════ MASAÜSTÜ ═════════════ */
  return (
    <div className="flex h-[calc(100vh-var(--ust-nav))] w-full bg-[#0b0b0c]" onKeyDown={klavye} {...surukleOlay}>
      <Kenar sayfa={sayfa} onSayfa={setSayfa} sayilar={sayilar} projeler={projeler} onYeniProje={() => setYeniProje(true)} dar={dar} onDar={darAyarla} />
      <div className="relative mt-1.5 min-w-0 flex-1 overflow-hidden rounded-tl-[22px] border-l border-t border-white/[0.05] bg-[#111113]">
        <div ref={akisRef} className="h-full overflow-y-auto [scrollbar-width:thin]" style={{ paddingBottom: kutuAltta ? komutH + 36 : 0 }}>{icerik}</div>
        {surukle && (
          <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-[22px] border-2 border-dashed border-white/40 bg-white/[0.08]">
            <span className="rounded-full bg-[#0b0b0c]/85 px-4 py-2 text-[14px] font-medium text-metin">{mod === "gorsel" ? "Görseli bırak: referans olur" : "Görseli bırak: başlangıç karesi olur"}</span>
          </div>
        )}
        {kutuAltta && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-5">
            <div className="pointer-events-auto w-full max-w-[1040px]">{kutu}</div>
          </div>
        )}
      </div>
      <SecimToolbar kapsayiciRef={akisRef} />
      {ekler}
    </div>
  );
}

/** Popover içi başlık şeritli kart (diğer stüdyolarla aynı). */
function MenuKart({ baslik, sag, children }: { baslik: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07] [&+&]:mt-2" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-metin">{baslik}</span>{sag}</div>
      {children}
    </div>
  );
}

/** Boş durum: üç film karesi yelpazesi, renkli rozet, başlık, açıklama ve iki yol (Favorilerim'deki dil). */
function BosYelpaze({ rozet, rozetZemin, baslik, aciklama, birincil, ikincil }: {
  rozet: React.ReactNode; rozetZemin: string; baslik: string; aciklama: string;
  birincil: { ad: string; ikon: React.ReactNode; onClick: () => void }; ikincil: { ad: string; ikon: React.ReactNode; onClick: () => void };
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative h-[150px] w-[300px]">
        {VITRIN.slice(0, 3).map((x, i) => (
          <motion.div key={x.baslik} initial={{ opacity: 0, y: 14, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: (i - 1) * 9 }} transition={{ delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn("absolute left-1/2 top-2 aspect-[16/10] w-[170px] overflow-hidden rounded-[14px] ring-1 ring-white/15", i === 1 ? "z-10" : "opacity-70")}
            style={{ marginLeft: -85 + (i - 1) * 70 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={x.gorsel} alt="" className="h-full w-full object-cover" />
          </motion.div>
        ))}
        <motion.span key={baslik} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.2 }}
          className="absolute bottom-0 left-1/2 z-20 -ml-6 flex h-12 w-12 items-center justify-center rounded-full text-white ring-4 ring-[#111113]" style={{ background: rozetZemin }}>
          {rozet}
        </motion.span>
      </div>
      <h2 className="mt-7 text-[24px] font-semibold tracking-[-0.02em] text-metin">{baslik}</h2>
      <p className="mt-2 max-w-[420px] text-[14px] leading-relaxed text-metin-2">{aciklama}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <motion.button whileTap={{ scale: 0.96 }} onClick={birincil.onClick} className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0a0a0b] transition-transform hover:-translate-y-px">{birincil.ikon}{birincil.ad}</motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={ikincil.onClick} className="flex h-11 items-center gap-2 rounded-full bg-white/[0.085] px-5 text-[14px] font-semibold text-metin ring-1 ring-inset ring-white/[0.1] transition-colors hover:bg-white/[0.12]">{ikincil.ikon}{ikincil.ad}</motion.button>
      </div>
    </div>
  );
}
