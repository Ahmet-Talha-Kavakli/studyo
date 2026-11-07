/**
 * Vayra Build Büyüme: dış kanal bağlantılarının ortak tipleri ve saf yardımcıları (istemci + sunucu).
 *  - Sosyal hesaplar (Meta, LinkedIn, X, TikTok): OAuth ile bağlanan hesap ve hedefleri; belirteçler ayrı kasada (buyumeSosyal.ts).
 *  - Google İşletme Profili gönderileri (buyumeGbp.ts).
 *  - İYS (İleti Yönetim Sistemi) izin aktarımı (buyumeIys.ts).
 */
import type { IzinDurum, Kisi } from "./buyumeEkTipler";

/* ── Sosyal hesaplar ── */
export type SosyalAg = "meta" | "linkedin" | "x" | "tiktok";
export type HedefTur = "facebook" | "instagram" | "kisi" | "kurum" | "x" | "tiktok";
export type SosyalHedef = { id: string; ad: string; tur: HedefTur; resim?: string };
export type SosyalHesap = {
  ag: SosyalAg; kimlik: string; ad: string; kullanici?: string; resim?: string;
  hedefler: SosyalHedef[]; bagli: number; sureBitis?: number; sonHata?: string; kapsam?: string[];
  /** Otomatik paylaşımda kullanılacak hedefler. */ secili?: string[];
};
/** İçerik kanalından paylaşılacak hedef türüne. */
export const KANAL_HEDEF: Record<string, HedefTur[]> = { instagram: ["instagram"], hikaye: ["instagram"], tiktok: ["tiktok"], linkedin: ["kurum", "kisi"], x: ["x"] };
export type YayinKaydi = { gonderi: string; ag: SosyalAg; hedef: string; durum: "suruyor" | "yayinda" | "hata"; adres?: string; hata?: string; z: number; deneme: number };

/* ── Google İşletme Profili ── */
export type GbpTur = "STANDARD" | "OFFER" | "EVENT";
export const GBP_TURLERI: { id: GbpTur; ad: string; alt: string }[] = [
  { id: "STANDARD", ad: "Güncelleme", alt: "Haber, yeni ürün, duyuru" },
  { id: "OFFER", ad: "Teklif", alt: "İndirim kodu ve kampanya, başlangıç ve bitişle" },
  { id: "EVENT", ad: "Etkinlik", alt: "Tarihli etkinlik, atölye, açılış" },
];
export type GbpCta = "" | "LEARN_MORE" | "BOOK" | "ORDER" | "SHOP" | "SIGN_UP" | "CALL";
export const GBP_CTALAR: { id: GbpCta; ad: string }[] = [
  { id: "", ad: "Düğme yok" }, { id: "LEARN_MORE", ad: "Daha fazla bilgi" }, { id: "BOOK", ad: "Rezervasyon yap" }, { id: "ORDER", ad: "Sipariş ver" },
  { id: "SHOP", ad: "Alışveriş yap" }, { id: "SIGN_UP", ad: "Kaydol" }, { id: "CALL", ad: "Hemen ara" },
];
export type GbpGonderi = {
  id: string; tur: GbpTur; metin: string; cta: GbpCta; adres?: string; gorsel?: string;
  etkinlik?: { baslik: string; bas: string; bit: string }; teklif?: { kod: string; kosullar: string };
  durum: "taslak" | "zamanlandi" | "yayinda" | "hata"; zaman?: number;
  yayin?: { ad: string; adres?: string; z: number }; hata?: string; olusturma: number; guncelleme: number; model?: string; kaynak?: string;
};
export type GbpVeri = { gonderiler: GbpGonderi[]; konum?: { hesap: string; konum: string; ad: string; adres?: string } };
export const GBP_SINIR = 1500;

