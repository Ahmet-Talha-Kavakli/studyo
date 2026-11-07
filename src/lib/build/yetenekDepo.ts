import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { sahipOzeti } from "./depo";
import { YETENEK_KATALOGU, type YetenekKategori } from "./yetenekKatalog";
import { yetenekTara, type TaramaSonucu } from "./yetenekTarama";

/**
 * Kullanıcının yetenekleri (skills). SKILL.md uyumlu: ad (küçük harf, tire), açıklama (ne zaman kullanılır),
 * gövde (talimat) ve ek dosyalar (references/, scripts/). Her kayıtta sürüm anlık görüntüsü tutulur (gövde,
 * açıklama, dosyalar). Sürüm sabitlenebilir; çağrı politikası (model karar verir / yalnız istenince / her zaman),
 * gereken bağlantılar, paylaşım bağlantısı ve güvenlik taraması kayıtta durur.
 * Motorlar yetenekGetir / yetenekHam / yetenekleriListele ile ETKİN görünümü alır: sabit sürümün içeriği,
 * politikaya göre açıklama; kritik tarama bulgusu olan yetenek etkinleşmez. Düzenleyici ham kaydı yetenekKaydi ile okur.
 * Dosyalar: .veri/build/yetenekler/<id>.json, sahip dizini .veri/build/yetenek-sahip/<özet>.json
 */
export type YetenekDosya = { yol: string; icerik: string };
export type YetenekCagri = "model" | "elle" | "her-zaman";
export type YetenekSurum = { no: number; tarih: number; aciklama: string; govde: string; dosyalar?: YetenekDosya[]; not?: string };
export type Yetenek = {
  id: string; ad: string; baslik: string; aciklama: string; govde: string; dosyalar: YetenekDosya[];
  kategori?: YetenekKategori; simge: string; katalogId?: string; ornekler: string[];
  /** Her genel sohbette kullanılabilir mi. */
  herSohbette: boolean;
  surum: number; surumler: YetenekSurum[];
  /** Düzenleyicideki test sohbeti. */
  testSohbet?: string;
  olusturma: number; guncelleme: number;
  /* ── v2 ── */
  cagri?: YetenekCagri;
  /** Sabitlenen sürüm: motorlar bu sürümün içeriğini kullanır (taslak değişse de). */
  sabitSurum?: number;
  /** Gereken bağlantılar: katalog kimlikleri (ör. "trendyol") ya da "url:https://..." özel sunucu. */
  gerekenBaglantilar?: string[];
  /** İçe aktarıldığı kaynak (lisans bilgisiyle). */
  kaynak?: { tur: "anthropic" | "paylasim" | "dosya"; ad?: string; url?: string; lisans?: string; commit?: string; agac?: string };
  paylasim?: { anahtar: string; tarih: number };
  tarama?: TaramaSonucu;
  tetikTestleri?: { sorgu: string; beklenen: boolean }[];
  /* ── v3 ── */
  /** Betiklerin (scripts/*.js) erişebileceği alan adları; boşsa ağ kapalı. */
  betikAg?: string[];
  /** Kayıtlı değerlendirme paketi ve son çalışmaları (en çok 20). */
  degerlendirme?: { vakalar: import("./yetenekDegerlendir").Vaka[]; calismalar: import("./yetenekDegerlendir").Calisma[] };
};
export type YetenekOzet = Pick<Yetenek, "id" | "ad" | "baslik" | "aciklama" | "simge" | "kategori" | "katalogId" | "herSohbette" | "surum" | "guncelleme"> & {
  dosya: number; boyut: number; cagri: YetenekCagri; sabitSurum?: number; gerekenBaglantilar: string[]; tarama?: TaramaSonucu["sonuc"]; paylasimda: boolean; kaynak?: Yetenek["kaynak"];
};

const KOK = path.join(DEPO_KOK, "build");
const dosya = (id: string) => path.join(KOK, "yetenekler", `${id}.json`);
const dizin = (sahip: string) => path.join(KOK, "yetenek-sahip", `${sahipOzeti(sahip)}.json`);
const paylasimDosyasi = (a: string) => path.join(KOK, "yetenek-paylasim", `${a}.json`);
const KIMLIK = /^[A-Za-z0-9_-]{10}$/;
export const AD = /^[a-z0-9]+(-[a-z0-9]+)*$/;

