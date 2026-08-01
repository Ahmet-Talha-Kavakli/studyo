/**
 * Veo 3.1 Fast ile GERÇEK hareket videosu üretir.
 * Manifest: [{ ad, dosya, prompt }]  (9:16, 6sn)
 * Her öğe: predictLongRunning başlat → done olana kadar poll → indir → public/gercek/video-hareket/<dosya>.mp4
 *
 * Kullanım: node scripts/veo-video.mjs <manifest.json> [baslangicIndex]
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

try { process.loadEnvFile(".env.local"); } catch {}
const KEY = process.env.GEMINI_KEY || process.env.GEMINI_KEY_VEO;
if (!KEY) { console.error("GEMINI_KEY yok (.env.local)"); process.exit(1); }
const MODEL = "veo-3.1-fast-generate-preview";
const CIKTI_DIR = process.env.VEO_DIR || "public/gercek/video-hareket";
const SURE = parseInt(process.env.VEO_SURE || "6", 10);
/* En-boy oranı da env'den: banner gibi YATAY yerleşimler için 16:9 gerekir,
   sabit 9:16 dikey üretiyordu. Varsayılan eski davranışı korur. */
const ORAN = process.env.VEO_ORAN || "9:16";
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function baslat(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predictLongRunning?key=${KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { aspectRatio: ORAN, durationSeconds: SURE },
      }),
    },
  );
  if (!res.ok) throw new Error(`baslat ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const d = await res.json();
  return d.name; // operation adı
}

async function poll(op) {
  for (let i = 0; i < 40; i++) {
    await bekle(10000);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${op}?key=${KEY}`);
    const d = await res.json();
    if (d.done) {
      const uri = d?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      if (!uri) throw new Error(`done ama video yok: ${JSON.stringify(d).slice(0, 200)}`);
      return uri;
    }
  }
  throw new Error("zaman aşımı (>400sn)");
}

async function indir(uri, hedef) {
  const res = await fetch(`${uri}${uri.includes("?") ? "&" : "?"}key=${KEY}`);
  if (!res.ok) throw new Error(`indir ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(hedef, buf);
  return buf.length;
}

async function uretDene(oge, deneme = 0) {
  const hedef = `${CIKTI_DIR}/${oge.dosya}.mp4`;
  if (existsSync(hedef)) { console.log(`  ⏭  zaten var: ${oge.dosya}`); return true; }
  try {
    const op = await baslat(oge.prompt);
    const uri = await poll(op);
    const boyut = await indir(uri, hedef);
    console.log(`  ✓ ${oge.ad} → ${oge.dosya}.mp4 (${(boyut / 1024 / 1024).toFixed(1)}MB)`);
    return true;
  } catch (e) {
    if (deneme < 1) { console.log(`  ↻ tekrar: ${e.message.slice(0, 80)}`); await bekle(3000); return uretDene(oge, deneme + 1); }
    console.error(`  ✗ ${oge.ad}: ${e.message}`);
    return false;
  }
}

const manifest = JSON.parse(await readFile(process.argv[2], "utf8"));
const bas = parseInt(process.argv[3] || "0", 10);
await mkdir(CIKTI_DIR, { recursive: true });
console.log(`${manifest.length - bas} video üretilecek (${bas}. indexten)...\n`);

let ok = 0, fail = 0;
for (let i = bas; i < manifest.length; i++) {
  process.stdout.write(`[${i + 1}/${manifest.length}] ${manifest[i].ad}\n`);
  (await uretDene(manifest[i])) ? ok++ : fail++;
}
console.log(`\n═══ Bitti: ${ok} başarılı, ${fail} başarısız ═══`);
