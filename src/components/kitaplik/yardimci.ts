import {
  AudioLines, Box, Clapperboard, Film, Folder, ImageIcon, Megaphone, Mic, Music, Presentation, Upload, Users,
  type LucideIcon,
} from "lucide-react";
import type { Uretim } from "@/store/useProjeler";
import type { RenkTuru } from "@/lib/renk";
import { onizlemeArka, saltUrl } from "@/lib/utils";

/* ── Türler ── */
export type Tur = "gorsel" | "video" | "ses" | "muzik" | "3d";
export const TURLER: { id: Tur; ad: string; cogul: string; ikon: LucideIcon; renk: RenkTuru; studyo: string }[] = [
  { id: "gorsel", ad: "Görsel", cogul: "Görseller", ikon: ImageIcon, renk: "gorsel", studyo: "/panel/gorsel" },
  { id: "video", ad: "Video", cogul: "Videolar", ikon: Clapperboard, renk: "video", studyo: "/panel/video" },
  { id: "ses", ad: "Ses", cogul: "Sesler", ikon: AudioLines, renk: "ses", studyo: "/panel/ses" },
  { id: "muzik", ad: "Müzik", cogul: "Müzikler", ikon: Music, renk: "muzik", studyo: "/panel/muzik" },
  { id: "3d", ad: "3D", cogul: "3D modeller", ikon: Box, renk: "3d", studyo: "/panel/3d" },
];
export const turBul = (t: Tur) => TURLER.find((x) => x.id === t)!;
export function uretimTuru(u: Uretim): Tur {
  if (u.tur === "video" || u.tur === "ses" || u.tur === "muzik" || u.tur === "3d") return u.tur;
  return "gorsel";
}

/* ── Araç (stüdyo) kaynakları ── */
export type Arac = "shorts" | "explainer" | "pazarlama" | "karakter" | "lipsync" | "yukleme";
export const ARACLAR: { id: Arac; ad: string; ikon: LucideIcon }[] = [
  { id: "shorts", ad: "Shorts", ikon: Film },
  { id: "explainer", ad: "Explainer", ikon: Presentation },
  { id: "pazarlama", ad: "Pazarlama", ikon: Megaphone },
  { id: "karakter", ad: "Karakterler", ikon: Users },
  { id: "lipsync", ad: "Lipsync", ikon: Mic },
];
export const YUKLEME_ARAC = "Yükleme";
export function aracFiltresi(u: Uretim): Arac | null {
  const a = (u.arac ?? "").toLowerCase();
  if (a === YUKLEME_ARAC.toLowerCase()) return "yukleme";
  if (a.includes("shorts")) return "shorts";
  if (a.includes("explainer")) return "explainer";
  if (a.includes("pazarlama") || a.includes("marketing")) return "pazarlama";
  if (a.includes("karakter") || a.includes("influencer") || a.includes("character")) return "karakter";
  if (a.includes("konuştur") || a.includes("konustur") || a.includes("lipsync") || a.includes("fans") || a.includes("dudak")) return "lipsync";
  return null;
}

/* ── Medya ── */
/** Kartın arka planı (CSS background): gerçek görsel, yoksa deterministik stok. */
export function kartArka(u: Uretim): string {
  const g = saltUrl(u.gorselUrl) || saltUrl(u.thumbnailUrl);
  if (g) return `center/cover no-repeat url("${g}")`;
  if (u.gorselUrl && !/^(http|data:|\/)/.test(u.gorselUrl)) return u.gorselUrl;
  const kat = u.tur === "video" ? "sinematik" : u.tur === "3d" ? "3d" : u.tur === "ses" || u.tur === "muzik" ? "soyut" : "portre";
  return onizlemeArka((u.prompt || u.baslik) + u.model, kat);
}
export const kapakUrl = (u: Uretim) => saltUrl(u.gorselUrl) || saltUrl(u.thumbnailUrl) || saltUrl(u.muzik?.kapak);
export const oranCss = (u: Uretim) => (u.meta?.oran ?? (u.tur === "video" ? "16:9" : "3:4")).replace(":", "/");

/** Deterministik dalga formu (gerçek çözümleme yoksa) — her üretimde aynı kalır. */
export function dalga(tohum: string, n = 48): number[] {
  let h = 2166136261;
  for (let i = 0; i < tohum.length; i++) { h ^= tohum.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Array.from({ length: n }, (_, i) => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    const r = ((h >>> 0) % 1000) / 1000;
    const zarf = Math.sin((i / n) * Math.PI) * 0.6 + 0.4;
    return Math.max(0.12, Math.min(1, r * zarf + 0.15));
  });
}

