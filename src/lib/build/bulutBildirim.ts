import "server-only";
import { createHash, randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { guvenlikDenetimi } from "./bulut";
import { bulutAyarDegistir, bulutAyarOku, type BildirimTur } from "./bulutAyar";
import { epostaGonder, epostaKurulu } from "./bulutEposta";
import { kullanimOzeti } from "./bulutRapor";
import { gunlukOku, seviyeBul } from "./gunluk";
import { projeOkuHam } from "./depo";
import type { Proje } from "./tipler";

/**
 * Bulut bildirimleri (proje başına gelen kutusu). Denetimler:
 *  hata-artisi    son 1 saatteki sunucu hatası, önceki 24 saatin saatlik ortalamasının 3 katı ve en az 5
 *  istemci-hatasi canlı sitede yeni bir tarayıcı hatası (mesaj başına günde bir)
 *  yayin-hatasi   başarısız ya da durdurulan yayın (günlükte yayın türü, durum 400 ve üstü)
 *  kullanim       kota ya da sınırın yüzde 50, 75 ve 100'ü (ay başına bir kez)
 *  alan-adi       sorunlu alan adı (DNS ya da SSL)
 *  guvenlik       yok sayılmamış kritik güvenlik bulgusu
 * Aynı olay anahtarıyla bir kez yazılır. E-posta yalnız RESEND_API_KEY varsa ve sahip adres verdiyse gider.
 * Dosya: .veri/build/bulut-bildirim/<id>.json
 */
export type Bildirim = { id: string; z: number; tur: BildirimTur; seviye: "kritik" | "uyari" | "bilgi"; baslik: string; ayrinti: string; bolum?: string; baglanti?: string; okundu?: boolean; eposta?: "gonderildi" | "gonderilemedi" };
type Kayit = { bildirimler: Bildirim[]; anahtarlar: Record<string, number>; sonDenetim?: number };

const KIMLIK = /^[A-Za-z0-9_-]{6,20}$/;
const dosya = (id: string) => path.join(DEPO_KOK, "build", "bulut-bildirim", `${id}.json`);
const kuyruk = new Map<string, Promise<unknown>>();
const ozet = (s: string) => createHash("sha1").update(s).digest("base64url").slice(0, 10);
const gun = (t = Date.now()) => new Date(t + 3 * 3600_000).toISOString().slice(0, 10);

async function oku(id: string): Promise<Kayit> { try { return JSON.parse(await readFile(dosya(id), "utf8")); } catch { return { bildirimler: [], anahtarlar: {} }; } }
async function degistir<T>(id: string, f: (k: Kayit) => T | Promise<T>): Promise<T> {
  const onceki = kuyruk.get(id) ?? Promise.resolve();
  let s!: T;
  const is = onceki.then(async () => {
    const k = await oku(id);
    s = await f(k);
    k.bildirimler = k.bildirimler.slice(0, 200);
    const sinir = Date.now() - 60 * 864e5;
    for (const [a, z] of Object.entries(k.anahtarlar)) if (z < sinir) delete k.anahtarlar[a];
    await mkdir(path.dirname(dosya(id)), { recursive: true });
    await writeFile(dosya(id), JSON.stringify(k));
  });
  kuyruk.set(id, is.catch(() => {}));
  await is;
  return s;
}

export async function bildirimleriOku(id: string) { return KIMLIK.test(id) ? (await oku(id)).bildirimler : []; }
export async function okunduIsaretle(id: string, kimlikler: string[] | "hepsi") {
  await degistir(id, (k) => { for (const b of k.bildirimler) if (kimlikler === "hepsi" || kimlikler.includes(b.id)) b.okundu = true; });
}
export async function bildirimSil(id: string, kimlik: string) { await degistir(id, (k) => { k.bildirimler = k.bildirimler.filter((b) => b.id !== kimlik); }); }

type Yeni = Omit<Bildirim, "id" | "z" | "okundu" | "eposta">;
/** Yeni bildirim (aynı anahtar daha önce yazıldıysa ya da tür kapalıysa yazılmaz). */
export async function bildirimEkle(p: Pick<Proje, "id" | "ad">, anahtar: string, b: Yeni): Promise<Bildirim | null> {
  const ayar = await bulutAyarOku(p.id);
  if (!ayar.bildirim.turler[b.tur]) return null;
  const yeni = await degistir(p.id, (k) => {
    if (k.anahtarlar[anahtar]) return null;
    k.anahtarlar[anahtar] = Date.now();
    const x: Bildirim = { id: randomBytes(6).toString("base64url"), z: Date.now(), ...b };
    k.bildirimler.unshift(x);
    return x;
  });
  if (yeni && b.seviye !== "bilgi" && ayar.bildirim.eposta && epostaKurulu()) {
    const r = await epostaGonder({ kime: ayar.bildirim.eposta, konu: `${p.ad}: ${b.baslik}`, metin: `${b.ayrinti}\n\nBu bildirimi Vayra Bulut › ${p.ad} › Bildirim ayarları bölümünden kapatabilirsin.` });
    await degistir(p.id, (k) => { const x = k.bildirimler.find((y) => y.id === yeni.id); if (x) x.eposta = r.ok ? "gonderildi" : "gonderilemedi"; });
  }
  return yeni;
}

const sonDenetim = new Map<string, number>();
/** Bütün denetimleri çalıştırır (proje başına en çok dakikada bir; zorla ile hemen). */
export async function bildirimDenetle(p: Proje, zorla = false) {
  if (!KIMLIK.test(p.id)) return;
  const z = Date.now();
  if (!zorla && z - (sonDenetim.get(p.id) ?? 0) < 60_000) return;
  sonDenetim.set(p.id, z);
  const l = await gunlukOku(p.id, { bas: z - 25 * 3600_000, bit: z, sinir: 60_000 });
  // 1) Hata artışı: son 1 saat ile önceki 24 saatin saatlik ortalaması.
  const sunucuHatasi = (g: (typeof l)[number]) => (g.t === "istek" || g.t === "fonksiyon" || g.t === "ai") && seviyeBul(g) === "hata";
  const sonSaat = l.filter((g) => g.z > z - 3600_000 && sunucuHatasi(g)).length;
  const onceki = l.filter((g) => g.z <= z - 3600_000 && sunucuHatasi(g)).length / 24;
  if (sonSaat >= 5 && sonSaat >= 3 * Math.max(1, onceki)) {
    await bildirimEkle(p, `hata-artisi:${new Date(z).toISOString().slice(0, 13)}`, { tur: "hata-artisi", seviye: "kritik", baslik: "Sunucu hataları arttı", ayrinti: `Son bir saatte ${sonSaat} sunucu hatası oldu; önceki 24 saatte saat başına ortalama ${onceki.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} idi.`, bolum: "gunluk", baglanti: "seviye=hata&zaman=1s" });
  }
  // 2) Canlı sitede yeni tarayıcı hataları.
  for (const g of l.filter((x) => x.t === "hata" && x.z > z - 3600_000).slice(0, 10)) {
    const m = (g.m ?? "").replace(/\s*\([^)]*\)$/, "");
    await bildirimEkle(p, `istemci:${gun(g.z)}:${ozet(m)}`, { tur: "istemci-hatasi", seviye: "uyari", baslik: "Canlı sitede tarayıcı hatası", ayrinti: `${g.y ?? "/"} sayfasında: ${g.m ?? "Bilinmeyen hata"}`, bolum: "gunluk", baglanti: `tur=hata&zaman=24s${g.i ? `&kayit=${g.i}` : ""}` });
  }
  // 3) Başarısız yayınlar.
  for (const g of l.filter((x) => x.t === "yayin" && (x.d ?? 0) >= 400).slice(0, 5)) {
    await bildirimEkle(p, `yayin:${g.i ?? g.z}`, { tur: "yayin-hatasi", seviye: "kritik", baslik: "Yayın başarısız", ayrinti: (g.m ?? "Yayın tamamlanamadı.").replace(/^Yayın başarısız:\s*/, ""), bolum: "yayinlar" });
  }
  // 4) Kullanım eşikleri.
  const k = await kullanimOzeti(p);
  for (const x of k.kalemler) {
    if (x.id === "ai" && !k.ai.acik) continue;
    const oran = x.sinir ? x.kullanilan / x.sinir : 0;
    const esik = oran >= 1 ? 100 : oran >= 0.75 ? 75 : oran >= 0.5 ? 50 : 0;
    // Aşım tahmini: bu hızla ay sonunda kota aşılacaksa ayda bir kez haber ver (henüz yüzde 50 olmasa da).
    if (x.uyari === "asacak" && x.tahmin && x.donem === "ay" && esik < 75) {
      const deger = (n: number) => (x.birim === "bayt" ? `${(n / 1024 ** 3).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} GB` : x.birim === "ms" ? `${Math.round(n / 3600_000).toLocaleString("tr-TR")} saat` : n.toLocaleString("tr-TR"));
      await bildirimEkle(p, `kullanim-tahmin:${x.id}:${k.ay}`, { tur: "kullanim", seviye: "uyari", baslik: `${x.ad} bu hızla ay sonunda kotayı aşacak`, ayrinti: `Son 7 günün hızıyla ay sonu tahmini ${deger(x.tahmin)}, kota ${deger(x.sinir)}. Kullanım bölümünden ayrıntıya bak.`, bolum: "kullanim" });
    }
    if (!esik) continue;
    const donem = x.donem === "ay" ? k.ay : x.donem === "gun" ? gun() : "toplam";
    const ne = x.donem === "ay" ? "aylık kotanın" : x.donem === "gun" ? "günlük sınırın" : "sınırın";
    await bildirimEkle(p, `kullanim:${x.id}:${donem}:${esik}`, { tur: "kullanim", seviye: esik === 100 ? "kritik" : esik === 75 ? "uyari" : "bilgi", baslik: `${x.ad} ${ne} yüzde ${esik}'${esik === 100 ? "üne ulaştı" : "ini geçti"}`, ayrinti: x.uygulanan ? `${x.ad}: sınır doldukça yeni istekler reddedilir.` : `${x.ad} için ${ne} yüzde ${esik} kullanıldı.${k.ayar.kota.dolunca === "bakim" ? " Kota dolunca site bakım moduna alınacak." : ""}`, bolum: "kullanim" });
    if (esik === 100 && !x.uygulanan && k.ayar.kota.dolunca === "bakim" && !k.ayar.bakim.acik) {
      await bulutAyarDegistir(p.id, (a) => { a.bakim = { acik: true, mesaj: a.bakim.mesaj, zaman: Date.now() }; });
      await bildirimEkle(p, `bakim-oto:${k.ay}`, { tur: "kullanim", seviye: "kritik", baslik: "Site bakım moduna alındı", ayrinti: `${x.ad} aylık kotası doldu; ayarına göre site bakım sayfasına geçti. Kullanım bölümünden kaldırabilirsin.`, bolum: "kullanim" });
    }
  }
  // 5) Alan adı sorunları.
  for (const a of p.alanAdlari.filter((x) => x.durum === "sorun")) {
    await bildirimEkle(p, `alan:${a.ad}:${gun(a.sonKontrol ?? z)}`, { tur: "alan-adi", seviye: "uyari", baslik: `${a.ad} alan adında sorun var`, ayrinti: a.uyarilar[0] ?? "DNS kayıtları beklenen değerleri göstermiyor ya da SSL sertifikası alınamadı.", bolum: "alan" });
  }
  // 6) Kritik güvenlik bulguları.
  for (const b of (await guvenlikDenetimi(p).catch(() => [])).filter((x) => x.seviye === "kritik" && !x.yoksayildi).slice(0, 5)) {
    await bildirimEkle(p, `guvenlik:${b.id}`, { tur: "guvenlik", seviye: "kritik", baslik: b.baslik, ayrinti: b.ayrinti, bolum: "guvenlik" });
  }
}

/** Günlüğe hata düşünce çağrılır: projeyi okuyup denetimi zorla çalıştırır. */
export async function arkaPlanDenetimi(id: string) {
  const p = await projeOkuHam(id);
  if (!p) return;
  const { sahip: _s, ...temiz } = p; void _s;
  await bildirimDenetle(temiz, true);
}
