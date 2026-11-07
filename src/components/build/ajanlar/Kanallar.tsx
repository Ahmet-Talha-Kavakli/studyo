"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Code2, Copy, ExternalLink, Gauge, Globe, KeyRound, Loader2 } from "lucide-react";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Anahtar, KodKutusu, alanSinif } from "./AjanDuzenleyici";
import { birincil, ikincil, TON_SINIF, type Ajan } from "./ortak";
import { EkKanallar, type EkAdresler } from "./KanallarEk";
import { YeniKanallar, type YeniAdresler } from "./KanallarYeni";

type D = (p: Partial<Ajan>) => void;
export const bolumSinif = "overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]";
export function BolumBaslik({ ikon: I, baslik, sag, logo }: { ikon?: typeof Globe; baslik: string; sag?: React.ReactNode; logo?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logo ? <img src={logo} alt="" className="h-4 w-4 object-contain" /> : I ? <I className="h-3.5 w-3.5 text-white" /> : null}
      <p className="flex-1 text-[13px] font-semibold text-white">{baslik}</p>{sag}
    </div>
  );
}

/** Yayın panelinin "Kanallar" bölümü: paylaşım sayfası, Telegram, Slack, WhatsApp, e-posta, Messenger, Instagram, telefon, SMS, API ve ziyaretçi sınırı. */
export function KanallarBolumu({ a, d, koken, anahtar, islem, gidiyor, setA }: { a: Ajan; d: D; koken: string; anahtar: string | null; islem: (g: Record<string, unknown>) => Promise<void>; gidiyor: string | null; setA: (a: Ajan) => void }) {
  const yayinda = a.yayin.durum === "yayinda";
  const sayfa = `${koken}/ajan/${a.id}`;
  const k = a.yayin.kanallar;
  const kanal = (p: Partial<typeof k>) => d({ yayin: { ...a.yayin, kanallar: { ...k, ...p } } });
  const [kopya, setKopya] = useState(false);
  return (
    <div className="space-y-3">
      <section className={bolumSinif}>
        <BolumBaslik ikon={Globe} baslik="Paylaşım sayfası" sag={<Anahtar acik={k.sayfa} set={(v) => kanal({ sayfa: v })} etiket="Paylaşım sayfası" />} />
        <div className="space-y-2 p-4">
          <p className="text-[13px] text-white/60">Ajanın kendi sayfası; bağlantıyı olan herkes sohbet edebilir. Web kutusu ayarlarındaki renk, yazı tipi, form ve açıklama burada da geçerlidir.</p>
          <div className="flex items-center gap-2">
            <span className="sc-kod min-w-0 flex-1 truncate rounded-[12px] bg-white/[0.05] px-3 py-2 text-[12.5px] text-white/75 ring-1 ring-inset ring-white/[0.07]">{sayfa}</span>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(sayfa); setKopya(true); setTimeout(() => setKopya(false), 1200); }} aria-label="Bağlantıyı kopyala" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/75 hover:text-white"><Copy className="h-3.5 w-3.5" /></button>
            <a href={sayfa} target="_blank" rel="noopener noreferrer" aria-label="Sayfayı aç" className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/75 hover:text-white", (!yayinda || !k.sayfa) && "pointer-events-none opacity-40")}><ExternalLink className="h-3.5 w-3.5" /></a>
          </div>
          {kopya && <p className="text-[12px] text-[#8be6ff]">Bağlantı kopyalandı.</p>}
          {!yayinda && <p className="text-[12px] text-white/40">Sayfa yayınladıktan sonra açılır.</p>}
        </div>
      </section>
      <MesajKanallari a={a} setA={setA} />
      <section className={bolumSinif}>
        <BolumBaslik ikon={KeyRound} baslik="API" sag={<Anahtar acik={k.api} set={(v) => kanal({ api: v })} etiket="API" />} />
        <div className="space-y-3 p-4">
          <p className="text-[13px] text-white/60">Kendi uygulamandan, sistemlerden ya da otomasyonlardan ajana mesaj gönder. Her oturum adı ayrı bir konuşmadır.</p>
          {anahtar ? (
            <div className="space-y-1.5"><p className="text-[12.5px] font-medium text-amber-200">Anahtar yalnız şimdi görünür; güvenli bir yere kopyala.</p><KodKutusu kod={anahtar} /></div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[12.5px] text-white/50">{a.yayin.anahtarSonu ? `Anahtarın son dört karakteri ${a.yayin.anahtarSonu}` : "Henüz anahtar yok"}</span>
              <button type="button" onClick={() => islem({ islem: "anahtar" })} disabled={!!gidiyor} className={ikincil}>{gidiyor === "anahtar" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}{a.yayin.anahtarSonu ? "Yeni anahtar" : "Anahtar oluştur"}</button>
            </div>
          )}
          <KodKutusu kod={`curl ${koken}/api/build/genel/ajan/${a.id}/mesaj \\\n  -H "Authorization: Bearer ${anahtar ?? "ANAHTARIN"}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"metin": "Merhaba", "oturum": "musteri-42"}'`} />
        </div>
      </section>
      <section className={bolumSinif}>
        <BolumBaslik ikon={Gauge} baslik="Ziyaretçi sınırı" />
        <div className="flex flex-wrap items-center gap-3 p-4">
          <p className="min-w-[220px] flex-1 text-[13px] leading-relaxed text-white/60">Ziyaretçilerin mesajları senin kredinden düşer. Günlük üst sınır dolunca ajan yarına kadar yanıt vermez.</p>
          <label className="flex items-center gap-2"><input type="number" min={10} max={5000} value={a.yayin.gunlukTavan} onChange={(e) => d({ yayin: { ...a.yayin, gunlukTavan: Number(e.target.value) || 10 } })} className={cn(alanSinif, "h-10 w-[100px] text-right tabular-nums")} /><span className="text-[12.5px] text-white/45">mesaj</span></label>
        </div>
      </section>
    </div>
  );
}

