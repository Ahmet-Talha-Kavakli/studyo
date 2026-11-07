"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlarmClock, Braces, CalendarClock, ChevronDown, Clock, Code2, Hourglass, Loader2, Pencil, Play, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim, Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { dilimEtiketi, saatDilimleri } from "@/lib/build/bolge";
import { Alan, YanPanel, ajanaTasi, sureYaz } from "./ortak";

type Durum = "basarili" | "hata" | "atlandi";
type Is = { id: string; ad: string; fonksiyon: string; zamanlama: string; ifade?: string; saatDilimi: string; acik: boolean; kaynak: "panel" | "kod"; govde?: string; sonraki?: number; sonCalisma?: number; sonDurum?: Durum; sonSure?: number; aciklama: string; sonrakiler: number[] };
type Calisma = { id: string; isId: string; ad: string; fonksiyon: string; tetik: "zaman" | "elle" | "gecikmeli"; z: number; sure: number; durum: Durum; kod?: number; mesaj?: string; log?: string[]; deneme?: number };
type Gecikmeli = { id: string; fonksiyon: string; veri?: unknown; zaman: number; olusturma: number; deneme: number; durum: "bekliyor" | "basarili" | "hata" | "iptal"; sonHata?: string; bitis?: number };
type Veri = { yayinda: boolean; fonksiyonlar: { ad: string; yayinda: boolean; taslakta: boolean }[]; kodUyarilari: string[]; isler: Is[]; calismalar: Calisma[]; gecikmeli: Gecikmeli[] };
type Form = { id?: string; ad: string; fonksiyon: string; zamanlama: string; saatDilimi: string; govde: string; acik: boolean; kaynak?: "panel" | "kod" };

const HAZIR = [
  { id: "her 5 dakikada bir", ad: "Her 5 dakika" }, { id: "saatte bir", ad: "Saatte bir" }, { id: "her gün 09:00", ad: "Her gün 09:00" },
  { id: "hafta içi 08:30", ad: "Hafta içi 08:30" }, { id: "her pazartesi 10:00", ad: "Pazartesi 10:00" }, { id: "her ayın 1'i 09:00", ad: "Ayın 1'i 09:00" }, { id: "gece yarısı", ad: "Gece yarısı" },
];
const ORNEK_ISTEM = [
  { ad: "Her sabah özet e-postası", istem: "api/gunluk-ozet.js sunucu fonksiyonu yaz: dünün siparişlerini ve yeni üyelerini sayıp RESEND_API_KEY sırrıyla bana özet e-postası göndersin. Dosyaya export const zamanlama = \"her gün 08:00\" ekle ki her sabah kendiliğinden çalışsın." },
  { ad: "Gece temizliği", istem: "api/temizlik.js yaz: 30 günden eski, durumu iptal olan rezervasyonları veritabanından silsin ve kaç kayıt silindiğini console.log ile yazsın. export const zamanlama = \"her gün 03:00\" ekle." },
  { ad: "Saatlik kur güncelleme", istem: "api/kur.js yaz: herkese açık bir döviz kuru servisinden USD ve EUR kurunu alıp \"kurlar\" tablosuna yazsın; sitede fiyatlar bu tablodan TL'ye çevrilsin. export const zamanlama = \"saatte bir\" ekle." },
];
const DURUM: Record<Durum, { ad: string; nokta: string; sinif: string }> = {
  basarili: { ad: "Başarılı", nokta: "bg-emerald-400", sinif: "bg-emerald-400/[0.1] text-emerald-200" },
  hata: { ad: "Hata", nokta: "bg-rose-400", sinif: "bg-rose-500/[0.12] text-rose-200" },
  atlandi: { ad: "Atlandı", nokta: "bg-amber-300", sinif: "bg-amber-400/[0.1] text-amber-200" },
};
const TETIK = { zaman: "Zamanında", elle: "Elle", gecikmeli: "Gecikmeli" };

