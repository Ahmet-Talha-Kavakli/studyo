import "server-only";
import { createHmac, randomBytes } from "crypto";
import { adresGecerli } from "./kaynak";
import { guvenliFetch } from "@/lib/guvenliAg";
import { ADAPTORLER, type AdaptorId } from "./baglantiAdaptorTanim";

/**
 * Vayra adaptörlerinin sunucu tarafı: her araç servisin resmî REST API'sini kullanıcının anahtarlarıyla çağırır.
 * İmza kuralları resmî belgelerden:
 *  - iyzico IYZWSv2: HMAC-SHA256(randomKey + yol (sorgusuz) + gövde, secretKey) hex; başlık
 *    "IYZWSv2 " + base64("apiKey:..&randomKey:..&signature:.."), x-iyzi-rnd (docs.iyzico.com, iyzipay-node lib/utils.js).
 *  - PayTR: paytr_token = base64(HMAC-SHA256(alanlar + merchant_salt, merchant_key)) (dev.paytr.com).
 *  - Trendyol: Basic apiKey:apiSecret + zorunlu User-Agent "<satıcıId> - SelfIntegration" (developers.trendyol.com).
 *  - NetGSM: REST v2 Basic kullanıcı:şifre; yanıt gövdesindeki code "00" başarı (@netgsm/sms kaynağı).
 *  - Paraşüt: API v4 JSON:API, OAuth (Keycloak) erişim belirteci Bearer (devhub.parasut.com).
 * Yanıtlar modele gitmeden önce boş alanlardan arındırılır ve kısaltılır.
 */
export class AdaptorHata extends Error {
  constructor(mesaj: string, public durum: number) { super(mesaj); }
}
type Kimlik = Record<string, string>;
type Girdi = Record<string, unknown>;
const ZAMAN = 30_000;
const str = (v: unknown, n = 300) => (typeof v === "string" ? v.trim().slice(0, n) : typeof v === "number" ? String(v) : "");
const sayi = (v: unknown, varsayilan: number, en: number, cok: number) => { const x = Math.floor(Number(v)); return Number.isFinite(x) ? Math.min(cok, Math.max(en, x)) : varsayilan; };

/** Boş alanları atar, dizileri ve metinleri kısaltır (model bağlamını korumak için). */
export function kisalt(v: unknown, derinlik = 0): unknown {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "string") return v.length > 400 ? `${v.slice(0, 400)}…` : v;
  if (Array.isArray(v)) { const l = v.slice(0, 50).map((x) => kisalt(x, derinlik + 1)).filter((x) => x !== undefined); return v.length > 50 ? [...l, `(+${v.length - 50} kayıt daha)`] : l; }
  if (typeof v === "object") {
    if (derinlik > 6) return "(…)";
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) { const y = kisalt(x, derinlik + 1); if (y !== undefined && !(Array.isArray(y) && !y.length)) o[k] = y; }
    return Object.keys(o).length ? o : undefined;
  }
  return v;
}
const metne = (v: unknown) => JSON.stringify(kisalt(v) ?? {}, null, 1).slice(0, 40_000);
async function jsonOku(r: Response): Promise<Record<string, unknown> | null> { const t = await r.text(); try { return JSON.parse(t); } catch { return t ? { metin: t.slice(0, 500) } : null; } }

