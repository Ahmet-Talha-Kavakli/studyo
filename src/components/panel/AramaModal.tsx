"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollKilit } from "@/hooks/useScrollKilit";
import { toast } from "@/lib/toast";
import {
  Search, Box, AudioLines, Clapperboard, Megaphone, Wand2, LayoutGrid, FolderOpen,
  ArrowUpRight, TrendingUp, Cpu, Scissors, GraduationCap, UserRound, Workflow, Plus,
  CreditCard, Settings, LogOut, Bell, Users, Sparkles, SlidersHorizontal, Film,
  X, CornerDownLeft, Music2, Image as ImageIcon, Video as VideoIcon, Combine,
  Coins, Flame, Gift, Trophy, Terminal,
} from "lucide-react";
import { MODELLER, UYGULAMALAR } from "@/lib/catalog";
import { useAuth } from "@/store/useAuth";
import { useKarakterler } from "@/store/useKarakterler";
import { useElements } from "@/store/useElements";
import { AKIS_TOHUM, AKIS_PROFILLER, kisaSayi } from "@/lib/akisVeri";
import { cn } from "@/lib/utils";

/**
 * AramaModal — Higgsfield/macOS Spotlight birebir global arama.
 * (referans: masaüstü `arama-cubugu` klasörü, 6 ekran görüntüsü)
 *
 * Yapı: sabit yükseklikli büyük panel · üstte tek satır arama kutusu (sağda
 * temizle ✕) · arama BOŞken sekme çipleri + Son kullanılanlar + Popüler ürünler
 * + Trend · arama DOLUyken çipler gizlenir, sonuçlar tür başlıklarıyla gruplanır
 * (Görsel modelleri / Video modelleri / Ses modelleri / Ürünler / Karakterler).
 * Satırlar: kare ikon kutusu + ad + rozet + gri açıklama; aktif satırda ↵ ipucu.
 */

const hizliErisim = [
  { ad: "Oluştur", href: "/panel/gorsel", ikon: Wand2, kat: "Stüdyo" },
  { ad: "Sinema Stüdyosu", href: "/panel/sinema", ikon: Clapperboard, kat: "Stüdyo" },
  { ad: "Pazarlama Stüdyosu", href: "/panel/pazarlama", ikon: Megaphone, kat: "Stüdyo" },
  { ad: "3D Stüdyo", href: "/panel/3d", ikon: Box, kat: "Stüdyo" },
  { ad: "Ses Stüdyosu", href: "/panel/ses", ikon: AudioLines, kat: "Stüdyo" },
  { ad: "Müzik Stüdyosu", href: "/panel/muzik", ikon: Music2, kat: "Stüdyo" },
  { ad: "Montaj Stüdyosu", href: "/panel/montaj", ikon: Combine, kat: "Stüdyo" },
  { ad: "Uzun Video Stüdyosu", href: "/panel/uzun-video", ikon: Film, kat: "Stüdyo" },
  { ad: "Karakterler", href: "/panel/karakter", ikon: UserRound, kat: "Stüdyo" },
  { ad: "Shorts Stüdyo", href: "/panel/shorts", ikon: Scissors, kat: "Stüdyo" },
  { ad: "Explainer Stüdyo", href: "/panel/explainer", ikon: GraduationCap, kat: "Stüdyo" },
  { ad: "Supercomputer", href: "/panel/supercomputer", ikon: Cpu, kat: "Stüdyo" },
  { ad: "AI Influencer", href: "/panel/influencer", ikon: UserRound, kat: "Stüdyo" },
  { ad: "Canvas", href: "/panel/canvas", ikon: Workflow, kat: "Stüdyo" },
  { ad: "MCP & CLI", href: "/panel/mcp", ikon: Terminal, kat: "Stüdyo" },
  { ad: "Vayra Cloud API", href: "/panel/api", ikon: Terminal, kat: "Stüdyo" },
  // Platformlar
  { ad: "Akış", href: "/panel/akis", ikon: Flame, kat: "Platform" },
  { ad: "Keşfet", href: "/kesfet", ikon: LayoutGrid, kat: "Platform" },
  { ad: "Social", href: "/flow", ikon: Flame, kat: "Platform" },
  { ad: "Earn — Para Kazan", href: "/earn", ikon: Coins, kat: "Platform" },
  { ad: "Görevler & Ödüller", href: "/panel/gorevler", ikon: Gift, kat: "Platform" },
  { ad: "Yarışmalar", href: "/earn/yarismalar", ikon: Trophy, kat: "Platform" },
  { ad: "Originals", href: "/panel/originals", ikon: Film, kat: "Platform" },
  { ad: "Kitaplık", href: "/panel/kitaplik", ikon: FolderOpen, kat: "Sayfa" },
  { ad: "Projeler", href: "/panel/projeler", ikon: FolderOpen, kat: "Sayfa" },
  { ad: "Kredi", href: "/panel/kredi", ikon: CreditCard, kat: "Sayfa" },
  { ad: "Ayarlar", href: "/panel/ayarlar", ikon: Settings, kat: "Sayfa" },
  { ad: "Bildirimler", href: "/panel/bildirimler", ikon: Bell, kat: "Sayfa" },
];

