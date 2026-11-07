import Anthropic from "@anthropic-ai/sdk";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { icerikDenetle } from "@/lib/moderasyon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AI Yönetmen (proje içi), akışlı. Projenin brifini, sahnelerini ve elementlerini (kullanıcının açtığı kadarını) okur;
 * yanıtı Server-Sent Events ile parça parça yollar:
 *   {t:"dusunce", d}  özetlenmiş düşünce parçası
 *   {t:"metin", d}    yanıt metni parçası (Markdown)
 *   {t:"ekler_basladi"} storyboard önerileri yazılmaya başladı
 *   {t:"ekler", sahneler, takip}  doğrulanmış sahne önerileri ve devam istemleri
 *   {t:"bitti", neden} / {t:"hata", m}
 * Kimlik yoksa {ok:true, demo:true} döner; istemci kural tabanlı planlayıcıya düşer ve sonucu "Demo" diye işaretler.
 */

type Mesaj = { rol: "ben" | "yonetmen"; metin: string; gorseller?: string[] };
type Govde = {
  mesajlar?: Mesaj[];
  baglam?: {
    proje?: { ad?: string; tur?: string; aciklama?: string };
    brif?: string | null;
    sahneler?: { id?: string; baslik: string; istem: string; kamera?: string; isik?: string; sure?: number; durum?: string; elementler?: string[]; plan?: string; aci?: string; lens?: string }[] | null;
    elementler?: { ad: string; tur: string; aciklama?: string }[] | null;
    modeller?: { ad: string; tur: "video" | "gorsel"; kredi: number }[];
    butceKalan?: number | null;
  };
  ayar?: { derin?: boolean };
};

const ARAC: Anthropic.Tool = {
  name: "yanit_ekleri",
  description: "Yanıtın sonunda bir kez çağır. Storyboard'a eklenebilecek sahneleri (kullanıcı sahne istemiyorsa boş dizi) ve kullanıcının bir sonraki adımda isteyebileceği 2-3 kısa devam istemini verir.",
  eager_input_streaming: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["sahneler", "takip"],
    properties: {
      sahneler: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["hedef", "baslik", "istem", "plan", "aci", "lens", "kamera", "isik", "sure", "model", "tur", "elementler", "diyalog", "ses", "gecis"],
          properties: {
            hedef: { type: "string", description: "Var olan bir sahneyi değiştiriyorsan o sahnenin id'si (sahneler listesindeki [id]); yeni sahne için boş dize" },
            baslik: { type: "string", description: "En çok 4 kelimelik sahne adı" },
            plan: { type: "string", description: "Plan ölçeği: Çok geniş, Geniş, Boy, Bel, Yakın, Çok yakın, Detay ya da Omuz üstü" },
            aci: { type: "string", description: "Kamera açısı: Göz hizası, Alçak açı, Yüksek açı, Kuşbakışı, Hollanda açısı ya da Bakış açısı" },
            lens: { type: "string", description: "Odak uzaklığı, örn. 24 mm, 35 mm, 50 mm, 85 mm, 135 mm" },
            diyalog: { type: "string", description: "Sahnedeki konuşma ya da dış ses; yoksa boş dize" },
            ses: { type: "string", description: "Ses efekti ve müzik notu, kısa; yoksa boş dize" },
            gecis: { type: "string", description: "Sonraki sahneye geçiş: Kesme, Erime, Eşleşen kesme, Karartma ya da Kaydırma" },
            istem: { type: "string", description: "Üretim istemi: özne, eylem, mekân, kompozisyon. Elementleri @Ad ile an." },
            kamera: { type: "string", description: "Kamera açısı ve hareketi, kısa" },
            isik: { type: "string", description: "Işık ve renk, kısa" },
            sure: { type: "integer", description: "Saniye, 3 ile 10 arası" },
            model: { type: "string", description: "Verilen model listesinden birinin adı, aynen" },
            tur: { type: "string", enum: ["video", "gorsel"] },
            elementler: { type: "array", items: { type: "string" }, description: "Sahnede geçen element adları (@ olmadan)" },
          },
        },
      },
      takip: { type: "array", items: { type: "string" }, description: "Kullanıcının ağzından 2-3 kısa devam istemi, en çok 8 kelime" },
    },
  },
};

const kimlikVar = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const GORSEL_TURU = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/;

