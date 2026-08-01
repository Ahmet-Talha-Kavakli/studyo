/**
 * kadroVeri — "KADRONU OLUŞTUR" (Higgsfield "CREATE YOUR SOUL CAST") verisi.
 * Referans: ~/Desktop/referanslar/kadro/ (29 ekran görüntüsü)
 *
 * 8 sekme; her sekme ya görsel ızgarası, ya cetvel kaydırıcı, ya da sol
 * alt-menülü bileşik. "Özel" hücresi tıklanınca yerinde metin alanı açılır.
 */

export type KadroSekmeTip = "izgara" | "cetvel" | "altMenu";

export type CetvelTanim = {
  baslik: string;
  /** Etiket listesi — kaydırıcı bunlar arasında adım adım gezer. */
  degerler: string[];
  varsayilan: string;
};

export type KadroIzgara = {
  /** "Özel" hücresi ve metin alanı yer tutucusu (varsa). */
  ozel?: string;
  ogeler: string[];
  varsayilan: string;
};

export type KadroAltOge =
  | { id: string; ad: string; tip: "izgara"; icerik: KadroIzgara }
  | { id: string; ad: string; tip: "cetvel"; icerik: CetvelTanim };

export type KadroSekme =
  | { id: string; ad: string; tip: "izgara"; icerik: KadroIzgara }
  | { id: string; ad: string; tip: "cetvel"; icerik: CetvelTanim }
  | { id: string; ad: string; tip: "altMenu"; altlar: KadroAltOge[] };

/** Bütçe: $10M → $500M, 10'ar adım (referans birebir: token "@$20M"). */
const BUTCE = Array.from({ length: 50 }, (_, i) => `$${(i + 1) * 10}M`);
/** Dönem: 1900'ler → 2020'ler. */
const DONEM = Array.from({ length: 13 }, (_, i) => `${1900 + i * 10}'ler`);
/** Yaş: 20 → 70. */
const YAS = Array.from({ length: 51 }, (_, i) => `${20 + i} yaş`);

export const KADRO_SEKMELERI: KadroSekme[] = [
  {
    id: "tur", ad: "Tür", tip: "izgara",
    icerik: {
      varsayilan: "Aksiyon",
      ogeler: ["Aksiyon", "Macera", "Komedi", "Dram", "Gerilim", "Korku",
        "Dedektif", "Romantik", "Bilim Kurgu", "Fantastik", "Savaş", "Western",
        "Tarihi", "Sitcom"],
    },
  },
  {
    id: "butce", ad: "Milyon cinsinden bütçe", tip: "cetvel",
    icerik: { baslik: "Yapım bütçen ne kadar?", degerler: BUTCE, varsayilan: "$100M" },
  },
  {
    id: "donem", ad: "Dönem", tip: "cetvel",
    icerik: { baslik: "Filmin hangi dönemde geçiyor?", degerler: DONEM, varsayilan: "2020'ler" },
  },
  {
    id: "arketip", ad: "Arketip", tip: "izgara",
    icerik: {
      varsayilan: "Masum",
      ogeler: ["Masum", "Sıradan İnsan", "Kahraman", "Bakıcı", "Kâşif", "Asi",
        "Âşık", "Yaratıcı", "Soytarı", "Bilge", "Sihirbaz", "Hükümdar"],
    },
  },
  {
    id: "kimlik", ad: "Kimlik", tip: "altMenu",
    altlar: [
      { id: "cinsiyet", ad: "Cinsiyet", tip: "izgara", icerik: { varsayilan: "Erkek", ogeler: ["Erkek", "Kadın"] } },
      { id: "koken", ad: "Köken", tip: "izgara", icerik: { varsayilan: "Beyaz", ogeler: ["Beyaz", "Siyahi", "Asyalı", "Latin", "Yerli", "Karma"] } },
      { id: "yas", ad: "Yaş", tip: "cetvel", icerik: { baslik: "Karakterinin yaşını seç", degerler: YAS, varsayilan: "30 yaş" } },
    ],
  },
  {
    id: "fiziksel", ad: "Fiziksel Görünüm", tip: "altMenu",
    altlar: [
      { id: "yapi", ad: "Yapı", tip: "izgara", icerik: { varsayilan: "Ortalama", ogeler: ["İnce", "Ortalama", "Atletik", "Kaslı", "Tıknaz", "Balık Etli"] } },
      { id: "boy", ad: "Boy", tip: "cetvel", icerik: { baslik: "Karakterinin boyunu seç", degerler: ["Çok kısa", "Kısa", "Ortalama", "Uzun", "Çok uzun"], varsayilan: "Ortalama" } },
      { id: "goz", ad: "Göz Rengi", tip: "izgara", icerik: { ozel: "İstediğin göz rengini anlat. En fazla 300 karakter.", varsayilan: "Kahverengi", ogeler: ["Kahverengi", "Mavi", "Yeşil", "Ela", "Gri", "Amber"] } },
      { id: "sacStil", ad: "Saç Stili", tip: "izgara", icerik: { varsayilan: "Kısa", ogeler: ["Kısa", "Orta", "Uzun", "Çok uzun", "At kuyruğu", "Topuz", "Örgü", "Rasta", "Afro", "Kâkül", "Undercut", "Geriye taralı", "Dağınık", "Yandan traşlı", "Kel"] } },
      { id: "sacDoku", ad: "Saç Dokusu", tip: "izgara", icerik: { varsayilan: "Düz", ogeler: ["Düz", "Dalgalı", "Kıvırcık", "Sıkı kıvırcık"] } },
      { id: "sacRenk", ad: "Saç Rengi", tip: "izgara", icerik: { ozel: "İstediğin saç rengini anlat. En fazla 300 karakter.", varsayilan: "Siyah", ogeler: ["Siyah", "Kahverengi", "Sarışın", "Kızıl", "Gri", "Beyaz", "Kumral"] } },
      { id: "sakal", ad: "Sakal", tip: "izgara", icerik: { varsayilan: "Tıraşlı", ogeler: ["Tıraşlı", "Uzamış", "Sakal", "Kısa sakal", "Bıyık", "Uzun sakal"] } },
    ],
  },
  {
    id: "detaylar", ad: "Detaylar", tip: "izgara",
    icerik: { ozel: "Ek detayları anlat. En fazla 300 karakter.", varsayilan: "Çil", ogeler: ["Yüz yarası", "Çil", "Dövme", "Göz bandı"] },
  },
  {
    id: "kiyafet", ad: "Kıyafet", tip: "izgara",
    icerik: {
      ozel: "Ek detayları anlat. En fazla 300 karakter.", varsayilan: "Günlük",
      ogeler: ["Günlük", "Resmi", "Yüksek Moda", "Askeri", "Sportif", "İş kıyafeti", "Vintage", "Punk"],
    },
  },
];

