"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import { ArrowLeft, Search, Settings2, X } from "lucide-react";
import { useBildirim, type BildirimKategori } from "@/store/useBildirim";
import { CanliEtkinlik, KAYNAK, Kart } from "@/components/bildirim/BildirimMerkezi";
import { Tercihler, arsivleGeriAlinir, demetle, gunGrupla, useDakika } from "@/components/bildirim/BildirimSatiri";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * /panel/bildirimler — açılır panelle aynı iPhone Bildirim Merkezi dili, tam sayfa:
 * büyük başlık, kaynak seçici (iOS bölümlü denetim), canlı etkinlik, gün başlıkları altında
 * geniş kartlar (görseller kartın içinde), Arşiv görünümü ve tercihler çekmecesi.
 */
type Kaynak = "tumu" | BildirimKategori;
const SIRA: BildirimKategori[] = ["uretim", "hesap", "earn", "duyuru"];

export default function BildirimlerSayfasi() {
  return <Suspense><Sayfa /></Suspense>;
}

function Sayfa() {
  const router = useRouter();
  const params = useSearchParams();
  const bildirimler = useBildirim((s) => s.bildirimler);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  const arsiv = params.get("kutu") === "arsiv";
  const [kaynak, setKaynak] = useState<Kaynak>("tumu");
  const [ara, setAra] = useState("");
  const [araAcik, setAraAcik] = useState(false);
  const [tercih, setTercih] = useState(false);
  useDakika();

  // Sayfa açılınca görülen bildirimler okundu sayılır (iPhone gibi).
  useEffect(() => { if (hazir && !arsiv) { const t = setTimeout(() => useBildirim.getState().tumunuOku(), 1200); return () => clearTimeout(t); } }, [hazir, arsiv]);

  const kutu = useMemo(() => bildirimler.filter((b) => (arsiv ? b.arsiv : !b.arsiv)).sort((a, b) => b.zaman - a.zaman), [bildirimler, arsiv]);
  const kaynaklar = SIRA.filter((k) => kutu.some((b) => b.kategori === k));
  const ogeler = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr-TR");
    return demetle(kutu.filter((b) => (kaynak === "tumu" || b.kategori === kaynak) && (!q || `${b.baslik} ${b.mesaj}`.toLocaleLowerCase("tr-TR").includes(q))));
  }, [kutu, kaynak, ara]);
  useEffect(() => { if (kaynak !== "tumu" && !kaynaklar.includes(kaynak)) setKaynak("tumu"); }, [kaynak, kaynaklar]);

  const temizle = () => {
    if (arsiv) {
      const n = kutu.length;
      useBildirim.getState().arsiviBosalt();
      toast.success(`${n} bildirim kalıcı olarak silindi`);
    } else arsivleGeriAlinir(ogeler.flatMap((o) => o.uyeler.map((b) => b.id)));
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[calc(100vh-var(--ust-nav))] bg-[#0b0b0c]">
        <div className="mx-auto max-w-[680px] px-4 pb-20 pt-6 sm:pt-12">
          {/* Başlık */}
          <div className="flex items-center gap-2">
            {arsiv && (
              <Link href="/panel/bildirimler" aria-label="Bildirimlere dön" className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-[#55d6fd] transition-colors hover:bg-white/[0.06]">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            <h1 className="text-[30px] font-bold tracking-[-0.03em] text-white sm:text-[34px]">{arsiv ? "Arşiv" : "Bildirimler"}</h1>
            <span className="flex-1" />
            <button onClick={() => { setAraAcik((v) => !v); if (araAcik) setAra(""); }} aria-label="Ara" aria-pressed={araAcik}
              className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors active:scale-95", araAcik ? "bg-white/[0.16] text-white" : "bg-white/[0.08] text-white/85 hover:bg-white/[0.14]")}>
              {araAcik ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
            {hazir && ogeler.length > 0 && (
              <button onClick={temizle} className="flex h-8 items-center rounded-full bg-white/[0.08] px-3.5 text-[13px] font-semibold text-white/85 transition-colors hover:bg-white/[0.14] active:scale-95">
                {arsiv ? "Arşivi boşalt" : "Temizle"}
              </button>
            )}
            <button onClick={() => setTercih(true)} aria-label="Bildirim tercihleri"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white/85 transition-colors hover:bg-white/[0.14] active:scale-95">
              <Settings2 className="h-4 w-4" />
            </button>
          </div>

          {/* Arama */}
          <AnimatePresence initial={false}>
            {araAcik && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <label className="mt-4 flex h-10 items-center gap-2 rounded-[12px] bg-[#1c1c1f] px-3 text-white/45">
                  <Search className="h-4 w-4 shrink-0" />
                  <input autoFocus value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara" aria-label="Bildirimlerde ara"
                    className="w-full bg-transparent text-[15px] text-white placeholder:text-white/40 focus:outline-none" />
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Kaynak seçici (iOS bölümlü denetim) */}
          {hazir && kaynaklar.length > 1 && (
            <LayoutGroup id="bildirim-kaynak">
              <div role="tablist" aria-label="Kaynak" className="gizli-scroll mt-5 flex overflow-x-auto rounded-[10px] bg-[#1c1c1f] p-[3px]">
                {(["tumu", ...kaynaklar] as Kaynak[]).map((k) => (
                  <button key={k} role="tab" aria-selected={kaynak === k} onClick={() => setKaynak(k)}
                    className={cn("relative h-8 min-w-fit flex-1 rounded-[8px] px-3 text-[13px] font-semibold transition-colors", kaynak === k ? "text-white" : "text-white/55 hover:text-white/85")}>
                    {kaynak === k && <motion.span layoutId="kaynak-secim" className="absolute inset-0 rounded-[8px] bg-[#3a3a3e]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                    <span className="relative whitespace-nowrap">{k === "tumu" ? "Tümü" : KAYNAK[k]}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          )}

          {/* Canlı etkinlik */}
          {hazir && !arsiv && (kaynak === "tumu" || kaynak === "uretim") && <div className="mt-5 empty:hidden"><CanliEtkinlik onGit={() => {}} /></div>}

          {/* Liste */}
          {hazir && (ogeler.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center text-[15px] font-medium text-white/45">
              {ara ? `"${ara}" için sonuç yok` : arsiv ? "Arşiv boş" : "Bildirim yok"}
            </motion.p>
          ) : (
            gunGrupla(ogeler).map((g, gi) => (
              <section key={g.etiket} className="mt-7">
                <h2 className="mb-2.5 px-1 text-[17px] font-bold tracking-[-0.01em] text-white">{g.etiket}</h2>
                <div className="space-y-2.5">
                  <AnimatePresence initial={false}>
                    {g.oge.map((o, i) => (
                      <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(gi * 4 + i, 12) * 0.03 } }}
                        exit={{ opacity: 0, x: 80, transition: { duration: 0.22 } }}>
                        <Kart o={o} buyuk arsivde={arsiv} onGit={() => {}} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            ))
          ))}

          {hazir && !arsiv && (
            <Link href="/panel/bildirimler?kutu=arsiv" className="mx-auto mt-10 block w-fit rounded-full px-3.5 py-2 text-[13px] font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/85">
              Arşivi göster{bildirimler.some((b) => b.arsiv) ? ` · ${bildirimler.filter((b) => b.arsiv).length}` : ""}
            </Link>
          )}
          {hazir && arsiv && <p className="mt-10 text-center text-[12.5px] text-white/35">Arşivdekiler 30 gün sonra kendiliğinden silinir.</p>}
        </div>
      </div>

      {/* Tercihler çekmecesi */}
      {hazir && createPortal(
        <AnimatePresence>
          {tercih && <TercihCekmece onKapat={() => setTercih(false)} onGit={(h) => { setTercih(false); router.push(h); }} />}
        </AnimatePresence>, document.body)}
    </MotionConfig>
  );
}

function TercihCekmece({ onKapat, onGit }: { onKapat: () => void; onGit: (h: string) => void }) {
  useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); }; document.addEventListener("keydown", f); return () => document.removeEventListener("keydown", f); }, [onKapat]);
  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Bildirim tercihleri">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onKapat} className="perde absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 38 }}
        className="bd-panel relative w-full max-w-[440px] rounded-t-[28px] p-4 pb-6 sm:rounded-[28px]">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-[19px] font-bold tracking-[-0.02em] text-white">Bildirim tercihleri</p>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white/85 transition-colors hover:bg-white/[0.14]"><X className="h-4 w-4" /></button>
        </div>
        <Tercihler />
        <p className="mt-3 px-1 text-[12.5px] leading-relaxed text-white/45">Kapattığın türlerde yeni bildirim oluşmaz; mevcut bildirimlerin silinmez.</p>
        <button onClick={() => onGit("/panel/ayarlar/bildirimler")} className="mt-2 px-1 text-[13px] font-medium text-[#55d6fd] transition-opacity hover:opacity-80">Masaüstü bildirimi, ses ve diğer ayarlar</button>
      </motion.div>
    </div>
  );
}
