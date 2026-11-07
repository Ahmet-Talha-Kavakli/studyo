import { ajanlariListele } from "@/lib/build/ajanDepo";
import { baglantilariListele } from "@/lib/build/baglantiDepo";
import { bellekGetir } from "@/lib/build/sohbetBellek";
import { klasorleriGetir } from "@/lib/build/sohbetKlasor";
import { sahipAl } from "@/lib/build/sunucu";
import { yetenekleriListele } from "@/lib/build/yetenekDepo";

export const dynamic = "force-dynamic";

/** Komut kutusunun "+" menüsü ve @ bahsetmeleri için: bağlantılar, yetenekler, ajanlar, klasörler, bellek durumu. */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, baglantilar: [], yetenekler: [], ajanlar: [], klasorler: [], bellek: { acik: false, kayit: 0, kisisel: false } });
  const [b, y, a, k, m] = await Promise.all([baglantilariListele(sahip), yetenekleriListele(sahip), ajanlariListele(sahip), klasorleriGetir(sahip), bellekGetir(sahip)]);
  return Response.json({
    ok: true,
    baglantilar: b.map((x) => ({ id: x.id, ad: x.ad, logo: x.logo, sohbette: x.sohbette, durum: x.durum, arac: x.araclar.length, saltOkunur: x.saltOkunur })),
    yetenekler: y.map((x) => ({ id: x.id, ad: x.ad, baslik: x.baslik, aciklama: x.aciklama, simge: x.simge, herSohbette: x.herSohbette, cagri: x.cagri ?? "model" })),
    ajanlar: a.map((x) => ({ id: x.id, ad: x.ad, aciklama: x.aciklama, simge: x.simge, model: x.model })),
    klasorler: k.map((x) => ({ id: x.id, ad: x.ad, renk: x.renk })),
    bellek: { acik: m.acik, kayit: m.kayitlar.length, kisisel: !!(m.hakkimda.trim() || m.tarz !== "varsayilan") },
  });
}
