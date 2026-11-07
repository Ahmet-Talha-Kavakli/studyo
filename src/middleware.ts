import { NextResponse, type NextRequest } from "next/server";

/**
 * 1) Yayındaki Build siteleri: ana uygulama alanı olmayan bir Host'a gelen istekler (bağlanan özel alan adı ya da
 *    <ad>.<NEXT_PUBLIC_BUILD_ALAN> alt alanı) /b/__alan/<yol> adresine yeniden yazılır; asıl Host x-vayra-host
 *    başlığıyla taşınır, site rotası projeyi buradan çözer. /api ve /_next yolları yazılmaz (köprü API'si ve
 *    varlıklar aynı sunucuda çalışır). Ana alanlar VAYRA_ANA_ALAN (virgülle) + localhost; tanımlı değilse yalnız
 *    NEXT_PUBLIC_BUILD_ALAN alt alanları yönlendirilir (geliştirmede hiçbir şey değişmez).
 * 2) /admin sayfaları: sert noindex ve güvenlik başlıkları + oturum ve rol denetimi.
 *    - vayra_oturum çerezi yoksa giriş sayfasına.
 *    - Çerez varsa sunucuya sorulur (/api/hesap/ben?yetki=1; ara katman dosya okuyamaz): geçersizse girişe,
 *      rol admin değilse panele. Sunucuya ulaşılamazsa sayfa açılmaz (kapalı başarısızlık).
 *    Asıl yetki denetimi /api/admin/** uçlarının başında (adminGerekli); bu katman sayfanın kendisini korur.
 */
const GUVENLIK = {
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
};

function basliklar(res: NextResponse) {
  for (const [k, v] of Object.entries(GUVENLIK)) res.headers.set(k, v);
  return res;
}

/**
 * Site alan adında yeniden yazılmayan yollar: Vayra köprü API'si (/api/build), Vayra medya deposu (/api/dosya),
 * derleme varlıkları ve sitelerin doğrudan kullandığı ortak public klasörleri.
 */
const SITE_DISI = ["/api/build/", "/api/dosya/", "/_next/", "/b/", "/gercek/", "/marka/", "/stok/", "/brand/", "/basin/", "/ajan-kutusu.js"];
const YEREL = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);
const anaAlanlar = () => (process.env.VAYRA_ANA_ALAN ?? "").split(",").map((x) => x.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")).filter(Boolean);
const buildAlan = () => (process.env.NEXT_PUBLIC_BUILD_ALAN ?? "").trim().toLowerCase();

/** Bu Host bir Build sitesine mi ait? */
function siteHostu(host: string): boolean {
  if (!host || YEREL.has(host)) return false;
  const kok = buildAlan();
  if (kok && host.endsWith(`.${kok}`) && host !== `www.${kok}`) return true;
  const ana = anaAlanlar();
  if (!ana.length) return false;
  if (ana.includes(host) || (kok && host === kok)) return false;
  return !ana.some((a) => host === `www.${a}`);
}

async function adminDenetimi(req: NextRequest) {
  const yol = req.nextUrl.pathname;
  const giris = () => {
    const u = req.nextUrl.clone();
    u.pathname = "/giris";
    u.search = `?geri=${encodeURIComponent(yol + req.nextUrl.search)}`;
    return basliklar(NextResponse.redirect(u));
  };
  if (!req.cookies.get("vayra_oturum")?.value) return giris();
  try {
    const r = await fetch(new URL("/api/hesap/ben?yetki=1", req.url), {
      headers: { cookie: req.headers.get("cookie") ?? "", "user-agent": req.headers.get("user-agent") ?? "", "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "" },
      cache: "no-store",
      // Geliştirmede ilk derleme birkaç saniye sürebilir; süre aşılırsa sayfa açılmaz (girişe döner).
      signal: AbortSignal.timeout(10_000),
    });
    if (r.status === 401) return giris();
    const j = (await r.json().catch(() => null)) as { rol?: string; ikiAdim?: boolean } | null;
    if (!r.ok || j?.rol !== "admin") {
      const u = req.nextUrl.clone();
      u.pathname = "/panel";
      u.search = "?yetki=yok";
      return basliklar(NextResponse.redirect(u));
    }
    // Yönetim paneli iki adımlı doğrulamayla açılmış oturum ister (sunucu tarafı; istemcide kapı yok).
    if (j.ikiAdim === false) {
      const u = req.nextUrl.clone();
      u.pathname = "/panel/ayarlar/guvenlik";
      u.search = "?yonetici=iki-adim";
      return basliklar(NextResponse.redirect(u));
    }
  } catch {
    return giris();
  }
  return basliklar(NextResponse.next());
}

export async function middleware(req: NextRequest) {
  const yol = req.nextUrl.pathname;
  const host = (req.headers.get("x-forwarded-host")?.split(",")[0] ?? req.headers.get("host") ?? "").trim().toLowerCase().replace(/:\d+$/, "");
  if (siteHostu(host) && !SITE_DISI.some((o) => yol.startsWith(o))) {
    const u = req.nextUrl.clone();
    // Kök istek sonda eğik çizgisiz gider (yoksa Next 308 ile yönlendirir); sitenin kendi /api/<fonksiyon> yolları da siteye.
    u.pathname = yol === "/" ? "/b/__alan" : `/b/__alan${yol}`;
    const h = new Headers(req.headers);
    h.set("x-vayra-host", host);
    return NextResponse.rewrite(u, { request: { headers: h } });
  }
  if (yol === "/admin" || yol.startsWith("/admin/")) return adminDenetimi(req);
  return NextResponse.next();
}

export const config = {
  // Statik derleme varlıkları dışında her istek (alan adı yönlendirmesi için); yönetim denetimi yalnız /admin'de çalışır.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