/** Composer'da görünen kadro token'ı. */
export type KadroToken = {
  /** Görünen ad — "@" olmadan (örn. "Drama", "$20M"). */
  ad: string;
  /** Hangi alandan geldiği — değiştirme panelinde seçenekleri bulmak için. */
  alanId: string;
  /** Önizleme görseli tohumu; yoksa gri boş daire (bütçe/yaş/boy gibi). */
  tohum?: string;
};

/** Bir alanın seçenek listesini getir (değiştirme paneli için). */
export function alanSecenekleri(alanId: string): string[] {
  for (const s of KADRO_SEKMELERI) {
    if (s.tip === "altMenu") {
      const a = s.altlar.find((x) => x.id === alanId);
      if (a) return a.tip === "izgara" ? a.icerik.ogeler : a.icerik.degerler;
    } else if (s.id === alanId) {
      return s.tip === "izgara" ? s.icerik.ogeler : s.icerik.degerler;
    }
  }
  return [];
}

/** Alanın görsel önizlemesi var mı? (cetvel alanlarında yok → gri daire) */
export function alanGorselli(alanId: string): boolean {
  return !["butce", "donem", "yas", "boy"].includes(alanId);
}

/**
 * Kadro seçimlerinden composer'daki @token listesini üret (referans birebir).
 * Sıra: Tür · Bütçe · Dönem · Arketip · Yaş · Boy · Köken · Cinsiyet · (varsa diğerleri)
 */
export function kadroTokenlari(secim: Record<string, string>): KadroToken[] {
  const SIRA = ["tur", "butce", "donem", "arketip", "yas", "boy", "koken", "cinsiyet",
    "yapi", "goz", "sacStil", "sacDoku", "sacRenk", "sakal", "detaylar", "kiyafet"];
  const t: KadroToken[] = [];
  for (const id of SIRA) {
    const v = secim[id];
    if (!v) continue;
    t.push({ ad: v, alanId: id, tohum: alanGorselli(id) ? `${id}-${v}` : undefined });
  }
  return t;
}
