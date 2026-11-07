import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { IyzicoAyar } from "./ayar";
import { OdemeHatasi } from "./hata";

/**
 * iyzico Ödeme Formu (Checkout Form) çağrıları. Kart bilgisi Vayra'ya gelmez: kullanıcı iyzico'nun sayfasında öder,
 * sonuç belirteçle (token) sunucudan sunucuya sorgulanır.
 *
 *  - İstek imzası IYZWSv2: HMAC-SHA256(randomKey + uri yolu + gövde, secretKey) hex.
 *  - Yanıt imzası (Response Signature Validation): belirtilen alanlar ":" ile birleşir, HMAC-SHA256 hex; fiyatlarda
 *    sondaki sıfırlar atılır.
 *  - Bildirim (webhook) imzası X-IYZ-SIGNATURE-V3: HMAC-SHA256(secretKey + iyziEventType + iyziPaymentId + token +
 *    paymentConversationId + status, secretKey) hex. Bildirim yalnız tetiktir: sonuç her zaman CF Retrieve ile çekilir.
 *
 * Belgeler: docs.iyzico.com (Checkout Form Initialize / Retrieve, Response Signature Validation, Webhook).
 */

const ZAMAN = 15_000;
export const iyzicoFiyat = (kurus: number) => { const s = (kurus / 100).toFixed(2); return s.replace(/0+$/, "").replace(/\.$/, ""); };
const fiyatMetni = (v: unknown) => { const s = String(v ?? ""); return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s; };
const hmacHex = (anahtar: string, veri: string) => createHmac("sha256", anahtar).update(veri).digest("hex");
const esit = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

async function istek(a: IyzicoAyar, yol: string, govde: Record<string, unknown>): Promise<Record<string, unknown>> {
  const rnd = `${Date.now()}${randomBytes(6).toString("hex")}`;
  const metin = JSON.stringify(govde);
  const imza = hmacHex(a.secretKey, rnd + yol + metin);
  const yetki = `IYZWSv2 ${Buffer.from(`apiKey:${a.apiKey}&randomKey:${rnd}&signature:${imza}`).toString("base64")}`;
  let r: Response;
  try {
    r = await fetch(a.taban + yol, { method: "POST", signal: AbortSignal.timeout(ZAMAN), headers: { Authorization: yetki, "x-iyzi-rnd": rnd, "Content-Type": "application/json", Accept: "application/json" }, body: metin, cache: "no-store" });
  } catch { throw new OdemeHatasi("iyzico'ya ulaşılamadı; biraz sonra yeniden dene.", 502); }
  const t = await r.text();
  let j: Record<string, unknown> | null = null;
  try { j = JSON.parse(t) as Record<string, unknown>; } catch { /* boş ya da HTML */ }
  if (!j) throw new OdemeHatasi(`iyzico yanıt vermedi (${r.status}).`, 502);
  return j;
}

/** Yanıt imzası. İmzasız yanıt (eski API) kabul edilir: TLS, kimlik doğrulama ve tutar denetimi yine yapılır. */
export function yanitImzasiDogru(j: Record<string, unknown>, alanlar: string[], gizli: string): boolean {
  if (typeof j.signature !== "string" || !j.signature) return true;
  const veri = alanlar.map((a) => (/price$/i.test(a) ? fiyatMetni(j[a]) : String(j[a] ?? ""))).join(":");
  return esit(hmacHex(gizli, veri), j.signature);
}

export interface IyzicoAlici {
  id: string; ad: string; soyad: string; eposta: string; kimlikNo: string; telefon?: string; adres: string; il: string; ulke: string; postaKodu?: string; ip: string; faturaAdi: string;
}

export async function formBaslat(a: IyzicoAyar, g: {
  siparisNo: string; tutar: number; para: "TRY" | "USD"; kalemAdi: string; kategori: string; donusAdresi: string; taksit: boolean; alici: IyzicoAlici;
}): Promise<{ token: string; adres: string }> {
  const fiyat = iyzicoFiyat(g.tutar);
  const adres = { contactName: g.alici.faturaAdi.slice(0, 100), city: g.alici.il.slice(0, 60), country: g.alici.ulke.slice(0, 60), address: g.alici.adres.slice(0, 250), ...(g.alici.postaKodu ? { zipCode: g.alici.postaKodu } : {}) };
  const govde = {
    locale: "tr", conversationId: g.siparisNo, price: fiyat, paidPrice: fiyat, currency: g.para, basketId: g.siparisNo, paymentGroup: "PRODUCT",
    callbackUrl: g.donusAdresi, enabledInstallments: g.taksit && g.para === "TRY" ? [1, 2, 3, 6, 9, 12] : [1],
    buyer: {
      id: g.alici.id, name: g.alici.ad.slice(0, 60), surname: g.alici.soyad.slice(0, 60), identityNumber: g.alici.kimlikNo, email: g.alici.eposta,
      ...(g.alici.telefon ? { gsmNumber: g.alici.telefon } : {}), registrationAddress: g.alici.adres.slice(0, 250), city: g.alici.il.slice(0, 60), country: g.alici.ulke.slice(0, 60),
      ...(g.alici.postaKodu ? { zipCode: g.alici.postaKodu } : {}), ip: g.alici.ip,
    },
    billingAddress: adres,
    basketItems: [{ id: g.siparisNo, name: g.kalemAdi.slice(0, 100), category1: g.kategori, itemType: "VIRTUAL", price: fiyat }],
  };
  const j = await istek(a, "/payment/iyzipos/checkoutform/initialize/auth/ecom", govde);
  if (j.status !== "success") throw new OdemeHatasi(`iyzico: ${String(j.errorMessage ?? "ödeme formu açılamadı")}${j.errorCode ? ` (kod ${String(j.errorCode)})` : ""}`, 502);
  if (!yanitImzasiDogru(j, ["conversationId", "token"], a.secretKey)) throw new OdemeHatasi("iyzico yanıt imzası doğrulanamadı.", 502);
  if (typeof j.token !== "string" || typeof j.paymentPageUrl !== "string") throw new OdemeHatasi("iyzico ödeme sayfası adresi dönmedi.", 502);
  return { token: j.token, adres: j.paymentPageUrl };
}

