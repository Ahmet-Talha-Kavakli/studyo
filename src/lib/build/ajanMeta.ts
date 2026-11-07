import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { duzMetin } from "./ajanKanal";

/**
 * Facebook Messenger ve Instagram DM (Meta Graph API, Messenger Platform). Tek bir Facebook sayfası erişim belirteci
 * iki kanalı da taşır: sayfaya bağlı Instagram profesyonel hesabı varsa Instagram mesajları da aynı webhook'a gelir.
 * Belirteç kasada şifreli durur; webhook GET doğrulaması (hub.verify_token) ve X-Hub-Signature-256 imzası desteklenir.
 * Meta, son ziyaretçi mesajından 24 saat sonra standart mesaj göndermeye izin vermez; bu hata olduğu gibi gösterilir.
 */
const GRAPH = "https://graph.facebook.com/v21.0";

export async function metaSayfa(token: string): Promise<{ sayfaId?: string; sayfaAd?: string; igId?: string; igAd?: string; hata?: string }> {
  try {
    const r = await fetch(`${GRAPH}/me?fields=id,name,instagram_business_account{id,username}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
    const v = (await r.json().catch(() => ({}))) as { id?: string; name?: string; instagram_business_account?: { id?: string; username?: string }; error?: { message?: string } };
    if (!r.ok || !v.id) return { hata: v.error?.message ? `Meta yanıtı: ${v.error.message}` : `Meta yanıtı ${r.status}` };
    return { sayfaId: v.id, sayfaAd: v.name, igId: v.instagram_business_account?.id, igAd: v.instagram_business_account?.username };
  } catch (e) { return { hata: `Meta'ya ulaşılamadı: ${(e as Error).message}` }; }
}

/** Ziyaretçiye metin mesajı (Messenger 2000, Instagram 1000 karakterlik parçalar halinde). */
/** insanEtiketi: 24 saat sonrası insan temsilci yanıtı (HUMAN_AGENT etiketi, 7 gün). */
export async function metaGonder(token: string, alici: string, metin: string, instagram = false, insanEtiketi = false): Promise<string | null> {
  const parcalar = duzMetin(metin).match(new RegExp(`[\\s\\S]{1,${instagram ? 1000 : 2000}}`, "g")) ?? [""];
  for (const p of parcalar.slice(0, 5)) {
    try {
      const r = await fetch(`${GRAPH}/me/messages`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({ recipient: { id: alici }, ...(insanEtiketi ? { messaging_type: "MESSAGE_TAG", tag: "HUMAN_AGENT" } : { messaging_type: "RESPONSE" }), message: { text: p || "(boş yanıt)" } }),
      });
      if (!r.ok) {
        const v = (await r.json().catch(() => ({}))) as { error?: { message?: string; code?: number } };
        return v.error?.code === 10 || /24 hour|outside of allowed window/i.test(v.error?.message ?? "") ? (insanEtiketi ? "Meta insan temsilci etiketini kabul etmedi: son mesajdan 7 gün geçmiş ya da uygulamanın HUMAN_AGENT izni yok." : "Meta son mesajdan 24 saat sonra yanıt göndermeye izin vermiyor.") : `${instagram ? "Instagram" : "Messenger"} mesajı gönderilemedi (${r.status}): ${v.error?.message ?? "bilinmeyen hata"}`;
      }
    } catch (e) { return `Meta'ya ulaşılamadı: ${(e as Error).message}`; }
  }
  return null;
}

export function metaImzaDogru(gizli: string, ham: string, imza: string | null): boolean {
  if (!imza) return false;
  const bek = `sha256=${createHmac("sha256", gizli).update(ham).digest("hex")}`;
  return imza.length === bek.length && timingSafeEqual(Buffer.from(imza), Buffer.from(bek));
}

export type MetaMesaj = { kanal: "messenger" | "instagram"; gonderen: string; metin?: string; ek: boolean };
/** Webhook gövdesinden ziyaretçi mesajları (yankılar ve teslim bildirimleri atlanır). */
export function metaMesajlari(o: unknown): MetaMesaj[] {
  const v = (o ?? {}) as { object?: string; entry?: { messaging?: { sender?: { id?: string }; message?: { text?: string; is_echo?: boolean; attachments?: unknown[] } }[] }[] };
  const kanal = v.object === "instagram" ? "instagram" : v.object === "page" ? "messenger" : null;
  if (!kanal) return [];
  return (v.entry ?? []).flatMap((e) => e.messaging ?? []).filter((m) => m.sender?.id && m.message && !m.message.is_echo)
    .map((m) => ({ kanal, gonderen: m.sender!.id!, metin: m.message!.text, ek: !!m.message!.attachments?.length }));
}
