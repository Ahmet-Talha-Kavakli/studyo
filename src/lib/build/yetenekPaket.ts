import "server-only";
import { inflateRawSync } from "zlib";
import { ANTHROPIC_DAL, ANTHROPIC_DEPO, ANTHROPIC_YETENEKLERI, iceAktarilabilir, LISANS_AD } from "./yetenekDizin";

/**
 * Yetenek paketleri: bağımlılıksız zip yazma (store) ve okuma (store + deflate), Anthropic resmî yeteneklerini
 * GitHub'dan içe aktarma. Yalnız metin dosyaları alınır; ikili dosyalar (font, görsel) atlanır ve sayısı bildirilir.
 */
const METIN = /\.(md|txt|py|js|mjs|cjs|ts|tsx|jsx|json|yaml|yml|toml|sh|bash|ps1|html|css|csv|xml|svg|sql|ini|cfg)$|(^|\/)(LICENSE|NOTICE|README)(\.txt)?$/i;
const SINIR = { dosya: 40, toplam: 2_000_000, tek: 300_000 };

/* ── CRC32 + zip (store) ── */
const TABLO = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b: Buffer): number { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = TABLO[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

/** Dosyaları kök klasör altında zip'ler (sıkıştırmasız, UTF-8 adlar). */
export function zipYap(dosyalar: Record<string, string>, kok: string): Buffer {
  const yerel: Buffer[] = [], merkez: Buffer[] = [];
  let ofset = 0;
  for (const [yol, icerik] of Object.entries(dosyalar)) {
    const ad = Buffer.from(`${kok}/${yol}`, "utf8"), veri = Buffer.from(icerik, "utf8"), crc = crc32(veri);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(0, 8); h.writeUInt32LE(0, 10);
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(veri.length, 18); h.writeUInt32LE(veri.length, 22); h.writeUInt16LE(ad.length, 26); h.writeUInt16LE(0, 28);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(0, 10); c.writeUInt32LE(0, 12);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(veri.length, 20); c.writeUInt32LE(veri.length, 24); c.writeUInt16LE(ad.length, 28); c.writeUInt32LE(ofset, 42);
    yerel.push(h, ad, veri); merkez.push(c, ad);
    ofset += 30 + ad.length + veri.length;
  }
  const mb = Buffer.concat(merkez);
  const son = Buffer.alloc(22); son.writeUInt32LE(0x06054b50, 0); son.writeUInt16LE(Object.keys(dosyalar).length, 8); son.writeUInt16LE(Object.keys(dosyalar).length, 10); son.writeUInt32LE(mb.length, 12); son.writeUInt32LE(ofset, 16);
  return Buffer.concat([...yerel, mb, son]);
}

/** Zip okur: metin dosyaları + atlanan sayısı. __MACOSX ve gizli dosyalar yok sayılır. */
export function zipCoz(b: Buffer): { dosyalar: Record<string, string>; atlanan: number } {
  let son = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65_557); i--) if (b.readUInt32LE(i) === 0x06054b50) { son = i; break; }
  if (son < 0) throw new Error("Bu bir zip dosyası değil.");
  const adet = b.readUInt16LE(son + 10);
  let o = b.readUInt32LE(son + 16), toplam = 0, atlanan = 0;
  const dosyalar: Record<string, string> = {};
  for (let n = 0; n < adet && o + 46 <= b.length; n++) {
    if (b.readUInt32LE(o) !== 0x02014b50) break;
    const yontem = b.readUInt16LE(o + 10), boy = b.readUInt32LE(o + 20), acik = b.readUInt32LE(o + 24), adBoy = b.readUInt16LE(o + 28), ekBoy = b.readUInt16LE(o + 30), yorum = b.readUInt16LE(o + 32), yer = b.readUInt32LE(o + 42);
    const ad = b.subarray(o + 46, o + 46 + adBoy).toString("utf8");
    o += 46 + adBoy + ekBoy + yorum;
    if (ad.endsWith("/") || /(^|\/)(__MACOSX|\.)/.test(ad) || ad.split("/").includes("..")) continue;
    if (!METIN.test(ad) || acik > SINIR.tek || Object.keys(dosyalar).length >= SINIR.dosya || toplam + acik > SINIR.toplam) { atlanan++; continue; }
    const yb = b.readUInt16LE(yer + 26), ye = b.readUInt16LE(yer + 28);
    const ham = b.subarray(yer + 30 + yb + ye, yer + 30 + yb + ye + boy);
    try { const v = yontem === 0 ? ham : yontem === 8 ? inflateRawSync(ham) : null; if (!v) { atlanan++; continue; } dosyalar[ad] = v.toString("utf8"); toplam += v.length; } catch { atlanan++; }
  }
  return { dosyalar, atlanan };
}

