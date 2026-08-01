/**
 * Gemini Nano Banana (gemini-2.5-flash-image) ile GERÇEK görsel üretir,
 * sharp ile istenen orana kırpıp .webp olarak public/ altına yazar.
 *
 * Kullanım:
 *   node scripts/gemini-gorsel.mjs '<prompt>' <cikti-yolu> <oran>
 *   oran: "16:9" | "9:16" | "1:1" | "4:5" | "21:9" | "16:10" | "4:3" | "3:4"
 *
 * Örnek:
 *   node scripts/gemini-gorsel.mjs "cinematic sci-fi city" public/gercek/panel/seedance-tv.webp 21:9
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

/* Anahtar sırası: ortam değişkeni → .env.local. Gömülü sabit anahtar
   KALDIRILDI (2026-08-04): süresi dolmuştu ve sırlar kaynak kodda durmamalı. */
import { readFileSync } from "node:fs";
function anahtarBul() {
  if (process.env.GEMINI_KEY) return process.env.GEMINI_KEY;
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const m = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
      .match(/^GEMINI_API_KEY\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}
const KEY = anahtarBul();
if (!KEY) {
  console.error("GEMINI anahtarı yok: GEMINI_API_KEY ortam değişkenini ya da .env.local'i ayarla.");
  process.exit(1);
}
const MODEL = "gemini-2.5-flash-image";

// Nano Banana'nın DESTEKLEDİĞİ native oranlar (model doğrudan bu oranda üretir → upscale YOK).
// Her oran için, modelin verdiği native çözünürlüğü aşmayan güvenli bir hedef en (px) belirtilir.
const ORANLAR = {
  "1:1":  { api: "1:1",  maxW: 1024 },
  "16:9": { api: "16:9", maxW: 1536 },
  "9:16": { api: "9:16", maxW: 864 },
  "4:5":  { api: "4:5",  maxW: 1024 },
  "5:4":  { api: "5:4",  maxW: 1280 },
  "21:9": { api: "21:9", maxW: 1536 },
  "16:10":{ api: "16:9", maxW: 1536 },  // native 16:10 yok → 16:9 üret, hafif kırp
  "4:3":  { api: "4:3",  maxW: 1280 },
  "3:4":  { api: "3:4",  maxW: 1024 },
};

async function uret(prompt, ciktiYolu, oran = "1:1", { kalite = 92 } = {}) {
  const cfg = ORANLAR[oran] || ORANLAR["1:1"];
  const tamPrompt = `${prompt}. Ultra high resolution, sharp focus, crisp fine detail, professional photography, cinematic. No text, no watermark, no logo, no border, edge to edge full bleed.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: tamPrompt }] }],
        // imageConfig.aspectRatio → model native o oranda üretir (kırpma/upscale gereksiz).
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: cfg.api } },
      }),
    },
  );
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
  const b64 = (part?.inlineData || part?.inline_data)?.data;
  if (!b64) throw new Error(`Görsel yok: ${JSON.stringify(data).slice(0, 300)}`);

  const png = Buffer.from(b64, "base64");
  await mkdir(dirname(ciktiYolu), { recursive: true });

  const meta = await sharp(png).metadata();
  // ASLA upscale etme: hedef en, native eni geçemez. Sadece istenen oranı kırp + kaliteli webp.
  const hedefW = Math.min(cfg.maxW, meta.width);
  await sharp(png)
    .resize({ width: hedefW, withoutEnlargement: true })
    .webp({ quality: kalite, effort: 5 })
    .toFile(ciktiYolu);

  const outMeta = await sharp(ciktiYolu).metadata();
  const st = await import("node:fs").then((m) => m.promises.stat(ciktiYolu));
  console.log(`✓ ${ciktiYolu}  native ${meta.width}×${meta.height} → ${outMeta.width}×${outMeta.height}, ${(st.size / 1024).toFixed(0)}KB`);
  return ciktiYolu;
}

// CLI
const [, , prompt, cikti, oran] = process.argv;
if (prompt && cikti) {
  uret(prompt, cikti, oran).catch((e) => { console.error("✗", e.message); process.exit(1); });
}

export { uret };
