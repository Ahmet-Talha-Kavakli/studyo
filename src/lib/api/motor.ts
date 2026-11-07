/**
 * Vayra API motoru (yalnız sunucu).
 *
 * Bellek içi durum: üretimler, anahtar ayarları, hesap bakiyeleri, webhook
 * teslimleri, idempotency kayıtları ve hız limiti pencereleri. Veritabanı
 * olmadığı için durum `globalThis` üzerinde tutulur (dev'de HMR'ı atlatır);
 * sunucu yeniden başlarsa panel ilk açılışta anahtar ayarlarını yeniden yükler
 * (PUT /v1/keys/self). Üretim kayıtları 24 saat saklanır.
 *
 * Üretim: canlı anahtarda gerçek sağlayıcı (lib/saglayicilar) anahtarı varsa
 * gerçek çıktı, yoksa `simulated: true` işaretli örnek çıktı. Test anahtarı her
 * zaman simülasyon ve 0 kredi.
 *
 * Kredi: canlı üretimin bedeli anahtarın sahibi olan hesabın sunucu defterinden, üretim
 * başlamadan kesilir (rota, lib/hesap/krediKapi). Üretim başarısız olur, iptal edilir ya da
 * örnek çıktıyla biterse kesinti burada iade edilir ve `credits` 0 olur.
 */

import { readdirSync } from "fs";
import { join } from "path";
import { MODELLER, type AIModel, type ModelTur } from "@/lib/catalog";
import { uretimYonlendir } from "@/lib/saglayicilar";
import { SESLER } from "@/lib/sesVeri";
import { hmacHex } from "@/lib/apiAnahtarDogrula";
import { TUR_API } from "./sema";
import type { KrediIslemi, SahteSaglayici } from "@/lib/hesap/krediKapi";

export type Ortam = "live" | "test";
export type UretimDurumu = "queued" | "processing" | "succeeded" | "failed" | "canceled";
export type Kapsam = "full" | "generate" | "read";

export const OLAYLAR = ["generation.started", "generation.completed", "generation.failed", "generation.canceled", "credits.low"] as const;
export type Olay = (typeof OLAYLAR)[number];

export interface Uretim {
  id: string;
  object: "generation";
  model: string;
  type: string;
  status: UretimDurumu;
  input: Record<string, unknown>;
  output: { urls: string[]; content_type: string } | null;
  error: { code: string; message: string } | null;
  credits: number;
  environment: Ortam;
  simulated: boolean;
  provider: string | null;
  metadata: Record<string, unknown>;
  webhook_url: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  metrics: { queue_ms: number | null; run_ms: number | null };
  urls: { get: string; cancel: string };
}

interface UretimKaydi { g: Uretim; kid: string; hesap: string | null; iptal: boolean; zaman: number; fatura?: KrediIslemi | null; sahte?: SahteSaglayici }

export interface WebhookUc { id: string; url: string; events: string[]; secret: string; active: boolean }

export interface AnahtarAyar {
  name: string;
  scope: Kapsam;
  rate_limit: number;
  expires_at: number | null;
  monthly_limit: number | null;
  monthly_spent_base: number;
  webhooks: WebhookUc[];
  revoked: boolean;
  account: string | null;
  updated_at: number;
}

export interface TeslimDenemesi { at: string; status: number | null; duration_ms: number; error: string | null; response: string | null }
export interface Teslim {
  id: string;
  event: string;
  event_id: string;
  url: string;
  endpoint_id: string | null;
  generation_id: string | null;
  state: "pending" | "succeeded" | "failed";
  attempts: TeslimDenemesi[];
  created_at: string;
  payload: string;
}

interface Hesap { bakiye: number; bekleyen: Map<string, number>; dusukEsik: number | null; dusukUyarildi: boolean }

interface Durum {
  uretimler: Map<string, UretimKaydi>;
  anahtarlar: Map<string, AnahtarAyar>;
  hesaplar: Map<string, Hesap>;
  teslimler: Map<string, Teslim[]>;
  idem: Map<string, { ozet: string; id: string; zaman: number }>;
  rl: Map<string, number[]>;
  dosyalar: Map<string, string[]>;
}

const g = globalThis as unknown as { __vayraApi?: Durum };
export const D: Durum = (g.__vayraApi ??= {
  uretimler: new Map(), anahtarlar: new Map(), hesaplar: new Map(), teslimler: new Map(), idem: new Map(), rl: new Map(), dosyalar: new Map(),
});

