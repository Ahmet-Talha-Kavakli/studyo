#!/usr/bin/env node
// Vayra CLI — bağımlılıksız, Node 18+. Vayra API v1'i komut satırından kullanır.
// Kurulum:  curl -fsSL __BASE__/cli/vayra.mjs -o vayra.mjs && node vayra.mjs login vy_live_…
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const VARSAYILAN_ADRES = "__BASE__";
const AYAR_DOSYASI = path.join(os.homedir(), ".vayra", "config.json");
const renk = process.stdout.isTTY && !process.env.NO_COLOR;
const r = (k, s) => (renk ? `\x1b[${k}m${s}\x1b[0m` : s);
const soluk = (s) => r(2, s), yesil = (s) => r(32, s), kirmizi = (s) => r(31, s), mor = (s) => r(35, s), kalin = (s) => r(1, s);

function ayarOku() { try { return JSON.parse(fs.readFileSync(AYAR_DOSYASI, "utf8")); } catch { return {}; } }
function ayarYaz(a) { fs.mkdirSync(path.dirname(AYAR_DOSYASI), { recursive: true }); fs.writeFileSync(AYAR_DOSYASI, JSON.stringify(a, null, 2), { mode: 0o600 }); }

function bayraklar(argv) {
  const b = { _: [], param: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      const deger = v ?? (argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true);
      if (k === "param" || k === "p") b.param.push(String(deger)); else b[k] = deger;
    } else if (a === "-p") b.param.push(argv[++i]);
    else b._.push(a);
  }
  return b;
}

function baglam(b) {
  const a = ayarOku();
  const anahtar = b.key || process.env.VAYRA_API_KEY || a.key;
  const adres = String(b.base || process.env.VAYRA_BASE_URL || a.base || VARSAYILAN_ADRES).replace(/\/$/, "");
  return { anahtar, adres };
}

async function api(c, yontem, yol, govde) {
  if (!c.anahtar) hataVer("Anahtar yok. Önce: vayra login vy_live_…  (ya da VAYRA_API_KEY ortam değişkeni)");
  const res = await fetch(`${c.adres}/api/v1${yol}`, {
    method: yontem,
    headers: { authorization: `Bearer ${c.anahtar}`, "content-type": "application/json", "user-agent": "vayra-cli/1.0" },
    body: govde ? JSON.stringify(govde) : undefined,
  }).catch((e) => hataVer(`${c.adres} adresine ulaşılamadı: ${e.message}`));
  const j = await res.json().catch(() => ({}));
  if (!res.ok) hataVer(`${j.error?.code ?? res.status}: ${j.error?.message ?? "İstek başarısız"}`);
  return j;
}

function hataVer(m) { console.error(kirmizi("✖ ") + m); process.exit(1); }

/** --param anahtar=değer → sayı/boolean çözümlemesiyle */
function paramlar(liste) {
  const o = {};
  for (const p of liste) {
    const i = p.indexOf("=");
    if (i < 1) hataVer(`--param biçimi anahtar=değer olmalı: ${p}`);
    const k = p.slice(0, i), v = p.slice(i + 1);
    o[k] = v === "true" ? true : v === "false" ? false : v !== "" && !isNaN(Number(v)) ? Number(v) : v;
  }
  return o;
}

const DURUM = { queued: "kuyrukta", processing: "işleniyor", succeeded: yesil("tamamlandı"), failed: kirmizi("başarısız"), canceled: "iptal edildi" };

function uretimYaz(g) {
  console.log(`${kalin(g.id)}  ${g.model}  ${DURUM[g.status] ?? g.status}  ${soluk(`${g.credits ?? 0} kredi`)}`);
  for (const u of g.output?.urls ?? []) console.log(`  ${mor("→")} ${u}`);
  if (g.error) console.log(`  ${kirmizi(g.error.message)}`);
}

async function indir(urls, klasor) {
  fs.mkdirSync(klasor, { recursive: true });
  for (const [i, u] of urls.entries()) {
    const res = await fetch(u);
    if (!res.ok) { console.error(kirmizi(`  indirilemedi: ${u}`)); continue; }
    const ad = path.basename(new URL(u).pathname) || `cikti-${i + 1}`;
    const hedef = path.join(klasor, ad);
    fs.writeFileSync(hedef, Buffer.from(await res.arrayBuffer()));
    console.log(`  ${yesil("↓")} ${hedef}`);
  }
}

const YARDIM = `${kalin("vayra")} — Vayra CLI

${kalin("Kullanım")}
  vayra login <anahtar> [--base <adres>]   Anahtarı kaydet (~/.vayra/config.json)
  vayra logout                             Kayıtlı anahtarı sil
  vayra account                            Bakiye ve anahtar bilgisi
  vayra models [--type image|video|audio|music|3d]
  vayra model <model>                      Girdi şeması
  vayra generate <model> "<prompt>" [-p oran=16:9 …] [--no-wait] [--out <klasör>] [--json]
  vayra status <id> [--out <klasör>]
  vayra list [--limit 20] [--status succeeded]
  vayra cancel <id>
  vayra mcp                                MCP istemci yapılandırmasını yazdır

${kalin("Ortam")}
  VAYRA_API_KEY, VAYRA_BASE_URL, NO_COLOR

${kalin("Örnek")}
  vayra generate nano-banana-pro "sisli bir orman, sinematik" -p aspect_ratio=16:9 --out ./ciktilar`;

