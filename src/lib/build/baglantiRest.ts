import "server-only";
import type { RestIslemTanim, RestParametre } from "./baglantiKatalog";
import type { AdaptorAlan } from "./baglantiAdaptorTanim";
import { AdaptorHata, kisalt } from "./baglantiAdaptor";
import { mcpAdresi, mcpFetch, type McpArac } from "./mcpIstemci";

/**
 * REST bağlantıları: resmî MCP sunucusu olmayan servisler. Araçlar ya servisin OpenAPI (3.x) / Swagger (2.0)
 * belgesinden üretilir ya da kullanıcı uç noktaları elle ekler. İstekler Vayra sunucusundan mcpFetch (SSRF
 * korumalı guvenliFetch) ile gider; anahtarlar kasada şifreli durur ve yalnız istek anında başlığa ya da sorguya
 * eklenir. YAML belgeleri için bağımlılıksız, OpenAPI'nin kullandığı alt kümeyi okuyan bir ayrıştırıcı vardır.
 */
export type RestYetki = "bearer" | "baslik" | "sorgu" | "temel" | "yok";
export type RestEkAlan = { ad: string; konum: "baslik" | "sorgu"; gizli?: boolean; aciklama?: string; deger?: string };
export type RestTanim = {
  taban: string; yetki: RestYetki; anahtarAd?: string; ekAlanlar?: RestEkAlan[]; islemler: RestIslemTanim[];
  /** OpenAPI belgesinin adresi (şemayı yenilemek için). */
  kaynak?: string; baslik?: string; surum?: string; aciklama?: string;
};

