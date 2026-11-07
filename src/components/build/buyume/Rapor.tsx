"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Copy, Lightbulb, Minus, Trash2, TrendingDown, TrendingUp, Wand2 } from "lucide-react";
import { gorece } from "@/lib/build/istemci";
import type { Rapor } from "@/lib/build/buyumeEkTipler";
import { cn } from "@/lib/utils";
import { birincil, HataSatiri, ikincil, Kart, Rozet, simgeDugme, Suruyor, turkceTarih, useKopyala } from "./ortak";
import type { BolumProps } from "./BuyumeSekme";

const md = (r: Rapor) => [`# Haftalık büyüme raporu: ${r.bas} ile ${r.bit}`, "", ...r.metrikler.map((m) => `- ${m.ad}: ${m.simdi.toLocaleString("tr-TR")} (önceki hafta ${m.once.toLocaleString("tr-TR")})`), "", "## Öne çıkanlar", ...r.oneCikanlar.map((x) => `- ${x}`), ...(r.yorum ? ["", "## Yorum", r.yorum.ozet, "", "## Bu hafta yapılacaklar", ...r.yorum.oneriler.map((x) => `- ${x}`)] : [])].join("\n");

export function RaporBolumu({ e }: BolumProps) {
  const d = e.d!;
  const [secili, setSecili] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [uyari, setUyari] = useState("");
  const [kopya, kopyala] = useKopyala();
  const r = d.ek.raporlar.find((x) => x.id === secili) ?? d.ek.raporlar[0] ?? null;
  const hazirla = async () => { setHata(""); setUyari(""); try { const j = await e.islem("rapor"); setSecili(String(j.raporId)); if (j.uyari) setUyari(String(j.uyari)); } catch (x) { setHata(x instanceof Error ? x.message : "Hazırlanamadı."); } };
  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex items-center gap-2">Haftalık büyüme raporu{r && <Rozet>{turkceTarih(r.bas, { day: "numeric", month: "short" })} ile {turkceTarih(r.bit, { day: "numeric", month: "short" })}</Rozet>}</span>}
        aciklama="Son 7 gün önceki 7 günle: ziyaret, kanallar, kampanyalar, formlar, yeni kişiler, e-posta, kısa bağlantılar, paylaşılan gönderiler, ödenen siparişler ve çalışan denemeler. Sayılar ölçümden gelir; yorum ve öneriyi ajan yazar."
        sag={<>{r && <button type="button" onClick={() => kopyala("md", md(r))} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Copy className="h-3.5 w-3.5" />{kopya === "md" ? "Kopyalandı" : "Metin olarak kopyala"}</button>}<button type="button" disabled={e.suruyor("rapor")} onClick={hazirla} className={cn(birincil, "h-8 px-3 text-[12.5px]")}>{e.suruyor("rapor") ? <span className="build-nokta" /> : <Wand2 className="h-3.5 w-3.5" />}{r ? "Yeni rapor" : "Raporu hazırla"}</button></>} />
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {uyari && <p className="rounded-[12px] bg-amber-400/[0.06] px-3 py-2 text-[12.5px] text-amber-100/90 ring-1 ring-inset ring-amber-300/15">{uyari}</p>}
      {e.suruyor("rapor") && <Suruyor metin="Rapor hazırlanıyor" alt="Analitik, gelen kutusu, kişiler, kampanyalar ve siparişler okunuyor." />}
      {!r && !e.suruyor("rapor") && (
        <Kart><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#55d6fd]/[0.08] ring-1 ring-inset ring-[#55d6fd]/20"><BarChart3 className="h-5 w-5 text-[#8be6ff]" /></span><div className="min-w-[200px] flex-1"><p className="text-[14px] font-semibold text-white">İlk raporunu hazırla</p><p className="mt-0.5 text-[12.5px] text-white/55">Her pazartesi yeniden hazırla; geçmiş raporlar burada kalır.</p></div><button type="button" onClick={hazirla} className={birincil}>Hazırla</button></div></Kart>
      )}
      {r && (
        <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {r.metrikler.map((m) => {
              const fark = m.once ? Math.round(((m.simdi - m.once) / m.once) * 100) : null;
              const I = fark === null || fark === 0 ? Minus : fark > 0 ? TrendingUp : TrendingDown;
              return (
                <div key={m.id} className="rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.08]">
                  <p className="text-[12px] text-white/50">{m.ad}</p>
                  <p className="mt-1 text-[22px] font-semibold tabular-nums tracking-[-0.02em] text-white">{m.simdi.toLocaleString("tr-TR")}</p>
                  <p className={cn("mt-0.5 flex items-center gap-1 text-[12px] tabular-nums", fark === null ? "text-white/40" : fark > 0 ? "text-[#8be6ff]" : fark < 0 ? "text-rose-200" : "text-white/50")}><I className="h-3.5 w-3.5" />{fark === null ? (m.simdi ? "önceki hafta yok" : "veri yok") : `yüzde ${Math.abs(fark)}, önceki ${m.once.toLocaleString("tr-TR")}`}</p>
                </div>
              );
            })}
          </div>
          {r.yorum && (
            <Kart baslik={<span className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-[#8be6ff]" />Yorum ve bu haftanın işleri</span>} aciklama={r.model ? `${r.model} yazdı` : undefined}>
              <p className="text-[13.5px] leading-relaxed text-white/80">{r.yorum.ozet}</p>
              <ol className="mt-3 space-y-2">{r.yorum.oneriler.map((x, i) => <li key={x} className="flex gap-2.5 text-[13px] leading-relaxed text-white/85"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#55d6fd]/[0.12] text-[11px] font-semibold text-[#8be6ff]">{i + 1}</span>{x}</li>)}</ol>
            </Kart>
          )}
          <Kart baslik="Öne çıkanlar"><ul className="space-y-1.5">{r.oneCikanlar.map((x) => <li key={x} className="flex gap-2 text-[13px] leading-relaxed text-white/80"><span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#55d6fd]" />{x}</li>)}{!r.oneCikanlar.length && <li className="text-[12.5px] text-white/50">Bu hafta ölçülen bir hareket yok.</li>}</ul></Kart>
          <div className="grid gap-4 lg:grid-cols-3">
            {([["Kanallar", r.kanallar], ["Kampanyalar", r.kampanyalar], ["Sayfalar", r.sayfalar]] as const).map(([b, l]) => { const en = Math.max(1, ...l.map((x) => x.adet)); return (
              <Kart key={b} baslik={b}>{l.length ? <ul className="space-y-2">{l.map((x) => <li key={x.ad}><div className="flex justify-between gap-2 text-[12.5px]"><span className="truncate text-white/80">{x.ad}</span><span className="tabular-nums text-white">{x.adet.toLocaleString("tr-TR")}</span></div><span className="mt-1 block h-1.5 rounded-full bg-white/[0.05]"><motion.span initial={{ width: 0 }} animate={{ width: `${(x.adet / en) * 100}%` }} className="block h-full rounded-full bg-[#1e9fcf]" /></span></li>)}</ul> : <p className="text-[12.5px] text-white/45">Veri yok.</p>}</Kart>
            ); })}
          </div>
        </motion.div>
      )}
      {d.ek.raporlar.length > 1 && (
        <Kart baslik="Geçmiş raporlar">
          <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            {d.ek.raporlar.map((x) => <li key={x.id} className={cn("flex items-center gap-3 px-3.5 py-2.5", r?.id === x.id && "bg-white/[0.04]")}><button type="button" onClick={() => setSecili(x.id)} className="min-w-0 flex-1 text-left"><span className="block text-[13px] text-white">{turkceTarih(x.bas, { day: "numeric", month: "long" })} ile {turkceTarih(x.bit, { day: "numeric", month: "long" })}</span><span className="block text-[11.5px] text-white/45">{gorece(x.olusturma)}, {x.metrikler.find((m) => m.id === "ziyaretci")?.simdi ?? 0} ziyaretçi</span></button><button type="button" onClick={() => e.duzenle("raporSil", { id: x.id }).catch(() => {})} className={simgeDugme} aria-label="Raporu sil"><Trash2 className="h-3.5 w-3.5" /></button></li>)}
          </ul>
        </Kart>
      )}
    </div>
  );
}
