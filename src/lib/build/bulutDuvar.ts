import "server-only";
import { createHash, createHmac } from "crypto";
import type { BulutAyar, DuvarKurali } from "./bulutAyar";

/**
 * Vayra Bulut güvenlik duvarı (yayındaki sitede her istekte, sunucuda uygulanır):
 *  IP engeli (tuzlu özet) → ülke engeli/izni (yalnız barındırma ülke başlığı eklediyse) → yol engeli → yol başına
 *  hız sınırı (IP başına, bellekte kayan pencere) → saldırı modu (sayfa isteklerine hafif JavaScript sınavı).
 * Saldırı modu sınavı: sunucu imzalı bir bilet verir, tarayıcı küçük bir iş kanıtı (SHA-256 ön eki) bulup çereze
 * yazar; çerez 1 saat geçerlidir ve aynı IP özetine bağlıdır. JavaScript çalıştırmayan botlar sayfayı göremez.
 */
export type DuvarKarari = { karar: "gec" } | { karar: "sinav" } | { karar: "engel"; durum: 403 | 429; neden: string; kural?: string; bekle?: number };

// Geliştirmede modül yeniden yüklenince sayaçlar kaybolmasın diye globalThis üzerinde tutulur.
const sayaclar: Map<string, number[]> = ((globalThis as unknown as { __vayraDuvar?: Map<string, number[]> }).__vayraDuvar ??= new Map());
let sonBudama = 0;
function budama() {
  const z = Date.now();
  if (z - sonBudama < 60_000 && sayaclar.size < 50_000) return;
  sonBudama = z;
  for (const [k, l] of sayaclar) if (!l.length || z - l[l.length - 1] > 3600_000) sayaclar.delete(k);
}

const yolUyar = (k: DuvarKurali, yol: string) => { const r = (k.yol || "/").toLocaleLowerCase("tr"); return r === "/" || yol.toLocaleLowerCase("tr").startsWith(r); };
export const kuralAdi = (k: DuvarKurali) =>
  k.tur === "hiz" ? `${k.yol || "/"} için dakikada ${Math.round(((k.sinir ?? 60) * 60) / (k.pencere ?? 60))} istek sınırı`
    : k.tur === "yol-engelle" ? `${k.yol} yolu engelli`
      : k.tur === "ulke-engelle" ? `${(k.ulkeler ?? []).join(", ")} engelli`
        : k.tur === "ulke-izin" ? `Yalnız ${(k.ulkeler ?? []).join(", ")} izinli`
          : "IP engeli";

const SINAV_ON_EK = "000";
const biletImzasi = (a: BulutAyar, projeId: string, bitis: number, ip: string) => createHmac("sha256", a.tuz).update(`${projeId}|${bitis}|${ip}`).digest("base64url").slice(0, 16);
const cerezAdi = (projeId: string) => `vayra-dg-${projeId}`;

function sinavGecerli(projeId: string, a: BulutAyar, ip: string, cerez: string | null): boolean {
  const m = (cerez ?? "").split(/;\s*/).find((x) => x.startsWith(cerezAdi(projeId) + "="));
  if (!m) return false;
  const [bitis, ipC, imza, x] = decodeURIComponent(m.slice(cerezAdi(projeId).length + 1)).split(".");
  if (!bitis || !imza || !x || ipC !== ip || Number(bitis) < Date.now()) return false;
  if (biletImzasi(a, projeId, Number(bitis), ip) !== imza) return false;
  return createHash("sha256").update(`${bitis}.${ipC}.${imza}.${x}`).digest("hex").startsWith(SINAV_ON_EK);
}

/** İsteği kurallara göre değerlendirir. belge: tarayıcı sayfa gezinmesi mi (saldırı modu yalnız bunları sınar). */
export function duvarDenetle(projeId: string, a: BulutAyar, i: { yol: string; ip: string; ulke?: string; belge: boolean; cerez: string | null }): DuvarKarari {
  const kurallar = a.duvar.kurallar.filter((k) => k.acik);
  for (const k of kurallar) if (k.tur === "ip-engelle" && k.ip === i.ip) return { karar: "engel", durum: 403, neden: kuralAdi(k), kural: k.id };
  if (i.ulke) {
    for (const k of kurallar) {
      if (k.tur === "ulke-engelle" && (k.ulkeler ?? []).includes(i.ulke)) return { karar: "engel", durum: 403, neden: kuralAdi(k), kural: k.id };
      if (k.tur === "ulke-izin" && (k.ulkeler ?? []).length && !(k.ulkeler ?? []).includes(i.ulke)) return { karar: "engel", durum: 403, neden: kuralAdi(k), kural: k.id };
    }
  }
  for (const k of kurallar) if (k.tur === "yol-engelle" && k.yol && yolUyar(k, i.yol)) return { karar: "engel", durum: 403, neden: kuralAdi(k), kural: k.id };
  const z = Date.now();
  for (const k of kurallar) {
    if (k.tur !== "hiz" || !yolUyar(k, i.yol)) continue;
    const pencere = Math.max(1, Math.min(3600, k.pencere ?? 60)) * 1000, sinir = Math.max(1, k.sinir ?? 60);
    const anahtar = `${projeId}:${k.id}:${i.ip}`;
    const l = (sayaclar.get(anahtar) ?? []).filter((t) => z - t < pencere);
    if (l.length >= sinir) { sayaclar.set(anahtar, l); return { karar: "engel", durum: 429, neden: kuralAdi(k), kural: k.id, bekle: Math.ceil((pencere - (z - l[0])) / 1000) }; }
    l.push(z); sayaclar.set(anahtar, l);
  }
  budama();
  if (a.duvar.saldiriModu && i.belge && !sinavGecerli(projeId, a, i.ip, i.cerez)) return { karar: "sinav" };
  return { karar: "gec" };
}

