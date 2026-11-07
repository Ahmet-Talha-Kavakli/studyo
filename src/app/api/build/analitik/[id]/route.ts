import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { projeOku, projeOkuHam } from "@/lib/build/depo";
import { bulunamadi, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { bulutAyarOku } from "@/lib/build/bulutAyar";
import { ekAnalitikOku, hizEkle, olaySay, type HizOrnek } from "@/lib/build/bulutAnalitik";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Çerezsiz ziyaret ölçümü (KVKK dostu): yayındaki sayfa her açıldığında işaret gelir. Tekil ziyaretçi, günlük
 * değişen tuzla (IP + tarayıcı + gün) özetlenir; IP ve kimlik saklanmaz. Gün başına: görüntüleme, ziyaretçi,
 * sayfalar, kaynaklar, kanallar, kampanyalar (utm), cihaz, dil. 120 gün tutulur.
 * POST ?tur=hiz   gerçek kullanıcı hız ölçümü (LCP, CLS, INP)      POST ?tur=olay  özel olay (vayra.olay)
 * POST ?tur=nabiz şu an sitede olanlar için (5 dakika)               GET ?gun=7..120  sahip özeti
 */
type Gun = { g: number; z: number; s: Record<string, number>; k: Record<string, number>; c: Record<string, number>; d: Record<string, number>; h: string[]; ch?: Record<string, number>; u?: Record<string, number> };
type Kayit = { gunler: Record<string, Gun> };
const dosya = (id: string) => path.join(DEPO_KOK, "build", "analitik", `${id}.json`);
const oku = async (id: string): Promise<Kayit> => { try { return JSON.parse(await readFile(dosya(id), "utf8")); } catch { return { gunler: {} }; } };
const kuyruk = new Map<string, Promise<unknown>>();
const arttir = (o: Record<string, number>, a: string, sinir = 300) => { if (a in o || Object.keys(o).length < sinir) o[a] = (o[a] ?? 0) + 1; };
const CORS = { "Access-Control-Allow-Origin": "*" };
/** Şu an sitede olanlar: proje başına ziyaretçi özeti, son görülme (bellekte; geliştirmede yeniden yüklemeye dayanıklı). */
const anlik: Map<string, Map<string, number>> = ((globalThis as unknown as { __vayraAnlik?: Map<string, Map<string, number>> }).__vayraAnlik ??= new Map());

const ARAMA = /(^|\.)(google|bing|yandex|duckduckgo|yahoo|ecosia|baidu|naver|seznam|qwant|brave)\./i;
const SOSYAL = /(^|\.)(facebook|fb|instagram|t\.co|twitter|x\.com|linkedin|lnkd|tiktok|youtube|youtu\.be|pinterest|reddit|whatsapp|telegram|t\.me|threads|bsky)/i;
const YAPAY_ZEKA = /(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google|copilot\.microsoft|you\.com|phind\.com)/i;
function kanal(ref: string, utm: { kaynak?: string; ortam?: string }): string {
  const o = (utm.ortam ?? "").toLowerCase();
  if (/^(cpc|ppc|paid|ads?|reklam|display|banner)/.test(o)) return "Ücretli";
  if (/^(e-?mail|e-?posta|newsletter|bulten)/.test(o) || /mail\./i.test(ref)) return "E-posta";
  if (/^(social|sosyal)/.test(o)) return "Sosyal";
  if (!ref || ref === "Doğrudan") return utm.kaynak ? "Kampanya" : "Doğrudan";
  if (YAPAY_ZEKA.test(ref)) return "Yapay zekâ";
  if (ARAMA.test(ref)) return "Arama";
  if (SOSYAL.test(ref)) return "Sosyal";
  return "Yönlendirme";
}
const sayiMi = (x: unknown, en: number) => (typeof x === "number" && Number.isFinite(x) && x >= 0 && x < en ? x : null);

export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).id;
  const p = await projeOkuHam(id);
  if (!p?.yayin) return new Response(null, { status: 204, headers: CORS });
  let g: { sayfa?: string; ref?: string; dil?: string; en?: number; utm?: { kaynak?: string; ortam?: string; kampanya?: string }; ad?: string; veri?: Record<string, unknown>; lcp?: number; cls?: number; inp?: number } = {};
  try { g = JSON.parse((await req.text()).slice(0, 8000)); } catch { /* boş */ }
  const ua = req.headers.get("user-agent") ?? "";
  if (/bot|crawl|spider|preview|headless/i.test(ua)) return new Response(null, { status: 204, headers: CORS });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
  const gun = new Date().toISOString().slice(0, 10);
  const iz = createHash("sha256").update(`${gun}|${ip}|${ua}|${id}`).digest("base64url").slice(0, 12);
  const a = (anlik.get(id) ?? new Map<string, number>()); a.set(iz, Date.now()); anlik.set(id, a);
  if (a.size > 5000) for (const [k, z] of a) if (Date.now() - z > 300_000) a.delete(k);
  const tur = new URL(req.url).searchParams.get("tur");
  const sayfa = String(g.sayfa || "index.html").slice(0, 120);
  const en = Number(g.en) || 0;
  if (tur === "nabiz") return new Response(null, { status: 204, headers: CORS });
  if (tur === "olay") { if (g.ad) olaySay(id, String(g.ad), g.veri && typeof g.veri === "object" ? g.veri : {}); return new Response(null, { status: 204, headers: CORS }); }
  if (tur === "hiz") {
    const o: HizOrnek = [sayiMi(g.lcp, 60_000), sayiMi(g.cls, 10), sayiMi(g.inp, 30_000), en && en < 768 ? 1 : 0];
    if (o[0] !== null || o[1] !== null || o[2] !== null) hizEkle(id, sayfa, o);
    return new Response(null, { status: 204, headers: CORS });
  }
  const cihaz = en && en < 640 ? "Telefon" : en && en < 1024 ? "Tablet" : "Masaüstü";
  const onceki = kuyruk.get(id) ?? Promise.resolve();
  const is = onceki.then(async () => {
    const v = await oku(id);
    const x = (v.gunler[gun] ??= { g: 0, z: 0, s: {}, k: {}, c: {}, d: {}, h: [] });
    x.g++;
    if (!x.h.includes(iz)) { x.h.push(iz); x.z++; if (x.h.length > 50_000) x.h = x.h.slice(-50_000); }
    arttir(x.s, sayfa);
    const ref0 = String(g.ref || "").slice(0, 80);
    const ref = ref0 && !ref0.includes("localhost") ? ref0.replace(/^www\./, "") : "Doğrudan";
    arttir(x.k, ref);
    const utm = { kaynak: g.utm?.kaynak ? String(g.utm.kaynak).slice(0, 60) : undefined, ortam: g.utm?.ortam ? String(g.utm.ortam).slice(0, 40) : undefined, kampanya: g.utm?.kampanya ? String(g.utm.kampanya).slice(0, 60) : undefined };
    arttir((x.ch ??= {}), kanal(ref, utm), 20);
    if (utm.kaynak || utm.kampanya) arttir((x.u ??= {}), [utm.kaynak, utm.ortam, utm.kampanya].filter(Boolean).join(" / "), 200);
    arttir(x.c, cihaz, 5);
    arttir(x.d, String(g.dil || "?").slice(0, 2).toLowerCase(), 60);
    for (const k of Object.keys(v.gunler).sort().slice(0, -120)) delete v.gunler[k];
    await mkdir(path.dirname(dosya(id)), { recursive: true });
    await writeFile(dosya(id), JSON.stringify(v));
  });
  kuyruk.set(id, is.catch(() => {}));
  await is.catch(() => {});
  return new Response(null, { status: 204, headers: CORS });
}