// Popüler ürünler — arama boşken gösterilen 3 büyük kart (referans "Popular products").
// gorsel: GERÇEK Seedream görsel arka planı (kartı doldurur, üstünde karartma).
const POPULER_URUNLER = [
  { ad: "SUPERCOMPUTER", etiket: "Ajanlar", etiketIkon: Cpu, ozet: "Yalnızca yanıt değil, harekete geçen AI", href: "/panel/supercomputer", grad: "from-lime-500/45 via-lime-600/15 to-emerald-800/10", gorsel: "/gercek/arama/pop-supercomputer.webp", yeni: true },
  { ad: "MCP & CLI", etiket: "", etiketIkon: null, ozet: "Vayra'yı yaratıcı bir motora dönüştür", href: "/panel/mcp", grad: "from-zinc-500/35 via-zinc-700/15 to-zinc-900/10", gorsel: "/gercek/arama/pop-mcp.webp", yeni: true },
  { ad: "SİNEMA STÜDYOSU 3.5", etiket: "Karakterler", etiketIkon: UserRound, ozet: "Eksiksiz AI prodüksiyon stüdyosu", href: "/panel/sinema", grad: "from-sky-500/40 via-cyan-600/15 to-cyan-900/10", gorsel: "/gercek/arama/pop-sinema.webp", yeni: true },
];

// Son kullanılanlar için zengin katalog (referans "Recents": ikon + ad + açıklama).
const RECENTS_KATALOG: Record<string, { ad: string; ozet: string; ikon: typeof Sparkles; harf?: string }> = {
  "/panel/gorsel": { ad: "Nano Banana Pro", ozet: "Google'ın amiral üretim modeli", ikon: Sparkles, harf: "G" },
  "/panel/canvas": { ad: "Canvas", ozet: "Tek tuvalde tüm iş akışı", ikon: Workflow },
  "/panel/sinema": { ad: "Sinema Stüdyosu", ozet: "Çok yönlü görsel stilleri", ikon: Clapperboard },
  "/panel/video": { ad: "Seedance 2.0 4K", ozet: "Yeni nesil çok-modlu video üretimi", ikon: TrendingUp },
  "/panel/mcp": { ad: "MCP & CLI", ozet: "Üretimini otomatikleştir", ikon: Cpu },
  "/panel/influencer": { ad: "AI Influencer", ozet: "Kendi AI influencer'ını oluştur ve yönet", ikon: UserRound },
  "/panel/pazarlama": { ad: "Pazarlama Stüdyosu", ozet: "Herhangi bir ürünü video reklama dönüştür", ikon: Megaphone },
  "/panel/supercomputer": { ad: "Supercomputer", ozet: "Harekete geçen AI ajanı", ikon: Cpu },
  "/panel/montaj": { ad: "Montaj Stüdyosu", ozet: "Çok katmanlı AI kurgu", ikon: Combine },
  "/panel/uzun-video": { ad: "Uzun Video Stüdyosu", ozet: "1 dk–1 saat çok sahneli video", ikon: Film },
  "/panel/muzik": { ad: "Müzik Stüdyosu", ozet: "Şarkı, beat ve sahne müziği", ikon: Music2 },
  "/panel/3d": { ad: "3D Stüdyo", ozet: "3D karakter, obje ve sahne", ikon: Box },
  "/earn": { ad: "Earn — Para Kazan", ozet: "Görev tamamla, kredi kazan", ikon: Coins },
  "/flow": { ad: "Social", ozet: "Topluluk akışı ve keşif", ikon: Flame },
  "/panel/gorevler": { ad: "Görevler & Ödüller", ozet: "Görev tamamla, gerçek kredi kazan", ikon: Gift },
};
const RECENTS_VARSAYILAN = ["/panel/video", "/panel/montaj"];

// Trend — arama boşken 2-kolon ikon+başlık+alt-metin (referans "Trending").
const TREND = [
  { ad: "Seedance 2.0 4K", ozet: "Yeni nesil çok-modlu video üretimi", ikon: TrendingUp, href: "/panel/video", rozet: "Trend" },
  { ad: "Montaj Stüdyosu", ozet: "AI ile çok katmanlı video kurgu", ikon: Combine, href: "/panel/montaj", rozet: "Yeni" },
  { ad: "Uzun Video Stüdyosu", ozet: "1 dk–1 saat çok sahneli video", ikon: Film, href: "/panel/uzun-video", rozet: "Yeni" },
  { ad: "MCP & CLI", ozet: "Üretimini otomatikleştir", ikon: Terminal, href: "/panel/mcp", rozet: "Yeni" },
  { ad: "AI Influencer", ozet: "Kendi AI influencer'ını oluştur ve yönet", ikon: UserRound, href: "/panel/influencer", rozet: "Trend" },
  { ad: "Earn — Para Kazan", ozet: "Görev tamamla, gerçek kredi kazan", ikon: Coins, href: "/earn" },
];

// Model türü → başlık + ikon (referansta "Image models" / "Audio models" gibi gruplar).
// href: o türün GERÇEK stüdyosu — eskiden her model /panel/olustur'a gidiyordu,
// yani bir ses modeline tıklayınca görsel composer'ı açılıyordu. Artık tür kendi
// stüdyosuna götürür.
const TUR_META: Record<string, { baslik: string; ikon: typeof Sparkles; href: string }> = {
  gorsel: { baslik: "Görsel modelleri", ikon: ImageIcon, href: "/panel/gorsel" },
  video: { baslik: "Video modelleri", ikon: VideoIcon, href: "/panel/video" },
  ses: { baslik: "Ses modelleri", ikon: AudioLines, href: "/panel/ses" },
  muzik: { baslik: "Müzik modelleri", ikon: Music2, href: "/panel/muzik" },
  "3d": { baslik: "3D modelleri", ikon: Box, href: "/panel/3d" },
};
/** Model türünün stüdyo rotası; bilinmeyen tür genel oluşturma ekranına düşer. */
const modelHref = (tur: string) => TUR_META[tur]?.href ?? "/panel/gorsel";

