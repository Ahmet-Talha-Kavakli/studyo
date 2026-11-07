import { projeOku } from "@/lib/build/depo";
import { yardimciModel } from "@/lib/build/ajanZeka";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { buyumeGuncelle, buyumeOku, isBasla, isBitir, surenler } from "@/lib/build/buyumeDepo";
import {
  gonderiNormalize, konuNormalize, kullaniciGirdisi, makaleNormalize, planNormalize, reklamNormalize, TONLAR,
  HEDEFLER, ICERIK_KANALLARI, type BuyumeVeri, type HedefId, type IcerikKanalId,
} from "@/lib/build/buyumeTipler";
import { blogKonulari, gonderiGorseli, gonderiUret, makaleYaz, ModelYok, planUret, reklamUret, UretimHatasi } from "@/lib/build/buyumeZeka";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { buildKrediYeterli, yanittanKes } from "@/lib/hesap/buildKredi";
import { ekOku } from "@/lib/build/buyumeEkDepo";
import { markaIstemi } from "@/lib/build/buyumeEkTipler";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Büyüme ajanı (pazarlama): plan, gönderiler, görseller, reklam metinleri, blog ve lansman işaretleri.
 *  GET            veri + bağlı model + süren işler
 *  PATCH          kullanıcı düzenlemesi (plan, gönderi, reklam, blog, kontrol); alan alan birleşir
 *  POST {islem}   üretim: plan | icerik | benzer | gorsel | reklam | blog-konu | makale
 * Model bağlı değilse 424 { modelYok: true } döner; arayüz sahte içerik göstermez.
 */
async function sahipVeProje(req: Request, ctx: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return { yanit: yetkisiz() } as const;
  const id = (await ctx.params).id;
  const p = await projeOku(id, sahip);
  if (!p) return { yanit: bulunamadi() } as const;
  if (req.method !== "GET") { const engel = await izleyiciEngeli(id, sahip); if (engel) return { yanit: engel } as const; }
  return { p, id } as const;
}
const yanit = (veri: BuyumeVeri, ek: Record<string, unknown> = {}) => Response.json({ ok: true, veri, ...ek });

export async function GET(req: Request, ctx: Ctx) {
  const s = await sahipVeProje(req, ctx);
  if ("yanit" in s) return s.yanit;
  return yanit(await buyumeOku(s.id), { model: yardimciModel()?.ad ?? null, suren: surenler(s.id) });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const s = await sahipVeProje(req, ctx);
  if ("yanit" in s) return s.yanit;
  const ham = await req.text();
  if (ham.length > 600_000) return hata("İstek çok büyük.", 413);
  let g: Record<string, unknown>;
  try { g = JSON.parse(ham); } catch { return hata("Geçersiz istek."); }
  try {
    const v = await buyumeGuncelle(s.id, (v) => kullaniciGirdisi(() => {
      if ("plan" in g) v.plan = g.plan ? planNormalize(g.plan) : null;
      if (g.oncekiPlanaDon && v.oncekiPlan) { const o = v.plan; v.plan = v.oncekiPlan; v.oncekiPlan = o; }
      if (g.gonderi && typeof g.gonderi === "object") {
        const gelen = g.gonderi as Record<string, unknown>;
        const i = v.gonderiler.findIndex((x) => x.id === gelen.id);
        if (i < 0) throw new Error("Gönderi bulunamadı.");
        // Görsel alanı yalnız sunucuda yazılır; istemci yalnız kaldırabilir.
        const { gorsel: _g, gorselHata: _h, ...geri } = gelen; void _g; void _h;
        const y = gonderiNormalize({ ...v.gonderiler[i], ...geri, id: v.gonderiler[i].id, olusturma: v.gonderiler[i].olusturma });
        if (gelen.gorselKaldir) { y.gorsel = undefined; y.gorselHata = undefined; }
        if ("tarih" in gelen && !gelen.tarih) y.tarih = undefined;
        v.gonderiler[i] = y;
      }
      if (typeof g.gonderiSil === "string") v.gonderiler = v.gonderiler.filter((x) => x.id !== g.gonderiSil);
      if ("reklam" in g) v.reklam = g.reklam ? reklamNormalize(g.reklam) : null;
      if (Array.isArray(g.konular)) v.blog.konular = g.konular.slice(0, 30).map(konuNormalize);
      if (g.makale && typeof g.makale === "object") {
        const m = makaleNormalize(g.makale);
        const i = v.blog.makaleler.findIndex((x) => x.id === m.id);
        if (i < 0) v.blog.makaleler.unshift(m); else v.blog.makaleler[i] = { ...m, olusturma: v.blog.makaleler[i].olusturma };
      }
      if (typeof g.makaleSil === "string") v.blog.makaleler = v.blog.makaleler.filter((x) => x.id !== g.makaleSil);
      if (g.kontrol && typeof g.kontrol === "object") for (const [k, d] of Object.entries(g.kontrol as Record<string, unknown>).slice(0, 40)) if (/^[a-z0-9-]{2,30}$/.test(k)) { if (d === true) v.kontrol[k] = true; else delete v.kontrol[k]; }
    }));
    return yanit(v);
  } catch (e) { return hata(e instanceof Error ? e.message : "Kaydedilemedi."); }
}

