"use client";

/**
 * Video stüdyosu — stüdyo düzeni: büyük tuval (üretimlerim / hareket kütüphanesi) + altta yüzen
 * komut kutusu. Komut kutusunda kareler, istem ve görselli çiplerden açılan seçiciler bulunur.
 *
 * Gerçek kurallar tek kaynaktan gelir: modelin izinli süre/kalite/oran/ses/son kare değerleri
 * `videoModelOzellik` + `videoErisim`; demo kararı `useSaglayicilar`. Kredi süre, kalite ve sese
 * göre hesaplanır (`videoKredi`) ve düğmede görünür. Demo üretimde kredi düşmez.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Dices,
  AtSign, ArrowLeftRight, Check, ChevronDown, Clock, Film, FastForward, Heart, ImagePlus, Images, Info, Layers, Lightbulb,
  Loader2, Lock, Minus, Plus, Move3d, PenLine, Ban, Sparkles, Upload, Volume2, VolumeX, Wand2, X, Infinity as Sonsuz, LayoutGrid, Rows3, ScanEye, Feather,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { neden, uretimGeriYukle } from "@/components/studyo/bildirim";
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
import { SINIRSIZ_TEKLIFLER } from "@/lib/fiyat";
import { uretimIndir } from "@/lib/gercekEylem";
import { buyutAdresi } from "@/components/kitaplik/eylemler";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useReferansKopru } from "@/store/useReferansKopru";
import { useAyarKopru } from "@/store/useAyarKopru";
import { useYorumlar } from "@/store/useYorumlar";
import { useAuth } from "@/store/useAuth";
import { useEkler, aktifSinirsizlar } from "@/store/useEkler";
import { useSecim } from "@/store/useSecim";
import { bekleyenElement } from "@/components/panel/element/KullanSecici";
import { ElementMentionInput } from "@/components/panel/ElementMentionInput";
import { ElementSeciciModal } from "@/components/panel/element/ElementSeciciModal";
import { SecimToolbar } from "@/components/panel/SecimToolbar";
import { Yuzen } from "@/components/ui/Yuzen";
import { Tooltip } from "@/components/ui/Tooltip";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { MarkaKare } from "@/components/studyo/hf";
import { OranSekli, gorselYukle } from "@/components/arac/kit";
import { VideoGoruntuleyici, kareYakala } from "@/components/studyo/VideoGoruntuleyici";
import { YorumSekmesi } from "@/components/studyo/YorumSekmesi";
import type { StudyoGomuluProps } from "@/components/studyo/tipler";
import { VideoKart } from "./video/VideoKart";
import { Kayan } from "@/components/dump/dumpOrtak";
import { HareketGalerisi } from "./video/HareketGalerisi";
import { ModelSecici } from "./video/ModelSecici";
import { UretimSecici } from "./video/UretimSecici";
import {
  HAREKETLER, HIZLI_BASLANGIC, KALITE_NOT, KARISIM_EN_FAZLA, gunEtiketi, hareketAdi, hareketBul, hareketListesi, kaliteSira, klipYolu, modelCoz, posterYolu,
  sinirsizKimligi, videoKredi, type Hareket,
} from "./video/veri";

const KART = "overflow-hidden rounded-[20px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]";
const SERIT = "flex min-h-[56px] flex-wrap items-center gap-3 border-b border-white/[0.07] px-4 py-3";
const POP = "rounded-[18px] border border-white/[0.08] bg-[#151517]";
/** Oran kutusundaki kısa ad ve altındaki kullanım notu. */
const ORAN_AD: Record<string, [string, string]> = {
  "16:9": ["Yatay", "YouTube ve sunum için"], "9:16": ["Dikey", "Reels, TikTok ve Shorts için"], "1:1": ["Kare", "Gönderi ve reklam için"], "4:3": ["Klasik", "Klasik ekran oranı"],
  "3:4": ["Portre", "Dikey portre çekimi"], "21:9": ["Sinema", "Geniş sinema kadrajı"], "4:5": ["Instagram", "Instagram akışı için"], Auto: ["Oto", "Başlangıç karesinin oranı kullanılır"],
};
const VARSAYILAN_MODEL = "Kling 3.0";
type Kare = { url: string; yukleniyor?: boolean };
type Cekim = { id: string; istem: string; sn: number };
type Pop = null | "model" | "sure" | "oran" | "cekim" | "istem" | "oneri" | "adet" | "bas" | "son" | "uzat" | "negatif" | "tohum";

/** Yüklenen görseli kare olarak hazırlar: en uzun kenar 1600 px, WebP data URL. */
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
/**
 * Kareyi sunucuya yükler; üretim kaydında base64 yerine kısa bir adres saklanır (tarayıcı deposu
 * dolmasın). Yükleme olmazsa data URL ile devam edilir; sağlayıcı ikisini de kabul eder.
 */
async function kareKalici(url: string): Promise<string> {
  if (!url.startsWith("data:")) return url;
  try { return await gorselYukle(url); } catch { return url; }
}

