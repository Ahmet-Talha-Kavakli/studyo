/**
 * Vayra hesap sisteminin istemci ile sunucu arasında paylaşılan tipleri.
 * Bu dosya hiçbir sunucu modülü içe aktarmaz; tarayıcı paketine güvenle girer.
 */

export type PlanKimligi = "baslangic" | "arti" | "ultra" | "kurumsal";
export type Rol = "kullanici" | "admin";
export type SaglayiciKimligi = "google" | "apple" | "microsoft";
export const SAGLAYICILAR: SaglayiciKimligi[] = ["google", "apple", "microsoft"];
export const SAGLAYICI_AD: Record<SaglayiciKimligi, string> = { google: "Google", apple: "Apple", microsoft: "Microsoft" };

/** Sunucuda saklanan profil alanları (useAuth.Kullanici ile aynı adlar). */
export interface ProfilVerisi {
  ad: string;
  avatar?: string;
  slogan?: string;
  bio?: string;
  konum?: string;
  sosyal?: { x?: string; instagram?: string; youtube?: string; tiktok?: string };
  kapak?: string;
  kullaniciAdi?: string;
  website?: string;
  davetEden?: string;
  davetIndirimi?: "bekliyor" | "kullanildi";
}

/** İstemcinin useAuth.kullanici alanına yazılan biçim. */
export interface KullaniciVerisi extends ProfilVerisi {
  email: string;
  plan: PlanKimligi;
  krediler: number;
  ekKredi?: number;
}

export type CihazTuru = "masaustu" | "mobil" | "tablet";

export interface OturumBilgisi {
  id: string;
  tarayici: string;
  isletim: string;
  tur: CihazTuru;
  baslangic: number;
  sonGorulme: number;
  yontem: string;
  /** Kısaltılmış IP (son bölüm gizli). */
  ip?: string;
  bu: boolean;
}

export type GuvenlikOlayTuru =
  | "giris" | "giris-hatali" | "cikis" | "kayit" | "sifre" | "2fa-ac" | "2fa-kapat" | "yedek-kod" | "yedek-yenile"
  | "eposta" | "oturum-kapat" | "veri-indir" | "eposta-dogrula" | "sifirla" | "saglayici-bagla" | "saglayici-kaldir" | "kilit";

export interface GuvenlikOlayiBilgisi { id: string; zaman: number; tur: GuvenlikOlayTuru; cihaz: string; ayrinti?: string }

export interface HesapOzeti {
  uid: string;
  rol: Rol;
  email: string;
  epostaDogrulandi: boolean;
  /** Doğrulanmayı bekleyen yeni e-posta adresi (değişiklik istendiyse). */
  bekleyenEposta?: string;
  sifreVar: boolean;
  sifreGuncelleme: number | null;
  ikiAdim: { aktif: boolean; acilis: number | null; yedekToplam: number; yedekKalan: number; yedekDurum: boolean[] };
  saglayicilar: SaglayiciKimligi[];
  olusturma: number;
  oturumId: string;
  oturumlar: OturumBilgisi[];
  /** Yeni cihazdan girişte e-posta bildirimi (sunucu gönderir; e-posta servisi kurulu olmalı). */
  yeniGirisEposta: boolean;
}

/** Sunucunun yeteneği: arayüz eksik servisleri açıkça söylesin diye. */
export interface SunucuDurumu {
  gelistirme: boolean;
  epostaServisi: boolean;
  /** Ödeme altyapısı yokken deneme kredisi ve plan değişikliği kabul ediliyor mu. */
  odemeDeneme: boolean;
  saglayicilar: Record<SaglayiciKimligi, boolean>;
}

export interface KrediOzeti {
  bakiye: number;
  plan: PlanKimligi;
  kota: number;
  planKredi: number;
  ekKalan: number;
  donemBaslangic: number;
  donemBitis: number;
  /** Dönemde erişilebilen toplam (halka paydası). */
  donemToplam: number;
  sira: number;
}

export type KrediHareketTuru = "acilis" | "kota" | "harcama" | "iade" | "ekleme" | "plan" | "duzeltme" | "sona-erdi";

export interface KrediHareketi {
  sira: number;
  id: string;
  zaman: number;
  tur: KrediHareketTuru;
  /** Bakiyeye etkisi: eklemede artı, harcamada eksi. */
  miktar: number;
  bakiye: number;
  kaynak: string;
  aciklama: string;
}

export interface BenYaniti {
  ok: true;
  kullanici: KullaniciVerisi;
  hesap: HesapOzeti;
  sunucu: SunucuDurumu;
  /** Etkin çalışma alanı (yoksa ya da kişisel alandaysa null). kullanici.krediler bu durumda alandaki kullanılabilir kredidir. */
  alan?: (import("@/lib/alan/tipler").AlanOzet & { kredi: import("@/lib/alan/tipler").AlanKrediBilgisi }) | null;
}

/** Geliştirme ortamında e-posta servisi yoksa bağlantı yanıtta döner (arayüz "geliştirme" diye belirtir). */
export interface EpostaSonucu {
  gonderildi: boolean;
  gelistirmeBaglantisi?: string;
  hata?: string;
}

export const SIFRE_KURALLARI = [
  { id: "uzunluk", ad: "En az 8 karakter", test: (s: string) => s.length >= 8 },
  { id: "harf", ad: "Büyük ve küçük harf", test: (s: string) => /[a-zçğıöşü]/.test(s) && /[A-ZÇĞİÖŞÜ]/.test(s) },
  { id: "rakam", ad: "Bir rakam", test: (s: string) => /\d/.test(s) },
] as const;

/** Yaygın şifre başlangıçları: hem güç ölçer hem sunucu politikası kullanır. */
export const YAYGIN_SIFRE = /^(123456|12345678|password|parola|sifre|şifre|qwerty|111111|abc123|vayra|iloveyou|admin|welcome|letmein)/i;
