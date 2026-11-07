import "server-only";
import dns from "node:dns";
import net from "node:net";
import { Agent, fetch as ufetch } from "undici";

/**
 * Kullanıcının verdiği adreslere sunucudan yapılan istekler için SSRF koruması.
 *
 * Yalnız adın kendisine bakmak yetmez: "localtest.me" gibi adlar 127.0.0.1'e çözülür, yönlendirme yerel adrese
 * gidebilir, DNS iki çözüm arasında değişebilir (rebinding). Bu yüzden denetim üç katmanda yapılır:
 * 1. Adres biçimi: yalnız http ve https, IP yazılmış adreslerde özel ağ reddi.
 * 2. Bağlantı anı: soket açılırken çözülen her IP denetlenir (undici Agent lookup kancası); çözüm ile bağlantı
 *    arasında değişen DNS de yakalanır.
 * 3. Yönlendirme: el ile izlenir, her adımda 1. ve 2. tekrar uygulanır (en çok 5 adım).
 */

export class AgHatasi extends Error {
  constructor(mesaj: string) { super(mesaj); this.name = "AgHatasi"; }
}

const v4Sayi = (ip: string) => ip.split(".").reduce((a, p) => (a << 8) + Number(p), 0) >>> 0;
const v4Aralik = (ip: string, ag: string, bit: number) => {
  const maske = bit === 0 ? 0 : (~0 << (32 - bit)) >>> 0;
  return (v4Sayi(ip) & maske) === (v4Sayi(ag) & maske);
};
const V4_YASAK: [string, number][] = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
];

