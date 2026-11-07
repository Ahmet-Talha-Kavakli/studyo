"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, ChevronRight, Copy, FlaskConical, GitCompare, Info, Loader2, Pin, PinOff, Play, Plus, Radio, RefreshCw, Rocket, RotateCcw, Rss, Tag, X } from "lucide-react";
import { AcilirSecim, Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { ModelSecici } from "@/components/build/ModelSecici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { ODEME_DURUMLARI, TETIK_TURLERI, VERI_OLAYLARI, surumFarki, type Adim, type FarkSatiri, type GirdiAlani, type Tetikleyici, type TetikTuru } from "@/lib/build/sistemKatalog";
import { cn } from "@/lib/utils";
import { Alan, TabloSecici, type Kaynaklar } from "./AdimAyari";
import { GirdiAlanlariDuzenleyici } from "./GirdiAlanlari";
import { ADIM_DURUM, ADIM_IKON, CALISMA_SINIF, JsonGorunum, Segment, TETIK_ADI, TETIK_IKON, YanPanel, sureYaz, tarihSaat, useKopya, type AdimSonucu, type CalismaOzeti, type SistemAcik, type Surum } from "./ortak";
import { ZamanlamaAyari } from "./Zamanlama";
import { FormSayfasiAyari, SohbetAyari } from "./GenelTetikler";
import { SurumKarsilastir } from "./SurumKarsilastir";
import { IsletmeTetikAyari, KancaImzaAyari, ServisTetikAyari } from "./TetikServis";

/* ───── Tetik ayarı ───── */
const EPOSTA_ALAN = process.env.NEXT_PUBLIC_BUILD_EPOSTA_ALAN || "gelen.vayra.app";
type RssOnizleme = { baslik: string; ogeler: Record<string, unknown>[]; toplam: number };
function Kopyalanir({ deger, ad, kopya, kopyala, gizli }: { deger: string; ad: string; kopya: string; kopyala: (v: string, ad: string) => void; gizli?: string }) {
  return <div className="flex items-center gap-2"><span className="sc-kod min-w-0 flex-1 truncate rounded-[10px] bg-black/30 px-2.5 py-2 text-[11.5px] text-white/80">{gizli ?? deger}</span><button type="button" onClick={() => kopyala(deger, ad)} aria-label="Kopyala" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/80 hover:bg-white/[0.14]">{kopya === ad ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button></div>;
}
export function TetikAyari({ t, set, k, s, webhookAdres, webhookYenile, epostaYenile, setGirdi, dinle, dinlemeKalan, testVerisi, genelYenile, hazirAkis }: {
  t: Tetikleyici; set: (t: Tetikleyici) => void; k: Kaynaklar; s: SistemAcik; webhookAdres: string | null; webhookYenile: () => void; epostaYenile: () => void;
  setGirdi: (l: GirdiAlani[]) => void; dinle: () => void; dinlemeKalan: number | null; testVerisi: (v: unknown) => void;
  genelYenile?: (tur: "form" | "sohbet") => void; hazirAkis?: () => void;
}) {
  const turDegistir = (tur: TetikTuru) => set(tur === "zaman" ? { id: t.id, tur, zaman: { siklik: "gunluk", saat: "09:00" } } : tur === "form" ? { id: t.id, tur, projeId: "" } : tur === "veri" ? { id: t.id, tur, projeId: "", koleksiyon: "", olaylar: ["ekle"] } : tur === "sistem" ? { id: t.id, tur, sistemId: "" } : tur === "rss" ? { id: t.id, tur, adres: "", aralik: 15 } : tur === "eposta" ? { id: t.id, tur } : tur === "odeme" ? { id: t.id, tur, projeId: "", durumlar: ["odendi"] } : tur === "formSayfasi" ? { id: t.id, tur, bitis: "mesaj" } : tur === "sohbet" ? { id: t.id, tur, gecmis: 10 } : tur === "servis" ? { id: t.id, tur, servis: "", olay: "", ayar: {}, aralik: 5 } : tur === "isletme" ? { id: t.id, tur, projeId: "", olay: "siparis" } : { id: t.id, tur: "elle" } as Tetikleyici);
  const { kopya, kopyala } = useKopya();
  const [kanca, setKanca] = useState<"test" | "canli">("test");
  const [rss, setRss] = useState<RssOnizleme | null>(null);
  const [rssGidiyor, setRssGidiyor] = useState(false);
  const [rssHata, setRssHata] = useState("");
  const [rssAralikOzel, setRssAralikOzel] = useState(t.tur === "rss" && ![5, 15, 30, 60, 180].includes(t.aralik));
  const koken = typeof location !== "undefined" ? location.origin : "";
  const rssOku = async (adres: string) => {
    setRssGidiyor(true); setRssHata("");
    try { setRss(await api<RssOnizleme>(`/api/build/sistemler/${s.id}/rss`, { govde: { adres } })); } catch (e) { setRss(null); setRssHata(e instanceof ApiHatasi ? e.message : "Akış okunamadı."); } finally { setRssGidiyor(false); }
  };
  const rssDurum = t.tur === "rss" ? s.rss?.[t.id] : undefined;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {TETIK_TURLERI.map((x) => { const I = TETIK_IKON[x.tur]; return (
          <button key={x.tur} type="button" onClick={() => x.tur !== t.tur && turDegistir(x.tur)} className={cn("flex items-start gap-2.5 rounded-[14px] p-2.5 text-left ring-1 ring-inset transition", t.tur === x.tur ? "bg-white/[0.08] ring-2 ring-white" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06]")}>
            <I className="mt-0.5 h-4 w-4 shrink-0 text-white/75" /><span className="min-w-0"><span className="block text-[13px] font-medium text-white">{x.ad}</span><span className="block text-[11.5px] leading-snug text-white/45">{x.alt}</span></span>
          </button>
        ); })}
      </div>
      {t.tur === "formSayfasi" && <FormSayfasiAyari t={t} set={set} s={s} setGirdi={setGirdi} yenile={() => genelYenile?.("form")} />}
      {t.tur === "sohbet" && <SohbetAyari t={t} set={set} s={s} yenile={() => genelYenile?.("sohbet")} hazirAkis={hazirAkis} />}
      {t.tur === "servis" && <ServisTetikAyari t={t} set={set} s={s} testVerisi={testVerisi} />}
      {t.tur === "isletme" && <IsletmeTetikAyari t={t} set={set} s={s} projeler={k.projeler} testVerisi={testVerisi} />}
      {t.tur === "zaman" && <ZamanlamaAyari z={t.zaman} set={(p) => set({ ...t, zaman: { ...t.zaman, ...p } })} />}
      {t.tur === "webhook" && (
        <div className="space-y-3 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
          <Segment id="kanca-adres" kucuk deger={kanca} set={setKanca} l={[{ id: "test", ad: "Test adresi" }, { id: "canli", ad: "Canlı adres" }]} />
          {kanca === "test" ? (<>
            {s.testAnahtari ? <Kopyalanir deger={`${koken}/api/build/sistemler/test-kanca/${s.id}/${s.testAnahtari}`} ad="test" kopya={kopya} kopyala={kopyala} /> : <p className="text-[12.5px] text-white/55">Kaydedince test adresi oluşur.</p>}
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={dinle} disabled={!s.testAnahtari} className={cn("inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold disabled:opacity-40", dinlemeKalan !== null ? "bg-[#55d6fd]/[0.14] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/30" : "bg-white text-black")}>
                {dinlemeKalan !== null ? <><Radio className="h-3.5 w-3.5 animate-pulse" />Dinleniyor, {Math.floor(dinlemeKalan / 60)}:{String(dinlemeKalan % 60).padStart(2, "0")}</> : <><Radio className="h-3.5 w-3.5" />Test olayını dinle</>}
              </button>
              {dinlemeKalan !== null && <span className="text-[12px] text-white/50">Şimdi test adresine bir istek gönder</span>}
            </div>
            <p className="text-[12px] leading-relaxed text-white/45">Test adresi yalnız dinleme açıkken (3 dakika) kabul eder ve hiçbir akışı çalıştırmaz: gelen istek deneme verisi olur, Test sekmesine ve veri seçiciye düşer. Kurulum bitince servise canlı adresi gir.</p>
          </>) : (<>
            {webhookAdres ? (<>
              <p className="text-[12.5px] font-medium text-amber-200">Adres yalnız şimdi tam görünür; kopyala ve sakla.</p>
              <Kopyalanir deger={webhookAdres} ad="adres" kopya={kopya} kopyala={kopyala} />
            </>) : <p className="text-[12.5px] text-white/55">{t.anahtarSonu ? `Canlı adres oluşturuldu, sonu ${t.anahtarSonu}. Adresi kaybettiysen yenisini oluştur; eskisi çalışmaz.` : "Kaydedince canlı adres oluşur."}</p>}
            <p className="text-[12px] leading-relaxed text-white/45">Canlı adrese POST ile JSON ya da form gönder. Sistem açıkken yayındaki sürüm çalışır; kapalıyken istek çalıştırılmaz, deneme verisi olarak saklanır.</p>
            <button type="button" onClick={webhookYenile} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><RefreshCw className="h-3.5 w-3.5" />Yeni canlı adres oluştur</button>
            <KancaImzaAyari t={t} set={set} />
            <Alan etiket="Yanıt metni (isteğe bağlı)" ipucu="Boşsa JSON döner. PayTR gibi belirli bir yanıt bekleyen servisler için yaz, ör. OK."><input value={t.yanit ?? ""} onChange={(e) => set({ ...t, yanit: e.target.value || undefined })} maxLength={2000} placeholder="OK" className={cn(alanSinif, "h-10")} /></Alan>
            <Alan etiket="Doğrulama belirteci (isteğe bağlı)" ipucu="WhatsApp Cloud API gibi servisler adresi kaydederken GET ile doğrular; Meta panelindeki doğrulama belirtecine bunu yaz.">
              <div className="flex gap-2"><input value={t.dogrulama ?? ""} onChange={(e) => set({ ...t, dogrulama: e.target.value.replace(/[^\w.-]/g, "") || undefined })} maxLength={80} placeholder="Boş bırakabilirsin" className={cn(alanSinif, "sc-kod h-10 flex-1 text-[13px]")} />{t.dogrulama && <button type="button" onClick={() => kopyala(t.dogrulama!, "belirtec")} aria-label="Belirteci kopyala" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/80">{kopya === "belirtec" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>}</div>
            </Alan>
          </>)}
        </div>
      )}
      {(t.tur === "form" || t.tur === "veri") && (
        <div className="space-y-3">
          <Alan etiket="Build projesi" ipucu={t.tur === "form" ? "Projendeki sitede herhangi bir form gönderilince çalışır." : undefined}><AcilirSecim deger={t.projeId} set={(v) => set({ ...t, projeId: v })} l={k.projeler} bos="Proje seç" /></Alan>
          {t.tur === "veri" && (<>
            <Alan etiket="Tablo"><TabloSecici projeId={t.projeId} deger={t.koleksiyon} set={(v) => set({ ...t, koleksiyon: v })} /></Alan>
            <Alan etiket="Ne olunca" ipucu="Birden çok olay seçebilirsin; tetik verisinde olay alanı hangisi olduğunu söyler. Güncellemede önceki hali onceki alanında gelir.">
              <div className="grid grid-cols-3 gap-1.5">{VERI_OLAYLARI.map((o) => { const l = t.olaylar?.length ? t.olaylar : ["ekle" as const]; const on = l.includes(o.id); return (
                <button key={o.id} type="button" aria-pressed={on} onClick={() => { const x = new Set(l); if (on) x.delete(o.id); else x.add(o.id); if (x.size) set({ ...t, olaylar: [...x] }); }} className={cn("rounded-[12px] px-2.5 py-2 text-left transition", on ? "bg-white/[0.08] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}>
                  <span className="block text-[12.5px] font-medium text-white">{o.ad}</span><span className="block text-[11px] leading-snug text-white/45">{o.alt}</span>
                </button>
              ); })}</div>
            </Alan>
            <p className="rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 text-[12px] leading-relaxed text-white/50 ring-1 ring-inset ring-white/[0.06]">Ekleme, güncelleme ve silme sitenden, panelden ve sistem adımlarından gelir. Test ortamındaki değişiklikler ve tabloyu toptan boşaltma tetiklemez.</p>
          </>)}
        </div>
      )}
      {t.tur === "sistem" && <Alan etiket="Hangi sistem bitince" ipucu="O sistem başarıyla bitince bu sistem çalışır; son adımın çıktısı Tetik altında gelir."><AcilirSecim deger={t.sistemId} set={(v) => set({ ...t, sistemId: v })} l={k.sistemler} bos="Sistem seç" /></Alan>}
      {t.tur === "rss" && (
        <div className="space-y-3 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
          <Alan etiket="Akış adresi" ipucu="RSS ya da Atom. İlk okumada var olan öğeler işaretlenir; sistem yalnız sonradan çıkan yeni öğeler için çalışır.">
            <div className="flex gap-2"><input value={t.adres} onChange={(e) => set({ ...t, adres: e.target.value.trim() })} placeholder="https://site.com/feed" inputMode="url" className={cn(alanSinif, "cam-istemci h-10 min-w-0 flex-1 text-[13px]")} /><button type="button" onClick={() => rssOku(t.adres)} disabled={!t.adres || rssGidiyor} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13] disabled:opacity-40">{rssGidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rss className="h-3.5 w-3.5" />}Şimdi oku</button></div>
          </Alan>
          <Alan etiket="Ne sıklıkla yoklansın">
            <div className="flex gap-2">
              <div className="min-w-0 flex-1"><AcilirSecim deger={rssAralikOzel ? "ozel" : String(t.aralik)} set={(v) => { if (v === "ozel") { setRssAralikOzel(true); return; } setRssAralikOzel(false); set({ ...t, aralik: Number(v) }); }} l={[{ id: "5", ad: "5 dakikada bir" }, { id: "15", ad: "15 dakikada bir" }, { id: "30", ad: "30 dakikada bir" }, { id: "60", ad: "Saatte bir" }, { id: "180", ad: "3 saatte bir" }, { id: "ozel", ad: "Özel", alt: "5 ile 1440 dakika" }]} /></div>
              {rssAralikOzel && <input type="number" min={5} max={1440} value={t.aralik} onChange={(e) => set({ ...t, aralik: Math.max(5, Math.min(1440, Number(e.target.value) || 15)) })} aria-label="Dakika" className={cn(alanSinif, "h-10 w-24")} />}
            </div>
          </Alan>
          {rssDurum && <p className="text-[12px] text-white/50">{rssDurum.hata ? <span className="text-rose-300">Son okuma başarısız: {rssDurum.hata}</span> : <>Son okuma {gorece(rssDurum.son)}{rssDurum.baslik ? `, ${rssDurum.baslik}` : ""} · {rssDurum.gorulen.length} öğe işaretli</>}</p>}
          {rssHata && <p className="text-[12.5px] text-rose-300">{rssHata}</p>}
          {rss && (
            <div className="space-y-1.5">
              <p className="text-[12.5px] font-medium text-white/80">{rss.baslik || "Akış"} · {rss.toplam} öğe</p>
              <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
                {rss.ogeler.slice(0, 5).map((o, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-white/[0.06] text-white/45"><Rss className="h-3.5 w-3.5" />{o.gorsel ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={String(o.gorsel)} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 h-full w-full object-cover" /> : null}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] text-white">{String(o.baslik || "Başlıksız")}</span><span className="block truncate text-[11px] text-white/40">{o.tarih ? tarihSaat(Date.parse(String(o.tarih))) : "tarih yok"}</span></span>
                    <button type="button" onClick={() => testVerisi(o)} className="shrink-0 rounded-full bg-white/[0.07] px-2.5 py-1 text-[11.5px] text-white/80 hover:bg-white/[0.12]">Test verisi yap</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {t.tur === "odeme" && (
        <div className="space-y-3 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <span className="flex shrink-0 gap-1">{["iyzico", "paytr", "stripe"].map((x) => <span key={x} className="flex h-8 w-12 items-center justify-center rounded-[9px] bg-white px-1.5">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/marka/baglanti/${x}.svg`} alt={x === "paytr" ? "PayTR" : x === "stripe" ? "Stripe" : "iyzico"} className="max-h-5 w-full object-contain" /></span>)}</span>
            <p className="min-w-0 text-[12px] leading-snug text-white/55">Vayra Ödeme ile sitende iyzico, PayTR ya da Stripe üzerinden alınan siparişler. Ödeme sağlayıcıdan sunucuda doğrulanınca çalışır.</p>
          </div>
          <Alan etiket="Build projesi" ipucu="Ödemeleri Bulut, Ödemeler bölümünden açılan proje."><AcilirSecim deger={t.projeId} set={(v) => set({ ...t, projeId: v })} l={k.projeler} bos="Proje seç" /></Alan>
          <Alan etiket="Hangi durumda" ipucu="Birden çok seçebilirsin; tetik verisinde durum alanı hangisi olduğunu söyler. Bekleyen siparişler tetiklemez.">
            <div className="grid grid-cols-3 gap-1.5">{ODEME_DURUMLARI.map((o) => { const l = t.durumlar?.length ? t.durumlar : ["odendi" as const]; const on = l.includes(o.id); return (
              <button key={o.id} type="button" aria-pressed={on} onClick={() => { const x = new Set(l); if (on) x.delete(o.id); else x.add(o.id); if (x.size) set({ ...t, durumlar: [...x] }); }} className={cn("rounded-[12px] px-2.5 py-2 text-left transition", on ? "bg-white/[0.08] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}>
                <span className="block text-[12.5px] font-medium text-white">{o.ad}</span><span className="block text-[11px] leading-snug text-white/45">{o.alt}</span>
              </button>
            ); })}</div>
          </Alan>
          <label className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]"><span className="text-[13px] text-white/85">Test ödemelerinde de çalış<span className="block text-[11.5px] text-white/45">Önizlemeden ve test anahtarlarıyla yapılan ödemeler; tetik verisinde test alanı doğru olur</span></span><Anahtar acik={!!t.test} etiket="Test ödemeleri" set={(v) => set({ ...t, test: v || undefined })} /></label>
          <p className="text-[12px] leading-relaxed text-white/45">Veri seçicide Tetik altında: siparisNo, tutar, paraBirimi, saglayici, alici (ad, eposta, telefon, adres), urunler ve siparişin tamamı (kayit).</p>
        </div>
      )}
      {t.tur === "eposta" && (
        <div className="space-y-3 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
          {s.epostaAnahtari ? (<>
            <Alan etiket="Bu sistemin gelen adresi"><Kopyalanir deger={`sistem-${s.epostaAnahtari}@${EPOSTA_ALAN}`} ad="eposta" kopya={kopya} kopyala={kopyala} /></Alan>
            <Alan etiket="Dahili uç nokta"><Kopyalanir deger={`${koken}/api/build/sistemler/eposta/${s.epostaAnahtari}`} ad="uc" kopya={kopya} kopyala={kopyala} /></Alan>
            <div className="flex items-start gap-2.5 rounded-[14px] bg-[#55d6fd]/[0.06] px-3.5 py-3 text-[12.5px] leading-relaxed text-white/70 ring-1 ring-inset ring-[#55d6fd]/15">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8be6ff]" />
              <span>E-posta yönlendirme kuralıyla bu adrese iletilir: alan adının gelen postasını (Cloudflare Email Routing, Mailgun, SendGrid Inbound Parse, Postmark) dahili uç noktaya POST eden bir kural kur. JSON, form ya da ham MIME kabul edilir; konu, gönderen, metin ve ekler ayrıştırılır.</span>
            </div>
            <button type="button" onClick={epostaYenile} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><RefreshCw className="h-3.5 w-3.5" />Yeni adres oluştur</button>
          </>) : <p className="text-[12.5px] text-white/55">Kaydedince sisteme özel adres oluşur.</p>}
          <Alan etiket="Yalnız şu gönderenlerden (isteğe bağlı)" ipucu="Virgülle ayır. @firma.com yazarsan o alan adının bütün adresleri kabul edilir. Uymayan iletiler çalıştırılmaz.">
            <input value={t.gonderen ?? ""} onChange={(e) => set({ ...t, gonderen: e.target.value || undefined })} placeholder="siparis@magaza.com, @firma.com" className={cn(alanSinif, "h-10 text-[13px]")} />
          </Alan>
        </div>
      )}
      {t.tur === "elle" && (
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.07]"><span className="text-[13px] text-white/85">Çalıştırırken girdi formu göster<span className="block text-[11.5px] text-white/45">Çalıştır'a basınca aşağıdaki alanlar sorulur</span></span><Anahtar acik={!!t.form} etiket="Girdi formu" set={(v) => set({ ...t, form: v || undefined })} /></label>
          {(t.form || (s.girdi?.length ?? 0) > 0) && (
            <section className="space-y-2.5 rounded-[16px] bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]">
              <p className="text-[13px] font-semibold text-white/90">Girdi alanları</p>
              <p className="-mt-1 text-[12px] leading-relaxed text-white/50">Değerler {"{{"}tetik.alan_adi{"}}"} olarak gelir. Aynı alanlar Sistemi çağır adımında, API'de ve MCP aracında da kullanılır.</p>
              <GirdiAlanlariDuzenleyici l={s.girdi ?? []} set={setGirdi} />
            </section>
          )}
          {!t.form && <p className="rounded-[14px] bg-white/[0.03] px-3.5 py-3 text-[12.5px] leading-relaxed text-white/55 ring-1 ring-inset ring-white/[0.07]">Sistemler sayfasından ya da çalışma görünümünden istediğin an çalışır. Başka sistemler Sistemi çağır adımıyla da çalıştırabilir.</p>}
        </div>
      )}
    </div>
  );
}

/* ───── Tetik deneme verisi ───── */
const olayOzeti = (v: unknown) => { if (!v || typeof v !== "object") return v === undefined || v === null ? "boş" : String(v).slice(0, 80); const k = Object.keys(v as object); return k.length ? k.slice(0, 4).join(", ") + (k.length > 4 ? ` ve ${k.length - 4} alan` : "") : "boş nesne"; };
export function TetikTesti({ s, metin, setMetin, calistir, gidiyor, sabitle, dinle, dinlemeKalan }: { s: SistemAcik; metin: string; setMetin: (v: string) => void; calistir: () => void; gidiyor: boolean; sabitle: (v: boolean) => void; dinle?: () => void; dinlemeKalan: number | null }) {
  let hata = "";
  try { if (metin.trim()) JSON.parse(metin); } catch { hata = "Geçerli JSON değil; düz metin olarak gönderilir."; }
  const sabit = s.test?.sabitTetik !== undefined;
  const olaylar = s.test?.olaylar ?? [];
  const [acikOlay, setAcikOlay] = useState<string | null>(null);
  const simdiki = (() => { try { return JSON.stringify(JSON.parse(metin)); } catch { return null; } })();
  return (
    <div className="space-y-3">
      <div className={cn("rounded-[16px] p-3.5 ring-1 ring-inset", sabit ? "bg-[#55d6fd]/[0.04] ring-[#55d6fd]/25" : "bg-white/[0.03] ring-white/[0.07]")}>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-[13px] font-semibold text-white/90">Deneme verisi</p>
          {sabit && <span className="flex items-center gap-1 rounded-full bg-[#55d6fd]/[0.14] px-2 py-0.5 text-[11px] font-medium text-[#8be6ff]"><Pin className="h-3 w-3" />Sabit</span>}
        </div>
        <p className="mb-2.5 mt-0.5 text-[12px] leading-relaxed text-white/50">{sabit ? "Sabitlendi: gelen olaylar bu veriyi değiştirmez; denemeler ve veri seçici bunu kullanır." : "Tetikten gelecek veri gibi düşün. Aşağıdaki gerçek olaylardan birini seçebilir, düzenleyip sabitleyebilirsin."}</p>
        <textarea value={metin} onChange={(e) => setMetin(e.target.value)} rows={8} spellCheck={false} className={cn(alanSinif, "sc-kod resize-y bg-[#0c0d0f] py-2.5 text-[12px] leading-relaxed")} />
        {hata && <p className="mt-1.5 text-[11.5px] text-amber-200/90">{hata}</p>}
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button type="button" onClick={calistir} disabled={gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-50">{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}Bu veriyle çalıştır</button>
          <button type="button" onClick={() => sabitle(!sabit)} disabled={!!hata && !sabit} className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium disabled:opacity-35", sabit ? "bg-[#55d6fd]/[0.14] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/30" : "bg-white/[0.07] text-white/80 hover:bg-white/[0.12]")}>{sabit ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}{sabit ? "Sabitten çıkar" : "Sabitle"}</button>
          {dinle && <button type="button" onClick={dinle} className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px]", dinlemeKalan !== null ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.07] text-white/80 hover:bg-white/[0.12]")}><Radio className={cn("h-3.5 w-3.5", dinlemeKalan !== null && "animate-pulse")} />{dinlemeKalan !== null ? `Dinleniyor, ${Math.floor(dinlemeKalan / 60)}:${String(dinlemeKalan % 60).padStart(2, "0")}` : "Test olayını dinle"}</button>}
        </div>
      </div>
      <div className="rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
        <p className="text-[13px] font-semibold text-white/90">Son olaylar</p>
        <p className="mb-2 mt-0.5 text-[12px] leading-relaxed text-white/50">Tetiğin son 10 gerçek olayı. Birini seç; düzenleyip sabitleyebilirsin.</p>
        {!olaylar.length ? <p className="rounded-[12px] bg-white/[0.02] px-3 py-2.5 text-[12px] text-white/45 ring-1 ring-inset ring-white/[0.05]">Henüz olay yok. Sistem açıkken tetik gelince ya da test adresine istek gönderince burada listelenir.</p> : (
          <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            {olaylar.map((o) => { const T = TETIK_IKON[o.tur.replace("-test", "")] ?? FlaskConical; const secili = simdiki !== null && simdiki === JSON.stringify(o.veri); return (
              <div key={o.id} className={cn("transition-colors", secili && "bg-white/[0.04]")}>
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <button type="button" onClick={() => setAcikOlay(acikOlay === o.id ? null : o.id)} aria-label="Ayrıntı" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07]"><ChevronRight className={cn("h-3.5 w-3.5 transition-transform", acikOlay === o.id && "rotate-90")} /></button>
                  <T className="h-3.5 w-3.5 shrink-0 text-white/50" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] text-white/85">{o.tur === "webhook-test" ? "Test adresi" : TETIK_ADI[o.tur] ?? o.tur} · {gorece(o.zaman)}</span><span className="block truncate text-[11px] text-white/40">{olayOzeti(o.veri)}</span></span>
                  <button type="button" onClick={() => setMetin(JSON.stringify(o.veri, null, 2))} className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px]", secili ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.07] text-white/80 hover:bg-white/[0.12]")}>{secili ? "Seçili" : "Kullan"}</button>
                </div>
                <AnimatePresence>{acikOlay === o.id && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-3 pb-2.5"><JsonGorunum id={`olay-${o.id}`} v={o.veri} /></motion.div>}</AnimatePresence>
              </div>
            ); })}
          </div>
        )}
      </div>
      <p className="px-1 text-[12px] leading-relaxed text-white/45">Deneme taslağı çalıştırır; yayındaki sürüm etkilenmez. Kayıt adımları gerçekten yazar, bekleme ve onay adımları gerçekten bekler.</p>
    </div>
  );
}

/* ───── Adım testi: Girdi / Çıktı ───── */
export function AdimTesti({ s, a, kaydet, setTest }: { s: SistemAcik; a: Adim; kaydet: () => Promise<void>; setTest: (t: SistemAcik["test"]) => void }) {
  const t = s.test?.adimlar?.[a.id];
  const sabit = !!s.test?.sabit?.includes(a.id);
  const [gidiyor, setGidiyor] = useState(false);
  const [son, setSon] = useState<AdimSonucu | null>(null);
  const [sekme, setSekme] = useState<"cikti" | "girdi">("cikti");
  const [duzen, setDuzen] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  useEffect(() => { setSon(null); setDuzen(null); setHata(""); }, [a.id]);
  const kap = !!a.dallar || a.tur === "dongu";
  const dene = async () => {
    setGidiyor(true); setHata("");
    try {
      await kaydet();
      const v = await api<{ sonuc: AdimSonucu }>(`/api/build/sistemler/${s.id}/adim`, { govde: { adimId: a.id, adim: a } });
      setSon(v.sonuc);
      setTest({ ...(s.test ?? {}), adimlar: { ...(s.test?.adimlar ?? {}), [a.id]: { girdi: v.sonuc.girdi, veri: v.sonuc.durum === "basarili" ? v.sonuc.veri : t?.veri, cikti: v.sonuc.cikti, hata: v.sonuc.hata, zaman: Date.now(), sure: v.sonuc.sure, kaynak: "dene" } } });
      setSekme(v.sonuc.durum === "basarili" ? "cikti" : "girdi");
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Denenemedi."); }
    finally { setGidiyor(false); }
  };
  const sabitle = async (v: boolean, veri?: unknown) => {
    setHata("");
    try { const r = await api<{ test: SistemAcik["test"] }>(`/api/build/sistemler/${s.id}/adim`, { method: "PUT", govde: { adimId: a.id, sabit: v, ...(veri !== undefined ? { veri } : {}) } }); setTest(r.test); setDuzen(null); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); }
  };
  const goster = son ?? (t ? { durum: t.hata && t.veri === undefined ? "basarisiz" : "basarili", girdi: t.girdi, veri: t.veri, cikti: t.cikti, hata: t.hata, sure: t.sure ?? 0 } as Partial<AdimSonucu> : null);
  const D = goster?.durum ? ADIM_DURUM[goster.durum] : null;
  return (
    <div className="space-y-3">
      <div className="rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={dene} disabled={gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-50">{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}Bu adımı dene</button>
          {!kap && a.tur !== "bekle" && a.tur !== "onay" && (
            <button type="button" onClick={() => sabitle(!sabit)} disabled={!t && !sabit} title={sabit ? "Sabit veriyi kaldır" : "Bu çıktıyı sabitle: denemelerde adım çalışmaz, bu veri kullanılır"}
              className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium disabled:opacity-35", sabit ? "bg-[#55d6fd]/[0.14] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/30" : "bg-white/[0.07] text-white/80 hover:bg-white/[0.12]")}>
              {sabit ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}{sabit ? "Sabitten çıkar" : "Sabitle"}
            </button>
          )}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-white/50">{kap ? "Yalnız bu adımın kararını dener; dallara ya da döngü içine inmez." : "Önceki adımların son ya da sabitlenmiş verisiyle çalışır. Denemede kayıt yazılmaz, bekleme ve onay beklenmez."}{sabit && " Bu adım sabit: taslak denemelerinde çalışmaz, aşağıdaki çıktıyı verir."}</p>
        {hata && <p className="mt-2 text-[12.5px] text-rose-300">{hata}</p>}
      </div>
      {goster ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1 text-[12px]">
            {D && <span className={cn("flex items-center gap-1.5 font-medium", D.metin)}><span className={cn("h-2 w-2 rounded-full", D.nokta)} />{D.ad}</span>}
            {goster.sure !== undefined && <span className="text-white/40">{sureYaz(goster.sure)}</span>}
            {!!goster.kredi && <span className="text-white/40">{goster.kredi} kredi</span>}
            {t && !son && <span className="ml-auto text-white/35">{t.kaynak === "dene" ? "Son deneme" : t.kaynak === "elle" ? "Elle girildi" : "Son çalışmadan"} · {gorece(t.zaman)}</span>}
          </div>
          {goster.hata && <p className="flex items-start gap-2 rounded-[14px] bg-rose-500/[0.07] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-rose-200 ring-1 ring-inset ring-rose-400/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{goster.hata}</p>}
          <Segment id={`test-${a.id}`} kucuk deger={sekme} set={setSekme} l={[{ id: "cikti", ad: "Çıktı" }, { id: "girdi", ad: "Girdi" }]} />
          {sekme === "cikti" ? (duzen !== null ? (
            <div className="space-y-2">
              <textarea value={duzen} onChange={(e) => setDuzen(e.target.value)} rows={10} spellCheck={false} className={cn(alanSinif, "sc-kod resize-y bg-[#0c0d0f] py-2.5 text-[12px]")} />
              <div className="flex gap-2"><button type="button" onClick={() => { let v: unknown = duzen; try { v = JSON.parse(duzen); } catch { /* metin */ } sabitle(true, v); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Pin className="h-3.5 w-3.5" />Kaydet ve sabitle</button><button type="button" onClick={() => setDuzen(null)} className="h-9 rounded-full px-3.5 text-[13px] text-white/65 hover:bg-white/[0.06]">Vazgeç</button></div>
            </div>
          ) : (<>
            <JsonGorunum id={`c-${a.id}`} v={goster.veri} bos="Çıktı yok" />
            {!kap && <button type="button" onClick={() => setDuzen(JSON.stringify(goster.veri ?? {}, null, 2))} className="text-[12px] text-white/50 underline-offset-2 hover:text-white hover:underline">Çıktıyı elle düzenle</button>}
          </>)) : <JsonGorunum id={`g-${a.id}`} v={goster.girdi} bos="Girdi kaydı yok" />}
          {son?.ek?.loglar?.length ? <div><p className="mb-1 px-1 text-[12px] font-medium text-white/60">Günlük</p><pre className="sc-kod max-h-40 overflow-auto rounded-[12px] bg-[#0c0d0f] p-2.5 text-[11.5px] text-white/70 ring-1 ring-inset ring-white/[0.07]">{son.ek.loglar.join("\n")}</pre></div> : null}
        </div>
      ) : <p className="rounded-[14px] bg-white/[0.02] px-3.5 py-3 text-[12.5px] leading-relaxed text-white/45 ring-1 ring-inset ring-white/[0.06]">Bu adım henüz denenmedi. Dene; çıktısındaki alanlar sonraki adımların veri seçicisinde örnek değerleriyle görünür.</p>}
    </div>
  );
}

/* ───── Son çalışmalar (düzenleyici paneli) ───── */
export function CalismaListesi({ s, l }: { s: SistemAcik; l: CalismaOzeti[] }) {
  return (
    <div className="space-y-2">
      {!l.length ? <p className="rounded-[14px] bg-white/[0.02] px-3.5 py-3 text-[12.5px] text-white/45 ring-1 ring-inset ring-white/[0.06]">Henüz çalışma yok. Tetiği seçip Test sekmesinden deneme verisiyle çalıştır.</p> : l.map((c) => { const D = CALISMA_SINIF[c.durum]; const T = TETIK_IKON[c.tetikTur] ?? FlaskConical; return (
        <Link key={c.id} href={`/panel/build/sistemler/${s.id}/calisma/${c.id}`} className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.03]">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", D.nokta)} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-white">{D.ad}<span className="flex items-center gap-1 font-normal text-white/45"><T className="h-3 w-3" />{TETIK_ADI[c.tetikTur] ?? c.tetikTur}</span>{c.kaynak && <span className="font-normal text-white/40">· {c.kaynak === "devam" ? "hatadan devam" : "yeniden"}</span>}</span>
            <span className="block truncate text-[11.5px] text-white/40">{tarihSaat(c.baslangic)}{c.bitis ? ` · ${sureYaz(c.bitis - c.baslangic)}` : ""}{c.kredi ? ` · ${c.kredi} kredi` : ""}{typeof c.surum === "number" ? ` · sürüm ${c.surum}` : " · taslak"}</span>
            {c.hata && c.durum === "basarisiz" && <span className="mt-0.5 block truncate text-[11.5px] text-rose-300/90">{c.hata}</span>}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
        </Link>
      ); })}
      {l.length > 0 && <Link href={`/panel/build/sistemler/calismalar?sistem=${s.id}`} className="flex items-center justify-center gap-1.5 py-2 text-[12.5px] text-white/55 hover:text-white">Tüm çalışmalar, süzgeç ve arama<ArrowRight className="h-3.5 w-3.5" /></Link>}
    </div>
  );
}

/* ───── Sistem ayarları ───── */
/** Etiket düzenleyici: çipler, yeni etiket ve öneriler. */
export function EtiketDuzenleyici({ l, set, oneriler = [] }: { l: string[]; set: (l: string[]) => void; oneriler?: string[] }) {
  const [yeni, setYeni] = useState("");
  const ekle = (v: string) => { const t = v.trim().replace(/\s+/g, " ").slice(0, 24); if (t && !l.includes(t) && l.length < 8) set([...l, t]); setYeni(""); };
  const kalan = oneriler.filter((x) => !l.includes(x)).slice(0, 8);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <AnimatePresence initial={false}>{l.map((e) => <motion.span key={e} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex h-7 items-center gap-1 rounded-full bg-violet-400/[0.12] pl-2.5 pr-1 text-[12px] text-violet-100"><Tag className="h-3 w-3" />{e}<button type="button" onClick={() => set(l.filter((x) => x !== e))} aria-label={`${e} etiketini kaldır`} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/[0.1]"><X className="h-3 w-3" /></button></motion.span>)}</AnimatePresence>
        {l.length < 8 && <span className="flex h-7 items-center gap-1 rounded-full bg-white/[0.04] pl-2.5 pr-1 ring-1 ring-inset ring-white/[0.08]"><input value={yeni} onChange={(e) => setYeni(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); ekle(yeni); } }} placeholder="Etiket ekle" aria-label="Yeni etiket" className="h-6 w-24 bg-transparent text-[12px] text-white outline-none placeholder:text-white/35" /><button type="button" onClick={() => ekle(yeni)} disabled={!yeni.trim()} aria-label="Ekle" className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black disabled:opacity-30"><Plus className="h-3 w-3" /></button></span>}
      </div>
      {kalan.length > 0 && <div className="flex flex-wrap gap-1">{kalan.map((x) => <button key={x} type="button" onClick={() => ekle(x)} className="rounded-full px-2 py-0.5 text-[11.5px] text-white/45 ring-1 ring-inset ring-white/[0.07] hover:text-white">{x}</button>)}</div>}
    </div>
  );
}

