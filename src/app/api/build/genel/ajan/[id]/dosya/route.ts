import { erisim } from "@/lib/build/ajanErisim";
import { dosyaKaydet, dosyaVerisi } from "@/lib/build/ajanDosya";
import { ajanHam } from "@/lib/build/ajanDepo";
import { hizSiniri, konusmaKimligi } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-vayra-ziyaretci, x-vayra-site, x-vayra-ortam, x-vayra-kimlik, x-vayra-kimlik-imza" };
const hata = (mesaj: string, durum = 400) => Response.json({ ok: false, hata: mesaj }, { status: durum, headers: CORS });

export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }

/**
 * Web kutusunda ziyaretçi dosya yüklemesi (multipart, alan adı "dosya"). Ajanın kutu ayarında dosya yükleme açık
 * olmalı; tür ve boyut sınırı oradan gelir. Erişim mesaj ucuyla aynıdır (ziyaretçi belirteci, izinli alan adı,
 * imzalı kimlik zorunluysa o). Dönüş: { dosya: { id, ad, tur, boyut, url } }; mesaj gönderilirken id'ler eklenir.
 */
export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).id;
  const e = await erisim(req, id);
  if ("hata" in e) return e.hata;
  if (e.kaynak === "api") return hata("Dosya yükleme yalnız sohbet kutusunda.", 403);
  const ayar = e.y.ajan.yayin.kutu.dosya;
  if (!ayar?.acik) return hata("Bu sohbette dosya yükleme kapalı.", 403);
  if (!hizSiniri(`dosya:${id}:${e.kimlik}`, 10, 10 * 60_000)) return hata("Çok fazla dosya yükledin; biraz sonra tekrar dene.", 429);
  const uzunluk = Number(req.headers.get("content-length") ?? 0);
  if (uzunluk > (Math.min(10, ayar.enCokMb) + 1) * 1048576) return hata(`Dosya çok büyük; en çok ${Math.min(10, ayar.enCokMb)} MB.`, 413);
  let f: FormDataEntryValue | null = null;
  try { f = (await req.formData()).get("dosya"); } catch { return hata("Dosya okunamadı."); }
  if (!f || typeof f === "string") return hata("Dosya seçilmedi.");
  const r = await dosyaKaydet({ ajanId: id, konusma: konusmaKimligi(id, e.kimlik), ad: f.name, veri: Buffer.from(await f.arrayBuffer()), turler: ayar.turler, enCokMb: ayar.enCokMb });
  if (r.hata) return hata(r.hata, 415);
  return Response.json({ ok: true, dosya: r.dosya }, { headers: CORS });
}

/**
 * Dosyayı sunar: ?d=<24 karakterlik kimlik>. Kimlik tahmin edilemez; ziyaretçi ve gelen kutusundaki temsilci aynı
 * adresi kullanır. Görseller satır içinde, diğerleri indirme olarak; nosniff ve betiği kapatan CSP ile.
 */
export async function GET(req: Request, { params }: Ctx) {
  const id = (await params).id;
  const d = new URL(req.url).searchParams.get("d") ?? "";
  if (!(await ajanHam(id))) return new Response("Bulunamadı", { status: 404 });
  const v = await dosyaVerisi(id, d);
  if (!v) return new Response("Bulunamadı", { status: 404 });
  const gorsel = v.k.tur.startsWith("image/");
  const ad = encodeURIComponent(v.k.ad);
  return new Response(new Uint8Array(v.veri), {
    headers: {
      "Content-Type": v.k.mimeGercek, "Content-Length": String(v.veri.length), "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox", "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `${gorsel || v.k.tur === "application/pdf" ? "inline" : "attachment"}; filename*=UTF-8''${ad}`, "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}
