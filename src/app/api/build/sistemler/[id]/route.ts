import { randomBytes } from "crypto";
import { anahtarDiziniDegistir, calismaOzetleri, calismalariOku, sistemAcik, sistemGetir, sistemGuncelle, sistemSil, surumleriOku, webhookOzeti, type Sistem } from "@/lib/build/sistemDepo";
import { duzListe, type Tetikleyici } from "@/lib/build/sistemKatalog";
import { adimlariTemizle, etiketTemizle, girdiTemizle, kimlikleriTekle, notlarTemizle, tetikTemizle } from "@/lib/build/sistemTemizle";
import { modelBul } from "@/lib/build/modeller";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { yeniGenelAnahtar } from "@/lib/build/sistemGenel";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const yok = () => hata("Sistem bulunamadı.", 404);
const koken = (req: Request) => new URL(req.url).origin.replace("0.0.0.0", "localhost");

/** Sistem + son çalışma özetleri + en son çalışmanın tamamı (tuvaldeki durum noktaları için) + sürüm listesi. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const s = await sistemGetir(id, sahip);
  if (!s) return yok();
  const ozet = (await calismaOzetleri(id)).slice(0, 40);
  const son = ozet[0] ? (await calismalariOku(id, 1))[0] ?? null : null;
  const surumler = (await surumleriOku(id)).map(({ adimlar: _a, tetikler: _t, ...v }) => ({ ...v, adimSayisi: duzListe(_a).length }));
  return Response.json({ ok: true, sistem: sistemAcik(s), calismalar: ozet, sonCalisma: son, surumler });
}

/**
 * Güncelle: ad, aciklama, durum (acik/taslak), tetikler, adimlar, ayar; test (deneme verisi: tetik, sabit);
 * { webhookYenile: true } yeni webhook anahtarı. Açmak için yayında bir sürüm olmalı (yoksa taslak yayınlanır).
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: Partial<Omit<Sistem, "test" | "ayar" | "disari">> & { webhookYenile?: boolean; epostaYenile?: boolean; formYenile?: boolean; sohbetYenile?: boolean; ayar?: Partial<Sistem["ayar"]>; test?: { tetik?: unknown; sabit?: string[]; sabitTetik?: unknown; dinle?: boolean } };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  let anahtar: string | undefined;
  let yeniEposta: { eski?: string; yeni: string } | undefined;
  const yeniGenel: { tur: "form" | "sohbet"; eski?: string; yeni: string }[] = [];
  const r = await sistemGuncelle((await params).id, sahip, (s) => {
    s.koken = koken(req);
    if (typeof g.ad === "string") s.ad = g.ad.trim().slice(0, 80) || "Adsız sistem";
    if (typeof g.aciklama === "string") s.aciklama = g.aciklama.slice(0, 400);
    if (Array.isArray(g.tetikler)) s.tetikler = g.tetikler.map((t) => tetikTemizle(t as never)).filter((x): x is Tetikleyici => !!x).slice(0, 6);
    if (Array.isArray(g.adimlar)) s.adimlar = kimlikleriTekle(adimlariTemizle(g.adimlar));
    if (Array.isArray(g.notlar)) s.notlar = notlarTemizle(g.notlar);
    if (Array.isArray(g.girdi)) s.girdi = girdiTemizle(g.girdi);
    if (Array.isArray(g.etiketler)) s.etiketler = etiketTemizle(g.etiketler);
    if (typeof g.yildiz === "boolean") s.yildiz = g.yildiz || undefined;
    if (g.ayar) {
      if (typeof g.ayar.model === "string") s.ayar.model = modelBul(g.ayar.model).id;
      if (typeof g.ayar.krediTavani === "number") s.ayar.krediTavani = Math.max(5, Math.min(5000, Math.round(g.ayar.krediTavani)));
      if (typeof g.ayar.esZamanli === "number") s.ayar.esZamanli = Math.max(1, Math.min(10, Math.round(g.ayar.esZamanli)));
      if (typeof g.ayar.hataSistemi === "string") s.ayar.hataSistemi = /^[A-Za-z0-9_-]{10}$/.test(g.ayar.hataSistemi) && g.ayar.hataSistemi !== s.id ? g.ayar.hataSistemi : undefined;
      if (typeof g.ayar.hataWebhook === "string") s.ayar.hataWebhook = /^https?:\/\/\S{4,500}$/.test(g.ayar.hataWebhook.trim()) ? g.ayar.hataWebhook.trim() : undefined;
      if (g.ayar.dakika !== undefined) s.ayar.dakika = Number(g.ayar.dakika) > 0 ? Math.min(10_000, Math.round(Number(g.ayar.dakika) * 10) / 10) : undefined;
      if (g.ayar.hiz !== undefined) { const h = g.ayar.hiz as { sayi?: number; dakika?: number } | null; s.ayar.hiz = h && Number(h.sayi) > 0 ? { sayi: Math.max(1, Math.min(1000, Math.round(Number(h.sayi)))), dakika: Math.max(1, Math.min(1440, Math.round(Number(h.dakika) || 1))) } : undefined; }
      if (g.ayar.hataEposta !== undefined) { const e = g.ayar.hataEposta as { alici?: string; mod?: string } | null; const l = String(e?.alici ?? "").split(",").map((x) => x.trim()).filter((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)).slice(0, 5); s.ayar.hataEposta = l.length ? { alici: l.join(", "), mod: e?.mod === "gunluk" ? "gunluk" : "anlik" } : undefined; if (!l.length) s.bildirimSorunu = undefined; }
      if (g.ayar.aralik !== undefined) s.ayar.aralik = Number(g.ayar.aralik) > 0 ? Math.max(1, Math.min(3600, Math.round(Number(g.ayar.aralik)))) : undefined;
      if (g.ayar.zamanAsimi !== undefined) s.ayar.zamanAsimi = Number(g.ayar.zamanAsimi) > 0 ? Math.max(1, Math.min(10, Math.round(Number(g.ayar.zamanAsimi)))) : undefined;
    }
    if (g.test && typeof g.test === "object") {
      s.test ??= {};
      if ("tetik" in g.test) { if (JSON.stringify(g.test.tetik ?? null).length > 60_000) return "Deneme verisi çok büyük."; s.test.tetik = g.test.tetik; }
      if (Array.isArray(g.test.sabit)) s.test.sabit = g.test.sabit.filter((x) => typeof x === "string").slice(0, 80);
      if ("sabitTetik" in g.test) { if (JSON.stringify(g.test.sabitTetik ?? null).length > 60_000) return "Sabit tetik verisi çok büyük."; s.test.sabitTetik = g.test.sabitTetik === null ? undefined : g.test.sabitTetik; }
      if (typeof g.test.dinle === "boolean") s.test.dinle = g.test.dinle ? Date.now() + 3 * 60_000 : undefined;
    }
    if (g.durum === "acik" || g.durum === "taslak") {
      if (g.durum === "acik") {
        const akis = s.yayin ?? { tetikler: s.tetikler, adimlar: s.adimlar };
        if (!akis.adimlar.length) return "Açmadan önce en az bir adım ekle ve yayınla.";
        for (const t of akis.tetikler) {
          if (t.tur === "form" && !t.projeId) return "Form tetiği için proje seç.";
          if (t.tur === "veri" && (!t.projeId || !t.koleksiyon)) return "Veri tablosu tetiği için proje ve tablo seç.";
          if (t.tur === "rss" && !t.adres) return "RSS tetiği için akış adresini yaz.";
          if (t.tur === "odeme" && !t.projeId) return "Ödeme tetiği için projeyi seç.";
          if (t.tur === "sistem" && !t.sistemId) return "Hangi sistemin bitişini dinleyeceğini seç.";
        }
        // Hiç yayınlanmamışsa taslak ilk sürüm olarak yayınlanır (sürüm kaydını /surumler yazar; burada kopya).
        if (!s.yayin) return "YAYINLA";
      }
      if (g.durum === "acik" && s.durum !== "acik") s.acilis = Date.now();
      s.durum = g.durum; s.duraklatmaNedeni = undefined; s.ayar.ustUsteHata = 0;
    }
    if (g.webhookYenile || (s.tetikler.some((t) => t.tur === "webhook") && !s.webhookOzeti)) {
      anahtar = randomBytes(18).toString("base64url");
      s.webhookOzeti = webhookOzeti(anahtar);
      for (const t of s.tetikler) if (t.tur === "webhook") t.anahtarSonu = anahtar.slice(-4);
      if (s.yayin) for (const t of s.yayin.tetikler) if (t.tur === "webhook") t.anahtarSonu = anahtar.slice(-4);
    }
    for (const t of s.tetikler) if (t.tur === "webhook" && t.dogrulama === "") t.dogrulama = randomBytes(12).toString("base64url");
    // Test web kancası anahtarı (test adresi yalnız deneme verisi alır) ve sisteme özel gelen e-posta adresi.
    if (s.tetikler.some((t) => t.tur === "webhook" || t.tur === "formSayfasi" || t.tur === "sohbet") && !s.testAnahtari) s.testAnahtari = randomBytes(12).toString("base64url");
    // Form sayfası ve sohbet: herkese açık adresin anahtarı (yenilenirse eski adres çalışmaz).
    if ((s.tetikler.some((t) => t.tur === "formSayfasi") && !s.formAnahtari) || (g.formYenile && s.formAnahtari)) { const y = yeniGenelAnahtar(); yeniGenel.push({ tur: "form", eski: s.formAnahtari, yeni: y }); s.formAnahtari = y; }
    if ((s.tetikler.some((t) => t.tur === "sohbet") && !s.sohbetAnahtari) || (g.sohbetYenile && s.sohbetAnahtari)) { const y = yeniGenelAnahtar(); yeniGenel.push({ tur: "sohbet", eski: s.sohbetAnahtari, yeni: y }); s.sohbetAnahtari = y; }
    if ((s.tetikler.some((t) => t.tur === "eposta") && !s.epostaAnahtari) || (g.epostaYenile && s.epostaAnahtari)) {
      const yeni = randomBytes(9).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "x").slice(0, 12);
      yeniEposta = { eski: s.epostaAnahtari, yeni };
      s.epostaAnahtari = yeni;
    }
  });
  if (yeniEposta && r?.sistem) { const y = yeniEposta, sid = r.sistem.id; await anahtarDiziniDegistir((d) => { if (y.eski) delete d[`eposta:${y.eski}`]; d[`eposta:${y.yeni}`] = sid; }); }
  if (yeniGenel.length && r?.sistem) { const sid = r.sistem.id; await anahtarDiziniDegistir((d) => { for (const y of yeniGenel) { if (y.eski) delete d[`${y.tur}:${y.eski}`]; d[`${y.tur}:${y.yeni}`] = sid; } }); }
  if (!r) return yok();
  if (r.hata === "YAYINLA") return hata("Açmadan önce sistemi yayınla.", 409);
  if (!r.sistem) return hata(r.hata);
  return Response.json({ ok: true, sistem: sistemAcik(r.sistem), ...(anahtar ? { webhookAnahtari: anahtar } : {}) });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  return (await sistemSil((await params).id, sahip)) ? Response.json({ ok: true }) : yok();
}
