"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "framer-motion";
import { BarChart3, Code2, CreditCard, ExternalLink, KeyRound, ListChecks, Loader2, Package, Radio, RotateCcw, Search, ShoppingBag, Sparkles, Table2, Wallet } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim, KodKutusu, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import type { ProjeKanca } from "@/components/build/calisma/useProje";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { paraYaz } from "@/lib/build/bolge";
import { Alan, Hap, YanPanel } from "./ortak";

type Saglayici = "stripe" | "paypal" | "iyzico" | "paytr";
const SIRA: Saglayici[] = ["stripe", "paypal", "iyzico", "paytr"];
type Mod = "test" | "canli";
type Durum = "bekliyor" | "odendi" | "basarisiz" | "iade";
type AnahtarSatiri = { ad: string; etiket: string; canli: "var" | "yok" | "acik"; test: "var" | "yok" | "acik" | "canlidan"; uyari?: string };
type Madde = { id: string; ad: string; alt: string; durum: "tamam" | "eksik" | "uyari"; zorunlu: boolean };
type Ozet = {
  ayar: { saglayici: Saglayici | null; ekSaglayicilar?: Saglayici[]; mod: Mod; basariSayfasi: string; hataSayfasi: string; taksit: number; urunTablosu: string; sonBildirim?: Record<string, number> };
  paraBirimi?: string;
  anahtarlar: Record<Saglayici, AnahtarSatiri[]>; testAyri: Record<Saglayici, boolean>;
  adresler: { iyzicoDonus: string; paytrBildirim: string; stripeWebhook: string; paypalWebhook: string };
  kontrol: Madde[]; sayfalar: string[];
  urunler: Record<Mod, { var: boolean; adet: number; fiyatli: number }>;
  siparisSayisi: Record<Mod, number>;
};
type Kalem = { id: string; ad: string; fiyat: number; adet: number; tutar: number };
type Siparis = {
  id: string; olusturma: number; guncelleme: number; siparisNo: string; durum: Durum; tutar: number; paraBirimi: string; saglayici: Saglayici; mod: Mod; kalemler: Kalem[];
  alici: { ad: string; soyad: string; eposta: string; telefon?: string; adres?: string; sehir?: string }; eposta: string;
  odemeKimligi?: string | null; odemeZamani?: string | null; taksit?: number | null; kart?: string | null; hata?: string | null; iadeTutari?: number | null; iadeZamani?: string | null;
  olaylar: { z: number; olay: string; ayrinti?: string }[]; ic?: { urunOrtami?: Mod; kaynak?: string }; uyeId?: string;
};
type Rapor = { ozet: { gelir: number; adet: number; ortalama: number; iade: number; bekleyen: number; basarisiz: number }; gunler: { tarih: string; gelir: number; adet: number }[]; sayac: Record<Durum, number>; siparisler: Siparis[] };

const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
const SERI = "#1e9fcf"; // Analitik ile aynı, koyu zeminde doğrulanmış tek seri; üzerine gelince camgöbeği
/** Tutar: siparişin para birimi verilirse o, yoksa mağazanın ana para birimi (sahip özeti yükleyince dolar). */
let PB = "TRY";
const tl = (n: number, kod?: string) => (kod || PB) === "TRY" ? `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL` : paraYaz(n, kod || PB, "tr-TR");
const kisaTl = (n: number) => (n >= 10_000 ? `${Math.round(n / 1000).toLocaleString("tr-TR")} B` : Math.round(n).toLocaleString("tr-TR"));
const kisaTarih = (t: string) => new Date(t + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
const tamTarih = (z: number | string) => new Date(z).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export const SAGLAYICI: Record<Saglayici, { ad: string; logo: string; alt: string; ozellik: string; anahtarYeri: string; belge: string; testBelge: string }> = {
  stripe: { ad: "Stripe", logo: "/marka/baglanti/stripe.svg", alt: "Dünya geneli birincil seçenek: kartlar, Apple Pay, Google Pay, Link ve yerel yöntemler; 135'ten fazla para birimi.", ozellik: "Kart, cüzdanlar, çok para birimi",
    anahtarYeri: "Stripe Dashboard, Developers, API keys. Webhook imza sırrı Developers, Webhooks bölümünde.", belge: "https://docs.stripe.com/payments/checkout", testBelge: "https://docs.stripe.com/testing" },
  paypal: { ad: "PayPal", logo: "/marka/baglanti/paypal.svg", alt: "PayPal hesabıyla, kartla ya da PayPal Pay Later ile ödeme; alıcı PayPal'ın güvenli sayfasında onaylar.", ozellik: "PayPal hesabı, kart, Pay Later",
    anahtarYeri: "developer.paypal.com, Apps and Credentials. Sandbox ve Live sekmelerinde ayrı Client ID ve Secret; Webhook ID uygulamanın Webhooks bölümünde.", belge: "https://developer.paypal.com/docs/api/orders/v2/", testBelge: "https://developer.paypal.com/tools/sandbox/" },
  iyzico: { ad: "iyzico", logo: "/marka/baglanti/iyzico.svg", alt: "Türkiye için: Türk kartları ve taksitle ödeme; alıcı iyzico'nun güvenli ödeme formunda öder.", ozellik: "Taksit, iyzico ile Öde, Troy",
    anahtarYeri: "iyzico Merchant Panel, Ayarlar, Firma Ayarları, API Anahtarları. Test anahtarları sandbox-merchant.iyzipay.com adresinde.", belge: "https://docs.iyzico.com/odeme-metotlari/odeme-formu", testBelge: "https://docs.iyzico.com/ek-bilgiler/test-kartlari" },
  paytr: { ad: "PayTR", logo: "/marka/baglanti/paytr.svg", alt: "Türkiye için: Türk kartları, taksit ve havale/EFT; ödeme formu sitenin içinde açılır.", ozellik: "Taksit, havale/EFT, tek mağaza bilgisiyle test",
    anahtarYeri: "PayTR Mağaza Paneli, Destek ve Kurulum, Entegrasyon Bilgileri. Test modunda aynı bilgiler kullanılır.", belge: "https://dev.paytr.com/iframe-api", testBelge: "https://dev.paytr.com" },
};
const PAYPAL_OLAYLARI = ["CHECKOUT.ORDER.APPROVED", "PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.REFUNDED"];
const DURUM: Record<Durum, { ad: string; s: string }> = {
  odendi: { ad: "Ödendi", s: "bg-[#55d6fd]/[0.12] text-[#8be6ff]" },
  bekliyor: { ad: "Bekliyor", s: "bg-amber-400/[0.12] text-amber-200" },
  basarisiz: { ad: "Başarısız", s: "bg-rose-500/[0.12] text-rose-200" },
  iade: { ad: "İade edildi", s: "bg-white/[0.08] text-white/70" },
};
const STRIPE_OLAYLARI = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired", "charge.refunded"];

/** Resmî logo, beyaz karoda. iyzico yazı logosu geniş karoda; PayTR ve Stripe işaretleri kare karoda. */
function Logo({ s, genis }: { s: Saglayici; genis?: boolean }) {
  const yazi = genis && s === "iyzico";
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-[10px] bg-white ring-1 ring-inset ring-black/5", yazi ? "h-10 w-[76px] px-2" : genis ? "h-10 w-10 p-2" : s === "iyzico" ? "h-9 w-[54px] px-1.5" : "h-9 w-[54px] px-3 py-1.5")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SAGLAYICI[s].logo} alt={SAGLAYICI[s].ad} className="h-full w-full object-contain" />
    </span>
  );
}
const DurumHap = ({ d }: { d: Durum }) => <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium", DURUM[d].s)}>{DURUM[d].ad}</span>;