/* ───────────── iyzico ───────────── */
async function iyzico(k: Kimlik, yol: string, govde?: Girdi, sorgu?: Record<string, string>) {
  if (!k.api_key || !k.secret_key) throw new AdaptorHata("iyzico API anahtarı ve gizli anahtar gerekli.", 401);
  const taban = k.ortam === "canli" ? "https://api.iyzipay.com" : "https://sandbox-api.iyzipay.com";
  const rnd = `${Date.now()}${randomBytes(6).toString("hex")}`;
  const metin = govde ? JSON.stringify(govde) : "";
  const imza = createHmac("sha256", k.secret_key).update(rnd + yol + metin).digest("hex");
  const yetki = `IYZWSv2 ${Buffer.from(`apiKey:${k.api_key}&randomKey:${rnd}&signature:${imza}`).toString("base64")}`;
  const r = await fetch(`${taban}${yol}${sorgu ? `?${new URLSearchParams(sorgu)}` : ""}`, {
    method: govde ? "POST" : "GET", signal: AbortSignal.timeout(ZAMAN),
    headers: { Authorization: yetki, "x-iyzi-rnd": rnd, "Content-Type": "application/json", Accept: "application/json" }, body: govde ? metin : undefined,
  });
  const j = await jsonOku(r);
  if (!j || j.status !== "success") {
    const m = str(j?.errorMessage) || `iyzico yanıt vermedi (${r.status}).`;
    throw new AdaptorHata(`iyzico: ${m}${j?.errorCode ? ` (kod ${j.errorCode})` : ""}`, r.status === 401 || r.status === 403 || ["1000", "1001"].includes(String(j?.errorCode ?? "")) ? 401 : 400);
  }
  const { status: _s, locale: _l, systemTime: _t, conversationId: _c, ...kalan } = j; void _s; void _l; void _t; void _c;
  return kalan;
}
async function gorselBase64(u: string): Promise<string> {
  const a = adresGecerli(u);
  if (!a || a.protocol !== "https:") throw new AdaptorHata("Görsel adresi https olmalı.", 400);
  const r = await guvenliFetch(a, { signal: AbortSignal.timeout(15_000) }, { yalnizHttps: true });
  const tur = r.headers.get("content-type") ?? "";
  if (!r.ok || !/^image\/(png|jpe?g)/.test(tur)) throw new AdaptorHata("Görsel indirilemedi (png ya da jpg olmalı).", 400);
  const b = Buffer.from(await r.arrayBuffer());
  if (b.length > 2_000_000) throw new AdaptorHata("Görsel 2 MB'tan küçük olmalı.", 400);
  return b.toString("base64");
}
async function iyzicoArac(k: Kimlik, arac: string, g: Girdi): Promise<unknown> {
  const ortak = { locale: "tr", conversationId: `vayra-${Date.now()}` };
  switch (arac) {
    case "odeme_sorgula": {
      const id = str(g.odeme_id, 40), sip = str(g.siparis_id, 64);
      if (!id && !sip) throw new AdaptorHata("odeme_id ya da siparis_id gerekli.", 400);
      return iyzico(k, "/payment/detail", { ...ortak, ...(id ? { paymentId: id } : { paymentConversationId: sip }) });
    }
    case "gunluk_islemler": {
      const t = str(g.tarih, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) throw new AdaptorHata("tarih YYYY-AA-GG olmalı.", 400);
      return iyzico(k, "/v2/reporting/payment/transactions", undefined, { transactionDate: t, page: String(sayi(g.sayfa, 1, 1, 10_000)) });
    }
    case "taksit_sorgula": { const bin = str(g.bin, 8); return iyzico(k, "/payment/iyzipos/installment", { ...ortak, price: str(g.tutar, 20).replace(",", "."), ...(/^\d{6,8}$/.test(bin) ? { binNumber: bin } : {}) }); }
    case "bin_sorgula": { const bin = str(g.bin, 8); if (!/^\d{6,8}$/.test(bin)) throw new AdaptorHata("bin 6-8 hane olmalı.", 400); return iyzico(k, "/payment/bin/check", { ...ortak, binNumber: bin }); }
    case "odeme_baglantilari": return iyzico(k, "/v2/iyzilink/products", undefined, { locale: "tr", conversationId: ortak.conversationId, page: String(sayi(g.sayfa, 1, 1, 10_000)), count: String(sayi(g.adet, 20, 1, 100)) });
    case "odeme_baglantisi_olustur": {
      const encodedImageFile = await gorselBase64(str(g.gorsel_url, 800));
      return iyzico(k, "/v2/iyzilink/products", {
        ...ortak, name: str(g.ad, 120), description: str(g.aciklama, 500), price: str(g.tutar, 20).replace(",", "."), currencyCode: str(g.para_birimi, 3) || "TRY",
        encodedImageFile, installmentRequested: g.taksit === true,
      });
    }
  }
  throw new AdaptorHata("Bilinmeyen araç.", 400);
}

