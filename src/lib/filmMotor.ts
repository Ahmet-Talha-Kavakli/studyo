/**
 * Film motoru — Uzun Video Stüdyosu'nun planlayıcısı (LLM'siz, deterministik) ve hesapları.
 *
 * Hiyerarşi: proje → bölüm (perde/chapter) → çekim (shot). Hedef süre bölümlere oranlanır,
 * bölüm süresi ortalama çekim uzunluğuna bölünerek çekim sayısı planlanır.
 */

export type CekimBoy = "genis" | "orta" | "yakin" | "detay" | "omuz";
export type FilmTur = "kisa" | "belgesel" | "reklam" | "klip" | "egitim" | "hikaye";

export interface FilmTake { uretimId: string; tip: "video" | "kare" }
export interface FilmCekim {
  id: string;
  baslik: string;
  istem: string;
  boy: CekimBoy;
  kamera: string;          // KAMERALAR id
  sure: number;            // sn (4–10)
  model?: string;          // boşsa proje modeli
  elementler: string[];    // VElement id
  surekli: boolean;        // önceki çekimin son karesinden başla
  takes: FilmTake[];
  secili?: string;         // seçili take uretimId
}
/** Perde: ortam alanları (mekân, zaman, hava) bir kez yazılır, perdedeki bütün çekimlerin istemine eklenir. */
export interface FilmBolum { id: string; baslik: string; ozet: string; anlatim: string; hedefSn: number; cekimler: FilmCekim[]; acik: boolean; mekan?: string; zaman?: string; hava?: string }

export const ZAMANLAR: { id: string; ad: string; en: string }[] = [
  { id: "safak", ad: "Şafak", en: "at dawn, soft blue light" }, { id: "gunduz", ad: "Gündüz", en: "in daylight" },
  { id: "altin", ad: "Altın saat", en: "at golden hour, warm low sun" }, { id: "aksam", ad: "Akşam", en: "at dusk, blue hour" }, { id: "gece", ad: "Gece", en: "at night, practical lights" },
];
export const HAVALAR: { id: string; ad: string; en: string }[] = [
  { id: "acik", ad: "Açık", en: "clear sky" }, { id: "bulutlu", ad: "Bulutlu", en: "overcast" }, { id: "yagmur", ad: "Yağmur", en: "rain, wet reflective surfaces" },
  { id: "sis", ad: "Sis", en: "fog, hazy atmosphere" }, { id: "kar", ad: "Kar", en: "falling snow" },
];
/** Çekimin görünen adı: istemin ilk anı, büyük harfle (boy öneki ve eski planlardaki uzun hikâye eki atılır). */
export function cekimAdi(c: FilmCekim): string {
  const t = c.istem.replace(/^[^:]{2,24}:\s*/, "").split(" — ")[0].replace(/\.$/, "").trim();
  const k = t.length > 64 ? `${t.slice(0, 64).replace(/\s+\S*$/, "")}…` : t;
  return k ? k.charAt(0).toLocaleUpperCase("tr") + k.slice(1) : c.baslik;
}

export const CEKIM_BOYLARI: { id: CekimBoy; ad: string; en: string }[] = [
  { id: "genis", ad: "Geniş", en: "wide establishing shot" },
  { id: "orta", ad: "Orta", en: "medium shot" },
  { id: "yakin", ad: "Yakın", en: "close-up" },
  { id: "detay", ad: "Detay", en: "extreme close-up detail" },
  { id: "omuz", ad: "Omuz üstü", en: "over-the-shoulder shot" },
];

