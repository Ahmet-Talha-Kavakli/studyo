/* Vayra durum sayfası — paylaşılan veri modeli (istemci + sunucu).
   Bileşenler gerçek servislerdir. Olay kayıtları uydurma değildir: yalnızca sürüm notlarında
   (src/lib/surumler.ts) belgelenmiş, düzeltilmiş gerçek hatalardan derlenir. Kayıt olmayan günler
   "olay bildirilmedi" olarak gösterilir; ölçüm geçmişi ise sunucunun ilk ölçüm anından başlar. */

export type DurumKodu = "calisiyor" | "yavas" | "kismi" | "kesinti" | "bakim" | "demo";

export const DURUM: Record<DurumKodu, { ad: string; kisa: string; renk: string; metin: string; agirlik: number }> = {
  calisiyor: { ad: "Çalışıyor", kisa: "Çalışıyor", renk: "#3fb37f", metin: "text-emerald-400", agirlik: 0 },
  demo: { ad: "Önizleme modu", kisa: "Önizleme", renk: "#6b7280", metin: "text-metin-3", agirlik: 0 },
  bakim: { ad: "Bakımda", kisa: "Bakım", renk: "#4f8fea", metin: "text-sky-400", agirlik: 1 },
  yavas: { ad: "Performans düşük", kisa: "Yavaş", renk: "#e3b341", metin: "text-amber-300", agirlik: 2 },
  kismi: { ad: "Kısmi kesinti", kisa: "Kısmi kesinti", renk: "#f0883e", metin: "text-orange-400", agirlik: 3 },
  kesinti: { ad: "Büyük kesinti", kisa: "Kesinti", renk: "#e5534b", metin: "text-rose-400", agirlik: 4 },
};

export type Olcum = "web" | "api" | "mcp" | "tur:gorsel" | "tur:video" | "tur:ses" | "tur:3d" | `saglayici:${string}`;

export interface Bilesen {
  id: string;
  ad: string;
  aciklama: string;
  /** Hangi gerçek ölçümden durum alır. */
  olcum: Olcum;
}
export interface BilesenGrubu { id: string; ad: string; bilesenler: Bilesen[] }

export const GRUPLAR: BilesenGrubu[] = [
  {
    id: "uygulama", ad: "Vayra uygulaması", bilesenler: [
      { id: "web", ad: "Web uygulaması (vayra.ai)", aciklama: "Site, panel ve tüm sayfalar", olcum: "web" },
      { id: "kimlik", ad: "Giriş ve hesaplar", aciklama: "Giriş, kayıt, iki adımlı doğrulama", olcum: "web" },
      { id: "kitaplik", ad: "Kitaplık ve projeler", aciklama: "Üretimlerin saklanması ve düzenlenmesi", olcum: "web" },
      { id: "presetler", ad: "Presetler", aciklama: "Viral presetler ve preset stüdyosu", olcum: "tur:video" },
      { id: "odeme", ad: "Ödemeler ve faturalar", aciklama: "Abonelik, kredi paketleri, makbuzlar", olcum: "web" },
      { id: "earn", ad: "Vayra Earn ödemeleri", aciklama: "Kreatör kazançları ve çekimler", olcum: "web" },
    ],
  },
  {
    id: "studyo", ad: "Üretim stüdyoları", bilesenler: [
      { id: "gorsel", ad: "Görsel üretimi", aciklama: "Görsel stüdyosu ve araçları", olcum: "tur:gorsel" },
      { id: "video", ad: "Video üretimi", aciklama: "Video, sinema, uzun video, montaj", olcum: "tur:video" },
      { id: "ses", ad: "Ses ve seslendirme", aciklama: "Ses stüdyosu, klonlama", olcum: "tur:ses" },
      { id: "muzik", ad: "Müzik üretimi", aciklama: "Şarkı ve enstrümantal", olcum: "tur:ses" },
      { id: "uc", ad: "3D üretimi", aciklama: "Metinden ve görselden 3D", olcum: "tur:3d" },
    ],
  },
  {
    id: "gelistirici", ad: "Geliştirici", bilesenler: [
      { id: "api", ad: "REST API (api.vayra.ai/v1)", aciklama: "Üretim, model ve hesap uç noktaları", olcum: "api" },
      { id: "mcp", ad: "MCP sunucusu", aciklama: "Claude, Cursor ve VS Code bağlantısı", olcum: "mcp" },
      { id: "webhook", ad: "Webhook teslimi", aciklama: "İmzalı olay bildirimleri", olcum: "api" },
    ],
  },
  {
    id: "saglayici", ad: "Model sağlayıcıları", bilesenler: [
      { id: "veo", ad: "Google Veo", aciklama: "Video modelleri", olcum: "saglayici:veo" },
      { id: "gemini", ad: "Google Nano Banana", aciklama: "Görsel modelleri", olcum: "saglayici:gemini" },
      { id: "kling", ad: "Kuaishou Kling", aciklama: "Video modelleri", olcum: "saglayici:kling" },
      { id: "seedance", ad: "ByteDance Seedance", aciklama: "Video modelleri", olcum: "saglayici:seedance" },
      { id: "seedream", ad: "ByteDance Seedream", aciklama: "Görsel modelleri", olcum: "saglayici:seedream" },
      { id: "minimax", ad: "MiniMax Hailuo", aciklama: "Video modelleri", olcum: "saglayici:minimax" },
      { id: "openai", ad: "OpenAI GPT Image", aciklama: "Görsel modelleri", olcum: "saglayici:openai" },
      { id: "eleven", ad: "ElevenLabs", aciklama: "Ses modelleri", olcum: "saglayici:eleven" },
      { id: "meshy", ad: "Meshy", aciklama: "3D modelleri", olcum: "saglayici:meshy" },
    ],
  },
];
export const TUM_BILESENLER = GRUPLAR.flatMap((g) => g.bilesenler.map((b) => ({ ...b, grup: g.id })));

