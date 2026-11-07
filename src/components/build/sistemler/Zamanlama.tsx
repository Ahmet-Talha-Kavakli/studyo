"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Plus, X } from "lucide-react";
import { AcilirSecim, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { GUNLER, cronCoz, sonrakiZamanlar, zamanDilimi, zamanMetni, zamanSaatleri, type Zamanlama } from "@/lib/build/sistemKatalog";
import { dilimEtiketi, saatDilimleri } from "@/lib/build/bolge";
import { cn } from "@/lib/utils";
import { Alan } from "./AdimAyari";
import { Segment } from "./ortak";

const iki = (n: number) => String(n).padStart(2, "0");
const saatYaz = (d: number) => `${iki(Math.floor(d / 60))}:${iki(d % 60)}`;
const CRON_ORNEK = [
  { c: "0 9 * * 1-5", ad: "Hafta içi her gün 09:00" }, { c: "*/15 8-18 * * 1-5", ad: "Mesai saatlerinde 15 dakikada bir" },
  { c: "30 8 1,15 * *", ad: "Ayın 1'i ve 15'i 08:30" }, { c: "0 17 * * 5", ad: "Her cuma 17:00" }, { c: "0 10 1 1,4,7,10 *", ad: "Her çeyreğin ilk günü 10:00" },
];
const TOLERANS = [{ id: "0", ad: "Çalıştırma", alt: "Sunucu kapalıyken geçen zaman atlanır" }, { id: "15", ad: "15 dakika içinde yetişirse çalıştır" }, { id: "60", ad: "1 saat içinde yetişirse çalıştır" }, { id: "360", ad: "6 saat içinde yetişirse çalıştır" }, { id: "1440", ad: "1 gün içinde yetişirse çalıştır" }];

/** Hazır seçenek ya da Özel sayı (dakika, saat aralığı). */
function SayiSecim({ deger, set, l, birim, en, boy }: { deger: number; set: (v: number) => void; l: number[]; birim: string; en: number; boy: number }) {
  const [ozel, setOzel] = useState(!l.includes(deger));
  return (
    <div className="flex gap-2">
      <div className="min-w-0 flex-1"><AcilirSecim deger={ozel ? "ozel" : String(deger)} set={(v) => { if (v === "ozel") { setOzel(true); return; } setOzel(false); set(Number(v)); }} l={[...l.map((x) => ({ id: String(x), ad: `${x} ${birim}` })), { id: "ozel", ad: "Özel", alt: `${en} ile ${boy} arası` }]} /></div>
      {ozel && <input type="number" min={en} max={boy} value={deger} onChange={(e) => set(Math.max(en, Math.min(boy, Number(e.target.value) || en)))} className={cn(alanSinif, "h-10 w-24")} />}
    </div>
  );
}

/** Günde birden çok saat: çipler + ekleme. */
function Saatler({ z, set }: { z: Zamanlama; set: (p: Partial<Zamanlama>) => void }) {
  const l = zamanSaatleri(z);
  const [yeni, setYeni] = useState("12:00");
  const yaz = (x: number[]) => { const s = [...new Set(x)].sort((a, b) => a - b).map(saatYaz); set({ saatler: s, saat: s[0] ?? "09:00" }); };
  const ekle = (v: string) => { const m = /^(\d{2}):(\d{2})$/.exec(v); if (m && l.length < 24) yaz([...l, Number(m[1]) * 60 + Number(m[2])]); };
  return (
    <Alan etiket={`Saatler (${zamanDilimi(z).replace(/_/g, " ")})`} ipucu="Günde en çok 24 saat. Her saat ayrı bir çalışma başlatır.">
      <div className="flex flex-wrap items-center gap-1.5">
        <AnimatePresence initial={false}>
          {l.map((d) => (
            <motion.span key={d} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex h-8 items-center gap-1 rounded-full bg-white/[0.07] pl-3 pr-1 text-[13px] tabular-nums text-white ring-1 ring-inset ring-white/[0.08]">
              {saatYaz(d)}
              <button type="button" disabled={l.length <= 1} onClick={() => yaz(l.filter((x) => x !== d))} aria-label={`${saatYaz(d)} saatini kaldır`} className="flex h-6 w-6 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.08] hover:text-white disabled:opacity-25"><X className="h-3 w-3" /></button>
            </motion.span>
          ))}
        </AnimatePresence>
        <span className="flex h-8 items-center gap-1 rounded-full bg-white/[0.04] pl-2 pr-1 ring-1 ring-inset ring-white/[0.08]">
          <input type="time" value={yeni} onChange={(e) => setYeni(e.target.value)} aria-label="Eklenecek saat" className="h-7 w-[84px] bg-transparent text-[13px] text-white outline-none [color-scheme:dark]" />
          <button type="button" onClick={() => ekle(yeni)} aria-label="Saati ekle" className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black"><Plus className="h-3.5 w-3.5" /></button>
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[["09:00"], ["09:00", "18:00"], ["08:00", "12:00", "16:00", "20:00"]].map((h) => <button key={h.join()} type="button" onClick={() => yaz(h.map((x) => Number(x.slice(0, 2)) * 60 + Number(x.slice(3))))} className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11.5px] text-white/60 ring-1 ring-inset ring-white/[0.07] hover:text-white">{h.length === 1 ? "Yalnız sabah" : h.length === 2 ? "Sabah ve akşam" : "Dört saatte bir"}</button>)}
      </div>
    </Alan>
  );
}

/** Zamanlı tetiğin tüm ayarları ve sonraki 5 çalışmanın önizlemesi. */
export function ZamanlamaAyari({ z, set }: { z: Zamanlama; set: (p: Partial<Zamanlama>) => void }) {
  const tol = String(z.tolerans ?? 0);
  const [tolOzel, setTolOzel] = useState(!TOLERANS.some((x) => x.id === tol));
  const sonraki = useMemo(() => sonrakiZamanlar(z, 5), [z]);
  const cron = z.siklik === "ozel" ? cronCoz(z.cron ?? "") : null;
  const gunler = z.gunler?.length ? z.gunler : [1];
  const gk = [...gunler].sort((a, b) => a - b).join(",");
  const hafta = gk === "1,2,3,4,5" ? "ici" : gk === "6,7" ? "sonu" : gk === "1,2,3,4,5,6,7" ? "her" : "ozel";
  const ayG = z.ayGunleri?.length ? z.ayGunleri : [z.ayGunu ?? 1];
  return (
    <div className="space-y-3.5 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
      <Segment id="siklik" kucuk deger={z.siklik} set={(v) => set(v === "ozel" ? { siklik: v, cron: z.cron || "0 9 * * 1-5" } : { siklik: v })} l={[{ id: "dakikalik", ad: "Dakika" }, { id: "saatlik", ad: "Saat" }, { id: "gunluk", ad: "Gün" }, { id: "haftalik", ad: "Hafta" }, { id: "aylik", ad: "Ay" }, { id: "ozel", ad: "Özel" }]} />
      {z.siklik === "dakikalik" && <Alan etiket="Kaç dakikada bir" ipucu="En az 5 dakika."><SayiSecim deger={Math.max(5, z.her ?? 15)} set={(v) => set({ her: v })} l={[5, 10, 15, 30]} birim="dakika" en={5} boy={720} /></Alan>}
      {z.siklik === "saatlik" && (
        <div className="grid grid-cols-2 gap-3">
          <Alan etiket="Kaç saatte bir"><SayiSecim deger={z.her ?? 1} set={(v) => set({ her: v })} l={[1, 2, 3, 6, 12]} birim="saat" en={1} boy={23} /></Alan>
          <Alan etiket="Kaç geçe"><input type="number" min={0} max={59} value={Number((z.saat ?? "00:00").split(":")[1])} onChange={(e) => set({ saat: `00:${iki(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}` })} className={cn(alanSinif, "h-10")} /></Alan>
        </div>
      )}
      {z.siklik === "haftalik" && (
        <Alan etiket="Günler">
          <Segment id="hafta-hazir" kucuk deger={hafta} set={(v) => { if (v === "ici") set({ gunler: [1, 2, 3, 4, 5] }); else if (v === "sonu") set({ gunler: [6, 7] }); else if (v === "her") set({ gunler: [1, 2, 3, 4, 5, 6, 7] }); }} l={[{ id: "ici", ad: "Hafta içi" }, { id: "sonu", ad: "Hafta sonu" }, { id: "her", ad: "Her gün" }, { id: "ozel", ad: "Özel" }]} />
          <div className="mt-2 flex flex-wrap gap-1.5">{GUNLER.map((g, i) => { const on = gunler.includes(i + 1); return <button key={g} type="button" aria-pressed={on} onClick={() => { const x = new Set(gunler); if (on) x.delete(i + 1); else x.add(i + 1); if (x.size) set({ gunler: [...x].sort((a, b) => a - b) }); }} className={cn("h-9 w-12 rounded-full text-[12.5px] font-medium transition", on ? "bg-white/[0.1] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/55 ring-1 ring-inset ring-white/[0.08] hover:text-white")}>{g}</button>; })}</div>
        </Alan>
      )}
      {z.siklik === "aylik" && (
        <Alan etiket="Ayın günleri" ipucu="Birden çok gün seçebilirsin. 29, 30 ve 31 o günü olmayan aylarda atlanır; her ay çalışsın istiyorsan Son gün'ü seç.">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((g) => { const on = ayG.includes(g); return <button key={g} type="button" aria-pressed={on} onClick={() => { const x = new Set(ayG); if (on) x.delete(g); else x.add(g); if (x.size) set({ ayGunleri: [...x].sort((a, b) => a - b), ayGunu: Math.min(...x) }); }} className={cn("h-8 rounded-[9px] text-[12.5px] tabular-nums transition", on ? "bg-white/[0.1] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/55 hover:text-white")}>{g}</button>; })}
            <button type="button" aria-pressed={ayG.includes(32)} onClick={() => { const x = new Set(ayG); if (x.has(32)) x.delete(32); else x.add(32); if (x.size) set({ ayGunleri: [...x].sort((a, b) => a - b) }); }} className={cn("col-span-4 h-8 rounded-[9px] text-[12.5px] transition", ayG.includes(32) ? "bg-white/[0.1] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/55 hover:text-white")}>Ayın son günü</button>
          </div>
        </Alan>
      )}
      {["gunluk", "haftalik", "aylik"].includes(z.siklik) && <Saatler z={z} set={set} />}
      {z.siklik === "ozel" && (
        <Alan etiket="Cron ifadesi" ipucu={<>Sırayla dakika, saat, ayın günü, ay, haftanın günü (0 ya da 7 pazar). Seçili saat dilimiyle çalışır. * her değer, */15 on beşte bir, 1-5 aralık, 1,15 liste.</>}>
          <input value={z.cron ?? ""} onChange={(e) => set({ cron: e.target.value })} spellCheck={false} placeholder="0 9 * * 1-5" className={cn(alanSinif, "sc-kod h-10 text-[13.5px]", cron?.hata && "ring-rose-400/40")} />
          {cron?.hata ? <p className="mt-1.5 text-[12px] text-rose-300">{cron.hata}</p> : <p className="mt-1.5 text-[12px] text-white/55">{zamanMetni(z)}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">{CRON_ORNEK.map((x) => <button key={x.c} type="button" onClick={() => set({ cron: x.c })} title={x.c} className={cn("rounded-full px-2.5 py-1 text-[11.5px] ring-1 ring-inset transition", z.cron === x.c ? "bg-white/[0.08] text-white ring-white/60" : "bg-white/[0.04] text-white/60 ring-white/[0.07] hover:text-white")}>{x.ad}</button>)}</div>
        </Alan>
      )}
      <Alan etiket="Saat dilimi" ipucu={`${dilimEtiketi(zamanDilimi(z))}. Yaz saati geçişleri kendiliğinden uygulanır.`}>
        <div className="flex flex-wrap items-center gap-2">
          <select value={zamanDilimi(z)} onChange={(e) => set({ saatDilimi: e.target.value })} className={cn(alanSinif, "h-10 min-w-[220px] flex-1 text-[13px]")}>
            {[...new Set([zamanDilimi(z), ...saatDilimleri()])].map((x) => <option key={x} value={x}>{x.replace(/_/g, " ")}</option>)}
          </select>
          {(() => { let b = ""; try { b = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* yok */ } return b && b !== zamanDilimi(z) ? <button type="button" onClick={() => set({ saatDilimi: b })} className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[12px] text-white/75 hover:bg-white/[0.1]">Bu cihazınki: {b.replace(/_/g, " ")}</button> : null; })()}
        </div>
      </Alan>
      <div className="grid grid-cols-2 gap-3">
        <Alan etiket="Başlangıç" sag={z.baslangic ? <button type="button" onClick={() => set({ baslangic: undefined })} className="text-[11.5px] text-white/45 hover:text-white">Temizle</button> : undefined}><input type="date" value={z.baslangic ?? ""} onChange={(e) => set({ baslangic: e.target.value || undefined })} className={cn(alanSinif, "h-10 text-[13px] [color-scheme:dark]")} /></Alan>
        <Alan etiket="Bitiş" sag={z.bitis ? <button type="button" onClick={() => set({ bitis: undefined })} className="text-[11.5px] text-white/45 hover:text-white">Temizle</button> : undefined}><input type="date" value={z.bitis ?? ""} min={z.baslangic} onChange={(e) => set({ bitis: e.target.value || undefined })} className={cn(alanSinif, "h-10 text-[13px] [color-scheme:dark]")} /></Alan>
      </div>
      <Alan etiket="Kaçırılan çalışma" ipucu="Sunucu kapalı ya da yeniden başlıyorken planlı zaman geçerse ne olsun? Yetişirse yalnız bir kez çalışır; tetik verisinde kacirildi alanı doğru olur.">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1"><AcilirSecim deger={tolOzel ? "ozel" : tol} set={(v) => { if (v === "ozel") { setTolOzel(true); return; } setTolOzel(false); set({ tolerans: Number(v) || undefined }); }} l={[...TOLERANS, { id: "ozel", ad: "Özel", alt: "Dakikayı kendin yaz, en çok 7 gün" }]} /></div>
          {tolOzel && <input type="number" min={1} max={10080} value={z.tolerans ?? 30} onChange={(e) => set({ tolerans: Math.max(1, Math.min(10080, Number(e.target.value) || 1)) })} aria-label="Dakika" className={cn(alanSinif, "h-10 w-24")} />}
        </div>
      </Alan>
      <div className="rounded-[14px] bg-[#0c0d0f] p-3 ring-1 ring-inset ring-white/[0.07]">
        <p className="mb-2 flex items-center gap-2 text-[12.5px] font-medium text-white/80"><CalendarClock className="h-3.5 w-3.5 text-[#8be6ff]" />Sonraki 5 çalışma</p>
        {sonraki.length ? (
          <ol className="space-y-1">
            {sonraki.map((t, i) => (
              <li key={t} className="flex items-center gap-2.5 text-[12.5px]">
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10.5px] tabular-nums", i === 0 ? "bg-[#55d6fd]/[0.16] text-[#8be6ff]" : "bg-white/[0.06] text-white/50")}>{i + 1}</span>
                <span className="text-white/85">{new Date(t).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", timeZone: zamanDilimi(z) })}</span>
                <span className="ml-auto tabular-nums text-white/55">{new Date(t).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: zamanDilimi(z) })}</span>
              </li>
            ))}
          </ol>
        ) : <p className="text-[12.5px] text-amber-200/90">{cron?.hata ? "İfade geçersiz; önizleme yok." : "Bu ayarlarla önümüzdeki 400 günde çalışma yok. Tarih aralığını ya da günleri kontrol et."}</p>}
      </div>
    </div>
  );
}
