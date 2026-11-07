import { tamam } from "@/lib/hesap/guvenlik";
import { ipGizle } from "@/lib/hesap/guvenlik";
import { gunlukOku } from "@/lib/alan/depo";
import { alanBaglam, csvTarih, csvYanit, saatDilimi } from "@/lib/alan/uc";
import { GUNLUK_AD, type AlanGunlukTuru } from "@/lib/alan/tipler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Denetim günlüğü (sahip ve yönetici): GET ?tur=&adet=  ya da ?csv=1. IP son bölümü gizli döner. */
export async function GET(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "yonetici");
  if (b instanceof Response) return b;
  const u = new URL(req.url);
  const tur = u.searchParams.get("tur") as AlanGunlukTuru | null;
  const l = (await gunlukOku(b.alan.id)).reverse().filter((k) => !tur || k.tur === tur);
  if (u.searchParams.get("csv")) {
    const tz = saatDilimi(u.searchParams.get("tz"));
    return csvYanit("alan-denetim-gunlugu.csv", [[`Tarih (${tz})`, "Olay", "Kişi", "Ayrıntı", "IP"], ...l.map((k) => [csvTarih(k.zaman, tz), GUNLUK_AD[k.tur] ?? k.tur, k.ad, k.ayrinti, k.ip ? ipGizle(k.ip) : ""])]);
  }
  const adet = Math.max(1, Math.min(500, Number(u.searchParams.get("adet")) || 200));
  return tamam({ kayitlar: l.slice(0, adet).map((k) => ({ ...k, ...(k.ip ? { ip: ipGizle(k.ip) } : {}) })), toplam: l.length });
}
