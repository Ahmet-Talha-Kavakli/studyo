import { govdeOku, hata, tamam } from "@/lib/hesap/guvenlik";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { alanOku, alanOzeti, etkinYaz, uyeBul } from "@/lib/alan/depo";
import { alanCerezi } from "@/lib/alan/etkin";
import { alanKrediBilgisi } from "@/lib/alan/kredi";
import { ALAN_DESENI } from "@/lib/alan/tipler";

export const runtime = "nodejs";

/**
 * POST /api/alan/etkin { alan: "<id>" | null } etkin alanı değiştirir: çerez (bu tarayıcı) ve sunucu kaydı (çerezsiz
 * istekler, arka plan Build işleri) birlikte yazılır. null kişisel alana döner.
 */
export async function POST(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const g = await govdeOku<{ alan?: string | null }>(req);
  const id = g?.alan ?? null;
  if (id === null || id === "kisisel") {
    await etkinYaz(o.hesap.uid, null);
    return tamam({ etkin: null }, 200, { "Set-Cookie": alanCerezi("kisisel") });
  }
  if (typeof id !== "string" || !ALAN_DESENI.test(id)) return hata("Alan tanınmadı.", 400);
  const a = await alanOku(id);
  const u = a && uyeBul(a, o.hesap.uid);
  if (!a || !u) return hata("Bu çalışma alanının üyesi değilsin.", 404, { kod: "yok" });
  await etkinYaz(o.hesap.uid, a.id);
  return tamam({ etkin: { ...alanOzeti(a, u.rol), kredi: await alanKrediBilgisi(a, o.hesap.uid) } }, 200, { "Set-Cookie": alanCerezi(a.id) });
}
