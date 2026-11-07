import { dokumGetir, dokumMetni } from "@/lib/build/sohbetDokum";
import { sohbetKaydet, sohbetOlustur, yeniMesajId, type SohbetMesaji } from "@/lib/build/sohbetDepo";
import { modelBul } from "@/lib/build/modeller";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/**
 * Dökümle sohbet: yeni sohbet açılır; ilk yanıt dökümün kartını ve özetini gösterir, dökümün tam metni modele
 * bağlam olarak gider (istemciye gönderilmez). Kullanıcı sonra konuşulanlarla ilgili soru sorar.
 */
export async function POST(req: Request, { params }: { params: Promise<{ did: string }> }) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const d = await dokumGetir(sahip, (await params).did);
  if (!d) return hata("Döküm bulunamadı.", 404);
  if (!d.parcalar.length) return hata("Dökümde metin yok.");
  let g: { model?: string } = {};
  try { g = await req.json(); } catch { /* varsayılan */ }
  const s = await sohbetOlustur(sahip, modelBul(g.model).id, { baslik: d.baslik });
  const k: SohbetMesaji = { id: yeniMesajId(), rol: "kullanici", zaman: Date.now(), ust: null, metin: `Toplantı dökümü: ${d.baslik}`, ekBaglam: `<toplanti-dokumu baslik="${d.baslik.replace(/"/g, "'")}">\n${dokumMetni(d).slice(0, 150_000)}\n</toplanti-dokumu>` };
  const ozet = [d.ozet && `**Özet**\n\n${d.ozet}`, d.kararlar?.length && `**Kararlar**\n\n${d.kararlar.map((x) => `- ${x}`).join("\n")}`, d.eylemler?.length && `**Eylem maddeleri**\n\n${d.eylemler.map((x) => `- ${x.metin}${x.sorumlu ? ` (${x.sorumlu}${x.tarih ? `, ${x.tarih}` : ""})` : ""}`).join("\n")}`].filter(Boolean).join("\n\n");
  const metin = `${ozet || "Döküm hazır."}\n\nDökümün tamamını okudum; konuşulanlarla ilgili istediğini sorabilirsin.`;
  const a: SohbetMesaji = {
    id: yeniMesajId(), rol: "asistan", zaman: Date.now(), ust: k.id, model: s.model, durum: "bitti",
    parcalar: [{ tur: "arac", id: `dokum-${d.id}`, ad: "ses_dokumu", baslik: "Ses dökümü", durum: "bitti", sonuc: { tur: "dokum", id: d.id, baslik: d.baslik, sure: d.sure, konusmaci: d.konusmacilar.length, ozet: (d.ozet ?? "").slice(0, 300), eylem: d.eylemler?.length ?? 0 } }, { tur: "metin", metin }],
    api: [{ role: "assistant", content: [{ type: "text", text: metin }] }],
  };
  s.mesajlar = [k, a];
  s.secim = {};
  s.guncelleme = Date.now();
  await sohbetKaydet(s, sahip);
  return Response.json({ ok: true, id: s.id });
}
