/**
 * Vayra Build Büyüme: e-posta otomasyon akışları (Klaviyo Flows ve Mailchimp Customer Journeys karşılığı).
 * Tipler, hazır akış şablonları ve saf yardımcılar (istemci + sunucu). Çalıştırıcı: buyumeAkis.ts (sunucu).
 *
 * Akış: tetik (kim, ne zaman girer) + adımlar (bekle, koşul, e-posta, etiket). Koşul adımı iki dala ayrılır; dal bitince
 * akış koşuldan sonraki adımdan sürer. Konum "2.e.0" biçiminde yol: 2. adımın evet dalının ilk adımı.
 */
import { dilimSaat, dilimTarih, dilimZaman } from "./bolge";
import type { Blok } from "./buyumeEkTipler";

/* ── Tetikler ── */
export type TetikTur = "hosgeldin" | "siparis" | "terk-sepet" | "dogum-gunu" | "geri-kazan" | "randevu" | "etiket";
export const TETIKLER: { id: TetikTur; ad: string; alt: string; kaynak: string }[] = [
  { id: "hosgeldin", ad: "Hoş geldin", alt: "Bültene abone olan, siteye üye olan ya da onay kutulu form gönderen", kaynak: "İşletme aboneleri, üyeler ve formlar" },
  { id: "siparis", ad: "Sipariş sonrası", alt: "İlk ya da her ödenmiş siparişten sonra", kaynak: "Vayra Ödeme canlı siparişleri" },
  { id: "terk-sepet", ad: "Terk edilen sepet", alt: "Ödeme sayfasını açıp tamamlamayan müşteri", kaynak: "İşletme mağazası" },
  { id: "dogum-gunu", ad: "Doğum günü", alt: "Doğum gününde ya da birkaç gün önce", kaynak: "Kişinin doğum günü alanı" },
  { id: "geri-kazan", ad: "Geri kazanma", alt: "Son siparişinden bu yana uzun süre gelmeyen müşteri", kaynak: "Sipariş geçmişi" },
  { id: "randevu", ad: "Randevu sonrası", alt: "Randevusuna gelen müşteriye teşekkür ve yorum isteği", kaynak: "İşletme randevuları" },
  { id: "etiket", ad: "Özel: etiket eklenince", alt: "Kişiye seçtiğin etiket eklendiğinde", kaynak: "Kişiler" },
];
export const tetikAdi = (t: TetikTur) => TETIKLER.find((x) => x.id === t)?.ad ?? "Tetik";
export type HosgeldinKaynak = "abone" | "uye" | "form";
export type TetikAyar = {
  /** Hoş geldin: hangi kaynaktan gelenler (boş: hepsi). */ kaynak?: HosgeldinKaynak[];
  /** Sipariş: yalnız ilk sipariş. */ ilk?: boolean;
  /** Sipariş: en az tutar (TL). */ enAzTutar?: number;
  /** Doğum günü: kaç gün önce (0 ile 14). */ gunOnce?: number;
  /** Geri kazanma: kaç gündür sipariş yok (30 ile 365). */ gun?: number;
  /** Randevu: yalnız bu hizmet (boş: hepsi). */ hizmet?: string;
  /** Özel: bu etiket eklenince. */ etiket?: string;
  /** Doğum günü ve geri kazanma: girişin yapıldığı saat (Türkiye). */ saat?: string;
};