export function SistemAyarlari({ s, d, k }: { s: SistemAcik; d: (p: Partial<SistemAcik>) => void; k: Kaynaklar }) {
  const es = s.ayar.esZamanli ?? 1;
  const [ozel, setOzel] = useState(![1, 2, 3, 5].includes(es));
  const dk = s.ayar.dakika ?? 0;
  const [dkOzel, setDkOzel] = useState(!!dk && ![1, 2, 5, 10, 15, 30, 60].includes(dk));
  return (
    <div className="space-y-4">
      <Alan etiket="Açıklama"><textarea value={s.aciklama} onChange={(e) => d({ aciklama: e.target.value })} rows={3} maxLength={400} className={cn(alanSinif, "resize-none py-2.5")} /></Alan>
      <Alan etiket="Etiketler" ipucu="Sistemler listesinde arama ve süzgeç için; en çok 8."><EtiketDuzenleyici l={s.etiketler ?? []} set={(l) => d({ etiketler: l })} oneriler={k.etiketler ?? []} /></Alan>
      <Alan etiket="Çalışma başı kazanılan süre" ipucu="Bu işi elle yapsan bir başarılı çalışma kaç dakika sürerdi? İçgörüler kazanılan süreyi buradan hesaplar.">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1"><AcilirSecim deger={dkOzel ? "ozel" : String(dk)} set={(v) => { if (v === "ozel") { setDkOzel(true); return; } setDkOzel(false); d({ ayar: { ...s.ayar, dakika: Number(v) || undefined } }); }} l={[{ id: "0", ad: "Hesaplama", alt: "Kazanılan süre gösterilmez" }, ...[1, 2, 5, 10, 15, 30, 60].map((x) => ({ id: String(x), ad: `${x} dakika` })), { id: "ozel", ad: "Özel", alt: "Dakikayı kendin yaz" }]} /></div>
          {dkOzel && <input type="number" min={0.5} max={10000} step={0.5} value={dk || 5} onChange={(e) => d({ ayar: { ...s.ayar, dakika: Math.max(0.5, Math.min(10000, Number(e.target.value) || 1)) } })} aria-label="Dakika" className={cn(alanSinif, "h-10 w-24")} />}
        </div>
      </Alan>
      <Alan etiket="Vayra adımlarının modeli" ipucu="Ajan seçili adımlar ajanın kendi modelini kullanır. Yapay zekâ yönlendirici ve Hatayı açıkla bu modeli kullanır."><div className="w-fit rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/[0.08]"><ModelSecici deger={s.ayar.model} sec={(m) => d({ ayar: { ...s.ayar, model: m } })} /></div></Alan>
      <Alan etiket="Çalışma başına kredi tavanı" ipucu="Aşılırsa sistem o çalışmada durur; sürpriz harcama olmaz."><input type="number" min={5} max={5000} value={s.ayar.krediTavani} onChange={(e) => d({ ayar: { ...s.ayar, krediTavani: Number(e.target.value) || 200 } })} className={cn(alanSinif, "h-10 w-32")} /></Alan>
      <Alan etiket="Aynı anda en çok kaç çalışma" ipucu="Sınır doluyken gelen tetikler atlanmaz, kuyrukta sırasını bekler (en çok 200). Bekleyen ve onay bekleyen çalışmalar yer tutmaz.">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1"><AcilirSecim deger={ozel ? "ozel" : String(es)} set={(v) => { if (v === "ozel") { setOzel(true); return; } setOzel(false); d({ ayar: { ...s.ayar, esZamanli: Number(v) } }); }} l={[{ id: "1", ad: "1, sırayla", alt: "Her tetik bir öncekinin bitmesini bekler" }, { id: "2", ad: "2 çalışma" }, { id: "3", ad: "3 çalışma" }, { id: "5", ad: "5 çalışma" }, { id: "ozel", ad: "Özel", alt: "1 ile 10 arası" }]} /></div>
          {ozel && <input type="number" min={1} max={10} value={es} onChange={(e) => d({ ayar: { ...s.ayar, esZamanli: Math.max(1, Math.min(10, Number(e.target.value) || 1)) } })} className={cn(alanSinif, "h-10 w-24")} />}
        </div>
      </Alan>
      <HizAyari s={s} d={d} />
      <section className="space-y-3.5 rounded-[18px] bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]">
        <div><p className="text-[13px] font-semibold text-white/90">Hata bildirimi</p><p className="mt-0.5 text-[12px] leading-relaxed text-white/50">Yayındaki bir çalışma başarısız olunca. Denemeler bildirim göndermez. Üst üste 3 hatada sistem kendini duraklatır.</p></div>
        <Alan etiket="Şu sistemi çalıştır" ipucu="Seçtiğin sistem açıksa çalışır; Tetik altında sistem adı, hatalı adım, hata iletisi ve çalışma adresi gelir."><AcilirSecim deger={s.ayar.hataSistemi ?? ""} set={(v) => d({ ayar: { ...s.ayar, hataSistemi: v || undefined } })} l={k.sistemler} bos="Çalıştırma" /></Alan>
        <HataEpostasi s={s} d={d} />
        <Alan etiket="Şu adrese bildir" ipucu="Slack, Discord ya da Teams gelen web kancası adresi. Metin ve çalışma bağlantısı gönderilir."><input value={s.ayar.hataWebhook ?? ""} onChange={(e) => d({ ayar: { ...s.ayar, hataWebhook: e.target.value } })} placeholder="https://hooks.slack.com/services/…" className={cn(alanSinif, "h-10 text-[13px]")} /></Alan>
      </section>
      <dl className="grid grid-cols-3 gap-2">{[["Çalışma", s.ozet.calisma], ["Başarılı", s.ozet.basarili], ["Kredi", s.ozet.kredi]].map(([a, b]) => <div key={String(a)} className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]"><dd className="text-[18px] font-semibold tabular-nums text-white">{b}</dd><dt className="text-[11.5px] text-white/45">{a}</dt></div>)}</dl>
      <p className="px-1 text-[11.5px] leading-relaxed text-white/40">Çalışmalar 30 gün ya da en çok 2000 adet saklanır; bekleyenler silinmez.</p>
    </div>
  );
}

/* ───── Hata e-postası ───── */
function HataEpostasi({ s, d }: { s: SistemAcik; d: (p: Partial<SistemAcik>) => void }) {
  const he = s.ayar.hataEposta;
  const [alici, setAlici] = useState(he?.alici ?? "");
  const mod = he?.mod ?? "anlik";
  const yaz = (a: string, m: "anlik" | "gunluk") => d({ ayar: { ...s.ayar, hataEposta: (a.trim() ? { alici: a, mod: m } : null) as unknown as SistemAcik["ayar"]["hataEposta"] } });
  return (
    <Alan etiket="E-postayla bildir" ipucu={<>Hesabındaki RESEND_API_KEY sırrıyla gönderilir; gönderen adresi gonderen_eposta değişkeninden gelir. Günlük özet her sabah 09.00'da son hataları tek e-postada toplar.</>}>
      <div className="space-y-2">
        <input value={alici} onChange={(e) => { setAlici(e.target.value); yaz(e.target.value, mod); }} placeholder="ekip@firma.com, sen@firma.com" inputMode="email" className={cn(alanSinif, "h-10 text-[13px]")} />
        {alici.trim() && <Segment id="hata-eposta-mod" kucuk deger={mod} set={(m) => yaz(alici, m)} l={[{ id: "anlik", ad: "Her hatada" }, { id: "gunluk", ad: "Günlük özet" }]} />}
        {s.bildirimSorunu && <p className="flex items-start gap-2 rounded-[12px] bg-amber-400/[0.07] px-3 py-2 text-[12px] leading-relaxed text-amber-100 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{s.bildirimSorunu}</p>}
        {mod === "gunluk" && (s.hataOzeti?.length ?? 0) > 0 && <p className="text-[11.5px] text-white/45">Yarın sabahki özette {s.hataOzeti!.length} hata bekliyor.</p>}
      </div>
    </Alan>
  );
}

/* ───── Hız ve sıra denetimi ───── */
const HIZ_HAZIR = [{ id: "yok", ad: "Sınır yok", h: null }, { id: "10-1", ad: "Dakikada 10", h: { sayi: 10, dakika: 1 } }, { id: "30-1", ad: "Dakikada 30", h: { sayi: 30, dakika: 1 } }, { id: "100-60", ad: "Saatte 100", h: { sayi: 100, dakika: 60 } }, { id: "1000-1440", ad: "Günde 1000", h: { sayi: 1000, dakika: 1440 } }] as const;
function HizAyari({ s, d }: { s: SistemAcik; d: (p: Partial<SistemAcik>) => void }) {
  const h = s.ayar.hiz;
  const hazir = !h ? "yok" : HIZ_HAZIR.find((x) => x.h && x.h.sayi === h.sayi && x.h.dakika === h.dakika)?.id;
  const [ozel, setOzel] = useState(!!h && !hazir);
  const ar = s.ayar.aralik ?? 0;
  const [arOzel, setArOzel] = useState(!!ar && ![5, 15, 30, 60].includes(ar));
  const za = s.ayar.zamanAsimi ?? 10;
  return (
    <section className="space-y-3.5 rounded-[18px] bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]">
      <div><p className="text-[13px] font-semibold text-white/90">Hız ve sıra</p><p className="mt-0.5 text-[12px] leading-relaxed text-white/50">Gelen servis hız sınırına takılmasın, sıra bozulmasın. Sınırı aşan tetikler atlanmaz; kuyrukta sırasını bekler (en çok 200).</p></div>
      <Alan etiket="En çok kaç çalışma başlasın">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1"><AcilirSecim deger={ozel ? "ozel" : hazir ?? "yok"} set={(v) => { if (v === "ozel") { setOzel(true); d({ ayar: { ...s.ayar, hiz: s.ayar.hiz ?? { sayi: 20, dakika: 1 } } }); return; } setOzel(false); const x = HIZ_HAZIR.find((z) => z.id === v); d({ ayar: { ...s.ayar, hiz: (x?.h ? { ...x.h } : null) as unknown as SistemAcik["ayar"]["hiz"] } }); }} l={[...HIZ_HAZIR.map((x) => ({ id: x.id, ad: x.ad })), { id: "ozel", ad: "Özel", alt: "Sayıyı ve süreyi kendin seç" }]} /></div>
        </div>
        {ozel && h && (
          <div className="mt-2 flex items-center gap-2 text-[12.5px] text-white/60">
            <input type="number" min={1} max={1000} value={h.sayi} onChange={(e) => d({ ayar: { ...s.ayar, hiz: { ...h, sayi: Math.max(1, Math.min(1000, Number(e.target.value) || 1)) } } })} aria-label="Çalışma sayısı" className={cn(alanSinif, "h-10 w-24")} />
            <span>çalışma,</span>
            <input type="number" min={1} max={1440} value={h.dakika} onChange={(e) => d({ ayar: { ...s.ayar, hiz: { ...h, dakika: Math.max(1, Math.min(1440, Number(e.target.value) || 1)) } } })} aria-label="Dakika" className={cn(alanSinif, "h-10 w-24")} />
            <span>dakikada</span>
          </div>
        )}
      </Alan>
      <Alan etiket="Art arda iki çalışma arasında" ipucu="Kuyruktaki çalışmalar bu kadar arayla başlar; tek tek işlenmesi gereken toplu olaylar için (Zapier Delay After Queue gibi).">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1"><AcilirSecim deger={arOzel ? "ozel" : String(ar)} set={(v) => { if (v === "ozel") { setArOzel(true); return; } setArOzel(false); d({ ayar: { ...s.ayar, aralik: Number(v) || 0 } }); }} l={[{ id: "0", ad: "Bekleme yok" }, { id: "5", ad: "5 saniye" }, { id: "15", ad: "15 saniye" }, { id: "30", ad: "30 saniye" }, { id: "60", ad: "1 dakika" }, { id: "ozel", ad: "Özel", alt: "1 ile 3600 saniye" }]} /></div>
          {arOzel && <input type="number" min={1} max={3600} value={ar || 10} onChange={(e) => d({ ayar: { ...s.ayar, aralik: Math.max(1, Math.min(3600, Number(e.target.value) || 1)) } })} aria-label="Saniye" className={cn(alanSinif, "h-10 w-24")} />}
        </div>
      </Alan>
      <Alan etiket="Bir çalışma en çok" ipucu="Süre dolunca çalışma durur; bekleme, onay ve yeniden deneme beklemeleri sayılmaz.">
        <Segment id="zaman-asimi" kucuk deger={String(za)} set={(v) => d({ ayar: { ...s.ayar, zamanAsimi: Number(v) } })} l={[{ id: "1", ad: "1 dk" }, { id: "3", ad: "3 dk" }, { id: "5", ad: "5 dk" }, { id: "10", ad: "10 dk" }]} />
      </Alan>
    </section>
  );
}

/* ───── Sürümler ve yayın ───── */
const FARK_RENK: Record<FarkSatiri["tur"], { ad: string; sinif: string }> = {
  eklendi: { ad: "Eklendi", sinif: "bg-emerald-400/[0.12] text-emerald-200" }, silindi: { ad: "Silindi", sinif: "bg-rose-500/[0.12] text-rose-200" },
  degisti: { ad: "Değişti", sinif: "bg-amber-400/[0.12] text-amber-200" }, tasindi: { ad: "Taşındı", sinif: "bg-violet-400/[0.12] text-violet-200" },
};
export function FarkListesi({ l }: { l: FarkSatiri[] }) {
  if (!l.length) return <p className="rounded-[14px] bg-white/[0.03] px-3.5 py-3 text-[12.5px] text-white/50 ring-1 ring-inset ring-white/[0.06]">İki akış aynı.</p>;
  return (
    <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]">
      {l.map((f, i) => { const I = f.adimTur ? ADIM_IKON[f.adimTur] : TETIK_IKON.elle; const R = FARK_RENK[f.tur]; return (
        <div key={i} className="flex gap-3 px-3.5 py-2.5">
          <I className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[13px] font-medium text-white"><span className="truncate">{f.ad}</span><span className={cn("shrink-0 rounded-full px-2 py-px text-[10.5px] font-medium", R.sinif)}>{R.ad}</span></p>
            {f.ayrinti.map((x, j) => <p key={j} className="mt-0.5 break-words text-[12px] leading-relaxed text-white/50">{x}</p>)}
          </div>
        </div>
      ); })}
    </div>
  );
}

export function SurumPaneli({ acik, kapat, s, setS, onceYayinla }: { acik: boolean; kapat: () => void; s: SistemAcik; setS: (s: SistemAcik) => void; onceYayinla: () => Promise<void> }) {
  const [l, setL] = useState<Surum[] | null>(null);
  const [ad, setAd] = useState(""); const [not, setNot] = useState(""); const [ac, setAc] = useState(s.durum !== "acik");
  const [gidiyor, setGidiyor] = useState<string | null>(null); const [hata, setHata] = useState("");
  const [secili, setSecili] = useState<number[]>([]);
  const [gorsel, setGorsel] = useState<{ a: { tetikler: Tetikleyici[]; adimlar: Adim[] }; b: { tetikler: Tetikleyici[]; adimlar: Adim[] }; aAd: string; bAd: string } | null>(null);
  const yukle = () => api<{ surumler: Surum[] }>(`/api/build/sistemler/${s.id}/surumler`).then((v) => setL(v.surumler)).catch(() => setL([]));
  useEffect(() => { if (acik) { yukle(); setHata(""); setAc(s.durum !== "acik"); setSecili([]); } }, [acik]); // eslint-disable-line react-hooks/exhaustive-deps
  const taslak = { tetikler: s.tetikler, adimlar: s.adimlar };
  const bekleyen = s.yayin ? surumFarki(s.yayin, taslak) : null;
  const yayinla = async () => {
    setGidiyor("yayinla"); setHata("");
    try { await onceYayinla(); const v = await api<{ sistem: SistemAcik }>(`/api/build/sistemler/${s.id}/surumler`, { govde: { islem: "yayinla", ad, not, ac } }); setS(v.sistem); setAd(""); setNot(""); await yukle(); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yayınlanamadı."); } finally { setGidiyor(null); }
  };
  const geriYukle = async (no: number) => {
    setGidiyor(`g${no}`); setHata("");
    try { await onceYayinla(); const v = await api<{ sistem: SistemAcik }>(`/api/build/sistemler/${s.id}/surumler`, { govde: { islem: "geriYukle", no } }); setS(v.sistem); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Geri yüklenemedi."); } finally { setGidiyor(null); }
  };
  const sec = (no: number) => setSecili((x) => (x.includes(no) ? x.filter((y) => y !== no) : [...x, no].slice(-2)));
  const ab = secili.length === 2 && l ? [l.find((v) => v.no === Math.min(...secili))!, l.find((v) => v.no === Math.max(...secili))!] : null;
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Yayınla ve sürümler" alt={s.yayin ? `Yayında: sürüm ${s.yayin.surum}, ${gorece(s.yayin.zaman)}` : "Henüz yayınlanmadı; canlı tetikler yayındaki sürümü çalıştırır"} genislik={520}>
      <div className="space-y-5">
        <section className="space-y-3 rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-white"><Rocket className="h-4 w-4 text-[#8be6ff]" />Taslağı yayınla</p>
          {bekleyen && <div><div className="mb-1.5 flex items-center gap-2"><p className="min-w-0 flex-1 text-[12.5px] text-white/55">{bekleyen.length ? `Yayındaki sürüme göre ${bekleyen.length} değişiklik` : "Taslak yayındaki sürümle aynı."}</p>{bekleyen.length > 0 && s.yayin && <button type="button" onClick={() => setGorsel({ a: s.yayin!, b: taslak, aAd: `Yayında, sürüm ${s.yayin!.surum}`, bAd: "Taslak" })} className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 text-[12px] text-white hover:bg-white/[0.13]"><GitCompare className="h-3.5 w-3.5" />Yan yana</button>}</div>{bekleyen.length > 0 && <FarkListesi l={bekleyen} />}</div>}
          <input value={ad} onChange={(e) => setAd(e.target.value)} maxLength={80} placeholder={`Sürüm adı, boşsa Sürüm ${Math.max(s.surumSayaci ?? 0, s.yayin?.surum ?? 0) + 1}`} className={cn(alanSinif, "h-10")} />
          <textarea value={not} onChange={(e) => setNot(e.target.value)} rows={2} maxLength={600} placeholder="Ne değişti? İsteğe bağlı not" className={cn(alanSinif, "resize-none py-2.5 text-[13.5px]")} />
          {s.durum !== "acik" && <label className="flex items-center justify-between gap-3"><span className="text-[13px] text-white/75">Yayınlayınca sistemi aç</span><Anahtar acik={ac} etiket="Sistemi aç" set={setAc} /></label>}
          {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
          <button type="button" onClick={yayinla} disabled={!!gidiyor || !s.adimlar.length || (bekleyen !== null && !bekleyen.length && s.durum === "acik")} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-40">{gidiyor === "yayinla" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}Yayınla</button>
        </section>
        <section className="space-y-2">
          <div className="flex items-center gap-2"><p className="flex-1 text-[13.5px] font-semibold text-white">Sürüm geçmişi</p>{l && l.length > 1 && <span className="text-[12px] text-white/45">Karşılaştırmak için iki sürüm seç</span>}</div>
          {l === null ? <div className="h-20 animate-pulse rounded-[16px] bg-white/[0.03]" /> : !l.length ? <p className="rounded-[14px] bg-white/[0.02] px-3.5 py-3 text-[12.5px] text-white/45 ring-1 ring-inset ring-white/[0.06]">Henüz sürüm yok. İlk yayın sürüm 1 olur.</p> : l.map((v) => { const on = secili.includes(v.no); return (
            <div key={v.no} className={cn("rounded-[16px] p-3 ring-1 ring-inset transition", on ? "bg-white/[0.05] ring-2 ring-white" : "ring-white/[0.07]")}>
              <button type="button" onClick={() => sec(v.no)} className="block w-full text-left">
                <p className="flex items-center gap-2 text-[13.5px] font-medium text-white"><span className="shrink-0 rounded-full bg-white/[0.08] px-2 py-px text-[11px] tabular-nums text-white/70">{v.no}</span><span className="truncate">{v.ad}</span>{s.yayin?.surum === v.no && <span className="shrink-0 rounded-full bg-[#55d6fd]/[0.12] px-2 py-px text-[11px] text-[#8be6ff]">Yayında</span>}</p>
                <p className="mt-0.5 text-[11.5px] text-white/40">{tarihSaat(v.zaman)} · {v.adimlar.length} adım</p>
                {v.not && <p className="mt-1 text-[12px] leading-relaxed text-white/55">{v.not}</p>}
              </button>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button type="button" onClick={() => geriYukle(v.no)} disabled={!!gidiyor} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12px] text-white/80 hover:bg-white/[0.12] disabled:opacity-40">{gidiyor === `g${v.no}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}Taslağa geri yükle</button>
                <button type="button" onClick={() => setSecili(secili.includes(v.no) ? secili : [v.no, -1])} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12px] text-white/80 hover:bg-white/[0.12]"><GitCompare className="h-3.5 w-3.5" />Taslakla karşılaştır</button>
              </div>
            </div>
          ); })}
        </section>
        <AnimatePresence>
          {(ab || (secili.length === 2 && secili.includes(-1))) && l && (
            <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
              {(() => {
                const a = secili.includes(-1) ? l.find((v) => v.no === secili.find((x) => x !== -1)) : ab![0];
                const b = secili.includes(-1) ? null : ab![1];
                if (!a) return null;
                return (<>
                  <div className="flex flex-wrap items-center gap-2"><p className="min-w-0 flex-1 text-[13.5px] font-semibold text-white">Sürüm {a.no} ile {b ? `sürüm ${b.no}` : "taslak"} arasındaki fark</p>
                    <button type="button" onClick={() => setGorsel({ a, b: b ?? taslak, aAd: `Sürüm ${a.no}`, bAd: b ? `Sürüm ${b.no}` : "Taslak" })} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black"><GitCompare className="h-3.5 w-3.5" />Tuvalde yan yana gör</button></div>
                  <FarkListesi l={surumFarki(a, b ?? taslak)} />
                </>);
              })()}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>{gorsel && <SurumKarsilastir {...gorsel} kapat={() => setGorsel(null)} />}</AnimatePresence>
    </YanPanel>
  );
}
