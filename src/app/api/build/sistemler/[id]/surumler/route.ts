import { sistemAcik, sistemGetir, sistemGuncelle, surumAdiDegistir, surumEkle, surumleriOku, type Surum } from "@/lib/build/sistemDepo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Yayınlanan sürümler (yeniden eskiye, akışlarıyla; fark ve önizleme için). */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const s = await sistemGetir(id, sahip);
  if (!s) return hata("Sistem bulunamadı.", 404);
  return Response.json({ ok: true, surumler: await surumleriOku(id), yayinda: s.yayin?.surum ?? null });
}

/**
 * { islem: "yayinla", ad?, not?, ac? } taslağı yeni sürüm olarak yayınlar (ac: sistemi de açar);
 * { islem: "geriYukle", no } sürümü taslağa kopyalar (yayını değiştirmez); { islem: "adDegistir", no, ad, not? }.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  let g: { islem?: string; ad?: string; not?: string; ac?: boolean; no?: number } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (g.islem === "adDegistir") {
    const ad = String(g.ad ?? "").trim().slice(0, 80);
    if (!ad) return hata("Sürüm adı yaz.");
    if (!(await sistemGetir(id, sahip))) return hata("Sistem bulunamadı.", 404);
    return (await surumAdiDegistir(id, Number(g.no), ad, typeof g.not === "string" ? g.not.slice(0, 600) : undefined)) ? Response.json({ ok: true }) : hata("Sürüm bulunamadı.", 404);
  }
  if (g.islem === "geriYukle") {
    if (!(await sistemGetir(id, sahip))) return hata("Sistem bulunamadı.", 404);
    const v = (await surumleriOku(id)).find((x) => x.no === Number(g.no));
    if (!v) return hata("Sürüm bulunamadı.", 404);
    const r = await sistemGuncelle(id, sahip, (s) => {
      const son = s.tetikler.find((t) => t.tur === "webhook")?.anahtarSonu;
      s.adimlar = JSON.parse(JSON.stringify(v.adimlar));
      s.tetikler = v.tetikler.map((t) => (t.tur === "webhook" ? { ...t, anahtarSonu: son ?? t.anahtarSonu } : t));
    });
    if (!r?.sistem) return hata("Sistem bulunamadı.", 404);
    return Response.json({ ok: true, sistem: sistemAcik(r.sistem) });
  }
  if (g.islem !== "yayinla") return hata("Bilinmeyen işlem.");
  let surum: Surum | null = null;
  const r = await sistemGuncelle(id, sahip, (s) => {
    if (!s.adimlar.length) return "Yayınlamadan önce en az bir adım ekle.";
    if (g.ac) for (const t of s.tetikler) {
      if (t.tur === "form" && !t.projeId) return "Form tetiği için proje seç.";
      if (t.tur === "veri" && (!t.projeId || !t.koleksiyon)) return "Veri tablosu tetiği için proje ve tablo seç.";
      if (t.tur === "rss" && !t.adres) return "RSS tetiği için akış adresini yaz.";
      if (t.tur === "odeme" && !t.projeId) return "Ödeme tetiği için projeyi seç.";
      if (t.tur === "sistem" && !t.sistemId) return "Hangi sistemin bitişini dinleyeceğini seç.";
    }
    const no = Math.max(s.surumSayaci ?? 0, s.yayin?.surum ?? 0) + 1;
    const zaman = Date.now();
    surum = { no, ad: String(g.ad ?? "").trim().slice(0, 80) || `Sürüm ${no}`, not: String(g.not ?? "").slice(0, 600), zaman, tetikler: JSON.parse(JSON.stringify(s.tetikler)), adimlar: JSON.parse(JSON.stringify(s.adimlar)), model: s.ayar.model };
    s.yayin = { surum: no, zaman, tetikler: surum.tetikler, adimlar: surum.adimlar };
    s.surumSayaci = no;
    if (g.ac) { if (s.durum !== "acik") s.acilis = Date.now(); s.durum = "acik"; s.duraklatmaNedeni = undefined; s.ayar.ustUsteHata = 0; }
  });
  if (!r) return hata("Sistem bulunamadı.", 404);
  if (!r.sistem) return hata(r.hata);
  await surumEkle(id, surum!);
  return Response.json({ ok: true, sistem: sistemAcik(r.sistem), surum });
}
