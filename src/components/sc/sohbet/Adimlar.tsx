"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Check, ChevronDown, Code2, FileText, Globe, ImageIcon, LayoutTemplate, ListChecks, Loader2, Sparkles, TriangleAlert, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScTercih } from "@/store/useScTercih";
import type { AjanOlay } from "@/lib/scAjanOlay";
import type { ScKaynak } from "@/lib/scSohbet";
import { alanAdi, favikon } from "./Markdown";

const YAY = { type: "spring", stiffness: 420, damping: 34 } as const;
export const sureYaz = (ms: number) => { const sn = Math.max(1, Math.round(ms / 1000)); return sn < 60 ? `${sn} sn` : `${Math.floor(sn / 60)} dk ${sn % 60} sn`; };

/** Çalışırken saniyede bir artan süre. */
export function useSayac(basla: number, calisiyor: boolean) {
  const [, setT] = useState(0);
  useEffect(() => { if (!calisiyor) return; const i = setInterval(() => setT((x) => x + 1), 1000); return () => clearInterval(i); }, [calisiyor]);
  return Date.now() - basla;
}

/** Açılır gövde (yükseklik animasyonlu). */
function Govde({ acik, children }: { acik: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {acik && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }} className="overflow-hidden">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Son TAMAMLANMIŞ cümle → çalışırken başlıkta görünen kısa özet (yarım kelimeyle titremesin). */
const sonCumle = (t: string) => {
  const c = t.trim().split(/(?<=[.!?…])\s+/).filter(Boolean);
  if (c.length && !/[.!?…]["”']?$/.test(c[c.length - 1])) c.pop();
  const s = c[c.length - 1] ?? "";
  return s.length > 90 ? s.slice(0, 88).replace(/\s+\S*$/, "") + "…" : s;
};
/** Bitince başlık: düşüncenin ilk anlamlı cümlesi (Claude'un özet başlığı gibi). */
const ozetBaslik = (t: string) => {
  const c = t.trim().split(/(?<=[.!?…])\s+/).map((x) => x.trim()).filter((x) => x.length > 12 && !/^(istek|soru)\s*:/i.test(x));
  const s = (c[0] ?? "").replace(/[.…]+$/, "");
  return s.length > 72 ? s.slice(0, 70).replace(/\s+\S*$/, "") + "…" : s;
};

/** Hızlı değişen değeri en az `sure` ms ekranda tutar; arada gelenlerden yalnız sonuncusu gösterilir. */
function useAgirDegisen<T>(deger: T, sure: number) {
  const [gorunen, setGorunen] = useState(deger);
  const son = useRef(0);
  useEffect(() => {
    if (Object.is(deger, gorunen)) return; // aynı değer beklemeye sayılmaz (ilk yer tutucu dahil)
    const kalan = son.current + sure - Date.now();
    const t = setTimeout(() => { son.current = Date.now(); setGorunen(deger); }, Math.max(0, kalan));
    return () => clearTimeout(t);
  }, [deger, sure]); // eslint-disable-line react-hooks/exhaustive-deps
  return gorunen;
}

const KUTU = "my-2 overflow-hidden rounded-[14px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.08]";

/**
 * Düşünme kutusu — çalışırken başlık canlı değişir (son tamamlanan cümle, parıltılı) ve altında
 * düşüncenin akan son satırları küçük bir pencerede görünür. Bitince düşüncenin özet başlığına ve
 * süreye kapanır; açınca tüm düşünce okunur.
 */
export function DusunmeBlok({ metin, basla, bitis }: { metin: string; basla: number; bitis?: number }) {
  const calisiyor = !bitis;
  const gecen = useSayac(basla, calisiyor);
  const [acik, setAcik] = useState(() => !calisiyor && useScTercih.getState().dusunmeAcik);
  const pencere = useRef<HTMLDivElement>(null);
  const govde = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pencere.current) pencere.current.scrollTop = pencere.current.scrollHeight;
    if (calisiyor && acik && govde.current) govde.current.scrollTop = govde.current.scrollHeight;
  }, [metin, calisiyor, acik]);
  // Cümleler saniyede birkaç kez biter; başlık her birinde değişirse animasyon hiç oturmaz ve yazı sönük kalır.
  const akanBaslik = useAgirDegisen(sonCumle(metin) || "Düşünüyor", 1500);
  const baslik = calisiyor ? akanBaslik : ozetBaslik(metin) || "Düşündü";
  return (
    <div className={KUTU}>
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className="group flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left">
        <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center", calisiyor ? "text-[var(--sc-aksan)]" : "text-[var(--sc-metin-3)]")}>
          {calisiyor ? <motion.span animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.4, repeat: Infinity }}><Brain className="h-4 w-4" /></motion.span> : <Brain className="h-4 w-4" />}
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={baslik} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.14 }}
            className={cn("min-w-0 flex-1 truncate text-[14px] font-medium", calisiyor ? "sc-parilti" : "text-[var(--sc-metin-2)] transition-colors group-hover:text-[var(--sc-metin)]")}>
            {baslik}
          </motion.span>
        </AnimatePresence>
        <span className="shrink-0 text-[12.5px] tabular-nums text-[var(--sc-metin-3)]">{sureYaz(calisiyor ? gecen : bitis - basla)}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[var(--sc-metin-3)] transition-transform duration-200", acik && "rotate-180")} />
      </button>
      {/* Çalışırken: akan son satırlar */}
      <AnimatePresence initial={false}>
        {calisiyor && !acik && metin && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
            <div ref={pencere} className="max-h-[66px] overflow-hidden px-3.5 pb-3 pl-[44px] text-[13px] leading-[1.65] text-[var(--sc-metin-3)] [mask-image:linear-gradient(to_bottom,transparent,black_45%)]">
              <p className="whitespace-pre-wrap">{metin}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Govde acik={acik}>
        <div ref={govde} className="max-h-[340px] overflow-y-auto border-t border-white/[0.06] px-3.5 py-3 pl-[44px] text-[13.5px] leading-[1.7] text-[var(--sc-metin-2)] [scrollbar-width:thin]">
          <p className="whitespace-pre-wrap">{metin || "Düşünce özeti gelmedi."}</p>
        </div>
      </Govde>
    </div>
  );
}

