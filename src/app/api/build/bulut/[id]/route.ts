import { bulutOzeti, guvenlikDenetimi } from "@/lib/build/bulut";
import { projeOku } from "@/lib/build/depo";
import { gunlukOku } from "@/lib/build/gunluk";
import { bulunamadi, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { zamanliBaslat } from "@/lib/build/bulutZamanli";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Proje bulut konsolu: özet, yayın geçmişi, sürümler, güvenlik bulguları, son olaylar. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  zamanliBaslat();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  const [ozet, guvenlik, olaylar] = await Promise.all([bulutOzeti(p), guvenlikDenetimi(p).then((l) => l.filter((b) => !b.yoksayildi)), gunlukOku(p.id, { gun: 14, sinir: 30, tur: undefined }).then((l) => l.filter((g) => g.t !== "istek").slice(0, 12))]);
  return Response.json({
    ok: true, ozet, guvenlik, olaylar,
    yayinGecmisi: p.yayinGecmisi ?? (p.yayin ? [{ ...p.yayin, olay: "yayin" }] : []),
    surumler: p.surumler.slice(-40).reverse().map((s) => ({ id: s.id, no: s.no, zaman: s.zaman, aciklama: s.aciklama, kaynak: s.kaynak, degisen: s.degisen.length, ekle: s.degisen.reduce((t, d) => t + d.ekle, 0), sil: s.degisen.reduce((t, d) => t + d.sil, 0) })),
  });
}
