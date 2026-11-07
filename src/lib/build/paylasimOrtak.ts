import type { ProjeTur } from "./tipler";
import type { GuvenlikBulgusu } from "./toplulukDenetim";

/**
 * Proje paylaşım bağlantısı (istemci + sunucu ortak tipler).
 * Herkese açık sayfa: /p/b/<id> (/p/<id> Vayra ses ve müzik paylaşımlarınındır, Build sohbetleri /s/b/<id>).
 * Yalnız dosyalar paylaşılır: sırlar, ortam değişkenleri, form gelen kutusu, veritabanı kayıtları, üyeler ve günlükler asla.
 */

/** Herkese açık sayfanın gördüğü bilgi (proje kimliği, sahip özeti ve dosyalar yok). */
export type PaylasimGorunumu = {
  id: string;
  ad: string;
  aciklama: string;
  yazar: string;
  tur: ProjeTur;
  kapak: string | null;
  surumNo: number;
  surumZaman: number;
  /** Sahip belirli bir sürümü sabitlediyse true; değilse her zaman son sürüm. */
  sabit: boolean;
  dosyaSayisi: number;
  sayfaSayisi: number;
  remix: boolean;
  kod: boolean;
  goruntulenme: number;
  remixSayisi: number;
  olusturma: number;
  /** Projede veritabanı, üyelik ya da sunucu fonksiyonu kullanan kod var (paylaşım önizlemesinde çalışmaz). */
  sunucuGerekli: boolean;
};

/** Sahibe dönen paylaşım ayarları. */
export type PaylasimAyari = {
  id: string;
  projeId: string;
  aciklama: string;
  yazar: string;
  remix: boolean;
  kod: boolean;
  /** "son" ya da sabitlenen sürüm. */
  surum: "son" | { id: string; no: number; zaman: number };
  olusturma: number;
  guncelleme: number;
  goruntulenme: number;
  remixSayisi: number;
  /** Paylaşılan sürümde gizli bilgi bulunduysa sayfa kapanır; sahip burada nedenini görür. */
  engel: GuvenlikBulgusu[];
};

export type PaylasimSurumOzeti = { id: string; no: number; aciklama: string; zaman: number };

export const PAYLASIM_KIMLIGI = /^[A-Za-z0-9_-]{16}$/;
export const paylasimYolu = (id: string) => `/p/b/${id}`;
export const yazarAdi = (y?: string | null) => y?.trim() || "Anonim";

/** Kodda Vayra Veri, üyelik, dosya, yapay zekâ ya da sunucu fonksiyonu kullanılıyor mu? */
export function sunucuGerekli(dosyalar: Record<string, string>): boolean {
  return Object.entries(dosyalar).some(([y, d]) => /^api\/[^/]+\.js$/.test(y) || (/\.(m?js|html?)$/.test(y) && /\bvayra\.(veri|uye|dosya|ai|fonksiyon)\b/.test(d)));
}