/** Günlük gelir çubukları: tek seri (açıklama kutusu yok, başlık adlandırır), üzerine gelince ayrıntı. */
function GelirCubuklari({ g }: { g: Rapor["gunler"] }) {
  const [ust, setUst] = useState<number | null>(null);
  const en = Math.max(1, ...g.map((x) => x.gelir));
  const adim = en <= 4 ? 1 : Math.pow(10, Math.floor(Math.log10(en / 2)));
  const tavan = Math.max(4, Math.ceil(en / (adim * 2)) * adim * 2);
  const izgara = [0, tavan / 2, tavan];
  return (
    <div className="relative">
      <div className="flex">
        <div className="flex h-[180px] w-10 shrink-0 flex-col justify-between pr-2 text-right text-[11px] tabular-nums text-white/35">{[...izgara].reverse().map((v, i) => <span key={i} className={cn(i === 1 && "-translate-y-1/2")}>{kisaTl(v)}</span>)}</div>
        <div className="relative h-[180px] flex-1" onMouseLeave={() => setUst(null)}>
          {izgara.map((v, i) => <span key={i} className="absolute inset-x-0 border-t border-white/[0.06]" style={{ bottom: `${(v / tavan) * 100}%` }} />)}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {g.map((x, i) => (
              <div key={x.tarih} className="relative flex h-full min-w-0 flex-1 items-end" onMouseEnter={() => setUst(i)}>
                <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.35, delay: Math.min(0.3, i * 0.006) }} style={{ originY: 1, height: `${Math.max(x.gelir ? 2 : 0, (x.gelir / tavan) * 100)}%`, background: ust === i ? "#55d6fd" : SERI }} className="w-full rounded-t-[4px] transition-colors" />
              </div>
            ))}
          </div>
          {ust !== null && g[ust] && (
            <div className="pointer-events-none absolute -top-2 z-10 rounded-[12px] bg-[#1b1c1f] px-3 py-2 text-[12px] ring-1 ring-inset ring-white/[0.1]" style={{ left: `${((ust + 0.5) / g.length) * 100}%`, transform: `translate(${ust > g.length * 0.7 ? "-100%" : ust < g.length * 0.3 ? "0" : "-50%"}, -100%)` }}>
              <p className="whitespace-nowrap font-medium text-white">{kisaTarih(g[ust].tarih)}</p>
              <p className="whitespace-nowrap text-white/70"><span className="tabular-nums text-white">{tl(g[ust].gelir)}</span> gelir</p>
              <p className="whitespace-nowrap text-white/50"><span className="tabular-nums">{g[ust].adet.toLocaleString("tr-TR")}</span> ödenen sipariş</p>
            </div>
          )}
        </div>
      </div>
      <div className="ml-10 mt-1.5 flex justify-between text-[11px] text-white/35"><span>{kisaTarih(g[0].tarih)}</span><span>{kisaTarih(g[Math.floor(g.length / 2)].tarih)}</span><span>{kisaTarih(g[g.length - 1].tarih)}</span></div>
    </div>
  );
}