/** Kamera hareketleri: gerçek örnek klipleriyle (public/gercek/video-hareket). */
export const FILM_KAMERALAR: { id: string; ad: string; en: string; klip: string }[] = [
  { id: "sabit", ad: "Sabit", en: "static locked-off camera", klip: "focus-pull" },
  { id: "dolly-in", ad: "Dolly içeri", en: "slow dolly in", klip: "dolly-in" },
  { id: "dolly-out", ad: "Dolly dışarı", en: "slow dolly out", klip: "dolly-out" },
  { id: "orbit", ad: "Yörünge", en: "orbit around the subject", klip: "orbit-left" },
  { id: "drone", ad: "Drone", en: "aerial drone shot", klip: "drone-orbit" },
  { id: "crane", ad: "Vinç", en: "crane up reveal", klip: "crane-up" },
  { id: "elde", ad: "El kamerası", en: "handheld camera", klip: "handheld" },
  { id: "tilt", ad: "Yukarı eğim", en: "tilt up", klip: "tilt-up" },
  { id: "whip", ad: "Hızlı pan", en: "whip pan", klip: "whip-pan" },
  { id: "fpv", ad: "FPV dalış", en: "FPV drone dive", klip: "fpv-dive" },
  { id: "arc", ad: "Yay", en: "arc shot", klip: "arc-shot" },
  { id: "slowmo", ad: "Ağır çekim", en: "slow motion", klip: "slow-motion" },
];

