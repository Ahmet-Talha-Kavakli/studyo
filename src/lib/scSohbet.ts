import { useSupercomputer } from "@/store/useSupercomputer";

/**
 * Usta sohbet çekirdeği — model listesi, akış olayları, istemci okuyucusu ve demo yanıt.
 * Sunucu (api/sc/sohbet) olayları NDJSON yollar; istemci bunları mesaj parçalarına çevirir.
 */

/**
 * Sohbet modelleri (Anthropic model kataloğundaki kimlikler — tahmin edilmez).
 * `ana`: menünün üstünde ölçerleriyle görünür; diğerleri "Diğer modeller" altında.
 * `arama`: web arama aracının sürümü — dinamik filtreli 20260209 yalnız Opus/Sonnet ailesinde
 * belgelenmiş; Fable ve Haiku temel sürümü kullanır. `yedek`: sunucu tarafı yedek model desteği.
 */
export const SC_MODELLER = [
  { saglayici: "anthropic", id: "claude-opus-5-5", ad: "Opus 5.5", alt: "Varsayılan; zor işler, kod ve analiz", hiz: 3, zeka: 5, yedek: true, ana: true, arama: "yeni" },
  { saglayici: "anthropic", id: "claude-fable-5-1", ad: "Fable 5.1", alt: "En yetenekli; uzun araştırma ve derin akıl yürütme", hiz: 2, zeka: 5, yedek: false, ana: true, arama: "temel" },
  { saglayici: "anthropic", id: "claude-sonnet-5-5", ad: "Sonnet 5.5", alt: "Hızlı ve güçlü; günlük işlerin çoğu", hiz: 4, zeka: 4, yedek: true, ana: true, arama: "yeni" },
  { saglayici: "anthropic", id: "claude-haiku-5-5", ad: "Haiku 5.5", alt: "En hızlı; kısa sorular ve taslaklar", hiz: 5, zeka: 3, yedek: false, ana: true, arama: "temel" },
  { saglayici: "anthropic", id: "claude-fable-5", ad: "Fable 5", alt: "Önceki Fable", hiz: 2, zeka: 5, yedek: false, ana: false, arama: "temel" },
  { saglayici: "anthropic", id: "claude-opus-5", ad: "Opus 5", alt: "Önceki Opus", hiz: 3, zeka: 5, yedek: false, ana: false, arama: "yeni" },
  { saglayici: "anthropic", id: "claude-sonnet-5", ad: "Sonnet 5", alt: "Önceki Sonnet", hiz: 4, zeka: 4, yedek: false, ana: false, arama: "yeni" },
  { saglayici: "anthropic", id: "claude-opus-4-8", ad: "Opus 4.8", alt: "Opus 4 serisinin en güçlüsü; sıcak, net yazı", hiz: 3, zeka: 4, yedek: false, ana: false, arama: "yeni" },
  { saglayici: "anthropic", id: "claude-opus-4-7", ad: "Opus 4.7", alt: "Önceki nesil Opus", hiz: 3, zeka: 4, yedek: false, ana: false, arama: "yeni" },
  { saglayici: "anthropic", id: "claude-sonnet-4-6", ad: "Sonnet 4.6", alt: "Önceki nesil Sonnet", hiz: 4, zeka: 3, yedek: false, ana: false, arama: "yeni" },
  /* Diğer sağlayıcılar (resmî model sayfalarındaki kimlikler, 2026-11). Sunucu kendi API'leriyle akıtır. */
  { saglayici: "openai", id: "gpt-6-astra", ad: "GPT-6 Astra", alt: "OpenAI'ın amiral modeli; karmaşık akıl yürütme ve kod", hiz: 3, zeka: 5, yedek: false, ana: false, arama: "yok" },
  { saglayici: "openai", id: "gpt-6.1-sol", ad: "GPT-6.1 Sol", alt: "Güçlü genel model; yazı ve analiz", hiz: 3, zeka: 5, yedek: false, ana: false, arama: "yok" },
  { saglayici: "openai", id: "gpt-6.1-terra", ad: "GPT-6.1 Terra", alt: "Dengeli; günlük işler", hiz: 4, zeka: 4, yedek: false, ana: false, arama: "yok" },
  { saglayici: "openai", id: "gpt-6-luna", ad: "GPT-6 Luna", alt: "Hızlı ve hafif", hiz: 5, zeka: 3, yedek: false, ana: false, arama: "yok" },
  { saglayici: "google", id: "gemini-4-argon", ad: "Gemini 4 Argon", alt: "Google'ın en yetenekli modeli; uzun bağlam", hiz: 3, zeka: 5, yedek: false, ana: false, arama: "yok" },
  { saglayici: "google", id: "gemini-3.8-flash", ad: "Gemini 3.8 Flash", alt: "Hızlı ve güçlü; çok modlu", hiz: 4, zeka: 4, yedek: false, ana: false, arama: "yok" },
  { saglayici: "google", id: "gemini-3.5-flash-lite", ad: "Gemini 3.5 Flash-Lite", alt: "En hızlı ve ekonomik", hiz: 5, zeka: 3, yedek: false, ana: false, arama: "yok" },
] as const;
export const SC_VARSAYILAN_MODEL = "claude-opus-5-5";
/** "Otomatik": sunucu, isteğe göre hızlı (Haiku), dengeli (Sonnet) ya da güçlü (Opus) modeli seçer. */
export const SC_OTOMATIK = { id: "otomatik", ad: "Otomatik", alt: "Soruya göre hızlı ya da güçlü modeli seçer" } as const;
export const modelAdi = (id?: string) => (id === SC_OTOMATIK.id ? SC_OTOMATIK.ad : SC_MODELLER.find((m) => id?.startsWith(m.id))?.ad ?? id ?? "");
/** Düşünme düzeyi (Messages API effort). */
export type ScEfor = "dusuk" | "orta" | "yuksek" | "max";
export const SC_EFORLAR: { id: ScEfor; ad: string; alt: string }[] = [
  { id: "dusuk", ad: "Düşük", alt: "Hızlı yanıt" },
  { id: "orta", ad: "Orta", alt: "Dengeli" },
  { id: "yuksek", ad: "Yüksek", alt: "Zor sorularda derin" },
  { id: "max", ad: "En yüksek", alt: "En kapsamlı, en yavaş" },
];
export type ScModel = (typeof SC_MODELLER)[number];
export const SAGLAYICI_ADI = { anthropic: "Anthropic", openai: "OpenAI", google: "Google" } as const;

