import "server-only";
import { epostaGonder, epostaKurulu } from "@/lib/build/bulutEposta";
import { gelistirme, istekKokeni } from "./guvenlik";
import type { EpostaSonucu } from "./tipler";

/**
 * Hesap e-postaları (doğrulama, sıfırlama, e-posta değişikliği, güvenlik bildirimi). Gönderim Resend ile
 * (RESEND_API_KEY). Servis yoksa: üretimde dürüst hata; geliştirmede bağlantı yalnız yanıtta döner.
 *
 * Bağlantıların kökü: VAYRA_KOKEN. Üretimde tanımlı değilse bağlantılı e-posta gönderilmez; Host başlığından
 * kurulan bağlantı, başlığı değiştiren biri tarafından kendi sitesine yönlendirilebilirdi.
 */
export function baglantiKoku(req: Request): string | null {
  const env = process.env.VAYRA_KOKEN?.replace(/\/+$/, "");
  if (env) return env;
  return gelistirme() ? istekKokeni(req) : null;
}

const METIN = {
  dogrula: { konu: "Vayra e-posta adresini doğrula", metin: "Vayra hesabını oluşturduğun için teşekkürler. E-posta adresini doğrulamak için aşağıdaki düğmeye bas. Bağlantı 24 saat geçerli.", dugme: "E-postamı doğrula", yol: "/dogrula" },
  eposta: { konu: "Yeni e-posta adresini onayla", metin: "Vayra hesabının e-posta adresini bu adresle değiştirmek istedin. Onaylamak için aşağıdaki düğmeye bas. Sen istemediysen bu e-postayı yok say; hesabın değişmez. Bağlantı 24 saat geçerli.", dugme: "Yeni adresi onayla", yol: "/dogrula" },
  sifirla: { konu: "Vayra şifreni sıfırla", metin: "Vayra hesabın için şifre sıfırlama istendi. Yeni şifre belirlemek için aşağıdaki düğmeye bas. Bağlantı 1 saat geçerli ve bir kez kullanılabilir. Sen istemediysen bu e-postayı yok say; şifren değişmez.", dugme: "Yeni şifre belirle", yol: "/sifirla" },
} as const;

export async function baglantiGonder(req: Request, tur: keyof typeof METIN, kime: string, belirtec: string): Promise<EpostaSonucu> {
  const kok = baglantiKoku(req);
  if (!kok) return { gonderildi: false, hata: "Bu sunucuda VAYRA_KOKEN tanımlı olmadığı için bağlantılı e-posta gönderilemiyor." };
  const m = METIN[tur];
  const adres = `${kok}${m.yol}?b=${encodeURIComponent(belirtec)}${tur === "eposta" ? "&t=eposta" : ""}`;
  if (!epostaKurulu()) {
    if (gelistirme()) return { gonderildi: false, gelistirmeBaglantisi: adres };
    return { gonderildi: false, hata: "E-posta servisi bu sunucuda kurulu değil." };
  }
  const r = await epostaGonder({ kime, konu: m.konu, metin: m.metin, dugme: { ad: m.dugme, adres } });
  if (r.ok) return { gonderildi: true };
  if (gelistirme()) return { gonderildi: false, gelistirmeBaglantisi: adres, hata: r.hata };
  return { gonderildi: false, hata: "E-posta gönderilemedi. Biraz sonra yeniden dene." };
}

/** Güvenlik bildirimi (yeni giriş, şifre ya da e-posta değişti). Servis yoksa sessizce atlanır; akışı bekletmez. */
export function bildirimGonder(kime: string, konu: string, metin: string) {
  if (!epostaKurulu()) return;
  void epostaGonder({ kime, konu, metin }).catch(() => {});
}
