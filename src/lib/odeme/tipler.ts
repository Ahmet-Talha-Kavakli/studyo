/**
 * Vayra ödeme sisteminin istemci ile sunucu arasında paylaşılan tipleri. Sunucu modülü içe aktarmaz.
 */
import type { PlanKimligi } from "@/lib/hesap/tipler";

export type OdemeTur = "plan" | "kredi" | "sinirsiz" | "hiz";
export type Para = "TRY" | "USD";
export type Donem = "aylik" | "yillik";
export type SaglayiciKimligi = "iyzico" | "stripe" | "deneme";
export type OdemeModu = "test" | "canli";
export type SiparisDurum = "bekliyor" | "odendi" | "basarisiz" | "iade";
/** Plan siparişinin amacı: yeni abonelik, kalan süre farkıyla yükseltme ya da dönem yenileme. */
export type PlanAmaci = "yeni" | "yukseltme" | "yenileme";

export const SAGLAYICI_AD: Record<SaglayiciKimligi, string> = { iyzico: "iyzico", stripe: "Stripe", deneme: "Deneme ödemesi" };
export const PARA_AD: Record<Para, string> = { TRY: "Türk lirası", USD: "ABD doları" };

export interface OdemeIstegi {
  tur: OdemeTur;
  /** plan: baslangic | arti | ultra | ultra-6000 | ultra-9000. kredi: kredi miktarı. sinirsiz: model|kalite|gün. hiz: seviye:ek */
  urun: string;
  donem?: Donem;
  para?: Para;
  /** Çalışma alanı için satın alma (plan ya da kredi): hak alana işlenir, makbuz satın alanındır. */
  alan?: string;
}

/** Sunucunun katalogdan hesapladığı satır. Tutarlar kuruş (ya da sent). */
export interface FiyatSatiri { ad: string; tutar: number }

export interface OnizlemeYaniti {
  ok: true;
  ad: string;
  aciklama: string;
  para: Para;
  /** KDV hariç liste tutarı. */
  liste: number;
  indirimler: FiyatSatiri[];
  net: number;
  kdv: number;
  kdvOrani: number;
  toplam: number;
  /** Planda: yeni plan hemen mi başlar, dönem sonunda mı. */
  zamanlama: "hemen" | "donem-sonu";
  amac?: PlanAmaci;
  /** Plan siparişinde yenilenme biçimi. */
  yenileme?: "otomatik" | "hatirlatma" | "yok";
  saglayici: SaglayiciKimligi | null;
  mod: OdemeModu | null;
  /** Bu para birimiyle ödeme alabilen sağlayıcılar. */
  paralar: Para[];
  taksit: boolean;
  faturaEksik: boolean;
  notlar: string[];
  /** Ödeme gerektirmeyen değişiklik (dönem sonunda düşürme gibi). */
  odemesiz?: boolean;
}

export interface FaturaBilgisi {
  tip: "bireysel" | "kurumsal";
  adSoyad: string;
  tckn: string;
  unvan: string;
  vkn: string;
  vergiDairesi: string;
  adres: string;
  il: string;
  ilce: string;
  postaKodu: string;
  eposta: string;
  telefon?: string;
  ulke?: string;
}

export interface SiparisOzeti {
  no: string;
  tur: OdemeTur;
  ad: string;
  aciklama: string;
  durum: SiparisDurum;
  para: Para;
  liste: number;
  indirimler: FiyatSatiri[];
  net: number;
  kdv: number;
  toplam: number;
  /** Taksitli ödemede bankanın eklediği vade farkı dahil tahsil edilen. */
  tahsil?: number;
  saglayici: SaglayiciKimligi;
  mod: OdemeModu;
  amac?: PlanAmaci;
  kredi?: number;
  plan?: PlanKimligi;
  olusturma: number;
  odemeZamani?: number;
  makbuzNo?: string;
  kart?: string;
  taksit?: number;
  hata?: string;
  iade?: { tutar: number; zaman: number };
  fatura?: FaturaBilgisi;
  /** Sonuç sayfasının yönlendireceği yer. */
  donus?: string;
}

export type AbonelikDurum = "etkin" | "odenemedi" | "iptal" | "bitti";

export interface AbonelikOzeti {
  saglayici: SaglayiciKimligi;
  mod: OdemeModu;
  plan: PlanKimligi;
  kota: number;
  donem: Donem;
  para: Para;
  durum: AbonelikDurum;
  donemBaslangic: number;
  donemBitis: number;
  /** Otomatik yenilenir mi (Stripe). iyzico dönemlik ödenir, yenilemeden önce hatırlatılır. */
  otomatik: boolean;
  iptalTarihi?: number;
  /** Dönem sonunda geçilecek plan ya da dönem. */
  sonraki?: { plan: PlanKimligi; kota: number; donem: Donem };
  /** Sonraki dönemin tahmini tutarı (KDV dahil). */
  sonrakiTutar: number;
  sonOdeme?: { no: string; toplam: number; zaman: number };
  /** iyzico: yenileme penceresi açık mı (dönem bitişine 7 gün kala). */
  yenilenebilir: boolean;
}

export interface SinirsizHak { model: string; kalite: string; bitis: number; no: string }
export interface HizHakki { seviye: "standart" | "oncelikli" | "turbo"; ekEsZamanli: number; bitis: number; no: string }

export interface HaklarYaniti { sinirsiz: SinirsizHak[]; hiz: HizHakki | null }

export interface OdemeDurumu {
  /** Gerçek bir sağlayıcı ya da deneme akışı kullanılabilir mi. */
  altyapi: boolean;
  saglayicilar: { iyzico: OdemeModu | null; stripe: OdemeModu | null };
  deneme: boolean;
  paralar: Para[];
  /** e-Arşiv ya da e-Fatura entegratörü bağlı mı. */
  efatura: boolean;
}

/** Ücretsiz kaynaklardan (kod, hediye, ödül) gelen kredi hareketi. */
export interface KrediKaydi { id: string; zaman: number; tur: "promo" | "hediye" | "odul" | "hediye-gonder" | "hediye-iade" | "deneme" | "duzeltme"; aciklama: string; kredi: number }
