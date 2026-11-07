/**
 * Hafif sözdizimi renklendirici (HTML, CSS, JavaScript, JSON). Düzenleyicide saydam textarea'nın arkasındaki
 * <pre>'ye HTML üretir; metin konumları birebir korunur (yalnız span sarar). Büyük dosyalarda (200 KB üstü) düz metin.
 */
const kac = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sar = (s: string, c: string) => `<span class="vk-${c}">${kac(s)}</span>`;

const JS_ANAHTAR = new Set("const let var function return if else for while do class new import from export default async await try catch finally throw switch case break continue typeof instanceof this super null undefined true false of in delete void yield extends static get set".split(" "));

function js(k: string): string {
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(\d[\d_.]*(?:e[+-]?\d+)?)\b|([A-Za-z_$][\w$]*)(\s*\()?|(\.[A-Za-z_$][\w$]*)/g;
  let o = "", son = 0;
  for (const m of k.matchAll(re)) {
    o += kac(k.slice(son, m.index));
    if (m[1]) o += sar(m[1], "yorum");
    else if (m[2]) o += sar(m[2], "dizge");
    else if (m[3]) o += sar(m[3], "sayi");
    else if (m[4]) o += JS_ANAHTAR.has(m[4]) ? sar(m[4], "anahtar") + kac(m[5] ?? "") : m[5] ? sar(m[4], "islev") + kac(m[5]) : kac(m[4]);
    else if (m[6]) o += "." + sar(m[6].slice(1), "ozellik");
    son = m.index! + m[0].length;
  }
  return o + kac(k.slice(son));
}

function css(k: string): string {
  const re = /(\/\*[\s\S]*?\*\/)|(@[\w-]+)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(#[0-9a-fA-F]{3,8}\b)|(-?\d*\.?\d+(?:px|rem|em|vh|vw|%|s|ms|deg|fr)?)\b|([\w-]+)(\s*:)(?![^{]*\{)|([^{};\n]+)(\s*\{)/g;
  let o = "", son = 0;
  for (const m of k.matchAll(re)) {
    o += kac(k.slice(son, m.index));
    if (m[1]) o += sar(m[1], "yorum");
    else if (m[2]) o += sar(m[2], "anahtar");
    else if (m[3]) o += sar(m[3], "dizge");
    else if (m[4]) o += sar(m[4], "sayi");
    else if (m[5]) o += sar(m[5], "sayi");
    else if (m[6]) o += sar(m[6], "ozellik") + kac(m[7]);
    else if (m[8]) o += sar(m[8], "secici") + kac(m[9]);
    son = m.index! + m[0].length;
  }
  return o + kac(k.slice(son));
}

function html(k: string): string {
  // <script> ve <style> içleri kendi diliyle renklenir.
  const re = /(<!--[\s\S]*?-->)|(<script\b[^>]*>)([\s\S]*?)(<\/script>)|(<style\b[^>]*>)([\s\S]*?)(<\/style>)|(<\/?)([\w-]+)([^>]*?)(\/?>)/gi;
  const etiket = (ac: string, ad: string, oz: string, kapa: string) => {
    let o = kac(ac) + sar(ad, "etiket"), s = 0;
    for (const m of oz.matchAll(/([\w:@.-]+)(?:(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+))?/g)) {
      o += kac(oz.slice(s, m.index)) + sar(m[1], "ozellik") + (m[2] ? kac(m[2]) + sar(m[3] ?? "", "dizge") : "");
      s = m.index! + m[0].length;
    }
    return o + kac(oz.slice(s)) + kac(kapa);
  };
  let o = "", son = 0;
  for (const m of k.matchAll(re)) {
    o += kac(k.slice(son, m.index));
    if (m[1]) o += sar(m[1], "yorum");
    else if (m[2]) { const b = /^<(script)([^>]*)(>)$/i.exec(m[2])!; o += etiket("<", b[1], b[2], b[3]) + js(m[3]) + kac("</") + sar("script", "etiket") + kac(">"); }
    else if (m[5]) { const b = /^<(style)([^>]*)(>)$/i.exec(m[5])!; o += etiket("<", b[1], b[2], b[3]) + css(m[6]) + kac("</") + sar("style", "etiket") + kac(">"); }
    else if (m[9]) o += etiket(m[8], m[9], m[10], m[11]);
    son = m.index! + m[0].length;
  }
  return o + kac(k.slice(son));
}

export function vurgula(kod: string, yol: string): string {
  if (kod.length > 200_000) return kac(kod);
  const u = yol.split(".").pop()?.toLowerCase();
  if (u === "html" || u === "htm" || u === "svg" || u === "xml") return html(kod);
  if (u === "css") return css(kod);
  if (u === "js" || u === "mjs" || u === "json" || u === "webmanifest") return js(kod);
  return kac(kod);
}
