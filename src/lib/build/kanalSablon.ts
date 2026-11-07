import "server-only";
import type { ZiyaretciKonusma } from "./ziyaretciDepo";

/**
 * Meta mesajlaşma pencereleri ve WhatsApp şablon mesajları (Meta resmî belgesi: WhatsApp Cloud API, Template
 * messages; Messenger Platform, Message tags).
 *  - WhatsApp: ziyaretçinin son mesajından sonraki 24 saat "müşteri hizmetleri penceresi"dir; içinde serbest metin
 *    gider. Pencere kapanınca yalnız Meta'nın onayladığı şablon (type: "template") gönderilebilir. Şablonlar
 *    GET /{WABA kimliği}/message_templates ile listelenir, POST /{telefon numarası kimliği}/messages ile gider.
 *  - Messenger ve Instagram: 24 saatten sonra insan temsilci yanıtı HUMAN_AGENT etiketiyle 7 güne kadar gider
 *    (messaging_type: MESSAGE_TAG, tag: HUMAN_AGENT; uygulamanın bu izni Meta incelemesinden geçmiş olmalı).
 */
const GRAPH = "https://graph.facebook.com/v21.0";
const SAAT = 3600_000;

export type Pencere = { kanal: "whatsapp" | "messenger" | "instagram"; sonZiyaretci: number | null; acik: boolean; bitis: number | null; insanEtiketi: boolean; etiketBitis: number | null };
/** Konuşmanın mesajlaşma penceresi: yalnız WhatsApp, Messenger ve Instagram'da anlamlı; diğerlerinde null. */
export function pencereDurumu(k: Pick<ZiyaretciKonusma, "kaynak" | "mesajlar">, simdi = Date.now()): Pencere | null {
  if (k.kaynak !== "whatsapp" && k.kaynak !== "messenger" && k.kaynak !== "instagram") return null;
  const son = [...k.mesajlar].reverse().find((m) => m.rol === "kullanici" && !m.olay)?.zaman ?? null;
  const bitis = son ? son + 24 * SAAT : null;
  const acik = !!bitis && simdi < bitis;
  const etiketBitis = son && k.kaynak !== "whatsapp" ? son + 7 * 24 * SAAT : null;
  return { kanal: k.kaynak, sonZiyaretci: son, acik, bitis, insanEtiketi: !acik && !!etiketBitis && simdi < etiketBitis, etiketBitis };
}

export type WaSablon = { ad: string; dil: string; kategori: string; durum: string; baslik?: string; govde: string; altBilgi?: string; degiskenler: string[]; adli: boolean };
type MetaBilesen = { type?: string; format?: string; text?: string; example?: unknown };

/** Onaylı şablonlar (en çok 200). Gövde değişkenleri {{1}} ya da {{ad}} biçiminde çıkarılır. */
export async function whatsappSablonlari(token: string, wabaId: string): Promise<{ sablonlar?: WaSablon[]; hata?: string }> {
  if (!/^\d{5,25}$/.test(wabaId)) return { hata: "WhatsApp İşletme Hesabı kimliği yalnız rakamlardan oluşur." };
  const l: WaSablon[] = [];
  let adres: string | null = `${GRAPH}/${wabaId}/message_templates?fields=name,status,language,category,components&limit=100`;
  try {
    for (let i = 0; adres && i < 2; i++) {
      const r: Response = await fetch(adres, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
      const v = (await r.json().catch(() => ({}))) as { data?: { name?: string; status?: string; language?: string; category?: string; components?: MetaBilesen[] }[]; paging?: { next?: string }; error?: { message?: string } };
      if (!r.ok) return { hata: `Meta şablonları vermedi (${r.status}): ${v.error?.message ?? "bilinmeyen hata"}` };
      for (const t of v.data ?? []) {
        const govde = t.components?.find((c) => c.type === "BODY")?.text ?? "";
        const ad = [...govde.matchAll(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g)].map((m) => m[1]);
        l.push({
          ad: String(t.name ?? ""), dil: String(t.language ?? ""), kategori: String(t.category ?? ""), durum: String(t.status ?? ""),
          baslik: t.components?.find((c) => c.type === "HEADER" && c.format === "TEXT")?.text, govde, altBilgi: t.components?.find((c) => c.type === "FOOTER")?.text,
          degiskenler: [...new Set(ad)], adli: ad.some((x) => !/^\d+$/.test(x)),
        });
      }
      adres = v.paging?.next && v.paging.next.startsWith(GRAPH) ? v.paging.next : null;
    }
  } catch (e) { return { hata: `Meta'ya ulaşılamadı: ${(e as Error).message}` }; }
  return { sablonlar: l.filter((x) => x.durum === "APPROVED" && x.ad) };
}

/** Şablon gövdesine değerleri yerleştirir (kayıtta ve gelen kutusunda görünen metin). */
export const sablonMetni = (s: Pick<WaSablon, "govde" | "degiskenler">, d: Record<string, string>) => s.govde.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, k: string) => d[k] ?? `{{${k}}}`);

export async function whatsappSablonGonder(token: string, telefonId: string, alici: string, s: Pick<WaSablon, "ad" | "dil" | "degiskenler" | "adli">, d: Record<string, string>): Promise<string | null> {
  const parametreler = s.degiskenler.map((k) => ({ type: "text", text: String(d[k] ?? "").slice(0, 1000) || "-", ...(s.adli ? { parameter_name: k } : {}) }));
  try {
    const r = await fetch(`${GRAPH}/${encodeURIComponent(telefonId)}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: alici, type: "template", template: { name: s.ad, language: { code: s.dil }, ...(parametreler.length ? { components: [{ type: "body", parameters: parametreler }] } : {}) } }),
    });
    if (r.ok) return null;
    const v = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
    return `WhatsApp şablonu gönderilemedi (${r.status}): ${v.error?.message ?? "bilinmeyen hata"}`;
  } catch (e) { return `WhatsApp'a ulaşılamadı: ${(e as Error).message}`; }
}
