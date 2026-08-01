/* Basın / medya kiti — indirilebilir varlıklar + basın bültenleri + künye. */

export interface BasinVarlik {
  ad: string;
  aciklama: string;
  format: string; // "SVG · PNG"
  boyut: string;
  yol: string; // public altındaki dosya (implementasyonda üretilir)
}

export const MARKA_VARLIKLAR: BasinVarlik[] = [
  { ad: "Logo paketi", aciklama: "Ana logo, işaret ve mono varyantlar (açık/koyu zemin).", format: "SVG · PNG", boyut: "1,2 MB", yol: "/basin/vayra-logo-paketi.zip" },
  { ad: "Marka rehberi", aciklama: "Renk, tipografi ve logo kullanım kuralları.", format: "PDF", boyut: "3,4 MB", yol: "/basin/vayra-marka-rehberi.pdf" },
  { ad: "Ürün görselleri", aciklama: "Yüksek çözünürlüklü stüdyo ekran görüntüleri.", format: "PNG", boyut: "8,1 MB", yol: "/basin/vayra-urun-gorselleri.zip" },
];

export interface MarkaRenk {
  ad: string;
  hex: string;
  not: string;
}

export const MARKA_RENKLER: MarkaRenk[] = [
  { ad: "Vayra Lime", hex: "#DAFD55", not: "Birincil aksan" },
  { ad: "Ink", hex: "#0A0A0B", not: "Koyu zemin / metin" },
  { ad: "Beyaz", hex: "#FFFFFF", not: "Kurumsal zemin" },
  { ad: "Gri", hex: "#52555A", not: "İkincil metin" },
];

export interface BasinBulten {
  slug: string;
  baslik: string;
  tarih: string;
  ozet: string;
}

export const BASIN_BULTENLERI: BasinBulten[] = [
  { slug: "3d-studyo-duyuru", baslik: "Vayra 3D Stüdyo'yu duyurdu", tarih: "20 Temmuz 2026", ozet: "Metinden ve görselden gerçek 3D model üretimi platforma geliyor." },
  { slug: "10000-yaratici", baslik: "Vayra 120+ ülkede 10.000 yaratıcıya ulaştı", tarih: "3 Haziran 2026", ozet: "Platform bir yılda üç kıtaya yayıldı." },
  { slug: "seri-a-turu", baslik: "Vayra Seri A turunu kapattı", tarih: "12 Mayıs 2026", ozet: "Global büyüme ve model araştırması için yeni yatırım turu tamamlandı." },
  { slug: "singapur-ofisi", baslik: "Asya-Pasifik ofisi Singapur'da açıldı", tarih: "9 Nisan 2026", ozet: "Bölgesel üretim altyapısıyla APAC gecikmesi yarıya indi." },
  { slug: "ses-studyosu-lansmani", baslik: "Profesyonel Ses Stüdyosu yayında", tarih: "18 Mart 2026", ozet: "Seslendirme, ses klonlama ve müzik üretimi tek panelde." },
];

/* Şirket künyesi — hızlı gerçekler (basın için). */
export const KUNYE = [
  { etiket: "Kuruluş", deger: "2024" },
  { etiket: "Merkez", deger: "Amsterdam, Hollanda" },
  { etiket: "Ofisler", deger: "Amsterdam · New York · Singapur · Londra" },
  { etiket: "Kategori", deger: "Yaratıcı AI platformu" },
  { etiket: "Kullanıcı", deger: "10.000+ yaratıcı, 120+ ülke" },
  { etiket: "Ekip", deger: "30+ kişi, 18 ülke" },
];
