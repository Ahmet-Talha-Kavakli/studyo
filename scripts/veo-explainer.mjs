/**
 * Veo 3.1 Fast ile KURGU-odaklı explainer stil videoları üretir (8sn, 16:9).
 * Manifest: [{ ad, dosya, prompt }]  → public/gercek/explainer-video/<dosya>.mp4
 * Her prompt başı-ortası-sonu olan mini bir olay anlatır (döngüde oynar).
 *
 * Kullanım: node scripts/veo-explainer.mjs <manifest.json>
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

try { process.loadEnvFile(".env.local"); } catch {}
const KEY = process.env.GEMINI_KEY || process.env.GEMINI_KEY_EXPLAINER;
if (!KEY) { console.error("GEMINI_KEY yok (.env.local)"); process.exit(1); }
const MODEL = "veo-3.1-fast-generate-preview";
const CIKTI_DIR = "public/gercek/explainer-video";
const ESZAMANLI = 3;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function baslat(prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predictLongRunning?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instances: [{ prompt }], parameters: { aspectRatio: "16:9", durationSeconds: 8 } }),
  });
  if (!res.ok) throw new Error(`baslat ${res.status}: ${(await res.text()).slice(0, 150)}`);
  return (await res.json()).name;
}
async function poll(op) {
  for (let i = 0; i < 40; i++) {
    await bekle(10000);
    const d = await (await fetch(`https://generativelanguage.googleapis.com/v1beta/${op}?key=${KEY}`)).json();
    if (d.done) {
      const uri = d?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      if (!uri) throw new Error("done ama video yok");
      return uri;
    }
  }
  throw new Error("zaman aşımı");
}
async function indir(uri, hedef) {
  const res = await fetch(`${uri}&key=${KEY}`);
  if (!res.ok) throw new Error(`indir ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(hedef, buf);
  return buf.length;
}
async function uret(oge) {
  const hedef = `${CIKTI_DIR}/${oge.dosya}.mp4`;
  for (let d = 0; d < 2; d++) {
    try {
      const op = await baslat(oge.prompt);
      const uri = await poll(op);
      const boyut = await indir(uri, hedef);
      console.log(`  ✓ ${oge.ad} → ${oge.dosya}.mp4 (${(boyut / 1024 / 1024).toFixed(1)}MB)`);
      return true;
    } catch (e) {
      if (d === 0) { console.log(`  ↻ ${oge.ad}: ${e.message.slice(0, 70)}`); await bekle(4000); continue; }
      console.error(`  ✗ ${oge.ad}: ${e.message}`);
      return false;
    }
  }
}

const manifest = JSON.parse(await readFile(process.argv[2], "utf8"));
await mkdir(CIKTI_DIR, { recursive: true });
console.log(`${manifest.length} explainer videosu (Veo, kurgu-odaklı, ${ESZAMANLI} eşzamanlı)...\n`);
let ok = 0, fail = 0, idx = 0;
async function isci() {
  while (idx < manifest.length) {
    const i = idx++;
    console.log(`[${i + 1}/${manifest.length}] ${manifest[i].ad}`);
    (await uret(manifest[i])) ? ok++ : fail++;
  }
}
await Promise.all(Array.from({ length: ESZAMANLI }, isci));
console.log(`\n═══ Bitti: ${ok} başarılı, ${fail} başarısız ═══`);
