import "server-only";
import { createHash } from "crypto";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { sahipOzeti } from "./depo";
import { ANTHROPIC_YETENEKLERI } from "./yetenekDizin";
import { YETENEK_KATALOGU } from "./yetenekKatalog";

/**
 * Yetenek dizini güven işaretleri: kurulum sayısı (bütün kullanıcıların yetenek kayıtlarından, katalog ve Anthropic
 * kaynağına göre sayılır; 5 dakika önbellek) ve kullanıcı değerlendirmeleri (1-5 puan, isteğe bağlı yorum; kişi
 * başına tek değerlendirme, yorum sahibi gösterilmez). Hedef: "vayra:<katalog kimliği>" ya da "anthropic:<ad>".
 * Dosyalar: .veri/build/yetenek-degerlendirme/<hedef özeti>.json
 */
type Kayit = { puan: number; yorum?: string; zaman: number };
const KOK = path.join(DEPO_KOK, "build");
const dosya = (hedef: string) => path.join(KOK, "yetenek-degerlendirme", `${createHash("sha256").update(hedef).digest("hex").slice(0, 24)}.json`);
async function oku<T>(f: string): Promise<T | null> { try { return JSON.parse(await readFile(f, "utf8")) as T; } catch { return null; } }

export function hedefGecerli(h: string): boolean {
  const [tur, ad] = h.split(":");
  return tur === "vayra" ? YETENEK_KATALOGU.some((k) => k.id === ad) : tur === "anthropic" ? ANTHROPIC_YETENEKLERI.some((k) => k.ad === ad) : false;
}

let onbellek: { zaman: number; v: Record<string, { kurulum: number; puan: number; oy: number }> } | null = null;
/** Bütün dizin hedeflerinin kurulum sayısı ve puan ortalaması. */
export async function dizinIstatistigi(): Promise<Record<string, { kurulum: number; puan: number; oy: number }>> {
  if (onbellek && Date.now() - onbellek.zaman < 5 * 60_000) return onbellek.v;
  const v: Record<string, { kurulum: number; puan: number; oy: number }> = {};
  const al = (h: string) => (v[h] ??= { kurulum: 0, puan: 0, oy: 0 });
  // Kurulumlar: her sahip bir hedefi bir kez sayılır.
  const gorulen = new Set<string>();
  const klasor = path.join(KOK, "yetenekler");
  const adlar = await readdir(klasor).catch(() => [] as string[]);
  for (const f of adlar.filter((x) => x.endsWith(".json")).slice(0, 20_000)) {
    const y = await oku<{ sahip?: string; katalogId?: string; kaynak?: { tur?: string; ad?: string } }>(path.join(klasor, f));
    if (!y?.sahip) continue;
    const h = y.katalogId ? `vayra:${y.katalogId}` : y.kaynak?.tur === "anthropic" && y.kaynak.ad ? `anthropic:${y.kaynak.ad}` : null;
    if (!h || gorulen.has(`${h}|${y.sahip}`)) continue;
    gorulen.add(`${h}|${y.sahip}`);
    al(h).kurulum++;
  }
  for (const h of [...YETENEK_KATALOGU.map((k) => `vayra:${k.id}`), ...ANTHROPIC_YETENEKLERI.map((k) => `anthropic:${k.ad}`)]) {
    const d = await oku<Record<string, Kayit>>(dosya(h));
    const l = Object.values(d ?? {});
    if (!l.length) continue;
    const x = al(h);
    x.oy = l.length; x.puan = Math.round((l.reduce((t, k) => t + k.puan, 0) / l.length) * 10) / 10;
  }
  onbellek = { zaman: Date.now(), v };
  return v;
}

export async function degerlendirmeler(hedef: string, sahip?: string | null) {
  const d = (await oku<Record<string, Kayit>>(dosya(hedef))) ?? {};
  const benimOz = sahip ? sahipOzeti(sahip) : null;
  const l = Object.entries(d).sort((a, b) => b[1].zaman - a[1].zaman);
  const dagilim = [1, 2, 3, 4, 5].map((p) => l.filter(([, k]) => k.puan === p).length);
  return {
    ortalama: l.length ? Math.round((l.reduce((t, [, k]) => t + k.puan, 0) / l.length) * 10) / 10 : 0, oy: l.length, dagilim,
    yorumlar: l.filter(([, k]) => k.yorum).slice(0, 50).map(([oz, k]) => ({ puan: k.puan, yorum: k.yorum!, zaman: k.zaman, benim: oz === benimOz })),
    benim: benimOz && d[benimOz] ? d[benimOz] : null,
  };
}

export async function degerlendirmeKaydet(hedef: string, sahip: string, k: { puan: number; yorum?: string } | null): Promise<void> {
  const f = dosya(hedef);
  const d = (await oku<Record<string, Kayit>>(f)) ?? {};
  const oz = sahipOzeti(sahip);
  if (k) d[oz] = { puan: k.puan, ...(k.yorum ? { yorum: k.yorum } : {}), zaman: Date.now() }; else delete d[oz];
  await mkdir(path.dirname(f), { recursive: true });
  await writeFile(f, JSON.stringify(d));
  onbellek = null;
}
