/**
 * Sistem şablon dili (istemci ve sunucu ortak). Metin alanlarında {{ ... }} göndermeleri:
 *   {{tetik}}  {{tetik.alan.alt}}  {{tetik.liste.0.ad}}  {{tetik["boşluklu ad"]}}
 *   {{adim.<kimlik ya da sıra no>}}  metin çıktısı;  .cikti metin çıktısı;  .hata hata iletisi;  .<alan.yol> JSON çıktısı
 *   {{dongu.oge}} {{dongu.oge.alan}} {{dongu.sira}} {{dongu.toplam}}   (en içteki döngü)
 *   {{hata.mesaj}} {{hata.adim}}   (hata dalının içinde)
 *   {{tarih}} {{saat}} {{simdi}} {{simdi.tr}} {{calisma.id}} {{calisma.no}} {{calisma.devam}} {{sistem.ad}}
 *   {{degisken.ad}} hesap değişkeni, {{sir.ad}} şifreli sır (günlükte ve çıktılarda maskelenir)
 * JSON alanlarında (gövde, girdi, kayıt alanları) değer, tırnak içindeyse kaçışlı metin, dışındaysa JSON olarak yazılır.
 * İşlevler dikey çizgiyle zincirlenir: {{tetik.ad | buyuk}}, {{adim.s1.kayitlar | alan("tutar") | toplam | tl}} (sistemIslev.ts).
 */
import { ifadeAyir, islevUygula } from "./sistemIslev";
export { SablonHatasi } from "./sistemIslev";
export type SablonSonuc = { veri?: unknown; cikti?: string; hata?: string };
export type SablonBaglam = {
  tetik: unknown;
  /** Kimlik ya da sıra numarasıyla adım sonucu. */
  adim: (ref: string) => SablonSonuc | undefined;
  dongu?: { oge: unknown; sira: number; toplam: number };
  hata?: { mesaj: string; adim: string };
  calisma?: { id: string; devam?: string; no?: number };
  degisken?: Record<string, string>;
  sir?: Record<string, string>;
  sistem?: { id: string; ad: string };
  simdi?: number;
};

/** "a.b[0]["c d"]" yolunu parçalara ayırır. */
export function yolParcala(ifade: string): string[] {
  const o: string[] = [];
  let i = 0;
  const s = ifade.trim();
  while (i < s.length) {
    if (s[i] === ".") { i++; continue; }
    if (s[i] === "[") {
      const k = s.indexOf("]", i);
      if (k < 0) break;
      let ic = s.slice(i + 1, k).trim();
      if ((ic.startsWith("\"") && ic.endsWith("\"")) || (ic.startsWith("'") && ic.endsWith("'"))) ic = ic.slice(1, -1);
      o.push(ic); i = k + 1; continue;
    }
    let j = i;
    while (j < s.length && s[j] !== "." && s[j] !== "[") j++;
    o.push(s.slice(i, j)); i = j;
  }
  return o.filter((x) => x !== "");
}
/** Parçaları şablon yoluna çevirir (gerekirse köşeli ayraçla). */
export function yolBirlestir(p: string[]): string {
  return p.map((x, i) => (/^[\p{L}\p{N}_-]+$/u.test(x) ? (i ? `.${x}` : x) : `["${x.replace(/"/g, "")}"]`)).join("");
}