export const FILM_TURLERI: { id: FilmTur; ad: string; alt: string; kapak: string; ortCekim: number; bolumler: { ad: string; oran: number; ozet: string; boylar: CekimBoy[]; kameralar: string[] }[] }[] = [
  { id: "kisa", ad: "Kısa film", alt: "Açılıştan çözülmeye hikâye", kapak: "/gercek/gorsel/mood-teatral-isik.webp", ortCekim: 6, bolumler: [
    { ad: "Açılış", oran: 0.12, ozet: "Dünya ve karakter kurulur; atmosfer belirlenir.", boylar: ["genis", "orta", "yakin"], kameralar: ["drone", "dolly-in", "sabit"] },
    { ad: "Kışkırtıcı olay", oran: 0.13, ozet: "Karakterin dengesini bozan olay yaşanır.", boylar: ["orta", "yakin", "detay"], kameralar: ["elde", "dolly-in", "whip"] },
    { ad: "Yükselen gerilim", oran: 0.3, ozet: "Engeller büyür, karakter zorlanır.", boylar: ["orta", "omuz", "yakin", "genis"], kameralar: ["elde", "orbit", "arc", "sabit"] },
    { ad: "Doruk", oran: 0.25, ozet: "En büyük çatışma; karar anı.", boylar: ["yakin", "detay", "genis", "orta"], kameralar: ["slowmo", "orbit", "fpv", "whip"] },
    { ad: "Çözülme", oran: 0.2, ozet: "Sonuç ve yeni denge; kapanış görüntüsü.", boylar: ["orta", "genis", "yakin"], kameralar: ["dolly-out", "crane", "sabit"] },
  ] },
  { id: "belgesel", ad: "Belgesel", alt: "Konu, tanık, sonuç", kapak: "/gercek/gorsel/mood-doga-isigi.webp", ortCekim: 8, bolumler: [
    { ad: "Giriş", oran: 0.1, ozet: "Konu ve soru ortaya konur.", boylar: ["genis", "detay", "orta"], kameralar: ["drone", "crane", "sabit"] },
    { ad: "Bağlam", oran: 0.25, ozet: "Tarih, mekân ve insanlar tanıtılır.", boylar: ["genis", "orta", "detay"], kameralar: ["dolly-in", "sabit", "tilt"] },
    { ad: "Derinleşme", oran: 0.35, ozet: "Tanıklıklar, ayrıntılar ve kanıtlar.", boylar: ["yakin", "orta", "detay", "omuz"], kameralar: ["elde", "sabit", "dolly-in", "arc"] },
    { ad: "Dönüm noktası", oran: 0.15, ozet: "Konunun kilit anı ya da keşif.", boylar: ["genis", "yakin"], kameralar: ["orbit", "slowmo"] },
    { ad: "Sonuç", oran: 0.15, ozet: "Bugün ve yarın; izleyiciye kalan düşünce.", boylar: ["genis", "orta"], kameralar: ["dolly-out", "drone"] },
  ] },
  { id: "reklam", ad: "Reklam", alt: "Sorun, çözüm, çağrı", kapak: "/gercek/video-hareket/commercial-poster.webp", ortCekim: 4, bolumler: [
    { ad: "Kanca", oran: 0.15, ozet: "İlk saniyelerde dikkat çekici an.", boylar: ["yakin", "detay"], kameralar: ["whip", "fpv"] },
    { ad: "Sorun", oran: 0.2, ozet: "İzleyicinin tanıdığı sıkıntı.", boylar: ["orta", "yakin"], kameralar: ["elde", "sabit"] },
    { ad: "Ürün", oran: 0.35, ozet: "Ürün sahnede; özellikler ve kullanım.", boylar: ["detay", "orta", "yakin"], kameralar: ["orbit", "dolly-in", "arc"] },
    { ad: "Sonuç", oran: 0.2, ozet: "Hayat ürünle nasıl değişti.", boylar: ["genis", "orta"], kameralar: ["crane", "slowmo"] },
    { ad: "Çağrı", oran: 0.1, ozet: "Logo, slogan ve eylem çağrısı.", boylar: ["detay"], kameralar: ["sabit"] },
  ] },
  { id: "klip", ad: "Müzik klibi", alt: "Ritim ve görsel motif", kapak: "/gercek/video-hareket/k-pop-poster.webp", ortCekim: 3, bolumler: [
    { ad: "Giriş", oran: 0.15, ozet: "Atmosfer ve sanatçı tanıtımı.", boylar: ["genis", "detay"], kameralar: ["drone", "slowmo"] },
    { ad: "Kıta", oran: 0.25, ozet: "Hikâye anlatan sahneler.", boylar: ["orta", "yakin"], kameralar: ["elde", "arc"] },
    { ad: "Nakarat", oran: 0.25, ozet: "Enerjinin zirvesi; performans.", boylar: ["genis", "yakin", "orta"], kameralar: ["orbit", "whip", "fpv"] },
    { ad: "Köprü", oran: 0.15, ozet: "Dönüşüm; farklı görsel dünya.", boylar: ["detay", "genis"], kameralar: ["slowmo", "crane"] },
    { ad: "Final nakarat", oran: 0.2, ozet: "En görkemli tekrar ve kapanış.", boylar: ["genis", "yakin"], kameralar: ["orbit", "dolly-out"] },
  ] },
  { id: "egitim", ad: "Eğitim", alt: "Bölüm bölüm ders", kapak: "/gercek/explainer-video/ex-isometric.webp", ortCekim: 7, bolumler: [
    { ad: "Neden önemli", oran: 0.12, ozet: "Konunun hayattaki karşılığı.", boylar: ["genis", "orta"], kameralar: ["dolly-in", "sabit"] },
    { ad: "Temel kavramlar", oran: 0.3, ozet: "Terimler ve temel fikir.", boylar: ["orta", "detay"], kameralar: ["sabit", "tilt"] },
    { ad: "Adım adım", oran: 0.33, ozet: "Uygulamalı gösterim.", boylar: ["detay", "omuz", "orta"], kameralar: ["sabit", "dolly-in"] },
    { ad: "Sık hatalar", oran: 0.15, ozet: "Kaçınılması gerekenler.", boylar: ["yakin", "orta"], kameralar: ["elde", "sabit"] },
    { ad: "Özet", oran: 0.1, ozet: "Akılda kalacaklar ve sonraki adım.", boylar: ["orta", "genis"], kameralar: ["dolly-out"] },
  ] },
  { id: "hikaye", ad: "Seyahat · Vlog", alt: "Rota boyunca hikâye", kapak: "/gercek/video-hareket/drone-orbit-poster.webp", ortCekim: 5, bolumler: [
    { ad: "Yola çıkış", oran: 0.12, ozet: "Hazırlık ve beklenti.", boylar: ["orta", "detay"], kameralar: ["elde", "sabit"] },
    { ad: "Varış", oran: 0.18, ozet: "İlk izlenimler ve manzara.", boylar: ["genis", "orta"], kameralar: ["drone", "crane"] },
    { ad: "Keşif", oran: 0.35, ozet: "Yerler, tatlar, insanlar.", boylar: ["orta", "yakin", "detay"], kameralar: ["elde", "arc", "dolly-in"] },
    { ad: "Unutulmaz an", oran: 0.2, ozet: "Yolculuğun doruk anı.", boylar: ["genis", "yakin"], kameralar: ["slowmo", "orbit"] },
    { ad: "Dönüş", oran: 0.15, ozet: "Gün batımı ve kapanış düşüncesi.", boylar: ["genis", "orta"], kameralar: ["dolly-out", "drone"] },
  ] },
];
export const turBul = (id: FilmTur) => FILM_TURLERI.find((t) => t.id === id) ?? FILM_TURLERI[0];

