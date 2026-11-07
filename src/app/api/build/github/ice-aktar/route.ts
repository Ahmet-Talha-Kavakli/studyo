import { projeOlustur } from "@/lib/build/depo";
import { ghAdresCoz, ghCek, GitHubHatasi, hamAdreseCevir } from "@/lib/build/github";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { PROJE_TURLERI, yolGecerli, type ProjeTur } from "@/lib/build/tipler";

export const dynamic = "force-dynamic";

/**
 * Herkese açık bir GitHub deposunu yeni proje olarak içe aktarır (anahtar gerekmez).
 * POST { url, tur? } → { id, atlanan }. Kökte ya da tek alt klasörde index.html olan statik projeler alınır.
 */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { url?: string; tur?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz gövde."); }
  const a = ghAdresCoz(String(g.url ?? ""));
  if (!a) return hata("GitHub depo adresi tanınmadı. github.com/kullanici/depo biçiminde olmalı.");
  try {
    const r = await ghCek(null, a.depo, a.dal, a.klasor);
    const temiz: Record<string, string> = Object.fromEntries(Object.entries(r.dosyalar).filter(([y, d]) => yolGecerli(y) && d.length <= 400_000));
    let kok = a.klasor ? a.klasor.replace(/^\/+|\/+$/g, "") : "";
    let ikili = r.ikili;
    if (!temiz["index.html"]) {
      const ilk = Object.keys(temiz).filter((y) => y.endsWith("/index.html")).sort((x, y) => x.split("/").length - y.split("/").length)[0];
      if (!ilk) return hata("Depoda index.html bulunamadı. Vayra Build tarayıcıda çalışan statik siteleri içe aktarır (derleme gerektiren React ya da Next projeleri değil).");
      const onek = ilk.slice(0, -"index.html".length);
      for (const y of Object.keys(temiz)) { const v = temiz[y]; delete temiz[y]; if (y.startsWith(onek)) temiz[y.slice(onek.length)] = v; }
      ikili = ikili.filter((y) => y.startsWith(onek)).map((y) => y.slice(onek.length));
      kok = [kok, onek.replace(/\/+$/, "")].filter(Boolean).join("/");
    }
    // Görsel ve yazı tipleri indirilmez; bağlantıları deponun ham adreslerine çevrilir.
    const cevrilen = hamAdreseCevir(temiz, ikili, a.depo, r.dal, kok);
    const toplam = Object.values(temiz).reduce((t, x) => t + x.length, 0);
    if (toplam > 4_000_000) return hata("Depo çok büyük (4 MB sınırı).", 413);
    const tur = (PROJE_TURLERI.some((t) => t.id === g.tur) ? g.tur : "site") as ProjeTur;
    const p = await projeOlustur({ ad: a.depo.split("/")[1].slice(0, 60), tur, dosyalar: temiz, sahip, aciklama: `GitHub'dan içe aktarıldı: ${a.depo}` });
    return Response.json({ ok: true, id: p.id, atlanan: cevrilen ? 0 : r.atlanan, cevrilen });
  } catch (e) {
    if (e instanceof GitHubHatasi) return hata(e.durum === 404 ? "Depo bulunamadı ya da gizli. Gizli depolar için projeyi açıp Ayarlar › GitHub'dan bağlan." : e.message, e.durum === 429 ? 429 : 400);
    return hata("GitHub'a ulaşılamadı.", 502);
  }
}