/* ── Proje ikonu ── */
export function projeIkonu(p: { kaynakStudyo?: string; tur?: string; ad?: string }): { ikon: LucideIcon; renk: RenkTuru } {
  const k = `${p.kaynakStudyo ?? ""} ${p.tur ?? ""} ${p.ad ?? ""}`.toLowerCase();
  if (/sinema|cinema|film|shorts|video|montaj|klip/.test(k)) return { ikon: Clapperboard, renk: "video" };
  if (/müzik|muzik|music/.test(k)) return { ikon: Music, renk: "muzik" };
  if (/ses|audio|lipsync|konuştur|konustur/.test(k)) return { ikon: AudioLines, renk: "ses" };
  if (/görsel|gorsel|image|foto|karakter|portre/.test(k)) return { ikon: ImageIcon, renk: "gorsel" };
  if (/3d|model|mesh/.test(k)) return { ikon: Box, renk: "3d" };
  if (/yükleme|yukleme/.test(k)) return { ikon: Upload, renk: "canvas" };
  return { ikon: Folder, renk: "vurgu" };
}

/* ── Tarih ── */
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const GUN = 86_400_000;
/** Bugün / Dün / Bu hafta / Ay Yıl gruplaması. Sıralama korunur. */
export function tarihGrubu(ts: number, simdi: number): { anahtar: string; etiket: string } {
  const b = new Date(simdi); b.setHours(0, 0, 0, 0);
  const t0 = b.getTime();
  if (ts >= t0) return { anahtar: "bugun", etiket: "Bugün" };
  if (ts >= t0 - GUN) return { anahtar: "dun", etiket: "Dün" };
  if (ts >= t0 - 6 * GUN) return { anahtar: "hafta", etiket: "Bu hafta" };
  const d = new Date(ts);
  const buYil = d.getFullYear() === b.getFullYear();
  return { anahtar: `${d.getFullYear()}-${d.getMonth()}`, etiket: buYil ? AYLAR[d.getMonth()] : `${AYLAR[d.getMonth()]} ${d.getFullYear()}` };
}
export const tarihUzun = (ts: number) => { const d = new Date(ts); return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
export const sadeMetin = (s: string) => s.toLocaleLowerCase("tr-TR");

/* ── Dosya adı ── */
export function dosyaAdi(u: Uretim, uzanti: string) {
  const temel = (u.baslik || u.prompt || "vayra").toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (h) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[h]!)
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "vayra";
  return `${temel}-${u.id.slice(-5)}.${uzanti}`;
}
/** Üretimin indirilebilir ana dosyası. */
export function anaDosya(u: Uretim): { url: string; uzanti: string } | null {
  if (u.videoUrl) return { url: u.videoUrl, uzanti: "mp4" };
  if (u.sesUrl) return { url: u.sesUrl, uzanti: "mp3" };
  if (u.glbUrl) return { url: u.glbUrl, uzanti: "glb" };
  const g = kapakUrl(u);
  if (g) {
    const uz = g.startsWith("data:image/png") ? "png" : g.startsWith("data:image/jpeg") ? "jpg" : (g.match(/\.(png|jpe?g|webp|gif)(\?|$)/i)?.[1] ?? "webp");
    return { url: g, uzanti: uz.replace("jpeg", "jpg") };
  }
  return null;
}

