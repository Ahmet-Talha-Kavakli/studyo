import { tamam } from "@/lib/hesap/guvenlik";
import { sonHareketler } from "@/lib/hesap/kredi";
import { odemeDurumu } from "@/lib/odeme/ayar";
import { kayitOku, siparisOku } from "@/lib/odeme/depo";
import { abonelikDenetle, abonelikOzeti, haklarOzeti, siparisOzeti } from "@/lib/odeme/motor";
import type { KrediKaydi, SiparisOzeti } from "@/lib/odeme/tipler";
import { baglamAl } from "@/lib/odeme/uc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ayarlar, Faturalar: ödeme geçmişi (sunucu siparişleri), ücretsiz kredi hareketleri, abonelik, süreli haklar, fatura bilgisi. */
export async function GET(req: Request) {
  const b = await baglamAl(req);
  if (b instanceof Response) return b;
  await abonelikDenetle(b.uid).catch(() => {});
  const k = await kayitOku(b.uid);
  const siparisler: SiparisOzeti[] = [];
  for (const no of k.siparisler.slice(0, 200)) {
    const s = await siparisOku(no);
    // Hiç ödeme sayfasına gidilmemiş ya da vazgeçilmiş siparişler makbuz listesini kalabalıklaştırmasın: yalnız son 7 gün.
    if (s && (s.durum !== "basarisiz" || Date.now() - s.olusturma < 7 * 864e5)) siparisler.push(siparisOzeti(s));
  }
  const krediKayitlari: KrediKaydi[] = (await sonHareketler(b.uid, 200)).flatMap((h): KrediKaydi[] => {
    const k = h.kaynak;
    const tur: KrediKaydi["tur"] | null = h.tur === "ekleme" && k.startsWith("promo:") ? "promo" : h.tur === "ekleme" && k === "hediye" ? "hediye" : h.tur === "ekleme" && k.startsWith("gorev:") ? "odul"
      : h.tur === "harcama" && k === "hediye-gonder" ? "hediye-gonder" : h.tur === "iade" && k === "hediye-iade" ? "hediye-iade" : h.tur === "ekleme" && k.startsWith("deneme:") ? "deneme" : null;
    return tur ? [{ id: h.id, zaman: h.zaman, tur, aciklama: h.aciklama, kredi: h.miktar }] : [];
  });
  return tamam({ siparisler, krediKayitlari, abonelik: abonelikOzeti(k.abonelik), haklar: haklarOzeti(k), fatura: k.fatura ?? null, durum: odemeDurumu() });
}