let sayac = 0;
export const fId = (p: string) => `${p}_${Date.now().toString(36)}${(sayac += 1)}${Math.floor(Math.random() * 1e4)}`;

const BOY_IFADE: Record<CekimBoy, string> = { genis: "Geniş açıdan", orta: "Orta plan", yakin: "Yakın plan", detay: "Detay çekim", omuz: "Omuz üstünden" };

/** Perde başına çekim anları (deterministik planda çekimlere sırayla dağıtılır). */
const ANLAR: Record<string, string[]> = {
  "Açılış": ["mekânın geniş, sessiz görünümü; ışık ve hava hissedilir", "ana karakter ilk kez kadrajda, gündelik bir işle meşgul", "karakterin yüzünde düşünceli bir ifade", "mekânı tanıtan küçük bir ayrıntı"],
  "Kışkırtıcı olay": ["beklenmedik bir ses ya da gelişme dikkati çeker", "karakter dönüp bakar, şaşkınlık", "olayın kaynağını gösteren ayrıntı", "karakter bir karar eşiğinde"],
  "Yükselen gerilim": ["karakter harekete geçer, tempo artar", "ilk engel karşısında zorlanma", "gerilimi büyüten bir ayrıntı", "karakter ile karşıt güç aynı kadrajda", "kaçış ya da arayış anı"],
  "Doruk": ["en büyük yüzleşme başlar", "ağır çekimde kritik an", "karakterin kararlı bakışı", "çatışmanın sonucunu belirleyen hareket"],
  "Çözülme": ["fırtına sonrası sakinlik", "karakter değişmiş olarak çevresine bakar", "hikâyeyi bağlayan son ayrıntı", "kamera geri çekilir, kapanış görüntüsü"],
  "Giriş": ["konunun geçtiği yerin havadan görünümü", "konuyu simgeleyen ayrıntı", "hikâyenin ana kişisi iş başında", "mekânda gündelik hayatın akışı"],
  "klip:Giriş": ["şarkının dünyasını açan geniş görüntü", "sanatçının ışıkta beliren silüeti", "ritmi taşıyan görsel motif", "ilk notayla açılan gözler"],
  "Bağlam": ["tarihi ya da toplumsal arka planı gösteren mekân", "yerel hayattan bir an", "eski bir fotoğraf ya da nesne", "insanlar ve çevre"],
  "Derinleşme": ["tanığın yüzü, konuşurken", "çalışan eller, yakın plan", "süreci gösteren adım", "kanıt niteliğinde ayrıntı", "zorluk ya da çatışma anı"],
  "Dönüm noktası": ["keşif ya da kilit an", "tepkinin görüldüğü yüz"],
  "Sonuç": ["bugünkü durum, geniş açı", "geleceğe bakan son görüntü"],
  "Kanca": ["şaşırtıcı ilk görüntü", "ürüne ait merak uyandıran ayrıntı"],
  "Sorun": ["kullanıcının yaşadığı sıkıntı", "sıkıntının yüzdeki ifadesi"],
  "Ürün": ["ürünün kahraman çekimi", "ürün kullanımda", "öne çıkan özellik ayrıntısı", "ürünle mutlu kullanıcı"],
  "Çağrı": ["logo ve slogan ile ürün"],
  "Kıta": ["sanatçı şarkıya başlar", "hikâyeyi anlatan sahne", "duygusal yakın plan"],
  "Nakarat": ["enerjik performans, geniş açı", "dans ya da hareket patlaması", "ışık ve renk zirvesi"],
  "Köprü": ["farklı bir görsel dünyaya geçiş", "sessiz, düşünceli an"],
  "Final nakarat": ["en görkemli performans", "son poz ve ışıkların sönmesi"],
  "Neden önemli": ["konunun hayattaki karşılığı", "merak uyandıran soru anı"],
  "Temel kavramlar": ["kavramı somutlaştıran nesne", "şema gibi anlatan sade görüntü", "örnek uygulama"],
  "Adım adım": ["ilk adım, eller yakın plan", "ikinci adım", "sonucu gösteren ayrıntı"],
  "Sık hatalar": ["yanlış yapılan uygulama", "doğrusu ile karşılaştırma"],
  "Özet": ["öğrenilenleri toparlayan görüntü"],
  "Yola çıkış": ["çanta hazırlanıyor", "yola çıkış, kapıdan çıkan adımlar"],
  "Varış": ["varış yerinin havadan görünümü", "ilk izlenim, şaşkın bakış"],
  "Keşif": ["dar sokaklarda yürüyüş", "yerel bir lezzet yakın plan", "yerel insanlarla an", "saklı bir köşe"],
  "Unutulmaz an": ["manzaraya karşı ağır çekim an", "mutluluk dolu yüz"],
  "Dönüş": ["gün batımında son bakış", "yol kenarından uzaklaşan kamera"],
};


