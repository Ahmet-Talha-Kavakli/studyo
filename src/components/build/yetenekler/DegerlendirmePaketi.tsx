"use client";

import { useEffect, useState } from "react";
import { Loader2, Play, X } from "lucide-react";
import { AcilirSecim, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import type { YetenekV2 } from "./YetenekAraclari";

type Denetim = { tur: "icerir" | "icermez" | "duzenli" | "enAz" | "enCok"; deger: string };
type Vaka = { id?: string; istem: string; denetimler: Denetim[] };
type Taraf = { gecen: number; toplam: number; hata?: string; ozet: string };
type Calisma = { zaman: number; surum: number; model: string; ile: number; olmadan: number; toplam: number; sure: number; belirtec: number; vakalar: { id: string; ile: Taraf; olmadan: Taraf }[] };
const DENETIM_AD: Record<Denetim["tur"], string> = { icerir: "İçermeli", icermez: "İçermemeli", duzenli: "Düzenli ifade", enAz: "En az karakter", enCok: "En çok karakter" };
const yuzde = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/** Kayıtlı vakalar, yetenekli ve yeteneksiz çalıştırma, sürüm sürüm geçmiş (gerileme işaretiyle). */
export function DegerlendirmePaketi({ y, modeller }: { y: YetenekV2; modeller: { l: { id: string; ad: string; alt?: string }[]; ilk: string; hazir: boolean } }) {
  const [vakalar, setVakalar] = useState<Vaka[]>([]);
  const [calismalar, setCalismalar] = useState<Calisma[]>([]);
  const [model, setModel] = useState("");
  const [gidiyor, setGidiyor] = useState<"" | "kaydet" | "calistir">("");
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [acik, setAcik] = useState<number | null>(null);
  useEffect(() => {
    api<{ vakalar: Vaka[]; calismalar: Calisma[] }>(`/api/build/yetenekler/${y.id}/degerlendir`).then((v) => {
      setVakalar(v.vakalar.length ? v.vakalar : y.ornekler.filter((x) => x.trim()).slice(0, 2).map((istem) => ({ istem, denetimler: [{ tur: "enAz", deger: "80" }] })));
      setCalismalar(v.calismalar);
    }).catch(() => {});
  }, [y.id, y.ornekler]);
  const d = (i: number, p: Partial<Vaka>) => setVakalar((l) => l.map((v, j) => (j === i ? { ...v, ...p } : v)));
  const gonder = async (calistir: boolean) => {
    setGidiyor(calistir ? "calistir" : "kaydet"); setHata(""); setBilgi("");
    try {
      const r = await api<{ calismalar?: Calisma[]; vakalar?: Vaka[] }>(`/api/build/yetenekler/${y.id}/degerlendir`, { govde: { vakalar, calistir, model: model || modeller.ilk } });
      if (r.calismalar) { setCalismalar(r.calismalar); setAcik(0); } else { if (r.vakalar) setVakalar(r.vakalar); setBilgi("Paket kaydedildi."); }
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Çalıştırılamadı."); } finally { setGidiyor(""); }
  };
  const son = calismalar[0];
  return (
    <div className="h-full min-h-0 space-y-3 overflow-y-auto p-3 [scrollbar-width:thin]">
      <p className="px-1 text-[12.5px] leading-relaxed text-white/55">Her vaka aynı modelle yetenek yüklüyken ve yokken çalışır; denetimler yanıta uygulanır. Sonuçlar sürüm numarasıyla saklanır, böylece bir değişikliğin yeteneği geriletip geriletmediğini görürsün.</p>
      {son && (
        <dl className="grid grid-cols-3 overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.08]">
          <div className="px-3.5 py-2.5"><dt className="text-[11.5px] text-white/45">Yetenekle</dt><dd className="text-[18px] font-semibold tabular-nums text-white">yüzde {yuzde(son.ile, son.toplam)}</dd></div>
          <div className="border-l border-white/[0.06] px-3.5 py-2.5"><dt className="text-[11.5px] text-white/45">Yeteneksiz</dt><dd className="text-[18px] font-semibold tabular-nums text-white">yüzde {yuzde(son.olmadan, son.toplam)}</dd></div>
          <div className="border-l border-white/[0.06] px-3.5 py-2.5"><dt className="text-[11.5px] text-white/45">Katkı</dt><dd className={cn("text-[18px] font-semibold tabular-nums", son.ile >= son.olmadan ? "text-[#8be6ff]" : "text-rose-200")}>{son.ile >= son.olmadan ? "artı" : "eksi"} {Math.abs(yuzde(son.ile, son.toplam) - yuzde(son.olmadan, son.toplam))} puan</dd></div>
        </dl>
      )}
      <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
        <p className="border-b border-white/[0.06] px-3.5 py-2.5 text-[13px] font-semibold text-white">Vakalar ({vakalar.length})</p>
        <div className="divide-y divide-white/[0.05]">
          {vakalar.map((v, i) => (
            <div key={i} className="space-y-2 px-3.5 py-3">
              <div className="flex gap-2">
                <textarea value={v.istem} onChange={(e) => d(i, { istem: e.target.value })} rows={2} maxLength={2000} placeholder="Kullanıcının isteği" className={cn(alanSinif, "resize-none py-2 text-[13px]")} />
                <button type="button" onClick={() => setVakalar((l) => l.filter((_, j) => j !== i))} aria-label="Vakayı sil" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-rose-300"><X className="h-3.5 w-3.5" /></button>
              </div>
              {v.denetimler.map((c, k) => (
                <div key={k} className="flex flex-wrap items-center gap-2 pl-1">
                  <select value={c.tur} onChange={(e) => d(i, { denetimler: v.denetimler.map((x, m) => (m === k ? { ...x, tur: e.target.value as Denetim["tur"] } : x)) })} aria-label="Denetim türü" className={cn(alanSinif, "h-9 w-[150px] text-[12.5px]")}>
                    {(Object.keys(DENETIM_AD) as Denetim["tur"][]).map((t) => <option key={t} value={t}>{DENETIM_AD[t]}</option>)}
                  </select>
                  <input value={c.deger} onChange={(e) => d(i, { denetimler: v.denetimler.map((x, m) => (m === k ? { ...x, deger: e.target.value } : x)) })} placeholder={c.tur === "duzenli" ? "ör. KDV dahil" : c.tur === "enAz" || c.tur === "enCok" ? "sayı" : "metin"} className={cn(alanSinif, "h-9 min-w-[120px] flex-1 text-[12.5px]")} />
                  <button type="button" onClick={() => d(i, { denetimler: v.denetimler.filter((_, m) => m !== k) })} aria-label="Denetimi sil" className="flex h-8 w-8 items-center justify-center rounded-full text-white/35 hover:text-rose-300"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <button type="button" onClick={() => d(i, { denetimler: [...v.denetimler, { tur: "icerir" as const, deger: "" }].slice(0, 10) })} className="ml-1 text-[12px] text-[#8be6ff] hover:underline">Denetim ekle</button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-3.5 py-2.5">
          <button type="button" onClick={() => setVakalar((l) => [...l, { istem: "", denetimler: [{ tur: "icerir" as const, deger: "" }] }].slice(0, 20))} className="h-9 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]">Vaka ekle</button>
          <button type="button" onClick={() => gonder(false)} disabled={!!gidiyor} className="h-9 rounded-full px-3 text-[12.5px] text-white/65 hover:text-white">{gidiyor === "kaydet" ? "Kaydediliyor" : "Kaydet"}</button>
          <span className="flex-1" />
          <div className="w-[180px]">{modeller.hazir && <AcilirSecim deger={model || modeller.ilk} set={setModel} l={modeller.l} />}</div>
          <button type="button" onClick={() => gonder(true)} disabled={!!gidiyor || !vakalar.some((v) => v.istem.trim())} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">{gidiyor === "calistir" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}Paketi çalıştır</button>
        </div>
      </section>
      {hata && <p className="text-[13px] text-rose-300">{hata}</p>}
      {bilgi && <p className="text-[13px] text-[#bdefff]">{bilgi}</p>}
      {calismalar.length > 0 && (
        <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
          <p className="border-b border-white/[0.06] px-3.5 py-2.5 text-[13px] font-semibold text-white">Geçmiş</p>
          <div className="divide-y divide-white/[0.05]">
            {calismalar.map((c, i) => {
              const onceki = calismalar[i + 1];
              const geriledi = onceki && yuzde(c.ile, c.toplam) < yuzde(onceki.ile, onceki.toplam);
              return (
                <div key={c.zaman}>
                  <button type="button" onClick={() => setAcik(acik === i ? null : i)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-white/[0.02]">
                    <span className="shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] tabular-nums text-white/70">Sürüm {c.surum}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/80">yetenekle yüzde {yuzde(c.ile, c.toplam)} · yeteneksiz yüzde {yuzde(c.olmadan, c.toplam)}</span>
                    {geriledi && <span className="shrink-0 rounded-full bg-rose-500/[0.12] px-2 py-0.5 text-[11px] text-rose-200">Geriledi</span>}
                    <span className="shrink-0 text-[11.5px] text-white/40">{gorece(c.zaman)}</span>
                  </button>
                  {acik === i && (
                    <div className="space-y-2 px-3.5 pb-3">
                      {c.vakalar.map((v, k) => (
                        <div key={v.id} className="rounded-[12px] bg-black/20 p-2.5 ring-1 ring-inset ring-white/[0.05]">
                          <p className="text-[12px] text-white/70">{vakalar.find((x) => x.id === v.id)?.istem ?? `Vaka ${k + 1}`}</p>
                          <p className="mt-1 text-[11.5px] tabular-nums text-white/50">Yetenekle {v.ile.gecen} / {v.ile.toplam}{v.ile.hata ? ` · ${v.ile.hata}` : ""} · yeteneksiz {v.olmadan.gecen} / {v.olmadan.toplam}</p>
                          <p className="mt-1 line-clamp-3 text-[11.5px] leading-snug text-white/45">{v.ile.ozet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
