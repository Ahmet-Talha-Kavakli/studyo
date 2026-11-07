import "server-only";
import { dilimGecerli } from "./bolge";
import { yeniKimlik } from "./sistemDepo";
import { ISLETME_OLAYLARI, kancaImzaBul, servisOlayBul } from "./sistemTetikKatalog";
import { SABIT_DALLAR, cronCoz, type Adim, type AdimTuru, type CiktiAlani, type Dal, type GirdiAlani, type Kosul, type NotKarti, type Tetikleyici, type VeriOlay } from "./sistemKatalog";

/** İstemciden gelen akışı doğrular ve sınırlar (derinlik 5, toplam 80 adım, dal 2 ile 10). */
const TETIK = ["elle", "zaman", "webhook", "form", "veri", "sistem", "rss", "eposta", "odeme", "formSayfasi", "sohbet", "servis", "isletme"];
const ADIM: AdimTuru[] = ["ajan", "arac", "baglanti", "http", "kosul", "veri", "bekle", "yonlendirici", "siniflandir", "dongu", "onay", "kod", "donustur", "cagir", "guvenlik", "yanit", "paralel", "depo", "uygulama"];
const TARIH = /^\d{4}-\d{2}-\d{2}$/;
const KIM = /^[A-Za-z0-9_-]{1,16}$/;
const ALAN_ADI = /^[\p{L}_][\p{L}\p{N}_]{0,39}$/u;
const kim = (v: unknown) => (typeof v === "string" && KIM.test(v) ? v : yeniKimlik());
const metin = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

