"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Pause, Play, Plus, Search, Sparkles, Star, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SesAvatar } from "@/components/studyo/ses/ortak";
import { SESLER, type SesModel } from "@/lib/sesVeri";
import { sesCalici, useCalici } from "@/lib/sesCalici";
import { useOzelSesler } from "@/store/useOzelSesler";

/** Seçili ses: hazır kütüphane sesi ya da kullanıcının klonu. */
export type SesAnahtar = `hazir:${string}` | `ozel:${string}`;
export type SesBilgi = { anahtar: SesAnahtar; ad: string; cinsiyet: "Kadın" | "Erkek" | "Nötr"; tanim: string; aksan?: string; sesId?: string; renk: string; ozel: boolean; hazir: boolean };

const ORNEK_CUMLE = "Merhaba! Bu sesle senin videon için konuşabilirim.";

export function sesBilgi(anahtar: SesAnahtar, ozeller: ReturnType<typeof useOzelSesler.getState>["sesler"]): SesBilgi {
  const [tur, id] = anahtar.split(":") as ["hazir" | "ozel", string];
  if (tur === "ozel") {
    const o = ozeller.find((x) => x.id === id);
    if (o) return { anahtar, ad: o.ad, cinsiyet: o.cinsiyet, tanim: o.kaynak === "tasarim" ? o.aciklama ?? "Tasarım sesi" : "Kendi sesin (klon)", sesId: o.sesId, renk: "#55d6fd", ozel: true, hazir: o.durum === "klonlandi" };
  }
  const s = SESLER.find((x) => x.ad === id) ?? SESLER[0];
  return { anahtar: `hazir:${s.ad}`, ad: s.ad, cinsiyet: s.cinsiyet, tanim: s.tanim ?? "", aksan: s.aksan, sesId: s.sesId, renk: s.renk, ozel: false, hazir: true };
}

/** Sese özgü dalga deseni (ada göre sabit). */
export function Dalga({ ad, renk, adet = 18, yukseklik = 22, canli = false, className }: { ad: string; renk: string; adet?: number; yukseklik?: number; canli?: boolean; className?: string }) {
  const tohum = [...ad].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 11);
  return (
    <span aria-hidden className={cn("flex items-center gap-[2px]", className)} style={{ height: yukseklik }}>
      {Array.from({ length: adet }, (_, i) => {
        const h = 0.25 + (((tohum >> (i % 24)) ^ (i * 2654435761)) % 100) / 100 * 0.75;
        return <span key={i} className={cn("w-[2.5px] rounded-full", canli && "animate-pulse")} style={{ height: `${Math.max(18, h * 100)}%`, background: renk, opacity: 0.55 + h * 0.45, animationDelay: `${i * 70}ms` }} />;
      })}
    </span>
  );
}

/** Önizleme: sağlayıcının resmi örneği; ulaşılamazsa tarayıcının konuşma motoru (açıkça belirtilir). */
export function useSesOnizle() {
  const d = useCalici();
  const son = useRef<{ id: string; cinsiyet: SesBilgi["cinsiyet"] } | null>(null);
  useEffect(() => {
    if (son.current && d.id === son.current.id && d.tur === "dosya" && d.hata) {
      const { id, cinsiyet } = son.current;
      son.current = null;
      void sesCalici.cal(id, { tur: "tarayici", metin: ORNEK_CUMLE, dil: "tr-TR", cinsiyet });
    }
  }, [d.id, d.tur, d.hata]);
  const cal = (s: SesBilgi) => {
    const id = `speak:${s.anahtar}`;
    if (d.id === id && d.calisiyor) return sesCalici.durdur();
    son.current = { id, cinsiyet: s.cinsiyet };
    if (s.sesId && !s.ozel) void sesCalici.cal(id, { tur: "dosya", url: `/api/ses/onizleme/${s.sesId}` });
    else { son.current = null; void sesCalici.cal(id, { tur: "tarayici", metin: ORNEK_CUMLE, dil: "tr-TR", cinsiyet: s.cinsiyet }); }
  };
  return { cal, calan: d.calisiyor ? d.id?.replace(/^speak:/, "") : null, tarayici: d.tur === "tarayici" };
}

type Filtre = "tumu" | "Kadın" | "Erkek" | "ozel";