async function main() {
  const b = bayraklar(process.argv.slice(2));
  const [komut, ...arg] = b._;
  const c = baglam(b);

  switch (komut) {
    case "login": {
      const anahtar = arg[0];
      if (!/^vy_(live|test)_[0-9a-f]{40}$/.test(anahtar ?? "")) hataVer("Geçerli bir anahtar ver: vayra login vy_live_…");
      const adres = String(b.base || c.adres);
      const hesap = await api({ anahtar, adres }, "GET", "/account");
      ayarYaz({ ...ayarOku(), key: anahtar, base: adres });
      console.log(`${yesil("✔")} Giriş yapıldı · ${hesap.key.environment === "live" ? "canlı" : "test"} anahtar ${soluk(hesap.key.id)}`);
      return;
    }
    case "logout": { const a = ayarOku(); delete a.key; ayarYaz(a); console.log(`${yesil("✔")} Anahtar silindi`); return; }
    case "account": case "whoami": {
      const h = await api(c, "GET", "/account");
      if (b.json) return console.log(JSON.stringify(h, null, 2));
      console.log(`${kalin("Anahtar")}   ${h.key.id} · ${h.key.environment === "live" ? "canlı" : "test"} · kapsam ${h.key.scope}`);
      console.log(`${kalin("Kredi")}     ${h.credits.available ?? "test (kredi harcamaz)"}`);
      console.log(`${kalin("Bu ay")}     ${h.credits.spent_this_month}${h.credits.monthly_limit ? ` / ${h.credits.monthly_limit}` : ""} kredi`);
      console.log(`${kalin("Hız")}       dakikada ${h.rate_limit.requests_per_minute} istek`);
      return;
    }
    case "models": {
      const l = await api(c, "GET", `/models${b.type ? `?type=${b.type}` : ""}`);
      if (b.json) return console.log(JSON.stringify(l, null, 2));
      const gen = Math.max(...l.data.map((m) => m.id.length));
      for (const m of l.data) console.log(`${m.id.padEnd(gen)}  ${soluk(m.type.padEnd(6))}  ${String(m.credits).padStart(4)} kredi  ${m.name}`);
      return;
    }
    case "model": {
      if (!arg[0]) hataVer("Model kimliği ver: vayra model nano-banana-pro");
      const m = await api(c, "GET", `/models/${arg[0]}`);
      if (b.json) return console.log(JSON.stringify(m, null, 2));
      console.log(`${kalin(m.name)} ${soluk(m.id)} · ${m.credits} kredi\n${m.description ?? ""}\n`);
      for (const a of m.input_schema) console.log(`  ${a.name}${a.required ? kirmizi("*") : " "} ${soluk(a.type)}${a.enum ? ` ${soluk(a.enum.join("|"))}` : ""}${a.default !== undefined ? soluk(` = ${a.default}`) : ""}`);
      return;
    }
    case "generate": case "gen": {
      const [model, ...soz] = arg;
      const prompt = soz.join(" ");
      if (!model || !prompt) hataVer('Kullanım: vayra generate <model> "<prompt>"');
      const bekle = !b["no-wait"];
      process.stderr.write(soluk(bekle ? "Üretiliyor…\n" : "Kuyruğa alınıyor…\n"));
      let g = await api(c, "POST", "/generations", { model, input: { prompt, ...paramlar(b.param) }, sync: bekle });
      // sync 55 sn'de döner; hâlâ sürüyorsa sorgulamaya devam
      while (bekle && (g.status === "queued" || g.status === "processing")) { await new Promise((s) => setTimeout(s, 2000)); g = await api(c, "GET", `/generations/${g.id}`); }
      if (b.json) console.log(JSON.stringify(g, null, 2)); else uretimYaz(g);
      if (b.out && g.output?.urls?.length) await indir(g.output.urls, String(b.out));
      if (g.status === "failed") process.exit(1);
      return;
    }
    case "status": case "get": {
      if (!arg[0]) hataVer("Üretim kimliği ver: vayra status gen_…");
      const g = await api(c, "GET", `/generations/${arg[0]}`);
      if (b.json) console.log(JSON.stringify(g, null, 2)); else uretimYaz(g);
      if (b.out && g.output?.urls?.length) await indir(g.output.urls, String(b.out));
      return;
    }
    case "list": case "ls": {
      const q = new URLSearchParams({ limit: String(b.limit ?? 20), ...(b.status ? { status: String(b.status) } : {}) });
      const l = await api(c, "GET", `/generations?${q}`);
      if (b.json) return console.log(JSON.stringify(l, null, 2));
      if (!l.data.length) return console.log(soluk("Son 24 saatte üretim yok."));
      for (const g of l.data) console.log(`${g.id}  ${g.model.padEnd(18)}  ${(DURUM[g.status] ?? g.status)}  ${soluk(new Date(g.created_at).toLocaleString())}`);
      return;
    }
    case "cancel": {
      if (!arg[0]) hataVer("Üretim kimliği ver: vayra cancel gen_…");
      const g = await api(c, "POST", `/generations/${arg[0]}/cancel`);
      console.log(`${yesil("✔")} ${g.id} iptal edildi; kredi iade edildi`);
      return;
    }
    case "mcp": {
      console.log(JSON.stringify({ mcpServers: { vayra: { type: "http", url: `${c.adres}/api/mcp`, headers: { Authorization: `Bearer ${c.anahtar ?? "vy_live_…"}` } } } }, null, 2));
      return;
    }
    case undefined: case "help": case "--help": console.log(YARDIM); return;
    default: hataVer(`Bilinmeyen komut: ${komut}\n\n${YARDIM}`);
  }
}

main();