type Sahne = { hedef: string; baslik: string; istem: string; plan: string; aci: string; lens: string; kamera: string; isik: string; sure: number; model: string; tur: "video" | "gorsel"; elementler: string[]; diyalog: string; ses: string; gecis: string };
/** Akışla gelen araç girdisi sunucuda doğrulanmaz (eager streaming); burada süzülür. */
function sahneleriSuz(x: unknown, modeller: Set<string>, kimlikler: Set<string>): { sahneler: Sahne[]; takip: string[] } {
  const g = (x ?? {}) as { sahneler?: unknown; takip?: unknown };
  const sahneler = (Array.isArray(g.sahneler) ? g.sahneler : []).flatMap((s): Sahne[] => {
    const o = s as Record<string, unknown>;
    if (typeof o?.baslik !== "string" || typeof o.istem !== "string" || !o.istem.trim()) return [];
    const tur = o.tur === "gorsel" ? "gorsel" : "video";
    return [{
      hedef: typeof o.hedef === "string" && kimlikler.has(o.hedef) ? o.hedef : "",
      baslik: o.baslik.slice(0, 60), istem: o.istem.slice(0, 1200), kamera: String(o.kamera ?? "").slice(0, 80), isik: String(o.isik ?? "").slice(0, 80),
      plan: String(o.plan ?? "").slice(0, 40), aci: String(o.aci ?? "").slice(0, 40), lens: String(o.lens ?? "").slice(0, 20),
      diyalog: String(o.diyalog ?? "").slice(0, 300), ses: String(o.ses ?? "").slice(0, 120), gecis: String(o.gecis ?? "").slice(0, 30),
      sure: Math.min(10, Math.max(3, Math.round(Number(o.sure) || 5))), tur,
      model: typeof o.model === "string" && modeller.has(o.model) ? o.model : "",
      elementler: Array.isArray(o.elementler) ? o.elementler.filter((e): e is string => typeof e === "string").slice(0, 8) : [],
    }];
  }).slice(0, 12);
  const takip = (Array.isArray(g.takip) ? g.takip : []).filter((t): t is string => typeof t === "string" && !!t.trim()).map((t) => t.slice(0, 80)).slice(0, 3);
  return { sahneler, takip };
}

