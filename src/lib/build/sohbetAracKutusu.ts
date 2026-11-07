import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import qrcode from "qrcode-generator";
import type { AracCiktisi } from "./sohbetAjan";
import type { Sohbet } from "./sohbetDepo";
import { izlemeOlustur } from "./sohbetIzleme";
import { aralikMetni, izlemeAciklamasi } from "./sohbetIzlemeOrtak";
import { birimCevir, hesapla } from "./sohbetHesap";
import type { HavaSonucu, KurSonucu, SayfalarSonucu, TakvimEtkinligi, TakvimSonucu } from "./sohbetTipler";
import { havaDurumu, KUR_ADLARI, kurDegeri, madenFiyati, tcmbKurlari } from "./sohbetVeriKaynak";
import { sayfalariOku } from "./sohbetWeb";

/**
 * Sohbetin v5 gündelik araçları (her modelde çalışır): çok sayfalı web okuma ve site içi gezinti, hesap makinesi ve
 * birim çevirici, döviz ve altın kuru (TCMB), hava durumu (Open-Meteo), takvim dosyası (.ics), karekod ve izleme
 * kurma (koşul olunca bildir; onay kartıyla). Kaynağa ulaşılamazsa sonuç uydurulmaz, araç hatayı açıkça döner.
 */
const obj = (props: Record<string, unknown>, required: string[]) => ({ type: "object" as const, properties: props, required, additionalProperties: false });
const S = (description?: string) => ({ type: "string", ...(description ? { description } : {}) });
const N = (description?: string) => ({ type: "number", ...(description ? { description } : {}) });

export const KUTU_ARAC_ADLARI = ["web_oku", "hesapla", "kur_getir", "hava_durumu", "takvim_olustur", "karekod_olustur", "izleme_kur"] as const;
export const KUTU_HEP_SOR = new Set(["izleme_kur"]);

