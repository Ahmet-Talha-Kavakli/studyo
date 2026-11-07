import { baglantiGetir } from "@/lib/build/baglantiDepo";
import { sahipOzeti } from "@/lib/build/depo";
import { ucBelirteci, ucKullaniciGecerli, ucListele, ucSayfasi, ucSil } from "@/lib/build/baglantiUcDepo";
import { istekKokeni } from "@/lib/build/mcpOauth";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Uç kullanıcı hesapları: kullanıcılar (gizli değer yok), kip açık mı. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const b = await baglantiGetir((await params).id, sahip);
  if (!b) return hata("Bağlantı bulunamadı.", 404);
  return Response.json({ ok: true, acik: !!b.ucKullanici?.acik, kullanicilar: await ucListele(b.id) });
}

/** { kullanici, donus? }: bu kullanıcı için 4 saat geçerli bağlanma adresi. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const b = await baglantiGetir((await params).id, sahip);
  if (!b) return hata("Bağlantı bulunamadı.", 404);
  if (!b.ucKullanici?.acik) return hata("Önce kullanıcı hesapları kipini aç.");
  let g: { kullanici?: string; donus?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (!ucKullaniciGecerli(g.kullanici)) return hata("Kullanıcı kimliği harf, rakam ve . _ - @ : + içerebilir (en çok 128).");
  const donus = typeof g.donus === "string" && /^https:\/\/\S{4,300}$/.test(g.donus) ? g.donus : undefined;
  return Response.json({ ok: true, adres: `${istekKokeni(req)}${ucSayfasi(ucBelirteci({ baglantiId: b.id, sahipOz: sahipOzeti(sahip), kullanici: g.kullanici, donus }))}` });
}

/** ?kullanici=…: kullanıcının hesabını siler (belirteçleri ve anahtarları kasadan çıkar). */
export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const b = await baglantiGetir((await params).id, sahip);
  if (!b) return hata("Bağlantı bulunamadı.", 404);
  return (await ucSil(b.id, new URL(req.url).searchParams.get("kullanici") ?? "")) ? Response.json({ ok: true }) : hata("Kullanıcı bulunamadı.", 404);
}
