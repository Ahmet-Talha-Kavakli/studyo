/**
 * Çalışma alanlarının istemci ile sunucu arasında paylaşılan tipleri. Sunucu modülü içe aktarmaz.
 *
 * Bir çalışma alanı (ekip alanı): adı, logosu, planı ve ortak kredi havuzu olan; üyeleri rolleriyle birlikte çalışan alan.
 * Kişisel alan ayrı bir kayıt değildir: etkin alan seçilmemişse hesap kendi kişisel bakiyesiyle çalışır.
 */
import type { PlanKimligi } from "@/lib/hesap/tipler";

export type AlanRol = "sahip" | "yonetici" | "uye" | "izleyici";
export const ALAN_ROLLERI: AlanRol[] = ["sahip", "yonetici", "uye", "izleyici"];
export const ROL_SIRA: Record<AlanRol, number> = { sahip: 3, yonetici: 2, uye: 1, izleyici: 0 };
export const ROL_AD: Record<AlanRol, string> = { sahip: "Sahip", yonetici: "Yönetici", uye: "Üye", izleyici: "İzleyici" };
export const ROL_ACIKLAMA: Record<AlanRol, string> = {
  sahip: "Her şey: faturalama, alanı silme, sahipliği devretme",
  yonetici: "Üyeleri, rolleri, kredi sınırlarını ve planı yönetir",
  uye: "Ortak krediyle üretir, Build projeleri açar ve düzenler",
  izleyici: "Projeleri ve kitaplığı görür; kredi harcayamaz",
};
/** Bir alanın kişisel olmayan kimliği: a_ + 16 karakter. */
export const ALAN_DESENI = /^a_[A-Za-z0-9_-]{16}$/;
/** Etkin alanı taşıyan çerez ve başlık. "kisisel" kişisel alanı seçer. */
export const ALAN_CEREZI = "vayra_alan";
export const ALAN_BASLIGI = "x-vayra-alan";

/** Alan planına göre en çok üye (sahip dahil). null: sınırsız. */
export const ALAN_UYE_SINIRI: Record<PlanKimligi, number | null> = { baslangic: 5, arti: 20, ultra: 100, kurumsal: null };
export const DAVET_GUN = 7;

