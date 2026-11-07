import { ajanSayacArtir, yayindakiAjan } from "@/lib/build/ajanDepo";
import { linePush, lineImzaDogru, lineYanitla, type LineOlay } from "@/lib/build/ajanLine";
import { kanalMesaji } from "@/lib/build/ajanMesajKanal";
import { coz } from "@/lib/build/sifre";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const j = (v: unknown, durum = 200) => Response.json(v, { status: durum });

/**
 * LINE Messaging API webhook'u. X-Line-Signature kanal gizli anahtarıyla doğrulanır. Metin mesajlarına yayındaki sürüm
 * yanıt verir: önce yanıt belirteciyle, süresi geçtiyse push ile. Takip (follow) olayına karşılama gönderilir.
 * Yeniden teslim edilen olaylar atlanır. LINE yeniden denemesin diye hemen 200 döner; ?bekle=1 sonucu bekler.
 */
export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).id;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "yerel";
  if (!hizSiniri(`line:${ip}`, 120, 60_000)) return j({ ok: false }, 429);
  const govde = await req.text();
  if (govde.length > 500_000) return j({ ok: false }, 413);
  const y = await yayindakiAjan(id);
  const gizli = coz(y?.ajan.yayin.line?.gizliSifreli);
  if (!y || !gizli || !lineImzaDogru(gizli, govde, req.headers.get("x-line-signature"))) return j({ ok: false }, 401);
  const token = coz(y.ajan.yayin.line.tokenSifreli);
  let o: { events?: LineOlay[] } = {};
  try { o = JSON.parse(govde); } catch { return j({ ok: true }); }
  const olaylar = (o.events ?? []).filter((e) => !e.deliveryContext?.isRedelivery).slice(0, 10);
  if (!olaylar.length) return j({ ok: true });
  ajanSayacArtir(id, (a) => { a.yayin.line = { ...a.yayin.line, sonOlay: Date.now() }; }).catch(() => {});
  if (!token || !y.ajan.yayin.kanallar.line) return j({ ok: true, yok: "kanal kapalı" });
  const bekle = new URL(req.url).searchParams.get("bekle") === "1";
  const yanitlar: string[] = [];
  const isle = async () => {
    const s: unknown[] = [];
    for (const e of olaylar) {
      const alici = e.source?.groupId ?? e.source?.roomId ?? e.source?.userId;
      if (!alici) continue;
      const bas = Date.now();
      const gonder = async (m: string) => {
        yanitlar.push(m);
        if (bekle) return null;
        if (e.replyToken && Date.now() - bas < 50_000) { const h = await lineYanitla(token, e.replyToken, m); if (!h) return null; }
        return linePush(token, alici, m);
      };
      if (e.type === "follow") { s.push({ durum: "karsilama", hata: await gonder(y.ayar.karsilama || `Merhaba! Ben ${y.ayar.ad}. Nasıl yardımcı olabilirim?`) }); continue; }
      if (e.type !== "message") continue;
      if (e.message?.type !== "text" || !e.message.text) { s.push({ durum: "metinsiz", hata: await gonder("Şimdilik yalnız yazılı mesajları anlayabiliyorum.") }); continue; }
      s.push(await kanalMesaji({ y, kaynak: "line", kimlik: `ln:${alici}`.replace(/[^A-Za-z0-9_.:-]/g, "_").slice(0, 80), adres: alici, metin: e.message.text.slice(0, 5000), gonder }));
    }
    return s;
  };
  if (bekle) return j({ ok: true, sonuclar: await isle(), yanitlar });
  isle().catch(() => {});
  return j({ ok: true });
}
