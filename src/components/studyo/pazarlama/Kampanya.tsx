"use client";


import { AnimatePresence, motion } from "framer-motion";
import { Download, Loader2, Package, Play, Plus, Trash2, TriangleAlert, Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Uretim } from "@/store/useProjeler";
import { Tooltip } from "@/components/ui/Tooltip";
import { GorunumAyari } from "@/components/galeri/GorunumAyari";
import { useAlanGenisligi, useGorunum } from "@/components/galeri/useGorunum";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { KartDahaMenusu } from "@/components/galeri/KartEylemleri";
import { kartOrani, sutunSayisi as gorunumSutun, type Gorunum } from "@/lib/galeri/gorunum";

/**
 * Kampanya ızgarası (K3): her kampanya bir kart — oynayan kapak, varyant sayısı, diğer varyantların
 * küçük kareleri, ürün satırı. Karta tıklayınca görüntüleyici açılır (varyant şeridi ve senaryo orada).
 */
export type KampanyaBilgi = { baslik: string; gorsel?: string; haplar: { ad: string; gorsel?: string }[]; zaman: string; senaryo: { ad: string; metin: string }[] };
const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
const surecteMi = (u: Uretim) => u.durum === "kuyrukta" || u.durum === "isleniyor";

export type KampanyaIslem = {
  onAc: (id: string) => void; onBegen: (id: string) => void; onIndir: (u: Uretim) => void;
  onTumunuIndir: () => void; onYeniden: () => void; onHepsiniSil: () => void;
};

export function KampanyaIzgarasi({ ks, bilgi, kare, islem, baslik, sag, toplam, onYeni }: {
  ks: Uretim[][]; bilgi: (l: Uretim[]) => KampanyaBilgi; kare: (l: Uretim[]) => string | undefined;
  islem: (l: Uretim[]) => KampanyaIslem; baslik: string; sag?: React.ReactNode; toplam?: number; onYeni?: () => void;
}) {
  const [g] = useGorunum("pazarlama");
  const [alanRef, alanEn] = useAlanGenisligi<HTMLDivElement>(1100);
  const enYeni = (l: Uretim[]) => Math.max(...l.map((x) => x.olusturma));
  const sirali = [...ks].sort((a, b) => (g.siralama === "eski" ? 1 : -1) * (enYeni(a) - enYeni(b)));
  return (
    <section className="overflow-hidden rounded-[26px] bg-[#141517] ring-1 ring-inset ring-white/[0.07]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3.5 max-sm:px-4">
        <h2 className="text-[15.5px] font-semibold text-metin">{baslik}</h2>
        <span className="rounded-full bg-white/[0.085] px-2 text-[12px] tabular-nums leading-5 text-metin-2">{toplam ?? ks.length}</span>
        <div className="ml-auto flex items-center gap-2">{sag}<GorunumAyari sayfa="pazarlama" istemVar={false} /></div>
      </div>
      <motion.div ref={alanRef} layout className="grid gap-3 p-4 max-sm:gap-2.5 max-sm:p-3" style={{ gridTemplateColumns: `repeat(${gorunumSutun(alanEn, g, { enCok: 8 })}, minmax(0, 1fr))` }}>
        <AnimatePresence initial={false}>
          {sirali.map((l) => <KampanyaKarti key={l[0].meta?.grupId ?? l[0].id} g={g} l={l} bilgi={bilgi(l)} kare={kare(l)} islem={islem(l)} />)}
        </AnimatePresence>
        {onYeni && (
          <motion.button layout onClick={onYeni} whileTap={{ scale: 0.98 }}
            className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-white/[0.12] p-5 text-center transition-colors hover:border-white/25 hover:bg-white/[0.035]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0a0a0b] transition-transform group-hover:scale-105"><Plus className="h-5 w-5" /></span>
            <span><span className="block text-[14px] font-semibold text-metin">Yeni kampanya</span><span className="mt-0.5 block text-[12.5px] leading-snug text-metin-3">Başka bir ürün ya da yeni bir kanca dene</span></span>
          </motion.button>
        )}
      </motion.div>
    </section>
  );
}

