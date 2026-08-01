/**
 * meshy-refine.mjs — preview modelini DOKULU hale getirir (refine).
 *
 * Neden gerekli: text-to-3d "preview" modu sadece geometri üretir — model
 * beyaz kil gibi çıkar. Bekleme ekranında kahraman görsel olacaksa dokusu
 * olmalı (kasktaki cyan visor, metalik kabuk). Refine, preview task id'sini
 * alıp PBR dokulu sürümünü üretir.
 *
 * Kullanım:  node scripts/meshy-refine.mjs <preview-task-id> <ad>
 */
import { writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const KOK = path.resolve(import.meta.dirname, "..");
const CIKTI = path.join(KOK, "public/gercek/3d");
const TEMEL = "https://api.meshy.ai/openapi";

function anahtarOku() {
  if (process.env.MESHY_API_KEY) return process.env.MESHY_API_KEY;
  const dosya = path.join(KOK, ".env.local");
  if (!existsSync(dosya)) return null;
  const m = readFileSync(dosya, "utf8").match(/^MESHY_API_KEY\s*=\s*(.+)$/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

const ANAHTAR = anahtarOku();
if (!ANAHTAR) { console.error("MESHY_API_KEY yok"); process.exit(1); }

const [, , ONCEKI_ID, AD = "model"] = process.argv;
if (!ONCEKI_ID) { console.error("kullanım: node scripts/meshy-refine.mjs <preview-task-id> <ad>"); process.exit(1); }

const bas = { Authorization: `Bearer ${ANAHTAR}`, "Content-Type": "application/json" };
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function indir(url, hedef) {
  const y = await fetch(url);
  if (!y.ok) throw new Error(`indir ${y.status}`);
  await writeFile(hedef, Buffer.from(await y.arrayBuffer()));
  return hedef;
}

await mkdir(CIKTI, { recursive: true });

console.log(`▶ refine — önceki task: ${ONCEKI_ID}`);
const olustur = await fetch(`${TEMEL}/v2/text-to-3d`, {
  method: "POST",
  headers: bas,
  body: JSON.stringify({
    mode: "refine",
    preview_task_id: ONCEKI_ID,
    enable_pbr: true, // metalik/pürüzlülük haritaları — cam ve metal ayrışsın
  }),
});
if (!olustur.ok) {
  console.error(`oluştur ${olustur.status}: ${(await olustur.text()).slice(0, 400)}`);
  process.exit(1);
}
const id = (await olustur.json()).result;
console.log(`  refine task: ${id}`);

for (let i = 0; i < 180; i++) {
  await bekle(5000);
  const y = await fetch(`${TEMEL}/v2/text-to-3d/${id}`, { headers: bas });
  if (!y.ok) continue;
  const d = await y.json();
  if (i % 6 === 0) console.log(`  ${d.status} %${d.progress ?? 0}`);
  if (d.status === "SUCCEEDED") {
    const glb = d.model_urls?.glb;
    if (!glb) { console.error("GLB URL yok"); process.exit(1); }
    const yol = await indir(glb, path.join(CIKTI, `${AD}.glb`));
    console.log(`✓ ${AD}.glb — ${((await stat(yol)).size / 1024 / 1024).toFixed(2)} MB (dokulu)`);
    if (d.thumbnail_url) {
      await indir(d.thumbnail_url, path.join(CIKTI, `${AD}-poster.png`));
      console.log(`✓ ${AD}-poster.png`);
    }
    process.exit(0);
  }
  if (d.status === "FAILED" || d.status === "CANCELED") {
    console.error(`${d.status}: ${JSON.stringify(d.task_error ?? {})}`);
    process.exit(1);
  }
}
console.error("zaman aşımı");
process.exit(1);