/** Topluluk yaratıcı profili — gerçek rota `/flow/u/[kadi]` (@ olmadan). */
const profilHref = (kullanici: string) => `/flow/u/${kullanici.replace(/^@/, "")}`;

// Sekme boşken gösterilecek tür sırası — modeller her zaman bu sırada gruplanır.
const TUR_SIRA = ["gorsel", "video", "ses", "muzik", "3d"];

// Ürün grubu başlıkları — kategori adı doğrudan başlık olarak kullanılmaz
// ("Sayfa" → "Sayfa sayfaları" gibi kaba birleşimler oluşuyordu).
const SAYFA_GRUP_BASLIK: Record<string, string> = {
  "Ürünler": "Ürünler",
  "Stüdyo": "Stüdyolar",
  "Platform": "Platformlar",
  "Sayfa": "Panel sayfaları",
};

// Element türü → okunur etiket (Karakterler sekmesinde element satırlarının özeti).
const ELEMENT_ETIKET: Record<string, string> = {
  karakter: "Karakter elementi", mekan: "Mekân elementi",
  obje: "Obje elementi", stil: "Stil elementi",
};

/**
 * Arama normalizasyonu — Türkçe I/İ tuzağını çözer.
 * `toLocaleLowerCase("tr")` "AI Influencer"ı "aı ınfluencer" yapar; kullanıcı
 * "inf" yazınca hiçbir şey bulunamıyordu. Türkçe'ye özgü harfleri ASCII'ye
 * indirerek hem "sinema"/"SİNEMA" hem "inf"/"AI" eşleşmesi sağlanır.
 */
function nrm(s: string): string {
  return s
    .replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i")
    .replace(/Ş/g, "s").replace(/ş/g, "s")
    .replace(/Ğ/g, "g").replace(/ğ/g, "g")
    .replace(/Ü/g, "u").replace(/ü/g, "u")
    .replace(/Ö/g, "o").replace(/ö/g, "o")
    .replace(/Ç/g, "c").replace(/ç/g, "c")
    .toLowerCase();
}

/** Rozet görünümü — referansta PREMIUM/TRENDING/NEW/UNLIMITED renkli etiketler. */
function Rozet({ tip }: { tip: string }) {
  const stil =
    tip === "Trend" ? "bg-fusya text-white"
      : tip === "Pro" ? "bg-aksan text-zemin"
        : tip === "Yeni" ? "bg-aksan text-zemin"
          : tip === "Vayra" ? "bg-sky-400/85 text-zemin"
            : tip === "Hızlı" ? "bg-white/15 text-white"
              : "bg-white/15 text-white";
  const yazi = tip === "deger" ? "DEĞER" : tip === "populer" ? "POPÜLER" : tip.toLocaleUpperCase("tr");
  return <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide", stil)}>{yazi}</span>;
}