export function kutuAraclari(o: { izleme: boolean }): Anthropic.Beta.BetaTool[] {
  const l: Anthropic.Beta.BetaTool[] = [
    {
      name: "web_oku",
      description: "Bir ya da birden çok web sayfasını okur (metin, başlıklar, fiyat). gez açıksa ilk adresin sitesinde odak kelimelerine uyan iç sayfaları da gezer (en çok 12 sayfa). Kullanıcı bir bağlantı verdiğinde ya da bir sitenin içeriği gerektiğinde kullan.",
      input_schema: obj({
        adresler: { type: "array", items: { type: "string" }, description: "Okunacak adresler (en çok 8)" },
        gez: { type: "boolean", description: "Aynı sitenin iç sayfalarını da gez" }, odak: S("Gezintide öncelik verilecek kelimeler (ör. fiyat iletişim kariyer)"),
        sinir: { type: "integer", minimum: 1, maximum: 12, description: "Toplam sayfa sınırı" },
      }, ["adresler"]),
    },
    {
      name: "hesapla",
      description: "Kesin hesap ve birim çevirisi. ifade: matematik ifadesi (+ - * / ^ %, parantez, sqrt, cbrt, abs, round(x, basamak), floor, ceil, sin, cos, tan (derece için sind, cosd, tand), log (doğal), log10, log2, exp, min, max, fakt ya da !, pi, e). cevir: birim çevirisi (uzunluk, kütle, hacim, alan, hız, zaman, veri, enerji, basınç, güç, sıcaklık; dönüm, su bardağı, yemek kaşığı dahil). Sayıları kafadan hesaplama; bu aracı kullan.",
      input_schema: obj({
        ifadeler: { type: "array", items: S(), description: "Hesaplanacak ifadeler (en çok 10)" },
        cevir: { type: "array", items: obj({ deger: N(), kaynak: S("Birim, ör. km, mil, kg, F, dönüm"), hedef: S("Hedef birim") }, ["deger", "kaynak", "hedef"]), description: "Birim çevirileri" },
      }, []),
    },
    {
      name: "kur_getir",
      description: "Güncel döviz kurlarını (TCMB gösterge kurları) ve altın, gümüş fiyatını (ons fiyatından gram TL) getirir; istenirse tutarı çevirir. Kur ya da altın sorusunda tahmin etme, bu aracı kullan.",
      input_schema: obj({
        kodlar: { type: "array", items: S(), description: "USD, EUR, GBP, CHF, JPY gibi TCMB kodları ya da GRAM-ALTIN, GRAM-GUMUS, ONS-ALTIN. Boşsa başlıca kurlar." },
        cevir: obj({ miktar: N(), kaynak: S("TRY ya da kur kodu"), hedef: S("TRY ya da kur kodu") }, ["miktar", "kaynak", "hedef"]),
      }, []),
    },
    {
      name: "hava_durumu",
      description: "Bir yerin anlık hava durumunu, saatlik ve günlük tahminini getirir (Open-Meteo). Yer adı Türkçe yazılabilir; ilçe için 'Kadıköy, İstanbul' gibi yaz.",
      input_schema: obj({ yer: S(), gun: { type: "integer", minimum: 1, maximum: 14, description: "Kaç günlük tahmin (varsayılan 7)" } }, ["yer"]),
    },
    {
      name: "takvim_olustur",
      description: "Bir ya da birden çok etkinlik için takvim dosyası (.ics) hazırlar; kullanıcı Google Takvim, Outlook ya da Apple Takvim'e ekler. Saatler Türkiye saatiyle.",
      input_schema: obj({
        ad: S("Dosyanın adı"),
        etkinlikler: { type: "array", items: obj({
          baslik: S(), baslangic: S("YYYY-AA-GG ya da YYYY-AA-GGTSS:DD (Türkiye saati)"), bitis: S("YYYY-AA-GG ya da YYYY-AA-GGTSS:DD; yoksa 1 saat"),
          yer: S(), aciklama: S(), tekrar: { type: "string", enum: ["yok", "gunluk", "haftalik", "aylik", "yillik"] }, tekrarSayisi: { type: "integer", minimum: 1, maximum: 365 },
          hatirlatma: { type: "integer", minimum: 0, maximum: 10080, description: "Kaç dakika önce hatırlatılsın" },
        }, ["baslik", "baslangic"]) },
      }, ["etkinlikler"]),
    },
    {
      name: "karekod_olustur",
      description: "Karekod (QR) üretir: bağlantı, düz metin, Wi-Fi ağı, kartvizit, e-posta, telefon, SMS ya da konum. Kullanıcı karttan SVG ya da PNG indirir.",
      input_schema: obj({
        tur: { type: "string", enum: ["baglanti", "metin", "wifi", "kartvizit", "eposta", "telefon", "sms", "konum"] },
        icerik: S("Bağlantı, metin, telefon numarası, e-posta adresi ya da 'enlem,boylam'"),
        wifi: obj({ ad: S("Ağ adı"), sifre: S(), guvenlik: { type: "string", enum: ["WPA", "WEP", "yok"] }, gizli: { type: "boolean" } }, ["ad"]),
        kartvizit: obj({ ad: S(), soyad: S(), sirket: S(), unvan: S(), telefon: S(), eposta: S(), web: S(), adres: S() }, ["ad"]),
        konu: S("E-posta konusu ya da SMS metni"), etiket: S("Kartın üstünde görünecek kısa ad"),
      }, ["tur"]),
    },
  ];
  if (o.izleme) l.push({
    name: "izleme_kur",
    description: "Koşul gerçekleşince kullanıcıya bildirim gönderen bir izleme kurar (fiyat düşünce, sayfada yeni duyuru çıkınca, kur eşiği geçince, yarın yağmur varsa). Kullanıcı onay kartından onaylar; Vayra içinde, tarayıcıda ve e-postayla haber verilir.",
    input_schema: obj({
      ad: S("Kısa ad"),
      tur: { type: "string", enum: ["sayfa", "deger", "kur", "hava", "yapay"], description: "sayfa: yeni öğe ya da değişiklik ya da kelime; deger: sayfadaki fiyat ya da sayı; kur: döviz ya da altın; hava: tahmin; yapay: serbest koşul" },
      adres: S("sayfa, deger ve isteğe bağlı yapay için sayfa adresi"), kip: { type: "string", enum: ["yeni-oge", "degisim", "kelime"] }, kelime: S(), odak: S(),
      etiket: S("deger için sayının önündeki yazı; boşsa ürün fiyatı"), kod: S("kur için USD, EUR, GRAM-ALTIN..."),
      islec: { type: "string", enum: ["alt", "ust", "degisim"] }, esik: N("Eşik (kur değişiminde yüzde)"),
      yer: S("hava için yer"), olcut: { type: "string", enum: ["yagis", "sicaklik-alt", "sicaklik-ust", "ruzgar", "kar"] }, gun: { type: "integer", minimum: 0, maximum: 6 },
      soru: S("yapay için denetlenecek koşul"), aralik: { type: "integer", minimum: 10, maximum: 10080, description: "Kaç dakikada bir denetlensin (varsayılan 60)" },
      tekrar: { type: "string", enum: ["bir-kez", "her-seferinde"] },
    }, ["tur"]),
  });
  return l;
}

