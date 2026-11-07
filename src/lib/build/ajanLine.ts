import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import type { Ajan } from "./ajanDepo";
import { duzMetin } from "./ajanKanal";
import { coz } from "./sifre";

/**
 * LINE Messaging API. Webhook istekleri X-Line-Signature = base64(HMAC-SHA256(kanal gizli anahtarı, gövde)) ile
 * doğrulanır. Ziyaretçiye önce yanıt belirteciyle (ücretsiz, yaklaşık bir dakika geçerli) yazılır; süre geçtiyse ya
 * da temsilci yanıtlıyorsa push mesajı kullanılır (aylık ücretsiz kotadan düşer). Belirteç ve gizli anahtar
 * kasada şifreli durur.
 */
const API = "https://api.line.me/v2/bot";

export function lineImzaDogru(gizli: string, govde: string, imza: string | null): boolean {
  if (!imza) return false;
  const b = createHmac("sha256", gizli).update(govde).digest("base64");
  return b.length === imza.length && timingSafeEqual(Buffer.from(b), Buffer.from(imza));
}
async function cagir<T>(token: string, yol: string, init: RequestInit = {}): Promise<{ ok: boolean; durum: number; veri?: T; hata?: string }> {
  try {
    const r = await fetch(`${API}${yol}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) }, signal: AbortSignal.timeout(10_000) });
    const t = await r.text();
    let v: unknown; try { v = t ? JSON.parse(t) : undefined; } catch { v = t; }
    if (r.ok) return { ok: true, durum: r.status, veri: v as T };
    const m = (v as { message?: string })?.message;
    return { ok: false, durum: r.status, hata: r.status === 401 ? "Kanal erişim belirteci geçersiz." : `LINE yanıtı ${r.status}${m ? `: ${m}` : ""}` };
  } catch (e) { return { ok: false, durum: 0, hata: `LINE'a ulaşılamadı: ${(e as Error).message}` }; }
}
export async function lineBotu(token: string): Promise<{ ad?: string; basicId?: string; hata?: string }> {
  const r = await cagir<{ displayName: string; basicId: string }>(token, "/info");
  return r.ok && r.veri ? { ad: r.veri.displayName, basicId: r.veri.basicId } : { hata: r.hata };
}
/** Webhook adresini kanala yazar ve LINE'ın deneme isteğini çalıştırır. */
export async function lineWebhookKur(token: string, adres: string): Promise<string | null> {
  const r = await cagir(token, "/channel/webhook/endpoint", { method: "PUT", body: JSON.stringify({ endpoint: adres }) });
  if (!r.ok) return `Webhook adresi kaydedilemedi: ${r.hata}`;
  const t = await cagir<{ success?: boolean; reason?: string }>(token, "/channel/webhook/test", { method: "POST", body: JSON.stringify({ endpoint: adres }) });
  return t.ok && t.veri?.success !== false ? null : `LINE adresi denedi ama başarısız oldu: ${t.veri?.reason ?? t.hata ?? "bilinmeyen"}`;
}
const iletiler = (metin: string) => (duzMetin(metin).match(/[\s\S]{1,4900}/g) ?? ["(boş yanıt)"]).slice(0, 5).map((text) => ({ type: "text", text }));
export async function lineYanitla(token: string, yanitBelirteci: string, metin: string): Promise<string | null> {
  const r = await cagir(token, "/message/reply", { method: "POST", body: JSON.stringify({ replyToken: yanitBelirteci, messages: iletiler(metin) }) });
  return r.ok ? null : r.hata ?? "LINE yanıtı gönderilemedi.";
}
export async function linePush(token: string, alici: string, metin: string): Promise<string | null> {
  const r = await cagir(token, "/message/push", { method: "POST", body: JSON.stringify({ to: alici, messages: iletiler(metin) }) });
  return r.ok ? null : r.durum === 429 ? "LINE aylık mesaj kotası doldu." : r.hata ?? "LINE mesajı gönderilemedi.";
}
/** Temsilci yanıtı (push). */
export async function lineGonder(a: Ajan, adres: string, metin: string): Promise<string | null> {
  const t = coz(a.yayin.line?.tokenSifreli);
  if (!t) return "LINE kanalı bağlı değil.";
  return linePush(t, adres, metin);
}
export type LineOlay = { type: string; replyToken?: string; source?: { type?: string; userId?: string; groupId?: string; roomId?: string }; message?: { type?: string; text?: string }; webhookEventId?: string; deliveryContext?: { isRedelivery?: boolean } };
