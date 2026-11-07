"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Accessibility, ChevronDown, Crosshair, Gauge, Loader2, RotateCw, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const yay = { type: "spring" as const, stiffness: 460, damping: 38 };

export type DenetimBulgu = { id: string; kategori: "erisim" | "performans"; onem: "yuksek" | "orta" | "dusuk"; baslik: string; aciklama: string; sayi: number; ornekler: { secici: string; etiket: string; metin: string }[]; ipucu?: string };
export type DenetimSonuc = { bulgular: DenetimBulgu[]; olcum: { istek: number; boyut: number; yukleme: number; icerik: number; lcp: number | null; cls: number; oge: number }; genislik: number; sayfa: string; zaman: number };

const AGIRLIK = { yuksek: 14, orta: 7, dusuk: 3 } as const;
const ONEM_AD = { yuksek: "Önemli", orta: "Orta", dusuk: "Küçük" } as const;

/** Puan: 100'den bulgu başına ağırlık (aynı türde çok örnek varsa biraz daha) düşülür; performansa ölçümler de katılır. */
export function puanla(s: DenetimSonuc) {
  const p = (kat: DenetimBulgu["kategori"]) => {
    let x = 100;
    for (const b of s.bulgular.filter((b) => b.kategori === kat)) x -= AGIRLIK[b.onem] * (1 + Math.min(b.sayi - 1, 4) * 0.2);
    if (kat === "performans") {
      const { lcp, cls, boyut } = s.olcum;
      if (lcp && lcp > 4000) x -= 18; else if (lcp && lcp > 2500) x -= 8;
      if (cls > 0.25) x -= 18; else if (cls > 0.1) x -= 8;
      if (boyut > 5_000_000) x -= 10;
    }
    return Math.max(0, Math.min(100, Math.round(x)));
  };
  return { erisim: p("erisim"), performans: p("performans") };
}

function Halka({ puan, ad, ikon: I }: { puan: number; ad: string; ikon: typeof Gauge }) {
  const renk = puan >= 90 ? "#6ee7a0" : puan >= 60 ? "#fbbf24" : "#fb7185";
  const c = 2 * Math.PI * 26;
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5 rounded-[16px] bg-white/[0.03] py-3 ring-1 ring-inset ring-white/[0.07]">
      <div className="relative h-[64px] w-[64px]">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90"><circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <motion.circle cx="32" cy="32" r="26" fill="none" stroke={renk} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - puan / 100) }} transition={{ duration: 0.9, ease: "easeOut" }} /></svg>
        <span className="absolute inset-0 flex items-center justify-center text-[17px] font-semibold tabular-nums" style={{ color: renk }}>{puan}</span>
      </div>
      <span className="flex items-center gap-1 text-[12px] text-white/70"><I className="h-3.5 w-3.5" />{ad}</span>
    </div>
  );
}

const kb = (n: number) => (n > 1_000_000 ? `${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MB` : `${Math.round(n / 1000)} KB`);
const sn = (ms: number | null) => (ms == null ? "ölçülemedi" : `${(ms / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sn`);

/**
 * Erişilebilirlik ve performans denetimi (Lighthouse benzeri, tarayıcıda, kredisiz). Önizlemedeki sayfayı o anki cihaz
 * genişliğinde tarar; her bulgu örnek öğeleriyle gelir, "Göster" öğeyi vurgular, "Düzelt" ajana ayrıntılı istek gönderir.
 */
