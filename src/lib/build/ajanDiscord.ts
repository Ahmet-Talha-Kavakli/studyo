import "server-only";
import { createPublicKey, verify } from "crypto";
import type { Ajan } from "./ajanDepo";
import { coz } from "./sifre";

/**
 * Discord kanalı (Interactions Endpoint): Discord her etkileşimi bu sunucunun adresine POST eder; istek
 * X-Signature-Ed25519 ve X-Signature-Timestamp başlıklarıyla uygulamanın genel anahtarı üzerinden doğrulanır
 * (geçersiz imzaya 401; Discord bunu kurulumda bilerek dener). Ziyaretçi /sor komutunu ya da bir mesajın
 * Uygulamalar > Ajana sor menüsünü kullanır. Yanıt önce "düşünüyor" olarak ertelenir (tip 5), ajan bitince etkileşim
 * belirteciyle güncellenir. Temsilci yanıtları bot belirteciyle kanala yazılır. Bot belirteci kasada şifreli durur.
 */
const API = "https://discord.com/api/v10";
const DER_ONEK = Buffer.from("302a300506032b6570032100", "hex");

export function discordImzaDogru(genelAnahtar: string, imza: string | null, zaman: string | null, govde: string): boolean {
  if (!imza || !zaman || !/^[a-f0-9]{64}$/i.test(genelAnahtar) || !/^[a-f0-9]{128}$/i.test(imza)) return false;
  if (Math.abs(Date.now() / 1000 - Number(zaman)) > 300) return false;
  try {
    const k = createPublicKey({ key: Buffer.concat([DER_ONEK, Buffer.from(genelAnahtar, "hex")]), format: "der", type: "spki" });
    return verify(null, Buffer.from(zaman + govde), k, Buffer.from(imza, "hex"));
  } catch { return false; }
}

async function cagir<T>(yol: string, init: RequestInit & { token?: string } = {}): Promise<{ ok: boolean; durum: number; veri?: T; hata?: string }> {
  try {
    const r = await fetch(`${API}${yol}`, { ...init, headers: { "Content-Type": "application/json", "User-Agent": "DiscordBot (https://vayra.app, 1.0)", ...(init.token ? { Authorization: `Bot ${init.token}` } : {}), ...(init.headers ?? {}) }, signal: AbortSignal.timeout(10_000) });
    const t = await r.text();
    let v: unknown; try { v = t ? JSON.parse(t) : undefined; } catch { v = t; }
    if (r.ok) return { ok: true, durum: r.status, veri: v as T };
    const m = (v as { message?: string })?.message;
    return { ok: false, durum: r.status, hata: r.status === 401 ? "Bot belirteci geçersiz." : `Discord yanıtı ${r.status}${m ? `: ${m}` : ""}` };
  } catch (e) { return { ok: false, durum: 0, hata: `Discord'a ulaşılamadı: ${(e as Error).message}` }; }
}

/** Bot belirteciyle uygulamayı okur: kimlik, ad ve genel anahtar (verify_key). */
export async function discordUygulama(token: string): Promise<{ id?: string; ad?: string; anahtar?: string; hata?: string }> {
  const r = await cagir<{ id: string; name: string; verify_key: string }>("/applications/@me", { token });
  return r.ok && r.veri ? { id: r.veri.id, ad: r.veri.name, anahtar: r.veri.verify_key } : { hata: r.hata };
}
/** /sor bölü komutu ve "Ajana sor" mesaj komutu (sunucuda, özel mesajda ve kullanıcı kurulumunda). */
export async function discordKomutlariKur(token: string, uygulama: string, ad: string): Promise<string | null> {
  const ortak = { integration_types: [0, 1], contexts: [0, 1, 2] };
  const r = await cagir(`/applications/${uygulama}/commands`, {
    method: "PUT", token,
    body: JSON.stringify([
      { name: "sor", type: 1, description: `${ad.slice(0, 60)} ajanına soru sor`, options: [{ type: 3, name: "mesaj", description: "Sorun ya da isteğin", required: true, max_length: 2000 }], ...ortak },
      { name: "Ajana sor", type: 3, ...ortak },
    ]),
  });
  return r.ok ? null : `Komutlar kaydedilemedi: ${r.hata}`;
}
/** Etkileşim uç noktasını uygulamaya yazar (Discord adresi kaydetmeden önce PING ile dener). */
export async function discordUcNoktasiKur(token: string, adres: string): Promise<string | null> {
  const r = await cagir("/applications/@me", { method: "PATCH", token, body: JSON.stringify({ interactions_endpoint_url: adres }) });
  return r.ok ? null : `Etkileşim adresi kaydedilemedi: ${r.hata}`;
}

const parcala = (s: string, n = 1990) => (s.trim() ? s.match(new RegExp(`[\\s\\S]{1,${n}}`, "g")) ?? [s] : ["(boş yanıt)"]);
/** Ertelenen etkileşim yanıtını günceller; uzun yanıtlar takip mesajı olarak eklenir. */
export async function discordEtkilesimYanitla(uygulama: string, belirtec: string, metin: string): Promise<string | null> {
  const p = parcala(metin);
  const r = await cagir(`/webhooks/${uygulama}/${belirtec}/messages/@original`, { method: "PATCH", body: JSON.stringify({ content: p[0], allowed_mentions: { parse: [] } }) });
  if (!r.ok) return r.hata ?? "Discord yanıtı güncellenemedi.";
  for (const x of p.slice(1, 4)) await cagir(`/webhooks/${uygulama}/${belirtec}`, { method: "POST", body: JSON.stringify({ content: x, allowed_mentions: { parse: [] } }) });
  return null;
}
/** Temsilci yanıtı: bot belirteciyle kanala (adres = kanal kimliği). */
export async function discordGonder(a: Ajan, adres: string, metin: string): Promise<string | null> {
  const token = coz(a.yayin.discord?.tokenSifreli);
  if (!token) return "Discord bot belirteci kayıtlı değil.";
  if (!/^\d{15,22}$/.test(adres)) return "Discord kanalı bilinmiyor.";
  for (const x of parcala(metin)) {
    const r = await cagir(`/channels/${adres}/messages`, { method: "POST", token, body: JSON.stringify({ content: x, allowed_mentions: { parse: [] } }) });
    if (!r.ok) return r.durum === 403 || r.durum === 50001 ? "Bot bu kanala yazamıyor; botu sunucuya ekle ya da kanala yazma izni ver." : r.hata ?? "Discord'a gönderilemedi.";
  }
  return null;
}

export type DiscordEtkilesim = {
  type: number; id?: string; application_id?: string; token?: string; channel_id?: string; guild_id?: string;
  member?: { user?: { id: string; username?: string; global_name?: string } }; user?: { id: string; username?: string; global_name?: string };
  data?: { name?: string; type?: number; options?: { name: string; value?: unknown }[]; target_id?: string; resolved?: { messages?: Record<string, { content?: string }> } };
};
/** Etkileşimden metin ve kullanıcı. */
export function etkilesimMetni(e: DiscordEtkilesim): { metin: string; kullanici?: { id: string; ad: string } } {
  const u = e.member?.user ?? e.user;
  const kullanici = u ? { id: u.id, ad: u.global_name || u.username || "Discord kullanıcısı" } : undefined;
  if (e.data?.type === 3 && e.data.target_id) return { metin: String(e.data.resolved?.messages?.[e.data.target_id]?.content ?? "").trim(), kullanici };
  return { metin: String(e.data?.options?.find((o) => o.name === "mesaj")?.value ?? "").trim(), kullanici };
}
