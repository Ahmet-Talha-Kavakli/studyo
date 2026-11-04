/* Kurumsal içerik verileri — hakkımızda, değerler, ekip, zaman çizelgesi, sayılar.
   Birden çok sayfada paylaşılır (hakkinda, kurumsal hub, kariyer, güvenlik). */

import {
  Compass, Rocket, ShieldCheck, Heart, Sparkles, Users, Zap, Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Deger {
  ikon: LucideIcon;
  ad: string;
  ozet: string;
}

export const DEGERLER: Deger[] = [
  { ikon: Compass, ad: "Yaratıcıyı merkeze koy", ozet: "Her kararı 'bu, yaratıcının işini kolaylaştırır mı?' sorusuyla veririz. Ürün, önce onların ihtiyacına hizmet eder." },
  { ikon: Rocket, ad: "Hız ve kalite bir arada", ozet: "Dakikalar içinde stüdyo kalitesinde çıktı — hiçbirinden ödün vermeden. Yavaşlık bir tasarım hatasıdır." },
  { ikon: ShieldCheck, ad: "Etik ve şeffaf", ozet: "Açık fiyatlandırma, güvenli üretim ve telif dostu bir platform. Sürprizsiz, gizli maddesiz." },
  { ikon: Heart, ad: "Topluluğa saygı", ozet: "Dört kıtada, tek bir yaratıcı topluluğuz. Erişilebilir, kapsayıcı ve topluluğuyla birlikte büyüyen bir ürünüz." },
  { ikon: Globe, ad: "Varsayılan olarak global", ozet: "Dağıtık bir ekiple, 12 zaman diliminde çalışıyoruz. Hiçbir pazar 'ikincil' değil — ürün her yerde aynı kalitede." },
  { ikon: Sparkles, ad: "Zanaat önce gelir", ozet: "Detay pazarlık konusu değil. Bir piksel, bir kare veya bir milisaniye yanlışsa iş bitmemiştir." },
];

export interface EkipUyesi {
  ad: string;
  unvan: string;
  mono: string;
  bio: string;
  gecmis: string;
  /** Çalıştığı ofis/şehir — global ekibi görünür kılar. */
  konum: string;
}

/* Liderlik ekibi — detaylı bio + geçmiş.
   Global kadro: dört kıtadan, dağıtık çalışan bir ekip. */
export const LIDERLIK: EkipUyesi[] = [
  { ad: "Daniel Okonkwo", unvan: "Kurucu & CEO", mono: "DO", bio: "Ürün vizyonu ve şirket stratejisini yönetir. Yaratıcı araçları herkes için erişilebilir kılma misyonuyla Vayra'yı kurdu.", gecmis: "Önceki: 2 girişim kurucu ortağı · Delft Teknik Üniversitesi", konum: "Amsterdam" },
  { ad: "Mei-Lin Chen", unvan: "Kurucu & CTO", mono: "MC", bio: "Mühendislik ve AI altyapısından sorumlu. Ölçeklenebilir üretim hattını ve model yönlendirme mimarisini tasarladı.", gecmis: "Önceki: Kıdemli ML mühendisi · NUS", konum: "Singapur" },
  { ad: "Sofia Marchetti", unvan: "Tasarım Lideri", mono: "SM", bio: "Vayra'nın görsel dilini ve etkileşim standartlarını şekillendirir. Karmaşık akışları sade deneyimlere çevirir.", gecmis: "Önceki: Ürün tasarım lideri · Politecnico di Milano", konum: "Londra" },
  { ad: "Arjun Mehta", unvan: "Yapay Zekâ Lideri", mono: "AM", bio: "Üretken model kalitesini ve değerlendirme hattını yönetir. Yeni modelleri hızla ürüne taşır.", gecmis: "Önceki: Araştırmacı, üretken modeller · ETH Zürih", konum: "Amsterdam" },
  { ad: "Clara Lindqvist", unvan: "Ürün Lideri", mono: "CL", bio: "Yol haritasını ve özellik önceliklerini yönetir. Kullanıcı geri bildirimini ürün kararlarına çevirir.", gecmis: "Önceki: Ürün müdürü, SaaS · KTH Stockholm", konum: "New York" },
  { ad: "Tomás Rivera", unvan: "Topluluk Lideri", mono: "TR", bio: "Yaratıcı topluluğunu büyütür ve destekler. Kullanıcılarla ürün arasındaki köprüyü kurar.", gecmis: "Önceki: Topluluk yöneticisi · İçerik üreticisi", konum: "Mexico City" },
  { ad: "Yuki Tanaka", unvan: "Mühendislik Direktörü", mono: "YT", bio: "Üretim altyapısının ölçeklenmesinden ve güvenilirliğinden sorumlu. Kuyruk mimarisini ve bölgesel dağıtımı kurdu.", gecmis: "Önceki: Altyapı mühendisi, dağıtık sistemler · Tokyo Üniversitesi", konum: "Singapur" },
  { ad: "Nadia Haddad", unvan: "Gelir Lideri", mono: "NH", bio: "Satış, ortaklıklar ve kurumsal büyümeyi yönetir. Ajans ve marka iş birliklerini kurar.", gecmis: "Önceki: Kurumsal satış lideri · INSEAD", konum: "Londra" },
];

/** Danışma kurulu — sektör deneyimiyle yön veren bağımsız isimler. */
export const DANISMANLAR: { ad: string; unvan: string; mono: string; not: string }[] = [
  { ad: "Ingrid Sørensen", unvan: "Danışman · Yaratıcı sektör", mono: "IS", not: "Ödüllü reklam ajansı eski yaratıcı direktörü." },
  { ad: "Rahul Desai", unvan: "Danışman · AI araştırma", mono: "RD", not: "Üretken görüntü modelleri üzerine 40+ yayın." },
  { ad: "Amara Diallo", unvan: "Danışman · Ölçekleme", mono: "AD", not: "İki SaaS şirketini global ölçeğe taşıdı." },
];

/* Kısa monogram ekip (kart ızgarası için) — LIDERLIK'ten türetilir. */
export const EKIP = LIDERLIK.map(({ ad, unvan, mono, konum }) => ({ ad, unvan, mono, konum }));

export interface ZamanNoktasi {
  yil: string;
  baslik: string;
  metin: string;
}

export const ZAMAN_CIZELGESI: ZamanNoktasi[] = [
  { yil: "2024 · Ç1", baslik: "Fikir doğdu", metin: "Dağınık ve pahalı yaratıcı araçlara son vermek için üç kıtadan bir avuç yaratıcı ve mühendis bir araya geldi. İlk prototip bir hafta sonu kuruldu." },
  { yil: "2024 · Ç3", baslik: "İlk tohum yatırımı", metin: "Vizyonumuza inanan uluslararası yatırımcılarla ilk turumuzu kapattık; çekirdek ekibi kurduk ve Amsterdam'da tüzel kişiliğimizi oluşturduk." },
  { yil: "2025 · Ç1", baslik: "İlk stüdyo yayında", metin: "Video ve görsel üretimini tek panelde birleştiren ilk sürümü yayınladık; ilk 1.000 yaratıcıya ulaştık." },
  { yil: "2025 · Ç3", baslik: "Çok bölgeli altyapı", metin: "Avrupa, Amerika ve Asya-Pasifik'te üretim bölgeleri açtık. Gecikme dünya genelinde yarıya indi." },
  { yil: "2025 · Ç4", baslik: "Ses & müzik stüdyosu", metin: "Profesyonel seslendirme, ses klonlama ve müzik üretimini ekledik. Kullanıcı sayısı 10 kat büyüdü." },
  { yil: "2026 · Ç1", baslik: "Seri A", metin: "Global büyüme ve model araştırması için Seri A turumuzu kapattık; ekip üç ofise yayıldı." },
  { yil: "2026 · Ç2", baslik: "Tam stüdyo", metin: "3D modelleme ve gelişmiş sinema araçlarını ekledik. 120+ ülkede 10.000+ yaratıcı Vayra ile üretiyor." },
  { yil: "Yarın", baslik: "Sıra sende", metin: "Gerçek zamanlı işbirliği, daha fazla model ve topluluk araçlarıyla stüdyoyu büyütmeye devam ediyoruz." },
];

export interface Istatistik {
  ikon: LucideIcon;
  deger: string;
  etiket: string;
}

export const ISTATISTIKLER: Istatistik[] = [
  { ikon: Users, deger: "10.000+", etiket: "Aktif yaratıcı" },
  { ikon: Globe, deger: "120+", etiket: "Ülke" },
  { ikon: Zap, deger: "8M+", etiket: "Üretilen içerik" },
  { ikon: Sparkles, deger: "40+", etiket: "Entegre AI modeli" },
];

/* Şirkete dair hızlı gerçekler (hakkımızda + kurumsal hub). */
export const HIZLI_GERCEKLER: { etiket: string; deger: string }[] = [
  { etiket: "Kuruluş", deger: "2024" },
  { etiket: "Merkez", deger: "Amsterdam" },
  { etiket: "Ofisler", deger: "5 şehir · 3 kıta" },
  { etiket: "Çalışma modeli", deger: "Uzaktan öncelikli" },
  { etiket: "Ekip", deger: "30+ kişi · 18 ülke" },
  { etiket: "Kategori", deger: "Yaratıcı AI platformu" },
];

/* Vayra'yı diğerlerinden ayıran noktalar (hakkımızda "neden biz"). */
export const NEDEN_BIZ: { baslik: string; metin: string }[] = [
  { baslik: "Tek panel, tüm stüdyolar", metin: "Video, görsel, 3D ve ses — hepsi tek yerde. Araçlar arasında dosya taşıma derdi yok." },
  { baslik: "Rakiplerde nadir 3D & ses", metin: "Metinden gerçek 3D model ve profesyonel ses üretimi — çoğu platformda bulunmayan yetenekler." },
  { baslik: "40+ model, tek arayüz", metin: "Sektörün en güçlü modellerini akıllı yönlendirmeyle en uygun maliyette sunuyoruz." },
  { baslik: "Çok bölgeli altyapı", metin: "Avrupa, Amerika ve Asya-Pasifik'te üretim bölgeleri — nerede olursan ol düşük gecikme." },
  { baslik: "40+ dilde ses", metin: "Seslendirme ve altyazı 40'tan fazla dili destekler; içeriğin tek üretimde global olur." },
  { baslik: "Gün ilk saatinden kurumsal", metin: "SSO, denetim kaydı, veri ikamet tercihi ve sözleşmeli SLA — kurumsal planlarda hazır." },
];
