import { girisYokla, kayitAra } from "@/lib/build/mcpKayit";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Resmî MCP kayıt defterinde uzak sunucu araması (?q=ad) ya da seçilen sunucunun giriş yöntemi yoklaması (?yokla=adres). */
export async function GET(req: Request) {
  if (!sahipAl(req)) return yetkisiz();
  const p = new URL(req.url).searchParams;
  const yokla = p.get("yokla");
  if (yokla) return Response.json({ ok: true, giris: await girisYokla(yokla) });
  try { return Response.json({ ok: true, ...(await kayitAra(p.get("q") ?? "")) }); }
  catch (e) { return hata((e as Error).message || "Kayıt defterine ulaşılamadı.", 502); }
}