export type IyzicoSonuc =
  | { durum: "odendi"; odemeKimligi: string; fiyat: number; tahsil: number; para: string; taksit: number; kart?: string }
  | { durum: "basarisiz"; hata: string }
  | { durum: "bekliyor"; neden: string };

/** CF Retrieve: imza, sepet, belirteç, tutar ve para birimi denetlenir. */
export async function formSonucu(a: IyzicoAyar, g: { siparisNo: string; token: string; tutar: number; para: string }): Promise<IyzicoSonuc> {
  const j = await istek(a, "/payment/iyzipos/checkoutform/auth/ecom/detail", { locale: "tr", conversationId: g.siparisNo, token: g.token });
  if (j.status !== "success") {
    // Belirteç süresi dolmuş ya da form hiç doldurulmamışsa iyzico hata döner: ödeme alınmamıştır.
    return { durum: "basarisiz", hata: String(j.errorMessage ?? "Ödeme tamamlanmadı") };
  }
  if (!yanitImzasiDogru(j, ["paymentStatus", "paymentId", "currency", "basketId", "conversationId", "paidPrice", "price", "token"], a.secretKey)) return { durum: "bekliyor", neden: "iyzico yanıt imzası doğrulanamadı" };
  if (String(j.basketId ?? "") !== g.siparisNo || String(j.token ?? "") !== g.token) return { durum: "bekliyor", neden: "iyzico yanıtı başka siparişe ait" };
  if (j.paymentStatus !== "SUCCESS") return { durum: "basarisiz", hata: String(j.errorMessage ?? (j.paymentStatus === "FAILURE" ? "Kart ödemesi reddedildi" : "Ödeme tamamlanmadı")) };
  const fiyat = Math.round(Number(j.price) * 100), tahsil = Math.round(Number(j.paidPrice) * 100);
  if (fiyat !== g.tutar || String(j.currency) !== g.para) return { durum: "bekliyor", neden: `Tutar uyuşmuyor: iyzico ${String(j.price)} ${String(j.currency)}` };
  if (Number(j.fraudStatus) === -1) return { durum: "basarisiz", hata: "Ödeme risk denetiminden geçmedi" };
  if (Number(j.fraudStatus) === 0) return { durum: "bekliyor", neden: "iyzico risk incelemesinde" };
  const MARKA: Record<string, string> = { MASTER_CARD: "Mastercard", VISA: "Visa", TROY: "Troy", AMERICAN_EXPRESS: "American Express" };
  const kart = [MARKA[String(j.cardAssociation)] ?? j.cardAssociation, j.cardFamily, j.lastFourDigits ? `son dört hane ${String(j.lastFourDigits)}` : ""].filter(Boolean).map(String).join(", ");
  return { durum: "odendi", odemeKimligi: String(j.paymentId), fiyat, tahsil: Number.isFinite(tahsil) && tahsil >= fiyat ? tahsil : fiyat, para: String(j.currency), taksit: Number(j.installment) || 1, ...(kart ? { kart } : {}) };
}

/** iyzico bildirim imzası (X-IYZ-SIGNATURE-V3, Ödeme Formu biçimi). */
export function bildirimImzasiDogru(a: IyzicoAyar, imza: string | null, g: Record<string, unknown>): boolean {
  if (!imza) return false;
  const anahtar = `${a.secretKey}${String(g.iyziEventType ?? "")}${String(g.iyziPaymentId ?? "")}${String(g.token ?? "")}${String(g.paymentConversationId ?? "")}${String(g.status ?? "")}`;
  return esit(hmacHex(a.secretKey, anahtar), imza.trim().toLowerCase());
}

/** Tam iade (ödeme kimliğiyle; iyzico'nun v2 iade ucu). */
export async function iadeEt(a: IyzicoAyar, g: { siparisNo: string; odemeKimligi: string; tutar: number; para: string; ip: string }): Promise<{ tutar: number }> {
  const j = await istek(a, "/v2/payment/refund", { locale: "tr", conversationId: g.siparisNo, paymentId: g.odemeKimligi, price: iyzicoFiyat(g.tutar), currency: g.para, ip: g.ip });
  if (j.status !== "success") throw new OdemeHatasi(`iyzico iade: ${String(j.errorMessage ?? "yapılamadı")}`, 502);
  return { tutar: Math.round(Number(j.price ?? g.tutar / 100) * 100) };
}