/** Yapay zekâ kullanan işlemlerin bedeli sunucuda düşülür (yanıttaki kredi). */
export async function POST(req: Request, ctx: Ctx) {
  const sahip = sahipAl(req);
  if (sahip) { const engel = await buildKrediYeterli(sahip); if (engel) return hata(engel, 402); }
  return yanittanKes(await postIsle(req, ctx), sahip, { kaynak: "build:buyume", aciklama: "Büyüme: yapay zekâ işlemi" });
}

async function postIsle(req: Request, ctx: Ctx) {
  const s = await sahipVeProje(req, ctx);
  if ("yanit" in s) return s.yanit;
  const { p, id } = s;
  // Marka kitinin sesi ve yasaklı sözcükleri bütün üretimlere gider (proje kopyası yalnız bu istekte değişir).
  { const mi = markaIstemi((await ekOku(id)).marka); if (mi) p.ayarlar = { ...p.ayarlar, talimat: [p.ayarlar.talimat.trim(), mi].filter(Boolean).join("\n\n") }; }
  let g: Record<string, unknown>;
  try { g = JSON.parse((await req.text()).slice(0, 100_000)); } catch { return hata("Geçersiz istek."); }
  const islem = String(g.islem ?? "");
  const kisa = (x: unknown, n: number) => (typeof x === "string" ? x.trim().slice(0, n) : "");
  const isAd = islem === "gorsel" || islem === "benzer" ? `${islem}:${kisa(g.gonderiId, 20)}` : islem === "makale" ? `makale:${kisa(g.konuId, 20)}` : islem;
  if (!["plan", "icerik", "benzer", "gorsel", "reklam", "blog-konu", "makale"].includes(islem)) return hata("Bilinmeyen işlem.");
  if (!isBasla(id, isAd)) return hata("Bu iş zaten sürüyor; bitince burada görünecek.", 409);
  try {
    const v0 = await buyumeOku(id);
    if (islem === "plan") {
      const hedef = (HEDEFLER.some((h) => h.id === g.hedef) ? g.hedef : "ziyaretci") as HedefId;
      const sinir = Number(g.butceSiniri);
      const r = await planUret(p, { hedef, hedefOzel: kisa(g.hedefOzel, 160) || undefined, butceSiniri: Number.isFinite(sinir) && sinir > 0 ? Math.round(Math.min(sinir, 10_000_000)) : undefined, not: kisa(g.not, 600) || undefined });
      const v = await buyumeGuncelle(id, (v) => { if (v.plan) v.oncekiPlan = v.plan; v.plan = r.plan; });
      return yanit(v, { kredi: r.kredi });
    }
    if (islem === "icerik" || islem === "benzer") {
      const ornek = islem === "benzer" ? v0.gonderiler.find((x) => x.id === g.gonderiId) : undefined;
      if (islem === "benzer" && !ornek) return hata("Gönderi bulunamadı.", 404);
      const kanal = (ornek?.kanal ?? (ICERIK_KANALLARI.some((k) => k.id === g.kanal) ? g.kanal : "instagram")) as IcerikKanalId;
      const ok = g.ozelKanal && typeof g.ozelKanal === "object" ? g.ozelKanal as Record<string, unknown> : null;
      const ozelKanal = ornek?.ozelKanal ?? (kanal === "ozel" && ok ? { ad: kisa(ok.ad, 40) || "Özel kanal", sinir: Math.min(20000, Math.max(20, Number(ok.sinir) || 1000)), oran: kisa(ok.oran, 8) || "1:1" } : undefined);
      const ton = ornek?.ton ?? (TONLAR.some((t) => t.id === g.ton && t.id !== "ozel") ? String(g.ton) : kisa(g.tonOzel, 80) || "samimi");
      const r = await gonderiUret(p, v0.plan, { kanal, ozelKanal, konu: ornek?.konu ?? kisa(g.konu, 300), ton, adet: islem === "benzer" ? 3 : Math.min(5, Math.max(1, Number(g.adet) || 3)), ornek,
        tarih: typeof g.tarih === "string" ? g.tarih : undefined, takvimId: typeof g.takvimId === "string" ? g.takvimId.slice(0, 20) : undefined });
      const v = await buyumeGuncelle(id, (v) => {
        if (ornek) { const i = v.gonderiler.findIndex((x) => x.id === ornek.id); v.gonderiler.splice(i < 0 ? 0 : i + 1, 0, ...r.gonderiler); }
        else v.gonderiler.unshift(...r.gonderiler);
        v.gonderiler = v.gonderiler.slice(0, 300);
      });
      return yanit(v, { kredi: r.kredi, yeni: r.gonderiler.map((x) => x.id) });
    }
    if (islem === "gorsel") {
      const gon = v0.gonderiler.find((x) => x.id === g.gonderiId);
      if (!gon) return hata("Gönderi bulunamadı.", 404);
      if (typeof g.gorselIstemi === "string" && g.gorselIstemi.trim()) gon.gorselIstemi = g.gorselIstemi.trim().slice(0, 1500);
      try {
        const url = await gonderiGorseli(p, gon);
        const v = await buyumeGuncelle(id, (v) => { const x = v.gonderiler.find((y) => y.id === gon.id); if (x) { x.gorsel = url; x.gorselHata = undefined; x.gorselIstemi = gon.gorselIstemi; x.guncelleme = Date.now(); } });
        return yanit(v, { kredi: 2 });
      } catch (e) {
        const mesaj = e instanceof Error ? e.message : "Görsel üretilemedi.";
        const v = await buyumeGuncelle(id, (v) => { const x = v.gonderiler.find((y) => y.id === gon.id); if (x) { x.gorselHata = mesaj; x.gorselIstemi = gon.gorselIstemi; } });
        return Response.json({ ok: false, hata: mesaj, veri: v }, { status: 502 });
      }
    }
    if (islem === "reklam") {
      const r = await reklamUret(p, v0.plan);
      const v = await buyumeGuncelle(id, (v) => { v.reklam = r.reklam; });
      return yanit(v, { kredi: r.kredi });
    }
    if (islem === "blog-konu") {
      const r = await blogKonulari(p, v0.plan, g.yeni ? v0.blog.konular : []);
      const v = await buyumeGuncelle(id, (v) => { v.blog.konular = r.konular; v.blog.konuZaman = Date.now(); });
      return yanit(v, { kredi: r.kredi });
    }
    // makale
    const konu = v0.blog.konular.find((k) => k.id === g.konuId);
    if (!konu) return hata("Konu bulunamadı.", 404);
    const r = await makaleYaz(p, konu);
    const v = await buyumeGuncelle(id, (v) => { v.blog.makaleler = [r.makale, ...v.blog.makaleler.filter((m) => m.konuId !== konu.id)].slice(0, 40); });
    return yanit(v, { kredi: r.kredi, makaleId: r.makale.id });
  } catch (e) {
    if (e instanceof ModelYok) return Response.json({ ok: false, modelYok: true, hata: e.message }, { status: 424 });
    if (e instanceof UretimHatasi) return hata(e.message, 502);
    return hata(e instanceof Error ? `Üretim yarıda kaldı: ${e.message.slice(0, 160)}` : "Üretim yarıda kaldı.", 500);
  } finally { isBitir(id, isAd); }
}
