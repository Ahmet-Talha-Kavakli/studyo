import "server-only";
import { ARAC_KATALOG, type AracIzni } from "./ajanKatalog";
import { varsayilanDevir, varsayilanKoruma, yeniKimlik, type Ajan, type AjanAyar, type AjanBilgi, type AjanTest } from "./ajanDepo";
import { modelBul } from "./modeller";
import { prosedurTemizle } from "./ajanProsedurTip";

/**
 * Ajan paketi: bir ajanın taşınabilir JSON hali (dışa aktarma, içe aktarma, başka hesaba taşıma).
 * Sahibe özel kimlikler (bağlantılar, yetenekler, ekip) pakete ad olarak yazılır; içe aktarınca yeniden seçilmeleri gerekir.
 * Bilgi kaynaklarının metni pakette durur; web adresi kaynakları ilk yenilemede tazelenir.
 */
export type AjanPaketi = {
  vayra: "ajan"; surum: 1; tarih: string;
  ayar: Omit<AjanAyar, "baglantilar" | "yetenekler" | "ekip" | "bellek" | "bilgi"> & { bilgi: Pick<AjanBilgi, "ad" | "tur" | "icerik" | "url" | "ne" | "yenile" | "altSayfa">[] };
  testler: Pick<AjanTest, "soru" | "beklenen" | "tur" | "persona" | "turSiniri">[];
  gereken: { baglantilar: string[]; yetenekler: string[]; ekip: string[] };
};