export function kutuBolumu(o: { izleme: boolean }): string {
  return `
- Web sayfası: kullanıcı bir bağlantı verirse ya da bir sitenin içeriği gerekirse web_oku kullan; birden çok sayfayı birlikte okuyabilir, gez ile site içinde dolaşabilirsin (ör. fiyat ya da iletişim sayfasını bulmak). Okuduğun sayfaları kaynak olarak an.
- Hesap: aritmetik, yüzde, faiz, birim çevirisi gibi kesin sonuç gereken her işte hesapla kullan; sonucu aracın verdiği gibi yaz.
- Kur ve altın: döviz, altın ya da gümüş sorularında kur_getir kullan; tarihini ve kaynağını belirt.
- Hava: hava durumu sorularında hava_durumu kullan.
- Takvim: kullanıcı bir randevuyu, toplantıyı ya da planı takvimine eklemek isterse takvim_olustur ile .ics dosyası hazırla.
- Karekod: bağlantı, Wi-Fi, kartvizit ya da metin için karekod istenirse karekod_olustur kullan.${o.izleme ? "\n- İzleme: kullanıcı \"... olunca haber ver\", \"fiyat düşünce bildir\", \"yeni duyuru çıkınca söyle\" derse izleme_kur kullan (kullanıcı onaylar)." : ""}`;
}

