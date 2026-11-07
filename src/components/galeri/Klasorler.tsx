"use client";

/**
 * Klasörler — gerçek klasör işlemleri: oluştur, yeniden adlandır, sil, üretimleri taşı (tek ya da
 * çoklu seçim) ve klasöre göre süz. Kaynak useKoleksiyon (hesap açıksa sunucuyla eşitlenir).
 */

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Folder, FolderInput, FolderMinus, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useKoleksiyon, uretimKlasoru } from "@/store/useKoleksiyon";
import { useProjeler } from "@/store/useProjeler";
import { toast } from "@/lib/toast";
import { cn, saltUrl } from "@/lib/utils";
import { Katman } from "./Katman";

/** Klasörün kapağı: içindeki ilk üretimin görseli. */
function useKlasorKapaklari() {
  const uretimler = useProjeler((s) => s.uretimler);
  const koleksiyonlar = useKoleksiyon((s) => s.koleksiyonlar);
  return useMemo(() => {
    const harita = new Map(uretimler.map((u) => [u.id, u]));
    return koleksiyonlar.map((k) => {
      const ogeler = k.uretimIdler.map((id) => harita.get(id)).filter(Boolean);
      const kapak = ogeler.map((u) => saltUrl(u!.gorselUrl) ?? saltUrl(u!.thumbnailUrl)).find(Boolean);
      return { ...k, adet: ogeler.length, kapak };
    });
  }, [uretimler, koleksiyonlar]);
}

function KlasorKapagi({ kapak, className }: { kapak?: string; className?: string }) {
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-white/[0.07] ring-1 ring-inset ring-white/[0.08]", className ?? "h-8 w-8")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {kapak ? <img src={kapak} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <Folder className="h-4 w-4 text-metin-2" />}
    </span>
  );
}

/** Ad girişi (yeni klasör ya da yeniden adlandırma). */
function AdGirisi({ ilk = "", eylem, onKaydet, onVazgec }: { ilk?: string; eylem: string; onKaydet: (ad: string) => void; onVazgec?: () => void }) {
  const [ad, setAd] = useState(ilk);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (ad.trim()) onKaydet(ad.trim()); }} className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <input autoFocus value={ad} onChange={(e) => setAd(e.target.value.slice(0, 60))} placeholder="Klasör adı" aria-label="Klasör adı"
        onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onVazgec?.(); } }}
        className="h-9 min-w-0 flex-1 rounded-[10px] bg-white/[0.06] px-3 text-[13.5px] text-metin outline-none ring-1 ring-inset ring-white/[0.1] placeholder:text-metin-2 focus:ring-white/35" />
      <AnimatePresence>
        {ad.trim() && (
          <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} type="submit"
            className="h-9 shrink-0 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#0d0e10] active:scale-95">{eylem}</motion.button>
        )}
      </AnimatePresence>
    </form>
  );
}

/** "Yeni klasör oluştur" düğmesi — popover'da ad sorar; seçili üretimler verilirse içine taşınır. */
export function YeniKlasorDugmesi({ uretimIdler, onOlustu, className, kisa }: { uretimIdler?: string[]; onOlustu?: (id: string) => void; className?: string; kisa?: boolean }) {
  const [acik, setAcik] = useState(false);
  const olustur = useKoleksiyon((s) => s.olustur);
  return (
    <div className="relative shrink-0">
      <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => setAcik((v) => !v)} aria-expanded={acik}
        className={cn("flex h-9 items-center gap-2 rounded-full bg-white/[0.06] px-3 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1]", className)}>
        <FolderPlus className="h-4 w-4" />{!kisa && <span className="max-sm:hidden">Yeni klasör oluştur</span>}
      </motion.button>
      <Katman acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sol" genislik={300} baslik="Yeni klasör" etiket="Yeni klasör oluştur">
        <div className="p-2">
          <p className="mb-2 hidden px-0.5 text-[12.5px] font-medium text-metin-2 sm:block">Yeni klasör</p>
          <AdGirisi eylem="Oluştur" onVazgec={() => setAcik(false)} onKaydet={(ad) => {
            const id = olustur(ad, uretimIdler ?? []);
            setAcik(false);
            toast.success("Klasör oluşturuldu", { description: uretimIdler?.length ? `${uretimIdler.length} üretim ${ad} klasörüne taşındı.` : `${ad} hazır. Kartların menüsünden içine taşıyabilirsin.` });
            onOlustu?.(id);
          }} />
        </div>
      </Katman>
    </div>
  );
}

