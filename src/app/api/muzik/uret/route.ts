import { NextRequest, NextResponse } from "next/server";
import { muzikDurumu, muzikUret, type MuzikIstek, type MuzikSonuc } from "@/lib/saglayicilar/muzik";
import { icerikDenetle } from "@/lib/moderasyon";
import { modelBul } from "@/lib/muzikVeri";
import { krediAl, sahteSaglayici, saglayiciyla } from "@/lib/hesap/krediKapi";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { muzikUretTutari } from "@/lib/krediTarife";

export const runtime = "nodejs";

/**
 * Gerçek müzik üretimi. Oturum gerekir (401). Sağlayıcı bağlı değilse 503 döner ve kredi kesilmez; istemci demo
 * moduna geçer. Bedel sunucuda (plan süresi ya da seçilen süre) hesaplanıp üretimden önce kesilir; kredi yetmezse
 * 402, sağlayıcı hata verirse iade.
 */
export async function POST(req: NextRequest) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const g = (await req.json().catch(() => null)) as (MuzikIstek & { kredi?: unknown }) | null;
  if (!g?.model) return NextResponse.json({ ok: false, hata: "Model seçilmedi." }, { status: 400 });
  const denetim = icerikDenetle([g.istem, g.sozler, ...(g.stiller ?? []), ...(g.plan?.bolumler.flatMap((b) => b.satirlar) ?? [])].filter(Boolean).join("\n"));
  if (!denetim.izin) return NextResponse.json({ ok: false, hata: denetim.mesaj }, { status: 400 });
  const m = modelBul(g.model);
  const bagli = muzikDurumu()[m.saglayici];
  if (!bagli && !sahteSaglayici(req)) return NextResponse.json({ ok: false, hata: `Müzik sağlayıcısı (${m.saglayici === "eleven" ? "ElevenLabs" : "Lyria"}) bağlı değil.` }, { status: 503 });
  const k = await krediAl(req, { oturum: o, kaynak: "muzik", aciklama: `Şarkı · ${m.ad}`, taban: muzikUretTutari(g), istemci: g.kredi, ucretli: bagli });
  if (k instanceof Response) return k;
  try {
    const { kredi: _k, ...istek } = g; void _k;
    const s = await saglayiciyla(k, () => muzikUret(istek), (): MuzikSonuc => ({ sesUrl: "/brand/vayra-logo-320.webm", saglayici: m.saglayici, model: m.ad, baslik: "Sınama parçası" }));
    if (req.signal.aborted) await k.iade("İstemci bağlantıyı kesti; şarkı teslim edilemedi");
    return NextResponse.json({ ok: true, ...s, ...k.alanlar() });
  } catch (e) {
    await k.iade("Sağlayıcı hatası: kredi iade edildi");
    const mesaj = String(e instanceof Error ? e.message : e).slice(0, 400);
    return NextResponse.json({ ok: false, hata: mesaj, ...k.alanlar() }, { status: /bağlı değil/.test(mesaj) ? 503 : 502 });
  }
}
