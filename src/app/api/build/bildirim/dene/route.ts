import { bildirimGonder } from "@/lib/build/bildirim";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Deneme bildirimi: bütün açık kanallardan gönderilir; dönen kanal durumları arayüzde gösterilir. */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  const b = await bildirimGonder(sahip, { tur: "izleme", baslik: "Deneme bildirimi", metin: "Bildirimler çalışıyor. İzlediğin bir koşul gerçekleşince sana bu şekilde haber vereceğiz.", adres: "/panel/build/sohbet/gorevler" });
  return Response.json({ ok: true, bildirim: b });
}
