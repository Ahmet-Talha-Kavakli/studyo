/**
 * Uygulama eylemlerinin ortak türleri ve yardımcıları (istemci ve sunucu ortak; Node'a özgü modül kullanılmaz).
 * İmzalar Web Crypto ile (Node ve tarayıcıda aynı), MD5 saf JavaScript ile hesaplanır (Mikro ve Mailchimp ister).
 */
export type UygAlan = { ad: string; etiket: string; tur?: "metin" | "uzunMetin" | "sayi" | "secim" | "evet-hayir" | "json"; zorunlu?: boolean; yer?: string; aciklama?: string; secenekler?: { id: string; ad: string }[]; varsayilan?: string };
export type UygIstek = {
  yontem: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; url: string; basliklar?: Record<string, string>;
  json?: unknown; form?: Record<string, string>;
  /** Ham gövde (SOAP XML, çok parçalı yükleme): tur içerik türüdür. */
  metin?: string; tur?: string;
  /** Yanıtın biçimi: verilmezse JSON denenir, XML ise nesneye çevrilir. */
  yanit?: "json" | "metin" | "xml";
};
export type Sirlar = (ad: string) => string;
export type UygEylem = {
  id: string; ad: string; aciklama: string; alanlar: UygAlan[];
  /** Gerekli sırların adları (servisin sırlarından). "_" ile başlayanlar kimlik adımının ürettiği değerlerdir. */
  sirlar: string[];
  /** Okuma eylemi (veri değiştirmez): denemelerde ve yoklamalı tetiklerde güvenle çağrılır. */
  okuma?: boolean;
  istek: (g: Record<string, unknown>, sir: Sirlar) => UygIstek | Promise<UygIstek>;
  /** İki aşamalı eylemler (ör. Instagram: önce kap, sonra yayınla): ilk yanıttan sonraki istek. */
  devam?: (yanit: unknown, g: Record<string, unknown>, sir: Sirlar) => UygIstek | null | Promise<UygIstek | null>;
  /** Yanıttan kısa özet ve hata denetimi (200 dönüp hata bildiren servisler için). */
  sonuc?: (yanit: unknown) => { ozet?: string; hata?: string };
};
export type UygSir = { ad: string; etiket: string; nasil: string; istege?: boolean };
/**
 * Kimlik adımı: kısa ömürlü erişim belirteci alan istek (OAuth istemci kimliği, yenileme belirteci, oturum). Sonuç
 * değerleri "_" ile başlayan sır adlarıyla eylemlere geçer ve süresi dolana kadar sunucuda önbellekte kalır.
 * yeniSirlar: servis yenileme belirtecini döndürdüyse sırdaki eski değerin yerine yazılır.
 */
export type UygKimlik = {
  sirlar: string[];
  istek: (sir: Sirlar) => UygIstek | Promise<UygIstek>;
  coz: (yanit: unknown, sir: Sirlar) => { degerler: Record<string, string>; omur?: number; yeniSirlar?: Record<string, string> };
};
/**
 * Bağlantılar'daki kayıttan sır eşlemesi: katalog kimliği ve sır adı → kaynak.
 * Kaynak: "anahtar" (ana anahtar), "alan:<id>" (kimlik alanı), "sablon:<id>" (adres şablonu değeri), "oauth" (erişim belirteci).
 */
export type UygBaglanti = { katalog: string; esle: Record<string, string> };
export type Uygulama = {
  id: string; ad: string; logo: string; /** Beyaz logo: koyu zeminde gösterilir. */ koyu?: boolean; kategori: string; aciklama: string; belge: string;
  sirlar: UygSir[]; eylemler: UygEylem[]; kimlik?: UygKimlik; baglanti?: UygBaglanti[]; turkiye?: boolean;
};