/** Kaynak ikon yığını (en çok 4) + sayı. */
export function IkonYigini({ kaynaklar, max = 4 }: { kaynaklar: ScKaynak[]; max?: number }) {
  return (
    <span className="flex items-center">
      {kaynaklar.slice(0, max).map((k, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={k.url} src={favikon(k.url)} alt="" className={cn("h-[18px] w-[18px] rounded-full bg-white p-[2px] ring-2 ring-[#161618]", i > 0 && "-ml-1.5")} />
      ))}
    </span>
  );
}

/** Kod çalıştırma adımı: terminal görünümü — komut, çıktı, hata ve üretilen görseller (grafikler). */
export function KodAdim({ komut, kodTur, icerik, cikti, hata, cikisKodu, dosyalar, basla, bitis }: { komut: string; kodTur: "bash" | "dosya"; icerik?: string; cikti?: string; hata?: string; cikisKodu?: number; dosyalar?: string[]; basla: number; bitis?: number }) {
  const calisiyor = !bitis;
  const basarisiz = !!hata && (cikisKodu === undefined || cikisKodu !== 0);
  const [acik, setAcik] = useState(true);
  return (
    <div className={KUTU}>
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className="group flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13.5px]">
        <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center", calisiyor ? "text-[var(--sc-aksan)]" : basarisiz ? "text-amber-300" : "text-[var(--sc-metin-3)]")}>
          {calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : basarisiz ? <TriangleAlert className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
        </span>
        <span className={cn("min-w-0 flex-1 truncate font-medium", calisiyor ? "sc-parilti" : "text-[var(--sc-metin-2)] group-hover:text-[var(--sc-metin)]")}>
          {calisiyor ? (kodTur === "bash" ? "Kod çalıştırılıyor" : "Dosya hazırlanıyor") : basarisiz ? "Kod hata verdi" : kodTur === "bash" ? "Kod çalıştırıldı" : "Dosya yazıldı"}
        </span>
        {!calisiyor && <span className="shrink-0 text-[12.5px] tabular-nums text-[var(--sc-metin-3)]">{sureYaz(bitis - basla)}</span>}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[var(--sc-metin-3)] transition-transform", acik && "rotate-180")} />
      </button>
      {acik && (
        <div className="border-t border-white/[0.06] bg-[#0a0d12] px-3.5 py-3 sc-kod text-[12.5px] leading-[1.6]">
          {kodTur === "bash"
            ? <pre className="whitespace-pre-wrap break-words text-[#dfe6ee]"><span className="select-none text-[var(--sc-aksan)]">$ </span>{komut}</pre>
            : <><p className="text-[var(--sc-metin-3)]">{komut}</p>{icerik && <pre className="mt-1.5 max-h-56 overflow-auto whitespace-pre text-[#dfe6ee] [scrollbar-width:thin]">{icerik}</pre>}</>}
          {cikti && <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words border-t border-white/[0.06] pt-2 text-[var(--sc-metin-2)] [scrollbar-width:thin]">{cikti}</pre>}
          {hata && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-amber-200/90 [scrollbar-width:thin]">{hata}</pre>}
        </div>
      )}
      {!!dosyalar?.length && (
        <div className="flex flex-wrap gap-2 border-t border-white/[0.06] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {dosyalar.map((f) => <a key={f} href={`/api/sc/dosya/${f}`} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-[10px] bg-white ring-1 ring-white/10"><img src={`/api/sc/dosya/${f}`} alt="Kodun ürettiği dosya" className="max-h-72 max-w-full object-contain" onError={(e) => { (e.currentTarget.parentElement as HTMLElement).outerHTML = `<a href="/api/sc/dosya/${f}" class="text-[13px] text-[var(--sc-aksan)] underline">Üretilen dosyayı indir</a>`; }} /></a>)}
        </div>
      )}
    </div>
  );
}

/** Bağlayıcı (MCP) aracı adımı: "Notion · search çalışıyor" → "Notion · search kullanıldı". */
export function AracAdim({ ad, sunucu, basla, bitis, hata }: { ad: string; sunucu: string; basla: number; bitis?: number; hata?: boolean }) {
  const calisiyor = !bitis;
  return (
    <div className={cn(KUTU, "flex items-center gap-2.5 px-3.5 py-2.5 text-[13.5px]")}>
      <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center", hata ? "text-amber-300" : calisiyor ? "text-[var(--sc-aksan)]" : "text-[var(--sc-metin-3)]")}>
        {calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : hata ? <TriangleAlert className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1 truncate"><span className="font-medium text-[var(--sc-metin)]">{sunucu}</span><span className="text-[var(--sc-metin-3)]"> · </span><code className="sc-kod text-[12.5px] text-[var(--sc-metin-2)]">{ad}</code></span>
      <span className={cn("shrink-0 text-[12.5px]", calisiyor ? "sc-parilti font-medium" : hata ? "text-amber-200" : "text-[var(--sc-metin-3)]")}>{calisiyor ? "çalışıyor" : hata ? "hata verdi" : sureYaz(bitis - basla)}</span>
    </div>
  );
}

/** Web arama kutusu: "Web'de aranıyor · sorgu" → "sorgu · ikonlar · 8 sonuç" + açılır sonuç listesi. */
export function AramaAdim({ sorgu, sonuclar, basla, bitis, hata }: { sorgu: string; sonuclar?: ScKaynak[]; basla: number; bitis?: number; hata?: string }) {
  const [acik, setAcik] = useState(false);
  const calisiyor = !bitis;
  const acilir = !calisiyor && !!sonuclar?.length;
  return (
    <div className={KUTU}>
      <button onClick={() => acilir && setAcik((v) => !v)} aria-expanded={acilir ? acik : undefined} className={cn("group flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left", !acilir && "cursor-default")}>
        <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center", calisiyor ? "text-[var(--sc-aksan)]" : hata ? "text-amber-300" : "text-[var(--sc-metin-3)]")}>
          {calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : hata ? <TriangleAlert className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 text-[14px]">
          <span className={cn("shrink-0 font-medium", calisiyor ? "sc-parilti" : "text-[var(--sc-metin-2)] group-hover:text-[var(--sc-metin)]")}>{calisiyor ? "Web'de aranıyor" : "Web'de arandı"}</span>
          {sorgu && <span className="min-w-0 truncate rounded-full bg-white/[0.06] px-2 py-0.5 text-[12.5px] text-[var(--sc-metin-2)]">{sorgu}</span>}
        </span>
        {hata ? <span className="shrink-0 text-[12.5px] text-amber-200/90">Arama başarısız</span>
          : sonuclar?.length ? <><IkonYigini kaynaklar={sonuclar} /><span className="shrink-0 text-[12.5px] tabular-nums text-[var(--sc-metin-3)]">{sonuclar.length} sonuç</span></> : null}
        {acilir && <ChevronDown className={cn("h-4 w-4 shrink-0 text-[var(--sc-metin-3)] transition-transform duration-200", acik && "rotate-180")} />}
      </button>
      <Govde acik={acik}>
        <ul className="max-h-[320px] space-y-0.5 overflow-y-auto border-t border-white/[0.06] p-1.5 [scrollbar-width:thin]">
          {sonuclar?.map((k) => (
            <li key={k.url}>
              <a href={k.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 text-[13.5px] transition-colors hover:bg-white/[0.05]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={favikon(k.url)} alt="" className="h-4 w-4 shrink-0 rounded-sm" />
                <span className="min-w-0 flex-1 truncate text-[var(--sc-metin)]">{k.baslik}</span>
                {k.yas && <span className="shrink-0 text-[12px] text-[var(--sc-metin-3)]">{k.yas}</span>}
                <span className="shrink-0 text-[12px] text-[var(--sc-metin-3)]">{alanAdi(k.url)}</span>
              </a>
            </li>
          ))}
        </ul>
      </Govde>
    </div>
  );
}

/** Süren adımın etiketi şimdiki zamanla: "kuruldu" → "kuruluyor", "seçildi" → "seçiliyor". */
const surenHali = (e: string) => e.replace(/(l|n)(dı|di|du|dü)(?=\s|$)/u, (_, h: string, ek: string) => h + ({ dı: "ıyor", di: "iyor", du: "uyor", dü: "üyor" } as Record<string, string>)[ek]);

const OLAY_IKON: Record<string, typeof Brain> = { dusunme: Brain, arama: Globe, gezinme: Globe, dosyaOku: FileText, dosyaYaz: FileText, komut: Wrench, kod: Code2, artifact: Sparkles, model: LayoutTemplate, gorev: ListChecks, hata: TriangleAlert };

/** Tek ajan adımı satırı (alt adımlar, gövde ve diff açılır). */
function OlaySatiri({ o, son }: { o: AjanOlay; son: boolean }) {
  const [acik, setAcik] = useState(false);
  const I = o.tur === "artifact" && /görsel/i.test(o.etiket) ? ImageIcon : OLAY_IKON[o.tur] ?? Sparkles;
  const calisiyor = o.durum === "calisiyor";
  const acilir = !!(o.govde || o.cocuklar?.length);
  return (
    <li className="relative pl-7">
      {!son && <span className="absolute bottom-[-6px] left-[9px] top-[22px] w-px bg-white/[0.09]" />}
      <span className={cn("absolute left-0 top-[3px] flex h-[19px] w-[19px] items-center justify-center rounded-full", calisiyor ? "text-[var(--sc-aksan)]" : o.durum === "hata" ? "text-rose-300" : "bg-white/[0.06] text-[var(--sc-metin-2)]")}>
        {calisiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : o.durum === "bitti" ? <Check className="h-3 w-3" strokeWidth={2.6} /> : <I className="h-3 w-3" />}
      </span>
      <button onClick={() => acilir && setAcik((v) => !v)} aria-expanded={acilir ? acik : undefined} className={cn("group flex w-full items-center gap-2 py-0.5 text-left text-[14px]", !acilir && "cursor-default")}>
        <I className="h-3.5 w-3.5 shrink-0 text-[var(--sc-metin-3)]" />
        <span className={cn("truncate", calisiyor ? "sc-parilti font-medium" : "text-[var(--sc-metin-2)] group-hover:text-[var(--sc-metin)]")}>{calisiyor ? surenHali(o.etiket) : o.etiket}</span>
        {o.arg && <span className="truncate text-[12.5px] text-[var(--sc-metin-3)]">{o.arg}</span>}
        {o.diff?.ekle ? <span className="shrink-0 text-[12px] tabular-nums text-emerald-400">+{o.diff.ekle}</span> : null}
        <span className="flex-1" />
        {o.sureMs && !calisiyor ? <span className="shrink-0 text-[12px] tabular-nums text-[var(--sc-metin-3)]">{sureYaz(o.sureMs)}</span> : null}
        {acilir && <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-[var(--sc-metin-3)] transition-transform", acik && "rotate-180")} />}
      </button>
      <Govde acik={acik}>
        <div className="pb-1.5 pt-1">
          {o.govde && <p className="whitespace-pre-wrap rounded-[10px] bg-white/[0.03] px-3 py-2 text-[13px] leading-relaxed text-[var(--sc-metin-2)]">{o.govde}</p>}
          {o.cocuklar?.length ? (
            <ul className="mt-1 space-y-0.5">
              {o.cocuklar.map((c) => (
                <li key={c.id} className="flex items-center gap-2 py-0.5 text-[13px] text-[var(--sc-metin-2)]">
                  <Check className="h-3 w-3 text-[var(--sc-metin-3)]" />{c.etiket}
                  {c.arg && <span className="text-[12px] text-[var(--sc-metin-3)]">{c.arg}</span>}
                  {c.diff?.ekle ? <span className="text-[12px] tabular-nums text-emerald-400">+{c.diff.ekle}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Govde>
    </li>
  );
}

/**
 * Ajan planı — başlıkta adım sayacı, geçen süre ve ilerleme çubuğu; altında adım zaman çizelgesi.
 * Bitince "N adımda tamamlandı · 18 sn ⌄" satırına kapanır.
 */
export function AjanPlani({ olaylar, toplam, basla, bitis, baslik }: { olaylar: AjanOlay[]; toplam: number; basla: number; bitis?: number; baslik: string }) {
  const calisiyor = !bitis;
  const gecen = useSayac(basla, calisiyor);
  const [elle, setElle] = useState<boolean | null>(null);
  const acik = elle ?? calisiyor;
  const biten = olaylar.filter((o) => o.durum === "bitti").length;
  return (
    <div className="my-2 rounded-[14px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.08]">
      <button onClick={() => setElle(!acik)} aria-expanded={acik} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left">
        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", calisiyor ? "bg-[var(--sc-aksan)]/15 text-[var(--sc-aksan)]" : "bg-emerald-400/15 text-emerald-300")}>
          {calisiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" strokeWidth={2.6} />}
        </span>
        <span className={cn("min-w-0 flex-1 truncate text-[14px] font-medium", calisiyor ? "sc-parilti" : "text-[var(--sc-metin)]")}>{calisiyor ? baslik : `${toplam} adımda tamamlandı`}</span>
        <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[12px] tabular-nums text-[var(--sc-metin-2)]">{Math.min(biten + (calisiyor ? 1 : 0), toplam)}/{toplam}</span>
        <span className="shrink-0 text-[12.5px] tabular-nums text-[var(--sc-metin-3)]">{sureYaz(calisiyor ? gecen : bitis - basla)}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[var(--sc-metin-3)] transition-transform", acik && "rotate-180")} />
      </button>
      {calisiyor && (
        <div className="mx-3.5 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div className="h-full rounded-full bg-[var(--sc-aksan)]" animate={{ width: `${Math.max(6, (biten / toplam) * 100)}%` }} transition={YAY} />
        </div>
      )}
      <Govde acik={acik}>
        <ol className="space-y-1.5 px-3.5 pb-3 pt-2.5">
          {olaylar.map((o, i) => <OlaySatiri key={o.id} o={o} son={i === olaylar.length - 1} />)}
        </ol>
      </Govde>
    </div>
  );
}
