import { kilitAcik, kilitliYanit } from "@/lib/build/sohbetKilit";
import { jsonBul, tekSeferlik } from "@/lib/build/sohbetCagri";
import { sohbetGetir, sohbetKaydet } from "@/lib/build/sohbetDepo";
import { asistanMetni } from "@/lib/build/sohbetGecmis";
import { mesajaKadar } from "@/lib/build/sohbetYol";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { buildKrediKes, buildKrediYeterli } from "@/lib/hesap/buildKredi";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const SISTEM = `Sen Vayra'nın takip soruları öneriyorsun. Sohbetin son kısmına bakıp kullanıcının bir sonraki adımda sormak isteyebileceği 3 kısa soru ya da istek yaz.
Kurallar: kullanıcının ağzından yaz (ben dili), her biri en çok 70 karakter, birbirinden farklı yönlerde (derinleş, uygula, karşılaştır), soruyu tekrar etme, emoji yok, sohbetin dilinde yaz.
Yalnız şu JSON'u döndür: {"oneriler": ["...", "...", "..."]}`;

/** Son yanıtın takip soruları (Perplexity'deki ilgili sorular gibi): { mesajId } → { oneriler, kredi }. Bir kez üretilir. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sohbetGetir((await params).id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  if (!kilitAcik(req, s)) return kilitliYanit();
  let g: { mesajId?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const m = s.mesajlar.find((x) => x.id === g.mesajId && x.rol === "asistan");
  if (!m || m.durum !== "bitti") return hata("Yanıt bulunamadı.", 404);
  if (m.oneriler) return Response.json({ ok: true, oneriler: m.oneriler, kredi: 0 });
  const yol = mesajaKadar(s.mesajlar, m.id).slice(-4);
  const metin = yol.map((x) => `${x.rol === "kullanici" ? "Kullanıcı" : "Vayra"}: ${(x.rol === "kullanici" ? x.metin ?? "" : asistanMetni(x)).slice(0, 3000)}`).join("\n\n");
  if (!metin.trim()) return Response.json({ ok: true, oneriler: [], kredi: 0 });
  if (await buildKrediYeterli(sahip)) return Response.json({ ok: true, oneriler: [], kredi: 0 });
  const r = await tekSeferlik({ model: s.model, sistem: SISTEM, ileti: metin, efor: "low" });
  if ("hata" in r) return hata(r.hata, r.durum);
  const j = jsonBul<{ oneriler?: unknown[] }>(r.metin);
  const oneriler = (j?.oneriler ?? []).map((x) => String(x ?? "").replace(/\s+/g, " ").trim().slice(0, 120)).filter((x) => x.length > 3).slice(0, 3);
  m.oneriler = oneriler;
  await sohbetKaydet(s, sahip);
  const k = await buildKrediKes(sahip, r.kredi, { kaynak: "build:sohbet", is: `oneri:${s.id}:${m.id}`, aciklama: "Sohbet: takip soruları" });
  return Response.json({ ok: true, oneriler, kredi: Math.round(r.kredi * 100) / 100, ...(k ? { bakiye: k.bakiye } : {}) });
}