const SAKLAMA_MS = 24 * 3600_000;

export function rndHex(bayt: number) {
  const b = new Uint8Array(bayt);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ── Anahtar kimliği ve sırlar (panel de aynısını hesaplar) ── */
export async function anahtarKimligi(govde: string) { return `key_${(await hmacHex(`kid:${govde}`)).slice(0, 16)}`; }
export async function istekSirri(govde: string) { return `whsec_${(await hmacHex(`wh:${govde}`)).slice(0, 40)}`; }

export function varsayilanAyar(ortam: Ortam): AnahtarAyar {
  return { name: "", scope: "full", rate_limit: ortam === "live" ? 60 : 20, expires_at: null, monthly_limit: null, monthly_spent_base: 0, webhooks: [], revoked: false, account: null, updated_at: 0 };
}
export const ayarGetir = (kid: string, ortam: Ortam) => D.anahtarlar.get(kid) ?? varsayilanAyar(ortam);

/* ── Hız limiti (kayan pencere, dakika) ── */
export function hizKontrol(kid: string, limit: number) {
  const simdi = Date.now();
  const z = (D.rl.get(kid) ?? []).filter((t) => simdi - t < 60_000);
  const izin = z.length < limit;
  if (izin) z.push(simdi);
  D.rl.set(kid, z);
  const sifirlanma = Math.ceil(((z[0] ?? simdi) + 60_000) / 1000);
  return { izin, kalan: Math.max(0, limit - z.length), sifirlanma, bekle: Math.max(1, sifirlanma - Math.floor(simdi / 1000)) };
}

/* ── Temizlik ── */
function temizle() {
  const esik = Date.now() - SAKLAMA_MS;
  for (const [id, k] of D.uretimler) if (k.zaman < esik) { D.uretimler.delete(id); D.dosyalar.delete(id); }
  for (const [k, v] of D.idem) if (v.zaman < esik) D.idem.delete(k);
}

/* ── Hesap / kredi ── */
export function hesapKullanilabilir(hesap: string | null): number | null {
  if (!hesap) return null;
  const h = D.hesaplar.get(hesap);
  if (!h) return null;
  let bekleyen = 0;
  for (const v of h.bekleyen.values()) bekleyen += v;
  return h.bakiye - bekleyen;
}
export function hesapGuncelle(hesap: string, bakiye: number, faturalanan: string[], dusukEsik: number | null) {
  const h = D.hesaplar.get(hesap) ?? { bakiye, bekleyen: new Map(), dusukEsik, dusukUyarildi: false };
  h.bakiye = bakiye;
  h.dusukEsik = dusukEsik;
  for (const id of faturalanan) h.bekleyen.delete(id);
  if (dusukEsik === null || bakiye > dusukEsik) h.dusukUyarildi = false;
  D.hesaplar.set(hesap, h);
}
export function aylikHarcanan(kid: string): number {
  const ay = new Date(); ay.setUTCDate(1); ay.setUTCHours(0, 0, 0, 0);
  let t = 0;
  for (const k of D.uretimler.values()) if (k.kid === kid && k.g.environment === "live" && k.zaman >= ay.getTime() && k.g.status !== "failed" && k.g.status !== "canceled") t += k.g.credits;
  return t;
}

/* ── Örnek çıktılar (simülasyon) ── */
let videoListesi: string[] | null = null;
function videolar() {
  if (!videoListesi) {
    try { videoListesi = readdirSync(join(process.cwd(), "public/gercek/video-hareket")).filter((f) => f.endsWith(".mp4")); } catch { videoListesi = ["dolly-in.mp4"]; }
  }
  return videoListesi;
}
function gorselKategori(istem: string) {
  const s = istem.toLocaleLowerCase("tr");
  if (/portre|yüz|kadın|erkek|model|karakter|kız|adam|insan|portrait|woman|man|face/.test(s)) return ["portre", "portrait"];
  if (/ürün|şişe|parfüm|ayakkabı|çanta|saat|kutu|ambalaj|product|bottle/.test(s)) return ["urun", "product"];
  if (/soyut|desen|gradyan|abstract|doku/.test(s)) return ["soyut", "abstract"];
  if (/3d|render|izometrik|oyuncak|clay/.test(s)) return ["3d", "render"];
  if (/dağ|deniz|orman|göl|manzara|gün doğumu|gün batımı|kapadokya|doğa|landscape|mountain|sea/.test(s)) return ["manzara", "scene"];
  return ["sinematik", "cinema"];
}
function simCikti(gen: Uretim, origin: string): { urls: string[]; content_type: string } {
  const istem = String(gen.input.prompt ?? "");
  const tohum = `${istem}|${gen.input.seed ?? gen.id}`;
  const tur = gen.type;
  if (tur === "image") {
    const [kl, on] = gorselKategori(istem);
    const n = Math.max(1, Number(gen.input.num_images ?? 1));
    return { content_type: "image/webp", urls: Array.from({ length: n }, (_, i) => `${origin}/stok/${kl}/${on}${(hash(tohum + i) % 12) + 1}.webp`) };
  }
  if (tur === "video") { const v = videolar(); return { content_type: "video/mp4", urls: [`${origin}/gercek/video-hareket/${v[hash(tohum) % v.length]}`] }; }
  if (tur === "3d") { const m = ["kask", "lamba", "robot", "savasci"]; return { content_type: "model/gltf-binary", urls: [`${origin}/gercek/3d/${m[hash(tohum) % m.length]}.glb`] }; }
  D.dosyalar.set(gen.id, ["wav"]);
  return { content_type: "audio/wav", urls: [`${origin}/api/v1/files/${gen.id}/0.wav`] };
}

/** Çalışma süresi (simülasyon) — türüne göre gerçekçi. */
function simSure(tur: string, ortam: Ortam) {
  if (ortam === "test") return 250 + Math.random() * 400;
  return ({ image: 2200, video: 9000, audio: 1600, music: 6500, "3d": 8000 } as Record<string, number>)[tur] * (0.8 + Math.random() * 0.4);
}

/* ── Üretim ── */
export function genelUretim(id: string) { const k = D.uretimler.get(id); return k?.g; }
export function uretimKaydi(id: string) { return D.uretimler.get(id); }

export function uretimOlustur(a: { kid: string; ortam: Ortam; model: AIModel; input: Record<string, unknown>; webhook_url: string | null; metadata: Record<string, unknown>; origin: string; hesap: string | null; fatura?: KrediIslemi | null; sahte?: SahteSaglayici }): Uretim {
  temizle();
  const id = `gen_${rndHex(12)}`;
  // Sunucu defterinden kesilen tutar (kesinti yoksa, örneğin sağlayıcı bağlı değilse, 0).
  const kredi = a.ortam === "test" ? 0 : a.fatura?.tutar ?? 0;
  const base = `${a.origin}/api/v1/generations/${id}`;
  const gen: Uretim = {
    id, object: "generation", model: a.model.id, type: TUR_API[a.model.tur], status: "queued", input: a.input, output: null, error: null,
    credits: kredi, environment: a.ortam, simulated: true, provider: null, metadata: a.metadata, webhook_url: a.webhook_url,
    created_at: new Date().toISOString(), started_at: null, completed_at: null, metrics: { queue_ms: null, run_ms: null },
    urls: { get: base, cancel: `${base}/cancel` },
  };
  D.uretimler.set(id, { g: gen, kid: a.kid, hesap: a.hesap, iptal: false, zaman: Date.now(), fatura: a.fatura ?? null, sahte: a.sahte ?? null });
  if (a.hesap && kredi > 0) D.hesaplar.get(a.hesap)?.bekleyen.set(id, kredi);
  void calistir(id, a.model.tur, a.origin);
  return gen;
}

function guncelle(id: string, p: Partial<Uretim>) {
  const k = D.uretimler.get(id);
  if (k) k.g = { ...k.g, ...p };
  return k;
}
function iade(k: UretimKaydi, neden = "API üretimi tamamlanmadı: kredi iade edildi") {
  if (k.hesap) D.hesaplar.get(k.hesap)?.bekleyen.delete(k.g.id);
  k.g = { ...k.g, credits: 0 };
  return k.fatura?.iade(neden).catch(() => undefined);
}

/** voice_id: hazır sesin adı (büyük/küçük harf fark etmez) ya da doğrudan sağlayıcı ses kimliği. */
function sesAlanlari(input: Record<string, unknown>) {
  const v = typeof input.voice_id === "string" ? input.voice_id.trim() : "";
  const hazir = v ? SESLER.find((s) => s.ad.toLocaleLowerCase("tr") === v.toLocaleLowerCase("tr") || s.sesId === v) : undefined;
  return {
    ...(hazir ? { ses: hazir.ad } : /^[A-Za-z0-9]{16,32}$/.test(v) ? { sesId: v, ses: "Özel ses" } : {}),
    ...(typeof input.language === "string" ? { dil: input.language } : {}),
    ...(typeof input.stability === "number" ? { kararlilik: input.stability } : {}),
  };
}

async function calistir(id: string, tur: ModelTur, origin: string) {
  const k0 = D.uretimler.get(id);
  if (!k0) return;
  const t0 = Date.now();
  await bekle(k0.g.environment === "test" ? 120 : 300 + Math.random() * 500);
  if (D.uretimler.get(id)?.iptal) return;
  const baslangic = Date.now();
  const k1 = guncelle(id, { status: "processing", started_at: new Date().toISOString(), metrics: { queue_ms: baslangic - t0, run_ms: null } });
  if (k1) void olayYay(k1.kid, "generation.started", k1.g);

  let cikti: Uretim["output"] = null;
  let saglayici: string | null = "simulation";
  let simule = true;
  let hata: Uretim["error"] = null;
  try {
    if (k0.sahte === "hata") throw new Error("Sınama: sağlayıcı hata verdi.");
    if (k0.sahte === "gercek") { simule = false; saglayici = "sinama"; cikti = simCikti(k0.g, origin); }
    else if (k0.g.environment === "live" && tur !== "muzik") {
      const input = k0.g.input;
      const sonuc = await uretimYonlendir({
        tur: tur as "gorsel" | "video" | "ses" | "3d",
        model: k0.g.model,
        prompt: String(input.prompt ?? ""),
        meta: { oran: input.aspect_ratio as string | undefined, cozunurluk: input.resolution as string | undefined, sure: input.duration ? `${input.duration}sn` : undefined, gorselUrl: input.image_url as string | undefined, ...sesAlanlari(input) },
      });
      if (sonuc.gercek && (sonuc.ciktiUrl || sonuc.dataUri)) {
        simule = false;
        saglayici = sonuc.saglayici;
        if (sonuc.ciktiUrl) cikti = { urls: [sonuc.ciktiUrl], content_type: icerikTuru(tur, sonuc.ciktiUrl) };
        else {
          D.dosyalar.set(id, [sonuc.dataUri!]);
          cikti = { urls: [`${origin}/api/v1/files/${id}/0`], content_type: sonuc.dataUri!.slice(5, sonuc.dataUri!.indexOf(";")) };
        }
      }
    }
    if (simule) {
      const kalan = simSure(k0.g.type, k0.g.environment) - (Date.now() - baslangic);
      if (kalan > 0) await bekle(kalan);
      cikti = simCikti(k0.g, origin);
    }
  } catch (e) {
    hata = { code: "provider_error", message: `Sağlayıcı hatası: ${String(e).slice(0, 200)}` };
  }

  const k = D.uretimler.get(id);
  if (!k || k.iptal) return;
  const bitis = new Date().toISOString();
  if (hata) {
    await iade(k, "API üretimi başarısız: kredi iade edildi");
    guncelle(id, { status: "failed", error: hata, completed_at: bitis, provider: saglayici, metrics: { queue_ms: k.g.metrics.queue_ms, run_ms: Date.now() - baslangic } });
    await olayYay(k.kid, "generation.failed", k.g);
    return;
  }
  // Örnek çıktı gerçek üretim değildir: kesinti varsa geri verilir.
  if (simule && k.g.credits > 0) await iade(k, "API örnek çıktı döndü: kredi alınmadı");
  guncelle(id, { status: "succeeded", output: cikti, simulated: simule, provider: saglayici, completed_at: bitis, metrics: { queue_ms: k.g.metrics.queue_ms, run_ms: Date.now() - baslangic } });
  await olayYay(k.kid, "generation.completed", k.g);
  if (k.hesap) {
    const h = D.hesaplar.get(k.hesap);
    const kalan = k.fatura?.bakiye ?? hesapKullanilabilir(k.hesap);
    if (h && h.dusukEsik !== null && kalan !== null && kalan <= h.dusukEsik && !h.dusukUyarildi) {
      h.dusukUyarildi = true;
      await olayYay(k.kid, "credits.low", { object: "balance", credits_available: kalan, threshold: h.dusukEsik });
    }
  }
}

function icerikTuru(tur: ModelTur, url: string) {
  const u = url.split("?")[0].toLowerCase();
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".jpg") || u.endsWith(".jpeg")) return "image/jpeg";
  if (u.endsWith(".mp4")) return "video/mp4";
  if (u.endsWith(".mp3")) return "audio/mpeg";
  if (u.endsWith(".glb")) return "model/gltf-binary";
  return { gorsel: "image/webp", video: "video/mp4", ses: "audio/mpeg", muzik: "audio/mpeg", "3d": "model/gltf-binary" }[tur];
}

