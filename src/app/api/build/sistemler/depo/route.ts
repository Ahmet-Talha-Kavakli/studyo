import { sahipOzeti } from "@/lib/build/depo";
import { depoListele, depoSil } from "@/lib/build/sistemDepoAdim";
import { sistemleriListele } from "@/lib/build/sistemDepo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Depo adımlarının yazdığı anahtarlar (sistem adlarıyla). */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const l = await depoListele(sahipOzeti(sahip));
  const adlar = new Map((await sistemleriListele(sahip)).map((s) => [s.id, s.ad]));
  return Response.json({ ok: true, anahtarlar: l.map((x) => ({ ...x, sistemAd: x.sistemId ? adlar.get(x.sistemId) ?? "Silinmiş sistem" : undefined })) });
}

/** ?anahtar=<tam anahtar> siler. */
export async function DELETE(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const tam = new URL(req.url).searchParams.get("anahtar");
  if (!tam) return hata("Anahtar seçilmedi.");
  const n = await depoSil(sahipOzeti(sahip), tam);
  return n ? Response.json({ ok: true }) : hata("Anahtar bulunamadı.", 404);
}
