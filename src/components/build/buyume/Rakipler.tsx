"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Bot, Copy, Globe, Lightbulb, ShieldAlert, Swords, Trash2, Wand2 } from "lucide-react";
import { gorece } from "@/lib/build/istemci";
import type { RakipAnaliz } from "@/lib/build/buyumeEkTipler";
import { cn } from "@/lib/utils";
import { birincil, HataSatiri, ikincil, Kart, Rozet, simgeDugme, Suruyor, useKopyala } from "./ortak";
import type { BolumProps } from "./BuyumeSekme";

export function RakiplerBolumu({ p, e, ajanaGonder }: BolumProps) {
  const d = e.d!;
  const [adres, setAdres] = useState("");
  const [hata, setHata] = useState("");
  const [uyari, setUyari] = useState("");
  const [secili, setSecili] = useState<string | null>(null);
  const suruyor = e.suruyor("rakip");
  const r = d.ek.rakipler.find((x) => x.id === secili) ?? d.ek.rakipler[0] ?? null;
  const oku = async () => {
    setHata(""); setUyari("");
    try { const j = await e.islem("rakip", { adres: adres.trim() }); setAdres(""); const ilk = (j.ek as { rakipler: RakipAnaliz[] }).rakipler[0]; setSecili(ilk?.id ?? null); if (ilk?.uyari) setUyari(ilk.uyari); }
    catch (x) { setHata(x instanceof Error ? x.message : "Okunamadı."); }
  };
  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex items-center gap-2">Rakip analizi<Rozet>{d.ek.rakipler.length}</Rozet></span>} aciklama={`Rakibin sitesini oku; ${p.ad} ile konumlandırma, vaat, fiyat iletişimi, güven unsurları ve çağrıları karşılaştır. Rakibin boş bıraktığı yerden mesaj önerileri çıkar.`}>
        <div className="cam-istemci flex items-center gap-2 rounded-[18px] p-2">
          <Globe className="ml-1.5 h-4 w-4 shrink-0 text-white/45" />
          <input value={adres} onChange={(x) => setAdres(x.target.value)} onKeyDown={(x) => { if (x.key === "Enter" && adres.trim() && !suruyor) oku(); }} placeholder="rakibinsitesi.com" inputMode="url" className="h-9 min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />
          <button type="button" disabled={!adres.trim() || suruyor} onClick={oku} className={cn(birincil, "h-9")}>{suruyor ? <span className="build-nokta" /> : <Swords className="h-4 w-4" />}{suruyor ? "Okunuyor" : "Karşılaştır"}</button>
        </div>
        {d.ek.rakipler.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">{d.ek.rakipler.map((x) => <button key={x.id} type="button" onClick={() => setSecili(x.id)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px]", r?.id === x.id ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/65 ring-1 ring-inset ring-white/[0.08] hover:text-white")}><Globe className="h-3.5 w-3.5" />{x.ad}</button>)}</div>
        )}
      </Kart>
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {uyari && <p className="rounded-[12px] bg-amber-400/[0.06] px-3 py-2 text-[12.5px] text-amber-100/90 ring-1 ring-inset ring-amber-300/15">{uyari}</p>}
      {suruyor && <Suruyor metin="Rakip sitesi okunuyor" alt="Sayfa güvenli ağ üzerinden indiriliyor, başlıklar, çağrılar ve fiyatlar çıkarılıyor, sonra ajan karşılaştırıyor." />}
      {!r && !suruyor && (
        <Kart><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#55d6fd]/[0.08] ring-1 ring-inset ring-[#55d6fd]/20"><Swords className="h-5 w-5 text-[#8be6ff]" /></span><div className="min-w-[200px] flex-1"><p className="text-[14px] font-semibold text-white">İlk rakibini ekle</p><p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">Aynı semtteki işletmeyi ya da kategorindeki en bilinen siteyi yaz. Ajan yalnız sitede yazanlara dayanır; trafik ya da gelir tahmini yapmaz.</p></div></div></Kart>
      )}
      {r && <RakipKarti r={r} p={p} sil={() => e.duzenle("rakipSil", { id: r.id }).then(() => setSecili(null)).catch((x) => setHata(x.message))} ajanaGonder={ajanaGonder} />}
    </div>
  );
}

