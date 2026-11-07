import { acikGorunum, baglantilariListele, baglantiTest, baglantiYenile, type Baglanti } from "@/lib/build/baglantiDepo";
import { sahipOzeti } from "@/lib/build/depo";
import { coz } from "@/lib/build/sifre";
import { sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Belirtecin bitişi (şifreli kasadan, yalnız sunucuda). */
function bitis(b: Baglanti): { bitis?: number; yenileme: boolean } {
  try { const t = JSON.parse(coz(b.yetki.tokenlar) ?? "null") as { bitis?: number; yenileme?: string } | null; return { bitis: t?.bitis, yenileme: !!t?.yenileme }; } catch { return { yenileme: false }; }
}

/**
 * Sağlık denetimi. { } : bütün bağlantılar denenir (en çok 4'er). { eskiler: true } : sayfa açılışında sessiz bakım —
 * yalnız 6 saattir denenmeyenler denenir ve 30 dakika içinde dolacak OAuth belirteçleri önceden yenilenir.
 * Giriş yapılmamış OAuth bağlantıları denenmez.
 */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { eskiler?: boolean } = {};
  try { g = await req.json(); } catch { /* boş */ }
  const oz = sahipOzeti(sahip);
  const l = await baglantilariListele(sahip);
  const sonuc: Baglanti[] = [];
  let denenen = 0, yenilenen = 0;
  for (let i = 0; i < l.length; i += 4) {
    const parca = await Promise.all(l.slice(i, i + 4).map(async (b) => {
      if (b.yetki.tur === "oauth" && !b.yetki.tokenlar) return b;
      if (g.eskiler) {
        const t = bitis(b);
        if (t.bitis && t.yenileme && t.bitis - Date.now() < 30 * 60_000) { const r = await baglantiYenile(b.id, oz); yenilenen += r.yenilendi ? 1 : 0; denenen++; return r.baglanti ?? b; }
        if (b.sonKontrol && Date.now() - b.sonKontrol < 6 * 3600_000) return b;
      }
      denenen++;
      return (await baglantiTest(b.id, oz)) ?? b;
    }));
    sonuc.push(...parca);
  }
  return Response.json({ ok: true, denenen, yenilenen, baglantilar: sonuc.map(acikGorunum) });
}
