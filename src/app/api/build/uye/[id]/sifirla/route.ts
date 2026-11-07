import { projeOkuHam } from "@/lib/build/depo";
import { gunlukYaz } from "@/lib/build/gunluk";
import { kokenBul, siteAdresi } from "@/lib/build/bulutKimlik";
import { kimlikAyarOku, sifirlamaKimin, sifirlamaUygula, UyeHatasi } from "@/lib/build/uye";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Şifre belirleme ve sıfırlama sayfası (sahibin ürettiği bağlantı, 24 saat ya da davette 7 gün geçerli, tek kullanım).
 * Bağımsız HTML sayfası; başarıdan sonra siteye dönüş bağlantısı gösterir.
 */
const kacir = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
function sayfa(baslik: string, govde: string, durum = 200) {
  return new Response(`<!doctype html><html lang="tr"><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><meta name=robots content=noindex><title>${kacir(baslik)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f7f8;color:#111;font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}main{width:min(400px,calc(100vw - 32px));background:#fff;border-radius:20px;padding:28px;border:1px solid #e6e8eb}h1{font-size:20px;margin:0 0 6px}p{color:#555;margin:0 0 18px}label{display:block;font-size:13px;color:#444;margin:12px 0 6px}input{width:100%;box-sizing:border-box;height:44px;border-radius:12px;border:1px solid #d8dbe0;padding:0 12px;font:inherit}button,a.d{display:inline-flex;align-items:center;justify-content:center;width:100%;height:44px;margin-top:18px;border:0;border-radius:999px;background:#111;color:#fff;font:600 15px system-ui;text-decoration:none;cursor:pointer}.h{color:#b42318;background:#fef3f2;border-radius:12px;padding:10px 12px;margin:0 0 12px}</style>
<main>${govde}</main>`, { status: durum, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "Referrer-Policy": "no-referrer" } });
}

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  const p = await projeOkuHam(id);
  const t = new URL(req.url).searchParams.get("t") ?? "";
  if (!p) return sayfa("Bulunamadı", "<h1>Proje bulunamadı</h1>", 404);
  const u = await sifirlamaKimin(id, t);
  if (!u) return sayfa("Bağlantı geçersiz", `<h1>Bağlantı geçersiz</h1><p>Bu bağlantının süresi dolmuş ya da daha önce kullanılmış. Site sahibinden yeni bir bağlantı iste.</p><a class=d href="${kacir(siteAdresi(p, kokenBul(req)))}">${kacir(p.ad)} sitesine dön</a>`, 410);
  const a = await kimlikAyarOku(id);
  return sayfa(`${p.ad}: yeni şifre`, `<h1>Yeni şifre belirle</h1><p>${kacir(p.ad)} hesabın: <b>${kacir(u.eposta)}</b></p>
<form method=post><input type=hidden name=t value="${kacir(t)}"><label for=s>Yeni şifre (en az ${a.minSifre} karakter)</label><input id=s name=sifre type=password minlength=${a.minSifre} required autocomplete=new-password><label for=s2>Yeni şifre, tekrar</label><input id=s2 name=sifre2 type=password minlength=${a.minSifre} required autocomplete=new-password><button type=submit>Şifreyi kaydet</button></form>`);
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const p = await projeOkuHam(id);
  if (!p) return sayfa("Bulunamadı", "<h1>Proje bulunamadı</h1>", 404);
  const f = new URLSearchParams(await req.text());
  const t = f.get("t") ?? "", s = f.get("sifre") ?? "", s2 = f.get("sifre2") ?? "";
  const site = siteAdresi(p, kokenBul(req));
  if (s !== s2) return sayfa("Şifreler uyuşmuyor", `<h1>Yeni şifre belirle</h1><p class=h>İki şifre aynı değil.</p><a class=d href="?t=${encodeURIComponent(t)}">Tekrar dene</a>`, 400);
  try {
    const u = await sifirlamaUygula(id, t, s);
    gunlukYaz(id, { t: "uye", d: 200, m: `Üye şifresini belirledi: ${u.eposta}` });
    return sayfa("Şifre kaydedildi", `<h1>Şifren kaydedildi</h1><p>Artık yeni şifrenle giriş yapabilirsin. Açık oturumların güvenlik için kapatıldı.</p><a class=d href="${kacir(site)}">${kacir(p.ad)} sitesine git</a>`);
  } catch (e) {
    return sayfa("Kaydedilemedi", `<h1>Kaydedilemedi</h1><p class=h>${kacir(e instanceof UyeHatasi ? e.message : "Bir sorun oldu.")}</p><a class=d href="?t=${encodeURIComponent(t)}">Tekrar dene</a>`, 400);
  }
}