export const SC_STILLER = [
  { id: "normal", ad: "Normal", alt: "Varsayılan ton" },
  { id: "kisa", ad: "Kısa", alt: "Öz, doğrudan yanıtlar" },
  { id: "resmi", ad: "Resmî", alt: "Profesyonel dil" },
  { id: "aciklayici", ad: "Açıklayıcı", alt: "Adım adım, öğretici" },
] as const;
export type ScStil = (typeof SC_STILLER)[number]["id"];

export type ScKaynak = { url: string; baslik: string; alinti?: string; yas?: string };
/** Modele giden ek: görsel (data URL) ya da metin dosyası içeriği. */
export type ScGidenEk = { tur: "gorsel"; ad: string; veri: string } | { tur: "metin"; ad: string; icerik: string };

/** Sunucudan gelen akış olayları. */
export type ScOlay =
  | { t: "dusunme_basla" } | { t: "dusunme"; metin: string } | { t: "dusunme_bitti" }
  | { t: "arama_basla"; sorgu: string } | { t: "arama_sonuc"; sonuclar: ScKaynak[] } | { t: "arama_hata"; kod: string }
  | { t: "kaynak"; url: string; baslik: string; alinti?: string }
  /** Bağlayıcı (MCP) aracı çağrıldı / bitti. */
  | { t: "arac_basla"; ad: string; sunucu: string } | { t: "arac_bitti"; hata?: boolean }
  /** Kod çalıştırma: komut (bash) ya da dosya işlemi başladı / sonuç geldi (çıktı, hata, üretilen dosyalar). */
  | { t: "kod_basla"; komut: string; tur: "bash" | "dosya"; icerik?: string }
  | { t: "kod_sonuc"; cikti?: string; hata?: string; kod?: number; dosyalar?: string[] }
  /** Alıntılı metin bloğu bitti: bloğun dayandığı kaynaklar metne numaralı atıf olarak eklenir. */
  | { t: "atif"; urller: string[] }
  | { t: "metin"; metin: string }
  | { t: "red" } | { t: "hata"; mesaj: string }
  | { t: "bitti"; sureMs: number; girdi: number; cikti: number; model: string; kesildi?: boolean };

