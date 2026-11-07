import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { rastgeleStok } from "./stok-gorseller";
import { GERCEK_GORSELLER } from "./kesfetVeri";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Bir tohumdan (prompt+model gibi) GERÇEK stok görsel arka planı üretir.
 * Higgsfield birebir: kartlar gradyan yerine gerçek görselle dolu görünür.
 * CSS `background` shorthand'ı döndürür — gradyan yedeği görsel yüklenene kadar altta kalır.
 * Deterministik (aynı tohum → aynı görsel), SSR/hydration güvenli.
 */
export function onizlemeArka(tohum: string, kategori?: string): string {
  const url = rastgeleStok(tohum, kategori);
  // CSS'te ilk katman en ÜSTTE: görsel önde, gradyan yedeği arkada (yüklenene dek).
  return `url("${url}") center/cover no-repeat, ${gradientOnizleme(tohum)}`;
}

/**
 * Bir tohum için GERÇEK görsel varsa onu (gradyan yedekli) CSS background döndürür,
 * yoksa stok `onizlemeArka`'ya düşer. Görsel kalitesi bozulmadan cover ile yerleşir.
 */
export function gorselArka(tohum: string, kategori?: string): string {
  const gercek = GERCEK_GORSELLER[tohum];
  if (gercek) return `url("${gercek}") center/cover no-repeat, ${gradientOnizleme(tohum)}`;
  return onizlemeArka(tohum, kategori);
}

/**
 * Bir önizleme değerinden SALT görsel URL'ini çıkarır (<img src>, <video poster> için).
 * gorselUrl üç biçimde gelebilir:
 *   1) ham URL / data-uri ("/stok/..", "https://..", "data:image/..")
 *   2) onizlemeArka çıktısı CSS ("url(\"/stok/..\") ..., linear-gradient(..)")
 *   3) düz gradyan ("linear-gradient(..)") → görsel yok, undefined döner
 * Böylece <video poster>/<img src> asla bozuk CSS string almaz.
 */
