/**
 * Site üyelerine giden e-postaların şablonları (doğrulama, giriş bağlantısı, şifre sıfırlama) ve markalı HTML.
 * Sunucu gönderirken, arayüz canlı önizlemede aynı işlevi kullanır.
 */

export type EpostaTur = "dogrula" | "baglanti" | "sifre";
export type EpostaSablon = { konu: string; metin: string; dugme: string };
export type EpostaMarka = { renk: string; logo?: string; altYazi?: string };
export type EpostaAyar = { marka?: Partial<EpostaMarka>; sablonlar?: Partial<Record<EpostaTur, Partial<EpostaSablon>>> };

export const EPOSTA_TURLERI: { id: EpostaTur; ad: string; alt: string; sure: string }[] = [
  { id: "dogrula", ad: "E-posta doğrulama", alt: "Kayıttan hemen sonra gider", sure: "3 gün" },
  { id: "baglanti", ad: "Giriş bağlantısı", alt: "Şifresiz giriş istenince gider", sure: "15 dakika" },
  { id: "sifre", ad: "Şifre sıfırlama", alt: "Şifremi unuttum deyince ya da sen gönderince gider", sure: "24 saat" },
];

export const VARSAYILAN_SABLON: Record<EpostaTur, EpostaSablon> = {
  dogrula: { konu: "{site}: e-postanı doğrula", metin: "Merhaba {ad},\n\n{site} hesabını doğrulamak için aşağıdaki düğmeye bas. Bu bağlantı {sure} geçerli.", dugme: "E-postamı doğrula" },
  baglanti: { konu: "{site}: giriş bağlantın", metin: "{site} sitesine giriş yapmak için düğmeye bas. Bu bağlantı {sure} geçerli ve tek kullanımlık.\n\nBu isteği sen yapmadıysan bu e-postayı yok say.", dugme: "Giriş yap" },
  sifre: { konu: "{site}: şifreni yenile", metin: "Merhaba {ad},\n\n{site} hesabın için yeni şifre belirlemek üzere düğmeye bas. Bu bağlantı {sure} geçerli ve tek kullanımlık.\n\nBu isteği sen yapmadıysan şifren değişmez; bu e-postayı yok sayabilirsin.", dugme: "Yeni şifre belirle" },
};
export const VARSAYILAN_MARKA: EpostaMarka = { renk: "#111111" };
export const DEGISKENLER = ["{site}", "{ad}", "{eposta}", "{sure}"] as const;

export const SINIR = { konu: 150, metin: 2000, dugme: 40, altYazi: 200, logo: 500 };

/** Kayıtlı ayardan tam şablon ve marka (eksik alanlar varsayılandan). */
export function sablonTamamla(a: EpostaAyar | undefined, tur: EpostaTur): { sablon: EpostaSablon; marka: EpostaMarka } {
  const s = a?.sablonlar?.[tur] ?? {};
  const v = VARSAYILAN_SABLON[tur];
  return {
    sablon: { konu: s.konu?.trim() || v.konu, metin: s.metin?.trim() || v.metin, dugme: s.dugme?.trim() || v.dugme },
    marka: { ...VARSAYILAN_MARKA, ...(a?.marka ?? {}), renk: renkGecerli(a?.marka?.renk) ? a!.marka!.renk! : VARSAYILAN_MARKA.renk },
  };
}

