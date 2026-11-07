import { randomBytes } from "crypto";
import { ajanGetir, ajanGuncelle, type Ajan } from "@/lib/build/ajanDepo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

function gorunum(a: Ajan) {
  const z = new Map<string, { ziyaretci: string; etiket: string; notlar: { id: string; metin: string; zaman: number; guncelleme?: number }[] }>();
  for (const n of a.bellek.ziyaretciNotlar ?? []) {
    const g = z.get(n.ziyaretci) ?? { ziyaretci: n.ziyaretci, etiket: n.etiket, notlar: [] };
    g.notlar.push({ id: n.id, metin: n.metin, zaman: n.zaman, guncelleme: n.guncelleme });
    g.etiket = n.etiket;
    z.set(n.ziyaretci, g);
  }
  return { acik: a.bellek.acik, ziyaretci: !!a.bellek.ziyaretci, ortak: a.bellek.notlar, ziyaretciler: [...z.values()].sort((x, y) => Math.max(...y.notlar.map((n) => n.zaman)) - Math.max(...x.notlar.map((n) => n.zaman))) };
}

/** Bellek: ortak notlar ve ziyaretçi başına notlar (ziyaretçiye özel bellek açıksa). */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const a = await ajanGetir((await params).id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  return Response.json({ ok: true, ...gorunum(a) });
}

/**
 * { islem: "ekle", metin } ortak not ekler · { islem: "duzenle", id, metin, kapsam } · { islem: "sil", id, kapsam } ·
 * { islem: "ziyaretciSil", ziyaretci } bir ziyaretçinin bütün notlarını siler · { islem: "temizle", kapsam } hepsini siler.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { islem?: string; id?: string; metin?: string; kapsam?: "ortak" | "ziyaretci"; ziyaretci?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const metin = String(g.metin ?? "").trim().slice(0, 400);
  if (metin) { const d = icerikDenetle(metin); if (!d.izin) return hata(d.mesaj, 422); }
  const r = await ajanGuncelle((await params).id, sahip, (a) => {
    a.bellek.ziyaretciNotlar ??= [];
    switch (g.islem) {
      case "ekle":
        if (!metin) return "Not boş.";
        a.bellek.notlar = [...a.bellek.notlar, { id: randomBytes(4).toString("hex"), metin, zaman: Date.now() }].slice(-200);
        return;
      case "duzenle": {
        if (!metin) return "Not boş.";
        const n = (g.kapsam === "ziyaretci" ? a.bellek.ziyaretciNotlar : a.bellek.notlar).find((x) => x.id === g.id);
        if (!n) return "Not bulunamadı.";
        n.metin = metin; n.guncelleme = Date.now();
        return;
      }
      case "sil":
        if (g.kapsam === "ziyaretci") a.bellek.ziyaretciNotlar = a.bellek.ziyaretciNotlar.filter((x) => x.id !== g.id);
        else a.bellek.notlar = a.bellek.notlar.filter((x) => x.id !== g.id);
        return;
      case "ziyaretciSil": a.bellek.ziyaretciNotlar = a.bellek.ziyaretciNotlar.filter((x) => x.ziyaretci !== g.ziyaretci); return;
      case "temizle": if (g.kapsam === "ziyaretci") a.bellek.ziyaretciNotlar = []; else a.bellek.notlar = []; return;
      default: return "Bilinmeyen işlem.";
    }
  });
  if (!r) return hata("Ajan bulunamadı.", 404);
  if (!r.ajan) return hata(r.hata);
  return Response.json({ ok: true, ...gorunum(r.ajan) });
}
