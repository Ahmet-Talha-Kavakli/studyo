import { govdeOku, hata, tamam } from "@/lib/hesap/guvenlik";
import { projeOkuHam, projeSahibiMi, sahipOzeti, sahipProjeleri } from "@/lib/build/depo";
import { sahipAl } from "@/lib/build/sunucu";
import { alanOku, kisiAdi, projeAlani } from "@/lib/alan/depo";
import { projeyiAlanaBagla, projeyiAlandanCikar } from "@/lib/alan/build";
import { alanBaglam, kisiAd } from "@/lib/alan/uc";
import { ROL_SIRA, type AlanProjeBilgisi } from "@/lib/alan/tipler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * GET           alana bağlı Build projeleri (bütün üyeler).  ?aday=1 alana eklenebilecek kendi projelerin.
 * POST { id }   kendi projeni alana ekle (üye ve üstü).
 * DELETE { id } projeyi alandan çıkar (projenin sahibi ya da alan yöneticisi). Proje silinmez, sahibinde kalır.
 */
export async function GET(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id);
  if (b instanceof Response) return b;
  const sahip = sahipAl(req);
  const benOz = sahip ? sahipOzeti(sahip) : null;
  if (new URL(req.url).searchParams.get("aday")) {
    if (!sahip) return tamam({ projeler: [] });
    const bagli = new Set(b.alan.projeler.map((p) => p.id));
    const l = (await sahipProjeleri(sahip)).filter((p) => !p.ekipRol && !bagli.has(p.id) && !p.taslak);
    const sonuc = [];
    for (const p of l.slice(0, 100)) sonuc.push({ id: p.id, ad: p.ad, tur: p.tur, kapak: p.kapak, guncelleme: p.guncelleme, baskaAlanda: !!(await projeAlani(p.id)) });
    return tamam({ projeler: sonuc.filter((p) => !p.baskaAlanda) });
  }
  const projeler: AlanProjeBilgisi[] = [];
  const adlar = new Map<string, string>();
  for (const p of b.alan.projeler) {
    const x = await projeOkuHam(p.id);
    if (!x) continue;
    if (!adlar.has(p.ekleyen)) adlar.set(p.ekleyen, (await kisiAdi(p.ekleyen))?.ad ?? "Silinmiş hesap");
    projeler.push({
      id: x.id, ad: x.ad, tur: x.tur, ...(x.kapak ? { kapak: x.kapak } : {}), guncelleme: x.guncelleme, sahipAd: adlar.get(p.ekleyen)!, ekleyen: p.ekleyen, eklenme: p.eklenme,
      yayinda: !!x.yayin, benim: !!benOz && x.sahip === benOz,
    });
  }
  return tamam({ projeler: projeler.sort((x, y) => y.guncelleme - x.guncelleme) });
}

export async function POST(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "uye");
  if (b instanceof Response) return b;
  const g = await govdeOku<{ id?: string }>(req);
  const id = String(g?.id ?? "");
  const sahip = sahipAl(req);
  if (!sahip || !(await projeSahibiMi(id, sahip))) return hata("Yalnız sahibi olduğun bir projeyi alana ekleyebilirsin.", 403);
  try { await projeyiAlanaBagla(id, b.alan.id, b.h.uid, kisiAd(b.h)); } catch (e) { return hata((e as Error).message, 409); }
  return tamam({ alan: { projeSayisi: (await alanOku(b.alan.id))?.projeler.length ?? 0 } });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "uye");
  if (b instanceof Response) return b;
  const g = await govdeOku<{ id?: string }>(req);
  const id = String(g?.id ?? "");
  if (!b.alan.projeler.some((p) => p.id === id)) return hata("Proje bu alanda değil.", 404);
  const sahip = sahipAl(req);
  const projeSahibi = !!sahip && (await projeSahibiMi(id, sahip));
  if (!projeSahibi && ROL_SIRA[b.uye.rol] < ROL_SIRA.yonetici) return hata("Projeyi yalnız sahibi ya da alan yöneticisi çıkarabilir.", 403);
  await projeyiAlandanCikar(id, b.alan.id, b.h.uid, kisiAd(b.h));
  return tamam({ cikarildi: true });
}
