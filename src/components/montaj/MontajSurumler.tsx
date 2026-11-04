"use client";

import { useState } from "react";
import { Save, RotateCcw, Trash2, Clock, History } from "lucide-react";
import { useMontaj, type MontajProje } from "@/store/useMontaj";
import { surumKaydet, surumYukle, kisaSure } from "./ortak";

const zaman = (t: number) => {
  const d = (Date.now() - t) / 1000;
  if (d < 60) return "az önce";
  if (d < 3600) return `${Math.floor(d / 60)} dk önce`;
  if (d < 86400) return `${Math.floor(d / 3600)} sa önce`;
  return new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
};

/** Sürümler: projenin adlandırılmış anlık kopyalarını saklar, geri yükler (geri alınabilir). */
export function MontajSurumler({ proje, sade }: { proje: MontajProje; sade?: boolean }) {
  const [ad, setAd] = useState("");
  const l = proje.surumler ?? [];
  return (
    <div className={sade ? "w-full" : "w-[340px] max-w-full"}>
      {!sade && <div className="flex items-center gap-3 border-b border-white/[0.06] px-3.5 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><History className="h-4 w-4 text-white" /></span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[14.5px] font-semibold text-metin">Sürümler</span><span className="mt-0.5 block text-[12px] text-metin-3">Ctrl+S ile hızlı kaydet · en çok 12</span></span>
        {l.length > 0 && <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-white/75">{l.length}</span>}
      </div>}
      <div className={sade ? "px-4 pb-4" : "p-3"}>
        <form onSubmit={(e) => { e.preventDefault(); surumKaydet(proje.id, ad); setAd(""); }} className="flex gap-1.5">
          <input value={ad} onChange={(e) => setAd(e.target.value.slice(0, 40))} placeholder={`Sürüm ${l.length + 1}`} aria-label="Sürüm adı"
            className="h-10 min-w-0 flex-1 rounded-full bg-white/[0.08] px-4 text-[13px] text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-2 focus:ring-white/30" />
          <button type="submit" className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]"><Save className="h-3.5 w-3.5" />Kaydet</button>
        </form>
        {l.length ? (
          <div className="mt-3 max-h-[320px] divide-y divide-white/[0.05] overflow-y-auto rounded-[14px] ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]" style={{ background: "rgba(255,255,255,0.03)" }}>
            {l.map((s, i) => (
              <div key={s.id} className="group flex items-center gap-2.5 px-3 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-[11.5px] font-semibold tabular-nums text-metin-2">{l.length - i}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-metin">{s.ad}</span>
                  <span className="block text-[11.5px] tabular-nums text-metin-3">{zaman(s.tarih)} · {kisaSure(s.sure)} · {s.katmanlar.reduce((a, k) => a + k.klipler.length, 0)} klip</span>
                </span>
                <button onClick={() => useMontaj.getState().projeGuncelle(proje.id, { surumler: l.filter((x) => x.id !== s.id) })} aria-label="Sürümü sil" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-3 opacity-0 transition hover:bg-white/[0.08] hover:text-rose-300 focus:opacity-100 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => surumYukle(proje.id, s.id)} aria-label={`${s.ad} sürümüne dön`} className="flex h-8 items-center gap-1 rounded-full bg-white/[0.08] px-3 text-[12px] font-medium text-white transition hover:bg-white/[0.14] active:scale-95"><RotateCcw className="h-3 w-3" />Dön</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3 rounded-[14px] px-3 py-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><Clock className="h-3.5 w-3.5 text-metin-2" /></span>
            <span className="text-[12.5px] leading-snug text-metin-2">Büyük bir değişiklikten önce kaydet, istediğin an geri dön.</span>
          </div>
        )}
      </div>
    </div>
  );
}
