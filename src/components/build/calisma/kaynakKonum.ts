/**
 * Kaynak HTML'de bir öğenin YERİNİ bulur (DOM'a çevirip yeniden yazmadan). Önizlemedeki seçici
 * "body > div:nth-of-type(2) > h1:nth-of-type(1)" biçimindedir; kaynak etiket etiket taranır, açılış etiketinin ve
 * iç içeriğin karakter konumları döner. Böylece görsel düzenleme yalnız o etiketi değiştirir; dosyanın geri kalanı,
 * biçimi ve kullanıcının yazım tarzı aynen korunur.
 */
const BOS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const HAM = new Set(["script", "style", "textarea", "title"]);
const ETIKET = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/gi;

export type Konum = { acilisBas: number; acilisSon: number; icBas: number; icSon: number; oznitelikler: string; etiket: string };

function yolCoz(secici: string): [string, number][] | null {
  const p = secici.split(">").map((x) => x.trim()).filter(Boolean);
  if (p[0] !== "body") return null;
  const l: [string, number][] = [];
  for (const x of p.slice(1)) {
    const m = /^([a-z][\w-]*):nth-of-type\((\d+)\)$/i.exec(x);
    if (!m) return null;
    l.push([m[1].toLowerCase(), Number(m[2])]);
  }
  return l;
}

export function konumBul(html: string, secici: string): Konum | null {
  const hedef = yolCoz(secici);
  if (!hedef) return null;
  type Cerceve = { etiket: string; yol: [string, number][] | null; sayac: Record<string, number>; bulundu?: Konum };
  const yigin: Cerceve[] = [{ etiket: "#kok", yol: null, sayac: {} }];
  let sonuc: Konum | null = null;
  ETIKET.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ETIKET.exec(html))) {
    if (m[1]) {
      // kapanış: eşleşen çerçeveye kadar kapat (gevşek)
      const ad = m[1].toLowerCase();
      const i = yigin.map((c) => c.etiket).lastIndexOf(ad);
      if (i <= 0) continue;
      // Aradaki kapanmamış öğeler örtük kapanır; hedef öğe kapanınca iç içeriğin sonu bu kapanış etiketidir.
      while (yigin.length > i) {
        const c = yigin.pop()!;
        if (c.bulundu) { c.bulundu.icSon = m.index; return c.bulundu; }
      }
      continue;
    }
    if (!m[2]) continue;
    const ad = m[2].toLowerCase();
    const ust = yigin[yigin.length - 1];
    let yol: [string, number][] | null = null;
    if (ad === "body") yol = [];
    else if (ust.yol) { ust.sayac[ad] = (ust.sayac[ad] ?? 0) + 1; yol = [...ust.yol, [ad, ust.sayac[ad]]]; }
    const eslesti = yol && yol.length === hedef.length && yol.every(([a, n], i) => a === hedef[i][0] && n === hedef[i][1]);
    const konum: Konum | undefined = eslesti ? { acilisBas: m.index, acilisSon: m.index + m[0].length, icBas: m.index + m[0].length, icSon: -1, oznitelikler: m[3] ?? "", etiket: ad } : undefined;
    if (BOS.has(ad) || m[4] === "/") { if (konum) { konum.icSon = konum.icBas; return konum; } continue; }
    if (HAM.has(ad)) {
      const kapa = new RegExp(`</${ad}\\s*>`, "ig");
      kapa.lastIndex = ETIKET.lastIndex;
      const k = kapa.exec(html);
      if (konum) { konum.icSon = k ? k.index : html.length; return konum; }
      ETIKET.lastIndex = k ? k.index + k[0].length : html.length;
      continue;
    }
    yigin.push({ etiket: ad, yol, sayac: {}, bulundu: konum });
    if (konum) sonuc = konum;
  }
  return sonuc && sonuc.icSon >= 0 ? sonuc : null;
}

/** Açılış etiketindeki style özniteliğine özellikleri yazar (yoksa ekler); diğer öznitelikler aynen kalır. */
export function stilYaz(acilis: string, stiller: Record<string, string>): string {
  const m = /\sstyle\s*=\s*("([^"]*)"|'([^']*)')/i.exec(acilis);
  const eski = m ? (m[2] ?? m[3] ?? "") : "";
  const harita = new Map<string, string>();
  for (const p of eski.split(";")) { const i = p.indexOf(":"); if (i > 0) harita.set(p.slice(0, i).trim().toLowerCase(), p.slice(i + 1).trim()); }
  for (const [k, v] of Object.entries(stiller)) { if (v) harita.set(k, v); else harita.delete(k); }
  const yeni = [...harita].map(([k, v]) => `${k}: ${v}`).join("; ");
  if (m) return acilis.slice(0, m.index) + (yeni ? ` style="${yeni.replace(/"/g, "'")};"` : "") + acilis.slice(m.index + m[0].length);
  if (!yeni) return acilis;
  const son = acilis.endsWith("/>") ? acilis.length - 2 : acilis.length - 1;
  return `${acilis.slice(0, son).replace(/\s+$/, "")} style="${yeni.replace(/"/g, "'")};"${acilis.slice(son)}`;
}

/** Açılış etiketinde bir özniteliği değiştirir ya da ekler. */
export function oznitelikYaz(acilis: string, ad: string, deger: string): string {
  const re = new RegExp(`\\s${ad}\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+)`, "i");
  const v = ` ${ad}="${deger.replace(/"/g, "&quot;")}"`;
  if (re.test(acilis)) return acilis.replace(re, v);
  const son = acilis.endsWith("/>") ? acilis.length - 2 : acilis.length - 1;
  return acilis.slice(0, son).replace(/\s+$/, "") + v + acilis.slice(son);
}
