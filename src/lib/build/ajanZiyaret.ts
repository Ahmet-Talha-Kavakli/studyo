import "server-only";
import { createHash } from "crypto";
import { KANAL_AD } from "./ajanKatalog";
import { ajanSayacArtir, trGun, type yayindakiAjan } from "./ajanDepo";
import { olayMesaji, yonlendirmeliCalistir, type YonSonuc } from "./ajanYonlendir";
import { kisiBagla, kisiBaglami, type KimlikGirdi } from "./ajanKisi";
import { surumSec } from "./ajanOrtam";
import { modelBul } from "./modeller";
import { modelBagli } from "./disAjan";
import { hizSiniri, konusmaDosyadan, konusmaKilidi, konusmaKimligi, konusmaOku, konusmaYaz, type Kaynak, type KMesaj, type ZDosya, type ZiyaretciKonusma } from "./ziyaretciDepo";
import { icerikDenetle } from "@/lib/moderasyon";

/**
 * Ziyaretçi mesajı (paylaşım sayfası, web kutusu, API, Telegram, WhatsApp, Slack, e-posta, Messenger, Instagram,
 * telefon, SMS, Discord, Teams, LINE, site canlı sohbeti): hız ve günlük sınır, konuşma durumu (insana
 * devredilmişse ajan susar, mesaj temsilciye düşer, sonraki yanıt SLA'sı başlar), sürüm seçimi (deneme ortamı,
 * kademeli yayın, A/B; konuşma başladığı sürümde kalır), kanallar arası kişi kimliği ve ortak hafıza, prosedürler,
 * çoklu ajan yönlendirme, mesajlaşma kanallarında memnuniyet anketi yanıtı (tek rakam), otomatik atama ve kayıt.
 */
export type Yayindaki = NonNullable<Awaited<ReturnType<typeof yayindakiAjan>>>;
export type ZiyaretSonuc =
  | { tur: "yanit"; sonuc: YonSonuc; konusma: ZiyaretciKonusma; konusmaId: string }
  | { tur: "insanda"; konusma: ZiyaretciKonusma; konusmaId: string; kullanici: KMesaj }
  | { tur: "anket"; konusma: ZiyaretciKonusma; konusmaId: string; yanit: string }
  | { tur: "hata"; hata: string; kod: number };

/** Kutu yalnız izinli alan adlarında (boşsa her yerde) çalışır; *.alan alt alanları kapsar. */
export function alanIzinli(izinli: string[], site: string) {
  return !izinli.length || izinli.some((a) => (a.startsWith("*.") ? site === a.slice(2) || site.endsWith(a.slice(1)) : site === a));
}

const yeniId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
/** Mesajlaşma kanallarında temsilci "çözüldü" deyince gönderilen anket sorusu. */
export const ANKET_SORUSU = "Yardımcı olabildik mi? 1 ile 5 arasında bir rakamla puan ver (5 çok iyi).";

