import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { AgHatasi, guvenliFetch } from "@/lib/guvenliAg";
import { yardimciModel, zekaJson } from "./ajanZeka";
import { formlariOku } from "./depo";
import { siparisRaporu } from "./odeme";
import { projeOzeti } from "./buyumeZeka";
import { buyumeOku } from "./buyumeDepo";
import { deneySayac } from "./buyumeEkDepo";
import { kisileriKur } from "./buyumeKisiler";
import { NIYETLER, simgeTemizle, type NiyetId } from "./buyumeTipler";
import { deneySonuc, kimlikUret, markaIstemi, type AnahtarFikir, type Blok, type BlokTur, type EkVeri, type MarkaKiti, type Rapor, type RakipAnaliz, type RakipOkunan } from "./buyumeEkTipler";
import type { Proje } from "./tipler";

/**
 * Büyüme v4 çözümlemeleri: rakip sitesini okuma (yalnız guvenliFetch), marka kitini projeden çıkarma, haftalık rapor
 * ve model görevleri. Model görevlerinin sistem istemi IMZA2 ile başlar (yerel sahte model sunucusu bunu tanır).
 * Model bağlı değilse ModelYok2 atılır; okunan ve hesaplanan veriler yine gösterilir, uydurma yorum yazılmaz.
 */
export class ModelYok2 extends Error { constructor() { super("Bu sunucuya bağlı bir yapay zekâ modeli yok."); } }
export class AnalizHatasi extends Error {}
const IMZA2 = "Sen Vayra Build Büyüme bölümünün pazarlama uzmanısın; Türkiye pazarını bilen bir büyüme danışmanı ve metin yazarısın.";
const KURAL = [
  "Türkçe yaz.", "Projede ya da verilen veride geçmeyen fiyat, adres, müşteri sayısı, ödül ya da istatistik uydurma.",
  "Metinlerde ≈, ~, %, →, ≠ gibi simgeler kullanma; 'yüzde 20' gibi düz kelimeyle yaz.", "Abartılı vaat ve yanıltıcı ifade kullanma.",
].map((s) => `- ${s}`).join("\n");

export async function gorev<T>(ad: string, kurallar: string, bicim: string, istem: string, enCok: number): Promise<{ veri: T; kredi: number; model: string }> {
  const m = yardimciModel();
  if (!m) throw new ModelYok2();
  const y = await zekaJson<T>({ sistem: `${IMZA2}\nGÖREV: ${ad}\n\nKurallar:\n${KURAL}\n${kurallar}\n\nJSON biçimi:\n${bicim}`, istem, enCok, signal: AbortSignal.timeout(170_000) });
  if (!y) throw new AnalizHatasi(`${m.ad} yanıt vermedi. Biraz sonra yeniden dene.`);
  if (!y.veri) throw new AnalizHatasi(`${m.ad} okunabilir bir yanıt döndürmedi. Yeniden dene.`);
  return { veri: y.veri, kredi: y.kredi, model: m.ad };
}
export const t = (x: unknown, n = 400) => simgeTemizle(typeof x === "string" ? x : typeof x === "number" ? String(x) : "").slice(0, n);
const dizi = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const nesne = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
export const ozetIle = (p: Proje, ek: EkVeri, n = 6000) => [projeOzeti(p, n), markaIstemi(ek.marka)].filter(Boolean).join("\n\n");