/** Bölümün i. çekimine özgü an (perde adının başı eşleşir; yoksa özet). */
/** Aynı an ikinci kez geçtiğinde "tekrar" yazmak yerine çekimi farklılaştıran ifade eklenir. */
const ACI_FARKI = ["başka bir açıdan", "hareket hâlinde", "karşı açıdan", "ışığın değiştiği anda", "daha uzaktan", "sessizce yaklaşırken"];
function anIfadesi(bolumAd: string, ozet: string, i: number, tur?: string): string {
  const anahtarlar = Object.keys(ANLAR);
  const anahtar = (tur && anahtarlar.find((k) => k.startsWith(`${tur}:`) && bolumAd.startsWith(k.slice(tur.length + 1)))) || anahtarlar.find((k) => !k.includes(":") && bolumAd.startsWith(k));
  const l = ANLAR[anahtar ?? ""];
  if (!l?.length) return ozet.replace(/\.$/, "").toLocaleLowerCase("tr");
  const kat = Math.floor(i / l.length);
  return `${l[i % l.length]}${kat ? `, ${ACI_FARKI[(kat - 1 + (i % l.length)) % ACI_FARKI.length]}` : ""}`;
}

/** Bölüme ait çekim taslakları (bölüm süresine göre). `n` verilirse o kadar çekim. */
export function bolumCekimleri(bolumAd: string, ozet: string, sablon: { boylar: CekimBoy[]; kameralar: string[] }, logline: string, hedefSn: number, ortCekim: number, n?: number, tur?: FilmTur, bas = 0): FilmCekim[] {
  const adet = n ?? Math.max(1, Math.round(hedefSn / ortCekim));
  const sure = Math.max(4, Math.min(10, Math.round(hedefSn / adet)));
  return Array.from({ length: adet }, (_, i) => {
    const boy = sablon.boylar[i % sablon.boylar.length], kamera = sablon.kameralar[i % sablon.kameralar.length];
    return {
      id: fId("ck"), baslik: `${bolumAd} · ${i + 1}`, boy, kamera, sure, elementler: [], surekli: i > 0, takes: [],
      // Hikâye cümlesi istemde tekrar edilmez; modele giden istem bağlamı cekimIstemi ekler.
      istem: `${BOY_IFADE[boy]}: ${anIfadesi(bolumAd, ozet, i + bas, tur)}.`,
    };
  });
}

/**
 * Deterministik plan: türün perde yapısını hedef süreye oranlar.
 * Uzun filmlerde (> `CEKIM_SINIR` çekim) her bölüm ilk 8 çekimle başlar; kalanı istenince planlanır.
 */