async function oku<T>(f: string): Promise<T | null> { try { return JSON.parse(await readFile(f, "utf8")) as T; } catch { return null; } }
async function yaz(f: string, v: unknown) { await mkdir(path.dirname(f), { recursive: true }); await writeFile(f, JSON.stringify(v)); }
type Kayitli = Yetenek & { sahip: string };

export const ozetle = (y: Yetenek): YetenekOzet => ({
  id: y.id, ad: y.ad, baslik: y.baslik, aciklama: y.aciklama, simge: y.simge, kategori: y.kategori, katalogId: y.katalogId, herSohbette: y.herSohbette, surum: y.surum, guncelleme: y.guncelleme,
  dosya: y.dosyalar.length, boyut: y.govde.length + y.dosyalar.reduce((t, d) => t + d.icerik.length, 0),
  cagri: y.cagri ?? "model", sabitSurum: y.sabitSurum, gerekenBaglantilar: y.gerekenBaglantilar ?? [], tarama: y.tarama?.sonuc, paylasimda: !!y.paylasim, kaynak: y.kaynak,
});

/** Başlıktan SKILL.md uyumlu ad. */
export function adUret(baslik: string): string {
  const t: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  return baslik.toLocaleLowerCase("tr").replace(/[çğıöşüâîû]/g, (h) => t[h] ?? h).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "yetenek";
}

/** Eski kayıtları tamamlar; taraması olmayanı tarar (okunurken göç). */
function tamamla(y: Yetenek): Yetenek {
  y.dosyalar ??= []; y.ornekler ??= []; y.surumler ??= [];
  y.tarama ??= yetenekTara([{ yol: "SKILL.md", icerik: `${y.aciklama}\n${y.govde}` }, ...y.dosyalar]);
  return y;
}
/**
 * Motorların gördüğü etkin yetenek: sabit sürüm içeriği, çağrı politikasına göre açıklama. Kritik güvenlik
 * bulgusu varsa null (etkinleşmez).
 */
export function etkinYetenek(y: Yetenek): Yetenek | null {
  if (y.tarama?.sonuc === "kritik") return null;
  let { govde, aciklama, dosyalar } = y;
  const s = y.sabitSurum ? y.surumler.find((x) => x.no === y.sabitSurum) : undefined;
  if (s) { govde = s.govde; aciklama = s.aciklama; dosyalar = s.dosyalar ?? dosyalar; }
  const cagri = y.cagri ?? "model";
  const on = cagri === "elle" ? `Yalnız kullanıcı "/${y.ad}" ya da "@${y.ad}" yazarak açıkça isterse kullan. ` : cagri === "her-zaman" ? "Her zaman açık: her görevde işe başlamadan önce yükle ve uygula. " : "";
  return { ...y, govde, aciklama: `${on}${aciklama}`, dosyalar };
}

/** Ham kayıt (düzenleyici için; sahip denetimli). */
export async function yetenekKaydi(id: string, sahip: string): Promise<Yetenek | null> {
  if (!KIMLIK.test(id)) return null;
  const y = await oku<Kayitli>(dosya(id));
  if (!y || y.sahip !== sahipOzeti(sahip)) return null;
  const { sahip: _s, ...t } = y; void _s;
  return tamamla(t);
}
/** Etkin yetenek (sohbet ve ajanlar için). Kritik tarama bulgusu varsa null. */
export async function yetenekGetir(id: string, sahip: string): Promise<Yetenek | null> {
  const y = await yetenekKaydi(id, sahip);
  return y ? etkinYetenek(y) : null;
}
/** Sahip özetiyle etkin yetenek (yayındaki ajanın yetenekleri için). */
export async function yetenekHam(id: string, sahipOz: string): Promise<Yetenek | null> {
  if (!KIMLIK.test(id)) return null;
  const y = await oku<Kayitli>(dosya(id));
  if (!y || y.sahip !== sahipOz) return null;
  const { sahip: _s, ...t } = y; void _s;
  return etkinYetenek(tamamla(t));
}

