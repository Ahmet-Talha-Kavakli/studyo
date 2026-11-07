import { ajanGuncelleOz, yayindakiAjan } from "@/lib/build/ajanDepo";
import { slackGonder, slackImzaDogru } from "@/lib/build/ajanKanal";
import { kanalMesaji } from "@/lib/build/ajanMesajKanal";
import { coz } from "@/lib/build/sifre";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
type Olay = { type?: string; challenge?: string; team_id?: string; event?: { type?: string; channel_type?: string; channel?: string; user?: string; bot_id?: string; subtype?: string; text?: string; ts?: string; thread_ts?: string } };

/**
 * Slack Events API uç noktası. İmza (X-Slack-Signature, v0 HMAC) ajana kaydedilen imza anahtarıyla doğrulanır.
 * Uygulamayı kurarken Slack'in gönderdiği adres doğrulamasına (url_verification) imza anahtarı henüz kayıtlı değilse de
 * yanıt verilir. Bota bahsedilince (app_mention) konu içinde, özel mesajda doğrudan yanıt verir. Slack yeniden denemesin
 * diye hemen 200 döner; yeniden deneme istekleri (X-Slack-Retry-Num) yok sayılır. ?bekle=1 işlem bitince döner (deneme için).
 */
export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).id;
  const govde = await req.text();
  let o: Olay = {};
  try { o = JSON.parse(govde); } catch { return Response.json({ ok: false }, { status: 400 }); }
  const y = await yayindakiAjan(id);
  const s = y?.ajan.yayin.slack;
  const imzaAnahtari = coz(s?.imzaSifreli);
  if (o.type === "url_verification") {
    if (imzaAnahtari && !slackImzaDogru(imzaAnahtari, req.headers.get("x-slack-request-timestamp"), govde, req.headers.get("x-slack-signature"))) return Response.json({ ok: false }, { status: 401 });
    return new Response(String(o.challenge ?? ""), { headers: { "Content-Type": "text/plain" } });
  }
  if (!y || !s) return Response.json({ ok: false }, { status: 404 });
  if (!imzaAnahtari || !slackImzaDogru(imzaAnahtari, req.headers.get("x-slack-request-timestamp"), govde, req.headers.get("x-slack-signature"))) return Response.json({ ok: false }, { status: 401 });
  if (req.headers.get("x-slack-retry-num")) return Response.json({ ok: true, yok: "yeniden deneme" });
  const token = coz(s.tokenSifreli);
  if (!token || !y.ajan.yayin.kanallar.slack) return Response.json({ ok: true, yok: "kanal kapalı" });
  const e = o.event;
  if (o.type !== "event_callback" || !e?.channel || !e.ts) return Response.json({ ok: true });
  // Botun kendi mesajları, düzenlenen ya da silinen mesajlar ve kanal mesajları (bahsetme dışında) yanıtlanmaz.
  if (e.bot_id || e.subtype || (s.botKullanici && e.user === s.botKullanici)) return Response.json({ ok: true });
  const ozel = e.type === "message" && e.channel_type === "im";
  if (e.type !== "app_mention" && !ozel) return Response.json({ ok: true });
  const metin = String(e.text ?? "").replace(/<@[A-Z0-9]+>/g, "").trim();
  const konu = e.thread_ts ?? e.ts;
  const adres = ozel ? e.channel : `${e.channel}:${konu}`;
  const kimlik = ozel ? `sl:${o.team_id ?? "t"}:${e.channel}` : `sl:${e.channel}:${konu}`;
  const isle = async () => {
    await ajanGuncelleOz(y.ajan.id, y.sahipOzeti, (x) => { x.yayin.slack = { ...x.yayin.slack, sonOlay: Date.now(), bagli: true, hata: undefined }; }).catch(() => {});
    if (!metin) return { durum: "metinsiz", hata: await slackGonder(token, adres, y.ayar.karsilama || `Merhaba! Ben ${y.ayar.ad}. Nasıl yardımcı olabilirim?`) ?? undefined };
    return kanalMesaji({ y, kaynak: "slack", kimlik: kimlik.slice(0, 80), adres, metin: metin.slice(0, 8000), gonder: (m) => slackGonder(token, adres, m) });
  };
  if (new URL(req.url).searchParams.get("bekle") === "1") return Response.json({ ok: true, ...(await isle()) });
  isle().catch(() => {});
  return Response.json({ ok: true });
}
