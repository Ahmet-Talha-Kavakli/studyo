/**
 * Vayra Build — Büyüme v4 ortak tipleri ve saf yardımcıları (istemci + sunucu): kişiler (hafif CRM), segmentler,
 * e-posta kampanyaları, bağlantılar (UTM ve kısa bağlantı), A/B denemeleri, marka kiti, indirim ve tavsiye kodları,
 * paylaşım saatleri, rakip analizleri, SEO denetimi ve haftalık rapor.
 * Veri: .veri/build/buyume-ek/<projeId>.json (bkz. buyumeEkDepo.ts). Plan ve gönderiler buyumeTipler.ts'de.
 */
import type { Proje } from "./tipler";
import { dilimFark } from "./bolge";
import type { IcerikKanalId, NiyetId } from "./buyumeTipler";
import type { Akis } from "./buyumeAkisTipler";
import type { BioSayfa } from "./buyumeBio";
import type { GorunurlukVeri } from "./buyumeGorunurluk";
import type { GbpVeri, IysAyar, SosyalHesap, YayinKaydi } from "./buyumeKanalTipler";

/* ── Kişiler ── */
export type KisiKaynak = "uye" | "form" | "siparis" | "elle" | "abone" | "randevu" | "bio";
export const KAYNAKLAR: { id: KisiKaynak; ad: string }[] = [{ id: "abone", ad: "Bülten abonesi" }, { id: "uye", ad: "Üye" }, { id: "form", ad: "Form" }, { id: "siparis", ad: "Sipariş" }, { id: "randevu", ad: "Randevu" }, { id: "bio", ad: "Bio sayfası" }, { id: "elle", ad: "Elle eklenen" }];
/** İzin değişikliği kaydı (KVKK ve 6563: onayın ispatı gönderendedir; her değişiklik zaman ve kaynağıyla saklanır). */
export type IzinKaydi = { z: number; durum: IzinDurum; kaynak: string; ip?: string };
export type IzinDurum = "onay" | "ret" | "bilinmiyor";
export const IZINLER: { id: IzinDurum; ad: string; alt: string }[] = [
  { id: "onay", ad: "Onaylı", alt: "Ticari ileti onayı var" },
  { id: "bilinmiyor", ad: "Belirsiz", alt: "Onay kaydı yok" },
  { id: "ret", ad: "Reddetti", alt: "Pazarlama iletisi istemiyor" },
];
/** Sahibin kişiye eklediği bilgiler (kimlik: küçük harfli e-posta ya da tel:numara). */
export type KisiMeta = {
  etiketler: string[]; not?: string; izin?: IzinDurum; izinKaynak?: string; izinZaman?: number; ad?: string; telefon?: string; eklenme?: number; elle?: boolean;
  /** Doğum günü: "AA-GG" ya da "YYYY-AA-GG". */ dogum?: string;
  /** Bio sayfasından abone olanlar için kaynak işareti. */ bio?: boolean;
  izinGecmis?: IzinKaydi[];
};
/** İzin kaydına satır ekler (en çok 30 satır). */
export function izinYaz(m: KisiMeta, durum: IzinDurum, kaynak: string, ip?: string) {
  m.izin = durum; m.izinKaynak = kaynak; m.izinZaman = Date.now();
  m.izinGecmis = [...(m.izinGecmis ?? []), { z: m.izinZaman, durum, kaynak, ...(ip ? { ip } : {}) }].slice(-30);
}
/** "AA-GG" ya da "YYYY-AA-GG" ya da "GG.AA.YYYY" biçimini "AA-GG" ya da "YYYY-AA-GG" yapar; geçersizse "". */
export function dogumTemizle(x: unknown): string {
  const s = String(x ?? "").trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return Number(m[2]) >= 1 && Number(m[2]) <= 12 && Number(m[3]) >= 1 && Number(m[3]) <= 31 ? s : "";
  m = /^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{4}))?$/.exec(s);
  if (m) { const g = Number(m[1]), a = Number(m[2]); if (a < 1 || a > 12 || g < 1 || g > 31) return ""; const aa = String(a).padStart(2, "0"), gg = String(g).padStart(2, "0"); return m[3] ? `${m[3]}-${aa}-${gg}` : `${aa}-${gg}`; }
  m = /^(\d{2})-(\d{2})$/.exec(s);
  if (m) return Number(m[1]) >= 1 && Number(m[1]) <= 12 && Number(m[2]) >= 1 && Number(m[2]) <= 31 ? s : "";
  return "";
}
export type KisiOlayTur = "uye" | "form" | "siparis" | "eposta" | "acildi" | "tik" | "cikti" | "elle" | "davet" | "abone" | "randevu" | "akis" | "izin";
export type KisiOlay = { z: number; tur: KisiOlayTur; metin: string };
export type Kisi = {
  id: string; eposta?: string; ad: string; telefon?: string; sehir?: string;
  kaynaklar: KisiKaynak[]; ilk: number; son: number;
  formSayisi: number; siparisSayisi: number; harcama: number;
  etiketler: string[]; not?: string; izin: IzinDurum; izinKaynak?: string; izinZaman?: number;
  /** Abonelikten çıktığı an (varsa e-posta gönderilmez). */ cikti?: number;
  davetKodu?: string; davetEden?: string; davetSayisi?: number;
  olaylar: KisiOlay[];
  dogum?: string; randevuSayisi?: number; sonSiparis?: number; izinGecmis?: IzinKaydi[];
};

export type Suzgec = {
  kaynak?: KisiKaynak[]; etiket?: string[]; etiketYok?: string[]; izin?: IzinDurum | "tum";
  /** Son N günde etkinliği olanlar. */ sonGun?: number;
  siparis?: "var" | "yok"; enAzHarcama?: number; arama?: string; cikanlar?: "haric" | "dahil";
};
export type Segment = { id: string; ad: string; suzgec: Suzgec; olusturma: number };

