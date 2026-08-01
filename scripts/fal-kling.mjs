/**
 * fal.ai Kling v2 master ile GERÇEK dikey (9:16, 720x1280) video üretir.
 * Manifest: [{ ad, dosya, prompt }]  — 5sn, 9:16
 * Her öğe: queue POST → status poll → indir → public/gercek/preset-video/<dosya>.mp4
 *
 * fal Kling async — birden çok istek AYNI ANDA queue'ya girebilir (paralel).
 * Bu script aynı anda `ESZAMANLI` kadar isteği başlatıp toplu bekler (hızlı).
 *
 * Kullanım: node scripts/fal-kling.mjs <manifest.json>
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

try { process.loadEnvFile(".env.local"); } catch {}
const KEY = process.env.FAL_KEY;
if (!KEY) { console.error("FAL_KEY yok (.env.local)"); process.exit(1); }
const ENDPOINT = "fal-ai/kling-video/v2/master/text-to-video";
// Ortam değişkenleriyle esnek: klasör, süre, oran (varsayılan = presetler 5sn 9:16).
const CIKTI_DIR = process.env.KLING_DIR || "public/gercek/preset-video";
const SURE = process.env.KLING_SURE || "5";
const ORAN = process.env.KLING_ORAN || "9:16";
const ESZAMANLI = parseInt(process.env.KLING_ESZAMANLI || "4", 10); // aynı anda kaç video
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function baslat(prompt) {
  const res = await fetch(`https://queue.fal.run/${ENDPOINT}`, {
    method: "POST",
    headers: { "Authorization": `Key ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, duration: SURE, aspect_ratio: ORAN }),
  });
  if (!res.ok) throw new Error(`baslat ${res.status}: ${(await res.text()).slice(0, 150)}`);
  const d = await res.json();
  return d.request_id;
}

async function pollBitir(reqId) {
  const base = `https://queue.fal.run/fal-ai/kling-video/requests/${reqId}`;
  for (let i = 0; i < 40; i++) {
    await bekle(10000);
    const s = await (await fetch(`${base}/status`, { headers: { "Authorization": `Key ${KEY}` } })).json();
    if (s.status === "COMPLETED") {
      const d = await (await fetch(base, { headers: { "Authorization": `Key ${KEY}` } })).json();
      const url = d?.video?.url;
      if (!url) throw new Error("completed ama url yok");
      return url;
    }
    if (s.status === "FAILED" || s.status === "ERROR") throw new Error(`fal ${s.status}`);
  }
  throw new Error("zaman aşımı");
}

async function indir(url, hedef) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`indir ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(hedef, buf);
  return buf.length;
}

async function uret(oge) {
  const hedef = `${CIKTI_DIR}/${oge.dosya}.mp4`;
  if (existsSync(hedef)) { console.log(`  ⏭  zaten var: ${oge.dosya}`); return true; }
  for (let deneme = 0; deneme < 2; deneme++) {
    try {
      const reqId = await baslat(oge.prompt);
      const url = await pollBitir(reqId);
      const boyut = await indir(url, hedef);
      console.log(`  ✓ ${oge.ad} → ${oge.dosya}.mp4 (${(boyut / 1024 / 1024).toFixed(1)}MB)`);
      return true;
    } catch (e) {
      if (deneme === 0) { console.log(`  ↻ ${oge.ad}: ${e.message.slice(0, 70)}`); await bekle(4000); continue; }
      console.error(`  ✗ ${oge.ad}: ${e.message}`);
      return false;
    }
  }
}

const manifest = JSON.parse(await readFile(process.argv[2], "utf8"));
await mkdir(CIKTI_DIR, { recursive: true });
console.log(`${manifest.length} preset videosu (fal Kling, ${ESZAMANLI} eşzamanlı)...\n`);

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
