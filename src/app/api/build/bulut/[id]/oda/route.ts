import { projeOku } from "@/lib/build/depo";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";
import { islemTemizle, OdaHatasi, odaAyrinti, odalar, odaSil, odaUygula, ODA_SINIR } from "@/lib/build/bulutOda";
import { veriAyarOku } from "@/lib/build/bulutVeriAyar";
import { zamanliBaslat } from "@/lib/build/bulutZamanli";
import type { VeriOrtami } from "@/lib/build/veri";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Bulut > Odalar (yalnız sahip ve ekip; yazma izleyiciye kapalı).
 *  GET                         → { odalar, ayar, sinir }
 *  GET ?ad=<oda>&ortam=        → odanın durumu, son 100 olayı, kimler
 *  POST { islem: "uygula", ad, ortam?, islemler } | { islem: "sil", ad, ortam? }
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  zamanliBaslat();
  const q = new URL(req.url).searchParams;
  const ortam: VeriOrtami = q.get("ortam") === "test" ? "test" : "canli";
  try {
    if (q.get("ad")) {
      const o = await odaAyrinti(p.id, ortam, q.get("ad")!);
      return o ? Response.json({ ok: true, oda: o }) : hata("Oda bulunamadı.", 404);
    }
    return Response.json({ ok: true, odalar: await odalar(p.id), ayar: (await veriAyarOku(p.id)).oda, sinir: ODA_SINIR });
  } catch (e) { return hata(e instanceof OdaHatasi ? e.message : "Okunamadı.", e instanceof OdaHatasi ? e.durum : 500); }
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const p = await projeOku(id, sahip);
  if (!p) return bulunamadi();
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  let g: { islem?: string; ad?: string; ortam?: string; islemler?: unknown } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  const ortam: VeriOrtami = g.ortam === "test" ? "test" : "canli";
  const ad = String(g.ad ?? "");
  const kim = await denetimKim(id, sahip);
  try {
    if (g.islem === "uygula") {
      const olay = await odaUygula(id, ortam, ad, islemTemizle(g.islemler), { kim: "panel" });
      if (olay.islemler.some((x) => x.t === "sifirla")) denetimYaz(id, { tur: "veri", kim, ortam, mesaj: `"${ad}" odası panelden sıfırlandı` });
      return Response.json({ ok: true, olay });
    }
    if (g.islem === "sil") {
      if (!(await odaSil(id, ortam, ad))) return hata("Oda bulunamadı.", 404);
      denetimYaz(id, { tur: "veri", kim, ortam, mesaj: `"${ad}" odası silindi` });
      return Response.json({ ok: true });
    }
    return hata("Bilinmeyen işlem.");
  } catch (e) { return hata(e instanceof OdaHatasi ? e.message : "İşlem yapılamadı.", e instanceof OdaHatasi ? e.durum : 500); }
}