export type OlayEvre = "inceleniyor" | "tespit" | "izleniyor" | "guncelleme" | "cozuldu" | "planlandi" | "suruyor" | "tamamlandi";
export const EVRE_AD: Record<OlayEvre, string> = {
  inceleniyor: "İnceleniyor", tespit: "Neden bulundu", izleniyor: "İzleniyor", guncelleme: "Güncelleme", cozuldu: "Çözüldü",
  planlandi: "Planlandı", suruyor: "Sürüyor", tamamlandi: "Tamamlandı",
};

export interface Olay {
  id: string;
  baslik: string;
  etki: Exclude<DurumKodu, "calisiyor" | "demo">;
  /** Etkilenen bileşen kimlikleri. */
  bilesenler: string[];
  /** ISO tarih (gün). Saat bilinmiyorsa yalnız gün tutulur; uydurma saat yazılmaz. */
  baslangic: string;
  bitis: string;
  guncellemeler: { evre: OlayEvre; zaman: string; metin: string }[];
  /** Kaydın kaynağı (dürüstlük için sayfada gösterilir). */
  kaynak: { ad: string; href: string };
  bakim?: boolean;
}

/** Sürüm notlarında belgelenmiş, çözülmüş gerçek hatalar. En yeni başta. */
export const OLAYLAR: Olay[] = [
  {
    id: "menu-kirpma-2026-10", baslik: "Tablolarda ve kaydırılan panellerde açılır menüler kırpılıyordu", etki: "yavas",
    bilesenler: ["web", "kitaplik"], baslangic: "2026-10-21", bitis: "2026-10-21",
    guncellemeler: [{ evre: "cozuldu", zaman: "2026-10-21", metin: "Tablo ve kaydırılan panellerdeki açılır menülerin (ör. API anahtarları \"…\" menüsü) panel kenarında kırpılması tüm uygulamada giderildi. Menüler artık sayfanın üst katmanında açılıyor ve ekran dışına taşınca yön değiştiriyor." }],
    kaynak: { ad: "Sürüm 3.8.0", href: "/panel/surum#v3-8-0" },
  },
  {
    id: "otomatik-yukleme-2026-10", baslik: "Otomatik kredi yükleme tetiklenmiyordu", etki: "kismi",
    bilesenler: ["odeme"], baslangic: "2026-10-08", bitis: "2026-10-08",
    guncellemeler: [{ evre: "cozuldu", zaman: "2026-10-08", metin: "Ayarlar › Abonelik'te açılan otomatik yükleme, bakiye eşiğin altına indiğinde paket yüklemiyordu. Düzeltmeyle seçili paket eşik altına inildiğinde yükleniyor ve makbuzu Faturalar'a düşüyor." }],
    kaynak: { ad: "Sürüm 3.6.0", href: "/panel/surum#v3-6-0" },
  },
  {
    id: "masaustu-araclar-2026-09", baslik: "11 araç masaüstünde boş görünüyordu", etki: "kismi",
    bilesenler: ["gorsel", "video", "ses"], baslangic: "2026-09-25", bitis: "2026-09-25",
    guncellemeler: [{ evre: "cozuldu", zaman: "2026-09-25", metin: "Yalnız mobil için tasarlanmış 11 araç (Yükselt, Inpaint, Konuştur ve diğerleri) masaüstünde boş sayfa gösteriyordu. Bu araçlar için solda ayar paneli, sağda geçmiş bulunan masaüstü düzeni yayınlandı." }],
    kaynak: { ad: "Sürüm 3.5.2", href: "/panel/surum#v3-5-2" },
  },
  {
    id: "gezinme-cakisma-2026-07", baslik: "Gezinme panelleri üst üste biniyordu", etki: "yavas",
    bilesenler: ["web"], baslangic: "2026-07-24", bitis: "2026-07-24",
    guncellemeler: [{ evre: "cozuldu", zaman: "2026-07-24", metin: "Bazı ekran genişliklerinde açılır gezinme panelleri birbirinin üstüne açılıyordu. Paneller artık tek seferde bir tane açılıyor." }],
    kaynak: { ad: "Sürüm 3.4.0", href: "/panel/surum#v3-4-0" },
  },
  {
    id: "sonsuz-cizim-2026-07", baslik: "Bazı stüdyolarda sonsuz yeniden çizim", etki: "kismi",
    bilesenler: ["video", "ses"], baslangic: "2026-07-14", bitis: "2026-07-14",
    guncellemeler: [{ evre: "cozuldu", zaman: "2026-07-14", metin: "Bazı stüdyolar açıldığında arayüz sürekli yeniden çiziliyor ve yanıt vermez hale geliyordu. Durum güncellemelerindeki döngü giderildi." }],
    kaynak: { ad: "Sürüm 3.3.0", href: "/panel/surum#v3-3-0" },
  },
];

