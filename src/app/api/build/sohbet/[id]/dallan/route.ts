import { kilitAcik, kilitliYanit } from "@/lib/build/sohbetKilit";
import { sohbetGetir, sohbetKaydet, sohbetOlustur, yeniMesajId, type SohbetMesaji } from "@/lib/build/sohbetDepo";
import { tuvalKopyala } from "@/lib/build/sohbetTuval";
import { mesajaKadar } from "@/lib/build/sohbetYol";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Bu mesajdan yeni sohbet (ChatGPT "Branch in new chat"): kökten o mesaja kadar yol yeni sohbete kopyalanır (API
 * geçmişiyle; model kaldığı yerden devam eder). Tuvaller kopyalanır, böylece yeni daldaki değişiklik eskisini bozmaz.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sohbetGetir((await params).id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  if (!kilitAcik(req, s)) return kilitliYanit();
  let g: { mesajId?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const yol = mesajaKadar(s.mesajlar, String(g.mesajId ?? ""));
  if (!yol.length) return hata("Mesaj bulunamadı.", 404);
  if (yol.some((m) => m.durum === "suruyor")) return hata("Yanıt bitmeden dallanamazsın.", 409);
  const y = await sohbetOlustur(sahip, s.model, { baslik: `${s.baslik.slice(0, 70)} (dal)`, klasor: s.klasor, gecici: s.gecici });
  const harita = new Map<string, string>();
  const tuvaller = new Map<string, string>();
  for (const tid of s.tuvaller ?? []) { const t = await tuvalKopyala(tid, sahip, y.id); if (t) tuvaller.set(tid, t.id); }
  const mesajlar: SohbetMesaji[] = yol.map((m) => {
    const id = yeniMesajId();
    harita.set(m.id, id);
    const parcalar = m.parcalar?.map((p) => (p.tur === "arac" && p.sonuc?.tur === "tuval" && tuvaller.has(p.sonuc.id) ? { ...p, sonuc: { ...p.sonuc, id: tuvaller.get(p.sonuc.id)! } } : p));
    const { oneriler: _o, ses: _s, ...x } = m; void _o; void _s;
    return { ...x, id, ust: m.ust ? harita.get(m.ust) ?? null : null, ...(parcalar ? { parcalar } : {}), ...(m.durum === "onay-bekliyor" || m.durum === "plan-bekliyor" ? { durum: "bitti" as const } : {}) };
  });
  y.mesajlar = mesajlar;
  y.ozetler = (s.ozetler ?? []).filter((o) => harita.has(o.sonMesaj)).map((o) => ({ ...o, sonMesaj: harita.get(o.sonMesaj)! }));
  y.tuvaller = [...tuvaller.values()];
  y.efor = s.efor; y.ogrenme = s.ogrenme; y.asistan = s.asistan; y.izinModu = s.izinModu;
  y.guncelleme = Date.now();
  await sohbetKaydet(y, sahip);
  return Response.json({ ok: true, id: y.id });
}