export function tetikTemizle(t: Partial<Tetikleyici> & Record<string, unknown>): Tetikleyici | null {
  if (!t || !TETIK.includes(String(t.tur))) return null;
  const id = kim(t.id);
  switch (t.tur) {
    case "zaman": {
      const z = (t.zaman ?? {}) as Record<string, unknown>;
      const siklik = ["dakikalik", "saatlik", "gunluk", "haftalik", "aylik", "ozel"].includes(String(z.siklik)) ? String(z.siklik) : "gunluk";
      const saat = /^\d{2}:\d{2}$/.test(String(z.saat)) ? String(z.saat) : "09:00";
      const saatler = Array.isArray(z.saatler) ? [...new Set(z.saatler.map(String).filter((x) => /^\d{2}:\d{2}$/.test(x) && Number(x.slice(0, 2)) < 24 && Number(x.slice(3)) < 60))].sort().slice(0, 24) : undefined;
      const ayGunleri = Array.isArray(z.ayGunleri) ? [...new Set(z.ayGunleri.map(Number).filter((g) => Number.isInteger(g) && g >= 1 && g <= 32))].sort((a, b) => a - b) : undefined;
      const cron = typeof z.cron === "string" ? z.cron.trim().slice(0, 120) : undefined;
      if (siklik === "ozel" && (!cron || cronCoz(cron).hata)) return { id, tur: "zaman", zaman: { siklik: "ozel", cron: cron ?? "0 9 * * 1-5", ...(dilimGecerli(z.saatDilimi) ? { saatDilimi: String(z.saatDilimi) } : {}) } };
      return { id, tur: "zaman", zaman: {
        siklik: siklik as "gunluk", saat, ...(saatler?.length ? { saatler } : {}), her: Math.max(1, Math.min(1440, Number(z.her) || (siklik === "dakikalik" ? 15 : 1))),
        gunler: Array.isArray(z.gunler) ? z.gunler.map(Number).filter((g) => g >= 1 && g <= 7).slice(0, 7) : [1], ayGunu: Math.max(1, Math.min(31, Number(z.ayGunu) || 1)),
        ...(ayGunleri?.length ? { ayGunleri } : {}), ...(siklik === "ozel" && cron ? { cron } : {}),
        ...(TARIH.test(String(z.baslangic)) ? { baslangic: String(z.baslangic) } : {}), ...(TARIH.test(String(z.bitis)) ? { bitis: String(z.bitis) } : {}),
        ...(Number(z.tolerans) > 0 ? { tolerans: Math.min(10_080, Math.round(Number(z.tolerans))) } : {}),
        ...(dilimGecerli(z.saatDilimi) ? { saatDilimi: String(z.saatDilimi) } : {}),
      } };
    }
    case "form": return { id, tur: "form", projeId: metin(t.projeId, 20) };
    case "veri": {
      const olaylar = (Array.isArray(t.olaylar) ? t.olaylar : []).filter((o): o is VeriOlay => o === "ekle" || o === "guncelle" || o === "sil");
      return { id, tur: "veri", projeId: metin(t.projeId, 20), koleksiyon: metin(t.koleksiyon, 40), ...(olaylar.length ? { olaylar: [...new Set(olaylar)] } : {}) };
    }
    case "rss": return { id, tur: "rss", adres: metin(t.adres, 2000).trim(), aralik: Math.max(5, Math.min(1440, Math.round(Number(t.aralik) || 15))) };
    case "odeme": {
      const durumlar = (Array.isArray(t.durumlar) ? t.durumlar : []).filter((o): o is "odendi" | "iade" | "basarisiz" => o === "odendi" || o === "iade" || o === "basarisiz");
      return { id, tur: "odeme", projeId: metin(t.projeId, 20), ...(durumlar.length ? { durumlar: [...new Set(durumlar)] } : {}), ...(t.test ? { test: true } : {}) };
    }
    case "formSayfasi": {
      const bitis = t.bitis === "sonuc" || t.bitis === "yonlendir" ? t.bitis : "mesaj";
      const yon = metin(t.yonlendir, 1000).trim();
      return { id, tur: "formSayfasi", baslik: metin(t.baslik, 120).trim() || undefined, aciklama: metin(t.aciklama, 1500) || undefined, dugme: metin(t.dugme, 40).trim() || undefined, bitis, mesaj: metin(t.mesaj, 2000) || undefined, yonlendir: /^https?:\/\/\S+$/.test(yon) ? yon : undefined, ...(t.tekrar === false ? { tekrar: false } : {}) };
    }
    case "sohbet": {
      const oneriler = (Array.isArray(t.oneriler) ? t.oneriler : []).map((x) => String(x ?? "").trim().slice(0, 80)).filter(Boolean).slice(0, 6);
      return { id, tur: "sohbet", baslik: metin(t.baslik, 80).trim() || undefined, altBaslik: metin(t.altBaslik, 160).trim() || undefined, karsilama: metin(t.karsilama, 1000) || undefined, yerTutucu: metin(t.yerTutucu, 80).trim() || undefined, ...(oneriler.length ? { oneriler } : {}), alanAdlari: metin(t.alanAdlari, 600).trim() || undefined, gecmis: Math.max(0, Math.min(30, Math.round(Number(t.gecmis ?? 10)))) };
    }
    case "eposta": return { id, tur: "eposta", ...(typeof t.gonderen === "string" && t.gonderen.trim() ? { gonderen: t.gonderen.trim().slice(0, 600) } : {}) };
    case "sistem": return { id, tur: "sistem", sistemId: metin(t.sistemId, 12) };
    case "webhook": return { id, tur: "webhook", anahtarSonu: typeof t.anahtarSonu === "string" ? t.anahtarSonu.slice(0, 6) : undefined, yanit: typeof t.yanit === "string" && t.yanit ? t.yanit.slice(0, 2000) : undefined, dogrulama: typeof t.dogrulama === "string" ? t.dogrulama.replace(/[^\w.-]/g, "").slice(0, 80) : undefined,
      ...(typeof t.imza === "string" && kancaImzaBul(t.imza) ? { imza: t.imza } : {}), ...(t.imza === "ozel" && typeof t.imzaBaslik === "string" && /^[A-Za-z0-9-]{1,60}$/.test(t.imzaBaslik) ? { imzaBaslik: t.imzaBaslik } : {}), ...(t.yanitModu === "bitince" ? { yanitModu: "bitince" as const } : {}) };
    case "servis": {
      const o = servisOlayBul(t.olay);
      const ayar = Object.fromEntries(Object.entries((t.ayar && typeof t.ayar === "object" ? t.ayar : {}) as Record<string, unknown>).filter(([k, v]) => /^[\w-]{1,40}$/.test(k) && (typeof v === "string" || typeof v === "number")).slice(0, 20).map(([k, v]) => [k, String(v).slice(0, 2000)]));
      return { id, tur: "servis", servis: o?.servis ?? metin(t.servis, 40), olay: o?.id ?? "", ayar, aralik: Math.max(1, Math.min(1440, Math.round(Number(t.aralik) || 5))), ...(typeof t.baglanti === "string" && /^[A-Za-z0-9_-]{10}$/.test(t.baglanti) ? { baglanti: t.baglanti } : {}) };
    }
    case "isletme": return { id, tur: "isletme", projeId: metin(t.projeId, 20), olay: ISLETME_OLAYLARI.some((x) => x.id === t.olay) ? (t.olay as "siparis") : "siparis" };
    default: return { id, tur: "elle", ...(t.form ? { form: true } : {}) };
  }
}

