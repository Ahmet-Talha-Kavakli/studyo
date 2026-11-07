import { ajanGetir, ajanGuncelle, yeniKimlik, type AjanTest } from "@/lib/build/ajanDepo";
import { konusmalardanTest, testCalismalari, testleriCalistir, type TestHedef } from "@/lib/build/ajanTest";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const SINIR = 25;

/** Test seti ve son çalıştırmalar. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const a = await ajanGetir(id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  return Response.json({ ok: true, testler: a.testler, calismalar: await testCalismalari(id) });
}

type Govde = {
  islem?: string; test?: string; soru?: string; beklenen?: string; hedef?: string;
  tur?: string; persona?: string; turSiniri?: number; testler?: unknown; kaynak?: string;
};
const metinAl = (v: unknown, n = 2000) => (typeof v === "string" ? v.trim().slice(0, n) : undefined);

/**
 * { islem: "ekle", soru, beklenen, tur?, persona?, turSiniri? } · { islem: "guncelle", test, ... } · { islem: "sil", test } ·
 * { islem: "toplu", testler: [{ soru, beklenen }], kaynak: "csv" | "konusma" } birden çok testi ekler ·
 * { islem: "oneri" } son ziyaretçi konuşmalarından test önerir (eklemez) ·
 * { islem: "calistir", hedef: "taslak" | "yayin" | "ikisi", testler?: [kimlik] } arka planda çalıştırır (GET ile izlenir).
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await ajanGetir(id, sahip))) return hata("Ajan bulunamadı.", 404);
  let g: Govde = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (g.islem === "calistir") {
    const h: TestHedef[] = g.hedef === "ikisi" ? ["taslak", "yayin"] : g.hedef === "yayin" ? ["yayin"] : ["taslak"];
    const sadece = Array.isArray(g.testler) ? g.testler.filter((x): x is string => typeof x === "string").slice(0, SINIR) : undefined;
    const r = await testleriCalistir(id, sahipOzeti(sahip), h, sadece);
    if (r.hata) return hata(r.hata);
    return Response.json({ ok: true, calisma: r.id });
  }
  if (g.islem === "oneri") {
    const r = await konusmalardanTest(id, sahipOzeti(sahip));
    if (r.hata && !r.oneriler.length) return hata(r.hata);
    return Response.json({ ok: true, oneriler: r.oneriler, model: r.model });
  }
  if (g.islem === "toplu") {
    const l = (Array.isArray(g.testler) ? g.testler : []).flatMap((x) => {
      const o = x as Record<string, unknown>;
      const soru = metinAl(o.soru), beklenen = metinAl(o.beklenen);
      return soru && beklenen ? [{ soru, beklenen }] : [];
    });
    if (!l.length) return hata("Eklenecek geçerli test yok: her satırda soru ve beklenen davranış olmalı.");
    for (const t of l) { const d = icerikDenetle(`${t.soru}\n${t.beklenen}`); if (!d.izin) return hata(d.mesaj, 422); }
    const kaynak = g.kaynak === "konusma" ? "konusma" : "csv";
    let eklenen = 0;
    const r = await ajanGuncelle(id, sahip, (a) => {
      const bos = SINIR - a.testler.length;
      if (bos <= 0) return `Bir test setinde en çok ${SINIR} test olabilir.`;
      for (const t of l.slice(0, bos)) { a.testler.push({ id: yeniKimlik(8), soru: t.soru, beklenen: t.beklenen, olusturma: Date.now(), tur: "tek", kaynak }); eklenen++; }
    });
    if (!r) return hata("Ajan bulunamadı.", 404);
    if (!r.ajan) return hata(r.hata);
    return Response.json({ ok: true, testler: r.ajan.testler, eklenen, atlanan: l.length - eklenen });
  }
  const soru = metinAl(g.soru);
  const beklenen = metinAl(g.beklenen);
  const persona = metinAl(g.persona, 1500);
  const tur: AjanTest["tur"] | undefined = g.tur === "persona" ? "persona" : g.tur === "tek" ? "tek" : undefined;
  const turSiniri = typeof g.turSiniri === "number" && Number.isFinite(g.turSiniri) ? Math.min(8, Math.max(2, Math.round(g.turSiniri))) : undefined;
  const metin = [soru, beklenen, persona].filter(Boolean).join("\n");
  if (metin) { const d = icerikDenetle(metin); if (!d.izin) return hata(d.mesaj, 422); }
  const r = await ajanGuncelle(id, sahip, (a) => {
    if (g.islem === "ekle") {
      const p = tur === "persona";
      if (!beklenen) return p ? "Başarı ölçütü gerekli." : "Beklenen davranış gerekli.";
      if (p ? !persona : !soru) return p ? "Persona ve hedef gerekli." : "Soru gerekli.";
      if (a.testler.length >= SINIR) return `Bir test setinde en çok ${SINIR} test olabilir.`;
      a.testler.push({ id: yeniKimlik(8), soru: soru ?? "", beklenen, olusturma: Date.now(), tur: tur ?? "tek", kaynak: "elle", ...(p ? { persona, turSiniri: turSiniri ?? 4 } : {}) });
      return;
    }
    const t = a.testler.find((x) => x.id === g.test);
    if (!t) return "Test bulunamadı.";
    if (g.islem === "guncelle") {
      if (tur) t.tur = tur;
      if (soru !== undefined) t.soru = soru;
      if (beklenen) t.beklenen = beklenen;
      if (t.tur === "persona") { if (persona) t.persona = persona; if (turSiniri) t.turSiniri = turSiniri; if (!t.persona) return "Persona ve hedef gerekli."; }
      else if (!t.soru) return "Soru gerekli.";
      return;
    }
    if (g.islem === "sil") { a.testler = a.testler.filter((x) => x.id !== g.test); return; }
    return "Bilinmeyen işlem.";
  });
  if (!r) return hata("Ajan bulunamadı.", 404);
  if (!r.ajan) return hata(r.hata);
  return Response.json({ ok: true, testler: r.ajan.testler });
}
