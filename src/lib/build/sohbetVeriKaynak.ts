import "server-only";
import { katla } from "./sohbetTipler";

/**
 * Sohbet araçlarının ve izleme görevlerinin dış veri kaynakları (anahtarsız, herkese açık):
 *  - Döviz: TCMB gösterge niteliğindeki günlük kurlar (today.xml; iş günlerinde 15.30'da yayımlanır).
 *  - Altın ve gümüş: gold-api.com ons fiyatı (ABD doları) ile TCMB dolar satış kurundan hesaplanan gram TL fiyatı.
 *  - Hava: Open-Meteo yer arama ve tahmin (Türkiye saatiyle).
 * Kaynağa erişilemezse uydurma değer dönmez; hata açıkça döner. Sonuçlar kısa süre önbellekte tutulur.
 */
type Onbellek<T> = { zaman: number; deger: T };
const G = globalThis as unknown as { __vayraVeriKaynak?: Map<string, Onbellek<unknown>> };
const ONB = (G.__vayraVeriKaynak ??= new Map());
async function onbellekli<T>(anahtar: string, sure: number, f: () => Promise<T>): Promise<T> {
  const x = ONB.get(anahtar) as Onbellek<T> | undefined;
  if (x && Date.now() - x.zaman < sure) return x.deger;
  const deger = await f();
  ONB.set(anahtar, { zaman: Date.now(), deger });
  if (ONB.size > 300) ONB.delete(ONB.keys().next().value as string);
  return deger;
}
const getir = async (u: string, ms = 15_000) => {
  const iste = () => fetch(u, { signal: AbortSignal.timeout(ms), headers: { "User-Agent": "Vayra/1.0 (+https://vayra.app)", Accept: "*/*" }, cache: "no-store" });
  let r = await iste();
  // Geçici sunucu hatasında bir kez daha denenir.
  if (r.status === 429 || r.status >= 500) { await r.body?.cancel().catch(() => {}); await new Promise((c) => setTimeout(c, 700)); r = await iste(); }
  if (!r.ok) throw new Error(`${new URL(u).hostname} ${r.status} döndürdü`);
  return r;
};

/* ───────────── Döviz ve altın ───────────── */
export type Kur = { kod: string; ad: string; birim: number; alis: number | null; satis: number | null; efektifAlis?: number | null; efektifSatis?: number | null };
export type KurTablosu = { tarih: string; bulten?: string; kurlar: Kur[]; kaynak: string; adres: string };
const sayiAl = (s?: string) => { const n = s ? Number(s.trim()) : NaN; return Number.isFinite(n) && n > 0 ? n : null; };

export function tcmbKurlari(): Promise<KurTablosu> {
  return onbellekli("tcmb", 10 * 60_000, async () => {
    const x = await (await getir("https://www.tcmb.gov.tr/kurlar/today.xml")).text();
    const tarih = /Tarih="([^"]+)"/.exec(x)?.[1] ?? "";
    const bulten = /Bulten_No="([^"]+)"/.exec(x)?.[1];
    const kurlar: Kur[] = [];
    for (const m of x.matchAll(/<Currency[^>]*Kod="([A-Z]{3})"[^>]*>([\s\S]*?)<\/Currency>/g)) {
      const ic = m[2], al = (e: string) => new RegExp(`<${e}>([^<]*)</${e}>`).exec(ic)?.[1];
      kurlar.push({ kod: m[1], ad: (al("Isim") ?? m[1]).trim(), birim: Number(al("Unit") ?? 1) || 1, alis: sayiAl(al("ForexBuying")), satis: sayiAl(al("ForexSelling")), efektifAlis: sayiAl(al("BanknoteBuying")), efektifSatis: sayiAl(al("BanknoteSelling")) });
    }
    if (!kurlar.length) throw new Error("TCMB yanıtında kur bulunamadı.");
    return { tarih, bulten, kurlar, kaynak: "Türkiye Cumhuriyet Merkez Bankası", adres: "https://www.tcmb.gov.tr/kurlar/today.xml" };
  });
}

export type Maden = { kod: "XAU" | "XAG"; ad: string; onsUsd: number; gramTl: number; guncelleme: string; dolarKuru: number; kaynak: string };
const ONS_GRAM = 31.1034768;
export function madenFiyati(kod: "XAU" | "XAG"): Promise<Maden> {
  return onbellekli(`maden-${kod}`, 5 * 60_000, async () => {
    const [v, t] = await Promise.all([getir(`https://api.gold-api.com/price/${kod}`).then((r) => r.json() as Promise<{ price?: number; updatedAt?: string }>), tcmbKurlari()]);
    const usd = t.kurlar.find((k) => k.kod === "USD")?.satis;
    if (!v.price || !usd) throw new Error("Ons fiyatı ya da dolar kuru alınamadı.");
    return { kod, ad: kod === "XAU" ? "Altın" : "Gümüş", onsUsd: v.price, gramTl: (v.price / ONS_GRAM) * usd, guncelleme: v.updatedAt ?? new Date().toISOString(), dolarKuru: usd, kaynak: "gold-api.com ons fiyatı, TCMB dolar satış kuru" };
  });
}