/* ───────────── Değer yardımcıları ───────────── */
export const m = (v: unknown) => (v === undefined || v === null ? "" : typeof v === "string" ? v : JSON.stringify(v));
export const t = (v: unknown) => m(v).trim();
export const zorunlu = (g: Record<string, unknown>, ad: string, etiket: string) => { const v = t(g[ad]); if (!v) throw new Error(`${etiket} boş; alanı doldur.`); return v; };
export const nesne = (v: unknown, etiket: string): Record<string, unknown> => {
  if (v === undefined || v === null || v === "") return {};
  if (typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  if (typeof v === "string") { try { const j = JSON.parse(v); if (j && typeof j === "object" && !Array.isArray(j)) return j; } catch { /* aşağıda */ } }
  throw new Error(`${etiket} bir JSON nesnesi olmalı.`);
};
export const liste = (v: unknown, etiket: string): unknown[] => {
  if (v === undefined || v === null || v === "") return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") { try { const j = JSON.parse(v); if (Array.isArray(j)) return j; } catch { /* aşağıda */ } }
  throw new Error(`${etiket} bir JSON listesi olmalı.`);
};
/** Virgülle ya da satırla ayrılmış değerler. */
export const virgul = (v: unknown) => (Array.isArray(v) ? v.map((x) => m(x).trim()) : m(v).split(/[,\n]/).map((x) => x.trim())).filter(Boolean);
export const sayi = (v: unknown, vars: number, en: number, cok: number) => { const x = Number(m(v).replace(",", ".")); return Number.isFinite(x) && m(v).trim() !== "" ? Math.min(cok, Math.max(en, x)) : vars; };
export const tamsayi = (v: unknown, vars: number, en: number, cok: number) => Math.round(sayi(v, vars, en, cok));
export const evet = (v: unknown) => v === true || /^(true|evet|1|yes)$/i.test(t(v));
/** Boş değerli anahtarları atar. */
export const dolu = <T extends Record<string, unknown>>(o: T): Partial<T> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length))) as Partial<T>;
export const enc = encodeURIComponent;
export const sorgu = (o: Record<string, unknown>) => { const l = Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ""); return l.length ? `?${l.map(([k, v]) => `${enc(k)}=${enc(String(v))}`).join("&")}` : ""; };
export const kok = (s: string) => s.trim().replace(/\/+$/, "");
/** Alan adı biçimindeki sırdan https kökü (ör. magaza.com ya da https://magaza.com/). */
export const siteKoku = (s: string) => { const x = kok(s); return /^https?:\/\//i.test(x) ? x : `https://${x}`; };
export const telefon = (v: unknown) => m(v).replace(/[^\d+]/g, "");
export const tarihGun = (v: unknown) => { const s = t(v); if (!s) return ""; if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10); const d = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(s); return d ? `${d[3]}-${d[2].padStart(2, "0")}-${d[1].padStart(2, "0")}` : s; };
/** ISO zaman (Türkiye saati varsayılır): "2026-11-06 14:30" ya da ISO. */
export const isoZaman = (v: unknown) => {
  const s = t(v);
  if (!s) return "";
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s).toISOString();
  const d = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s) ?? (() => { const x = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?: (\d{1,2}):(\d{2}))?$/.exec(s); return x ? [x[0], x[3], x[2].padStart(2, "0"), x[1].padStart(2, "0"), x[4], x[5], undefined] : null; })();
  if (!d) { const z = Date.parse(s); if (Number.isFinite(z)) return new Date(z).toISOString(); throw new Error(`"${s}" tarih olarak okunamadı; 2026-11-06 14:30 biçiminde yaz.`); }
  return `${d[1]}-${d[2]}-${d[3]}T${String(d[4] ?? "00").padStart(2, "0")}:${d[5] ?? "00"}:${d[6] ?? "00"}+03:00`;
};