/** Asistan yanıtının parçaları (sırayla render edilir). */
export type ScParca =
  | { tur: "dusunme"; metin: string; basla: number; bitis?: number }
  | { tur: "arama"; sorgu: string; sonuclar?: ScKaynak[]; basla: number; bitis?: number; hata?: string }
  | { tur: "arac"; ad: string; sunucu: string; basla: number; bitis?: number; hata?: boolean }
  | { tur: "kod"; komut: string; kodTur: "bash" | "dosya"; icerik?: string; cikti?: string; hata?: string; cikisKodu?: number; dosyalar?: string[]; basla: number; bitis?: number }
  | { tur: "metin"; metin: string };

export type ScYanit = {
  parcalar: ScParca[];
  kaynaklar: ScKaynak[];
  durum: "akiyor" | "bitti" | "hata" | "durdu" | "red";
  hata?: string;
  demo?: boolean;
  model?: string;
  sureMs?: number;
  token?: { girdi: number; cikti: number };
};

export const bosYanit = (): ScYanit => ({ parcalar: [], kaynaklar: [], durum: "akiyor" });

/** Bir olayı yanıta uygular (saf fonksiyon). */
export function olayUygula(y: ScYanit, o: ScOlay): ScYanit {
  const p = [...y.parcalar];
  const son = p[p.length - 1];
  const simdi = Date.now();
  const kapat = () => { const s = p[p.length - 1]; if (s && s.tur !== "metin" && !s.bitis) p[p.length - 1] = { ...s, bitis: simdi }; };
  switch (o.t) {
    case "dusunme_basla": kapat(); p.push({ tur: "dusunme", metin: "", basla: simdi }); break;
    case "dusunme": if (son?.tur === "dusunme") p[p.length - 1] = { ...son, metin: son.metin + o.metin }; else p.push({ tur: "dusunme", metin: o.metin, basla: simdi }); break;
    case "dusunme_bitti": kapat(); break;
    case "arama_basla": kapat(); p.push({ tur: "arama", sorgu: o.sorgu, basla: simdi }); break;
    case "arama_sonuc": case "arama_hata": {
      const i = p.map((x) => x.tur).lastIndexOf("arama");
      if (i >= 0) { const a = p[i] as Extract<ScParca, { tur: "arama" }>; p[i] = { ...a, bitis: simdi, ...(o.t === "arama_sonuc" ? { sonuclar: o.sonuclar } : { hata: o.kod }) }; }
      break;
    }
    case "kaynak": if (!y.kaynaklar.some((k) => k.url === o.url)) return { ...y, parcalar: p, kaynaklar: [...y.kaynaklar, { url: o.url, baslik: o.baslik, alinti: o.alinti }] }; break;
    case "arac_basla": kapat(); p.push({ tur: "arac", ad: o.ad, sunucu: o.sunucu, basla: simdi }); break;
    case "arac_bitti": {
      const i = p.map((x) => x.tur).lastIndexOf("arac");
      if (i >= 0) { const a = p[i] as Extract<ScParca, { tur: "arac" }>; p[i] = { ...a, bitis: simdi, hata: o.hata }; }
      break;
    }
    case "kod_basla": kapat(); p.push({ tur: "kod", komut: o.komut, kodTur: o.tur, icerik: o.icerik, basla: simdi }); break;
    case "kod_sonuc": {
      const i = p.map((x) => x.tur).lastIndexOf("kod");
      if (i >= 0) { const a = p[i] as Extract<ScParca, { tur: "kod" }>; p[i] = { ...a, bitis: simdi, cikti: o.cikti, hata: o.hata, cikisKodu: o.kod, dosyalar: o.dosyalar }; }
      break;
    }
    case "atif": {
      const i = p.map((x) => x.tur).lastIndexOf("metin");
      const nolar = [...new Set(o.urller.map((u) => y.kaynaklar.findIndex((k) => k.url === u) + 1).filter((n) => n > 0))];
      if (i >= 0 && nolar.length) { const m = p[i] as Extract<ScParca, { tur: "metin" }>; p[i] = { ...m, metin: m.metin.replace(/\s+$/, "") + nolar.map((n) => ` [${n}](#sc-k-${n})`).join("") + (m.metin.match(/\s+$/)?.[0] ?? "") }; }
      break;
    }
    case "metin": kapat(); if (son?.tur === "metin") p[p.length - 1] = { ...son, metin: son.metin + o.metin }; else p.push({ tur: "metin", metin: o.metin }); break;
    case "red": return { ...y, parcalar: p, durum: "red" };
    case "hata": kapat(); return { ...y, parcalar: p, durum: "hata", hata: o.mesaj };
    case "bitti": kapat(); return { ...y, parcalar: p, durum: "bitti", sureMs: o.sureMs, model: o.model, token: { girdi: o.girdi, cikti: o.cikti } };
  }
  return { ...y, parcalar: p };
}

