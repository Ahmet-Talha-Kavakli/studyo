import "server-only";
import { calismaGuncelle } from "./ajanCalismaDepo";
import { KANAL_AD, type Kanal } from "./ajanKatalog";
import { ziyaretciMesaji, type Yayindaki } from "./ajanZiyaret";
import type { ZiyaretciKonusma } from "./ziyaretciDepo";

export type MesajKanali = Extract<Kanal, "telegram" | "whatsapp" | "slack" | "eposta" | "messenger" | "instagram" | "sms" | "discord" | "teams" | "line" | "site">;

/**
 * Mesajlaşma kanalından (Telegram, WhatsApp, Slack, e-posta, Messenger, Instagram, SMS) gelen metni ajana iletir,
 * yanıtı kanala gönderir ve gönderimi çalışma izine "kanal" adımı olarak ekler. Konuşma temsilcideyse ajan susar.
 * Çoklu ajan yönlendirmesinde ön kapı ve uzman yanıtları sırayla tek iletide gider. Anket yanıtına teşekkür edilir.
 */
export async function kanalMesaji(g: {
  y: Yayindaki; kaynak: MesajKanali; kimlik: string; adres: string; metin: string; gonder: (m: string) => Promise<string | null>;
  iletisim?: ZiyaretciKonusma["iletisim"]; hazirla?: (k: ZiyaretciKonusma) => void;
}): Promise<{ durum: string; hata?: string; yanit?: string }> {
  const r = await ziyaretciMesaji({ y: g.y, kimlik: g.kimlik, kaynak: g.kaynak, adres: g.adres, metin: g.metin, iletisim: g.iletisim, hazirla: g.hazirla });
  if (r.tur === "hata") { const h = await g.gonder(r.hata); return { durum: "hata", hata: h ?? r.hata }; }
  if (r.tur === "insanda") return { durum: "insanda" };
  if (r.tur === "anket") { const h = await g.gonder(r.yanit); return { durum: "anket", hata: h ?? undefined, yanit: r.yanit }; }
  const s = r.sonuc;
  const yanit = s.metinler.join("\n\n") || (s.calisma.durum === "hata" ? "Şu an yanıt veremiyorum; biraz sonra tekrar dener misin?" : "");
  if (!yanit) return { durum: s.calisma.durum };
  const bas = Date.now();
  const h = await g.gonder(yanit);
  const ad = KANAL_AD[g.kaynak];
  await calismaGuncelle(s.calisma.ajanId, s.calisma.id, (c) => {
    c.adimlar.push({ tur: "kanal", ad: g.kaynak, baslik: h ? `${ad} kanalına gönderilemedi` : `${ad} kanalına gönderildi`, durum: h ? "hata" : "bitti", baslangic: bas, sure: Date.now() - bas, ...(h ? { hata: h } : {}), girdi: `Alıcı ${g.adres}` });
    if (h) { c.durum = "hata"; c.hata = h; c.goruldu = false; }
  });
  return { durum: h ? "hata" : s.calisma.durum, hata: h ?? undefined, yanit };
}