/* ───────────── Takvim ───────────── */
const icsKacir = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);
function satirKatla(s: string): string {
  const o: string[] = []; let x = s;
  while (Buffer.byteLength(x) > 74) { let n = 74; while (Buffer.byteLength(x.slice(0, n)) > 74) n--; o.push(x.slice(0, n)); x = ` ${x.slice(n)}`; }
  o.push(x); return o.join("\r\n");
}
const TARIH = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/;
/** Türkiye saatindeki yerel zamanı UTC damgasına çevirir (Türkiye 2016'dan beri sürekli UTC+3). */
function utc(t: string): { tumGun: boolean; deger: string; ms: number } | null {
  const m = TARIH.exec(t.trim());
  if (!m) return null;
  if (!m[4]) return { tumGun: true, deger: `${m[1]}${m[2]}${m[3]}`, ms: Date.UTC(+m[1], +m[2] - 1, +m[3]) };
  const ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 3, +m[5]);
  return { tumGun: false, deger: new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""), ms };
}
const TEKRAR: Record<string, string> = { gunluk: "DAILY", haftalik: "WEEKLY", aylik: "MONTHLY", yillik: "YEARLY" };
export function icsUret(l: TakvimEtkinligi[], ad: string): string {
  const simdi = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const satirlar = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Vayra//Sohbet Takvimi//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icsKacir(ad)}`, "X-WR-TIMEZONE:Europe/Istanbul"];
  l.forEach((e, i) => {
    const b = utc(e.baslangic)!;
    const s = e.bitis ? utc(e.bitis) : null;
    const bitis = s && s.ms > b.ms ? s : b.tumGun ? { tumGun: true, deger: new Date(b.ms + 864e5).toISOString().slice(0, 10).replace(/-/g, ""), ms: b.ms + 864e5 } : { tumGun: false, deger: new Date(b.ms + 3600_000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""), ms: b.ms + 3600_000 };
    satirlar.push("BEGIN:VEVENT", `UID:${simdi}-${i}-${Math.random().toString(36).slice(2, 10)}@vayra.app`, `DTSTAMP:${simdi}`,
      b.tumGun ? `DTSTART;VALUE=DATE:${b.deger}` : `DTSTART:${b.deger}`, bitis.tumGun ? `DTEND;VALUE=DATE:${bitis.deger}` : `DTEND:${bitis.deger}`,
      `SUMMARY:${icsKacir(e.baslik)}`);
    if (e.yer) satirlar.push(`LOCATION:${icsKacir(e.yer)}`);
    if (e.aciklama) satirlar.push(`DESCRIPTION:${icsKacir(e.aciklama)}`);
    if (e.tekrar && TEKRAR[e.tekrar]) satirlar.push(`RRULE:FREQ=${TEKRAR[e.tekrar]}${e.tekrarSayisi ? `;COUNT=${e.tekrarSayisi}` : ""}`);
    if (e.hatirlatma !== undefined && e.hatirlatma > 0) satirlar.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsKacir(e.baslik)}`, `TRIGGER:-PT${e.hatirlatma}M`, "END:VALARM");
    satirlar.push("END:VEVENT");
  });
  satirlar.push("END:VCALENDAR");
  return satirlar.map(satirKatla).join("\r\n") + "\r\n";
}

/* ───────────── Karekod ───────────── */
const wifiKacir = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
function karekodMetni(g: Record<string, unknown>): { metin: string; etiket: string } | { hata: string } {
  const s = (v: unknown, n = 500) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const icerik = s(g.icerik, 2000);
  switch (g.tur) {
    case "baglanti": { const u = /^https?:\/\//i.test(icerik) ? icerik : icerik ? `https://${icerik}` : ""; try { new URL(u); } catch { return { hata: "Geçerli bir bağlantı yaz." }; } return { metin: u, etiket: u.replace(/^https?:\/\//, "").slice(0, 60) }; }
    case "metin": return icerik ? { metin: icerik, etiket: icerik.slice(0, 60) } : { hata: "Metin boş." };
    case "wifi": { const w = (g.wifi ?? {}) as Record<string, unknown>; const ad = s(w.ad, 32); if (!ad) return { hata: "Wi-Fi ağının adını yaz." }; const tur = w.guvenlik === "WEP" ? "WEP" : w.guvenlik === "yok" ? "nopass" : "WPA"; return { metin: `WIFI:T:${tur};S:${wifiKacir(ad)};${tur !== "nopass" ? `P:${wifiKacir(s(w.sifre, 63))};` : ""}${w.gizli ? "H:true;" : ""};`, etiket: `Wi-Fi: ${ad}` }; }
    case "kartvizit": {
      const k = (g.kartvizit ?? {}) as Record<string, unknown>; const ad = s(k.ad, 60), soyad = s(k.soyad, 60);
      if (!ad) return { hata: "Kartvizit için ad gerekli." };
      const v = ["BEGIN:VCARD", "VERSION:3.0", `N:${soyad};${ad};;;`, `FN:${[ad, soyad].filter(Boolean).join(" ")}`, ...(s(k.sirket) ? [`ORG:${s(k.sirket)}`] : []), ...(s(k.unvan) ? [`TITLE:${s(k.unvan)}`] : []), ...(s(k.telefon) ? [`TEL;TYPE=CELL:${s(k.telefon)}`] : []), ...(s(k.eposta) ? [`EMAIL:${s(k.eposta)}`] : []), ...(s(k.web) ? [`URL:${s(k.web)}`] : []), ...(s(k.adres) ? [`ADR:;;${s(k.adres)};;;;`] : []), "END:VCARD"];
      return { metin: v.join("\n"), etiket: `Kartvizit: ${[ad, soyad].filter(Boolean).join(" ")}` };
    }
    case "eposta": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(icerik) ? { metin: `mailto:${icerik}${s(g.konu) ? `?subject=${encodeURIComponent(s(g.konu))}` : ""}`, etiket: icerik } : { hata: "Geçerli bir e-posta adresi yaz." };
    case "telefon": { const t = icerik.replace(/[^\d+]/g, ""); return t.length >= 7 ? { metin: `tel:${t}`, etiket: icerik } : { hata: "Geçerli bir telefon numarası yaz." }; }
    case "sms": { const t = icerik.replace(/[^\d+]/g, ""); return t.length >= 7 ? { metin: `SMSTO:${t}:${s(g.konu, 300)}`, etiket: `SMS: ${icerik}` } : { hata: "Geçerli bir telefon numarası yaz." }; }
    case "konum": { const m = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(icerik); return m ? { metin: `geo:${m[1]},${m[2]}`, etiket: `Konum ${m[1]}, ${m[2]}` } : { hata: "Konumu 'enlem,boylam' biçiminde yaz (ör. 41.0082,28.9784)." }; }
  }
  return { hata: "Bilinmeyen karekod türü." };
}
/** UTF-8 karekod SVG'si (beyaz zeminde siyah; boşluk payı 4 modül). */
export function karekodSvg(metin: string): { svg: string; boyut: number } {
  const q = qrcode(0, "M");
  // UTF-8 bayt dönüşümü (paketin ESM sürümünde UTF-8 yardımcısı yok; Türkçe karakterler bozulmasın).
  (qrcode as unknown as { stringToBytes: (s: string) => number[] }).stringToBytes = (x: string) => Array.from(new TextEncoder().encode(x));
  q.addData(metin, "Byte");
  q.make();
  const n = q.getModuleCount(), pay = 4, top = n + pay * 2;
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + pay} ${r + pay}h1v1h-1z`;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${top} ${top}" shape-rendering="crispEdges"><rect width="${top}" height="${top}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`, boyut: n };
}

