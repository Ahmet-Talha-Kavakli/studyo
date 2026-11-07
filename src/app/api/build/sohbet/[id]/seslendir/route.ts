import { kilitAcik, kilitliYanit } from "@/lib/build/sohbetKilit";
import { ciktiKalicilastir } from "@/lib/dosyaDepo";
import { saglayiciSec } from "@/lib/saglayicilar";
import { sohbetGetir, sohbetKaydet } from "@/lib/build/sohbetDepo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { buildKrediKes, buildKrediYeterli } from "@/lib/hesap/buildKredi";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Yanıtı Vayra ses stüdyosunun sağlayıcısıyla seslendirir: { mesajId } → { url, kredi }. Bir kez üretilir, sonra önbellekten. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sohbetGetir((await params).id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  if (!kilitAcik(req, s)) return kilitliYanit();
  let g: { mesajId?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const m = s.mesajlar.find((x) => x.id === g.mesajId && x.rol === "asistan");
  if (!m) return hata("Mesaj bulunamadı.", 404);
  if (m.ses) return Response.json({ ok: true, url: m.ses, kredi: 0 });
  const metin = (m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("")
    .replace(/<bellek-kaynak>[\s\S]*?<\/bellek-kaynak>/g, "").replace(/```[\s\S]*?```/g, " ").replace(/\[(\d+)\]\(#kaynak-\d+\)/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[#*_`>|]/g, "").replace(/\s+/g, " ").trim().slice(0, 5000);
  if (!metin) return hata("Okunacak metin yok.");
  const engel = await buildKrediYeterli(sahip);
  if (engel) return hata(engel, 402);
  const a = saglayiciSec("ses");
  if (a.ad === "simulasyon") return hata("Ses sağlayıcısı bağlı değil.", 501);
  try {
    const r = await a.uret({ tur: "ses", model: "", prompt: metin, meta: { mod: "seslendirme", dil: "tr" } });
    const k = r.ciktiUrl || r.dataUri;
    if (!k) return hata("Seslendirme yapılamadı.", 502);
    m.ses = await ciktiKalicilastir("ses", k, "audio/mpeg");
    await sohbetKaydet(s, sahip);
    const kes = await buildKrediKes(sahip, 1, { kaynak: "build:sohbet", is: `ses:${s.id}:${m.id}`, aciklama: "Sohbet: sesli okuma" });
    return Response.json({ ok: true, url: m.ses, kredi: 1, ...(kes ? { bakiye: kes.bakiye } : {}) });
  } catch {
    return hata("Seslendirme yapılamadı.", 502);
  }
}
