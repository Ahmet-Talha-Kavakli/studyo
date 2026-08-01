/** Toplu paralel görsel üretimi — manifest'ten ESZAMANLI adet paralel üretir.
 * Kullanım: GEMINI_KEY=... node scripts/gemini-paralel.mjs <manifest.json> [eszamanli]
 * Var olan dosyaları ATLAR (resume güvenli). */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { uret } from "./gemini-gorsel.mjs";

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
async function uretDene(o, d = 0) {
  try { await uret(o.prompt, o.yol, o.oran); return true; }
  catch (e) {
    if (d < 3) { await bekle(2500 * (d + 1)); return uretDene(o, d + 1); }
    console.error(`✗ ${o.yol} — ${e.message.slice(0, 90)}`); return false;
  }
}

const manifest = JSON.parse(await readFile(process.argv[2], "utf8"));
const ESZ = Number(process.argv[3] || 5);
// Zaten var olanları atla (resume)
const kalan = manifest.filter((o) => !existsSync(o.yol));
console.log(`${manifest.length} toplam, ${manifest.length - kalan.length} zaten var, ${kalan.length} üretilecek (eszamanli ${ESZ})\n`);

let ok = 0, fail = 0, i = 0;
async function worker(id) {
  while (i < kalan.length) {
    const idx = i++;
    const o = kalan[idx];
    const basarili = await uretDene(o);
    basarili ? ok++ : fail++;
    if ((ok + fail) % 10 === 0) console.log(`  … ${ok + fail}/${kalan.length} (ok ${ok}, fail ${fail})`);
  }
}
await Promise.all(Array.from({ length: ESZ }, (_, k) => worker(k)));
console.log(`\n═══ Bitti: ${ok} başarılı, ${fail} başarısız / ${kalan.length} ═══`);
