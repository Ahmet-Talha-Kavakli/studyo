/**
 * Toplu görsel üretimi — bir manifest dizisinden sırayla üretir.
 * Her öğe: { yol, oran, prompt }
 * Hata olursa 2 kez yeniden dener. İlerlemeyi loglar.
 *
 * Kullanım: node scripts/gemini-toplu.mjs <manifest.json>
 */
import { readFile } from "node:fs/promises";
import { uret } from "./gemini-gorsel.mjs";

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function uretDene(oge, deneme = 0) {
  try {
    await uret(oge.prompt, oge.yol, oge.oran);
    return true;
  } catch (e) {
    if (deneme < 2) {
      console.log(`  ↻ yeniden deneniyor (${deneme + 1})... ${e.message.slice(0, 80)}`);
      await bekle(2000);
      return uretDene(oge, deneme + 1);
    }
    console.error(`  ✗ BAŞARISIZ: ${oge.yol} — ${e.message}`);
    return false;
  }
}

const manifestYolu = process.argv[2];
const manifest = JSON.parse(await readFile(manifestYolu, "utf8"));
console.log(`${manifest.length} görsel üretilecek...\n`);

let ok = 0, fail = 0;
for (let i = 0; i < manifest.length; i++) {
  process.stdout.write(`[${i + 1}/${manifest.length}] `);
  const basarili = await uretDene(manifest[i]);
  basarili ? ok++ : fail++;
  await bekle(800); // rate limit nezaketi
}
console.log(`\n═══ Bitti: ${ok} başarılı, ${fail} başarısız ═══`);
if (fail > 0) process.exit(1);
