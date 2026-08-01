/**
 * meshy-asamali.mjs — 3D yakında ekranının AŞAMA AŞAMA demosu için varlık üretir.
 *
 * Kullanıcı isteği (2026-07-31): bekleme ekranı şu an tek bir bitmiş modeli
 * gösteriyor. Bunun yerine ÜÇ farklı model olacak ve her biri için sürecin
 * aşamaları görünecek: istem → (geometri) → dokulama → sonuç.
 *
 * Bu yüzden her model için İKİ GLB gerekiyor:
 *   • <ad>-ham.glb    → mode:"preview"  (yalnız geometri, beyaz kil)
 *   • <ad>.glb        → mode:"refine"   (PBR dokulu, nihai)
 * İkisi de gerçek çıktı; ekrandaki "aşama" anlatısı böylece sahte olmuyor.
 *
 * Kullanım:  node scripts/meshy-asamali.mjs [sadece-ad]
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

const bas = { Authorization: `Bearer ${ANAHTAR}`, "Content-Type": "application/json" };
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

/* Üç model — ekrandaki üç farklı yeteneği temsil eder:
   kask = hard-surface ürün · savasci = karakter · lamba = ev/ürün objesi */
const ISLER = [
  {
    ad: "kask",
    baslik: "Fütüristik astronot kaskı",
    istem: "A futuristic astronaut helmet, glossy white ceramic shell with " +
      "cyan glowing visor, sleek hard-surface design, studio product render, highly detailed",
  },
  {
    ad: "savasci",
    baslik: "Zırhlı savaşçı figürü",
    istem: "A stylized armored warrior character figurine, ornate silver plate armor " +
      "with deep blue cloth accents, heroic standing pose, game-ready character, highly detailed",
  },
  {
    ad: "lamba",
    baslik: "Retro masa lambası",
    istem: "A retro mid-century desk lamp, brushed brass articulated arm with " +
      "matte teal enamel shade, marble base, clean studio product render, highly detailed",
  },
];

const yalniz = process.argv[2];
const secili = yalniz ? ISLER.filter((i) => i.ad === yalniz) : ISLER;

async function istek(govde) {
  const y = await fetch(`${TEMEL}/v2/text-to-3d`, { method: "POST", headers: bas, body: JSON.stringify(govde) });
  if (!y.ok) throw new Error(`oluştur ${y.status}: ${(await y.text()).slice(0, 300)}`);
  return (await y.json()).result;
}

async function taskBekle(id, etiket) {
  for (let i = 0; i < 240; i++) {
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
const ozet = [];

for (const is of secili) {
  try {
    /* 1) ÖNİZLEME — yalnız geometri (dokusuz). Ekranda "modelleniyor" aşaması. */
    console.log(`▶ ${is.ad} — 1/2 geometri (preview)…`);
    const onId = await istek({
      mode: "preview", prompt: is.istem.slice(0, 600),
      art_style: "realistic", should_remesh: true, target_polycount: 30000,
    });
    const on = await taskBekle(onId, `${is.ad}:geometri`);
    if (on.model_urls?.glb) {
      const y = await indir(on.model_urls.glb, path.join(CIKTI, `${is.ad}-ham.glb`));
      const { size } = await stat(y);
      console.log(`✓ ${is.ad}-ham.glb — ${(size / 1048576).toFixed(2)} MB`);
    }
    if (on.thumbnail_url) await indir(on.thumbnail_url, path.join(CIKTI, `${is.ad}-ham-poster.png`));

    /* 2) DOKULAMA — refine + PBR. Ekranda "dokulanıyor" → "hazır" aşaması. */
    console.log(`▶ ${is.ad} — 2/2 dokulama (refine)…`);
    const refId = await istek({ mode: "refine", preview_task_id: onId, enable_pbr: true });
    const ref = await taskBekle(refId, `${is.ad}:doku`);
    if (!ref.model_urls?.glb) throw new Error("refine GLB yok");
    const yol = await indir(ref.model_urls.glb, path.join(CIKTI, `${is.ad}.glb`));
    const { size } = await stat(yol);
    console.log(`✓ ${is.ad}.glb — ${(size / 1048576).toFixed(2)} MB`);
    if (ref.thumbnail_url) await indir(ref.thumbnail_url, path.join(CIKTI, `${is.ad}-poster.png`));

    ozet.push({ ad: is.ad, tamam: true });
  } catch (e) {
    console.error(`✗ ${is.ad}: ${e.message}`);
    ozet.push({ ad: is.ad, tamam: false, hata: e.message });
  }
}

console.log("\n═══ ÖZET ═══");
ozet.forEach((o) => console.log(`${o.tamam ? "✓" : "✗"} ${o.ad}${o.hata ? " — " + o.hata : ""}`));
