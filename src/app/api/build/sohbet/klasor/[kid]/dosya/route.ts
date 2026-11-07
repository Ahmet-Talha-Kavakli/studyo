import { randomBytes } from "crypto";
import { officeBicimi, officeOku } from "@/lib/build/belgeOku";
import { pdfMetni } from "@/lib/build/sohbetEk";
import { KLASOR_SINIRI, klasorAcik, klasorlerGuncelleOz, type KlasorDosyasi } from "@/lib/build/sohbetKlasor";
import { klasorErisimi } from "@/lib/build/sohbetOrtak";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ kid: string }> };
const METIN = /\.(txt|md|markdown|csv|tsv|json|jsonl|xml|html?|css|js|jsx|ts|tsx|py|sql|ya?ml|log|srt|vtt)$/i;

/** Office belgesinin okunur metni (başlıklar, paragraflar, tablo hücreleri, slayt metinleri). */
function duzMetin(v: unknown, d = 0): string {
  if (d > 8 || v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => duzMetin(x, d + 1)).filter(Boolean).join(Array.isArray(v[0]) ? "\n" : " | ");
  return Object.entries(v as Record<string, unknown>).filter(([k]) => !/^(stil|renk|font|gorsel|bicim|genislik|yukseklik|tema)$/i.test(k)).map(([, x]) => duzMetin(x, d + 1)).filter(Boolean).join("\n");
}

/** Dosyanın tam içeriği (önizleme paneli): ?dosya=<id>. */
export async function GET(req: Request, { params }: Ctx) {
  if (!sahipAl(req)) return yetkisiz();
  const e = await klasorErisimi(req, (await params).kid);
  if (!e) return hata("Klasör bulunamadı.", 404);
  const d = e.k.dosyalar.find((x) => x.id === new URL(req.url).searchParams.get("dosya"));
  return d ? Response.json({ ok: true, dosya: { ...d, icerik: d.icerik.slice(0, 400_000) } }) : hata("Dosya bulunamadı.", 404);
}

/** Bilgi dosyası ekle (multipart "dosya" ya da { ad, metin, not? }): PDF, Word, Excel, PowerPoint ve metin dosyaları metne çevrilir. */
export async function POST(req: Request, { params }: Ctx) {
  if (!sahipAl(req)) return yetkisiz();
  const kid = (await params).kid;
  const e = await klasorErisimi(req, kid);
  if (!e) return hata("Klasör bulunamadı.", 404);
  if (e.rol === "izleyici") return hata("Bu klasörde yalnız görüntüleme iznin var.", 403);
  let ad = "", icerik = "", tur: KlasorDosyasi["tur"] = "metin", boyut = 0;
  if ((req.headers.get("content-type") ?? "").includes("multipart")) {
    const f = (await req.formData().catch(() => null))?.get("dosya");
    if (!f || typeof f === "string") return hata("Dosya yok.");
    if (f.size > 20 * 1024 * 1024) return hata("Dosya çok büyük (en çok 20 MB).", 413);
    const b = Buffer.from(await f.arrayBuffer());
    ad = f.name || "belge"; boyut = f.size;
    const ofis = officeBicimi(ad, f.type, b);
    if (f.type === "application/pdf" || b.subarray(0, 5).toString("latin1") === "%PDF-") {
      tur = "pdf"; icerik = pdfMetni(b).metin;
      if (!icerik.trim()) return hata("Bu PDF'ten metin çıkarılamadı (taranmış görüntü olabilir).", 422);
    } else if (ofis) {
      tur = "ofis";
      try { icerik = duzMetin(await officeOku(b, ad, ofis)).replace(/\n{3,}/g, "\n\n").trim(); } catch { return hata("Bu Office dosyası okunamadı.", 422); }
      if (!icerik) return hata("Bu dosyada metin bulunamadı.", 422);
    } else if (METIN.test(ad) || f.type.startsWith("text/") || /json|xml|csv/.test(f.type)) icerik = b.toString("utf8").replace(/\u0000/g, "");
    else return hata("Bu dosya türü desteklenmiyor. PDF, Word, Excel, PowerPoint ya da metin dosyası ekle.", 415);
  } else {
    let g: { ad?: string; metin?: string; not?: boolean };
    try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
    ad = String(g.ad ?? "Not").trim().slice(0, 120) || "Not"; icerik = String(g.metin ?? ""); boyut = icerik.length;
    if (g.not) tur = "not";
    if (!icerik.trim()) return hata("Metin boş.");
  }
  const ekleyen = e.rol === "sahip" ? undefined : e.kimlik?.ad;
  const k = await klasorlerGuncelleOz(e.oz, (l) => {
    const x = l.find((y) => y.id === kid);
    if (!x) return "yok" as const;
    if (x.dosyalar.length >= KLASOR_SINIRI.dosya) return "adet" as const;
    if (x.dosyalar.reduce((t, d) => t + d.icerik.length, 0) + icerik.length > KLASOR_SINIRI.toplam) return "boyut" as const;
    x.dosyalar.push({ id: randomBytes(5).toString("base64url"), ad: ad.slice(0, 120), tur, boyut, icerik, eklenme: Date.now(), ...(ekleyen ? { ekleyen } : {}) });
    x.guncelleme = Date.now();
    return x;
  });
  if (k === "yok") return hata("Klasör bulunamadı.", 404);
  if (k === "adet") return hata(`Bir klasörde en çok ${KLASOR_SINIRI.dosya} dosya olabilir.`);
  if (k === "boyut") return hata("Klasörün bilgi sınırı doldu (3 milyon karakter).");
  const { ekip: _e, ...acik } = klasorAcik(k); void _e;
  return Response.json({ ok: true, klasor: acik });
}

/** ?dosya=<id> sil */
export async function DELETE(req: Request, { params }: Ctx) {
  if (!sahipAl(req)) return yetkisiz();
  const kid = (await params).kid;
  const e = await klasorErisimi(req, kid);
  if (!e) return hata("Klasör bulunamadı.", 404);
  if (e.rol === "izleyici") return hata("Bu klasörde yalnız görüntüleme iznin var.", 403);
  const did = new URL(req.url).searchParams.get("dosya");
  const k = await klasorlerGuncelleOz(e.oz, (l) => { const x = l.find((y) => y.id === kid); if (!x) return null; x.dosyalar = x.dosyalar.filter((d) => d.id !== did); x.guncelleme = Date.now(); return x; });
  if (!k) return hata("Klasör bulunamadı.", 404);
  const { ekip: _e, ...acik } = klasorAcik(k); void _e;
  return Response.json({ ok: true, klasor: acik });
}