export async function uretimIptal(id: string): Promise<Uretim | "bitti" | undefined> {
  const k = D.uretimler.get(id);
  if (!k) return undefined;
  if (k.g.status !== "queued" && k.g.status !== "processing") return "bitti";
  k.iptal = true;
  await iade(k, "API üretimi iptal edildi: kredi iade edildi");
  guncelle(id, { status: "canceled", completed_at: new Date().toISOString() });
  await olayYay(k.kid, "generation.canceled", k.g);
  return k.g;
}

export function uretimListele(kid: string, o: { limit: number; status?: string; once?: string; model?: string }) {
  temizle();
  let l = Array.from(D.uretimler.values()).filter((k) => k.kid === kid).map((k) => k.g);
  l.sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (o.status) l = l.filter((x) => x.status === o.status);
  if (o.model) l = l.filter((x) => x.model === o.model);
  if (o.once) { const i = l.findIndex((x) => x.id === o.once); if (i >= 0) l = l.slice(i + 1); }
  const sayfa = l.slice(0, o.limit);
  return { data: sayfa, has_more: l.length > o.limit, next_cursor: l.length > o.limit ? sayfa[sayfa.length - 1].id : null };
}

/* ── Webhook ── */
async function imzala(sir: string, govde: string) {
  const t = Math.floor(Date.now() / 1000);
  return `t=${t},v1=${await hmacHex(`${t}.${govde}`, sir)}`;
}

