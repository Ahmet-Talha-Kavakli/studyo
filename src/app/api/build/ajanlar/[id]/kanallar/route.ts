import { randomBytes } from "crypto";
import { ajanGetir, ajanGuncelle, istemciAjan } from "@/lib/build/ajanDepo";
import { slackBotu, slackManifesti, telegramBotu, telegramWebhookKur, telegramWebhookSil, whatsappNumarasi } from "@/lib/build/ajanKanal";
import { coz, sifrele } from "@/lib/build/sifre";
import { epostaHazir, epostaKimligi, epostaYanitGonder, konuKoku } from "@/lib/build/ajanEposta";
import { metaSayfa } from "@/lib/build/ajanMeta";
import { twilioAdresleriKur, twilioDogrula } from "@/lib/build/ajanTwilio";
import { kanalMesaji } from "@/lib/build/ajanMesajKanal";
import { yayindakiAjan } from "@/lib/build/ajanDepo";
import { TWILIO_SESLER } from "@/lib/build/ajanKatalog";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { yeniKanalKur } from "@/lib/build/ajanKanalKurulum";
import { teamsPaketi } from "@/lib/build/ajanTeams";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Bu isteğin geldiği herkese açık köken (webhook adresleri için). */
function koken(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3100";
  const proto = req.headers.get("x-forwarded-proto") ?? (/^(localhost|127\.|\[::1\])/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
const yerel = (u: string) => !u.startsWith("https://") || /\/\/(localhost|127\.|10\.|192\.168\.)/.test(u);

/** Kanal adresleri: Telegram ve WhatsApp webhook'ları, WhatsApp doğrulama belirteci. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const a = await ajanGetir((await params).id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  const k = koken(req);
  if (new URL(req.url).searchParams.get("paket") === "teams") {
    if (!a.yayin.teams.uygulama) return hata("Önce Microsoft uygulama kimliğini kaydet.");
    return new Response(new Uint8Array(teamsPaketi({ uygulama: a.yayin.teams.uygulama, ad: a.ad, aciklama: a.aciklama, koken: k })), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="vayra-teams-${a.id}.zip"` } });
  }
  const slackAdres = `${k}/api/build/genel/ajan/${a.id}/slack`;
  return Response.json({
    ok: true, telegramAdres: `${k}/api/build/genel/ajan/${a.id}/telegram`, whatsappAdres: `${k}/api/build/genel/ajan/${a.id}/whatsapp`, slackAdres, slackManifest: slackManifesti(a.ad, slackAdres), dogrulama: a.yayin.whatsapp.dogrulama, yerel: yerel(k),
    epostaAdres: `${k}/api/build/genel/ajan/${a.id}/eposta/${a.yayin.eposta.gizli}`, epostaHazir: epostaHazir(a), epostaSunucu: !!process.env.RESEND_API_KEY,
    metaAdres: `${k}/api/build/genel/ajan/${a.id}/meta`, metaDogrulama: a.yayin.meta.dogrulama,
    telefonAdres: `${k}/api/build/genel/ajan/${a.id}/telefon`, smsAdres: `${k}/api/build/genel/ajan/${a.id}/sms`,
    discordAdres: `${k}/api/build/genel/ajan/${a.id}/discord`, teamsAdres: `${k}/api/build/genel/ajan/${a.id}/teams`, lineAdres: `${k}/api/build/genel/ajan/${a.id}/line`,
  });
}

/**
 * { tur: "telegram", islem: "bagla", token } bot belirtecini getMe ile doğrular, şifreli saklar ve webhook'u kurar
 * (yerel adreste Telegram ulaşamaz; bu dürüstçe bildirilir) · { tur: "telegram", islem: "kopar" } ·
 * { tur: "whatsapp", islem: "kaydet", token, telefonId, uygulamaGizli? } Meta bilgilerini saklar ve numarayı doğrular ·
 * { tur: "whatsapp", islem: "kopar" }.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const a = await ajanGetir(id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  let g: { tur?: string; islem?: string; token?: string; telefonId?: string; uygulamaGizli?: string; imza?: string; anahtar?: string; gonderen?: string; konu?: string; metin?: string; hesap?: string; numara?: string; ses?: string; karsilama?: string; aktarma?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const k = koken(req);

  if (g.tur === "telegram" && g.islem === "bagla") {
    const token = String(g.token ?? "").trim();
    if (!/^\d{5,15}:[A-Za-z0-9_-]{30,50}$/.test(token)) return hata("Bot belirteci 123456789:ABC... biçiminde olmalı. BotFather'dan kopyala.");
    const b = await telegramBotu(token);
    if (!b.bot) return hata(b.hata ?? "Bot doğrulanamadı.");
    const adres = `${k}/api/build/genel/ajan/${id}/telegram`;
    const webhookHata = yerel(adres) ? "Bot doğrulandı ama bu sunucu herkese açık bir HTTPS adresinde değil; Telegram mesajları ancak site yayındaki adresinden çalışınca gelir." : await telegramWebhookKur(token, adres, a.yayin.telegram.gizli);
    const r = await ajanGuncelle(id, sahip, (x) => {
      x.yayin.telegram = { ...x.yayin.telegram, tokenSifreli: sifrele(token), tokenSonu: token.slice(-4), bot: b.bot, bagli: !webhookHata, hata: webhookHata ?? undefined, adres };
      x.yayin.kanallar.telegram = true;
    });
    return Response.json({ ok: true, ajan: r?.ajan ? istemciAjan(r.ajan) : undefined, uyari: webhookHata });
  }
  if (g.tur === "telegram" && g.islem === "kopar") {
    const t = coz(a.yayin.telegram.tokenSifreli);
    if (t) await telegramWebhookSil(t);
    const r = await ajanGuncelle(id, sahip, (x) => { x.yayin.telegram = { gizli: x.yayin.telegram.gizli, bagli: false }; x.yayin.kanallar.telegram = false; });
    return Response.json({ ok: true, ajan: r?.ajan ? istemciAjan(r.ajan) : undefined });
  }
  if (g.tur === "whatsapp" && g.islem === "kaydet") {
    const token = String(g.token ?? "").trim(), telefonId = String(g.telefonId ?? "").trim(), gizli = String(g.uygulamaGizli ?? "").trim();
    if (token.length < 20) return hata("Meta erişim belirtecini yapıştır (WhatsApp › API Setup ya da sistem kullanıcısı belirteci).");
    if (!/^\d{6,20}$/.test(telefonId)) return hata("Telefon numarası kimliği yalnız rakamlardan oluşur (WhatsApp › API Setup › Phone number ID).");
    const n = await whatsappNumarasi(token, telefonId);
    const r = await ajanGuncelle(id, sahip, (x) => {
      x.yayin.whatsapp = { ...x.yayin.whatsapp, tokenSifreli: sifrele(token), tokenSonu: token.slice(-4), telefonId, ...(gizli ? { uygulamaSifreli: sifrele(gizli) } : {}), dogrulandi: !!n.numara, hata: n.hata ? `Meta numarayı doğrulamadı: ${n.hata}` : undefined };
      x.yayin.kanallar.whatsapp = true;
    });
    return Response.json({ ok: true, ajan: r?.ajan ? istemciAjan(r.ajan) : undefined, numara: n.numara, uyari: n.hata ? `Bilgiler kaydedildi ama Meta numarayı doğrulamadı: ${n.hata}` : undefined });
  }
  if (g.tur === "whatsapp" && g.islem === "kopar") {
    const r = await ajanGuncelle(id, sahip, (x) => { x.yayin.whatsapp = { dogrulama: x.yayin.whatsapp.dogrulama }; x.yayin.kanallar.whatsapp = false; });
    return Response.json({ ok: true, ajan: r?.ajan ? istemciAjan(r.ajan) : undefined });
  }
  if (g.tur === "slack" && g.islem === "bagla") {
    const token = String(g.token ?? "").trim(), imza = String(g.imza ?? "").trim();
    if (!/^[a-f0-9]{32}$/i.test(imza)) return hata("İmza anahtarı (Signing Secret) 32 karakterlik bir değer; Basic Information sayfasındaki App Credentials bölümünden kopyala.");
    const b = await slackBotu(token);
    if (!b.bot) return hata(b.hata ?? "Slack belirteci doğrulanamadı.");
    const uyari = yerel(`${k}/`) ? "Uygulama doğrulandı ama bu sunucu herkese açık bir HTTPS adresinde değil; Slack olayları ancak site yayındaki adresinden çalışınca gelir." : undefined;
    const r = await ajanGuncelle(id, sahip, (x) => {
      x.yayin.slack = { tokenSifreli: sifrele(token), imzaSifreli: sifrele(imza), tokenSonu: token.slice(-4), takim: b.takim, takimId: b.takimId, bot: b.bot, botKullanici: b.botKullanici, bagli: !uyari, hata: uyari };
      x.yayin.kanallar.slack = true;
    });
    return Response.json({ ok: true, ajan: r?.ajan ? istemciAjan(r.ajan) : undefined, uyari });
  }
  if (g.tur === "slack" && g.islem === "kopar") {
    const r = await ajanGuncelle(id, sahip, (x) => { x.yayin.slack = { bagli: false }; x.yayin.kanallar.slack = false; });
    return Response.json({ ok: true, ajan: r?.ajan ? istemciAjan(r.ajan) : undefined });
  }
  /* ── E-posta ── */
  if (g.tur === "eposta" && g.islem === "kaydet") {
    const anahtar = String(g.anahtar ?? "").trim(), gonderen = String(g.gonderen ?? "").trim(), imza = typeof g.imza === "string" ? g.imza.slice(0, 500) : undefined;
    if (anahtar && !/^re_[A-Za-z0-9_]{10,}$/.test(anahtar)) return hata("Resend anahtarı re_ ile başlar (Resend › API Keys).");
    if (gonderen && !/^([^<>]{1,60}<)?[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}>?$/i.test(gonderen)) return hata("Gönderen adresi destek@alanadin.com ya da Ad <destek@alanadin.com> biçiminde olmalı.");
    const r = await ajanGuncelle(id, sahip, (x) => {
      x.yayin.eposta = { ...x.yayin.eposta, ...(anahtar ? { anahtarSifreli: sifrele(anahtar), anahtarSonu: anahtar.slice(-4) } : {}), ...(gonderen ? { gonderen } : {}), ...(imza !== undefined ? { imza } : {}), hata: undefined };
      x.yayin.kanallar.eposta = true;
    });
    return Response.json({ ok: true, ajan: r?.ajan ? istemciAjan(r.ajan) : undefined, uyari: r?.ajan && !epostaHazir(r.ajan) ? "Kanal açıldı; gelen iletiler işlenir ama yanıt göndermek için Resend anahtarı ve doğrulanmış bir gönderen adresi gerekiyor." : undefined });
  }
  if (g.tur === "eposta" && g.islem === "kopar") {
    const r = await ajanGuncelle(id, sahip, (x) => { x.yayin.eposta = { gizli: x.yayin.eposta.gizli }; x.yayin.kanallar.eposta = false; });
    return Response.json({ ok: true, ajan: r?.ajan ? istemciAjan(r.ajan) : undefined });
  }
  if (g.tur === "eposta" && g.islem === "adres") {
    const r = await ajanGuncelle(id, sahip, (x) => { x.yayin.eposta = { ...x.yayin.eposta, gizli: randomBytes(15).toString("base64url") }; });
    return Response.json({ ok: true, ajan: r?.ajan ? istemciAjan(r.ajan) : undefined });
  }
  if (g.tur === "eposta" && g.islem === "dene") {
    // Gerçek akış: iletiyi gelen kutusuna düşmüş gibi işler; yanıt kurulu servisle gönderilir, yoksa yalnız gösterilir.
    const y = await yayindakiAjan(id);
    if (!y) return hata("Önce ajanı yayınla; e-posta kanalı yayındaki sürümle çalışır.");
    if (!y.ajan.yayin.kanallar.eposta) return hata("Önce e-posta kanalını aç.");
    const gonderen = String(g.gonderen ?? "").trim().toLowerCase(), konu = String(g.konu ?? "").trim().slice(0, 200) || "Deneme", metin = String(g.metin ?? "").trim().slice(0, 4000);
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(gonderen)) return hata("Gönderen olarak geçerli bir e-posta adresi yaz.");
    if (!metin) return hata("İleti metni boş.");
    const hazir = epostaHazir(y.ajan);
    let gidecek = "";
    const r = await kanalMesaji({
      y, kaynak: "eposta", kimlik: epostaKimligi(gonderen, konu), adres: gonderen, metin: `Konu: ${konuKoku(konu)}\n\n${metin}`, iletisim: { eposta: gonderen, zaman: Date.now() },
      hazirla: (k) => { k.eposta = { konu: konuKoku(konu) }; },
      gonder: async (m) => { gidecek = m; return hazir ? epostaYanitGonder(y.ajan, { alici: gonderen, konu: konuKoku(konu), metin: m }) : "Yanıt üretildi ama gönderilmedi: e-posta gönderim servisi kurulu değil."; },
    });
    return Response.json({ ok: true, yanit: gidecek || r.yanit || "", gonderildi: hazir && !r.hata, hata: r.hata });
  }
  /* ── Meta: Messenger ve Instagram ── */
  if (g.tur === "meta" && g.islem === "bagla") {
    const token = String(g.token ?? "").trim(), gizli = String(g.uygulamaGizli ?? "").trim();
    if (token.length < 30) return hata("Facebook sayfası erişim belirtecini yapıştır (Meta for Developers › Messenger › Access Tokens).");
    const s = await metaSayfa(token);
    if (!s.sayfaId) return hata(s.hata ?? "Sayfa doğrulanamadı.");
    const r = await ajanGuncelle(id, sahip, (x) => {
      x.yayin.meta = { ...x.yayin.meta, tokenSifreli: sifrele(token), tokenSonu: token.slice(-4), sayfaId: s.sayfaId, sayfaAd: s.sayfaAd, igId: s.igId, igAd: s.igAd, ...(gizli ? { uygulamaSifreli: sifrele(gizli) } : {}), hata: undefined };
      x.yayin.kanallar.messenger = true; x.yayin.kanallar.instagram = !!s.igId;
    });
    return Response.json({ ok: true, ajan: r?.ajan ? istemciAjan(r.ajan) : undefined, uyari: !s.igId ? "Sayfaya bağlı bir Instagram profesyonel hesabı bulunamadı; yalnız Messenger açıldı." : undefined });
  }
  if (g.tur === "meta" && g.islem === "kopar") {
    const r = await ajanGuncelle(id, sahip, (x) => { x.yayin.meta = { dogrulama: x.yayin.meta.dogrulama }; x.yayin.kanallar.messenger = false; x.yayin.kanallar.instagram = false; });
    return Response.json({ ok: true, ajan: r?.ajan ? istemciAjan(r.ajan) : undefined });
  }
  /* ── Twilio: telefon ve SMS ── */
  if (g.tur === "twilio" && g.islem === "kaydet") {
    const hesap = String(g.hesap ?? "").trim(), token = String(g.token ?? "").trim(), numara = String(g.numara ?? "").replace(/[\s()-]/g, "");
    const ses = TWILIO_SESLER.some((x) => x.id === g.ses) || /^(Polly|Google)\.[A-Za-z0-9.-]{3,40}$/.test(String(g.ses ?? "")) ? String(g.ses) : undefined;
    const aktarma = String(g.aktarma ?? "").replace(/[\s()-]/g, "");
    const mevcut = a.yayin.twilio;
    const ilk = !mevcut.tokenSonu;
    if (ilk || token || hesap) {
      if (!/^AC[a-f0-9]{32}$/i.test(hesap || mevcut.hesap || "")) return hata("Hesap kimliği (Account SID) AC ile başlayan 34 karakterlik değer; Twilio Console ana sayfasında.");
      if (ilk && !/^[a-f0-9]{32}$/i.test(token)) return hata("Auth Token 32 karakterlik bir değer; Twilio Console ana sayfasındaki Auth Token.");
    }
    if (numara && !/^\+[1-9]\d{7,14}$/.test(numara)) return hata("Twilio numarasını +90... biçiminde, ülke koduyla yaz.");
    if (aktarma && !/^\+[1-9]\d{7,14}$/.test(aktarma)) return hata("Aktarma numarasını +90... biçiminde, ülke koduyla yaz.");
    const yeniHesap = hesap || mevcut.hesap!, yeniToken = token || coz(mevcut.tokenSifreli) || "", yeniNumara = numara || mevcut.numara || "";
    let uyari: string | undefined;
    if (yeniNumara && (token || hesap || numara)) {
      const d = await twilioDogrula(yeniHesap, yeniToken, yeniNumara);
      if (d.hata) uyari = `Bilgiler kaydedildi ama Twilio doğrulamadı: ${d.hata}`;
      else if (d.numaraSid) {
        const ses2 = `${k}/api/build/genel/ajan/${id}/telefon`, sms = `${k}/api/build/genel/ajan/${id}/sms`;
        uyari = yerel(k) ? "Numara doğrulandı ama bu sunucu herkese açık bir HTTPS adresinde değil; Twilio aramaları ancak site yayındaki adresinden çalışınca gelir. Adresleri Twilio'da elle de girebilirsin." : (await twilioAdresleriKur(yeniHesap, yeniToken, d.numaraSid, ses2, sms)) ?? undefined;
      }
    }
    const r = await ajanGuncelle(id, sahip, (x) => {
      x.yayin.twilio = {
        ...x.yayin.twilio, hesap: yeniHesap, ...(token ? { tokenSifreli: sifrele(token), tokenSonu: token.slice(-4) } : {}), ...(yeniNumara ? { numara: yeniNumara } : {}),
        ...(ses ? { ses } : {}), ...(typeof g.karsilama === "string" ? { karsilama: g.karsilama.slice(0, 300) } : {}), aktarma: aktarma || (g.aktarma === "" ? undefined : x.yayin.twilio.aktarma), hata: uyari,
      };
      if (ilk) { x.yayin.kanallar.telefon = true; x.yayin.kanallar.sms = true; }
    });
    return Response.json({ ok: true, ajan: r?.ajan ? istemciAjan(r.ajan) : undefined, uyari });
  }
  if (g.tur === "twilio" && g.islem === "kopar") {
    const r = await ajanGuncelle(id, sahip, (x) => { x.yayin.twilio = { ses: x.yayin.twilio.ses, karsilama: x.yayin.twilio.karsilama }; x.yayin.kanallar.telefon = false; x.yayin.kanallar.sms = false; });
    return Response.json({ ok: true, ajan: r?.ajan ? istemciAjan(r.ajan) : undefined });
  }
  const yeni = await yeniKanalKur(a, sahip, g as Parameters<typeof yeniKanalKur>[2], k, yerel(k));
  if (yeni) return yeni.hata ? hata(yeni.hata) : Response.json({ ok: true, ...yeni });
  return hata("Bilinmeyen işlem.");
}
