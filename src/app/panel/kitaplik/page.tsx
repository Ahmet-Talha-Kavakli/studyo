"use client";

/**
 * Varlık Kitaplığı — Higgsfield /asset/all sayfasının birebir Türkçe klonu.
 *
 * KAYNAK: gerçek üretimler (useProjeler.uretimler) — statik/sahte veri YOK.
 * ORTAK PROJE: sol sidebar'daki "Projeler" bölümü useProje.projeler'den beslenir;
 * bir projeye tıklayınca o projenin varlıkları (uretimIdler + shortsKlipleri) filtrelenir
 * (Higgsfield'ın "klasör/collection" mantığının ortak-proje karşılığı).
 *
 * Bölümler:
 *  • Sol sidebar: Ara + Tüm Varlıklar/Favoriler + Araçlar(Görsel/Video/Ses/3D) + Projeler + "+"
 *  • Grid: tarihe göre gruplu (Bugün/Dün/…); grup başlığında toplu-seç checkbox; sağ üstte boyut slider
 *  • Kart: hover checkbox(sol-üst) + ⋯(sağ-üst) + kalp/indir(sol-alt/sağ-alt); video ▶; ses dalga
 *  • Seçim barı: floating "N seçildi" + İndir/Tümünü yayınla/Klasöre ekle/♡/🗑/✕
 *  • Detay lightbox: sol büyük medya + sağ panel (Bilgi/Araçlar/Yorumlar) + Yeniden Oluştur CTA + araç listesi
 *
 * SSR güvenli: "Bugün/Dün" gibi göreli tarih etiketleri yalnız mount sonrası (istemci) hesaplanır.
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Images, Heart, ImageIcon, Video, AudioLines, Box, ChevronDown, ChevronRight, ChevronLeft, Plus,
  Folder, Check, Download, FolderPlus, Trash2, X, AlertTriangle, Maximize2, Share2, Link2, MessageCircle,
  Sparkles, RefreshCw, Info as InfoIcon, Wand2, Copy, UploadCloud, Play, Crop, Layers, SunMedium, Eraser,
  Square, LayoutGrid, Film, Presentation, Megaphone, Users, Mic, Clapperboard,
  Clock3, ArrowDownUp,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";
import { aracArka } from "@/lib/gercekVeri";
import { uretimIndir, topluIndir } from "@/lib/gercekEylem";
import { kopyala, baglantiyiKopyala } from "@/lib/gercekEylem";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useReferansKopru } from "@/store/useReferansKopru";
import { useProje } from "@/store/useSinema";
import { useAuth } from "@/store/useAuth";
import { AkistaPaylasModal } from "@/components/panel/akis/AkistaPaylasModal";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";

/* ------------------------------------------------------------------ */
/*  Türler + tarih yardımcıları                                        */
/* ------------------------------------------------------------------ */

type Filtre =
  | "tumu" | "favori" | "gorsel" | "video" | "ses" | "3d"
  // Higgsfield birebir: araç/ürün bazlı ek filtreler
  | "shorts" | "explainer" | "pazarlama" | "karakter" | "lipsync";

const BASLIKLAR: Record<Filtre, string> = {
  tumu: "Tüm Varlıklar",
  favori: "Favoriler",
  gorsel: "Görseller",
  video: "Videolar",
  ses: "Ses",
  "3d": "3D Modeller",
  shorts: "Shorts Stüdyosu",
  explainer: "Explainer",
  pazarlama: "Pazarlama Stüdyosu",
  karakter: "Karakterler",
  lipsync: "Lipsync",
};

/** Üretimin `arac` alanına göre Higgsfield ürün-filtresini belirle (yalnız araç-bazlı
    filtreler için; tür-bazlı gorsel/video/ses/3d ayrı `uretimTuru()` ile çözülür). */
function aracFiltresi(u: Uretim): Exclude<Filtre, "tumu" | "favori" | "gorsel" | "video" | "ses" | "3d"> | null {
  const a = (u.arac ?? "").toLowerCase();
  if (a.includes("shorts")) return "shorts";
  if (a.includes("explainer")) return "explainer";
  if (a.includes("pazarlama") || a.includes("marketing")) return "pazarlama";
  if (a.includes("karakter") || a.includes("influencer") || a.includes("character")) return "karakter";
  if (a.includes("konuştur") || a.includes("konustur") || a.includes("lipsync") || a.includes("fans") || a.includes("dudak")) return "lipsync";
  return null;
}

