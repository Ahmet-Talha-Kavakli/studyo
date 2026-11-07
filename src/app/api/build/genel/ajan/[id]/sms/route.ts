import { ajanSayacArtir, yayindakiAjan } from "@/lib/build/ajanDepo";
import { kanalMesaji } from "@/lib/build/ajanMesajKanal";
import { TwiML, smsGonder, twilioImzaDogru } from "@/lib/build/ajanTwilio";
import { coz } from "@/lib/build/sifre";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

function tamAdres(req: Request) {
  const u = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? u.host;
  const proto = req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
  return `${proto}://${host}${u.pathname}${u.search}`;
}

/**
 * Twilio SMS webhook'u: gelen SMS yayındaki ajana gider, yanıt Twilio REST API ile aynı numaraya gönderilir.
 * İstek X-Twilio-Signature ile doğrulanır; Twilio hemen boş TwiML alır (?bekle=1 ile sonuç beklenir).
 */
export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).id;
  const y = await yayindakiAjan(id);
  if (!y) return new Response("Bulunamadı", { status: 404 });
  const t = y.ajan.yayin.twilio;
  const token = coz(t?.tokenSifreli);
  const ham = await req.text();
  const p = Object.fromEntries(new URLSearchParams(ham)) as Record<string, string>;
  if (!token || !twilioImzaDogru(token, tamAdres(req), p, req.headers.get("x-twilio-signature"))) return new Response("İmza geçersiz", { status: 403 });
  if (!y.ajan.yayin.kanallar.sms || !t.hesap || !t.numara) return TwiML.yanit("");
  const kimden = (p.From ?? "").replace(/[^\d+]/g, "").slice(0, 20);
  const metin = (p.Body ?? "").trim();
  if (!kimden || !metin) return TwiML.yanit("");
  const isle = async () => {
    const r = await kanalMesaji({ y, kaynak: "sms", kimlik: `sms:${kimden}`.padEnd(8, "_"), adres: kimden, metin: metin.slice(0, 1600), iletisim: { telefon: kimden, zaman: Date.now() }, gonder: (m) => smsGonder(t.hesap!, token, t.numara!, kimden, m) });
    await ajanSayacArtir(id, (a) => { a.yayin.twilio = { ...a.yayin.twilio, sonOlay: Date.now() }; }).catch(() => {});
    return r;
  };
  if (new URL(req.url).searchParams.get("bekle") === "1") return Response.json({ ok: true, ...(await isle()) });
  isle().catch(() => {});
  return TwiML.yanit("");
}
