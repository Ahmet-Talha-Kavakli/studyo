import { projeOku } from "@/lib/build/depo";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { bulutAyarOku } from "@/lib/build/bulutAyar";
import { epostaGonder, epostaKurulu } from "@/lib/build/bulutEposta";
import { epostaAlanDenetle, epostaAlanEkle, EpostaAlanHatasi, epostaAlanKaldir } from "@/lib/build/bulutEpostaAlan";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * E-posta gönderen alan adı (Resend). GET → { kurulu, epostaAlan }
 * POST { islem: "ekle", alan, yerel?, ad? } | { islem: "denetle" } | { islem: "kaldir" } | { islem: "dene", kime }
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  return Response.json({ ok: true, kurulu: epostaKurulu(), epostaAlan: (await bulutAyarOku(p.id)).epostaAlan });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const p = await projeOku(id, sahip);
  if (!p) return bulunamadi();
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  let g: { islem?: string; alan?: string; yerel?: string; ad?: string; kime?: string } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  const kim = await denetimKim(id, sahip);
  try {
    if (g.islem === "ekle") { const e = await epostaAlanEkle(id, { alan: String(g.alan ?? ""), yerel: g.yerel, ad: g.ad }); denetimYaz(id, { tur: "alan", kim, mesaj: `E-posta gönderen alan adı eklendi: ${e.gonderen}` }); return Response.json({ ok: true, epostaAlan: e }); }
    if (g.islem === "denetle") return Response.json({ ok: true, epostaAlan: await epostaAlanDenetle(id) });
    if (g.islem === "kaldir") { await epostaAlanKaldir(id); denetimYaz(id, { tur: "alan", kim, mesaj: "E-posta gönderen alan adı kaldırıldı" }); return Response.json({ ok: true, epostaAlan: null }); }
    if (g.islem === "dene") {
      const kime = String(g.kime ?? "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kime)) return hata("Geçerli bir e-posta yaz.");
      const r = await epostaGonder({ projeId: id, kime, konu: `${p.ad}: deneme e-postası`, metin: "Bu e-posta sitenin kendi alan adından gönderim denemesidir.", site: p.ad });
      return r.ok ? Response.json({ ok: true }) : hata(r.hata, 502);
    }
    return hata("Bilinmeyen işlem.");
  } catch (e) { return hata(e instanceof EpostaAlanHatasi ? e.message : "İşlem yapılamadı.", e instanceof EpostaAlanHatasi ? 400 : 500); }
}
