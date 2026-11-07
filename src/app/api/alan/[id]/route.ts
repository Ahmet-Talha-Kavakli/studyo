import { govdeOku, hata, tamam } from "@/lib/hesap/guvenlik";
import { AlanHatasi, adTemizle, alanGuncelle, alanOku, gunlukEkle, logoKaydet, logoSil } from "@/lib/alan/depo";
import { alanCerezi } from "@/lib/alan/etkin";
import { alaniSil } from "@/lib/alan/islem";
import { alanAyrintisi, alanBaglam, alanHataYanit, kisiAd } from "@/lib/alan/uc";
import { ROL_SIRA } from "@/lib/alan/tipler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** GET: alan ayrıntısı (üyeler, davetler, kredi, ayarlar). */
export async function GET(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id);
  if (b instanceof Response) return b;
  return tamam({ alan: await alanAyrintisi(b.alan, b.h.uid) });
}

const sinirOku = (v: unknown): number | null | undefined => {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < 0 || n > 10_000_000) throw new AlanHatasi("Sınır 0 ile 10.000.000 arasında bir tam sayı olmalı.");
  return n;
};

/** PATCH { ad?, logo? (data URL ya da ""), varsayilanSinir? (null sınırsız), ayar? } yalnız sahip ve yönetici. */
export async function PATCH(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "yonetici");
  if (b instanceof Response) return b;
  const g = await govdeOku<{ ad?: string; logo?: string; varsayilanSinir?: unknown; ayar?: { uyeDavet?: boolean; yeniProjeAlana?: boolean } }>(req, 700_000);
  if (!g) return hata("Geçersiz istek.");
  try {
    const degisen: string[] = [];
    let logo: string | undefined;
    if (typeof g.logo === "string") logo = g.logo ? await logoKaydet(b.alan.id, g.logo) : "";
    const vs = sinirOku(g.varsayilanSinir);
    await alanGuncelle(b.alan.id, async (a) => {
      if (g.ad !== undefined) {
        const ad = adTemizle(g.ad);
        if (ad.length < 2) throw new AlanHatasi("Alana en az 2 karakterlik bir ad ver.", 400, "ad");
        if (ad !== a.ad) { degisen.push(`ad: "${a.ad}" yerine "${ad}"`); a.ad = ad; }
      }
      if (logo !== undefined) {
        if (!logo) { await logoSil(a.id); delete a.logo; degisen.push("logo kaldırıldı"); } else { a.logo = logo; degisen.push("logo değişti"); }
      }
      if (vs !== undefined && vs !== a.varsayilanSinir) {
        a.varsayilanSinir = vs;
        degisen.push(vs === null ? "varsayılan üye sınırı kaldırıldı" : `varsayılan üye sınırı aylık ${vs} kredi`);
      }
      if (g.ayar && typeof g.ayar === "object") {
        if (typeof g.ayar.uyeDavet === "boolean" && g.ayar.uyeDavet !== a.ayar.uyeDavet) { a.ayar.uyeDavet = g.ayar.uyeDavet; degisen.push(`üyeler davet ${g.ayar.uyeDavet ? "edebilir" : "edemez"}`); }
        if (typeof g.ayar.yeniProjeAlana === "boolean" && g.ayar.yeniProjeAlana !== a.ayar.yeniProjeAlana) { a.ayar.yeniProjeAlana = g.ayar.yeniProjeAlana; degisen.push(`yeni Build projeleri ${g.ayar.yeniProjeAlana ? "alana eklenir" : "kişisel kalır"}`); }
      }
    });
    if (degisen.length) await gunlukEkle(b.alan.id, degisen.some((d) => d.includes("sınır")) ? "sinir" : "ayar", { uid: b.h.uid, ad: kisiAd(b.h) }, degisen.join(", "), b.ip);
    return tamam({ alan: await alanAyrintisi((await alanOku(b.alan.id))!, b.h.uid) });
  } catch (e) { return alanHataYanit(e); }
}

/** DELETE { onay: "<alan adı>" } yalnız sahip. Kalan ek kredi sahibin kişisel bakiyesine döner. */
export async function DELETE(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "sahip");
  if (b instanceof Response) return b;
  const g = await govdeOku<{ onay?: string }>(req);
  if (String(g?.onay ?? "").trim() !== b.alan.ad) return hata("Onay için alanın adını aynen yaz.", 400, { alan: "onay" });
  if (ROL_SIRA[b.uye.rol] < ROL_SIRA.sahip) return hata("Alanı yalnız sahibi silebilir.", 403);
  try {
    const r = await alaniSil(b.alan.id, b.h, { neden: `${kisiAd(b.h)} alanı sildi` });
    return tamam({ silindi: true, iade: r.iade }, 200, { "Set-Cookie": alanCerezi("kisisel") });
  } catch (e) { return alanHataYanit(e); }
}
