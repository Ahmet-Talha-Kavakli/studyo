import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import type { ZDosya } from "./ziyaretciDepo";

/**
 * Web kutusunda ziyaretçi dosya yüklemesi. Güvenlik:
 *  - Tür hem uzantıyla hem dosyanın ilk baytlarıyla (imza) doğrulanır; uyuşmayan dosya reddedilir. SVG, HTML ve
 *    çalıştırılabilir türler kabul edilmez.
 *  - Boyut sınırı sahibin ayarından (en çok 10 MB); ziyaretçi başına 10 dakikada en çok 10 dosya.
 *  - Dosya diske rastgele 24 karakterlik kimlikle yazılır (adres tahmin edilemez), ad ve tür ayrı tutulur.
 *  - Sunulurken nosniff, sandbox CSP ve görsel dışı türlerde indirme başlığı kullanılır.
 * Yer: .veri/build/ajan-dosya/<ajanId>/<dosyaId>.bin ve .json
 */
export type DosyaTuru = "gorsel" | "pdf" | "belge";
export const DOSYA_TURU_AD: Record<DosyaTuru, string> = { gorsel: "Görsel (PNG, JPEG, WEBP, GIF)", pdf: "PDF", belge: "Belge (TXT, CSV, DOCX, XLSX)" };
const TURLER: { uzanti: string[]; mime: string; grup: DosyaTuru; imza: (b: Buffer) => boolean }[] = [
  { uzanti: ["png"], mime: "image/png", grup: "gorsel", imza: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { uzanti: ["jpg", "jpeg"], mime: "image/jpeg", grup: "gorsel", imza: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { uzanti: ["gif"], mime: "image/gif", grup: "gorsel", imza: (b) => b.subarray(0, 4).toString("latin1") === "GIF8" },
  { uzanti: ["webp"], mime: "image/webp", grup: "gorsel", imza: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
  { uzanti: ["pdf"], mime: "application/pdf", grup: "pdf", imza: (b) => b.subarray(0, 5).toString("latin1") === "%PDF-" },
  { uzanti: ["docx"], mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", grup: "belge", imza: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 3 && b[3] === 4 },
  { uzanti: ["xlsx"], mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", grup: "belge", imza: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 3 && b[3] === 4 },
  { uzanti: ["txt"], mime: "text/plain; charset=utf-8", grup: "belge", imza: (b) => !b.subarray(0, 4096).includes(0) },
  { uzanti: ["csv"], mime: "text/csv; charset=utf-8", grup: "belge", imza: (b) => !b.subarray(0, 4096).includes(0) },
];
export const dosyaKabulListesi = (turler: DosyaTuru[]) => TURLER.filter((t) => turler.includes(t.grup)).flatMap((t) => t.uzanti.map((u) => `.${u}`)).join(",");

const KOK = path.join(DEPO_KOK, "build", "ajan-dosya");
const KIMLIK = /^[A-Za-z0-9_-]{24}$/;
type Kayit = ZDosya & { konusma: string; zaman: number; mimeGercek: string };
const yol = (ajanId: string, id: string, u: "bin" | "json") => path.join(KOK, ajanId.replace(/[^A-Za-z0-9_-]/g, ""), `${id}.${u}`);

export async function dosyaKaydet(g: { ajanId: string; konusma: string; ad: string; veri: Buffer; turler: DosyaTuru[]; enCokMb: number }): Promise<{ dosya?: ZDosya; hata?: string }> {
  const ad = g.ad.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim().slice(0, 120) || "dosya";
  const uz = ad.split(".").pop()?.toLowerCase() ?? "";
  const t = TURLER.find((x) => x.uzanti.includes(uz) && g.turler.includes(x.grup));
  if (!t) return { hata: `Bu dosya türü kabul edilmiyor. İzinli: ${g.turler.map((x) => DOSYA_TURU_AD[x]).join(", ")}.` };
  const sinir = Math.min(10, Math.max(1, g.enCokMb)) * 1024 * 1024;
  if (!g.veri.length) return { hata: "Dosya boş." };
  if (g.veri.length > sinir) return { hata: `Dosya çok büyük; en çok ${Math.round(sinir / 1048576)} MB.` };
  if (!t.imza(g.veri)) return { hata: "Dosyanın içeriği uzantısıyla uyuşmuyor; yükleme reddedildi." };
  const id = randomBytes(18).toString("base64url").slice(0, 24);
  const dosya: ZDosya = { id, ad, tur: t.mime.split(";")[0], boyut: g.veri.length, url: `/api/build/genel/ajan/${g.ajanId}/dosya?d=${id}` };
  await mkdir(path.dirname(yol(g.ajanId, id, "bin")), { recursive: true });
  await writeFile(yol(g.ajanId, id, "bin"), g.veri);
  await writeFile(yol(g.ajanId, id, "json"), JSON.stringify({ ...dosya, konusma: g.konusma, zaman: Date.now(), mimeGercek: t.mime } satisfies Kayit));
  return { dosya };
}

export async function dosyaKaydi(ajanId: string, id: string): Promise<Kayit | null> {
  if (!KIMLIK.test(id)) return null;
  try { return JSON.parse(await readFile(yol(ajanId, id, "json"), "utf8")) as Kayit; } catch { return null; }
}
export async function dosyaVerisi(ajanId: string, id: string): Promise<{ k: Kayit; veri: Buffer } | null> {
  const k = await dosyaKaydi(ajanId, id);
  if (!k) return null;
  try { return { k, veri: await readFile(yol(ajanId, id, "bin")) }; } catch { return null; }
}
/** Mesaja eklenecek dosyalar: yalnız bu konuşmaya yüklenmiş olanlar (en çok 5). */
export async function konusmaDosyalari(ajanId: string, konusma: string, idler: unknown): Promise<ZDosya[]> {
  const o: ZDosya[] = [];
  for (const id of (Array.isArray(idler) ? idler : []).slice(0, 5)) {
    const k = await dosyaKaydi(ajanId, String(id));
    if (k && k.konusma === konusma) o.push({ id: k.id, ad: k.ad, tur: k.tur, boyut: k.boyut, url: k.url });
  }
  return o;
}
