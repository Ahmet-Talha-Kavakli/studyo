import { projeOku, projeOkuHam } from "@/lib/build/depo";
import {
  dosyalar, dosyaSil, dosyaYaz, klasorler, klasorOlustur, klasorSil, klasorTemizle, kovalar, parcaBaslat, parcaBitir, parcaIptal, parcaOku, parcaYaz,
  ParcaHatasi, PARCA_BOYUTU, tumDosyalar, yolGecerli, type Kova,
} from "@/lib/build/depolama";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { gunlukYaz } from "@/lib/build/gunluk";
import { CORS, hata, sahipAl } from "@/lib/build/sunucu";
import { oturumdanUye } from "@/lib/build/uye";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; kova: string }> };
const C = { ...CORS, "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-build-sahip, x-vayra-oturum, x-vayra-onizleme" };
const yanit = (v: unknown, d = 200) => Response.json(v, { status: d, headers: C });
const adres = (id: string, kova: string, ad: string) => `/api/build/depolama/${id}/${kova}/${ad.split("/").map(encodeURIComponent).join("/")}`;

export function OPTIONS() { return new Response(null, { status: 204, headers: C }); }

/** Kim yüklüyor: sahip/ekip (izleyici değil), önizleme (sahip sayılır) ya da ziyaretçi (kovanın kuralına tabi). */
async function yukleyen(req: Request, id: string): Promise<{ sahipMi: boolean; sahip: string | null; uyeId: string | null; var: boolean }> {
  const sahip = sahipAl(req);
  const sahipMi = !!sahip && !!(await projeOku(id, sahip)) && !(await izleyiciEngeli(id, sahip));
  const p = sahipMi ? null : await projeOkuHam(id);
  if (!sahipMi && !p) return { sahipMi: false, sahip, uyeId: null, var: false };
  const onizleme = !!p && !!req.headers.get("x-vayra-onizleme") && req.headers.get("x-vayra-onizleme") === p.onizlemeBelirteci;
  const uye = sahipMi || onizleme ? null : await oturumdanUye(id, req.headers.get("x-vayra-oturum"));
  return { sahipMi: sahipMi || onizleme, sahip, uyeId: uye?.id ?? null, var: true };
}
function kuralDenetle(k: Kova, y: { sahipMi: boolean; uyeId: string | null }, req: Request, id: string, n = 20): Response | null {
  if (y.sahipMi) return null;
  if (k.yukleme === "kapali") return yanit({ ok: false, hata: "Bu kovaya yükleme kapalı." }, 403);
  if (k.yukleme === "uyeler" && !y.uyeId) return yanit({ ok: false, hata: "Yüklemek için giriş yap." }, 401);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
  if (!hizSiniri(`depolama:${id}:${ip}`, n, 10 * 60_000)) return yanit({ ok: false, hata: "Çok fazla yükleme; biraz sonra dene." }, 429);
  return null;
}

/**
 * Kovadaki dosyalar (sahip): ?klasor=a/b → o klasörün dosyaları ve alt klasörleri; ?hepsi=1 → bütün dosyalar (arama).
 * ?parca=<oturum> → yarım yüklemenin durumu (yükleyen istemci de sorar; oturum kimliği gizli anahtardır).
 */
export async function GET(req: Request, { params }: Ctx) {
  const { id, kova } = await params;
  const q = new URL(req.url).searchParams;
  if (q.get("parca")) {
    const o = await parcaOku(id, q.get("parca")!);
    return o && o.kova === kova ? yanit({ ok: true, alinan: o.alinan, boyut: o.boyut, parca: PARCA_BOYUTU }) : yanit({ ok: false, hata: "Yükleme oturumu bulunamadı." }, 404);
  }
  const sahip = sahipAl(req);
  if (!sahip || !(await projeOku(id, sahip))) return yanit({ ok: false }, 403);
  if (!(await kovalar(id)).some((k) => k.ad === kova)) return yanit({ ok: false, hata: "Kova bulunamadı." }, 404);
  if (q.get("hepsi") === "1") return yanit({ ok: true, dosyalar: await tumDosyalar(id, kova, 2000), klasorler: [] });
  const klasor = klasorTemizle(q.get("klasor"));
  if (klasor === null) return yanit({ ok: false, hata: "Klasör yolu geçersiz." }, 400);
  return yanit({ ok: true, klasor, dosyalar: await dosyalar(id, kova, klasor), klasorler: await klasorler(id, kova, klasor) });
}

