import { projeOku } from "@/lib/build/depo";
import { gunlukOku, gunlukYaz, kovaBoyu, seviyeBul, type Gunluk } from "@/lib/build/gunluk";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { fonksiyonAyrintisi, fonksiyonCalistir } from "@/lib/build/fonksiyon";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const ZAMAN: Record<string, number> = { "1s": 3600_000, "24s": 864e5, "7g": 7 * 864e5, "14g": 14 * 864e5 };
const yuzdelik = (l: number[], p: number) => { if (!l.length) return 0; const s = [...l].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))]; };
const fonksiyonAdi = (y?: string) => /^\/api\/([A-Za-z0-9_-]+)(?: \((?:önizleme|deneme)\))?$/.exec(y ?? "")?.[1];

/**
 * Fonksiyon ayrıntısı.
 *  GET            → { fonksiyonlar: [{ ad, cagri, hata, p50, p95, son }] } (7 gün)
 *  GET ?ad=&zaman=24s|7g|14g&kaynak=hepsi|canli|deneme → { hacim, sure, ozet, cagrilar }
 *  POST { ad, yontem, sorgu, basliklar, govde, surum: taslak|yayin } → istek deneyici (sunucuda çalışır, günlüğe "deneme" düşer)
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  const q = new URL(req.url).searchParams;
  const ad = q.get("ad");
  if (!ad) {
    const l = await gunlukOku(id, { tur: "fonksiyon", gun: 7, sinir: 50_000 });
    const o: Record<string, { cagri: number; hata: number; sureler: number[]; son: number }> = {};
    for (const g of l) { const a = fonksiyonAdi(g.y); if (!a) continue; const x = (o[a] ??= { cagri: 0, hata: 0, sureler: [], son: 0 }); x.cagri++; if (seviyeBul(g) === "hata") x.hata++; if (g.ms != null) x.sureler.push(g.ms); x.son = Math.max(x.son, g.z); }
    return Response.json({ ok: true, fonksiyonlar: Object.entries(o).map(([a, x]) => ({ ad: a, cagri: x.cagri, hata: x.hata, p50: yuzdelik(x.sureler, 50), p95: yuzdelik(x.sureler, 95), son: x.son })) });
  }
  const ozel = q.get("zaman") === "ozel";
  const bit = ozel ? Math.min(Date.now(), Number(q.get("bit")) || Date.now()) : Date.now();
  const bas = ozel ? Math.max(bit - 14 * 864e5, Number(q.get("bas")) || bit - 864e5) : bit - (ZAMAN[q.get("zaman") ?? "24s"] ?? 864e5);
  const aralik = Math.max(60_000, bit - bas);
  const kaynak = q.get("kaynak") ?? "hepsi";
  const l = (await gunlukOku(id, { tur: "fonksiyon", bas, bit, yol: `/api/${ad}`, sinir: 50_000 })).filter((g) => {
    if (fonksiyonAdi(g.y) !== ad) return false;
    const deneme = / \((önizleme|deneme)\)$/.test(g.y ?? "") || g.f?.onizleme;
    return kaynak === "hepsi" || (kaynak === "canli" ? !deneme : !!deneme);
  });
  const boy = kovaBoyu(aralik);
  const n = Math.ceil(aralik / boy), ilk = bit - n * boy;
  const hacim = Array.from({ length: n }, (_, i) => ({ z: ilk + i * boy, basarili: 0, uyari: 0, hata: 0 }));
  const kovaSure: number[][] = Array.from({ length: n }, () => []);
  const sureler: number[] = [];
  let hataSayisi = 0;
  for (const g of l) {
    const k = Math.floor((g.z - ilk) / boy);
    const s = seviyeBul(g);
    if (hacim[k]) hacim[k][s]++;
    if (s === "hata") hataSayisi++;
    if (g.ms != null) { sureler.push(g.ms); kovaSure[k]?.push(g.ms); }
  }
  const sonHata = l.find((g) => seviyeBul(g) === "hata") ?? null;
  return Response.json({
    ok: true, kova: boy,
    hacim, sure: hacim.map((h, i) => ({ z: h.z, p50: yuzdelik(kovaSure[i], 50), p95: yuzdelik(kovaSure[i], 95) })),
    ozet: { cagri: l.length, hata: hataSayisi, hataOrani: l.length ? hataSayisi / l.length : 0, p50: yuzdelik(sureler, 50), p95: yuzdelik(sureler, 95), sonHata },
    cagrilar: l.slice(0, 60) as Gunluk[],
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  { const engel = await izleyiciEngeli((await params).id, sahip); if (engel) return engel; }
  if (!p) return bulunamadi();
  let g: { ad?: string; yontem?: string; sorgu?: Record<string, string>; basliklar?: Record<string, string>; govde?: string; surum?: string } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  const ad = String(g.ad ?? "");
  if (!/^[A-Za-z0-9_-]{1,60}$/.test(ad)) return hata("Fonksiyon adı geçersiz.");
  const dosyalar = g.surum === "yayin" ? (p.yayin ? p.surumler.find((s) => s.id === p.yayin!.surumId)?.dosyalar : null) : p.dosyalar;
  if (!dosyalar) return hata("Proje henüz yayında değil.");
  const kod = dosyalar[`api/${ad}.js`];
  if (!kod) return hata(g.surum === "yayin" ? `api/${ad}.js yayındaki sürümde yok.` : `api/${ad}.js taslakta yok.`, 404);
  const yontem = ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(String(g.yontem).toUpperCase()) ? String(g.yontem).toUpperCase() : "GET";
  const temiz = (o: unknown, sinir: number) => Object.fromEntries(Object.entries(o && typeof o === "object" ? (o as Record<string, unknown>) : {}).filter(([k]) => /^[A-Za-z0-9_.-]{1,80}$/.test(k)).slice(0, sinir).map(([k, v]) => [k, String(v).slice(0, 2000)]));
  const sorgu = temiz(g.sorgu, 30);
  const basliklar = Object.fromEntries(Object.entries(temiz(g.basliklar, 30)).map(([k, v]) => [k.toLowerCase(), v]));
  const metin = yontem === "GET" ? "" : String(g.govde ?? "").slice(0, 1_000_000);
  if (metin && !basliklar["content-type"]) basliklar["content-type"] = /^\s*[[{]/.test(metin) ? "application/json" : "text/plain";
  let govde: unknown = metin;
  if (metin && basliklar["content-type"].includes("json")) { try { govde = JSON.parse(metin); } catch { return hata("Gövde geçerli JSON değil. Düzelt ya da içerik türünü değiştir."); } }
  else if (metin && basliklar["content-type"].includes("form-urlencoded")) govde = Object.fromEntries(new URLSearchParams(metin));
  const sonuc = await fonksiyonCalistir(kod, { yontem, yol: `/api/${ad}`, sorgu, basliklar, govde, metin }, p);
  gunlukYaz(p.id, { t: "fonksiyon", d: sonuc.durum, y: `/api/${ad} (deneme)`, yt: yontem, ms: sonuc.sure, m: sonuc.hata ?? `${yontem} · ${g.surum === "yayin" ? "yayındaki" : "taslak"} kodla deneme`, ...(Object.keys(sorgu).length ? { q: new URLSearchParams(sorgu).toString() } : {}), f: fonksiyonAyrintisi(sonuc) });
  return Response.json({ ok: true, durum: sonuc.durum, basliklar: sonuc.basliklar, govde: sonuc.govde.slice(0, 200_000), loglar: sonuc.loglar, disIstekler: sonuc.disIstekler ?? [], sure: sonuc.sure, hata: sonuc.hata ?? null });
}