/* ───────────── PayTR ───────────── */
async function paytr(k: Kimlik, url: string, alanlar: Record<string, string>, imzaMetni: string) {
  if (!k.merchant_id || !k.merchant_key || !k.merchant_salt) throw new AdaptorHata("PayTR mağaza no, parola ve gizli anahtar gerekli.", 401);
  const paytr_token = createHmac("sha256", k.merchant_key).update(imzaMetni + k.merchant_salt).digest("base64");
  const r = await fetch(url, { method: "POST", signal: AbortSignal.timeout(ZAMAN), headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: new URLSearchParams({ merchant_id: k.merchant_id, ...alanlar, paytr_token }).toString() });
  const j = await jsonOku(r);
  if (j?.status === "success") { const { status: _s, ...kalan } = j; void _s; return kalan; }
  if (j?.status === "failed") return { sonuc: str(j.err_msg ?? j.reason) || "Kayıt bulunamadı." };
  const m = str(j?.err_msg ?? j?.reason ?? j?.metin) || `PayTR yanıt vermedi (${r.status}).`;
  throw new AdaptorHata(`PayTR: ${m}${j?.err_no ? ` (kod ${j.err_no})` : ""}`, /token|merchant|hash|paytr_token/i.test(m) ? 401 : 400);
}
async function paytrArac(k: Kimlik, arac: string, g: Girdi): Promise<unknown> {
  const m = k.merchant_id;
  switch (arac) {
    case "odeme_durumu": { const oid = str(g.siparis_no, 64); if (!oid) throw new AdaptorHata("siparis_no gerekli.", 400); return paytr(k, "https://www.paytr.com/odeme/durum-sorgu", { merchant_oid: oid }, m + oid); }
    case "islem_dokumu": {
      const a = str(g.baslangic, 19), b = str(g.bitis, 19);
      const d = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;
      if (!d.test(a) || !d.test(b)) throw new AdaptorHata("Tarihler YYYY-AA-GG SS:dd:ss olmalı.", 400);
      const bas = a.length === 10 ? `${a} 00:00:00` : a, bit = b.length === 10 ? `${b} 23:59:59` : b;
      return paytr(k, "https://www.paytr.com/rapor/islem-dokumu", { start_date: bas, end_date: bit }, m + bas + bit);
    }
    case "taksit_oranlari": { const rid = randomBytes(12).toString("hex"); return paytr(k, "https://www.paytr.com/odeme/taksit-oranlari", { request_id: rid }, m + rid); }
    case "bin_sorgula": { const bin = str(g.bin, 8); if (!/^\d{6,8}$/.test(bin)) throw new AdaptorHata("bin 6-8 hane olmalı.", 400); return paytr(k, "https://www.paytr.com/odeme/api/bin-detail", { bin_number: bin }, bin + m); }
    case "odeme_linki_olustur": {
      const name = str(g.ad, 200), price = String(Math.round(Number(g.tutar) * 100)), currency = str(g.para_birimi, 3) || "TL", max_installment = String(sayi(g.en_cok_taksit, 1, 1, 12));
      const link_type = g.tur === "collection" ? "collection" : "product", lang = "tr";
      if (name.length < 4 || !(Number(price) > 0)) throw new AdaptorHata("Ad en az 4 karakter, tutar sıfırdan büyük olmalı.", 400);
      let imza = name + price + currency + max_installment + link_type + lang;
      const ek: Record<string, string> = {};
      if (link_type === "product") { ek.min_count = String(sayi(g.en_az_adet, 1, 1, 10_000)); imza += ek.min_count; }
      else { ek.email = str(g.eposta, 120); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ek.email)) throw new AdaptorHata("Tahsilat linki için geçerli e-posta gerekli.", 400); imza += ek.email; }
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str(g.son_tarih, 19))) ek.expiry_date = str(g.son_tarih, 19);
      return paytr(k, "https://www.paytr.com/odeme/api/link/create", { name, price, currency, max_installment, link_type, lang, ...ek }, imza);
    }
    case "odeme_linki_sil": { const id = str(g.link_id, 40); if (!/^[A-Za-z0-9]+$/.test(id)) throw new AdaptorHata("link_id geçersiz.", 400); return paytr(k, "https://www.paytr.com/odeme/api/link/delete", { id }, id + m); }
  }
  throw new AdaptorHata("Bilinmeyen araç.", 400);
}

