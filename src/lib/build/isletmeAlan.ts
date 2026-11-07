import "server-only";
import { Resolver } from "dns/promises";
import { guvenliFetch } from "@/lib/guvenliAg";
import { alanAdiGecerli, slug, type KurumsalEposta } from "./isletmeTipler";

/**
 * Kurumsal e-posta ve alan adı yardımcıları. Vayra'da alan adı satıcısı (registrar) ve posta sunucusu anahtarı yok:
 * satın alma ve kutu açma sağlayıcıda yapılır; burada gereken DNS kayıtları (MX, SPF, DKIM, DMARC) hazırlanır, alan
 * adının DNS'i canlı sorgulanır ve alan adının boşta olup olmadığı RDAP ile (anahtarsız, resmî kayıt sorgusu) bakılır.
 */
export type EpostaKaydi = { tur: "MX" | "TXT" | "CNAME"; ad: string; deger: string; oncelik?: number; amac: string; durum?: "dogru" | "yok" | "yanlis" | "kullanici"; bulunan?: string[] };

export function gerekenKayitlar(e: KurumsalEposta): { kayitlar: EpostaKaydi[]; notlar: string[] } {
  const a = e.alan;
  const k: EpostaKaydi[] = [], n: string[] = [];
  const dmarc = (): EpostaKaydi => ({ tur: "TXT", ad: "_dmarc", deger: `v=DMARC1; p=none; adkim=s; aspf=s${e.dmarcEposta ? `; rua=mailto:${e.dmarcEposta}` : ""}`, amac: "DMARC: sahte gönderimlere karşı politika ve rapor" });
  const dkim = (ad: string, tur: "TXT" | "CNAME" = "TXT"): EpostaKaydi => ({ tur, ad: e.dkimAd || ad, deger: e.dkimDeger || "Sağlayıcının yönetim panelinden kopyala", amac: "DKIM: gönderilen postanın imzası", ...(e.dkimDeger ? {} : { durum: "kullanici" as const }) });
  switch (e.saglayici) {
    case "google":
      k.push({ tur: "MX", ad: "@", deger: "smtp.google.com", oncelik: 1, amac: "Gelen posta Google sunucusuna" });
      k.push({ tur: "TXT", ad: "@", deger: "v=spf1 include:_spf.google.com ~all", amac: "SPF: Google'ın sizin adınıza gönderebilmesi" });
      k.push(dkim("google._domainkey"));
      n.push("DKIM değeri Google Yönetici Konsolu'nda Gmail ayarlarındaki E-posta kimlik doğrulaması bölümünde oluşturulur.", "Alan adı doğrulaması için Google'ın verdiği google-site-verification TXT kaydını da ekle.");
      break;
    case "microsoft":
      k.push({ tur: "MX", ad: "@", deger: `${a.replace(/\./g, "-")}.mail.protection.outlook.com`, oncelik: 0, amac: "Gelen posta Microsoft 365'e" });
      k.push({ tur: "TXT", ad: "@", deger: "v=spf1 include:spf.protection.outlook.com -all", amac: "SPF: Microsoft'un sizin adınıza gönderebilmesi" });
      k.push({ tur: "CNAME", ad: "autodiscover", deger: "autodiscover.outlook.com", amac: "Outlook'un hesabı kendiliğinden bulması" });
      k.push(dkim("selector1._domainkey", "CNAME"));
      n.push("DKIM için Microsoft Defender portalı selector1 ve selector2 adlı iki CNAME kaydı verir; ikisini de ekle.", "MX adresi Microsoft 365 yönetim merkezinin verdiği değerle aynı olmalı; farklıysa oradakini kullan.");
      break;
    case "zoho": {
      const b = e.zohoBolge === "com" ? "zoho.com" : "zoho.eu";
      k.push({ tur: "MX", ad: "@", deger: `mx.${b}`, oncelik: 10, amac: "Gelen posta Zoho'ya" }, { tur: "MX", ad: "@", deger: `mx2.${b}`, oncelik: 20, amac: "Yedek posta sunucusu" }, { tur: "MX", ad: "@", deger: `mx3.${b}`, oncelik: 50, amac: "Yedek posta sunucusu" });
      k.push({ tur: "TXT", ad: "@", deger: `v=spf1 include:${b} ~all`, amac: "SPF: Zoho'nun sizin adınıza gönderebilmesi" });
      k.push(dkim("zmail._domainkey"));
      n.push("Zoho hesabın hangi veri merkezindeyse (zoho.eu ya da zoho.com) o bölgeyi seç.", "Zoho'nun verdiği zoho-verification TXT kaydını da ekle.");
      break;
    }
    case "yandex":
      k.push({ tur: "MX", ad: "@", deger: "mx.yandex.net", oncelik: 10, amac: "Gelen posta Yandex'e" });
      k.push({ tur: "TXT", ad: "@", deger: "v=spf1 include:_spf.yandex.net ~all", amac: "SPF: Yandex'in sizin adınıza gönderebilmesi" });
      k.push(dkim("mail._domainkey"));
      n.push("DKIM değeri Yandex 360 yönetim panelinde alan adının ayarlarında görünür.");
      break;
    case "diger": {
      for (const p of e.mxOzel.split(/[,\n]+/).map((x) => x.trim()).filter(Boolean).slice(0, 5)) {
        const m = /^(\d{1,5})\s+([a-z0-9.-]+\.[a-z]{2,})\.?$/i.exec(p) ?? /^([a-z0-9.-]+\.[a-z]{2,})\.?$/i.exec(p);
        if (m) k.push({ tur: "MX", ad: "@", deger: (m[2] ?? m[1]).toLowerCase(), oncelik: m[2] ? Number(m[1]) : 10, amac: "Gelen posta" });
      }
      if (e.spfOzel) k.push({ tur: "TXT", ad: "@", deger: `v=spf1 include:${e.spfOzel} ~all`, amac: "SPF" });
      if (e.dkimAd) k.push(dkim(e.dkimAd));
      if (!k.length) n.push("Sağlayıcının verdiği MX sunucularını öncelikleriyle yaz (ör. 10 mx1.saglayici.com).");
      break;
    }
    default: break;
  }
  if (e.saglayici) k.push(dmarc());
  n.push("Alan adında yalnız bir SPF kaydı olabilir. Başka bir servis de (bülten, CRM) adınıza gönderiyorsa include'ları tek kayıtta birleştir.", "DMARC önce yalnız izleme kipinde (none) başlar; raporlar temiz gelince karantina (quarantine) kipine geçilebilir.");
  return { kayitlar: k, notlar: n };
}