export async function POST(req: Request) {
  // Oturum gerekir: sağlayıcı maliyeti olan uç misafire açık değil (bu iş kredi harcamaz).
  const oturum = await oturumGerekli(req);
  if (oturum instanceof Response) return oturum;
  let g: Govde;
  try { g = (await req.json()) as Govde; } catch { return Response.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 }); }
  const mesajlar = (g.mesajlar ?? []).filter((m) => m.metin?.trim() || m.gorseller?.length).slice(-24);
  if (!mesajlar.length || mesajlar[mesajlar.length - 1].rol !== "ben") return Response.json({ ok: false, hata: "Mesaj boş." }, { status: 400 });
  const denetim = icerikDenetle(mesajlar[mesajlar.length - 1].metin || "");
  if (!denetim.izin) return Response.json({ ok: false, hata: denetim.mesaj }, { status: 422 });
  if (!kimlikVar()) return Response.json({ ok: true, demo: true });

  const b = g.baglam ?? {};
  const modelAdlari = new Set((b.modeller ?? []).map((m) => m.ad));
  const modeller = (b.modeller ?? []).map((m) => `${m.ad} (${m.tur}, ${m.kredi} kredi)`).join(", ");
  const sistem = `Sen Vayra'da bir projenin AI yönetmenisin. Kullanıcıyla Türkçe konuşursun; sıcak ama kısa, net ve yaratıcı kararlar verirsin.
Görevin: projenin brifine sadık kalarak sahneler önermek; kamera, ışık, süre ve model seçmek; sorulara yönetmen gözüyle yanıt vermek. Önerdiğin sahneler storyboard'a eklenip tek tek üretilir.
Yanıt biçimi:
- Önce kısa bir yanıt yaz (çoğu zaman 2-6 cümle). Gerekirse sade Markdown kullan: kalın, kısa liste, küçük başlık. Emoji kullanma.
- Sahneleri metinde tek tek sıralama; onları yanit_ekleri aracına koy. Metinde yalnız neden bu kararları verdiğini anlat.
- Her yanıtın sonunda yanit_ekleri aracını bir kez çağır: sahne yoksa boş dizi ver, takip alanına kullanıcının ağzından 2-3 kısa devam istemi yaz.
Kurallar:
- Brifte yazanlar bağlayıcıdır (ton, kitle, süre, yasaklar). Brifle çelişen bir istek gelirse bunu söyle.
- Karakter ve mekânları elementlerle tutarlı tut: istemde @Ad yaz ve elementler alanına ekle. Listede olmayan element uydurma.
- Model yalnızca şu listeden seçilir: ${modeller || "Kling 3.0 (video), Nano Banana Pro (görsel)"}. Hareket isteyen sahne video, durağan kare görsel.
- İstemler Türkçe ve somut olsun: özne, eylem, mekân, kompozisyon.
- Mevcut sahneleri tekrar önerme. Bir sahnede değişiklik istenirse o sahnenin güncel hâlini öner ve hedef alanına sahnenin id'sini yaz; yeni sahnelerde hedef boş kalır.
- Her sahne için plan ölçeği, açı ve lensi bir görüntü yönetmeni gibi seç; konuşma varsa diyalog alanına yaz, sahnenin sesini ve sonraki sahneye geçişi belirt.
- Kullanıcı görsel eklediyse onu referans al: ruh hâlini, ışığını, kompozisyonunu sahnelere taşı ve bunu söyle.${b.butceKalan != null ? `\n- Projede kalan bütçe ${b.butceKalan} kredi; önerilerin toplamı bunu aşmasın.` : ""}`;
  const baglam = `<proje ad="${b.proje?.ad ?? ""}" tur="${b.proje?.tur ?? ""}">${b.proje?.aciklama ?? ""}</proje>
${b.brif === null ? "<brif>Kullanıcı brifi bu sohbete eklemedi.</brif>" : `<brif>\n${(b.brif ?? "").slice(0, 10000) || "Brif boş."}\n</brif>`}
${b.sahneler === null ? "<sahneler>Kullanıcı sahneleri bu sohbete eklemedi.</sahneler>" : `<sahneler>\n${(b.sahneler ?? []).map((s, i) => `${i + 1}. [${s.id ?? ""}] ${s.baslik} | ${[s.plan, s.aci, s.lens].filter(Boolean).join(", ")} | ${s.kamera ?? ""} | ${s.isik ?? ""} | ${s.sure ?? 5} sn | ${s.durum ?? ""}${s.elementler?.length ? ` | ${s.elementler.map((e) => `@${e}`).join(" ")}` : ""} | ${s.istem}`).join("\n") || "Henüz sahne yok."}\n</sahneler>`}
${b.elementler === null ? "<elementler>Kullanıcı elementleri bu sohbete eklemedi.</elementler>" : `<elementler>\n${(b.elementler ?? []).map((e) => `@${e.ad} (${e.tur})${e.aciklama ? `: ${e.aciklama}` : ""}`).join("\n") || "Element yok."}\n</elementler>`}`;

  /* Geçmiş: ilk kullanıcı mesajından başlar; görseller yalnız son mesajda gönderilir (öncekiler metinle anılır). */
  const bas = mesajlar.findIndex((x) => x.rol === "ben");
  const gecmis: Anthropic.MessageParam[] = mesajlar.slice(bas).map((x, i, l) => {
    const son = i === l.length - 1;
    if (x.rol === "yonetmen") return { role: "assistant", content: x.metin || "(yanıt yok)" };
    const metin = son ? `${baglam}\n\n<istek>\n${x.metin || "Eklediğim görsele bak."}\n</istek>` : `${x.metin}${x.gorseller?.length ? `\n(${x.gorseller.length} görsel eklemiştim)` : ""}`;
    if (!son || !x.gorseller?.length) return { role: "user", content: metin };
    const gorseller = x.gorseller.slice(0, 4).flatMap((u): Anthropic.ImageBlockParam[] => {
      const m = u.match(GORSEL_TURU);
      if (m) return [{ type: "image", source: { type: "base64", media_type: m[1] as "image/png" | "image/jpeg" | "image/webp" | "image/gif", data: m[2] } }];
      if (/^https:\/\//.test(u)) return [{ type: "image", source: { type: "url", url: u } }];
      return [];
    });
    return { role: "user", content: [...gorseller, { type: "text", text: metin }] };
  });

  const kodla = new TextEncoder();
  const akis = new ReadableStream({
    async start(ctrl) {
      const yolla = (o: unknown) => { try { ctrl.enqueue(kodla.encode(`data: ${JSON.stringify(o)}\n\n`)); } catch { /* istemci ayrıldı */ } };
      try {
        const client = new Anthropic();
        const stream = client.messages.stream({
          model: "claude-opus-5-5",
          max_tokens: 16000,
          system: sistem,
          thinking: { type: "adaptive", display: "summarized" },
          output_config: { effort: g.ayar?.derin ? "high" : "medium" },
          tools: [ARAC],
          messages: gecmis,
        }, { signal: req.signal });
        for await (const e of stream) {
          if (e.type === "content_block_start" && e.content_block.type === "tool_use") yolla({ t: "ekler_basladi" });
          if (e.type !== "content_block_delta") continue;
          if (e.delta.type === "thinking_delta") yolla({ t: "dusunce", d: e.delta.thinking });
          else if (e.delta.type === "text_delta") yolla({ t: "metin", d: e.delta.text });
        }
        const son = await stream.finalMessage();
        if (son.stop_reason === "refusal") { yolla({ t: "hata", m: "Yönetmen bu isteği yanıtlamadı. İsteği farklı anlatmayı dene." }); ctrl.close(); return; }
        const arac = son.content.find((x): x is Anthropic.ToolUseBlock => x.type === "tool_use" && x.name === "yanit_ekleri");
        /* max_tokens'ta kesilmiş araç girdisi eksik olabilir; o durumda sahne önerme. */
        if (arac && son.stop_reason !== "max_tokens") yolla({ t: "ekler", ...sahneleriSuz(arac.input, modelAdlari, new Set((b.sahneler ?? []).map((s) => s.id).filter((x): x is string => !!x))) });
        yolla({ t: "bitti", neden: son.stop_reason });
      } catch (e) {
        if (req.signal.aborted) { ctrl.close(); return; }
        const m = e instanceof Anthropic.APIError ? `Yönetmen şu an yanıt veremiyor (${e.status ?? "ağ"}). Biraz sonra yeniden dene.` : "Yönetmen yanıtı okunamadı. Yeniden dene.";
        yolla({ t: "hata", m });
      }
      try { ctrl.close(); } catch { /* kapalı */ }
    },
  });
  return new Response(akis, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}
