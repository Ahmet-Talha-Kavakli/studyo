// public altındaki görsel ve videoların en ve boyunu çıkarır: src/lib/medyaOlcu.json
// Kullanım: node scripts/medya-olcu.mjs   (yeni görsel eklendiğinde yeniden çalıştır)
// Biçim: { "/klasor/": { "dosya.webp": [en, boy], ... } } — yükleme iskeleti kartı görsel gelmeden doğru boyutta çizer.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const KOK = path.resolve("public");
const KLASORLER = ["gercek", "stok", "basin", "brand"];
const harita = {};

function mp4Olcu(dosya) {
  const b = fs.readFileSync(dosya);
  let en = 0, boy = 0;
  // Her 'tkhd' kutusunun sonunda 16.16 sabit noktalı en ve boy var; ilk görüntü izini al.
  let i = b.indexOf("tkhd");
  while (i > 0) {
    const boyut = b.readUInt32BE(i - 4);
    const son = i - 4 + boyut;
    const w = b.readUInt32BE(son - 8) / 65536, h = b.readUInt32BE(son - 4) / 65536;
    if (w > 0 && h > 0) { en = Math.round(w); boy = Math.round(h); break; }
    i = b.indexOf("tkhd", i + 4);
  }
  return en && boy ? [en, boy] : null;
}

async function gez(dizin) {
  for (const ad of fs.readdirSync(dizin)) {
    const tam = path.join(dizin, ad);
    if (fs.statSync(tam).isDirectory()) { await gez(tam); continue; }
    const uzanti = path.extname(ad).toLowerCase();
    let o = null;
    try {
      if ([".webp", ".jpg", ".jpeg", ".png", ".avif", ".gif"].includes(uzanti)) { const m = await sharp(tam).metadata(); if (m.width && m.height) o = [m.width, m.height]; }
      else if (uzanti === ".mp4") o = mp4Olcu(tam);
    } catch { o = null; }
    if (!o) continue;
    const kl = "/" + path.relative(KOK, dizin).split(path.sep).join("/") + "/";
    (harita[kl] ??= {})[ad] = o;
  }
}

for (const k of KLASORLER) if (fs.existsSync(path.join(KOK, k))) await gez(path.join(KOK, k));
fs.writeFileSync("src/lib/medyaOlcu.json", JSON.stringify(harita));
const sayi = Object.values(harita).reduce((t, x) => t + Object.keys(x).length, 0);
console.log("klasör", Object.keys(harita).length, "dosya", sayi, "bayt", fs.statSync("src/lib/medyaOlcu.json").size);
