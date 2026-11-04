import { NextRequest, NextResponse } from "next/server";
import { anahtarDogrula, bearerCikar } from "@/lib/apiAnahtarDogrula";
import { icerikDenetle } from "@/lib/moderasyon";
import { MODELLER } from "@/lib/catalog";
import { hataBul } from "@/lib/api/hatalar";
import { API_TUR, UST_ALANLAR, inputDogrula, krediHesapla, modelNesnesi, type AlanHatasi } from "@/lib/api/sema";
import {
  D, OLAYLAR, anahtarKimligi, ayarGetir, aylikHarcanan, genelUretim, hesapGuncelle, hesapKullanilabilir, hizKontrol, idemBak, idemKaydet,
  istekSirri, istekSirriKaydet, modelBul, rndHex, tekTeslim, teslimListele, teslimYenidenGonder, uretimIptal, uretimKaydi, uretimListele, uretimOlustur, wavOlustur,
  type AnahtarAyar, type Kapsam, type Ortam,
} from "@/lib/api/motor";

export const runtime = "nodejs";

/**
 * Vayra API v1 — tek giriş noktası.
 *
 *   GET    /v1/ping                         sağlık (kimlik gerekmez)
 *   GET    /v1/models                       model listesi
 *   GET    /v1/models/{id}                  model + girdi şeması
 *   POST   /v1/generations                  üretim başlat
 *   GET    /v1/generations                  üretimleri listele
 *   GET    /v1/generations/{id}             üretim
 *   POST   /v1/generations/{id}/cancel      iptal
 *   GET    /v1/account                      anahtar, bakiye, limitler
 *   GET    /v1/keys/self                    anahtar ayarları
 *   PUT    /v1/keys/self                    anahtar ayarları (panel kullanır)
 *   DELETE /v1/keys/self                    anahtarı iptal et
 *   GET    /v1/webhooks/deliveries          webhook teslim günlüğü
 *   POST   /v1/webhooks/test                test olayı gönder
 *   POST   /v1/webhooks/deliveries/{id}/redeliver  teslimi yeniden gönder
 *   GET    /v1/files/{id}/{n}               üretim dosyası (kimlik gerekmez)
 *
 * Eski yollar (text2image/{model} …) düz gövdeyle /v1/generations'a yönlenir.
 */

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "authorization, content-type, idempotency-key",
  "access-control-expose-headers": "x-request-id, x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset, retry-after, idempotent-replayed",
};

type Baglam = { reqId: string; ek: Record<string, string> };

function yanit(govde: unknown, durum: number, b: Baglam, ek?: Record<string, string>) {
  return NextResponse.json(govde, { status: durum, headers: { ...CORS, "x-request-id": b.reqId, "x-vayra-api": "v1", ...b.ek, ...ek } });
}
function hata(b: Baglam, kod: string, o: { mesaj?: string; param?: string; ek?: Record<string, unknown>; baslik?: Record<string, string> } = {}) {
  const h = hataBul(kod);
  return yanit({ error: { type: h.tur, code: h.kod, message: o.mesaj ?? h.mesaj, ...(o.param ? { param: o.param } : {}), ...o.ek, request_id: b.reqId, doc_url: `/panel/api/hatalar#${h.kod}` } }, h.http, b, o.baslik);
}

function kokAdres(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  return `${proto}://${host}`;
}

type Yetki = { kid: string; ortam: Ortam; ayar: AnahtarAyar; govde: string };
type Islem = "okuma" | "uretim" | "yonetim" | "kendi";

const IZIN: Record<Kapsam, Islem[]> = { full: ["okuma", "uretim", "yonetim", "kendi"], generate: ["okuma", "uretim", "kendi"], read: ["okuma", "kendi"] };

