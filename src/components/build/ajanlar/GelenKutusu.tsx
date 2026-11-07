"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, ArrowLeftRight, ArrowUp, Bot, FileText, Lightbulb, CheckCircle2, ChevronDown, Clock3, Inbox, Info, Loader2, MessageSquareQuote, Plus, Search, Settings2, Sparkles, Star, StickyNote, Tags, Trash2, UserRound, Users, X, Timer, Workflow, Fingerprint,
} from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Md } from "@/components/build/sohbet/SohbetEkrani";
import { Suzgec } from "@/components/build/ana/Bolumler";
import { KANAL_AD, type Kanal } from "@/lib/build/ajanKatalog";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { AcilirSecim, Anahtar, Secici, alanSinif } from "./AjanDuzenleyici";
import { AjanSimge, BosDurum, KanalSimge, OlayAyrac, TON_SINIF, YanPanel, birincil, ikincil, saatYaz, sureYaz } from "./ortak";
import { buildKrediUygula } from "@/lib/build/istemciKredi";
import { CanliOneri, CeviriSatiri, PencereRozeti, SablonPaneli, YARDIM_OLAY, Yardimci, YenidenYaz, type Oneri, type Pencere } from "./GelenYardim";

type Durum = "acik" | "devredildi" | "insan" | "cozuldu";
type Sekme = "bekliyor" | "bende" | "acik" | "cozuldu" | "hepsi";
type Ozet = {
  id: string; ilk: string; son: string; mesaj: number; guncelleme: number; kaynak: Kanal; site?: string; durum: Durum; okunmadi: boolean;
  iletisim?: { ad?: string; eposta?: string; telefon?: string }; devir?: { zaman: number; neden: string }; etiketler?: string[]; csat?: number; tahmin?: number; aktifAjan?: string; kaliteIhlal?: number;
  atanan?: { id: string; ad: string }; oncelik?: Oncelik; prosedur?: { ad: string; bekliyor?: string }; kisi?: string;
};
type Oncelik = "acil" | "yuksek" | "normal" | "dusuk";
type SlaD = { durum: "yok" | "yolunda" | "yaklasiyor" | "asildi"; en?: { ad: string; kalan: number; bitis: number; duraklatildi?: boolean }; mesaiDisi?: boolean };
type Takvim = { acik: boolean; saatDilimi: string; gunler: ({ bas: string; bit: string } | null)[]; tatiller: { tarih: string; ad: string }[] };
const VARSAYILAN_TAKVIM: Takvim = { acik: false, saatDilimi: "Europe/Istanbul", gunler: [null, ...Array.from({ length: 5 }, () => ({ bas: "09:00", bit: "18:00" })), null], tatiller: [] };
const SAAT_DILIMLERI = ["Europe/Istanbul", "Europe/London", "Europe/Berlin", "Europe/Moscow", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "America/New_York", "America/Chicago", "America/Los_Angeles", "America/Sao_Paulo", "UTC"];
const GUN_SIRA = [1, 2, 3, 4, 5, 6, 0];
const GUN_ADI = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
type EkipKisi = { id: string; ad: string; rol: "yonetici" | "temsilci" | "izleyici"; durum: "cevrimici" | "mesgul" | "cevrimdisi"; kapasite: number };
type Gorunum = { id: string; ad: string; suzgec: Record<string, string>; sahip?: string };
type Oge = { ajan: { id: string; ad: string; simge: string }; konusma: Ozet; bekleme?: number; sla?: SlaD };
type Liste = { ogeler: Oge[]; sayilar: Record<Sekme, number>; olcu: { ilkYanit: number | null; ilkYanitSayi: number; okunmamis: number; slaAsilan: number; slaYaklasan: number; atanmamis: number }; ajanlar: { id: string; ad: string; simge: string }[]; etiketler: string[]; yuk: Record<string, number>; ekip: EkipKisi[]; gorunumler: Gorunum[]; slaAcik: boolean };
const ONCELIK: { id: Oncelik; ad: string }[] = [{ id: "acil", ad: "Acil" }, { id: "yuksek", ad: "Yüksek" }, { id: "normal", ad: "Normal" }, { id: "dusuk", ad: "Düşük" }];
const TDURUM: Record<EkipKisi["durum"], { ad: string; renk: string }> = { cevrimici: { ad: "Çevrimiçi", renk: "bg-emerald-400" }, mesgul: { ad: "Meşgul", renk: "bg-amber-400" }, cevrimdisi: { ad: "Çevrimdışı", renk: "bg-white/30" } };
const kalanYaz = (ms: number) => (ms < 0 ? `${sureYaz(-ms).replace(/ \d+ sn$/, "")} aşıldı` : `${sureYaz(ms).replace(/ \d+ sn$/, "")} kaldı`);
const SLA_TON = { yolunda: "bg-white/[0.06] text-white/60", yaklasiyor: "bg-amber-400/[0.14] text-amber-200", asildi: "bg-rose-500/[0.16] text-rose-200", yok: "" } as const;
const basHarf = (ad: string) => ad.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toLocaleUpperCase("tr");
type Mesaj = { id: string; rol: "kullanici" | "asistan"; metin?: string; zaman: number; insan?: string; ceviri?: { dil: string; metin: string }; sablon?: { ad: string; dil: string }; dosyalar?: { id: string; ad: string; tur: string; boyut: number; url: string }[]; parcalar?: { tur: string; metin?: string; baslik?: string }[]; olay?: { tur: string; metin: string }; yanitlayan?: { id: string; ad: string; simge: string }; begeni?: 1 | -1; kaynaklar?: { no: number; ad: string }[] };
type Not = { id: string; metin: string; yazan: string; zaman: number };
type Konusma = {
  id: string; mesajlar: Mesaj[]; kaynak: Kanal; site?: string; durum: Durum; iletisim?: Ozet["iletisim"] & { zaman?: number }; devir?: { zaman: number; neden: string };
  etiket?: { sonuc: string }; olusturma: number; guncelleme: number; notlar: Not[]; etiketler: string[]; csat?: { puan: number; yorum?: string }; tahmin?: { puan: number; neden: string };
  kalite?: { ihlaller: { kural: string; neden: string }[] }; yonlendirmeler: { zaman: number; kimden: { ad: string }; kime: { ad: string }; neden: string; geri?: boolean }[]; aktifAjan?: { ad: string; simge: string };
  kol?: "A" | "B"; surum?: number; ilkYanit?: number; adres?: string; konu?: string;
  atanan?: { id: string; ad: string; kim: string }; oncelik?: Oncelik; sla?: SlaD; kisi?: string; ortam?: string; dil?: string; pencere?: Pencere | null;
  prosedur?: { ad: string; bekliyor?: string; adim: string; iz: { baslik: string; zaman: number; sonuc?: string; hata?: boolean }[]; degiskenler: Record<string, string>; onayMetni?: string };
};
type KisiOzet = { id: string; ad?: string; eposta?: string; telefon?: string; kanallar: Kanal[]; konusma: number; notlar: { id: string; metin: string; kaynak: string }[]; ozellikler: Record<string, string>; konusmalar: { ajanId: string; dosyaId: string; kanal: Kanal; zaman: number; ilk?: string }[]; oneriler: { kisi: string; neden: string }[] };
type AjanBilgisi = { id: string; ad: string; simge: string; etiketler: string[]; csat: boolean };
type Hazir = { id: string; baslik: string; metin: string };
type SlaAyar = { acik: boolean; ilkYanit: number; sonrakiYanit: number; cozum: number; uyariYuzde: number; bildirim?: string; carpan: Record<Oncelik, number>; takvim?: Takvim };
type Ayar = { temsilci: string; hazirYanitlar: Hazir[]; ekip: (EkipKisi & { ajanlar: string[]; kanallar: string[] })[]; atama: { otomatik: boolean; yontem: "sirayla" | "enAz"; yalnizCevrimici: boolean }; sla: SlaAyar; gorunumler: Gorunum[]; ceviri: { acik: boolean; dil: string } };
const BOS_AYAR: Ayar = { temsilci: "Temsilci", hazirYanitlar: [], ekip: [], atama: { otomatik: false, yontem: "sirayla", yalnizCevrimici: true }, sla: { acik: false, ilkYanit: 15, sonrakiYanit: 30, cozum: 24, uyariYuzde: 75, carpan: { acil: 0.25, yuksek: 0.5, normal: 1, dusuk: 2 } }, gorunumler: [], ceviri: { acik: false, dil: "tr" } };
const DIL_AD: Record<string, string> = { tr: "Türkçe", en: "İngilizce", de: "Almanca", fr: "Fransızca", es: "İspanyolca", it: "İtalyanca", pt: "Portekizce", nl: "Felemenkçe", ru: "Rusça", uk: "Ukraynaca", ar: "Arapça", fa: "Farsça", az: "Azerbaycan Türkçesi", ja: "Japonca", zh: "Çince", ko: "Korece", hi: "Hintçe", pl: "Lehçe", sv: "İsveççe", el: "Yunanca" };
const dilAd = (d?: string) => (d ? DIL_AD[d] ?? d : "");
const tercihOku = (k: string, v: boolean) => { try { const x = localStorage.getItem(k); return x === null ? v : x === "1"; } catch { return v; } };
const tercihYaz = (k: string, v: boolean) => { try { localStorage.setItem(k, v ? "1" : "0"); } catch { /* yok */ } };

export const GELEN_DURUM: Record<Durum, { ad: string; ton: keyof typeof TON_SINIF }> = {
  acik: { ad: "Ajanda", ton: "notr" }, devredildi: { ad: "Temsilci bekliyor", ton: "bekliyor" }, insan: { ad: "Temsilcide", ton: "iyi" }, cozuldu: { ad: "Çözüldü", ton: "iyi" },
};
const kisiAdi = (o: { iletisim?: { ad?: string; eposta?: string } }, id: string) => o.iletisim?.ad || o.iletisim?.eposta || `Ziyaretçi ${id.slice(0, 4)}`;
const bekleYaz = (ms: number) => (ms < 60_000 ? "az önce" : sureYaz(ms).replace(/ \d+ sn$/, ""));