/**
 * Yükle (multipart "dosya", isteğe bağlı "klasor"): sahip her zaman; yayındaki siteden ziyaretçi kovanın yükleme kuralına
 * göre. Parçalı yükleme: POST ?parca=baslat { ad, boyut, klasor? } → { oturum }; PUT ?parca=<oturum>&ofset=<n> (ham
 * parça, en çok 5 MB); POST ?parca=<oturum>&bitir=1 → dosya. Sahip: POST ?klasor=yeni { yol } klasör oluşturur.
 */
export async function POST(req: Request, { params }: Ctx) {
  const { id, kova } = await params;
  const q = new URL(req.url).searchParams;
  const y = await yukleyen(req, id);
  if (!y.var) return yanit({ ok: false, hata: "Proje bulunamadı." }, 404);
  const k = (await kovalar(id)).find((x) => x.ad === kova);
  if (!k) return yanit({ ok: false, hata: "Kova bulunamadı." }, 404);
  if (q.get("klasor") === "yeni") {
    if (!y.sahipMi || !y.sahip) return yanit({ ok: false, hata: "Yetki yok." }, 403);
    let g: { yol?: string } = {};
    try { g = await req.json(); } catch { /* boş */ }
    const yol = klasorTemizle(g.yol);
    if (!yol) return yanit({ ok: false, hata: "Klasör adı yalnız harf, rakam, nokta, tire ve alt çizgi olabilir (en çok 5 düzey)." }, 400);
    try { await klasorOlustur(id, kova, yol); } catch (e) { return yanit({ ok: false, hata: (e as Error).message }, 400); }
    denetimYaz(id, { tur: "dosya", kim: await denetimKim(id, y.sahip), mesaj: `${kova}/${yol} klasörü oluşturuldu` });
    return yanit({ ok: true, yol });
  }
  const parca = q.get("parca");
  if (parca === "baslat") {
    const engel = kuralDenetle(k, y, req, id, 20);
    if (engel) return engel;
    let g: { ad?: string; boyut?: number; klasor?: string } = {};
    try { g = await req.json(); } catch { return yanit({ ok: false, hata: "Geçersiz istek." }, 400); }
    try { const o = await parcaBaslat(id, k, { ad: String(g.ad ?? ""), boyut: Number(g.boyut), klasor: g.klasor }); return yanit({ ok: true, oturum: o.id, parca: PARCA_BOYUTU, alinan: 0 }); }
    catch (e) { return yanit({ ok: false, hata: (e as Error).message }, 413); }
  }
  if (parca) {
    if (q.get("bitir") !== "1") return yanit({ ok: false, hata: "Parça göndermek için PUT kullan." }, 405);
    try {
      const d = await parcaBitir(id, k, parca);
      gunlukYaz(id, { t: "dosya", d: 201, m: `${kova}/${d.ad} parçalı yüklendi (${Math.round(d.boyut / 1024 / 1024 * 10) / 10} MB)${y.sahipMi ? "" : ", ziyaretçi"}` });
      return yanit({ ok: true, dosya: d, adres: adres(id, kova, d.ad) });
    } catch (e) { return yanit({ ok: false, hata: (e as Error).message, ...(e instanceof ParcaHatasi && e.alinan !== undefined ? { alinan: e.alinan } : {}) }, e instanceof ParcaHatasi ? e.durum : 400); }
  }
  const engel = kuralDenetle(k, y, req, id, 20);
  if (engel) return engel;
  let f: File | null = null, klasorHam = "";
  try { const fd = await req.formData(); const v = fd.get("dosya"); f = v instanceof File ? v : null; klasorHam = String(fd.get("klasor") ?? ""); } catch { /* aşağıda */ }
  if (!f) return yanit({ ok: false, hata: "Dosya gönderilmedi (alan adı: dosya)." }, 400);
  const klasor = klasorTemizle(klasorHam);
  if (klasor === null) return yanit({ ok: false, hata: "Klasör yolu geçersiz." }, 400);
  try {
    const d = await dosyaYaz(id, k, f.name, Buffer.from(await f.arrayBuffer()), klasor);
    gunlukYaz(id, { t: "dosya", d: 201, m: `${kova}/${d.ad} yüklendi (${Math.round(d.boyut / 1024)} KB)${y.sahipMi ? "" : ", ziyaretçi"}` });
    return yanit({ ok: true, dosya: d, adres: adres(id, kova, d.ad) });
  } catch (e) { return yanit({ ok: false, hata: (e as Error).message }, 413); }
}