/** Gelecekteki zamanı okunur yazar: "3 dk sonra", "2 sa sonra", "yarın 09:00", "8 Kasım 10:00". */
export function ileride(z?: number) {
  if (!z) return "";
  const s = (z - Date.now()) / 1000;
  if (s < 60) return "1 dakikadan az";
  if (s < 3600) return `${Math.round(s / 60)} dk sonra`;
  if (s < 6 * 3600) return `${Math.floor(s / 3600)} sa ${Math.round((s % 3600) / 60)} dk sonra`;
  const d = new Date(z), b = new Date(); const yarin = new Date(b.getFullYear(), b.getMonth(), b.getDate() + 1);
  const saat = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === b.toDateString()) return `bugün ${saat}`;
  if (d.toDateString() === yarin.toDateString()) return `yarın ${saat}`;
  return `${d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} ${saat}`;
}
const tarih = (z: number) => new Date(z).toLocaleString("tr-TR", { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

function DurumHap({ d }: { d?: Durum }) {
  if (!d) return <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-white/50">Henüz çalışmadı</span>;
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium", DURUM[d].sinif)}><span className={cn("h-1.5 w-1.5 rounded-full", DURUM[d].nokta)} />{DURUM[d].ad}</span>;
}

/** Çalışma satırı: durum, zaman, süre, mesaj; tıklayınca console satırları açılır. */
function CalismaSatiri({ c, adGoster }: { c: Calisma; adGoster?: boolean }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="px-4 py-2.5 sm:px-5">
      <button type="button" onClick={() => setAcik((x) => !x)} className="flex w-full items-center gap-3 text-left">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", DURUM[c.durum].nokta)} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] text-white">{adGoster ? c.ad : DURUM[c.durum].ad}<span className="ml-2 text-[12px] text-white/40">{TETIK[c.tetik]}{c.deneme && c.deneme > 1 ? `, ${c.deneme}. deneme` : ""}{c.kod ? `, durum ${c.kod}` : ""}</span></span>
          {c.mesaj && <span className={cn("block truncate text-[12px]", c.durum === "hata" ? "text-rose-200/80" : "text-white/50")}>{c.mesaj}</span>}
        </span>
        <span className="shrink-0 text-right text-[12px] tabular-nums text-white/45"><span className="block">{gorece(c.z)}</span><span className="block text-white/35">{sureYaz(c.sure)}</span></span>
        {!!c.log?.length && <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white/40 transition-transform", acik && "rotate-180")} />}
      </button>
      <AnimatePresence initial={false}>
        {acik && !!c.log?.length && (
          <motion.pre initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 max-h-[220px] overflow-auto rounded-[12px] bg-[#0c0d0f] p-3 font-mono text-[11.5px] leading-relaxed text-white/75 ring-1 ring-inset ring-white/[0.06] [scrollbar-width:thin]">{c.log.join("\n")}</motion.pre>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Görev formu (sağ panel): ad, fonksiyon, zamanlama (hazır seçenekler + Özel: Türkçe ya da cron), saat dilimi, gövde. */
function GorevFormu({ p, acik, form, fonksiyonlar, kapat, kaydedildi }: { p: Proje; acik: boolean; form: Form | null; fonksiyonlar: Veri["fonksiyonlar"]; kapat: () => void; kaydedildi: () => void }) {
  const [f, setF] = useState<Form | null>(form);
  const [ozel, setOzel] = useState(false);
  const [cevir, setCevir] = useState<{ cron?: string; aciklama?: string; sonrakiler?: number[]; hata?: string } | null>(null);
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [govdeAcik, setGovdeAcik] = useState(false);
  useEffect(() => { setF(form); setHata(""); setOzel(!!form && !HAZIR.some((h) => h.id === form.zamanlama)); setGovdeAcik(!!form?.govde); }, [form]);
  const zamanlama = f?.zamanlama ?? "";
  useEffect(() => {
    if (!acik || !zamanlama.trim()) { setCevir(null); return; }
    const t = setTimeout(() => {
      api<{ ok: boolean; cron?: string; aciklama?: string; sonrakiler?: number[]; hata?: string }>(`/api/build/bulut/${p.id}/zamanli`, { govde: { islem: "cevir", metin: zamanlama, saatDilimi: f?.saatDilimi } })
        .then((x) => setCevir(x.ok ? x : { hata: x.hata })).catch(() => setCevir(null));
    }, 250);
    return () => clearTimeout(t);
  }, [zamanlama, f?.saatDilimi, acik, p.id]);
  if (!f) return <YanPanel acik={false} kapat={kapat} baslik=""><span /></YanPanel>;
  const kod = f.kaynak === "kod";
  const kaydet = async () => {
    setGidiyor(true); setHata("");
    try {
      const govde = { ad: f.ad, fonksiyon: f.fonksiyon, zamanlama: f.zamanlama, saatDilimi: f.saatDilimi, govde: govdeAcik && f.govde.trim() ? f.govde : "", acik: f.acik };
      await api(`/api/build/bulut/${p.id}/zamanli`, { govde: f.id ? { islem: "guncelle", id: f.id, ...(kod ? { acik: f.acik } : govde) } : { islem: "ekle", ...govde } });
      kaydedildi();
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); }
    finally { setGidiyor(false); }
  };
  return (
    <YanPanel acik={acik} kapat={kapat} baslik={f.id ? "Görevi düzenle" : "Zamanlanmış görev"} alt="Fonksiyon seçtiğin saatlerde yayındaki kodla, Canlı veriyle çalışır"
      alt2={<><button type="button" disabled={gidiyor || !f.fonksiyon || !!cevir?.hata} onClick={kaydet} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-40">{gidiyor && <Loader2 className="h-4 w-4 animate-spin" />}{f.id ? "Kaydet" : "Görevi oluştur"}</button>{hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}</>}>
      <div className="space-y-5">
        {kod && <p className="rounded-[14px] bg-[#55d6fd]/[0.07] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#bdefff] ring-1 ring-inset ring-[#55d6fd]/15">Bu görev api/{f.fonksiyon}.js içindeki <code className="font-mono">export const zamanlama</code> satırından geliyor. Zamanlamayı kodda değiştir; burada yalnız açıp kapatabilirsin.</p>}
        <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Ad</span><input value={f.ad} disabled={kod} onChange={(e) => setF({ ...f, ad: e.target.value })} placeholder="Günlük rapor" className={cn(alanSinif, "h-10 disabled:opacity-50")} /></label>
        <div><span className="mb-1.5 block text-[12.5px] text-white/55">Fonksiyon</span>
          {fonksiyonlar.length ? <div className={cn(kod && "pointer-events-none opacity-50")}><AcilirSecim deger={f.fonksiyon} set={(v) => setF({ ...f, fonksiyon: v, ad: f.ad || v })} bos="Fonksiyon seç" l={fonksiyonlar.map((x) => ({ id: x.ad, ad: `/api/${x.ad}`, alt: x.yayinda ? "Yayında" : "Yalnız taslakta; yayınlayınca çalışır" }))} /></div>
            : <p className="rounded-[14px] bg-white/[0.04] px-3.5 py-3 text-[12.5px] text-white/55">Projede henüz api/ fonksiyonu yok. Önce bir fonksiyon yazdır.</p>}
        </div>
        <div className={cn(kod && "pointer-events-none opacity-50")}>
          <span className="mb-1.5 block text-[12.5px] text-white/55">Ne zaman</span>
          <div className="flex flex-wrap gap-1.5">
            {HAZIR.map((h) => <button key={h.id} type="button" onClick={() => { setOzel(false); setF({ ...f, zamanlama: h.id }); }} className={cn("inline-flex h-8 items-center rounded-full px-3 text-[12.5px] transition-colors", !ozel && f.zamanlama === h.id ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/70 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.08] hover:text-white")}>{h.ad}</button>)}
            <button type="button" onClick={() => { setOzel(true); if (HAZIR.some((h) => h.id === f.zamanlama)) setF({ ...f, zamanlama: "" }); }} className={cn("inline-flex h-8 items-center gap-1 rounded-full px-3 text-[12.5px] transition-colors", ozel ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/70 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.08] hover:text-white")}><Pencil className="h-3 w-3" />Özel</button>
          </div>
          {ozel && <input autoFocus value={f.zamanlama} onChange={(e) => setF({ ...f, zamanlama: e.target.value })} placeholder="her perşembe 18:30 ya da 0 18 * * 4" className={cn(alanSinif, "mt-2 h-10")} />}
          <div className="mt-2 min-h-[44px] rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]">
            {!f.zamanlama.trim() ? <p className="text-[12.5px] text-white/45">Türkçe yaz: &quot;her gün 09:00&quot;, &quot;hafta içi 08:30&quot;, &quot;her 15 dakikada bir&quot;, &quot;her ayın 1&apos;i 10:00&quot;. Cron da olur.</p>
              : cevir?.hata ? <p className="text-[12.5px] text-rose-200">{cevir.hata} Örnek: &quot;her salı 14:00&quot;.</p>
              : cevir?.aciklama ? <><p className="text-[13px] font-medium text-white">{cevir.aciklama}<span className="ml-2 font-mono text-[11.5px] font-normal text-white/40">{cevir.cron}</span></p>{!!cevir.sonrakiler?.length && <p className="mt-0.5 text-[12px] text-white/50">Sonraki: {cevir.sonrakiler.map((z) => tarih(z)).join(", ")}</p>}</>
              : <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          </div>
        </div>
        <div className={cn("flex flex-wrap items-center gap-3", kod && "pointer-events-none opacity-50")}><span className="text-[12.5px] text-white/55">Saat dilimi</span><select value={f.saatDilimi} onChange={(e) => setF({ ...f, saatDilimi: e.target.value })} className={cn(alanSinif, "h-9 w-auto min-w-[200px] text-[13px]")}>{[...new Set([f.saatDilimi, ...saatDilimleri()])].map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")} ({dilimEtiketi(z)})</option>)}</select></div>
        {!kod && (
          <div>
            <button type="button" onClick={() => setGovdeAcik((x) => !x)} className="inline-flex items-center gap-1.5 text-[12.5px] text-white/60 hover:text-white"><ChevronDown className={cn("h-3.5 w-3.5 transition-transform", govdeAcik && "rotate-180")} />İstek gövdesi (isteğe bağlı JSON)</button>
            {govdeAcik && <textarea value={f.govde} onChange={(e) => setF({ ...f, govde: e.target.value })} rows={5} spellCheck={false} placeholder={'{ "rapor": "gunluk" }'} className={cn(alanSinif, "mt-2 resize-y py-2.5 font-mono text-[12.5px]")} />}
            <p className="mt-1.5 text-[12px] text-white/40">Fonksiyon istek.govde ile okur; boşsa {"{ zamanlama: \"ad\" }"} gelir. istek.basliklar[&quot;x-vayra-tetik&quot;] &quot;zamanlama&quot; olur.</p>
          </div>
        )}
        <div className="flex items-center justify-between rounded-[14px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.06]"><span><span className="block text-[13px] text-white">Etkin</span><span className="block text-[12px] text-white/45">Kapalıyken çalışmaz; ayarları korunur</span></span><Anahtar acik={f.acik} set={(v) => setF({ ...f, acik: v })} etiket="Görev etkin" /></div>
      </div>
    </YanPanel>
  );
}

/** Bulut > Zamanlanmış: cron görevleri, çalışma geçmişi, gecikmeli işler. */
export function Zamanlanmis({ p, ajana: ajanaVerilen }: { p: Proje; ajana?: (m: string) => void }) {
  const router = useRouter();
  const ajana = ajanaVerilen ?? ((m: string) => ajanaTasi(p.id, m, (y) => router.push(y)));
  const [v, setV] = useState<Veri | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [formAcik, setFormAcik] = useState(false);
  const [ayrinti, setAyrinti] = useState<string | null>(null);
  const [gecmis, setGecmis] = useState<Calisma[] | null>(null);
  const [calisiyor, setCalisiyor] = useState<string | null>(null);
  const [silOnay, setSilOnay] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [, setSaat] = useState(0);
  const kok = `/api/build/bulut/${p.id}/zamanli`;
  const getir = useCallback(() => api<Veri>(kok).then(setV).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Yüklenemedi.")), [kok]);
  useEffect(() => { getir(); const t = setInterval(getir, 20_000); const s = setInterval(() => setSaat((x) => x + 1), 30_000); return () => { clearInterval(t); clearInterval(s); }; }, [getir]);
  const secili = v?.isler.find((x) => x.id === ayrinti) ?? null;
  const isGecmisi = useRef<string | null>(null);
  useEffect(() => { if (!ayrinti) { setGecmis(null); return; } isGecmisi.current = ayrinti; api<Veri>(`${kok}?is=${encodeURIComponent(ayrinti)}`).then((x) => { if (isGecmisi.current === ayrinti) setGecmis(x.calismalar); }).catch(() => setGecmis([])); }, [ayrinti, kok, v?.calismalar.length]);
  const islem = async (govde: Record<string, unknown>) => { setHata(""); try { return await api<{ calisma?: Calisma }>(kok, { govde }); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yapılamadı."); return null; } finally { getir(); } };
  const calistir = async (id: string) => { setCalisiyor(id); await islem({ islem: "calistir", id }); setCalisiyor(null); };
  const yeni = () => { setForm({ ad: "", fonksiyon: v?.fonksiyonlar.find((x) => x.yayinda)?.ad ?? v?.fonksiyonlar[0]?.ad ?? "", zamanlama: "her gün 09:00", saatDilimi: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } })(), govde: "", acik: true }); setFormAcik(true); };
  const duzenle = (x: Is) => { setForm({ id: x.id, ad: x.ad, fonksiyon: x.fonksiyon, zamanlama: x.ifade ?? x.zamanlama, saatDilimi: x.saatDilimi, govde: x.govde ?? "", acik: x.acik, kaynak: x.kaynak }); setFormAcik(true); };
  const bekleyen = useMemo(() => v?.gecikmeli.filter((g) => g.durum === "bekliyor") ?? [], [v]);

  if (!v) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>;
  return (
    <div className="space-y-4">
      <Kart ikon={CalendarClock} baslik="Zamanlanmış görevler" alt="Sunucu fonksiyonları belirlediğin saatlerde kendiliğinden çalışır; önceki çalışma sürüyorsa yenisi atlanır"
        sag={v.fonksiyonlar.length ? <button type="button" onClick={yeni} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black"><Plus className="h-3.5 w-3.5" /><span className="max-sm:hidden">Görev ekle</span></button> : undefined}>
        {!v.yayinda && v.isler.length > 0 && <p className="border-b border-amber-300/10 bg-amber-400/[0.05] px-4 py-2 text-[12.5px] text-amber-100/85 sm:px-5">Proje yayında değil: görevler yayındaki kodu çalıştırır, şu an çalışmaz.</p>}
        {v.kodUyarilari.map((u) => <p key={u} className="border-b border-amber-300/10 bg-amber-400/[0.05] px-4 py-2 text-[12.5px] text-amber-100/85 sm:px-5">{u}</p>)}
        {!v.isler.length ? (
          <div className="space-y-3 p-4 sm:p-5">
            <p className="text-[13.5px] leading-relaxed text-white/65">Günlük rapor göndermek, eski kayıtları temizlemek ya da dış bir servisten saatlik veri çekmek için fonksiyonu zamanla. {v.fonksiyonlar.length ? "Görev ekle'ye bas ya da ajana yazdır:" : "Önce ajana bir fonksiyon yazdır; kodda zamanlama satırı varsa görev kendiliğinden oluşur:"}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {ORNEK_ISTEM.map((o) => <button key={o.ad} type="button" onClick={() => ajana(o.istem)} className="flex items-start gap-2.5 rounded-[16px] bg-white/[0.03] p-3 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.06]"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#8be6ff]" /><span className="text-[13px] text-white/80">{o.ad}</span></button>)}
            </div>
          </div>
        ) : (
          <motion.div layout className="divide-y divide-white/[0.05]">
            <AnimatePresence initial={false}>
              {v.isler.map((x) => (
                <motion.div key={x.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                  <button type="button" onClick={() => setAyrinti(x.id)} className="flex min-w-[200px] flex-1 items-center gap-3 text-left">
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ring-1 ring-inset", x.acik ? "bg-[#55d6fd]/[0.1] text-[#8be6ff] ring-[#55d6fd]/20" : "bg-white/[0.05] text-white/40 ring-white/[0.07]")}><AlarmClock className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2"><span className="truncate text-[14px] font-semibold text-white">{x.ad}</span>{x.kaynak === "kod" && <span className="shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] text-white/60">Koddan</span>}</span>
                      <span className="block truncate text-[12.5px] text-white/50">{x.aciklama}<span className="text-white/35"> · /api/{x.fonksiyon}</span></span>
                    </span>
                  </button>
                  <span className="flex shrink-0 flex-col items-end gap-1 max-sm:hidden">
                    <span className="text-[12px] text-white/55">{x.acik ? (x.sonraki ? `Sonraki: ${ileride(x.sonraki)}` : "Zamanı hesaplanıyor") : "Kapalı"}</span>
                    <span className="flex items-center gap-1.5"><DurumHap d={x.sonDurum} />{x.sonCalisma && <span className="text-[11.5px] text-white/40">{gorece(x.sonCalisma)}</span>}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <button type="button" title="Şimdi çalıştır" aria-label="Şimdi çalıştır" disabled={calisiyor === x.id} onClick={() => calistir(x.id)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white">{calisiyor === x.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}</button>
                    <button type="button" title="Düzenle" aria-label="Düzenle" onClick={() => duzenle(x)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                    <Anahtar acik={x.acik} set={(a) => islem({ islem: "guncelle", id: x.id, acik: a })} etiket={`${x.ad} etkin`} />
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        {hata && <p className="border-t border-white/[0.06] px-5 py-2.5 text-[12.5px] text-rose-300">{hata}</p>}
      </Kart>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Kart ikon={Clock} baslik="Son çalışmalar" alt="Bütün görevler ve gecikmeli işler, son 7 gün">
          {v.calismalar.length ? <div className="max-h-[420px] divide-y divide-white/[0.04] overflow-y-auto [scrollbar-width:thin]">{v.calismalar.slice(0, 40).map((c) => <CalismaSatiri key={c.id} c={c} adGoster />)}</div>
            : <p className="px-5 py-4 text-[13px] text-white/50">Henüz çalışma yok. Görevler zamanı gelince ya da Şimdi çalıştır ile çalışır.</p>}
        </Kart>
        <Kart ikon={Hourglass} baslik="Gecikmeli işler" alt={bekleyen.length ? `${bekleyen.length} iş bekliyor` : "Fonksiyon içinden vayra.sonra ile kurulur"}>
          {v.gecikmeli.length ? (
            <div className="max-h-[420px] divide-y divide-white/[0.04] overflow-y-auto [scrollbar-width:thin]">
              {v.gecikmeli.slice(0, 40).map((g) => (
                <div key={g.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", g.durum === "bekliyor" ? "bg-[#55d6fd]" : g.durum === "basarili" ? "bg-emerald-400" : g.durum === "hata" ? "bg-rose-400" : "bg-white/30")} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">/api/{g.fonksiyon}</span><span className="block truncate text-[12px] text-white/45">{g.durum === "bekliyor" ? `${ileride(g.zaman)}${g.deneme ? `, ${g.deneme + 1}. deneme` : ""}` : g.durum === "basarili" ? `Bitti, ${gorece(g.bitis ?? g.olusturma)}` : g.durum === "iptal" ? "İptal edildi" : `Başarısız: ${g.sonHata ?? ""}`}</span></span>
                  {g.durum === "bekliyor" && <button type="button" onClick={() => islem({ islem: "iptal", id: g.id })} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-[12px] text-white/70 hover:bg-rose-500/[0.12] hover:text-rose-200"><X className="h-3 w-3" />İptal</button>}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 sm:p-5">
              <pre className="overflow-x-auto rounded-[14px] bg-[#0c0d0f] p-3.5 font-mono text-[12px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{`// api/siparis.js içinde: 24 saat sonra hatırlatma
await vayra.sonra(24 * 3600, "hatirlat", { siparis: kayit.id });`}</pre>
              <p className="mt-2 text-[12px] leading-relaxed text-white/45">İş zamanı gelince api/hatirlat.js çalışır, veri istek.govde ile gelir. Hata olursa 1 ve 2 dakika sonra yeniden denenir.</p>
            </div>
          )}
        </Kart>
      </div>

      <Kart ikon={Code2} baslik="Koddan zamanla" alt="Build ajanı zamanlamayı fonksiyon dosyasına kendisi yazar" govde="p-4 sm:p-5">
        <pre className="overflow-x-auto rounded-[14px] bg-[#0c0d0f] p-3.5 font-mono text-[12px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{`// api/rapor.js
export const zamanlama = "her gün 08:00";   // ya da "0 8 * * 1-5"

export default async function (istek, vayra) {
  const siparisler = await vayra.veri.liste("siparisler", { sinir: 500 });
  console.log(siparisler.length + " sipariş");
  return { durum: 200, govde: { tamam: true } };
}`}</pre>
      </Kart>

      <GorevFormu p={p} acik={formAcik} form={form} fonksiyonlar={v.fonksiyonlar} kapat={() => setFormAcik(false)} kaydedildi={() => { setFormAcik(false); getir(); }} />
      <YanPanel acik={!!secili} kapat={() => { setAyrinti(null); setSilOnay(null); }} genis baslik={secili?.ad ?? ""} alt={secili ? `${secili.aciklama} · /api/${secili.fonksiyon}` : ""}
        alt2={secili ? <>
          <button type="button" disabled={calisiyor === secili.id} onClick={() => calistir(secili.id)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black">{calisiyor === secili.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}Şimdi çalıştır</button>
          <button type="button" onClick={() => { duzenle(secili); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13]"><Pencil className="h-3.5 w-3.5" />Düzenle</button>
          {secili.kaynak === "panel" && (silOnay === secili.id
            ? <button type="button" onClick={async () => { await islem({ islem: "sil", id: secili.id }); setAyrinti(null); setSilOnay(null); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-rose-500/20 px-4 text-[13px] font-medium text-rose-100">Evet, sil</button>
            : <button type="button" onClick={() => setSilOnay(secili.id)} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/55 hover:bg-rose-500/[0.1] hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" />Sil</button>)}
        </> : undefined}>
        {secili && (
          <div className="space-y-5">
            <dl className="divide-y divide-white/[0.05] rounded-[16px] bg-white/[0.03] px-4 ring-1 ring-inset ring-white/[0.06]">
              <Alan ad="Durum">{secili.acik ? "Etkin" : "Kapalı"}{secili.kaynak === "kod" ? ", koddan tanımlı" : ""}</Alan>
              <Alan ad="Fonksiyon"><span className="inline-flex items-center gap-1.5"><Braces className="h-3.5 w-3.5 text-white/40" />/api/{secili.fonksiyon}</span></Alan>
              <Alan ad="Zamanlama">{secili.aciklama}{secili.ifade ? <span className="text-white/45"> (&quot;{secili.ifade}&quot;)</span> : null}</Alan>
              <Alan ad="Cron" mono>{secili.zamanlama}</Alan>
              <Alan ad="Saat dilimi">{secili.saatDilimi.replace(/_/g, " ")} ({dilimEtiketi(secili.saatDilimi)})</Alan>
              <Alan ad="Sonraki">{secili.sonrakiler.length ? secili.sonrakiler.map((z) => tarih(z)).join(", ") : "Kapalı"}</Alan>
              <Alan ad="Son çalışma">{secili.sonCalisma ? <span className="flex items-center gap-2"><DurumHap d={secili.sonDurum} />{gorece(secili.sonCalisma)}, {sureYaz(secili.sonSure)}</span> : "Henüz çalışmadı"}</Alan>
            </dl>
            <section>
              <h4 className="mb-2 text-[13px] font-semibold text-white">Çalışma geçmişi</h4>
              <div className="-mx-5 divide-y divide-white/[0.04]">
                {gecmis === null ? <div className="flex h-24 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div>
                  : gecmis.length ? gecmis.map((c) => <CalismaSatiri key={c.id} c={c} />)
                  : <p className="px-5 py-3 text-[13px] text-white/50">Bu görev henüz çalışmadı.</p>}
              </div>
            </section>
            {secili.sonDurum === "hata" && <button type="button" onClick={() => ajana(`Zamanlanmış görev "${secili.ad}" (/api/${secili.fonksiyon}) hata veriyor: ${v.calismalar.find((c) => c.isId === secili.id && c.durum === "hata")?.mesaj ?? ""}. api/${secili.fonksiyon}.js dosyasını incele ve düzelt.`)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13]"><Sparkles className="h-3.5 w-3.5 text-[#8be6ff]" />Ajana düzelt</button>}
          </div>
        )}
      </YanPanel>
    </div>
  );
}
