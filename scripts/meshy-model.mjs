/**
 * meshy-model.mjs — "Yakında" ekranında dönecek GERÇEK 3D modeli üretir.
 *
 * Neden: /panel/3d bir 3D stüdyosunun bekleme ekranı ama içinde tek bir 3D
 * nesne yoktu (sadece lucide kutu ikonu). Kendi motorumuzla ürettiğimiz gerçek
 * bir GLB koyarsak ekran hem yeni nesil görünür hem de ürünün ne yapabildiğini
 * KANITLAR.
 *
 * Akış: text-to-3d preview → (başarılıysa) refine → GLB indir → public/gercek/3d/
 * Kullanım:  node scripts/meshy-model.mjs
 */
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const KOK = path.resolve(import.meta.dirname, "..");
const CIKTI = path.join(KOK, "public/gercek/3d");
const TEMEL = "https://api.meshy.ai/openapi";

// .env.local'i elle oku (script Next dışında çalışıyor).
function anahtarOku() {
  if (process.env.MESHY_API_KEY) return process.env.MESHY_API_KEY;
  const dosya = path.join(KOK, ".env.local");
  if (!existsSync(dosya)) return null;
  const m = readFileSync(dosya, "utf8").match(/^MESHY_API_KEY\s*=\s*(.+)$/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

const ANAHTAR = anahtarOku();
if (!ANAHTAR) {
  console.error("MESHY_API_KEY bulunamadı (.env.local).");
  process.exit(1);
}

const bas = { Authorization: `Bearer ${ANAHTAR}`, "Content-Type": "application/json" };
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

/* Üretilecek modeller. Bekleme ekranında TEK model döner (ana kahraman);
   diğerleri yedek — biri başarısız olursa elde başka model kalsın. */
const ISLER = [
  {
    ad: "kask",
    prompt:
      "A futuristic sci-fi astronaut helmet, glossy dark metal shell with " +
      "glowing cyan visor, clean hard-surface design, studio product render, " +
      "highly detailed, symmetrical, centered",
  },
  {
    ad: "robot",
    prompt:
      "A small friendly robot character, rounded white ceramic body with " +
      "cyan glowing eyes and joints, clean minimal hard-surface design, " +
      "standing pose, studio render, highly detailed",
  },
];

async function taskOlustur(prompt) {
  const y = await fetch(`${TEMEL}/v2/text-to-3d`, {
    method: "POST",
    headers: bas,
    body: JSON.stringify({
      mode: "preview",
      prompt: prompt.slice(0, 600),
      art_style: "realistic",
      should_remesh: true,
      // Bekleme ekranında döneceği için düşük poligon yeterli ve hızlı yüklenir.
      target_polycount: 30000,
    }),
  });
  if (!y.ok) throw new Error(`oluştur ${y.status}: ${(await y.text()).slice(0, 300)}`);
  return (await y.json()).result;
}

async function taskBekle(id, etiket) {
  // 3D üretimi uzun sürer: 5sn aralıkla ~15 dakika tavan.
  for (let i = 0; i < 180; i++) {
    await bekle(5000);
    const y = await fetch(`${TEMEL}/v2/text-to-3d/${id}`, { headers: bas });
    if (!y.ok) continue;
    const d = await y.json();
    if (i % 6 === 0) console.log(`  [${etiket}] ${d.status} %${d.progress ?? 0}`);
    if (d.status === "SUCCEEDED") return d;
    if (d.status === "FAILED" || d.status === "CANCELED") {
      throw new Error(`${etiket} ${d.status}: ${JSON.stringify(d.task_error ?? {})}`);
    }
  }
  throw new Error(`${etiket} zaman aşımı`);
}

async function indir(url, hedef) {
  const y = await fetch(url);
  if (!y.ok) throw new Error(`indir ${y.status}`);
  await writeFile(hedef, Buffer.from(await y.arrayBuffer()));
  return hedef;
}

await mkdir(CIKTI, { recursive: true });

for (const is of ISLER) {
  try {
    console.log(`▶ ${is.ad} — task açılıyor…`);
    const id = await taskOlustur(is.prompt);
    console.log(`  task: ${id}`);
    const d = await taskBekle(id, is.ad);

    const glb = d.model_urls?.glb;
    if (!glb) throw new Error("GLB URL yok");
    const yol = await indir(glb, path.join(CIKTI, `${is.ad}.glb`));
    const { size } = await import("node:fs").then((m) => m.promises.stat(yol));
    console.log(`✓ ${is.ad}.glb — ${(size / 1024 / 1024).toFixed(2)} MB`);

    // Poster: model-viewer yüklenene kadar gösterilecek hazır render.
    if (d.thumbnail_url) {
      await indir(d.thumbnail_url, path.join(CIKTI, `${is.ad}-poster.png`));
      console.log(`✓ ${is.ad}-poster.png`);
    }
  } catch (e) {
    console.error(`✗ ${is.ad}: ${e.message}`);
  }
}

console.log("bitti.");
