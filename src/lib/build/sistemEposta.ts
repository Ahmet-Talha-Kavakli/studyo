import "server-only";

/**
 * Gelen e-posta tetiği: e-posta altyapısı (Cloudflare Email Routing, Mailgun, SendGrid, Postmark, kendi worker'ın)
 * iletiyi POST /api/build/sistemler/eposta/<anahtar> adresine yollar. Gövde JSON, form ya da ham MIME olabilir;
 * hepsinden gönderen, alıcı, konu, metin, HTML ve ek listesi çıkarılır.
 */
export type GelenEposta = { gonderen: string; gonderenAdi: string; alici: string; konu: string; metin: string; html: string; tarih: string; ekler: { ad: string; tur: string; boyut: number }[]; basliklar: Record<string, string> };

const adresAyir = (s: string) => {
  const t = s.trim();
  const m = /^(?:"?([^"<]*?)"?\s*)?<([^>]+)>$/.exec(t);
  return m ? { adres: m[2].trim().toLowerCase(), ad: (m[1] ?? "").trim() } : { adres: t.toLowerCase(), ad: "" };
};
const htmldenMetin = (h: string) => h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|tr)>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();

/** RFC 2047 kodlu başlık sözcükleri (=?utf-8?B?...?= ve =?utf-8?Q?...?=). */
function basliKodCoz(s: string): string {
  return s.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, cs: string, k: string, v: string) => {
    try {
      const b = k.toUpperCase() === "B" ? Buffer.from(v, "base64") : Buffer.from(v.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (_x, h: string) => String.fromCharCode(parseInt(h, 16))), "binary");
      return new TextDecoder(/utf-?8/i.test(cs) ? "utf-8" : /iso-8859-9|windows-1254/i.test(cs) ? "windows-1254" : "latin1").decode(b);
    } catch { return v; }
  }).replace(/\?=\s+=\?/g, "?==?");
}
function govdeCoz(govde: string, kodlama: string, karakter: string): string {
  let b: Buffer;
  if (/base64/i.test(kodlama)) b = Buffer.from(govde.replace(/\s+/g, ""), "base64");
  else if (/quoted-printable/i.test(kodlama)) b = Buffer.from(govde.replace(/=\r?\n/g, "").replace(/=([0-9A-Fa-f]{2})/g, (_x, h: string) => String.fromCharCode(parseInt(h, 16))), "binary");
  else return govde;
  try { return new TextDecoder(/utf-?8/i.test(karakter) || !karakter ? "utf-8" : /iso-8859-9|windows-1254/i.test(karakter) ? "windows-1254" : "latin1").decode(b); } catch { return b.toString("utf8"); }
}
function basliklar(blok: string): Record<string, string> {
  const o: Record<string, string> = {};
  for (const s of blok.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/)) { const i = s.indexOf(":"); if (i > 0) { const k = s.slice(0, i).trim().toLowerCase(); if (!(k in o)) o[k] = basliKodCoz(s.slice(i + 1).trim()); } }
  return o;
}
/** Ham MIME iletisi (çok parçalı dahil, iç içe en çok 3 düzey). */
export function mimeCoz(ham: string): GelenEposta {
  const ayir = (x: string) => { const i = x.search(/\r?\n\r?\n/); return i < 0 ? { b: x, g: "" } : { b: x.slice(0, i), g: x.slice(i).replace(/^\r?\n\r?\n/, "") }; };
  const { b, g } = ayir(ham);
  const bas = basliklar(b);
  let metin = "", html = "";
  const ekler: GelenEposta["ekler"] = [];
  const parca = (bb: Record<string, string>, gg: string, d: number) => {
    const tur = bb["content-type"] ?? "text/plain";
    const sinir = /boundary="?([^";]+)"?/i.exec(tur)?.[1];
    if (/multipart\//i.test(tur) && sinir && d < 3) {
      for (const p of gg.split(`--${sinir}`).slice(1)) { if (p.startsWith("--")) break; const x = ayir(p.replace(/^\r?\n/, "")); parca(basliklar(x.b), x.g, d + 1); }
      return;
    }
    const karakter = /charset="?([^";]+)"?/i.exec(tur)?.[1] ?? "utf-8";
    const ad = /filename\*?="?([^";]+)"?/i.exec(bb["content-disposition"] ?? "")?.[1] ?? /name="?([^";]+)"?/i.exec(tur)?.[1];
    if (/attachment/i.test(bb["content-disposition"] ?? "") || (ad && !/^text\//i.test(tur))) { ekler.push({ ad: basliKodCoz(ad ?? "ek"), tur: tur.split(";")[0].trim(), boyut: Math.round((gg.replace(/\s+/g, "").length * 3) / 4) }); return; }
    const icerik = govdeCoz(gg, bb["content-transfer-encoding"] ?? "", karakter);
    if (/text\/html/i.test(tur)) html ||= icerik; else if (/text\/plain/i.test(tur)) metin ||= icerik;
  };
  parca(bas, g, 0);
  const k = adresAyir(bas.from ?? "");
  return { gonderen: k.adres, gonderenAdi: k.ad, alici: adresAyir(bas.to ?? "").adres, konu: bas.subject ?? "", metin: (metin || htmldenMetin(html)).trim().slice(0, 100_000), html: html.slice(0, 200_000), tarih: bas.date ? new Date(Date.parse(bas.date) || Date.now()).toISOString() : new Date().toISOString(), ekler: ekler.slice(0, 50), basliklar: Object.fromEntries(Object.entries(bas).filter(([x]) => /^(message-id|reply-to|cc|in-reply-to|references)$/.test(x))) };
}

const ilk = (o: Record<string, unknown>, ...l: string[]) => { for (const k of l) { const v = o[k]; if (typeof v === "string" && v.trim()) return v; if (v && typeof v === "object" && !Array.isArray(v) && typeof (v as { address?: unknown }).address === "string") return String((v as { address: string }).address); if (Array.isArray(v) && v.length) { const x = v[0] as unknown; if (typeof x === "string") return x; if (x && typeof x === "object") return String((x as { address?: string; email?: string }).address ?? (x as { email?: string }).email ?? ""); } } return ""; };

/** JSON ya da form gövdesinden (Mailgun, SendGrid, Postmark, özel worker) iletiyi okur. */
export function nesnedenEposta(o: Record<string, unknown>): GelenEposta {
  const ham = ilk(o, "raw", "ham", "mime", "email");
  if (ham && /\r?\n\r?\n/.test(ham) && /^[\w-]+:/m.test(ham)) return mimeCoz(ham);
  const k = adresAyir(ilk(o, "gonderen", "from", "From", "sender", "FromFull"));
  const html = ilk(o, "html", "HtmlBody", "body-html", "stripped-html");
  const metin = ilk(o, "metin", "text", "TextBody", "body-plain", "stripped-text", "plain") || htmldenMetin(html);
  const ekHam = (o.ekler ?? o.attachments ?? o.Attachments) as unknown;
  const ekler = Array.isArray(ekHam) ? ekHam.slice(0, 50).map((e) => { const x = (e ?? {}) as Record<string, unknown>; return { ad: String(x.ad ?? x.filename ?? x.Name ?? x.name ?? "ek"), tur: String(x.tur ?? x.contentType ?? x.ContentType ?? x.type ?? ""), boyut: Number(x.boyut ?? x.size ?? x.ContentLength ?? 0) || 0 }; }) : [];
  const tarihHam = ilk(o, "tarih", "date", "Date");
  return {
    gonderen: k.adres, gonderenAdi: k.ad || ilk(o, "gonderenAdi", "FromName"), alici: adresAyir(ilk(o, "alici", "to", "To", "recipient", "OriginalRecipient")).adres,
    konu: ilk(o, "konu", "subject", "Subject"), metin: metin.trim().slice(0, 100_000), html: html.slice(0, 200_000),
    tarih: tarihHam && Number.isFinite(Date.parse(tarihHam)) ? new Date(Date.parse(tarihHam)).toISOString() : new Date().toISOString(), ekler, basliklar: {},
  };
}

export async function istektenEposta(req: Request): Promise<GelenEposta> {
  const tur = req.headers.get("content-type") ?? "";
  if (tur.includes("json")) { const v = await req.json(); return nesnedenEposta(v && typeof v === "object" ? v as Record<string, unknown> : {}); }
  if (tur.includes("form")) { const f = await req.formData(); const o: Record<string, unknown> = {}; const ekler: unknown[] = []; for (const [k, v] of f.entries()) { if (typeof v === "string") o[k] = v; else ekler.push({ ad: v.name, tur: v.type, boyut: v.size }); } if (ekler.length) o.ekler = ekler; return nesnedenEposta(o); }
  return mimeCoz((await req.text()).slice(0, 5_000_000));
}

/** Gönderen süzgeci: virgülle ayrılmış adresler ya da @alan.com biçiminde alan adları. */
export function gonderenUyar(suzgec: string | undefined, gonderen: string): boolean {
  const l = (suzgec ?? "").split(/[,\s]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (!l.length) return true;
  return l.some((x) => (x.startsWith("@") ? gonderen.endsWith(x) : gonderen === x));
}
