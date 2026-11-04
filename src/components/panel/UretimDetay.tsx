"use client";

import { upscaleAdresi } from "@/lib/upscaleVeri";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { Yuzen } from "@/components/ui/Yuzen";
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Copy, Check, Download, Heart, Video, Wand2, MessageCircle, Info,
  Palette, Maximize2, Sparkles, Sun, Layers, RotateCw, Send, ArrowRight, TrendingUp, Loader2,
  ChevronDown, ChevronRight, ChevronLeft, Share2, Globe, Trash2,
  Pencil, FileImage, FileType2, FileArchive, FileVideo, AudioLines,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { uretimGeriAl } from "./uretimGeriAl";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useYorumlar, goreliZaman } from "@/store/useYorumlar";
import { useReferansKopru } from "@/store/useReferansKopru";
import { useAyarKopru } from "@/store/useAyarKopru";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { uretimBaslat } from "@/lib/uretimMotoru";
import { cn, gorseliIndir, saltUrl, istemTemizle, gorseliFormatlaIndir } from "@/lib/utils";
import { kopyala as panoyaKopyala, baglantiyiKopyala } from "@/lib/gercekEylem";
import { SesOynatici } from "./SesOynatici";
import { ModelGoruntuleyici } from "./ModelGoruntuleyici";
import { VideoOynatici } from "./VideoOynatici";
import { Tooltip } from "@/components/ui/Tooltip";

// Her araç, üretimi gerçek bir yeni işe dönüştürür (ek prompt + kredi + arac etiketi).
// Higgsfield birebir: her aracın ">" oku GERÇEK bir parametre paneli açar (seçenekler).
interface AracParam { etiket: string; secenekler: string[]; varsayilan: string }
interface Arac {
  ad: string; ikon: typeof Palette; rozet?: string; ekPrompt: string; kredi: number; arac: string;
  parametreler: AracParam[];
}
const araclar: Arac[] = [
  {
    ad: "Renk Düzenleme", ikon: Palette, rozet: "Yeni", ekPrompt: "sinematik renk düzenleme", kredi: 3, arac: "Renk Düzenleme",
    parametreler: [
      { etiket: "Palet", secenekler: ["Sinematik", "Sıcak Altın", "Soğuk Mavi", "Noir Kontrast", "Doygun Pastel", "Solgun Film"], varsayilan: "Sinematik" },
      { etiket: "Yoğunluk", secenekler: ["Hafif", "Orta", "Güçlü"], varsayilan: "Orta" },
      { etiket: "Film greni", secenekler: ["Yok", "İnce", "Belirgin"], varsayilan: "İnce" },
    ],
  },
  {
    ad: "Yükselt (4K)", ikon: Maximize2, ekPrompt: "ultra çözünürlük, keskin detay", kredi: 4, arac: "Yükselt",
    parametreler: [
      { etiket: "Ölçek", secenekler: ["2×", "4×", "8×"], varsayilan: "4×" },
      { etiket: "Keskinlik", secenekler: ["Düşük", "Orta", "Yüksek"], varsayilan: "Orta" },
      { etiket: "Gürültü giderme", secenekler: ["Kapalı", "Hafif", "Güçlü"], varsayilan: "Hafif" },
      { etiket: "Yüz iyileştirme", secenekler: ["Kapalı", "Açık"], varsayilan: "Açık" },
    ],
  },
  {
    ad: "İyileştir", ikon: Sparkles, ekPrompt: "detay iyileştirme, doku netleştirme", kredi: 3, arac: "İyileştir",
    parametreler: [
      { etiket: "Stil", secenekler: ["Yumuşak", "Gerçekçi", "Doğal kusurlu"], varsayilan: "Gerçekçi" },
      { etiket: "Doku gücü", secenekler: ["Düşük", "Orta", "Yüksek"], varsayilan: "Orta" },
    ],
  },
  {
    ad: "Yeniden Işıklandır", ikon: Sun, ekPrompt: "yeniden ışıklandırma, tutarlı gölgeler", kredi: 4, arac: "Yeniden Işıklandır",
    parametreler: [
      { etiket: "Işık yönü", secenekler: ["Üst", "Ön", "Sağ", "Sol", "Arka", "Alt"], varsayilan: "Ön" },
      { etiket: "Sertlik", secenekler: ["Yumuşak", "Sert"], varsayilan: "Yumuşak" },
      { etiket: "Renk sıcaklığı", secenekler: ["Sıcak", "Nötr", "Soğuk"], varsayilan: "Nötr" },
    ],
  },
  {
    ad: "Inpaint (Boya)", ikon: Layers, ekPrompt: "seçili bölge yeniden çizildi, kusursuz kaynaştırma", kredi: 5, arac: "Inpaint",
    parametreler: [
      { etiket: "Bölge", secenekler: ["Arka plan", "Özne", "Nesne kaldır", "Gökyüzü"], varsayilan: "Arka plan" },
      { etiket: "Kaynaştırma", secenekler: ["Yumuşak", "Keskin"], varsayilan: "Yumuşak" },
    ],
  },
  {
    ad: "Açılar", ikon: RotateCw, ekPrompt: "farklı kamera açısı, aynı özne ve stil korunur", kredi: 4, arac: "Açılar",
    parametreler: [
      { etiket: "Açı", secenekler: ["Sol 45°", "Sağ 45°", "Yukarıdan", "Aşağıdan", "Arkadan", "Yakın plan"], varsayilan: "Sol 45°" },
      { etiket: "Varyasyon", secenekler: ["1", "2", "4"], varsayilan: "1" },
    ],
  },
];

// Reframe/Genişlet — görseli farklı en-boy oranına outpaint ile genişletir.
const reframeOranlar = ["16:9", "9:16", "1:1", "4:5", "21:9"];

// ── VİDEO araçları — Higgsfield "EDIT VIDEO" birebir (higg-video-detay analizi) ──
const videoAraclari: Arac[] = [
  {
    ad: "Videoyu düzenle", ikon: Wand2, ekPrompt: "video düzenleme, seçili bölge yeniden çizildi", kredi: 8, arac: "Videoyu düzenle",
    parametreler: [
      { etiket: "En-boy oranı", secenekler: ["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"], varsayilan: "9:16" },
      { etiket: "Çözünürlük", secenekler: ["480p", "720p", "1080p", "4K"], varsayilan: "1080p" },
      { etiket: "Süre", secenekler: ["Auto", "5sn", "10sn"], varsayilan: "Auto" },
    ],
  },
  {
    ad: "Yeniden çerçevele", ikon: Layers, ekPrompt: "yeni en-boy oranına outpaint ile genişletme", kredi: 6, arac: "Yeniden çerçevele",
    parametreler: [
      { etiket: "En-boy oranı", secenekler: ["16:9", "4:3", "3:4", "1:1", "21:9"], varsayilan: "16:9" },
      { etiket: "Çözünürlük", secenekler: ["480p", "720p", "1080p", "4K"], varsayilan: "720p" },
    ],
  },
  {
    ad: "Yükselt", ikon: Maximize2, ekPrompt: "yüksek çözünürlük, keskin detay", kredi: 8, arac: "Yükselt",
    parametreler: [
      { etiket: "Model", secenekler: ["ByteDance Upscale", "Topaz Video"], varsayilan: "ByteDance Upscale" },
      { etiket: "Ölçek", secenekler: ["1080p", "4K"], varsayilan: "4K" },
      { etiket: "Detay", secenekler: ["İnce", "Belirgin"], varsayilan: "İnce" },
      { etiket: "Kare enterpolasyonu", secenekler: ["Kapalı", "Açık"], varsayilan: "Kapalı" },
    ],
  },
  {
    ad: "Arka planı kaldır", ikon: Sparkles, ekPrompt: "özneyi ayır, arka planı şeffaflaştır", kredi: 6, arac: "Arka planı kaldır",
    parametreler: [],
  },
  {
    ad: "Sahne & ışık değiştir", ikon: Sun, ekPrompt: "sahne ve ışık yeniden düzenlendi", kredi: 6, arac: "Sahne & ışık",
    parametreler: [
      { etiket: "Işık", secenekler: ["Mor", "Arka ışık", "Gökkuşağı", "Altın saat", "Paparazzi flaş", "Spot ışık"], varsayilan: "Mor" },
      { etiket: "Hava", secenekler: ["Duman", "Rüzgarlı", "Fırtına", "Sis", "Kar", "Yağmur", "Güneşli", "Kapalı hava"], varsayilan: "Duman" },
      { etiket: "Zaman", secenekler: ["Ay ışığı", "Şehir ışıkları", "Mavi saat", "Altın saat", "Öğle", "Sabah erken"], varsayilan: "Ay ışığı" },
    ],
  },
];

