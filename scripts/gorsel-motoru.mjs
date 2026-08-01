/**
 * Vayra Görsel Üretim Motoru — Gemini (Pro + Flash) ile canlı, sinematik görseller.
 * Higgsfield seviyesinde kalite için "zengin reçete" prompt sarmalayıcısı.
 *
 * Kullanım:
 *   node scripts/gorsel-motoru.mjs <is-dosyasi.json>
 * İş dosyası formatı: [{ "cikti": "public/gercek/kesfet/hero-1.webp", "prompt": "...", "kalite": "pro"|"flash", "oran": "3:4"|"16:9"|"1:1"|"9:16" }]
 *
 * Deterministik değil (üretken) ama üretilen dosyalar public'e kalıcı yazılır → tek seferlik maliyet.
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");

const KOK = path.resolve(process.cwd());
const KEY = fs.readFileSync(path.join(KOK, ".env.local"), "utf8").match(/GEMINI_API_KEY=(.+)/)?.[1]?.trim();
if (!KEY) { console.error("GEMINI_API_KEY yok (.env.local)"); process.exit(1); }

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = { pro: "gemini-3-pro-image", flash: "gemini-3.1-flash-image" };

/* Higgsfield-seviye canlılık reçetesi — her prompt bununla sarılır. */
function receteUygula(prompt, oran) {
  const oranMetin = { "3:4": "vertical 3:4 portrait", "9:16": "vertical 9:16", "16:9": "horizontal 16:9 cinematic widescreen", "1:1": "square 1:1", "4:3": "horizontal 4:3" }[oran] || "vertical 3:4";
  return `A hyper-realistic, cinematic, vividly alive image. ${oranMetin} aspect ratio. ${prompt}. Shot with professional cinema camera, rich cinematic color grade, subtle film grain, dramatic yet natural lighting, high dynamic range, deep detail, lifelike texture, premium editorial quality, the image feels alive and full of atmosphere — never flat, never dead, never generic stock.`;
}

async function uret(is) {
  const model = MODEL[is.kalite || "pro"];
  const tamPrompt = receteUygula(is.prompt, is.oran);
  const r = await fetch(`${BASE}/models/${model}:generateContent?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: tamPrompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  if (!r.ok) { const t = await r.text().catch(() => ""); throw new Error(`${r.status}: ${t.slice(0, 160)}`); }
  const d = await r.json();
  const part = d.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error(`görsel yok: ${JSON.stringify(d).slice(0, 160)}`);

  const tam = path.join(KOK, is.cikti);
  fs.mkdirSync(path.dirname(tam), { recursive: true });
  const ham = Buffer.from(part.inlineData.data, "base64");
  // webp'e çevir (kalite 82, boyut küçültme) — sharp ile
  if (is.cikti.endsWith(".webp")) {
    await sharp(ham).webp({ quality: 82 }).toFile(tam);
  } else if (is.cikti.endsWith(".png")) {
    await sharp(ham).png().toFile(tam);
  } else {
    await sharp(ham).jpeg({ quality: 88 }).toFile(tam);
  }
  return tam;
}

async function main() {
  const isDosya = process.argv[2];
  if (!isDosya) { console.error("kullanım: node scripts/gorsel-motoru.mjs <is.json>"); process.exit(1); }
  const isler = JSON.parse(fs.readFileSync(isDosya, "utf8"));
  console.log(`${isler.length} görsel üretilecek...\n`);
  let ok = 0, hata = 0;
  // Eşzamanlı 3'lü havuz (rate limit dostu)
  const havuz = 3;
  for (let i = 0; i < isler.length; i += havuz) {
    const dilim = isler.slice(i, i + havuz);
    await Promise.all(dilim.map(async (is) => {
      // Zaten varsa atla (yeniden üretim maliyetini önle) — --force ile ez
      if (fs.existsSync(path.join(KOK, is.cikti)) && !process.argv.includes("--force")) { console.log(`↷ atla (var): ${is.cikti}`); ok++; return; }
      try { await uret(is); console.log(`✓ ${is.cikti} [${is.kalite || "pro"}]`); ok++; }
      catch (e) { console.log(`✗ ${is.cikti}: ${e.message}`); hata++; }
    }));
  }
  console.log(`\nBitti: ${ok} ok, ${hata} hata`);
}
main();
