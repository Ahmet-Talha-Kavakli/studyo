import "server-only";
import { randomBytes } from "crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { projeOkuHam, projeOlustur, projeYaz, sahipOzeti } from "./depo";
import { kilitle, remixSiniri, PaylasimHatasi } from "./paylasim";
import { sunucuGerekli } from "./paylasimOrtak";
import { dosyaSun } from "./sun";
import { ETIKET_SINIRI, etiketTemizle, toplulukKimligiGecerli, type ToplulukOzet, type ToplulukSira } from "./toplulukOrtak";
import { bulguSatiri, guvenlikDenetimi, type GuvenlikBulgusu } from "./toplulukDenetim";
import { PROJE_TURLERI, type Proje, type ProjeTur } from "./tipler";

/**
 * Topluluk şablonları (.veri/build/topluluk/…):
 *  dizin.json          bütün öğelerin bilgisi (dosyalar hariç; sahip özeti ve proje kimliği yalnız sunucuda)
 *  ogeler/<id>.json    eklenen sürümün dosyalarının anlık kopyası
 *  kapak/<id>.webp     kapak (projenin ekran görüntüsünden ya da yüklenen görselden)
 * Her ekleme ve güncelleme otomatik güvenlik denetiminden geçer (gizli anahtar ve tehlikeli kod varsa reddedilir).
 * Proje başına tek öğe; sahip bilgilerini güncelleyebilir ya da kaldırabilir.
 */
const KOK = path.join(DEPO_KOK, "build", "topluluk");
const DIZIN = path.join(KOK, "dizin.json");
const oDosya = (id: string) => path.join(KOK, "ogeler", `${id}.json`);
const kDosya = (id: string) => path.join(KOK, "kapak", `${id}.webp`);

type Kayit = {
  id: string; sahip: string; projeId: string; surumId: string; surumNo: number;
  baslik: string; aciklama: string; kategori: ProjeTur; etiketler: string[]; yazar: string;
  /** "dosya": kapak/<id>.webp; aksi hâlde herkese açık yol (/gercek/…). */
  kapak: string; dosyaSayisi: number; sunucuGerekli: boolean;
  olusturma: number; guncelleme: number; remix: number; begenenler: string[];
};

async function oku<T>(d: string): Promise<T | null> { try { return JSON.parse(await readFile(d, "utf8")) as T; } catch { return null; } }
async function yaz(d: string, v: unknown) { await mkdir(path.dirname(d), { recursive: true }); await writeFile(d, JSON.stringify(v)); }
const dizinOku = async () => (await oku<Kayit[]>(DIZIN)) ?? [];
/** Dizini kilit altında değiştirir. */
const dizinDegistir = <T>(f: (l: Kayit[]) => Promise<{ l: Kayit[]; sonuc: T }>) => kilitle("topluluk-dizin", async () => { const { l, sonuc } = await f(await dizinOku()); await yaz(DIZIN, l); return sonuc; });

const kapakYolu = (k: Kayit) => (k.kapak === "dosya" ? `/api/build/topluluk/${k.id}/kapak?v=${k.guncelleme}` : k.kapak);
function ozet(k: Kayit, sahip: string | null): ToplulukOzet {
  const o = sahip ? sahipOzeti(sahip) : null;
  return {
    id: k.id, baslik: k.baslik, aciklama: k.aciklama, kategori: k.kategori, etiketler: k.etiketler, kapak: kapakYolu(k), yazar: k.yazar,
    remix: k.remix, begeni: k.begenenler.length, dosyaSayisi: k.dosyaSayisi, surumNo: k.surumNo, olusturma: k.olusturma, guncelleme: k.guncelleme,
    sunucuGerekli: k.sunucuGerekli, ...(o ? { benim: k.sahip === o, begendim: k.begenenler.includes(o) } : {}),
  };
}

