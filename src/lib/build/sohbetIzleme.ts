import "server-only";
import { createHash, randomBytes } from "crypto";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { bildirimOz } from "./bildirim";
import { sahipOzeti } from "./depo";
import { modelBul } from "./modeller";
import { jsonBul, tekSeferlik } from "./sohbetCagri";
import { sohbetHam, sohbetKaydetOz, sohbetOlusturOz, yeniMesajId, type SohbetMesaji } from "./sohbetDepo";
import { IZLEME_SINIRI, izlemeAciklamasi, type Izleme, type IzlemeKosulu, type IzlemeKontrolu, type IzlemeOnizleme } from "./sohbetIzlemeOrtak";
import { katla } from "./sohbetTipler";
import { havaDurumu, kurDegeri, sayiCoz } from "./sohbetVeriKaynak";
import { OkumaHatasi, sayfaOku, type OkunanSayfa } from "./sohbetWeb";
import { yayinlar } from "./sohbetYayin";
import { etkinYol, secimiAyarla } from "./sohbetYol";

/**
 * İzleme görevleri (ChatGPT'nin "koşul olunca haber ver" görevleri gibi): belirli aralıklarla bir kaynağı denetler,
 * koşul gerçekleşince bildirim merkezi, tarayıcı bildirimi ve e-postayla haber verir; sonuç izlemenin sohbetine de
 * yazılır. Eşik koşullarında yalnız eşik aşıldığı an bildirilir (koşul sürdükçe tekrar edilmez). Türler: sayfada yeni
 * öğe, sayfa değişimi, sayfada kelime, sayfadaki fiyat ya da değer, döviz ve altın kuru, hava, yapay zekâ koşulu.
 * Kayıt: .veri/build/sohbet-izleme/<sahip özeti>.json. Zamanlayıcı süreç başına bir kez kurulur (bildirim zili ve
 * izleme uçları uyandırır).
 */
const KOK = path.join(DEPO_KOK, "build", "sohbet-izleme");
const dosya = (oz: string) => path.join(KOK, `${oz}.json`);
const kilitler = new Map<string, Promise<unknown>>();
async function oku(oz: string): Promise<Izleme[]> { try { return (JSON.parse(await readFile(dosya(oz), "utf8")) as { izlemeler: Izleme[] }).izlemeler ?? []; } catch { return []; } }
function degistir<T>(oz: string, f: (l: Izleme[]) => T | Promise<T>): Promise<T> {
  const once = kilitler.get(oz) ?? Promise.resolve();
  const is = once.then(async () => {
    const l = await oku(oz);
    const r = await f(l);
    await mkdir(KOK, { recursive: true });
    await writeFile(dosya(oz), JSON.stringify({ izlemeler: l }));
    return r;
  });
  kilitler.set(oz, is.catch(() => {}));
  return is;
}
const ozet = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const tl = (n: number, birim = "TL") => `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: n < 10 ? 4 : 2 }).format(n)} ${birim}`.trim();

