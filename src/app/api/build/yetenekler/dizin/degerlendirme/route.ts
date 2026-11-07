import { degerlendirmeKaydet, degerlendirmeler, hedefGecerli } from "@/lib/build/yetenekDegerlendirme";
import { hata, sahipAl } from "@/lib/build/sunucu";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";

/** Bir dizin yeteneğinin değerlendirmeleri: ?hedef=vayra:<id> | anthropic:<ad>. Yorum sahipleri gösterilmez; kendi değerlendirmen "benim" olarak döner. */
export async function GET(req: Request) {
  const hedef = new URL(req.url).searchParams.get("hedef") ?? "";
  if (!hedefGecerli(hedef)) return hata("Geçersiz yetenek.", 400);
  return Response.json({ ok: true, ...(await degerlendirmeler(hedef, sahipAl(req))) });
}

/** { hedef, puan (1-5), yorum? }: değerlendirmeni ekler ya da günceller; { hedef, sil: true } kaldırır. Yorum içerik denetiminden geçer. */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: { hedef?: string; puan?: number; yorum?: string; sil?: boolean } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (!hedefGecerli(g.hedef ?? "")) return hata("Geçersiz yetenek.", 400);
  const yorum = String(g.yorum ?? "").trim().slice(0, 600);
  if (yorum) { const d = icerikDenetle(yorum); if (!d.izin) return hata(d.mesaj, 422); }
  const puan = Math.round(Number(g.puan));
  if (!g.sil && !(puan >= 1 && puan <= 5)) return hata("Puan 1 ile 5 arasında olmalı.");
  await degerlendirmeKaydet(g.hedef!, sahip, g.sil ? null : { puan, yorum });
  return Response.json({ ok: true, ...(await degerlendirmeler(g.hedef!, sahip)) });
}
