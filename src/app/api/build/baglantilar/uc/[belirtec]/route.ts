import { baglantiHam, kimlikTanimlari } from "@/lib/build/baglantiDepo";
import { katalogBul } from "@/lib/build/baglantiKatalog";
import { ucBelirtecCoz, ucOku, ucYaz } from "@/lib/build/baglantiUcDepo";
import { sifrele } from "@/lib/build/sifre";
import { hata } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ belirtec: string }> };

async function baglam(belirtec: string) {
  const t = ucBelirtecCoz(belirtec);
  if (!t) return { hata: "Bağlantı adresi geçersiz.", durum: 404 } as const;
  if (t.suresiDoldu) return { hata: "Bu bağlanma adresinin süresi doldu; uygulamadan yenisini iste.", durum: 410 } as const;
  const b = await baglantiHam(t.b, t.s);
  if (!b || !b.ucKullanici?.acik) return { hata: "Bu servis artık kullanıcı hesabı kabul etmiyor.", durum: 404 } as const;
  return { t, b } as const;
}

/** Herkese açık bağlanma sayfasının bilgisi: servis, giriş yöntemi, istenecek alanlar, araçlar (okuma/yazma), kullanıcının durumu. */
export async function GET(_req: Request, { params }: Ctx) {
  const c = await baglam((await params).belirtec);
  if ("hata" in c) return hata(c.hata!, c.durum);
  const { t, b } = c;
  const k = katalogBul(b.katalogId);
  const hs = await ucOku(b.id, t.u);
  const oauth = b.yetki.tur === "oauth" || (!!k?.yetki.includes("oauth") && !b.rest && !k?.yetki.includes("anahtar"));
  const tanimlar = oauth ? [] : kimlikTanimlari(b);
  return Response.json({
    ok: true, servis: { ad: k?.ad ?? b.ad, logo: k?.logo ?? b.logo, acik: k?.logoAcik, genis: k?.logoGenis, yapan: k?.yapan, belge: k?.belge },
    yontem: oauth ? "oauth" : "anahtar", alanlar: tanimlar.map((a) => ({ id: a.id, ad: a.ad, gizli: !!a.gizli, ipucu: a.ipucu })),
    araclar: b.araclar.slice(0, 80).map((a) => ({ ad: a.annotations?.title ?? a.title ?? a.name, okuma: !!a.annotations?.readOnlyHint })),
    kullanici: t.u, bagli: hs?.durum === "etkin", bitis: t.t, donus: t.d,
  });
}

/** Anahtarla giriş: { alanlar } ya da { anahtar } kullanıcının hesabına şifreli yazılır. */
export async function POST(req: Request, { params }: Ctx) {
  const c = await baglam((await params).belirtec);
  if ("hata" in c) return hata(c.hata!, c.durum);
  const { t, b } = c;
  let g: { alanlar?: Record<string, string>; anahtar?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const tanimlar = kimlikTanimlari(b);
  const alanlar: Record<string, string> = {};
  for (const a of tanimlar) {
    const v = String(g.alanlar?.[a.id] ?? "").trim().slice(0, 4000);
    if (v) alanlar[a.id] = v; else if (a.varsayilan) alanlar[a.id] = a.varsayilan; else if (!a.istege && !a.secenekler) return hata(`${a.ad} gerekli.`);
  }
  const anahtar = String(g.anahtar ?? "").trim().slice(0, 4000);
  if (!tanimlar.length && !anahtar) return hata("Anahtarı yapıştır.");
  await ucYaz(b.id, t.u, (h) => { h.yetki = tanimlar.length ? { alanlar: sifrele(JSON.stringify(alanlar)) } : { anahtar: sifrele(anahtar) }; h.durum = "etkin"; });
  return Response.json({ ok: true });
}
