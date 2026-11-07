import { ajanGetir, ajanSayacArtir, surumAyari } from "@/lib/build/ajanDepo";
import { ajanCalistir } from "@/lib/build/ajanCalistir";
import { yonlendirmeliCalistir } from "@/lib/build/ajanYonlendir";
import { calismaGetir } from "@/lib/build/ajanCalismaDepo";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { denemeOku, denemeSil, denemeYaz, type DenemeSohbet } from "@/lib/build/ziyaretciDepo";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const calisan = new Map<string, AbortController>();
const bos = (hedef: DenemeSohbet["hedef"] = "taslak"): DenemeSohbet => ({ mesajlar: [], gecmis: [], olusturma: Date.now(), guncelleme: Date.now(), hedef });

/** Deneme sohbeti: mesajlar, hedef (taslak ya da yayındaki sürüm), onay bekleyen mesaj. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await ajanGetir(id, sahip))) return hata("Ajan bulunamadı.", 404);
  const d = (await denemeOku(id)) ?? bos();
  return Response.json({ ok: true, mesajlar: d.mesajlar, hedef: d.hedef, bekleyen: d.bekleyen?.asistanId ?? null, calisiyor: calisan.has(id) });
}

/**
 * Deneme turu (NDJSON akışı, olaylar sohbet motoruyla aynı + calisma, kaynaklar). Gövde:
 *  { metin } yeni mesaj · { onay: { karar: "onay" | "ret", hep? } } bekleyen araç çağrılarına karar ·
 *  { hedef: "taslak" | "yayin", yeni?: true } hedefi değiştirip sohbeti sıfırlar.
 * Taslak düzenleyicideki kaydedilmiş ayarlarla, yayın hedefi yayındaki sürümle çalışır; her tur çalışma geçmişine
 * "Deneme" kanalıyla yazılır.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const ajan = await ajanGetir(id, sahip);
  if (!ajan) return hata("Ajan bulunamadı.", 404);
  let g: { metin?: string; onay?: { karar: "onay" | "ret"; hep?: boolean }; hedef?: "taslak" | "yayin"; yeni?: boolean };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (calisan.has(id)) return hata("Bu denemede yanıt sürüyor.", 409);

  let d = (await denemeOku(id)) ?? bos();
  if (g.yeni || (g.hedef && g.hedef !== d.hedef)) { d = bos(g.hedef ?? d.hedef); await denemeYaz(id, d); if (!g.metin && !g.onay) return Response.json({ ok: true, mesajlar: [], hedef: d.hedef }); }
  const yayin = d.hedef === "yayin" && ajan.yayin.durum === "yayinda" ? ajan.surumler.find((s) => s.no === ajan.yayin.surum) : undefined;
  if (d.hedef === "yayin" && !yayin) return hata("Bu ajan yayında değil; taslakla dene.");
  const ayar = yayin ? yayin.ayar : surumAyari(ajan);

  let devam: Parameters<typeof ajanCalistir>[0]["devam"];
  let iptal: Parameters<typeof ajanCalistir>[0]["iptal"];
  if (g.onay) {
    if (!d.bekleyen) return hata("Onay bekleyen bir işlem yok.");
    const c = await calismaGetir(d.bekleyen.ajanId ?? id, d.bekleyen.calisma);
    const a = d.mesajlar.find((m) => m.id === d.bekleyen!.asistanId);
    if (!c || !a) return hata("Onay bekleyen işlem bulunamadı.");
    devam = { cagrilar: d.bekleyen.cagrilar, ret: g.onay.karar === "ret", hep: !!g.onay.hep, calisma: c, asistan: a };
    d.bekleyen = undefined;
  } else {
    const metin = String(g.metin ?? "").trim().slice(0, 30000);
    if (!metin) return hata("Mesaj boş.");
    const dn = icerikDenetle(metin);
    if (!dn.izin) return hata(dn.mesaj, 422);
    if (d.bekleyen) {
      const a = d.mesajlar.find((m) => m.id === d.bekleyen!.asistanId);
      a?.parcalar?.forEach((p, i) => { if (p.tur === "arac" && p.durum === "onay") a.parcalar![i] = { ...p, durum: "reddedildi", baslik: "Onaylanmadı" }; });
      if (a) a.durum = "bitti";
      iptal = d.bekleyen.cagrilar;
      d.bekleyen = undefined;
    }
    await ajanSayacArtir(id, (x) => { x.istatistik.mesaj += 1; });
  }

  const durdur = new AbortController();
  calisan.set(id, durdur);
  req.signal.addEventListener("abort", () => durdur.abort());
  const kodla = new TextEncoder();
  const akis = new ReadableStream<Uint8Array>({
    async start(ct) {
      let kapali = false;
      const yaz = (o: Record<string, unknown>) => { if (!kapali) try { ct.enqueue(kodla.encode(JSON.stringify(o) + "\n")); } catch { kapali = true; } };
      try {
        const r = await yonlendirmeliCalistir({
          ajan, ayar, sahipOz: sahipOzeti(sahip), sahip, kanal: "test", surum: yayin ? yayin.no : null, mod: "sahip",
          konusma: d, kaydet: () => denemeYaz(id, d), metin: g.metin, yaz, signal: durdur.signal, devam, iptal, konusmaId: "deneme",
        });
        if (r.calisma.durum === "girdi-bekliyor" && r.bekleyen?.length) d.bekleyen = { asistanId: r.asistan.id, cagrilar: r.bekleyen, calisma: r.calisma.id, ajanId: r.calisma.ajanId };
        await denemeYaz(id, d);
      } catch (e) { yaz({ t: "hata", mesaj: (e as Error).message }); }
      finally { calisan.delete(id); kapali = true; try { ct.close(); } catch { /* kapalı */ } }
    },
  });
  return new Response(akis, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}

/** Yanıtı durdurur; ?sifirla=1 sohbeti siler. */
export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await ajanGetir(id, sahip))) return hata("Ajan bulunamadı.", 404);
  calisan.get(id)?.abort();
  if (new URL(req.url).searchParams.get("sifirla")) await denemeSil(id);
  return Response.json({ ok: true });
}
