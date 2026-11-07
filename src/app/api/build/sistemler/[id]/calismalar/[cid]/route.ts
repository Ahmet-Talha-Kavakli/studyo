import { sahipOzeti } from "@/lib/build/depo";
import { calismaDegistir, calismaOku, calismaSil, sistemGetir, sistemGuncelle, surumOku } from "@/lib/build/sistemDepo";
import { calismaIptal, calismaSuruyor, calismaYenidenOynat, devamAdresi, hataAcikla, sistemBaslat } from "@/lib/build/sistemMotoru";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { yanittanKes } from "@/lib/hesap/buildKredi";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; cid: string }> };

/** Çalışmanın tamamı + çalışan akışın kopyası (salt okunur tuval için) + sürüm adı. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const { id, cid } = await params;
  const s = await sistemGetir(id, sahip);
  const c = s ? await calismaOku(id, cid) : null;
  if (!s || !c) return hata("Çalışma bulunamadı.", 404);
  let akis = c.akis, surumAdi: string | undefined;
  if (typeof c.surum === "number") { const v = await surumOku(id, c.surum); akis ??= v?.adimlar ?? (s.yayin?.surum === c.surum ? s.yayin.adimlar : undefined); surumAdi = v?.ad; }
  const { belirtec: _b, akis: _a, ...acik } = c; void _b; void _a;
  return Response.json({
    ok: true, calisma: { ...acik, devamAdresi: c.durum === "bekliyor" || c.durum === "calisiyor" ? devamAdresi(c) : undefined },
    akis: akis ?? s.adimlar, akisGuncel: !akis, surumAdi, suruyor: calismaSuruyor(cid),
    sistem: { id: s.id, ad: s.ad, durum: s.durum, model: s.ayar.model, yayin: s.yayin?.surum ?? null, tetikler: s.tetikler },
  });
}

/**
 * { islem }: "devam" hatalı adımdan sürdürür, "yeniden" aynı veriyle baştan çalıştırır, "test-verisi" tetik ve adım
 * çıktılarını düzenleyicinin deneme verisi yapar, "iptal" durdurur, "acikla" hatayı modelle açıklar.
 */
/** Yapay zekâ bedeli sunucuda düşülür (yanıttaki kredi). */
export async function POST(req: Request, ctx: Ctx) {
  return yanittanKes(await postIsle(req, ctx), sahipAl(req), { kaynak: "build:sistem", aciklama: "Sistem: çalışma açıklaması" });
}

async function postIsle(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const { id, cid } = await params;
  let g: { islem?: string; yenile?: boolean; adimId?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const s = await sistemGetir(id, sahip);
  const c = s ? await calismaOku(id, cid) : null;
  if (!s || !c) return hata("Çalışma bulunamadı.", 404);
  const oz = sahipOzeti(sahip);
  switch (g.islem) {
    case "devam": case "yeniden": {
      const r = await calismaYenidenOynat(id, oz, cid, g.islem);
      return "hata" in r ? hata(r.hata) : Response.json({ ok: true, calismaId: r.c.id });
    }
    case "adimdan": {
      // Bu çalışmanın verisini deneme verisi yapıp taslağı seçili adımdan başlatır.
      const aid = String(g.adimId ?? "");
      if (!/^[A-Za-z0-9_-]{1,16}$/.test(aid)) return hata("Adım seçilmedi.");
      await sistemGuncelle(id, sahip, (x) => {
        x.test ??= {}; x.test.adimlar ??= {};
        x.test.tetik = c.tetik.veri ?? {};
        for (const r of c.adimlar) if (r.durum === "basarili" && JSON.stringify(r.veri ?? null).length <= 30_000) x.test.adimlar[r.id] = { girdi: r.girdi, veri: r.veri, cikti: r.cikti?.slice(0, 5000), zaman: Date.now(), sure: r.sure, kaynak: "calisma" };
      });
      const s2 = await sistemGetir(id, sahip);
      const r = s2 ? await sistemBaslat(id, oz, { tur: "deneme", veri: c.tetik.veri ?? {} }, { zorla: true, baslangic: aid }) : null;
      if (!r) return hata("Bu adımdan başlatılamıyor: adım taslakta yok ya da döngü, paralel dal veya hata dalının içinde.");
      r.bitti.catch(() => {});
      await new Promise((x) => setTimeout(x, 300));
      return Response.json({ ok: true, calismaId: r.c.id });
    }
    case "iptal": {
      const h = await calismaIptal(id, oz, cid);
      return h ? hata(h) : Response.json({ ok: true });
    }
    case "test-verisi": {
      await sistemGuncelle(id, sahip, (x) => {
        x.test ??= {}; x.test.adimlar ??= {};
        x.test.tetik = c.tetik.veri ?? {};
        const gorulen = new Set<string>();
        for (const r of c.adimlar) {
          if (gorulen.has(r.id) || (r.durum !== "basarili" && r.durum !== "basarisiz")) continue;
          gorulen.add(r.id);
          if (JSON.stringify(r.veri ?? null).length > 30_000) continue;
          x.test.adimlar[r.id] = { girdi: r.girdi, veri: r.veri, cikti: r.cikti?.slice(0, 5000), hata: r.hata, zaman: Date.now(), sure: r.sure, kaynak: "calisma" };
        }
      });
      return Response.json({ ok: true });
    }
    case "acikla": {
      if (c.aciklama && !g.yenile) return Response.json({ ok: true, aciklama: c.aciklama });
      if (c.durum !== "basarisiz" && !c.adimlar.some((x) => x.durum === "basarisiz")) return hata("Bu çalışmada hata yok.");
      try {
        const r = await hataAcikla(s, c);
        const aciklama = { metin: r.metin.slice(0, 8000), zaman: Date.now() };
        await calismaDegistir(id, cid, (x) => { x.aciklama = aciklama; x.kredi += r.kredi; });
        return Response.json({ ok: true, aciklama, kredi: r.kredi });
      } catch (e) { return hata(`Açıklama alınamadı: ${(e as Error).message}`, 502); }
    }
  }
  return hata("Bilinmeyen işlem.");
}

export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const { id, cid } = await params;
  const s = await sistemGetir(id, sahip);
  const c = s ? await calismaOku(id, cid) : null;
  if (!s || !c) return hata("Çalışma bulunamadı.", 404);
  if (c.durum === "calisiyor" || c.durum === "bekliyor" || c.durum === "kuyrukta") return hata("Önce çalışmayı iptal et.");
  await calismaSil(id, cid);
  return Response.json({ ok: true });
}
