import { BLOG_YAZILARI } from "@/lib/kurumsal/blog";

const SITE = "https://vayra.ai";
const kacis = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

/** Blog RSS 2.0 akışı. */
export function GET() {
  const ogeler = [...BLOG_YAZILARI].sort((a, b) => b.tarih.localeCompare(a.tarih)).map((y) => `
    <item>
      <title>${kacis(y.baslik)}</title>
      <link>${SITE}/blog/${y.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${y.slug}</guid>
      <pubDate>${new Date(y.tarih + "T09:00:00Z").toUTCString()}</pubDate>
      <category>${kacis(y.kategori)}</category>
      <author>noreply@vayra.ai (${kacis(y.yazar)})</author>
      <description>${kacis(y.ozet)}</description>
    </item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Vayra Blog</title>
    <link>${SITE}/blog</link>
    <description>Ürün duyuruları, üretim rehberleri ve perde arkası.</description>
    <language>tr</language>${ogeler}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
