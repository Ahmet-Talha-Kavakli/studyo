"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Download, ExternalLink, Fingerprint, KeyRound, Loader2, MessagesSquare } from "lucide-react";
import { api, ApiHatasi, sahipAnahtari } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { AcilirSecim, Anahtar, KodKutusu, alanSinif } from "./AjanDuzenleyici";
import { BolumBaslik, bolumSinif } from "./Kanallar";
import { TON_SINIF, birincil, ikincil, type Ajan } from "./ortak";
import type { SiteProje } from "./IsletmeKarti";

export type YeniAdresler = { discordAdres: string; teamsAdres: string; lineAdres: string; yerel: boolean };
function Durum({ ton, metin }: { ton: keyof typeof TON_SINIF; metin: string }) { return <span className={cn("rounded-full px-2.5 py-0.5 text-[11.5px] font-medium", TON_SINIF[ton])}>{metin}</span>; }
const Uyari = ({ metin }: { metin: string }) => <p className="flex items-start gap-2 rounded-[12px] bg-amber-400/[0.07] px-3 py-2 text-[12.5px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{metin}</p>;
const Adim = ({ n, children }: { n: number; children: React.ReactNode }) => <li className="flex gap-2"><span className="tabular-nums text-white/35">{n}.</span><span className="min-w-0 flex-1">{children}</span></li>;
const kopar = "inline-flex h-9 items-center rounded-full px-3 text-[12.5px] text-rose-300/90 hover:bg-rose-500/[0.1]";
const zaman = (t?: number) => (t ? new Date(t).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");

/** Discord, Microsoft Teams, LINE, Vayra İşletme site sohbeti ve web kutusunda kimlik doğrulama. */
export function YeniKanallar({ a, setA, adr }: { a: Ajan; setA: (a: Ajan) => void; adr: YeniAdresler | null }) {
  const [gidiyor, setGidiyor] = useState("");
  const [mesaj, setMesaj] = useState<{ tur: string; metin: string; hata?: boolean } | null>(null);
  const [dc, setDc] = useState({ token: "", uygulama: a.yayin.discord.uygulama ?? "", anahtar: a.yayin.discord.anahtar ?? "" });
  const [ms, setMs] = useState({ uygulama: a.yayin.teams.uygulama ?? "", sifre: "", kiraciTur: a.yayin.teams.tur ?? "cok", kiraci: a.yayin.teams.kiraci ?? "" });
  const [ln, setLn] = useState({ token: "", gizli: "" });
  const [kimlikAnahtar, setKimlikAnahtar] = useState<string | null>(null);
  const [projeler, setProjeler] = useState<SiteProje[] | null>(null);
  const islem = async (g: Record<string, unknown>) => {
    setGidiyor(`${g.tur}${g.islem}`); setMesaj(null);
    try {
      const v = await api<{ ajan?: Ajan; uyari?: string; anahtar?: string; projeler?: SiteProje[] }>(`/api/build/ajanlar/${a.id}/kanallar`, { govde: g });
      if (v.ajan) setA(v.ajan);
      if (v.anahtar) setKimlikAnahtar(v.anahtar);
      if (v.projeler) setProjeler(v.projeler);
      if (v.uyari) setMesaj({ tur: String(g.tur), metin: v.uyari, hata: true });
      else if (g.islem !== "projeler") setMesaj({ tur: String(g.tur), metin: g.islem === "kopar" ? "Bağlantı koparıldı." : "Kaydedildi ve doğrulandı." });
      if (g.tur === "discord") setDc((x) => ({ ...x, token: "" }));
      if (g.tur === "teams") setMs((x) => ({ ...x, sifre: "" }));
      if (g.tur === "line") setLn({ token: "", gizli: "" });
    } catch (e) { setMesaj({ tur: String(g.tur), metin: e instanceof ApiHatasi ? e.message : "Yapılamadı.", hata: true }); }
    finally { setGidiyor(""); }
  };
  useEffect(() => { api<{ projeler: SiteProje[] }>(`/api/build/ajanlar/${a.id}/kanallar`, { govde: { tur: "site", islem: "projeler" } }).then((v) => setProjeler(v.projeler)).catch(() => setProjeler([])); }, [a.id]);
  const not = (tur: string) => mesaj?.tur === tur ? <p className={cn("text-[12.5px] leading-relaxed", mesaj.hata ? "text-amber-200" : "text-[#8be6ff]")}>{mesaj.metin}</p> : null;
  const k = a.yayin.kanallar, d = a.yayin.discord, t = a.yayin.teams, l = a.yayin.line;
  const kanal = async (p: Partial<typeof k>) => { const v = await api<{ ajan: Ajan }>(`/api/build/ajanlar/${a.id}`, { method: "PATCH", govde: { yayin: { kanallar: { ...k, ...p } } } }).catch(() => null); if (v?.ajan) setA(v.ajan); };
  const yerelNot = adr?.yerel ? <p className="text-[12px] leading-relaxed text-amber-200/90">Bu adres yerel; servisler yalnız herkese açık HTTPS adreslere istek gönderir. Site yayındaki adresinde çalışınca adres kendiliğinden ona döner.</p> : null;
  return (
    <>
      {/* Discord */}
      <section className={bolumSinif}>
        <BolumBaslik logo="/marka/renkli/discord.svg" baslik="Discord" sag={<>{d.tokenSonu ? <Durum ton={d.hata ? "bekliyor" : "iyi"} metin={d.hata ? "Doğrulanmadı" : d.bot ?? "Bağlı"} /> : null}{d.tokenSonu && <Anahtar acik={k.discord} set={(v) => kanal({ discord: v })} etiket="Discord" />}</>} />
        <div className="space-y-3 p-4">
          <p className="text-[13px] leading-relaxed text-white/60">Sunucunda ya da özel mesajda /sor komutuyla, ya da bir mesaja sağ tıklayıp Uygulamalar menüsündeki Ajana sor ile ajana sorulur. İstekler Discord'un Ed25519 imzasıyla doğrulanır.</p>
          <ol className="space-y-1.5 text-[12.5px] leading-relaxed text-white/60">
            <Adim n={1}>Discord Developer Portal'da New Application ile uygulama aç; General Information'daki Application ID ve Public Key'i kopyala.</Adim>
            <Adim n={2}>Bot sekmesinde Reset Token ile bot belirtecini al ve aşağıya yapıştır; komutlar ve etkileşim adresi kendiliğinden kurulur.</Adim>
            <Adim n={3}>Installation sekmesindeki bağlantıyla botu sunucuna ekle (applications.commands ve bot izinleri).</Adim>
          </ol>
          {adr && <div><p className="mb-1 text-[12px] text-white/45">Etkileşim adresi (Interactions Endpoint URL)</p><KodKutusu kod={adr.discordAdres} /></div>}
          {yerelNot}
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={dc.uygulama} onChange={(e) => setDc({ ...dc, uygulama: e.target.value })} placeholder="Application ID" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />
            <input value={dc.anahtar} onChange={(e) => setDc({ ...dc, anahtar: e.target.value })} placeholder="Public Key" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />
          </div>
          <div className="flex gap-2"><input value={dc.token} onChange={(e) => setDc({ ...dc, token: e.target.value })} type="password" autoComplete="off" placeholder={d.tokenSonu ? `Bot belirteci kayıtlı, son dört karakteri ${d.tokenSonu}` : "Bot belirteci"} className={cn(alanSinif, "sc-kod h-10 text-[13px]")} /><button type="button" onClick={() => islem({ tur: "discord", islem: "kaydet", ...dc })} disabled={!!gidiyor || (!dc.token.trim() && !d.tokenSonu)} className={cn(birincil, "h-10")}>{gidiyor === "discordkaydet" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{d.tokenSonu ? "Kaydet" : "Bağla"}</button></div>
          {d.tokenSonu && <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-white/50"><span className="flex-1">{d.komut ? "Komutlar kayıtlı." : "Komutlar henüz kaydedilmedi."}{d.sonOlay ? ` Son etkileşim ${zaman(d.sonOlay)}.` : ""}</span>{d.uygulama && <a href={`https://discord.com/oauth2/authorize?client_id=${d.uygulama}&scope=bot+applications.commands&permissions=2048`} target="_blank" rel="noopener noreferrer" className={ikincil}><ExternalLink className="h-3.5 w-3.5" />Sunucuya ekle</a>}<button type="button" onClick={() => islem({ tur: "discord", islem: "kopar" })} disabled={!!gidiyor} className={kopar}>Bağlantıyı kopar</button></div>}
          {d.hata && <Uyari metin={d.hata} />}
          {not("discord")}
        </div>
      </section>

      {/* Microsoft Teams */}
      <section className={bolumSinif}>
        <BolumBaslik logo="/marka/renkli/microsoft-teams.svg" baslik="Microsoft Teams" sag={<>{t.sifreSonu ? <Durum ton={t.dogrulandi ? "iyi" : "bekliyor"} metin={t.dogrulandi ? "İleti alındı" : "İlk ileti bekleniyor"} /> : null}{t.sifreSonu && <Anahtar acik={k.teams} set={(v) => kanal({ teams: v })} etiket="Teams" />}</>} />
        <div className="space-y-3 p-4">
          <p className="text-[13px] leading-relaxed text-white/60">Teams'te birebir sohbette ya da kanalda bahsedilince yanıt verir. Her ileti Bot Framework'ün imzalı belirteciyle doğrulanır.</p>
          <ol className="space-y-1.5 text-[12.5px] leading-relaxed text-white/60">
            <Adim n={1}>Azure portalında Azure Bot kaynağı oluştur; Configuration'da Messaging endpoint olarak aşağıdaki adresi gir, Channels'tan Microsoft Teams'i aç.</Adim>
            <Adim n={2}>Microsoft App ID'yi ve Manage Password ile oluşturduğun istemci gizli anahtarını buraya yaz.</Adim>
            <Adim n={3}>Uygulama paketini indir; Teams'te Uygulamalar, Uygulamaları yönet, Uygulama yükle adımlarıyla ekle.</Adim>
          </ol>
          {adr && <div><p className="mb-1 text-[12px] text-white/45">Mesajlaşma adresi (Messaging endpoint)</p><KodKutusu kod={adr.teamsAdres} /></div>}
          {yerelNot}
          <input value={ms.uygulama} onChange={(e) => setMs({ ...ms, uygulama: e.target.value })} placeholder="Microsoft App ID (xxxxxxxx-xxxx-...)" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />
          <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
            <AcilirSecim deger={ms.kiraciTur} set={(v) => setMs({ ...ms, kiraciTur: v as "cok" | "tek" })} l={[{ id: "cok", ad: "Çok kiracılı", alt: "Varsayılan Azure Bot" }, { id: "tek", ad: "Tek kiracılı", alt: "Kiracı kimliği gerekir" }]} />
            {ms.kiraciTur === "tek" ? <input value={ms.kiraci} onChange={(e) => setMs({ ...ms, kiraci: e.target.value })} placeholder="Tenant ID" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} /> : <span className="flex items-center text-[12px] text-white/40">Kiracı kimliği gerekmez.</span>}
          </div>
          <div className="flex gap-2"><input value={ms.sifre} onChange={(e) => setMs({ ...ms, sifre: e.target.value })} type="password" autoComplete="off" placeholder={t.sifreSonu ? `Gizli anahtar kayıtlı, son dört karakteri ${t.sifreSonu}` : "İstemci gizli anahtarı (Client secret)"} className={cn(alanSinif, "sc-kod h-10 text-[13px]")} /><button type="button" onClick={() => islem({ tur: "teams", islem: "kaydet", ...ms })} disabled={!!gidiyor || !ms.uygulama.trim() || (!ms.sifre.trim() && !t.sifreSonu)} className={cn(birincil, "h-10")}>{gidiyor === "teamskaydet" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{t.sifreSonu ? "Kaydet" : "Bağla"}</button></div>
          {t.uygulama && <div className="flex flex-wrap items-center gap-2"><a href={`/api/build/ajanlar/${a.id}/kanallar?paket=teams`} onClick={async (e) => { e.preventDefault(); const r = await fetch(`/api/build/ajanlar/${a.id}/kanallar?paket=teams`, { headers: { "x-build-sahip": sahipAnahtari() } }); if (!r.ok) return; const u = URL.createObjectURL(await r.blob()); const x = document.createElement("a"); x.href = u; x.download = `vayra-teams-${a.id}.zip`; x.click(); URL.revokeObjectURL(u); }} className={ikincil}><Download className="h-3.5 w-3.5" />Uygulama paketini indir</a><span className="flex-1 text-[12px] text-white/40">{t.sonOlay ? `Son ileti ${zaman(t.sonOlay)}` : ""}</span><button type="button" onClick={() => islem({ tur: "teams", islem: "kopar" })} disabled={!!gidiyor} className={kopar}>Bağlantıyı kopar</button></div>}
          {t.hata && <Uyari metin={t.hata} />}
          {not("teams")}
        </div>
      </section>

      {/* LINE */}
      <section className={bolumSinif}>
        <BolumBaslik logo="/marka/renkli/line.svg" baslik="LINE" sag={<>{l.tokenSonu ? <Durum ton={l.hata ? "bekliyor" : "iyi"} metin={l.hata ? "Doğrulanmadı" : l.bot ?? "Bağlı"} /> : null}{l.tokenSonu && <Anahtar acik={k.line} set={(v) => kanal({ line: v })} etiket="LINE" />}</>} />
        <div className="space-y-3 p-4">
          <p className="text-[13px] leading-relaxed text-white/60">LINE resmî hesabına gelen mesajları yanıtlar. Önce ücretsiz yanıt belirteci kullanılır; süre geçtiyse ya da temsilci yazıyorsa push mesajı gider (aylık kotadan düşer).</p>
          <ol className="space-y-1.5 text-[12.5px] leading-relaxed text-white/60">
            <Adim n={1}>LINE Developers Console'da Messaging API kanalı aç; Basic settings'teki Channel secret'ı kopyala.</Adim>
            <Adim n={2}>Messaging API sekmesinde uzun ömürlü Channel access token üret; ikisini yapıştır. Webhook adresi kendiliğinden yazılır ve denenir.</Adim>
            <Adim n={3}>LINE Official Account Manager'da otomatik yanıtları kapat, Use webhook seçeneğini aç.</Adim>
          </ol>
          {adr && <div><p className="mb-1 text-[12px] text-white/45">Webhook adresi</p><KodKutusu kod={adr.lineAdres} /></div>}
          {yerelNot}
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={ln.gizli} onChange={(e) => setLn({ ...ln, gizli: e.target.value })} type="password" autoComplete="off" placeholder={l.gizli ? "Channel secret kayıtlı" : "Channel secret"} className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />
            <input value={ln.token} onChange={(e) => setLn({ ...ln, token: e.target.value })} type="password" autoComplete="off" placeholder={l.tokenSonu ? `Belirteç kayıtlı, son dört karakteri ${l.tokenSonu}` : "Channel access token"} className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />
          </div>
          <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => islem({ tur: "line", islem: "kaydet", ...ln })} disabled={!!gidiyor || (!ln.token.trim() && !l.tokenSonu)} className={birincil}>{gidiyor === "linekaydet" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{l.tokenSonu ? "Kaydet" : "Bağla"}</button>{l.basicId && <a href={`https://line.me/R/ti/p/${encodeURIComponent(l.basicId)}`} target="_blank" rel="noopener noreferrer" className={ikincil}><ExternalLink className="h-3.5 w-3.5" />Hesabı aç</a>}<span className="flex-1" />{l.tokenSonu && <button type="button" onClick={() => islem({ tur: "line", islem: "kopar" })} disabled={!!gidiyor} className={kopar}>Bağlantıyı kopar</button>}</div>
          {l.hata && <Uyari metin={l.hata} />}
          {not("line")}
        </div>
      </section>

      {/* Site canlı sohbeti */}
      <section className={bolumSinif}>
        <BolumBaslik ikon={MessagesSquare} baslik="Site canlı sohbeti" sag={(a.yayin.siteSohbet?.projeler.length ?? 0) > 0 ? <Durum ton="iyi" metin={`${a.yayin.siteSohbet!.projeler.length} sitede`} /> : undefined} />
        <div className="space-y-3 p-4">
          <p className="text-[13px] leading-relaxed text-white/60">Vayra İşletme sitelerinin canlı sohbet eklentisine ilk yanıtı bu ajan verir. Ajan devrederse konuşma gelen kutusuna düşer; temsilci yanıtı siteye gider. İşletme panelinden kendin yazarsan ajan o sohbette 30 dakika susar.</p>
          {projeler === null ? <div className="h-16 animate-pulse rounded-[14px] bg-white/[0.03]" /> : projeler.length ? (
            <div className="divide-y divide-white/[0.05] rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
              {projeler.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.kapak ? <img src={p.kapak} alt="" className="h-9 w-12 shrink-0 rounded-[8px] object-cover" /> : <span className="h-9 w-12 shrink-0 rounded-[8px] bg-white/[0.06]" />}
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{p.ad}</span><span className="block truncate text-[11.5px] text-white/45">{p.baskaAjan ? "Başka bir ajana bağlı" : p.sohbetAcik ? `Canlı sohbet açık · ${p.sohbet} sohbet` : "Canlı sohbet eklentisi kapalı"}</span></span>
                  <Anahtar acik={p.bagli} set={(v) => islem({ tur: "site", islem: v ? "bagla" : "kopar", proje: p.id })} etiket={`${p.ad} canlı sohbeti`} />
                </div>
              ))}
            </div>
          ) : <p className="text-[12.5px] text-white/50">Henüz bir Build projen yok.</p>}
          {not("site")}
        </div>
      </section>

      {/* Kimlik doğrulama */}
      <section className={bolumSinif}>
        <BolumBaslik ikon={Fingerprint} baslik="Kutuda kimlik doğrulama" sag={a.yayin.kimlik?.anahtarSonu ? <Durum ton="iyi" metin="Açık" /> : undefined} />
        <div className="space-y-3 p-4">
          <p className="text-[13px] leading-relaxed text-white/60">Sitene giriş yapmış kullanıcıyı ajana güvenle tanıt: sunucun e-postayı bu anahtarla imzalar. Doğrulanmış e-posta kanallar arası kişi kaydına bağlanır; aynı müşteri e-postada, WhatsApp'ta ve kutuda tek kişi olur.</p>
          {kimlikAnahtar ? <div className="space-y-1.5"><p className="text-[12.5px] font-medium text-amber-200">Anahtar yalnız şimdi görünür; sunucuna kaydet, sayfaya koyma.</p><KodKutusu kod={kimlikAnahtar} /></div> : (
            <div className="flex flex-wrap items-center gap-2"><span className="flex-1 text-[12.5px] text-white/50">{a.yayin.kimlik?.anahtarSonu ? `Anahtarın son dört karakteri ${a.yayin.kimlik.anahtarSonu}` : "Henüz anahtar yok"}</span><button type="button" onClick={() => islem({ tur: "kimlik", islem: "anahtar" })} disabled={!!gidiyor} className={ikincil}><KeyRound className="h-3.5 w-3.5" />{a.yayin.kimlik?.anahtarSonu ? "Yeni anahtar" : "Anahtar oluştur"}</button>{a.yayin.kimlik?.anahtarSonu && <button type="button" onClick={() => islem({ tur: "kimlik", islem: "kaldir" })} className={kopar}>Kaldır</button>}</div>
          )}
          {a.yayin.kimlik?.anahtarSonu && <div className="flex items-center gap-3 rounded-[14px] bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.06]"><span className="min-w-0 flex-1"><span className="block text-[13px] text-white">Yalnız giriş yapmış kullanıcılar</span><span className="block text-[12px] text-white/45">İmzasız ziyaretçi kutuda yazamaz.</span></span><Anahtar acik={!!a.yayin.kimlik.zorunlu} set={(v) => islem({ tur: "kimlik", islem: "zorunlu", zorunlu: v })} etiket="Zorunlu kimlik" /></div>}
          <KodKutusu kod={`// Sunucunda (Node.js)\nconst imza = crypto.createHmac("sha256", process.env.VAYRA_KIMLIK_ANAHTARI).update(kullanici.eposta.toLowerCase()).digest("hex");\n\n<!-- Sayfada, ajan-kutusu.js'ten önce -->\n<script>window.VayraAjan = { eposta: "<%= eposta %>", ad: "<%= ad %>", imza: "<%= imza %>" };</script>`} />
          {not("kimlik")}
        </div>
      </section>
    </>
  );
}