export async function tekTeslim(url: string, sir: string, olay: string, govde: string, teslimId: string): Promise<TeslimDenemesi> {
  const bas = Date.now();
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "Vayra-Webhooks/1.0", "vayra-event": olay, "vayra-delivery": teslimId, "vayra-signature": await imzala(sir, govde) },
      body: govde,
      signal: AbortSignal.timeout(10_000),
      redirect: "manual",
    });
    const metin = (await r.text().catch(() => "")).slice(0, 500);
    return { at: new Date(bas).toISOString(), status: r.status, duration_ms: Date.now() - bas, error: r.ok ? null : `HTTP ${r.status}`, response: metin || null };
  } catch (e) {
    const m = String((e as Error)?.message ?? e);
    return { at: new Date(bas).toISOString(), status: null, duration_ms: Date.now() - bas, error: /timeout|abort/i.test(m) ? "Zaman aşımı (10 sn)" : `Bağlantı kurulamadı: ${m.slice(0, 120)}`, response: null };
  }
}

function teslimKaydet(kid: string, t: Teslim) {
  const l = D.teslimler.get(kid) ?? [];
  l.unshift(t);
  D.teslimler.set(kid, l.slice(0, 200));
}

const GERI_CEKILME = [0, 2000, 8000];

async function teslimEt(kid: string, hedef: { url: string; sir: string; endpoint_id: string | null }, olay: string, olayId: string, govde: string, genId: string | null) {
  const t: Teslim = { id: `dlv_${rndHex(8)}`, event: olay, event_id: olayId, url: hedef.url, endpoint_id: hedef.endpoint_id, generation_id: genId, state: "pending", attempts: [], created_at: new Date().toISOString(), payload: govde };
  teslimKaydet(kid, t);
  for (const ms of GERI_CEKILME) {
    if (ms) await bekle(ms);
    const d = await tekTeslim(hedef.url, hedef.sir, olay, govde, t.id);
    t.attempts.push(d);
    if (d.status && d.status >= 200 && d.status < 300) { t.state = "succeeded"; return; }
  }
  t.state = "failed";
}

