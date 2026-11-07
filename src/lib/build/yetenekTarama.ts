/**
 * Yetenek güvenlik taraması: SKILL.md gövdesi ve ek dosyalarda gömülü sır (API anahtarı, özel anahtar, belirteç),
 * tehlikeli komut (rm -rf /, uzaktan indirip çalıştırma, ters kabuk, disk biçimlendirme), istem enjeksiyonu
 * (önceki talimatları yok say, gizli Unicode) ve dış ağ çağrısı arar. Bulunan sır metni maskelenir.
 * "kritik" bulgusu olan yetenek sohbetlerde ve ajanlarda etkinleşmez; düzeltilip yeniden taranınca açılır.
 * Saf fonksiyon; istemci ve sunucu ortak.
 */
export type TaramaSeviye = "kritik" | "uyari" | "bilgi";
export type TaramaBulgusu = { dosya: string; satir: number; tur: "sir" | "komut" | "enjeksiyon" | "ag"; seviye: TaramaSeviye; mesaj: string; ornek: string };
export type TaramaSonucu = { tarih: number; sonuc: "temiz" | TaramaSeviye; bulgular: TaramaBulgusu[] };

type Kural = { re: RegExp; tur: TaramaBulgusu["tur"]; seviye: TaramaSeviye; mesaj: string; maske?: boolean };
const KURALLAR: Kural[] = [
  // Sırlar
  { re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/, tur: "sir", seviye: "kritik", mesaj: "Özel anahtar gömülü", maske: true },
  { re: /\bAKIA[0-9A-Z]{16}\b/, tur: "sir", seviye: "kritik", mesaj: "AWS erişim anahtarı", maske: true },
  { re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{60,}\b/, tur: "sir", seviye: "kritik", mesaj: "GitHub belirteci", maske: true },
  { re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/, tur: "sir", seviye: "kritik", mesaj: "Slack belirteci", maske: true },
  { re: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/, tur: "sir", seviye: "kritik", mesaj: "Stripe canlı anahtarı", maske: true },
  { re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/, tur: "sir", seviye: "kritik", mesaj: "Anthropic API anahtarı", maske: true },
  { re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/, tur: "sir", seviye: "kritik", mesaj: "OpenAI API anahtarı", maske: true },
  { re: /\bAIza[0-9A-Za-z_-]{35}\b/, tur: "sir", seviye: "kritik", mesaj: "Google API anahtarı", maske: true },
  { re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/, tur: "sir", seviye: "uyari", mesaj: "JWT belirteci", maske: true },
  { re: /\b(?:api[_-]?key|secret|password|passwd|sifre|şifre|token|access[_-]?key)\b["']?\s*[:=]\s*["'][^"'\s$<{]{12,}["']/i, tur: "sir", seviye: "kritik", mesaj: "Kodda açık yazılmış sır", maske: true },
  { re: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s:@/]+:[^\s@/]{4,}@/i, tur: "sir", seviye: "kritik", mesaj: "Şifreli veritabanı adresi", maske: true },
  // Tehlikeli komutlar
  { re: /\brm\s+-[a-z]*r[a-z]*f?[a-z]*\s+(?:\/(?:\s|$|\*)|~\/?(?:\s|$)|\$HOME\b|--no-preserve-root)/i, tur: "komut", seviye: "kritik", mesaj: "Kök ya da ev dizinini silen komut" },
  { re: /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sudo\s+)?(?:ba|z|)sh\b/i, tur: "komut", seviye: "kritik", mesaj: "İnternetten indirip doğrudan çalıştırma" },
  { re: /\b(?:bash|sh)\s+-i\s*>&\s*\/dev\/tcp\/|\bnc\b[^\n]*\s-e\s+\/bin\/(?:ba)?sh|\bsocat\b[^\n]*exec:/i, tur: "komut", seviye: "kritik", mesaj: "Ters kabuk (uzaktan erişim)" },
  { re: /\bmkfs(?:\.\w+)?\b|\bdd\s+if=[^\n]*of=\/dev\/(?:sd|nvme|disk)|\bformat\s+[a-z]:/i, tur: "komut", seviye: "kritik", mesaj: "Diski biçimlendiren ya da üzerine yazan komut" },
  { re: /:\(\)\s*\{\s*:\|:&\s*\};:/, tur: "komut", seviye: "kritik", mesaj: "Çatal bombası" },
  { re: /\bbase64\s+(?:-d|--decode)\b[^\n]*\|\s*(?:ba)?sh\b|\beval\s*\(\s*(?:atob|base64_decode|Buffer\.from)/i, tur: "komut", seviye: "kritik", mesaj: "Gizlenmiş kodu çözüp çalıştırma" },
  { re: /\b(?:Invoke-Expression|iex)\b[^\n]*(?:DownloadString|Invoke-WebRequest|iwr)\b|\bDownloadString\s*\(/i, tur: "komut", seviye: "kritik", mesaj: "PowerShell ile indirip çalıştırma" },
  { re: /\bRemove-Item\b[^\n]*-Recurse[^\n]*(?:[A-Z]:\\(?:\s|$|\*)|\$env:USERPROFILE)/i, tur: "komut", seviye: "kritik", mesaj: "Sürücüyü ya da kullanıcı klasörünü silen komut" },
  { re: /~\/\.ssh\/|~\/\.aws\/credentials|\/etc\/shadow|\.env\b[^\n]*\b(?:curl|fetch|requests\.post|nc)\b|\b(?:curl|wget)\b[^\n]*(?:-d|--data|--upload-file)\s*@?[^\n]*(?:\.ssh|\.aws|\.env|id_rsa)/i, tur: "komut", seviye: "kritik", mesaj: "Gizli dosyaları okuyup dışarı gönderebilir" },
  { re: /\bchmod\s+(?:-R\s+)?777\s+\/(?:\s|$)|\bsudo\s+rm\b/i, tur: "komut", seviye: "uyari", mesaj: "Yetki gerektiren tehlikeli komut" },
  { re: /\bsubprocess\.(?:call|run|Popen)\([^\n]*shell\s*=\s*True|\bos\.system\(|\bchild_process\.exec(?:Sync)?\(/, tur: "komut", seviye: "bilgi", mesaj: "Kabuk komutu çalıştırıyor; girdileri denetle" },
  // İstem enjeksiyonu
  { re: /\b(?:ignore|disregard|forget)\b[^\n]{0,30}\b(?:all|any|previous|prior|above|earlier)\b[^\n]{0,20}\b(?:instructions?|rules|prompts?)\b/i, tur: "enjeksiyon", seviye: "kritik", mesaj: "Önceki talimatları yok saymaya yönlendiriyor" },
  { re: /(?:önceki|yukarıdaki|tüm|bütün)\s+(?:talimatları|kuralları|yönergeleri)\s+(?:yok\s+say|unut|görmezden\s+gel|dikkate\s+alma)/i, tur: "enjeksiyon", seviye: "kritik", mesaj: "Önceki talimatları yok saymaya yönlendiriyor" },
  { re: /\b(?:reveal|print|show|leak)\b[^\n]{0,30}\bsystem\s+prompt\b|sistem\s+istemini\s+(?:göster|yaz|açıkla)/i, tur: "enjeksiyon", seviye: "uyari", mesaj: "Sistem istemini sızdırmaya yönlendiriyor" },
  { re: /[​-‍⁠﻿‪-‮⁦-⁩]/, tur: "enjeksiyon", seviye: "uyari", mesaj: "Görünmez ya da yön değiştiren Unicode karakteri" },
  // Ağ
  { re: /\bhttps?:\/\/(?!(?:www\.)?(?:github\.com|raw\.githubusercontent\.com|docs?\.|developer\.|api\.anthropic\.com|localhost|127\.0\.0\.1|example\.com))[^\s)"'<>`]+/i, tur: "ag", seviye: "bilgi", mesaj: "Dış adrese erişiyor" },
];
/** Tek metinde istem enjeksiyonu kalıbı arar (ör. MCP araç açıklamaları). Bulunursa mesaj döner. */
export function enjeksiyonAra(metin: string): string | null {
  for (const k of KURALLAR) if (k.tur === "enjeksiyon" && k.re.test(metin.slice(0, 20_000))) return k.mesaj;
  return /<\s*(?:important|system|instructions?)\s*>/i.test(metin) ? "Açıklamada modele gizli talimat etiketi var" : null;
}
const MASKE = (s: string) => (s.length <= 8 ? "••••" : `${s.slice(0, 4)}••••${s.slice(-2)}`);
const KOD = /\.(sh|bash|zsh|ps1|py|js|mjs|cjs|ts|rb|pl|php|bat|cmd)$/i;

/** Dosyaları tarar. Ağ adresleri yalnız betiklerde ve kod bloklarında bildirilir (belgelerdeki bağlantılar değil). */
export function yetenekTara(dosyalar: { yol: string; icerik: string }[]): TaramaSonucu {
  const bulgular: TaramaBulgusu[] = [];
  for (const d of dosyalar) {
    const betik = KOD.test(d.yol);
    let kodBlogu = false;
    const satirlar = d.icerik.slice(0, 600_000).split("\n");
    for (let i = 0; i < satirlar.length && bulgular.length < 200; i++) {
      const s = satirlar[i];
      if (/^\s*```/.test(s)) kodBlogu = !kodBlogu;
      for (const k of KURALLAR) {
        if (k.tur === "ag" && !betik && !kodBlogu) continue;
        const m = k.re.exec(s);
        if (!m) continue;
        if (bulgular.some((x) => x.dosya === d.yol && x.satir === i + 1 && x.mesaj === k.mesaj)) continue;
        const ornek = k.maske ? s.replace(m[0], MASKE(m[0])).trim().slice(0, 140) : s.trim().slice(0, 140);
        bulgular.push({ dosya: d.yol, satir: i + 1, tur: k.tur, seviye: k.seviye, mesaj: k.mesaj, ornek });
      }
    }
  }
  const sonuc = bulgular.some((b) => b.seviye === "kritik") ? "kritik" : bulgular.some((b) => b.seviye === "uyari") ? "uyari" : bulgular.length ? "bilgi" : "temiz";
  return { tarih: Date.now(), sonuc, bulgular };
}
