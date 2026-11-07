import { sohbetKaydet, sohbetOlustur, yeniMesajId, type SohbetMesaji } from "@/lib/build/sohbetDepo";
import { istekKimligi, istekSahipOzeti } from "@/lib/build/sohbetOrtak";
import { paylasimOku, paylasimRolu } from "@/lib/build/sohbetPaylasim";
import { tuvalKopyala } from "@/lib/build/sohbetTuval";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/**
 * Paylaşılan sohbetin içeriği ve görenin rolü (kişiye özel paylaşımda erişim denetlenir; sahip x-build-sahip
 * başlığıyla da tanınır). Erişim yoksa 403 ile oturum durumu döner (arayüz giriş yapmayı önerir).
 */
export async function GET(req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const p = await paylasimOku((await params).pid);
  if (!p) return hata("Bu paylaşım bulunamadı ya da kaldırıldı.", 404);
  const kimlik = istekKimligi(req);
  const rol = paylasimRolu(p, { sahipOz: istekSahipOzeti(req), eposta: kimlik?.eposta });
  if (!rol) return Response.json({ ok: false, hata: "Bu sohbet kişiye özel.", ozel: true, oturum: !!kimlik, eposta: kimlik?.eposta ?? null }, { status: 403 });
  const { sahip: _s, sohbet: _c, davetliler, ...acik } = p; void _s; void _c;
  return Response.json({ ok: true, paylasim: { ...acik, davetliSayisi: davetliler?.length ?? 0 }, rol, kimlik: kimlik ? { ad: kimlik.ad, eposta: kimlik.eposta } : null });
}

/** "Kendi sohbetinde devam et": paylaşılan sohbetin kopyası, çağıranın sohbetlerinde açılır → { id } */
export async function POST(req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  const p = await paylasimOku((await params).pid);
  if (!p) return hata("Bu paylaşım bulunamadı ya da kaldırıldı.", 404);
  if (!paylasimRolu(p, { sahipOz: istekSahipOzeti(req), eposta: istekKimligi(req)?.eposta })) return hata("Bu sohbet kişiye özel; kopyalamak için davet edilmiş olman gerekir.", 403);
  const s = await sohbetOlustur(sahip, p.model, { baslik: p.baslik });
  let ust: string | null = null;
  const mesajlar: SohbetMesaji[] = [];
  // Tuvaller (remix): paylaşılan tuvallerin son hâli yeni sahibe kopyalanır; kartlar yeni kopyayı açar.
  const tuvaller = new Map<string, string>();
  for (const m of p.mesajlar) for (const x of m.parcalar ?? []) if (x.tur === "arac" && x.sonuc?.tur === "tuval" && !tuvaller.has(x.sonuc.id)) { const t = await tuvalKopyala(x.sonuc.id, sahip, s.id); if (t) tuvaller.set(x.sonuc.id, t.id); }
  for (const m of p.mesajlar) {
    const id = yeniMesajId();
    const parcalar = m.parcalar?.filter((x) => x.tur !== "plan" && !(x.tur === "arac" && x.durum === "suruyor")).map((x) => (x.tur === "arac" && x.sonuc?.tur === "tuval" && tuvaller.has(x.sonuc.id) ? { ...x, sonuc: { ...x.sonuc, id: tuvaller.get(x.sonuc.id)! } } : x));
    mesajlar.push({ ...m, id, ust, durum: m.rol === "asistan" ? "bitti" : undefined, parcalar });
    ust = id;
  }
  s.mesajlar = mesajlar;
  if (tuvaller.size) s.tuvaller = [...tuvaller.values()];
  s.guncelleme = Date.now();
  await sohbetKaydet(s, sahip);
  return Response.json({ ok: true, id: s.id });
}