/** Ses kartı: sesin rengiyle hafif aydınlanan yüzey, dinle düğmesi, ad + etiketler, tanım ve geniş dalga. Seçili kart beyaz halkalı. */
function SesKart({ s, aktif, calan, onCal, onSec, rozet }: { s: SesBilgi; aktif: boolean; calan: boolean; onCal: () => void; onSec: () => void; rozet?: string }) {
  return (
    <div role="option" aria-selected={aktif}
      className={cn("group relative flex min-w-0 flex-col overflow-hidden rounded-[16px] p-3 ring-inset transition-[box-shadow,transform] duration-200 hover:-translate-y-px", aktif ? "ring-2 ring-white" : "ring-1 ring-white/[0.07] hover:ring-white/25", !s.hazir && "opacity-60")}
      style={{ background: `radial-gradient(120% 90% at 0% 0%, ${s.renk}${aktif ? "33" : "1f"}, transparent 60%), rgba(255,255,255,0.03)` }}>
      <button onClick={onSec} disabled={!s.hazir} aria-label={`${s.ad} sesini seç`} className="absolute inset-0 rounded-[16px]" />
      <span className="pointer-events-none relative flex items-center gap-3">
        <button onClick={(e) => { e.stopPropagation(); onCal(); }} aria-label={calan ? `${s.ad} durdur` : `${s.ad} dinle`}
          className="group/orb pointer-events-auto relative block h-11 w-11 shrink-0 rounded-full transition-transform hover:scale-105 active:scale-90">
          <SesAvatar ad={s.ad} renk={s.renk} boyut={44} aktif={calan} />
          <span className={cn("absolute inset-0 flex items-center justify-center rounded-full bg-black/40 transition-opacity", calan ? "opacity-100" : "opacity-0 group-hover/orb:opacity-100 group-hover:opacity-100")}>
            {calan ? <Pause className="h-4 w-4 fill-current text-white" /> : <Play className="h-4 w-4 translate-x-px fill-current text-white" />}
          </span>
        </button>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="flex items-center gap-1.5"><span className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-metin">{s.ad}</span>{rozet && <span className="shrink-0 rounded-full bg-white/[0.12] px-1.5 py-px text-[10.5px] font-medium text-metin">{rozet}</span>}</span>
          <span className="mt-1 flex items-center gap-1">
            {(s.ozel ? [s.hazir ? "Klon" : "Hazırlanıyor"] : [s.cinsiyet, s.aksan].filter(Boolean)).map((t) => <span key={t} className="rounded-full bg-black/25 px-1.5 py-px text-[10.5px] font-medium text-white/75">{t}</span>)}
          </span>
        </span>
      </span>
      <span className="pointer-events-none relative mt-2.5 line-clamp-1 text-[12.5px] text-metin-2">{s.tanim || "\u00a0"}</span>
      <Dalga ad={s.ad} renk={s.renk} adet={34} yukseklik={20} canli={calan} className="pointer-events-none relative mt-2 w-full justify-between" />
    </div>
  );
}

