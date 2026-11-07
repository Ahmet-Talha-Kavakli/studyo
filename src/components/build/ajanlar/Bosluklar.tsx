"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookPlus, CheckCircle2, Loader2, SearchX, Sparkles } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { alanSinif } from "./AjanDuzenleyici";
import { BosDurum, TON_SINIF, birincil, ikincil, type Ajan } from "./ortak";

type Bosluk = { anahtar: string; soru: string; ornekler: string[]; sayi: number; nedenler: string[]; son: number };

/** İçerik boşlukları: ajanın yanıtlayamadığı sorular; yanıtı yaz (ya da yapay zekâ önersin), tek tıkla bilgiye ekle. */
export function Bosluklar({ ajanId, gun, guncel }: { ajanId: string; gun: number; guncel: (a: Ajan) => void }) {
  const [v, setV] = useState<{ bosluklar: Bosluk[]; konusma: number } | null>(null);
  const [acik, setAcik] = useState<string | null>(null);
  const [yanit, setYanit] = useState("");
  const [gidiyor, setGidiyor] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [eklenen, setEklenen] = useState<Set<string>>(new Set());
  const yukle = useCallback(() => api<{ bosluklar: Bosluk[]; konusma: number }>(`/api/build/ajanlar/${ajanId}/bosluklar?gun=${gun}`).then(setV).catch(() => setV({ bosluklar: [], konusma: 0 })), [ajanId, gun]);
  useEffect(() => { yukle(); }, [yukle]);
  const oner = async (b: Bosluk) => {
    setGidiyor("oner"); setMesaj("");
    try { const r = await api<{ yanit?: string; modelYok?: boolean }>(`/api/build/ajanlar/${ajanId}/bosluklar`, { govde: { islem: "oner", soru: b.soru } }); if (r.modelYok) setMesaj("Bağlı bir model yok; yanıtı kendin yaz."); else setYanit(r.yanit ?? ""); }
    catch (e) { setMesaj(e instanceof ApiHatasi ? e.message : "Önerilemedi."); } finally { setGidiyor(""); }
  };
  const ekle = async (b: Bosluk) => {
    setGidiyor("ekle"); setMesaj("");
    try { const r = await api<{ ajan: Ajan }>(`/api/build/ajanlar/${ajanId}/bosluklar`, { govde: { islem: "ekle", soru: b.soru, yanit } }); guncel(r.ajan); setEklenen((x) => new Set(x).add(b.anahtar)); setAcik(null); setYanit(""); }
    catch (e) { setMesaj(e instanceof ApiHatasi ? e.message : "Eklenemedi."); } finally { setGidiyor(""); }
  };
  const l = (v?.bosluklar ?? []).filter((b) => !eklenen.has(b.anahtar));
  return (
    <Kart ikon={SearchX} baslik="Yanıtlayamadığı sorular" alt="Bilgisi eksik kalan konular; yanıtı ekle, ajan bir dahakine kaynağından yanıtlasın"
      sag={l.length ? <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] tabular-nums text-white/55">{l.length} konu</span> : undefined}
      altSerit={eklenen.size ? <><CheckCircle2 className="h-3.5 w-3.5 text-[#8be6ff]" /><span className="flex-1 text-[12.5px] text-white/60">{eklenen.size} yanıt "Gelen kutusundan sık sorulanlar" kaynağına eklendi; yayınlayınca ziyaretçilere gelir.</span></> : undefined}>
      {!v ? <div className="h-28 animate-pulse" /> : !l.length ? (
        <BosDurum ikon={CheckCircle2} baslik="Boşluk bulunmadı" alt={v.konusma ? "Bu dönemde ajanın yanıtlayamadığı, yararlı bulunmayan ya da insana devredilen bir soru yok." : "Ziyaretçi konuşmaları geldikçe ajanın yanıtlayamadığı sorular burada sıralanır."} />
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {l.map((b) => (
            <div key={b.anahtar} className="px-4 py-3 sm:px-5">
              <div className="flex items-start gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] leading-snug text-white">{b.soru}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-white/45">
                    <span className={cn("rounded-full px-2 py-0.5 font-medium tabular-nums", TON_SINIF.bekliyor)}>{b.sayi} konuşma</span>
                    {b.nedenler.map((n) => <span key={n} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-white/60">{n}</span>)}
                    <span>{gorece(b.son)}</span>
                  </span>
                </span>
                {acik !== b.anahtar && <button type="button" onClick={() => { setAcik(b.anahtar); setYanit(""); setMesaj(""); }} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><BookPlus className="h-3.5 w-3.5" />Yanıt ekle</button>}
              </div>
              <AnimatePresence initial={false}>
                {acik === b.anahtar && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-2.5 space-y-2">
                      {b.ornekler.length > 1 && <p className="text-[12px] leading-relaxed text-white/45">Benzer sorular: {b.ornekler.slice(1).join(" · ")}</p>}
                      <textarea value={yanit} onChange={(e) => setYanit(e.target.value)} rows={3} maxLength={3000} placeholder="Doğru yanıtı yaz; ajan bu soruyu bir dahakine buradan yanıtlar" className={cn(alanSinif, "resize-y py-2.5 text-[13px] leading-relaxed")} />
                      {mesaj && <p className="text-[12px] text-amber-200/90">{mesaj}</p>}
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => oner(b)} disabled={!!gidiyor} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>{gidiyor === "oner" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-[#8be6ff]" />}Yapay zekâ önersin</button>
                        <span className="flex-1" />
                        <button type="button" onClick={() => setAcik(null)} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Vazgeç</button>
                        <button type="button" onClick={() => ekle(b)} disabled={!yanit.trim() || !!gidiyor} className={cn(birincil, "h-8 px-3 text-[12.5px]")}>{gidiyor === "ekle" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Bilgiye ekle</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </Kart>
  );
}
