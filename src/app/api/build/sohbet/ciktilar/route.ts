import { ciktilariTopla } from "@/lib/build/sohbetCikti";
import { sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Bütün sohbetlerde üretilen çıktılar (dosyalar, görseller, videolar, sesler, HTML, görselleştirmeler). */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, ciktilar: [] });
  return Response.json({ ok: true, ciktilar: await ciktilariTopla(sahip) });
}
