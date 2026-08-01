/**
 * "Her projenin içini keşfet" (Sinema Stüdyosu) 8 kart görselini üretir.
 *
 * Konular src/lib/kesfetVeri.ts → PROJE_KESFET ile BİREBİR aynıdır; oradaki
 * `prompt` alanı görselin gerçek üretim istemidir. Kart oranı 16:10.
 *
 * Kullanım — çalışan bir anahtarla:
 *   GEMINI_API_KEY=... node scripts/kesfet-gorselleri.mjs
 *   # ya da Seedream ile:
 *   BYTEPLUS_API_KEY=... node scripts/kesfet-gorselleri.mjs --seedream
 *
 * NOT (2026-08-04): mevcut iki anahtar da kullanılamıyor — Gemini anahtarı
 * "leaked" olarak iptal edilmiş (403), BytePlus hesabı borçlu (AccountOverdue).
 * Yeni anahtar girilince bu betik tek komutla 8 görseli yeniler.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const calistir = promisify(execFile);

const SEEDREAM = process.argv.includes("--seedream");
const BETIK = SEEDREAM ? "scripts/seedream-gorsel.mjs" : "scripts/gemini-gorsel.mjs";

/* Sekiz AYRI tür — eskiden 8'i de moda editoryaldi, vitrin tek tip
   görünüyordu (kullanıcı isteği: "bambaşka şekilde yeniden üret"). */
const ISLER = [
  ["kesfet-01", "vast brutalist concrete cathedral interior, single shaft of god-ray light through a high oculus, dust motes, monumental scale, architectural photography, cool grey and pale gold"],
  ["kesfet-02", "aerial drone view of a turquoise glacial river braiding through black volcanic sand in Iceland, abstract natural patterns, top-down, crisp aerial photography"],
  ["kesfet-03", "macro product shot of a mechanical wristwatch movement, exposed gears and ruby jewels, dramatic rim lighting on dark reflective surface, luxury advertising photography"],
  ["kesfet-04", "rain-soaked Tokyo alley at night, steam rising from a ramen stall, red paper lanterns, reflections on wet asphalt, moody street photography"],
  ["kesfet-05", "colossal derelict spaceship hull drifting above a ringed gas giant, cold starlight, hard sci-fi concept art, immense sense of scale"],
  ["kesfet-06", "overhead flat lay of a rustic Mediterranean feast, grilled fish, olives, lemon, fresh herbs on weathered wood, warm natural window light, food editorial"],
  ["kesfet-07", "lone climber silhouetted on a knife-edge granite ridge at sunrise, sea of clouds below, epic adventure sports photography, tiny figure vast landscape"],
  ["kesfet-08", "swirling liquid ink in water, deep indigo and molten copper pigments colliding, high-speed macro capture, abstract fluid art on black"],
];

let basarili = 0;
for (const [ad, istem] of ISLER) {
  const yol = `public/gercek/proje-kesfet/${ad}.webp`;
  process.stdout.write(`${ad} … `);
  try {
    await calistir("node", [BETIK, istem, yol, "16:10"], { cwd: process.cwd(), maxBuffer: 1 << 26 });
    console.log("✓");
    basarili += 1;
  } catch (e) {
    console.log("✗", String(e.stdout || e.stderr || e.message).trim().slice(0, 200));
  }
}
console.log(`\n${basarili}/${ISLER.length} görsel üretildi.`);
if (basarili < ISLER.length) process.exitCode = 1;
