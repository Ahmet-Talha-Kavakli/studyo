import "server-only";
import { hata, istekKokeni, istemciIp } from "@/lib/hesap/guvenlik";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { OdemeHatasi } from "./hata";
import type { Baglam } from "./motor";

/** Ödeme uçlarının ortak başı: oturum (durum değiştiren istekte köken denetimiyle) ve bağlam. */
export async function baglamAl(req: Request): Promise<Baglam | Response> {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  return { uid: o.hesap.uid, hesap: o.hesap, ip: istemciIp(req), koken: istekKokeni(req) };
}

export function hataYanit(e: unknown, baglam = "odeme"): Response {
  if (e instanceof OdemeHatasi) return hata(e.message, e.durum, e.kod ? { kod: e.kod } : {});
  console.error(`[${baglam}]`, (e as Error)?.message ?? e);
  return hata("Ödeme işlemi şu an tamamlanamadı; ödeme alınmadıysa hesabından para çekilmez. Biraz sonra yeniden dene.", 500, { kod: "sunucu" });
}

/** Dönüş adresleri yalnız bu sitenin göreli yolu olabilir (açık yönlendirme olmasın). */
export const icYol = (y: unknown, varsayilan = "/panel") => {
  const s = String(y ?? "");
  return /^\/(?!\/)[\w\-./?=&%#]{0,300}$/.test(s) && !s.includes("..") ? s : varsayilan;
};

export const yonlendir = (req: Request, yol: string) => new Response(null, { status: 303, headers: { Location: new URL(yol, istekKokeni(req)).toString(), "Cache-Control": "no-store" } });
