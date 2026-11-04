/**
 * Hafif sözdizimi renklendirici — bağımlılıksız. cURL/bash, Python,
 * JavaScript/TypeScript, Go ve JSON'u tanır; her satırı renkli parçalara böler.
 * Kurallar sıralıdır: ilk eşleşen kazanır (yorum > metin > anahtar kelime …).
 */

export type ParcaTur = "yorum" | "metin" | "anahtar" | "sayi" | "sabit" | "fonksiyon" | "ozellik" | "bayrak" | "degisken" | "noktalama" | "komut" | "dekorator" | "tip" | "duz";
export interface Parca { t: string; c: ParcaTur }
export type KodDili = "bash" | "python" | "js" | "go" | "json" | "http" | "duz";

type Kural = [RegExp, ParcaTur | ((m: string, sonraki: string) => ParcaTur)];

const ORTAK_SAYI: Kural = [/\b\d+(?:\.\d+)?\b/y, "sayi"];

const KURALLAR: Record<Exclude<KodDili, "duz">, Kural[]> = {
  json: [
    [/"(?:[^"\\]|\\.)*"(?=\s*:)/y, "ozellik"],
    [/"(?:[^"\\]|\\.)*"/y, "metin"],
    [/\b(?:true|false|null)\b/y, "sabit"],
    [/-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/y, "sayi"],
    [/[{}[\],:]/y, "noktalama"],
  ],
  bash: [
    [/#.*/y, "yorum"],
    [/'(?:[^'\\]|\\.)*'/y, "metin"],
    [/"(?:[^"\\]|\\.)*"/y, "metin"],
    [/\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/y, "degisken"],
    [/(?<=^|\s)--?[A-Za-z][\w-]*/my, "bayrak"],
    [/(?<=^\s*|\|\s*|&&\s*)(?:curl|export|npm|pnpm|yarn|pip|go|node|python3?|echo|cd|jq|bun)\b/my, "komut"],
    [/\\$/my, "noktalama"],
    [/[|&;=]/y, "noktalama"],
    ORTAK_SAYI,
  ],
  python: [
    [/#.*/y, "yorum"],
    [/[rfbu]{0,2}"""[\s\S]*?"""/y, "metin"],
    [/[rfbu]{0,2}"(?:[^"\\]|\\.)*"/y, "metin"],
    [/[rfbu]{0,2}'(?:[^'\\]|\\.)*'/y, "metin"],
    [/@[A-Za-z_][\w.]*/y, "dekorator"],
    [/\b(?:import|from|as|def|return|if|elif|else|while|for|in|not|and|or|raise|with|try|except|finally|class|lambda|pass|break|continue|async|await|yield|is)\b/y, "anahtar"],
    [/\b(?:True|False|None)\b/y, "sabit"],
    [/\b(?:str|int|float|bool|bytes|dict|list)\b/y, "tip"],
    [/\b[A-Za-z_]\w*(?=\s*\()/y, "fonksiyon"],
    [/(?<=\.)[A-Za-z_]\w*/y, "ozellik"],
    ORTAK_SAYI,
    [/[()[\]{}.,:=+\-*/<>!%]/y, "noktalama"],
  ],
  js: [
    [/\/\/.*/y, "yorum"],
    [/\/\*[\s\S]*?\*\//y, "yorum"],
    [/`(?:[^`\\]|\\.)*`/y, "metin"],
    [/"(?:[^"\\]|\\.)*"/y, "metin"],
    [/'(?:[^'\\]|\\.)*'/y, "metin"],
    [/\b(?:const|let|var|await|async|function|return|if|else|throw|new|import|from|export|default|while|for|of|in|typeof|try|catch|class|extends|type|interface|public|private|static|readonly|implements|as|for)\b/y, "anahtar"],
    [/\b(?:true|false|null|undefined)\b/y, "sabit"],
    [/\b(?:process|console|JSON|Math|Date|Buffer|Promise|Object|Number|String)\b/y, "tip"],
    [/\b[A-Za-z_$][\w$]*(?=\s*\()/y, "fonksiyon"],
    [/(?<=\.)[A-Za-z_$][\w$]*/y, "ozellik"],
    [/\b[A-Za-z_$][\w$]*(?=\s*:)/y, "ozellik"],
    ORTAK_SAYI,
    [/=>|[()[\]{}.,:;=+\-*/<>!?&|]/y, "noktalama"],
  ],
  go: [
    [/\/\/.*/y, "yorum"],
    [/`[^`]*`/y, "metin"],
    [/"(?:[^"\\]|\\.)*"/y, "metin"],
    [/\b(?:package|import|func|var|const|return|if|else|for|range|defer|go|type|struct|interface|map|chan|select|case|switch|break|continue)\b/y, "anahtar"],
    [/\b(?:nil|true|false|err)\b/y, "sabit"],
    [/\b(?:string|int|int64|float64|bool|byte|error)\b/y, "tip"],
    [/\b[A-Za-z_]\w*(?=\s*\()/y, "fonksiyon"],
    [/(?<=\.)[A-Za-z_]\w*/y, "ozellik"],
    ORTAK_SAYI,
    [/:=|[()[\]{}.,:;=+\-*/<>!&|]/y, "noktalama"],
  ],
  http: [
    [/^(?:GET|POST|PUT|DELETE|PATCH)\b/y, "anahtar"],
    [/^[A-Za-z-]+(?=:)/y, "ozellik"],
    [/"(?:[^"\\]|\\.)*"(?=\s*:)/y, "ozellik"],
    [/"(?:[^"\\]|\\.)*"/y, "metin"],
    [/\b(?:true|false|null)\b/y, "sabit"],
    ORTAK_SAYI,
    [/[{}[\],:]/y, "noktalama"],
  ],
};

