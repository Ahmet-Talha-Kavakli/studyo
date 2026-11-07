import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { OTURUM_YAPISTIRICI } from "@/lib/build/oturumBetik";

export const dynamic = "force-dynamic";

/**
 * Oturum kaydedicisi: rrweb 2.1.7 UMD paketi (MIT) ve Vayra yapıştırıcısı tek dosyada, kendi adresimizden (dış CDN yok).
 * UMD kendi kapsamında çalışır (define, module, exports gölgelenir; window.rrweb kirlenmez). Sürüm adreste olduğu için
 * bir gün önbelleğe alınır.
 */
let hazir: { govde: string; etiket: string } | null = null;

async function olustur() {
  if (hazir) return hazir;
  const umd = (await readFile(path.join(process.cwd(), "node_modules", "rrweb", "dist", "rrweb.umd.min.cjs"), "utf8")).replace(/^\/\/# sourceMappingURL=.*$/gm, "");
  const govde = `/*! Vayra oturum kaydedicisi. rrweb 2.1.7, MIT lisansı, https://github.com/rrweb-io/rrweb */\n(function(){var define,module,exports;\n${umd}\n${OTURUM_YAPISTIRICI}\n}).call({});\n`;
  hazir = { govde, etiket: `"${createHash("sha1").update(govde).digest("base64url").slice(0, 16)}"` };
  return hazir;
}

export async function GET(req: Request) {
  try {
    const { govde, etiket } = await olustur();
    const h = { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "public, max-age=86400", ETag: etiket, "Access-Control-Allow-Origin": "*", "X-Content-Type-Options": "nosniff" };
    if (req.headers.get("if-none-match") === etiket) return new Response(null, { status: 304, headers: h });
    return new Response(govde, { headers: h });
  } catch {
    return new Response("/* Vayra oturum kaydedicisi yüklenemedi */", { status: 503, headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" } });
  }
}
