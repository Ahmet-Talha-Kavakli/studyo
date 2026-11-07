import { randomBytes } from "crypto";
import { ajanGetir, ajanGuncelle, istemciAjan, type AjanBilgi } from "@/lib/build/ajanDepo";
import { bilgiAra, parcala, siteIceAktar } from "@/lib/build/ajanBilgi";
import { bilgiYenile } from "@/lib/build/ajanZamanlayici";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const TOPLAM_SINIR = 2_000_000;
const YENILE = ["kapali", "gunluk", "haftalik", "aylik"] as const;
/** Tarama ayarını doğrular: sınır 1 ile 50, en çok 10 desen, yollar / ile başlar. */
function taramaAl(t: unknown): AjanBilgi["tarama"] | undefined {
  if (!t || typeof t !== "object") return undefined;
  const x = t as { sinir?: unknown; harita?: unknown; dahil?: unknown; haric?: unknown };
  const desenler = (v: unknown) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(/[\s,]+/) : []).map((d) => String(d).trim()).filter(Boolean).map((d) => (d.startsWith("/") ? d : `/${d}`).slice(0, 120)).slice(0, 10);
  return { sinir: Math.max(1, Math.min(50, Math.round(Number(x.sinir) || 8))), harita: !!x.harita, dahil: desenler(x.dahil), haric: desenler(x.haric) };
}

/** Bilgide dene: ?ara=<sorgu> en ilgili parçalar (BM25) ve hangi kaynaktan geldikleri; kaynak başına parça sayısı. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const a = await ajanGetir((await params).id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  const q = (new URL(req.url).searchParams.get("ara") ?? "").slice(0, 300);
  const parcalar = Object.fromEntries(a.bilgi.map((b) => [b.id, parcala(b).length]));
  if (!q.trim()) return Response.json({ ok: true, sonuclar: [], parcalar });
  return Response.json({ ok: true, parcalar, sonuclar: bilgiAra(a.bilgi, q, 6).map((b) => ({ bilgiId: b.bilgiId, ad: b.ad, baslik: b.baslik, metin: b.metin.slice(0, 700), puan: Number(b.puan.toFixed(2)) })) });
}

/**
 * Kaynak ekle: { tur: "metin" | "dosya", ad, icerik, ne? } (metin dosyaları istemcide okunur) ya da
 * { tur: "adres", url, altSayfa?, yenile?, ne? } (sayfa ve istenirse aynı siteden en çok 8 alt sayfa sunucuda okunur).
 * { islem: "yenile", bilgi } web adresini şimdi yeniden okur.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await ajanGetir(id, sahip))) return hata("Ajan bulunamadı.", 404);
  let g: { islem?: string; bilgi?: string; tur?: string; ad?: string; icerik?: string; url?: string; altSayfa?: boolean; yenile?: string; ne?: string; tarama?: unknown };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (g.islem === "yenile") {
    const h = await bilgiYenile(id, sahipOzeti(sahip), String(g.bilgi ?? ""));
    const a = await ajanGetir(id, sahip);
    if (h) return Response.json({ ok: false, hata: h, ajan: a ? istemciAjan(a) : undefined }, { status: 400 });
    return Response.json({ ok: true, ajan: a ? istemciAjan(a) : undefined });
  }
  const ne = typeof g.ne === "string" ? g.ne.trim().slice(0, 300) : undefined;
  let yeni: Omit<AjanBilgi, "id" | "eklenme" | "boyut">;
  if (g.tur === "adres") {
    try {
      const tarama = taramaAl(g.tarama);
      const s = await siteIceAktar(String(g.url ?? ""), !!g.altSayfa, tarama);
      yeni = { ad: s.ad, tur: "adres", url: s.url, icerik: s.icerik, altSayfa: !!g.altSayfa, sayfa: s.sayfa, parmak: s.parmak, ...(tarama ? { tarama } : {}), yenile: YENILE.includes(g.yenile as never) ? (g.yenile as AjanBilgi["yenile"]) : "kapali", durum: "hazir", sonYenileme: Date.now(), ...(ne ? { ne } : {}) };
    } catch (e) { return hata((e as Error).message); }
  } else {
    const icerik = String(g.icerik ?? "").replace(/\u0000/g, "").trim();
    if (!icerik) return hata("İçerik boş.");
    if (icerik.length > 800_000) return hata("Bu belge çok büyük (800 bin karakter sınırı).", 413);
    yeni = { ad: String(g.ad ?? "Metin").slice(0, 100), tur: g.tur === "dosya" ? "dosya" : "metin", icerik, durum: "hazir", ...(ne ? { ne } : {}) };
  }
  const r = await ajanGuncelle(id, sahip, (a) => {
    if (a.bilgi.length >= 40) return "En çok 40 bilgi kaynağı eklenebilir.";
    if (a.bilgi.reduce((t, b) => t + b.icerik.length, 0) + yeni.icerik.length > TOPLAM_SINIR) return "Bilgi kaynağı toplam sınırı (2 milyon karakter) doldu.";
    a.bilgi.push({ id: randomBytes(5).toString("hex"), eklenme: Date.now(), boyut: yeni.icerik.length, ...yeni });
  });
  if (!r) return hata("Ajan bulunamadı.", 404);
  if (!r.ajan) return hata(r.hata, 413);
  return Response.json({ ok: true, ajan: istemciAjan(r.ajan) });
}

/** Kaynak ayarı: { bilgi, ad?, ne?, yenile? }. */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { bilgi?: string; ad?: string; ne?: string; yenile?: string; tarama?: unknown; altSayfa?: boolean };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const r = await ajanGuncelle((await params).id, sahip, (a) => {
    const b = a.bilgi.find((x) => x.id === g.bilgi);
    if (!b) return "Kaynak bulunamadı.";
    if (typeof g.ad === "string" && g.ad.trim()) b.ad = g.ad.trim().slice(0, 100);
    if (typeof g.ne === "string") b.ne = g.ne.trim().slice(0, 300) || undefined;
    if (typeof g.yenile === "string" && YENILE.includes(g.yenile as never) && b.tur === "adres") b.yenile = g.yenile as AjanBilgi["yenile"];
    if (b.tur === "adres" && g.tarama) { const t = taramaAl(g.tarama); if (t) { b.tarama = t; b.altSayfa = true; } }
    if (b.tur === "adres" && typeof g.altSayfa === "boolean") b.altSayfa = g.altSayfa;
  });
  if (!r) return hata("Ajan bulunamadı.", 404);
  if (!r.ajan) return hata(r.hata);
  return Response.json({ ok: true, ajan: istemciAjan(r.ajan) });
}

/** ?bilgi=<id> siler. */
export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const b = new URL(req.url).searchParams.get("bilgi");
  const r = await ajanGuncelle((await params).id, sahip, (a) => { a.bilgi = a.bilgi.filter((x) => x.id !== b); });
  if (!r?.ajan) return hata("Ajan bulunamadı.", 404);
  return Response.json({ ok: true, ajan: istemciAjan(r.ajan) });
}
