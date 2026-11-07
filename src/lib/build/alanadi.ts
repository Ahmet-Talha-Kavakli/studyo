import "server-only";
import { promises as dnsP } from "dns";
import type { AlanAdi, DnsKayit } from "./tipler";

/**
 * Özel alan adı: kayıt seti ve GERÇEK DNS taraması (node dns). Hedef değerler ortamdan gelir:
 *   BUILD_ALANADI_IP     kök alan adının A kaydı (yayın sunucusunun IP'si)
 *   BUILD_ALANADI_CNAME  www ve alt alan adlarının CNAME hedefi
 * Kayıt başına durum: doğru / yok / yanlış; genel durum: DNS bekleniyor → doğrulanıyor → bağlı ya da sorun.
 */
export const HEDEF_IP = process.env.BUILD_ALANADI_IP || "76.76.21.21";
export const HEDEF_CNAME = process.env.BUILD_ALANADI_CNAME || "baglan.vayra.app";

export const alanAdiGecerli = (a: string) => /^(?=.{3,253}$)(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/.test(a) && !a.endsWith("vayra.app");

/** example.com.tr gibi ikinci seviye uzantıları da tanır. */
const IKILI = ["com.tr", "net.tr", "org.tr", "gen.tr", "web.tr", "biz.tr", "info.tr", "av.tr", "dr.tr", "bel.tr", "edu.tr", "co.uk", "com.au"];
export function kokMu(a: string) {
  const p = a.split(".");
  const son2 = p.slice(-2).join(".");
  return IKILI.includes(son2) ? p.length === 3 : p.length === 2;
}

export function kayitSeti(a: AlanAdi | { ad: string; kok: boolean; dogrulamaKodu: string; wwwYonlendir: boolean }): DnsKayit[] {
  const l: DnsKayit[] = [];
  if (a.kok) {
    l.push({ tur: "A", ad: "@", deger: HEDEF_IP });
    if (a.wwwYonlendir) l.push({ tur: "CNAME", ad: "www", deger: HEDEF_CNAME });
  } else {
    l.push({ tur: "CNAME", ad: a.ad.split(".")[0], deger: HEDEF_CNAME });
  }
  l.push({ tur: "TXT", ad: a.kok ? "_vayra" : `_vayra.${a.ad.split(".")[0]}`, deger: `vayra-dogrulama=${a.dogrulamaKodu}` });
  return l;
}

const SAGLAYICI: [RegExp, string][] = [
  [/domaincontrol\.com/, "GoDaddy"], [/cloudflare\.com/, "Cloudflare"], [/natro/, "Natro"], [/isimtescil/, "İsimtescil"], [/turhost/, "Turhost"],
  [/guzel\.net|guzelhosting/, "Güzel Hosting"], [/registrar-servers\.com/, "Namecheap"], [/awsdns/, "Amazon Route 53"], [/googledomains|google\.com/, "Google"],
  [/dns-parking\.com|hostinger/, "Hostinger"], [/nsone|ns1\.com/, "NS1"], [/wixdns/, "Wix"], [/squarespace/, "Squarespace"], [/porkbun/, "Porkbun"], [/name\.com/, "Name.com"],
];

/**
 * Doğrulama dünyanın gördüğü kayıtlara bakar: HTTPS üzerinden DNS (Cloudflare, yedekte Google). Sunucunun yerel
 * DNS ayarı eski, önbellekli ya da UDP'ye kapalı olabilir; DoH her barındırmada aynı çalışır. İkisi de yanıt
 * vermezse sistemin çözümleyicisine düşülür. Her sorgu en çok 4 sn bekler.
 */
const TUR_NO: Record<string, number> = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, AAAA: 28, CAA: 257 };
const yerel = new dnsP.Resolver({ timeout: 2500, tries: 1 });

async function doh(ad: string, tur: keyof typeof TUR_NO): Promise<string[]> {
  for (const kok of ["https://cloudflare-dns.com/dns-query", "https://dns.google/resolve"]) {
    try {
      const r = await fetch(`${kok}?name=${encodeURIComponent(ad)}&type=${tur}`, { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(4000), cache: "no-store" });
      if (!r.ok) continue;
      const v = (await r.json()) as { Status: number; Answer?: { type: number; data: string }[] };
      if (v.Status !== 0 && v.Status !== 3) continue; // 3 = alan adı yok (geçerli yanıt)
      return (v.Answer ?? []).filter((x) => x.type === TUR_NO[tur]).map((x) => x.data);
    } catch { /* sıradaki sağlayıcı */ }
  }
  throw new Error("doh-yanit-yok");
}
const tirnaksiz = (s: string) => (s.match(/"((?:[^"\\]|\\.)*)"/g) ?? [s]).map((p) => p.replace(/^"|"$/g, "").replace(/\\"/g, '"'));
const nokta = (s: string) => s.replace(/\.$/, "");

