import { SURUMLER } from "@/lib/surumler";

/** Sürüm notları RSS 2.0 akışı — /panel/surum/rss.xml */
const kacis = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const TUR_AD = { yeni: "Yeni", gelistirme: "Geliştirme", duzeltme: "Düzeltme" } as const;

export function GET(req: Request) {
  const kok = new URL(req.url).origin;
  const ogeler = SURUMLER.map((s) => {
    const url = `${kok}/panel/surum/${s.no}`;
    const icerik = `<p>${kacis(s.ozet)}</p><ul>${s.degisiklikler.map((d) => `<li><b>${TUR_AD[d.tur]}:</b> ${kacis(d.metin)}</li>`).join("")}</ul>`;
    return `    <item>
      <title>${kacis(`v${s.no} · ${s.baslik}`)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${s.tarih}T12:00:00Z`).toUTCString()}</pubDate>
${s.alanlar.map((a) => `      <category>${kacis(a)}</category>`).join("\n")}
      <description><![CDATA[${icerik}]]></description>
    </item>`;
  }).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Vayra sürüm notları</title>
    <link>${kok}/panel/surum</link>
    <atom:link href="${kok}/panel/surum/rss.xml" rel="self" type="application/rss+xml" />
    <description>Vayra'daki her yenilik, geliştirme ve düzeltme.</description>
    <language>tr</language>
    <lastBuildDate>${new Date(`${SURUMLER[0].tarih}T12:00:00Z`).toUTCString()}</lastBuildDate>
${ogeler}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