/* ───────────── Koşulun temizlenmesi ───────────── */
const ADRES = /^https?:\/\/[^\s]{3,2000}$/i;
export function kosulTemizle(k: unknown): IzlemeKosulu | { hata: string } {
  if (!k || typeof k !== "object") return { hata: "İzleme koşulu eksik." };
  const x = k as Record<string, unknown>;
  const s = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" ? sayiCoz(v) : null);
  const adres = s(x.adres, 2000).replace(/^(?!https?:\/\/)/i, "https://");
  switch (x.tur) {
    case "sayfa": {
      if (!ADRES.test(adres)) return { hata: "İzlenecek sayfanın adresini yaz (https ile)." };
      const kip = x.kip === "degisim" || x.kip === "kelime" ? x.kip : "yeni-oge";
      const kelime = s(x.kelime, 120);
      if (kip === "kelime" && !kelime) return { hata: "Sayfada aranacak kelimeyi yaz." };
      return { tur: "sayfa", adres, kip, ...(kelime ? { kelime } : {}), ...(s(x.odak, 120) ? { odak: s(x.odak, 120) } : {}) };
    }
    case "deger": {
      if (!ADRES.test(adres)) return { hata: "Değerin okunacağı sayfanın adresini yaz." };
      const islec = x.islec === "ust" || x.islec === "degisim" ? x.islec : "alt";
      const esik = n(x.esik);
      if (islec !== "degisim" && (esik === null || esik < 0)) return { hata: "Eşik değeri yaz (ör. 1000)." };
      return { tur: "deger", adres, islec, ...(esik !== null ? { esik } : {}), ...(s(x.etiket, 120) ? { etiket: s(x.etiket, 120) } : {}) };
    }
    case "kur": {
      const kod = s(x.kod, 20).toUpperCase() || "USD";
      const islec = x.islec === "ust" || x.islec === "degisim" ? x.islec : "alt";
      const esik = n(x.esik);
      if (islec !== "degisim" && (esik === null || esik <= 0)) return { hata: "Kur için eşik değeri yaz." };
      if (islec === "degisim" && (esik === null || esik <= 0 || esik > 100)) return { hata: "Değişim için yüzde değeri yaz (ör. 2)." };
      return { tur: "kur", kod, islec, esik: esik! };
    }
    case "hava": {
      const yer = s(x.yer, 80);
      if (!yer) return { hata: "Hava durumu izlenecek yeri yaz (ör. Kadıköy, İstanbul)." };
      const olcut = (["yagis", "sicaklik-alt", "sicaklik-ust", "ruzgar", "kar"] as const).find((o) => o === x.olcut) ?? "yagis";
      const esik = n(x.esik);
      const gun = Math.min(6, Math.max(0, Math.round(n(x.gun) ?? 1)));
      return { tur: "hava", yer, olcut, gun, esik: esik ?? (olcut === "yagis" ? 60 : olcut === "ruzgar" ? 40 : olcut === "sicaklik-alt" ? 0 : 35) };
    }
    case "yapay": {
      const soru = s(x.soru, 1000);
      if (!soru) return { hata: "Hangi koşulun denetleneceğini yaz." };
      if (adres !== "https://" && !ADRES.test(adres)) return { hata: "Kaynak adresi geçersiz." };
      return { tur: "yapay", soru, ...(adres !== "https://" ? { adres } : {}), model: modelBul(s(x.model, 80) || undefined).id };
    }
  }
  return { hata: "Bilinmeyen izleme türü." };
}

/* ───────────── Denetim ───────────── */
type Durum = NonNullable<Izleme["durumVerisi"]>;
type Sonuc = { deger?: string; tuttu: boolean; mesaj?: string; durum: Durum; ilk?: boolean; kaynak?: string; yeniler?: { metin: string; url?: string }[]; kredi?: number };

function karsilastir(deger: number, islec: "alt" | "ust" | "degisim", esik: number | undefined, onceki: number | undefined): boolean {
  if (islec === "alt") return deger <= (esik ?? 0);
  if (islec === "ust") return deger >= (esik ?? 0);
  return onceki !== undefined && Math.abs(deger - onceki) > 1e-9 && (esik === undefined || Math.abs((deger - onceki) / (onceki || 1)) * 100 >= esik);
}

/** Sayfada etiketin hemen ardından gelen ilk sayı; etiket JSON yolu ise (a.b.0.c) o alan. */
function degerBul(s: OkunanSayfa, etiket?: string): { deger: number; kaynak: string } | null {
  if (s.json !== undefined && etiket && /^[\w$.[\]-]+$/.test(etiket)) {
    let v: unknown = s.json;
    for (const p of etiket.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean)) v = v && typeof v === "object" ? (v as Record<string, unknown>)[p] : undefined;
    const n = typeof v === "number" ? v : typeof v === "string" ? sayiCoz(v) : null;
    return n === null ? null : { deger: n, kaynak: `JSON alanı ${etiket}` };
  }
  if (etiket) {
    const m = katla(s.metin), i = m.indexOf(katla(etiket));
    if (i < 0) return null;
    const pencere = s.metin.slice(i + etiket.length, i + etiket.length + 160);
    const x = /-?\d[\d.,]*/.exec(pencere);
    const n = x ? sayiCoz(x[0]) : null;
    return n === null ? null : { deger: n, kaynak: `"${etiket}" yazısından sonraki sayı` };
  }
  if (s.fiyat) return { deger: s.fiyat.deger, kaynak: s.fiyat.kaynak };
  const p = /(?:₺|TL|TRY|\$|€|USD|EUR)\s*(\d[\d.,]*)|(\d[\d.,]*)\s*(?:₺|TL|TRY|USD|EUR|\$|€)/.exec(s.metin);
  const n = p ? sayiCoz(p[1] ?? p[2]) : null;
  return n === null ? null : { deger: n, kaynak: "Sayfadaki ilk fiyat" };
}

