"use client";

import { useCallback, useEffect, useState } from "react";
import { Brain, Check, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Anahtar, Secici, alanSinif } from "./AjanDuzenleyici";
import { AyarSatiri, BosDurum, ikincil, type Ajan } from "./ortak";

type Not = { id: string; metin: string; zaman: number; guncelleme?: number };
type Gorunum = { acik: boolean; ziyaretci: boolean; ortak: Not[]; ziyaretciler: { ziyaretci: string; etiket: string; notlar: Not[] }[] };

function NotSatiri({ n, kaydet, sil }: { n: Not; kaydet: (m: string) => Promise<void>; sil: () => void }) {
  const [duz, setDuz] = useState(false);
  const [m, setM] = useState(n.metin);
  useEffect(() => setM(n.metin), [n.metin]);
  return (
    <div className="group flex items-start gap-3 px-4 py-2.5 sm:px-5">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#55d6fd]" />
      {duz ? (
        <form className="flex min-w-0 flex-1 items-center gap-1.5" onSubmit={async (e) => { e.preventDefault(); await kaydet(m); setDuz(false); }}>
          <input autoFocus value={m} onChange={(e) => setM(e.target.value)} maxLength={400} className={cn(alanSinif, "h-9 text-[13px]")} />
          <button type="submit" aria-label="Kaydet" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black"><Check className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => { setM(n.metin); setDuz(false); }} aria-label="Vazgeç" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07]"><X className="h-3.5 w-3.5" /></button>
        </form>
      ) : (
        <>
          <span className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-white/80">{n.metin}<span className="ml-2 text-[11.5px] text-white/35">{n.guncelleme ? `düzenlendi ${gorece(n.guncelleme)}` : gorece(n.zaman)}</span></span>
          <button type="button" onClick={() => setDuz(true)} aria-label="Notu düzenle" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/35 hover:bg-white/[0.07] hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={sil} aria-label="Notu sil" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/35 hover:bg-white/[0.07] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
        </>
      )}
    </div>
  );
}

/** Bellek: ortak notlar (sahip ve zamanlamalar yazar) ve ziyaretçiye özel notlar (yalnız o kişiyle kullanılır). */
export function Bellek({ a, d }: { a: Ajan; d: (p: Partial<Ajan>) => void }) {
  const [v, setV] = useState<Gorunum | null>(null);
  const [sekme, setSekme] = useState<"ortak" | "ziyaretci">("ortak");
  const [yeni, setYeni] = useState("");
  const [hata, setHata] = useState("");
  const yukle = useCallback(() => api<Gorunum>(`/api/build/ajanlar/${a.id}/bellek`).then(setV).catch(() => {}), [a.id]);
  useEffect(() => { yukle(); }, [yukle, a.bellek.acik, a.bellek.ziyaretci]);
  const islem = async (g: Record<string, unknown>) => { setHata(""); try { setV(await api<Gorunum>(`/api/build/ajanlar/${a.id}/bellek`, { govde: g })); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yapılamadı."); } };
  const zSayi = v?.ziyaretciler.reduce((t, z) => t + z.notlar.length, 0) ?? 0;
  return (
    <Kart ikon={Brain} baslik="Bellek" alt="Anahtar ortak belleği açar; denemeler ve zamanlı çalışmalar not eder" sag={<Anahtar acik={a.bellek.acik} set={(x) => d({ bellek: { ...a.bellek, acik: x } })} etiket="Ortak belleği aç" />}>
      <div className="divide-y divide-white/[0.05] border-b border-white/[0.06]">
        <AyarSatiri baslik="Ziyaretçiye özel bellek" alt="Herkese açık kanallarda ajan her kişi için ayrı not tutar; bir ziyaretçinin notu başkasına gösterilmez. Hassas bilgi yazılmaz.">
          <Anahtar acik={!!a.bellek.ziyaretci} set={(x) => d({ bellek: { ...a.bellek, ziyaretci: x } })} etiket="Ziyaretçiye özel bellek" />
        </AyarSatiri>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 sm:px-5">
        <Secici id={`bellek-${a.id}`} kucuk deger={sekme} set={setSekme} l={[{ id: "ortak", ad: `Ortak ${v?.ortak.length ?? 0}` }, { id: "ziyaretci", ad: `Ziyaretçiler ${zSayi}` }]} />
        <span className="flex-1" />
        {sekme === "ortak" && !!v?.ortak.length && <button type="button" onClick={() => islem({ islem: "temizle", kapsam: "ortak" })} className="text-[12px] text-rose-300/80 hover:text-rose-200">Hepsini sil</button>}
      </div>
      {!v ? <div className="h-16 animate-pulse" /> : sekme === "ortak" ? (
        <>
          {v.ortak.length ? <div className="divide-y divide-white/[0.04]">{v.ortak.map((n) => <NotSatiri key={n.id} n={n} kaydet={(m) => islem({ islem: "duzenle", id: n.id, metin: m, kapsam: "ortak" })} sil={() => islem({ islem: "sil", id: n.id, kapsam: "ortak" })} />)}</div>
            : <p className="px-4 pb-2 text-[13px] leading-relaxed text-white/50 sm:px-5">{a.bellek.acik ? "Henüz not yok. Ajan öğrendikçe burada görünür; aşağıdan kendin de ekleyebilirsin." : "Bellek kapalı. Açınca ajan tercihleri ve önemli bilgileri kısa notlar olarak saklar."}</p>}
          <form className="flex gap-2 border-t border-white/[0.05] p-4 sm:px-5" onSubmit={(e) => { e.preventDefault(); if (yeni.trim()) { islem({ islem: "ekle", metin: yeni }); setYeni(""); } }}>
            <input value={yeni} onChange={(e) => setYeni(e.target.value)} maxLength={400} placeholder="Elle not ekle: örneğin Raporları tablo olarak ister" className={cn(alanSinif, "h-10 text-[13.5px]")} />
            <button type="submit" disabled={!yeni.trim()} className={ikincil}><Plus className="h-3.5 w-3.5" />Ekle</button>
          </form>
        </>
      ) : !v.ziyaretciler.length ? (
        <BosDurum ikon={UserRound} baslik="Ziyaretçi notu yok" alt={a.bellek.ziyaretci ? "Ziyaretçiler tercihlerini söyledikçe ajan kişiye özel not tutar; burada kişi kişi görünür." : "Ziyaretçiye özel belleği açınca herkese açık kanallardaki her kişi için ayrı notlar burada listelenir."} />
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {v.ziyaretciler.map((z) => (
            <div key={z.ziyaretci}>
              <div className="flex items-center gap-2 px-4 pt-3 sm:px-5"><UserRound className="h-3.5 w-3.5 text-white/45" /><p className="flex-1 truncate text-[12.5px] font-medium text-white/75">{z.etiket}</p><button type="button" onClick={() => islem({ islem: "ziyaretciSil", ziyaretci: z.ziyaretci })} className="text-[12px] text-rose-300/80 hover:text-rose-200">Bu kişinin notlarını sil</button></div>
              <div className="divide-y divide-white/[0.04]">{z.notlar.map((n) => <NotSatiri key={n.id} n={n} kaydet={(m) => islem({ islem: "duzenle", id: n.id, metin: m, kapsam: "ziyaretci" })} sil={() => islem({ islem: "sil", id: n.id, kapsam: "ziyaretci" })} />)}</div>
            </div>
          ))}
        </div>
      )}
      {hata && <p className="px-4 pb-3 text-[12.5px] text-rose-300 sm:px-5">{hata}</p>}
    </Kart>
  );
}
