import { sohbetleriListele } from "@/lib/build/sohbetDepo";
import { KLASOR_RENKLERI, KLASOR_SINIRI, klasorAcik, klasorKimligi, klasorleriGetir, klasorlerGuncelle, type SohbetKlasoru } from "@/lib/build/sohbetKlasor";
import { hata, sahipAl } from "@/lib/build/sunucu";
import { calisanSohbetler } from "../calisanlar";

export const dynamic = "force-dynamic";

/** Sohbet klasörleri: sohbet ve dosya sayılarıyla. */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, klasorler: [] });
  const [l, s] = await Promise.all([klasorleriGetir(sahip), sohbetleriListele(sahip, new Set(calisanSohbetler.keys()), { hepsi: true })]);
  return Response.json({
    ok: true,
    klasorler: l.map((k) => {
      const ic = s.filter((x) => x.klasor === k.id);
      return { ...klasorAcik(k), sohbet: ic.length, sonSohbet: ic.slice(0, 3).map((x) => ({ id: x.id, baslik: x.baslik })), sonEtkinlik: Math.max(k.guncelleme, ...ic.map((x) => x.guncelleme)) };
    }).sort((a, b) => b.sonEtkinlik - a.sonEtkinlik),
  });
}

/** Yeni klasör: { ad, aciklama?, talimat?, renk? } → { klasor } */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: Partial<Pick<SohbetKlasoru, "ad" | "aciklama" | "talimat" | "renk">> = {};
  try { g = await req.json(); } catch { /* boş */ }
  const ad = String(g.ad ?? "").trim().slice(0, 60);
  if (!ad) return hata("Klasöre bir ad ver.");
  const k = await klasorlerGuncelle(sahip, (l) => {
    if (l.length >= KLASOR_SINIRI.klasor) return null;
    const x: SohbetKlasoru = { id: klasorKimligi(), ad, aciklama: String(g.aciklama ?? "").trim().slice(0, 300), talimat: String(g.talimat ?? "").slice(0, 8000), renk: KLASOR_RENKLERI.includes(String(g.renk)) ? String(g.renk) : KLASOR_RENKLERI[l.length % KLASOR_RENKLERI.length], dosyalar: [], bellek: true, olusturma: Date.now(), guncelleme: Date.now() };
    l.unshift(x);
    return x;
  });
  if (!k) return hata(`En çok ${KLASOR_SINIRI.klasor} klasör açılabilir.`);
  return Response.json({ ok: true, klasor: klasorAcik(k) });
}