/** Planlı bakımlar — şu an planlanmış bakım yok. */
export const BAKIMLAR: Olay[] = [];

export const gunAnahtari = (t: number | Date) => {
  const d = typeof t === "number" ? new Date(t) : t;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
export const gunMetni = (gun: string, yil = true) => {
  const [y, a, g] = gun.split("-").map(Number);
  return `${g} ${AYLAR[a - 1]}${yil ? ` ${y}` : ""}`;
};
export const olayAraligi = (o: Olay) => (o.baslangic === o.bitis ? gunMetni(o.baslangic) : `${gunMetni(o.baslangic, false)} – ${gunMetni(o.bitis)}`);

/** Bir günde o bileşeni etkileyen olaylar. */
export function gunOlaylari(gun: string, bilesenId?: string) {
  return OLAYLAR.filter((o) => o.baslangic <= gun && o.bitis >= gun && (!bilesenId || o.bilesenler.includes(bilesenId)));
}

export const enKotu = (l: DurumKodu[]): DurumKodu => l.reduce<DurumKodu>((a, b) => (DURUM[b].agirlik > DURUM[a].agirlik ? b : a), "calisiyor");

/* ── API yanıt tipleri ── */
export interface GunKaydi { gun: string; olcum: number; basarisiz: number; yavas: number }
export interface BilesenDurumu {
  id: string;
  durum: DurumKodu;
  /** Son ölçüm süresi (ms). */
  ms?: number;
  not?: string;
  gunler: GunKaydi[];
}
export interface DurumYaniti {
  zaman: number;
  /** Sunucunun ilk ölçüm anı (ölçüm geçmişi buradan başlar). */
  olcumBaslangic: number;
  bilesenler: BilesenDurumu[];
}

/** Ölçüm kayıtlarından günün durumu (ölçüm yoksa null). */
export function gunDurumu(k: GunKaydi | undefined): DurumKodu | null {
  if (!k || !k.olcum) return null;
  const oran = k.basarisiz / k.olcum;
  if (oran >= 0.5) return "kesinti";
  if (oran > 0) return "kismi";
  if (k.yavas / k.olcum >= 0.5) return "yavas";
  return "calisiyor";
}
