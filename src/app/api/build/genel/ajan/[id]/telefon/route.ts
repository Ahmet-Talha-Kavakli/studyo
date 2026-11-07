import { ajanSayacArtir, yayindakiAjan } from "@/lib/build/ajanDepo";
import { TwiML, sesMetni, twilioImzaDogru } from "@/lib/build/ajanTwilio";
import { ziyaretciMesaji, type ZiyaretSonuc } from "@/lib/build/ajanZiyaret";
import { coz } from "@/lib/build/sifre";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/* Görüşme başına süren yanıt: Twilio 15 saniye bekler; uzun yanıt Redirect ile sonraki istekte okunur (süreç içi). */
type Bekleyen = { bas: number; sonuc?: ZiyaretSonuc; hata?: string };
const bekleyenler = new Map<string, Bekleyen>();
const temizle = () => { const t = Date.now(); for (const [k, v] of bekleyenler) if (t - v.bas > 10 * 60_000) bekleyenler.delete(k); };

/** Twilio'nun imzaladığı tam adres (vekil sunucu arkasında X-Forwarded başlıklarıyla). */
function tamAdres(req: Request) {
  const u = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? u.host;
  const proto = req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
  return `${proto}://${host}${u.pathname}${u.search}`;
}

/**
 * Twilio sesli arama webhook'u (TwiML). Karşılama okunur, arayan konuşur (tr-TR konuşma tanıma), konuşma yayındaki
 * ajana gider ve yanıt seçilen Türkçe sesle okunur; görüşme sürdükçe aynı konuşmaya yazılır (arayan numarası kimliktir).
 * Ajan insana devrederse aktarma numarası varsa arama oraya bağlanır. Her istek X-Twilio-Signature ile doğrulanır.
 */
export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).id;
  const y = await yayindakiAjan(id);
  if (!y) return TwiML.yanit(TwiML.soyle("Bu hat şu an kullanılmıyor.", "Polly.Filiz") + TwiML.kapat());
  const t = y.ajan.yayin.twilio;
  const token = coz(t?.tokenSifreli);
  const ham = await req.text();
  const p = Object.fromEntries(new URLSearchParams(ham)) as Record<string, string>;
  const adres = tamAdres(req);
  if (!token || !twilioImzaDogru(token, adres, p, req.headers.get("x-twilio-signature"))) return new Response("İmza geçersiz", { status: 403 });
  const ses = t.ses || "Polly.Filiz";
  const soyle = (m: string) => TwiML.soyle(m, ses);
  if (!y.ajan.yayin.kanallar.telefon) return TwiML.yanit(soyle("Bu hat şu an kapalı. Daha sonra tekrar arayın.") + TwiML.kapat());
  const u = new URL(adres);
  const temel = `${u.origin}${u.pathname}`;
  const adim = u.searchParams.get("adim") ?? "";
  const n = Number(u.searchParams.get("n")) || 0;
  const arama = p.CallSid ?? "";
  const dinle = (m: string, tekrar = 0) => TwiML.dinle(`${temel}?adim=konus&n=${tekrar}`, soyle(m)) + soyle("Sizi duyamadım. Görüşmek üzere.") + TwiML.kapat();
  const yanitla = (b: Bekleyen) => {
    bekleyenler.delete(arama);
    const r = b.sonuc;
    if (!r || r.tur === "hata") return TwiML.yanit(dinle(r?.tur === "hata" ? r.hata : "Şu an yanıt veremiyorum. Sorunuzu tekrar söyler misiniz?"));
    if (r.tur === "insanda") return TwiML.yanit(t.aktarma ? soyle("Sizi ekibimize bağlıyorum.") + TwiML.aktar(t.aktarma) : soyle("Ekibimiz bu konuşmayla ilgileniyor; sizi en kısa sürede geri arayacağız. İyi günler.") + TwiML.kapat());
    if (r.tur === "anket") return TwiML.yanit(soyle(r.yanit) + TwiML.kapat());
    const metin = sesMetni(r.sonuc.metinler.join(" ") || "Bunu anlayamadım, başka şekilde söyler misiniz?");
    if (r.sonuc.devredildi) return TwiML.yanit(soyle(metin) + (t.aktarma ? soyle("Sizi şimdi bir temsilciye bağlıyorum.") + TwiML.aktar(t.aktarma) : soyle("Ekibimiz sizi bu numaradan geri arayacak. İyi günler.") + TwiML.kapat()));
    return TwiML.yanit(dinle(metin));
  };

  if (!adim) {
    await ajanSayacArtir(id, (a) => { a.yayin.twilio = { ...a.yayin.twilio, sonOlay: Date.now() }; }).catch(() => {});
    return TwiML.yanit(dinle(t.karsilama || "Merhaba, size nasıl yardımcı olabilirim?"));
  }
  if (adim === "konus") {
    const soz = (p.SpeechResult ?? "").trim();
    if (!soz) return TwiML.yanit(n >= 2 ? soyle("Sizi duyamıyorum. Görüşmek üzere.") + TwiML.kapat() : dinle("Sizi duyamadım, tekrar söyler misiniz?", n + 1));
    temizle();
    const b: Bekleyen = { bas: Date.now() };
    bekleyenler.set(arama, b);
    const kimden = (p.From ?? arama).replace(/[^\d+]/g, "").slice(0, 20) || arama;
    const is = ziyaretciMesaji({ y, kimlik: `tel:${kimden}`.padEnd(8, "_"), kaynak: "telefon", adres: kimden, metin: soz.slice(0, 2000), iletisim: { telefon: kimden, zaman: Date.now() } })
      .then((r) => { b.sonuc = r; }).catch((e) => { b.hata = (e as Error).message; });
    await Promise.race([is, new Promise((r) => setTimeout(r, 7000))]);
    if (b.sonuc || b.hata) return yanitla(b);
    return TwiML.yanit(TwiML.bekle(2, `${temel}?adim=bekle&n=1`));
  }
  if (adim === "bekle") {
    const b = bekleyenler.get(arama);
    if (!b) return TwiML.yanit(dinle("Kaldığımız yerden devam edelim; nasıl yardımcı olabilirim?"));
    if (b.sonuc || b.hata) return yanitla(b);
    if (n >= 8) { bekleyenler.delete(arama); return TwiML.yanit(soyle("Yanıt hazırlanması uzun sürdü; ekibimiz sizi geri arayacak.") + TwiML.kapat()); }
    return TwiML.yanit(TwiML.bekle(2, `${temel}?adim=bekle&n=${n + 1}`));
  }
  return TwiML.yanit(dinle("Nasıl yardımcı olabilirim?"));
}
