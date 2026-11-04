"use client";

/**
 * Earn › Davet parçaları (2026-10-29, seçilen "A · Tek odak"; Revolut davet + Notion ortaklık sayfaları incelendi):
 * dev davet bağlantısı + gerçek logolu paylaş düğmeleri, değiştirilebilir kupon kodu,
 * her kartta ürünün gerçek anı olan 3 adım, kademe yolu, davet ettiklerin.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Pencil, Share2, UserRound } from "lucide-react";
import { useEarn, type Davetli } from "@/store/useEarn";
import { tl, KOMISYON_KADEMELERI, DAVET_INDIRIM } from "@/lib/earn/kampanyalar";
import { OrnekRozet, Sayac, ease, yay, yuzey } from "./ui";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export const ORNEK_KISI = ["/gercek/gorsel/gorsel-karakter-Aria.webp", "/gercek/gorsel/gorsel-karakter-Leo.webp", "/gercek/gorsel/gorsel-karakter-Emma.webp", "/gercek/gorsel/gorsel-karakter-Kai.webp", "/gercek/gorsel/gorsel-karakter-Sofia.webp"];
export const MADALYA: Record<string, string> = { Bronz: "#d9a066", Gümüş: "#cfd6de", Altın: "#f5c84c" };

export function kademe(aylikOdeme: number) {
  const k = [...KOMISYON_KADEMELERI].reverse().find((x) => aylikOdeme >= x.minAylik) ?? KOMISYON_KADEMELERI[0];
  return { k, sonraki: KOMISYON_KADEMELERI[KOMISYON_KADEMELERI.indexOf(k) + 1] ?? null };
}

async function kopyala(metin: string, mesaj: string) {
  try { await navigator.clipboard.writeText(metin); toast.success(mesaj); return true; } catch { toast.error("Kopyalanamadı", { description: "Tarayıcı panoya erişime izin vermedi; metni elle seç." }); return false; }
}

/* ── Dev bağlantı kutusu ── */
export function BaglantiKutusu({ deger, gorunen }: { deger: string; gorunen: string }) {
  const [tamam, setTamam] = useState(false);
  return (
    <div className="flex h-16 items-center gap-2 rounded-full bg-white/[0.05] pl-6 pr-2 ring-1 ring-white/[0.12] transition focus-within:ring-white/25">
      <span className="min-w-0 flex-1 truncate text-left text-[17px] font-medium text-white sm:text-[18px]">{gorunen}</span>
      <button onClick={async () => { if (await kopyala(deger, "Davet bağlantısı kopyalandı")) { setTamam(true); setTimeout(() => setTamam(false), 1600); } }}
        className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]">
        <AnimatePresence mode="wait" initial={false}>
          {tamam ? <motion.span key="o" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1.5"><Check className="h-4 w-4" strokeWidth={3} />Kopyalandı</motion.span>
            : <motion.span key="c" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1.5"><Copy className="h-4 w-4" />Kopyala</motion.span>}
        </AnimatePresence>
      </button>
    </div>
  );
}

