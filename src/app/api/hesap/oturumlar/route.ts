import { cihazAdi, govdeOku, hata, tamam } from "@/lib/hesap/guvenlik";
import { hesapOku } from "@/lib/hesap/depo";
import { oturumBilgileri, oturumlariKapat, oturumOku } from "@/lib/hesap/oturum";
import { oturumGerekli } from "@/lib/hesap/yetki";
import type { GuvenlikOlayiBilgisi } from "@/lib/hesap/tipler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Açık oturumlar ve güvenlik geçmişi (son 100 olay). */
export async function GET(req: Request) {
  const o = await oturumOku(req);
  if (!o) return hata("Oturum açık değil. Giriş yap.", 401, { kod: "oturum" });
  const olaylar: GuvenlikOlayiBilgisi[] = o.hesap.olaylar.slice(0, 100).map(({ ip: _ip, ...x }) => { void _ip; return x; });
  return tamam({ oturumlar: oturumBilgileri(o.hesap, o.oturum.id), olaylar });
}

/** { id } tek oturumu, { digerleri: true } bu cihaz dışındakilerin tamamını kapatır. Bu oturum buradan kapatılamaz (çıkış yap). */
export async function DELETE(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const g = await govdeOku<{ id?: string; digerleri?: boolean }>(req);
  const cihaz = cihazAdi(req);
  let n = 0;
  if (g?.digerleri) n = await oturumlariKapat(o.hesap.uid, { haric: o.oturum.id }, { cihaz, ayrinti: "Diğer oturumlar" });
  else if (typeof g?.id === "string" && g.id !== o.oturum.id) {
    const x = o.hesap.oturumlar.find((s) => s.id === g.id);
    if (!x) return hata("Oturum bulunamadı.", 404);
    n = await oturumlariKapat(o.hesap.uid, { id: g.id }, { cihaz, ayrinti: `${x.tarayici}, ${x.isletim}` });
  } else return hata("Kapatılacak oturumu seç.");
  const h = await hesapOku(o.hesap.uid);
  return tamam({ kapatilan: n, oturumlar: h ? oturumBilgileri(h, o.oturum.id) : [] });
}