export const epostaGecerli = (e: string) => /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[^\s@<>"]{2,24}$/.test(e);
export const kisiAnahtari = (eposta?: string, tel?: string) => (eposta && epostaGecerli(eposta.trim()) ? eposta.trim().toLocaleLowerCase("tr-TR") : tel ? `tel:${tel.replace(/[^\d+]/g, "")}` : "");

export function suz(l: Kisi[], s: Suzgec): Kisi[] {
  const ara = s.arama?.trim().toLocaleLowerCase("tr-TR");
  const sinir = s.sonGun ? Date.now() - s.sonGun * 864e5 : 0;
  return l.filter((k) => {
    if (s.kaynak?.length && !s.kaynak.some((x) => k.kaynaklar.includes(x))) return false;
    if (s.etiket?.length && !s.etiket.some((x) => k.etiketler.includes(x))) return false;
    if (s.etiketYok?.length && s.etiketYok.some((x) => k.etiketler.includes(x))) return false;
    if (s.izin && s.izin !== "tum" && k.izin !== s.izin) return false;
    if (sinir && k.son < sinir) return false;
    if (s.siparis === "var" && !k.siparisSayisi) return false;
    if (s.siparis === "yok" && k.siparisSayisi) return false;
    if (s.enAzHarcama && k.harcama < s.enAzHarcama) return false;
    if (s.cikanlar !== "dahil" && k.cikti) return false;
    if (ara && ![k.ad, k.eposta ?? "", k.telefon ?? "", k.not ?? "", ...k.etiketler].some((x) => x.toLocaleLowerCase("tr-TR").includes(ara))) return false;
    return true;
  });
}

/** Süzgecin okunur özeti ("Form ve Üye, etiketi vip, son 30 gün"). */
export function suzgecOzeti(s: Suzgec): string {
  const p: string[] = [];
  if (s.kaynak?.length) p.push(s.kaynak.map((x) => KAYNAKLAR.find((k) => k.id === x)?.ad).join(" ya da "));
  if (s.etiket?.length) p.push(`etiketi ${s.etiket.join(" ya da ")}`);
  if (s.etiketYok?.length) p.push(`${s.etiketYok.join(", ")} etiketi olmayan`);
  if (s.izin && s.izin !== "tum") p.push(IZINLER.find((x) => x.id === s.izin)!.ad.toLocaleLowerCase("tr-TR"));
  if (s.sonGun) p.push(`son ${s.sonGun} günde etkin`);
  if (s.siparis === "var") p.push("sipariş vermiş"); if (s.siparis === "yok") p.push("sipariş vermemiş");
  if (s.enAzHarcama) p.push(`en az ${s.enAzHarcama.toLocaleString("tr-TR")} TL harcamış`);
  if (s.arama?.trim()) p.push(`"${s.arama.trim()}" geçen`);
  return p.join(", ") || "Bütün kişiler";
}

const csvHucre = (s: string | number) => `"${String(s ?? "").replace(/"/g, '""')}"`;
/** Kişiler tablosu (Excel Türkçe için noktalı virgül, UTF-8 BOM). */
export function kisilerCsv(l: Kisi[]): string {
  const ust = ["E-posta", "Ad", "Telefon", "Şehir", "Kaynak", "Etiketler", "İzin", "İzin kaynağı", "Abonelikten çıktı", "İlk görülme", "Son etkinlik", "Form", "Sipariş", "Harcama TL", "Davet kodu", "Davet eden", "Not"];
  const t = (z?: number) => (z ? new Date(z).toISOString().slice(0, 16).replace("T", " ") : "");
  const satirlar = l.map((k) => [k.eposta ?? "", k.ad, k.telefon ?? "", k.sehir ?? "", k.kaynaklar.map((x) => KAYNAKLAR.find((y) => y.id === x)?.ad).join(", "), k.etiketler.join(", "), IZINLER.find((x) => x.id === k.izin)!.ad, k.izinKaynak ?? "", t(k.cikti), t(k.ilk), t(k.son), k.formSayisi, k.siparisSayisi, k.harcama, k.davetKodu ?? "", k.davetEden ?? "", k.not ?? ""]);
  return "﻿" + [ust, ...satirlar].map((s) => s.map(csvHucre).join(";")).join("\r\n") + "\r\n";
}

/** CSV çözümleyici (virgül ya da noktalı virgül, tırnaklı alanlar). İlk satır başlık. */
export function csvCoz(metin: string): Record<string, string>[] {
  const s = metin.replace(/^﻿/, "");
  const ilk = s.split(/\r?\n/, 1)[0] ?? "";
  const ayrac = (ilk.match(/;/g)?.length ?? 0) > (ilk.match(/,/g)?.length ?? 0) ? ";" : ",";
  const satirlar: string[][] = [];
  let hucre = "", satir: string[] = [], tirnak = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (tirnak) { if (c === '"') { if (s[i + 1] === '"') { hucre += '"'; i++; } else tirnak = false; } else hucre += c; continue; }
    if (c === '"') tirnak = true;
    else if (c === ayrac) { satir.push(hucre); hucre = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && s[i + 1] === "\n") i++; satir.push(hucre); hucre = ""; if (satir.some((x) => x.trim())) satirlar.push(satir); satir = []; }
    else hucre += c;
  }
  satir.push(hucre); if (satir.some((x) => x.trim())) satirlar.push(satir);
  const [baslik, ...govde] = satirlar;
  if (!baslik) return [];
  return govde.slice(0, 5000).map((r) => Object.fromEntries(baslik.map((b, i) => [b.trim(), (r[i] ?? "").trim()])));
}

/* ── E-posta kampanyaları ── */
export type BlokTur = "baslik" | "metin" | "dugme" | "gorsel" | "ayirici";
export type Blok = { id: string; tur: BlokTur; metin?: string; adres?: string; gorsel?: string };
export const BLOKLAR: { id: BlokTur; ad: string; alt: string }[] = [
  { id: "baslik", ad: "Başlık", alt: "Büyük ve kalın satır" }, { id: "metin", ad: "Paragraf", alt: "Kalın için **yıldız**, bağlantı için [metin](adres)" },
  { id: "dugme", ad: "Düğme", alt: "Marka renginde çağrı" }, { id: "gorsel", ad: "Görsel", alt: "Gönderi görseli ya da adres" }, { id: "ayirici", ad: "Ayırıcı", alt: "İnce çizgi" },
];
export type KampanyaDurum = "taslak" | "zamanlandi" | "gonderiliyor" | "gonderildi" | "durdu";
/** d: "bekle" konu satırı denemesinin kazananını bekleyen alıcı. v: konu satırı sırası. k: kazanan konuyla gönderildi. z: kişiye göre gönderim anı. g: gönderildiği an. */
export type Alici = { e: string; ad: string; d: "bekliyor" | "gonderildi" | "hata" | "bekle"; h?: string; a?: number; ac?: number; t?: number; tl?: number[]; c?: number; v?: number; z?: number; g?: number; k?: boolean };
/** Konu satırı A/B denemesi (Mailchimp ve Klaviyo karşılığı): kitlenin bir payı konulara bölünür, süre sonunda kazanan kalanlara gider. */
export type KonuDeneyi = { konular: string[]; pay: number; sure: number; olcut: "acilma" | "tik"; asama?: "test" | "bitti"; testBitis?: number; kazanan?: number; neden?: string };
export type Kampanya = {
  id: string; ad: string; konu: string; onMetin: string; bloklar: Blok[];
  segmentId?: string; suzgec: Suzgec;
  /** İzni belirsiz kişileri de kat (sahibin beyanıyla); reddedenler ve çıkanlar hiçbir zaman. */ izinsizKat?: boolean; izinBeyan?: number;
  durum: KampanyaDurum; zaman?: number; gonderimBas?: number; gonderimBit?: number; koken?: string;
  baglantilar: string[]; alicilar: Alici[]; denemeler: { kime: string; zaman: number; ok: boolean; hata?: string }[];
  olusturma: number; guncelleme: number; hata?: string; model?: string;
  /** Konu satırı denemesi (en az 2 konu). */ ab?: KonuDeneyi;
  /** Gönderim saati: herkese aynı anda ya da her kişiye kendi en iyi saatinde (24 saat içinde). */ saatKip?: "hemen" | "kisisel";
  /** Bülten: İşletme'nin son yazılarından ya da ürünlerinden oluşturuldu. */ bulten?: boolean;
};
export const ETIKETLER_EPOSTA = ["{ad}", "{eposta}", "{site}", "{davet_baglantisi}", "{davet_kodu}"] as const;
export type MarkaOzet = { renk: string; logo?: string; iletisim?: string; site: string; yazi?: string; koken?: string; adres?: string };
export type Doldurma = { ad?: string; eposta?: string; davetBaglantisi?: string; davetKodu?: string };

