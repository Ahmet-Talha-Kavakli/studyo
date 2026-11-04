"use client";

import { Check, Copy, Download, Heart, Pause, Play, RotateCcw, Trash2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Uretim } from "@/store/useProjeler";
import { SESLER } from "@/lib/sesVeri";
import { sesCalici, useCalici, sureYaz } from "@/lib/sesCalici";
import { uretimKaynagi } from "./SesGoruntuleyici";
import { Dalga, SesAvatar } from "./ortak";

const MOD_AD: Record<string, string> = { seslendirme: "Seslendirme", diyalog: "Diyalog", efekt: "Ses efekti", sesdegistir: "Ses değiştirme", ceviri: "Çeviri" };

/** Üretimlerim kartı — ses küresi + oynat, başlık, bilgi, tam genişlikte dalga formu, eylemler. */
export function SesSatiri({ u, secili, onSecim, onAc, onBegen, onIndir, onAyar, onYenidenDene, onSil, kompakt }: {
  u: Uretim; secili: boolean;
  onSecim: () => void; onAc: () => void; onBegen: () => void; onIndir: () => void; onAyar: () => void; onYenidenDene: () => void; onSil: () => void;
  /** Mobil şerit: dalga formu ve eylemler gizlenir. */
  kompakt?: boolean;
}) {
  const cal = useCalici();
  const bitti = u.durum === "tamam";
  const hata = u.durum === "hata";
  const kaynak = bitti ? uretimKaynagi(u) : null;
  const benim = cal.id === u.id;
  const calisiyor = benim && cal.calisiyor;
  const oran = benim && cal.toplam ? cal.an / cal.toplam : 0;
  const m = u.meta;
  const ses = SESLER.find((s) => s.ad === m?.ses);
  const renk = ses?.renk ?? (m?.ses ? "#8b7bff" : "#55d6fd");
  // Ton etiketleri ([whispers] gibi) modele talimattır, okunan metnin parçası değil.
  const baslik = m?.mod === "diyalog" || m?.mod === "efekt" ? u.baslik
    : (((m?.hamIstem as string | undefined) ?? "").replace(/\[[a-z ]{2,20}\]\s*/gi, "").replace(/<break[^>]*\/?>/gi, " ").replace(/\s+/g, " ").trim()) || u.baslik;
  const dosya = kaynak?.tur === "dosya";
  const demo = bitti && !u.sesUrl;
  const oynat = () => {
    if (!kaynak) return;
    if (calisiyor) sesCalici.duraklat(); else void sesCalici.cal(u.id, kaynak);
  };
  const ikon = "flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-white/8 hover:text-metin";

  return (
    <div className={cn("group relative rounded-2xl border p-3.5 transition-colors",
      secili ? "border-aksan/60 bg-aksan/[0.05]" : calisiyor ? "border-white/[0.12] bg-white/[0.045]" : "border-white/[0.06] bg-white/[0.025] hover:border-white/[0.1] hover:bg-white/[0.055]")}>
      {!kompakt && (
        <button onClick={onSecim} aria-label={secili ? "Seçimi kaldır" : "Seç"} aria-pressed={secili}
          className={cn("absolute -left-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-md border-2 bg-yuzey transition-all",
            secili ? "border-aksan bg-aksan text-zemin opacity-100" : "pointer-events-none border-white/50 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100")}>
          {secili && <Check className="h-3 w-3" strokeWidth={3.5} />}
        </button>
      )}
      <div className="flex items-start gap-3.5">
        {/* Küre + oynat */}
        <button onClick={oynat} disabled={!kaynak} aria-label={calisiyor ? "Duraklat" : "Dinle"}
          title={!bitti ? undefined : !kaynak ? "Çalınabilir ses yok" : undefined}
          className="relative shrink-0 rounded-full disabled:cursor-default">
          <SesAvatar ad={m?.ses ?? u.id} renk={renk} boyut={kompakt ? 44 : 52} aktif={calisiyor} />
          <span className={cn("absolute inset-0 flex items-center justify-center rounded-full transition-colors",
            !bitti ? "bg-black/55" : calisiyor ? "bg-black/25" : "bg-black/20 group-hover:bg-black/35")}>
            {bitti ? (
              kaynak && (calisiyor
                ? <Pause className="h-5 w-5 fill-white text-white" />
                : <Play className="ml-0.5 h-5 w-5 fill-white text-white" />)
            ) : hata ? <XCircle className="h-5 w-5 text-rose-300" /> : (
              <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${(Math.max(6, u.ilerleme) / 100) * 94.2} 94.2`} className="transition-[stroke-dasharray] duration-500" />
              </svg>
            )}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <button onClick={() => bitti && onAc()} disabled={!bitti} className="min-w-0 flex-1 text-left">
              <span className="line-clamp-1 text-[14.5px] font-semibold leading-snug text-metin">{baslik}</span>
              <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-metin-3">
                {m?.ses && <span className="font-medium text-metin-2">{m.ses}</span>}
                {m?.ses && <span aria-hidden>·</span>}
                <span>{MOD_AD[m?.mod ?? "seslendirme"]}</span>
                <span aria-hidden>·</span>
                <span>{u.model}</span>
                {m?.mod === "diyalog" && m.diyalog && <><span aria-hidden>·</span><span>{new Set(m.diyalog.map((s) => s.ses)).size} ses · {m.diyalog.length} satır</span></>}
                {m?.mod === "efekt" && <><span aria-hidden>·</span><span>{typeof m.efektSn === "number" ? `${String(m.efektSn).replace(".", ",")} sn` : "otomatik süre"}{m.dongu ? " · döngü" : ""}</span></>}
                {typeof m?.karakter === "number" && <><span aria-hidden>·</span><span className="tabular-nums">{m.karakter.toLocaleString("tr-TR")} karakter</span></>}
                
              </span>
            </button>
            {!kompakt && (
              <div className="flex shrink-0 items-center gap-0.5">
                {bitti && (
                  <>
                    <Tooltip label={u.favori ? "Beğeniyi kaldır" : "Beğen"}>
                      <button onClick={onBegen} aria-pressed={!!u.favori} aria-label={u.favori ? "Beğeniyi kaldır" : "Beğen"} className={cn(ikon, u.favori ? "text-rose-400" : "opacity-0 focus:opacity-100 group-hover:opacity-100")}>
                        <Heart className={cn("h-4 w-4", u.favori && "fill-current")} />
                      </button>
                    </Tooltip>
                    <Tooltip label="Bu ayarlarla üret">
                      <button onClick={onAyar} aria-label="Bu ayarlarla üret" className={cn(ikon, "opacity-0 focus:opacity-100 group-hover:opacity-100")}><Copy className="h-4 w-4" /></button>
                    </Tooltip>
                    <Tooltip label={u.sesUrl ? "İndir" : "Örnek çıktı indirilemez"}>
                      <button onClick={onIndir} disabled={!u.sesUrl} aria-label="İndir" className={cn(ikon, "opacity-0 focus:opacity-100 group-hover:opacity-100 disabled:text-metin-3/50 disabled:hover:bg-transparent")}><Download className="h-4 w-4" /></button>
                    </Tooltip>
                  </>
                )}
                <Tooltip label="Sil">
                  <button onClick={onSil} aria-label="Sil" className={cn(ikon, "opacity-0 hover:bg-rose-500/15 hover:text-rose-400 focus:opacity-100 group-hover:opacity-100")}><Trash2 className="h-4 w-4" /></button>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Dalga / durum */}
          {!kompakt && (
            <div className="mt-2.5">
              {bitti ? (
                <div className="flex items-center gap-3">
                  <Dalga url={u.sesUrl} tohum={u.id} n={96} oran={oran} sus={!dosya} className="h-9 flex-1"
                    onKonum={dosya && kaynak ? (o) => { if (benim) sesCalici.konum(o * cal.toplam); else void sesCalici.cal(u.id, kaynak).then(() => sesCalici.konum(o * sesCalici.durum().toplam)); } : undefined} />
                  <span className="w-10 shrink-0 text-right text-[12px] tabular-nums text-metin-3">
                    {dosya && benim && cal.toplam ? sureYaz(calisiyor ? cal.an : cal.toplam) : ""}
                  </span>
                </div>
              ) : hata ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12.5px] text-rose-300">Üretilemedi · kredi iade edildi</span>
                  <button onClick={onYenidenDene} className="flex items-center gap-1 rounded-full bg-aksan px-3 py-1 text-[12px] font-semibold text-[#03141c]"><RotateCcw className="h-3.5 w-3.5" /> Tekrar dene</button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-aksan transition-[width] duration-500" style={{ width: `${Math.max(6, u.ilerleme)}%` }} /></span>
                  <span className="shrink-0 text-[12px] tabular-nums text-metin-2">{u.durum === "kuyrukta" ? "Sırada" : `%${u.ilerleme}`}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
