import type { DosyaBilgisi } from "@/lib/build/belgeTipler";
import type { DuzenleIstegi, EkSonuc } from "@/lib/build/sohbetTipler";

/** Sohbet ekranının istemci tipleri (sunucudaki sohbetDepo tiplerinin API'den gelen görünümü). */
export type Alinti = { url: string; baslik: string; metin?: string };
export type AracSonucu =
  | { tur: "gorsel"; urller: string[] } | { tur: "video"; url: string; kapak?: string } | { tur: "ses"; url: string; baslik?: string } | { tur: "3d"; url: string }
  | { tur: "proje"; id: string; ad: string; projeTur: string; istem: string } | { tur: "arama"; kaynaklar: { baslik: string; url: string }[]; sorgu?: string }
  | { tur: "sayfa"; url: string; baslik?: string } | { tur: "kod"; cikti?: string; hata?: string }
  | { tur: "dosya"; dosya: DosyaBilgisi; kaynakAd?: string } | { tur: "gorsellestirme"; baslik: string; html: string; tip?: string }
  | EkSonuc | UygulamaSonucu;
/** MCP Apps: arayüzlü bağlantı aracının sonucu (görünüm kum havuzlu çerçevede canlı çizilir). */
export type UygulamaSonucu = {
  tur: "uygulama"; baglantiId: string; arac: string; baslik?: string; resourceUri: string; girdi: Record<string, unknown>;
  sonuc?: { content: unknown[]; structuredContent?: unknown; isError?: boolean; _meta?: Record<string, unknown> };
  iptal?: string; servis: { ad: string; logo?: string; acik?: boolean; genis?: boolean }; ajanId?: string; belirtec?: string;
};
export type AracParca = { tur: "arac"; id: string; ad: string; baslik: string; durum: "suruyor" | "bitti" | "hata" | "onay" | "reddedildi"; ayrinti?: string; sonuc?: AracSonucu; girdi?: Record<string, string>; etiket?: string };
export type PlanParca = { tur: "plan"; baslik: string; adimlar: string[]; durum: "hazirlaniyor" | "bekliyor" | "basladi" };
export type Parca = { tur: "metin"; metin: string; alintilar?: Alinti[] } | { tur: "dusunce"; metin: string } | AracParca | PlanParca;
export type Ek = { tur: "gorsel" | "pdf" | "metin" | "ofis"; url: string; ad: string; boyut?: number; mime?: string; bicim?: "docx" | "xlsx" | "pptx"; belge?: string };
export type TurIstegi = { arastirma?: boolean; arac?: string; yetenekler?: string[]; baglantilar?: string[]; ajan?: string; kurul?: { modeller: string[]; sentez: string }; alinti?: string;
  tuval?: boolean; gorev?: { id: string; ad: string }; duzenle?: DuzenleIstegi; sohbetler?: { id: string; baslik: string }[] };
export type KurulCevabi = { model: string; metin: string; durum: "suruyor" | "bitti" | "hata" | "durduruldu"; hata?: string; kredi?: number; sureMs?: number };
export type Kullanim = { girdi: number; cikti: number; onbellek: number; yazilan: number };
export type Mesaj = {
  id: string; rol: "kullanici" | "asistan"; zaman: number; ust?: string | null;
  metin?: string; ekler?: Ek[]; istek?: TurIstegi; parcalar?: Parca[]; model?: string; sureMs?: number; kredi?: number; kullanim?: Kullanim; aracKredi?: number;
  durum?: string; hata?: string; mod?: "arastirma" | "kurul"; kurul?: { cevaplar: KurulCevabi[]; sentez: string };
  bellek?: { id: string; metin: string }[]; ajan?: { id: string; ad: string; simge: string }; ses?: string; geri?: "iyi" | "kotu";
  /** Ajanın bilgi kaynaklarından alıntılar (metinde [n]). */
  kaynaklar?: { no: number; ad: string; url?: string; parca: string }[];
  baglam?: number;
  degistir?: string; oneriler?: string[];
};
/** Bağlam sıkıştırma özeti: sonMesaj'a kadar olan kısım modele bu özet olarak gider. */
export type OzetBilgisi = { id: string; sonMesaj: string; metin: string; zaman: number; mesaj: number; once: number; sonra: number; model: string; elle?: boolean };
export type IceKaynak = "chatgpt" | "claude" | "ozel";
export type Sohbet = {
  id: string; baslik: string; model: string; sabit?: boolean; arsiv?: boolean; ajanId?: string; klasor?: string; gecici?: boolean;
  bekleyen?: { asistanId: string }; mesajlar: Mesaj[]; secim?: Record<string, string>;
  izinModu?: "otomatik" | "onay"; baglantiSecimi?: string[]; kapaliYetenekler?: string[]; bellekKapali?: boolean; efor?: "low" | "medium" | "high" | "max";
  paylasim?: { id: string; zaman: number }; guncelleme?: number;
  ozetler?: OzetBilgisi[]; ice?: { kaynak: IceKaynak; kimlik: string; zaman: number };
  tuvaller?: string[]; ogrenme?: boolean; asistan?: string; gorevler?: string[];
  /** v5: kilitli sohbet (PIN ister). */
  kilitli?: boolean;
};
export type AjanBilgisi = { id: string; ad: string; aciklama: string; simge: string; model: string; karsilama: string; baslangiclar: string[] };
export type Onayla = (karar: "onay" | "ret", hep?: boolean) => void;
export type Baglam = {
  baglantilar: { id: string; ad: string; logo?: string; sohbette: boolean; durum: string; arac: number; saltOkunur: boolean }[];
  yetenekler: { id: string; ad: string; baslik: string; aciklama: string; simge: string; herSohbette: boolean; cagri?: "model" | "elle" | "her-zaman" }[];
  ajanlar: { id: string; ad: string; aciklama: string; simge: string; model: string }[];
  klasorler: { id: string; ad: string; renk: string }[];
  bellek: { acik: boolean; kayit: number; kisisel: boolean };
};
export type SohbetOzet = { id: string; baslik: string; guncelleme: number; olusturma: number; calisiyor?: boolean; sabit?: boolean; ajanId?: string; arsiv?: boolean; klasor?: string; model: string; ozet: string; mesaj: number; parca?: string; kaynak?: IceKaynak; kilitli?: boolean };
