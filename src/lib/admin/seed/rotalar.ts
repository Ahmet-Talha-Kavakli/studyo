/**
 * Site rota + tıklanabilir hedef kataloğu — davranış analitiğinin temeli.
 * Gerçek Vayra sitesindeki sayfalar, aralarındaki geçiş olasılıkları ve
 * her sayfadaki önemli etkileşim hedefleri (buton/model/araç) burada modellenir.
 * Bu katman event motorunu (oturumlar.ts) besler: kullanıcılar bu graf üzerinde
 * deterministik olarak gezinir, dolayısıyla path akışı / exit / dwell / tıklama
 * ısı haritası hepsi TUTARLI ve gerçek verilerden hesaplanır.
 */

export type RotaTur = "acilis" | "pazarlama" | "urun" | "donusim" | "panel" | "hesap";

export interface SiteRota {
  yol: string;
  ad: string;
  tur: RotaTur;
  /** Girişte bu sayfaya düşme ağırlığı (landing olasılığı). 0 = giriş sayfası değil. */
  giris: number;
  /** Ortalama sayfada kalma (saniye) — dwell tabanı. */
  ortSaniye: number;
  /** Bu sayfadan çıkış (bounce/terk) eğilimi 0..1 — yüksek = çok terk edilir. */
  cikisEgilim: number;
  /** Buradan gidilebilecek sonraki sayfalar [yol, ağırlık]. */
  gecisler: (readonly [string, number])[];
  /** Bu sayfadaki önemli tıklama hedefleri. */
  hedefler?: string[];
}

