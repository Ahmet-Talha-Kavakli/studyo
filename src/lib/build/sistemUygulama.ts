/**
 * Uygulama eylemleri: servis başına hazır eylemler (Zapier eylemleri, n8n düğümleri, Pipedream parçaları gibi). Her
 * eylem servisin resmî HTTP API'sine gerçek istek kurar (uç, yöntem, gövde ve kimlik resmî belgeden). Kimlik bilgisi
 * Bağlantılar'daki kayıttan ya da hesabın şifreli sistem sırlarından gelir; kısa ömürlü belirteç isteyen servislerde
 * (OAuth yenileme, istemci kimliği, oturum) kimlik adımı sunucuda çalışır ve belirteç önbellekte tutulur. İstek
 * sunucuda guvenliFetch ile gönderilir (sistemUygulamaCalistir.ts). Bu dosya istemci ve sunucu ortaktır.
 *
 * Katalog dosyaları: sistemUygulamaTicaret, sistemUygulamaGlobal (muhasebe, ödeme, pazar yeri), sistemUygulamaKargo, sistemUygulamaTr (Türkiye), sistemUygulamaIletisim, sistemUygulamaGoogle,
 * sistemUygulamaIs, sistemUygulamaYz. Ortak türler ve yardımcılar sistemUygulamaOrtak.ts içinde.
 */
import type { Uygulama } from "./sistemUygulamaOrtak";
import { UYG_GLOBAL } from "./sistemUygulamaGlobal";
import { UYG_GOOGLE } from "./sistemUygulamaGoogle";
import { UYG_ILETISIM } from "./sistemUygulamaIletisim";
import { UYG_IS } from "./sistemUygulamaIs";
import { UYG_KARGO } from "./sistemUygulamaKargo";
import { UYG_TICARET } from "./sistemUygulamaTicaret";
import { UYG_TR } from "./sistemUygulamaTr";
import { UYG_YZ } from "./sistemUygulamaYz";

export type { UygAlan, UygBaglanti, UygEylem, UygIstek, UygKimlik, UygSir, Uygulama } from "./sistemUygulamaOrtak";

/** Sıra: önce dünya geneli servisler; Türkiye servisleri ek seçenek olarak sonda ve "Türkiye" süzgecinde. */
export const UYGULAMALAR: Uygulama[] = [...UYG_TICARET, ...UYG_GLOBAL, ...UYG_KARGO, ...UYG_ILETISIM, ...UYG_GOOGLE, ...UYG_IS, ...UYG_YZ, ...UYG_TR];

/** Kategoriler: en çok servisi olan önce; Türkiye servisleri ayrıca "Türkiye" süzgecinde. */
export const UYG_KATEGORILERI = (() => { const m = new Map<string, number>(); for (const u of UYGULAMALAR) m.set(u.kategori, (m.get(u.kategori) ?? 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k); })();
export const uygulamaBul = (id: unknown) => UYGULAMALAR.find((u) => u.id === id);
export const eylemBul = (u: Uygulama | undefined, id: unknown) => u?.eylemler.find((e) => e.id === id);
export const UYG_EYLEM_SAYISI = UYGULAMALAR.reduce((t, u) => t + u.eylemler.length, 0);
/** "_" ile başlayan sırlar kimlik adımının ya da bağlantının ürettiği türetilmiş değerlerdir; kullanıcı girmez. */
export const turetilmis = (ad: string) => ad.startsWith("_");
/** Eylemin kullanıcıdan istediği sırlar: eylemin kendi sırları (türetilmişler hariç) ve gerekirse kimlik adımının sırları. */
export function gerekenSirlar(u: Uygulama, e: { sirlar: string[] }): string[] {
  const l = e.sirlar.filter((x) => !turetilmis(x));
  if (u.kimlik && e.sirlar.some(turetilmis)) for (const x of u.kimlik.sirlar) if (!l.includes(x)) l.push(x);
  return l;
}
/** Bağlantılar'dan gelebilecek sır adları (katalog kimliğine göre). */
export const baglantiSirlari = (u: Uygulama, katalog?: string) => Object.keys(u.baglanti?.find((b) => b.katalog === katalog)?.esle ?? {});
