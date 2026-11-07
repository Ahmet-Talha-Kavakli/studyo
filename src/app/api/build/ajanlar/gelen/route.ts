import { ajanGetir } from "@/lib/build/ajanDepo";
import { gorunumIslem, gorunurGorunumler, gelenAyarOku, gelenAyarYaz, gelenListesi, konusmaGorunum, slaDenetle, temsilciDurumYaz, temsilciIslem, topluIslem, type GelenSekme, type TemsilciGovde } from "@/lib/build/ajanGelen";
import { kisiGetir, kisiOzeti } from "@/lib/build/ajanKisi";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { konusmaGuncelle, type Oncelik } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
const SEKMELER: GelenSekme[] = ["bekliyor", "bende", "acik", "cozuldu", "hepsi"];
const sonDenetim = new Map<string, number>();

/**
 * Canlı destek gelen kutusu: bütün ajanların konuşmaları. ?sekme= bekliyor | bende | acik | cozuldu | hepsi,
 * ?ajan= ?kanal= ?etiket= ?ara= ?atanan= (ben | atanmamis | temsilci) ?oncelik= ?sla= (yaklasiyor | asildi) süzgeçleri;
 * ?ajan=<id>&k=<konuşma> tek konuşma (okundu sayılır, kişi özetiyle); ?ayar=1 gelen kutusu ayarı. Bu cihazda seçili
 * temsilci x-vayra-temsilci başlığıyla gelir ("Bende" ve roller onunla çalışır).
 */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const sahipOz = sahipOzeti(sahip);
  const u = new URL(req.url).searchParams;
  const ben = req.headers.get("x-vayra-temsilci") ?? u.get("ben") ?? undefined;
  if (u.get("ayar")) { const ay = await gelenAyarOku(sahipOz); return Response.json({ ok: true, ayar: { ...ay, gorunumler: gorunurGorunumler(ay.gorunumler, ben) } }); }
  const ajanId = u.get("ajan") ?? "", k = u.get("k");
  if (k) {
    const a = await ajanGetir(ajanId, sahip);
    if (!a) return hata("Ajan bulunamadı.", 404);
    const v = await konusmaGuncelle(ajanId, k, (x) => { x.okunmadi = false; }, true);
    if (!v || typeof v === "string") return hata("Konuşma bulunamadı.", 404);
    const ayar = await gelenAyarOku(sahipOz);
    const kisi = v.kisi ? await kisiGetir(sahipOz, v.kisi) : null;
    return Response.json({
      ok: true, konusma: konusmaGorunum(k, v, ayar.sla), ajan: { id: a.id, ad: a.ad, simge: a.simge, etiketler: a.konular.etiketler.map((e) => e.ad), csat: a.yayin.kutu.csat },
      kisi: kisi ? { ...kisiOzeti(kisi), notlar: kisi.notlar.slice(-5), ozellikler: kisi.ozellikler, konusmalar: kisi.konusmalar.filter((c) => !(c.ajanId === ajanId && c.dosyaId === k)).slice(0, 8), oneriler: kisi.oneriler } : null,
    });
  }
  if (u.get("sayac")) { const s = await gelenListesi(sahipOz, { sekme: "bekliyor", ben }); return Response.json({ ok: true, bekliyor: s.sayilar.bekliyor, okunmamis: s.olcu.okunmamis, slaAsilan: s.olcu.slaAsilan }); }
  // SLA aşım bildirimi: gelen kutusu açıkken de dakikada bir denetlenir (zamanlayıcı da çalıştırır).
  if (Date.now() - (sonDenetim.get(sahipOz) ?? 0) > 60_000) { sonDenetim.set(sahipOz, Date.now()); slaDenetle(sahipOz).catch(() => 0); }
  const sekme = SEKMELER.includes(u.get("sekme") as GelenSekme) ? (u.get("sekme") as GelenSekme) : "bekliyor";
  const oncelik = (["acil", "yuksek", "normal", "dusuk"] as const).includes(u.get("oncelik") as Oncelik) ? (u.get("oncelik") as Oncelik) : undefined;
  const sla = u.get("sla") === "asildi" || u.get("sla") === "yaklasiyor" ? (u.get("sla") as "asildi" | "yaklasiyor") : undefined;
  const v = await gelenListesi(sahipOz, { sekme, ben, ajan: ajanId || undefined, kanal: u.get("kanal") ?? undefined, etiket: u.get("etiket") ?? undefined, ara: u.get("ara")?.slice(0, 80) ?? undefined, atanan: u.get("atanan")?.slice(0, 20) || undefined, oncelik, sla });
  return Response.json({ ok: true, sekme, ...v });
}

/**
 * { ayar } gelen kutusu ayarı (ekip, atama ve SLA yalnız yönetici) · { durum, temsilci } bu cihazdaki temsilcinin
 * durumu · { toplu: { ogeler, islem, ... } } seçili konuşmalara toplu işlem · { ajan, k, islem, ... } tek konuşmada
 * temsilci işlemi (Konuşmalar ile aynı).
 */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const sahipOz = sahipOzeti(sahip);
  let g: TemsilciGovde & { ajan?: string; ayar?: Parameters<typeof gelenAyarYaz>[1]; tdurum?: "cevrimici" | "mesgul" | "cevrimdisi"; gorunum?: Parameters<typeof gorunumIslem>[1]; toplu?: { ogeler?: { ajan: string; k: string }[]; islem?: string; etiket?: string; temsilci?: string; oncelik?: Oncelik; durum?: string } } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const ben = req.headers.get("x-vayra-temsilci") ?? g.ben ?? undefined;
  const ayar = await gelenAyarOku(sahipOz);
  const rol = ben ? ayar.ekip.find((t) => t.id === ben)?.rol ?? "yonetici" : "yonetici";
  if (g.ayar) { if (rol === "izleyici") return hata("İzleyici rolündesin; ayarları değiştiremezsin.", 403); const ay = await gelenAyarYaz(sahipOz, g.ayar, rol); return Response.json({ ok: true, ayar: { ...ay, gorunumler: gorunurGorunumler(ay.gorunumler, ben) } }); }
  if (g.gorunum) { const r = await gorunumIslem(sahipOz, g.gorunum, ben, rol); return r.hata ? hata(r.hata, 403) : Response.json({ ok: true, gorunumler: r.gorunumler }); }
  if (g.tdurum) { if (!ben) return hata("Önce bu cihazda kim olduğunu seç."); return Response.json({ ok: true, ayar: await temsilciDurumYaz(sahipOz, ben, g.tdurum) }); }
  if (g.toplu) {
    const ogeler = (g.toplu.ogeler ?? []).filter((o) => o && typeof o.ajan === "string" && typeof o.k === "string");
    if (!ogeler.length) return hata("Konuşma seçilmedi.");
    const r = await topluIslem(sahip, sahipOz, ogeler, { islem: g.toplu.islem, etiket: g.toplu.etiket, temsilci: g.toplu.temsilci, oncelik: g.toplu.oncelik, durum: g.toplu.durum as TemsilciGovde["durum"], ben });
    return Response.json({ ok: true, ...r });
  }
  const a = await ajanGetir(String(g.ajan ?? ""), sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  const r = await temsilciIslem(a, sahip, sahipOz, { ...g, ben });
  if (r.hata) return hata(r.hata, r.kod ?? 400);
  return Response.json({ ok: true, ...r });
}