/* Kimlik başına yazım kilidi. */
const kilitler = new Map<string, Promise<unknown>>();
function kilitle<T>(id: string, f: () => Promise<T>): Promise<T> {
  const p = (kilitler.get(id) ?? Promise.resolve()).catch(() => {}).then(f);
  kilitler.set(id, p);
  p.finally(() => { if (kilitler.get(id) === p) kilitler.delete(id); }).catch(() => {});
  return p;
}
const dosyaImzasi = (l: YetenekDosya[]) => JSON.stringify(l.map((d) => [d.yol, d.icerik.length, d.icerik.slice(0, 200), d.icerik.slice(-200)]));

/**
 * Kilitli güncelleme. Gövde, açıklama ya da dosyalar değiştiyse yeni sürüm (10 dakika içindeki düzenlemeler aynı
 * sürümde birleşir; en çok 30 sürüm tutulur). secenek.surumNotu verilirse birleştirmeden yeni sürüm açılır.
 * Her kayıtta güvenlik taraması yenilenir.
 */
export function yetenekGuncelle(id: string, sahip: string, f: (y: Yetenek) => void | string, secenek: { surumNotu?: string } = {}): Promise<{ yetenek: Yetenek; hata?: undefined } | { hata: string; yetenek?: undefined } | null> {
  return kilitle(id, async () => {
    const y = await yetenekKaydi(id, sahip);
    if (!y) return null;
    const onceGovde = y.govde, onceAciklama = y.aciklama, onceDosya = dosyaImzasi(y.dosyalar);
    const h = f(y);
    if (typeof h === "string") return { hata: h };
    const degisti = y.govde !== onceGovde || y.aciklama !== onceAciklama || dosyaImzasi(y.dosyalar) !== onceDosya;
    if (degisti || secenek.surumNotu !== undefined) {
      const son = y.surumler.at(-1);
      const anlik = { tarih: Date.now(), aciklama: y.aciklama, govde: y.govde, dosyalar: y.dosyalar.map((d) => ({ ...d })) };
      if (!son || secenek.surumNotu !== undefined || Date.now() - son.tarih > 10 * 60_000 || son.not) {
        y.surum = Math.max(y.surum, son?.no ?? 0) + 1;
        y.surumler = [...y.surumler, { no: y.surum, ...anlik, ...(secenek.surumNotu ? { not: secenek.surumNotu.slice(0, 200) } : {}) }].slice(-30);
      } else Object.assign(son, anlik);
    }
    if (y.sabitSurum && !y.surumler.some((s) => s.no === y.sabitSurum)) y.sabitSurum = undefined;
    y.tarama = yetenekTara([{ yol: "SKILL.md", icerik: `${y.aciklama}\n${y.govde}` }, ...y.dosyalar]);
    y.guncelleme = Date.now();
    await yaz(dosya(id), { ...y, sahip: sahipOzeti(sahip) });
    return { yetenek: y };
  });
}

