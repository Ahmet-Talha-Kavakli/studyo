"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Maximize2, Pause, Play, RefreshCw, RotateCcw, Star, X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { KlasoreTasiDugmesi } from "@/components/galeri/Klasorler";
import { cn } from "@/lib/utils";
import type { Uretim } from "@/store/useProjeler";
import { uretimSirasi } from "@/lib/uretimMotoru";
import { sesCalici, useCalici, sureYaz } from "@/lib/sesCalici";
import { uretimKaynagi } from "./SesGoruntuleyici";
import { Dalga } from "./ortak";

/**
 * Son üretim şeridi (ElevenLabs deseni): editörün altında en yeni sonucun oynatıcısı. Birden çok
 * varyasyon varsa A/B/C/D cam sekmeleriyle aralarında geçilir. Sürerken gerçek ilerleme, sıra ve
 * İptal; bitince dalga formu + süre + yeniden üret/indir/beğen/aç; hatada nedeni yazar.
 */
export function SonSerit({ u, onAc, onBegen, onIndir, onKapat, onYenidenDene, mobil, grup, onSec, onYenidenUret, onIptal, ucretsizHak = 0 }: {
  u: Uretim; onAc: () => void; onBegen: () => void; onIndir: () => void; onKapat: () => void; onYenidenDene: () => void; mobil?: boolean;
  grup?: Uretim[]; onSec?: (id: string) => void; onYenidenUret?: () => void; onIptal?: () => void; ucretsizHak?: number;
}) {
  const cal = useCalici();
  const bitti = u.durum === "tamam";
  const suruyor = u.durum === "kuyrukta" || u.durum === "isleniyor";
  const kaynak = bitti ? uretimKaynagi(u) : null;
  const benim = cal.id === u.id;
  const calisiyor = benim && cal.calisiyor;
  const dosya = kaynak?.tur === "dosya";
  const oran = benim && cal.toplam ? Math.min(1, cal.an / cal.toplam) : 0;
  const oynat = () => { if (!kaynak) return; if (calisiyor) sesCalici.duraklat(); else void sesCalici.cal(u.id, kaynak); };
  const ikon = "bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2 hover:text-metin disabled:opacity-35";
  const sira = suruyor ? uretimSirasi(u.id) : 0;
  const ilerleme = Math.max(0, Math.min(100, Math.round(u.ilerleme ?? 0)));
  const transkript = u.meta?.mod === "transkript" ? (u.meta.transkript ?? "").replace(/\s+/g, " ").trim() : "";
  const toplamSn = benim && cal.toplam ? cal.toplam : typeof u.meta?.sureSn === "number" ? u.meta.sureSn : undefined;

  // Ekran okuyucu: üretim bitince "Ses hazır, N saniye".
  const [duyuru, setDuyuru] = useState("");
  const onceki = useRef(u.durum);
  useEffect(() => {
    if (onceki.current !== "tamam" && u.durum === "tamam") setDuyuru(`Ses hazır${typeof u.meta?.sureSn === "number" ? `, ${Math.round(u.meta.sureSn)} saniye` : ""}`);
    if (onceki.current !== "hata" && u.durum === "hata") setDuyuru("Üretim başarısız");
    onceki.current = u.durum;
  }, [u.durum, u.meta?.sureSn]);

  return (
    <div className={cn("bg-white/[0.045] ring-1 ring-inset ring-white/[0.07] rounded-2xl", mobil ? "mx-3 mt-2.5" : "mx-3 mb-1")} role="region" aria-label="Son üretim">
      <span className="sr-only" aria-live="polite">{duyuru}</span>
      {grup && grup.length > 1 && (
        <div role="tablist" aria-label="Varyasyonlar" className="flex items-center gap-1 px-2.5 pt-2">
          {grup.map((g, i) => {
            const a = g.id === u.id;
            const durumRenk = g.durum === "tamam" ? "bg-emerald-400" : g.durum === "hata" ? "bg-rose-400" : "animate-pulse bg-aksan";
            return (
              <button key={g.id} role="tab" aria-selected={a} onClick={() => onSec?.(g.id)}
                className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors", a ? "bg-white/[0.12] text-aksan" : "bg-white/[0.075] text-metin-2 hover:text-metin")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", durumRenk)} />{String.fromCharCode(65 + i)}
              </button>
            );
          })}
          <span className="ml-1 text-[11px] text-metin-3">{grup.length} varyasyon</span>
        </div>
      )}
      <div className={cn("flex h-16 items-center gap-3", mobil ? "px-2.5" : "px-3")}>
        <button onClick={oynat} disabled={!kaynak} aria-label={calisiyor ? "Duraklat" : "Dinle"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aksan text-zemin disabled:bg-white/10 disabled:text-metin-3 disabled:shadow-none">
          {suruyor ? <Loader2 className="h-4 w-4 animate-spin" /> : calisiyor ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
        </button>
        <div className="min-w-0 flex-1 overflow-hidden">
          {suruyor ? (
            <div>
              <p className="flex items-center gap-1.5 text-[13px] text-metin-2">
                {u.durum === "kuyrukta" ? (sira > 0 ? `Sırada · ${sira}. sıradasın` : "Sırada") : "Üretiliyor…"}
                {u.durum === "isleniyor" && <span className="bg-white/[0.075] rounded-full px-1.5 text-[10.5px] font-semibold tabular-nums text-aksan">yüzde {ilerleme}</span>}
              </p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.075]">
                {u.durum === "isleniyor" && ilerleme > 0
                  ? <span className="block h-full rounded-full bg-gradient-to-r from-aksan/50 to-aksan transition-[width] duration-500" style={{ width: `${Math.max(4, ilerleme)}%` }} />
                  : <span className="block h-full w-full animate-pulse rounded-full bg-aksan/50" />}
              </div>
            </div>
          ) : u.durum === "hata" ? (
            <p className="truncate text-[13px] text-rose-300">{u.hata === "İptal edildi" ? "İptal edildi" : u.hata ?? "Üretim başarısız"} · {(u.kredi ?? 0) > 0 ? "kredi iade edildi" : "kredi düşmedi"}</p>
          ) : transkript ? (
            <p className="flex items-center gap-2 text-[13px] text-metin-2"><FileText className="h-4 w-4 shrink-0 text-aksan" /><span className="line-clamp-2">{transkript.slice(0, 120)}{transkript.length > 120 ? "…" : ""}</span></p>
          ) : (
            <Dalga url={u.sesUrl} tohum={u.id} n={mobil ? 34 : 110} oran={oran} sus={!dosya} className="h-9 w-full" toplamSn={toplamSn}
              onKonum={dosya ? (o) => { if (benim) sesCalici.konum(o * cal.toplam); else if (kaynak) void sesCalici.cal(u.id, kaynak).then(() => sesCalici.konum(o * sesCalici.durum().toplam)); } : undefined} />
          )}
        </div>
        {bitti && dosya && benim && cal.toplam > 0 && <span className="bg-white/[0.075] hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] tabular-nums text-metin-2 sm:block">{sureYaz(cal.an)} / {sureYaz(cal.toplam)}</span>}
        {suruyor && onIptal && <button onClick={onIptal} className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[12.5px] text-metin hover:text-rose-300"><X className="h-3.5 w-3.5" /> İptal</button>}
        {u.durum === "hata" && <button onClick={onYenidenDene} className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-metin"><RotateCcw className="h-4 w-4" /> Tekrar dene</button>}
        {bitti && onYenidenUret && (
          <button onClick={onYenidenUret} aria-label={ucretsizHak ? `Ücretsiz yeniden üret, ${ucretsizHak} hak` : "Yeniden üret"} title={ucretsizHak ? `Ücretsiz yeniden üret · ${ucretsizHak} hak kaldı` : "Yeniden üret"} className={cn(ikon, "relative")}>
            <RefreshCw className="h-4 w-4" />
            {ucretsizHak > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-aksan px-1 text-[9.5px] font-bold tabular-nums text-zemin">{ucretsizHak}</span>}
          </button>
        )}
        {bitti && u.sesUrl && <IndirDugmesi u={u} side="top" yerlesim="ust-sag" className={ikon} />}
        {bitti && <KlasoreTasiDugmesi uretimIdler={[u.id]} etiketSinif="sr-only" yerlesim="ust-sag" className={ikon} />}
        {bitti && (
          <Tooltip label={u.favori ? "Favorilerden çıkar" : "Favorilere ekle"} side="top">
            <button onClick={onBegen} aria-pressed={!!u.favori} aria-label={u.favori ? "Favorilerden çıkar" : "Favorilere ekle"} className={cn(ikon, u.favori && "!text-aksan")}>
              <Star className={cn("h-4 w-4", u.favori && "fill-current")} />
            </button>
          </Tooltip>
        )}
        {bitti && !mobil && <button onClick={onAc} aria-label="Ayrıntıyı aç" title="Ayrıntıyı aç" className={ikon}><Maximize2 className="h-4 w-4" /></button>}
        <button onClick={onKapat} aria-label="Şeridi kapat" className={ikon}><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