/* ── Paylaş düğmeleri (gerçek logolar) ── */
export function PaylasDugmeleri({ link }: { link: string }) {
  const metin = `Vayra'da görsel, video ve müzik üretiyorum. Bu bağlantıyla katılırsan ilk plan ödemende %${Math.round(DAVET_INDIRIM * 100)} indirim kazanırsın:`;
  const k = encodeURIComponent(`${metin} ${link}`);
  const paylas = async () => {
    if (navigator.share) { try { await navigator.share({ title: "Vayra daveti", text: metin, url: link }); } catch { /* vazgeçti */ } }
    else void kopyala(`${metin} ${link}`, "Davet metni kopyalandı");
  };
  const d = "flex h-11 items-center gap-2 rounded-full bg-white/[0.05] px-4 text-[13.5px] font-medium text-white ring-1 ring-white/[0.1] transition hover:bg-white/[0.1] active:scale-[0.97]";
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {[
        { ad: "WhatsApp", logo: "/marka/whatsapp.svg", href: `https://wa.me/?text=${k}` },
        { ad: "X", logo: "/marka/x.svg", href: `https://x.com/intent/post?text=${k}`, ters: true },
        { ad: "Telegram", logo: "/marka/telegram.svg", href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(metin)}` },
      ].map((x) => (
        <a key={x.ad} href={x.href} target="_blank" rel="noopener noreferrer" className={d}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={x.logo} alt="" className={cn("h-4 w-4", x.ters && "invert")} />{x.ad}
        </a>
      ))}
      <button onClick={paylas} className={d}><Share2 className="h-4 w-4" />Diğer</button>
    </div>
  );
}

/* ── Kupon kodu (değiştirilebilir) ── */
export function KuponSatiri() {
  const { kuponKodu, kuponDegistir } = useEarn();
  const [duzenle, setDuzenle] = useState(false);
  const [deger, setDeger] = useState(kuponKodu);
  const [tamam, setTamam] = useState(false);
  const gecerli = /^[A-Z0-9]{4,12}$/.test(deger);
  return (
    <AnimatePresence mode="wait" initial={false}>
      {duzenle ? (
        <motion.form key="f" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}
          className="mx-auto flex h-12 w-full max-w-[380px] items-center gap-1.5 rounded-full bg-black/35 pl-5 pr-1.5 ring-1 ring-white/[0.2]"
          onSubmit={(e) => { e.preventDefault(); if (!gecerli) return; kuponDegistir(deger); setDuzenle(false); toast.success("Kupon kodu güncellendi", { description: `Takipçilerin artık ${deger} kodunu kullanacak.` }); }}
          onKeyDown={(e) => e.key === "Escape" && setDuzenle(false)}>
          <input autoFocus value={deger} onChange={(e) => setDeger(e.target.value.toLocaleUpperCase("tr-TR").replace(/[^A-Z0-9]/g, "").slice(0, 12))} aria-label="Kupon kodu"
            className="h-9 min-w-0 flex-1 bg-transparent text-[15px] font-semibold tracking-[0.06em] text-white outline-none" />
          <button type="button" onClick={() => setDuzenle(false)} className="h-9 rounded-full px-3 text-[13px] text-white/70 hover:text-white">Vazgeç</button>
          <button disabled={!gecerli} className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-black transition disabled:bg-white/[0.07] disabled:text-white/35">Kaydet</button>
        </motion.form>
      ) : (
        <motion.div key="g" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13.5px] text-white/55">
          <span>Kupon kodun</span>
          <button onClick={async () => { if (await kopyala(kuponKodu, "Kupon kodu kopyalandı")) { setTamam(true); setTimeout(() => setTamam(false), 1500); } }} title="Kopyala"
            className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 font-semibold tracking-[0.06em] text-white ring-1 ring-white/[0.1] transition hover:bg-white/[0.1]">
            {kuponKodu || "Hazırlanıyor"}{tamam ? <Check className="h-3.5 w-3.5 text-[#8fe6ff]" strokeWidth={3} /> : <Copy className="h-3.5 w-3.5 text-white/50" />}
          </button>
          <button onClick={() => { setDeger(kuponKodu); setDuzenle(true); }} className="flex items-center gap-1 font-medium text-white/70 transition hover:text-white"><Pencil className="h-3.5 w-3.5" />Değiştir</button>
          <span className="w-full text-center text-[12.5px] text-white/40 sm:w-auto">videolarında ve açıklamalarında kullan</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Kademe yolu ── */
export function KademeYolu({ aktif, aylikOdeme, sonraki, toplam }: { aktif: string; aylikOdeme: number; sonraki: (typeof KOMISYON_KADEMELERI)[number] | null; toplam: number }) {
  const ust = KOMISYON_KADEMELERI[KOMISYON_KADEMELERI.length - 1].minAylik * 1.12;
  return (
    <div className={cn(yuzey, "p-6 sm:p-7")}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[13px] text-white/55">Davetlilerinin aylık ödemeleri</p><p className="mt-1 text-[26px] font-semibold tabular-nums tracking-[-0.03em] text-white"><Sayac hedef={aylikOdeme} bicim={(v) => tl(v)} /></p></div>
        <div className="text-right"><p className="text-[13px] text-white/55">Toplam davet kazancı</p><p className="mt-1 text-[26px] font-semibold tabular-nums tracking-[-0.03em] text-white"><Sayac hedef={toplam} bicim={(v) => tl(v, true)} /></p></div>
      </div>
      <div className="relative mx-2.5 mt-7 h-2 rounded-full bg-white/[0.07]">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(1.5, (aylikOdeme / ust) * 100))}%` }} transition={{ duration: 1.1, ease }} className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#55d6fd] to-[#a5ecff]" />
        {KOMISYON_KADEMELERI.map((k, i) => (
          <motion.span key={k.ad} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.12, ...yay }} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(k.minAylik / ust) * 100}%` }}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-[#0e0f12]" style={{ background: MADALYA[k.ad] }}>{k.ad === aktif && <Check className="h-3.5 w-3.5 text-black" strokeWidth={3.5} />}</span>
          </motion.span>
        ))}
      </div>
      <div className="mt-7 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
        {KOMISYON_KADEMELERI.map((k) => {
          const a = k.ad === aktif;
          return (
            <div key={k.ad} className={cn("rounded-[18px] p-4 ring-1 transition", a ? "bg-white/[0.06] ring-white/[0.18]" : "ring-white/[0.06]")}>
              <p className="flex items-center gap-2 text-[14px] font-semibold text-white"><span className="h-2.5 w-2.5 rounded-full" style={{ background: MADALYA[k.ad] }} />{k.ad}{a && <span className="rounded-full bg-[#55d6fd]/15 px-2 py-px text-[11px] font-medium text-[#8fe6ff]">Buradasın</span>}</p>
              <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-white">%{Math.round(k.oran * 100)}</p>
              <p className="mt-1.5 text-[12.5px] text-white/45">{k.minAylik ? `Aylık ${tl(k.minAylik)} ve üstü` : "Herkes buradan başlar"}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[12.5px] text-white/50">{sonraki ? `${sonraki.ad} için ${tl(Math.max(0, sonraki.minAylik - aylikOdeme))} daha aylık ödeme gerekiyor.` : "En üst kademedesin."}</p>
    </div>
  );
}

/* ── Davet ettiklerin ── */
const DURUM_AD = { kayit: "Kayıt oldu", uretti: "İlk üretimini yaptı", abone: "Abone" } as const;
const tarihFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" });

function AdimCizgisi({ durum }: { durum: Davetli["durum"] }) {
  const n = durum === "kayit" ? 1 : durum === "uretti" ? 2 : 3;
  return <span className="hidden gap-1 sm:flex" aria-hidden>{[1, 2, 3].map((i) => <span key={i} className={cn("h-1.5 w-6 rounded-full", i <= n ? "bg-[#55d6fd]" : "bg-white/[0.1]")} />)}</span>;
}

function Kisi({ src }: { src?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (src) return <img src={src} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-white/[0.12]" />;
  return <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/60 ring-1 ring-white/[0.1]"><UserRound className="h-[18px] w-[18px]" /></span>;
}

export function Davetliler({ liste, paylas }: { liste: Davetli[]; paylas: React.ReactNode }) {
  const ornek: { kadi: string; durum: Davetli["durum"]; plan?: string; tutar: number; g: string }[] = [
    { kadi: "deniz.kadraj", durum: "abone", plan: "Artı", tutar: 259.8, g: ORNEK_KISI[3] },
    { kadi: "ela.studio", durum: "uretti", tutar: 25, g: ORNEK_KISI[0] },
    { kadi: "kerem", durum: "kayit", tutar: 0, g: ORNEK_KISI[1] },
  ];
  const satir = (k: string, durum: Davetli["durum"], alt: string, tutar: number, g?: string, i = 0) => (
    <motion.div key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.035, ease }} className="flex items-center gap-3.5 px-5 py-3.5">
      <Kisi src={g} />
      <div className="min-w-0 flex-1"><p className="truncate text-[14.5px] font-medium text-white">@{k}</p><p className="truncate text-[12.5px] text-white/50">{alt}</p></div>
      <AdimCizgisi durum={durum} />
      <span className={cn("w-[88px] shrink-0 text-right text-[15px] font-semibold tabular-nums", tutar ? "text-emerald-300" : "text-white/35")}>{tutar ? `+${tl(tutar, true)}` : "Bekliyor"}</span>
    </motion.div>
  );
  return liste.length ? (
    <div className={cn(yuzey, "divide-y divide-white/[0.05] overflow-hidden")}>
      {liste.map((d, i) => satir(d.kadi, d.durum, `${DURUM_AD[d.durum]}${d.plan ? ` · ${d.plan}` : ""} · ${tarihFmt.format(d.tarih)}`, d.komisyon, undefined, i))}
    </div>
  ) : (
    <>
      <div className="flex flex-col gap-3 rounded-[20px] bg-white/[0.025] px-5 py-4 ring-1 ring-white/[0.08] sm:flex-row sm:items-center">
        <p className="flex-1 text-[14px] text-white/65">Henüz davet ettiğin kimse yok. Bağlantınla gelenler burada adım adım görünür.</p>
        {paylas}
      </div>
      <div className={cn(yuzey, "pointer-events-none mt-3 divide-y divide-white/[0.05] overflow-hidden opacity-50")} aria-hidden>
        {ornek.map((o, i) => satir(o.kadi, o.durum, `${DURUM_AD[o.durum]}${o.plan ? ` · ${o.plan}` : ""}`, o.tutar, o.g, i))}
      </div>
      <div className="mt-2.5"><OrnekRozet>Örnek görünüm</OrnekRozet></div>
    </>
  );
}

