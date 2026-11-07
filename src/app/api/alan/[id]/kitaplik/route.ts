import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import { gunlukEkle } from "@/lib/alan/depo";
import { kitaplikEkle, kitaplikListe, kitaplikSil } from "@/lib/alan/kitaplik";
import { alanBaglam, kisiAd } from "@/lib/alan/uc";
import { ROL_SIRA } from "@/lib/alan/tipler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** GET: alan kitaplığı (bütün üyeler). ?tur=gorsel|video|ses|3d|muzik  ?uye=<uid> */
export async function GET(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id);
  if (b instanceof Response) return b;
  const u = new URL(req.url);
  const tur = u.searchParams.get("tur"), uye = u.searchParams.get("uye");
  const l = (await kitaplikListe(b.alan.id)).filter((x) => (!tur || x.tur === tur) && (!uye || x.uid === uye));
  return tamam({ ogeler: l.slice(0, 400).map((x) => ({ ...x, benim: x.uid === b.h.uid })), toplam: l.length });
}

/** POST { ogeler: [{ tur, model, istem, url, kapak? }] } kişisel kitaplıktan alana ekler (üye ve üstü). */
export async function POST(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "uye");
  if (b instanceof Response) return b;
  const bekle = hizSiniri(`alan-kitaplik:${b.h.uid}`, 120, 3_600_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<{ ogeler?: { tur: string; model?: string; istem?: string; url: string; kapak?: string }[] }>(req, 200_000);
  const l = Array.isArray(g?.ogeler) ? g!.ogeler.slice(0, 50) : [];
  const eklenen = [];
  for (const o of l) { const x = await kitaplikEkle(b.alan.id, b.h.uid, o); if (x) eklenen.push(x); }
  if (!eklenen.length) return hata("Eklenebilecek çıktı yok. Yalnız sunucuda saklanan görsel, video, ses, 3D ve şarkı çıktıları alana eklenir.", 400);
  await gunlukEkle(b.alan.id, "kitaplik", { uid: b.h.uid, ad: kisiAd(b.h) }, `${eklenen.length} çıktı kitaplığa eklendi`, b.ip);
  return tamam({ eklenen: eklenen.length });
}

/** DELETE { id } kendi eklediğini ya da (yönetici) herhangi bir öğeyi kaldırır. */
export async function DELETE(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "uye");
  if (b instanceof Response) return b;
  const g = await govdeOku<{ id?: string }>(req);
  const o = (await kitaplikListe(b.alan.id)).find((x) => x.id === g?.id);
  if (!o) return hata("Öğe bulunamadı.", 404);
  if (o.uid !== b.h.uid && ROL_SIRA[b.uye.rol] < ROL_SIRA.yonetici) return hata("Yalnız kendi eklediğin öğeyi kaldırabilirsin.", 403);
  await kitaplikSil(b.alan.id, o.id, b.h.uid);
  await gunlukEkle(b.alan.id, "kitaplik", { uid: b.h.uid, ad: kisiAd(b.h) }, `${o.ad} adlı üyenin ${o.model || "çıktısı"} kitaplıktan kaldırıldı`, b.ip);
  return tamam({ silindi: true });
}