/** node dns API'siyle aynı biçimde yanıt veren DoH çözümleyici (yanıt yoksa sistem çözümleyicisi). */
const dns = {
  resolve4: (ad: string) => doh(ad, "A").catch(() => yerel.resolve4(ad)),
  resolve6: (ad: string) => doh(ad, "AAAA").catch(() => yerel.resolve6(ad)),
  resolveNs: (ad: string) => doh(ad, "NS").then((l) => l.map(nokta)).catch(() => yerel.resolveNs(ad)),
  resolveCname: (ad: string) => doh(ad, "CNAME").then((l) => l.map(nokta)).catch(() => yerel.resolveCname(ad)),
  resolveTxt: (ad: string) => doh(ad, "TXT").then((l) => l.map(tirnaksiz)).catch(() => yerel.resolveTxt(ad)),
  resolveMx: (ad: string) => doh(ad, "MX").then((l) => l.map((x) => { const [o, e] = x.split(/\s+/); return { priority: Number(o) || 0, exchange: nokta(e ?? "") }; })).catch(() => yerel.resolveMx(ad)),
  resolveCaa: (ad: string) => doh(ad, "CAA").then((l) => l.map((x) => { const m = /^\d+\s+(\w+)\s+"?([^"]*)"?/.exec(x); return m ? { critical: 0, [m[1]]: m[2] } as { critical: number; issue?: string; issuewild?: string } : { critical: 0 }; })).catch(() => yerel.resolveCaa(ad)),
};

async function guvenli<T>(f: () => Promise<T>): Promise<T | null> { try { return await f(); } catch { return null; } }

export type Tarama = { kayitlar: DnsKayit[]; uyarilar: string[]; korunan: string[]; saglayici: string | null; durum: AlanAdi["durum"] };

/** Alan adının şu anki DNS'ini tarar; kayıtları ve uyarıları döndürür. */
export async function tara(a: Pick<AlanAdi, "ad" | "kok" | "dogrulamaKodu" | "wwwYonlendir">): Promise<Tarama> {
  const kayitlar = kayitSeti(a);
  const uyarilar: string[] = [];
  const kokAd = a.kok ? a.ad : a.ad.split(".").slice(1).join(".");
  const [ns, a4, a6, caa, mx, txtKok] = await Promise.all([
    guvenli(() => dns.resolveNs(kokAd)), guvenli(() => dns.resolve4(a.ad)), guvenli(() => dns.resolve6(a.ad)),
    guvenli(() => dns.resolveCaa(kokAd)), guvenli(() => dns.resolveMx(kokAd)), guvenli(() => dns.resolveTxt(kokAd)),
  ]);
  const saglayici = ns?.length ? (SAGLAYICI.find(([r]) => ns.some((n) => r.test(n.toLowerCase())))?.[1] ?? null) : null;

  const tamAd = (k: DnsKayit) => (k.ad === "@" ? a.ad : k.tur === "CNAME" && !a.kok ? a.ad : `${k.ad}.${kokAd}`);
  // CNAME ve TXT sorguları paralel çalışır.
  const ek = await Promise.all(kayitlar.map((k) => (k.tur === "CNAME" ? guvenli(() => dns.resolveCname(tamAd(k))) : k.tur === "TXT" ? guvenli(() => dns.resolveTxt(tamAd(k))) : Promise.resolve(null))));
  for (const [i, k] of kayitlar.entries()) {
    if (k.tur === "A") {
      const bulunan = a4 ?? [];
      k.bulunan = bulunan;
      k.durum = bulunan.includes(HEDEF_IP) ? "dogru" : bulunan.length ? "yanlis" : "yok";
      const fazla = bulunan.filter((x) => x !== HEDEF_IP);
      if (fazla.length) uyarilar.push(`Kök alan adında başka A kayıtları var (${fazla.join(", ")}). Bunları sil; yoksa ziyaretçilerin bir kısmı eski sunucuya gider.`);
    } else if (k.tur === "CNAME") {
      const c = ek[i] as string[] | null;
      k.bulunan = c ?? [];
      k.durum = c?.some((x) => x.replace(/\.$/, "") === HEDEF_CNAME) ? "dogru" : c?.length ? "yanlis" : "yok";
    } else {
      const t = ek[i] as string[][] | null;
      const duz = (t ?? []).map((p) => p.join(""));
      k.bulunan = duz;
      k.durum = duz.includes(k.deger) ? "dogru" : duz.length ? "yanlis" : "yok";
    }
  }
  if (a6?.length) uyarilar.push("Alan adında IPv6 (AAAA) kaydı var. Sil; aksi hâlde bazı ziyaretçiler siteye ulaşamaz ve SSL sertifikası alınamaz.");
  if (caa?.length) {
    const izinli = caa.some((c) => /letsencrypt\.org|pki\.goog/.test(String(c.issue ?? c.issuewild ?? "")));
    if (!izinli) uyarilar.push("CAA kaydı sertifika sağlayıcımızı engelliyor. letsencrypt.org için izin veren bir CAA kaydı ekle ya da CAA kayıtlarını sil.");
  }
  if (saglayici === "Cloudflare" && kayitlar.some((k) => k.durum === "yanlis")) uyarilar.push("Cloudflare kullanıyorsun: kayıtların yanındaki turuncu bulutu gri yap (Yalnız DNS). Vekil açıkken alan adı doğrulanamaz.");
  const korunan: string[] = [];
  const posta = (mx ?? []).filter((m) => m.exchange).sort((x, y) => x.priority - y.priority);
  if (posta.length) korunan.push(`E-posta (MX): ${posta.map((m) => m.exchange).slice(0, 3).join(", ")}`);
  const spf = (txtKok ?? []).map((p) => p.join("")).find((t) => t.startsWith("v=spf1"));
  if (spf) korunan.push("SPF kaydı");

  const hepsi = kayitlar.every((k) => k.durum === "dogru");
  const hicbiri = kayitlar.every((k) => k.durum === "yok");
  const durum: AlanAdi["durum"] = hepsi ? "bagli" : hicbiri ? "dns-bekleniyor" : kayitlar.some((k) => k.durum === "yanlis") ? "sorun" : "dogrulaniyor";
  return { kayitlar, uyarilar, korunan, saglayici, durum };
}
