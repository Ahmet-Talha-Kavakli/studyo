import { govdeOku, hata, tamam } from "@/lib/hesap/guvenlik";
import { denemeAcik } from "@/lib/odeme/ayar";
import { SIPARIS_DESENI, siparisOku } from "@/lib/odeme/depo";
import { siparisOzeti, sonucIsle } from "@/lib/odeme/motor";
import { baglamAl, hataYanit } from "@/lib/odeme/uc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Deneme ödemesi: yalnız ödeme sağlayıcısı bağlı değilken ve geliştirmede ya da VAYRA_DENEME_ODEME=1 iken. Kart istenmez,
 * para çekilmez; sipariş ve makbuz "Deneme ödemesi" olarak işaretlidir. Sonuç: basarili | basarisiz | iptal.
 */
export async function GET(req: Request) {
  const b = await baglamAl(req);
  if (b instanceof Response) return b;
  const no = new URL(req.url).searchParams.get("s") ?? "";
  const s = SIPARIS_DESENI.test(no) ? await siparisOku(no) : null;
  if (!s || s.uid !== b.uid || s.saglayici !== "deneme") return hata("Sipariş bulunamadı.", 404);
  return tamam({ siparis: siparisOzeti(s), acik: denemeAcik() });
}

export async function POST(req: Request) {
  const b = await baglamAl(req);
  if (b instanceof Response) return b;
  if (!denemeAcik()) return hata("Deneme ödemesi bu sunucuda kapalı.", 403, { kod: "kapali" });
  const g = await govdeOku<{ no?: string; sonuc?: string }>(req, 1_000);
  const no = String(g?.no ?? "");
  const s = SIPARIS_DESENI.test(no) ? await siparisOku(no) : null;
  if (!s || s.uid !== b.uid || s.saglayici !== "deneme") return hata("Sipariş bulunamadı.", 404);
  try {
    const r = g?.sonuc === "basarili"
      ? await sonucIsle(no, { durum: "odendi", olay: "Deneme ödemesi onaylandı", alanlar: { saglayiciKimligi: `deneme-${no.slice(2, 10)}`, kart: "Deneme ödemesi, kart kullanılmadı" } })
      : await sonucIsle(no, { durum: "basarisiz", olay: g?.sonuc === "iptal" ? "Deneme ödemesinden vazgeçildi" : "Deneme ödemesi reddedildi", alanlar: { hata: g?.sonuc === "iptal" ? "Ödemeden vazgeçildi" : "Kart reddedildi (deneme)" } });
    return tamam({ siparis: siparisOzeti(r) });
  } catch (e) { return hataYanit(e, "odeme-deneme"); }
}
