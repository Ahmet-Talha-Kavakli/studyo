"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeftRight, Clock3, Gauge, Plus, Tags, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api } from "@/lib/build/istemci";
import { GUN_KISA, mesaiOzeti, mesaideMi } from "@/lib/build/ajanMesai";
import { cn } from "@/lib/utils";
import { Anahtar, alanSinif } from "./AjanDuzenleyici";
import { AjanSimge, AyarSatiri, TON_SINIF, ikincil, type Ajan } from "./ortak";

type D = (p: Partial<Ajan>) => void;
type AOzet = { id: string; ad: string; aciklama: string; simge: string; yayinda: boolean };

/** Çoklu ajan yönlendirme: bu ajan ön kapı olur, konuşmayı konusuna göre uzman ajanlara devreder. */
export function YonlendirmeKarti({ a, d }: { a: Ajan; d: D }) {
  const [l, setL] = useState<AOzet[] | null>(null);
  useEffect(() => { api<{ ajanlar: AOzet[] }>("/api/build/ajanlar").then((v) => setL(v.ajanlar.filter((x) => x.id !== a.id))).catch(() => setL([])); }, [a.id]);
  const y = a.yonlendirme;
  const set = (p: Partial<Ajan["yonlendirme"]>) => d({ yonlendirme: { ...y, ...p } });
  const secili = new Map(y.uzmanlar.map((u) => [u.id, u]));
  const degistir = (x: AOzet, v: boolean) => set({ uzmanlar: v ? [...y.uzmanlar, { id: x.id, ne: "" }].slice(0, 8) : y.uzmanlar.filter((u) => u.id !== x.id) });
  const ne = (id: string, metin: string) => set({ uzmanlar: y.uzmanlar.map((u) => (u.id === id ? { ...u, ne: metin } : u)) });
  const yayindaOlmayan = (l ?? []).filter((x) => secili.has(x.id) && !x.yayinda);
  return (
    <Kart ikon={ArrowLeftRight} baslik="Yönlendirme" alt="Bu ajan ön kapı olur; konuşmayı konusuna göre uzman ajana devreder, uzman konuşmayı sürdürür"
      sag={<>{y.acik && y.uzmanlar.length > 0 && <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-white/50">{y.uzmanlar.length} uzman</span>}<Anahtar acik={y.acik} set={(v) => set({ acik: v })} etiket="Yönlendirme" /></>}>
      {!y.acik ? <p className="px-4 py-3.5 text-[13px] leading-relaxed text-white/50 sm:px-5">Açınca ajan, faturalama ya da teknik destek gibi uzmanlık isteyen konuşmaları seçtiğin ajanlara devreder. Ziyaretçi uzmanın adını ve simgesini görür; devir konuşmada ve çalışma izinde kayıtlı kalır.</p>
        : l === null ? <div className="h-16 animate-pulse" /> : !l.length ? <p className="px-4 py-3.5 text-[13px] leading-relaxed text-white/50 sm:px-5">Uzman olacak başka ajanın yok. Örneğin bir faturalama ve bir teknik destek ajanı kur; bu ajan konuşmaları onlara dağıtır.</p> : (
          <>
            <div className="divide-y divide-white/[0.04]">
              {l.map((x) => {
                const u = secili.get(x.id);
                return (
                  <div key={x.id} className="px-4 py-2.5 sm:px-5">
                    <div className="flex items-center gap-3">
                      <AjanSimge src={x.simge} boyut={38} className={cn(!u && "opacity-50")} />
                      <span className="min-w-0 flex-1"><span className={cn("block truncate text-[13.5px] font-medium", u ? "text-white" : "text-white/60")}>{x.ad}</span><span className="block truncate text-[12px] text-white/40">{x.yayinda ? "Yayında" : "Taslak, herkese açık kanallarda devredilemez"}{x.aciklama ? ` · ${x.aciklama}` : ""}</span></span>
                      <Anahtar acik={!!u} set={(v) => degistir(x, v)} etiket={`${x.ad} uzman`} />
                    </div>
                    <AnimatePresence initial={false}>
                      {u && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <input value={u.ne} onChange={(e) => ne(x.id, e.target.value)} maxLength={400} placeholder={`Ne zaman devredilsin? Örneğin ${x.aciklama ? x.aciklama.toLocaleLowerCase("tr").replace(/[.]$/, "") : "fatura, ödeme ve iade soruları"}`}
                            className={cn(alanSinif, "mt-2 h-10 text-[13px]")} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            <div className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
              <AyarSatiri baslik="Uzman geri verebilsin" alt="Ziyaretçi uzmanın konusu dışına çıkınca uzman konuşmayı bu ajana geri verir; bu ajan aynı mesajı yanıtlar."><Anahtar acik={y.geriDonus} set={(v) => set({ geriDonus: v })} etiket="Uzman geri verebilsin" /></AyarSatiri>
            </div>
            {yayindaOlmayan.length > 0 && <p className="flex items-start gap-2 border-t border-white/[0.06] px-4 py-2.5 text-[12px] leading-relaxed text-amber-100/85 sm:px-5"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{yayindaOlmayan.map((x) => x.ad).join(", ")} yayında değil; denemede taslakları çalışır, herkese açık kanallarda devredilmez.</p>}
          </>
        )}
    </Kart>
  );
}

/** İnsana devir kartının mesai bölümü: günler, saat aralığı ve mesai dışı mesajı; şu anki durum hapı. */
export function MesaiAyarlari({ a, d }: { a: Ajan; d: D }) {
  const m = a.devir.mesai ?? { acik: false, gunler: [1, 2, 3, 4, 5], bas: "09:00", bit: "18:00", disari: "" };
  const set = (p: Partial<typeof m>) => d({ devir: { ...a.devir, mesai: { ...m, ...p } } });
  const [simdi, setSimdi] = useState(0);
  useEffect(() => { setSimdi(Date.now()); const t = setInterval(() => setSimdi(Date.now()), 60_000); return () => clearInterval(t); }, []);
  const ic = simdi ? mesaideMi(m, simdi) : true;
  return (
    <div className="border-t border-white/[0.06]">
      <AyarSatiri baslik={<span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-white/55" />Mesai saatleri</span>} alt={m.acik ? `${mesaiOzeti(m)} · Türkiye saati` : "Kapalıyken devirde her zaman yukarıdaki mesaj söylenir."}>
        {m.acik && simdi > 0 && <span className={cn("rounded-full px-2.5 py-0.5 text-[11.5px] font-medium", ic ? TON_SINIF.iyi : TON_SINIF.bekliyor)}>{ic ? "Şu an mesai içinde" : "Şu an mesai dışında"}</span>}
        <Anahtar acik={m.acik} set={(v) => set({ acik: v })} etiket="Mesai saatleri" />
      </AyarSatiri>
      <AnimatePresence initial={false}>
        {m.acik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3 px-4 pb-4 sm:px-5">
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 0].map((g) => { const s = m.gunler.includes(g); return (
                  <button key={g} type="button" aria-pressed={s} onClick={() => set({ gunler: s ? m.gunler.filter((x) => x !== g) : [...m.gunler, g] })}
                    className={cn("h-8 rounded-full px-3 text-[12.5px] ring-1 ring-inset transition active:scale-95", s ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.04] text-white/60 ring-white/[0.08] hover:text-white")}>{GUN_KISA[g]}</button>
                ); })}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-white/55">
                <input type="time" value={m.bas} onChange={(e) => set({ bas: e.target.value })} className={cn(alanSinif, "h-9 w-[110px] text-[13px] tabular-nums [color-scheme:dark]")} />ile
                <input type="time" value={m.bit} onChange={(e) => set({ bit: e.target.value })} className={cn(alanSinif, "h-9 w-[110px] text-[13px] tabular-nums [color-scheme:dark]")} />arası
              </div>
              <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Mesai dışında devirde ziyaretçiye söylenecek</span><input value={m.disari} onChange={(e) => set({ disari: e.target.value })} maxLength={300} className={cn(alanSinif, "h-10 text-[13.5px]")} /></label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const KALITE_HAZIR = ["Fiyat, stok ya da tarih uydurmamalı", "Ziyaretçiye kibar ve sabırlı davranmalı", "Kişisel veri (kimlik, kart) istememeli", "Çözemediği konuda insana devretmeli", "Rakip firmaları kötülememeli"];

/** Konular (konuşma etiketleri) ve kalite kuralları: yapay zekâ biten konuşmaları etiketler ve kurallara göre denetler. */
export function KonuKarti({ a, d }: { a: Ajan; d: D }) {
  const [yeni, setYeni] = useState("");
  const [kural, setKural] = useState("");
  const k = a.konular, q = a.kalite;
  const setK = (p: Partial<Ajan["konular"]>) => d({ konular: { ...k, ...p } });
  const setQ = (p: Partial<Ajan["kalite"]>) => d({ kalite: { ...q, ...p } });
  const ekle = () => { const x = yeni.trim(); if (x && !k.etiketler.some((e) => e.ad.toLocaleLowerCase("tr") === x.toLocaleLowerCase("tr"))) setK({ etiketler: [...k.etiketler, { ad: x.slice(0, 40) }].slice(0, 30) }); setYeni(""); };
  const kuralEkle = (x: string) => { const v = x.trim(); if (v && !q.kurallar.includes(v)) setQ({ kurallar: [...q.kurallar, v].slice(0, 12) }); setKural(""); };
  return (
    <Kart ikon={Tags} baslik="Konular ve kalite" alt="Konuşmaları konulara ayır, her konuşmayı kurallarına göre denetlet">
      <div className="space-y-2.5 px-4 py-3.5 sm:px-5">
        <p className="text-[13.5px] font-medium text-white">Konu etiketleri</p>
        <p className="-mt-1.5 text-[12px] leading-relaxed text-white/45">Analitikte konu başına konuşma sayısı, çözüm oranı ve memnuniyet görünür. Gelen kutusunda elle de etiketlenir.</p>
        {k.etiketler.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {k.etiketler.map((e) => <span key={e.ad} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.06] pl-3 pr-1 text-[12.5px] text-white/85 ring-1 ring-inset ring-white/[0.08]">{e.ad}<button type="button" onClick={() => setK({ etiketler: k.etiketler.filter((x) => x.ad !== e.ad) })} aria-label={`${e.ad} etiketini kaldır`} className="flex h-6 w-6 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.1] hover:text-white"><X className="h-3 w-3" /></button></span>)}
          </div>
        )}
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); ekle(); }}><input value={yeni} onChange={(e) => setYeni(e.target.value)} maxLength={40} placeholder="Örneğin Kargo, İade, Fiyat, Teknik sorun" className={cn(alanSinif, "h-9 text-[13px]")} /><button type="submit" disabled={!yeni.trim()} className={cn(ikincil, "h-9")}><Plus className="h-3.5 w-3.5" />Ekle</button></form>
      </div>
      <div className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
        <AyarSatiri baslik="Yapay zekâyla otomatik etiketle" alt="Biten konuşmalar arka planda sonuç (çözüldü, yükseltildi, terk), konu ve tahmini memnuniyetle etiketlenir; kalite kuralları da denetlenir. Bağlı model kredisi harcar.">
          <Anahtar acik={k.otomatik} set={(v) => setK({ otomatik: v })} etiket="Otomatik etiketle" />
        </AyarSatiri>
      </div>
      <div className="space-y-2.5 border-t border-white/[0.06] px-4 py-3.5 sm:px-5">
        <p className="flex items-center gap-2 text-[13.5px] font-medium text-white"><Gauge className="h-3.5 w-3.5 text-white/55" />Kalite kuralları</p>
        <p className="-mt-1.5 text-[12px] leading-relaxed text-white/45">Her konuşma bu cümlelere göre denetlenir; uymayanlar Konuşmalar ve gelen kutusunda işaretlenir.</p>
        {q.kurallar.length > 0 && (
          <ul className="space-y-1.5">
            {q.kurallar.map((x) => <li key={x} className="flex items-center gap-2 rounded-[12px] bg-white/[0.04] py-1.5 pl-3 pr-1 text-[13px] text-white/85 ring-1 ring-inset ring-white/[0.07]"><span className="min-w-0 flex-1">{x}</span><button type="button" onClick={() => setQ({ kurallar: q.kurallar.filter((y) => y !== x) })} aria-label="Kuralı kaldır" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.1] hover:text-white"><X className="h-3.5 w-3.5" /></button></li>)}
          </ul>
        )}
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); kuralEkle(kural); }}><input value={kural} onChange={(e) => setKural(e.target.value)} maxLength={300} placeholder="Ajan ne yapmalı ya da ne yapmamalı" className={cn(alanSinif, "h-9 text-[13px]")} /><button type="submit" disabled={!kural.trim()} className={cn(ikincil, "h-9")}><Plus className="h-3.5 w-3.5" />Ekle</button></form>
        <div className="flex flex-wrap gap-1.5">{KALITE_HAZIR.filter((x) => !q.kurallar.includes(x)).map((x) => <button key={x} type="button" onClick={() => kuralEkle(x)} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.1] hover:text-white"><Plus className="h-3 w-3" />{x}</button>)}</div>
      </div>
    </Kart>
  );
}