/** Klasör süzgeci + yönetim: klasör seç, yeniden adlandır, sil. */
export function KlasorMenusu({ secili, onSec, className }: { secili: string | null; onSec: (id: string | null) => void; className?: string }) {
  const [acik, setAcik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null);
  const [silinecek, setSilinecek] = useState<string | null>(null);
  const [yeni, setYeni] = useState(false);
  const liste = useKlasorKapaklari();
  const { yenidenAdlandir, sil, olustur } = useKoleksiyon();
  const aktif = liste.find((k) => k.id === secili);
  return (
    <div className={cn("relative shrink-0", className)}>
      <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => setAcik((v) => !v)} aria-expanded={acik}
        className={cn("flex h-9 items-center gap-2 rounded-full pl-1.5 pr-3 text-[13px] font-medium ring-1 ring-inset transition-colors", aktif ? "bg-white text-[#0d0e10] ring-white" : "bg-white/[0.06] text-metin ring-white/[0.08] hover:bg-white/[0.1]")}>
        <KlasorKapagi kapak={aktif?.kapak} className="h-6 w-6 rounded-full" />
        <span className="max-w-[140px] truncate">{aktif?.ad ?? "Klasörler"}</span>
        {liste.length > 0 && !aktif && <span className="rounded-full bg-white/[0.1] px-1.5 text-[11.5px] tabular-nums text-metin-2">{liste.length}</span>}
        <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", acik && "rotate-180")} />
      </motion.button>
      <Katman acik={acik} onKapat={() => { setAcik(false); setDuzenlenen(null); setSilinecek(null); setYeni(false); }} yerlesim="alt-sol" genislik={320} baslik="Klasörler" etiket="Klasöre göre süz">
        <div className="max-h-[360px] space-y-0.5 overflow-y-auto p-1 [scrollbar-width:thin]">
          <button type="button" onClick={() => { onSec(null); setAcik(false); }} aria-pressed={!secili}
            className={cn("flex w-full items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-left text-[13.5px] transition-colors", !secili ? "bg-white/[0.08] text-metin ring-1 ring-inset ring-white/40" : "text-metin-2 hover:bg-white/[0.05] hover:text-metin")}>
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/[0.07]"><Folder className="h-4 w-4" /></span>
            <span className="flex-1">Bütün üretimler</span>
          </button>
          {liste.map((k) => (
            <div key={k.id} className="group/k relative">
              {duzenlenen === k.id ? (
                <div className="px-1 py-1"><AdGirisi ilk={k.ad} eylem="Kaydet" onVazgec={() => setDuzenlenen(null)} onKaydet={(ad) => { yenidenAdlandir(k.id, ad); setDuzenlenen(null); toast.success("Klasör adı değişti", { description: ad }); }} /></div>
              ) : silinecek === k.id ? (
                <div className="flex items-center gap-2 rounded-[12px] bg-tehlike/10 px-2 py-1.5 ring-1 ring-inset ring-tehlike/30">
                  <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-metin">{k.ad} silinsin mi? İçindeki üretimler kitaplıkta kalır.</span>
                  <button type="button" onClick={() => setSilinecek(null)} className="h-8 rounded-full px-2.5 text-[12.5px] text-metin-2 hover:text-metin">Vazgeç</button>
                  <button type="button" onClick={() => { sil(k.id); setSilinecek(null); if (secili === k.id) onSec(null); toast.success("Klasör silindi", { description: `${k.ad} kaldırıldı; üretimler duruyor.`, action: { label: "Geri al", onClick: () => useKoleksiyon.setState((s) => ({ koleksiyonlar: [k, ...s.koleksiyonlar] })) } }); }}
                    className="h-8 rounded-full bg-tehlike px-3 text-[12.5px] font-semibold text-white active:scale-95">Sil</button>
                </div>
              ) : (
                <>
                  <button type="button" onClick={() => { onSec(secili === k.id ? null : k.id); setAcik(false); }} aria-pressed={secili === k.id}
                    className={cn("flex w-full items-center gap-2.5 rounded-[12px] px-2 py-1.5 pr-[72px] text-left text-[13.5px] transition-colors", secili === k.id ? "bg-white/[0.08] text-metin ring-1 ring-inset ring-white/40" : "text-metin hover:bg-white/[0.05]")}>
                    <KlasorKapagi kapak={k.kapak} />
                    <span className="min-w-0 flex-1 truncate">{k.ad}</span>
                    <span className="text-[12px] tabular-nums text-metin-2 group-hover/k:opacity-0">{k.adet}</span>
                  </button>
                  <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/k:opacity-100 max-sm:opacity-100">
                    <Tooltip label="Yeniden adlandır" side="top"><button type="button" aria-label={`${k.ad} klasörünü yeniden adlandır`} onClick={() => setDuzenlenen(k.id)} className="flex h-7 w-7 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.1] hover:text-metin"><Pencil className="h-3.5 w-3.5" /></button></Tooltip>
                    <Tooltip label="Sil" side="top"><button type="button" aria-label={`${k.ad} klasörünü sil`} onClick={() => setSilinecek(k.id)} className="flex h-7 w-7 items-center justify-center rounded-full text-metin-2 hover:bg-tehlike/15 hover:text-tehlike"><Trash2 className="h-3.5 w-3.5" /></button></Tooltip>
                  </span>
                </>
              )}
            </div>
          ))}
          {!liste.length && <p className="px-2 py-2.5 text-[12.5px] leading-snug text-metin-2">Henüz klasör yok. Üretimlerini düzenlemek için bir klasör oluştur.</p>}
        </div>
        <div className="border-t border-white/[0.06] p-1.5">
          {yeni ? (
            <AdGirisi eylem="Oluştur" onVazgec={() => setYeni(false)} onKaydet={(ad) => { olustur(ad); setYeni(false); toast.success("Klasör oluşturuldu", { description: ad }); }} />
          ) : (
            <button type="button" onClick={() => setYeni(true)} className="flex w-full items-center gap-2.5 rounded-[12px] px-2 py-2 text-left text-[13.5px] font-medium text-metin transition-colors hover:bg-white/[0.05]">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/[0.07]"><FolderPlus className="h-4 w-4" /></span>Yeni klasör oluştur
            </button>
          )}
        </div>
      </Katman>
    </div>
  );
}

