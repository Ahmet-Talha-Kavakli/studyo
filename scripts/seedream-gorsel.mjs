/**
 * BytePlus Ark — Seedream ile GERÇEK görsel üretir, sharp ile webp'ye çevirir.
 *
 * Kullanım:
 *   node scripts/seedream-gorsel.mjs '<prompt>' <cikti.webp> [oran]
 *   oran: "16:9" | "1:1" | "9:16" | "4:3" | "3:4"  (varsayılan 16:9)
 * Ortam:
 *   BYTEPLUS_API_KEY (zorunlu) · SEEDREAM_MODEL (varsayılan seedream-5-0-260128)
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

const KEY = process.env.BYTEPLUS_API_KEY;
if (!KEY) { console.error("BYTEPLUS_API_KEY yok"); process.exit(1); }
const BASE = process.env.SEEDREAM_BASE || "https://ark.ap-southeast.bytepluses.com/api/v3";
const MODEL = process.env.SEEDREAM_MODEL || "seedream-5-0-260128";

// oran → Seedream boyutu. Seedream 5.0 min ~3.7MP ister → 2K seviyesi kullanılır.
const BOYUT = {
  "16:9": "2560x1440", "1:1": "2048x2048", "9:16": "1440x2560",
  "4:3": "2304x1728", "3:4": "1728x2304", "16:10": "2560x1600",
};

export async function uret(prompt, ciktiYolu, oran = "16:9", { kalite = 92 } = {}) {
  const size = BOYUT[oran] || BOYUT["16:9"];
  const tamPrompt = `${prompt}. Ultra high resolution, sharp focus, crisp detail, professional photography, cinematic. No text, no watermark, no logo.`;
  const res = await fetch(`${BASE}/images/generations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, prompt: tamPrompt, size, response_format: "url", watermark: false }),
  });
  const govde = await res.text();
  if (!res.ok) throw new Error(`API ${res.status}: ${govde.slice(0, 300)}`);
  const data = JSON.parse(govde);
  const item = data?.data?.[0];
  let png;
  if (item?.b64_json) png = Buffer.from(item.b64_json, "base64");
  else if (item?.url) png = Buffer.from(await (await fetch(item.url)).arrayBuffer());
  else throw new Error(`görsel yok: ${govde.slice(0, 200)}`);

  await mkdir(dirname(ciktiYolu), { recursive: true });
  const meta = await sharp(png).metadata();
  // web için makul en (kart görselleri) — kaliteyi koru, dosyayı küçült (asla upscale yok)
  const hedefW = Math.min(1600, meta.width);
  await sharp(png).resize({ width: hedefW, withoutEnlargement: true }).webp({ quality: kalite, effort: 5 }).toFile(ciktiYolu);
  const outMeta = await sharp(ciktiYolu).metadata();
  const st = await import("node:fs").then((m) => m.promises.stat(ciktiYolu));
  console.log(`✓ ${ciktiYolu}  ${meta.width}×${meta.height} → ${outMeta.width}×${outMeta.height}, ${(st.size / 1024).toFixed(0)}KB`);
  return ciktiYolu;
}

const [, , prompt, cikti, oran] = process.argv;
if (prompt && cikti) uret(prompt, cikti, oran).catch((e) => { console.error("✗", e.message); process.exit(1); });