export async function yetenekOlustur(sahip: string, g: Partial<Yetenek> & { katalog?: string }): Promise<Yetenek> {
  const id = randomBytes(8).toString("base64url").slice(0, 10);
  const k = g.katalog ? YETENEK_KATALOGU.find((x) => x.id === g.katalog) : undefined;
  const baslik = (g.baslik ?? k?.baslik ?? "Yeni yetenek").slice(0, 80);
  const govde = (g.govde ?? k?.govde ?? "").slice(0, 80_000);
  const aciklama = (g.aciklama ?? k?.aciklama ?? "").slice(0, 1024);
  const dosyalar = (g.dosyalar ?? k?.dosyalar ?? []).slice(0, 40).map((d) => ({ yol: d.yol.slice(0, 160), icerik: d.icerik.slice(0, 300_000) }));
  const tarama = yetenekTara([{ yol: "SKILL.md", icerik: `${aciklama}\n${govde}` }, ...dosyalar]);
  const y: Yetenek = {
    id, ad: g.ad && AD.test(g.ad) ? g.ad : k?.ad ?? adUret(baslik), baslik, aciklama, govde, dosyalar,
    kategori: g.kategori ?? k?.kategori, simge: g.simge ?? k?.simge ?? "/gercek/galeri/3d9.webp", katalogId: k?.id, ornekler: (g.ornekler ?? k?.ornekler ?? []).slice(0, 8),
    herSohbette: tarama.sonuc === "kritik" ? false : g.herSohbette ?? false, surum: 1, surumler: [{ no: 1, tarih: Date.now(), aciklama, govde, dosyalar: dosyalar.map((d) => ({ ...d })) }],
    olusturma: Date.now(), guncelleme: Date.now(),
    cagri: g.cagri, gerekenBaglantilar: g.gerekenBaglantilar, kaynak: g.kaynak, tarama,
  };
  await yaz(dosya(id), { ...y, sahip: sahipOzeti(sahip) });
  const l = (await oku<string[]>(dizin(sahip))) ?? [];
  await yaz(dizin(sahip), [id, ...l.filter((x) => x !== id)].slice(0, 500));
  return y;
}
/** Ham kayıtlar (düzenleyici ve liste için). */
export async function yetenekKayitlari(sahip: string): Promise<Yetenek[]> {
  const l = (await oku<string[]>(dizin(sahip))) ?? [];
  const o: Yetenek[] = [];
  for (const id of l.slice(0, 300)) { const y = await yetenekKaydi(id, sahip); if (y) o.push(y); }
  return o.sort((a, b) => b.guncelleme - a.guncelleme);
}
/** Etkin yetenekler (sohbet için): kritik bulgusu olanlar dışarıda. */
export async function yetenekleriListele(sahip: string): Promise<Yetenek[]> {
  return (await yetenekKayitlari(sahip)).map(etkinYetenek).filter((x): x is Yetenek => !!x);
}
export async function yetenekSil(id: string, sahip: string) {
  const y = await yetenekKaydi(id, sahip);
  if (!y) return false;
  if (y.paylasim) await rm(paylasimDosyasi(y.paylasim.anahtar), { force: true });
  await rm(dosya(id), { force: true });
  const l = (await oku<string[]>(dizin(sahip))) ?? [];
  await yaz(dizin(sahip), l.filter((x) => x !== id));
  return true;
}

/* ── Çağrı politikası (motorlar için yardımcı) ── */
/**
 * Mesaja göre yetenekleri hazırlar: "elle" politikalı yetenekler yalnız mesajda /ad ya da @ad geçerse listede kalır;
 * "her-zaman" olanların gövdesi sistem istemine eklenecek metin olarak döner (yetenek_oku beklemeden uygulanır).
 */
export function yetenekleriCagriyaGoreHazirla(l: Yetenek[], mesaj = ""): { liste: Yetenek[]; sistemEki: string } {
  const istenen = (y: Yetenek) => new RegExp(`(^|\\s)[/@]${y.ad}(\\b|$)`).test(mesaj);
  const liste = l.filter((y) => (y.cagri ?? "model") !== "elle" || istenen(y));
  const hep = liste.filter((y) => y.cagri === "her-zaman");
  const sistemEki = hep.length ? `\n<her_zaman_acik_yetenekler>\n${hep.map((y) => `<yetenek ad="${y.ad}">\n${y.govde.slice(0, 20_000)}\n</yetenek>`).join("\n")}\n</her_zaman_acik_yetenekler>` : "";
  return { liste, sistemEki };
}