/** Dönem seçici: 7, 30, 90 gün ve Özel (gün sayısı). */
function Donem({ gun, setGun }: { gun: number; setGun: (n: number) => void }) {
  const [ozel, setOzel] = useState(![7, 30, 90].includes(gun));
  return (
    <div className="flex items-center gap-2">
      {ozel && <label className="flex items-center gap-1.5 text-[12.5px] text-white/55"><input type="number" min={1} max={365} defaultValue={gun} onBlur={(e) => setGun(Math.max(1, Math.min(365, Number(e.target.value) || 30)))} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} className="h-8 w-16 rounded-full bg-white/[0.06] px-3 text-center text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] focus:ring-white/30" />gün</label>}
      <LayoutGroup id="odeme-donem">
        <div className="flex rounded-full bg-white/[0.07] p-0.5">
          {[7, 30, 90].map((x) => (
            <button key={x} type="button" onClick={() => { setOzel(false); setGun(x); }} className={cn("relative h-7 rounded-full px-2.5 text-[12px] font-medium", !ozel && gun === x ? "text-black" : "text-white/60 hover:text-white")}>
              {!ozel && gun === x && <motion.span layoutId="odeme-donem-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}<span className="relative whitespace-nowrap">{x} gün</span>
            </button>
          ))}
          <button type="button" onClick={() => setOzel(true)} className={cn("relative h-7 rounded-full px-2.5 text-[12px] font-medium", ozel ? "text-black" : "text-white/60 hover:text-white")}>
            {ozel && <motion.span layoutId="odeme-donem-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">Özel</span>
          </button>
        </div>
      </LayoutGroup>
    </div>
  );
}

/** Vayra Ödeme bölümü (Bulut): sağlayıcı, anahtarlar, bildirim adresleri, gelir, siparişler, iade, canlıya geçiş listesi. */
export function Odemeler({ k, ajana }: { k: ProjeKanca; ajana: (metin: string) => void }) {
  const p = k.proje!;
  const kok = `/api/build/odeme/${p.id}`;
  const [o, setO] = useState<Ozet | null>(null);
  const [gorunum, setGorunum] = useState<Mod | null>(null);
  const [gun, setGun] = useState(30);
  const [r, setR] = useState<Rapor | null>(null);
  const [hata, setHata] = useState("");
  const [isleniyor, setIsleniyor] = useState<string | null>(null);
  const [secili, setSecili] = useState<Siparis | null>(null);
  const kurulumRef = useRef<HTMLDivElement>(null);

  const getir = useCallback(async () => {
    try { const v = await api<Ozet>(kok); if (v.paraBirimi) PB = v.paraBirimi; setO(v); setGorunum((g) => g ?? v.ayar.mod); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yüklenemedi."); }
  }, [kok]);
  const raporGetir = useCallback(async () => {
    if (!gorunum) return;
    try { setR(await api<Rapor>(`${kok}/siparisler?ortam=${gorunum}&gun=${gun}`)); } catch { setR(null); }
  }, [kok, gorunum, gun]);
  useEffect(() => { getir(); }, [getir]);
  useEffect(() => { raporGetir(); }, [raporGetir]);
  useEffect(() => { if (!hata) return; const t = setTimeout(() => setHata(""), 6000); return () => clearTimeout(t); }, [hata]);

  const islem = async (ad: string, govde: Record<string, unknown>) => {
    setIsleniyor(ad); setHata("");
    try { const v = await api<Record<string, unknown>>(kok, { govde }); await Promise.all([getir(), raporGetir()]); return v; }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "İşlem yapılamadı."); return null; }
    finally { setIsleniyor(null); }
  };

  if (!o || !gorunum) return <div className="flex h-40 items-center justify-center">{hata ? <p className="text-[13px] text-rose-200">{hata}</p> : <Loader2 className="h-5 w-5 animate-spin text-white/40" />}</div>;
  const s = o.ayar.saglayici;
  const eksikZorunlu = o.kontrol.filter((m) => m.zorunlu && m.durum === "eksik");
  const onizleme = `/api/build/onizleme/${p.id}/${p.onizlemeBelirteci}/`;

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-4">
        {/* Durum */}
        <Kart ikon={CreditCard} baslik="Ödemeler" alt={s ? `${SAGLAYICI[s].ad} · yayındaki site ${o.ayar.mod === "canli" ? "canlı ödeme alıyor" : "test modunda"} · son ${gun} gün` : "Sitende Stripe, PayPal, iyzico ya da PayTR ile ödeme al"}
          sag={<Secici id="odeme-gorunum" kucuk deger={gorunum} set={(x) => { setGorunum(x); setR(null); }} l={[{ id: "test", ad: "Test" }, { id: "canli", ad: "Canlı" }]} />}>
          {gorunum === "test" && <p className="border-b border-amber-300/10 bg-amber-400/[0.06] px-4 py-2 text-[12.5px] text-amber-100/90 sm:px-5">Test görünümü: buradaki siparişler test ödemeleridir, kartlardan para çekilmez. Önizlemedeki ödemeler her zaman testtir.</p>}
          {!s ? (
            <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
              <p className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-white/65">Kart bilgisi Vayra&apos;ya hiç uğramaz: alıcı sağlayıcının güvenli sayfasında öder, sonuç sunucuda imzasıyla doğrulanır. Fiyatlar tarayıcıdan değil, ürün tablosundan okunur.</p>
              <button type="button" onClick={() => kurulumRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><KeyRound className="h-3.5 w-3.5" />Sağlayıcı seç</button>
              <button type="button" onClick={() => ajana("Siteme Vayra Ödeme ile sepet ve ödeme akışı kur: ürünler urunler tablosundan gelsin, sepete ekle, alıcı bilgisi formu, vayra.odeme.ode ile ödeme, teşekkür ve ödeme hatası sayfaları.")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13]"><Sparkles className="h-3.5 w-3.5 text-[#8be6ff]" />Ödeme akışını ajana kurdur</button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 p-4 sm:p-5">
              <span className="flex min-w-0 items-center gap-3 max-lg:flex-1"><Logo s={s} genis /><span><span className="block text-[14px] font-semibold text-white">{SAGLAYICI[s].ad}</span><span className={cn("mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[11.5px] font-medium", o.ayar.mod === "canli" ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-amber-400/[0.12] text-amber-200")}>{o.ayar.mod === "canli" ? "Canlı" : "Test modu"}</span></span></span>
              <span className="lg:order-last">
              {o.ayar.mod === "canli"
                ? <button type="button" disabled={!!isleniyor} onClick={() => islem("mod", { islem: "teste" })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13]">{isleniyor === "mod" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}Test moduna al</button>
                : <button type="button" disabled={!!isleniyor || eksikZorunlu.length > 0} title={eksikZorunlu.length ? "Canlıya geçiş listesindeki zorunlu maddeleri tamamla" : undefined} onClick={() => islem("mod", { islem: "canliyaGec" })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:bg-white/[0.08] disabled:text-white/40">{isleniyor === "mod" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Canlıya geç</button>}
              </span>
              <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 lg:w-auto lg:min-w-0 lg:flex-1">
                {[["Gelir", r ? tl(r.ozet.gelir) : "…"], ["Ödenen sipariş", r ? r.ozet.adet.toLocaleString("tr-TR") : "…"], ["Ortalama sepet", r ? tl(r.ozet.ortalama) : "…"], ["İade", r ? tl(r.ozet.iade) : "…"]].map(([a, b]) => (
                  <div key={a}><dt className="whitespace-nowrap text-[12px] text-white/45">{a}</dt><dd className="whitespace-nowrap text-[18px] font-semibold tabular-nums tracking-[-0.02em] text-white">{b}</dd></div>
                ))}
              </dl>
            </div>
          )}
          {hata && <p className="border-t border-white/[0.06] px-4 py-2.5 text-[12.5px] text-rose-200 sm:px-5">{hata}</p>}
        </Kart>

        {/* Gelir */}
        {s && (
          <Kart ikon={BarChart3} baslik="Gelir" alt={`${gorunum === "test" ? "Test ödemeleri" : "Canlı ödemeler"}, günlük, iade edilenler hariç`} govde="p-4 sm:p-5">
            {!r ? <div className="flex h-[240px] items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div> : <GelirTablosu r={r} donem={<Donem gun={gun} setGun={setGun} />} />}
          </Kart>
        )}

        {/* Siparişler */}
        {s && <Siparisler r={r} gorunum={gorunum} ac={setSecili} onizleme={onizleme} ajana={ajana} />}

        {/* Kurulum */}
        <div ref={kurulumRef} className="scroll-mt-4">
          <Kurulum o={o} isleniyor={isleniyor} islem={islem} yenile={async () => { await getir(); await k.yukle(); }} />
        </div>

        {s && <BildirimAdresleri o={o} s={s} />}

        {/* Canlıya geçiş listesi */}
        <Kart ikon={ListChecks} baslik="Canlıya geçiş listesi" alt={eksikZorunlu.length ? `${eksikZorunlu.length} zorunlu madde kaldı` : o.ayar.mod === "canli" ? "Yayındaki site canlı ödeme alıyor" : "Zorunlu maddeler tamam; canlıya geçebilirsin"}
          altSerit={s && o.ayar.mod !== "canli" ? <span className="text-[12.5px] text-white/50">Canlıya geçince yayındaki sitede alıcının kartından gerçek tutar çekilir; önizleme yine testte kalır.</span> : undefined}>
          <div className="divide-y divide-white/[0.05]">
            {o.kontrol.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", m.durum === "tamam" ? "bg-[#55d6fd]" : m.durum === "uyari" ? "bg-amber-300" : "ring-2 ring-inset ring-white/30")} />
                <span className="min-w-0 flex-1"><span className="block text-[13.5px] text-white">{m.ad}{!m.zorunlu && <span className="ml-2 text-[11.5px] text-white/40">önerilir</span>}</span><span className="block truncate text-[12px] text-white/45">{m.alt}</span></span>
                {m.id === "urun" && m.durum !== "tamam" && !o.urunler.canli.var && <button type="button" disabled={!!isleniyor} onClick={() => islem("urun", { islem: "urunTablosu", ortam: "canli" })} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]">{isleniyor === "urun" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}Ürün tablosunu kur</button>}
                {m.id === "yasal" && m.durum !== "tamam" && <button type="button" onClick={() => ajana("Siteye Mesafeli Satış Sözleşmesi, İade ve Cayma Koşulları ve Gizlilik (KVKK aydınlatma metni) sayfalarını ekle; alt bilgiden ve ödeme formunun yanından bağlantı ver. Satıcı bilgilerini bilmiyorsan bana sor.")} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><Sparkles className="h-3 w-3 text-[#8be6ff]" /><span className="max-sm:hidden">Ajana yaptır</span><span className="sm:hidden">Ajan</span></button>}
                {m.id === "sayfa" && m.durum !== "tamam" && <button type="button" onClick={() => kurulumRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex h-8 shrink-0 items-center rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]">Seç</button>}
              </motion.div>
            ))}
          </div>
        </Kart>

        {/* Sitede kullan */}
        <Kart ikon={Code2} baslik="Sitede kullan" alt="Build ajanı bu kodu kendisi yazar; ürün fiyatı her zaman sunucuda hesaplanır" govde="space-y-3 p-4 sm:p-5">
          <KodKutusu kod={`// Ödeme düğmesinde (önizlemede yeni sekmede açılır)
await vayra.odeme.ode({
  urunler: [{ id: urun.id, adet: 1 }],
  alici: { ad, soyad, eposta, telefon, adres, sehir },
  basariSayfasi: "${o.ayar.basariSayfasi || "tesekkurler.html"}",
  hataSayfasi: "${o.ayar.hataSayfasi || "odeme-hata.html"}",
});

// Dönüş sayfasında: sonucu sunucudan oku
const siparis = await vayra.odeme.durum(vayra.odeme.siparis());
if (siparis.durum === "odendi") { /* teşekkür et */ }`} />
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["Sepet ve ödeme akışını kur", "Siteme Vayra Ödeme ile sepet ve ödeme akışı kur: ürünler urunler tablosundan gelsin, sepete ekle, alıcı bilgisi formu (ad, soyad, e-posta, telefon, adres, şehir), vayra.odeme.ode ile ödeme, teşekkür ve ödeme hatası sayfaları vayra.odeme.durum ile sonucu göstersin."],
              ["Ürünleri tabloya ekle", "urunler tablosunu ad, fiyat (sayı), aciklama, gorsel, stok (sayı), aktif (evet/hayır) sütunlarıyla kur, okuma herkese açık, ekleme ve düzenleme kapalı olsun; sitedeki ürünleri bu tabloya ekle ve sayfaları tablodan okuyacak şekilde değiştir."],
              ["Teşekkür ve hata sayfaları", "Ödeme sonrası için tesekkurler.html ve odeme-hata.html sayfalarını yap; vayra.odeme.siparis() ile sipariş numarasını al, vayra.odeme.durum ile durumu göster, bekliyorsa birkaç saniyede bir yenile."],
              ["Sipariş e-postası sistemi", "Ödeme alınınca alıcıya sipariş özetini e-postayla gönderen bir sistem kur: tetik siparisler tablosuna yeni kayıt."],
            ].map(([a, istem]) => (
              <button key={a} type="button" onClick={() => ajana(istem)} className="flex items-center gap-2.5 rounded-[16px] bg-white/[0.03] px-3.5 py-3 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.06]"><Sparkles className="h-4 w-4 shrink-0 text-[#8be6ff]" /><span className="text-[13px] text-white/85">{a}</span></button>
            ))}
          </div>
        </Kart>
      </div>

      <SiparisPaneli s={secili} kapat={() => setSecili(null)} isle={async (ad, no) => { const v = await islem(ad, { islem: ad, siparisNo: no }); if (v?.siparis) setSecili(v.siparis as Siparis); }} isleniyor={isleniyor} />
    </MotionConfig>
  );
}

function GelirTablosu({ r, donem }: { r: Rapor; donem: React.ReactNode }) {
  const [tablo, setTablo] = useState(false);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {donem}
        <p className="min-w-0 flex-1 text-[12.5px] text-white/50 max-sm:order-last max-sm:basis-full">{r.ozet.bekleyen ? `${r.ozet.bekleyen} bekleyen, ` : ""}{r.ozet.basarisiz} başarısız ödeme bu dönemde</p>
        <button type="button" onClick={() => setTablo((x) => !x)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px]", tablo ? "bg-white text-black" : "bg-white/[0.08] text-white/70 hover:text-white")}><Table2 className="h-3.5 w-3.5" />Tablo</button>
      </div>
      {tablo ? (
        <div className="max-h-[260px] overflow-y-auto [scrollbar-width:thin]">
          <table className="w-full text-[12.5px]"><thead><tr className="text-left text-white/45"><th className="pb-1.5 font-medium">Gün</th><th className="pb-1.5 text-right font-medium">Gelir</th><th className="pb-1.5 text-right font-medium">Sipariş</th></tr></thead>
            <tbody>{[...r.gunler].reverse().map((x) => <tr key={x.tarih} className="border-t border-white/[0.05]"><td className="py-1.5 text-white/70">{kisaTarih(x.tarih)}</td><td className="py-1.5 text-right tabular-nums text-white">{tl(x.gelir)}</td><td className="py-1.5 text-right tabular-nums text-white/60">{x.adet}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <GelirCubuklari g={r.gunler} />}
    </div>
  );
}

function Siparisler({ r, gorunum, ac, onizleme, ajana }: { r: Rapor | null; gorunum: Mod; ac: (s: Siparis) => void; onizleme: string; ajana: (m: string) => void }) {
  const [suz, setSuz] = useState<Durum | "hepsi">("hepsi");
  const [ara, setAra] = useState("");
  const l = useMemo(() => {
    const a = ara.trim().toLocaleLowerCase("tr");
    return (r?.siparisler ?? []).filter((x) => (suz === "hepsi" || x.durum === suz) && (!a || [x.siparisNo, x.eposta, x.alici?.ad, x.alici?.soyad, ...x.kalemler.map((y) => y.ad)].some((v) => String(v ?? "").toLocaleLowerCase("tr").includes(a))));
  }, [r, suz, ara]);
  const toplam = r?.siparisler.length ?? 0;
  return (
    <Kart ikon={ShoppingBag} baslik="Siparişler" alt={`${gorunum === "test" ? "Test" : "Canlı"} veritabanındaki siparisler tablosu, yeniden eskiye`}
      sag={<label className="relative max-sm:hidden"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Sipariş, alıcı, ürün" className="h-8 w-[200px] rounded-full bg-white/[0.05] pl-8 pr-3 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-white/40 focus:ring-white/25" /></label>}>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
        <Hap secili={suz === "hepsi"} onClick={() => setSuz("hepsi")} sayi={toplam}>Tümü</Hap>
        {(["odendi", "bekliyor", "basarisiz", "iade"] as Durum[]).map((d) => <Hap key={d} secili={suz === d} onClick={() => setSuz(d)} sayi={r?.sayac[d] ?? 0}>{DURUM[d].ad}</Hap>)}
        <label className="relative w-full sm:hidden"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Sipariş, alıcı, ürün" className="h-9 w-full rounded-full bg-white/[0.05] pl-8 pr-3 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-white/40 focus:ring-white/25" /></label>
      </div>
      {!r ? <div className="flex h-24 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div>
        : !toplam ? (
          <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
            <p className="min-w-0 flex-1 text-[13px] text-white/60">{gorunum === "test" ? "Henüz test siparişi yok. Önizlemede ödeme düğmesine bas; sipariş burada belirir." : "Henüz canlı sipariş yok. Canlıya geçince yayındaki sitenin ödemeleri burada görünür."}</p>
            <a href={onizleme} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><ExternalLink className="h-3.5 w-3.5" />Önizlemede dene</a>
            <button type="button" onClick={() => ajana("Önizlemede ödeme akışını tarayıcı testiyle dene: bir ürünü sepete ekle, alıcı bilgilerini gerçekçi Türkçe verilerle doldur ve ödeme sayfasının açıldığını doğrula.")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13]"><Sparkles className="h-3.5 w-3.5 text-[#8be6ff]" />Ajana denet</button>
          </div>
        ) : !l.length ? <p className="px-5 py-4 text-[13px] text-white/50">Bu süzgece uyan sipariş yok.</p> : (
          <div className="divide-y divide-white/[0.05]">
            <AnimatePresence initial={false}>
              {l.slice(0, 100).map((x) => (
                <motion.button layout key={x.id} type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => ac(x)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.025] sm:px-5">
                  <Logo s={x.saglayici} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-white">{x.alici?.ad} {x.alici?.soyad}<span className="ml-2 text-[12px] text-white/40 max-sm:hidden">{x.siparisNo}</span></span>
                    <span className="block truncate text-[12px] text-white/45">{x.kalemler.map((y) => `${y.ad}${y.adet > 1 ? `, ${y.adet} adet` : ""}`).join(" · ")}</span>
                  </span>
                  <span className="shrink-0 text-right"><span className="block text-[13.5px] font-medium tabular-nums text-white">{tl(x.tutar, x.paraBirimi)}</span><span className="block text-[11.5px] text-white/40 max-sm:hidden">{gorece(x.olusturma)}</span><span className="mt-1 block sm:hidden"><DurumHap d={x.durum} /></span></span>
                  <span className="max-sm:hidden"><DurumHap d={x.durum} /></span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
    </Kart>
  );
}

function SiparisPaneli({ s, kapat, isle, isleniyor }: { s: Siparis | null; kapat: () => void; isle: (ad: "iade" | "sorgula", no: string) => Promise<void>; isleniyor: string | null }) {
  const [onay, setOnay] = useState(false);
  useEffect(() => { setOnay(false); }, [s?.siparisNo]);
  return (
    <YanPanel acik={!!s} kapat={kapat} baslik={s ? `Sipariş ${s.siparisNo}` : ""} alt={s ? `${DURUM[s.durum].ad} · ${tamTarih(s.olusturma)}${s.mod === "test" ? " · test" : ""}` : ""}
      alt2={s && (s.durum === "odendi" || s.durum === "bekliyor") ? (
        s.durum === "bekliyor"
          ? <><span className="min-w-0 flex-1 text-[12.5px] text-white/50">Alıcı dönmeden sekmeyi kapattıysa sonucu sağlayıcıdan sorgula.</span><button type="button" disabled={!!isleniyor} onClick={() => isle("sorgula", s.siparisNo)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-black disabled:opacity-50">{isleniyor === "sorgula" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}Durumu sorgula</button></>
          : onay
            ? <><span className="min-w-0 flex-1 text-[12.5px] text-white/60">{tl(s.tutar, s.paraBirimi)} alıcının kartına {SAGLAYICI[s.saglayici].ad} üzerinden geri gönderilir.</span><button type="button" onClick={() => setOnay(false)} className="inline-flex h-10 items-center rounded-full px-4 text-[13px] text-white/60 hover:bg-white/[0.06]">Vazgeç</button><button type="button" disabled={!!isleniyor} onClick={() => isle("iade", s.siparisNo)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-rose-500/20 px-5 text-[13px] font-semibold text-rose-100 disabled:opacity-50">{isleniyor === "iade" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Evet, iade et</button></>
            : <><span className="flex-1" /><button type="button" onClick={() => setOnay(true)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] px-5 text-[13px] text-white hover:bg-white/[0.13]"><RotateCcw className="h-3.5 w-3.5" />Tamamını iade et</button></>
      ) : undefined}>
      {s && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
            <Logo s={s.saglayici} genis />
            <span className="min-w-0 flex-1"><span className="block text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-white">{tl(s.tutar, s.paraBirimi)}</span><span className="block text-[12px] text-white/45">{s.kalemler.reduce((t, x) => t + x.adet, 0)} ürün{s.taksit && s.taksit > 1 ? ` · ${s.taksit} taksit` : ""}</span></span>
            <DurumHap d={s.durum} />
          </div>
          {s.hata && s.durum !== "odendi" && <p className="rounded-[12px] bg-rose-500/[0.08] px-3 py-2 text-[12.5px] text-rose-100 ring-1 ring-inset ring-rose-400/15">{s.hata}</p>}
          <section>
            <h3 className="mb-1 text-[13px] font-semibold text-white">Ürünler</h3>
            <div className="divide-y divide-white/[0.05]">{s.kalemler.map((x) => <div key={x.id} className="flex items-center gap-3 py-2 text-[13px]"><span className="min-w-0 flex-1 truncate text-white/85">{x.ad}</span><span className="shrink-0 text-white/45">{x.adet} adet, birim {tl(x.fiyat)}</span><span className="w-[96px] shrink-0 text-right tabular-nums text-white">{tl(x.tutar, s.paraBirimi)}</span></div>)}</div>
          </section>
          <section>
            <h3 className="mb-1 text-[13px] font-semibold text-white">Alıcı</h3>
            <dl className="divide-y divide-white/[0.05]">
              <Alan ad="Ad soyad">{s.alici?.ad} {s.alici?.soyad}</Alan>
              <Alan ad="E-posta">{s.eposta}</Alan>
              {s.alici?.telefon && <Alan ad="Telefon">{s.alici.telefon}</Alan>}
              {s.alici?.adres && <Alan ad="Adres">{s.alici.adres}{s.alici.sehir ? `, ${s.alici.sehir}` : ""}</Alan>}
              {s.uyeId && <Alan ad="Üye">{s.uyeId}</Alan>}
            </dl>
          </section>
          <section>
            <h3 className="mb-1 text-[13px] font-semibold text-white">Ödeme</h3>
            <dl className="divide-y divide-white/[0.05]">
              <Alan ad="Sağlayıcı">{SAGLAYICI[s.saglayici].ad}, {s.mod === "test" ? "test" : "canlı"}</Alan>
              {s.odemeKimligi && <Alan ad="Ödeme kimliği">{s.odemeKimligi}</Alan>}
              {s.kart && <Alan ad="Kart">{s.kart}</Alan>}
              {s.odemeZamani && <Alan ad="Ödendi">{tamTarih(s.odemeZamani)}</Alan>}
              {s.iadeZamani && <Alan ad="İade">{tl(s.iadeTutari ?? s.tutar, s.paraBirimi)}, {tamTarih(s.iadeZamani)}</Alan>}
              {s.ic?.kaynak && <Alan ad="Sayfa">{s.ic.kaynak}</Alan>}
            </dl>
          </section>
          <section>
            <h3 className="mb-2 text-[13px] font-semibold text-white">Geçmiş</h3>
            <ol className="space-y-2.5 border-l border-white/[0.08] pl-4">
              {[...(s.olaylar ?? [])].reverse().map((x, i) => (
                <li key={i} className="relative"><span className={cn("absolute -left-[21px] top-1.5 h-2 w-2 rounded-full", i === 0 ? "bg-[#55d6fd]" : "bg-white/25")} /><p className="text-[13px] text-white/85">{x.olay}</p><p className="text-[11.5px] text-white/40">{tamTarih(x.z)}{x.ayrinti ? ` · ${x.ayrinti}` : ""}</p></li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </YanPanel>
  );
}

const TAKSIT_HAZIR: { id: string; ad: string }[] = [{ id: "1", ad: "Tek çekim" }, { id: "3", ad: "3 taksit" }, { id: "6", ad: "6 taksit" }, { id: "12", ad: "12 taksit" }, { id: "ozel", ad: "Özel" }];

function Kurulum({ o, isleniyor, islem, yenile }: { o: Ozet; isleniyor: string | null; islem: (ad: string, g: Record<string, unknown>) => Promise<Record<string, unknown> | null>; yenile: () => Promise<void> }) {
  const s = o.ayar.saglayici;
  const [degerler, setDegerler] = useState<Record<string, string>>({});
  const [taksitOzel, setTaksitOzel] = useState(![1, 3, 6, 12].includes(o.ayar.taksit));
  const [sayfaOzel, setSayfaOzel] = useState<{ basari: boolean; hata: boolean }>({ basari: !!o.ayar.basariSayfasi && !o.sayfalar.includes(o.ayar.basariSayfasi), hata: !!o.ayar.hataSayfasi && !o.sayfalar.includes(o.ayar.hataSayfasi) });
  const dolu = Object.values(degerler).some((v) => v.trim());
  const sayfaListesi = [...o.sayfalar.map((y) => ({ id: y, ad: y })), { id: "__ozel", ad: "Özel", alt: "Sorgu ya da alt klasörlü yol yaz" }];
  const kaydet = async () => { const v = await islem("anahtar", { islem: "anahtar", anahtarlar: degerler }); if (v) { setDegerler({}); await yenile(); } };
  const SIR = { var: { ad: "Tanımlı", s: "bg-[#55d6fd]/[0.12] text-[#8be6ff]" }, yok: { ad: "Eksik", s: "bg-white/[0.07] text-white/55" }, acik: { ad: "Herkese açık", s: "bg-rose-500/[0.14] text-rose-200" }, canlidan: { ad: "Canlı alandaki kullanılır", s: "bg-white/[0.07] text-white/55" } } as const;
  const anahtarAlani = (ad: string, durum: keyof typeof SIR) => (
    <label key={ad} className="block min-w-0 flex-1">
      <span className="mb-1 flex items-center gap-2 text-[11.5px] text-white/45"><span className="truncate">{ad}</span><span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium", SIR[durum].s)}>{SIR[durum].ad}</span></span>
      <input type="password" autoComplete="off" value={degerler[ad] ?? ""} onChange={(e) => setDegerler((d) => ({ ...d, [ad]: e.target.value }))} placeholder={durum === "var" ? "Değiştirmek için yeni değeri yapıştır" : "Değeri yapıştır"} className={cn(alanSinif, "h-10 text-[13px]")} />
    </label>
  );
  return (
    <Kart ikon={Wallet} baslik="Sağlayıcı ve anahtarlar" alt="Anahtarlar sunucu sırrı olarak saklanır; siteye ve ajana hiç gitmez">
      <div className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {SIRA.map((x) => (
            <button key={x} type="button" disabled={!!isleniyor} onClick={() => x !== s && islem("ayar", { islem: "ayar", saglayici: x })} aria-pressed={s === x}
              className={cn("relative flex flex-col gap-3 rounded-[18px] p-4 text-left transition-colors", s === x ? "bg-white/[0.07] ring-1 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.05]")}>
              <Logo s={x} genis />
              <span><span className="block text-[14px] font-semibold text-white">{SAGLAYICI[x].ad}</span><span className="mt-0.5 block text-[12.5px] leading-snug text-white/55">{SAGLAYICI[x].alt}</span></span>
              <span className="text-[11.5px] text-white/40">{SAGLAYICI[x].ozellik}</span>
            </button>
          ))}
        </div>

        {s && (
          <div className="rounded-[18px] bg-white/[0.025] px-4 py-3 ring-1 ring-inset ring-white/[0.06]">
            <p className="text-[13px] font-medium text-white/85">Ödeme adımında ayrıca sun</p>
            <p className="mt-0.5 text-[12px] text-white/45">{SAGLAYICI[s].ad} birincil yöntemdir. Seçtiğin sağlayıcılar alıcıya ek seçenek olarak çıkar; anahtarlarını aşağıda sağlayıcıyı seçip girebilirsin.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SIRA.filter((x) => x !== s).map((x) => { const ek = o.ayar.ekSaglayicilar ?? [], acik = ek.includes(x); return (
                <button key={x} type="button" disabled={!!isleniyor} onClick={() => islem("ayar", { islem: "ayar", ekSaglayicilar: acik ? ek.filter((y) => y !== x) : [...ek, x] })} aria-pressed={acik}
                  className={cn("inline-flex h-9 items-center gap-2 rounded-full pl-1 pr-3 text-[12.5px] font-medium", acik ? "bg-[#55d6fd]/[0.12] text-[#c9f3ff] ring-1 ring-inset ring-[#55d6fd]/40" : "bg-white/[0.05] text-white/70 hover:bg-white/[0.09]")}>
                  <span className="flex h-7 w-10 items-center justify-center rounded-full bg-white px-1.5">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={SAGLAYICI[x].logo} alt="" className="h-full w-full object-contain" /></span>{SAGLAYICI[x].ad}
                </button>
              ); })}
            </div>
          </div>
        )}
        {s && (
          <section className="rounded-[18px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.06]">
            <header className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3">
              <KeyRound className="h-4 w-4 text-white/50" /><h3 className="text-[13.5px] font-semibold text-white">{SAGLAYICI[s].ad} anahtarları</h3>
              <span className="flex-1" />
              <a href={SAGLAYICI[s].belge} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-white/50 hover:text-white">Resmî belge<ExternalLink className="h-3 w-3" /></a>
            </header>
            <div className="space-y-3 px-4 py-3.5">
              <p className="text-[12.5px] leading-relaxed text-white/50">{SAGLAYICI[s].anahtarYeri}</p>
              {o.anahtarlar[s].map((a) => (
                <div key={a.ad} className="space-y-1.5">
                  <p className="text-[13px] font-medium text-white/85">{a.etiket}</p>
                  <div className="flex gap-2 max-sm:flex-col">
                    {anahtarAlani(a.ad, a.canli)}
                    {o.testAyri[s] && anahtarAlani(`${a.ad}_TEST`, a.test)}
                  </div>
                  {a.uyari && <p className="text-[12px] text-amber-200/90">{a.uyari}</p>}
                </div>
              ))}
            </div>
            <footer className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-4 py-3">
              <p className="min-w-0 flex-1 text-[12px] text-white/45">{o.testAyri[s] ? "_TEST ile biten alanlar test modunda kullanılır; boşsa canlı alandaki değer denenir." : "Test modunda aynı mağaza bilgileri test_mode ile gönderilir."}</p>
              {dolu && <button type="button" disabled={!!isleniyor} onClick={kaydet} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-50">{isleniyor === "anahtar" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Anahtarları kaydet</button>}
            </footer>
          </section>
        )}

        {s && (
          <div className="grid gap-4 md:grid-cols-2">
            {(["basari", "hata"] as const).map((t) => {
              const alan = t === "basari" ? "basariSayfasi" : "hataSayfasi";
              const deger = o.ayar[alan];
              return (
                <div key={t} className="space-y-1.5">
                  <p className="text-[13px] font-medium text-white/85">{t === "basari" ? "Ödeme sonrası dönülecek sayfa" : "Ödeme olmazsa dönülecek sayfa"}</p>
                  <AcilirSecim deger={sayfaOzel[t] ? "__ozel" : deger} bos="Seç" l={sayfaListesi} set={(v) => { if (v === "__ozel") setSayfaOzel((x) => ({ ...x, [t]: true })); else { setSayfaOzel((x) => ({ ...x, [t]: false })); islem("ayar", { islem: "ayar", [alan]: v }); } }} />
                  {sayfaOzel[t] && <input defaultValue={deger} placeholder="siparis/tesekkurler.html" onBlur={(e) => e.target.value !== deger && islem("ayar", { islem: "ayar", [alan]: e.target.value })} className={cn(alanSinif, "h-10 text-[13px]")} />}
                  <p className="text-[12px] text-white/40">{t === "hata" ? "Dönüş adresine sipariş numarası ve hata sebebi eklenir." : "Dönüş adresine sipariş numarası eklenir; sayfa sonucu vayra.odeme.durum ile okur."}</p>
                </div>
              );
            })}
            <div className="space-y-1.5 md:col-span-2">
              <p className="text-[13px] font-medium text-white/85">Taksit</p>
              <div className="flex flex-wrap items-center gap-2">
                <Secici id="odeme-taksit" deger={taksitOzel ? "ozel" : String(o.ayar.taksit)} set={(v) => { if (v === "ozel") setTaksitOzel(true); else { setTaksitOzel(false); islem("ayar", { islem: "ayar", taksit: Number(v) }); } }} l={TAKSIT_HAZIR} />
                {taksitOzel && <label className="flex items-center gap-2 text-[12.5px] text-white/55">En çok<input type="number" min={2} max={12} defaultValue={o.ayar.taksit > 1 ? o.ayar.taksit : 9} onBlur={(e) => islem("ayar", { islem: "ayar", taksit: Math.max(2, Math.min(12, Number(e.target.value) || 2)) })} className="h-8 w-16 rounded-full bg-white/[0.06] px-3 text-center text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] focus:ring-white/30" />taksit</label>}
              </div>
              <p className="text-[12px] text-white/40">{s === "iyzico" ? "iyzico 2, 3, 6, 9 ve 12 taksit sunar; seçtiğin sayıya kadar olanlar açılır." : s === "paytr" ? "PayTR en çok taksit sayısını alıcının kartına göre gösterir." : s === "paypal" ? "PayPal'da taksit yerine PayPal Pay Later seçenekleri PayPal sayfasında çıkar; tek çekim alınır." : "Stripe Checkout'ta taksit yok; tek çekim alınır."}</p>
            </div>
          </div>
        )}
      </div>
    </Kart>
  );
}

function BildirimAdresleri({ o, s }: { o: Ozet; s: Saglayici }) {
  const z = Math.max(o.ayar.sonBildirim?.[`${s}-test`] ?? 0, o.ayar.sonBildirim?.[`${s}-canli`] ?? 0);
  return (
    <Kart ikon={Radio} baslik="Bildirim adresleri" alt={s === "iyzico" ? "iyzico sonucu geri dönüşte sunucudan doğrulanır" : z ? `Son doğrulanmış bildirim ${gorece(z)}` : "Henüz doğrulanmış bildirim gelmedi"} govde="space-y-3 p-4 sm:p-5">
      {s === "iyzico" && <>
        <p className="text-[13px] leading-relaxed text-white/60">Geri dönüş adresi her ödemede iyzico&apos;ya kendiliğinden gönderilir; panelde bir şey ayarlaman gerekmez. Alıcı dönünce sonuç ve imza iyzico&apos;dan sorgulanır.</p>
        <KodKutusu kod={o.adresler.iyzicoDonus} />
      </>}
      {s === "paytr" && <>
        <p className="text-[13px] leading-relaxed text-white/60">PayTR Mağaza Paneli, Destek ve Kurulum, Ayarlar bölümündeki Bildirim URL alanına yapıştır. Her bildirimin imzası doğrulanır; yanıt olarak yalnız OK döner.</p>
        <KodKutusu kod={o.adresler.paytrBildirim} />
      </>}
      {s === "paypal" && <>
        <p className="text-[13px] leading-relaxed text-white/60">developer.paypal.com, Apps and Credentials, uygulaman, Webhooks bölümünde bu adresi ekle ve Webhook ID'yi yukarıdaki alana gir. Her bildirimin imzası PayPal'a sorularak doğrulanır. Webhook olmadan da ödeme, alıcı dönünce tahsil edilip doğrulanır. Seçilecek olaylar:</p>
        <KodKutusu kod={o.adresler.paypalWebhook} />
        <div className="flex flex-wrap gap-1.5">{PAYPAL_OLAYLARI.map((x) => <span key={x} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-white/70 ring-1 ring-inset ring-white/[0.07]">{x}</span>)}</div>
      </>}
      {s === "stripe" && <>
        <p className="text-[13px] leading-relaxed text-white/60">Stripe Dashboard, Developers, Webhooks bölümünde uç nokta ekle ve imza sırrını (whsec_) yukarıdaki alana gir. Seçilecek olaylar:</p>
        <KodKutusu kod={o.adresler.stripeWebhook} />
        <div className="flex flex-wrap gap-1.5">{STRIPE_OLAYLARI.map((x) => <span key={x} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-white/70 ring-1 ring-inset ring-white/[0.07]">{x}</span>)}</div>
      </>}
    </Kart>
  );
}