/* ── Rakip sitesini okuma ── */
const temiz = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
export function sayfaOku(html: string): RakipOkunan & { metin: string } {
  const govde = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  const metin = temiz(govde);
  const meta = (ad: string) => { const e = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${ad}["'][^>]*>`, "i"))?.[0]; return temiz(e?.match(/content=(?:"([^"]*)"|'([^']*)')/i)?.slice(1).find(Boolean) ?? ""); };
  const etiketler = (e: string, n: number) => [...html.matchAll(new RegExp(`<${e}[^>]*>([\\s\\S]*?)</${e}>`, "gi"))].map((m) => temiz(m[1])).filter((x) => x && x.length < 140).slice(0, n);
  const cagrilar = [...new Set([...etiketler("button", 20), ...[...html.matchAll(/<a\b[^>]*class=["'][^"']*(?:btn|button|cta|dugme)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => temiz(m[1]))].filter((x) => x.length >= 2 && x.length <= 40))].slice(0, 10);
  const fiyatlar = [...new Set((metin.match(/(?:₺\s?\d[\d.,]*|\d[\d.,]*\s?(?:TL|₺|tl)\b|\$\s?\d[\d.,]*|€\s?\d[\d.,]*)/g) ?? []).map((x) => x.trim()))].slice(0, 12);
  const sosyal = [...new Set((html.match(/https?:\/\/(?:www\.)?(instagram\.com|tiktok\.com|linkedin\.com|facebook\.com|x\.com|twitter\.com|youtube\.com|wa\.me)\/[^\s"'<>]*/gi) ?? []).map((u) => u.replace(/^https?:\/\/(www\.)?/i, "").split(/[/?#]/)[0]))].slice(0, 8);
  return {
    baslik: temiz(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").slice(0, 160), aciklama: (meta("description") || meta("og:description")).slice(0, 300),
    h1: etiketler("h1", 1)[0] ?? "", basliklar: [...etiketler("h2", 10), ...etiketler("h3", 4)].slice(0, 12), cagrilar, fiyatlar, sosyal,
    kelime: metin ? metin.split(" ").length : 0, dil: html.match(/<html[^>]+lang=["']([a-z-]{2,})["']/i)?.[1], metin: metin.slice(0, 7000),
  };
}
export async function rakipOku(adres: string): Promise<RakipOkunan & { metin: string; adres: string }> {
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(adres.trim()) ? adres.trim() : `https://${adres.trim()}`); } catch { throw new AnalizHatasi("Adres geçersiz."); }
  try {
    const r = await guvenliFetch(u, { headers: { "User-Agent": "Mozilla/5.0 (compatible; VayraBuyume/1.0; +https://vayra.ai)", Accept: "text/html,application/xhtml+xml" }, signal: AbortSignal.timeout(15_000) });
    if (!r.ok) throw new AnalizHatasi(`Site ${r.status} döndürdü; okunamadı.`);
    if (!/html/i.test(r.headers.get("content-type") ?? "html")) throw new AnalizHatasi("Bu adres bir web sayfası değil.");
    const metin = (await r.text()).slice(0, 900_000);
    const o = sayfaOku(metin);
    if (!o.baslik && o.kelime < 20) throw new AnalizHatasi("Sayfada okunacak metin yok; site içeriği tarayıcıda betikle çiziyor olabilir.");
    return { ...o, adres: u.toString() };
  } catch (e) {
    if (e instanceof AnalizHatasi) throw e;
    if (e instanceof AgHatasi) throw new AnalizHatasi(e.message);
    throw new AnalizHatasi(`Siteye ulaşılamadı: ${(e as Error).message.slice(0, 120)}`);
  }
}
export async function rakipKarsilastir(p: Proje, ek: EkVeri, o: RakipOkunan & { metin: string; adres: string }) {
  const kurallar = [
    "- Rakibin sitesindeki metni ve projenin sitesini karşılaştır: konumlandırma, hedef kitle, ana vaat, fiyat iletişimi, güven unsurları, çağrılar, içerik derinliği, kanallar.",
    "- karsilastirma: 5 ile 8 boyut; her biri için biz ve rakip kısa cümle.",
    "- firsatlar: rakibin boş bıraktığı ve projenin öne çıkabileceği 3 ile 5 somut fırsat.",
    "- mesajlar: siteye ya da reklama konabilecek, rakipten ayrıştıran 3 ile 5 başlık önerisi (en çok 70 karakter).",
    "- dikkat: rakibin güçlü olduğu ve projenin kapatması gereken 2 ile 4 nokta.",
  ].join("\n");
  const bicim = `{"ozet":"2 cümle","rakipKonum":"tek cümle","bizimKonum":"tek cümle","karsilastirma":[{"boyut":"","biz":"","rakip":""}],"firsatlar":[""],"mesajlar":[""],"dikkat":[""]}`;
  const istem = `=== Bizim proje ===\n${ozetIle(p, ek, 5000)}\n\n=== Rakip: ${o.adres} ===\nBaşlık: ${o.baslik}\nAçıklama: ${o.aciklama}\nAna başlık: ${o.h1}\nAra başlıklar: ${o.basliklar.join(" | ")}\nÇağrılar: ${o.cagrilar.join(", ")}\nFiyat ifadeleri: ${o.fiyatlar.join(", ") || "yok"}\nSosyal: ${o.sosyal.join(", ") || "yok"}\nMetin:\n${o.metin.slice(0, 5000)}\n\n=== İstek ===\nKonumlandırma ve mesaj karşılaştırması yap.`;
  const y = await gorev<Record<string, unknown>>("rakip", kurallar, bicim, istem, 3500);
  const v = y.veri;
  const analiz: NonNullable<RakipAnaliz["analiz"]> = {
    ozet: t(v.ozet, 600), rakipKonum: t(v.rakipKonum, 300), bizimKonum: t(v.bizimKonum, 300),
    karsilastirma: dizi(v.karsilastirma).slice(0, 10).map((x) => { const n = nesne(x); return { boyut: t(n.boyut, 60), biz: t(n.biz, 240), rakip: t(n.rakip, 240) }; }).filter((x) => x.boyut),
    firsatlar: dizi(v.firsatlar).slice(0, 6).map((x) => t(x, 300)).filter(Boolean), mesajlar: dizi(v.mesajlar).slice(0, 6).map((x) => t(x, 90)).filter(Boolean), dikkat: dizi(v.dikkat).slice(0, 5).map((x) => t(x, 300)).filter(Boolean),
  };
  if (!analiz.karsilastirma.length && !analiz.ozet) throw new AnalizHatasi(`${y.model} karşılaştırma döndürmedi. Yeniden dene.`);
  return { analiz, kredi: y.kredi, model: y.model };
}

/* ── Marka kitini projeden çıkarma (deterministik) ── */
export function markaCikar(p: Proje): Partial<MarkaKiti> {
  const tum = Object.entries(p.dosyalar).filter(([y]) => /\.(html|css)$/.test(y)).map(([, h]) => h).join("\n");
  const say = new Map<string, number>();
  for (const m of tum.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    let h = m[1].toLowerCase(); if (h.length === 3) h = [...h].map((c) => c + c).join("");
    const n = parseInt(h, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const doygun = Math.max(r, g, b) - Math.min(r, g, b);
    say.set(`#${h}`, (say.get(`#${h}`) ?? 0) + (doygun > 40 ? 3 : 1));
  }
  const renkler = [...say.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([hex], i) => ({ ad: ["Ana renk", "İkinci renk", "Vurgu", "Zemin", "Metin"][i], hex }));
  const yazilar = [...tum.matchAll(/font-family\s*:\s*([^;}"]+)/gi)].map((m) => m[1].split(",")[0].replace(/['"]/g, "").trim()).filter((x) => x && !/^(inherit|initial|system-ui|sans-serif|serif|monospace|var\()/i.test(x));
  const gf = [...tum.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^&"':]+)/gi)].map((m) => decodeURIComponent(m[1]).replace(/\+/g, " "));
  const sik = [...new Set([...gf, ...yazilar])];
  const logo = [...tum.matchAll(/<img[^>]+>/gi)].map((m) => m[0]).find((i) => /logo/i.test(i))?.match(/src=["'](https:\/\/[^"']+)["']/i)?.[1];
  return { renkler, baslikYazi: sik[0] ?? "", govdeYazi: sik[1] ?? sik[0] ?? "", logo };
}
export async function markaSesi(p: Proje, ek: EkVeri) {
  const y = await gorev<Record<string, unknown>>("marka", "- Sitenin metinlerinden markanın ses tonunu 2 ya da 3 cümleyle tarif et (kime, nasıl konuşur, hangi sözcükleri sever).\n- slogan: sitede geçiyorsa onu, geçmiyorsa en çok 8 sözcüklük bir öneri.\n- yasakli: bu markanın asla kullanmaması gereken 3 ile 6 sözcük ya da ifade.", `{"ton":"","slogan":"","yasakli":[""]}`, `${ozetIle(p, ek, 7000)}\n\n=== İstek ===\nMarka sesini çıkar.`, 1200);
  return { ton: t(y.veri.ton, 600), slogan: t(y.veri.slogan, 120), yasakli: dizi(y.veri.yasakli).slice(0, 10).map((x) => t(x, 40)).filter(Boolean), kredi: y.kredi };
}

/* ── E-posta kampanyası taslağı ── */
export async function kampanyaYaz(p: Proje, ek: EkVeri, g: { amac: string; kitle: string; ton: string; adres: string }) {
  const kurallar = [
    "- Konu satırı en çok 55 karakter, merak uyandırsın ama tık tuzağı olmasın; uygunsa {ad} kişiselleştirmesi kullan.",
    "- onMetin (gelen kutusunda konunun yanında görünen önizleme) en çok 90 karakter.",
    "- bloklar: 4 ile 7 blok. tur şunlardan biri: baslik, metin, dugme, ayirici. İlk blok baslik. Metin blokları 1 ile 3 kısa paragraf; selamlamada {ad} kullan. Tek bir dugme olsun; adres alanına verilen site adresini yaz.",
    "- konuAlternatifleri: 3 farklı konu satırı (A/B denemesi için).",
  ].join("\n");
  const bicim = `{"ad":"kampanya adı","konu":"","onMetin":"","bloklar":[{"tur":"baslik","metin":""},{"tur":"metin","metin":"Merhaba {ad},\\n\\n..."},{"tur":"dugme","metin":"","adres":""}],"konuAlternatifleri":[""]}`;
  const istem = `${ozetIle(p, ek, 6000)}\n\n=== İstek ===\nAmaç: ${g.amac}\nKitle: ${g.kitle}\nTon: ${g.ton}\nSite adresi: ${g.adres}\nBu kitleye gidecek bir e-posta kampanyası yaz.`;
  const y = await gorev<Record<string, unknown>>("eposta", kurallar, bicim, istem, 2500);
  const bloklar: Blok[] = dizi(y.veri.bloklar).slice(0, 12).map((x) => { const n = nesne(x); const tur = (["baslik", "metin", "dugme", "ayirici", "gorsel"].includes(String(n.tur)) ? n.tur : "metin") as BlokTur; return { id: kimlikUret(), tur, metin: t(n.metin, 3000) || undefined, adres: typeof n.adres === "string" && /^https?:\/\//.test(n.adres) ? n.adres.slice(0, 500) : tur === "dugme" ? g.adres : undefined }; }).filter((b) => b.tur === "ayirici" || b.metin);
  if (!bloklar.length) throw new AnalizHatasi(`${y.model} e-posta içeriği döndürmedi. Yeniden dene.`);
  return { ad: t(y.veri.ad, 80) || g.amac.slice(0, 60), konu: t(y.veri.konu, 150), onMetin: t(y.veri.onMetin, 150), bloklar, alternatifler: dizi(y.veri.konuAlternatifleri).slice(0, 4).map((x) => t(x, 150)).filter(Boolean), kredi: y.kredi, model: y.model };
}

/* ── Anahtar kelime fikirleri ── */
export async function anahtarKelimeler(p: Proje, ek: EkVeri, tohum: string) {
  const sayfalar = Object.keys(p.dosyalar).filter((y) => y.endsWith(".html") && y !== "404.html");
  const kurallar = [
    "- 15 ile 20 anahtar kelime fikri: projenin müşterisinin Google'da gerçekten yazacağı doğal Türkçe sorgular. Arama hacmi ya da zorluk sayısı yazma; bu veriye sahip değilsin.",
    `- niyet şunlardan biri: ${NIYETLER.map((n) => n.id).join(", ")}. Niyetleri karıştır; en az 4 satın alma ya da yerel niyetli olsun.`,
    `- sayfa: kelimenin hedefleneceği mevcut sayfa (${sayfalar.join(", ")}) ya da yeni bir sayfa adı (ör. rehber-filtre-kahve.html); yeniSayfa true ya da false.`,
    "- neden: bir cümle.",
  ].join("\n");
  const y = await gorev<{ kelimeler?: unknown[] }>("anahtar-kelime", kurallar, `{"kelimeler":[{"kelime":"","niyet":"yerel","sayfa":"index.html","yeniSayfa":false,"neden":""}]}`, `${ozetIle(p, ek, 6000)}\n\n=== İstek ===\n${tohum ? `Başlangıç kelimesi: ${tohum}\n` : ""}Anahtar kelime fikirleri çıkar.`, 2500);
  const l: AnahtarFikir[] = dizi(y.veri.kelimeler).slice(0, 25).map((x) => { const n = nesne(x); const sayfa = t(n.sayfa, 80).replace(/[^\w./-]/g, "") || "index.html"; return { id: kimlikUret(), kelime: t(n.kelime, 80).toLocaleLowerCase("tr-TR"), niyet: (NIYETLER.some((z) => z.id === n.niyet) ? n.niyet : "bilgi") as NiyetId, sayfa, yeniSayfa: n.yeniSayfa === true || !sayfalar.includes(sayfa), neden: t(n.neden, 240) }; }).filter((x) => x.kelime);
  if (!l.length) throw new AnalizHatasi(`${y.model} kelime önermedi. Yeniden dene.`);
  return { kelimeler: l, kredi: y.kredi, model: y.model };
}

/* ── Haftalık rapor ── */
type AGun = { g: number; z: number; s: Record<string, number>; ch?: Record<string, number>; u?: Record<string, number> };
const utcGun = (i: number, z = Date.now()) => new Date(z - i * 864e5).toISOString().slice(0, 10);
const trGun = (i: number, z = Date.now()) => new Date(z + 3 * 3600_000 - i * 864e5).toISOString().slice(0, 10);
export async function raporHesapla(p: Proje, ek: EkVeri): Promise<Rapor> {
  let a: { gunler: Record<string, AGun> } = { gunler: {} };
  try { a = JSON.parse(await readFile(path.join(DEPO_KOK, "build", "analitik", `${p.id}.json`), "utf8")); } catch { /* veri yok */ }
  const pencere = (bas: number) => Array.from({ length: 7 }, (_, i) => utcGun(bas + i));
  const simdiG = pencere(0), onceG = pencere(7);
  const topla = (gunler: string[], f: (x: AGun) => number) => gunler.reduce((t, g) => t + (a.gunler[g] ? f(a.gunler[g]) : 0), 0);
  const birlestir = (gunler: string[], k: "s" | "ch" | "u") => { const o: Record<string, number> = {}; for (const g of gunler) for (const [x, n] of Object.entries(a.gunler[g]?.[k] ?? {})) o[x] = (o[x] ?? 0) + n; return Object.entries(o).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([ad, adet]) => ({ ad, adet })); };
  const sinir = (i: number) => Date.parse(trGun(i) + "T00:00:00+03:00");
  const icinde = (z: number, bas: number) => z >= sinir(bas + 6) && z < sinir(bas) + 864e5;
  const [formlar, kisiler, buyume, siparis] = await Promise.all([formlariOku(p.id).catch(() => []), kisileriKur(p.id, ek), buyumeOku(p.id), siparisRaporu(p.id, "canli", 14).catch(() => null)]);
  const kampanyaSay = (bas: number) => { let g = 0, ac = 0, tk = 0; for (const k of ek.kampanyalar) if (k.gonderimBas && icinde(k.gonderimBas, bas)) for (const x of k.alicilar) { if (x.d === "gonderildi") g++; if (x.a) ac++; if (x.t) tk++; } return { g, ac, tk }; };
  const kS = kampanyaSay(0), kO = kampanyaSay(7);
  const tik = (bas: number) => ek.baglantilar.reduce((t, b) => t + Array.from({ length: 7 }, (_, i) => b.gunler[trGun(bas + i)] ?? 0).reduce((x, y) => x + y, 0), 0);
  const paylasilan = (bas: number) => buyume.gonderiler.filter((g) => g.durum === "paylasildi" && g.tarih && Array.from({ length: 7 }, (_, i) => trGun(bas + i)).includes(g.tarih)).length;
  const gelir = (bas: number) => (siparis?.gunler ?? []).filter((g) => Array.from({ length: 7 }, (_, i) => trGun(bas + i)).includes(g.tarih)).reduce((t, g) => t + g.gelir, 0);
  const metrikler = [
    { id: "ziyaretci", ad: "Ziyaretçi", simdi: topla(simdiG, (x) => x.z), once: topla(onceG, (x) => x.z) },
    { id: "goruntuleme", ad: "Sayfa görüntüleme", simdi: topla(simdiG, (x) => x.g), once: topla(onceG, (x) => x.g) },
    { id: "form", ad: "Form gönderimi", simdi: formlar.filter((f) => icinde(f.zaman, 0)).length, once: formlar.filter((f) => icinde(f.zaman, 7)).length },
    { id: "kisi", ad: "Yeni kişi", simdi: kisiler.filter((k) => icinde(k.ilk, 0)).length, once: kisiler.filter((k) => icinde(k.ilk, 7)).length },
    { id: "eposta", ad: "Gönderilen e-posta", simdi: kS.g, once: kO.g },
    { id: "acilma", ad: "E-posta açılması", simdi: kS.ac, once: kO.ac },
    { id: "tik", ad: "Kısa bağlantı tıkı", simdi: tik(0), once: tik(7) },
    { id: "paylasim", ad: "Paylaşılan gönderi", simdi: paylasilan(0), once: paylasilan(7) },
    { id: "gelir", ad: "Ödenen sipariş TL", simdi: Math.round(gelir(0)), once: Math.round(gelir(7)) },
  ];
  const one: string[] = [];
  const degisim = (m: { simdi: number; once: number }) => (m.once ? Math.round(((m.simdi - m.once) / m.once) * 100) : null);
  for (const m of metrikler.filter((x) => x.simdi || x.once)) {
    const d = degisim(m);
    one.push(d === null ? `${m.ad}: ${m.simdi.toLocaleString("tr-TR")} (önceki hafta veri yok)` : `${m.ad} ${d >= 0 ? `yüzde ${d} arttı` : `yüzde ${-d} azaldı`}: ${m.simdi.toLocaleString("tr-TR")}, önceki hafta ${m.once.toLocaleString("tr-TR")}`);
  }
  const kanallar = birlestir(simdiG, "ch");
  if (kanallar[0]) one.push(`En çok ziyaret ${kanallar[0].ad} kanalından geldi (${kanallar[0].adet.toLocaleString("tr-TR")})`);
  if (kS.g) one.push(`E-postaların yüzde ${Math.round((kS.ac / kS.g) * 100)} kadarı açıldı, yüzde ${Math.round((kS.tk / kS.g) * 100)} kadarında tıklandı`);
  for (const d of ek.deneyler.filter((x) => x.durum === "calisiyor")) { const s = deneySonuc(deneySayac(p.id, d.id)); one.push(`${d.ad}: A yüzde ${(s.pa * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}, B yüzde ${(s.pb * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} dönüşüm${s.yeterli ? `; B yüzde ${Math.round(s.olasilik * 100)} olasılıkla daha iyi` : "; henüz yeterli veri yok"}`); }
  if (!p.yayin) one.unshift("Site yayında değil; ziyaret ve dönüşüm ölçümü yayından sonra başlar.");
  return { id: kimlikUret(), bas: trGun(6), bit: trGun(0), olusturma: Date.now(), metrikler, kanallar, kampanyalar: birlestir(simdiG, "u"), sayfalar: birlestir(simdiG, "s"), oneCikanlar: one };
}
export async function raporYorumu(p: Proje, ek: EkVeri, r: Rapor) {
  const veri = [`Dönem: ${r.bas} ile ${r.bit}`, ...r.metrikler.map((m) => `${m.ad}: bu hafta ${m.simdi}, önceki hafta ${m.once}`), `Kanallar: ${r.kanallar.map((k) => `${k.ad} ${k.adet}`).join(", ") || "yok"}`, `Kampanyalar: ${r.kampanyalar.map((k) => `${k.ad} ${k.adet}`).join(", ") || "yok"}`, `Sayfalar: ${r.sayfalar.map((k) => `${k.ad} ${k.adet}`).join(", ") || "yok"}`, ...r.oneCikanlar].join("\n");
  const y = await gorev<Record<string, unknown>>("rapor", "- ozet: haftayı 2 ya da 3 cümleyle yorumla; yalnız verilen sayılara dayan.\n- oneriler: önümüzdeki hafta yapılacak 3 ile 5 somut iş (hangi kanal, hangi sayfa, hangi içerik).", `{"ozet":"","oneriler":[""]}`, `${ozetIle(p, ek, 3000)}\n\n=== Haftanın verisi ===\n${veri}\n\n=== İstek ===\nHaftalık büyüme raporunu yorumla.`, 1500);
  return { yorum: { ozet: t(y.veri.ozet, 800), oneriler: dizi(y.veri.oneriler).slice(0, 6).map((x) => t(x, 300)).filter(Boolean) }, kredi: y.kredi, model: y.model };
}