type Adresler = { telegramAdres: string; whatsappAdres: string; slackAdres: string; slackManifest: string; dogrulama: string; yerel: boolean } & EkAdresler & YeniAdresler;
function Durum({ ton, metin }: { ton: keyof typeof TON_SINIF; metin: string }) { return <span className={cn("rounded-full px-2.5 py-0.5 text-[11.5px] font-medium", TON_SINIF[ton])}>{metin}</span>; }

/** Telegram ve WhatsApp: belirteçler kasada şifreli durur; tarayıcıya yalnız son dört karakter gelir. */
function MesajKanallari({ a, setA }: { a: Ajan; setA: (a: Ajan) => void }) {
  const [adr, setAdr] = useState<Adresler | null>(null);
  const [tg, setTg] = useState("");
  const [wa, setWa] = useState({ token: "", telefonId: "", uygulamaGizli: "" });
  const [sl, setSl] = useState({ token: "", imza: "" });
  const [manifestAcik, setManifestAcik] = useState(false);
  const [gidiyor, setGidiyor] = useState("");
  const [mesaj, setMesaj] = useState<{ tur: string; metin: string; hata?: boolean } | null>(null);
  useEffect(() => { api<Adresler>(`/api/build/ajanlar/${a.id}/kanallar`).then(setAdr).catch(() => {}); }, [a.id]);
  const islem = async (g: Record<string, unknown>) => {
    setGidiyor(`${g.tur}${g.islem}`); setMesaj(null);
    try {
      const v = await api<{ ajan?: Ajan; uyari?: string; numara?: string }>(`/api/build/ajanlar/${a.id}/kanallar`, { govde: g });
      if (v.ajan) setA(v.ajan);
      if (v.uyari) setMesaj({ tur: String(g.tur), metin: v.uyari, hata: true }); else if (v.numara) setMesaj({ tur: "whatsapp", metin: `Numara doğrulandı: ${v.numara}` });
      if (g.tur === "telegram") setTg(""); else if (g.tur === "slack") setSl({ token: "", imza: "" }); else setWa({ token: "", telefonId: "", uygulamaGizli: "" });
    } catch (e) { setMesaj({ tur: String(g.tur), metin: e instanceof ApiHatasi ? e.message : "Yapılamadı.", hata: true }); }
    finally { setGidiyor(""); }
  };
  const t = a.yayin.telegram, w = a.yayin.whatsapp, sk = a.yayin.slack ?? { bagli: false }, k = a.yayin.kanallar;
  const not = (tur: string) => mesaj?.tur === tur ? <p className={cn("text-[12.5px] leading-relaxed", mesaj.hata ? "text-amber-200" : "text-[#8be6ff]")}>{mesaj.metin}</p> : null;
  return (
    <>
      <section className={bolumSinif}>
        <BolumBaslik logo="/marka/telegram.svg" baslik="Telegram" sag={t.tokenSonu ? <Durum ton={t.bagli ? "iyi" : "bekliyor"} metin={t.bagli ? "Bağlı" : "Webhook bekliyor"} /> : undefined} />
        <div className="space-y-3 p-4">
          {t.tokenSonu ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 text-[13px] text-white/75">@{t.bot} · belirtecin son dört karakteri {t.tokenSonu}</span>
                <a href={`https://t.me/${t.bot}`} target="_blank" rel="noopener noreferrer" className={ikincil}><ExternalLink className="h-3.5 w-3.5" />Botu aç</a>
                <button type="button" onClick={() => islem({ tur: "telegram", islem: "kopar" })} disabled={!!gidiyor} className="inline-flex h-9 items-center rounded-full px-3 text-[12.5px] text-rose-300/90 hover:bg-rose-500/[0.1]">Bağlantıyı kopar</button>
              </div>
              {t.hata && <p className="flex items-start gap-2 rounded-[12px] bg-amber-400/[0.07] px-3 py-2 text-[12.5px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{t.hata}</p>}
            </>
          ) : (
            <>
              <p className="text-[13px] leading-relaxed text-white/60">Telegram'da @BotFather'a /newbot yaz, botuna ad ver ve verdiği belirteci buraya yapıştır. Ziyaretçiler botla yazışınca yayındaki sürüm yanıtlar.</p>
              <div className="flex gap-2"><input value={tg} onChange={(e) => setTg(e.target.value)} placeholder="123456789:AAH..." className={cn(alanSinif, "sc-kod h-10 text-[13px]")} /><button type="button" onClick={() => islem({ tur: "telegram", islem: "bagla", token: tg })} disabled={!tg.trim() || !!gidiyor} className={cn(birincil, "h-10")}>{gidiyor === "telegrambagla" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Bağla</button></div>
            </>
          )}
          {not("telegram")}
          {k.telegram && a.yayin.durum !== "yayinda" && <p className="text-[12px] text-white/40">Bot ajan yayınlandıktan sonra yanıt verir.</p>}
        </div>
      </section>
      <section className={bolumSinif}>
        <BolumBaslik logo="/marka/baglanti/slack.svg" baslik="Slack" sag={sk.tokenSonu ? <Durum ton={sk.bagli ? "iyi" : "bekliyor"} metin={sk.bagli ? "Bağlı" : "Olay bekliyor"} /> : undefined} />
        <div className="space-y-3 p-4">
          {sk.tokenSonu ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 text-[13px] text-white/75">{sk.takim} · @{sk.bot} · belirtecin son dört karakteri {sk.tokenSonu}</span>
                {sk.takimId && <a href={`https://app.slack.com/client/${sk.takimId}`} target="_blank" rel="noopener noreferrer" className={ikincil}><ExternalLink className="h-3.5 w-3.5" />Slack'te aç</a>}
                <button type="button" onClick={() => islem({ tur: "slack", islem: "kopar" })} disabled={!!gidiyor} className="inline-flex h-9 items-center rounded-full px-3 text-[12.5px] text-rose-300/90 hover:bg-rose-500/[0.1]">Bağlantıyı kopar</button>
              </div>
              <p className="text-[12.5px] leading-relaxed text-white/50">Kanalda @{sk.bot} diye bahsedilince konu içinde, özel mesajda doğrudan yanıt verir. Konuşmalar Konuşmalar sekmesinde Slack etiketiyle görünür.</p>
              {sk.hata && <p className="flex items-start gap-2 rounded-[12px] bg-amber-400/[0.07] px-3 py-2 text-[12.5px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{sk.hata}</p>}
            </>
          ) : (
            <>
              <ol className="space-y-1.5 text-[13px] leading-relaxed text-white/60">
                <li><span className="mr-1.5 tabular-nums text-white/35">1.</span>Aşağıdaki düğmeyle Slack'te uygulamayı hazır ayarlarla oluştur (olay adresi ve izinler dolu gelir), çalışma alanına yükle.</li>
                <li><span className="mr-1.5 tabular-nums text-white/35">2.</span>OAuth and Permissions sayfasındaki Bot User OAuth Token'ı (xoxb ile başlar) ve Basic Information sayfasındaki Signing Secret'ı buraya yapıştır.</li>
              </ol>
              {adr && (
                <div className="flex flex-wrap gap-2">
                  <a href={`https://api.slack.com/apps?new_app=1&manifest_json=${encodeURIComponent(adr.slackManifest)}`} target="_blank" rel="noopener noreferrer" className={birincil}><ExternalLink className="h-3.5 w-3.5" />Slack'te uygulamayı oluştur</a>
                  <button type="button" onClick={() => setManifestAcik((x) => !x)} aria-expanded={manifestAcik} className={ikincil}>{manifestAcik ? "Manifesti gizle" : "Manifesti göster"}</button>
                </div>
              )}
              {adr && manifestAcik && <div className="space-y-2"><div><p className="mb-1 text-[12px] text-white/45">Olay adresi (Request URL)</p><KodKutusu kod={adr.slackAdres} /></div><div><p className="mb-1 text-[12px] text-white/45">Uygulama manifesti (JSON)</p><KodKutusu kod={adr.slackManifest} /></div></div>}
              {adr?.yerel && <p className="text-[12px] leading-relaxed text-amber-200/90">Bu adres yerel; Slack yalnız herkese açık HTTPS adreslere olay gönderir. Site yayındaki adresinde çalışınca bu adres kendiliğinden ona döner.</p>}
              <div className="space-y-2">
                <input value={sl.token} onChange={(e) => setSl({ ...sl, token: e.target.value })} placeholder="Bot belirteci (xoxb-...)" autoComplete="off" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />
                <div className="flex gap-2"><input value={sl.imza} onChange={(e) => setSl({ ...sl, imza: e.target.value })} placeholder="İmza anahtarı (Signing Secret)" type="password" autoComplete="off" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} /><button type="button" onClick={() => islem({ tur: "slack", islem: "bagla", ...sl })} disabled={!sl.token.trim() || !sl.imza.trim() || !!gidiyor} className={cn(birincil, "h-10")}>{gidiyor === "slackbagla" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Bağla</button></div>
              </div>
            </>
          )}
          {not("slack")}
          {k.slack && a.yayin.durum !== "yayinda" && <p className="text-[12px] text-white/40">Slack botu ajan yayınlandıktan sonra yanıt verir.</p>}
        </div>
      </section>
      <section className={bolumSinif}>
        <BolumBaslik logo="/marka/whatsapp.svg" baslik="WhatsApp" sag={w.tokenSonu ? <Durum ton={w.dogrulandi ? "iyi" : "bekliyor"} metin={w.dogrulandi ? "Numara doğrulandı" : "Doğrulanmadı"} /> : <Durum ton="bekliyor" metin="Meta anahtarları gerekiyor" />} />
        <div className="space-y-3 p-4">
          <p className="text-[13px] leading-relaxed text-white/60">WhatsApp Cloud API ile çalışır. Meta for Developers'ta bir uygulama aç, WhatsApp ürününü ekle; API Setup'taki telefon numarası kimliğini ve kalıcı erişim belirtecini (sistem kullanıcısı) buraya gir. Sonra Configuration'da webhook adresini ve doğrulama belirtecini yapıştırıp messages alanına abone ol.</p>
          {adr && (
            <div className="space-y-2">
              <div><p className="mb-1 text-[12px] text-white/45">Webhook adresi (Callback URL)</p><KodKutusu kod={adr.whatsappAdres} /></div>
              <div><p className="mb-1 text-[12px] text-white/45">Doğrulama belirteci (Verify token)</p><KodKutusu kod={adr.dogrulama} /></div>
              {adr.yerel && <p className="text-[12px] leading-relaxed text-amber-200/90">Bu adres yerel; Meta yalnız herkese açık HTTPS adreslere olay gönderir. Site yayındaki adresinde çalışınca bu adres kendiliğinden ona döner.</p>}
            </div>
          )}
          {w.tokenSonu ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 text-[13px] text-white/75">Numara kimliği {w.telefonId} · belirtecin son dört karakteri {w.tokenSonu}{w.uygulama ? " · imza denetimi açık" : ""}</span>
              <button type="button" onClick={() => islem({ tur: "whatsapp", islem: "kopar" })} disabled={!!gidiyor} className="inline-flex h-9 items-center rounded-full px-3 text-[12.5px] text-rose-300/90 hover:bg-rose-500/[0.1]">Bağlantıyı kopar</button>
            </div>
          ) : (
            <div className="space-y-2">
              <input value={wa.token} onChange={(e) => setWa({ ...wa, token: e.target.value })} placeholder="Erişim belirteci (EAAG...)" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={wa.telefonId} onChange={(e) => setWa({ ...wa, telefonId: e.target.value })} placeholder="Telefon numarası kimliği" className={cn(alanSinif, "h-10 text-[13px]")} />
                <input value={wa.uygulamaGizli} onChange={(e) => setWa({ ...wa, uygulamaGizli: e.target.value })} placeholder="Uygulama gizli anahtarı (isteğe bağlı)" className={cn(alanSinif, "h-10 text-[13px]")} />
              </div>
              <div className="flex justify-end"><button type="button" onClick={() => islem({ tur: "whatsapp", islem: "kaydet", ...wa })} disabled={!wa.token.trim() || !wa.telefonId.trim() || !!gidiyor} className={birincil}>{gidiyor === "whatsappkaydet" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaydet ve doğrula</button></div>
            </div>
          )}
          {w.hata && w.tokenSonu && <p className="text-[12.5px] text-amber-200/90">{w.hata}</p>}
          {not("whatsapp")}
        </div>
      </section>
      <EkKanallar a={a} setA={setA} adr={adr} />
      <YeniKanallar a={a} setA={setA} adr={adr} />
    </>
  );
}

export { Code2 };
