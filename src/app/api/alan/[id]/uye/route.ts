import { govdeOku, hata, tamam } from "@/lib/hesap/guvenlik";
import { AlanHatasi, alanOku } from "@/lib/alan/depo";
import { alanCerezi } from "@/lib/alan/etkin";
import { alandanAyril, rolDegistir, sahiplikDevret, sinirAyarla, uyeCikar } from "@/lib/alan/islem";
import { alanAyrintisi, alanBaglam, alanHataYanit } from "@/lib/alan/uc";
import { ALAN_ROLLERI, type AlanRol } from "@/lib/alan/tipler";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH  { uid, rol? , sinir? }   rol değiştir (sahip: herkes; yönetici: üye ve izleyici), aylık kredi sınırı (null: varsayılan)
 * DELETE { uid }                  üyeyi çıkar
 * POST   { islem: "ayril" }       alandan ayrıl (sahip ayrılamaz)
 * POST   { islem: "devret", uid } sahipliği devret (yalnız sahip; eski sahip yönetici olur)
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "yonetici");
  if (b instanceof Response) return b;
  const g = await govdeOku<{ uid?: string; rol?: string; sinir?: unknown }>(req);
  const uid = String(g?.uid ?? "");
  try {
    if (g?.rol !== undefined) {
      if (!ALAN_ROLLERI.includes(g.rol as AlanRol)) throw new AlanHatasi("Rol tanınmadı.");
      await rolDegistir(b.alan.id, b.h, uid, g.rol as AlanRol, b.ip);
    }
    if (g && "sinir" in g) {
      let s: number | null = null;
      if (g.sinir !== null && g.sinir !== "") {
        s = Math.floor(Number(g.sinir));
        if (!Number.isFinite(s) || s < 0 || s > 10_000_000) throw new AlanHatasi("Sınır 0 ile 10.000.000 arasında bir tam sayı olmalı.");
      }
      await sinirAyarla(b.alan.id, b.h, uid, s, b.ip);
    }
    return tamam({ alan: await alanAyrintisi((await alanOku(b.alan.id))!, b.h.uid) });
  } catch (e) { return alanHataYanit(e); }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "yonetici");
  if (b instanceof Response) return b;
  const g = await govdeOku<{ uid?: string }>(req);
  try {
    await uyeCikar(b.alan.id, b.h, String(g?.uid ?? ""), b.ip);
    return tamam({ alan: await alanAyrintisi((await alanOku(b.alan.id))!, b.h.uid) });
  } catch (e) { return alanHataYanit(e); }
}

export async function POST(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id);
  if (b instanceof Response) return b;
  const g = await govdeOku<{ islem?: string; uid?: string; onay?: string }>(req);
  try {
    if (g?.islem === "ayril") {
      await alandanAyril(b.alan.id, b.h, b.ip);
      return tamam({ ayrildi: true }, 200, { "Set-Cookie": alanCerezi("kisisel") });
    }
    if (g?.islem === "devret") {
      if (String(g.onay ?? "").trim() !== b.alan.ad) return hata("Onay için alanın adını aynen yaz.", 400, { alan: "onay" });
      await sahiplikDevret(b.alan.id, b.h, String(g.uid ?? ""), b.ip);
      return tamam({ alan: await alanAyrintisi((await alanOku(b.alan.id))!, b.h.uid) });
    }
    return hata("İşlem tanınmadı.");
  } catch (e) { return alanHataYanit(e); }
}