export async function olayYay(kid: string, olay: Olay, nesne: unknown) {
  const ayar = D.anahtarlar.get(kid);
  const olayId = `evt_${rndHex(10)}`;
  const govde = JSON.stringify({ id: olayId, object: "event", type: olay, created_at: new Date().toISOString(), data: nesne });
  const genId = (nesne as Uretim)?.object === "generation" ? (nesne as Uretim).id : null;
  const hedefler: { url: string; sir: string; endpoint_id: string | null }[] = [];
  for (const w of ayar?.webhooks ?? []) if (w.active && w.events.includes(olay)) hedefler.push({ url: w.url, sir: w.secret, endpoint_id: w.id });
  const istekUrl = (nesne as Uretim)?.webhook_url;
  if (istekUrl && olay !== "generation.started" && olay !== "credits.low") {
    const k = genId ? D.uretimler.get(genId) : undefined;
    const govdeHam = k ? await anahtarGovdesiIcinSir(k.kid) : null;
    if (govdeHam) hedefler.push({ url: istekUrl, sir: govdeHam, endpoint_id: null });
  }
  await Promise.all(hedefler.map((h) => teslimEt(kid, h, olay, olayId, govde, genId)));
}

/* İstek bazlı webhook sırrı anahtar gövdesinden türetilir; kid → sır eşlemesi
   kimlik doğrulama sırasında kaydedilir (anahtarın kendisi saklanmaz). */
