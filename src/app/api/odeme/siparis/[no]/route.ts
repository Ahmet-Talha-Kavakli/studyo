import { hata, tamam } from "@/lib/hesap/guvenlik";
import { oturumOku } from "@/lib/hesap/oturum";
import { krediOzeti } from "@/lib/hesap/kredi";
import { SIPARIS_DESENI, siparisOku } from "@/lib/odeme/depo";
import { abonelikDenetle, siparisOzeti, siparisSorgula } from "@/lib/odeme/motor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Siparişin durumu (yalnız sahibi). Bekliyorsa sağlayıcıdan yeniden sorgulanır. Güncel kredi özeti de döner. */
export async function GET(req: Request, { params }: { params: Promise<{ no: string }> }) {
  const o = await oturumOku(req);
  if (!o) return hata("Oturum açık değil. Giriş yap.", 401, { kod: "oturum" });
  const { no } = await params;
  if (!SIPARIS_DESENI.test(no)) return hata("Sipariş bulunamadı.", 404);
  const ilk = await siparisOku(no);
  if (!ilk || ilk.uid !== o.hesap.uid) return hata("Sipariş bulunamadı.", 404);
  const s = (await siparisSorgula(no).catch(() => null)) ?? ilk;
  if (s.durum === "odendi" && s.tur === "plan") await abonelikDenetle(o.hesap.uid).catch(() => {});
  return tamam({ siparis: siparisOzeti(s), kredi: await krediOzeti(o.hesap.uid, o.hesap.plan) });
}
