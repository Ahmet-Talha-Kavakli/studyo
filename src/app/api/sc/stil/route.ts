import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Yazı örneğinden yanıt stili çıkarır (Claude "stil oluştur").
   Model yoksa örnekten ÖLÇÜLEN özelliklerle (cümle uzunluğu, hitap, madde/emoji kullanımı) kural tabanlı talimat yazar. */

const SISTEM = `Kullanıcının bir yazı örneği verilecek. Bu yazının üslubunu bir yapay zekâ asistanının taklit edebileceği şekilde tarif et.
Ton, resmiyet, hitap biçimi (sen/siz), cümle uzunluğu, paragraf yapısı, madde işareti ve başlık kullanımı, kelime seçimi, mizah, emoji gibi özelliklere bak.
İçeriği değil yalnızca üslubu tarif et; örnekteki kişisel bilgileri yazma.
Biçim: ilk satır 1-3 kelimelik stil adı. Sonra boş satır. Sonra asistana yönelik 4-7 maddelik talimat ("- " ile, emir kipinde, örneğin dilinde).`;

function olcerekTarif(ornek: string) {
  const cumleler = ornek.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length > 2);
  const ortKelime = cumleler.length ? cumleler.reduce((t, s) => t + s.split(/\s+/).length, 0) / cumleler.length : 14;
  const kucuk = ornek.toLocaleLowerCase("tr");
  const siz = (kucuk.match(/\b(siz|sizin|sizi|size|sizinle)\b|[ıiuü]n[ıiuü]z\b/g) ?? []).length;
  const sen = (kucuk.match(/\b(sen|senin|seni|sana|seninle)\b/g) ?? []).length;
  const madde = (ornek.match(/^\s*(?:[-*•]|\d+[.)])\s+/gm) ?? []).length;
  const emoji = (ornek.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  const unlem = (ornek.match(/!/g) ?? []).length;
  const baslik = (ornek.match(/^#{1,4}\s/gm) ?? []).length;
  const t: string[] = [];
  t.push(ortKelime < 11 ? "- Kısa, vurucu cümleler kur (ortalama 10 kelimenin altında)." : ortKelime > 22 ? "- Uzun, bağlaçlarla akan, ayrıntılı cümleler kur." : "- Orta uzunlukta, akıcı cümleler kur.");
  if (siz > sen) t.push("- Okura \"siz\" diye, saygılı ve resmî bir dille hitap et."); else if (sen > 0) t.push("- Okura \"sen\" diye, samimi ve doğrudan hitap et.");
  t.push(madde >= 3 ? "- Bilgiyi madde işaretleriyle düzenle." : "- Madde işareti yerine düzyazı paragraflar kullan.");
  if (baslik) t.push("- Bölümleri kısa başlıklarla ayır.");
  t.push(emoji ? "- Yerinde ve ölçülü emoji kullan." : "- Emoji kullanma.");
  if (unlem / Math.max(cumleler.length, 1) > 0.25) t.push("- Enerjik ve coşkulu bir ton kullan; ünlemden kaçınma.");
  t.push("- Örnekteki kelime seçimini ve ritmi koru; aynı sıcaklık ya da mesafede yaz.");
  const ad = siz > sen ? "Resmî ve özenli" : ortKelime < 11 ? "Kısa ve vurucu" : emoji ? "Samimi ve renkli" : "Kişisel üslubum";
  return { ad, talimat: t.join("\n") };
}

export async function POST(req: Request) {
  let g: { ornek?: string };
  try { g = await req.json(); } catch { return Response.json({ hata: "geçersiz" }, { status: 400 }); }
  const ornek = (g.ornek ?? "").trim();
  if (ornek.length < 80) return Response.json({ hata: "Örnek çok kısa" }, { status: 400 });
  if (!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)) return Response.json({ ...olcerekTarif(ornek), demo: true });
  try {
    const client = new Anthropic();
    const m = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 600,
      system: SISTEM,
      messages: [{ role: "user", content: `<ornek>\n${ornek.slice(0, 20000)}\n</ornek>` }],
    }, { signal: req.signal });
    const metin = m.content.map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
    const [ilk, ...geri] = metin.split("\n");
    const talimat = geri.join("\n").trim();
    if (!talimat) return Response.json(olcerekTarif(ornek));
    return Response.json({ ad: ilk.replace(/^[#*\s"“]+|["”*\s]+$/g, "").slice(0, 40) || "Özel stil", talimat: talimat.slice(0, 3000) });
  } catch {
    return Response.json({ ...olcerekTarif(ornek), demo: true });
  }
}