/** Ayar girdisini temizler (sunucu kaydederken). */
export function epostaAyarTemizle(g: unknown, eski?: EpostaAyar): EpostaAyar {
  const x = (g ?? {}) as EpostaAyar;
  const sonuc: EpostaAyar = { marka: { ...(eski?.marka ?? {}) }, sablonlar: { ...(eski?.sablonlar ?? {}) } };
  if (x.marka) {
    if (x.marka.renk !== undefined) sonuc.marka!.renk = renkGecerli(x.marka.renk) ? x.marka.renk : VARSAYILAN_MARKA.renk;
    if (x.marka.logo !== undefined) sonuc.marka!.logo = /^https:\/\/[^\s"'<>]{4,}$/.test(String(x.marka.logo)) ? String(x.marka.logo).slice(0, SINIR.logo) : undefined;
    if (x.marka.altYazi !== undefined) sonuc.marka!.altYazi = String(x.marka.altYazi).slice(0, SINIR.altYazi) || undefined;
  }
  for (const t of EPOSTA_TURLERI.map((e) => e.id)) {
    const y = x.sablonlar?.[t];
    if (y === undefined) continue;
    if (y === null) { delete sonuc.sablonlar![t]; continue; }
    sonuc.sablonlar![t] = {
      konu: String(y.konu ?? "").slice(0, SINIR.konu),
      metin: String(y.metin ?? "").slice(0, SINIR.metin),
      dugme: String(y.dugme ?? "").slice(0, SINIR.dugme),
    };
  }
  return sonuc;
}

export const renkGecerli = (r: unknown): r is string => typeof r === "string" && /^#[0-9a-f]{6}$/i.test(r);
export const sablonDoldur = (s: string, d: Partial<Record<"site" | "ad" | "eposta" | "sure", string>>) =>
  s.replace(/\{(site|ad|eposta|sure)\}/g, (_, k: keyof typeof d) => d[k] ?? "").replace(/Merhaba ,/g, "Merhaba,");

const kacir = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
/** Düğme zemini açık renkse siyah, koyuysa beyaz yazı. */
function yaziRengi(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#111111" : "#ffffff";
}

/** E-posta istemcilerinde güvenli, tablo tabanlı markalı HTML. */
export function epostaHtml(g: { site: string; metin: string; dugme?: { ad: string; adres: string }; marka?: Partial<EpostaMarka> }): string {
  const renk = renkGecerli(g.marka?.renk) ? g.marka!.renk! : VARSAYILAN_MARKA.renk;
  const logo = g.marka?.logo && /^https:\/\//.test(g.marka.logo) ? `<img src="${kacir(g.marka.logo)}" alt="${kacir(g.site)}" height="36" style="display:block;height:36px;width:auto;border:0">` : `<span style="font:700 17px/1.3 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">${kacir(g.site)}</span>`;
  const paragraflar = g.metin.split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${kacir(p).replace(/\n/g, "<br>")}</p>`).join("");
  const dugme = g.dugme ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px"><tr><td style="border-radius:10px;background:${renk}"><a href="${kacir(g.dugme.adres)}" style="display:inline-block;padding:12px 22px;font-weight:600;font-size:15px;color:${yaziRengi(renk)};text-decoration:none;border-radius:10px">${kacir(g.dugme.ad)}</a></td></tr></table><p style="margin:14px 0 0;font-size:12.5px;color:#6b7280">Düğme çalışmazsa bu adresi tarayıcına yapıştır:<br><span style="word-break:break-all;color:#374151">${kacir(g.dugme.adres)}</span></p>` : "";
  const alt = g.marka?.altYazi ? `<p style="margin:0 0 6px">${kacir(g.marka.altYazi)}</p>` : "";
  return `<!doctype html><html lang="tr"><body style="margin:0;padding:0;background:#f4f5f7"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:28px 12px"><tr><td align="center">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb">`
    + `<tr><td style="padding:22px 28px 8px;border-top:4px solid ${renk};border-radius:16px 16px 0 0">${logo}</td></tr>`
    + `<tr><td style="padding:12px 28px 26px;font:15px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827">${paragraflar}${dugme}</td></tr></table>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px"><tr><td style="padding:14px 28px;font:12px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#9ca3af;text-align:center">${alt}<p style="margin:0">${kacir(g.site)} sana bu e-postayı hesabınla ilgili bir işlem için gönderdi.</p></td></tr></table>`
    + `</td></tr></table></body></html>`;
}
