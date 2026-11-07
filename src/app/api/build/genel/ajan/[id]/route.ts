import { yayindakiAjan } from "@/lib/build/ajanDepo";
import { alanIzinli } from "@/lib/build/ajanZiyaret";
import { denemeOrtamAjani } from "@/lib/build/ajanOrtam";
import { dosyaKabulListesi } from "@/lib/build/ajanDosya";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-vayra-site" };

export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }

/**
 * Yayındaki ajanın herkese açık kimliği ve kutu görünümü (paylaşım sayfası, web sitesi kutusu, ajan-kutusu.js).
 * Yalnız yayınlanmış sürüm. ?site=<alan> verilirse izinli alan adları denetlenir (kutu o sitede açılmaz).
 */
export async function GET(req: Request, { params }: Ctx) {
  const deneme = new URL(req.url).searchParams.get("ortam") === "deneme";
  const id = (await params).id;
  const y = deneme ? await denemeOrtamAjani(id) : await yayindakiAjan(id);
  if (!y) return Response.json({ ok: false, hata: deneme ? "Bu ajanın deneme ortamı yok." : "Bu ajan yayında değil." }, { status: 404, headers: CORS });
  const site = (new URL(req.url).searchParams.get("site") ?? req.headers.get("x-vayra-site") ?? "").toLowerCase().replace(/^https?:\/\//, "").replace(/[:/].*$/, "");
  const { ayar, ajan } = y;
  if (site && !alanIzinli(ajan.yayin.alanlar, site)) return Response.json({ ok: false, hata: "Bu ajan bu sitede kullanılamaz." }, { status: 403, headers: CORS });
  const k = ajan.yayin.kutu;
  return Response.json({
    ok: true,
    ajan: { id: ajan.id, ad: ayar.ad, aciklama: ayar.aciklama, simge: ayar.simge, karsilama: ayar.karsilama, baslangiclar: k.oneriler ? ayar.baslangiclar : [], surum: deneme ? ajan.yayin.ortam?.deneme?.surum : ajan.yayin.surum }, ortam: deneme ? "deneme" : null,
    kanallar: { sayfa: ajan.yayin.kanallar.sayfa, widget: ajan.yayin.kanallar.widget }, tema: ajan.yayin.tema,
    kutu: { font: k.font, ozelFont: k.ozelFont, konum: k.konum, bosluk: k.bosluk, baslatici: k.baslatici, baslik: k.baslik, proaktif: k.proaktif, form: k.form, aciklama: k.aciklama, gizlilik: k.gizlilik, ses: k.ses, csat: k.csat, begeni: k.begeni, kurallar: k.kurallar, dosya: k.dosya?.acik ? { acik: true, enCokMb: k.dosya.enCokMb, turler: k.dosya.turler, kabul: dosyaKabulListesi(k.dosya.turler) } : undefined },
  }, { headers: { ...CORS, "Cache-Control": deneme ? "no-store" : "public, max-age=30" } });
}
