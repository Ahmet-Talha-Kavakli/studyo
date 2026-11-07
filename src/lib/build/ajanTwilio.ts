import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Twilio ile telefon ve SMS kanalı. Sesli arama: Twilio numaraya gelen aramada bu sunucunun ses adresine istek
 * atar, yanıt TwiML'dir (Gather input="speech" language="tr-TR" ile konuşma yazıya döner, Say ile yanıt okunur).
 * Twilio isteği 15 saniye bekler; ajan daha uzun düşünürse kısa bir bekleme ve Redirect ile sonuç sonra okunur.
 * SMS: gelen mesaj aynı biçimde gelir, yanıt REST API ile gönderilir. Her istek X-Twilio-Signature ile doğrulanır
 * (Auth Token gerekli). Hesap kimliği (AC...) ve Auth Token kasada şifreli durur.
 */
const API = "https://api.twilio.com/2010-04-01";
const yetki = (hesap: string, token: string) => `Basic ${Buffer.from(`${hesap}:${token}`).toString("base64")}`;

/** X-Twilio-Signature: base64(HMAC-SHA1(token, tam adres + sıralı parametre adı ve değerleri)). */
export function twilioImzaDogru(token: string, adres: string, p: Record<string, string>, imza: string | null): boolean {
  if (!imza) return false;
  const veri = adres + Object.keys(p).sort().map((k) => k + p[k]).join("");
  const bek = createHmac("sha1", token).update(Buffer.from(veri, "utf8")).digest("base64");
  return bek.length === imza.length && timingSafeEqual(Buffer.from(bek), Buffer.from(imza));
}

/** Hesabı ve numarayı doğrular; numaranın kimliğini (PN...) döndürür. */
export async function twilioDogrula(hesap: string, token: string, numara: string): Promise<{ numaraSid?: string; hata?: string }> {
  try {
    const r = await fetch(`${API}/Accounts/${encodeURIComponent(hesap)}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(numara)}`, { headers: { Authorization: yetki(hesap, token) }, signal: AbortSignal.timeout(10_000) });
    const v = (await r.json().catch(() => ({}))) as { incoming_phone_numbers?: { sid: string }[]; message?: string };
    if (r.status === 401) return { hata: "Hesap kimliği ya da Auth Token geçersiz." };
    if (!r.ok) return { hata: `Twilio yanıtı ${r.status}: ${v.message ?? "bilinmeyen hata"}` };
    const n = v.incoming_phone_numbers?.[0];
    return n ? { numaraSid: n.sid } : { hata: "Bu numara Twilio hesabında bulunamadı. Numarayı +90... biçiminde yaz." };
  } catch (e) { return { hata: `Twilio'ya ulaşılamadı: ${(e as Error).message}` }; }
}

/** Numaranın gelen arama ve SMS adreslerini bu sunucuya bağlar (yalnız herkese açık HTTPS adreste). */
export async function twilioAdresleriKur(hesap: string, token: string, numaraSid: string, sesAdres: string, smsAdres: string): Promise<string | null> {
  try {
    const r = await fetch(`${API}/Accounts/${encodeURIComponent(hesap)}/IncomingPhoneNumbers/${encodeURIComponent(numaraSid)}.json`, {
      method: "POST", headers: { Authorization: yetki(hesap, token), "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ VoiceUrl: sesAdres, VoiceMethod: "POST", SmsUrl: smsAdres, SmsMethod: "POST" }).toString(),
    });
    return r.ok ? null : `Twilio numara adresleri kurulamadı (${r.status}).`;
  } catch (e) { return `Twilio'ya ulaşılamadı: ${(e as Error).message}`; }
}

export async function smsGonder(hesap: string, token: string, kimden: string, kime: string, metin: string): Promise<string | null> {
  try {
    const r = await fetch(`${API}/Accounts/${encodeURIComponent(hesap)}/Messages.json`, {
      method: "POST", headers: { Authorization: yetki(hesap, token), "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ From: kimden, To: kime, Body: sesMetni(metin, 1500) }).toString(),
    });
    if (r.ok) return null;
    const v = (await r.json().catch(() => ({}))) as { message?: string };
    return `SMS gönderilemedi (${r.status}): ${v.message ?? "Twilio yanıtı"}`;
  } catch (e) { return `Twilio'ya ulaşılamadı: ${(e as Error).message}`; }
}

/** Sesle okunacak ya da SMS'te gidecek düz metin: markdown, kod ve alıntı numaraları atılır. */
export function sesMetni(md: string, sinir = 900): string {
  const s = md.replace(/```[\s\S]*?```/g, " ").replace(/`([^`]+)`/g, "$1").replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1").replace(/\[\d+\]/g, "")
    .replace(/^#{1,6}\s+/gm, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/^\s*[-*]\s+/gm, "").replace(/[*_>|]/g, " ").replace(/\s+/g, " ").trim();
  return s.length > sinir ? `${s.slice(0, sinir).replace(/\s\S*$/, "")}.` : s;
}

const xml = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
/** Sesli yanıt için TwiML parçaları. */
export const TwiML = {
  yanit: (ic: string) => new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${ic}</Response>`, { headers: { "Content-Type": "text/xml; charset=utf-8" } }),
  soyle: (metin: string, ses: string) => `<Say language="tr-TR"${ses ? ` voice="${xml(ses)}"` : ""}>${xml(metin)}</Say>`,
  dinle: (adres: string, ic: string) => `<Gather input="speech" language="tr-TR" speechTimeout="auto" actionOnEmptyResult="true" method="POST" action="${xml(adres)}">${ic}</Gather>`,
  bekle: (sn: number, adres: string) => `<Pause length="${sn}"/><Redirect method="POST">${xml(adres)}</Redirect>`,
  aktar: (numara: string) => `<Dial>${xml(numara)}</Dial>`,
  kapat: () => "<Hangup/>",
};