const AY_ADLARI = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/** Timestamp → gün anahtarı (YYYY-MM-DD, yerel). SSR-relatif değil; sabit. */
function gunAnahtari(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
/** Gün anahtarını göreli/mutlak Türkçe etikete çevirir (Bugün/Dün/D MMMM YYYY). */
function gunEtiketi(ts: number, bugunKey: string, dunKey: string): string {
  const key = gunAnahtari(ts);
  if (key === bugunKey) return "Bugün";
  if (key === dunKey) return "Dün";
  const d = new Date(ts);
  return `${d.getDate()} ${AY_ADLARI[d.getMonth()]} ${d.getFullYear()}`;
}

/** Üretimin kitaplık türü (3d ayrı; ses/video/gorsel). */
function uretimTuru(u: Uretim): Filtre {
  if (u.tur === "video") return "video";
  if (u.tur === "ses") return "ses";
  if (u.tur === "3d") return "3d";
  return "gorsel";
}
/** Kartın arka planı: gerçek görsel varsa onu, yoksa deterministik stok gradyanı. */
function kartArka(u: Uretim): string {
  const gorsel = saltUrl(u.gorselUrl) || saltUrl(u.thumbnailUrl);
  if (gorsel) return `center/cover no-repeat url("${gorsel}")`;
  // gorselUrl zaten onizlemeArka çıktısı (CSS background string) olabilir
  if (u.gorselUrl && !u.gorselUrl.startsWith("http") && !u.gorselUrl.startsWith("data:") && !u.gorselUrl.startsWith("/")) return u.gorselUrl;
  const kat = u.tur === "video" ? "sinematik" : u.tur === "3d" ? "3d" : u.tur === "ses" ? "soyut" : "portre";
  return onizlemeArka((u.prompt || u.baslik) + u.model, kat);
}

/** Proje klasör ikonu — Higgsfield birebir: proje TÜRÜNE göre farklı ikon/renk
    (film şeridi 🎬 = sinema/video projesi, mavi klasör = genel, mor kutu = 3D…). */
function projeIkonu(p: { kaynakStudyo?: string; tur?: string; ad?: string }): { ikon: typeof Folder; renk: string } {
  const k = `${p.kaynakStudyo ?? ""} ${p.tur ?? ""} ${p.ad ?? ""}`.toLowerCase();
  if (/sinema|cinema|film|shorts|video|montaj|klip/.test(k)) return { ikon: Clapperboard, renk: "#a78bfa" };
  if (/ses|müzik|muzik|audio|music|lipsync|konuştur|konustur/.test(k)) return { ikon: AudioLines, renk: "#f0a441" };
  if (/görsel|gorsel|image|foto|karakter|portre/.test(k)) return { ikon: ImageIcon, renk: "#4fd1a5" };
  if (/3d|model|mesh/.test(k)) return { ikon: Box, renk: "#f2778f" };
  return { ikon: Folder, renk: "#5fa8f5" };
}

/* ------------------------------------------------------------------ */
/*  Sidebar nav satırı                                                 */
/* ------------------------------------------------------------------ */

function NavSatir({ ikon: Ikon, etiket, sayi, aktif, onClick, ikonRenk, testId, sifirGizle }: {
  ikon: typeof Images; etiket: string; sayi: number; aktif?: boolean; onClick?: () => void;
  ikonRenk?: string; testId?: string;
  /** Higgsfield birebir: boş klasörlerde sayı hiç yazılmaz (araç satırlarında 0 gösterilir). */
  sifirGizle?: boolean;
}) {
  return (
    /* Görsel referans (2026-07-29): 40px satır, aktif = belirgin dolu koyu kutu
       (#1e1e1e) beyaz metin+ikon; SAYAÇ her zaman koyu HAP içinde, sağa hizalı. */
    <button onClick={onClick} data-test={testId} title={etiket}
      className={cn("flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[15px] transition-colors",
        aktif ? "bg-[#1f1f22] font-semibold text-white" : "text-metin-2 hover:bg-white/[0.05] hover:text-metin")}>
      <Ikon className={cn("h-[18px] w-[18px] shrink-0", ikonRenk ? "" : aktif ? "text-white" : "text-metin-2")}
        style={ikonRenk ? { color: ikonRenk } : undefined} strokeWidth={2} />
      <span className="flex-1 truncate text-left">{etiket}</span>
      {!(sifirGizle && sayi === 0) && (
        <span className="shrink-0 rounded-[7px] bg-white/[0.06] px-2 py-0.5 text-[12.5px] font-medium tabular-nums text-metin-3">{sayi}</span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Varlık kartı                                                       */
/* ------------------------------------------------------------------ */

function VarlikKart({
  u, boyut, secili, secimAktif, onToggle, onAc, onFavori, onIndir, onSil, onKlasor, onPaylas, onAkis,
}: {
  u: Uretim; boyut: number; secili: boolean; secimAktif: boolean;
  onToggle: () => void; onAc: () => void; onFavori: () => void; onIndir: () => void; onSil: () => void; onKlasor: () => void; onPaylas: () => void; onAkis: () => void;
}) {
  const hata = u.durum === "hata";
  const oynatilir = u.tur === "video";
  const ses = u.tur === "ses";
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [paylasAlt, setPaylasAlt] = useState(false);
  const arka = useMemo(() => kartArka(u), [u]);
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => setPortalHazir(true), []);

  // Paylaşım kanalları — eskiden üçü de aynı onPaylas()'ı çağırıp "Bağlantı kopyalandı"
  // diyordu; X ve WhatsApp hiçbir şey paylaşmıyordu. Artık gerçek intent URL'leri.
  const paylasBaglanti = () => (typeof window !== "undefined" ? `${window.location.origin}/kesfet?u=${u.id}` : "");
  const paylasSecenekleri: { ad: string; ikon: typeof Link2; eylem: () => void }[] = [
    { ad: "Bağlantıyı kopyala", ikon: Link2, eylem: onPaylas },
    { ad: "X'te paylaş", ikon: X, eylem: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(u.baslik)}&url=${encodeURIComponent(paylasBaglanti())}`, "_blank") },
    { ad: "WhatsApp'ta paylaş", ikon: MessageCircle, eylem: () => window.open(`https://wa.me/?text=${encodeURIComponent(u.baslik + " " + paylasBaglanti())}`, "_blank") },
  ];

  return (
    <motion.div
      layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.22 }}
      /* `kt-kart`: Higgsfield varlık ızgarası DÜZ döşemedir — gölge yok,
         hover'da zıplama yok. (Eski `hf-kart` 20px radius + 4 katmanlı gölge
         + translateY hover basıyordu; kartlar havada yüzüyor gibi duruyordu.)
         Seçim çerçevesi LIME değil MAVİ — lime yalnız marka rengi. */
      /* Mobilde genişlik/yükseklik ızgaradan gelir (w-full + aspect), masaüstünde
         zoom slider'ının px değeri geçerlidir; bu yüzden ölçüler md'den itibaren
         devreye giren `md:w-[var(--kt-boyut)]` ile veriliyor. */
      className={cn("kt-kart group/kart relative w-full cursor-pointer overflow-hidden",
        "aspect-[1/1.32] md:aspect-auto md:h-[var(--kt-yuk)] md:w-[var(--kt-boyut)] md:shrink-0",
        secili && "ring-2 ring-[#3F84ED]")}
      style={{
        ["--kt-boyut" as string]: `${boyut}px`,
        ["--kt-yuk" as string]: `${Math.round(boyut * 1.32)}px`,
        background: hata ? "#1c1e21" : arka,
      }}
      onClick={() => { if (secimAktif) onToggle(); else onAc(); }}
      onContextMenu={(e) => { if (hata) return; e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); }}
    >
      {/* Bağlam menüsü — PORTAL zorunlu: kart hem `overflow-hidden` hem de bir
          motion.div (canlı CSS transform). Transformlu ata, `position:fixed`i bile
          kendine göreli yapar; menü yanlış yerde açılır ve karta kırpılır. */}
      {menu && portalHazir && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); setMenu(null); }} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
          <div onClick={(e) => e.stopPropagation()}
            style={{ position: "fixed", top: Math.min(menu.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 280), left: Math.min(menu.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 210) }}
            className="menu-surface z-[61] w-52 rounded-xl p-1.5">
            <MenuOge ikon={Maximize2} ad="Aç" onClick={() => { onAc(); setMenu(null); }} />
            <button onClick={() => { onAkis(); setMenu(null); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-aksan transition-colors hover:bg-aksan/10">
              <Sparkles className="h-4 w-4" /> Akış'ta paylaş
            </button>
            <MenuOge ikon={FolderPlus} ad="Klasöre ekle" sag={<ChevronRight className="h-3.5 w-3.5 text-white/40" />} onClick={() => { onKlasor(); setMenu(null); }} />
            <div className="relative" onMouseEnter={() => setPaylasAlt(true)} onMouseLeave={() => setPaylasAlt(false)}>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                <Share2 className="h-4 w-4 text-white/60" /><span className="flex-1">Paylaş</span><ChevronRight className="h-3.5 w-3.5 text-white/40" />
              </button>
              {paylasAlt && (
                <div className="menu-surface absolute left-full top-0 z-50 ml-1 w-48 rounded-xl p-1.5">
                  {paylasSecenekleri.map((s) => (
                    <MenuOge key={s.ad} ikon={s.ikon} ad={s.ad} onClick={() => { s.eylem(); setMenu(null); setPaylasAlt(false); }} />
                  ))}
                </div>
              )}
            </div>
            <MenuOge ikon={Download} ad="İndir" onClick={() => { onIndir(); setMenu(null); }} />
            <div className="my-1 h-px bg-white/8" />
            <button onClick={() => { onSil(); setMenu(null); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm text-rose-400 transition-colors hover:bg-rose-500/12">
              <Trash2 className="h-4 w-4" /> Sil
            </button>
          </div>
        </>,
        document.body,
      )}

      {/* Hata durumu */}
      {hata && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 border border-rose-500/30 bg-rose-950/20 p-2 text-center">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          <span className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-rose-300">Yüklenirken hata</span>
        </div>
      )}

      {/* Ses dalga */}
      {ses && !hata && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zemin/45">
          <AudioLines className="h-7 w-7 text-metin/85" />
          <span className="max-w-[85%] truncate px-2 text-[10px] text-metin-2">{u.model}</span>
        </div>
      )}

      {/* Video play */}
      {oynatilir && !hata && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.16)", backdropFilter: "blur(8px)" }}>
            <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
          </span>
        </div>
      )}

      {/* Hover vignette — dört kenardan koyu (Higgsfield birebir), köşe araçları okunur */}
      {!hata && <span className="uretim-vignette" />}


      {/* Seçim kutusu (sol-üst) */}
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} aria-label="Seç"
        className={cn("absolute left-2.5 top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-[5px] border transition-all",
          secili ? "kt-secim border-transparent"
            : cn("kt-arac border-white/75", secimAktif ? "opacity-100" : "pointer-events-none opacity-0 group-hover/kart:pointer-events-auto group-hover/kart:opacity-100"))}>
        {secili && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>

      {/* ⋯ menü (sağ-üst) */}
      {!hata && !secimAktif && (
        <button onClick={(e) => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ x: r.right - 200, y: r.bottom + 4 }); }}
          aria-label="Menü"
          className="kt-arac pointer-events-none absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center text-white opacity-0 transition-opacity group-hover/kart:pointer-events-auto group-hover/kart:opacity-100">
          <span className="flex gap-[3px]"><i className="h-1 w-1 rounded-full bg-white" /><i className="h-1 w-1 rounded-full bg-white" /><i className="h-1 w-1 rounded-full bg-white" /></span>
        </button>
      )}

      {/* Kalp (sol-alt) + indir (sağ-alt) */}
      {!hata && !secimAktif && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onFavori(); }} aria-label={u.favori ? "Favoriden çıkar" : "Favorile"}
            className={cn("kt-arac absolute bottom-2 left-2 z-10 flex h-7 w-7 items-center justify-center transition-all", u.favori ? "opacity-100" : "pointer-events-none opacity-0 group-hover/kart:pointer-events-auto group-hover/kart:opacity-100")}>
            <Heart className={cn("h-3.5 w-3.5", u.favori ? "fill-rose-500 text-rose-500" : "text-white")} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onIndir(); }} aria-label="İndir"
            className="kt-arac pointer-events-none absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center text-white opacity-0 transition-opacity group-hover/kart:pointer-events-auto group-hover/kart:opacity-100">
            <Download className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </motion.div>
  );
}