/** Yanıtın düz metni (kopyala, sesli oku, geçmiş). */
export const yanitMetni = (y: ScYanit) => y.parcalar.filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("").replace(/ ?\[\d+\]\(#sc-k-\d+\)/g, "");

/** Kullanıcı mesajının modele giden hâli: alıntı varsa markdown alıntısı olarak başa eklenir. */
export const alintiliMetin = (metin: string, alinti?: string) => alinti ? `${alinti.split("\n").map((s) => `> ${s}`).join("\n")}\n\n${metin}` : metin;

/** Yanıttan sonra sorulabilecek 3 soru. Model bağlı değilse genel ama işe yarar öneriler döner. */
export async function oneriGetir(soru: string, yanit: string, sinyal?: AbortSignal): Promise<string[]> {
  try {
    const r = await fetch("/api/sc/oneri", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ soru: soru.slice(0, 2000), yanit: yanit.slice(0, 6000) }), signal: sinyal });
    const j = (await r.json()) as { oneriler?: string[] };
    return (j.oneriler ?? []).filter((x) => typeof x === "string" && x.trim()).slice(0, 3);
  } catch { return []; }
}

/** Otomatik bellek: son mesajdan kalıcı bilgi çıkarır (gerçek model gerekir; demo boş döner). */
export async function bellekCikar(soru: string, yanit: string, mevcut: string[], sinyal?: AbortSignal): Promise<string[]> {
  try {
    const r = await fetch("/api/sc/bellek", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ soru: soru.slice(0, 3000), yanit: yanit.slice(0, 3000), mevcut: mevcut.slice(0, 60) }), signal: sinyal });
    const j = (await r.json()) as { anilar?: string[] };
    return (j.anilar ?? []).filter((x) => typeof x === "string" && x.trim()).slice(0, 2);
  } catch { return []; }
}

/**
 * Sohbet isteği: sunucu akışını okur, her olayda `onOlay` çağırır.
 * Sunucu `demo` derse demo yanıtını aynı olay biçiminde akıtır.
 */
/** Modele giden proje bağlamı. */
export type ScProjeBaglam = { ad: string; talimat?: string; dosyalar?: { ad: string; icerik: string }[] };
/** Modele giden kişisel bağlam (talimatlar + bellek). */
export type ScKisisel = { hitap?: string; is?: string; tercih?: string; bellek?: string[] };

/** "Bunu hatırla: …", "unutma, …" gibi açık hatırlatma isteğini yakalar (belleğe eklenecek metin). */
export const hatirlaIstegi = (t: string) => {
  const m = t.trim().match(/^(?:bunu\s+)?(?:hatırla|aklında\s+tut|unutma)\s*[:,—-]?\s*(?:ki\s+)?(.{4,300})$/is);
  return m ? m[1].trim().replace(/[.!]+$/, "") : null;
};

