import { randomBytes } from "crypto";
import { resolveTxt } from "dns/promises";
import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import {
  ALAN_ADI_DESENI, AlanHatasi, GENEL_ALANLAR, alanAdiDiziniYaz, alanAdiSahibi, alanGuncelle, alanOku, epostaAlanAdi, gunlukEkle,
} from "@/lib/alan/depo";
import { alanAyrintisi, alanBaglam, alanHataYanit, kisiAd } from "@/lib/alan/uc";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Alan adıyla katılım (sahip ve yönetici).
 *  { islem: "ekle", alan }  alan adını ekler. Ekleyenin doğrulanmış e-postası bu alan adındaysa hemen doğrulanır;
 *                           değilse DNS'e _vayra.<alan adı> TXT kaydı (vayra-dogrulama=<değer>) yazılması istenir.
 *  { islem: "dogrula" }     DNS TXT kaydını denetler.
 *  { islem: "ayar", acik?, rol? }  katılımı aç ya da kapat, katılanların rolü (üye ya da izleyici).
 * DELETE                    alan adını kaldırır.
 * Gmail, Outlook gibi herkese açık e-posta alan adları eklenemez; bir alan adı yalnız bir çalışma alanında doğrulanır.
 */
export async function POST(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "yonetici");
  if (b instanceof Response) return b;
  const bekle = hizSiniri(`alan-alanadi:${b.alan.id}`, 30, 3_600_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<{ islem?: string; alan?: string; acik?: boolean; rol?: string }>(req);
  const kim = { uid: b.h.uid, ad: kisiAd(b.h) };
  try {
    if (g?.islem === "ekle") {
      const ad = String(g.alan ?? "").trim().toLowerCase().replace(/^@/, "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!ALAN_ADI_DESENI.test(ad)) throw new AlanHatasi("Alan adı geçerli değil. Örnek biçim: sirketin.com", 400, "alan");
      if (GENEL_ALANLAR.has(ad)) throw new AlanHatasi("Herkese açık e-posta servislerinin alan adı eklenemez; şirketinin kendi alan adını yaz.", 400, "genel");
      const sahibi = await alanAdiSahibi(ad);
      if (sahibi && sahibi !== b.alan.id) throw new AlanHatasi("Bu alan adı başka bir çalışma alanında doğrulanmış.", 409, "alinmis");
      const epostayla = b.h.epostaDogrulandi && epostaAlanAdi(b.h.email) === ad;
      await alanGuncelle(b.alan.id, async (a) => {
        if (a.alanAdi && a.alanAdi.alan !== ad && (await alanAdiSahibi(a.alanAdi.alan)) === a.id) await alanAdiDiziniYaz(a.alanAdi.alan, null);
        a.alanAdi = { alan: ad, txt: randomBytes(12).toString("base64url"), acik: a.alanAdi?.acik ?? true, rol: a.alanAdi?.rol ?? "uye", ...(epostayla ? { yontem: "eposta" as const, dogrulandi: Date.now() } : {}) };
        if (epostayla) await alanAdiDiziniYaz(ad, a.id);
      });
      await gunlukEkle(b.alan.id, "alanadi", kim, `@${ad} eklendi${epostayla ? ", doğrulanmış e-postayla doğrulandı" : ", DNS doğrulaması bekliyor"}`, b.ip);
    } else if (g?.islem === "dogrula") {
      const ad = b.alan.alanAdi?.alan;
      if (!ad) throw new AlanHatasi("Önce bir alan adı ekle.");
      if (b.alan.alanAdi?.dogrulandi) return tamam({ alan: await alanAyrintisi(b.alan, b.h.uid) });
      const beklenen = `vayra-dogrulama=${b.alan.alanAdi!.txt}`;
      const kayitlar: string[] = [];
      for (const ad2 of [`_vayra.${ad}`, ad]) { try { for (const r of await resolveTxt(ad2)) kayitlar.push(r.join("")); } catch { /* kayıt yok */ } }
      if (!kayitlar.some((k) => k.trim() === beklenen)) throw new AlanHatasi(`TXT kaydı bulunamadı. DNS'e _vayra.${ad} adıyla "${beklenen}" değerini ekle; yayılması birkaç dakika sürebilir.`, 409, "dns");
      const sahibi = await alanAdiSahibi(ad);
      if (sahibi && sahibi !== b.alan.id) throw new AlanHatasi("Bu alan adı başka bir çalışma alanında doğrulanmış.", 409, "alinmis");
      await alanGuncelle(b.alan.id, async (a) => { if (a.alanAdi?.alan === ad) { a.alanAdi.dogrulandi = Date.now(); a.alanAdi.yontem = "dns"; await alanAdiDiziniYaz(ad, a.id); } });
      await gunlukEkle(b.alan.id, "alanadi", kim, `@${ad} DNS kaydıyla doğrulandı`, b.ip);
    } else if (g?.islem === "ayar") {
      const degisen: string[] = [];
      await alanGuncelle(b.alan.id, (a) => {
        if (!a.alanAdi) throw new AlanHatasi("Önce bir alan adı ekle.");
        if (typeof g.acik === "boolean" && g.acik !== a.alanAdi.acik) { a.alanAdi.acik = g.acik; degisen.push(`katılım ${g.acik ? "açıldı" : "kapatıldı"}`); }
        if ((g.rol === "uye" || g.rol === "izleyici") && g.rol !== a.alanAdi.rol) { a.alanAdi.rol = g.rol; degisen.push(`katılanların rolü ${g.rol === "uye" ? "Üye" : "İzleyici"}`); }
      });
      if (degisen.length) await gunlukEkle(b.alan.id, "alanadi", kim, degisen.join(", "), b.ip);
    } else return hata("İşlem tanınmadı.");
    return tamam({ alan: await alanAyrintisi((await alanOku(b.alan.id))!, b.h.uid) });
  } catch (e) { return alanHataYanit(e); }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "yonetici");
  if (b instanceof Response) return b;
  try {
    const ad = await alanGuncelle(b.alan.id, async (a) => {
      const x = a.alanAdi?.alan;
      if (x && (await alanAdiSahibi(x)) === a.id) await alanAdiDiziniYaz(x, null);
      delete a.alanAdi;
      return x;
    });
    if (ad.sonuc) await gunlukEkle(b.alan.id, "alanadi", { uid: b.h.uid, ad: kisiAd(b.h) }, `@${ad.sonuc} kaldırıldı`, b.ip);
    return tamam({ alan: await alanAyrintisi((await alanOku(b.alan.id))!, b.h.uid) });
  } catch (e) { return alanHataYanit(e); }
}