export async function toplulukListe(g: { ara?: string; kategori?: string; etiket?: string; sira?: ToplulukSira; sahip: string | null; benim?: boolean }): Promise<ToplulukOzet[]> {
  const q = (g.ara ?? "").trim().toLocaleLowerCase("tr");
  const o = g.sahip ? sahipOzeti(g.sahip) : null;
  const l = (await dizinOku()).filter((k) => (!g.benim || k.sahip === o) && (!g.kategori || k.kategori === g.kategori) && (!g.etiket || k.etiketler.includes(g.etiket))
    && (!q || [k.baslik, k.aciklama, k.yazar, ...k.etiketler].some((x) => x.toLocaleLowerCase("tr").includes(q))));
  l.sort(g.sira === "yeni" ? (a, b) => b.olusturma - a.olusturma : (a, b) => b.remix - a.remix || b.begenenler.length - a.begenenler.length || b.olusturma - a.olusturma);
  return l.map((k) => ozet(k, g.sahip));
}
export async function toplulukOgesi(id: string, sahip: string | null): Promise<ToplulukOzet | null> {
  if (!toplulukKimligiGecerli(id)) return null;
  const k = (await dizinOku()).find((x) => x.id === id);
  return k ? ozet(k, sahip) : null;
}
/** Sahibin projesinin topluluk öğesi (yoksa null). */
export async function projeninOgesi(projeId: string, sahip: string): Promise<ToplulukOzet | null> {
  const o = sahipOzeti(sahip);
  const k = (await dizinOku()).find((x) => x.projeId === projeId && x.sahip === o);
  return k ? ozet(k, sahip) : null;
}
export async function sahipOgeleri(sahip: string) {
  const o = sahipOzeti(sahip);
  return (await dizinOku()).filter((x) => x.sahip === o).map((x) => ({ id: x.id, projeId: x.projeId }));
}

async function sahipProjesi(projeId: string, sahip: string): Promise<Proje | null> {
  const p = await projeOkuHam(projeId);
  return p && p.sahip === sahipOzeti(sahip) ? p : null;
}
function surumSec(p: Proje, surumId?: string) {
  const s = surumId && surumId !== "son" ? p.surumler.find((x) => x.id === surumId) : p.surumler.at(-1);
  if (!s) throw new PaylasimHatasi(surumId && surumId !== "son" ? "Bu sürüm bulunamadı." : "Projede henüz kayıtlı sürüm yok.", 404);
  return s;
}

/** Ekleme öncesi denetim: seçilen sürümün dosyalarında gizli anahtar ya da tehlikeli kod var mı? */
export async function toplulukDenetle(projeId: string, sahip: string, surumId?: string): Promise<{ bulgular: GuvenlikBulgusu[]; surumNo: number; dosyaSayisi: number; girisVar: boolean }> {
  const p = await sahipProjesi(projeId, sahip);
  if (!p) throw new PaylasimHatasi("Proje bulunamadı.", 404);
  const s = surumSec(p, surumId);
  return { bulgular: guvenlikDenetimi(s.dosyalar), surumNo: s.no, dosyaSayisi: Object.keys(s.dosyalar).length, girisVar: "index.html" in s.dosyalar };
}

export type EklemeGirdisi = { projeId?: unknown; surum?: unknown; baslik?: unknown; aciklama?: unknown; kategori?: unknown; etiketler?: unknown; yazar?: unknown; kapak?: unknown };
const temizMetin = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/[<>]/g, "").replace(/[ \t]+/g, " ").trim().slice(0, n) : "");

