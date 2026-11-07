import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { inflateSync } from "zlib";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { belgeGetir, belgeIceAl, belgeModelMetni, belgeUrl } from "./belgeDepo";
import { officeBicimi, officeOku } from "./belgeOku";
import { BICIM_MIME } from "./belgeTipler";
import type { SohbetEki } from "./sohbetDepo";

/**
 * Sohbet ekleri: görsel, PDF ve metin dosyaları .veri/build/sohbet-ek/<ad> altında durur, tahmin edilemez adla
 * /api/build/sohbet/ek/<ad> adresinden sunulur. PDF'lerin metni yüklenirken çıkarılır (<ad>.txt): Claude PDF'i
 * belge bloğu olarak kendisi okur; diğer modellere bu metin gider.
 */
const KLASOR = path.join(DEPO_KOK, "build", "sohbet-ek");
const AD = /^[A-Za-z0-9_-]{20,40}\.(png|jpg|webp|gif|pdf|txt)$/;
export const EK_SINIRI = { dosya: 20 * 1024 * 1024, metin: 400_000, adet: 10 };
export const EK_MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", gif: "image/gif", pdf: "application/pdf", txt: "text/plain; charset=utf-8" };
const UZANTI: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "application/pdf": "pdf" };
const METIN_UZANTI = /\.(txt|md|markdown|csv|tsv|json|jsonl|xml|html?|css|js|jsx|ts|tsx|py|rb|go|rs|java|kt|swift|c|cc|cpp|h|hpp|cs|php|sql|sh|ya?ml|toml|ini|log|srt|vtt|tex)$/i;

export const ekAdiGecerli = (ad: string) => AD.test(ad);
export const ekYolu = (ad: string) => path.join(KLASOR, ad);

/**
 * Yüklenen dosyayı saklar; türü içerikten belirler. Metin dosyaları UTF-8 .txt olarak saklanır. Word, Excel ve
 * PowerPoint dosyaları belge deposuna sürüm 1 olarak girer (içerikleri okunup ajanın düzenleyebileceği biçime çevrilir).
 */
export async function ekKaydet(bayt: Buffer, ad: string, mime: string, sahip?: string): Promise<SohbetEki & { sayfa?: number; metinUzunluk?: number }> {
  await mkdir(KLASOR, { recursive: true });
  const ofis = officeBicimi(ad, mime, bayt);
  if (ofis) {
    const girdi = await officeOku(bayt, ad, ofis);
    const k = await belgeIceAl(bayt, ad || `dosya.${ofis}`, ofis, girdi, sahip);
    return { tur: "ofis", url: belgeUrl(k), ad: k.ad, boyut: k.boyut, mime: BICIM_MIME[ofis], bicim: ofis, belge: k.id };
  }
  const kimlik = randomBytes(18).toString("base64url");
  const pdf = mime === "application/pdf" || bayt.subarray(0, 5).toString("latin1") === "%PDF-";
  if (pdf) {
    const dosyaAdi = `${kimlik}.pdf`;
    await writeFile(ekYolu(dosyaAdi), bayt);
    const { metin, sayfa } = pdfMetni(bayt);
    await writeFile(ekYolu(`${kimlik}.pdf.txt`), metin.slice(0, EK_SINIRI.metin));
    return { tur: "pdf", url: `/api/build/sohbet/ek/${dosyaAdi}`, ad: ad.slice(0, 120) || "belge.pdf", boyut: bayt.length, mime: "application/pdf", sayfa, metinUzunluk: metin.length };
  }
  const uz = UZANTI[mime];
  if (uz) {
    const dosyaAdi = `${kimlik}.${uz}`;
    await writeFile(ekYolu(dosyaAdi), bayt);
    return { tur: "gorsel", url: `/api/build/sohbet/ek/${dosyaAdi}`, ad: ad.slice(0, 120) || "görsel", boyut: bayt.length, mime };
  }
  if (METIN_UZANTI.test(ad) || mime.startsWith("text/") || /json|xml|javascript|yaml|csv/.test(mime)) {
    const metin = bayt.toString("utf8").replace(/\u0000/g, "");
    if (/[\u0000-\u0008\u000e-\u001f]/.test(metin.slice(0, 2000))) throw new Error("Bu dosya metin gibi görünmüyor.");
    const dosyaAdi = `${kimlik}.txt`;
    await writeFile(ekYolu(dosyaAdi), metin.slice(0, EK_SINIRI.metin));
    return { tur: "metin", url: `/api/build/sohbet/ek/${dosyaAdi}`, ad: ad.slice(0, 120) || "metin.txt", boyut: bayt.length, mime: mime || "text/plain", metinUzunluk: metin.length };
  }
  throw new Error("Bu dosya türü desteklenmiyor. Görsel, PDF, Word, Excel, PowerPoint ya da metin dosyası ekle.");
}