function kosullar(v: unknown): Kosul[] {
  return (Array.isArray(v) ? v : []).slice(0, 10).map((k) => ({ sol: metin((k as Kosul)?.sol, 4000), islec: metin((k as Kosul)?.islec, 20) || "esit", sag: metin((k as Kosul)?.sag, 4000) }));
}
function alanlar(v: unknown): CiktiAlani[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const o: CiktiAlani[] = [];
  for (const x of v.slice(0, 20)) {
    const ad = metin((x as CiktiAlani)?.ad, 40).trim();
    if (!ad || !ALAN_ADI.test(ad) || ad === "cikti" || ad === "hata" || o.some((y) => y.ad === ad)) continue;
    const tur = ["metin", "sayi", "evet-hayir", "liste", "nesne"].includes(String((x as CiktiAlani).tur)) ? (x as CiktiAlani).tur : "metin";
    o.push({ ad, tur, aciklama: metin((x as CiktiAlani).aciklama, 300) || undefined });
  }
  return o.length ? o : undefined;
}

export function adimlariTemizle(l: unknown, sayac = { n: 0 }, derinlik = 0): Adim[] {
  if (!Array.isArray(l) || derinlik > 5) return [];
  const o: Adim[] = [];
  for (const ham of l) {
    if (sayac.n >= 80) break;
    const a = ham as Partial<Adim>;
    if (!a || !ADIM.includes(a.tur as AdimTuru)) continue;
    sayac.n++;
    const ayar: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(a.ayar ?? {}).slice(0, 30)) if (/^[a-zA-Z][a-zA-Z0-9]{0,23}$/.test(k) && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")) ayar[k] = typeof v === "string" ? v.slice(0, 20000) : v;
    const y: Adim = { id: kim(a.id), ad: metin(a.ad, 80) || "Adım", tur: a.tur as AdimTuru, ayar, hata: a.hata === "devam" || a.hata === "dal" || a.hata === "yedek" ? a.hata : "durdur" };
    if (a.tekrar && typeof a.tekrar === "object") { const sayi = Math.max(0, Math.min(5, Math.round(Number(a.tekrar.sayi) || 0))); if (sayi) y.tekrar = { sayi, bekleme: Math.max(1, Math.min(3600, Math.round(Number(a.tekrar.bekleme) || 5))), artan: !!a.tekrar.artan }; }
    if (y.hata === "dal") { y.hataDali = adimlariTemizle(a.hataDali, sayac, derinlik + 1); y.hataSonrasi = a.hataSonrasi === "devam" ? "devam" : "bitir"; }
    if (a.kapali) y.kapali = true;
    if (y.tur === "kosul") { y.kosullar = kosullar(a.kosullar); y.baglac = a.baglac === "veya" ? "veya" : "ve"; }
    if (y.tur === "veri" && Array.isArray(a.kosullar) && a.kosullar.length) y.kosullar = kosullar(a.kosullar);
    if (y.tur === "ajan") { const al = alanlar(a.alanlar); if (al) y.alanlar = al; }
    if (y.tur === "dongu") y.govde = adimlariTemizle(a.govde, sayac, derinlik + 1);
    if (y.tur === "paralel") {
      const ham = (Array.isArray(a.dallar) ? a.dallar : []) as Partial<Dal>[];
      y.dallar = ham.filter((d) => d && !d.yedek).slice(0, 5).map((d) => ({ id: kim(d.id) === "yedek" ? yeniKimlik() : kim(d.id), ad: metin(d.ad, 60) || "Dal", adimlar: adimlariTemizle(d.adimlar, sayac, derinlik + 1) }));
      if (!y.dallar.length) y.dallar = [{ id: yeniKimlik(), ad: "Dal A", adimlar: [] }, { id: yeniKimlik(), ad: "Dal B", adimlar: [] }];
    }
    if (y.tur === "yonlendirici" || y.tur === "siniflandir") {
      const ham = (Array.isArray(a.dallar) ? a.dallar : []) as Partial<Dal>[];
      const dallar: Dal[] = ham.filter((d) => d && !d.yedek).slice(0, 10).map((d) => ({
        id: kim(d.id) === "yedek" ? yeniKimlik() : kim(d.id), ad: metin(d.ad, 60) || "Dal", aciklama: metin(d.aciklama, 600) || undefined,
        ...(y.tur === "yonlendirici" ? { kosullar: kosullar(d.kosullar), baglac: d.baglac === "veya" ? "veya" as const : "ve" as const } : {}),
        adimlar: adimlariTemizle(d.adimlar, sayac, derinlik + 1),
      }));
      const yd = ham.find((d) => d?.yedek);
      dallar.push({ id: "yedek", ad: "Hiçbiri uymazsa", yedek: true, aciklama: y.tur === "siniflandir" ? metin(yd?.aciklama, 600) || undefined : undefined, adimlar: adimlariTemizle(yd?.adimlar, sayac, derinlik + 1) });
      y.dallar = dallar;
    }
    if (SABIT_DALLAR[y.tur]) {
      const ham = (Array.isArray(a.dallar) ? a.dallar : []) as Partial<Dal>[];
      y.dallar = SABIT_DALLAR[y.tur]!.map((d) => ({ ...d, adimlar: adimlariTemizle(ham.find((z) => z?.id === d.id)?.adimlar, sayac, derinlik + 1) }));
    }
    o.push(y);
  }
  // Kimlikler benzersiz olsun.
  return o;
}
/** Ağaç genelinde yinelenen kimlikleri yeniler. */
export function kimlikleriTekle(l: Adim[]): Adim[] {
  const gorulen = new Set<string>();
  const gez = (x: Adim[]) => x.map((a): Adim => {
    const id = gorulen.has(a.id) ? yeniKimlik() : a.id; gorulen.add(id);
    return { ...a, id, dallar: a.dallar?.map((d) => ({ ...d, adimlar: gez(d.adimlar) })), govde: a.govde ? gez(a.govde) : undefined, hataDali: a.hataDali ? gez(a.hataDali) : undefined };
  });
  return gez(l);
}

