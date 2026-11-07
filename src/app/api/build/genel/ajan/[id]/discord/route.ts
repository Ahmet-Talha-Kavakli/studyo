import { ajanSayacArtir, yayindakiAjan } from "@/lib/build/ajanDepo";
import { discordEtkilesimYanitla, discordImzaDogru, etkilesimMetni, type DiscordEtkilesim } from "@/lib/build/ajanDiscord";
import { kanalMesaji } from "@/lib/build/ajanMesajKanal";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const j = (v: unknown, durum = 200) => Response.json(v, { status: durum });

/**
 * Discord etkileşim uç noktası. Önce Ed25519 imzası doğrulanır (geçersizse 401). PING'e PONG döner. /sor komutu
 * ve "Ajana sor" mesaj komutu ertelenmiş yanıtla (tip 5) karşılanır; ajan bitince yanıt etkileşim belirteciyle
 * yazılır. ?bekle=1 (deneme): ajanın yanıtı doğrudan tip 4 olarak döner. Konuşma kullanıcı başına tektir.
 */
export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).id;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "yerel";
  if (!hizSiniri(`discord:${ip}`, 120, 60_000)) return j({ ok: false }, 429);
  const govde = await req.text();
  if (govde.length > 200_000) return j({ ok: false }, 413);
  const y = await yayindakiAjan(id);
  const d = y?.ajan.yayin.discord;
  if (!y || !d?.anahtar || !discordImzaDogru(d.anahtar, req.headers.get("x-signature-ed25519"), req.headers.get("x-signature-timestamp"), govde)) return new Response("Geçersiz istek imzası", { status: 401 });
  let e: DiscordEtkilesim;
  try { e = JSON.parse(govde); } catch { return j({ ok: false }, 400); }
  if (e.type === 1) return j({ type: 1 });
  ajanSayacArtir(id, (a) => { a.yayin.discord = { ...a.yayin.discord, sonOlay: Date.now() }; }).catch(() => {});
  if (!y.ajan.yayin.kanallar.discord) return j({ type: 4, data: { content: "Bu ajan şu an Discord'da kapalı.", flags: 64 } });
  if (e.type !== 2) return j({ type: 4, data: { content: "Bu etkileşim türü desteklenmiyor.", flags: 64 } });
  const { metin, kullanici } = etkilesimMetni(e);
  if (!metin) return j({ type: 4, data: { content: "Soru boş. /sor komutuyla yaz ya da bir mesaja sağ tıklayıp Uygulamalar menüsünden Ajana sor seç.", flags: 64 } });
  const adres = e.channel_id ?? "";
  const bekle = new URL(req.url).searchParams.get("bekle") === "1";
  let yanit = "";
  const isle = () => kanalMesaji({
    y, kaynak: "discord", kimlik: `dc:${kullanici?.id ?? adres}`.padEnd(8, "_").slice(0, 80), adres, metin: metin.slice(0, 8000),
    iletisim: kullanici ? { ad: kullanici.ad, zaman: Date.now() } : undefined,
    gonder: async (m) => { yanit = m; if (bekle) return null; return e.application_id && e.token ? discordEtkilesimYanitla(e.application_id, e.token, m) : "Etkileşim belirteci yok."; },
  });
  if (bekle) {
    const r = await isle();
    return j({ type: 4, data: { content: (yanit || (r.durum === "insanda" ? "Mesajın ekibe iletildi; bir temsilci buradan yanıt verecek." : r.hata ?? "")).slice(0, 2000), allowed_mentions: { parse: [] } }, sonuc: r });
  }
  isle().then(async (r) => { if (!yanit && e.application_id && e.token) await discordEtkilesimYanitla(e.application_id, e.token, r.durum === "insanda" ? "Mesajın ekibe iletildi; bir temsilci bu kanaldan yanıt verecek." : r.hata ?? "Şu an yanıt veremiyorum."); }).catch(() => {});
  return j({ type: 5 });
}
