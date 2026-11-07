import { dokumBaslat, dokumleriListele, tanimaKurulu, type TarayiciParcasi } from "@/lib/build/sohbetDokum";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Dökümler ve tanıma sağlayıcısının durumu. */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, dokumler: [], tanima: tanimaKurulu() });
  return Response.json({ ok: true, dokumler: await dokumleriListele(sahip), tanima: tanimaKurulu() });
}

/** Yeni döküm (multipart): ses, kaynak ("yukleme" | "kayit"), sure (sn), dil?, model?, baslik?, tarayici? (JSON parçalar). */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const fd = await req.formData().catch(() => null);
  const f = fd?.get("ses");
  if (!fd || !f || typeof f === "string") return hata("Ses dosyası yok.");
  if (f.size > 25 * 1024 * 1024) return hata("Dosya 25 MB sınırını aşıyor.", 413);
  let tarayici: TarayiciParcasi[] | undefined;
  try { const t = fd.get("tarayici"); if (typeof t === "string" && t) tarayici = JSON.parse(t); } catch { /* yok */ }
  const s = (k: string) => { const v = fd.get(k); return typeof v === "string" ? v : undefined; };
  const r = await dokumBaslat(sahip, {
    bayt: Buffer.from(await f.arrayBuffer()), ad: f.name || "kayit.webm", mime: f.type || "audio/webm", sure: Number(s("sure")) || 0,
    kaynak: s("kaynak") === "kayit" ? "kayit" : "yukleme", dil: /^[a-z]{2}$/.test(s("dil") ?? "") ? s("dil") : undefined, model: s("model"), tarayici, baslik: s("baslik"),
  });
  if ("hata" in r) return hata(r.hata, r.durum ?? 400);
  return Response.json({ ok: true, dokum: r.dokum });
}