function MenuOge({ ikon: Ikon, ad, sag, onClick }: { ikon: typeof Maximize2; ad: string; sag?: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
      <Ikon className="h-4 w-4 text-white/60" /><span className="flex-1">{ad}</span>{sag}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Sayfa                                                              */
/* ------------------------------------------------------------------ */

export default function KitaplikPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const projeFiltre = sp.get("proje"); // ortak proje: ?proje=<id> → o projenin varlıkları

  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tumu");
  const [zoom, setZoom] = useState(150); // kart genişliği px (küçük=çok sütun)
  // m48: zaman filtresi + sıralama
  const [zaman, setZaman] = useState<"tumu" | "bugun" | "hafta" | "ay">("tumu");
  const [siralama, setSiralama] = useState<"yeni" | "eski" | "ad">("yeni");
  const [siraAcik, setSiraAcik] = useState(false);
  const [zamanAcik, setZamanAcik] = useState(false);
  /* Mobilde zoom slider'ı yerine referanstaki iki-durumlu görünüm değiştirici:
     "izgara" = 3 sütun küçük kart, "tek" = tam genişlik tek sütun. */
  const [mobilGorunum, setMobilGorunum] = useState<"izgara" | "tek">("izgara");
  const [secili, setSecili] = useState<string[]>([]);
  const [acikId, setAcikId] = useState<string | null>(null);
  const [akisPaylas, setAkisPaylas] = useState<Uretim | null>(null);
  const [projelerAcik, setProjelerAcik] = useState(true); // sidebar kullanıcı klasör grubu aç/kapa
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ── Gerçek üretim store'u ──
  const uretimler = useProjeler((s) => s.uretimler);
  const favoriToggle = useProjeler((s) => s.favoriToggle);
  const guncelle = useProjeler((s) => s.guncelle);
  const silUretim = useProjeler((s) => s.sil);
  // ── Ortak projeler (Higgsfield mantığı: tek liste tüm stüdyolarda) ──
  const projeler = useProje((s) => s.projeler);
  const uretimCoz = useProje((s) => s.uretimCoz);
  const kullanici = useAuth((s) => s.kullanici);

  // Görünür üretimler: tamamlanan + hatalı (moderasyon/API hatası da kartta görünür).
  const gorunurler = useMemo(() => uretimler.filter((u) => u.durum === "tamam" || u.durum === "hata"), [uretimler]);

  // Aktif proje (ortak proje filtresi seçiliyse)
  const aktifProje = useMemo(() => (projeFiltre ? projeler.find((p) => p.id === projeFiltre) : undefined), [projeFiltre, projeler]);
  const projeUretimIdSet = useMemo(() => {
    if (!aktifProje) return null;
    return new Set([...(aktifProje.uretimIdler ?? []), ...(aktifProje.shortsKlipleri ?? [])]);
  }, [aktifProje]);

  // Sayaçlar (sidebar)
  const say = useMemo(() => ({
    tumu: gorunurler.length,
    favori: gorunurler.filter((u) => u.favori).length,
    gorsel: gorunurler.filter((u) => uretimTuru(u) === "gorsel").length,
    video: gorunurler.filter((u) => uretimTuru(u) === "video").length,
    ses: gorunurler.filter((u) => uretimTuru(u) === "ses").length,
    "3d": gorunurler.filter((u) => uretimTuru(u) === "3d").length,
    shorts: gorunurler.filter((u) => aracFiltresi(u) === "shorts").length,
    explainer: gorunurler.filter((u) => aracFiltresi(u) === "explainer").length,
    pazarlama: gorunurler.filter((u) => aracFiltresi(u) === "pazarlama").length,
    karakter: gorunurler.filter((u) => aracFiltresi(u) === "karakter").length,
    lipsync: gorunurler.filter((u) => aracFiltresi(u) === "lipsync").length,
  }), [gorunurler]);

  const TUR_FILTRELERI: Filtre[] = ["gorsel", "video", "ses", "3d"];
  const ARAC_FILTRELERI: Filtre[] = ["shorts", "explainer", "pazarlama", "karakter", "lipsync"];

  // Filtre + arama + proje uygulanmış liste
  const suzulmus = useMemo(() => {
    const q = arama.trim().toLowerCase();
    const simdi = mounted ? Date.now() : 0;
    const esik = zaman === "bugun" ? 86_400_000 : zaman === "hafta" ? 7 * 86_400_000 : zaman === "ay" ? 30 * 86_400_000 : 0;
    return gorunurler.filter((u) => {
      if (projeUretimIdSet && !projeUretimIdSet.has(u.id)) return false;
      if (filtre === "favori" && !u.favori) return false;
      if (TUR_FILTRELERI.includes(filtre) && uretimTuru(u) !== filtre) return false;
      if (ARAC_FILTRELERI.includes(filtre) && aracFiltresi(u) !== filtre) return false;
      // m48: zaman filtresi
      if (esik > 0 && mounted && simdi - u.olusturma > esik) return false;
      if (q && !(`${u.baslik} ${u.prompt} ${u.model} ${u.arac ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [gorunurler, filtre, arama, projeUretimIdSet, zaman, mounted]);

  // Tarihe göre grupla (en yeni en üstte). "Bugün/Dün" yalnız mount sonrası hesaplanır (SSR güvenli).
  const gruplar = useMemo(() => {
    const now = mounted ? Date.now() : 0;
    const bugunKey = mounted ? gunAnahtari(now) : "__";
    const dunKey = mounted ? gunAnahtari(now - 86_400_000) : "__";
    const harita = new Map<string, { etiket: string; sira: number; ogeler: Uretim[] }>();
    // m48: sıralama — yeni/eski/ad
    const sirali = [...suzulmus].sort((a, b) =>
      siralama === "eski" ? a.olusturma - b.olusturma
      : siralama === "ad" ? a.baslik.localeCompare(b.baslik, "tr")
      : b.olusturma - a.olusturma);
    for (const u of sirali) {
      const key = gunAnahtari(u.olusturma);
      if (!harita.has(key)) harita.set(key, { etiket: gunEtiketi(u.olusturma, bugunKey, dunKey), sira: u.olusturma, ogeler: [] });
      harita.get(key)!.ogeler.push(u);
    }
    return [...harita.values()].sort((a, b) => (siralama === "eski" ? a.sira - b.sira : b.sira - a.sira));
  }, [suzulmus, mounted, siralama]);

  // Lightbox gezinme için düz liste
  const duz = useMemo(() => gruplar.flatMap((g) => g.ogeler), [gruplar]);
  const acikIndex = acikId ? duz.findIndex((u) => u.id === acikId) : -1;
  const acik = acikIndex >= 0 ? duz[acikIndex] : null;
  const gez = (yon: 1 | -1) => { if (acikIndex < 0) return; const y = acikIndex + yon; if (y >= 0 && y < duz.length) setAcikId(duz[y].id); };
  useScrollKilit(acikId !== null);
  useEscKapat(acikId !== null, () => setAcikId(null));

  /* Bildirimden derin bağlantı (M9): "Üretim tamamlandı" bildirimi
     /panel/kitaplik?u=<id> açar → doğrudan O ÜRETİMİN lightbox'ı açılsın.
     Açtıktan sonra sorgu parametresi temizlenir ki geri/yenile döngüye girmesin. */
  const derinId = sp.get("u");
  useEffect(() => {
    if (!derinId) return;
    const varMi = uretimler.some((u) => u.id === derinId);
    if (varMi) setAcikId(derinId);
    const kalan = new URLSearchParams(sp.toString());
    kalan.delete("u");
    const qs = kalan.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // sp/router/pathname kasıtlı dışarıda: yalnızca derinId değişince bir kez çalışsın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derinId, uretimler]);

  // ── Seçim ──
  const secimAktif = secili.length > 0;
  const toggle = (id: string) => setSecili((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  const grupTumSecili = (o: Uretim[]) => o.length > 0 && o.every((u) => secili.includes(u.id));
  const grupSec = (o: Uretim[]) => {
    const ids = o.map((u) => u.id);
    setSecili((v) => grupTumSecili(o) ? v.filter((x) => !ids.includes(x)) : Array.from(new Set([...v, ...ids])));
  };
  const secTemizle = () => setSecili([]);

  // ── Aksiyonlar ──
  const indirTek = (id: string) => { const u = gorunurler.find((x) => x.id === id); uretimIndir(u); };
  const silTek = (id: string) => {
    projeler.forEach((p) => { if ((p.uretimIdler ?? []).includes(id) || (p.shortsKlipleri ?? []).includes(id)) uretimCoz(p.id, id); });
    silUretim(id);
    if (acikId === id) setAcikId(null);
    toast.success("Varlık silindi");
  };
  const indir = () => { topluIndir(secili.map((id) => gorunurler.find((u) => u.id === id)).filter(Boolean) as Uretim[], `${secili.length} varlık`); };
  const yayinla = () => { secili.forEach((id) => guncelle(id, { yayinda: true })); toast.success(`${secili.length} varlık yayınlandı`, { description: "Keşfet akışında görünür" }); secTemizle(); };
  const klasoreEkle = () => toast(`${secili.length} varlık için proje seç`, { description: "Bir projeye ekle" });
  const begen = () => { secili.forEach((id) => favoriToggle(id)); toast.success(`${secili.length} varlık favorilere eklendi 💗`); };
  const cope = () => { secili.forEach((id) => silTek(id)); secTemizle(); };

  const seciliKucuk = useMemo(() => secili.map((id) => gorunurler.find((u) => u.id === id)).filter(Boolean).slice(0, 3) as Uretim[], [secili, gorunurler]);

  const projeSec = (id: string | null) => {
    const params = new URLSearchParams(Array.from(sp.entries()));
    if (id) params.set("proje", id); else params.delete("proje");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setFiltre("tumu");
  };

  const bosMu = gruplar.length === 0;

  return (
    /* Higgsfield birebir (2026-07-29): en KOYU arka plan (#08080a); üstünde
       sidebar ve içerik AYRI, dış-hatlı, arka plandan bir tık AÇIK panel
       kutuları (#111113 + kenarlık) — birbirinden belirgin ayrışır. */
    <div className="kitaplik-kapsam relative flex min-h-[calc(100vh-3rem)] gap-3 bg-[#08080a] pr-3">
      {/* Sidebar'ın ARKASINDAKİ renk aurası — camın bulandıracağı içerik.
          Sadece sol şeritte durur (w-[264px]) ve sidebar'ın altında kalır
          (-z-0 + pointer-events-none); içeriğe hiç karışmaz. */}
      <div aria-hidden className="kitaplik-aura pointer-events-none absolute inset-y-0 left-0 z-0 hidden w-[264px] md:block" />

      {/* ================= SOL SIDEBAR =================
          Sabit yükseklik (h-[calc(100vh-4.5rem)]), kendi dış-hatlı panel kutusu;
          projeler kapanınca/açılınca panel boyu SABİT kalır, içerik kendi
          içinde kayar.
          CAM (2026-07-30): opak #111113 yerine .glass-kenar — arkasındaki
          aurayı bulandırarak buzlu cam etkisi verir. */}
      <aside data-test="kitaplik-sidebar"
        className="glass-kenar sticky top-12 z-10 hidden h-[calc(100vh-3rem)] w-[248px] shrink-0 flex-col gap-0.5 self-start overflow-hidden rounded-r-2xl border-l-0 px-3 py-4 md:flex">
        {/* Ara — dolgulu koyu kutu (görsel birebir) */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-metin-3" />
          <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Ara"
            className="h-11 w-full rounded-[12px] bg-white/[0.05] pl-10 pr-3 text-[15px] text-metin outline-none transition-colors placeholder:text-metin-3 focus:bg-white/[0.08]" />
        </div>

        <NavSatir ikon={Images} etiket="Tüm Varlıklar" sayi={say.tumu} aktif={filtre === "tumu" && !projeFiltre} onClick={() => { projeSec(null); setFiltre("tumu"); }} />
        <NavSatir ikon={Heart} etiket="Favoriler" sayi={say.favori} aktif={filtre === "favori"} onClick={() => { setFiltre("favori"); }} />

        {/* ── ARAÇLAR ── Higgsfield birebir: SADECE Görsel / Video / Ses.
            (Shorts/Explainer/Pazarlama/Karakter/Lipsync/3D filtreleri kaldırılmadı —
            mobil tür şeridinden ve ?filtre bağlantılarından erişilebilir kalır.) */}
        <div className="mb-1 mt-5 px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-metin-3">Araçlar</div>
        <div data-test="kitaplik-araclar" className="flex flex-col gap-0.5">
          <NavSatir testId="arac-gorsel" ikon={ImageIcon} etiket="Görsel" sayi={say.gorsel} aktif={filtre === "gorsel"} onClick={() => setFiltre("gorsel")} />
          <NavSatir testId="arac-video" ikon={Video} etiket="Video" sayi={say.video} aktif={filtre === "video"} onClick={() => setFiltre("video")} />
          <NavSatir testId="arac-ses" ikon={AudioLines} etiket="Ses" sayi={say.ses} aktif={filtre === "ses"} onClick={() => setFiltre("ses")} />
        </div>

        {/* ── ORTAK PROJELER ── başlık = kullanıcı satırı HAP İÇİNDE (görsel birebir):
            [ok · harf-avatar · ad] tek koyu hap + dışında sağda ayrı "+".
            Tıklanınca klasör listesi açılıp kapanır (collapse). */}
        <div className="mb-0.5 mt-6 flex items-center gap-2 px-1">
          <button onClick={() => setProjelerAcik((v) => !v)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/[0.05] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.08]" aria-expanded={projelerAcik}>
            {projelerAcik
              ? <ChevronDown className="h-4 w-4 shrink-0 text-metin-2" />
              : <ChevronRight className="h-4 w-4 shrink-0 text-metin-2" />}
            {/* Kullanıcı avatarı — baş harf rozeti (nötr gri daire) */}
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.14] text-[11px] font-semibold text-metin">
              {(kullanici?.ad ?? "V").trim().charAt(0).toLocaleUpperCase("tr")}
            </span>
            <span className="flex-1 truncate text-[14px] font-medium text-metin">{kullanici?.ad ?? "Projeler"}</span>
          </button>
          <button onClick={() => { const id = useProje.getState().projeOlustur("Yeni proje", "Genel", { kaynakStudyo: "Kitaplık" }); setProjelerAcik(true); projeSec(id); toast.success("Proje oluşturuldu"); }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-white/8 hover:text-metin" aria-label="Yeni proje">
            <Plus className="h-[18px] w-[18px]" />
          </button>
        </div>
        {/* Proje listesi KENDİ İÇİNDE kayar (flex-1 + overflow-y-auto) — büyüyünce
            üstteki Tüm Varlıklar/Favoriler/Araçlar'ı SIKIŞTIRMAZ, alta doğru açılır. */}
        {projelerAcik && (
          <div className="mt-0.5 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto gizli-scroll">
            {projeler.length === 0 && <p className="px-2.5 py-1.5 text-[13px] text-metin-3">Henüz proje yok</p>}
            {projeler.map((p) => {
              // Klasördeki GERÇEK varlık sayısı — silinmiş/geçersiz id'ler sayılmasın.
              const idler = new Set([...(p.uretimIdler ?? []), ...(p.shortsKlipleri ?? [])]);
              const adet = gorunurler.reduce((n, u) => n + (idler.has(u.id) ? 1 : 0), 0);
              const secili = projeFiltre === p.id;
              const { ikon: ProjeIkon, renk } = projeIkonu(p);
              return (
                <NavSatir key={p.id} ikon={ProjeIkon} etiket={p.ad} sayi={adet} aktif={secili} sifirGizle
                  ikonRenk={renk} onClick={() => projeSec(secili ? null : p.id)} />
              );
            })}
          </div>
        )}
      </aside>

      {/* ================= ANA ================= */}
      {/* İçerik de kendi dış-hatlı panel kutusu (arka plandan açık #111113) —
          sidebar'la aynı dilde; ikisi arasında net boşluk + kenarlıkla ayrışır. */}
      <main className="min-w-0 flex-1 rounded-2xl border border-white/[0.07] bg-[#111113] px-3 py-3 md:px-5 md:py-6 lg:px-8">
        {/* ── MOBİL BAŞLIK + GÖRÜNÜM DEĞİŞTİRİCİ + TÜR ŞERİDİ ──
            Referansta: klasör ikonu + "Kitaplık" solda, sağda iki düğmeli
            görünüm değiştirici (tek sütun / ızgara); altında yatay kayan tür
            çipleri. Bunların tamamı sayfanın üstüne YAPIŞIR. */}
        <div className="sticky top-0 z-20 -mx-3 mb-3 bg-zemin px-3 pb-2 pt-1 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {aktifProje && (
                <button onClick={() => projeSec(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2" aria-label="Geri">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <Folder className="h-[18px] w-[18px] text-metin-2" />
              <h1 className="text-[21px] font-semibold text-metin">{aktifProje ? aktifProje.ad : BASLIKLAR[filtre]}</h1>
            </div>
            <div className="flex items-center gap-1 rounded-[10px] bg-white/[0.06] p-1">
              {([["tek", Square], ["izgara", LayoutGrid]] as const).map(([mod, Ikon]) => (
                <button key={mod} onClick={() => setMobilGorunum(mod)} aria-label={mod === "tek" ? "Tek sütun" : "Izgara"}
                  className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    mobilGorunum === mod ? "bg-white/[0.12] text-white" : "text-metin-2")}>
                  <Ikon className="h-[18px] w-[18px]" />
                </button>
              ))}
            </div>
          </div>

          <div className="-mx-3 mt-2 flex gap-2 overflow-x-auto px-3 gizli-scroll">
            {([
              { id: "tumu", ad: "Tümü", ikon: Images },
              { id: "favori", ad: "Favoriler", ikon: Heart },
              { id: "gorsel", ad: "Görsel", ikon: ImageIcon },
              { id: "video", ad: "Video", ikon: Video },
              { id: "shorts", ad: "Shorts", ikon: Film },
              { id: "explainer", ad: "Explainer", ikon: Presentation },
              { id: "ses", ad: "Ses", ikon: AudioLines },
              { id: "pazarlama", ad: "Pazarlama", ikon: Megaphone },
              { id: "karakter", ad: "Karakterler", ikon: Users },
              { id: "lipsync", ad: "Lipsync", ikon: Mic },
              { id: "3d", ad: "3D", ikon: Box },
            ] as const).map((t) => (
              <button key={t.id} onClick={() => setFiltre(t.id)}
                className={cn("flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-[15px] font-medium transition-colors",
                  filtre === t.id ? "bg-white/[0.12] text-white" : "bg-white/[0.05] text-metin-2")}>
                <t.ikon className="h-4 w-4" /> {t.ad}
              </button>
            ))}
          </div>
        </div>

        {/* Başlık + boyut slider (masaüstü) */}
        <div className="mb-6 hidden flex-wrap items-center justify-between gap-3 md:flex">
          <div className="flex items-center gap-2.5">
            {aktifProje && (
              <button onClick={() => projeSec(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/8" aria-label="Geri">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <h1 className="hf-baslik text-2xl text-metin sm:text-3xl">{aktifProje ? aktifProje.ad : BASLIKLAR[filtre]}</h1>
            <span className="mt-1 text-sm text-metin-3">{suzulmus.length}</span>
          </div>
          <div className="flex items-center gap-2.5">
            {/* m48: zaman filtresi */}
            <div className="relative">
              <button onClick={() => { setZamanAcik((v) => !v); setSiraAcik(false); }}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 text-[13px] font-medium text-metin-2 transition-colors hover:text-metin">
                <Clock3 className="h-3.5 w-3.5" />
                {zaman === "tumu" ? "Tüm zamanlar" : zaman === "bugun" ? "Bugün" : zaman === "hafta" ? "Bu hafta" : "Bu ay"}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {zamanAcik && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setZamanAcik(false)} />
                  <div className="menu-surface absolute right-0 top-full z-50 mt-1.5 w-40 overflow-hidden rounded-xl p-1">
                    {([["tumu", "Tüm zamanlar"], ["bugun", "Bugün"], ["hafta", "Bu hafta"], ["ay", "Bu ay"]] as const).map(([id, ad]) => (
                      <button key={id} onClick={() => { setZaman(id); setZamanAcik(false); }}
                        className={cn("flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors hover:bg-white/8", zaman === id ? "text-metin" : "text-metin-2")}>
                        {ad} {zaman === id && <Check className="h-3.5 w-3.5 text-aksan" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* m48: sıralama */}
            <div className="relative">
              <button onClick={() => { setSiraAcik((v) => !v); setZamanAcik(false); }}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 text-[13px] font-medium text-metin-2 transition-colors hover:text-metin">
                <ArrowDownUp className="h-3.5 w-3.5" />
                {siralama === "yeni" ? "En yeni" : siralama === "eski" ? "En eski" : "İsme göre"}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {siraAcik && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSiraAcik(false)} />
                  <div className="menu-surface absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl p-1">
                    {([["yeni", "En yeni"], ["eski", "En eski"], ["ad", "İsme göre"]] as const).map(([id, ad]) => (
                      <button key={id} onClick={() => { setSiralama(id); setSiraAcik(false); }}
                        className={cn("flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors hover:bg-white/8", siralama === id ? "text-metin" : "text-metin-2")}>
                        {ad} {siralama === id && <Check className="h-3.5 w-3.5 text-aksan" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <span className="mx-0.5 h-5 w-px bg-white/10" />
            <Maximize2 className="h-4 w-4 text-metin-3" />
            <input type="range" min={104} max={220} step={2} value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
              /* Higgsfield zoom slider'ı: beyaz topuz + nötr ray (aksan renkli değil) */
              className="paz-kaydirici h-[3px] w-[130px] cursor-pointer" aria-label="Kart boyutu" />
          </div>
        </div>

        {/* Boş durum */}
        {bosMu ? (
          <BosDurum filtre={filtre} projeAdi={aktifProje?.ad} />
        ) : (
          <div className="space-y-8 pb-28">
            {gruplar.map((g) => (
              <section key={g.etiket + g.sira}>
                <div className="mb-3 flex items-center gap-2.5">
                  <button onClick={() => grupSec(g.ogeler)} aria-label="Grubu seç"
                    className={cn("flex h-5 w-5 items-center justify-center rounded-[6px] border transition-colors",
                      grupTumSecili(g.ogeler) ? "kt-secim border-transparent" : "border-white/30 hover:border-white/60")}>
                    {grupTumSecili(g.ogeler) && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </button>
                  <h2 className="text-[15px] font-semibold text-metin">{g.etiket}</h2>
                </div>
                {/* Mobil: 3 sütun ızgara ya da tam genişlik tek sütun (referans).
                    Masaüstü: zoom slider'ına göre sarmalayan esnek dizilim. */}
                <div className={cn("gap-2 md:flex md:flex-wrap",
                  mobilGorunum === "izgara" ? "grid grid-cols-3" : "grid grid-cols-1")}>
                  {g.ogeler.map((u) => (
                    <VarlikKart key={u.id} u={u} boyut={zoom} secili={secili.includes(u.id)} secimAktif={secimAktif}
                      onToggle={() => toggle(u.id)} onAc={() => setAcikId(u.id)}
                      onFavori={() => favoriToggle(u.id)} onIndir={() => indirTek(u.id)} onSil={() => silTek(u.id)}
                      onKlasor={klasoreEkle} onPaylas={() => void baglantiyiKopyala(`/panel/kitaplik?u=${u.id}`)} onAkis={() => setAkisPaylas(u)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* ================= SEÇİM BARI (floating) ================= */}
      <AnimatePresence>
        {secimAktif && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-[14px] border border-kenar bg-yuzey px-2 py-2 shadow-2xl">
            <div className="flex items-center gap-2 pl-1 pr-2">
              <div className="flex -space-x-2">
                {seciliKucuk.map((u) => (
                  <span key={u.id} className="h-7 w-7 rounded-md border border-kenar bg-cover bg-center" style={{ background: kartArka(u) }} />
                ))}
              </div>
              <span className="whitespace-nowrap text-sm font-medium text-metin">{secili.length} seçildi</span>
            </div>
            <span className="mx-1 h-6 w-px bg-white/10" />
            <SecimBtn ikon={Download} ad="İndir" onClick={indir} />
            <SecimBtn ikon={UploadCloud} ad="Tümünü yayınla" onClick={yayinla} />
            <SecimBtn ikon={FolderPlus} ad="Klasöre ekle" onClick={klasoreEkle} />
            <button onClick={begen} className="hf-btn flex h-9 w-9 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-white/8" aria-label="Favorile"><Heart className="h-4 w-4" /></button>
            <button onClick={cope} className="flex h-9 w-9 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-rose-500/12 hover:text-rose-400" aria-label="Sil"><Trash2 className="h-4 w-4" /></button>
            <span className="mx-1 h-6 w-px bg-white/10" />
            <button onClick={secTemizle} className="hf-btn flex h-9 w-9 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-white/8" aria-label="Seçimi temizle"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= DETAY LIGHTBOX ================= */}
      <AnimatePresence>
        {acik && (
          <VarlikLightbox u={acik} onKapat={() => setAcikId(null)} onGez={gez}
            hasOnceki={acikIndex > 0} hasSonraki={acikIndex < duz.length - 1}
            onFavori={() => favoriToggle(acik.id)} onSil={() => silTek(acik.id)} onIndir={() => indirTek(acik.id)} />
        )}
      </AnimatePresence>

      {/* ================= AKIŞ'TA PAYLAŞ ================= */}
      <AkistaPaylasModal uretim={akisPaylas} onKapat={() => setAkisPaylas(null)} />
    </div>
  );
}

function SecimBtn({ ikon: Ikon, ad, onClick }: { ikon: typeof Download; ad: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="hf-btn flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-metin-2 transition-colors hover:bg-white/8 hover:text-metin">
      <Ikon className="h-4 w-4" /><span className="hidden sm:inline">{ad}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Boş durum                                                          */
/* ------------------------------------------------------------------ */

function BosDurum({ filtre, projeAdi }: { filtre: Filtre; projeAdi?: string }) {
  if (filtre === "favori") {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div className="hf-kart mb-5 flex h-20 w-20 items-center justify-center bg-gradient-to-br from-rose-500/40 to-fuchsia-600/25">
          <Heart className="h-9 w-9 fill-rose-400 text-rose-400" />
        </div>
        <h3 className="text-lg font-semibold text-metin">Favori üretimlerin burada görünecek</h3>
        <p className="mt-1.5 text-sm text-metin-3">Beğendiklerini işaretle — hepsi burada toplansın.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="hf-kart mb-5 flex h-20 w-20 items-center justify-center bg-gradient-to-br from-aksan/30 to-aksan-koyu/15">
        <Images className="h-9 w-9 text-aksan" />
      </div>
      <h3 className="text-lg font-semibold text-metin">{projeAdi ? `"${projeAdi}" projesinde henüz varlık yok` : "Varlıkların burada görünecek"}</h3>
      <p className="mt-1.5 text-sm text-metin-3">Bir stüdyoda üretim yap — çıktılar otomatik buraya düşer.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detay lightbox                                                     */
/* ------------------------------------------------------------------ */

type Sekme = "bilgi" | "araclar" | "yorumlar";
type AracPanel = null | "iyilestir" | "buyut" | "cerceve" | "arkaplan" | "renk";

function VarlikLightbox({ u, onKapat, onGez, hasOnceki, hasSonraki, onFavori, onSil, onIndir }: {
  u: Uretim; onKapat: () => void; onGez: (y: 1 | -1) => void; hasOnceki: boolean; hasSonraki: boolean;
  onFavori: () => void; onSil: () => void; onIndir: () => void;
}) {
  const [sekme, setSekme] = useState<Sekme>("bilgi");
  const [arac, setArac] = useState<AracPanel>(null);
  const guncelle = useProjeler((s) => s.guncelle);
  const gonderReferans = useReferansKopru((s) => s.gonder);
  const router = useRouter();
  const arka = useMemo(() => kartArka(u), [u]);
  const ses = u.tur === "ses";
  const video = u.tur === "video";

  // "Referans" — bu üretimi composer'a referans olarak taşı (gerçek köprü, m60).
  // Görsel/video ise ilgili stüdyoya git; köprüyü o sayfa açılışta tüketir.
  const referansEkle = () => {
    const url = saltUrl(u.gorselUrl) || saltUrl(u.thumbnailUrl);
    if (!url) { toast.error("Bu üretim referans olarak eklenemiyor"); return; }
    // Ses/3D üretimin görseli referans olarak yalnızca görsel composer'ında anlamlı.
    const hedefTur = u.tur === "video" ? "video" : "gorsel";
    gonderReferans({ url, tur: hedefTur, baslik: u.baslik, prompt: u.prompt });
    const hedef = hedefTur === "video" ? "/panel/video" : "/panel/gorsel";
    onKapat();
    router.push(hedef);
    toast.success("Referans olarak eklendi", { description: "Composer'a taşındı — üretmeye devam et" });
  };

  const boyut = u.meta?.cozunurluk === "2K" ? "2048×2732" : (u.tur === "video" ? "1080×1920" : "1024×1536");
  const olusturmaMetin = useMemo(() => { const d = new Date(u.olusturma); return `${d.getDate()} ${AY_ADLARI[d.getMonth()]} ${d.getFullYear()}`; }, [u.olusturma]);

  const yenidenUret = () => {
    const s = uretimBaslat({ baslik: u.baslik, tur: u.tur, model: u.model, prompt: u.prompt, kredi: u.kredi || 4, arac: u.arac ?? "Kitaplık", projeId: u.projeId, meta: u.meta });
    if (!s.ok) return uretimHataToast(s, "Yeniden üretilemedi");
    toast.success("Yeniden üretiliyor ✦", { description: u.baslik });
  };
  const videoyaCevir = () => {
    const s = uretimBaslat({ baslik: `${u.baslik} — Video`, tur: "video", model: "Kling 3.0", prompt: `${u.prompt} · görselden video`, kredi: 40, arac: "Görselden Video", projeId: u.projeId, meta: { oran: u.meta?.oran, gorselUrl: u.gorselUrl } });
    if (!s.ok) return uretimHataToast(s, "Videoya çevrilemedi");
    toast.success("Videoya dönüştürülüyor ✦", { description: u.baslik });
  };

  return (
    /* Mobilde referans: TEK dikey akış (medya üstte, altında 2×3 aksiyon ızgarası).
       Masaüstünde solda medya, sağda 440px panel.
       Kök MOBİLDE tam opak zemin (bg-zemin) — scroll ederken altındaki kitaplık
       sayfası sızmasın (kullanıcı bildirdiği layout hatası). */
    <div className="fixed inset-0 z-[80] flex flex-col overflow-y-auto bg-zemin md:flex-row md:overflow-hidden md:bg-transparent">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 hidden md:block" onClick={onKapat}
        style={{
          // Sıcak radial vinyet + güçlü blur: arka plan bulanık ama görünür kalır.
          background: "radial-gradient(circle at 40% 45%, rgba(46,38,32,0.45), rgba(10,10,11,0.86))",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
        }} />

      {/* Gezinme okları — panel genişliğini (w-[440px]) hesaba katarak konumlandır.
          Mobilde gizli: orada dikey kaydırma var, yan oklar medyayı örtüyor. */}
      {hasOnceki && (
        <button onClick={onGez.bind(null, -1)} className="hf-btn glass-cip absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white md:flex" aria-label="Önceki"><ChevronLeft className="h-5 w-5" /></button>
      )}
      {hasSonraki && (
        <button onClick={onGez.bind(null, 1)} className="hf-btn glass-cip absolute right-[456px] top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white md:flex" aria-label="Sonraki"><ChevronRight className="h-5 w-5" /></button>
      )}

      {/* Mobil kapatma — referansta sağ üstte aksan halkalı yuvarlak ✕ */}
      <button onClick={onKapat} aria-label="Kapat"
        className="fixed right-4 top-4 z-[3] flex h-11 w-11 items-center justify-center rounded-full border border-aksan/70 bg-black/50 text-white backdrop-blur-sm md:hidden">
        <X className="h-5 w-5" />
      </button>

      {/* Sol büyük medya (min-w-0 → paneli dışarı itmesin) */}
      <div className="relative z-[1] flex min-w-0 shrink-0 flex-col items-center justify-center px-3 pb-3 pt-16 md:flex-1 md:p-6 md:pt-6" onClick={onKapat}>
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
          /* Mobilde `w-full` şart: `items-center` ile sarmalayıcı içeriğe göre
             daralınca 16:9 medya minicik kalıyordu. */
          onClick={(e) => e.stopPropagation()} className="relative flex w-full max-h-full min-w-0 flex-col items-center md:w-auto">
          {ses ? (
            <div className="hf-kart flex h-[70vh] w-[420px] max-w-full flex-col items-center justify-center gap-6 bg-yuzey">
              <div className="flex h-24 items-end gap-1">
                {Array.from({ length: 40 }).map((_, i) => (
                  <span key={i} className="w-1 rounded-full bg-aksan/70" style={{ height: `${20 + ((i * 37) % 70)}%` }} />
                ))}
              </div>
              <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black"><Play className="ml-0.5 h-6 w-6 fill-black" /></button>
              <span className="text-sm text-metin-2">{u.model}</span>
            </div>
          ) : (
            /* Mobilde yükseklik serbest (genişliğe oturur), masaüstünde 72vh. */
            <div className="relative w-full max-w-full overflow-hidden rounded-xl md:h-[72vh] md:max-h-[72vh] md:w-auto" style={{ aspectRatio: (u.meta?.oran ?? "3/4").replace(":", "/"), background: arka }}>
              {video && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="glass-cip flex h-16 w-16 items-center justify-center rounded-full"><Play className="ml-1 h-7 w-7 fill-white text-white" /></span>
                </div>
              )}
            </div>
          )}
          {/* Oynatıcı barı (video/ses) */}
          {(video || ses) && (
            <div className="mt-4 w-full max-w-[540px]">
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/15"><div className="h-full w-1/3 bg-aksan" /></div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[13px] text-white/80">
                <div className="flex shrink-0 items-center gap-3"><Play className="h-4 w-4 fill-white" /><span>1×</span></div>
                <span className="tabular-nums">0:03 / {u.meta?.sure ?? "0:10"}</span>
                <Maximize2 className="h-4 w-4 shrink-0" />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Sağ panel — KUTU DIŞI (#131517); içindeki İSTEM/DETAYLAR glass-cip (#1c1e20). */}
      <motion.aside initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
        className="relative z-[2] flex w-full flex-col bg-yuzey md:h-full md:w-[440px] md:shrink-0 md:border-l md:border-white/10">
        {arac ? (
          <AracPaneli arac={arac} u={u} onGeri={() => setArac(null)} onKapat={onKapat} />
        ) : (
          <>
            {/* Mobil aksiyon ızgarası — referansta 2 satır × 3 sütun, ilki AKSAN
                dolu. Masaüstünde bu işler "Araçlar" sekmesinde. */}
            <div className="grid grid-cols-3 gap-2 px-3 pb-1 pt-3 md:hidden">
              {([
                { ad: "Görseli Düzenle", ikon: Wand2, birincil: true, fn: () => setArac("iyilestir") },
                { ad: "Yeniden Üret", ikon: RefreshCw, fn: yenidenUret },
                { ad: "Video Yap", ikon: Video, fn: videoyaCevir },
                { ad: "Favori", ikon: Heart, fn: onFavori },
                { ad: "İndir", ikon: Download, fn: onIndir },
                { ad: "Daha fazla", ikon: Share2, fn: () => setSekme("araclar") },
              ] as const).map((a) => (
                <button key={a.ad} onClick={a.fn}
                  className={cn("flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl text-[13px] font-medium transition-colors",
                    "birincil" in a && a.birincil ? "bg-aksan text-zemin" : "bg-yuzey-2 text-white")}>
                  <a.ikon className={cn("h-[18px] w-[18px]", a.ad === "Favori" && u.favori && "fill-current text-rose-400")} />
                  {a.ad}
                </button>
              ))}
            </div>

            {/* Yazar başlığı — mobilde referansta yok (kapatma zaten sağ üstte) */}
            <div className="hidden items-center gap-3 border-b border-white/8 px-5 py-4 md:flex">
              <span className="h-9 w-9 rounded-full bg-gradient-to-br from-aksan to-aksan-koyu" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-metin">Sen</p>
                <p className="text-[13px] text-metin-3">Üretici</p>
              </div>
              <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/10" aria-label="Kapat"><X className="h-5 w-5" /></button>
            </div>

            {/* Sekmeler — mobilde de kalır ama aksiyon ızgarasının altında */}
            <div className="flex items-center gap-1.5 px-3 py-3 md:px-4">
              {([["bilgi", "Bilgi", InfoIcon], ["araclar", "Araçlar", Wand2], ["yorumlar", "Yorumlar", MessageCircle]] as const).map(([id, ad, Ik]) => (
                <button key={id} onClick={() => setSekme(id)}
                  className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-medium transition-colors",
                    sekme === id ? "glass-cip-aktif text-white" : "glass-cip text-metin-2 hover:text-white")}>
                  <Ik className="h-3.5 w-3.5" />{ad}
                </button>
              ))}
            </div>

            {/* Mobilde dış kapsayıcı zaten kayıyor; burada ikinci bir kaydırma
                alanı açmak paneli kısaltıp içeriği kesiyordu. */}
            <div className="px-3 pb-6 md:flex-1 md:overflow-y-auto md:px-5 md:pb-4">
              {sekme === "bilgi" && (
                <div className="space-y-5">
                  {/* Prompt */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold tracking-wide text-metin-3">İSTEM</span>
                      <button onClick={() => { void kopyala(u.prompt || u.baslik, "İstem kopyalandı"); }} className="flex items-center gap-1 text-[12px] text-metin-2 hover:text-metin"><Copy className="h-3.5 w-3.5" />Kopyala</button>
                    </div>
                    <p className="glass-cip rounded-xl p-3 text-[13.5px] leading-relaxed text-metin-2">{u.prompt || u.baslik}</p>
                  </div>
                  {/* Detaylar */}
                  <div>
                    <span className="mb-2 block text-[11px] font-semibold tracking-wide text-metin-3">DETAYLAR</span>
                    <div className="glass-cip space-y-2 rounded-xl p-3 text-[13.5px]">
                      <DetaySatir k="Model" v={u.model} />
                      <DetaySatir k="Boyut" v={boyut} />
                      {u.meta?.oran && <DetaySatir k="Oran" v={u.meta.oran} />}
                      {u.arac && <DetaySatir k="Araç" v={u.arac} />}
                      <DetaySatir k="Oluşturulma" v={olusturmaMetin} />
                    </div>
                  </div>
                </div>
              )}

              {sekme === "araclar" && (
                <div>
                  <span className="mb-2 block text-[11px] font-semibold tracking-wide text-metin-3">{video ? "VİDEOYU DÜZENLE" : "GÖRSELİ DÜZENLE"}</span>
                  <div className="space-y-1">
                    <AracSatir ikon={Sparkles} ad="İyileştirici" yeni onClick={() => setArac("iyilestir")} />
                    <AracSatir ikon={Maximize2} ad="Büyüt" onClick={() => setArac("buyut")} />
                    <AracSatir ikon={Crop} ad="Yeniden Çerçevele" onClick={() => setArac("cerceve")} />
                    <AracSatir ikon={Eraser} ad="Arka Planı Kaldır" onClick={() => setArac("arkaplan")} />
                    <AracSatir ikon={Layers} ad="Renk Derecelendirme" onClick={() => setArac("renk")} />
                  </div>
                </div>
              )}

              {sekme === "yorumlar" && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="glass-cip mb-3 flex h-14 w-14 items-center justify-center rounded-full"><MessageCircle className="h-6 w-6 text-metin-3" /></div>
                  <p className="text-sm text-metin-2">Henüz yorum yok</p>
                </div>
              )}
            </div>

            {/* Alt aksiyon barı (Bilgi sekmesinde) */}
            {sekme === "bilgi" && (
              <div className="border-t border-white/8 p-4">
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <button onClick={yenidenUret} className="hf-uret flex items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold"><RefreshCw className="h-4 w-4" />Yeniden Oluştur</button>
                  <button onClick={referansEkle} className="hf-btn glass-cip flex items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-medium text-metin"><Images className="h-4 w-4" />Referans</button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={onIndir} className="hf-btn glass-cip flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-medium text-metin"><Download className="h-4 w-4" />İndir</button>
                  <button onClick={onFavori} className={cn("hf-btn glass-cip flex h-11 w-11 items-center justify-center rounded-xl", u.favori && "text-rose-400")} aria-label="Favorile"><Heart className={cn("h-4 w-4", u.favori && "fill-rose-400")} /></button>
                  <button onClick={() => void baglantiyiKopyala(`/panel/kitaplik?u=${u.id}`)} className="hf-btn glass-cip flex h-11 w-11 items-center justify-center rounded-xl text-metin" aria-label="Paylaş"><Share2 className="h-4 w-4" /></button>
                  <button onClick={onSil} className="hf-btn glass-cip flex h-11 w-11 items-center justify-center rounded-xl text-metin hover:text-rose-400" aria-label="Sil"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.aside>
    </div>
  );
}

function DetaySatir({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-metin-3">{k}</span><span className="truncate text-right font-medium text-metin">{v}</span></div>;
}

function AracSatir({ ikon: Ikon, ad, yeni, onClick }: { ikon: typeof Sparkles; ad: string; yeni?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="hf-btn flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/8">
      <span className="glass-cip flex h-8 w-8 items-center justify-center rounded-lg text-aksan"><Ikon className="h-4 w-4" /></span>
      <span className="flex-1 text-[14px] font-medium text-metin">{ad}</span>
      {yeni && <span className="glass-cip rounded px-1.5 py-0.5 text-[9px] font-bold text-aksan">YENİ</span>}
      <ChevronRight className="h-4 w-4 text-metin-3" />
    </button>
  );
}

/* ---- Araç panelleri (İyileştir/Büyüt/Çerçevele/Arka Plan/Renk) ---- */

function AracPaneli({ arac, u, onGeri, onKapat }: { arac: NonNullable<AracPanel>; u: Uretim; onGeri: () => void; onKapat: () => void }) {
  const BASLIK: Record<NonNullable<AracPanel>, { ad: string; ikon: typeof Sparkles }> = {
    iyilestir: { ad: "İyileştirici", ikon: Sparkles },
    buyut: { ad: "Büyüt", ikon: Maximize2 },
    cerceve: { ad: "Yeniden Çerçevele", ikon: Crop },
    arkaplan: { ad: "Arka Planı Kaldır", ikon: Eraser },
    renk: { ad: "Renk Derecelendirme", ikon: Layers },
  };
  const B = BASLIK[arac];
  const [cilt, setCilt] = useState("gercekci");
  const [olcek, setOlcek] = useState("x2");
  const [oran, setOran] = useState(u.meta?.oran ?? "16:9");
  const [coz, setCoz] = useState("1080p");
  const uygula = (etiket: string) => { toast.success(`${etiket} ✦`, { description: u.baslik }); onKapat(); };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/8 px-4 py-4">
        <button onClick={onGeri} className="hf-btn glass-cip flex h-8 w-8 items-center justify-center rounded-full text-metin-2" aria-label="Geri"><ChevronLeft className="h-4 w-4" /></button>
        <span className="glass-cip flex h-9 w-9 items-center justify-center rounded-full text-aksan"><B.ikon className="h-4 w-4" /></span>
        <span className="flex-1 text-[16px] font-semibold text-metin">{B.ad}</span>
        <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/10" aria-label="Kapat"><X className="h-5 w-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {arac === "iyilestir" && (
          <>
            <p className="mb-3 text-[14px] text-metin-2">İyileştirme türü seç:</p>
            <div className="grid grid-cols-2 gap-2.5">
              {([["yumusak", "Yumuşak cilt"], ["gercekci", "Gerçekçi cilt"], ["kusurlu", "Kusurlu cilt"]] as const).map(([id, ad]) => (
                <button key={id} onClick={() => setCilt(id)}
                  className={cn("relative flex aspect-square items-end overflow-hidden rounded-xl p-2 text-left ring-2 transition-all", cilt === id ? "ring-aksan" : "ring-transparent hover:ring-white/20")}
                  style={{ background: aracArka("cilt" + id, "portre") }}>
                  <span className="text-[12px] font-medium text-white drop-shadow">{ad}</span>
                  {cilt === id && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-aksan"><Check className="h-3 w-3 text-zemin" strokeWidth={3} /></span>}
                </button>
              ))}
            </div>
          </>
        )}

        {arac === "buyut" && (
          <>
            <span className="mb-2 block text-[11px] font-semibold tracking-wide text-metin-3">ÖLÇEK FAKTÖRÜ</span>
            <div className="mb-4 flex gap-1.5">
              {["x1", "x2", "x4", "x8"].map((o) => (
                <button key={o} onClick={() => setOlcek(o)} className={cn("flex-1 rounded-lg py-2 text-[13px] font-medium transition-colors", olcek === o ? "glass-cip-aktif text-white" : "glass-cip text-metin-2 hover:text-white")}>{o}</button>
              ))}
            </div>
            <SliderSatir ad="Keskinlik" v={30} />
            <SliderSatir ad="Gürültü Azaltma" v={20} />
          </>
        )}

        {arac === "cerceve" && (
          <>
            <span className="mb-2 block text-[11px] font-semibold tracking-wide text-metin-3">EN BOY ORANI</span>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {["16:9", "4:3", "3:4", "1:1", "21:9"].map((o) => (
                <button key={o} onClick={() => setOran(o)} className={cn("rounded-lg px-3 py-2 text-[13px] font-medium transition-colors", oran === o ? "glass-cip-aktif text-white" : "glass-cip text-metin-2 hover:text-white")}>{o}</button>
              ))}
            </div>
            <span className="mb-2 block text-[11px] font-semibold tracking-wide text-metin-3">ÇÖZÜNÜRLÜK</span>
            <div className="flex flex-wrap gap-1.5">
              {["480p", "720p", "1080p", "4K"].map((c) => (
                <button key={c} onClick={() => setCoz(c)} className={cn("rounded-lg px-3 py-2 text-[13px] font-medium transition-colors", coz === c ? "glass-cip-aktif text-white" : "glass-cip text-metin-2 hover:text-white")}>{c}</button>
              ))}
            </div>
          </>
        )}

        {arac === "arkaplan" && (
          <>
            <span className="mb-2 block text-[11px] font-semibold tracking-wide text-metin-3">NASIL ÇALIŞIR</span>
            <p className="mb-4 text-[13.5px] leading-relaxed text-metin-2">Ana özneyi otomatik algılar ve arka planı kaldırır — şeffaf PNG çıktısı verir.</p>
            <div className="aspect-video rounded-xl" style={{ background: kartArka(u) }} />
          </>
        )}

        {arac === "renk" && (
          <div className="space-y-1.5">
            <span className="mb-1 block text-[11px] font-semibold tracking-wide text-metin-3">ÖN AYARLAR</span>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {["Yok", "Doğal", "S-B Film", "Sinematik", "16mm", "Eski Lens"].map((p, i) => (
                <div key={p} className={cn("hf-kart flex aspect-square flex-col items-center justify-end overflow-hidden p-1 text-center", i === 0 && "hf-kart-secili")} style={{ background: aracArka("preset" + p, "sinematik") }}>
                  <span className="text-[9px] font-medium text-white drop-shadow">{p}</span>
                </div>
              ))}
            </div>
            {["Pozlama", "Film Greni", "Lens Talimatları"].map((s) => (
              <div key={s} className="glass-cip flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px]"><span className="text-metin-2">{s}</span><span className="h-4 w-8 rounded-full bg-white/10" /></div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/8 p-4">
        <button onClick={() => uygula(B.ad)} className="hf-uret flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-semibold">
          <Sparkles className="h-4 w-4" />{arac === "renk" ? "Değişiklikleri Uygula" : B.ad}
        </button>
      </div>
    </>
  );
}

function SliderSatir({ ad, v }: { ad: string; v: number }) {
  const [val, setVal] = useState(v);
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center justify-between text-[13px]"><span className="text-metin-2">{ad}</span><span className="text-metin">{val}</span></div>
      <input type="range" min={0} max={100} value={val} onChange={(e) => setVal(Number(e.target.value))} className="h-1 w-full cursor-pointer accent-aksan" />
    </div>
  );
}
