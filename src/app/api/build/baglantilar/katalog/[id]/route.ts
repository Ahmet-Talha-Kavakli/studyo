import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { adaptorAraclari } from "@/lib/build/baglantiAdaptorTanim";
import { katalogBul } from "@/lib/build/baglantiKatalog";
import { openapiIndir, restAraclari } from "@/lib/build/baglantiRest";
import { mcpAraclar, mcpBaglan, type McpArac } from "@/lib/build/mcpIstemci";
import { hata } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
type Onizleme = { araclar: McpArac[] | null; kaynak: "adaptor" | "sunucu" | "giris" | "rest" | "openapi"; sunucu?: { name?: string; version?: string }; zaman: number };
const SURE = 24 * 3600_000;
const dosya = (id: string) => path.join(DEPO_KOK, "build", "baglanti-onizleme", `${id}.json`);
const kaydet = async (id: string, v: Onizleme) => { await mkdir(path.dirname(dosya(id)), { recursive: true }); await writeFile(dosya(id), JSON.stringify(v)); };

/**
 * Dizin ayrıntısındaki araç listesi. Vayra adaptörlerinde tanımlardan; REST yolundaki servislerde resmî OpenAPI
 * belgesinden (24 saat önbellek) ya da katalogdaki resmî uç noktalardan; araç listesini girişsiz veren MCP
 * sunucularında sunucudan canlı (24 saat önbellek). Diğerlerinde liste girişten sonra okunur: { araclar: null, kaynak: "giris" }.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const k = katalogBul((await params).id);
  if (!k) return hata("Servis bulunamadı.", 404);
  if (k.adaptor) return Response.json({ ok: true, araclar: adaptorAraclari(k.adaptor), kaynak: "adaptor" });
  const eski = await readFile(dosya(k.id), "utf8").then((x) => JSON.parse(x) as Onizleme).catch(() => null);
  if (k.yol === "rest" && k.rest) {
    if (k.rest.openapi) {
      if (eski && Date.now() - eski.zaman < SURE) return Response.json({ ok: true, ...eski });
      try {
        const t = await openapiIndir(k.rest.openapi);
        const v: Onizleme = { araclar: restAraclari(t).map((a) => ({ ...a, description: a.description?.slice(0, 600) })), kaynak: "openapi", sunucu: { name: t.baslik, version: t.surum }, zaman: Date.now() };
        await kaydet(k.id, v);
        return Response.json({ ok: true, ...v });
      } catch { /* katalogdaki uç noktalara düşer */ }
    }
    return Response.json({ ok: true, araclar: k.rest.islemler?.length ? restAraclari({ taban: k.rest.taban, yetki: k.rest.yetki, islemler: k.rest.islemler }) : null, kaynak: "rest" });
  }
  if (!k.acikListe || /\{/.test(k.url)) return Response.json({ ok: true, araclar: null, kaynak: "giris" });
  if (eski && Date.now() - eski.zaman < SURE) return Response.json({ ok: true, ...eski });
  try {
    const { o, sunucu } = await mcpBaglan(k.url, {});
    const araclar = (await mcpAraclar(o)).map((a) => ({ name: a.name, title: a.title, description: a.description?.slice(0, 600), annotations: a.annotations }));
    const v: Onizleme = { araclar, kaynak: "sunucu", sunucu: { name: sunucu.name, version: sunucu.version }, zaman: Date.now() };
    await kaydet(k.id, v);
    return Response.json({ ok: true, ...v });
  } catch {
    return Response.json({ ok: true, ...(eski ?? { araclar: null, kaynak: "giris" }) });
  }
}
