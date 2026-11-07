import "server-only";
import { randomBytes } from "crypto";
import { access, mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { projeOkuHam, projeOlustur, projeYaz, sahipOzeti } from "./depo";
import { dosyaSun } from "./sun";
import { PAYLASIM_KIMLIGI, sunucuGerekli, type PaylasimAyari, type PaylasimGorunumu, type PaylasimSurumOzeti } from "./paylasimOrtak";
import { guvenlikDenetimi, bulguSatiri, type GuvenlikBulgusu } from "./toplulukDenetim";
import type { Proje } from "./tipler";

/**
 * Proje paylaşım bağlantıları (.veri/build/proje-paylasim/…):
 *  <pid>.json            paylaşım kaydı (ayarlar, sayaçlar; sabitlenen sürümün dosya kopyası)
 *  proje/<projeId>       projenin etkin paylaşımı → pid
 *  sahip/<özet>.json     sahibin paylaşımları
 * Kimlik 16 karakter (96 bit rastgele), tahmin edilemez. Herkese açık tarafa yalnız dosyalar gider; sırlar, ortam
 * değişkenleri, form gelen kutusu, veritabanı, üyeler ve günlükler okunmaz. Paylaşılan sürümde gizli anahtar
 * bulunursa sayfa kendiliğinden kapanır.
 */
const KOK = path.join(DEPO_KOK, "build", "proje-paylasim");
const kDosya = (pid: string) => path.join(KOK, `${pid}.json`);
const iDosya = (projeId: string) => path.join(KOK, "proje", projeId);
const sDosya = (ozet: string) => path.join(KOK, "sahip", `${ozet}.json`);

type SabitSurum = { id: string; no: number; zaman: number; dosyalar: Record<string, string> };
export type PaylasimKaydi = {
  id: string; projeId: string; sahip: string; aciklama: string; yazar: string; remix: boolean; kod: boolean;
  surum: "son" | SabitSurum; olusturma: number; guncelleme: number; goruntulenme: number; remixSayisi: number;
};

async function oku<T>(d: string): Promise<T | null> { try { return JSON.parse(await readFile(d, "utf8")) as T; } catch { return null; } }
async function yaz(d: string, v: unknown) { await mkdir(path.dirname(d), { recursive: true }); await writeFile(d, typeof v === "string" ? v : JSON.stringify(v)); }

/* Aynı kayda art arda yazan istekler (görüntülenme, remix sayacı, ayar) birbirini ezmesin: anahtar başına sıra. */
const kilitler = new Map<string, Promise<unknown>>();
export async function kilitle<T>(anahtar: string, f: () => Promise<T>): Promise<T> {
  let bitir!: () => void;
  const kapi = new Promise<void>((r) => { bitir = r; });
  const onceki = kilitler.get(anahtar) ?? Promise.resolve();
  const benim = onceki.catch(() => {}).then(() => kapi);
  kilitler.set(anahtar, benim);
  await onceki.catch(() => {});
  try { return await f(); } finally { bitir(); if (kilitler.get(anahtar) === benim) kilitler.delete(anahtar); }
}

export const paylasimOku = (pid: string) => (PAYLASIM_KIMLIGI.test(pid) ? oku<PaylasimKaydi>(kDosya(pid)) : Promise.resolve(null));

/** Sahibin projesi (sahip doğrulanır). */
async function sahipProjesi(projeId: string, sahip: string): Promise<Proje | null> {
  const p = await projeOkuHam(projeId);
  if (!p || p.sahip !== sahipOzeti(sahip)) return null;
  return p;
}

/** Projenin son sürümü (sürüm yoksa güncel dosyalar). */
function sonSurum(p: Proje): { id: string; no: number; zaman: number; dosyalar: Record<string, string> } {
  const s = p.surumler.at(-1);
  return s ? { id: s.id, no: s.no, zaman: s.zaman, dosyalar: s.dosyalar } : { id: "taslak", no: 0, zaman: p.guncelleme, dosyalar: p.dosyalar };
}

/* Gizli anahtar taraması sürüm başına bir kez (dosyalar 4 MB'a kadar çıkabilir). */
const engelOnbellek = new Map<string, GuvenlikBulgusu[]>();
function engel(projeId: string, surumId: string, dosyalar: Record<string, string>): GuvenlikBulgusu[] {
  const k = `${projeId}:${surumId}`;
  let v = engelOnbellek.get(k);
  if (!v) { v = guvenlikDenetimi(dosyalar, { yalnizSir: true }); engelOnbellek.set(k, v); if (engelOnbellek.size > 500) engelOnbellek.delete(engelOnbellek.keys().next().value!); }
  return v;
}

export class PaylasimHatasi extends Error { constructor(mesaj: string, public durum = 400) { super(mesaj); } }

function sahibeAcik(k: PaylasimKaydi, p: Proje | null): PaylasimAyari {
  const s = k.surum === "son" ? (p ? sonSurum(p) : null) : k.surum;
  return {
    id: k.id, projeId: k.projeId, aciklama: k.aciklama, yazar: k.yazar, remix: k.remix, kod: k.kod,
    surum: k.surum === "son" ? "son" : { id: k.surum.id, no: k.surum.no, zaman: k.surum.zaman },
    olusturma: k.olusturma, guncelleme: k.guncelleme, goruntulenme: k.goruntulenme, remixSayisi: k.remixSayisi,
    engel: s ? engel(k.projeId, s.id, s.dosyalar) : [],
  };
}

const surumOzetleri = (p: Proje): PaylasimSurumOzeti[] => [...p.surumler].reverse().map((s) => ({ id: s.id, no: s.no, aciklama: s.aciklama, zaman: s.zaman }));

/** Sahip paneli: projenin paylaşımı (yoksa null) ve seçilebilecek sürümler. */
export async function projePaylasimi(projeId: string, sahip: string) {
  const p = await sahipProjesi(projeId, sahip);
  if (!p) return null;
  const pid = (await readFile(iDosya(projeId), "utf8").catch(() => "")).trim();
  const k = pid ? await paylasimOku(pid) : null;
  return { paylasim: k && k.sahip === sahipOzeti(sahip) ? sahibeAcik(k, p) : null, surumler: surumOzetleri(p), proje: { ad: p.ad, tur: p.tur, kapak: p.kapak ?? null, dosyaSayisi: Object.keys(p.dosyalar).length, sunucuDosyasi: Object.keys(p.dosyalar).filter((y) => /^api\/.+\.js$/.test(y)).length } };
}

/** Sahibin etkin paylaşımları (projeler sayfasındaki "Paylaşılıyor" durumu). */
export async function sahipPaylasimlari(sahip: string) {
  const l = (await oku<string[]>(sDosya(sahipOzeti(sahip)))) ?? [];
  const sonuc: { id: string; projeId: string; goruntulenme: number; remixSayisi: number }[] = [];
  for (const pid of l) {
    const k = await paylasimOku(pid);
    // Silinmiş projenin bağlantısı zaten çalışmaz; listede gösterilmez.
    if (!k || k.sahip !== sahipOzeti(sahip) || !(await access(path.join(DEPO_KOK, "build", "projeler", `${k.projeId}.json`)).then(() => true, () => false))) continue;
    sonuc.push({ id: k.id, projeId: k.projeId, goruntulenme: k.goruntulenme, remixSayisi: k.remixSayisi });
  }
  return sonuc;
}

type AyarGirdisi = { aciklama?: unknown; yazar?: unknown; remix?: unknown; kod?: unknown; surum?: unknown };
function ayarUygula(k: PaylasimKaydi, p: Proje, g: AyarGirdisi) {
  if (typeof g.aciklama === "string") k.aciklama = g.aciklama.replace(/\s+\n/g, "\n").trim().slice(0, 280);
  if (typeof g.yazar === "string") k.yazar = g.yazar.replace(/[<>"`]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
  if (typeof g.remix === "boolean") k.remix = g.remix;
  if (typeof g.kod === "boolean") k.kod = g.kod;
  if (g.surum === "son") k.surum = "son";
  else if (typeof g.surum === "string") {
    const s = p.surumler.find((x) => x.id === g.surum);
    if (!s) throw new PaylasimHatasi("Bu sürüm bulunamadı.", 404);
    k.surum = { id: s.id, no: s.no, zaman: s.zaman, dosyalar: { ...s.dosyalar } };
  }
}
function engelKontrol(k: PaylasimKaydi, p: Proje) {
  const s = k.surum === "son" ? sonSurum(p) : k.surum;
  if (!Object.keys(s.dosyalar).length) throw new PaylasimHatasi("Projede henüz dosya yok; önce bir şey oluştur.", 409);
  const e = engel(p.id, s.id, s.dosyalar);
  if (e.length) throw new PaylasimHatasi(`Paylaşılamaz: ${bulguSatiri(e[0])}${e.length > 1 ? ` ve ${e.length - 1} bulgu daha` : ""}. Önce koddan çıkar.`, 422);
}

/** Projeye bağlantı açar (zaten varsa ayarları uygular ve onu döndürür). */
export async function paylasimOlustur(projeId: string, sahip: string, g: AyarGirdisi = {}): Promise<PaylasimAyari> {
  const p = await sahipProjesi(projeId, sahip);
  if (!p) throw new PaylasimHatasi("Proje bulunamadı.", 404);
  return kilitle(`proje-paylasim:${projeId}`, async () => {
    const eskiPid = (await readFile(iDosya(projeId), "utf8").catch(() => "")).trim();
    const eski = eskiPid ? await paylasimOku(eskiPid) : null;
    if (eski && eski.sahip === sahipOzeti(sahip)) return paylasimGuncelle(eski.id, sahip, g);
    const k: PaylasimKaydi = { id: randomBytes(12).toString("base64url"), projeId, sahip: sahipOzeti(sahip), aciklama: "", yazar: "", remix: true, kod: true, surum: "son", olusturma: Date.now(), guncelleme: Date.now(), goruntulenme: 0, remixSayisi: 0 };
    ayarUygula(k, p, g);
    engelKontrol(k, p);
    await yaz(kDosya(k.id), k);
    await yaz(iDosya(projeId), k.id);
    const sl = (await oku<string[]>(sDosya(k.sahip))) ?? [];
    await yaz(sDosya(k.sahip), [k.id, ...sl.filter((x) => x !== k.id)]);
    return sahibeAcik(k, p);
  });
}

export async function paylasimGuncelle(pid: string, sahip: string, g: AyarGirdisi): Promise<PaylasimAyari> {
  return kilitle(`paylasim:${pid}`, async () => {
    const k = await paylasimOku(pid);
    if (!k || k.sahip !== sahipOzeti(sahip)) throw new PaylasimHatasi("Paylaşım bulunamadı.", 404);
    const p = await sahipProjesi(k.projeId, sahip);
    if (!p) throw new PaylasimHatasi("Proje bulunamadı.", 404);
    const surumDegisti = g.surum !== undefined;
    ayarUygula(k, p, g);
    if (surumDegisti) engelKontrol(k, p);
    k.guncelleme = Date.now();
    await yaz(kDosya(pid), k);
    return sahibeAcik(k, p);
  });
}

/** Bağlantıyı kaldırır: adres hemen çalışmaz olur, sayaçlar silinir. */
export async function paylasimKaldir(pid: string, sahip: string): Promise<boolean> {
  return kilitle(`paylasim:${pid}`, async () => {
    const k = await paylasimOku(pid);
    if (!k || k.sahip !== sahipOzeti(sahip)) return false;
    await rm(kDosya(pid), { force: true });
    if ((await readFile(iDosya(k.projeId), "utf8").catch(() => "")).trim() === pid) await rm(iDosya(k.projeId), { force: true });
    const sl = (await oku<string[]>(sDosya(k.sahip))) ?? [];
    await yaz(sDosya(k.sahip), sl.filter((x) => x !== pid));
    return true;
  });
}

/* ── Herkese açık taraf ── */
export type CozulmusPaylasim = { k: PaylasimKaydi; p: Proje; surum: { id: string; no: number; zaman: number }; dosyalar: Record<string, string> };

/** Bağlantıyı çözer: kayıt var, proje duruyor ve hâlâ aynı sahibin, paylaşılan sürümde gizli anahtar yok. */
export async function paylasimCoz(pid: string): Promise<CozulmusPaylasim | null> {
  const k = await paylasimOku(pid);
  if (!k) return null;
  const p = await projeOkuHam(k.projeId);
  if (!p || p.sahip !== k.sahip) return null;
  const s = k.surum === "son" ? sonSurum(p) : k.surum;
  if (!Object.keys(s.dosyalar).length || engel(p.id, s.id, s.dosyalar).length) return null;
  return { k, p, surum: { id: s.id, no: s.no, zaman: s.zaman }, dosyalar: s.dosyalar };
}

/** Kapak: projenin ekran görüntüsü bu bağlantı üzerinden verilir (proje kimliği sayfaya yazılmaz). */
export function kapakAdresi(c: CozulmusPaylasim): string | null {
  const k = c.p.kapak;
  if (!k) return null;
  if (k.startsWith("/api/build/kapak/")) return `/api/build/paylasim/${c.k.id}/kapak?v=${encodeURIComponent(k.split("v=")[1] ?? "")}`;
  return /^(\/(?!\/)|https:\/\/)/.test(k) ? k : null;
}
export async function kapakBaytlari(c: CozulmusPaylasim): Promise<Buffer | null> {
  if (!c.p.kapak?.startsWith("/api/build/kapak/")) return null;
  try { return await readFile(path.join(DEPO_KOK, "build", "kapak", `${c.p.id}.webp`)); } catch { return null; }
}

export function gorunum(c: CozulmusPaylasim): PaylasimGorunumu {
  return {
    id: c.k.id, ad: c.p.ad, aciklama: c.k.aciklama, yazar: c.k.yazar, tur: c.p.tur, kapak: kapakAdresi(c),
    surumNo: c.surum.no, surumZaman: c.surum.zaman, sabit: c.k.surum !== "son",
    dosyaSayisi: Object.keys(c.dosyalar).length, sayfaSayisi: Object.keys(c.dosyalar).filter((y) => /\.html?$/.test(y)).length,
    remix: c.k.remix, kod: c.k.kod, goruntulenme: c.k.goruntulenme, remixSayisi: c.k.remixSayisi, olusturma: c.k.olusturma,
    sunucuGerekli: sunucuGerekli(c.dosyalar),
  };
}

/**
 * Canlı önizleme: dosyalar şablon önizlemesi gibi sunulur (kum havuzu başlığı, köprü betiği yok). Proje kimliği
 * yerine "sablon-" önekli sahte kimlik verilir; böylece formlar gelen kutusuna düşmez, Vayra Veri / üyelik / analitik
 * betikleri eklenmez, ortam değişkeni ve rozet gitmez.
 */
export function onizlemeSun(c: CozulmusPaylasim, yol: string[] | undefined, kok: string): Response {
  const sahte = {
    id: "sablon-paylasim", ad: c.p.ad, tur: c.p.tur, dosyalar: c.dosyalar, surumler: [], mesajlar: [], alanAdlari: [], yayin: null,
    olusturma: 0, guncelleme: 0, onizlemeBelirteci: "",
    ayarlar: { altAlan: "paylasim", gorunurluk: "herkes", seo: { baslik: c.p.ad, aciklama: "", indeks: false }, sirlar: [], rozet: false, talimat: "" },
  } as Proje;
  return dosyaSun(sahte, c.dosyalar, yol, { onizleme: false, kok });
}

/* Görüntülenme: sahibin kendi bakışı ve aynı ağdan 30 dakika içindeki tekrar sayılmaz. */
const sonBakis = new Map<string, number>();
export async function goruntulemeEkle(pid: string, sahip: string | null, ag: string): Promise<number | null> {
  const k = await paylasimOku(pid);
  if (!k) return null;
  if (sahip && sahipOzeti(sahip) === k.sahip) return k.goruntulenme;
  const anahtar = `${pid}:${ag}`;
  if (Date.now() - (sonBakis.get(anahtar) ?? 0) < 30 * 60_000) return k.goruntulenme;
  sonBakis.set(anahtar, Date.now());
  if (sonBakis.size > 20_000) sonBakis.clear();
  return kilitle(`paylasim:${pid}`, async () => {
    const g = await paylasimOku(pid);
    if (!g) return null;
    g.goruntulenme++;
    await yaz(kDosya(pid), g);
    return g.goruntulenme;
  });
}

/* Remix: sahip başına saatte en çok 20 kopya (depoyu doldurmasın). */
const remixGecmisi = new Map<string, number[]>();
export function remixSiniri(sahip: string): boolean {
  const o = sahipOzeti(sahip), simdi = Date.now();
  const l = (remixGecmisi.get(o) ?? []).filter((t) => simdi - t < 3_600_000);
  if (l.length >= 20) return true;
  l.push(simdi); remixGecmisi.set(o, l);
  return false;
}

/** Paylaşılan sürümün dosyalarını izleyicinin projelerine kopyalar; ilk sürüm kaynağı anar. */
export async function paylasimRemix(pid: string, sahip: string): Promise<string> {
  const c = await paylasimCoz(pid);
  if (!c) throw new PaylasimHatasi("Bu bağlantı artık çalışmıyor.", 404);
  if (!c.k.remix) throw new PaylasimHatasi("Sahibi bu projenin remix edilmesini kapattı.", 403);
  if (remixSiniri(sahip)) throw new PaylasimHatasi("Bir saatte çok fazla remix yaptın; biraz sonra yeniden dene.", 429);
  const yeni = await projeOlustur({ ad: `${c.p.ad.slice(0, 52)} remix`, tur: c.p.tur, dosyalar: { ...c.dosyalar }, sahip, sablon: "remix", aciklama: `${c.p.ad} projesinden remix` });
  yeni.remixKaynagi = { tur: "paylasim", id: c.k.id, ad: c.p.ad, yazar: c.k.yazar, surumNo: c.surum.no, zaman: Date.now() };
  await projeYaz(yeni, sahip);
  await kilitle(`paylasim:${pid}`, async () => { const g = await paylasimOku(pid); if (g) { g.remixSayisi++; await yaz(kDosya(pid), g); } });
  return yeni.id;
}