export function SesListe({ secili, onSec, onKlonla, onerilen, cal, calan }: {
  secili: SesAnahtar; onSec: (a: SesAnahtar) => void; onKlonla: () => void; onerilen?: "Kadın" | "Erkek"; cal: (s: SesBilgi) => void; calan: string | null | undefined;
}) {
  const ozeller = useOzelSesler((s) => s.sesler);
  const [ara, setAra] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tumu");
  const ozel = useMemo(() => ozeller.map((o) => sesBilgi(`ozel:${o.id}`, ozeller)), [ozeller]);
  const hazir = useMemo(() => SESLER.map((x: SesModel) => sesBilgi(`hazir:${x.ad}`, ozeller)), [ozeller]);
  const q = ara.trim().toLocaleLowerCase("tr");
  const eslesir = (x: SesBilgi) => !q || `${x.ad} ${x.tanim} ${x.aksan ?? ""} ${x.cinsiyet}`.toLocaleLowerCase("tr").includes(q);
  const sade = filtre === "tumu" && !q;
  const uygun = sade && onerilen ? hazir.filter((x) => x.cinsiyet === onerilen).slice(0, 4) : [];
  const liste = (filtre === "ozel" ? ozel : [...(filtre === "tumu" ? ozel : []), ...hazir.filter((x) => filtre === "tumu" || x.cinsiyet === filtre)])
    .filter((x) => !uygun.some((u) => u.anahtar === x.anahtar)).filter(eslesir);
  const sec = sesBilgi(secili, ozeller);
  const secCalan = calan === sec.anahtar;
  const kart = (x: SesBilgi, rozet?: string) => (
    <SesKart key={x.anahtar} s={x} aktif={x.anahtar === secili} calan={calan === x.anahtar} onCal={() => cal(x)} onSec={() => x.hazir && onSec(x.anahtar)} rozet={rozet} />
  );
  const bolum = (baslik: string, sag: React.ReactNode, icerik: React.ReactNode) => (
    <section className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="flex min-h-[36px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-metin">{baslik}</span>{sag}</div>
      <div className="grid grid-cols-2 gap-1.5 p-1.5">{icerik}</div>
    </section>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] p-2.5 max-sm:flex-col max-sm:items-stretch">
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full px-3.5 ring-1 ring-inset ring-white/[0.1] transition focus-within:ring-white/40" style={{ background: "rgba(255,255,255,0.05)" }}>
          <Search className="h-3.5 w-3.5 shrink-0 text-metin-3" />
          <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ses ara: sıcak, anlatıcı, İngiliz…" aria-label="Ses ara" className="min-w-0 flex-1 bg-transparent text-[13px] text-metin outline-none placeholder:text-metin-3" />
          {ara && <button onClick={() => setAra("")} aria-label="Aramayı temizle"><X className="h-3.5 w-3.5 text-metin-3" /></button>}
        </label>
        <div role="tablist" className="flex shrink-0 gap-0.5 rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.04)" }}>
          {([["tumu", "Tümü"], ["Kadın", "Kadın"], ["Erkek", "Erkek"], ["ozel", "Seslerim"]] as const).map(([v, ad]) => (
            <button key={v} role="tab" aria-selected={filtre === v} onClick={() => setFiltre(v)} className={cn("h-8 flex-1 whitespace-nowrap rounded-full px-3 text-[12.5px] font-medium transition-colors", filtre === v ? "bg-white text-black" : "text-metin-2 hover:text-metin")}>{ad}</button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5 [scrollbar-width:thin]">
        {!q && (
          <div className="relative flex items-center gap-3 overflow-hidden rounded-[16px] p-3 ring-1 ring-inset ring-white/[0.1]"
            style={{ background: `linear-gradient(110deg, ${sec.renk}33, ${sec.renk}0d 55%, rgba(255,255,255,0.03))` }}>
            <button onClick={() => cal(sec)} aria-label={secCalan ? "Durdur" : `${sec.ad} dinle`}
              className="group/orb relative block h-12 w-12 shrink-0 rounded-full transition-transform hover:scale-105 active:scale-90">
              <SesAvatar ad={sec.ad} renk={sec.renk} boyut={48} aktif={secCalan} />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-white">{secCalan ? <Pause className="h-[18px] w-[18px] fill-current" /> : <Play className="h-[18px] w-[18px] translate-x-px fill-current" />}</span>
            </button>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[11.5px] font-medium text-white/60">Seçili ses</span>
              <span className="block truncate text-[16px] font-semibold tracking-[-0.01em] text-white">{sec.ad}<span className="ml-2 text-[12.5px] font-normal text-white/60">{sec.ozel ? "Senin sesin" : [sec.cinsiyet, sec.aksan].filter(Boolean).join(" · ")}</span></span>
              <span className="mt-0.5 block truncate text-[12.5px] text-white/70">{sec.tanim}</span>
            </span>
            <Dalga ad={sec.ad} renk="#ffffff" adet={22} yukseklik={28} canli={secCalan} className="shrink-0 max-sm:hidden" />
          </div>
        )}
        {(filtre === "tumu" || filtre === "ozel") && !q && (
          <button onClick={onKlonla} className="group flex w-full items-center gap-3 rounded-[14px] p-2.5 text-left ring-1 ring-inset ring-white/[0.08] transition-colors hover:ring-white/25" style={{ background: "radial-gradient(120% 140% at 0% 0%, rgba(85,214,253,0.12), rgba(255,255,255,0.025) 55%)" }}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:scale-105"><Mic className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13.5px] font-semibold text-metin">Kendi sesini klonla</span><span className="mt-0.5 block truncate text-[12px] text-metin-3">30 saniyelik kayıt yeter; avatar senin sesinle konuşur</span></span>
            <span className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/[0.1] px-3 text-[12px] font-medium text-metin"><Plus className="h-3.5 w-3.5" />Klonla</span>
          </button>
        )}
        {uygun.length > 0 && bolum("Avatara uygun", <span className="flex items-center gap-1 text-[11.5px] text-metin-3"><Star className="h-3 w-3" />{onerilen} sesler</span>, uygun.map((x) => kart(x)))}
        {liste.length > 0 && bolum(filtre === "ozel" ? "Seslerim" : q ? "Arama sonuçları" : uygun.length ? "Diğer sesler" : "Sesler", <span className="text-[11.5px] tabular-nums text-metin-3">{liste.length}</span>, liste.map((x) => kart(x, x.ozel ? "Senin" : undefined)))}
        {!liste.length && !uygun.length && (
          <div className="flex flex-col items-center gap-2 rounded-[14px] px-6 py-8 text-center ring-1 ring-inset ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-metin-2">{filtre === "ozel" ? <Wand2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}</span>
            <p className="text-[13px] font-medium text-metin">{filtre === "ozel" ? "Henüz kendi sesin yok" : "Eşleşen ses yok"}</p>
            <p className="text-[12px] text-metin-3">{filtre === "ozel" ? "Yukarıdan sesini klonlayabilirsin." : "Başka bir sözcükle ara."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
