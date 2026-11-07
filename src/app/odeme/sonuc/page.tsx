"use client";

/**
 * Ödeme dönüşü: sağlayıcıdan dönünce burada sonuç gösterilir. Durum sunucudan okunur (bekliyorsa sağlayıcıdan yeniden
 * sorgulanır); ödendiyse bakiye, plan ve süreli haklar sunucuyla eşitlenir. Kredi tarayıcıda eklenmez.
 */
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, Loader2, ReceiptText, RotateCcw, X } from "lucide-react";
import { KrediJeton } from "@/components/ui/KrediHap";
import { paraYaz } from "@/lib/odeme/katalog";
import * as O from "@/lib/odeme/istemci";
import type { SiparisOzeti } from "@/lib/odeme/tipler";
import { SAGLAYICI_AD } from "@/lib/odeme/tipler";
import { useAuth, PLAN_ADI } from "@/store/useAuth";
import { cn } from "@/lib/utils";

const akis = [0.22, 1, 0.36, 1] as const;

export default function SonucSayfasi() {
  return <Suspense fallback={<Bos />}><Sonuc /></Suspense>;
}

function Bos() {
  return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;
}

function Sonuc() {
  const no = useSearchParams().get("s") ?? "";
  const esitlendi = useAuth((s) => s.esitlendi);
  const girisli = useAuth((s) => s.girisYapildi);
  const krediler = useAuth((s) => s.kullanici?.krediler ?? 0);
  const plan = useAuth((s) => s.kullanici?.plan);
  const [s, setS] = useState<SiparisOzeti | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const tazelendi = useRef(false);

  useEffect(() => {
    if (!no) { setHata("Sipariş numarası yok."); return; }
    if (!esitlendi) return;
    if (!girisli) { setHata("Sonucu görmek için giriş yap."); return; }
    let iptal = false, deneme = 0;
    const oku = async () => {
      const r = await O.siparisGetir(no);
      if (iptal) return;
      if (!r.ok) { setHata(r.hata); return; }
      setS(r.siparis);
      if (r.siparis.durum === "odendi" && !tazelendi.current) { tazelendi.current = true; void O.hesabiTazele(); }
      if (r.siparis.durum === "bekliyor" && deneme++ < 30) setTimeout(() => void oku(), deneme < 10 ? 2000 : 5000);
    };
    void oku();
    return () => { iptal = true; };
  }, [no, esitlendi, girisli]);

  const durum = s?.durum;
  const renk = durum === "odendi" ? "#34d399" : durum === "basarisiz" ? "#fb7185" : durum === "iade" ? "#9ca3af" : "#55d6fd";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--ust-nav))] w-full max-w-[560px] flex-col justify-center px-5 py-12">
      <AnimatePresence mode="wait">
        {!s && !hata ? <motion.div key="y" exit={{ opacity: 0 }}><Bos /></motion.div> : hata ? (
          <motion.div key="h" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] bg-[#121214] p-7 text-center ring-1 ring-inset ring-white/[0.08]">
            <p className="text-[18px] font-semibold text-white">Sonuç gösterilemedi</p>
            <p className="mt-2 text-[14px] text-white/55">{hata}</p>
            <Link href="/panel/ayarlar/faturalar" className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-black">Ödemelerime git<ArrowRight className="h-4 w-4" /></Link>
          </motion.div>
        ) : s && (
          <motion.div key={s.durum} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: akis }}
            className="overflow-hidden rounded-[28px] bg-[#121214] ring-1 ring-inset ring-white/[0.08]">
            <div className="relative px-7 pb-6 pt-9 text-center">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40" style={{ background: `radial-gradient(60% 100% at 50% 0%, ${renk}22, transparent)` }} />
              <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.1 }}
                className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ boxShadow: `inset 0 0 0 2px ${renk}`, color: renk }}>
                {durum === "bekliyor" ? <Clock className="h-7 w-7" /> : durum === "basarisiz" ? <X className="h-7 w-7" /> : durum === "iade" ? <RotateCcw className="h-7 w-7" /> : s.tur === "kredi" ? <KrediJeton boyut={28} /> : <ReceiptText className="h-7 w-7" />}
              </motion.span>
              <h1 className="relative mt-5 text-[26px] font-semibold tracking-[-0.025em] text-white">
                {durum === "odendi" ? "Ödemen alındı" : durum === "bekliyor" ? "Ödeme onayı bekleniyor" : durum === "iade" ? "Ödeme iade edildi" : "Ödeme tamamlanmadı"}
              </h1>
              <p className="relative mt-2 text-[14.5px] leading-relaxed text-white/60">
                {durum === "odendi"
                  ? s.tur === "kredi" ? `${(s.kredi ?? 0).toLocaleString("tr-TR")} kredi bakiyene eklendi. Yeni bakiyen ${krediler.toLocaleString("tr-TR")} kredi.`
                    : s.tur === "plan" ? `${PLAN_ADI[s.plan ?? plan ?? "baslangic"]} planın etkin. Aylık kredin yüklendi.`
                      : "Hak hesabına işlendi; hemen kullanabilirsin."
                  : durum === "bekliyor" ? "Sağlayıcıdan onay geldiğinde bu sayfa kendiliğinden güncellenir. Sekmeyi kapatsan da ödeme onaylanınca hesabına işlenir."
                    : durum === "iade" ? "Tutar ödeme yöntemine iade edildi."
                      : `${s.hata ?? "Ödeme alınamadı"}. Hesabından para çekilmedi, hiçbir şey değişmedi.`}
              </p>
              {durum === "bekliyor" && <Loader2 className="relative mx-auto mt-4 h-5 w-5 animate-spin text-[#55d6fd]" />}
            </div>
            <dl className="mx-5 mb-5 divide-y divide-white/[0.06] rounded-[18px] bg-white/[0.03] text-[13.5px]">
              {([
                ["Ürün", s.ad],
                ["Tutar", `${paraYaz(s.tahsil ?? s.toplam, s.para)}${s.taksit ? `, ${s.taksit} taksit` : ""}`],
                ["Ödeme", `${SAGLAYICI_AD[s.saglayici]}${s.mod === "test" && s.saglayici !== "deneme" ? ", test modu" : ""}${s.kart ? `, ${s.kart}` : ""}`],
                ...(s.makbuzNo ? [["Makbuz", s.makbuzNo]] : []),
                ["Sipariş", s.no],
              ] as [string, string][]).map(([e, d]) => (
                <div key={e} className="flex items-center justify-between gap-4 px-4 py-2.5"><dt className="text-white/45">{e}</dt><dd className={cn("min-w-0 truncate text-right text-white", e === "Sipariş" && "sc-kod text-[12.5px] text-white/60")}>{d}</dd></div>
              ))}
            </dl>
            {s.saglayici === "deneme" && <p className="mx-5 -mt-2 mb-5 rounded-[14px] bg-amber-400/[0.07] px-4 py-2.5 text-[12.5px] text-amber-100/80">Deneme ödemesi: kart kullanılmadı, para çekilmedi.</p>}
            <div className="flex flex-wrap justify-end gap-2 border-t border-white/[0.06] px-5 py-4">
              {s.makbuzNo && <Link href={`/odeme/makbuz/${s.no}`} className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium text-white/70 hover:bg-white/[0.06] hover:text-white">Makbuzu gör</Link>}
              {durum === "basarisiz" && <Link href={s.donus ?? "/panel/kredi"} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[14px] font-medium text-white ring-1 ring-inset ring-white/10 hover:bg-white/[0.13]">Yeniden dene</Link>}
              <Link href={durum === "odendi" ? (s.donus ?? "/panel") : "/panel"} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-black hover:opacity-90">
                {durum === "odendi" ? "Devam et" : "Panele dön"}<ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