/** IPv6 adresini 8 adet 16 bitlik parçaya açar (IPv4 gömülü yazımı da çözer). */
function v6Parcalar(ip: string): number[] | null {
  let s = ip.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  const v4 = /(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (v4) {
    const n = v4Sayi(v4[1]);
    s = s.slice(0, -v4[1].length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const [bas, son] = s.split("::");
  const a = bas ? bas.split(":") : [];
  const b = son !== undefined ? (son ? son.split(":") : []) : [];
  if (son === undefined && a.length !== 8) return null;
  const parca = [...a, ...Array(8 - a.length - b.length).fill("0"), ...b].map((x) => parseInt(x || "0", 16));
  return parca.length === 8 && parca.every((x) => Number.isFinite(x) && x >= 0 && x <= 0xffff) ? parca : null;
}

/** Özel, yerel, ayrılmış ya da çok noktaya yayın adresi mi? Bilinmeyen biçim de yasak sayılır. */
export function ozelIp(ip: string): boolean {
  const tur = net.isIP(ip.replace(/^\[|\]$/g, "").split("%")[0]);
  if (tur === 4) return V4_YASAK.some(([ag, bit]) => v4Aralik(ip, ag, bit));
  if (tur !== 6) return true;
  const p = v6Parcalar(ip);
  if (!p) return true;
  const gomulu = (i: number) => `${p[i] >> 8}.${p[i] & 255}.${p[i + 1] >> 8}.${p[i + 1] & 255}`;
  if (p.every((x) => x === 0)) return true; // ::
  if (p.slice(0, 7).every((x) => x === 0) && p[7] === 1) return true; // ::1
  if (p.slice(0, 5).every((x) => x === 0) && (p[5] === 0xffff || p[5] === 0)) return ozelIp(gomulu(6)); // ::ffff:a.b.c.d ve ::a.b.c.d
  if (p[0] === 0x64 && p[1] === 0xff9b) return ozelIp(gomulu(6)); // NAT64
  if (p[0] === 0x2002) return ozelIp(gomulu(1)); // 6to4
  if ((p[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 yerel
  if ((p[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 bağlantı yerel
  if ((p[0] & 0xff00) === 0xff00) return true; // çok noktaya yayın
  if (p[0] === 0x2001 && p[1] === 0x0db8) return true; // belgeleme
  return false;
}

/** Yerel geliştirme: sahte sunucularla deneme için yalnız geliştirmede ve çağıran izin verdiyse localhost. */
const gelistirme = process.env.NODE_ENV !== "production";
const YEREL_AD = new Set(["localhost", "127.0.0.1", "::1"]);

const ADI_YASAK = [/^localhost$/i, /\.localhost$/i, /\.local$/i, /\.internal$/i, /\.lan$/i, /\.home\.arpa$/i];

/** Adres biçimi denetimi; geçerliyse URL döner. */
export function adresBicimi(girdi: string | URL, yalnizHttps = false, yerel = false): URL | null {
  let u: URL;
  try { u = typeof girdi === "string" ? new URL(girdi.trim()) : new URL(girdi.toString()); } catch { return null; }
  if (u.protocol !== "https:" && (u.protocol !== "http:" || yalnizHttps)) return null;
  if (u.username || u.password) return null;
  const ad = u.hostname.replace(/^\[|\]$/g, "");
  const serbest = yerel && gelistirme && YEREL_AD.has(ad);
  if (net.isIP(ad)) return ozelIp(ad) && !serbest ? null : u;
  if (ADI_YASAK.some((r) => r.test(ad))) return serbest ? u : null;
  if (!ad.includes(".")) return null;
  return u;
}

type Bulma = (err: NodeJS.ErrnoException | null, adres: string | dns.LookupAddress[], aile?: number) => void;

/** Soket açılırken çağrılır: çözülen bütün adresler denetlenir, biri bile özel ağdaysa bağlantı kurulmaz. */
function bulucu(yerel: boolean) {
  return (ad: string, secenek: dns.LookupOptions, cb: Bulma) => guvenliBul(ad, secenek, cb, yerel);
}
function guvenliBul(ad: string, secenek: dns.LookupOptions, cb: Bulma, yerel: boolean) {
  dns.lookup(ad, { ...secenek, all: true }, (err, adresler) => {
    if (err) return cb(err, "");
    const liste = adresler as dns.LookupAddress[];
    const izinli = (a: string) => !ozelIp(a) || (yerel && gelistirme && YEREL_AD.has(ad) && (a === "127.0.0.1" || a === "::1"));
    if (!liste.length || !liste.every((x) => izinli(x.address))) {
      const e = new AgHatasi("Bu adres özel ya da yerel bir ağa çıkıyor; güvenlik nedeniyle bağlanılmadı.") as unknown as NodeJS.ErrnoException;
      e.code = "EVAYRA_OZEL_AG";
      return cb(e, "");
    }
    if (secenek.all) cb(null, liste);
    else cb(null, liste[0].address, liste[0].family);
  });
}

const ajan = new Agent({ connect: { lookup: bulucu(false) as unknown as typeof dns.lookup }, connections: 64, keepAliveTimeout: 10_000 });
let yerelAjan: Agent | null = null;

/**
 * yalnizHttps: http adreslerini reddet. yerel: yalnız geliştirmede localhost'a izin ver (sahte sunucuyla deneme);
 * üretimde etkisizdir.
 */
export type GuvenliSecenek = { yalnizHttps?: boolean; enCokYonlendirme?: number; yerel?: boolean };

/**
 * Kullanıcı adresine güvenli istek. fetch ile aynı biçimde kullanılır; yönlendirmeler el ile izlenir.
 * Adres ya da bağlantı reddedilirse AgHatasi fırlatır.
 */
export async function guvenliFetch(girdi: string | URL, init: RequestInit = {}, s: GuvenliSecenek = {}): Promise<Response> {
  const yerel = !!s.yerel && gelistirme;
  const dagitici = yerel ? (yerelAjan ??= new Agent({ connect: { lookup: bulucu(true) as unknown as typeof dns.lookup } })) : ajan;
  let u = adresBicimi(girdi, s.yalnizHttps, yerel);
  if (!u) throw new AgHatasi("Geçersiz ya da izin verilmeyen adres.");
  let yontem = (init.method ?? "GET").toUpperCase();
  let govde = init.body;
  const takip = init.redirect !== "manual" && init.redirect !== "error";
  for (let adim = 0; ; adim++) {
    let r: Response;
    try {
      r = (await ufetch(u, { ...(init as object), method: yontem, body: govde as never, redirect: "manual", dispatcher: dagitici } as never)) as unknown as Response;
    } catch (e) {
      const neden = (e as { cause?: { code?: string; message?: string } }).cause;
      if (neden?.code === "EVAYRA_OZEL_AG") throw new AgHatasi(neden.message ?? "Özel ağ adresi reddedildi.");
      throw e;
    }
    if (!takip || r.status < 300 || r.status > 399 || r.status === 304) return r;
    const konum = r.headers.get("location");
    if (!konum) return r;
    if (init.redirect === "error") throw new AgHatasi("Adres yönlendirme yaptı.");
    if (adim >= (s.enCokYonlendirme ?? 5)) throw new AgHatasi("Çok fazla yönlendirme.");
    await r.body?.cancel().catch(() => {});
    const sonraki = adresBicimi(new URL(konum, u), s.yalnizHttps, yerel);
    if (!sonraki) throw new AgHatasi("Yönlendirme izin verilmeyen bir adrese gidiyor.");
    if (r.status === 303 || ((r.status === 301 || r.status === 302) && yontem === "POST")) { yontem = "GET"; govde = undefined; }
    if (sonraki.origin !== u.origin) {
      // Başka bir sunucuya geçerken kimlik bilgileri taşınmaz (tarayıcıların davranışı).
      const h = new Headers(init.headers);
      for (const ad of [...h.keys()]) if (/^(authorization|cookie|proxy-authorization)$|key|token|secret|signature/i.test(ad)) h.delete(ad);
      init = { ...init, headers: h };
    }
    u = sonraki;
  }
}