/* Vayra site haritası — gerçek /panel/* stüdyoları + landing + dönüşüm hunisi. */
export const ROTALAR: SiteRota[] = [
  // ── Açılış / landing ──
  {
    yol: "/", ad: "Ana Sayfa", tur: "acilis", giris: 100, ortSaniye: 48, cikisEgilim: 0.34,
    gecisler: [["/panel", 30], ["/fiyatlandirma", 18], ["/urunler/sinema", 14], ["/kesfet", 12], ["/uygulamalar", 8], ["/giris", 10], ["/kurumsal/hakkinda", 3]],
    hedefler: ["Hemen Başla CTA", "Giriş Yap", "Fiyatları Gör", "Demo İzle", "Örnekler"],
  },
  {
    yol: "/fiyatlandirma", ad: "Fiyatlandırma", tur: "donusim", giris: 22, ortSaniye: 72, cikisEgilim: 0.41,
    gecisler: [["/kayit", 34], ["/giris", 12], ["/", 14], ["/urunler/sinema", 8], ["/sss", 10]],
    hedefler: ["Plus Seç", "Ultra Seç", "Kurumsal İletişim", "Aylık/Yıllık", "Ücretsiz Başla"],
  },
  {
    yol: "/kesfet", ad: "Keşfet", tur: "pazarlama", giris: 14, ortSaniye: 96, cikisEgilim: 0.29,
    gecisler: [["/panel", 26], ["/urunler/sinema", 18], ["/fiyatlandirma", 14], ["/kayit", 16], ["/uygulamalar", 10]],
    hedefler: ["Preset Kullan", "Recreate", "Beğen", "Profili Gör", "Paylaş"],
  },
  {
    yol: "/uygulamalar", ad: "Uygulamalar", tur: "pazarlama", giris: 8, ortSaniye: 64, cikisEgilim: 0.33,
    gecisler: [["/urunler/sinema", 20], ["/urunler/pazarlama", 16], ["/panel", 22], ["/fiyatlandirma", 14]],
    hedefler: ["Sinema Aç", "Pazarlama Aç", "3D Aç", "Ses Aç"],
  },

  // ── Ürün sayfaları (SEO/pazarlama) ──
  {
    yol: "/urunler/sinema", ad: "Ürün · Sinema", tur: "urun", giris: 12, ortSaniye: 88, cikisEgilim: 0.31,
    gecisler: [["/panel/sinema", 30], ["/fiyatlandirma", 20], ["/kayit", 18], ["/urunler/pazarlama", 8]],
    hedefler: ["Sinema Stüdyosunu Aç", "Örnek Videolar", "Fiyatlar", "Ücretsiz Dene"],
  },
  {
    yol: "/urunler/pazarlama", ad: "Ürün · Pazarlama", tur: "urun", giris: 9, ortSaniye: 82, cikisEgilim: 0.32,
    gecisler: [["/panel/pazarlama", 28], ["/fiyatlandirma", 20], ["/kayit", 16]],
    hedefler: ["Pazarlama Stüdyosunu Aç", "Vaka Çalışmaları", "Fiyatlar"],
  },
  {
    yol: "/urunler/3d", ad: "Ürün · 3D", tur: "urun", giris: 5, ortSaniye: 70, cikisEgilim: 0.38,
    gecisler: [["/fiyatlandirma", 22], ["/kayit", 14], ["/panel", 18]],
    hedefler: ["3D Stüdyo (Yakında)", "Fiyatlar"],
  },

  // ── Dönüşüm hunisi ──
  {
    yol: "/giris", ad: "Giriş", tur: "donusim", giris: 10, ortSaniye: 34, cikisEgilim: 0.22,
    gecisler: [["/panel", 78], ["/kayit", 12], ["/sifremi-unuttum", 6]],
    hedefler: ["Giriş Yap", "Google ile", "Kayıt Ol", "Şifremi Unuttum"],
  },
  {
    yol: "/kayit", ad: "Kayıt", tur: "donusim", giris: 8, ortSaniye: 58, cikisEgilim: 0.44,
    gecisler: [["/panel", 62], ["/onboarding", 20], ["/giris", 8]],
    hedefler: ["Hesap Oluştur", "Google ile Kayıt", "Şartları Kabul"],
  },
  {
    yol: "/onboarding", ad: "Onboarding", tur: "donusim", giris: 0, ortSaniye: 46, cikisEgilim: 0.18,
    gecisler: [["/panel", 84], ["/panel/sinema", 10]],
    hedefler: ["Amaç Seç", "İlk Üretim", "Atla"],
  },
  {
    yol: "/sifremi-unuttum", ad: "Şifre Sıfırla", tur: "hesap", giris: 1, ortSaniye: 40, cikisEgilim: 0.5,
    gecisler: [["/giris", 70]],
  },

  // ── Panel / stüdyolar (ürün içi) ──
  {
    yol: "/panel", ad: "Panel · Ana", tur: "panel", giris: 6, ortSaniye: 54, cikisEgilim: 0.16,
    gecisler: [["/panel/sinema", 26], ["/panel/pazarlama", 16], ["/panel/akis", 14], ["/panel/kitaplik", 12], ["/panel/ses", 8], ["/panel/kesfet", 8], ["/fiyatlandirma", 6]],
    hedefler: ["Sinema Aç", "Pazarlama Aç", "Kitaplık", "Yeni Üretim", "Kredi Al"],
  },
  {
    yol: "/panel/sinema", ad: "Panel · Sinema Stüdyo", tur: "panel", giris: 2, ortSaniye: 168, cikisEgilim: 0.12,
    gecisler: [["/panel/kitaplik", 24], ["/panel", 18], ["/panel/pazarlama", 10], ["/fiyatlandirma", 8]],
    hedefler: ["Model: Veo 3", "Model: Kling 2.1", "Model: Sora", "Üret", "Referans Yükle", "Kalite: 1080p", "Süre: 10sn", "Composer Büyüt"],
  },
  {
    yol: "/panel/pazarlama", ad: "Panel · Pazarlama Stüdyo", tur: "panel", giris: 1, ortSaniye: 142, cikisEgilim: 0.14,
    gecisler: [["/panel/kitaplik", 22], ["/panel", 18], ["/panel/sinema", 10]],
    hedefler: ["Model: Nano Banana", "Model: Seedream", "Üret", "Şablon Seç", "Marka Yükle"],
  },
  {
    yol: "/panel/ses", ad: "Panel · Ses Stüdyo", tur: "panel", giris: 1, ortSaniye: 118, cikisEgilim: 0.17,
    gecisler: [["/panel/kitaplik", 20], ["/panel", 20], ["/panel/sinema", 8]],
    hedefler: ["Model: ElevenLabs", "Ses Klonla", "Üret", "Dil Seç"],
  },
  {
    yol: "/panel/akis", ad: "Panel · Akış", tur: "panel", giris: 2, ortSaniye: 204, cikisEgilim: 0.2,
    gecisler: [["/panel/sinema", 18], ["/panel/kesfet", 16], ["/panel", 14], ["/panel/kitaplik", 8]],
    hedefler: ["Beğen", "Recreate", "Yorum", "Takip Et", "Paylaş", "Kaydet"],
  },
  {
    yol: "/panel/kesfet", ad: "Panel · Keşfet", tur: "panel", giris: 1, ortSaniye: 132, cikisEgilim: 0.19,
    gecisler: [["/panel/sinema", 22], ["/panel/akis", 14], ["/panel", 12]],
    hedefler: ["Preset Kullan", "Recreate", "Beğen"],
  },
  {
    yol: "/panel/kitaplik", ad: "Panel · Kitaplık", tur: "panel", giris: 1, ortSaniye: 86, cikisEgilim: 0.21,
    gecisler: [["/panel/sinema", 24], ["/panel", 20], ["/panel/pazarlama", 10]],
    hedefler: ["İndir", "Yeniden Üret", "Sil", "Paylaş", "Filtrele"],
  },
  {
    yol: "/panel/kredi", ad: "Panel · Kredi", tur: "donusim", giris: 0, ortSaniye: 64, cikisEgilim: 0.36,
    gecisler: [["/fiyatlandirma", 30], ["/panel", 40]],
    hedefler: ["Paket Al: 1000", "Paket Al: 5000", "Aboneliği Yükselt"],
  },

  // ── Hesap / kurumsal ──
  {
    yol: "/panel/ayarlar", ad: "Panel · Ayarlar", tur: "hesap", giris: 0, ortSaniye: 72, cikisEgilim: 0.28,
    gecisler: [["/panel", 60], ["/panel/kredi", 12], ["/fiyatlandirma", 8]],
    hedefler: ["Profili Kaydet", "Aboneliği Yönet", "Faturalar", "Şifre Değiştir", "Hesabı Sil"],
  },
  {
    yol: "/sss", ad: "SSS", tur: "pazarlama", giris: 3, ortSaniye: 76, cikisEgilim: 0.4,
    gecisler: [["/fiyatlandirma", 24], ["/", 14], ["/kayit", 12]],
    hedefler: ["Soru Aç", "İletişime Geç"],
  },
  {
    yol: "/kurumsal/hakkinda", ad: "Kurumsal · Hakkında", tur: "pazarlama", giris: 2, ortSaniye: 58, cikisEgilim: 0.46,
    gecisler: [["/", 22], ["/kurumsal/kariyer", 12], ["/fiyatlandirma", 8]],
  },
  {
    yol: "/kurumsal/kariyer", ad: "Kurumsal · Kariyer", tur: "pazarlama", giris: 1, ortSaniye: 88, cikisEgilim: 0.52,
    gecisler: [["/kurumsal/hakkinda", 20], ["/", 14]],
  },
];