const kacir = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
export const etiketDoldur = (s: string, site: string, d: Doldurma) => s.replace(/\{(ad|eposta|site|davet_baglantisi|davet_kodu)\}/g, (_, k: string) => (k === "ad" ? d.ad || "" : k === "eposta" ? d.eposta || "" : k === "site" ? site : k === "davet_kodu" ? d.davetKodu || "" : d.davetBaglantisi || "")).replace(/Merhaba ,/g, "Merhaba,").replace(/Merhaba\s+!/g, "Merhaba!");
const renkGecerli = (r: unknown): r is string => typeof r === "string" && /^#[0-9a-f]{6}$/i.test(r);
function yaziRengi(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#111111" : "#ffffff";
}
const guvenliAdres = (u?: string) => !!u && /^(https?:\/\/|mailto:|tel:)[^\s"'<>]+$/i.test(u.trim());
/** Paragraf içi: **kalın** ve [metin](adres). */
function satirIci(s: string, renk: string): string {
  return kacir(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:)[^\s)]+)\)/g, (_, t: string, u: string) => `<a href="${u}" style="color:${renk};text-decoration:underline">${t}</a>`)
    .replace(/\n/g, "<br>");
}
/** Bloklardaki bağlantılar (gönderim sırası; tık izleme bu sıra numarasını kullanır). */
export function kampanyaBaglantilari(bloklar: Blok[]): string[] {
  const l: string[] = [];
  for (const b of bloklar) {
    if ((b.tur === "dugme" || b.tur === "gorsel") && guvenliAdres(b.adres)) l.push(b.adres!.trim());
    if (b.tur === "metin" && b.metin) for (const m of b.metin.matchAll(/\]\(((?:https?:\/\/|mailto:|tel:)[^\s)]+)\)/g)) l.push(m[1]);
  }
  return [...new Set(l)];
}

/**
 * Kampanya HTML'i (tablo tabanlı, e-posta istemcilerinde güvenli). İzleme varsa bağlantılar izleme adresine çevrilir,
 * açılma pikseli ve abonelikten çıkma bağlantısı eklenir. Önizlemede izleme yoktur; çıkma bağlantısı yer tutucudur.
 */
