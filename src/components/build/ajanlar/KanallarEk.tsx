"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Mail, Phone, RefreshCw, Send } from "lucide-react";
import { TWILIO_SESLER } from "@/lib/build/ajanKatalog";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { AcilirSecim, Anahtar, KodKutusu, alanSinif } from "./AjanDuzenleyici";
import { BolumBaslik, bolumSinif } from "./Kanallar";
import { TON_SINIF, birincil, ikincil, type Ajan } from "./ortak";

export type EkAdresler = { epostaAdres: string; epostaHazir: boolean; epostaSunucu: boolean; metaAdres: string; metaDogrulama: string; telefonAdres: string; smsAdres: string; yerel: boolean };
function Durum({ ton, metin }: { ton: keyof typeof TON_SINIF; metin: string }) { return <span className={cn("rounded-full px-2.5 py-0.5 text-[11.5px] font-medium", TON_SINIF[ton])}>{metin}</span>; }
const Uyari = ({ metin }: { metin: string }) => <p className="flex items-start gap-2 rounded-[12px] bg-amber-400/[0.07] px-3 py-2 text-[12.5px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{metin}</p>;
const Adim = ({ n, children }: { n: number; children: React.ReactNode }) => <li className="flex gap-2"><span className="tabular-nums text-white/35">{n}.</span><span className="min-w-0 flex-1">{children}</span></li>;
const SAGLAYICI = [
  { id: "cloudflare", ad: "Cloudflare Email Routing", logo: "/marka/baglanti/cloudflare.svg", adim: "Email Routing › Email Workers'ta bir worker oluştur; gelen iletiyi ham hâliyle bu adrese POST etsin (fetch(adres, { method: \"POST\", body: message.raw })). Sonra destek adresin için kural ekleyip worker'a yönlendir." },
  { id: "postmark", ad: "Postmark Inbound", logo: null, adim: "Sunucunda Inbound akışını aç, Webhook URL alanına bu adresi yapıştır; destek adresinden Postmark'ın gelen adresine yönlendirme kur." },
  { id: "sendgrid", ad: "SendGrid Inbound Parse", logo: "/marka/renkli/sendgrid.svg", adim: "Settings › Inbound Parse'ta alan adını ekle, Destination URL olarak bu adresi gir, alan adının MX kaydını SendGrid'e çevir." },
  { id: "mailgun", ad: "Mailgun Routes", logo: "/marka/renkli/mailgun.svg", adim: "Receiving › Routes'ta destek adresin için kural oluştur, eylem olarak forward ile bu adresi gir." },
] as const;