/* ── ZIP (sıkıştırmasız, bağımlılıksız) ── */
const CRC_TABLO = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(b: Uint8Array) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC_TABLO[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

/** Dosyaları STORE yöntemiyle tek bir ZIP Blob'una paketler. */
export function zipOlustur(dosyalar: { ad: string; veri: Uint8Array }[]): Blob {
  const enc = new TextEncoder();
  const parcalar: BlobPart[] = [];
  const merkez: Uint8Array[] = [];
  let ofset = 0;
  const simdi = new Date();
  const dosZaman = ((simdi.getHours() << 11) | (simdi.getMinutes() << 5) | (simdi.getSeconds() >> 1)) & 0xffff;
  const dosTarih = (((simdi.getFullYear() - 1980) << 9) | ((simdi.getMonth() + 1) << 5) | simdi.getDate()) & 0xffff;
  for (const d of dosyalar) {
    const ad = enc.encode(d.ad);
    const crc = crc32(d.veri);
    const yerel = new DataView(new ArrayBuffer(30));
    yerel.setUint32(0, 0x04034b50, true); yerel.setUint16(4, 20, true); yerel.setUint16(6, 0x0800, true); yerel.setUint16(8, 0, true);
    yerel.setUint16(10, dosZaman, true); yerel.setUint16(12, dosTarih, true); yerel.setUint32(14, crc, true);
    yerel.setUint32(18, d.veri.length, true); yerel.setUint32(22, d.veri.length, true); yerel.setUint16(26, ad.length, true); yerel.setUint16(28, 0, true);
    parcalar.push(yerel.buffer, ad, d.veri);
    const m = new DataView(new ArrayBuffer(46));
    m.setUint32(0, 0x02014b50, true); m.setUint16(4, 20, true); m.setUint16(6, 20, true); m.setUint16(8, 0x0800, true); m.setUint16(10, 0, true);
    m.setUint16(12, dosZaman, true); m.setUint16(14, dosTarih, true); m.setUint32(16, crc, true);
    m.setUint32(20, d.veri.length, true); m.setUint32(24, d.veri.length, true); m.setUint16(28, ad.length, true);
    m.setUint32(42, ofset, true);
    const mb = new Uint8Array(46 + ad.length); mb.set(new Uint8Array(m.buffer), 0); mb.set(ad, 46);
    merkez.push(mb);
    ofset += 30 + ad.length + d.veri.length;
  }
  const merkezBoyut = merkez.reduce((a, b) => a + b.length, 0);
  const son = new DataView(new ArrayBuffer(22));
  son.setUint32(0, 0x06054b50, true); son.setUint16(8, dosyalar.length, true); son.setUint16(10, dosyalar.length, true);
  son.setUint32(12, merkezBoyut, true); son.setUint32(16, ofset, true);
  return new Blob([...parcalar, ...merkez, son.buffer], { type: "application/zip" });
}

export function blobIndir(blob: Blob, ad: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = ad; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Seçilen üretimleri ZIP olarak indirir. Erişilemeyen dosyalar atlanır, künye dosyası eklenir. */
export async function zipIndir(liste: Uretim[], ad: string, ilerleme?: (n: number) => void): Promise<{ eklenen: number; atlanan: number }> {
  const dosyalar: { ad: string; veri: Uint8Array }[] = [];
  let atlanan = 0;
  const kunye: string[] = [];
  for (let i = 0; i < liste.length; i++) {
    const u = liste[i];
    const d = anaDosya(u);
    ilerleme?.(i / liste.length);
    if (!d) { atlanan++; continue; }
    try {
      const r = await fetch(d.url);
      if (!r.ok) throw new Error(String(r.status));
      const veri = new Uint8Array(await r.arrayBuffer());
      const dosya = dosyaAdi(u, d.uzanti);
      dosyalar.push({ ad: dosya, veri });
      kunye.push(`${dosya}\n  İstem: ${u.prompt || u.baslik}\n  Model: ${u.model}\n  Oluşturma: ${tarihUzun(u.olusturma)}\n`);
    } catch { atlanan++; }
  }
  dosyalar.push({ ad: "vayra-kunye.txt", veri: new TextEncoder().encode(`Vayra kitaplık dışa aktarımı\n${new Date().toLocaleString("tr-TR")}\n\n${kunye.join("\n")}`) });
  ilerleme?.(1);
  blobIndir(zipOlustur(dosyalar), ad);
  return { eklenen: dosyalar.length - 1, atlanan };
}

/** Yüklenen görseli en fazla 1600 px'e ölçekleyip WEBP veri adresine çevirir (yerel depolama sınırı için). */
export function gorselKucult(dosya: File, azami = 1600): Promise<{ url: string; en: number; boy: number }> {
  return new Promise((coz, red) => {
    const img = new Image();
    const kaynak = URL.createObjectURL(dosya);
    img.onload = () => {
      const o = Math.min(1, azami / Math.max(img.width, img.height));
      const en = Math.round(img.width * o), boy = Math.round(img.height * o);
      const c = document.createElement("canvas"); c.width = en; c.height = boy;
      c.getContext("2d")!.drawImage(img, 0, 0, en, boy);
      URL.revokeObjectURL(kaynak);
      coz({ url: c.toDataURL("image/webp", 0.85), en, boy });
    };
    img.onerror = () => { URL.revokeObjectURL(kaynak); red(new Error("Görsel okunamadı")); };
    img.src = kaynak;
  });
}

/** En boy oranını en yakın standart orana yuvarlar. */
export function oranBul(en: number, boy: number) {
  const r = en / boy;
  const adaylar: [string, number][] = [["1:1", 1], ["4:3", 4 / 3], ["3:4", 3 / 4], ["16:9", 16 / 9], ["9:16", 9 / 16], ["3:2", 1.5], ["2:3", 2 / 3], ["21:9", 21 / 9]];
  return adaylar.reduce((a, b) => (Math.abs(b[1] - r) < Math.abs(a[1] - r) ? b : a))[0];
}
