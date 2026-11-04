import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/**
 * Üretim çıktılarının sunucu deposu. Büyük medya (ses) tarayıcı deposuna data URI olarak
 * yazılmaz — birkaç dakikalık ses localStorage kotasını doldururdu. Dosya burada saklanır,
 * istemciye kısa ve kalıcı bir URL döner (/api/dosya/<klasör>/<ad>).
 */
export const DEPO_KOK = path.join(process.cwd(), ".veri");

const UZANTI: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp",
  "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/x-wav": "wav", "audio/ogg": "ogg",
  "audio/webm": "webm", "audio/opus": "opus", "audio/mp4": "m4a", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov", "image/svg+xml": "svg",
};
export const MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", webp: "image/webp",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", webm: "audio/webm", m4a: "audio/mp4", mp4: "video/mp4", opus: "audio/ogg", mov: "video/quicktime", svg: "image/svg+xml",
};

export type DepoKlasor = "ses" | "video" | "muzik" | "element" | "upscale" | "gorsel";

/** Baytları depoya yazar ve istemcinin oynatabileceği URL'i döndürür. */
export async function dosyaKaydet(klasor: DepoKlasor, bayt: ArrayBuffer | Buffer, mime: string): Promise<string> {
  const uzanti = UZANTI[mime] ?? "bin";
  const ad = `${randomUUID()}.${uzanti}`;
  const dizin = path.join(DEPO_KOK, klasor);
  await mkdir(dizin, { recursive: true });
  await writeFile(path.join(dizin, ad), Buffer.isBuffer(bayt) ? bayt : Buffer.from(bayt));
  return `/api/dosya/${klasor}/${ad}`;
}

/**
 * Sağlayıcı çıktısını kalıcılaştırır: data URI ya da geçici sağlayıcı adresi (ör. 24 saatlik
 * Seedream bağlantısı) indirilip depoya yazılır. Zaten depodaki adres olduğu gibi döner.
 */
export async function ciktiKalicilastir(klasor: DepoKlasor, kaynak: string, varsayilanMime = "image/png"): Promise<string> {
  if (kaynak.startsWith("/api/dosya/")) return kaynak;
  const d = kaynak.match(/^data:([^;]+);base64,(.+)$/);
  if (d) return dosyaKaydet(klasor, Buffer.from(d[2], "base64"), d[1]);
  if (!/^https?:\/\//.test(kaynak)) throw new Error("Çıktı adresi tanınmadı.");
  const r = await fetch(kaynak);
  if (!r.ok) throw new Error(`Çıktı indirilemedi (${r.status})`);
  return dosyaKaydet(klasor, await r.arrayBuffer(), r.headers.get("content-type")?.split(";")[0] || varsayilanMime);
}
