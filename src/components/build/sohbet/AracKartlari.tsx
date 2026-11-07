"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import qrcode from "qrcode-generator";
import { AlertTriangle, Bell, Calculator, CalendarPlus, ChevronDown, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Coins, Copy, Download, Droplets, ExternalLink, FileSearch, Globe, MapPin, Moon, Radar, Repeat, Sun, Sunrise, Wind } from "lucide-react";
import { CH, EU, GB, JP, SA, US, CA, AU, DK, NO, SE, KW, CN, RU, KR, AZ, AE, QA, PK, BG, RO, IR } from "country-flag-icons/react/3x2";
import type { HavaSonucu, HesapSonucu, IzlemeSonucu, KarekodSonucu, KurSonucu, SayfalarSonucu, TakvimEtkinligi, TakvimSonucu } from "@/lib/build/sohbetTipler";
import { cn } from "@/lib/utils";
import { alanAdi, dosyaAdi, favicon, indir } from "./ortak";

/**
 * v5 araç kartları: okunan sayfalar, hesap, kur ve altın, hava durumu, takvim dosyası, karekod, izleme.
 * Kartlar kendi başına anlaşılır; dış kaynaklı değerlerin kaynağı ve tarihi kartın altında yazar.
 */
const kart = "my-3 max-w-[620px] overflow-hidden rounded-[20px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.08]";
const tr = (n: number, b = 4) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: b, minimumFractionDigits: n >= 100 ? 2 : 0 }).format(n);
function KartBaslik({ ikon, baslik, alt, sag }: { ikon: React.ReactNode; baslik: React.ReactNode; alt?: React.ReactNode; sag?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#55d6fd]/[0.12] text-[#8be6ff]">{ikon}</span>
      <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-white">{baslik}</span>{alt && <span className="block truncate text-[12px] text-white/50">{alt}</span>}</span>
      {sag}
    </div>
  );
}

