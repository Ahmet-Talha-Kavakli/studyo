import { projeOku } from "@/lib/build/depo";
import { gunlukGezgini, gunlukOku, type GunlukSuzgec, type Seviye } from "@/lib/build/gunluk";
import { bulunamadi, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const ZAMAN: Record<string, number> = { "1s": 3600_000, "6s": 6 * 3600_000, "24s": 864e5, "3g": 3 * 864e5, "7g": 7 * 864e5, "14g": 14 * 864e5 };
const liste = (s: string | null) => (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);

/**
 * Günlük gezgini.
 *  Eski biçim: ?tur=istek|…&durum=hata|basarili&ara=&gun=&sonra=<ms> (canlı mod) → { gunlukler }
 *  Gezgin: ?gezgin=1&turler=istek,fonksiyon&seviye=uyari,hata&cihaz=mobil&yol=/api&zaman=24s|ozel&bas=&bit=&ara=&id=
 *    → { gunlukler, hacim, kova, yuzey, toplam, ortSure, bas, bit }   (sonra=<ms> ile yalnız yeni kayıtlar)
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  const q = new URL(req.url).searchParams;
  const sonra = Number(q.get("sonra")) || undefined;
  if (!q.get("gezgin")) {
    const l = await gunlukOku(id, { tur: q.get("tur") ?? undefined, durum: q.get("durum") ?? undefined, ara: q.get("ara") ?? undefined, gun: Number(q.get("gun")) || 7, sonra, sinir: 400 });
    return Response.json({ ok: true, gunlukler: l });
  }
  const z = q.get("zaman") ?? "24s";
  const bit = z === "ozel" ? Number(q.get("bit")) || Date.now() : Date.now();
  const bas = z === "ozel" ? Number(q.get("bas")) || bit - 864e5 : bit - (ZAMAN[z] ?? 864e5);
  const s: GunlukSuzgec = {
    turler: liste(q.get("turler")), seviyeler: liste(q.get("seviye")) as Seviye[], cihazlar: liste(q.get("cihaz")),
    yol: q.get("yol") ?? undefined, ara: q.get("ara") ?? undefined, id: q.get("id") ?? undefined, yontem: q.get("yontem") ?? undefined, ip: q.get("ip") ?? undefined,
    bas, bit, sinir: Math.min(1000, Number(q.get("sinir")) || 300),
  };
  if (sonra) {
    const l = await gunlukOku(id, { ...s, sonra, sinir: 200 });
    return Response.json({ ok: true, gunlukler: l });
  }
  const g = await gunlukGezgini(id, s);
  return Response.json({ ok: true, gunlukler: g.kayitlar, hacim: g.hacim, kova: g.kova, yuzey: g.yuzey, toplam: g.toplam, ortSure: g.ortSure, bas: g.bas, bit: g.bit });
}
