/**
 * Yayın öncesi denetim (istemci + sunucu, saf işlev): kırık bağlantılar, eksik başlık/görünüm etiketi, alt metni
 * olmayan görseller, güvensiz (http) kaynaklar, gönderilemeyecek formlar, koda gömülmüş gizli anahtarlar.
 * Kritik bulgular yayını durdurur (kullanıcı yine de yayınlayabilir); hepsi ajana tek tuşla ücretsiz düzelttirilebilir.
 */
export type Bulgu = { seviye: "kritik" | "uyari" | "bilgi"; baslik: string; ayrinti: string; dosya?: string };

const GIZLI: [RegExp, string][] = [
  [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, "Özel anahtar (private key)"],
  [/\bsk-(live|proj|ant)?[-_]?[A-Za-z0-9]{20,}/, "Gizli API anahtarı (sk-…)"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS erişim anahtarı"],
  [/\bghp_[A-Za-z0-9]{30,}\b/, "GitHub erişim belirteci"],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, "Slack belirteci"],
  [/\bsk_live_[A-Za-z0-9]{16,}/, "Stripe canlı gizli anahtarı"],
];

export function denetle(dosyalar: Record<string, string>): Bulgu[] {
  const b: Bulgu[] = [];
  const yollar = new Set(Object.keys(dosyalar));
  if (!yollar.has("index.html")) b.push({ seviye: "kritik", baslik: "Giriş sayfası yok", ayrinti: "index.html olmadan site açılmaz." });

  for (const [yol, icerik] of Object.entries(dosyalar)) {
    for (const [re, ad] of GIZLI) if (re.test(icerik)) b.push({ seviye: "kritik", baslik: `${ad} kodda açıkta`, ayrinti: "Yayındaki sitenin kodunu herkes görebilir. Bu anahtarı koddan çıkar ve sağlayıcısında yenile.", dosya: yol });
    if (/\.(m?js|html)$/.test(yol) && /http:\/\/(?!localhost)[^"'\s)]+\.(js|css)/i.test(icerik)) b.push({ seviye: "uyari", baslik: "Güvensiz (http) kaynak", ayrinti: "https olmayan betik ya da stil, tarayıcılarda engellenir.", dosya: yol });
    if (!yol.endsWith(".html")) continue;
    const ad = yol;
    if (!/<title>[^<]{2,}<\/title>/i.test(icerik)) b.push({ seviye: "uyari", baslik: "Sayfa başlığı yok", ayrinti: "Sekmede ve arama sonuçlarında görünen <title> eksik.", dosya: ad });
    if (!/<meta[^>]+name=["']viewport["']/i.test(icerik)) b.push({ seviye: "uyari", baslik: "Telefon görünümü ayarı yok", ayrinti: "viewport etiketi olmadan sayfa telefonda küçük görünür.", dosya: ad });
    if (!/<meta[^>]+name=["']description["']/i.test(icerik)) b.push({ seviye: "bilgi", baslik: "Sayfa açıklaması yok", ayrinti: "Arama sonuçlarında görünen kısa açıklama eksik (Ayarlar'daki açıklama kullanılır).", dosya: ad });
    const altsiz = (icerik.match(/<img\b(?![^>]*\balt=)[^>]*>/gi) ?? []).length;
    if (altsiz) b.push({ seviye: "bilgi", baslik: `${altsiz} görselde alt metin yok`, ayrinti: "Ekran okuyucular ve arama motorları görseli anlayamaz.", dosya: ad });
    // Kırık iç bağlantılar
    const kirik = new Set<string>();
    for (const m of icerik.matchAll(/\b(?:href|src)=["']([^"'#?]+)(?:[?#][^"']*)?["']/gi)) {
      const u = m[1].trim();
      if (!u || /^(https?:|mailto:|tel:|data:|javascript:|\/\/|\/)/i.test(u) || u.includes("${")) continue;
      const klasor = ad.includes("/") ? ad.slice(0, ad.lastIndexOf("/") + 1) : "";
      const hedef = (klasor + u).split("/").reduce<string[]>((a, p) => (p === ".." ? a.slice(0, -1) : p === "." || p === "" ? a : [...a, p]), []).join("/");
      if (!yollar.has(hedef) && !yollar.has(`${hedef}.html`) && !yollar.has(`${hedef}/index.html`)) kirik.add(u);
    }
    if (kirik.size) b.push({ seviye: "uyari", baslik: `${kirik.size} kırık bağlantı`, ayrinti: `Projede olmayan dosyalar: ${[...kirik].slice(0, 4).join(", ")}${kirik.size > 4 ? " …" : ""}`, dosya: ad });
    // Gönderilemeyecek formlar
    const formlar = icerik.match(/<form\b[^>]*>/gi) ?? [];
    const sahipsiz = formlar.filter((f) => !/data-vayra-form/i.test(f) && !/action=/i.test(f)).length;
    if (sahipsiz) b.push({ seviye: "uyari", baslik: `${sahipsiz} form bir yere gönderilmiyor`, ayrinti: "data-vayra-form eklenince gönderimler gelen kutusuna düşer.", dosya: ad });
  }
  const sira = { kritik: 0, uyari: 1, bilgi: 2 };
  return b.sort((x, y) => sira[x.seviye] - sira[y.seviye]);
}

/** Bulguları ajanın düzeltmesi için tek metne çevirir. */
export const bulgulariMetne = (l: Bulgu[]) => l.map((x) => `- ${x.baslik}${x.dosya ? ` (${x.dosya})` : ""}: ${x.ayrinti}`).join("\n");
