import { randomBytes, timingSafeEqual } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Usta sohbet paylaşımı (/s/<id>) — sohbetin o anki salt okunur kopyası sunucuda saklanır
 * (.veri/sc-paylasim/<id>.json). Bağlantıyı yalnız oluşturan kişi (gizli anahtarla) günceller ya da kaldırır.
 * Sonradan yazılan mesajlar kopyaya girmez; yeniden paylaşınca güncellenir.
 */
export type ScPaylasimMesaj = {
  rol: "kullanici" | "asistan";
  metin: string;
  alinti?: string;
  /** Model bağlı değilken üretilmiş örnek yanıt. */
  demo?: boolean;
  kaynaklar?: { url: string; baslik: string }[];
  ciktilar?: { tur: string; ad: string; url?: string; html?: string }[];
};
export type ScPaylasim = { id: string; baslik: string; mesajlar: ScPaylasimMesaj[]; olusturma: number; guncelleme: number };

const DIZIN = path.join(DEPO_KOK, "sc-paylasim");
const KIMLIK = /^[A-Za-z0-9_-]{12}$/;
const SINIR = 3_000_000;

/** İstemciden gelen kopyayı temizler: yalnız bilinen alanlar, boyut sınırları, güvenli bağlantılar. */
function temizle(g: { baslik?: unknown; mesajlar?: unknown }): Pick<ScPaylasim, "baslik" | "mesajlar"> {
  const mesajlar = (Array.isArray(g.mesajlar) ? g.mesajlar : []).slice(0, 400).map((m: Record<string, unknown>): ScPaylasimMesaj => ({
    rol: m.rol === "kullanici" ? "kullanici" : "asistan",
    metin: String(m.metin ?? "").slice(0, 60000),
    ...(typeof m.alinti === "string" && m.alinti ? { alinti: m.alinti.slice(0, 1500) } : {}),
    ...(m.demo === true ? { demo: true } : {}),
    ...(Array.isArray(m.kaynaklar) ? { kaynaklar: m.kaynaklar.slice(0, 40).filter((k) => /^https?:\/\//.test(String(k?.url))).map((k) => ({ url: String(k.url).slice(0, 600), baslik: String(k.baslik ?? k.url).slice(0, 200) })) } : {}),
    ...(Array.isArray(m.ciktilar) ? { ciktilar: m.ciktilar.slice(0, 6).map((c) => ({
      tur: String(c?.tur ?? "site").slice(0, 20), ad: String(c?.ad ?? "").slice(0, 120),
      ...(typeof c?.url === "string" && /^(https?:\/\/|\/)/.test(c.url) ? { url: c.url.slice(0, 600) } : {}),
      ...(typeof c?.html === "string" ? { html: c.html.slice(0, 400000) } : {}),
    })) } : {}),
  })).filter((m) => m.metin.trim() || m.ciktilar?.length);
  return { baslik: String(g.baslik ?? "Sohbet").slice(0, 120) || "Sohbet", mesajlar };
}

const esit = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Yeni paylaşım ya da (id + anahtar ile) var olanı güncelleme. */
export async function scPaylas(g: { baslik?: unknown; mesajlar?: unknown; id?: string; anahtar?: string }) {
  const veri = temizle(g);
  if (!veri.mesajlar.length) throw new Error("Paylaşılacak mesaj yok.");
  await mkdir(DIZIN, { recursive: true });
  let id = randomBytes(9).toString("base64url"), anahtar = randomBytes(18).toString("base64url"), olusturma = Date.now();
  if (g.id && g.anahtar && KIMLIK.test(g.id)) {
    const eski = await hamOku(g.id);
    if (eski && esit(eski.anahtar, g.anahtar)) { id = g.id; anahtar = g.anahtar; olusturma = eski.kayit.olusturma; }
  }
  const kayit: ScPaylasim = { id, ...veri, olusturma, guncelleme: Date.now() };
  const json = JSON.stringify({ kayit, anahtar });
  if (json.length > SINIR) throw new Error("Sohbet paylaşmak için çok büyük.");
  await writeFile(path.join(DIZIN, `${id}.json`), json);
  return { id, anahtar };
}

async function hamOku(id: string): Promise<{ kayit: ScPaylasim; anahtar: string } | null> {
  if (!KIMLIK.test(id)) return null;
  try { return JSON.parse(await readFile(path.join(DIZIN, `${id}.json`), "utf8")); } catch { return null; }
}

export async function scPaylasimOku(id: string) { return (await hamOku(id))?.kayit ?? null; }

export async function scPaylasimKaldir(id: string, anahtar: string) {
  const eski = await hamOku(id);
  if (!eski || !esit(eski.anahtar, anahtar)) return false;
  await rm(path.join(DIZIN, `${id}.json`), { force: true });
  return true;
}
