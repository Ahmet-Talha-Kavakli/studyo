import "server-only";
import { betikleriEkle } from "./kopru";
import { CORS } from "./sunucu";
import { mimeBul, type Proje } from "./tipler";
import { KAYDEDICI_ADRESI, oturumAyarTamamla } from "./oturumTipler";

const SANDBOX = "sandbox allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads allow-pointer-lock";
const kacir = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * Otomatik SEO (yalnız yayında): sayfada eksikse açıklama, Open Graph ve Twitter kartı etiketleri eklenir;
 * kullanıcının kendi yazdığı etiketlere dokunulmaz. Arama motoru kapalıysa noindex.
 */
function seoEkle(html: string, p: Proje, koken?: string): string {
  const s = p.ayarlar.seo;
  const var_ = (re: RegExp) => re.test(html);
  const baslik = s.baslik || /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] || p.ad;
  const etiketler: string[] = [];
  if (s.aciklama && !var_(/<meta[^>]+name=["']description["']/i)) etiketler.push(`<meta name="description" content="${kacir(s.aciklama)}">`);
  if (!var_(/property=["']og:title["']/i)) etiketler.push(`<meta property="og:title" content="${kacir(baslik)}">`);
  if (s.aciklama && !var_(/property=["']og:description["']/i)) etiketler.push(`<meta property="og:description" content="${kacir(s.aciklama)}">`);
  if (!var_(/property=["']og:type["']/i)) etiketler.push(`<meta property="og:type" content="website">`);
  if (s.ogGorsel && !var_(/property=["']og:image["']/i)) {
    const g = s.ogGorsel.startsWith("/") && koken ? koken + s.ogGorsel : s.ogGorsel;
    etiketler.push(`<meta property="og:image" content="${kacir(g)}">`, `<meta name="twitter:card" content="summary_large_image">`);
  }
  if (!s.indeks && !var_(/<meta[^>]+name=["']robots["']/i)) etiketler.push(`<meta name="robots" content="noindex">`);
  if (!etiketler.length) return html;
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, etiketler.join("") + "</head>") : etiketler.join("") + html;
}

/**
 * Yayında projede yoksa kendiliğinden üretilen dosyalar: robots.txt, sitemap.xml, llms.txt (yapay zekâ arama motorları için).
 */
export function otomatikDosya(p: Proje, dosyalar: Record<string, string>, yol: string, tamKok: string): Response | null {
  if (yol in dosyalar) return null;
  const sayfalar = Object.keys(dosyalar).filter((y) => y.endsWith(".html") && y !== "404.html").sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));
  const adres = (y: string) => `${tamKok}/${y === "index.html" ? "" : y.replace(/(^|\/)index\.html$/, "$1")}`;
  if (yol === "robots.txt") {
    const govde = p.ayarlar.seo.indeks ? `User-agent: *\nAllow: /\n\nSitemap: ${tamKok}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n";
    return new Response(govde, { headers: { "Content-Type": "text/plain; charset=utf-8", ...CORS } });
  }
  if (yol === "sitemap.xml") {
    const z = new Date(p.yayin?.zaman ?? Date.now()).toISOString().slice(0, 10);
    const govde = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sayfalar.map((y) => `  <url><loc>${kacir(adres(y))}</loc><lastmod>${z}</lastmod></url>`).join("\n")}\n</urlset>\n`;
    return new Response(govde, { headers: { "Content-Type": "application/xml; charset=utf-8", ...CORS } });
  }
  if (yol === "llms.txt") {
    const baslik = (h: string) => /<title[^>]*>([^<]*)<\/title>/i.exec(h)?.[1]?.trim() ?? "";
    const govde = `# ${p.ayarlar.seo.baslik || p.ad}\n\n${p.ayarlar.seo.aciklama ? `> ${p.ayarlar.seo.aciklama}\n\n` : ""}## Sayfalar\n\n${sayfalar.map((y) => `- [${baslik(dosyalar[y]) || y}](${adres(y)})`).join("\n")}\n`;
    return new Response(govde, { headers: { "Content-Type": "text/plain; charset=utf-8", ...CORS } });
  }
  return null;
}

/** Proje dosyasını sunar. Önizlemede köprü betiği eklenir; yayında rozet, analitik ve otomatik SEO. */
export function dosyaSun(p: Proje, dosyalar: Record<string, string>, yolParcalari: string[] | undefined, g: { onizleme: boolean; kok: string; koken?: string }): Response {
  let yol = (yolParcalari ?? []).map((s) => decodeURIComponent(s)).join("/");
  if (!yol || yol.endsWith("/")) yol += "index.html";
  if (!(yol in dosyalar) && !yol.includes(".") && `${yol}.html` in dosyalar) yol = `${yol}.html`;
  if (!(yol in dosyalar) && `${yol}/index.html` in dosyalar) yol = `${yol}/index.html`;
  // Sunucu fonksiyonlarının kaynağı hiçbir zaman statik dosya olarak verilmez.
  if (/^api\/[^/]+\.js$/.test(yol)) return new Response("Bulunamadı", { status: 404, headers: CORS });
  const gercek = !p.id.startsWith("sablon-");
  if (!g.onizleme && gercek && g.koken) { const o = otomatikDosya(p, dosyalar, yol, g.koken + g.kok); if (o) return o; }
  let durum = 200;
  if (!(yol in dosyalar)) {
    durum = 404;
    if ("404.html" in dosyalar) yol = "404.html";
    else return new Response(`<!doctype html><meta charset=utf-8><title>Sayfa yok</title><body style="font:16px system-ui;padding:48px;color:#333"><h1 style="font-size:22px">Bu sayfa bulunamadı</h1><p>${yol.replace(/[<>&"]/g, "")} bu projede yok.</p><p><a href="${g.kok}/">Ana sayfaya dön</a></p>`, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": SANDBOX, ...CORS } });
  }
  let govde = dosyalar[yol];
  const tur = mimeBul(yol);
  if (tur.startsWith("text/html")) {
    const rozet = !g.onizleme && p.ayarlar.rozet
      ? `<a href="/panel/build" target="_top" rel="noopener" style="position:fixed;right:14px;bottom:14px;z-index:2147483647;display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:rgba(15,19,26,.92);color:#e9eef5;font:500 12.5px/1 system-ui,sans-serif;text-decoration:none;border:1px solid rgba(255,255,255,.12)"><span style="width:8px;height:8px;border-radius:50%;background:#55d6fd"></span>Vayra Build ile yapıldı</a>`
      : "";
    govde = betikleriEkle(govde, {
      formAdresi: `/api/build/form/${p.id}`, kok: g.kok, onizleme: g.onizleme, rozet,
      // Vayra Veri: gerçek projelerde; önizlemede sahip yetkisi için belirteç gider.
      ...(gercek ? { veriAdresi: `/api/build/veri/${p.id}`, uyeAdresi: `/api/build/uye/${p.id}`, belirtec: g.onizleme ? p.onizlemeBelirteci : null } : {}),
      // Çerezsiz analitik yalnız yayında.
      ...(gercek && !g.onizleme ? { analitik: { adres: `/api/build/analitik/${p.id}`, kok: g.kok } } : {}),
      // Ziyaretçi oturum kaydı: yalnız yayında ve Bulut > Oturumlar açıksa (örnekleme ve onay kararı tarayıcıda).
      ...(gercek && !g.onizleme && p.yayin && p.ayarlar.oturum?.acik ? { oturum: { adres: `/api/build/oturum/${p.id}`, kaydedici: KAYDEDICI_ADRESI, projeId: p.id, kok: g.kok, ...oturumAyarTamamla(p.ayarlar.oturum) } } : {}),
    });
    if (!g.onizleme && gercek) govde = seoEkle(govde, p, g.koken);
    // Göreli adresler (stil.css, menu.html, fetch("ayarlar.json")) sayfanın klasörüne göre çözülsün; adresin sonundaki eğik çizgiye bağlı kalmasın.
    const klasor = yol.includes("/") ? yol.slice(0, yol.lastIndexOf("/") + 1) : "";
    const base = `<base href="${g.kok}/${klasor}">`;
    // Ortam değişkenleri (herkese açık yapılandırma): window.VAYRA_ENV.AD
    // Yalnız "herkese" görünürlüklü değişkenler tarayıcıya gider; "sunucu" sırları yalnız sunucu fonksiyonlarında okunur.
    const env = Object.fromEntries(p.ayarlar.sirlar.filter((s) => s.gorunurluk !== "sunucu").map((s) => [s.ad, s.deger]));
    const envBetik = Object.keys(env).length ? `<script>window.VAYRA_ENV=${JSON.stringify(env).replace(/</g, "\\u003c")}</script>` : "";
    govde = /<head[^>]*>/i.test(govde) ? govde.replace(/<head[^>]*>/i, (m) => m + base + envBetik) : base + envBetik + govde;
  }
  const h: Record<string, string> = { "Content-Type": tur, "Content-Security-Policy": SANDBOX, "Cache-Control": "no-store", ...CORS };
  if (g.onizleme || !p.ayarlar.seo.indeks) h["X-Robots-Tag"] = "noindex";
  return new Response(govde, { status: durum, headers: h });
}

/** Şifreli yayın: tarayıcının kendi kullanıcı adı/şifre penceresi (kullanıcı adı önemsiz). */
export function sifreKontrol(req: Request, p: Proje): Response | null {
  if (p.ayarlar.gorunurluk !== "sifreli" || !p.ayarlar.sifre) return null;
  const b = req.headers.get("authorization") ?? "";
  const cozulmus = b.startsWith("Basic ") ? Buffer.from(b.slice(6), "base64").toString("utf8") : "";
  if (cozulmus.split(":").slice(1).join(":") === p.ayarlar.sifre) return null;
  return new Response("Bu site şifreli.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Vayra Build", charset="UTF-8"', "Content-Type": "text/plain; charset=utf-8" } });
}