/** Konuşmanın kişi kimlikleri: kanalın doğruladığı değerler güçlü, ziyaretçinin yazdıkları zayıf. */
function kimlikler(kaynak: Kaynak, kimlik: string, adres: string | undefined, k: ZiyaretciKonusma, dogrulanmis?: { eposta?: string }): { guclu: KimlikGirdi[]; zayif: KimlikGirdi[] } {
  const guclu: KimlikGirdi[] = [], zayif: KimlikGirdi[] = [];
  const kimlikDegeri = kimlik.replace(/^[a-z]{2,4}:/, "");
  if (kaynak === "whatsapp" || kaynak === "sms" || kaynak === "telefon") { if (adres) guclu.push({ tur: "telefon", deger: adres.startsWith("+") ? adres : `+${adres}` }); }
  else if (kaynak === "eposta") { if (adres) guclu.push({ tur: "eposta", deger: adres }); }
  else if (kaynak === "telegram") guclu.push({ tur: "telegram", deger: adres ?? kimlikDegeri });
  else if (kaynak === "messenger" || kaynak === "instagram") guclu.push({ tur: kaynak, deger: adres ?? kimlikDegeri });
  else if (kaynak === "slack" || kaynak === "discord" || kaynak === "teams" || kaynak === "line") guclu.push({ tur: kaynak, deger: kimlikDegeri });
  else if (kaynak === "kutu" || kaynak === "sayfa") guclu.push({ tur: "ziyaretci", deger: kimlikDegeri });
  else if (kaynak === "api") guclu.push({ tur: "api", deger: kimlikDegeri });
  else if (kaynak === "site") guclu.push({ tur: "site", deger: kimlikDegeri });
  if (dogrulanmis?.eposta) guclu.push({ tur: "eposta", deger: dogrulanmis.eposta });
  if (k.iletisim?.eposta && k.iletisim.eposta !== dogrulanmis?.eposta && kaynak !== "eposta") zayif.push({ tur: "eposta", deger: k.iletisim.eposta });
  if (k.iletisim?.telefon && !["whatsapp", "sms", "telefon"].includes(kaynak)) zayif.push({ tur: "telefon", deger: k.iletisim.telefon });
  // Prosedürün doğrulama adımıyla onaylanan e-posta ve telefon güçlüdür; yalnız toplanan değerler zayıftır.
  const dv = k.prosedur?.degiskenler ?? {};
  for (const a of k.prosedur?.tanim.adimlar ?? []) for (const f of a.alanlar ?? []) {
    const v = dv[f.ad];
    if (typeof v !== "string" || !v || v === "-" || (f.tur !== "eposta" && f.tur !== "telefon")) continue;
    (dv[`${f.ad}_dogrulandi`] === "evet" ? guclu : zayif).push({ tur: f.tur, deger: v });
  }
  return { guclu, zayif };
}

/** Diğer kanallardaki konuşmanın kısa özeti (kişi bağlamı için). */
async function konusmaOzeti(ajanId: string, dosyaId: string): Promise<string | null> {
  const k = await konusmaDosyadan(ajanId, dosyaId);
  if (!k) return null;
  const ilk = k.mesajlar.find((m) => m.rol === "kullanici")?.metin?.replace(/\s+/g, " ").slice(0, 160);
  if (!ilk) return null;
  const sonuc = k.durum === "cozuldu" ? "çözüldü" : k.durum === "devredildi" || k.durum === "insan" ? "temsilcide" : k.etiket?.sonuc === "cozuldu" ? "yanıtlandı" : "açık";
  return `"${ilk}" (${sonuc}${k.etiketler?.length ? `, konu: ${k.etiketler.join(", ")}` : ""})`;
}

