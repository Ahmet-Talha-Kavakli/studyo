import { baglantiGetir, mcpAracYurut, okumaAraci } from "@/lib/build/baglantiDepo";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Araç deneme alanı: { arac, girdi, onay? } aracı sahibin kimliğiyle elle çağırır. Sabit alanlar, hız sınırları ve
 * denetim kaydı gerçek çağrıdaki gibi uygulanır (kaynak "deneme"). Yazma araçları açık onay ister (onay: true);
 * salt okunur modda yazma araçları çalışmaz. Yanıt: modelin göreceği metin, ham yanıt ve süre.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const b = await baglantiGetir(id, sahip);
  if (!b) return hata("Bağlantı bulunamadı.", 404);
  let g: { arac?: string; girdi?: unknown; onay?: boolean } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const a = b.araclar.find((x) => x.name === g.arac);
  if (!a) return hata("Araç bulunamadı.", 404);
  const okuma = okumaAraci(a);
  if (!okuma && b.saltOkunur) return hata("Bağlantı salt okunur; yazma araçları çalışmaz.", 403);
  if (!okuma && !g.onay) return hata("Bu araç veri değiştirir; çalıştırmak için onay ver.", 428);
  if (b.durum !== "etkin") return hata(b.hata ?? "Bağlantı sağlıklı değil; önce bağlantıyı yenile.", 409);
  if (g.girdi !== undefined && (typeof g.girdi !== "object" || Array.isArray(g.girdi) || JSON.stringify(g.girdi).length > 100_000)) return hata("Girdi bir JSON nesnesi olmalı.");
  const r = await mcpAracYurut({ baglantiId: b.id, arac: a.name, ad: `${b.ad}: ${a.name}`, izin: "her-zaman", okuma }, g.girdi ?? {}, sahipOzeti(sahip), "deneme", { ham: true });
  return Response.json({ ok: true, metin: r.icerik, hata: !!r.hata, sinir: !!r.sinir, ham: r.ham ?? null, sure: r.sure ?? 0, gorseller: r.gorseller ?? [] });
}