const adOf = (url: string) => /^\/api\/build\/sohbet\/ek\/([A-Za-z0-9_.-]+)$/.exec(url)?.[1];

/** Ekin baytları (görsel/PDF) ya da metni; depoda değilse null. Eski sohbetlerdeki data URL görseller de okunur. */
export async function ekOku(e: SohbetEki): Promise<{ veri: Buffer; mime: string } | null> {
  const d = /^data:([^;]+);base64,(.+)$/.exec(e.url);
  if (d) return { veri: Buffer.from(d[2], "base64"), mime: d[1] };
  const ad = adOf(e.url);
  if (!ad || !AD.test(ad)) return null;
  try { return { veri: await readFile(ekYolu(ad)), mime: EK_MIME[ad.split(".").pop()!] ?? "application/octet-stream" }; } catch { return null; }
}
export async function ekMetni(e: SohbetEki): Promise<string> {
  if (e.tur === "ofis") { const k = e.belge ? await belgeGetir(e.belge) : null; return k ? belgeModelMetni(k) : ""; }
  const ad = adOf(e.url);
  if (!ad) return "";
  try { return await readFile(ekYolu(e.tur === "pdf" ? `${ad}.txt` : ad), "utf8"); } catch { return ""; }
}

/* ───────────── PDF metni (bağımlılıksız) ─────────────
   Akışlar FlateDecode ile açılır, nesne akışları (ObjStm) çözülür, yazı tiplerinin ToUnicode eşlemeleri okunur,
   sayfa içerik akışlarındaki Tj/TJ/'/" işleçleri sırayla metne çevrilir. Taranmış (görüntü) PDF'lerde metin çıkmaz. */
type Nesne = { metin: string; akis?: Buffer };

function akisAc(sozluk: string, ham: Buffer): Buffer | undefined {
  if (!/\/Filter\s*(\[\s*)?\/FlateDecode/.test(sozluk)) return /\/Filter/.test(sozluk) ? undefined : ham;
  try { return inflateSync(ham); } catch { try { return inflateSync(ham, { finishFlush: 2 }); } catch { return undefined; } }
}

function nesneler(b: Buffer): Map<number, Nesne> {
  const s = b.toString("latin1");
  const harita = new Map<number, Nesne>();
  const re = /(\d+)\s+\d+\s+obj\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const no = Number(m[1]);
    const bas = m.index + m[0].length;
    const akisI = s.indexOf("stream", bas);
    const sonI = s.indexOf("endobj", bas);
    if (sonI < 0) break;
    if (akisI >= 0 && akisI < sonI && s.slice(bas, akisI).includes("<<")) {
      const sozluk = s.slice(bas, akisI);
      let v = akisI + 6;
      if (s[v] === "\r") v++;
      if (s[v] === "\n") v++;
      const uzun = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(sozluk);
      let son = uzun ? v + Number(uzun[1]) : s.indexOf("endstream", v);
      if (son < v || son > b.length || s.slice(son, son + 30).indexOf("endstream") < 0) son = s.indexOf("endstream", v);
      const ham = b.subarray(v, son);
      harita.set(no, { metin: sozluk, akis: akisAc(sozluk, ham) });
      const bitis = s.indexOf("endobj", son);
      re.lastIndex = bitis > 0 ? bitis : son;
    } else {
      harita.set(no, { metin: s.slice(bas, sonI) });
      re.lastIndex = sonI;
    }
  }
  // Nesne akışları
  for (const [, n] of [...harita]) {
    if (!/\/Type\s*\/ObjStm/.test(n.metin) || !n.akis) continue;
    const ilk = Number(/\/First\s+(\d+)/.exec(n.metin)?.[1] ?? 0);
    const adet = Number(/\/N\s+(\d+)/.exec(n.metin)?.[1] ?? 0);
    const ic = n.akis.toString("latin1");
    const bas = ic.slice(0, ilk).trim().split(/\s+/).map(Number);
    for (let i = 0; i < adet; i++) {
      const no = bas[i * 2], ofs = bas[i * 2 + 1], sonraki = i + 1 < adet ? bas[(i + 1) * 2 + 1] : ic.length - ilk;
      if (!harita.has(no)) harita.set(no, { metin: ic.slice(ilk + ofs, ilk + sonraki) });
    }
  }
  return harita;
}

const ref = (s: string | undefined) => (s ? Number(/(\d+)\s+\d+\s+R/.exec(s)?.[1]) : NaN);

