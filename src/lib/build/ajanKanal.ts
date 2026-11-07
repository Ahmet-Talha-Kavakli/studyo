import "server-only";
import { ajanGetir, ajanGetirOz, type Ajan } from "./ajanDepo";
import { discordGonder } from "./ajanDiscord";
import { teamsGonder } from "./ajanTeams";
import { lineGonder } from "./ajanLine";
import { siteSohbetGonder } from "./ajanSiteSohbet";
import { createHmac, timingSafeEqual } from "crypto";
import { coz } from "./sifre";
import { epostaYanitGonder } from "./ajanEposta";
import { metaGonder } from "./ajanMeta";
import { smsGonder } from "./ajanTwilio";

/**
 * Mesajlaşma kanalları: Telegram Bot API ve WhatsApp Cloud API (Meta Graph). Belirteçler kasada şifreli durur.
 * Telegram: bot belirteci girilince getMe ile doğrulanır, setWebhook ile bu sunucunun herkese açık HTTPS adresine
 * bağlanır (secret_token başlığıyla doğrulanır). WhatsApp: Meta uygulamasının kalıcı erişim belirteci, telefon
 * numarası kimliği ve doğrulama belirteci gerekir; webhook GET doğrulaması ve X-Hub-Signature-256 imzası desteklenir.
 */
const TG = "https://api.telegram.org";
const GRAPH = "https://graph.facebook.com/v21.0";

/** Markdown'ı düz mesaja yaklaştırır (Telegram'da biçimlendirme modu kullanılmaz). */
export function duzMetin(md: string, whatsapp = false): string {
  let s = md.replace(/```[a-z]*\n([\s\S]*?)```/g, "$1").replace(/`([^`]+)`/g, "$1");
  s = s.replace(/^#{1,6}\s+(.+)$/gm, whatsapp ? "*$1*" : "$1");
  s = s.replace(/\*\*([^*]+)\*\*/g, whatsapp ? "*$1*" : "$1").replace(/__([^_]+)__/g, whatsapp ? "_$1_" : "$1");
  s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1 ($2)");
  return s.trim();
}

async function tgCagir<T>(token: string, yontem: string, govde?: unknown): Promise<{ ok: boolean; result?: T; description?: string }> {
  try {
    const r = await fetch(`${TG}/bot${token}/${yontem}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(govde ?? {}), signal: AbortSignal.timeout(10_000) });
    return (await r.json()) as { ok: boolean; result?: T; description?: string };
  } catch (e) { return { ok: false, description: (e as Error).message }; }
}
export async function telegramBotu(token: string): Promise<{ bot?: string; hata?: string }> {
  const r = await tgCagir<{ username: string }>(token, "getMe");
  return r.ok && r.result ? { bot: r.result.username } : { hata: r.description === "Unauthorized" ? "Bot belirteci geçersiz." : `Telegram'a ulaşılamadı: ${r.description ?? "bilinmeyen hata"}` };
}
export async function telegramWebhookKur(token: string, adres: string, gizli: string): Promise<string | null> {
  const r = await tgCagir(token, "setWebhook", { url: adres, secret_token: gizli, allowed_updates: ["message"], drop_pending_updates: true });
  return r.ok ? null : `Webhook kurulamadı: ${r.description ?? "bilinmeyen hata"}`;
}
export async function telegramWebhookSil(token: string) { await tgCagir(token, "deleteWebhook", { drop_pending_updates: false }); }
export async function telegramGonder(token: string, sohbet: string, metin: string): Promise<string | null> {
  const parcalar = duzMetin(metin).match(/[\s\S]{1,4000}/g) ?? [""];
  for (const p of parcalar) {
    const r = await tgCagir(token, "sendMessage", { chat_id: sohbet, text: p || "(boş yanıt)" });
    if (!r.ok) return `Telegram'a gönderilemedi: ${r.description ?? "bilinmeyen hata"}`;
  }
  return null;
}
export async function telegramYaziyor(token: string, sohbet: string) { await tgCagir(token, "sendChatAction", { chat_id: sohbet, action: "typing" }); }

