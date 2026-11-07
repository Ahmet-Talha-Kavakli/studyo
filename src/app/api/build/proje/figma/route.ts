import { guvenliFetch } from "@/lib/guvenliAg";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Figma bağlantısını çözer: figma.com/design|file|proto/<anahtar>/...?node-id=1-2 */
function figmaCoz(u: string): { anahtar: string; dugum: string | null; ad: string } | null {
  try {
    const x = new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`);
    if (!/(^|\.)figma\.com$/i.test(x.hostname)) return null;
    const m = /^\/(?:design|file|proto|make)\/([A-Za-z0-9]{10,64})(?:\/([^/?#]*))?/.exec(x.pathname);
    if (!m) return null;
    const n = x.searchParams.get("node-id");
    return { anahtar: m[1], dugum: n ? n.replace(/-/g, ":") : null, ad: decodeURIComponent(m[2] ?? "").replace(/-/g, " ").trim() || "Figma tasarımı" };
  } catch { return null; }
}

/**
 * Figma çerçevesini görsele çevirir (POST { url } → { gorsel: data URL, ad, genislik, yukseklik, metinler }).
 * FIGMA_TOKEN (kişisel erişim anahtarı) gerekir; yoksa 501 ve açık bir açıklama döner, sahte sonuç üretilmez.
 * İstekler yalnız api.figma.com ve Figma'nın görsel sunucusuna, guvenliFetch ile gider.
 */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { url?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz gövde."); }
  const f = figmaCoz(String(g.url ?? ""));
  if (!f) return hata("Figma bağlantısı tanınmadı. Figma'da çerçeveyi seç, sağ tıkla ve Copy link to selection ile kopyala.");
  const anahtar = process.env.FIGMA_TOKEN;
  if (!anahtar) return Response.json({ ok: false, hata: "Figma'dan içe aktarma bu sunucuda henüz açık değil: FIGMA_TOKEN tanımlı değil. O zamana kadar çerçeveyi PNG olarak dışa aktarıp Ekran görüntüsünden kartıyla ekleyebilirsin.", anahtarYok: true }, { status: 501 });
  const h = { "X-Figma-Token": anahtar };
  try {
    let dugum = f.dugum;
    let ad = f.ad;
    const metinler: string[] = [];
    // Düğüm verilmediyse ilk sayfanın ilk çerçevesi; verildiyse adını ve metinlerini oku.
    const yol = dugum ? `/v1/files/${f.anahtar}/nodes?ids=${encodeURIComponent(dugum)}&depth=6` : `/v1/files/${f.anahtar}?depth=2`;
    const r = await guvenliFetch(`https://api.figma.com${yol}`, { headers: h }, { yalnizHttps: true });
    if (r.status === 403 || r.status === 401) return hata("Figma bu dosyaya erişim vermedi. Anahtarın dosyayı görebildiğinden emin ol.", 403);
    if (r.status === 404) return hata("Figma dosyası bulunamadı.", 404);
    if (!r.ok) return hata(`Figma yanıt vermedi (${r.status}).`, 502);
    type D = { name?: string; type?: string; characters?: string; children?: D[]; absoluteBoundingBox?: { width: number; height: number } };
    const v = (await r.json()) as { document?: D; nodes?: Record<string, { document: D }> };
    let kok: D | undefined;
    if (dugum) kok = v.nodes?.[dugum]?.document;
    else { kok = v.document?.children?.[0]?.children?.find((c) => c.type === "FRAME" || c.type === "COMPONENT" || c.type === "SECTION"); }
    if (!kok) return hata("Bağlantıda çerçeve bulunamadı. Bir çerçeve seçip Copy link to selection ile kopyala.", 404);
    if (!dugum) { const bul = (d: D): string | null => ((d as { id?: string }).id ?? null); dugum = bul(kok); }
    if (!dugum) return hata("Çerçeve kimliği okunamadı.", 404);
    ad = kok.name || ad;
    const gez = (d: D) => { if (d.type === "TEXT" && d.characters && metinler.length < 120) metinler.push(d.characters.slice(0, 300)); d.children?.forEach(gez); };
    gez(kok);
    const ir = await guvenliFetch(`https://api.figma.com/v1/images/${f.anahtar}?ids=${encodeURIComponent(dugum)}&format=png&scale=1`, { headers: h }, { yalnizHttps: true });
    const iv = (await ir.json().catch(() => ({}))) as { images?: Record<string, string | null> };
    const adres = iv.images?.[dugum];
    if (!adres) return hata("Figma çerçeveyi görsele çeviremedi.", 502);
    const gr = await guvenliFetch(adres, {}, { yalnizHttps: true });
    if (!gr.ok) return hata("Çerçeve görseli indirilemedi.", 502);
    const buf = Buffer.from(await gr.arrayBuffer());
    if (buf.length > 8_000_000) return hata("Çerçeve görseli çok büyük; daha küçük bir çerçeve seç.", 413);
    return Response.json({ ok: true, ad, gorsel: `data:image/png;base64,${buf.toString("base64")}`, genislik: kok.absoluteBoundingBox?.width ?? null, yukseklik: kok.absoluteBoundingBox?.height ?? null, metinler });
  } catch (e) {
    return hata(e instanceof Error ? `Figma'ya ulaşılamadı: ${e.message}` : "Figma'ya ulaşılamadı.", 502);
  }
}