/* ───────────── Yürütme ───────────── */
const metin = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
const tr = (n: number, b = 4) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: b }).format(n);

export async function kutuAracYurut(ad: string, girdi: unknown, c: { sahip: string; s: Sohbet }): Promise<AracCiktisi | null> {
  const g = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  try {
    switch (ad) {
      case "web_oku": {
        const adresler = (Array.isArray(g.adresler) ? g.adresler : typeof g.adres === "string" ? [g.adres] : []).map((x) => metin(x, 2000).trim()).filter(Boolean).slice(0, 8);
        if (!adresler.length) return { icerik: "INVALID_JSON: adresler gerekli.", hata: true };
        const r = await sayfalariOku(adresler, { gez: !!g.gez, odak: metin(g.odak, 200), sinir: Number(g.sinir) || undefined });
        const sonuc: SayfalarSonucu = {
          tur: "sayfalar", gezinti: !!g.gez, atlanan: r.atlanan,
          sayfalar: r.sayfalar.map((s) => ({ url: s.url, baslik: s.baslik, ozet: (s.aciklama || s.metin.replace(/^#+ .*$/gm, "").replace(/\s+/g, " ").trim()).slice(0, 220), kelime: s.metin.split(/\s+/).length, ...(s.fiyat ? { fiyat: `${tr(s.fiyat.deger, 2)}${s.fiyat.para ? ` ${s.fiyat.para === "TRY" ? "TL" : s.fiyat.para}` : ""}` } : {}) })),
          hatalar: r.hatalar.map((h) => ({ url: h.url, hata: h.hata.slice(0, 200) })),
        };
        if (!r.sayfalar.length) return { icerik: `Sayfalar okunamadı:\n${r.hatalar.map((h) => `- ${h.url}: ${h.hata}`).join("\n")}\nKullanıcıya nedenini söyle.`, hata: true, sonuc };
        const pay = Math.floor(48_000 / r.sayfalar.length);
        const icerik = r.sayfalar.map((s, i) => `<sayfa no="${i + 1}" adres="${s.url}" baslik="${s.baslik.replace(/"/g, "'")}"${s.fiyat ? ` fiyat="${s.fiyat.deger}${s.fiyat.para ? ` ${s.fiyat.para}` : ""}"` : ""}>\n${s.metin.slice(0, pay)}${s.metin.length > pay ? "\n[kısaltıldı]" : ""}\n${g.gez && i === 0 ? `\nSitedeki bağlantılar: ${s.baglantilar.slice(0, 40).map((b) => `${b.metin || "bağlantı"} (${b.url})`).join("; ")}` : ""}\n</sayfa>`).join("\n\n");
        return { icerik: `${icerik}${r.hatalar.length ? `\n\nOkunamayanlar: ${r.hatalar.map((h) => `${h.url} (${h.hata})`).join("; ")}` : ""}\n\nYanıtında okuduğun sayfaları adlarıyla an.`, sonuc };
      }
      case "hesapla": {
        const ifadeler = (Array.isArray(g.ifadeler) ? g.ifadeler : typeof g.ifade === "string" ? [g.ifade] : []).map((x) => metin(x, 400)).filter(Boolean).slice(0, 10);
        const ceviriler = (Array.isArray(g.cevir) ? g.cevir : []).slice(0, 10) as Record<string, unknown>[];
        if (!ifadeler.length && !ceviriler.length) return { icerik: "INVALID_JSON: ifadeler ya da cevir gerekli.", hata: true };
        const satirlar = [
          ...ifadeler.map((i) => { const r = hesapla(i); return "hata" in r ? { ifade: i, hata: r.hata } : { ifade: i, sonuc: r.metin }; }),
          ...ceviriler.map((x) => { const r = birimCevir(Number(x.deger), metin(x.kaynak, 30), metin(x.hedef, 30)); return "hata" in r ? { ifade: `${x.deger} ${x.kaynak} için ${x.hedef}`, hata: r.hata } : { ifade: `${tr(Number(x.deger))} ${r.kaynak}`, sonuc: `${r.metin} ${r.hedef}`, kategori: r.kategori }; }),
        ];
        return { icerik: satirlar.map((x) => ("hata" in x && x.hata ? `${x.ifade}: HATA ${x.hata}` : `${x.ifade} = ${x.sonuc}`)).join("\n"), hata: satirlar.every((x) => "hata" in x && x.hata), sonuc: { tur: "hesap", satirlar } };
      }
      case "kur_getir": {
        const kodlar = (Array.isArray(g.kodlar) ? g.kodlar : []).map((x) => metin(x, 20).toUpperCase().trim()).filter(Boolean).slice(0, 12);
        const istenen = kodlar.length ? kodlar : ["USD", "EUR", "GBP", "GRAM-ALTIN"];
        const t = await tcmbKurlari().catch((e: Error) => e);
        const kalemler: KurSonucu["kalemler"] = [];
        const hatalar: string[] = [];
        for (const k of istenen) {
          if (/ALTIN|GUMUS|XAU|XAG/.test(k)) { try { const v = await kurDegeri(k); kalemler.push({ kod: v.kod, ad: v.ad, satis: v.deger, birim: v.birim, not: v.ayrinti }); } catch (e) { hatalar.push(`${k}: ${(e as Error).message}`); } continue; }
          if (t instanceof Error) { hatalar.push(`${k}: TCMB'ye ulaşılamadı (${t.message})`); continue; }
          const x = t.kurlar.find((y) => y.kod === k);
          if (!x) { hatalar.push(`${k}: TCMB listesinde yok`); continue; }
          kalemler.push({ kod: x.kod, ad: KUR_ADLARI[x.kod] ?? x.ad.toLocaleLowerCase("tr").replace(/(^|\s)\S/g, (h) => h.toLocaleUpperCase("tr")), alis: x.alis ? x.alis / x.birim : undefined, satis: x.satis ? x.satis / x.birim : undefined, efektifSatis: x.efektifSatis ? x.efektifSatis / x.birim : undefined, birim: "TL", ...(x.birim > 1 ? { not: `${x.birim} birim üzerinden yayımlanıyor` } : {}) });
        }
        let ceviri: KurSonucu["ceviri"];
        const cv = g.cevir as Record<string, unknown> | undefined;
        if (cv && Number.isFinite(Number(cv.miktar))) {
          const deger = async (kod: string) => (kod === "TRY" || kod === "TL" ? 1 : (await kurDegeri(kod)).deger);
          try {
            const kaynak = metin(cv.kaynak, 20).toUpperCase(), hedef = metin(cv.hedef, 20).toUpperCase();
            const sonuc = (Number(cv.miktar) * (await deger(kaynak))) / (await deger(hedef));
            ceviri = { miktar: Number(cv.miktar), kaynak, hedef, sonuc };
          } catch (e) { hatalar.push(`Çeviri: ${(e as Error).message}`); }
        }
        if (!kalemler.length && !ceviri) return { icerik: `Kurlar alınamadı: ${hatalar.join("; ")}. Kullanıcıya kaynağa ulaşılamadığını söyle, tahmini değer verme.`, hata: true };
        const tarih = t instanceof Error ? "" : t.tarih;
        const altin = kalemler.some((k) => /ALTIN|GUMUS/.test(k.kod)) ? await madenFiyati("XAU").then((m) => m.guncelleme).catch(() => "") : "";
        const sonuc: KurSonucu = { tur: "kur", tarih, ...(altin ? { madenZamani: altin } : {}), kalemler, ...(ceviri ? { ceviri } : {}), hatalar, kaynak: "TCMB gösterge niteliğindeki kurlar; altın ve gümüş gold-api.com ons fiyatı ile TCMB dolar kurundan hesaplanır" };
        return {
          icerik: `${tarih ? `TCMB ${tarih} tarihli kurlar (döviz satış):` : ""}\n${kalemler.map((k) => `- ${k.ad} (${k.kod}): ${k.satis ? tr(k.satis) : "yok"} ${k.birim}${k.alis ? `, alış ${tr(k.alis)}` : ""}${k.not ? ` (${k.not})` : ""}`).join("\n")}${ceviri ? `\nÇeviri: ${tr(ceviri.miktar)} ${ceviri.kaynak} = ${tr(ceviri.sonuc, 2)} ${ceviri.hedef}` : ""}${hatalar.length ? `\nAlınamayanlar: ${hatalar.join("; ")}` : ""}\nKaynağı ve tarihi belirt; TCMB kurları gün içinde değişmez, piyasa kuru farklı olabilir.`,
          sonuc,
        };
      }
      case "hava_durumu": {
        const yer = metin(g.yer, 80).trim();
        if (!yer) return { icerik: "INVALID_JSON: yer gerekli.", hata: true };
        const h = await havaDurumu(yer, Number(g.gun) || 7);
        const sonuc: HavaSonucu = { tur: "hava", ...h };
        return { icerik: `${h.yer.ad}${h.yer.bolge ? `, ${h.yer.bolge}` : ""} (${h.yer.ulke ?? ""}): şu an ${h.simdi.sicaklik} derece, hissedilen ${h.simdi.hissedilen}, ${h.simdi.durum.toLocaleLowerCase("tr")}, nem yüzde ${h.simdi.nem}, rüzgâr ${h.simdi.ruzgar} km/sa.\nGünlük tahmin:\n${h.gunler.map((d) => `- ${d.tarih}: ${d.enDusuk} ile ${d.enYuksek} derece, ${d.durum.toLocaleLowerCase("tr")}, yağış olasılığı yüzde ${d.yagisOlasiligi ?? 0}`).join("\n")}\nKaynak: Open-Meteo. Kart kullanıcıya gösterildi; kısa bir yorum yap.`, sonuc };
      }
      case "takvim_olustur": {
        const l = (Array.isArray(g.etkinlikler) ? g.etkinlikler : []).slice(0, 30).map((x) => x as Record<string, unknown>).map((x): TakvimEtkinligi | null => {
          const baslik = metin(x.baslik, 200).trim(), baslangic = metin(x.baslangic, 20).trim();
          if (!baslik || !utc(baslangic)) return null;
          const bitis = metin(x.bitis, 20).trim();
          return { baslik, baslangic, ...(bitis && utc(bitis) ? { bitis } : {}), ...(metin(x.yer, 200) ? { yer: metin(x.yer, 200) } : {}), ...(metin(x.aciklama, 1500) ? { aciklama: metin(x.aciklama, 1500) } : {}), ...(typeof x.tekrar === "string" && TEKRAR[x.tekrar] ? { tekrar: x.tekrar as TakvimEtkinligi["tekrar"], ...(Number(x.tekrarSayisi) > 0 ? { tekrarSayisi: Math.min(365, Number(x.tekrarSayisi)) } : {}) } : {}), ...(Number(x.hatirlatma) > 0 ? { hatirlatma: Math.min(10080, Number(x.hatirlatma)) } : {}) };
        }).filter((x): x is TakvimEtkinligi => !!x);
        if (!l.length) return { icerik: "Geçerli etkinlik yok: her etkinliğin başlığı ve YYYY-AA-GG ya da YYYY-AA-GGTSS:DD biçiminde başlangıcı olmalı.", hata: true };
        const ad = metin(g.ad, 80).trim() || (l.length === 1 ? l[0].baslik : "Vayra takvimi");
        const sonuc: TakvimSonucu = { tur: "takvim", ad, etkinlikler: l, ics: icsUret(l, ad) };
        return { icerik: `${l.length} etkinlikli takvim dosyası hazırlandı ve kullanıcıya indirme ve Google Takvim düğmeleriyle gösterildi. Etkinlikleri tek tek tekrar yazma.`, sonuc };
      }
      case "karekod_olustur": {
        const k = karekodMetni(g);
        if ("hata" in k) return { icerik: k.hata, hata: true };
        if (Buffer.byteLength(k.metin) > 2000) return { icerik: "İçerik karekod için çok uzun (en çok 2000 bayt).", hata: true };
        const { svg, boyut } = karekodSvg(k.metin);
        return { icerik: "Karekod üretildi ve kullanıcıya gösterildi (SVG ve PNG indirilebilir). Taratıp denemesini öner.", sonuc: { tur: "karekod", tip: String(g.tur), icerik: k.metin.slice(0, 2000), etiket: metin(g.etiket, 60) || k.etiket, svg, boyut } };
      }
      case "izleme_kur": {
        if (c.s.gecici) return { icerik: "Geçici sohbette izleme kurulamaz.", hata: true };
        const r = await izlemeOlustur(c.sahip, { ad: metin(g.ad, 80), kosul: g, aralik: g.aralik ?? 60, tekrar: g.tekrar, sohbet: c.s.id });
        if ("hata" in r) return { icerik: `İzleme kurulamadı: ${r.hata}`, hata: true };
        const x = r.izleme;
        return { icerik: `İzleme kuruldu: "${x.ad}" (${izlemeAciklamasi(x.kosul)}, ${aralikMetni(x.aralik)}). Koşul gerçekleşince kullanıcıya bildirim gider ve bu sohbete yazılır. Bunu bir cümleyle söyle.`, sonuc: { tur: "izleme", id: x.id, ad: x.ad, aciklama: izlemeAciklamasi(x.kosul), aralik: aralikMetni(x.aralik), kosulTur: x.kosul.tur } };
      }
    }
  } catch (e) {
    return { icerik: `Araç hatası: ${(e as Error).message.slice(0, 300)}. Kaynağa ulaşılamadıysa bunu kullanıcıya dürüstçe söyle.`, hata: true };
  }
  return null;
}
