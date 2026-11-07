import { gecitAraclari, gecitleriListele, gecitOlustur } from "@/lib/build/baglantiGecit";
import { sahipOzeti } from "@/lib/build/depo";
import { istekKokeni } from "@/lib/build/mcpOauth";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Sahibin ağ geçitleri, her birinin şu an sunduğu araç sayısı ve uç nokta adresi. */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const oz = sahipOzeti(sahip);
  const l = await gecitleriListele(sahip);
  const gecitler = await Promise.all(l.map(async (g) => ({ ...g, aracSayisi: (await gecitAraclari(g, oz)).araclar.length })));
  return Response.json({ ok: true, adres: `${istekKokeni(req)}/api/build/baglantilar/gecit/mcp`, gecitler });
}

/** Yeni ağ geçidi: { ad, secim: [{ baglantiId, araclar: "*" | [...] }], onayliDahil, saltOkunur }. Anahtar yalnız bu yanıtta gelir. */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { ad?: string; secim?: unknown; onayliDahil?: boolean; saltOkunur?: boolean } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (!Array.isArray(g.secim) || !g.secim.length) return hata("En az bir bağlantı seç.");
  if ((await gecitleriListele(sahip)).length >= 20) return hata("En çok 20 ağ geçidi kurulabilir.");
  const r = await gecitOlustur(sahip, g);
  return Response.json({ ok: true, ...r, aracSayisi: (await gecitAraclari(r.gecit, sahipOzeti(sahip))).araclar.length });
}
