import { bildirimOz } from "@/lib/build/bildirim";
import { istekKimligi, istekSahipOzeti, yorumKimligi, yorumlariDegistir, yorumlariOku, type Yorum } from "@/lib/build/sohbetOrtak";
import { paylasimGuncelle, paylasimOku, paylasimRolu, type Paylasim } from "@/lib/build/sohbetPaylasim";
import { hata } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ pid: string }> };

async function baglam(req: Request, pid: string): Promise<{ p: Paylasim; rol: ReturnType<typeof paylasimRolu>; kimlik: ReturnType<typeof istekKimligi> } | Response> {
  const p = await paylasimOku(pid);
  if (!p) return hata("Paylaşım bulunamadı.", 404);
  const kimlik = istekKimligi(req);
  const rol = paylasimRolu(p, { sahipOz: istekSahipOzeti(req), eposta: kimlik?.eposta });
  if (!rol) return hata("Bu sohbet kişiye özel.", 403);
  return { p, rol, kimlik };
}
/** Yorumu yazan ya da sohbetin sahibi mi. */
const yetkili = (y: Yorum, rol: string | null, eposta?: string) => rol === "sahip" || (!!eposta && y.yazar.eposta === eposta);
const acik = (y: Yorum, eposta?: string) => ({ ...y, yazar: { ad: y.yazar.ad, sahip: y.yazar.sahip }, benim: !!eposta && y.yazar.eposta === eposta });

/** Yorumlar (erişimi olan herkes okur). Davetlinin son görülme zamanı güncellenir. */
export async function GET(req: Request, { params }: Ctx) {
  const b = await baglam(req, (await params).pid);
  if (b instanceof Response) return b;
  if (b.kimlik && b.rol !== "sahip") await paylasimGuncelle(b.p.id, (x) => { const d = x.davetliler?.find((y) => y.eposta === b.kimlik!.eposta); if (d) d.sonGorulme = Date.now(); });
  const l = await yorumlariOku(b.p.id);
  return Response.json({ ok: true, rol: b.rol, kimlik: b.kimlik ? { ad: b.kimlik.ad } : null, yorumlar: l.map((y) => acik(y, b.kimlik?.eposta)) });
}

/** Yeni yorum: { mesajId, metin, alinti?, ust? }. Yalnız sahip ve "yorum" rolündeki davetliler yazar. */
export async function POST(req: Request, { params }: Ctx) {
  const b = await baglam(req, (await params).pid);
  if (b instanceof Response) return b;
  if (b.rol !== "sahip" && b.rol !== "yorum") return hata(b.kimlik ? "Bu sohbette yalnız görüntüleme iznin var." : "Yorum yazmak için davet edildiğin e-postayla giriş yap.", 403);
  let g: { mesajId?: string; metin?: string; alinti?: string; ust?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const metin = String(g.metin ?? "").trim().slice(0, 4000);
  if (!metin) return hata("Yorum boş.");
  if (!b.p.mesajlar.some((m) => m.id === g.mesajId)) return hata("Yorumlanan mesaj bulunamadı.");
  const yazar: Yorum["yazar"] = b.rol === "sahip" ? { ad: b.kimlik?.ad ?? b.p.sahipAd ?? "Sohbetin sahibi", sahip: true, ...(b.kimlik ? { eposta: b.kimlik.eposta } : {}) } : { ad: b.kimlik!.ad, eposta: b.kimlik!.eposta };
  const y: Yorum = { id: yorumKimligi(), mesajId: g.mesajId!, metin, yazar, zaman: Date.now(), ...(typeof g.alinti === "string" && g.alinti.trim() ? { alinti: g.alinti.trim().slice(0, 600) } : {}), ...(typeof g.ust === "string" ? { ust: g.ust } : {}) };
  const tamam = await yorumlariDegistir(b.p.id, (l) => { if (l.length >= 2000) return false; if (y.ust && !l.some((x) => x.id === y.ust)) delete y.ust; l.push(y); return true; });
  if (!tamam) return hata("Bu sohbette yorum sınırına ulaşıldı.");
  // Sohbetin sahibine bildirim (sahibin kendi yorumu bildirilmez).
  if (b.rol !== "sahip") await bildirimOz(b.p.sahip, { tur: "yorum", baslik: `${yazar.ad} yorum yazdı`, metin: `"${b.p.baslik}": ${metin.slice(0, 200)}`, adres: `/panel/build/sohbet/${b.p.sohbet}?yorumlar=1`, kaynak: { tur: "yorum", id: b.p.id, ad: b.p.baslik } }).catch(() => {});
  return Response.json({ ok: true, yorum: acik(y, b.kimlik?.eposta ?? y.yazar.eposta) });
}

/** { id, metin?, cozuldu? }: metni yalnız yazan değiştirir; çözüldü işaretini yazan ya da sahip koyar. */
export async function PATCH(req: Request, { params }: Ctx) {
  const b = await baglam(req, (await params).pid);
  if (b instanceof Response) return b;
  let g: { id?: string; metin?: string; cozuldu?: boolean };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const r = await yorumlariDegistir(b.p.id, (l) => {
    const y = l.find((x) => x.id === g.id);
    if (!y) return "yok";
    if (!yetkili(y, b.rol, b.kimlik?.eposta)) return "yetki";
    if (typeof g.metin === "string" && g.metin.trim()) {
      const yazan = (!!b.kimlik && y.yazar.eposta === b.kimlik.eposta) || (b.rol === "sahip" && !!y.yazar.sahip);
      if (!yazan) return "yetki";
      y.metin = g.metin.trim().slice(0, 4000); y.duzenleme = Date.now();
    }
    if (typeof g.cozuldu === "boolean") y.cozuldu = g.cozuldu || undefined;
    return "ok";
  });
  if (r === "yok") return hata("Yorum bulunamadı.", 404);
  if (r === "yetki") return hata("Bu yorumu değiştiremezsin.", 403);
  return Response.json({ ok: true });
}

/** ?id=<yorum>: yazan ya da sahip siler (yanıtlarıyla birlikte). */
export async function DELETE(req: Request, { params }: Ctx) {
  const b = await baglam(req, (await params).pid);
  if (b instanceof Response) return b;
  const id = new URL(req.url).searchParams.get("id");
  const r = await yorumlariDegistir(b.p.id, (l) => {
    const y = l.find((x) => x.id === id);
    if (!y) return "yok";
    if (!yetkili(y, b.rol, b.kimlik?.eposta)) return "yetki";
    for (let i = l.length - 1; i >= 0; i--) if (l[i].id === id || l[i].ust === id) l.splice(i, 1);
    return "ok";
  });
  if (r === "yok") return hata("Yorum bulunamadı.", 404);
  if (r === "yetki") return hata("Bu yorumu silemezsin.", 403);
  return Response.json({ ok: true });
}
