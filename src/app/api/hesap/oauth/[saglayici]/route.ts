import { cihazAdi, hata, hizSiniri, istemciIp, istekKokeni, tamam } from "@/lib/hesap/guvenlik";
import { guvenliYol, oauthBaslat, saglayiciKaldir } from "@/lib/hesap/oauth";
import { oturumOku } from "@/lib/hesap/oturum";
import { SAGLAYICILAR, type SaglayiciKimligi } from "@/lib/hesap/tipler";
import { oturumGerekli } from "@/lib/hesap/yetki";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Baglam = { params: Promise<{ saglayici: string }> };
const sagla = async (b: Baglam) => { const s = (await b.params).saglayici as SaglayiciKimligi; return SAGLAYICILAR.includes(s) ? s : null; };

function yonlendir(req: Request, yol: string, cerezler: string[] = []) {
  const h = new Headers({ Location: yol.startsWith("http") ? yol : `${istekKokeni(req)}${yol}`, "Cache-Control": "no-store" });
  for (const c of cerezler) h.append("Set-Cookie", c);
  return new Response(null, { status: 302, headers: h });
}

/**
 * Sosyal girişi başlatır: ?geri=/yol (dönüşte gidilecek site içi yol), ?bagla=1 (oturumdaki hesaba bağla).
 * Sağlayıcı kurulu değilse giriş ekranına "kurulu değil" hatasıyla döner.
 */
export async function GET(req: Request, b: Baglam) {
  const s = await sagla(b);
  const q = new URL(req.url).searchParams;
  const geri = guvenliYol(q.get("geri"));
  const bagla = q.get("bagla") === "1";
  if (!s) return yonlendir(req, `/giris?hata=dogrulanamadi&geri=${encodeURIComponent(geri)}`);
  if (hizSiniri(`oauth:ip:${istemciIp(req)}`, 30, 600_000)) return yonlendir(req, `/giris?hata=hiz&s=${s}&geri=${encodeURIComponent(geri)}`);
  let uid: string | undefined;
  if (bagla) {
    const o = await oturumOku(req);
    if (!o) return yonlendir(req, `/giris?geri=${encodeURIComponent(geri)}`);
    uid = o.hesap.uid;
  }
  const r = await oauthBaslat(req, s, { geri, bagla: uid });
  if (!r) return yonlendir(req, bagla ? `${geri}${geri.includes("?") ? "&" : "?"}oauth-hata=kurulu-degil&s=${s}` : `/giris?hata=kurulu-degil&s=${s}&geri=${encodeURIComponent(geri)}`);
  return yonlendir(req, r.adres, [r.cerez]);
}

/** Sağlayıcı bağını kaldırır (hesapta başka giriş yolu kalıyorsa). */
export async function DELETE(req: Request, b: Baglam) {
  const s = await sagla(b);
  if (!s) return hata("Sağlayıcı tanınmadı.", 404);
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const r = await saglayiciKaldir(o.hesap.uid, s, cihazAdi(req));
  if (r === "son-yol") return hata("Bu, hesabına girmenin tek yolu. Kaldırmadan önce bir şifre belirle.", 409, { kod: "son-yol" });
  if (r === "yok") return hata("Bu sağlayıcı hesabına bağlı değil.", 404);
  return tamam({});
}
