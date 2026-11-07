"use client";

import { useMemo, useState } from "react";
import { ArrowUp, Check, ChevronDown, Loader2, MessageSquareDiff, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { parcala, satirFarki } from "@/components/build/calisma/fark";
import { ARAC_KATALOG } from "@/lib/build/ajanKatalog";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import type { AjanOneri } from "@/lib/build/ajanOneri";
import type { Ajan } from "./ortak";

const IZIN_AD = { "her-zaman": "Açık", sor: "Sor", kapali: "Kapalı" } as const;
const ORNEKLER = ["İade ve şikayet sorularında konuşmayı insana devretsin", "Daha resmî ve kısa konuşsun", "Telefon ve TC kimlik numaralarını maskelesin"];

function TalimatFarki({ eski, yeni }: { eski: string; yeni: string }) {
  const [acik, setAcik] = useState(false);
  const p = useMemo(() => parcala(satirFarki(eski, yeni), 2), [eski, yeni]);
  const ekle = p.filter((x) => x.tur === "ekle").length, sil = p.filter((x) => x.tur === "sil").length;
  return (
    <div className="mt-2">
      <button type="button" onClick={() => setAcik((x) => !x)} aria-expanded={acik} className="flex items-center gap-1.5 text-[12px] text-white/55 hover:text-white"><ChevronDown className={cn("h-3.5 w-3.5 transition-transform", acik && "rotate-180")} />{acik ? "Farkı gizle" : "Farkı gör"}<span className="text-emerald-300/80">{ekle} satır eklendi</span>{sil > 0 && <span className="text-rose-300/70">{sil} satır çıktı</span>}</button>
      {acik && (
        <div className="mt-2 max-h-[260px] overflow-auto rounded-[12px] bg-black/30 py-1 text-[12px] leading-[1.6] ring-1 ring-inset ring-white/[0.06] [scrollbar-width:thin]">
          {p.map((x, i) => x.tur === "atla" ? <p key={i} className="px-3 text-center text-[11px] text-white/30">{x.adet} satır aynı</p>
            : <p key={i} className={cn("whitespace-pre-wrap px-3", x.tur === "ekle" ? "bg-emerald-400/[0.08] text-emerald-100" : x.tur === "sil" ? "bg-rose-500/[0.08] text-rose-100/70 line-through decoration-rose-300/30" : "text-white/50")}>{x.metin || " "}</p>)}
        </div>
      )}
    </div>
  );
}

function OneriGovdesi({ o, a }: { o: AjanOneri; a: Ajan }) {
  if (o.alan === "talimat") return <TalimatFarki eski={a.talimat} yeni={o.yeni} />;
  if (o.alan === "aciklama" || o.alan === "karsilama") return <p className="mt-2 rounded-[12px] bg-black/25 px-3 py-2 text-[12.5px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.06]">{o.yeni}</p>;
  if (o.alan === "baslangiclar") return <div className="mt-2 flex flex-wrap gap-1.5">{o.yeni.map((x) => <span key={x} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-white/75">{x}</span>)}</div>;
  if (o.alan === "arac") { const t = ARAC_KATALOG.find((x) => x.id === o.arac); return <p className="mt-2 text-[12.5px] text-white/70">{t?.ad ?? o.arac}: <span className="text-white/45">{IZIN_AD[a.araclar[o.arac] ?? "kapali"]}</span> yerine <span className="font-medium text-white">{IZIN_AD[o.izin]}</span></p>; }
  if (o.alan === "devir") return <div className="mt-2 space-y-1 text-[12.5px] text-white/70">{o.yeni.acik !== undefined && <p>İnsana devir: <span className="font-medium text-white">{o.yeni.acik ? "Açık" : "Kapalı"}</span></p>}{o.yeni.kurallar && <p className="rounded-[12px] bg-black/25 px-3 py-2 ring-1 ring-inset ring-white/[0.06]">{o.yeni.kurallar}</p>}{o.yeni.mesaj && <p className="text-white/50">Devir mesajı: {o.yeni.mesaj}</p>}</div>;
  if (o.alan !== "koruma") return null;
  return <div className="mt-2 space-y-1 text-[12.5px] text-white/70">{o.yeni.kisisel !== undefined && <p>Kişisel veri maskeleme: <span className="font-medium text-white">{o.yeni.kisisel ? "Açık" : "Kapalı"}</span></p>}{o.yeni.enjeksiyon !== undefined && <p>İstem saldırısı koruması: <span className="font-medium text-white">{o.yeni.enjeksiyon ? "Açık" : "Kapalı"}</span></p>}{o.yeni.yasakKonular?.length ? <p>Yasak konular: {o.yeni.yasakKonular.join(", ")}</p> : null}</div>;
}

/** Sohbetle düzenle: isteği yaz, Vayra alan alan öneri kartları çıkarır; her kart ayrı kabul edilir, hiçbiri kendiliğinden uygulanmaz. */
export function SohbetleDuzenle({ a, d }: { a: Ajan; d: (p: Partial<Ajan>) => void }) {
  const [istek, setIstek] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [v, setV] = useState<{ ozet: string; oneriler: (AjanOneri & { durum?: "uygulandi" | "gecildi" })[]; sorular: string[] } | null>(null);
  const iste = async () => {
    if (istek.trim().length < 3 || gidiyor) return;
    setGidiyor(true); setHata(""); setV(null);
    try { setV(await api(`/api/build/ajanlar/${a.id}/oneri`, { govde: { istek } })); setIstek(""); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Öneri alınamadı."); } finally { setGidiyor(false); }
  };
  /** Bir öneriyi verilen ajan durumuna uygulayan yama (birden çoğu art arda birleştirilebilsin). */
  const yama = (o: AjanOneri, t: Ajan): Partial<Ajan> =>
    o.alan === "talimat" ? { talimat: o.yeni } : o.alan === "aciklama" ? { aciklama: o.yeni } : o.alan === "karsilama" ? { karsilama: o.yeni }
      : o.alan === "baslangiclar" ? { baslangiclar: o.yeni } : o.alan === "arac" ? { araclar: { ...t.araclar, [o.arac]: o.izin } }
        : o.alan === "devir" ? { devir: { ...t.devir, ...o.yeni } } : { koruma: { ...t.koruma, ...o.yeni } };
  const uygulaHepsi = (idler: number[]) => {
    if (!v) return;
    let t = a; let p: Partial<Ajan> = {};
    for (const i of idler) { const y = yama(v.oneriler[i], t); t = { ...t, ...y }; p = { ...p, ...y }; }
    d(p);
    setV((x) => (x ? { ...x, oneriler: x.oneriler.map((y, j) => (idler.includes(j) ? { ...y, durum: "uygulandi" } : y)) } : x));
  };
  const uygula = (i: number) => uygulaHepsi([i]);
  const gec = (i: number) => setV((x) => (x ? { ...x, oneriler: x.oneriler.map((y, j) => (j === i ? { ...y, durum: "gecildi" } : y)) } : x));
  const bekleyen = v?.oneriler.filter((o) => !o.durum).length ?? 0;
  return (
    <Kart ikon={MessageSquareDiff} baslik="Sohbetle düzenle" alt="Ne değişsin, yaz; öneriler kart kart gelir, kabul etmeden hiçbir şey değişmez" govde="p-4 sm:p-5">
      <div className="cam-istemci rounded-[20px] p-1.5">
        <div className="flex items-end gap-2">
          <textarea value={istek} onChange={(e) => setIstek(e.target.value)} rows={2} maxLength={2000} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); iste(); } }}
            placeholder="Örneğin: kargo gecikmesinde özür dilesin ve takip numarasını sorsun" className="block max-h-[140px] min-h-[52px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[14px] leading-relaxed text-white outline-none placeholder:text-white/35" />
          <button type="button" onClick={iste} disabled={istek.trim().length < 3 || gidiyor} aria-label="Öneri iste" className="mb-0.5 mr-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-35">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}</button>
        </div>
      </div>
      {!v && !gidiyor && <div className="mt-2.5 flex flex-wrap gap-1.5">{ORNEKLER.map((x) => <button key={x} type="button" onClick={() => setIstek(x)} className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[12px] text-white/60 ring-1 ring-inset ring-white/[0.07] hover:text-white">{x}</button>)}</div>}
      {hata && <p className="mt-2.5 text-[12.5px] text-rose-300">{hata}</p>}
      {v && (
        <div className="mt-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 flex-1 text-[13px] text-white/75">{v.ozet || (v.oneriler.length ? `${v.oneriler.length} değişiklik önerildi.` : "Değişiklik önerilmedi.")}</p>
            {bekleyen > 1 && <button type="button" onClick={() => uygulaHepsi(v.oneriler.flatMap((o, i) => (o.durum ? [] : [i])))} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><Check className="h-3.5 w-3.5" />Hepsini uygula</button>}
          </div>
          {v.sorular.map((s) => <p key={s} className="rounded-[14px] bg-white/[0.04] px-3.5 py-2.5 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.07]">{s}</p>)}
          {v.oneriler.map((o, i) => (
            <div key={i} className={cn("rounded-[16px] p-3.5 ring-1 ring-inset transition-opacity", o.durum === "uygulandi" ? "bg-[#55d6fd]/[0.05] ring-[#55d6fd]/25" : o.durum === "gecildi" ? "bg-white/[0.02] opacity-50 ring-white/[0.06]" : "bg-white/[0.035] ring-white/[0.08]")}>
              <div className="flex items-start gap-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-white">{o.baslik}</span>
                  {o.neden && <span className="block text-[12px] leading-relaxed text-white/50">{o.neden}</span>}
                </span>
                {o.durum ? <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px]", o.durum === "uygulandi" ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.06] text-white/50")}>{o.durum === "uygulandi" ? "Uygulandı" : "Geçildi"}</span> : (
                  <span className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => uygula(i)} className="inline-flex h-8 items-center rounded-full bg-white px-3 text-[12.5px] font-semibold text-black">Uygula</button>
                    <button type="button" onClick={() => gec(i)} aria-label="Öneriyi geç" className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
                  </span>
                )}
              </div>
              {!o.durum && <OneriGovdesi o={o} a={a} />}
            </div>
          ))}
        </div>
      )}
    </Kart>
  );
}
