/**
 * BytePlus Ark — Seedance ile GERÇEK video üretir (1080p, yatay 16:9).
 * Manifest: [{ ad, dosya, prompt }]
 * Her öğe: create task → poll (succeeded) → indir → public/gercek/hero-video/<dosya>.mp4
 *
 * Kullanım:
 *   node scripts/seedance-video.mjs <manifest.json> [baslangicIndex]
 * Ortam:
 *   BYTEPLUS_API_KEY   (ark-...)          — zorunlu
 *   SEEDANCE_MODEL     (varsayılan aşağıda) — ep-/model id override
 *   SEEDANCE_SURE      (varsayılan 7)
 *   SEEDANCE_ORAN      (varsayılan "16:9")
 *   SEEDANCE_COZ       (varsayılan "1080p")
 *   SEEDANCE_DIR       (varsayılan public/gercek/hero-video)
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const KEY = process.env.BYTEPLUS_API_KEY;
if (!KEY) { console.error("BYTEPLUS_API_KEY yok (.env.local)"); process.exit(1); }

// BytePlus Ark (Asya-Güneydoğu) video generation endpoint'i
const BASE = process.env.SEEDANCE_BASE || "https://ark.ap-southeast.bytepluses.com/api/v3";
// Seedance modeli — hesapta tanımlı model/endpoint id ile override edilebilir
const MODEL = process.env.SEEDANCE_MODEL || "seedance-1-0-pro-250528";
const SURE = parseInt(process.env.SEEDANCE_SURE || "7", 10);
const ORAN = process.env.SEEDANCE_ORAN || "16:9";
const COZ = process.env.SEEDANCE_COZ || "1080p";
const CIKTI_DIR = process.env.SEEDANCE_DIR || "public/gercek/hero-video";
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

/** Prompt'a Seedance text-komutları ekle (süre/oran/çözünürlük). */
function tamPrompt(p) {
  return `${p} --resolution ${COZ} --ratio ${ORAN} --duration ${SURE}`;
}

/** Yerel görseli data-URI'ye çevir (Ark image_url hem http hem data kabul eder). */
async function gorselVeri(yol) {
  const buf = await readFile(yol);
  const uzanti = yol.split(".").pop().toLowerCase();
  const mime = uzanti === "png" ? "image/png" : uzanti === "webp" ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/**
 * Üretimi başlat.
 * `gorsel` verilirse GÖRSELDEN VİDEO (image-to-video): görsel ilk kare olur ve
 * prompt yalnızca hareketi tarif eder — kompozisyon/ürün birebir korunur.
 * Verilmezse eski davranış (metinden video) aynen sürer.
 */
async function baslat(prompt, gorsel) {
  const icerik = [{ type: "text", text: tamPrompt(prompt) }];
  if (gorsel) {
    icerik.push({
      type: "image_url",
      image_url: { url: gorsel.startsWith("http") || gorsel.startsWith("data:") ? gorsel : await gorselVeri(gorsel) },
    });
  }
  const res = await fetch(`${BASE}/contents/generations/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, content: icerik }),
  });
  const gövde = await res.text();
  if (!res.ok) throw new Error(`baslat ${res.status}: ${gövde.slice(0, 300)}`);
  const d = JSON.parse(gövde);
  if (!d.id) throw new Error(`task id yok: ${gövde.slice(0, 200)}`);
  return d.id;
}

async function poll(id) {
  for (let i = 0; i < 60; i++) {
    await bekle(6000);
    const res = await fetch(`${BASE}/contents/generations/tasks/${id}`, {
      headers: { Authorization: `Bearer ${KEY}` },
    });
    if (!res.ok) { console.log(`  … poll ${res.status}`); continue; }
    const d = await res.json();
    const durum = d.status;
    if (durum === "succeeded") {
      const url = d?.content?.video_url;
      if (!url) throw new Error(`succeeded ama video_url yok: ${JSON.stringify(d).slice(0, 200)}`);
      return url;
    }
    if (durum === "failed" || durum === "cancelled") {
      throw new Error(`durum ${durum}: ${JSON.stringify(d.error || d).slice(0, 200)}`);
    }
    process.stdout.write(`  … ${durum} (${(i + 1) * 6}s)\r`);
  }
  throw new Error("zaman aşımı (>360sn)");
}

async function indir(url, hedef) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`indir ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(hedef, buf);
  return buf.length;
}

async function uretDene(oge, deneme = 0) {
  const hedef = `${CIKTI_DIR}/${oge.dosya}.mp4`;
  if (existsSync(hedef)) { console.log(`  ⏭  zaten var: ${oge.dosya}`); return true; }
  try {
    // Manifest'te `gorsel` varsa görselden-videoya geçer.
    const id = await baslat(oge.prompt, oge.gorsel);
    console.log(`  → task: ${id}`);
    const url = await poll(id);
    const boyut = await indir(url, hedef);
    console.log(`\n  ✓ ${oge.ad} → ${oge.dosya}.mp4 (${(boyut / 1024 / 1024).toFixed(1)}MB)`);
    return true;
  } catch (e) {
    if (deneme < 1) { console.log(`\n  ↻ tekrar: ${e.message.slice(0, 120)}`); await bekle(3000); return uretDene(oge, deneme + 1); }
    console.error(`\n  ✗ ${oge.ad}: ${e.message}`);
    return false;
  }
}

const manifest = JSON.parse(await readFile(process.argv[2], "utf8"));
const bas = parseInt(process.argv[3] || "0", 10);
await mkdir(CIKTI_DIR, { recursive: true });
console.log(`Seedance ${MODEL} · ${COZ} · ${ORAN} · ${SURE}sn\n${manifest.length - bas} video üretilecek...\n`);

let ok = 0, fail = 0;
for (let i = bas; i < manifest.length; i++) {
  process.stdout.write(`[${i + 1}/${manifest.length}] ${manifest[i].ad}\n`);
  (await uretDene(manifest[i])) ? ok++ : fail++;
}
console.log(`\n═══ Bitti: ${ok} başarılı, ${fail} başarısız ═══`);