async function yetkilendir(req: NextRequest, b: Baglam, islem: Islem): Promise<Yetki | NextResponse> {
  const anahtar = bearerCikar(req.headers.get("authorization"));
  const c = await anahtarDogrula(anahtar);
  if (!c.gecerli || !c.govde || !c.ortam) return hata(b, "invalid_api_key", { mesaj: anahtar ? `API anahtarı geçersiz: ${c.neden}.` : undefined });
  const ortam: Ortam = c.ortam === "canli" ? "live" : "test";
  const kid = await anahtarKimligi(c.govde);
  const ayar = ayarGetir(kid, ortam);
  if (ayar.revoked) return hata(b, "api_key_revoked");
  if (ayar.expires_at && Date.now() > ayar.expires_at) return hata(b, "api_key_expired");
  if (!IZIN[ayar.scope].includes(islem)) return hata(b, "insufficient_scope", { mesaj: `Bu anahtarın kapsamı '${ayar.scope}'; bu işlem '${islem === "uretim" ? "generate" : "full"}' kapsamı ister.` });
  // Anahtarın kendi ayar uç noktaları (panel senkronu) kullanıcının kotasından yemez.
  if (islem === "kendi") { istekSirriKaydet(kid, await istekSirri(c.govde)); return { kid, ortam, ayar, govde: c.govde }; }
  const rl = hizKontrol(kid, ayar.rate_limit);
  b.ek = { "x-ratelimit-limit": String(ayar.rate_limit), "x-ratelimit-remaining": String(rl.kalan), "x-ratelimit-reset": String(rl.sifirlanma) };
  if (!rl.izin) return hata(b, "rate_limit_exceeded", { mesaj: `Dakikada ${ayar.rate_limit} istek sınırı aşıldı. ${rl.bekle} sn sonra yeniden dene.`, baslik: { "retry-after": String(rl.bekle) } });
  istekSirriKaydet(kid, await istekSirri(c.govde));
  return { kid, ortam, ayar, govde: c.govde };
}

async function govdeOku(req: NextRequest): Promise<Record<string, unknown> | null | "bos"> {
  const metin = await req.text();
  if (!metin.trim()) return "bos";
  try { const j = JSON.parse(metin); return typeof j === "object" && j && !Array.isArray(j) ? j : null; } catch { return null; }
}

const ESKI_YOL: Record<string, string> = { text2image: "image", image2video: "video", text2video: "video", text2speech: "audio", text2music: "music", text2threed: "3d" };