export function saltUrl(deger?: string): string | undefined {
  if (!deger) return undefined;
  // CSS içinden url("...") / url('...') / url(...) yakala
  const m = deger.match(/url\((['"]?)([^'")]+)\1\)/);
  if (m) return m[2];
  // Zaten ham URL/data-uri ise doğrudan döndür
  if (/^(data:|https?:|\/)/.test(deger)) return deger;
  // Yalnızca gradyan → görsel yok
  return undefined;
}

export function formatKredi(n: number) {
  return new Intl.NumberFormat("tr-TR").format(n);
}

/** Prompt/tohuma göre deterministik güzel bir gradient önizleme üretir (server+client güvenli). */
export function gradientOnizleme(tohum: string): string {
  let h = 0;
  for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 60 + (h % 120)) % 360;
  const c = (a + 200) % 360;
  return `linear-gradient(135deg, hsl(${a} 75% 55%), hsl(${b} 70% 45%) 55%, hsl(${c} 65% 30%))`;
}

/* ══════════════ FİLİGRAN KÖPRÜSÜ ══════════════
   Plan hakkı olmayan kullanıcının indirdiği görsele Vayra işareti basılır (lib/galeri/indir).
   utils her yerden içe aktarıldığı için galeri modülünü doğrudan çağırmaz (döngü olmasın):
   galeri/indir yüklenince buraya kendini kaydeder; kayıt yoksa eski davranış sürer. */
type FiligranKoprusu = { gerekli: () => boolean; indir: (url: string, ad: string, bicim?: string) => Promise<boolean> };
let filigranKoprusu: FiligranKoprusu | null = null;
export function filigranKoprusuKur(k: FiligranKoprusu) { filigranKoprusu = k; }
/** Adres bir görsel dosyası mı (filigran yalnız görsellere basılır). */
export const gorselAdresiMi = (u: string) => /^data:image\//.test(u) || /\.(png|jpe?g|webp|avif|gif)(\?|$)/i.test(u) || /\/api\/dosya\/(gorsel|upscale|element)\//.test(u) || /^\/(stok|gercek)\//.test(u);
/** Filigran gerekiyorsa indirmeyi köprüye devreder ve true döner. */
export function filigranliIndirildi(url: string, ad: string, bicim?: string): boolean {
  if (!filigranKoprusu || !gorselAdresiMi(url) || !filigranKoprusu.gerekli()) return false;
  void filigranKoprusu.indir(url, ad, bicim);
  return true;
}

/** Üretim önizlemesini gerçek bir PNG olarak indirir (canvas ile). */
export function gorseliIndir(tohum: string, dosyaAdi: string, gercekUrl?: string): boolean {
  if (typeof document === "undefined") return false;
  if (gercekUrl && filigranliIndirildi(gercekUrl, dosyaAdi)) return true;
  const adTemiz = dosyaAdi.replace(/[^\w-]/g, "_").slice(0, 40) || "vayra";
  // Gerçek API çıktısı (data:image/... veya http URL) varsa onu doğrudan indir.
  if (gercekUrl) {
    const link = document.createElement("a");
    const uzanti = gercekUrl.startsWith("data:image/png")
      ? "png"
      : gercekUrl.startsWith("data:image/")
        ? gercekUrl.slice(11, gercekUrl.indexOf(";")) || "png"
        : gercekUrl.split("?")[0].split(".").pop()?.slice(0, 4) || "png";
    link.download = `${adTemiz}.${uzanti}`;
    link.href = gercekUrl;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  }
  // Dosyası olmayan üretimde uydurma bir gradyan PNG indirilmez: çağıran "dosya yok" der.
  void tohum;
  return false;
}

/* ══════════════ FORMAT SEÇEREK İNDİRME ══════════════
   Kullanıcı kararı (2026-07-31): "kullanıcılarımız hangi formatta
   indireceklerini seçsinler". gorseliIndir() formatı KAYNAK URL'den türetiyor;
   burada hedef format canvas ile GERÇEKTEN dönüştürülür. */

/** Desteklenen indirme formatları — ilk eleman varsayılan. */
export const INDIRME_FORMATLARI = ["png", "jpg", "webp"] as const;
export type IndirmeFormat = (typeof INDIRME_FORMATLARI)[number];

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

/**
 * Görseli SEÇİLEN formatta indirir. Kaynak canvas'a çizilip hedef MIME ile
 * yeniden kodlanır — yani "jpg" seçilince gerçekten JPEG iner, sadece uzantı
 * değişmez. JPEG saydamlığı desteklemediği için zemin beyaza boyanır.
 *
 * Çapraz-köken (CORS) görsellerde canvas "kirlenir" ve toDataURL patlar;
 * o durumda kaynak URL doğrudan indirilerek sessizce eski davranışa düşülür.
 */
export async function gorseliFormatlaIndir(
  url: string,
  dosyaAdi: string,
  format: string = INDIRME_FORMATLARI[0],
): Promise<void> {
  if (typeof document === "undefined" || !url) return;
  if (filigranKoprusu?.gerekli()) { await filigranKoprusu.indir(url, dosyaAdi, format); return; }
  const adTemiz = (dosyaAdi || "vayra").replace(/[^\w-]/g, "_").slice(0, 60) || "vayra";
  const mime = MIME[format] ?? MIME.png;

  const indirDataUrl = (veri: string, uzanti: string) => {
    const a = document.createElement("a");
    a.download = `${adTemiz}.${uzanti}`;
    a.href = veri;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((coz, hata) => {
      img.onload = () => coz();
      img.onerror = () => hata(new Error("görsel yüklenemedi"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 1024;
    canvas.height = img.naturalHeight || 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas yok");
    if (format === "jpg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    indirDataUrl(canvas.toDataURL(mime, 0.95), format);
  } catch {
    // CORS/kirli canvas → kaynağı olduğu gibi indir (format değişmez).
    indirDataUrl(url, url.startsWith("data:image/png") ? "png" : format);
  }
}

/**
 * istemTemizle — üretim kaydındaki `prompt` alanından AYAR NOTLARINI söker.
 *
 * Üretim sırasında prompt'a " · 4K", " · 1 referans görsele sadık kal",
 * " · CFG 7 · 30 adım" gibi notlar ekleniyor. "Bu ayarlarla üret" bu metni
 * composer'a olduğu gibi yazınca notlar her seferinde birikiyordu.
 *
 * Yeni üretimler `meta.hamIstem` taşır (temiz metin). Bu fonksiyon yalnızca
 * ESKİ kayıtlar için geri düşüş: bilinen not kalıplarını sondan siler.
 */
const NOT_KALIPLARI = [
  /\s·\s\d+\s*referans görsele sadık kal/gi,
  /\s·\s(?:4K|2K|1080p|720p|8K)\b/gi,
  /\s·\svektör \(SVG\)/gi,
  /\s·\sprompt geliştirildi/gi,
  /\s·\sCFG\s[\d.]+/gi,
  /\s·\s\d+\s*adım/gi,
  /\s·\s[^·]*\bkalite\b/gi,
  /\s·\s[^·]*\bruh panosu\b/gi,
  /\s·\s@[^\s·]+\s*karakteri/gi,
  /\s·\s[^·]*\brenk paleti\b/gi,
  /\s·\s[^·]*\bpaleti\b/gi,
];
export function istemTemizle(prompt: string): string {
  let s = prompt ?? "";
  for (const k of NOT_KALIPLARI) s = s.replace(k, "");
  return s.replace(/\s*·\s*$/, "").trim();
}