/* ── Adımlar ── */
export type KosulTur = "siparis-verdi" | "acti" | "tikladi" | "etiket-var" | "harcama" | "siparis-sayisi" | "izin-onay";
export const KOSULLAR: { id: KosulTur; ad: string; alt: string; deger?: "sayi" | "etiket" }[] = [
  { id: "siparis-verdi", ad: "Akışa girdikten sonra sipariş verdi", alt: "Ödenmiş canlı sipariş" },
  { id: "tikladi", ad: "Akıştaki bir e-postada tıkladı", alt: "En güvenilir ilgi işareti" },
  { id: "acti", ad: "Akıştaki bir e-postayı açtı", alt: "Apple Mail açılmaları olduğundan yüksek gösterebilir" },
  { id: "etiket-var", ad: "Etiketi var", alt: "Kişide seçtiğin etiket", deger: "etiket" },
  { id: "harcama", ad: "Toplam harcaması en az", alt: "TL cinsinden", deger: "sayi" },
  { id: "siparis-sayisi", ad: "Sipariş sayısı en az", alt: "Ödenmiş sipariş", deger: "sayi" },
  { id: "izin-onay", ad: "Ticari ileti onayı var", alt: "İzni belirsiz kişileri ayırmak için" },
];
export type GonderimSaati = "hemen" | "kisisel" | "sabit";
export const GONDERIM_SAATLERI: { id: GonderimSaati; ad: string; alt: string }[] = [
  { id: "hemen", ad: "Adıma gelince", alt: "Sessiz saatlere denk gelirse sabahı bekler" },
  { id: "kisisel", ad: "Kişinin en iyi saatinde", alt: "Kişinin e-posta açtığı saat; verisi yoksa projenin en iyi saati" },
  { id: "sabit", ad: "Belirli bir saatte", alt: "Her gün aynı saat (Türkiye)" },
];
export type AdimBekle = { id: string; tur: "bekle"; sure: number; birim: "dakika" | "saat" | "gun" };
export type AdimEposta = { id: string; tur: "eposta"; ad: string; konu: string; onMetin: string; bloklar: Blok[]; saat: GonderimSaati; sabitSaat?: string; kupon?: string };
export type AdimKosul = { id: string; tur: "kosul"; kosul: KosulTur; deger?: string; evet: Adim[]; hayir: Adim[] };
export type AdimEtiket = { id: string; tur: "etiket"; etiket: string };
export type Adim = AdimBekle | AdimEposta | AdimKosul | AdimEtiket;
export const ADIM_TURLERI: { id: Adim["tur"]; ad: string; alt: string }[] = [
  { id: "eposta", ad: "E-posta", alt: "Markalı ileti, izleme ve çıkma bağlantısıyla" },
  { id: "bekle", ad: "Bekle", alt: "Dakika, saat ya da gün" },
  { id: "kosul", ad: "Koşul", alt: "Evet ve hayır diye iki dala ayır" },
  { id: "etiket", ad: "Etiket ekle", alt: "Kişiye etiket ekle; segmentlerde kullanılır" },
];
export const AKIS_ETIKETLERI = ["{ad}", "{site}", "{kupon}", "{sepet}", "{tutar}", "{siparis_no}", "{hizmet}", "{yorum_baglantisi}"] as const;

export type AkisDurum = "taslak" | "acik" | "durdu";
export type Akis = {
  id: string; ad: string; tetik: TetikTur; ayar: TetikAyar; adimlar: Adim[]; durum: AkisDurum;
  /** İzin kuralı: yalnız onaylılar ya da (sahip beyanıyla) izni belirsizler de. Reddedenler ve çıkanlar hiçbir zaman. */
  izin: "onayli" | "belirsiz-dahil"; izinBeyan?: number;
  /** Sipariş verirse akıştan çık (terk edilen sepet ve geri kazanmada önerilir). */ siparisCikis: boolean;
  /** Akıllı gönderim: son 16 saatte bizden pazarlama e-postası alana gönderme (Klaviyo Smart Sending karşılığı). */ akilli: boolean;
  /** 21:00 ile 09:00 arası gönderme; sabahı bekle. */ sessiz: boolean;
  /** Aynı kişi en erken kaç gün sonra yeniden girebilir (0: tetik olayı başına bir kez). */ yeniden: number;
  /** Açılırken son 7 günün olaylarını da kat. */ gecmis: boolean;
  acilis?: number; olusturma: number; guncelleme: number;
};
export const AKIS_SINIRI = 30;

