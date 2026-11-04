/**
 * Çalıştırılabilir kod örnekleri üretir: cURL, Python (requests), Node.js
 * (fetch) ve Go. Oyun alanı, Konsol, Dokümantasyon ve Örnekler aynı üreticiyi
 * kullanır; her örnek gerçek uç noktaya gerçek gövdeyle gider.
 */

export type Dil = "curl" | "python" | "node" | "go";
export const DILLER: { id: Dil; ad: string }[] = [
  { id: "curl", ad: "cURL" },
  { id: "python", ad: "Python" },
  { id: "node", ad: "Node.js" },
  { id: "go", ad: "Go" },
];

export interface KodIstek {
  taban: string;
  yontem: string;
  yol: string;
  anahtar?: string;
  govde?: unknown;
  baslik?: Record<string, string>;
}

const ANAHTAR_YER = "$VAYRA_API_KEY";

function pyDeger(v: unknown, girinti = 0): string {
  const b = "    ".repeat(girinti + 1), s = "    ".repeat(girinti);
  if (v === null || v === undefined) return "None";
  if (v === true) return "True";
  if (v === false) return "False";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return v.length ? `[${v.map((x) => pyDeger(x, girinti)).join(", ")}]` : "[]";
  const e = Object.entries(v as Record<string, unknown>);
  if (!e.length) return "{}";
  return `{\n${e.map(([k, x]) => `${b}${JSON.stringify(k)}: ${pyDeger(x, girinti + 1)}`).join(",\n")},\n${s}}`;
}

export function kodUret(dil: Dil, i: KodIstek): string {
  const url = `${i.taban}${i.yol}`;
  const anahtar = i.anahtar ?? ANAHTAR_YER;
  const json = i.govde !== undefined ? JSON.stringify(i.govde, null, 2) : null;
  const ek = Object.entries(i.baslik ?? {});

  if (dil === "curl") {
    const satirlar = [`curl -X ${i.yontem} "${url}"`, `  -H "Authorization: Bearer ${anahtar}"`];
    if (json) satirlar.push(`  -H "Content-Type: application/json"`);
    for (const [k, v] of ek) satirlar.push(`  -H "${k}: ${v}"`);
    if (json) satirlar.push(`  -d '${json.replace(/'/g, "'\\''")}'`);
    return satirlar.join(" \\\n");
  }

  if (dil === "python") {
    const anahtarSatir = i.anahtar ? `API_KEY = "${i.anahtar}"` : `API_KEY = os.environ["VAYRA_API_KEY"]`;
    const basliklar = [`"Authorization": f"Bearer {API_KEY}"`, ...ek.map(([k, v]) => `"${k}": "${v}"`)];
    return [
      i.anahtar ? "import requests" : "import os\nimport requests",
      "",
      anahtarSatir,
      "",
      `yanit = requests.${i.yontem.toLowerCase()}(`,
      `    "${url}",`,
      `    headers={${basliklar.join(", ")}},`,
      ...(i.govde !== undefined ? [`    json=${pyDeger(i.govde, 1)},`] : []),
      `    timeout=60,`,
      `)`,
      `yanit.raise_for_status()`,
      `print(yanit.json())`,
    ].join("\n");
  }

  if (dil === "node") {
    const basliklar = [`Authorization: \`Bearer \${${i.anahtar ? `"${i.anahtar}"` : "process.env.VAYRA_API_KEY"}}\``, ...(json ? [`"Content-Type": "application/json"`] : []), ...ek.map(([k, v]) => `"${k}": "${v}"`)];
    return [
      `const yanit = await fetch("${url}", {`,
      `  method: "${i.yontem}",`,
      `  headers: {`,
      ...basliklar.map((b) => `    ${b},`),
      `  },`,
      ...(json ? [`  body: JSON.stringify(${json.split("\n").join("\n  ")}),`] : []),
      `});`,
      ``,
      `if (!yanit.ok) throw new Error((await yanit.json()).error.message);`,
      `console.log(await yanit.json());`,
    ].join("\n");
  }

  // Go
  return [
    "package main",
    "",
    "import (",
    `\t"fmt"`,
    `\t"io"`,
    `\t"net/http"`,
    ...(i.anahtar ? [] : [`\t"os"`]),
    ...(json ? [`\t"strings"`] : []),
    ")",
    "",
    "func main() {",
    ...(json ? [`\tgovde := strings.NewReader(\`${JSON.stringify(i.govde)}\`)`, `\treq, _ := http.NewRequest("${i.yontem}", "${url}", govde)`, `\treq.Header.Set("Content-Type", "application/json")`] : [`\treq, _ := http.NewRequest("${i.yontem}", "${url}", nil)`]),
    `\treq.Header.Set("Authorization", "Bearer "+${i.anahtar ? `"${i.anahtar}"` : `os.Getenv("VAYRA_API_KEY")`})`,
    ...ek.map(([k, v]) => `\treq.Header.Set("${k}", "${v}")`),
    "",
    "\tyanit, err := http.DefaultClient.Do(req)",
    "\tif err != nil {",
    "\t\tpanic(err)",
    "\t}",
    "\tdefer yanit.Body.Close()",
    "\tgovdeYanit, _ := io.ReadAll(yanit.Body)",
    "\tfmt.Println(yanit.Status, string(govdeYanit))",
    "}",
  ].join("\n");
}