export async function sohbetAkisi(govde: { mesajlar: { rol: "kullanici" | "asistan"; metin: string; ekler?: ScGidenEk[] }[]; model: string; dusun: boolean; web: boolean; stil: ScStil; ozelStil?: { ad: string; talimat: string }; efor?: ScEfor; arastir?: boolean; proje?: ScProjeBaglam; kisisel?: ScKisisel; calisan?: { ad: string; talimat: string; dosyalar?: { ad: string; icerik: string }[] }; beceri?: { ad: string; talimat: string }; beceriler?: { ad: string; komut: string; talimat: string }[]; mcp?: { ad: string; url: string; token?: string }[]; kod?: boolean },
  onOlay: (o: ScOlay) => void, onDemo: () => void, sinyal: AbortSignal) {
  const r = await fetch("/api/sc/sohbet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(govde), signal: sinyal });
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { hata?: string };
    onOlay({ t: "hata", mesaj: j.hata ?? `İstek başarısız (${r.status}).` });
    return;
  }
  if (r.headers.get("content-type")?.includes("application/json")) {
    onDemo();
    await demoAkisi(govde.mesajlar[govde.mesajlar.length - 1].metin, govde.dusun || !!govde.arastir, govde.web, onOlay, sinyal, govde.arastir);
    return;
  }
  const okuyucu = r.body!.getReader();
  const coz = new TextDecoder();
  let tampon = "";
  for (;;) {
    const { value, done } = await okuyucu.read();
    if (done) break;
    tampon += coz.decode(value, { stream: true });
    let i;
    while ((i = tampon.indexOf("\n")) >= 0) {
      const satir = tampon.slice(0, i).trim(); tampon = tampon.slice(i + 1);
      if (satir) { try { onOlay(JSON.parse(satir) as ScOlay); } catch { /* bozuk satır */ } }
    }
  }
}

const bekle = (ms: number, s: AbortSignal) => new Promise<void>((coz, red) => {
  const t = setTimeout(coz, ms);
  s.addEventListener("abort", () => { clearTimeout(t); red(new DOMException("durdu", "AbortError")); }, { once: true });
});

/** Metni kelime kelime akıtır (gerçek akışın ritmine yakın). */
async function akit(metin: string, tur: "metin" | "dusunme", onOlay: (o: ScOlay) => void, s: AbortSignal, ms = 22) {
  for (const k of metin.match(/\S+\s*|\s+/g) ?? []) { await bekle(ms + (k.length > 8 ? 10 : 0), s); onOlay(tur === "metin" ? { t: "metin", metin: k } : { t: "dusunme", metin: k }); }
}

/** Demo: model bağlı değilken arayüzü gösteren dürüst yanıt (web araması yapılmaz, kaynak uydurulmaz). */
async function demoAkisi(istem: string, dusun: boolean, web: boolean, onOlay: (o: ScOlay) => void, s: AbortSignal, arastir?: boolean) {
  const basla = Date.now();
  const konu = istem.trim().replace(/\s+/g, " ");
  const kisa = konu.length > 70 ? konu.slice(0, 68) + "…" : konu;
  if (dusun) {
    onOlay({ t: "dusunme_basla" });
    await bekle(450, s);
    await akit(`Beklentiyi ve en okunur yanıt düzenini tartıyorum. İstek: “${kisa}”. Kısa bir açıklama mı, adım adım bir rehber mi gerekiyor? `
      + `Yanıtı bir özet cümleyle açıp ayrıntıyı maddelere bölmek en okunur yol. Gerekirse bir tablo ve kısa bir kod örneği ekleyeceğim. `
      + `Bu bir örnek oturum; gerçek akıl yürütme model bağlanınca burada görünecek.`, "dusunme", onOlay, s, 26);
    await bekle(250, s); onOlay({ t: "dusunme_bitti" });
  }
  const grafikIste = /grafik|chart|görselleştir|karşılaştır/i.test(konu);
  const metin = grafikIste && !arastir ? `Model bağlandığında sayısal karşılaştırmalar yanıtın içinde etkileşimli grafik olarak çizilir. Aşağıdaki **sayılar örnektir, gerçek veri değildir**; yalnızca grafiğin nasıl görüneceğini gösterir.

\`\`\`grafik
{"tur":"cubuk","baslik":"Örnek: aylık sipariş (demo verisi)","etiketler":["Oca","Şub","Mar","Nis","May","Haz"],"seriler":[{"ad":"2025","degerler":[120,135,128,150,162,171]},{"ad":"2026","degerler":[140,152,149,176,190,204]}]}
\`\`\`

Üzerine gelince değerleri görürsün; sağ üstten çizgiye ya da tabloya geçebilir, CSV olarak indirebilirsin.` : arastir ? `**Derin araştırma** model bağlandığında çalışır: soruyu alt sorulara böler, onlarca web kaynağını tarar ve karşılaştırır, sonunda kaynak çipli, başlıklı bir rapor yazar. Demoda arama yapılmaz ve kaynak uydurulmaz.

### Raporun düzeni

1. **Özet:** iki üç cümlede sonuç.
2. **Bulgular:** her iddianın yanında kaynak çipi.
3. **Karşılaştırma tablosu:** seçenekler yan yana.
4. **Sonuç ve öneri:** ne yapman gerektiği.` : `Model bağlandığında bu alanda isteğine özel yanıt akacak.${web ? " Web araması açık olsa da demoda arama yapılmaz, kaynak gösterilmez." : ""} Aşağısı, yanıtların nasıl görüneceğine dair kısa bir örnek.

### Örnek yanıt düzeni

1. **Özet cümle:** sorunun kısa yanıtı en üstte.
2. **Ayrıntı:** maddeler, \`satır içi kod\` ve gerekirse alıntılar.
3. **Sonraki adım:** ne yapman gerektiğini söyleyen tek bir öneri.

| Bölüm | Ne işe yarar |
|---|---|
| Düşünme özeti | Modelin nasıl akıl yürüttüğünü gösterir |
| Web araması | Güncel bilgi ve site ikonlu kaynaklar |
| Kod blokları | Dil etiketi, kopyalama ve satır kaydırma |

\`\`\`ts
const selam = (ad: string) => \`Merhaba, \${ad}!\`;
\`\`\``;
  await akit(metin, "metin", onOlay, s, 16);
  onOlay({ t: "bitti", sureMs: Date.now() - basla, girdi: 0, cikti: 0, model: "demo" });
}