/* ───────────── Trendyol ───────────── */
async function trendyol(k: Kimlik, yol: string, govde?: unknown, sorgu?: Record<string, string | undefined>) {
  if (!k.satici_id || !k.api_key || !k.api_secret) throw new AdaptorHata("Trendyol satıcı ID, API Key ve API Secret gerekli.", 401);
  const taban = k.ortam === "test" ? "https://stageapigw.trendyol.com/integration" : "https://apigw.trendyol.com/integration";
  const q = sorgu ? Object.entries(sorgu).filter(([, v]) => v !== undefined && v !== "") as [string, string][] : [];
  const r = await fetch(`${taban}${yol.replace("{id}", encodeURIComponent(k.satici_id))}${q.length ? `?${new URLSearchParams(q)}` : ""}`, {
    method: govde ? "POST" : "GET", signal: AbortSignal.timeout(ZAMAN), body: govde ? JSON.stringify(govde) : undefined,
    headers: { Authorization: `Basic ${Buffer.from(`${k.api_key}:${k.api_secret}`).toString("base64")}`, "User-Agent": `${k.satici_id} - SelfIntegration`, Accept: "application/json", ...(govde ? { "Content-Type": "application/json" } : {}) },
  });
  const j = await jsonOku(r);
  if (r.status === 401 || r.status === 403) throw new AdaptorHata("Trendyol anahtarları ya da satıcı ID hatalı.", 401);
  if (r.status === 429) throw new AdaptorHata("Trendyol istek sınırı aşıldı; biraz sonra dene.", 429);
  if (!r.ok) { const e = (j?.errors as { message?: string }[] | undefined)?.[0]?.message ?? str(j?.message ?? j?.metin); throw new AdaptorHata(`Trendyol: ${e || `yanıt ${r.status}`}`, 400); }
  return j ?? { sonuc: "Tamam" };
}
const ms = (t: string, son = false) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return undefined; const d = Date.parse(`${t}T${son ? "23:59:59" : "00:00:00"}+03:00`); return Number.isFinite(d) ? String(d) : undefined; };
async function trendyolArac(k: Kimlik, arac: string, g: Girdi): Promise<unknown> {
  switch (arac) {
    case "siparisler": return trendyol(k, "/order/sellers/{id}/orders", undefined, { status: str(g.durum, 30) || undefined, startDate: ms(str(g.baslangic, 10)), endDate: ms(str(g.bitis, 10), true), orderNumber: str(g.siparis_no, 40) || undefined, page: String(sayi(g.sayfa, 0, 0, 5000)), size: String(sayi(g.boyut, 50, 1, 200)), orderByField: "PackageLastModifiedDate", orderByDirection: "DESC" });
    case "urunler": return trendyol(k, "/product/sellers/{id}/products/approved", undefined, { barcode: str(g.barkod, 60) || undefined, stockCode: str(g.stok_kodu, 60) || undefined, status: str(g.durum, 20) || undefined, page: String(sayi(g.sayfa, 0, 0, 5000)), size: String(sayi(g.boyut, 50, 1, 100)) });
    case "musteri_sorulari": return trendyol(k, "/qna/sellers/{id}/questions/filter", undefined, { status: str(g.durum, 30) || "WAITING_FOR_ANSWER", barcode: str(g.barkod, 60) || undefined, page: String(sayi(g.sayfa, 0, 0, 5000)), size: String(sayi(g.boyut, 50, 1, 200)), orderByDirection: "DESC" });
    case "toplu_islem_sonucu": { const id = str(g.islem_id, 80); if (!/^[\w-]+$/.test(id)) throw new AdaptorHata("islem_id geçersiz.", 400); return trendyol(k, `/product/sellers/{id}/products/batch-requests/${id}`); }
    case "fiyat_stok_guncelle": {
      const l = (Array.isArray(g.urunler) ? g.urunler : []).slice(0, 1000).map((x) => x as Girdi).filter((x) => str(x.barkod, 60));
      if (!l.length) throw new AdaptorHata("En az bir barkod gerekli.", 400);
      const items = l.map((x) => ({ barcode: str(x.barkod, 60), ...(x.stok !== undefined ? { quantity: sayi(x.stok, 0, 0, 20_000) } : {}), ...(Number(x.satis_fiyati) > 0 ? { salePrice: Number(x.satis_fiyati) } : {}), ...(Number(x.liste_fiyati) > 0 ? { listPrice: Number(x.liste_fiyati) } : {}) }));
      return trendyol(k, "/inventory/sellers/{id}/products/price-and-inventory", { items });
    }
    case "soru_yanitla": {
      const id = str(g.soru_id, 40), text = str(g.yanit, 2000);
      if (!/^\d+$/.test(id)) throw new AdaptorHata("soru_id geçersiz.", 400);
      if (text.length < 10) throw new AdaptorHata("Yanıt en az 10 karakter olmalı.", 400);
      return trendyol(k, `/qna/sellers/{id}/questions/${id}/answers`, { text });
    }
  }
  throw new AdaptorHata("Bilinmeyen araç.", 400);
}

