import type { ProjeTur } from "./tipler";

/**
 * Vayra Build topluluk galerisi (istemci + sunucu ortak tipler).
 * Sahip bir sürümü şablon olarak ekler; dosyaların anlık kopyası saklanır, proje sonradan değişse de şablon aynı kalır.
 * Galeride gösterilen her şey gerçek kullanıcı eklemesidir; örnek ya da uydurma öğe yoktur.
 */
export type ToplulukSira = "populer" | "yeni";

export const TOPLULUK_KATEGORILERI: { id: ProjeTur; ad: string; etiketler: string[] }[] = [
  { id: "site", ad: "Site", etiketler: ["Açılış sayfası", "Kurumsal", "Portfolyo", "Restoran ve kafe", "Etkinlik", "Blog", "E-ticaret"] },
  { id: "uygulama", ad: "Uygulama", etiketler: ["Verimlilik", "Finans", "Panel", "Eğitim", "Sağlık", "Araç"] },
  { id: "oyun", ad: "Oyun", etiketler: ["Arcade", "Bulmaca", "Platform", "Nişancı", "Kart", "Hafıza"] },
  { id: "mobil", ad: "Mobil", etiketler: ["Sağlık", "Yaşam", "Yemek", "Evcil hayvan", "Verimlilik", "Finans"] },
];
export const kategoriAdi = (t: ProjeTur) => TOPLULUK_KATEGORILERI.find((k) => k.id === t)?.ad ?? t;

/** Galeride görünen öğe (sahip özeti, proje kimliği ve dosyalar yok). */
export type ToplulukOzet = {
  id: string;
  baslik: string;
  aciklama: string;
  kategori: ProjeTur;
  etiketler: string[];
  kapak: string;
  yazar: string;
  remix: number;
  begeni: number;
  dosyaSayisi: number;
  surumNo: number;
  olusturma: number;
  guncelleme: number;
  sunucuGerekli: boolean;
  /** İsteği yapan sahibin kendi öğesi mi, beğendi mi (sahip anahtarı varsa). */
  benim?: boolean;
  begendim?: boolean;
};

export const ETIKET_SINIRI = 3;
export const etiketTemizle = (s: string) => s.replace(/[<>"`]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
export const toplulukKimligiGecerli = (id: string) => /^[A-Za-z0-9_-]{12}$/.test(id);
