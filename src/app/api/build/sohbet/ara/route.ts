import { sohbetAra, type AramaSuzgeci } from "@/lib/build/sohbetDepo";
import { sahipAl } from "@/lib/build/sunucu";
import { calisanSohbetler } from "../calisanlar";

export const dynamic = "force-dynamic";

/**
 * Sohbet araması: başlık, mesajlar, ek ve dosya adları (bütün dallar), sohbet başına en çok 3 eşleşme.
 * ?q= ("tam ifade", -hariç) &gun=1|7|30|365 &tur=dosya|gorsel|kod|tuval &saglayici= &klasor= &arsiv=1
 */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, sonuclar: [] });
  const u = new URL(req.url).searchParams;
  const q = (u.get("q") ?? "").slice(0, 160);
  const tur = u.get("tur");
  const f: AramaSuzgeci = {
    ...(Number(u.get("gun")) > 0 ? { gun: Math.min(3650, Number(u.get("gun"))) } : {}),
    ...(tur === "dosya" || tur === "gorsel" || tur === "kod" || tur === "tuval" ? { tur } : {}),
    ...(u.get("saglayici") ? { saglayici: u.get("saglayici")!.slice(0, 30) } : {}),
    ...(u.get("klasor") ? { klasor: u.get("klasor")!.slice(0, 40) } : {}),
    ...(u.get("arsiv") === "1" ? { arsiv: true } : {}),
  };
  return Response.json({ ok: true, sonuclar: await sohbetAra(sahip, q, new Set(calisanSohbetler.keys()), f) });
}