/* ───────────── NetGSM ───────────── */
const NETGSM_KOD: Record<string, string> = {
  "20": "Mesaj metni hatalı ya da çok uzun.", "30": "Kullanıcı adı ya da şifre hatalı, API izni yok ya da IP kısıtı var.", "40": "Gönderici başlığı tanımlı değil.",
  "50": "Bu hesapla İYS kontrollü gönderim yapılamıyor.", "51": "İYS marka bilgisi yok.", "60": "Kayıt bulunamadı.", "70": "Eksik ya da hatalı parametre.", "80": "Gönderim sınırı aşıldı.", "85": "Aynı numaraya 1 dakikada çok fazla gönderim.", "100": "Netgsm sistem hatası.", "101": "Netgsm sistem hatası.",
};
async function netgsm(k: Kimlik, yol: string, govde?: unknown, sorgu?: Record<string, string>) {
  if (!k.kullanici || !k.sifre) throw new AdaptorHata("Netgsm kullanıcı adı ve şifre gerekli.", 401);
  const r = await fetch(`https://api.netgsm.com.tr${yol}${sorgu ? `?${new URLSearchParams(sorgu)}` : ""}`, {
    method: govde ? "POST" : "GET", signal: AbortSignal.timeout(ZAMAN), body: govde ? JSON.stringify(govde) : undefined,
    headers: { Authorization: `Basic ${Buffer.from(`${k.kullanici}:${k.sifre}`).toString("base64")}`, Accept: "application/json", ...(govde ? { "Content-Type": "application/json" } : {}) },
  });
  const j = await jsonOku(r);
  const kod = j && "code" in j ? String(j.code) : undefined;
  if (kod && kod !== "00") throw new AdaptorHata(`Netgsm: ${NETGSM_KOD[kod] ?? str(j?.description) ?? "hata"} (kod ${kod})`, kod === "30" ? 401 : 400);
  if (!j || (!r.ok && !kod)) throw new AdaptorHata(`Netgsm yanıt vermedi (${r.status}).`, r.status === 401 ? 401 : 400);
  return j;
}
async function netgsmArac(k: Kimlik, arac: string, g: Girdi): Promise<unknown> {
  switch (arac) {
    case "gonderici_basliklari": return netgsm(k, "/sms/rest/v2/msgheader");
    case "bakiye": {
      const r = await fetch("https://api.netgsm.com.tr/balance", { method: "POST", signal: AbortSignal.timeout(ZAMAN), headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ usercode: k.kullanici, password: k.sifre, stip: 3 }) });
      const j = await jsonOku(r);
      if (j && "code" in j && String(j.code) !== "00") throw new AdaptorHata(`Netgsm: ${NETGSM_KOD[String(j.code)] ?? "bakiye alınamadı"} (kod ${j.code})`, String(j.code) === "30" ? 401 : 400);
      if (!r.ok || !j) throw new AdaptorHata(`Netgsm yanıt vermedi (${r.status}).`, 400);
      return j;
    }
    case "gonderim_raporu": {
      const jobids = (Array.isArray(g.gorev_idleri) ? g.gorev_idleri : []).map((x) => str(x, 40)).filter(Boolean).slice(0, 50);
      const d = /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/;
      const startdate = str(g.baslangic, 19), stopdate = str(g.bitis, 19);
      if (!jobids.length && !(d.test(startdate) && d.test(stopdate))) throw new AdaptorHata("Görev kimliği ya da GG.AA.YYYY SS:dd:ss biçiminde tarih aralığı gerekli.", 400);
      return netgsm(k, "/sms/rest/v2/report", { ...(jobids.length ? { jobids } : {}), ...(d.test(startdate) && d.test(stopdate) ? { startdate, stopdate } : {}) });
    }
    case "gelen_kutusu": {
      const a = str(g.baslangic, 12), b = str(g.bitis, 12);
      return netgsm(k, "/sms/rest/v2/inbox", undefined, /^\d{12}$/.test(a) && /^\d{12}$/.test(b) ? { startdate: a, stopdate: b } : undefined);
    }
    case "sms_gonder": {
      const msg = str(g.mesaj, 900), baslik = str(g.baslik, 11) || k.baslik;
      const nolar = (Array.isArray(g.numaralar) ? g.numaralar : []).map((x) => str(x, 20).replace(/[^\d]/g, "").replace(/^(90|0)(?=5\d{9}$)/, "")).filter((x) => /^\d{10,14}$/.test(x)).slice(0, 100);
      if (!msg || !nolar.length) throw new AdaptorHata("Mesaj ve en az bir geçerli numara gerekli.", 400);
      if (!baslik) throw new AdaptorHata("Gönderici başlığı gerekli (gonderici_basliklari ile listele).", 400);
      const iys = ["0", "11", "12"].includes(str(g.iys, 2)) ? str(g.iys, 2) : "0";
      return netgsm(k, "/sms/rest/v2/send", { msgheader: baslik, messages: nolar.map((no) => ({ msg, no })), encoding: "TR", iysfilter: iys });
    }
  }
  throw new AdaptorHata("Bilinmeyen araç.", 400);
}

