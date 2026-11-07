import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import { krediOzeti, sonHareketler } from "@/lib/hesap/kredi";
import { alanOku } from "@/lib/alan/depo";
import { alanKrediBilgisi, krediAktar } from "@/lib/alan/kredi";
import { alanBaglam, kisiAd } from "@/lib/alan/uc";
import { ROL_SIRA } from "@/lib/alan/tipler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** GET: havuz özeti, üyenin kullanılabilir kredisi, son hareketler (yönetici), kişisel bakiye (aktarım için). */
export async function GET(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id);
  if (b instanceof Response) return b;
  const yonetici = ROL_SIRA[b.uye.rol] >= ROL_SIRA.yonetici;
  const [kredi, hareketler, kisisel] = await Promise.all([
    alanKrediBilgisi(b.alan, b.h.uid),
    yonetici ? sonHareketler(b.alan.id, 60) : Promise.resolve([]),
    krediOzeti(b.h.uid, b.h.plan),
  ]);
  return tamam({ kredi, hareketler, kisiselBakiye: kisisel.bakiye, plan: b.alan.plan, planBitis: b.alan.planBitis ?? null });
}

/** POST { islem: "aktar", miktar } kişisel bakiyeden alan havuzuna (sahip ve yönetici). */
export async function POST(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "yonetici");
  if (b instanceof Response) return b;
  const bekle = hizSiniri(`alan-aktar:${b.h.uid}`, 30, 3_600_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<{ islem?: string; miktar?: number }>(req);
  if (g?.islem !== "aktar") return hata("İşlem tanınmadı.");
  const m = Math.floor(Number(g.miktar));
  if (!Number.isFinite(m) || m < 1 || m > 1_000_000) return hata("Aktarılacak miktar 1 ile 1.000.000 kredi arasında olmalı.", 400, { alan: "miktar" });
  const r = await krediAktar({ alanId: b.alan.id, uid: b.h.uid, plan: b.h.plan, miktar: m, ad: kisiAd(b.h), alanAd: b.alan.ad, ip: b.ip });
  if (!r.ok) return hata(r.neden === "yetersiz" ? `Kişisel bakiyen yetmiyor${typeof r.bakiye === "number" ? `; bakiyende ${r.bakiye} kredi var` : ""}.` : "Aktarım yapılamadı.", r.neden === "yetersiz" ? 402 : 400, { kod: r.neden, bakiye: r.bakiye });
  const a = (await alanOku(b.alan.id))!;
  return tamam({ kisiselBakiye: r.kisisel, kredi: await alanKrediBilgisi(a, b.h.uid) });
}
