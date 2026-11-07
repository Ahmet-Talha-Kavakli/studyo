import { projeOku, projeYaz, surumEkle } from "@/lib/build/depo";
import { ghCek, ghDepoHazirla, ghGonder, ghKullanici, GitHubHatasi } from "@/lib/build/github";
import { yalnizSahip } from "@/lib/build/ekipRota";
import { gunlukYaz } from "@/lib/build/gunluk";
import { coz, sifrele } from "@/lib/build/sifre";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { yolGecerli } from "@/lib/build/tipler";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Proje ↔ GitHub.
 *  GET                                       bağlantı durumu
 *  POST { islem: "baglan", anahtar }         kişisel erişim anahtarını doğrula ve şifreli sakla
 *  POST { islem: "depo", ad, ozel }          depo yoksa oluştur, projeye bağla
 *  POST { islem: "gonder", mesaj? }          bütün dosyaları tek commit olarak gönder
 *  POST { islem: "cek" }                     depodaki dosyalardan yeni sürüm oluştur
 *  POST { islem: "kes" }                     bağlantıyı kaldır
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const engel = await yalnizSahip((await params).id, sahip, "GitHub bağlantısını yalnız proje sahibi görebilir ve değiştirebilir.");
  if (engel) return engel;
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  const g = p.ayarlar.github;
  return Response.json({ ok: true, bagli: !!g?.anahtar, kullanici: g?.kullanici ?? null, avatar: g?.avatar ?? null, depo: g?.depo ?? null, dal: g?.dal ?? null, ozel: g?.ozel ?? true, son: g?.son ?? null });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const engel = await yalnizSahip((await params).id, sahip, "GitHub bağlantısını yalnız proje sahibi görebilir ve değiştirebilir.");
  if (engel) return engel;
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  let b: { islem?: string; anahtar?: string; ad?: string; ozel?: boolean; mesaj?: string };
  try { b = await req.json(); } catch { return hata("Geçersiz gövde."); }
  const g = p.ayarlar.github;
  const anahtar = coz(g?.anahtar);
  try {
    switch (b.islem) {
      case "baglan": {
        const a = String(b.anahtar ?? "").trim();
        if (!/^(gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})$/.test(a)) return hata("Bu bir GitHub kişisel erişim anahtarına benzemiyor (ghp_ ya da github_pat_ ile başlar).");
        const k = await ghKullanici(a);
        p.ayarlar.github = { ...(g ?? {}), anahtar: sifrele(a), kullanici: k.login, avatar: k.avatar_url };
        await projeYaz(p, sahip);
        return Response.json({ ok: true, kullanici: k.login });
      }
      case "depo": {
        if (!anahtar || !g?.kullanici) return hata("Önce GitHub hesabını bağla.");
        const ad = String(b.ad ?? "").trim();
        if (!/^[A-Za-z0-9._-]{1,100}$/.test(ad)) return hata("Depo adı yalnız harf, rakam, nokta, tire ve alt çizgi olabilir.");
        const d = await ghDepoHazirla(anahtar, g.kullanici, ad, b.ozel !== false);
        p.ayarlar.github = { ...g, depo: d.full_name, dal: d.default_branch, ozel: d.private };
        await projeYaz(p, sahip);
        return Response.json({ ok: true, depo: d.full_name, url: d.html_url });
      }
      case "gonder": {
        if (!anahtar || !g?.depo) return hata("Önce bir depo seç.");
        const mesaj = String(b.mesaj ?? "").trim().slice(0, 200) || `Vayra Build: sürüm ${p.surumler.at(-1)?.no ?? 1}`;
        const c = await ghGonder(anahtar, g.depo, g.dal || "main", p.dosyalar, mesaj);
        p.ayarlar.github = { ...g, son: { sha: c.sha, url: c.url, zaman: Date.now(), yon: "gonder", surumNo: p.surumler.at(-1)?.no ?? 0 } };
        await projeYaz(p, sahip);
        gunlukYaz(p.id, { t: "yayin", m: `GitHub'a gönderildi: ${g.depo} (${c.sha.slice(0, 7)})` });
        return Response.json({ ok: true, ...c });
      }
      case "cek": {
        if (!g?.depo) return hata("Önce bir depo seç.");
        const r = await ghCek(anahtar, g.depo, g.dal);
        const temiz = Object.fromEntries(Object.entries(r.dosyalar).filter(([y]) => yolGecerli(y)));
        if (!temiz["index.html"]) return hata("Depoda kökte index.html yok; Vayra Build tarayıcıda çalışan statik projeleri çeker.");
        const s = surumEkle(p, temiz, `GitHub'dan çekildi (${g.depo}, ${r.sha.slice(0, 7)})`, "elle");
        p.ayarlar.github = { ...g, son: { sha: r.sha, url: `https://github.com/${g.depo}/tree/${r.dal}`, zaman: Date.now(), yon: "cek", surumNo: s?.no ?? p.surumler.at(-1)?.no ?? 0 } };
        await projeYaz(p, sahip);
        return Response.json({ ok: true, degisen: s?.degisen.length ?? 0, atlanan: r.atlanan, proje: p });
      }
      case "kes": {
        delete p.ayarlar.github;
        await projeYaz(p, sahip);
        return Response.json({ ok: true });
      }
    }
    return hata("Bilinmeyen işlem.");
  } catch (e) {
    if (e instanceof GitHubHatasi) return hata(e.message, e.durum >= 500 ? 502 : e.durum === 404 ? 404 : 400);
    return hata("GitHub'a ulaşılamadı; bağlantını kontrol edip yeniden dene.", 502);
  }
}