const gs = globalThis as unknown as { __vayraSir?: Map<string, string> };
const sirHaritasi = (gs.__vayraSir ??= new Map<string, string>());
export function istekSirriKaydet(kid: string, sir: string) { sirHaritasi.set(kid, sir); }
async function anahtarGovdesiIcinSir(kid: string) { return sirHaritasi.get(kid) ?? null; }

export function teslimListele(kid: string, limit = 50) { return (D.teslimler.get(kid) ?? []).slice(0, limit); }

/** Kayıtlı bir teslimi aynı gövde ve olay kimliğiyle yeniden gönderir; deneme kayda eklenir. */
export async function teslimYenidenGonder(kid: string, teslimId: string): Promise<Teslim | "yok" | "sirsiz"> {
  const t = (D.teslimler.get(kid) ?? []).find((x) => x.id === teslimId);
  if (!t) return "yok";
  const sir = t.endpoint_id ? D.anahtarlar.get(kid)?.webhooks.find((w) => w.id === t.endpoint_id)?.secret : await anahtarGovdesiIcinSir(kid);
  if (!sir) return "sirsiz";
  const d = await tekTeslim(t.url, sir, t.event, t.payload, t.id);
  t.attempts.push(d);
  t.state = d.status && d.status >= 200 && d.status < 300 ? "succeeded" : "failed";
  return t;
}

/* ── Idempotency ── */
export function idemBak(kid: string, anahtar: string, ozet: string): { durum: "yeni" } | { durum: "tekrar"; id: string } | { durum: "cakisma" } {
  const k = D.idem.get(`${kid}:${anahtar}`);
  if (!k) return { durum: "yeni" };
  return k.ozet === ozet ? { durum: "tekrar", id: k.id } : { durum: "cakisma" };
}
export function idemKaydet(kid: string, anahtar: string, ozet: string, id: string) { D.idem.set(`${kid}:${anahtar}`, { ozet, id, zaman: Date.now() }); }

/* ── Simülasyon ses dosyası (WAV) ── */
export function wavOlustur(tohum: string, muzik: boolean): Uint8Array {
  const hz = 22050, sn = muzik ? 12 : 4, n = hz * sn;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const yaz = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  yaz(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); yaz(8, "WAVE"); yaz(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, hz, true); v.setUint32(28, hz * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  yaz(36, "data"); v.setUint32(40, n * 2, true);
  let r = hash(tohum) || 1;
  const rnd = () => ((r = Math.imul(r ^ (r >>> 15), 2246822507) ^ Math.imul(r ^ (r >>> 13), 3266489909)) >>> 0) / 4294967296;
  const olcek = [0, 2, 4, 7, 9, 12, 14, 16];
  const kok = 220 * Math.pow(2, Math.floor(rnd() * 5) / 12);
  const notaSn = muzik ? 0.25 : 0.4;
  const notalar = Array.from({ length: Math.ceil(sn / notaSn) }, () => kok * Math.pow(2, olcek[Math.floor(rnd() * olcek.length)] / 12));
  for (let i = 0; i < n; i++) {
    const t = i / hz;
    const ni = Math.floor(t / notaSn), nt = t - ni * notaSn;
    const zarf = Math.min(1, nt * 40) * Math.exp(-nt * (muzik ? 6 : 4));
    const f = notalar[ni] ?? kok;
    let s = Math.sin(2 * Math.PI * f * t) * 0.5 + Math.sin(4 * Math.PI * f * t) * 0.12;
    if (muzik) s += Math.sin(2 * Math.PI * (kok / 2) * t) * 0.18 * (1 - ((t % 2) / 2));
    const genel = Math.min(1, t * 4, (sn - t) * 2);
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s * zarf * genel * 0.7)) * 32767, true);
  }
  return new Uint8Array(buf);
}

export const modelBul = (id: string) => MODELLER.find((m) => m.id === id);
