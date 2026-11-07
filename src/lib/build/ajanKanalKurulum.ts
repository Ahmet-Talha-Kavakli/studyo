import "server-only";
import { randomBytes } from "crypto";
import { ajanGuncelle, istemciAjan, type Ajan } from "./ajanDepo";
import { discordKomutlariKur, discordUcNoktasiKur, discordUygulama } from "./ajanDiscord";
import { lineBotu, lineWebhookKur } from "./ajanLine";
import { teamsBelirteci } from "./ajanTeams";
import { siteSohbetBagla, siteSohbetDizini, siteSohbetKopar } from "./ajanSiteSohbet";
import { sahipOzeti, sahipProjeleri } from "./depo";
import { listeOku, isletmeOku } from "./isletme";
import type { Sohbet } from "./isletmeTipler";
import { coz, sifrele } from "./sifre";

/**
 * Yeni kanalların kurulumu (Kanallar bölümü): Discord, Microsoft Teams, LINE, site canlı sohbeti ve web kutusunda
 * kimlik doğrulama anahtarı. Her biri belirteci gerçek API ile doğrular; yerel adreste dürüstçe uyarır, sahte başarı
 * göstermez. Bilgiler kaydedilir ama doğrulanamadıysa durum "doğrulanmadı" kalır.
 */
type Govde = { tur?: string; islem?: string; token?: string; uygulama?: string; anahtar?: string; sifre?: string; kiraci?: string; kiraciTur?: string; gizli?: string; proje?: string; zorunlu?: boolean };
export type KurulumSonuc = { ajan?: ReturnType<typeof istemciAjan>; uyari?: string; anahtar?: string; hata?: string; projeler?: unknown };

