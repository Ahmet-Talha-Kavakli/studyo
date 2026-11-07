import { belirtecUret } from "@/lib/hesap/belirtec";
import { hesapGuncelle } from "@/lib/hesap/depo";
import { cerezYaz } from "@/lib/hesap/oturum";
import { istekKokeni } from "@/lib/hesap/guvenlik";
import { rolYukselt } from "@/lib/hesap/hesap";
import { OAUTH_CEREZI, disKimlikEsle, oauthDonus } from "@/lib/hesap/oauth";
import { bekleyenCerezi, oturumAc } from "@/lib/hesap/oturum";
import { SAGLAYICILAR, SAGLAYICI_AD, type SaglayiciKimligi } from "@/lib/hesap/tipler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Baglam = { params: Promise<{ saglayici: string }> };

/** 303: Apple'ın form POST'u da tarayıcıda GET'e döner. */
function yonlendir(req: Request, yol: string, cerezler: string[]) {
  const h = new Headers({ Location: `${istekKokeni(req)}${yol}`, "Cache-Control": "no-store" });
  for (const c of [...cerezler, cerezYaz(OAUTH_CEREZI, "", 0, { yol: "/api/hesap/oauth" })]) h.append("Set-Cookie", c);
  return new Response(null, { status: 303, headers: h });
}
const ekle = (yol: string, q: Record<string, string>) => `${yol}${yol.includes("?") ? "&" : "?"}${new URLSearchParams(q)}`;

/**
 * Sağlayıcı dönüşü (Google ve Microsoft GET, Apple form POST). Durum belirteci ve tarayıcı bağı doğrulanır.
 * Başarıda oturum açılır ve giriş ekranına döner (orada hesap eşitlenip hedef yola gidilir); iki adım açıksa kod istenir.
 * Bu uç köken denetiminden muaftır: isteği sağlayıcının sitesi gönderir, koruma tek kullanımlık state'tedir.
 */
async function isle(req: Request, b: Baglam) {
  const s = (await b.params).saglayici as SaglayiciKimligi;
  if (!SAGLAYICILAR.includes(s)) return yonlendir(req, "/giris?hata=dogrulanamadi", []);
  const d = await oauthDonus(req, s);
  if (!d.ok) return yonlendir(req, ekle("/giris", { hata: d.kod, s, geri: d.geri }), []);
  const e = await disKimlikEsle(req, d.kimlik, d.bagla);
  if (!e.ok) {
    if (d.bagla) return yonlendir(req, ekle(d.geri, { "oauth-hata": e.kod, s }), []);
    return yonlendir(req, ekle("/giris", { hata: e.kod, s, geri: d.geri }), []);
  }
  if (e.baglandi) return yonlendir(req, ekle(d.geri, { baglandi: s }), []);
  const yontem = SAGLAYICI_AD[s];
  if (e.hesap.ikiAdim) {
    const bekleyen = await belirtecUret("iki-adim", { uid: e.hesap.uid, yontem }, 5 * 60_000);
    return yonlendir(req, ekle("/giris", { adim: "iki-adim", geri: d.geri, ...(e.yeni ? { yeni: "1" } : {}) }), [bekleyenCerezi(bekleyen)]);
  }
  const o = await oturumAc(req, e.hesap.uid, yontem);
  if (!o) return yonlendir(req, ekle("/giris", { hata: "dogrulanamadi", s, geri: d.geri }), []);
  await hesapGuncelle(e.hesap.uid, rolYukselt);
  return yonlendir(req, ekle("/giris", { oauth: "tamam", geri: d.geri, ...(e.yeni ? { yeni: "1" } : {}) }), [o.cerez]);
}

export const GET = isle;
export const POST = isle;
