import "server-only";
import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { bosVeri, type BuyumeVeri } from "./buyumeTipler";

/**
 * Büyüme verisi deposu: .veri/build/buyume/<projeId>.json (plan, gönderiler, reklam metinleri, blog, lansman işaretleri).
 * Proje dosyasından ayrıdır; aynı projeye eşzamanlı yazımlar (görsel üretimi bitince gönderiye yazma ile elle düzenleme)
 * proje başına sıraya alınır, dosya geçici adla yazılıp yeniden adlandırılır.
 */
const KOK = path.join(DEPO_KOK, "build", "buyume");
const KIMLIK = /^[A-Za-z0-9_-]{12}$/;
const dosya = (id: string) => path.join(KOK, `${id}.json`);
const G = globalThis as unknown as { __vayraBuyumeKilit?: Map<string, Promise<unknown>>; __vayraBuyumeSuren?: Map<string, Map<string, number>> };
const kilit = (G.__vayraBuyumeKilit ??= new Map());

export async function buyumeOku(id: string): Promise<BuyumeVeri> {
  if (!KIMLIK.test(id)) return bosVeri();
  try { return { ...bosVeri(), ...(JSON.parse(await readFile(dosya(id), "utf8")) as Partial<BuyumeVeri>) }; } catch { return bosVeri(); }
}

/** Oku, değiştir, yaz (proje başına sıralı). Değiştirici hata atarsa dosyaya dokunulmaz. */
export function buyumeGuncelle(id: string, f: (v: BuyumeVeri) => void | Promise<void>): Promise<BuyumeVeri> {
  if (!KIMLIK.test(id)) return Promise.reject(new Error("Geçersiz proje."));
  const onceki = kilit.get(id) ?? Promise.resolve();
  const is = onceki.then(async () => {
    const v = await buyumeOku(id);
    await f(v);
    v.guncelleme = Date.now();
    const ham = JSON.stringify(v);
    if (ham.length > 3_000_000) throw new Error("Büyüme verisi çok büyüdü; eski gönderileri ya da yazıları sil.");
    await mkdir(KOK, { recursive: true });
    const gecici = `${dosya(id)}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(gecici, ham);
    // Windows'ta okuyan biri dosyayı tutuyorsa yeniden adlandırma reddedilebilir: doğrudan yaz.
    try { await rename(gecici, dosya(id)); } catch { await writeFile(dosya(id), ham); await rm(gecici, { force: true }); }
    return v;
  });
  kilit.set(id, is.catch(() => {}));
  return is;
}

/* ── Süren üretimler (bellekte): sekme kapanıp açılınca arayüz bekleyeni gösterir ve yoklar. ── */
if (!(G.__vayraBuyumeSuren instanceof Map)) G.__vayraBuyumeSuren = new Map();
const suren = G.__vayraBuyumeSuren;
export function surenler(id: string): string[] {
  const m = suren.get(id);
  if (!m) return [];
  for (const [k, z] of m) if (Date.now() - z > 5 * 60_000) m.delete(k);
  return [...m.keys()];
}
/** Aynı iş zaten sürüyorsa false. */
export function isBasla(id: string, is: string): boolean {
  const m = suren.get(id) ?? new Map<string, number>();
  suren.set(id, m);
  if (m.has(is) && Date.now() - m.get(is)! < 5 * 60_000) return false;
  m.set(is, Date.now());
  return true;
}
export function isBitir(id: string, is: string) { suren.get(id)?.delete(is); }