/** Sözlük metninde bir anahtarın değeri (iç içe << >> ve [ ] dengeli). */
function deger(s: string, anahtar: string): string | undefined {
  const i = s.search(new RegExp(`/${anahtar}(?![A-Za-z0-9])`));
  if (i < 0) return undefined;
  let j = i + anahtar.length + 1;
  while (/\s/.test(s[j] ?? "")) j++;
  if (s.startsWith("<<", j)) { let d = 0; for (let k = j; k < s.length; k++) { if (s.startsWith("<<", k)) { d++; k++; } else if (s.startsWith(">>", k)) { d--; k++; if (!d) return s.slice(j, k + 1); } } return s.slice(j); }
  if (s[j] === "[") { let d = 0; for (let k = j; k < s.length; k++) { if (s[k] === "[") d++; else if (s[k] === "]" && !--d) return s.slice(j, k + 1); } return s.slice(j); }
  return /^(\d+\s+\d+\s+R|\/[^\s/<>[\]()]+|[^\s/<>[\]]+)/.exec(s.slice(j))?.[0];
}

function cmapOku(c: string): { harita: Map<string, string>; bayt: number } {
  const harita = new Map<string, string>();
  const hex = (h: string) => { let o = ""; for (let i = 0; i + 4 <= h.length; i += 4) o += String.fromCharCode(parseInt(h.slice(i, i + 4), 16)); if (h.length % 4) o += String.fromCharCode(parseInt(h.slice(-2), 16)); return o; };
  let bayt = 2;
  const alan = /begincodespacerange\s*<([0-9a-fA-F]+)>/.exec(c);
  if (alan) bayt = Math.max(1, alan[1].length / 2);
  for (const blok of c.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) for (const x of blok[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g)) harita.set(x[1].toLowerCase(), hex(x[2]));
  for (const blok of c.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const x of blok[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<[0-9a-fA-F]*>|\[[^\]]*\])/g)) {
      const a = parseInt(x[1], 16), z = parseInt(x[2], 16), w = x[1].length;
      if (z - a > 5000) continue;
      if (x[3].startsWith("[")) { const l = [...x[3].matchAll(/<([0-9a-fA-F]*)>/g)].map((y) => hex(y[1])); for (let k = a; k <= z; k++) harita.set(k.toString(16).padStart(w, "0"), l[k - a] ?? ""); }
      else { const h = x[3].slice(1, -1); const t = parseInt(h, 16); for (let k = a; k <= z; k++) harita.set(k.toString(16).padStart(w, "0"), hex((t + k - a).toString(16).padStart(h.length, "0"))); }
    }
  }
  return { harita, bayt };
}

function dizgeBaytlari(t: string): number[] {
  // Yazılı dize (kaçışlı) → baytlar
  const o: number[] = [];
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c !== "\\") { o.push(c.charCodeAt(0) & 255); continue; }
    const n = t[++i];
    if (n === undefined) break;
    const k: Record<string, number> = { n: 10, r: 13, t: 9, b: 8, f: 12, "(": 40, ")": 41, "\\": 92 };
    if (n in k) o.push(k[n]);
    else if (/[0-7]/.test(n)) { let s = n; while (s.length < 3 && /[0-7]/.test(t[i + 1] ?? "")) s += t[++i]; o.push(parseInt(s, 8) & 255); }
    else if (n === "\r") { if (t[i + 1] === "\n") i++; } else if (n !== "\n") o.push(n.charCodeAt(0) & 255);
  }
  return o;
}