/* ── Çalışma durumu (ayrı dosya: .veri/build/buyume-akis/<proje>.json) ── */
export type AkisKayit = {
  id: string; akis: string; e: string; ad: string; giris: number; konum: string | null; sonraki: number;
  durum: "aktif" | "bitti" | "cikti"; neden?: string; anahtar: string; bekliyor?: boolean;
  bag?: Record<string, string>; log: { z: number; olay: string }[];
};
export type AkisGonderim = {
  n: number; akis: string; adim: string; kayit: string; e: string; z: number; konu: string;
  d: "gonderildi" | "hata" | "atlandi"; h?: string; a?: number; t?: number; tl?: number[]; c?: number; baglantilar: string[];
};
export type AdimSayac = { gecen: number; gonderilen: number; acilan: number; tiklayan: number; cikis: number; hata: number; atlanan: number; evet: number; hayir: number };
export type AkisIstatistik = { giren: number; aktif: number; biten: number; cikan: number; gonderilen: number; acilan: number; tiklayan: number; cikis: number; hata: number; atlanan: number; siparis: number; ciro: number; adim: Record<string, AdimSayac> };
export const bosSayac = (): AdimSayac => ({ gecen: 0, gonderilen: 0, acilan: 0, tiklayan: 0, cikis: 0, hata: 0, atlanan: 0, evet: 0, hayir: 0 });
export const bosIstatistik = (): AkisIstatistik => ({ giren: 0, aktif: 0, biten: 0, cikan: 0, gonderilen: 0, acilan: 0, tiklayan: 0, cikis: 0, hata: 0, atlanan: 0, siparis: 0, ciro: 0, adim: {} });
export type AkisDosya = { kayitlar: AkisKayit[]; gonderimler: AkisGonderim[]; sayac: number; gorulen: Record<string, number>; istatistik: Record<string, AkisIstatistik>; son?: number; uyari?: string };
export const bosAkisDosya = (): AkisDosya => ({ kayitlar: [], gonderimler: [], sayac: 0, gorulen: {}, istatistik: {} });
/** İstemciye giden akış: istatistik ve son kayıtlar ile. */
export type AkisIstemci = Akis & { ist: AkisIstatistik; sonKayitlar: Pick<AkisKayit, "id" | "e" | "ad" | "giris" | "durum" | "neden" | "konum" | "sonraki">[] };