/* ───────────── Kodlama ve imza ───────────── */
const bayt = (s: string) => new TextEncoder().encode(s);
export const b64 = (s: string | Uint8Array) => { const b = typeof s === "string" ? bayt(s) : s; let x = ""; for (const c of b) x += String.fromCharCode(c); return btoa(x); };
export const b64url = (s: string | Uint8Array) => b64(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const temel = (k: string, s: string) => `Basic ${b64(`${k}:${s}`)}`;
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function hmac(alg: "SHA-256" | "SHA-1", anahtar: string, metin: string) {
  const k = await crypto.subtle.importKey("raw", bayt(anahtar), { name: "HMAC", hash: alg }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, bayt(metin));
}
export const hmacHex = async (anahtar: string, metin: string, alg: "SHA-256" | "SHA-1" = "SHA-256") => hex(await hmac(alg, anahtar, metin));
export const hmacB64 = async (anahtar: string, metin: string, alg: "SHA-256" | "SHA-1" = "SHA-256") => b64(new Uint8Array(await hmac(alg, anahtar, metin)));
export const shaHex = async (metin: string, alg: "SHA-256" | "SHA-1" = "SHA-256") => hex(await crypto.subtle.digest(alg, bayt(metin)));
export const rastgele = (n = 16) => { const b = new Uint8Array(n); crypto.getRandomValues(b); return [...b].map((x) => x.toString(16).padStart(2, "0")).join(""); };

/** MD5 (RFC 1321), UTF-8 metin için onaltılık özet. */
export function md5(s: string): string {
  const x = bayt(s);
  const n = (((x.length + 8) >>> 6) + 1) * 16;
  const w = new Array<number>(n).fill(0);
  for (let i = 0; i < x.length; i++) w[i >> 2] |= x[i] << ((i % 4) * 8);
  w[x.length >> 2] |= 0x80 << ((x.length % 4) * 8);
  w[n - 2] = x.length * 8;
  const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) | 0);
  const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  let a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
  for (let o = 0; o < n; o += 16) {
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16) { f = (b & c) | (~b & d); g = i; } else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; } else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; } else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const tmp = d; d = c; c = b;
      const y = (a + f + K[i] + w[o + g]) | 0;
      const r = S[(i >> 4) * 4 + (i % 4)];
      b = (b + ((y << r) | (y >>> (32 - r)))) | 0;
      a = tmp;
    }
    a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
  }
  return [a0, b0, c0, d0].map((v) => [0, 8, 16, 24].map((k) => ((v >>> k) & 0xff).toString(16).padStart(2, "0")).join("")).join("");
}

/* ───────────── XML ve SOAP ───────────── */
export const xk = (v: unknown) => m(v).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
/** Nesneden XML öğeleri (sıra korunur; dizi değerler aynı adla yinelenir; null atlanır). */
export function xmlOgeler(o: Record<string, unknown>, onEk = ""): string {
  let s = "";
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    const ad = `${onEk}${k}`;
    if (Array.isArray(v)) { for (const z of v) s += z && typeof z === "object" ? `<${ad}>${xmlOgeler(z as Record<string, unknown>, onEk)}</${ad}>` : `<${ad}>${xk(z)}</${ad}>`; continue; }
    s += v && typeof v === "object" ? `<${ad}>${xmlOgeler(v as Record<string, unknown>, onEk)}</${ad}>` : `<${ad}>${xk(v)}</${ad}>`;
  }
  return s;
}
export const soapZarf = (govde: string, ekAd = "") => `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"${ekAd}><soapenv:Body>${govde}</soapenv:Body></soapenv:Envelope>`;
/** SOAP 1.1 isteği (text/xml; SOAPAction başlığı). */
export const soap = (url: string, eylem: string, govde: string, ekAd = ""): UygIstek => ({ yontem: "POST", url, metin: soapZarf(govde, ekAd), tur: "text/xml; charset=utf-8", basliklar: { SOAPAction: `"${eylem}"` }, yanit: "xml" });