/** Logo yoksa adın baş harfinin üstünde durduğu renk paleti (alan kimliğinden seçilir). */
export const ALAN_RENKLERI = ["#55d6fd", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#f08a4b", "#60a5fa", "#e879f9"];

export type AlanUrun = "studyo" | "build" | "api" | "diger";
export const URUN_AD: Record<AlanUrun, string> = { studyo: "Stüdyolar", build: "Vayra Build", api: "API", diger: "Diğer" };

/** Alan seçicide ve listelerde görünen özet. */
export interface AlanOzet {
  id: string;
  ad: string;
  logo?: string;
  renk: string;
  rol: AlanRol;
  plan: PlanKimligi;
  uyeSayisi: number;
}

/** Alan adıyla katılım: doğrulanmış e-posta alan adındaki hesaplar davetsiz katılabilir. */
export interface AlanAdiBilgisi {
  alan: string;
  /** Doğrulama yöntemi: yöneticinin doğrulanmış e-postası ya da DNS TXT kaydı. */
  yontem?: "eposta" | "dns";
  dogrulandi?: number;
  /** DNS ile doğrulama için yazılacak TXT değeri (yalnız yöneticilere döner). */
  txt?: string;
  acik: boolean;
  rol: "uye" | "izleyici";
}

export interface AlanUyeBilgisi {
  uid: string;
  ad: string;
  email: string;
  avatar?: string;
  rol: AlanRol;
  katilma: number;
  /** Üyeye özel aylık sınır (null: alan varsayılanı geçerli). */
  sinir: number | null;
  /** Geçerli sınır: üyeninki ya da alan varsayılanı; null sınırsız. */
  etkinSinir: number | null;
  buAy: number;
  toplam: number;
  sonHarcama?: number;
  ben: boolean;
  /** Alan adıyla mı katıldı. */
  kaynak?: "davet" | "alanadi" | "kurucu" | "devir";
}

export interface AlanDavetBilgisi {
  id: string;
  eposta: string;
  rol: Exclude<AlanRol, "sahip">;
  olusturma: number;
  bitis: number;
  davetEden: string;
  gonderildi: boolean;
}

export interface AlanKrediBilgisi {
  bakiye: number;
  planKredi: number;
  ekKalan: number;
  kota: number;
  donemBaslangic: number;
  donemBitis: number;
  donemToplam: number;
  /** Bu üyenin bu ay harcayabileceği (sınır ve bakiye birlikte). */
  kullanilabilir: number;
  buAy: number;
  etkinSinir: number | null;
}

export interface AlanAyrinti {
  id: string;
  ad: string;
  logo?: string;
  renk: string;
  olusturma: number;
  rol: AlanRol;
  plan: PlanKimligi;
  planBitis?: number;
  uyeSiniri: number | null;
  uyeler: AlanUyeBilgisi[];
  /** Yalnız sahip ve yöneticiye. */
  davetler: AlanDavetBilgisi[];
  alanAdi: AlanAdiBilgisi | null;
  varsayilanSinir: number | null;
  ayar: { uyeDavet: boolean; yeniProjeAlana: boolean };
  kredi: AlanKrediBilgisi;
  projeSayisi: number;
  kitaplikSayisi: number;
}

export type AlanGunlukTuru =
  | "olustur" | "ayar" | "davet" | "davet-iptal" | "katil" | "rol" | "sinir" | "cikar" | "ayril" | "devret"
  | "kredi" | "plan" | "satin" | "alanadi" | "proje" | "kitaplik" | "sil";

export const GUNLUK_AD: Record<AlanGunlukTuru, string> = {
  olustur: "Alan oluşturuldu", ayar: "Ayar değişti", davet: "Davet", "davet-iptal": "Davet geri alındı", katil: "Katılım", rol: "Rol değişti",
  sinir: "Kredi sınırı", cikar: "Üye çıkarıldı", ayril: "Üye ayrıldı", devret: "Sahiplik devri", kredi: "Kredi aktarımı", plan: "Plan",
  satin: "Satın alma", alanadi: "Alan adı", proje: "Build projesi", kitaplik: "Kitaplık", sil: "Silme",
};

export interface AlanGunlukKaydi { id: string; zaman: number; tur: AlanGunlukTuru; uid: string; ad: string; ayrinti: string; ip?: string }

export interface AlanKullanimSatiri {
  zaman: number;
  uid: string;
  ad: string;
  miktar: number;
  urun: AlanUrun;
  kaynak: string;
  aciklama: string;
  iade?: boolean;
}

export interface AlanKitaplikOgesi {
  id: string;
  zaman: number;
  uid: string;
  ad: string;
  tur: "gorsel" | "video" | "ses" | "3d" | "muzik";
  model: string;
  istem: string;
  url: string;
  kapak?: string;
  kredi?: number;
}

export interface AlanProjeBilgisi {
  id: string;
  ad: string;
  tur: string;
  kapak?: string;
  guncelleme: number;
  sahipAd: string;
  ekleyen: string;
  eklenme: number;
  yayinda: boolean;
  benim: boolean;
}

/** Alan bağlamındaki kredi hatası kodları (402 sınır, 403 izleyici/üyelik). */
export type AlanKrediHata = "yetersiz" | "sinir" | "izleyici" | "uye-degil";

export const rolAtayabilir = (ben: AlanRol, hedef: AlanRol) => ben === "sahip" ? hedef !== "sahip" : ben === "yonetici" ? hedef === "uye" || hedef === "izleyici" : false;
/** Rolü değiştirilebilen ya da çıkarılabilen üye: sahip herkesi (kendisi hariç), yönetici yalnız üye ve izleyiciyi. */
export const uyeYonetebilir = (ben: AlanRol, hedef: AlanRol) => ben === "sahip" ? hedef !== "sahip" : ben === "yonetici" ? ROL_SIRA[hedef] < ROL_SIRA.yonetici : false;
export const alanRengi = (id: string) => ALAN_RENKLERI[[...id].reduce((t, c) => t + c.charCodeAt(0), 0) % ALAN_RENKLERI.length];
