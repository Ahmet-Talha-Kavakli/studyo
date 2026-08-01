// presetVeri.ts'ten preset-video manifesti türetir → /private/tmp/gtest/manifest-preset.json
import { readFile, writeFile, mkdir } from "node:fs/promises";
const src = await readFile("src/lib/presetVeri.ts", "utf8");
// blokları kabaca ayıkla: ad / video / veoPrompt
const bloklar = src.split(/\{\s*\n\s*ad:/).slice(1);
const man = [];
for (const b of bloklar) {
  const ad = b.match(/^\s*"([^"]+)"/)?.[1];
  const video = b.match(/video:\s*"([^"]+)"/)?.[1];
  const veo = b.match(/veoPrompt:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
  if (ad && video && veo) man.push({ ad, dosya: video, prompt: veo.replace(/\\"/g, '"') });
}
await mkdir("/private/tmp/gtest", { recursive: true });
await writeFile("/private/tmp/gtest/manifest-preset.json", JSON.stringify(man, null, 2));
console.log(`${man.length} preset video manifeste yazıldı:`);
man.forEach((m, i) => console.log(`  ${i + 1}. ${m.ad} → ${m.dosya}.mp4`));