const xmlCoz = (s: string) => s.replace(/&(lt|gt|amp|apos|quot|#\d+|#x[0-9a-f]+);/gi, (_x, e: string) => (e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ({ lt: "<", gt: ">", amp: "&", apos: "'", quot: '"' } as Record<string, string>)[e.toLowerCase()]));
/**
 * Küçük XML okuyucu: öğeler nesneye, yinelenen öğeler diziye, metin değerleri dizgeye dönüşür; ad alanı önekleri ve
 * nitelikler atılır. SOAP yanıtında Envelope/Body sarmalı kaldırılır. Bozuk XML'de null döner.
 */
export function xmlJson(xml: string): unknown {
  const s = xml.replace(/<\?[\s\S]*?\?>/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_x, c: string) => xk(c));
  let i = 0;
  const ogeOku = (): [string, unknown] | null => {
    const a = s.indexOf("<", i);
    if (a < 0) return null;
    const b = s.indexOf(">", a);
    if (b < 0) return null;
    const ham = s.slice(a + 1, b);
    if (ham.startsWith("/")) return null;
    const kendi = ham.endsWith("/");
    const ad = (ham.replace(/\/$/, "").trim().split(/\s/)[0] ?? "").replace(/^[\w.-]+:/, "");
    const nil = /\bnil="true"/.test(ham);
    i = b + 1;
    if (kendi) return [ad, nil ? null : ""];
    const cocuk: Record<string, unknown> = {};
    let metin = "", var_ = false;
    for (;;) {
      const sonraki = s.indexOf("<", i);
      if (sonraki < 0) return null;
      metin += s.slice(i, sonraki);
      if (s[sonraki + 1] === "/") { i = s.indexOf(">", sonraki) + 1; break; }
      i = sonraki;
      const c = ogeOku();
      if (!c) return null;
      var_ = true;
      const [k, v] = c;
      if (k in cocuk) { const o = cocuk[k]; cocuk[k] = Array.isArray(o) ? [...o, v] : [o, v]; } else cocuk[k] = v;
    }
    return [ad, var_ ? cocuk : nil ? null : xmlCoz(metin.trim())];
  };
  try {
    const kok_ = ogeOku();
    if (!kok_) return null;
    let v: unknown = { [kok_[0]]: kok_[1] };
    const o = v as Record<string, unknown>;
    if (o.Envelope && typeof o.Envelope === "object") { const e = o.Envelope as Record<string, unknown>; v = e.Body ?? e; }
    return v;
  } catch { return null; }
}
/** İç içe nesnede ada göre ilk değeri bulur (SOAP sonuç öğesi için). */
export function bul(v: unknown, ad: string, derinlik = 0): unknown {
  if (!v || typeof v !== "object" || derinlik > 12) return undefined;
  if (!Array.isArray(v) && ad in (v as Record<string, unknown>)) return (v as Record<string, unknown>)[ad];
  for (const x of Object.values(v as Record<string, unknown>)) { const r = bul(x, ad, derinlik + 1); if (r !== undefined) return r; }
  return undefined;
}

/* ───────────── Hazır alanlar ve denetimler ───────────── */
export const MESAJ: UygAlan = { ad: "metin", etiket: "Mesaj", tur: "uzunMetin", zorunlu: true, yer: "Yeni sipariş: / ile veri seç" };
export const okDenetle = (alan = "ok", hataAlan = "error") => (y: unknown) => { const o = y as Record<string, unknown> | null; return o && o[alan] === false ? { hata: `Servis hata döndürdü: ${m(o[hataAlan] ?? o.description ?? "bilinmiyor")}` } : {}; };
/** GraphQL yanıtında errors dizisi varsa hata. */
export const gqlDenetle = (ozet?: (d: Record<string, unknown>) => string | undefined) => (y: unknown) => {
  const o = y as { errors?: { message?: string }[]; data?: Record<string, unknown> } | null;
  if (o?.errors?.length) return { hata: o.errors.map((e) => e.message ?? "hata").join("; ").slice(0, 400) };
  return { ozet: o?.data && ozet ? ozet(o.data) : undefined };
};
export const ozetAl = (yol: string) => (y: unknown) => {
  let v: unknown = y;
  for (const k of yol.split(".")) v = v && typeof v === "object" ? (v as Record<string, unknown>)[k] : undefined;
  return { ozet: v === undefined || v === null ? undefined : m(v).slice(0, 300) };
};
export const bearer = (s: string) => ({ Authorization: `Bearer ${s}` });