export const BOLUM_ILK_CEKIM = 8;
export function planOlustur(o: { logline: string; tur: FilmTur; hedefDk: number }): FilmBolum[] {
  const t = turBul(o.tur);
  const toplam = o.hedefDk * 60;
  // Uzun filmlerde perdeler tekrarlanan bölümlere bölünür (her biri en çok ~6 dk)
  const tekrar = Math.max(1, Math.ceil(toplam / (t.bolumler.length * 360)));
  const bolumler: FilmBolum[] = [];
  for (const b of t.bolumler) {
    for (let k = 0; k < tekrar; k++) {
      const hedefSn = Math.round((toplam * b.oran) / tekrar);
      const ad = tekrar > 1 ? `${b.ad} · ${k + 1}` : b.ad;
      const tam = Math.max(1, Math.round(hedefSn / t.ortCekim));
      bolumler.push({ id: fId("bl"), baslik: ad, ozet: b.ozet, anlatim: "", hedefSn, acik: bolumler.length === 0,
        cekimler: bolumCekimleri(ad, b.ozet, b, o.logline, hedefSn, t.ortCekim, Math.min(tam, BOLUM_ILK_CEKIM), o.tur) });
    }
  }
  return bolumler;
}

export const cekimSn = (l: FilmCekim[]) => l.reduce((a, c) => a + c.sure, 0);
export const bolumPlanli = (b: FilmBolum) => cekimSn(b.cekimler);
export const filmSn = (l: FilmBolum[]) => l.reduce((a, b) => a + bolumPlanli(b), 0);
export const filmHedefSn = (l: FilmBolum[]) => l.reduce((a, b) => a + b.hedefSn, 0);

export function sureYaz(sn: number): string {
  const s = Math.round(sn);
  if (s < 60) return `${s} sn`;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h} sa ${m} dk` : r ? `${m} dk ${r} sn` : `${m} dk`;
}
const zk = (sn: number) => { const s = Math.round(sn), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(r).padStart(2, "0")}`; };

/** YouTube bölüm listesi (ilk satır 0:00 olmalı). */
export function youtubeBolumleri(l: FilmBolum[]): string {
  let t = 0;
  return l.map((b) => { const s = `${zk(t)} ${b.baslik}`; t += bolumPlanli(b); return s; }).join("\n");
}

/** Çekim listesi CSV (yapım ekibi için). */
export function cekimListesiCsv(l: FilmBolum[], modelVarsayilan: string): string {
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const satir = [["Bölüm", "No", "Başlangıç", "Süre (sn)", "Boy", "Kamera", "Model", "Açıklama"].map(q).join(",")];
  let t = 0;
  for (const b of l) b.cekimler.forEach((c, i) => {
    satir.push([b.baslik, i + 1, zk(t), c.sure, CEKIM_BOYLARI.find((x) => x.id === c.boy)?.ad ?? c.boy, FILM_KAMERALAR.find((x) => x.id === c.kamera)?.ad ?? c.kamera, c.model ?? modelVarsayilan, c.istem].map(q).join(","));
    t += c.sure;
  });
  return "﻿" + satir.join("\n");
}

/** Modele giden çekim istemi. */
export function cekimIstemi(c: FilmCekim, o: { stil: string; elementAdlari: string[]; lens?: string; bolum?: FilmBolum; hikaye?: string }): string {
  const boy = CEKIM_BOYLARI.find((x) => x.id === c.boy)?.en ?? "";
  const kam = FILM_KAMERALAR.find((x) => x.id === c.kamera)?.en ?? "";
  const el = o.elementAdlari.map((a) => `@${a}`).join(" ");
  const b = o.bolum;
  const ortam = [b?.mekan?.trim() && `Location: ${b.mekan.trim()}`, ZAMANLAR.find((x) => x.id === b?.zaman)?.en, HAVALAR.find((x) => x.id === b?.hava)?.en].filter(Boolean).join(", ");
  return `${el ? `${el} ` : ""}${c.istem} ${boy}, ${kam}.${ortam ? ` ${ortam}.` : ""}${o.stil ? ` Visual style: ${o.stil}.` : ""}${o.lens ? ` ${o.lens}.` : ""}${o.hikaye ? ` Story context: ${o.hikaye.trim().slice(0, 240)}` : ""} Keep characters, wardrobe and lighting consistent with the rest of the film.`;
}