function RakipKarti({ r, p, sil, ajanaGonder }: { r: RakipAnaliz; p: BolumProps["p"]; sil: () => void; ajanaGonder?: (m: string) => void }) {
  const [kopya, kopyala] = useKopyala();
  const o = r.okunan, a = r.analiz;
  return (
    <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Kart baslik={<span className="flex items-center gap-2">{r.ad}<a href={r.adres} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white" aria-label="Siteyi aç"><ArrowUpRight className="h-4 w-4" /></a></span>} aciklama={`${gorece(r.zaman)} okundu${r.model ? `, ${r.model} karşılaştırdı` : ""}`}
        sag={<button type="button" onClick={sil} className={cn(simgeDugme, "hover:text-rose-200")} aria-label="Rakibi sil" title="Sil"><Trash2 className="h-4 w-4" /></button>}>
        {a?.ozet && <p className="mb-3 text-[13.5px] leading-relaxed text-white/80">{a.ozet}</p>}
        {a && (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-[14px] bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.08]"><p className="text-[11.5px] text-white/45">{p.ad}</p><p className="mt-1 text-[13.5px] font-medium leading-relaxed text-white">{a.bizimKonum}</p></div>
            <div className="rounded-[14px] bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.06]"><p className="text-[11.5px] text-white/45">{r.ad}</p><p className="mt-1 text-[13.5px] leading-relaxed text-white/75">{a.rakipKonum}</p></div>
          </div>
        )}
      </Kart>
      {a && a.karsilastirma.length > 0 && (
        <Kart baslik="Karşılaştırma">
          <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            <div className="grid grid-cols-[minmax(90px,0.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-px bg-white/[0.05] text-[12px] text-white/45"><span className="bg-[#141518] px-3 py-2">Boyut</span><span className="bg-[#141518] px-3 py-2">{p.ad}</span><span className="bg-[#141518] px-3 py-2">{r.ad}</span></div>
            {a.karsilastirma.map((x) => <div key={x.boyut} className="grid grid-cols-[minmax(90px,0.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-px border-t border-white/[0.05] bg-white/[0.05] text-[12.5px] leading-relaxed"><span className="bg-[#131416] px-3 py-2.5 font-medium text-white">{x.boyut}</span><span className="bg-[#131416] px-3 py-2.5 text-white/80">{x.biz}</span><span className="bg-[#131416] px-3 py-2.5 text-white/65">{x.rakip}</span></div>)}
          </div>
        </Kart>
      )}
      {a && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Kart baslik={<span className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-[#8be6ff]" />Fırsatlar</span>}><ul className="space-y-2">{a.firsatlar.map((x) => <li key={x} className="flex gap-2 text-[13px] leading-relaxed text-white/80"><span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#55d6fd]" />{x}</li>)}</ul></Kart>
          <Kart baslik={<span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-300" />Rakibin güçlü olduğu yerler</span>}><ul className="space-y-2">{a.dikkat.map((x) => <li key={x} className="flex gap-2 text-[13px] leading-relaxed text-white/80"><span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />{x}</li>)}</ul></Kart>
        </div>
      )}
      {a && a.mesajlar.length > 0 && (
        <Kart baslik="Ayrıştıran mesaj önerileri" aciklama="Ana başlıkta, reklamda ya da gönderide dene; A/B denemesiyle ölç.">
          <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            {a.mesajlar.map((m, i) => (
              <li key={m} className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 sm:flex-nowrap">
                <span className="min-w-[200px] flex-1 text-[13.5px] text-white">{m}</span>
                <button type="button" onClick={() => kopyala(`m${i}`, m)} className={simgeDugme} aria-label="Kopyala" title={kopya === `m${i}` ? "Kopyalandı" : "Kopyala"}>{kopya === `m${i}` ? <span className="text-[10.5px] font-semibold text-[#8be6ff]">Tamam</span> : <Copy className="h-3.5 w-3.5" />}</button>
                {ajanaGonder && <button type="button" onClick={() => ajanaGonder(`Ana sayfanın h1 başlığını şu mesajla değiştir, alt başlığı buna uyumlu yaz: "${m}". Başka bölümlere dokunma.`)} className={cn(ikincil, "h-8 px-3 text-[12px]")}><Bot className="h-3.5 w-3.5" />Başlığa uygula</button>}
              </li>
            ))}
          </ul>
        </Kart>
      )}
      <Kart baslik="Siteden okunanlar" aciklama="Ajanın karşılaştırmaya kattığı ham bilgiler.">
        <dl className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
          {[["Başlık", o.baslik], ["Açıklama", o.aciklama], ["Ana başlık", o.h1], ["Ara başlıklar", o.basliklar.join(" · ")], ["Çağrılar", o.cagrilar.join(", ")], ["Fiyat ifadeleri", o.fiyatlar.join(", ")], ["Sosyal", o.sosyal.join(", ")], ["Metin uzunluğu", `${o.kelime.toLocaleString("tr-TR")} sözcük`]].map(([x, v]) => <div key={x} className="flex gap-3 px-3.5 py-2.5"><dt className="w-[110px] shrink-0 text-[12px] text-white/45">{x}</dt><dd className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-white/80">{v || "yok"}</dd></div>)}
        </dl>
        {!a && <p className="mt-3 flex items-center gap-2 text-[12.5px] text-white/55"><Wand2 className="h-3.5 w-3.5" />Karşılaştırma için yapay zekâ modeli gerekir.</p>}
      </Kart>
    </motion.div>
  );
}