const SAYFA_STIL = "margin:0;display:grid;place-items:center;min-height:100vh;background:#0b0b0d;color:#e9eef5;font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif";
const kacir = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Saldırı modu sınav sayfası: imzalı bilet + iş kanıtı, çerez yazılınca sayfa yenilenir. */
export function sinavSayfasi(projeId: string, a: BulutAyar, ip: string, ad: string): Response {
  const bitis = Date.now() + 3600_000;
  const bilet = `${bitis}.${ip}.${biletImzasi(a, projeId, bitis, ip)}`;
  const html = `<!doctype html><html lang="tr"><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><meta name=robots content=noindex><title>${kacir(ad)}</title>
<body style="${SAYFA_STIL}"><main style="text-align:center;padding:24px;max-width:420px"><div style="width:34px;height:34px;margin:0 auto 18px;border-radius:50%;border:3px solid rgba(255,255,255,.12);border-top-color:#55d6fd;animation:d 0.9s linear infinite"></div>
<p style="font-size:19px;font-weight:600;margin:0">Bağlantın denetleniyor</p><p id=a style="color:#9aa3ad;margin:8px 0 0">${kacir(ad)} şu an yoğun trafiğe karşı koruma altında. Bu birkaç saniye sürer.</p>
<noscript><p style="color:#fca5a5">Devam etmek için JavaScript'i aç.</p></noscript></main><style>@keyframes d{to{transform:rotate(360deg)}}</style>
<script>(async function(){var b=${JSON.stringify(bilet)},n=${JSON.stringify(cerezAdi(projeId))};try{if(!window.crypto||!crypto.subtle)throw 0;var e=new TextEncoder();
for(var x=0;x<2000000;x++){var h=new Uint8Array(await crypto.subtle.digest("SHA-256",e.encode(b+"."+x)));if(h[0]===0&&h[1]<16){document.cookie=n+"="+encodeURIComponent(b+"."+x)+"; path=/; max-age=3600; samesite=lax";location.reload();return}}}catch(_){document.getElementById("a").textContent="Tarayıcın bu denetimi tamamlayamadı. Güncel bir tarayıcıyla tekrar dene."}})();</script>`;
  return new Response(html, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "5", "X-Robots-Tag": "noindex" } });
}

/** Bakım modu sayfası (503). */
export function bakimSayfasi(ad: string, mesaj: string): Response {
  const html = `<!doctype html><html lang="tr"><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><meta name=robots content=noindex><title>${kacir(ad)} bakımda</title>
<body style="${SAYFA_STIL}"><main style="text-align:center;padding:24px;max-width:460px"><div style="width:10px;height:10px;margin:0 auto 18px;border-radius:50%;background:#55d6fd"></div>
<p style="font-size:22px;font-weight:600;margin:0">${kacir(ad)} kısa bir bakımda</p><p style="color:#9aa3ad;margin:10px 0 0">${kacir(mesaj || "Kısa süre içinde geri döneceğiz. Anlayışın için teşekkürler.")}</p></main>`;
  return new Response(html, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "600", "X-Robots-Tag": "noindex" } });
}

/**
 * Kural önizlemesi (Appwrite Firewall "son isteklerden kaçı eşleşirdi" benzeri): günlükteki istekler zaman sırasıyla
 * kurala uygulanır; hız kuralında IP başına pencere sayılır. Ülke kuralları yalnız günlükte ülke bilgisi varsa eşleşir.
 */
export function kuralOnizle(k: Omit<DuvarKurali, "id" | "olusturma" | "acik">, l: { z: number; y?: string; ip?: string; u?: string; e?: string }[]) {
  const sirali = [...l].sort((a, b) => a.z - b.z);
  const pencere = Math.max(1, Math.min(3600, k.pencere ?? 60)) * 1000, sinir = Math.max(1, k.sinir ?? 60);
  const sayac = new Map<string, number[]>();
  const kural = { ...k, id: "onizleme", olusturma: 0, acik: true } as DuvarKurali;
  let eslesen = 0; const ipler = new Set<string>(); const yollar = new Map<string, number>();
  for (const g of sirali) {
    const yol = (g.y ?? "/").split("?")[0];
    let tut = false;
    if (k.tur === "ip-engelle") tut = !!g.ip && g.ip === k.ip;
    else if (k.tur === "ulke-engelle") tut = !!g.u && (k.ulkeler ?? []).includes(g.u);
    else if (k.tur === "ulke-izin") tut = !!g.u && !(k.ulkeler ?? []).includes(g.u);
    else if (k.tur === "yol-engelle") tut = !!k.yol && yolUyar(kural, yol);
    else if (k.tur === "hiz" && yolUyar(kural, yol)) {
      const a = g.ip ?? "?", s = (sayac.get(a) ?? []).filter((t) => g.z - t < pencere);
      if (s.length >= sinir) tut = true; else s.push(g.z);
      sayac.set(a, s);
    }
    if (tut) { eslesen++; if (g.ip) ipler.add(g.ip); yollar.set(yol, (yollar.get(yol) ?? 0) + 1); }
  }
  return { toplam: l.length, eslesen, ziyaretci: ipler.size, yollar: [...yollar.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([ad, adet]) => ({ ad, adet })), ulkeBilgisi: l.some((x) => x.u) };
}
