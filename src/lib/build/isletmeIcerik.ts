import "server-only";
import { createHash } from "crypto";
import { projeOku, projeYaz, surumEkle } from "./depo";
import { zekaJson } from "./ajanZeka";
import { htmlKacir as k, trTarih } from "./isletme";
import {
  dilAdi, dizi, isletmePara, kimlikUret, metin, nesne, okumaSuresi, slug, yasalRejimleri, yaziYayinda, YASAL_TURLER,
  type CeviriSatir, type IsletmeVeri, type Profil, type Yazi, type YasalTur,
} from "./isletmeTipler";
import { AB_ULKELERI, dilimYaz, dilimZaman, ulkeBul, vergiAdi } from "./bolge";
import type { Proje } from "./tipler";

/**
 * Vayra İşletme içerik katmanı: blog (yazılar, kalıcı sayfalar, RSS), hazır yasal metinler, çok dilli site için metin
 * çıkarma ve yapay zekâ yardımcıları. Siteye yazılan sayfalar projede yeni bir sürüm olarak durur (geri alınabilir);
 * sayfa iskeleti sitenin kendi ana sayfasından (stil dosyaları, üst menü, alt bilgi) alınır.
 */

/* ───────── güvenli markdown ───────── */
const satirIci = (s: string) => k(s)
  .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_m, a, u) => `<img src="${u}" alt="${a}" loading="lazy">`)
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*|[a-z0-9._/-]+\.html[^\s)]*|mailto:[^\s)]+|tel:[^\s)]+)\)/gi, (_m, a, u) => `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ""}>${a}</a>`)
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>").replace(/`([^`]+)`/g, "<code>$1</code>");
/** Başlık, paragraf, liste, alıntı, kod, ayraç, kalın, eğik, bağlantı ve görsel. HTML önce kaçırılır. */
export function mdHtml(md: string): string {
  const o: string[] = [];
  const satirlar = md.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < satirlar.length) {
    const s = satirlar[i];
    if (!s.trim()) { i++; continue; }
    if (s.startsWith("```")) { const b: string[] = []; i++; while (i < satirlar.length && !satirlar[i].startsWith("```")) b.push(satirlar[i++]); i++; o.push(`<pre><code>${k(b.join("\n"))}</code></pre>`); continue; }
    const h = /^(#{1,4})\s+(.*)$/.exec(s);
    if (h) { const n = Math.min(4, h[1].length + 1); o.push(`<h${n}>${satirIci(h[2])}</h${n}>`); i++; continue; }
    if (/^(-{3,}|\*{3,})$/.test(s.trim())) { o.push("<hr>"); i++; continue; }
    if (/^>\s?/.test(s)) { const b: string[] = []; while (i < satirlar.length && /^>\s?/.test(satirlar[i])) b.push(satirlar[i++].replace(/^>\s?/, "")); o.push(`<blockquote><p>${satirIci(b.join(" "))}</p></blockquote>`); continue; }
    if (/^\s*([-*]|\d+[.)])\s+/.test(s)) {
      const sirali = /^\s*\d/.test(s); const b: string[] = [];
      while (i < satirlar.length && /^\s*([-*]|\d+[.)])\s+/.test(satirlar[i])) b.push(`<li>${satirIci(satirlar[i++].replace(/^\s*([-*]|\d+[.)])\s+/, ""))}</li>`);
      o.push(sirali ? `<ol>${b.join("")}</ol>` : `<ul>${b.join("")}</ul>`); continue;
    }
    const b: string[] = [];
    while (i < satirlar.length && satirlar[i].trim() && !/^(#{1,4}\s|```|>|\s*([-*]|\d+[.)])\s+)/.test(satirlar[i])) b.push(satirlar[i++]);
    o.push(`<p>${b.map(satirIci).join("<br>")}</p>`);
  }
  return o.join("\n");
}
export const duzMetin = (md: string) => md.replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[#>*`_-]+/g, " ").replace(/\s+/g, " ").trim();

/* ───────── siteye sayfa yazma ───────── */
/**
 * Sitenin ana sayfasından iskelet: yerel stil dosyaları, yazı tipleri, üst menü (header/nav) ve alt bilgi (footer).
 * derinlik: sayfa alt klasördeyse göreli adreslerin önüne eklenecek "../" sayısı.
 */
export function siteIskeleti(p: Pick<Proje, "dosyalar" | "ad">, derinlik = 0) {
  const ana = p.dosyalar["index.html"] ?? Object.entries(p.dosyalar).find(([y]) => y.endsWith(".html"))?.[1] ?? "";
  const on = "../".repeat(derinlik);
  const goreli = (h: string) => h.replace(/(href|src)=("|')(?!https?:|\/\/|\/|#|mailto:|tel:|data:|javascript:)([^"']+)\2/gi, (_m, a, q, u) => `${a}=${q}${on}${u}${q}`);
  const bas = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(ana)?.[1] ?? "";
  const stiller = [...bas.matchAll(/<link\b[^>]*rel=["']?(?:stylesheet|preconnect|icon)["']?[^>]*>/gi)].map((m) => goreli(m[0]));
  const icStil = [...bas.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].map((m) => m[0]).join("\n").slice(0, 60_000);
  const govde = /<body[^>]*>([\s\S]*)<\/body>/i.exec(ana)?.[1] ?? "";
  const ust = /<header\b[\s\S]*?<\/header>/i.exec(govde)?.[0] ?? (/<nav\b[\s\S]*?<\/nav>/i.exec(govde)?.[0] ?? "");
  const altlar = [...govde.matchAll(/<footer\b[\s\S]*?<\/footer>/gi)];
  const alt = altlar.at(-1)?.[0] ?? "";
  const govdeSinif = /<body\b([^>]*)>/i.exec(ana)?.[1]?.match(/class=("|')([^"']*)\1/)?.[2] ?? "";
  const dil = /<html\b[^>]*lang=["']?([a-z-]+)/i.exec(ana)?.[1] ?? "tr";
  return { stiller: stiller.join("\n"), icStil, ust: goreli(ust.replace(/<script[\s\S]*?<\/script>/gi, "")), alt: goreli(alt.replace(/<script[\s\S]*?<\/script>/gi, "")), govdeSinif, dil, on };
}
const ICERIK_STIL = `<style>.vy-icerik{max-width:760px;margin:0 auto;padding:48px 20px 72px;line-height:1.7;font-size:17px}.vy-icerik h1{font-size:clamp(28px,4vw,40px);line-height:1.15;margin:0 0 12px}.vy-icerik h2{font-size:22px;margin:32px 0 10px}.vy-icerik h3{font-size:18px;margin:24px 0 8px}.vy-icerik p,.vy-icerik li{opacity:.92}.vy-icerik img{max-width:100%;height:auto;border-radius:14px}.vy-icerik table{width:100%;border-collapse:collapse;margin:16px 0;font-size:15px}.vy-icerik td,.vy-icerik th{border:1px solid rgba(127,127,127,.3);padding:8px 10px;text-align:left;vertical-align:top}.vy-icerik blockquote{margin:16px 0;padding:4px 16px;border-left:3px solid currentColor;opacity:.85}.vy-icerik pre{overflow:auto;padding:14px;border-radius:12px;background:rgba(127,127,127,.12)}.vy-ust{font-size:14px;opacity:.7;margin-bottom:24px}.vy-ust a{color:inherit}.vy-kapak{width:100%;aspect-ratio:16/8;object-fit:cover;border-radius:18px;margin:8px 0 28px}.vy-liste{display:grid;gap:22px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));margin-top:28px}.vy-kart{display:block;color:inherit;text-decoration:none;border-radius:18px;overflow:hidden;border:1px solid rgba(127,127,127,.22)}.vy-kart img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block;border-radius:0}.vy-kart div{padding:14px 16px 18px}.vy-kart b{display:block;font-size:18px;line-height:1.3;margin:4px 0 6px}.vy-kart small{opacity:.65;font-size:13px}.vy-kart p{margin:0;font-size:15px;opacity:.8}</style>`;
/** Sitenin görünümünde tam bir sayfa: başlık, açıklama, kanonik etiket ve isteğe bağlı JSON-LD. */
export function sayfaUret(p: Pick<Proje, "dosyalar" | "ad">, g: { baslik: string; aciklama: string; govde: string; derinlik?: number; jsonLd?: unknown; robots?: string }) {
  const s = siteIskeleti(p, g.derinlik ?? 0);
  const ld = g.jsonLd ? `<script type="application/ld+json">${JSON.stringify(g.jsonLd).replace(/</g, "\\u003c")}</script>` : "";
  return `<!doctype html>
<html lang="${s.dil}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${k(g.baslik)}</title>
<meta name="description" content="${k(g.aciklama.slice(0, 300))}">
${g.robots ? `<meta name="robots" content="${g.robots}">\n` : ""}<meta property="og:title" content="${k(g.baslik)}">
<meta property="og:description" content="${k(g.aciklama.slice(0, 300))}">
${s.stiller}
${s.icStil}
${ICERIK_STIL}
${ld}
</head>
<body${s.govdeSinif ? ` class="${k(s.govdeSinif)}"` : ""}>
${s.ust}
<main class="vy-icerik">
${g.govde}
</main>
${s.alt}
</body>
</html>
`;
}

/** Dosyaları projeye yazar ve yeni sürüm açar (yayın sahibin elinde kalır). */
export async function projeyeYaz(id: string, sahip: string, ek: Record<string, string>, aciklama: string): Promise<{ surumNo: number | null; dosyalar: string[] }> {
  const p = await projeOku(id, sahip);
  if (!p) throw new Error("Proje bulunamadı.");
  const yeni = { ...p.dosyalar, ...ek };
  const s = surumEkle(p, yeni, aciklama.slice(0, 120), "elle");
  if (s) await projeYaz(p, sahip);
  return { surumNo: s?.no ?? null, dosyalar: Object.keys(ek) };
}

/* ───────── blog ───────── */
export function yaziTemizle(x: unknown, eski: Yazi | undefined, mevcut: Yazi[], tz = "UTC"): Yazi {
  const g = nesne(x);
  const baslik = metin(g.baslik, 160) || eski?.baslik || "Adsız yazı";
  const icerik = metin(g.icerik, 60_000, true);
  let s = slug(metin(g.slug, 80) || eski?.slug || baslik);
  const tutan = new Set(mevcut.filter((y) => y.id !== eski?.id).map((y) => y.slug));
  for (let i = 2; tutan.has(s); i++) s = `${slug(baslik).slice(0, 64)}-${i}`;
  const durum = g.durum === "yayinda" || g.durum === "zamanli" ? g.durum : "taslak";
  const zaman = typeof g.yayinZamani === "number" ? g.yayinZamani : typeof g.yayinZamani === "string" && g.yayinZamani ? (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(g.yayinZamani)) ? dilimZaman(String(g.yayinZamani).slice(0, 10), String(g.yayinZamani).slice(11, 16), tz) : Date.parse(String(g.yayinZamani))) : NaN;
  const z = Date.now();
  return {
    id: eski?.id ?? kimlikUret(), baslik, slug: s, ozet: metin(g.ozet, 400) || duzMetin(icerik).slice(0, 220), icerik, kapak: /^(https?:\/\/|\/)/.test(String(g.kapak ?? "")) ? metin(g.kapak, 500) : "",
    kategori: metin(g.kategori, 60), etiketler: [...new Set(dizi(g.etiketler).map((e) => metin(e, 40)).filter(Boolean))].slice(0, 12), yazar: metin(g.yazar, 80),
    durum, yayinZamani: durum === "zamanli" ? (Number.isFinite(zaman) ? zaman : z + 864e5) : durum === "yayinda" ? (eski?.durum === "yayinda" && eski.yayinZamani ? eski.yayinZamani : Number.isFinite(zaman) && zaman <= z ? zaman : z) : null,
    seoBaslik: metin(g.seoBaslik, 70), seoAciklama: metin(g.seoAciklama, 170), okumaDk: okumaSuresi(icerik), olusturma: eski?.olusturma ?? z, guncelleme: z,
    ...(eski?.kaynak ? { kaynak: eski.kaynak } : typeof g.kaynak === "string" ? { kaynak: metin(g.kaynak, 40) } : {}), ...(eski?.statik ? { statik: eski.statik } : {}),
  };
}
const yaziAdresi = (y: Yazi, v: IsletmeVeri) => (y.statik ? `blog/${y.slug}.html` : `${v.blog.yaziSayfasi}?yazi=${encodeURIComponent(y.slug)}`);
const tarihYaz = (z: number, tz = "UTC") => dilimYaz(z, tz, { day: "numeric", month: "long", year: "numeric" });
export function yaziGenel(y: Yazi, v: IsletmeVeri, icerikle = false) {
  return {
    id: y.id, baslik: y.baslik, slug: y.slug, ozet: y.ozet, kapak: y.kapak, kategori: y.kategori, etiketler: y.etiketler, yazar: y.yazar || v.blog.yazar || v.profil.ad, tarih: y.yayinZamani ?? y.guncelleme,
    tarihMetin: tarihYaz(y.yayinZamani ?? y.guncelleme, v.profil.saatDilimi), okumaDk: y.okumaDk, adres: yaziAdresi(y, v), ...(icerikle ? { html: mdHtml(y.icerik), seoBaslik: y.seoBaslik || y.baslik, seoAciklama: y.seoAciklama || y.ozet } : {}),
  };
}
export const yayindakiler = (l: Yazi[]) => l.filter((y) => yaziYayinda(y)).sort((a, b) => (b.yayinZamani ?? 0) - (a.yayinZamani ?? 0));
function yaziJsonLd(y: Yazi, v: IsletmeVeri, adres: string) {
  return { "@context": "https://schema.org", "@type": "BlogPosting", headline: y.baslik, description: y.seoAciklama || y.ozet, datePublished: new Date(y.yayinZamani ?? y.olusturma).toISOString(), dateModified: new Date(y.guncelleme).toISOString(), author: { "@type": v.blog.yazar || y.yazar ? "Person" : "Organization", name: y.yazar || v.blog.yazar || v.profil.ad }, ...(y.kapak ? { image: y.kapak } : {}), mainEntityOfPage: adres, ...(v.profil.ad ? { publisher: { "@type": "Organization", name: v.profil.ad, ...(v.profil.logo ? { logo: { "@type": "ImageObject", url: v.profil.logo } } : {}) } } : {}) };
}
function kartHtml(y: ReturnType<typeof yaziGenel>, on = "") {
  return `<a class="vy-kart" href="${on}${k(y.adres)}">${y.kapak ? `<img src="${k(y.kapak)}" alt="" loading="lazy">` : ""}<div><small>${k(y.kategori ? `${y.kategori} · ` : "")}${k(y.tarihMetin)} · ${y.okumaDk} dk okuma</small><b>${k(y.baslik)}</b><p>${k(y.ozet)}</p></div></a>`;
}
/**
 * Blog sayfaları: liste (blog.html), dinamik yazı sayfası (yazi.html?yazi=) ve yayındaki her yazı için kalıcı
 * blog/<slug>.html (arama motorları için içerik sayfada hazır gelir). Liste ve yazı sayfası sitede güncel veriyle
 * yeniden çizilir (zamanlı yazı vakti gelince listeye kendiliğinden girer).
 */
export function blogSayfalari(p: Pick<Proje, "dosyalar" | "ad">, v: IsletmeVeri, l: Yazi[], adresKoku: string): { dosyalar: Record<string, string>; statik: string[] } {
  const yayinda = yayindakiler(l);
  const o: Record<string, string> = {};
  const statik: string[] = [];
  for (const y of yayinda) {
    const ad = `blog/${y.slug}.html`;
    statik.push(y.id);
    const g = yaziGenel({ ...y, statik: 1 }, v, true);
    o[ad] = sayfaUret(p, {
      baslik: g.seoBaslik ?? y.baslik, aciklama: g.seoAciklama ?? y.ozet, derinlik: 1, jsonLd: yaziJsonLd(y, v, `${adresKoku}/${ad}`),
      govde: `<p class="vy-ust"><a href="../${k(v.blog.sayfa)}">${k(v.blog.baslik)}</a>${y.kategori ? ` · ${k(y.kategori)}` : ""}</p>\n<article data-vayra-blog-yazi="${k(y.slug)}" data-statik="1">\n<h1>${k(y.baslik)}</h1>\n<p class="vy-ust">${k(g.yazar)} · ${k(g.tarihMetin)} · ${y.okumaDk} dk okuma</p>\n${y.kapak ? `<img class="vy-kapak" src="${k(y.kapak)}" alt="">` : ""}\n${g.html}\n</article>`,
    });
  }
  const liste = yayinda.slice(0, 60).map((y) => kartHtml(yaziGenel({ ...y, statik: 1 }, v)));
  o[v.blog.sayfa] = sayfaUret(p, {
    baslik: `${v.blog.baslik}${v.profil.ad ? ` | ${v.profil.ad}` : ""}`, aciklama: v.blog.aciklama || `${v.profil.ad || p.ad} blogu`,
    govde: `<h1>${k(v.blog.baslik)}</h1>\n${v.blog.aciklama ? `<p>${k(v.blog.aciklama)}</p>\n` : ""}<div data-vayra-blog data-sayfa-basi="${v.blog.sayfaBasi}">\n<div class="vy-liste">${liste.join("\n") || "<p>Henüz yazı yok.</p>"}</div>\n</div>`,
  });
  o[v.blog.yaziSayfasi] = sayfaUret(p, {
    baslik: `${v.blog.baslik}${v.profil.ad ? ` | ${v.profil.ad}` : ""}`, aciklama: v.blog.aciklama || `${v.profil.ad || p.ad} blogu`, robots: "noindex",
    govde: `<p class="vy-ust"><a href="${k(v.blog.sayfa)}">${k(v.blog.baslik)}</a></p>\n<article data-vayra-blog-yazi><p>Yazı yükleniyor.</p></article>`,
  });
  return { dosyalar: o, statik };
}
export function rssUret(v: IsletmeVeri, l: Yazi[], site: string, ad: string): string {
  const x = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
  const ogeler = yayindakiler(l).slice(0, 30).map((y) => { const a = `${site}/${yaziAdresi(y, v)}`; return `<item><title>${x(y.baslik)}</title><link>${x(a)}</link><guid isPermaLink="false">${y.id}</guid><pubDate>${new Date(y.yayinZamani ?? y.olusturma).toUTCString()}</pubDate><description>${x(y.ozet)}</description>${y.kategori ? `<category>${x(y.kategori)}</category>` : ""}</item>`; });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${x(`${v.blog.baslik} | ${ad}`)}</title><link>${x(`${site}/${v.blog.sayfa}`)}</link><description>${x(v.blog.aciklama || ad)}</description><language>tr</language>${ogeler.join("")}</channel></rss>\n`;
}

/* ───────── yasal metinler ───────── */
const adresMetni = (p: Profil) => [p.adres.sokak, p.adres.ilce, p.adres.il, p.adres.postaKodu, p.adres.ulke].filter(Boolean).join(", ");
/** Metinde eksik kalan işletme bilgileri (sayfada köşeli parantezle görünür; sahip tamamlamalı). */
export function yasalEksikler(v: IsletmeVeri): string[] {
  const p = v.profil, l: string[] = [];
  if (!(p.resmi.unvan || p.ad)) l.push("Ticari unvan ya da işletme adı");
  if (!adresMetni(p) || !p.adres.sokak) l.push("Açık adres");
  if (!(v.yasal.basvuruEposta || p.eposta)) l.push("Başvuru e-postası");
  if (!p.telefon) l.push("Telefon");
  if (p.ulkeKodu === "TR" || !p.ulkeKodu) {
    if (!p.resmi.vergiNo) l.push("Vergi numarası ya da TC kimlik numarası");
    if (!p.resmi.vergiDairesi) l.push("Vergi dairesi");
  } else if (v.magaza.kargo.some((x) => x.aktif) && !p.resmi.vergiNo && ulkeBul(p.ulkeKodu)?.vergi.model !== "sales") l.push("Vergi kimliği (VAT, GST ya da ABN)");
  if (!p.ulkeKodu) l.push("Ülke");
  return l;
}
export function yasalMetin(tur: YasalTur, v: IsletmeVeri, p: Pick<Proje, "ad">, site: string): { baslik: string; html: string } {
  const pr = v.profil, y = v.yasal;
  const eksik = (s: string, ad: string) => (s ? k(s) : `<mark>[${k(ad)}]</mark>`);
  const unvan = eksik(pr.resmi.unvan || pr.ad || p.ad, "Ticari unvan");
  const sorumlu = eksik(y.veriSorumlusu || pr.resmi.unvan || pr.ad, "Veri sorumlusu");
  const adr = eksik(adresMetni(pr), "Açık adres");
  const ep = eksik(y.basvuruEposta || pr.eposta, "E-posta");
  const tel = eksik(pr.telefon, "Telefon");
  const tr = pr.ulkeKodu === "TR" || !pr.ulkeKodu;
  const ulke = ulkeBul(pr.ulkeKodu);
  const rejim = yasalRejimleri(v);
  const gdpr = rejim.includes("gdpr") || rejim.includes("ukgdpr"), ccpa = rejim.includes("ccpa"), kvkk = rejim.includes("kvkk"), pipeda = rejim.includes("pipeda");
  const tutar = isletmePara(v);
  const vergi = pr.resmi.vergiNo ? (tr ? `${k(pr.resmi.vergiDairesi || "")}${pr.resmi.vergiDairesi ? " Vergi Dairesi, " : ""}${k(pr.resmi.vergiNo)}` : `Vergi kimliği: ${k(pr.resmi.vergiNo)}`) + (pr.resmi.sicilNo ? `<br>Sicil no: ${k(pr.resmi.sicilNo)}` : "") : tr ? `<mark>[Vergi dairesi ve numarası]</mark>` : pr.resmi.sicilNo ? `Sicil no: ${k(pr.resmi.sicilNo)}` : "Belirtilmedi";
  const mersis = pr.resmi.mersis ? `<br>MERSİS no: ${k(pr.resmi.mersis)}` : "";
  const kep = pr.resmi.kep ? `<br>KEP adresi: ${k(pr.resmi.kep)}` : "";
  const siteAd = k(site.replace(/^https?:\/\//, ""));
  const tarih = tarihYaz(Date.now(), pr.saatDilimi);
  const hukuk = ulkeBul(y.hukukUlke || pr.ulkeKodu);
  const hukukMetni = hukuk ? `${k(hukuk.ad)} hukuku` : "<mark>[Uygulanacak hukuk]</mark>";
  const abTuketici = ulke?.grup === "ab" || pr.ulkeKodu === "GB" || v.magaza.satisUlkeleri.some((x) => AB_ULKELERI.includes(x) || x === "GB") || (!v.magaza.satisUlkeleri.length && v.magaza.kargo.some((x) => x.aktif && !x.ulkeler.length));
  const vergiCumle = v.magaza.vergi.model === "yok" ? "Fiyatlara vergi eklenmez." : v.magaza.vergi.dahil ? `Fiyatlara ${vergiAdi(v.magaza.vergi.model)} dahildir.` : `${vergiAdi(v.magaza.vergi.model)} teslimat adresine göre ödeme adımında hesaplanır ve fiyata eklenir.`;
  const kunye = `<table><tr><th>Satıcı / Veri sorumlusu</th><td>${unvan}</td></tr><tr><th>Adres</th><td>${adr}</td></tr><tr><th>Telefon</th><td>${tel}</td></tr><tr><th>E-posta</th><td>${ep}</td></tr><tr><th>Vergi bilgisi</th><td>${vergi}${mersis}${kep}</td></tr><tr><th>İnternet sitesi</th><td>${siteAd}</td></tr></table>`;
  const son = `<p class="vy-ust">Son güncelleme: ${tarih}</p>`;
  const kargolar = v.magaza.kargo.filter((x) => x.aktif);
  const iadeGun = y.iadeGun;
  const iadeKargo = y.iadeKargo === "satici" ? "Cayma hakkı kapsamındaki iadelerde kargo ücreti satıcıya aittir; ürün, satıcının anlaşmalı kargo firmasıyla gönderilmelidir." : "Cayma hakkı kapsamındaki iadelerde iade kargo ücreti alıcıya aittir.";
  const govde: Record<YasalTur, [string, string]> = {
    kvkk: ["Kişisel Verilerin Korunması Aydınlatma Metni", `${son}
<p>${unvan} (bundan sonra "Veri Sorumlusu"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla, ${siteAd} adresli internet sitesini ziyaret eden, iletişim kuran${v.magaza.kargo.length ? ", alışveriş yapan" : ""}${v.randevu.acik ? ", randevu alan" : ""} kişilerin kişisel verilerini aşağıda açıklanan kapsamda işlemektedir.</p>
<h2>1. Veri sorumlusu</h2>${kunye}
<h2>2. İşlenen kişisel veriler</h2>
<ul><li>Kimlik bilgileri: ad, soyad${v.magaza.faturaIste ? ", fatura için TC kimlik numarası" : ""}.</li><li>İletişim bilgileri: e-posta adresi, telefon numarası${v.magaza.kargo.length ? ", teslimat ve fatura adresi" : ""}.</li>${v.magaza.kargo.length ? "<li>Müşteri işlem bilgileri: sipariş, ödeme durumu, iade ve talep kayıtları. Kart bilgileri sitemizde işlenmez; ödeme kuruluşunun güvenli sayfasında alınır.</li>" : ""}${v.randevu.acik ? "<li>Randevu bilgileri: seçilen hizmet, tarih, saat ve paylaştığınız notlar.</li>" : ""}<li>İşlem güvenliği bilgileri: IP adresi, tarayıcı ve cihaz bilgisi, site kullanım kayıtları.</li>${y.analitik ? "<li>Ziyaret istatistikleri: görüntülenen sayfalar, yönlendiren kaynak ve cihaz türü. Bu istatistikler çerezsiz ve kişiyi tanımlamadan tutulur.</li>" : ""}${y.pazarlamaIzni ? "<li>Pazarlama bilgileri: açık rızanızla bülten ve kampanya iletişimi için e-posta adresiniz.</li>" : ""}</ul>
<h2>3. İşleme amaçları</h2>
<ul><li>Taleplerinize ve sorularınıza yanıt vermek, iletişim faaliyetlerini yürütmek.</li>${v.magaza.kargo.length ? "<li>Mesafeli satış sözleşmesinin kurulması ve ifası: siparişin alınması, ödemenin tahsili, teslimat, iade ve değişim süreçleri.</li><li>Fatura düzenlenmesi ve yasal saklama yükümlülüklerinin yerine getirilmesi.</li>" : ""}${v.randevu.acik ? "<li>Randevunun oluşturulması, hatırlatılması ve yönetilmesi.</li>" : ""}<li>Bilgi güvenliği süreçlerinin yürütülmesi, kötüye kullanımın önlenmesi.</li><li>Yetkili kurum ve kuruluşların bilgi taleplerinin karşılanması.</li>${y.pazarlamaIzni ? "<li>Açık rızanız bulunması hâlinde kampanya ve duyuru iletilmesi.</li>" : ""}</ul>
<h2>4. Hukuki sebepler ve toplama yöntemi</h2>
<p>Kişisel verileriniz internet sitemizdeki formlar${v.magaza.kargo.length ? ", sipariş ve ödeme ekranları" : ""}${v.randevu.acik ? ", randevu ekranı" : ""} ve e-posta yoluyla elektronik ortamda toplanır. Veriler KVKK m. 5/2 uyarınca; bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (c), veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi (ç), bir hakkın tesisi, kullanılması veya korunması (e) ve ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaatleri (f) hukuki sebeplerine dayanılarak işlenir.${y.pazarlamaIzni ? " Pazarlama iletişimi yalnız açık rızanıza (m. 5/1) dayanır ve 6563 sayılı Kanun kapsamında ticari elektronik ileti onayınızla gönderilir; dilediğiniz an geri alabilirsiniz." : ""}</p>
<h2>5. Aktarım</h2>
<p>Kişisel verileriniz yukarıdaki amaçlarla sınırlı olarak; barındırma ve altyapı hizmeti aldığımız tedarikçilere${v.magaza.kargo.length ? ", ödeme kuruluşlarına (ödemenin alınması için), kargo ve lojistik firmalarına (teslimat için), mali müşavirimize (muhasebe için)" : ""}, e-posta gönderim hizmeti sağlayıcısına ve talep hâlinde yetkili kamu kurum ve kuruluşlarına aktarılabilir.${y.yurtDisi ? " Kullandığımız bazı altyapı hizmetlerinin sunucuları yurt dışında bulunduğundan veriler, KVKK m. 9 kapsamında gerekli güvenceler sağlanarak yurt dışına aktarılabilir." : ""}</p>
<h2>6. Saklama süresi</h2><p>Kişisel verileriniz işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen süreler boyunca saklanır: ${k(y.saklamaSuresi)}. Süre sonunda silinir, yok edilir ya da anonim hâle getirilir.</p>
<h2>7. Haklarınız</h2>
<p>KVKK m. 11 uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini, KVKK m. 7 kapsamında silinmesini veya yok edilmesini isteme, bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme, münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç çıkmasına itiraz etme ve kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz.</p>
<h2>8. Başvuru</h2><p>Taleplerinizi, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun olarak ${ep} adresine kayıtlı e-posta adresinizden ya da ${adr} adresine yazılı olarak iletebilirsiniz${pr.resmi.kep ? `; KEP adresimiz ${k(pr.resmi.kep)}` : ""}. Başvurular en geç 30 gün içinde ücretsiz sonuçlandırılır.</p>`],
    gizlilik: ["Gizlilik Politikası", `${son}
<p>Bu politika, ${siteAd} adresli sitenin hangi bilgileri neden topladığını, nasıl koruduğunu ve haklarınızı açıklar. Veri sorumlusu ${sorumlu}; iletişim ${ep}.${kvkk ? ` Türkiye'deki ilgili kişiler için ayrıntılı bilgi <a href="kvkk-aydinlatma.html">KVKK aydınlatma metnimizde</a> yer alır.` : ""}</p>
<h2>Topladığımız bilgiler</h2><ul><li>Formlar${v.magaza.kargo.length ? ", sipariş" : ""}${v.randevu.acik ? ", randevu" : ""} ve iletişim sırasında kendi verdiğiniz bilgiler.</li><li>Güvenlik için tutulan teknik kayıtlar (IP adresi, tarayıcı bilgisi).</li>${y.analitik ? "<li>Çerez kullanmayan, kişiyi tanımlamayan ziyaret istatistikleri.</li>" : ""}</ul>
<h2>Bilgileri nasıl kullanıyoruz</h2><p>Bilgilerinizi yalnız hizmetimizi sunmak, taleplerinizi yanıtlamak${v.magaza.kargo.length ? ", siparişlerinizi teslim etmek" : ""}, yasal yükümlülüklerimizi yerine getirmek ve siteyi güvende tutmak için kullanırız. Bilgilerinizi satmayız ve reklam amacıyla üçüncü kişilerle paylaşmayız.</p>
<h2>Ödeme güvenliği</h2><p>${v.magaza.kargo.length ? "Kart bilgileriniz sitemize hiç ulaşmaz; ödeme, lisanslı ödeme kuruluşunun 3D Secure destekli güvenli sayfasında alınır." : "Sitemizde ödeme alınmamaktadır."}</p>
<h2>Çerezler</h2><p>Kullandığımız çerez ve benzeri teknolojiler <a href="cerez-politikasi.html">çerez politikamızda</a> açıklanır.</p>
<h2>Saklama süresi</h2><p>${k(y.saklamaSuresi)}. Süre sonunda bilgiler silinir ya da anonim hâle getirilir.</p>
<h2>Paylaştığımız taraflar</h2><p>Barındırma ve altyapı sağlayıcıları${v.magaza.kargo.length ? ", ödeme kuruluşları, kargo firmaları, muhasebe hizmeti" : ""}, e-posta gönderim hizmeti ve yasal zorunlulukta yetkili makamlar. Bu taraflar bilgileri yalnız bizim adımıza ve sözleşmeyle sınırlı amaçla işler.${y.yurtDisi ? " Bazı sağlayıcılar başka ülkelerde bulunduğundan bilgiler yurt dışına aktarılabilir; aktarım uygun güvencelerle (AB Standart Sözleşme Maddeleri, yeterlilik kararı ya da eşdeğer korumalar) yapılır." : ""}</p>
${gdpr ? `<h2>Avrupa Ekonomik Alanı ve Birleşik Krallık (GDPR)</h2>
<p><b>Hukuki dayanaklar.</b> Sözleşmenin ifası (madde 6/1-b): sipariş, teslimat${v.randevu.acik ? ", randevu" : ""} ve destek. Yasal yükümlülük (6/1-c): fatura ve muhasebe kayıtları. Meşru menfaat (6/1-f): güvenlik, kötüye kullanımın önlenmesi ve hizmetin iyileştirilmesi. Açık onay (6/1-a): ${y.pazarlamaIzni ? "bülten ve pazarlama e-postaları, " : ""}zorunlu olmayan çerezler. Onayınızı dilediğiniz an geri alabilirsiniz; geri alma önceki işlemeyi geçersiz kılmaz.</p>
<p><b>Haklarınız (madde 15-22).</b> Erişim, düzeltme, silme (unutulma), işlemenin kısıtlanması, veri taşınabilirliği, itiraz ve yalnız otomatik karara dayanan kararlara konu olmama hakkınız vardır. Talebinizi <a href="veri-talepleri.html">veri talepleri sayfamızda</a> anlatıldığı gibi ${ep} adresine iletebilirsiniz; en geç bir ay içinde yanıtlarız. Yetkili veri koruma otoritesine şikâyet hakkınız saklıdır.</p>
${y.dpoEposta ? `<p><b>Veri koruma görevlisi:</b> ${k(y.dpoEposta)}</p>` : ""}${y.abTemsilci ? `<p><b>AB temsilcisi (madde 27):</b> ${k(y.abTemsilci)}</p>` : ""}${y.ukTemsilci ? `<p><b>Birleşik Krallık temsilcisi:</b> ${k(y.ukTemsilci)}</p>` : ""}` : ""}
${ccpa ? `<h2>Kaliforniya sakinleri (CCPA ve CPRA)</h2><p>Son 12 ayda topladığımız kişisel bilgi kategorileri, kaynakları ve amaçları yukarıda açıklanmıştır. ${y.ccpaSatis ? "Reklam ortaklarımızla çapraz bağlam davranışsal reklam için bilgi paylaşabiliriz; bunu reddetmek için sayfanın altındaki <a href=\"kaliforniya-gizlilik.html\">Kişisel bilgilerimi satma ya da paylaşma</a> bağlantısını kullanabilirsiniz. Tarayıcınızın Global Privacy Control sinyalini de ret talebi olarak kabul ederiz." : "Kişisel bilgilerinizi satmayız ve çapraz bağlam davranışsal reklam için paylaşmayız."} Haklarınızın ayrıntısı <a href="kaliforniya-gizlilik.html">Kaliforniya gizlilik bildirimimizde</a> yer alır.</p>` : ""}
${pipeda ? `<h2>Kanada (PIPEDA)</h2><p>Kişisel bilgileri yalnız anlamlı onayınızla ve belirtilen amaçla toplarız. Bilgilerinize erişme ve düzeltilmesini isteme hakkınız vardır; talepleriniz için ${ep}. Yanıtımızdan memnun kalmazsanız Kanada Gizlilik Komiserliği'ne başvurabilirsiniz.</p>` : ""}
<h2>Çocukların gizliliği</h2><p>Sitemiz ${ccpa || rejim.includes("genel") ? "13" : "16"} yaşından küçüklere yönelik değildir ve bilerek çocuklardan kişisel veri toplamayız.</p>
<h2>İletişim</h2><p>Sorularınız ve talepleriniz için: ${ep}, ${tel}.</p>`],
    veriTalebi: ["Veri Sahibi Talepleri", `${son}
<p>${unvan}, ${siteAd} üzerinden işlediği kişisel verilerle ilgili haklarınızı kullanmanızı kolaylaştırır. Bu sayfa hangi talepleri nasıl iletebileceğinizi ve ne zaman yanıt alacağınızı açıklar.</p>
<h2>Kullanabileceğiniz haklar</h2><ul><li><b>Erişim:</b> Hakkınızda hangi verileri işlediğimizi ve bir kopyasını isteme.</li><li><b>Düzeltme:</b> Eksik ya da yanlış verilerin düzeltilmesi.</li><li><b>Silme (unutulma hakkı):</b> Saklama yükümlülüğümüz bulunmayan verilerin silinmesi.</li><li><b>Kısıtlama:</b> İtiraz ya da doğruluk incelemesi sürerken işlemenin durdurulması.</li><li><b>Taşınabilirlik:</b> Verdiğiniz verilerin yapılandırılmış ve makinece okunur biçimde (JSON ya da CSV) teslimi.</li><li><b>İtiraz:</b> Meşru menfaate dayanan işlemeye ve doğrudan pazarlamaya itiraz.</li><li><b>Onayı geri alma:</b> Bülten aboneliği ve zorunlu olmayan çerezler için verdiğiniz onayı her an geri alma.</li></ul>
<h2>Talep nasıl iletilir</h2><ol><li>${ep} adresine "Veri talebi" konulu bir e-posta gönderin.</li><li>Hangi hakkı kullanmak istediğinizi ve sitemizde kullandığınız e-posta adresini yazın.</li><li>Kimliğinizi doğrulamak için o adrese bir onay iletisi göndeririz; başkasının verisini korumak için bu adım zorunludur.</li></ol>
<h2>Yanıt süresi</h2><p>Talepleri ücretsiz ve en geç ${gdpr ? "bir ay" : ccpa ? "45 gün" : kvkk ? "30 gün" : "30 gün"} içinde yanıtlarız. Karmaşık taleplerde süre uzayabilir; bu durumda size gerekçesiyle bildiririz. Yasal saklama yükümlülüğü olan kayıtlar (örneğin faturalar) süre dolana kadar silinmez, yalnız işlenmesi kısıtlanır.</p>
<h2>Bülten aboneliği</h2><p>Her pazarlama e-postasının altındaki "Abonelikten çık" bağlantısıyla tek tıkla ayrılabilirsiniz; ayrıldığınızda size bir daha pazarlama iletisi gönderilmez.</p>
<h2>Şikâyet</h2><p>Yanıtımızdan memnun kalmazsanız bulunduğunuz ülkenin veri koruma otoritesine başvurabilirsiniz${gdpr ? " (AB'de ulusal denetim makamı, Birleşik Krallık'ta ICO)" : ""}${kvkk ? " (Türkiye'de Kişisel Verileri Koruma Kurumu)" : ""}.</p>`],
    ccpa: ["Kaliforniya Gizlilik Bildirimi", `${son}
<p>Bu bildirim, California Consumer Privacy Act (CCPA) ve California Privacy Rights Act (CPRA) kapsamında Kaliforniya sakinlerine yöneliktir ve <a href="gizlilik-politikasi.html">gizlilik politikamızı</a> tamamlar.</p>
<h2>Topladığımız bilgi kategorileri</h2><table><tr><th>Kategori</th><th>Örnek</th><th>Amaç</th></tr><tr><td>Tanımlayıcılar</td><td>Ad, e-posta, telefon${v.magaza.kargo.length ? ", teslimat adresi" : ""}</td><td>Hizmet${v.magaza.kargo.length ? ", sipariş ve teslimat" : ""}, destek</td></tr>${v.magaza.kargo.length ? "<tr><td>Ticari bilgiler</td><td>Satın alınan ürünler, sipariş geçmişi</td><td>Sözleşmenin ifası, iade, muhasebe</td></tr>" : ""}<tr><td>İnternet etkinliği</td><td>Ziyaret edilen sayfalar, tarayıcı bilgisi</td><td>Güvenlik ve sitenin iyileştirilmesi</td></tr></table>
<h2>Haklarınız</h2><ul><li><b>Bilme ve erişim:</b> Son 12 ayda hakkınızda topladığımız bilgileri, kaynaklarını ve paylaştığımız tarafları öğrenme.</li><li><b>Silme:</b> Sizden topladığımız bilgilerin silinmesi.</li><li><b>Düzeltme:</b> Yanlış bilgilerin düzeltilmesi.</li><li><b>Satışı ve paylaşımı reddetme:</b> ${y.ccpaSatis ? "Çapraz bağlam davranışsal reklam için paylaşımı reddetme. Bunun için aşağıdaki bağlantıyı kullanın ya da tarayıcınızda Global Privacy Control sinyalini açın." : "Kişisel bilgilerinizi satmıyor ve paylaşmıyoruz."}</li><li><b>Hassas bilgilerin kullanımını sınırlama:</b> Hassas kişisel bilgileri yalnız hizmeti sunmak için kullanırız.</li><li><b>Ayrımcılığa uğramama:</b> Haklarınızı kullandığınız için farklı fiyat ya da hizmet uygulamayız.</li></ul>
${y.ccpaSatis ? `<p><a href="#" data-vayra-satma>Kişisel bilgilerimi satma ya da paylaşma</a></p>` : ""}
<h2>Talep</h2><p>Taleplerinizi ${ep}${pr.telefon ? ` ya da ${tel}` : ""} üzerinden iletebilirsiniz. Kimliğinizi doğrulamak için sitemizde kullandığınız e-posta adresine onay iletisi göndeririz. Yetkili temsilci yazılı yetkiyle sizin adınıza başvurabilir. Taleplere 45 gün içinde yanıt veririz.</p>
<h2>Saklama</h2><p>${k(y.saklamaSuresi)}.</p>`],
    satisKosullari: ["Satış Koşulları", `${son}
<h2>1. Satıcı</h2>${kunye}
<h2>2. Sözleşme ve sipariş</h2><p>${siteAd} üzerinden verilen sipariş, ödeme onaylandığında ve size sipariş onay e-postası gönderildiğinde kurulur. Ürünün temel özellikleri ürün sayfasında, toplam bedel ödeme adımındaki sipariş özetinde gösterilir.</p>
<h2>3. Fiyat, vergi ve para birimi</h2><p>Fiyatlar ${k(v.magaza.paraBirimi)} cinsindendir${v.magaza.ekParaBirimleri.length ? `; başka para biriminde gösterilen fiyatlar güncel kurla çevrilir ve ödeme seçtiğiniz para biriminde alınır` : ""}. ${vergiCumle}${v.magaza.vergi.ihracatVergisiz ? " Yurt dışı teslimatlarda gümrük vergisi, ithalat vergisi ve gümrük işlem ücretleri alıcıya ait olabilir." : ""}</p>
<h2>4. Ödeme</h2><p>Ödeme, lisanslı ödeme kuruluşunun güvenli sayfasında alınır; kart bilgileri sitemize ulaşmaz.</p>
<h2>5. Teslimat</h2><p>Teslimat bölgeleri, süreleri ve ücretleri <a href="teslimat-ve-kargo.html">teslimat sayfamızda</a> yer alır. Aksi belirtilmedikçe teslimat siparişten itibaren en geç 30 gün içinde yapılır.</p>
<h2>6. Cayma ve iade</h2><p>${abTuketici ? `Avrupa Birliği ve Birleşik Krallık'taki tüketiciler, ürünün teslim alındığı günden itibaren ${y.iadeGun} gün içinde gerekçe göstermeden sözleşmeden cayabilir (AB Tüketici Hakları Direktifi 2011/83/EU; İngiltere Consumer Contracts Regulations 2013). Cayma kararınızı açık bir beyanla, örneğin aşağıdaki formu ${ep} adresine göndererek bildirebilirsiniz. Bedel, cayma bildiriminden itibaren 14 gün içinde ödeme yaptığınız yöntemle iade edilir; ürünü geri almadan ya da gönderdiğinizi kanıtlamadan iade yapılmayabilir.` : `Ürünü teslim aldığınız günden itibaren ${y.iadeGun} gün içinde iade edebilirsiniz.`} Ayrıntılar <a href="iade-kosullari.html">iade koşullarımızda</a>.</p>
${abTuketici ? `<h3>Örnek cayma formu</h3><p>Kime: ${unvan}, ${adr}, ${ep}<br>Aşağıdaki ürünlerin satışına ilişkin sözleşmeden caydığımı bildiririm:<br>Sipariş tarihi ve teslim tarihi:<br>Sipariş numarası:<br>Alıcının adı ve adresi:<br>Tarih:</p>` : ""}
<h2>7. Garanti ve ayıplı ürün</h2><p>Ürünler yasal garanti kapsamındadır${abTuketici ? " (AB'de teslimden itibaren en az iki yıl uygunluk garantisi)" : ""}. Ayıplı ürünlerde onarım, değişim, bedel indirimi ya da iade haklarınız saklıdır.</p>
<h2>8. Sorumluluğun sınırı</h2><p>Yasaların izin verdiği ölçüde sorumluluğumuz sipariş bedeliyle sınırlıdır. Bu sınır, ağır kusur, kasıt ve tüketicinin vazgeçilemeyen yasal hakları için geçerli değildir.</p>
<h2>9. Uygulanacak hukuk ve uyuşmazlıklar</h2><p>Bu koşullar ${hukukMetni}na tabidir${y.yetkiliYer ? `; yetkili yer ${k(y.yetkiliYer)}` : ""}. Tüketicinin yerleşim yerindeki zorunlu tüketici koruma hükümleri saklıdır.${abTuketici ? " AB Çevrim İçi Uyuşmazlık Çözüm platformu 20 Temmuz 2025'te kapatıldı; şikâyetleriniz için önce bize, ardından ülkenizdeki tüketici kuruluşuna başvurabilirsiniz." : ""}</p>
<h2>10. İletişim</h2><p>${ep}, ${tel}, ${adr}</p>`],
    cerez: ["Çerez Politikası", `${son}
<p>${siteAd} adresli sitede, sitenin çalışması ve deneyiminizin iyileştirilmesi için çerezler ve tarayıcı depolaması kullanılır. Bu metin hangi çerezlerin neden kullanıldığını ve tercihinizi nasıl değiştirebileceğinizi açıklar.</p>
<h2>Zorunlu çerezler ve depolama</h2><p>Sitenin temel işlevleri için gereklidir ve onayınıza bağlı değildir: sepetinizin ve dil tercihinizin hatırlanması, ${v.eklentiler.cerez.acik ? "çerez tercihinizin saklanması, " : ""}üye girişi olan sayfalarda oturumun sürdürülmesi ve güvenlik.</p>
<table><tr><th>Ad</th><th>Amaç</th><th>Süre</th></tr><tr><td>vayra-oturum</td><td>Üye oturumu</td><td>Oturum ya da çıkışa kadar</td></tr><tr><td>vayra-cerez</td><td>Çerez tercihiniz</td><td>12 ay</td></tr><tr><td>vayra-dil</td><td>Dil tercihiniz</td><td>12 ay</td></tr><tr><td>sepet</td><td>Sepetteki ürünler</td><td>Siz silene kadar</td></tr></table>
<h2>Analitik</h2><p>${y.analitik ? "Ziyaret istatistikleri çerez kullanmadan ve kişiyi tanımlamadan tutulur; hangi sayfaların görüntülendiği ve sitenin hızı ölçülür. Bu ölçüm için tarayıcınıza çerez yazılmaz." : "Sitemizde analitik amaçlı çerez kullanılmaz."}</p>
<h2>Pazarlama çerezleri</h2><p>${v.eklentiler.cerez.pazarlama ? "Reklam ve yeniden pazarlama çerezleri yalnız çerez bandında onay vermeniz hâlinde çalışır." : "Sitemizde reklam ya da yeniden pazarlama çerezi kullanılmaz."}</p>
<h2>Tercihinizi değiştirmek</h2><p>${v.eklentiler.cerez.acik ? "Sayfanın altındaki çerez bandından ya da tarayıcınızın ayarlarından" : "Tarayıcınızın ayarlarından"} çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezlerin engellenmesi sitenin bazı bölümlerinin çalışmamasına yol açabilir.</p>
<h2>İletişim</h2><p>${ep}</p>`],
    kullanim: ["Kullanım Koşulları", `${son}
<p>${siteAd} adresli siteyi kullanan herkes aşağıdaki koşulları kabul etmiş sayılır. Site ${unvan} tarafından işletilir.</p>
<h2>Fikrî haklar</h2><p>Sitedeki metin, görsel, logo ve tasarımların hakları ${unvan}'a ya da lisans verenlerine aittir; izinsiz kopyalanamaz ve ticari amaçla kullanılamaz.</p>
<h2>Kullanım kuralları</h2><ul><li>Site hukuka aykırı amaçla, başkalarının haklarını ihlal edecek ya da sitenin çalışmasını bozacak biçimde kullanılamaz.</li><li>Formlara ve yorumlara gerçeğe aykırı, hakaret içeren ya da başkasına ait bilgi girilemez.</li><li>Otomatik araçlarla siteden toplu veri çekilemez.</li></ul>
<h2>Sorumluluğun sınırı</h2><p>Sitedeki bilgiler özenle hazırlanır; ancak fiyat, stok ve içerikte yazım hataları olabilir. ${v.magaza.kargo.length ? "Hatalı fiyatla verilen siparişlerde alıcı bilgilendirilir ve ödeme iade edilir. " : ""}Başka sitelere verilen bağlantıların içeriğinden sorumlu değiliz.</p>
<h2>Değişiklikler</h2><p>Bu koşullar güncellenebilir; güncel metin her zaman bu sayfadadır.</p>
<h2>Uygulanacak hukuk</h2><p>Bu koşullar ${hukukMetni}na tabidir${y.yetkiliYer ? `; uyuşmazlıklarda ${k(y.yetkiliYer)} yetkilidir` : ""}. Tüketicilerin bulundukları ülkenin zorunlu koruma hükümleri saklıdır.</p>
<h2>İletişim</h2><p>${ep}, ${tel}, ${adr}</p>`],
    mesafeli: ["Mesafeli Satış Sözleşmesi", `${son}
<h2>Madde 1. Taraflar</h2><h3>Satıcı</h3>${kunye}<h3>Alıcı</h3><p>Sipariş sırasında ad, soyad, adres, telefon ve e-posta bilgilerini veren kişidir. Alıcı bilgileri sipariş özetinde ve siparişin onay e-postasında yer alır.</p>
<h2>Madde 2. Konu</h2><p>Bu sözleşme, alıcının ${siteAd} adresli internet sitesinden elektronik ortamda sipariş verdiği ürün ya da hizmetin satışı ve teslimiyle ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca tarafların hak ve yükümlülüklerini düzenler.</p>
<h2>Madde 3. Ürün ve ödeme bilgileri</h2><p>Ürünün türü, miktarı, rengi ya da bedeni, vergiler dahil satış bedeli, kargo ücreti, varsa indirim ve ödeme şekli sipariş özetinde gösterildiği gibidir. Fiyatlara KDV dahildir. Ödeme, kredi kartı ya da banka kartıyla lisanslı ödeme kuruluşunun güvenli ödeme sayfasında yapılır.</p>
<h2>Madde 4. Teslimat</h2><p>Ürün, alıcının bildirdiği teslimat adresine${kargolar.length ? ` ${k(kargolar.map((x) => `${x.firma || x.ad} (${x.sure || "süre sipariş özetinde"})`).join(", "))} ile` : ""} gönderilir. Teslim süresi siparişin onayından itibaren en geç 30 gündür. Ürün, alıcıdan başka birine teslim edilecekse teslim alan kişinin teslimatı kabul etmemesinden satıcı sorumlu tutulamaz.</p>
<h2>Madde 5. Cayma hakkı</h2><p>Alıcı, ürünün kendisine ya da gösterdiği üçüncü kişiye tesliminden itibaren ${iadeGun} gün içinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Hizmet satışlarında bu süre sözleşmenin kurulduğu gün başlar. Cayma bildirimi ${ep} adresine e-postayla ya da yazılı olarak yapılır. Satıcı, bildirimin kendisine ulaştığı tarihten itibaren 14 gün içinde ürün bedelini ve teslimat masrafını, ödemenin yapıldığı yöntemle iade eder. Alıcı ürünü cayma bildiriminden itibaren 10 gün içinde geri gönderir. ${iadeKargo}</p>
<h2>Madde 6. Cayma hakkının kullanılamayacağı durumlar</h2><ul><li>Alıcının istekleri ya da kişisel ihtiyaçları doğrultusunda hazırlanan ürünler.</li><li>Çabuk bozulabilen ya da son kullanma tarihi geçebilecek ürünler.</li><li>Tesliminden sonra ambalajı açılmış, sağlık ve hijyen açısından iadesi uygun olmayan ürünler.</li><li>Elektronik ortamda anında ifa edilen hizmetler ve tüketiciye anında teslim edilen gayri maddi mallar.</li><li>Cayma süresi dolmadan, alıcının onayıyla ifasına başlanan hizmetler.</li><li>Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesinde sayılan diğer hâller.</li></ul>
<h2>Madde 7. Genel hükümler</h2><p>Alıcı, siparişi onaylamadan önce ön bilgilendirme formunu okuduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul eder. Ürünün ayıplı çıkması hâlinde alıcı 6502 sayılı Kanun'un 11. maddesindeki seçimlik haklarını kullanabilir.</p>
<h2>Madde 8. Uyuşmazlıklar</h2><p>Uyuşmazlıklarda, Ticaret Bakanlığı'nca her yıl ilan edilen parasal sınırlar dahilinde alıcının ya da satıcının yerleşim yerindeki Tüketici Hakem Heyetleri, bu sınırları aşan durumlarda Tüketici Mahkemeleri yetkilidir.</p>
<h2>Madde 9. Yürürlük</h2><p>Alıcı, siparişi onayladığında bu sözleşmenin tüm koşullarını kabul etmiş sayılır. Sözleşme, siparişin onaylandığı tarihte yürürlüğe girer ve satıcı tarafından elektronik ortamda saklanır.</p>`],
    onbilgi: ["Ön Bilgilendirme Formu", `${son}
<h2>1. Satıcı bilgileri</h2>${kunye}
<h2>2. Ürün ve fiyat</h2><p>Siparişe konu ürünlerin temel nitelikleri ürün sayfasında; adet, vergiler dahil toplam fiyat, kargo ücreti ve varsa indirim ödeme adımındaki sipariş özetinde yer alır. Fiyatlara KDV dahildir.${kargolar.length ? ` Kargo ücretleri: ${k(kargolar.map((x) => `${x.ad} ${x.ucret ? tutar(x.ucret) : "ücretsiz"}${x.ucretsizEsik ? `, ${tutar(x.ucretsizEsik)} ve üzeri ücretsiz` : ""}`).join("; "))}.` : ""}</p>
<h2>3. Ödeme ve teslimat</h2><p>Ödeme kartla, lisanslı ödeme kuruluşunun güvenli sayfasında alınır. Teslimat alıcının bildirdiği adrese en geç 30 gün içinde yapılır.</p>
<h2>4. Cayma hakkı</h2><p>Alıcı, teslimden itibaren ${iadeGun} gün içinde gerekçe göstermeden cayma hakkını kullanabilir. Cayma bildirimi ${ep} adresine yapılır. Cayma hakkının kullanılamayacağı ürünler ve iade süreci <a href="mesafeli-satis-sozlesmesi.html">mesafeli satış sözleşmesinde</a> ve <a href="iade-kosullari.html">iade koşullarında</a> açıklanır.</p>
<h2>5. Şikâyet ve itiraz</h2><p>Şikâyetlerinizi ${ep} ve ${tel} üzerinden iletebilirsiniz. Uyuşmazlıklarda Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p>`],
    iade: ["İade ve Cayma Koşulları", `${son}
<h2>Cayma hakkı</h2><p>Ürünü teslim aldığınız günden itibaren ${iadeGun} gün içinde gerekçe göstermeden iade edebilirsiniz.${abTuketici ? " Bu hak AB ve Birleşik Krallık'taki tüketiciler için yasal güvence altındadır (en az 14 gün)." : ""}</p>
<h2>İade nasıl yapılır</h2><ol><li>${ep} adresine sipariş numaranızla iade talebinizi yazın.</li><li>Ürünü, kullanılmamış ve yeniden satılabilir durumda, mümkünse orijinal ambalajı ve faturasıyla birlikte paketleyin.</li><li>Ürünü cayma bildiriminden itibaren 10 gün içinde gönderin. ${iadeKargo}</li><li>Ürün bize ulaştıktan sonra, cayma bildiriminizden itibaren en geç 14 gün içinde ödemeniz ödeme yaptığınız yöntemle iade edilir. Bankanıza bağlı olarak tutarın hesabınıza yansıması birkaç iş günü sürebilir.</li></ol>
<h2>İade edilemeyen ürünler</h2><ul><li>Kişiye özel hazırlanan ürünler.</li><li>Ambalajı açılmış hijyen ürünleri, kozmetik ve iç giyim.</li><li>Çabuk bozulan gıda ürünleri.</li><li>Dijital içerikler ve hemen kullanılan hizmetler.</li></ul>
<h2>Hasarlı ya da ayıplı ürün</h2><p>Ürün size hasarlı ulaştıysa teslimatta not düşün ya da 48 saat içinde bize fotoğrafla bildirin. Ayıplı ürünlerde değişim, onarım, bedel indirimi ya da iade seçeneklerinden birini seçebilirsiniz; kargo ücreti bize aittir.</p>
<h2>İletişim</h2><p>${ep}, ${tel}</p>`],
    teslimat: ["Teslimat ve Kargo", `${son}
${kargolar.length ? `<table><tr><th>Yöntem</th><th>Bölge</th><th>Firma</th><th>Süre</th><th>Ücret</th></tr>${kargolar.map((x) => `<tr><td>${k(x.ad)}</td><td>${x.ulkeler.length ? k(x.ulkeler.map((u) => ulkeBul(u)?.ad ?? u).slice(0, 12).join(", ") + (x.ulkeler.length > 12 ? ` ve ${x.ulkeler.length - 12} ülke daha` : "")) : "Tüm ülkeler"}</td><td>${k(x.firma || "")}</td><td>${k(x.sure || "")}</td><td>${x.ucret ? tutar(x.ucret) : "Ücretsiz"}${x.ucretTuru === "agirlik" && x.kgBasi ? `, her kg için ${tutar(x.kgBasi)}` : ""}${x.ucretsizEsik ? `<br>${tutar(x.ucretsizEsik)} ve üzeri ücretsiz` : ""}</td></tr>`).join("")}</table>` : "<p>Kargo yöntemleri mağaza ayarlarından eklendiğinde burada görünür.</p>"}
${v.magaza.vergi.ihracatVergisiz ? "<h2>Yurt dışı gönderiler</h2><p>Yurt dışı gönderilerde alıcının ülkesindeki gümrük vergisi, ithalat vergisi ve gümrük işlem ücretleri alıcıya aittir ve teslimatta tahsil edilebilir.</p>" : ""}
<h2>Hazırlık süresi</h2><p>Ödemesi onaylanan siparişler en geç 2 iş günü içinde kargoya verilir. Kargoya verildiğinde takip numarası e-postayla iletilir.</p>
<h2>Teslimat</h2><p>Teslimat, siparişte bildirdiğiniz adrese yapılır. Adreste bulunamazsanız kargo firması bilgilendirme bırakır; ürün belirli bir süre şubede bekletilir.</p>
<h2>Sipariş takibi</h2><p>Sipariş numaranız ve e-posta adresinizle sipariş durumunu sitemizden sorgulayabilirsiniz.</p>
<h2>İletişim</h2><p>${ep}, ${tel}</p>`],
  };
  const [baslik, html] = govde[tur];
  return { baslik, html: `<h1>${baslik}</h1>\n${html}` };
}
export function yasalSayfalari(p: Pick<Proje, "dosyalar" | "ad">, v: IsletmeVeri, turler: YasalTur[], site: string): Record<string, string> {
  const o: Record<string, string> = {};
  for (const t of turler) {
    const d = YASAL_TURLER.find((x) => x.id === t);
    if (!d) continue;
    const m = yasalMetin(t, v, p, site);
    o[d.dosya] = sayfaUret(p, { baslik: `${m.baslik}${v.profil.ad ? ` | ${v.profil.ad}` : ""}`, aciklama: `${v.profil.ad || p.ad} ${m.baslik.toLocaleLowerCase("tr")}`, govde: m.html });
  }
  return o;
}

/* ───────── çok dilli: metin çıkarma ───────── */
const ATLA = /^[\s\d.,:;!?()\-–—/+*#@&|•·"'“”‘’«»%$€₺]*$/;
export const ceviriAnahtari = (s: string) => createHash("sha1").update(s).digest("base64url").slice(0, 14);
const varlikCoz = (s: string) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)));
/** HTML dosyalarından çevrilecek metinler: görünen metin, alt, title, placeholder, aria-label, sayfa başlığı ve açıklaması. */
export function metinleriCikar(dosyalar: Record<string, string>): { kaynak: string; tur: CeviriSatir["tur"]; sayfa: string }[] {
  const o = new Map<string, { kaynak: string; tur: CeviriSatir["tur"]; sayfa: string }>();
  const ekle = (ham: string, tur: CeviriSatir["tur"], sayfa: string) => {
    const s = varlikCoz(ham).replace(/\s+/g, " ").trim();
    if (s.length < 2 || s.length > 500 || ATLA.test(s) || /^[a-z0-9_-]+\.(html|js|css|png|jpe?g|webp|svg)$/i.test(s) || /\{\{|\$\{/.test(s)) return;
    if (!o.has(s)) o.set(s, { kaynak: s, tur, sayfa });
  };
  for (const [yol, h] of Object.entries(dosyalar)) {
    if (!yol.endsWith(".html")) continue;
    const t = /<title[^>]*>([^<]*)<\/title>/i.exec(h)?.[1];
    if (t) ekle(t, "baslik", yol);
    const md = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(h)?.[1];
    if (md) ekle(md, "baslik", yol);
    const govde = (/<body[^>]*>([\s\S]*)<\/body>/i.exec(h)?.[1] ?? h).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/<(svg|code|pre)\b[\s\S]*?<\/\1>/gi, " ");
    for (const m of govde.matchAll(/\b(alt|title|placeholder|aria-label)=("([^"]*)"|'([^']*)')/gi)) ekle(m[3] ?? m[4] ?? "", "nitelik", yol);
    for (const m of govde.matchAll(/<input\b[^>]*type=["'](?:submit|button)["'][^>]*value=["']([^"']+)["']/gi)) ekle(m[1], "nitelik", yol);
    for (const m of govde.split(/<[^>]+>/)) ekle(m, "metin", yol);
  }
  return [...o.values()].slice(0, 3000);
}
export function ceviriTablosunuGuncelle(l: CeviriSatir[], bulunan: { kaynak: string; tur: CeviriSatir["tur"]; sayfa: string }[]): { yeni: number; toplam: number } {
  const harita = new Map(l.map((x) => [x.kaynak, x]));
  let yeni = 0;
  for (const b of bulunan) {
    const e = harita.get(b.kaynak);
    if (e) { if (!e.sayfalar.includes(b.sayfa)) e.sayfalar = [...e.sayfalar, b.sayfa].slice(0, 20); e.gorulme = Date.now(); continue; }
    if (l.length >= 4000) break;
    const y: CeviriSatir = { id: ceviriAnahtari(b.kaynak), kaynak: b.kaynak, sayfalar: [b.sayfa], tur: b.tur, ceviri: {}, gorulme: Date.now() };
    l.push(y); harita.set(b.kaynak, y); yeni++;
  }
  return { yeni, toplam: l.length };
}

/* ───────── yapay zekâ yardımcıları ───────── */
/** Yerel sahte model sunucusu görevleri bu cümleden tanır. */
export const IMZA = "Sen Vayra İşletme yardımcısısın: küçük işletmelerin sitesini yöneten esnafa yardım eden dikkatli bir yazar ve çevirmensin.";
const KURAL = "Türkçe yaz (çeviri görevinde hedef dilde). Uydurma bilgi (fiyat, adres, ödül, müşteri sayısı) ekleme. ≈, ~, %, →, ≠ simgelerini kullanma; 'yüzde 20' gibi kelimeyle yaz.";
export class ModelYokHata extends Error { constructor() { super("Bu sunucuya bağlı bir yapay zekâ modeli yok; Ayarlar menüsündeki Modeller bölümünden bir model bağla."); } }

export async function aiCevir(v: IsletmeVeri, satirlar: CeviriSatir[], dil: string): Promise<{ ceviriler: Record<string, string>; kredi: number }> {
  const parca = satirlar.slice(0, 60).map((s) => ({ id: s.id, metin: s.kaynak }));
  const r = await zekaJson<{ ceviriler?: Record<string, unknown> }>({
    sistem: `${IMZA}\nGÖREV: ceviri\nSitenin metinlerini ${dilAdi(v.dil.kaynak)} dilinden ${dilAdi(dil)} (${dil}) diline çevir. Marka, ürün ve kişi adlarını çevirme. Kısa arayüz metinlerini (düğme, menü) kısa tut. Fiyat ve sayıları koru.${v.dil.ton ? ` Üslup: ${v.dil.ton}.` : ""} Yanıt biçimi: {"ceviriler": {"<id>": "<çeviri>"}}`,
    istem: `İşletme: ${v.profil.ad || "belirtilmedi"}\nMetinler:\n${JSON.stringify(parca)}`, enCok: 6000,
  });
  if (!r) throw new ModelYokHata();
  const o: Record<string, string> = {};
  for (const [id, t] of Object.entries(nesne(r.veri?.ceviriler))) if (typeof t === "string" && t.trim() && parca.some((p) => p.id === id)) o[id] = t.trim().slice(0, 1000);
  return { ceviriler: o, kredi: r.kredi };
}
export async function aiBlogTaslak(p: Pick<Proje, "ad" | "dosyalar">, v: IsletmeVeri, konu: string, ton: string): Promise<{ veri: Partial<Yazi>; kredi: number }> {
  const sayfalar = Object.entries(p.dosyalar).filter(([y]) => y.endsWith(".html")).slice(0, 6).map(([y, h]) => `${y}: ${(/<title[^>]*>([^<]*)/i.exec(h)?.[1] ?? "").trim()}`).join("\n");
  const r = await zekaJson<{ baslik?: string; ozet?: string; icerik?: string; seoBaslik?: string; seoAciklama?: string; etiketler?: string[]; kategori?: string }>({
    sistem: `${IMZA}\nGÖREV: blog\n${KURAL}\nİşletmenin blogu için okunur, faydalı, 600-900 kelimelik bir yazı yaz. Markdown kullan: ## ara başlıklar, kısa paragraflar, gerekiyorsa madde listesi. Başlığı içerikte tekrar etme. Yanıt biçimi: {"baslik","ozet","icerik","seoBaslik","seoAciklama","etiketler":[],"kategori"}`,
    istem: `İşletme: ${v.profil.ad || p.ad}\nTanıtım: ${v.profil.aciklama || "yok"}\nŞehir: ${v.profil.adres.il || "belirtilmedi"}\nSite sayfaları:\n${sayfalar}\nKonu: ${konu}\nÜslup: ${ton || "samimi ve bilgili"}`, enCok: 4000,
  });
  if (!r) throw new ModelYokHata();
  const d = nesne(r.veri);
  if (!d.icerik) throw new Error("Model geçerli bir yazı döndürmedi; yeniden dene.");
  return { veri: { baslik: metin(d.baslik, 160), ozet: metin(d.ozet, 400), icerik: metin(d.icerik, 60000, true), seoBaslik: metin(d.seoBaslik, 70), seoAciklama: metin(d.seoAciklama, 170), etiketler: dizi(d.etiketler).map((e) => metin(e, 40)).filter(Boolean).slice(0, 8), kategori: metin(d.kategori, 60) }, kredi: r.kredi };
}
export async function aiUrunAciklama(v: IsletmeVeri, urun: { ad: string; kategori?: string; notlar?: string }): Promise<{ aciklama: string; kredi: number }> {
  const r = await zekaJson<{ aciklama?: string }>({
    sistem: `${IMZA}\nGÖREV: urun\n${KURAL}\nE-ticaret ürün açıklaması yaz: 2 kısa paragraf ve 3-5 maddelik özellik listesi (markdown). Ölçü ya da malzeme bilinmiyorsa uydurma. Yanıt biçimi: {"aciklama"}`,
    istem: `Mağaza: ${v.profil.ad || "belirtilmedi"}\nÜrün: ${urun.ad}\nKategori: ${urun.kategori || "yok"}\nSahibin notları: ${urun.notlar || "yok"}`, enCok: 1500,
  });
  if (!r) throw new ModelYokHata();
  const a = metin(nesne(r.veri).aciklama, 4000, true);
  if (!a) throw new Error("Model açıklama döndürmedi; yeniden dene.");
  return { aciklama: a, kredi: r.kredi };
}
export async function aiYorumYaniti(v: IsletmeVeri, yorum: { ad: string; puan: number; metin: string }): Promise<{ yanit: string; kredi: number }> {
  const r = await zekaJson<{ yanit?: string }>({
    sistem: `${IMZA}\nGÖREV: yanit\n${KURAL}\nMüşteri yorumuna işletme adına kısa (en çok 3 cümle), kibar ve samimi bir yanıt yaz. Olumsuz yorumda özür dile, çözüm için iletişime davet et; savunmaya geçme. Yanıt biçimi: {"yanit"}`,
    istem: `İşletme: ${v.profil.ad || "belirtilmedi"}\nMüşteri: ${yorum.ad}\nPuan: ${yorum.puan}/5\nYorum: ${yorum.metin}`, enCok: 600,
  });
  if (!r) throw new ModelYokHata();
  const y = metin(nesne(r.veri).yanit, 1000, true);
  if (!y) throw new Error("Model yanıt döndürmedi; yeniden dene.");
  return { yanit: y, kredi: r.kredi };
}
export { trTarih };