const zamanli = <T,>(p: Promise<T>, ms = 4000) => Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error("zaman aşımı")), ms))]);
/** Kayıtları canlı DNS'te arar (Google ve Cloudflare çözücüleri; yerel önbellek atlanır). */
export async function kayitlariDenetle(alan: string, l: EpostaKaydi[]): Promise<{ kayitlar: EpostaKaydi[]; uyarilar: string[] }> {
  if (!alanAdiGecerli(alan)) throw new Error("Alan adı geçersiz.");
  const r = new Resolver({ timeout: 3000, tries: 2 });
  r.setServers(["8.8.8.8", "1.1.1.1"]);
  const tam = (ad: string) => (ad === "@" ? alan : `${ad}.${alan}`);
  const mx = await zamanli(r.resolveMx(alan)).catch(() => [] as { exchange: string; priority: number }[]);
  const txtOn = new Map<string, string[]>();
  const txt = async (ad: string) => { if (!txtOn.has(ad)) txtOn.set(ad, await zamanli(r.resolveTxt(tam(ad))).then((x) => x.map((p) => p.join(""))).catch(() => [])); return txtOn.get(ad)!; };
  const uyarilar: string[] = [];
  const o: EpostaKaydi[] = [];
  for (const k of l) {
    if (k.durum === "kullanici") { o.push(k); continue; }
    if (k.tur === "MX") {
      const b = mx.map((x) => `${x.priority} ${x.exchange.toLowerCase()}`);
      const var_ = mx.some((x) => x.exchange.toLowerCase().replace(/\.$/, "") === k.deger);
      o.push({ ...k, durum: var_ ? "dogru" : mx.length ? "yanlis" : "yok", bulunan: b });
    } else if (k.tur === "TXT") {
      const b = await txt(k.ad);
      const spf = k.deger.startsWith("v=spf1"), dm = k.deger.startsWith("v=DMARC1");
      const ilgili = b.filter((x) => (spf ? x.startsWith("v=spf1") : dm ? x.startsWith("v=DMARC1") : true));
      const dogru = spf ? ilgili.some((x) => k.deger.split(" ").filter((p) => p.startsWith("include:")).every((p) => x.includes(p))) : dm ? ilgili.length > 0 : ilgili.some((x) => x.replace(/\s/g, "") === k.deger.replace(/\s/g, ""));
      if (spf && ilgili.length > 1) uyarilar.push("Alan adında birden çok SPF kaydı var; e-postalar reddedilebilir. Tek kayıtta birleştir.");
      o.push({ ...k, durum: dogru ? "dogru" : ilgili.length ? "yanlis" : "yok", bulunan: ilgili });
    } else {
      const b = await zamanli(r.resolveCname(tam(k.ad))).catch(() => [] as string[]);
      o.push({ ...k, durum: b.some((x) => x.toLowerCase().replace(/\.$/, "") === k.deger.toLowerCase()) ? "dogru" : b.length ? "yanlis" : "yok", bulunan: b });
    }
  }
  return { kayitlar: o, uyarilar };
}

