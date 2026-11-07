import { hesapGuncelle, olayEkle } from "@/lib/hesap/depo";
import { cerezliYanit, cihazAdi, istemciIp, kokenDenetle } from "@/lib/hesap/guvenlik";
import { oturumCereziSil, oturumlariKapat, oturumOku } from "@/lib/hesap/oturum";

export const runtime = "nodejs";

/** Bu cihazın oturumunu sunucuda kapatır ve çerezi siler. Oturum yoksa da başarılı döner. */
export async function POST(req: Request) {
  const k = kokenDenetle(req);
  if (k) return k;
  const o = await oturumOku(req);
  if (o) {
    await oturumlariKapat(o.hesap.uid, { id: o.oturum.id });
    await hesapGuncelle(o.hesap.uid, (h) => olayEkle(h, "cikis", cihazAdi(req), undefined, istemciIp(req)));
  }
  return cerezliYanit({}, [oturumCereziSil()]);
}
