import { randomBytes } from "crypto";
import { alanAdiBagla, alanAdiKaldir, projeOku, projeYaz } from "@/lib/build/depo";
import { alanAdiGecerli, kayitSeti, kokMu, tara } from "@/lib/build/alanadi";
import { yalnizSahip } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import type { AlanAdi } from "@/lib/build/tipler";
import { alanAra, satinAlmaBaglantilari } from "@/lib/build/bulutAlanAra";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const temizle = (a: string) => a.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "").replace(/\.$/, "");

/** Alan adı ekle: { ad, wwwYonlendir? } → kayıt seti + ilk tarama. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const engel = await yalnizSahip((await params).id, sahip, "Alan adlarını yalnız proje sahibi ekleyip yönetebilir.");
  if (engel) return engel;
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  let g: { ad?: string; wwwYonlendir?: boolean };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const ad = temizle(String(g.ad ?? ""));
  if (!alanAdiGecerli(ad)) return hata("Bu bir alan adı gibi görünmüyor; kahvecim.com ya da shop.kahvecim.com.tr gibi yaz.");
  if (p.alanAdlari.some((x) => x.ad === ad)) return hata("Bu alan adı zaten ekli.");
  if (p.alanAdlari.length >= 10) return hata("Bir projeye en fazla 10 alan adı eklenebilir.");
  try { await alanAdiBagla(ad, p.id); } catch (e) { return hata((e as Error).message); }
  const kok = kokMu(ad);
  const taslak = { ad, kok, dogrulamaKodu: randomBytes(9).toString("hex"), wwwYonlendir: kok && g.wwwYonlendir !== false };
  const t = await tara(taslak);
  const a: AlanAdi = { ...taslak, birincil: !p.alanAdlari.length, durum: t.durum, kayitlar: t.kayitlar, uyarilar: t.uyarilar, korunan: t.korunan, sonKontrol: Date.now(), eklenme: Date.now() };
  p.alanAdlari.push(a);
  await projeYaz(p, sahip);
  return Response.json({ ok: true, alanAdi: a, saglayici: t.saglayici });
}

/** Yeniden tara: ?ad=… (hepsi için boş bırak). */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const engel = await yalnizSahip((await params).id, sahip, "Alan adlarını yalnız proje sahibi ekleyip yönetebilir.");
  if (engel) return engel;
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  // Satın almadan önce arama: ?ara=kahvecim → uzantılarda uygunluk (RDAP, yoksa DNS) ve kayıt firması bağlantıları.
  const ara = new URL(req.url).searchParams.get("ara");
  if (ara !== null) {
    if (!hizSiniri(`alan-ara:${sahip}`, 20, 60_000)) return hata("Çok fazla arama; bir dakika bekle.", 429);
    const r = await alanAra(ara);
    if (!r.sonuclar.length) return hata("En az iki harfli bir ad yaz.");
    return Response.json({ ok: true, ...r, firmalar: satinAlmaBaglantilari(r.sonuclar.find((x) => x.durum === "bos")?.ad ?? r.sonuclar[0].ad), satis: false });
  }
  const hedef = new URL(req.url).searchParams.get("ad");
  const saglayicilar: Record<string, string | null> = {};
  for (const a of p.alanAdlari) {
    if (hedef && a.ad !== hedef) continue;
    const t = await tara(a);
    Object.assign(a, { durum: t.durum, kayitlar: t.kayitlar, uyarilar: t.uyarilar, korunan: t.korunan, sonKontrol: Date.now() });
    saglayicilar[a.ad] = t.saglayici;
  }
  await projeYaz(p, sahip);
  return Response.json({ ok: true, alanAdlari: p.alanAdlari, saglayicilar });
}

/** Birincil yap / www yönlendirmesini aç-kapa: { ad, birincil?, wwwYonlendir? }. */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const engel = await yalnizSahip((await params).id, sahip, "Alan adlarını yalnız proje sahibi ekleyip yönetebilir.");
  if (engel) return engel;
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  let g: { ad?: string; birincil?: boolean; wwwYonlendir?: boolean };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const a = p.alanAdlari.find((x) => x.ad === g.ad);
  if (!a) return hata("Alan adı bulunamadı.", 404);
  if (g.birincil) p.alanAdlari.forEach((x) => (x.birincil = x.ad === a.ad));
  if (typeof g.wwwYonlendir === "boolean" && a.kok) { a.wwwYonlendir = g.wwwYonlendir; a.kayitlar = kayitSeti(a); }
  await projeYaz(p, sahip);
  return Response.json({ ok: true, alanAdlari: p.alanAdlari });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const engel = await yalnizSahip((await params).id, sahip, "Alan adlarını yalnız proje sahibi ekleyip yönetebilir.");
  if (engel) return engel;
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  const ad = new URL(req.url).searchParams.get("ad") ?? "";
  const a = p.alanAdlari.find((x) => x.ad === ad);
  if (!a) return hata("Alan adı bulunamadı.", 404);
  await alanAdiKaldir(ad, p.id);
  p.alanAdlari = p.alanAdlari.filter((x) => x.ad !== ad);
  if (a.birincil && p.alanAdlari[0]) p.alanAdlari[0].birincil = true;
  await projeYaz(p, sahip);
  return Response.json({ ok: true, alanAdlari: p.alanAdlari });
}
