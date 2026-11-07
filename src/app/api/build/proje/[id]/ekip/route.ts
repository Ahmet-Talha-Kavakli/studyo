import { adGuncelle, davetOlustur, davetSil, ekipBilgisi, ekiptenAyril, rolDegistir, uyeCikar } from "@/lib/build/ekip";
import { davetYolu } from "@/lib/build/ekipOrtak";
import { ekipHataYaniti } from "@/lib/build/ekipRota";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Dışarıdan görünen köken (vekil arkasında x-forwarded-*, yoksa Host başlığı). */
function koken(req: Request) {
  const h = req.headers, u = new URL(req.url);
  return `${h.get("x-forwarded-proto")?.split(",")[0] ?? u.protocol.replace(":", "")}://${h.get("x-forwarded-host")?.split(",")[0] ?? h.get("host") ?? u.host}`;
}

/** Ekip: sahip, üyeler ve rolleri; bekleyen davetler yalnız sahibe. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  try { return Response.json({ ok: true, ...(await ekipBilgisi((await params).id, sahip)) }); }
  catch (e) { return ekipHataYaniti(e); }
}

/**
 * Ekip işlemleri:
 *  { islem: "davet", rol, tekKullanim?, gun? }   sahip: davet bağlantısı oluşturur (gun 1-90, varsayılan 7)
 *  { islem: "rol", oz, rol }                     sahip: üyenin rolünü değiştirir (oz: ekip yanıtındaki genel kimlik)
 *  { islem: "cikar", oz }                        sahip: üyeyi ekipten çıkarır
 *  { islem: "davetSil", kod }                    sahip: daveti iptal eder
 *  { islem: "ayril" }                            üye: ekipten kendisi ayrılır
 *  { islem: "ad", ad }                           herkes: ekipte görünen kendi adını günceller
 * Her yanıtta güncel ekip döner.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  let g: Record<string, unknown>;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  try {
    switch (g.islem) {
      case "davet": {
        const d = await davetOlustur(id, sahip, { rol: g.rol, tekKullanim: g.tekKullanim, gun: g.gun });
        return Response.json({ ok: true, davet: d, yol: davetYolu(d.kod), baglanti: `${koken(req)}${davetYolu(d.kod)}`, ...(await ekipBilgisi(id, sahip)) });
      }
      case "rol": await rolDegistir(id, sahip, g.oz, g.rol); break;
      case "cikar": await uyeCikar(id, sahip, g.oz); break;
      case "davetSil": await davetSil(id, sahip, g.kod); break;
      case "ayril": await ekiptenAyril(id, sahip); return Response.json({ ok: true, ayrildi: true });
      case "ad": await adGuncelle(id, sahip, g.ad); break;
      default: return hata("Bilinmeyen işlem.");
    }
    return Response.json({ ok: true, ...(await ekipBilgisi(id, sahip)) });
  } catch (e) { return ekipHataYaniti(e); }
}