/* ───────────── Okunan sayfalar ───────────── */
export function SayfalarKarti({ s }: { s: SayfalarSonucu }) {
  const [hepsi, setHepsi] = useState(false);
  const l = hepsi ? s.sayfalar : s.sayfalar.slice(0, 3);
  return (
    <div className={kart}>
      <KartBaslik ikon={<FileSearch className="h-4 w-4" />} baslik={`${s.sayfalar.length} sayfa okundu`} alt={s.gezinti ? `${alanAdi(s.sayfalar[0]?.url ?? "")} sitesinde gezildi${s.atlanan ? `, ${s.atlanan} bağlantı daha var` : ""}` : s.sayfalar.map((x) => alanAdi(x.url)).filter((x, i, a) => a.indexOf(x) === i).join(", ")} />
      <ul className="divide-y divide-white/[0.05]">
        {l.map((x) => (
          <li key={x.url}>
            <a href={x.url} target="_blank" rel="noopener noreferrer" className="group flex gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={favicon(x.url)} alt="" className="mt-0.5 h-5 w-5 shrink-0 rounded" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2"><span className="truncate text-[13.5px] font-medium text-white">{x.baslik || alanAdi(x.url)}</span>{x.fiyat && <span className="shrink-0 rounded-full bg-emerald-400/[0.12] px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-emerald-200">{x.fiyat}</span>}</span>
                <span className="block truncate text-[11.5px] text-white/40">{x.url.replace(/^https?:\/\/(www\.)?/, "")}</span>
                {x.ozet && <span className="mt-1 line-clamp-2 block text-[12.5px] leading-snug text-white/60">{x.ozet}</span>}
              </span>
              <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-white/30 group-hover:text-white/70" />
            </a>
          </li>
        ))}
      </ul>
      {s.sayfalar.length > 3 && <button type="button" onClick={() => setHepsi(!hepsi)} className="flex w-full items-center justify-center gap-1.5 border-t border-white/[0.06] py-2.5 text-[12.5px] text-white/60 hover:text-white">{hepsi ? "Daha az göster" : `${s.sayfalar.length - 3} sayfa daha`}<ChevronDown className={cn("h-3.5 w-3.5 transition-transform", hepsi && "rotate-180")} /></button>}
      {s.hatalar.length > 0 && <div className="space-y-1 border-t border-white/[0.06] bg-amber-400/[0.04] px-4 py-2.5">{s.hatalar.map((h) => <p key={h.url} className="flex items-start gap-2 text-[12px] text-amber-100/85"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0 break-words"><span className="text-white/70">{alanAdi(h.url)}</span>: {h.hata}</span></p>)}</div>}
    </div>
  );
}

/* ───────────── Hesap ───────────── */
export function HesapKarti({ h }: { h: HesapSonucu }) {
  const [kopya, setKopya] = useState(-1);
  return (
    <div className={kart}>
      <KartBaslik ikon={<Calculator className="h-4 w-4" />} baslik={h.satirlar.length > 1 ? `${h.satirlar.length} hesap` : "Hesap"} alt="Kesin hesap; yuvarlama yalnız gösterimde" />
      <ul className="divide-y divide-white/[0.05]">
        {h.satirlar.map((x, i) => (
          <li key={i} className="group flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
            <span className="sc-kod min-w-[140px] flex-1 break-all text-[12.5px] text-white/60">{x.ifade}{x.kategori && <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 font-sans text-[11px] text-white/50">{x.kategori}</span>}</span>
            {x.hata ? <span className="flex items-center gap-1.5 text-[12.5px] text-amber-200"><AlertTriangle className="h-3.5 w-3.5" />{x.hata}</span> : (
              <span className="flex items-center gap-1.5">
                <span className="text-[17px] font-semibold tabular-nums tracking-[-0.01em] text-white">{x.sonuc}</span>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(x.sonuc ?? ""); setKopya(i); setTimeout(() => setKopya(-1), 1200); }} title={kopya === i ? "Kopyalandı" : "Kopyala"} aria-label="Sonucu kopyala" className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 opacity-0 hover:bg-white/[0.07] hover:text-white group-hover:opacity-100 max-sm:opacity-100"><Copy className="h-3.5 w-3.5" /></button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────── Kur ve altın ───────────── */
const BAYRAK: Record<string, React.ComponentType<{ className?: string; title?: string }>> = { USD: US, EUR: EU, GBP: GB, CHF: CH, JPY: JP, SAR: SA, CAD: CA, AUD: AU, DKK: DK, NOK: NO, SEK: SE, KWD: KW, CNY: CN, RUB: RU, KRW: KR, AZN: AZ, AED: AE, QAR: QA, PKR: PK, BGN: BG, RON: RO, IRR: IR };
function KurSimge({ kod }: { kod: string }) {
  const B = BAYRAK[kod];
  if (B) return <B className="h-5 w-[30px] shrink-0 rounded-[4px] object-cover ring-1 ring-white/10" />;
  const altin = /ALTIN/.test(kod);
  return <span className={cn("flex h-5 w-[30px] shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold", altin ? "bg-gradient-to-br from-amber-200 to-amber-500 text-amber-950" : /GUMUS/.test(kod) ? "bg-gradient-to-br from-zinc-100 to-zinc-400 text-zinc-800" : "bg-white/[0.1] text-white/70")}>{altin ? "Au" : /GUMUS/.test(kod) ? "Ag" : kod.slice(0, 3)}</span>;
}
export function KurKarti({ k }: { k: KurSonucu }) {
  const tarih = k.tarih ? k.tarih.split(".").reverse().join("-") : "";
  const tarihYaz = tarih && !Number.isNaN(Date.parse(tarih)) ? new Date(`${tarih}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : k.tarih;
  return (
    <div className={kart}>
      <KartBaslik ikon={<Coins className="h-4 w-4" />} baslik="Döviz ve altın" alt={tarihYaz ? `TCMB gösterge kurları · ${tarihYaz}` : "Güncel değerler"} />
      {k.ceviri && (
        <div className="border-b border-white/[0.06] bg-[#55d6fd]/[0.05] px-4 py-3">
          <p className="text-[12px] text-white/55">Çeviri</p>
          <p className="text-[20px] font-semibold tabular-nums tracking-[-0.01em] text-white">{tr(k.ceviri.miktar)} {k.ceviri.kaynak} <span className="text-white/40">eşittir</span> {tr(k.ceviri.sonuc, 2)} {k.ceviri.hedef === "TRY" ? "TL" : k.ceviri.hedef}</p>
        </div>
      )}
      {k.kalemler.length > 0 && (
        <table className="w-full text-[13px]">
          <thead><tr className="text-[11.5px] text-white/45"><th className="px-4 py-2 text-left font-normal">Birim</th><th className="px-2 py-2 text-right font-normal max-sm:hidden">Alış</th><th className="px-4 py-2 text-right font-normal">Satış</th></tr></thead>
          <tbody className="divide-y divide-white/[0.05] border-t border-white/[0.05]">
            {k.kalemler.map((x) => (
              <tr key={x.kod}>
                <td className="px-4 py-2.5"><span className="flex items-center gap-2.5"><KurSimge kod={x.kod} /><span className="min-w-0"><span className="block truncate font-medium text-white">{x.ad}</span><span className="block truncate text-[11.5px] text-white/40">{x.not ?? x.kod}</span></span></span></td>
                <td className="px-2 py-2.5 text-right tabular-nums text-white/60 max-sm:hidden">{x.alis ? tr(x.alis) : ""}</td>
                <td className="px-4 py-2.5 text-right"><span className="font-semibold tabular-nums text-white">{x.satis ? tr(x.satis) : "yok"}</span> <span className="text-[11.5px] text-white/45">{x.birim}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {k.hatalar.length > 0 && <p className="flex items-start gap-2 border-t border-white/[0.06] px-4 py-2 text-[12px] text-amber-100/85"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{k.hatalar.join(" · ")}</p>}
      <p className="border-t border-white/[0.06] px-4 py-2 text-[11.5px] leading-snug text-white/40">{k.kaynak}. Bankaların ve kuyumcuların fiyatları farklı olabilir.</p>
    </div>
  );
}

/* ───────────── Hava ───────────── */
function HavaSimge({ kod, gunduz = true, className }: { kod: number; gunduz?: boolean; className?: string }) {
  const I = kod === 0 ? (gunduz ? Sun : Moon) : kod <= 2 ? CloudSun : kod === 3 ? Cloud : kod <= 48 ? CloudFog : kod <= 57 ? CloudDrizzle : kod <= 67 || (kod >= 80 && kod <= 82) ? CloudRain : kod <= 77 || kod === 85 || kod === 86 ? CloudSnow : CloudLightning;
  const renk = kod === 0 ? (gunduz ? "text-amber-300" : "text-indigo-200") : kod <= 2 ? "text-amber-200" : kod >= 95 ? "text-violet-300" : kod >= 71 && kod <= 86 && !(kod >= 80 && kod <= 82) ? "text-sky-100" : kod >= 51 ? "text-sky-300" : "text-white/70";
  return <I className={cn(renk, className)} />;
}
const gunAdi = (t: string, i: number) => (i === 0 ? "Bugün" : i === 1 ? "Yarın" : new Date(`${t}T12:00:00`).toLocaleDateString("tr-TR", { weekday: "long" }));
export function HavaKarti({ h }: { h: HavaSonucu }) {
  const enAz = Math.min(...h.gunler.map((g) => g.enDusuk)), enCok = Math.max(...h.gunler.map((g) => g.enYuksek));
  const aralik = Math.max(1, enCok - enAz);
  return (
    <div className={kart}>
      <div className="flex flex-wrap items-center gap-4 px-4 pb-3 pt-4">
        <HavaSimge kod={h.simdi.kod} gunduz={h.simdi.gunduz} className="h-14 w-14 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[13px] text-white/60"><MapPin className="h-3.5 w-3.5" />{h.yer.ad}{h.yer.bolge && h.yer.bolge !== h.yer.ad ? `, ${h.yer.bolge}` : ""}</span>
          <span className="flex items-baseline gap-2"><span className="text-[40px] font-semibold leading-none tracking-[-0.03em] text-white tabular-nums">{Math.round(h.simdi.sicaklik)}°</span><span className="text-[15px] text-white/80">{h.simdi.durum}</span></span>
        </span>
        <dl className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-[12px] max-sm:w-full">
          <dt className="text-white/45">Hissedilen</dt><dt className="flex items-center gap-1 text-white/45"><Droplets className="h-3 w-3" />Nem</dt><dt className="flex items-center gap-1 text-white/45"><Wind className="h-3 w-3" />Rüzgâr</dt>
          <dd className="font-medium tabular-nums text-white">{Math.round(h.simdi.hissedilen)}°</dd><dd className="font-medium tabular-nums text-white">yüzde {h.simdi.nem}</dd><dd className="font-medium tabular-nums text-white">{Math.round(h.simdi.ruzgar)} km/sa</dd>
        </dl>
      </div>
      <div className="flex gap-1 overflow-x-auto border-y border-white/[0.06] px-3 py-2.5 [scrollbar-width:thin]">
        {h.saatlik.filter((_, i) => i % 2 === 0).slice(0, 12).map((s, i) => (
          <div key={`${s.saat}-${i}`} className="flex w-[52px] shrink-0 flex-col items-center gap-1 rounded-[12px] py-1.5 text-[11.5px]">
            <span className="text-white/45">{i === 0 ? "Şimdi" : s.saat}</span>
            <HavaSimge kod={s.kod} className="h-5 w-5" gunduz={Number(s.saat.slice(0, 2)) >= 7 && Number(s.saat.slice(0, 2)) < 19} />
            <span className="font-medium tabular-nums text-white">{Math.round(s.sicaklik)}°</span>
            <span className={cn("tabular-nums", (s.yagisOlasiligi ?? 0) >= 40 ? "text-sky-300" : "text-white/30")}>{s.yagisOlasiligi ?? 0}</span>
          </div>
        ))}
      </div>
      <ul className="divide-y divide-white/[0.05]">
        {h.gunler.slice(0, 7).map((g, i) => (
          <li key={g.tarih} className="flex items-center gap-3 px-4 py-2 text-[13px]">
            <span className="w-[86px] shrink-0 truncate text-white/80">{gunAdi(g.tarih, i)}</span>
            <HavaSimge kod={g.kod} className="h-5 w-5 shrink-0" />
            <span className={cn("w-[66px] shrink-0 whitespace-nowrap text-[11.5px] tabular-nums max-sm:hidden", (g.yagisOlasiligi ?? 0) >= 40 ? "text-sky-300" : "text-white/35")}>{g.yagisOlasiligi ? `yüzde ${g.yagisOlasiligi}` : ""}</span>
            <span className="w-8 shrink-0 text-right tabular-nums text-white/50">{Math.round(g.enDusuk)}°</span>
            <span className="relative h-1.5 min-w-[60px] flex-1 rounded-full bg-white/[0.06]">
              <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.04, duration: 0.4 }} style={{ left: `${((g.enDusuk - enAz) / aralik) * 100}%`, width: `${Math.max(6, ((g.enYuksek - g.enDusuk) / aralik) * 100)}%` }} className="absolute inset-y-0 origin-left rounded-full bg-gradient-to-r from-sky-300 via-[#55d6fd] to-amber-300" />
            </span>
            <span className="w-8 shrink-0 tabular-nums text-white">{Math.round(g.enYuksek)}°</span>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-1.5 border-t border-white/[0.06] px-4 py-2 text-[11.5px] text-white/40"><Sunrise className="h-3.5 w-3.5" />Gün doğumu {h.gunler[0]?.gunDogumu}, batımı {h.gunler[0]?.gunBatimi} · Kaynak: {h.kaynak} · Saatlik satırdaki sayı yağış olasılığıdır (yüzde)</p>
    </div>
  );
}

/* ───────────── Takvim ───────────── */
const TARIH = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/;
function zaman(e: TakvimEtkinligi) {
  const b = TARIH.exec(e.baslangic), s = e.bitis ? TARIH.exec(e.bitis) : null;
  if (!b) return { gun: "", ay: "", metin: e.baslangic };
  const d = new Date(Date.UTC(+b[1], +b[2] - 1, +b[3], 12));
  const gun = String(+b[3]), ay = d.toLocaleDateString("tr-TR", { month: "short", timeZone: "UTC" });
  const haftaGunu = d.toLocaleDateString("tr-TR", { weekday: "long", timeZone: "UTC" });
  const metin = b[4] ? `${haftaGunu}, ${b[4]}.${b[5]}${s?.[4] ? ` ile ${s[4]}.${s[5]} arası` : ""}` : `${haftaGunu}, tüm gün`;
  return { gun, ay, metin };
}
/** Google Takvim bağlantısı (Türkiye saatiyle). */
function googleAdresi(e: TakvimEtkinligi): string {
  const b = TARIH.exec(e.baslangic)!;
  const s = e.bitis ? TARIH.exec(e.bitis) : null;
  const yerel = (m: RegExpExecArray, eksik: boolean) => (m[4] ? `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}00` : `${m[1]}${m[2]}${m[3]}`) + (eksik ? "" : "");
  let bit: string;
  if (s) bit = yerel(s, false);
  else if (b[4]) { const d = new Date(Date.UTC(+b[1], +b[2] - 1, +b[3], +b[4] + 1, +b[5])); bit = `${d.toISOString().slice(0, 10).replace(/-/g, "")}T${d.toISOString().slice(11, 13)}${d.toISOString().slice(14, 16)}00`; }
  else { const d = new Date(Date.UTC(+b[1], +b[2] - 1, +b[3] + 1)); bit = d.toISOString().slice(0, 10).replace(/-/g, ""); }
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.baslik, dates: `${yerel(b, false)}/${bit}`, ctz: "Europe/Istanbul", ...(e.yer ? { location: e.yer } : {}), ...(e.aciklama ? { details: e.aciklama } : {}) });
  return `https://calendar.google.com/calendar/render?${q}`;
}
const TEKRAR_AD: Record<string, string> = { gunluk: "Her gün", haftalik: "Her hafta", aylik: "Her ay", yillik: "Her yıl" };
export function TakvimKarti({ t }: { t: TakvimSonucu }) {
  return (
    <div className={kart}>
      <KartBaslik ikon={<CalendarPlus className="h-4 w-4" />} baslik={t.ad} alt={`${t.etkinlikler.length} etkinlik · .ics takvim dosyası`}
        sag={<button type="button" onClick={() => indir(`${dosyaAdi(t.ad)}.ics`, t.ics, "text/calendar;charset=utf-8")} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><Download className="h-3.5 w-3.5" /><span className="max-sm:hidden">Takvime ekle</span></button>} />
      <ul className="divide-y divide-white/[0.05]">
        {t.etkinlikler.map((e, i) => {
          const z = zaman(e);
          return (
            <li key={i} className="flex items-start gap-3 px-4 py-3">
              <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[12px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]"><span className="text-[10.5px] uppercase leading-none text-[#8be6ff]">{z.ay}</span><span className="text-[19px] font-semibold leading-tight tabular-nums text-white">{z.gun}</span></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-white">{e.baslik}</span>
                <span className="block text-[12.5px] text-white/60">{z.metin}</span>
                {(e.yer || e.tekrar && e.tekrar !== "yok" || e.hatirlatma) && <span className="mt-0.5 flex flex-wrap gap-x-3 text-[12px] text-white/45">{e.yer && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.yer}</span>}{e.tekrar && e.tekrar !== "yok" && <span className="flex items-center gap-1"><Repeat className="h-3 w-3" />{TEKRAR_AD[e.tekrar]}{e.tekrarSayisi ? `, ${e.tekrarSayisi} kez` : ""}</span>}{e.hatirlatma ? <span className="flex items-center gap-1"><Bell className="h-3 w-3" />{e.hatirlatma >= 60 && e.hatirlatma % 60 === 0 ? `${e.hatirlatma / 60} saat` : `${e.hatirlatma} dakika`} önce</span> : null}</span>}
              </span>
              <a href={googleAdresi(e)} target="_blank" rel="noopener noreferrer" title="Google Takvim'de aç" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12px] text-white/80 hover:bg-white/[0.12] hover:text-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={favicon("https://calendar.google.com")} alt="" className="h-3.5 w-3.5" /><span className="max-sm:hidden">Google</span>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-white/[0.06] px-4 py-2 text-[11.5px] text-white/40">Takvime ekle düğmesi .ics dosyasını indirir; Apple Takvim, Outlook ve Google Takvim bu dosyayı açar. Saatler Türkiye saatidir.</p>
    </div>
  );
}

/* ───────────── Karekod ───────────── */
function karekodYolu(metin: string): { d: string; n: number } {
  const q = qrcode(0, "M");
  // UTF-8 bayt dönüşümü (paketin ESM sürümünde UTF-8 yardımcısı yok; Türkçe karakterler bozulmasın).
  (qrcode as unknown as { stringToBytes: (s: string) => number[] }).stringToBytes = (x: string) => Array.from(new TextEncoder().encode(x));
  q.addData(metin, "Byte"); q.make();
  const n = q.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
  return { d, n: n + 8 };
}
const TIP_AD: Record<string, string> = { baglanti: "Bağlantı", metin: "Metin", wifi: "Wi-Fi", kartvizit: "Kartvizit", eposta: "E-posta", telefon: "Telefon", sms: "SMS", konum: "Konum" };
export function KarekodKarti({ k }: { k: KarekodSonucu }) {
  const { d, n } = useMemo(() => karekodYolu(k.icerik), [k.icerik]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  const ad = dosyaAdi(`karekod-${k.etiket}`);
  const png = () => {
    const img = new Image();
    img.onload = () => { const c = document.createElement("canvas"); c.width = c.height = 1024; const x = c.getContext("2d")!; x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0, 1024, 1024); c.toBlob((b) => { if (!b) return; const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `${ad}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000); }, "image/png"); };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };
  const [kopya, setKopya] = useState(false);
  return (
    <div className={cn(kart, "flex flex-wrap items-center gap-4 p-4")}>
      <svg viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" role="img" aria-label={`Karekod: ${k.etiket}`} className="h-[148px] w-[148px] shrink-0 rounded-[14px]"><rect width={n} height={n} fill="#fff" /><path d={d} fill="#000" /></svg>
      <div className="min-w-[200px] flex-1">
        <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[11.5px] text-white/65">{TIP_AD[k.tip] ?? "Karekod"}</span>
        <p className="mt-2 break-words text-[14px] font-semibold text-white">{k.etiket}</p>
        {k.tip === "baglanti" && <a href={k.icerik} target="_blank" rel="noopener noreferrer" className="mt-0.5 block truncate text-[12.5px] text-[#8be6ff] hover:underline">{k.icerik}</a>}
        <p className="mt-1 text-[12px] text-white/45">Telefon kamerasıyla taratıp dene. Baskıda en az 2 santimetre kullan.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={png} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><Download className="h-3.5 w-3.5" />PNG</button>
          <button type="button" onClick={() => indir(`${ad}.svg`, svg, "image/svg+xml")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]"><Download className="h-3.5 w-3.5" />SVG</button>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(k.icerik); setKopya(true); setTimeout(() => setKopya(false), 1200); }} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/65 hover:bg-white/[0.06] hover:text-white"><Copy className="h-3.5 w-3.5" />{kopya ? "Kopyalandı" : "İçeriği kopyala"}</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── İzleme ───────────── */
export function IzlemeKarti({ i, salt }: { i: IzlemeSonucu; salt?: boolean }) {
  return (
    <div className={cn(kart, "flex flex-wrap items-center gap-3 p-3.5")}>
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Radar className="h-5 w-5" /><span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-[#55d6fd]" /></span>
      <span className="min-w-[200px] flex-1"><span className="block truncate text-[14px] font-semibold text-white">{i.ad}</span><span className="block text-[12.5px] leading-snug text-white/55">{i.aciklama} · {i.aralik}</span></span>
      {!salt && <Link href="/panel/build/sohbet/gorevler?sekme=izleme" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]">İzlemeleri aç</Link>}
    </div>
  );
}