export async function yeniKanalKur(a: Ajan, sahip: string, g: Govde, koken: string, yerel: boolean): Promise<KurulumSonuc | null> {
  const id = a.id;
  const guncel = async (f: (x: Ajan) => void) => { const r = await ajanGuncelle(id, sahip, f); return r?.ajan ? istemciAjan(r.ajan) : undefined; };
  const yerelUyari = (ad: string) => `Bilgiler doğrulandı ama bu sunucu herkese açık bir HTTPS adresinde değil; ${ad} olayları ancak site yayındaki adresinden çalışınca gelir.`;

  /* ── Discord ── */
  if (g.tur === "discord" && g.islem === "kaydet") {
    const token = String(g.token ?? "").trim(), uygulama = String(g.uygulama ?? "").trim(), anahtar = String(g.anahtar ?? "").trim().toLowerCase();
    if (uygulama && !/^\d{15,22}$/.test(uygulama)) return { hata: "Uygulama kimliği (Application ID) yalnız rakamlardan oluşur; General Information sayfasında." };
    if (anahtar && !/^[a-f0-9]{64}$/.test(anahtar)) return { hata: "Genel anahtar (Public Key) 64 karakterlik onaltılık bir değer; General Information sayfasında." };
    if (!token && !a.yayin.discord.tokenSonu) return { hata: "Bot belirtecini yapıştır (Bot sekmesinde Reset Token)." };
    let uyari: string | undefined, bilgi: { id?: string; ad?: string; anahtar?: string } = {};
    if (token) {
      const u = await discordUygulama(token);
      if (u.hata) uyari = `Bilgiler kaydedildi ama Discord belirteci doğrulamadı: ${u.hata}`;
      else {
        bilgi = u;
        if (uygulama && u.id !== uygulama) uyari = "Belirteç başka bir uygulamaya ait; uygulama kimliği belirteçten alındı.";
        const k = await discordKomutlariKur(token, u.id!, a.ad);
        const adres = `${koken}/api/build/genel/ajan/${id}/discord`;
        const uc = yerel ? yerelUyari("Discord") : await discordUcNoktasiKur(token, adres);
        uyari = [uyari, k, uc].filter(Boolean).join(" ") || undefined;
      }
    }
    const ajan = await guncel((x) => {
      x.yayin.discord = { ...x.yayin.discord, ...(token ? { tokenSifreli: sifrele(token), tokenSonu: token.slice(-4) } : {}), uygulama: bilgi.id ?? (uygulama || x.yayin.discord.uygulama), anahtar: bilgi.anahtar ?? (anahtar || x.yayin.discord.anahtar), bot: bilgi.ad ?? x.yayin.discord.bot, komut: !!bilgi.id && !uyari?.includes("Komutlar"), hata: uyari };
      x.yayin.kanallar.discord = true;
    });
    return { ajan, uyari };
  }
  if (g.tur === "discord" && g.islem === "kopar") return { ajan: await guncel((x) => { x.yayin.discord = {}; x.yayin.kanallar.discord = false; }) };

  /* ── Microsoft Teams ── */
  if (g.tur === "teams" && g.islem === "kaydet") {
    const uygulama = String(g.uygulama ?? "").trim().toLowerCase(), sifre = String(g.sifre ?? "").trim(), tur = g.kiraciTur === "tek" ? "tek" : "cok", kiraci = String(g.kiraci ?? "").trim().toLowerCase();
    const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    if (!GUID.test(uygulama)) return { hata: "Microsoft uygulama kimliği (App ID) xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx biçiminde; Azure Bot kaynağının Configuration sayfasında." };
    if (tur === "tek" && !GUID.test(kiraci)) return { hata: "Tek kiracılı uygulamada kiracı kimliğini (Tenant ID) gir." };
    const yeniSifre = sifre || coz(a.yayin.teams.sifreSifreli) || "";
    if (!yeniSifre) return { hata: "İstemci gizli anahtarını (Client secret) yapıştır." };
    const b = await teamsBelirteci(uygulama, yeniSifre, tur === "tek" ? kiraci : undefined);
    const uyari = b.hata ? `Bilgiler kaydedildi ama Microsoft doğrulamadı: ${b.hata}` : yerel ? yerelUyari("Teams") : undefined;
    const ajan = await guncel((x) => {
      x.yayin.teams = { ...x.yayin.teams, uygulama, ...(sifre ? { sifreSifreli: sifrele(sifre), sifreSonu: sifre.slice(-4) } : {}), tur, kiraci: tur === "tek" ? kiraci : undefined, hata: uyari, dogrulandi: !b.hata && x.yayin.teams.dogrulandi };
      x.yayin.kanallar.teams = true;
    });
    return { ajan, uyari };
  }
  if (g.tur === "teams" && g.islem === "kopar") return { ajan: await guncel((x) => { x.yayin.teams = { tur: "cok" }; x.yayin.kanallar.teams = false; }) };

  /* ── LINE ── */
  if (g.tur === "line" && g.islem === "kaydet") {
    const token = String(g.token ?? "").trim(), gizli = String(g.gizli ?? "").trim();
    if (gizli && !/^[a-f0-9]{32}$/i.test(gizli)) return { hata: "Kanal gizli anahtarı (Channel secret) 32 karakterlik bir değer; Basic settings sekmesinde." };
    if (!token && !a.yayin.line.tokenSonu) return { hata: "Kanal erişim belirtecini (Channel access token, uzun ömürlü) yapıştır; Messaging API sekmesinde." };
    if (!gizli && !a.yayin.line.gizliSifreli) return { hata: "Kanal gizli anahtarını yapıştır; webhook imzası onunla doğrulanır." };
    let uyari: string | undefined, bot: { ad?: string; basicId?: string } = {};
    if (token) {
      const b = await lineBotu(token);
      if (b.hata) uyari = `Bilgiler kaydedildi ama LINE belirteci doğrulamadı: ${b.hata}`;
      else { bot = b; uyari = yerel ? yerelUyari("LINE") : (await lineWebhookKur(token, `${koken}/api/build/genel/ajan/${id}/line`)) ?? undefined; }
    }
    const ajan = await guncel((x) => {
      x.yayin.line = { ...x.yayin.line, ...(token ? { tokenSifreli: sifrele(token), tokenSonu: token.slice(-4) } : {}), ...(gizli ? { gizliSifreli: sifrele(gizli) } : {}), bot: bot.ad ?? x.yayin.line.bot, basicId: bot.basicId ?? x.yayin.line.basicId, hata: uyari };
      x.yayin.kanallar.line = true;
    });
    return { ajan, uyari };
  }
  if (g.tur === "line" && g.islem === "kopar") return { ajan: await guncel((x) => { x.yayin.line = {}; x.yayin.kanallar.line = false; }) };

  /* ── Web kutusunda kimlik doğrulama ── */
  if (g.tur === "kimlik" && g.islem === "anahtar") {
    const k = randomBytes(24).toString("base64url");
    const ajan = await guncel((x) => { x.yayin.kimlik = { ...x.yayin.kimlik, anahtarSifreli: sifrele(k), anahtarSonu: k.slice(-4) }; });
    return { ajan, anahtar: k };
  }
  if (g.tur === "kimlik" && g.islem === "zorunlu") return { ajan: await guncel((x) => { x.yayin.kimlik = { ...x.yayin.kimlik, zorunlu: !!g.zorunlu }; }) };
  if (g.tur === "kimlik" && g.islem === "kaldir") return { ajan: await guncel((x) => { x.yayin.kimlik = {}; }) };

  /* ── Vayra İşletme site canlı sohbeti ── */
  if (g.tur === "site" && g.islem === "projeler") return { projeler: await siteProjeleri(sahip, id) };
  if (g.tur === "site" && (g.islem === "bagla" || g.islem === "kopar")) {
    const proje = String(g.proje ?? "");
    if (g.islem === "bagla") { const h = await siteSohbetBagla(proje, id, sahipOzeti(sahip)); if (h) return { hata: h }; }
    else await siteSohbetKopar(proje, id);
    const ajan = await guncel((x) => {
      const l = new Set(x.yayin.siteSohbet?.projeler ?? []);
      if (g.islem === "bagla") l.add(proje); else l.delete(proje);
      x.yayin.siteSohbet = { projeler: [...l].slice(0, 20) };
      x.yayin.kanallar.site = l.size > 0;
      if (g.islem === "bagla" && !x.isletmeProje) x.isletmeProje = proje;
    });
    const v = g.islem === "bagla" ? await isletmeOku(proje) : null;
    return { ajan, projeler: await siteProjeleri(sahip, id), uyari: v && !v.eklentiler.sohbet.acik ? "Proje bağlandı ama sitede canlı sohbet eklentisi kapalı; İşletme bölümünün Eklentiler sekmesinden aç." : a.yayin.durum !== "yayinda" ? "Proje bağlandı; ajan yayınlanınca ziyaretçilere yanıt verir." : undefined };
  }
  return null;
}

/** Sahibin projeleri: canlı sohbet açık mı, kaç sohbet var, hangi ajana bağlı. */
export async function siteProjeleri(sahip: string, ajanId: string) {
  const d = await siteSohbetDizini();
  const l = await sahipProjeleri(sahip);
  return Promise.all(l.filter((p) => !p.ekipRol).sort((a, b) => Number(d[b.id]?.ajanId === ajanId) - Number(d[a.id]?.ajanId === ajanId) || b.guncelleme - a.guncelleme).slice(0, 80).map(async (p) => {
    const v = await isletmeOku(p.id);
    const s = await listeOku<Sohbet>(p.id, "sohbetler");
    return { id: p.id, ad: p.ad, kapak: p.kapak, sohbetAcik: v.eklentiler.sohbet.acik, sohbet: s.length, bagli: d[p.id]?.ajanId === ajanId, baskaAjan: !!d[p.id] && d[p.id].ajanId !== ajanId };
  }));
}
