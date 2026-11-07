/**
 * Vayra Build Büyüme: bio bağlantı sayfası (Linktree, Later Linkin.bio ve Buffer Start Page karşılığı).
 * Herkese açık adres: /l/<kod>. Projeye bağlıdır: site, ürünler, blog yazıları, WhatsApp ve randevu tek dokunuşla eklenir;
 * bülten kutusu kişileri izin kaydıyla Kişiler'e yazar. Tıklar /l/<kod>/<öğe> üzerinden sayılır.
 * Bu dosya saf: hem sunucu (sayfayı çizer) hem istemci (önizleme) kullanır.
 */
export type BioOgeTur = "baglanti" | "baslik" | "metin" | "urun" | "yazi" | "abone" | "whatsapp" | "randevu";
export const BIO_OGELERI: { id: BioOgeTur; ad: string; alt: string }[] = [
  { id: "baglanti", ad: "Bağlantı", alt: "Herhangi bir adrese düğme" },
  { id: "urun", ad: "Ürün", alt: "Mağazadan görselli ürün kartı" },
  { id: "yazi", ad: "Blog yazısı", alt: "Yayındaki yazıya bağlantı" },
  { id: "whatsapp", ad: "WhatsApp", alt: "Hazır mesajla sohbet başlat" },
  { id: "randevu", ad: "Randevu", alt: "Sitedeki randevu sayfası" },
  { id: "abone", ad: "Bülten kutusu", alt: "E-posta toplar, izin kaydıyla Kişiler'e yazar" },
  { id: "baslik", ad: "Bölüm başlığı", alt: "Bağlantıları gruplar" },
  { id: "metin", ad: "Metin", alt: "Kısa açıklama paragrafı" },
];
export type BioOge = {
  id: string; tur: BioOgeTur; ad: string; adres?: string; alt?: string; gorsel?: string; acik: boolean;
  /** Öne çıkan (vurgulu) düğme. */ vurgu?: boolean;
  /** Zamanlama: bu tarihler arasında görünür (YYYY-MM-DD). */ bas?: string; bit?: string;
  /** WhatsApp: numara ve hazır mesaj. */ numara?: string; mesaj?: string;
};
export type BioTemaId = "gece" | "kagit" | "okyanus" | "orman" | "gul" | "ozel";
export type BioTema = { id: BioTemaId; zemin: string; zemin2: string; yazi: string; dugme: string; dugmeYazi: string; stil: "dolu" | "cerceve" | "yumusak"; kose: "hap" | "yuvarlak" | "keskin"; yaziTipi: "sistem" | "serif" | "yuvarlak" };
export const BIO_TEMALARI: (BioTema & { ad: string })[] = [
  { id: "gece", ad: "Gece", zemin: "#0b0c0f", zemin2: "#14161b", yazi: "#f2f4f7", dugme: "#1c1f26", dugmeYazi: "#f2f4f7", stil: "yumusak", kose: "hap", yaziTipi: "sistem" },
  { id: "kagit", ad: "Kâğıt", zemin: "#f5f2ec", zemin2: "#ece6db", yazi: "#1d1b18", dugme: "#1d1b18", dugmeYazi: "#f5f2ec", stil: "dolu", kose: "yuvarlak", yaziTipi: "serif" },
  { id: "okyanus", ad: "Okyanus", zemin: "#062a35", zemin2: "#0b4252", yazi: "#e8fbff", dugme: "#55d6fd", dugmeYazi: "#04212a", stil: "dolu", kose: "hap", yaziTipi: "sistem" },
  { id: "orman", ad: "Orman", zemin: "#13261c", zemin2: "#1d3a2a", yazi: "#eef6ef", dugme: "#eef6ef", dugmeYazi: "#13261c", stil: "cerceve", kose: "yuvarlak", yaziTipi: "yuvarlak" },
  { id: "gul", ad: "Gül", zemin: "#fbecee", zemin2: "#f6d9de", yazi: "#3a1d24", dugme: "#ffffff", dugmeYazi: "#3a1d24", stil: "yumusak", kose: "hap", yaziTipi: "yuvarlak" },
];
export type BioSosyal = "instagram" | "tiktok" | "x" | "linkedin" | "facebook" | "youtube" | "whatsapp";
export const BIO_SOSYAL: { id: BioSosyal; ad: string; logo: string; on: string }[] = [
  { id: "instagram", ad: "Instagram", logo: "/marka/renkli/instagram-color.svg", on: "https://instagram.com/" },
  { id: "tiktok", ad: "TikTok", logo: "/marka/renkli/tiktok-color.svg", on: "https://tiktok.com/@" },
  { id: "x", ad: "X", logo: "/marka/renkli/x-beyaz.svg", on: "https://x.com/" },
  { id: "linkedin", ad: "LinkedIn", logo: "/marka/renkli/linkedin-color.svg", on: "https://linkedin.com/in/" },
  { id: "facebook", ad: "Facebook", logo: "/marka/facebook.svg", on: "https://facebook.com/" },
  { id: "youtube", ad: "YouTube", logo: "/marka/youtube-data.svg", on: "https://youtube.com/@" },
  { id: "whatsapp", ad: "WhatsApp", logo: "/marka/renkli/whatsapp-color.svg", on: "https://wa.me/" },
];
export type BioIstatistik = { gor: Record<string, number>; tekil: Record<string, number>; tik: Record<string, Record<string, number>>; kaynak: Record<string, number>; cihaz: Record<string, number>; abone: number };
export type BioSayfa = {
  kod: string; acik: boolean; baslik: string; aciklama: string; avatar?: string; tema: BioTema; ogeler: BioOge[];
  sosyal: Partial<Record<BioSosyal, string>>; seo: { baslik: string; aciklama: string; indeks: boolean };
  rozet: boolean; ist: BioIstatistik; olusturma: number; guncelleme: number;
};
export const bosBioIst = (): BioIstatistik => ({ gor: {}, tekil: {}, tik: {}, kaynak: {}, cihaz: {}, abone: 0 });
export const bioKodGecerli = (k: string) => /^[a-z0-9][a-z0-9_-]{2,31}$/.test(k);
export const bioOgeGorunur = (o: BioOge, bugun: string) => o.acik && (!o.bas || o.bas <= bugun) && (!o.bit || o.bit >= bugun);

