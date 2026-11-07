import { klasorlerGuncelleOz, type KlasorUyesi } from "@/lib/build/sohbetKlasor";
import { EPOSTA, davetBildir, epostaTemizle, klasorErisimi, ortakEkle, ortakSil } from "@/lib/build/sohbetOrtak";
import { epostaKurulu } from "@/lib/build/bulutEposta";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ kid: string }> };
const SINIR = 30;

/**
 * Klasör ekibi (yalnız sahip yönetir): { davet: { epostalar, rol } } | { rol: { eposta, rol } } | { cikar: eposta }.
 * İzleyici talimatı, dosyaları ve belleği görür, klasörün bağlamıyla kendi sohbetlerini açar; düzenleyici ayrıca
 * talimatı, dosyaları ve klasör belleğini değiştirir.
 */
export async function POST(req: Request, { params }: Ctx) {
  if (!sahipAl(req)) return yetkisiz();
  const kid = (await params).kid;
  const e = await klasorErisimi(req, kid);
  if (!e || e.rol !== "sahip") return hata("Ekibi yalnız klasörün sahibi yönetir.", 403);
  let g: { davet?: { epostalar?: unknown; rol?: string }; rol?: { eposta?: string; rol?: string }; cikar?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const rolGecerli = (r: unknown): r is KlasorUyesi["rol"] => r === "izleyici" || r === "duzenleyici";
  let yeniler: string[] = [], hataMetni = "";
  const k = await klasorlerGuncelleOz(e.oz, (l) => {
    const x = l.find((y) => y.id === kid);
    if (!x) return null;
    x.ekip ??= [];
    if (e.kimlik && x.sahipAd !== e.kimlik.ad) x.sahipAd = e.kimlik.ad;
    if (g.davet) {
      const rol = rolGecerli(g.davet.rol) ? g.davet.rol : "izleyici";
      const l2 = (Array.isArray(g.davet.epostalar) ? g.davet.epostalar : []).map(epostaTemizle).filter(Boolean);
      const gecersiz = l2.filter((m) => !EPOSTA.test(m));
      if (gecersiz.length) { hataMetni = `Geçersiz e-posta: ${gecersiz.slice(0, 3).join(", ")}`; return x; }
      if (e.kimlik && l2.includes(e.kimlik.eposta)) { hataMetni = "Kendini davet edemezsin."; return x; }
      for (const m of l2) {
        const var_ = x.ekip.find((u) => u.eposta === m);
        if (var_) { var_.rol = rol; continue; }
        if (x.ekip.length >= SINIR) { hataMetni = `Bir klasörde en çok ${SINIR} kişi olabilir.`; break; }
        x.ekip.push({ eposta: m, rol, zaman: Date.now() }); yeniler.push(m);
      }
    }
    if (g.rol?.eposta && rolGecerli(g.rol.rol)) { const u = x.ekip.find((y) => y.eposta === epostaTemizle(g.rol!.eposta)); if (u) u.rol = g.rol.rol; }
    if (typeof g.cikar === "string") x.ekip = x.ekip.filter((u) => u.eposta !== epostaTemizle(g.cikar));
    return x;
  });
  if (!k) return hata("Klasör bulunamadı.", 404);
  if (hataMetni) return hata(hataMetni);
  const anahtar = `${e.oz}:${kid}`, adres = `/panel/build/sohbet/klasor/${kid}?sahip=${e.oz}`;
  if (typeof g.cikar === "string") await ortakSil(epostaTemizle(g.cikar), "klasor", anahtar);
  for (const m of yeniler) {
    const u = k.ekip!.find((x) => x.eposta === m)!;
    await ortakEkle(m, { tur: "klasor", id: anahtar, baslik: k.ad, sahipAd: e.kimlik?.ad ?? "Bir Vayra kullanıcısı", rol: u.rol, zaman: Date.now(), adres });
    const r = await davetBildir(req, m, { tur: "davet", baslik: `${e.kimlik?.ad ?? "Biri"} seni bir klasöre ekledi`, metin: `"${k.ad}" klasörüne ${u.rol === "duzenleyici" ? "düzenleyici" : "izleyici"} olarak eklendin. Klasörün talimatı ve dosyalarıyla sohbet açabilirsin.`, adres, kaynak: { tur: "klasor", id: anahtar, ad: k.ad } });
    await klasorlerGuncelleOz(e.oz, (l) => { const z = l.find((y) => y.id === kid)?.ekip?.find((x) => x.eposta === m); if (z) z.epostaDurumu = r.eposta; });
  }
  yeniler = [];
  const son = (await klasorErisimi(req, kid))!;
  return Response.json({ ok: true, ekip: son.k.ekip ?? [], epostaKurulu: epostaKurulu() });
}