export function DenetimPaneli({ sonuc, taraniyor, tara, goster, duzelt, kapat, cihaz }: {
  sonuc: DenetimSonuc | null; taraniyor: boolean; tara: () => void; goster: (secici: string) => void; duzelt: (metin: string) => void; kapat: () => void; cihaz: string;
}) {
  const [suzgec, setSuzgec] = useState<"hepsi" | "erisim" | "performans">("hepsi");
  const [acik, setAcik] = useState<string | null>(null);
  useEffect(() => { if (!sonuc && !taraniyor) tara(); }, [sonuc, taraniyor, tara]);
  const puan = useMemo(() => (sonuc ? puanla(sonuc) : null), [sonuc]);
  const l = useMemo(() => (sonuc?.bulgular ?? []).filter((b) => suzgec === "hepsi" || b.kategori === suzgec).sort((a, b) => AGIRLIK[b.onem] - AGIRLIK[a.onem]), [sonuc, suzgec]);
  const metin = (b: DenetimBulgu) => `${b.baslik} (${b.sayi} yerde, ${sonuc?.sayfa}): ${b.aciklama} ${b.ipucu ?? ""}${b.ornekler.length ? ` Örnek öğeler: ${b.ornekler.map((o) => `<${o.etiket}> ${o.metin ? `"${o.metin}" ` : ""}(seçici: ${o.secici})`).join("; ")}` : ""}`;

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={yay}
      className="absolute bottom-3 right-3 top-3 z-20 flex w-[330px] flex-col overflow-hidden rounded-[20px] bg-[#17181b] ring-1 ring-inset ring-white/[0.1] max-sm:inset-x-2 max-sm:top-auto max-sm:h-[70%] max-sm:w-auto">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <div className="min-w-0 flex-1"><p className="text-[13.5px] font-semibold text-white">Denetim</p><p className="truncate text-[11.5px] text-white/50">{sonuc ? `${sonuc.sayfa === "index.html" ? "Ana sayfa" : sonuc.sayfa} · ${cihaz} · ${sonuc.genislik} piksel` : "Sayfa taranıyor"}</p></div>
        <button type="button" title="Yeniden tara" aria-label="Yeniden tara" disabled={taraniyor} onClick={tara} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white disabled:opacity-40">{taraniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}</button>
        <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
        {!sonuc ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /><p className="text-[12.5px] text-white/55">Erişilebilirlik ve hız ölçülüyor</p></div>
        ) : (
          <>
            <div className="flex gap-2">
              <Halka puan={puan!.erisim} ad="Erişilebilirlik" ikon={Accessibility} />
              <Halka puan={puan!.performans} ad="Performans" ikon={Gauge} />
            </div>
            <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-[14px] bg-white/[0.03] px-3 py-2.5 text-[12px] ring-1 ring-inset ring-white/[0.07]">
              {([["En büyük içerik", sn(sonuc.olcum.lcp)], ["Düzen kayması", sonuc.olcum.cls.toLocaleString("tr-TR")], ["Sayfa hazır", sn(sonuc.olcum.icerik || null)], ["İndirilen", kb(sonuc.olcum.boyut)], ["İstek", String(sonuc.olcum.istek)], ["Öğe", String(sonuc.olcum.oge)]] as const).map(([a, v]) => (
                <div key={a} className="flex items-center justify-between gap-2"><dt className="text-white/50">{a}</dt><dd className="tabular-nums text-white/85">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-1.5 px-1 text-[11px] leading-snug text-white/40">Ölçümler önizlemede, bu bilgisayarda alındı; yayındaki gerçek ziyaretçi hızları Bulut analitiğinde.</p>

            <div className="mt-3 flex items-center gap-1">
              {([["hepsi", "Hepsi"], ["erisim", "Erişilebilirlik"], ["performans", "Performans"]] as const).map(([v, a]) => {
                const n = (sonuc.bulgular ?? []).filter((b) => v === "hepsi" || b.kategori === v).length;
                return <button key={v} type="button" onClick={() => setSuzgec(v)} className={cn("h-7 rounded-full px-2.5 text-[12px] transition-colors", suzgec === v ? "bg-white text-black" : "bg-white/[0.05] text-white/65 hover:text-white")}>{a} <span className="tabular-nums opacity-60">{n}</span></button>;
              })}
            </div>

            <div className="mt-2.5 space-y-1.5">
              {!l.length && <div className="rounded-[14px] bg-emerald-400/[0.06] px-3 py-3 text-[12.5px] text-emerald-100/85 ring-1 ring-inset ring-emerald-300/15">Bu bölümde sorun bulunmadı.</div>}
              {l.map((b) => (
                <div key={b.id} className="rounded-[14px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
                  <button type="button" onClick={() => setAcik(acik === b.id ? null : b.id)} className="flex w-full items-start gap-2 px-3 py-2.5 text-left">
                    <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", b.onem === "yuksek" ? "bg-rose-400" : b.onem === "orta" ? "bg-amber-300" : "bg-sky-300")} />
                    <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-medium leading-snug text-white">{b.baslik}</span><span className="text-[11px] text-white/45">{ONEM_AD[b.onem]} · {b.kategori === "erisim" ? "Erişilebilirlik" : "Performans"}{b.sayi > 1 ? ` · ${b.sayi} yerde` : ""}</span></span>
                    <ChevronDown className={cn("mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40 transition-transform", acik === b.id && "rotate-180")} />
                  </button>
                  {acik === b.id && (
                    <div className="space-y-2 px-3 pb-3 pl-7">
                      <p className="text-[12px] leading-relaxed text-white/60">{b.aciklama}</p>
                      {b.ipucu && <p className="text-[12px] leading-relaxed text-white/75">{b.ipucu}</p>}
                      {b.ornekler.map((o) => (
                        <button key={o.secici} type="button" onClick={() => goster(o.secici)} className="flex w-full items-center gap-1.5 rounded-[9px] bg-white/[0.04] px-2 py-1.5 text-left text-[11.5px] text-white/65 hover:bg-white/[0.08] hover:text-white">
                          <Crosshair className="h-3 w-3 shrink-0" /><span className="shrink-0">{o.etiket}</span><span className="truncate text-white/40">{o.metin}</span>
                        </button>
                      ))}
                      <button type="button" onClick={() => duzelt(`Denetimde bulunan şu sorunu düzelt: ${metin(b)}`)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold text-black"><Wand2 className="h-3.5 w-3.5" />Düzelt</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {!!l.length && (
        <div className="border-t border-white/[0.06] p-3">
          <button type="button" onClick={() => duzelt(`Erişilebilirlik ve performans denetiminde bulunan şu sorunların hepsini düzelt:\n${l.map((b, i) => `${i + 1}. ${metin(b)}`).join("\n")}`)} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black"><Wand2 className="h-3.5 w-3.5" />Hepsini düzelt ({l.length})</button>
        </div>
      )}
    </motion.div>
  );
}