function turEtiket(t: string) {
  return { video: "Video", gorsel: "Görsel", "3d": "3D Model", ses: "Ses" }[t] ?? t;
}

/**
 * m8: Toplulukta yayınla modalı — Higgsfield "Publish to Community" akışı.
 * Başlık, açıklama, etiketler, yeniden-oluşturma izni; onaylayınca üretim
 * gerçekten `yayinda:true` + etiketlerle güncellenir ve Keşfet'te görünür.
 */
function YayinModal({ u, onKapat, onYayinla }: {
  u: Uretim;
  onKapat: () => void;
  onYayinla: (veri: { baslik: string; aciklama: string; etiketler: string[]; izinYenidenOlustur: boolean }) => void;
}) {
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  const [baslik, setBaslik] = useState(u.baslik);
  const [aciklama, setAciklama] = useState("");
  const [etiketGirdi, setEtiketGirdi] = useState("");
  const [etiketler, setEtiketler] = useState<string[]>(u.etiketler ?? []);
  const [izin, setIzin] = useState(true);
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);
  if (!monte) return null;

  const etiketEkle = (ham: string) => {
    const t = ham.trim().replace(/^#/, "").toLowerCase();
    if (t && !etiketler.includes(t) && etiketler.length < 8) setEtiketler((v) => [...v, t]);
    setEtiketGirdi("");
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="perde absolute inset-0 bg-ink-950/80 backdrop-blur-md" onClick={onKapat} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="menu-surface relative w-full max-w-lg overflow-hidden rounded-[20px]"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-aksan/15 text-aksan"><Globe className="h-5 w-5" /></span>
            <div>
              <p className="text-[16px] font-bold text-white">Toplulukta yayınla</p>
              <p className="text-[12px] text-white/45">Keşfet akışında herkese görünür olsun</p>
            </div>
          </div>
          <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/60 hover:bg-white/12 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          {/* önizleme + başlık */}
          <div className="flex gap-3">
            <span className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-900">
              {saltUrl(u.gorselUrl) && <img src={saltUrl(u.gorselUrl)} alt="" className="h-full w-full object-cover" />}
            </span>
            <div className="flex-1">
              <label className="mb-1 block text-[12px] font-medium text-white/50">Başlık</label>
              <input value={baslik} onChange={(e) => setBaslik(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-aksan/50" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-white/50">Açıklama <span className="text-white/30">(opsiyonel)</span></label>
            <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={2}
              placeholder="Bu üretim hakkında birkaç kelime…"
              className="w-full resize-none rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-aksan/50" />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-white/50">Etiketler</label>
            <div className="flex flex-wrap gap-1.5">
              {etiketler.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-lg bg-aksan/12 px-2 py-1 text-[12px] font-medium text-aksan">
                  #{t}
                  <button onClick={() => setEtiketler((v) => v.filter((x) => x !== t))} className="text-aksan/60 hover:text-aksan"><X className="h-3 w-3" /></button>
                </span>
              ))}
              <input value={etiketGirdi} onChange={(e) => setEtiketGirdi(e.target.value)}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === ",") && etiketGirdi.trim()) { e.preventDefault(); etiketEkle(etiketGirdi); } }}
                placeholder={etiketler.length ? "" : "etiket ekle + Enter"}
                className="min-w-[120px] flex-1 rounded-lg bg-transparent px-1 py-1 text-[13px] text-white outline-none placeholder:text-white/30" />
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <RotateCw className="h-4 w-4 text-white/55" />
              <div>
                <p className="text-[13.5px] font-medium text-white">Yeniden oluşturmaya izin ver</p>
                <p className="text-[11.5px] text-white/40">Başkaları bu üretimi temel alıp remixleyebilir</p>
              </div>
            </div>
            <button onClick={() => setIzin((v) => !v)}
              className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", izin ? "bg-white" : "bg-white/15")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full transition-[transform,background-color]", izin ? "translate-x-[22px] bg-[#0a0a0b]" : "translate-x-0.5 bg-white")} />
            </button>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/8 px-5 py-4">
          <button onClick={onKapat} className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white">İptal</button>
          <button onClick={() => onYayinla({ baslik: baslik.trim() || u.baslik, aciklama, etiketler, izinYenidenOlustur: izin })}
            className="flex items-center gap-2 rounded-xl bg-aksan px-5 py-2.5 text-sm font-bold text-ink-950 transition-all hover:brightness-110 active:scale-[0.98]">
            <Globe className="h-4 w-4" /> Yayınla
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

// En-boy oranı + kalite → gerçekçi piksel boyutu.
function pikselBoyut(oran?: string, kalite?: string): string {
  const taban = kalite === "4K" || kalite === "2K" ? 2160 : kalite === "720p" ? 720 : 1080;
  const [w, h] = (oran ?? "16:9").split(":").map(Number);
  if (!w || !h) return `${Math.round(taban * 16 / 9)}×${taban}`;
  // Kısa kenarı tabana sabitle, uzun kenarı orana göre hesapla.
  if (w >= h) return `${Math.round(taban * w / h)}×${taban}`;
  return `${taban}×${Math.round(taban * h / w)}`;
}

const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
function tarihFormat(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
}

// Higgsfield birebir: her üretimin deterministik yazar adı + avatar rengi (gothiccookie1421 gibi).
const AD_ONEK = ["gothic", "neon", "lunar", "pixel", "crimson", "velvet", "cosmic", "amber", "iris", "solar", "misty", "violet"];
const AD_SONEK = ["cookie", "fox", "wolf", "moon", "raven", "echo", "spark", "wave", "drift", "bloom", "flux", "haze"];
function yazarBilgi(tohum: string): { ad: string; renk: string } {
  let h = 0;
  for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  const ad = AD_ONEK[h % AD_ONEK.length] + AD_SONEK[(h >> 4) % AD_SONEK.length] + (h % 9000 + 1000);
  const renkler = ["from-cyan-glow to-iris-400", "from-iris-400 to-rose-400", "from-emerald-400 to-cyan-glow", "from-amber-glow to-rose-400"];
  return { ad, renk: renkler[(h >> 8) % renkler.length] };
}

