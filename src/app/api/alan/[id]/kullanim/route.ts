import { hata, tamam } from "@/lib/hesap/guvenlik";
import { kisiAdi } from "@/lib/alan/depo";
import { kullanimOku, urunBul } from "@/lib/alan/kredi";
import { alanBaglam, csvTarih, csvYanit, saatDilimi } from "@/lib/alan/uc";
import { ROL_AD, ROL_SIRA, URUN_AD, type AlanUrun } from "@/lib/alan/tipler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const GUN = 86_400_000;

/**
 * GET ?gun=7|30|90  kullanım raporu: ürüne göre toplam, üye başına (ürün kırılımıyla), günlük seri, son hareketler.
 * GET ?csv=hareket  bütün harcama ve iadeler (CSV, yalnız sahip ve yönetici)
 * GET ?csv=uye      seçili aralıkta üye başına özet (CSV, yalnız sahip ve yönetici)
 */
export async function GET(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id);
  if (b instanceof Response) return b;
  const u = new URL(req.url);
  const gun = [7, 30, 90, 365].includes(Number(u.searchParams.get("gun"))) ? Number(u.searchParams.get("gun")) : 30;
  const csv = u.searchParams.get("csv");
  const yonetici = ROL_SIRA[b.uye.rol] >= ROL_SIRA.yonetici;
  const kayitlar = await kullanimOku(b.alan.id);
  const adlar = new Map<string, { ad: string; email: string }>();
  const ad = async (uid: string) => {
    if (!adlar.has(uid)) { const k = await kisiAdi(uid); adlar.set(uid, k ? { ad: k.ad, email: k.email } : { ad: "Silinmiş hesap", email: "" }); }
    return adlar.get(uid)!;
  };
  const tz = saatDilimi(u.searchParams.get("tz"));
  const tarih = (z: number) => csvTarih(z, tz);

  if (csv) {
    if (!yonetici) return hata("Dışa aktarım yalnız sahip ve yöneticilere açık.", 403, { kod: "yetki" });
    const dosya = `${b.alan.ad.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}-kullanim`;
    if (csv === "hareket") {
      const satir: unknown[][] = [[`Tarih (${tz})`, "Üye", "E-posta", "Ürün", "Kaynak", "Açıklama", "Kredi", "Tür"]];
      for (const k of kayitlar) { const a = await ad(k.uid); satir.push([tarih(k.z), a.ad, a.email, URUN_AD[urunBul(k.k)], k.k, k.a, k.m, k.i ? "İade" : "Harcama"]); }
      return csvYanit(`${dosya}-hareketler.csv`, satir);
    }
    const bas = Date.now() - gun * GUN;
    const m = new Map<string, Record<AlanUrun, number>>();
    for (const k of kayitlar) {
      if (k.z < bas) continue;
      const v = m.get(k.uid) ?? { studyo: 0, build: 0, api: 0, diger: 0 };
      v[urunBul(k.k)] += k.m;
      m.set(k.uid, v);
    }
    const satir: unknown[][] = [["Üye", "E-posta", "Rol", "Aylık sınır", "Stüdyolar", "Vayra Build", "API", "Diğer", "Toplam"]];
    for (const uy of b.alan.uyeler) {
      const a = await ad(uy.uid), v = m.get(uy.uid) ?? { studyo: 0, build: 0, api: 0, diger: 0 };
      const sinir = uy.sinir ?? b.alan.varsayilanSinir;
      satir.push([a.ad, a.email, ROL_AD[uy.rol], sinir === null ? "Sınırsız" : sinir, v.studyo, v.build, v.api, v.diger, v.studyo + v.build + v.api + v.diger]);
    }
    return csvYanit(`${dosya}-uyeler-${gun}-gun.csv`, satir);
  }

  const simdi = new Date();
  const bugun = Date.UTC(simdi.getUTCFullYear(), simdi.getUTCMonth(), simdi.getUTCDate());
  const bas = bugun - (gun - 1) * GUN;
  const urunler: Record<AlanUrun, number> = { studyo: 0, build: 0, api: 0, diger: 0 };
  const uyeler = new Map<string, { urun: Record<AlanUrun, number>; adet: number; iade: number }>();
  const seri = Array.from({ length: gun }, (_, i) => ({ gun: bas + i * GUN, studyo: 0, build: 0, api: 0, diger: 0 }));
  let onceki = 0;
  for (const k of kayitlar) {
    if (k.z >= bas - gun * GUN && k.z < bas) onceki += k.m;
    if (k.z < bas) continue;
    const ur = urunBul(k.k);
    urunler[ur] += k.m;
    const v = uyeler.get(k.uid) ?? { urun: { studyo: 0, build: 0, api: 0, diger: 0 }, adet: 0, iade: 0 };
    v.urun[ur] += k.m;
    if (k.i) v.iade += -k.m; else v.adet += 1;
    uyeler.set(k.uid, v);
    const s = seri[Math.min(gun - 1, Math.floor((k.z - bas) / GUN))];
    if (s) s[ur] += k.m;
  }
  const uyeListe = [];
  for (const [uid, v] of uyeler) {
    const a = await ad(uid);
    const uy = b.alan.uyeler.find((x) => x.uid === uid);
    uyeListe.push({ uid, ad: a.ad, rol: uy?.rol ?? null, urun: v.urun, toplam: v.urun.studyo + v.urun.build + v.urun.api + v.urun.diger, adet: v.adet, iade: v.iade, ben: uid === b.h.uid });
  }
  uyeListe.sort((x, y) => y.toplam - x.toplam);
  const son = [];
  for (const k of kayitlar.slice(-80).reverse()) son.push({ zaman: k.z, uid: k.uid, ad: (await ad(k.uid)).ad, miktar: k.m, urun: urunBul(k.k), kaynak: k.k, aciklama: k.a, ...(k.i ? { iade: true } : {}) });
  const toplam = urunler.studyo + urunler.build + urunler.api + urunler.diger;
  return tamam({ gun, toplam, onceki, urunler, uyeler: uyeListe, seri, son, csv: yonetici });
}