export function kampanyaHtml(k: Pick<Kampanya, "konu" | "onMetin" | "bloklar">, m: MarkaOzet, d: Doldurma, iz?: { piksel: string; tik: (i: number) => string; cik: string }): string {
  const renk = renkGecerli(m.renk) ? m.renk : "#111111";
  const yazi = (m.yazi || "-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif").replace(/[<>"{};]/g, "");
  const dolu = (s: string) => etiketDoldur(s, m.site, d);
  const baglantilar = kampanyaBaglantilari(k.bloklar.map((b) => ({ ...b, metin: b.metin ? dolu(b.metin) : b.metin, adres: b.adres ? dolu(b.adres) : b.adres })));
  const izle = (u: string) => { if (!iz) return u; const i = baglantilar.indexOf(u); return i < 0 ? u : iz.tik(i); };
  const govde = k.bloklar.map((b) => {
    const metin = dolu(b.metin ?? "");
    const adres = b.adres ? dolu(b.adres).trim() : "";
    if (b.tur === "baslik") return `<h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:700;color:#111827">${kacir(metin)}</h1>`;
    if (b.tur === "metin") {
      let h = metin.split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${satirIci(p, renk)}</p>`).join("");
      if (iz) h = h.replace(/href="([^"]+)"/g, (_, u: string) => `href="${kacir(izle(u.replace(/&amp;/g, "&")))}"`);
      return h;
    }
    if (b.tur === "dugme") return guvenliAdres(adres) && metin ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 18px"><tr><td style="border-radius:10px;background:${renk}"><a href="${kacir(izle(adres))}" style="display:inline-block;padding:12px 22px;font-weight:600;font-size:15px;color:${yaziRengi(renk)};text-decoration:none;border-radius:10px">${kacir(metin)}</a></td></tr></table>` : "";
    if (b.tur === "gorsel") {
      if (!b.gorsel || !/^(https?:\/\/|\/api\/dosya\/gorsel\/)[^\s"'<>]+$/.test(b.gorsel)) return "";
      const src = b.gorsel.startsWith("/") ? (m.koken ?? (iz ? new URL(iz.piksel).origin : "")) + b.gorsel : b.gorsel;
      const img = `<img src="${kacir(src)}" alt="${kacir(metin)}" width="464" style="display:block;width:100%;max-width:464px;height:auto;border:0;border-radius:12px;margin:0 0 16px">`;
      return guvenliAdres(adres) ? `<a href="${kacir(izle(adres))}">${img}</a>` : img;
    }
    return `<hr style="border:0;border-top:1px solid #e5e7eb;margin:18px 0">`;
  }).join("");
  const logo = m.logo && /^https:\/\//.test(m.logo) ? `<img src="${kacir(m.logo)}" alt="${kacir(m.site)}" height="34" style="display:block;height:34px;width:auto;border:0">` : `<span style="font:700 17px/1.3 ${yazi};color:#111">${kacir(m.site)}</span>`;
  const cik = iz ? iz.cik : "#abonelikten-cik";
  const onMetin = k.onMetin ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${kacir(dolu(k.onMetin))}</div>` : "";
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${kacir(dolu(k.konu))}</title></head><body style="margin:0;padding:0;background:#f4f5f7">${onMetin}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:28px 12px"><tr><td align="center">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb">`
    + `<tr><td style="padding:22px 28px 8px;border-top:4px solid ${renk};border-radius:16px 16px 0 0">${logo}</td></tr>`
    + `<tr><td style="padding:12px 28px 22px;font:15px/1.6 ${yazi};color:#111827">${govde}</td></tr></table>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px"><tr><td style="padding:14px 28px;font:12px/1.55 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#9ca3af;text-align:center">`
    + (m.iletisim ? `<p style="margin:0 0 6px">${kacir(m.iletisim).replace(/\n/g, "<br>")}</p>` : "")
    + (m.adres && !(m.iletisim ?? "").includes(m.adres) ? `<p style="margin:0 0 6px">${kacir(m.adres).replace(/\n/g, "<br>")}</p>` : "")
    + `<p style="margin:0">Bu e-postayı ${kacir(m.site)} ile ilgili bilgi almayı kabul ettiğin için aldın. <a href="${kacir(cik)}" style="color:#6b7280;text-decoration:underline">Abonelikten çık</a></p></td></tr></table>`
    + (iz ? `<img src="${kacir(iz.piksel)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0">` : "")
    + `</td></tr></table></body></html>`;
}
/** Düz metin sürümü (e-posta istemcisi HTML açmazsa). */
export function kampanyaMetni(k: Pick<Kampanya, "bloklar">, site: string, d: Doldurma, cik: string): string {
  const l = k.bloklar.map((b) => {
    const m = etiketDoldur(b.metin ?? "", site, d).replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
    if (b.tur === "dugme") return b.adres ? `${m}: ${etiketDoldur(b.adres, site, d)}` : m;
    if (b.tur === "ayirici") return "----";
    if (b.tur === "gorsel") return "";
    return m;
  }).filter(Boolean);
  return `${l.join("\n\n")}\n\n----\nAbonelikten çıkmak için: ${cik}\n`;
}

/** Konu satırı yardımcısı (Mailchimp Subject Line Helper karşılığı): uzunluk, büyük harf, ünlem, kişiselleştirme. */
export function konuIpuclari(konu: string): { iyi: boolean; metin: string }[] {
  const n = [...konu].length;
  const sozcuk = konu.trim().split(/\s+/).filter(Boolean).length;
  const buyuk = konu.replace(/[^A-ZÇĞİÖŞÜ]/g, "").length;
  const harf = konu.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, "").length || 1;
  const ipucu: { iyi: boolean; metin: string }[] = [];
  ipucu.push(n >= 20 && n <= 60 ? { iyi: true, metin: `${n} karakter, telefonda tam görünür` } : { iyi: false, metin: n < 20 ? `${n} karakter; biraz daha açıklayıcı yaz` : `${n} karakter; telefonda 60 karakterden sonrası kesilir` });
  ipucu.push(sozcuk <= 9 ? { iyi: true, metin: `${sozcuk} sözcük` } : { iyi: false, metin: `${sozcuk} sözcük; 9 ve altı daha çok açılır` });
  if (buyuk / harf > 0.4 && harf > 6) ipucu.push({ iyi: false, metin: "Büyük harf çok; spam süzgecine takılabilir" });
  if ((konu.match(/!/g)?.length ?? 0) > 1) ipucu.push({ iyi: false, metin: "Birden çok ünlem var" });
  if (/bedava|ücretsiz!|kazandınız|acele|son şans!!/i.test(konu)) ipucu.push({ iyi: false, metin: "Spam sözcüğü olabilir: bedava, kazandınız, acele" });
  if (konu.includes("{ad}")) ipucu.push({ iyi: true, metin: "Ada göre kişiselleştirilmiş" });
  return ipucu;
}

/* ── Bağlantılar: UTM ve kısa bağlantı ── */
export type Utm = { kaynak: string; ortam: string; kampanya: string; icerik?: string; terim?: string };
export type Baglanti = {
  id: string; ad: string; hedef: string; utm?: Utm; kod?: string; olusturma: number;
  tik: number; gunler: Record<string, number>; kaynaklar: Record<string, number>; cihazlar: Record<string, number>; sonTik?: number;
};
export const UTM_HAZIR: { id: string; ad: string; kaynak: string; ortam: string; logo?: string }[] = [
  { id: "ig-bio", ad: "Instagram biyografi", kaynak: "instagram", ortam: "social", logo: "/marka/renkli/instagram-color.svg" },
  { id: "ig-hikaye", ad: "Instagram hikâye", kaynak: "instagram", ortam: "story", logo: "/marka/renkli/instagram-color.svg" },
  { id: "tiktok", ad: "TikTok", kaynak: "tiktok", ortam: "social", logo: "/marka/renkli/tiktok-color.svg" },
  { id: "whatsapp", ad: "WhatsApp", kaynak: "whatsapp", ortam: "social", logo: "/marka/renkli/whatsapp-color.svg" },
  { id: "linkedin", ad: "LinkedIn", kaynak: "linkedin", ortam: "social", logo: "/marka/renkli/linkedin-color.svg" },
  { id: "x", ad: "X", kaynak: "x", ortam: "social", logo: "/marka/renkli/x-beyaz.svg" },
  { id: "google-ads", ad: "Google Ads", kaynak: "google", ortam: "cpc", logo: "/marka/renkli/google-ads.svg" },
  { id: "meta-ads", ad: "Meta reklam", kaynak: "meta", ortam: "paid", logo: "/marka/renkli/meta-color.svg" },
  { id: "bulten", ad: "E-posta bülteni", kaynak: "bulten", ortam: "email" },
  { id: "afis", ad: "Afiş ve karekod", kaynak: "karekod", ortam: "offline" },
];
const utmParca = (s: string) => s.trim().toLocaleLowerCase("tr-TR").replace(/[çğıöşü]/g, (h) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[h] ?? h).replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
export const utmTemizle = (u: Utm): Utm => ({ kaynak: utmParca(u.kaynak), ortam: utmParca(u.ortam), kampanya: utmParca(u.kampanya), icerik: u.icerik ? utmParca(u.icerik) : undefined, terim: u.terim ? utmParca(u.terim) : undefined });
export function utmEkle(hedef: string, u0?: Utm): string {
  if (!u0) return hedef;
  const u = utmTemizle(u0);
  try {
    const x = new URL(hedef);
    if (u.kaynak) x.searchParams.set("utm_source", u.kaynak);
    if (u.ortam) x.searchParams.set("utm_medium", u.ortam);
    if (u.kampanya) x.searchParams.set("utm_campaign", u.kampanya);
    if (u.icerik) x.searchParams.set("utm_content", u.icerik);
    if (u.terim) x.searchParams.set("utm_term", u.terim);
    return x.toString();
  } catch { return hedef; }
}
export const kodGecerli = (k: string) => /^[A-Za-z0-9_-]{3,32}$/.test(k);

/* ── A/B denemeleri ── */
export type DeneyHedef = { tur: "form" } | { tur: "sayfa"; sayfa: string } | { tur: "olay"; ad: string };
export type DeneyDurum = "taslak" | "calisiyor" | "durdu" | "bitti";
export type Deney = {
  id: string; ad: string; sayfa: string; varyant: string; pay: number; hedef: DeneyHedef; hipotez: string;
  durum: DeneyDurum; baslangic?: number; bitis?: number; kazanan?: "a" | "b"; olusturma: number;
  /** Sunucuda tekil ziyaretçiden hesaplanır (yazılmaz). */ a?: { g: number; d: number }; b?: { g: number; d: number };
};
const normalDagilim = (z: number) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const d = 0.3989423 * Math.exp((-z * z) / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; };
/** Sonuç: oranlar, göreli artış ve B'nin daha iyi olma olasılığı (normal yaklaşım). Her kolda en az 100 ziyaretçi ve 10 dönüşüm yoksa "yeterli değil". */
export function deneySonuc(d: Pick<Deney, "a" | "b">) {
  const a = d.a ?? { g: 0, d: 0 }, b = d.b ?? { g: 0, d: 0 };
  const pa = a.g ? a.d / a.g : 0, pb = b.g ? b.d / b.g : 0;
  const sd = Math.sqrt((a.g ? (pa * (1 - pa)) / a.g : 0) + (b.g ? (pb * (1 - pb)) / b.g : 0));
  const olasilik = !a.g || !b.g ? 0.5 : sd === 0 ? (pb > pa ? 1 : pb < pa ? 0 : 0.5) : normalDagilim((pb - pa) / sd);
  const yeterli = a.g >= 100 && b.g >= 100 && a.d + b.d >= 10;
  return { pa, pb, artis: pa ? (pb - pa) / pa : 0, olasilik, yeterli, a, b };
}

/* ── Marka kiti ── */
export type MarkaKiti = {
  renkler: { ad: string; hex: string }[]; baslikYazi: string; govdeYazi: string;
  ton: string; yasakli: string[]; logo?: string; slogan?: string;
  /** E-postaların altında görünen gönderen kimliği (6563 sayılı Kanun gereği ad ve iletişim bilgisi). */ iletisim: string;
  guncelleme: number;
};
export const bosMarka = (): MarkaKiti => ({ renkler: [], baslikYazi: "", govdeYazi: "", ton: "", yasakli: [], iletisim: "", guncelleme: 0 });
/** Modele giden marka bölümü. */
export function markaIstemi(m: MarkaKiti | null): string {
  if (!m) return "";
  const s: string[] = [];
  if (m.ton.trim()) s.push(`Marka sesi: ${m.ton.trim()}`);
  if (m.slogan?.trim()) s.push(`Slogan: ${m.slogan.trim()}`);
  if (m.yasakli.length) s.push(`Bu sözcükleri asla kullanma: ${m.yasakli.join(", ")}`);
  return s.length ? `Marka kiti:\n${s.join("\n")}` : "";
}

/* ── İndirim ve tavsiye ── */
export type IndirimKodu = { id: string; kod: string; tur: "yuzde" | "tutar"; deger: number; bitis?: string; sinir?: number; kullanim: number; aciklama: string; aktif: boolean; olusturma: number };
export type TavsiyeAyar = { acik: boolean; davetEdenOdul: string; davetliOdul: string; kodId?: string };
export const kodUygun = (k: IndirimKodu, bugun: string) => k.aktif && (!k.bitis || k.bitis >= bugun) && (!k.sinir || k.kullanim < k.sinir);
/** Kişiye özel davet kodu: e-postadan türetilir (aynı kişiye her zaman aynı kod). */
export function davetKodu(anahtar: string): string {
  let h = 2166136261;
  for (const c of anahtar) { h ^= c.codePointAt(0)!; h = Math.imul(h, 16777619) >>> 0; }
  const A = "ABCDEFGHJKLMNPRSTUVYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) { s += A[h % A.length]; h = (Math.floor(h / A.length) ^ Math.imul(h, 2654435761)) >>> 0; }
  return s;
}

/* ── Paylaşım saatleri (Buffer posting schedule karşılığı) ── */
export type Saat = { gun: number; saat: string };
export type PaylasimSaatleri = Partial<Record<IcerikKanalId, Saat[]>>;
export const HAFTA_GUN = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
export const VARSAYILAN_SAATLER: PaylasimSaatleri = {
  instagram: [{ gun: 1, saat: "19:00" }, { gun: 3, saat: "19:00" }, { gun: 5, saat: "11:00" }],
  hikaye: [{ gun: 0, saat: "09:00" }, { gun: 2, saat: "09:00" }, { gun: 4, saat: "17:00" }],
  tiktok: [{ gun: 2, saat: "20:00" }, { gun: 5, saat: "20:00" }],
  linkedin: [{ gun: 1, saat: "09:30" }, { gun: 3, saat: "09:30" }],
  x: [{ gun: 0, saat: "12:30" }, { gun: 2, saat: "12:30" }, { gun: 4, saat: "12:30" }],
  whatsapp: [{ gun: 4, saat: "10:00" }],
  eposta: [{ gun: 1, saat: "10:00" }],
};
export const saatGecerli = (s: unknown): s is string => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
/** Kanalın sıradaki boş saati (dolu: "YYYY-MM-DD HH:MM" kümesi), işletmenin saat diliminde. */
export function siradakiSaat(saatler: Saat[], dolu: Set<string>, simdi = Date.now(), tz = "Europe/Istanbul"): { tarih: string; saat: string } | null {
  if (!saatler.length) return null;
  const fark = dilimFark(simdi, tz);
  for (let g = 0; g < 70; g++) {
    const t = new Date(simdi + fark + g * 864e5);
    const tarih = t.toISOString().slice(0, 10);
    const hg = (t.getUTCDay() + 6) % 7;
    const suan = new Date(simdi + fark).toISOString().slice(11, 16);
    for (const s of [...saatler].filter((x) => x.gun === hg).sort((a, b) => a.saat.localeCompare(b.saat))) {
      if (g === 0 && s.saat <= suan) continue;
      if (!dolu.has(`${tarih} ${s.saat}`)) return { tarih, saat: s.saat };
    }
  }
  return null;
}

/* ── Rakip analizi ── */
export type RakipOkunan = { baslik: string; aciklama: string; h1: string; basliklar: string[]; cagrilar: string[]; fiyatlar: string[]; sosyal: string[]; kelime: number; dil?: string };
export type RakipAnaliz = {
  id: string; adres: string; ad: string; okunan: RakipOkunan; zaman: number; model?: string; uyari?: string;
  analiz?: { ozet: string; rakipKonum: string; bizimKonum: string; karsilastirma: { boyut: string; biz: string; rakip: string }[]; firsatlar: string[]; mesajlar: string[]; dikkat: string[] };
};

/* ── SEO ── */
export type AnahtarFikir = { id: string; kelime: string; niyet: NiyetId; sayfa: string; neden: string; yeniSayfa: boolean };
export type SeoAyar = { hedefler: Record<string, string>; kelimeler: AnahtarFikir[]; kelimeZaman?: number; model?: string };
export type SeoSorun = { id: string; durum: "tamam" | "uyari" | "hata"; agirlik: number; baslik: string; ayrinti: string; istem?: string };
export type SeoSayfa = { sayfa: string; puan: number; sorunlar: SeoSorun[]; baslik: string; kelime: number };

const etiketsiz = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
const ozn = (etiket: string | undefined, ad: string) => { const m = etiket?.match(new RegExp(ad + "=(?:\"([^\"]*)\"|'([^']*)')", "i")); return (m?.[1] ?? m?.[2] ?? "").trim(); };
/** Sayfa başına SEO denetimi (projenin taslak dosyaları; Semrush On Page ve Base44 SEO tarayıcı karşılığı). */
export function seoDenetle(p: Pick<Proje, "dosyalar" | "ayarlar" | "ad">, hedefler: Record<string, string> = {}): SeoSayfa[] {
  const sayfalar = Object.keys(p.dosyalar).filter((y) => y.endsWith(".html") && y !== "404.html" && !/-b\.html$/.test(y)).sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));
  return sayfalar.map((yol) => {
    const h = p.dosyalar[yol];
    const ana = yol === "index.html";
    const govdeHtml = h.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? h;
    const metin = etiketsiz(govdeHtml);
    const kelime = metin ? metin.split(" ").length : 0;
    const title = etiketsiz(h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || (ana ? p.ayarlar.seo.baslik : "");
    const desc = ozn(h.match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0], "content") || (ana ? p.ayarlar.seo.aciklama : "");
    const h1ler = [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => etiketsiz(m[1]));
    const h2 = /<h2[\s>]/i.test(h);
    const lang = /<html[^>]+lang=["'][a-z-]{2,}["']/i.test(h);
    const viewport = /<meta[^>]+name=["']viewport["']/i.test(h);
    const imgler = [...h.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
    const altsiz = imgler.filter((i) => !/\balt=["'][^"']+["']/i.test(i)).length;
    const icBag = [...h.matchAll(/<a[^>]+href=["']([^"'#][^"']*)["']/gi)].map((m) => m[1]).filter((u) => !/^(https?:)?\/\//i.test(u) && !/^(mailto|tel|javascript):/i.test(u)).length;
    const og = /property=["']og:image["']/i.test(h) || (ana && !!p.ayarlar.seo.ogGorsel);
    const ld = /<script[^>]+type=["']application\/ld\+json["']/i.test(h);
    const hedef = (hedefler[yol] ?? "").trim().toLocaleLowerCase("tr-TR");
    const s: SeoSorun[] = [];
    const ekle = (id: string, durum: SeoSorun["durum"], agirlik: number, baslik: string, ayrinti: string, istem?: string) => s.push({ id, durum, agirlik, baslik, ayrinti, istem: durum === "tamam" ? undefined : istem });
    const tl = [...title].length, dl = [...desc].length;
    ekle("baslik", !tl ? "hata" : tl >= 30 && tl <= 60 ? "tamam" : tl >= 15 && tl <= 70 ? "uyari" : "hata", 14, "Sayfa başlığı", !tl ? "Başlık etiketi yok." : `${tl} karakter: ${title}`, `${yol} sayfasının <title> etiketini 30 ile 60 karakter arasında, sayfanın konusunu ve markayı anlatan bir başlıkla yeniden yaz.`);
    ekle("aciklama", !dl ? "hata" : dl >= 120 && dl <= 160 ? "tamam" : dl >= 50 && dl <= 175 ? "uyari" : "hata", 12, "Arama açıklaması", !dl ? "Açıklama yok; Google sayfadan rastgele bir parça seçer." : `${dl} karakter`, `${yol} sayfasına 120 ile 160 karakter arasında, tıklamaya çağıran bir meta description ekle.`);
    ekle("h1", h1ler.length === 1 ? "tamam" : h1ler.length ? "uyari" : "hata", 12, "Tek ana başlık (h1)", h1ler.length === 1 ? h1ler[0].slice(0, 80) : h1ler.length ? `${h1ler.length} tane h1 var; arama motoru hangisinin ana konu olduğunu anlayamaz.` : "Sayfada h1 yok.", `${yol} sayfasında tek bir h1 ana başlık olsun; diğer başlıkları h2 yap.`);
    ekle("h2", h2 ? "tamam" : "uyari", 5, "Ara başlıklar (h2)", h2 ? "Bölümler ara başlıkla ayrılmış." : "Ara başlık yok; uzun metin taranırken bölünmüyor.", `${yol} sayfasının bölümlerine anlamlı h2 ara başlıklar ekle.`);
    ekle("kelime", kelime >= 300 ? "tamam" : kelime >= 120 ? "uyari" : "hata", 10, "İçerik uzunluğu", `${kelime} sözcük${kelime < 300 ? "; 300 ve üstü sayfalar aramada daha güçlü" : ""}`, `${yol} sayfasına ziyaretçinin sık sorduğu sorulara cevap veren, en az 300 sözcüklük gerçek içerik ekle (uydurma bilgi yazma).`);
    ekle("viewport", viewport ? "tamam" : "hata", 8, "Telefon uyumu", viewport ? "Görünüm alanı etiketi var." : "viewport etiketi yok.", `${yol} sayfasına viewport etiketi ekle ve 390 piksel genişlikte taşma olmasın.`);
    ekle("lang", lang ? "tamam" : "uyari", 4, "Sayfa dili", lang ? "html etiketinde dil belirtilmiş." : "html lang yok.", `${yol} sayfasının html etiketine lang="tr" ekle.`);
    ekle("alt", !imgler.length || !altsiz ? "tamam" : "uyari", 7, "Görsel açıklamaları", !imgler.length ? "Görsel yok." : altsiz ? `${imgler.length} görselden ${altsiz} tanesinin alt metni yok.` : `${imgler.length} görselin hepsinde alt metni var.`, `${yol} sayfasındaki alt metni olmayan görsellere içeriği anlatan Türkçe alt metni ekle.`);
    ekle("ic", icBag >= 2 ? "tamam" : "uyari", 6, "Site içi bağlantılar", `${icBag} iç bağlantı`, `${yol} sayfasından sitenin diğer önemli sayfalarına doğal metin içinde bağlantı ver.`);
    ekle("og", og ? "tamam" : "uyari", 6, "Paylaşım görseli", og ? "og:image tanımlı." : "Bağlantı paylaşıldığında görsel çıkmaz.", "Bütün sayfalara 1200 x 630 paylaşım görseli için og:image ve twitter:card etiketleri ekle.");
    ekle("ld", ld ? "tamam" : "uyari", 6, "Yapılandırılmış veri", ld ? "JSON-LD şeması var." : "Schema.org verisi yok; zengin sonuç ve yapay zekâ aramasında görünürlük düşer.", `${yol} sayfasına işletmeye uygun schema.org JSON-LD (LocalBusiness, Product ya da Organization) ekle; bilmediğin adres ya da telefonu uydurma.`);
    if (hedef) {
      const t = title.toLocaleLowerCase("tr-TR"), ilk = metin.toLocaleLowerCase("tr-TR").split(" ").slice(0, 120).join(" ");
      ekle("k-baslik", t.includes(hedef) ? "tamam" : "uyari", 4, "Hedef kelime başlıkta", t.includes(hedef) ? `"${hedef}" başlıkta geçiyor.` : `"${hedef}" başlıkta yok.`, `${yol} sayfasının başlığına "${hedef}" ifadesini doğal biçimde kat.`);
      ekle("k-h1", h1ler.some((x) => x.toLocaleLowerCase("tr-TR").includes(hedef)) ? "tamam" : "uyari", 3, "Hedef kelime h1'de", "", `${yol} sayfasının h1 başlığına "${hedef}" ifadesini doğal biçimde kat.`);
      ekle("k-aciklama", desc.toLocaleLowerCase("tr-TR").includes(hedef) ? "tamam" : "uyari", 2, "Hedef kelime açıklamada", "", `${yol} sayfasının meta açıklamasında "${hedef}" ifadesi geçsin.`);
      ekle("k-giris", ilk.includes(hedef) ? "tamam" : "uyari", 3, "Hedef kelime girişte", "", `${yol} sayfasının ilk paragrafında "${hedef}" ifadesi doğal biçimde geçsin.`);
    }
    const toplam = s.reduce((t, x) => t + x.agirlik, 0);
    const kazanc = s.reduce((t, x) => t + (x.durum === "tamam" ? x.agirlik : x.durum === "uyari" ? x.agirlik * 0.5 : 0), 0);
    return { sayfa: yol, puan: Math.round((kazanc / toplam) * 100), sorunlar: s, baslik: title, kelime };
  });
}

/* ── Haftalık rapor ── */
export type RaporMetrik = { id: string; ad: string; simdi: number; once: number };
export type Rapor = {
  id: string; bas: string; bit: string; olusturma: number; otomatik?: boolean;
  metrikler: RaporMetrik[]; kanallar: { ad: string; adet: number }[]; kampanyalar: { ad: string; adet: number }[]; sayfalar: { ad: string; adet: number }[];
  oneCikanlar: string[]; yorum?: { ozet: string; oneriler: string[] }; model?: string;
};

/* ── E-posta izin rejimleri ── */
/**
 * gdpr: AB, AEA ve İngiltere (açık onay, çift onay önerilir, izin kaydı, unutulma hakkı); canspam: ABD (fiziksel posta
 * adresi, çalışan çıkma bağlantısı, 10 iş günü içinde işleme); casl: Kanada (açık ya da zımni onay, zımni onay iki yıl,
 * gönderen kimliği ve posta adresi); spam: Avustralya Spam Act 2003; iys: Türkiye 6563 sayılı Kanun ve İYS.
 */
export type EpostaRejim = "gdpr" | "canspam" | "casl" | "spam" | "iys";
export const EPOSTA_REJIMLERI: { id: EpostaRejim; ad: string; alt: string }[] = [
  { id: "gdpr", ad: "GDPR ve UK GDPR", alt: "AB, AEA ve İngiltere: açık onay, izin kaydı, unutulma hakkı; çift onay önerilir" },
  { id: "canspam", ad: "CAN-SPAM", alt: "ABD: doğru gönderen ve konu, fiziksel posta adresi, çalışan çıkma bağlantısı" },
  { id: "casl", ad: "CASL", alt: "Kanada: açık ya da zımni onay (iki yıl), gönderen kimliği ve posta adresi" },
  { id: "spam", ad: "Spam Act", alt: "Avustralya: onay, gönderen kimliği, çalışan çıkma bağlantısı" },
  { id: "iys", ad: "İYS ve 6563", alt: "Türkiye: önceden onay ve İleti Yönetim Sistemi kaydı" },
];
export type IzinAyar = {
  /** Çift onay (double opt-in): abone onay e-postasındaki bağlantıya tıklayınca onaylı sayılır. bolge: AB, İngiltere, İsviçre ve Kanada ziyaretçilerinde. */
  ciftOnay: "kapali" | "bolge" | "herkes";
  /** Uyulan rejimler; boşsa işletmenin ülkesinden. */
  rejimler: EpostaRejim[];
  /** Her ticari iletinin altına yazılan fiziksel posta adresi (CAN-SPAM, CASL, Spam Act). */
  postaAdresi: string;
};
export const VARSAYILAN_IZIN_AYAR: IzinAyar = { ciftOnay: "bolge", rejimler: [], postaAdresi: "" };

/* ── Bütün ek veri ── */
export type EkVeri = {
  /** E-posta izin rejimi ayarları. */
  izinAyar: IzinAyar;
  /** Unutulma hakkıyla silinen kişiler: e-postanın SHA-256 özeti ve silinme zamanı (yeniden eklenmesin diye yalnız özet tutulur). */
  silinenler: Record<string, number>;
  kisiMeta: Record<string, KisiMeta>; cikanlar: Record<string, { z: number; kaynak: string }>; segmentler: Segment[];
  kampanyalar: Kampanya[]; baglantilar: Baglanti[]; deneyler: Deney[]; marka: MarkaKiti | null;
  kodlar: IndirimKodu[]; tavsiye: TavsiyeAyar; saatler: PaylasimSaatleri; rakipler: RakipAnaliz[]; seo: SeoAyar;
  raporlar: Rapor[]; raporOtomatik: boolean; guncelleme: number;
  /* v5 */
  akislar: Akis[]; bio: BioSayfa | null; gorunurluk: GorunurlukVeri; gbp: GbpVeri; iys: IysAyar;
  sosyal: SosyalHesap[]; yayinlar: Record<string, YayinKaydi>; sosyalOtomatik: boolean;
};
export const bosEk = (): EkVeri => ({
  izinAyar: { ...VARSAYILAN_IZIN_AYAR }, silinenler: {},
  kisiMeta: {}, cikanlar: {}, segmentler: [], kampanyalar: [], baglantilar: [], deneyler: [], marka: null, kodlar: [], tavsiye: { acik: false, davetEdenOdul: "", davetliOdul: "" }, saatler: {}, rakipler: [], seo: { hedefler: {}, kelimeler: [] }, raporlar: [], raporOtomatik: false, guncelleme: 0,
  akislar: [], bio: null, gorunurluk: { sorular: [], testler: [], gecmis: [] }, gbp: { gonderiler: [] }, iys: { aktarimlar: [] }, sosyal: [], yayinlar: {}, sosyalOtomatik: false,
});

/** Kampanyanın alıcıları ve sayılar (önizleme için de). */
export function kitleHesapla(kisiler: Kisi[], k: Pick<Kampanya, "suzgec" | "izinsizKat">, ek: Pick<EkVeri, "cikanlar">) {
  const segment = suz(kisiler, { ...k.suzgec, cikanlar: "dahil", izin: k.suzgec.izin === "ret" ? "ret" : "tum" }).filter((x) => x.eposta);
  const cikan = segment.filter((x) => x.cikti || ek.cikanlar[x.eposta!]);
  const red = segment.filter((x) => !cikan.includes(x) && x.izin === "ret");
  const onayli = segment.filter((x) => !cikan.includes(x) && x.izin === "onay");
  const belirsiz = segment.filter((x) => !cikan.includes(x) && x.izin === "bilinmiyor");
  const alicilar = [...onayli, ...(k.izinsizKat ? belirsiz : [])];
  return { segment: segment.length, onayli: onayli.length, belirsiz: belirsiz.length, red: red.length, cikan: cikan.length, alicilar };
}

/** İstemciye giden kampanya özeti (alıcı listesi yerine sayılar). */
export type KonuSonuc = { konu: string; gonderildi: number; acilan: number; tiklayan: number };
export type KampanyaOzet = Omit<Kampanya, "alicilar"> & { sayac: { toplam: number; gonderildi: number; hata: number; acilan: number; tiklayan: number; cikan: number; bekliyor: number; bekle: number; sonraki?: number }; tiklar: number[]; konuSonuc?: KonuSonuc[] };
/** Konu satırı denemesinde her konunun sonucu (yalnız test kolundaki alıcılar; kazanan gönderimi sayılmaz). */
export function konuSonuclari(k: Pick<Kampanya, "ab" | "konu" | "alicilar">): KonuSonuc[] | undefined {
  if (!k.ab?.konular?.length) return undefined;
  const konular = [k.konu, ...k.ab.konular.slice(1)];
  return konular.map((konu, v) => { const l = k.alicilar.filter((a) => a.v === v && a.d === "gonderildi" && !a.k); return { konu, gonderildi: l.length, acilan: l.filter((a) => a.a).length, tiklayan: l.filter((a) => a.t).length }; });
}
export function kampanyaOzetle(k: Kampanya): KampanyaOzet {
  const { alicilar, ...geri } = k;
  const tiklar = k.baglantilar.map((_, i) => alicilar.filter((a) => a.tl?.includes(i)).length);
  const gelecek = alicilar.filter((a) => a.d === "bekliyor" && a.z && a.z > Date.now()).map((a) => a.z!);
  return { ...geri, tiklar, konuSonuc: konuSonuclari(k), sayac: { toplam: alicilar.length, gonderildi: alicilar.filter((a) => a.d === "gonderildi").length, hata: alicilar.filter((a) => a.d === "hata").length, acilan: alicilar.filter((a) => a.a).length, tiklayan: alicilar.filter((a) => a.t).length, cikan: alicilar.filter((a) => a.c).length, bekliyor: alicilar.filter((a) => a.d === "bekliyor").length, bekle: alicilar.filter((a) => a.d === "bekle").length, sonraki: gelecek.length ? Math.min(...gelecek) : undefined } };
}

/* ── Gönderim saati profili (en iyi saat ve kişiye göre saat) ── */
export type SaatProfili = { isi: number[][]; toplam: number; enIyi: { gun: number; saat: number } | null; enIyiSaat: number; kisiSayisi: number; kisiSaat: Record<string, number>; tz: string };
/**
 * Açılma ve tık anlarından (işletmenin saat diliminde) gün ve saat ısı haritası. Tık iki kat sayılır. Kişinin en iyi saati: en az iki
 * olay varsa en sık saati. Projenin en iyi saati: en az 10 olay varsa en yoğun saat, yoksa 10:00.
 */
export function saatProfiliHesapla(olaylar: { e: string; z: number; tik?: boolean }[], tz = "Europe/Istanbul"): SaatProfili {
  const isi = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  const saat = Array<number>(24).fill(0);
  const kisi = new Map<string, number[]>();
  for (const o of olaylar) {
    const t = new Date(o.z + dilimFark(o.z, tz)), g = (t.getUTCDay() + 6) % 7, h = t.getUTCHours(), w = o.tik ? 2 : 1;
    isi[g][h] += w; saat[h] += w;
    const l = kisi.get(o.e) ?? Array<number>(24).fill(0); l[h] += w; kisi.set(o.e, l);
  }
  const toplam = saat.reduce((a, b) => a + b, 0);
  let enIyi: SaatProfili["enIyi"] = null, en = 0;
  for (let g = 0; g < 7; g++) for (let h = 0; h < 24; h++) if (isi[g][h] > en) { en = isi[g][h]; enIyi = { gun: g, saat: h }; }
  const enIyiSaat = toplam >= 10 ? saat.indexOf(Math.max(...saat)) : 10;
  const kisiSaat: Record<string, number> = {};
  for (const [e, l] of kisi) if (l.reduce((a, b) => a + b, 0) >= 2) kisiSaat[e] = l.indexOf(Math.max(...l));
  return { isi, toplam, enIyi: toplam >= 10 ? enIyi : null, enIyiSaat, kisiSayisi: Object.keys(kisiSaat).length, kisiSaat, tz };
}
export const kimlikUret = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
