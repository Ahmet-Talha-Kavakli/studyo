import { tamam } from "@/lib/hesap/guvenlik";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { istemciIp } from "@/lib/hesap/guvenlik";
import { alanOzeti, etkinYaz } from "@/lib/alan/depo";
import { alanCerezi } from "@/lib/alan/etkin";
import { alanAdiylaKatil } from "@/lib/alan/islem";
import { alanHataYanit } from "@/lib/alan/uc";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

/** POST: doğrulanmış e-posta alan adıyla davetsiz katılım (alan ayarı açıksa); katılınca bu alana geçilir. */
export async function POST(req: Request, ctx: Ctx) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  try {
    const a = await alanAdiylaKatil((await ctx.params).id, o.hesap, istemciIp(req));
    await etkinYaz(o.hesap.uid, a.id);
    return tamam({ alan: alanOzeti(a, a.uyeler.find((u) => u.uid === o.hesap.uid)?.rol ?? "uye") }, 200, { "Set-Cookie": alanCerezi(a.id) });
  } catch (e) { return alanHataYanit(e); }
}
