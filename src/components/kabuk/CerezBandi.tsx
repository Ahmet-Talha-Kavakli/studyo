"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { useCerezOnay, kararGecerli, type CerezKarar } from "@/store/useCerezOnay";
import { cn } from "@/lib/utils";

export const CEREZ_KATEGORILERI: { id: keyof CerezKarar | "zorunlu"; ad: string; ozet: string }[] = [
  { id: "zorunlu", ad: "Zorunlu", ozet: "Oturumunu açık tutmak, güvenliği sağlamak ve tercihlerini (bu karar dâhil) hatırlamak için gereklidir. Kapatılamaz." },
  { id: "islevsel", ad: "İşlevsel", ozet: "Kenar çubuğu düzeni, son aramaların ve tanıtım ekranlarının gösterilip gösterilmediği gibi kolaylıkları hatırlar." },
  { id: "analitik", ad: "Analitik", ozet: "Hangi özelliklerin kullanıldığını anonim olarak ölçmemize yardımcı olur. Şu an analitik çerez kullanmıyoruz; eklenirse yalnız iznin varsa çalışır." },
  { id: "pazarlama", ad: "Pazarlama", ozet: "Reklam kampanyalarının etkisini ölçer. Şu an pazarlama çerezi kullanmıyoruz; eklenirse yalnız iznin varsa çalışır." },
];

/**
 * Çerez bandı + tercih paneli. Kök layout'ta bir kez çizilir.
 * Karar verilmemişse (ya da 12 ay geçmişse) alt köşede band çıkar.
 * "Reddet" ve "Kabul et" eşit ağırlıkta sunulur (GDPR / EDPB rehberi).
 */
export function CerezBandi() {
  const s = useCerezOnay();
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  // Başka sitelere gömülen oynatıcıda (iframe) bant gösterilmez.
  const gomulu = /^\/(p\/[^/]+\/embed|ajan\/[^/]+\/kutu)/.test(usePathname() ?? "");
  const gerekli = hazir && !gomulu && !kararGecerli(s);

  return (
    <>
      <AnimatePresence>
        {gerekli && !s.panelAcik && (
          <motion.div role="region" aria-label="Çerez tercihleri"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="vayra-mono fixed inset-x-3 bottom-[calc(72px+env(safe-area-inset-bottom))] z-[120] mx-auto max-w-[360px] rounded-[18px] border border-white/[0.1] bg-[#141416] p-4 sm:inset-x-auto sm:bottom-5 sm:left-5 print:hidden">
            <p className="flex items-center gap-2 text-[14.5px] font-semibold text-white"><Cookie className="h-4 w-4 text-vurgu" />Çerezler</p>
            <p className="mt-2 text-[13px] leading-relaxed text-metin-2">
              Vayra&apos;nın çalışması için zorunlu çerezler kullanırız. İşlevsel, analitik ve pazarlama çerezleri yalnız iznin olursa etkinleşir. <Link href="/cerezler" className="text-white underline underline-offset-4">Çerez Politikası</Link>
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={s.zorunlulariKabul} className="h-9 rounded-xl bg-white/[0.08] text-[13px] font-semibold text-white hover:bg-white/[0.13]">Reddet</button>
              <button onClick={s.hepsiniKabul} className="h-9 rounded-xl bg-white/[0.08] text-[13px] font-semibold text-white hover:bg-white/[0.13]">Kabul et</button>
            </div>
            <button onClick={s.panelAc} className="mt-2 w-full text-center text-[12.5px] font-medium text-metin-2 hover:text-white">Tercihleri yönet</button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{hazir && s.panelAcik && <TercihPaneli />}</AnimatePresence>
    </>
  );
}

function TercihPaneli() {
  const { karar, kaydet, panelKapat, hepsiniKabul } = useCerezOnay();
  const [secim, setSecim] = useState<CerezKarar>(karar ?? { islevsel: false, analitik: false, pazarlama: false });
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && panelKapat();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [panelKapat]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={panelKapat}
      className="perde vayra-mono fixed inset-0 z-[130] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Çerez tercihleri"
        className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-t-[24px] border border-white/[0.08] bg-[#141416] p-6 sm:rounded-[24px]">
        <div className="flex items-center justify-between">
          <h2 className="text-[19px] font-semibold text-white">Çerez tercihleri</h2>
          <button onClick={panelKapat} aria-label="Kapat" className="rounded-lg p-1.5 text-metin-3 hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-metin-2">Hangi kategorilere izin verdiğini seç. Kararını istediğin an <Link href="/cerezler" onClick={panelKapat} className="text-white underline underline-offset-4">Çerez Politikası</Link> sayfasından değiştirebilirsin.</p>
        <div className="mt-5 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.07]">
          {CEREZ_KATEGORILERI.map((k) => {
            const sabit = k.id === "zorunlu";
            const acik = sabit || secim[k.id as keyof CerezKarar];
            return (
              <div key={k.id} className="flex items-start justify-between gap-4 px-4 py-3.5">
                <span>
                  <span className="block text-[13.5px] font-medium text-white">{k.ad}</span>
                  <span className="block text-[12px] leading-snug text-metin-3">{k.ozet}</span>
                </span>
                <button role="switch" aria-checked={acik} aria-label={k.ad} disabled={sabit}
                  onClick={() => setSecim((x) => ({ ...x, [k.id]: !x[k.id as keyof CerezKarar] }))}
                  className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50", acik ? "bg-vurgu" : "bg-white/15")}>
                  <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", acik ? "left-[22px]" : "left-0.5")} />
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={() => kaydet(secim)} className="h-10 rounded-xl bg-white/[0.08] text-[13.5px] font-semibold text-white hover:bg-white/[0.13]">Seçimi kaydet</button>
          <button onClick={hepsiniKabul} className="h-10 rounded-xl bg-white text-[13.5px] font-semibold text-zemin hover:opacity-90">Tümüne izin ver</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Çerez Politikası sayfasında: tercih panelini açan buton + mevcut karar özeti. */
export function CerezTercihOzeti() {
  const s = useCerezOnay();
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  const gecerli = hazir && kararGecerli(s);
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-yuzey p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[14.5px] font-semibold text-white">Mevcut tercihin</p>
        <p className="mt-1 text-[13px] text-metin-2">
          {!hazir ? "…" : !gecerli ? "Henüz bir tercih yapmadın; yalnız zorunlu çerezler kullanılıyor."
            : <>Zorunlu{(["islevsel", "analitik", "pazarlama"] as const).filter((k) => s.karar?.[k]).map((k) => `, ${CEREZ_KATEGORILERI.find((x) => x.id === k)!.ad.toLocaleLowerCase("tr-TR")}`).join("")} · {new Date(s.tarih!).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</>}
        </p>
      </div>
      <button onClick={s.panelAc} className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-white px-4 text-[13.5px] font-semibold text-zemin hover:opacity-90">Tercihleri değiştir</button>
    </div>
  );
}
