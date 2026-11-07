import "server-only";
import { projeErisimi } from "./depo";
import { EkipHatasi } from "./ekip";
import { YetkiHatasi } from "./ekipDepo";
import { IZLEYICI_HATASI } from "./ekipOrtak";
import { bulunamadi, hata } from "./sunucu";
import { ANAHTARLAR, SAGLAYICILAR, testAdi } from "./odeme";
import type { Proje, ProjeErisim, Sir } from "./tipler";

/** Yalnız sahibe açık uç: sahipse null; ekip üyesiyse 403 (açık metinle), değilse 404 yanıtı döner. */
export async function yalnizSahip(id: string, sahip: string, mesaj: string): Promise<Response | null> {
  const e = await projeErisimi(id, sahip);
  if (e === "sahip") return null;
  return e ? hata(mesaj, 403) : bulunamadi();
}

/**
 * Projeye yazan uçlar (veritabanı, dosya deposu, form, üyeler, ayarlar, büyüme, mağaza) için: izleyiciyse 403 yanıtı,
 * değilse null. Erişimi olmayanı çağıranın kendi 404 denetimi yakalar.
 */
export async function izleyiciEngeli(id: string, sahip: string | null | undefined): Promise<Response | null> {
  if (!sahip) return null;
  return (await projeErisimi(id, sahip)) === "izleyici" ? hata(IZLEYICI_HATASI, 403) : null;
}

/** Ekip işlemi hatasını yanıta çevirir (davet hatalarında kod alanıyla). */
export function ekipHataYaniti(e: unknown) {
  if (e instanceof EkipHatasi) return Response.json({ ok: false, hata: e.message, ...(e.kod ? { kod: e.kod } : {}) }, { status: e.durum });
  if (e instanceof YetkiHatasi) return hata(e.message, 403);
  return hata(e instanceof Error ? e.message : "İşlem yapılamadı.", 500);
}

/** Ödeme sağlayıcı anahtarları: sırlar listesinde dururlar ama yalnız sahip görür ve değiştirir. */
const SAHIP_SIRLARI = new Set(SAGLAYICILAR.flatMap((s) => ANAHTARLAR[s].flatMap((a) => [a.ad, testAdi(a.ad)])));
export const sahipSirriMi = (ad: string) => SAHIP_SIRLARI.has(ad);

/**
 * Düzenleyicinin gönderdiği sır listesi: ödeme anahtarlarına dokunamaz; var olanlar korunur.
 */
export function uyeSirlariniBirlestir(eski: Sir[], yeni: Sir[]): Sir[] {
  return [...yeni.filter((s) => !sahipSirriMi(s.ad)), ...eski.filter((s) => sahipSirriMi(s.ad))];
}

/**
 * Projenin istemciye giden hâli: rol ve ekip sayısı eklenir. Sahip dışındakilere GitHub anahtarı ve ödeme
 * anahtarları gitmez; izleyiciye sunucu sırlarının değerleri de gitmez.
 */
export function istemciyeProje(p: Proje, rol: ProjeErisim, ekipSayisi: number): Proje {
  if (rol === "sahip") return { ...p, ekipRol: rol, ekipSayisi };
  const { github, ...ayar } = p.ayarlar;
  const sirlar = p.ayarlar.sirlar.filter((s) => !sahipSirriMi(s.ad)).map((s) => (rol === "izleyici" && s.gorunurluk === "sunucu" ? { ...s, deger: "" } : s));
  const gh = github ? { kullanici: github.kullanici, avatar: github.avatar, depo: github.depo, dal: github.dal, ozel: github.ozel, son: github.son } : undefined;
  return { ...p, ayarlar: { ...ayar, sirlar, ...(gh ? { github: gh } : {}) }, ekipRol: rol, ekipSayisi };
}
