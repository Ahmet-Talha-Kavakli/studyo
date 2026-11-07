import "server-only";
import { ajanGetirOz, surumAyari, yayindakiAjan, type Ajan, type SurumAyar } from "./ajanDepo";
import { kanalaGonderOz } from "./ajanKanal";
import { kisiOzellikYaz } from "./ajanKisi";
import { baglamKur, beklemeSil, prosedurTuru, suresiDolanlar, type PDurum, type POlay } from "./ajanProsedur";
import { dokum, olayMesaji } from "./ajanYonlendir";
import type { Kanal } from "./ajanKatalog";
import { denemeOku, denemeYaz, konusmaGuncelleAsenkron, type ZiyaretciKonusma } from "./ziyaretciDepo";

/**
 * Prosedürün konuşma dışından ilerlemesi: web kancası geldi, temsilci onayladı ya da reddetti, bekleme süresi doldu.
 * Konuşma kilit altında okunur, motor yürür, mesaj konuşmaya yazılır ve mesajlaşma kanalıysa ziyaretçiye gönderilir
 * (web kutusu ve paylaşım sayfası yoklamayla görür). Deneme sohbeti (düzenleyici) de aynı yoldan ilerler.
 */
const MESAJLASMA = new Set(["telegram", "whatsapp", "slack", "messenger", "instagram", "sms", "eposta", "discord", "teams", "line", "site"]);

async function ayarBul(ajan: Ajan, d: PDurum): Promise<SurumAyar> {
  if (d.surum !== null) { const y = await yayindakiAjan(ajan.id); const s = ajan.surumler.find((x) => x.no === d.surum); if (s) return s.ayar; if (y) return y.ayar; }
  return surumAyari(ajan);
}
/** Prosedür bitince toplanan (gizli olmayan) bilgiler kişi kaydına yazılır. */
export async function kisiyeYaz(sahipOz: string, kisi: string | undefined, d: PDurum) {
  if (!kisi) return;
  const gizli = new Set(d.tanim.adimlar.flatMap((a) => (a.alanlar ?? []).filter((f) => f.gizli).map((f) => f.ad)));
  const alanlar = new Set(d.tanim.adimlar.flatMap((a) => (a.alanlar ?? []).map((f) => f.ad)));
  const o: Record<string, string> = {};
  for (const [k, v] of Object.entries(d.degiskenler)) if (alanlar.has(k) && !gizli.has(k) && typeof v === "string") o[k] = v;
  if (Object.keys(o).length) await kisiOzellikYaz(sahipOz, kisi, o).catch(() => {});
}

export async function prosedurDisOlay(h: { ajanId: string; sahipOz: string; dosyaId: string }, olay: POlay): Promise<{ hata?: string; kanalHata?: string; mesaj?: string }> {
  const ajan = await ajanGetirOz(h.ajanId, h.sahipOz);
  if (!ajan) return { hata: "Ajan bulunamadı." };
  if (h.dosyaId === "deneme") {
    const k = await denemeOku(h.ajanId);
    if (!k?.prosedur) return { hata: "Süren bir prosedür yok." };
    const ayar = await ayarBul(ajan, k.prosedur);
    const t = await prosedurTuru({ ajan, ayar, sahipOz: h.sahipOz, kanal: "test", surum: k.prosedur.surum, k, d: k.prosedur, olay, ctx: baglamKur({ ajan, ayar, sahipOz: h.sahipOz, dosyaId: "deneme", dokum: () => dokum(k.mesajlar, 12) }), konusmaId: "deneme" });
    await denemeYaz(h.ajanId, k);
    return { mesaj: t.metin };
  }
  let gonder: { kaynak: string; adres: string; metin: string; eposta?: ZiyaretciKonusma["eposta"] } | null = null;
  let devredildi = false;
  const v = await konusmaGuncelleAsenkron(h.ajanId, h.dosyaId, async (k) => {
    if (!k.prosedur) return "Süren bir prosedür yok.";
    const d = k.prosedur;
    const ayar = await ayarBul(ajan, d);
    const t = await prosedurTuru({ ajan, ayar, sahipOz: h.sahipOz, kanal: k.kaynak as Kanal, surum: d.surum, k, d, olay, ctx: baglamKur({ ajan, ayar, sahipOz: h.sahipOz, dosyaId: h.dosyaId, dokum: () => dokum(k.mesajlar, 12) }), konusmaId: h.dosyaId });
    if (t.sonuc.devret) {
      k.durum = "devredildi"; k.devir = { zaman: Date.now(), neden: t.sonuc.devret }; k.okunmadi = true;
      k.mesajlar.push(olayMesaji("devir", `Konuşma insana devredildi: ${t.sonuc.devret}`));
      devredildi = true;
    }
    if (t.metin && MESAJLASMA.has(k.kaynak) && k.adres) gonder = { kaynak: k.kaynak, adres: k.adres, metin: t.metin, eposta: k.eposta };
  });
  if (!v) return { hata: "Konuşma bulunamadı." };
  if (typeof v === "string") return { hata: v };
  if (devredildi) { const { otomatikAta } = await import("./ajanGelen"); await otomatikAta(h.sahipOz, h.ajanId, h.dosyaId).catch(() => null); }
  const gn = gonder as { kaynak: string; adres: string; metin: string; eposta?: ZiyaretciKonusma["eposta"] } | null;
  const kanalHata = gn ? (await kanalaGonderOz(h.ajanId, h.sahipOz, gn.kaynak, gn.adres, gn.metin, { eposta: gn.eposta })) ?? undefined : undefined;
  return { kanalHata };
}

/** Süresi dolan web kancası beklemeleri: zaman aşımı yoluna gider. Dönüş: işlenen sayı. */
export async function prosedurZamanAsimlari(): Promise<number> {
  let n = 0;
  for (const b of await suresiDolanlar()) {
    await beklemeSil(b.gizli);
    const r = await prosedurDisOlay({ ajanId: b.ajanId, sahipOz: b.sahipOz, dosyaId: b.dosyaId }, { tur: "zamanasimi" }).catch(() => ({ hata: "hata" }));
    if (!r.hata) n++;
  }
  return n;
}
