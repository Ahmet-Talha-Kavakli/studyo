"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Download, Trash2, Play, Pause, Box, AudioLines, ImageIcon, Video, Music, FolderPlus, Check, Plus, MoreHorizontal, RotateCw, Wand2, AtSign, Globe, Share2, Copy, Maximize2, Languages, Eye, ChevronRight, Link2, MessageCircle, Briefcase, Pin, BrainCircuit, Mic, AtSign as XIkon, FileImage, FileType2, FileArchive, FileVideo, Pencil } from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { uretimGeriAl } from "./uretimGeriAl";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useSecim } from "@/store/useSecim";
import { useKoleksiyon } from "@/store/useKoleksiyon";
import type { ElementTur } from "@/store/useElements";
import { ElementDuzenleModal } from "@/components/panel/element/ElementDuzenleModal";
import { uretimBaslat } from "@/lib/uretimMotoru";
import { UretimDetay } from "./UretimDetay";
import { PaylasModal } from "./PaylasModal";
import { SesSeciciModal, DilSeciciModal } from "./SesSeciciModal";
import { GirdiModal } from "./uc-boyut/GirdiModal";
import { cn, gorseliIndir, saltUrl, gorseliFormatlaIndir, INDIRME_FORMATLARI } from "@/lib/utils";
import { baglantiyiKopyala } from "@/lib/gercekEylem";
import { Tooltip } from "@/components/ui/Tooltip";

const turIkon = { video: Video, gorsel: ImageIcon, "3d": Box, ses: AudioLines, muzik: Music };
const turEtiket = { video: "Video", gorsel: "Görsel", "3d": "3D Model", ses: "Ses" };

// Ses kartı kapağındaki dekoratif waveform barları (deterministik — SSR güvenli).
const SES_KART_BARLAR = Array.from({ length: 40 }, (_, i) =>
  24 + Math.round(Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.33)) * 62),
);

// Higgsfield "Last viewed" — detay açılınca galeriye haber ver (JustifiedGaleri dinler).
function detayAcildi(id: string) {
  window.dispatchEvent(new CustomEvent("vayra-son-bakilan", { detail: id }));
}

// meta.oran ("16:9" / "3:4" / "Auto"…) → sayısal en-boy oranı (w/h). Justified galeri için.
// Higgsfield galerisi karışık oranlıdır; oran bilgisi olmayan (eski) kayıtlarda hepsini
// aynı orana düşürürsek galeri ölü bir ızgaraya döner — o yüzden id'den deterministik seçeriz.
const VARSAYILAN_ORANLAR = [3 / 4, 1, 4 / 3, 16 / 9, 2 / 3, 4 / 5];
export function oranSayi(u: Uretim): number {
  const o = u.meta?.oran;
  if (o && o.includes(":")) {
    const [w, h] = o.split(":").map(Number);
    if (w > 0 && h > 0) return w / h;
  }
  if (u.tur === "video") return 16 / 9;
  if (u.tur === "ses") return 4 / 3;
  if (u.tur === "3d") return 1;
  let h = 0;
  for (let i = 0; i < u.id.length; i++) h = (h * 31 + u.id.charCodeAt(i)) >>> 0;
  return VARSAYILAN_ORANLAR[h % VARSAYILAN_ORANLAR.length];
}

