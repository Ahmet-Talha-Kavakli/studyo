import { belgeBilgisi, dosyaOlustur } from "@/lib/build/belgeDepo";
import { mdBloklari } from "@/lib/build/sohbetDisa";
import { sohbetGetir } from "@/lib/build/sohbetDepo";
import { sonIcerik, surumEkle, tuvalDegistir, tuvalDuzenle, tuvalGetir, tuvalSonucu } from "@/lib/build/sohbetTuval";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { buildKrediKes, buildKrediYeterli } from "@/lib/hesap/buildKredi";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ tid: string }> };

/** Tuval (bütün sürümleriyle). */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const t = await tuvalGetir((await params).tid, sahip);
  if (!t) return hata("Tuval bulunamadı.", 404);
  return Response.json({ ok: true, tuval: t });
}

/** Elle düzenleme: { icerik, not?, kaynak?: "oneri" } yeni sürüm (art arda elle kayıtlar birleşir); { baslik } adlandırır. */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).tid;
  let g: { icerik?: unknown; baslik?: unknown; not?: unknown; kaynak?: unknown };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (typeof g.baslik === "string" && g.baslik.trim() && typeof g.icerik !== "string") {
    const r = await tuvalDegistir(id, sahip, (t) => { t.baslik = String(g.baslik).trim().slice(0, 120); });
    if (!r || "hata" in r) return hata("Tuval bulunamadı.", 404);
    return Response.json({ ok: true, tuval: r.tuval });
  }
  if (typeof g.icerik !== "string") return hata("İçerik gerekli.");
  const oneri = g.kaynak === "oneri";
  const r = await surumEkle(id, sahip, g.icerik, oneri ? "vayra" : "sen", typeof g.not === "string" ? g.not : oneri ? "Öneri uygulandı" : undefined);
  if (!r || "hata" in r) return hata("Tuval bulunamadı.", 404);
  return Response.json({ ok: true, tuval: r.tuval, sonuc: tuvalSonucu(r.tuval) });
}

/**
 * { islem: "secim", secim: { bas?, son?, metin }, talimat } seçili parçayı, { islem: "tum", talimat | kisayol, param }
 * bütün tuvali yapay zekâyla değiştirir (yeni sürüm, kredi döner); { islem: "oneri" } düzeltme önerileri (kaydetmez);
 * { islem: "geriYukle", no } eski sürümü yeni sürüm olarak geri getirir; { islem: "docx" } Word dosyası üretir.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).tid;
  const t = await tuvalGetir(id, sahip);
  if (!t) return hata("Tuval bulunamadı.", 404);
  let g: { islem?: string; talimat?: string; kisayol?: string; param?: string | number; secim?: { bas?: number; son?: number; metin: string }; no?: number; model?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (g.islem === "geriYukle") {
    const v = t.surumler.find((x) => x.no === Number(g.no));
    if (!v) return hata("Sürüm bulunamadı.", 404);
    const r = await surumEkle(id, sahip, v.icerik, "sen", `Sürüm ${v.no} geri yüklendi`);
    if (!r || "hata" in r) return hata("Geri yüklenemedi.");
    return Response.json({ ok: true, tuval: r.tuval });
  }
  if (g.islem === "docx") {
    if (t.tip !== "belge") return hata("Word dosyası yalnız belge tuvalinden üretilir.");
    try {
      const md = sonIcerik(t);
      const ilk = /^#\s+(.+)$/m.exec(md);
      const { kayit } = await dosyaOlustur("docx", { ad: t.baslik, ...(ilk ? {} : { baslik: t.baslik }), bloklar: mdBloklari(md) }, { sahip, sohbet: t.sohbet });
      return Response.json({ ok: true, dosya: belgeBilgisi(kayit) });
    } catch (e) { return hata((e as Error).message || "Word dosyası üretilemedi.", 500); }
  }
  if (g.islem !== "secim" && g.islem !== "tum" && g.islem !== "oneri") return hata("Bilinmeyen işlem.");
  const engel = await buildKrediYeterli(sahip);
  if (engel) return hata(engel, 402);
  const s = await sohbetGetir(t.sohbet, sahip);
  const r = await tuvalDuzenle(t, { islem: g.islem, talimat: g.talimat, kisayol: g.kisayol, param: g.param, secim: g.secim, model: g.model || s?.model || "" });
  if ("hata" in r) return hata(r.hata, r.durum);
  const k = await buildKrediKes(sahip, r.kredi, { kaynak: "build:sohbet", is: `tuval:${id}:${Date.now()}:${Math.random()}`, aciklama: `Tuval: ${t.baslik}` });
  const bakiye = k ? { bakiye: k.bakiye } : {};
  if ("oneriler" in r) return Response.json({ ok: true, oneriler: r.oneriler, kredi: Math.round(r.kredi * 100) / 100, ...bakiye });
  const y = await surumEkle(id, sahip, r.yeni, "vayra", r.not, r.dil ? { dil: r.dil } : undefined);
  if (!y || "hata" in y) return hata("Tuval kaydedilemedi.");
  return Response.json({ ok: true, tuval: y.tuval, kredi: Math.round(r.kredi * 100) / 100, ...bakiye });
}