/* ───────────── YAML (OpenAPI alt kümesi) ───────────── */
type Satir = { g: number; m: string };
function yorumSil(s: string): string {
  let tirnak: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (tirnak) { if (c === tirnak && s[i - 1] !== "\\") tirnak = null; continue; }
    if (c === '"' || c === "'") { if (i === 0 || /[\s:[{,-]/.test(s[i - 1])) tirnak = c; continue; }
    if (c === "#" && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i).trimEnd();
  }
  return s;
}
function akisCoz(s: string): unknown {
  let i = 0;
  const bosluk = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  const deger = (): unknown => {
    bosluk();
    if (s[i] === "[") { i++; const l: unknown[] = []; bosluk(); if (s[i] === "]") { i++; return l; } for (;;) { l.push(deger()); bosluk(); if (s[i] === ",") { i++; continue; } if (s[i] === "]") { i++; break; } break; } return l; }
    if (s[i] === "{") {
      i++; const o: Record<string, unknown> = {}; bosluk(); if (s[i] === "}") { i++; return o; }
      for (;;) { bosluk(); const k = String(skaler(oku([",", "}", ":"]))); if (s[i] === ":") { i++; o[k] = deger(); } else o[k] = null; bosluk(); if (s[i] === ",") { i++; continue; } if (s[i] === "}") { i++; break; } break; }
      return o;
    }
    return skaler(oku([",", "]", "}"]));
  };
  const oku = (son: string[]) => {
    bosluk();
    if (s[i] === '"' || s[i] === "'") { const q = s[i]; let j = i + 1; while (j < s.length && !(s[j] === q && s[j - 1] !== "\\")) j++; const r = s.slice(i, j + 1); i = j + 1; return r; }
    let j = i; while (j < s.length && !son.includes(s[j])) j++;
    const r = s.slice(i, j).trim(); i = j; return r;
  };
  return deger();
}
function skaler(ham: string): unknown {
  const s = ham.trim();
  if (s === "" || s === "~" || s === "null" || s === "Null" || s === "NULL") return null;
  if (s === "true" || s === "True") return true;
  if (s === "false" || s === "False") return false;
  if (s.startsWith('"')) { try { return JSON.parse(s); } catch { return s.slice(1, -1); } }
  if (s.startsWith("'")) return s.slice(1, -1).replace(/''/g, "'");
  if (s.startsWith("[") || s.startsWith("{")) return akisCoz(s);
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s) && !/^0\d/.test(s)) return Number(s);
  return s.replace(/^[&*!][^\s]*\s+/, "");
}
/** Anahtar: değer ayrımı (tırnaklı anahtarlar dahil). */
function anahtarAyir(m: string): [string, string] | null {
  if (m.startsWith('"') || m.startsWith("'")) {
    const q = m[0]; let j = 1; while (j < m.length && !(m[j] === q && m[j - 1] !== "\\")) j++;
    const kalan = m.slice(j + 1);
    if (!/^\s*:(\s|$)/.test(kalan)) return null;
    return [String(skaler(m.slice(0, j + 1))), kalan.replace(/^\s*:/, "").trim()];
  }
  // Düz anahtar boşlukla izlenmeyen iki nokta içerebilir (ör. "sha256:abc:").
  const x = /^((?:[^:]|:(?!\s|$))+?):(?:\s+|$)(.*)$/.exec(m);
  return x && !/^[#{[\],]/.test(x[1]) ? [x[1].trim(), x[2]] : null;
}
/** Tırnaklı değer bu satırda kapanıyor mu ('' ve \" kaçışlarıyla). */
function kapali(v: string): boolean {
  const q = v[0];
  for (let j = 1; j < v.length; j++) {
    if (q === "'" && v[j] === "'" && v[j + 1] === "'") { j++; continue; }
    if (q === '"' && v[j] === "\\") { j++; continue; }
    if (v[j] === q) return true;
  }
  return false;
}
export function yamlCoz(metin: string): unknown {
  const l: Satir[] = [];
  for (const ham of metin.replace(/\t/g, "  ").split(/\r?\n/)) {
    if (/^(---|\.\.\.)\s*$/.test(ham)) continue;
    if (/^\s*(#.*)?$/.test(ham)) { l.push({ g: -1, m: "" }); continue; }
    l.push({ g: /^ */.exec(ham)![0].length, m: ham.trimEnd() });
  }
  let i = 0;
  const atla = () => { while (i < l.length && l[i].g < 0) i++; };
  const blokMetin = (g: number, tur: string): string => {
    const parca: string[] = []; let ic = -1;
    while (i < l.length && (l[i].g < 0 || l[i].g > g)) { if (l[i].g >= 0 && ic < 0) ic = l[i].g; parca.push(l[i].g < 0 ? "" : l[i].m.slice(ic)); i++; }
    while (parca.length && !parca.at(-1)) parca.pop();
    const s = tur.startsWith(">") ? parca.join("\n").replace(/([^\n])\n(?=[^\n ])/g, "$1 ") : parca.join("\n");
    return tur.endsWith("-") ? s : `${s}\n`;
  };
  const devam = (g: number, ilk: string): string => {
    let s = ilk;
    while (i < l.length && l[i].g > g && !anahtarAyir(l[i].m.trim()) && !/^-(s|$)/.test(l[i].m.trim())) { s += ` ${l[i].m.trim()}`; i++; }
    return s;
  };
  const deger = (g: number, ham: string): unknown => {
    let v = yorumSil(ham).trim();
    // Birden çok satıra yayılan tırnaklı değer: kapanış tırnağına kadar sonraki satırlar eklenir.
    if (/^["']/.test(v) && !kapali(v)) {
      let t = ham.trim();
      while (i < l.length && !kapali(t)) { t += l[i].g < 0 ? "\n" : ` ${l[i].m.trim()}`; i++; }
      return skaler(t.replace(/ ?\n ?/g, "\n"));
    }
    if (/^[|>](\d?[-+]?|[-+]?\d?)$/.test(v)) return blokMetin(g, v);
    if (v !== "") return skaler(/^["'[{]/.test(v) ? v : devam(g, v));
    atla();
    if (i >= l.length) return null;
    if (l[i].g > g) return blok(l[i].g);
    if (l[i].g === g && /^-(\s|$)/.test(l[i].m.trim())) return blok(g);
    return null;
  };
  const blok = (g: number): unknown => {
    atla();
    if (i >= l.length) return null;
    const ilk = l[i].m.trim();
    if (/^-(\s|$)/.test(ilk)) {
      const dizi: unknown[] = [];
      while (true) {
        atla();
        if (i >= l.length || l[i].g !== g || !/^-(\s|$)/.test(l[i].m.trim())) break;
        const sonrasi = l[i].m.slice(g + 1);
        const bos = /^ */.exec(sonrasi)![0].length;
        const ic = sonrasi.slice(bos);
        const yeniG = g + 1 + bos;
        if (!ic.trim()) { i++; dizi.push(deger(g, "")); continue; }
        if (anahtarAyir(yorumSil(ic)) && !/^[[{]/.test(ic)) {
          // "- anahtar: değer" satırı: aynı öğede eşleme başlar (girinti tire sonrası sütun).
          l[i] = { g: yeniG, m: " ".repeat(yeniG) + ic };
          dizi.push(blok(yeniG));
        } else { i++; dizi.push(deger(g, ic)); }
      }
      return dizi;
    }
    const o: Record<string, unknown> = {};
    while (true) {
      atla();
      if (i >= l.length || l[i].g !== g) break;
      const m = l[i].m.trim();
      if (/^-(\s|$)/.test(m)) break;
      const a = anahtarAyir(yorumSil(m));
      if (!a) { i++; continue; }
      i++;
      o[a[0]] = deger(g, a[1]);
    }
    return o;
  };
  atla();
  return i < l.length ? blok(l[i].g) : null;
}

/* ───────────── OpenAPI → REST tanımı ───────────── */
type J = Record<string, unknown>;
const nesne = (v: unknown): J | undefined => (v && typeof v === "object" && !Array.isArray(v) ? (v as J) : undefined);
const yazi = (v: unknown, n = 600) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");
const YONTEMLER = ["get", "post", "put", "patch", "delete"] as const;

/** Belge metnini (JSON ya da YAML) nesneye çevirir. */
export function belgeCoz(metin: string): J {
  const t = metin.replace(/^﻿/, "").trim();
  let v: unknown;
  if (t.startsWith("{")) { try { v = JSON.parse(t); } catch { throw new Error("JSON okunamadı; belge bozuk."); } }
  else { try { v = yamlCoz(t); } catch { throw new Error("YAML okunamadı."); } }
  const o = nesne(v);
  if (!o || !(o.openapi || o.swagger)) throw new Error("Bu bir OpenAPI ya da Swagger belgesi değil (openapi ya da swagger alanı yok).");
  return o;
}

/** Yerel $ref çözümü (#/components/...), döngü ve derinlik sınırıyla; dış başvurular boş nesneye düşer. */
function cozumle(kok: J, v: unknown, derinlik = 0, yol: string[] = []): unknown {
  if (derinlik > 8) return {};
  if (Array.isArray(v)) return v.slice(0, 200).map((x) => cozumle(kok, x, derinlik + 1, yol));
  const o = nesne(v);
  if (!o) return v;
  if (typeof o.$ref === "string") {
    const r = o.$ref;
    if (!r.startsWith("#/") || yol.includes(r)) return { type: "object", description: "Özyinelemeli yapı" };
    let h: unknown = kok;
    for (const p of r.slice(2).split("/")) h = nesne(h)?.[p.replace(/~1/g, "/").replace(/~0/g, "~")];
    return cozumle(kok, h ?? {}, derinlik + 1, [...yol, r]);
  }
  const s: J = {};
  for (const [k, x] of Object.entries(o)) {
    if (/^x-/.test(k) || k === "example" || k === "examples" || k === "xml" || k === "externalDocs") continue;
    s[k] = cozumle(kok, x, derinlik + 1, yol);
  }
  if (Array.isArray(s.allOf)) { // allOf birleştirilir (model için tek nesne şeması daha anlaşılır)
    const birlesik: J = { type: "object", properties: {}, required: [] as string[] };
    for (const p of s.allOf as J[]) { Object.assign(birlesik.properties as J, nesne(p?.properties) ?? {}); if (Array.isArray(p?.required)) (birlesik.required as string[]).push(...(p.required as string[])); }
    delete s.allOf; Object.assign(s, birlesik, { properties: { ...(birlesik.properties as J), ...(nesne(s.properties) ?? {}) } });
  }
  return s;
}
const aracAdi = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "islem";

/** OpenAPI belgesinden REST tanımı: taban adres, kimlik biçimi, en çok 300 işlem. */
export function openapiCevir(belge: J, kaynakUrl?: string): RestTanim {
  const info = nesne(belge.info) ?? {};
  let taban = "";
  const sunucu = nesne((belge.servers as unknown[] | undefined)?.[0]);
  if (sunucu && typeof sunucu.url === "string") {
    taban = sunucu.url.replace(/\{([^}]+)\}/g, (_m, k) => String(nesne(nesne(sunucu.variables)?.[k])?.default ?? ""));
  } else if (typeof belge.host === "string") {
    const sema = Array.isArray(belge.schemes) && belge.schemes.includes("https") ? "https" : String((belge.schemes as string[] | undefined)?.[0] ?? "https");
    taban = `${sema}://${belge.host}${typeof belge.basePath === "string" ? belge.basePath : ""}`;
  }
  if (taban && !/^https?:\/\//.test(taban) && kaynakUrl) { try { taban = new URL(taban, kaynakUrl).toString(); } catch { /* boş kalır */ } }
  taban = taban.replace(/\/+$/, "");
  // Güvenlik şeması: ilk desteklenen.
  const semalar = nesne(nesne(belge.components)?.securitySchemes) ?? nesne(belge.securityDefinitions) ?? {};
  let yetki: RestYetki = "yok", anahtarAd: string | undefined;
  for (const x of Object.values(semalar).map(nesne)) {
    if (!x) continue;
    if (x.type === "http" && String(x.scheme).toLowerCase() === "bearer") { yetki = "bearer"; break; }
    if ((x.type === "http" && String(x.scheme).toLowerCase() === "basic") || x.type === "basic") { yetki = "temel"; break; }
    if (x.type === "apiKey" && typeof x.name === "string") { yetki = x.in === "query" ? "sorgu" : "baslik"; anahtarAd = x.name; if (x.in !== "cookie") break; }
    if (x.type === "oauth2" || x.type === "openIdConnect") { yetki = "bearer"; }
  }
  const islemler: RestIslemTanim[] = [];
  const adlar = new Set<string>();
  for (const [yol, ham] of Object.entries(nesne(belge.paths) ?? {})) {
    const p = nesne(cozumle(belge, ham, 0)) ?? {};
    const ortak = Array.isArray(p.parameters) ? (p.parameters as J[]) : [];
    for (const y of YONTEMLER) {
      const op = nesne(p[y]);
      if (!op || islemler.length >= 300) continue;
      let ad = aracAdi(typeof op.operationId === "string" ? op.operationId : `${y}_${yol}`);
      for (let n = 2; adlar.has(ad); n++) ad = `${ad.slice(0, 56)}_${n}`;
      adlar.add(ad);
      const parametreler: RestParametre[] = [];
      let govde: J | undefined;
      for (const pr of [...ortak, ...(Array.isArray(op.parameters) ? (op.parameters as J[]) : [])].map(nesne)) {
        if (!pr || typeof pr.name !== "string") continue;
        if (pr.in === "body") { govde = nesne(pr.schema) ?? { type: "object" }; continue; }
        const konum = pr.in === "path" ? "yol" : pr.in === "query" ? "sorgu" : pr.in === "header" ? "baslik" : null;
        if (!konum || (konum === "baslik" && /^(authorization|content-type|accept)$/i.test(pr.name))) continue;
        if (konum === "baslik" && anahtarAd && pr.name.toLowerCase() === anahtarAd.toLowerCase()) continue;
        if (konum === "sorgu" && anahtarAd && yetki === "sorgu" && pr.name === anahtarAd) continue;
        const sema = nesne(pr.schema) ?? pr;
        const t = String(sema.type ?? "string");
        parametreler.push({
          ad: pr.name.slice(0, 80), konum, zorunlu: konum === "yol" || pr.required === true, tur: t === "integer" || t === "number" || t === "boolean" ? t : "string",
          aciklama: yazi(pr.description, 300) || undefined, ...(Array.isArray(sema.enum) ? { secenekler: (sema.enum as unknown[]).slice(0, 40).map(String) } : {}),
        });
      }
      const rb = nesne(op.requestBody);
      if (rb) {
        const icerik = nesne(rb.content) ?? {};
        const tur = Object.keys(icerik).find((k) => /json/i.test(k)) ?? Object.keys(icerik).find((k) => /form/i.test(k));
        if (tur) govde = nesne(nesne(icerik[tur])?.schema) ?? { type: "object" };
      }
      const yontem = y.toUpperCase() as RestIslemTanim["yontem"];
      islemler.push({
        ad, baslik: yazi(op.summary, 120) || ad.replace(/_/g, " "), aciklama: yazi(op.description, 600) || yazi(op.summary, 300) || `${yontem} ${yol}`,
        yontem, yol: yol.slice(0, 400), parametreler, ...(govde ? { govde: kirpSema(govde) } : {}), okuma: yontem === "GET", yikici: yontem === "DELETE",
      });
    }
  }
  if (!islemler.length) throw new Error("Belgede çağrılabilir işlem bulunamadı (paths boş).");
  return { taban, yetki, anahtarAd, islemler, kaynak: kaynakUrl, baslik: yazi(info.title, 80) || undefined, surum: yazi(info.version, 40) || undefined, aciklama: yazi(info.description, 400) || undefined };
}
/** Büyük şemaları kırpar (araç tanımı model bağlamını şişirmesin). */
function kirpSema(s: J): J {
  const metin = JSON.stringify(s);
  if (metin.length <= 12_000) return s;
  const o: J = { type: s.type ?? "object" };
  const p = nesne(s.properties);
  if (p) { o.properties = Object.fromEntries(Object.entries(p).slice(0, 40).map(([k, v]) => { const x = nesne(v) ?? {}; return [k, { type: x.type ?? "string", ...(x.description ? { description: yazi(x.description, 200) } : {}), ...(Array.isArray(x.enum) ? { enum: x.enum.slice(0, 30) } : {}) }]; })); }
  if (Array.isArray(s.required)) o.required = s.required;
  return o;
}

/** Adresten OpenAPI belgesini indirir ve çevirir (en çok 4 MB). */
export async function openapiIndir(adres: string): Promise<RestTanim> {
  const u = mcpAdresi(adres);
  if (!u) throw new Error("Geçerli bir https adresi yaz.");
  const r = await mcpFetch(u, { signal: AbortSignal.timeout(20_000), headers: { Accept: "application/json, application/yaml, text/yaml, */*", "User-Agent": "VayraBuild/1.0" } });
  if (!r.ok) throw new Error(`Belge indirilemedi (${r.status}).`);
  const metin = await r.text();
  if (metin.length > 4_000_000) throw new Error("Belge 4 MB sınırını aşıyor.");
  return openapiCevir(belgeCoz(metin), u.toString());
}

/* ───────────── Araçlar ve çağrı ───────────── */
/** İşlemin model araç şeması: parametreler düz alanlar, gövde "govde" alanı. */
export function islemSemasi(x: RestIslemTanim): McpArac["inputSchema"] {
  const properties: J = {};
  const required: string[] = [];
  for (const p of x.parametreler ?? []) {
    properties[p.ad] = { type: p.tur ?? "string", ...(p.aciklama ? { description: p.aciklama } : {}), ...(p.secenekler?.length ? { enum: p.secenekler } : {}) };
    if (p.zorunlu) required.push(p.ad);
  }
  if (x.govde) { properties.govde = { ...x.govde, description: yazi(nesne(x.govde)?.description, 300) || "İstek gövdesi (JSON)" }; if (["POST", "PUT", "PATCH"].includes(x.yontem)) required.push("govde"); }
  return { type: "object", properties, ...(required.length ? { required } : {}) };
}
export const restAraclari = (t: RestTanim): McpArac[] => t.islemler.map((x) => ({
  name: x.ad, title: x.baslik, description: `${x.aciklama}`.slice(0, 900), inputSchema: islemSemasi(x),
  annotations: { title: x.baslik, readOnlyHint: x.okuma ?? x.yontem === "GET", destructiveHint: x.yikici ?? x.yontem === "DELETE", openWorldHint: true },
}));

/** Kimlik alanları (KimlikAlanlari formu ve kasa için): ana anahtar ya da kullanıcı adı ve şifre, gizli ek alanlar. */
export function restKimlikAlanlari(t: Pick<RestTanim, "yetki" | "anahtarAd" | "ekAlanlar">): AdaptorAlan[] {
  const l: AdaptorAlan[] = [];
  if (t.yetki === "temel") l.push({ id: "kullanici", ad: "Kullanıcı adı" }, { id: "sifre", ad: "Şifre ya da API anahtarı", gizli: true });
  else if (t.yetki !== "yok") l.push({ id: "anahtar", ad: t.yetki === "bearer" ? "Erişim belirteci" : `${t.anahtarAd ?? "API anahtarı"}`, gizli: true, ipucu: t.yetki === "bearer" ? "Authorization: Bearer başlığıyla gönderilir" : t.yetki === "baslik" ? `${t.anahtarAd} başlığıyla gönderilir` : `${t.anahtarAd} sorgu parametresiyle gönderilir` });
  for (const e of t.ekAlanlar ?? []) if (!e.deger) l.push({ id: `ek.${e.ad}`, ad: e.ad, gizli: !!e.gizli, ipucu: e.aciklama, istege: false });
  return l;
}

const ZAMAN = 30_000;
/** REST işlemini çağırır. Yanıt metni kısaltılır; 401/403 belirteç sorunudur (bağlantı "yeniden bağlan" durumuna düşer). */
export async function restCagir(t: RestTanim, kimlik: Record<string, string>, ad: string, girdi: unknown): Promise<{ metin: string; hata: boolean; durum: number; ham: string; tur: string }> {
  const x = t.islemler.find((i) => i.ad === ad);
  if (!x) throw new AdaptorHata(`"${ad}" adında işlem yok.`, 404);
  const g = (nesne(girdi) ?? {}) as J;
  let yol = x.yol;
  const sorgu = new URLSearchParams();
  const basliklar: Record<string, string> = { Accept: "application/json, */*", "User-Agent": "VayraBuild/1.0" };
  for (const p of x.parametreler ?? []) {
    const v = g[p.ad];
    if (v === undefined || v === null || v === "") { if (p.zorunlu) throw new AdaptorHata(`${p.ad} gerekli.`, 400); continue; }
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (p.konum === "yol") yol = yol.split(`{${p.ad}}`).join(encodeURIComponent(s));
    else if (p.konum === "sorgu") { if (Array.isArray(v)) for (const e of v) sorgu.append(p.ad, String(e)); else sorgu.set(p.ad, s); }
    else if (/^[A-Za-z0-9-]{1,80}$/.test(p.ad)) basliklar[p.ad] = s.slice(0, 2000);
  }
  if (/\{[^}]+\}/.test(yol)) throw new AdaptorHata(`Adres alanları eksik: ${yol}`, 400);
  // Kimlik
  if (t.yetki === "bearer" && kimlik.anahtar) basliklar.Authorization = `Bearer ${kimlik.anahtar}`;
  if (t.yetki === "baslik" && kimlik.anahtar && t.anahtarAd) basliklar[t.anahtarAd] = kimlik.anahtar;
  if (t.yetki === "sorgu" && kimlik.anahtar && t.anahtarAd) sorgu.set(t.anahtarAd, kimlik.anahtar);
  if (t.yetki === "temel" && (kimlik.kullanici || kimlik.sifre)) basliklar.Authorization = `Basic ${Buffer.from(`${kimlik.kullanici ?? ""}:${kimlik.sifre ?? ""}`).toString("base64")}`;
  for (const e of t.ekAlanlar ?? []) {
    const v = e.deger ?? kimlik[`ek.${e.ad}`];
    if (!v) continue;
    if (e.konum === "baslik") basliklar[e.ad] = v; else sorgu.set(e.ad, v);
  }
  const u = mcpAdresi(`${t.taban}${yol.startsWith("/") ? "" : "/"}${yol}${sorgu.size ? `${yol.includes("?") ? "&" : "?"}${sorgu}` : ""}`);
  if (!u) throw new AdaptorHata("Servis adresi geçersiz ya da izin verilmiyor (https gerekli).", 400);
  let body: string | undefined;
  if (g.govde !== undefined && x.yontem !== "GET") { body = typeof g.govde === "string" ? g.govde : JSON.stringify(g.govde); basliklar["Content-Type"] = "application/json"; }
  const r = await mcpFetch(u, { method: x.yontem, headers: basliklar, body, signal: AbortSignal.timeout(ZAMAN) });
  const tur = r.headers.get("content-type") ?? "";
  const ham = (await r.text()).slice(0, 400_000);
  if (r.status === 401 || r.status === 403) throw new AdaptorHata(`Servis kimliği kabul etmedi (${r.status}). Anahtarı kontrol et.`, 401);
  let metin = ham;
  if (/json/i.test(tur)) { try { metin = JSON.stringify(kisalt(JSON.parse(ham)) ?? {}, null, 1); } catch { /* düz metin */ } }
  return { metin: `HTTP ${r.status}\n${metin.slice(0, 40_000)}`, hata: r.status >= 400, durum: r.status, ham: ham.slice(0, 200_000), tur };
}

/** Elle eklenen uç noktayı doğrular ve tanıma çevirir. */
export function islemDogrula(x: Partial<RestIslemTanim>): RestIslemTanim | string {
  const yontem = String(x.yontem ?? "GET").toUpperCase();
  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(yontem)) return "Yöntem geçersiz.";
  const yol = String(x.yol ?? "").trim();
  if (!/^\/[\w\-./{}:@%]*$/.test(yol) || yol.length > 400) return "Yol / ile başlamalı, ör. /siparisler/{id}";
  const ad = aracAdi(String(x.ad || `${yontem}_${yol}`));
  const yer = [...yol.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  const parametreler: RestParametre[] = (Array.isArray(x.parametreler) ? x.parametreler : []).filter((p) => p && /^[\w.-]{1,80}$/.test(String(p.ad)) && ["yol", "sorgu", "baslik"].includes(p.konum)).slice(0, 30)
    .map((p) => ({ ad: String(p.ad), konum: p.konum, zorunlu: p.konum === "yol" || !!p.zorunlu, tur: (["string", "integer", "number", "boolean"].includes(String(p.tur)) ? p.tur : "string") as RestParametre["tur"], aciklama: yazi(p.aciklama, 300) || undefined }));
  for (const y of yer) if (!parametreler.some((p) => p.konum === "yol" && p.ad === y)) parametreler.push({ ad: y, konum: "yol", zorunlu: true, tur: "string" });
  const govde = nesne(x.govde);
  return {
    ad, baslik: yazi(x.baslik, 120) || ad.replace(/_/g, " "), aciklama: yazi(x.aciklama, 600) || `${yontem} ${yol}`, yontem: yontem as RestIslemTanim["yontem"], yol, parametreler,
    ...(govde ? { govde } : ["POST", "PUT", "PATCH"].includes(yontem) ? { govde: { type: "object", description: "İstek gövdesi (JSON)" } } : {}),
    okuma: x.okuma ?? yontem === "GET", yikici: x.yikici ?? yontem === "DELETE",
  };
}