export function pdfMetni(b: Buffer): { metin: string; sayfa: number } {
  try {
    const h = nesneler(b);
    const cmapOnbellek = new Map<number, ReturnType<typeof cmapOku> | null>();
    const yaziTipi = (fontNo: number) => {
      if (cmapOnbellek.has(fontNo)) return cmapOnbellek.get(fontNo)!;
      const f = h.get(fontNo);
      const tu = ref(f ? deger(f.metin, "ToUnicode") : undefined);
      const c = Number.isFinite(tu) ? h.get(tu)?.akis?.toString("latin1") : undefined;
      const sonuc = c ? cmapOku(c) : null;
      cmapOnbellek.set(fontNo, sonuc);
      return sonuc;
    };
    // Sayfalar: /Pages ağacı sırasıyla; bulunamazsa nesne sırası.
    const sayfalar: number[] = [];
    const katalog = [...h.values()].find((n) => /\/Type\s*\/Catalog/.test(n.metin));
    const gez = (no: number, d = 0) => {
      const n = h.get(no); if (!n || d > 40) return;
      if (/\/Type\s*\/Page(?!s)/.test(n.metin)) { sayfalar.push(no); return; }
      const k = deger(n.metin, "Kids"); if (k) for (const x of k.matchAll(/(\d+)\s+\d+\s+R/g)) gez(Number(x[1]), d + 1);
    };
    if (katalog) gez(ref(deger(katalog.metin, "Pages")));
    if (!sayfalar.length) for (const [no, n] of h) if (/\/Type\s*\/Page(?!s)/.test(n.metin)) sayfalar.push(no);

    const satirlar: string[] = [];
    for (const no of sayfalar) {
      const sayfa = h.get(no)!;
      let kaynak = deger(sayfa.metin, "Resources");
      if (kaynak && /^\d+\s+\d+\s+R$/.test(kaynak)) kaynak = h.get(ref(kaynak))?.metin;
      let fontlar = kaynak ? deger(kaynak, "Font") : undefined;
      if (fontlar && /^\d+\s+\d+\s+R$/.test(fontlar)) fontlar = h.get(ref(fontlar))?.metin;
      const fontHarita = new Map<string, number>();
      if (fontlar) for (const x of fontlar.matchAll(/\/([^\s/<>[\]()]+)\s+(\d+)\s+\d+\s+R/g)) fontHarita.set(x[1], Number(x[2]));
      const icerik = deger(sayfa.metin, "Contents");
      const akislar = icerik ? [...icerik.matchAll(/(\d+)\s+\d+\s+R/g)].map((x) => h.get(Number(x[1]))?.akis).filter((x): x is Buffer => !!x) : [];
      // Contents bir dizi nesnesine işaret edebilir
      if (icerik && akislar.length === 1 && !h.get(ref(icerik))?.akis) {
        const d = h.get(ref(icerik))?.metin ?? "";
        akislar.splice(0, 1, ...[...d.matchAll(/(\d+)\s+\d+\s+R/g)].map((x) => h.get(Number(x[1]))?.akis).filter((x): x is Buffer => !!x));
      }
      const c = Buffer.concat(akislar).toString("latin1");
      let font: ReturnType<typeof cmapOku> | null = null;
      let satir = "";
      let sonY: number | null = null;
      const coz = (bytes: number[]) => {
        if (font?.harita.size) {
          let o = "";
          for (let i = 0; i < bytes.length; i += font.bayt) {
            const k = bytes.slice(i, i + font.bayt).map((x) => x.toString(16).padStart(2, "0")).join("");
            o += font.harita.get(k) ?? font.harita.get(k.replace(/^0+/, "").padStart(2, "0")) ?? "";
          }
          return o;
        }
        return String.fromCharCode(...bytes.filter((x) => x >= 32 || x === 9));
      };
      const tok = /\((?:\\[\s\S]|[^\\)])*\)|<[0-9a-fA-F\s]*>|\[|\]|\/[^\s/<>[\]()]+|-?\d*\.?\d+|[A-Za-z'"*]+/g;
      const yigin: string[] = [];
      let dizi: string[] | null = null;
      let m: RegExpExecArray | null;
      const dizgeCoz = (t: string) => t.startsWith("(") ? coz(dizgeBaytlari(t.slice(1, -1))) : coz((t.slice(1, -1).replace(/\s/g, "").match(/../g) ?? []).map((x) => parseInt(x, 16)));
      while ((m = tok.exec(c))) {
        const t = m[0];
        if (t === "[") { dizi = []; continue; }
        if (t === "]") { if (dizi) yigin.push(JSON.stringify(dizi)); dizi = null; continue; }
        if (dizi) { dizi.push(t); continue; }
        if (/^[A-Za-z'"*]+$/.test(t) && !/^(true|false|null)$/.test(t)) {
          if (t === "Tf") { const ad = yigin[yigin.length - 2]?.slice(1); const fno = ad ? fontHarita.get(ad) : undefined; font = fno !== undefined ? yaziTipi(fno) : null; }
          else if (t === "Tj" || t === "'" || t === '"') { if (t !== "Tj") { satirlar.push(satir); satir = ""; } const s = yigin[yigin.length - 1]; if (s) satir += dizgeCoz(s); }
          else if (t === "TJ") {
            const l = JSON.parse(yigin[yigin.length - 1] ?? "[]") as string[];
            for (const x of l) { if (x.startsWith("(") || x.startsWith("<")) satir += dizgeCoz(x); else if (Number(x) < -180 && !satir.endsWith(" ")) satir += " "; }
          } else if (t === "Td" || t === "TD" || t === "Tm") {
            const y = Number(yigin[yigin.length - 1]);
            const yeni: number = t === "Tm" ? y : (sonY ?? 0) + y;
            if (t === "Tm" ? sonY !== null && Math.abs(yeni - sonY) > 1 : Math.abs(y) > 1) { satirlar.push(satir); satir = ""; }
            else if (satir && !satir.endsWith(" ")) satir += " ";
            sonY = yeni;
          } else if (t === "T*") { satirlar.push(satir); satir = ""; }
          else if (t === "ET") { /* blok sonu */ }
          yigin.length = 0;
          continue;
        }
        yigin.push(t);
      }
      if (satir) satirlar.push(satir);
      satirlar.push("");
    }
    const metin = satirlar.map((x) => x.replace(/\s+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
    return { metin, sayfa: sayfalar.length };
  } catch {
    return { metin: "", sayfa: 0 };
  }
}
