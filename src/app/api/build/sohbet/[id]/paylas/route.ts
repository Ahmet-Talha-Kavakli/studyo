import { kilitAcik, kilitliYanit } from "@/lib/build/sohbetKilit";
import { sohbetGetir, sohbetKaydet } from "@/lib/build/sohbetDepo";
import { EPOSTA, davetBildir, epostaTemizle, istekKimligi, ortakEkle, ortakSil, yorumlariOku, yorumlariSil } from "@/lib/build/sohbetOrtak";
import { paylasimGuncelle, paylasimOku, paylasimSil, paylasimYaz, type DavetRolu, type Paylasim } from "@/lib/build/sohbetPaylasim";
import { epostaKurulu } from "@/lib/build/bulutEposta";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const DAVET_SINIRI = 50;
const gorunum = async (p: Paylasim) => {
  const yorumlar = await yorumlariOku(p.id);
  return { id: p.id, url: `/s/b/${p.id}`, zaman: p.guncelleme, erisim: p.erisim ?? "herkes", davetliler: p.davetliler ?? [], yorum: yorumlar.filter((y) => !y.cozuldu).length, yorumToplam: yorumlar.length, epostaKurulu: epostaKurulu() };
};

/** Paylaşımın durumu: erişim, davetliler, yorum sayısı. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sohbetGetir((await params).id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  const p = s.paylasim ? await paylasimOku(s.paylasim.id) : null;
  return Response.json({ ok: true, paylasim: p ? await gorunum(p) : null });
}

/** Paylaşım bağlantısı oluştur ya da güncelle (sohbetin şu anki hâli): → { id, url, zaman } */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sohbetGetir((await params).id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  if (s.gecici) return hata("Geçici sohbetler paylaşılamaz.", 400);
  if (!kilitAcik(req, s)) return kilitliYanit();
  if (!s.mesajlar.length) return hata("Paylaşılacak mesaj yok.");
  const p = await paylasimYaz(s, sahip);
  const k = istekKimligi(req);
  if (k && p.sahipAd !== k.ad) await paylasimGuncelle(p.id, (x) => { x.sahipAd = k.ad; });
  s.paylasim = { id: p.id, zaman: p.guncelleme };
  await sohbetKaydet(s, sahip);
  return Response.json({ ok: true, id: p.id, url: `/s/b/${p.id}`, zaman: p.guncelleme, paylasim: await gorunum(p) });
}

/**
 * Kişiye özel paylaşım: { erisim?: "herkes" | "davetli", davet?: { epostalar: string[], rol }, rol?: { eposta, rol }, cikar?: eposta }.
 * Davet edilene hesabı varsa bildirim, e-posta servisi kuruluysa e-posta gider.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sohbetGetir((await params).id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  if (!s.paylasim) return hata("Önce paylaşım bağlantısı oluştur.");
  let g: { erisim?: string; davet?: { epostalar?: unknown; rol?: string }; rol?: { eposta?: string; rol?: string }; cikar?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const rolGecerli = (r: unknown): r is DavetRolu => r === "goruntule" || r === "yorum";
  const yeniler: string[] = [];
  let hataMetni = "";
  const kimlik = istekKimligi(req);
  const p = await paylasimGuncelle(s.paylasim.id, (x) => {
    x.davetliler ??= [];
    if (g.erisim === "herkes" || g.erisim === "davetli") x.erisim = g.erisim;
    if (g.davet) {
      const rol = rolGecerli(g.davet.rol) ? g.davet.rol : "goruntule";
      const l = (Array.isArray(g.davet.epostalar) ? g.davet.epostalar : []).map(epostaTemizle).filter(Boolean);
      const gecersiz = l.filter((e) => !EPOSTA.test(e));
      if (gecersiz.length) { hataMetni = `Geçersiz e-posta: ${gecersiz.slice(0, 3).join(", ")}`; return; }
      if (kimlik && l.includes(kimlik.eposta)) { hataMetni = "Kendini davet edemezsin; sahip olarak zaten görürsün."; return; }
      for (const e of l) {
        const var_ = x.davetliler.find((d) => d.eposta === e);
        if (var_) { var_.rol = rol; continue; }
        if (x.davetliler.length >= DAVET_SINIRI) { hataMetni = `Bir sohbete en çok ${DAVET_SINIRI} kişi davet edilebilir.`; break; }
        x.davetliler.push({ eposta: e, rol, zaman: Date.now() });
        yeniler.push(e);
      }
    }
    if (g.rol?.eposta && rolGecerli(g.rol.rol)) { const d = x.davetliler.find((y) => y.eposta === epostaTemizle(g.rol!.eposta)); if (d) d.rol = g.rol.rol; }
    if (typeof g.cikar === "string") x.davetliler = x.davetliler.filter((d) => d.eposta !== epostaTemizle(g.cikar));
  });
  if (!p) return hata("Paylaşım bulunamadı.", 404);
  if (hataMetni) return hata(hataMetni);
  if (typeof g.cikar === "string") await ortakSil(epostaTemizle(g.cikar), "sohbet", p.id);
  // Yeni davetliler: "benimle paylaşılanlar" dizini, bildirim ve e-posta.
  for (const e of yeniler) {
    const d = p.davetliler!.find((x) => x.eposta === e)!;
    await ortakEkle(e, { tur: "sohbet", id: p.id, baslik: p.baslik, sahipAd: kimlik?.ad ?? p.sahipAd ?? "Bir Vayra kullanıcısı", rol: d.rol, zaman: Date.now(), adres: `/s/b/${p.id}` });
    const r = await davetBildir(req, e, { tur: "davet", baslik: `${kimlik?.ad ?? "Biri"} seninle bir sohbet paylaştı`, metin: `"${p.baslik}" sohbetine ${d.rol === "yorum" ? "yorum yazabilecek" : "görüntüleyebilecek"} şekilde davet edildin.`, adres: `/s/b/${p.id}`, kaynak: { tur: "paylasim", id: p.id, ad: p.baslik } });
    await paylasimGuncelle(p.id, (x) => { const y = x.davetliler?.find((z) => z.eposta === e); if (y) y.epostaDurumu = r.eposta; });
  }
  const son = (await paylasimOku(p.id))!;
  return Response.json({ ok: true, paylasim: await gorunum(son) });
}

/** Paylaşımı kaldır: bağlantı artık açılmaz; davetliler ve yorumlar da silinir. */
export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sohbetGetir((await params).id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  if (s.paylasim) {
    const p = await paylasimOku(s.paylasim.id);
    for (const d of p?.davetliler ?? []) await ortakSil(d.eposta, "sohbet", s.paylasim.id);
    await yorumlariSil(s.paylasim.id);
    await paylasimSil(s.paylasim.id); delete s.paylasim; await sohbetKaydet(s, sahip);
  }
  return Response.json({ ok: true });
}