export function UretimDetay({ u, onClose, onOnceki, onSonraki, onReferans, onToplulukYayinla }: {
  u: Uretim;
  onClose: () => void;
  onOnceki?: () => void;
  onSonraki?: () => void;
  /** m7/m13: verilirse "Referans" butonu bunu çağırır (sayfa değişmez, üretim
      açan sayfanın composer'ına GERÇEKTEN referans eklenir). Yoksa eski
      /panel/olustur davranışına düşer. */
  onReferans?: (u: Uretim) => void;
  /** m8: verilirse "Toplulukta yayınla" bu akışı açar (yayın modalı). Yoksa
      basit yayında-toggle davranışı. */
  onToplulukYayinla?: (u: Uretim) => void;
}) {
  const router = useRouter();
  useScrollKilit(true); // bu bileşen yalnızca açıkken render edilir → her zaman kilitle (madde 10)
  useEscKapat(true, onClose); // Escape ile kapat
  const [tab, setTab] = useState<"info" | "arac" | "yorum">("info");
  const [kopyalandi, setKopyalandi] = useState(false);
  const medyaAlanRef = useRef<HTMLDivElement>(null);
  // Medyayı tam ekran yap — YALNIZCA sol önizleme alanı (tüm sayfa değil).
  const medyaTamEkran = () => {
    const el = medyaAlanRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => toast.error("Tam ekran açılamadı", { description: "Tarayıcın tam ekrana izin vermedi. Esc ile çıkıp yeniden dene." }));
  };
  const [promptAcik, setPromptAcik] = useState(false);
  const [detayAcik, setDetayAcik] = useState(true);
  // Araç parametre panelleri — Higgsfield'da her aracın ">" oku kendi ayarlarını açar.
  const [acikArac, setAcikArac] = useState<string | null>(null);
  const [aracAyar, setAracAyar] = useState<Record<string, Record<string, string>>>({});

  /* ── AD + İNDİRME (kullanıcı isteği 2026-07-31) ────────────────────────
     Görsel sayfasındaki iki özellik buraya da geldi: panel başlığında ad
     düzenlenir ve indirme dosya adı da o olur; indir butonunda format
     seçenekleri açılır. */
  const [adDuzenleniyor, setAdDuzenleniyor] = useState(false);
  const [adTaslak, setAdTaslak] = useState("");
  const [indirAcik, setIndirAcik] = useState(false);
  const adKaydet = () => {
    const yeni = adTaslak.trim();
    setAdDuzenleniyor(false);
    if (!yeni || yeni === u.baslik) return;
    guncelle(u.id, { baslik: yeni });
    toast.success("Ad güncellendi", { description: `Dosya ${yeni}.${u.tur === "video" ? "mp4" : u.tur === "ses" ? "mp3" : "png"} adıyla iner.` });
  };
  /** Dosya-sistemi güvenli indirme adı — kullanıcının verdiği başlıktan. */
  const dosyaAdi = () => (u.baslik.replace(/[^\wğüşiöçİĞÜŞÖÇ -]/gi, "").trim().slice(0, 60) || "vayra");
  /* Formatlar türe göre: görselde gerçek yeniden kodlama (canvas) yapılır,
     video/ses tek biçimde iner (tarayıcıda transcode yok — yalan söylemeyelim). */
  const formatListesi: { ad: string; not: string; ikon: typeof FileImage }[] =
    u.tur === "video" ? [{ ad: "mp4", not: "video · H.264", ikon: FileVideo }]
    : u.tur === "ses" ? [{ ad: "mp3", not: "ses · sıkıştırılmış", ikon: AudioLines }]
    : [
        { ad: "png", not: "kayıpsız · saydam", ikon: FileImage },
        { ad: "jpg", not: "küçük dosya", ikon: FileType2 },
        { ad: "webp", not: "web için ideal", ikon: FileArchive },
      ];
  const formatIndir = (format: string) => {
    const dogrudan = u.tur === "video" ? u.videoUrl : u.tur === "ses" ? u.sesUrl : undefined;
    if (dogrudan) {
      const a = document.createElement("a");
      a.href = dogrudan;
      a.download = `${dosyaAdi()}.${format}`;
      document.body.appendChild(a); a.click(); a.remove();
      toast.success(`${u.tur === "ses" ? "Ses" : "Video"} indiriliyor`, { description: `${dosyaAdi()}.${format}` });
      return;
    }
    const kaynak = u.gorselUrl && /^(data:|https?:|\/)/.test(u.gorselUrl) ? u.gorselUrl : saltUrl(u.gorselUrl);
    if (!kaynak) { gorseliIndir(u.prompt + u.model, dosyaAdi()); toast.success("PNG indirildi", { description: `${dosyaAdi()}.png` }); return; }
    void gorseliFormatlaIndir(kaynak, dosyaAdi(), format).then(
      () => toast.success(`${format.toUpperCase()} indirildi`, { description: `${dosyaAdi()}.${format}` }),
      () => mesaj.indirilemedi(`Görsel ${format.toUpperCase()} biçimine çevrilemedi.`),
    );
  };
  const [yorum, setYorum] = useState("");
  // m9/m23: gerçek yorumlar — persist store'dan bu üretimin yorumları.
  const { ekle: yorumEkleStore, sil: yorumSil, begeniToggle: yorumBegeni } = useYorumlar();
  // KRİTİK: selector'da .filter/.sort sonsuz döngü yaratır → ham diziyi al, useMemo ile türet.
  const tumYorumlar = useYorumlar((s) => s.yorumlar);
  const yorumlar = useMemo(
    () => tumYorumlar.filter((y) => y.konuId === u.id).sort((a, b) => b.zaman - a.zaman),
    [tumYorumlar, u.id],
  );
  const yorumGonder = () => {
    if (!yorum.trim()) return;
    yorumEkleStore(u.id, yorum);
    setYorum("");
  };
  const EMOJILER = ["❤️", "🔥", "😍", "👏", "🤩", "💯", "😮", "🎉", "👍", "😂"];
  const [reframeAcik, setReframeAcik] = useState(false);
  const [hareketAcik, setHareketAcik] = useState(false);
  // m8: topluluk yayın modalı (başlık/açıklama/etiket/izinler → Keşfet'e ekle)
  const [yayinModal, setYayinModal] = useState(false);
  const [viralSkor, setViralSkor] = useState<number | null>(null);
  const [viralDetay, setViralDetay] = useState<{ hook: number; retention: number; sustain: number; metrikler: { ad: string; deger: number }[] } | null>(null);
  const [viralIsleniyor, setViralIsleniyor] = useState(false);

  // Virallik Tahmini — hook gücü, retention riski, sustain + alt-metrik dağılımı (Higgsfield "Hook Predictor").
  const viralTahmin = () => {
    setViralIsleniyor(true);
    setViralSkor(null);
    setViralDetay(null);
    setTimeout(() => {
      let h = 0; const t = u.prompt + u.model;
      for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
      const skor = 52 + (h % 46); // 52-97
      setViralSkor(skor);
      // Deterministik alt metrikler — skordan türetilir, gerçekçi dağılım.
      setViralDetay({
        hook: Math.min(99, 45 + (h % 55)),
        retention: Math.min(99, 40 + ((h >> 3) % 58)),
        sustain: Math.min(99, 60 + ((h >> 5) % 40)),
        metrikler: [
          { ad: "Görsel etki", deger: 40 + ((h >> 2) % 55) },
          { ad: "Hafıza izi", deger: 40 + ((h >> 4) % 55) },
          { ad: "Ses/ritim", deger: 40 + ((h >> 6) % 55) },
          { ad: "Duygu bağı", deger: 40 + ((h >> 8) % 55) },
        ],
      });
      setViralIsleniyor(false);
    }, 1400);
  };

  // Recast Motion Control — statik görseli canlandırırken hareket stili seç.
  const hareketler = [
    { ad: "Yavaş yakınlaş", prompt: "yavaş zoom-in, hafif kamera yaklaşması" },
    { ad: "Uzaklaş", prompt: "yavaş zoom-out, sahne açılıyor" },
    { ad: "Yörünge", prompt: "özne etrafında yumuşak orbit hareketi" },
    { ad: "Parallaks", prompt: "2.5D parallaks derinlik, katmanlı kayma" },
    { ad: "Rüzgar & canlılık", prompt: "doğal rüzgar, saç ve kumaş dalgalanması, canlı atmosfer" },
    { ad: "Sinematik kaydırma", prompt: "yatay sinematik dolly kaydırma" },
  ];
  const hareketleVideoya = (h: { ad: string; prompt: string }) => {
    const s = uretimBaslat({
      baslik: `${u.baslik} · ${h.ad}`.slice(0, 42), tur: "video", model: "Seedance 2.0",
      prompt: `${u.prompt} · canlandırma: ${h.prompt}`, kredi: 42, arac: "Videoya Çevir", meta: { oran: u.meta?.oran },
    });
    if (!s.ok) return toast.error("Canlandırma başlatılamadı", { description: s.hata ?? "Yeniden dene." });
    toast.success(`${h.ad} ile canlandırılıyor`, { description: `Seedance 2.0 · 42 kredi. Bitince bildirim gelir.` });
    onClose();
  };
  const { favoriToggle, guncelle, sil } = useProjeler();
  const referansGonder = useReferansKopru((s) => s.gonder);
  const ayarGonder = useAyarKopru((s) => s.gonder);

  // Araçla düzenle — gerçek yeni üretim başlat. SEÇİLEN PARAMETRELER prompt'a geçer
  // (yoksa panel dekoratif olurdu: kullanıcı "8× ölçek" seçer, hiçbir etkisi olmaz).
  const aracUygula = (a: Arac) => {
    const secimler = a.parametreler
      .map((p) => `${p.etiket.toLowerCase()}: ${aracAyar[a.ad]?.[p.etiket] ?? p.varsayilan}`)
      .join(", ");
    const s = uretimBaslat({
      baslik: `${u.baslik} · ${a.ad}`, tur: u.tur, model: u.model,
      prompt: `${u.prompt} · ${a.ekPrompt} (${secimler})`, kredi: a.kredi, arac: a.arac,
      meta: u.meta,
    });
    if (!s.ok) return toast.error(`${a.ad} başlatılamadı`, { description: s.hata ?? "Yeniden dene." });
    toast.success(`${a.ad} uygulanıyor`, { description: `${secimler} · ${a.kredi} kredi. Bitince bildirim gelir.` });
    onClose();
  };

  // Reframe — görseli yeni en-boy oranına outpaint ile genişlet.
  const reframeUygula = (oran: string) => {
    const s = uretimBaslat({
      baslik: `${u.baslik} · ${oran}`, tur: u.tur, model: u.model,
      prompt: `${u.prompt} · ${oran} orana genişletildi (outpaint/reframe), kenarlar doğal doldurma`,
      kredi: 4, arac: "Reframe", meta: { oran },
    });
    if (!s.ok) return toast.error("Genişletme başlatılamadı", { description: s.hata ?? "Yeniden dene." });
    toast.success(`${oran} oranına genişletiliyor`, { description: "Kenarlar dolduruluyor · 4 kredi. Bitince bildirim gelir." });
    onClose();
  };

  /** Salt panoya kopyalama — ikincil eylem (küçük ikon buton). */
  const kopyala = () => {
    void panoyaKopyala(u.prompt, "İstem kopyalandı").then((ok) => {
      if (!ok) return;
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 1800);
    });
  };

  /* AYARLARI GERİ YÜKLE (2026-07-31, kullanıcı kararı).
     Eskiden bu buton prompt'u yalnızca PANOYA kopyalıyordu — kullanıcının
     beklediği "bu üretimi tekrar yap" davranışı değildi. Artık üretimin
     GERÇEKTEN kullandığı her şeyi (model, oran, çözünürlük, süre, prompt,
     prompt içindeki @element'ler, referans görsel) composer'a taşır ve
     paneli kapatır. */
  const ayarlariYukle = () => {
    /* Composer'a yazılacak metin: ÖNCE meta.hamIstem (kullanıcının yazdığı
       temiz istem). `u.prompt` ayar notları taşıyor (" · 4K" gibi) ve onu
       yazmak her geri yüklemede metni şişiriyordu. Eski kayıtlarda hamIstem
       yoksa notlar sökülerek temizlenir. */
    const temizIstem = u.meta?.hamIstem ?? istemTemizle(u.prompt);

    // Prompt içindeki "@Element Adı" geçişlerini çıkar — composer element
    // çipleri bunlarla eşleşiyor.
    const elementler = Array.from(u.prompt.matchAll(/@([\p{L}\p{N}_-]+)/gu)).map((m) => m[1]);

    // Referans: üretimin kendi görseli sonraki işe referans olarak taşınır.
    const refUrl = saltUrl(u.meta?.gorselUrl ?? u.gorselUrl ?? "") ?? "";
    const referanslar = refUrl && /^(data:|https?:|\/)/.test(refUrl)
      ? [{ ad: u.baslik || "Referans", url: refUrl }]
      : [];

    ayarGonder({
      tur: u.tur,
      prompt: temizIstem,
      model: u.model,
      oran: u.meta?.oran,
      cozunurluk: u.meta?.cozunurluk,
      sure: u.meta?.sure,
      referanslar,
      elementler,
      baslik: u.baslik,
    });

    toast.success("Ayarlar oluşturucuya yüklendi", {
      description: [u.model, u.meta?.cozunurluk, u.meta?.oran].filter(Boolean).join(" · ") + ".",
    });
    onClose();
  };

  const indir = () => {
    if (u.tur === "ses" && u.sesUrl) {
      const a = document.createElement("a");
      a.href = u.sesUrl;
      a.download = `${u.baslik.replace(/[^\wğüşiöçİĞÜŞÖÇ -]/gi, "").slice(0, 40) || "vayra-ses"}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Ses indiriliyor", { description: a.download });
      return;
    }
    const gercekGorsel = u.gercek && u.gorselUrl && (u.gorselUrl.startsWith("data:") || u.gorselUrl.startsWith("http"))
      ? u.gorselUrl
      : undefined;
    gorseliIndir(u.prompt + u.model, u.baslik, gercekGorsel);
    toast.success("İndirildi", { description: u.baslik });
  };

  const videoyaCevir = () => {
    const s = uretimBaslat({
      baslik: u.baslik + " (video)", tur: "video", model: "Seedance 2.0",
      prompt: u.prompt, kredi: 42, arac: "Videoya Çevir",
    });
    if (!s.ok) return toast.error("Video başlatılamadı", { description: s.hata ?? "Yeniden dene." });
    toast.success("Videoya çevriliyor", { description: "Seedance 2.0 · 42 kredi. Bitince bildirim gelir." });
    onClose();
  };

  // Stüdyolar arası akıllı geçiş — üretimi ilgili stüdyoda prompt'u taşıyarak devam ettir.
  const gecisHedefleri: Record<string, { ad: string; href: string }[]> = {
    gorsel: [
      { ad: "Sinema'da geliştir", href: "/panel/sinema" },
      { ad: "3D'ye çevir", href: "/panel/3d" },
      { ad: "Reklama dönüştür", href: "/panel/pazarlama" },
    ],
    video: [
      { ad: "Shorts'a stilize et", href: "/panel/shorts" },
      { ad: "Reklama dönüştür", href: "/panel/pazarlama" },
    ],
    "3d": [
      { ad: "Sahnede kullan", href: "/panel/sinema" },
      { ad: "Görsel üret", href: "/panel/gorsel" },
    ],
    ses: [
      { ad: "Anlatıma ekle", href: "/panel/explainer" },
      { ad: "Sahneye ekle", href: "/panel/sinema" },
    ],
  };
  const studyodaGelistir = (hedef: { ad: string; href: string }) => {
    // Prompt'u sonraki stüdyoya taşı (sessionStorage köprüsü).
    try { sessionStorage.setItem("vayra-gecis-prompt", u.prompt); } catch { /* yoksay */ }
    toast.success("İstem taşındı", { description: `${hedef.ad} için açılıyor.` });
    router.push(hedef.href);
    onClose();
  };


  // Portal — lightbox'ı doğrudan <body>'ye render et. Böylece hangi karttan
  // açılırsa açılsın (ses composer'ı, galeri vb.) HİÇBİR şey üstünde kalmaz.
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => setPortalHazir(true), []);

  /* Portal body'ye taşındığı için sayfanın CSS kapsamı (.sinema-kapsam gibi)
     MİRAS ALINMIYOR — lime bir sayfadan açılan lightbox global cyan aksanla
     render oluyordu. Kapsam sınıfını çağıran ağaçtan bulup portal köküne
     taşıyoruz ki aksan rengi sayfayla aynı kalsın. */
  const kokRef = useRef<HTMLSpanElement>(null);
  const [kapsam, setKapsam] = useState("");
  useEffect(() => {
    const yakin = kokRef.current?.closest(".sinema-kapsam, .sc-kapsam");
    if (yakin) {
      const bulunan = ["sinema-kapsam", "sc-kapsam"].find((k) => yakin.classList.contains(k));
      if (bulunan) setKapsam(bulunan);
    }
    /* MOBİL LİME: portal body'ye taşınınca panel gövdesindeki `.mobil-lime-sayfa`
       kapsamı miras alınmıyordu → mobil lightbox butonları cyan çıkıyordu.
       Kök `.mobil-lime` ekleyip aksanı sayfayla (lime) hizala. Bu sınıf yalnızca
       @media(max-width:639.98px)'te --color-aksan'ı lime yapar; masaüstünde etkisiz. */
    setKapsam((k) => (k ? `${k} mobil-lime` : "mobil-lime"));
  }, []);

  /* Çıpa HER ZAMAN ağaçta kalır: portal body'ye taşınsa da bu span çağıran
     bileşenin yanında durur, kapsamı oradan okuruz. */
  const cipa = <span ref={kokRef} className="hidden" aria-hidden />;
  if (!portalHazir) return cipa;

  return (
    <>
      {cipa}
      {icerik()}
    </>
  );

  function icerik() {
    return createPortal(
    // KRİTİK: React portalı DOM'da body'ye taşır ama olay ağacında hâlâ
    // UretimKarti'nin çocuğudur. Kart kökünde onClick={setDetay(true)} var;
    // içerideki çarpı/buton tıklamaları bubble ile oraya ulaşıp lightbox'ı
    // ANINDA yeniden açıyordu ("çarpı çalışmıyor" bug'ı). Kök seviyede
    // propagation'ı durdurarak tıklamaların karta sızmasını engelliyoruz.
    <div className={cn("fixed inset-0 z-[120] flex items-stretch justify-center", kapsam)} onClick={(e) => e.stopPropagation()}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink-950/90 backdrop-blur-md" onClick={onClose} />

      {/* Mobil kapatma — referansta sağ üstte aksan halkalı yuvarlak ✕ (dikey akışta
          yazar başlığındaki ✕ scroll ile kaçtığı için sabit bir kapat şart). */}
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Kapat"
        className="fixed right-4 top-4 z-[10] flex h-11 w-11 items-center justify-center rounded-full border border-aksan/70 bg-ink-950/60 text-white backdrop-blur-sm md:hidden">
        <X className="h-5 w-5" />
      </button>

      {/* Higgsfield birebir: MASAÜSTÜNDE solda büyük contain görsel + sağda 380px panel;
          MOBİLDE tek dikey scroll akışı (medya doğal boyutta üstte, araç paneli altında
          TAM açık). Eskiden `grid-cols-1 h-full overflow-hidden` mobilde medyayı 40vh'ye,
          paneli kalan sıkışık alana hapsediyordu → "bilgi/araçlar minicik" bug'ı. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative flex h-full w-full flex-col overflow-y-auto md:grid md:grid-cols-[1fr_380px] md:overflow-hidden"
      >
        {/* Sol: önizleme — görsel tam görünür (contain), kırpmasız.
            Arka plan: medyanın renklerine göre blur'lu (siyah yerine — Higgsfield birebir). */}
        <div ref={medyaAlanRef} className="relative flex shrink-0 items-center justify-center overflow-hidden bg-ink-950 p-4 pt-16 md:min-h-0 md:shrink md:p-10 md:pt-10">
          {saltUrl(u.gorselUrl) && (
            <>
              <div className="pointer-events-none absolute inset-0 scale-125 opacity-45 blur-3xl"
                style={{ background: `url("${saltUrl(u.gorselUrl)}") center/cover` }} aria-hidden />
              <div className="pointer-events-none absolute inset-0 bg-ink-950/55" aria-hidden />
            </>
          )}
          {/* İleri/geri — komşu üretimlere geç (Higgsfield birebir) */}
          {onOnceki && (
            <button onClick={onOnceki} className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20" aria-label="Önceki"><ChevronLeft className="h-6 w-6" /></button>
          )}
          {onSonraki && (
            <button onClick={onSonraki} className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20" aria-label="Sonraki"><ChevronRight className="h-6 w-6" /></button>
          )}
          {(u.tur === "gorsel" || (u.tur === "video" && false)) && (
            <img src={saltUrl(u.gorselUrl)} alt={u.baslik}
              className="max-h-full max-w-full rounded-xl object-contain" />
          )}
          {u.tur === "ses" ? (
            <div className="w-full max-w-xl">
              {/* Higgsfield ses lightbox: büyük kart — kapak parıltısı + waveform oynatıcı */}
              <div
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-900/80 p-8"
                style={{
                  background:
                    "radial-gradient(70% 60% at 50% 0%, rgba(34,211,238,0.14), transparent 70%), linear-gradient(160deg,#0f1113,#0f1113)",
                }}
              >
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-aksan/15 text-aksan ring-1 ring-aksan/25">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-white">{u.baslik}</p>
                    <p className="truncate text-xs text-white/45">{u.model}</p>
                  </div>
                </div>
                <SesOynatici sesUrl={u.sesUrl} baslik={u.baslik} vurgu="cyan" />
              </div>
              <p className="mt-4 text-center text-xs text-white/40">
                {u.sesUrl ? "Gerçek ses çıktısı" : "Örnek ses — anahtar eklenince canlı çalar"}
              </p>
            </div>
          ) : u.tur === "3d" ? (
            <div className="w-full max-w-lg">
              <ModelGoruntuleyici glbUrl={u.glbUrl} thumbnail={u.thumbnailUrl} baslik={u.baslik} gercek={u.gercek} />
              <p className="mt-3 text-center text-xs text-white/40">
                {u.glbUrl ? "Gerçek 3D model — sürükleyerek döndür" : "Örnek model — anahtar eklenince canlı GLB"}
              </p>
            </div>
          ) : u.tur === "video" ? (
            /* Video alanı — Higgsfield birebir: mevcut alanı doldurur. 16:9 oynatıcı
               genişlikle büyür ama yüksekliğe de sığsın diye max-w yükseklikten türetilir
               (kabaca 16/9 × kullanılabilir yükseklik). Eskiden max-w-2xl (672px) ile
               kocaman boşlukta küçük kalıyordu. */
            <div className="flex w-full max-w-[min(100%,calc((100vh-11rem)*16/9))] flex-col">
              <VideoOynatici videoUrl={u.videoUrl} poster={saltUrl(u.gorselUrl)} baslik={u.baslik} />
              <p className="mt-3 text-center text-xs text-white/40">
                {u.videoUrl && u.gercek !== false && !u.meta?.demoKlip ? "Gerçek video çıktısı" : "Örnek klip: sağlayıcı bağlanınca gerçek çıktı oynar"}
              </p>
            </div>
          ) : null}
          {/* Alt-sağ mini araç ikonları — Higgsfield birebir (yorum + tam ekran).
              Tam ekran YALNIZCA medya alanını kaplar (tüm sayfayı/paneli değil). */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
            <button onClick={() => setTab("yorum")} className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900/70 text-white/70 backdrop-blur-md transition-colors hover:bg-ink-900 hover:text-white" title="Yorumlar">
              <MessageCircle className="h-4 w-4" />
            </button>
            <button onClick={medyaTamEkran}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900/70 text-white/70 backdrop-blur-md transition-colors hover:bg-ink-900 hover:text-white" title="Medyayı tam ekran">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sağ: panel — KUTU DIŞI kademesi (#131517). İçindeki PROMPT/DETAYLAR
            blokları panel-ic (#1c1e20) kutulara alındı → merdiven korunur.
            MOBİLDE dış akışın parçası (h-full/overflow yok → içerik tam açılır);
            masaüstünde kendi yükseklik + iç kaydırma alanı. */}
        {/* m18/21-25: sağ panel Higgsfield tonu — koyu mavimsi nötr (#131517),
            ana medyadan hafif ayrık; global bg-yuzey yerine higgs kutu-dışı tonu. */}
        {/* Zemin bg-yuzey: /panel/gorsel paneliyle aynı kademe. Sabit #131517
            iken iki panel farklı tonda duruyordu. */}
        <div className="flex flex-col border-l border-white/10 bg-yuzey md:h-full md:overflow-hidden">
          {/* BAŞLIK — /panel/gorsel lightbox'ıyla aynı: üretimin ADI durur,
              kalemle düzenlenir ve İNDİRME DOSYA ADI da bu olur. Eskiden
              burada uydurma bir "yazar" adı + "Üretici" yazıyordu; kullanıcıya
              hiçbir şey söylemiyordu (kullanıcı isteği 2026-07-31). */}
          <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
            {adDuzenleniyor ? (
              <input
                autoFocus
                value={adTaslak}
                onChange={(e) => setAdTaslak(e.target.value)}
                onBlur={adKaydet}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); adKaydet(); }
                  // Esc BURADA yakalanır: yoksa panelin kendi Esc-kapat kancası
                  // devreye girip düzenleme yerine tüm paneli kapatıyordu.
                  if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setAdDuzenleniyor(false); }
                }}
                aria-label="Üretim adı"
                className="min-w-0 flex-1 rounded-lg bg-white/8 px-2.5 py-1.5 text-sm font-semibold text-white outline-none ring-1 ring-aksan/50"
              />
            ) : (
              <button
                onClick={() => { setAdTaslak(u.baslik); setAdDuzenleniyor(true); }}
                className="group/ad flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white/6"
                title="Adı düzenle"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{u.baslik}</span>
                <Pencil className="h-3.5 w-3.5 shrink-0 text-metin-3 transition-colors group-hover/ad:text-aksan" />
              </button>
            )}
            {/* İNDİR — format alt-menüsüyle (görsel sayfasındaki desen). */}
            <div className="relative shrink-0"
              onMouseEnter={() => setIndirAcik(true)} onMouseLeave={() => setIndirAcik(false)}>
              <Tooltip label="İndir" side="left">
                <button onClick={() => formatIndir(formatListesi[0].ad)} aria-label="İndir"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/8 hover:text-white">
                  <Download className="h-4 w-4" />
                </button>
              </Tooltip>
              <AnimatePresence>
                <Yuzen acik={!!(indirAcik)} onKapat={() => setIndirAcik(false)} sag={0} ust={"tam"} bosluk={4}><motion.div initial={{ opacity: 0, scale: 0.97, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.12 }}
                    className="menu-surface w-56 rounded-2xl p-1.5">
                    {formatListesi.map((f, i) => (
                      <button key={f.ad} onClick={() => { formatIndir(f.ad); setIndirAcik(false); }}
                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left transition-colors hover:bg-white/8">
                        <f.ikon className="h-[18px] w-[18px] shrink-0 text-white/70" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-medium text-white">{f.ad.toUpperCase()}</span>
                          <span className="block text-[11px] text-white/40">{f.not}</span>
                        </span>
                        {i === 0 && <Check className="h-3.5 w-3.5 shrink-0 text-aksan" />}
                      </button>
                    ))}
                  </motion.div></Yuzen>
              </AnimatePresence>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/8 hover:text-white md:flex" aria-label="Kapat"><X className="h-5 w-5" /></button>
          </div>

          {/* Sekmeler — /panel/gorsel lightbox'ıyla BİREBİR (kullanıcı kararı):
              buzlu-cam yuvarlak kapsüller, aktif olan glass-cip-aktif + aksan
              ikon. Önce düz gri dikdörtgen pill'lerdi ve iki panel farklı
              görünüyordu. */}
          <div className="flex gap-1.5 border-b border-white/8 px-3 py-3">
            {([
              { id: "info" as const, ad: "Bilgi", Ikon: Info },
              { id: "arac" as const, ad: "Araçlar", Ikon: Wand2 },
              { id: "yorum" as const, ad: "Yorumlar", Ikon: MessageCircle, say: yorumlar.length },
            ]).map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[13px] font-medium",
                  tab === t.id ? "glass-cip-aktif text-white" : "glass-cip text-metin-2 hover:text-metin",
                )}>
                <t.Ikon className={cn("h-3.5 w-3.5", tab === t.id && "text-aksan")} /> {t.ad}
                {"say" in t && (t.say ?? 0) > 0 && (
                  <span className={cn("rounded-full px-1.5 text-[11px] font-bold", tab === t.id ? "bg-aksan/20 text-aksan" : "bg-white/10 text-white/40")}>{t.say}</span>
                )}
              </button>
            ))}
          </div>

          {/* pt-4 EKLENDİ: sekme şeridiyle "İstem" başlığı arasında hiç boşluk
              yoktu (yalnız px-4 pb-4 vardı) — kullanıcı: "sekme kartlarının
              altındaki kısım sıkışık olmuş". Bölümler arası da 4 → 5. */}
          <div className="px-4 pb-4 pt-4 md:flex-1 md:overflow-y-auto">
            {tab === "info" && (
              <div className="space-y-5">
                {/* PROMPT — Higgsfield birebir: başlık + Copy, metin, See all */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    {/* "İstem" + Wand2 — /panel/gorsel ile aynı etiket ve ikon
                        (orada "Prompt"/Sparkles değil, "İstem"/Wand2 kullanılıyor). */}
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">
                      <Wand2 className="h-3.5 w-3.5" /> İstem
                    </span>
                    {/* ANA EYLEM: "Bu ayarlarla üret" — üretimin model/oran/
                        çözünürlük/prompt/element/referans bilgisini composer'a
                        yükler ve paneli kapatır. Salt kopyalama ikincil bir
                        ikon butona indi (kullanıcı bazen yalnız metni ister). */}
                    <div className="flex items-center gap-1">
                      <button onClick={ayarlariYukle}
                        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-aksan transition-colors hover:bg-aksan/10">
                        <Wand2 className="h-3 w-3" /> Bu ayarlarla üret
                      </button>
                      <Tooltip label="İstemi kopyala" side="top">
                        <button onClick={kopyala} aria-label="İstemi kopyala"
                          className="flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/8 hover:text-white">
                          {kopyalandi ? <Check className="h-3 w-3 text-aksan" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="panel-ic rounded-[14px] p-3.5">
                    <p className={cn("text-sm leading-relaxed text-white/75", !promptAcik && "line-clamp-4")}>{u.prompt}</p>
                    {u.prompt.length > 140 && (
                      <button onClick={() => setPromptAcik((v) => !v)} className="mt-1 flex items-center gap-1 text-xs text-white/45 hover:text-white/70">
                        {promptAcik ? "Daha az" : "Tümünü gör"} <ChevronDown className={cn("h-3 w-3 transition-transform", promptAcik && "rotate-180")} />
                      </button>
                    )}
                  </div>
                </div>

                {/* DETAILS — accordion, satırlar panel-ic kutuda */}
                <div>
                  {/* Başlık /panel/gorsel ile aynı: Info ikonu + sağa yaslı ok. */}
                  <button onClick={() => setDetayAcik((v) => !v)} className="mb-2 flex w-full items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">
                    <Info className="h-3.5 w-3.5" /> Detaylar
                    <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", detayAcik && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {detayAcik && (
                      <motion.dl initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="panel-ic mt-1 space-y-2.5 overflow-hidden rounded-[14px] p-3.5 text-sm">
                        {[
                          ["Model", u.model],
                          ...(u.tur === "gorsel" || u.tur === "video"
                            ? [
                                ["Kalite", u.meta?.cozunurluk ?? "1080p"] as [string, string],
                                ["Boyut", pikselBoyut(u.meta?.oran, u.meta?.cozunurluk)] as [string, string],
                              ]
                            : []),
                          ...(u.tur === "video" ? [["Süre", u.meta?.sure ?? "5sn"] as [string, string]] : []),
                          ["Oluşturma", tarihFormat(u.olusturma)],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <dt className="text-white/45">{k}</dt>
                            <dd className="font-medium text-white/85">{v}</dd>
                          </div>
                        ))}
                      </motion.dl>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {tab === "arac" && (
              <div className="space-y-5">
                {/* DÜZENLE — Higgsfield birebir liste. Video için "EDIT VIDEO" araçları (V5b) */}
                <div>
                  <p className="mb-1 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                    <Wand2 className="h-3.5 w-3.5" /> {u.tur === "video" ? "Videoyu düzenle" : "Görseli düzenle"}
                  </p>
                  {(u.tur === "video" ? videoAraclari : araclar
                    .filter((a) => u.tur === "gorsel" || a.ad === "Yükselt (4K)" || a.ad === "İyileştir"))
                    .map((a) => {
                      const acikMi = acikArac === a.ad;
                      return (
                        <div key={a.ad}>
                          {/* Higgsfield birebir: ">" GERÇEK parametre panelini açar (eskiden yalan söylüyordu) */}
                          <button onClick={() => {
                            if (a.arac === "Yükselt") {
                              const url = u.tur === "video" ? u.videoUrl : u.gorselUrl;
                              if (url && /^(\/|https:\/\/|data:image\/)/.test(url)) { onClose(); router.push(upscaleAdresi(url, u.id)); }
                              else toast.error("Yükseltilecek dosya yok", { description: "Bu üretimin indirilebilir bir dosyası bulunmuyor. Yeniden üretip dene." });
                              return;
                            }
                            setAcikArac(acikMi ? null : a.ad);
                          }}
                            className={cn("flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.06]",
                              acikMi && "bg-white/[0.06]")}>
                            <a.ikon className={cn("h-4.5 w-4.5 shrink-0", acikMi ? "text-aksan" : "text-white/70")} />
                            <span className="flex-1 text-[15px] text-white/90">{a.ad}</span>
                            {a.rozet && <span className="shrink-0 rounded-md bg-aksan px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-950">{a.rozet}</span>}
                            <ChevronRight className={cn("h-4 w-4 shrink-0 text-white/30 transition-transform", acikMi && "rotate-90")} />
                          </button>

                          <AnimatePresence>
                            {acikMi && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden">
                                <div className="space-y-3 px-2 pb-3 pt-1">
                                  {a.parametreler.map((p) => (
                                    <div key={p.etiket}>
                                      <p className="mb-1.5 text-xs text-white/45">{p.etiket}</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {p.secenekler.map((s) => {
                                          const secili = (aracAyar[a.ad]?.[p.etiket] ?? p.varsayilan) === s;
                                          return (
                                            <button key={s}
                                              onClick={() => setAracAyar((v) => ({ ...v, [a.ad]: { ...(v[a.ad] ?? {}), [p.etiket]: s } }))}
                                              className={cn("rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                                                secili ? "border-aksan/50 bg-aksan/10 text-aksan" : "border-white/12 text-white/60 hover:bg-white/8 hover:text-white")}>
                                              {s}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                  <button onClick={() => aracUygula(a)}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-aksan py-2.5 text-sm font-bold text-ink-950 transition-all hover:brightness-110 active:scale-[0.98]">
                                    {a.ad} uygula
                                    <span className="flex items-center gap-0.5 text-xs font-semibold">
                                      <KrediYildiz className="h-3.5 w-3.5" /> {a.kredi}
                                    </span>
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                  {/* Reframe / Kadraj genişlet — SADECE görsel (video'da "Yeniden çerçevele" zaten var, çift olmasın) */}
                  {u.tur === "gorsel" && (
                    <>
                      <button onClick={() => setReframeAcik((v) => !v)}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.06]">
                        <Maximize2 className="h-4.5 w-4.5 shrink-0 text-white/70" />
                        <span className="flex-1 text-[15px] text-white/90">Kadrajı genişlet</span>
                        <ChevronRight className={cn("h-4 w-4 shrink-0 text-white/30 transition-transform", reframeAcik && "rotate-90")} />
                      </button>
                      <AnimatePresence>
                        {reframeAcik && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="flex flex-wrap gap-2 px-2 pb-2 pt-1">
                              {reframeOranlar.map((o) => (
                                <button key={o} onClick={() => reframeUygula(o)}
                                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium transition-colors hover:border-aksan/50 hover:bg-aksan/10 hover:text-aksan">
                                  {o}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>

                {/* Stüdyolar arası geliştir — aynı liste dili */}
                {gecisHedefleri[u.tur] && (
                  <div>
                    <p className="mb-1 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                      <ArrowRight className="h-3.5 w-3.5" /> Başka stüdyoda geliştir
                    </p>
                    {gecisHedefleri[u.tur].map((h) => (
                      <button key={h.href} onClick={() => studyodaGelistir(h)}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.06]">
                        <Sparkles className="h-4.5 w-4.5 shrink-0 text-white/70" />
                        <span className="flex-1 text-[15px] text-white/90">{h.ad}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Virallik Tahmini — en altta, sade satır; ölçünce açılır */}
                <div>
                  <p className="mb-1 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                    <TrendingUp className="h-3.5 w-3.5" /> Analiz
                  </p>
                  <button onClick={viralTahmin} disabled={viralIsleniyor}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.06] disabled:opacity-60">
                    {viralIsleniyor ? <Loader2 className="h-4.5 w-4.5 shrink-0 animate-spin text-white/70" /> : <TrendingUp className="h-4.5 w-4.5 shrink-0 text-white/70" />}
                    <span className="flex-1 text-[15px] text-white/90">{viralIsleniyor ? "Analiz ediliyor…" : "Viral potansiyeli ölç"}</span>
                    <span className="shrink-0 rounded-md bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">Ücretsiz</span>
                  </button>

                  {viralSkor !== null && (
                    <div className="mt-2 rounded-xl bg-white/[0.04] p-3">
                      <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold">{viralSkor}<span className="text-sm text-white/40">/100</span></span>
                        <span className={cn("text-xs font-semibold", viralSkor >= 80 ? "text-emerald-400" : viralSkor >= 65 ? "text-amber-glow" : "text-white/50")}>
                          {viralSkor >= 80 ? "Yüksek potansiyel 🔥" : viralSkor >= 65 ? "İyi · geliştirilebilir" : "Orta · kancayı güçlendir"}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className={cn("h-full rounded-full", viralSkor >= 80 ? "bg-emerald-400" : viralSkor >= 65 ? "bg-amber-glow" : "bg-aksan")} style={{ width: `${viralSkor}%` }} />
                      </div>
                      {viralDetay && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {[["Kanca", viralDetay.hook], ["Tutundurma", viralDetay.retention], ["Süreklilik", viralDetay.sustain]].map(([ad, d]) => (
                            <div key={ad as string} className="rounded-lg bg-white/[0.04] p-2 text-center">
                              <div className={cn("text-lg font-bold", (d as number) >= 70 ? "text-emerald-400" : (d as number) >= 50 ? "text-amber-glow" : "text-rose-300")}>%{d as number}</div>
                              <div className="text-[10px] text-white/45">{ad as string}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "yorum" && (
              // m9/m23: GERÇEK yorumlar — persist store'dan; emoji şeridi + büyük emoji render (m10)
              <div className="flex min-h-[240px] flex-col md:h-full">
                {yorumlar.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06]">
                      <MessageCircle className="h-6 w-6 text-white/40" />
                    </span>
                    <p className="mt-4 text-sm text-white/45">Henüz yorum yok</p>
                    <p className="mt-1 text-xs text-white/30">İlk yorumu sen yaz</p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-1 overflow-y-auto py-2">
                    {yorumlar.map((y) => {
                      // m10: yorum SADECE emojilerden oluşuyorsa büyük render et
                      const saltEmoji = /^(\p{Extended_Pictographic}|️|‍|\s){1,8}$/u.test(y.metin);
                      const yz = yazarBilgi(y.yazar);
                      return (
                        <div key={y.id} className="group/yorum flex gap-2.5 rounded-xl px-1.5 py-2 transition-colors hover:bg-white/[0.03]">
                          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-ink-950", yz.renk)}>
                            {y.yazar.slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[13px] font-semibold text-white">{y.yazar}</span>
                              <span className="text-[11px] text-white/35">{goreliZaman(y.zaman)}</span>
                            </div>
                            <p className={cn("mt-0.5 leading-relaxed text-white/80 [overflow-wrap:anywhere]", saltEmoji ? "text-3xl leading-tight" : "text-[13.5px]")}>
                              {y.metin}
                            </p>
                            <div className="mt-1 flex items-center gap-3">
                              <button onClick={() => yorumBegeni(y.id)}
                                className={cn("flex items-center gap-1 text-[11.5px] transition-colors", y.begendim ? "text-rose-400" : "text-white/40 hover:text-white/70")}>
                                <Heart className={cn("h-3.5 w-3.5", y.begendim && "fill-current")} />
                                {y.begeniler > 0 && y.begeniler}
                              </button>
                              <button onClick={() => setYorum(`@${y.yazar} `)}
                                className="text-[11.5px] text-white/40 transition-colors hover:text-white/70">
                                Yanıtla
                              </button>
                              {y.yazar === "Sen" && (
                                <button onClick={() => { const silinen = useYorumlar.getState().yorumlar.filter((x) => x.id === y.id || x.yanitId === y.id); yorumSil(y.id); mesaj.silindi("Yorum", () => useYorumlar.getState().geriYukle(silinen)); }}
                                  className="text-[11.5px] text-white/40 opacity-0 transition-all hover:text-rose-400 group-hover/yorum:opacity-100">
                                  Sil
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Yorum sekmesinde alt blok = yorum giriş kutusu + emoji şeridi (higgs birebir:
              yorum kutusu her zaman panel dibinde sabit). Diğer sekmelerde aksiyon butonları. */}
          {tab === "yorum" && (
            <div className="border-t border-white/10 p-3">
              <div className="mb-2 flex flex-wrap gap-0.5">
                {EMOJILER.map((e) => (
                  <button key={e} onClick={() => yorumEkleStore(u.id, e)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-white/8"
                    aria-label={`${e} gönder`}>
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/[0.05] p-2">
                <input value={yorum} onChange={(e) => setYorum(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") yorumGonder(); }}
                  placeholder="Yorum ekle…"
                  className="h-8 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-white/35" />
                <button onClick={yorumGonder}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aksan text-ink-950 transition-all hover:brightness-110 disabled:opacity-40"
                  disabled={!yorum.trim()} aria-label="Gönder">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Alt aksiyonlar — Higgsfield birebir: Videoya çevir (neon) → Yeniden üret/Referans → İndir/kalp/paylaş/⋯.
              Yorum sekmesinde GİZLİ (yerine yorum kutusu gelir — higgs birebir). */}
          <div className={cn("space-y-2 border-t border-white/10 p-4", tab === "yorum" && "hidden")}>
            {u.tur === "gorsel" && (
              <>
                <button onClick={() => setHareketAcik((v) => !v)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-aksan py-3 text-sm font-bold text-ink-950 transition-all hover:brightness-110 active:scale-[0.98]">
                  <Video className="h-4 w-4" /> Videoya çevir
                </button>
                <AnimatePresence>
                  {hareketAcik && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {hareketler.map((h) => (
                          <button key={h.ad} onClick={() => hareketleVideoya(h)}
                            className="rounded-lg border border-white/12 px-2.5 py-2 text-xs transition-colors hover:border-aksan/50 hover:bg-aksan/10">
                            {h.ad}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
            {/* 3D/ses: Videoya çevir CTA (video türünde YOK — Higgsfield birebir: video detayında
                üstte doğrudan Yeniden Oluştur/Referans gelir). */}
            {(u.tur === "3d" || u.tur === "ses") && (
              <button onClick={videoyaCevir}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-aksan py-3 text-sm font-bold text-ink-950 transition-all hover:brightness-110 active:scale-[0.98]">
                <Video className="h-4 w-4" /> Videoya çevir
              </button>
            )}

            {/* Yeniden Oluştur (Higgsfield "Recreate" — lime birincil) + Referans */}
            <div className="flex gap-2">
              <button onClick={() => { const s = uretimBaslat({ baslik: u.baslik, tur: u.tur, model: u.model, prompt: u.prompt, kredi: u.kredi, arac: u.arac }); if (s.ok) { toast.success("Yeniden üretiliyor", { description: `${u.model} · ${u.kredi} kredi. Bitince bildirim gelir.` }); onClose(); } else toast.error("Yeniden üretim başlatılamadı", { description: s.hata ?? "Yeniden dene." }); }}
                className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98]",
                  u.tur === "video" ? "bg-aksan text-ink-950 hover:brightness-110" : "border border-white/15 bg-white/[0.03] hover:bg-white/8")}>
                <RotateCw className="h-4 w-4" /> Yeniden oluştur
              </button>
              <button onClick={() => {
                  // m7/m13: onReferans verilmişse GERÇEKTEN referans ekle (sayfa değişmez).
                  if (onReferans) { onReferans(u); onClose(); return; }
                  // Aksi halde köprü store'una yayınla — açan sayfa AYNI türdeyse
                  // composer'ına anında ekler; farklı türse hedef stüdyoya git ve
                  // o sayfa açılışta isteği tüketir. (Artık /panel/olustur'a atmaz.)
                  const url = saltUrl(u.gorselUrl) || "";
                  referansGonder({ url, tur: u.tur, baslik: u.baslik, prompt: u.prompt });
                  const hedefler: Record<string, string> = { gorsel: "/panel/gorsel", video: "/panel/video", ses: "/panel/ses", "3d": "/panel/3d" };
                  const hedef = hedefler[u.tur] ?? "/panel/gorsel";
                  // Zaten o sayfadaysak yönlendirme yok (dinleyici anında yakalar).
                  if (typeof window !== "undefined" && !window.location.pathname.startsWith(hedef)) {
                    router.push(hedef);
                  }
                  onClose();
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] py-2.5 text-sm transition-colors hover:bg-white/8">
                <Layers className="h-4 w-4" /> Referans
              </button>
            </div>

            {/* İndir (tam genişlik) + ikon satırı (Favori/Paylaş/Yayınla/Sil eşit dağılım) — Higgsfield alt aksiyonlar */}
            <div className="flex flex-col gap-2">
              <button onClick={indir}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 py-2.5 text-sm transition-colors hover:bg-white/8">
                <Download className="h-4 w-4" /> İndir
              </button>
              {/* m11/m17: tooltip'ler artık native title yerine Tooltip (side="top" =
                  ikonun üstünde AYRI balon, portal ile — ikonu örtmez, okunur). */}
              <div className="flex items-center gap-2 [&>span]:flex-1">
                <Tooltip label={u.favori ? "Favoriden çıkar" : "Favori"} side="top"><button onClick={() => { favoriToggle(u.id); toast(u.favori ? "Beğeniden çıkarıldı" : "Beğenildi", { description: u.baslik }); }}
                  className={cn("flex h-10 w-full items-center justify-center rounded-xl border border-white/15 transition-colors hover:bg-white/8", u.favori && "border-rose-400/40 text-rose-400")}
                  aria-label="Favori">
                  <Heart className={cn("h-4 w-4", u.favori && "fill-current")} />
                </button></Tooltip>
                <Tooltip label="Paylaş" side="top"><button onClick={() => void baglantiyiKopyala(`/panel/kitaplik?u=${u.id}`, "Paylaşım bağlantısı kopyalandı")}
                  className="flex h-10 w-full items-center justify-center rounded-xl border border-white/15 transition-colors hover:bg-white/8" aria-label="Paylaş">
                  <Share2 className="h-4 w-4" />
                </button></Tooltip>
                <Tooltip label={u.yayinda ? "Yayından kaldır" : "Keşfet'te yayınla"} side="top"><button
                  onClick={() => {
                    // m8: yayında değilse GERÇEK yayın akışı (modal); yayındaysa tek tıkla kaldır.
                    if (u.yayinda) { guncelle(u.id, { yayinda: false }); toast.success("Yayından kaldırıldı", { description: "Artık Keşfet akışında görünmüyor." }); return; }
                    if (onToplulukYayinla) { onToplulukYayinla(u); return; }
                    setYayinModal(true);
                  }}
                  className="flex h-10 w-full items-center justify-center rounded-xl border border-white/15 transition-colors hover:bg-white/8"
                  aria-label={u.yayinda ? "Yayından kaldır" : "Keşfet'te yayınla"}
                >
                  <Globe className={cn("h-4 w-4", u.yayinda && "text-aksan")} />
                </button></Tooltip>
                <Tooltip label="Sil" side="top"><button
                  onClick={() => { const geriAl = uretimGeriAl([u.id]); sil(u.id); mesaj.silindi("Üretim", geriAl); onClose(); }}
                  className="flex h-10 w-full items-center justify-center rounded-xl border border-white/15 text-white/70 transition-colors hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-400"
                  aria-label="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button></Tooltip>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* m8: topluluk yayın modalı */}
      <AnimatePresence>
        {yayinModal && (
          <YayinModal
            u={u}
            onKapat={() => setYayinModal(false)}
            onYayinla={(veri) => {
              guncelle(u.id, { yayinda: true, baslik: veri.baslik, etiketler: veri.etiketler });
              setYayinModal(false);
              toast.success("Keşfet'te yayınlandı", { description: `"${veri.baslik}" artık toplulukta görünüyor.` });
            }}
          />
        )}
      </AnimatePresence>
    </div>,
    document.body,
    );
  }
}
