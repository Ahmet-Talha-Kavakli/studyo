import { hizSiniri, istemciIp } from "@/lib/hesap/guvenlik";
import { SIPARIS_DESENI } from "@/lib/odeme/depo";
import { iyzicoSonucIsle } from "@/lib/odeme/motor";
import { yonlendir } from "@/lib/odeme/uc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * iyzico Ödeme Formu dönüşü (callbackUrl). iyzico tarayıcıyı form gönderimiyle (token) buraya yollar. Gövdeye güvenilmez:
 * belirteç siparişteki belirteçle karşılaştırılır, sonuç iyzico'dan sunucuda sorgulanır. Ardından sonuç sayfasına gidilir.
 * Oturum çerezi gerekmez (başka siteden gelen POST'ta çerez gelmez); sipariş numarası ve belirteç eşleşmesi yeter.
 */
async function isle(req: Request, token: string) {
  const no = new URL(req.url).searchParams.get("s") ?? "";
  if (!SIPARIS_DESENI.test(no)) return yonlendir(req, "/odeme/sonuc?hata=siparis");
  if (hizSiniri(`iyzico-donus:${istemciIp(req)}`, 60, 600_000)) return yonlendir(req, `/odeme/sonuc?s=${no}`);
  try { await iyzicoSonucIsle(no, token, "Dönüş"); } catch (e) { console.error("[odeme-iyzico-donus]", (e as Error).message); }
  return yonlendir(req, `/odeme/sonuc?s=${no}`);
}

export async function POST(req: Request) {
  let token = "";
  try {
    const t = req.headers.get("content-type") ?? "";
    if (t.includes("application/json")) token = String(((await req.json()) as { token?: string }).token ?? "");
    else token = String((await req.formData()).get("token") ?? "");
  } catch { /* boş gövde */ }
  return isle(req, token.slice(0, 200));
}

export async function GET(req: Request) {
  return isle(req, (new URL(req.url).searchParams.get("token") ?? "").slice(0, 200));
}
