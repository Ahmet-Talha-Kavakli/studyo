import { projeErisimi, projeOkuHam } from "@/lib/build/depo";
import { bulutAyarOku } from "@/lib/build/bulutAyar";
import { gunlukYaz } from "@/lib/build/gunluk";
import { sahipAl } from "@/lib/build/sunucu";
import { AI_VARSAYILAN, aiGorsel, aiKullanim, aiMetin, aiMotoru, aiSay, type AiMesaj } from "@/lib/build/yapayZeka";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; islem: string }> };

/**
 * Vayra Yapay Zekâ geçidi (yayındaki site ve önizleme için).
 *  POST /api/build/ai/<proje>/sohbet  { metin } ya da { mesajlar: [{rol, metin}] }, isteğe bağlı { sistem, enCok }  → { metin }
 *  POST /api/build/ai/<proje>/gorsel  { istem, oran }                                                            → { url }
 *  GET  /api/build/ai/<proje>/durum   (yalnız sahip) kullanım ve motor durumu
 * Önizleme (x-vayra-onizleme) ve sahip her zaman kullanabilir; ziyaretçi için proje yayında ve geçit açık olmalı.
 */
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-vayra-onizleme, x-build-sahip" };
const yanit = (v: unknown, durum = 200) => new Response(JSON.stringify(v), { status: durum, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS } });
const red = (hata: string, durum: number) => yanit({ ok: false, hata }, durum);

const sayac = new Map<string, number[]>();
function sinirli(anahtar: string, adet: number) {
  const s = Date.now(), l = (sayac.get(anahtar) ?? []).filter((t) => s - t < 60_000);
  l.push(s); sayac.set(anahtar, l);
  return l.length > adet;
}

async function baglam(req: Request, ctx: Ctx) {
  const { id, islem } = await ctx.params;
  const p = await projeOkuHam(id);
  if (!p) return null;
  const sahip = sahipAl(req);
  const erisim = sahip ? await projeErisimi(id, sahip) : null;
  const sahipMi = erisim === "sahip" || erisim === "duzenleyici";
  const onizleme = !!req.headers.get("x-vayra-onizleme") && req.headers.get("x-vayra-onizleme") === p.onizlemeBelirteci;
  const ayar = { ...AI_VARSAYILAN, ...(p.ayarlar.ai ?? {}) };
  return { id, islem, p, sahipMi, yetkili: sahipMi || onizleme, ayar };
}

export async function GET(req: Request, ctx: Ctx) {
  const b = await baglam(req, ctx);
  if (!b) return red("Proje yok.", 404);
  if (b.islem !== "durum" || !b.sahipMi) return red("Yetki yok.", 403);
  return yanit({ ok: true, ayar: b.ayar, kullanim: await aiKullanim(b.id), motor: aiMotoru() });
}

export async function POST(req: Request, ctx: Ctx) {
  const b = await baglam(req, ctx);
  if (!b) return red("Proje yok.", 404);
  if (b.islem !== "sohbet" && b.islem !== "gorsel") return red("Bilinmeyen işlem.", 404);
  if (!b.yetkili) {
    if (!b.p.yayin) return red("Bu site yayında değil.", 403);
    if (!b.ayar.acik) return red("Bu sitede yapay zekâ kapalı. Site sahibi Bulut bölümünden açabilir.", 403);
    if ((await bulutAyarOku(b.id)).aiDuraklat) return red("Bu sitede yapay zekâ geçici olarak duraklatıldı.", 503);
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
  if (sinirli(`${b.id}:${ip}`, b.islem === "gorsel" ? 4 : 12)) return red("Çok fazla istek; biraz bekle.", 429);
  let g: Record<string, unknown>; try { g = await req.json(); } catch { return red("Geçersiz gövde.", 400); }
  const bas = Date.now();
  const sinir = b.yetkili ? undefined : Math.max(1, b.ayar.gunlukSinir);

  if (b.islem === "sohbet") {
    const mesajlar: AiMesaj[] = Array.isArray(g.mesajlar)
      ? (g.mesajlar as { rol?: string; metin?: unknown }[]).filter((m) => typeof m?.metin === "string").map((m) => ({ rol: m.rol === "asistan" ? "asistan" : "kullanici", metin: String(m.metin).slice(0, 8000) }))
      : typeof g.metin === "string" ? [{ rol: "kullanici", metin: g.metin.slice(0, 8000) }] : [];
    if (!mesajlar.length) return red("metin ya da mesajlar gerekli.", 400);
    const son = mesajlar.at(-1)!.metin;
    const d = icerikDenetle(son);
    if (!d.izin) return red(d.mesaj, 422);
    if (!(await aiSay(b.id, "metin", sinir))) return red("Bu sitenin bugünkü yapay zekâ sınırı doldu. Yarın yeniden dene.", 429);
    const sistem = [
      `Sen "${b.p.ad}" adlı sitenin yapay zekâ yardımcısısın. Kullanıcıyla onun dilinde, kısa ve doğru konuş.`,
      b.ayar.sistem && `Site sahibinin talimatı (her şeyin üstünde): ${b.ayar.sistem}`,
      typeof g.sistem === "string" && g.sistem.trim() && `Sitenin bu istek için verdiği bağlam: ${g.sistem.slice(0, 4000)}`,
    ].filter(Boolean).join("\n\n");
    try {
      const metin = await aiMetin({ sistem, mesajlar, enCok: Math.min(2000, Math.max(64, Number(g.enCok) || 800)), signal: req.signal });
      gunlukYaz(b.id, { t: "ai", d: 200, ms: Date.now() - bas, m: `Metin: ${son.slice(0, 120)}` });
      return yanit({ ok: true, metin });
    } catch (e) {
      await aiSay(b.id, "hata");
      const m = (e as Error).message;
      gunlukYaz(b.id, { t: "ai", d: 503, ms: Date.now() - bas, m: `Metin hatası: ${m.slice(0, 160)}` });
      return red(m === "AI_YOK" ? "Yapay zekâ motoru bu sunucuya bağlı değil." : "Yapay zekâ şu an yanıt veremedi.", 503);
    }
  }

  const istem = typeof g.istem === "string" ? g.istem.trim().slice(0, 2000) : "";
  if (!istem) return red("istem gerekli.", 400);
  const d = icerikDenetle(istem);
  if (!d.izin) return red(d.mesaj, 422);
  const oran = ["1:1", "16:9", "4:3", "3:4", "9:16"].includes(String(g.oran)) ? String(g.oran) : "1:1";
  if (!(await aiSay(b.id, "gorsel", sinir))) return red("Bu sitenin bugünkü yapay zekâ sınırı doldu. Yarın yeniden dene.", 429);
  try {
    const url = await aiGorsel(istem, oran);
    gunlukYaz(b.id, { t: "ai", d: 200, ms: Date.now() - bas, m: `Görsel: ${istem.slice(0, 120)}` });
    return yanit({ ok: true, url });
  } catch (e) {
    await aiSay(b.id, "hata");
    gunlukYaz(b.id, { t: "ai", d: 503, ms: Date.now() - bas, m: `Görsel hatası: ${(e as Error).message.slice(0, 160)}` });
    return red((e as Error).message === "GORSEL_YOK" ? "Görsel motoru bu sunucuya bağlı değil." : "Görsel şu an üretilemedi.", 503);
  }
}

export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