/* ───────────── Liste ───────────── */
function ListeSatiri({ o, secili, ac, isaretli, isaretle }: { o: Oge; secili: boolean; ac: () => void; isaretli: boolean; isaretle: () => void }) {
  const k = o.konusma;
  return (
    <div role="button" tabIndex={0} onClick={ac} onKeyDown={(e) => { if (e.key === "Enter") ac(); }} className={cn("group relative flex w-full cursor-pointer items-start gap-3 px-3.5 py-3 text-left transition-colors", secili ? "bg-white/[0.06]" : "hover:bg-white/[0.03]")}>
      {secili && <motion.span layoutId="gelen-secim" className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-white" />}
      <button type="button" onClick={(e) => { e.stopPropagation(); isaretle(); }} aria-pressed={isaretli} aria-label="Toplu işlem için seç" className={cn("mt-2 h-4 w-4 shrink-0 rounded-[5px] ring-1 ring-inset transition", isaretli ? "bg-white ring-white" : "ring-white/25 opacity-60 group-hover:opacity-100")} />
      <span className="relative mt-0.5 shrink-0"><KanalSimge k={k.kaynak} boyut={36} /><AjanSimge src={o.ajan.simge} boyut={18} className="absolute -bottom-1 -right-1 ring-2 ring-[#121315]" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn("min-w-0 flex-1 truncate text-[13.5px]", k.okunmadi ? "font-semibold text-white" : "font-medium text-white/85")}>{kisiAdi(k, k.id)}</span>
          <span className="shrink-0 text-[11px] tabular-nums text-white/40">{gorece(k.guncelleme)}</span>
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] text-white/55">{k.son || k.ilk || "Mesajsız"}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {k.durum === "devredildi" && o.bekleme !== undefined ? <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", TON_SINIF.bekliyor)}><Clock3 className="h-3 w-3" />{bekleYaz(o.bekleme)} bekliyor</span>
            : k.durum !== "acik" ? <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", TON_SINIF[GELEN_DURUM[k.durum].ton])}>{GELEN_DURUM[k.durum].ad}</span> : null}
          <span className="truncate text-[11px] text-white/40">{o.ajan.ad}{k.aktifAjan ? ` · ${k.aktifAjan}` : ""}</span>
          {o.sla && o.sla.durum !== "yok" && o.sla.en && <span title={o.sla.en.duraklatildi ? "Mesai dışında; SLA saati durdu" : undefined} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums", SLA_TON[o.sla.durum])}><Timer className="h-3 w-3" />{kalanYaz(o.sla.en.kalan)}{o.sla.en.duraklatildi ? " · durdu" : ""}</span>}
          {(k.oncelik === "acil" || k.oncelik === "yuksek") && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", k.oncelik === "acil" ? "bg-rose-500/[0.16] text-rose-200" : "bg-amber-400/[0.14] text-amber-200")}>{k.oncelik === "acil" ? "Acil" : "Yüksek"}</span>}
          {k.prosedur?.bekliyor === "temsilci" && <span className="inline-flex items-center gap-1 rounded-full bg-[#55d6fd]/[0.12] px-2 py-0.5 text-[11px] font-medium text-[#8be6ff]"><Workflow className="h-3 w-3" />Onay bekliyor</span>}
          {k.atanan && <span title={`Atanan: ${k.atanan.ad}`} className="inline-flex h-5 items-center rounded-full bg-white/[0.08] px-1.5 text-[10.5px] font-semibold text-white/80">{basHarf(k.atanan.ad)}</span>}
          {(k.etiketler ?? []).slice(0, 2).map((e) => <span key={e} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/65">{e}</span>)}
          {k.csat ? <span className="inline-flex items-center gap-0.5 text-[11px] tabular-nums text-amber-200/90"><Star className="h-3 w-3 fill-current" />{k.csat}</span> : null}
          {k.kaliteIhlal ? <span className="inline-flex items-center gap-0.5 text-[11px] text-rose-300"><AlertTriangle className="h-3 w-3" />{k.kaliteIhlal}</span> : null}
        </span>
      </span>
      {k.okunmadi && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#55d6fd]" />}
    </div>
  );
}

/** Ziyaretçinin web kutusundan yüklediği dosya: görsel küçük resim, diğerleri ad ve boyutla; yeni sekmede açılır. */
function DosyaKutusu({ f }: { f: { id: string; ad: string; tur: string; boyut: number; url: string } }) {
  const gorsel = f.tur.startsWith("image/");
  return (
    <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex max-w-[240px] items-center gap-2 rounded-[12px] bg-white/[0.05] p-1.5 pr-3 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {gorsel ? <img src={f.url} alt="" className="h-10 w-10 rounded-[8px] object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white/[0.06]"><FileText className="h-4 w-4 text-white/60" /></span>}
      <span className="min-w-0"><span className="block truncate text-[12.5px] text-white/85">{f.ad}</span><span className="block text-[11px] text-white/40">{f.boyut >= 1048576 ? `${(f.boyut / 1048576).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(f.boyut / 1024))} KB`}</span></span>
    </a>
  );
}

/* ───────────── Hazır yanıt menüsü ───────────── */
function HazirMenu({ l, sec, kapat, ara }: { l: Hazir[]; sec: (h: Hazir) => void; kapat: () => void; ara: string }) {
  const kok = useRef<HTMLDivElement>(null);
  useEffect(() => { const f = (e: MouseEvent) => { if (!kok.current?.contains(e.target as Node)) kapat(); }; const t = (e: KeyboardEvent) => e.key === "Escape" && kapat(); addEventListener("mousedown", f); addEventListener("keydown", t); return () => { removeEventListener("mousedown", f); removeEventListener("keydown", t); }; }, [kapat]);
  const q = ara.toLocaleLowerCase("tr");
  const s = l.filter((h) => !q || `${h.baslik} ${h.metin}`.toLocaleLowerCase("tr").includes(q));
  return (
    <motion.div ref={kok} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.14 }} className="bd-panel absolute bottom-full left-0 z-30 mb-2 max-h-[300px] w-[min(420px,100%)] overflow-y-auto rounded-[16px] p-1.5 [scrollbar-width:thin]">
      {s.length ? s.map((h) => (
        <button key={h.id} type="button" onClick={() => sec(h)} className="flex w-full flex-col rounded-[10px] px-2.5 py-2 text-left hover:bg-white/[0.06]">
          <span className="text-[13px] font-medium text-white">{h.baslik}</span><span className="line-clamp-2 text-[12px] leading-snug text-white/50">{h.metin}</span>
        </button>
      )) : <p className="px-2.5 py-3 text-[12.5px] text-white/45">Eşleşen hazır yanıt yok.</p>}
    </motion.div>
  );
}

/* ───────────── Ayrıntılar ───────────── */
function Ayrintilar({ k, ajan, islem, gidiyor, kisi }: { k: Konusma; ajan: AjanBilgisi; islem: (g: Record<string, unknown>) => Promise<Record<string, unknown> | null>; gidiyor: string; kisi?: KisiOzet | null }) {
  const [ozet, setOzet] = useState<Record<string, string> | null>(null);
  const [ozetHata, setOzetHata] = useState("");
  const [yeniEtiket, setYeniEtiket] = useState("");
  useEffect(() => { setOzet(null); setOzetHata(""); }, [k.id]);
  const etiketler = [...new Set([...ajan.etiketler, ...k.etiketler])];
  const etiketDegistir = (e: string) => islem({ islem: "etiket", etiketler: k.etiketler.includes(e) ? k.etiketler.filter((x) => x !== e) : [...k.etiketler, e] });
  const grup = "rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]";
  const baslik = "flex items-center gap-2 border-b border-white/[0.05] px-3.5 py-2.5 text-[12.5px] font-semibold text-white";
  const satir = (a: string, b: React.ReactNode) => <div className="flex items-center justify-between gap-3 px-3.5 py-2 text-[12.5px]"><dt className="text-white/45">{a}</dt><dd className="min-w-0 truncate text-right text-white/85">{b}</dd></div>;
  return (
    <div className="space-y-3">
      <section className={grup}>
        <p className={baslik}><UserRound className="h-3.5 w-3.5 text-white/55" />Kişi</p>
        <dl className="divide-y divide-white/[0.04]">
          {satir("Ad", k.iletisim?.ad ?? "Bilinmiyor")}
          {k.iletisim?.eposta && satir("E-posta", <a href={`mailto:${k.iletisim.eposta}`} className="text-[#8be6ff] hover:underline">{k.iletisim.eposta}</a>)}
          {k.iletisim?.telefon && satir("Telefon", <a href={`tel:${k.iletisim.telefon}`} className="hover:underline">{k.iletisim.telefon}</a>)}
          {k.adres && !k.iletisim?.eposta && satir("Adres", k.adres)}
          {satir("Kanal", <span className="inline-flex items-center gap-1.5"><KanalSimge k={k.kaynak} boyut={18} />{KANAL_AD[k.kaynak]}</span>)}
          {k.site && satir("Site", k.site)}
          {k.konu && satir("Konu", k.konu)}
        </dl>
      </section>
      {kisi && (
        <section className={grup}>
          <div className={cn(baslik, "justify-between")}><span className="flex items-center gap-2"><Fingerprint className="h-3.5 w-3.5 text-white/55" />Kanallar arası kişi</span><Link href={`/panel/build/ajanlar/kisiler?id=${kisi.id}`} className="text-[11.5px] font-medium text-[#8be6ff] hover:underline">Profil</Link></div>
          <div className="space-y-2 px-3.5 py-3 text-[12.5px]">
            <div className="flex flex-wrap gap-1.5">{kisi.kanallar.map((c) => <span key={c} className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] py-0.5 pl-0.5 pr-2 text-[11.5px] text-white/75"><KanalSimge k={c} boyut={18} />{KANAL_AD[c]}</span>)}</div>
            {kisi.konusmalar.length > 0 && <div><p className="mb-1 text-[11.5px] text-white/45">Diğer konuşmaları</p><ul className="space-y-1">{kisi.konusmalar.slice(0, 4).map((c) => <li key={c.dosyaId} className="flex gap-2 text-white/75"><KanalSimge k={c.kanal} boyut={18} /><span className="min-w-0 flex-1 truncate">{c.ilk || "Mesajsız"}</span><span className="shrink-0 text-[11px] text-white/35">{gorece(c.zaman)}</span></li>)}</ul></div>}
            {Object.keys(kisi.ozellikler).length > 0 && <dl className="space-y-0.5">{Object.entries(kisi.ozellikler).slice(0, 6).map(([a, v]) => <div key={a} className="flex gap-2"><dt className="sc-kod text-[11.5px] text-white/45">{a}</dt><dd className="min-w-0 flex-1 truncate text-right text-white/80">{v}</dd></div>)}</dl>}
            {kisi.notlar.length > 0 && <ul className="space-y-1">{kisi.notlar.map((n) => <li key={n.id} className="text-white/70">“{n.metin}”</li>)}</ul>}
            {kisi.oneriler.length > 0 && <p className="rounded-[10px] bg-amber-400/[0.07] px-2.5 py-1.5 text-[12px] text-amber-100/85">{kisi.oneriler.length} olası eşleşme var; profilden birleştir.</p>}
          </div>
        </section>
      )}
      {k.prosedur && (
        <section className={grup}>
          <p className={baslik}><Workflow className="h-3.5 w-3.5 text-white/55" />Prosedür: {k.prosedur.ad}</p>
          <ol className="max-h-[200px] space-y-1 overflow-y-auto px-3.5 py-3 [scrollbar-width:thin]">{k.prosedur.iz.slice(-10).map((x, i) => <li key={i} className={cn("text-[12px] leading-snug", x.hata ? "text-rose-200" : "text-white/75")}>{x.baslik}{x.sonuc && <span className="block truncate text-[11px] text-white/40">{x.sonuc}</span>}</li>)}</ol>
        </section>
      )}
      <section className={grup}>
        <p className={baslik}><MessageSquareQuote className="h-3.5 w-3.5 text-white/55" />Konuşma</p>
        <dl className="divide-y divide-white/[0.04]">
          {satir("Ajan", <span className="inline-flex items-center gap-1.5"><AjanSimge src={ajan.simge} boyut={18} />{ajan.ad}</span>)}
          {k.atanan && satir("Atanan", `${k.atanan.ad}${k.atanan.kim === "otomatik" ? " (otomatik)" : ""}`)}
          {k.sla && k.sla.durum !== "yok" && k.sla.en && satir(`SLA: ${k.sla.en.ad}`, <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", SLA_TON[k.sla.durum])}>{kalanYaz(k.sla.en.kalan)}{k.sla.en.duraklatildi ? ", mesai dışı" : ""}</span>)}
          {k.ortam === "deneme" && satir("Ortam", "Deneme")}
          {k.aktifAjan && satir("Yürüten uzman", <span className="inline-flex items-center gap-1.5"><AjanSimge src={k.aktifAjan.simge} boyut={18} />{k.aktifAjan.ad}</span>)}
          {satir("Başladı", saatYaz(k.olusturma))}
          {satir("Mesaj", k.mesajlar.filter((m) => !m.olay).length)}
          {k.ilkYanit !== undefined && satir("İlk temsilci yanıtı", sureYaz(k.ilkYanit))}
          {k.kol && satir("A/B kolu", `${k.kol} · sürüm ${k.surum ?? ""}`)}
          {k.csat && satir("Memnuniyet", <span className="inline-flex items-center gap-1 text-amber-200"><Star className="h-3 w-3 fill-current" />5 üzerinden {k.csat.puan}</span>)}
          {!k.csat && k.tahmin && satir("Tahmini memnuniyet", `5 üzerinden ${k.tahmin.puan}`)}
        </dl>
        {k.csat?.yorum && <p className="border-t border-white/[0.05] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/75">“{k.csat.yorum}”</p>}
      </section>
      {k.devir && <div className="rounded-[16px] bg-amber-400/[0.06] p-3.5 ring-1 ring-inset ring-amber-300/15"><p className="text-[11.5px] text-amber-200/70">Devir nedeni · {gorece(k.devir.zaman)}</p><p className="mt-1 text-[13px] leading-relaxed text-amber-50/90">{k.devir.neden}</p></div>}
      <section className={grup}>
        <div className={cn(baslik, "justify-between")}><span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-white/55" />Yapay zekâ özeti</span>
          <button type="button" disabled={!!gidiyor} onClick={async () => { setOzetHata(""); const r = await islem({ islem: "ozet" }); if (r?.modelYok) setOzetHata("Bağlı bir model yok; özet çıkarılamadı."); else if (r?.ozet) setOzet(r.ozet as Record<string, string>); }} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.08] px-2.5 text-[11.5px] font-medium text-white hover:bg-white/[0.13]">{gidiyor === "ozet" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}{ozet ? "Yenile" : "Özetle"}</button></div>
        {ozet ? (
          <div className="space-y-2 px-3.5 py-3 text-[12.5px] leading-relaxed">
            <p className="text-white/85">{ozet.ozet}</p>
            {ozet.istek && <p><span className="text-white/45">İstek: </span><span className="text-white/80">{ozet.istek}</span></p>}
            {ozet.duygu && <p><span className="text-white/45">Duygu: </span><span className={cn(/olumsuz/i.test(ozet.duygu) ? "text-rose-300" : /olumlu/i.test(ozet.duygu) ? "text-[#8be6ff]" : "text-white/80")}>{ozet.duygu}</span></p>}
            {ozet.sonraki && <p><span className="text-white/45">İlk adım: </span><span className="text-white/80">{ozet.sonraki}</span></p>}
          </div>
        ) : <p className="px-3.5 py-3 text-[12px] leading-relaxed text-white/45">{ozetHata || "Devralmadan önce konuşmanın özetini, isteği ve ziyaretçinin duygusunu çıkar."}</p>}
      </section>
      <section className={grup}>
        <p className={baslik}><Bot className="h-3.5 w-3.5 text-white/55" />Yardımcıya sor</p>
        <Yardimci islem={islem} gidiyor={gidiyor} />
      </section>
      <section className={grup}>
        <p className={baslik}><Tags className="h-3.5 w-3.5 text-white/55" />Konular</p>
        <div className="space-y-2 px-3.5 py-3">
          {etiketler.length > 0 && <div className="flex flex-wrap gap-1.5">{etiketler.map((e) => { const s = k.etiketler.includes(e); return <button key={e} type="button" aria-pressed={s} onClick={() => etiketDegistir(e)} className={cn("h-7 rounded-full px-2.5 text-[12px] ring-1 ring-inset transition active:scale-95", s ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.04] text-white/60 ring-white/[0.08] hover:text-white")}>{e}</button>; })}</div>}
          <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); const x = yeniEtiket.trim(); if (x && !k.etiketler.includes(x)) islem({ islem: "etiket", etiketler: [...k.etiketler, x] }); setYeniEtiket(""); }}><input value={yeniEtiket} onChange={(e) => setYeniEtiket(e.target.value)} maxLength={40} placeholder="Yeni konu" className={cn(alanSinif, "h-8 text-[12.5px]")} /><button type="submit" disabled={!yeniEtiket.trim()} aria-label="Konu ekle" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white disabled:opacity-40"><Plus className="h-3.5 w-3.5" /></button></form>
        </div>
      </section>
      {k.kalite?.ihlaller.length ? (
        <section className="rounded-[16px] bg-rose-500/[0.05] ring-1 ring-inset ring-rose-400/15">
          <p className="flex items-center gap-2 border-b border-rose-400/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-100"><AlertTriangle className="h-3.5 w-3.5" />Kalite kuralı ihlali</p>
          <ul className="space-y-2 px-3.5 py-3">{k.kalite.ihlaller.map((x, i) => <li key={i} className="text-[12.5px] leading-relaxed"><p className="text-rose-100/90">{x.kural}</p><p className="text-white/55">{x.neden}</p></li>)}</ul>
        </section>
      ) : null}
      {k.yonlendirmeler.length > 0 && (
        <section className={grup}>
          <p className={baslik}><ArrowLeftRight className="h-3.5 w-3.5 text-white/55" />Yönlendirme izi</p>
          <ol className="space-y-2.5 px-3.5 py-3">{k.yonlendirmeler.map((y, i) => <li key={i} className="text-[12.5px] leading-relaxed"><p className="text-white/85">{y.kimden.ad} <span className="text-white/40">{y.geri ? "geri verdi:" : "aktardı:"}</span> {y.kime.ad}</p>{y.neden && <p className="text-white/50">{y.neden}</p>}<p className="text-[11px] text-white/35">{saatYaz(y.zaman)}</p></li>)}</ol>
        </section>
      )}
      <Link href={`/panel/build/ajanlar/${ajan.id}?bolum=konusmalar`} className={cn(ikincil, "w-full")}><Bot className="h-3.5 w-3.5" />Ajanı aç</Link>
    </div>
  );
}

/* ───────────── Konuşma ───────────── */
function KonusmaAlani({ secim, ayar, geri, yenile, ayrintiAc, ben }: { secim: { ajanId: string; id: string }; ayar: Ayar; geri: () => void; yenile: () => void; ayrintiAc: () => void; ben: string }) {
  const [kararNot, setKararNot] = useState("");
  const [v, setV] = useState<{ konusma: Konusma; ajan: AjanBilgisi } | null>(null);
  const [hata, setHata] = useState("");
  const [kip, setKip] = useState<"yanit" | "not">("yanit");
  const [metin, setMetin] = useState("");
  const [gidiyor, setGidiyor] = useState("");
  const [menu, setMenu] = useState(false);
  const alt = useRef<HTMLDivElement>(null);
  const alan = useRef<HTMLTextAreaElement>(null);
  const sonYaziyor = useRef(0);
  const yukle = useCallback(() => api<{ konusma: Konusma; ajan: AjanBilgisi }>(`/api/build/ajanlar/gelen?ajan=${secim.ajanId}&k=${secim.id}`).then(setV).catch(() => setHata("Konuşma bulunamadı.")), [secim.ajanId, secim.id]);
  useEffect(() => { setV(null); setHata(""); setMetin(""); setKip("yanit"); yukle(); }, [yukle]);
  useEffect(() => { if (!v || (v.konusma.durum !== "insan" && v.konusma.durum !== "devredildi")) return; const t = setInterval(yukle, 4000); return () => clearInterval(t); }, [v, yukle]);
  useEffect(() => { alt.current?.scrollIntoView({ block: "end" }); }, [v?.konusma.mesajlar.length, v?.konusma.notlar.length]);
  useEffect(() => { const t = alan.current; if (t) { t.style.height = "0px"; t.style.height = `${Math.min(t.scrollHeight, 180)}px`; } }, [metin]);
  const islem = useCallback(async (g: Record<string, unknown>) => {
    const sessiz = g.islem === "tamamla" || g.islem === "oneri" || g.islem === "cevir";
    if (!sessiz) { setGidiyor(String(g.islem === "durum" ? g.durum : g.islem)); setHata(""); }
    try {
      const r = await api<{ konusma?: Konusma; kanalHata?: string; bakiye?: number } & Record<string, unknown>>("/api/build/ajanlar/gelen", { govde: { ajan: secim.ajanId, k: secim.id, ...g, ...(ben ? { ben } : {}) } });
      buildKrediUygula(r);
      if (r.konusma) setV((x) => (x ? { ...x, konusma: r.konusma! } : x));
      if (r.kanalHata) setHata(r.kanalHata);
      if (["yanit", "durum", "etiket", "ata", "oncelik", "prosedur-karar"].includes(String(g.islem))) yenile();
      return r;
    } catch (e) { if (!sessiz) setHata(e instanceof ApiHatasi ? e.message : "Yapılamadı."); return null; } finally { if (!sessiz) setGidiyor(""); }
  }, [secim.ajanId, secim.id, yenile, ben]);
  /* Canlı yardım: öneriler (yeni ziyaretçi mesajında), yazarken tamamlama, otomatik çeviri. Tercihler bu cihazda saklanır. */
  const [canliAcik, setCanliAcik] = useState(true);
  const [yazarkenAcik, setYazarkenAcik] = useState(true);
  useEffect(() => { setCanliAcik(tercihOku("vayra-gelen-canli", true)); setYazarkenAcik(tercihOku("vayra-gelen-tamamla", true)); }, []);
  const [oneri, setOneri] = useState<Oneri | null>(null);
  const [oneriYuk, setOneriYuk] = useState(false);
  const [oneriHata, setOneriHata] = useState("");
  const [oneriGizli, setOneriGizli] = useState("");
  const oneriIste = useCallback(async () => {
    setOneriYuk(true); setOneriHata("");
    const r = await islem({ islem: "oneri" });
    setOneriYuk(false);
    if (!r) setOneriHata("Öneri alınamadı.");
    else if (r.modelYok) setOneriHata("Bağlı bir model yok; öneri çıkarılamadı.");
    else if (r.oneri) setOneri(r.oneri as Oneri);
  }, [islem]);
  const sonZiyaretci = v ? [...v.konusma.mesajlar].reverse().find((m) => m.rol === "kullanici" && !m.olay) : undefined;
  const sonMesajZiyaretci = !!v && v.konusma.mesajlar.filter((m) => !m.olay).at(-1)?.rol === "kullanici";
  const insanda = v?.konusma.durum === "insan" || v?.konusma.durum === "devredildi";
  const oneriIstendi = useRef("");
  useEffect(() => {
    if (!canliAcik || !insanda || !sonMesajZiyaretci || !sonZiyaretci || oneriIstendi.current === sonZiyaretci.id) return;
    oneriIstendi.current = sonZiyaretci.id; setOneri(null); setOneriGizli("");
    oneriIste();
  }, [canliAcik, insanda, sonMesajZiyaretci, sonZiyaretci, oneriIste]);
  // Otomatik çeviri: temsilcinin dilinde olmayan yeni ziyaretçi mesajları çevrilir (her yeni mesajda bir kez).
  const ceviriAcik = ayar.ceviri?.acik;
  const ceviriIstendi = useRef("");
  useEffect(() => {
    if (!ceviriAcik || !v || !sonZiyaretci || sonZiyaretci.ceviri || ceviriIstendi.current === sonZiyaretci.id) return;
    ceviriIstendi.current = sonZiyaretci.id;
    islem({ islem: "cevir", dil: ayar.ceviri.dil });
  }, [ceviriAcik, v, sonZiyaretci, islem, ayar.ceviri?.dil]);
  const ceviriyle = !!ceviriAcik && !!v?.konusma.dil && v.konusma.dil !== ayar.ceviri.dil;
  // Yazarken tamamlama: yazmayı bırakınca (900 ms) cümlenin devamı soluk görünür, Tab ile kabul edilir.
  const [devam, setDevam] = useState("");
  const devamIcin = useRef("");
  useEffect(() => {
    setDevam("");
    if (!yazarkenAcik || kip !== "yanit" || metin.trim().length < 12 || metin.startsWith("/") || /\n$/.test(metin)) return;
    const t = setTimeout(async () => {
      devamIcin.current = metin;
      const r = await islem({ islem: "tamamla", metin });
      if (devamIcin.current === metin && typeof r?.devam === "string") setDevam(r.devam);
    }, 900);
    return () => clearTimeout(t);
  }, [metin, kip, yazarkenAcik, islem]);
  useEffect(() => { const f = (e: Event) => { const x = String((e as CustomEvent).detail ?? ""); if (x) { setKip("yanit"); setMetin((m) => (m.trim() ? `${m.trim()}\n${x}` : x)); alan.current?.focus(); } }; addEventListener(YARDIM_OLAY, f); return () => removeEventListener(YARDIM_OLAY, f); }, []);
  const gonder = async () => {
    const m = metin.trim();
    if (!m) return;
    const r = await islem(kip === "yanit" ? { islem: "yanit", metin: m, ...(ceviriyle ? { cevir: true } : {}) } : { islem: "not", not: m });
    if (r) { setMetin(""); setDevam(""); setOneri(null); }
  };
  const yaz = (x: string) => {
    setMetin(x);
    if (x.startsWith("/") && !x.includes(" ")) setMenu(true);
    if (kip === "yanit" && x.trim() && Date.now() - sonYaziyor.current > 3000) { sonYaziyor.current = Date.now(); api("/api/build/ajanlar/gelen", { govde: { ajan: secim.ajanId, k: secim.id, islem: "yaziyor", ...(ben ? { ben } : {}) } }).catch(() => {}); }
  };
  const taslak = async () => { const r = await islem({ islem: "taslak" }); if (r?.modelYok) setHata("Bağlı bir model yok; taslak yazılamadı."); else if (typeof r?.taslak === "string") { setKip("yanit"); setMetin(r.taslak); alan.current?.focus(); } };
  const akis = useMemo(() => {
    if (!v) return [];
    const l: ({ tur: "m"; m: Mesaj; z: number } | { tur: "n"; n: Not; z: number })[] = [...v.konusma.mesajlar.map((m) => ({ tur: "m" as const, m, z: m.zaman })), ...v.konusma.notlar.map((n) => ({ tur: "n" as const, n, z: n.zaman }))];
    return l.sort((a, b) => a.z - b.z);
  }, [v]);
  if (!v) return <div className="flex flex-1 items-center justify-center">{hata ? <p className="text-[13px] text-rose-300">{hata}</p> : <Loader2 className="h-5 w-5 animate-spin text-white/40" />}</div>;
  const k = v.konusma, d = GELEN_DURUM[k.durum];
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-2.5 sm:px-4">
        <button type="button" onClick={geri} aria-label="Listeye dön" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white lg:hidden"><ArrowLeft className="h-4 w-4" /></button>
        <KanalSimge k={k.kaynak} boyut={34} />
        <div className="min-w-0 flex-1"><p className="flex items-center gap-2 truncate text-[14.5px] font-semibold text-white">{kisiAdi(k, k.id)}<span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium", TON_SINIF[d.ton])}>{d.ad}</span></p><p className="flex min-w-0 items-center gap-1.5 truncate text-[12px] text-white/45"><span className="truncate">{v.ajan.ad} · {KANAL_AD[k.kaynak]}{k.konu ? ` · ${k.konu}` : ""}{k.dil && ceviriAcik ? ` · ${dilAd(k.dil)}` : ""}</span>{k.pencere && <PencereRozeti p={k.pencere} />}</p></div>
        <div className="flex flex-wrap items-center gap-1.5">
          {ayar.ekip.length > 0 && <div className="w-[150px] max-sm:w-[120px]"><AcilirSecim deger={k.atanan?.id ?? ""} set={(t) => islem({ islem: "ata", temsilci: t })} bos="Atanmamış" l={ayar.ekip.filter((t) => t.rol !== "izleyici").map((t) => ({ id: t.id, ad: t.id === ben ? `${t.ad} (ben)` : t.ad, alt: TDURUM[t.durum].ad }))} /></div>}
          <div className="w-[118px]"><AcilirSecim deger={k.oncelik ?? "normal"} set={(o) => islem({ islem: "oncelik", oncelik: o })} l={ONCELIK.map((o) => ({ id: o.id, ad: o.ad }))} /></div>
          {k.durum === "devredildi" && <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "durum", durum: "insan" })} className={cn(birincil, "h-8 px-3 text-[12.5px]")}>{gidiyor === "insan" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Users className="h-3.5 w-3.5" />}Devral</button>}
          {k.durum !== "acik" && <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "durum", durum: "acik" })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Bot className="h-3.5 w-3.5" /><span className="max-sm:hidden">Ajana geri ver</span><span className="sm:hidden">Ajana ver</span></button>}
          {k.durum !== "cozuldu" && <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "durum", durum: "cozuldu" })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><CheckCircle2 className="h-3.5 w-3.5" />Çözüldü</button>}
          <button type="button" onClick={ayrintiAc} aria-label="Ayrıntılar" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white xl:hidden"><Info className="h-3.5 w-3.5" /></button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin] sm:px-5">
        <div className="mx-auto max-w-[720px] space-y-4">
          {akis.map((x) => x.tur === "n" ? (
            <div key={`n-${x.n.id}`} className="ml-auto max-w-[88%] rounded-[16px] bg-amber-300/[0.07] px-3.5 py-2.5 ring-1 ring-inset ring-amber-300/20">
              <p className="mb-1 flex items-center gap-1.5 text-[11.5px] font-medium text-amber-200/80"><StickyNote className="h-3 w-3" />İç not · {x.n.yazan} · {saatYaz(x.n.zaman)}</p>
              <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-amber-50/90">{x.n.metin}</p>
            </div>
          ) : x.m.olay ? <OlayAyrac key={x.m.id} tur={x.m.olay.tur} metin={x.m.olay.metin} /> : x.m.rol === "kullanici" ? (
            <div key={x.m.id} className="max-w-[85%]">
              {x.m.ceviri && x.m.ceviri.metin.trim() !== (x.m.metin ?? "").trim() ? (
                <div className="rounded-[18px] rounded-tl-[5px] bg-white/[0.08] px-3.5 py-2">
                  <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-white">{x.m.ceviri.metin}</p>
                  <CeviriSatiri etiket={`Çevrildi${k.dil ? `, özgün dili ${dilAd(k.dil)}` : ""}`} metin={x.m.metin ?? ""} />
                </div>
              ) : <p className="whitespace-pre-wrap break-words rounded-[18px] rounded-tl-[5px] bg-white/[0.08] px-3.5 py-2 text-[14px] leading-relaxed text-white">{x.m.metin}</p>}
              {x.m.dosyalar?.length ? <div className="mt-1.5 flex flex-wrap gap-1.5">{x.m.dosyalar.map((f) => <DosyaKutusu key={f.id} f={f} />)}</div> : null}
              <p className="mt-1 text-[11px] text-white/35">{saatYaz(x.m.zaman)}</p>
            </div>
          ) : (
            <div key={x.m.id} className={cn("ml-auto max-w-[88%] rounded-[18px] rounded-tr-[5px] px-3.5 py-2.5", x.m.insan ? "bg-[#55d6fd]/[0.1] ring-1 ring-inset ring-[#55d6fd]/20" : "bg-white/[0.035] ring-1 ring-inset ring-white/[0.06]")}>
              <p className="mb-1 flex items-center gap-1.5 text-[11.5px] font-medium text-white/50">{x.m.insan ? <><Users className="h-3 w-3 text-[#8be6ff]" /><span className="text-[#8be6ff]">{x.m.insan}</span></> : <><AjanSimge src={x.m.yanitlayan?.simge ?? v.ajan.simge} boyut={16} />{x.m.yanitlayan?.ad ?? v.ajan.ad}</>} · {saatYaz(x.m.zaman)}{x.m.begeni ? <span className={x.m.begeni === 1 ? "text-[#8be6ff]" : "text-rose-300"}> · {x.m.begeni === 1 ? "Yararlı bulundu" : "Yararlı bulunmadı"}</span> : null}</p>
              <div className="text-[13.5px]">{(x.m.parcalar ?? []).map((p, j) => p.tur === "metin" ? <Md key={j} metin={p.metin ?? ""} onizle={() => {}} /> : p.tur === "arac" ? <p key={j} className="text-[12px] text-white/45">{p.baslik}</p> : null)}</div>
              {x.m.sablon && <p className="mt-1 text-[11px] text-white/40">WhatsApp şablonu: {x.m.sablon.ad} · {x.m.sablon.dil}</p>}
              {x.m.ceviri && <CeviriSatiri etiket={`Senin yazdığın (${dilAd(x.m.ceviri.dil)})`} metin={x.m.ceviri.metin} />}
            </div>
          ))}
          <div ref={alt} />
        </div>
      </div>
      <div className="shrink-0 border-t border-white/[0.06] px-3 pb-3 pt-2.5 sm:px-4">
        {k.prosedur?.bekliyor === "temsilci" && (
          <div className="mx-auto mb-2.5 max-w-[720px] rounded-[16px] bg-[#55d6fd]/[0.07] p-3 ring-1 ring-inset ring-[#55d6fd]/20">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-white"><Workflow className="h-3.5 w-3.5 text-[#8be6ff]" />{k.prosedur.ad} onayını bekliyor</p>
            {k.prosedur.onayMetni && <p className="mt-1 text-[12.5px] leading-relaxed text-white/70">{k.prosedur.onayMetni}</p>}
            {Object.keys(k.prosedur.degiskenler).length > 0 && <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[12px]">{Object.entries(k.prosedur.degiskenler).filter(([a]) => !a.startsWith("kisi") && a !== "kanal").slice(0, 10).map(([a, x]) => <div key={a} className="flex min-w-0 gap-1.5"><dt className="sc-kod shrink-0 text-white/45">{a}</dt><dd className="truncate text-white/85">{x}</dd></div>)}</dl>}
            <div className="mt-2.5 flex flex-wrap gap-2"><input value={kararNot} onChange={(e) => setKararNot(e.target.value)} maxLength={300} placeholder="Ziyaretçiye iletilecek not (isteğe bağlı)" className={cn(alanSinif, "h-9 min-w-[200px] flex-1 text-[13px]")} /><button type="button" disabled={!!gidiyor} onClick={async () => { await islem({ islem: "prosedur-karar", karar: "evet", not: kararNot }); setKararNot(""); }} className={birincil}>{gidiyor === "prosedur-karar" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Onayla</button><button type="button" disabled={!!gidiyor} onClick={async () => { await islem({ islem: "prosedur-karar", karar: "hayir", not: kararNot }); setKararNot(""); }} className={ikincil}>Reddet</button></div>
          </div>
        )}
        {hata && <p className="mx-auto mb-2 flex max-w-[720px] items-start gap-2 text-[12.5px] leading-relaxed text-amber-200/90"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{hata}</p>}
        <AnimatePresence>{canliAcik && insanda && kip === "yanit" && oneriGizli !== (sonZiyaretci?.id ?? "") && (oneri || oneriYuk || oneriHata) && <CanliOneri oneri={oneri} yukleniyor={oneriYuk} hata={oneriHata} sec={(m) => { setMetin(m); alan.current?.focus(); }} kapat={() => setOneriGizli(sonZiyaretci?.id ?? "")} yenile={oneriIste} />}</AnimatePresence>
        {k.pencere?.kanal === "whatsapp" && !k.pencere.acik && kip === "yanit" && <div className="mb-2.5"><SablonPaneli islem={islem} gidiyor={gidiyor} /></div>}
        {k.pencere && !k.pencere.acik && k.pencere.insanEtiketi && kip === "yanit" && <p className="mx-auto mb-2 max-w-[720px] text-[12px] leading-relaxed text-white/50">Ziyaretçinin son mesajından 24 saat geçti; yanıtın Meta'nın insan temsilci etiketiyle gider (son mesajdan sonraki 7 gün içinde).</p>}
        <div className="mx-auto max-w-[720px]">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Secici id="gelen-kip" kucuk deger={kip} set={setKip} l={[{ id: "yanit", ad: "Yanıt" }, { id: "not", ad: "İç not" }]} />
            <div className="relative">
              <button type="button" onClick={() => setMenu((x) => !x)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:bg-white/[0.1] hover:text-white"><MessageSquareQuote className="h-3.5 w-3.5" />Hazır yanıt<ChevronDown className="h-3 w-3" /></button>
              <AnimatePresence>{menu && <HazirMenu l={ayar.hazirYanitlar} ara={metin.startsWith("/") ? metin.slice(1) : ""} kapat={() => setMenu(false)} sec={(h) => { setMenu(false); setMetin(h.metin); setKip("yanit"); alan.current?.focus(); }} />}</AnimatePresence>
            </div>
            <button type="button" onClick={taslak} disabled={!!gidiyor} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:bg-white/[0.1] hover:text-white disabled:opacity-40">{gidiyor === "taslak" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-[#8be6ff]" />}Taslak yaz</button>
            {kip === "yanit" && <YenidenYaz metin={metin} islem={islem} uygula={(m) => { setMetin(m); alan.current?.focus(); }} hata={setHata} />}
            <button type="button" aria-pressed={canliAcik} title="Yeni ziyaretçi mesajında hazır yanıt ve sıradaki adım öner" onClick={() => { const x = !canliAcik; setCanliAcik(x); tercihYaz("vayra-gelen-canli", x); if (x && insanda) { oneriIstendi.current = ""; } }} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] ring-inset", canliAcik ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.06] text-white/60 ring-1 ring-white/[0.08]")}><Lightbulb className="h-3.5 w-3.5" />Canlı öneri</button>
            <button type="button" aria-pressed={yazarkenAcik} title="Yazarken cümlenin devamını öner; Tab ile kabul et" onClick={() => { const x = !yazarkenAcik; setYazarkenAcik(x); tercihYaz("vayra-gelen-tamamla", x); }} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] ring-inset max-sm:hidden", yazarkenAcik ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.06] text-white/60 ring-1 ring-white/[0.08]")}>Yazarken öneri</button>
            <span className="ml-auto text-[11.5px] text-white/35 max-sm:hidden">{kip === "not" ? "Ziyaretçi iç notları görmez" : ceviriyle ? `${dilAd(k.dil)} diline çevrilip gider` : k.kaynak === "sayfa" || k.kaynak === "kutu" ? "Ziyaretçi sohbet kutusunda görür" : `${KANAL_AD[k.kaynak]} kanalına gider`}</span>
          </div>
          <form className={cn("flex items-end gap-2 rounded-[20px] p-1.5 pl-4", kip === "not" ? "bg-amber-300/[0.06] ring-1 ring-inset ring-amber-300/20" : "cam-istemci")} onSubmit={(e) => { e.preventDefault(); gonder(); }}>
            <div className="relative min-w-0 flex-1">
              {devam && <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words py-2.5 text-[14px] leading-relaxed"><span className="invisible">{metin}</span><span className="text-white/35">{devam}</span><span className="ml-1.5 rounded-[5px] bg-white/[0.08] px-1 text-[10.5px] text-white/45">Tab</span></div>}
              <textarea ref={alan} value={metin} onChange={(e) => yaz(e.target.value)} rows={1} maxLength={4000} placeholder={kip === "not" ? "Ekibe not yaz; ziyaretçi görmez" : k.durum === "acik" ? "Yazarsan konuşma senin üzerine geçer; / ile hazır yanıt" : "Ziyaretçiye yanıt yaz; / ile hazır yanıt"}
                onKeyDown={(e) => { if (e.key === "Tab" && devam && !e.shiftKey) { e.preventDefault(); setMetin((m) => m + devam); setDevam(""); return; } if (e.key === "Escape" && devam) { setDevam(""); return; } if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); gonder(); } }}
                className="relative block max-h-[180px] min-h-[40px] w-full resize-none bg-transparent py-2.5 text-[14px] leading-relaxed text-white outline-none placeholder:text-white/40" />
            </div>
            <button type="submit" disabled={!metin.trim() || !!gidiyor} aria-label={kip === "not" ? "Notu kaydet" : "Yanıtı gönder"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition active:scale-95 disabled:opacity-35">{gidiyor === "yanit" || gidiyor === "not" ? <Loader2 className="h-4 w-4 animate-spin" /> : kip === "not" ? <StickyNote className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Mesai takvimi (SLA) ───────────── */
function TakvimAyari({ t, set }: { t: Takvim; set: (t: Takvim) => void }) {
  const [ozelDilim, setOzelDilim] = useState(!SAAT_DILIMLERI.includes(t.saatDilimi));
  const [tatil, setTatil] = useState({ tarih: "", ad: "" });
  const gun = (i: number, g: Takvim["gunler"][number]) => set({ ...t, gunler: t.gunler.map((x, j) => (j === i ? g : x)) });
  const saatSinif = cn(alanSinif, "h-8 w-[92px] px-2 text-[12.5px] tabular-nums");
  return (
    <div className="px-3.5 py-3">
      <div className="flex items-center gap-3"><span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">Mesai takvimi</span><span className="block text-[12px] text-white/45">SLA saati yalnız çalışma saatlerinde işler; gece, hafta sonu ve tatilde durur.</span></span><Anahtar acik={t.acik} set={(x) => set({ ...t, acik: x })} etiket="Mesai takvimi" /></div>
      {t.acik && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] text-white/60">Saat dilimi</span>
            <div className="w-[200px]"><AcilirSecim deger={ozelDilim ? "ozel" : t.saatDilimi} set={(x) => { if (x === "ozel") setOzelDilim(true); else { setOzelDilim(false); set({ ...t, saatDilimi: x }); } }} l={[...SAAT_DILIMLERI.map((z) => ({ id: z, ad: z.replace(/_/g, " ") })), { id: "ozel", ad: "Özel" }]} /></div>
            {ozelDilim && <input value={t.saatDilimi} onChange={(e) => set({ ...t, saatDilimi: e.target.value.trim() })} placeholder="Bölge/Şehir, ör. Asia/Baku" className={cn(alanSinif, "h-9 w-[200px] text-[12.5px]")} />}
          </div>
          <div className="space-y-1">
            {GUN_SIRA.map((i) => { const g = t.gunler[i]; return (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <span className="w-[88px] text-[12.5px] text-white/75">{GUN_ADI[i]}</span>
                <Anahtar acik={!!g} set={(x) => gun(i, x ? { bas: "09:00", bit: "18:00" } : null)} etiket={`${GUN_ADI[i]} açık`} />
                {g ? <><input type="time" value={g.bas} onChange={(e) => gun(i, { ...g, bas: e.target.value })} className={saatSinif} /><span className="text-[12px] text-white/40">ile</span><input type="time" value={g.bit === "24:00" ? "23:59" : g.bit} onChange={(e) => gun(i, { ...g, bit: e.target.value })} className={saatSinif} /></> : <span className="text-[12px] text-white/40">Kapalı</span>}
              </div>
            ); })}
          </div>
          <div>
            <p className="mb-1.5 text-[12.5px] text-white/60">Tatiller</p>
            <div className="flex flex-wrap gap-1.5">
              {t.tatiller.map((h) => <span key={h.tarih} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/[0.06] pl-2.5 pr-1 text-[12px] text-white/80">{h.tarih} · {h.ad}<button type="button" aria-label="Tatili kaldır" onClick={() => set({ ...t, tatiller: t.tatiller.filter((x) => x.tarih !== h.tarih) })} className="flex h-5 w-5 items-center justify-center rounded-full text-white/50 hover:text-white"><X className="h-3 w-3" /></button></span>)}
              {!t.tatiller.length && <span className="text-[12px] text-white/40">Tatil eklenmedi.</span>}
            </div>
            <form className="mt-2 flex flex-wrap gap-1.5" onSubmit={(e) => { e.preventDefault(); if (!tatil.tarih) return; set({ ...t, tatiller: [...t.tatiller.filter((x) => x.tarih !== tatil.tarih), { tarih: tatil.tarih, ad: tatil.ad.trim() || "Tatil" }].sort((a, b) => a.tarih.localeCompare(b.tarih)) }); setTatil({ tarih: "", ad: "" }); }}>
              <input type="date" value={tatil.tarih} onChange={(e) => setTatil({ ...tatil, tarih: e.target.value })} className={cn(alanSinif, "h-9 w-[150px] text-[12.5px]")} />
              <input value={tatil.ad} onChange={(e) => setTatil({ ...tatil, ad: e.target.value })} maxLength={60} placeholder="Ad, ör. Yılbaşı" className={cn(alanSinif, "h-9 min-w-[140px] flex-1 text-[12.5px]")} />
              <button type="submit" disabled={!tatil.tarih} className={cn(ikincil, "h-9")}><Plus className="h-3.5 w-3.5" />Ekle</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── Ayar paneli ───────────── */
function AyarPaneli({ acik, kapat, ayar, kaydet, ajanlar }: { acik: boolean; kapat: () => void; ayar: Ayar; kaydet: (a: Ayar) => Promise<void>; ajanlar: { id: string; ad: string; simge: string }[] }) {
  const [v, setV] = useState(ayar);
  const [durum, setDurum] = useState("");
  const [sekme, setSekme] = useState<"hazir" | "ekip" | "kural">("hazir");
  useEffect(() => { if (acik) { setV(ayar); setDurum(""); } }, [acik, ayar]);
  const set = (i: number, p: Partial<Hazir>) => setV((x) => ({ ...x, hazirYanitlar: x.hazirYanitlar.map((h, j) => (j === i ? { ...h, ...p } : h)) }));
  const tset = (i: number, p: Partial<Ayar["ekip"][number]>) => setV((x) => ({ ...x, ekip: x.ekip.map((t, j) => (j === i ? { ...t, ...p } : t)) }));
  const sla = (p: Partial<SlaAyar>) => setV((x) => ({ ...x, sla: { ...x.sla, ...p } }));
  const sayiAlan = (deger: number, f: (n: number) => void, birim: string) => <span className="flex items-center gap-1.5"><input type="number" min={1} value={deger} onChange={(e) => f(Number(e.target.value) || 1)} className={cn(alanSinif, "h-9 w-[84px] text-right text-[13px] tabular-nums")} /><span className="text-[12px] text-white/45">{birim}</span></span>;
  return (
    <YanPanel acik={acik} kapat={kapat} genis baslik="Gelen kutusu ayarları" alt={durum || "Hazır yanıtlar, ekip, atama ve SLA bütün ajanlarda geçerli"}
      alt2={<><Secici id="gelen-ayar-sekme" deger={sekme} set={setSekme} l={[{ id: "hazir", ad: "Hazır yanıtlar" }, { id: "ekip", ad: "Ekip" }, { id: "kural", ad: "Atama ve SLA" }]} /><span className="flex-1" /><button type="button" onClick={async () => { setDurum("Kaydediliyor"); try { await kaydet(v); setDurum("Kaydedildi"); } catch (e) { setDurum(e instanceof ApiHatasi ? e.message : "Kaydedilemedi"); } }} className={birincil}>Kaydet</button></>}>
      {sekme === "hazir" && (
        <div className="space-y-4">
          <section className="rounded-[16px] ring-1 ring-inset ring-white/[0.07]">
            <div className="flex items-center gap-3 px-3.5 py-3"><span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">Otomatik çeviri</span><span className="block text-[12px] text-white/45">Ziyaretçi başka dilde yazarsa mesajları senin dilinde görürsün; yanıtın ziyaretçinin diline çevrilip gider. Her çeviri Build kredisi harcar.</span></span><Anahtar acik={!!v.ceviri?.acik} set={(x) => setV({ ...v, ceviri: { dil: v.ceviri?.dil ?? "tr", acik: x } })} etiket="Otomatik çeviri" /></div>
            {v.ceviri?.acik && (
              <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.05] px-3.5 py-3">
                <span className="text-[12.5px] text-white/60">Ekibin dili</span>
                <div className="w-[190px]"><AcilirSecim deger={DIL_AD[v.ceviri.dil] ? v.ceviri.dil : "ozel"} set={(x) => setV({ ...v, ceviri: { ...v.ceviri, dil: x === "ozel" ? "" : x } })} l={[...Object.entries(DIL_AD).map(([id, ad]) => ({ id, ad })), { id: "ozel", ad: "Özel" }]} /></div>
                {!DIL_AD[v.ceviri.dil] && <input value={v.ceviri.dil} onChange={(e) => setV({ ...v, ceviri: { ...v.ceviri, dil: e.target.value.toLowerCase().replace(/[^a-z]/g, "").slice(0, 3) } })} placeholder="Dil kodu, ör. id" className={cn(alanSinif, "h-9 w-[150px] text-[12.5px]")} />}
              </div>
            )}
          </section>
          <label className="block"><span className="mb-1.5 block text-[12.5px] font-medium text-white/70">Varsayılan temsilci adı</span><input value={v.temsilci} onChange={(e) => setV({ ...v, temsilci: e.target.value })} maxLength={40} className={cn(alanSinif, "h-10")} /><span className="mt-1 block text-[12px] text-white/40">Bu cihazda bir temsilci seçili değilken yanıtlarda bu ad görünür. {"{ad}"} ziyaretçinin adı, {"{temsilci}"} senin adın olur.</span></label>
          <div>
            <p className="mb-2 text-[12.5px] font-medium text-white/70">Hazır yanıtlar</p>
            <div className="space-y-2">
              {v.hazirYanitlar.map((h, i) => (
                <div key={h.id} className="rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
                  <div className="flex gap-2"><input value={h.baslik} onChange={(e) => set(i, { baslik: e.target.value })} maxLength={60} placeholder="Başlık" className={cn(alanSinif, "h-9 text-[13px] font-medium")} /><button type="button" onClick={() => setV({ ...v, hazirYanitlar: v.hazirYanitlar.filter((_, j) => j !== i) })} aria-label="Sil" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-rose-300/80 hover:bg-rose-500/[0.1]"><Trash2 className="h-3.5 w-3.5" /></button></div>
                  <textarea value={h.metin} onChange={(e) => set(i, { metin: e.target.value })} rows={2} maxLength={2000} className={cn(alanSinif, "mt-2 resize-y py-2 text-[13px] leading-relaxed")} />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setV({ ...v, hazirYanitlar: [...v.hazirYanitlar, { id: Math.random().toString(36).slice(2, 10), baslik: "Yeni hazır yanıt", metin: "" }] })} className={cn(ikincil, "mt-2")}><Plus className="h-3.5 w-3.5" />Hazır yanıt ekle</button>
          </div>
        </div>
      )}
      {sekme === "ekip" && (
        <div className="space-y-3">
          <p className="text-[12.5px] leading-relaxed text-white/55">Ekip aynı Vayra hesabıyla çalışır; herkes kendi cihazında gelen kutusunun üstünden kim olduğunu seçer. Rol, o cihazdan yapılabilecekleri sunucuda sınırlar: yönetici her şeyi, temsilci yanıt ve atamayı, izleyici yalnız okumayı.</p>
          {v.ekip.map((t, i) => (
            <div key={t.id} className="space-y-2 rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
              <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
                <input value={t.ad} onChange={(e) => tset(i, { ad: e.target.value })} maxLength={40} placeholder="Ad" className={cn(alanSinif, "h-10 text-[13px] font-medium")} />
                <AcilirSecim deger={t.rol} set={(r) => tset(i, { rol: r as EkipKisi["rol"] })} l={[{ id: "yonetici", ad: "Yönetici" }, { id: "temsilci", ad: "Temsilci" }, { id: "izleyici", ad: "İzleyici" }]} />
                <button type="button" onClick={() => setV({ ...v, ekip: v.ekip.filter((_, j) => j !== i) })} aria-label="Temsilciyi sil" className="flex h-10 w-10 items-center justify-center rounded-full text-rose-300/80 hover:bg-rose-500/[0.1]"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-white/60">
                <span className="flex items-center gap-1.5">Kapasite{sayiAlan(t.kapasite, (n) => tset(i, { kapasite: Math.min(100, n) }), "açık konuşma")}</span>
                <div className="min-w-[200px] flex-1"><AcilirSecim deger={t.ajanlar[0] ?? ""} set={(x) => tset(i, { ajanlar: x ? [x] : [] })} bos="Bütün ajanlar" l={ajanlar.map((a) => ({ id: a.id, ad: a.ad, gorsel: a.simge }))} /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setV({ ...v, ekip: [...v.ekip, { id: Math.random().toString(36).slice(2, 10), ad: "Yeni temsilci", rol: "temsilci", kapasite: 5, durum: "cevrimici", ajanlar: [], kanallar: [] }] })} className={ikincil}><Plus className="h-3.5 w-3.5" />Temsilci ekle</button>
        </div>
      )}
      {sekme === "kural" && (
        <div className="space-y-4">
          <section className="divide-y divide-white/[0.05] rounded-[16px] ring-1 ring-inset ring-white/[0.07]">
            <div className="flex items-center gap-3 px-3.5 py-3"><span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">Otomatik atama</span><span className="block text-[12px] text-white/45">İnsana devredilen konuşma, kapasitesi dolmamış bir temsilciye atanır; konuşma çözülünce sıradaki atanmamış konuşma boşalan kişiye gider.</span></span><Anahtar acik={v.atama.otomatik} set={(x) => setV({ ...v, atama: { ...v.atama, otomatik: x } })} etiket="Otomatik atama" /></div>
            <div className="flex flex-wrap items-center gap-3 px-3.5 py-3"><span className="min-w-[160px] flex-1 text-[13px] text-white">Yöntem</span><Secici id="atama-yontem" kucuk deger={v.atama.yontem} set={(x) => setV({ ...v, atama: { ...v.atama, yontem: x } })} l={[{ id: "sirayla", ad: "Sırayla" }, { id: "enAz", ad: "En az yüklüye" }]} /></div>
            <div className="flex items-center gap-3 px-3.5 py-3"><span className="min-w-0 flex-1 text-[13px] text-white">Yalnız çevrimiçi temsilcilere</span><Anahtar acik={v.atama.yalnizCevrimici} set={(x) => setV({ ...v, atama: { ...v.atama, yalnizCevrimici: x } })} etiket="Yalnız çevrimiçi" /></div>
          </section>
          <section className="divide-y divide-white/[0.05] rounded-[16px] ring-1 ring-inset ring-white/[0.07]">
            <div className="flex items-center gap-3 px-3.5 py-3"><span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">SLA hedefleri</span><span className="block text-[12px] text-white/45">Devirden sonra ilk yanıt, ziyaretçinin her yeni mesajına sonraki yanıt ve çözüm süresi izlenir; liste en acil olana göre sıralanır.</span></span><Anahtar acik={v.sla.acik} set={(x) => sla({ acik: x })} etiket="SLA" /></div>
            <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5"><span className="min-w-[160px] flex-1 text-[13px] text-white">İlk yanıt</span>{sayiAlan(v.sla.ilkYanit, (n) => sla({ ilkYanit: n }), "dakika")}</div>
            <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5"><span className="min-w-[160px] flex-1 text-[13px] text-white">Sonraki yanıt</span>{sayiAlan(v.sla.sonrakiYanit, (n) => sla({ sonrakiYanit: n }), "dakika")}</div>
            <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5"><span className="min-w-[160px] flex-1 text-[13px] text-white">Çözüm</span>{sayiAlan(v.sla.cozum, (n) => sla({ cozum: n }), "saat")}</div>
            <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5"><span className="min-w-[160px] flex-1 text-[13px] text-white">Yaklaşıyor uyarısı</span><Secici id="sla-uyari" kucuk deger={String(v.sla.uyariYuzde)} set={(x) => sla({ uyariYuzde: Number(x) })} l={[{ id: "50", ad: "Yüzde 50" }, { id: "75", ad: "Yüzde 75" }, { id: "90", ad: "Yüzde 90" }]} /></div>
            <div className="px-3.5 py-2.5"><p className="mb-1.5 text-[12.5px] text-white/60">Önceliğe göre süre çarpanı: acil {v.sla.carpan.acil}, yüksek {v.sla.carpan.yuksek}, normal 1, düşük {v.sla.carpan.dusuk}</p></div>
            <TakvimAyari t={v.sla.takvim ?? VARSAYILAN_TAKVIM} set={(t) => sla({ takvim: t })} />
            <label className="block px-3.5 py-3"><span className="mb-1 block text-[13px] text-white">Aşım bildirimi</span><input value={v.sla.bildirim ?? ""} onChange={(e) => sla({ bildirim: e.target.value || undefined })} placeholder="https://hooks.slack.com/services/..." className={cn(alanSinif, "sc-kod h-10 text-[13px]")} /><span className="mt-1 block text-[12px] text-white/40">SLA aşılınca bu adrese bir kez JSON gönderilir (Slack gelen web kancası uyumlu). Gelen kutusunun üstünde de uyarı görünür.</span></label>
          </section>
        </div>
      )}
    </YanPanel>
  );
}

const BEN_ANAHTAR = "vayra-gelen-ben";
/** Canlı destek gelen kutusu: solda görünümlü ve süzgeçli liste (toplu işlem), ortada konuşma, sağda kişi ve konuşma ayrıntıları. */
export function GelenKutusu() {
  const [sekme, setSekme] = useState<Sekme>("bekliyor");
  const [ajan, setAjan] = useState("");
  const [kanal, setKanal] = useState("");
  const [etiket, setEtiket] = useState("");
  const [ara, setAra] = useState("");
  const [gorunum, setGorunum] = useState<Gorunum | null>(null);
  const [v, setV] = useState<Liste | null>(null);
  const [secim, setSecim] = useState<{ ajanId: string; id: string } | null>(null);
  const [ayar, setAyar] = useState<Ayar>(BOS_AYAR);
  const [ayarAcik, setAyarAcik] = useState(false);
  const [ayrinti, setAyrinti] = useState<{ konusma: Konusma; ajan: AjanBilgisi; kisi?: KisiOzet | null } | null>(null);
  const [ayrintiAcik, setAyrintiAcik] = useState(false);
  const [ben, setBenHam] = useState("");
  const [isaret, setIsaret] = useState<Set<string>>(new Set());
  const [topluSonuc, setTopluSonuc] = useState("");
  const [toplugidiyor, setTopluGidiyor] = useState(false);
  const [gorunumAd, setGorunumAd] = useState<string | null>(null);
  useEffect(() => { try { setBenHam(localStorage.getItem(BEN_ANAHTAR) ?? ""); } catch { /* yok */ } }, []);
  const setBen = (x: string) => { setBenHam(x); try { localStorage.setItem(BEN_ANAHTAR, x); } catch { /* yok */ } };
  const suzgec = useMemo(() => ({ sekme, ...(ajan ? { ajan } : {}), ...(kanal ? { kanal } : {}), ...(etiket ? { etiket } : {}), ...(ara.trim() ? { ara: ara.trim() } : {}), ...Object.fromEntries(Object.entries(gorunum?.suzgec ?? {}).filter(([, x]) => x)) }), [sekme, ajan, kanal, etiket, ara, gorunum]);
  const yukle = useCallback(() => {
    const q = new URLSearchParams({ ...suzgec, ...(ben ? { ben } : {}) } as Record<string, string>);
    return api<Liste>(`/api/build/ajanlar/gelen?${q}`).then(setV).catch(() => {});
  }, [suzgec, ben]);
  useEffect(() => { const t = setTimeout(yukle, ara ? 250 : 0); return () => clearTimeout(t); }, [yukle, ara]);
  useEffect(() => { const t = setInterval(yukle, 8000); return () => clearInterval(t); }, [yukle]);
  useEffect(() => { api<{ ayar: Ayar }>(`/api/build/ajanlar/gelen?ayar=1${ben ? `&ben=${encodeURIComponent(ben)}` : ""}`).then((x) => setAyar(x.ayar)).catch(() => {}); }, [ben]);
  useEffect(() => { if (!secim) return; const f = () => api<{ konusma: Konusma; ajan: AjanBilgisi; kisi?: KisiOzet | null }>(`/api/build/ajanlar/gelen?ajan=${secim.ajanId}&k=${secim.id}`).then(setAyrinti).catch(() => {}); f(); const t = setInterval(f, 6000); return () => clearInterval(t); }, [secim]);
  const islem = useCallback(async (g: Record<string, unknown>) => {
    if (!secim) return null;
    try { const r = await api<{ konusma?: Konusma } & Record<string, unknown>>("/api/build/ajanlar/gelen", { govde: { ajan: secim.ajanId, k: secim.id, ...g, ...(ben ? { ben } : {}) } }); buildKrediUygula(r as { bakiye?: number }); if (r.konusma) setAyrinti((x) => (x ? { ...x, konusma: r.konusma! } : x)); if (g.islem === "etiket") yukle(); return r; } catch { return null; }
  }, [secim, yukle, ben]);
  const [ayrintiGidiyor, setAyrintiGidiyor] = useState("");
  const ayrintiIslem = async (g: Record<string, unknown>) => { setAyrintiGidiyor(String(g.islem)); try { return await islem(g); } finally { setAyrintiGidiyor(""); } };
  const kanallar = useMemo(() => [...new Set((v?.ogeler ?? []).map((o) => o.konusma.kaynak))], [v]);
  const o = v?.olcu;
  const benKim = ayar.ekip.find((t) => t.id === ben);
  const anahtar = (x: Oge) => `${x.ajan.id}:${x.konusma.id}`;
  const toplu = async (g: Record<string, unknown>) => {
    const ogeler = (v?.ogeler ?? []).filter((x) => isaret.has(anahtar(x))).map((x) => ({ ajan: x.ajan.id, k: x.konusma.id }));
    if (!ogeler.length) return;
    setTopluGidiyor(true); setTopluSonuc("");
    try { const r = await api<{ basarili: number; hatalar: string[] }>("/api/build/ajanlar/gelen", { govde: { toplu: { ogeler, ...g }, ...(ben ? { ben } : {}) } }); setTopluSonuc(`${r.basarili} konuşma güncellendi${r.hatalar.length ? `; ${r.hatalar.join(" ")}` : ""}`); setIsaret(new Set()); yukle(); }
    catch (e) { setTopluSonuc(e instanceof ApiHatasi ? e.message : "Yapılamadı."); }
    finally { setTopluGidiyor(false); }
  };
  const ayarKaydet = async (a: Ayar) => { const r = await api<{ ayar: Ayar }>("/api/build/ajanlar/gelen", { govde: { ayar: a, ...(ben ? { ben } : {}) } }); setAyar(r.ayar); yukle(); };
  /* Görünümler temsilci başına: kişisel (yalnız ben) ya da ekiple paylaşılan; son açılan görünüm bu temsilci için hatırlanır. */
  const [gorunumPaylas, setGorunumPaylas] = useState(false);
  const [gorunumHata, setGorunumHata] = useState("");
  const sonGorunumAnahtari = `vayra-gelen-gorunum:${ben || "ortak"}`;
  const gorunumSec = (g: Gorunum | null) => { setGorunum(g); if (g?.suzgec.sekme) setSekme(g.suzgec.sekme as Sekme); try { if (g) localStorage.setItem(sonGorunumAnahtari, g.id); else localStorage.removeItem(sonGorunumAnahtari); } catch { /* yok */ } };
  const gorunumGeriYuklendi = useRef("");
  useEffect(() => {
    if (!v || gorunumGeriYuklendi.current === sonGorunumAnahtari) return;
    gorunumGeriYuklendi.current = sonGorunumAnahtari;
    let id = ""; try { id = localStorage.getItem(sonGorunumAnahtari) ?? ""; } catch { /* yok */ }
    const g = v.gorunumler.find((x) => x.id === id);
    if (g) { setGorunum(g); if (g.suzgec.sekme) setSekme(g.suzgec.sekme as Sekme); }
  }, [v, sonGorunumAnahtari]);
  const gorunumKaydet = async () => {
    const ad = (gorunumAd ?? "").trim();
    if (!ad) return;
    setGorunumHata("");
    const yeni: Gorunum = { id: Math.random().toString(36).slice(2, 10), ad, suzgec: Object.fromEntries(Object.entries(suzgec).map(([a2, x]) => [a2, String(x)])) };
    try {
      const r = await api<{ gorunumler: Gorunum[] }>("/api/build/ajanlar/gelen", { govde: { gorunum: { ekle: { ...yeni, paylas: gorunumPaylas || !ben } }, ...(ben ? { ben } : {}) } });
      setAyar((a) => ({ ...a, gorunumler: r.gorunumler })); setGorunumAd(null); gorunumSec(r.gorunumler.find((x) => x.id === yeni.id) ?? yeni); yukle();
    } catch (e) { setGorunumHata(e instanceof ApiHatasi ? e.message : "Görünüm kaydedilemedi."); }
  };
  const gorunumSil = async (g: Gorunum) => {
    try { const r = await api<{ gorunumler: Gorunum[] }>("/api/build/ajanlar/gelen", { govde: { gorunum: { sil: g.id }, ...(ben ? { ben } : {}) } }); setAyar((a) => ({ ...a, gorunumler: r.gorunumler })); if (gorunum?.id === g.id) gorunumSec(null); yukle(); }
    catch (e) { setGorunumHata(e instanceof ApiHatasi ? e.message : "Silinemedi."); }
  };

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[1560px] flex-col px-3 pb-3 pt-16 sm:px-4 md:pt-4">
      <Kart ikon={Inbox} baslik="Gelen kutusu" alt="İnsana devredilen ve süren bütün ziyaretçi konuşmaları; ata, yanıtla, SLA'yı izle" className="min-h-0 flex-1" govde="flex min-h-0"
        sag={<>
          {o && o.slaAsilan > 0 && <button type="button" onClick={() => { setGorunum({ id: "sla-asildi", ad: "SLA aşılan", suzgec: { sekme: "hepsi", sla: "asildi" } }); setSekme("hepsi"); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-rose-500/[0.14] px-3 text-[12.5px] font-medium text-rose-200"><Timer className="h-3.5 w-3.5" />{o.slaAsilan} SLA aşıldı</button>}
          {o && <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] tabular-nums text-white/60 max-lg:hidden">{v!.sayilar.bekliyor} bekliyor{o.atanmamis ? ` · ${o.atanmamis} atanmamış` : ""}{o.ilkYanit !== null ? ` · ilk yanıt ortalama ${sureYaz(o.ilkYanit)}` : ""}</span>}
          {ayar.ekip.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-[170px] max-sm:w-[130px]"><AcilirSecim deger={ben} set={setBen} bos="Kim olduğunu seç" l={ayar.ekip.map((t) => ({ id: t.id, ad: t.ad, alt: `${t.rol === "yonetici" ? "Yönetici" : t.rol === "temsilci" ? "Temsilci" : "İzleyici"} · ${TDURUM[t.durum].ad}${v?.yuk[t.id] ? ` · ${v.yuk[t.id]}/${t.kapasite}` : ""}` }))} /></div>
              {benKim && <button type="button" title={`Durum: ${TDURUM[benKim.durum].ad}`} onClick={async () => { const s = benKim.durum === "cevrimici" ? "mesgul" : benKim.durum === "mesgul" ? "cevrimdisi" : "cevrimici"; const r = await api<{ ayar: Ayar }>("/api/build/ajanlar/gelen", { govde: { tdurum: s, ben } }).catch(() => null); if (r) setAyar(r.ayar); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white/80 hover:bg-white/[0.13]"><span className={cn("h-2 w-2 rounded-full", TDURUM[benKim.durum].renk)} /><span className="max-md:hidden">{TDURUM[benKim.durum].ad}</span></button>}
            </div>
          )}
          <button type="button" onClick={() => setAyarAcik(true)} className={cn(ikincil, "max-sm:px-2.5")} aria-label="Gelen kutusu ayarları"><Settings2 className="h-3.5 w-3.5" /><span className="max-xl:hidden">Ayarlar</span></button>
          <Link href="/panel/build/ajanlar/kisiler" className={cn(ikincil, "max-sm:px-2.5")} aria-label="Kişiler"><Fingerprint className="h-3.5 w-3.5" /><span className="max-xl:hidden">Kişiler</span></Link>
          <Link href="/panel/build/ajanlar" className={cn(ikincil, "max-sm:px-2.5")} aria-label="Ajanlara dön"><ArrowLeft className="h-3.5 w-3.5" /><span className="max-xl:hidden">Ajanlar</span></Link>
        </>}>
        {/* Liste */}
        <div className={cn("flex min-h-0 w-full shrink-0 flex-col border-white/[0.06] lg:w-[392px] lg:border-r", secim && "max-lg:hidden")}>
          <div className="space-y-2 border-b border-white/[0.06] p-3">
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
              <button type="button" onClick={() => gorunumSec(null)} className={cn("h-7 shrink-0 rounded-full px-2.5 text-[12px] ring-1 ring-inset", !gorunum ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.04] text-white/60 ring-white/[0.08] hover:text-white")}>Tümü</button>
              {(v?.gorunumler ?? []).map((g) => {
                const hazir = g.id === "atanmamis" || g.id === "sla-asildi" || g.id === "acil";
                const silinir = !hazir && (g.sahip ? g.sahip === ben : !benKim || benKim.rol === "yonetici");
                return (
                  <span key={g.id} className={cn("inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-full text-[12px] ring-1 ring-inset", gorunum?.id === g.id ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.04] text-white/60 ring-white/[0.08] hover:text-white")}>
                    <button type="button" onClick={() => gorunumSec(g)} title={g.sahip ? "Yalnız sen görürsün" : hazir ? undefined : "Ekiple paylaşılan görünüm"} className={cn("flex h-full items-center gap-1 px-2.5", gorunum?.id === g.id && silinir && "pr-1")}>{g.sahip ? <UserRound className="h-3 w-3 opacity-60" /> : !hazir ? <Users className="h-3 w-3 opacity-60" /> : null}{g.ad}{g.id === "atanmamis" && o?.atanmamis ? ` ${o.atanmamis}` : g.id === "sla-asildi" && o?.slaAsilan ? ` ${o.slaAsilan}` : ""}</button>
                    {gorunum?.id === g.id && silinir && <button type="button" onClick={() => gorunumSil(g)} aria-label="Görünümü sil" className="mr-1 flex h-5 w-5 items-center justify-center rounded-full text-white/50 hover:text-white"><X className="h-3 w-3" /></button>}
                  </span>
                );
              })}
              {gorunumAd === null ? <button type="button" onClick={() => setGorunumAd("")} className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2 text-[12px] text-white/50 hover:text-white"><Plus className="h-3 w-3" />Görünüm</button>
                : <form onSubmit={(e) => { e.preventDefault(); gorunumKaydet(); }} className="flex shrink-0 items-center gap-1"><input autoFocus value={gorunumAd} onChange={(e) => setGorunumAd(e.target.value)} maxLength={40} placeholder="Görünüm adı" className={cn(alanSinif, "h-7 w-[120px] px-2.5 text-[12px]")} />
                  {ben && <button type="button" aria-pressed={gorunumPaylas} onClick={() => setGorunumPaylas((x) => !x)} title={gorunumPaylas ? "Ekipteki herkes görür" : "Yalnız sen görürsün"} className={cn("inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] ring-inset", gorunumPaylas ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.04] text-white/60 ring-1 ring-white/[0.08]")}>{gorunumPaylas ? <Users className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}{gorunumPaylas ? "Ekiple" : "Yalnız ben"}</button>}
                  <button type="submit" className="h-7 rounded-full bg-white px-2.5 text-[12px] font-semibold text-black">Kaydet</button><button type="button" onClick={() => setGorunumAd(null)} aria-label="Vazgeç" className="flex h-7 w-7 items-center justify-center text-white/50"><X className="h-3 w-3" /></button></form>}
            </div>
            {gorunumHata && <p className="text-[12px] text-rose-300">{gorunumHata}</p>}
            <Suzgec id="gelen-sekme" deger={sekme} set={(s) => { setSekme(s); }} l={[{ id: "bekliyor", ad: "Bekliyor", sayi: v?.sayilar.bekliyor }, { id: "bende", ad: benKim ? "Bende" : "Temsilcide", sayi: v?.sayilar.bende }, { id: "cozuldu", ad: "Çözüldü", sayi: v?.sayilar.cozuldu }, { id: "hepsi", ad: "Hepsi", sayi: v?.sayilar.hepsi }]} />
            <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ad, e-posta ya da mesajda ara" className={cn(alanSinif, "h-9 pl-8 text-[13px]")} />{ara && <button type="button" onClick={() => setAra("")} aria-label="Aramayı temizle" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-white/45 hover:text-white"><X className="h-3 w-3" /></button>}</label>
            <div className="grid grid-cols-3 gap-1.5">
              <AcilirSecim deger={ajan} set={setAjan} bos="Ajanlar" l={(v?.ajanlar ?? []).map((a) => ({ id: a.id, ad: a.ad, gorsel: a.simge }))} />
              <AcilirSecim deger={kanal} set={setKanal} bos="Kanallar" l={[...new Set([...kanallar, ...(kanal ? [kanal as Kanal] : [])])].map((k) => ({ id: k, ad: KANAL_AD[k as Kanal] ?? k }))} />
              <AcilirSecim deger={etiket} set={setEtiket} bos="Konular" l={(v?.etiketler ?? []).map((e) => ({ id: e, ad: e }))} />
            </div>
            {isaret.size > 0 && (
              <div className="space-y-1.5 rounded-[14px] bg-white/[0.04] p-2 ring-1 ring-inset ring-white/[0.08]">
                <div className="flex items-center gap-2"><span className="flex-1 text-[12.5px] font-medium text-white">{isaret.size} konuşma seçili</span><button type="button" onClick={() => setIsaret(new Set())} className="text-[12px] text-white/50 hover:text-white">Seçimi bırak</button></div>
                <div className="grid grid-cols-2 gap-1.5">
                  {ayar.ekip.length > 0 && <AcilirSecim deger="" set={(t) => toplu({ islem: "ata", temsilci: t })} bos="Ata" l={ayar.ekip.filter((t) => t.rol !== "izleyici").map((t) => ({ id: t.id, ad: t.ad }))} />}
                  <AcilirSecim deger="" set={(x) => x && toplu({ islem: "oncelik", oncelik: x })} bos="Öncelik" l={ONCELIK.map((x) => ({ id: x.id, ad: x.ad }))} />
                  <AcilirSecim deger="" set={(x) => x && toplu({ islem: "etiket-ekle", etiket: x })} bos="Konu ekle" l={(v?.etiketler ?? []).map((e) => ({ id: e, ad: e }))} />
                  <button type="button" disabled={toplugidiyor} onClick={() => toplu({ islem: "durum", durum: "cozuldu" })} className={cn(ikincil, "h-10")}>{toplugidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}Çözüldü</button>
                </div>
              </div>
            )}
            {topluSonuc && <p className="text-[12px] text-[#8be6ff]">{topluSonuc}</p>}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
            {!v ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : v.ogeler.length ? (
              <div className="divide-y divide-white/[0.04]">{v.ogeler.map((x) => <ListeSatiri key={anahtar(x)} o={x} secili={secim?.id === x.konusma.id && secim.ajanId === x.ajan.id} ac={() => { setSecim({ ajanId: x.ajan.id, id: x.konusma.id }); setAyrinti(null); }} isaretli={isaret.has(anahtar(x))} isaretle={() => setIsaret((s) => { const y2 = new Set(s); if (y2.has(anahtar(x))) y2.delete(anahtar(x)); else y2.add(anahtar(x)); return y2; })} />)}</div>
            ) : (
              <BosDurum ikon={sekme === "bekliyor" ? CheckCircle2 : Inbox} baslik={sekme === "bekliyor" ? "Bekleyen konuşma yok" : "Bu süzgeçte konuşma yok"} alt={sekme === "bekliyor" ? "Bir ajan konuşmayı insana devredince ya da bir prosedür onay isteyince burada sıraya girer; SLA'sı en yakın olan en üstte." : "Başka bir sekme, görünüm ya da süzgeç seç."}>
                {sekme === "bekliyor" && <button type="button" onClick={() => setSekme("hepsi")} className={ikincil}>Bütün konuşmalar</button>}
                {gorunum && <button type="button" onClick={() => setGorunum(null)} className={ikincil}>Görünümü kaldır</button>}
              </BosDurum>
            )}
          </div>
        </div>
        {/* Konuşma */}
        <div className={cn("flex min-h-0 min-w-0 flex-1", !secim && "max-lg:hidden")}>
          {secim ? <KonusmaAlani key={`${secim.ajanId}:${secim.id}`} secim={secim} ayar={ayar} ben={ben} geri={() => setSecim(null)} yenile={yukle} ayrintiAc={() => setAyrintiAcik(true)} /> : (
            <div className="flex flex-1 items-center justify-center p-6"><BosDurum ikon={MessageSquareQuote} baslik="Bir konuşma seç" alt="Soldan bir konuşma seç; dökümü, iç notları, kişinin diğer kanallardaki geçmişini ve SLA'yı burada görürsün. Yazdığın yanıt ziyaretçinin kanalına gider." /></div>
          )}
        </div>
        {/* Ayrıntılar */}
        {secim && ayrinti && (
          <aside className="hidden min-h-0 w-[320px] shrink-0 overflow-y-auto border-l border-white/[0.06] p-3 [scrollbar-width:thin] xl:block">
            <Ayrintilar k={ayrinti.konusma} ajan={ayrinti.ajan} kisi={ayrinti.kisi} islem={ayrintiIslem} gidiyor={ayrintiGidiyor} />
          </aside>
        )}
      </Kart>
      <YanPanel acik={ayrintiAcik && !!ayrinti} kapat={() => setAyrintiAcik(false)} baslik="Ayrıntılar" alt={ayrinti ? kisiAdi(ayrinti.konusma, ayrinti.konusma.id) : undefined}>
        {ayrinti && <Ayrintilar k={ayrinti.konusma} ajan={ayrinti.ajan} kisi={ayrinti.kisi} islem={ayrintiIslem} gidiyor={ayrintiGidiyor} />}
      </YanPanel>
      <AyarPaneli acik={ayarAcik} kapat={() => setAyarAcik(false)} ayar={ayar} kaydet={ayarKaydet} ajanlar={v?.ajanlar ?? []} />
    </div>
  );
}
