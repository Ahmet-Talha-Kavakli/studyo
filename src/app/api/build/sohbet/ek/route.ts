import { EK_SINIRI, ekKaydet } from "@/lib/build/sohbetEk";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/**
 * Sohbet eki yükle (multipart "dosya"): görsel, PDF, metin ya da Office dosyası (Word, Excel, PowerPoint) → { ek }.
 * PDF'in metni çıkarılır; Office dosyalarının içeriği ajanın düzenleyebileceği yapıya çevrilip sürüm 1 olarak saklanır.
 */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let f: FormDataEntryValue | null;
  try { f = (await req.formData()).get("dosya"); } catch { return hata("Dosya okunamadı."); }
  if (!f || typeof f === "string") return hata("Dosya yok.");
  if (f.size > EK_SINIRI.dosya) return hata(`Dosya çok büyük (en çok ${EK_SINIRI.dosya / 1024 / 1024} MB).`, 413);
  if (!f.size) return hata("Dosya boş.");
  try {
    const ek = await ekKaydet(Buffer.from(await f.arrayBuffer()), f.name, f.type, sahip);
    return Response.json({ ok: true, ek });
  } catch (e) {
    return hata((e as Error).message || "Dosya kaydedilemedi.", 415);
  }
}
