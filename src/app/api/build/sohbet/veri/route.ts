import type { SohbetEki } from "@/lib/build/sohbetDepo";
import { ekTablolari, sutunOzetleri } from "@/lib/build/sohbetVeri";
import { hata } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/**
 * Eklenen tablonun önizlemesi (sohbetteki etkileşimli tablo kartı): ?url=<ek adresi>&ad=<dosya adı>.
 * Ek adresleri tahmin edilemez kimliklidir (ek ve belge uçları gibi). İlk 1000 satır + sütun özetleri döner.
 */
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const url = u.get("url") ?? "", ad = (u.get("ad") ?? "tablo").slice(0, 120);
  const metin = /^\/api\/build\/sohbet\/ek\/[A-Za-z0-9_-]{20,40}\.txt$/.test(url);
  const ofis = /^\/api\/build\/sohbet\/belge\/([A-Za-z0-9_-]{24})\.xlsx$/.exec(url);
  if (!metin && !ofis) return hata("Tablo bulunamadı.", 404);
  const ek: SohbetEki = metin ? { tur: "metin", url, ad: /\.(csv|tsv)$/i.test(ad) ? ad : `${ad}.csv` } : { tur: "ofis", url, ad, bicim: "xlsx", belge: ofis![1] };
  const l = await ekTablolari([ek]);
  if (!l.length) return hata("Bu dosyadan tablo okunamadı.", 422);
  return Response.json({
    ok: true,
    tablolar: l.map((t) => ({ ad: t.ad, sutunlar: t.sutunlar, satirlar: t.satirlar.slice(0, 1000), toplam: t.toplam, kesildi: t.kesildi, ozet: sutunOzetleri(t) })),
  }, { headers: { "Cache-Control": "private, max-age=300" } });
}