/** Üret + sonucu bekle akışının tam örneği (Hızlı başlangıç ve SDK sayfası). */
export function tamAkis(dil: Dil, taban: string, model: string, input: Record<string, unknown>): string {
  if (dil === "python") {
    return `import os, time, requests

API = "${taban}"
BASLIK = {"Authorization": f"Bearer {os.environ['VAYRA_API_KEY']}"}

# 1) Üretimi başlat
uretim = requests.post(f"{API}/generations", headers=BASLIK, json={
    "model": "${model}",
    "input": ${pyDeger(input, 1)},
}).json()

# 2) Bitene kadar bekle (webhook kullanıyorsan bu adım gerekmez)
while uretim["status"] in ("queued", "processing"):
    time.sleep(1.5)
    uretim = requests.get(uretim["urls"]["get"], headers=BASLIK).json()

if uretim["status"] != "succeeded":
    raise RuntimeError(uretim["error"])

print(uretim["output"]["urls"])`;
  }
  if (dil === "node") {
    return `const API = "${taban}";
const BASLIK = { Authorization: \`Bearer \${process.env.VAYRA_API_KEY}\`, "Content-Type": "application/json" };

// 1) Üretimi başlat
let uretim = await fetch(\`\${API}/generations\`, {
  method: "POST",
  headers: BASLIK,
  body: JSON.stringify({ model: "${model}", input: ${JSON.stringify(input)} }),
}).then((r) => r.json());

// 2) Bitene kadar bekle (webhook kullanıyorsan bu adım gerekmez)
while (uretim.status === "queued" || uretim.status === "processing") {
  await new Promise((r) => setTimeout(r, 1500));
  uretim = await fetch(uretim.urls.get, { headers: BASLIK }).then((r) => r.json());
}

if (uretim.status !== "succeeded") throw new Error(uretim.error.message);
console.log(uretim.output.urls);`;
  }
  if (dil === "go") return kodUret("go", { taban, yontem: "POST", yol: "/generations", govde: { model, input, sync: true } });
  return `# 1) Başlat
curl -s -X POST "${taban}/generations" \\
  -H "Authorization: Bearer $VAYRA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ model, input })}'

# 2) Yanıttaki id ile durumu sorgula
curl -s "${taban}/generations/gen_…" \\
  -H "Authorization: Bearer $VAYRA_API_KEY"

# Ya da tek adımda bekle (en çok 55 sn):
curl -s -X POST "${taban}/generations" \\
  -H "Authorization: Bearer $VAYRA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ model, input, sync: true })}'`;
}

/** Webhook imza doğrulama örneği. */
export function imzaDogrulama(dil: "node" | "python"): string {
  if (dil === "python") {
    return `import hmac, hashlib, time

def imza_dogrula(govde: bytes, baslik: str, sir: str, tolerans=300) -> bool:
    parcalar = dict(p.split("=", 1) for p in baslik.split(","))
    t, v1 = parcalar["t"], parcalar["v1"]
    if abs(time.time() - int(t)) > tolerans:
        return False  # tekrar oynatma saldırısı
    beklenen = hmac.new(sir.encode(), f"{t}.".encode() + govde, hashlib.sha256).hexdigest()
    return hmac.compare_digest(beklenen, v1)

# Flask
@app.post("/vayra/webhook")
def webhook():
    if not imza_dogrula(request.get_data(), request.headers["Vayra-Signature"], os.environ["VAYRA_WEBHOOK_SECRET"]):
        return "", 400
    olay = request.get_json()
    if olay["type"] == "generation.completed":
        kaydet(olay["data"]["output"]["urls"])
    return "", 200`;
  }
  return `import crypto from "node:crypto";

export function imzaDogrula(govde, baslik, sir, tolerans = 300) {
  const { t, v1 } = Object.fromEntries(baslik.split(",").map((p) => p.split("=")));
  if (Math.abs(Date.now() / 1000 - Number(t)) > tolerans) return false; // tekrar oynatma
  const beklenen = crypto.createHmac("sha256", sir).update(\`\${t}.\${govde}\`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(beklenen), Buffer.from(v1));
}

// Express — gövdeyi HAM okumak şart (JSON'a çevrilmiş gövdeyle imza tutmaz)
app.post("/vayra/webhook", express.raw({ type: "application/json" }), (req, res) => {
  if (!imzaDogrula(req.body.toString(), req.get("Vayra-Signature"), process.env.VAYRA_WEBHOOK_SECRET)) {
    return res.sendStatus(400);
  }
  const olay = JSON.parse(req.body);
  if (olay.type === "generation.completed") kaydet(olay.data.output.urls);
  res.sendStatus(200); // 10 sn içinde 2xx dönmezsen 2 ve 8 sn sonra yeniden denenir
});`;
}