/* ── İYS ── */
export type IysAktarim = { z: number; adet: number; durum: "dosya" | "gonderildi" | "hata"; istek?: string; hata?: string; yanit?: string };
export type IysAyar = { aktarimlar: IysAktarim[]; kaynakVarsayilan?: IysKaynak; tacirEtiket?: string; sonGonderilen?: Record<string, number> };
export type IysKaynak = "HS_WEB" | "HS_FIZIKSEL_ORTAM" | "HS_ISLAK_IMZA" | "HS_CAGRI_MERKEZI" | "HS_SOSYAL_MEDYA" | "HS_EPOSTA" | "HS_MESAJ" | "HS_MOBIL" | "HS_EORTAM" | "HS_ETKINLIK";
export const IYS_KAYNAKLARI: { id: IysKaynak; ad: string }[] = [
  { id: "HS_WEB", ad: "İnternet sitesi" }, { id: "HS_EORTAM", ad: "Diğer elektronik ortam" }, { id: "HS_FIZIKSEL_ORTAM", ad: "Fiziksel ortam (mağaza, form)" },
  { id: "HS_ISLAK_IMZA", ad: "Islak imzalı belge" }, { id: "HS_CAGRI_MERKEZI", ad: "Çağrı merkezi" }, { id: "HS_SOSYAL_MEDYA", ad: "Sosyal medya" },
  { id: "HS_EPOSTA", ad: "E-posta" }, { id: "HS_MESAJ", ad: "Kısa mesaj" }, { id: "HS_MOBIL", ad: "Mobil uygulama" }, { id: "HS_ETKINLIK", ad: "Etkinlik" },
];
export type IysSatir = { recipient: string; type: "EPOSTA"; source: IysKaynak; status: "ONAY" | "RET"; consentDate: string; recipientType: "BIREYSEL" | "TACIR" };
const trZaman = (z: number) => new Date(z + 3 * 3600_000).toISOString().slice(0, 19).replace("T", " ");
/** İzin kaynağı metninden İYS kaynak kodu (web formları, bio sayfası ve açılır pencere HS_WEB; e-postadaki çıkma HS_EPOSTA). */
export function iysKaynagi(kaynak: string | undefined, varsayilan: IysKaynak = "HS_WEB"): IysKaynak {
  const s = (kaynak ?? "").toLocaleLowerCase("tr-TR");
  if (/e-?posta|abonelikten çık|tek tık|bağlantı/.test(s)) return "HS_EPOSTA";
  if (/form|site|bio|açılır|popup|bülten|üye|sipariş|ödeme/.test(s)) return "HS_WEB";
  if (/mağaza|fuar|kağıt|fiziksel/.test(s)) return "HS_FIZIKSEL_ORTAM";
  if (/imza/.test(s)) return "HS_ISLAK_IMZA";
  if (/telefon|çağrı/.test(s)) return "HS_CAGRI_MERKEZI";
  if (/instagram|sosyal|whatsapp/.test(s)) return "HS_SOSYAL_MEDYA";
  return varsayilan;
}
/**
 * İYS'ye aktarılacak e-posta izinleri: onaylılar ONAY, reddedenler ve çıkanlar RET. İzni belirsizler aktarılmaz (İYS'de
 * kayıt yoksa ileti gönderilemez kuralı geçerlidir). Onay zamanı yoksa kişi listeye alınmaz ve eksik sayılır.
 */
export function iysSatirlari(kisiler: Kisi[], ayar: Pick<IysAyar, "kaynakVarsayilan" | "tacirEtiket">): { satirlar: IysSatir[]; eksik: Kisi[]; belirsiz: number } {
  const satirlar: IysSatir[] = [], eksik: Kisi[] = [];
  let belirsiz = 0;
  for (const k of kisiler) {
    if (!k.eposta) continue;
    const durum: IzinDurum = k.cikti ? "ret" : k.izin;
    if (durum === "bilinmiyor") { belirsiz++; continue; }
    const z = k.cikti ?? k.izinZaman;
    if (!z) { eksik.push(k); continue; }
    satirlar.push({ recipient: k.eposta, type: "EPOSTA", source: iysKaynagi(k.cikti ? "abonelikten çıktı" : k.izinKaynak, ayar.kaynakVarsayilan), status: durum === "onay" ? "ONAY" : "RET", consentDate: trZaman(z), recipientType: ayar.tacirEtiket && k.etiketler.includes(ayar.tacirEtiket) ? "TACIR" : "BIREYSEL" });
  }
  return { satirlar, eksik, belirsiz };
}
/** İYS toplu yükleme için CSV (alan adları İYS API'siyle aynı; noktalı virgül, UTF-8 BOM). */
export function iysCsv(l: IysSatir[]): string {
  const h = (s: string) => `"${s.replace(/"/g, '""')}"`;
  return "﻿" + [["recipient", "type", "source", "status", "consentDate", "recipientType"], ...l.map((x) => [x.recipient, x.type, x.source, x.status, x.consentDate, x.recipientType])].map((r) => r.map(h).join(";")).join("\r\n") + "\r\n";
}