/** Yayın panelinin Kanallar bölümüne eklenen kanallar: e-posta, Messenger ve Instagram, telefon ve SMS. */
export function EkKanallar({ a, setA, adr }: { a: Ajan; setA: (a: Ajan) => void; adr: EkAdresler | null }) {
  const [gidiyor, setGidiyor] = useState("");
  const [mesaj, setMesaj] = useState<{ tur: string; metin: string; hata?: boolean } | null>(null);
  const [ep, setEp] = useState({ anahtar: "", gonderen: a.yayin.eposta.gonderen ?? "", imza: a.yayin.eposta.imza ?? "" });
  const [dene, setDene] = useState({ gonderen: "", konu: "Siparişim nerede?", metin: "Merhaba, dün verdiğim sipariş ne zaman kargoya verilir?" });
  const [deneSonuc, setDeneSonuc] = useState<{ yanit: string; gonderildi: boolean; hata?: string } | null>(null);
  const [saglayici, setSaglayici] = useState<string>("cloudflare");
  const [mt, setMt] = useState({ token: "", uygulamaGizli: "" });
  const t = a.yayin.twilio;
  const [tw, setTw] = useState({ hesap: t.hesap ?? "", token: "", numara: t.numara ?? "", ses: t.ses, karsilama: t.karsilama, aktarma: t.aktarma ?? "" });
  const islem = async (g: Record<string, unknown>) => {
    setGidiyor(`${g.tur}${g.islem}`); setMesaj(null);
    try {
      const v = await api<{ ajan?: Ajan; uyari?: string; yanit?: string; gonderildi?: boolean; hata?: string }>(`/api/build/ajanlar/${a.id}/kanallar`, { govde: g });
      if (v.ajan) setA(v.ajan);
      if (g.islem === "dene") setDeneSonuc({ yanit: v.yanit ?? "", gonderildi: !!v.gonderildi, hata: v.hata });
      else if (v.uyari) setMesaj({ tur: String(g.tur), metin: v.uyari, hata: true });
      else setMesaj({ tur: String(g.tur), metin: g.islem === "kopar" ? "Bağlantı koparıldı." : "Kaydedildi." });
      if (g.tur === "meta") setMt({ token: "", uygulamaGizli: "" });
      if (g.tur === "twilio") setTw((x) => ({ ...x, token: "" }));
      if (g.tur === "eposta") setEp((x) => ({ ...x, anahtar: "" }));
    } catch (e) { setMesaj({ tur: String(g.tur), metin: e instanceof ApiHatasi ? e.message : "Yapılamadı.", hata: true }); }
    finally { setGidiyor(""); }
  };
  const not = (tur: string) => mesaj?.tur === tur ? <p className={cn("text-[12.5px] leading-relaxed", mesaj.hata ? "text-amber-200" : "text-[#8be6ff]")}>{mesaj.metin}</p> : null;
  const k = a.yayin.kanallar, e = a.yayin.eposta, m = a.yayin.meta;
  const kanal = (p: Partial<typeof k>) => islemKanal(p);
  const islemKanal = async (p: Partial<typeof k>) => { const v = await api<{ ajan: Ajan }>(`/api/build/ajanlar/${a.id}`, { method: "PATCH", govde: { yayin: { kanallar: { ...k, ...p } } } }).catch(() => null); if (v?.ajan) setA(v.ajan); };
  const sg = SAGLAYICI.find((x) => x.id === saglayici)!;
  const yayinda = a.yayin.durum === "yayinda";
  return (
    <>
      {/* E-posta */}
      <section className={bolumSinif}>
        <BolumBaslik ikon={Mail} baslik="E-posta" sag={<>{k.eposta ? <Durum ton={adr?.epostaHazir ? "iyi" : "bekliyor"} metin={adr?.epostaHazir ? "Yanıtlar gönderiliyor" : "Gönderim kurulu değil"} /> : null}<Anahtar acik={k.eposta} set={(v) => (v && !e.anahtarSonu && !e.gonderen ? islem({ tur: "eposta", islem: "kaydet" }) : kanal({ eposta: v }))} etiket="E-posta kanalı" /></>} />
        <div className="space-y-3 p-4">
          <p className="text-[13px] leading-relaxed text-white/60">Destek adresine gelen e-postaları ajan yanıtlar; aynı kişi ve aynı konu tek konuşmadır, yanıt aynı konuya gider. Gelen ileti aşağıdaki gizli adrese iletilir, yanıt Resend ile gönderilir.</p>
          {adr && <div><p className="mb-1 text-[12px] text-white/45">Gelen ileti adresi (webhook)</p><KodKutusu kod={adr.epostaAdres} /></div>}
          <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.06]">
            <div className="flex flex-wrap items-center gap-2"><span className="text-[12.5px] font-medium text-white/80">Gelen iletiyi yönlendir</span><div className="ml-auto w-[230px] max-sm:w-full"><AcilirSecim deger={saglayici} set={setSaglayici} l={SAGLAYICI.map((x) => ({ id: x.id, ad: x.ad, ...(x.logo ? { gorsel: x.logo } : {}) }))} /></div></div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">{sg.adim}</p>
          </div>
          <div className="space-y-2">
            <p className="text-[12.5px] font-medium text-white/80">Yanıt gönderimi (Resend)</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input value={ep.anahtar} onChange={(x) => setEp({ ...ep, anahtar: x.target.value })} placeholder={e.anahtarSonu ? `Kayıtlı anahtar, son dört karakteri ${e.anahtarSonu}` : adr?.epostaSunucu ? "Sunucunun anahtarı kullanılıyor; istersen kendi anahtarın" : "Resend API anahtarı (re_...)"} type="password" autoComplete="off" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />
              <input value={ep.gonderen} onChange={(x) => setEp({ ...ep, gonderen: x.target.value })} placeholder="Gönderen: Destek <destek@alanadin.com>" className={cn(alanSinif, "h-10 text-[13px]")} />
            </div>
            <textarea value={ep.imza} onChange={(x) => setEp({ ...ep, imza: x.target.value })} rows={2} maxLength={500} placeholder="E-posta imzası (isteğe bağlı)" className={cn(alanSinif, "resize-none py-2 text-[13px] leading-relaxed")} />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => islem({ tur: "eposta", islem: "kaydet", ...ep })} disabled={!!gidiyor} className={birincil}>{gidiyor === "epostakaydet" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaydet</button>
              <button type="button" onClick={() => islem({ tur: "eposta", islem: "adres" })} disabled={!!gidiyor} className={ikincil}><RefreshCw className="h-3.5 w-3.5" />Yeni gizli adres</button>
              {(e.anahtarSonu || e.gonderen) && <button type="button" onClick={() => islem({ tur: "eposta", islem: "kopar" })} disabled={!!gidiyor} className="inline-flex h-9 items-center rounded-full px-3 text-[12.5px] text-rose-300/90 hover:bg-rose-500/[0.1]">Bilgileri sil</button>}
            </div>
            {adr && !adr.epostaHazir && <Uyari metin="Resend anahtarı ve doğrulanmış alan adından bir gönderen adresi olmadan yanıt gönderilmez. Gelen iletiler yine yanıtlanır ve yanıt gelen kutusunda bekler; oradan elle gönderebilirsin." />}
            {e.hata && <Uyari metin={e.hata} />}
            {not("eposta")}
          </div>
          {k.eposta && (
            <div className="space-y-2 border-t border-white/[0.06] pt-3">
              <p className="text-[12.5px] font-medium text-white/80">Deneme iletisi</p>
              <p className="-mt-1 text-[12px] leading-relaxed text-white/45">Gerçek akışla işlenir: konuşma Konuşmalar'a ve gelen kutusuna yazılır{adr?.epostaHazir ? ", yanıt bu adrese gönderilir" : "; gönderim kurulu olmadığı için yanıt yalnız burada gösterilir"}.</p>
              <div className="grid gap-2 sm:grid-cols-2"><input value={dene.gonderen} onChange={(x) => setDene({ ...dene, gonderen: x.target.value })} placeholder="Gönderen e-posta" className={cn(alanSinif, "h-9 text-[13px]")} /><input value={dene.konu} onChange={(x) => setDene({ ...dene, konu: x.target.value })} placeholder="Konu" className={cn(alanSinif, "h-9 text-[13px]")} /></div>
              <textarea value={dene.metin} onChange={(x) => setDene({ ...dene, metin: x.target.value })} rows={2} className={cn(alanSinif, "resize-none py-2 text-[13px] leading-relaxed")} />
              <button type="button" onClick={() => islem({ tur: "eposta", islem: "dene", ...dene })} disabled={!!gidiyor || !yayinda} className={ikincil}>{gidiyor === "epostadene" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}İletiyi işle</button>
              {!yayinda && <p className="text-[12px] text-white/40">Deneme için ajanı yayınla.</p>}
              {deneSonuc && (
                <div className="rounded-[14px] bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.07]">
                  <p className="mb-1 text-[11.5px] text-white/45">{deneSonuc.gonderildi ? "Yanıt gönderildi" : "Ajanın yanıtı (gönderilmedi)"}</p>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/85">{deneSonuc.yanit || "Yanıt üretilmedi."}</p>
                  {deneSonuc.hata && <p className="mt-2 text-[12px] text-amber-200/90">{deneSonuc.hata}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Messenger ve Instagram */}
      <section className={bolumSinif}>
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marka/renkli/messenger.svg" alt="" className="h-4 w-4" />{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/renkli/instagram-color.svg" alt="" className="h-4 w-4" />
          <p className="flex-1 text-[13px] font-semibold text-white">Messenger ve Instagram</p>
          {m.tokenSonu ? <Durum ton="iyi" metin={m.sayfaAd ?? "Sayfa bağlı"} /> : <Durum ton="bekliyor" metin="Meta sayfası gerekiyor" />}
        </div>
        <div className="space-y-3 p-4">
          <p className="text-[13px] leading-relaxed text-white/60">Facebook sayfana gelen Messenger mesajlarını ve sayfaya bağlı Instagram profesyonel hesabının direkt mesajlarını yayındaki sürüm yanıtlar.</p>
          <ol className="space-y-1.5 text-[12.5px] leading-relaxed text-white/60">
            <Adim n={1}>Meta for Developers'ta bir uygulama aç, Messenger ürününü (Instagram için Instagram ürününü de) ekle.</Adim>
            <Adim n={2}>Webhooks bölümünde aşağıdaki adresi ve doğrulama belirtecini gir; messages alanına abone ol.</Adim>
            <Adim n={3}>Sayfan için erişim belirteci oluştur (pages_messaging, instagram_manage_messages izinleri) ve buraya yapıştır.</Adim>
          </ol>
          {adr && <div className="space-y-2"><div><p className="mb-1 text-[12px] text-white/45">Webhook adresi (Callback URL)</p><KodKutusu kod={adr.metaAdres} /></div><div><p className="mb-1 text-[12px] text-white/45">Doğrulama belirteci (Verify token)</p><KodKutusu kod={adr.metaDogrulama} /></div>{adr.yerel && <p className="text-[12px] leading-relaxed text-amber-200/90">Bu adres yerel; Meta yalnız herkese açık HTTPS adreslere olay gönderir. Site yayındaki adresinde çalışınca bu adres kendiliğinden ona döner.</p>}</div>}
          {m.tokenSonu ? (
            <div className="divide-y divide-white/[0.05] rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
              <div className="flex items-center gap-3 px-3 py-2.5">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/renkli/messenger.svg" alt="" className="h-5 w-5" /><span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{m.sayfaAd ?? "Facebook sayfası"}</span><span className="block text-[11.5px] text-white/40">Belirtecin son dört karakteri {m.tokenSonu}{m.uygulama ? " · imza denetimi açık" : ""}</span></span><Anahtar acik={k.messenger} set={(v) => kanal({ messenger: v })} etiket="Messenger" /></div>
              <div className="flex items-center gap-3 px-3 py-2.5">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/renkli/instagram-color.svg" alt="" className="h-5 w-5" /><span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{m.igAd ? `@${m.igAd}` : "Instagram hesabı bağlı değil"}</span><span className="block text-[11.5px] text-white/40">{m.igAd ? "Direkt mesajlar" : "Sayfaya bir Instagram profesyonel hesabı bağla, sonra yeniden bağlan"}</span></span><Anahtar acik={k.instagram && !!m.igId} set={(v) => m.igId && kanal({ instagram: v })} etiket="Instagram" /></div>
              <div className="px-3 py-2"><button type="button" onClick={() => islem({ tur: "meta", islem: "kopar" })} disabled={!!gidiyor} className="text-[12.5px] text-rose-300/90 hover:text-rose-200">Bağlantıyı kopar</button></div>
            </div>
          ) : (
            <div className="space-y-2">
              <input value={mt.token} onChange={(x) => setMt({ ...mt, token: x.target.value })} placeholder="Sayfa erişim belirteci (EAA...)" autoComplete="off" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />
              <div className="flex gap-2"><input value={mt.uygulamaGizli} onChange={(x) => setMt({ ...mt, uygulamaGizli: x.target.value })} placeholder="Uygulama gizli anahtarı (imza denetimi, isteğe bağlı)" type="password" autoComplete="off" className={cn(alanSinif, "h-10 text-[13px]")} /><button type="button" onClick={() => islem({ tur: "meta", islem: "bagla", ...mt })} disabled={!mt.token.trim() || !!gidiyor} className={cn(birincil, "h-10")}>{gidiyor === "metabagla" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Bağla</button></div>
            </div>
          )}
          <p className="text-[12px] leading-relaxed text-white/40">Meta, ziyaretçinin son mesajından 24 saat sonra yanıt göndermeye izin vermez; temsilci yanıtları da bu süreye bağlıdır.</p>
          {not("meta")}
        </div>
      </section>

      {/* Telefon ve SMS */}
      <section className={bolumSinif}>
        <BolumBaslik logo="/marka/renkli/twilio.svg" baslik="Telefon ve SMS" sag={t.tokenSonu ? <Durum ton={t.hata ? "bekliyor" : "iyi"} metin={t.numara ?? "Twilio bağlı"} /> : <Durum ton="bekliyor" metin="Twilio hesabı gerekiyor" />} />
        <div className="space-y-3 p-4">
          <p className="text-[13px] leading-relaxed text-white/60">Twilio numarana gelen aramaları ajan sesli yanıtlar: arayanın konuşması Türkçe yazıya döner, yanıt seçtiğin sesle okunur, insana devirde arama aktarma numarana bağlanır. Aynı numaraya gelen SMS'leri de yanıtlar.</p>
          {adr && <div className="grid gap-2 sm:grid-cols-2"><div><p className="mb-1 text-[12px] text-white/45">Gelen arama adresi (Voice)</p><KodKutusu kod={adr.telefonAdres} /></div><div><p className="mb-1 text-[12px] text-white/45">Gelen SMS adresi (Messaging)</p><KodKutusu kod={adr.smsAdres} /></div></div>}
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={tw.hesap} onChange={(x) => setTw({ ...tw, hesap: x.target.value })} placeholder="Hesap kimliği (AC...)" autoComplete="off" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />
            <input value={tw.token} onChange={(x) => setTw({ ...tw, token: x.target.value })} placeholder={t.tokenSonu ? `Auth Token kayıtlı, son dört karakteri ${t.tokenSonu}` : "Auth Token"} type="password" autoComplete="off" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />
            <input value={tw.numara} onChange={(x) => setTw({ ...tw, numara: x.target.value })} placeholder="Twilio numarası (+90...)" className={cn(alanSinif, "h-10 text-[13px] tabular-nums")} />
            <input value={tw.aktarma} onChange={(x) => setTw({ ...tw, aktarma: x.target.value })} placeholder="İnsana aktarma numarası (isteğe bağlı)" className={cn(alanSinif, "h-10 text-[13px] tabular-nums")} />
          </div>
          <div className="grid gap-2 sm:grid-cols-[220px_1fr]">
            <AcilirSecim deger={tw.ses} set={(v) => setTw({ ...tw, ses: v })} l={TWILIO_SESLER.map((x) => ({ id: x.id, ad: x.ad, alt: x.alt }))} />
            <input value={tw.karsilama} onChange={(x) => setTw({ ...tw, karsilama: x.target.value })} maxLength={300} placeholder="Karşılama cümlesi" className={cn(alanSinif, "h-10 text-[13px]")} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => islem({ tur: "twilio", islem: "kaydet", ...tw })} disabled={!!gidiyor || (!t.tokenSonu && (!tw.hesap.trim() || !tw.token.trim()))} className={birincil}>{gidiyor === "twiliokaydet" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Phone className="h-3.5 w-3.5" />}{t.tokenSonu ? "Kaydet" : "Bağla"}</button>
            {t.tokenSonu && <>
              <span className="flex items-center gap-2 text-[12.5px] text-white/60">Arama<Anahtar acik={k.telefon} set={(v) => kanal({ telefon: v })} etiket="Telefon" /></span>
              <span className="flex items-center gap-2 text-[12.5px] text-white/60">SMS<Anahtar acik={k.sms} set={(v) => kanal({ sms: v })} etiket="SMS" /></span>
              <button type="button" onClick={() => islem({ tur: "twilio", islem: "kopar" })} disabled={!!gidiyor} className="ml-auto inline-flex h-9 items-center rounded-full px-3 text-[12.5px] text-rose-300/90 hover:bg-rose-500/[0.1]">Bağlantıyı kopar</button>
            </>}
          </div>
          {t.hata && <Uyari metin={t.hata} />}
          {not("twilio")}
          <p className="text-[12px] leading-relaxed text-white/40">Herkese açık HTTPS adreste numaranın arama ve SMS adresleri bağlarken Twilio'da kendiliğinden ayarlanır. Görüşmeler Konuşmalar'da Telefon etiketiyle, arayan numarasıyla görünür.</p>
        </div>
      </section>
    </>
  );
}