/* ── Paylaşım ── */
export async function paylasimAc(id: string, sahip: string): Promise<string | null> {
  const r = await yetenekGuncelle(id, sahip, (y) => { y.paylasim ??= { anahtar: randomBytes(18).toString("base64url"), tarih: Date.now() }; });
  if (!r?.yetenek?.paylasim) return null;
  await yaz(paylasimDosyasi(r.yetenek.paylasim.anahtar), { id, sahipOz: sahipOzeti(sahip) });
  return r.yetenek.paylasim.anahtar;
}
export async function paylasimKapat(id: string, sahip: string): Promise<boolean> {
  const y = await yetenekKaydi(id, sahip);
  if (!y?.paylasim) return false;
  await rm(paylasimDosyasi(y.paylasim.anahtar), { force: true });
  await yetenekGuncelle(id, sahip, (x) => { x.paylasim = undefined; });
  return true;
}
/** Paylaşılan yetenek (herkese açık, salt okuma): etkin içerik; kritik bulgu varsa paylaşılmaz. */
export async function paylasimGetir(anahtar: string): Promise<Yetenek | null> {
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(anahtar)) return null;
  const p = await oku<{ id: string; sahipOz: string }>(paylasimDosyasi(anahtar));
  if (!p) return null;
  const y = await oku<Kayitli>(dosya(p.id));
  if (!y || y.sahip !== p.sahipOz || y.paylasim?.anahtar !== anahtar) return null;
  const { sahip: _s, ...t } = y; void _s;
  const e = etkinYetenek(tamamla(t));
  return e ? { ...e, surum: t.sabitSurum ?? t.surum, aciklama: t.sabitSurum ? t.surumler.find((s) => s.no === t.sabitSurum)?.aciklama ?? t.aciklama : t.aciklama } : null;
}

/* ── SKILL.md biçimi ── */
const kacis = (s: string) => (/[:#"'\n]|^\s|\s$/.test(s) ? JSON.stringify(s) : s);
/** SKILL.md metnini üretir (YAML ön bilgisi + gövde). Ek alanlar agentskills.io belirtimindeki metadata ve compatibility. */
export function skillMd(y: Pick<Yetenek, "ad" | "aciklama" | "govde"> & Partial<Pick<Yetenek, "surum" | "cagri" | "gerekenBaglantilar" | "kaynak">>): string {
  const meta: string[] = [];
  if (y.surum) meta.push(`  version: "${y.surum}"`);
  if (y.cagri && y.cagri !== "model") meta.push(`  vayra-cagri: ${y.cagri}`);
  if (y.gerekenBaglantilar?.length) meta.push(`  vayra-baglantilar: ${kacis(y.gerekenBaglantilar.join(","))}`);
  const lisans = y.kaynak?.lisans ? `license: ${kacis(y.kaynak.lisans)}\n` : "";
  const uyum = y.gerekenBaglantilar?.length ? `compatibility: ${kacis(`Requires connections: ${y.gerekenBaglantilar.map((x) => x.replace(/^url:/, "")).join(", ")}`.slice(0, 500))}\n` : "";
  return `---\nname: ${y.ad}\ndescription: ${kacis(y.aciklama.replace(/\s+/g, " ").trim())}\n${lisans}${uyum}${meta.length ? `metadata:\n${meta.join("\n")}\n` : ""}---\n\n${y.govde.trim()}\n`;
}
/** SKILL.md çözümler: ön bilgi (name, description, license, metadata) + gövde. Claude Code disable-model-invocation da okunur. */
export function skillMdCoz(metin: string): { ad?: string; aciklama?: string; govde: string; lisans?: string; cagri?: YetenekCagri; baglantilar?: string[] } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(metin.trimStart());
  if (!m) return { govde: metin.trim() };
  const alan = (k: string) => {
    const s = new RegExp(`^\\s*${k}:\\s*(.*)$`, "m").exec(m[1])?.[1]?.trim();
    if (!s) return undefined;
    if (s.startsWith('"')) { try { return JSON.parse(s) as string; } catch { return s.slice(1, -1); } }
    return s.replace(/^'(.*)'$/, "$1");
  };
  const cagri = alan("vayra-cagri");
  const bag = alan("vayra-baglantilar");
  return {
    ad: alan("name"), aciklama: alan("description"), govde: m[2].trim(), lisans: alan("license"),
    cagri: cagri === "elle" || cagri === "her-zaman" ? cagri : alan("disable-model-invocation") === "true" ? "elle" : undefined,
    baglantilar: bag ? bag.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 10) : undefined,
  };
}