/* ───────────── Paraşüt ───────────── */
async function parasut(k: Kimlik, token: string | undefined, yol: string, govde?: unknown, sorgu?: Record<string, string | undefined>) {
  if (!token) throw new AdaptorHata("Paraşüt girişi gerekli.", 401);
  if (!/^\d{1,12}$/.test(k.firma_no ?? "")) throw new AdaptorHata("Paraşüt firma numarası gerekli.", 400);
  const q = sorgu ? Object.entries(sorgu).filter(([, v]) => v !== undefined && v !== "") as [string, string][] : [];
  const tam = yol === "/me" ? "https://api.parasut.com/v4/me" : `https://api.parasut.com/v4/${k.firma_no}${yol}`;
  const r = await fetch(`${tam}${q.length ? `?${new URLSearchParams(q)}` : ""}`, {
    method: govde ? "POST" : "GET", signal: AbortSignal.timeout(ZAMAN), body: govde ? JSON.stringify(govde) : undefined,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.api+json", ...(govde ? { "Content-Type": "application/vnd.api+json" } : {}) },
  });
  const j = await jsonOku(r);
  if (r.status === 401) throw new AdaptorHata("Paraşüt oturumu doldu; yeniden giriş yap.", 401);
  if (r.status === 429) throw new AdaptorHata("Paraşüt istek sınırı aşıldı; biraz sonra dene.", 429);
  if (!r.ok) { const e = (j?.errors as { title?: string; detail?: string }[] | undefined)?.[0]; throw new AdaptorHata(`Paraşüt: ${e?.detail ?? e?.title ?? `yanıt ${r.status}`}`, r.status === 403 ? 403 : 400); }
  return jsonApiDuz(j);
}
/** JSON:API yanıtını düzleştirir: { id, tur, ...attributes, iliskiler } + sayfa bilgisi. */
function jsonApiDuz(j: Record<string, unknown> | null): unknown {
  if (!j) return {};
  const tek = (d: Record<string, unknown>) => ({ id: d.id, tur: d.type, ...(d.attributes as object), ...(d.relationships ? { iliskiler: Object.fromEntries(Object.entries(d.relationships as Record<string, { data?: unknown }>).map(([k, v]) => [k, v?.data]).filter(([, v]) => v)) } : {}) });
  const data = j.data;
  return { veri: Array.isArray(data) ? data.map((d) => tek(d as Record<string, unknown>)) : data ? tek(data as Record<string, unknown>) : undefined, ekler: Array.isArray(j.included) ? (j.included as Record<string, unknown>[]).map(tek) : undefined, sayfa: j.meta };
}
async function parasutArac(k: Kimlik, token: string | undefined, arac: string, g: Girdi): Promise<unknown> {
  const sayfa = { "page[number]": String(sayi(g.sayfa, 1, 1, 10_000)), "page[size]": "25" };
  switch (arac) {
    case "kisileri_listele": return parasut(k, token, "/contacts", undefined, { "filter[name]": str(g.ad, 80) || undefined, "filter[email]": str(g.eposta, 120) || undefined, "filter[tax_number]": str(g.vergi_no, 20) || undefined, "filter[account_type]": str(g.tur, 10) || undefined, ...sayfa });
    case "kisi_getir": { const id = str(g.id, 20); if (!/^\d+$/.test(id)) throw new AdaptorHata("id geçersiz.", 400); return parasut(k, token, `/contacts/${id}`, undefined, { include: "category,contact_people" }); }
    case "satis_faturalari": return parasut(k, token, "/sales_invoices", undefined, { "filter[contact_id]": str(g.musteri_id, 20) || undefined, "filter[payment_status]": str(g.odeme_durumu, 12) || undefined, "filter[item_type]": str(g.tur, 10) || undefined, sort: "-issue_date", include: "contact", ...sayfa });
    case "fatura_getir": { const id = str(g.id, 20); if (!/^\d+$/.test(id)) throw new AdaptorHata("id geçersiz.", 400); return parasut(k, token, `/sales_invoices/${id}`, undefined, { include: "contact,details,details.product,payments" }); }
    case "urunleri_listele": return parasut(k, token, "/products", undefined, { "filter[name]": str(g.ad, 80) || undefined, "filter[code]": str(g.kod, 40) || undefined, ...sayfa });
    case "hesaplari_listele": return parasut(k, token, "/accounts", undefined, { "filter[account_type]": str(g.tur, 6) || undefined, "page[size]": "25" });
    case "kisi_olustur": {
      const name = str(g.ad, 200), account_type = g.tur === "supplier" ? "supplier" : "customer";
      if (!name) throw new AdaptorHata("ad gerekli.", 400);
      const attributes: Record<string, string> = { name, account_type };
      const ek: [string, string, number][] = [["contact_type", "kisi_turu", 10], ["email", "eposta", 120], ["phone", "telefon", 30], ["tax_number", "vergi_no", 20], ["tax_office", "vergi_dairesi", 80], ["city", "sehir", 60], ["district", "ilce", 60], ["address", "adres", 300]];
      for (const [a, b, n] of ek) { const v = str(g[b], n); if (v) attributes[a] = v; }
      if (attributes.contact_type && !["person", "company"].includes(attributes.contact_type)) delete attributes.contact_type;
      return parasut(k, token, "/contacts", { data: { type: "contacts", attributes } });
    }
  }
  throw new AdaptorHata("Bilinmeyen araç.", 400);
}