export function AramaModal({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  const router = useRouter();
  const cikisYap = useAuth((s) => s.cikisYap);
  // GERÇEK veri kaynakları — Karakterler/Topluluk sekmeleri artık uydurma değil.
  // Selector doğrudan dizi döndürür (.filter/.map YOK); türetme aşağıda useMemo
  // ile yapılır, aksi halde her render yeni referans üretip sonsuz döngü olur.
  const tumKarakterler = useKarakterler((s) => s.karakterler);
  const tumElementler = useElements((s) => s.elementler);
  useScrollKilit(acik);
  const [q, setQ] = useState("");
  const [aktif, setAktif] = useState(0);
  const [sekme, setSekme] = useState<"hepsi" | "modeller" | "urunler" | "karakterler" | "topluluk">("hepsi");
  const [sonHrefler, setSonHrefler] = useState<string[]>([]);
  const listeRef = useRef<HTMLDivElement | null>(null);
  const girdiRef = useRef<HTMLInputElement | null>(null);
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => setPortalHazir(true), []);

  useEffect(() => {
    if (!acik) { setQ(""); setAktif(0); setSekme("hepsi"); }
    else { try { setSonHrefler(JSON.parse(localStorage.getItem("vayra-arama-son") || "[]")); } catch { setSonHrefler([]); } }
  }, [acik]);

  const git = (href: string) => {
    try {
      const mevcut: string[] = JSON.parse(localStorage.getItem("vayra-arama-son") || "[]");
      const yeni = [href, ...mevcut.filter((h) => h !== href)].slice(0, 4);
      localStorage.setItem("vayra-arama-son", JSON.stringify(yeni));
    } catch { /* yoksay */ }
    router.push(href); onKapat();
  };

  const sonHrefListe = sonHrefler.length > 0 ? sonHrefler : RECENTS_VARSAYILAN;
  const sonlar = !q
    ? sonHrefListe.map((h) => (RECENTS_KATALOG[h] ? { href: h, ...RECENTS_KATALOG[h] } : null)).filter(Boolean).slice(0, 4) as { href: string; ad: string; ozet: string; ikon: typeof Sparkles; harf?: string }[]
    : [];

  const eylemler = useMemo(() => [
    // Burada proje OLUŞMUYOR, sadece oluşturma ekranına gidiliyor.
    // Eskiden "Yeni proje oluşturuldu" diyordu — yalandı; toast kaldırıldı.
    { ad: "Yeni proje oluştur", ozet: "Boş bir projeyle başla", ikon: Plus, yap: () => git("/panel/gorsel") },
    { ad: "Kredi yükle", ozet: "Bakiyeni artır", ikon: CreditCard, yap: () => git("/panel/kredi") },
    { ad: "Çıkış yap", ozet: "Hesaptan güvenle çık", ikon: LogOut, yap: () => { cikisYap(); toast("Çıkış yapıldı"); router.push("/giris"); onKapat(); } },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [cikisYap, router, onKapat]);

  const ql = nrm(q.trim());
  /**
   * Bir grup GÖRÜNÜR mü?
   *
   * Eskiden "karakterler" ve "topluluk" sekmeleri kendi veri kaynağına sahip
   * olmadığı için ürünlere fallback ediyordu; şimdi her sekmenin gerçek kaynağı
   * var, dolayısıyla eşleme bire bir.
   */
  const g = (grup: "sayfalar" | "modeller" | "urunler" | "karakterler" | "topluluk") =>
    sekme === "hepsi" ||
    (sekme === "modeller" && grup === "modeller") ||
    (sekme === "urunler" && (grup === "urunler" || grup === "sayfalar")) ||
    (sekme === "karakterler" && grup === "karakterler") ||
    (sekme === "topluluk" && grup === "topluluk");

  /**
   * SEKME GEZİNME MODU — bu düzeltmenin özü.
   *
   * Önceden bütün listeler `if (!ql) return []` ile arama metnine bağlıydı ve
   * Popüler/Trend blokları da `sekme === "hepsi"` şartına kilitliydi. Sonuç:
   * "Modeller" çipine basınca liste boş (metin yok) + vitrin gizli (sekme ≠ hepsi)
   * = bomboş panel. Artık metin yoksa bile seçili sekme KENDİ tam içeriğini
   * listeler; sekme çipi bir filtre değil, gezinilebilir bir katalog olur.
   */
  const gezinme = !ql && sekme !== "hepsi";
  /** Metin varsa filtrele, sekme gezinmesinde tümünü göster. */
  const suz = <T,>(liste: T[], alanlar: (x: T) => (string | undefined)[]) =>
    ql ? liste.filter((x) => alanlar(x).some((a) => nrm(a ?? "").includes(ql))) : liste;

  // Modeller TÜRE GÖRE gruplanır (referans birebir: "Görsel modelleri" / "Ses modelleri"…)
  // Gezinme modunda tür başına limit yok — 64 modelin tamamı kaydırılarak görülür.
  const modelGruplari = useMemo(() => {
    if (!g("modeller") || (!ql && !gezinme)) return [] as { tur: string; liste: typeof MODELLER }[];
    const bulunan = ql
      ? MODELLER.filter((m) =>
          nrm(m.ad).includes(ql) ||
          nrm(m.saglayici ?? "").includes(ql) ||
          nrm(m.aciklama ?? "").includes(ql))
      : MODELLER;
    return TUR_SIRA
      .map((t) => {
        const liste = bulunan.filter((m) => m.tur === t);
        return { tur: t, liste: ql ? liste.slice(0, 8) : liste };
      })
      .filter((x) => x.liste.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ql, sekme, gezinme]);

  // ÜRÜNLER — stüdyo/platform/sayfa girişleri. Gezinmede kategoriye bölünür.
  const sayfalar = g("sayfalar") && (ql || gezinme)
    ? suz(hizliErisim, (s) => [s.ad, s.kat])
    : [];
  const sayfaGruplari = useMemo(() => {
    if (sayfalar.length === 0) return [] as { kat: string; liste: typeof hizliErisim }[];
    // Arama yapılırken tek "Ürünler" grubu kalsın (referans davranışı); gezinmede
    // Stüdyo / Platform / Sayfa olarak ayrılır ki 29 giriş okunabilir olsun.
    if (ql) return [{ kat: "Ürünler", liste: sayfalar }];
    return ["Stüdyo", "Platform", "Sayfa"]
      .map((k) => ({ kat: k, liste: sayfalar.filter((s) => s.kat === k) }))
      .filter((x) => x.liste.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sayfalar, ql]);

  const uygulamalar = g("urunler") && (ql || gezinme)
    ? (ql ? suz(UYGULAMALAR, (u) => [u.ad, u.kategori, u.ozet]).slice(0, 6) : UYGULAMALAR)
    : [];

  // KARAKTERLER — gerçek kullanıcı karakterleri (useKarakterler) + Elementler.
  const karakterler = g("karakterler") && (ql || gezinme)
    ? suz(tumKarakterler, (k) => [k.ad, k.model])
    : [];
  const elementler = g("karakterler") && (ql || gezinme)
    ? suz(tumElementler, (e) => [e.ad, e.aciklama, e.tur])
    : [];

  // TOPLULUK — gerçek akış gönderileri + yaratıcı profilleri (akisVeri).
  const gonderiler = g("topluluk") && (ql || gezinme)
    ? suz(AKIS_TOHUM, (p) => [p.baslik, p.aciklama, p.kullanici, p.model, ...p.etiketler]).slice(0, ql ? 8 : 24)
    : [];
  const yaraticilar = g("topluluk") && (ql || gezinme)
    ? suz(AKIS_PROFILLER, (p) => [p.ad, p.kullanici, p.bio, ...p.rozetler]).slice(0, ql ? 6 : 20)
    : [];

  const eylemFiltre = ql && sekme === "hepsi" ? eylemler.filter((e) => nrm(e.ad).includes(ql)) : [];
  const modelSayi = modelGruplari.reduce((a, x) => a + x.liste.length, 0);
  // Toplam sonuç — hem arama hem sekme gezinmesi için tek sayaç.
  const toplamSonuc = modelSayi + sayfalar.length + uygulamalar.length + eylemFiltre.length
    + karakterler.length + elementler.length + gonderiler.length + yaraticilar.length;
  const bosSonuc = !!ql && toplamSonuc === 0;
  // Sekme gezinmesinde hiç veri yoksa (ör. hiç karakter oluşturulmamış) arama
  // "sonuç yok" demek yanlış olur — kullanıcıyı üretmeye yönlendiren kendi
  // boş durumu gösterilir.
  const bosSekme = gezinme && toplamSonuc === 0;
  // Boş sekmede gösterilecek yönlendirme metni (sekmeye özgü).
  const bosSekmeMetin = sekme === "karakterler"
    ? { baslik: "Henüz karakterin yok", ozet: "Kendi tutarlı karakterini eğit, tüm üretimlerde kullan.", buton: "Karakter oluştur", href: "/panel/karakter" }
    : { baslik: "Topluluk boş görünüyor", ozet: "Akışa göz at, yaratıcıları keşfet.", buton: "Akışı aç", href: "/flow" };

  const sekmeler: { id: typeof sekme; ad: string; ikon?: typeof Sparkles }[] = [
    { id: "hepsi", ad: "Tümü" },
    { id: "modeller", ad: "Modeller", ikon: Sparkles },
    { id: "urunler", ad: "Ürünler", ikon: SlidersHorizontal },
    { id: "karakterler", ad: "Karakterler", ikon: UserRound },
    { id: "topluluk", ad: "Topluluk", ikon: Users },
  ];
  // Diğer Vayra platformları — arama boşken sekme şeridinde dış bağlantı çipleri.
  const disBaglantilar: { ad: string; href: string; ikon: typeof LayoutGrid; renk?: string }[] = [
    // Renkler logo menüsündeki platform kimliğiyle aynı (UstNav LOGO_MENU):
    // Earn yeşil, Social pembe.
    { ad: "Earn", href: "/earn", ikon: Coins, renk: "text-green-400" },
    { ad: "Social", href: "/flow", ikon: Flame, renk: "text-pink-400" },
    { ad: "Originals", href: "/panel/originals", ikon: Film },
  ];

  // Klavye navigasyonu için düz liste — SIRA, aşağıdaki render sırasıyla
  // birebir aynı olmalı; yoksa ↓/↵ yanlış satırı açar.
  const duzListe: (() => void)[] = [
    ...sonlar.map((s) => () => git(s.href)),
    ...modelGruplari.flatMap((grup) => grup.liste.map((m) => () => git(modelHref(m.tur)))),
    ...sayfaGruplari.flatMap((grup) => grup.liste.map((s) => () => git(s.href))),
    ...uygulamalar.map(() => () => git("/panel/gorsel")),
    ...karakterler.map(() => () => git("/panel/karakter")),
    ...elementler.map(() => () => git("/panel/element")),
    ...yaraticilar.map((p) => () => git(profilHref(p.kullanici))),
    ...gonderiler.map(() => () => git("/flow")),
    ...eylemFiltre.map((e) => e.yap),
  ];

  useEffect(() => { setAktif(0); }, [q, sekme]);

  useEffect(() => {
    if (!acik) return;
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onKapat(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setAktif((i) => Math.min(i + 1, duzListe.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setAktif((i) => Math.max(i - 1, 0)); }
      else if (e.key === "Enter") { e.preventDefault(); duzListe[aktif]?.(); }
    };
    document.addEventListener("keydown", tus);
    return () => document.removeEventListener("keydown", tus);
  }, [acik, onKapat, duzListe, aktif]);

  useEffect(() => {
    const el = listeRef.current?.querySelector(`[data-idx="${aktif}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [aktif]);

  let idx = -1;
  const sonrakiIdx = () => ++idx;

  if (!portalHazir) return null;

  /* PORTAL ZORUNLU: modal <header> içinde çağrılıyor ve o header
     `sticky + z-40 + backdrop-blur-xl` taşıyor. backdrop-filter'lı ata kendi
     stacking + filter bağlamını kurar; içteki blur sayfayı GÖREMEZ. body'ye
     taşıyınca blur gerçek sayfayı örnekler. */
  return createPortal(
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[10vh]">
          {/* Arka plan: blur Apple Spotlight gibi YUMUŞAK gelir (0→28px) */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px) saturate(100%)" }}
            animate={{ opacity: 1, backdropFilter: "blur(28px) saturate(150%)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px) saturate(100%)" }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 bg-black/50" onClick={onKapat} />
          <motion.div
            /* APPLE SPOTLIGHT AÇILIŞI: yukarıdan hafif düşerek, aşağıdan
               büyüyerek gelir (transformOrigin top) + yumuşak spring.
               Kapanış daha hızlı ve kısa mesafeli — Apple'ın asimetrik ritmi. */
            initial={{ opacity: 0, scale: 0.94, y: -18, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.97, y: -8, filter: "blur(3px)", transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.9 }}
            style={{ transformOrigin: "top center" }}
            /* SABİT YÜKSEK PANEL (referans birebir): içerik azken bile panel
               büzülmez — Spotlight gibi hep aynı boyda durur. */
            className="menu-surface relative flex h-[min(76vh,760px)] w-full max-w-3xl flex-col overflow-hidden rounded-[22px]"
          >
            {/* ── ARAMA KUTUSU — tek satır, sağda temizle ✕ (referans birebir) ── */}
            <div className="flex shrink-0 items-center gap-3 px-5 py-4">
              <Search className="h-[19px] w-[19px] shrink-0 text-white/40" strokeWidth={2} />
              {/* Yazmaya başlayınca sekme kilidi KALKAR: sekme çipleri arama sırasında
                  gizlendiği için dar bir sekmede (ör. Topluluk) kalmak kullanıcıyı
                  kilitliyordu — "veo" yazınca Veo modeli hiç görünmüyordu. */}
              <input ref={girdiRef} autoFocus value={q}
                onChange={(e) => { setQ(e.target.value); if (e.target.value.trim() && sekme !== "hepsi") setSekme("hepsi"); }}
                placeholder="Ara"
                className="h-7 min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/35" />
              {q ? (
                <button onClick={() => { setQ(""); girdiRef.current?.focus(); }} aria-label="Aramayı temizle"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/[0.16] hover:text-white">
                  <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
              ) : (
                <kbd className="shrink-0 rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[11px] text-white/40">ESC</kbd>
              )}
            </div>

            {/* ── SEKME ÇİPLERİ — yalnız arama BOŞken (referans birebir) ──
                Yazmaya başlayınca yukarı kayarak yumuşakça kapanır (Apple). */}
            <AnimatePresence initial={false}>
            {!ql && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                className="flex shrink-0 flex-wrap items-center gap-1.5 overflow-hidden px-4 pb-3">
                {sekmeler.map((s) => {
                  const seciliMi = sekme === s.id;
                  return (
                    <button key={s.id} onClick={() => { setSekme(s.id); setAktif(0); }}
                      className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                        seciliMi ? "bg-white text-black" : "bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white")}>
                      {s.ikon && <s.ikon className="h-3.5 w-3.5" strokeWidth={2} />}
                      {s.ad}
                    </button>
                  );
                })}
                {disBaglantilar.map((d) => (
                  <button key={d.ad} onClick={() => git(d.href)}
                    className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/[0.1] hover:text-white">
                    <d.ikon className={cn("h-3.5 w-3.5", d.renk ?? "text-white/50")} strokeWidth={2} />
                    {d.ad}
                    <ArrowUpRight className="h-3.5 w-3.5 text-white/35" strokeWidth={2} />
                  </button>
                ))}
              </motion.div>
            )}
            </AnimatePresence>

            {/* ── SONUÇ ALANI ── */}
            <div ref={listeRef} className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {bosSonuc ? (
                /* Boş durum — ortada ikon + "… ile eşleşen yok" (referans birebir) */
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                  className="flex h-full flex-col items-center justify-center gap-2.5 text-white/35">
                  <Search className="h-6 w-6" strokeWidth={1.8} />
                  <p className="text-[14px]">&quot;{q}&quot; ile eşleşen bir şey yok</p>
                </motion.div>
              ) : bosSekme ? (
                /* Sekmede henüz hiç veri yok (ör. karakter oluşturulmamış) —
                   "sonuç yok" demek yanlış olur; üretmeye yönlendirilir. */
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                  className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white/45">
                    {sekme === "karakterler" ? <UserRound className="h-6 w-6" strokeWidth={1.7} /> : <Users className="h-6 w-6" strokeWidth={1.7} />}
                  </span>
                  <div>
                    <p className="text-[14px] font-medium text-white/70">{bosSekmeMetin.baslik}</p>
                    <p className="mt-0.5 text-[12.5px] text-white/40">{bosSekmeMetin.ozet}</p>
                  </div>
                  <button onClick={() => git(bosSekmeMetin.href)}
                    className="mt-1 flex items-center gap-1.5 rounded-full bg-aksan px-4 py-2 text-[13px] font-semibold text-zemin transition-opacity hover:opacity-90">
                    {bosSekmeMetin.buton}
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Son kullanılanlar */}
                  {sonlar.length > 0 && !ql && sekme === "hepsi" && (
                    <Grup baslik="Son kullanılanlar">
                      {sonlar.map((s) => { const bu = sonrakiIdx(); return (
                        <Satir key={"son-" + s.href} idx={bu} aktif={aktif === bu}
                          ikon={<s.ikon className="h-[18px] w-[18px]" strokeWidth={1.9} />} harf={s.harf}
                          ad={s.ad} ozet={s.ozet} onClick={() => git(s.href)} />
                      ); })}
                    </Grup>
                  )}

                  {/* Popüler ürünler + Trend — sadece arama boşken */}
                  {!ql && sekme === "hepsi" && (
                    <>
                      <div className="mb-2">
                        <div className="flex items-center justify-between px-3 py-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">Popüler ürünler</p>
                          <button onClick={() => git("/panel/gorsel")} className="text-[11px] text-aksan hover:underline">Tümünü gör</button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 px-2">
                          {POPULER_URUNLER.map((p) => (
                            <button key={p.ad} onClick={() => git(p.href)}
                              className={cn("group relative flex aspect-[16/9] flex-col justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br p-3 text-left transition-transform hover:scale-[1.02]", p.grad)}>
                              {/* GERÇEK görsel arka plan — hover'da hafif yakınlaşır */}
                              {p.gorsel && (
                                <img src={p.gorsel} alt="" aria-hidden
                                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-105" />
                              )}
                              <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/40" />
                              <div className="relative flex items-center justify-between gap-1">
                                {p.etiket ? (
                                  <span className="flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[9px] font-medium text-white/85 backdrop-blur-sm">
                                    {p.etiketIkon && <p.etiketIkon className="h-2.5 w-2.5" strokeWidth={2.2} />}{p.etiket}
                                  </span>
                                ) : <span />}
                                {p.yeni && <span className="rounded bg-aksan px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-zemin">YENİ</span>}
                              </div>
                              <div className="relative">
                                <p className="flex items-center gap-0.5 text-[13px] font-bold leading-tight text-white">
                                  {p.ad}<ArrowUpRight className="h-3 w-3 shrink-0 opacity-70" strokeWidth={2.4} />
                                </p>
                                <p className="mt-0.5 line-clamp-1 text-[10px] text-white/65">{p.ozet}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-1">
                        <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/35">Trend</p>
                        <div className="grid grid-cols-2 gap-1">
                          {TREND.map((t) => (
                            <button key={t.ad} onClick={() => git(t.href)}
                              className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/[0.07]">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-white/85"><t.ikon className="h-4 w-4" /></span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5">
                                  <span className="truncate text-[13px] font-medium text-white">{t.ad}</span>
                                  {t.rozet && <Rozet tip={t.rozet} />}
                                </span>
                                <span className="block truncate text-[10.5px] text-white/45">{t.ozet}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* MODELLER — türe göre gruplu (referans birebir).
                      Tıklama artık türün GERÇEK stüdyosuna gider. */}
                  {modelGruplari.map((grup) => {
                    const meta = TUR_META[grup.tur];
                    return (
                      <Grup key={grup.tur} baslik={meta?.baslik ?? "Modeller"} sayi={grup.liste.length}>
                        {grup.liste.map((m) => { const bu = sonrakiIdx(); return (
                          <Satir key={m.id} idx={bu} aktif={aktif === bu}
                            ikon={meta ? <meta.ikon className="h-[18px] w-[18px]" strokeWidth={1.9} /> : <Sparkles className="h-[18px] w-[18px]" />}
                            ad={m.ad} rozet={m.rozet}
                            ozet={`${m.saglayici} · ${m.kredi} kredi — ${m.aciklama}`}
                            onClick={() => git(modelHref(m.tur))} />
                        ); })}
                      </Grup>
                    );
                  })}

                  {/* ÜRÜNLER — aramada tek grup, sekme gezinmesinde Stüdyo/Platform/Sayfa */}
                  {sayfaGruplari.map((grup) => (
                    <Grup key={grup.kat} baslik={SAYFA_GRUP_BASLIK[grup.kat] ?? grup.kat} sayi={grup.liste.length}>
                      {grup.liste.map((s) => { const bu = sonrakiIdx(); return (
                        <Satir key={s.href} idx={bu} aktif={aktif === bu}
                          ikon={<s.ikon className="h-[18px] w-[18px]" strokeWidth={1.9} />}
                          ad={s.ad} ozet={s.kat === "Stüdyo" ? "Vayra stüdyosu" : s.kat === "Platform" ? "Vayra platformu" : "Panel sayfası"}
                          onClick={() => git(s.href)} />
                      ); })}
                    </Grup>
                  ))}

                  {/* UYGULAMALAR */}
                  {uygulamalar.length > 0 && (
                    <Grup baslik="Uygulamalar" sayi={uygulamalar.length}>
                      {uygulamalar.map((u) => { const bu = sonrakiIdx(); return (
                        <Satir key={u.id} idx={bu} aktif={aktif === bu}
                          ikon={<LayoutGrid className="h-[18px] w-[18px]" strokeWidth={1.9} />}
                          ad={u.ad} ozet={`${u.kategori} · ${u.kredi} kredi — ${u.ozet}`}
                          onClick={() => git("/panel/gorsel")} />
                      ); })}
                    </Grup>
                  )}

                  {/* KARAKTERLER — kullanıcının GERÇEK karakterleri (useKarakterler) */}
                  {karakterler.length > 0 && (
                    <Grup baslik="Karakterlerim" sayi={karakterler.length}>
                      {karakterler.map((k) => { const bu = sonrakiIdx(); return (
                        <Satir key={k.id} idx={bu} aktif={aktif === bu}
                          ikon={<UserRound className="h-[18px] w-[18px]" strokeWidth={1.9} />}
                          ad={k.ad}
                          rozet={k.durum === "hazir" ? "Hazır" : k.durum === "egitiliyor" ? "Eğitiliyor" : undefined}
                          ozet={k.durum === "egitiliyor"
                            ? `${k.model} · eğitim %${Math.round(k.ilerleme)}`
                            : `${k.model} · ${k.fotolar.length} fotoğraf`}
                          onClick={() => git("/panel/karakter")} />
                      ); })}
                    </Grup>
                  )}

                  {/* Karakteri olmayan kullanıcı Karakterler sekmesine girdiğinde
                      elementler dolu ama "karakterlerim" bölümü boş kalıyor;
                      sekmeyi yönlendirici kılan tek satırlık çağrı eklenir. */}
                  {gezinme && sekme === "karakterler" && karakterler.length === 0 && (
                    <Grup baslik="Karakterlerim">
                      <button onClick={() => git("/panel/karakter")}
                        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-white/[0.14] px-3 py-2.5 text-left transition-colors hover:border-white/25 hover:bg-white/[0.04]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-white/60">
                          <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-medium text-white">Karakter oluştur</span>
                          <span className="block truncate text-[11.5px] text-white/45">Kendi tutarlı karakterini eğit, tüm üretimlerde kullan</span>
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/35" strokeWidth={2} />
                      </button>
                    </Grup>
                  )}

                  {/* ELEMENTLER — @mention karakter/mekân/obje/stil (useElements) */}
                  {elementler.length > 0 && (
                    <Grup baslik="Elementler" sayi={elementler.length}>
                      {elementler.map((e) => { const bu = sonrakiIdx(); return (
                        <Satir key={e.id} idx={bu} aktif={aktif === bu}
                          ikon={<Sparkles className="h-[18px] w-[18px]" strokeWidth={1.9} />}
                          ad={"@" + e.ad}
                          ozet={`${ELEMENT_ETIKET[e.tur] ?? "Element"} · ${e.kullanim} üretimde kullanıldı`}
                          onClick={() => git("/panel/element")} />
                      ); })}
                    </Grup>
                  )}

                  {/* TOPLULUK — gerçek yaratıcılar + gönderiler (akisVeri) */}
                  {yaraticilar.length > 0 && (
                    <Grup baslik="Yaratıcılar" sayi={yaraticilar.length}>
                      {yaraticilar.map((p) => { const bu = sonrakiIdx(); return (
                        <Satir key={p.kullanici} idx={bu} aktif={aktif === bu}
                          ikon={<UserRound className="h-[18px] w-[18px]" strokeWidth={1.9} />}
                          ad={p.ad} rozet={p.dogrulanmis ? "Vayra" : undefined}
                          ozet={`${p.kullanici} · ${kisaSayi(p.takipci)} takipçi — ${p.bio}`}
                          onClick={() => git(profilHref(p.kullanici))} />
                      ); })}
                    </Grup>
                  )}
                  {gonderiler.length > 0 && (
                    <Grup baslik="Topluluk gönderileri" sayi={gonderiler.length}>
                      {gonderiler.map((p) => { const bu = sonrakiIdx(); return (
                        <Satir key={p.id} idx={bu} aktif={aktif === bu}
                          ikon={p.tur === "video"
                            ? <VideoIcon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                            : <ImageIcon className="h-[18px] w-[18px]" strokeWidth={1.9} />}
                          ad={p.baslik}
                          ozet={`${p.kullanici} · ${kisaSayi(p.begeniTohum)} beğeni · ${p.model}`}
                          onClick={() => git("/flow")} />
                      ); })}
                    </Grup>
                  )}

                  {/* EYLEMLER */}
                  {eylemFiltre.length > 0 && (
                    <Grup baslik="Eylemler">
                      {eylemFiltre.map((e) => { const bu = sonrakiIdx(); return (
                        <Satir key={e.ad} idx={bu} aktif={aktif === bu}
                          ikon={<e.ikon className="h-[18px] w-[18px]" strokeWidth={1.9} />}
                          ad={e.ad} ozet={e.ozet} onClick={e.yap} />
                      ); })}
                    </Grup>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Grup — sonuç grubu yumuşakça aşağıdan belirir (Apple kademeli beliriş).
 *  sayi: başlık yanında kaç öğe olduğunu gösterir (uzun kataloglarda konum hissi). */
function Grup({ baslik, sayi, children }: { baslik: string; sayi?: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      className="mb-1">
      <p className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/35">
        {baslik}
        {typeof sayi === "number" && sayi > 0 && (
          <span className="rounded bg-white/[0.07] px-1.5 py-px text-[10px] font-semibold tabular-nums text-white/45">{sayi}</span>
        )}
      </p>
      {children}
    </motion.div>
  );
}

/**
 * Sonuç satırı (referans birebir): kare ikon kutusu · ad + rozet · gri açıklama ·
 * aktif/hover'da sağda ↵ ipucu.
 */
function Satir({ ikon, harf, ad, ozet, rozet, onClick, idx, aktif }: {
  ikon: React.ReactNode; harf?: string; ad: string; ozet?: string; rozet?: string;
  onClick: () => void; idx?: number; aktif?: boolean;
}) {
  return (
    <motion.button data-idx={idx} onClick={onClick}
      /* Apple mikro-etkileşim: basınca hafif içeri çöker, seçiliyken ikon
         kutusu belirginleşir. layout=false — liste sıçramasın. */
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 600, damping: 30 }}
      className={cn("group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-150",
        aktif ? "bg-white/[0.08]" : "hover:bg-white/[0.06]")}>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 transition-all duration-200",
        aktif ? "bg-white/[0.13] scale-[1.04]" : "bg-white/[0.07] group-hover:bg-white/[0.1]")}>
        {harf ? <span className="text-[15px] font-semibold">{harf}</span> : ikon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13.5px] font-medium text-white">{ad}</span>
          {rozet && <Rozet tip={rozet} />}
        </span>
        {ozet && <span className="block truncate text-[11.5px] text-white/45">{ozet}</span>}
      </span>
      <CornerDownLeft className={cn("h-3.5 w-3.5 shrink-0 transition-all duration-200",
        aktif ? "translate-x-0 text-white/45 opacity-100" : "-translate-x-1 text-white/35 opacity-0 group-hover:translate-x-0 group-hover:opacity-100")} strokeWidth={2} />
    </motion.button>
  );
}
