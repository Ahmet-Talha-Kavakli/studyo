"use client";

import { useState } from "react";
import { Check, Clock, Copy, Download, Eraser, FileText, Heart, Loader2, MoreHorizontal, Pause, Play, RefreshCw, RotateCcw, Trash2, X } from "lucide-react";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { cn } from "@/lib/utils";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { uretimSirasi } from "@/lib/uretimMotoru";
import { SESLER } from "@/lib/sesVeri";
import { sesCalici, useCalici, sureYaz } from "@/lib/sesCalici";
import { Yuzen } from "@/components/ui/Yuzen";
import { Ipucu } from "@/components/studyo/hf";
import { uretimKaynagi } from "./SesGoruntuleyici";
import { SesAvatar, goreliZaman, useUretimSuresi } from "./ortak";

const MOD_AD: Record<string, string> = { seslendirme: "Seslendirme", diyalog: "Diyalog", efekt: "Ses efekti", sesdegistir: "Ses değiştirme", ceviri: "Çeviri", temizle: "Temizleme", transkript: "Transkript" };

/** Okunan metin (ton etiketleri ve SSML duraklamaları ayıklanmış). */
export function sesBasligi(u: Uretim): string {
  const m = u.meta;
  if (m?.mod === "transkript") return (m.transkript ?? "").split(/\n+/)[0]?.trim() || u.baslik;
  if (m?.mod === "temizle") return "Temizlenmiş kayıt";
  if (m?.mod === "diyalog" || m?.mod === "efekt" || m?.mod === "sesdegistir" || m?.mod === "ceviri") return u.baslik;
  return ((m?.hamIstem as string | undefined) ?? "").replace(/\[[^\]\n]{1,40}\]\s*/gi, "").replace(/<break[^>]*\/?>/gi, " ").replace(/\s+/g, " ").trim() || u.baslik;
}

/**
 * Geçmiş satırı (ElevenLabs geçmiş paneli deseni, zengin kart): solda küre = oynat düğmesi, iki
 * satır metin, altında model/ses · süre · göreli zaman çipleri. Eylemler fareli cihazda üzerine
 * gelince, dokunmatikte her zaman görünür. Sürerken ilerleme + sıra + İptal; hatada neden + Tekrar dene.
 */