const yuzdelik75 = (l: number[]) => { if (!l.length) return null; const s = [...l].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil(0.75 * s.length) - 1)]; };

/** Sahip için özet: ?gun=1..120 (önceki dönemle karşılaştırma, kanallar, kampanyalar, 404, olaylar, hız, şu an). */
export async function GET(req: Request, { params }: Ctx) {
  // Yayındaki sitenin ölçüm betiği için herkese açık ayar (GA4 ve Meta Pixel kimlikleri zaten sayfada görünür).
  if (new URL(req.url).searchParams.has("izleme")) {
    const p = await projeOkuHam((await params).id);
    if (!p?.yayin) return Response.json({ ga4: "", metaPixel: "", onaysiz: false }, { headers: { ...CORS, "Cache-Control": "no-store" } });
    const z = (await bulutAyarOku(p.id)).izleme;
    return Response.json(z, { headers: { ...CORS, "Cache-Control": "public, max-age=60" } });
  }
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  const n = Math.min(120, Math.max(1, Number(new URL(req.url).searchParams.get("gun")) || 30));
  const v = await oku(id);
  const tarih = (i: number) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
  const gunler: { tarih: string; goruntuleme: number; ziyaretci: number }[] = [];
  const top = (k: "s" | "k" | "c" | "d" | "ch" | "u", s = 10) => {
    const o: Record<string, number> = {};
    for (let i = 0; i < n; i++) for (const [a, b] of Object.entries(v.gunler[tarih(i)]?.[k] ?? {})) o[a] = (o[a] ?? 0) + b;
    return Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, s).map(([ad, adet]) => ({ ad, adet }));
  };
  for (let i = n - 1; i >= 0; i--) { const x = v.gunler[tarih(i)]; gunler.push({ tarih: tarih(i), goruntuleme: x?.g ?? 0, ziyaretci: x?.z ?? 0 }); }
  let og = 0, oz = 0, onceVeri = false;
  for (let i = n; i < 2 * n; i++) { const x = v.gunler[tarih(i)]; if (x) { onceVeri = true; og += x.g; oz += x.z; } }
  const bugun = v.gunler[tarih(0)];
  // Ek analitik (Türkiye günü): 404, olaylar, hız.
  const ek = await ekAnalitikOku(id, n);
  const b404: Record<string, number> = {};
  const olay: Record<string, { adet: number; ozellik: Record<string, Record<string, number>> }> = {};
  const hiz: Record<string, HizOrnek[]> = {};
  for (const x of ek) {
    for (const [a, b] of Object.entries(x.b)) b404[a] = (b404[a] ?? 0) + b;
    for (const [a, o] of Object.entries(x.o)) { const t = (olay[a] ??= { adet: 0, ozellik: {} }); t.adet += o.adet; for (const [k, d] of Object.entries(o.ozellik)) { const tk = (t.ozellik[k] ??= {}); for (const [dd, s] of Object.entries(d)) tk[dd] = (tk[dd] ?? 0) + s; } }
    for (const [a, l] of Object.entries(x.h)) (hiz[a] ??= []).push(...l);
  }
  const hizOzet = (l: HizOrnek[]) => ({ lcp: yuzdelik75(l.map((x) => x[0]).filter((x): x is number => x !== null)), cls: yuzdelik75(l.map((x) => x[1]).filter((x): x is number => x !== null)), inp: yuzdelik75(l.map((x) => x[2]).filter((x): x is number => x !== null)), ornek: l.length });
  const tumHiz = Object.values(hiz).flat();
  const a = anlik.get(id);
  return Response.json({
    ok: true, gunler,
    toplam: { goruntuleme: gunler.reduce((t, x) => t + x.goruntuleme, 0), ziyaretci: gunler.reduce((t, x) => t + x.ziyaretci, 0), bugun: bugun?.z ?? 0 },
    onceki: onceVeri ? { goruntuleme: og, ziyaretci: oz } : null,
    anlik: a ? [...a.values()].filter((z) => Date.now() - z < 300_000).length : 0,
    sayfalar: top("s"), kaynaklar: top("k"), cihazlar: top("c"), diller: top("d"), kanallar: top("ch"), kampanyalar: top("u"),
    bulunamayan: Object.entries(b404).sort((x, y) => y[1] - x[1]).slice(0, 10).map(([ad, adet]) => ({ ad, adet })),
    olaylar: Object.entries(olay).sort((x, y) => y[1].adet - x[1].adet).slice(0, 30).map(([ad, o]) => ({ ad, adet: o.adet, ozellikler: Object.entries(o.ozellik).map(([k, d]) => ({ ad: k, degerler: Object.entries(d).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([dd, s]) => ({ ad: dd, adet: s })) })) })),
    hiz: { genel: hizOzet(tumHiz), mobil: hizOzet(tumHiz.filter((x) => x[3] === 1)), masaustu: hizOzet(tumHiz.filter((x) => x[3] === 0)), sayfalar: Object.entries(hiz).map(([ad, l]) => ({ ad, ...hizOzet(l) })).sort((x, y) => y.ornek - x.ornek).slice(0, 10) },
  });
}

export function OPTIONS() { return new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } }); }