/* ───────── alan adı sorgusu (RDAP) ───────── */
type Bootstrap = { services: [string[], string[]][] };
let onbellek: { z: number; harita: Map<string, string> } | null = null;
async function rdapSunucusu(tld: string): Promise<string | null> {
  if (!onbellek || Date.now() - onbellek.z > 24 * 3600_000) {
    const r = await guvenliFetch("https://data.iana.org/rdap/dns.json", { signal: AbortSignal.timeout(8000) }, { yalnizHttps: true });
    if (!r.ok) throw new Error("IANA RDAP listesi alınamadı.");
    const j = (await r.json()) as Bootstrap;
    const h = new Map<string, string>();
    for (const [tlds, adresler] of j.services ?? []) for (const t of tlds) if (adresler[0]) h.set(t.toLowerCase(), adresler.find((x) => x.startsWith("https://")) ?? adresler[0]);
    onbellek = { z: Date.now(), harita: h };
  }
  return onbellek.harita.get(tld) ?? null;
}
export type AlanSorgu = { ad: string; durum: "musait" | "kayitli" | "sorgulanamadi"; kayitci?: string; bitis?: string; neden?: string };
export async function alanSorgula(ad: string): Promise<AlanSorgu> {
  const a = ad.trim().toLowerCase();
  if (!alanAdiGecerli(a)) return { ad: a, durum: "sorgulanamadi", neden: "Alan adı biçimi geçersiz." };
  const tld = a.split(".").pop()!;
  try {
    const kok = await rdapSunucusu(tld);
    if (!kok) return { ad: a, durum: "sorgulanamadi", neden: tld === "tr" ? ".tr uzantılı alan adları TRABIS (nic.tr) üzerinden sorgulanır; bu uzantı RDAP vermiyor." : `.${tld} uzantısı için resmî sorgu servisi yok.` };
    const r = await guvenliFetch(`${kok.replace(/\/?$/, "/")}domain/${encodeURIComponent(a)}`, { headers: { Accept: "application/rdap+json" }, signal: AbortSignal.timeout(8000) }, { yalnizHttps: true });
    if (r.status === 404) return { ad: a, durum: "musait" };
    if (!r.ok) return { ad: a, durum: "sorgulanamadi", neden: `Kayıt sorgusu yanıt vermedi (${r.status}).` };
    const j = (await r.json().catch(() => ({}))) as { events?: { eventAction?: string; eventDate?: string }[]; entities?: { roles?: string[]; vcardArray?: [string, [string, unknown, string, string][]] }[] };
    const kayitci = j.entities?.find((e) => e.roles?.includes("registrar"))?.vcardArray?.[1]?.find((x) => x[0] === "fn")?.[3];
    const bitis = j.events?.find((e) => e.eventAction === "expiration")?.eventDate;
    return { ad: a, durum: "kayitli", ...(kayitci ? { kayitci: String(kayitci).slice(0, 80) } : {}), ...(bitis ? { bitis: bitis.slice(0, 10) } : {}) };
  } catch (e) {
    return { ad: a, durum: "sorgulanamadi", neden: (e as Error).message.slice(0, 120) };
  }
}
/** İşletme adından alan adı önerileri (sorgulanabilir uzantılar önce). */
export function alanOnerileri(ad: string): string[] {
  const k = slug(ad).replace(/-/g, "");
  const tire = slug(ad);
  if (k.length < 3) return [];
  const l = [`${k}.com`, `${k}.com.tr`, `${tire}.com`, `${k}.net`, `${k}.shop`, `${k}.store`, `${k}.online`, `${k}.co`, `${k}.app`, `${k}tr.com`];
  return [...new Set(l)].filter((x) => alanAdiGecerli(x)).slice(0, 9);
}
