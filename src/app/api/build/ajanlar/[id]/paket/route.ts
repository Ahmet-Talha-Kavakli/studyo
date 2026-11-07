import { ajanGetir, ajanlariListele } from "@/lib/build/ajanDepo";
import { paketle } from "@/lib/build/ajanPaket";
import { baglantilariListele } from "@/lib/build/baglantiDepo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { yetenekleriListele } from "@/lib/build/yetenekDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Ajanın taşınabilir JSON paketi; ?indir=1 dosya olarak indirir. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const a = await ajanGetir((await params).id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  const [b, y, aj] = await Promise.all([baglantilariListele(sahip), yetenekleriListele(sahip), ajanlariListele(sahip)]);
  const p = paketle(a, {
    baglanti: (id) => b.find((x) => x.id === id)?.ad ?? id,
    yetenek: (id) => y.find((x) => x.id === id)?.baslik ?? id,
    ajan: (id) => aj.find((x) => x.id === id)?.ad ?? id,
  });
  const govde = JSON.stringify(p, null, 2);
  if (new URL(req.url).searchParams.get("indir") !== "1") return Response.json({ ok: true, paket: p });
  const dosya = `${a.ad.toLocaleLowerCase("tr").replace(/[çğıöşü]/g, (h) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[h] ?? h).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "ajan"}.vayra-ajan.json`;
  return new Response(govde, { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${dosya}"` } });
}