export function GecmisSatiri({ u, onAc, onBegen, onIndir, onAyar, onYenidenDene, onSil, onYenidenUret, onIptal, secimModu, secili, onSecim, grupEtiketi, ucretsizHak = 0 }: {
  u: Uretim; onAc: () => void; onBegen: () => void; onIndir: () => void; onAyar: () => void; onYenidenDene: () => void; onSil: () => void;
  onYenidenUret?: () => void; onIptal?: () => void; ucretsizHak?: number; secimModu?: boolean; secili?: boolean; onSecim?: () => void; grupEtiketi?: string;
}) {
  const cal = useCalici();
  const [menu, setMenu] = useState(false);
  const bitti = u.durum === "tamam";
  const hata = u.durum === "hata";
  const suruyor = u.durum === "kuyrukta" || u.durum === "isleniyor";
  const kaynak = bitti ? uretimKaynagi(u) : null;
  const benim = cal.id === u.id;
  const calisiyor = benim && cal.calisiyor;
  const m = u.meta;
  const renk = SESLER.find((s) => s.ad === m?.ses)?.renk ?? "#8b7bff";
  const oynat = () => { if (!kaynak) return; if (calisiyor) sesCalici.duraklat(); else void sesCalici.cal(u.id, kaynak); };
  const sure = useUretimSuresi(u, (sureSn) => { const g = useProjeler.getState().uretimler.find((x) => x.id === u.id); if (g) useProjeler.getState().guncelle(u.id, { meta: { ...g.meta, sureSn } }); });
  const sureEtiket = benim && cal.tur === "dosya" && cal.toplam ? sureYaz(cal.toplam) : sure.sn !== null ? `${sure.yaklasik ? "yaklaşık " : ""}${sure.yaklasik ? `${sure.sn} sn` : sureYaz(sure.sn)}` : null;
  const sira = suruyor ? uretimSirasi(u.id) : 0;
  const ilerleme = Math.max(0, Math.min(100, Math.round(u.ilerleme ?? 0)));
  const eylem = "bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-7 w-7 items-center justify-center rounded-full text-metin-2 hover:text-metin";
  // Fareli cihazda üzerine gelince; dokunmatikte her zaman görünür.
  const gizle = "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100";
  const cip = "flex shrink-0 items-center gap-1 text-[12px] tabular-nums text-metin-3";
  const ModIkon = m?.mod === "transkript" ? FileText : m?.mod === "temizle" ? Eraser : null;

  return (
    <div className={cn("bg-white/[0.045] ring-1 ring-inset ring-white/[0.07] group relative flex gap-3 rounded-xl p-2.5 transition-colors", secili ? "ring-1 ring-aksan" : benim ? "ring-1 ring-aksan/60" : "hover:bg-white/[0.065]")}>
      {secimModu && (
        <button onClick={onSecim} role="checkbox" aria-checked={!!secili} aria-label={secili ? "Seçimi kaldır" : "Seç"}
          className={cn("mt-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors", secili ? "border-aksan bg-aksan" : "border-white/25 hover:border-white/50")}>
          {secili && <Check className="h-3 w-3 text-zemin" strokeWidth={3.5} />}
        </button>
      )}
      <button onClick={oynat} disabled={!kaynak} aria-label={calisiyor ? "Duraklat" : "Dinle"} className="relative mt-0.5 h-10 w-10 shrink-0 rounded-full disabled:cursor-default">
        <SesAvatar ad={m?.ses ?? u.id} renk={renk} boyut={40} aktif={calisiyor} />
        <span className={cn("absolute inset-0 flex items-center justify-center rounded-full transition-opacity",
          suruyor || hata ? "bg-black/55" : calisiyor ? "bg-black/35" : cn("bg-black/35", kaynak ? "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100" : "opacity-0"))}>
          {suruyor ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            : hata ? <span className="h-2 w-2 rounded-full bg-rose-400" />
            : calisiyor ? <Pause className="h-3 w-3 fill-white text-white" />
            : ModIkon && !kaynak ? <ModIkon className="h-3.5 w-3.5 text-white" /> : <Play className="ml-0.5 h-3 w-3 fill-white text-white" />}
        </span>
      </button>
      <button onClick={() => (secimModu ? onSecim?.() : bitti && onAc())} disabled={!bitti && !secimModu} className="min-w-0 flex-1 text-left">
        <span className="line-clamp-2 text-[13.5px] leading-snug text-metin/85">{sesBasligi(u)}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          {grupEtiketi && <span className="rounded-full bg-aksan/15 px-1.5 py-px text-[11px] font-medium text-aksan">{grupEtiketi}</span>}
          {suruyor ? (
            <>
              <span className="flex items-center gap-1 text-[12px] font-medium tabular-nums text-aksan">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />{u.durum === "kuyrukta" ? (sira > 0 ? `Sırada · ${sira}.` : "Sırada") : `Üretiliyor · %${ilerleme}`}
              </span>
              {onIptal && (
                <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); onIptal(); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onIptal(); } }}
                  className="flex cursor-pointer items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[12px] font-medium text-metin-2 hover:bg-white/[0.075] hover:text-rose-300"><X className="h-2.5 w-2.5" />İptal</span>
              )}
            </>
          ) : hata ? (
            <span className="flex min-w-0 items-center gap-1">
              <span className="shrink-0 text-[12px] font-medium text-rose-300">{u.hata === "İptal edildi" ? "İptal edildi" : "Başarısız"}</span>
              <span className="text-[12px] text-metin-3">· {(u.kredi ?? 0) > 0 ? "kredi iade edildi" : "kredi düşmedi"}</span>
              {u.hata && u.hata !== "İptal edildi" && <Ipucu metin={u.hata} />}
            </span>
          ) : (
            <>
              <span className={cip}><ModelLogo ad={u.model} boyut={10} />{m?.ses ?? MOD_AD[m?.mod ?? "seslendirme"]}</span>
              {sureEtiket && <span className={cip}><Clock className="h-2.5 w-2.5" />{sureEtiket}</span>}
              <span className={cip} title={new Date(u.olusturma).toLocaleString("tr-TR")}>{goreliZaman(u.olusturma)}</span>
            </>
          )}
        </span>
        {hata && u.hata && u.hata !== "İptal edildi" && <span className="mt-1 line-clamp-1 text-[11.5px] text-rose-300/80">{u.hata}</span>}
        {suruyor && u.durum === "isleniyor" && (
          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/[0.08]"><span className="block h-full rounded-full bg-gradient-to-r from-aksan/50 to-aksan transition-[width] duration-500" style={{ width: `${Math.max(6, ilerleme)}%` }} /></span>
        )}
      </button>
      <div className={cn("flex shrink-0 items-center gap-1 self-center", !menu && !secimModu && gizle)}>
        {hata && (
          <button onClick={onYenidenDene} className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-medium text-metin"><RotateCcw className="h-3 w-3" />Tekrar dene</button>
        )}
        {bitti && (
          <button onClick={onBegen} aria-pressed={!!u.favori} aria-label={u.favori ? "Beğeniyi kaldır" : "Beğen"} className={cn(eylem, u.favori && "text-rose-300 hover:text-rose-300")}>
            <Heart className={cn("h-3.5 w-3.5", u.favori && "fill-current")} />
          </button>
        )}
        {bitti && u.sesUrl && <button onClick={onIndir} aria-label="İndir" className={eylem}><Download className="h-3.5 w-3.5" /></button>}
        <div className="relative">
          <button onClick={() => setMenu((v) => !v)} aria-label="Eylemler" aria-expanded={menu} className={eylem}><MoreHorizontal className="h-4 w-4" /></button>
          <Yuzen acik={menu} onKapat={() => setMenu(false)} yerlesim="alt-sag" bosluk={6} etiket="Eylemler" className="w-56 rounded-[16px] border border-white/[0.09] bg-[#1b1c1f] p-1.5">
            {hata && <Oge ikon={RotateCcw} ad="Tekrar dene" fn={() => { setMenu(false); onYenidenDene(); }} />}
            {bitti && onYenidenUret && <Oge ikon={RefreshCw} ad={ucretsizHak ? `Ücretsiz yeniden üret · ${ucretsizHak}` : "Yeniden üret"} fn={() => { setMenu(false); onYenidenUret(); }} />}
            {bitti && <Oge ikon={Copy} ad="Bu ayarlarla üret" fn={() => { setMenu(false); onAyar(); }} />}
            {bitti && u.sesUrl && <Oge ikon={Download} ad="İndir" fn={() => { setMenu(false); onIndir(); }} />}
            {suruyor && onIptal && <Oge ikon={X} ad="Üretimi iptal et" fn={() => { setMenu(false); onIptal(); }} />}
            <Oge ikon={Trash2} ad="Sil" tehlike fn={() => { setMenu(false); onSil(); }} />
          </Yuzen>
        </div>
      </div>
    </div>
  );
}

function Oge({ ikon: I, ad, fn, tehlike }: { ikon: typeof Play; ad: string; fn: () => void; tehlike?: boolean }) {
  return (
    <button onClick={fn} className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-[13px] transition-colors",
      tehlike ? "text-rose-300 hover:bg-rose-500/10" : "text-metin hover:bg-white/[0.075]")}>
      <I className={cn("h-4 w-4 shrink-0", tehlike ? "text-rose-300" : "text-metin-2")} />{ad}
    </button>
  );
}