/** Not kartları (en çok 40). */
export function notlarTemizle(v: unknown): NotKarti[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 40).map((n) => {
    const x = (n ?? {}) as Partial<NotKarti>;
    return { id: kim(x.id), metin: metin(x.metin, 2000), renk: ["sari", "mavi", "mor", "gri"].includes(String(x.renk)) ? x.renk! : "sari", x: Math.max(-6000, Math.min(6000, Math.round(Number(x.x) || 0))), y: Math.max(-200, Math.min(20_000, Math.round(Number(x.y) || 0))) };
  });
}
/** Girdi alanları (en çok 30; adlar benzersiz, JSON anahtarı olarak geçerli). */
export function girdiTemizle(v: unknown): GirdiAlani[] {
  if (!Array.isArray(v)) return [];
  const o: GirdiAlani[] = [];
  for (const h of v.slice(0, 30)) {
    const x = (h ?? {}) as Partial<GirdiAlani>;
    const ad = metin(x.ad, 40).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]{0,39}$/.test(ad) || o.some((y) => y.ad === ad)) continue;
    const tur = ["metin", "uzunMetin", "sayi", "evet-hayir", "tarih", "secim", "eposta", "telefon", "coklu", "gizli"].includes(String(x.tur)) ? x.tur! : "metin";
    o.push({ ad, tur, ...(metin(x.etiket, 80).trim() ? { etiket: metin(x.etiket, 80).trim() } : {}), ...(x.zorunlu ? { zorunlu: true } : {}), ...(metin(x.varsayilan, 500) ? { varsayilan: metin(x.varsayilan, 500) } : {}), ...(metin(x.aciklama, 300).trim() ? { aciklama: metin(x.aciklama, 300).trim() } : {}), ...(metin(x.yer, 120).trim() ? { yer: metin(x.yer, 120).trim() } : {}), ...((tur === "secim" || tur === "coklu") && Array.isArray(x.secenekler) ? { secenekler: [...new Set(x.secenekler.map((z) => String(z).trim().slice(0, 80)).filter(Boolean))].slice(0, 30) } : {}) });
  }
  return o;
}
/** Etiketler (en çok 8, 24 karakter). */
export function etiketTemizle(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map((x) => String(x ?? "").trim().replace(/\s+/g, " ").slice(0, 24)).filter(Boolean))].slice(0, 8);
}