/** Parça ekle: PUT ?parca=<oturum>&ofset=<n>, gövde ham bayt. Ofset kaydıysa 409 ve doğru ofset döner. */
export async function PUT(req: Request, { params }: Ctx) {
  const { id, kova } = await params;
  const q = new URL(req.url).searchParams;
  const oturum = q.get("parca") ?? "";
  const o = await parcaOku(id, oturum);
  if (!o || o.kova !== kova) return yanit({ ok: false, hata: "Yükleme oturumu bulunamadı ya da süresi doldu." }, 404);
  const ofset = Number(q.get("ofset"));
  if (!Number.isInteger(ofset) || ofset < 0) return yanit({ ok: false, hata: "Ofset geçersiz." }, 400);
  const uzunluk = Number(req.headers.get("content-length") ?? 0);
  if (uzunluk > PARCA_BOYUTU + 1024) return yanit({ ok: false, hata: "Parça en çok 5 MB olabilir." }, 413);
  try {
    const veri = Buffer.from(await req.arrayBuffer());
    const x = await parcaYaz(id, oturum, ofset, veri);
    return yanit({ ok: true, alinan: x.alinan, boyut: x.boyut });
  } catch (e) {
    if (e instanceof ParcaHatasi) return yanit({ ok: false, hata: e.message, ...(e.alinan !== undefined ? { alinan: e.alinan } : {}) }, e.durum);
    return yanit({ ok: false, hata: "Parça yazılamadı." }, 500);
  }
}

/** Sahip: ?ad=<dosya yolu> dosyayı, ?klasor=<yol> klasörü içindekilerle siler; ?parca=<oturum> yarım yüklemeyi iptal eder. */
export async function DELETE(req: Request, { params }: Ctx) {
  const { id, kova } = await params;
  const sahip = sahipAl(req);
  if (!sahip || !(await projeOku(id, sahip))) return hata("Yetki yok.", 403);
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  const q = new URL(req.url).searchParams;
  if (q.get("parca")) { await parcaIptal(id, q.get("parca")!); return Response.json({ ok: true }); }
  if (q.get("klasor")) {
    const yol = klasorTemizle(q.get("klasor"));
    if (!yol) return hata("Klasör yolu geçersiz.");
    const n = await klasorSil(id, kova, yol).catch(() => -1);
    if (n < 0) return hata("Klasör silinemedi.");
    gunlukYaz(id, { t: "dosya", m: `${kova}/${yol} klasörü silindi (${n} dosya)` });
    denetimYaz(id, { tur: "dosya", kim: await denetimKim(id, sahip), mesaj: `${kova}/${yol} klasörü ve içindeki ${n} dosya silindi` });
    return Response.json({ ok: true, adet: n });
  }
  const ad = q.get("ad") ?? "";
  if (!yolGecerli(ad)) return hata("Dosya yolu geçersiz.");
  await dosyaSil(id, kova, ad);
  gunlukYaz(id, { t: "dosya", m: `${kova}/${ad} silindi` });
  return Response.json({ ok: true });
}
