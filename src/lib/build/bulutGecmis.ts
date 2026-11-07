import "server-only";
import { appendFile, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import type { Kayit, VeriOrtami } from "./veri";
import { projeErisimi } from "./depo";

/**
 * Kayıt geçmişi ve denetim günlüğü.
 *  - Kayıt geçmişi (Netlify Data changes, Cloudflare Data Studio denetimi benzeri): tabloda her ekleme, güncelleme ve
 *    silmede önceki ve sonraki hâl, kimin yaptığıyla. Kayıt ayrıntısında "Geçmiş" ve "Bu hâle dön" bunu kullanır.
 *    Tablo başına NDJSON; 30 gün ya da 2 MB (eski satırlar atılır). .veri/build/veri-gecmis/<proje>[-test]/<tablo>.ndjson
 *  - Denetim günlüğü (Supabase audit log, Vercel Activity benzeri): kural, şema, tablo, kova, kimlik ayarı, zamanlanmış
 *    görev, uyarı kuralı, güvenlik duvarı ve alan adı değişiklikleri. .veri/build/bulut-denetim/<proje>.ndjson (90 gün).
 */
export type Kim = "sahip" | "ekip" | "onizleme" | "ziyaretci" | "fonksiyon" | "ajan" | "sistem" | `uye:${string}`;
/**
 * toplu: tablo bir bütün olarak değişti (boşaltma, toplu içe aktarma, sütun işlemi, yedekten dönüş, Test aktarımı,
 * zamana göre geri dönüş); tabloSil: tablo silindi. İkisinde de değişiklikten hemen önceki tablo anlık görüntü olarak
 * saklanır (anlik: dosya adı); zamana göre geri dönüş bu satıra gelince tabloyu o görüntüye kurar.
 */
export type GecmisSatir = { z: number; kayitId: string; islem: "ekle" | "guncelle" | "sil" | "geriYukle" | "toplu" | "tabloSil"; kim: Kim; onceki?: Record<string, unknown>; sonraki?: Record<string, unknown>; anlik?: string; aciklama?: string; adet?: number };

const KIMLIK = /^[A-Za-z0-9_-]{6,20}$/;
const TABLO = /^[a-zA-Z0-9_-]{1,40}$/;
const gecmisKok = (id: string, ortam: VeriOrtami) => path.join(DEPO_KOK, "build", "veri-gecmis", ortam === "test" ? `${id}-test` : id);
const SINIR_BAYT = 2 * 1024 * 1024;
const kirp = (k?: Kayit | Record<string, unknown>) => (k ? JSON.parse(JSON.stringify(k)) as Record<string, unknown> : undefined);

/** Kayıt değişikliğini yazar (beklemeden; hata yutulur). */
export function gecmisYaz(projeId: string, ortam: VeriOrtami, tablo: string, s: Omit<GecmisSatir, "z">) {
  if (!KIMLIK.test(projeId) || !TABLO.test(tablo)) return;
  const satir: GecmisSatir = { z: Date.now(), ...s, onceki: kirp(s.onceki), sonraki: kirp(s.sonraki) };
  const d = gecmisKok(projeId, ortam), f = path.join(d, `${tablo}.ndjson`);
  mkdir(d, { recursive: true }).then(() => appendFile(f, JSON.stringify(satir) + "\n")).then(async () => {
    const st = await stat(f).catch(() => null);
    if (st && st.size > SINIR_BAYT) {
      const l = (await readFile(f, "utf8")).trim().split("\n");
      const sinir = Date.now() - 30 * 864e5;
      await writeFile(f, l.slice(Math.floor(l.length / 2)).filter((x) => { try { return (JSON.parse(x) as GecmisSatir).z > sinir; } catch { return false; } }).join("\n") + "\n");
    }
  }).catch(() => {});
}

/** Bir kaydın (ya da kayitId verilmezse tablonun) geçmişi, yeniden eskiye. */
export async function gecmisOku(projeId: string, ortam: VeriOrtami, tablo: string, kayitId?: string, sinir = 100): Promise<GecmisSatir[]> {
  if (!KIMLIK.test(projeId) || !TABLO.test(tablo)) return [];
  const t = await readFile(path.join(gecmisKok(projeId, ortam), `${tablo}.ndjson`), "utf8").catch(() => "");
  const o: GecmisSatir[] = [];
  const l = t.trim().split("\n");
  for (let i = l.length - 1; i >= 0 && o.length < sinir; i--) {
    try { const x = JSON.parse(l[i]) as GecmisSatir; if (!kayitId || x.kayitId === kayitId) o.push(x); } catch { /* bozuk satır */ }
  }
  return o;
}
/** Tablo silinince geçmiş dosyası da silinir; yeniden adlandırılınca taşınır. */
export async function gecmisTabloSil(projeId: string, ortam: VeriOrtami, tablo: string) { if (KIMLIK.test(projeId) && TABLO.test(tablo)) { await rm(path.join(gecmisKok(projeId, ortam), `${tablo}.ndjson`), { force: true }); await rm(path.join(gecmisKok(projeId, ortam), `${tablo}.anlik`), { recursive: true, force: true }); } }
export async function gecmisTabloTasi(projeId: string, ortam: VeriOrtami, eski: string, yeni: string) {
  if (!KIMLIK.test(projeId) || !TABLO.test(eski) || !TABLO.test(yeni)) return;
  const k = gecmisKok(projeId, ortam);
  const t = await readFile(path.join(k, `${eski}.ndjson`), "utf8").catch(() => null);
  if (t === null) return;
  await writeFile(path.join(k, `${yeni}.ndjson`), t);
  await rm(path.join(k, `${eski}.ndjson`), { force: true });
  await rename(path.join(k, `${eski}.anlik`), path.join(k, `${yeni}.anlik`)).catch(() => {});
}

/* ───────── Anlık görüntüler (toplu değişiklik öncesi tablo) ───────── */

const anlikKlasoru = (id: string, ortam: VeriOrtami, tablo: string) => path.join(gecmisKok(id, ortam), `${tablo}.anlik`);
const ANLIK_AD = /^\d{13,16}\.json$/;
export type Anlik = { var: boolean; kurallar?: unknown; sema?: unknown; aciklama?: string; kayitlar: Record<string, unknown>[] };
const ANLIK_SINIR = 30 * 1024 * 1024;

/**
 * Toplu değişiklikten hemen önce tablonun hâlini saklar ve geçmişe bir satır yazar. Değişikliği yapan veriDegistir
 * geri çağrısının İÇİNDE, tablo değiştirilmeden önce çağrılmalı (kopya o anda alınır; yazım arkadan gelir).
 * k: tablonun o anki hâli (yoksa undefined: tablo yeni açılıyor demektir).
 */
export function anlikAl(projeId: string, ortam: VeriOrtami, tablo: string, k: { kurallar?: unknown; sema?: unknown; aciklama?: string; kayitlar: Kayit[] } | undefined, islem: "toplu" | "tabloSil", aciklama: string, kim: Kim = "sistem") {
  if (!KIMLIK.test(projeId) || !TABLO.test(tablo)) return;
  const z = Date.now();
  const metin = JSON.stringify({ var: !!k, kurallar: k?.kurallar, sema: k?.sema, aciklama: k?.aciklama, kayitlar: k?.kayitlar ?? [] } satisfies Anlik);
  const buyuk = metin.length > ANLIK_SINIR;
  const d = anlikKlasoru(projeId, ortam, tablo), ad = `${z}.json`;
  const satir: GecmisSatir = { z, kayitId: "*", islem, kim, aciklama: aciklama.slice(0, 200), adet: k?.kayitlar.length ?? 0, ...(buyuk ? {} : { anlik: ad }) };
  const f = path.join(gecmisKok(projeId, ortam), `${tablo}.ndjson`);
  (buyuk ? Promise.resolve() : mkdir(d, { recursive: true }).then(() => writeFile(path.join(d, ad), metin)))
    .then(() => mkdir(path.dirname(f), { recursive: true })).then(() => appendFile(f, JSON.stringify(satir) + "\n"))
    .then(async () => {
      // 30 günden eski ya da 30'dan fazla görüntü silinir.
      const l = (await readdir(d).catch(() => [] as string[])).filter((x) => ANLIK_AD.test(x)).sort();
      const sinir = Date.now() - 30 * 864e5;
      for (const [i, x] of l.entries()) if (i < l.length - 30 || Number(x.slice(0, -5)) < sinir) await rm(path.join(d, x), { force: true });
    }).catch(() => {});
}
export async function anlikOku(projeId: string, ortam: VeriOrtami, tablo: string, ad: string): Promise<Anlik | null> {
  if (!KIMLIK.test(projeId) || !TABLO.test(tablo) || !ANLIK_AD.test(ad)) return null;
  try { return JSON.parse(await readFile(path.join(anlikKlasoru(projeId, ortam, tablo), ad), "utf8")) as Anlik; } catch { return null; }
}
/** Tablonun bütün geçmişi, eskiden yeniye (zamana göre geri dönüş için). */
export async function gecmisTumu(projeId: string, ortam: VeriOrtami, tablo: string): Promise<GecmisSatir[]> {
  if (!KIMLIK.test(projeId) || !TABLO.test(tablo)) return [];
  const t = await readFile(path.join(gecmisKok(projeId, ortam), `${tablo}.ndjson`), "utf8").catch(() => "");
  const o: GecmisSatir[] = [];
  for (const x of t.split("\n")) { if (!x) continue; try { o.push(JSON.parse(x) as GecmisSatir); } catch { /* bozuk */ } }
  return o.sort((a, b) => a.z - b.z);
}
/** Geçmişi olan tablolar (silinmiş olanlar dahil). */
export async function gecmisliTablolar(projeId: string, ortam: VeriOrtami): Promise<string[]> {
  if (!KIMLIK.test(projeId)) return [];
  return (await readdir(gecmisKok(projeId, ortam)).catch(() => [] as string[])).filter((x) => x.endsWith(".ndjson")).map((x) => x.slice(0, -7)).filter((x) => TABLO.test(x)).sort();
}

/* ───────── Denetim günlüğü ───────── */

export type DenetimTur = "veri" | "kural" | "sema" | "tablo" | "dosya" | "kimlik" | "uye" | "zamanli" | "uyari" | "duvar" | "alan" | "ortam" | "yedek" | "ayar";
export type DenetimSatir = { z: number; tur: DenetimTur; mesaj: string; kim: Kim; ortam?: VeriOrtami; ayrinti?: Record<string, unknown> };
const denetimDosyasi = (id: string) => path.join(DEPO_KOK, "build", "bulut-denetim", `${id}.ndjson`);
let sonTemizlik = 0;

/** Denetim satırı yazar (beklemeden). */
export function denetimYaz(projeId: string, s: Omit<DenetimSatir, "z">) {
  if (!KIMLIK.test(projeId)) return;
  const satir: DenetimSatir = { z: Date.now(), ...s, mesaj: s.mesaj.slice(0, 300) };
  mkdir(path.dirname(denetimDosyasi(projeId)), { recursive: true }).then(() => appendFile(denetimDosyasi(projeId), JSON.stringify(satir) + "\n")).catch(() => {});
  if (Date.now() - sonTemizlik > 6 * 3600_000) { sonTemizlik = Date.now(); denetimTemizle().catch(() => {}); }
}
async function denetimTemizle() {
  const d = path.dirname(denetimDosyasi("aaaaaa"));
  const sinir = Date.now() - 90 * 864e5;
  for (const f of await readdir(d).catch(() => [] as string[])) {
    const t = await readFile(path.join(d, f), "utf8").catch(() => "");
    const l = t.trim().split("\n").filter((x) => { try { return (JSON.parse(x) as DenetimSatir).z > sinir; } catch { return false; } });
    if (l.length < t.trim().split("\n").length) await writeFile(path.join(d, f), l.length ? l.join("\n") + "\n" : "");
  }
}
export async function denetimOku(projeId: string, g: { tur?: string; ara?: string; sinir?: number } = {}): Promise<DenetimSatir[]> {
  if (!KIMLIK.test(projeId)) return [];
  const t = await readFile(denetimDosyasi(projeId), "utf8").catch(() => "");
  const ara = g.ara?.toLocaleLowerCase("tr").trim();
  const o: DenetimSatir[] = [];
  const l = t.trim().split("\n");
  for (let i = l.length - 1; i >= 0 && o.length < (g.sinir ?? 500); i--) {
    try { const x = JSON.parse(l[i]) as DenetimSatir; if ((!g.tur || g.tur === "hepsi" || x.tur === g.tur) && (!ara || x.mesaj.toLocaleLowerCase("tr").includes(ara))) o.push(x); } catch { /* bozuk */ }
  }
  return o;
}

/** İstekteki erişim rolünden denetim kimliği. */
export const rolKim = (rol: string | null | undefined): Kim => (rol === "sahip" ? "sahip" : rol ? "ekip" : "sahip");
/** Sahip anahtarından denetim kimliği (proje sahibi ya da ekip üyesi). */
export async function denetimKim(projeId: string, sahip: string | null): Promise<Kim> { return sahip ? rolKim(await projeErisimi(projeId, sahip).catch(() => null)) : "sistem"; }