/* ───────────── Ortak giriş ───────────── */
/** Adaptör aracını çalıştırır. Dönüş MCP aracı gibi: metin + hata işareti. 401 durumunda AdaptorHata fırlatır. */
export async function adaptorCagir(id: AdaptorId, kimlik: Kimlik, arac: string, girdi: unknown, token?: string): Promise<{ metin: string; hata: boolean }> {
  if (!ADAPTORLER[id]?.araclar.some((a) => a.name === arac)) return { metin: "Bu adaptörde böyle bir araç yok.", hata: true };
  const g = (girdi && typeof girdi === "object" ? girdi : {}) as Girdi;
  try {
    const v = id === "iyzico" ? await iyzicoArac(kimlik, arac, g) : id === "paytr" ? await paytrArac(kimlik, arac, g) : id === "trendyol" ? await trendyolArac(kimlik, arac, g)
      : id === "netgsm" ? await netgsmArac(kimlik, arac, g) : await parasutArac(kimlik, token, arac, g);
    return { metin: metne(v), hata: false };
  } catch (e) {
    if (e instanceof AdaptorHata && e.durum === 401) throw e;
    const m = e instanceof AdaptorHata ? e.message : (e as Error).name === "TimeoutError" ? "Servis zamanında yanıt vermedi." : `Bağlantı hatası: ${(e as Error).message.slice(0, 200)}`;
    return { metin: m, hata: true };
  }
}

/** Kimlik bilgilerini salt okuma bir çağrıyla dener (para hareketi ya da gönderim yapmaz). */
export async function adaptorDene(id: AdaptorId, kimlik: Kimlik, token?: string): Promise<void> {
  if (id === "iyzico") await iyzico(kimlik, "/payment/bin/check", { locale: "tr", conversationId: `vayra-dene-${Date.now()}`, binNumber: "554960" });
  else if (id === "paytr") await paytrArac(kimlik, "taksit_oranlari", {});
  else if (id === "trendyol") await trendyol(kimlik, "/order/sellers/{id}/orders", undefined, { page: "0", size: "1" });
  else if (id === "netgsm") await netgsm(kimlik, "/sms/rest/v2/msgheader");
  else await parasut(kimlik, token, "/me");
}
