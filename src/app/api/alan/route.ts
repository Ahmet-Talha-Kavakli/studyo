import { govdeOku, hata, hizHatasi, hizSiniri, istemciIp, tamam } from "@/lib/hesap/guvenlik";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { alanOlustur, alanOzeti, alanlarim, etkinYaz, katilabilirAlan } from "@/lib/alan/depo";
import { alanCerezi, etkinAlanSessiz } from "@/lib/alan/etkin";
import { alanKrediBilgisi } from "@/lib/alan/kredi";
import { alanHataYanit } from "@/lib/alan/uc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET  /api/alan  hesabın çalışma alanları, etkin alan (kredisiyle) ve e-posta alan adıyla katılabileceği alan.
 * POST /api/alan  { ad, etkin? } yeni alan açar; açan sahip olur. etkin: true ise yeni alana geçilir.
 */
export async function GET(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const [alanlar, s, k] = await Promise.all([alanlarim(o.hesap.uid), etkinAlanSessiz(req, o.hesap.uid), katilabilirAlan(o.hesap)]);
  const etkin = s.e ? { ...alanOzeti(s.e.alan, s.e.uye.rol), kredi: await alanKrediBilgisi(s.e.alan, o.hesap.uid) } : null;
  return tamam({ alanlar, etkin, katilabilir: k ? { ...alanOzeti(k.alan, k.rol), alanAdi: k.alan.alanAdi?.alan } : null }, 200, s.bayat ? { "Set-Cookie": alanCerezi("kisisel") } : undefined);
}

export async function POST(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const bekle = hizSiniri(`alan-olustur:${o.hesap.uid}`, 10, 3_600_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<{ ad?: string; etkin?: boolean }>(req);
  if (!g) return hata("Geçersiz istek.");
  try {
    const a = await alanOlustur(o.hesap, g.ad, istemciIp(req));
    const ozet = alanOzeti(a, "sahip");
    if (g.etkin) {
      await etkinYaz(o.hesap.uid, a.id);
      return tamam({ alan: ozet }, 201, { "Set-Cookie": alanCerezi(a.id) });
    }
    return tamam({ alan: ozet }, 201);
  } catch (e) { return alanHataYanit(e); }
}
