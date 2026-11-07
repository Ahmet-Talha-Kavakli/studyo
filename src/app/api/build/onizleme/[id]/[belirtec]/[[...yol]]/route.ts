import { projeOkuHam } from "@/lib/build/depo";
import { dosyaSun } from "@/lib/build/sun";
import { fonksiyonIstegi } from "@/lib/build/fonksiyon";
import { gunlukYaz } from "@/lib/build/gunluk";
import { CORS } from "@/lib/build/sunucu";
import { istekOrtami, ortamlaCalistir } from "@/lib/build/veri";

export const dynamic = "force-dynamic";

/**
 * Taslak önizleme: projenin güncel dosyaları; adres gizli belirteç içerir (iframe başlık gönderemez).
 * Eski bir sürümü önizlemek için belirteç "<belirteç>~<sürümKimliği>" biçiminde verilir; göreli bağlantılar
 * <base> sayesinde aynı sürümde kalır.
 * Projede Test ortamı açıksa önizleme Test veritabanını kullanır: sayfadaki vayra.veri istekleri önizleme belirteciyle
 * gider (veri API'si Test'i seçer), api/<ad> fonksiyonları da Test bağlamında çalışır. Yanıtta x-vayra-ortam başlığı var.
 */
type Ctx = { params: Promise<{ id: string; belirtec: string; yol?: string[] }> };

/** Önizlemede api/<ad>: taslaktaki (ya da seçili sürümdeki) fonksiyon çalışır; ajan ve sahip deneyebilsin. */
async function fonksiyonOnizleme(req: Request, { params }: Ctx) {
  const { id, belirtec, yol } = await params;
  const [anahtar, surumId] = decodeURIComponent(belirtec).split("~");
  const p = await projeOkuHam(id);
  if (!p || p.onizlemeBelirteci !== anahtar) return new Response("Önizleme bulunamadı.", { status: 404, headers: CORS });
  const dosyalar = surumId ? p.surumler.find((s) => s.id === surumId)?.dosyalar : p.dosyalar;
  if (!dosyalar || yol?.[0] !== "api" || yol.length !== 2) return new Response("Bu yöntem desteklenmiyor.", { status: 405, headers: CORS });
  const ortam = await istekOrtami(p.id, true);
  const { yanit, sonuc } = await ortamlaCalistir(ortam, () => fonksiyonIstegi(req, p, dosyalar, yol[1]));
  if (sonuc) gunlukYaz(p.id, { t: "fonksiyon", d: sonuc.durum, y: "/api/" + yol[1] + (ortam === "test" ? " (önizleme, Test)" : " (önizleme)"), ms: sonuc.sure, m: sonuc.hata ?? req.method });
  return yanit;
}
export const POST = fonksiyonOnizleme, PUT = fonksiyonOnizleme, PATCH = fonksiyonOnizleme, DELETE = fonksiyonOnizleme;

export async function GET(req: Request, ctx: Ctx) {
  const { id, belirtec, yol } = await ctx.params;
  if (yol?.[0] === "api" && yol.length === 2 && !yol[1].includes(".")) return fonksiyonOnizleme(req, ctx);
  const [anahtar, surumId] = decodeURIComponent(belirtec).split("~");
  const p = await projeOkuHam(id);
  if (!p || p.onizlemeBelirteci !== anahtar) return new Response("Önizleme bulunamadı.", { status: 404, headers: CORS });
  const dosyalar = surumId ? p.surumler.find((s) => s.id === surumId)?.dosyalar : p.dosyalar;
  if (!dosyalar) return new Response("Sürüm bulunamadı.", { status: 404, headers: CORS });
  const r = dosyaSun(p, dosyalar, yol, { onizleme: true, kok: `/api/build/onizleme/${id}/${belirtec}` });
  r.headers.set("x-vayra-ortam", await istekOrtami(p.id, true));
  return r;
}
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
