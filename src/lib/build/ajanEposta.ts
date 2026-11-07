import "server-only";
import { createHash } from "crypto";
import type { Ajan } from "./ajanDepo";
import { coz } from "./sifre";

/**
 * Ajan e-posta kanalı. Gelen ileti: e-posta altyapısı (Cloudflare Email Routing, Postmark Inbound, SendGrid Inbound
 * Parse, Mailgun Routes ya da kendi worker'ın) iletiyi ajanın gizli adresine POST eder. Aynı gönderen ve aynı konu
 * (Re: ve Ynt: önekleri atılır) tek konuşmadır. Yanıt Resend ile aynı konuya (In-Reply-To ve References) gider:
 * ajanın kendi Resend anahtarı ya da sunucunun RESEND_API_KEY'i gerekir; yoksa hiçbir şey gönderilmez, yanıt
 * konuşmada ve gelen kutusunda bekler ve arayüz bunu açıkça söyler.
 */
export const konuKoku = (konu: string) => konu.replace(/^\s*((re|ynt|yanıt|fw|fwd|ilt|i̇lt|aw|sv)\s*(\[\d+\])?\s*:\s*)+/i, "").trim().slice(0, 200) || "Konusuz";
export const epostaKimligi = (gonderen: string, konu: string) => `ep:${createHash("sha256").update(`${gonderen.toLowerCase()}\n${konuKoku(konu).toLocaleLowerCase("tr")}`).digest("hex").slice(0, 28)}`;

/** Kendiliğinden giden iletiler (otomatik yanıt, teslim hatası, bülten) ajanı çalıştırmaz. */
export function otomatikIleti(gonderen: string, konu: string, basliklar: Record<string, string>): boolean {
  if (/^(no-?reply|noreply|mailer-daemon|postmaster|bounce|do-?not-?reply)[@+.]/i.test(gonderen)) return true;
  if (/^(otomatik yanıt|auto(matic)? reply|out of office|ofis dışında|undeliverable|delivery status|teslim edilemedi)/i.test(konu.trim())) return true;
  return Object.keys(basliklar).some((k) => /^(auto-submitted|x-autoreply|x-autorespond|list-unsubscribe|precedence)$/i.test(k) && !/^no$/i.test(basliklar[k]));
}

/** Yanıt alıntısını (">" satırları ve "... yazdı:" sonrası) atar; yeni metni bırakır. */
export function yeniMetin(metin: string): string {
  const satirlar = metin.replace(/\r/g, "").split("\n");
  const o: string[] = [];
  for (const s of satirlar) {
    if (/^\s*>/.test(s)) break;
    if (/^(on .+ wrote:|.+ tarihinde .+ yazdı:|-{2,}\s*original message\s*-{2,}|-{2,}\s*özgün ileti\s*-{2,}|from:\s.+@)/i.test(s.trim())) break;
    o.push(s);
  }
  return o.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export const epostaAnahtari = (a: Ajan) => coz(a.yayin.eposta?.anahtarSifreli) || process.env.RESEND_API_KEY || null;
export const epostaGonderen = (a: Ajan) => a.yayin.eposta?.gonderen || process.env.BUILD_EPOSTA_GONDEREN || process.env.RESEND_FROM || null;
/** Gönderim hazır mı: anahtar ve doğrulanmış alan adından gönderen adresi. */
export const epostaHazir = (a: Ajan) => !!epostaAnahtari(a) && !!epostaGonderen(a);

const kacir = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
/** Markdown yanıtı sade HTML'e çevirir (kalın, bağlantı, liste, paragraf). */
function html(md: string): string {
  const satir = (s: string) => kacir(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
  return md.split(/\n{2,}/).map((p) => {
    const l = p.split("\n");
    if (l.every((x) => /^\s*([-*]|\d+\.)\s+/.test(x))) return `<ul>${l.map((x) => `<li>${satir(x.replace(/^\s*([-*]|\d+\.)\s+/, ""))}</li>`).join("")}</ul>`;
    return `<p>${l.map((x) => satir(x.replace(/^#{1,6}\s+/, ""))).join("<br>")}</p>`;
  }).join("");
}

/** Konuşmanın e-posta konusuna yanıt gönderir. Dönüş: hata metni ya da null. */
export async function epostaYanitGonder(a: Ajan, g: { alici: string; konu: string; mesajId?: string; referanslar?: string; metin: string; gonderenAdi?: string }): Promise<string | null> {
  const anahtar = epostaAnahtari(a), kimden = epostaGonderen(a);
  if (!anahtar) return "E-posta gönderim servisi kurulu değil: Kanallar'da Resend anahtarı ekle. Yanıt gelen kutusunda bekliyor.";
  if (!kimden) return "Gönderen adresi yok: Kanallar'da Resend'de doğrulanmış bir alan adından gönderen adresi yaz.";
  const adres = /<([^>]+)>/.exec(kimden)?.[1] ?? kimden;
  const ad = (g.gonderenAdi ?? a.ad).replace(/[<>"\r\n]/g, "").slice(0, 60);
  const imza = a.yayin.eposta?.imza?.trim();
  const govde = imza ? `${g.metin.trim()}\n\n${imza}` : g.metin.trim();
  const konu = /^re:/i.test(g.konu) ? g.konu : `Re: ${g.konu}`;
  const basliklar: Record<string, string> = {};
  if (g.mesajId) { basliklar["In-Reply-To"] = g.mesajId; basliklar.References = [g.referanslar, g.mesajId].filter(Boolean).join(" ").slice(-1800); }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${anahtar}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({ from: `${ad} <${adres}>`, to: [g.alici], subject: konu.slice(0, 250), text: govde, html: `<div style="font:15px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;color:#111;max-width:620px">${html(govde)}</div>`, headers: basliklar }),
    });
    if (r.ok) return null;
    const v = (await r.json().catch(() => ({}))) as { message?: string };
    return `E-posta gönderilemedi (${r.status}): ${v.message ?? "Resend yanıtı"}`;
  } catch (e) { return `Resend'e ulaşılamadı: ${(e as Error).message}`; }
}