/** Poster; fareyle üzerine gelince klip oynar. */
function KlipKart({ klip, className }: { klip: string; className?: string }) {
  const [oyna, setOyna] = useState(false);
  return (
    <span className="absolute inset-0" onPointerEnter={(e) => { if (e.pointerType === "mouse") setOyna(true); }} onPointerLeave={() => setOyna(false)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={posterYolu(klip)} alt="" loading="lazy" className={cn("absolute inset-0 h-full w-full object-cover", className)} />
      {oyna && <video src={klipYolu(klip)} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
    </span>
  );
}

/** Pencereleri body'ye taşır: gömülü kabuk `.fixed` öğeleri akışa aldığı için (globals.css) şart. */
function Govde({ children }: { children: React.ReactNode }) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  return hazir ? createPortal(children, document.body) : null;
}

export function VideoStudyo({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
  /* Gömülüyken üretim gömüldüğü projeye yazılır ve dış sayfaya haber verilir. */
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

  /* ═════════════ Durum ═════════════ */
  const [kaynakTur, setKaynakTur] = useState<"kare" | "uzat">("kare");
  const [bas, setBas] = useState<Kare | null>(null);
  const [son, setSon] = useState<Kare | null>(null);
  const [uzatKaynak, setUzatKaynak] = useState<{ url: string; poster?: string; baslik: string; oran?: string; id?: string; yerel?: boolean } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [negatif, setNegatif] = useState("");
  /** Tohum (seed): destekleyen modelde aynı istemle benzer sonucu yeniden almak için. Boş = rastgele. */
  const [tohum, setTohum] = useState("");
  const [model, setModel] = useState(VARSAYILAN_MODEL);
  const oz = videoModelOzellik(model);
  const [sure, setSure] = useState(() => videoModelOzellik(VARSAYILAN_MODEL).sure);
  const [coz, setCoz] = useState(() => videoModelOzellik(VARSAYILAN_MODEL).coz);
  const [oran, setOran] = useState(() => videoModelOzellik(VARSAYILAN_MODEL).oran ?? "16:9");
  const [sesli, setSesli] = useState(false);
  const [cokCekim, setCokCekim] = useState(false);
  const [cekimMod, setCekimMod] = useState<"oto" | "ozel">("oto");
  const [cekimler, setCekimler] = useState<Cekim[]>([{ id: "c1", istem: "", sn: 3 }, { id: "c2", istem: "", sn: 3 }]);
  const [hareket, setHareket] = useState("GENEL");
  const [adet, setAdet] = useState(1);
  const [sinirsizMod, setSinirsizMod] = useState(false);
  const [acik, setAcik] = useState<Pop>(null);
  const [hareketPencere, setHareketPencere] = useState(false);
  const [elementModal, setElementModal] = useState(false);
  const [uretimSecici, setUretimSecici] = useState<null | "bas" | "son" | "uzat">(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [surukle, setSurukle] = useState(false);
  const [sekme, setSekme] = useState<"akis" | "ilham" | "hareketler">("akis");
  const [filtre, setFiltre] = useState<"tumu" | "begenilen">("tumu");
  const [yogunluk, setYogunluk] = useState<"rahat" | "sik">("rahat");
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [yorum, setYorum] = useState("");
  const [favModeller, setFavModeller] = useState<string[]>([]);
  /* İstem yardımcısı (Gemini): istemi geliştirme ve kareden istem önerme. */
  const [yardimHazir, setYardimHazir] = useState<boolean | null>(null);
  const [gelistiriliyor, setGelistiriliyor] = useState(false);
  const [oneriler, setOneriler] = useState<{ kare: string; liste: string[] } | null>(null);
  const [oneriYukleniyor, setOneriYukleniyor] = useState(false);
  useEffect(() => { fetch("/api/istem").then((x) => x.json()).then((j: { hazir?: boolean }) => setYardimHazir(!!j.hazir)).catch(() => setYardimHazir(false)); }, []);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const basRef = useRef<HTMLInputElement>(null);
  const sonRef = useRef<HTMLInputElement>(null);
  const uzatRef = useRef<HTMLInputElement>(null);
  const komutRef = useRef<HTMLDivElement>(null);
  const akisRef = useRef<HTMLDivElement>(null);
  const [komutH, setKomutH] = useState(170);
  useEffect(() => {
    const el = komutRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setKomutH(el.offsetHeight)); ro.observe(el);
    return () => ro.disconnect();
  }, [masaustu]);
  useEffect(() => { try { setFavModeller(JSON.parse(localStorage.getItem("vayra-video-fav") ?? "[]")); } catch { /* yok */ } }, []);
  const favDegistir = (ad: string) => setFavModeller((l) => {
    const y = l.includes(ad) ? l.filter((x) => x !== ad) : [...l, ad];
    try { localStorage.setItem("vayra-video-fav", JSON.stringify(y)); } catch { /* yok */ }
    return y;
  });

  /* ═════════════ Model ve ayar kuralları ═════════════ */
  const erisim = videoErisim(model);
  const falOzel = erisim.durum === "gercek" ? erisim.fal : undefined;
  const tohumVar = !!falOzel?.tohum;
  const negatifYerel = !!falOzel?.negatif;
  const demo = erisim.durum === "gercek" && !!saglayicilar && !saglayicilar[erisim.saglayici];
  /** Modeli seçer ve o modelin varsayılan süre/kalite/oranını uygular. Kullanılamayan model seçilmez. */
  const modeliUygula = (ad: string, sessiz = false): boolean => {
    const e = videoErisim(ad);
    if (e.durum !== "gercek") { if (!sessiz) toast.error(`${ad} ${e.durum === "kapandi" ? "kapandı" : "henüz kullanılamıyor"}`, { description: `${neden(e.neden, "Bu model şu an kullanılamıyor.")} Başka bir model seç.` }); return false; }
    const o = videoModelOzellik(ad);
    setModel(ad); setSure(o.sure); setCoz(o.coz); if (o.oran) setOran(o.oran);
    return true;
  };
  /* Model hangi yoldan değişirse değişsin ayarlar modelin sunduklarından biri olmalı. */
  useEffect(() => {
    const o = videoModelOzellik(model);
    if (o.sureler.length && !o.sureler.includes(sure)) setSure(o.sure);
    if (o.cozler.length && !o.cozler.includes(coz)) setCoz(o.coz);
    if (!o.oranGizli && o.oranlar.length && !o.oranlar.includes(oran)) setOran(o.oran ?? o.oranlar[0]);
    if (!o.cokCekim) setCokCekim(false);
    if (!o.sesToggle) setSesli(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);
  /* Çözünürlüğe bağlı süre kısıtı (ör. Hailuo 1080p yalnız 6 sn). */
  const kisit = erisim.durum === "gercek" ? erisim.kisit?.find((k) => k.coz === coz) : undefined;
  useEffect(() => {
    if (kisit && !kisit.sureler.includes(sure)) { setSure(kisit.sureler[0]); toast(`Süre ${kisit.sureler[0]} sn yapıldı`, { description: `${coz} çözünürlükte yalnız ${kisit.sureler.join(" / ")} sn seçilebilir.` }); }
  }, [kisit, coz, sure]);

  const ikiKareModel = oz.kutu === "kareler";
  const uzatMod = kaynakTur === "uzat";
  /** Seçili hareketler: tek hareket ya da en fazla 3 kamera hareketinin karışımı. */
  const hs = hareketListesi(hareket === "GENEL" ? "" : hareket);
  const h = hs[0];
  const ozelCekim = oz.cokCekim && cokCekim && cekimMod === "ozel";
  const cekimToplam = cekimler.reduce((n, c) => n + c.sn, 0);
  const cekimEnFazla = oz.sureler.length ? Math.max(...oz.sureler) : 15;
  const cekimEnAz = oz.sureler.length ? Math.min(...oz.sureler) : 3;
  const sesAcik = sesli && oz.sesToggle;
  const etkinSure = oz.sureGizli ? undefined : ozelCekim ? cekimToplam : sure;

  /* Sınırsız erişim: bu model için satılan paket varsa anahtar görünür; sınırı aşan istekte kredi düşer. */
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

  const tamFiyat = videoKredi(model, { sure: etkinSure, coz, ses: sesAcik });
  const birim = demo || sinirsizGecerli ? 0 : tamFiyat;
  const toplam = birim * adet;
  /* Taslak: aynı ayarlar, modelin en düşük kalitesinde; beğenilirse "Son hâline getir". */
  const taslakCoz = oz.cozler.length ? [...oz.cozler].sort((a, b) => kaliteSira(a) - kaliteSira(b))[0] : undefined;
  const taslakKisit = erisim.durum === "gercek" && taslakCoz ? erisim.kisit?.find((k) => k.coz === taslakCoz) : undefined;
  const taslakKullanilir = !!taslakCoz && kaliteSira(taslakCoz) < kaliteSira(coz) && (!taslakKisit || !etkinSure || taslakKisit.sureler.includes(etkinSure));
  const taslakBirim = demo || sinirsizGecerli || !taslakCoz ? 0 : videoKredi(model, { sure: etkinSure, coz: taslakCoz, ses: sesAcik });

  /** Bir üretimin bugünkü bedeli (yeniden üretim ve uzatma): kendi modelinin demo/sınırsız durumuna göre. */
  const uretimKredisi = (u: Uretim, ek: { sure?: number } = {}) => {
    const e = videoErisim(u.model);
    if (e.durum === "gercek" && saglayicilar && !saglayicilar[e.saglayici]) return 0;
    const sn = ek.sure ?? (parseInt(u.meta?.sure ?? "", 10) || undefined);
    const kimlik = sinirsizKimligi(u.model);
    const sahip = kimlik ? aktifSinirsizlar(sinirsizlar).find((x) => x.model === kimlik) : undefined;
    const teklif = kimlik ? SINIRSIZ_TEKLIFLER.find((t) => t.model === kimlik) : undefined;
    const maxSn = teklif?.maxSure ? parseInt(teklif.maxSure, 10) : undefined;
    if (sahip && (!maxSn || !sn || sn <= maxSn) && (!u.meta?.cozunurluk || kaliteSira(u.meta.cozunurluk) <= kaliteSira(sahip.kalite))) return 0;
    return videoKredi(u.model, { sure: sn, coz: u.meta?.cozunurluk, ses: !!u.meta?.ses });
  };

  /** Hareketin seçili modelde/modda kullanılamama nedeni. */
  const hareketEngel = (x: Hareket): string | null =>
    x.baslaBitir && uzatMod ? "Uzatmada iki kareli geçiş kullanılamaz"
    : x.baslaBitir && !ikiKareModel ? `${model} bitiş karesi almıyor; Kling 3.0, Seedance ya da Hailuo 02 seç`
    : null;
  /* Model ya da mod değişince seçili hareket artık kullanılamıyorsa serbest harekete dön. */
  useEffect(() => {
    const kilitli = hs.find((x) => hareketEngel(x));
    if (kilitli) { setHareket("GENEL"); toast(`${hareketAdi(kilitli.ad)} kaldırıldı`, { description: "Bu hareket seçili model ya da modla kullanılamıyor. Hareket serbest olarak ayarlandı." }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, uzatMod]);

  /* ═════════════ Kareler ═════════════ */
  const kareKoy = async (url: string, hedef: "bas" | "son") => {
    const ayar = hedef === "bas" ? setBas : setSon;
    ayar({ url, yukleniyor: url.startsWith("data:") });
    const kalici = await kareKalici(url);
    ayar((k) => (k && k.url === url ? { url: kalici } : k));
  };
  const dosyalariEkle = async (dosyalar: File[], hedef?: "bas" | "son") => {
    const gorseller = dosyalar.filter((d) => d.type.startsWith("image/"));
    if (!gorseller.length) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    setKaynakTur("kare");
    try {
      const urller = await Promise.all(gorseller.slice(0, 2).map(kareHazirla));
      if (hedef) return void kareKoy(urller[0], hedef);
      if (urller.length > 1 && ikiKareModel) { void kareKoy(urller[0], "bas"); void kareKoy(urller[1], "son"); return; }
      if (!bas || !ikiKareModel) void kareKoy(urller[0], "bas");
      else if (!son) void kareKoy(urller[0], "son");
      else void kareKoy(urller[0], "bas");
    } catch {
      toast.error("Görsel okunamadı", { description: "Dosya bozuk olabilir. Başka bir görselle dene." });
    }
  };
  const dosyaSecildi = (e: React.ChangeEvent<HTMLInputElement>, hedef: "bas" | "son") => {
    const l = [...(e.target.files ?? [])]; e.target.value = "";
    if (l.length) void dosyalariEkle(l, hedef);
  };
  const uzatDosya = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("video/")) return void mesaj.desteklenmeyenDosya("MP4, MOV ya da WebM");
    if (f.size > 200 * 1024 * 1024) return void mesaj.dosyaCokBuyuk(200);
    if (uzatKaynak?.yerel) URL.revokeObjectURL(uzatKaynak.url);
    setUzatKaynak({ url: URL.createObjectURL(f), baslik: f.name.replace(/\.[^.]+$/, ""), yerel: true });
  };
  useEffect(() => () => { if (uzatKaynak?.yerel) URL.revokeObjectURL(uzatKaynak.url); }, [uzatKaynak]);
  // Yapıştırılan görsel kareye gider (yazı kutusundayken de; metin yapıştırma etkilenmez).
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
    if (islenenParam.current === anahtar) return; // aynı adres bir kez işlenir (çift bildirim olmasın)
    islenenParam.current = anahtar;
    const p = aramaParam.get("prompt"); if (p) setPrompt(p);
    const istenen = aramaParam.get("model");
    if (istenen) {
      const ad = modelCoz(istenen);
      if (!ad) toast.error("Model bulunamadı", { description: `“${istenen}” katalogda yok. Yerine ${VARSAYILAN_MODEL} seçildi.` });
      else modeliUygula(ad);
    }
    const arac = aramaParam.get("arac") ?? aramaParam.get("sekme");
    if (arac === "motion" || arac === "hareket") toast.info("Hareket aktarımı henüz yok", { description: "Şimdilik hareket kütüphanesinden bir kamera hareketi seçebilirsin." });
    else if (arac === "edit" || arac === "duzenle") toast.info("Video düzenleme henüz yok", { description: "Şimdilik videonu uzatabilir ya da karesinden yeni video üretebilirsin." });
    if (arac === "motion" || arac === "hareket") setSekme("hareketler");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aramaParam]);
  useEffect(() => {
    const ad = bekleyenElement("video");
    if (ad) { setPrompt((p) => `${p}${p && !p.endsWith(" ") ? " " : ""}@${ad} `); toast.success(`@${ad} eklendi`, { description: "İstemine element olarak bağlandı." }); }
    const ref = sessionStorage.getItem("vayra-animate-ref");
    if (ref) { sessionStorage.removeItem("vayra-animate-ref"); void kareKoy(ref, "bas"); toast.success("Başlangıç karesi eklendi", { description: "Bir hareket seç ya da istemini yaz." }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const refIstek = useReferansKopru((s) => s.istek);
  const refTuket = useReferansKopru((s) => s.tuket);
  useEffect(() => {
    if (!refIstek) return;
    if (refIstek.url && /^(data:image|https?:|\/)/.test(refIstek.url)) { setKaynakTur("kare"); void kareKoy(refIstek.url, "bas"); toast.success("Başlangıç karesi eklendi", { description: "Bir hareket seç ya da istemini yaz." }); }
    if (refIstek.prompt) setPrompt((p) => p || refIstek.prompt!);
    refTuket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refIstek]);
  const ayarIstek = useAyarKopru((s) => s.istek);
  const ayarTuket = useAyarKopru((s) => s.tuket);
  useEffect(() => {
    if (!ayarIstek || ayarIstek.tur !== "video") return;
    if (ayarIstek.prompt) setPrompt(ayarIstek.prompt);
    if (ayarIstek.model) modeliUygula(ayarIstek.model);
    if (ayarIstek.oran) setOran(ayarIstek.oran);
    if (ayarIstek.cozunurluk) setCoz(ayarIstek.cozunurluk);
    if (ayarIstek.sure) setSure(parseInt(ayarIstek.sure, 10) || sure);
    const ilk = ayarIstek.referanslar?.[0]?.url;
    if (ilk) void kareKoy(ilk, "bas");
    ayarTuket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayarIstek]);

  /* ═════════════ Üretim ═════════════ */
  const kareYukleniyor = !!bas?.yukleniyor || !!son?.yukleniyor;
  const sonKullanilir = ikiKareModel && !uzatMod;
  const eksik: string | null =
    erisim.durum !== "gercek" ? `${model} ${erisim.durum === "kapandi" ? "kapandı" : "henüz kullanılamıyor"}; başka bir model seç`
    : kareYukleniyor ? "Kareler yükleniyor"
    : ozelCekim && cekimler.some((c) => c.istem.trim().length < 2) ? "Her çekimde ne olduğunu yaz"
    : ozelCekim && cekimToplam > cekimEnFazla ? `Çekimlerin toplamı ${cekimToplam} sn; ${model} en fazla ${cekimEnFazla} sn`
    : ozelCekim && cekimToplam < cekimEnAz ? `Çekimlerin toplamı en az ${cekimEnAz} sn olmalı`
    : uzatMod && !uzatKaynak ? "Uzatılacak videoyu seç"
    : uzatMod && prompt.trim().length < 2 ? "Videoda sonra ne olacağını yaz"
    : !uzatMod && erisim.gorselGerekli && !bas ? `${model} yalnız görselden video üretir; başlangıç karesi ekle`
    : !uzatMod && sonKullanilir && son && !bas ? "Bitiş karesiyle birlikte başlangıç karesi de gerekli"
    : !uzatMod && h?.baslaBitir && (!bas || !son) ? `${hareketAdi(h.ad)} için başlangıç ve bitiş karesi gerekli`
    : !uzatMod && h?.kareGerekli && !bas ? `${hareketAdi(h.ad)} için başlangıç karesi gerekli`
    : !uzatMod && !ozelCekim && prompt.trim().length < 2 && !bas ? "Bir istem yaz ya da başlangıç karesi ekle"
    : null;

  const uret = async (taslak = false) => {
    if (gonderiliyor) return;
    if (taslak && !taslakKullanilir) return;
    if (eksik) return void toast.error("Video üretimi başlatılamadı", { description: neden(eksik, "Eksik ayar var.") });
    const denetim = icerikDenetle([prompt, ...(ozelCekim ? cekimler.map((c) => c.istem) : [])].join("\n"));
    if (!denetim.izin) return void toast.error(`İçerik engellendi · ${kategoriEtiket(denetim.kategori)}`, { description: denetim.mesaj });
    setGonderiliyor(true);
    try {
      const istem = prompt.trim();
      const cekimMetni = ozelCekim ? cekimler.map((c, i) => `Shot ${i + 1} (${c.sn}s): ${c.istem.trim()}`).join("\n") : "";
      const hareketTalimati = hs.map((x) => x.en).join(", combined with ");
      const anaIstem = ozelCekim ? [istem, cekimMetni].filter(Boolean).join("\n") : istem || (hs.length ? `Animate the scene with ${hareketTalimati}` : "Animate the starting frame naturally");
      const hareketli = hs.length ? `${anaIstem}${/[.!?]$/.test(anaIstem) ? "" : "."} Camera and motion: ${hareketTalimati}.` : anaIstem;
      // Kaçınılacaklar: her model desteklemediği için istemin sonuna açık bir yönerge olarak eklenir.
      const modeleGiden = negatif.trim() && !negatifYerel ? `${hareketli}${/[.!?]$/.test(hareketli) ? "" : "."} Avoid: ${negatif.trim()}.` : hareketli;
      const baslik = (istem || (ozelCekim ? `${cekimler.length} çekim · ${cekimler[0].istem.trim()}` : "") || (hs.length ? `${hareketAdi(hareket)} hareketi` : "Kareden video")).slice(0, 60);
      const kalite = taslak ? taslakCoz! : coz;
      const kredi = taslak ? taslakBirim : birim;
      let uzatKare: string | undefined;
      if (uzatMod && uzatKaynak) {
        try { uzatKare = await kareKalici(await kareYakala(uzatKaynak.url, "son")); }
        catch { return void toast.error("Videonun son karesi alınamadı", { description: "Tarayıcı bu videodan kare okuyamadı. Videoyu yeniden seç ya da indirip yükle." }); }
      }
      let basarili = 0; let sonHata: ReturnType<typeof uretimBaslat> | null = null;
      for (let i = 0; i < adet; i++) {
        const s = uretimBaslat({
          baslik, tur: "video", model, prompt: modeleGiden, kredi, arac: "Video Stüdyosu", projeId: aktifProjeId ?? undefined,
          meta: {
            hamIstem: istem,
            ...(negatif.trim() ? { negatif: negatif.trim() } : {}),
            ...(tohumVar && tohum.trim() && Number.isFinite(Number(tohum)) ? { tohum: Number(tohum) } : {}),
            ...(etkinSure ? { sure: `${etkinSure}sn` } : {}),
            ...(ozelCekim ? { cekimler: cekimler.map((c) => ({ istem: c.istem.trim(), sn: c.sn })) } : {}),
            ...(oz.cozler.length ? { cozunurluk: kalite } : {}),
            ...(taslak ? { taslak: { cozunurluk: coz, ...(etkinSure ? { sure: `${etkinSure}sn` } : {}) } } : {}),
            ...(!oz.oranGizli ? { oran: uzatMod ? uzatKaynak?.oran ?? oran : oran } : {}),
            ...(hs.length ? { hareket: hs.map((x) => x.ad).join(" + ") } : {}),
            // Demo: seçili hareketin kendi klibi gösterilir (konudan alakasız rastgele klip yerine).
            ...(hs[0]?.klip ? { demoKlip: { video: klipYolu(hs[0].klip), poster: posterYolu(hs[0].klip) } } : {}),
            ...(oz.cokCekim && cokCekim ? { cokCekim: true } : {}),
            ...(sesAcik ? { ses: "Açık" } : {}),
            ...(sinirsizGecerli ? { sinirsiz: true } : {}),
            ...(uzatMod ? { gorselUrl: uzatKare, ...(uzatKaynak?.id ? { kaynakId: uzatKaynak.id } : {}) }
              : { ...(bas ? { gorselUrl: bas.url } : {}), ...(sonKullanilir && bas && son ? { bitisKareUrl: son.url } : {}) }),
          },
        });
        if (!s.ok) { sonHata = s; break; }
        basarili++;
      }
      if (!basarili) return void (sonHata && uretimHataToast(sonHata));
      if (sonHata) uretimHataToast(sonHata);
      if (!gomulu) { setSekme("akis"); setFiltre("tumu"); akisRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }
      toast.success(taslak ? (basarili > 1 ? `${basarili} taslak üretiliyor` : "Taslak üretiliyor") : basarili > 1 ? `${basarili} video üretiliyor` : uzatMod ? "Video uzatılıyor" : "Video üretiliyor", {
        description: `${model} · ${taslak ? `${kalite} taslak · ` : etkinSure ? `${etkinSure} sn · ` : ""}${demo ? "Kredi düşmez." : sinirsizGecerli ? "Sınırsız erişim, kredi düşmez." : `${kredi * basarili} kredi.`}${taslak ? ` Beğenirsen ${coz} son hâline getirebilirsin.` : ""}`,
      });
    } finally { setGonderiliyor(false); }
  };

  const hizliBasla = (x: (typeof HIZLI_BASLANGIC)[number]) => {
    modeliUygula(x.model, true);
    setKaynakTur("kare"); setHareket(x.hareket); setPrompt(x.istem);
    setTimeout(() => promptRef.current?.focus(), 50);
    toast.success(`${x.baslik} yüklendi`, { description: "İstemi düzenleyip üretebilirsin." });
  };
  const hareketSec = (x: Hareket | null) => {
    setHareket(x ? x.ad : "GENEL"); setHareketPencere(false);
    if (x?.baslaBitir) toast(`${hareketAdi(x.ad)} seçildi`, { description: "Başlangıç ve bitiş karesini ekle." });
  };
  /** Kamera hareketini karışıma ekler ya da çıkarır (en fazla üç). */
  const hareketKarisim = (x: Hareket) => {
    const l = hs.map((y) => y.ad);
    const y = l.includes(x.ad) ? l.filter((a) => a !== x.ad) : l.length < KARISIM_EN_FAZLA ? [...l, x.ad] : l;
    setHareket(y.length ? y.join(" + ") : "GENEL");
  };
  /** İstemi yardımcıyla zenginleştirir; @elementler korunur, geri alınabilir. */
  /** Yapay zekâ bağlı değilken: seçili hareket ve orana göre Türkçe sinematik ayrıntı ekler. */
  const yerelGelistir = (eski: string) => {
    const ek: string[] = [];
    const kucukMetin = eski.toLocaleLowerCase("tr");
    if (!/kamera/.test(kucukMetin)) ek.push(h ? `kamera ${hareketAdi(h.ad)} hareketiyle ${h.not.toLocaleLowerCase("tr")}` : "kamera yavaş ve akıcı biçimde ilerler");
    if (!/ışık|ışığ|aydınlat/.test(kucukMetin)) ek.push("doğal, sinematik ışık ve yumuşak gölgeler");
    if (!/detay|ayrıntı|doku/.test(kucukMetin)) ek.push("yüksek ayrıntı, gerçekçi dokular, sığ alan derinliği");
    if (!/akıcı|titre/.test(kucukMetin)) ek.push("hareketler doğal hızda ve akıcı, titreme yok");
    if (oran === "9:16") ek.push("dikey kadraj, özne ortada");
    return ek.length ? `${eski.replace(/[.\s]+$/, "")}. ${ek.map((x) => x.charAt(0).toLocaleUpperCase("tr") + x.slice(1)).join(". ")}.` : eski;
  };
  const istemiGelistir = async () => {
    const eski = prompt.trim();
    if (eski.length < 2) return void toast.error("İstem çok kısa", { description: "Önce birkaç kelime yaz. Geliştirici yazdığını zenginleştirir." });
    if (!yardimHazir) {
      const yeni = yerelGelistir(eski);
      if (yeni === eski) return void toast.info("İstem zaten ayrıntılı", { description: "Kamera, ışık ve hareket bilgisi var." });
      setPrompt(yeni.slice(0, 2500));
      return void toast.success("İstem geliştirildi", { description: "Kamera, ışık ve hareket ayrıntısı eklendi. Yapay zekâ bağlı değil; hazır kalıplar kullanıldı.", action: { label: "Geri al", onClick: () => setPrompt(eski) } });
    }
    setGelistiriliyor(true);
    try {
      const j = (await (await fetch("/api/istem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "gelistir", istem: eski }) })).json()) as { ok: boolean; istem?: string; hata?: string };
      if (!j.ok || !j.istem) throw new Error(j.hata ?? "Yanıt alınamadı");
      const etiketler = [...eski.matchAll(/@[\p{L}\p{N}_]+/gu)].map((m) => m[0]).filter((e) => !j.istem!.includes(e));
      setPrompt(`${j.istem}${etiketler.length ? ` ${etiketler.join(" ")}` : ""}`.slice(0, 2500));
      toast.success("İstem geliştirildi", { description: "Kamera, ışık ve hareket ayrıntısı eklendi.", action: { label: "Geri al", onClick: () => setPrompt(eski) } });
    } catch (e) {
      toast.error("İstem geliştirilemedi", { description: `${neden(e, "Yanıt alınamadı.")} Biraz sonra yeniden dene.` });
    } finally { setGelistiriliyor(false); }
  };
  /** Başlangıç karesini tarif edip istem önerir (kare değişmedikçe yeniden sorulmaz). */
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

  /* ── Görüntüleyici eylemleri ── */
  const videoUretimleri = useMemo(() => tumUretimler.filter((u) => u.tur === "video" && !u.id.startsWith("seed_")), [tumUretimler]);
  const gorunenler = filtre === "begenilen" ? videoUretimleri.filter((u) => u.favori) : videoUretimleri;
  const gezListe = useMemo(() => videoUretimleri.filter((u) => u.durum === "tamam"), [videoUretimleri]);
  const seciliUretim = seciliId ? tumUretimler.find((u) => u.id === seciliId) : undefined;
  const lbIndex = seciliUretim ? gezListe.findIndex((u) => u.id === seciliUretim.id) : -1;
  useEffect(() => { if (seciliId && !seciliUretim) setSeciliId(null); }, [seciliId, seciliUretim]);
  const gez = (yon: 1 | -1) => { const y = lbIndex + yon; if (lbIndex >= 0 && y >= 0 && y < gezListe.length) setSeciliId(gezListe[y].id); };
  const aktifIs = videoUretimleri.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;

  const ayarlariYukle = (u: Uretim) => {
    const m = u.meta;
    if (!modeliUygula(u.model)) return;
    setKaynakTur("kare");
    if (m?.sure) setSure(parseInt(m.sure, 10) || sure);
    if (m?.oran) setOran(m.oran);
    if (m?.cozunurluk) setCoz(m.cozunurluk);
    setPrompt(((m?.hamIstem as string | undefined) ?? "").trim());
    setNegatif(((m?.negatif as string | undefined) ?? "").trim());
    setHareket(hareketListesi(m?.hareket).map((x) => x.ad).join(" + ") || "GENEL");
    setBas(m?.gorselUrl ? { url: m.gorselUrl } : null);
    setSon(m?.bitisKareUrl ? { url: m.bitisKareUrl } : null);
    setCokCekim(!!m?.cokCekim);
    if (m?.cekimler?.length) { setCekimMod("ozel"); setCekimler(m.cekimler.map((c, i) => ({ id: `c${i}${Date.now().toString(36)}`, istem: c.istem, sn: c.sn }))); }
    setSesli(!!m?.ses);
    setSeciliId(null);
    setTimeout(() => promptRef.current?.focus(), 50);
    toast.success("Ayarlar yüklendi", { description: "İstemi düzenleyip üretebilirsin." });
  };
  const yenidenUret = (u: Uretim) => {
    const e = videoErisim(u.model);
    if (e.durum !== "gercek") return void toast.error(`${u.model} artık kullanılamıyor`, { description: `${neden(e.neden, "Bu model kapatıldı.")} Başka bir modelle yeniden üret.` });
    const kredi = uretimKredisi(u);
    const s = uretimBaslat({ baslik: u.baslik, tur: "video", model: u.model, prompt: u.prompt, kredi, arac: "Video Stüdyosu", projeId: aktifProjeId ?? undefined,
      meta: { ...u.meta, kaynakId: undefined, sinirsiz: kredi === 0 && !demoMi(u.model) ? true : undefined } });
    if (!s.ok) return uretimHataToast(s);
    setSeciliId(null); setSekme("akis");
    toast.success("Yeniden üretim başladı", { description: `${u.model} · ${kredi ? `${kredi} kredi.` : "Kredi düşmez."}` });
  };
  const demoMi = (ad: string) => { const e = videoErisim(ad); return e.durum === "gercek" && !!saglayicilar && !saglayicilar[e.saglayici]; };
  /** Görüntüleyiciden uzatma: yalnız süre/kalite/oran/ses taşınır; eski çekim listesi ve hareket taşınmaz. */
  const viewerUzat = (u: Uretim, kare: string, istem: string): boolean => {
    const e = videoErisim(u.model);
    if (e.durum !== "gercek") { toast.error(`${u.model} artık kullanılamıyor`, { description: "Bu video uzatılamaz. Videonun karesinden başka bir modelle üret." }); return false; }
    const kredi = uretimKredisi(u);
    void (async () => {
      const url = await kareKalici(kare);
      const s = uretimBaslat({
        baslik: `${(u.baslik || "Video").slice(0, 44)} · devam`, tur: "video", model: u.model, prompt: istem || u.prompt, kredi, arac: "Video Stüdyosu", projeId: aktifProjeId ?? undefined,
        meta: { hamIstem: istem, sure: u.meta?.sure, cozunurluk: u.meta?.cozunurluk, oran: u.meta?.oran, ses: u.meta?.ses, gorselUrl: url, kaynakId: u.id, ...(kredi === 0 && !demoMi(u.model) ? { sinirsiz: true } : {}) },
      });
      if (!s.ok) return uretimHataToast(s);
      setSekme("akis");
      toast.success("Video uzatılıyor", { description: `Son kareden devam ediyor · ${u.model} · ${kredi ? `${kredi} kredi.` : "Kredi düşmez."}` });
    })();
    setSeciliId(null);
    return true;
  };
  /** Taslağın istenen kalitedeki son hâli: aynı istem ve ayarlar. */
  const sonHalKredisi = (u: Uretim) => uretimKredisi({ ...u, meta: { ...u.meta, cozunurluk: u.meta?.taslak?.cozunurluk ?? u.meta?.cozunurluk } });
  const sonHalineGetir = (u: Uretim) => {
    const hedef = u.meta?.taslak; if (!hedef) return;
    const e = videoErisim(u.model);
    if (e.durum !== "gercek") return void toast.error(`${u.model} artık kullanılamıyor`, { description: `${neden(e.neden, "Bu model kapatıldı.")} Taslağı başka bir modelle yeniden üret.` });
    const kredi = sonHalKredisi(u);
    const s = uretimBaslat({
      baslik: u.baslik, tur: "video", model: u.model, prompt: u.prompt, kredi, arac: "Video Stüdyosu", projeId: aktifProjeId ?? undefined,
      meta: { ...u.meta, taslak: undefined, cozunurluk: hedef.cozunurluk, ...(hedef.sure ? { sure: hedef.sure } : {}), kaynakId: u.id, sinirsiz: kredi === 0 && !demoMi(u.model) ? true : undefined },
    });
    if (!s.ok) return uretimHataToast(s);
    setSeciliId(null); setSekme("akis");
    toast.success("Son hâli üretiliyor", { description: `${u.model} · ${hedef.cozunurluk} · ${kredi ? `${kredi} kredi.` : "Kredi düşmez."}` });
  };
  /** Karttan zincirleme: videoyu uzatma kaynağı yapar, istem kutusuna odaklanır. */
  const kartlaDevam = (u: Uretim) => {
    if (!u.videoUrl) return;
    setUzatKaynak({ url: u.videoUrl, poster: saltUrl(u.gorselUrl), baslik: u.baslik || "Video", oran: u.meta?.oran, id: u.id });
    setKaynakTur("uzat");
    if (videoErisim(u.model).durum === "gercek") modeliUygula(u.model, true);
    setTimeout(() => promptRef.current?.focus(), 50);
    toast("Video uzatma kaynağı yapıldı", { description: "Videoda sonra ne olacağını yaz ve uzat." });
  };
  const videoyuSil = (u: Uretim) => {
    if (seciliId === u.id) { const s = gezListe[lbIndex + 1] ?? gezListe[lbIndex - 1]; setSeciliId(s && s.id !== u.id ? s.id : null); }
    sil(u.id); mesaj.silindi("Video", () => uretimGeriYukle(u));
  };

  /* ── Klavye, kaydırma ── */
  useScrollKilit(elementModal || hareketPencere || !!seciliUretim || !!uretimSecici);
  useEscKapat(hareketPencere && !elementModal, () => setHareketPencere(false));
  const sonIstemler = useMemo(() => {
    const g = new Set<string>(); const l: string[] = [];
    for (const u of videoUretimleri) { const p = ((u.meta?.hamIstem as string | undefined) ?? "").trim(); if (p.length < 3 || g.has(p)) continue; g.add(p); l.push(p); if (l.length >= 5) break; }
    return l;
  }, [videoUretimleri]);

  /* ═════════════ Parçalar ═════════════ */
  const ac = (k: Exclude<Pop, null>) => setAcik((v) => (v === k ? null : k));
  const pop = (k: Exclude<Pop, null>, sinif: string, icerik: React.ReactNode, yerlesim: "ust-sol" | "ust-sag" = "ust-sol") => (
    <Yuzen acik={acik === k} onKapat={() => setAcik(null)} yerlesim={yerlesim} bosluk={12} etiket={k} className={cn("max-h-[66vh] overflow-y-auto p-3 [scrollbar-width:thin]", sinif, POP)}>{icerik}</Yuzen>
  );
  const menuSatir = (I: typeof Upload, metin: string, f: () => void, alt?: string) => (
    <button onClick={() => { setAcik(null); f(); }} className="flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left hover:bg-white/[0.05]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-metin ring-1 ring-inset ring-white/[0.08]"><I className="h-3.5 w-3.5" /></span>
      <span className="min-w-0"><span className="block text-[13px] font-medium text-metin">{metin}</span>{alt && <span className="block text-[11.5px] text-metin-3">{alt}</span>}</span>
    </button>
  );

  /** Kare yuvası: boşken menü açar, doluyken önizleme ve kaldır. */
  const YUVA = "relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[16px] sm:h-[76px] sm:w-[76px] sm:rounded-[18px]";
  const kareYuvasi = (hedef: "bas" | "son") => {
    const k = hedef === "bas" ? bas : son;
    const kilitli = hedef === "son" && !sonKullanilir;
    const etiket = hedef === "bas" ? "Başlangıç" : "Bitiş";
    return (
      <div className="relative shrink-0">
        {k ? (
          <div className={cn("group", YUVA, "ring-1 ring-inset", kilitli ? "ring-amber-300/40" : "ring-white/15")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={k.url} alt={`${etiket} karesi`} className={cn("h-full w-full object-cover", (k.yukleniyor || kilitli) && "opacity-45")} />
            {k.yukleniyor && <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />}
            {kilitli && <span className="absolute inset-0 flex items-center justify-center" title={`${model} bitiş karesi almıyor; üretimde kullanılmaz`}><Lock className="h-4 w-4 text-amber-200" /></span>}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent pb-1 pt-4 text-center text-[10px] font-semibold text-white">{etiket}</span>
            <button onClick={() => (hedef === "bas" ? setBas(null) : setSon(null))} aria-label={`${etiket} karesini kaldır`}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-white opacity-0 transition-opacity hover:bg-rose-500 focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"><X className="h-3 w-3" /></button>
          </div>
        ) : (
          <button onClick={() => (kilitli ? toast.warning(`${model} bitiş karesi almıyor`, { description: "Bitiş karesi için Kling 3.0, Kling 2.6, Seedance ya da Hailuo 02 seç." }) : ac(hedef))}
            aria-expanded={acik === hedef} aria-label={`${etiket} karesi ekle`} title={kilitli ? `${model} bitiş karesi almıyor` : undefined}
            className={cn("group flex flex-col items-center justify-center gap-1.5 text-center transition-all duration-200", YUVA,
              "bg-[linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] ring-1 ring-inset",
              kilitli ? "cursor-not-allowed opacity-45 ring-white/[0.06]" : acik === hedef ? "ring-white/30" : "ring-white/[0.09] hover:-translate-y-px hover:ring-white/25")}>
            <span className={cn("flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07] transition-colors", !kilitli && "text-metin group-hover:bg-white group-hover:text-[#0a0a0b]")}>
              {kilitli ? <Lock className="h-3.5 w-3.5 text-metin-3" /> : <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
            </span>
            <span className="text-[10.5px] font-medium leading-none text-metin-2">{etiket}</span>
          </button>
        )}
        {pop(hedef, "w-[276px] !p-1.5", (
          <>
            <p className="px-2.5 pb-1 pt-1.5 text-[12.5px] font-semibold text-metin">{etiket} karesi</p>
            {menuSatir(Upload, "Bilgisayardan yükle", () => (hedef === "bas" ? basRef : sonRef).current?.click(), "Ya da sürükle, Ctrl+V ile yapıştır")}
            {menuSatir(Images, "Üretimlerimden seç", () => setUretimSecici(hedef), "Görsel ya da videonun son karesi")}
            {menuSatir(Wand2, "Görsel üret", () => router.push("/panel/gorsel"), "Görsel stüdyosunda üret, sonra canlandır")}
            {hedef === "bas" && (
              <>
                <span className="mx-2 my-1 block h-px bg-white/[0.06]" />
                {menuSatir(FastForward, "Bir videoyu uzat", () => { setKaynakTur("uzat"); setTimeout(() => setAcik("uzat"), 30); }, "Videonun son karesinden devam et")}
              </>
            )}
          </>
        ))}
      </div>
    );
  };

  const uzatYuvasi = (
    <div className="relative shrink-0">
      {uzatKaynak ? (
        <div className="group relative h-[60px] w-[96px] overflow-hidden rounded-[16px] bg-black sm:h-[76px] sm:w-[124px] sm:rounded-[18px] ring-1 ring-inset ring-white/25">
          <video key={uzatKaynak.url} src={uzatKaynak.url} poster={uzatKaynak.poster} autoPlay muted loop playsInline preload="auto" aria-hidden className="h-full w-full object-cover" />
          <span className="pointer-events-none absolute left-1 top-1 flex items-center gap-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[9.5px] font-semibold text-white backdrop-blur"><FastForward className="h-2.5 w-2.5" />Uzatılıyor</span>
          <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent px-1.5 pb-1 pt-4 text-[10px] font-semibold text-white">{uzatKaynak.baslik}</span>
          <button onClick={() => setUzatKaynak(null)} aria-label="Videoyu değiştir" className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-white opacity-0 transition-opacity hover:bg-rose-500 focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"><X className="h-3 w-3" /></button>
        </div>
      ) : (
        <button onClick={() => ac("uzat")} aria-expanded={acik === "uzat"}
          className={cn("group relative flex h-[60px] w-[96px] sm:h-[76px] sm:w-[124px] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[18px] bg-[linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] ring-1 ring-inset transition-all", acik === "uzat" ? "ring-white/30" : "ring-white/[0.1] hover:-translate-y-px hover:ring-white/25")}>
          {(["top-1.5", "bottom-1.5"] as const).map((k) => (
            <span key={k} aria-hidden className={cn("absolute inset-x-2.5 flex justify-between", k)}>{Array.from({ length: 8 }, (_, i) => <span key={i} className="h-[3px] w-[6px] rounded-[1px] bg-white/15" />)}</span>
          ))}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-metin transition-transform group-hover:scale-110"><Film className="h-3.5 w-3.5" /></span>
          <span className="text-[10.5px] font-medium leading-none text-metin-2">Video seç</span>
        </button>
      )}
      {pop("uzat", "w-[276px] !p-1.5", (
        <>
          <p className="px-2.5 pb-1 pt-1.5 text-[12.5px] font-semibold text-metin">Uzatılacak video</p>
          {menuSatir(Images, "Üretimlerimden seç", () => setUretimSecici("uzat"), "Son karesinden devam edilir")}
          {menuSatir(Upload, "Bilgisayardan yükle", () => uzatRef.current?.click(), "MP4, MOV, WebM · en fazla 200 MB")}
        </>
      ))}
    </div>
  );

  /* ── Seçici içerikleri ── */
  // Süre: izinli değerler üzerinde kaydırıcı; az seçenekte (4 ve altı) eşit bölmeli seçici.
  const izinliSureler = oz.sureler.filter((n) => !kisit || kisit.sureler.includes(n));
  const sureSira = Math.max(0, izinliSureler.indexOf(sure));
  const surePaneli = (
    <>
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] font-semibold text-metin">Süre</p>
        <p className="text-[22px] font-semibold tabular-nums leading-none text-metin">{sure}<span className="ml-1 text-[13px] font-medium text-metin-3">sn</span></p>
      </div>
      {izinliSureler.length > 4 ? (
        <div className="mt-3">
          <input type="range" min={0} max={izinliSureler.length - 1} step={1} value={sureSira} aria-label="Süre"
            onChange={(e) => setSure(izinliSureler[Number(e.target.value)])}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.12] accent-white [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            style={{ background: `linear-gradient(to right, #fff ${(sureSira / (izinliSureler.length - 1)) * 100}%, rgba(255,255,255,0.12) 0)` }} />
          <div className="mt-2 flex justify-between text-[11.5px] tabular-nums text-metin-3"><span>{izinliSureler[0]} sn</span><span>{izinliSureler[izinliSureler.length - 1]} sn</span></div>
          <div className="mt-3 flex gap-1.5">
            {[...new Set([izinliSureler[0], 5, 10, izinliSureler[izinliSureler.length - 1]])].filter((n) => izinliSureler.includes(n)).sort((x, y) => x - y).map((n) => (
              <button key={n} onClick={() => setSure(n)} aria-pressed={sure === n}
                className={cn("h-8 flex-1 rounded-full text-[12.5px] font-semibold tabular-nums transition-colors active:scale-[0.97]", sure === n ? "bg-white text-[#0a0a0b]" : "bg-white/[0.06] text-metin-2 hover:bg-white/[0.1] hover:text-metin")}>{n} sn</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-0.5 rounded-full bg-white/[0.05] p-0.5 ring-1 ring-inset ring-white/[0.07]" style={{ gridTemplateColumns: `repeat(${izinliSureler.length}, minmax(0, 1fr))` }}>
          {izinliSureler.map((n) => (
            <button key={n} onClick={() => setSure(n)} aria-pressed={sure === n}
              className={cn("relative isolate h-8 rounded-full text-[12.5px] font-semibold tabular-nums transition-colors", sure === n ? "text-[#0a0a0b]" : "text-metin-3 hover:text-metin")}>
              {sure === n && <motion.span layoutId="video-sure" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}{n} sn
            </button>
          ))}
        </div>
      )}
      {!demo && <p className="mt-3 flex items-center gap-1 text-[12px] tabular-nums text-metin-3"><KrediYildiz className="h-3 w-3" />{videoKredi(model, { sure, coz, ses: sesAcik })} kredi</p>}
      {kisit && <p className="mt-2 text-[11.5px] text-metin-3">{coz} kalitede yalnız {kisit.sureler.join(", ")} sn seçilebilir.</p>}
    </>
  );
  const oranPaneli = (
    <>
      {!oz.oranGizli && oz.oranlar.length > 0 && (
        <>
          <p className="mb-2.5 text-[13px] font-semibold text-metin">Oran</p>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(oz.oranlar.length, 4)}, minmax(0, 1fr))` }}>
            {oz.oranlar.map((o) => {
              const sec = oran === o;
              const ad = ORAN_AD[o]?.[0] ?? o;
              return (
                <button key={o} onClick={() => setOran(o)} aria-pressed={sec}
                  className={cn("flex h-[96px] flex-col items-center justify-center gap-2 rounded-[14px] transition-[background-color,transform] active:scale-[0.97]",
                    sec ? "bg-white text-[#0a0a0b]" : "bg-white/[0.04] text-metin-2 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.08] hover:text-metin")}>
                  <span className="flex h-8 items-center justify-center">{o === "Auto" ? <Sparkles className="h-6 w-6" /> : <OranSekli oran={o} boyut={26} />}</span>
                  <span className="text-center leading-tight">
                    <span className="block text-[13px] font-semibold tabular-nums">{o === "Auto" ? "Oto" : o}</span>
                    <span className={cn("block text-[11px]", sec ? "text-black/55" : "text-metin-3")}>{ad}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {ORAN_AD[oran] && <p className="mt-2 text-[12px] text-metin-3">{ORAN_AD[oran][1]}</p>}
        </>
      )}
      {oz.cozler.length > 0 && (
        <>
          <p className={cn("mb-2.5 text-[13px] font-semibold text-metin", !oz.oranGizli && oz.oranlar.length > 0 && "mt-4 border-t border-white/[0.07] pt-4")}>Kalite</p>
          <div className="grid gap-0.5 rounded-full bg-white/[0.05] p-0.5 ring-1 ring-inset ring-white/[0.07]" style={{ gridTemplateColumns: `repeat(${oz.cozler.length}, minmax(0, 1fr))` }}>
            {oz.cozler.map((c) => (
              <button key={c} onClick={() => setCoz(c)} aria-pressed={coz === c}
                className={cn("relative isolate h-9 rounded-full text-[13px] font-semibold tabular-nums transition-colors", coz === c ? "text-[#0a0a0b]" : "text-metin-3 hover:text-metin")}>
                {coz === c && <motion.span layoutId="video-kalite" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}{c}
              </button>
            ))}
          </div>
          <p className="mt-2 flex items-center justify-between gap-2 text-[12px] text-metin-3">
            <span>{KALITE_NOT[coz] ?? ""}</span>
            {!demo && <span className="flex items-center gap-1 tabular-nums"><KrediYildiz className="h-3 w-3" />{videoKredi(model, { sure: etkinSure, coz, ses: sesAcik })}</span>}
          </p>
        </>
      )}
    </>
  );
  const cekimPaneli = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-[13.5px] font-semibold text-metin">Çok çekimli</p><p className="text-[11.5px] text-metin-3">Tek videoda birden fazla plan</p></div>
        <button onClick={() => setCokCekim((v) => !v)} role="switch" aria-checked={cokCekim} aria-label="Çok çekimli"
          className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", cokCekim ? "bg-white" : "bg-white/20")}>
          <span className={cn("absolute top-[3px] h-4 w-4 rounded-full transition-[left] duration-200", cokCekim ? "left-[19px] bg-[#0a0a0b]" : "left-[3px] bg-white")} />
        </button>
      </div>
      {cokCekim && (
        <>
          <div className="mt-3 flex gap-0.5 rounded-[12px] bg-white/[0.04] p-0.5 ring-1 ring-inset ring-white/[0.06]">
            {([["oto", "Otomatik", "Model böler"], ["ozel", "Özel", "Çekim çekim yaz"]] as const).map(([v, a, n]) => (
              <button key={v} onClick={() => setCekimMod(v)} aria-pressed={cekimMod === v} className={cn("flex-1 rounded-[10px] py-1.5 text-center transition-colors", cekimMod === v ? "bg-white/[0.1]" : "hover:bg-white/[0.04]")}>
                <span className={cn("block text-[12.5px] font-medium", cekimMod === v ? "text-metin" : "text-metin-2")}>{a}</span><span className="block text-[10.5px] text-metin-3">{n}</span>
              </button>
            ))}
          </div>
          {cekimMod === "ozel" && (
            <div className="mt-3 space-y-2">
              {cekimler.map((c, i) => (
                <div key={c.id} className="rounded-[12px] bg-white/[0.03] p-2 ring-1 ring-inset ring-white/[0.06]">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[11px] font-semibold tabular-nums text-metin-3">Çekim {i + 1}</span>
                    <span className="ml-auto flex items-center gap-1">
                      <button onClick={() => setCekimler((l) => l.map((x) => (x.id === c.id ? { ...x, sn: Math.max(1, x.sn - 1) } : x)))} aria-label="Süreyi azalt" className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-metin-2 hover:text-metin"><Minus className="h-3 w-3" /></button>
                      <span className="w-9 text-center text-[12px] font-semibold tabular-nums text-metin">{c.sn} sn</span>
                      <button onClick={() => setCekimler((l) => l.map((x) => (x.id === c.id ? { ...x, sn: x.sn + 1 } : x)))} aria-label="Süreyi artır" className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-metin-2 hover:text-metin"><Plus className="h-3 w-3" /></button>
                      {cekimler.length > 2 && <button onClick={() => setCekimler((l) => l.filter((x) => x.id !== c.id))} aria-label={`Çekim ${i + 1} sil`} className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-metin-3 hover:text-rose-300"><X className="h-3.5 w-3.5" /></button>}
                    </span>
                  </div>
                  <textarea value={c.istem} onChange={(e) => setCekimler((l) => l.map((x) => (x.id === c.id ? { ...x, istem: e.target.value.slice(0, 400) } : x)))} rows={2} aria-label={`Çekim ${i + 1}`}
                    placeholder={i === 0 ? "İlk planda ne oluyor?" : "Sonra?"} className="block w-full resize-none bg-transparent text-[12.5px] leading-snug text-metin outline-none placeholder:text-metin-3" />
                </div>
              ))}
              <div className="flex items-center justify-between">
                <button onClick={() => cekimler.length < 6 && setCekimler((l) => [...l, { id: `c${Date.now().toString(36)}`, istem: "", sn: 3 }])} disabled={cekimler.length >= 6}
                  className="flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] text-metin-2 hover:bg-white/[0.05] hover:text-metin disabled:opacity-40"><Plus className="h-3.5 w-3.5" />Çekim ekle</button>
                <span className={cn("text-[11.5px] tabular-nums", cekimToplam > cekimEnFazla || cekimToplam < cekimEnAz ? "text-amber-200" : "text-metin-3")}>Toplam {cekimToplam} / {cekimEnFazla} sn</span>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
  const oneriPaneli = (
    <>
      <p className="flex items-center gap-1.5 px-1.5 pb-1.5 text-[12.5px] font-semibold text-metin"><ScanEye className="h-3.5 w-3.5 text-metin-2" />Kareden istem önerileri</p>
      {oneriYukleniyor ? (
        <div className="space-y-1.5 p-1">{[0, 1, 2].map((i) => <span key={i} className="block h-12 animate-pulse rounded-[10px] bg-white/[0.05]" />)}</div>
      ) : oneriler?.liste.map((o) => (
        <button key={o} onClick={() => { setPrompt(o); setAcik(null); setTimeout(() => promptRef.current?.focus(), 30); }}
          className="block w-full rounded-[10px] px-2 py-2 text-left text-[12.5px] leading-snug text-metin-2 hover:bg-white/[0.05] hover:text-metin">{o}</button>
      ))}
      <p className="px-1.5 pt-1 text-[11px] text-metin-3">Birine tıkla, istem kutusuna yazılır; düzenleyebilirsin.</p>
    </>
  );
  const istemPaneli = (
    <>
      {sonIstemler.length > 0 && (
        <>
          <p className="px-1.5 pb-1 text-[12px] font-medium text-metin-3">Son istemlerin</p>
          {sonIstemler.map((p) => (
            <button key={p} onClick={() => { setPrompt(p); setAcik(null); }} className="block w-full truncate rounded-[10px] px-2 py-1.5 text-left text-[12.5px] text-metin-2 hover:bg-white/[0.05] hover:text-metin">{p}</button>
          ))}
        </>
      )}
      <p className={cn("px-1.5 pb-1 text-[12px] font-medium text-metin-3", sonIstemler.length > 0 && "mt-2")}>Hızlı başlangıç</p>
      {HIZLI_BASLANGIC.map((x) => (
        <button key={x.baslik} onClick={() => { hizliBasla(x); setAcik(null); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left hover:bg-white/[0.05]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={posterYolu(hareketBul(x.hareket)!.klip)} alt="" className="h-8 w-8 shrink-0 rounded-[8px] object-cover" />
          <span className="min-w-0"><span className="block text-[12.5px] font-medium text-metin">{x.baslik}</span><span className="block truncate text-[11.5px] text-metin-3">{x.istem}</span></span>
        </button>
      ))}
    </>
  );


  const negatifPaneli = (
    <>
      <p className="px-1 pb-1 text-[13px] font-semibold text-metin">Kaçınılacaklar</p>
      <p className="px-1 pb-2 text-[12px] leading-snug text-metin-3">Videoda görmek istemediklerin. Modele “bunlardan kaçın” yönergesi olarak gider.</p>
      <input autoFocus value={negatif} onChange={(e) => setNegatif(e.target.value.slice(0, 300))} placeholder="ör. yazı, filigran, bulanık yüz, fazla parmak"
        className="h-10 w-full rounded-[12px] bg-white/[0.05] px-3 text-[13px] text-metin outline-none ring-1 ring-inset ring-white/[0.1] placeholder:text-metin-3 focus:ring-white/25" />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["yazı ve filigran", "bulanık yüz", "titreyen kamera", "bozuk eller"].map((t) => (
          <button key={t} onClick={() => setNegatif((v) => (v.includes(t) ? v : v.trim() ? `${v.trim()}, ${t}` : t))} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-metin-2 transition-colors hover:bg-white/[0.1] hover:text-metin">+ {t}</button>
        ))}
      </div>
      {negatif && <button onClick={() => setNegatif("")} className="mt-2 px-1 text-[12px] text-metin-3 hover:text-metin">Temizle</button>}
    </>
  );
  const tohumPaneli = (
    <>
      <p className="px-1 pb-1 text-[13px] font-semibold text-metin">Tohum</p>
      <p className="px-1 pb-2 text-[12px] leading-snug text-metin-3">Aynı tohum ve aynı istemle {model} benzer bir video üretir. Boş bırakırsan her üretim farklı olur.</p>
      <div className="flex gap-1.5">
        <input autoFocus inputMode="numeric" value={tohum} onChange={(e) => setTohum(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Rastgele"
          className="h-10 min-w-0 flex-1 rounded-[12px] bg-white/[0.05] px-3 text-[13px] tabular-nums text-metin outline-none ring-1 ring-inset ring-white/[0.1] placeholder:text-metin-3 focus:ring-white/25" />
        <button onClick={() => setTohum(String(Math.floor(Math.random() * 2_000_000_000)))} className="flex h-10 shrink-0 items-center gap-1.5 rounded-[12px] bg-white/[0.06] px-3 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.1] hover:text-metin"><Dices className="h-4 w-4" />Zar at</button>
      </div>
      {tohum && <button onClick={() => setTohum("")} className="mt-2 px-1 text-[12px] text-metin-3 hover:text-metin">Rastgeleye dön</button>}
    </>
  );
  /* ═════════════ Komut kutusu ═════════════ */
  const hKlip = h?.klip;
  const hazir = !eksik && !gonderiliyor;
  /** Ayar şeridinin bölmesi: küçük etiket + değer; açıkken vurgulu. */
  const SEG = "group/seg flex h-12 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full bg-white/[0.07] pl-1.5 pr-3.5 text-left transition-[background-color,transform] duration-200 hover:bg-white/[0.11] active:scale-[0.97]";
  /** Çipin solundaki yuvarlak simge alanı. */
  const daire = (icerik: React.ReactNode, dolu?: boolean) => <span className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full", dolu ? "" : "bg-white/[0.08] text-metin-2")}>{icerik}</span>;
  const segMetin = (etiket: string, deger: React.ReactNode, vurgu?: boolean) => (
    <span className="flex flex-col items-start leading-none">
      <span className="text-[11px] text-white/55">{etiket}</span>
      <span className={cn("mt-1 text-[13px] font-medium tabular-nums text-metin", vurgu && "font-semibold")}>{deger}</span>
    </span>
  );
  const ayrac = null;
  const aracBtn = (I: typeof Upload, etiket: string, f: () => void, o: { acikMi?: boolean; yukleniyor?: boolean } = {}) => (
    <Tooltip label={etiket} side="top">
      <button onClick={f} aria-label={etiket} aria-expanded={o.acikMi}
        className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", o.acikMi ? "bg-white/[0.1] text-metin" : "text-metin-2 hover:bg-white/[0.07] hover:text-metin")}>
        {o.yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <I className="h-4 w-4" strokeWidth={1.9} />}
      </button>
    </Tooltip>
  );
  const kredi = (n: number) => (demo ? "Ücretsiz" : n === 0 ? "Sınırsız" : <><KrediYildiz className="h-3 w-3" />{n}</>);

  const ayarSeridi = (
    <div className="flex items-center gap-1.5">
      {/* Model */}
      <div className="relative">
        <button onClick={() => ac("model")} aria-expanded={acik === "model"} className={cn(SEG, acik === "model" && "bg-white/[0.13]")}>
          {daire(<span className="[&>span]:!h-9 [&>span]:!w-9 [&>span]:!rounded-full"><MarkaKare ad={model} boyut={36} /></span>, true)}
          {segMetin("Model", <span className="flex items-center gap-1">{model}<ChevronDown className={cn("h-3 w-3 text-metin-3 transition-transform", acik === "model" && "rotate-180")} /></span>)}
        </button>
        {pop("model", "w-[min(440px,calc(100vw-24px))] !p-2", <ModelSecici model={model} saglayicilar={saglayicilar} favoriler={favModeller} onFavori={favDegistir} onSec={(ad) => { if (modeliUygula(ad)) setAcik(null); }} />)}
      </div>
      {ayrac}
      {/* Hareket */}
      <button onClick={() => setHareketPencere(true)} className={SEG}>
        <span className={cn("relative h-9 w-9 shrink-0 overflow-hidden rounded-full", h ? "ring-1 ring-inset ring-white/25" : "bg-white/[0.08]")}>
          {hKlip
            // eslint-disable-next-line @next/next/no-img-element
            ? <video key={hKlip} src={klipYolu(hKlip)} poster={posterYolu(hKlip)} autoPlay muted loop playsInline preload="metadata" aria-hidden className="h-full w-full object-cover" />
            : <span className="flex h-full w-full items-center justify-center text-metin-2"><Sparkles className="h-3.5 w-3.5" /></span>}
          {hs.length > 1 && <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[11px] font-bold text-white">+{hs.length - 1}</span>}
        </span>
        {segMetin("Hareket", <span className="block max-w-[120px] truncate">{h ? hareketAdi(h.ad) : "Serbest"}</span>, !!h)}
      </button>
      {/* Süre */}
      {!oz.sureGizli && !ozelCekim && (
        <>
          {ayrac}
          <div className="relative">
            <button onClick={() => ac("sure")} aria-expanded={acik === "sure"} className={cn(SEG, acik === "sure" && "bg-white/[0.13]")}>
              {daire(<Clock className="h-4 w-4" strokeWidth={1.9} />)}{segMetin("Süre", `${sure} sn`)}
            </button>
            {pop("sure", "w-[280px] !p-4", surePaneli)}
          </div>
        </>
      )}
      {/* Oran + kalite */}
      {(oz.cozler.length > 0 || (!oz.oranGizli && oz.oranlar.length > 0)) && (
        <>
          {ayrac}
          <div className="relative">
            <button onClick={() => ac("oran")} aria-expanded={acik === "oran"} className={cn(SEG, acik === "oran" && "bg-white/[0.13]")}>
              {daire(oz.oranGizli || oran === "Auto" ? <Sparkles className="h-4 w-4" /> : <OranSekli oran={uzatMod && uzatKaynak?.oran ? uzatKaynak.oran : oran} boyut={16} className="text-metin" />)}
              {segMetin(oz.oranGizli ? "Kalite" : "Oran · kalite", <>{!oz.oranGizli && <>{uzatMod && uzatKaynak?.oran ? uzatKaynak.oran : oran === "Auto" ? "Oto" : oran}<span className="mx-1 text-metin-3">·</span></>}{coz}</>)}
            </button>
            {pop("oran", "w-[320px] !p-4", oranPaneli)}
          </div>
        </>
      )}
      {/* Ses */}
      {oz.sesToggle && (
        <>
          {ayrac}
          <button onClick={() => setSesli((v) => !v)} role="switch" aria-checked={sesli} title={sesli ? "Ses açık · kredi %25 artar" : "Sesi aç"} className={SEG}>
            {daire(sesli ? <Volume2 className="h-4 w-4 text-metin" strokeWidth={1.9} /> : <VolumeX className="h-4 w-4" strokeWidth={1.9} />)}{segMetin("Ses", sesli ? "Açık" : "Kapalı", sesli)}
          </button>
        </>
      )}
      {/* Çok çekim */}
      {oz.cokCekim && !uzatMod && (
        <>
          {ayrac}
          <div className="relative">
            <button onClick={() => ac("cekim")} aria-expanded={acik === "cekim"} className={cn(SEG, acik === "cekim" && "bg-white/[0.13]")}>
              {daire(<Layers className={cn("h-4 w-4", cokCekim && "text-metin")} strokeWidth={1.9} />)}{segMetin("Çekim", cokCekim ? (cekimMod === "ozel" ? `${cekimler.length} çekim` : "Çok · oto") : "Tek plan", cokCekim)}
            </button>
            {pop("cekim", "w-[min(340px,calc(100vw-24px))]", cekimPaneli)}
          </div>
        </>
      )}
      {/* Sınırsız */}
      {sinirsizErisim && (
        <>
          {ayrac}
          <button onClick={() => setSinirsizMod((v) => !v)} role="switch" aria-checked={sinirsizGecerli} title={sinirsizEngel ?? "Bu modelde kredi harcamadan üret"} className={SEG}>
            {daire(<Sonsuz className={cn("h-4 w-4", sinirsizGecerli && "text-emerald-300")} />)}{segMetin("Sınırsız", sinirsizGecerli ? "Açık" : "Kapalı")}
          </button>
        </>
      )}
    </div>
  );

  /** Adet + Üret tek bölünmüş düğme; hazır değilken nötr, hazırken parlak camgöbeği. */
  const uretDugmesi = (genis?: boolean) => (
    <div className={cn("flex h-12 shrink-0 items-center rounded-[14px] p-1 transition-[background-color] duration-300", genis && "w-full",
      hazir ? "bg-white" : "bg-white/[0.07] ring-1 ring-inset ring-white/[0.08]")}>
      <div className="relative">
        <button onClick={() => ac("adet")} aria-expanded={acik === "adet"} aria-label={`Video sayısı: ${adet}`} title="Aynı ayarla kaç video"
          className={cn("flex h-10 items-center gap-0.5 rounded-[11px] pl-3 pr-2 text-[13px] font-bold tabular-nums transition-colors", hazir ? "text-[#0a0a0b] hover:bg-black/[0.06]" : "text-metin-2 hover:bg-white/[0.06]")}>
          {adet}×<ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", acik === "adet" && "rotate-180")} />
        </button>
        {pop("adet", "w-[220px] !p-1.5", (
          <>
            <p className="px-2 pb-1 pt-1 text-[12.5px] font-semibold text-metin">Kaç video?</p>
            {[1, 2, 3, 4].map((n) => (
              <button key={n} onClick={() => { setAdet(n); setAcik(null); }} aria-pressed={adet === n} className={cn("flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-left transition-colors", adet === n ? "bg-white/[0.07]" : "hover:bg-white/[0.04]")}>
                <span className="flex-1 text-[13px] font-medium text-metin">{n} video</span>
                {!demo && <span className="text-[11.5px] tabular-nums text-metin-3">{birim === 0 ? "Sınırsız" : `${birim * n} kredi`}</span>}
                {adet === n && <Check className="h-4 w-4 text-metin" />}
              </button>
            ))}
            <p className="px-2 pb-1 pt-1 text-[11px] leading-snug text-metin-3">Aynı istemle farklı varyasyonlar; en iyisini seç.</p>
          </>
        ), "ust-sag")}
      </div>
      <span aria-hidden className={cn("h-5 w-px", hazir ? "bg-black/15" : "bg-white/10")} />
      <button onClick={() => void uret()} disabled={gonderiliyor} title={eksik ?? "Ctrl+Enter"}
        className={cn("flex h-10 min-w-0 items-center justify-center gap-2 rounded-[11px] pl-3 pr-1 text-[14.5px] font-semibold transition-[background-color,transform] active:scale-[0.98]", genis && "flex-1", hazir ? "text-[#0a0a0b] hover:bg-black/[0.04]" : "text-metin-3")}>
        {gonderiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : uzatMod ? <FastForward className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        <span className="truncate">{uzatMod ? "Uzat" : "Üret"}</span>
        <span className={cn("flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-semibold tabular-nums", hazir ? "bg-black/[0.08]" : "bg-white/[0.06] text-metin-3")}>{kredi(toplam)}</span>
      </button>
    </div>
  );

  /** İstem araçları: tek yerde çizilir (gizli bir kopyaya bağlı menü sol üstte açılmasın). */
  const aracSatiri = (
    <>
      {aracBtn(AtSign, "Element ekle · karakter, ürün, mekân", () => setElementModal(true))}
          <div className="relative">
            {aracBtn(Lightbulb, "İstem fikirleri", () => ac("istem"), { acikMi: acik === "istem" })}
            {pop("istem", "w-[min(340px,calc(100vw-24px))] !p-2", istemPaneli, "ust-sag")}
          </div>
          <div className="relative">
            {aracBtn(Ban, negatif ? `Kaçınılacaklar: ${negatif}` : "Kaçınılacaklar", () => ac("negatif"), { acikMi: acik === "negatif" || !!negatif })}
            {pop("negatif", "w-[min(340px,calc(100vw-24px))]", negatifPaneli, "ust-sag")}
          </div>
          {tohumVar && (
            <div className="relative">
              {aracBtn(Dices, tohum ? `Tohum: ${tohum}` : "Tohum", () => ac("tohum"), { acikMi: acik === "tohum" || !!tohum })}
              {pop("tohum", "w-[min(320px,calc(100vw-24px))]", tohumPaneli, "ust-sag")}
            </div>
          )}
          {aracBtn(Feather, "İstemi geliştir", () => void istemiGelistir(), { yukleniyor: gelistiriliyor })}
          {yardimHazir && bas && !uzatMod && (
            <div className="relative">
              {aracBtn(ScanEye, "Kareden istem öner", () => void karedenOner(), { acikMi: acik === "oneri" })}
              {pop("oneri", "w-[min(380px,calc(100vw-24px))] !p-2", oneriPaneli, "ust-sag")}
            </div>
          )}
    </>
  );

  const komut = (
    <div className={cn("cam-istemci relative w-full rounded-[26px] bg-[rgba(34,35,40,0.8)] p-3 ring-1 ring-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[14px] backdrop-saturate-[1.25] transition-[box-shadow] duration-300 focus-within:ring-white/[0.18]",
      surukle && "ring-2 ring-white/60")}>
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 items-center gap-1.5">
          {uzatMod ? uzatYuvasi : (
            <>
              {kareYuvasi("bas")}
              {(sonKullanilir || son) && (
                <>
                  {bas && son && sonKullanilir && (
                    <button onClick={() => { const b = bas; setBas(son); setSon(b); }} aria-label="Kareleri yer değiştir" title="Yer değiştir"
                      className="flex h-6 w-6 items-center justify-center rounded-full text-metin-3 hover:bg-white/[0.06] hover:text-metin"><ArrowLeftRight className="h-3.5 w-3.5" /></button>
                  )}
                  {kareYuvasi("son")}
                </>
              )}
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {uzatMod && (
            <div className="mb-1 flex items-center gap-2 text-[12px]">
              <span className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2 py-0.5 font-semibold text-metin"><FastForward className="h-3.5 w-3.5" />Uzatma</span>
              <span className="truncate text-metin-3">{uzatKaynak ? `“${uzatKaynak.baslik}” son karesinden devam eder` : "Soldan uzatılacak videoyu seç"}</span>
              <button onClick={() => { setKaynakTur("kare"); setUzatKaynak(null); }} className="ml-auto shrink-0 rounded-full px-2 py-0.5 font-medium text-metin-3 transition-colors hover:bg-white/[0.06] hover:text-metin">Vazgeç</button>
            </div>
          )}
          <ElementMentionInput deger={prompt} onDeger={(v) => setPrompt(v.slice(0, 2500))} cokSatir otoBuyu enBuyuk={masaustu ? 150 : 110} inputRef={promptRef} seciciYukari
            onEnter={() => void uret()}
            placeholder={uzatMod ? "Videoda sonra ne oluyor? · ör. kamera yavaşça geri çekilir, kız yürümeye devam eder" : masaustu ? "Sahneni anlat · ör. gün batımında sahilde koşan bir at, rüzgârda savrulan yele" : "Sahneni anlat…"}
            className={cn("w-full bg-transparent pt-1 text-[15px] leading-relaxed text-metin placeholder:text-metin-3/80 sm:text-[15.5px]", uzatMod ? "min-h-[40px] sm:min-h-[48px]" : "min-h-[40px] sm:min-h-[68px]")} />
          {prompt.length > 2000 && <p className="text-right text-[11px] tabular-nums text-amber-200/80">{prompt.length}/2500</p>}
          {!masaustu && <div className="mt-1 flex w-fit items-center rounded-full bg-white/[0.035] p-0.5 ring-1 ring-inset ring-white/[0.07]">{aracSatiri}</div>}
        </div>
        {masaustu && <div className="flex shrink-0 items-center rounded-full bg-white/[0.035] p-0.5 ring-1 ring-inset ring-white/[0.07]">{aracSatiri}</div>}
      </div>

      <div className="@container mt-3"><div className="flex flex-wrap items-center justify-end gap-2">
        <div className="gizli-scroll min-w-0 flex-1 overflow-x-auto max-sm:-mx-3 max-sm:px-3 sm:[mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] sm:pr-5 @max-[960px]:sm:basis-full">
          <div className="w-max">{ayarSeridi}</div>
        </div>
        {masaustu && uretDugmesi()}
      </div></div>
      {!masaustu && (
        <div className="mt-2.5 flex gap-2">
          <div className="min-w-0 flex-1">{uretDugmesi(true)}</div>
        </div>
      )}
      {(() => {
        const not = eksik && (prompt.trim() || bas || uzatKaynak || eksik.includes("kapandı")) ? eksik
          : sinirsizMod && sinirsizEngel ? `${sinirsizEngel}; bu istekte kredi düşer.`
          : !demo && krediler < toplam ? `Kredin yetersiz: ${toplam} gerekli, ${krediler} var.`
          : null;
        return not && (
          <p className="mx-auto mt-2.5 flex w-fit max-w-full items-start gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[12px] leading-snug text-metin-2">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />{not}
          </p>
        );
      })()}
    </div>
  );

  /* ═════════════ Tuval ═════════════ */
  const izgaraSutun = yogunluk === "rahat" ? "columns-1 sm:columns-2 xl:columns-3" : "columns-2 md:columns-3 xl:columns-4 2xl:columns-5";
  const gruplar = useMemo(() => {
    const l: { etiket: string; oge: Uretim[] }[] = [];
    for (const u of gorunenler) { const e = gunEtiketi(u.olusturma); const s = l[l.length - 1]; if (s && s.etiket === e) s.oge.push(u); else l.push({ etiket: e, oge: [u] }); }
    return l;
  }, [gorunenler]);
  const secimModu = secililer.length > 0;

  const adimHap = (n: number, I: typeof Upload, metin: string) => (
    <span className="flex h-9 items-center gap-2 rounded-full bg-white/[0.04] pl-1 pr-3.5 text-[12.5px] text-metin-2 ring-1 ring-inset ring-white/[0.07] max-md:hidden">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-[11.5px] font-semibold tabular-nums text-metin">{n}</span><I className="h-3.5 w-3.5 text-metin-3" />{metin}
    </span>
  );
  const bos = (
    <div className="mx-auto max-w-[1240px] space-y-4 px-6 pt-2">
      <section className={KART}>
        <div className={SERIT}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] text-metin ring-1 ring-inset ring-white/[0.08]"><Wand2 className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1"><h2 className="text-[14px] font-semibold text-metin">Hızlı başlangıç</h2><p className="text-[12.5px] text-metin-3">Bir kart seç; model, hareket ve istem komut kutusuna hazır gelir.</p></div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 p-3 md:grid-cols-3 xl:grid-cols-6">
          {HIZLI_BASLANGIC.map((x) => {
            const hh = hareketBul(x.hareket)!;
            return (
              <button key={x.baslik} onClick={() => hizliBasla(x)} className="group block text-left transition-transform active:scale-[0.98]">
                <span className="relative block aspect-[4/5] overflow-hidden rounded-[16px] bg-[#111113] ring-1 ring-inset ring-white/[0.08] transition-shadow group-hover:ring-white/25">
                  <KlipKart klip={hh.klip} className="transition-transform duration-700 group-hover:scale-[1.04]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
                  <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/55 py-0.5 pl-0.5 pr-2 text-[10.5px] font-medium text-white backdrop-blur-md"><span className="[&>span]:!h-4 [&>span]:!w-4 [&>span]:!rounded-full"><MarkaKare ad={x.model} boyut={16} /></span>{x.model}</span>
                  <span className="absolute inset-x-3 bottom-3">
                    <span className="block text-[11px] font-medium text-white/60">{x.etiket} · {hareketAdi(x.hareket)}</span>
                    <span className="block text-[14.5px] font-semibold text-white">{x.baslik}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-3 py-3">
          {adimHap(1, PenLine, "Sahneni yaz")}
          {adimHap(2, ImagePlus, "İstersen başlangıç karesi ekle")}
          {adimHap(3, Sparkles, "Model ve hareketi seç, üret")}
          <button onClick={() => basRef.current?.click()} className="ml-auto flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.1] hover:text-metin max-md:ml-0 max-md:w-full max-md:justify-center"><ImagePlus className="h-3.5 w-3.5" />Görseli canlandır</button>
        </div>
      </section>

      <section className={KART}>
        <div className={SERIT}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] text-metin ring-1 ring-inset ring-white/[0.08]"><Move3d className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1"><h2 className="text-[14px] font-semibold text-metin">Kamera hareketleri</h2><p className="text-[12.5px] text-metin-3">Üzerine gel, oynasın; seç, istemine eklensin.</p></div>
          <button onClick={() => setSekme("hareketler")} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[12.5px] font-medium text-metin transition-colors hover:bg-white/[0.1] active:scale-[0.97]">Tümünü gör<span className="tabular-nums text-metin-3">{HAREKETLER.length}</span></button>
        </div>
        <div className="grid grid-cols-2 gap-2.5 p-3 md:grid-cols-4 xl:grid-cols-6">
          {HAREKETLER.filter((x) => x.rozet).slice(0, 6).map((x) => (
            <button key={x.ad} onClick={() => !hareketEngel(x) && hareketSec(x)} aria-pressed={hs.some((y) => y.ad === x.ad)} className="group block text-left transition-transform active:scale-[0.98]">
              <span className={cn("relative block aspect-[4/5] overflow-hidden rounded-[16px] bg-[#111113] transition-shadow", hs.some((y) => y.ad === x.ad) ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-inset ring-white/[0.08] group-hover:ring-white/25")}>
                <KlipKart klip={x.klip} className="transition-transform duration-700 group-hover:scale-[1.04]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
                {hs.some((y) => y.ad === x.ad) && <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0a0a0b]"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>}
                <span className="absolute inset-x-3 bottom-3"><span className="block truncate text-[14.5px] font-semibold text-white">{hareketAdi(x.ad)}</span><span className="block truncate text-[12px] text-white/65">{x.not}</span></span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  const akis = (
    <div className="mx-auto max-w-[1440px] px-6 pt-2">
      {gruplar.map((g) => {
        const tamamlar = g.oge.filter((u) => u.durum === "tamam");
        const hepsi = tamamlar.length > 0 && tamamlar.every((u) => secililer.includes(u.id));
        return (
          <section key={g.etiket} className="mb-8">
            <div className="mb-3.5 flex items-center gap-3">
              <p className="shrink-0 text-[14px] font-semibold text-metin">{g.etiket}</p>
              <span className="shrink-0 rounded-full bg-white/[0.05] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-3 ring-1 ring-inset ring-white/[0.06]">{g.oge.length} video</span>
              <span className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
              {tamamlar.length > 1 && (
                <button onClick={() => tamamlar.forEach((u) => { if (hepsi === secililer.includes(u.id)) secimToggle(u.id); })} className="flex h-8 shrink-0 items-center rounded-full bg-white/[0.05] px-3 text-[12.5px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.1] hover:text-metin active:scale-95">{hepsi ? "Seçimi kaldır" : "Tümünü seç"}</button>
              )}
            </div>
            <div className={cn("gap-3", izgaraSutun)}>
              <AnimatePresence initial={false}>
                {g.oge.map((u) => (
                  <motion.div key={u.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25 }} className="mb-3 break-inside-avoid">
                    <VideoKart u={u} secili={secililer.includes(u.id)} secimModu={secimModu}
                      onAc={() => setSeciliId(u.id)} onSecim={() => secimToggle(u.id)} onBegen={() => { favoriToggle(u.id); toast.success(u.favori ? "Beğenilerden çıkarıldı" : "Beğenilere eklendi"); }} onIndir={() => uretimIndir(u)} onAyar={() => ayarlariYukle(u)}
                      onBuyut={u.gercek !== false && buyutAdresi(u) ? () => router.push(buyutAdresi(u)!) : undefined}
                      onDevam={u.gercek !== false && u.videoUrl ? () => kartlaDevam(u) : undefined}
                      onSonHal={u.meta?.taslak ? () => sonHalineGetir(u) : undefined}
                      sonHalKredi={u.meta?.taslak ? (demoMi(u.model) ? "Ücretsiz" : sonHalKredisi(u) ? `${sonHalKredisi(u)} kredi` : "Sınırsız") : undefined}
                      onYenidenDene={() => yenidenUret(u)} onSil={() => videoyuSil(u)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        );
      })}
      {!gorunenler.length && (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <Heart className="h-6 w-6 text-metin-3" />
          <p className="text-[14px] font-semibold text-metin">Beğendiğin video yok</p>
          <p className="text-[12.5px] text-metin-3">Bir videonun kalbine basınca burada toplanır.</p>
        </div>
      )}
    </div>
  );

  const hareketlerSayfa = (
    <div className="mx-auto max-w-[1440px] px-6 pt-2">
      <HareketGalerisi secili={hs.map((x) => x.ad)} onEkle={hareketKarisim} onSec={(x) => { hareketSec(x); toast.success(x ? `${hareketAdi(x.ad)} seçildi` : "Serbest hareket seçildi", { description: x ? x.not : "Hareketi istemin yönetir." }); }} engel={hareketEngel} />
    </div>
  );

  /* ═════════════ Pencereler ═════════════ */
  const ekler = (
    <>
      <input ref={basRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => dosyaSecildi(e, "bas")} />
      <input ref={sonRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => dosyaSecildi(e, "son")} />
      <input ref={uzatRef} type="file" accept="video/mp4,video/quicktime,video/webm" hidden onChange={uzatDosya} />
      <Govde>
      <AnimatePresence>
        {hareketPencere && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/50" onClick={() => setHareketPencere(false)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }} onClick={(e) => e.stopPropagation()}
              role="dialog" aria-modal="true" aria-label="Kamera hareketi seç"
              className="absolute bottom-0 right-0 top-0 flex w-full max-w-[860px] flex-col overflow-hidden border-l border-white/[0.08] bg-[#121214]">
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
                <div className="min-w-0 flex-1"><p className="text-[16px] font-semibold text-metin">Kamera hareketi{hs.length > 1 && <span className="ml-2 text-[13px] font-medium text-metin-2">Karışım · {hs.map((x) => hareketAdi(x.ad)).join(" + ")}</span>}</p><p className="text-[12px] text-metin-3">{model} · üzerine gelince oynar · kamera hareketlerinden {KARISIM_EN_FAZLA} tanesini karıştırabilirsin</p></div>
                {hs.length > 1 && <button onClick={() => setHareketPencere(false)} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0a0a0b]"><Check className="h-4 w-4" />Karışımı kullan</button>}
                <button onClick={() => setHareketPencere(false)} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-metin-2 ring-1 ring-inset ring-white/[0.08] hover:text-metin"><X className="h-4 w-4" /></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin]"><HareketGalerisi secili={hs.map((x) => x.ad)} onSec={hareketSec} onEkle={hareketKarisim} engel={hareketEngel} kompakt /></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </Govde>
      {elementModal && <ElementSeciciModal onSec={(ad) => { setPrompt((p) => (p.trim() ? `${p.trim()} @${ad} ` : `@${ad} `)); setElementModal(false); }} onKapat={() => setElementModal(false)} />}
      <Govde>
      <AnimatePresence>
        {uretimSecici && (
          <UretimSecici hedef={uretimSecici} uretimler={tumUretimler} onKapat={() => setUretimSecici(null)}
            onKare={(url, hedef) => { setKaynakTur("kare"); void kareKoy(url, hedef); setUretimSecici(null); toast.success(hedef === "son" ? "Bitiş karesi eklendi" : "Başlangıç karesi eklendi"); }}
            onVideo={(u) => { setUzatKaynak({ url: u.videoUrl!, poster: saltUrl(u.gorselUrl), baslik: u.baslik || "Video", oran: u.meta?.oran, id: u.id }); setKaynakTur("uzat"); setUretimSecici(null); if (videoErisim(u.model).durum === "gercek") modeliUygula(u.model, true); }} />
        )}
      </AnimatePresence>
      </Govde>
      <AnimatePresence>
        {seciliUretim && (() => {
          const u = seciliUretim;
          const kaynakU = u.meta?.kaynakId ? tumUretimler.find((x) => x.id === u.meta?.kaynakId) : undefined;
          return (
            <VideoGoruntuleyici
              u={u} ad={u.baslik || "Video"} altBaslik={`${u.model} · ${new Date(u.olusturma).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`}
              onAdKaydet={(y) => { guncelle(u.id, { baslik: y }); toast.success("Ad değiştirildi", { description: `Artık “${y}” olarak görünecek.` }); }}
              sira={lbIndex >= 0 ? { i: lbIndex, n: gezListe.length } : null} onGez={gez} onKapat={() => setSeciliId(null)}
              yorumlar={<YorumSekmesi yorum={yorum} setYorum={setYorum} konuId={u.id} />} yorumSayisi={tumYorumlar.filter((y) => y.konuId === u.id).length}
              ustKatmanAcik={elementModal} krediler={krediler} uzatKredi={uretimKredisi(u)}
              onUzat={(kare, istem) => viewerUzat(u, kare, istem)}
              onKareBaslangic={(kare) => { setKaynakTur("kare"); void kareKoy(kare, "bas"); setSeciliId(null); toast.success("Başlangıç karesi eklendi", { description: "Ne olacağını yaz ve üret." }); setTimeout(() => promptRef.current?.focus(), 50); }}
              onKareKaydet={(kare, an) => {
                void kareKalici(kare).then((url) => projeEkle({ baslik: `${(u.baslik || "Video").slice(0, 36)} · kare ${an.toFixed(1).replace(".", ",")} sn`, tur: "gorsel", model: "Kare yakalama", prompt: u.prompt, durum: "tamam", ilerleme: 100, kredi: 0, arac: "Video Stüdyosu", gorselUrl: url, meta: { kaynakId: u.id } }));
                toast.success("Kare görsel olarak kaydedildi", { description: "Kitaplık'ta bulabilirsin. Kredi düşmedi." });
              }}
              onIndir={() => uretimIndir(u)} onAyarlariYukle={() => ayarlariYukle(u)} onYenidenUret={() => yenidenUret(u)} onBegen={() => { favoriToggle(u.id); toast.success(u.favori ? "Beğenilerden çıkarıldı" : "Beğenilere eklendi"); }} onSil={() => videoyuSil(u)}
              kaynak={kaynakU ? { poster: saltUrl(kaynakU.gorselUrl), ad: kaynakU.baslik, ac: () => setSeciliId(kaynakU.id) } : undefined}
            />
          );
        })()}
      </AnimatePresence>
    </>
  );

  const surukleOlay = {
    onDragOver: (e: React.DragEvent) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setSurukle(true); } },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSurukle(false); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault(); setSurukle(false);
      const l = [...e.dataTransfer.files];
      const v = l.find((x) => x.type.startsWith("video/"));
      if (v) { setKaynakTur("uzat"); uzatDosya({ target: { files: [v], value: "" } } as unknown as React.ChangeEvent<HTMLInputElement>); return; }
      void dosyalariEkle(l);
    },
  };
  const klavye = (e: React.KeyboardEvent) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void uret(); } };

  /* Gömülü: yalnız komut kutusu, akış içinde. */
  if (gomulu) return <div onKeyDown={klavye} {...surukleOlay}>{komut}{ekler}</div>;

  const gorunenSekme = sekme === "ilham" ? "akis" : sekme;
  const icerik = gorunenSekme === "hareketler" ? hareketlerSayfa : !videoUretimleri.length ? bos : akis;
  const ustSerit = (
    <div className="sticky top-0 z-20 bg-[#0b0b0c]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-6 py-3 max-md:px-3">
        <div className="gizli-scroll min-w-0 overflow-x-auto">
          <Kayan id="video-sekme" etiket="Görünüm" deger={gorunenSekme} onDeger={setSekme} secenekler={[
            { v: "akis", a: <><Film className="h-3.5 w-3.5 max-md:hidden" />Üretimlerim</>, n: videoUretimleri.length || undefined },
            { v: "hareketler", a: <><Move3d className="h-3.5 w-3.5 max-md:hidden" />Hareketler</>, n: masaustu ? HAREKETLER.length : undefined },
          ]} />
        </div>
        <span className="flex-1" />
        {aktifIs > 0 && (
          <button onClick={() => setSekme("akis")} aria-live="polite" className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.1]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />{aktifIs}<span className="max-md:hidden"> üretiliyor</span>
          </button>
        )}
        {gorunenSekme === "akis" && (
          <>
            {!masaustu && <button onClick={() => setFiltre((v) => (v === "begenilen" ? "tumu" : "begenilen"))} aria-pressed={filtre === "begenilen"} aria-label="Yalnız beğenilenler" className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95", filtre === "begenilen" ? "bg-white text-[#0a0a0b]" : "bg-white/[0.06] text-metin-2")}><Heart className={cn("h-4 w-4", filtre === "begenilen" && "fill-current")} /></button>}
            {masaustu && <Kayan id="video-filtre" etiket="Süzgeç" deger={filtre} onDeger={setFiltre} secenekler={[
              { v: "tumu", a: "Tümü" }, { v: "begenilen", a: <><Heart className="h-3.5 w-3.5" />Beğenilenler</> },
            ]} />}
            <span className="max-md:hidden"><Kayan id="video-yogun" etiket="Izgara yoğunluğu" deger={yogunluk} onDeger={setYogunluk} secenekler={[
              { v: "rahat", a: <><Rows3 className="h-3.5 w-3.5" /><span className="sr-only">Büyük kartlar</span></> }, { v: "sik", a: <><LayoutGrid className="h-3.5 w-3.5" /><span className="sr-only">Sık ızgara</span></> },
            ]} /></span>
          </>
        )}
        <Link href="/panel/kitaplik" title="Kitaplık" aria-label="Kitaplık" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-metin-2 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.1] hover:text-metin max-md:hidden"><Images className="h-4 w-4" /></Link>
      </div>
    </div>
  );

  /* ═════════════ MOBİL ═════════════ */
  if (!masaustu) {
    return (
      <div className="dump-kapsam flex min-h-[100dvh] flex-col overflow-x-clip bg-[#0b0b0c]" onKeyDown={klavye} {...surukleOlay}>
        {ustSerit}
        <div ref={akisRef} className="flex-1 pb-6 [&>div]:px-3">{icerik}</div>
        {/* Seçim varken komut kutusu gizlenir; seçim çubuğu onun yerine gelir (Görsel stüdyosundaki gibi). */}
        <div ref={komutRef} className={cn("sticky bottom-0 z-30 p-2 pb-[calc(8px+env(safe-area-inset-bottom))] transition-[opacity,transform] duration-200", secimModu && "pointer-events-none translate-y-4 opacity-0")}>{komut}</div>
        <SecimToolbar />
        {ekler}
      </div>
    );
  }

  /* ═════════════ MASAÜSTÜ ═════════════ */
  return (
    <div className="dump-kapsam flex h-[calc(100vh-var(--ust-nav))] w-full flex-col bg-[#0b0b0c]" onKeyDown={klavye} {...surukleOlay}>
      <div className="relative min-h-0 flex-1">
        <div ref={akisRef} className="h-full overflow-y-auto [scrollbar-width:thin]" style={{ paddingBottom: komutH + 40 }}>{ustSerit}{icerik}</div>
        {surukle && (
          <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-[24px] border-2 border-dashed border-white/40 bg-white/[0.03]">
            <span className="rounded-full bg-[#0b0b0c]/85 px-4 py-2 text-[14px] font-medium text-metin">Görseli bırak: kare olur · videoyu bırak: uzatılır</span>
          </div>
        )}
        <div className={cn("pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-4 transition-[opacity,transform] duration-200", secimModu && "translate-y-4 opacity-0 [&_*]:!pointer-events-none")}>
          <div ref={komutRef} className="pointer-events-auto w-full max-w-[1160px]">{komut}</div>
        </div>
      </div>
      <SecimToolbar kapsayiciRef={akisRef} />
      {ekler}
    </div>
  );
}
