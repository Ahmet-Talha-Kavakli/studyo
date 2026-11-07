"use client";

/**
 * Explainer "Üretilenler": düzenleyici yok. En son video büyük oynar; yanında bilgisi, MP4 indir, büyük izle ve
 * aynı senaryoyu tek tıkla başka stille kurma. Öncekiler altta küçük kareler.
 */

import { forwardRef, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Download, Loader2, Play } from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useExplainer } from "@/store/useExplainer";
import { EX_STILLER, stilPoster } from "@/lib/explainerMotor";
import { Tooltip } from "@/components/ui/Tooltip";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { FavoriDugmesi } from "@/components/galeri/KartEylemleri";
import { KlasoreTasiDugmesi } from "@/components/galeri/Klasorler";
import { UretimGoruntuleyici } from "@/components/studyo/UretimGoruntuleyici";
import { EX_ARAC, explainerVideoUret } from "./exVideo";


export const ExUretilenler = forwardRef<HTMLElement, { onTumu: () => void }>(function ExUretilenler({ onTumu }, ref) {
  const uretimler = useProjeler((s) => s.uretimler);
  const projeler = useExplainer((s) => s.projeler);
  const favoriToggle = useProjeler((s) => s.favoriToggle);
  const liste = useMemo(() => uretimler.filter((u) => u.arac === EX_ARAC), [uretimler]);
  const [acik, setAcik] = useState<Uretim | null>(null);
  const son = liste[0];
  if (!son) return null;
  const bitti = son.durum === "tamam", kapak = saltUrl(son.gorselUrl) ?? son.meta?.gorselUrl;
  const oran = (son.meta?.oran as string) ?? "16:9";
  const dikey = oran === "9:16", kare = oran === "1:1";
  const calisiyor = liste.some((u) => u.durum === "isleniyor");
  const proje = projeler.find((p) => p.id === son.meta?.kaynakId);
  const sahneler = (proje?.sahneler ?? []).filter((x) => x.baslik?.trim() || x.anlatim?.trim());
  const sureSn = (son.meta?.sure as string | undefined)?.replace(/[^\d.]/g, "");
  const sure = sureSn ? (Number(sureSn) < 60 ? `${Math.round(Number(sureSn))} sn` : `${Math.floor(Number(sureSn) / 60)}:${String(Math.round(Number(sureSn) % 60)).padStart(2, "0")} dk`) : "";

  const baskaStil = (tohum: string) => {
    const kaynak = son.meta?.kaynakId as string | undefined;
    const st = useExplainer.getState();
    if (!kaynak || !st.projeler.some((p) => p.id === kaynak)) return void toast.error("Senaryo bulunamadı", { description: "Bu videonun senaryosu silinmiş. Konuyu yeniden yazıp oluştur." });
    const yeni = st.cogalt(kaynak); if (!yeni) return;
    const ad = st.projeler.find((p) => p.id === kaynak)?.ad ?? "Explainer";
    st.guncelle(yeni, { ad }); st.ayarGuncelle(yeni, { stil: tohum, muzikUrl: undefined, muzikAnahtar: undefined });
    void explainerVideoUret(yeni);
  };

  const goreli = (t: number) => { const d = (Date.now() - t) / 1000; return d < 60 ? "az önce" : d < 3600 ? `${Math.floor(d / 60)} dk önce` : d < 86400 ? `${Math.floor(d / 3600)} sa önce` : new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }); };
  const digerStiller = EX_STILLER.filter((x) => x.ad !== son.meta?.stilAd).slice(0, 6);
  const oncekiler = liste.slice(1, 12);

  const bilgiSatiri = [son.meta?.stilAd, oran, sure, sahneler.length ? `${sahneler.length} sahne` : "", goreli(son.olusturma)].filter(Boolean).join(" · ");
  const kucukBtn = "group relative block overflow-hidden rounded-[10px] ring-1 ring-inset ring-white/[0.1] transition hover:-translate-y-0.5 hover:ring-white/45";

  return (
    <section ref={ref} className="scroll-mt-4 overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:p-5 max-sm:p-3">
        <button onClick={() => bitti && setAcik(son)} className="group relative block aspect-video w-full overflow-hidden rounded-[18px] bg-black ring-1 ring-inset ring-white/[0.08]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {kapak && (dikey || kare) && <img src={kapak} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />}
          <span className={cn("absolute inset-0 flex items-center justify-center", (dikey || kare) && "p-4")}>
            <span className={cn("relative block h-full overflow-hidden", dikey ? "aspect-[9/16] rounded-[12px]" : kare ? "aspect-square rounded-[12px]" : "w-full")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {kapak && <img src={kapak} alt="" className={cn("absolute inset-0 h-full w-full object-cover", !bitti && "opacity-50 blur-[2px]")} />}
              {bitti && son.videoUrl && <video key={son.videoUrl} src={son.videoUrl} poster={kapak} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
            </span>
          </span>
          {!bitti && (
            <span className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/85 to-transparent px-4 pb-4 pt-10 text-left">
              {son.durum === "hata" ? <AlertTriangle className="h-5 w-5 shrink-0 text-rose-300" /> : <Loader2 className="h-5 w-5 shrink-0 animate-spin text-white" />}
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between text-[13px] font-semibold text-white"><span>{son.durum === "hata" ? "Kurulamadı" : "Video kuruluyor"}</span>{son.durum !== "hata" && <span className="tabular-nums text-white/70">yüzde {Math.round(son.ilerleme ?? 0)}</span>}</span>
                {son.durum !== "hata" && <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/20"><motion.span className="block h-full rounded-full bg-white" animate={{ width: `${Math.max(3, son.ilerleme ?? 0)}%` }} transition={{ duration: 0.4 }} /></span>}
              </span>
            </span>
          )}
        </button>

        <div className="flex min-w-0 flex-col py-1">
          <span className="text-[12px] font-medium text-metin-3">Son explainer</span>
          <p className="mt-1 line-clamp-2 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-metin">{son.baslik}</p>
          <p className="mt-2 text-[13px] tabular-nums text-metin-2">{bilgiSatiri}</p>
          {son.durum === "hata" && <p className="mt-2 text-[13px] text-rose-200/90">{son.hata ?? "Video kurulamadı."}</p>}
          {bitti && (
            <div className="mt-5 flex flex-wrap gap-2">
              <IndirDugmesi u={son} side="top" yerlesim="alt-sol" className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition active:scale-95"><Download className="h-4 w-4" />İndir</IndirDugmesi>
              <button onClick={() => setAcik(son)} className="flex h-11 items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[14px] font-medium text-metin transition hover:bg-white/[0.13] active:scale-95"><Play className="h-4 w-4 fill-current" />Büyük izle</button>
              <FavoriDugmesi favori={!!son.favori} onClick={() => favoriToggle(son.id)} side="top" className="!h-11 !w-11 !bg-white/[0.08] hover:!bg-white/[0.13]" />
              <Tooltip label="Klasöre taşı" side="top"><KlasoreTasiDugmesi uretimIdler={[son.id]} etiketSinif="sr-only" yerlesim="alt-sol" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-metin transition hover:bg-white/[0.13] active:scale-95" /></Tooltip>
            </div>
          )}

          <div className="mt-auto space-y-4 pt-6">
            {bitti && digerStiller.length > 0 && (
              <div>
                <p className="mb-2 text-[12.5px] font-medium text-metin-2">Başka stille kur</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {digerStiller.map((x) => (
                    <Tooltip key={x.tohum} side="top" label={`${x.ad} ile kur`}>
                      <button onClick={() => baskaStil(x.tohum)} disabled={calisiyor} aria-label={`${x.ad} ile kur`} className={cn(kucukBtn, "aspect-square w-full disabled:opacity-40")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={stilPoster(x.tohum)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
            {oncekiler.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between"><p className="text-[12.5px] font-medium text-metin-2">Öncekiler</p>{liste.length > 2 && <button onClick={onTumu} className="text-[12.5px] font-medium text-metin-2 transition hover:text-metin">Tümünü gör</button>}</div>
                <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
                  {oncekiler.map((u) => {
                    const kp = saltUrl(u.gorselUrl) ?? u.meta?.gorselUrl;
                    return (
                      <Tooltip key={u.id} side="top" label={u.baslik}>
                        <button onClick={() => u.durum === "tamam" && setAcik(u)} aria-label={u.baslik} className={cn(kucukBtn, "aspect-video h-14 shrink-0 bg-black")}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {kp && <img src={kp} alt="" className={cn("absolute inset-0 h-full w-full object-cover", u.durum !== "tamam" && "opacity-40")} />}
                          {u.durum === "isleniyor" && <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />}
                          {u.durum === "hata" && <AlertTriangle className="absolute inset-0 m-auto h-4 w-4 text-rose-300" />}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {acik && <UretimGoruntuleyici key="detay" u={liste.find((x) => x.id === acik.id) ?? acik} liste={liste.filter((x) => x.durum === "tamam")} onSec={(id) => { const u = liste.find((x) => x.id === id); if (u) setAcik(u); }} onKapat={() => setAcik(null)} />}
      </AnimatePresence>
    </section>
  );
});
