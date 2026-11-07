import { yayindakiAjan } from "@/lib/build/ajanDepo";
import { telegramGonder, telegramYaziyor } from "@/lib/build/ajanKanal";
import { kanalMesaji } from "@/lib/build/ajanMesajKanal";
import { coz } from "@/lib/build/sifre";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
type Guncelleme = { update_id?: number; message?: { chat?: { id?: number | string; type?: string }; from?: { first_name?: string }; text?: string } };

/**
 * Telegram Bot API webhook'u. X-Telegram-Bot-Api-Secret-Token başlığı ajana özel gizli değerle eşleşmeli.
 * Yalnız yayındaki sürüm ve Telegram kanalı açıksa yanıt verir; /start karşılama cümlesini gönderir. Telegram yeniden
 * denemesin diye hemen 200 döner; ?bekle=1 işlem bitince döner (deneme için).
 */
export async function POST(req: Request, { params }: Ctx) {
  const y = await yayindakiAjan((await params).id);
  if (!y) return Response.json({ ok: false }, { status: 404 });
  const t = y.ajan.yayin.telegram;
  if (!t.gizli || req.headers.get("x-telegram-bot-api-secret-token") !== t.gizli) return Response.json({ ok: false }, { status: 401 });
  const token = coz(t.tokenSifreli);
  if (!token || !y.ajan.yayin.kanallar.telegram) return Response.json({ ok: true, yok: "kanal kapalı" });
  let u: Guncelleme = {};
  try { u = await req.json(); } catch { return Response.json({ ok: true }); }
  const sohbet = u.message?.chat?.id;
  if (sohbet === undefined) return Response.json({ ok: true });
  const adres = String(sohbet);
  const metin = (u.message?.text ?? "").trim();
  const isle = async () => {
    if (!metin) return { durum: "metinsiz", hata: await telegramGonder(token, adres, "Şimdilik yalnız yazılı mesajları anlayabiliyorum.") ?? undefined };
    if (metin === "/start") return { durum: "karsilama", hata: await telegramGonder(token, adres, y.ayar.karsilama || `Merhaba! Ben ${y.ayar.ad}. Nasıl yardımcı olabilirim?`) ?? undefined };
    telegramYaziyor(token, adres).catch(() => {});
    return kanalMesaji({ y, kaynak: "telegram", kimlik: `tg:${adres}`.padEnd(8, "_"), adres, metin: metin.slice(0, 8000), gonder: (m) => telegramGonder(token, adres, m) });
  };
  if (new URL(req.url).searchParams.get("bekle") === "1") return Response.json({ ok: true, ...(await isle()) });
  isle().catch(() => {});
  return Response.json({ ok: true });
}