export async function whatsappGonder(token: string, telefonId: string, alici: string, metin: string): Promise<string | null> {
  try {
    const r = await fetch(`${GRAPH}/${encodeURIComponent(telefonId)}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: alici, type: "text", text: { preview_url: false, body: duzMetin(metin, true).slice(0, 4096) || "(boş yanıt)" } }),
    });
    if (r.ok) return null;
    const v = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
    return `WhatsApp'a gönderilemedi (${r.status}): ${v.error?.message ?? "bilinmeyen hata"}`;
  } catch (e) { return `WhatsApp'a ulaşılamadı: ${(e as Error).message}`; }
}
export async function whatsappNumarasi(token: string, telefonId: string): Promise<{ numara?: string; hata?: string }> {
  try {
    const r = await fetch(`${GRAPH}/${encodeURIComponent(telefonId)}?fields=display_phone_number,verified_name`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
    const v = (await r.json().catch(() => ({}))) as { display_phone_number?: string; verified_name?: string; error?: { message?: string } };
    return r.ok ? { numara: [v.verified_name, v.display_phone_number].filter(Boolean).join(" · ") } : { hata: v.error?.message ?? `Meta yanıtı ${r.status}` };
  } catch (e) { return { hata: `Meta'ya ulaşılamadı: ${(e as Error).message}` }; }
}

/* ───────────── Slack ───────────── */
// Yerel denemede sahte Slack sunucusu kullanılabilir (yalnız production dışında).
const SLACK = (process.env.NODE_ENV !== "production" && process.env.VAYRA_SAHTE_SLACK) || "https://slack.com/api";

/** Markdown'ı Slack mrkdwn biçimine çevirir (kalın, başlık, bağlantı). */
export function slackMetni(md: string): string {
  let t = md.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");
  t = t.replace(/\*\*([^*]+)\*\*/g, "*$1*").replace(/__([^_]+)__/g, "_$1_");
  t = t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "<$2|$1>");
  return t.trim();
}
async function slackCagir<T>(token: string, yontem: string, govde?: Record<string, unknown>): Promise<T & { ok: boolean; error?: string }> {
  try {
    const r = await fetch(`${SLACK}/${yontem}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(govde ?? {}), signal: AbortSignal.timeout(10_000) });
    return (await r.json()) as T & { ok: boolean; error?: string };
  } catch (e) { return { ok: false, error: (e as Error).message } as T & { ok: boolean; error?: string }; }
}
const SLACK_HATA: Record<string, string> = { invalid_auth: "Belirteç geçersiz.", not_authed: "Belirteç eksik.", account_inactive: "Slack uygulaması kaldırılmış.", token_revoked: "Belirteç iptal edilmiş.", missing_scope: "Uygulamada gerekli izin yok (chat:write).", not_in_channel: "Bot bu kanalda değil; kanala ekle.", channel_not_found: "Kanal bulunamadı." };
/** Bot belirtecini auth.test ile doğrular. */
export async function slackBotu(token: string): Promise<{ takim?: string; takimId?: string; bot?: string; botKullanici?: string; hata?: string }> {
  if (!/^xoxb-/.test(token)) return { hata: "Bot belirteci xoxb- ile başlamalı (Bot User OAuth Token)." };
  const r = await slackCagir<{ team?: string; team_id?: string; user?: string; user_id?: string }>(token, "auth.test");
  return r.ok ? { takim: r.team, takimId: r.team_id, bot: r.user, botKullanici: r.user_id } : { hata: SLACK_HATA[r.error ?? ""] ?? `Slack yanıtı: ${r.error}` };
}
/** Kanala ya da özel mesaja yazar; konu (thread) varsa onun içine. adres: "kanal" ya da "kanal:konu". */
export async function slackGonder(token: string, adres: string, metin: string): Promise<string | null> {
  const [kanal, konu] = adres.split(":");
  const r = await slackCagir(token, "chat.postMessage", { channel: kanal, text: slackMetni(metin).slice(0, 39_000), ...(konu ? { thread_ts: konu } : {}), unfurl_links: false });
  return r.ok ? null : SLACK_HATA[r.error ?? ""] ?? `Slack'e gönderilemedi: ${r.error}`;
}
/** Slack istek imzası: v0=HMAC_SHA256(imza anahtarı, "v0:zaman:gövde"); 5 dakikadan eski istekler reddedilir. */
export function slackImzaDogru(imzaAnahtari: string, zaman: string | null, govde: string, imza: string | null): boolean {
  if (!zaman || !imza || Math.abs(Date.now() / 1000 - Number(zaman)) > 300) return false;
  const beklenen = `v0=${createHmac("sha256", imzaAnahtari).update(`v0:${zaman}:${govde}`).digest("hex")}`;
  const a = Buffer.from(beklenen), b = Buffer.from(imza);
  return a.length === b.length && timingSafeEqual(a, b);
}
/** Slack uygulama manifesti: olay adresi ve gereken izinlerle; Slack'te "From an app manifest" ile tek adımda kurulur. */
export function slackManifesti(ad: string, adres: string): string {
  return JSON.stringify({
    display_information: { name: ad.slice(0, 35), description: "Vayra ajanı" },
    features: { bot_user: { display_name: ad.slice(0, 80), always_online: true }, app_home: { messages_tab_enabled: true, messages_tab_read_only_enabled: false } },
    oauth_config: { scopes: { bot: ["app_mentions:read", "chat:write", "im:history", "im:read", "im:write"] } },
    settings: { event_subscriptions: { request_url: adres, bot_events: ["app_mention", "message.im"] }, org_deploy_enabled: false, socket_mode_enabled: false, token_rotation_enabled: false },
  }, null, 2);
}

/**
 * Temsilci yanıtını (ya da anket sorusunu) konuşmanın kanalına iletir: Telegram, Slack, WhatsApp, Messenger,
 * Instagram, SMS ve e-posta (aynı konuya). Sayfa, kutu ve API konuşmalarında ziyaretçi yanıtı yoklamayla görür.
 * Dönüş: hata metni ya da null.
 */
type GonderEk = { eposta?: { konu: string; mesajId?: string; referanslar?: string }; temsilci?: string; insanEtiketi?: boolean };
export async function kanalaGonder(ajanId: string, sahip: string, kaynak: string, adres: string, metin: string, ek: GonderEk = {}): Promise<string | null> {
  const a = await ajanGetir(ajanId, sahip);
  if (!a) return "Ajan bulunamadı.";
  return ajanKanalinaGonder(a, kaynak, adres, metin, ek);
}
/** Sahip anahtarı olmadan (arka plan: prosedür web kancası, zaman aşımı). */
export async function kanalaGonderOz(ajanId: string, sahipOz: string, kaynak: string, adres: string, metin: string, ek: GonderEk = {}): Promise<string | null> {
  const a = await ajanGetirOz(ajanId, sahipOz);
  if (!a) return "Ajan bulunamadı.";
  return ajanKanalinaGonder(a, kaynak, adres, metin, ek);
}
async function ajanKanalinaGonder(a: Ajan, kaynak: string, adres: string, metin: string, ek: GonderEk): Promise<string | null> {
  if (kaynak === "discord") return discordGonder(a, adres, metin);
  if (kaynak === "teams") return teamsGonder(a, adres, metin);
  if (kaynak === "line") return lineGonder(a, adres, metin);
  if (kaynak === "site") return siteSohbetGonder(adres, metin, ek.temsilci);
  if (kaynak === "telegram") {
    const t = coz(a.yayin.telegram.tokenSifreli);
    return t ? telegramGonder(t, adres, metin) : "Telegram botu bağlı değil.";
  }
  if (kaynak === "slack") {
    const t = coz(a.yayin.slack?.tokenSifreli);
    return t ? slackGonder(t, adres, metin) : "Slack bağlı değil.";
  }
  if (kaynak === "whatsapp") {
    const t = coz(a.yayin.whatsapp.tokenSifreli);
    return t && a.yayin.whatsapp.telefonId ? whatsappGonder(t, a.yayin.whatsapp.telefonId, adres, metin) : "WhatsApp bağlı değil.";
  }
  if (kaynak === "messenger" || kaynak === "instagram") {
    const t = coz(a.yayin.meta?.tokenSifreli);
    return t ? metaGonder(t, adres, metin, kaynak === "instagram", !!ek.insanEtiketi) : "Meta sayfası bağlı değil.";
  }
  if (kaynak === "sms") {
    const t = coz(a.yayin.twilio?.tokenSifreli);
    return t && a.yayin.twilio.hesap && a.yayin.twilio.numara ? smsGonder(a.yayin.twilio.hesap, t, a.yayin.twilio.numara, adres, metin) : "Twilio bağlı değil.";
  }
  if (kaynak === "eposta") {
    if (!ek.eposta) return "E-posta konusu bulunamadı.";
    return epostaYanitGonder(a, { alici: adres, konu: ek.eposta.konu, mesajId: ek.eposta.mesajId, referanslar: ek.eposta.referanslar, metin, gonderenAdi: ek.temsilci ? `${ek.temsilci} (${a.ad})` : undefined });
  }
  if (kaynak === "telefon") return "Telefon görüşmesine yazılı yanıt gönderilemez; ziyaretçiyi geri ara.";
  return null;
}
