/**
 * İzleme görevlerinin istemci ve sunucu ortak tanımları (sunucuya özel içe aktarma yok).
 */
export const IZLEME_SINIRI = 20;
export type Islec = "alt" | "ust" | "degisim";
export type IzlemeKosulu =
  | { tur: "sayfa"; adres: string; kip: "yeni-oge" | "degisim" | "kelime"; kelime?: string; odak?: string }
  | { tur: "deger"; adres: string; islec: Islec; esik?: number; etiket?: string }
  | { tur: "kur"; kod: string; islec: Islec; esik: number }
  | { tur: "hava"; yer: string; olcut: "yagis" | "sicaklik-alt" | "sicaklik-ust" | "ruzgar" | "kar"; esik: number; gun: number }
  | { tur: "yapay"; soru: string; adres?: string; model: string };
export type IzlemeTur = IzlemeKosulu["tur"];
export type IzlemeKontrolu = { zaman: number; sonuc: "tetiklendi" | "tutmadi" | "ilk" | "hata"; deger?: string; not?: string; kredi?: number };
export type Izleme = {
  id: string; ad: string; kosul: IzlemeKosulu; aralik: number; tekrar: "bir-kez" | "her-seferinde"; durum: "acik" | "duraklatildi";
  olusturma: number; sonraki: number; sonKontrol?: number; kontrol: number; tetiklenme: number; sonTetik?: number; sonDeger?: string; sonHata?: string;
  ustUsteHata?: number; duraklatmaNedeni?: string; okunmamis?: number; sohbet?: string;
  gecmis: IzlemeKontrolu[];
  /** Denetimler arası durum: görülen öğeler, sayfa özeti, son değer, koşul şu an tutuyor mu. */
  durumVerisi?: { goruldu?: string[]; ozet?: string; satirlar?: string[]; deger?: number; tuttu?: boolean; gun?: string };
};
export type IzlemeOnizleme = { ok: true; deger: string; kaynak?: string; simdi: boolean; mesaj?: string } | { ok: false; hata: string };

export const IZLEME_TURLERI: { id: IzlemeTur; ad: string; alt: string }[] = [
  { id: "sayfa", ad: "Sayfada yenilik", alt: "Duyuru, ilan, haber ya da sayfa değişince" },
  { id: "deger", ad: "Fiyat ya da değer", alt: "Sayfadaki fiyat eşiğin altına düşünce" },
  { id: "kur", ad: "Döviz ve altın", alt: "Dolar, euro, gram altın eşiği geçince" },
  { id: "hava", ad: "Hava durumu", alt: "Yarın yağmur, don ya da fırtına varsa" },
  { id: "yapay", ad: "Serbest koşul", alt: "Yapay zekâ kaynağı okuyup karar verir" },
];
export const ARALIKLAR: { dk: number; ad: string }[] = [
  { dk: 15, ad: "15 dakikada bir" }, { dk: 30, ad: "30 dakikada bir" }, { dk: 60, ad: "Saatte bir" }, { dk: 180, ad: "3 saatte bir" },
  { dk: 360, ad: "6 saatte bir" }, { dk: 720, ad: "12 saatte bir" }, { dk: 1440, ad: "Günde bir" },
];
export const KUR_SECENEKLERI: { kod: string; ad: string }[] = [
  { kod: "USD", ad: "ABD doları" }, { kod: "EUR", ad: "Euro" }, { kod: "GBP", ad: "İngiliz sterlini" }, { kod: "CHF", ad: "İsviçre frangı" },
  { kod: "GRAM-ALTIN", ad: "Gram altın" }, { kod: "GRAM-GUMUS", ad: "Gram gümüş" }, { kod: "ONS-ALTIN", ad: "Ons altın" },
];
export const HAVA_OLCUTLERI: { id: Extract<IzlemeKosulu, { tur: "hava" }>["olcut"]; ad: string; birim: string }[] = [
  { id: "yagis", ad: "Yağış olasılığı en az", birim: "yüzde" }, { id: "sicaklik-alt", ad: "En düşük sıcaklık en çok", birim: "derece" },
  { id: "sicaklik-ust", ad: "En yüksek sıcaklık en az", birim: "derece" }, { id: "ruzgar", ad: "Rüzgâr en az", birim: "km/sa" }, { id: "kar", ad: "Kar yağışı", birim: "" },
];

export const aralikMetni = (dk: number) => ARALIKLAR.find((a) => a.dk === dk)?.ad ?? (dk % 1440 === 0 ? `${dk / 1440} günde bir` : dk % 60 === 0 ? `${dk / 60} saatte bir` : `${dk} dakikada bir`);
const sayiYaz = (n?: number) => (n === undefined ? "" : new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 4 }).format(n));
const alanAdi = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
const GUN = ["bugün", "yarın", "2 gün sonra", "3 gün sonra", "4 gün sonra", "5 gün sonra", "6 gün sonra"];

/** Koşulun okunur Türkçe tarifi ("dolar 45 TL altına düşünce"). */
export function izlemeAciklamasi(k: IzlemeKosulu): string {
  switch (k.tur) {
    case "sayfa": return k.kip === "yeni-oge" ? `${alanAdi(k.adres)} sayfasında yeni öğe çıkınca${k.odak ? ` ("${k.odak}" içeren)` : ""}` : k.kip === "kelime" ? `${alanAdi(k.adres)} sayfasında "${k.kelime}" görününce` : `${alanAdi(k.adres)} sayfası değişince${k.odak ? ` ("${k.odak}" geçen kısım)` : ""}`;
    case "deger": return k.islec === "degisim" ? `${alanAdi(k.adres)} sayfasındaki ${k.etiket ? `"${k.etiket}" değeri` : "fiyat"} değişince` : `${alanAdi(k.adres)} sayfasındaki ${k.etiket ? `"${k.etiket}" değeri` : "fiyat"} ${sayiYaz(k.esik)} ${k.islec === "alt" ? "altına düşünce" : "üstüne çıkınca"}`;
    case "kur": { const ad = KUR_SECENEKLERI.find((x) => x.kod === k.kod)?.ad ?? k.kod; return k.islec === "degisim" ? `${ad} yüzde ${sayiYaz(k.esik)} oynayınca` : `${ad} ${sayiYaz(k.esik)} ${k.kod === "ONS-ALTIN" ? "dolar" : "TL"} ${k.islec === "alt" ? "altına düşünce" : "üstüne çıkınca"}`; }
    case "hava": { const o = HAVA_OLCUTLERI.find((x) => x.id === k.olcut)!; return k.olcut === "kar" ? `${k.yer} için ${GUN[k.gun] ?? `${k.gun} gün sonra`} kar bekleniyorsa` : `${k.yer} için ${GUN[k.gun] ?? `${k.gun} gün sonra`} ${o.ad.toLocaleLowerCase("tr")} ${o.birim === "yüzde" ? `yüzde ${k.esik}` : `${k.esik} ${o.birim}`} olursa`; }
    case "yapay": return k.soru.length > 90 ? `${k.soru.slice(0, 88)}…` : k.soru;
  }
}