const SIMGE = /^(\/gercek\/[\w/.-]+\.(webp|png|jpg)|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+|https:\/\/[^\s"']+)$/;
const IZIN = new Set<AracIzni>(["her-zaman", "sor", "kapali"]);
const metin = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
const nesne = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export function paketle(a: Ajan, adlar: { baglanti: (id: string) => string; yetenek: (id: string) => string; ajan: (id: string) => string }): AjanPaketi {
  return {
    vayra: "ajan", surum: 1, tarih: new Date().toISOString(),
    ayar: {
      ad: a.ad, aciklama: a.aciklama, talimat: a.talimat, simge: a.simge.startsWith("data:") && a.simge.length > 400_000 ? "" : a.simge, model: a.model,
      ...(a.yedekModel ? { yedekModel: a.yedekModel } : {}), efor: a.efor, araclar: a.araclar,
      bilgi: a.bilgi.map((b) => ({ ad: b.ad, tur: b.tur, icerik: b.icerik, url: b.url, ne: b.ne, yenile: b.yenile, altSayfa: b.altSayfa })),
      baslangiclar: a.baslangiclar, karsilama: a.karsilama, koruma: a.koruma, devir: a.devir,
      yonlendirme: { acik: a.yonlendirme.acik, geriDonus: a.yonlendirme.geriDonus, uzmanlar: [] },
      prosedurler: a.prosedurler ?? [],
    },
    testler: a.testler.map((t) => ({ soru: t.soru, beklenen: t.beklenen, tur: t.tur, persona: t.persona, turSiniri: t.turSiniri })),
    gereken: { baglantilar: (a.baglantilar ?? []).map(adlar.baglanti), yetenekler: (a.yetenekler ?? []).map(adlar.yetenek), ekip: [...new Set([...(a.ekip ?? []), ...a.yonlendirme.uzmanlar.map((u) => u.id)])].map(adlar.ajan) },
  };
}

/** Paketi doğrular; ajan ayarı, bilgi kaynakları, testler ve kullanıcıya gösterilecek uyarılar. */
export function paketCoz(v: unknown): { ayar: Partial<AjanAyar>; bilgi: AjanBilgi[]; testler: AjanTest[]; uyarilar: string[] } | { hata: string } {
  const p = nesne(v);
  if (p.vayra !== "ajan") return { hata: "Bu dosya bir Vayra ajan paketi değil." };
  if (p.surum !== 1) return { hata: "Paket sürümü desteklenmiyor." };
  const a = nesne(p.ayar);
  const ad = metin(a.ad, 60).trim();
  if (!ad) return { hata: "Pakette ajan adı yok." };
  const uyarilar: string[] = [];
  const araclar: Record<string, AracIzni> = {};
  const ham = nesne(a.araclar);
  for (const t of ARAC_KATALOG) { const x = ham[t.id]; if (typeof x === "string" && IZIN.has(x as AracIzni)) araclar[t.id] = x as AracIzni; }
  const model = modelBul(metin(a.model, 80)).id;
  if (metin(a.model, 80) && metin(a.model, 80) !== model) uyarilar.push(`"${metin(a.model, 80)}" modeli bulunamadı; varsayılan model seçildi.`);
  const yedek = metin(a.yedekModel, 80);
  const koruma = { ...varsayilanKoruma(), ...nesne(a.koruma) } as AjanAyar["koruma"];
  koruma.yasakKonular = Array.isArray(koruma.yasakKonular) ? koruma.yasakKonular.filter((x): x is string => typeof x === "string").slice(0, 30).map((x) => x.slice(0, 120)) : [];
  koruma.kisisel = koruma.kisisel === true; koruma.enjeksiyon = koruma.enjeksiyon !== false; koruma.yasakYanit = metin(koruma.yasakYanit, 300) || varsayilanKoruma().yasakYanit;
  const devirHam = { ...varsayilanDevir(), ...nesne(a.devir) };
  const devir: AjanAyar["devir"] = { acik: devirHam.acik === true, kurallar: metin(devirHam.kurallar, 2000), mesaj: metin(devirHam.mesaj, 300) || varsayilanDevir().mesaj };
  const simge = metin(a.simge, 500_000);
  const ayar: Partial<AjanAyar> = {
    ad, aciklama: metin(a.aciklama, 300), talimat: metin(a.talimat, 32000), model, efor: a.efor === "low" || a.efor === "high" ? a.efor : "medium", araclar,
    ...(yedek && modelBul(yedek).id !== model ? { yedekModel: modelBul(yedek).id } : {}),
    ...(SIMGE.test(simge) ? { simge } : {}),
    baslangiclar: (Array.isArray(a.baslangiclar) ? a.baslangiclar : []).filter((x): x is string => typeof x === "string").slice(0, 4).map((x) => x.slice(0, 200)),
    karsilama: metin(a.karsilama, 300), koruma, devir,
    prosedurler: (Array.isArray(a.prosedurler) ? a.prosedurler : []).slice(0, 30).map(prosedurTemizle),
  };
  let toplam = 0;
  const bilgi: AjanBilgi[] = [];
  for (const x of (Array.isArray(a.bilgi) ? a.bilgi : []).slice(0, 40)) {
    const b = nesne(x);
    const tur = b.tur === "adres" || b.tur === "dosya" ? b.tur : "metin";
    const icerik = metin(b.icerik, 400_000);
    if (!icerik && tur !== "adres") continue;
    if (toplam + icerik.length > 2_000_000) { uyarilar.push("Bilgi kaynaklarının bir kısmı boyut sınırı yüzünden alınmadı."); break; }
    toplam += icerik.length;
    const url = tur === "adres" && typeof b.url === "string" && /^https?:\/\/\S{3,500}$/.test(b.url) ? b.url : undefined;
    bilgi.push({ id: yeniKimlik(8), ad: metin(b.ad, 120) || "Bilgi", tur, icerik, boyut: icerik.length, eklenme: Date.now(), url, ne: metin(b.ne, 300) || undefined, yenile: b.yenile === "gunluk" || b.yenile === "haftalik" ? b.yenile : undefined, altSayfa: b.altSayfa === true || undefined, durum: "hazir" });
  }
  const testler: AjanTest[] = (Array.isArray(p.testler) ? p.testler : []).slice(0, 25).flatMap((x) => {
    const t = nesne(x);
    const persona = t.tur === "persona";
    const soru = metin(t.soru, 2000).trim(), beklenen = metin(t.beklenen, 2000).trim(), pr = metin(t.persona, 1500).trim();
    if (!beklenen || (persona ? !pr : !soru)) return [];
    return [{ id: yeniKimlik(8), soru, beklenen, olusturma: Date.now(), tur: persona ? "persona" as const : "tek" as const, kaynak: "elle" as const, ...(persona ? { persona: pr, turSiniri: typeof t.turSiniri === "number" ? Math.min(8, Math.max(2, Math.round(t.turSiniri))) : 4 } : {}) }];
  });
  const g = nesne(p.gereken);
  const adlar = (k: string) => (Array.isArray(g[k]) ? (g[k] as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 20) : []);
  if (adlar("baglantilar").length) uyarilar.push(`Bağlantılar yeniden seçilmeli: ${adlar("baglantilar").join(", ")}.`);
  if (adlar("yetenekler").length) uyarilar.push(`Yetenekler yeniden bağlanmalı: ${adlar("yetenekler").join(", ")}.`);
  if (adlar("ekip").length) uyarilar.push(`Ekip ajanları yeniden seçilmeli: ${adlar("ekip").join(", ")}.`);
  return { ayar, bilgi, testler, uyarilar };
}