/** Kapak: "proje" (projenin ekran görüntüsü ya da şablon kapağı) veya yüklenen görselin data adresi. 1280×800 webp'e çevrilir. */
async function kapakHazirla(id: string, p: Proje, kapak: unknown): Promise<string> {
  if (typeof kapak === "string" && kapak.startsWith("data:")) {
    const m = /^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(kapak);
    if (!m) throw new PaylasimHatasi("Kapak görseli okunamadı (PNG, JPEG ya da WebP).");
    const bayt = Buffer.from(m[2], "base64");
    if (bayt.length > 3_000_000) throw new PaylasimHatasi("Kapak görseli 3 MB'tan büyük olamaz.", 413);
    let cikti: Buffer = bayt;
    try { const sharp = (await import("sharp")).default; cikti = await sharp(bayt).resize(1280, 800, { fit: "cover", position: "top" }).webp({ quality: 82 }).toBuffer(); }
    catch { if (m[1] !== "webp") throw new PaylasimHatasi("Kapak görseli işlenemedi; WebP olarak yükle."); }
    await mkdir(path.dirname(kDosya(id)), { recursive: true });
    await writeFile(kDosya(id), cikti);
    return "dosya";
  }
  const k = p.kapak;
  if (!k) throw new PaylasimHatasi("Projenin kapağı yok. Kapağı çek ya da bir görsel yükle.");
  if (k.startsWith("/api/build/kapak/")) {
    await mkdir(path.dirname(kDosya(id)), { recursive: true });
    try { await copyFile(path.join(DEPO_KOK, "build", "kapak", `${p.id}.webp`), kDosya(id)); } catch { throw new PaylasimHatasi("Projenin kapak dosyası bulunamadı. Kapağı yeniden çek ya da bir görsel yükle."); }
    return "dosya";
  }
  if (/^\/(?!\/)[A-Za-z0-9._\-/]+\.(webp|png|jpe?g)$/.test(k)) return k;
  throw new PaylasimHatasi("Bu kapak kullanılamıyor; bir görsel yükle.");
}

/** Topluluğa ekler ya da (proje zaten eklenmişse) aynı öğeyi günceller. Sayaçlar ve beğeniler korunur. */
export async function toplulukEkle(sahip: string, g: EklemeGirdisi): Promise<ToplulukOzet> {
  const p = await sahipProjesi(String(g.projeId ?? ""), sahip);
  if (!p) throw new PaylasimHatasi("Proje bulunamadı.", 404);
  const s = surumSec(p, typeof g.surum === "string" ? g.surum : undefined);
  if (!("index.html" in s.dosyalar)) throw new PaylasimHatasi("Bu sürümde index.html yok; giriş sayfası olmadan şablon açılmaz.");
  const bulgular = guvenlikDenetimi(s.dosyalar);
  if (bulgular.length) throw new PaylasimHatasi(`Güvenlik denetimi geçmedi: ${bulguSatiri(bulgular[0])}${bulgular.length > 1 ? ` ve ${bulgular.length - 1} bulgu daha` : ""}.`, 422);
  const baslik = temizMetin(g.baslik, 60), aciklama = temizMetin(g.aciklama, 300);
  if (baslik.length < 3) throw new PaylasimHatasi("Başlık en az 3 karakter olmalı.");
  if (aciklama.length < 12) throw new PaylasimHatasi("Kısa bir açıklama yaz (en az 12 karakter): ne işe yarıyor, neyi var.");
  const kategori = (PROJE_TURLERI.some((t) => t.id === g.kategori) ? g.kategori : p.tur) as ProjeTur;
  const etiketler = [...new Set((Array.isArray(g.etiketler) ? g.etiketler : []).filter((x): x is string => typeof x === "string").map(etiketTemizle).filter((x) => x.length >= 2))].slice(0, ETIKET_SINIRI);
  const yazar = temizMetin(g.yazar, 40);
  const o = sahipOzeti(sahip);

  const mevcut = (await dizinOku()).find((x) => x.projeId === p.id && x.sahip === o);
  const id = mevcut?.id ?? randomBytes(9).toString("base64url");
  const kapak = g.kapak === undefined && mevcut ? mevcut.kapak : await kapakHazirla(id, p, g.kapak ?? "proje");
  await yaz(oDosya(id), { dosyalar: s.dosyalar });
  return dizinDegistir(async (l) => {
    const eski = l.find((x) => x.id === id);
    const k: Kayit = {
      id, sahip: o, projeId: p.id, surumId: s.id, surumNo: s.no, baslik, aciklama, kategori, etiketler, yazar, kapak,
      dosyaSayisi: Object.keys(s.dosyalar).length, sunucuGerekli: sunucuGerekli(s.dosyalar),
      olusturma: eski?.olusturma ?? Date.now(), guncelleme: Date.now(), remix: eski?.remix ?? 0, begenenler: eski?.begenenler ?? [],
    };
    return { l: [k, ...l.filter((x) => x.id !== id)], sonuc: ozet(k, sahip) };
  });
}