/** Metni satır satır renkli parçalara böler. */
export function renklendir(kod: string, dil: KodDili): Parca[][] {
  if (dil === "duz") return kod.split("\n").map((s) => [{ t: s, c: "duz" as ParcaTur }]);
  const kurallar = KURALLAR[dil];
  const satirlar: Parca[][] = [[]];
  let i = 0, duz = "";
  const ekle = (t: string, c: ParcaTur) => {
    const parcalar = t.split("\n");
    parcalar.forEach((p, j) => {
      if (j > 0) satirlar.push([]);
      if (p) {
        const son = satirlar[satirlar.length - 1];
        const onceki = son[son.length - 1];
        if (onceki && onceki.c === c && c === "duz") onceki.t += p; else son.push({ t: p, c });
      }
    });
  };
  // Satır başı bağımlı kurallar için: her eşleşmede kodun o noktasından başlayan bir pencere kullanılır.
  while (i < kod.length) {
    let eslesti = false;
    for (const [re, tur] of kurallar) {
      re.lastIndex = i;
      // `^` kuralları satır başında çalışsın diye çok satırlı bayrakla eşdeğer kontrol
      if (re.source.startsWith("^") && i > 0 && kod[i - 1] !== "\n") continue;
      const m = re.source.startsWith("^") ? new RegExp(re.source.slice(1), "y") : re;
      m.lastIndex = i;
      const r = m.exec(kod);
      if (r && r[0].length) {
        if (duz) { ekle(duz, "duz"); duz = ""; }
        ekle(r[0], typeof tur === "function" ? tur(r[0], kod.slice(i + r[0].length, i + r[0].length + 2)) : tur);
        i += r[0].length;
        eslesti = true;
        break;
      }
    }
    if (!eslesti) { duz += kod[i]; i++; }
  }
  if (duz) ekle(duz, "duz");
  return satirlar;
}

/** Tokyo Night esinli palet — koyu yüzeyde okunaklı, renkli ama bağırmayan. */
export const PARCA_RENK: Record<ParcaTur, string> = {
  yorum: "#5c6370",
  metin: "#9ece6a",
  anahtar: "#bb9af7",
  sayi: "#ff9e64",
  sabit: "#ff9e64",
  fonksiyon: "#7aa2f7",
  ozellik: "#7dcfff",
  bayrak: "#f7768e",
  degisken: "#e0af68",
  noktalama: "#89ddff",
  komut: "#7aa2f7",
  dekorator: "#e0af68",
  tip: "#2ac3de",
  duz: "#c0caf5",
};

export const dilBul = (d: string): KodDili =>
  d === "curl" || d === "bash" || d === "sh" ? "bash" : d === "python" || d === "py" ? "python" : d === "node" || d === "js" || d === "ts" ? "js" : d === "go" ? "go" : d === "json" ? "json" : d === "http" ? "http" : "duz";
