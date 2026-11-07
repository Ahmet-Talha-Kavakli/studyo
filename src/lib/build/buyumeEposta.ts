import "server-only";
import { createHash } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { epostaKurulu } from "./bulutEposta";
import { siteAdresi } from "./bulutKimlik";
import { projeOkuHam } from "./depo";
import { belirtecUret, cikBelirteci, ekGuncelle, ekOku } from "./buyumeEkDepo";
import { kisileriKur } from "./buyumeKisiler";
import { davetKodu, kampanyaBaglantilari, kampanyaHtml, kampanyaMetni, kitleHesapla, type Alici, type EkVeri, type EpostaRejim, type Kampanya, type MarkaOzet } from "./buyumeEkTipler";
import { sonrakiSaat } from "./buyumeAkisTipler";
import type { Proje } from "./tipler";

/**
 * Büyüme e-posta kampanyaları: Vayra Bulut'un Resend altyapısıyla (RESEND_API_KEY, BUILD_EPOSTA_GONDEREN ya da
 * RESEND_FROM). Servis kurulu değilse hiçbir şey gönderilmez ve arayüz bunu söyler. Her iletide: açılma pikseli,
 * imzalı tık izleme adresleri, abonelikten çıkma bağlantısı ve RFC 8058 tek tık çıkma başlığı (Gmail ve Yahoo kuralı).
 * Alıcılar: segment + izin kuralı (6563 sayılı Kanun): onaylı kişiler; sahip beyan ederse izni belirsizler; reddeden ve
 * çıkanlar asla. Gönderim arka planda saniyede en çok 2 ileti hızıyla sürer; zamanlananlar dakikada bir denetlenir.
 * Konu satırı denemesi (A/B) ve kişiye göre gönderim saati de burada yürütülür.
 * Geliştirmede BUYUME_EPOSTA_DENEME_ADRES tanımlıysa iletiler Resend yerine o adrese yazılır (yalnız yerel deneme).
 */
const denemeAdresi = () => (process.env.NODE_ENV !== "production" ? process.env.BUYUME_EPOSTA_DENEME_ADRES || "" : "");
export function epostaDurumu() {
  const deneme = !!denemeAdresi();
  const v = process.env.BUILD_EPOSTA_GONDEREN || process.env.RESEND_FROM || "";
  return { kurulu: epostaKurulu() || deneme, deneme, gonderen: v ? (/<([^>]+)>/.exec(v)?.[1] ?? v) : epostaKurulu() ? "onboarding@resend.dev" : "", alanDogrulandi: !!v };
}
const gonderen = (ad: string) => {
  const v = process.env.BUILD_EPOSTA_GONDEREN || process.env.RESEND_FROM || "Vayra <onboarding@resend.dev>";
  const adres = /<([^>]+)>/.exec(v)?.[1] ?? v;
  return `${ad.replace(/[<>"\r\n]/g, "").slice(0, 60)} <${adres}>`;
};

