import { sablonBul } from "@/lib/build/sablonlar";
import { dosyaSun } from "@/lib/build/sun";
import { CORS } from "@/lib/build/sunucu";
import type { Proje } from "@/lib/build/tipler";

export const dynamic = "force-dynamic";

/**
 * Şablonun canlı önizlemesi (proje oluşturmadan): galeride "Canlı önizle" bu adresi kum havuzlu iframe'de açar.
 * Formlar gelen kutusuna gitmez (şablonun projesi yok); köprü betiği eklenmez.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ sablon: string; yol?: string[] }> }) {
  const { sablon, yol } = await params;
  const s = sablonBul(sablon);
  if (!s) return new Response("Şablon bulunamadı.", { status: 404, headers: CORS });
  const sahte = {
    id: `sablon-${s.id}`, ad: s.ad, tur: s.tur, dosyalar: s.dosyalar, surumler: [], mesajlar: [], alanAdlari: [], yayin: null,
    olusturma: 0, guncelleme: 0, onizlemeBelirteci: "",
    ayarlar: { altAlan: s.id, gorunurluk: "herkes", seo: { baslik: s.ad, aciklama: s.aciklama, indeks: false }, sirlar: [], rozet: false, talimat: "" },
  } as Proje;
  return dosyaSun(sahte, s.dosyalar, yol, { onizleme: false, kok: `/api/build/sablon/${s.id}` });
}
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
