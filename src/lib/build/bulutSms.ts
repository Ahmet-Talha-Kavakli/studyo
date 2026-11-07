import "server-only";

/**
 * SMS gönderimi (üye girişi için tek kullanımlık kod). Sağlayıcı: Netgsm (REST v2, Basic kimlik doğrulama, Türkçe
 * karakter kodlaması). Kimlik bilgileri proje sahibinin kendi Netgsm hesabıdır; Vayra adına SMS gönderilmez.
 * Hata kodları Netgsm belgesindeki anlamlarıyla Türkçe döner.
 */
const NETGSM_KOD: Record<string, string> = {
  "20": "Mesaj metni hatalı ya da çok uzun.", "30": "Netgsm kullanıcı adı ya da şifresi hatalı, API izni yok ya da IP kısıtı var.", "40": "Gönderici başlığı Netgsm hesabında tanımlı değil.",
  "50": "Bu hesapla İYS kontrollü gönderim yapılamıyor.", "51": "İYS marka bilgisi yok.", "70": "Eksik ya da hatalı parametre.", "80": "Netgsm gönderim sınırı aşıldı.", "85": "Aynı numaraya bir dakikada çok fazla gönderim.", "100": "Netgsm sistem hatası.", "101": "Netgsm sistem hatası.",
};

/** Türkiye cep telefonunu 905XXXXXXXXX biçimine çevirir; geçersizse null. */
export function telefonTemizle(t: string): string | null {
  let d = String(t ?? "").replace(/[^\d]/g, "");
  if (d.startsWith("0090")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("05")) d = "9" + d;
  if (d.length === 10 && d.startsWith("5")) d = "90" + d;
  return /^905\d{9}$/.test(d) ? d : null;
}
/** Ekranda gösterim: 0532 *** ** 67 */
export const telefonMaskele = (t: string) => (t.length === 12 ? `0${t.slice(2, 5)} *** ** ${t.slice(-2)}` : t);

export async function netgsmGonder(a: { kullanici: string; sifre: string; baslik: string }, no: string, metin: string): Promise<{ ok: true; is?: string } | { ok: false; hata: string }> {
  if (!a.kullanici || !a.sifre || !a.baslik) return { ok: false, hata: "Netgsm kullanıcı adı, şifre ve gönderici başlığı gerekli." };
  try {
    const r = await fetch("https://api.netgsm.com.tr/sms/rest/v2/send", {
      method: "POST", signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Basic ${Buffer.from(`${a.kullanici}:${a.sifre}`).toString("base64")}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ msgheader: a.baslik, encoding: "TR", messages: [{ msg: metin.slice(0, 900), no }] }),
    });
    const j = await r.json().catch(() => null) as { code?: string | number; jobid?: string; description?: string } | null;
    const kod = j?.code != null ? String(j.code) : null;
    if (kod === "00") return { ok: true, is: j?.jobid };
    if (kod) return { ok: false, hata: `${NETGSM_KOD[kod] ?? j?.description ?? "Netgsm hatası"} (kod ${kod})` };
    return { ok: false, hata: `Netgsm yanıt vermedi (${r.status}).` };
  } catch (e) { return { ok: false, hata: `Netgsm'e ulaşılamadı: ${(e as Error).message.slice(0, 80)}` }; }
}