/** Taşıma listesi — kart menüsünde ve seçim çubuğunda. */
export function KlasoreTasiListesi({ uretimIdler, onBitti }: { uretimIdler: string[]; onBitti?: () => void }) {
  const liste = useKlasorKapaklari();
  const { tasi, olustur, koleksiyonlar } = useKoleksiyon();
  const [yeni, setYeni] = useState(false);
  const mevcut = uretimIdler.length === 1 ? uretimKlasoru(koleksiyonlar, uretimIdler[0])?.id : undefined;
  const herhangi = uretimIdler.some((id) => uretimKlasoru(koleksiyonlar, id));
  const n = uretimIdler.length;
  return (
    <div className="p-1">
      <div className="max-h-[300px] space-y-0.5 overflow-y-auto [scrollbar-width:thin]">
        {liste.map((k) => (
          <button key={k.id} type="button" onClick={() => { tasi(uretimIdler, k.id); toast.success(n > 1 ? `${n} üretim taşındı` : "Klasöre taşındı", { description: k.ad }); onBitti?.(); }}
            className={cn("flex w-full items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-left text-[13.5px] transition-colors", mevcut === k.id ? "bg-white/[0.08] text-metin ring-1 ring-inset ring-white/40" : "text-metin hover:bg-white/[0.06]")}>
            <KlasorKapagi kapak={k.kapak} />
            <span className="min-w-0 flex-1 truncate">{k.ad}</span>
            <span className="text-[12px] tabular-nums text-metin-2">{mevcut === k.id ? "Burada" : k.adet}</span>
          </button>
        ))}
        {!liste.length && !yeni && <p className="px-2 py-2 text-[12.5px] text-metin-2">Henüz klasör yok.</p>}
      </div>
      <div className="mt-1 space-y-0.5 border-t border-white/[0.06] pt-1">
        {yeni ? (
          <div className="p-1"><AdGirisi eylem="Oluştur" onVazgec={() => setYeni(false)} onKaydet={(ad) => { olustur(ad, uretimIdler); toast.success("Klasör oluşturuldu", { description: n > 1 ? `${n} üretim ${ad} klasörüne taşındı.` : `Üretim ${ad} klasörüne taşındı.` }); onBitti?.(); }} /></div>
        ) : (
          <button type="button" onClick={() => setYeni(true)} className="flex w-full items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-left text-[13.5px] font-medium text-metin hover:bg-white/[0.06]">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/[0.07]"><FolderPlus className="h-4 w-4" /></span>Yeni klasör oluştur
          </button>
        )}
        {herhangi && (
          <button type="button" onClick={() => { tasi(uretimIdler, null); toast.success(n > 1 ? `${n} üretim klasörden çıkarıldı` : "Klasörden çıkarıldı"); onBitti?.(); }}
            className="flex w-full items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-left text-[13.5px] text-metin-2 hover:bg-white/[0.06] hover:text-metin">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/[0.07]"><FolderMinus className="h-4 w-4" /></span>Klasörden çıkar
          </button>
        )}
      </div>
    </div>
  );
}

/** "Klasöre taşı" düğmesi (seçim çubuğu ve kart menüsü için). */
export function KlasoreTasiDugmesi({ uretimIdler, className, etiket = "Klasöre taşı", ikonlu = true, onBitti, yerlesim = "ust-orta", etiketSinif }: {
  uretimIdler: string[]; className?: string; etiket?: string; ikonlu?: boolean; onBitti?: () => void; etiketSinif?: string;
  yerlesim?: "ust-orta" | "alt-sol" | "alt-sag" | "ust-sol" | "ust-sag" | "sag-ust" | "sol-ust";
}) {
  const [acik, setAcik] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="relative">
      <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={(e) => { e.stopPropagation(); setAcik((v) => !v); }} aria-expanded={acik} disabled={!uretimIdler.length} title={etiket} aria-label={etiket}
        className={className ?? "flex h-9 items-center gap-2 rounded-full bg-white/[0.08] px-3 text-[13px] font-medium text-metin transition hover:bg-white/[0.13] disabled:opacity-40"}>
        {ikonlu && <FolderInput className="h-4 w-4" />}<span className={etiketSinif}>{etiket}</span>
      </motion.button>
      <Katman acik={acik} onKapat={() => setAcik(false)} yerlesim={yerlesim} genislik={300} baslik={etiket} etiket={etiket} z={520}>
        <KlasoreTasiListesi uretimIdler={uretimIdler} onBitti={() => { setAcik(false); onBitti?.(); }} />
      </Katman>
    </div>
  );
}