export function UretimKarti({ u, gorselOran, sonBakilan, kutuBoyut = "orta" }: { u: Uretim; gorselOran?: number; sonBakilan?: boolean; kutuBoyut?: "kucuk" | "orta" | "buyuk" }) {
  const router = useRouter();
  const { favoriToggle, sil, guncelle } = useProjeler();
  const { koleksiyonlar, olustur, uretimEkle } = useKoleksiyon();
  const [dahaMenu, setDahaMenu] = useState(false);
  const dahaBtnRef = useRef<HTMLButtonElement>(null);
  const [dahaKonum, setDahaKonum] = useState<{ top: number; left: number } | null>(null);
  // Menü createPortal ile body'ye taşınır: kart kökü Framer Motion `layout`
  // transform'u uyguluyor; transformlu ata içinde position:fixed viewport'a
  // değil o ataya göre çözülüyordu → menü "saçma konumda" açılıyordu.
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => setPortalHazir(true), []);
  // Menüyü aç: kart overflow-hidden'ı kırpmasın diye fixed koordinatla portal-stili konumlandır.
  const dahaMenuAc = () => {
    const r = dahaBtnRef.current?.getBoundingClientRect();
    if (r) {
      const menuGen = 208; // w-52
      const sagaSigar = r.right + 8 + menuGen < window.innerWidth;
      setDahaKonum({ top: r.top, left: sagaSigar ? r.right + 8 : r.left - 8 - menuGen });
    }
    setDahaMenu((v) => !v);
  };
  const [paylasModal, setPaylasModal] = useState(false);
  const [elementModal, setElementModal] = useState(false);
  /* Kart menüsündeki GERÇEK ekranlar (kullanıcı: "fake şuanda"):
     · sesModal  → /panel/ses'teki ses seçme ekranı, ortada popup
     · dilModal  → "Çevir" için dil seçici, ortada popup
     · yeniKlasor→ klasör adı soran gerçek girdi ekranı
     · adModal   → üretimin adını değiştirme (indirme dosya adı da bu olur) */
  const [sesModal, setSesModal] = useState(false);
  const [dilModal, setDilModal] = useState(false);
  const [yeniKlasor, setYeniKlasor] = useState(false);
  const [adModal, setAdModal] = useState(false);
  const [klasorAlt, setKlasorAlt] = useState(false);
  const [indirAlt, setIndirAlt] = useState(false);
  const klasorSatirRef = useRef<HTMLDivElement>(null);
  const indirSatirRef = useRef<HTMLDivElement>(null);
  const [klasorKonum, setKlasorKonum] = useState<{ top: number; left: number } | null>(null);
  const [indirKonum, setIndirKonum] = useState<{ top: number; left: number } | null>(null);
  // Higgsfield kart seçim kutusu — GERÇEK çoklu seçim (store'a bağlı; toplu işlem çubuğu okur).
  const secili = useSecim((s) => s.secililer.includes(u.id));
  const secimToggle = useSecim((s) => s.toggle);
  const [paylasAlt, setPaylasAlt] = useState(false); // Paylaş uçan alt-menüsü
  const paylasSatirRef = useRef<HTMLDivElement>(null);
  // Paylaş alt-menüsü konumu — fixed (ana menünün overflow'undan bağımsız uçan katman).
  const [paylasKonum, setPaylasKonum] = useState<{ top: number; left: number } | null>(null);
  const paylasAltAc = () => {
    const r = paylasSatirRef.current?.getBoundingClientRect();
    if (r) {
      const altGen = 192; // w-48
      const sagaSigar = r.right + 4 + altGen < window.innerWidth;
      // Alt-menü yüksekliği ~ satır sayısı; ekran altından taşarsa yukarı kaydır.
      const tahminiYuk = 44 * paylasSecenekleri.length + 12;
      const top = Math.min(r.top, window.innerHeight - 12 - tahminiYuk);
      setPaylasKonum({ top: Math.max(12, top), left: sagaSigar ? r.right + 4 : r.left - 4 - altGen });
    }
    setPaylasAlt(true);
  };

  /* Uçan alt-menü konumu — Paylaş ile aynı desen. Ana menü `overflow-y-auto`
     olduğu için alt-menüleri içine gömmek kırpılmalarına yol açıyordu; hepsi
     fixed katman olarak uçar. */
  const altKonumOlc = (
    ref: React.RefObject<HTMLDivElement | null>,
    satirSayisi: number,
    genislik: number,
    ayarla: (k: { top: number; left: number }) => void,
  ) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const sagaSigar = r.right + 4 + genislik < window.innerWidth;
    const tahminiYuk = 44 * satirSayisi + 12;
    const top = Math.min(r.top, window.innerHeight - 12 - tahminiYuk);
    ayarla({ top: Math.max(12, top), left: sagaSigar ? r.right + 4 : r.left - 4 - genislik });
  };

  // Higgsfield birebir paylaşım kanalları (Copy link / X / WhatsApp / Pinterest / LinkedIn).
  const paylasBaglanti = () => (typeof window !== "undefined" ? `${window.location.origin}/kesfet?u=${u.id}` : "");
  const paylasSecenekleri: { ad: string; ikon: typeof Link2; eylem: () => void }[] = [
    { ad: "Bağlantıyı kopyala", ikon: Link2, eylem: () => { void baglantiyiKopyala(paylasBaglanti()); } },
    { ad: "X'te paylaş", ikon: XIkon, eylem: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(u.baslik)}&url=${encodeURIComponent(paylasBaglanti())}`, "_blank") },
    { ad: "WhatsApp'ta paylaş", ikon: MessageCircle, eylem: () => window.open(`https://wa.me/?text=${encodeURIComponent(u.baslik + " " + paylasBaglanti())}`, "_blank") },
    { ad: "Pinterest'te paylaş", ikon: Pin, eylem: () => window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(paylasBaglanti())}&description=${encodeURIComponent(u.baslik)}`, "_blank") },
    { ad: "LinkedIn'de paylaş", ikon: Briefcase, eylem: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(paylasBaglanti())}`, "_blank") },
  ];

  // Kart üstü hızlı dönüştürme — görseli videoya çevir (Higgsfield sağ-alt çubuğu).
  const videoyaCevir = () => {
    const s = uretimBaslat({
      baslik: `${u.baslik} (video)`.slice(0, 42), tur: "video", model: "Seedance 2.0",
      prompt: u.prompt, kredi: 42, arac: "Videoya Çevir", meta: { oran: u.meta?.oran },
    });
    if (!s.ok) return toast.error("Video başlatılamadı", { description: s.hata ?? "Yeniden dene." });
    toast.success("Videoya çevriliyor", { description: "Seedance 2.0 · 42 kredi. Bitince bildirim gelir." });
  };

  // Higgsfield "..." bağlam menüsü eylemleri — hepsi gerçek.
  const yenidenUret = () => {
    const s = uretimBaslat({ baslik: u.baslik, tur: u.tur, model: u.model, prompt: u.prompt, kredi: u.kredi, arac: u.arac });
    if (!s.ok) return toast.error("Yeniden üretim başlatılamadı", { description: s.hata ?? "Yeniden dene." });
    toast.success("Yeniden üretiliyor", { description: `${u.model} · ${u.kredi} kredi. Bitince bildirim gelir.` });
    setDahaMenu(false);
  };
  const promptuKullan = () => {
    try { sessionStorage.setItem("vayra-gecis-prompt", u.prompt); } catch { /* yoksay */ }
    toast.success("İstem Görsel stüdyosuna taşındı", { description: "Düzenleyip yeniden üretebilirsin." });
    router.push("/panel/gorsel");
    setDahaMenu(false);
  };
  /* M1: "Element oluştur" artık sessizce uydurma adla kayıt atmıyor —
     GERÇEK "Yeni Element" modalını üretimin verileriyle ön-doldurup açar.
     Kullanıcı adı/kategoriyi görüp onaylar, kayıt modalde yapılır. */
  const elementOlustur = () => {
    setDahaMenu(false);
    setElementModal(true);
  };
  const elementTohum = {
    ad: (u.baslik.replace(/[^\wğüşiöçİĞÜŞÖÇ]/gi, "").slice(0, 14) || "Element"),
    tur: (u.tur === "3d" ? "obje" : u.tur === "ses" ? "stil" : "karakter") as ElementTur,
    aciklama: u.prompt.slice(0, 120),
    gorsel: saltUrl(u.gorselUrl) ?? undefined,
  };
  const yayinToggle = () => {
    guncelle(u.id, { yayinda: !u.yayinda });
    toast.success(u.yayinda ? "Yayından kaldırıldı" : "Keşfet'te yayınlandı", { description: u.yayinda ? "Artık Keşfet akışında görünmüyor." : "Topluluk bu üretimi remixleyebilir." });
    setDahaMenu(false);
  };
  /* ÇEVİR — eskiden hedef dili sormadan sabit "İngilizce"ye çeviriyordu.
     Artık ekranın ortasında dil seçici açılır; seçilen dille üretim başlar. */
  const cevirDile = (dil: { ad: string; bayrak: string }) => {
    const s = uretimBaslat({
      baslik: `${u.baslik} · ${dil.ad}`.slice(0, 48), tur: u.tur, model: u.model,
      prompt: `${u.prompt} · ${dil.ad} dilinde dublaj ve altyazı`,
      kredi: Math.max(2, Math.round(u.kredi / 2)), arac: u.arac,
      meta: { ...u.meta, hamIstem: u.meta?.hamIstem ?? u.prompt },
    });
    if (!s.ok) return toast.error("Çeviri başlatılamadı", { description: s.hata ?? "Yeniden dene." });
    toast.success(`${dil.ad} diline çevriliyor`, { description: "Dublaj ve altyazı hazırlanıyor. Bitince bildirim gelir." });
  };

  /* SESİ DEĞİŞTİR — eskiden yalnız toast basıyordu. Artık /panel/ses'teki
     ses seçme ekranı ortada açılır; seçilen sesle gerçek üretim başlar. */
  const sesiDegistir = (ses: { ad: string; cinsiyet: string }) => {
    const s = uretimBaslat({
      baslik: `${u.baslik} · ${ses.ad}`.slice(0, 48), tur: u.tur, model: u.model,
      prompt: `${u.prompt} · ${ses.ad} sesiyle seslendirildi`,
      kredi: Math.max(2, Math.round(u.kredi / 2)), arac: "Sesi Değiştir",
      meta: { ...u.meta, ses: ses.ad, hamIstem: u.meta?.hamIstem ?? u.prompt },
    });
    if (!s.ok) return toast.error("Ses değişimi başlatılamadı", { description: s.hata ?? "Yeniden dene." });
    toast.success(`Ses ${ses.ad} olarak değiştiriliyor`, { description: `${u.baslik}. Bitince bildirim gelir.` });
  };

  /* KLASÖRE EKLE — gerçek koleksiyon listesi (görsel sayfasıyla aynı desen).
     Eskiden tek satırdı ve kart içine gömülü bir menü açıyordu. */
  const klasorListesi = useMemo(
    () => koleksiyonlar.map((k) => ({ id: k.id, ad: k.ad, adet: k.uretimIdler.length, ekli: k.uretimIdler.includes(u.id) })),
    [koleksiyonlar, u.id],
  );
  const klasoreEkle = (kid: string) => {
    uretimEkle(kid, u.id);
    toast.success("Klasöre eklendi", { description: `${koleksiyonlar.find((k) => k.id === kid)?.ad ?? "Klasör"} klasörüne eklendi.` });
  };
  const yeniKlasorKaydet = (ad: string) => {
    const temiz = ad.trim();
    if (!temiz) return;
    const kid = olustur(temiz);
    uretimEkle(kid, u.id);
    toast.success("Klasör oluşturuldu", { description: `Üretim ${temiz} klasörüne eklendi.` });
  };

  /* AD — indirme dosya adı da bu olur (görsel sayfasındaki davranış). */
  const adKaydet = (yeni: string) => {
    const temiz = yeni.trim();
    if (!temiz || temiz === u.baslik) return;
    guncelle(u.id, { baslik: temiz });
    toast.success("Ad güncellendi", { description: `Dosya ${temiz}.${u.tur === "video" ? "mp4" : u.tur === "ses" ? "mp3" : "png"} adıyla iner.` });
  };

  /** Dosya adı — kullanıcının verdiği ad, dosya-sistemi güvenli hâlde. */
  const dosyaAdi = () => (u.baslik.replace(/[^\wğüşiöçİĞÜŞÖÇ -]/gi, "").trim().slice(0, 60) || "vayra");

  /* İNDİRME FORMATLARI — türe göre. Görsel gerçekten yeniden kodlanır
     (canvas), video/ses tek biçimde iner (yeniden kodlama tarayıcıda yok). */
  const formatListesi: { ad: string; not: string; ikon: typeof FileImage }[] =
    u.tur === "video" ? [{ ad: "mp4", not: "video · H.264", ikon: FileVideo }]
    : u.tur === "ses" ? [{ ad: "mp3", not: "ses · sıkıştırılmış", ikon: AudioLines }]
    : [
        { ad: "png", not: "kayıpsız · saydam", ikon: FileImage },
        { ad: "jpg", not: "küçük dosya", ikon: FileType2 },
        { ad: "webp", not: "web için ideal", ikon: FileArchive },
      ];

  const formatIndir = (format: string) => {
    // Video/ses: doğrudan kaynak dosya (tarayıcıda transcode yok).
    if (u.tur === "video" || u.tur === "ses") { indir(); return; }
    const kaynak = u.gorselUrl && /^(data:|https?:|\/)/.test(u.gorselUrl) ? u.gorselUrl : saltUrl(u.gorselUrl);
    if (!kaynak) { indir(); return; }
    void gorseliFormatlaIndir(kaynak, dosyaAdi(), format).then(
      () => toast.success(`${format.toUpperCase()} indirildi`, { description: `${dosyaAdi()}.${format}` }),
      () => mesaj.indirilemedi(`Görsel ${format.toUpperCase()} biçimine çevrilemedi.`),
    );
  };
  const [detayId, setDetayIdRaw] = useState<string | null>(null);
  const detay = detayId !== null;
  const setDetay = (a: boolean) => setDetayIdRaw(a ? u.id : null);
  // Detay açıkken aynı-tür + tamamlanmış üretimler arası ileri/geri (Higgsfield birebir).
  const tumUretimlerNav = useProjeler((s) => s.uretimler);
  const komsular = useMemo(
    () => tumUretimlerNav.filter((x: Uretim) => x.tur === u.tur && x.durum === "tamam"),
    [tumUretimlerNav, u.tur],
  );
  const detayIndex = detayId ? komsular.findIndex((x) => x.id === detayId) : -1;
  const detayUretim = detayIndex >= 0 ? komsular[detayIndex] : u;
  // (kolMenu kaldırıldı — klasör akışı artık ⋯ menüsündeki uçan alt-menüde)
  const [oynatiliyor, setOynatiliyor] = useState(false);
  const sesRef = useRef<HTMLAudioElement | null>(null);
  const Ikon = turIkon[u.tur];
  const acilabilir = u.durum === "tamam";
  const gercekSes = u.tur === "ses" && Boolean(u.sesUrl);

  const oynatDurdur = () => {
    if (gercekSes && sesRef.current) {
      if (oynatiliyor) sesRef.current.pause();
      else sesRef.current.play().catch(() => toast.error("Ses oynatılamadı", { description: "Tarayıcı oynatmayı engelledi ya da dosyaya ulaşılamadı. Yeniden dene." }));
    }
    setOynatiliyor((v) => !v);
  };

  const indir = () => {
    if (gercekSes && u.sesUrl) {
      const a = document.createElement("a");
      a.href = u.sesUrl;
      a.download = `${dosyaAdi()}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Ses indiriliyor", { description: a.download });
      return;
    }
    // Gerçek API görsel/video çıktısı (data-uri veya http) varsa onu indir; yoksa gradient.
    const gercekGorsel = u.gercek && u.gorselUrl && (u.gorselUrl.startsWith("data:") || u.gorselUrl.startsWith("http"))
      ? u.gorselUrl
      : undefined;
    gorseliIndir(u.prompt + u.model, u.baslik, gercekGorsel);
    toast.success("İndirildi", { description: u.baslik });
  };

  // Higgsfield birebir: görsel edge-to-edge, altında bilgi kutusu YOK.
  // Hover'da sağ-üst köşede dikey yuvarlak aksiyon rayı (kalp/indir/kopya/⋯) belirir.
  // Kutu boyutuna ORANTILI ray butonu (görsel kartıyla aynı mantık: küçük kutuda küçük ikon).
  const rayBoy = kutuBoyut === "kucuk" ? "h-6 w-6" : kutuBoyut === "orta" ? "h-7 w-7" : "h-8 w-8";
  const rayIk = kutuBoyut === "kucuk" ? "h-3 w-3" : kutuBoyut === "orta" ? "h-3.5 w-3.5" : "h-4 w-4";
  const rayGap = kutuBoyut === "kucuk" ? "gap-1" : "gap-1.5";
  const rayKenar = kutuBoyut === "kucuk" ? "right-1.5 top-1.5" : "right-2 top-2";
  const rayBtn = cn("pointer-events-auto flex items-center justify-center rounded-full bg-ink-950/60 text-white/90 backdrop-blur-md transition-colors hover:bg-ink-950/80", rayBoy);
  // Yatay (video/ses) kartlarda VEYA küçük kutuda ray'ı YATAY diz — 4 ikon dikeyde sığmayıp
  // üç-nokta kaybolmasın (görsel sayfasındaki KartAraclari ile aynı çözüm).
  const yatayRay = u.tur === "video" || u.tur === "ses" || kutuBoyut === "kucuk";
  // gorselUrl ham bir URL/data-uri olabilir (gerçek API çıktısı) → CSS background için url() ile sar.
  // Zaten CSS fonksiyonu (gradient/url) içeriyorsa dokunma.
  // Ses üretiminde thumbnail bir görsel/video karesi DEĞİL — sabit aksan gradyanı (kapak).
  const arkaPlan = u.tur === "ses"
    ? "radial-gradient(120% 100% at 50% 0%, rgba(34,211,238,0.18), transparent 65%), linear-gradient(160deg,#14161b,#0c0d10)"
    : u.gorselUrl
    ? (/^(data:|https?:|\/)/.test(u.gorselUrl) ? `url("${u.gorselUrl}") center/cover no-repeat` : u.gorselUrl)
    : "linear-gradient(135deg,#1a1725,#12101a)";
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // Higgsfield birebir: kartlar neredeyse köşesiz ve bitişik (duvar hissi)
      className={cn("group relative overflow-hidden rounded-md bg-ink-900", acilabilir && "cursor-pointer")}
      onClick={() => { if (acilabilir) { setDetay(true); detayAcildi(u.id); } }}
    >
      {/* Görsel katmanı — Higgsfield: hover'da hafif zoom (kart çerçevesi sabit, görsel canlanır) */}
      {u.durum === "tamam" && (
        <div
          className="absolute inset-0 transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
          style={{ background: arkaPlan }}
        />
      )}
      {/* Görsel oranı — justified galeri gorselOran verir (Higgsfield birebir); yoksa türe göre */}
      {gorselOran ? (
        <div className="w-full" style={{ aspectRatio: String(gorselOran) }} />
      ) : (
        <div className={cn(u.tur === "gorsel" ? "aspect-[3/4]" : u.tur === "ses" ? "aspect-[4/3]" : "aspect-video", "w-full")} />
      )}

      {gercekSes && <audio ref={sesRef} src={u.sesUrl} preload="none" onEnded={() => setOynatiliyor(false)} />}

      {/* Hover vignette — dört kenardan içeri koyu (Higgsfield birebir), köşe
          ikonları/araçları okunur olsun. Yalnız tamamlanmış üretimlerde. */}
      {u.durum === "tamam" && <span className="uretim-vignette" />}

      {/* Ses kartı — dekoratif waveform kapağı (görsel/video karesi değil) */}
      {u.tur === "ses" && u.durum === "tamam" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 flex items-center justify-center gap-[3px] px-6 opacity-45">
          {SES_KART_BARLAR.map((h, i) => (
            <span key={i} className="w-[3px] rounded-full bg-cyan-glow/70" style={{ height: `${h}%` }} />
          ))}
        </div>
      )}

      {/* İşleniyor durumu — Higgsfield: spinner + durum + % + model + akan progress */}
      {u.durum !== "tamam" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900/70 px-4 backdrop-blur-sm">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-cyan-glow" />
          <span className="text-xs font-medium text-white/75">
            {u.durum === "kuyrukta" ? "Kuyrukta…" : `Üretiliyor · %${u.ilerleme}`}
          </span>
          <div className="mt-0.5 h-1 w-28 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-cyan-glow" animate={{ width: `${u.ilerleme}%` }} transition={{ ease: "easeOut", duration: 0.4 }} />
          </div>
          <span className="mt-0.5 truncate text-[10px] text-white/40">{u.model}</span>
        </div>
      )}

      {/* Video/ses oynat — merkez */}
      {u.durum === "tamam" && (u.tur === "video" || u.tur === "ses") && (
        <button
          onClick={(e) => { e.stopPropagation(); oynatDurdur(); }}
          className="pointer-events-auto absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 opacity-0 backdrop-blur-md transition-all hover:scale-110 group-hover:opacity-100"
          aria-label={oynatiliyor ? "Duraklat" : "Oynat"}
        >
          {oynatiliyor ? <Pause className="h-5 w-5 fill-white text-white" /> : <Play className="h-5 w-5 fill-white text-white" />}
        </button>
      )}

      {/* KALICI BEĞENİ ROZETİ — favorilenmiş kartta kalp hover OLMADAN da
          görünür (/panel ve /panel/gorsel ile aynı davranış). Araç rayının
          tamamı hover'a bağlı olduğu için favori durumu kartta hiç
          görünmüyordu. Hover'da rayın kendi kalbine yerini bırakır.
          Boyut bir tık büyütüldü (kullanıcı isteği 2026-07-31): 24/32 → 30/40px;
          rozet hover'da rayın kalbine yer bıraktığı için ray butonlarıyla aynı
          boyutta olmak zorunda değil — burada okunurluk önceliklidir. */}
      {u.durum === "tamam" && u.favori && (
        <span aria-hidden
          className={cn("kart-begeni pointer-events-none absolute z-20 flex items-center justify-center rounded-full transition-opacity group-hover:opacity-0",
            rayKenar, kutuBoyut === "kucuk" ? "h-[30px] w-[30px]" : "h-10 w-10")}>
          <Heart className={cn("fill-rose-400 text-rose-400", kutuBoyut === "kucuk" ? "h-4 w-4" : "h-[21px] w-[21px]")} />
        </span>
      )}

      {/* Hover'da sağ-üst aksiyon rayı — Higgsfield birebir (yatay kartta yatay, dikeyde dikey) */}
      {u.durum === "tamam" && (
        <div className={cn("pointer-events-none absolute flex opacity-0 transition-opacity group-hover:opacity-100", yatayRay ? "flex-row" : "flex-col", rayKenar, rayGap)}>
          {/* Video/ses kartında ortadaki oynat butonu detay-açmayı engeller → net "Genişlet" yolu ekle */}
          {(u.tur === "video" || u.tur === "ses") && (
            <Tooltip label="Genişlet" side="left">
              <button onClick={(e) => { e.stopPropagation(); setDetay(true); detayAcildi(u.id); }} className={rayBtn} aria-label="Genişlet / Detay">
                <Maximize2 className={rayIk} />
              </button>
            </Tooltip>
          )}
          <Tooltip label={u.favori ? "Favoriden çıkar" : "Favori"} side="left">
            <button onClick={(e) => { e.stopPropagation(); favoriToggle(u.id); }}
              className={cn(rayBtn, u.favori && "text-rose-400")} aria-label="Favori">
              <Heart className={cn(rayIk, u.favori && "fill-current")} />
            </button>
          </Tooltip>
          <Tooltip label="İndir" side="left">
            <button onClick={(e) => { e.stopPropagation(); indir(); }} className={rayBtn} aria-label="İndir">
              <Download className={rayIk} />
            </button>
          </Tooltip>
          <Tooltip label="Prompt'u kullan" side="left">
            <button onClick={(e) => { e.stopPropagation(); promptuKullan(); }} className={rayBtn} aria-label="Prompt'u kopyala">
              <Copy className={rayIk} />
            </button>
          </Tooltip>
          <div className="relative">
            <Tooltip label="Daha fazla" side="left">
              <button ref={dahaBtnRef} onClick={(e) => { e.stopPropagation(); dahaMenuAc(); }}
                className={cn(rayBtn, dahaMenu && "bg-ink-950/80")} aria-label="Daha fazla">
                <MoreHorizontal className={rayIk} />
              </button>
            </Tooltip>
            {dahaMenu && dahaKonum && portalHazir && createPortal(
              <>
                <div className="pointer-events-auto fixed inset-0 z-[120]" onClick={(e) => { e.stopPropagation(); setDahaMenu(false); }} />
                <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", top: dahaKonum.top, left: dahaKonum.left }} className="menu-surface pointer-events-auto z-[121] max-h-[70vh] w-56 overflow-y-auto rounded-xl p-1.5">
                  {/* VİDEO — Higgsfield birebir üst blok: Virality Predictor · Translate · Change Voice */}
                  {u.tur === "video" && (
                    <>
                      <button onClick={() => { toast.info("Virallik tahmini yakında", { description: "Bu özellik henüz hazır değil. Hazır olunca bu menüde çalışacak." }); setDahaMenu(false); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                        <BrainCircuit className="h-4 w-4 text-white/60" />
                        <span className="flex-1">Virallik Tahmini</span>
                        <span className="rounded bg-cyan-glow/90 px-1 py-0.5 text-[9px] font-bold text-ink-950">YENİ</span>
                      </button>
                      {/* Çevir / Sesi Değiştir — GERÇEK ekranlar (kullanıcı isteği
                          2026-07-31): eskiden ikisi de yalnız toast basıyordu. */}
                      <button onClick={() => { setDahaMenu(false); setDilModal(true); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                        <Globe className="h-4 w-4 text-white/60" /> Çevir
                      </button>
                      <button onClick={() => { setDahaMenu(false); setSesModal(true); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                        <Mic className="h-4 w-4 text-white/60" /> Sesi Değiştir
                      </button>
                      <div className="my-1 h-px bg-white/8" />
                    </>
                  )}
                  {/* Higgsfield birebir: Aç · Yeniden üret · Yeniden kullan · Element · Beğen */}
                  <button onClick={() => { setDetay(true); detayAcildi(u.id); setDahaMenu(false); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                    <Maximize2 className="h-4 w-4 text-white/60" /> Aç
                  </button>
                  <button onClick={yenidenUret} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                    <RotateCw className="h-4 w-4 text-white/60" /> Yeniden üret
                  </button>
                  <button onClick={promptuKullan} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                    <Copy className="h-4 w-4 text-white/60" /> Yeniden kullan
                  </button>
                  <button onClick={elementOlustur} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                    <AtSign className="h-4 w-4 text-cyan-glow" /> Element oluştur
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); favoriToggle(u.id); toast(u.favori ? "Beğeniden çıkarıldı" : "Beğenildi", { description: u.baslik }); setDahaMenu(false); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                    <Heart className={cn("h-4 w-4", u.favori ? "fill-rose-400 text-rose-400" : "text-white/60")} /> Beğen
                  </button>
                  {/* Paylaş — Higgsfield birebir uçan alt-menü */}
                  <div ref={paylasSatirRef}
                    onMouseEnter={paylasAltAc} onMouseLeave={() => setPaylasAlt(false)}>
                    <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                      <Share2 className="h-4 w-4 text-white/60" />
                      <span className="flex-1">Paylaş</span>
                      <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                    </button>
                  </div>
                  {/* KLASÖRE EKLE → uçan alt-menü, GERÇEK klasör listesi
                      (kullanıcı: "fake şuanda"). Paylaş ile aynı desen. */}
                  <div ref={klasorSatirRef}
                    onMouseEnter={() => { altKonumOlc(klasorSatirRef, klasorListesi.length + 1, 224, setKlasorKonum); setKlasorAlt(true); }}
                    onMouseLeave={() => setKlasorAlt(false)}>
                    <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                      <FolderPlus className="h-4 w-4 text-white/60" />
                      <span className="flex-1">Klasöre ekle</span>
                      <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                    </button>
                  </div>
                  {/* Adı düzenle — indirme dosya adı da bu olur (görsel sayfasıyla aynı). */}
                  <button onClick={() => { setDahaMenu(false); setAdModal(true); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                    <Pencil className="h-4 w-4 text-white/60" /> Adı düzenle
                  </button>
                  <button onClick={yayinToggle} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                    <Globe className={cn("h-4 w-4", u.yayinda ? "text-emerald-400" : "text-white/60")} />
                    {u.yayinda ? "Yayından kaldır" : "Yayınla"}
                  </button>
                  {/* İNDİR → format alt-menüsü (ikonlu). Doğrudan tıklanırsa varsayılan. */}
                  <div ref={indirSatirRef}
                    onMouseEnter={() => { altKonumOlc(indirSatirRef, formatListesi.length, 224, setIndirKonum); setIndirAlt(true); }}
                    onMouseLeave={() => setIndirAlt(false)}>
                    <button onClick={() => { indir(); setDahaMenu(false); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                      <Download className="h-4 w-4 text-white/60" />
                      <span className="flex-1">İndir</span>
                      <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                    </button>
                  </div>
                  <div className="my-1 h-px bg-white/8" />
                  <button onClick={() => { const geriAl = uretimGeriAl([u.id]); sil(u.id); mesaj.silindi("Üretim", geriAl); setDahaMenu(false); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm text-rose-400 transition-colors hover:bg-rose-500/12">
                    <Trash2 className="h-4 w-4" /> Sil
                  </button>
                </div>
                {/* Klasör alt-menüsü — GERÇEK klasörler + "Yeni klasör" (ad sorar) */}
                {klasorAlt && klasorKonum && (
                  <div onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => setKlasorAlt(true)} onMouseLeave={() => setKlasorAlt(false)}
                    style={{ position: "fixed", top: klasorKonum.top, left: klasorKonum.left }}
                    className="menu-surface pointer-events-auto z-[122] max-h-64 w-56 overflow-y-auto rounded-xl p-1.5">
                    {klasorListesi.length === 0 && (
                      <p className="px-2.5 py-2 text-[12.5px] text-white/40">Henüz klasör yok</p>
                    )}
                    {klasorListesi.map((k) => (
                      <button key={k.id} onClick={() => { klasoreEkle(k.id); setKlasorAlt(false); setDahaMenu(false); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                        <FolderPlus className="h-4 w-4 shrink-0 text-white/60" />
                        <span className="min-w-0 flex-1 truncate">{k.ad}</span>
                        {k.ekli
                          ? <Check className="h-3.5 w-3.5 shrink-0 text-aksan" />
                          : <span className="shrink-0 text-[11.5px] tabular-nums text-white/35">{k.adet}</span>}
                      </button>
                    ))}
                    <div className="my-1 h-px bg-white/8" />
                    <button onClick={() => { setKlasorAlt(false); setDahaMenu(false); setYeniKlasor(true); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-aksan transition-colors hover:bg-aksan/10">
                      <Plus className="h-4 w-4" /> Yeni klasör
                    </button>
                  </div>
                )}
                {/* İndirme formatı alt-menüsü — her formatın kendi ikonu + ne işe yaradığı */}
                {indirAlt && indirKonum && (
                  <div onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => setIndirAlt(true)} onMouseLeave={() => setIndirAlt(false)}
                    style={{ position: "fixed", top: indirKonum.top, left: indirKonum.left }}
                    className="menu-surface pointer-events-auto z-[122] w-56 rounded-xl p-1.5">
                    {formatListesi.map((f, i) => (
                      <button key={f.ad} onClick={() => { formatIndir(f.ad); setIndirAlt(false); setDahaMenu(false); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-white/8">
                        <f.ikon className="h-4 w-4 shrink-0 text-white/60" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-white">{f.ad.toUpperCase()}</span>
                          <span className="block text-[11px] text-white/40">{f.not}</span>
                        </span>
                        {i === 0 && <Check className="h-3.5 w-3.5 shrink-0 text-aksan" />}
                      </button>
                    ))}
                  </div>
                )}
                {/* Paylaş alt-menüsü — FIXED katman, ana menüden bağımsız uçar (kırpılmaz/scroll etmez) */}
                {paylasAlt && paylasKonum && (
                  <div onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => setPaylasAlt(true)} onMouseLeave={() => setPaylasAlt(false)}
                    style={{ position: "fixed", top: paylasKonum.top, left: paylasKonum.left }}
                    className="menu-surface pointer-events-auto z-[122] w-48 rounded-xl p-1.5">
                    {paylasSecenekleri.map((p) => (
                      <button key={p.ad} onClick={() => { p.eylem(); setDahaMenu(false); setPaylasAlt(false); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                        <p.ikon className="h-4 w-4 text-white/60" /> {p.ad}
                      </button>
                    ))}
                  </div>
                )}
              </>,
              document.body,
            )}
          </div>
        </div>
      )}

      {/* Video play (►) overlay — Higgsfield birebir: video thumbnaillerinde ortada daire (madde 16) */}
      {u.tur === "video" && u.durum === "tamam" && !sonBakilan && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full glass-ikon transition-all group-hover:scale-110">
            <Play className="h-5 w-5 translate-x-0.5 fill-white text-white" />
          </span>
        </div>
      )}

      {/* "Son bakılan" rozeti — Higgsfield birebir (ortada, göz ikonlu) */}
      {sonBakilan && u.durum === "tamam" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink-950/35 transition-opacity group-hover:opacity-0">
          <span className="flex items-center gap-1.5 text-sm font-medium text-white">
            <Eye className="h-4 w-4" /> Son bakılan
          </span>
        </div>
      )}

      {/* Sol-üst seçim kutusu — Higgsfield birebir (çoklu seçim) */}
      {u.durum === "tamam" && (
        <button
          onClick={(e) => { e.stopPropagation(); secimToggle(u.id); }}
          className={cn(
            "absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-[5px] border-2 backdrop-blur-md transition-all",
            secili
              ? "border-cyan-glow bg-cyan-glow opacity-100"
              : "border-white/70 bg-ink-950/30 opacity-0 group-hover:opacity-100",
          )}
          aria-label="Seç"
        >
          {secili && <Check className="h-3 w-3 text-ink-950" strokeWidth={3.5} />}
        </button>
      )}

      {/* Sağ-alt dönüştürme çubuğu — SADECE görsel kartında (Higgsfield birebir: görsel · videoya çevir · element).
          Video/ses kartında bu çubuk sağ-üst ray + ortadaki oynat ile çakışıyordu; o türlerde bu eylemler ⋯ menüsünde. */}
      {u.durum === "tamam" && u.tur === "gorsel" && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Tooltip label="Bu görselden yeni görsel" side="left">
            <button onClick={(e) => { e.stopPropagation(); promptuKullan(); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg glass-ikon text-white/85 transition-colors" aria-label="Bu görselden yeni görsel üret">
              <ImageIcon className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip label="Videoya çevir" side="left">
            <button onClick={(e) => { e.stopPropagation(); videoyaCevir(); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg glass-ikon text-white/85 transition-colors" aria-label="Videoya çevir">
              <Video className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip label="Element oluştur" side="left">
            <button onClick={(e) => { e.stopPropagation(); elementOlustur(); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg glass-ikon text-white/85 transition-colors" aria-label="Element oluştur">
              <AtSign className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      )}

      {/* Alt gradient + başlık (hover'da) — Higgsfield sol-alt etiketi */}
      {u.durum === "tamam" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent p-3 pt-8 opacity-0 transition-opacity group-hover:opacity-100">
          <p className="truncate pr-24 text-xs font-medium text-white">{u.baslik}</p>
          <p className="truncate pr-24 text-[11px] text-white/60">{u.model}</p>
        </div>
      )}

      {/* NOT: Eski "Koleksiyon menüsü" bloğu kaldırıldı — kart içine gömülüydü
          (overflow-hidden kırpıyordu) ve "Yeni koleksiyon" native window.prompt
          açıyordu. Yerini ⋯ menüsündeki uçan "Klasöre ekle" alt-menüsü +
          GirdiModal aldı. */}

      <AnimatePresence>
        {detay && (
          <UretimDetay
            u={detayUretim}
            onClose={() => setDetayIdRaw(null)}
            onOnceki={detayIndex > 0 ? () => setDetayIdRaw(komsular[detayIndex - 1].id) : undefined}
            onSonraki={detayIndex >= 0 && detayIndex < komsular.length - 1 ? () => setDetayIdRaw(komsular[detayIndex + 1].id) : undefined}
          />
        )}
        {paylasModal && <PaylasModal baslik={u.baslik} onKapat={() => setPaylasModal(false)} />}
        {elementModal && (
          <ElementDuzenleModal
            element={null}
            tohumDeger={elementTohum}
            onKapat={() => setElementModal(false)}
            onOlustu={() => { /* modal kendi başarı toast'ını basar */ }}
          />
        )}
        {/* Sesi Değiştir → /panel/ses'teki ses seçme ekranı, ekranın ortasında */}
        {sesModal && (
          <SesSeciciModal
            seciliAd={u.meta?.ses}
            baslik="Sesi değiştir"
            onSec={sesiDegistir}
            onKapat={() => setSesModal(false)}
          />
        )}
        {/* Çevir → hedef dil seçici, ekranın ortasında */}
        {dilModal && (
          <DilSeciciModal onSec={cevirDile} onKapat={() => setDilModal(false)} />
        )}
      </AnimatePresence>

      {/* Yeni klasör — GERÇEK ad sorma ekranı (fake otomatik ad yerine) */}
      <GirdiModal
        acik={yeniKlasor}
        baslik="Yeni klasör"
        etiket="Klasör adı"
        varsayilan=""
        kaydetAd="Oluştur"
        onKaydet={yeniKlasorKaydet}
        onKapat={() => setYeniKlasor(false)}
      />
      {/* Adı düzenle — indirme dosya adı da bu olur */}
      <GirdiModal
        acik={adModal}
        baslik="Adı düzenle"
        etiket="Üretim adı"
        varsayilan={u.baslik}
        onKaydet={adKaydet}
        onKapat={() => setAdModal(false)}
      />
    </motion.div>
  );
}