export async function tekGonder(g: { kime: string; konu: string; html: string; metin: string; cik: string; cikPost: string; site: string }): Promise<{ ok: true } | { ok: false; hata: string }> {
  const govde = { from: gonderen(g.site), to: [g.kime], subject: g.konu, html: g.html, text: g.metin, headers: { "List-Unsubscribe": `<${g.cikPost}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } };
  const deneme = denemeAdresi();
  const anahtar = process.env.RESEND_API_KEY;
  if (!deneme && !anahtar) return { ok: false, hata: "E-posta servisi kurulu değil." };
  try {
    const r = await fetch(deneme || "https://api.resend.com/emails", { method: "POST", headers: { ...(deneme ? {} : { Authorization: `Bearer ${anahtar}` }), "Content-Type": "application/json" }, body: JSON.stringify(govde), signal: AbortSignal.timeout(12_000) });
    if (!r.ok) { let m = ""; try { m = ((await r.json()) as { message?: string }).message ?? ""; } catch { /* boş */ } return { ok: false, hata: `Gönderilemedi (${r.status})${m ? `: ${m.slice(0, 140)}` : ""}` }; }
    return { ok: true };
  } catch (e) { return { ok: false, hata: (e as Error).message.slice(0, 160) }; }
}

export function markaOzeti(p: Pick<Proje, "ad">, ek: EkVeri): MarkaOzet {
  const m = ek.marka;
  return { site: p.ad, renk: m?.renkler[0]?.hex ?? "#111111", logo: m?.logo, iletisim: m?.iletisim?.trim() || undefined, adres: ek.izinAyar?.postaAdresi?.trim() || undefined, yazi: m?.govdeYazi ? `${m.govdeYazi.replace(/[<>"{};]/g, "")},-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif` : undefined };
}
export const davetBaglantisi = (p: Proje, koken: string, eposta: string) => `${siteAdresi(p, koken)}?davet=${davetKodu(eposta)}&utm_source=tavsiye&utm_medium=referral&utm_campaign=tavsiye`;

/** E-postanın tek yönlü özeti (silinenler listesi için). */
export const epostaOzeti = (e: string) => createHash("sha256").update(e.trim().toLowerCase()).digest("hex").slice(0, 32);
/** Uyulan e-posta rejimleri: seçilmişse onlar; değilse işletmenin ülkesine göre (bilinmiyorsa GDPR ve CAN-SPAM birlikte, en sıkı). */
export async function epostaRejimleri(projeId: string, ek: Pick<EkVeri, "izinAyar">): Promise<EpostaRejim[]> {
  if (ek.izinAyar?.rejimler?.length) return ek.izinAyar.rejimler;
  const { isletmeOku } = await import("./isletme");
  const { ulkeBul } = await import("./bolge");
  const u = ulkeBul((await isletmeOku(projeId).catch(() => null))?.profil.ulkeKodu);
  const e = u?.eposta;
  return e === "gdpr" ? ["gdpr"] : e === "canspam" ? ["canspam"] : e === "casl" ? ["casl"] : e === "iys" ? ["iys"] : e === "spam-act" ? ["spam"] : ["gdpr", "canspam"];
}

/* ── Zamanlanmış ve süren gönderimler dizini ── */
const ZDOSYA = path.join(DEPO_KOK, "build", "buyume-zamanli.json");
type GZ = { __vayraBuyumeZaman?: Record<string, number>; __vayraBuyumeZamanT?: ReturnType<typeof setInterval>; __vayraBuyumeGonderim?: Set<string> };
const G = globalThis as unknown as GZ;
function zDizin(): Record<string, number> { if (!G.__vayraBuyumeZaman) { try { G.__vayraBuyumeZaman = JSON.parse(readFileSync(ZDOSYA, "utf8")); } catch { G.__vayraBuyumeZaman = {}; } } return G.__vayraBuyumeZaman!; }
function zYaz() { try { mkdirSync(path.dirname(ZDOSYA), { recursive: true }); writeFileSync(ZDOSYA, JSON.stringify(zDizin())); } catch { /* yok */ } }
export function zamanla(p: string, k: string, zaman: number | null) { const d = zDizin(); if (zaman === null) delete d[`${p}:${k}`]; else d[`${p}:${k}`] = zaman; zYaz(); }
const suren = (G.__vayraBuyumeGonderim ??= new Set());

/** Gönderimi başlatır: alıcı listesini dondurur, arka planda gönderir. */
export async function gonderimBaslat(projeId: string, kampanyaId: string, koken: string): Promise<{ ok: true; alici: number } | { ok: false; hata: string }> {
  const p = await projeOkuHam(projeId);
  if (!p) return { ok: false, hata: "Proje bulunamadı." };
  if (!epostaDurumu().kurulu) return { ok: false, hata: "E-posta servisi kurulu değil." };
  const ek0 = await ekOku(projeId);
  const kisiler = await kisileriKur(projeId, ek0);
  const { v, sonuc } = await ekGuncelle(projeId, async (v): Promise<string | null> => {
    const k = v.kampanyalar.find((x) => x.id === kampanyaId);
    if (!k) return "Kampanya bulunamadı.";
    if (k.durum === "gonderiliyor" || k.durum === "gonderildi") return "Bu kampanya zaten gönderildi.";
    if (!k.konu.trim()) return "Konu satırı boş.";
    if (!k.bloklar.length) return "E-posta boş.";
    if (!v.marka?.iletisim?.trim()) return "Marka kitinde gönderen bilgisi (işletme adı ve iletişim) yok; ticari iletide zorunlu.";
    const rejim = await epostaRejimleri(projeId, v);
    if (rejim.some((x) => x === "canspam" || x === "casl" || x === "spam") && !v.izinAyar?.postaAdresi?.trim()) return "Fiziksel posta adresi yok: CAN-SPAM, CASL ve Spam Act her ticari iletide geçerli bir posta adresi ister. Büyüme sekmesindeki İzinler bölümünden ekle.";
    if (rejim.includes("gdpr") && k.izinsizKat) return "GDPR: izni belirsiz kişilere pazarlama e-postası gönderilemez. Kitlede yalnız onaylı kişileri bırak.";
    const { alicilar: tum } = kitleHesapla(kisiler, k, v);
    const sil = v.silinenler ?? {};
    const alicilar = tum.filter((x) => !sil[epostaOzeti(x.eposta!)]);
    if (!alicilar.length) return "Bu kitlede gönderilebilecek kimse yok.";
    k.alicilar = alicilar.slice(0, 2000).map((x): Alici => ({ e: x.eposta!, ad: x.ad, d: "bekliyor" }));
    // Konu satırı denemesi: kitle karıştırılır, payı kadar kişi konulara eşit bölünür, kalanlar kazananı bekler.
    const konular = k.ab?.konular.map((x, i) => (i === 0 ? k.konu : x).trim()).filter(Boolean) ?? [];
    if (k.ab && konular.length >= 2) {
      if (k.alicilar.length < 20 * konular.length) return `Konu satırı denemesi için en az ${20 * konular.length} alıcı gerekir; bu kitlede ${k.alicilar.length} kişi var. Denemeyi kapat ya da kitleyi büyüt.`;
      for (let i = k.alicilar.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [k.alicilar[i], k.alicilar[j]] = [k.alicilar[j], k.alicilar[i]]; }
      const test = Math.max(konular.length * 10, Math.round(k.alicilar.length * Math.min(0.5, Math.max(0.1, k.ab.pay / 100))));
      k.alicilar.forEach((a, i) => { if (i < test) a.v = i % konular.length; else a.d = "bekle"; });
      k.ab = { ...k.ab, konular, asama: "test", testBitis: Date.now() + Math.min(72, Math.max(1, k.ab.sure)) * 3600_000, kazanan: undefined, neden: undefined };
    } else if (k.ab) k.ab = undefined;
    // Kişiye göre saat: her alıcı kendi en çok açtığı saatte (24 saat içinde); verisi yoksa projenin en iyi saati.
    if (k.saatKip === "kisisel" && !k.ab) {
      const { akisOku, saatProfili } = await import("./buyumeAkis");
      const { isletmeOku } = await import("./isletme");
      const prof = saatProfili(v, await akisOku(projeId), (await isletmeOku(projeId).catch(() => null))?.profil.saatDilimi || "UTC");
      const simdi = Date.now();
      for (const a of k.alicilar) { const h = prof.kisiSaat[a.e] ?? prof.enIyiSaat; a.z = sonrakiSaat(simdi - 30 * 60_000, `${String(h).padStart(2, "0")}:00`, prof.tz); if (a.z < simdi) a.z = simdi; }
    }
    k.baglantilar = kampanyaBaglantilari(k.bloklar);
    k.durum = "gonderiliyor"; k.gonderimBas = Date.now(); k.koken = koken; k.hata = undefined; k.guncelleme = Date.now();
    return null;
  });
  if (sonuc) return { ok: false, hata: sonuc };
  zamanla(projeId, kampanyaId, Date.now());
  void gonderimSurdur(projeId, kampanyaId);
  return { ok: true, alici: v.kampanyalar.find((x) => x.id === kampanyaId)!.alicilar.length };
}

/** Sahip kazananı süre dolmadan seçer (Mailchimp'teki elle kazanan seçimi); v yoksa ölçüte göre seçilir. */
export async function abKazananSec(projeId: string, kampanyaId: string, v?: number): Promise<string | null> {
  const { sonuc } = await ekGuncelle(projeId, (x) => {
    const k = x.kampanyalar.find((y) => y.id === kampanyaId);
    if (!k?.ab || k.ab.asama !== "test" || k.durum !== "gonderiliyor") return "Bu kampanyada süren bir konu satırı denemesi yok.";
    if (k.alicilar.some((a) => a.d === "bekliyor")) return "Deneme gönderimi henüz bitmedi.";
    if (v === undefined) { kazananSec(k); return null; }
    if (!Number.isInteger(v) || v < 0 || v >= k.ab.konular.length) return "Konu bulunamadı.";
    k.ab = { ...k.ab, asama: "bitti", kazanan: v, neden: `Kazanan elle seçildi: ${String.fromCharCode(65 + v)}.` };
    for (const a of k.alicilar) if (a.d === "bekle") { a.d = "bekliyor"; a.v = v; a.k = true; }
    return null;
  });
  if (sonuc) return sonuc;
  zamanla(projeId, kampanyaId, Date.now());
  void gonderimSurdur(projeId, kampanyaId);
  return null;
}

/** Konu satırı denemesinin kazananı: ölçüte göre en yüksek oran (eşitlikte ilk konu); kalanlara kazanan gider. */
function kazananSec(k: Kampanya) {
  if (!k.ab || k.ab.asama !== "test") return;
  const oranlar = k.ab.konular.map((_, v) => { const l = k.alicilar.filter((a) => a.v === v && a.d === "gonderildi" && !a.k); const n = l.filter((a) => (k.ab!.olcut === "tik" ? a.t : a.a)).length; return { v, n, g: l.length, o: l.length ? n / l.length : 0 }; });
  const en = oranlar.reduce((a, b) => (b.o > a.o ? b : a), oranlar[0]);
  const fark = oranlar.some((x) => x.v !== en.v && x.o === en.o);
  k.ab = { ...k.ab, asama: "bitti", kazanan: en.v, neden: fark || !en.n ? `Konular arasında fark çıkmadı (${k.ab.olcut === "tik" ? "tıklama" : "açılma"} eşit); ilk konu gönderildi.` : `${k.ab.olcut === "tik" ? "Tıklama" : "Açılma"} oranı yüzde ${Math.round(en.o * 100)} ile en yüksek.` };
  for (const a of k.alicilar) if (a.d === "bekle") { a.d = "bekliyor"; a.v = en.v; a.k = true; }
}

/** Bekleyen alıcılara sırayla gönderir (sunucu yeniden başlarsa zamanlayıcı kaldığı yerden sürdürür). */
export async function gonderimSurdur(projeId: string, kampanyaId: string) {
  const anahtar = `${projeId}:${kampanyaId}`;
  if (suren.has(anahtar)) return;
  suren.add(anahtar);
  try {
    const p = await projeOkuHam(projeId);
    if (!p) { zamanla(projeId, kampanyaId, null); return; }
    for (;;) {
      const ek = await ekOku(projeId);
      const k = ek.kampanyalar.find((x) => x.id === kampanyaId);
      if (!k || k.durum !== "gonderiliyor") { zamanla(projeId, kampanyaId, null); return; }
      const simdi = Date.now();
      const bekleyen = k.alicilar.filter((a) => a.d === "bekliyor");
      // Konu satırı denemesi: test gönderimi bitti ve süre doldu ise kazananı seç.
      if (k.ab?.asama === "test" && !bekleyen.length) {
        if ((k.ab.testBitis ?? 0) > simdi) { zamanla(projeId, kampanyaId, k.ab.testBitis!); return; }
        await ekGuncelle(projeId, (v) => { const x = v.kampanyalar.find((y) => y.id === kampanyaId); if (x) kazananSec(x); });
        continue;
      }
      const sira = k.alicilar.map((a, i) => [a, i] as const).filter(([a]) => a.d === "bekliyor" && (!a.z || a.z <= simdi)).slice(0, 10);
      if (!sira.length && bekleyen.length) { zamanla(projeId, kampanyaId, Math.min(...bekleyen.map((a) => a.z ?? simdi))); return; }
      if (!sira.length) {
        await ekGuncelle(projeId, (v) => { const x = v.kampanyalar.find((y) => y.id === kampanyaId); if (x && x.durum === "gonderiliyor") { x.durum = "gonderildi"; x.gonderimBit = Date.now(); if (x.alicilar.every((a) => a.d === "hata")) x.hata = x.alicilar[0]?.h; } });
        zamanla(projeId, kampanyaId, null);
        return;
      }
      const koken = k.koken || "http://localhost:3100";
      const marka = markaOzeti(p, ek);
      const sonuclar: [number, { ok: boolean; hata?: string }][] = [];
      for (const [a, i] of sira) {
        if (ek.cikanlar[a.e]) { sonuclar.push([i, { ok: false, hata: "Abonelikten çıktı; gönderilmedi." }]); continue; }
        const t = belirtecUret(projeId, kampanyaId, i);
        const iz = { piksel: `${koken}/api/build/buyume-genel/e/a/${t}`, tik: (n: number) => `${koken}/api/build/buyume-genel/e/t/${t}?i=${n}`, cik: `${koken}/api/build/buyume-genel/e/c/${t}` };
        const d = { ad: a.ad, eposta: a.e, davetKodu: davetKodu(a.e), davetBaglantisi: davetBaglantisi(p, koken, a.e) };
        const konu0 = a.v !== undefined && k.ab?.konular[a.v] ? k.ab.konular[a.v] : k.konu;
        const konu = konu0.replace(/\{ad\}/g, a.ad).replace(/\{site\}/g, p.ad);
        const r = await tekGonder({ kime: a.e, konu, html: kampanyaHtml({ ...k, konu }, marka, d, iz), metin: kampanyaMetni(k, p.ad, d, iz.cik), cik: iz.cik, cikPost: iz.cik, site: p.ad });
        sonuclar.push([i, r.ok ? { ok: true } : { ok: false, hata: r.hata }]);
        await new Promise((s) => setTimeout(s, 520));
      }
      await ekGuncelle(projeId, (v) => {
        const x = v.kampanyalar.find((y) => y.id === kampanyaId);
        if (!x) return;
        for (const [i, r] of sonuclar) { const a = x.alicilar[i]; if (!a) continue; a.d = r.ok ? "gonderildi" : "hata"; a.h = r.ok ? undefined : r.hata; if (r.ok) a.g = Date.now(); }
        x.guncelleme = Date.now();
      });
    }
  } catch { /* zamanlayıcı yeniden dener */ } finally { suren.delete(anahtar); }
}

/** Deneme gönderimi: tek adrese, izleme olmadan, konu başında "Deneme:". */
export async function denemeGonder(projeId: string, k: Kampanya, kime: string, koken: string, ek: EkVeri) {
  const p = await projeOkuHam(projeId);
  if (!p) return { ok: false as const, hata: "Proje bulunamadı." };
  const cik = `${koken}/api/build/buyume-genel/e/c/${cikBelirteci(projeId, kime.toLocaleLowerCase("tr-TR"))}`;
  const d = { ad: "Deneme", eposta: kime, davetKodu: davetKodu(kime), davetBaglantisi: davetBaglantisi(p, koken, kime) };
  return tekGonder({ kime, konu: `Deneme: ${k.konu.replace(/\{ad\}/g, "Deneme").replace(/\{site\}/g, p.ad)}`, html: kampanyaHtml(k, { ...markaOzeti(p, ek), koken }, d).replace('href="#abonelikten-cik"', `href="${cik}"`), metin: kampanyaMetni(k, p.ad, d, cik), cik, cikPost: cik, site: p.ad });
}

/** Kampanya turu: süresi gelen kampanyaları başlatır, yarıda kalanları ve kazananı bekleyenleri sürdürür. */
async function kampanyaTuru() {
  for (const [a, z] of Object.entries(zDizin())) {
    if (z > Date.now()) continue;
    const [p, k] = a.split(":");
    const ek = await ekOku(p).catch(() => null);
    const x = ek?.kampanyalar.find((y) => y.id === k);
    if (!x) { zamanla(p, k, null); continue; }
    if (x.durum === "zamanlandi") { const r = await gonderimBaslat(p, k, x.koken || "http://localhost:3100").catch(() => null); if (r && !r.ok) { await ekGuncelle(p, (v) => { const y = v.kampanyalar.find((q) => q.id === k); if (y) { y.durum = "taslak"; y.hata = `Zamanında gönderilemedi: ${r.hata}`; } }).catch(() => {}); zamanla(p, k, null); } }
    else if (x.durum === "gonderiliyor") void gonderimSurdur(p, k);
    else zamanla(p, k, null);
  }
}
/** Dakikalık tur: kampanyalar, otomasyon akışları, zamanlanmış sosyal ve Google İşletme gönderileri. */
async function buyumeTuru() {
  await kampanyaTuru().catch(() => {});
  try { const { akisProjeleri, akisTuru } = await import("./buyumeAkis"); for (const id of akisProjeleri()) await akisTuru(id); } catch { /* yok */ }
  try { const { sosyalTuru } = await import("./buyumeSosyal"); await sosyalTuru(); } catch { /* yok */ }
  try { const { gbpTuru } = await import("./buyumeGbp"); await gbpTuru(); } catch { /* yok */ }
}
type GT2 = { __vayraBuyumeTurFn?: () => Promise<void>; __vayraBuyumeTurSurum?: number; __vayraBuyumeTurSuruyor?: boolean };
const G2 = globalThis as unknown as GT2 & GZ;
const TUR_SURUM = 5;
/**
 * Zamanlayıcı (dakikada bir). Sunucu açılışında ve Büyüme uçları ilk çağrıldığında kurulur. Geliştirmede kod yenilenince
 * eski aralık yeni sürümle değiştirilir; tur işlevi her zaman en son yüklenen koddan çağrılır.
 */
export function zamanlayiciKur() {
  G2.__vayraBuyumeTurFn = buyumeTuru;
  if (G2.__vayraBuyumeZamanT && G2.__vayraBuyumeTurSurum === TUR_SURUM) return;
  if (G2.__vayraBuyumeZamanT) clearInterval(G2.__vayraBuyumeZamanT);
  G2.__vayraBuyumeTurSurum = TUR_SURUM;
  G2.__vayraBuyumeZamanT = setInterval(async () => {
    if (G2.__vayraBuyumeTurSuruyor) return;
    G2.__vayraBuyumeTurSuruyor = true;
    try { await (G2.__vayraBuyumeTurFn ?? buyumeTuru)(); } finally { G2.__vayraBuyumeTurSuruyor = false; }
  }, 60_000);
}
/** Elle tetikleme (sahip "Şimdi çalıştır" dediğinde ya da deneme betiğinde). */
export const buyumeTuruCalistir = () => (G2.__vayraBuyumeTurFn ?? buyumeTuru)();
