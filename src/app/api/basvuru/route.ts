import { NextResponse } from "next/server";
import { pozisyonBul } from "@/lib/kurumsal/pozisyonlar";

export const runtime = "nodejs";

const AZAMI_BOYUT = 8 * 1024 * 1024;
const IZINLI = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

/**
 * İş başvurusu — /kariyer/[slug] formu multipart/form-data gönderir.
 * Alanlar doğrulanır, CV türü ve boyutu kontrol edilir. Başvuru sunucu kaydına düşer;
 * işe alım sistemi (ATS) anahtarı eklendiğinde buradan iletilecek.
 */
export async function POST(req: Request) {
  let f: FormData;
  try { f = await req.formData(); } catch { return NextResponse.json({ ok: false, hata: "Geçersiz form." }, { status: 400 }); }

  const al = (k: string) => String(f.get(k) ?? "").trim();
  const pozisyon = al("pozisyon"), ad = al("ad"), email = al("email"), baglanti = al("baglanti"), not = al("not"), konum = al("konum");
  const cv = f.get("cv");

  if (pozisyon !== "genel" && !pozisyonBul(pozisyon)) return NextResponse.json({ ok: false, hata: "Pozisyon bulunamadı." }, { status: 404 });
  if (ad.length < 3 || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ ok: false, hata: "Ad ve geçerli bir e-posta gerekli." }, { status: 422 });
  if (!(cv instanceof File) || cv.size === 0) return NextResponse.json({ ok: false, hata: "CV dosyası gerekli." }, { status: 422 });
  if (cv.size > AZAMI_BOYUT) return NextResponse.json({ ok: false, hata: "CV en fazla 8 MB olabilir." }, { status: 413 });
  if (!IZINLI.includes(cv.type)) return NextResponse.json({ ok: false, hata: "CV PDF ya da Word dosyası olmalı." }, { status: 415 });
  if (baglanti && !/^https?:\/\/\S+$/.test(baglanti)) return NextResponse.json({ ok: false, hata: "Portföy bağlantısı geçerli bir adres olmalı." }, { status: 422 });

  console.log(`[basvuru] ${pozisyon} · ${ad} <${email}> · ${konum || "-"} · CV ${cv.name} (${Math.round(cv.size / 1024)} KB) · ${baglanti || "-"} · ${not.slice(0, 300)}`);
  return NextResponse.json({ ok: true });
}