/** Zip içindeki yeteneği bulur: SKILL.md'nin klasörü kök kabul edilir. */
export function zipYetenek(dosyalar: Record<string, string>): { skillMd: string; ekler: { yol: string; icerik: string }[]; klasor: string } | null {
  const sk = Object.keys(dosyalar).filter((y) => /(^|\/)SKILL\.md$/i.test(y)).sort((a, b) => a.length - b.length)[0];
  if (!sk) return null;
  const kok = sk.slice(0, sk.length - "SKILL.md".length);
  return { skillMd: dosyalar[sk], klasor: kok.replace(/\/$/, "").split("/").pop() ?? "", ekler: Object.keys(dosyalar).filter((y) => y !== sk && y.startsWith(kok)).map((y) => ({ yol: y.slice(kok.length), icerik: dosyalar[y] })) };
}

/* ── Anthropic resmî yetenekleri ── */
type Agac = { sha: string; tree: { path: string; type: string; size?: number; sha?: string }[] };
let agacOnbellek: { zaman: number; agac: Agac } | null = null;
async function agacGetir(): Promise<Agac> {
  if (agacOnbellek && Date.now() - agacOnbellek.zaman < 30 * 60_000) return agacOnbellek.agac;
  const r = await fetch(`https://api.github.com/repos/${ANTHROPIC_DEPO}/git/trees/${ANTHROPIC_DAL}?recursive=1`, { signal: AbortSignal.timeout(20_000), headers: { Accept: "application/vnd.github+json", "User-Agent": "VayraBuild/1.0" } });
  if (!r.ok) throw new Error(`GitHub yanıt vermedi (${r.status}).`);
  const agac = (await r.json()) as Agac;
  agacOnbellek = { zaman: Date.now(), agac };
  return agac;
}
const ham = (sha: string, yol: string) => fetch(`https://raw.githubusercontent.com/${ANTHROPIC_DEPO}/${sha}/${yol}`, { signal: AbortSignal.timeout(20_000), headers: { "User-Agent": "VayraBuild/1.0" } }).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${yol} okunamadı (${r.status}).`))));

/** Yalnız SKILL.md (önizleme; her lisansta okunabilir, yalnız gösterim). */
export async function anthropicSkillMd(ad: string): Promise<{ skillMd: string; commit: string; dosyalar: { yol: string; boyut: number }[] }> {
  const d = ANTHROPIC_YETENEKLERI.find((x) => x.ad === ad);
  if (!d) throw new Error("Dizinde böyle bir yetenek yok.");
  const agac = await agacGetir();
  const on = `skills/${ad}/`;
  return { skillMd: await ham(agac.sha, `${on}SKILL.md`), commit: agac.sha, dosyalar: agac.tree.filter((x) => x.type === "blob" && x.path.startsWith(on)).map((x) => ({ yol: x.path.slice(on.length), boyut: x.size ?? 0 })) };
}

/** Lisansı izin veriyorsa (Apache 2.0) SKILL.md ve metin dosyalarını lisans dosyasıyla birlikte getirir. */
/** Yetenek klasörünün git ağacı özeti: içerik değişince değişir (güncelleme denetimi için). */
export async function anthropicKlasorOzeti(ad: string, taze = false): Promise<string | null> {
  if (taze) agacOnbellek = null;
  const agac = await agacGetir();
  return agac.tree.find((x) => x.type === "tree" && x.path === `skills/${ad}`)?.sha ?? null;
}

export async function anthropicIceAktar(ad: string): Promise<{ skillMd: string; dosyalar: { yol: string; icerik: string }[]; atlanan: number; commit: string; lisans: string; url: string; agac?: string }> {
  const d = ANTHROPIC_YETENEKLERI.find((x) => x.ad === ad);
  if (!d) throw new Error("Dizinde böyle bir yetenek yok.");
  if (!iceAktarilabilir(d)) throw new Error(`${LISANS_AD[d.lisans]}: bu yetenek içe aktarılamaz, yalnız kaynağında açılabilir.`);
  const agac = await agacGetir();
  const on = `skills/${ad}/`;
  const l = agac.tree.filter((x) => x.type === "blob" && x.path.startsWith(on) && x.path !== `${on}SKILL.md`);
  const secilen = l.filter((x) => METIN.test(x.path) && (x.size ?? 0) <= SINIR.tek).sort((a, b) => Number(/LICENSE/i.test(b.path)) - Number(/LICENSE/i.test(a.path)) || (a.size ?? 0) - (b.size ?? 0));
  const dosyalar: { yol: string; icerik: string }[] = [];
  let toplam = 0;
  for (const x of secilen) {
    if (dosyalar.length >= SINIR.dosya - 1 || toplam + (x.size ?? 0) > SINIR.toplam) continue;
    dosyalar.push({ yol: x.path.slice(on.length), icerik: await ham(agac.sha, x.path) });
    toplam += x.size ?? 0;
  }
  const klasor = agac.tree.find((x) => x.type === "tree" && x.path === `skills/${ad}`)?.sha;
  return { skillMd: await ham(agac.sha, `${on}SKILL.md`), dosyalar, atlanan: l.length - dosyalar.length, commit: agac.sha, lisans: "Apache-2.0", url: `https://github.com/${ANTHROPIC_DEPO}/tree/${agac.sha}/skills/${ad}`, agac: klasor };
}