const kacir = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const renk = (r: string, v: string) => (/^#[0-9a-f]{6}$/i.test(r) ? r : v);
const guvenli = (u?: string) => !!u && /^(https?:\/\/|mailto:|tel:|\/)[^\s"'<>]*$/i.test(u.trim());
const gorselGuvenli = (u?: string) => !!u && /^(https:\/\/|\/api\/dosya\/gorsel\/|\/marka\/)[^\s"'<>]+$/.test(u);
export const whatsappAdresi = (numara?: string, mesaj?: string) => `https://wa.me/${(numara ?? "").replace(/\D/g, "")}${mesaj ? `?text=${encodeURIComponent(mesaj)}` : ""}`;
/** Öğenin gideceği adres (izleme öncesi). */
export function bioHedef(o: BioOge): string | null {
  if (o.tur === "whatsapp") return (o.numara ?? "").replace(/\D/g, "").length >= 10 ? whatsappAdresi(o.numara, o.mesaj) : null;
  if (o.tur === "baslik" || o.tur === "metin" || o.tur === "abone") return null;
  return guvenli(o.adres) ? o.adres!.trim() : null;
}

export type BioCizim = { tik: (id: string) => string; form: string; onizleme?: boolean; durum?: "abone-tamam" | "abone-hata" | "abone-zaten"; kvkk?: string; site?: string; bugun: string };
/** Sayfanın tam HTML'i (sunucuda herkese açık sayfa, istemcide önizleme). */
export function bioHtml(b: BioSayfa, g: BioCizim): string {
  const t = b.tema;
  const zemin = renk(t.zemin, "#0b0c0f"), zemin2 = renk(t.zemin2, zemin), yazi = renk(t.yazi, "#f2f4f7"), dugme = renk(t.dugme, "#1c1f26"), dugmeYazi = renk(t.dugmeYazi, "#f2f4f7");
  const kose = t.kose === "hap" ? "999px" : t.kose === "yuvarlak" ? "16px" : "6px";
  const font = t.yaziTipi === "serif" ? `Georgia,"Times New Roman",serif` : t.yaziTipi === "yuvarlak" ? `"Nunito","Segoe UI Rounded","SF Pro Rounded",system-ui,sans-serif` : `-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif`;
  const dugmeCss = t.stil === "dolu" ? `background:${dugme};color:${dugmeYazi};border:1px solid ${dugme}` : t.stil === "cerceve" ? `background:transparent;color:${yazi};border:1.5px solid ${yazi}` : `background:${dugme};color:${dugmeYazi};border:1px solid rgba(127,127,127,.18)`;
  const ogeler = b.ogeler.filter((o) => bioOgeGorunur(o, g.bugun)).map((o) => {
    if (o.tur === "baslik") return `<h2 class="b">${kacir(o.ad)}</h2>`;
    if (o.tur === "metin") return `<p class="m">${kacir(o.ad).replace(/\n/g, "<br>")}</p>`;
    if (o.tur === "abone") {
      const d = g.durum;
      const not = d === "abone-tamam" ? `<p class="n ok">Teşekkürler; e-posta adresin listeye eklendi.</p>` : d === "abone-zaten" ? `<p class="n ok">Bu adres zaten listede.</p>` : d === "abone-hata" ? `<p class="n er">Adres eklenemedi; e-postayı ve onay kutusunu kontrol et.</p>` : "";
      return `<form class="f" method="post" action="${kacir(g.form)}"${g.onizleme ? ` onsubmit="return false"` : ""}><p class="ft">${kacir(o.ad || "Bültene katıl")}</p>${o.alt ? `<p class="fa">${kacir(o.alt)}</p>` : ""}<div class="fr"><input type="email" name="eposta" required maxlength="160" placeholder="E-posta adresin" aria-label="E-posta adresin"><button type="submit">Katıl</button></div><label class="fk"><input type="checkbox" name="izin" value="evet" required> Kampanya ve yeniliklerle ilgili ticari elektronik ileti almayı kabul ediyorum.${g.kvkk ? ` <a href="${kacir(g.kvkk)}" target="_blank" rel="noopener">Aydınlatma metni</a>` : ""}</label><input type="text" name="site_adi" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">${not}</form>`;
    }
    const hedef = bioHedef(o);
    if (!hedef) return "";
    const adres = g.onizleme ? "#" : g.tik(o.id);
    const resim = gorselGuvenli(o.gorsel) ? `<img class="r${o.tur === "urun" ? " ru" : ""}" src="${kacir(o.gorsel!)}" alt="" loading="lazy">` : o.tur === "whatsapp" ? `<img class="r rl" src="/marka/renkli/whatsapp-color.svg" alt="">` : "";
    return `<a class="d${o.vurgu ? " v" : ""}${resim ? " dr" : ""}" href="${kacir(adres)}"${g.onizleme ? "" : ` rel="noopener"`}>${resim}<span class="dt"><span class="da">${kacir(o.ad)}</span>${o.alt ? `<span class="ds">${kacir(o.alt)}</span>` : ""}</span></a>`;
  }).join("");
  const sosyal = BIO_SOSYAL.filter((s) => b.sosyal[s.id]?.trim()).map((s) => {
    const v = b.sosyal[s.id]!.trim();
    const u = /^https?:\/\//.test(v) ? v : s.id === "whatsapp" ? whatsappAdresi(v) : s.on + v.replace(/^@/, "");
    return `<a class="s" href="${kacir(g.onizleme ? "#" : u)}" aria-label="${s.ad}" rel="noopener"><img src="${s.logo}" alt="" width="22" height="22"></a>`;
  }).join("");
  const avatar = gorselGuvenli(b.avatar) ? `<img class="av" src="${kacir(b.avatar!)}" alt="${kacir(b.baslik)}">` : `<span class="av ah">${kacir((b.baslik || "V").trim().slice(0, 1).toLocaleUpperCase("tr-TR"))}</span>`;
  const baslik = b.seo.baslik || b.baslik;
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${kacir(baslik)}</title>`
    + `<meta name="description" content="${kacir(b.seo.aciklama || b.aciklama)}">${b.seo.indeks ? "" : `<meta name="robots" content="noindex">`}`
    + `<meta property="og:title" content="${kacir(baslik)}"><meta property="og:description" content="${kacir(b.seo.aciklama || b.aciklama)}">${gorselGuvenli(b.avatar) && /^https:/.test(b.avatar!) ? `<meta property="og:image" content="${kacir(b.avatar!)}">` : ""}<meta name="theme-color" content="${zemin}">`
    + `<style>*{box-sizing:border-box}html,body{margin:0}body{min-height:100vh;background:linear-gradient(180deg,${zemin} 0%,${zemin2} 100%);background-attachment:fixed;color:${yazi};font:15px/1.5 ${font};-webkit-font-smoothing:antialiased}`
    + `main{max-width:520px;margin:0 auto;padding:48px 18px 36px;display:flex;flex-direction:column;align-items:center}`
    + `.av{width:92px;height:92px;border-radius:50%;object-fit:cover;display:flex;align-items:center;justify-content:center;background:${dugme};color:${dugmeYazi};font-size:36px;font-weight:700}`
    + `h1{margin:14px 0 4px;font-size:21px;line-height:1.25;text-align:center;letter-spacing:-.01em}.ac{margin:0 0 14px;opacity:.78;text-align:center;font-size:14.5px;max-width:420px;white-space:pre-line}`
    + `.ss{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:2px 0 20px}.s{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(127,127,127,.14)}.s img{width:21px;height:21px;object-fit:contain}`
    + `.l{width:100%;display:flex;flex-direction:column;gap:12px;margin-top:10px}.d{display:flex;align-items:center;gap:12px;min-height:58px;padding:9px 18px;border-radius:${kose};text-decoration:none;${dugmeCss};transition:transform .15s ease}.d:active{transform:scale(.985)}.d:not(.dr) .dt{text-align:center}`
    + `.dr{padding-left:9px}.r{width:42px;height:42px;border-radius:${t.kose === "keskin" ? "4px" : "12px"};object-fit:cover;flex:none}.ru{width:52px;height:52px}.rl{object-fit:contain;padding:6px;background:rgba(127,127,127,.12)}`
    + `.dt{flex:1;min-width:0;display:flex;flex-direction:column}.da{font-weight:600;font-size:15px;overflow-wrap:anywhere}.ds{font-size:12.5px;opacity:.72;overflow-wrap:anywhere}`
    + `.v{outline:2px solid ${yazi};outline-offset:2px}.b{margin:14px 0 0;font-size:13px;font-weight:600;opacity:.7;text-align:center}.m{margin:0;text-align:center;font-size:14px;opacity:.85}`
    + `.f{padding:16px;border-radius:18px;background:rgba(127,127,127,.12)}.ft{margin:0;font-weight:600}.fa{margin:2px 0 0;font-size:13px;opacity:.75}.fr{display:flex;gap:8px;margin-top:10px}`
    + `.fr input{flex:1;min-width:0;height:44px;border-radius:12px;border:1px solid rgba(127,127,127,.35);background:rgba(255,255,255,.06);color:inherit;padding:0 12px;font:inherit}.fr button{height:44px;padding:0 18px;border:0;border-radius:12px;background:${yazi};color:${zemin};font:600 14.5px ${font};cursor:pointer}`
    + `.fk{display:flex;gap:8px;align-items:flex-start;margin-top:10px;font-size:12px;opacity:.85}.fk a{color:inherit}.hp{position:absolute;left:-9999px;opacity:0}.n{margin:10px 0 0;font-size:13px}.ok{opacity:.9}.er{color:#ff9a9a}`
    + `.rz{margin-top:30px;font-size:12px;opacity:.55;text-decoration:none;color:inherit;display:flex;align-items:center;gap:6px}.rz i{width:7px;height:7px;border-radius:50%;background:#55d6fd;display:inline-block}</style></head>`
    + `<body><main>${avatar}<h1>${kacir(b.baslik)}</h1>${b.aciklama ? `<p class="ac">${kacir(b.aciklama)}</p>` : ""}${sosyal ? `<nav class="ss">${sosyal}</nav>` : ""}<div class="l">${ogeler}</div>`
    + (b.rozet ? `<a class="rz" href="${g.onizleme ? "#" : "/"}"><i></i>Vayra ile yapıldı</a>` : "") + `</main></body></html>`;
}
