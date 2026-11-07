import { baglantiGetir, baglantiGuncelle, etkinAdres, kendiIstemci } from "@/lib/build/baglantiDepo";
import { ADAPTORLER } from "@/lib/build/baglantiAdaptorTanim";
import { katalogBul } from "@/lib/build/baglantiKatalog";
import { mcpBaglan, McpHata } from "@/lib/build/mcpIstemci";
import { cimdKimligi, istekKokeni, istemciKaydet, OAUTH_DONUS_YOLU, oauthKesfet, yetkiBaslat, type OauthAyar } from "@/lib/build/mcpOauth";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * OAuth girişini başlatır. İstemci kimliği seçimi: kullanıcı kendi istemcisini girdiyse o; değilse yetkilendirme
 * sunucusu destekliyorsa Vayra'nın yayınlanmış kimliği (CIMD, yalnız https kökende); değilse dinamik kayıt (DCR).
 * Hiçbiri yoksa kendi OAuth uygulamanı girmen istenir. Paraşüt gibi OAuth'lu adaptörlerde uç noktalar sabittir.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const b = await baglantiGetir(id, sahip);
  if (!b) return hata("Bağlantı bulunamadı.", 404);
  const k = katalogBul(b.katalogId);
  const kok = istekKokeni(req);
  const donus = `${kok}${OAUTH_DONUS_YOLU}`;
  const ist = kendiIstemci(b);
  let ayar: OauthAyar;
  if (k?.adaptor) {
    const o = ADAPTORLER[k.adaptor].oauth;
    if (!o) return hata("Bu servis anahtarla bağlanır.", 422);
    if (!ist) return hata(`${k.ad} için kendi istemci kimliğini ve sırrını gir.`, 422);
    ayar = { yetkiUrl: o.yetkiUrl, tokenUrl: o.tokenUrl, istemciId: ist.id, istemciGizli: ist.gizli, kaynak: "", kapsam: o.kapsam };
  } else {
    const url = etkinAdres(b);
    // 401 yanıtındaki kaynak meta verisi adresi en doğru keşif başlangıcıdır.
    let meta: string | undefined;
    try { await mcpBaglan(url, {}); } catch (e) { if (e instanceof McpHata) meta = e.yetkiAdresi; }
    const kf = await oauthKesfet(url, meta);
    if (!kf) return hata("Bu sunucunun giriş bilgisi bulunamadı. Servis erişim anahtarı veriyorsa anahtarla bağlan.", 422);
    let istemci: { istemciId: string; istemciGizli?: string } | null = null;
    if (ist) istemci = { istemciId: ist.id, istemciGizli: ist.gizli };
    else if (b.yetki.oauth && b.yetki.oauth.tokenUrl === kf.token && !(b.yetki.oauth.istemciId.startsWith("https://") && !cimdKimligi(kok))) istemci = { istemciId: b.yetki.oauth.istemciId, istemciGizli: b.yetki.oauth.istemciGizli };
    else if (kf.cimd && cimdKimligi(kok)) istemci = { istemciId: cimdKimligi(kok)! };
    else if (kf.kayit) {
      istemci = await istemciKaydet(kf.kayit, donus);
      if (!istemci) return hata(`${b.ad} Vayra'yı istemci olarak kaydetmedi. Kendi OAuth uygulamanın kimliğini gir ya da anahtarla bağlan.`, 422);
    } else return hata(`${b.ad} otomatik istemci kaydını desteklemiyor. ${k?.istemciIpucu ? `Kendi OAuth uygulamanı oluştur (${k.istemciIpucu}) ve kimliğini gir.` : "Kendi OAuth uygulamanın kimliğini gir ya da anahtarla bağlan."}`, 428);
    ayar = { yetkiUrl: kf.yetki, tokenUrl: kf.token, istemciId: istemci.istemciId, istemciGizli: istemci.istemciGizli, kaynak: kf.kaynak, kapsam: kf.kapsamlar?.join(" ") };
  }
  await baglantiGuncelle(id, sahip, (x) => { x.yetki.tur = "oauth"; x.yetki.oauth = ayar; });
  const adres = await yetkiBaslat({ ...ayar, sahip, baglantiId: id, donus });
  return Response.json({ ok: true, adres, donus });
}
