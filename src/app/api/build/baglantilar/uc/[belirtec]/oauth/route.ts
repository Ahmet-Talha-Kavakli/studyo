import { baglantiHam, etkinAdres, kendiIstemci } from "@/lib/build/baglantiDepo";
import { ADAPTORLER } from "@/lib/build/baglantiAdaptorTanim";
import { katalogBul } from "@/lib/build/baglantiKatalog";
import { ucBelirtecCoz } from "@/lib/build/baglantiUcDepo";
import { mcpBaglan, McpHata } from "@/lib/build/mcpIstemci";
import { cimdKimligi, istekKokeni, istemciKaydet, OAUTH_DONUS_YOLU, oauthKesfet, yetkiBaslat, type OauthAyar } from "@/lib/build/mcpOauth";
import { hata } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ belirtec: string }> };

/**
 * Uç kullanıcı OAuth girişini başlatır. İstemci: sahibin bağlantısında kayıtlı istemci (aynı geri dönüş adresi), yoksa
 * sahibin kendi istemcisi, yoksa yayınlanmış kimlik (CIMD) ya da otomatik kayıt. Belirteçler kullanıcının hesabına yazılır.
 */
export async function POST(req: Request, { params }: Ctx) {
  const t = ucBelirtecCoz((await params).belirtec);
  if (!t || t.suresiDoldu) return hata("Bağlanma adresinin süresi doldu ya da geçersiz.", 410);
  const b = await baglantiHam(t.b, t.s);
  if (!b?.ucKullanici?.acik) return hata("Bu servis artık kullanıcı hesabı kabul etmiyor.", 404);
  const k = katalogBul(b.katalogId);
  const kok = istekKokeni(req);
  const donus = `${kok}${OAUTH_DONUS_YOLU}`;
  const ist = kendiIstemci(b);
  let ayar: OauthAyar;
  if (k?.adaptor) {
    const o = ADAPTORLER[k.adaptor].oauth;
    if (!o || !ist) return hata("Bu servisin girişi için uygulama sahibinin OAuth istemcisi gerekli.", 422);
    ayar = { yetkiUrl: o.yetkiUrl, tokenUrl: o.tokenUrl, istemciId: ist.id, istemciGizli: ist.gizli, kaynak: "", kapsam: o.kapsam };
  } else if (b.yetki.oauth && !(b.yetki.oauth.istemciId.startsWith("https://") && !cimdKimligi(kok))) ayar = b.yetki.oauth;
  else {
    const url = etkinAdres(b);
    let meta: string | undefined;
    try { await mcpBaglan(url, {}); } catch (e) { if (e instanceof McpHata) meta = e.yetkiAdresi; }
    const kf = await oauthKesfet(url, meta);
    if (!kf) return hata("Bu servisin giriş bilgisi bulunamadı.", 422);
    let istemci: { istemciId: string; istemciGizli?: string } | null = ist ? { istemciId: ist.id, istemciGizli: ist.gizli } : null;
    if (!istemci && kf.cimd && cimdKimligi(kok)) istemci = { istemciId: cimdKimligi(kok)! };
    if (!istemci && kf.kayit) istemci = await istemciKaydet(kf.kayit, donus);
    if (!istemci) return hata("Servis Vayra'yı istemci olarak kabul etmedi; uygulama sahibi kendi OAuth istemcisini girmeli.", 428);
    ayar = { yetkiUrl: kf.yetki, tokenUrl: kf.token, istemciId: istemci.istemciId, istemciGizli: istemci.istemciGizli, kaynak: kf.kaynak, kapsam: kf.kapsamlar?.join(" ") };
  }
  const adres = await yetkiBaslat({ ...ayar, sahip: "", baglantiId: b.id, donus, uc: { kullanici: t.u, sahipOz: t.s } });
  return Response.json({ ok: true, adres });
}