async function denetle(k: IzlemeKosulu, d: Durum): Promise<Sonuc> {
  switch (k.tur) {
    case "sayfa": {
      const s = await sayfaOku(k.adres);
      const odak = k.odak ? katla(k.odak) : "";
      if (k.kip === "yeni-oge") {
        const kok = new URL(s.url);
        const ogeler = s.baglantilar.filter((b) => b.metin.length >= 12 && !/^(devam|daha fazla|tümü|hepsi|ana sayfa|giriş|kayıt|iletişim|hakkımızda|gizlilik|çerez)/i.test(b.metin))
          .filter((b) => { try { return new URL(b.url).hostname.endsWith(kok.hostname.replace(/^www\./, "")); } catch { return false; } })
          .filter((b) => !odak || katla(`${b.metin} ${b.url}`).includes(odak));
        const anahtarlar = ogeler.map((b) => ozet(`${b.url}|${b.metin}`));
        const goruldu = new Set(d.goruldu ?? []);
        const ilk = !d.goruldu;
        const yeniler = ilk ? [] : ogeler.filter((_, i) => !goruldu.has(anahtarlar[i])).slice(0, 8);
        return { ilk, tuttu: yeniler.length > 0, deger: `${ogeler.length} öğe`, yeniler: yeniler.map((b) => ({ metin: b.metin, url: b.url })), durum: { ...d, goruldu: [...new Set([...anahtarlar, ...(d.goruldu ?? [])])].slice(0, 1500) }, kaynak: s.baslik };
      }
      const satirlar = s.metin.split("\n").filter((x) => !odak || katla(x).includes(odak)).filter((x) => x.length > 2);
      if (k.kip === "kelime") {
        const var_ = katla(s.metin).includes(katla(k.kelime ?? ""));
        return { tuttu: var_ && !d.tuttu, deger: var_ ? "Kelime sayfada" : "Kelime sayfada yok", durum: { ...d, tuttu: var_ }, kaynak: s.baslik, mesaj: var_ ? `"${k.kelime}" sayfada görünüyor.` : undefined };
      }
      const yeniOz = ozet(satirlar.join("\n"));
      const ilk = !d.ozet;
      const eski = new Set(d.satirlar ?? []);
      const eklenen = ilk ? [] : satirlar.filter((x) => !eski.has(ozet(x))).slice(0, 6);
      const degisti = !ilk && yeniOz !== d.ozet;
      return { ilk, tuttu: degisti, deger: degisti ? `${eklenen.length} yeni satır` : "Değişiklik yok", yeniler: eklenen.map((m) => ({ metin: m.slice(0, 240) })), durum: { ...d, ozet: yeniOz, satirlar: satirlar.slice(0, 600).map(ozet) }, kaynak: s.baslik };
    }
    case "deger": {
      const s = await sayfaOku(k.adres);
      const b = degerBul(s, k.etiket);
      if (!b) throw new OkumaHatasi(k.etiket ? `Sayfada "${k.etiket}" yazısının ardında bir sayı bulunamadı.` : "Sayfada fiyat bulunamadı. Fiyatın hemen önündeki yazıyı (ör. Satış fiyatı) etiket olarak yaz.");
      const tut = karsilastir(b.deger, k.islec, k.esik, d.deger);
      const tuttu = k.islec === "degisim" ? tut : tut && !d.tuttu;
      return { tuttu, deger: tl(b.deger, s.fiyat?.para === "USD" ? "dolar" : s.fiyat?.para === "EUR" ? "euro" : s.fiyat?.para === "TRY" || /TL|₺/.test(s.metin.slice(0, 20000)) ? "TL" : ""), durum: { ...d, deger: b.deger, tuttu: k.islec === "degisim" ? undefined : tut }, kaynak: `${s.baslik} · ${b.kaynak}`, ilk: d.deger === undefined && k.islec === "degisim" };
    }
    case "kur": {
      const v = await kurDegeri(k.kod);
      const tut = k.islec === "degisim" ? karsilastir(v.deger, "degisim", k.esik, d.deger) : karsilastir(v.deger, k.islec, k.esik, undefined);
      const tuttu = k.islec === "degisim" ? tut : tut && !d.tuttu;
      return { tuttu, deger: tl(v.deger, v.birim), durum: { ...d, deger: k.islec === "degisim" && !tut && d.deger !== undefined ? d.deger : v.deger, tuttu: k.islec === "degisim" ? undefined : tut }, kaynak: `${v.ad} · ${v.kaynak}`, ilk: k.islec === "degisim" && d.deger === undefined };
    }
    case "hava": {
      const h = await havaDurumu(k.yer, k.gun + 1);
      const g = h.gunler[k.gun];
      if (!g) throw new Error("Tahmin günü bulunamadı.");
      const deger = k.olcut === "yagis" ? (g.yagisOlasiligi ?? 0) : k.olcut === "sicaklik-alt" ? g.enDusuk : k.olcut === "sicaklik-ust" ? g.enYuksek : k.olcut === "ruzgar" ? g.ruzgar : [71, 73, 75, 77, 85, 86].includes(g.kod) ? 1 : 0;
      const tut = k.olcut === "sicaklik-alt" ? deger <= k.esik : k.olcut === "kar" ? deger === 1 : deger >= k.esik;
      // Tahmin günü değişince (yeni gün) durum sıfırlanır: her gün için en çok bir kez bildirilir.
      const ayni = d.gun === g.tarih;
      const yaz = k.olcut === "yagis" ? `yüzde ${deger} yağış olasılığı` : k.olcut === "ruzgar" ? `${deger} km/sa rüzgâr` : k.olcut === "kar" ? (deger ? "kar bekleniyor" : "kar beklenmiyor") : `${deger} derece`;
      return { tuttu: tut && !(ayni && d.tuttu), deger: `${new Date(`${g.tarih}T12:00:00+03:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })}: ${yaz}, ${g.durum.toLocaleLowerCase("tr")}`, durum: { ...d, gun: g.tarih, tuttu: tut }, kaynak: `${h.yer.ad}${h.yer.bolge ? `, ${h.yer.bolge}` : ""} · Open-Meteo` };
    }
    case "yapay": {
      const s = k.adres ? await sayfaOku(k.adres) : null;
      const r = await tekSeferlik({
        model: k.model, efor: "low",
        sistem: 'Sen bir izleme denetçisisin. Kullanıcının koşulunun ŞU AN gerçekleşip gerçekleşmediğine karar verirsin. Yalnız verilen kaynağa ve bugünün tarihine dayan; emin değilsen gerçekleşmedi say. Yalnız şu JSON\'u döndür: {"gerceklesti": true|false, "deger": "kısa gözlem (en çok 12 kelime)", "neden": "bir cümle"}',
        ileti: `Bugün: ${new Date().toLocaleDateString("tr-TR", { dateStyle: "full" })}\nKoşul: ${k.soru}\n${s ? `\n<kaynak adres="${s.url}" baslik="${s.baslik.replace(/"/g, "'")}">\n${s.metin.slice(0, 14_000)}\n</kaynak>` : "\nKaynak verilmedi; genel bilgine dayan ve emin değilsen gerçekleşmedi de."}`,
      });
      if ("hata" in r) throw new Error(r.hata);
      const j = jsonBul<{ gerceklesti?: boolean; deger?: string; neden?: string }>(r.metin);
      if (!j || typeof j.gerceklesti !== "boolean") throw new Error("Model geçerli bir karar döndürmedi.");
      return { tuttu: j.gerceklesti && !d.tuttu, deger: String(j.deger ?? (j.gerceklesti ? "Gerçekleşti" : "Gerçekleşmedi")).slice(0, 120), mesaj: j.neden ? String(j.neden).slice(0, 300) : undefined, durum: { ...d, tuttu: j.gerceklesti }, kaynak: s ? s.baslik : modelBul(k.model).ad, kredi: r.kredi };
    }
  }
}

/** Kaydetmeden bir kez dener (oluşturma panelindeki "Şimdi dene"): koşulun şu anki değeri ve tutup tutmadığı. */
export async function izlemeDene(k: IzlemeKosulu): Promise<IzlemeOnizleme> {
  try {
    const r = await denetle(k, {});
    const simdi = k.tur === "sayfa" && k.kip === "yeni-oge" ? false : !!r.durum.tuttu || r.tuttu;
    return { ok: true, deger: r.deger ?? "", kaynak: r.kaynak, simdi, ...(r.mesaj ? { mesaj: r.mesaj } : {}) };
  } catch (e) { return { ok: false, hata: (e as Error).message || "Denetlenemedi." }; }
}

/* ───────────── Kayıt işlemleri ───────────── */
export const izlemeleriGetir = (sahip: string) => oku(sahipOzeti(sahip));
export async function izlemeGetir(sahip: string, id: string) { return (await oku(sahipOzeti(sahip))).find((x) => x.id === id) ?? null; }

export async function izlemeOlustur(sahip: string, g: { ad?: string; kosul: unknown; aralik?: unknown; tekrar?: unknown; sohbet?: string }): Promise<{ izleme: Izleme } | { hata: string }> {
  const kosul = kosulTemizle(g.kosul);
  if ("hata" in kosul) return kosul;
  const oz = sahipOzeti(sahip);
  const aralik = Math.round(Number(g.aralik) || 60);
  const enAz = kosul.tur === "yapay" ? 60 : kosul.tur === "hava" ? 60 : 10;
  if (aralik < enAz || aralik > 7 * 1440) return { hata: kosul.tur === "yapay" ? "Yapay zekâ koşulu en sık saatte bir denetlenir." : `Denetim aralığı ${enAz} dakika ile 7 gün arasında olmalı.` };
  const ad = (typeof g.ad === "string" && g.ad.trim() ? g.ad.trim() : izlemeAciklamasi(kosul)).slice(0, 80);
  return degistir(oz, (l) => {
    if (l.filter((x) => x.durum === "acik").length >= IZLEME_SINIRI) return { hata: `En çok ${IZLEME_SINIRI} etkin izleme olabilir. Birini duraklat ya da sil.` };
    const x: Izleme = {
      id: randomBytes(6).toString("base64url"), ad, kosul, aralik, tekrar: g.tekrar === "bir-kez" ? "bir-kez" : "her-seferinde", durum: "acik",
      olusturma: Date.now(), sonraki: Date.now() + 5_000, kontrol: 0, tetiklenme: 0, gecmis: [], durumVerisi: {},
      ...(typeof g.sohbet === "string" && /^[A-Za-z0-9_-]{12}$/.test(g.sohbet) ? { sohbet: g.sohbet } : {}),
    };
    l.unshift(x);
    return { izleme: x };
  });
}

export async function izlemeGuncelle(sahip: string, id: string, g: { ad?: unknown; kosul?: unknown; aralik?: unknown; tekrar?: unknown; durum?: unknown }): Promise<{ izleme: Izleme } | { hata: string }> {
  let kosul: IzlemeKosulu | undefined;
  if (g.kosul !== undefined) { const k = kosulTemizle(g.kosul); if ("hata" in k) return k; kosul = k; }
  return degistir(sahipOzeti(sahip), (l) => {
    const x = l.find((y) => y.id === id);
    if (!x) return { hata: "İzleme bulunamadı." };
    if (g.durum === "acik" && x.durum !== "acik" && l.filter((y) => y.durum === "acik").length >= IZLEME_SINIRI) return { hata: `En çok ${IZLEME_SINIRI} etkin izleme olabilir.` };
    if (typeof g.ad === "string" && g.ad.trim()) x.ad = g.ad.trim().slice(0, 80);
    if (kosul) { if (JSON.stringify(kosul) !== JSON.stringify(x.kosul)) x.durumVerisi = {}; x.kosul = kosul; x.sonraki = Date.now() + 3_000; }
    if (g.aralik !== undefined) { const a = Math.round(Number(g.aralik)); const enAz = x.kosul.tur === "yapay" || x.kosul.tur === "hava" ? 60 : 10; if (!(a >= enAz && a <= 7 * 1440)) return { hata: `Denetim aralığı ${enAz} dakika ile 7 gün arasında olmalı.` }; x.aralik = a; x.sonraki = Math.min(x.sonraki, Date.now() + a * 60_000); }
    if (g.tekrar === "bir-kez" || g.tekrar === "her-seferinde") x.tekrar = g.tekrar;
    if (g.durum === "acik" || g.durum === "duraklatildi") { x.durum = g.durum; if (g.durum === "acik") { x.sonraki = Date.now() + 3_000; x.ustUsteHata = 0; } }
    return { izleme: x };
  });
}
export async function izlemeSil(sahip: string, id: string): Promise<boolean> {
  return degistir(sahipOzeti(sahip), (l) => { const i = l.findIndex((x) => x.id === id); if (i < 0) return false; l.splice(i, 1); return true; });
}
export async function izlemeOkundu(sahip: string, id?: string) {
  await degistir(sahipOzeti(sahip), (l) => { for (const x of l) if (!id || x.id === id) x.okunmamis = 0; });
}

/* ───────────── Çalıştırma ───────────── */
function bildirimMetni(x: Izleme, r: Sonuc): string {
  const k = x.kosul;
  if (k.tur === "sayfa" && r.yeniler?.length) return `${r.kaynak ?? "Sayfa"} sayfasında ${r.yeniler.length} yeni ${k.kip === "yeni-oge" ? "öğe" : "satır"}: ${r.yeniler.slice(0, 3).map((y) => y.metin).join("; ")}`;
  if (k.tur === "yapay") return `${r.deger}${r.mesaj ? `. ${r.mesaj}` : ""}`;
  return `${r.deger}${r.mesaj ? `. ${r.mesaj}` : ""} (${izlemeAciklamasi(k)})`;
}
function sohbetMetni(x: Izleme, r: Sonuc): string {
  const satirlar = [`**${x.ad}**: koşul gerçekleşti.`, "", `- Şu anki değer: ${r.deger}`, `- Koşul: ${izlemeAciklamasi(x.kosul)}`];
  if (r.kaynak) satirlar.push(`- Kaynak: ${r.kaynak}`);
  if (r.mesaj) satirlar.push(`- Not: ${r.mesaj}`);
  if (r.yeniler?.length) satirlar.push("", "Yeni görünenler:", ...r.yeniler.map((y) => (y.url ? `- [${y.metin.replace(/[[\]]/g, "")}](${y.url})` : `- ${y.metin}`)));
  if (x.tekrar === "bir-kez") satirlar.push("", "Bu izleme bir kez bildirecek şekilde kurulduğu için duraklatıldı.");
  return satirlar.join("\n");
}

/** Bildirimi izlemenin sohbetine de yazar (sohbet yoksa açar). Yanıt süren sohbete yazılmaz; sonraki tetikte denenir. */
async function sohbeteYaz(oz: string, x: Izleme, r: Sonuc): Promise<string | undefined> {
  let s = x.sohbet ? await sohbetHam(x.sohbet) : null;
  if (s && s.sahip !== oz) s = null;
  if (!s) s = { ...(await sohbetOlusturOz(oz, modelBul().id, `İzleme: ${x.ad}`)), sahip: oz };
  if (yayinlar.get(s.id) && !yayinlar.get(s.id)!.bitti) return s.id;
  const yol = etkinYol(s.mesajlar, s.secim);
  const k: SohbetMesaji = { id: yeniMesajId(), rol: "kullanici", zaman: Date.now(), ust: yol[yol.length - 1]?.id ?? null, metin: `İzleme: ${x.ad}`, istek: { izleme: { id: x.id, ad: x.ad } } };
  const a: SohbetMesaji = { id: yeniMesajId(), rol: "asistan", zaman: Date.now(), ust: k.id, model: s.model, durum: "bitti", parcalar: [{ tur: "metin", metin: sohbetMetni(x, r) }], api: [{ role: "assistant", content: [{ type: "text", text: sohbetMetni(x, r) }] }] };
  s.mesajlar.push(k, a);
  s.secim = secimiAyarla(s.mesajlar, s.secim ?? {}, a.id);
  s.guncelleme = Date.now();
  const { sahip: _s, ...temiz } = s; void _s;
  await sohbetKaydetOz(temiz, oz);
  return s.id;
}

const calisanlar = new Set<string>();
/** Tek izlemeyi denetler ve sonucu işler (zamanlayıcıdan ya da "Şimdi denetle"den). */
export async function izlemeCalistirOz(oz: string, id: string): Promise<IzlemeKontrolu | null> {
  const anahtar = `${oz}:${id}`;
  if (calisanlar.has(anahtar)) return null;
  const x0 = (await oku(oz)).find((y) => y.id === id);
  if (!x0) return null;
  calisanlar.add(anahtar);
  try {
    let r: Sonuc | null = null, hata = "";
    try { r = await denetle(x0.kosul, x0.durumVerisi ?? {}); } catch (e) { hata = (e as Error).message || "Denetlenemedi."; }
    const kontrol: IzlemeKontrolu = { zaman: Date.now(), sonuc: hata ? "hata" : r!.ilk ? "ilk" : r!.tuttu ? "tetiklendi" : "tutmadi", ...(r?.deger ? { deger: r.deger } : {}), ...(hata ? { not: hata } : r?.mesaj ? { not: r.mesaj } : {}), ...(r?.kredi ? { kredi: r.kredi } : {}) };
    let sohbet: string | undefined;
    if (r?.tuttu && !r.ilk) {
      const guncel = { ...x0, durumVerisi: r.durum };
      sohbet = await sohbeteYaz(oz, guncel, r).catch(() => undefined);
      await bildirimOz(oz, { tur: "izleme", baslik: x0.ad, metin: bildirimMetni(guncel, r), adres: sohbet ? `/panel/build/sohbet/${sohbet}` : "/panel/build/sohbet/gorevler?sekme=izleme", kaynak: { tur: "izleme", id: x0.id, ad: x0.ad } }).catch(() => {});
    }
    await degistir(oz, (l) => {
      const x = l.find((y) => y.id === id);
      if (!x) return;
      x.kontrol += 1;
      x.sonKontrol = kontrol.zaman;
      x.sonraki = Date.now() + x.aralik * 60_000;
      x.gecmis = [kontrol, ...x.gecmis].slice(0, 60);
      if (sohbet) x.sohbet = sohbet;
      if (hata) {
        x.ustUsteHata = (x.ustUsteHata ?? 0) + 1;
        x.sonHata = hata;
        // Beş kez üst üste hata: izleme duraklar ve sahibe bir kez haber verilir.
        if (x.ustUsteHata >= 5 && x.durum === "acik") {
          x.durum = "duraklatildi";
          x.duraklatmaNedeni = `Üst üste 5 denetim başarısız oldu: ${hata}`;
          void bildirimOz(oz, { tur: "izleme", baslik: `${x.ad} duraklatıldı`, metin: x.duraklatmaNedeni, adres: "/panel/build/sohbet/gorevler?sekme=izleme", kaynak: { tur: "izleme", id: x.id, ad: x.ad } }).catch(() => {});
        }
      } else {
        x.ustUsteHata = 0; x.sonHata = undefined;
        x.durumVerisi = r!.durum;
        if (r!.deger) x.sonDeger = r!.deger;
        if (r!.tuttu && !r!.ilk) {
          x.tetiklenme += 1; x.sonTetik = kontrol.zaman; x.okunmamis = (x.okunmamis ?? 0) + 1;
          if (x.tekrar === "bir-kez") { x.durum = "duraklatildi"; x.duraklatmaNedeni = "Koşul gerçekleşti ve bir kez bildirildi."; }
        }
      }
    });
    return kontrol;
  } finally { calisanlar.delete(anahtar); }
}
export const izlemeCalistir = (sahip: string, id: string) => izlemeCalistirOz(sahipOzeti(sahip), id);

/** Zamanlayıcı turu: süresi gelen açık izlemeler (aynı anda en çok 3). */
export async function izlemeTuru(simdi = Date.now()): Promise<number> {
  let dosyalar: string[] = [];
  try { dosyalar = (await readdir(KOK)).filter((f) => /^[a-f0-9]{40}\.json$/.test(f)); } catch { return 0; }
  const isler: { oz: string; id: string }[] = [];
  for (const f of dosyalar) {
    const oz = f.slice(0, 40);
    for (const x of await oku(oz)) if (x.durum === "acik" && x.sonraki <= simdi) isler.push({ oz, id: x.id });
  }
  let i = 0;
  await Promise.all([0, 1, 2].map(async () => { while (i < isler.length) { const is = isler[i++]; await izlemeCalistirOz(is.oz, is.id).catch(() => null); } }));
  return isler.length;
}

type ZG = { __vayraIzleme?: ReturnType<typeof setInterval>; __vayraIzlemeTur?: () => Promise<number> };
/** Süreç başına tek zamanlayıcı (dakikada bir). Kod yeniden yüklenince yeni tur işlevi kullanılır. */
export function izlemeZamanlayicisi() {
  const g = globalThis as unknown as ZG;
  g.__vayraIzlemeTur = () => izlemeTuru();
  if (g.__vayraIzleme) return;
  g.__vayraIzleme = setInterval(() => { (g.__vayraIzlemeTur ?? izlemeTuru)().catch(() => {}); }, 60_000);
  setTimeout(() => { (g.__vayraIzlemeTur ?? izlemeTuru)().catch(() => {}); }, 8_000);
}