/** İzleme ve araçların anladığı kodlar: TCMB kodları (USD, EUR...) ile GRAM-ALTIN, GRAM-GUMUS, ONS-ALTIN. */
export const KUR_ADLARI: Record<string, string> = { USD: "ABD doları", EUR: "Euro", GBP: "İngiliz sterlini", CHF: "İsviçre frangı", JPY: "Japon yeni", SAR: "Suudi riyali", AUD: "Avustralya doları", CAD: "Kanada doları", "GRAM-ALTIN": "Gram altın", "GRAM-GUMUS": "Gram gümüş", "ONS-ALTIN": "Ons altın (dolar)" };
export type KurDegeri = { kod: string; ad: string; deger: number; birim: string; tarih: string; kaynak: string; adres?: string; ayrinti?: string };
export async function kurDegeri(kodHam: string): Promise<KurDegeri> {
  const kod = kodHam.trim().toUpperCase().replace(/\s+/g, "-");
  if (kod === "GRAM-ALTIN" || kod === "ALTIN" || kod === "XAU") { const m = await madenFiyati("XAU"); return { kod: "GRAM-ALTIN", ad: "Gram altın", deger: m.gramTl, birim: "TL", tarih: m.guncelleme, kaynak: m.kaynak, ayrinti: `Ons ${m.onsUsd.toFixed(2)} dolar, dolar ${m.dolarKuru.toFixed(4)} TL` }; }
  if (kod === "ONS-ALTIN") { const m = await madenFiyati("XAU"); return { kod, ad: "Ons altın", deger: m.onsUsd, birim: "dolar", tarih: m.guncelleme, kaynak: "gold-api.com" }; }
  if (kod === "GRAM-GUMUS" || kod === "GUMUS" || kod === "XAG") { const m = await madenFiyati("XAG"); return { kod: "GRAM-GUMUS", ad: "Gram gümüş", deger: m.gramTl, birim: "TL", tarih: m.guncelleme, kaynak: m.kaynak, ayrinti: `Ons ${m.onsUsd.toFixed(2)} dolar` }; }
  const t = await tcmbKurlari();
  const k = t.kurlar.find((x) => x.kod === kod);
  if (!k || !k.satis) throw new Error(`${kod} için TCMB kuru bulunamadı.`);
  return { kod, ad: KUR_ADLARI[kod] ?? k.ad, deger: k.satis / k.birim, birim: "TL", tarih: t.tarih, kaynak: "TCMB döviz satış kuru", adres: t.adres };
}