/** İlk mesajdan kısa sohbet başlığı: ilk cümle, en çok 6 kelime, yarım kelime bırakmadan. */
export function baslikUret(istem: string) {
  const ilk = istem.replace(/\s+/g, " ").trim().split(/(?<=[?!.])\s/)[0].replace(/["“”«»]/g, "").replace(/[?!.…:,;]+$/, "").replace(/^'|'$/g, "").trim();
  const kel = ilk.split(" ");
  let b = kel.slice(0, 6).join(" ");
  if (b.length > 44) b = b.slice(0, 44).replace(/\s+\S*$/, "");
  if (kel.length > 6 || b.length < ilk.length) while (/\s(ve|ile|için|bir|da|de|ya|ki|mi|bu|şu|o)$/i.test(b)) b = b.replace(/\s+\S+$/, "");
  return b ? b.charAt(0).toLocaleUpperCase("tr") + b.slice(1) : "Yeni sohbet";
}

/** Ana ekrandan sohbet sayfasına devredilen ilk mesaj (ekler büyük olabileceği için depoya yazılmaz). */
export const scBekleyen = new Map<string, { metin: string; ekler: { id: string; tur: "gorsel" | "metin"; ad: string; boyut: number; onizleme?: string; veri?: string; icerik?: string }[] }>();

/** Bu sekmede akışı gerçekten süren sohbetler (sayfa değişse de iş sürer). */
export const aktifIsler = new Set<string>();

/**
 * Yarım kalmış işi kapat: sayfa yenilenince akış kopar ama "çalışıyor" bayrağı depoda kalır.
 * Bu sekmede süren bir iş yoksa akan yanıtı "durdu", yarım ajan işini "yarıda kaldı" yapar.
 * Onay/oran bekleyen iş açık kalır (kullanıcı hâlâ seçebilir).
 */
export function yarimKalaniKapat(id: string) {
  const st = useSupercomputer.getState();
  const s = st.sohbetler.find((x) => x.id === id);
  if (!s?.calisiyor || aktifIsler.has(id)) return;
  const son = s.mesajlar[s.mesajlar.length - 1];
  if (son?.yanit?.durum === "akiyor") st.mesajGuncelle(id, son.id, { yanit: { ...son.yanit, durum: "durdu" } });
  if (son?.is && !son.is.bitis && !son.is.bekleyen) st.mesajGuncelle(id, son.id, { is: { ...son.is, bitis: Date.now(), reddedildi: true }, metin: "İş yarıda kaldı (sayfa yenilendi). Yeniden göndermek için mesajı düzenle ya da tekrar yaz." });
  if (!son?.is?.bekleyen) st.calisiyorAyarla(id, false);
}