export const ROTA_HARITA: Record<string, SiteRota> = Object.fromEntries(ROTALAR.map((r) => [r.yol, r]));

/** Giriş (landing) ağırlıkları — oturum bu sayfalardan birinde başlar. */
export const GIRIS_ROTALARI = ROTALAR.filter((r) => r.giris > 0).map((r) => [r.yol, r.giris] as const);

/** Olay türleri — event store'da tutulan etkinlik tipleri. */
export type OlayTur =
  | "sayfa" // pageview
  | "tiklama" // click (buton/hedef)
  | "uretim" // generation başlattı
  | "kayit" // signup tamamlandı
  | "odeme" // ilk/yinelenen ödeme
  | "cikis" // oturumu terk (exit)
  | "feedback"; // geri bildirim bıraktı

export const OLAY_ETIKET: Record<OlayTur, string> = {
  sayfa: "Sayfa görüntüleme",
  tiklama: "Tıklama",
  uretim: "Üretim",
  kayit: "Kayıt",
  odeme: "Ödeme",
  cikis: "Çıkış",
  feedback: "Geri bildirim",
};

/** Cihaz kırılımı için rota grupları (analitik özet). */
export const ROTA_GRUP: Record<RotaTur, string> = {
  acilis: "Açılış",
  pazarlama: "Pazarlama",
  urun: "Ürün",
  donusim: "Dönüşüm",
  panel: "Panel",
  hesap: "Hesap",
};