export async function toplulukKaldir(id: string, sahip: string): Promise<boolean> {
  if (!toplulukKimligiGecerli(id)) return false;
  const o = sahipOzeti(sahip);
  const silindi = await dizinDegistir(async (l) => { const k = l.find((x) => x.id === id); return k && k.sahip === o ? { l: l.filter((x) => x.id !== id), sonuc: true } : { l, sonuc: false }; });
  if (silindi) { await rm(oDosya(id), { force: true }); await rm(kDosya(id), { force: true }); }
  return silindi;
}

/** Beğeniyi açar ya da kapatır (sahip kendi öğesini beğenemez). */
export async function toplulukBegen(id: string, sahip: string): Promise<{ begeni: number; begendim: boolean } | null> {
  const o = sahipOzeti(sahip);
  return dizinDegistir(async (l) => {
    const k = l.find((x) => x.id === id);
    if (!k) return { l, sonuc: null };
    if (k.sahip === o) throw new PaylasimHatasi("Kendi şablonunu beğenemezsin.", 403);
    k.begenenler = k.begenenler.includes(o) ? k.begenenler.filter((x) => x !== o) : [...k.begenenler, o].slice(-50_000);
    return { l, sonuc: { begeni: k.begenenler.length, begendim: k.begenenler.includes(o) } };
  });
}

async function ogeCoz(id: string): Promise<{ k: Kayit; dosyalar: Record<string, string> } | null> {
  if (!toplulukKimligiGecerli(id)) return null;
  const k = (await dizinOku()).find((x) => x.id === id);
  const d = k ? await oku<{ dosyalar: Record<string, string> }>(oDosya(id)) : null;
  return k && d ? { k, dosyalar: d.dosyalar } : null;
}

export async function toplulukRemix(id: string, sahip: string): Promise<string> {
  const c = await ogeCoz(id);
  if (!c) throw new PaylasimHatasi("Şablon bulunamadı.", 404);
  if (remixSiniri(sahip)) throw new PaylasimHatasi("Bir saatte çok fazla remix yaptın; biraz sonra yeniden dene.", 429);
  const yeni = await projeOlustur({ ad: c.k.baslik.slice(0, 60), tur: c.k.kategori, dosyalar: { ...c.dosyalar }, sahip, sablon: "remix", aciklama: `${c.k.baslik} projesinden remix` });
  yeni.remixKaynagi = { tur: "topluluk", id: c.k.id, ad: c.k.baslik, yazar: c.k.yazar, surumNo: c.k.surumNo, zaman: Date.now() };
  await projeYaz(yeni, sahip);
  await dizinDegistir(async (l) => { const k = l.find((x) => x.id === id); if (k) k.remix++; return { l, sonuc: null }; });
  return yeni.id;
}

export async function toplulukKapak(id: string): Promise<Buffer | null> {
  if (!toplulukKimligiGecerli(id)) return null;
  try { return await readFile(kDosya(id)); } catch { return null; }
}

/** Şablonun canlı önizlemesi (proje kimliği yok; formlar kaydedilmez, veri ve üyelik betikleri eklenmez). */
export async function toplulukOnizleme(id: string, yol: string[] | undefined): Promise<Response | null> {
  const c = await ogeCoz(id);
  if (!c) return null;
  const sahte = {
    id: "sablon-topluluk", ad: c.k.baslik, tur: c.k.kategori, dosyalar: c.dosyalar, surumler: [], mesajlar: [], alanAdlari: [], yayin: null,
    olusturma: 0, guncelleme: 0, onizlemeBelirteci: "",
    ayarlar: { altAlan: "topluluk", gorunurluk: "herkes", seo: { baslik: c.k.baslik, aciklama: c.k.aciklama, indeks: false }, sirlar: [], rozet: false, talimat: "" },
  } as Proje;
  return dosyaSun(sahte, c.dosyalar, yol, { onizleme: false, kok: `/api/build/topluluk/${id}/onizleme` });
}