function KampanyaKarti({ l, bilgi, kare, islem, g }: { l: Uretim[]; bilgi: KampanyaBilgi; kare?: string; islem: KampanyaIslem; g: Gorunum }) {
  const hazirlar = l.filter((x) => x.durum === "tamam");
  const kapak = hazirlar[0] ?? l[0];
  const surecte = l.filter(surecteMi);
  const ilerleme = surecte.length ? Math.round(surecte.reduce((t, x) => t + x.ilerleme, 0) / surecte.length) : 0;
  const hepsiHata = l.every((x) => x.durum === "hata");
  const digerleri = l.filter((x) => x.id !== kapak.id);
  const favori = l.some((x) => x.favori);
  const acilir = kapak.durum === "tamam";
  const dugme = "flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/75";

  return (
    <motion.article layout initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={YAY}
      className="group min-w-0 rounded-[20px] bg-white/[0.03] p-1.5 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.055]">
      <div className="relative">
        <button onClick={() => acilir && islem.onAc(kapak.id)} disabled={!acilir} aria-label={`${bilgi.baslik} kampanyasını aç`}
          style={{ aspectRatio: String(kartOrani(g, 4 / 5)) }} className="relative block w-full overflow-hidden rounded-[15px] bg-black disabled:cursor-default">
          {kapak.durum === "tamam" ? (
            <>
              <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]" style={{ background: kapak.gorselUrl }} />
              {kapak.videoUrl && <video src={kapak.videoUrl} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
            </>
          ) : hepsiHata ? (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 text-center text-[12.5px] text-rose-300"><TriangleAlert className="h-5 w-5" />Üretilemedi, kredi iade edildi</span>
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {kare && <img src={kare} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-md" />}
              <motion.span animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <span className="relative text-[26px] font-semibold tabular-nums text-metin">yüzde {ilerleme}</span>
              <span className="relative text-[12px] text-metin-2">{kapak.durum === "kuyrukta" ? "Sırada" : "Hazırlanıyor"}</span>
            </span>
          )}
          {acilir && <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25 opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100" />}
          {acilir && (
            <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 scale-90 items-center justify-center rounded-full bg-white/90 text-black opacity-0 transition group-hover:scale-100 group-hover:opacity-100">
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            </span>
          )}
        </button>

        {/* Üst rozetler */}
        <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 transition-opacity group-hover:opacity-0 max-md:hidden text-[11.5px] font-semibold tabular-nums text-white backdrop-blur-md">{l.length} varyant</span>
        {surecte.length > 0 && acilir && (
          <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-white backdrop-blur-md"><Loader2 className="h-3 w-3 animate-spin" />yüzde {ilerleme}</span>
        )}
        {favori && !surecte.length && (
          <span className="pointer-events-none absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 backdrop-blur-md"><Star className="h-3 w-3 fill-aksan text-aksan" /></span>
        )}

        {/* Diğer varyantlar */}
        {digerleri.length > 0 && (
          <span className="absolute bottom-2 left-2 flex -space-x-2">
            {digerleri.slice(0, 3).map((x) => (
              <button key={x.id} onClick={() => x.durum === "tamam" && islem.onAc(x.id)} disabled={x.durum !== "tamam"} aria-label="Varyantı aç"
                className="relative h-11 w-8 overflow-hidden rounded-[7px] bg-white/[0.1] ring-2 ring-black/70 transition hover:-translate-y-0.5">
                {x.durum === "tamam" ? <span className="absolute inset-0" style={{ background: x.gorselUrl }} />
                  : surecteMi(x) ? <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-metin-2" />
                  : <TriangleAlert className="absolute inset-0 m-auto h-3 w-3 text-rose-300" />}
              </button>
            ))}
            {digerleri.length > 3 && <span className="relative flex h-11 w-8 items-center justify-center rounded-[7px] bg-black/70 text-[10.5px] font-semibold text-white ring-2 ring-black/70">+{digerleri.length - 3}</span>}
          </span>
        )}

        {/* Üzerine gelince eylemler */}
        <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
          <Tooltip label={kapak.favori ? "Favorilerden çıkar" : "Favorilere ekle"} side="bottom"><button onClick={() => islem.onBegen(kapak.id)} disabled={!acilir} aria-label={kapak.favori ? "Favorilerden çıkar" : "Favorilere ekle"}
            className={cn(dugme, kapak.favori && "text-aksan", "disabled:opacity-40")}><Star className={cn("h-3.5 w-3.5", kapak.favori && "fill-current")} /></button></Tooltip>
          {acilir && <IndirDugmesi u={kapak} side="bottom" className={dugme} ikonSinif="h-3.5 w-3.5" />}
          <Tooltip label="Yeniden kullan" side="bottom"><button onClick={islem.onYeniden} aria-label="Yeniden kullan" className={dugme}><Quote className="h-3.5 w-3.5" /></button></Tooltip>
          {acilir && <KartDahaMenusu u={kapak} side="bottom" className={dugme} boyut="kucuk" onSil={islem.onHepsiniSil}
            eylemler={[{ ad: "Aç", ikon: Play, fn: () => islem.onAc(kapak.id) }, ...(l.length > 1 && hazirlar.length ? [{ ad: "Tüm varyantları indir", ikon: Download, fn: islem.onTumunuIndir }] : [])]} />}
          {!acilir && <Tooltip label="Kampanyayı sil" side="bottom"><button onClick={islem.onHepsiniSil} aria-label="Kampanyayı sil" className={cn(dugme, "hover:text-rose-300")}><Trash2 className="h-3.5 w-3.5" /></button></Tooltip>}
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-1.5 pb-1 pt-2.5">
        <span className="h-8 w-8 shrink-0 overflow-hidden rounded-[9px] bg-white/[0.065] ring-1 ring-inset ring-white/[0.08]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {bilgi.gorsel ? <img src={bilgi.gorsel} alt="" className="h-full w-full object-cover" /> : <Package className="m-2 h-4 w-4 text-metin-2" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-metin" title={bilgi.baslik}>{bilgi.baslik}</span>
          <span className="block truncate text-[12px] text-metin-3">{bilgi.haplar[0]?.ad ? `${bilgi.haplar[0].ad} · ` : ""}{bilgi.zaman}</span>
        </span>
      </div>
    </motion.article>
  );
}