export async function ziyaretciMesaji(g: {
  y: Yayindaki; kimlik: string; kaynak: Kaynak; site?: string; metin: string; yeni?: boolean; adres?: string;
  yaz?: (o: Record<string, unknown>) => void; signal?: AbortSignal; formZorunlu?: boolean;
  /** Kanaldan gelen kişi bilgisi (e-posta gönderen adı ve adresi). */
  iletisim?: ZiyaretciKonusma["iletisim"];
  /** Konuşmaya kayıttan önce uygulanacak kanal bilgisi (e-posta konusu). */
  hazirla?: (k: ZiyaretciKonusma) => void;
  /** Prosedürün bilgi toplama formundan gönderilen değerler. */
  form?: Record<string, string>;
  /** Sitenin imzaladığı kimlik (kutuda kimlik doğrulama). */
  dogrulanmis?: { eposta?: string; ad?: string };
  /** Deneme ortamı konuşması. */
  ortam?: "deneme";
  /** Web kutusundan yüklenen dosyalar (mesaja eklenir; ajana adı, türü ve boyutu bildirilir). */
  dosyalar?: ZDosya[];
}): Promise<ZiyaretSonuc> {
  const { y, kimlik, kaynak } = g;
  const { ajan } = y;
  const id = ajan.id;
  const dosyaNotu = g.dosyalar?.length ? `\n\n(Ziyaretçi dosya ekledi: ${g.dosyalar.map((d) => `${d.ad}, ${d.tur}, ${Math.max(1, Math.round(d.boyut / 1024))} KB`).join("; ")}. Dosyanın içeriğini göremiyorsun; gerekiyorsa ne içerdiğini sor ya da insana devret.)` : "";
  const metin = (g.form ? "(form)" : g.metin).trim().slice(0, 8000);
  if (!metin) return { tur: "hata", hata: "Mesaj boş.", kod: 400 };
  const d = icerikDenetle(g.form ? Object.values(g.form).join(" ") : metin);
  if (!d.izin) return { tur: "hata", hata: d.mesaj, kod: 422 };
  if (!hizSiniri(`${id}:${kimlik}`)) return { tur: "hata", hata: "Çok hızlı yazıyorsun; birkaç dakika sonra tekrar dene.", kod: 429 };
  const gun = trGun();
  const sayi = ajan.istatistik.gunluk?.gun === gun ? ajan.istatistik.gunluk.sayi : 0;
  if (sayi >= ajan.yayin.gunlukTavan) return { tur: "hata", hata: "Bu ajan bugünlük mesaj sınırına ulaştı. Yarın tekrar dene.", kod: 429 };
  const konusmaId = konusmaKimligi(id, kimlik);

  const sonuc = await konusmaKilidi(`${id}:${konusmaId}`, async (): Promise<ZiyaretSonuc> => {
    const eski = g.yeni ? null : await konusmaOku(id, kimlik);
    if (g.formZorunlu && !eski?.iletisim && !g.dogrulanmis?.eposta) return { tur: "hata", hata: "Sohbete başlamadan önce formu doldur.", kod: 428 };
    const k: ZiyaretciKonusma = eski ?? { mesajlar: [], gecmis: [], olusturma: Date.now(), guncelleme: Date.now(), kaynak, site: g.site, durum: "acik", iletisim: g.yeni ? (await konusmaOku(id, kimlik))?.iletisim : undefined };
    if (g.adres) k.adres = g.adres;
    if (g.ortam) k.ortam = g.ortam;
    if (g.iletisim && !k.iletisim) k.iletisim = g.iletisim;
    if (g.dogrulanmis?.eposta) k.iletisim = { ...(k.iletisim ?? {}), eposta: g.dogrulanmis.eposta, ...(g.dogrulanmis.ad ? { ad: g.dogrulanmis.ad } : {}), zaman: k.iletisim?.zaman ?? Date.now() };
    g.hazirla?.(k);
    k.ziyaretci ??= konusmaId.slice(0, 16);
    await ajanSayacArtir(id, (a) => {
      const g2 = a.istatistik.gunluk?.gun === gun ? a.istatistik.gunluk : { gun, sayi: 0 };
      a.istatistik.gunluk = { gun, sayi: g2.sayi + 1 };
      a.istatistik.ziyaretciMesaj += 1;
      if (!eski) a.istatistik.sohbet += 1;
    });

    // Kanallar arası kişi: kimlikler değişince yeniden bağlanır (aynı kişi farklı kanallarda tek kayıt).
    const ki = kimlikler(kaynak, kimlik, k.adres, k, g.dogrulanmis);
    const imza = createHash("sha256").update(JSON.stringify(ki)).digest("hex").slice(0, 16);
    if ((ki.guclu.length || ki.zayif.length) && (k.kisiImza !== imza || !k.kisi)) {
      const kisi = await kisiBagla(y.sahipOzeti, { ...ki, ad: k.iletisim?.ad, kanal: kaynak, mevcut: k.kisi, konusma: { ajanId: id, dosyaId: konusmaId, ilk: (k.mesajlar.find((m) => m.rol === "kullanici")?.metin ?? (g.form ? "" : metin)).slice(0, 140) } }).catch(() => null);
      if (kisi) { k.kisi = kisi; k.kisiImza = imza; }
    }

    // İnsana devredilmiş konuşma: ajan susar, mesaj temsilciyi bekler (sonraki yanıt SLA'sı başlar).
    if (k.durum === "devredildi" || k.durum === "insan") {
      const kullanici: KMesaj = { id: yeniId(), rol: "kullanici", zaman: Date.now(), metin: g.form ? Object.entries(g.form).map(([a, v]) => `${a}: ${v}`).join("\n") : metin, ...(g.dosyalar?.length ? { dosyalar: g.dosyalar } : {}) };
      k.mesajlar.push(kullanici);
      k.gecmis.push({ role: "user", content: [{ type: "text", text: kullanici.metin ?? "" }] });
      k.okunmadi = true;
      k.bekleyenZiyaretci ??= Date.now();
      await konusmaYaz(id, kimlik, k);
      g.yaz?.({ t: "insan", kullanici, durum: k.durum });
      return { tur: "insanda", konusma: k, konusmaId, kullanici };
    }
    // Mesajlaşma kanalında anket yanıtı: tek rakam 1-5 kaydedilir, ajan çalışmaz.
    if (k.csatBekliyor) {
      k.csatBekliyor = false;
      const p = /^\s*([1-5])\s*[.!]?\s*$/.exec(metin);
      if (p) {
        const puan = Number(p[1]);
        k.mesajlar.push({ id: yeniId(), rol: "kullanici", zaman: Date.now(), metin }, olayMesaji("csat", `Memnuniyet puanı 5 üzerinden ${puan}`));
        k.csat = { puan, zaman: Date.now() };
        await konusmaYaz(id, kimlik, k);
        return { tur: "anket", konusma: k, konusmaId, yanit: puan >= 4 ? "Teşekkürler, puanını aldık." : "Teşekkürler. Daha iyi olabilmemiz için ne eksikti, yazabilir misin?" };
      }
    }
    if (k.durum === "cozuldu") k.durum = "acik";
    const { ayar, surum } = surumSec(y, k, konusmaId);
    if (!modelBagli(modelBul(ayar.model)) && !k.prosedur && !(ayar.prosedurler ?? []).some((p) => p.acik)) return { tur: "hata", hata: "Bu ajan şu an yanıt veremiyor.", kod: 503 };

    const kisiOz = k.kisi ? `kisi:${k.kisi}` : k.ziyaretci;
    const etiket = k.iletisim?.ad ? `${k.iletisim.ad} (${KANAL_AD[kaynak]})` : `${KANAL_AD[kaynak]} ziyaretçisi ${konusmaId.slice(0, 4)}`;
    const kisiMetni = k.kisi ? await kisiBaglami(y.sahipOzeti, k.kisi, { ajanId: id, dosyaId: konusmaId }, (c) => konusmaOzeti(c.ajanId, c.dosyaId)).catch(() => "") : "";
    const sonuc = await yonlendirmeliCalistir({
      ajan, ayar, sahipOz: y.sahipOzeti, kanal: kaynak, surum, mod: "ziyaretci",
      konusma: k, kaydet: () => konusmaYaz(id, kimlik, k), metin: g.form ? undefined : metin + dosyaNotu, form: g.form, yaz: g.yaz, signal: g.signal, konusmaId,
      ziyaretci: { ozet: kisiOz ?? konusmaId.slice(0, 16), etiket }, ...(kisiMetni ? { ekSistem: kisiMetni } : {}),
    });
    // Dosyalar bu turda oluşan ziyaretçi mesajına bağlanır; ajana giden not arayüzdeki metinden çıkarılır.
    if (g.dosyalar?.length) { const m = [...k.mesajlar].reverse().find((x) => x.rol === "kullanici" && !x.olay); if (m) { m.dosyalar = g.dosyalar; if (m.metin && dosyaNotu) m.metin = m.metin.replace(dosyaNotu, ""); } }
    if (sonuc.devredildi) {
      k.durum = "devredildi"; k.devir = { zaman: Date.now(), neden: sonuc.devredildi }; k.okunmadi = true;
      k.mesajlar.push(olayMesaji("devir", `Konuşma insana devredildi: ${sonuc.devredildi}`));
    }
    await konusmaYaz(id, kimlik, k);
    return { tur: "yanit", sonuc, konusma: k, konusmaId };
  });
  if (sonuc.tur === "yanit" && sonuc.sonuc.devredildi) { const { otomatikAta } = await import("./ajanGelen"); await otomatikAta(y.sahipOzeti, id, konusmaId).catch(() => null); }
  return sonuc;
}
