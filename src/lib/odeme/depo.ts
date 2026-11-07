import "server-only";
import { createHash, randomBytes } from "crypto";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { dizinListe, jsonOku, jsonYaz, kilitle, sil } from "@/lib/hesap/depo";
import type { PlanKimligi } from "@/lib/hesap/tipler";
import type {
  AbonelikDurum, Donem, FaturaBilgisi, FiyatSatiri, HizHakki, OdemeModu, OdemeTur, Para, PlanAmaci, SaglayiciKimligi, SinirsizHak, SiparisDurum,
} from "./tipler";

/**
 * Ödeme deposu (.veri/odeme/…). Yalnız sunucu okur ve yazar; her kayıt kendi kilidiyle tek sırada değişir.
 *  siparis/<no>.json        sipariş: ürün, sunucuda hesaplanan tutar, sağlayıcı kimlikleri, durum geçmişi
 *  kullanici/<uid>.json     hesabın ödeme kaydı: sipariş listesi, fatura bilgisi, abonelik, süreli haklar
 *  olay/<özet>.json         işlenmiş sağlayıcı bildirimleri (tekrar oynatma koruması), 45 gün tutulur
 *  dizin/<özet>.json        sağlayıcı kimliği (Stripe müşteri, abonelik, oturum) → uid ya da sipariş no
 *  hediye/<özet>.json       hediye kodları (kodun kendisi dosya adında görünmez)
 *  sayac.json               makbuz numarası sayacı (yıl başına)
 */
export const ODEME_KOK = path.join(DEPO_KOK, "odeme");
const D = {
  siparis: path.join(ODEME_KOK, "siparis"),
  kullanici: path.join(ODEME_KOK, "kullanici"),
  olay: path.join(ODEME_KOK, "olay"),
  dizin: path.join(ODEME_KOK, "dizin"),
  hediye: path.join(ODEME_KOK, "hediye"),
};
export const ozet = (s: string) => createHash("sha256").update(s).digest("hex");

/* ── Tipler ── */

export interface SiparisOlayi { z: number; olay: string; ayrinti?: string }

export interface Siparis {
  no: string;
  uid: string;
  tur: OdemeTur;
  urun: string;
  ad: string;
  aciklama: string;
  donem?: Donem;
  para: Para;
  liste: number;
  indirimler: FiyatSatiri[];
  net: number;
  kdvOrani: number;
  kdv: number;
  toplam: number;
  saglayici: SaglayiciKimligi;
  mod: OdemeModu;
  durum: SiparisDurum;
  amac?: PlanAmaci;
  /** Çalışma alanı için satın alındıysa alan kimliği (hak alana işlenir). */
  alan?: string;
  /** Ödenince uygulanacak hak. */
  hedef: { kredi?: number; plan?: PlanKimligi; kota?: number; model?: string; kalite?: string; gun?: number; hiz?: "standart" | "oncelikli" | "turbo"; ekEsZamanli?: number; davet?: boolean };
  olusturma: number;
  guncelleme: number;
  odemeZamani?: number;
  /** iyzico paymentId, Stripe payment_intent ya da fatura kimliği. */
  saglayiciKimligi?: string;
  /** iyzico Checkout Form belirteci; Stripe Checkout oturumu; Stripe abonelik kimliği. */
  token?: string;
  oturum?: string;
  abonelik?: string;
  tahsil?: number;
  kart?: string;
  taksit?: number;
  hata?: string;
  iade?: { tutar: number; zaman: number };
  fatura?: FaturaBilgisi;
  makbuzNo?: string;
  /** Hak uygulandı mı (tek seferlik). */
  islendi?: boolean;
  ip?: string;
  donus?: string;
  olaylar: SiparisOlayi[];
}