/* ── Konum yolu ── */
type Parca = number | "e" | "h";
const parcala = (k: string): Parca[] => k.split(".").map((x) => (x === "e" || x === "h" ? x : Number(x)));
function listeAl(kok: Adim[], yol: Parca[]): Adim[] | null {
  let l: Adim[] = kok;
  for (let i = 0; i < yol.length; i += 2) {
    const a = l[yol[i] as number];
    if (!a || a.tur !== "kosul") return null;
    l = yol[i + 1] === "e" ? a.evet : a.hayir;
  }
  return l;
}
export function adimAl(kok: Adim[], konum: string | null): Adim | null {
  if (konum === null) return null;
  const y = parcala(konum);
  const l = listeAl(kok, y.slice(0, -1));
  return l?.[y[y.length - 1] as number] ?? null;
}
/** Adım bitince gidilecek konum (dal biterse koşuldan sonraki adım; akış biterse null). */
export function sonrakiKonum(kok: Adim[], konum: string): string | null {
  const y = parcala(konum);
  const i = y[y.length - 1] as number, ust = y.slice(0, -1);
  const l = listeAl(kok, ust);
  if (l && i + 1 < l.length) return [...ust, i + 1].join(".");
  if (!ust.length) return null;
  return sonrakiKonum(kok, ust.slice(0, -1).join("."));
}
/** Koşul adımından dala giriş (dal boşsa koşuldan sonrası). */
export function dalaGir(kok: Adim[], konum: string, evet: boolean): string | null {
  const a = adimAl(kok, konum);
  if (!a || a.tur !== "kosul") return sonrakiKonum(kok, konum);
  return (evet ? a.evet : a.hayir).length ? `${konum}.${evet ? "e" : "h"}.0` : sonrakiKonum(kok, konum);
}
export const ilkKonum = (kok: Adim[]) => (kok.length ? "0" : null);
/** Ağaçtaki bütün adımlar (düz liste, sırayla). */
export function butunAdimlar(l: Adim[]): Adim[] { return l.flatMap((a) => (a.tur === "kosul" ? [a, ...butunAdimlar(a.evet), ...butunAdimlar(a.hayir)] : [a])); }
export const bekleMs = (a: AdimBekle) => a.sure * (a.birim === "dakika" ? 60_000 : a.birim === "saat" ? 3600_000 : 864e5);
export const bekleMetni = (a: Pick<AdimBekle, "sure" | "birim">) => `${a.sure} ${a.birim === "dakika" ? "dakika" : a.birim === "saat" ? "saat" : "gün"}`;
export function kosulMetni(a: Pick<AdimKosul, "kosul" | "deger">): string {
  const k = KOSULLAR.find((x) => x.id === a.kosul);
  if (!k) return "Koşul";
  if (a.kosul === "etiket-var") return `"${a.deger || "etiket"}" etiketi var`;
  if (a.kosul === "harcama") return `Toplam harcaması en az ${Number(a.deger || 0).toLocaleString("tr-TR")} TL`;
  if (a.kosul === "siparis-sayisi") return `En az ${a.deger || 1} siparişi var`;
  return k.ad;
}
export function tetikOzeti(a: Pick<Akis, "tetik" | "ayar">): string {
  const s = a.ayar;
  switch (a.tetik) {
    case "hosgeldin": return s.kaynak?.length ? `${s.kaynak.map((k) => ({ abone: "Bülten abonesi", uye: "Yeni üye", form: "Onaylı form" })[k]).join(", ")} olunca` : "Abone, üye ya da onaylı form gönderen olunca";
    case "siparis": return `${s.ilk ? "İlk" : "Her"} ödenmiş siparişten sonra${s.enAzTutar ? `, en az ${s.enAzTutar.toLocaleString("tr-TR")} TL` : ""}`;
    case "terk-sepet": return "Ödeme sayfasını açıp 30 dakikada tamamlamayınca";
    case "dogum-gunu": return `${s.gunOnce ? `Doğum gününden ${s.gunOnce} gün önce` : "Doğum gününde"}, saat ${s.saat || "10:00"}`;
    case "geri-kazan": return `${s.gun || 90} gündür sipariş vermeyen müşteri, saat ${s.saat || "11:00"}`;
    case "randevu": return `Randevusuna geldikten sonra${s.hizmet ? " (seçilen hizmet)" : ""}`;
    case "etiket": return `"${s.etiket || "etiket"}" etiketi eklenince`;
  }
}

/* ── Gönderim saati yardımcıları (işletmenin saat dilimi; yaz saati dahil) ── */
const VARS_TZ = "Europe/Istanbul";
export const trSaati = (z: number, tz = VARS_TZ) => Number(dilimSaat(z, tz).slice(0, 2));
/** z'den sonraki ilk SS:DD anı (verilen saat diliminde). */
export function sonrakiSaat(z: number, ss: string, tz = VARS_TZ): number {
  const bugun = dilimTarih(z, tz);
  const aday = dilimZaman(bugun, ss, tz);
  return aday > z ? aday : dilimZaman(dilimTarih(aday + 864e5 + 3600_000, tz), ss, tz);
}
/** Sessiz saatler (21:00 ile 09:00, alıcının değil işletmenin saatine göre): içindeyse sabah 09:00'a kaydırır. */
export function sessizKaydir(z: number, tz = VARS_TZ): number { const h = trSaati(z, tz); return h >= 21 || h < 9 ? sonrakiSaat(z, "09:00", tz) : z; }
export const saatYaz = (h: number) => `${String(h).padStart(2, "0")}:00`;