/* ── Üretim başlat ── */
async function uretimBaslat(req: NextRequest, b: Baglam, y: Yetki, govde: Record<string, unknown>) {
  const origin = kokAdres(req);
  const modelId = govde.model;
  if (typeof modelId !== "string" || !modelId) return hata(b, "parameter_missing", { mesaj: "'model' alanı zorunlu.", param: "model" });
  const model = modelBul(modelId);
  if (!model) return hata(b, "model_not_found", { mesaj: `'${modelId}' adında bir model yok. GET /v1/models ile listeyi al.`, param: "model" });
  for (const k of Object.keys(govde)) {
    if (!UST_ALANLAR.some((a) => a.ad === k)) return hata(b, "parameter_invalid", { mesaj: `Bilinmeyen alan '${k}'. Model girdileri 'input' nesnesinin içinde gönderilir.`, param: k });
  }
  if (govde.input === undefined) return hata(b, "parameter_missing", { mesaj: "'input' alanı zorunlu.", param: "input" });
  const { temiz, hatalar } = inputDogrula(model, govde.input);
  if (hatalar.length) {
    const eksik = hatalar.find((h: AlanHatasi) => h.mesaj === "Zorunlu alan.");
    return hata(b, eksik ? "parameter_missing" : "parameter_invalid", { mesaj: `${hatalar[0].alan}: ${hatalar[0].mesaj}`, param: hatalar[0].alan, ek: { errors: hatalar.map((h) => ({ param: h.alan, message: h.mesaj })) } });
  }
  const webhook = govde.webhook_url;
  if (webhook !== undefined && webhook !== null && (typeof webhook !== "string" || !/^https?:\/\//.test(webhook))) return hata(b, "parameter_invalid", { mesaj: "webhook_url http(s):// ile başlamalı.", param: "webhook_url" });
  const metadata = govde.metadata ?? {};
  if (typeof metadata !== "object" || Array.isArray(metadata) || Object.keys(metadata as object).length > 16) return hata(b, "parameter_invalid", { mesaj: "metadata en çok 16 anahtarlı bir nesne olmalı.", param: "metadata" });
  if (govde.sync !== undefined && typeof govde.sync !== "boolean") return hata(b, "parameter_invalid", { mesaj: "sync true ya da false olmalı.", param: "sync" });

  const denetim = icerikDenetle(String(temiz.prompt ?? ""));
  if (!denetim.izin) return hata(b, "content_policy_violation", { mesaj: denetim.mesaj, param: "input.prompt", ek: { category: denetim.kategori } });

  // Idempotency
  const idemAnahtar = req.headers.get("idempotency-key");
  const ozet = JSON.stringify({ model: modelId, input: temiz, webhook, metadata });
  if (idemAnahtar) {
    const d = idemBak(y.kid, idemAnahtar, ozet);
    if (d.durum === "cakisma") return hata(b, "idempotency_conflict");
    if (d.durum === "tekrar") { const g = genelUretim(d.id); if (g) return yanit(g, 200, b, { "idempotent-replayed": "true" }); }
  }

  // Kredi ve harcama sınırı (yalnız canlı)
  if (y.ortam === "live") {
    const maliyet = krediHesapla(model, temiz);
    const kalan = hesapKullanilabilir(y.ayar.account);
    if (kalan !== null && kalan < maliyet) return hata(b, "insufficient_credits", { mesaj: `Bu üretim ${maliyet} kredi tutuyor; kullanılabilir bakiye ${kalan}.`, ek: { credits_required: maliyet, credits_available: kalan } });
    if (y.ayar.monthly_limit !== null) {
      const harcanan = Math.max(y.ayar.monthly_spent_base, aylikHarcanan(y.kid));
      if (harcanan + maliyet > y.ayar.monthly_limit) return hata(b, "spend_limit_reached", { mesaj: `Aylık sınır ${y.ayar.monthly_limit} kredi; bu ay ${harcanan} kredi harcandı.` });
    }
  }

  const gen = uretimOlustur({ kid: y.kid, ortam: y.ortam, model, input: temiz, webhook_url: (webhook as string) ?? null, metadata: metadata as Record<string, unknown>, origin, hesap: y.ayar.account });
  if (idemAnahtar) idemKaydet(y.kid, idemAnahtar, ozet, gen.id);

  if (govde.sync === true) {
    const son = Date.now() + 55_000;
    while (Date.now() < son) {
      const g = genelUretim(gen.id)!;
      if (g.status !== "queued" && g.status !== "processing") return yanit(g, 200, b);
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return yanit(genelUretim(gen.id), 201, b, { location: gen.urls.get });
}

/* ── Anahtar ayarı (panel senkronu) ── */
function ayarDogrula(g: Record<string, unknown>, mevcut: AnahtarAyar): AnahtarAyar | string {
  const yeni: AnahtarAyar = { ...mevcut, updated_at: Date.now() };
  if (g.name !== undefined) { if (typeof g.name !== "string" || g.name.length > 60) return "name"; yeni.name = g.name; }
  if (g.scope !== undefined) { if (!["full", "generate", "read"].includes(g.scope as string)) return "scope"; yeni.scope = g.scope as Kapsam; }
  if (g.rate_limit !== undefined) { const n = Number(g.rate_limit); if (!Number.isInteger(n) || n < 1 || n > 600) return "rate_limit"; yeni.rate_limit = n; }
  if (g.expires_at !== undefined) { if (g.expires_at !== null && typeof g.expires_at !== "number") return "expires_at"; yeni.expires_at = g.expires_at as number | null; }
  if (g.monthly_limit !== undefined) { if (g.monthly_limit !== null && (typeof g.monthly_limit !== "number" || g.monthly_limit < 0)) return "monthly_limit"; yeni.monthly_limit = g.monthly_limit as number | null; }
  if (g.monthly_spent_base !== undefined) { if (typeof g.monthly_spent_base !== "number") return "monthly_spent_base"; yeni.monthly_spent_base = g.monthly_spent_base; }
  if (g.account !== undefined) { if (g.account !== null && typeof g.account !== "string") return "account"; yeni.account = g.account as string | null; }
  if (g.webhooks !== undefined) {
    if (!Array.isArray(g.webhooks) || g.webhooks.length > 20) return "webhooks";
    const l: AnahtarAyar["webhooks"] = [];
    for (const w of g.webhooks as Record<string, unknown>[]) {
      if (typeof w?.url !== "string" || !/^https?:\/\//.test(w.url) || typeof w.secret !== "string" || typeof w.id !== "string" || !Array.isArray(w.events)) return "webhooks";
      l.push({ id: w.id, url: w.url, secret: w.secret, active: w.active !== false, events: (w.events as string[]).filter((e) => (OLAYLAR as readonly string[]).includes(e)) });
    }
    yeni.webhooks = l;
  }
  return yeni;
}

/* ── İşleyici ── */
async function isle(req: NextRequest, yol: string[]) {
  const b: Baglam = { reqId: `req_${rndHex(10)}`, ek: {} };
  const y0 = yol[0], y1 = yol[1], y2 = yol[2];
  const m = req.method;

  if (m === "OPTIONS") return new NextResponse(null, { status: 204, headers: CORS });
  if (y0 === "ping" && m === "GET") return yanit({ ok: true, service: "vayra-api", version: "v1", time: new Date().toISOString() }, 200, b);

  // Dosyalar (CDN gibi; kimlik gerekmez, kimlikler tahmin edilemez)
  if (y0 === "files" && y1 && m === "GET") {
    const dosya = D.dosyalar.get(y1)?.[Number.parseInt(y2 ?? "0", 10) || 0];
    if (!dosya) return hata(b, "resource_not_found");
    if (dosya === "wav") {
      const muzik = uretimKaydi(y1)?.g.type === "music";
      return new NextResponse(Buffer.from(wavOlustur(y1, muzik)), { headers: { ...CORS, "content-type": "audio/wav", "cache-control": "public, max-age=86400" } });
    }
    const v = dosya.indexOf(",");
    const tur = dosya.slice(5, dosya.indexOf(";"));
    return new NextResponse(Buffer.from(dosya.slice(v + 1), "base64"), { headers: { ...CORS, "content-type": tur, "cache-control": "public, max-age=86400" } });
  }

  // ── Modeller
  if (y0 === "models" && m === "GET") {
    const y = await yetkilendir(req, b, "okuma"); if (y instanceof NextResponse) return y;
    if (!y1) {
      const tur = req.nextUrl.searchParams.get("type");
      const liste = MODELLER.filter((x) => !tur || x.tur === API_TUR[tur]).map(modelNesnesi);
      return yanit({ object: "list", data: liste, total: liste.length }, 200, b);
    }
    const model = modelBul(y1);
    return model ? yanit(modelNesnesi(model), 200, b) : hata(b, "model_not_found", { param: "id" });
  }

  // ── Üretimler (+ eski yollar)
  if ((y0 === "generations" && !y1 && m === "POST") || (ESKI_YOL[y0] && y1 && m === "POST")) {
    const y = await yetkilendir(req, b, "uretim"); if (y instanceof NextResponse) return y;
    const govde = await govdeOku(req);
    if (govde === null) return hata(b, "invalid_json");
    if (govde === "bos") return hata(b, "parameter_missing", { mesaj: "İstek gövdesi boş. En az { \"model\", \"input\": { \"prompt\" } } gönder.", param: "model" });
    if (ESKI_YOL[y0]) {
      const { webhook_url, sync, metadata, ...input } = govde;
      return uretimBaslat(req, b, y, { model: y1, input, ...(webhook_url !== undefined ? { webhook_url } : {}), ...(sync !== undefined ? { sync } : {}), ...(metadata !== undefined ? { metadata } : {}) });
    }
    return uretimBaslat(req, b, y, govde);
  }
  if (y0 === "generations" && m === "GET") {
    const y = await yetkilendir(req, b, "okuma"); if (y instanceof NextResponse) return y;
    if (!y1) {
      const sp = req.nextUrl.searchParams;
      const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20) || 20));
      return yanit({ object: "list", ...uretimListele(y.kid, { limit, status: sp.get("status") ?? undefined, once: sp.get("starting_after") ?? undefined, model: sp.get("model") ?? undefined }) }, 200, b);
    }
    const k = uretimKaydi(y1);
    if (!k || k.kid !== y.kid) return hata(b, "resource_not_found", { mesaj: `'${y1}' bulunamadı. Üretimler 24 saat saklanır ve yalnız oluşturan anahtarla görülebilir.`, param: "id" });
    return yanit(k.g, 200, b);
  }
  if (y0 === "generations" && y1 && y2 === "cancel" && m === "POST") {
    const y = await yetkilendir(req, b, "uretim"); if (y instanceof NextResponse) return y;
    const k = uretimKaydi(y1);
    if (!k || k.kid !== y.kid) return hata(b, "resource_not_found", { param: "id" });
    const s = await uretimIptal(y1);
    if (s === "bitti") return hata(b, "not_cancelable", { mesaj: `Üretim '${k.g.status}' durumunda; iptal edilemez.` });
    return yanit(s, 200, b);
  }

  // ── Hesap
  if (y0 === "account" && m === "GET") {
    const y = await yetkilendir(req, b, "okuma"); if (y instanceof NextResponse) return y;
    const kalan = y.ortam === "live" ? hesapKullanilabilir(y.ayar.account) : null;
    return yanit({
      object: "account",
      key: { id: y.kid, name: y.ayar.name || null, environment: y.ortam, scope: y.ayar.scope, expires_at: y.ayar.expires_at ? new Date(y.ayar.expires_at).toISOString() : null },
      credits: { available: y.ortam === "test" ? null : kalan, monthly_limit: y.ayar.monthly_limit, spent_this_month: Math.max(y.ayar.monthly_spent_base, aylikHarcanan(y.kid)) },
      rate_limit: { requests_per_minute: y.ayar.rate_limit },
    }, 200, b);
  }

  // ── Anahtar ayarları
  if (y0 === "keys" && y1 === "self") {
    if (m === "DELETE") {
      const y = await yetkilendir(req, b, "kendi"); if (y instanceof NextResponse) return y;
      D.anahtarlar.set(y.kid, { ...y.ayar, revoked: true, updated_at: Date.now() });
      return yanit({ id: y.kid, object: "key", revoked: true }, 200, b);
    }
    const y = await yetkilendir(req, b, "kendi"); if (y instanceof NextResponse) return y;
    if (m === "PUT") {
      const govde = await govdeOku(req);
      if (govde === null || govde === "bos") return hata(b, "invalid_json");
      const yeni = ayarDogrula(govde, y.ayar);
      if (typeof yeni === "string") return hata(b, "parameter_invalid", { param: yeni, mesaj: `'${yeni}' alanı geçersiz.` });
      D.anahtarlar.set(y.kid, yeni);
      if (yeni.account && typeof govde.balance === "number") {
        hesapGuncelle(yeni.account, govde.balance, Array.isArray(govde.billed) ? (govde.billed as string[]) : [], typeof govde.low_balance_threshold === "number" ? govde.low_balance_threshold : null);
      }
      return yanit({ id: y.kid, object: "key", ...ozelsiz(yeni), generations: uretimListele(y.kid, { limit: 100 }).data, deliveries: teslimListele(y.kid, 100) }, 200, b);
    }
    if (m === "GET") return yanit({ id: y.kid, object: "key", ...ozelsiz(y.ayar) }, 200, b);
  }

  // ── Webhook
  if (y0 === "webhooks" && y1 === "deliveries" && m === "GET") {
    const y = await yetkilendir(req, b, "yonetim"); if (y instanceof NextResponse) return y;
    return yanit({ object: "list", data: teslimListele(y.kid, Math.min(200, Number(req.nextUrl.searchParams.get("limit") ?? 50) || 50)) }, 200, b);
  }
  if (y0 === "webhooks" && y1 === "deliveries" && y2 && yol[3] === "redeliver" && m === "POST") {
    const y = await yetkilendir(req, b, "yonetim"); if (y instanceof NextResponse) return y;
    const t = await teslimYenidenGonder(y.kid, y2);
    if (t === "yok") return hata(b, "resource_not_found", { mesaj: `${y2} kimlikli bir teslim yok.` });
    if (t === "sirsiz") return hata(b, "parameter_invalid", { param: "id", mesaj: "Bu teslimin uç noktası artık yok; imza sırrı bulunamadı." });
    return yanit({ object: "delivery", ...t, payload: undefined }, 200, b);
  }
  if (y0 === "webhooks" && y1 === "test" && m === "POST") {
    const y = await yetkilendir(req, b, "yonetim"); if (y instanceof NextResponse) return y;
    const govde = await govdeOku(req);
    if (govde === null || govde === "bos") return hata(b, "invalid_json");
    const url = govde.url, sir = govde.secret, olay = (govde.event as string) ?? "generation.completed";
    if (typeof url !== "string" || !/^https?:\/\//.test(url)) return hata(b, "parameter_invalid", { param: "url", mesaj: "url http(s):// ile başlamalı." });
    if (typeof sir !== "string") return hata(b, "parameter_missing", { param: "secret" });
    if (!(OLAYLAR as readonly string[]).includes(olay)) return hata(b, "parameter_invalid", { param: "event", mesaj: `event şunlardan biri olmalı: ${OLAYLAR.join(", ")}.` });
    const olayId = `evt_test_${rndHex(8)}`;
    const ornek = olay === "credits.low"
      ? { object: "balance", credits_available: 42, threshold: 100 }
      : { id: `gen_test_${rndHex(6)}`, object: "generation", model: "nano-banana-pro", type: "image", status: olay === "generation.completed" ? "succeeded" : olay === "generation.failed" ? "failed" : olay === "generation.canceled" ? "canceled" : "processing", input: { prompt: "Test olayı" }, output: olay === "generation.completed" ? { urls: [`${kokAdres(req)}/stok/sinematik/cinema1.webp`], content_type: "image/webp" } : null, environment: y.ortam, livemode: false };
    const govdeMetin = JSON.stringify({ id: olayId, object: "event", type: olay, created_at: new Date().toISOString(), data: ornek, test: true });
    const deneme = await tekTeslim(url, sir, olay, govdeMetin, `dlv_test_${rndHex(6)}`);
    return yanit({ object: "delivery_attempt", event: olay, event_id: olayId, payload: JSON.parse(govdeMetin), ...deneme, ok: !!deneme.status && deneme.status < 300 }, 200, b);
  }

  return hata(b, "resource_not_found", { mesaj: `${m} /v1/${yol.join("/")} diye bir uç nokta yok.` });
}

function ozelsiz(a: AnahtarAyar) {
  return { name: a.name, scope: a.scope, rate_limit: a.rate_limit, expires_at: a.expires_at, monthly_limit: a.monthly_limit, revoked: a.revoked, webhooks: a.webhooks.map((w) => ({ id: w.id, url: w.url, events: w.events, active: w.active })) };
}

type P = { params: Promise<{ yol: string[] }> };
const h = async (req: NextRequest, { params }: P) => {
  try { return await isle(req, (await params).yol); } catch (e) {
    return NextResponse.json({ error: { type: "api_error", code: "internal_error", message: `Beklenmeyen hata: ${String(e).slice(0, 200)}` } }, { status: 500, headers: CORS });
  }
};
export { h as GET, h as POST, h as PUT, h as DELETE, h as OPTIONS };
