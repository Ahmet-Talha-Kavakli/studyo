/**
 * Sohbetin v4 araç sonuçlarının ortak tipleri (sunucu ve istemci birlikte kullanır; sunucuya özel içe aktarma yok):
 * tuval, veri analizi, test, bilgi kartları, zamanlanmış görev, geçmiş sohbet araması ve sesli özet.
 */
export type TuvalTip = "belge" | "kod";
export type TuvalSonucu = { tur: "tuval"; id: string; baslik: string; tip: TuvalTip; dil?: string; surum: number; onizleme: string; kelime: number };

export type Hucre = string | number | boolean | null;
export type AnalizTablo = { ad?: string; sutunlar: string[]; satirlar: Hucre[][]; toplam?: number };
export type GrafikTur = "cubuk" | "cizgi" | "alan" | "pasta" | "sacilim";
export type AnalizGrafik = { tur: GrafikTur; baslik?: string; etiketler: string[]; seriler: { ad: string; veriler: number[] }[]; xAd?: string; yAd?: string };
export type AnalizSonucu = { tur: "analiz"; aciklama?: string; kod: string; tablolar: AnalizTablo[]; grafikler: AnalizGrafik[]; deger?: string; loglar?: string[]; hata?: string; sure?: number; kaynaklar?: string[] };

export type SoruTur = "coktan" | "dogru-yanlis" | "bosluk" | "acik";
export type TestSorusu = { tur: SoruTur; soru: string; secenekler?: string[]; dogru: string; aciklama?: string; ipucu?: string };
export type TestSonucu = { tur: "test"; baslik: string; sorular: TestSorusu[] };
export type KartlarSonucu = { tur: "kartlar"; baslik: string; kartlar: { on: string; arka: string }[] };

export type GorevSonucu = { tur: "gorev"; id: string; ad: string; istem: string; aciklama: string; sonraki?: number; durum: "acik" | "duraklatildi" };
export type SohbetlerSonucu = { tur: "sohbetler"; sorgu: string; sonuclar: { id: string; baslik: string; parca: string; mesajId?: string; zaman: number }[] };
export type SesliOzetSonucu = { tur: "sesliOzet"; baslik: string; satirlar: { k: "A" | "B"; metin: string }[] };

/** v5: gündelik araçlar (web okuma, hesap, kur, hava, takvim, karekod, izleme) ve ses dökümü. */
export type SayfalarSonucu = { tur: "sayfalar"; gezinti: boolean; atlanan?: number; sayfalar: { url: string; baslik: string; ozet: string; kelime: number; fiyat?: string }[]; hatalar: { url: string; hata: string }[] };
export type HesapSonucu = { tur: "hesap"; satirlar: { ifade: string; sonuc?: string; hata?: string; kategori?: string }[] };
export type KurSonucu = { tur: "kur"; tarih: string; madenZamani?: string; kaynak: string; kalemler: { kod: string; ad: string; alis?: number; satis?: number; efektifSatis?: number; birim: string; not?: string }[]; ceviri?: { miktar: number; kaynak: string; hedef: string; sonuc: number }; hatalar: string[] };
export type HavaSonucu = {
  tur: "hava"; kaynak: string; yer: { ad: string; bolge?: string; ulke?: string; enlem: number; boylam: number };
  simdi: { sicaklik: number; hissedilen: number; nem: number; ruzgar: number; kod: number; durum: string; gunduz: boolean; zaman: string };
  saatlik: { saat: string; sicaklik: number; yagisOlasiligi: number | null; kod: number }[];
  gunler: { tarih: string; enYuksek: number; enDusuk: number; yagisOlasiligi: number | null; yagis: number; ruzgar: number; kod: number; durum: string; gunDogumu?: string; gunBatimi?: string }[];
};
export type TakvimEtkinligi = { baslik: string; baslangic: string; bitis?: string; yer?: string; aciklama?: string; tekrar?: "yok" | "gunluk" | "haftalik" | "aylik" | "yillik"; tekrarSayisi?: number; hatirlatma?: number };
export type TakvimSonucu = { tur: "takvim"; ad: string; etkinlikler: TakvimEtkinligi[]; ics: string };
export type KarekodSonucu = { tur: "karekod"; tip: string; icerik: string; etiket: string; svg: string; boyut: number };
export type IzlemeSonucu = { tur: "izleme"; id: string; ad: string; aciklama: string; aralik: string; kosulTur: string };
export type DokumSonucu = { tur: "dokum"; id: string; baslik: string; sure: number; konusmaci: number; ozet: string; eylem: number };

export type EkSonuc = TuvalSonucu | AnalizSonucu | TestSonucu | KartlarSonucu | GorevSonucu | SohbetlerSonucu | SesliOzetSonucu
  | SayfalarSonucu | HesapSonucu | KurSonucu | HavaSonucu | TakvimSonucu | KarekodSonucu | IzlemeSonucu | DokumSonucu;

/** Görsel düzenleme isteği (görselin üstündeki Düzenle paneli). */
export type GorselIslemTur = "duzenle" | "maske" | "arkaplan" | "genislet" | "sil";
export type DuzenleIstegi = { gorsel: string; maske?: string; islem: GorselIslemTur };

/** Türkçe karakterleri sadeleştirip küçültür (arama ve eşleştirme). */
export function katla(s: string): string {
  return s.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a").replace(/î/g, "i").replace(/û/g, "u");
}

/** Arama sorgusu: "tam ifade", -hariç, kelimeler. */
export type Sorgu = { ifadeler: string[]; kelimeler: string[]; haric: string[] };
export function sorguCoz(q: string): Sorgu {
  const ifadeler: string[] = [], kelimeler: string[] = [], haric: string[] = [];
  const kalan = q.replace(/"([^"]{2,120})"/g, (_, x: string) => { ifadeler.push(katla(x.trim())); return " "; });
  for (const p of kalan.split(/\s+/)) {
    if (!p) continue;
    if (p.startsWith("-") && p.length > 2) haric.push(katla(p.slice(1)));
    else if (p.length >= 2 || /\d/.test(p)) kelimeler.push(katla(p));
  }
  return { ifadeler, kelimeler, haric };
}
export const sorguBos = (s: Sorgu) => !s.ifadeler.length && !s.kelimeler.length;