/* ── Akış e-postası kişiselleştirmesi ── */
export type AkisBag = { kupon?: string; sepet?: string; tutar?: string; siparis_no?: string; hizmet?: string; yorum_baglantisi?: string };
/** Akışa özgü etiketleri doldurur ({ad}, {site} ve davet etiketleri e-posta şablonunda doldurulur). */
export const akisDoldur = (s: string, b: AkisBag) => s.replace(/\{(kupon|sepet|tutar|siparis_no|hizmet|yorum_baglantisi)\}/g, (_, k: keyof AkisBag) => b[k] ?? "");
export function akisBloklari(bl: Blok[], b: AkisBag): Blok[] { return bl.map((x) => ({ ...x, metin: x.metin ? akisDoldur(x.metin, b) : x.metin, adres: x.adres ? akisDoldur(x.adres, b) : x.adres })); }

/* ── Hazır akışlar ── */
let sira = 0;
const kid = () => `s${Date.now().toString(36).slice(-5)}${(sira++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const eposta = (ad: string, konu: string, onMetin: string, baslik: string, metin: string, dugme: string, adres: string, kupon?: string): AdimEposta => ({
  id: kid(), tur: "eposta", ad, konu, onMetin, saat: "hemen", kupon,
  bloklar: [{ id: kid(), tur: "baslik", metin: baslik }, { id: kid(), tur: "metin", metin }, { id: kid(), tur: "dugme", metin: dugme, adres }],
});
const bekle = (sure: number, birim: AdimBekle["birim"]): AdimBekle => ({ id: kid(), tur: "bekle", sure, birim });

/** Tetiğe göre hazır akış (Klaviyo ve Mailchimp'in önerilen akışlarının Türkçe karşılığı). site: projenin adresi. */
export function akisSablonu(t: TetikTur, site: string, kupon = ""): Pick<Akis, "ad" | "tetik" | "ayar" | "adimlar" | "siparisCikis" | "yeniden"> {
  const k = kupon || "";
  const kuponSatiri = k ? `\n\nİlk siparişinde **{kupon}** koduyla indirim kazanırsın.` : "";
  switch (t) {
    case "hosgeldin": return { ad: "Hoş geldin serisi", tetik: t, ayar: { kaynak: [] }, siparisCikis: false, yeniden: 0, adimlar: [
      eposta("Hoş geldin", "Hoş geldin {ad}, iyi ki geldin", "Seni neler beklediğini kısaca anlattık", "Aramıza hoş geldin", `Merhaba {ad},\n\n{site} ailesine katıldığın için teşekkürler. Yeniliklerden, kampanyalardan ve yeni ürünlerden ilk sen haberdar olacaksın.${kuponSatiri}`, "Siteye göz at", site, k || undefined),
      bekle(2, "gun"),
      { id: kid(), tur: "kosul", kosul: "siparis-verdi", evet: [{ id: kid(), tur: "etiket", etiket: "hosgeldin-donustu" }], hayir: [
        eposta("En sevilenler", "{ad}, en çok sevilenlere bir bak", "Müşterilerimizin favorileri", "En çok sevilenler", "Merhaba {ad},\n\nHenüz karar vermediysen müşterilerimizin en çok sevdiklerine bir göz at. Bir sorun olursa bu e-postayı yanıtlaman yeterli.", "Favorileri gör", site),
        bekle(3, "gun"),
        eposta("Son hatırlatma", "Aklında bir sorun var mı {ad}?", "Yardım etmek için buradayız", "Sana nasıl yardımcı olabiliriz?", `Merhaba {ad},\n\nSorun ya da merak ettiğin bir şey varsa bize yazabilirsin; aynı gün dönüyoruz.${kuponSatiri}`, "Bize ulaş", site, k || undefined),
      ] },
    ] };
    case "siparis": return { ad: "Sipariş sonrası teşekkür", tetik: t, ayar: { ilk: true }, siparisCikis: false, yeniden: 0, adimlar: [
      bekle(1, "gun"),
      eposta("Teşekkür", "Siparişin için teşekkürler {ad}", "{siparis_no} numaralı siparişin hakkında", "Bizi seçtiğin için teşekkürler", "Merhaba {ad},\n\n**{siparis_no}** numaralı siparişin için teşekkür ederiz. Kullanırken aklına takılan bir şey olursa bu e-postayı yanıtla, hemen yardımcı olalım.", "Siteye dön", site),
      bekle(7, "gun"),
      eposta("Yorum isteği", "{ad}, deneyimini merak ediyoruz", "Birkaç cümle bize çok yardımcı olur", "Siparişin nasıldı?", "Merhaba {ad},\n\nAldığın ürünlerle ilgili deneyimini birkaç cümleyle paylaşırsan hem bize hem diğer müşterilere çok yardımcı olur.", "Yorum yaz", "{yorum_baglantisi}"),
      bekle(21, "gun"),
      { id: kid(), tur: "kosul", kosul: "siparis-sayisi", deger: "2", evet: [], hayir: [
        eposta("Tekrar gel", "{ad}, yeniden görmek isteriz", "Sana özel bir teşekkür", "Yeniden bekleriz", `Merhaba {ad},\n\nİlk siparişinden bu yana yeni ürünler geldi.${k ? "\n\nİkinci siparişinde **{kupon}** kodu senin için geçerli." : ""}`, "Yenilere bak", site, k || undefined),
      ] },
    ] };
    case "terk-sepet": return { ad: "Terk edilen sepet hatırlatması", tetik: t, ayar: {}, siparisCikis: true, yeniden: 7, adimlar: [
      bekle(1, "saat"),
      eposta("Sepet hatırlatması", "{ad}, sepetinde ürünler seni bekliyor", "Ürünlerini senin için ayırdık", "Sepetin hâlâ burada", "Merhaba {ad},\n\nSepetindeki ürünleri ayırdık ama ödeme tamamlanmadı:\n\n{sepet}\n\nToplam: **{tutar}**\n\nÖdemede bir sorun yaşadıysan bu e-postayı yanıtlaman yeterli.", "Alışverişe dön", site),
      bekle(23, "saat"),
      { id: kid(), tur: "kosul", kosul: "tikladi", evet: [], hayir: [
        eposta("İkinci hatırlatma", "Ürünlerin tükenmeden tamamla", "Küçük bir hatırlatma", "Son hatırlatma", `Merhaba {ad},\n\nSepetindeki ürünler stokta kaldığı sürece ayrılmış durumda.${k ? "\n\nSiparişini **{kupon}** koduyla tamamlarsan indirim kazanırsın." : ""}`, "Siparişi tamamla", site, k || undefined),
      ] },
    ] };
    case "dogum-gunu": return { ad: "Doğum günü kutlaması", tetik: t, ayar: { gunOnce: 0, saat: "10:00" }, siparisCikis: false, yeniden: 0, adimlar: [
      eposta("Doğum günü", "İyi ki doğdun {ad}", "Sana küçük bir hediyemiz var", "Doğum günün kutlu olsun", `Merhaba {ad},\n\nYeni yaşının sağlık ve mutluluk getirmesini dileriz.${k ? "\n\nHediyemiz: **{kupon}** kodu bu hafta geçerli." : ""}`, "Hediyeni kullan", site, k || undefined),
    ] };
    case "geri-kazan": return { ad: "Geri kazanma serisi", tetik: t, ayar: { gun: 90, saat: "11:00" }, siparisCikis: true, yeniden: 120, adimlar: [
      eposta("Seni özledik", "{ad}, seni özledik", "Uzun zamandır görüşemedik", "Seni özledik", "Merhaba {ad},\n\nSon siparişinden bu yana pek çok yenilik oldu. Neler değiştiğine bir göz atmak ister misin?", "Yenilikleri gör", site),
      bekle(7, "gun"),
      { id: kid(), tur: "kosul", kosul: "tikladi", evet: [], hayir: [
        eposta("Son teklif", "Sana özel bir teklifimiz var", "Geri dönmen için küçük bir neden", "Geri dönmen için bir neden", `Merhaba {ad},\n\nSeni yeniden görmeyi çok isteriz.${k ? "\n\n**{kupon}** kodu bir hafta boyunca senin için geçerli." : ""}`, "Teklifi gör", site, k || undefined),
        bekle(7, "gun"),
        { id: kid(), tur: "kosul", kosul: "siparis-verdi", evet: [], hayir: [{ id: kid(), tur: "etiket", etiket: "kayip-musteri" }] },
      ] },
    ] };
    case "randevu": return { ad: "Randevu sonrası teşekkür", tetik: t, ayar: { hizmet: "" }, siparisCikis: false, yeniden: 30, adimlar: [
      bekle(2, "saat"),
      eposta("Teşekkür ve yorum", "Bugün geldiğin için teşekkürler {ad}", "{hizmet} randevun hakkında", "Bizi tercih ettiğin için teşekkürler", "Merhaba {ad},\n\nBugünkü **{hizmet}** randevun için teşekkür ederiz. Deneyimini birkaç cümleyle yazarsan çok seviniriz.", "Yorum yaz", "{yorum_baglantisi}"),
      bekle(30, "gun"),
      eposta("Yeni randevu", "{ad}, yeni randevu zamanı geldi mi?", "Uygun saatler takvimde", "Yeniden görüşelim", "Merhaba {ad},\n\nSon randevundan bu yana bir ay geçti. Uygun saatleri görmek ve yeni randevu almak için takvime bakabilirsin.", "Randevu al", site),
    ] };
    case "etiket": return { ad: "Etiket akışı", tetik: t, ayar: { etiket: "vip" }, siparisCikis: false, yeniden: 0, adimlar: [
      eposta("Özel ileti", "{ad}, sana özel bir haberimiz var", "Yalnız sana", "Sana özel", "Merhaba {ad},\n\nSeni özel müşterilerimiz arasında görmekten mutluyuz.", "Siteye git", site),
    ] };
  }
}

/** Yapılandırma uyarıları (açmadan önce gösterilir; boş liste: açılabilir). */
export function akisSorunlari(a: Pick<Akis, "adimlar" | "tetik" | "ayar">): string[] {
  const s: string[] = [];
  const l = butunAdimlar(a.adimlar);
  const ep = l.filter((x): x is AdimEposta => x.tur === "eposta");
  if (!ep.length) s.push("Akışta e-posta adımı yok.");
  for (const e of ep) {
    if (!e.konu.trim()) s.push(`"${e.ad || "E-posta"}" adımının konu satırı boş.`);
    if (!e.bloklar.length) s.push(`"${e.ad || "E-posta"}" adımının içeriği boş.`);
    if (e.saat === "sabit" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.sabitSaat ?? "")) s.push(`"${e.ad || "E-posta"}" adımında saat seçilmedi.`);
    const metin = [e.konu, ...e.bloklar.map((b) => `${b.metin ?? ""} ${b.adres ?? ""}`)].join(" ");
    if (metin.includes("{kupon}") && !e.kupon) s.push(`"${e.ad || "E-posta"}" adımında {kupon} geçiyor ama kupon seçilmedi.`);
    if (/\{(sepet|tutar)\}/.test(metin) && a.tetik !== "terk-sepet") s.push(`"${e.ad || "E-posta"}" adımındaki {sepet} ve {tutar} yalnız terk edilen sepet akışında dolar.`);
    if (/\{siparis_no\}/.test(metin) && a.tetik !== "siparis") s.push(`"${e.ad || "E-posta"}" adımındaki {siparis_no} yalnız sipariş sonrası akışında dolar.`);
    if (/\{hizmet\}/.test(metin) && a.tetik !== "randevu") s.push(`"${e.ad || "E-posta"}" adımındaki {hizmet} yalnız randevu sonrası akışında dolar.`);
  }
  for (const k of l) if (k.tur === "kosul" && (k.kosul === "etiket-var" ? !k.deger?.trim() : (k.kosul === "harcama" || k.kosul === "siparis-sayisi") && !Number(k.deger))) s.push("Bir koşul adımının değeri boş.");
  for (const k of l) if (k.tur === "etiket" && !k.etiket.trim()) s.push("Bir etiket adımının etiketi boş.");
  if (a.tetik === "etiket" && !a.ayar.etiket?.trim()) s.push("Tetik etiketi seçilmedi.");
  return [...new Set(s)];
}