export function yolOku(v: unknown, yol: string[]): unknown {
  let x = v;
  for (const p of yol) {
    if (typeof x === "string" && /^\s*[[{]/.test(x)) { try { x = JSON.parse(x); } catch { return undefined; } }
    if (Array.isArray(x)) { const n = Number(p); x = Number.isInteger(n) ? x[n < 0 ? x.length + n : n] : p === "uzunluk" ? x.length : undefined; }
    else if (x && typeof x === "object") x = (x as Record<string, unknown>)[p];
    else return undefined;
  }
  return x;
}
export const metne = (v: unknown) => (v === undefined || v === null ? "" : typeof v === "string" ? v : JSON.stringify(v));

const TR_AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
export function trTarihMetni(t: number) {
  const d = new Date(t + 3 * 3600_000);
  return `${d.getUTCDate()} ${TR_AY[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Türkiye saatiyle "5 Kasım 2026 14:30". */
export function trTarihSaatMetni(t: number) {
  return `${trTarihMetni(t)} ${new Date(t + 3 * 3600_000).toISOString().slice(11, 16)}`;
}

/** Tek göndermeyi çözer (bulunamazsa undefined); "yol | işlev(...)" zinciri varsa değere uygular. */
export function gondermeCoz(ifade: string, b: SablonBaglam): unknown {
  if (!ifade.includes("|")) return yolCoz(ifade, b);
  const { yol, islevler } = ifadeAyir(ifade);
  return islevUygula(yolCoz(yol, b), islevler);
}
function yolCoz(ifade: string, b: SablonBaglam): unknown {
  const p = yolParcala(ifade);
  if (!p.length) return undefined;
  const simdi = b.simdi ?? Date.now();
  switch (p[0]) {
    case "tarih": return trTarihMetni(simdi);
    case "saat": return new Date(simdi + 3 * 3600_000).toISOString().slice(11, 16);
    case "simdi": return p[1] === "tr" ? trTarihSaatMetni(simdi) : new Date(simdi).toISOString();
    case "degisken": return b.degisken && p[1] ? (p.length > 2 ? yolOku(b.degisken[p[1]], p.slice(2)) : b.degisken[p[1]]) : undefined;
    case "sir": return b.sir && p[1] ? b.sir[p[1]] : undefined;
    case "tetik": return yolOku(b.tetik, p.slice(1));
    case "dongu": return b.dongu ? yolOku(b.dongu, p.slice(1)) : undefined;
    case "hata": return b.hata ? yolOku(b.hata, p.slice(1)) : undefined;
    case "calisma": return b.calisma ? yolOku(b.calisma, p.slice(1)) : undefined;
    case "sistem": return b.sistem ? yolOku(b.sistem, p.slice(1)) : undefined;
    case "adim": {
      if (!p[1]) return undefined;
      const a = b.adim(p[1]);
      if (!a) return undefined;
      if (p.length === 2 || (p.length === 3 && p[2] === "cikti" && !(a.veri && typeof a.veri === "object" && "cikti" in (a.veri as object)))) return a.cikti ?? metne(a.veri);
      if (p.length === 3 && p[2] === "hata") return a.hata ?? "";
      return yolOku(a.veri, p.slice(2));
    }
  }
  return undefined;
}

const DESEN = /\{\{\s*([^{}]+?)\s*\}\}/g;

/** Metin alanı: göndermeleri metinle doldurur. */
export function sablonDoldur(s: string, b: SablonBaglam): string {
  return s.replace(DESEN, (_, ifade: string) => metne(gondermeCoz(ifade, b)));
}

/** Alanın tamamı tek göndermeyse (ör. {{tetik.urunler}}) değeri olduğu gibi döndürür. */
export function tekDeger(s: string, b: SablonBaglam): unknown {
  const m = /^\s*\{\{\s*([^{}]+?)\s*\}\}\s*$/.exec(s);
  return m ? gondermeCoz(m[1], b) : sablonDoldur(s, b);
}

/** JSON alanı: tırnak içindeki gönderme kaçışlı metin, dışındaki JSON değeri olur. */
export function sablonDoldurJson(s: string, b: SablonBaglam): string {
  let o = "", ic = false, i = 0;
  while (i < s.length) {
    if (s.startsWith("{{", i)) {
      const k = s.indexOf("}}", i + 2);
      if (k > 0) {
        const v = gondermeCoz(s.slice(i + 2, k), b);
        if (ic) o += JSON.stringify(metne(v)).slice(1, -1);
        else o += v === undefined ? "null" : typeof v === "string" ? (/^\s*[[{]/.test(v) && (() => { try { JSON.parse(v); return true; } catch { return false; } })() ? v : JSON.stringify(v)) : JSON.stringify(v);
        i = k + 2; continue;
      }
    }
    const c = s[i];
    if (c === "\\" && ic) { o += c + (s[i + 1] ?? ""); i += 2; continue; }
    if (c === "\"") ic = !ic;
    o += c; i++;
  }
  return o;
}

/** Metindeki göndermeler (veri seçicinin hapları için). */
export function gondermeler(s: string): { bas: number; son: number; ifade: string }[] {
  const o: { bas: number; son: number; ifade: string }[] = [];
  for (const m of s.matchAll(DESEN)) o.push({ bas: m.index!, son: m.index! + m[0].length, ifade: m[1] });
  return o;
}

/** Canlı önizleme parçaları: düz metin, çözülen değer, örneği olmayan gönderme ya da hata. */
export type OnizlemeParca = { tur: "duz" | "deger" | "yok" | "hata"; metin: string; ifade?: string };
export function onizle(s: string, b: SablonBaglam): OnizlemeParca[] {
  const o: OnizlemeParca[] = [];
  let i = 0;
  for (const g of gondermeler(s)) {
    if (g.bas > i) o.push({ tur: "duz", metin: s.slice(i, g.bas) });
    try {
      const v = gondermeCoz(g.ifade, b);
      o.push(v === undefined ? { tur: "yok", metin: "örnek yok", ifade: g.ifade } : { tur: "deger", metin: metne(v), ifade: g.ifade });
    } catch (e) { o.push({ tur: "hata", metin: (e as Error).message, ifade: g.ifade }); }
    i = g.son;
  }
  if (i < s.length) o.push({ tur: "duz", metin: s.slice(i) });
  return o;
}