/* ───────────── Hava ───────────── */
export type Yer = { ad: string; bolge?: string; ulke?: string; enlem: number; boylam: number };
export async function yerBul(ad: string): Promise<Yer | null> {
  const q = ad.trim().slice(0, 80);
  if (!q) return null;
  return onbellekli(`yer2-${katla(q)}`, 24 * 3600_000, async () => {
    // "Kadıköy, İstanbul" gibi ilçe ve il birlikte yazılınca OpenStreetMap (Nominatim) ilçe sınırını bulur;
    // Open-Meteo yer araması yalnız yerleşim adlarını bilir (aynı adlı köyleri öne çıkarabilir).
    if (q.includes(",")) {
      try {
        const n = await (await getir(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=1&accept-language=tr&addressdetails=1`, 8000)).json() as { lat: string; lon: string; name: string; display_name: string; address?: { province?: string; state?: string; country?: string } }[];
        if (n[0]) return { ad: n[0].name || q.split(",")[0].trim(), bolge: n[0].address?.province ?? n[0].address?.state ?? q.split(",")[1]?.trim(), ulke: n[0].address?.country, enlem: Number(n[0].lat), boylam: Number(n[0].lon) };
      } catch { /* Open-Meteo aramasına düşülür */ }
    }
    const v = await (await getir(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.split(",")[0])}&count=10&language=tr&format=json`)).json() as { results?: { name: string; admin1?: string; country?: string; country_code?: string; latitude: number; longitude: number; population?: number; feature_code?: string }[] };
    const l = v.results ?? [];
    if (!l.length) return null;
    // "Kadıköy, İstanbul" gibi yazımda ikinci parça bölgeyi seçer; yoksa Türkiye ve nüfus önceliklidir.
    const ikinci = katla(q.split(",")[1]?.trim() ?? "");
    const puan = (x: (typeof l)[number]) => (ikinci && katla(x.admin1 ?? "").includes(ikinci) ? 1e12 : 0) + (x.country_code === "TR" ? 1e10 : 0) + (/PPLC|PPLA/.test(x.feature_code ?? "") ? 1e9 : 0) + (x.population ?? 0);
    const x = [...l].sort((a, b) => puan(b) - puan(a))[0];
    return { ad: x.name, bolge: x.admin1, ulke: x.country, enlem: x.latitude, boylam: x.longitude };
  });
}
export type HavaGunu = { tarih: string; enYuksek: number; enDusuk: number; yagisOlasiligi: number | null; yagis: number; ruzgar: number; kod: number; durum: string; gunDogumu?: string; gunBatimi?: string };
export type HavaDurumu = { yer: Yer; simdi: { sicaklik: number; hissedilen: number; nem: number; ruzgar: number; kod: number; durum: string; gunduz: boolean; zaman: string }; saatlik: { saat: string; sicaklik: number; yagisOlasiligi: number | null; kod: number }[]; gunler: HavaGunu[]; kaynak: string };
const KODLAR: [number[], string][] = [
  [[0], "Açık"], [[1], "Az bulutlu"], [[2], "Parçalı bulutlu"], [[3], "Kapalı"], [[45, 48], "Sisli"], [[51, 53, 55], "Çisenti"], [[56, 57], "Donan çisenti"],
  [[61], "Hafif yağmur"], [[63], "Yağmur"], [[65], "Kuvvetli yağmur"], [[66, 67], "Donan yağmur"], [[71], "Hafif kar"], [[73], "Kar"], [[75], "Yoğun kar"], [[77], "Kar taneleri"],
  [[80], "Hafif sağanak"], [[81], "Sağanak"], [[82], "Şiddetli sağanak"], [[85, 86], "Kar sağanağı"], [[95], "Gök gürültülü fırtına"], [[96, 99], "Dolulu fırtına"],
];
export const havaKodu = (k: number) => KODLAR.find(([l]) => l.includes(k))?.[1] ?? "Bilinmiyor";

export async function havaDurumu(yerAdi: string, gun = 7): Promise<HavaDurumu> {
  const yer = await yerBul(yerAdi);
  if (!yer) throw new Error(`"${yerAdi}" adında bir yer bulunamadı.`);
  return onbellekli(`hava-${yer.enlem.toFixed(2)},${yer.boylam.toFixed(2)},${gun}`, 15 * 60_000, async () => {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${yer.enlem}&longitude=${yer.boylam}&timezone=Europe%2FIstanbul&forecast_days=${Math.min(16, Math.max(1, gun))}`
      + "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day"
      + "&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,sunrise,sunset";
    const v = await (await getir(u)).json() as {
      current: { time: string; temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number; is_day: number };
      hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: (number | null)[]; weather_code: number[] };
      daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: (number | null)[]; precipitation_sum: number[]; wind_speed_10m_max: number[]; sunrise: string[]; sunset: string[] };
    };
    const c = v.current;
    const simdiSaat = c.time.slice(0, 13);
    const bas = Math.max(0, v.hourly.time.findIndex((t) => t.slice(0, 13) === simdiSaat));
    return {
      yer,
      simdi: { sicaklik: c.temperature_2m, hissedilen: c.apparent_temperature, nem: c.relative_humidity_2m, ruzgar: c.wind_speed_10m, kod: c.weather_code, durum: havaKodu(c.weather_code), gunduz: c.is_day === 1, zaman: c.time },
      saatlik: v.hourly.time.slice(bas, bas + 24).map((t, i) => ({ saat: t.slice(11, 16), sicaklik: v.hourly.temperature_2m[bas + i], yagisOlasiligi: v.hourly.precipitation_probability[bas + i], kod: v.hourly.weather_code[bas + i] })),
      gunler: v.daily.time.map((t, i) => ({ tarih: t, enYuksek: v.daily.temperature_2m_max[i], enDusuk: v.daily.temperature_2m_min[i], yagisOlasiligi: v.daily.precipitation_probability_max[i], yagis: v.daily.precipitation_sum[i], ruzgar: v.daily.wind_speed_10m_max[i], kod: v.daily.weather_code[i], durum: havaKodu(v.daily.weather_code[i]), gunDogumu: v.daily.sunrise[i]?.slice(11, 16), gunBatimi: v.daily.sunset[i]?.slice(11, 16) })),
      kaynak: "Open-Meteo",
    };
  });
}

/** Türkçe ya da İngilizce yazılmış sayıyı çözer: "1.299,90" 1299.9, "1,299.90" 1299.9, "12,5" 12.5. */
export function sayiCoz(s: string): number | null {
  let t = s.replace(/[^\d.,-]/g, "");
  if (!/\d/.test(t)) return null;
  const v = t.lastIndexOf(","), n = t.lastIndexOf(".");
  if (v >= 0 && n >= 0) t = v > n ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  else if (v >= 0) t = /,\d{3}$/.test(t) && t.split(",").length > 2 ? t.replace(/,/g, "") : t.replace(",", ".");
  else if (n >= 0 && t.split(".").length > 2) t = t.replace(/\./g, "");
  else if (n >= 0 && /^\d{1,3}\.\d{3}$/.test(t)) t = t.replace(".", "");
  const x = Number(t);
  return Number.isFinite(x) ? x : null;
}