export interface Abonelik {
  saglayici: SaglayiciKimligi;
  mod: OdemeModu;
  plan: PlanKimligi;
  kota: number;
  donem: Donem;
  para: Para;
  durum: AbonelikDurum;
  baslangic: number;
  donemBaslangic: number;
  donemBitis: number;
  otomatik: boolean;
  iptalTarihi?: number;
  iptalNedeni?: string;
  /** Dönem sonunda geçilecek plan ya da dönem. odendi: yenileme ödemesi bu planla alındı, zaman gelince kayıt da geçer. */
  sonraki?: { plan: PlanKimligi; kota: number; donem: Donem; zaman?: number; odendi?: boolean };
  /** Son dönem ödemesi (makbuz ve gösterim için). */
  sonOdeme?: { no: string; net: number; toplam: number; zaman: number };
  /** Ödenmiş değer ve kapsadığı aralık (KDV hariç): yükseltmede kalan süre farkı buradan hesaplanır. */
  deger?: { net: number; bas: number; bit: number };
  stripe?: { abonelik: string; oge?: string; musteri: string; urun?: string };
  /** Gönderilen hatırlatmalar (dönem bitişi + tür). */
  hatirlatma?: string[];
}

export interface OdemeKaydi {
  uid: string;
  siparisler: string[];
  fatura?: FaturaBilgisi;
  stripeMusteri?: string;
  abonelik?: Abonelik;
  /** Biten ya da iptal edilen eski abonelikler (en çok 20). */
  gecmis?: Abonelik[];
  sinirsiz: SinirsizHak[];
  hiz: HizHakki | null;
  promolar: Record<string, number>;
  gorevler: Record<string, number>;
  /** Davet indirimi kullanıldı mı (ilk plan ödemesi). */
  davetKullanildi?: number;
  /** Bu hesabın oluşturduğu hediye kodları (kodun kendisi yalnız gönderene gösterilir). */
  hediyeler?: { ozet: string; kod: string; kredi: number; zaman: number; not?: string; kullanildi?: number; iptal?: number }[];
}

/* ── Sipariş ── */

const ALFA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const siparisNoUret = () => "VO" + [...randomBytes(14)].map((b) => ALFA[b % ALFA.length]).join("");
export const SIPARIS_DESENI = /^VO[A-Z0-9]{14}$/;
const siparisDosyasi = (no: string) => path.join(D.siparis, `${no}.json`);

export async function siparisOku(no: string): Promise<Siparis | null> {
  if (!SIPARIS_DESENI.test(no)) return null;
  return jsonOku<Siparis>(siparisDosyasi(no));
}

export async function siparisYaz(s: Siparis) {
  s.guncelleme = Date.now();
  s.olaylar = s.olaylar.slice(-60);
  await jsonYaz(siparisDosyasi(s.no), s);
}

/** Siparişi kilit altında değiştirir. */
export async function siparisGuncelle<T>(no: string, f: (s: Siparis) => T | Promise<T>): Promise<{ s: Siparis; sonuc: T } | null> {
  return kilitle(`siparis:${no}`, async () => {
    const s = await siparisOku(no);
    if (!s) return null;
    const sonuc = await f(s);
    await siparisYaz(s);
    return { s, sonuc };
  });
}

export async function siparisSil(no: string) { await sil(siparisDosyasi(no)); }

/* ── Kullanıcı kaydı ── */

const kullaniciDosyasi = (uid: string) => path.join(D.kullanici, `${uid}.json`);
const bosKayit = (uid: string): OdemeKaydi => ({ uid, siparisler: [], sinirsiz: [], hiz: null, promolar: {}, gorevler: {} });

export async function kayitOku(uid: string): Promise<OdemeKaydi> {
  const k = await jsonOku<OdemeKaydi>(kullaniciDosyasi(uid));
  return k ? { ...bosKayit(uid), ...k } : bosKayit(uid);
}

export async function kayitGuncelle<T>(uid: string, f: (k: OdemeKaydi) => T | Promise<T>): Promise<{ k: OdemeKaydi; sonuc: T }> {
  return kilitle(`odeme-kayit:${uid}`, async () => {
    const k = await kayitOku(uid);
    const sonuc = await f(k);
    k.siparisler = k.siparisler.slice(0, 500);
    k.gecmis = (k.gecmis ?? []).slice(0, 20);
    await jsonYaz(kullaniciDosyasi(uid), k);
    return { k, sonuc };
  });
}

/** Hesap silinince ödeme kaydı da silinir. Siparişler (mali kayıt) kimlik bilgisi atılarak saklanır. */
export async function kayitSil(uid: string) {
  const k = await kayitOku(uid);
  for (const no of k.siparisler) {
    await siparisGuncelle(no, (s) => { s.uid = "silindi"; delete s.fatura; delete s.ip; s.olaylar.push({ z: Date.now(), olay: "Hesap silindi, kişisel bilgi atıldı" }); });
  }
  await sil(kullaniciDosyasi(uid));
}

