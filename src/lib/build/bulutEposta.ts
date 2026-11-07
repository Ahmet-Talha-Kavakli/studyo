import "server-only";
import { epostaHtml, type EpostaMarka } from "./epostaSablon";

/**
 * Vayra Bulut e-posta gönderimi (Resend). Yalnız RESEND_API_KEY tanımlıysa çalışır; yoksa hiçbir şey gönderilmez ve
 * arayüz bunu açıkça söyler (sahte gönderim yok). Gönderen: BUILD_EPOSTA_GONDEREN ya da RESEND_FROM
 * (Resend'de doğrulanmış alan adından olmalı).
 */
export const epostaKurulu = () => !!process.env.RESEND_API_KEY;
/** Gönderen: doğrulanmış adres; site adına giden e-postada görünen ad sitenin adı olur. */
const gonderen = (ad?: string) => {
  const v = process.env.BUILD_EPOSTA_GONDEREN || process.env.RESEND_FROM || "Vayra <onboarding@resend.dev>";
  if (!ad) return v;
  const adres = /<([^>]+)>/.exec(v)?.[1] ?? v;
  return `${ad.replace(/[<>"\r\n]/g, "").slice(0, 60)} <${adres}>`;
};
const kacir = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/**
 * projeId verilirse ve proje kendi alan adını Resend'de doğruladıysa (Bulut > Alan adları > E-posta gönderen) e-posta o
 * adresten gider; yoksa ortak gönderen kullanılır.
 */
export async function epostaGonder(g: { kime: string; konu: string; metin: string; dugme?: { ad: string; adres: string }; site?: string; marka?: Partial<EpostaMarka>; projeId?: string }): Promise<{ ok: true } | { ok: false; hata: string }> {
  const anahtar = process.env.RESEND_API_KEY;
  if (!anahtar) return { ok: false, hata: "E-posta servisi kurulu değil." };
  // Site e-postaları (üyelik) sitenin adı ve markasıyla; Vayra bildirimleri sade görünümle.
  const html = g.site
    ? epostaHtml({ site: g.site, metin: g.metin, dugme: g.dugme, marka: g.marka })
    : `<div style="font:15px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;color:#111;max-width:520px;margin:0 auto;padding:24px"><p>${kacir(g.metin).replace(/\n/g, "<br>")}</p>${g.dugme ? `<p style="margin:24px 0"><a href="${kacir(g.dugme.adres)}" style="display:inline-block;background:#111;color:#fff;padding:11px 20px;border-radius:999px;text-decoration:none;font-weight:600">${kacir(g.dugme.ad)}</a></p><p style="color:#666;font-size:13px">Düğme çalışmazsa bu adresi tarayıcına yapıştır:<br>${kacir(g.dugme.adres)}</p>` : ""}</div>`;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${anahtar}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: (g.projeId ? await import("./bulutEpostaAlan").then((m) => m.projeGondereni(g.projeId!, g.site)).catch(() => null) : null) ?? gonderen(g.site), to: [g.kime], subject: g.konu, html, text: `${g.metin}${g.dugme ? `\n\n${g.dugme.ad}: ${g.dugme.adres}` : ""}` }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return { ok: false, hata: `E-posta gönderilemedi (${r.status}).` };
    return { ok: true };
  } catch (e) { return { ok: false, hata: (e as Error).message }; }
}