/** Etkin ya da dönem sonuna kadar süren abonelik var mı (profil üzerinden plan değişikliğini engellemek için). */
export async function aktifAbonelik(uid: string): Promise<Abonelik | null> {
  const a = (await kayitOku(uid)).abonelik;
  return a && a.durum !== "bitti" && a.donemBitis > Date.now() ? a : null;
}

/* ── Dizin: sağlayıcı kimliği → değer ── */

const dizinDosyasi = (tur: string, kimlik: string) => path.join(D.dizin, `${ozet(`${tur}:${kimlik}`)}.json`);
export async function dizinYaz(tur: string, kimlik: string, deger: string) { await jsonYaz(dizinDosyasi(tur, kimlik), { deger, zaman: Date.now() }); }
export async function dizinOku(tur: string, kimlik: string): Promise<string | null> { return (await jsonOku<{ deger: string }>(dizinDosyasi(tur, kimlik)))?.deger ?? null; }

/* ── İşlenmiş bildirimler: aynı olay ikinci kez işlenmez ── */

const OLAY_SURESI = 45 * 864e5;
const olayDosyasi = (kaynak: string, kimlik: string) => path.join(D.olay, `${ozet(`${kaynak}:${kimlik}`)}.json`);

/** Olay daha önce işlendiyse false. İşlenmediyse işaretler ve true döner. İşlem başarısız olursa olayBirak ile geri alınır. */
export async function olayAl(kaynak: string, kimlik: string): Promise<boolean> {
  return kilitle(`olay:${kaynak}:${kimlik}`, async () => {
    const d = olayDosyasi(kaynak, kimlik);
    if (await jsonOku(d)) return false;
    await jsonYaz(d, { kaynak, zaman: Date.now(), bitis: Date.now() + OLAY_SURESI });
    return true;
  });
}
export async function olayBirak(kaynak: string, kimlik: string) { await sil(olayDosyasi(kaynak, kimlik)); }

const T = globalThis as unknown as { __vayraOdemeTemizlik?: number };
/** Eski olay kayıtlarını ve 30 günden eski, hiç ödenmemiş siparişleri ara sıra temizler (günde en çok bir kez). */
export async function eskileriTemizle() {
  if ((T.__vayraOdemeTemizlik ?? 0) > Date.now() - 864e5) return;
  T.__vayraOdemeTemizlik = Date.now();
  for (const ad of await dizinListe(D.olay)) {
    const v = await jsonOku<{ bitis?: number }>(path.join(D.olay, ad));
    if (!v || (v.bitis ?? 0) < Date.now()) await sil(path.join(D.olay, ad));
  }
}

/* ── Makbuz numarası: VYR-<yıl>-<6 hane>, yıl başına sıralı ── */

export async function makbuzNoAl(): Promise<string> {
  return kilitle("odeme-sayac", async () => {
    const d = path.join(ODEME_KOK, "sayac.json");
    const yil = new Date().getFullYear();
    const s = (await jsonOku<Record<string, number>>(d)) ?? {};
    s[yil] = (s[yil] ?? 0) + 1;
    await jsonYaz(d, s);
    return `VYR-${yil}-${String(s[yil]).padStart(6, "0")}`;
  });
}

/* ── Hediye kodları ── */

export interface HediyeKaydi {
  ozet: string;
  /** Gösterim için kodun ilk ve son parçası. */
  ipucu: string;
  kredi: number;
  olusturan: string;
  olusturma: number;
  /** Oluşturanın kredisinden düşen harcamanın anahtarı (iptalde iade için). */
  harcamaAnahtari: string;
  not?: string;
  kullanan?: string;
  kullanma?: number;
  iptal?: number;
}
export const hediyeDosyasi = (kodOzeti: string) => path.join(D.hediye, `${kodOzeti}.json`);
export async function hediyeOku(kodOzeti: string) { return jsonOku<HediyeKaydi>(hediyeDosyasi(kodOzeti)); }
export async function hediyeYaz(h: HediyeKaydi) { await jsonYaz(hediyeDosyasi(h.ozet), h); }
